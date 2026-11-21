<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class PublicTenantController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'tenants' => Tenant::query()
                ->leftJoin('admin_profile', 'admin_profile.tenant_id', '=', 'tenants.id')
                ->where('status', 'active')
                ->orderBy('tenants.name')
                ->get([
                    'tenants.name',
                    'tenants.slug',
                    DB::raw('COALESCE(admin_profile.shop_address, \'\') as location'),
                ]),
        ]);
    }
}
