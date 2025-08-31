<?php

namespace App\GraphQL\Types;

use App\Models\ApprovalHistory;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class ApprovalHistoryType extends GraphQLType
{
    protected $attributes = [
        'name' => 'ApprovalHistory',
        'description' => '承認履歴情報',
        'model' => ApprovalHistory::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認履歴ID',
            ],
            'approval_request_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認依頼ID',
            ],
            'approval_step_id' => [
                'type' => Type::int(),
                'description' => '承認ステップID',
            ],
            'action' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'アクション',
            ],
            'acted_by' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '実行者ID',
            ],
            'acted_at' => [
                'type' => Type::string(),
                'description' => '実行日時',
            ],
            'comment' => [
                'type' => Type::string(),
                'description' => 'コメント',
            ],
            'delegated_to' => [
                'type' => Type::int(),
                'description' => '委譲先ID',
            ],
            'delegated_at' => [
                'type' => Type::string(),
                'description' => '委譲日時',
            ],
            'request' => [
                'type' => \GraphQL::type('ApprovalRequest'),
                'description' => '承認依頼',
            ],
            'step' => [
                'type' => \GraphQL::type('ApprovalStep'),
                'description' => '承認ステップ',
            ],
            'actor' => [
                'type' => \GraphQL::type('User'),
                'description' => '実行者',
            ],
            'delegate' => [
                'type' => \GraphQL::type('User'),
                'description' => '委譲先',
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
