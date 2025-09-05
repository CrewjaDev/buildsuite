<?php

namespace App\Http\Controllers;

use App\Models\ProjectType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ProjectTypeController extends Controller
{
    /**
     * プロジェクトタイプ一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProjectType::query();

        // 検索条件
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('type_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // アクティブ状態フィルタ
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // ソート
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // ページネーション
        $perPage = $request->get('pageSize', 10);
        $page = $request->get('page', 1);
        $projectTypes = $query->paginate($perPage, ['*'], 'page', $page);

        // レスポンスデータを整形
        $projectTypes->getCollection()->transform(function ($projectType) {
            return [
                'id' => $projectType->id,
                'name' => $projectType->type_name,
                'description' => $projectType->description,
                'overhead_rate' => $projectType->overhead_rate,
                'cost_expense_rate' => $projectType->cost_expense_rate,
                'material_expense_rate' => $projectType->material_expense_rate,
                'is_active' => $projectType->is_active,
                'created_at' => $projectType->created_at->toISOString(),
                'updated_at' => $projectType->updated_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'project_types' => $projectTypes->items(),
                'totalCount' => $projectTypes->total(),
            ],
        ]);
    }

    /**
     * 特定のプロジェクトタイプを取得
     */
    public function show(int $id): JsonResponse
    {
        $projectType = ProjectType::find($id);

        if (!$projectType) {
            return response()->json([
                'success' => false,
                'message' => 'プロジェクトタイプが見つかりません',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatProjectTypeData($projectType),
        ]);
    }

    /**
     * 新しいプロジェクトタイプを作成
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'overhead_rate' => 'nullable|numeric|min:0|max:100',
            'cost_expense_rate' => 'nullable|numeric|min:0|max:100',
            'material_expense_rate' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $projectTypeData = $validator->validated();
        $projectTypeData['is_active'] = $projectTypeData['is_active'] ?? true;

        $projectType = ProjectType::create($projectTypeData);

        return response()->json([
            'success' => true,
            'message' => 'プロジェクトタイプが正常に作成されました',
            'data' => $this->formatProjectTypeData($projectType),
        ], 201);
    }

    /**
     * プロジェクトタイプ情報を更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $projectType = ProjectType::find($id);

        if (!$projectType) {
            return response()->json([
                'success' => false,
                'message' => 'プロジェクトタイプが見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'type_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'overhead_rate' => 'nullable|numeric|min:0|max:100',
            'cost_expense_rate' => 'nullable|numeric|min:0|max:100',
            'material_expense_rate' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $projectTypeData = $validator->validated();
        $projectType->update($projectTypeData);

        return response()->json([
            'success' => true,
            'message' => 'プロジェクトタイプが正常に更新されました',
            'data' => $this->formatProjectTypeData($projectType),
        ]);
    }

    /**
     * プロジェクトタイプを削除
     */
    public function destroy(int $id): JsonResponse
    {
        $projectType = ProjectType::find($id);

        if (!$projectType) {
            return response()->json([
                'success' => false,
                'message' => 'プロジェクトタイプが見つかりません',
            ], 404);
        }

        $projectType->delete();

        return response()->json([
            'success' => true,
            'message' => 'プロジェクトタイプが正常に削除されました',
        ]);
    }

    /**
     * プロジェクトタイプオプション取得（ドロップダウン用）
     */
    public function getOptions(): JsonResponse
    {
        $projectTypes = ProjectType::where('is_active', true)
            ->orderBy('type_name')
            ->get(['id', 'type_name']);

        $options = $projectTypes->map(function ($projectType) {
            return [
                'id' => $projectType->id,
                'name' => $projectType->type_name,
            ];
        });

        return response()->json($options);
    }

    /**
     * プロジェクトタイプデータをフォーマット
     */
    private function formatProjectTypeData(ProjectType $projectType): array
    {
        return [
            'id' => $projectType->id,
            'name' => $projectType->type_name,
            'description' => $projectType->description,
            'overhead_rate' => $projectType->overhead_rate,
            'cost_expense_rate' => $projectType->cost_expense_rate,
            'material_expense_rate' => $projectType->material_expense_rate,
            'is_active' => $projectType->is_active,
            'created_at' => $projectType->created_at,
            'updated_at' => $projectType->updated_at,
        ];
    }
}
