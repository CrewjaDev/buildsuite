<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CostPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'estimate_id',
        'cost_plan_number',
        'name',
        'description',
        'status',
        'total_estimated_cost',
        'total_actual_cost',
        'profit_margin',
        'profit_amount',
        'created_by',
    ];

    protected $casts = [
        'total_estimated_cost' => 'decimal:2',
        'total_actual_cost' => 'decimal:2',
        'profit_margin' => 'decimal:2',
        'profit_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // リレーション
    public function estimate()
    {
        return $this->belongsTo(Estimate::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(CostPlanItem::class);
    }

    // スコープ
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // アクセサ
    public function getIsActiveAttribute()
    {
        return is_null($this->deleted_at);
    }

    public function getDisplayNameAttribute()
    {
        return $this->cost_plan_number . ' - ' . $this->name;
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
