<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Models\Department;
use App\Models\Position;
use App\Models\SystemLevel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    /**
     * 社員一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        $query = Employee::with([
            'department',
            'position',
            'user' // システム利用権限情報
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

        // 在職状況フィルタ
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // 部署フィルタ
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->get('department_id'));
        }

        // ソート
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // ページネーション
        $perPage = $request->get('pageSize', 10);
        $page = $request->get('page', 1);
        $employees = $query->paginate($perPage, ['*'], 'page', $page);

        // レスポンスデータを整形（社員管理ページ用：連結データ含む）
        $employees->getCollection()->transform(function ($employee) {
            return [
                // employeesテーブルの基本項目
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->name,
                'name_kana' => $employee->name_kana,
                'full_name' => $employee->full_name, // Eloquentアクセサー
                'email' => $employee->email,
                'birth_date' => $employee->birth_date,
                'gender' => $employee->gender,
                'phone' => $employee->phone,
                'mobile_phone' => $employee->mobile_phone,
                'postal_code' => $employee->postal_code,
                'prefecture' => $employee->prefecture,
                'address' => $employee->address,
                'job_title' => $employee->job_title,
                'hire_date' => $employee->hire_date,
                'service_years' => $employee->service_years, // Eloquentアクセサー
                'service_months' => $employee->service_months, // Eloquentアクセサー
                'department_id' => $employee->department_id,
                'position_id' => $employee->position_id,
                'is_active' => $employee->is_active,
                'created_at' => $employee->created_at->toISOString(),
                'updated_at' => $employee->updated_at->toISOString(),
                
                // 連結データ（社員管理ページで必要）
                'department' => $employee->department,
                'position' => $employee->position,
                'has_system_access' => $employee->hasSystemAccess(),
                'user' => $employee->user ? [
                    'id' => $employee->user->id,
                    'login_id' => $employee->user->login_id,
                    'system_level' => $employee->user->system_level,
                    'is_admin' => $employee->user->is_admin,
                    'last_login_at' => $employee->user->last_login_at,
                    'is_locked' => $employee->user->isLocked(),
                    'roles' => $employee->user->roles,
                    'system_level_info' => $employee->user->systemLevel,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => $employees->items(),
                'totalCount' => $employees->total(),
            ],
        ]);
    }

    /**
     * 新しい社員を作成（基本情報のみ）
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // 社員基本情報のバリデーション
            $validator = Validator::make($request->all(), [
                'employee_id' => 'required|string|max:50|unique:employees',
                'name' => 'required|string|max:255',
                'name_kana' => 'nullable|string|max:255',
                'email' => 'nullable|email|unique:employees',
                'birth_date' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'phone' => 'nullable|string|max:20',
                'mobile_phone' => 'nullable|string|max:20',
                'postal_code' => 'nullable|string|max:10',
                'prefecture' => 'nullable|string|max:50',
                'address' => 'nullable|string|max:500',
                'job_title' => 'nullable|string|max:100',
                'hire_date' => 'nullable|date',
                'department_id' => 'required|integer|exists:departments,id',
                'position_id' => 'nullable|integer|exists:positions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $employeeData = $validator->validated();
            
            // 空文字列をnullに変換
            foreach ($employeeData as $key => $value) {
                if ($value === '') {
                    $employeeData[$key] = null;
                }
            }
            
            // デフォルト値を設定
            $employeeData['is_active'] = true;

            $employee = Employee::create($employeeData);

            // 関連データを読み込み
            $employee->load(['department', 'position']);

            return response()->json([
                'success' => true,
                'message' => '社員が正常に登録されました。システム利用権限は編集画面で設定してください。',
                'data' => $this->formatEmployeeData($employee),
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '社員の登録中にエラーが発生しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 特定の社員を取得
     */
    public function show(int $id): JsonResponse
    {
        $employee = Employee::with([
            'department',
            'position',
            'user.roles',
            'user.systemLevel'
        ])->find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => '社員が見つかりません',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatEmployeeData($employee),
        ]);
    }

    /**
     * 社員情報を更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => '社員が見つかりません',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'employee_id' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('employees')->ignore($id),
            ],
            'name' => 'nullable|string|max:255',
            'name_kana' => 'nullable|string|max:255',
            'email' => [
                'nullable',
                'email',
                Rule::unique('employees')->ignore($id),
            ],
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'nullable|string|max:20',
            'mobile_phone' => 'nullable|string|max:20',
            'postal_code' => 'nullable|string|max:10',
            'prefecture' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'job_title' => 'nullable|string|max:100',
            'hire_date' => 'nullable|date',

            'department_id' => 'nullable|integer|exists:departments,id',
            'position_id' => 'nullable|integer|exists:positions,id',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラー',
                'errors' => $validator->errors(),
            ], 422);
        }

        $employeeData = $validator->validated();
        
        // 空文字列をnullに変換
        foreach ($employeeData as $key => $value) {
            if ($value === '') {
                $employeeData[$key] = null;
            }
        }

        // 社員情報を更新
        $employee->update($employeeData);

        // 勤続年数・月数は自動計算（アクセサーで実装済み）

        // 関連データを読み込み
        $employee->load(['department', 'position', 'user']);

        return response()->json([
            'success' => true,
            'message' => '社員情報が正常に更新されました',
            'data' => $this->formatEmployeeData($employee),
        ]);
    }

    /**
     * 社員を論理削除する
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $employee = Employee::findOrFail($id);

            // システム権限を持っている場合は、関連するユーザーも論理削除
            if ($employee->user) {
                $employee->user->delete(); // usersテーブルも論理削除
            }

            // 社員データを論理削除
            $employee->delete(); // deleted_atに現在日時をセット

            return response()->json([
                'success' => true,
                'message' => '社員データが正常に削除されました',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => '指定された社員が見つかりません',
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '社員削除中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 社員作成・編集用のオプションデータを取得
     */
    public function getOptions(): JsonResponse
    {
        $departments = Department::where('is_active', true)->get();
        $positions = Position::where('is_active', true)->orderBy('level')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'departments' => $departments,
                'positions' => $positions,
            ],
        ]);
    }

    /**
     * 社員データをフォーマット（社員管理ページ用：連結データ含む）
     */
    private function formatEmployeeData(Employee $employee): array
    {
        return [
            // employeesテーブルの基本項目
            'id' => $employee->id,
            'employee_id' => $employee->employee_id,
            'name' => $employee->name,
            'name_kana' => $employee->name_kana,
            'full_name' => $employee->full_name, // Eloquentアクセサー
            'email' => $employee->email,
            'birth_date' => $employee->birth_date,
            'gender' => $employee->gender,
            'phone' => $employee->phone,
            'mobile_phone' => $employee->mobile_phone,
            'postal_code' => $employee->postal_code,
            'prefecture' => $employee->prefecture,
            'address' => $employee->address,
            'job_title' => $employee->job_title,
            'hire_date' => $employee->hire_date,
            'service_years' => $employee->service_years, // Eloquentアクセサー
            'service_months' => $employee->service_months, // Eloquentアクセサー
            'department_id' => $employee->department_id,
            'position_id' => $employee->position_id,
            'is_active' => $employee->is_active,
            'created_at' => $employee->created_at,
            'updated_at' => $employee->updated_at,
            
            // 連結データ（社員管理ページで必要）
            'department' => $employee->department,
            'position' => $employee->position,
            'has_system_access' => $employee->hasSystemAccess(),
            'user' => $employee->user ? [
                'id' => $employee->user->id,
                'login_id' => $employee->user->login_id,
                'system_level' => $employee->user->system_level,
                'is_admin' => $employee->user->is_admin,
                'last_login_at' => $employee->user->last_login_at,
                'is_locked' => $employee->user->isLocked(),
                'roles' => $employee->user->roles,
                'system_level_info' => $employee->user->systemLevel,
            ] : null,
        ];
    }

    /**
     * 社員にシステム利用権限を付与
     */
    public function grantSystemAccess(Request $request, int $id): JsonResponse
    {
        try {
            $employee = Employee::findOrFail($id);

            // バリデーション（パスワードは含まない）
            $validationRules = [
                'login_id' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('users', 'login_id')->ignore($employee->user?->id),
                ],
                'system_level' => 'required|string|exists:system_levels,code',
                'is_admin' => 'boolean',
            ];
            
            $validator = Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 既存のユーザーレコードがあるかチェック
            if ($employee->user) {
                // 既存ユーザーを更新（パスワードは含まない）
                $employee->user->update([
                    'login_id' => $request->login_id,
                    'system_level' => $request->system_level,
                    'is_admin' => $request->boolean('is_admin', false),
                ]);
                
                $message = 'システム利用権限が正常に更新されました';
            } else {
                // 新規ユーザーレコードを作成（パスワードは空文字で初期化）
                User::create([
                    'employee_id' => $employee->id,
                    'login_id' => $request->login_id,
                    'password' => bcrypt(''), // 空文字で初期化
                    'system_level' => $request->system_level,
                    'is_admin' => $request->boolean('is_admin', false),
                    'password_changed_at' => null,
                    'password_expires_at' => null,
                ]);
                
                $message = 'システム利用権限が正常に付与されました。パスワードは後で設定してください。';
            }

            // 更新後の社員情報を取得
            $employee = Employee::with(['department', 'position', 'user.systemLevel', 'user.roles'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $this->formatEmployeeData($employee),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限付与中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * システム利用権限を無効化
     */
    public function revokeSystemAccess(Request $request, int $id): JsonResponse
    {
        try {
            $employee = Employee::with(['user'])->findOrFail($id);

            if (!$employee->user) {
                return response()->json([
                    'success' => false,
                    'message' => 'この社員にはシステム利用権限が付与されていません',
                ], 400);
            }

            // ユーザーレコードを削除
            $employee->user->delete();

            // 更新後の社員情報を取得
            $employee = Employee::with(['department', 'position'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'システム利用権限が正常に無効化されました',
                'data' => $this->formatEmployeeData($employee),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システム権限無効化中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * システムレベル一覧を取得
     */
    public function getSystemLevels(): JsonResponse
    {
        try {
            $systemLevels = SystemLevel::where('is_active', true)
                ->orderBy('priority', 'desc')
                ->get(['code', 'name', 'display_name', 'priority']);

            return response()->json([
                'success' => true,
                'data' => $systemLevels,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'システムレベル取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

}
