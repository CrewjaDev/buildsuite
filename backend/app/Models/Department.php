<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'description',
        'parent_id',
        'level',
        'path',
        'sort_order',
        'manager_id',
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
            'parent_id' => 'integer',
            'level' => 'integer',
            'sort_order' => 'integer',
            'manager_id' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * 親部署とのリレーション
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /**
     * 子部署とのリレーション
     */
    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    /**
     * 部署に属するユーザーとのリレーション
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_departments')
            ->withPivot(['position', 'is_primary', 'assigned_at', 'assigned_by', 'expires_at', 'is_active'])
            ->withTimestamps();
    }

    /**
     * 部署に属する権限とのリレーション
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'department_permissions')
            ->withPivot(['granted_at', 'granted_by'])
            ->withTimestamps();
    }

    /**
     * 部署の管理者とのリレーション
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
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
     * 部署が指定された権限を持っているかチェック
     */
    public function hasPermission(string $permission): bool
    {
        return $this->activePermissions()->where('name', $permission)->exists();
    }

    /**
     * ルート部署かチェック
     */
    public function isRoot(): bool
    {
        return is_null($this->parent_id);
    }

    /**
     * 子部署があるかチェック
     */
    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    /**
     * 全ての子部署を再帰的に取得
     */
    public function getAllChildren()
    {
        return $this->children()->with('children');
    }

    /**
     * 全ての親部署を再帰的に取得
     */
    public function getAllParents()
    {
        $parents = collect();
        $current = $this->parent;
        
        while ($current) {
            $parents->push($current);
            $current = $current->parent;
        }
        
        return $parents;
    }

    /**
     * アクティブな部署のみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * ルート部署のみを取得するスコープ
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * レベル別に取得するスコープ
     */
    public function scopeByLevel($query, int $level)
    {
        return $query->where('level', $level);
    }

    /**
     * ソート順で並べるスコープ
     */
    public function scopeOrderBySort($query, $direction = 'asc')
    {
        return $query->orderBy('sort_order', $direction);
    }
}
