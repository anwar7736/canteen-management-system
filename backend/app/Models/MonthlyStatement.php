<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class MonthlyStatement extends Model
{
    use BelongsToTenant, HasFactory;
    public $timestamps = false;

    protected $casts = [
        'total_payment' => 'float',
        'give' => 'float',
        'take' => 'float',
    ];
}
