<?php

namespace Tests\Feature;

use App\Models\OTPModel;
use App\Models\MonthlyStatement;
use App\Models\MemberSignupVerification;
use App\Models\Tenant;
use App\Models\TenantSignupVerification;
use App\Models\TenantSubscription;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Http\Controllers\OrderMealController;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Mail\VerificationMail;
use App\Mail\TenantSignupVerificationMail;
use App\Mail\MemberSignupVerificationMail;
use Tests\TestCase;

class ApiAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_routes_require_a_valid_user_or_admin_token(): void
    {
        $this->getJson('/api/all_members')->assertUnauthorized();

        $user = $this->createUser('user');
        $token = $user->createToken('test', ['user'])->plainTextToken;

        $this->withToken($token)->getJson('/api/all_members')->assertForbidden();
    }

    public function test_user_login_issues_a_sanctum_token_and_cannot_access_admin_routes(): void
    {
        $user = $this->createUser('user');

        $response = $this->postJson('/api/login', [
            'username' => $user->username,
            'password' => 'correct-password',
        ])->assertOk()
            ->assertJsonPath('0', 'user')
            ->assertJsonPath('1.role', 'user');

        $token = $response->json('1.api_token');
        $this->assertIsString($token);

        $this->withToken($token)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('id', $user->id);

        $this->withToken($token)->getJson('/api/all_members')->assertForbidden();
        $this->postJson('/api/admin_login', [
            'username' => $user->username,
            'password' => 'correct-password',
        ])->assertOk()->assertSeeText('0');
    }

    public function test_login_tenant_options_only_return_workspaces_with_matching_credentials(): void
    {
        $tenants = collect([
            Tenant::create(['name' => 'First Login Canteen', 'slug' => 'first-login-canteen', 'status' => 'active']),
            Tenant::create(['name' => 'Second Login Canteen', 'slug' => 'second-login-canteen', 'status' => 'active']),
            Tenant::create(['name' => 'Wrong Password Canteen', 'slug' => 'wrong-password-canteen', 'status' => 'active']),
            Tenant::create(['name' => 'Inactive Member Canteen', 'slug' => 'inactive-member-canteen', 'status' => 'active']),
            Tenant::create(['name' => 'Suspended Login Canteen', 'slug' => 'suspended-login-canteen', 'status' => 'suspended']),
        ]);
        $createAccount = function (
            Tenant $tenant,
            string $role,
            string $username,
            string $email,
            string $password = 'correct-password',
            string $status = 'active'
        ): User {
            app(TenantContext::class)->set($tenant);

            return User::create([
                'name' => $username,
                'username' => $username,
                'email' => $email,
                'phone' => random_int(1000000000, 9999999999),
                'token_no' => random_int(111111, 999999),
                'role' => $role,
                'status' => $status,
                'password' => Hash::make($password),
            ]);
        };

        $createAccount($tenants[0], 'user', 'shared-member', 'member@example.test');
        $createAccount($tenants[1], 'user', 'shared-member', 'member@example.test');
        $createAccount($tenants[2], 'user', 'shared-member', 'member@example.test', 'different-password');
        $createAccount($tenants[3], 'user', 'shared-member', 'member@example.test', 'correct-password', 'inactive');
        $createAccount($tenants[4], 'user', 'shared-member', 'member@example.test');
        $createAccount($tenants[0], 'admin', 'shared-admin', 'admin@example.test');
        $createAccount($tenants[1], 'admin', 'shared-admin', 'admin@example.test');

        $this->withoutHeader('X-Tenant-Slug')
            ->postJson('/api/login/tenant-options', [
                'username' => 'member@example.test',
                'password' => 'correct-password',
                'role' => 'user',
            ])
            ->assertOk()
            ->assertJsonCount(2, 'tenants')
            ->assertJsonFragment(['name' => $tenants[0]->name, 'slug' => $tenants[0]->slug])
            ->assertJsonFragment(['name' => $tenants[1]->name, 'slug' => $tenants[1]->slug])
            ->assertJsonMissingPath('tenants.0.id');

        $this->postJson('/api/login/tenant-options', [
            'username' => 'member@example.test',
            'password' => 'wrong-password',
            'role' => 'user',
        ])->assertUnauthorized();

        $this->postJson('/api/login/tenant-options', [
            'username' => 'admin@example.test',
            'password' => 'correct-password',
            'role' => 'admin',
        ])
            ->assertOk()
            ->assertJsonCount(2, 'tenants')
            ->assertJsonFragment(['name' => $tenants[0]->name, 'slug' => $tenants[0]->slug])
            ->assertJsonFragment(['name' => $tenants[1]->name, 'slug' => $tenants[1]->slug]);

        $this->withHeader('X-Tenant-Slug', $tenants[0]->slug)
            ->postJson('/api/login', [
                'username' => 'member@example.test',
                'password' => 'correct-password',
            ])
            ->assertOk()
            ->assertJsonPath('1.role', 'user');

        $this->withHeader('X-Tenant-Slug', $tenants[1]->slug)
            ->postJson('/api/admin_login', [
                'username' => 'admin@example.test',
                'password' => 'correct-password',
            ])
            ->assertOk()
            ->assertJsonPath('role', 'admin');
    }

    public function test_user_tokens_cannot_read_another_users_profile(): void
    {
        $owner = $this->createUser('user');
        $otherUser = $this->createUser('user', 'other');
        $token = $owner->createToken('test', ['user'])->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/GetUserProfile/'.$otherUser->id)
            ->assertForbidden();
    }

    public function test_platform_admin_token_can_access_platform_routes_without_tenant_users(): void
    {
        $tenantUser = $this->createUser('user', 'tenant-member');
        app(TenantContext::class)->clear();
        $platformAdmin = User::create([
            'tenant_id' => null,
            'name' => 'Platform Admin',
            'username' => 'platform-admin',
            'email' => 'platform-admin@example.test',
            'phone' => '1000000000',
            'token_no' => 999999,
            'role' => 'platform_admin',
            'status' => 'active',
            'password' => Hash::make('correct-password'),
        ]);

        $login = $this->postJson('/api/platform/login', [
            'username' => $platformAdmin->username,
            'password' => 'correct-password',
        ])->assertOk()->assertJsonPath('role', 'platform_admin');

        $tenant = Tenant::findOrFail($tenantUser->tenant_id);
        $plan = SubscriptionPlan::create([
            'name' => 'Platform Test Plan',
            'slug' => 'platform-test-plan',
            'price' => 100,
            'currency' => 'BDT',
            'interval' => 'monthly',
            'trial_days' => 0,
            'active' => true,
        ]);
        $subscription = TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);
        SubscriptionPayment::create([
            'tenant_id' => $tenant->id,
            'subscription_id' => $subscription->id,
            'plan_id' => $plan->id,
            'amount' => 100,
            'currency' => 'BDT',
            'transaction_id' => 'PLATFORM-TEST-PAYMENT',
            'status' => 'Paid',
            'gateway' => 'sslcommerz',
        ]);

        app(TenantContext::class)->set($tenant);
        $this->withToken($login->json('api_token'))
            ->getJson('/api/platform/tenants')
            ->assertOk()
            ->assertJsonStructure(['data']);

        app(TenantContext::class)->set($tenant);
        $this->withToken($login->json('api_token'))
            ->getJson('/api/platform/payments')
            ->assertOk()
            ->assertJsonPath('data.0.transaction_id', 'PLATFORM-TEST-PAYMENT')
            ->assertJsonPath('data.0.tenant.name', $tenant->name)
            ->assertJsonPath('data.0.plan.name', $plan->name);

        $visibleUserIds = User::query()->pluck('id')->all();
        $this->assertContains($platformAdmin->id, $visibleUserIds);
        $this->assertNotContains($tenantUser->id, $visibleUserIds);
    }

    public function test_platform_admin_can_create_update_and_delete_tenant_users_and_workspaces(): void
    {
        $tenant = Tenant::query()->firstOrFail();
        app(TenantContext::class)->set($tenant);
        $this->createUser('user', 'tenant-count-check');
        $platformAdmin = $this->createPlatformAdmin();
        $token = $platformAdmin->createToken('platform-test', ['platform_admin'])->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/platform/tenants')
            ->assertOk()
            ->assertJsonPath('data.0.users_count', 1);

        $newPlan = SubscriptionPlan::create([
            'name' => 'Updated Tenant Plan',
            'slug' => 'updated-tenant-plan',
            'price' => 250,
            'currency' => 'BDT',
            'interval' => 'monthly',
            'trial_days' => 0,
            'active' => true,
        ]);
        $this->withToken($token)
            ->patchJson('/api/platform/tenants/'.$tenant->id, [
                'name' => 'Updated platform tenant',
                'slug' => 'updated-platform-tenant',
                'status' => 'suspended',
                'plan_id' => $newPlan->id,
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Updated platform tenant')
            ->assertJsonPath('status', 'suspended')
            ->assertJsonPath('subscriptions.0.plan_id', $newPlan->id);

        $createdUser = $this->withToken($token)
            ->postJson('/api/platform/tenants/'.$tenant->id.'/users', [
                'name' => 'Platform-created member',
                'username' => 'platform-created-member',
                'email' => 'platform-created-member@example.test',
                'phone' => '1200000001',
                'role' => 'user',
                'status' => 'active',
                'password' => 'very-secure-password',
                'password_confirmation' => 'very-secure-password',
            ])
            ->assertCreated()
            ->assertJsonPath('data.username', 'platform-created-member')
            ->assertJsonMissingPath('data.password')
            ->json('data');

        $this->withToken($token)
            ->patchJson('/api/platform/tenants/'.$tenant->id.'/users/'.$createdUser['id'], [
                'status' => 'inactive',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');

        Mail::fake();
        $this->withToken($token)
            ->postJson('/api/platform/tenants/'.$tenant->id.'/users/'.$createdUser['id'].'/password-reset')
            ->assertOk();
        Mail::assertSent(VerificationMail::class);

        $this->withToken($token)
            ->deleteJson('/api/platform/tenants/'.$tenant->id.'/users/'.$createdUser['id'])
            ->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $createdUser['id']]);

        $plan = SubscriptionPlan::query()->where('slug', 'starter')->firstOrFail();
        $createdWorkspace = $this->withToken($token)
            ->postJson('/api/platform/tenants', [
                'tenant_name' => 'Platform Created Canteen',
                'tenant_slug' => 'platform-created-canteen',
                'name' => 'Workspace owner',
                'username' => 'workspace-owner',
                'email' => 'workspace-owner@example.test',
                'phone' => '1200000002',
                'password' => 'very-secure-password',
                'password_confirmation' => 'very-secure-password',
                'plan_id' => $plan->id,
            ])
            ->assertCreated()
            ->json('tenant');

        $this->withToken($token)
            ->deleteJson('/api/platform/tenants/'.$createdWorkspace['id'])
            ->assertOk();
        $this->assertDatabaseMissing('tenants', ['id' => $createdWorkspace['id']]);
        $this->assertDatabaseMissing('users', ['tenant_id' => $createdWorkspace['id']]);
        $this->assertDatabaseMissing('admin_profile', ['tenant_id' => $createdWorkspace['id']]);
    }

    public function test_public_tenant_registration_still_creates_a_workspace_and_owner_token(): void
    {
        Mail::fake();
        $email = 'public-signup-owner@example.test';
        $this->postJson('/api/tenant/register/send-otp', [
            'email' => $email,
            'name' => 'Public Signup Owner',
        ])->assertOk();

        $otp = null;
        Mail::assertSent(TenantSignupVerificationMail::class, function (TenantSignupVerificationMail $mail) use (&$otp, $email) {
            $otp = $mail->otp;

            return $mail->hasTo($email);
        });
        $this->assertIsString($otp);

        $this->postJson('/api/tenant/register/verify-otp', [
            'email' => $email,
            'otp' => '000000',
        ])->assertUnprocessable();

        $signupToken = $this->postJson('/api/tenant/register/verify-otp', [
            'email' => $email,
            'otp' => $otp,
        ])->assertOk()->json('signup_token');

        $response = $this->postJson('/api/tenant/register', [
            'tenant_name' => 'Public Signup Canteen',
            'tenant_slug' => 'public-signup-canteen',
            'name' => 'Public Signup Owner',
            'username' => 'public-signup-owner',
            'email' => $email,
            'phone' => '1200000003',
            'password' => 'very-secure-password',
            'password_confirmation' => 'very-secure-password',
            'signup_token' => $signupToken,
        ])->assertCreated()
            ->assertJsonPath('tenant.slug', 'public-signup-canteen')
            ->assertJsonPath('user.role', 'admin');

        $tenantId = $response->json('tenant.id');
        $this->assertIsString($response->json('api_token'));
        $this->assertDatabaseHas('users', [
            'tenant_id' => $tenantId,
            'username' => 'public-signup-owner',
            'role' => 'admin',
        ]);
        $this->assertDatabaseHas('admin_profile', ['tenant_id' => $tenantId]);
        $this->assertDatabaseHas('meal_rates', ['tenant_id' => $tenantId]);
        $this->assertDatabaseHas('tenant_subscriptions', ['tenant_id' => $tenantId]);
        $this->assertNotNull(TenantSignupVerification::where('email', $email)->value('consumed_at'));

        $this->postJson('/api/tenant/register', [
            'tenant_name' => 'Another Signup Canteen',
            'tenant_slug' => 'another-signup-canteen',
            'name' => 'Another Signup Owner',
            'username' => 'another-signup-owner',
            'email' => $email,
            'phone' => '1200000004',
            'password' => 'very-secure-password',
            'password_confirmation' => 'very-secure-password',
            'signup_token' => $signupToken,
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Verify this email address before creating a workspace.');
    }

    public function test_tenant_signup_otp_allows_only_five_incorrect_attempts(): void
    {
        Mail::fake();
        $email = 'signup-otp-limit@example.test';
        $this->postJson('/api/tenant/register/send-otp', ['email' => $email])->assertOk();

        $otp = null;
        Mail::assertSent(TenantSignupVerificationMail::class, function (TenantSignupVerificationMail $mail) use (&$otp) {
            $otp = $mail->otp;

            return true;
        });

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/tenant/register/verify-otp', [
                'email' => $email,
                'otp' => $otp === '000000' ? '000001' : '000000',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/tenant/register/verify-otp', [
            'email' => $email,
            'otp' => $otp,
        ])->assertUnprocessable();
        $this->assertDatabaseHas('tenant_signup_verifications', [
            'email' => $email,
            'attempts' => 5,
            'verified_at' => null,
        ]);
    }

    public function test_tenant_signup_otp_can_be_resent_and_verification_retried(): void
    {
        Mail::fake();
        $email = 'signup-otp-resend@example.test';
        $this->postJson('/api/tenant/register/send-otp', ['email' => $email])->assertOk();
        $firstVerification = TenantSignupVerification::where('email', $email)->firstOrFail();

        $this->travel(61)->seconds();
        $this->postJson('/api/tenant/register/resend-otp', ['email' => $email])->assertOk();

        $this->assertNotNull($firstVerification->fresh()->consumed_at);
        $codes = [];
        Mail::assertSent(TenantSignupVerificationMail::class, function (TenantSignupVerificationMail $mail) use (&$codes, $email) {
            if ($mail->hasTo($email)) {
                $codes[] = $mail->otp;
            }

            return $mail->hasTo($email);
        });
        $this->assertCount(2, $codes);

        $firstToken = $this->postJson('/api/tenant/register/verify-otp', [
            'email' => $email,
            'otp' => $codes[1],
        ])->assertOk()->json('signup_token');

        $retryToken = $this->postJson('/api/tenant/register/verify-otp', [
            'email' => $email,
            'otp' => $codes[1],
        ])->assertOk()->json('signup_token');

        $this->assertNotSame($firstToken, $retryToken);
        $this->assertSame(
            hash('sha256', $retryToken),
            TenantSignupVerification::where('email', $email)->latest('id')->value('signup_token_hash')
        );
    }

    public function test_public_tenant_list_only_returns_active_tenants_without_a_tenant_header(): void
    {
        $existingTenant = Tenant::query()->firstOrFail();
        $existingTenant->update(['name' => 'Beta Canteen', 'status' => 'active']);
        DB::table('admin_profile')->updateOrInsert(
            ['tenant_id' => $existingTenant->id],
            [
                'shop_name' => $existingTenant->name,
                'shop_address' => 'Mirpur, Dhaka',
                'shop_owner' => 'Beta Owner',
                'username' => 'beta-owner',
                'owner_phone' => '1200000021',
                'owner_email' => 'beta-owner@example.test',
            ]
        );
        Tenant::create([
            'name' => 'Alpha Canteen',
            'slug' => 'alpha-canteen',
            'status' => 'active',
        ]);
        Tenant::create([
            'name' => 'Suspended Canteen',
            'slug' => 'suspended-canteen',
            'status' => 'suspended',
        ]);

        $this->withoutHeader('X-Tenant-Slug')
            ->getJson('/api/public/tenants')
            ->assertOk()
            ->assertJsonCount(2, 'tenants')
            ->assertJsonPath('tenants.0.slug', 'alpha-canteen')
            ->assertJsonPath('tenants.1.slug', $existingTenant->slug)
            ->assertJsonPath('tenants.1.location', 'Mirpur, Dhaka')
            ->assertJsonMissing(['name' => 'Suspended Canteen']);
    }

    public function test_member_signup_verifies_email_and_creates_an_inactive_member_for_admin_approval(): void
    {
        Mail::fake();
        $tenant = Tenant::query()->firstOrFail();
        $email = 'member-self-signup@example.test';
        $this->withoutHeader('X-Tenant-Slug')
            ->postJson('/api/member/register/send-otp', [
                'tenant_slug' => $tenant->slug,
                'email' => $email,
                'name' => 'Self Signup Member',
            ])
            ->assertOk();

        $otp = null;
        Mail::assertSent(MemberSignupVerificationMail::class, function (MemberSignupVerificationMail $mail) use (&$otp, $email, $tenant) {
            $otp = $mail->otp;

            return $mail->hasTo($email) && $mail->canteenName === $tenant->name;
        });
        $this->assertIsString($otp);

        $this->postJson('/api/member/register/verify-otp', [
            'tenant_slug' => $tenant->slug,
            'email' => $email,
            'otp' => $otp === '000000' ? '000001' : '000000',
        ])->assertUnprocessable();

        $signupToken = $this->postJson('/api/member/register/verify-otp', [
            'tenant_slug' => $tenant->slug,
            'email' => $email,
            'otp' => $otp,
        ])->assertOk()->json('signup_token');

        $this->postJson('/api/member/register', [
            'tenant_slug' => $tenant->slug,
            'name' => 'Self Signup Member',
            'username' => 'self-signup-member',
            'email' => $email,
            'phone' => '1900000011',
            'password' => 'member-signup-password',
            'password_confirmation' => 'member-signup-password',
            'signup_token' => $signupToken,
        ])->assertCreated()
            ->assertJsonPath('message', 'Signup request received. The canteen admin must approve your account before you can sign in.');

        $this->assertDatabaseHas('users', [
            'tenant_id' => $tenant->id,
            'username' => 'self-signup-member',
            'email' => $email,
            'role' => 'user',
            'status' => 'inactive',
        ]);
        $this->assertNotNull(MemberSignupVerification::where('tenant_id', $tenant->id)
            ->where('email', $email)
            ->value('consumed_at'));

        $this->postJson('/api/member/register', [
            'tenant_slug' => $tenant->slug,
            'name' => 'Self Signup Member',
            'username' => 'another-self-signup-member',
            'email' => 'replayed-member-signup@example.test',
            'phone' => '1900000012',
            'password' => 'member-signup-password',
            'password_confirmation' => 'member-signup-password',
            'signup_token' => $signupToken,
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Verify this email address before requesting membership.');
    }

    public function test_member_signup_rejects_suspended_canteens(): void
    {
        $tenant = Tenant::query()->firstOrFail();
        $tenant->update(['status' => 'suspended']);

        $this->withoutHeader('X-Tenant-Slug')
            ->postJson('/api/member/register/send-otp', [
                'tenant_slug' => $tenant->slug,
                'email' => 'suspended-member@example.test',
                'name' => 'Suspended Member',
            ])
            ->assertNotFound();
    }

    public function test_platform_impersonation_is_audited_expires_and_can_be_ended_by_target(): void
    {
        $tenant = Tenant::query()->firstOrFail();
        app(TenantContext::class)->set($tenant);
        $target = $this->createUser('user', 'impersonation-target');
        $platformAdmin = $this->createPlatformAdmin();
        $platformToken = $platformAdmin->createToken('platform-test', ['platform_admin'])->plainTextToken;

        $response = $this->withToken($platformToken)
            ->postJson('/api/platform/impersonations', [
                'user_id' => $target->id,
                'reason' => 'Investigate support ticket 123',
            ])
            ->assertCreated()
            ->assertJsonPath('user.id', $target->id)
            ->assertJsonPath('tenant.slug', $tenant->slug);

        $impersonationId = $response->json('id');
        $impersonationToken = $response->json('api_token');
        $this->assertDatabaseHas('platform_impersonations', [
            'id' => $impersonationId,
            'platform_admin_id' => $platformAdmin->id,
            'platform_admin_username' => $platformAdmin->username,
            'target_user_id' => $target->id,
            'target_username' => $target->username,
            'tenant_id' => $tenant->id,
            'tenant_name' => $tenant->name,
            'tenant_slug' => $tenant->slug,
            'reason' => 'Investigate support ticket 123',
            'ended_at' => null,
        ]);
        $expiresAt = \Illuminate\Support\Carbon::parse($response->json('expires_at'));
        $this->assertTrue($expiresAt->between(now()->addMinutes(14), now()->addMinutes(16)));

        $this->withHeader('X-Tenant-Slug', $tenant->slug)
            ->withToken($impersonationToken)
            ->postJson('/api/impersonations/'.$impersonationId.'/end')
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $target->id,
            'name' => 'platform-impersonation',
        ]);
        $this->assertNotNull(DB::table('platform_impersonations')->where('id', $impersonationId)->value('ended_at'));
    }

    public function test_password_reset_requires_a_verified_one_time_token_and_revokes_sessions(): void
    {
        Mail::fake();
        $user = $this->createUser('user');
        $user->createToken('old-session');

        $this->postJson('/api/ResetPassword', [
            'email' => $user->email,
            'password' => 'new-secure-password',
        ])->assertUnprocessable();

        $otp = OTPModel::create([
            'email' => $user->email,
            'otp' => Hash::make('123456'),
            'date' => now()->toDateString(),
            'time' => now()->format('H:i:s'),
            'expires_at' => now()->addMinutes(5),
        ]);

        $resetToken = $this->postJson('/api/OTPVerification', [
            'email' => $user->email,
            'otp' => '123456',
        ])->assertOk()->json('reset_token');

        $this->assertIsString($resetToken);

        $this->postJson('/api/ResetPassword', [
            'email' => $user->email,
            'password' => 'new-secure-password',
            'reset_token' => $resetToken,
        ])->assertOk()->assertSeeText('1');

        $this->assertTrue(Hash::check('new-secure-password', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->assertDatabaseMissing('email_otp_verification', ['id' => $otp->id]);
    }

    public function test_member_details_never_return_a_password_hash(): void
    {
        $admin = $this->createUser('admin');
        $member = $this->createUser('user', 'member');
        $token = $admin->createToken('admin-test', ['admin'])->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/view_member_by_id/'.$member->id)
            ->assertOk()
            ->assertJsonMissingPath('password');
    }

    public function test_payment_changes_keep_monthly_statement_totals_consistent(): void
    {
        $admin = $this->createUser('admin');
        $member = $this->createUser('user', 'payment-member');
        $token = $admin->createToken('admin-test', ['admin'])->plainTextToken;
        $year = 2026;

        foreach (['January', 'February'] as $month) {
            \Illuminate\Support\Facades\DB::table('monthly_statements')->insert([
                'tenant_id' => $member->tenant_id,
                'year' => $year,
                'month' => $month,
                'token_no' => $member->token_no,
                'total_lunch' => 0,
                'lunch_cost' => 0,
                'total_dinner' => 0,
                'dinner_cost' => 0,
                'total_meal' => 0,
                'total_cost' => 100,
                'total_payment' => 0,
                'give' => 100,
                'take' => 0,
            ]);
        }

        DB::table('payments')->insert([
            'tenant_id' => $member->tenant_id,
            'year' => $year,
            'month' => 'January',
            'name' => $member->name,
            'token_no' => $member->token_no,
            'email' => $member->email,
            'phone' => $member->phone,
            'amount' => 999,
            'transaction_id' => 'PENDING-STATEMENT-TEST',
            'status' => 'Pending',
            'currency' => 'BDT',
            'payment_date' => now('Asia/Dhaka')->toDateString(),
            'payment_time' => now('Asia/Dhaka')->format('h:i:sa'),
        ]);

        $this->withToken($token)->postJson('/api/AddPayment', [
            'token_no' => $member->token_no,
            'year' => $year,
            'month' => 'January',
            'status' => 'Paid',
            'amount' => 25,
        ])->assertOk()->assertSeeText('1');

        $paymentId = DB::table('payments')->where('status', 'Paid')->value('id');
        $this->withToken($token)->postJson('/api/EditPayment', [
            'payment_id' => $paymentId,
            'token_no' => $member->token_no,
            'year' => $year,
            'month' => 'February',
            'status' => 'Paid',
            'amount' => 150,
        ])->assertOk()->assertSeeText('1');

        $this->assertStatementTotals($member->token_no, $year, 'January', 0, 100, 0);
        $this->assertStatementTotals($member->token_no, $year, 'February', 150, 0, 50);

        $this->withToken($token)->deleteJson('/api/DeletePayment/'.$paymentId)
            ->assertOk()->assertSeeText('1');

        $this->assertStatementTotals($member->token_no, $year, 'February', 0, 100, 0);
    }

    public function test_database_constraints_enforce_unique_business_keys_and_notification_relations(): void
    {
        $user = $this->createUser('user', 'unique-keys');

        $this->assertConstraintViolation(fn () => DB::table('users')->insert([
            'tenant_id' => $user->tenant_id,
            'name' => 'Duplicate token',
            'username' => 'different-username',
            'email' => 'different-token@example.test',
            'phone' => '1000000001',
            'token_no' => $user->token_no,
            'role' => 'user',
            'status' => 'active',
            'password' => Hash::make('correct-password'),
        ]));

        DB::table('monthly_statements')->insert($statement = [
            'tenant_id' => $user->tenant_id,
            'year' => 2026,
            'month' => 'November',
            'token_no' => $user->token_no,
            'total_lunch' => 0,
            'lunch_cost' => 0,
            'total_dinner' => 0,
            'dinner_cost' => 0,
            'total_meal' => 0,
            'total_cost' => 0,
            'total_payment' => 0,
            'give' => 0,
            'take' => 0,
        ]);
        $this->assertConstraintViolation(fn () => DB::table('monthly_statements')->insert($statement));

        $notificationId = DB::table('notifications')->insertGetId([
            'tenant_id' => $user->tenant_id,
            'author_id' => $user->id,
            'author_name' => $user->name,
            'msg_title' => 'Test',
            'msg_body' => 'Test',
            'create_date' => now()->toDateString(),
            'create_time' => now()->format('H:i:s'),
        ]);
        $recipient = [
            'tenant_id' => $user->tenant_id,
            'notification_id' => $notificationId,
            'user_id' => $user->id,
            'status' => 'Unread',
            'create_date' => now()->toDateString(),
            'create_time' => now()->format('H:i:s'),
        ];
        DB::table('notification_details')->insert($recipient);
        $this->assertConstraintViolation(fn () => DB::table('notification_details')->insert($recipient));

        DB::table('users')->where('id', $user->id)->delete();
        $this->assertDatabaseMissing('notification_details', ['notification_id' => $notificationId]);
    }

    public function test_order_meals_require_an_existing_user_and_cascade_on_user_deletion(): void
    {
        $user = $this->createUser('user', 'order-owner');
        $order = [
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'token_no' => $user->token_no,
            'lunch' => 1,
            'lunch_amount' => 10,
            'dinner' => 0,
            'dinner_amount' => 0,
            'total_meal' => 1,
            'delivery_charge' => 0,
            'total_amount' => 10,
            'is_parcel' => 'No',
            'status' => 'Processing',
            'meal_given_date' => now('Asia/Dhaka')->toDateString(),
        ];
        $orderId = DB::table('order_meals')->insertGetId($order);
        $invalidOrder = $order;
        $invalidOrder['user_id'] = $user->id + 1000000;

        $this->assertConstraintViolation(fn () => DB::table('order_meals')->insert($invalidOrder));

        DB::table('users')->where('id', $user->id)->delete();

        $this->assertDatabaseMissing('order_meals', ['id' => $orderId]);
    }

    public function test_count_summary_uses_one_order_aggregate_query(): void
    {
        $user = $this->createUser('user', 'summary');
        $now = now('Asia/Dhaka');
        $date = $now->toDateString();

        DB::table('meal_rates')->insert([
            'tenant_id' => $user->tenant_id,
            'lunch_expiry_time' => '10:00',
            'dinner_expiry_time' => '17:00',
            'lunch_rate' => 10,
            'lunch_rate_bangla' => '10',
            'dinner_rate' => 20,
            'dinner_rate_bangla' => '20',
            'total_rate' => 30,
        ]);

        DB::table('order_meals')->insert([
            [
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'token_no' => $user->token_no,
                'lunch' => 2,
                'lunch_amount' => 20,
                'dinner' => 1,
                'dinner_amount' => 20,
                'total_meal' => 3,
                'delivery_charge' => 5,
                'total_amount' => 45,
                'is_parcel' => 'Yes',
                'status' => 'Processing',
                'meal_given_date' => $date,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'token_no' => $user->token_no,
                'lunch' => 1,
                'lunch_amount' => 10,
                'dinner' => 3,
                'dinner_amount' => 60,
                'total_meal' => 4,
                'delivery_charge' => 0,
                'total_amount' => 70,
                'is_parcel' => 'No',
                'status' => 'Processing',
                'meal_given_date' => $date,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('payments')->insert([
            'tenant_id' => $user->tenant_id,
            'year' => $now->year,
            'month' => $now->format('F'),
            'name' => $user->name,
            'token_no' => (string) $user->token_no,
            'email' => $user->email,
            'phone' => $user->phone,
            'amount' => 25,
            'transaction_id' => 'SUMMARY-TEST-TRANSACTION',
            'status' => 'Paid',
            'currency' => 'BDT',
            'payment_date' => $date,
            'payment_time' => $now->format('h:i:sa'),
        ]);
        DB::table('payments')->insert([
            'tenant_id' => $user->tenant_id,
            'year' => $now->year,
            'month' => $now->format('F'),
            'name' => $user->name,
            'token_no' => $user->token_no,
            'email' => $user->email,
            'phone' => $user->phone,
            'amount' => 500,
            'transaction_id' => 'SUMMARY-PENDING-TEST',
            'status' => 'Pending',
            'currency' => 'BDT',
            'payment_date' => $date,
            'payment_time' => $now->format('h:i:sa'),
        ]);

        DB::flushQueryLog();
        DB::enableQueryLog();
        $summary = (new OrderMealController())->CountSummary($user->token_no);
        $orderAggregateQueries = collect(DB::getQueryLog())
            ->filter(fn ($query) => str_contains($query['query'], 'order_meals'))
            ->count();
        DB::disableQueryLog();

        $this->assertSame(1, $orderAggregateQueries);
        $this->assertSame(3, (int) $summary['total_lunch']);
        $this->assertSame(4, (int) $summary['total_dinner']);
        $this->assertEquals(115, $summary['total_cost']);
        $this->assertEquals(25, $summary['total_payment']);
        $this->assertEquals(90, $summary['give']);
        $this->assertEquals(0, $summary['take']);
    }

    private function assertStatementTotals(
        int $tokenNo,
        int $year,
        string $month,
        float $totalPayment,
        float $give,
        float $take
    ): void {
        $statement = MonthlyStatement::where([
            'token_no' => $tokenNo,
            'year' => $year,
            'month' => $month,
        ])->first();
        $this->assertNotNull($statement);
        $this->assertEquals($totalPayment, (float) $statement->total_payment);
        $this->assertEquals($give, (float) $statement->give);
        $this->assertEquals($take, (float) $statement->take);
    }

    private function createUser(string $role, string $suffix = 'account'): User
    {
        return User::create([
            'name' => ucfirst($suffix),
            'username' => $suffix.'-'.$role,
            'email' => $suffix.'-'.$role.'@example.test',
            'phone' => random_int(1000000000, 9999999999),
            'token_no' => random_int(111111, 999999),
            'role' => $role,
            'status' => 'active',
            'password' => Hash::make('correct-password'),
        ]);
    }

    private function createPlatformAdmin(): User
    {
        app(TenantContext::class)->clear();

        return User::create([
            'tenant_id' => null,
            'name' => 'Platform Admin',
            'username' => 'platform-admin-'.$this->name(),
            'email' => 'platform-admin-'.$this->name().'@example.test',
            'phone' => random_int(1000000000, 9999999999),
            'token_no' => random_int(111111, 999999),
            'role' => 'platform_admin',
            'status' => 'active',
            'password' => Hash::make('correct-password'),
        ]);
    }

    private function assertConstraintViolation(callable $operation): void
    {
        try {
            $operation();
            $this->fail('Expected a database constraint violation.');
        } catch (QueryException $exception) {
            $this->assertNotSame('', $exception->getMessage());
        }
    }
}
