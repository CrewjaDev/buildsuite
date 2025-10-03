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
        'flow_config', // フロー設定（編集・キャンセル制御等）（JSON）
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
            'flow_config' => 'array',
            'is_active' => 'boolean',
            'is_system' => 'boolean',
            'priority' => 'integer',
        ];
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

    /**
     * 編集制御設定を取得
     */
    public function getEditingConfig(): array
    {
        $flowConfig = $this->flow_config ?? [];
        return $flowConfig['editing'] ?? [
            'allowed_sub_statuses' => ['null', 'editing'],
            'exclusive_control' => true,
            'approver_priority' => true,
        ];
    }

    /**
     * キャンセル制御設定を取得
     */
    public function getCancellationConfig(): array
    {
        $flowConfig = $this->flow_config ?? [];
        return $flowConfig['cancellation'] ?? [
            'allowed_sub_statuses' => ['null', 'editing'],
            'requester_only' => true,
            'admin_override' => true,
        ];
    }

    /**
     * 編集可能なサブステータスかチェック
     */
    public function isSubStatusEditable(string $subStatus): bool
    {
        $editingConfig = $this->getEditingConfig();
        $allowedSubStatuses = $editingConfig['allowed_sub_statuses'] ?? ['null', 'editing'];
        
        // nullの場合は'null'として扱う
        if ($subStatus === null) {
            $subStatus = 'null';
        }
        
        return in_array($subStatus, $allowedSubStatuses);
    }

    /**
     * キャンセル可能なサブステータスかチェック
     */
    public function isSubStatusCancellable(string $subStatus): bool
    {
        $cancellationConfig = $this->getCancellationConfig();
        $allowedSubStatuses = $cancellationConfig['allowed_sub_statuses'] ?? ['null', 'editing'];
        
        // nullの場合は'null'として扱う
        if ($subStatus === null) {
            $subStatus = 'null';
        }
        
        return in_array($subStatus, $allowedSubStatuses);
    }

    /**
     * 排他制御が有効かチェック
     */
    public function isExclusiveControlEnabled(): bool
    {
        $editingConfig = $this->getEditingConfig();
        return $editingConfig['exclusive_control'] ?? true;
    }

    /**
     * 承認者優先が有効かチェック
     */
    public function isApproverPriorityEnabled(): bool
    {
        $editingConfig = $this->getEditingConfig();
        return $editingConfig['approver_priority'] ?? true;
    }

    /**
     * 申請者のみキャンセル可能かチェック
     */
    public function isRequesterOnlyCancellation(): bool
    {
        $cancellationConfig = $this->getCancellationConfig();
        return $cancellationConfig['requester_only'] ?? true;
    }

    /**
     * 管理者によるキャンセル上書きが有効かチェック
     */
    public function isAdminOverrideEnabled(): bool
    {
        $cancellationConfig = $this->getCancellationConfig();
        return $cancellationConfig['admin_override'] ?? true;
    }

    /**
     * デフォルトのフロー設定を取得
     */
    public static function getDefaultFlowConfig(): array
    {
        return [
            'editing' => [
                'allowed_sub_statuses' => ['null', 'editing'],
                'exclusive_control' => true,
                'approver_priority' => true,
            ],
            'cancellation' => [
                'allowed_sub_statuses' => ['null', 'editing'],
                'requester_only' => true,
                'admin_override' => true,
            ],
        ];
    }

    /**
     * フロー設定を更新
     */
    public function updateFlowConfig(array $config): bool
    {
        $currentConfig = $this->flow_config ?? [];
        $mergedConfig = array_merge($currentConfig, $config);
        
        return $this->update(['flow_config' => $mergedConfig]);
    }

    /**
     * ステップ別編集設定を取得
     */
    public function getStepEditingConfig(int $step): array
    {
        $flowConfig = $this->flow_config ?? [];
        $stepSettings = $flowConfig['step_settings']["step_{$step}"] ?? [];
        
        return $stepSettings['editing_conditions'] ?? [
            'allow_during_pending' => true,
            'allow_during_reviewing' => false,
            'allow_during_step_approved' => false,
            'allow_during_expired' => false,
        ];
    }

    /**
     * ステップ別キャンセル設定を取得
     */
    public function getStepCancellationConfig(int $step): array
    {
        $flowConfig = $this->flow_config ?? [];
        $stepSettings = $flowConfig['step_settings']["step_{$step}"] ?? [];
        
        return $stepSettings['cancellation_conditions'] ?? [
            'allow_during_pending' => true,
            'allow_during_reviewing' => false,
            'allow_during_step_approved' => false,
            'allow_during_expired' => false,
        ];
    }

    /**
     * ステップ別設定を更新
     */
    public function updateStepConfig(int $step, array $config): bool
    {
        $currentConfig = $this->flow_config ?? [];
        $stepKey = "step_{$step}";
        
        if (!isset($currentConfig['step_settings'])) {
            $currentConfig['step_settings'] = [];
        }
        
        $currentConfig['step_settings'][$stepKey] = array_merge(
            $currentConfig['step_settings'][$stepKey] ?? [],
            $config
        );
        
        return $this->update(['flow_config' => $currentConfig]);
    }

    /**
     * ステップ別編集条件を設定
     */
    public function setStepEditingConditions(int $step, array $conditions): bool
    {
        return $this->updateStepConfig($step, [
            'editing_conditions' => $conditions
        ]);
    }

    /**
     * ステップ別キャンセル条件を設定
     */
    public function setStepCancellationConditions(int $step, array $conditions): bool
    {
        return $this->updateStepConfig($step, [
            'cancellation_conditions' => $conditions
        ]);
    }

    /**
     * ステップ別設定のデフォルト値を取得
     */
    public static function getDefaultStepConfig(): array
    {
        return [
            'editing_conditions' => [
                'allow_during_pending' => true,
                'allow_during_reviewing' => false,
                'allow_during_step_approved' => false,
                'allow_during_expired' => false,
            ],
            'cancellation_conditions' => [
                'allow_during_pending' => true,
                'allow_during_reviewing' => false,
                'allow_during_step_approved' => false,
                'allow_during_expired' => false,
            ],
        ];
    }

    /**
     * 全ステップの設定を初期化
     */
    public function initializeStepConfigs(): bool
    {
        $approvalSteps = $this->approval_steps ?? [];
        $currentConfig = $this->flow_config ?? [];
        
        if (!isset($currentConfig['step_settings'])) {
            $currentConfig['step_settings'] = [];
        }
        
        foreach ($approvalSteps as $step) {
            $stepNumber = $step['step'] ?? 1;
            $stepKey = "step_{$stepNumber}";
            
            if (!isset($currentConfig['step_settings'][$stepKey])) {
                $currentConfig['step_settings'][$stepKey] = self::getDefaultStepConfig();
            }
        }
        
        return $this->update(['flow_config' => $currentConfig]);
    }

    /**
     * ステップ別設定の検証
     */
    public function validateStepConfig(int $step, array $config): array
    {
        $errors = [];
        
        // 編集条件の検証
        if (isset($config['editing_conditions'])) {
            $editingConditions = $config['editing_conditions'];
            $validKeys = ['allow_during_pending', 'allow_during_reviewing', 'allow_during_step_approved', 'allow_during_expired'];
            
            foreach ($editingConditions as $key => $value) {
                if (!in_array($key, $validKeys)) {
                    $errors[] = "無効な編集条件キー: {$key}";
                }
                if (!is_bool($value)) {
                    $errors[] = "編集条件の値は真偽値である必要があります: {$key}";
                }
            }
        }
        
        // キャンセル条件の検証
        if (isset($config['cancellation_conditions'])) {
            $cancellationConditions = $config['cancellation_conditions'];
            $validKeys = ['allow_during_pending', 'allow_during_reviewing', 'allow_during_step_approved', 'allow_during_expired'];
            
            foreach ($cancellationConditions as $key => $value) {
                if (!in_array($key, $validKeys)) {
                    $errors[] = "無効なキャンセル条件キー: {$key}";
                }
                if (!is_bool($value)) {
                    $errors[] = "キャンセル条件の値は真偽値である必要があります: {$key}";
                }
            }
        }
        
        return $errors;
    }
}
