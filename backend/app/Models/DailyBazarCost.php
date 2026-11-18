<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyBazarCost extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $casts = [
        'amount' => 'float',
    ];
    protected $fillable = ['year', 'month', 'date', 'name', 'amount'];
}
