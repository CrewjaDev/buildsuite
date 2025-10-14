<?php

namespace App\Http\Controllers;

use App\Models\SystemLevel;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SystemLevelController extends Controller
{
    /**
     * システム権限レベル一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = SystemLevel::with(['permissions', 'users']);

            // 検索条件
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('display_name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // アクティブ状態でフィルタ
            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // システム権限レベルでフィルタ
            if ($request->filled('is_system')) {
                $query->where('is_system', $request->boolean('is_system'));
            }

            // 優先度でフィルタ
            if ($request->filled('priority')) {
                $query->where('priority', $request->priority);
            }

            // ソート
            $sortBy = $request->get('sort_by', 'priority');
            $sortDirection = $request->get('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $systemLevels = $query->paginate($perPage);

            // レスポンスデータを整形
            $systemLevels->getCollection()->transform(function ($systemLevel) {
                return $this->formatSystemLevelData($systemLevel);
            });

            return response()->json([
                'success' => true,
                'data' => $systemLevels,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限レベル一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定のシステム権限レベルを取得
     */
    public function show(int $id): JsonResponse
    {
        try {
            $systemLevel = SystemLevel::with(['permissions', 'users'])->find($id);

            if (!$systemLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルが見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatSystemLevelData($systemLevel),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限レベル情報の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 新しいシステム権限レベルを作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'priority' => 'required|integer|min:0|max:100',
                'is_system' => 'boolean',
                'is_active' => 'boolean',
                'permission_ids' => 'nullable|array',
                'permission_ids.*' => 'exists:permissions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // システム権限レベルを作成
            $systemLevelData = $request->except(['permission_ids']);
            $systemLevel = SystemLevel::create($systemLevelData);

            // 権限を割り当て
            if ($request->filled('permission_ids')) {
                $permissionData = [];
                foreach ($request->permission_ids as $permissionId) {
                    $permissionData[$permissionId] = [
                        'granted_at' => now(),
                        'granted_by' => auth()->id(),
                    ];
                }
                $systemLevel->permissions()->attach($permissionData);
            }

            // 作成されたシステム権限レベルを取得
            $systemLevel->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => 'システム権限レベルが正常に作成されました',
                'data' => $this->formatSystemLevelData($systemLevel),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限レベルの作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * システム権限レベルを更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $systemLevel = SystemLevel::find($id);

            if (!$systemLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルが見つかりません',
                ], 404);
            }

            // システム権限レベルは編集不可
            if ($systemLevel->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルは編集できません',
                ], 403);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'priority' => 'required|integer|min:0|max:100',
                'is_active' => 'boolean',
                'permission_ids' => 'nullable|array',
                'permission_ids.*' => 'exists:permissions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // システム権限レベルを更新
            $systemLevelData = $request->except(['permission_ids']);
            $systemLevel->update($systemLevelData);

            // 権限を更新
            if ($request->has('permission_ids')) {
                $systemLevel->permissions()->detach();
                if (!empty($request->permission_ids)) {
                    $permissionData = [];
                    foreach ($request->permission_ids as $permissionId) {
                        $permissionData[$permissionId] = [
                            'granted_at' => now(),
                            'granted_by' => auth()->id(),
                        ];
                    }
                    $systemLevel->permissions()->attach($permissionData);
                }
            }

            // 更新されたシステム権限レベルを取得
            $systemLevel->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => 'システム権限レベルが正常に更新されました',
                'data' => $this->formatSystemLevelData($systemLevel),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限レベルの更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * システム権限レベルを削除（ソフトデリート）
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $systemLevel = SystemLevel::find($id);

            if (!$systemLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルが見つかりません',
                ], 404);
            }

            // システム権限レベルは削除不可
            if ($systemLevel->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルは削除できません',
                ], 403);
            }

            // システム権限レベルが使用されているかチェック
            $userCount = $systemLevel->users()->count();

            if ($userCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'このシステム権限レベルは使用されているため削除できません',
                    'data' => [
                        'user_count' => $userCount,
                    ],
                ], 400);
            }

            $systemLevel->delete();

            return response()->json([
                'success' => true,
                'message' => 'システム権限レベルが正常に削除されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限レベルの削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }


    /**
     * システム権限レベルの使用状況を取得
     */
    public function usage(int $id): JsonResponse
    {
        try {
            $systemLevel = SystemLevel::find($id);

            if (!$systemLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルが見つかりません',
                ], 404);
            }

            $users = $systemLevel->users()->with(['roles', 'departments'])->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'system_level' => $this->formatSystemLevelData($systemLevel),
                    'users' => $users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'employee_id' => $user->employee_id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'is_active' => $user->is_active,
                            'is_admin' => $user->is_admin,
                            'last_login_at' => $user->last_login_at,
                        ];
                    }),
                    'user_count' => $users->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限レベルの使用状況取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * システム権限レベルの優先度を一括更新
     */
    public function updatePriorities(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'priorities' => 'required|array|min:1',
                'priorities.*.id' => 'required|exists:system_levels,id',
                'priorities.*.priority' => 'required|integer|min:0|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updatedCount = 0;

            foreach ($request->priorities as $item) {
                $systemLevel = SystemLevel::find($item['id']);
                
                // システム権限レベルは編集不可
                if ($systemLevel && !$systemLevel->is_system) {
                    $systemLevel->update(['priority' => $item['priority']]);
                    $updatedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => $updatedCount . '個のシステム権限レベルの優先度が更新されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '優先度の更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * システム権限レベル作成・編集用の選択肢データを取得
     */
    public function getOptions(): JsonResponse
    {
        try {
            $permissions = Permission::active()->orderBy('module')->orderBy('action')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'permissions' => $permissions,
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
     * システム権限レベルデータを整形
     */
    private function formatSystemLevelData(SystemLevel $systemLevel): array
    {
        return [
            'id' => $systemLevel->id,
            'code' => $systemLevel->code,
            'name' => $systemLevel->name,
            'display_name' => $systemLevel->display_name,
            'description' => $systemLevel->description,
            'priority' => $systemLevel->priority,
            'is_system' => $systemLevel->is_system,
            'is_active' => $systemLevel->is_active,
            'permissions' => $systemLevel->permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'module' => $permission->module,
                    'action' => $permission->action,
                    'resource' => $permission->resource,
                    'granted_at' => $permission->pivot->granted_at,
                ];
            }),
            'users_count' => $systemLevel->users()->count(),
            'permissions_count' => $systemLevel->permissions()->count(),
            'created_at' => $systemLevel->created_at,
            'updated_at' => $systemLevel->updated_at,
        ];
    }
}
