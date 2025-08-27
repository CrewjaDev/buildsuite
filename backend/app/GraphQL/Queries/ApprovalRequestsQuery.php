<?php

namespace App\GraphQL\Queries;

use App\Models\ApprovalRequest;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;
use Rebing\GraphQL\Support\SelectFields;

class ApprovalRequestsQuery extends Query
{
    protected $attributes = [
        'name' => 'approvalRequests',
        'description' => '承認依頼一覧を取得',
    ];

    public function type(): Type
    {
        return Type::listOf(\GraphQL::type('ApprovalRequest'));
    }

    public function args(): array
    {
        return [
            'status' => [
                'name' => 'status',
                'type' => Type::string(),
                'description' => 'ステータス',
            ],
            'request_type' => [
                'name' => 'request_type',
                'type' => Type::string(),
                'description' => '依頼タイプ',
            ],
            'priority' => [
                'name' => 'priority',
                'type' => Type::string(),
                'description' => '優先度',
            ],
            'requested_by' => [
                'name' => 'requested_by',
                'type' => Type::int(),
                'description' => '依頼者ID',
            ],
            'approval_flow_id' => [
                'name' => 'approval_flow_id',
                'type' => Type::int(),
                'description' => '承認フローID',
            ],
            'is_expired' => [
                'name' => 'is_expired',
                'type' => Type::boolean(),
                'description' => '期限切れか',
            ],
            'limit' => [
                'name' => 'limit',
                'type' => Type::int(),
                'description' => '取得件数',
                'defaultValue' => 15,
            ],
            'offset' => [
                'name' => 'offset',
                'type' => Type::int(),
                'description' => 'オフセット',
                'defaultValue' => 0,
            ],
        ];
    }

    public function resolve($root, $args, SelectFields $fields, $context)
    {
        $query = ApprovalRequest::with($fields->getRelations());

        // ステータスでフィルタ
        if (isset($args['status'])) {
            $query->where('status', $args['status']);
        }

        // 依頼タイプでフィルタ
        if (isset($args['request_type'])) {
            $query->where('request_type', $args['request_type']);
        }

        // 優先度でフィルタ
        if (isset($args['priority'])) {
            $query->where('priority', $args['priority']);
        }

        // 依頼者でフィルタ
        if (isset($args['requested_by'])) {
            $query->where('requested_by', $args['requested_by']);
        }

        // 承認フローでフィルタ
        if (isset($args['approval_flow_id'])) {
            $query->where('approval_flow_id', $args['approval_flow_id']);
        }

        // 期限切れでフィルタ
        if (isset($args['is_expired'])) {
            if ($args['is_expired']) {
                $query->where('expires_at', '<=', now());
            } else {
                $query->where(function ($q) {
                    $q->where('expires_at', '>', now())
                      ->orWhereNull('expires_at');
                });
            }
        }

        // ソート（作成日時の降順）
        $query->orderBy('created_at', 'desc');

        // ページネーション
        if (isset($args['limit'])) {
            $query->limit($args['limit']);
        }

        if (isset($args['offset'])) {
            $query->offset($args['offset']);
        }

        return $query->get();
    }
}
