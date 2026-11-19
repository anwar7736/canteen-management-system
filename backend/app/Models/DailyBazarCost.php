<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class DailyBazarCost extends Model
{
    use BelongsToTenant, HasFactory;

    public $timestamps = false;

    protected $casts = [
        'amount' => 'float',
    ];
    protected $fillable = ['year', 'month', 'date', 'name', 'amount'];
}
