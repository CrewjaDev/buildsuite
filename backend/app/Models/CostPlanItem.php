<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CostPlanItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'cost_plan_id',
        'estimate_item_id',
        'supplier_id',
        'estimated_cost',
        'actual_cost',
        'remarks',
    ];

    protected $casts = [
        'estimated_cost' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // リレーション
    public function costPlan()
    {
        return $this->belongsTo(CostPlan::class);
    }

    public function estimateItem()
    {
        return $this->belongsTo(EstimateItem::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Partner::class, 'supplier_id');
    }

    // スコープ
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function scopeBySupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    // アクセサ
    public function getIsActiveAttribute()
    {
        return is_null($this->deleted_at);
    }

    public function getCostDifferenceAttribute()
    {
        return $this->actual_cost - $this->estimated_cost;
    }

    // ブートメソッド（UUID自動生成）
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = \Illuminate\Support\Str::uuid();
            }
        });
    }
}
