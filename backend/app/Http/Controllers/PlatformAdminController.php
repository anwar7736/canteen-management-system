<?php

namespace App\Http\Controllers;

use App\Actions\CreateTenantWorkspace;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPayment;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\PlatformImpersonation;
use App\Models\User;
use App\Tenancy\TenantContext;
use App\Tenancy\TenantScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PlatformAdminController extends Controller
{
    public function tenants()
    {
        return Tenant::query()
            ->withCount(['users' => fn ($query) => $query->withoutGlobalScope(TenantScope::class)])
            ->with(['subscriptions' => fn ($query) => $query->latest('id')->limit(1), 'subscriptions.plan'])
            ->orderByDesc('id')
            ->paginate(25);
    }

    public function showTenant(Tenant $tenant)
    {
        return $tenant
            ->loadCount(['users' => fn ($query) => $query->withoutGlobalScope(TenantScope::class)])
            ->load(['subscriptions' => fn ($query) => $query->latest('id')->limit(1), 'subscriptions.plan']);
    }

    public function createTenant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_name' => ['required', 'string', 'max:255'],
            'tenant_slug' => ['sometimes', 'required', 'string', 'min:3', 'max:63', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:tenants,slug'],
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:32'],
            'password' => ['required', 'string', 'min:12', 'max:255', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
            'plan_id' => ['required', 'integer', Rule::exists('subscription_plans', 'id')->where('active', true)],
        ]);
        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);
        [$tenant, $owner] = app(CreateTenantWorkspace::class)->handle($validated, $plan);

        return response()->json([
            'tenant' => $tenant,
            'owner' => $owner->only(['id', 'name', 'username', 'email', 'phone', 'role', 'status']),
        ], 201);
    }

    public function updateTenant(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'min:3', 'max:63', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('tenants', 'slug')->ignore($tenant->getKey())],
            'status' => ['sometimes', 'required', Rule::in(['active', 'suspended'])],
            'plan_id' => ['sometimes', 'required', 'integer', Rule::exists('subscription_plans', 'id')->where('active', true)],
        ]);

        $tenant->fill(array_intersect_key($validated, array_flip(['name', 'slug', 'status'])))->save();

        if (array_key_exists('plan_id', $validated)) {
            $subscription = $tenant->subscriptions()->latest('id')->first();
            if ($subscription) {
                $subscription->update(['plan_id' => $validated['plan_id']]);
            } else {
                TenantSubscription::create([
                    'tenant_id' => $tenant->getKey(),
                    'plan_id' => $validated['plan_id'],
                    'status' => 'active',
                    'starts_at' => now(),
                    'current_period_start' => now(),
                ]);
            }
        }

        return $tenant->fresh()
            ->loadCount(['users' => fn ($query) => $query->withoutGlobalScope(TenantScope::class)])
            ->load(['subscriptions' => fn ($query) => $query->latest('id')->limit(1), 'subscriptions.plan']);
    }

    public function deleteTenant(Tenant $tenant): JsonResponse
    {
        DB::transaction(function () use ($tenant) {
            $users = User::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $tenant->getKey())
                ->get(['id']);
            $userIds = $users->pluck('id');

            DB::table('personal_access_tokens')
                ->where('tokenable_type', (new User())->getMorphClass())
                ->whereIn('tokenable_id', $userIds)
                ->delete();
            DB::table('users')->where('tenant_id', $tenant->getKey())->delete();
            $tenant->delete();
        });

        return response()->json(['message' => 'Canteen and its linked workspace data were deleted.']);
    }

    public function users(Tenant $tenant)
    {
        return User::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->getKey())
            ->select(['id', 'tenant_id', 'name', 'username', 'email', 'phone', 'token_no', 'role', 'status', 'address'])
            ->orderBy('role')
            ->orderBy('name')
            ->paginate(25);
    }

    public function impersonations(Tenant $tenant)
    {
        return PlatformImpersonation::query()
            ->where('tenant_id', $tenant->getKey())
            ->orderByDesc('started_at')
            ->paginate(10);
    }

    public function createUser(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->where('tenant_id', $tenant->getKey())],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->where('tenant_id', $tenant->getKey())],
            'phone' => ['required', 'string', 'max:32', Rule::unique('users', 'phone')->where('tenant_id', $tenant->getKey())],
            'role' => ['required', Rule::in(['admin', 'user'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'address' => ['nullable', 'string', 'max:2000'],
            'password' => ['required', 'string', 'min:12', 'max:255', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ]);
        $validated['tenant_id'] = $tenant->getKey();
        $validated['token_no'] = $this->newTokenNumber($tenant);
        $validated['password'] = Hash::make($validated['password']);
        unset($validated['password_confirmation']);

        $user = User::create($validated);

        return response()->json([
            'data' => $user->only(['id', 'name', 'username', 'email', 'phone', 'token_no', 'role', 'status', 'address']),
        ], 201);
    }

    public function updateUser(Request $request, Tenant $tenant, int $userId): JsonResponse
    {
        $user = $this->findTenantUser($tenant, $userId);
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'username')->where('tenant_id', $tenant->getKey())->ignore($user->getKey())],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->where('tenant_id', $tenant->getKey())->ignore($user->getKey())],
            'phone' => ['sometimes', 'required', 'string', 'max:32', Rule::unique('users', 'phone')->where('tenant_id', $tenant->getKey())->ignore($user->getKey())],
            'role' => ['sometimes', 'required', Rule::in(['admin', 'user'])],
            'status' => ['sometimes', 'required', Rule::in(['active', 'inactive'])],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'password' => ['sometimes', 'nullable', 'string', 'min:12', 'max:255', 'confirmed'],
            'password_confirmation' => ['required_with:password', 'string'],
        ]);
        unset($validated['password_confirmation']);
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }
        $user->fill($validated)->save();

        return response()->json([
            'data' => $user->only(['id', 'name', 'username', 'email', 'phone', 'token_no', 'role', 'status', 'address']),
        ]);
    }

    public function deleteUser(Tenant $tenant, int $userId): JsonResponse
    {
        $user = $this->findTenantUser($tenant, $userId);
        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            DB::table('email_otp_verification')
                ->where('tenant_id', $user->tenant_id)
                ->where('email', $user->email)
                ->delete();
            $user->delete();
        });

        return response()->json(['message' => 'User and linked records were deleted.']);
    }

    public function sendUserPasswordReset(Tenant $tenant, int $userId): JsonResponse
    {
        $user = $this->findTenantUser($tenant, $userId);
        app(TenantContext::class)->set($tenant);
        app(PasswordController::class)->sendPasswordResetFor($user);

        return response()->json(['message' => 'Password reset instructions were sent to the user.']);
    }

    public function startImpersonation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'min:8', 'max:500'],
        ]);
        $target = User::withoutGlobalScope(TenantScope::class)
            ->whereNotNull('tenant_id')
            ->findOrFail($validated['user_id']);
        $tenant = Tenant::findOrFail($target->tenant_id);
        abort_unless($target->status === 'active' && $tenant->status === 'active', 422, 'Only active tenant accounts can be impersonated.');

        $expiresAt = now()->addMinutes(15);
        [$impersonation, $plainToken] = DB::transaction(function () use ($request, $target, $tenant, $validated, $expiresAt) {
            $createdToken = $target->createToken('platform-impersonation', [$target->role], $expiresAt);
            $impersonation = PlatformImpersonation::create([
                'platform_admin_id' => $request->user()->getKey(),
                'platform_admin_username' => $request->user()->username,
                'target_user_id' => $target->getKey(),
                'target_username' => $target->username,
                'tenant_id' => $tenant->getKey(),
                'tenant_name' => $tenant->name,
                'tenant_slug' => $tenant->slug,
                'access_token_id' => $createdToken->accessToken->getKey(),
                'reason' => $validated['reason'],
                'started_at' => now(),
                'expires_at' => $expiresAt,
            ]);

            return [$impersonation, $createdToken->plainTextToken];
        });

        return response()->json([
            'id' => $impersonation->getKey(),
            'api_token' => $plainToken,
            'expires_at' => $expiresAt->toIso8601String(),
            'user' => $target->only(['id', 'name', 'username', 'email', 'phone', 'token_no', 'address', 'role']),
            'tenant' => $tenant->only(['id', 'name', 'slug']),
        ], 201);
    }

    public function endImpersonation(Request $request, PlatformImpersonation $impersonation): JsonResponse
    {
        $actor = $request->user();
        $isPlatformAdmin = $actor->role === 'platform_admin'
            && (int) $actor->getKey() === (int) $impersonation->platform_admin_id;
        $isImpersonatedUser = (int) $actor->getKey() === (int) $impersonation->target_user_id
            && (int) ($actor->currentAccessToken()?->getKey() ?? 0) === (int) ($impersonation->access_token_id ?? -1);
        abort_unless($isPlatformAdmin || $isImpersonatedUser, 403);

        DB::transaction(function () use ($impersonation) {
            if ($impersonation->access_token_id) {
                DB::table('personal_access_tokens')->where('id', $impersonation->access_token_id)->delete();
            }
            if (!$impersonation->ended_at) {
                $impersonation->update(['ended_at' => now()]);
            }
        });

        return response()->json(['message' => 'Impersonation ended.']);
    }

    public function plans()
    {
        return SubscriptionPlan::query()->orderBy('price')->get();
    }

    public function payments()
    {
        return SubscriptionPayment::query()
            ->with(['tenant:id,name,slug', 'plan:id,name,slug'])
            ->orderByDesc('id')
            ->paginate(25);
    }

    public function savePlan(Request $request, ?SubscriptionPlan $plan = null)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('subscription_plans', 'slug')->ignore($plan?->getKey())],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'currency' => ['required', Rule::in(['BDT'])],
            'interval' => ['required', Rule::in(['monthly', 'yearly'])],
            'trial_days' => ['required', 'integer', 'between:0,90'],
            'max_members' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'features' => ['nullable', 'array'],
            'active' => ['required', 'boolean'],
        ]);

        $plan ??= new SubscriptionPlan();
        $plan->fill($validated)->save();

        return response()->json($plan->fresh(), $plan->wasRecentlyCreated ? 201 : 200);
    }

    private function findTenantUser(Tenant $tenant, int $userId): User
    {
        return User::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->getKey())
            ->findOrFail($userId);
    }

    private function newTokenNumber(Tenant $tenant): int
    {
        do {
            $tokenNumber = random_int(111111, 999999);
        } while (User::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->getKey())
            ->where('token_no', $tokenNumber)
            ->exists());

        return $tokenNumber;
    }
}
