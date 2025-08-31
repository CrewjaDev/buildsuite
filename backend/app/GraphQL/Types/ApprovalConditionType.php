<?php

namespace App\GraphQL\Types;

use App\Models\ApprovalCondition;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class ApprovalConditionType extends GraphQLType
{
    protected $attributes = [
        'name' => 'ApprovalCondition',
        'description' => '承認条件情報',
        'model' => ApprovalCondition::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認条件ID',
            ],
            'approval_flow_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認フローID',
            ],
            'condition_type' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '条件タイプ',
            ],
            'field_name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'フィールド名',
            ],
            'operator' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '演算子',
            ],
            'value' => [
                'type' => Type::string(),
                'description' => '値（JSON）',
                'resolve' => function ($root) {
                    return json_encode($root->value);
                },
            ],
            'value_type' => [
                'type' => Type::string(),
                'description' => '値のタイプ',
            ],
            'is_active' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'アクティブ状態',
            ],
            'priority' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '優先度',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => '説明',
            ],
            'flow' => [
                'type' => \GraphQL::type('ApprovalFlow'),
                'description' => '承認フロー',
            ],
            'creator' => [
                'type' => \GraphQL::type('User'),
                'description' => '作成者',
            ],
            'updater' => [
                'type' => \GraphQL::type('User'),
                'description' => '更新者',
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
