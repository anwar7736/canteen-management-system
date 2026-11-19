<?php

namespace App\Http\Controllers;

use App\Models\MonthlyStatement;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Tenancy\TenantContext;

class PaymentDetailsController extends Controller
{
    private const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    public function AddPayment(Request $request)
    {
        $validated = $request->validate([
            'token_no' => ['required', 'integer', 'exists:users,token_no'],
            'year' => ['required', 'integer', 'between:2000,2100'],
            'month' => ['required', 'string', 'in:'.implode(',', self::MONTHS)],
            'status' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999.99'],
        ]);

        return DB::transaction(function () use ($validated) {
            $user = User::where('token_no', $validated['token_no'])->firstOrFail();
            $statement = $this->lockStatement(
                $validated['token_no'],
                $validated['year'],
                $validated['month']
            );
            $now = now('Asia/Dhaka');

            DB::table('payments')->insert([
                'tenant_id' => app(TenantContext::class)->id(),
                'year' => $validated['year'],
                'month' => $validated['month'],
                'name' => $user->name,
                'token_no' => $validated['token_no'],
                'email' => $user->email,
                'phone' => $user->phone,
                'amount' => $validated['amount'],
                'status' => $validated['status'],
                'address' => $user->address,
                'transaction_id' => Str::upper((string) Str::uuid()),
                'currency' => 'BDT',
                'payment_date' => $now->toDateString(),
                'payment_time' => $now->format('h:i:sa'),
            ]);

            $this->refreshStatement($statement);

            return 1;
        });
    }

    public function EditPayment(Request $request)
    {
        $validated = $request->validate([
            'payment_id' => ['required', 'integer', 'exists:payments,id'],
            'token_no' => ['required', 'integer', 'exists:users,token_no'],
            'year' => ['required', 'integer', 'between:2000,2100'],
            'month' => ['required', 'string', 'in:'.implode(',', self::MONTHS)],
            'status' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999.99'],
        ]);

        return DB::transaction(function () use ($validated) {
            $payment = Payment::whereKey($validated['payment_id'])->lockForUpdate()->firstOrFail();
            $user = User::where('token_no', $validated['token_no'])->firstOrFail();
            $periods = [
                [$payment->token_no, $payment->year, $payment->month],
                [$validated['token_no'], $validated['year'], $validated['month']],
            ];
            $statements = $this->lockStatements($periods);

            DB::table('payments')->where('tenant_id', app(TenantContext::class)->id())
                ->where('id', $payment->getKey())->update([
                'year' => $validated['year'],
                'month' => $validated['month'],
                'token_no' => $validated['token_no'],
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'amount' => $validated['amount'],
                'status' => $validated['status'],
            ]);

            foreach ($statements as $statement) {
                $this->refreshStatement($statement);
            }

            return 1;
        });
    }

    public function DeletePayment(int $payment_id)
    {
        return DB::transaction(function () use ($payment_id) {
            $payment = Payment::whereKey($payment_id)->lockForUpdate()->firstOrFail();
            $statement = $this->lockStatement($payment->token_no, $payment->year, $payment->month);

            DB::table('payments')->where('tenant_id', app(TenantContext::class)->id())
                ->where('id', $payment_id)->delete();
            $this->refreshStatement($statement);

            return 1;
        });
    }

    public function GetAllPayments()
    {
        return Payment::orderByDesc('id')->get();
    }

    public function GetAllPaymentByDate(Request $request)
    {
        $validated = $request->validate([
            'from_date' => ['required', 'date_format:Y-m-d'],
            'to_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:from_date'],
        ]);

        return Payment::whereBetween('payment_date', [$validated['from_date'], $validated['to_date']])
            ->orderByDesc('id')
            ->get();
    }

    public function GetPaymentById(int $payment_id)
    {
        return Payment::findOrFail($payment_id);
    }

    public function PaymentDetailsByUser(int $token_no)
    {
        return Payment::where('token_no', $token_no)->orderByDesc('id')->get();
    }

    public function PaymentDetailsFilterByDate(Request $request)
    {
        $validated = $request->validate([
            'token_no' => ['required', 'integer', 'exists:users,token_no'],
            'from_date' => ['required', 'date_format:Y-m-d'],
            'to_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:from_date'],
        ]);

        return Payment::where('token_no', $validated['token_no'])
            ->whereBetween('payment_date', [$validated['from_date'], $validated['to_date']])
            ->orderByDesc('id')
            ->get();
    }

    private function lockStatement(int|string $tokenNo, int|string $year, string $month): MonthlyStatement
    {
        return array_values($this->lockStatements([[$tokenNo, $year, $month]]))[0];
    }

    private function lockStatements(array $periods): array
    {
        $uniquePeriods = [];
        foreach ($periods as [$tokenNo, $year, $month]) {
            $key = implode('|', [(string) $tokenNo, (string) $year, $month]);
            $uniquePeriods[$key] = [$tokenNo, $year, $month];
        }
        ksort($uniquePeriods);

        $statements = [];
        foreach ($uniquePeriods as $key => [$tokenNo, $year, $month]) {
            $statement = MonthlyStatement::where([
                'token_no' => $tokenNo,
                'year' => $year,
                'month' => $month,
            ])->lockForUpdate()->first();

            if (!$statement) {
                abort(422, 'The monthly statement for this payment was not found.');
            }

            $statements[$key] = $statement;
        }

        return $statements;
    }

    private function refreshStatement(MonthlyStatement $statement): void
    {
        $totalPayment = Payment::settled()
            ->where('token_no', $statement->token_no)
            ->where('year', $statement->year)
            ->where('month', $statement->month)
            ->sum('amount');
        $giveTake = (float) $statement->total_cost - (float) $totalPayment;

        $statement->total_payment = $totalPayment;
        $statement->give = max($giveTake, 0);
        $statement->take = max(-$giveTake, 0);
        $statement->save();
    }
}
