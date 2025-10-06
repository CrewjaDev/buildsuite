<?php

/**
 * ABAC見積管理特化テスト（tinker用）
 * 
 * 使用方法:
 * docker exec -it buildsuite-backend-container php artisan tinker
 * >>> require 'test_abac_estimate.php';
 */

echo "=== ABAC見積管理特化テスト ===\n\n";

// 1. 見積関連の現在のデータ確認
echo "1. 見積関連の現在のデータ確認\n";
echo "   見積データ: " . \App\Models\Estimate::count() . "件\n";
echo "   見積関連ポリシー: " . \App\Models\AccessPolicy::where('business_code', 'estimate')->count() . "件\n";
echo "   見積関連権限: " . \App\Models\Permission::where('name', 'like', 'estimate%')->count() . "件\n\n";

// 2. 見積管理の実用的なテストケース作成
echo "2. 見積管理の実用的なテストケース作成\n";

// 見積管理で使用されるユーザーコンテキスト
$estimateUsers = [
    'sales_manager' => [
        'user' => [
            'id' => 2,
            'name' => '営業部長',
            'department_id' => 1, // 営業部
            'position_id' => 1,   // 部長
            'system_level' => 'admin'
        ],
        'position' => [
            'id' => 1,
            'name' => '部長',
            'level' => 5
        ],
        'department' => [
            'id' => 1,
            'name' => '営業部',
            'level' => 1
        ]
    ],
    'sales_supervisor' => [
        'user' => [
            'id' => 3,
            'name' => '営業課長',
            'department_id' => 1, // 営業部
            'position_id' => 2,   // 課長
            'system_level' => 'supervisor'
        ],
        'position' => [
            'id' => 2,
            'name' => '課長',
            'level' => 3
        ],
        'department' => [
            'id' => 1,
            'name' => '営業部',
            'level' => 1
        ]
    ],
    'sales_staff' => [
        'user' => [
            'id' => 4,
            'name' => '営業担当',
            'department_id' => 1, // 営業部
            'position_id' => 3,   // 担当
            'system_level' => 'staff'
        ],
        'position' => [
            'id' => 3,
            'name' => '担当',
            'level' => 1
        ],
        'department' => [
            'id' => 1,
            'name' => '営業部',
            'level' => 1
        ]
    ],
    'construction_manager' => [
        'user' => [
            'id' => 5,
            'name' => '工事部長',
            'department_id' => 2, // 工事部
            'position_id' => 1,   // 部長
            'system_level' => 'admin'
        ],
        'position' => [
            'id' => 1,
            'name' => '部長',
            'level' => 5
        ],
        'department' => [
            'id' => 2,
            'name' => '工事部',
            'level' => 1
        ]
    ]
];

// 見積管理の実際のシナリオ
$estimateScenarios = [
    'small_estimate' => [
        'estimate' => [
            'id' => 1,
            'estimate_number' => 'EST-2025-001',
            'total_amount' => 500000,  // 50万円
            'subtotal' => 450000,
            'tax_amount' => 50000,
            'status' => 'draft',
            'created_by' => 4, // 営業担当
            'department_id' => 1
        ],
        'data' => [
            'amount' => 500000,
            'department_id' => 1,
            'project_type' => 'renovation',
            'partner_id' => 1
        ]
    ],
    'medium_estimate' => [
        'estimate' => [
            'id' => 2,
            'estimate_number' => 'EST-2025-002',
            'total_amount' => 5000000, // 500万円
            'subtotal' => 4500000,
            'tax_amount' => 500000,
            'status' => 'pending_approval',
            'created_by' => 3, // 営業課長
            'department_id' => 1
        ],
        'data' => [
            'amount' => 5000000,
            'department_id' => 1,
            'project_type' => 'construction',
            'partner_id' => 2
        ]
    ],
    'large_estimate' => [
        'estimate' => [
            'id' => 3,
            'estimate_number' => 'EST-2025-003',
            'total_amount' => 50000000, // 5000万円
            'subtotal' => 45000000,
            'tax_amount' => 5000000,
            'status' => 'approved',
            'created_by' => 2, // 営業部長
            'department_id' => 1
        ],
        'data' => [
            'amount' => 50000000,
            'department_id' => 1,
            'project_type' => 'large_construction',
            'partner_id' => 3
        ]
    ],
    'cross_department_estimate' => [
        'estimate' => [
            'id' => 4,
            'estimate_number' => 'EST-2025-004',
            'total_amount' => 10000000, // 1000万円
            'subtotal' => 9000000,
            'tax_amount' => 1000000,
            'status' => 'draft',
            'created_by' => 5, // 工事部長
            'department_id' => 2
        ],
        'data' => [
            'amount' => 10000000,
            'department_id' => 2,
            'project_type' => 'construction',
            'partner_id' => 4
        ]
    ]
];

echo "   テストユーザー: " . count($estimateUsers) . "種類\n";
echo "   テストシナリオ: " . count($estimateScenarios) . "種類\n\n";

// 3. 見積管理のABACポリシー評価テスト
echo "3. 見積管理のABACポリシー評価テスト\n";

$abacService = app(\App\Services\ABACPolicyService::class);

foreach ($estimateUsers as $userType => $userContext) {
    echo "   ユーザータイプ: {$userType}\n";
    
    foreach ($estimateScenarios as $scenarioName => $scenario) {
        echo "     シナリオ: {$scenarioName} (金額: " . number_format($scenario['data']['amount']) . "円)\n";
        
        // コンテキストとデータをマージ
        $fullContext = array_merge($userContext, $scenario);
        
        // 見積関連のポリシーを取得
        $estimatePolicies = \App\Models\AccessPolicy::where('business_code', 'estimate')
            ->where('is_active', true)
            ->get();
        
        echo "       関連ポリシー数: " . $estimatePolicies->count() . "\n";
        
        $policyResults = [];
        foreach ($estimatePolicies as $policy) {
            try {
                $result = $policy->evaluateConditions($fullContext);
                $effect = $result ? ($policy->effect === 'allow' ? '許可' : '拒否') : '条件不一致';
                $policyResults[] = [
                    'name' => $policy->name,
                    'result' => $effect,
                    'priority' => $policy->priority
                ];
                echo "         - {$policy->name}: {$effect}\n";
            } catch (Exception $e) {
                echo "         - {$policy->name}: エラー - " . $e->getMessage() . "\n";
            }
        }
        
        // 最終的なアクセス判定
        $allowPolicies = array_filter($policyResults, function($p) {
            return $p['result'] === '許可';
        });
        $denyPolicies = array_filter($policyResults, function($p) {
            return $p['result'] === '拒否';
        });
        
        if (!empty($denyPolicies)) {
            $finalDecision = '拒否';
        } elseif (!empty($allowPolicies)) {
            $finalDecision = '許可';
        } else {
            $finalDecision = '条件不一致';
        }
        
        echo "       最終判定: {$finalDecision}\n";
    }
    echo "\n";
}

// 4. 見積管理の具体的なアクション別テスト
echo "4. 見積管理の具体的なアクション別テスト\n";

$estimateActions = [
    'view' => '見積閲覧',
    'create' => '見積作成',
    'edit' => '見積編集',
    'delete' => '見積削除',
    'approve' => '見積承認',
    'reject' => '見積却下'
];

foreach ($estimateActions as $action => $actionName) {
    echo "   アクション: {$actionName}\n";
    
    // 該当するポリシーを取得
    $actionPolicies = \App\Models\AccessPolicy::where('business_code', 'estimate')
        ->where('action', $action)
        ->where('is_active', true)
        ->get();
    
    echo "     関連ポリシー数: " . $actionPolicies->count() . "\n";
    
    // 各ユーザータイプでのテスト
    foreach ($estimateUsers as $userType => $userContext) {
        $testScenario = $estimateScenarios['medium_estimate'];
        $fullContext = array_merge($userContext, $testScenario);
        
        $hasAccess = false;
        foreach ($actionPolicies as $policy) {
            try {
                $result = $policy->evaluateConditions($fullContext);
                if ($result && $policy->effect === 'allow') {
                    $hasAccess = true;
                    break;
                }
            } catch (Exception $e) {
                // エラーは無視
            }
        }
        
        echo "       {$userType}: " . ($hasAccess ? 'アクセス可能' : 'アクセス不可') . "\n";
    }
    echo "\n";
}

// 5. 見積金額による権限制御のテスト
echo "5. 見積金額による権限制御のテスト\n";

$amountTests = [
    100000,   // 10万円
    1000000,  // 100万円
    5000000,  // 500万円
    10000000, // 1000万円
    50000000  // 5000万円
];

$testUser = $estimateUsers['sales_staff']; // 一般社員でテスト

foreach ($amountTests as $amount) {
    echo "   金額: " . number_format($amount) . "円\n";
    
    $testContext = array_merge($testUser, [
        'data' => [
            'amount' => $amount,
            'department_id' => 1,
            'project_type' => 'construction'
        ]
    ]);
    
    $amountPolicies = \App\Models\AccessPolicy::where('business_code', 'estimate')
        ->where('is_active', true)
        ->get();
    
    $canAccess = false;
    foreach ($amountPolicies as $policy) {
        try {
            $result = $policy->evaluateConditions($testContext);
            if ($result && $policy->effect === 'allow') {
                $canAccess = true;
                break;
            }
        } catch (Exception $e) {
            // エラーは無視
        }
    }
    
    echo "     一般社員のアクセス: " . ($canAccess ? '可能' : '不可') . "\n";
}

echo "\n";

// 6. 見積管理の実用的なポリシー作成テスト
echo "6. 見積管理の実用的なポリシー作成テスト\n";

// 実用的な見積ポリシーを作成
$practicalPolicies = [
    [
        'name' => '見積閲覧権限（部署内）',
        'description' => '自分の部署の見積のみ閲覧可能',
        'business_code' => 'estimate',
        'action' => 'view',
        'resource_type' => 'estimate',
        'conditions' => [
            'operator' => 'and',
            'rules' => [
                [
                    'field' => 'user.department_id',
                    'operator' => 'eq',
                    'value' => 'data.department_id'
                ]
            ]
        ],
        'effect' => 'allow',
        'priority' => 100
    ],
    [
        'name' => '見積編集権限（作成者のみ）',
        'description' => '自分が作成した見積のみ編集可能',
        'business_code' => 'estimate',
        'action' => 'edit',
        'resource_type' => 'estimate',
        'conditions' => [
            'operator' => 'and',
            'rules' => [
                [
                    'field' => 'user.id',
                    'operator' => 'eq',
                    'value' => 'data.created_by'
                ],
                [
                    'field' => 'data.status',
                    'operator' => 'in',
                    'value' => ['draft', 'pending_approval']
                ]
            ]
        ],
        'effect' => 'allow',
        'priority' => 90
    ],
    [
        'name' => '見積承認権限（課長以上）',
        'description' => '課長以上のみ見積承認可能',
        'business_code' => 'estimate',
        'action' => 'approve',
        'resource_type' => 'estimate',
        'conditions' => [
            'operator' => 'and',
            'rules' => [
                [
                    'field' => 'position.level',
                    'operator' => 'gte',
                    'value' => 3
                ]
            ]
        ],
        'effect' => 'allow',
        'priority' => 80
    ]
];

$createdPolicies = [];
foreach ($practicalPolicies as $policyData) {
    $policy = \App\Models\AccessPolicy::create(array_merge($policyData, [
        'is_active' => true
    ]));
    $createdPolicies[] = $policy;
    echo "   ポリシー作成: {$policy->name} (ID: {$policy->id})\n";
}

echo "\n";

// 7. 作成したポリシーのテスト
echo "7. 作成したポリシーのテスト\n";

$testCases = [
    'same_department_view' => [
        'user' => $estimateUsers['sales_staff']['user'],
        'position' => $estimateUsers['sales_staff']['position'],
        'data' => [
            'department_id' => 1,
            'created_by' => 4,
            'status' => 'draft'
        ]
    ],
    'different_department_view' => [
        'user' => $estimateUsers['sales_staff']['user'],
        'position' => $estimateUsers['sales_staff']['position'],
        'data' => [
            'department_id' => 2,
            'created_by' => 5,
            'status' => 'draft'
        ]
    ],
    'own_estimate_edit' => [
        'user' => $estimateUsers['sales_staff']['user'],
        'position' => $estimateUsers['sales_staff']['position'],
        'data' => [
            'department_id' => 1,
            'created_by' => 4,
            'status' => 'draft'
        ]
    ],
    'others_estimate_edit' => [
        'user' => $estimateUsers['sales_staff']['user'],
        'position' => $estimateUsers['sales_staff']['position'],
        'data' => [
            'department_id' => 1,
            'created_by' => 3,
            'status' => 'draft'
        ]
    ],
    'supervisor_approve' => [
        'user' => $estimateUsers['sales_supervisor']['user'],
        'position' => $estimateUsers['sales_supervisor']['position'],
        'data' => [
            'department_id' => 1,
            'created_by' => 4,
            'status' => 'pending_approval'
        ]
    ],
    'staff_approve' => [
        'user' => $estimateUsers['sales_staff']['user'],
        'position' => $estimateUsers['sales_staff']['position'],
        'data' => [
            'department_id' => 1,
            'created_by' => 4,
            'status' => 'pending_approval'
        ]
    ]
];

foreach ($testCases as $caseName => $context) {
    echo "   テストケース: {$caseName}\n";
    
    foreach ($createdPolicies as $policy) {
        try {
            $result = $policy->evaluateConditions($context);
            $effect = $result ? ($policy->effect === 'allow' ? '許可' : '拒否') : '条件不一致';
            echo "     - {$policy->name}: {$effect}\n";
        } catch (Exception $e) {
            echo "     - {$policy->name}: エラー - " . $e->getMessage() . "\n";
        }
    }
    echo "\n";
}

// 8. テスト用ポリシーのクリーンアップ
echo "8. テスト用ポリシーのクリーンアップ\n";
foreach ($createdPolicies as $policy) {
    $policy->delete();
    echo "   削除: {$policy->name}\n";
}

echo "\n=== 見積管理特化テスト完了 ===\n";
echo "✅ ABAC見積管理システムの検証が完了しました！\n";

// tinkerで使用するための変数を返す
return [
    'estimateUsers' => $estimateUsers,
    'estimateScenarios' => $estimateScenarios,
    'estimateActions' => $estimateActions,
    'abacService' => $abacService,
];
