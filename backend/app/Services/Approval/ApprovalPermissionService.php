<?php

namespace App\Services\Approval;

use App\Models\ApprovalRequest;
use App\Models\User;
use App\Services\PermissionService;

class ApprovalPermissionService
{
    protected $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * ユーザーの権限情報を取得
     */
    public function getUserPermissions(User $user, ApprovalRequest $approvalRequest): array
    {
        return [
            'can_edit' => $this->canEdit($user, $approvalRequest),
            'can_cancel' => $this->canCancel($user, $approvalRequest),
            'can_approve' => $this->canApprove($user, $approvalRequest),
            'can_reject' => $this->canReject($user, $approvalRequest),
            'can_return' => $this->canReturn($user, $approvalRequest),
            'is_requester' => $approvalRequest->isRequester($user),
            'is_approver' => $approvalRequest->isApprover($user),
        ];
    }

    /**
     * 編集可能かチェック
     */
    public function canEdit(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー1: 承認フロー設定での許可チェック
        if (!$this->checkFlowConfig($approvalRequest, 'edit')) {
            return false;
        }
        
        // 2. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.edit")) {
            return false;
        }
        
        // 3. 業務ロジックチェック
        return $approvalRequest->canEdit($user);
    }

    /**
     * キャンセル可能かチェック
     */
    public function canCancel(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー1: 承認フロー設定での許可チェック
        if (!$this->checkFlowConfig($approvalRequest, 'cancel')) {
            return false;
        }
        
        // 2. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.edit")) {
            return false;
        }
        
        // 3. 業務ロジックチェック
        return $approvalRequest->canCancel($user);
    }

    /**
     * 承認可能かチェック
     */
    public function canApprove(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.approval.approve")) {
            return false;
        }
        
        // 2. 業務ロジックチェック
        return $approvalRequest->isApprover($user);
    }

    /**
     * 却下可能かチェック
     */
    public function canReject(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.approval.reject")) {
            return false;
        }
        
        // 2. 業務ロジックチェック
        return $approvalRequest->isApprover($user);
    }

    /**
     * 差し戻し可能かチェック
     */
    public function canReturn(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.approval.return")) {
            return false;
        }
        
        // 2. 業務ロジックチェック
        return $approvalRequest->isApprover($user);
    }

    /**
     * 承認フロー設定での許可チェック
     */
    private function checkFlowConfig(ApprovalRequest $approvalRequest, string $action): bool
    {
        $approvalFlow = $approvalRequest->approvalFlow;
        $flowConfig = $approvalFlow->flow_config ?? [];
        
        // 基本設定のチェック
        if ($action === 'edit' && !($flowConfig['allow_editing_after_request'] ?? false)) {
            return false;
        }
        
        if ($action === 'cancel' && !($flowConfig['allow_cancellation_after_request'] ?? false)) {
            return false;
        }
        
        // ステップ別設定のチェック
        $currentStep = $approvalRequest->current_step;
        $subStatus = $approvalRequest->sub_status ?? 'null';
        
        if ($action === 'edit') {
            $editingConditions = $approvalFlow->getStepEditingConfig($currentStep);
            
            switch ($subStatus) {
                case 'reviewing':
                    return $editingConditions['allow_during_reviewing'] ?? false;
                case 'step_approved':
                    return $editingConditions['allow_during_step_approved'] ?? false;
                case 'expired':
                    return $editingConditions['allow_during_expired'] ?? false;
                default:
                    return $editingConditions['allow_during_pending'] ?? true;
            }
        }
        
        if ($action === 'cancel') {
            $cancellationConditions = $approvalFlow->getStepCancellationConfig($currentStep);
            
            switch ($subStatus) {
                case 'reviewing':
                    return $cancellationConditions['allow_during_reviewing'] ?? false;
                case 'step_approved':
                    return $cancellationConditions['allow_during_step_approved'] ?? false;
                case 'expired':
                    return $cancellationConditions['allow_during_expired'] ?? false;
                default:
                    return $cancellationConditions['allow_during_pending'] ?? true;
            }
        }
        
        return true;
    }
}
