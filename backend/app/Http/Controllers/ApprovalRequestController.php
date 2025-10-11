<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequest;
use App\Models\ApprovalFlow;
use App\Models\User;
use App\Services\Approval\ApprovalFlowService;
use App\Services\Approval\ApprovalPermissionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ApprovalRequestController extends Controller
{
    protected $approvalFlowService;
    protected $approvalPermissionService;

    public function __construct(ApprovalFlowService $approvalFlowService, ApprovalPermissionService $approvalPermissionService)
    {
        $this->approvalFlowService = $approvalFlowService;
        $this->approvalPermissionService = $approvalPermissionService;
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
     * 承認済み件数を取得（ダッシュボード用）
     */
    public function approvedCount(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // 承認済みの承認依頼を取得
            $approvedRequests = ApprovalRequest::where('status', 'approved')
                ->with('approvalFlow')
                ->get();

            $count = 0;
            foreach ($approvedRequests as $request) {
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
                'message' => '承認済み件数の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 却下件数を取得（ダッシュボード用）
     */
    public function rejectedCount(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // 却下の承認依頼を取得
            $rejectedRequests = ApprovalRequest::where('status', 'rejected')
                ->with('approvalFlow')
                ->get();

            $count = 0;
            foreach ($rejectedRequests as $request) {
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
                'message' => '却下件数の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 差戻し件数を取得（ダッシュボード用）
     */
    public function returnedCount(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // 差戻しの承認依頼を取得
            $returnedRequests = ApprovalRequest::where('status', 'returned')
                ->with('approvalFlow')
                ->get();

            $count = 0;
            foreach ($returnedRequests as $request) {
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
                'message' => '差戻し件数の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認件数一括取得（ダッシュボード用）
     */
    public function approvalCounts(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // 承認者権限がある場合は承認者視点、承認依頼一覧権限がある場合は依頼者視点
            if ($user->hasPermission('approval.authority')) {
                // 承認者視点の件数取得
                $counts = [
                    'pending' => $this->getApprovalRequestsByUserView('pending', true),
                    'reviewing' => $this->getApprovalRequestsByUserView('reviewing', true),
                    'approved' => $this->getApprovalRequestsByUserView('approved', true),
                    'rejected' => $this->getApprovalRequestsByUserView('rejected', true),
                    'returned' => $this->getApprovalRequestsByUserView('returned', true)
                ];
            } elseif ($user->hasPermission('approval.approval.list')) {
                // 承認依頼者視点の件数取得
                $counts = [
                    'pending' => $this->getRequesterApprovalCounts('pending'),
                    'reviewing' => $this->getRequesterApprovalCounts('reviewing'),
                    'approved' => $this->getRequesterApprovalCounts('approved'),
                    'rejected' => $this->getRequesterApprovalCounts('rejected'),
                    'returned' => $this->getRequesterApprovalCounts('returned')
                ];
            } else {
                $counts = [
                    'pending' => 0,
                    'reviewing' => 0,
                    'approved' => 0,
                    'rejected' => 0,
                    'returned' => 0
                ];
            }

            return response()->json([
                'success' => true,
                'counts' => $counts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認件数の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼者視点の件数取得
     */
    private function getRequesterApprovalCounts($status): int
    {
        $user = auth()->user();
        
        $query = ApprovalRequest::where('requested_by', $user->id);
        
        switch ($status) {
            case 'pending':
                // 承認待ち: 承認中で、まだ承認されていない依頼
                return $query->where('status', 'pending')->count();
                
            case 'reviewing':
                // 審査中: 承認中で、現在審査中の依頼（承認待ちと同じ）
                return $query->where('status', 'pending')->count();
                
            case 'approved':
                // 承認済み: 承認完了した依頼
                return $query->where('status', 'approved')->count();
                
            case 'rejected':
                // 却下: 却下された依頼
                return $query->where('status', 'rejected')->count();
                
            case 'returned':
                // 差戻し: 差戻しされた依頼
                return $query->where('status', 'returned')->count();
                
            default:
                return 0;
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
        
        // ステップ番号で直接検索
        $step = null;
        foreach ($steps as $stepData) {
            if ($stepData['step'] == $currentStep) {
                $step = $stepData;
                break;
            }
        }
        
        if (!$step || !isset($step['approvers'])) {
            return false;
        }
        
        foreach ($step['approvers'] as $approver) {
            switch ($approver['type']) {
                case 'user_id':
                case 'user':
                    if ($approver['value'] == $user->id) return true;
                    break;
                case 'system_level':
                    if ($approver['value'] == $user->system_level) return true;
                    break;
                case 'role':
                    // ユーザーの役割を確認
                    if ($user->roles && $user->roles->contains('id', $approver['value'])) return true;
                    break;
                case 'department_id':
                case 'department':
                    if ($user->employee && $approver['value'] == $user->employee->department_id) return true;
                    break;
                case 'position_id':
                case 'position':
                    if ($user->employee && $approver['value'] == $user->employee->position_id) return true;
                    break;
            }
        }
        
        return false;
    }

    /**
     * ユーザー視点でのフィルタリング
     */
    private function filterByUserView($requests, $user, $userViewStatus)
    {
        return array_filter($requests, function ($request) use ($user, $userViewStatus) {
            switch ($userViewStatus) {
                case 'pending':
                    // 承認待ち: 自分が承認待ちの依頼
                    return $request->status === 'pending' 
                        && $request->sub_status === null
                        && $this->isUserApprover($user, $request->approvalFlow, $request->current_step);

                case 'reviewing':
                    // 審査中: 自分が現在審査中の依頼
                    return $request->status === 'pending' 
                        && $request->sub_status === 'reviewing'
                        && $this->isUserApprover($user, $request->approvalFlow, $request->current_step);

                case 'approved':
                    // 承認済み: 自分が承認した依頼
                    if ($request->status === 'approved') {
                        return true;
                    }
                    // 自分が承認したが、まだ全体が完了していない依頼
                    if ($request->status === 'pending') {
                        $hasApproved = \DB::table('approval_histories')
                            ->where('approval_request_id', $request->id)
                            ->where('acted_by', $user->id)
                            ->where('action', 'approve')
                            ->exists();
                        
                        \Log::info('Approved filter check', [
                            'request_id' => $request->id,
                            'user_id' => $user->id,
                            'has_approved' => $hasApproved
                        ]);
                        
                        return $hasApproved;
                    }
                    return false;

                case 'rejected':
                    // 却下: 却下された依頼
                    return $request->status === 'rejected';

                case 'returned':
                    // 差戻し: 差戻しされた依頼
                    return $request->status === 'returned';

                default:
                    return true;
            }
        });
    }


    /**
     * 承認依頼の統一取得メソッド
     * @param string $userViewStatus ユーザー視点のステータス
     * @param bool $countOnly 件数のみ取得するかどうか
     * @param array $options 追加オプション（ページネーション等）
     */
    private function getApprovalRequestsByUserView($userViewStatus, $countOnly = false, $options = [])
    {
        $user = auth()->user();
        
        // 全ての承認依頼を取得
        $allRequests = ApprovalRequest::with(['approvalFlow', 'requestedBy.employee'])->get();
        
        // ユーザー視点でフィルタリング
        $filteredRequests = $this->filterByUserView($allRequests->all(), $user, $userViewStatus);
        
        if ($countOnly) {
            return count($filteredRequests);
        }
        
        // ページネーション処理
        $perPage = $options['per_page'] ?? 15;
        $page = $options['page'] ?? 1;
        $offset = ($page - 1) * $perPage;
        
        $paginatedData = array_slice($filteredRequests, $offset, $perPage);
        
        return [
            'data' => $paginatedData,
            'total' => count($filteredRequests),
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil(count($filteredRequests) / $perPage)
        ];
    }

    /**
     * 承認依頼一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $query = ApprovalRequest::with(['approvalFlow', 'requestedBy.employee']);

        // 承認者の視点でのフィルタリング
        if ($request->has('user_view_status')) {
            // user_view_statusが指定された場合は、基本的なフィルタリングのみ実行
            // 詳細なフィルタリングは後でPHPで実行
        } else {
            // 従来のステータスフィルタリング（後方互換性のため）
            if ($request->has('status')) {
                $status = $request->status;
                if (is_array($status)) {
                    $query->whereIn('status', $status);
                } else {
                    $query->where('status', $status);
                }
            }

            // サブステータスでフィルタリング
            if ($request->has('sub_status')) {
                $subStatus = $request->sub_status;
                if ($subStatus === 'null') {
                    $query->whereNull('sub_status');
                } else {
                    $query->where('sub_status', $subStatus);
                }
            }
        }

            // リクエストタイプでフィルタリング
            if ($request->has('request_type')) {
                $requestType = $request->request_type;
                if (is_array($requestType)) {
                    $query->whereIn('request_type', $requestType);
                } else {
                    $query->where('request_type', $requestType);
                }
            }

            // 優先度でフィルタリング
            if ($request->has('priority')) {
                $priority = $request->priority;
                if (is_array($priority)) {
                    $query->whereIn('priority', $priority);
                } else {
                    $query->where('priority', $priority);
                }
            }

            // 依頼者でフィルタリング
            if ($request->has('requested_by')) {
                $requestedBy = $request->requested_by;
                if (is_array($requestedBy)) {
                    $query->whereIn('requested_by', $requestedBy);
                } else {
                    $query->where('requested_by', $requestedBy);
                }
            }

            // 承認フローIDでフィルタリング
            if ($request->has('approval_flow_id')) {
                $approvalFlowId = $request->approval_flow_id;
                if (is_array($approvalFlowId)) {
                    $query->whereIn('approval_flow_id', $approvalFlowId);
                } else {
                    $query->where('approval_flow_id', $approvalFlowId);
                }
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

            // 承認者の視点でのフィルタリングを適用
            if ($request->has('user_view_status')) {
                $userViewStatus = $request->user_view_status;
                $formattedData = $this->filterByUserView($formattedData, $user, $userViewStatus);
                
                // シンプルにコレクションを更新
                $requests->setCollection(collect($formattedData));
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
            $user = auth()->user();
            $approvalRequest = ApprovalRequest::with([
                'approvalFlow',
                'requestedBy.employee',
                'approvedBy.employee',
                'rejectedBy.employee',
                'returnedBy.employee',
                'cancelledBy.employee',
                'histories.actedBy.employee',
                'editingUser.employee'
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
            
            // 編集中ユーザーの表示名を設定
            if ($approvalRequest->editingUser && $approvalRequest->editingUser->employee) {
                $approvalRequest->editing_user_name = $approvalRequest->editingUser->employee->name;
            } else {
                $approvalRequest->editing_user_name = $approvalRequest->editingUser ? $approvalRequest->editingUser->login_id : null;
            }
            
            // ステータス表示情報を設定
            $approvalRequest->status_display = $approvalRequest->getStatusDisplay();
            
            // ユーザー権限情報を取得
            $userPermissions = $this->approvalPermissionService->getUserPermissions($user, $approvalRequest);
            
            \Log::info('承認依頼詳細 - requester_name: ' . $approvalRequest->requester_name);

            return response()->json([
                'success' => true,
                'data' => $approvalRequest,
                'user_permissions' => $userPermissions
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
            if (!$this->approvalPermissionService->canApprove($user, $approvalRequest)) {
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
                // 審査中の場合は審査完了処理を実行
                if ($approvalRequest->sub_status === 'reviewing') {
                    $approvalRequest->completeReviewing($user);
                }

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

            // 却下権限をチェック
            if (!$this->approvalPermissionService->canReject($user, $approvalRequest)) {
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
                // 審査中の場合は審査完了処理を実行
                if ($approvalRequest->sub_status === 'reviewing') {
                    $approvalRequest->completeReviewing($user);
                }

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

            // 差し戻し権限をチェック
            if (!$this->approvalPermissionService->canReturn($user, $approvalRequest)) {
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
                // 審査中の場合は審査完了処理を実行
                if ($approvalRequest->sub_status === 'reviewing') {
                    $approvalRequest->completeReviewing($user);
                }

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

            // キャンセル権限をチェック
            if (!$this->approvalPermissionService->canCancel($user, $approvalRequest)) {
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

    /**
     * 編集開始
     */
    public function startEditing($id): JsonResponse
    {
        try {
            $user = auth()->user();
            $approvalRequest = ApprovalRequest::findOrFail($id);

            // 権限チェック
            if (!$this->approvalPermissionService->canEdit($user, $approvalRequest)) {
                return response()->json([
                    'success' => false,
                    'message' => '編集権限がありません'
                ], 403);
            }

            // 編集開始処理
            if (!$approvalRequest->startEditing($user)) {
                return response()->json([
                    'success' => false,
                    'message' => '編集を開始できませんでした'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => '編集を開始しました',
                'data' => $approvalRequest->load(['editingUser.employee'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '編集開始に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 編集終了
     */
    public function stopEditing($id): JsonResponse
    {
        try {
            $user = auth()->user();
            $approvalRequest = ApprovalRequest::findOrFail($id);

            // 編集終了処理
            if (!$approvalRequest->stopEditing($user)) {
                return response()->json([
                    'success' => false,
                    'message' => '編集を終了できませんでした'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => '編集を終了しました',
                'data' => $approvalRequest
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '編集終了に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 審査開始
     */
    public function startReviewing($id): JsonResponse
    {
        try {
            $user = auth()->user();
            $approvalRequest = ApprovalRequest::findOrFail($id);

            // 承認者かチェック
            if (!$approvalRequest->isApprover($user)) {
                return response()->json([
                    'success' => false,
                    'message' => '承認者ではありません'
                ], 403);
            }

            // 審査開始処理
            if (!$approvalRequest->startReviewing($user)) {
                return response()->json([
                    'success' => false,
                    'message' => '審査を開始できませんでした'
                ], 400);
            }

            // 審査開始の履歴を記録
            $approvalRequest->histories()->create([
                'action' => 'start_reviewing',
                'acted_by' => $user->id,
                'acted_at' => now(),
                'comment' => '審査を開始しました',
                'step' => $approvalRequest->current_step
            ]);

            return response()->json([
                'success' => true,
                'message' => '審査を開始しました',
                'data' => $approvalRequest
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '審査開始に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
