<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use App\Notifications\OrderReminder;
use App\Models\User;

class DailyOrder extends Command
{

    protected $signature = 'daily:order';

    protected $description = 'Daily Order Reminder';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        $date = now('Asia/Dhaka')->addDay()->toDateString();

        User::where('role', 'user')
            ->whereNotExists(function ($query) use ($date) {
                $query->selectRaw('1')
                    ->from('order_meals')
                    ->whereColumn('order_meals.token_no', 'users.token_no')
                    ->where('order_meals.meal_given_date', $date)
                    ->whereNull('order_meals.deleted_at');
            })
            ->chunkById(500, function ($users) {
                foreach ($users as $user) {
                    Notification::send($user, new OrderReminder($user->name));
                }
            });

    }
}
