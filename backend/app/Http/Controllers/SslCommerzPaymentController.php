<?php

namespace App\Http\Controllers;

use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\MonthlyStatement;
use App\Models\User;
use App\Models\Tenant;
use App\Tenancy\TenantContext;
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

    public function onlineSSLPayment()
    {
        $tokens = User::get('token_no');

        return view('onlineSSLPayment', compact('tokens'));
    }

    public function index(Request $request, SslCommerzNotification $sslCommerz): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'between:2000,2100'],
            'month' => ['required', 'string', 'in:'.implode(',', self::MONTHS)],
            'customer_name' => ['required', 'string', 'max:50'],
            'customer_token' => ['required', 'integer', 'exists:users,token_no'],
            'customer_email' => ['required', 'email', 'max:50'],
            'customer_mobile' => ['required', 'string', 'max:20'],
            'cutomer_addr' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'decimal:0,2', 'between:10,500000'],
        ]);

        if (!filled(config('sslcommerz.apiCredentials.store_id'))
            || !filled(config('sslcommerz.apiCredentials.store_password'))) {
            abort(503, 'SSLCommerz sandbox credentials are not configured.');
        }

        $transactionId = $this->newTransactionId();
        $amount = number_format((float) $validated['amount'], 2, '.', '');
        $paymentData = [
            'total_amount' => $amount,
            'currency' => 'BDT',
            'tran_id' => $transactionId,
            'year' => $validated['year'],
            'month' => $validated['month'],
            'cus_name' => $validated['customer_name'],
            'cus_token' => $validated['customer_token'],
            'cus_email' => $validated['customer_email'],
            'cus_add1' => $validated['cutomer_addr'],
            'cus_add2' => '',
            'cus_city' => 'Dhaka',
            'cus_state' => '',
            'cus_postcode' => '1000',
            'cus_country' => 'Bangladesh',
            'cus_phone' => $validated['customer_mobile'],
            'cus_fax' => '',
            'ship_name' => 'Canteen',
            'ship_add1' => $validated['cutomer_addr'],
            'ship_add2' => '',
            'ship_city' => 'Dhaka',
            'ship_state' => '',
            'ship_postcode' => '1000',
            'ship_phone' => $validated['customer_mobile'],
            'ship_country' => 'Bangladesh',
            'shipping_method' => 'NO',
            'product_name' => 'Canteen meal payment',
            'product_category' => 'Meal',
            'product_profile' => 'non-physical-goods',
            'ipn_url' => url('/ipn'),
        ];

        $gatewayResponse = $sslCommerz->makePayment($paymentData, 'checkout', 'json');
        $gatewayResponse = is_array($gatewayResponse)
            ? $gatewayResponse
            : json_decode((string) $gatewayResponse, true);
        $gatewayUrl = is_array($gatewayResponse) ? ($gatewayResponse['data'] ?? null) : null;

        if (!is_string($gatewayUrl)
            || strtolower((string) ($gatewayResponse['status'] ?? '')) !== 'success'
            || !filter_var($gatewayUrl, FILTER_VALIDATE_URL)
            || parse_url($gatewayUrl, PHP_URL_SCHEME) !== 'https') {
            abort(502, 'SSLCommerz could not start the sandbox payment.');
        }

        $now = now('Asia/Dhaka');
        $tenantId = app(TenantContext::class)->id();
        if ($tenantId === null) {
            abort(400, 'A tenant context is required to start payment.');
        }
        DB::table('payments')->insert([
            'tenant_id' => $tenantId,
            'year' => $validated['year'],
            'month' => $validated['month'],
            'name' => $validated['customer_name'],
            'token_no' => $validated['customer_token'],
            'email' => $validated['customer_email'],
            'phone' => $validated['customer_mobile'],
            'amount' => $amount,
            'address' => $validated['cutomer_addr'],
            'transaction_id' => $transactionId,
            'status' => 'Pending',
            'currency' => 'BDT',
            'payment_date' => $now->toDateString(),
            'payment_time' => $now->format('h:i:sa'),
        ]);

        return redirect()->away($gatewayUrl);
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

            DB::table('payments')
                ->where('tenant_id', $lockedPayment->tenant_id)
                ->where('id', $lockedPayment->id)
                ->where('status', 'Pending')
                ->update(['status' => 'Processing']);

            $statement = MonthlyStatement::where([
                'token_no' => $lockedPayment->token_no,
                'year' => $lockedPayment->year,
                'month' => $lockedPayment->month,
            ])->lockForUpdate()->first();

            if ($statement) {
                $totalPayment = (float) $statement->total_payment + (float) $lockedPayment->amount;
                $balance = (float) $statement->total_cost - $totalPayment;
                DB::table('monthly_statements')
                    ->where('tenant_id', $lockedPayment->tenant_id)
                    ->where('id', $statement->id)->update([
                    'total_payment' => $totalPayment,
                    'give' => max($balance, 0),
                    'take' => max(-$balance, 0),
                ]);
            }

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
        return rtrim(config('app.frontend_url'), '/').'/payment_summary?payment='.urlencode($status);
    }
}
