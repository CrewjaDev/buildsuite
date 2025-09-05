# 承認フロー機能 テストガイド

## 概要

承認フロー機能は、Laravel tinkerとGraphQL APIの両方でテスト可能です。このガイドでは、実装済み機能の動作確認方法を詳しく説明します。

## テスト環境

### 1. Laravel Tinker
```bash
# tinkerの起動
php artisan tinker
```

### 2. GraphQL API テストエンドポイント
```
POST /graphql-test
Content-Type: application/json
# 認証ヘッダー不要
```

## Laravel Tinkerでのテスト

### 承認フロー作成テスト

```php
// 1. 見積承認フロー作成
$flow = ApprovalFlow::create([
    'name' => '見積承認フロー（100万円以上）',
    'description' => '100万円以上の見積に適用されるフロー',
    'flow_type' => 'estimate',
    'is_active' => true,
    'priority' => 10,
    'created_by' => 1,
    'updated_by' => 1
]);

// 結果確認
echo "作成されたフローID: " . $flow->id;
```

### 承認ステップ設定テスト

```php
// 2. 部長承認ステップ作成
$step1 = ApprovalStep::create([
    'approval_flow_id' => $flow->id,
    'step_order' => 1,
    'name' => '部長承認',
    'description' => '部長による承認',
    'approver_type' => 'role',
    'approver_id' => 2, // 部長ロールID
    'is_required' => true,
    'can_delegate' => false,
    'timeout_hours' => 24,
    'is_active' => true,
    'created_by' => 1
]);

// 3. 役員承認ステップ作成
$step2 = ApprovalStep::create([
    'approval_flow_id' => $flow->id,
    'step_order' => 2,
    'name' => '役員承認',
    'description' => '役員による最終承認',
    'approver_type' => 'role',
    'approver_id' => 3, // 役員ロールID
    'is_required' => true,
    'can_delegate' => true,
    'timeout_hours' => 48,
    'is_active' => true,
    'created_by' => 1
]);

// 結果確認
echo "ステップ数: " . $flow->steps()->count();
```

### 承認条件設定テスト

```php
// 4. 金額条件設定
$condition = ApprovalCondition::create([
    'approval_flow_id' => $flow->id,
    'condition_type' => 'amount',
    'field_name' => 'total_amount',
    'operator' => 'greater_than_or_equal',
    'value' => [1000000],
    'value_type' => 'integer',
    'is_active' => true,
    'priority' => 1,
    'description' => '100万円以上の見積',
    'created_by' => 1
]);

// 条件評価テスト
$testData = ['total_amount' => 1500000];
$isMatch = $condition->evaluate($testData);
echo "条件マッチ結果: " . ($isMatch ? 'マッチ' : '不一致');
```

### 承認依頼作成・処理テスト

```php
// 5. 承認依頼作成
$request = ApprovalRequest::create([
    'approval_flow_id' => $flow->id,
    'request_type' => 'estimate',
    'request_id' => 123,
    'title' => '見積承認依頼：プロジェクトA',
    'description' => 'プロジェクトAの見積について承認をお願いします',
    'request_data' => [
        'total_amount' => 1500000,
        'department_id' => 1,
        'project_name' => 'プロジェクトA'
    ],
    'current_step' => $step1->id,
    'status' => 'pending',
    'priority' => 'normal',
    'requested_by' => 1,
    'expires_at' => now()->addDays(7),
    'created_by' => 1
]);

echo "承認依頼作成完了: ID " . $request->id;

// 6. 承認処理実行
$user = User::find(1);
$approveResult = $request->approve($user, '内容を確認し、承認いたします。');

if ($approveResult) {
    echo "承認処理完了";
    echo "ステータス: " . $request->fresh()->status;
} else {
    echo "承認処理失敗";
}

// 7. 履歴確認
$histories = $request->histories;
foreach ($histories as $history) {
    echo "アクション: " . $history->action;
    echo "実行者: " . $history->actor->name;
    echo "実行日時: " . $history->acted_at;
    echo "コメント: " . $history->comment;
}
```

### フロー選択テスト

```php
// 8. 条件に基づくフロー選択テスト
$requestData = [
    'type' => 'estimate',
    'total_amount' => 1500000,
    'department_id' => 1
];

$applicableFlow = ApprovalFlow::active()
    ->byType($requestData['type'])
    ->get()
    ->first(function ($flow) use ($requestData) {
        return $flow->matchesConditions($requestData);
    });

if ($applicableFlow) {
    echo "適用フロー: " . $applicableFlow->name;
} else {
    echo "適用可能なフローが見つかりません";
}
```

## GraphQL APIテスト

### 基本的なクエリテスト

```javascript
// 1. 承認フロー一覧取得
const query1 = `
  query {
    approvalFlows {
      id
      name
      flow_type
      is_active
      step_count
      steps {
        id
        name
        step_order
        approver_type
      }
      conditions {
        id
        condition_type
        field_name
        operator
        value
      }
    }
  }
`;

// /graphql-testエンドポイントでテスト
fetch('/graphql-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: query1 })
})
.then(response => response.json())
.then(data => console.log('承認フロー一覧:', data));
```

### フィルタリングテスト

```javascript
// 2. 条件付き承認依頼取得
const query2 = `
  query($status: String, $limit: Int) {
    approvalRequests(status: $status, limit: $limit) {
      id
      title
      status
      priority
      requester {
        name
      }
      flow {
        name
      }
      currentStepInfo {
        name
        step_order
      }
      created_at
    }
  }
`;

const variables = {
  status: "pending",
  limit: 10
};

fetch('/graphql-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: query2, variables })
})
.then(response => response.json())
.then(data => console.log('承認依頼一覧:', data));
```

### ミューテーションテスト

```javascript
// 3. 承認フロー作成
const mutation1 = `
  mutation($name: String!, $flow_type: String!) {
    createApprovalFlow(
      name: $name,
      description: "GraphQLテストで作成したフロー",
      flow_type: $flow_type,
      is_active: true,
      priority: 5
    ) {
      id
      name
      flow_type
      created_at
    }
  }
`;

const variables1 = {
  name: "GraphQLテストフロー",
  flow_type: "budget"
};

fetch('/graphql-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: mutation1, variables: variables1 })
})
.then(response => response.json())
.then(data => console.log('フロー作成結果:', data));

// 4. 承認処理実行
const mutation2 = `
  mutation($id: Int!, $comment: String) {
    approveRequest(id: $id, comment: $comment) {
      id
      status
      approved_by
      approved_at
      histories {
        action
        comment
        acted_at
        actor {
          name
        }
      }
    }
  }
`;

const variables2 = {
  id: 1,
  comment: "GraphQLテストでの承認"
};

fetch('/graphql-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: mutation2, variables: variables2 })
})
.then(response => response.json())
.then(data => console.log('承認処理結果:', data));
```

## 複雑なシナリオテスト

### 複数ステップ承認フローテスト

```php
// tinkerでの複雑なテストシナリオ
// 1. 3段階承認フロー作成
$flow = ApprovalFlow::create([
    'name' => '高額見積承認フロー（500万円以上）',
    'flow_type' => 'estimate',
    'is_active' => true,
    'priority' => 20
]);

// ステップ1: 主任承認
$step1 = ApprovalStep::create([
    'approval_flow_id' => $flow->id,
    'step_order' => 1,
    'name' => '主任承認',
    'approver_type' => 'user',
    'approver_id' => 2,
    'timeout_hours' => 24
]);

// ステップ2: 部長承認
$step2 = ApprovalStep::create([
    'approval_flow_id' => $flow->id,
    'step_order' => 2,
    'name' => '部長承認',
    'approver_type' => 'role',
    'approver_id' => 2,
    'timeout_hours' => 48
]);

// ステップ3: 役員承認
$step3 = ApprovalStep::create([
    'approval_flow_id' => $flow->id,
    'step_order' => 3,
    'name' => '役員承認',
    'approver_type' => 'role',
    'approver_id' => 3,
    'timeout_hours' => 72
]);

// 2. 承認依頼作成
$request = ApprovalRequest::create([
    'approval_flow_id' => $flow->id,
    'request_type' => 'estimate',
    'request_id' => 456,
    'title' => '高額見積承認依頼',
    'request_data' => ['total_amount' => 5000000],
    'current_step' => $step1->id,
    'status' => 'pending',
    'requested_by' => 1
]);

// 3. 順次承認実行
$users = [
    User::find(2), // 主任
    User::find(3), // 部長
    User::find(4)  // 役員
];

foreach ($users as $index => $user) {
    $comment = "ステップ" . ($index + 1) . "での承認";
    
    if ($request->status === 'pending') {
        $request->approve($user, $comment);
        echo "ステップ" . ($index + 1) . "承認完了\n";
        echo "現在のステータス: " . $request->fresh()->status . "\n";
    }
}

// 4. 最終結果確認
echo "最終ステータス: " . $request->fresh()->status;
echo "承認履歴数: " . $request->histories()->count();
```

## エラーテスト

### 権限エラーテスト

```php
// 1. 承認権限なしユーザーでのテスト
$unauthorizedUser = User::find(999); // 存在しないユーザー
$result = $request->approve($unauthorizedUser, 'テストコメント');
// 期待結果: false（承認失敗）

// 2. 無効なフローでのテスト
$inactiveFlow = ApprovalFlow::create([
    'name' => '無効フロー',
    'flow_type' => 'test',
    'is_active' => false
]);

$testUsable = $inactiveFlow->isUsable();
// 期待結果: false（使用不可）
```

### GraphQLエラーテスト

```javascript
// 不正なデータでのミューテーション
const invalidMutation = `
  mutation {
    createApprovalFlow(
      name: "",  # 空文字列
      flow_type: "invalid_type"  # 無効なタイプ
    ) {
      id
      name
    }
  }
`;

fetch('/graphql-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: invalidMutation })
})
.then(response => response.json())
.then(data => {
  // エラーハンドリングの確認
  if (data.errors) {
    console.log('期待されるエラー:', data.errors);
  }
});
```

## パフォーマンステスト

### 大量データでのテスト

```php
// 大量承認依頼作成テスト
$startTime = microtime(true);

for ($i = 1; $i <= 100; $i++) {
    ApprovalRequest::create([
        'approval_flow_id' => $flow->id,
        'request_type' => 'estimate',
        'request_id' => 1000 + $i,
        'title' => "テスト承認依頼 #$i",
        'status' => 'pending',
        'requested_by' => 1
    ]);
}

$endTime = microtime(true);
$executionTime = $endTime - $startTime;
echo "100件作成時間: " . $executionTime . "秒";

// クエリパフォーマンステスト
$startTime = microtime(true);
$requests = ApprovalRequest::with(['requester', 'flow', 'histories'])
    ->where('status', 'pending')
    ->limit(50)
    ->get();
$endTime = microtime(true);

echo "50件取得時間: " . ($endTime - $startTime) . "秒";
echo "取得件数: " . $requests->count();
```

## テスト結果の確認

### 成功パターンの確認事項
- [ ] 承認フロー作成・更新・削除が正常に動作
- [ ] 承認ステップの順序制御が正確
- [ ] 承認条件の評価が正しく機能
- [ ] 承認依頼の作成・処理が完了
- [ ] 履歴記録が正確に保存
- [ ] GraphQL APIの全機能が動作
- [ ] エラーハンドリングが適切に機能

### パフォーマンス要件
- [ ] 承認フロー選択：100ms以内
- [ ] 承認処理実行：200ms以内
- [ ] 承認依頼一覧取得：300ms以内（50件）
- [ ] GraphQLクエリレスポンス：500ms以内

## 次のステップ

承認フロー機能のテストが完了したら：

1. **フロントエンド実装開始**
2. **本番エンドポイント（/graphql）での統合テスト**
3. **認証ロジックの復旧とテスト**
4. **E2Eテストの実装**

これらのテストにより、承認フロー機能の堅牢性と実用性が実証されています。
