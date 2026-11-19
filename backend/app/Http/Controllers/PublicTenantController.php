<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\JsonResponse;

class PublicTenantController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'tenants' => Tenant::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['name', 'slug']),
        ]);
    }
}
