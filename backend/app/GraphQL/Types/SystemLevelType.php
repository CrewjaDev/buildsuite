<?php

namespace App\GraphQL\Types;

use App\Models\SystemLevel;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class SystemLevelType extends GraphQLType
{
    protected $attributes = [
        'name' => 'SystemLevel',
        'description' => 'システム権限レベル情報',
        'model' => SystemLevel::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'システムレベルID',
            ],
            'code' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'システムレベルコード',
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'システムレベル名',
            ],
            'display_name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '表示名',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => '説明',
            ],
            'priority' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '優先度',
            ],
            'is_system' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'システムレベルフラグ',
            ],
            'is_active' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'アクティブ状態',
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
