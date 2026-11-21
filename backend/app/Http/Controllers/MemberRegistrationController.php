<?php

namespace App\Http\Controllers;

use App\Mail\MemberSignupVerificationMail;
use App\Models\MemberSignupVerification;
use App\Models\Tenant;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MemberRegistrationController extends Controller
{
    public function sendVerificationCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_slug' => ['required', 'string', 'max:63'],
            'email' => ['required', 'email', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
        ]);
        $tenant = $this->activeTenant($validated['tenant_slug']);
        $email = Str::lower(trim($validated['email']));

        if (MemberSignupVerification::query()
            ->where('tenant_id', $tenant->id)
            ->where('email', $email)
            ->where('created_at', '>', now()->subMinute())
            ->exists()) {
            return response()->json([
                'message' => 'Wait one minute before requesting another verification code.',
            ], 429);
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10);

        DB::transaction(function () use ($tenant, $email, $otp, $expiresAt) {
            MemberSignupVerification::query()
                ->where('tenant_id', $tenant->id)
                ->where('email', $email)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            MemberSignupVerification::create([
                'tenant_id' => $tenant->id,
                'email' => $email,
                'otp_hash' => Hash::make($otp),
                'expires_at' => $expiresAt,
            ]);
        });

        Mail::to($email)->send(new MemberSignupVerificationMail(
            trim($validated['name']),
            $tenant->name,
            $otp
        ));

        return response()->json([
            'message' => 'A verification code has been sent to your email address.',
            'expires_at' => $expiresAt->toIso8601String(),
        ]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_slug' => ['required', 'string', 'max:63'],
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
        ]);
        $tenant = $this->activeTenant($validated['tenant_slug']);
        $email = Str::lower(trim($validated['email']));

        $result = DB::transaction(function () use ($tenant, $email, $validated) {
            $verification = MemberSignupVerification::query()
                ->where('tenant_id', $tenant->id)
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

    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);
        $base = $request->validate([
            'tenant_slug' => ['required', 'string', 'max:63'],
        ]);
        $tenant = $this->activeTenant($base['tenant_slug']);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'username')->where('tenant_id', $tenant->id),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->where('tenant_id', $tenant->id),
            ],
            'phone' => [
                'required',
                'string',
                'max:32',
                Rule::unique('users', 'phone')->where('tenant_id', $tenant->id),
            ],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
            'signup_token' => ['required', 'string', 'size:64', 'alpha_num'],
        ]);
        $signupToken = $validated['signup_token'];
        unset($validated['signup_token']);

        $registration = DB::transaction(function () use ($tenant, $validated, $signupToken) {
            app(TenantContext::class)->set($tenant);

            $verification = MemberSignupVerification::query()
                ->where('tenant_id', $tenant->id)
                ->where('email', $validated['email'])
                ->whereNotNull('verified_at')
                ->whereNull('consumed_at')
                ->where('expires_at', '>', now())
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (
                !$verification ||
                !$verification->signup_token_hash ||
                !hash_equals($verification->signup_token_hash, hash('sha256', $signupToken))
            ) {
                return false;
            }

            do {
                $tokenNo = random_int(111111, 999999);
            } while (User::query()->where('token_no', $tokenNo)->exists());

            User::create([
                'tenant_id' => $tenant->id,
                'token_no' => $tokenNo,
                'name' => trim($validated['name']),
                'username' => trim($validated['username']),
                'email' => $validated['email'],
                'phone' => trim($validated['phone']),
                'role' => 'user',
                'status' => 'inactive',
                'password' => Hash::make($validated['password']),
            ]);
            $verification->update(['consumed_at' => now()]);

            return true;
        });

        if (!$registration) {
            return response()->json([
                'message' => 'Verify this email address before requesting membership.',
            ], 422);
        }

        return response()->json([
            'message' => 'Signup request received. The canteen admin must approve your account before you can sign in.',
        ], 201);
    }

    private function activeTenant(string $slug): Tenant
    {
        return Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();
    }
}
