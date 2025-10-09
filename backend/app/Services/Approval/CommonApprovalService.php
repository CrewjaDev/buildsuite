<?php

namespace App\Services\Approval;

use App\Models\ApprovalFlow;
use App\Models\ApprovalRequest;
use App\Models\ApprovalHistory;
use App\Models\User;
use App\Services\PermissionService;

class CommonApprovalService
{
    protected $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * 承認フロー選択（見積から抽出した共通ロジック）
     */
    public function selectApprovalFlow($businessData, $user, string $flowType): ?ApprovalFlow
    {
        // 業務データから条件を構築
        $conditions = [
            'amount' => $businessData->total_amount ?? $businessData->amount ?? 0,
            'project_type' => $businessData->projectType?->code ?? 'general',
            'department_id' => $user->employee?->department_id,
            'user_id' => $user->id,
        ];

        // 利用可能な承認フローを取得
        $availableFlows = ApprovalFlow::where('is_active', true)
            ->where('flow_type', $flowType)
            ->orderBy('priority')
            ->get();

        // 条件に合致する承認フローを選択
        foreach ($availableFlows as $flow) {
            if ($this->matchesConditions($flow, $conditions, $user)) {
                return $flow;
            }
        }

        return null;
    }

    /**
     * 承認フローの条件マッチング（見積から抽出した共通ロジック）
     */
    public function matchesConditions(ApprovalFlow $flow, array $conditions, $user): bool
    {
        // 金額条件チェック
        if ($flow->conditions) {
            if (isset($flow->conditions['amount_min']) && $conditions['amount'] < $flow->conditions['amount_min']) {
                return false;
            }
            if (isset($flow->conditions['amount_max']) && $conditions['amount'] > $flow->conditions['amount_max']) {
                return false;
            }
        }

        // 承認依頼者権限チェック
        if ($flow->requesters) {
            $canRequest = false;
            foreach ($flow->requesters as $requester) {
                if ($this->matchesRequester($requester, $user)) {
                    $canRequest = true;
                    break;
                }
            }
            if (!$canRequest) {
                return false;
            }
        }

        return true;
    }

    /**
     * 承認依頼者条件のマッチング（見積から抽出した共通ロジック）
     */
    public function matchesRequester(array $requester, $user): bool
    {
        switch ($requester['type']) {
            case 'system_level':
                return $user->system_level === $requester['value'];
            case 'department':
                return $user->employee?->department_id == $requester['value'];
            case 'position':
                return $user->employee?->position_id == $requester['value'];
            case 'user':
                return $user->id == $requester['value'];
            default:
                return false;
        }
    }

    /**
     * 承認者権限チェック（見積から抽出した共通ロジック）
     */
    public function canApproveStep(array $step, $user): bool
    {
        // 承認者として指定されているかチェック
        $isApprover = false;
        foreach ($step['approvers'] as $approver) {
            if ($this->matchesApprover($approver, $user)) {
                $isApprover = true;
                break;
            }
        }

        if (!$isApprover) {
            return false;
        }

        // 利用可能権限チェック（承認ステップで許可された権限のみ）
        $userPermissions = $this->permissionService->getUserEffectivePermissions($user);
        $availablePermissions = $step['available_permissions'] ?? [];
        
        // デバッグログ
        \Log::info('承認権限チェック', [
            'user_id' => $user->id,
            'user_permissions' => $userPermissions,
            'available_permissions' => $availablePermissions,
            'step' => $step
        ]);
        
        // ユーザーの権限と承認ステップで許可された権限の交集合をチェック
        $allowedPermissions = array_intersect($userPermissions, $availablePermissions);
        
        \Log::info('承認権限チェック結果', [
            'allowed_permissions' => $allowedPermissions,
            'is_allowed' => !empty($allowedPermissions)
        ]);
        
        return !empty($allowedPermissions);
    }

    /**
     * 承認者条件のマッチング（見積から抽出した共通ロジック）
     */
    public function matchesApprover(array $approver, $user): bool
    {
        switch ($approver['type']) {
            case 'system_level':
                return $user->system_level === $approver['value'];
            case 'department':
                return $user->employee?->department_id == $approver['value'];
            case 'position':
                return $user->employee?->position_id == $approver['value'];
            case 'user':
                return $user->id == $approver['value'];
            default:
                return false;
        }
    }

    /**
     * 承認処理の共通ロジック（見積から抽出した共通ロジック）
     */
    public function processApproval(
        ApprovalRequest $approvalRequest, 
        $user, 
        string $comment, 
        string $action
    ): void {
        // 承認履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'step' => $approvalRequest->current_step ?? 1,
            'action' => $action,
            'acted_by' => $user->id,
            'acted_at' => now(),
            'comment' => $comment,
        ]);

        if ($action === 'approve') {
            $nextStepNumber = $this->getNextStepNumber($approvalRequest);
            
            if ($nextStepNumber) {
                // 次のステップに進む
                $approvalRequest->update([
                    'current_step' => $nextStepNumber,
                    'status' => 'pending',
                ]);
            } else {
                // 承認完了
                $approvalRequest->update([
                    'status' => 'approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                ]);
            }
        } elseif ($action === 'reject') {
            $approvalRequest->update([
                'status' => 'rejected',
                'rejected_by' => $user->id,
                'rejected_at' => now(),
            ]);
        } elseif ($action === 'return') {
            $approvalRequest->update([
                'status' => 'returned',
                'returned_by' => $user->id,
                'returned_at' => now(),
            ]);
        }
    }

    /**
     * 次のステップ番号を取得（見積から抽出した共通ロジック）
     */
    public function getNextStepNumber(ApprovalRequest $approvalRequest): ?int
    {
        $flow = ApprovalFlow::find($approvalRequest->approval_flow_id);
        
        if (!$flow || !$flow->approval_steps) {
            return null;
        }
        
        $approvalSteps = $flow->approval_steps;
        $currentStep = $approvalRequest->current_step;
        
        // 現在のステップより大きい最初のステップを取得
        foreach ($approvalSteps as $stepData) {
            if ($stepData['step'] > $currentStep) {
                return $stepData['step'];
            }
        }
        
        return null; // 次のステップがない
    }

    /**
     * 自動承認処理（見積から抽出した共通ロジック）
     */
    public function checkAndProcessAutoApproval(ApprovalRequest $approvalRequest, $user): void
    {
        $currentStep = $approvalRequest->current_step;
        $flow = ApprovalFlow::find($approvalRequest->approval_flow_id);
        
        if (!$flow || !$flow->approval_steps) {
            return; // フローまたはステップ設定が見つからない
        }
        
        $approvalSteps = $flow->approval_steps;
        
        // 現在のステップ設定を取得
        $stepConfig = null;
        foreach ($approvalSteps as $stepData) {
            if ($stepData['step'] == $currentStep) {
                $stepConfig = $stepData;
                break;
            }
        }
        
        if (!$stepConfig) {
            return; // ステップ設定が見つからない
        }
        
        // 1. 自動承認設定をチェック
        if (!($stepConfig['auto_approve_if_requester'] ?? false)) {
            return; // 自動承認設定が無効
        }
        
        // 2. 承認依頼作成者が承認者かチェック
        if (!$this->isRequesterAlsoApprover($stepConfig, $user)) {
            return; // 承認依頼作成者は承認者ではない
        }
        
        // 3. 自動承認処理を実行
        $this->processAutoApproval($approvalRequest, $stepConfig, $user);
    }

    /**
     * 承認依頼作成者が承認者でもあるかチェック（見積から抽出した共通ロジック）
     */
    public function isRequesterAlsoApprover($stepConfig, $user): bool
    {
        foreach ($stepConfig['approvers'] as $approver) {
            if ($this->matchesApprover($approver, $user)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 自動承認処理を実行（見積から抽出した共通ロジック）
     */
    public function processAutoApproval(ApprovalRequest $approvalRequest, $stepConfig, $user): void
    {
        $currentStep = $approvalRequest->current_step;
        
        \Log::info('自動承認処理開始', [
            'approval_request_id' => $approvalRequest->id,
            'current_step' => $currentStep,
            'user_id' => $user->id,
            'step_config' => $stepConfig
        ]);
        
        // 1. 自動承認履歴を記録
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'step' => $currentStep,
            'approver_id' => $user->id,
            'acted_by' => $user->id,
            'action' => 'auto_approve',
            'comment' => '自動承認（承認依頼作成者）',
            'acted_at' => now()
        ]);
        
        // 2. 承認条件をチェック
        if ($this->isStepCompleted($approvalRequest, $currentStep)) {
            // 3. 次のステップへ
            $nextStep = $currentStep + 1;
            $flow = $approvalRequest->approvalFlow;
            
            if ($nextStep <= count($flow->approval_steps) - 1) {
                $approvalRequest->update(['current_step' => $nextStep]);
                
                \Log::info('自動承認完了 - 次のステップへ', [
                    'approval_request_id' => $approvalRequest->id,
                    'next_step' => $nextStep
                ]);
                
                // 次のステップでも自動承認チェック
                $this->checkAndProcessAutoApproval($approvalRequest, $user);
            } else {
                // 最終承認完了
                $approvalRequest->update(['status' => 'approved']);
                
                \Log::info('自動承認完了 - 最終承認', [
                    'approval_request_id' => $approvalRequest->id
                ]);
            }
        }
    }

    /**
     * ステップが完了したかチェック（見積から抽出した共通ロジック）
     */
    public function isStepCompleted(ApprovalRequest $approvalRequest, $step): bool
    {
        // 現在のステップの承認履歴を取得（approveとauto_approveの両方を含む）
        $approvals = ApprovalHistory::where('approval_request_id', $approvalRequest->id)
            ->where('step', $step)
            ->whereIn('action', ['approve', 'auto_approve'])
            ->count();
        
        // 簡易実装：1人でも承認すれば完了とする
        // 実際の実装では、approval_typeに応じて判定する必要がある
        return $approvals > 0;
    }

    /**
     * 現在の承認ステップを取得
     */
    public function getCurrentApprovalStep(ApprovalRequest $approvalRequest): ?array
    {
        $flow = ApprovalFlow::find($approvalRequest->approval_flow_id);
        
        if (!$flow || !$flow->approval_steps) {
            return null;
        }
        
        $currentStep = $approvalRequest->current_step;
        
        foreach ($flow->approval_steps as $stepData) {
            if ($stepData['step'] == $currentStep) {
                return $stepData;
            }
        }
        
        return null;
    }
}
