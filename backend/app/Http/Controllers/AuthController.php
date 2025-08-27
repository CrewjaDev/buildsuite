<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Permission;
use App\Models\UserLoginHistory;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * ユーザーログイン
     */
    public function login(Request $request): JsonResponse
    {
        try {
            // バリデーション
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string',
                'remember' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $credentials = $request->only(['email', 'password']);
            $remember = $request->boolean('remember', false);

            // ユーザーを検索
            $user = User::where('email', $credentials['email'])->first();

            if (!$user) {
                $this->logLoginAttempt($request, 'failed', 'ユーザーが見つかりません');
                return response()->json([
                    'success' => false,
                    'message' => 'メールアドレスまたはパスワードが正しくありません',
                ], 401);
            }

            // アカウントがロックされているかチェック
            if ($user->isLocked()) {
                $this->logLoginAttempt($request, 'failed', 'アカウントがロックされています', $user);
                return response()->json([
                    'success' => false,
                    'message' => 'アカウントがロックされています。管理者に連絡してください。',
                ], 423);
            }

            // アカウントが無効かチェック
            if (!$user->is_active) {
                $this->logLoginAttempt($request, 'failed', 'アカウントが無効です', $user);
                return response()->json([
                    'success' => false,
                    'message' => 'アカウントが無効です。管理者に連絡してください。',
                ], 423);
            }

            // パスワードが期限切れかチェック
            if ($user->isPasswordExpired()) {
                $this->logLoginAttempt($request, 'failed', 'パスワードが期限切れです', $user);
                return response()->json([
                    'success' => false,
                    'message' => 'パスワードが期限切れです。パスワードを変更してください。',
                ], 423);
            }

            // 認証を試行
            if (!Auth::attempt($credentials, $remember)) {
                // ログイン失敗回数を増加
                $user->incrementFailedLoginAttempts();
                $this->logLoginAttempt($request, 'failed', 'パスワードが正しくありません', $user);
                
                return response()->json([
                    'success' => false,
                    'message' => 'メールアドレスまたはパスワードが正しくありません',
                ], 401);
            }

            // ログイン成功
            $user->resetFailedLoginAttempts();
            $user->updateLastLogin();

            // Sanctumトークンを生成
            $token = $user->createToken('web-token')->plainTextToken;

            // ユーザー情報を取得（権限情報を含む）
            $userData = $this->getUserData($user);

            $this->logLoginAttempt($request, 'success', null, $user);

            return response()->json([
                'success' => true,
                'message' => 'ログインに成功しました',
                'data' => [
                    'user' => $userData,
                    'token' => $token,
                    'token_type' => 'Bearer',
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ログイン処理中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ユーザーログアウト
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('sanctum')->user();

            if ($user) {
                // 現在のトークンを削除
                $user->currentAccessToken()->delete();
                
                // ログアウト履歴を記録（オプション）
                $this->logLogoutAttempt($request, $user);
            }

            // Auth::logout()を削除 - Sanctumでは不要

            return response()->json([
                'success' => true,
                'message' => 'ログアウトに成功しました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ログアウト処理中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 現在のユーザー情報を取得
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('sanctum')->user();  // ← sanctumガードを明示的に指定

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => '認証されていません',
                ], 401);
            }

            $userData = $this->getUserData($user);

            return response()->json([
                'success' => true,
                'data' => $userData,
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
     * パスワード変更
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => '認証されていません',
                ], 401);
            }

            // バリデーション
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
                'new_password_confirmation' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'バリデーションエラー',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 現在のパスワードをチェック
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => '現在のパスワードが正しくありません',
                ], 400);
            }

            // 新しいパスワードを設定
            $user->update([
                'password' => Hash::make($request->new_password),
                'password_changed_at' => now(),
                'password_expires_at' => now()->addMonths(3), // 3ヶ月後に期限切れ
            ]);

            return response()->json([
                'success' => true,
                'message' => 'パスワードが正常に変更されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'パスワード変更中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * セッション一覧を取得
     */
    public function sessions(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => '認証されていません',
                ], 401);
            }

            $sessions = $user->sessions()
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->orderBy('last_activity', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $sessions,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'セッション情報の取得中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 特定のセッションを無効化
     */
    public function revokeSession(Request $request, string $sessionId): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => '認証されていません',
                ], 401);
            }

            $session = $user->sessions()
                ->where('session_id', $sessionId)
                ->where('is_active', true)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'セッションが見つかりません',
                ], 404);
            }

            $session->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'セッションが正常に無効化されました',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'セッション無効化中にエラーが発生しました',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ユーザーセッションを作成
     */
    private function createUserSession(User $user, Request $request): UserSession
    {
        $sessionId = Str::uuid()->toString();
        $expiresAt = now()->addHours(24); // 24時間後に期限切れ

        return UserSession::create([
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'last_activity' => now(),
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);
    }

    /**
     * ログイン試行を記録
     */
    private function logLoginAttempt(
        Request $request, 
        string $status, 
        string $failureReason = null, 
        User $user = null, 
        string $sessionId = null
    ): void {
        UserLoginHistory::create([
            'user_id' => $user ? $user->id : null,
            'login_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => $sessionId,
            'status' => $status,
            'failure_reason' => $failureReason,
        ]);
    }

    /**
     * ログアウト試行を記録
     */
    private function logLogoutAttempt(Request $request, User $user): void
    {
        UserLoginHistory::create([
            'user_id' => $user->id,
            'login_at' => now(),
            'logout_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'logout',
            'failure_reason' => null,
        ]);
    }

    /**
     * ユーザーデータを取得（権限情報を含む）
     */
    private function getUserData(User $user): array
    {
        return [
            'id' => $user->id,
            'employee_id' => $user->employee_id,
            'name' => $user->name,
            'name_kana' => $user->name_kana,
            'email' => $user->email,
            'position' => $user->position,
            'job_title' => $user->job_title,
            'system_level' => $user->system_level,
            'is_admin' => $user->is_admin,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at,
            'system_level_info' => $user->systemLevel ? [
                'code' => $user->systemLevel->code,
                'name' => $user->systemLevel->name,
                'display_name' => $user->systemLevel->display_name,
                'priority' => $user->systemLevel->priority,
            ] : null,
            'roles' => $user->activeRoles()->get()->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'priority' => $role->priority,
                ];
            }),
            'departments' => $user->activeDepartments()->get()->map(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'code' => $department->code,
                    'position' => $department->pivot->position,
                    'is_primary' => $department->pivot->is_primary,
                ];
            }),
            'permissions' => $this->getUserPermissions($user),
        ];
    }

    /**
     * ユーザーの権限一覧を取得
     */
    private function getUserPermissions(User $user): array
    {
        $permissions = collect();

        // システム管理者は全ての権限を持つ
        if ($user->is_admin) {
            $permissions = Permission::where('is_active', true)->get();
        } else {
            // システム権限レベルによる権限
            if ($user->systemLevel) {
                $permissions = $permissions->merge($user->systemLevel->activePermissions);
            }

            // 役割による権限
            $rolePermissions = $user->activeRoles()
                ->with('permissions')
                ->get()
                ->flatMap(function ($role) {
                    return $role->activePermissions;
                });
            $permissions = $permissions->merge($rolePermissions);

            // 部署による権限
            $departmentPermissions = $user->activeDepartments()
                ->with('permissions')
                ->get()
                ->flatMap(function ($department) {
                    return $department->activePermissions;
                });
            $permissions = $permissions->merge($departmentPermissions);

            // 重複を除去
            $permissions = $permissions->unique('id');
        }

        return $permissions->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'display_name' => $permission->display_name,
                'module' => $permission->module,
                'action' => $permission->action,
                'resource' => $permission->resource,
            ];
        })->values()->toArray();
    }
}
