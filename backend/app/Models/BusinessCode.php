<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessCode extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'is_system',
        'is_core',
        'settings',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_core' => 'boolean',
            'is_active' => 'boolean',
            'settings' => 'array',
        ];
    }

    /**
     * ビジネスコードに紐づく権限とのリレーション
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'business_code_permissions')
            ->withPivot(['is_default', 'is_active'])
            ->withTimestamps();
    }

    /**
     * ビジネスコードに紐づくABACポリシーとのリレーション
     */
    public function accessPolicies(): BelongsToMany
    {
        return $this->belongsToMany(AccessPolicy::class, 'business_code_access_policies')
            ->withPivot(['is_active'])
            ->withTimestamps();
    }

    /**
     * デフォルト権限のみを取得するスコープ
     */
    public function scopeDefaultPermissions($query)
    {
        return $query->wherePivot('is_default', true);
    }

    /**
     * アクティブなビジネスコードのみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * システムビジネスコードのみを取得するスコープ
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * コアビジネスコードのみを取得するスコープ
     */
    public function scopeCore($query)
    {
        return $query->where('is_core', true);
    }

    /**
     * カテゴリ別にビジネスコードを取得するスコープ
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}
