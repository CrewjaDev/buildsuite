<?php

namespace App\Http\Controllers;

use App\Models\ApprovalRequestTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ApprovalRequestTemplateController extends Controller
{
    /**
     * 承認依頼テンプレート一覧を取得
     */
    public function index(): JsonResponse
    {
        try {
            $templates = ApprovalRequestTemplate::with(['creator', 'updater', 'requestType'])
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼テンプレートの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼テンプレートを作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'request_type' => 'required|string|max:50',
                'template_data' => 'required|array',
                'is_active' => 'boolean',
                'is_system' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template = ApprovalRequestTemplate::create([
                ...$request->only([
                    'name', 'description', 'request_type', 'template_data',
                    'is_active', 'is_system'
                ]),
                'usage_count' => 0,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '承認依頼テンプレートが作成されました',
                'data' => $template->load(['creator', 'requestType'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼テンプレートの作成に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼テンプレートの詳細を取得
     */
    public function show(string $id): JsonResponse
    {
        try {
            $template = ApprovalRequestTemplate::with(['creator', 'updater', 'requestType'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $template
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼テンプレートの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼テンプレートを更新
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'request_type' => 'required|string|max:50',
                'template_data' => 'required|array',
                'is_active' => 'boolean',
                'is_system' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template = ApprovalRequestTemplate::findOrFail($id);
            $template->update([
                ...$request->only([
                    'name', 'description', 'request_type', 'template_data',
                    'is_active', 'is_system'
                ]),
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '承認依頼テンプレートが更新されました',
                'data' => $template->load(['creator', 'updater', 'requestType'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼テンプレートの更新に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 承認依頼テンプレートを削除
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $template = ApprovalRequestTemplate::findOrFail($id);
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => '承認依頼テンプレートが削除されました'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '承認依頼テンプレートの削除に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
