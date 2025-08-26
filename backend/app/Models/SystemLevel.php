<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SystemLevel extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'code',
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
     * システム権限レベルに属する権限とのリレーション
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'system_level_permissions')
            ->withPivot(['granted_at', 'granted_by'])
            ->withTimestamps();
    }

    /**
     * このシステム権限レベルを持つユーザーとのリレーション
     */
    public function users()
    {
        return $this->hasMany(User::class, 'system_level', 'code');
    }

    /**
     * アクティブな権限のみを取得
     */
    public function activePermissions()
    {
        return $this->permissions()->where('is_active', true);
    }

    /**
     * システム権限レベルが指定された権限を持っているかチェック
     */
    public function hasPermission(string $permission): bool
    {
        return $this->activePermissions()->where('name', $permission)->exists();
    }

    /**
     * 優先度の高いシステム権限レベルかチェック
     */
    public function hasHigherPriorityThan(SystemLevel $other): bool
    {
        return $this->priority > $other->priority;
    }

    /**
     * アクティブなシステム権限レベルのみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * システム権限レベルのみを取得するスコープ
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
