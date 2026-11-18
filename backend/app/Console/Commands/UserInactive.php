<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserInactive extends Command
{

    protected $signature = 'user:inactive';

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

        User::where('role', 'user')
            ->select('id', 'token_no')
            ->chunkById(500, function ($users) use ($paymentsByToken) {
                $inactiveIds = $users
                    ->filter(fn ($user) => (float) $paymentsByToken->get($user->token_no, 0) < 1500)
                    ->pluck('id');

                if ($inactiveIds->isNotEmpty()) {
                    User::whereIn('id', $inactiveIds)->update(['status' => 'inactive']);
                }
            });
    }
}
