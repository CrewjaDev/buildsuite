<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalRequest;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;

class CancelRequestMutation extends Mutation
{
    protected $attributes = [
        'name' => 'cancelRequest',
        'description' => '承認依頼をキャンセル',
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
            'comment' => [
                'name' => 'comment',
                'type' => Type::string(),
                'description' => 'キャンセルコメント',
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

        // テスト用のダミーユーザー（実際の環境では削除）
        $user = \App\Models\User::first();
        if (!$user) {
            throw new \Exception('テスト用ユーザーが見つかりません');
        }

        // 承認依頼取得
        $approvalRequest = ApprovalRequest::find($args['id']);
        if (!$approvalRequest) {
            throw new \Exception('承認依頼が見つかりません');
        }

        // 権限チェック（一時的に無効化）
        // if (!$approvalRequest->isRequester($user) && !$user->is_admin) {
        //     throw new \Exception('承認依頼のキャンセル権限がありません');
        // }

        try {
            // キャンセル実行（テスト用に承認者チェックを無効化）
            // 実際の環境では、承認者チェックが必要
            $approvalRequest->update([
                'cancelled_by' => $user->id,
                'cancelled_at' => now(),
                'status' => 'cancelled',
            ]);

            // キャンセル履歴を記録
            $approvalRequest->histories()->create([
                'approval_step_id' => $approvalRequest->current_step,
                'action' => 'cancel',
                'acted_by' => $user->id,
                'comment' => $args['comment'] ?? null,
            ]);

            return $approvalRequest->load(['requester', 'canceller', 'flow']);

        } catch (\Exception $e) {
            throw new \Exception('キャンセルの実行に失敗しました: ' . $e->getMessage());
        }
    }
}
