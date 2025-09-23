<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'sort_order',
        'is_active',
        'requires_approval',
        'default_permissions',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requires_approval' => 'boolean',
        'default_permissions' => 'array',
        'settings' => 'array',
    ];

    /**
     * 承認フローとの関連
     */
    public function approvalFlows(): HasMany
    {
        return $this->hasMany(ApprovalFlow::class, 'flow_type', 'code');
    }

    /**
     * 承認依頼との関連
     */
    public function approvalRequests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class, 'request_type', 'code');
    }

    /**
     * 有効な業務タイプを取得
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 承認必須の業務タイプを取得
     */
    public function scopeRequiresApproval($query)
    {
        return $query->where('requires_approval', true);
    }

    /**
     * カテゴリ別に取得
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * 表示順序でソート
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * デフォルト権限を取得
     */
    public function getDefaultPermissionsAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    /**
     * 設定を取得
     */
    public function getSettingsAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }
}
