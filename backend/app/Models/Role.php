<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
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
        'priority',
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
            'priority' => 'integer',
            'is_system' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * 役割に属する権限とのリレーション
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')
            ->withPivot(['granted_at', 'granted_by'])
            ->withTimestamps();
    }

    /**
     * 役割に属するユーザーとのリレーション
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot(['assigned_at', 'assigned_by', 'expires_at', 'is_active'])
            ->withTimestamps();
    }

    /**
     * アクティブな権限のみを取得
     */
    public function activePermissions()
    {
        return $this->permissions()->where('is_active', true);
    }

    /**
     * アクティブなユーザーのみを取得
     */
    public function activeUsers()
    {
        return $this->users()->wherePivot('is_active', true);
    }

    /**
     * 役割が指定された権限を持っているかチェック
     */
    public function hasPermission(string $permission): bool
    {
        return $this->activePermissions()->where('name', $permission)->exists();
    }

    /**
     * 優先度の高い役割かチェック
     */
    public function hasHigherPriorityThan(Role $other): bool
    {
        return $this->priority > $other->priority;
    }

    /**
     * アクティブな役割のみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * システム役割のみを取得するスコープ
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * 優先度順にソートするスコープ
     */
    public function scopeOrderByPriority($query, $direction = 'desc')
    {
        return $query->orderBy('priority', $direction);
    }
}
