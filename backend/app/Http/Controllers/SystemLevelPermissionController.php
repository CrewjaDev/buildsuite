<?php

namespace App\Http\Controllers;

use App\Models\SystemLevel;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SystemLevelPermissionController extends Controller
{
    public function __construct()
    {
        // 認証はapi.phpのRoute::middleware('auth:sanctum')で処理
    }

    /**
     * システム権限レベル一覧を取得
     */
    public function index()
    {
        // システム管理者権限チェック
        if (!Auth::user() || !Auth::user()->hasSystemLevel('system_admin')) {
            abort(403, 'システム権限レベル設定権限がありません');
        }

        $systemLevels = SystemLevel::with(['permissions' => function ($query) {
            $query->where('is_active', true);
        }])
        ->orderBy('priority')
        ->get();

        return response()->json($systemLevels);
    }

    /**
     * 特定のシステム権限レベルの詳細を取得
     */
    public function show(SystemLevel $systemLevel)
    {
        $systemLevel->load(['permissions' => function ($query) {
            $query->where('is_active', true);
        }]);

        return response()->json($systemLevel);
    }

    /**
     * システム権限レベルに権限を付与
     */
    public function attachPermission(Request $request, SystemLevel $systemLevel)
    {
        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $permissionIds = $request->permission_ids;

        // 既存の権限を取得
        $existingPermissionIds = $systemLevel->permissions()->pluck('permissions.id')->toArray();

        // 新しく付与する権限のみを抽出
        $newPermissionIds = array_diff($permissionIds, $existingPermissionIds);

        if (empty($newPermissionIds)) {
            return response()->json(['message' => 'すべての権限は既に付与されています'], 200);
        }

        // 権限を付与
        $systemLevel->permissions()->syncWithoutDetaching($newPermissionIds, [
            'granted_at' => now(),
            'granted_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => '権限を付与しました',
            'attached_permissions' => Permission::whereIn('id', $newPermissionIds)->get()
        ], 201);
    }

    /**
     * システム権限レベルから権限を削除
     */
    public function detachPermission(Request $request, SystemLevel $systemLevel)
    {
        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $permissionIds = $request->permission_ids;

        // 権限を削除
        $systemLevel->permissions()->detach($permissionIds);

        return response()->json([
            'message' => '権限を削除しました',
            'detached_permissions' => Permission::whereIn('id', $permissionIds)->get()
        ]);
    }

    /**
     * システム権限レベルの権限を一括更新
     */
    public function syncPermissions(Request $request, SystemLevel $systemLevel)
    {
        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $permissionIds = $request->permission_ids;

        // 権限を一括更新
        $systemLevel->permissions()->sync($permissionIds, [
            'granted_at' => now(),
            'granted_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => '権限を一括更新しました',
            'permissions' => $systemLevel->permissions()->get()
        ]);
    }

    /**
     * 利用可能な権限一覧を取得
     */
    public function availablePermissions()
    {
        $permissions = Permission::where('is_active', true)
            ->orderBy('module')
            ->orderBy('action')
            ->orderBy('resource')
            ->get()
            ->groupBy('module');

        return response()->json($permissions);
    }

    /**
     * 承認関連権限のみを取得
     */
    public function approvalPermissions()
    {
        $permissions = Permission::where('is_active', true)
            ->where(function ($query) {
                $query->where('module', 'approval')
                      ->orWhere('module', 'estimate')
                      ->where('action', 'approval');
            })
            ->orderBy('module')
            ->orderBy('action')
            ->orderBy('resource')
            ->get();

        return response()->json($permissions);
    }

    /**
     * システム権限レベルの権限設定状況を取得
     */
    public function permissionStatus()
    {
        $systemLevels = SystemLevel::with(['permissions' => function ($query) {
            $query->where('is_active', true);
        }])
        ->orderBy('priority')
        ->get();

        $approvalPermissions = Permission::where('is_active', true)
            ->where(function ($query) {
                $query->where('module', 'approval')
                      ->orWhere('module', 'estimate')
                      ->where('action', 'approval');
            })
            ->get();

        $status = [];
        foreach ($systemLevels as $level) {
            $levelPermissions = $level->permissions->pluck('id')->toArray();
            $status[$level->code] = [
                'level_name' => $level->name,
                'priority' => $level->priority,
                'permissions' => $approvalPermissions->map(function ($permission) use ($levelPermissions) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'display_name' => $permission->display_name,
                        'module' => $permission->module,
                        'action' => $permission->action,
                        'resource' => $permission->resource,
                        'is_granted' => in_array($permission->id, $levelPermissions),
                    ];
                })
            ];
        }

        return response()->json($status);
    }
}
