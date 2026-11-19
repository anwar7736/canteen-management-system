<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DailyMealItem;
use App\Models\Tenant;
use App\Tenancy\TenantContext;

class DailyMealItemSeeder extends Seeder
{

    public function run()
    {
        $tenant = Tenant::query()->first();
        if ($tenant) {
            app(TenantContext::class)->set($tenant);
        }

        $tenantId = $tenant?->getKey();
        $data = [
            ['tenant_id' => $tenantId, 'day' => 'শনিবার', 'lunch_item' => 'মুরগীর মাংস, সবজি, ডাল', 'dinner_item' => 'বড় মাছ, ভর্তা, ডাল'],
            ['tenant_id' => $tenantId, 'day' => 'রবিবার', 'lunch_item' => 'বড় মাংস, সবজি, ডাল', 'dinner_item' => 'ছোট মাছ, ভর্তা, ডাল'],
            ['tenant_id' => $tenantId, 'day' => 'সোমবার', 'lunch_item' => 'ডিম, ভর্তা, ডাল', 'dinner_item' => 'বড় মাছ, সবজি, ডাল'],
            ['tenant_id' => $tenantId, 'day' => 'মঙ্গলবার', 'lunch_item' => 'মুরগীর মাংস, সবজি, ডাল', 'dinner_item' => 'মলা মাছ ভর্তা, ডাল'],
            ['tenant_id' => $tenantId, 'day' => 'বুধবার', 'lunch_item' => 'বড় মাছ, শাক-সবজি, ডাল', 'dinner_item' => 'বড় মাছ, আলু ভর্তা, ডাল'],
            ['tenant_id' => $tenantId, 'day' => 'বৃহস্পতিবার', 'lunch_item' => 'ছোট মাছ, ভর্তা, ডাল', 'dinner_item' => 'ভুনা খিচুড়ি, সবজি, ডাল'],
            ['tenant_id' => $tenantId, 'day' => 'শুক্রবার', 'lunch_item' => 'গরুর মাংস, সবজি, ডাল', 'dinner_item' => 'ডিম, শাক, ডাল']
        ];

        foreach ($data as $item) {
            DailyMealItem::updateOrCreate(
                ['tenant_id' => $tenantId, 'day' => $item['day']],
                ['lunch_item' => $item['lunch_item'], 'dinner_item' => $item['dinner_item']]
            );
        }
    }
}
