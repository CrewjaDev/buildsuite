<?php

namespace App\Services;

use App\Models\User;
use App\Models\Permission;

class PermissionService
{
    /**
     * ユーザーが指定されたビジネスコードの機能を利用できるかチェック
     * 
     * @param User $user
     * @param string $businessCode
     * @return bool
     */
    public static function canUseBusinessCode(User $user, string $businessCode): bool
    {
        $permissionName = $businessCode . '.use';
        
        return self::hasPermission($user, $permissionName);
    }

    /**
     * ユーザーが指定された権限を持っているかチェック
     * 5階層の権限管理システムに対応
     * 
     * @param User $user
     * @param string $permissionName
     * @return bool
     */
    public static function hasPermission(User $user, string $permissionName): bool
    {
        // 1. システム管理者は全権限を持つ
        if ($user->is_admin) { 
            return true;
        }

        // 2. システム権限レベルでの権限チェック
        if ($user->systemLevel && $user->systemLevel->permissions->contains('name', $permissionName)) {
            return true;
        }

        // 3. 役割での権限チェック
        foreach ($user->roles as $role) {
            if ($role->permissions->contains('name', $permissionName)) {
                return true;
            }
        }

        // 4. 部署での権限チェック
        foreach ($user->departments as $department) {
            if ($department->permissions->contains('name', $permissionName)) {
                return true;
            }
        }

        // 5. 職位での権限チェック
        if ($user->position && $user->position->permissions->contains('name', $permissionName)) {
            return true;
        }

        // 6. 個別ユーザー権限でのチェック
        if ($user->permissions->contains('name', $permissionName)) {
            return true;
        }

        return false;
    }

    /**
     * ユーザーが利用可能なビジネスコード一覧を取得
     * 
     * @param User $user
     * @return array
     */
    public static function getAvailableBusinessCodes(User $user): array
    {
        $allBusinessCodes = BusinessCodeService::getAllBusinessCodes();
        $availableCodes = [];

        foreach ($allBusinessCodes as $code => $config) {
            if (self::canUseBusinessCode($user, $code)) {
                $availableCodes[$code] = $config;
            }
        }

        return $availableCodes;
    }

    /**
     * ユーザーが利用可能なシステム機能一覧を取得
     * 
     * @param User $user
     * @return array
     */
    public static function getAvailableSystemFeatures(User $user): array
    {
        $systemFeatures = [
            'employee' => [
                'name' => '社員管理',
                'route' => '/employees',
                'icon' => 'UserCheck'
            ],
            'partner' => [
                'name' => '取引先管理',
                'route' => '/partners',
                'icon' => 'Building2'
            ],
            'approval' => [
                'name' => '承認管理',
                'route' => '/approvals',
                'icon' => 'CheckCircle'
            ],
            'permission' => [
                'name' => '権限管理',
                'route' => '/permissions',
                'icon' => 'Shield'
            ],
            'role' => [
                'name' => '役割管理',
                'route' => '/roles',
                'icon' => 'UserCog'
            ],
            'department' => [
                'name' => '部署管理',
                'route' => '/departments',
                'icon' => 'Building'
            ],
            'system' => [
                'name' => 'システム管理',
                'route' => '/system',
                'icon' => 'Settings'
            ]
        ];

        $availableFeatures = [];
        foreach ($systemFeatures as $code => $feature) {
            if (self::canUseBusinessCode($user, $code)) {
                $availableFeatures[$code] = $feature;
            }
        }

        return $availableFeatures;
    }

    /**
     * ユーザーの統合権限リストを取得
     * 単一クエリで効率的に取得
     * 
     * @param User $user
     * @return array
     */
    public static function getUserEffectivePermissions(User $user): array
    {
        // システム管理者は全権限
        if ($user->is_admin) { 
            return ['*']; // 全権限を示す特別な値
        }
        
        // 単一クエリで全権限を取得
        $permissions = \DB::table('permissions')
            ->select('permissions.name')
            ->where('permissions.is_active', true)
            ->where(function ($query) use ($user) {
                $query
                    // 1. システム権限レベル
                    ->orWhereExists(function ($subQuery) use ($user) {
                        $subQuery->select(\DB::raw(1))
                            ->from('system_level_permissions')
                            ->join('user_system_levels', 'system_level_permissions.system_level_id', '=', 'user_system_levels.system_level_id')
                            ->whereColumn('system_level_permissions.permission_id', 'permissions.id')
                            ->where('user_system_levels.user_id', $user->id)
                            ->where('user_system_levels.is_active', true);
                    })
                    // 2. 役割
                    ->orWhereExists(function ($subQuery) use ($user) {
                        $subQuery->select(\DB::raw(1))
                            ->from('role_permissions')
                            ->join('user_roles', 'role_permissions.role_id', '=', 'user_roles.role_id')
                            ->whereColumn('role_permissions.permission_id', 'permissions.id')
                            ->where('user_roles.user_id', $user->id)
                            ->where('user_roles.is_active', true);
                    })
                    // 3. 部署
                    ->orWhereExists(function ($subQuery) use ($user) {
                        $subQuery->select(\DB::raw(1))
                            ->from('department_permissions')
                            ->join('user_departments', 'department_permissions.department_id', '=', 'user_departments.department_id')
                            ->whereColumn('department_permissions.permission_id', 'permissions.id')
                            ->where('user_departments.user_id', $user->id)
                            ->where('user_departments.is_active', true);
                    })
                    // 4. 職位
                    ->orWhereExists(function ($subQuery) use ($user) {
                        $subQuery->select(\DB::raw(1))
                            ->from('position_permissions')
                            ->join('employees', 'position_permissions.position_id', '=', 'employees.position_id')
                            ->whereColumn('position_permissions.permission_id', 'permissions.id')
                            ->where('employees.id', $user->employee_id);
                    })
                    // 5. 個別ユーザー権限
                    ->orWhereExists(function ($subQuery) use ($user) {
                        $subQuery->select(\DB::raw(1))
                            ->from('user_permissions')
                            ->whereColumn('user_permissions.permission_id', 'permissions.id')
                            ->where('user_permissions.user_id', $user->id)
                            ->where('user_permissions.is_active', true);
                    });
            })
            ->pluck('name')
            ->toArray();
        
        return array_unique($permissions);
    }

    /**
     * ユーザーが利用可能なビジネス機能一覧を取得
     * 
     * @param User $user
     * @return array
     */
    public static function getAvailableBusinessFeatures(User $user): array
    {
        $businessFeatures = [
            'estimate' => [
                'name' => '見積管理',
                'route' => '/estimates',
                'icon' => 'FileText'
            ],
            'budget' => [
                'name' => '予算管理',
                'route' => '/budgets',
                'icon' => 'Calculator'
            ],
            'purchase' => [
                'name' => '発注管理',
                'route' => '/purchases',
                'icon' => 'ShoppingCart'
            ],
            'construction' => [
                'name' => '工事管理',
                'route' => '/constructions',
                'icon' => 'Hammer'
            ],
            'general' => [
                'name' => '一般業務',
                'route' => '/general',
                'icon' => 'Briefcase'
            ]
        ];

        $availableFeatures = [];
        foreach ($businessFeatures as $code => $feature) {
            if (self::canUseBusinessCode($user, $code)) {
                $availableFeatures[$code] = $feature;
            }
        }

        return $availableFeatures;
    }

    /**
     * ユーザーがビジネスコードのいずれかの権限を持っているかチェック
     * 
     * @param User $user
     * @param string $businessCode
     * @param array $permissionNames 権限名の配列（例: ['use', 'list', 'create']）
     * @return bool
     */
    public static function hasAnyBusinessCodePermission(User $user, string $businessCode, array $permissionNames): bool
    {
        foreach ($permissionNames as $permissionName) {
            $fullPermissionName = $businessCode . '.' . $permissionName;
            if (self::hasPermission($user, $fullPermissionName)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * ユーザーが指定された権限のいずれかを持っているかチェック
     * 完全な権限名の配列を受け取る
     * 
     * @param User $user
     * @param array $permissionNames 完全な権限名の配列（例: ['estimate.use', 'estimate.create']）
     * @return bool
     */
    public static function hasAnyPermission(User $user, array $permissionNames): bool
    {
        foreach ($permissionNames as $permissionName) {
            if (self::hasPermission($user, $permissionName)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * ユーザーが指定された権限をすべて持っているかチェック
     * 
     * @param User $user
     * @param array $permissionNames 完全な権限名の配列
     * @return bool
     */
    public static function hasAllPermissions(User $user, array $permissionNames): bool
    {
        foreach ($permissionNames as $permissionName) {
            if (!self::hasPermission($user, $permissionName)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * メニュー表示用の権限チェック
     * ビジネスコードとアクションの組み合わせで判定
     * 
     * @param User $user
     * @param string $businessCode
     * @param string $action アクション（例: 'use', 'create', 'approval.request'）
     * @return bool
     */
    public static function canAccessMenu(User $user, string $businessCode, string $action): bool
    {
        $fullPermissionName = $businessCode . '.' . $action;
        return self::hasPermission($user, $fullPermissionName);
    }

    /**
     * ページ要素表示用の権限チェック
     * 複数の権限のいずれかを持っているかで判定
     * 
     * @param User $user
     * @param array $requiredPermissions 必要な権限の配列
     * @return bool
     */
    public static function canShowElement(User $user, array $requiredPermissions): bool
    {
        return self::hasAnyPermission($user, $requiredPermissions);
    }
}
