<?php

namespace App\GraphQL\Queries;

use App\Models\User;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;
use Rebing\GraphQL\Support\SelectFields;

class UserPermissionsQuery extends Query
{
    protected $attributes = [
        'name' => 'userPermissions',
        'description' => 'ユーザーの権限情報を詳細に取得（承認フロー用）',
    ];

    public function type(): Type
    {
        return \GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'user_id' => [
                'name' => 'user_id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'ユーザーID',
            ],
            'include_approval_permissions' => [
                'name' => 'include_approval_permissions',
                'type' => Type::boolean(),
                'description' => '承認権限を含める',
                'defaultValue' => true,
            ],
            'include_department_hierarchy' => [
                'name' => 'include_department_hierarchy',
                'type' => Type::boolean(),
                'description' => '部署階層を含める',
                'defaultValue' => true,
            ],
        ];
    }

    public function resolve($root, $args, SelectFields $fields, $context)
    {
        $user = User::with([
            'systemLevel',
            'roles.permissions',
            'departments.permissions',
            'departments.parent',
            'departments.children',
        ])->find($args['user_id']);

        if (!$user) {
            throw new \Exception('ユーザーが見つかりません');
        }

        // 承認フロー用の権限情報を追加
        if ($args['include_approval_permissions'] ?? true) {
            $user->approval_permissions = $this->getApprovalPermissions($user);
        }

        // 部署階層情報を追加
        if ($args['include_department_hierarchy'] ?? true) {
            $user->department_hierarchy = $this->getDepartmentHierarchy($user);
        }

        return $user;
    }

    /**
     * 承認フロー用の権限を取得
     */
    private function getApprovalPermissions(User $user): array
    {
        $permissions = [];

        // システム管理者は全ての承認権限を持つ
        if ($user->is_admin) {
            $permissions = [
                'can_approve_all' => true,
                'can_reject_all' => true,
                'can_return_all' => true,
                'approval_limit' => null, // 制限なし
                'approval_conditions' => [],
            ];
        } else {
            // システム権限レベルによる承認権限
            $systemPermissions = $user->systemLevel ? $user->systemLevel->activePermissions : collect();
            $systemApprovalPermissions = $systemPermissions->where('module', 'approval');

            // 役割による承認権限
            $rolePermissions = $user->activeRoles()
                ->with('permissions')
                ->get()
                ->flatMap(function ($role) {
                    return $role->activePermissions;
                });
            $roleApprovalPermissions = $rolePermissions->where('module', 'approval');

            // 部署による承認権限
            $departmentPermissions = $user->activeDepartments()
                ->with('permissions')
                ->get()
                ->flatMap(function ($department) {
                    return $department->activePermissions;
                });
            $departmentApprovalPermissions = $departmentPermissions->where('module', 'approval');

            // 承認権限を統合
            $allApprovalPermissions = $systemApprovalPermissions
                ->merge($roleApprovalPermissions)
                ->merge($departmentApprovalPermissions)
                ->unique('id');

            $permissions = [
                'can_approve_all' => $allApprovalPermissions->where('action', 'approve')->isNotEmpty(),
                'can_reject_all' => $allApprovalPermissions->where('action', 'reject')->isNotEmpty(),
                'can_return_all' => $allApprovalPermissions->where('action', 'return')->isNotEmpty(),
                'approval_limit' => $this->getApprovalLimit($user),
                'approval_conditions' => $this->getApprovalConditions($user),
                'permissions' => $allApprovalPermissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'display_name' => $permission->display_name,
                        'action' => $permission->action,
                        'resource' => $permission->resource,
                    ];
                })->values(),
            ];
        }

        return $permissions;
    }

    /**
     * 部署階層情報を取得
     */
    private function getDepartmentHierarchy(User $user): array
    {
        $hierarchy = [];

        foreach ($user->activeDepartments as $department) {
            $departmentInfo = [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'level' => $department->level,
                'position' => $department->pivot->position,
                'is_primary' => $department->pivot->is_primary,
                'parent' => null,
                'children' => [],
                'ancestors' => [],
                'descendants' => [],
            ];

            // 親部署情報
            if ($department->parent) {
                $departmentInfo['parent'] = [
                    'id' => $department->parent->id,
                    'name' => $department->parent->name,
                    'code' => $department->parent->code,
                ];
            }

            // 子部署情報
            $departmentInfo['children'] = $department->children->map(function ($child) {
                return [
                    'id' => $child->id,
                    'name' => $child->name,
                    'code' => $child->code,
                    'level' => $child->level,
                ];
            });

            // 祖先部署情報
            $ancestors = collect();
            $current = $department->parent;
            while ($current) {
                $ancestors->push([
                    'id' => $current->id,
                    'name' => $current->name,
                    'code' => $current->code,
                    'level' => $current->level,
                ]);
                $current = $current->parent;
            }
            $departmentInfo['ancestors'] = $ancestors;

            // 子孫部署情報（再帰的に取得）
            $descendants = $this->getDescendants($department);
            $departmentInfo['descendants'] = $descendants;

            $hierarchy[] = $departmentInfo;
        }

        return $hierarchy;
    }

    /**
     * 子孫部署を再帰的に取得
     */
    private function getDescendants($department): array
    {
        $descendants = [];

        foreach ($department->children as $child) {
            $descendants[] = [
                'id' => $child->id,
                'name' => $child->name,
                'code' => $child->code,
                'level' => $child->level,
            ];

            $childDescendants = $this->getDescendants($child);
            $descendants = array_merge($descendants, $childDescendants);
        }

        return $descendants;
    }

    /**
     * 承認上限を取得
     */
    private function getApprovalLimit(User $user): ?int
    {
        // システム権限レベルによる承認上限
        if ($user->systemLevel) {
            switch ($user->system_level) {
                case 'system_admin':
                    return null; // 制限なし
                case 'executive':
                    return 10000000; // 1000万円
                case 'accounting_manager':
                    return 5000000; // 500万円
                case 'office_manager':
                    return 2000000; // 200万円
                case 'construction_manager':
                    return 1000000; // 100万円
                case 'supervisor':
                    return 500000; // 50万円
                default:
                    return 100000; // 10万円
            }
        }

        return 100000; // デフォルト
    }

    /**
     * 承認条件を取得
     */
    private function getApprovalConditions(User $user): array
    {
        $conditions = [];

        // 部署による条件
        foreach ($user->activeDepartments as $department) {
            $conditions[] = [
                'type' => 'department',
                'department_id' => $department->id,
                'department_name' => $department->name,
                'position' => $department->pivot->position,
            ];
        }

        // 役割による条件
        foreach ($user->activeRoles as $role) {
            $conditions[] = [
                'type' => 'role',
                'role_id' => $role->id,
                'role_name' => $role->name,
                'priority' => $role->priority,
            ];
        }

        return $conditions;
    }
}
