<?php

namespace App\GraphQL\Queries;

use App\Models\ApprovalFlow;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;
use Illuminate\Support\Facades\Auth;

class ApprovalFlowsQuery extends Query
{
    protected $attributes = [
        'name' => 'approvalFlows',
        'description' => '承認フロー一覧を取得（フィルタリング対応）',
    ];

    public function type(): Type
    {
        return Type::listOf(\GraphQL::type('ApprovalFlow'));
    }

    public function args(): array
    {
        return [
            'name' => [
                'name' => 'name',
                'type' => Type::string(),
                'description' => 'フロー名（部分一致）',
            ],
            'flow_type' => [
                'name' => 'flow_type',
                'type' => Type::string(),
                'description' => 'フロータイプ',
            ],
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
            ],
            'created_by' => [
                'name' => 'created_by',
                'type' => Type::int(),
                'description' => '作成者ID',
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
            'sort_by' => [
                'name' => 'sort_by',
                'type' => Type::string(),
                'description' => 'ソート項目',
                'defaultValue' => 'created_at',
            ],
            'sort_order' => [
                'name' => 'sort_order',
                'type' => Type::string(),
                'description' => 'ソート順序',
                'defaultValue' => 'desc',
            ],
        ];
    }

    public function resolve($root, $args, $context)
    {
        // 認証チェック（一時的に無効化）
        // if (!Auth::check()) {
        //     throw new \Exception('認証が必要です');
        // }

        $query = ApprovalFlow::with(['steps', 'creator']);

        // フロー名でフィルタ（部分一致）
        if (isset($args['name'])) {
            $query->where('name', 'like', '%' . $args['name'] . '%');
        }

        // フロータイプでフィルタ
        if (isset($args['flow_type'])) {
            $query->where('flow_type', $args['flow_type']);
        }

        // アクティブ状態でフィルタ
        if (isset($args['is_active'])) {
            $query->where('is_active', $args['is_active']);
        }

        // 作成者でフィルタ
        if (isset($args['created_by'])) {
            $query->where('created_by', $args['created_by']);
        }

        // ソート
        $sortBy = $args['sort_by'] ?? 'created_at';
        $sortOrder = $args['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

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
