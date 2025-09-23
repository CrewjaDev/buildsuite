<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\ApprovalRequest;
use App\Models\ApprovalFlow;
use App\Models\Estimate;
use App\Services\Approval\ApprovalFlowService;
use Illuminate\Http\Request;

class EstimateApprovalController extends Controller
{
    protected $approvalFlowService;

    public function __construct(ApprovalFlowService $approvalFlowService)
    {
        // 認証はapi.phpのRoute::middleware('auth:sanctum')で処理
        $this->approvalFlowService = $approvalFlowService;
    }

    /**
     * 承認依頼を作成
     */
    public function requestApproval(Request $request, $estimateId)
    {
        $user = auth()->user();
        
        // 見積を取得
        $estimate = Estimate::find($estimateId);
        
        if (!$estimate) {
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }

        // 既に承認依頼がある場合はエラー
        if ($estimate->approvalRequest) {
            return response()->json(['error' => '既に承認依頼が存在します'], 400);
        }

        // 動的承認フロー選択
        $approvalFlow = $this->selectApprovalFlow($estimate, $user);
        
        if (!$approvalFlow) {
            return response()->json(['error' => '適用可能な承認フローが見つかりません'], 400);
        }

        // 承認依頼データを準備
        $requestData = [
            'amount' => $estimate->total_amount,
            'project_type' => $estimate->projectType?->code ?? 'general',
            'department_id' => $user->employee?->department_id,
            'user_id' => $user->id,
            'estimate_id' => $estimate->id,
            'estimate_number' => $estimate->estimate_number,
            'project_name' => $estimate->project_name,
        ];

        // 承認依頼を作成
        $approvalRequest = ApprovalRequest::create([
            'approval_flow_id' => $approvalFlow->id,
            'request_type' => 'estimate',
            'request_id' => $estimate->id,
            'title' => "見積承認依頼 - " . ($estimate->estimate_number ?: 'No.' . $estimate->id),
            'description' => "見積「" . ($estimate->project_name ?: '未設定') . "」の承認依頼です。",
            'request_data' => $requestData,
            'current_step' => 1, // 最初の承認ステップ
            'status' => 'pending',
            'priority' => 'normal',
            'requested_by' => $user->id,
            'expires_at' => now()->addDays(7), // 7日間の有効期限
        ]);

        // 見積の承認関連フィールドを更新
        $estimate->update([
            'approval_request_id' => $approvalRequest->id,
            'approval_flow_id' => $approvalFlow->id,
            'approval_status' => 'pending',
            'status' => 'submitted', // 承認依頼提出済み状態に変更
        ]);

        return response()->json([
            'message' => '承認依頼を作成しました',
            'approval_request' => $approvalRequest,
            'approval_flow' => $approvalFlow
        ], 201);
    }

    /**
     * 動的承認フロー選択
     */
    private function selectApprovalFlow(Estimate $estimate, $user)
    {
        // 見積データから条件を構築
        $conditions = [
            'amount' => $estimate->total_amount,
            'project_type' => $estimate->projectType?->code ?? 'general',
            'department_id' => $user->employee?->department_id,
            'user_id' => $user->id,
        ];

        // 利用可能な承認フローを取得
        $availableFlows = ApprovalFlow::where('is_active', true)
            ->where('flow_type', 'estimate')
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
     * 承認フローの条件マッチング
     */
    private function matchesConditions(ApprovalFlow $flow, array $conditions, $user)
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
     * 承認依頼者条件のマッチング
     */
    private function matchesRequester(array $requester, $user)
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
     * 承認処理
     */
    public function approve(Request $request, $estimateId)
    {
        $user = auth()->user();
        
        // 見積を取得
        $estimate = Estimate::find($estimateId);
        if (!$estimate) {
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            return response()->json(['error' => '承認依頼が見つかりません'], 404);
        }

        // 現在の承認ステップを取得
        $currentStep = $this->getCurrentApprovalStep($approvalRequest);
        if (!$currentStep) {
            return response()->json(['error' => '承認ステップが見つかりません'], 404);
        }

        // 承認者権限チェック
        if (!$this->canApproveStep($currentStep, $user)) {
            return response()->json(['error' => '承認権限がありません'], 403);
        }

        // 承認処理実行
        $this->processApproval($approvalRequest, $user, $request->input('comment', ''));

        return response()->json(['message' => '承認しました']);
    }

    /**
     * 現在の承認ステップを取得
     */
    private function getCurrentApprovalStep(ApprovalRequest $approvalRequest)
    {
        $flow = $approvalRequest->approvalFlow;
        if (!$flow || !$flow->approval_steps) {
            return null;
        }

        $currentStepNumber = $approvalRequest->current_step;
        
        foreach ($flow->approval_steps as $step) {
            if ($step['step'] === $currentStepNumber) {
                return $step;
            }
        }

        return null;
    }

    /**
     * ステップの承認権限チェック
     */
    private function canApproveStep(array $step, $user)
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

        // 利用可能権限チェック
        $requiredPermissions = ['estimate.approval.approve'];
        foreach ($requiredPermissions as $permission) {
            if (!in_array($permission, $step['available_permissions'])) {
                return false;
            }
        }

        return true;
    }

    /**
     * 承認者条件のマッチング
     */
    private function matchesApprover(array $approver, $user)
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
     * 却下処理
     */
    public function reject(Request $request, $estimateId)
    {
        $user = auth()->user();
        
        // 見積を取得
        $estimate = Estimate::find($estimateId);
        if (!$estimate) {
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }

        // 権限チェック
        if (!$user->hasPermission('estimate.approval.reject')) {
            abort(403, '却下権限がありません');
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            abort(404, '承認依頼が見つかりません');
        }

        // 却下処理実行
        $this->processRejection($approvalRequest, $user, $request->comment);

        return response()->json(['message' => '却下しました']);
    }

    /**
     * 差し戻し処理
     */
    public function return(Request $request, $estimateId)
    {
        $user = auth()->user();
        
        // 見積を取得
        $estimate = Estimate::find($estimateId);
        if (!$estimate) {
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }

        // 権限チェック
        if (!$user->hasPermission('estimate.approval.return')) {
            abort(403, '差し戻し権限がありません');
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            abort(404, '承認依頼が見つかりません');
        }

        // 差し戻し処理実行
        $this->processReturn($approvalRequest, $user, $request->comment);

        return response()->json(['message' => '差し戻しました']);
    }

    /**
     * 承認依頼キャンセル
     */
    public function cancel(Request $request, $estimateId)
    {
        $user = auth()->user();
        
        // 見積を取得
        $estimate = Estimate::find($estimateId);
        if (!$estimate) {
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }

        // 権限チェック
        if (!$user->hasPermission('estimate.approval.cancel')) {
            abort(403, 'キャンセル権限がありません');
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            abort(404, '承認依頼が見つかりません');
        }

        // 申請者のみキャンセル可能
        if ($approvalRequest->requested_by !== $user->id) {
            abort(403, '申請者のみキャンセル可能です');
        }

        // キャンセル処理実行
        $this->processCancel($approvalRequest, $user);

        return response()->json(['message' => '承認依頼をキャンセルしました']);
    }

    /**
     * 承認処理の実装
     */
    private function processApproval(ApprovalRequest $approvalRequest, $user, string $comment)
    {
        $currentStep = $this->getCurrentApprovalStep($approvalRequest);
        
        // 承認履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'step' => $approvalRequest->current_step,
            'action' => 'approve',
            'acted_by' => $user->id,
            'acted_at' => now(),
            'comment' => $comment,
        ]);

        // 次のステップがあるかチェック
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

            // 見積のステータスを更新
            $estimate = Estimate::find($approvalRequest->request_id);
            if ($estimate) {
                $estimate->update([
                    'approval_status' => 'approved',
                    'status' => 'approved',
                    'approved_by' => $user->id,
                ]);
            }
        }
    }

    /**
     * 次のステップ番号を取得
     */
    private function getNextStepNumber(ApprovalRequest $approvalRequest)
    {
        $flow = $approvalRequest->approvalFlow;
        if (!$flow || !$flow->approval_steps) {
            return null;
        }

        $currentStepNumber = $approvalRequest->current_step;
        $nextStepNumber = null;

        foreach ($flow->approval_steps as $step) {
            if ($step['step'] > $currentStepNumber) {
                if ($nextStepNumber === null || $step['step'] < $nextStepNumber) {
                    $nextStepNumber = $step['step'];
                }
            }
        }

        return $nextStepNumber;
    }

    /**
     * 却下処理の実装
     */
    private function processRejection(ApprovalRequest $approvalRequest, $user, string $comment)
    {
        // 却下履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'step' => $approvalRequest->current_step,
            'action' => 'reject',
            'acted_by' => $user->id,
            'acted_at' => now(),
            'comment' => $comment,
        ]);

        // 承認依頼を却下
        $approvalRequest->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        // 見積のステータスを更新
        $estimate = Estimate::find($approvalRequest->request_id);
        if ($estimate) {
            $estimate->update([
                'approval_status' => 'rejected',
                'status' => 'rejected',
                'approved_by' => $user->id,
            ]);
        }
    }

    /**
     * 差し戻し処理の実装
     */
    private function processReturn(ApprovalRequest $approvalRequest, $user, string $comment)
    {
        // 差し戻し履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'step' => $approvalRequest->current_step,
            'action' => 'return',
            'acted_by' => $user->id,
            'acted_at' => now(),
            'comment' => $comment,
        ]);

        // 承認依頼を差し戻し
        $approvalRequest->update([
            'status' => 'returned',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        // 見積のステータスを更新
        $estimate = Estimate::find($approvalRequest->request_id);
        if ($estimate) {
            $estimate->update([
                'approval_status' => 'returned',
                'status' => 'draft', // 差し戻し時は下書きに戻す
                'approved_by' => $user->id,
            ]);
        }
    }

    /**
     * キャンセル処理の実装
     */
    private function processCancel(ApprovalRequest $approvalRequest, $user)
    {
        // キャンセル履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'step' => $approvalRequest->current_step,
            'action' => 'cancel',
            'acted_by' => $user->id,
            'acted_at' => now(),
            'comment' => '申請者がキャンセル',
        ]);

        // 承認依頼をキャンセル
        $approvalRequest->update([
            'status' => 'cancelled',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        // 見積のステータスを更新
        $estimate = Estimate::find($approvalRequest->request_id);
        if ($estimate) {
            $estimate->update([
                'approval_status' => 'cancelled',
                'status' => 'draft', // キャンセル時は下書きに戻す
                'approved_by' => $user->id,
            ]);
        }
    }
}
