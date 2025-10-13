<?php

namespace App\Http\Controllers;

use App\Models\Position;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PositionController extends Controller
{
    /**
     * 職位一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Position::with(['permissions', 'users']);

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

            // レベルでフィルタ
            if ($request->filled('level')) {
                $query->where('level', $request->level);
            }

            // ソート
            $sortBy = $request->get('sort_by', 'level');
            $sortDirection = $request->get('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $positions = $query->paginate($perPage);

            // レスポンスデータを整形
            $positions->getCollection()->transform(function ($position) {
                return $this->formatPositionData($position);
            });

            return response()->json([
                'success' => true,
                'data' => $positions,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '職位一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定の職位を取得
     */
    public function show(int $id): JsonResponse
    {
        try {
            $position = Position::with(['permissions', 'users'])->find($id);

            if (!$position) {
                return response()->json([
                    'success' => false,
                    'message' => '職位が見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatPositionData($position),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '職位情報の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 新しい職位を作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'code' => 'required|string|max:50|unique:positions,code',
                'name' => 'required|string|max:100',
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'level' => 'required|integer|min:0|max:100',
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

            // 職位を作成
            $positionData = $request->except(['permission_ids']);
            $position = Position::create($positionData);

            // 権限を割り当て
            if ($request->filled('permission_ids')) {
                $permissionData = [];
                foreach ($request->permission_ids as $permissionId) {
                    $permissionData[$permissionId] = [
                        'granted_at' => now(),
                        'granted_by' => auth()->id() ?? 2,
                    ];
                }
                $position->permissions()->attach($permissionData);
            }

            // 作成された職位を取得
            $position->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => '職位が正常に作成されました',
                'data' => $this->formatPositionData($position),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '職位の作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 職位を更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $position = Position::find($id);

            if (!$position) {
                return response()->json([
                    'success' => false,
                    'message' => '職位が見つかりません',
                ], 404);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'code' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('positions', 'code')->ignore($id),
                ],
                'name' => 'required|string|max:100',
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'level' => 'required|integer|min:0|max:100',
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

            // 職位を更新
            $positionData = $request->except(['permission_ids']);
            $position->update($positionData);

            // 権限を更新
            if ($request->has('permission_ids')) {
                $position->permissions()->detach();
                if (!empty($request->permission_ids)) {
                    $permissionData = [];
                    foreach ($request->permission_ids as $permissionId) {
                        $permissionData[$permissionId] = [
                            'granted_at' => now(),
                            'granted_by' => auth()->id() ?? 2,
                        ];
                    }
                    $position->permissions()->attach($permissionData);
                }
            }

            // 更新された職位を取得
            $position->load(['permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => '職位が正常に更新されました',
                'data' => $this->formatPositionData($position),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '職位の更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 職位を削除（ソフトデリート）
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $position = Position::find($id);

            if (!$position) {
                return response()->json([
                    'success' => false,
                    'message' => '職位が見つかりません',
                ], 404);
            }

            // 職位が使用されているかチェック
            $userCount = $position->users()->count();

            if ($userCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'この職位は使用されているため削除できません',
                    'data' => [
                        'user_count' => $userCount,
                    ],
                ], 400);
            }

            $position->delete();

            return response()->json([
                'success' => true,
                'message' => '職位が正常に削除されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '職位の削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 職位に権限を追加
     */
    public function addPermissions(Request $request, int $id): JsonResponse
    {
        try {
            $position = Position::find($id);

            if (!$position) {
                return response()->json([
                    'success' => false,
                    'message' => '職位が見つかりません',
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
            $existingPermissionIds = $position->permissions()->pluck('permissions.id')->toArray();
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
            $position->permissions()->attach($permissionData);

            // 更新された職位を取得
            $position->load(['permissions']);

            return response()->json([
                'success' => true,
                'message' => count($newPermissionIds) . '個の権限が追加されました',
                'data' => $this->formatPositionData($position),
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
     * 職位から権限を削除
     */
    public function removePermissions(Request $request, int $id): JsonResponse
    {
        try {
            $position = Position::find($id);

            if (!$position) {
                return response()->json([
                    'success' => false,
                    'message' => '職位が見つかりません',
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
            $existingPermissionIds = $position->permissions()->pluck('permissions.id')->toArray();
            $removablePermissionIds = array_intersect($request->permission_ids, $existingPermissionIds);

            if (empty($removablePermissionIds)) {
                return response()->json([
                    'success' => false,
                    'message' => '指定された権限は割り当てられていません',
                ], 400);
            }

            // 権限を削除
            $position->permissions()->detach($removablePermissionIds);

            // 更新された職位を取得
            $position->load(['permissions']);

            return response()->json([
                'success' => true,
                'message' => count($removablePermissionIds) . '個の権限が削除されました',
                'data' => $this->formatPositionData($position),
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
     * 職位の使用状況を取得
     */
    public function usage(int $id): JsonResponse
    {
        try {
            $position = Position::find($id);

            if (!$position) {
                return response()->json([
                    'success' => false,
                    'message' => '職位が見つかりません',
                ], 404);
            }

            $users = $position->users()->with(['systemLevel', 'departments'])->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'position' => $this->formatPositionData($position),
                    'users' => $users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'employee_id' => $user->employee_id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'system_level' => $user->system_level_id,
                            'is_active' => $user->is_active,
                            'assigned_at' => $user->pivot->assigned_at,
                            'is_active_position' => $user->pivot->is_active,
                        ];
                    }),
                    'user_count' => $users->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '職位の使用状況取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 職位作成・編集用の選択肢データを取得
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
     * 職位データを整形
     */
    private function formatPositionData(Position $position): array
    {
        return [
            'id' => $position->id,
            'code' => $position->code,
            'name' => $position->name,
            'display_name' => $position->display_name,
            'description' => $position->description,
            'level' => $position->level,
            'is_active' => $position->is_active,
            'permissions' => $position->permissions->map(function ($permission) {
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
            'users_count' => $position->users()->count(),
            'permissions_count' => $position->permissions()->count(),
            'created_at' => $position->created_at,
            'updated_at' => $position->updated_at,
        ];
    }
}
