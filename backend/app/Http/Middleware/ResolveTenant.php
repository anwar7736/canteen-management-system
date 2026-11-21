<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->is('api/*')) {
            return $next($request);
        }

        if ($request->is('api/platform/*')) {
            app(TenantContext::class)->setPlatformContext();
            return $next($request);
        }

        if (
            $request->is('api/tenant/register') ||
            $request->is('api/tenant/register/*') ||
            $request->is('api/member/register') ||
            $request->is('api/member/register/*') ||
            $request->is('api/public/tenants')
        ) {
            return $next($request);
        }

        $slug = $request->header('X-Tenant-Slug');
        if (!is_string($slug) || $slug === '') {
            abort(400, 'A tenant slug is required.');
        }

        $tenant = Tenant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (!$tenant) {
            abort(404, 'Canteen not found or unavailable.');
        }

        app(TenantContext::class)->set($tenant);

        return $next($request);
    }
}
