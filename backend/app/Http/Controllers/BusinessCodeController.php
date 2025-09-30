<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\BusinessCodeService;
use App\Models\Permission;
use App\Models\SystemLevel;
use App\Models\Role;
use App\Models\Department;
use App\Models\Position;

class BusinessCodeController extends Controller
{
    /**
     * ビジネスコード一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $category = $request->get('category', 'all');
            $businessCodes = BusinessCodeService::getAllBusinessCodes();
            
            if ($category !== 'all') {
                $businessCodes = BusinessCodeService::getBusinessCodesByCategory($category);
            }
            
            // 各ビジネスコードの権限付与状況を取得
            $result = [];
            foreach ($businessCodes as $code => $config) {
                $result[] = [
                    'code' => $code,
                    'name' => $config['name'],
                    'description' => $config['description'],
                    'category' => $config['category'],
                    'is_system' => $config['is_system'],
                    'is_core' => $config['is_core'],
                    'permissions_count' => count($config['default_permissions']),
                    'assigned_levels' => $this->getAssignedLevels($code),
                    'assigned_roles' => $this->getAssignedRoles($code),
                    'assigned_departments' => $this->getAssignedDepartments($code),
                    'assigned_positions' => $this->getAssignedPositions($code),
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'business_codes' => $result,
                    'total_count' => count($result)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ビジネスコード一覧の取得に失敗しました',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * ビジネスコード詳細を取得
     */
    public function show(string $code): JsonResponse
    {
        try {
            $businessCode = BusinessCodeService::getBusinessCodeInfo($code);
            if (!$businessCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'ビジネスコードが見つかりません'
                ], 404);
            }
            
            $permissions = BusinessCodeService::getDefaultPermissions($code);
            $settings = BusinessCodeService::getSettings($code);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'business_code' => [
                        'code' => $code,
                        'name' => $businessCode['name'],
                        'description' => $businessCode['description'],
                        'category' => $businessCode['category'],
                        'is_system' => $businessCode['is_system'],
                        'is_core' => $businessCode['is_core'],
                        'settings' => $settings,
                    ],
                    'permissions' => $permissions,
                    'assignment_status' => $this->getDetailedAssignmentStatus($code),
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ビジネスコード詳細の取得に失敗しました',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * ビジネスコードの権限一覧を取得
     */
    public function getPermissions(string $code): JsonResponse
    {
        try {
            $permissionNames = BusinessCodeService::getDefaultPermissions($code);
            
            // 権限名からPermissionモデルを取得して詳細情報を含める
            $permissions = Permission::whereIn('name', $permissionNames)->get()->map(function ($permission) {
                return [
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'description' => $permission->description,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'permissions' => $permissions
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限一覧の取得に失敗しました',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * ビジネスコードの権限付与状況を取得
     */
    public function getAssignmentStatus(string $code): JsonResponse
    {
        try {
            $assignmentStatus = $this->getDetailedAssignmentStatus($code);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'assignment_status' => $assignmentStatus
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限付与状況の取得に失敗しました',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * システム権限レベルでの権限付与状況を取得
     */
    private function getAssignedLevels(string $code): array
    {
        $permissions = BusinessCodeService::getDefaultPermissions($code);
        $systemLevels = SystemLevel::with('permissions')->get();
        
        $assigned = [];
        foreach ($systemLevels as $level) {
            $hasPermissions = $level->permissions->whereIn('name', $permissions)->count() > 0;
            if ($hasPermissions) {
                $assigned[] = [
                    'id' => $level->id,
                    'name' => $level->name,
                    'display_name' => $level->display_name
                ];
            }
        }
        
        return $assigned;
    }

    /**
     * 役割での権限付与状況を取得
     */
    private function getAssignedRoles(string $code): array
    {
        $permissions = BusinessCodeService::getDefaultPermissions($code);
        $roles = Role::with('permissions')->get();
        
        $assigned = [];
        foreach ($roles as $role) {
            $hasPermissions = $role->permissions->whereIn('name', $permissions)->count() > 0;
            if ($hasPermissions) {
                $assigned[] = [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name
                ];
            }
        }
        
        return $assigned;
    }

    /**
     * 部署での権限付与状況を取得
     */
    private function getAssignedDepartments(string $code): array
    {
        $permissions = BusinessCodeService::getDefaultPermissions($code);
        $departments = Department::with('permissions')->get();
        
        $assigned = [];
        foreach ($departments as $department) {
            $hasPermissions = $department->permissions->whereIn('name', $permissions)->count() > 0;
            if ($hasPermissions) {
                $assigned[] = [
                    'id' => $department->id,
                    'name' => $department->name,
                    'display_name' => $department->name
                ];
            }
        }
        
        return $assigned;
    }

    /**
     * 職位での権限付与状況を取得
     */
    private function getAssignedPositions(string $code): array
    {
        $permissions = BusinessCodeService::getDefaultPermissions($code);
        $positions = Position::with('permissions')->get();
        
        $assigned = [];
        foreach ($positions as $position) {
            $hasPermissions = $position->permissions->whereIn('name', $permissions)->count() > 0;
            if ($hasPermissions) {
                $assigned[] = [
                    'id' => $position->id,
                    'name' => $position->name,
                    'display_name' => $position->display_name
                ];
            }
        }
        
        return $assigned;
    }

    /**
     * 権限付与状況の詳細を取得
     */
    private function getDetailedAssignmentStatus(string $code): array
    {
        return [
            'system_levels' => $this->getSystemLevelAssignmentStatus($code),
            'roles' => $this->getRoleAssignmentStatus($code),
            'departments' => $this->getDepartmentAssignmentStatus($code),
            'positions' => $this->getPositionAssignmentStatus($code),
        ];
    }

    /**
     * システム権限レベルの権限付与状況詳細
     */
    private function getSystemLevelAssignmentStatus(string $code): array
    {
        $permissions = BusinessCodeService::getDefaultPermissions($code);
        $systemLevels = SystemLevel::with('permissions')->get();
        
        $status = [];
        foreach ($systemLevels as $level) {
            $assignedPermissions = $level->permissions->whereIn('name', $permissions);
            $assignedCount = $assignedPermissions->count();
            
            // 権限付与件数が0より大きい場合のみ追加
            if ($assignedCount > 0) {
                $status[] = [
                    'id' => $level->id,
                    'name' => $level->name,
                    'display_name' => $level->display_name,
                    'has_permission' => true,
                    'assigned_permissions' => $assignedPermissions->pluck('name')->toArray(),
                    'assigned_count' => $assignedCount,
                    'total_count' => count($permissions)
                ];
            }
        }
        
        return $status;
    }

    /**
     * 役割の権限付与状況詳細
     */
    private function getRoleAssignmentStatus(string $code): array
    {
        $permissions = BusinessCodeService::getDefaultPermissions($code);
        $roles = Role::with('permissions')->get();
        
        $status = [];
        foreach ($roles as $role) {
            $assignedPermissions = $role->permissions->whereIn('name', $permissions);
            $assignedCount = $assignedPermissions->count();
            
            // 権限付与件数が0より大きい場合のみ追加
            if ($assignedCount > 0) {
                $status[] = [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'has_permission' => true,
                    'assigned_permissions' => $assignedPermissions->pluck('name')->toArray(),
                    'assigned_count' => $assignedCount,
                    'total_count' => count($permissions)
                ];
            }
        }
        
        return $status;
    }

    /**
     * 部署の権限付与状況詳細
     */
    private function getDepartmentAssignmentStatus(string $code): array
    {
        $permissions = BusinessCodeService::getDefaultPermissions($code);
        $departments = Department::with('permissions')->get();
        
        $status = [];
        foreach ($departments as $department) {
            $assignedPermissions = $department->permissions->whereIn('name', $permissions);
            $assignedCount = $assignedPermissions->count();
            
            // 権限付与件数が0より大きい場合のみ追加
            if ($assignedCount > 0) {
                $status[] = [
                    'id' => $department->id,
                    'name' => $department->name,
                    'display_name' => $department->name,
                    'has_permission' => true,
                    'assigned_permissions' => $assignedPermissions->pluck('name')->toArray(),
                    'assigned_count' => $assignedCount,
                    'total_count' => count($permissions)
                ];
            }
        }
        
        return $status;
    }

    /**
     * 職位の権限付与状況詳細
     */
    private function getPositionAssignmentStatus(string $code): array
    {
        $permissions = BusinessCodeService::getDefaultPermissions($code);
        $positions = Position::with('permissions')->get();
        
        $status = [];
        foreach ($positions as $position) {
            $assignedPermissions = $position->permissions->whereIn('name', $permissions);
            $assignedCount = $assignedPermissions->count();
            
            // 権限付与件数が0より大きい場合のみ追加
            if ($assignedCount > 0) {
                $status[] = [
                    'id' => $position->id,
                    'name' => $position->name,
                    'display_name' => $position->display_name,
                    'has_permission' => true,
                    'assigned_permissions' => $assignedPermissions->pluck('name')->toArray(),
                    'assigned_count' => $assignedCount,
                    'total_count' => count($permissions)
                ];
            }
        }
        
        return $status;
    }
}
