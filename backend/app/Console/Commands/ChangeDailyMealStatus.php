<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\OrderMeal;
use App\Models\Tenant;
use App\Tenancy\TenantContext;

class ChangeDailyMealStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'status:pending';


    protected $description = 'Change Daily Meal Status';

  
    public function __construct()
    {
        parent::__construct();
    }

    
    public function handle()
    {
       $given_date = date('Y-m-d', strtotime("-1 day"));
       $tenantContext = app(TenantContext::class);
       Tenant::query()->where('status', 'active')->eachById(function (Tenant $tenant) use ($tenantContext, $given_date) {
           $tenantContext->set($tenant);
           OrderMeal::where(['meal_given_date'=>$given_date, 'status'=>'Processing'])->update(['status'=>'Pending']);
       });
    }
}
