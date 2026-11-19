<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Tenancy\TenantScope;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class MakePlatformAdmin extends Command
{
    protected $signature = 'platform:admin:create {username} {email}';

    protected $description = 'Create a platform superadmin account.';

    public function handle(): int
    {
        $username = (string) $this->argument('username');
        $email = (string) $this->argument('email');
        $password = (string) $this->secret('Password (minimum 12 characters)');
        $confirmation = (string) $this->secret('Confirm password');

        $validator = Validator::make([
            'username' => $username,
            'email' => $email,
            'password' => $password,
            'confirmation' => $confirmation,
        ], [
            'username' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:12', 'max:255', 'same:confirmation'],
        ]);

        if ($validator->fails()) {
            $this->error($validator->errors()->first());
            return self::FAILURE;
        }

        $platformUsers = User::withoutGlobalScope(TenantScope::class)
            ->whereNull('tenant_id')
            ->where('role', 'platform_admin');
        if ($platformUsers->where(function ($query) use ($username, $email) {
            $query->where('username', $username)->orWhere('email', $email);
        })->exists()) {
            $this->error('A platform admin with that username or email already exists.');
            return self::FAILURE;
        }

        User::create([
            'name' => $username,
            'username' => $username,
            'email' => $email,
            'phone' => '',
            'token_no' => random_int(111111, 999999),
            'role' => 'platform_admin',
            'status' => 'active',
            'password' => Hash::make($password),
        ]);

        $this->info('Platform admin created.');

        return self::SUCCESS;
    }
}
