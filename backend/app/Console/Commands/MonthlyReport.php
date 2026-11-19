<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use App\Notifications\MonthlyReportNotification;
use App\Models\User;
use App\Models\MonthlyStatement;
use App\Models\Tenant;
use App\Tenancy\TenantContext;

class MonthlyReport extends Command
{

    protected $signature = 'monthly:report';

    protected $description = 'Command description';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        $tenantContext = app(TenantContext::class);
        Tenant::query()->where('status', 'active')->eachById(function (Tenant $tenant) use ($tenantContext) {
            $tenantContext->set($tenant);
            $users = User::where('role', 'user')->get();
            foreach ($users as $user) {
                $year = date('Y');
                $months = [
                    'January', 'February', 'March',
                    'April', 'May', 'June',
                    'July', 'August', 'September',
                    'October', 'November', 'December',
                ];
                $month = $months[date('m')-1];
            
                $statement = MonthlyStatement::where(['year'=>$year,'month'=>$month,'token_no'=>$user->token_no])->first();
                if (!$statement) {
                    continue;
                }

                Notification::send($user, new MonthlyReportNotification(
                        $user->name, $month, $year, $statement->total_lunch,
                        $statement->lunch_cost, $statement->total_dinner,
                        $statement->dinner_cost, $statement->total_meal,
                        $statement->total_cost, $statement->total_payment,
                        $statement->give
                ));
            }
        });
    }
}
