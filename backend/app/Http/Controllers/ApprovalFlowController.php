<?php

namespace App\Http\Controllers;

use App\Models\ApprovalFlow;
use App\Models\User;
use App\Models\Department;
use App\Models\Position;
use App\Models\SystemLevel;
use App\Services\Approval\ApprovalFlowService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ApprovalFlowController extends Controller
{
    protected $approvalFlowService;

    public function __construct(ApprovalFlowService $approvalFlowService)
    {
        $this->approvalFlowService = $approvalFlowService;
    }

    /**
     * 承認フロー一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ApprovalFlow::query();

            // フロータイプでフィルタリング
            if ($request->has('flow_type')) {
                $query->where('flow_type', $request->flow_type);
            }

            // アクティブ状態でフィルタリング
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $flows = $query->orderByRaw('COALESCE(priority, 999) ASC')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $flows
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認フローの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 利用可能な承認フロー一覧を取得
     */
    public function available(Request $request): JsonResponse
    {
        try {
            $requestType = $request->get('request_type', 'estimate');
            $amount = $request->get('amount');
            $projectType = $request->get('project_type');
            $departmentId = $request->get('department_id');

            // 基本的なクエリ（シンプル版）
            $flows = ApprovalFlow::where('is_active', true)
                ->where('flow_type', $requestType)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $flows
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '利用可能な承認フローの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認フローを作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'flow_type' => 'required|string|in:estimate,budget,purchase,contract,general',
                'conditions' => 'nullable|array',
                'priority' => 'integer|min:1',
                'requesters' => 'required|array|min:1',
                'requesters.*.type' => 'required|string|in:system_level,position,user,department',
                'requesters.*.value' => 'required',
                'requesters.*.display_name' => 'required|string',
                'approval_steps' => 'required|array|min:1|max:5',
                'approval_steps.*.step' => 'required|integer|min:0|max:5', // ステップ0を許可
                'approval_steps.*.name' => 'required|string|max:255',
                'approval_steps.*.approvers' => 'required|array|min:1',
                'approval_steps.*.condition' => 'required|array',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $flow = ApprovalFlow::create([
                'name' => $request->name,
                'description' => $request->description,
                'flow_type' => $request->flow_type,
                'conditions' => $request->conditions,
                'priority' => $request->priority ?? 1,
                'requesters' => $request->requesters,
                'approval_steps' => $request->approval_steps,
                'is_active' => $request->boolean('is_active', true),
                'is_system' => false,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            // フローの検証
            $errors = $this->approvalFlowService->validateFlow($flow);
            if (!empty($errors)) {
                $flow->delete();
                return response()->json([
                    'success' => false,
                    'message' => '承認フローの設定が不正です',
                    'errors' => $errors
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => '承認フローが作成されました',
                'data' => $flow
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認フローの作成に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認フローテンプレート一覧を取得
     */
    public function templates(): JsonResponse
    {
        try {
            $templates = [
                'small_org_standard' => [
                    'id' => 'small_org_standard',
                    'name' => '小規模組織標準フロー',
                    'description' => '小規模組織用の1段階承認',
                    'steps' => 1,
                    'approvers' => ['office_manager'],
                    'suitable_for' => '5-10人の組織'
                ],
                'medium_org_standard' => [
                    'id' => 'medium_org_standard',
                    'name' => '中規模組織標準フロー',
                    'description' => '中規模組織用の1段階承認',
                    'steps' => 1,
                    'approvers' => ['supervisor'],
                    'suitable_for' => '10-50人の組織'
                ],
                'large_org_standard' => [
                    'id' => 'large_org_standard',
                    'name' => '大規模組織標準フロー',
                    'description' => '大規模組織用の2段階承認',
                    'steps' => 2,
                    'approvers' => ['supervisor', 'accounting_manager'],
                    'suitable_for' => '50人以上の組織'
                ],
                'high_value_flow' => [
                    'id' => 'high_value_flow',
                    'name' => '高額案件フロー',
                    'description' => '高額案件用の3段階承認',
                    'steps' => 3,
                    'approvers' => ['supervisor', 'accounting_manager', 'executive'],
                    'suitable_for' => '1000万円以上の案件',
                    'conditions' => [
                        'type' => 'amount',
                        'field' => 'total_amount',
                        'operator' => 'greater_than_or_equal',
                        'value' => 10000000
                    ]
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレートの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * テンプレートから承認フローを作成
     */
    public function createFromTemplate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_id' => 'required|string',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'flow_type' => 'required|string|in:estimate,budget,order,progress,payment',
                'customizations' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $flow = $this->approvalFlowService->createFromTemplate(
                $request->template_id,
                $request->name,
                $request->description,
                $request->flow_type,
                $request->customizations ?? []
            );

            return response()->json([
                'success' => true,
                'message' => '承認フローが作成されました',
                'data' => $flow->load([
                    'steps.approverSystemLevel',
                    'steps.approver',
                    'conditions'
                ])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認フローの作成に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認フロー詳細を取得
     */
    public function show($id): JsonResponse
    {
        try {
            $flow = ApprovalFlow::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $flow
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認フローの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認フローを更新
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'flow_type' => 'string|in:estimate,budget,purchase,contract,general',
                'conditions' => 'nullable|array',
                'priority' => 'integer|min:1',
                'requesters' => 'array|min:1',
                'requesters.*.type' => 'string|in:system_level,position,user,department',
                'requesters.*.value' => 'required',
                'requesters.*.display_name' => 'required|string',
                'approval_steps' => 'array|min:1|max:5',
                'approval_steps.*.step' => 'integer|min:0|max:5', // ステップ0を許可
                'approval_steps.*.name' => 'string|max:255',
                'approval_steps.*.approvers' => 'array|min:1',
                'approval_steps.*.condition' => 'array',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $flow = ApprovalFlow::findOrFail($id);
            
            // システムフローは一部のフィールドのみ更新可能
            $updateData = $request->only([
                'name', 'description', 'is_active', 'priority'
            ]);

            if (!$flow->is_system) {
                $updateData = array_merge($updateData, $request->only([
                    'flow_type', 'conditions', 'requesters', 'approval_steps'
                ]));
            }

            $updateData['updated_by'] = auth()->id();
            $flow->update($updateData);

            // フローの検証
            $errors = $this->approvalFlowService->validateFlow($flow);
            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => '承認フローの設定が不正です',
                    'errors' => $errors
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => '承認フローが更新されました',
                'data' => $flow
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認フローの更新に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 部署一覧を取得
     */
    public function departments(): JsonResponse
    {
        try {
            $departments = Department::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']);

            return response()->json([
                'success' => true,
                'data' => $departments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '部署一覧の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 職位一覧を取得
     */
    public function positions(): JsonResponse
    {
        try {
            $positions = Position::where('is_active', true)
                ->orderBy('level')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'level']);

            return response()->json([
                'success' => true,
                'data' => $positions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '職位一覧の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * システム権限レベル一覧を取得
     */
    public function systemLevels(): JsonResponse
    {
        try {
            $systemLevels = SystemLevel::where('is_active', true)
                ->orderBy('level')
                ->get(['id', 'name', 'code', 'level']);

            return response()->json([
                'success' => true,
                'data' => $systemLevels
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限レベル一覧の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ユーザー一覧を取得
     */
    public function users(): JsonResponse
    {
        try {
            $users = User::with('employee')
                ->where('is_active', true)
                ->get(['id', 'employee_id'])
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->employee->name ?? 'Unknown',
                        'employee_id' => $user->employee_id
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザー一覧の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認フローを複製
     */
    public function duplicate(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $originalFlow = ApprovalFlow::findOrFail($id);
            $user = auth()->user();

            $newFlow = $this->approvalFlowService->duplicateFlow($originalFlow, $request->name, $user);

            return response()->json([
                'success' => true,
                'message' => '承認フローが複製されました',
                'data' => $newFlow
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認フローの複製に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認フローを削除
     */
    public function destroy($id): JsonResponse
    {
        try {
            $flow = ApprovalFlow::findOrFail($id);
            
            // システムフローは削除不可
            if ($flow->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システムフローは削除できません'
                ], 403);
            }

            $flow->delete();

            return response()->json([
                'success' => true,
                'message' => '承認フローが削除されました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認フローの削除に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
