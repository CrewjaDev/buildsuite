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
        
        return $this->abacService->evaluateAccess($user, $resourceData, [], 'view', 'estimate');
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
        
        return $this->abacService->evaluateAccess($user, $resourceData, [], 'update', 'estimate');
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
        
        return $this->abacService->evaluateAccess($user, $resourceData, [], 'delete', 'estimate');
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
