<?php

namespace Tests\Feature;

use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Support\PaymentUrls;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_sends_complete_address_data_and_subscription_callbacks(): void
    {
        $tenant = Tenant::create([
            'name' => 'Sandbox Canteen',
            'slug' => 'sandbox-canteen',
            'status' => 'active',
        ]);
        $admin = User::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Sandbox Admin',
            'username' => 'sandbox-admin',
            'email' => 'sandbox-admin@example.test',
            'phone' => '01700000000',
            'token_no' => 999001,
            'role' => 'admin',
            'status' => 'active',
            'password' => Hash::make('test-password'),
        ]);
        $plan = SubscriptionPlan::create([
            'name' => 'Canteen Pro',
            'slug' => 'canteen-pro-test',
            'price' => 1000,
            'currency' => 'BDT',
            'interval' => 'monthly',
            'active' => true,
        ]);
        TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
        ]);
        Sanctum::actingAs($admin, ['admin']);

        $gatewayUrl = 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php';
        $this->mock(SslCommerzNotification::class, function ($mock) use ($gatewayUrl) {
            $mock->shouldReceive('makePayment')
                ->once()
                ->withArgs(function (array $data, string $type, string $pattern) {
                    return $data['cus_add2'] === ''
                        && $data['cus_postcode'] === '1000'
                        && $data['ship_add2'] === ''
                        && $data['ship_postcode'] === '1000'
                        && $data['success_url'] === url('/subscription/success')
                        && $data['fail_url'] === url('/subscription/fail')
                        && $data['cancel_url'] === url('/subscription/cancel')
                        && $data['ipn_url'] === url('/subscription/ipn')
                        && $type === 'checkout'
                        && $pattern === 'json';
                })
                ->andReturn(json_encode([
                    'status' => 'success',
                    'data' => $gatewayUrl,
                ]));
        });

        $this->withHeader('X-Tenant-Slug', $tenant->slug)
            ->postJson('/api/tenant/subscription/checkout', ['plan_id' => $plan->id])
            ->assertOk()
            ->assertJson(['gateway_url' => $gatewayUrl]);

        $this->assertDatabaseHas('subscription_payments', [
            'tenant_id' => $tenant->id,
            'subscription_id' => $tenant->subscriptions()->firstOrFail()->id,
            'plan_id' => $plan->id,
            'amount' => 1000,
            'status' => 'Pending',
        ]);
    }

    public function test_gateway_preserves_per_transaction_callbacks_and_legacy_defaults(): void
    {
        $gateway = new SslCommerzNotification();
        $requiredInfo = [
            'total_amount' => '1000.00',
            'currency' => 'BDT',
            'tran_id' => 'sandbox-transaction',
            'product_category' => 'SaaS subscription',
        ];
        $callbackUrls = [
            'success_url' => url('/subscription/success'),
            'fail_url' => url('/subscription/fail'),
            'cancel_url' => url('/subscription/cancel'),
            'ipn_url' => url('/subscription/ipn'),
        ];

        $paymentInfo = $gateway->setRequiredInfo($requiredInfo + $callbackUrls);
        $this->assertSame($callbackUrls, array_intersect_key($paymentInfo, $callbackUrls));

        $legacyInfo = $gateway->setRequiredInfo($requiredInfo);
        $this->assertSame(url('/success'), $legacyInfo['success_url']);
        $this->assertSame(url('/fail'), $legacyInfo['fail_url']);
        $this->assertSame(url('/cancel'), $legacyInfo['cancel_url']);
    }

    public function test_success_callback_resolves_tenant_and_activates_subscription_once(): void
    {
        [$tenant, $payment, $subscription] = $this->createPendingSubscriptionPayment();
        $this->mock(SslCommerzNotification::class, function ($mock) use ($payment) {
            $mock->shouldReceive('orderValidate')
                ->once()
                ->withArgs(function (array $data, string $transactionId, $amount, string $currency) use ($payment) {
                    return $transactionId === $payment->transaction_id
                        && (float) $amount === 1000.0
                        && $currency === 'BDT';
                })
                ->andReturnTrue();
        });

        app(TenantContext::class)->clear();
        $this->post('/subscription/success', ['tran_id' => $payment->transaction_id])
            ->assertRedirect(PaymentUrls::frontend(
                '/t/'.$tenant->slug.'/admin/billing',
                ['subscription' => 'completed']
            ));
        $this->post('/subscription/success', ['tran_id' => $payment->transaction_id])
            ->assertRedirect(PaymentUrls::frontend(
                '/t/'.$tenant->slug.'/admin/billing',
                ['subscription' => 'already_completed']
            ));

        $this->assertDatabaseHas('subscription_payments', [
            'id' => $payment->id,
            'status' => 'Complete',
        ]);
        $this->assertDatabaseHas('tenant_subscriptions', [
            'id' => $subscription->id,
            'status' => 'active',
        ]);
    }

    public function test_invalid_subscription_callback_leaves_payment_and_subscription_unchanged(): void
    {
        [$tenant, $payment, $subscription] = $this->createPendingSubscriptionPayment();
        $this->mock(SslCommerzNotification::class, function ($mock) {
            $mock->shouldReceive('orderValidate')->once()->andReturnFalse();
        });

        app(TenantContext::class)->clear();
        $this->post('/subscription/success', ['tran_id' => $payment->transaction_id])
            ->assertRedirect(PaymentUrls::frontend(
                '/t/'.$tenant->slug.'/admin/billing',
                ['subscription' => 'validation_failed']
            ));

        $this->assertDatabaseHas('subscription_payments', [
            'id' => $payment->id,
            'status' => 'Pending',
        ]);
        $this->assertDatabaseHas('tenant_subscriptions', [
            'id' => $subscription->id,
            'status' => 'trialing',
        ]);
    }

    private function createPendingSubscriptionPayment(): array
    {
        $tenant = Tenant::create([
            'name' => 'Callback Canteen',
            'slug' => 'callback-canteen-'.strtolower(\Illuminate\Support\Str::random(6)),
            'status' => 'active',
        ]);
        $plan = SubscriptionPlan::create([
            'name' => 'Callback Pro',
            'slug' => 'callback-pro-'.strtolower(\Illuminate\Support\Str::random(6)),
            'price' => 1000,
            'currency' => 'BDT',
            'interval' => 'monthly',
            'active' => true,
        ]);
        $subscription = TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
        ]);
        $payment = SubscriptionPayment::create([
            'tenant_id' => $tenant->id,
            'subscription_id' => $subscription->id,
            'plan_id' => $plan->id,
            'amount' => 1000,
            'currency' => 'BDT',
            'transaction_id' => 'CALLBACK-'.strtoupper(\Illuminate\Support\Str::random(20)),
            'status' => 'Pending',
            'gateway' => 'sslcommerz',
        ]);

        return [$tenant, $payment, $subscription];
    }
}
