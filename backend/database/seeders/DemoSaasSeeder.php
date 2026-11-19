<?php

namespace Database\Seeders;

use App\Models\User;
use App\Tenancy\TenantScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSaasSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command->error('The demo SaaS seeder is not allowed in production.');
            return;
        }

        $admin = User::withoutGlobalScope(TenantScope::class)
            ->whereNull('tenant_id')
            ->where('username', 'platform-admin')
            ->first();

        if (!$admin) {
            $admin = new User();
            $admin->tenant_id = null;
            $admin->name = 'Platform Admin';
            $admin->username = 'platform-admin';
            $admin->email = 'admin@example.com';
            $admin->phone = '';
            $admin->token_no = random_int(111111, 999999);
        }

        $admin->role = 'platform_admin';
        $admin->status = 'active';
        $admin->password = Hash::make('Anwar@2026@#');
        $admin->save();

        $this->command->info('Platform admin: platform-admin');
    }
}
