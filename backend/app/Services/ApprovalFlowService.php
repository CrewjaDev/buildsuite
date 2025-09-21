<?php

namespace App\Services;

use App\Models\ApprovalFlow;
use App\Models\ApprovalStep;
use App\Models\ApprovalCondition;
use App\Models\Estimate;
use App\Models\SystemLevel;
use App\Models\User;
use Illuminate\Support\Collection;

class ApprovalFlowService
{
    /**
     * 承認フローを取得（条件に基づいて適切なフローを選択）
     */
    public function getApprovalFlow(Estimate $estimate): ?ApprovalFlow
    {
        // 条件に基づいて適切なフローを選択
        $flows = ApprovalFlow::active()
            ->byType('estimate')
            ->orderBy('priority', 'desc')
            ->get();

        foreach ($flows as $flow) {
            if ($this->matchesConditions($estimate, $flow)) {
                return $flow;
            }
        }

        // デフォルトフローを返す
        return ApprovalFlow::active()
            ->byType('estimate')
            ->orderBy('priority', 'desc')
            ->first();
    }

    /**
     * 承認フローを作成（テンプレートベース）
     */
    public function createApprovalFlow(Estimate $estimate): ApprovalFlow
    {
        $flow = $this->getApprovalFlow($estimate);
        
        if (!$flow) {
            // デフォルトの2段階承認フローを作成
            $flow = $this->createDefaultEstimateFlow();
        }

        return $flow;
    }

    /**
     * デフォルトの見積承認フローを作成
     */
    public function createDefaultEstimateFlow(): ApprovalFlow
    {
        // 承認フローを作成
        $approvalFlow = ApprovalFlow::create([
            'name' => '標準見積承認フロー',
            'description' => '標準的な見積承認フロー（2段階）',
            'flow_type' => 'estimate',
            'is_active' => true,
            'priority' => 10,
            'created_by' => auth()->id(),
        ]);

        // 第1承認ステップ
        ApprovalStep::create([
            'approval_flow_id' => $approvalFlow->id,
            'step_order' => 1,
            'name' => '第1承認',
            'approver_type' => 'system_level',
            'approver_id' => 'supervisor',
            'is_required' => true,
            'created_by' => auth()->id(),
        ]);

        // 最終承認ステップ
        ApprovalStep::create([
            'approval_flow_id' => $approvalFlow->id,
            'step_order' => 2,
            'name' => '最終承認',
            'approver_type' => 'system_level',
            'approver_id' => 'accounting_manager',
            'is_required' => true,
            'created_by' => auth()->id(),
        ]);

        return $approvalFlow;
    }

    /**
     * カスタム承認フローを作成
     */
    public function createCustomApprovalFlow(array $flowData, array $stepsData): ApprovalFlow
    {
        // 承認フローを作成
        $approvalFlow = ApprovalFlow::create([
            'name' => $flowData['name'],
            'description' => $flowData['description'] ?? null,
            'flow_type' => $flowData['flow_type'] ?? 'estimate',
            'is_active' => $flowData['is_active'] ?? true,
            'priority' => $flowData['priority'] ?? 0,
            'created_by' => auth()->id(),
        ]);

        // ステップを作成
        foreach ($stepsData as $stepData) {
            ApprovalStep::create([
                'approval_flow_id' => $approvalFlow->id,
                'step_order' => $stepData['step_order'],
                'name' => $stepData['name'],
                'description' => $stepData['description'] ?? null,
                'approver_type' => $stepData['approver_type'],
                'approver_id' => $stepData['approver_id'],
                'approver_condition' => $stepData['approver_condition'] ?? null,
                'is_required' => $stepData['is_required'] ?? true,
                'can_delegate' => $stepData['can_delegate'] ?? false,
                'timeout_hours' => $stepData['timeout_hours'] ?? null,
                'created_by' => auth()->id(),
            ]);
        }

        // 条件を作成（オプション）
        if (isset($flowData['conditions'])) {
            foreach ($flowData['conditions'] as $conditionData) {
                ApprovalCondition::create([
                    'approval_flow_id' => $approvalFlow->id,
                    'condition_type' => $conditionData['condition_type'],
                    'field_name' => $conditionData['field_name'],
                    'operator' => $conditionData['operator'],
                    'value' => $conditionData['value'],
                    'value_type' => $conditionData['value_type'] ?? 'string',
                    'priority' => $conditionData['priority'] ?? 0,
                    'description' => $conditionData['description'] ?? null,
                    'created_by' => auth()->id(),
                ]);
            }
        }

        return $approvalFlow;
    }

    /**
     * 条件マッチング
     */
    private function matchesConditions(Estimate $estimate, ApprovalFlow $flow): bool
    {
        // 条件がない場合は常にマッチ
        if ($flow->conditions->isEmpty()) {
            return true;
        }

        // 各条件をチェック
        foreach ($flow->conditions as $condition) {
            if (!$condition->evaluate($estimate)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 承認者候補を取得
     */
    public function getApproverCandidates(string $systemLevelCode): Collection
    {
        $requiredLevel = SystemLevel::where('code', $systemLevelCode)->first();
        
        if (!$requiredLevel) {
            return collect();
        }

        return User::whereHas('systemLevel', function ($query) use ($requiredLevel) {
            $query->where('priority', '>=', $requiredLevel->priority);
        })
        ->where('is_active', true)
        ->with(['employee.department', 'systemLevel'])
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->employee->name ?? $user->login_id,
                'system_level' => $user->systemLevel->display_name,
                'department' => $user->employee->department->name ?? '未設定',
            ];
        });
    }

    /**
     * 承認フロー設定権限チェック
     */
    public function canUserConfigureFlow(User $user): bool
    {
        // システム管理者のみ
        return $user->hasSystemLevel('system_admin');
    }

    /**
     * 承認権限チェック
     */
    public function canUserApprove(User $user, string $requiredSystemLevel): bool
    {
        // システム権限レベルの優先度で判定
        $userSystemLevel = $user->systemLevel;
        $requiredSystemLevelModel = SystemLevel::where('code', $requiredSystemLevel)->first();
        
        if (!$userSystemLevel || !$requiredSystemLevelModel) {
            return false;
        }
        
        // 優先度が要求レベル以上かチェック
        return $userSystemLevel->priority >= $requiredSystemLevelModel->priority;
    }

    /**
     * テンプレートから承認フローを作成
     */
    public function createFromTemplate(string $templateId, string $name, ?string $description, string $flowType, array $customizations = []): ApprovalFlow
    {
        $templates = $this->getApprovalFlowTemplates();
        
        if (!isset($templates[$templateId])) {
            throw new \InvalidArgumentException("Template '{$templateId}' not found");
        }
        
        $template = $templates[$templateId];
        
        // カスタマイゼーションを適用
        $flowData = array_merge($template, $customizations);
        
        // 承認フローを作成
        $approvalFlow = ApprovalFlow::create([
            'name' => $name,
            'description' => $description ?? $template['description'],
            'flow_type' => $flowType,
            'is_active' => true,
            'priority' => $flowData['priority'] ?? 10,
            'created_by' => auth()->id(),
        ]);

        // ステップを作成
        foreach ($template['steps'] as $index => $stepTemplate) {
            // approver_idを適切なIDに変換
            $approverId = $this->resolveApproverId($stepTemplate['approver_type'], $stepTemplate['approver_id']);
            
            ApprovalStep::create([
                'approval_flow_id' => $approvalFlow->id,
                'step_order' => $index + 1,
                'name' => $stepTemplate['name'],
                'description' => $stepTemplate['description'] ?? null,
                'approver_type' => $stepTemplate['approver_type'],
                'approver_id' => $approverId,
                'approver_condition' => $stepTemplate['approver_condition'] ?? null,
                'is_required' => $stepTemplate['is_required'] ?? true,
                'can_delegate' => $stepTemplate['can_delegate'] ?? false,
                'timeout_hours' => $stepTemplate['timeout_hours'] ?? null,
                'created_by' => auth()->id(),
            ]);
        }

        // 条件を作成（テンプレートに条件が定義されている場合）
        if (isset($template['conditions'])) {
            foreach ($template['conditions'] as $conditionTemplate) {
                ApprovalCondition::create([
                    'approval_flow_id' => $approvalFlow->id,
                    'condition_type' => $conditionTemplate['type'],
                    'field_name' => $conditionTemplate['field'],
                    'operator' => $conditionTemplate['operator'],
                    'value' => $conditionTemplate['value'],
                    'value_type' => $conditionTemplate['value_type'] ?? 'string',
                    'priority' => $conditionTemplate['priority'] ?? 0,
                    'description' => $conditionTemplate['description'] ?? null,
                    'created_by' => auth()->id(),
                ]);
            }
        }

        return $approvalFlow;
    }

    /**
     * 承認者IDを解決
     */
    private function resolveApproverId(string $approverType, string $approverCode): ?int
    {
        switch ($approverType) {
            case 'system_level':
                $systemLevel = SystemLevel::where('code', $approverCode)->first();
                return $systemLevel ? $systemLevel->id : null;
            
            case 'user':
                // ユーザーIDの場合はそのまま返す
                return is_numeric($approverCode) ? (int)$approverCode : null;
            
            case 'role':
            case 'department':
                // 役割や部署の場合は、将来的に実装
                return null;
            
            default:
                return null;
        }
    }

    /**
     * 承認フローテンプレート定義
     */
    private function getApprovalFlowTemplates(): array
    {
        return [
            'small_org_standard' => [
                'name' => '小規模組織標準フロー',
                'description' => '小規模組織用の1段階承認',
                'priority' => 15,
                'steps' => [
                    [
                        'name' => '承認',
                        'approver_type' => 'system_level',
                        'approver_id' => 'office_manager',
                        'is_required' => true
                    ]
                ]
            ],
            'medium_org_standard' => [
                'name' => '中規模組織標準フロー',
                'description' => '中規模組織用の1段階承認',
                'priority' => 10,
                'steps' => [
                    [
                        'name' => '承認',
                        'approver_type' => 'system_level',
                        'approver_id' => 'supervisor',
                        'is_required' => true
                    ]
                ]
            ],
            'large_org_standard' => [
                'name' => '大規模組織標準フロー',
                'description' => '大規模組織用の2段階承認',
                'priority' => 10,
                'steps' => [
                    [
                        'name' => '第1承認',
                        'approver_type' => 'system_level',
                        'approver_id' => 'supervisor',
                        'is_required' => true
                    ],
                    [
                        'name' => '最終承認',
                        'approver_type' => 'system_level',
                        'approver_id' => 'accounting_manager',
                        'is_required' => true
                    ]
                ]
            ],
            'high_value_flow' => [
                'name' => '高額案件フロー',
                'description' => '高額案件用の3段階承認',
                'priority' => 5,
                'steps' => [
                    [
                        'name' => '第1承認',
                        'approver_type' => 'system_level',
                        'approver_id' => 'supervisor',
                        'is_required' => true
                    ],
                    [
                        'name' => '第2承認',
                        'approver_type' => 'system_level',
                        'approver_id' => 'accounting_manager',
                        'is_required' => true
                    ],
                    [
                        'name' => '最終承認',
                        'approver_type' => 'system_level',
                        'approver_id' => 'executive',
                        'is_required' => true
                    ]
                ],
                'conditions' => [
                    [
                        'type' => 'amount',
                        'field' => 'total_amount',
                        'operator' => 'greater_than_or_equal',
                        'value' => 10000000,
                        'value_type' => 'integer'
                    ]
                ]
            ]
        ];
    }
}
