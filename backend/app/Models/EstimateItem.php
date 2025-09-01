<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EstimateItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'estimate_id',
        'parent_id',
        'item_type',
        'display_order',
        'name',
        'description',
        'quantity',
        'unit',
        'unit_price',
        'amount',
        'estimated_cost',
        'supplier_id',
        'construction_method',
        'construction_classification_id',
        'remarks',
        'is_expanded',
        'is_active',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'integer',
        'amount' => 'integer',
        'estimated_cost' => 'integer',
        'display_order' => 'integer',
        'is_expanded' => 'boolean',
        'is_active' => 'boolean',
    ];

    // リレーション
    public function estimate()
    {
        return $this->belongsTo(Estimate::class);
    }

    public function parent()
    {
        return $this->belongsTo(EstimateItem::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(EstimateItem::class, 'parent_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Partner::class, 'supplier_id');
    }

    public function constructionClassification()
    {
        return $this->belongsTo(ConstructionClassification::class);
    }

    public function costPlanItems()
    {
        return $this->hasMany(CostPlanItem::class);
    }

    // スコープ
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('item_type', $type);
    }

    public function scopeRootItems($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeByClassification($query, $classificationId)
    {
        return $query->where('construction_classification_id', $classificationId);
    }

    public function scopeBySupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    // アクセサ
    public function getLevelAttribute()
    {
        $level = 0;
        $parent = $this->parent;
        while ($parent) {
            $level++;
            $parent = $parent->parent;
        }
        return $level;
    }

    public function getIsDetailAttribute()
    {
        return $this->item_type === 'detail';
    }

    public function getIsBreakdownAttribute()
    {
        return in_array($this->item_type, ['large', 'medium', 'small']);
    }

    public function getHasChildrenAttribute()
    {
        return $this->children()->exists();
    }

    // ミューテータ
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (!$item->id) {
                $item->id = \Illuminate\Support\Str::uuid();
            }
        });

        static::saving(function ($item) {
            // 金額の自動計算
            if ($item->quantity && $item->unit_price) {
                $item->amount = $item->quantity * $item->unit_price;
            }
        });
    }

    // 階層構造の取得
    public function getHierarchyItems()
    {
        return $this->children()->with('children')->orderBy('display_order')->get();
    }

    // 子要素の合計金額を取得
    public function getChildrenTotalAmount()
    {
        return $this->children()->sum('amount');
    }

    // 子要素の合計予想原価を取得
    public function getChildrenTotalEstimatedCost()
    {
        return $this->children()->sum('estimated_cost');
    }
}
