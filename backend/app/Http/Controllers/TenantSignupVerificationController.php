<?php

namespace App\Http\Controllers;

use App\Mail\TenantSignupVerificationMail;
use App\Models\TenantSignupVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TenantSignupVerificationController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);
        $email = Str::lower(trim($validated['email']));

        if (TenantSignupVerification::query()
            ->where('email', $email)
            ->where('created_at', '>', now()->subMinute())
            ->exists()) {
            return response()->json([
                'message' => 'Wait one minute before requesting another verification code.',
            ], 429);
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10);

        DB::transaction(function () use ($email, $otp, $expiresAt) {
            TenantSignupVerification::query()
                ->where('email', $email)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            TenantSignupVerification::create([
                'email' => $email,
                'otp_hash' => Hash::make($otp),
                'expires_at' => $expiresAt,
            ]);
        });

        Mail::to($email)->send(new TenantSignupVerificationMail(
            trim($validated['name'] ?? '') ?: 'there',
            $otp
        ));

        return response()->json([
            'message' => 'A verification code has been sent to your email address.',
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
        ]);
        $email = Str::lower(trim($validated['email']));

        $result = DB::transaction(function () use ($email, $validated) {
            $verification = TenantSignupVerification::query()
                ->where('email', $email)
                ->whereNull('consumed_at')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (
                !$verification ||
                $verification->expires_at->isPast() ||
                $verification->attempts >= 5
            ) {
                return ['error' => 'The verification code is invalid or expired.'];
            }

            $verification->increment('attempts');
            if (!Hash::check($validated['otp'], $verification->otp_hash)) {
                return ['error' => 'The verification code is invalid or expired.'];
            }

            $signupToken = Str::random(64);
            $verification->update([
                'verified_at' => $verification->verified_at ?? now(),
                'signup_token_hash' => hash('sha256', $signupToken),
            ]);

            return ['signup_token' => $signupToken];
        });

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], 422);
        }

        return response()->json(['signup_token' => $result['signup_token']]);
    }
}
