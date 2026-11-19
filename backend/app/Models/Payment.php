<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Concerns\BelongsToTenant;

class Payment extends Model
{
    use BelongsToTenant, HasFactory;

    public const NON_SETTLED_STATUSES = ['Pending', 'Failed', 'Canceled'];

    public $timestamps = false;

    public function scopeSettled(Builder $query): Builder
    {
        return $query->whereNotIn('status', self::NON_SETTLED_STATUSES);
    }

    protected $casts = [
        'token_no' => 'string',
        'amount' => 'float',
    ];
}
