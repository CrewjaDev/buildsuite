<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalStep extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'approval_flow_id',
        'step_order',
        'name',
        'description',
        'approver_type', // user, role, department, system_level
        'approver_id', // 承認者ID（approver_typeに応じて）
        'approver_condition', // 承認条件（JSON）
        'is_required',
        'can_delegate',
        'timeout_hours',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'approver_condition' => 'array',
            'is_required' => 'boolean',
            'can_delegate' => 'boolean',
            'is_active' => 'boolean',
            'timeout_hours' => 'integer',
            'step_order' => 'integer',
        ];
    }

    /**
     * 承認フローとのリレーション
     */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(ApprovalFlow::class, 'approval_flow_id');
    }

    /**
     * 承認者とのリレーション（ユーザー）
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    /**
     * 承認者とのリレーション（役割）
     */
    public function approverRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'approver_id');
    }

    /**
     * 承認者とのリレーション（部署）
     */
    public function approverDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'approver_id');
    }

    /**
     * 承認者とのリレーション（システム権限レベル）
     */
    public function approverSystemLevel(): BelongsTo
    {
        return $this->belongsTo(SystemLevel::class, 'approver_id');
    }

    /**
     * 承認履歴とのリレーション
     */
    public function histories(): HasMany
    {
        return $this->hasMany(ApprovalHistory::class);
    }

    /**
     * 作成者とのリレーション
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * 更新者とのリレーション
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * アクティブなステップのみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * ステップ順にソートするスコープ
     */
    public function scopeOrderByStep($query, $direction = 'asc')
    {
        return $query->orderBy('step_order', $direction);
    }

    /**
     * 承認者を取得
     */
    public function getApprovers(): array
    {
        switch ($this->approver_type) {
            case 'user':
                return [$this->approver];
            case 'role':
                return $this->approverRole ? $this->approverRole->activeUsers()->get()->all() : [];
            case 'department':
                return $this->approverDepartment ? $this->approverDepartment->activeUsers()->get()->all() : [];
            case 'system_level':
                return $this->approverSystemLevel ? $this->approverSystemLevel->users()->get()->all() : [];
            default:
                return [];
        }
    }

    /**
     * 指定されたユーザーが承認者かチェック
     */
    public function isApprover(User $user): bool
    {
        $approvers = $this->getApprovers();
        return in_array($user, $approvers);
    }

    /**
     * 承認条件を評価
     */
    public function evaluateConditions(array $data): bool
    {
        if (empty($this->approver_condition)) {
            return true;
        }

        foreach ($this->approver_condition as $condition) {
            if (!$this->evaluateCondition($condition, $data)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 個別の承認条件を評価
     */
    private function evaluateCondition(array $condition, array $data): bool
    {
        $field = $condition['field'] ?? '';
        $operator = $condition['operator'] ?? '';
        $value = $condition['value'] ?? '';

        if (!isset($data[$field])) {
            return false;
        }

        $actualValue = $data[$field];

        switch ($operator) {
            case 'equals':
                return $actualValue == $value;
            case 'not_equals':
                return $actualValue != $value;
            case 'greater_than':
                return $actualValue > $value;
            case 'less_than':
                return $actualValue < $value;
            case 'greater_than_or_equal':
                return $actualValue >= $value;
            case 'less_than_or_equal':
                return $actualValue <= $value;
            case 'contains':
                return str_contains($actualValue, $value);
            case 'not_contains':
                return !str_contains($actualValue, $value);
            case 'in':
                return in_array($actualValue, (array)$value);
            case 'not_in':
                return !in_array($actualValue, (array)$value);
            default:
                return false;
        }
    }

    /**
     * タイムアウト時刻を取得
     */
    public function getTimeoutAt(): ?\Carbon\Carbon
    {
        if (!$this->timeout_hours) {
            return null;
        }

        return now()->addHours($this->timeout_hours);
    }

    /**
     * ステップがタイムアウトしているかチェック
     */
    public function isTimedOut(): bool
    {
        if (!$this->timeout_hours) {
            return false;
        }

        return now()->isAfter($this->getTimeoutAt());
    }
}
