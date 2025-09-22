# 権限設定機能 実装計画書

## 1. 概要

システム権限レベルに対して、permissionテーブルのマスタデータから権限を選択し、`system_level_permissions`テーブルに登録する機能を実装する。

### 1.1 目的
- システム全体の権限を包括的に管理する機能を提供
- 承認フロー関係の権限とそれ以外の権限を明確に分離して管理
- 権限設定ページを分けることで、権限の扱いを明確化
- 各権限カテゴリに応じた適切な管理画面を提供

### 1.2 権限設定の分離設計
- **承認管理ページ** (`/approvals`): 承認フロー関係の権限を設定
- **権限管理ページ** (`/permissions`): 承認フロー関係以外の権限を設定（新設予定）
- 両ページは**トップメニューに並列配置**され、独立して動作
- 権限の種類に応じて適切な管理画面で設定を行う
- 包括的な権限管理システムの一部として機能

### 1.3 対象権限
- 承認フロー設定に関する権限（`approval.flow.*`）
- 各モジュールの承認操作に関する権限（`*.approval.*`）

### 1.4 権限管理の全体像
システム全体の権限は以下の2つのページで包括的に管理される：

#### 承認管理ページで管理する権限
- 承認フロー設定に関する権限（`approval.flow.*`）
- 各モジュールの承認操作に関する権限（`*.approval.*`）

#### 権限管理ページで管理する権限
- ユーザー管理権限（`user.*`）
- 役割管理権限（`role.*`）
- 部門管理権限（`department.*`）
- システム設定権限（`system.*`）
- 見積基本操作権限（`estimate.view`, `estimate.create`, `estimate.edit`, `estimate.delete`）
- その他モジュールの基本操作権限

## 2. 機能要件

### 2.1 基本機能
- システム権限レベル一覧の表示
- 各レベルに対して**承認フロー関係の権限のみ**の設定・編集
- 承認フロー関係の権限マスタからの権限選択（チェックボックス形式）
- 権限設定の保存・更新

### 2.2 表示要件
- システム権限レベルをカード形式で表示
- 各レベルに現在付与されている**承認フロー関係の権限数**を表示
- 権限設定ダイアログで**承認フロー関係の権限のみ**を表示
- 権限はモジュール別にグループ化して表示（承認フロー関係のみ）

### 2.3 操作要件
- レベルカードクリックで権限設定ダイアログを開く
- 権限の選択・解除（チェックボックス）
- 保存ボタンで変更を確定
- キャンセルボタンで変更を破棄

## 3. 技術仕様

### 3.1 承認フロー関係権限の定義

#### 承認フロー関係権限の条件
以下の条件を満たす権限を「承認フロー関係権限」として扱う：

1. **モジュールが`approval`の権限**
   - `approval.flow.view` - 承認フロー設定閲覧
   - `approval.flow.create` - 承認フロー設定作成
   - `approval.flow.edit` - 承認フロー設定編集
   - `approval.flow.delete` - 承認フロー設定削除

2. **アクションが`approval`の権限**
   - `estimate.approval.view` - 見積承認依頼閲覧
   - `estimate.approval.approve` - 見積承認
   - `estimate.approval.reject` - 見積却下
   - `estimate.approval.return` - 見積差し戻し
   - `estimate.approval.request` - 見積承認依頼作成
   - `estimate.approval.cancel` - 見積承認依頼キャンセル

#### 権限フィルタリング条件
```sql
-- 承認フロー関係権限の取得条件
SELECT * FROM permissions 
WHERE is_active = true 
AND (
    module = 'approval' 
    OR (module = 'estimate' AND action = 'approval')
    OR (module = 'budget' AND action = 'approval')
    OR (module = 'order' AND action = 'approval')
    OR (module = 'progress' AND action = 'approval')
    OR (module = 'payment' AND action = 'approval')
)
ORDER BY module, action, resource;
```

### 3.2 データベース設計

#### 既存テーブル
- `system_levels` - システム権限レベルマスタ
- `permissions` - 権限マスタ
- `system_level_permissions` - システム権限レベルと権限の関連テーブル

#### system_level_permissionsテーブル構造
```sql
CREATE TABLE system_level_permissions (
    id BIGINT PRIMARY KEY,
    system_level_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP,
    granted_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (system_level_id) REFERENCES system_levels(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id),
    FOREIGN KEY (granted_by) REFERENCES users(id)
);
```

### 3.2 API設計

#### エンドポイント一覧
```
GET  /api/system-level-permissions/approval-status
     - 全システムレベルの承認フロー関係権限設定状況取得

GET  /api/system-level-permissions/approval-permissions
     - 承認フロー関係の権限マスタ一覧取得

POST /api/system-level-permissions/{systemLevelId}/sync-approval
     - システムレベルの承認フロー関係権限を一括更新
```

#### リクエスト・レスポンス形式

**GET /api/system-level-permissions/approval-status**
```json
{
  "staff": {
    "level_name": "担当者",
    "priority": 1,
    "permissions": [
      {
        "id": 45,
        "name": "estimate.approval.view",
        "display_name": "見積承認依頼閲覧",
        "module": "estimate",
        "action": "approval",
        "resource": "view",
        "is_granted": false
      }
    ]
  },
  "supervisor": {
    "level_name": "上長",
    "priority": 3,
    "permissions": [
      {
        "id": 46,
        "name": "estimate.approval.approve",
        "display_name": "見積承認",
        "module": "estimate",
        "action": "approval",
        "resource": "approve",
        "is_granted": true
      }
    ]
  }
}
```

**GET /api/system-level-permissions/approval-permissions**
```json
[
  {
    "id": 45,
    "name": "estimate.approval.view",
    "display_name": "見積承認依頼閲覧",
    "description": "見積承認依頼を閲覧する権限",
    "module": "estimate",
    "action": "approval",
    "resource": "view"
  }
]
```

**POST /api/system-level-permissions/{systemLevelId}/sync-approval**
```json
// リクエスト
{
  "permission_ids": [45, 46, 47]
}

// レスポンス
{
  "message": "権限を一括更新しました",
  "permissions": [
    {
      "id": 45,
      "name": "estimate.approval.view",
      "display_name": "見積承認依頼閲覧",
      "is_granted": true
    }
  ]
}
```

### 3.3 フロントエンド設計

#### コンポーネント構成
```
SystemLevelPermissionSettings (親コンポーネント)
├── SystemLevelCard (システム権限レベルカード)
└── PermissionSettingDialog (権限設定ダイアログ)
    ├── PermissionGroup (権限グループ)
    └── PermissionItem (権限アイテム)
```

#### 状態管理
```typescript
interface PermissionSettingsState {
  systemLevels: SystemLevel[]
  permissions: Permission[]
  permissionStatus: Record<string, SystemLevelPermissionStatus>
  selectedLevel: SystemLevel | null
  selectedPermissions: number[]
  loading: boolean
  error: string | null
}
```

#### 型定義
```typescript
interface SystemLevel {
  id: number
  code: string
  name: string
  display_name: string
  description: string
  priority: number
  is_system: boolean
  is_active: boolean
}

interface Permission {
  id: number
  name: string
  display_name: string
  description: string
  module: string
  action: string
  resource: string
  is_active: boolean
}

interface SystemLevelPermissionStatus {
  level_name: string
  priority: number
  permissions: PermissionWithStatus[]
}

interface PermissionWithStatus extends Permission {
  is_granted: boolean
}
```

## 4. 実装手順

### Phase 1: バックエンドAPI実装
1. `SystemLevelPermissionController`作成
2. 権限設定状況取得API実装
3. 権限マスタ取得API実装
4. 権限同期API実装
5. ルート定義

### Phase 2: フロントエンド基盤実装
1. 型定義作成
2. APIサービス作成
3. 基本コンポーネント作成

### Phase 3: UI実装
1. 承認管理ページに権限設定タブを追加
2. システム権限レベル一覧表示
3. 権限設定ダイアログ実装
4. 権限選択機能実装
5. 保存・キャンセル機能実装

### Phase 4: 統合・テスト
1. フロントエンド・バックエンド統合
2. 動作テスト
3. エラーハンドリング実装
4. UI/UX改善

## 5. 品質要件

### 5.1 パフォーマンス
- 権限設定状況取得: 1秒以内
- 権限同期処理: 2秒以内
- ページ読み込み: 3秒以内

### 5.2 エラーハンドリング
- API通信エラーの適切な表示
- バリデーションエラーの表示
- ネットワークエラー時の再試行機能

### 5.3 ユーザビリティ
- 直感的な操作感
- 適切なローディング表示
- 分かりやすいエラーメッセージ
- レスポンシブデザイン対応

## 6. セキュリティ要件

### 6.1 認証・認可
- 管理者権限のユーザーのみアクセス可能
- CSRFトークンによる保護
- 適切なバリデーション

### 6.2 データ保護
- SQLインジェクション対策
- XSS対策
- 適切な権限チェック

## 7. テスト計画

### 7.1 単体テスト
- API各エンドポイントのテスト
- コンポーネントのテスト
- ユーティリティ関数のテスト

### 7.2 統合テスト
- フロントエンド・バックエンド連携テスト
- データベース操作テスト
- エラーケースのテスト

### 7.3 E2Eテスト
- 権限設定の一連の操作テスト
- 異なるブラウザでの動作テスト
- レスポンシブデザインのテスト

## 8. 運用・保守

### 8.1 ログ出力
- API呼び出しログ
- エラーログ
- 権限変更ログ

### 8.2 監視
- API応答時間監視
- エラー率監視
- データベース接続監視

### 8.3 バックアップ
- 権限設定データのバックアップ
- 設定変更履歴の保持

## 9. 権限管理ページの設計

### 9.1 権限管理ページの概要
承認フロー関係以外の権限を設定する専用ページを新設する。

#### 9.1.1 ページ構成
```
/permissions (トップメニューに配置)
├── システム権限レベル一覧
├── 権限設定ダイアログ
└── 権限マスタ管理
```

#### 9.1.2 対象権限カテゴリ
- **ユーザー管理**: `user.view`, `user.create`, `user.edit`, `user.delete`
- **役割管理**: `role.view`, `role.create`, `role.edit`, `role.delete`
- **部門管理**: `department.view`, `department.create`, `department.edit`, `department.delete`
- **システム設定**: `system.view`, `system.edit`
- **見積基本操作**: `estimate.view`, `estimate.create`, `estimate.edit`, `estimate.delete`
- **予算基本操作**: `budget.view`, `budget.create`, `budget.edit`, `budget.delete`
- **発注基本操作**: `order.view`, `order.create`, `order.edit`, `order.delete`
- **出来高基本操作**: `progress.view`, `progress.create`, `progress.edit`, `progress.delete`
- **支払基本操作**: `payment.view`, `payment.create`, `payment.edit`, `payment.delete`

#### 9.1.3 API設計
```
GET  /api/system-level-permissions/general-status
     - 全システムレベルの一般権限設定状況取得

GET  /api/system-level-permissions/general-permissions
     - 一般権限マスタ一覧取得

POST /api/system-level-permissions/{systemLevelId}/sync-general
     - システムレベルの一般権限を一括更新
```

### 9.2 トップメニュー配置の設計

#### 9.2.1 メニュー構成
```
トップメニュー
├── ダッシュボード
├── 見積管理
├── 承認管理 (/approvals)
│   ├── 承認フロー
│   ├── 権限設定 (承認フロー関係のみ)
│   └── 承認依頼
├── 権限管理 (/permissions) ← 新設
│   ├── システム権限レベル一覧
│   ├── 権限設定 (一般権限)
│   └── 権限マスタ管理
└── システム管理
```

#### 9.2.2 権限設定の分離メリット

##### 運用面
- **責任の明確化**: 承認フロー管理者とシステム管理者の役割分離
- **操作の簡素化**: 各ページで必要な権限のみを表示
- **エラーの局所化**: 一方の設定ミスが他方に影響しない
- **ナビゲーションの明確化**: トップメニューで機能を明確に分離

##### セキュリティ面
- **最小権限の原則**: 各管理者が必要最小限の権限のみを操作
- **監査の容易性**: 権限変更の履歴を分離して管理
- **アクセス制御**: ページレベルでのアクセス権限設定

## 10. 今後の拡張予定

### 10.1 機能拡張
- 権限の一括設定機能
- 権限設定のテンプレート機能
- 権限設定の履歴表示
- 権限管理ページの実装

### 10.2 UI改善
- ドラッグ&ドロップでの権限設定
- 権限の検索・フィルタリング機能
- 権限設定のプレビュー機能
- 権限設定の比較機能
