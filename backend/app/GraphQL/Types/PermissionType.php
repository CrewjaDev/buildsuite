<?php

namespace App\GraphQL\Types;

use App\Models\Permission;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class PermissionType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Permission',
        'description' => '権限情報',
        'model' => Permission::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '権限ID',
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '権限名',
            ],
            'display_name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '表示名',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => '説明',
            ],
            'module' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'モジュール名',
            ],
            'action' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'アクション名',
            ],
            'resource' => [
                'type' => Type::string(),
                'description' => 'リソース名',
            ],
            'is_system' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'システム権限フラグ',
            ],
            'is_active' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'アクティブ状態',
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
