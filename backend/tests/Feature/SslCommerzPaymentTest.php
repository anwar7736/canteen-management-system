<?php

namespace Tests\Feature;

use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SslCommerzPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_initiation_requires_credentials_and_does_not_save_an_unstarted_payment(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => null,
            'sslcommerz.apiCredentials.store_password' => null,
        ]);
        $user = $this->createUser();

        $this->post('/pay', $this->paymentPayload($user))
            ->assertStatus(503);

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_payment_initiation_redirects_to_gateway_and_saves_pending_payment(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => 'sandbox-store',
            'sslcommerz.apiCredentials.store_password' => 'sandbox-password',
        ]);
        $user = $this->createUser();

        $this->mock(SslCommerzNotification::class, function ($mock) {
            $mock->shouldReceive('makePayment')
                ->once()
                ->withArgs(function (array $data, string $type, string $pattern) {
                    return $data['currency'] === 'BDT'
                        && $data['total_amount'] === '25.00'
                        && $data['ipn_url'] === url('/ipn')
                        && $type === 'checkout'
                        && $pattern === 'json';
                })
                ->andReturn(json_encode([
                    'status' => 'success',
                    'data' => 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php',
                ]));
        });

        $this->post('/pay', $this->paymentPayload($user))
            ->assertRedirect('https://sandbox.sslcommerz.com/gwprocess/v4/gw.php');

        $payment = DB::table('payments')->first();
        $this->assertNotNull($payment);
        $this->assertSame('Pending', $payment->status);
        $this->assertEquals(25, $payment->amount);
    }

    public function test_gateway_error_response_does_not_create_a_pending_payment(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => 'sandbox-store',
            'sslcommerz.apiCredentials.store_password' => 'sandbox-password',
        ]);
        $user = $this->createUser();
        $gateway = new SslCommerzNotification();
        $failure = $gateway->formatResponse('FAILED TO CONNECT WITH SSLCOMMERZ API', 'checkout', 'json');
        $this->assertSame('fail', json_decode($failure, true)['status']);

        $this->mock(SslCommerzNotification::class, function ($mock) use ($failure) {
            $mock->shouldReceive('makePayment')->once()->andReturn($failure);
        });

        $this->post('/pay', $this->paymentPayload($user))
            ->assertStatus(502);

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_incomplete_gateway_callback_is_rejected_without_network_validation(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => 'sandbox-store',
            'sslcommerz.apiCredentials.store_password' => 'sandbox-password',
        ]);
        $gateway = new SslCommerzNotification();

        $this->assertFalse($gateway->orderValidate([], '', 0, 'BDT'));
        $this->assertFalse($gateway->orderValidate([
            'val_id' => 'validation-id',
            'verify_key' => 'missing_field',
            'verify_sign' => 'invalid-signature',
        ], 'transaction-id', 25, 'BDT'));
    }

    public function test_success_callback_validates_and_updates_statement_once(): void
    {
        $user = $this->createUser();
        $this->createStatement($user);
        $transactionId = 'SSL-SANDBOX-TRANSACTION-001';
        $this->createPendingPayment($user, $transactionId, 25);

        $this->mock(SslCommerzNotification::class, function ($mock) use ($transactionId) {
            $mock->shouldReceive('orderValidate')
                ->once()
                ->withArgs(function (array $data, string $id, $amount, string $currency) use ($transactionId) {
                    return $id === $transactionId && (float) $amount === 25.0 && $currency === 'BDT';
                })
                ->andReturnTrue();
        });

        $this->post('/success', ['tran_id' => $transactionId, 'amount' => 999])
            ->assertRedirect('http://localhost:3001/payment_summary?payment=completed');
        $this->post('/success', ['tran_id' => $transactionId])
            ->assertRedirect('http://localhost:3001/payment_summary?payment=already_completed');

        $this->assertDatabaseHas('payments', [
            'transaction_id' => $transactionId,
            'status' => 'Processing',
        ]);
        $this->assertDatabaseHas('monthly_statements', [
            'token_no' => $user->token_no,
            'total_payment' => 35,
            'give' => 65,
            'take' => 0,
        ]);
    }

    public function test_unknown_and_invalid_callbacks_do_not_crash_or_complete_a_payment(): void
    {
        $user = $this->createUser();
        $transactionId = 'SSL-SANDBOX-TRANSACTION-002';
        $this->createPendingPayment($user, $transactionId, 25);

        $this->mock(SslCommerzNotification::class, function ($mock) {
            $mock->shouldReceive('orderValidate')->once()->andReturnFalse();
        });

        $this->post('/success', ['tran_id' => 'UNKNOWN-TRANSACTION'])
            ->assertRedirect('http://localhost:3001/payment_summary?payment=invalid');
        $this->post('/ipn', ['tran_id' => $transactionId])
            ->assertUnprocessable();
        $this->post('/ipn')
            ->assertUnprocessable();

        $this->assertDatabaseHas('payments', [
            'transaction_id' => $transactionId,
            'status' => 'Pending',
        ]);
    }

    public function test_fail_and_cancel_callbacks_only_change_pending_payments(): void
    {
        $user = $this->createUser();
        $transactionId = 'SSL-SANDBOX-TRANSACTION-003';
        $this->createPendingPayment($user, $transactionId, 25);

        $this->post('/fail', ['tran_id' => $transactionId])
            ->assertRedirect('http://localhost:3001/payment_summary?payment=failed');
        $this->post('/cancel', ['tran_id' => $transactionId])
            ->assertRedirect('http://localhost:3001/payment_summary?payment=canceled');

        $this->assertDatabaseHas('payments', [
            'transaction_id' => $transactionId,
            'status' => 'Failed',
        ]);
    }

    private function createUser(): User
    {
        return User::create([
            'name' => 'Sandbox User',
            'username' => 'sandbox-user',
            'email' => 'sandbox@example.test',
            'phone' => '01700000000',
            'token_no' => 123456,
            'role' => 'user',
            'status' => 'active',
            'password' => Hash::make('test-password'),
        ]);
    }

    private function paymentPayload(User $user): array
    {
        return [
            'year' => 2026,
            'month' => 'November',
            'customer_name' => $user->name,
            'customer_token' => $user->token_no,
            'customer_email' => $user->email,
            'customer_mobile' => $user->phone,
            'cutomer_addr' => 'Dhaka',
            'amount' => '25.00',
        ];
    }

    private function createStatement(User $user): void
    {
        DB::table('monthly_statements')->insert([
            'tenant_id' => $user->tenant_id,
            'year' => 2026,
            'month' => 'November',
            'token_no' => $user->token_no,
            'total_lunch' => 0,
            'lunch_cost' => 0,
            'total_dinner' => 0,
            'dinner_cost' => 0,
            'total_meal' => 0,
            'total_cost' => 100,
            'total_payment' => 10,
            'give' => 90,
            'take' => 0,
        ]);
    }

    private function createPendingPayment(User $user, string $transactionId, float $amount): void
    {
        DB::table('payments')->insert([
            'tenant_id' => $user->tenant_id,
            'year' => 2026,
            'month' => 'November',
            'name' => $user->name,
            'token_no' => $user->token_no,
            'email' => $user->email,
            'phone' => $user->phone,
            'amount' => $amount,
            'address' => 'Dhaka',
            'transaction_id' => $transactionId,
            'status' => 'Pending',
            'currency' => 'BDT',
            'payment_date' => now('Asia/Dhaka')->toDateString(),
            'payment_time' => now('Asia/Dhaka')->format('h:i:sa'),
        ]);
    }
}
