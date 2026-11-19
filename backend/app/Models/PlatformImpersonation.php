<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformImpersonation extends Model
{
    protected $fillable = [
        'platform_admin_id',
        'platform_admin_username',
        'target_user_id',
        'target_username',
        'tenant_id',
        'tenant_name',
        'tenant_slug',
        'access_token_id',
        'reason',
        'started_at',
        'expires_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'ended_at' => 'datetime',
    ];
}
