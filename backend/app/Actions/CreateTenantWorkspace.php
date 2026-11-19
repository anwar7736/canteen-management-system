<?php

namespace App\Actions;

use App\Models\AdminProfile;
use App\Models\MealRate;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateTenantWorkspace
{
    public function handle(array $attributes, SubscriptionPlan $plan, bool $issueApiToken = false): array
    {
        return DB::transaction(function () use ($attributes, $plan, $issueApiToken) {
            $tenant = Tenant::create([
                'name' => $attributes['tenant_name'],
                'slug' => Str::lower($attributes['tenant_slug']),
                'status' => 'active',
            ]);
            app(TenantContext::class)->set($tenant);

            $owner = User::create([
                'tenant_id' => $tenant->getKey(),
                'token_no' => $this->newTokenNumber(),
                'name' => $attributes['name'],
                'username' => $attributes['username'],
                'email' => $attributes['email'],
                'phone' => $attributes['phone'],
                'role' => 'admin',
                'status' => 'active',
                'password' => Hash::make($attributes['password']),
            ]);

            AdminProfile::create([
                'shop_name' => $tenant->name,
                'shop_address' => '',
                'shop_owner' => $owner->name,
                'username' => $owner->username,
                'owner_phone' => $owner->phone,
                'owner_email' => $owner->email,
            ]);

            MealRate::create([
                'lunch_expiry_time' => '11:00',
                'dinner_expiry_time' => '17:00',
                'lunch_rate' => 0,
                'lunch_rate_bangla' => '0',
                'dinner_rate' => 0,
                'dinner_rate_bangla' => '0',
                'total_rate' => 0,
            ]);

            $trialEndsAt = now()->addDays($plan->trial_days);
            TenantSubscription::create([
                'tenant_id' => $tenant->getKey(),
                'plan_id' => $plan->getKey(),
                'status' => $plan->trial_days > 0 ? 'trialing' : 'active',
                'starts_at' => now(),
                'current_period_start' => now(),
                'current_period_end' => $trialEndsAt,
                'trial_ends_at' => $plan->trial_days > 0 ? $trialEndsAt : null,
            ]);

            $plainToken = $issueApiToken
                ? $owner->createToken('tenant-owner', ['admin'])->plainTextToken
                : null;

            return [$tenant, $owner, $plainToken];
        });
    }

    private function newTokenNumber(): int
    {
        do {
            $tokenNumber = random_int(111111, 999999);
        } while (User::where('token_no', $tokenNumber)->exists());

        return $tokenNumber;
    }
}
