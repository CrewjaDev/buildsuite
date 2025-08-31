<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalRequest;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;

class GetApprovalRequestMutation extends Mutation
{
    protected $attributes = [
        'name' => 'getApprovalRequest',
        'description' => '承認依頼詳細を取得',
    ];

    public function type(): Type
    {
        return \GraphQL::type('ApprovalRequest');
    }

    public function args(): array
    {
        return [
            'id' => [
                'name' => 'id',
                'type' => Type::nonNull(Type::int()),
                'description' => '承認依頼ID',
            ],
        ];
    }

    public function resolve($root, $args)
    {
        // 認証チェック（一時的に無効化）
        // if (!Auth::check()) {
        //     throw new \Exception('認証が必要です');
        // }
        // $user = Auth::user();

        // 権限チェック（一時的に無効化）
        // if (!$user->is_admin && !$user->hasPermission('approval.request.read')) {
        //     throw new \Exception('承認依頼閲覧の権限がありません');
        // }

        // 承認依頼取得（リレーション付き）
        $approvalRequest = ApprovalRequest::with([
            'flow',
            'requester',
            'approver',
            'rejecter',
            'returner',
            'canceller',
            'currentStep',
            'histories' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }
        ])->find($args['id']);

        if (!$approvalRequest) {
            throw new \Exception('承認依頼が見つかりません');
        }

        return $approvalRequest;
    }
}
