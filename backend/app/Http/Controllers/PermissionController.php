<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\SystemLevel;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PermissionController extends Controller
{
    /**
     * 権限一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Permission::query();

            // 検索条件
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('display_name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // モジュールでフィルタ
            if ($request->filled('module')) {
                $query->where('module', $request->module);
            }

            // アクションでフィルタ
            if ($request->filled('action')) {
                $query->where('action', $request->action);
            }

            // リソースでフィルタ
            if ($request->filled('resource')) {
                $query->where('resource', $request->resource);
            }

            // アクティブ状態でフィルタ
            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // システム権限でフィルタ
            if ($request->filled('is_system')) {
                $query->where('is_system', $request->boolean('is_system'));
            }

            // ソート
            $sortBy = $request->get('sort_by', 'module');
            $sortDirection = $request->get('sort_direction', 'asc');
            $query->orderBy($sortBy, $sortDirection)->orderBy('action', 'asc');

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $permissions = $query->paginate($perPage);

            // レスポンスデータを整形
            $permissions->getCollection()->transform(function ($permission) {
                return $this->formatPermissionData($permission);
            });

            return response()->json([
                'success' => true,
                'data' => $permissions,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定の権限を取得
     */
    public function show(int $id): JsonResponse
    {
        try {
            $permission = Permission::with(['roles', 'systemLevels', 'departments'])
                ->find($id);

            if (!$permission) {
                return response()->json([
                    'success' => false,
                    'message' => '権限が見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatPermissionData($permission),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限情報の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 新しい権限を作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100|unique:permissions,name',
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'module' => 'required|string|max:100',
                'action' => 'required|string|max:100',
                'resource' => 'nullable|string|max:100',
                'is_system' => 'boolean',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 権限名の形式をチェック
            $expectedName = $request->module . '.' . $request->action;
            if ($request->resource) {
                $expectedName .= '.' . $request->resource;
            }

            if ($request->name !== $expectedName) {
                return response()->json([
                    'success' => false,
                    'message' => '権限名は {module}.{action}.{resource} の形式である必要があります',
                    'errors' => [
                        'name' => ['権限名の形式が正しくありません'],
                    ],
                ], 422);
            }

            // 権限を作成
            $permission = Permission::create($request->all());

            // 作成された権限を取得
            $permission->load(['roles', 'systemLevels', 'departments']);

            return response()->json([
                'success' => true,
                'message' => '権限が正常に作成されました',
                'data' => $this->formatPermissionData($permission),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限の作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 権限を更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $permission = Permission::find($id);

            if (!$permission) {
                return response()->json([
                    'success' => false,
                    'message' => '権限が見つかりません',
                ], 404);
            }

            // システム権限は編集不可
            if ($permission->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限は編集できません',
                ], 403);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => [
                    'required',
                    'string',
                    'max:100',
                    Rule::unique('permissions', 'name')->ignore($id),
                ],
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'module' => 'required|string|max:100',
                'action' => 'required|string|max:100',
                'resource' => 'nullable|string|max:100',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 権限名の形式をチェック
            $expectedName = $request->module . '.' . $request->action;
            if ($request->resource) {
                $expectedName .= '.' . $request->resource;
            }

            if ($request->name !== $expectedName) {
                return response()->json([
                    'success' => false,
                    'message' => '権限名は {module}.{action}.{resource} の形式である必要があります',
                    'errors' => [
                        'name' => ['権限名の形式が正しくありません'],
                    ],
                ], 422);
            }

            // 権限を更新
            $permission->update($request->all());

            // 更新された権限を取得
            $permission->load(['roles', 'systemLevels', 'departments']);

            return response()->json([
                'success' => true,
                'message' => '権限が正常に更新されました',
                'data' => $this->formatPermissionData($permission),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限の更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 権限を削除（ソフトデリート）
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $permission = Permission::find($id);

            if (!$permission) {
                return response()->json([
                    'success' => false,
                    'message' => '権限が見つかりません',
                ], 404);
            }

            // システム権限は削除不可
            if ($permission->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限は削除できません',
                ], 403);
            }

            // 権限が使用されているかチェック
            $usageCount = $permission->roles()->count() + 
                         $permission->systemLevels()->count() + 
                         $permission->departments()->count();

            if ($usageCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'この権限は使用されているため削除できません',
                    'data' => [
                        'usage_count' => $usageCount,
                    ],
                ], 400);
            }

            $permission->delete();

            return response()->json([
                'success' => true,
                'message' => '権限が正常に削除されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限の削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 権限の一括作成
     */
    public function bulkCreate(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'permissions' => 'required|array|min:1',
                'permissions.*.module' => 'required|string|max:100',
                'permissions.*.action' => 'required|string|max:100',
                'permissions.*.resource' => 'nullable|string|max:100',
                'permissions.*.display_name' => 'required|string|max:255',
                'permissions.*.description' => 'nullable|string',
                'permissions.*.is_system' => 'boolean',
                'permissions.*.is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $createdPermissions = [];
            $errors = [];

            foreach ($request->permissions as $index => $permissionData) {
                try {
                    // 権限名を生成
                    $name = $permissionData['module'] . '.' . $permissionData['action'];
                    if (!empty($permissionData['resource'])) {
                        $name .= '.' . $permissionData['resource'];
                    }

                    // 既存の権限をチェック
                    if (Permission::where('name', $name)->exists()) {
                        $errors[] = [
                            'index' => $index,
                            'message' => "権限 '{$name}' は既に存在します",
                        ];
                        continue;
                    }

                    // 権限を作成
                    $permission = Permission::create([
                        'name' => $name,
                        'display_name' => $permissionData['display_name'],
                        'description' => $permissionData['description'] ?? null,
                        'module' => $permissionData['module'],
                        'action' => $permissionData['action'],
                        'resource' => $permissionData['resource'] ?? null,
                        'is_system' => $permissionData['is_system'] ?? false,
                        'is_active' => $permissionData['is_active'] ?? true,
                    ]);

                    $createdPermissions[] = $this->formatPermissionData($permission);

                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'message' => $e->getMessage(),
                    ];
                }
            }

            $response = [
                'success' => true,
                'message' => count($createdPermissions) . '個の権限が作成されました',
                'data' => [
                    'created_permissions' => $createdPermissions,
                    'created_count' => count($createdPermissions),
                    'total_count' => count($request->permissions),
                ],
            ];

            if (!empty($errors)) {
                $response['errors'] = $errors;
                $response['message'] .= '（一部の権限でエラーが発生しました）';
            }

            return response()->json($response, 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限の一括作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 権限の使用状況を取得
     */
    public function usage(int $id): JsonResponse
    {
        try {
            $permission = Permission::find($id);

            if (!$permission) {
                return response()->json([
                    'success' => false,
                    'message' => '権限が見つかりません',
                ], 404);
            }

            $usage = [
                'roles' => $permission->roles()->with('users')->get()->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'display_name' => $role->display_name,
                        'user_count' => $role->users()->count(),
                    ];
                }),
                'system_levels' => $permission->systemLevels()->with('users')->get()->map(function ($systemLevel) {
                    return [
                        'id' => $systemLevel->id,
                        'code' => $systemLevel->code,
                        'name' => $systemLevel->name,
                        'display_name' => $systemLevel->display_name,
                        'user_count' => $systemLevel->users()->count(),
                    ];
                }),
                'departments' => $permission->departments()->with('users')->get()->map(function ($department) {
                    return [
                        'id' => $department->id,
                        'name' => $department->name,
                        'code' => $department->code,
                        'user_count' => $department->users()->count(),
                    ];
                }),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'permission' => $this->formatPermissionData($permission),
                    'usage' => $usage,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限の使用状況取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * モジュール一覧を取得
     */
    public function modules(): JsonResponse
    {
        try {
            $modules = Permission::select('module')
                ->distinct()
                ->where('is_active', true)
                ->orderBy('module')
                ->pluck('module');

            return response()->json([
                'success' => true,
                'data' => $modules,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'モジュール一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * アクション一覧を取得
     */
    public function actions(Request $request): JsonResponse
    {
        try {
            $query = Permission::select('action')->distinct()->where('is_active', true);

            if ($request->filled('module')) {
                $query->where('module', $request->module);
            }

            $actions = $query->orderBy('action')->pluck('action');

            return response()->json([
                'success' => true,
                'data' => $actions,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'アクション一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * リソース一覧を取得
     */
    public function resources(Request $request): JsonResponse
    {
        try {
            $query = Permission::select('resource')->distinct()->whereNotNull('resource')->where('is_active', true);

            if ($request->filled('module')) {
                $query->where('module', $request->module);
            }

            if ($request->filled('action')) {
                $query->where('action', $request->action);
            }

            $resources = $query->orderBy('resource')->pluck('resource');

            return response()->json([
                'success' => true,
                'data' => $resources,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'リソース一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 権限データを整形
     */
    private function formatPermissionData(Permission $permission): array
    {
        return [
            'id' => $permission->id,
            'name' => $permission->name,
            'display_name' => $permission->display_name,
            'description' => $permission->description,
            'module' => $permission->module,
            'action' => $permission->action,
            'resource' => $permission->resource,
            'is_system' => $permission->is_system,
            'is_active' => $permission->is_active,
            'parsed_name' => $permission->parsePermissionName(),
            'roles_count' => $permission->roles()->count(),
            'system_levels_count' => $permission->systemLevels()->count(),
            'departments_count' => $permission->departments()->count(),
            'created_at' => $permission->created_at,
            'updated_at' => $permission->updated_at,
        ];
    }
}
