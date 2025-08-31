<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalFlow;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;

class DeleteApprovalFlowMutation extends Mutation
{
    protected $attributes = [
        'name' => 'deleteApprovalFlow',
        'description' => '承認フローを削除',
    ];

    public function type(): Type
    {
        return Type::boolean();
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

        // 承認フロー取得
        $approvalFlow = ApprovalFlow::find($args['id']);
        if (!$approvalFlow) {
            throw new \Exception('承認フローが見つかりません');
        }

        // 権限チェック（システム管理者または承認フロー管理権限を持つユーザーのみ）
        if (!$user->is_admin && !$user->hasPermission('approval.flow.manage')) {
            throw new \Exception('承認フロー削除の権限がありません');
        }

        // システムフローの削除制限
        if ($approvalFlow->is_system && !$user->is_admin) {
            throw new \Exception('システムフローは削除できません');
        }

        // 承認依頼が存在する場合の削除制限
        if ($approvalFlow->requests()->exists()) {
            throw new \Exception('承認依頼が存在するため削除できません');
        }

        try {
            // 承認フロー削除（ソフトデリート）
            $approvalFlow->delete();

            return true;

        } catch (\Exception $e) {
            throw new \Exception('承認フローの削除に失敗しました: ' . $e->getMessage());
        }
    }
}
