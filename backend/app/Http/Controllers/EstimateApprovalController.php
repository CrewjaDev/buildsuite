<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\ApprovalRequest;
use App\Models\Estimate;
use App\Services\ApprovalFlowService;
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
        
        // 手動で見積を取得
        $estimate = Estimate::find($estimateId);
        
        \Log::info('Current user for approval request:', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'estimate_id' => $estimateId,
            'estimate_found' => $estimate ? 'yes' : 'no'
        ]);
        
        if (!$estimate) {
            \Log::error('Estimate not found', [
                'estimate_id' => $estimateId
            ]);
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }
        
        \Log::info('Estimate object details:', [
            'id' => $estimate->id,
            'id_type' => gettype($estimate->id),
            'estimate_number' => $estimate->estimate_number,
            'project_name' => $estimate->project_name,
            'total_amount' => $estimate->total_amount,
            'created_by' => $estimate->created_by,
            'exists' => $estimate->exists,
            'was_recently_created' => $estimate->wasRecentlyCreated
        ]);

        // 権限チェック
        if (!$user->hasPermission('estimate.approval.request')) {
            abort(403, '承認依頼作成権限がありません');
        }

        // 既に承認依頼がある場合はエラー
        if ($estimate->approvalRequest) {
            return response()->json(['error' => '既に承認依頼が存在します'], 400);
        }

        // 承認フローを作成
        \Log::info('Creating approval flow for estimate:', ['estimate_id' => $estimate->id]);
        $approvalFlow = $this->approvalFlowService->createApprovalFlow($estimate);
        \Log::info('Approval flow created:', ['approval_flow_id' => $approvalFlow->id]);

        // デバッグ: 承認依頼作成データを確認
        $approvalRequestData = [
            'approval_flow_id' => $approvalFlow->id,
            'request_type' => 'estimate',
            'request_id' => $estimate->id ?: 0,
            'title' => "見積承認依頼 - " . ($estimate->estimate_number ?: 'No.' . $estimate->id),
            'description' => "見積「" . ($estimate->project_name ?: '未設定') . "」の承認依頼です。",
            'requested_by' => $user->id,
            'status' => 'pending',
            'priority' => 'normal',
            'created_by' => $user->id,
        ];
        
        \Log::info('ApprovalRequest creation data:', $approvalRequestData);
        
        // 承認依頼を作成
        $approvalRequest = ApprovalRequest::create($approvalRequestData);

        // 見積の承認関連フィールドを更新
        $estimate->update([
            'approval_request_id' => $approvalRequest->id,
            'approval_flow_id' => $approvalFlow->id,
            'approval_status' => 'pending',
            'status' => 'submitted', // 承認依頼提出済み状態に変更
        ]);

        return response()->json($approvalRequest, 201);
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

        // 権限チェック
        if (!$user->hasPermission('estimate.approval.approve')) {
            abort(403, '承認権限がありません');
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            abort(404, '承認依頼が見つかりません');
        }

        $currentStep = $approvalRequest->currentStep;
        if (!$currentStep) {
            abort(404, '承認ステップが見つかりません');
        }

        // 承認者として指定されているかチェック
        if ($currentStep->approver_type === 'system_level') {
            $requiredLevel = $currentStep->approver_id;
            if (!$user->hasSystemLevel($requiredLevel)) {
                abort(403, '承認権限がありません');
            }
        }

        // 承認処理実行
        $this->processApproval($approvalRequest, $user, $request->comment);

        return response()->json(['message' => '承認しました']);
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
        $currentStep = $approvalRequest->currentStep;
        
        // 承認履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'approval_step_id' => $currentStep->id,
            'approver_id' => $user->id,
            'action' => 'approved',
            'comment' => $comment,
            'approved_at' => now(),
        ]);

        // 次のステップがあるかチェック
        $nextStep = $approvalRequest->getNextStep();
        
        if ($nextStep) {
            // 次のステップに進む
            $approvalRequest->update([
                'current_step_id' => $nextStep->id,
                'status' => 'pending',
            ]);
        } else {
            // 承認完了
            $approvalRequest->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            // 見積のステータスを更新
            $estimate = $approvalRequest->requestable;
            $estimate->update([
                'approval_status' => 'approved',
                'status' => 'approved' // 見積のステータスも承認済みに変更
            ]);
        }
    }

    /**
     * 却下処理の実装
     */
    private function processRejection(ApprovalRequest $approvalRequest, $user, string $comment)
    {
        $currentStep = $approvalRequest->currentStep;
        
        // 却下履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'approval_step_id' => $currentStep->id,
            'approver_id' => $user->id,
            'action' => 'rejected',
            'comment' => $comment,
            'approved_at' => now(),
        ]);

        // 承認依頼を却下
        $approvalRequest->update([
            'status' => 'rejected',
            'rejected_at' => now(),
        ]);

        // 見積のステータスを更新
        $estimate = $approvalRequest->requestable;
        $estimate->update([
            'approval_status' => 'rejected',
            'status' => 'rejected' // 見積のステータスも却下に変更
        ]);
    }

    /**
     * 差し戻し処理の実装
     */
    private function processReturn(ApprovalRequest $approvalRequest, $user, string $comment)
    {
        $currentStep = $approvalRequest->currentStep;
        
        // 差し戻し履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'approval_step_id' => $currentStep->id,
            'approver_id' => $user->id,
            'action' => 'returned',
            'comment' => $comment,
            'approved_at' => now(),
        ]);

        // 承認依頼を差し戻し
        $approvalRequest->update([
            'status' => 'returned',
            'returned_at' => now(),
        ]);

        // 見積のステータスを更新
        $estimate = $approvalRequest->requestable;
        $estimate->update([
            'approval_status' => 'returned',
            'status' => 'draft' // 差し戻し時は下書きに戻す
        ]);
    }

    /**
     * キャンセル処理の実装
     */
    private function processCancel(ApprovalRequest $approvalRequest, $user)
    {
        // キャンセル履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'approval_step_id' => $approvalRequest->current_step_id,
            'approver_id' => $user->id,
            'action' => 'cancelled',
            'comment' => '申請者がキャンセル',
            'approved_at' => now(),
        ]);

        // 承認依頼をキャンセル
        $approvalRequest->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        // 見積のステータスを更新
        $estimate = $approvalRequest->requestable;
        $estimate->update([
            'approval_status' => 'cancelled',
            'status' => 'draft' // キャンセル時は下書きに戻す
        ]);
    }
}
