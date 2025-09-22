<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequestType;
use App\Models\ApprovalFlow;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ApprovalRequestTypeController extends Controller
{
    /**
     * 承認依頼タイプ一覧を取得
     */
    public function index(): JsonResponse
    {
        try {
            $requestTypes = ApprovalRequestType::with(['defaultApprovalFlow', 'creator', 'updater'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $requestTypes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼タイプの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼タイプを作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'code' => 'required|string|max:50|unique:approval_request_types,code',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'icon' => 'nullable|string|max:100',
                'color' => 'nullable|string|max:20',
                'default_approval_flow_id' => 'nullable|exists:approval_flows,id',
                'is_active' => 'boolean',
                'sort_order' => 'integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $requestType = ApprovalRequestType::create([
                ...$request->only([
                    'code', 'name', 'description', 'icon', 'color',
                    'default_approval_flow_id', 'is_active', 'sort_order'
                ]),
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '承認依頼タイプが作成されました',
                'data' => $requestType->load(['defaultApprovalFlow', 'creator'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼タイプの作成に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼タイプの詳細を取得
     */
    public function show(string $id): JsonResponse
    {
        try {
            $requestType = ApprovalRequestType::with(['defaultApprovalFlow', 'creator', 'updater', 'templates'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $requestType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼タイプの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼タイプを更新
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'code' => 'required|string|max:50|unique:approval_request_types,code,' . $id,
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'icon' => 'nullable|string|max:100',
                'color' => 'nullable|string|max:20',
                'default_approval_flow_id' => 'nullable|exists:approval_flows,id',
                'is_active' => 'boolean',
                'sort_order' => 'integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $requestType = ApprovalRequestType::findOrFail($id);
            $requestType->update([
                ...$request->only([
                    'code', 'name', 'description', 'icon', 'color',
                    'default_approval_flow_id', 'is_active', 'sort_order'
                ]),
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '承認依頼タイプが更新されました',
                'data' => $requestType->load(['defaultApprovalFlow', 'creator', 'updater'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼タイプの更新に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼タイプを削除
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $requestType = ApprovalRequestType::findOrFail($id);
            $requestType->delete();

            return response()->json([
                'success' => true,
                'message' => '承認依頼タイプが削除されました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼タイプの削除に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認フロー一覧を取得（選択用）
     */
    public function getApprovalFlows(): JsonResponse
    {
        try {
            $approvalFlows = ApprovalFlow::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'flow_type']);

            return response()->json([
                'success' => true,
                'data' => $approvalFlows
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認フローの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
