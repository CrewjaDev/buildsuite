<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalFlow;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CreateApprovalFlowMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createApprovalFlow',
        'description' => '承認フローを作成',
    ];

    public function type(): Type
    {
        return \GraphQL::type('ApprovalFlow');
    }

    public function args(): array
    {
        return [
            'name' => [
                'name' => 'name',
                'type' => Type::nonNull(Type::string()),
                'description' => '承認フロー名',
            ],
            'description' => [
                'name' => 'description',
                'type' => Type::string(),
                'description' => '説明',
            ],
            'flow_type' => [
                'name' => 'flow_type',
                'type' => Type::nonNull(Type::string()),
                'description' => 'フロータイプ（estimate, budget, order, progress, payment）',
            ],
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
                'defaultValue' => true,
            ],
            'is_system' => [
                'name' => 'is_system',
                'type' => Type::boolean(),
                'description' => 'システムフロー',
                'defaultValue' => false,
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
        // if (!$user->is_admin && !$user->hasPermission('approval.flow.manage')) {
        //     throw new \Exception('承認フロー作成の権限がありません');
        // }

        // バリデーション
        $validator = Validator::make($args, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'flow_type' => 'required|string|in:estimate,budget,order,progress,payment',
            'is_active' => 'boolean',
            'is_system' => 'boolean',
            'priority' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            throw new \Exception($validator->errors()->first());
        }

        try {
            // 承認フロー作成
            $approvalFlow = ApprovalFlow::create([
                'name' => $args['name'],
                'description' => $args['description'] ?? null,
                'flow_type' => $args['flow_type'],
                'is_active' => $args['is_active'] ?? true,
                'is_system' => $args['is_system'] ?? false,
                'priority' => $args['priority'] ?? 0,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            // 作成された承認フローを返す（リレーション付き）
            return $approvalFlow->load(['creator', 'updater']);

        } catch (\Exception $e) {
            throw new \Exception('承認フローの作成に失敗しました: ' . $e->getMessage());
        }
    }
}
