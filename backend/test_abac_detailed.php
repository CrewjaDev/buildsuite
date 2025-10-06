<?php

/**
 * ABAC詳細検証テスト（tinker用）
 * 
 * 使用方法:
 * docker exec -it buildsuite-backend-container php artisan tinker
 * >>> require 'test_abac_detailed.php';
 */

echo "=== ABAC詳細検証テスト ===\n\n";

// 1. 現在のポリシー状況の詳細確認
echo "1. 現在のポリシー状況の詳細確認\n";
$policies = \App\Models\AccessPolicy::all();
echo "   総ポリシー数: " . $policies->count() . "\n";

// 重複ポリシーの確認
$duplicates = $policies->groupBy('name')->filter(function($group) {
    return $group->count() > 1;
});

if ($duplicates->count() > 0) {
    echo "   重複ポリシー:\n";
    foreach ($duplicates as $name => $group) {
        echo "   - {$name}: " . $group->count() . "件\n";
    }
}

// ビジネスコード別のポリシー数
$businessCodeStats = $policies->groupBy('business_code')->map(function($group) {
    return $group->count();
});
echo "   ビジネスコード別ポリシー数:\n";
foreach ($businessCodeStats as $code => $count) {
    echo "   - {$code}: {$count}件\n";
}
echo "\n";

// 2. 実用的なテストケースの作成
echo "2. 実用的なテストケースの作成\n";

// テスト用ユーザーコンテキスト
$testContexts = [
    'manager' => [
        'user' => [
            'id' => 2,
            'name' => '管理者',
            'department_id' => 1,
            'position_id' => 1,
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
    'supervisor' => [
        'user' => [
            'id' => 3,
            'name' => '課長',
            'department_id' => 2,
            'position_id' => 2,
            'system_level' => 'supervisor'
        ],
        'position' => [
            'id' => 2,
            'name' => '課長',
            'level' => 3
        ],
        'department' => [
            'id' => 2,
            'name' => '工事部',
            'level' => 1
        ]
    ],
    'staff' => [
        'user' => [
            'id' => 4,
            'name' => '一般社員',
            'department_id' => 3,
            'position_id' => 3,
            'system_level' => 'staff'
        ],
        'position' => [
            'id' => 3,
            'name' => '担当',
            'level' => 1
        ],
        'department' => [
            'id' => 3,
            'name' => '総務部',
            'level' => 1
        ]
    ]
];

// テスト用データ
$testData = [
    'estimate' => [
        'amount' => 5000000, // 500万円
        'department_id' => 1,
        'project_type' => 'construction'
    ],
    'budget' => [
        'amount' => 10000000, // 1000万円
        'department_id' => 2,
        'fiscal_year' => 2025
    ],
    'approval' => [
        'amount' => 2000000, // 200万円
        'department_id' => 1,
        'approval_type' => 'estimate'
    ]
];

echo "   テストコンテキスト: " . count($testContexts) . "種類\n";
echo "   テストデータ: " . count($testData) . "種類\n\n";

// 3. ポリシー評価の詳細テスト
echo "3. ポリシー評価の詳細テスト\n";

$abacService = app(\App\Services\ABACPolicyService::class);

foreach ($testContexts as $contextName => $context) {
    echo "   コンテキスト: {$contextName}\n";
    
    foreach ($testData as $dataType => $data) {
        echo "     データタイプ: {$dataType}\n";
        
        // コンテキストとデータをマージ
        $fullContext = array_merge($context, ['data' => $data]);
        
        // 該当するポリシーを取得
        $relevantPolicies = \App\Models\AccessPolicy::where('business_code', $dataType)
            ->where('is_active', true)
            ->get();
        
        echo "       関連ポリシー数: " . $relevantPolicies->count() . "\n";
        
        foreach ($relevantPolicies as $policy) {
            try {
                $result = $policy->evaluateConditions($fullContext);
                $effect = $result ? ($policy->effect === 'allow' ? '許可' : '拒否') : '条件不一致';
                echo "       - {$policy->name}: {$effect}\n";
            } catch (Exception $e) {
                echo "       - {$policy->name}: エラー - " . $e->getMessage() . "\n";
            }
        }
    }
    echo "\n";
}

// 4. 複雑な条件式のテスト
echo "4. 複雑な条件式のテスト\n";

// 複雑な条件式を持つポリシーを作成
$complexPolicy = \App\Models\AccessPolicy::create([
    'name' => '複雑条件テストポリシー',
    'description' => '複雑な条件式のテスト用',
    'business_code' => 'test',
    'action' => 'view',
    'resource_type' => 'test',
    'conditions' => [
        'operator' => 'and',
        'rules' => [
            [
                'operator' => 'or',
                'rules' => [
                    [
                        'field' => 'user.system_level',
                        'operator' => 'in',
                        'value' => ['admin', 'manager']
                    ],
                    [
                        'field' => 'position.level',
                        'operator' => 'gte',
                        'value' => 3
                    ]
                ]
            ],
            [
                'field' => 'data.amount',
                'operator' => 'lte',
                'value' => 10000000
            ],
            [
                'field' => 'department.level',
                'operator' => 'eq',
                'value' => 1
            ]
        ]
    ],
    'effect' => 'allow',
    'priority' => 50,
    'is_active' => true,
]);

echo "   複雑な条件式ポリシーを作成: ID {$complexPolicy->id}\n";

// 複雑な条件式のテスト
$complexContext = [
    'user' => [
        'id' => 3,
        'system_level' => 'supervisor'
    ],
    'position' => [
        'level' => 3
    ],
    'department' => [
        'level' => 1
    ],
    'data' => [
        'amount' => 5000000
    ]
];

$complexResult = $complexPolicy->evaluateConditions($complexContext);
echo "   複雑条件式の評価結果: " . ($complexResult ? 'true' : 'false') . "\n";

// テスト用ポリシーを削除
$complexPolicy->delete();
echo "   テスト用ポリシーを削除しました\n\n";

// 5. パフォーマンステスト
echo "5. パフォーマンステスト\n";

$startTime = microtime(true);
$iterations = 100;

for ($i = 0; $i < $iterations; $i++) {
    $testPolicy = \App\Models\AccessPolicy::first();
    if ($testPolicy) {
        $testPolicy->evaluateConditions($testContexts['manager']);
    }
}

$endTime = microtime(true);
$executionTime = ($endTime - $startTime) * 1000; // ミリ秒
$avgTime = $executionTime / $iterations;

echo "   {$iterations}回の評価実行時間: " . number_format($executionTime, 2) . "ms\n";
echo "   平均実行時間: " . number_format($avgTime, 2) . "ms\n";
echo "   1秒あたりの評価数: " . number_format(1000 / $avgTime, 0) . "回\n\n";

// 6. エラーハンドリングの詳細テスト
echo "6. エラーハンドリングの詳細テスト\n";

$errorTests = [
    '存在しないフィールド' => [
        'user' => ['id' => 1],
        'data' => ['amount' => 1000]
    ],
    '不正なデータ型' => [
        'user' => ['id' => 'invalid'],
        'data' => ['amount' => 'not_a_number']
    ],
    '空のコンテキスト' => [],
    'null値' => [
        'user' => null,
        'data' => null
    ]
];

foreach ($errorTests as $testName => $context) {
    $testPolicy = \App\Models\AccessPolicy::first();
    if ($testPolicy) {
        try {
            $result = $testPolicy->evaluateConditions($context);
            echo "   {$testName}: 正常処理 (結果: " . ($result ? 'true' : 'false') . ")\n";
        } catch (Exception $e) {
            echo "   {$testName}: エラー - " . $e->getMessage() . "\n";
        }
    }
}

echo "\n=== 詳細検証テスト完了 ===\n";
echo "✅ ABACシステムの詳細検証が完了しました！\n";

// tinkerで使用するための変数を返す
return [
    'policies' => $policies,
    'testContexts' => $testContexts,
    'testData' => $testData,
    'abacService' => $abacService,
];
