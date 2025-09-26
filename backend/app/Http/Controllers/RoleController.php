<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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
     * 特定の役割を取得
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $role
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
}