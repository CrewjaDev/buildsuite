<?php

namespace App\GraphQL\Types;

use App\Models\ApprovalStep;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class ApprovalStepType extends GraphQLType
{
    protected $attributes = [
        'name' => 'ApprovalStep',
        'description' => '承認ステップ情報',
        'model' => ApprovalStep::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認ステップID',
            ],
            'approval_flow_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認フローID',
            ],
            'step_order' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ステップ順序',
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'ステップ名',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => '説明',
            ],
            'approver_type' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '承認者タイプ',
            ],
            'approver_id' => [
                'type' => Type::int(),
                'description' => '承認者ID',
            ],
            'approver_condition' => [
                'type' => Type::string(),
                'description' => '承認条件（JSON）',
                'resolve' => function ($root) {
                    return json_encode($root->approver_condition);
                },
            ],
            'is_required' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => '必須フラグ',
            ],
            'can_delegate' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => '委譲可能フラグ',
            ],
            'timeout_hours' => [
                'type' => Type::int(),
                'description' => 'タイムアウト時間（時間）',
            ],
            'is_active' => [
                'type' => Type::nonNull(Type::boolean()),
                'description' => 'アクティブ状態',
            ],
            'flow' => [
                'type' => \GraphQL::type('ApprovalFlow'),
                'description' => '承認フロー',
            ],
            'approver' => [
                'type' => \GraphQL::type('User'),
                'description' => '承認者（ユーザー）',
            ],
            'approver_role' => [
                'type' => \GraphQL::type('Role'),
                'description' => '承認者（役割）',
            ],
            'approver_department' => [
                'type' => \GraphQL::type('Department'),
                'description' => '承認者（部署）',
            ],
            'approver_system_level' => [
                'type' => \GraphQL::type('SystemLevel'),
                'description' => '承認者（システム権限レベル）',
            ],
            'histories' => [
                'type' => Type::listOf(\GraphQL::type('ApprovalHistory')),
                'description' => '承認履歴',
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
