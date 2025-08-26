<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Department;
use App\Models\SystemLevel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * ユーザー一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::with(['systemLevel', 'roles', 'departments']);

            // 検索条件
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('name_kana', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%");
                });
            }

            // システム権限レベルでフィルタ
            if ($request->filled('system_level')) {
                $query->where('system_level', $request->system_level);
            }

            // アクティブ状態でフィルタ
            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // 管理者フラグでフィルタ
            if ($request->filled('is_admin')) {
                $query->where('is_admin', $request->boolean('is_admin'));
            }

            // 部署でフィルタ
            if ($request->filled('department_id')) {
                $query->whereHas('departments', function ($q) use ($request) {
                    $q->where('departments.id', $request->department_id);
                });
            }

            // 役割でフィルタ
            if ($request->filled('role_id')) {
                $query->whereHas('roles', function ($q) use ($request) {
                    $q->where('roles.id', $request->role_id);
                });
            }

            // ソート
            $sortBy = $request->get('sort_by', 'created_at');
            $sortDirection = $request->get('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $users = $query->paginate($perPage);

            // レスポンスデータを整形
            $users->getCollection()->transform(function ($user) {
                return $this->formatUserData($user);
            });

            return response()->json([
                'success' => true,
                'data' => $users,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザー一覧の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定のユーザーを取得
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = User::with(['systemLevel', 'roles', 'departments'])
                ->find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'ユーザーが見つかりません',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatUserData($user),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザー情報の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 新しいユーザーを作成
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'employee_id' => 'required|string|max:50|unique:users,employee_id',
                'name' => 'required|string|max:255',
                'name_kana' => 'nullable|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'birth_date' => 'nullable|date',
                'gender' => 'nullable|string|max:10',
                'phone' => 'nullable|string|max:20',
                'mobile_phone' => 'nullable|string|max:20',
                'postal_code' => 'nullable|string|max:10',
                'prefecture' => 'nullable|string|max:50',
                'address' => 'nullable|string',
                'position' => 'nullable|string|max:100',
                'job_title' => 'nullable|string|max:100',
                'hire_date' => 'nullable|date',
                'service_years' => 'nullable|integer|min:0',
                'service_months' => 'nullable|integer|min:0|max:11',
                'system_level' => 'required|string|exists:system_levels,code',
                'is_active' => 'boolean',
                'is_admin' => 'boolean',
                'role_ids' => 'nullable|array',
                'role_ids.*' => 'exists:roles,id',
                'department_ids' => 'nullable|array',
                'department_ids.*' => 'exists:departments,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // ユーザーを作成
            $userData = $request->except(['role_ids', 'department_ids', 'password']);
            $userData['password'] = Hash::make($request->password);
            $userData['password_changed_at'] = now();
            $userData['password_expires_at'] = now()->addMonths(3);

            $user = User::create($userData);

            // 役割を割り当て
            if ($request->filled('role_ids')) {
                $user->roles()->attach($request->role_ids, [
                    'assigned_at' => now(),
                    'assigned_by' => auth()->id(),
                    'is_active' => true,
                ]);
            }

            // 部署を割り当て
            if ($request->filled('department_ids')) {
                $departmentData = [];
                foreach ($request->department_ids as $index => $departmentId) {
                    $departmentData[$departmentId] = [
                        'position' => $request->input("department_positions.{$index}"),
                        'is_primary' => $index === 0, // 最初の部署をプライマリに設定
                        'assigned_at' => now(),
                        'assigned_by' => auth()->id(),
                        'is_active' => true,
                    ];
                }
                $user->departments()->attach($departmentData);
            }

            // 作成されたユーザーを取得
            $user->load(['systemLevel', 'roles', 'departments']);

            return response()->json([
                'success' => true,
                'message' => 'ユーザーが正常に作成されました',
                'data' => $this->formatUserData($user),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザーの作成中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ユーザーを更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'ユーザーが見つかりません',
                ], 404);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'employee_id' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('users', 'employee_id')->ignore($id),
                ],
                'name' => 'required|string|max:255',
                'name_kana' => 'nullable|string|max:255',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('users', 'email')->ignore($id),
                ],
                'password' => 'nullable|string|min:8',
                'birth_date' => 'nullable|date',
                'gender' => 'nullable|string|max:10',
                'phone' => 'nullable|string|max:20',
                'mobile_phone' => 'nullable|string|max:20',
                'postal_code' => 'nullable|string|max:10',
                'prefecture' => 'nullable|string|max:50',
                'address' => 'nullable|string',
                'position' => 'nullable|string|max:100',
                'job_title' => 'nullable|string|max:100',
                'hire_date' => 'nullable|date',
                'service_years' => 'nullable|integer|min:0',
                'service_months' => 'nullable|integer|min:0|max:11',
                'system_level' => 'required|string|exists:system_levels,code',
                'is_active' => 'boolean',
                'is_admin' => 'boolean',
                'role_ids' => 'nullable|array',
                'role_ids.*' => 'exists:roles,id',
                'department_ids' => 'nullable|array',
                'department_ids.*' => 'exists:departments,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // ユーザー情報を更新
            $userData = $request->except(['role_ids', 'department_ids', 'password']);
            
            // パスワードが提供された場合のみ更新
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
                $userData['password_changed_at'] = now();
                $userData['password_expires_at'] = now()->addMonths(3);
            }

            $user->update($userData);

            // 役割を更新
            if ($request->has('role_ids')) {
                $user->roles()->detach();
                if (!empty($request->role_ids)) {
                    $user->roles()->attach($request->role_ids, [
                        'assigned_at' => now(),
                        'assigned_by' => auth()->id(),
                        'is_active' => true,
                    ]);
                }
            }

            // 部署を更新
            if ($request->has('department_ids')) {
                $user->departments()->detach();
                if (!empty($request->department_ids)) {
                    $departmentData = [];
                    foreach ($request->department_ids as $index => $departmentId) {
                        $departmentData[$departmentId] = [
                            'position' => $request->input("department_positions.{$index}"),
                            'is_primary' => $index === 0,
                            'assigned_at' => now(),
                            'assigned_by' => auth()->id(),
                            'is_active' => true,
                        ];
                    }
                    $user->departments()->attach($departmentData);
                }
            }

            // 更新されたユーザーを取得
            $user->load(['systemLevel', 'roles', 'departments']);

            return response()->json([
                'success' => true,
                'message' => 'ユーザーが正常に更新されました',
                'data' => $this->formatUserData($user),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザーの更新中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ユーザーを削除（ソフトデリート）
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'ユーザーが見つかりません',
                ], 404);
            }

            // 自分自身を削除できないようにする
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => '自分自身を削除することはできません',
                ], 400);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'ユーザーが正常に削除されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザーの削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ユーザーのアカウントをロック/アンロック
     */
    public function toggleLock(int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'ユーザーが見つかりません',
                ], 404);
            }

            if ($user->isLocked()) {
                // アンロック
                $user->update([
                    'locked_at' => null,
                    'failed_login_attempts' => 0,
                ]);
                $message = 'ユーザーのアカウントがアンロックされました';
            } else {
                // ロック
                $user->update(['locked_at' => now()]);
                $message = 'ユーザーのアカウントがロックされました';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'is_locked' => $user->isLocked(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'アカウントロック状態の変更中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ユーザーのパスワードをリセット
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'ユーザーが見つかりません',
                ], 404);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'new_password' => 'required|string|min:8',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // パスワードをリセット
            $user->update([
                'password' => Hash::make($request->new_password),
                'password_changed_at' => now(),
                'password_expires_at' => now()->addMonths(3),
                'failed_login_attempts' => 0,
                'locked_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'パスワードが正常にリセットされました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'パスワードリセット中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ユーザー作成・編集用の選択肢データを取得
     */
    public function getOptions(): JsonResponse
    {
        try {
            $systemLevels = SystemLevel::active()->orderByPriority()->get();
            $roles = Role::active()->orderByPriority()->get();
            $departments = Department::active()->orderBySort()->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'system_levels' => $systemLevels,
                    'roles' => $roles,
                    'departments' => $departments,
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
     * ユーザーデータを整形
     */
    private function formatUserData(User $user): array
    {
        return [
            'id' => $user->id,
            'employee_id' => $user->employee_id,
            'name' => $user->name,
            'name_kana' => $user->name_kana,
            'email' => $user->email,
            'birth_date' => $user->birth_date,
            'gender' => $user->gender,
            'phone' => $user->phone,
            'mobile_phone' => $user->mobile_phone,
            'postal_code' => $user->postal_code,
            'prefecture' => $user->prefecture,
            'address' => $user->address,
            'position' => $user->position,
            'job_title' => $user->job_title,
            'hire_date' => $user->hire_date,
            'service_years' => $user->service_years,
            'service_months' => $user->service_months,
            'system_level' => $user->system_level,
            'is_active' => $user->is_active,
            'is_admin' => $user->is_admin,
            'last_login_at' => $user->last_login_at,
            'is_locked' => $user->isLocked(),
            'is_password_expired' => $user->isPasswordExpired(),
            'system_level_info' => $user->systemLevel ? [
                'code' => $user->systemLevel->code,
                'name' => $user->systemLevel->name,
                'display_name' => $user->systemLevel->display_name,
                'priority' => $user->systemLevel->priority,
            ] : null,
            'roles' => $user->roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'priority' => $role->priority,
                    'assigned_at' => $role->pivot->assigned_at,
                    'is_active' => $role->pivot->is_active,
                ];
            }),
            'departments' => $user->departments->map(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'code' => $department->code,
                    'position' => $department->pivot->position,
                    'is_primary' => $department->pivot->is_primary,
                    'assigned_at' => $department->pivot->assigned_at,
                    'is_active' => $department->pivot->is_active,
                ];
            }),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
