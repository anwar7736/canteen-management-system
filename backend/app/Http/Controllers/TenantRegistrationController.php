<?php

namespace App\Http\Controllers;

use App\Actions\CreateTenantWorkspace;
use App\Models\SubscriptionPlan;
use App\Models\TenantSignupVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantRegistrationController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_name' => ['required', 'string', 'max:255'],
            'tenant_slug' => ['required', 'string', 'min:3', 'max:63', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:tenants,slug'],
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:32'],
            'password' => ['required', 'string', 'min:12', 'max:255', 'confirmed'],
            'signup_token' => ['required', 'string', 'size:64', 'alpha_num'],
        ]);

        $validated['email'] = Str::lower(trim($validated['email']));
        $signupToken = $validated['signup_token'];
        unset($validated['signup_token']);

        $registration = DB::transaction(function () use ($validated, $signupToken) {
            $verification = TenantSignupVerification::query()
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
                return null;
            }

            $starterPlan = SubscriptionPlan::query()
                ->where('slug', 'starter')
                ->where('active', true)
                ->firstOrFail();

            $workspace = app(CreateTenantWorkspace::class)->handle($validated, $starterPlan, true);
            $verification->update(['consumed_at' => now()]);

            return $workspace;
        });

        if (!$registration) {
            return response()->json([
                'message' => 'Verify this email address before creating a workspace.',
            ], 422);
        }

        [$tenant, $owner, $plainToken] = $registration;

        return response()->json([
            'tenant' => [
                'id' => $tenant->getKey(),
                'name' => $tenant->name,
                'slug' => $tenant->slug,
            ],
            'user' => [
                'id' => $owner->getKey(),
                'name' => $owner->name,
                'username' => $owner->username,
                'email' => $owner->email,
                'phone' => $owner->phone,
                'role' => $owner->role,
            ],
            'api_token' => $plainToken,
        ], 201);
    }
}
