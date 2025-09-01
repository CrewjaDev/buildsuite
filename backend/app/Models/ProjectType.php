<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type_code',
        'type_name',
        'type_symbol',
        'description',
        'overhead_rate',
        'cost_expense_rate',
        'material_expense_rate',
        'is_active',
        'sort_order',
        'created_by',
    ];

    protected $casts = [
        'overhead_rate' => 'decimal:2',
        'cost_expense_rate' => 'decimal:2',
        'material_expense_rate' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // リレーション
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function estimates()
    {
        return $this->hasMany(Estimate::class);
    }

    // スコープ
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    // アクセサ
    public function getDisplayNameAttribute()
    {
        return $this->type_name;
    }

    public function getFormattedOverheadRateAttribute()
    {
        return number_format($this->overhead_rate, 2) . '%';
    }

    public function getFormattedCostExpenseRateAttribute()
    {
        return number_format($this->cost_expense_rate, 2) . '%';
    }

    public function getFormattedMaterialExpenseRateAttribute()
    {
        return number_format($this->material_expense_rate, 2) . '%';
    }
}
