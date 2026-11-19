<?php

namespace App\Http\Controllers;

use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Tenancy\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    public function plans()
    {
        return SubscriptionPlan::query()
            ->where('active', true)
            ->where('slug', '<>', 'legacy')
            ->orderBy('price')
            ->get();
    }

    public function current()
    {
        $tenantId = app(TenantContext::class)->id();
        $subscription = TenantSubscription::query()
            ->with('plan')
            ->where('tenant_id', $tenantId)
            ->latest('id')
            ->first();

        return response()->json([
            'subscription' => $subscription,
            'payments' => SubscriptionPayment::query()
                ->where('tenant_id', $tenantId)
                ->latest('id')
                ->limit(20)
                ->get(),
        ]);
    }

    public function checkout(Request $request, SslCommerzNotification $sslCommerz): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
        ]);
        $tenant = app(TenantContext::class)->tenant();
        if (!$tenant) {
            abort(400, 'A tenant context is required.');
        }

        $plan = SubscriptionPlan::query()
            ->whereKey($validated['plan_id'])
            ->where('active', true)
            ->where('slug', '<>', 'legacy')
            ->firstOrFail();
        if ((float) $plan->price <= 0) {
            abort(422, 'Choose a paid subscription plan.');
        }

        $storeId = config('sslcommerz.apiCredentials.store_id');
        $storePassword = config('sslcommerz.apiCredentials.store_password');
        if (!filled($storeId) || !filled($storePassword)) {
            abort(503, 'SSLCommerz credentials are not configured.');
        }

        $owner = User::query()->where('role', 'admin')->orderBy('id')->firstOrFail();
        $transactionId = Str::upper(Str::random(30));
        $amount = number_format((float) $plan->price, 2, '.', '');
        $periodStart = now();
        $periodEnd = $this->periodEnd($periodStart, $plan->interval);
        $paymentData = [
            'total_amount' => $amount,
            'currency' => $plan->currency,
            'tran_id' => $transactionId,
            'cus_name' => $owner->name,
            'cus_email' => $owner->email,
            'cus_add1' => 'Bangladesh',
            'cus_city' => 'Dhaka',
            'cus_country' => 'Bangladesh',
            'cus_phone' => $owner->phone,
            'ship_name' => $tenant->name,
            'ship_add1' => 'Bangladesh',
            'ship_city' => 'Dhaka',
            'ship_country' => 'Bangladesh',
            'shipping_method' => 'NO',
            'product_name' => $plan->name.' subscription',
            'product_category' => 'SaaS subscription',
            'product_profile' => 'non-physical-goods',
            'success_url' => url('/subscription/success'),
            'fail_url' => url('/subscription/fail'),
            'cancel_url' => url('/subscription/cancel'),
            'ipn_url' => url('/subscription/ipn'),
        ];

        $gatewayResponse = $sslCommerz->makePayment($paymentData, 'checkout', 'json');
        $gatewayResponse = is_array($gatewayResponse)
            ? $gatewayResponse
            : json_decode((string) $gatewayResponse, true);
        $gatewayUrl = is_array($gatewayResponse) ? ($gatewayResponse['data'] ?? null) : null;

        if (
            !is_string($gatewayUrl) ||
            strtolower((string) ($gatewayResponse['status'] ?? '')) !== 'success' ||
            !filter_var($gatewayUrl, FILTER_VALIDATE_URL) ||
            parse_url($gatewayUrl, PHP_URL_SCHEME) !== 'https'
        ) {
            abort(502, 'SSLCommerz could not start the subscription payment.');
        }

        $subscription = TenantSubscription::query()
            ->where('tenant_id', $tenant->getKey())
            ->latest('id')
            ->firstOrFail();
        SubscriptionPayment::create([
            'tenant_id' => $tenant->getKey(),
            'subscription_id' => $subscription->getKey(),
            'plan_id' => $plan->getKey(),
            'amount' => $amount,
            'currency' => $plan->currency,
            'transaction_id' => $transactionId,
            'status' => 'Pending',
            'gateway' => 'sslcommerz',
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
        ]);

        return response()->json(['gateway_url' => $gatewayUrl]);
    }

    public function success(Request $request, SslCommerzNotification $sslCommerz): RedirectResponse
    {
        $result = $this->completePayment($request, $sslCommerz);

        return redirect()->to($this->billingUrl($result));
    }

    public function ipn(Request $request, SslCommerzNotification $sslCommerz)
    {
        $result = $this->completePayment($request, $sslCommerz);
        if (in_array($result, ['completed', 'already_completed'], true)) {
            return response('Subscription payment completed.', 200);
        }

        return response('Subscription payment could not be validated.', $result === 'invalid' ? 404 : 422);
    }

    public function fail(Request $request): RedirectResponse
    {
        $this->setPendingStatus($request->input('tran_id'), 'Failed');

        return redirect()->to($this->billingUrl('failed'));
    }

    public function cancel(Request $request): RedirectResponse
    {
        $this->setPendingStatus($request->input('tran_id'), 'Canceled');

        return redirect()->to($this->billingUrl('canceled'));
    }

    private function completePayment(Request $request, SslCommerzNotification $sslCommerz): string
    {
        $transactionId = $request->input('tran_id');
        if (!is_string($transactionId) || $transactionId === '' || strlen($transactionId) > 64) {
            return 'invalid';
        }

        $payment = SubscriptionPayment::query()
            ->where('transaction_id', $transactionId)
            ->first();
        if (!$payment) {
            return 'invalid';
        }

        if ($payment->status === 'Complete') {
            return 'already_completed';
        }
        if ($payment->status !== 'Pending' || !$sslCommerz->orderValidate(
            $request->all(),
            $transactionId,
            $payment->amount,
            $payment->currency
        )) {
            return 'validation_failed';
        }

        return DB::transaction(function () use ($payment, $transactionId) {
            $lockedPayment = SubscriptionPayment::query()
                ->whereKey($payment->getKey())
                ->lockForUpdate()
                ->first();
            if (!$lockedPayment) {
                return 'invalid';
            }
            if ($lockedPayment->status === 'Complete') {
                return 'already_completed';
            }
            if ($lockedPayment->status !== 'Pending') {
                return 'validation_failed';
            }

            $tenant = Tenant::query()->find($lockedPayment->tenant_id);
            $plan = SubscriptionPlan::query()->find($lockedPayment->plan_id);
            $subscription = TenantSubscription::query()
                ->whereKey($lockedPayment->subscription_id)
                ->where('tenant_id', $lockedPayment->tenant_id)
                ->lockForUpdate()
                ->first();
            if (!$tenant || !$plan || !$subscription) {
                return 'invalid';
            }

            $periodStart = $subscription->current_period_end &&
                $subscription->current_period_end->isFuture()
                ? $subscription->current_period_end
                : now();
            $periodEnd = $this->periodEnd($periodStart, $plan->interval);

            $lockedPayment->update([
                'status' => 'Complete',
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'paid_at' => now(),
            ]);
            $subscription->update([
                'plan_id' => $plan->getKey(),
                'status' => 'active',
                'starts_at' => $subscription->starts_at ?: $periodStart,
                'current_period_start' => $periodStart,
                'current_period_end' => $periodEnd,
                'trial_ends_at' => null,
                'canceled_at' => null,
                'gateway' => 'sslcommerz',
            ]);

            app(TenantContext::class)->set($tenant);

            return 'completed';
        });
    }

    private function setPendingStatus(mixed $transactionId, string $status): void
    {
        if (!is_string($transactionId) || $transactionId === '' || strlen($transactionId) > 64) {
            return;
        }

        SubscriptionPayment::query()
            ->where('transaction_id', $transactionId)
            ->where('status', 'Pending')
            ->update(['status' => $status]);
    }

    private function periodEnd(Carbon $periodStart, string $interval): Carbon
    {
        return $interval === 'yearly'
            ? $periodStart->copy()->addYear()
            : $periodStart->copy()->addMonth();
    }

    private function billingUrl(string $status): string
    {
        $transactionId = request()->input('tran_id');
        $payment = is_string($transactionId)
            ? SubscriptionPayment::query()->where('transaction_id', $transactionId)->first()
            : null;
        $tenant = $payment ? Tenant::query()->find($payment->tenant_id) : null;
        $slug = $tenant?->slug;
        if (!$slug) {
            return rtrim(config('app.frontend_url'), '/').'/subscription-result?status='.urlencode($status);
        }

        return rtrim(config('app.frontend_url'), '/').'/t/'.rawurlencode($slug)
            .'/admin/billing?subscription='.urlencode($status);
    }
}
