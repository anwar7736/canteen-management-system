<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantSignupVerification extends Model
{
    protected $fillable = [
        'email',
        'otp_hash',
        'signup_token_hash',
        'attempts',
        'expires_at',
        'verified_at',
        'consumed_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];
}
