<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Position extends Model
{
    use SoftDeletes;

    /**
     * テーブル名
     */
    protected $table = 'positions';

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
        'level',
        'sort_order',
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
            'level' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * この職位に属する社員とのリレーション
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * この職位に属するユーザーとのリレーション（社員を通じて）
     */
    public function users(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, Employee::class, 'position_id', 'employee_id');
    }

    /**
     * 職位に属する権限とのリレーション
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'position_permissions')
            ->withPivot(['granted_at', 'granted_by'])
            ->withTimestamps();
    }

    /**
     * アクティブな職位のみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * レベル順にソートするスコープ
     */
    public function scopeOrderByLevel($query, $direction = 'asc')
    {
        return $query->orderBy('level', $direction);
    }

    /**
     * ソート順で並べるスコープ
     */
    public function scopeOrderBySort($query, $direction = 'asc')
    {
        return $query->orderBy('sort_order', $direction);
    }

    /**
     * 指定されたレベル以上の職位かチェック
     */
    public function hasLevelOrHigher(int $level): bool
    {
        return $this->level >= $level;
    }

    /**
     * 指定されたレベル以下の職位かチェック
     */
    public function hasLevelOrLower(int $level): bool
    {
        return $this->level <= $level;
    }

    /**
     * アクティブな権限のみを取得
     */
    public function activePermissions()
    {
        return $this->permissions()->where('is_active', true);
    }

    /**
     * 職位が指定された権限を持っているかチェック
     */
    public function hasPermission(string $permission): bool
    {
        return $this->activePermissions()->where('name', $permission)->exists();
    }
}
