<?php

namespace App\Billing;

use App\Models\SubscriptionPlan;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Tenancy\TenantScope;

class TenantMemberCapacity
{
    public function assertCanAddMember(int $tenantId): void
    {
        $subscription = TenantSubscription::query()
            ->where('tenant_id', $tenantId)
            ->latest('id')
            ->lockForUpdate()
            ->firstOrFail();
        $plan = SubscriptionPlan::query()->findOrFail($subscription->plan_id);
        $memberLimit = $plan->max_members;

        if ($memberLimit === null) {
            return;
        }

        $memberCount = User::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('role', 'user')
            ->count();

        if ($memberCount >= $memberLimit) {
            abort(422, "The {$plan->name} plan allows up to {$memberLimit} members. Upgrade your plan to add more.");
        }
    }
}
