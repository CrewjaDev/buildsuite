<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalRequest;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;

class DeleteApprovalRequestMutation extends Mutation
{
    protected $attributes = [
        'name' => 'deleteApprovalRequest',
        'description' => '承認依頼を削除',
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
                'description' => '承認依頼ID',
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

        // 承認依頼取得
        $approvalRequest = ApprovalRequest::find($args['id']);
        if (!$approvalRequest) {
            throw new \Exception('承認依頼が見つかりません');
        }

        // 権限チェック（作成者または管理者のみ削除可能）
        if (!$user->is_admin && $approvalRequest->requested_by !== $user->id && !$user->hasPermission('approval.request.manage')) {
            throw new \Exception('承認依頼削除の権限がありません');
        }

        // ステータスチェック（承認済み・却下済みの場合は削除不可）
        if (in_array($approvalRequest->status, ['approved', 'rejected'])) {
            throw new \Exception('承認済みまたは却下済みの依頼は削除できません');
        }

        try {
            // 承認依頼削除（ソフトデリート）
            $approvalRequest->delete();

            return true;

        } catch (\Exception $e) {
            throw new \Exception('承認依頼の削除に失敗しました: ' . $e->getMessage());
        }
    }
}
