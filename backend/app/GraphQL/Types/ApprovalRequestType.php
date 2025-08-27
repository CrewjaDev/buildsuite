<?php

namespace App\GraphQL\Types;

use App\Models\ApprovalRequest;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class ApprovalRequestType extends GraphQLType
{
    protected $attributes = [
        'name' => 'ApprovalRequest',
        'description' => '承認依頼情報',
        'model' => ApprovalRequest::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認依頼ID',
            ],
            'approval_flow_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '承認フローID',
            ],
            'request_type' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '依頼タイプ',
            ],
            'request_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '依頼元ID',
            ],
            'title' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'タイトル',
            ],
            'description' => [
                'type' => Type::string(),
                'description' => '説明',
            ],
            'request_data' => [
                'type' => Type::string(),
                'description' => '依頼データ（JSON）',
                'resolve' => function ($root) {
                    return json_encode($root->request_data);
                },
            ],
            'current_step' => [
                'type' => Type::int(),
                'description' => '現在のステップID',
            ],
            'status' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'ステータス',
            ],
            'priority' => [
                'type' => Type::nonNull(Type::string()),
                'description' => '優先度',
            ],
            'requested_by' => [
                'type' => Type::nonNull(Type::int()),
                'description' => '依頼者ID',
            ],
            'approved_by' => [
                'type' => Type::int(),
                'description' => '承認者ID',
            ],
            'approved_at' => [
                'type' => Type::string(),
                'description' => '承認日時',
            ],
            'rejected_by' => [
                'type' => Type::int(),
                'description' => '却下者ID',
            ],
            'rejected_at' => [
                'type' => Type::string(),
                'description' => '却下日時',
            ],
            'returned_by' => [
                'type' => Type::int(),
                'description' => '差し戻し者ID',
            ],
            'returned_at' => [
                'type' => Type::string(),
                'description' => '差し戻し日時',
            ],
            'cancelled_by' => [
                'type' => Type::int(),
                'description' => 'キャンセル者ID',
            ],
            'cancelled_at' => [
                'type' => Type::string(),
                'description' => 'キャンセル日時',
            ],
            'expires_at' => [
                'type' => Type::string(),
                'description' => '期限日時',
            ],
            'flow' => [
                'type' => \GraphQL::type('ApprovalFlow'),
                'description' => '承認フロー',
            ],
            'requester' => [
                'type' => \GraphQL::type('User'),
                'description' => '依頼者',
            ],
            'approver' => [
                'type' => \GraphQL::type('User'),
                'description' => '承認者',
            ],
            'rejecter' => [
                'type' => \GraphQL::type('User'),
                'description' => '却下者',
            ],
            'returner' => [
                'type' => \GraphQL::type('User'),
                'description' => '差し戻し者',
            ],
            'canceller' => [
                'type' => \GraphQL::type('User'),
                'description' => 'キャンセル者',
            ],
            'current_step_info' => [
                'type' => \GraphQL::type('ApprovalStep'),
                'description' => '現在のステップ情報',
            ],
            'histories' => [
                'type' => Type::listOf(\GraphQL::type('ApprovalHistory')),
                'description' => '承認履歴',
            ],
            'is_pending' => [
                'type' => Type::boolean(),
                'description' => '保留中か',
                'resolve' => function ($root) {
                    return $root->isPending();
                },
            ],
            'is_approved' => [
                'type' => Type::boolean(),
                'description' => '承認済みか',
                'resolve' => function ($root) {
                    return $root->isApproved();
                },
            ],
            'is_rejected' => [
                'type' => Type::boolean(),
                'description' => '却下済みか',
                'resolve' => function ($root) {
                    return $root->isRejected();
                },
            ],
            'is_returned' => [
                'type' => Type::boolean(),
                'description' => '差し戻し済みか',
                'resolve' => function ($root) {
                    return $root->isReturned();
                },
            ],
            'is_cancelled' => [
                'type' => Type::boolean(),
                'description' => 'キャンセル済みか',
                'resolve' => function ($root) {
                    return $root->isCancelled();
                },
            ],
            'is_expired' => [
                'type' => Type::boolean(),
                'description' => '期限切れか',
                'resolve' => function ($root) {
                    return $root->isExpired();
                },
            ],
            'is_completed' => [
                'type' => Type::boolean(),
                'description' => '完了しているか',
                'resolve' => function ($root) {
                    return $root->isCompleted();
                },
            ],
            'is_in_progress' => [
                'type' => Type::boolean(),
                'description' => '進行中か',
                'resolve' => function ($root) {
                    return $root->isInProgress();
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
