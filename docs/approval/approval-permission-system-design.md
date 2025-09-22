# 承認フロー権限システム設計仕様書

## 概要

既存の権限システム（permissionsテーブル、system_level_permissionsテーブル）を活用して、承認フローで権限ベースの承認者判定を実装するための設計仕様書。

## 現状の権限システム

### 既存の見積承認権限（6個）

| 権限名 | 表示名 | 説明 |
|--------|--------|------|
| `estimate.approval.view` | 見積承認依頼閲覧 | 見積承認依頼を閲覧する権限 |
| `estimate.approval.approve` | 見積承認 | 見積を承認する権限 |
| `estimate.approval.reject` | 見積却下 | 見積を却下する権限 |
| `estimate.approval.return` | 見積差し戻し | 見積を差し戻す権限 |
| `estimate.approval.request` | 見積承認依頼作成 | 見積承認依頼を作成する権限 |
| `estimate.approval.cancel` | 見積承認依頼キャンセル | 見積承認依頼をキャンセルする権限 |

### システム権限レベル別の権限付与状況

- **システム管理者 (ID: 1)**: 70個の権限
- **最高責任者 (ID: 2)**: 5個の権限
- **経理責任者 (ID: 3)**: 5個の権限
- **事務長 (ID: 4)**: 5個の権限
- **工事責任者 (ID: 5)**: 5個の権限
- **上長 (ID: 6)**: 5個の権限
- **見積担当 (ID: 7)**: 4個の権限
- **担当者 (ID: 8)**: 4個の権限

## 現状の問題

1. **権限設定の未活用**: 承認管理で設定した権限が承認フローで使用されていない
2. **ダッシュボード表示の不整合**: `ApprovalDashboard`が`system_level`の`'approver'`でのみ表示される
3. **権限ベースの承認者判定の欠如**: 承認ステップで権限を考慮した承認者判定が行われていない

## 基本設計思想

### 1. 既存権限システムの活用

既存の権限システムをそのまま活用し、以下のロジックで承認者判定を行う：

```php
// ログインユーザーのシステム権限レベルをキーに権限判定
public function hasApprovalPermission(User $user, string $permissionName): bool
{
    return $user->systemLevel->permissions()
        ->where('name', $permissionName)
        ->exists();
}
```

### 2. 承認フローと権限の紐づけ

承認ステップの承認者判定を既存の権限システムと連携：

#### 2.1 承認ステップの設定パターン

承認ステップテーブル（`approval_steps`）では、承認者の設定方法を`approver_type`で指定します：

```php
// 承認ステップの設定例
[
    'id' => 7,
    'name' => '第1承認',
    'approver_type' => 'system_level',  // システム権限レベルベースの設定
    'approver_id' => 6,                 // システム権限レベルID（上長）
    'approver_condition' => null
]

[
    'id' => 8, 
    'name' => '第2承認',
    'approver_type' => 'system_level',  // システム権限レベルベースの設定
    'approver_id' => 2,                 // システム権限レベルID（最高責任者）
    'approver_condition' => null
]
```

#### 2.2 `approver_type`の意味

`approver_type`は**承認者の判定方法**を指定する仕組みで、異なるテーブルを参照できます：

| 設定値 | 参照テーブル | 意味 | 説明 | 例 |
|--------|-------------|------|------|-----|
| `'system_level'` | `system_levels` | システム権限レベルベース | 特定のシステム権限レベルのユーザーが承認者 | 上長、最高責任者 |
| `'position'` | `positions` | 職位ベース | 特定の職位のユーザーが承認者 | 部長、課長、主任 |
| `'user'` | `users` | 個別ユーザーベース | 特定のユーザーが承認者 | 特定のプロジェクトマネージャー |
| `'permission'` | `permissions` | 権限ベース | 特定の権限を持つユーザーが承認者 | 承認権限を持つユーザー |
| `'department'` | `departments` | 部門ベース | 特定の部門のユーザーが承認者 | 営業部、技術部 |

#### 2.2.1 承認者判定の実装例

```php
public function getApproversForStep(ApprovalStep $step): array
{
    switch ($step->approver_type) {
        case 'system_level':
            // system_levelsテーブルを参照
            return $this->getApproversBySystemLevel($step->approver_id);
            
        case 'position':
            // positionsテーブルを参照
            return $this->getApproversByPosition($step->approver_id);
            
        case 'user':
            // usersテーブルを直接参照
            return $this->getApproversByUser($step->approver_id);
            
        case 'permission':
            // permissionsテーブルを参照
            return $this->getApproversByPermission($step->approver_condition);
            
        default:
            return [];
    }
}

// 職位ベースの承認者取得例
private function getApproversByPosition(int $positionId): array
{
    $users = User::where('position_id', $positionId)
        ->whereHas('position', function ($query) {
            $query->where('is_active', true);
        })->get();
    
    return $users->toArray();
}
```

#### 2.2.2 柔軟な承認者設定

この仕組みにより、組織の構造に応じて柔軟に承認者を設定できます：

- **階層型組織**: `system_level`（上長→最高責任者）
- **職位型組織**: `position`（課長→部長→役員）
- **プロジェクト型**: `user`（特定のプロジェクトマネージャー）
- **権限型**: `permission`（特定の権限を持つユーザー）

#### 2.3 承認者判定ロジック

```php
// 承認ステップの承認者判定
public function getApproversForStep(ApprovalStep $step): array
{
    if ($step->approver_type === 'system_level') {
        // システム権限レベルベースの承認者を取得
        // $step->approver_id = 6 なら「上長レベル」のユーザー
        // $step->approver_id = 2 なら「最高責任者レベル」のユーザー
        return $this->getApproversBySystemLevelWithPermission($step->approver_id);
    }
    
    // 他の設定方法（例：個別ユーザー指定など）
    return [];
}

// システム権限レベル + 権限の組み合わせで承認者を取得
private function getApproversBySystemLevelWithPermission(int $systemLevelId): array
{
    $users = User::where('system_level_id', $systemLevelId)
        ->whereHas('systemLevel.permissions', function ($query) {
            $query->whereIn('name', [
                'estimate.approval.view',
                'estimate.approval.approve',
                'estimate.approval.reject',
                'estimate.approval.return'
            ]);
        })->get();
    
    return $users->toArray();
}
```

#### 2.4 実際の動作例

- **第1承認ステップ**: `approver_type = 'system_level'`, `approver_id = 6` → 上長レベルのユーザーが承認者
- **第2承認ステップ**: `approver_type = 'system_level'`, `approver_id = 2` → 最高責任者レベルのユーザーが承認者

**注意**: `approver_type === 'system_level'`は「システム管理者の場合」という意味ではなく、「この承認ステップは、特定のシステム権限レベル（上長、最高責任者など）のユーザーが承認者になる」という設定方法を表しています。

### 3. 権限設定の確認と調整

#### 3.1 現在の権限付与状況の確認

既存の権限システムで、各システム権限レベルに承認権限が適切に付与されているかを確認：

```sql
-- 上長(6)の承認権限確認
SELECT p.name, p.display_name 
FROM permissions p
JOIN system_level_permissions slp ON p.id = slp.permission_id
WHERE slp.system_level_id = 6 
AND p.name LIKE 'estimate.approval.%';

-- 最高責任者(2)の承認権限確認
SELECT p.name, p.display_name 
FROM permissions p
JOIN system_level_permissions slp ON p.id = slp.permission_id
WHERE slp.system_level_id = 2 
AND p.name LIKE 'estimate.approval.%';
```

#### 3.2 権限付与の調整（必要に応じて）

承認フローに必要な権限が付与されていない場合は、権限設定タブで調整：

```sql
-- 上長(6)に承認権限を付与（例）
INSERT INTO system_level_permissions (system_level_id, permission_id, granted_at) VALUES
(6, (SELECT id FROM permissions WHERE name = 'estimate.approval.view'), NOW()),
(6, (SELECT id FROM permissions WHERE name = 'estimate.approval.approve'), NOW()),
(6, (SELECT id FROM permissions WHERE name = 'estimate.approval.reject'), NOW()),
(6, (SELECT id FROM permissions WHERE name = 'estimate.approval.return'), NOW());

-- 最高責任者(2)に承認権限を付与（例）
INSERT INTO system_level_permissions (system_level_id, permission_id, granted_at) VALUES
(2, (SELECT id FROM permissions WHERE name = 'estimate.approval.view'), NOW()),
(2, (SELECT id FROM permissions WHERE name = 'estimate.approval.approve'), NOW()),
(2, (SELECT id FROM permissions WHERE name = 'estimate.approval.reject'), NOW()),
(2, (SELECT id FROM permissions WHERE name = 'estimate.approval.return'), NOW());
```

### 4. 承認者判定ロジックの実装

#### 4.1 承認者判定サービス

```php
class ApprovalPermissionService
{
    /**
     * 承認依頼の承認者を判定
     */
    public function getApproversForRequest(ApprovalRequest $request): array
    {
        $currentStep = $request->currentStep;
        if (!$currentStep) {
            return [];
        }

        return $this->getApproversForStep($currentStep);
    }

    /**
     * 承認ステップの承認者を判定
     */
    public function getApproversForStep(ApprovalStep $step): array
    {
        if ($step->approver_type === 'system_level') {
            // 既存のsystem_level判定を権限ベースに拡張
            return $this->getApproversBySystemLevelWithPermission($step->approver_id);
        }

        return [];
    }

    /**
     * システム権限レベル + 権限の組み合わせで承認者を取得
     */
    private function getApproversBySystemLevelWithPermission(int $systemLevelId): array
    {
        $users = User::where('system_level_id', $systemLevelId)
            ->whereHas('systemLevel.permissions', function ($query) {
                $query->whereIn('name', [
                    'estimate.approval.view',
                    'estimate.approval.approve',
                    'estimate.approval.reject',
                    'estimate.approval.return'
                ]);
            })->get();

        return $users->toArray();
    }

    /**
     * ユーザーが承認権限を持つかチェック
     */
    public function hasApprovalPermission(User $user, string $permissionName): bool
    {
        return $user->systemLevel->permissions()
            ->where('name', $permissionName)
            ->exists();
    }
}
```

#### 4.2 ダッシュボード表示の修正

```php
// ダッシュボード表示判定の修正
public function shouldShowApprovalDashboard(User $user): bool
{
    // 承認関連権限を持つユーザーに表示
    $approvalPermissions = [
        'estimate.approval.view',
        'estimate.approval.approve',
        'estimate.approval.reject',
        'estimate.approval.return'
    ];

    return $user->systemLevel->permissions()
        ->whereIn('name', $approvalPermissions)
        ->exists();
}
```

### 5. フロントエンド実装

#### 5.1 ダッシュボード表示判定の修正

```typescript
// frontend/src/app/dashboard/page.tsx
const renderDashboard = () => {
  if (user.is_admin) {
    return <AdminDashboard user={user} />
  }
  
  // 権限ベースの判定に変更
  if (hasApprovalPermissions(user)) {
    return <ApprovalDashboard user={user} />
  }
  
  // システム権限レベルに基づく判定
  switch (user.system_level) {
    case 'admin':
      return <AdminDashboard user={user} />
    case 'manager':
      return <ManagerDashboard user={user} />
    default:
      return <UserDashboard user={user} />
  }
}

// 承認権限の確認
const hasApprovalPermissions = (user: HeaderUser): boolean => {
  const approvalPermissions = [
    'estimate.approval.view',
    'estimate.approval.approve',
    'estimate.approval.reject',
    'estimate.approval.return'
  ]
  
  return user.permissions?.some(permission => 
    approvalPermissions.includes(permission.name)
  ) ?? false
}
```

#### 5.2 承認依頼一覧の権限フィルタリング

```typescript
// frontend/src/services/features/approvals/approvalRequests.ts
class ApprovalRequestService {
  async getPendingRequests(): Promise<ApprovalRequestListItem[]> {
    // ユーザーの権限に基づいて承認依頼をフィルタリング
    const response = await api.get('/approval-requests/pending')
    return response.data
  }
}
```

### 6. 実装手順

#### Phase 1: 権限設定の確認・調整
1. 現在の権限付与状況の確認
2. 承認フローに必要な権限の付与
3. 権限設定タブでの設定確認

#### Phase 2: バックエンド実装
1. 承認者判定サービスの実装
2. 承認依頼APIの権限フィルタリング
3. ダッシュボード表示判定の修正

#### Phase 3: フロントエンド実装
1. ダッシュボード表示判定の修正
2. 承認依頼一覧の権限フィルタリング
3. 承認操作の権限チェック

#### Phase 4: テスト・検証
1. 権限設定の動作確認
2. 承認フローの動作確認
3. ダッシュボード表示の確認

### 7. 期待される効果

1. **権限設定の活用**: 承認管理で設定した権限が実際の承認フローで使用される
2. **既存システムの活用**: 既存の権限システムをそのまま活用
3. **適切なダッシュボード表示**: 承認権限を持つユーザーのみに承認ダッシュボードが表示される
4. **権限の一元管理**: 承認権限を承認管理画面で一元管理可能

### 8. 今後の拡張性

- 他の承認タイプ（発注、予算等）への対応
- 条件付き承認権限の実装
- 承認権限の時限設定
- 承認権限の委譲機能
