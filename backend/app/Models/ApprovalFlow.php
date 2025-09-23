<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalFlow extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'flow_type', // estimate, budget, purchase, contract, general
        'conditions', // 適用条件（JSON）
        'priority',
        'requesters', // 承認依頼者設定（JSON）
        'approval_steps', // 承認ステップ設定（JSON）
        'is_active',
        'is_system',
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
            'conditions' => 'array',
            'requesters' => 'array',
            'approval_steps' => 'array',
            'is_active' => 'boolean',
            'is_system' => 'boolean',
            'priority' => 'integer',
        ];
    }

    /**
     * 承認フローに属するステップとのリレーション
     */
    public function steps(): HasMany
    {
        return $this->hasMany(ApprovalStep::class)->orderBy('step_order');
    }

    /**
     * 承認フローに属する条件とのリレーション
     */
    public function conditions(): HasMany
    {
        return $this->hasMany(ApprovalCondition::class);
    }

    /**
     * 承認フローに属する承認依頼とのリレーション
     */
    public function requests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
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
     * アクティブな承認フローのみを取得するスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 特定のタイプの承認フローを取得するスコープ
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('flow_type', $type);
    }

    /**
     * システム承認フローのみを取得するスコープ
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * 優先度順にソートするスコープ
     */
    public function scopeOrderByPriority($query, $direction = 'asc')
    {
        return $query->orderBy('priority', $direction);
    }

    /**
     * 承認フローが条件に合致するかチェック
     */
    public function matchesConditions(array $data): bool
    {
        foreach ($this->conditions as $condition) {
            if (!$condition->evaluate($data)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 承認フローのステップ数を取得
     */
    public function getStepCount(): int
    {
        return $this->steps()->count();
    }

    /**
     * 承認フローが使用可能かチェック
     */
    public function isUsable(): bool
    {
        return $this->is_active && !empty($this->approval_steps);
    }

    /**
     * ユーザーが承認依頼を作成できるかチェック
     */
    public function canCreateApprovalRequest(User $user): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $requesters = $this->requesters ?? [];
        
        foreach ($requesters as $requester) {
            if ($this->checkRequesterPermission($user, $requester)) {
                return true;
            }
        }

        return false;
    }

    /**
     * ユーザーが承認できるかチェック
     */
    public function canApprove(User $user, int $step, array $requestData = []): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $approvalSteps = $this->approval_steps ?? [];
        
        foreach ($approvalSteps as $stepConfig) {
            if ($stepConfig['step'] == $step) {
                return $this->checkStepApprovalPermission($user, $stepConfig, $requestData);
            }
        }

        return false;
    }

    /**
     * ステップが完了したかチェック
     */
    public function isStepCompleted(int $step, array $approvals): bool
    {
        $approvalSteps = $this->approval_steps ?? [];
        
        foreach ($approvalSteps as $stepConfig) {
            if ($stepConfig['step'] == $step) {
                return $this->checkStepCompletion($stepConfig, $approvals);
            }
        }

        return false;
    }

    /**
     * 承認依頼者権限の個別チェック
     */
    private function checkRequesterPermission(User $user, array $requester): bool
    {
        $employee = $user->employee;
        
        switch ($requester['type']) {
            case 'system_level':
                return $user->system_level === $requester['value'];
            case 'position':
                return $employee && $employee->position_id == $requester['value'];
            case 'user':
                return $user->id == $requester['value'];
            case 'department':
                return $employee && $employee->department_id == $requester['value'];
            default:
                return false;
        }
    }

    /**
     * ステップ承認権限のチェック
     */
    private function checkStepApprovalPermission(User $user, array $stepConfig, array $requestData): bool
    {
        $employee = $user->employee;
        
        foreach ($stepConfig['approvers'] as $approver) {
            switch ($approver['type']) {
                case 'system_level':
                    if ($user->system_level === $approver['value']) {
                        return true;
                    }
                    break;
                case 'position':
                    if ($employee && $employee->position_id == $approver['value']) {
                        return true;
                    }
                    break;
                case 'user':
                    if ($user->id == $approver['value']) {
                        return true;
                    }
                    break;
                case 'department':
                    if ($employee && $employee->department_id == $approver['value']) {
                        return true;
                    }
                    break;
                case 'conditional':
                    // 条件分岐の場合は、条件を満たす場合のみ承認可能
                    if ($this->evaluateCondition($approver['condition'], $requestData)) {
                        foreach ($approver['approvers'] as $conditionalApprover) {
                            if ($this->checkRequesterPermission($user, $conditionalApprover)) {
                                return true;
                            }
                        }
                    }
                    break;
                case 'parallel':
                    // 並列承認の場合は、いずれかの承認者に該当すれば承認可能
                    foreach ($approver['approvers'] as $parallelApprover) {
                        if ($this->checkRequesterPermission($user, $parallelApprover)) {
                            return true;
                        }
                    }
                    break;
            }
        }

        return false;
    }

    /**
     * ステップ完了条件のチェック
     */
    private function checkStepCompletion(array $stepConfig, array $approvals): bool
    {
        $condition = $stepConfig['condition'] ?? ['type' => 'required'];
        $totalApprovers = $this->countStepApprovers($stepConfig);
        $approvedCount = count($approvals);

        switch ($condition['type']) {
            case 'required':
                return $approvedCount === $totalApprovers;
            case 'majority':
                return $approvedCount > ($totalApprovers / 2);
            case 'optional':
                return $approvedCount > 0;
            default:
                return false;
        }
    }

    /**
     * ステップの承認者数をカウント
     */
    private function countStepApprovers(array $stepConfig): int
    {
        $count = 0;
        
        foreach ($stepConfig['approvers'] as $approver) {
            switch ($approver['type']) {
                case 'system_level':
                case 'position':
                case 'user':
                case 'department':
                    $count++;
                    break;
                case 'conditional':
                    // 条件分岐の場合は、条件を満たす場合のみカウント
                    if ($this->evaluateCondition($approver['condition'], [])) {
                        $count += count($approver['approvers']);
                    }
                    break;
                case 'parallel':
                    $count += count($approver['approvers']);
                    break;
            }
        }

        return $count;
    }

    /**
     * 条件分岐の評価（簡易版）
     */
    private function evaluateCondition(array $condition, array $requestData): bool
    {
        $field = $condition['field'] ?? '';
        $operator = $condition['operator'] ?? '==';
        $value = $condition['value'] ?? null;

        $dataValue = $requestData[$field] ?? null;

        switch ($operator) {
            case '>=':
                return $dataValue >= $value;
            case '>':
                return $dataValue > $value;
            case '<=':
                return $dataValue <= $value;
            case '<':
                return $dataValue < $value;
            case '==':
                return $dataValue == $value;
            case '!=':
                return $dataValue != $value;
            case 'in':
                return in_array($dataValue, (array)$value);
            case 'not_in':
                return !in_array($dataValue, (array)$value);
            default:
                return false;
        }
    }
}
