<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalRequest;
use App\Models\ApprovalFlow;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CreateApprovalRequestMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createApprovalRequest',
        'description' => '承認依頼を作成',
    ];

    public function type(): Type
    {
        return \GraphQL::type('ApprovalRequest');
    }

    public function args(): array
    {
        return [
            'approval_flow_id' => [
                'name' => 'approval_flow_id',
                'type' => Type::nonNull(Type::int()),
                'description' => '承認フローID',
            ],
            'request_type' => [
                'name' => 'request_type',
                'type' => Type::nonNull(Type::string()),
                'description' => '依頼タイプ（estimate, budget, order, progress, payment）',
            ],
            'request_id' => [
                'name' => 'request_id',
                'type' => Type::int(),
                'description' => '依頼対象ID',
            ],
            'title' => [
                'name' => 'title',
                'type' => Type::nonNull(Type::string()),
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
                'defaultValue' => 0,
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

        // 権限チェック（一時的に無効化）
        // if (!$user->is_admin && !$user->hasPermission('approval.request.create')) {
        //     throw new \Exception('承認依頼作成の権限がありません');
        // }

        // 承認フロー取得
        $approvalFlow = ApprovalFlow::find($args['approval_flow_id']);
        if (!$approvalFlow) {
            throw new \Exception('承認フローが見つかりません');
        }

        if (!$approvalFlow->is_active) {
            throw new \Exception('承認フローが無効です');
        }

        // バリデーション
        $validator = Validator::make($args, [
            'approval_flow_id' => 'required|integer|exists:approval_flows,id',
            'request_type' => 'required|string|in:estimate,budget,order,progress,payment',
            'request_id' => 'nullable|integer|min:0',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'request_data' => 'nullable|string',
            'priority' => 'integer|min:0|max:10',
        ]);

        if ($validator->fails()) {
            throw new \Exception($validator->errors()->first());
        }

        try {
            // 承認依頼作成
            $approvalRequest = ApprovalRequest::create([
                'approval_flow_id' => $args['approval_flow_id'],
                'request_type' => $args['request_type'],
                'request_id' => $args['request_id'] ?? 0, // デフォルト値を0に設定
                'title' => $args['title'],
                'description' => $args['description'] ?? null,
                'request_data' => isset($args['request_data']) ? json_decode($args['request_data'], true) : null,
                'current_step' => null, // 一時的にnullに設定
                'status' => 'pending',
                'priority' => $args['priority'] ?? 0,
                'requested_by' => $user->id,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            // 作成された承認依頼を返す（リレーション付き）
            return $approvalRequest->load(['flow', 'requester']);

        } catch (\Exception $e) {
            throw new \Exception('承認依頼の作成に失敗しました: ' . $e->getMessage());
        }
    }
}
