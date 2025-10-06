<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    /**
     * 部署一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Department::with(['parent', 'manager', 'permissions', 'users']);

            // 検索条件
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
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

            // 親部署でフィルタ
            if ($request->filled('parent_id')) {
                $query->where('parent_id', $request->parent_id);
            }

            // ルート部署のみ
            if ($request->boolean('root_only')) {
                $query->whereNull('parent_id');
            }

            // ソート
            $sortBy = $request->get('sort_by', 'sort_order');
            $sortDirection = $request->get('sort_direction', 'asc');
            $query->orderBy($sortBy, $sortDirection);

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $departments = $query->paginate($perPage);

            // レスポンスデータを整形
            $departments->getCollection()->transform(function ($department) {
                return $this->formatDepartmentData($department);
            });

            return response()->json([
                'success' => true,
                'data' => $departments,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '部署一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 部署階層構造を取得
     */
    public function tree(Request $request): JsonResponse
    {
        try {
            $query = Department::with(['children', 'manager']);

            // アクティブな部署のみ
            if ($request->boolean('active_only', true)) {
                $query->where('is_active', true);
            }

            // ルート部署を取得
            $departments = $query->whereNull('parent_id')
                ->orderBy('sort_order', 'asc')
                ->get();

            // 階層構造を構築
            $tree = $departments->map(function ($department) {
                return $this->buildDepartmentTree($department);
            });

            return response()->json([
                'success' => true,
                'data' => $tree,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '部署階層構造の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定の部署を取得
     */
    public function show(int $id): JsonResponse
    {
        try {
            $department = Department::with([
                'parent', 'children', 'manager', 'permissions', 'users'
            ])->find($id);

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => '部署が見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatDepartmentData($department),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '部署情報の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 新しい部署を作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:departments,code',
                'description' => 'nullable|string',
                'parent_id' => 'nullable|exists:departments,id',
                'sort_order' => 'integer|min:0',
                'manager_id' => 'nullable|exists:users,id',
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

            // レベルとパスを計算
            $level = 0;
            $path = '';
            
            if ($request->filled('parent_id')) {
                $parent = Department::find($request->parent_id);
                $level = $parent->level + 1;
                $path = $parent->path ? $parent->path . '/' . $parent->id : $parent->id;
            }

            // 部署を作成
            $departmentData = $request->except(['permission_ids']);
            $departmentData['level'] = $level;
            $departmentData['path'] = $path;
            
            $department = Department::create($departmentData);

            // 権限を割り当て
            if ($request->filled('permission_ids')) {
                $permissionData = [];
                foreach ($request->permission_ids as $permissionId) {
                    $permissionData[$permissionId] = [
                        'granted_at' => now(),
                        'granted_by' => auth()->id() ?? 2,
                    ];
                }
                $department->permissions()->attach($permissionData);
            }

            // 作成された部署を取得
            $department->load(['parent', 'children', 'manager', 'permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => '部署が正常に作成されました',
                'data' => $this->formatDepartmentData($department),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '部署の作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 部署を更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $department = Department::find($id);

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => '部署が見つかりません',
                ], 404);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'code' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('departments', 'code')->ignore($id),
                ],
                'description' => 'nullable|string',
                'parent_id' => [
                    'nullable',
                    'exists:departments,id',
                    function ($attribute, $value, $fail) use ($id) {
                        if ($value == $id) {
                            $fail('親部署に自分自身を設定することはできません');
                        }
                    },
                ],
                'sort_order' => 'integer|min:0',
                'manager_id' => 'nullable|exists:users,id',
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

            // 親部署の変更をチェック
            $oldParentId = $department->parent_id;
            $newParentId = $request->parent_id;

            if ($oldParentId != $newParentId) {
                // 新しい親部署のレベルとパスを計算
                $level = 0;
                $path = '';
                
                if ($newParentId) {
                    $parent = Department::find($newParentId);
                    $level = $parent->level + 1;
                    $path = $parent->path ? $parent->path . '/' . $parent->id : $parent->id;
                }

                // 子部署のレベルとパスも更新
                $this->updateChildDepartments($department, $level, $path);
            }

            // 部署を更新
            $departmentData = $request->except(['permission_ids']);
            if ($oldParentId != $newParentId) {
                $departmentData['level'] = $level;
                $departmentData['path'] = $path;
            }
            
            $department->update($departmentData);

            // 権限を更新
            if ($request->has('permission_ids')) {
                $department->permissions()->detach();
                if (!empty($request->permission_ids)) {
                    $permissionData = [];
                    foreach ($request->permission_ids as $permissionId) {
                        $permissionData[$permissionId] = [
                            'granted_at' => now(),
                            'granted_by' => auth()->id() ?? 2,
                        ];
                    }
                    $department->permissions()->attach($permissionData);
                }
            }

            // 更新された部署を取得
            $department->load(['parent', 'children', 'manager', 'permissions', 'users']);

            return response()->json([
                'success' => true,
                'message' => '部署が正常に更新されました',
                'data' => $this->formatDepartmentData($department),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '部署の更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 部署を削除（ソフトデリート）
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $department = Department::find($id);

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => '部署が見つかりません',
                ], 404);
            }

            // 子部署があるかチェック
            if ($department->hasChildren()) {
                return response()->json([
                    'success' => false,
                    'message' => '子部署が存在するため削除できません',
                    'data' => [
                        'children_count' => $department->children()->count(),
                    ],
                ], 400);
            }

            // 部署が使用されているかチェック
            $userCount = $department->users()->count();

            if ($userCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'この部署は使用されているため削除できません',
                    'data' => [
                        'user_count' => $userCount,
                    ],
                ], 400);
            }

            $department->delete();

            return response()->json([
                'success' => true,
                'message' => '部署が正常に削除されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '部署の削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 部署に権限を追加
     */
    public function addPermissions(Request $request, int $id): JsonResponse
    {
        try {
            $department = Department::find($id);

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => '部署が見つかりません',
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
            $existingPermissionIds = $department->permissions()->pluck('permissions.id')->toArray();
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
            $department->permissions()->attach($permissionData);

            // 更新された部署を取得
            $department->load(['permissions']);

            return response()->json([
                'success' => true,
                'message' => count($newPermissionIds) . '個の権限が追加されました',
                'data' => $this->formatDepartmentData($department),
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
     * 部署から権限を削除
     */
    public function removePermissions(Request $request, int $id): JsonResponse
    {
        try {
            $department = Department::find($id);

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => '部署が見つかりません',
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
            $existingPermissionIds = $department->permissions()->pluck('permissions.id')->toArray();
            $removablePermissionIds = array_intersect($request->permission_ids, $existingPermissionIds);

            if (empty($removablePermissionIds)) {
                return response()->json([
                    'success' => false,
                    'message' => '指定された権限は割り当てられていません',
                ], 400);
            }

            // 権限を削除
            $department->permissions()->detach($removablePermissionIds);

            // 更新された部署を取得
            $department->load(['permissions']);

            return response()->json([
                'success' => true,
                'message' => count($removablePermissionIds) . '個の権限が削除されました',
                'data' => $this->formatDepartmentData($department),
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
     * 部署の使用状況を取得
     */
    public function usage(int $id): JsonResponse
    {
        try {
            $department = Department::find($id);

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => '部署が見つかりません',
                ], 404);
            }

            $users = $department->users()->with(['systemLevel', 'roles'])->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'department' => $this->formatDepartmentData($department),
                    'users' => $users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'employee_id' => $user->employee_id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'system_level' => $user->system_level,
                            'is_active' => $user->is_active,
                            'position' => $user->pivot->position,
                            'is_primary' => $user->pivot->is_primary,
                            'assigned_at' => $user->pivot->assigned_at,
                            'is_active_department' => $user->pivot->is_active,
                        ];
                    }),
                    'user_count' => $users->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '部署の使用状況取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 部署作成・編集用の選択肢データを取得
     */
    public function getOptions(): JsonResponse
    {
        try {
            $departments = Department::active()->orderBySort()->get();
            $permissions = Permission::active()->orderBy('module')->orderBy('action')->get();
            $managers = User::active()->orderBy('name')->get(['id', 'name', 'employee_id']);

            return response()->json([
                'success' => true,
                'data' => [
                    'departments' => $departments,
                    'permissions' => $permissions,
                    'managers' => $managers,
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
     * 子部署のレベルとパスを更新
     */
    private function updateChildDepartments(Department $department, int $newLevel, string $newPath): void
    {
        $children = $department->children;
        
        foreach ($children as $child) {
            $childLevel = $newLevel + 1;
            $childPath = $newPath ? $newPath . '/' . $department->id : $department->id;
            
            $child->update([
                'level' => $childLevel,
                'path' => $childPath,
            ]);
            
            // 再帰的に子部署も更新
            $this->updateChildDepartments($child, $childLevel, $childPath);
        }
    }

    /**
     * 部署階層構造を構築
     */
    private function buildDepartmentTree(Department $department): array
    {
        $data = $this->formatDepartmentData($department);
        
        if ($department->children->isNotEmpty()) {
            $data['children'] = $department->children->map(function ($child) {
                return $this->buildDepartmentTree($child);
            });
        }
        
        return $data;
    }

    /**
     * 部署データを整形
     */
    private function formatDepartmentData(Department $department): array
    {
        return [
            'id' => $department->id,
            'name' => $department->name,
            'code' => $department->code,
            'description' => $department->description,
            'parent_id' => $department->parent_id,
            'level' => $department->level,
            'path' => $department->path,
            'sort_order' => $department->sort_order,
            'manager_id' => $department->manager_id,
            'is_active' => $department->is_active,
            'parent' => $department->parent ? [
                'id' => $department->parent->id,
                'name' => $department->parent->name,
                'code' => $department->parent->code,
            ] : null,
            'manager' => $department->manager ? [
                'id' => $department->manager->id,
                'name' => $department->manager->name,
                'employee_id' => $department->manager->employee_id,
            ] : null,
            'permissions' => $department->permissions->map(function ($permission) {
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
            'children_count' => $department->children()->count(),
            'users_count' => $department->users()->count(),
            'permissions_count' => $department->permissions()->count(),
            'created_at' => $department->created_at,
            'updated_at' => $department->updated_at,
        ];
    }
}
