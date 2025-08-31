<?php

namespace App\GraphQL\Types;

use App\Models\Department;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class DepartmentType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Department',
        'description' => '部署情報',
        'model' => Department::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '部署ID',
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '部署名',
            ],
            'code' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '部署コード',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => '説明',
            ],
            'parent_id' => [
                'type' => Type::int(),
                'description' => '親部署ID',
            ],
            'level' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '階層レベル',
            ],
            'path' => [
                'type' => Type::string(),
                'description' => '階層パス',
            ],
            'sort_order' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ソート順',
            ],
            'manager_id' => [
                'type' => Type::int(),
                'description' => '管理者ID',
            ],
            'is_active' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'アクティブ状態',
            ],
            'parent' => [
                'type' => \GraphQL::type('Department'),
                'description' => '親部署',
            ],
            'children' => [
                'type' => Type::listOf(\GraphQL::type('Department')),
                'description' => '子部署',
            ],
            'manager' => [
                'type' => \GraphQL::type('User'),
                'description' => '管理者',
            ],
            'permissions' => [
                'type' => Type::listOf(\GraphQL::type('Permission')),
                'description' => '権限一覧',
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
