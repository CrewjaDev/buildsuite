# 権限チェックユーティリティ

## 概要

BuildSuiteシステムにおける権限判定の共通化と汎用化を目的としたユーティリティメソッド群です。メニュー表示、ボタン表示、ページ要素の表示・非表示など、様々な場面で権限に基づく判定を行うことができます。

## 権限の命名規則

### 基本構造
```
{ビジネスコードID}.{最小単位のpermissionコード}
```

### パターン分類

#### 1. 基本操作権限
```
{code}.{action}
```
- **例**: `estimate.use`, `estimate.create`, `estimate.view`, `estimate.edit`, `estimate.delete`, `estimate.list`
- **対象**: 見積、予算、発注、工事、一般、部署、社員、取引先、役割、権限、システム

#### 2. 承認操作権限
```
{code}.approval.{action}
```
- **例**: `estimate.approval.request`, `estimate.approval.approve`, `estimate.approval.reject`
- **対象**: 見積、予算、発注、工事、一般、承認設定

#### 3. 承認フロー操作権限
```
approval.flow.{action}
```
- **例**: `approval.flow.create`, `approval.flow.edit`, `approval.flow.delete`
- **対象**: 承認フロー管理

#### 4. システム承認権限
```
approval.{action}
```
- **例**: `approval.authority`, `approval.list`, `approval.use`
- **対象**: システム全体の承認管理

## ユーティリティメソッド

### 1. ビジネスコード権限チェック

#### `hasAnyBusinessCodePermission(User $user, string $businessCode, array $permissionNames): bool`

ビジネスコードのいずれかの権限を持っているかチェックします。

**パラメータ:**
- `$user`: ユーザーオブジェクト
- `$businessCode`: ビジネスコード（例: 'estimate', 'budget'）
- `$permissionNames`: 権限名の配列（例: ['use', 'list', 'create']）

**戻り値:**
- `bool`: いずれかの権限を持っている場合 `true`

**使用例:**
```php
// 見積の利用・一覧・作成のいずれかの権限があるかチェック
if (PermissionService::hasAnyBusinessCodePermission($user, 'estimate', ['use', 'list', 'create'])) {
    // 見積関連の機能を表示
}
```

### 2. 複数権限チェック

#### `hasAnyPermission(User $user, array $permissionNames): bool`

指定された権限のいずれかを持っているかチェックします。

**パラメータ:**
- `$user`: ユーザーオブジェクト
- `$permissionNames`: 完全な権限名の配列（例: ['estimate.use', 'estimate.create']）

**戻り値:**
- `bool`: いずれかの権限を持っている場合 `true`

**使用例:**
```php
// 承認者権限または承認依頼権限があるかチェック
if (PermissionService::hasAnyPermission($user, ['approval.authority', 'estimate.approval.request'])) {
    // 承認関連の機能を表示
}
```

#### `hasAllPermissions(User $user, array $permissionNames): bool`

指定された権限をすべて持っているかチェックします。

**パラメータ:**
- `$user`: ユーザーオブジェクト
- `$permissionNames`: 完全な権限名の配列

**戻り値:**
- `bool`: すべての権限を持っている場合 `true`

**使用例:**
```php
// 見積の作成・編集・削除のすべての権限があるかチェック
if (PermissionService::hasAllPermissions($user, ['estimate.create', 'estimate.edit', 'estimate.delete'])) {
    // 見積の完全管理機能を表示
}
```

### 3. メニュー・要素表示用

#### `canAccessMenu(User $user, string $businessCode, string $action): bool`

メニュー表示用の権限チェックです。

**パラメータ:**
- `$user`: ユーザーオブジェクト
- `$businessCode`: ビジネスコード
- `$action`: アクション（例: 'use', 'create', 'approval.request'）

**戻り値:**
- `bool`: 権限を持っている場合 `true`

**使用例:**
```php
// 見積管理メニューの表示判定
if (PermissionService::canAccessMenu($user, 'estimate', 'use')) {
    // 見積管理メニューを表示
}

// 承認管理メニューの表示判定
if (PermissionService::canAccessMenu($user, 'approval', 'authority')) {
    // 承認管理メニューを表示
}
```

#### `canShowElement(User $user, array $requiredPermissions): bool`

ページ要素表示用の権限チェックです。

**パラメータ:**
- `$user`: ユーザーオブジェクト
- `$requiredPermissions`: 必要な権限の配列

**戻り値:**
- `bool`: いずれかの権限を持っている場合 `true`

**使用例:**
```php
// 複数の権限のいずれかがあれば要素を表示
if (PermissionService::canShowElement($user, ['estimate.create', 'estimate.edit', 'estimate.delete'])) {
    // 見積管理ボタンを表示
}
```

## 実装例

### 1. ダッシュボードでの使用

```php
// DashboardController.php
foreach ($businessLogicCodes as $code => $config) {
    // ユーザーがこのビジネスコードの権限を持っているかチェック
    if (PermissionService::hasAnyBusinessCodePermission($user, $code, $config['default_permissions'])) {
        $businessCodeStats[$code] = $this->getStatsForBusinessCode($user, $code, $config);
    }
}
```

### 2. メニュー表示での使用

```php
// MenuController.php
public function getMenuItems(User $user): array
{
    $menuItems = [];
    
    // 見積管理メニュー
    if (PermissionService::canAccessMenu($user, 'estimate', 'use')) {
        $menuItems[] = [
            'name' => '見積管理',
            'url' => '/estimates',
            'icon' => 'file-text'
        ];
    }
    
    // 承認管理メニュー
    if (PermissionService::canAccessMenu($user, 'approval', 'authority')) {
        $menuItems[] = [
            'name' => '承認管理',
            'url' => '/approvals',
            'icon' => 'check-circle'
        ];
    }
    
    return $menuItems;
}
```

### 3. ボタン表示での使用

```php
// EstimateController.php
public function show(Estimate $estimate)
{
    $user = auth()->user();
    
    $canEdit = PermissionService::canAccessMenu($user, 'estimate', 'edit');
    $canDelete = PermissionService::canAccessMenu($user, 'estimate', 'delete');
    $canApprove = PermissionService::canAccessMenu($user, 'estimate', 'approval.approve');
    
    return view('estimates.show', compact('estimate', 'canEdit', 'canDelete', 'canApprove'));
}
```

### 4. フロントエンドでの使用

```typescript
// メニュー表示判定
const canAccessEstimates = user.permissions?.includes('estimate.use');
const canAccessApprovals = user.permissions?.includes('approval.authority');

// ボタン表示判定
const canCreateEstimate = user.permissions?.includes('estimate.create');
const canApproveEstimate = user.permissions?.includes('estimate.approval.approve');

// 複数権限での判定
const canManageEstimates = user.permissions?.some(permission => 
    ['estimate.create', 'estimate.edit', 'estimate.delete'].includes(permission)
);
```

## 権限の種類と用途

### 基本操作権限

| 権限 | 用途 | 例 |
|------|------|-----|
| `use` | モジュール利用 | メニュー表示、ダッシュボードカード表示 |
| `list` | 一覧表示 | 一覧ページアクセス |
| `view` | 詳細表示 | 詳細ページアクセス |
| `create` | 作成 | 作成ボタン表示、作成ページアクセス |
| `edit` | 編集 | 編集ボタン表示、編集ページアクセス |
| `delete` | 削除 | 削除ボタン表示 |

### 承認操作権限

| 権限 | 用途 | 例 |
|------|------|-----|
| `approval.request` | 承認依頼作成 | 承認依頼ボタン表示 |
| `approval.list` | 承認依頼一覧 | 承認依頼一覧ページアクセス |
| `approval.view` | 承認依頼詳細 | 承認依頼詳細ページアクセス |
| `approval.approve` | 承認 | 承認ボタン表示 |
| `approval.reject` | 却下 | 却下ボタン表示 |
| `approval.return` | 差し戻し | 差し戻しボタン表示 |
| `approval.cancel` | 承認依頼キャンセル | キャンセルボタン表示 |

### システム承認権限

| 権限 | 用途 | 例 |
|------|------|-----|
| `approval.authority` | 承認者機能利用 | 承認管理メニュー表示、承認者機能アクセス |
| `approval.list` | 承認一覧 | 承認一覧ページアクセス |
| `approval.use` | 承認機能利用 | 承認機能の基本利用 |

## ベストプラクティス

### 1. 権限チェックの順序

1. **メニュー表示**: `use` 権限で判定
2. **ページアクセス**: 該当する `view`, `list` 権限で判定
3. **ボタン表示**: 該当する `create`, `edit`, `delete` 権限で判定
4. **承認操作**: 該当する `approval.*` 権限で判定

### 2. エラーハンドリング

```php
// 権限がない場合の適切なエラーハンドリング
if (!PermissionService::canAccessMenu($user, 'estimate', 'view')) {
    return response()->json(['error' => '権限がありません'], 403);
}
```

### 3. キャッシュの活用

```php
// ユーザーの権限リストをキャッシュして効率化
$userPermissions = Cache::remember("user_permissions_{$user->id}", 3600, function () use ($user) {
    return PermissionService::getUserEffectivePermissions($user);
});
```

## トラブルシューティング

### よくある問題

1. **権限が正しく判定されない**
   - 権限名のスペルミスを確認
   - ビジネスコードIDが正しいか確認
   - ユーザーに権限が正しく付与されているか確認

2. **メニューが表示されない**
   - `use` 権限が付与されているか確認
   - フロントエンドでの権限チェックロジックを確認

3. **ボタンが表示されない**
   - 該当する操作権限（`create`, `edit`, `delete` など）が付与されているか確認
   - フロントエンドでの権限配列の内容を確認

### デバッグ方法

```php
// ユーザーの権限リストを確認
$permissions = PermissionService::getUserEffectivePermissions($user);
dd($permissions);

// 特定の権限があるかチェック
$hasPermission = PermissionService::hasPermission($user, 'estimate.use');
dd($hasPermission);
```

## 更新履歴

- 2025-01-XX: 初版作成
- 権限チェックユーティリティの設計と実装
