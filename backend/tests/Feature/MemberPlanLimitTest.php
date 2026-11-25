<?php

namespace Tests\Feature;

use App\Models\MemberSignupVerification;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MemberPlanLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_member_creation_uses_the_current_plan_limit_after_upgrade(): void
    {
        Mail::fake();
        [$tenant, , $premium] = $this->createTenantWithPlans();
        $admin = $this->createUser($tenant, 'admin', 'plan-limit-admin');
        $this->createUser($tenant, 'user', 'existing-plan-member');
        Sanctum::actingAs($admin, ['admin']);

        $payload = [
            'name' => 'New Plan Member',
            'username' => 'new-plan-member',
            'password' => 'member-password',
            'email' => 'new-plan-member@example.test',
            'phone' => '01700000002',
            'role' => 'user',
            'status' => 'active',
        ];

        $this->withHeader('X-Tenant-Slug', $tenant->slug)
            ->postJson('/api/add_member', $payload)
            ->assertStatus(422)
            ->assertJsonPath('message', 'The Starter plan allows up to 1 members. Upgrade your plan to add more.');

        $tenant->subscriptions()->latest('id')->firstOrFail()->update(['plan_id' => $premium->id]);

        $this->withHeader('X-Tenant-Slug', $tenant->slug)
            ->postJson('/api/add_member', $payload)
            ->assertOk();

        $this->assertDatabaseHas('users', [
            'tenant_id' => $tenant->id,
            'username' => 'new-plan-member',
            'role' => 'user',
        ]);
        $this->assertSame(2, User::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('role', 'user')
            ->count());
    }

    public function test_public_member_signup_uses_the_upgraded_plan_limit(): void
    {
        [$tenant, , $premium] = $this->createTenantWithPlans();
        $this->createUser($tenant, 'user', 'existing-signup-member');
        $signupToken = str_repeat('a', 64);
        MemberSignupVerification::create([
            'tenant_id' => $tenant->id,
            'email' => 'new-signup-member@example.test',
            'otp_hash' => Hash::make('123456'),
            'signup_token_hash' => hash('sha256', $signupToken),
            'attempts' => 1,
            'expires_at' => now()->addMinutes(10),
            'verified_at' => now(),
        ]);
        $payload = [
            'tenant_slug' => $tenant->slug,
            'name' => 'New Signup Member',
            'username' => 'new-signup-member',
            'email' => 'new-signup-member@example.test',
            'phone' => '01700000003',
            'password' => 'member-password',
            'password_confirmation' => 'member-password',
            'signup_token' => $signupToken,
        ];

        $this->postJson('/api/member/register', $payload)
            ->assertStatus(422)
            ->assertJsonPath('message', 'The Starter plan allows up to 1 members. Upgrade your plan to add more.');

        $tenant->subscriptions()->latest('id')->firstOrFail()->update(['plan_id' => $premium->id]);

        $this->postJson('/api/member/register', $payload)
            ->assertCreated();

        $this->assertDatabaseHas('users', [
            'tenant_id' => $tenant->id,
            'username' => 'new-signup-member',
            'role' => 'user',
        ]);
    }

    private function createTenantWithPlans(): array
    {
        $tenant = Tenant::create([
            'name' => 'Member Limit Canteen',
            'slug' => 'member-limit-canteen',
            'status' => 'active',
        ]);
        $starter = SubscriptionPlan::create([
            'name' => 'Starter',
            'slug' => 'starter-limit-test',
            'price' => 0,
            'currency' => 'BDT',
            'interval' => 'monthly',
            'max_members' => 1,
            'active' => true,
        ]);
        $premium = SubscriptionPlan::create([
            'name' => 'Premium',
            'slug' => 'premium-limit-test',
            'price' => 1000,
            'currency' => 'BDT',
            'interval' => 'monthly',
            'max_members' => 2,
            'active' => true,
        ]);
        TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $starter->id,
            'status' => 'active',
            'current_period_start' => now()->subDay(),
            'current_period_end' => now()->addMonth(),
        ]);

        return [$tenant, $starter, $premium];
    }

    private function createUser(Tenant $tenant, string $role, string $username): User
    {
        return User::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => $username,
            'username' => $username,
            'email' => $username.'@example.test',
            'phone' => '017'.str_pad((string) (abs(crc32($username)) % 100000000), 8, '0', STR_PAD_LEFT),
            'token_no' => random_int(111111, 999999),
            'role' => $role,
            'status' => 'active',
            'password' => Hash::make('test-password'),
        ]);
    }
}
