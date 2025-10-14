<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Estimate;
use App\Services\ABACPolicyEvaluationService;

class EstimatePolicy
{
    protected $abacService;

    public function __construct(ABACPolicyEvaluationService $abacService)
    {
        $this->abacService = $abacService;
    }

    /**
     * 見積の閲覧権限を判定
     */
    public function view(User $user, Estimate $estimate): bool
    {
        $resourceData = [
            'department_id' => $estimate->department_id,
            'visibility' => $estimate->visibility,
            'created_by' => $estimate->created_by,
            'status' => $estimate->status,
        ];
        
        // ABACポリシーによる評価を試行
        $abacResult = $this->abacService->evaluateAccess($user, $resourceData, [], 'view', 'estimate');
        
        // ABACポリシーが設定されている場合はその結果を返す
        if ($abacResult !== null) {
            return $abacResult;
        }
        
        // ABACポリシーが設定されていない場合のフォールバック
        // 基本的な権限チェック
        if (!\App\Services\PermissionService::hasPermission($user, 'estimate.view')) {
            return false;
        }
        
        // 作成者の場合は常に閲覧可能
        if ($estimate->created_by === $user->id) {
            return true;
        }
        
        // その他の場合は拒否
        return false;
    }

    /**
     * 見積の更新権限を判定
     */
    public function update(User $user, Estimate $estimate): bool
    {
        $resourceData = [
            'department_id' => $estimate->department_id,
            'visibility' => $estimate->visibility,
            'created_by' => $estimate->created_by,
            'status' => $estimate->status,
        ];
        
        // ABACポリシーによる評価を試行
        $abacResult = $this->abacService->evaluateAccess($user, $resourceData, [], 'edit', 'estimate');
        
        // ABACポリシーが設定されている場合はその結果を返す
        if ($abacResult !== null) {
            return $abacResult;
        }
        
        // ABACポリシーが設定されていない場合のフォールバック
        // 基本的な権限チェック
        if (!\App\Services\PermissionService::hasPermission($user, 'estimate.edit')) {
            return false;
        }
        
        // ステータスチェック（下書きのみ編集可能）
        if (!in_array($estimate->status, ['draft'])) {
            return false;
        }
        
        // 作成者のチェック（作成者のみ編集可能）
        if ($estimate->created_by !== $user->id) {
            return false;
        }
        
        return true;
    }

    /**
     * 見積の削除権限を判定
     */
    public function delete(User $user, Estimate $estimate): bool
    {
        $resourceData = [
            'department_id' => $estimate->department_id,
            'visibility' => $estimate->visibility,
            'created_by' => $estimate->created_by,
            'status' => $estimate->status,
        ];
        
        // ABACポリシーによる評価を試行
        $abacResult = $this->abacService->evaluateAccess($user, $resourceData, [], 'delete', 'estimate');
        
        // ABACポリシーが設定されている場合はその結果を返す
        if ($abacResult !== null) {
            return $abacResult;
        }
        
        // ABACポリシーが設定されていない場合のフォールバック
        // 基本的な権限チェック
        if (!\App\Services\PermissionService::hasPermission($user, 'estimate.delete')) {
            return false;
        }
        
        // ステータスチェック（下書きのみ削除可能）
        if (!in_array($estimate->status, ['draft'])) {
            return false;
        }
        
        // 作成者のチェック（作成者のみ削除可能）
        if ($estimate->created_by !== $user->id) {
            return false;
        }
        
        return true;
    }

    /**
     * 見積の承認依頼権限を判定
     */
    public function requestApproval(User $user, Estimate $estimate): bool
    {
        $resourceData = [
            'department_id' => $estimate->department_id,
            'visibility' => $estimate->visibility,
            'created_by' => $estimate->created_by,
            'status' => $estimate->status,
        ];
        
        return $this->abacService->evaluateAccess($user, $resourceData, [], 'approval.request', 'estimate');
    }

    /**
     * 見積の承認権限を判定
     */
    public function approve(User $user, Estimate $estimate): bool
    {
        $resourceData = [
            'department_id' => $estimate->department_id,
            'visibility' => $estimate->visibility,
            'created_by' => $estimate->created_by,
            'status' => $estimate->status,
        ];
        
        return $this->abacService->evaluateAccess($user, $resourceData, [], 'approval.approve', 'estimate');
    }

    /**
     * 見積の承認依頼キャンセル権限を判定
     */
    public function cancelApproval(User $user, Estimate $estimate): bool
    {
        $resourceData = [
            'department_id' => $estimate->department_id,
            'visibility' => $estimate->visibility,
            'created_by' => $estimate->created_by,
            'status' => $estimate->status,
        ];
        
        return $this->abacService->evaluateAccess($user, $resourceData, [], 'approval.cancel', 'estimate');
    }
}
