<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EstimateBranch extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'estimate_id',
        'branch_name',
        'description',
        'total_amount',
        'is_active',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // リレーション
    public function estimate()
    {
        return $this->belongsTo(Estimate::class);
    }

    // スコープ
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function scopeByEstimate($query, $estimateId)
    {
        return $query->where('estimate_id', $estimateId);
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_active', true);
    }

    // アクセサ
    public function getIsActiveAttribute()
    {
        return is_null($this->deleted_at);
    }

    public function getDisplayNameAttribute()
    {
        return $this->branch_name . ' - ' . number_format($this->total_amount) . '円';
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
