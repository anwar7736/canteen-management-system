<?php

namespace Tests\Feature;

use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\Tenant;
use App\Models\User;
use App\Support\PaymentUrls;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SslCommerzPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_checkout_requires_credentials_and_does_not_save_a_payment(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => null,
            'sslcommerz.apiCredentials.store_password' => null,
        ]);
        $user = $this->createUser();
        $this->authenticate($user);

        $this->postJson('/api/member/payment/checkout', $this->checkoutPayload())
            ->assertStatus(503);

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_member_checkout_uses_authenticated_profile_and_saves_pending_payment(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => 'sandbox-store',
            'sslcommerz.apiCredentials.store_password' => 'sandbox-password',
        ]);
        $user = $this->createUser();
        $this->createStatement($user);
        $this->authenticate($user);
        $gatewayUrl = 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php';

        $this->mock(SslCommerzNotification::class, function ($mock) use ($user, $gatewayUrl) {
            $mock->shouldReceive('makePayment')
                ->once()
                ->withArgs(function (array $data, string $type, string $pattern) use ($user) {
                    return $data['currency'] === 'BDT'
                        && $data['total_amount'] === '25.00'
                        && $data['cus_name'] === $user->name
                        && $data['cus_token'] === $user->token_no
                        && $data['cus_email'] === $user->email
                        && $data['cus_phone'] === $user->phone
                        && $data['success_url'] === url('/success')
                        && $data['ipn_url'] === url('/ipn')
                        && $type === 'checkout'
                        && $pattern === 'json'
                        && DB::table('payments')->where('status', 'Pending')->exists();
                })
                ->andReturn(json_encode([
                    'status' => 'success',
                    'data' => $gatewayUrl,
                ]));
        });

        $this->postJson('/api/member/payment/checkout', $this->checkoutPayload() + [
            'customer_email' => 'attacker@example.test',
            'customer_mobile' => '01000000000',
        ])
            ->assertOk()
            ->assertJson(['gateway_url' => $gatewayUrl]);

        $this->assertDatabaseHas('payments', [
            'tenant_id' => $user->tenant_id,
            'name' => $user->name,
            'token_no' => $user->token_no,
            'email' => $user->email,
            'phone' => $user->phone,
            'amount' => 25,
            'status' => 'Pending',
        ]);
    }

    public function test_gateway_failure_marks_the_payment_failed(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => 'sandbox-store',
            'sslcommerz.apiCredentials.store_password' => 'sandbox-password',
        ]);
        $user = $this->createUser();
        $this->createStatement($user);
        $this->authenticate($user);
        $gateway = new SslCommerzNotification();
        $failure = $gateway->formatResponse('FAILED TO CONNECT WITH SSLCOMMERZ API', 'checkout', 'json');

        $this->mock(SslCommerzNotification::class, function ($mock) use ($failure) {
            $mock->shouldReceive('makePayment')->once()->andReturn($failure);
        });

        $this->postJson('/api/member/payment/checkout', $this->checkoutPayload())
            ->assertStatus(502);

        $this->assertDatabaseHas('payments', ['status' => 'Failed']);
    }

    public function test_member_checkout_rejects_an_untrusted_gateway_url(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => 'sandbox-store',
            'sslcommerz.apiCredentials.store_password' => 'sandbox-password',
        ]);
        $user = $this->createUser();
        $this->createStatement($user);
        $this->authenticate($user);

        $this->mock(SslCommerzNotification::class, function ($mock) {
            $mock->shouldReceive('makePayment')->once()->andReturn(json_encode([
                'status' => 'success',
                'data' => 'https://gateway.attacker.example/checkout',
            ]));
        });

        $this->postJson('/api/member/payment/checkout', $this->checkoutPayload())
            ->assertStatus(502);

        $this->assertDatabaseHas('payments', ['status' => 'Failed']);
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

    public function test_server_verified_callback_without_signature_is_accepted(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => 'sandbox-store',
            'sslcommerz.apiCredentials.store_password' => 'sandbox-password',
        ]);
        $gateway = new class extends SslCommerzNotification {
            public ?object $validationResponse = null;

            protected function requestValidation(string $requestedUrl): ?object
            {
                return $this->validationResponse;
            }
        };
        $gateway->validationResponse = (object) [
            'status' => 'VALID',
            'val_id' => 'validation-id',
            'tran_id' => 'transaction-id',
            'amount' => '25.00',
            'currency_type' => 'BDT',
        ];

        $this->assertTrue($gateway->orderValidate([
            'val_id' => 'validation-id',
        ], 'transaction-id', 25, 'BDT'));
    }

    public function test_server_validation_must_match_callback_validation_id(): void
    {
        config([
            'sslcommerz.apiCredentials.store_id' => 'sandbox-store',
            'sslcommerz.apiCredentials.store_password' => 'sandbox-password',
        ]);
        $gateway = new class extends SslCommerzNotification {
            public ?object $validationResponse = null;

            protected function requestValidation(string $requestedUrl): ?object
            {
                return $this->validationResponse;
            }
        };
        $gateway->validationResponse = (object) [
            'status' => 'VALID',
            'val_id' => 'different-validation-id',
            'tran_id' => 'transaction-id',
            'amount' => '25.00',
            'currency_type' => 'BDT',
        ];

        $this->assertFalse($gateway->orderValidate([
            'val_id' => 'validation-id',
        ], 'transaction-id', 25, 'BDT'));
    }

    public function test_success_callback_resolves_tenant_and_updates_statement_once(): void
    {
        $user = $this->createUser();
        $this->createStatement($user);
        $transactionId = 'SSL-SANDBOX-TRANSACTION-001';
        $this->createPendingPayment($user, $transactionId, 25);
        $tenantSlug = Tenant::findOrFail($user->tenant_id)->slug;

        $this->mock(SslCommerzNotification::class, function ($mock) use ($transactionId) {
            $mock->shouldReceive('orderValidate')
                ->once()
                ->withArgs(function (array $data, string $id, $amount, string $currency) use ($transactionId) {
                    return $id === $transactionId && (float) $amount === 25.0 && $currency === 'BDT';
                })
                ->andReturnTrue();
        });

        app(TenantContext::class)->clear();
        $this->post('/success', ['tran_id' => $transactionId, 'amount' => 999])
            ->assertRedirect(PaymentUrls::frontend('/t/'.$tenantSlug.'/payment_summary', ['payment' => 'completed']));
        $this->post('/success', ['tran_id' => $transactionId])
            ->assertRedirect(PaymentUrls::frontend('/t/'.$tenantSlug.'/payment_summary', ['payment' => 'already_completed']));

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

    public function test_unknown_and_invalid_callbacks_do_not_complete_a_payment(): void
    {
        $user = $this->createUser();
        $transactionId = 'SSL-SANDBOX-TRANSACTION-002';
        $this->createPendingPayment($user, $transactionId, 25);

        $this->mock(SslCommerzNotification::class, function ($mock) {
            $mock->shouldReceive('orderValidate')->once()->andReturnFalse();
        });

        $this->post('/success', ['tran_id' => 'UNKNOWN-TRANSACTION'])
            ->assertRedirect(PaymentUrls::frontend('/login', ['payment' => 'invalid']));
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
        $failedTransactionId = 'SSL-SANDBOX-TRANSACTION-003';
        $canceledTransactionId = 'SSL-SANDBOX-TRANSACTION-004';
        $this->createPendingPayment($user, $failedTransactionId, 25);
        $this->createPendingPayment($user, $canceledTransactionId, 25);

        $this->post('/fail', ['tran_id' => $failedTransactionId])
            ->assertRedirect(PaymentUrls::frontend('/t/'.Tenant::findOrFail($user->tenant_id)->slug.'/payment_summary', ['payment' => 'failed']));
        $this->post('/cancel', ['tran_id' => $canceledTransactionId])
            ->assertRedirect(PaymentUrls::frontend('/t/'.Tenant::findOrFail($user->tenant_id)->slug.'/payment_summary', ['payment' => 'canceled']));

        $this->assertDatabaseHas('payments', [
            'transaction_id' => $failedTransactionId,
            'status' => 'Failed',
        ]);
        $this->assertDatabaseHas('payments', [
            'transaction_id' => $canceledTransactionId,
            'status' => 'Canceled',
        ]);
    }

    private function createUser(): User
    {
        return User::create([
            'name' => 'Sandbox User',
            'username' => 'sandbox-user',
            'email' => 'sandbox@example.test',
            'phone' => '01700000000',
            'address' => 'Dhaka',
            'token_no' => 123456,
            'role' => 'user',
            'status' => 'active',
            'password' => Hash::make('test-password'),
        ]);
    }

    private function authenticate(User $user): void
    {
        Sanctum::actingAs($user, ['user']);
        $tenant = Tenant::findOrFail($user->tenant_id);
        $this->withHeader('X-Tenant-Slug', $tenant->slug);
    }

    private function checkoutPayload(): array
    {
        return [
            'year' => 2026,
            'month' => 'November',
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
