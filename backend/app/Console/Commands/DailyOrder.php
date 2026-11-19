<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use App\Notifications\OrderReminder;
use App\Models\User;
use App\Models\Tenant;
use App\Tenancy\TenantContext;

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
        $tenantContext = app(TenantContext::class);

        Tenant::query()->where('status', 'active')->eachById(function (Tenant $tenant) use ($tenantContext, $date) {
            $tenantContext->set($tenant);
            User::where('role', 'user')
                ->whereNotExists(function ($query) use ($date) {
                    $query->selectRaw('1')
                        ->from('order_meals')
                        ->whereColumn('order_meals.token_no', 'users.token_no')
                        ->where('order_meals.meal_given_date', $date)
                        ->where('order_meals.tenant_id', app(TenantContext::class)->id())
                        ->whereNull('order_meals.deleted_at');
                })
                ->chunkById(500, function ($users) use ($tenant) {
                    foreach ($users as $user) {
                        Notification::send($user, new OrderReminder($user->name));
                    }
                });
        });

    }
}
