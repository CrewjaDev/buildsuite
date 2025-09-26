<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\ApprovalFlow;
use App\Models\User;
use App\Services\Approval\ApprovalFlowService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ApprovalRequestController extends Controller
{
    protected $approvalFlowService;

    public function __construct(ApprovalFlowService $approvalFlowService)
    {
        $this->approvalFlowService = $approvalFlowService;
    }

    /**
     * 承認待ち件数を取得（ダッシュボード用）
     */
    public function pendingCount(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // 承認待ちの承認依頼を取得
            $pendingRequests = ApprovalRequest::where('status', 'pending')
                ->with('approvalFlow')
                ->get();

            $count = 0;
            foreach ($pendingRequests as $request) {
                if ($this->isUserApprover($user, $request->approvalFlow, $request->current_step)) {
                    $count++;
                }
            }

            return response()->json([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認待ち件数の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ユーザーが承認者かどうかを判定
     */
    private function isUserApprover($user, $approvalFlow, $currentStep)
    {
        if (!$approvalFlow || !$approvalFlow->approval_steps) {
            return false;
        }

        $steps = $approvalFlow->approval_steps;
        $step = collect($steps)->firstWhere('step', $currentStep);
        
        if (!$step || !isset($step['approvers'])) {
            return false;
        }
        
        foreach ($step['approvers'] as $approver) {
            switch ($approver['type']) {
                case 'user':
                    if ($approver['value'] == $user->id) return true;
                    break;
                case 'system_level':
                    if ($approver['value'] == $user->system_level) return true;
                    break;
                case 'department':
                    if ($user->employee && $approver['value'] == $user->employee->department_id) return true;
                    break;
                case 'position':
                    if ($user->employee && $approver['value'] == $user->employee->position_id) return true;
                    break;
            }
        }
        
        return false;
    }

    /**
     * 承認依頼一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $query = ApprovalRequest::with(['approvalFlow', 'requestedBy.employee']);

            // ステータスでフィルタリング
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // フロータイプでフィルタリング
            if ($request->has('flow_type')) {
                $query->whereHas('approvalFlow', function ($q) use ($request) {
                    $q->where('flow_type', $request->flow_type);
                });
            }

            // 依頼者でフィルタリング
            if ($request->has('requested_by')) {
                $query->where('requested_by', $request->requested_by);
            }

            // 承認待ちの依頼（現在のユーザーが承認可能なもの）
            if ($request->boolean('pending_for_me')) {
                $query->where('status', 'pending')
                    ->where('current_step', function ($q) use ($user) {
                        // 現在のステップでユーザーが承認可能かチェック
                        $q->whereRaw('EXISTS (
                            SELECT 1 FROM approval_flows af 
                            WHERE af.id = approval_requests.approval_flow_id 
                            AND JSON_EXTRACT(af.approval_steps, CONCAT("$[", approval_requests.current_step - 1, "].approvers")) 
                            LIKE CONCAT("%", ?, "%")
                        )', [$user->id]);
                    });
            }

            $requests = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            // レスポンスデータを整形
            $formattedData = $requests->items();
            foreach ($formattedData as $item) {
                // 依頼者の表示名を設定
                if ($item->requestedBy && $item->requestedBy->employee) {
                    $item->requester_name = $item->requestedBy->employee->name;
                } else {
                    $item->requester_name = $item->requestedBy ? $item->requestedBy->login_id : '不明';
                }
            }

            return response()->json([
                'success' => true,
                'data' => $formattedData,
                'meta' => [
                    'current_page' => $requests->currentPage(),
                    'last_page' => $requests->lastPage(),
                    'per_page' => $requests->perPage(),
                    'total' => $requests->total(),
                    'from' => $requests->firstItem(),
                    'to' => $requests->lastItem(),
                ],
                'links' => [
                    'first' => $requests->url(1),
                    'last' => $requests->url($requests->lastPage()),
                    'prev' => $requests->previousPageUrl(),
                    'next' => $requests->nextPageUrl(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認履歴を取得
     */
    public function histories($id): JsonResponse
    {
        try {
            $approvalRequest = ApprovalRequest::findOrFail($id);
            
            $histories = $approvalRequest->histories()
                ->with(['actedBy.employee'])
                ->orderBy('created_at', 'asc')
                ->get();

            // レスポンスデータを整形
            $formattedHistories = $histories->map(function ($history) {
                return [
                    'id' => $history->id,
                    'step' => $history->step,
                    'action' => $history->action,
                    'comment' => $history->comment,
                    'acted_at' => $history->acted_at,
                    'acted_by_name' => $history->actedBy && $history->actedBy->employee 
                        ? $history->actedBy->employee->name 
                        : ($history->actedBy ? $history->actedBy->login_id : '不明'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedHistories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認履歴の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼を作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'approval_flow_id' => 'nullable|exists:approval_flows,id',
                'request_type' => 'required|string|max:50',
                'request_id' => 'required|string',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'request_data' => 'nullable|array',
                'priority' => 'string|in:low,normal,high,urgent',
                'expires_at' => 'nullable|date|after:now'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $requestData = $request->request_data ?? [];

            // 承認フローを動的に選択
            $approvalFlow = null;
            if ($request->has('approval_flow_id')) {
                $approvalFlow = ApprovalFlow::find($request->approval_flow_id);
            } else {
                $approvalFlow = $this->approvalFlowService->selectApprovalFlow($requestData, $user->id);
            }

            if (!$approvalFlow) {
                return response()->json([
                    'success' => false,
                    'message' => '適用可能な承認フローがありません'
                ], 422);
            }

            // 承認依頼者権限をチェック
            if (!$approvalFlow->canCreateApprovalRequest($user)) {
                return response()->json([
                    'success' => false,
                    'message' => '承認依頼権限がありません'
                ], 403);
            }

            DB::beginTransaction();

            try {
                // 承認依頼を作成
                $approvalRequest = ApprovalRequest::create([
                    'approval_flow_id' => $approvalFlow->id,
                    'request_type' => $request->request_type,
                    'request_id' => $request->request_id,
                    'title' => $request->title,
                    'description' => $request->description,
                    'request_data' => $requestData,
                    'current_step' => 1,
                    'status' => 'pending',
                    'priority' => $request->priority ?? 'normal',
                    'requested_by' => $user->id,
                    'expires_at' => $request->expires_at,
                    'created_by' => $user->id,
                    'updated_by' => $user->id,
                ]);

                // 適用可能な承認ステップを決定
                $applicableSteps = $this->approvalFlowService->determineApprovalSteps($approvalRequest);

                if (empty($applicableSteps)) {
                    throw new \Exception('適用可能な承認ステップがありません');
                }

                // 第1ステップの承認者に通知（実装は後で追加）
                $this->notifyApprovers($approvalRequest, $applicableSteps[0]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => '承認依頼が作成されました',
                    'data' => $approvalRequest->load(['approvalFlow', 'requestedBy.employee'])
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼の作成に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼詳細を取得
     */
    public function show($id): JsonResponse
    {
        try {
            $approvalRequest = ApprovalRequest::with([
                'approvalFlow',
                'requestedBy.employee',
                'approvedBy.employee',
                'rejectedBy.employee',
                'returnedBy.employee',
                'cancelledBy.employee',
                'histories.actedBy.employee'
            ])->findOrFail($id);

            // 依頼者の表示名を設定
            \Log::info('承認依頼詳細 - requestedBy: ' . ($approvalRequest->requestedBy ? 'exists' : 'null'));
            if ($approvalRequest->requestedBy) {
                \Log::info('承認依頼詳細 - employee: ' . ($approvalRequest->requestedBy->employee ? 'exists' : 'null'));
                if ($approvalRequest->requestedBy->employee) {
                    \Log::info('承認依頼詳細 - employee name: ' . $approvalRequest->requestedBy->employee->name);
                }
            }
            
            if ($approvalRequest->requestedBy && $approvalRequest->requestedBy->employee) {
                $approvalRequest->requester_name = $approvalRequest->requestedBy->employee->name;
            } else {
                $approvalRequest->requester_name = $approvalRequest->requestedBy ? $approvalRequest->requestedBy->login_id : '不明';
            }
            
            \Log::info('承認依頼詳細 - requester_name: ' . $approvalRequest->requester_name);

            return response()->json([
                'success' => true,
                'data' => $approvalRequest
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認処理
     */
    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'comment' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $approvalRequest = ApprovalRequest::with('approvalFlow')->findOrFail($id);

            // 承認者権限をチェック
            if (!$approvalRequest->approvalFlow->canApprove($user, $approvalRequest->current_step, $approvalRequest->request_data ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => '承認権限がありません'
                ], 403);
            }

            // ステータスチェック
            if ($approvalRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => '承認可能な状態ではありません'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // 承認履歴を記録
                $approvalRequest->histories()->create([
                    'step' => $approvalRequest->current_step,
                    'action' => 'approve',
                    'acted_by' => $user->id,
                    'acted_at' => now(),
                    'comment' => $request->comment,
                    'created_by' => $user->id,
                    'updated_by' => $user->id,
                ]);

                // 現在のステップの承認状況をチェック
                $currentStepApprovals = $approvalRequest->histories()
                    ->where('step', $approvalRequest->current_step)
                    ->where('action', 'approve')
                    ->get();

                // ステップが完了したかチェック
                if ($approvalRequest->approvalFlow->isStepCompleted($approvalRequest->current_step, $currentStepApprovals->toArray())) {
                    // 次のステップを決定
                    $applicableSteps = $this->approvalFlowService->determineApprovalSteps($approvalRequest);
                    $nextStep = $this->findNextStep($applicableSteps, $approvalRequest->current_step);

                    if ($nextStep) {
                        // 次のステップへ
                        $approvalRequest->update([
                            'current_step' => $nextStep['step'],
                            'updated_by' => $user->id
                        ]);

                        // 次のステップの承認者に通知
                        $this->notifyApprovers($approvalRequest, $nextStep);
                    } else {
                        // 最終承認完了
                        $approvalRequest->update([
                            'status' => 'approved',
                            'approved_by' => $user->id,
                            'approved_at' => now(),
                            'updated_by' => $user->id
                        ]);
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => '承認が完了しました',
                    'data' => $approvalRequest->load(['approvalFlow', 'histories.actedBy.employee'])
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認処理に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 却下処理
     */
    public function reject(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'comment' => 'required|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $approvalRequest = ApprovalRequest::with('approvalFlow')->findOrFail($id);

            // 承認者権限をチェック
            if (!$approvalRequest->approvalFlow->canApprove($user, $approvalRequest->current_step, $approvalRequest->request_data ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => '却下権限がありません'
                ], 403);
            }

            // ステータスチェック
            if ($approvalRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => '却下可能な状態ではありません'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // 却下履歴を記録
                $approvalRequest->histories()->create([
                    'step' => $approvalRequest->current_step,
                    'action' => 'reject',
                    'acted_by' => $user->id,
                    'acted_at' => now(),
                    'comment' => $request->comment,
                    'created_by' => $user->id,
                    'updated_by' => $user->id,
                ]);

                // 承認依頼を却下
                $approvalRequest->update([
                    'status' => 'rejected',
                    'rejected_by' => $user->id,
                    'rejected_at' => now(),
                    'updated_by' => $user->id
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => '却下が完了しました',
                    'data' => $approvalRequest->load(['approvalFlow', 'histories.actedBy.employee'])
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '却下処理に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 差し戻し処理
     */
    public function return(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'comment' => 'required|string|max:1000',
                'return_to_step' => 'nullable|integer|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $approvalRequest = ApprovalRequest::with('approvalFlow')->findOrFail($id);

            // 承認者権限をチェック
            if (!$approvalRequest->approvalFlow->canApprove($user, $approvalRequest->current_step, $approvalRequest->request_data ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => '差し戻し権限がありません'
                ], 403);
            }

            // ステータスチェック
            if ($approvalRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => '差し戻し可能な状態ではありません'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // 差し戻し履歴を記録
                $approvalRequest->histories()->create([
                    'step' => $approvalRequest->current_step,
                    'action' => 'return',
                    'acted_by' => $user->id,
                    'acted_at' => now(),
                    'comment' => $request->comment,
                    'created_by' => $user->id,
                    'updated_by' => $user->id,
                ]);

                // 差し戻し先のステップを決定
                $returnToStep = $request->return_to_step ?? max(1, $approvalRequest->current_step - 1);

                // 承認依頼を差し戻し
                $approvalRequest->update([
                    'status' => 'returned',
                    'current_step' => $returnToStep,
                    'returned_by' => $user->id,
                    'returned_at' => now(),
                    'updated_by' => $user->id
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => '差し戻しが完了しました',
                    'data' => $approvalRequest->load(['approvalFlow', 'histories.actedBy.employee'])
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '差し戻し処理に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * キャンセル処理
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'comment' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = auth()->user();
            $approvalRequest = ApprovalRequest::findOrFail($id);

            // 依頼者または承認者権限をチェック
            $canCancel = $approvalRequest->requested_by === $user->id;
            if (!$canCancel) {
                $canCancel = $approvalRequest->approvalFlow->canApprove($user, $approvalRequest->current_step, $approvalRequest->request_data ?? []);
            }

            if (!$canCancel) {
                return response()->json([
                    'success' => false,
                    'message' => 'キャンセル権限がありません'
                ], 403);
            }

            // ステータスチェック
            if ($approvalRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'キャンセル可能な状態ではありません'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // キャンセル履歴を記録
                $approvalRequest->histories()->create([
                    'step' => $approvalRequest->current_step,
                    'action' => 'cancel',
                    'acted_by' => $user->id,
                    'acted_at' => now(),
                    'comment' => $request->comment,
                    'created_by' => $user->id,
                    'updated_by' => $user->id,
                ]);

                // 承認依頼をキャンセル
                $approvalRequest->update([
                    'status' => 'cancelled',
                    'cancelled_by' => $user->id,
                    'cancelled_at' => now(),
                    'updated_by' => $user->id
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'キャンセルが完了しました',
                    'data' => $approvalRequest->load(['approvalFlow', 'histories.actedBy.employee'])
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'キャンセル処理に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 次のステップを検索
     */
    private function findNextStep(array $applicableSteps, int $currentStep): ?array
    {
        foreach ($applicableSteps as $step) {
            if ($step['step'] > $currentStep) {
                return $step;
            }
        }
        return null;
    }

    /**
     * 承認者に通知（実装は後で追加）
     */
    private function notifyApprovers(ApprovalRequest $approvalRequest, array $step): void
    {
        // TODO: 通知機能の実装
        // メール通知、システム内通知、Slack通知等
    }
}
