<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantMembership
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $tenantId = app(TenantContext::class)->id();

        if (!$user || $tenantId === null || (int) $user->tenant_id !== $tenantId) {
            abort(403, 'You do not have access to this canteen.');
        }

        return $next($request);
    }
}
