<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalRequest;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UpdateApprovalRequestMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateApprovalRequest',
        'description' => '承認依頼を更新',
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
            'title' => [
                'name' => 'title',
                'type' => Type::string(),
                'description' => '依頼タイトル',
            ],
            'description' => [
                'name' => 'description',
                'type' => Type::string(),
                'description' => '依頼説明',
            ],
            'request_data' => [
                'name' => 'request_data',
                'type' => Type::string(),
                'description' => '依頼データ（JSON）',
            ],
            'priority' => [
                'name' => 'priority',
                'type' => Type::int(),
                'description' => '優先度',
            ],
            'current_step' => [
                'name' => 'current_step',
                'type' => Type::int(),
                'description' => '現在のステップID',
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
        // if (!$user->is_admin && $approvalRequest->requested_by !== $user->id && !$user->hasPermission('approval.request.manage')) {
        //     throw new \Exception('承認依頼更新の権限がありません');
        // }

        // ステータスチェック（承認済み・却下済みの場合は更新不可）
        if (in_array($approvalRequest->status, ['approved', 'rejected'])) {
            throw new \Exception('承認済みまたは却下済みの依頼は更新できません');
        }

        // バリデーション
        $validator = Validator::make($args, [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'request_data' => 'nullable|string',
            'priority' => 'nullable|integer|min:0|max:10',
            'current_step' => 'nullable|integer|exists:approval_steps,id',
        ]);

        if ($validator->fails()) {
            throw new \Exception($validator->errors()->first());
        }

        try {
            // 更新データの準備
            $updateData = [];
            $fields = ['title', 'description', 'priority', 'current_step'];
            
            foreach ($fields as $field) {
                if (isset($args[$field])) {
                    $updateData[$field] = $args[$field];
                }
            }

            // request_dataの更新
            if (isset($args['request_data'])) {
                $updateData['request_data'] = json_decode($args['request_data'], true);
            }
            
            $updateData['updated_by'] = $user->id;

            // 承認依頼更新
            $approvalRequest->update($updateData);

            // 更新された承認依頼を返す（リレーション付き）
            return $approvalRequest->load(['flow', 'requester']);

        } catch (\Exception $e) {
            throw new \Exception('承認依頼の更新に失敗しました: ' . $e->getMessage());
        }
    }
}
