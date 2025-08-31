<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalFlow;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UpdateApprovalFlowMutation extends Mutation
{
    protected $attributes = [
        'name' => 'updateApprovalFlow',
        'description' => '承認フローを更新',
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
            'name' => [
                'name' => 'name',
                'type' => Type::string(),
                'description' => '承認フロー名',
            ],
            'description' => [
                'name' => 'description',
                'type' => Type::string(),
                'description' => '説明',
            ],
            'flow_type' => [
                'name' => 'flow_type',
                'type' => Type::string(),
                'description' => 'フロータイプ（estimate, budget, order, progress, payment）',
            ],
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
            ],
            'is_system' => [
                'name' => 'is_system',
                'type' => Type::boolean(),
                'description' => 'システムフロー',
            ],
            'priority' => [
                'name' => 'priority',
                'type' => Type::int(),
                'description' => '優先度',
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
            throw new \Exception('承認フロー更新の権限がありません');
        }

        // システムフローの更新制限
        if ($approvalFlow->is_system && !$user->is_admin) {
            throw new \Exception('システムフローは管理者のみ更新可能です');
        }

        // バリデーション
        $validator = Validator::make($args, [
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'flow_type' => 'nullable|string|in:estimate,budget,order,progress,payment',
            'is_active' => 'nullable|boolean',
            'is_system' => 'nullable|boolean',
            'priority' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            throw new \Exception($validator->errors()->first());
        }

        try {
            // 更新データの準備
            $updateData = [];
            $fields = ['name', 'description', 'flow_type', 'is_active', 'is_system', 'priority'];
            
            foreach ($fields as $field) {
                if (isset($args[$field])) {
                    $updateData[$field] = $args[$field];
                }
            }
            
            $updateData['updated_by'] = $user->id;

            // 承認フロー更新
            $approvalFlow->update($updateData);

            // 更新された承認フローを返す（リレーション付き）
            return $approvalFlow->load(['creator', 'updater']);

        } catch (\Exception $e) {
            throw new \Exception('承認フローの更新に失敗しました: ' . $e->getMessage());
        }
    }
}
