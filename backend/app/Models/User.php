<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'name',
        'name_kana',
        'email',
        'password',
        'birth_date',
        'gender',
        'phone',
        'mobile_phone',
        'postal_code',
        'prefecture',
        'address',
        'position',
        'job_title',
        'hire_date',
        'service_years',
        'service_months',
        'system_level',
        'is_active',
        'is_admin',
        'last_login_at',
        'password_changed_at',
        'password_expires_at',
        'failed_login_attempts',
        'locked_at',
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
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
            'hire_date' => 'date',
            'last_login_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'password_expires_at' => 'datetime',
            'locked_at' => 'datetime',
            'is_active' => 'boolean',
            'is_admin' => 'boolean',
            'service_years' => 'integer',
            'service_months' => 'integer',
            'failed_login_attempts' => 'integer',
        ];
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
     * ユーザーの部署とのリレーション
     */
    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'user_departments')
            ->withPivot(['position', 'is_primary', 'assigned_at', 'assigned_by', 'expires_at', 'is_active'])
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
     * システム権限レベルとのリレーション
     */
    public function systemLevel()
    {
        return $this->belongsTo(SystemLevel::class, 'system_level', 'code');
    }

    /**
     * アクティブな役割のみを取得
     */
    public function activeRoles()
    {
        return $this->roles()->wherePivot('is_active', true);
    }

    /**
     * アクティブな部署のみを取得
     */
    public function activeDepartments()
    {
        return $this->departments()->wherePivot('is_active', true);
    }

    /**
     * プライマリ部署を取得
     */
    public function primaryDepartment()
    {
        return $this->departments()->wherePivot('is_primary', true)->first();
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

        // 部署による権限チェック
        $departmentPermissions = $this->activeDepartments()
            ->whereHas('permissions', function ($query) use ($permission) {
                $query->where('name', $permission)->where('is_active', true);
            })
            ->exists();

        return $departmentPermissions;
    }

    /**
     * ユーザーが指定された役割を持っているかチェック
     */
    public function hasRole(string $role): bool
    {
        return $this->activeRoles()->where('name', $role)->exists();
    }

    /**
     * ユーザーが指定されたシステム権限レベルを持っているかチェック
     */
    public function hasSystemLevel(string $systemLevel): bool
    {
        return $this->system_level === $systemLevel;
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
