<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * 役割一覧を取得
     */
    public function index(): JsonResponse
    {
        $roles = Role::where('is_active', true)
            ->orderBy('priority', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * 役割を作成
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
                        'granted_by' => auth()->id() ?? 2, // デフォルトでシステム管理者
                    ];
                }
                $role->permissions()->attach($permissionData);
            }

            // 作成された役割を取得
            $role->load(['permissions']);

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

            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100|unique:roles,name,' . $id,
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
                // 既存の権限を削除
                $role->permissions()->detach();
                
                // 新しい権限を割り当て
                if (!empty($request->permission_ids)) {
                    $permissionData = [];
                    foreach ($request->permission_ids as $permissionId) {
                        $permissionData[$permissionId] = [
                            'granted_at' => now(),
                            'granted_by' => auth()->id() ?? 2, // デフォルトでシステム管理者
                        ];
                    }
                    $role->permissions()->attach($permissionData);
                }
            }

            // 更新された役割を取得
            $role->load(['permissions']);

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
     * 役割を削除
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

            // 使用中の役割は削除できない
            $userCount = $role->users()->count();
            if ($userCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "この役割は{$userCount}人のユーザーに割り当てられているため削除できません",
                ], 400);
            }

            // 権限の関連を削除
            $role->permissions()->detach();
            
            // 役割を削除
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
     * 特定の役割を取得
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatRoleData($role->load(['permissions']))
        ]);
    }

    /**
     * ユーザーの役割一覧を取得
     */
    public function getUserRoles(User $user): JsonResponse
    {
        $roles = $user->roles()
            ->where('roles.is_active', true)
            ->where('user_roles.is_active', true)
            ->orderBy('roles.priority', 'desc')
            ->orderBy('roles.name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * ユーザーの役割を更新
     */
    public function updateUserRoles(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'integer|exists:roles,id'
        ]);

        try {
            DB::beginTransaction();

            // 既存の役割を削除
            $user->roles()->detach();

            // 新しい役割を割り当て
            if (!empty($request->role_ids)) {
                $roleData = [];
                foreach ($request->role_ids as $roleId) {
                    $roleData[$roleId] = [
                        'assigned_at' => now(),
                        'assigned_by' => auth()->id() ?? 1,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }
                $user->roles()->attach($roleData);
            }

            DB::commit();

            // 更新後の役割を取得
            $updatedRoles = $user->roles()
                ->where('roles.is_active', true)
                ->where('user_roles.is_active', true)
                ->orderBy('roles.priority', 'desc')
                ->orderBy('roles.name')
                ->get();

            return response()->json([
                'success' => true,
                'message' => '役割が正常に更新されました',
                'data' => $updatedRoles
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => '役割の更新に失敗しました: ' . $e->getMessage()
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
            $role->load(['permissions']);

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
            $role->load(['permissions']);

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
                            'system_level' => $user->system_level_id,
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
            $permissions = \App\Models\Permission::active()->orderBy('module')->orderBy('action')->get();

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