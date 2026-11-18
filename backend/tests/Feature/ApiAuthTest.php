<?php

namespace Tests\Feature;

use App\Models\OTPModel;
use App\Models\MonthlyStatement;
use App\Models\User;
use App\Http\Controllers\OrderMealController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
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

        DB::table('payments')->insert([
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
            'author_id' => $user->id,
            'author_name' => $user->name,
            'msg_title' => 'Test',
            'msg_body' => 'Test',
            'create_date' => now()->toDateString(),
            'create_time' => now()->format('H:i:s'),
        ]);
        $recipient = [
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
