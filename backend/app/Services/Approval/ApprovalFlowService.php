<?php

namespace App\Services\Approval;

use App\Models\ApprovalFlow;
use App\Models\ApprovalRequest;
use App\Models\User;
use Illuminate\Support\Collection;

class ApprovalFlowService
{
    private ApprovalConditionEvaluator $conditionEvaluator;

    public function __construct(ApprovalConditionEvaluator $conditionEvaluator)
    {
        $this->conditionEvaluator = $conditionEvaluator;
    }

    /**
     * 承認依頼作成時の承認フロー選択
     */
    public function selectApprovalFlow(array $requestData, int $userId): ?ApprovalFlow
    {
        $user = User::with('employee')->find($userId);
        
        if (!$user) {
            return null;
        }

        $availableFlows = ApprovalFlow::where('is_active', true)
            ->where('flow_type', $requestData['flow_type'] ?? 'general')
            ->orderBy('priority')
            ->get();

        $applicableFlows = [];

        foreach ($availableFlows as $flow) {
            // 1. 承認依頼者権限チェック
            if (!$flow->canCreateApprovalRequest($user)) {
                continue;
            }

            // 2. 適用条件チェック
            if (!$this->matchesConditions($flow, $requestData)) {
                continue;
            }

            $applicableFlows[] = $flow;
        }

        // 優先度順でソート（数値が小さいほど優先）
        usort($applicableFlows, function ($a, $b) {
            return $a->priority <=> $b->priority;
        });

        return $applicableFlows[0] ?? null;
    }

    /**
     * 適用条件のマッチング
     */
    private function matchesConditions(ApprovalFlow $flow, array $requestData): bool
    {
        $conditions = $flow->conditions ?? [];

        if (empty($conditions)) {
            return true; // 条件が設定されていない場合は適用
        }

        foreach ($conditions as $field => $condition) {
            if (!$this->evaluateFieldCondition($field, $condition, $requestData)) {
                return false;
            }
        }

        return true;
    }

    /**
     * フィールド条件の評価
     */
    private function evaluateFieldCondition(string $field, $condition, array $requestData): bool
    {
        switch ($field) {
            case 'amount_min':
                $amount = $requestData['amount'] ?? 0;
                return $amount >= $condition;
            case 'amount_max':
                $amount = $requestData['amount'] ?? 0;
                return $amount <= $condition;
            case 'project_types':
                $projectType = $requestData['project_type'] ?? '';
                return in_array($projectType, (array)$condition);
            case 'departments':
                $departmentId = $requestData['department_id'] ?? null;
                return in_array($departmentId, (array)$condition);
            case 'vendor_types':
                $vendorType = $requestData['vendor_type'] ?? '';
                return in_array($vendorType, (array)$condition);
            default:
                // カスタム条件の評価
                if (is_array($condition) && isset($condition['operator'])) {
                    return $this->conditionEvaluator->evaluateCondition([
                        'field' => $field,
                        'operator' => $condition['operator'],
                        'value' => $condition['value']
                    ], $requestData);
                }
                return true;
        }
    }

    /**
     * 承認ステップの動的決定
     */
    public function determineApprovalSteps(ApprovalRequest $approvalRequest): array
    {
        $flow = $approvalRequest->approvalFlow;
        $requestData = $approvalRequest->request_data ?? [];
        $applicableSteps = [];

        $approvalSteps = $flow->approval_steps ?? [];

        foreach ($approvalSteps as $step) {
            if ($this->isStepApplicable($step, $requestData)) {
                $applicableSteps[] = $step;
            }
        }

        return $applicableSteps;
    }

    /**
     * ステップが適用可能かチェック
     */
    private function isStepApplicable(array $step, array $requestData): bool
    {
        // ステップ内の条件分岐をチェック
        foreach ($step['approvers'] ?? [] as $approver) {
            if ($approver['type'] === 'conditional') {
                if (!$this->conditionEvaluator->evaluateCondition(
                    $approver['condition'], 
                    $requestData
                )) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * ユーザーが利用可能な承認フロー一覧を取得
     */
    public function getAvailableFlowsForUser(User $user, string $flowType = null): Collection
    {
        $query = ApprovalFlow::where('is_active', true);

        if ($flowType) {
            $query->where('flow_type', $flowType);
        }

        $flows = $query->orderBy('priority')->get();

        return $flows->filter(function ($flow) use ($user) {
            return $flow->canCreateApprovalRequest($user);
        });
    }

    /**
     * 承認フローの適用可能性をチェック
     */
    public function checkFlowApplicability(ApprovalFlow $flow, array $requestData, User $user): array
    {
        $result = [
            'applicable' => false,
            'reasons' => [],
            'score' => 0
        ];

        // 1. アクティブ状態チェック
        if (!$flow->is_active) {
            $result['reasons'][] = '承認フローが無効です';
            return $result;
        }

        // 2. 承認依頼者権限チェック
        if (!$flow->canCreateApprovalRequest($user)) {
            $result['reasons'][] = '承認依頼権限がありません';
            return $result;
        }

        // 3. 適用条件チェック
        if (!$this->matchesConditions($flow, $requestData)) {
            $result['reasons'][] = '適用条件に合致しません';
            return $result;
        }

        // 4. 承認ステップの存在チェック
        if (empty($flow->approval_steps)) {
            $result['reasons'][] = '承認ステップが設定されていません';
            return $result;
        }

        $result['applicable'] = true;
        $result['score'] = $this->calculateFlowScore($flow, $requestData, $user);

        return $result;
    }

    /**
     * 承認フローのスコア計算
     */
    private function calculateFlowScore(ApprovalFlow $flow, array $requestData, User $user): int
    {
        $score = 0;

        // フロー種別の一致
        if ($flow->flow_type === ($requestData['flow_type'] ?? 'general')) {
            $score += 100;
        }

        // 金額範囲の一致
        if ($this->isAmountInRange($flow, $requestData)) {
            $score += 50;
        }

        // 部署の一致
        if ($this->isDepartmentMatched($flow, $user)) {
            $score += 30;
        }

        // プロジェクトタイプの一致
        if ($this->isProjectTypeMatched($flow, $requestData)) {
            $score += 20;
        }

        // 優先度（数値が小さいほど高スコア）
        $score += max(0, 10 - $flow->priority);

        return $score;
    }

    /**
     * 金額範囲のチェック
     */
    private function isAmountInRange(ApprovalFlow $flow, array $requestData): bool
    {
        $amount = $requestData['amount'] ?? 0;
        $conditions = $flow->conditions ?? [];

        $amountMin = $conditions['amount_min'] ?? 0;
        $amountMax = $conditions['amount_max'] ?? PHP_INT_MAX;

        return $amount >= $amountMin && $amount <= $amountMax;
    }

    /**
     * 部署の一致チェック
     */
    private function isDepartmentMatched(ApprovalFlow $flow, User $user): bool
    {
        $employee = $user->employee;
        if (!$employee) {
            return false;
        }

        $conditions = $flow->conditions ?? [];
        $allowedDepartments = $conditions['departments'] ?? [];

        return empty($allowedDepartments) || in_array($employee->department_id, $allowedDepartments);
    }

    /**
     * プロジェクトタイプの一致チェック
     */
    private function isProjectTypeMatched(ApprovalFlow $flow, array $requestData): bool
    {
        $projectType = $requestData['project_type'] ?? '';
        $conditions = $flow->conditions ?? [];
        $allowedTypes = $conditions['project_types'] ?? [];

        return empty($allowedTypes) || in_array($projectType, $allowedTypes);
    }

    /**
     * 承認フローの複製
     */
    public function duplicateFlow(ApprovalFlow $originalFlow, string $newName, User $user): ApprovalFlow
    {
        $newFlow = $originalFlow->replicate();
        $newFlow->name = $newName;
        $newFlow->is_system = false;
        $newFlow->created_by = $user->id;
        $newFlow->updated_by = $user->id;
        $newFlow->save();

        return $newFlow;
    }

    /**
     * 承認フローの検証
     */
    public function validateFlow(ApprovalFlow $flow): array
    {
        $errors = [];

        // 基本情報の検証
        if (empty($flow->name)) {
            $errors[] = 'フロー名は必須です';
        }

        if (empty($flow->flow_type)) {
            $errors[] = 'フロータイプは必須です';
        }

        // 承認依頼者の検証
        if (empty($flow->requesters)) {
            $errors[] = '承認依頼者の設定は必須です';
        } else {
            foreach ($flow->requesters as $requester) {
                if (!$this->validateRequester($requester)) {
                    $errors[] = '承認依頼者の設定が不正です';
                    break;
                }
            }
        }

        // 承認ステップの検証
        if (empty($flow->approval_steps)) {
            $errors[] = '承認ステップの設定は必須です';
        } else {
            if (count($flow->approval_steps) > 5) {
                $errors[] = '承認ステップは最大5つまでです';
            }

            foreach ($flow->approval_steps as $step) {
                if (!$this->validateStep($step)) {
                    $errors[] = '承認ステップの設定が不正です';
                    break;
                }
            }
        }

        return $errors;
    }

    /**
     * 承認依頼者の検証
     */
    private function validateRequester(array $requester): bool
    {
        $requiredFields = ['type', 'value', 'display_name'];
        
        foreach ($requiredFields as $field) {
            if (!isset($requester[$field])) {
                return false;
            }
        }

        $validTypes = ['system_level', 'position', 'user', 'department', 'role'];
        return in_array($requester['type'], $validTypes);
    }

    /**
     * 承認ステップの検証
     */
    private function validateStep(array $step): bool
    {
        $requiredFields = ['step', 'name', 'approvers', 'condition'];
        
        foreach ($requiredFields as $field) {
            if (!isset($step[$field])) {
                return false;
            }
        }

        if (!is_array($step['approvers']) || empty($step['approvers'])) {
            return false;
        }

        foreach ($step['approvers'] as $approver) {
            if (!$this->validateApprover($approver)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 承認者の検証
     */
    private function validateApprover(array $approver): bool
    {
        if (!isset($approver['type'])) {
            return false;
        }

        $validTypes = ['system_level', 'position', 'user', 'department', 'role', 'conditional', 'parallel'];
        
        if (!in_array($approver['type'], $validTypes)) {
            return false;
        }

        // 条件分岐の場合は追加検証
        if ($approver['type'] === 'conditional') {
            if (!isset($approver['condition']) || !isset($approver['approvers'])) {
                return false;
            }
        }

        // 並列承認の場合は追加検証
        if ($approver['type'] === 'parallel') {
            if (!isset($approver['approvers']) || !is_array($approver['approvers'])) {
                return false;
            }
        }

        return true;
    }
}
