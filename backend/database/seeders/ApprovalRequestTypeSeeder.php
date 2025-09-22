<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ApprovalRequestType;
use App\Models\ApprovalRequestTemplate;
use App\Models\ApprovalFlow;

class ApprovalRequestTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 承認フローが存在しない場合は作成
        $defaultFlow = ApprovalFlow::first();
        if (!$defaultFlow) {
            $defaultFlow = ApprovalFlow::create([
                'name' => '標準承認フロー',
                'description' => '標準的な承認フロー',
                'flow_type' => 'estimate',
                'is_active' => true,
                'created_by' => 1,
                'updated_by' => 1,
            ]);
        }

        // 承認依頼タイプの初期データ
        $requestTypes = [
            [
                'code' => 'estimate',
                'name' => '見積承認',
                'description' => '見積書の承認依頼',
                'icon' => 'FileText',
                'color' => '#3B82F6',
                'default_approval_flow_id' => $defaultFlow->id,
                'is_active' => true,
                'sort_order' => 1,
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'code' => 'budget',
                'name' => '予算承認',
                'description' => '予算の承認依頼',
                'icon' => 'DollarSign',
                'color' => '#10B981',
                'default_approval_flow_id' => $defaultFlow->id,
                'is_active' => true,
                'sort_order' => 2,
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'code' => 'purchase',
                'name' => '購入承認',
                'description' => '購入の承認依頼',
                'icon' => 'ShoppingCart',
                'color' => '#F59E0B',
                'default_approval_flow_id' => $defaultFlow->id,
                'is_active' => true,
                'sort_order' => 3,
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'code' => 'expense',
                'name' => '経費承認',
                'description' => '経費の承認依頼',
                'icon' => 'Receipt',
                'color' => '#EF4444',
                'default_approval_flow_id' => $defaultFlow->id,
                'is_active' => true,
                'sort_order' => 4,
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'code' => 'schedule',
                'name' => 'スケジュール承認',
                'description' => 'スケジュールの承認依頼',
                'icon' => 'Calendar',
                'color' => '#8B5CF6',
                'default_approval_flow_id' => $defaultFlow->id,
                'is_active' => true,
                'sort_order' => 5,
                'created_by' => 1,
                'updated_by' => 1,
            ],
        ];

        foreach ($requestTypes as $typeData) {
            ApprovalRequestType::updateOrCreate(
                ['code' => $typeData['code']],
                $typeData
            );
        }

        // 承認依頼テンプレートの初期データ
        $templates = [
            [
                'name' => '標準見積承認テンプレート',
                'description' => '一般的な見積承認に使用するテンプレート',
                'request_type' => 'estimate',
                'template_data' => [
                    'title' => '見積承認依頼',
                    'fields' => [
                        'project_name' => 'プロジェクト名',
                        'amount' => '金額',
                        'deadline' => '期限',
                        'notes' => '備考'
                    ]
                ],
                'is_active' => true,
                'is_system' => true,
                'usage_count' => 0,
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'name' => '緊急見積承認テンプレート',
                'description' => '緊急案件用の見積承認テンプレート',
                'request_type' => 'estimate',
                'template_data' => [
                    'title' => '緊急見積承認依頼',
                    'fields' => [
                        'project_name' => 'プロジェクト名',
                        'amount' => '金額',
                        'urgency_reason' => '緊急理由',
                        'deadline' => '期限'
                    ]
                ],
                'is_active' => true,
                'is_system' => true,
                'usage_count' => 0,
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'name' => '標準予算承認テンプレート',
                'description' => '一般的な予算承認に使用するテンプレート',
                'request_type' => 'budget',
                'template_data' => [
                    'title' => '予算承認依頼',
                    'fields' => [
                        'budget_name' => '予算名',
                        'amount' => '金額',
                        'period' => '期間',
                        'purpose' => '用途'
                    ]
                ],
                'is_active' => true,
                'is_system' => true,
                'usage_count' => 0,
                'created_by' => 1,
                'updated_by' => 1,
            ],
        ];

        foreach ($templates as $templateData) {
            ApprovalRequestTemplate::updateOrCreate(
                ['name' => $templateData['name']],
                $templateData
            );
        }
    }
}
