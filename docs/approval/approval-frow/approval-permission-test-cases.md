# 承認権限システム テスト項目

## 概要
実装した承認権限システムの包括的なテスト項目を定義します。

## テスト対象機能

### 1. ApprovalPermissionService
### 2. ApprovalFlow（ステップ別設定）
### 3. ApprovalRequestController（新エンドポイント）
### 4. 2層権限チェックシステム

---

## 1. ApprovalPermissionService テスト

### 1.1 基本権限チェック

#### テストケース 1.1.1: 編集権限チェック
```php
// テストデータ
$user = User::find(1);
$approvalRequest = ApprovalRequest::find(1);

// 期待結果
$result = $approvalPermissionService->canEdit($user, $approvalRequest);
```

**テスト項目:**
- [ ] フロー設定で編集が許可されている場合、trueを返す
- [ ] フロー設定で編集が禁止されている場合、falseを返す
- [ ] ユーザーに編集権限がない場合、falseを返す
- [ ] ユーザーに編集権限がある場合、trueを返す
- [ ] 業務ロジック（ステータス、サブステータス）で編集不可の場合、falseを返す

#### テストケース 1.1.2: キャンセル権限チェック
```php
$result = $approvalPermissionService->canCancel($user, $approvalRequest);
```

**テスト項目:**
- [ ] フロー設定でキャンセルが許可されている場合、trueを返す
- [ ] フロー設定でキャンセルが禁止されている場合、falseを返す
- [ ] ユーザーにキャンセル権限がない場合、falseを返す
- [ ] ユーザーにキャンセル権限がある場合、trueを返す
- [ ] 業務ロジックでキャンセル不可の場合、falseを返す

#### テストケース 1.1.3: 承認権限チェック
```php
$result = $approvalPermissionService->canApprove($user, $approvalRequest);
```

**テスト項目:**
- [ ] ユーザーに承認権限がない場合、falseを返す
- [ ] ユーザーに承認権限がある場合、trueを返す
- [ ] ユーザーが承認者でない場合、falseを返す
- [ ] ユーザーが承認者である場合、trueを返す

#### テストケース 1.1.4: 却下権限チェック
```php
$result = $approvalPermissionService->canReject($user, $approvalRequest);
```

**テスト項目:**
- [ ] ユーザーに却下権限がない場合、falseを返す
- [ ] ユーザーに却下権限がある場合、trueを返す
- [ ] ユーザーが承認者でない場合、falseを返す
- [ ] ユーザーが承認者である場合、trueを返す

#### テストケース 1.1.5: 差し戻し権限チェック
```php
$result = $approvalPermissionService->canReturn($user, $approvalRequest);
```

**テスト項目:**
- [ ] ユーザーに差し戻し権限がない場合、falseを返す
- [ ] ユーザーに差し戻し権限がある場合、trueを返す
- [ ] ユーザーが承認者でない場合、falseを返す
- [ ] ユーザーが承認者である場合、trueを返す

### 1.2 ユーザー権限情報取得

#### テストケース 1.2.1: getUserPermissions
```php
$permissions = $approvalPermissionService->getUserPermissions($user, $approvalRequest);
```

**テスト項目:**
- [ ] 編集権限が正しく取得される
- [ ] キャンセル権限が正しく取得される
- [ ] 承認権限が正しく取得される
- [ ] 却下権限が正しく取得される
- [ ] 差し戻し権限が正しく取得される
- [ ] 依頼者フラグが正しく設定される
- [ ] 承認者フラグが正しく設定される

---

## 2. ApprovalFlow ステップ別設定テスト

### 2.1 ステップ別設定の初期化

#### テストケース 2.1.1: initializeStepConfigs
```php
$flow = ApprovalFlow::find(1);
$result = $flow->initializeStepConfigs();
```

**テスト項目:**
- [ ] 全ステップの設定が初期化される
- [ ] デフォルト値が正しく設定される
- [ ] 既存の設定が上書きされない
- [ ] 戻り値がtrueになる

### 2.2 ステップ別編集条件設定

#### テストケース 2.2.1: setStepEditingConditions
```php
$conditions = [
    'allow_during_pending' => true,
    'allow_during_reviewing' => false,
    'allow_during_step_approved' => true,
    'allow_during_expired' => false,
];
$result = $flow->setStepEditingConditions(1, $conditions);
```

**テスト項目:**
- [ ] ステップ1の編集条件が正しく設定される
- [ ] 戻り値がtrueになる
- [ ] データベースに正しく保存される
- [ ] 他のステップの設定に影響しない

#### テストケース 2.2.2: getStepEditingConfig
```php
$config = $flow->getStepEditingConfig(1);
```

**テスト項目:**
- [ ] ステップ1の編集条件が正しく取得される
- [ ] 設定されていないステップの場合はデフォルト値が返される
- [ ] 配列形式で正しく返される

### 2.3 ステップ別キャンセル条件設定

#### テストケース 2.3.1: setStepCancellationConditions
```php
$conditions = [
    'allow_during_pending' => true,
    'allow_during_reviewing' => false,
    'allow_during_step_approved' => false,
    'allow_during_expired' => false,
];
$result = $flow->setStepCancellationConditions(1, $conditions);
```

**テスト項目:**
- [ ] ステップ1のキャンセル条件が正しく設定される
- [ ] 戻り値がtrueになる
- [ ] データベースに正しく保存される
- [ ] 他のステップの設定に影響しない

#### テストケース 2.3.2: getStepCancellationConfig
```php
$config = $flow->getStepCancellationConfig(1);
```

**テスト項目:**
- [ ] ステップ1のキャンセル条件が正しく取得される
- [ ] 設定されていないステップの場合はデフォルト値が返される
- [ ] 配列形式で正しく返される

### 2.4 設定検証

#### テストケース 2.4.1: validateStepConfig
```php
// 有効な設定
$validConfig = [
    'editing_conditions' => [
        'allow_during_pending' => true,
        'allow_during_reviewing' => false,
    ]
];
$errors = $flow->validateStepConfig(1, $validConfig);

// 無効な設定
$invalidConfig = [
    'editing_conditions' => [
        'invalid_key' => true,
        'allow_during_pending' => 'invalid_value'
    ]
];
$errors = $flow->validateStepConfig(1, $invalidConfig);
```

**テスト項目:**
- [ ] 有効な設定の場合、エラー配列が空になる
- [ ] 無効なキーの場合、エラーメッセージが返される
- [ ] 無効な値の場合、エラーメッセージが返される
- [ ] 複数のエラーが正しく検出される

---

## 3. ApprovalRequestController 新エンドポイントテスト

### 3.1 編集開始エンドポイント

#### テストケース 3.1.1: startEditing
```php
// POST /api/approval-requests/{id}/start-editing
$response = $this->postJson("/api/approval-requests/1/start-editing");
```

**テスト項目:**
- [ ] 認証されていない場合、401エラーが返される
- [ ] 編集権限がない場合、403エラーが返される
- [ ] 編集を開始できない場合、400エラーが返される
- [ ] 正常に編集開始できる場合、200レスポンスが返される
- [ ] レスポンスに編集中ユーザー情報が含まれる
- [ ] データベースに編集状態が正しく保存される

### 3.2 編集終了エンドポイント

#### テストケース 3.2.1: stopEditing
```php
// POST /api/approval-requests/{id}/stop-editing
$response = $this->postJson("/api/approval-requests/1/stop-editing");
```

**テスト項目:**
- [ ] 認証されていない場合、401エラーが返される
- [ ] 編集を終了できない場合、400エラーが返される
- [ ] 正常に編集終了できる場合、200レスポンスが返される
- [ ] データベースから編集状態が正しく削除される

### 3.3 審査開始エンドポイント

#### テストケース 3.3.1: startReviewing
```php
// POST /api/approval-requests/{id}/start-reviewing
$response = $this->postJson("/api/approval-requests/1/start-reviewing");
```

**テスト項目:**
- [ ] 認証されていない場合、401エラーが返される
- [ ] 承認者でない場合、403エラーが返される
- [ ] 審査を開始できない場合、400エラーが返される
- [ ] 正常に審査開始できる場合、200レスポンスが返される
- [ ] データベースに審査状態が正しく保存される

### 3.4 既存エンドポイントの更新

#### テストケース 3.4.1: show（権限情報追加）
```php
// GET /api/approval-requests/{id}
$response = $this->getJson("/api/approval-requests/1");
```

**テスト項目:**
- [ ] レスポンスに`user_permissions`が含まれる
- [ ] 編集中ユーザー情報が含まれる
- [ ] ステータス表示情報が含まれる
- [ ] 権限情報が正しく設定される

#### テストケース 3.4.2: approve（権限チェック更新）
```php
// POST /api/approval-requests/{id}/approve
$response = $this->postJson("/api/approval-requests/1/approve", [
    'comment' => '承認します'
]);
```

**テスト項目:**
- [ ] 承認権限がない場合、403エラーが返される
- [ ] 正常に承認できる場合、200レスポンスが返される
- [ ] サブステータスが正しくクリアされる

#### テストケース 3.4.3: reject（権限チェック更新）
```php
// POST /api/approval-requests/{id}/reject
$response = $this->postJson("/api/approval-requests/1/reject", [
    'comment' => '却下します'
]);
```

**テスト項目:**
- [ ] 却下権限がない場合、403エラーが返される
- [ ] 正常に却下できる場合、200レスポンスが返される
- [ ] サブステータスが正しくクリアされる

#### テストケース 3.4.4: return（権限チェック更新）
```php
// POST /api/approval-requests/{id}/return
$response = $this->postJson("/api/approval-requests/1/return", [
    'comment' => '差し戻します'
]);
```

**テスト項目:**
- [ ] 差し戻し権限がない場合、403エラーが返される
- [ ] 正常に差し戻しできる場合、200レスポンスが返される
- [ ] サブステータスが正しくクリアされる

#### テストケース 3.4.5: cancel（権限チェック更新）
```php
// POST /api/approval-requests/{id}/cancel
$response = $this->postJson("/api/approval-requests/1/cancel", [
    'comment' => 'キャンセルします'
]);
```

**テスト項目:**
- [ ] キャンセル権限がない場合、403エラーが返される
- [ ] 正常にキャンセルできる場合、200レスポンスが返される
- [ ] サブステータスが正しくクリアされる

---

## 4. 2層権限チェックシステムテスト

### 4.1 レイヤー1: フロー設定チェック

#### テストケース 4.1.1: 基本設定チェック
```php
// フロー設定で編集を禁止
$flow->updateFlowConfig(['allow_editing_after_request' => false]);
$result = $approvalPermissionService->canEdit($user, $approvalRequest);
```

**テスト項目:**
- [ ] `allow_editing_after_request`がfalseの場合、編集不可
- [ ] `allow_cancellation_after_request`がfalseの場合、キャンセル不可
- [ ] 設定がtrueの場合、次のレイヤーに進む

#### テストケース 4.1.2: ステップ別設定チェック
```php
// ステップ1で審査中の編集を禁止
$flow->setStepEditingConditions(1, [
    'allow_during_reviewing' => false
]);
$approvalRequest->sub_status = 'reviewing';
$result = $approvalPermissionService->canEdit($user, $approvalRequest);
```

**テスト項目:**
- [ ] `allow_during_pending`の設定が正しく適用される
- [ ] `allow_during_reviewing`の設定が正しく適用される
- [ ] `allow_during_step_approved`の設定が正しく適用される
- [ ] `allow_during_expired`の設定が正しく適用される
- [ ] サブステータスがnullの場合、'null'として扱われる

### 4.2 レイヤー2: ユーザー権限チェック

#### テストケース 4.2.1: 権限チェック
```php
// ユーザーに権限がない場合
$user->permissions = []; // 権限なし
$result = $approvalPermissionService->canEdit($user, $approvalRequest);

// ユーザーに権限がある場合
$user->permissions = ['estimate.edit']; // 権限あり
$result = $approvalPermissionService->canEdit($user, $approvalRequest);
```

**テスト項目:**
- [ ] `estimate.edit`権限がない場合、編集不可
- [ ] `estimate.edit`権限がある場合、次のレイヤーに進む
- [ ] `estimate.approval.approve`権限がない場合、承認不可
- [ ] `estimate.approval.reject`権限がない場合、却下不可
- [ ] `estimate.approval.return`権限がない場合、差し戻し不可

### 4.3 レイヤー3: 業務ロジックチェック

#### テストケース 4.3.1: ステータスチェック
```php
// 承認済みの場合は編集不可
$approvalRequest->status = 'approved';
$result = $approvalPermissionService->canEdit($user, $approvalRequest);
```

**テスト項目:**
- [ ] ステータスが'pending'でない場合、編集不可
- [ ] サブステータスが編集可能でない場合、編集不可
- [ ] 排他制御で他のユーザーが編集中の場合、編集不可
- [ ] 承認者でない場合、承認操作不可

---

## 5. 統合テスト

### 5.1 エンドツーエンドテスト

#### テストケース 5.1.1: 承認フロー全体
```php
// 1. 承認依頼作成
$request = $this->postJson('/api/approval-requests', $requestData);

// 2. 編集開始
$edit = $this->postJson("/api/approval-requests/{$id}/start-editing");

// 3. 編集終了
$stop = $this->postJson("/api/approval-requests/{$id}/stop-editing");

// 4. 審査開始
$review = $this->postJson("/api/approval-requests/{$id}/start-reviewing");

// 5. 承認
$approve = $this->postJson("/api/approval-requests/{$id}/approve", [
    'comment' => '承認します'
]);
```

**テスト項目:**
- [ ] 各ステップで適切な権限チェックが行われる
- [ ] ステータスとサブステータスが正しく遷移する
- [ ] 排他制御が正しく動作する
- [ ] フロー設定が正しく適用される

### 5.2 エラーケーステスト

#### テストケース 5.2.1: 権限エラー
```php
// 権限のないユーザーで操作
$response = $this->actingAs($unauthorizedUser)
    ->postJson("/api/approval-requests/1/approve");
```

**テスト項目:**
- [ ] 403エラーが返される
- [ ] 適切なエラーメッセージが返される
- [ ] データベースが変更されない

#### テストケース 5.2.2: 競合エラー
```php
// 複数ユーザーが同時に編集開始
$user1 = $this->postJson("/api/approval-requests/1/start-editing");
$user2 = $this->postJson("/api/approval-requests/1/start-editing");
```

**テスト項目:**
- [ ] 最初のユーザーは成功
- [ ] 2番目のユーザーは400エラー
- [ ] 適切なエラーメッセージが返される

---

## 6. パフォーマンステスト

### 6.1 権限チェック性能

#### テストケース 6.1.1: 大量データでの権限チェック
```php
// 1000件の承認依頼で権限チェック
$requests = ApprovalRequest::limit(1000)->get();
foreach ($requests as $request) {
    $permissions = $approvalPermissionService->getUserPermissions($user, $request);
}
```

**テスト項目:**
- [ ] 1件あたりの処理時間が許容範囲内
- [ ] メモリ使用量が許容範囲内
- [ ] データベースクエリが最適化されている

---

## 7. セキュリティテスト

### 7.1 権限昇格テスト

#### テストケース 7.1.1: 不正な権限取得
```php
// 権限のないユーザーが直接APIを呼び出し
$response = $this->actingAs($lowPrivilegeUser)
    ->postJson("/api/approval-requests/1/approve");
```

**テスト項目:**
- [ ] 権限昇格が防がれる
- [ ] 適切なエラーレスポンスが返される
- [ ] ログに記録される

### 7.2 データ漏洩テスト

#### テストケース 7.2.1: 他ユーザーのデータアクセス
```php
// 他のユーザーの承認依頼にアクセス
$response = $this->actingAs($user1)
    ->getJson("/api/approval-requests/{$user2RequestId}");
```

**テスト項目:**
- [ ] アクセス権限がない場合は403エラー
- [ ] データが漏洩しない
- [ ] 適切なエラーメッセージが返される

---

## テスト実行手順

### 1. 環境準備
```bash
# テストデータベースの準備
php artisan migrate:fresh --seed

# テスト用の承認フローとユーザーを作成
php artisan tinker
```

### 2. 単体テスト実行
```bash
# ApprovalPermissionServiceのテスト
php artisan test --filter=ApprovalPermissionServiceTest

# ApprovalFlowのテスト
php artisan test --filter=ApprovalFlowTest

# ApprovalRequestControllerのテスト
php artisan test --filter=ApprovalRequestControllerTest
```

### 3. 統合テスト実行
```bash
# 全テスト実行
php artisan test

# 特定の機能テスト
php artisan test --filter=ApprovalPermission
```

### 4. パフォーマンステスト実行
```bash
# パフォーマンステスト
php artisan test --filter=PerformanceTest
```

---

## テスト結果の記録

### テスト結果テンプレート
```
テストケース: [ケース名]
実行日時: [YYYY-MM-DD HH:MM:SS]
結果: [PASS/FAIL]
実行時間: [秒]
エラーメッセージ: [エラーがある場合]
備考: [その他の情報]
```

### カバレッジ目標
- **単体テスト**: 90%以上
- **統合テスト**: 80%以上
- **エンドツーエンドテスト**: 70%以上

---

## 注意事項

1. **テストデータの管理**: 各テストで独立したデータを使用
2. **並行実行**: 排他制御のテストでは並行実行を考慮
3. **権限設定**: テスト用の権限設定を適切に管理
4. **データクリーンアップ**: テスト後のデータクリーンアップを確実に実行
5. **ログ確認**: セキュリティテストではログの確認も実施
