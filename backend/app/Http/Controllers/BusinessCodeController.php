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
use App\Models\User;

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

    /**
     * ビジネスコード別の権限照会
     */
    public function getBusinessCodePermissionStatus(string $entityType, int $entityId, string $businessCode): JsonResponse
    {
        try {
            // ビジネスコードの存在確認
            $businessCodeInfo = BusinessCodeService::getBusinessCodeInfo($businessCode);
            if (!$businessCodeInfo) {
                return response()->json([
                    'success' => false,
                    'message' => '指定されたビジネスコードが見つかりません'
                ], 404);
            }

            // ビジネスコードに紐づく権限一覧を取得
            $businessCodePermissions = BusinessCodeService::getDefaultPermissions($businessCode);
            
            // エンティティに付与されている権限を取得
            $assignedPermissions = $this->getEntityPermissions($entityType, $entityId);
            
            // ビジネスコード権限と付与状況をマッピング
            $permissionStatus = [];
            foreach ($businessCodePermissions as $permissionName) {
                $permission = Permission::where('name', $permissionName)->first();
                if ($permission) {
                    $isAssigned = $assignedPermissions->contains('id', $permission->id);
                    $assignedPermission = $assignedPermissions->where('id', $permission->id)->first();
                    
                    $permissionStatus[] = [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'display_name' => $permission->display_name,
                        'description' => $permission->description,
                        'module' => $permission->module,
                        'action' => $permission->action,
                        'category' => $permission->category,
                        'subcategory' => $permission->subcategory,
                        'is_assigned' => $isAssigned,
                        'assigned_at' => $assignedPermission?->pivot?->granted_at ?? null,
                        'granted_by' => $assignedPermission?->pivot?->granted_by ?? null
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'business_code' => $businessCode,
                    'business_code_info' => $businessCodeInfo,
                    'permission_status' => $permissionStatus
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限照会に失敗しました',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * ビジネスコードベースの権限一括設定
     */
    public function setBusinessCodePermissions(string $entityType, int $entityId, string $businessCode, Request $request): JsonResponse
    {
        try {
            // ビジネスコードの存在確認
            $businessCodeInfo = BusinessCodeService::getBusinessCodeInfo($businessCode);
            if (!$businessCodeInfo) {
                return response()->json([
                    'success' => false,
                    'message' => '指定されたビジネスコードが見つかりません'
                ], 404);
            }

            // リクエストデータの検証
            $request->validate([
                'permission_overrides' => 'array',
                'permission_overrides.*.permission_id' => 'required|integer|exists:permissions,id',
                'permission_overrides.*.is_enabled' => 'required|boolean'
            ]);

            $permissionOverrides = $request->input('permission_overrides', []);
            
            // ビジネスコードに紐づく権限一覧を取得
            $businessCodePermissions = BusinessCodeService::getDefaultPermissions($businessCode);
            
            // エンティティに付与されている権限を取得
            $assignedPermissions = $this->getEntityPermissions($entityType, $entityId);
            
            // 権限の追加・削除を決定
            $permissionsToAdd = [];
            $permissionsToRemove = [];
            
            foreach ($businessCodePermissions as $permissionName) {
                $permission = Permission::where('name', $permissionName)->first();
                if (!$permission) continue;
                
                // オーバーライド設定を確認
                $override = collect($permissionOverrides)->firstWhere('permission_id', $permission->id);
                $shouldBeAssigned = $override ? $override['is_enabled'] : true; // デフォルトは有効
                
                $isCurrentlyAssigned = $assignedPermissions->contains('id', $permission->id);
                
                if ($shouldBeAssigned && !$isCurrentlyAssigned) {
                    $permissionsToAdd[] = $permission->id;
                } elseif (!$shouldBeAssigned && $isCurrentlyAssigned) {
                    $permissionsToRemove[] = $permission->id;
                }
            }
            
            // 権限の追加
            if (!empty($permissionsToAdd)) {
                $this->addEntityPermissions($entityType, $entityId, $permissionsToAdd);
            }
            
            // 権限の削除
            if (!empty($permissionsToRemove)) {
                $this->removeEntityPermissions($entityType, $entityId, $permissionsToRemove);
            }
            
            return response()->json([
                'success' => true,
                'message' => '権限が正常に設定されました',
                'data' => [
                    'business_code' => $businessCode,
                    'permissions_added' => count($permissionsToAdd),
                    'permissions_removed' => count($permissionsToRemove)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '権限設定に失敗しました',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * エンティティの権限を取得
     */
    private function getEntityPermissions(string $entityType, int $entityId)
    {
        switch ($entityType) {
            case 'system_level':
                $entity = SystemLevel::with('permissions')->find($entityId);
                return $entity ? $entity->permissions : collect();
            case 'role':
                $entity = Role::with('permissions')->find($entityId);
                return $entity ? $entity->permissions : collect();
            case 'department':
                $entity = Department::with('permissions')->find($entityId);
                return $entity ? $entity->permissions : collect();
            case 'position':
                $entity = Position::with('permissions')->find($entityId);
                return $entity ? $entity->permissions : collect();
            case 'user':
                $entity = User::with('permissions')->find($entityId);
                return $entity ? $entity->permissions : collect();
            default:
                return collect();
        }
    }

    /**
     * エンティティに権限を追加
     */
    private function addEntityPermissions(string $entityType, int $entityId, array $permissionIds): void
    {
        switch ($entityType) {
            case 'system_level':
                $entity = SystemLevel::find($entityId);
                if ($entity) {
                    $entity->permissions()->syncWithoutDetaching($permissionIds);
                }
                break;
            case 'role':
                $entity = Role::find($entityId);
                if ($entity) {
                    $entity->permissions()->syncWithoutDetaching($permissionIds);
                }
                break;
            case 'department':
                $entity = Department::find($entityId);
                if ($entity) {
                    $entity->permissions()->syncWithoutDetaching($permissionIds);
                }
                break;
            case 'position':
                $entity = Position::find($entityId);
                if ($entity) {
                    $entity->permissions()->syncWithoutDetaching($permissionIds);
                }
                break;
            case 'user':
                $entity = User::find($entityId);
                if ($entity) {
                    $entity->permissions()->syncWithoutDetaching($permissionIds);
                }
                break;
        }
    }

    /**
     * エンティティから権限を削除
     */
    private function removeEntityPermissions(string $entityType, int $entityId, array $permissionIds): void
    {
        switch ($entityType) {
            case 'system_level':
                $entity = SystemLevel::find($entityId);
                if ($entity) {
                    $entity->permissions()->detach($permissionIds);
                }
                break;
            case 'role':
                $entity = Role::find($entityId);
                if ($entity) {
                    $entity->permissions()->detach($permissionIds);
                }
                break;
            case 'department':
                $entity = Department::find($entityId);
                if ($entity) {
                    $entity->permissions()->detach($permissionIds);
                }
                break;
            case 'position':
                $entity = Position::find($entityId);
                if ($entity) {
                    $entity->permissions()->detach($permissionIds);
                }
                break;
            case 'user':
                $entity = User::find($entityId);
                if ($entity) {
                    $entity->permissions()->detach($permissionIds);
                }
                break;
        }
    }

    /**
     * カテゴリ別の権限を取得
     */
    public function getPermissionsByCategory(string $businessCode, string $category): JsonResponse
    {
        try {
            // ビジネスコードの存在確認
            $businessCodeInfo = BusinessCodeService::getBusinessCodeInfo($businessCode);
            if (!$businessCodeInfo) {
                return response()->json([
                    'success' => false,
                    'message' => '指定されたビジネスコードが見つかりません'
                ], 404);
            }

            // ビジネスコードに紐づく権限一覧を取得
            $businessCodePermissions = BusinessCodeService::getDefaultPermissions($businessCode);
            
            // 指定されたカテゴリの権限をフィルタリング
            $permissions = Permission::whereIn('name', $businessCodePermissions)
                ->where('category', $category)
                ->where('is_active', true)
                ->get();
            
            $permissionList = $permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'category' => $permission->category,
                    'subcategory' => $permission->subcategory
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'business_code' => $businessCode,
                    'category' => $category,
                    'permissions' => $permissionList
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'カテゴリ別権限の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
