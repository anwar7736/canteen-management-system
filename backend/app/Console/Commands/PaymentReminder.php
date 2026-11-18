<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\DB;
use App\Notifications\SomePaymentReminder;
use App\Models\Payment;
use App\Models\User;

class PaymentReminder extends Command
{

    protected $signature = 'some:payment';

    protected $description = 'Command description';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        $now = now('Asia/Dhaka');
        $firstDay = $now->copy()->startOfMonth()->toDateString();
        $lastDay = $now->copy()->endOfMonth()->toDateString();
        $paymentsByToken = DB::table('payments')
            ->whereNotIn('status', Payment::NON_SETTLED_STATUSES)
            ->whereBetween('payment_date', [$firstDay, $lastDay])
            ->select('token_no')
            ->selectRaw('SUM(amount) as total_payment')
            ->groupBy('token_no')
            ->pluck('total_payment', 'token_no');

        User::where('role', 'user')->chunkById(500, function ($users) use ($paymentsByToken) {
            foreach ($users as $user) {
                if ((float) $paymentsByToken->get($user->token_no, 0) < 1500) {
                    Notification::send($user, new SomePaymentReminder($user->name));
                }
            }
        });
    }
}
