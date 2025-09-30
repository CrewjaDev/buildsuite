<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaxRate extends Model
{
    protected $fillable = [
        'name',
        'rate',
        'effective_from',
        'effective_to',
        'is_active',
        'description',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * 現在有効な税率を取得
     */
    public static function getCurrentTaxRate(): ?self
    {
        return self::where('is_active', true)
            ->where('effective_from', '<=', now())
            ->where(function($query) {
                $query->whereNull('effective_to')
                      ->orWhere('effective_to', '>=', now());
            })
            ->orderBy('effective_from', 'desc')
            ->first();
    }

    /**
     * 指定日時点で有効な税率を取得
     */
    public static function getTaxRateAtDate(\DateTime $date): ?self
    {
        return self::where('is_active', true)
            ->where('effective_from', '<=', $date)
            ->where(function($query) use ($date) {
                $query->whereNull('effective_to')
                      ->orWhere('effective_to', '>=', $date);
            })
            ->orderBy('effective_from', 'desc')
            ->first();
    }

    /**
     * 見積とのリレーション
     */
    public function estimates(): HasMany
    {
        return $this->hasMany(Estimate::class);
    }
}
