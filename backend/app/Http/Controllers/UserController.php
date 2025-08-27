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
        $query = User::with([
            'systemLevel',
            'roles',
            'departments'
        ]);

        // 検索条件
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_kana', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // ステータスフィルタ
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // システム権限レベルフィルタ
        if ($request->filled('system_level')) {
            $query->where('system_level', $request->get('system_level'));
        }

        // 部署フィルタ
        if ($request->filled('department_id')) {
            $query->whereHas('departments', function ($q) use ($request) {
                $q->where('departments.id', $request->get('department_id'));
            });
        }

        // 役割フィルタ
        if ($request->filled('role_id')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('roles.id', $request->get('role_id'));
            });
        }

        // ロック状態フィルタ
        if ($request->filled('is_locked')) {
            if ($request->boolean('is_locked')) {
                $query->whereNotNull('locked_at');
            } else {
                $query->whereNull('locked_at');
            }
        }

        // ソート
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // ページネーション
        $perPage = $request->get('pageSize', 10);
        $page = $request->get('page', 1);
        $users = $query->paginate($perPage, ['*'], 'page', $page);

        // レスポンスデータを整形
        $users->getCollection()->transform(function ($user) {
            // プライマリ部署を取得
            $primaryDepartment = $user->departments()
                ->wherePivot('is_primary', true)
                ->first();

            // アクティブな役割を取得
            $activeRoles = $user->roles()
                ->wherePivot('is_active', true)
                ->get();

            return [
                'id' => $user->id,
                'employee_id' => $user->employee_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $activeRoles->first() ? $activeRoles->first()->name : 'user',
                'status' => $user->is_active ? 'active' : 'inactive',
                'createdAt' => $user->created_at->toISOString(),
                'updatedAt' => $user->updated_at->toISOString(),
            ];
        });

        return response()->json([
            'users' => $users->items(),
            'totalCount' => $users->total(),
        ]);
    }

    /**
     * 特定のユーザーを取得
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with([
            'roles',
            'departments',
            'systemLevel',
            'sessions',
            'loginHistory'
        ])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザーが見つかりません',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatUserData($user),
        ]);
    }

    /**
     * 新しいユーザーを作成
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|string|max:50|unique:users',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,user,manager',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userData = $validator->validated();
        $userData['password'] = Hash::make($userData['password']);
        $userData['is_active'] = true;

        $user = User::create($userData);

        // 役割を割り当て
        $role = Role::where('name', $userData['role'])->first();
        if ($role) {
            $user->roles()->attach($role->id, [
                'assigned_at' => now(),
                'assigned_by' => auth()->id() ?? 1,
                'is_active' => true,
            ]);
        }

        $user->load(['roles']);

        // フロントエンドが期待する形式でレスポンス
        $activeRoles = $user->roles()->wherePivot('is_active', true)->get();
        
        return response()->json([
            'id' => $user->id,
            'employee_id' => $user->employee_id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $activeRoles->first() ? $activeRoles->first()->name : 'user',
            'status' => $user->is_active ? 'active' : 'inactive',
            'createdAt' => $user->created_at->toISOString(),
            'updatedAt' => $user->updated_at->toISOString(),
        ], 201);
    }

    /**
     * ユーザーを更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザーが見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'employee_id' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('users')->ignore($id),
            ],
            'name' => 'nullable|string|max:255',
            'email' => [
                'nullable',
                'email',
                Rule::unique('users')->ignore($id),
            ],
            'role' => 'nullable|in:admin,user,manager',
            'status' => 'nullable|in:active,inactive,pending',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userData = $validator->validated();

        // ステータスを変換
        if (isset($userData['status'])) {
            $userData['is_active'] = $userData['status'] === 'active';
        }

        $user->update($userData);

        // 役割を更新
        if (isset($userData['role'])) {
            $role = Role::where('name', $userData['role'])->first();
            if ($role) {
                $user->roles()->sync([$role->id => [
                    'assigned_at' => now(),
                    'assigned_by' => auth()->id() ?? 1,
                    'is_active' => true,
                ]]);
            }
        }

        $user->load(['roles']);

        // フロントエンドが期待する形式でレスポンス
        $activeRoles = $user->roles()->wherePivot('is_active', true)->get();
        
        return response()->json([
            'id' => $user->id,
            'employee_id' => $user->employee_id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $activeRoles->first() ? $activeRoles->first()->name : 'user',
            'status' => $user->is_active ? 'active' : 'inactive',
            'createdAt' => $user->created_at->toISOString(),
            'updatedAt' => $user->updated_at->toISOString(),
        ]);
    }

    /**
     * ユーザーを削除
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザーが見つかりません',
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'ユーザーが正常に削除されました',
        ]);
    }

    /**
     * アカウントロック状態を切り替え
     */
    public function toggleLock(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザーが見つかりません',
            ], 404);
        }

        if ($user->isLocked()) {
            $user->update([
                'locked_at' => null,
                'failed_login_attempts' => 0,
            ]);
            $message = 'アカウントのロックが解除されました';
        } else {
            $user->update(['locked_at' => now()]);
            $message = 'アカウントがロックされました';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'is_locked' => $user->isLocked(),
            ],
        ]);
    }

    /**
     * パスワードをリセット
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'ユーザーが見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'password_changed_at' => now(),
            'password_expires_at' => now()->addDays(90),
            'locked_at' => null,
            'failed_login_attempts' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'パスワードが正常にリセットされました',
        ]);
    }

    /**
     * ユーザー作成・編集用のオプションデータを取得
     */
    public function getOptions(): JsonResponse
    {
        $roles = Role::where('is_active', true)->get();
        $departments = Department::where('is_active', true)->get();
        $systemLevels = SystemLevel::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'roles' => $roles,
                'departments' => $departments,
                'system_levels' => $systemLevels,
            ],
        ]);
    }

    /**
     * ユーザーデータをフォーマット
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
            'password_changed_at' => $user->password_changed_at,
            'password_expires_at' => $user->password_expires_at,
            'failed_login_attempts' => $user->failed_login_attempts,
            'locked_at' => $user->locked_at,
            'is_locked' => $user->isLocked(),
            'is_password_expired' => $user->isPasswordExpired(),
            'roles' => $user->roles,
            'departments' => $user->departments,
            'system_level_info' => $user->systemLevel,
            'primary_department' => $user->primaryDepartment(),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
