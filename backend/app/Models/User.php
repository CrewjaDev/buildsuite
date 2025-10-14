<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Position;
use App\Models\Department;
use App\Models\Permission;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',      // 社員への外部キー
        'login_id',         // ログインID
        'password',         // パスワード
        'system_level_id',  // システム権限レベルID
        'is_active',        // アクティブ状態
        'is_admin',         // 管理者権限
        'last_login_at',    // 最終ログイン時刻
        'password_changed_at',     // パスワード変更日時
        'password_expires_at',     // パスワード有効期限
        'failed_login_attempts',   // ログイン失敗回数
        'locked_at',        // アカウントロック時刻
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'employee_id' => 'integer',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'password_expires_at' => 'datetime',
            'locked_at' => 'datetime',
            'is_admin' => 'boolean',
            'failed_login_attempts' => 'integer',
        ];
    }

    /**
     * 社員情報とのリレーション
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    /**
     * ユーザーの役割とのリレーション
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot(['assigned_at', 'assigned_by', 'expires_at', 'is_active'])
            ->withTimestamps();
    }

    /**
     * ユーザーのセッション履歴
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(UserSession::class);
    }

    /**
     * ユーザーのログイン履歴
     */
    public function loginHistory(): HasMany
    {
        return $this->hasMany(UserLoginHistory::class);
    }

    /**
     * システム権限レベルとのリレーション（user_system_levelsテーブル経由）
     */
    public function systemLevels(): BelongsToMany
    {
        return $this->belongsToMany(SystemLevel::class, 'user_system_levels')
            ->withPivot(['assigned_at', 'assigned_by', 'is_active'])
            ->withTimestamps();
    }

    /**
     * システム権限レベルとのリレーション（後方互換性のため）
     */
    public function systemLevel()
    {
        return $this->belongsTo(SystemLevel::class, 'system_level_id', 'id');
    }

    /**
     * ユーザーの部署とのリレーション（user_departmentsテーブル経由）
     */
    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'user_departments')
            ->withPivot(['assigned_at', 'assigned_by', 'is_primary', 'is_active'])
            ->withTimestamps();
    }

    /**
     * プライマリ部署を取得するアクセサー
     */
    public function getPrimaryDepartmentAttribute()
    {
        return $this->departments->where('pivot.is_primary', true)->first();
    }

    /**
     * ユーザーの職位とのリレーション（employee経由）
     */
    public function position()
    {
        return $this->hasOneThrough(
            Position::class,
            Employee::class,
            'id', // Employee テーブルの外部キー
            'id', // Position テーブルの外部キー
            'employee_id', // User テーブルの外部キー
            'position_id' // Employee テーブルの外部キー
        );
    }

    /**
     * ユーザーの個別権限とのリレーション
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')
            ->withPivot(['assigned_at', 'assigned_by', 'expires_at', 'is_active'])
            ->withTimestamps();
    }

    /**
     * アクティブな役割のみを取得
     */
    public function activeRoles()
    {
        return $this->roles()->wherePivot('is_active', true);
    }



    /**
     * ユーザーが指定された権限を持っているかチェック
     */
    public function hasPermission(string $permission): bool
    {
        // システム管理者は全ての権限を持つ
        if ($this->is_admin) {
            return true;
        }

        // システム権限レベルによる権限チェック
        if ($this->systemLevel) {
            $systemPermissions = $this->systemLevel->permissions()
                ->where('name', $permission)
                ->where('is_active', true)
                ->exists();
            
            if ($systemPermissions) {
                return true;
            }
        }

        // 役割による権限チェック
        $rolePermissions = $this->activeRoles()
            ->whereHas('permissions', function ($query) use ($permission) {
                $query->where('name', $permission)->where('is_active', true);
            })
            ->exists();

        if ($rolePermissions) {
            return true;
        }

        // 部署による権限チェック（user_departmentsテーブル経由）
        if ($this->primaryDepartment) {
            $departmentPermissions = $this->primaryDepartment->permissions()
                ->where('name', $permission)
                ->where('is_active', true)
                ->exists();
                
            return $departmentPermissions;
        }

        return false;
    }

    /**
     * ユーザーが指定された役割を持っているかチェック
     */
    public function hasRole(int $roleId): bool
    {
        return $this->activeRoles()->where('role_id', $roleId)->exists();
    }

    /**
     * ユーザーが指定されたシステム権限レベルを持っているかチェック
     */
    public function hasSystemLevel(int $systemLevel): bool
    {
        return $this->system_level_id == $systemLevel;
    }

    /**
     * ユーザーがロックされているかチェック
     */
    public function isLocked(): bool
    {
        return !is_null($this->locked_at);
    }

    /**
     * パスワードが期限切れかチェック
     */
    public function isPasswordExpired(): bool
    {
        return !is_null($this->password_expires_at) && $this->password_expires_at->isPast();
    }

    /**
     * ログイン失敗回数をリセット
     */
    public function resetFailedLoginAttempts(): void
    {
        $this->update([
            'failed_login_attempts' => 0,
            'locked_at' => null,
        ]);
    }

    /**
     * ログイン失敗回数を増加
     */
    public function incrementFailedLoginAttempts(): void
    {
        $this->increment('failed_login_attempts');
        
        // 5回失敗でロック
        if ($this->failed_login_attempts >= 5) {
            $this->update(['locked_at' => now()]);
        }
    }

    /**
     * 最終ログイン時刻を更新
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }
}
