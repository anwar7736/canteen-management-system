<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\DailyBazarCost;
use App\Notifications\OrderReminder;
use App\Notifications\SomePaymentReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ConsoleQueryOptimizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_bazar_cost_upsert_uses_the_unique_date_without_timestamp_columns(): void
    {
        $date = now('Asia/Dhaka')->toDateString();
        $attributes = [
            'year' => now('Asia/Dhaka')->year,
            'month' => now('Asia/Dhaka')->format('F'),
            'name' => 'Market',
        ];

        DailyBazarCost::updateOrCreate(['date' => $date], $attributes + ['amount' => 100]);
        DailyBazarCost::updateOrCreate(['date' => $date], $attributes + ['amount' => 125]);

        $this->assertSame(1, DailyBazarCost::whereDate('date', $date)->count());
        $this->assertEquals(125, DailyBazarCost::whereDate('date', $date)->value('amount'));
    }

    public function test_daily_order_reminder_uses_a_single_order_existence_query(): void
    {
        Notification::fake();
        $orderedUser = $this->createUser('ordered');
        $unpaidUser = $this->createUser('unpaid');
        $tomorrow = now('Asia/Dhaka')->addDay()->toDateString();

        DB::table('order_meals')->insert([
            'user_id' => $orderedUser->id,
            'token_no' => $orderedUser->token_no,
            'lunch' => 1,
            'lunch_amount' => 10,
            'dinner' => 0,
            'dinner_amount' => 0,
            'total_meal' => 1,
            'delivery_charge' => 0,
            'total_amount' => 10,
            'is_parcel' => 'No',
            'status' => 'Processing',
            'meal_given_date' => $tomorrow,
        ]);

        DB::flushQueryLog();
        DB::enableQueryLog();
        Artisan::call('daily:order');
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $orderQueries = collect($queries)
            ->filter(fn ($query) => str_contains($query['query'], 'order_meals'))
            ->count();

        $this->assertSame(1, $orderQueries);
        Notification::assertNotSentTo($orderedUser, OrderReminder::class);
        Notification::assertSentTo($unpaidUser, OrderReminder::class);
    }

    public function test_payment_reminders_use_one_grouped_payment_query(): void
    {
        Notification::fake();
        $paidUser = $this->createUser('paid');
        $underpaidUser = $this->createUser('underpaid');
        $noPaymentUser = $this->createUser('no-payment');
        $pendingUser = $this->createUser('pending');
        $now = now('Asia/Dhaka');

        $this->createPayment($paidUser, 1500, $now);
        $this->createPayment($underpaidUser, 1499.99, $now);
        $this->createPayment($pendingUser, 1500, $now, 'Pending');

        DB::flushQueryLog();
        DB::enableQueryLog();
        Artisan::call('some:payment');
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $paymentQueries = collect($queries)
            ->filter(fn ($query) => str_contains($query['query'], 'payments'))
            ->count();

        $this->assertSame(1, $paymentQueries);
        Notification::assertNotSentTo($paidUser, SomePaymentReminder::class);
        Notification::assertSentTo($underpaidUser, SomePaymentReminder::class);
        Notification::assertSentTo($noPaymentUser, SomePaymentReminder::class);
        Notification::assertSentTo($pendingUser, SomePaymentReminder::class);
    }

    public function test_user_inactivation_uses_one_grouped_payment_query(): void
    {
        $paidUser = $this->createUser('active-paid');
        $underpaidUser = $this->createUser('active-underpaid');
        $pendingUser = $this->createUser('active-pending');
        $now = now('Asia/Dhaka');

        $this->createPayment($paidUser, 1500, $now);
        $this->createPayment($underpaidUser, 1499.99, $now);
        $this->createPayment($pendingUser, 1500, $now, 'Pending');

        DB::flushQueryLog();
        DB::enableQueryLog();
        Artisan::call('user:inactive');
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $paymentQueries = collect($queries)
            ->filter(fn ($query) => str_contains($query['query'], 'payments'))
            ->count();

        $this->assertSame(1, $paymentQueries);
        $this->assertSame('active', $paidUser->fresh()->status);
        $this->assertSame('inactive', $underpaidUser->fresh()->status);
        $this->assertSame('inactive', $pendingUser->fresh()->status);
    }

    private function createUser(string $username): User
    {
        return User::create([
            'name' => $username,
            'username' => $username,
            'email' => $username.'@example.test',
            'phone' => (string) random_int(1000000000, 9999999999),
            'token_no' => random_int(111111, 999999),
            'role' => 'user',
            'status' => 'active',
            'password' => Hash::make('correct-password'),
        ]);
    }

    private function createPayment(
        User $user,
        float $amount,
        \Illuminate\Support\Carbon $date,
        string $status = 'Paid'
    ): void
    {
        DB::table('payments')->insert([
            'year' => $date->year,
            'month' => $date->format('F'),
            'name' => $user->name,
            'token_no' => $user->token_no,
            'email' => $user->email,
            'phone' => $user->phone,
            'amount' => $amount,
            'transaction_id' => 'TEST-'.$user->token_no,
            'status' => $status,
            'currency' => 'BDT',
            'payment_date' => $date->toDateString(),
            'payment_time' => $date->format('h:i:sa'),
        ]);
    }
}
