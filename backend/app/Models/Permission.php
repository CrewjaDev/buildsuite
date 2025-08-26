<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Permission extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'module',
        'action',
        'resource',
        'is_system',
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
            'is_active' => 'boolean',
        ];
    }

    /**
     * 権限に属する役割とのリレーション
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions')
            ->withPivot(['granted_at', 'granted_by'])
            ->withTimestamps();
    }

    /**
     * 権限に属するシステム権限レベルとのリレーション
     */
    public function systemLevels(): BelongsToMany
    {
        return $this->belongsToMany(SystemLevel::class, 'system_level_permissions')
            ->withPivot(['granted_at', 'granted_by'])
            ->withTimestamps();
    }

    /**
     * 権限に属する部署とのリレーション
     */
    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'department_permissions')
            ->withPivot(['granted_at', 'granted_by'])
            ->withTimestamps();
    }

    /**
     * アクティブな権限のみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * システム権限のみを取得するスコープ
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * モジュール別に権限を取得するスコープ
     */
    public function scopeByModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    /**
     * アクション別に権限を取得するスコープ
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * リソース別に権限を取得するスコープ
     */
    public function scopeByResource($query, string $resource)
    {
        return $query->where('resource', $resource);
    }

    /**
     * 権限名からモジュール、アクション、リソースを解析
     */
    public function parsePermissionName(): array
    {
        $parts = explode('.', $this->name);
        return [
            'module' => $parts[0] ?? null,
            'action' => $parts[1] ?? null,
            'resource' => $parts[2] ?? null,
        ];
    }
}
