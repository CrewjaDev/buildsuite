<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EstimateBreakdown extends Model
{
    use SoftDeletes;

    // UUID設定
    protected $keyType = 'string';
    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $connection = 'pgsql';

    protected $fillable = [
        'estimate_id',
        'parent_id',
        'breakdown_type',
        'name',
        'description',
        'display_order',
        'direct_amount',
        'calculated_amount',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'estimate_id' => 'string',
        'parent_id' => 'string',
        'direct_amount' => 'integer',
        'calculated_amount' => 'integer',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    // リレーション
    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(EstimateBreakdown::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(EstimateBreakdown::class, 'parent_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(EstimateItem::class, 'breakdown_id');
    }
}
