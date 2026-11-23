<?php

namespace App\Http\Controllers;

use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\MonthlyStatement;
use App\Models\Tenant;
use App\Support\PaymentUrls;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SslCommerzPaymentController extends Controller
{
    private const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    public function exampleEasyCheckout()
    {
        return view('exampleEasycheckout');
    }

    public function onlineSSLPayment(): RedirectResponse
    {
        return redirect()->to(PaymentUrls::frontend('/login'));
    }

    public function index()
    {
        abort(410, 'Start payments from the signed-in member portal.');
    }

    public function checkoutMember(Request $request, SslCommerzNotification $sslCommerz): JsonResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'between:2000,2100'],
            'month' => ['required', 'string', 'in:'.implode(',', self::MONTHS)],
            'amount' => ['required', 'numeric', 'decimal:0,2', 'between:10,500000'],
        ]);

        if (!filled(config('sslcommerz.apiCredentials.store_id'))
            || !filled(config('sslcommerz.apiCredentials.store_password'))) {
            abort(503, 'SSLCommerz credentials are not configured.');
        }

        $tenant = app(TenantContext::class)->tenant();
        if (!$tenant) {
            abort(400, 'A tenant context is required to start payment.');
        }

        $user = $request->user();
        if (
            !$user
            || $user->role !== 'user'
            || $user->status !== 'active'
            || (int) $user->tenant_id !== (int) $tenant->getKey()
        ) {
            abort(403, 'An active member account is required to start payment.');
        }

        $statement = MonthlyStatement::query()
            ->where('token_no', $user->token_no)
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->first();
        if (!$statement) {
            abort(422, 'The monthly statement for this payment was not found.');
        }

        $transactionId = $this->newTransactionId();
        $amount = number_format((float) $validated['amount'], 2, '.', '');
        $address = Str::limit($user->address ?: $tenant->name, 50, '');
        if (strlen($user->email) > 50 || strlen($user->phone) > 20) {
            abort(422, 'Update your email address and phone number before making a payment.');
        }
        $paymentData = [
            'total_amount' => $amount,
            'currency' => 'BDT',
            'tran_id' => $transactionId,
            'year' => $validated['year'],
            'month' => $validated['month'],
            'cus_name' => Str::limit($user->name, 50, ''),
            'cus_token' => $user->token_no,
            'cus_email' => $user->email,
            'cus_add1' => $address,
            'cus_add2' => '',
            'cus_city' => 'Dhaka',
            'cus_state' => '',
            'cus_postcode' => '1000',
            'cus_country' => 'Bangladesh',
            'cus_phone' => $user->phone,
            'cus_fax' => '',
            'ship_name' => Str::limit($tenant->name, 50, ''),
            'ship_add1' => $address,
            'ship_add2' => '',
            'ship_city' => 'Dhaka',
            'ship_state' => '',
            'ship_postcode' => '1000',
            'ship_phone' => $user->phone,
            'ship_country' => 'Bangladesh',
            'shipping_method' => 'NO',
            'product_name' => 'Canteen meal payment',
            'product_category' => 'Meal',
            'product_profile' => 'non-physical-goods',
            'success_url' => PaymentUrls::backend('/success'),
            'fail_url' => PaymentUrls::backend('/fail'),
            'cancel_url' => PaymentUrls::backend('/cancel'),
            'ipn_url' => PaymentUrls::backend('/ipn'),
        ];

        $now = now('Asia/Dhaka');
        DB::table('payments')->insert([
            'tenant_id' => $tenant->getKey(),
            'year' => $validated['year'],
            'month' => $validated['month'],
            'name' => Str::limit($user->name, 50, ''),
            'token_no' => $user->token_no,
            'email' => $user->email,
            'phone' => $user->phone,
            'amount' => $amount,
            'address' => $address,
            'transaction_id' => $transactionId,
            'status' => 'Pending',
            'currency' => 'BDT',
            'payment_date' => $now->toDateString(),
            'payment_time' => $now->format('h:i:sa'),
        ]);

        $gatewayResponse = $sslCommerz->makePayment($paymentData, 'checkout', 'json');
        $gatewayResponse = is_array($gatewayResponse)
            ? $gatewayResponse
            : json_decode((string) $gatewayResponse, true);
        $gatewayResponse = is_array($gatewayResponse) ? $gatewayResponse : [];
        $gatewayUrl = is_array($gatewayResponse) ? ($gatewayResponse['data'] ?? null) : null;

        if (strtolower((string) ($gatewayResponse['status'] ?? '')) !== 'success'
            || !PaymentUrls::isTrustedGatewayUrl($gatewayUrl)) {
            DB::table('payments')
                ->where('transaction_id', $transactionId)
                ->where('status', 'Pending')
                ->update(['status' => 'Failed']);
            abort(502, 'SSLCommerz could not start the payment.');
        }

        return response()->json(['gateway_url' => $gatewayUrl]);
    }

    public function success(Request $request, SslCommerzNotification $sslCommerz): RedirectResponse
    {
        $result = $this->validateAndCompletePayment(
            $request,
            $sslCommerz,
            $request->input('tran_id')
        );

        return redirect()->to($this->paymentSummaryUrl($result));
    }

    public function fail(Request $request): RedirectResponse
    {
        $this->setPendingPaymentStatus($request->input('tran_id'), 'Failed');

        return redirect()->to($this->paymentSummaryUrl('failed'));
    }

    public function cancel(Request $request): RedirectResponse
    {
        $this->setPendingPaymentStatus($request->input('tran_id'), 'Canceled');

        return redirect()->to($this->paymentSummaryUrl('canceled'));
    }

    public function ipn(Request $request, SslCommerzNotification $sslCommerz)
    {
        if (!$request->filled('tran_id')) {
            return response('Invalid transaction data.', 422);
        }

        $result = $this->validateAndCompletePayment(
            $request,
            $sslCommerz,
            $request->input('tran_id')
        );

        if (in_array($result, ['completed', 'already_completed'], true)) {
            return response('Transaction successfully completed.', 200);
        }

        return response('Transaction could not be validated.', $result === 'invalid' ? 404 : 422);
    }

    private function validateAndCompletePayment(
        Request $request,
        SslCommerzNotification $sslCommerz,
        mixed $transactionId
    ): string {
        if (!is_string($transactionId) || $transactionId === '' || strlen($transactionId) > 30) {
            return 'invalid';
        }

        $payment = DB::table('payments')->where('transaction_id', $transactionId)->first();
        if (!$payment) {
            return 'invalid';
        }
        $tenant = Tenant::find($payment->tenant_id);
        if (!$tenant || $tenant->status !== 'active') {
            return 'invalid';
        }
        app(TenantContext::class)->set($tenant);

        if (in_array($payment->status, ['Processing', 'Complete'], true)) {
            return 'already_completed';
        }

        if ($payment->status !== 'Pending'
            || !$sslCommerz->orderValidate(
                $request->all(),
                $transactionId,
                $payment->amount,
                $payment->currency
            )) {
            return 'validation_failed';
        }

        return DB::transaction(function () use ($transactionId) {
            $lockedPayment = DB::table('payments')
                ->where('transaction_id', $transactionId)
                ->lockForUpdate()
                ->first();

            if (!$lockedPayment) {
                return 'invalid';
            }

            if (in_array($lockedPayment->status, ['Processing', 'Complete'], true)) {
                return 'already_completed';
            }

            if ($lockedPayment->status !== 'Pending') {
                return 'validation_failed';
            }

            $statement = MonthlyStatement::where([
                'token_no' => $lockedPayment->token_no,
                'year' => $lockedPayment->year,
                'month' => $lockedPayment->month,
            ])->lockForUpdate()->first();

            if (!$statement) {
                return 'invalid';
            }

            DB::table('payments')
                ->where('tenant_id', $lockedPayment->tenant_id)
                ->where('id', $lockedPayment->id)
                ->where('status', 'Pending')
                ->update(['status' => 'Processing']);

            $totalPayment = (float) $statement->total_payment + (float) $lockedPayment->amount;
            $balance = (float) $statement->total_cost - $totalPayment;
            DB::table('monthly_statements')
                ->where('tenant_id', $lockedPayment->tenant_id)
                ->where('id', $statement->id)->update([
                'total_payment' => $totalPayment,
                'give' => max($balance, 0),
                'take' => max(-$balance, 0),
            ]);

            return 'completed';
        });
    }

    private function setPendingPaymentStatus(mixed $transactionId, string $status): void
    {
        if (!is_string($transactionId) || $transactionId === '' || strlen($transactionId) > 30) {
            return;
        }

        DB::table('payments')
            ->where('transaction_id', $transactionId)
            ->where('status', 'Pending')
            ->update(['status' => $status]);
    }

    private function newTransactionId(): string
    {
        do {
            $transactionId = Str::upper(Str::random(30));
        } while (DB::table('payments')->where('transaction_id', $transactionId)->exists());

        return $transactionId;
    }

    private function paymentSummaryUrl(string $status): string
    {
        $transactionId = request()->input('tran_id');
        $payment = is_string($transactionId)
            ? DB::table('payments')->where('transaction_id', $transactionId)->first()
            : null;
        $tenant = $payment ? Tenant::query()->find($payment->tenant_id) : null;
        if (!$tenant) {
            return PaymentUrls::frontend('/login', ['payment' => $status]);
        }

        return PaymentUrls::frontend('/t/'.rawurlencode($tenant->slug).'/payment_summary', [
            'payment' => $status,
        ]);
    }
}
