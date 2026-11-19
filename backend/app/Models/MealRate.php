<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class MealRate extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'lunch_expiry_time',
        'dinner_expiry_time',
        'lunch_rate',
        'lunch_rate_bangla',
        'dinner_rate',
        'dinner_rate_bangla',
        'total_rate',
    ];
}
