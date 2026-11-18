<?php

namespace Tests\Feature;

use App\Models\OTPModel;
use App\Models\MonthlyStatement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

    public function test_user_tokens_cannot_read_another_users_profile(): void
    {
        $owner = $this->createUser('user');
        $otherUser = $this->createUser('user', 'other');
        $token = $owner->createToken('test', ['user'])->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/GetUserProfile/'.$otherUser->id)
            ->assertForbidden();
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

        $this->withToken($token)->postJson('/api/AddPayment', [
            'token_no' => $member->token_no,
            'year' => $year,
            'month' => 'January',
            'status' => 'Paid',
            'amount' => 25,
        ])->assertOk()->assertSeeText('1');

        $paymentId = \Illuminate\Support\Facades\DB::table('payments')->value('id');
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
}
