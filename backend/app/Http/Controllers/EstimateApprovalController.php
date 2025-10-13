<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\ApprovalRequest;
use App\Models\ApprovalFlow;
use App\Models\Estimate;
use App\Services\Approval\ApprovalFlowService;
use App\Services\Approval\CommonApprovalService;
use App\Services\Approval\UniversalApprovalService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EstimateApprovalController extends Controller
{
    protected $approvalFlowService;
    protected $commonApprovalService;
    protected $universalApprovalService;

    public function __construct(
        ApprovalFlowService $approvalFlowService,
        CommonApprovalService $commonApprovalService,
        UniversalApprovalService $universalApprovalService
    ) {
        // 認証はapi.phpのRoute::middleware('auth:sanctum')で処理
        $this->approvalFlowService = $approvalFlowService;
        $this->commonApprovalService = $commonApprovalService;
        $this->universalApprovalService = $universalApprovalService;
    }

    /**
     * 承認依頼を作成
     */
    public function requestApproval(Request $request, $estimateId)
    {
        $user = auth()->user();
        
        \Log::info('承認依頼作成開始', [
            'estimate_id' => $estimateId,
            'user_id' => $user->id,
            'approval_flow_id' => $request->get('approval_flow_id'),
            'request_data' => $request->all()
        ]);
        
        try {
            // 汎用承認サービスで承認依頼を作成
            $approvalRequest = $this->universalApprovalService->createApprovalRequest(
                'estimate',
                $estimateId,
                $user,
                $request->get('approval_flow_id')
            );

            return response()->json([
                'message' => '承認依頼を作成しました',
                'approval_request' => $approvalRequest,
                'approval_flow' => $approvalRequest->approvalFlow
            ], 201);
        } catch (\App\Services\Approval\ApprovalException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            \Log::error('承認依頼作成エラー', [
                'estimate_id' => $estimateId,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => '承認依頼の作成に失敗しました'], 500);
        }
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
                return $user->system_level_id == $requester['value'];
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
        return $this->processApprovalAction($request, $estimateId, 'approve');
    }

    /**
     * 却下処理
     */
    public function reject(Request $request, $estimateId)
    {
        return $this->processApprovalAction($request, $estimateId, 'reject');
    }

    /**
     * 差し戻し処理
     */
    public function return(Request $request, $estimateId)
    {
        return $this->processApprovalAction($request, $estimateId, 'return');
    }

    /**
     * 承認処理の共通メソッド
     */
    private function processApprovalAction(Request $request, $estimateId, $action)
    {
        $user = auth()->user();
        
        try {
            // 汎用承認サービスで承認処理を実行
            $result = $this->universalApprovalService->processApproval(
                'estimate',
                $estimateId,
                $user,
                $action,
                $request->input('comment', '')
            );

            return response()->json([
                'message' => $result->message,
                'data' => [
                    'status' => $action === 'approve' ? 'approved' : ($action === 'reject' ? 'rejected' : 'returned'),
                    'acted_by' => $user->id,
                    'acted_at' => now()->toISOString(),
                    'comment' => $request->input('comment', '')
                ]
            ]);
        } catch (\App\Services\Approval\ApprovalException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            \Log::error('承認処理エラー', [
                'estimate_id' => $estimateId,
                'user_id' => $user->id,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => '承認処理に失敗しました'], 500);
        }
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

        // 利用可能権限チェック（承認ステップで許可された権限のみ）
        $userPermissions = \App\Services\PermissionService::getUserEffectivePermissions($user);
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
     * 承認者条件のマッチング
     */
    private function matchesApprover(array $approver, $user)
    {
        switch ($approver['type']) {
            case 'system_level':
                return $user->system_level_id == $approver['value'];
            case 'department':
                return $user->employee?->department_id == $approver['value'];
            case 'position':
                return $user->employee?->position_id == $approver['value'];
            case 'user':
                return $user->id == $approver['value'];
            case 'role':
                // ユーザーが指定された役割を持っているかチェック
                return $user->roles()->where('role_id', $approver['value'])->exists();
            default:
                return false;
        }
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
    private function processApproval(ApprovalRequest $approvalRequest, $user, ?string $comment, string $action = 'approve')
    {
        // コメントがnullの場合は空文字列に変換
        $comment = $comment ?? '';
        
        $currentStep = $this->getCurrentApprovalStep($approvalRequest);
        
        // デバッグ情報をログに出力
        \Log::info('承認処理開始', [
            'approval_request_id' => $approvalRequest->id,
            'current_step' => $approvalRequest->current_step,
            'action' => $action,
            'user_id' => $user->id
        ]);
        
        // 承認履歴を作成
        ApprovalHistory::create([
            'approval_request_id' => $approvalRequest->id,
            'step' => $approvalRequest->current_step ?? 1, // デフォルト値を設定
            'action' => $action,
            'acted_by' => $user->id,
            'acted_at' => now(),
            'comment' => $comment,
        ]);

        // アクションに応じて処理を分岐
        if ($action === 'approve') {
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
        } elseif ($action === 'reject') {
            // 却下処理
            $approvalRequest->update([
                'status' => 'rejected',
                'rejected_by' => $user->id,
                'rejected_at' => now(),
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
        } elseif ($action === 'return') {
            // 差し戻し処理
            $approvalRequest->update([
                'status' => 'returned',
                'returned_by' => $user->id,
                'returned_at' => now(),
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

        // 承認ステップのみを対象とする（ステップ0は承認依頼作成なので除外）
        $approvalSteps = array_filter($flow->approval_steps, function($step) {
            return $step['step'] > 0; // ステップ1以上のみ
        });

        foreach ($approvalSteps as $step) {
            if ($step['step'] > $currentStepNumber) {
                if ($nextStepNumber === null || $step['step'] < $nextStepNumber) {
                    $nextStepNumber = $step['step'];
                }
            }
        }

        return $nextStepNumber;
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

    /**
     * 承認状態を取得
     */
    public function getApprovalStatus($estimateId)
    {
        $estimate = Estimate::find($estimateId);
        if (!$estimate) {
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            return response()->json([
                'data' => [
                    'has_approval_request' => false,
                    'status' => null
                ]
            ]);
        }

        return response()->json([
            'data' => [
                'has_approval_request' => true,
                'status' => $approvalRequest->status,
                'current_step' => $approvalRequest->current_step,
                'created_at' => $approvalRequest->created_at,
                'updated_at' => $approvalRequest->updated_at
            ]
        ]);
    }

    /**
     * 承認履歴を取得
     */
    public function getApprovalHistory($estimateId)
    {
        $estimate = Estimate::find($estimateId);
        if (!$estimate) {
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            return response()->json(['data' => []]);
        }

        $histories = $approvalRequest->histories()
            ->with(['actedBy.employee', 'approvalStep'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $histories->map(function ($history) {
                return [
                    'id' => $history->id,
                    'action' => $history->action,
                    'comment' => $history->comment,
                    'acted_by' => $history->actedBy?->employee?->name ?? '不明',
                    'acted_at' => $history->created_at,
                    'step_name' => $history->approvalStep?->name ?? '不明'
                ];
            })
        ]);
    }

    /**
     * 承認者ステータスを取得
     */
    public function getApproverStatus($estimateId)
    {
        $user = auth()->user();
        $estimate = Estimate::find($estimateId);
        
        if (!$estimate) {
            return response()->json(['error' => '見積データが見つかりません'], 404);
        }

        $approvalRequest = $estimate->approvalRequest;
        if (!$approvalRequest) {
            return response()->json([
                'data' => [
                    'is_approver' => false,
                    'reason' => '承認依頼が存在しません'
                ]
            ]);
        }

        // 現在の承認ステップを取得
        $currentStep = $this->getCurrentApprovalStep($approvalRequest);
        if (!$currentStep) {
            return response()->json([
                'data' => [
                    'is_approver' => false,
                    'reason' => '承認ステップが見つかりません'
                ]
            ]);
        }

        // 承認者権限チェック
        $isApprover = $this->canApproveStep($currentStep, $user);

        return response()->json([
            'data' => [
                'is_approver' => $isApprover,
                'current_step' => $currentStep['name'] ?? '不明',
                'approval_request_status' => $approvalRequest->status,
                'reason' => $isApprover ? '承認者です' : '承認者ではありません'
            ]
        ]);
    }

    /**
     * ユーザー別承認状態を取得
     */
    public function getUserApprovalStatus(string $id): JsonResponse
    {
        try {
            $estimate = Estimate::findOrFail($id);
            $user = auth()->user();
            
            if (!$estimate->approval_request_id) {
                return response()->json([
                    'status' => 'not_started',
                    'step' => 0,
                    'step_name' => '承認依頼なし',
                    'can_act' => false,
                    'message' => '承認依頼が作成されていません'
                ]);
            }
            
            $approvalRequest = ApprovalRequest::with('approvalFlow')->find($estimate->approval_request_id);
            if (!$approvalRequest) {
                return response()->json([
                    'status' => 'not_started',
                    'step' => 0,
                    'step_name' => '承認依頼なし',
                    'can_act' => false,
                    'message' => '承認依頼が見つかりません'
                ]);
            }
            
            $userStatus = $approvalRequest->getUserApprovalStatus($user);
            
            // デバッグ情報を追加
            $userStatus['debug'] = [
                'user_id' => $user->id,
                'user_name' => $user->name ?? '不明',
                'approval_request_id' => $approvalRequest->id,
                'requested_by' => $approvalRequest->requested_by,
                'current_step' => $approvalRequest->current_step,
                'approval_flow_id' => $approvalRequest->approval_flow_id
            ];
            
            return response()->json($userStatus);
            
        } catch (\Exception $e) {
            \Log::error('ユーザー承認状態取得エラー', [
                'estimate_id' => $id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => '承認状態の取得に失敗しました'], 500);
        }
    }

    /**
     * 自動承認チェックと処理
     */
    private function checkAndProcessAutoApproval(ApprovalRequest $approvalRequest, $user)
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
     * 承認依頼作成者が承認者でもあるかチェック
     */
    private function isRequesterAlsoApprover($stepConfig, $user)
    {
        foreach ($stepConfig['approvers'] as $approver) {
            switch ($approver['type']) {
                case 'system_level':
                    if ($user->system_level_id == $approver['value']) {
                        return true;
                    }
                    break;
                case 'position':
                    if ($user->employee && $user->employee->position_id == $approver['value']) {
                        return true;
                    }
                    break;
                case 'user':
                    if ($user->id == $approver['value']) {
                        return true;
                    }
                    break;
                case 'department':
                    if ($user->employee && $user->employee->department_id == $approver['value']) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }

    /**
     * 自動承認処理を実行
     */
    private function processAutoApproval(ApprovalRequest $approvalRequest, $stepConfig, $user)
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
                
                // 見積の承認状態も更新
                $estimate = Estimate::where('approval_request_id', $approvalRequest->id)->first();
                if ($estimate) {
                    $estimate->update([
                        'approval_status' => 'approved',
                        'status' => 'approved'
                    ]);
                }
                
                \Log::info('自動承認完了 - 最終承認', [
                    'approval_request_id' => $approvalRequest->id
                ]);
            }
        }
    }

    /**
     * ステップが完了したかチェック
     */
    private function isStepCompleted(ApprovalRequest $approvalRequest, $step)
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
     * 見積データの状態更新（見積固有の処理）
     */
    private function updateEstimateStatus(Estimate $estimate, string $action, $user): void
    {
        match($action) {
            'approve' => $estimate->update([
                'approval_status' => 'approved',
                'status' => 'approved',
                'approved_by' => $user->id,
            ]),
            'reject' => $estimate->update([
                'approval_status' => 'rejected',
                'status' => 'rejected',
            ]),
            'return' => $estimate->update([
                'approval_status' => 'returned',
                'status' => 'draft',
            ]),
        };
    }
}
