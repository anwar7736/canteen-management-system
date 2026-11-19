<?php

namespace App\Tenancy;

use App\Models\Tenant;

class TenantContext
{
    private ?Tenant $tenant = null;
    private bool $platformContext = false;

    public function set(Tenant $tenant): void
    {
        $this->tenant = $tenant;
        $this->platformContext = false;
    }

    public function clear(): void
    {
        $this->tenant = null;
        $this->platformContext = false;
    }

    public function setPlatformContext(): void
    {
        $this->tenant = null;
        $this->platformContext = true;
    }

    public function tenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function id(): ?int
    {
        return $this->tenant?->getKey();
    }

    public function isPlatformContext(): bool
    {
        return $this->platformContext;
    }
}
