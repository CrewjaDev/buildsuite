<?php

namespace App\GraphQL\Types;

use App\Models\ApprovalFlow;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class ApprovalFlowType extends GraphQLType
{
    protected $attributes = [
        'name' => 'ApprovalFlow',
        'description' => '承認フロー情報',
        'model' => ApprovalFlow::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認フローID',
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '承認フロー名',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => '説明',
            ],
            'flow_type' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'フロータイプ',
            ],
            'is_active' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'アクティブ状態',
            ],
            'is_system' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'システムフロー',
            ],
            'priority' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '優先度',
            ],
            'steps' => [
                'type' => Type::listOf(\GraphQL::type('ApprovalStep')),
                'description' => '承認ステップ一覧',
            ],
            'conditions' => [
                'type' => Type::listOf(\GraphQL::type('ApprovalCondition')),
                'description' => '承認条件一覧',
            ],
            'requests' => [
                'type' => Type::listOf(\GraphQL::type('ApprovalRequest')),
                'description' => '承認依頼一覧',
            ],
            'creator' => [
                'type' => \GraphQL::type('User'),
                'description' => '作成者',
            ],
            'updater' => [
                'type' => \GraphQL::type('User'),
                'description' => '更新者',
            ],
            'step_count' => [
                'type' => Type::int(),
                'description' => 'ステップ数',
                'resolve' => function ($root) {
                    return $root->getStepCount();
                },
            ],
            'is_usable' => [
                'type' => Type::boolean(),
                'description' => '使用可能か',
                'resolve' => function ($root) {
                    return $root->isUsable();
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
