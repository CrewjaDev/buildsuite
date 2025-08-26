<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * 役割一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Role::with(['permissions', 'users']);

            // 検索条件
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('display_name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // アクティブ状態でフィルタ
            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // システム役割でフィルタ
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
            $roles = $query->paginate($perPage);

            // レスポンスデータを整形
            $roles->getCollection()->transform(function ($role) {
                return $this->formatRoleData($role);
            });

            return response()->json([
                'success' => true,
                'data' => $roles,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '役割一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定の役割を取得
     */
    public function show(int $id): JsonResponse
    {
        try {
            $role = Role::with(['permissions', 'users'])->find($id);

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => '役割が見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatRoleData($role),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '役割情報の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 新しい役割を作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100|unique:roles,name',
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

            // 役割を作成
            $roleData = $request->except(['permission_ids']);
            $role = Role::create($roleData);

            // 権限を割り当て
            if ($request->filled('permission_ids')) {
                $permissionData = [];
                foreach ($request->permission_ids as $permissionId) {
                    $permissionData[$permissionId] = [
                        'granted_at' => now(),
                        'granted_by' => auth()->id(),
                    ];
                }
                $role->permissions()->attach($permissionData);
            }

            // 作成された役割を取得
            $role->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => '役割が正常に作成されました',
                'data' => $this->formatRoleData($role),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '役割の作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 役割を更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => '役割が見つかりません',
                ], 404);
            }

            // システム役割は編集不可
            if ($role->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム役割は編集できません',
                ], 403);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => [
                    'required',
                    'string',
                    'max:100',
                    Rule::unique('roles', 'name')->ignore($id),
                ],
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

            // 役割を更新
            $roleData = $request->except(['permission_ids']);
            $role->update($roleData);

            // 権限を更新
            if ($request->has('permission_ids')) {
                $role->permissions()->detach();
                if (!empty($request->permission_ids)) {
                    $permissionData = [];
                    foreach ($request->permission_ids as $permissionId) {
                        $permissionData[$permissionId] = [
                            'granted_at' => now(),
                            'granted_by' => auth()->id(),
                        ];
                    }
                    $role->permissions()->attach($permissionData);
                }
            }

            // 更新された役割を取得
            $role->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => '役割が正常に更新されました',
                'data' => $this->formatRoleData($role),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '役割の更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 役割を削除（ソフトデリート）
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => '役割が見つかりません',
                ], 404);
            }

            // システム役割は削除不可
            if ($role->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム役割は削除できません',
                ], 403);
            }

            // 役割が使用されているかチェック
            $userCount = $role->users()->count();

            if ($userCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'この役割は使用されているため削除できません',
                    'data' => [
                        'user_count' => $userCount,
                    ],
                ], 400);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => '役割が正常に削除されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '役割の削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 役割に権限を追加
     */
    public function addPermissions(Request $request, int $id): JsonResponse
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => '役割が見つかりません',
                ], 404);
            }

            // システム役割は編集不可
            if ($role->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム役割は編集できません',
                ], 403);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'permission_ids' => 'required|array|min:1',
                'permission_ids.*' => 'exists:permissions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 既存の権限をチェック
            $existingPermissionIds = $role->permissions()->pluck('permissions.id')->toArray();
            $newPermissionIds = array_diff($request->permission_ids, $existingPermissionIds);

            if (empty($newPermissionIds)) {
                return response()->json([
                    'success' => false,
                    'message' => '指定された権限は既に割り当てられています',
                ], 400);
            }

            // 権限を追加
            $permissionData = [];
            foreach ($newPermissionIds as $permissionId) {
                $permissionData[$permissionId] = [
                    'granted_at' => now(),
                    'granted_by' => auth()->id(),
                ];
            }
            $role->permissions()->attach($permissionData);

            // 更新された役割を取得
            $role->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => count($newPermissionIds) . '個の権限が追加されました',
                'data' => $this->formatRoleData($role),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限の追加中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 役割から権限を削除
     */
    public function removePermissions(Request $request, int $id): JsonResponse
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => '役割が見つかりません',
                ], 404);
            }

            // システム役割は編集不可
            if ($role->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム役割は編集できません',
                ], 403);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'permission_ids' => 'required|array|min:1',
                'permission_ids.*' => 'exists:permissions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 既存の権限をチェック
            $existingPermissionIds = $role->permissions()->pluck('permissions.id')->toArray();
            $removablePermissionIds = array_intersect($request->permission_ids, $existingPermissionIds);

            if (empty($removablePermissionIds)) {
                return response()->json([
                    'success' => false,
                    'message' => '指定された権限は割り当てられていません',
                ], 400);
            }

            // 権限を削除
            $role->permissions()->detach($removablePermissionIds);

            // 更新された役割を取得
            $role->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => count($removablePermissionIds) . '個の権限が削除されました',
                'data' => $this->formatRoleData($role),
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
     * 役割の使用状況を取得
     */
    public function usage(int $id): JsonResponse
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => '役割が見つかりません',
                ], 404);
            }

            $users = $role->users()->with(['systemLevel', 'departments'])->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'role' => $this->formatRoleData($role),
                    'users' => $users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'employee_id' => $user->employee_id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'system_level' => $user->system_level,
                            'is_active' => $user->is_active,
                            'assigned_at' => $user->pivot->assigned_at,
                            'is_active_role' => $user->pivot->is_active,
                        ];
                    }),
                    'user_count' => $users->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '役割の使用状況取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 役割作成・編集用の選択肢データを取得
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
     * 役割データを整形
     */
    private function formatRoleData(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'display_name' => $role->display_name,
            'description' => $role->description,
            'priority' => $role->priority,
            'is_system' => $role->is_system,
            'is_active' => $role->is_active,
            'permissions' => $role->permissions->map(function ($permission) {
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
            'users_count' => $role->users()->count(),
            'permissions_count' => $role->permissions()->count(),
            'created_at' => $role->created_at,
            'updated_at' => $role->updated_at,
        ];
    }
}
