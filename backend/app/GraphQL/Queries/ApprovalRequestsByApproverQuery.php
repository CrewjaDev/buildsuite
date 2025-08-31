<?php

namespace App\GraphQL\Queries;

use App\Models\ApprovalRequest;
use App\Models\ApprovalStep;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Query;
use Illuminate\Support\Facades\Auth;

class ApprovalRequestsByApproverQuery extends Query
{
    protected $attributes = [
        'name' => 'approvalRequestsByApprover',
        'description' => '承認者別承認依頼一覧を取得',
    ];

    public function type(): Type
    {
        return Type::listOf(\GraphQL::type('ApprovalRequest'));
    }

    public function args(): array
    {
        return [
            'approver_id' => [
                'name' => 'approver_id',
                'type' => Type::int(),
                'description' => '承認者ID（指定しない場合は現在のユーザー）',
            ],
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

    public function resolve($root, $args, $context)
    {
        // 認証チェック（一時的に無効化）
        // if (!Auth::check()) {
        //     throw new \Exception('認証が必要です');
        // }

        // テスト用のダミーユーザー（実際の環境では削除）
        $user = \App\Models\User::first();
        if (!$user) {
            throw new \Exception('テスト用ユーザーが見つかりません');
        }

        $approverId = $args['approver_id'] ?? $user->id;

        // 承認者に関連する承認ステップを取得
        $approvalStepIds = ApprovalStep::where(function ($query) use ($user) {
            // 直接指定された承認者
            $query->where('approver_type', 'user')
                  ->where('approver_id', $user->id);
            
            // 役割による承認者（role_idが設定されている場合）
            if ($user->role_id) {
                $query->orWhere(function ($q) use ($user) {
                    $q->where('approver_type', 'role')
                      ->where('approver_id', $user->role_id);
                });
            }
            
            // 部署による承認者（department_idが設定されている場合）
            if ($user->department_id) {
                $query->orWhere(function ($q) use ($user) {
                    $q->where('approver_type', 'department')
                      ->where('approver_id', $user->department_id);
                });
            }
            
            // システム権限レベルによる承認者（system_levelが設定されている場合）
            if ($user->system_level) {
                $query->orWhere(function ($q) use ($user) {
                    $q->where('approver_type', 'system_level')
                      ->whereRaw("approver_condition->>'system_level' = ?", [$user->system_level]);
                });
            }
        })->pluck('id');

        $query = ApprovalRequest::with(['requester', 'flow', 'currentStepInfo'])
            ->whereIn('current_step', $approvalStepIds)
            ->where('status', 'pending');

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
