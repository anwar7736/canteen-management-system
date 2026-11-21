<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberSignupVerification extends Model
{
    protected $fillable = [
        'tenant_id',
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
