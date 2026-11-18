<?php

namespace App\Http\Controllers;

use App\Mail\PasswordUpdateMail;
use App\Mail\VerificationMail;
use App\Models\OTPModel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    public function EmailVerification(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);
        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            $otp = (string) random_int(100000, 999999);
            $expiresAt = now()->addMinutes(5);

            OTPModel::where('email', $user->email)->delete();
            OTPModel::create([
                'email' => $user->email,
                'otp' => Hash::make($otp),
                'time' => now()->format('H:i:s'),
                'date' => now()->toDateString(),
                'expires_at' => $expiresAt,
            ]);

            Mail::to($user->email)->send(new VerificationMail([
                'name' => $user->name,
                'otp' => $otp,
            ]));
        }

        return 1;
    }

    public function GetOTPExpiration(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);
        $otp = OTPModel::where('email', $validated['email'])
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        return $otp ? max(0, $otp->expires_at->getTimestamp() - now()->getTimestamp()) : -1;
    }

    public function OTPVerification(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
        ]);
        $otp = OTPModel::where('email', $validated['email'])
            ->whereNull('verified_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        if (!$otp || !Hash::check($validated['otp'], $otp->otp)) {
            return response()->json(['message' => 'The verification code is invalid or expired.'], 422);
        }

        $resetToken = Str::random(64);
        $otp->forceFill([
            'verified_at' => now(),
            'reset_token_hash' => hash('sha256', $resetToken),
        ])->save();

        return ['reset_token' => $resetToken];
    }

    public function ResetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'reset_token' => ['required', 'string', 'size:64'],
        ]);

        $otp = OTPModel::where('email', $validated['email'])
            ->where('reset_token_hash', hash('sha256', $validated['reset_token']))
            ->whereNotNull('verified_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        $user = $otp ? User::where('email', $validated['email'])->first() : null;
        if (!$otp || !$user) {
            return response()->json(['message' => 'The password reset request is invalid or expired.'], 422);
        }

        DB::transaction(function () use ($otp, $user, $validated) {
            $user->forceFill(['password' => Hash::make($validated['password'])])->save();
            $user->tokens()->delete();
            OTPModel::where('email', $user->email)->delete();
        });

        Mail::to($user->email)->send(new PasswordUpdateMail($user->name));

        return 1;
    }

    public function ChangePassword(Request $request)
    {
        $validated = $request->validate([
            'oldpass' => ['required', 'string', 'max:255'],
            'newpass' => ['required', 'string', 'min:8', 'max:255'],
        ]);
        $user = $request->user();

        if (!$user || !Hash::check($validated['oldpass'], $user->password)) {
            return response()->json(['message' => 'The current password is incorrect.'], 422);
        }

        $user->forceFill(['password' => Hash::make($validated['newpass'])])->save();
        $user->tokens()->delete();

        Mail::to($user->email)->send(new PasswordUpdateMail($user->name));

        return 1;
    }
}
