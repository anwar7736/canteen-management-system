<?php

namespace App\Tenancy;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(TenantContext::class);
        $tenantId = $context->id();

        if ($tenantId !== null) {
            $builder->where($model->qualifyColumn('tenant_id'), $tenantId);
        } elseif ($context->isPlatformContext()) {
            $builder->whereNull($model->qualifyColumn('tenant_id'));
        } elseif (!app()->runningInConsole()) {
            $builder->whereRaw('1 = 0');
        }
    }
}
