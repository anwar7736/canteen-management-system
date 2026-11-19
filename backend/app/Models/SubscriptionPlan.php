<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'price',
        'currency',
        'interval',
        'trial_days',
        'max_members',
        'features',
        'active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'trial_days' => 'integer',
        'max_members' => 'integer',
        'features' => 'array',
        'active' => 'boolean',
    ];
}
