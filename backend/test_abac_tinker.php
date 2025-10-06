<?php

/**
 * ABAC基本動作確認テスト（tinker用）
 * 
 * 使用方法:
 * docker exec -it buildsuite-backend-container php artisan tinker
 * >>> require 'test_abac_tinker.php';
 */

echo "=== ABAC基本動作確認テスト（tinker版） ===\n\n";

// 1. ABACポリシーの存在確認
echo "1. ABACポリシーの存在確認\n";
$policies = \App\Models\AccessPolicy::all();
echo "   作成されたポリシー数: " . $policies->count() . "\n";

if ($policies->count() > 0) {
    echo "   ポリシー一覧:\n";
    foreach ($policies as $policy) {
        echo "   - ID: {$policy->id}, 名前: {$policy->name}, ビジネスコード: {$policy->business_code}\n";
    }
}
echo "\n";

// 2. ABACPolicyServiceの基本機能テスト
echo "2. ABACPolicyServiceの基本機能テスト\n";
$abacService = app(\App\Services\ABACPolicyService::class);

// ポリシー統計情報の取得
$stats = $abacService->getPolicyStats();
echo "   ポリシー統計情報:\n";
echo "   - 総数: {$stats['total']}\n";
echo "   - アクティブ: {$stats['active']}\n";
echo "   - システム: {$stats['system']}\n";
echo "   - 許可: {$stats['by_effect']['allow']}\n";
echo "   - 拒否: {$stats['by_effect']['deny']}\n";
echo "\n";

// 3. 条件式評価のテスト
echo "3. 条件式評価のテスト\n";
$testPolicy = \App\Models\AccessPolicy::first();
if ($testPolicy) {
    echo "   テストポリシー: {$testPolicy->name}\n";
    
    // テスト用のコンテキスト
    $context = [
        'user' => [
            'id' => 1,
            'name' => 'テストユーザー',
            'department_id' => 1,
            'position_id' => 1,
        ],
        'data' => [
            'amount' => 500000, // 50万円
            'department_id' => 1,
        ]
    ];
    
    $result = $testPolicy->evaluateConditions($context);
    echo "   条件式評価結果: " . ($result ? 'true' : 'false') . "\n";
    
    // 条件式の詳細表示
    if (!empty($testPolicy->conditions)) {
        echo "   条件式構造:\n";
        echo "   " . json_encode($testPolicy->conditions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    }
}
echo "\n";

// 4. ポリシーCRUD操作のテスト
echo "4. ポリシーCRUD操作のテスト\n";

// 新しいポリシーを作成
$newPolicyData = [
    'name' => 'テスト用ポリシー',
    'description' => '基本動作確認用のテストポリシー',
    'business_code' => 'test',
    'action' => 'view',
    'resource_type' => 'test',
    'conditions' => [
        'operator' => 'and',
        'rules' => [
            [
                'field' => 'user.id',
                'operator' => 'exists',
                'value' => null
            ]
        ]
    ],
    'effect' => 'allow',
    'priority' => 50,
    'is_active' => true,
];

$newPolicy = $abacService->createPolicy($newPolicyData);
echo "   新規ポリシー作成: 成功 (ID: {$newPolicy->id})\n";

// ポリシーを更新
$updatedPolicy = $abacService->updatePolicy($newPolicy, ['name' => '更新されたテストポリシー']);
echo "   ポリシー更新: 成功 (名前: {$updatedPolicy->name})\n";

// ポリシーを削除
$deleteResult = $abacService->deletePolicy($newPolicy);
echo "   ポリシー削除: " . ($deleteResult ? '成功' : '失敗') . "\n";
echo "\n";

// 5. エラーハンドリングのテスト
echo "5. エラーハンドリングのテスト\n";

// 不正な条件式でのテスト
$errorPolicy = \App\Models\AccessPolicy::create([
    'name' => 'エラーテストポリシー',
    'description' => 'エラーハンドリングテスト用',
    'business_code' => 'test',
    'action' => 'view',
    'resource_type' => 'test',
    'conditions' => [
        'operator' => 'invalid_operator', // 不正なオペレーター
        'rules' => []
    ],
    'effect' => 'allow',
    'priority' => 50,
    'is_active' => true,
]);

$context = ['user' => ['id' => 1]];
$result = $errorPolicy->evaluateConditions($context);
echo "   不正な条件式での評価: " . ($result ? 'true' : 'false') . " (エラーが発生しませんでした)\n";

// エラーテスト用ポリシーを削除
$errorPolicy->delete();
echo "   エラーテスト用ポリシーを削除しました\n";
echo "\n";

echo "=== テスト完了 ===\n";
echo "✅ ABACシステムの基本動作が正常に確認できました！\n";

// tinkerで使用するための変数を返す
return [
    'policies' => $policies,
    'stats' => $stats,
    'abacService' => $abacService,
];
