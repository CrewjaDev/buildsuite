<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalFlow;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;

class GetApprovalFlowMutation extends Mutation
{
    protected $attributes = [
        'name' => 'getApprovalFlow',
        'description' => '承認フロー詳細を取得',
    ];

    public function type(): Type
    {
        return \GraphQL::type('ApprovalFlow');
    }

    public function args(): array
    {
        return [
            'id' => [
                'name' => 'id',
                'type' => Type::nonNull(Type::int()),
                'description' => '承認フローID',
            ],
        ];
    }

    public function resolve($root, $args)
    {
        // 認証チェック
        if (!Auth::check()) {
            throw new \Exception('認証が必要です');
        }

        $user = Auth::user();

        // 権限チェック（システム管理者または承認フロー閲覧権限を持つユーザーのみ）
        if (!$user->is_admin && !$user->hasPermission('approval.flow.read')) {
            throw new \Exception('承認フロー閲覧の権限がありません');
        }

        // 承認フロー取得（リレーション付き）
        $approvalFlow = ApprovalFlow::with([
            'creator',
            'updater',
            'steps' => function ($query) {
                $query->orderBy('step_order');
            },
            'conditions' => function ($query) {
                $query->orderBy('priority');
            },
            'requests' => function ($query) {
                $query->orderBy('created_at', 'desc');
            }
        ])->find($args['id']);

        if (!$approvalFlow) {
            throw new \Exception('承認フローが見つかりません');
        }

        return $approvalFlow;
    }
}
