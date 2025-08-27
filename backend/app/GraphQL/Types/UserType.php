<?php

namespace App\GraphQL\Types;

use App\Models\User;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class UserType extends GraphQLType
{
    protected $attributes = [
        'name' => 'User',
        'description' => 'ユーザー情報',
        'model' => User::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ユーザーID',
            ],
            'employee_id' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '社員番号',
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '氏名',
            ],
            'name_kana' => [
                'type' => Type::string(),
                'description' => '氏名（カナ）',
            ],
            'email' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'メールアドレス',
            ],
            'birth_date' => [
                'type' => Type::string(),
                'description' => '生年月日',
            ],
            'gender' => [
                'type' => Type::string(),
                'description' => '性別',
            ],
            'phone' => [
                'type' => Type::string(),
                'description' => '電話番号',
            ],
            'mobile_phone' => [
                'type' => Type::string(),
                'description' => '携帯電話番号',
            ],
            'postal_code' => [
                'type' => Type::string(),
                'description' => '郵便番号',
            ],
            'prefecture' => [
                'type' => Type::string(),
                'description' => '都道府県',
            ],
            'address' => [
                'type' => Type::string(),
                'description' => '住所',
            ],
            'position' => [
                'type' => Type::string(),
                'description' => '職位',
            ],
            'job_title' => [
                'type' => Type::string(),
                'description' => '役職名',
            ],
            'hire_date' => [
                'type' => Type::string(),
                'description' => '入社日',
            ],
            'service_years' => [
                'type' => Type::int(),
                'description' => '勤続年数',
            ],
            'service_months' => [
                'type' => Type::int(),
                'description' => '勤続月数',
            ],
            'system_level' => [
                'type' => Type::string(),
                'description' => 'システム権限レベル',
            ],
            'is_active' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'アクティブ状態',
            ],
            'is_admin' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => '管理者フラグ',
            ],
            'last_login_at' => [
                'type' => Type::string(),
                'description' => '最終ログイン日時',
            ],
            'is_locked' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'ロック状態',
                'resolve' => function ($root) {
                    return $root->isLocked();
                },
            ],
            'is_password_expired' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'パスワード期限切れ',
                'resolve' => function ($root) {
                    return $root->isPasswordExpired();
                },
            ],
            'system_level_info' => [
                'type' => \GraphQL::type('SystemLevel'),
                'description' => 'システム権限レベル情報',
            ],
            'roles' => [
                'type' => Type::listOf(\GraphQL::type('Role')),
                'description' => '役割一覧',
            ],
            'departments' => [
                'type' => Type::listOf(\GraphQL::type('Department')),
                'description' => '部署一覧',
            ],
            'permissions' => [
                'type' => Type::listOf(\GraphQL::type('Permission')),
                'description' => '権限一覧',
                'resolve' => function ($root) {
                    $permissions = collect();

                    // システム管理者は全ての権限を持つ
                    if ($root->is_admin) {
                        $permissions = \App\Models\Permission::where('is_active', true)->get();
                    } else {
                        // システム権限レベルによる権限
                        if ($root->systemLevel) {
                            $permissions = $permissions->merge($root->systemLevel->activePermissions);
                        }

                        // 役割による権限
                        $rolePermissions = $root->activeRoles()
                            ->with('permissions')
                            ->get()
                            ->flatMap(function ($role) {
                                return $role->activePermissions;
                            });
                        $permissions = $permissions->merge($rolePermissions);

                        // 部署による権限
                        $departmentPermissions = $root->activeDepartments()
                            ->with('permissions')
                            ->get()
                            ->flatMap(function ($department) {
                                return $department->activePermissions;
                            });
                        $permissions = $permissions->merge($departmentPermissions);

                        // 重複を除去
                        $permissions = $permissions->unique('id');
                    }

                    return $permissions;
                },
            ],
            'created_at' => [
                'type' => Type::string(),
                'description' => '作成日時',
            ],
            'updated_at' => [
                'type' => Type::string(),
                'description' => '更新日時',
            ],
        ];
    }
}
