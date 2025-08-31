<?php

namespace App\GraphQL\Mutations;

use App\Models\ApprovalStep;
use App\Models\ApprovalFlow;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Mutation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CreateApprovalStepMutation extends Mutation
{
    protected $attributes = [
        'name' => 'createApprovalStep',
        'description' => '承認ステップを作成',
    ];

    public function type(): Type
    {
        return \GraphQL::type('ApprovalStep');
    }

    public function args(): array
    {
        return [
            'approval_flow_id' => [
                'name' => 'approval_flow_id',
                'type' => Type::nonNull(Type::int()),
                'description' => '承認フローID',
            ],
            'step_order' => [
                'name' => 'step_order',
                'type' => Type::nonNull(Type::int()),
                'description' => 'ステップ順序',
            ],
            'name' => [
                'name' => 'name',
                'type' => Type::nonNull(Type::string()),
                'description' => 'ステップ名',
            ],
            'description' => [
                'name' => 'description',
                'type' => Type::string(),
                'description' => '説明',
            ],
            'approver_type' => [
                'name' => 'approver_type',
                'type' => Type::nonNull(Type::string()),
                'description' => '承認者タイプ（user, role, department, system_level）',
            ],
            'approver_id' => [
                'name' => 'approver_id',
                'type' => Type::int(),
                'description' => '承認者ID',
            ],
            'approver_condition' => [
                'name' => 'approver_condition',
                'type' => Type::string(),
                'description' => '承認条件（JSON）',
            ],
            'is_required' => [
                'name' => 'is_required',
                'type' => Type::boolean(),
                'description' => '必須フラグ',
                'defaultValue' => true,
            ],
            'can_delegate' => [
                'name' => 'can_delegate',
                'type' => Type::boolean(),
                'description' => '委譲可能フラグ',
                'defaultValue' => false,
            ],
            'timeout_hours' => [
                'name' => 'timeout_hours',
                'type' => Type::int(),
                'description' => 'タイムアウト時間（時間）',
            ],
            'is_active' => [
                'name' => 'is_active',
                'type' => Type::boolean(),
                'description' => 'アクティブ状態',
                'defaultValue' => true,
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
        // if (!$user->is_admin && !$user->hasPermission('approval.step.manage')) {
        //     throw new \Exception('承認ステップ作成の権限がありません');
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
            'step_order' => 'required|integer|min:1',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'approver_type' => 'required|string|in:user,role,department,system_level',
            'approver_id' => 'nullable|integer|min:1',
            'approver_condition' => 'nullable|string',
            'is_required' => 'boolean',
            'can_delegate' => 'boolean',
            'timeout_hours' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            throw new \Exception($validator->errors()->first());
        }

        try {
            // 承認ステップ作成
            $approvalStep = ApprovalStep::create([
                'approval_flow_id' => $args['approval_flow_id'],
                'step_order' => $args['step_order'],
                'name' => $args['name'],
                'description' => $args['description'] ?? null,
                'approver_type' => $args['approver_type'],
                'approver_id' => $args['approver_id'] ?? null,
                'approver_condition' => isset($args['approver_condition']) ? json_decode($args['approver_condition'], true) : null,
                'is_required' => $args['is_required'] ?? true,
                'can_delegate' => $args['can_delegate'] ?? false,
                'timeout_hours' => $args['timeout_hours'] ?? null,
                'is_active' => $args['is_active'] ?? true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            // 作成された承認ステップを返す（リレーション付き）
            return $approvalStep->load(['flow']);

        } catch (\Exception $e) {
            throw new \Exception('承認ステップの作成に失敗しました: ' . $e->getMessage());
        }
    }
}
