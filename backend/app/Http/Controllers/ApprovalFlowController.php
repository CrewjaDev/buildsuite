<?php

namespace App\Http\Controllers;

use App\Models\ApprovalFlow;
use App\Models\ApprovalStep;
use App\Models\ApprovalCondition;
use App\Services\ApprovalFlowService;
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
            $flows = ApprovalFlow::with([
                'steps.approverSystemLevel',
                'steps.approver',
                'conditions'
            ])
                ->orderBy('priority', 'desc')
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
            $flow = ApprovalFlow::with([
                'steps.approverSystemLevel',
                'steps.approver',
                'conditions'
            ])
                ->findOrFail($id);

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
                'is_active' => 'boolean',
                'priority' => 'integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $flow = ApprovalFlow::findOrFail($id);
            $flow->update($request->only(['name', 'description', 'is_active', 'priority']));

            return response()->json([
                'success' => true,
                'message' => '承認フローが更新されました',
                'data' => $flow->load([
                    'steps.approverSystemLevel',
                    'steps.approver',
                    'conditions'
                ])
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
