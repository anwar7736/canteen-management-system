<?php

namespace Tests;

use App\Models\Tenant;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Schema;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        if (!Schema::hasTable('tenants')) {
            return;
        }

        $tenant = Tenant::query()->first();
        if ($tenant) {
            app(TenantContext::class)->set($tenant);
            $this->withHeader('X-Tenant-Slug', $tenant->slug);
        }
    }
}
