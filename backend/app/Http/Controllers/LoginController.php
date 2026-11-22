<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Tenancy\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function onLogin(Request $req)
    {
        $validated = $req->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);
        $username = trim($validated['username']);
        $password = $validated['password'];
        $userInfo = $this->findTenantAccount($username, $password, 'user');

        if (!$userInfo) {
            return 0;
        }

        if ($userInfo->status !== 'active') {
            return 'inactive';
        }

        $user = $userInfo->toArray();
        $user['api_token'] = $userInfo->createToken('user-panel', ['user'])->plainTextToken;

        return ['user', $user];
    }

    public function AdminLogin(Request $req)
    {
        $validated = $req->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);
        $admin = $this->findTenantAccount(trim($validated['username']), $validated['password'], 'admin');

        if (!$admin || $admin->status !== 'active') {
            return 0;
        }

        $user = $admin->toArray();
        $user['api_token'] = $admin->createToken('admin-panel', ['admin'])->plainTextToken;

        return $user;
    }

    public function tenantOptions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'role' => ['required', 'in:user,admin'],
        ]);
        $username = strtolower(trim($validated['username']));

        $accounts = User::withoutGlobalScope(TenantScope::class)
            ->join('tenants', 'tenants.id', '=', 'users.tenant_id')
            ->where('tenants.status', 'active')
            ->where('users.role', $validated['role'])
            ->where('users.status', 'active')
            ->where(function ($query) use ($username) {
                $query->whereRaw('LOWER(users.username) = ?', [$username])
                    ->orWhereRaw('LOWER(users.email) = ?', [$username]);
            })
            ->get([
                'users.id',
                'users.tenant_id',
                'users.password',
                'tenants.name as matched_tenant_name',
                'tenants.slug as matched_tenant_slug',
            ])
            ->filter(fn (User $account) => Hash::check($validated['password'], $account->password))
            ->groupBy('tenant_id');

        if ($accounts->isEmpty()) {
            return response()->json([
                'message' => 'Username/email or password is incorrect, or the account is inactive.',
            ], 401);
        }

        if ($accounts->contains(fn (Collection $matches) => $matches->count() > 1)) {
            return response()->json([
                'message' => 'More than one account matches in a canteen. Please sign in with your username.',
            ], 409);
        }

        return response()->json([
            'tenants' => $accounts
                ->map(fn (Collection $matches) => [
                    'name' => $matches->first()->matched_tenant_name,
                    'slug' => $matches->first()->matched_tenant_slug,
                ])
                ->sortBy('name')
                ->values(),
        ]);
    }

    public function PlatformLogin(Request $req)
    {
        $validated = $req->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);
        $admin = User::withoutGlobalScope(TenantScope::class)
            ->whereNull('tenant_id')
            ->where('username', $validated['username'])
            ->first();

        if (!$admin || $admin->role !== 'platform_admin' || $admin->status !== 'active'
            || !Hash::check($validated['password'], $admin->password)) {
            return 0;
        }

        $user = $admin->toArray();
        $user['api_token'] = $admin->createToken('platform-admin', ['platform_admin'])->plainTextToken;

        return $user;
    }

    private function findTenantAccount(string $username, string $password, string $role): ?User
    {
        $normalizedUsername = strtolower($username);

        return User::query()
            ->where('role', $role)
            ->where(function ($query) use ($normalizedUsername) {
                $query->whereRaw('LOWER(username) = ?', [$normalizedUsername])
                    ->orWhereRaw('LOWER(email) = ?', [$normalizedUsername]);
            })
            ->get()
            ->first(fn (User $account) => Hash::check($password, $account->password));
    }
}

