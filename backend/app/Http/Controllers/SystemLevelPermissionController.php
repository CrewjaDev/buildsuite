<?php

namespace App\Http\Controllers;

use App\Models\SystemLevel;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SystemLevelPermissionController extends Controller
{
    /**
     * システム権限レベルの権限一覧を取得
     */
    public function index(int $id): JsonResponse
    {
        try {
            $systemLevel = SystemLevel::with(['permissions'])->find($id);

            if (!$systemLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルが見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'system_level' => [
                        'id' => $systemLevel->id,
                        'name' => $systemLevel->name,
                        'display_name' => $systemLevel->display_name,
                    ],
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
                ],
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
     * システム権限レベルに権限を追加
     */
    public function store(Request $request, int $id): JsonResponse
    {
        try {
            $systemLevel = SystemLevel::find($id);

            if (!$systemLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルが見つかりません',
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
            $existingPermissionIds = $systemLevel->permissions()->pluck('permissions.id')->toArray();
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
            $systemLevel->permissions()->attach($permissionData);

            // 更新された権限一覧を取得
            $systemLevel->load(['permissions']);

            return response()->json([
                'success' => true,
                'message' => count($newPermissionIds) . '個の権限が追加されました',
                'data' => [
                    'system_level' => [
                        'id' => $systemLevel->id,
                        'name' => $systemLevel->name,
                        'display_name' => $systemLevel->display_name,
                    ],
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
                ],
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
     * システム権限レベルから権限を削除
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $systemLevel = SystemLevel::find($id);

            if (!$systemLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルが見つかりません',
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
            $existingPermissionIds = $systemLevel->permissions()->pluck('permissions.id')->toArray();
            $removablePermissionIds = array_intersect($request->permission_ids, $existingPermissionIds);

            if (empty($removablePermissionIds)) {
                return response()->json([
                    'success' => false,
                    'message' => '指定された権限は割り当てられていません',
                ], 400);
            }

            // 権限を削除
            $systemLevel->permissions()->detach($removablePermissionIds);

            // 更新された権限一覧を取得
            $systemLevel->load(['permissions']);

            return response()->json([
                'success' => true,
                'message' => count($removablePermissionIds) . '個の権限が削除されました',
                'data' => [
                    'system_level' => [
                        'id' => $systemLevel->id,
                        'name' => $systemLevel->name,
                        'display_name' => $systemLevel->display_name,
                    ],
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
                ],
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
     * システム権限レベルの権限を同期（一括更新）
     */
    public function sync(Request $request, int $id): JsonResponse
    {
        try {
            $systemLevel = SystemLevel::find($id);

            if (!$systemLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'システム権限レベルが見つかりません',
                ], 404);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
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

            $permissionIds = $request->permission_ids ?? [];

            // 既存の権限を取得
            $existingPermissionIds = $systemLevel->permissions()->pluck('permissions.id')->toArray();

            // 追加する権限
            $permissionsToAdd = array_diff($permissionIds, $existingPermissionIds);
            // 削除する権限
            $permissionsToRemove = array_diff($existingPermissionIds, $permissionIds);

            // 権限を同期
            if (!empty($permissionsToAdd)) {
                $permissionData = [];
                foreach ($permissionsToAdd as $permissionId) {
                    $permissionData[$permissionId] = [
                        'granted_at' => now(),
                        'granted_by' => auth()->id(),
                    ];
                }
                $systemLevel->permissions()->attach($permissionData);
            }

            if (!empty($permissionsToRemove)) {
                $systemLevel->permissions()->detach($permissionsToRemove);
            }

            // 更新された権限一覧を取得
            $systemLevel->load(['permissions']);

            return response()->json([
                'success' => true,
                'message' => '権限が正常に同期されました',
                'data' => [
                    'system_level' => [
                        'id' => $systemLevel->id,
                        'name' => $systemLevel->name,
                        'display_name' => $systemLevel->display_name,
                    ],
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
                    'changes' => [
                        'added' => $permissionsToAdd,
                        'removed' => $permissionsToRemove,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限の同期中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
