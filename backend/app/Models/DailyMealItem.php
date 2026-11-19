<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class DailyMealItem extends Model
{
    protected $table = 'daily_meal_items';
    // public $timestamps = false;
    use BelongsToTenant, HasFactory;
}
