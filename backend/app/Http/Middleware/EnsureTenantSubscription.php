<?php

namespace App\Http\Middleware;

use App\Models\TenantSubscription;
use App\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = app(TenantContext::class)->id();
        $subscription = $tenantId === null
            ? null
            : TenantSubscription::query()
                ->where('tenant_id', $tenantId)
                ->latest('id')
                ->first();

        $allowedStatuses = ['active', 'trialing', 'canceled'];
        if (
            !$subscription ||
            !in_array($subscription->status, $allowedStatuses, true) ||
            ($subscription->current_period_end && $subscription->current_period_end->isPast())
        ) {
            return response()->json([
                'message' => 'This canteen subscription is expired. Renew the plan to continue.',
                'code' => 'subscription_expired',
            ], 402);
        }

        return $next($request);
    }
}
