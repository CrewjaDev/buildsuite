<?php

namespace App\Http\Controllers;

use App\Models\PolicyTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PolicyTemplateController extends Controller
{
    /**
     * ポリシーテンプレート一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PolicyTemplate::query();

            // 検索条件
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('template_code', 'like', "%{$search}%");
                });
            }

            // カテゴリでフィルタ
            if ($request->filled('category')) {
                $query->where('category', $request->category);
            }

            // アクションでフィルタ
            if ($request->filled('action')) {
                $query->whereJsonContains('applicable_actions', $request->action);
            }

            // システムテンプレートでフィルタ
            if ($request->filled('is_system')) {
                $query->where('is_system', $request->is_system);
            }

            // アクティブ状態でフィルタ
            if ($request->filled('is_active')) {
                $query->where('is_active', $request->is_active);
            }

            $templates = $query->orderBy('category')
                              ->orderBy('priority', 'desc')
                              ->orderBy('name')
                              ->paginate($request->input('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $templates,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレート一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定のポリシーテンプレートを取得
     */
    public function show(int $id): JsonResponse
    {
        try {
            $template = PolicyTemplate::find($id);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'テンプレートが見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $template,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレートの取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 新しいポリシーテンプレートを作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'template_code' => 'required|string|max:100|unique:policy_templates,template_code',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'required|string|max:100',
                'condition_type' => 'required|string|max:100',
                'condition_rule' => 'required|array',
                'parameters' => 'nullable|array',
                'applicable_actions' => 'required|array',
                'applicable_actions.*' => 'string',
                'tags' => 'nullable|array',
                'tags.*' => 'string',
                'is_system' => 'boolean',
                'is_active' => 'boolean',
                'priority' => 'integer|min:0|max:1000',
                'metadata' => 'nullable|array',
            ]);

            $template = PolicyTemplate::create($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'ポリシーテンプレートが正常に作成されました',
                'data' => $template,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレートの作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ポリシーテンプレートを更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $template = PolicyTemplate::find($id);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'テンプレートが見つかりません',
                ], 404);
            }

            $validatedData = $request->validate([
                'template_code' => 'required|string|max:100|unique:policy_templates,template_code,' . $id,
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'required|string|max:100',
                'condition_type' => 'required|string|max:100',
                'condition_rule' => 'required|array',
                'parameters' => 'nullable|array',
                'applicable_actions' => 'required|array',
                'applicable_actions.*' => 'string',
                'tags' => 'nullable|array',
                'tags.*' => 'string',
                'is_system' => 'boolean',
                'is_active' => 'boolean',
                'priority' => 'integer|min:0|max:1000',
                'metadata' => 'nullable|array',
            ]);

            $template->update($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'ポリシーテンプレートが正常に更新されました',
                'data' => $template,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレートの更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ポリシーテンプレートを削除
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $template = PolicyTemplate::find($id);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'テンプレートが見つかりません',
                ], 404);
            }

            // システムテンプレートは削除不可
            if ($template->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システムテンプレートは削除できません',
                ], 400);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'ポリシーテンプレートが正常に削除されました',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'テンプレートの削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * テンプレートのカテゴリ一覧を取得
     */
    public function getCategories(): JsonResponse
    {
        try {
            $categories = PolicyTemplate::select('category')
                                       ->distinct()
                                       ->orderBy('category')
                                       ->pluck('category');

            return response()->json([
                'success' => true,
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'カテゴリ一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * アクション別テンプレート一覧を取得
     */
    public function getByAction(string $action): JsonResponse
    {
        try {
            $templates = PolicyTemplate::whereJsonContains('applicable_actions', $action)
                                      ->where('is_active', true)
                                      ->orderBy('category')
                                      ->orderBy('priority', 'desc')
                                      ->orderBy('name')
                                      ->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'アクション別テンプレートの取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * テンプレートから条件式を生成
     */
    public function generateCondition(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'template_id' => 'required|exists:policy_templates,id',
                'parameters' => 'nullable|array',
            ]);

            $template = PolicyTemplate::find($validatedData['template_id']);
            $parameters = $validatedData['parameters'] ?? [];

            $condition = $template->generateCondition($parameters);

            return response()->json([
                'success' => true,
                'data' => [
                    'condition' => $condition,
                    'template' => $template,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '条件式の生成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 複数テンプレートから条件式を組み合わせて生成
     */
    public function generateCombinedCondition(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'template_ids' => 'required|array',
                'template_ids.*' => 'exists:policy_templates,id',
                'parameters' => 'nullable|array',
                'operator' => 'required|in:and,or',
            ]);

            $templates = PolicyTemplate::whereIn('id', $validatedData['template_ids'])->get();
            $allParameters = $validatedData['parameters'] ?? [];
            $operator = $validatedData['operator'];

            $rules = [];
            foreach ($templates as $template) {
                // テンプレートID付きのパラメータを抽出
                $templateParameters = [];
                $templatePrefix = $template->id . '_';
                
                foreach ($allParameters as $key => $value) {
                    if (str_starts_with($key, $templatePrefix)) {
                        $paramKey = substr($key, strlen($templatePrefix));
                        $templateParameters[$paramKey] = $value;
                        error_log("Controller: Template {$template->id} parameter {$paramKey} = " . json_encode($value) . " (type: " . gettype($value) . ")");
                    }
                }
                
                $condition = $template->generateCondition($templateParameters);
                $rules[] = $condition;
            }

            $combinedCondition = [
                'operator' => $operator,
                'rules' => $rules,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'condition' => $combinedCondition,
                    'templates' => $templates,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '組み合わせ条件式の生成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
