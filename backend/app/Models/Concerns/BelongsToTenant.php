<?php

namespace App\Models\Concerns;

use App\Tenancy\TenantContext;
use App\Tenancy\TenantScope;
use Illuminate\Database\Eloquent\Model;
use LogicException;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function (Model $model): void {
            if ($model->getAttribute('tenant_id') !== null) {
                return;
            }

            $tenantId = app(TenantContext::class)->id();
            if ($tenantId !== null) {
                $model->setAttribute('tenant_id', $tenantId);
                return;
            }

            if (!app()->runningInConsole()) {
                throw new LogicException('A tenant context is required to create tenant-owned records.');
            }
        });
    }
}
