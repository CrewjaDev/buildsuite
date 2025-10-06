<?php

namespace App\Http\Controllers;

use App\Models\AccessPolicy;
use App\Models\BusinessCode;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AccessPolicyController extends Controller
{
    /**
     * ABACポリシー一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AccessPolicy::with(['businessCode']);

            // 検索条件
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('business_code', 'like', "%{$search}%");
                });
            }

            // ビジネスコードでフィルタ
            if ($request->filled('business_code')) {
                $query->where('business_code', $request->business_code);
            }

            // アクションでフィルタ
            if ($request->filled('action')) {
                $query->where('action', $request->action);
            }

            // 効果でフィルタ
            if ($request->filled('effect')) {
                $query->where('effect', $request->effect);
            }

            // アクティブ状態でフィルタ
            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // ソート
            $sortBy = $request->get('sort_by', 'priority');
            $sortDirection = $request->get('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $policies = $query->paginate($perPage);

            // レスポンスデータを整形
            $policies->getCollection()->transform(function ($policy) {
                return $this->formatPolicyData($policy);
            });

            return response()->json([
                'success' => true,
                'data' => $policies,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ポリシー一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定のABACポリシーを取得
     */
    public function show(int $id): JsonResponse
    {
        try {
            $policy = AccessPolicy::with(['businessCode'])->find($id);

            if (!$policy) {
                return response()->json([
                    'success' => false,
                    'message' => 'ポリシーが見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatPolicyData($policy),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ポリシー情報の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 新しいABACポリシーを作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'business_code' => 'required|string|exists:business_codes,code',
                'action' => 'required|string|max:100',
                'resource_type' => 'required|string|max:100',
                'conditions' => 'required|array',
                'conditions.operator' => 'required|string|in:and,or',
                'conditions.rules' => 'required|array',
                'scope' => 'nullable|string',
                'effect' => 'required|string|in:allow,deny',
                'priority' => 'required|integer|min:0|max:1000',
                'is_active' => 'boolean',
                'is_system' => 'boolean',
                'metadata' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 条件式の詳細バリデーション
            $conditionsValidation = $this->validateConditions($request->conditions);
            if (!$conditionsValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => '条件式のバリデーションエラー',
                    'errors' => $conditionsValidation['errors'],
                ], 422);
            }

            // ポリシーを作成
            $policyData = $request->except(['metadata']);
            $policyData['metadata'] = $request->metadata ?? [];
            $policy = AccessPolicy::create($policyData);

            // 作成されたポリシーを取得
            $policy->load(['businessCode']);

            return response()->json([
                'success' => true,
                'message' => 'ポリシーが正常に作成されました',
                'data' => $this->formatPolicyData($policy),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ポリシーの作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ABACポリシーを更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $policy = AccessPolicy::find($id);

            if (!$policy) {
                return response()->json([
                    'success' => false,
                    'message' => 'ポリシーが見つかりません',
                ], 404);
            }

            // システムポリシーは更新不可
            if ($policy->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システムポリシーは更新できません',
                ], 403);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'business_code' => 'required|string|exists:business_codes,code',
                'action' => 'required|string|max:100',
                'resource_type' => 'required|string|max:100',
                'conditions' => 'required|array',
                'conditions.operator' => 'required|string|in:and,or',
                'conditions.rules' => 'required|array',
                'scope' => 'nullable|string',
                'effect' => 'required|string|in:allow,deny',
                'priority' => 'required|integer|min:0|max:1000',
                'is_active' => 'boolean',
                'metadata' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 条件式の詳細バリデーション
            $conditionsValidation = $this->validateConditions($request->conditions);
            if (!$conditionsValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => '条件式のバリデーションエラー',
                    'errors' => $conditionsValidation['errors'],
                ], 422);
            }

            // ポリシーを更新
            $policyData = $request->except(['metadata']);
            $policyData['metadata'] = $request->metadata ?? [];
            $policy->update($policyData);

            // 更新されたポリシーを取得
            $policy->load(['businessCode']);

            return response()->json([
                'success' => true,
                'message' => 'ポリシーが正常に更新されました',
                'data' => $this->formatPolicyData($policy),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ポリシーの更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ABACポリシーを削除
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $policy = AccessPolicy::find($id);

            if (!$policy) {
                return response()->json([
                    'success' => false,
                    'message' => 'ポリシーが見つかりません',
                ], 404);
            }

            // システムポリシーは削除不可
            if ($policy->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システムポリシーは削除できません',
                ], 403);
            }

            $policy->delete();

            return response()->json([
                'success' => true,
                'message' => 'ポリシーが正常に削除されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ポリシーの削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ポリシー作成・編集用の選択肢データを取得
     */
    public function getOptions(): JsonResponse
    {
        try {
            $businessCodes = BusinessCode::where('is_active', true)
                ->orderBy('name')
                ->get(['code', 'name', 'description']);

            $actions = [
                'view' => '閲覧',
                'create' => '作成',
                'edit' => '編集',
                'delete' => '削除',
                'approve' => '承認',
                'reject' => '却下',
                'export' => 'エクスポート',
                'import' => 'インポート',
            ];

            $resourceTypes = [
                'estimate' => '見積',
                'budget' => '予算',
                'approval_request' => '承認依頼',
                'user' => 'ユーザー',
                'role' => '役割',
                'department' => '部署',
                'position' => '職位',
            ];

            $operators = [
                'eq' => '等しい',
                'ne' => '等しくない',
                'gt' => 'より大きい',
                'gte' => '以上',
                'lt' => 'より小さい',
                'lte' => '以下',
                'in' => '含む',
                'nin' => '含まない',
                'exists' => '存在する',
                'regex' => '正規表現',
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'business_codes' => $businessCodes,
                    'actions' => $actions,
                    'resource_types' => $resourceTypes,
                    'operators' => $operators,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '選択肢データの取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ポリシーの条件式をテスト
     */
    public function testConditions(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'conditions' => 'required|array',
                'test_context' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // テスト用のポリシーを作成
            $testPolicy = new AccessPolicy();
            $testPolicy->conditions = $request->conditions;

            $result = $testPolicy->evaluateConditions($request->test_context);

            return response()->json([
                'success' => true,
                'data' => [
                    'result' => $result,
                    'context' => $request->test_context,
                    'conditions' => $request->conditions,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '条件式のテスト中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 条件式のバリデーション
     */
    private function validateConditions(array $conditions): array
    {
        $errors = [];

        if (!isset($conditions['operator']) || !in_array($conditions['operator'], ['and', 'or'])) {
            $errors[] = 'operatorは"and"または"or"である必要があります';
        }

        if (!isset($conditions['rules']) || !is_array($conditions['rules'])) {
            $errors[] = 'rulesは配列である必要があります';
        } else {
            foreach ($conditions['rules'] as $index => $rule) {
                if (!is_array($rule)) {
                    $errors[] = "rules[{$index}]は配列である必要があります";
                    continue;
                }

                if (!isset($rule['field'])) {
                    $errors[] = "rules[{$index}].fieldは必須です";
                }

                if (!isset($rule['operator'])) {
                    $errors[] = "rules[{$index}].operatorは必須です";
                } elseif (!in_array($rule['operator'], ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'exists', 'regex'])) {
                    $errors[] = "rules[{$index}].operatorは有効な値である必要があります";
                }

                // ネストした条件式の再帰的バリデーション
                if (isset($rule['operator']) && in_array($rule['operator'], ['and', 'or'])) {
                    $nestedValidation = $this->validateConditions($rule);
                    if (!$nestedValidation['valid']) {
                        $errors = array_merge($errors, $nestedValidation['errors']);
                    }
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * ポリシーデータを整形
     */
    private function formatPolicyData(AccessPolicy $policy): array
    {
        return [
            'id' => $policy->id,
            'name' => $policy->name,
            'description' => $policy->description,
            'business_code' => $policy->business_code,
            'business_code_name' => $policy->businessCode?->name,
            'action' => $policy->action,
            'resource_type' => $policy->resource_type,
            'conditions' => $policy->conditions,
            'scope' => $policy->scope,
            'effect' => $policy->effect,
            'priority' => $policy->priority,
            'is_active' => $policy->is_active,
            'is_system' => $policy->is_system,
            'metadata' => $policy->metadata,
            'created_at' => $policy->created_at,
            'updated_at' => $policy->updated_at,
        ];
    }
}