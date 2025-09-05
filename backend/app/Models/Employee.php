<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

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
        'birth_date',
        'gender',
        'phone',
        'mobile_phone',
        'postal_code',
        'prefecture',
        'address',
        'job_title',
        'hire_date',
        'department_id',
        'position_id',
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
            'birth_date' => 'date',
            'hire_date' => 'date',
            'is_active' => 'boolean',
            'service_years' => 'integer',
            'service_months' => 'integer',
        ];
    }

    /**
     * 所属部署とのリレーション
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * 職位とのリレーション
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * システム利用権限（ユーザー）とのリレーション
     */
    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'employee_id', 'id');
    }

    /**
     * アクティブな社員のみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 部署別の社員を取得するスコープ
     */
    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    /**
     * 勤続年数を取得するアクセサー
     */
    public function getServiceYearsAttribute(): ?int
    {
        if (!$this->hire_date) {
            return null;
        }
        
        return now()->diffInYears($this->hire_date);
    }

    /**
     * 勤続月数を取得するアクセサー
     */
    public function getServiceMonthsAttribute(): ?int
    {
        if (!$this->hire_date) {
            return null;
        }
        
        return now()->diffInMonths($this->hire_date) % 12;
    }

    /**
     * フルネーム（氏名 + フリガナ）を取得
     */
    public function getFullNameAttribute(): string
    {
        $fullName = $this->name;
        if ($this->name_kana) {
            $fullName .= " ({$this->name_kana})";
        }
        return $fullName;
    }

    /**
     * システム利用権限があるかチェック
     */
    public function hasSystemAccess(): bool
    {
        return $this->user !== null && $this->user->login_id !== null;
    }
}
