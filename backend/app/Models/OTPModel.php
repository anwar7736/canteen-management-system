<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class OTPModel extends Model
{
    use BelongsToTenant, HasFactory;

    public $table='email_otp_verification';
    public $primaryKey='id';
    public $incrementing=true;
    public $keyType='int';
    public $timestamps=false;

    protected $fillable = [
        'email',
        'otp',
        'time',
        'date',
        'expires_at',
        'verified_at',
        'reset_token_hash',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];
}
