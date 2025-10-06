<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ApprovalFlow;
use App\Models\User;
use App\Models\Department;
use App\Models\Position;
use App\Models\SystemLevel;
use App\Models\Employee;

class ApprovalFlowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        try {
            echo "ApprovalFlowSeeder開始\n";
            
            // 基本データの確認・作成
            echo "基本データ作成中...\n";
            $this->createBasicData();
            echo "基本データ作成完了\n";
            
            // 1. 部署別承認フロー
            echo "部署別承認フロー作成中...\n";
            $this->createTeamBasedFlows();
            echo "部署別承認フロー作成完了\n";
            
            // 2. 金額別承認フロー
            echo "金額別承認フロー作成中...\n";
            $this->createAmountBasedFlows();
            echo "金額別承認フロー作成完了\n";
            
            // 3. 条件分岐承認フロー
            echo "条件分岐承認フロー作成中...\n";
            $this->createConditionalFlows();
            echo "条件分岐承認フロー作成完了\n";
            
            // 4. 複雑な承認フロー（並列承認、段階的承認）
            echo "複雑な承認フロー作成中...\n";
            $this->createComplexFlows();
            echo "複雑な承認フロー作成完了\n";
            
            // 5. 仕様書準拠の承認フロー
            echo "仕様書準拠の承認フロー作成中...\n";
            $this->createSpecificationBasedFlows();
            echo "仕様書準拠の承認フロー作成完了\n";
            
            echo "ApprovalFlowSeeder完了\n";
        } catch (\Exception $e) {
            echo "エラー: " . $e->getMessage() . "\n";
            echo "スタックトレース: " . $e->getTraceAsString() . "\n";
            throw $e;
        }
    }
    
    /**
     * 基本データの作成
     */
    private function createBasicData(): void
    {
        // システム権限レベルは既存のSystemLevelSeederで作成済み
        // ここでは追加のデータのみ作成
        
        // 部署は既存のDepartmentSeederで作成済み
        // ここでは追加のデータのみ作成
        
        // 職位は既存のPositionSeederで作成済み
        // ここでは追加のデータのみ作成
        
        
        // ユーザーは既存のUserSeederで作成済み
        // 承認フローテストに必要な追加ユーザーを作成
        
        // 工事部のテストユーザー（承認フローテスト用）
        $constructionEmployee = Employee::firstOrCreate(
            ['employee_id' => 'CONST001'],
            [
                'name' => '工事部テストユーザー',
                'name_kana' => 'コウジブテストユーザー',
                'email' => 'construction@example.com',
                'department_id' => 3, // 工事部
                'position_id' => 2, // 担当
            ]
        );

        $constructionUser = User::firstOrCreate(
            ['login_id' => 'construction_user'],
            [
                'password' => bcrypt('password'),
                'system_level' => 'construction_manager',
                'employee_id' => $constructionEmployee->id,
                'is_active' => true,
            ]
        );
        
        // 経理部のテストユーザー（承認フローテスト用）
        $accountingEmployee = Employee::firstOrCreate(
            ['employee_id' => 'ACCT001'],
            [
                'name' => '経理部ユーザー',
                'email' => 'accounting@example.com',
                'department_id' => 2, // 経理部
                'position_id' => 3, // 課長
            ]
        );

        $accountingUser = User::firstOrCreate(
            ['login_id' => 'accounting_user'],
            [
                'password' => bcrypt('password'),
                'system_level' => 'accounting_manager',
                'employee_id' => $accountingEmployee->id,
                'is_active' => true,
            ]
        );
    }
    
    /**
     * 部署別承認フロー
     */
    private function createTeamBasedFlows(): void
    {
        // 営業部承認フロー
        ApprovalFlow::create([
            'name' => '営業部承認フロー',
            'description' => '営業部専用の承認フロー',
            'flow_type' => 'estimate',
            'conditions' => [
                'departments' => [1], // 営業部
            ],
            'requesters' => [
                ['type' => 'department', 'value' => 1, 'display_name' => '営業部'],
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        ['type' => 'department', 'value' => 1, 'display_name' => '営業部'],
                    ],
                    'available_permissions' => ['estimate.approval.request'],
                ],
                [
                    'step' => 1,
                    'name' => '上長承認',
                    'approvers' => [
                        ['type' => 'user', 'value' => 2, 'display_name' => '山田太郎'], // UserSeederで作成されるユーザー
                    ],
                    'available_permissions' => [
                        'estimate.approval.approve',
                        'estimate.approval.return',
                    ],
                    'approval_type' => 'required',
                ],
                [
                    'step' => 2,
                    'name' => '社長承認',
                    'approvers' => [
                        ['type' => 'user', 'value' => 1, 'display_name' => 'システム管理者'], // UserSeederで作成される管理者
                    ],
                    'available_permissions' => [
                        'estimate.approval.approve',
                        'estimate.approval.reject',
                        'estimate.approval.return',
                    ],
                    'approval_type' => 'required',
                ],
            ],
            'priority' => 1,
            'is_active' => true,
        ]);
    }
    
    /**
     * 金額別承認フロー
     */
    private function createAmountBasedFlows(): void
    {
        // 小額承認フロー（100万円未満）
        ApprovalFlow::create([
            'name' => '小額承認フロー',
            'description' => '100万円未満の見積承認フロー',
            'flow_type' => 'estimate',
            'conditions' => [
                'amount_min' => 0,
                'amount_max' => 1000000,
            ],
            'requesters' => [
                ['type' => 'system_level', 'value' => 'staff', 'display_name' => '担当者'],
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        ['type' => 'system_level', 'value' => 'staff', 'display_name' => '担当者'],
                    ],
                    'available_permissions' => ['estimate.approval.request'],
                ],
                [
                    'step' => 1,
                    'name' => '上長承認',
                    'approvers' => [
                        ['type' => 'system_level', 'value' => 'supervisor', 'display_name' => '上長'],
                    ],
                    'available_permissions' => [
                        'estimate.approval.approve',
                        'estimate.approval.return',
                    ],
                    'approval_type' => 'required',
                ],
            ],
            'priority' => 1,
            'is_active' => true,
        ]);
    }
    
    /**
     * 条件分岐承認フロー
     */
    private function createConditionalFlows(): void
    {
        // 発注承認フロー（新規業者・既存業者で分岐）
        ApprovalFlow::create([
            'name' => '発注承認フロー',
            'description' => '業者タイプによる条件分岐承認フロー',
            'flow_type' => 'purchase',
            'conditions' => [
                'vendor_types' => ['new', 'existing'],
            ],
            'requesters' => [
                ['type' => 'position', 'value' => 1, 'display_name' => '社員'],
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        ['type' => 'position', 'value' => 1, 'display_name' => '社員'],
                    ],
                    'available_permissions' => ['purchase.approval.request'],
                ],
                [
                    'step' => 1,
                    'name' => '新規業者承認',
                    'approvers' => [
                        [
                            'type' => 'conditional',
                            'condition' => [
                                'field' => 'vendor_type',
                                'operator' => '==',
                                'value' => 'new',
                            ],
                            'approvers' => [
                                ['type' => 'system_level', 'value' => 'supervisor', 'display_name' => '上長'],
                            ],
                        ],
                    ],
                    'available_permissions' => [
                        'purchase.approval.approve',
                        'purchase.approval.return',
                    ],
                    'approval_type' => 'required',
                ],
            ],
            'priority' => 1,
            'is_active' => true,
        ]);
    }
    
    /**
     * 複雑な承認フロー
     */
    private function createComplexFlows(): void
    {
        // 並列承認フロー
        ApprovalFlow::create([
            'name' => '並列承認フロー',
            'description' => '複数の承認者による並列承認フロー',
            'flow_type' => 'contract',
            'conditions' => [
                'amount_min' => 10000000,
            ],
            'requesters' => [
                ['type' => 'system_level', 'value' => 'construction_manager', 'display_name' => '工事責任者'],
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        ['type' => 'system_level', 'value' => 'construction_manager', 'display_name' => '工事責任者'],
                    ],
                    'available_permissions' => ['contract.approval.request'],
                ],
                [
                    'step' => 1,
                    'name' => '並列承認',
                    'approvers' => [
                        ['type' => 'user', 'value' => 1, 'display_name' => '山田太郎'],
                        ['type' => 'user', 'value' => 2, 'display_name' => '佐藤花子'],
                        ['type' => 'user', 'value' => 4, 'display_name' => '野瀬社長'],
                    ],
                    'available_permissions' => [
                        'contract.approval.approve',
                        'contract.approval.reject',
                        'contract.approval.return',
                    ],
                    'approval_type' => 'majority', // 過半数承認
                ],
            ],
            'priority' => 1,
            'is_active' => true,
        ]);
    }

    /**
     * 仕様書準拠の承認フローを作成
     */
    private function createSpecificationBasedFlows(): void
    {
        // 1. 見積承認フロー（仕様書例1: ステップ承認フロー）
        ApprovalFlow::create([
            'name' => '見積承認フロー（仕様書準拠）',
            'description' => '仕様書に記載された見積承認フローの例',
            'flow_type' => 'estimate',
            'conditions' => [
                'amount_min' => 0,
                'amount_max' => 10000000,
            ],
            'requesters' => [
                [
                    'type' => 'system_level',
                    'value' => 'staff',
                    'display_name' => '担当者'
                ]
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'staff',
                            'display_name' => '担当者'
                        ]
                    ],
                    'available_permissions' => [
                        'estimate.approval.request'
                    ]
                ],
                [
                    'step' => 1,
                    'name' => '第1承認',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'construction_manager',
                            'display_name' => '上長'
                        ]
                    ],
                    'available_permissions' => [
                        'estimate.approval.approve',
                        'estimate.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ],
                [
                    'step' => 2,
                    'name' => '第2承認',
                    'approvers' => [
                        [
                            'type' => 'position',
                            'value' => 2, // 部長職位
                            'display_name' => '部長'
                        ]
                    ],
                    'available_permissions' => [
                        'estimate.approval.approve',
                        'estimate.approval.reject',
                        'estimate.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ],
                [
                    'step' => 3,
                    'name' => '最終承認',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'system_admin',
                            'display_name' => '最高責任者'
                        ]
                    ],
                    'available_permissions' => [
                        'estimate.approval.approve',
                        'estimate.approval.reject',
                        'estimate.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ]
            ],
            'priority' => 1,
            'is_active' => true,
        ]);

        // 2. 予算承認フロー（金額条件付き）
        ApprovalFlow::create([
            'name' => '予算承認フロー（高額案件）',
            'description' => '高額予算案件用の承認フロー',
            'flow_type' => 'budget',
            'conditions' => [
                'amount_min' => 5000000,
                'amount_max' => 50000000,
            ],
            'requesters' => [
                [
                    'type' => 'department',
                    'value' => 1, // 営業部
                    'display_name' => '営業部'
                ],
                [
                    'type' => 'department',
                    'value' => 2, // 工事部
                    'display_name' => '工事部'
                ]
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'staff',
                            'display_name' => '担当者'
                        ]
                    ],
                    'available_permissions' => [
                        'budget.approval.request'
                    ]
                ],
                [
                    'step' => 1,
                    'name' => '部門承認',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'construction_manager',
                            'display_name' => '部門長'
                        ]
                    ],
                    'available_permissions' => [
                        'budget.approval.approve',
                        'budget.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ],
                [
                    'step' => 2,
                    'name' => '経営陣承認',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'system_admin',
                            'display_name' => '経営陣'
                        ]
                    ],
                    'available_permissions' => [
                        'budget.approval.approve',
                        'budget.approval.reject',
                        'budget.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ]
            ],
            'priority' => 2,
            'is_active' => true,
        ]);

        // 3. 工事承認フロー（条件分岐付き）
        ApprovalFlow::create([
            'name' => '工事承認フロー（条件分岐）',
            'description' => '工事種別に応じた条件分岐承認フロー',
            'flow_type' => 'construction',
            'conditions' => [
                'amount_min' => 1000000,
                'amount_max' => 100000000,
                'project_types' => ['construction', 'renovation'],
            ],
            'requesters' => [
                [
                    'type' => 'department',
                    'value' => 2, // 工事部
                    'display_name' => '工事部'
                ]
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'staff',
                            'display_name' => '担当者'
                        ]
                    ],
                    'available_permissions' => [
                        'construction.approval.request'
                    ]
                ],
                [
                    'step' => 1,
                    'name' => '技術承認',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'construction_manager',
                            'display_name' => '技術責任者'
                        ]
                    ],
                    'available_permissions' => [
                        'construction.approval.approve',
                        'construction.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ],
                [
                    'step' => 2,
                    'name' => '安全承認',
                    'approvers' => [
                        [
                            'type' => 'position',
                            'value' => 3, // 安全管理者
                            'display_name' => '安全管理者'
                        ]
                    ],
                    'available_permissions' => [
                        'construction.approval.approve',
                        'construction.approval.reject',
                        'construction.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ],
                [
                    'step' => 3,
                    'name' => '最終承認',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'system_admin',
                            'display_name' => '最高責任者'
                        ]
                    ],
                    'available_permissions' => [
                        'construction.approval.approve',
                        'construction.approval.reject',
                        'construction.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ]
            ],
            'priority' => 3,
            'is_active' => true,
        ]);

        // 4. 一般承認フロー（シンプル）
        ApprovalFlow::create([
            'name' => '一般承認フロー（シンプル）',
            'description' => '一般的な承認業務用のシンプルなフロー',
            'flow_type' => 'general',
            'conditions' => [
                'amount_min' => 0,
                'amount_max' => 1000000,
            ],
            'requesters' => [
                [
                    'type' => 'system_level',
                    'value' => 'staff',
                    'display_name' => '担当者'
                ]
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'staff',
                            'display_name' => '担当者'
                        ]
                    ],
                    'available_permissions' => [
                        'general.approval.request'
                    ]
                ],
                [
                    'step' => 1,
                    'name' => '上長承認',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'construction_manager',
                            'display_name' => '上長'
                        ]
                    ],
                    'available_permissions' => [
                        'general.approval.approve',
                        'general.approval.reject',
                        'general.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ]
            ],
            'priority' => 10,
            'is_active' => true,
        ]);

        // 5. システム管理承認フロー
        ApprovalFlow::create([
            'name' => 'システム管理承認フロー',
            'description' => 'システム管理関連の承認フロー',
            'flow_type' => 'system',
            'conditions' => [],
            'requesters' => [
                [
                    'type' => 'system_level',
                    'value' => 'system_admin',
                    'display_name' => 'システム管理者'
                ]
            ],
            'approval_steps' => [
                [
                    'step' => 0,
                    'name' => '承認依頼作成',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'system_admin',
                            'display_name' => 'システム管理者'
                        ]
                    ],
                    'available_permissions' => [
                        'system.approval.request'
                    ]
                ],
                [
                    'step' => 1,
                    'name' => 'システム承認',
                    'approvers' => [
                        [
                            'type' => 'system_level',
                            'value' => 'system_admin',
                            'display_name' => 'システム管理者'
                        ]
                    ],
                    'available_permissions' => [
                        'system.approval.approve',
                        'system.approval.reject',
                        'system.approval.return'
                    ],
                    'condition' => [
                        'type' => 'required',
                        'display_name' => '必須承認'
                    ]
                ]
            ],
            'priority' => 5,
            'is_active' => true,
        ]);
    }
}