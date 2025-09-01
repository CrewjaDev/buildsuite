<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ConstructionClassification extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'classification_code',
        'classification_name',
        'subject_code',
        'description',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    // リレーション
    public function estimateItems()
    {
        return $this->hasMany(EstimateItem::class);
    }

    // スコープ
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order');
    }

    // アクセサ
    public function getDisplayNameAttribute()
    {
        return $this->classification_name;
    }

    public function getFullNameAttribute()
    {
        return $this->subject_code . ' ' . $this->classification_name;
    }
}
