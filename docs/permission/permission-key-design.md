# Permission 権限キー設計仕様書

## 概要

本ドキュメントは、権限管理システムにおける Permission エンティティの権限キー設計について定義します。権限判定は Permission の紐づけのみで行い、各階層（SystemLevel、Role、Department、Position、User Individual）の `name` や `display_name` は表示用のみに使用する設計方針に基づきます。

## 設計方針

### 1. 基本原則

- **権限判定の最小単位**: Permission エンティティが権限判定の最小単位
- **キーベースの判定**: 権限判定は Permission の `name` フィールド（権限キー）で行う
- **表示と判定の分離**: 各階層の `name`、`display_name` は表示用のみ、権限判定には使用しない
- **階層構造の活用**: 5階層の権限管理（SystemLevel → Role → Department → Position → User Individual）

### 2. 権限キーの命名規則

#### 2.1 基本形式
```
{module}.{action}[.{sub_action}]
```

#### 2.2 構成要素

| 要素 | 説明 | 例 | 制約 |
|------|------|-----|------|
| `module` | 機能モジュール名 | `user`, `estimate`, `approval` | 小文字、英数字、アンダースコア |
| `action` | 基本操作 | `view`, `create`, `edit`, `delete` | 小文字、英数字、アンダースコア |
| `sub_action` | サブ操作（オプション） | `request`, `approve`, `reject` | 小文字、英数字、アンダースコア |

#### 2.3 命名規則詳細

- **モジュール名**: 機能領域を表す英小文字
- **アクション名**: 操作の種類を表す英小文字
- **区切り文字**: ドット（`.`）を使用
- **階層**: 最大3階層まで（module.action.sub_action）

## 現在の権限データ分析

### 1. システム固定権限

| モジュール | 権限キー | 表示名 | 説明 |
|------------|----------|--------|------|
| `employee` | `employee.use` | 社員利用 | 社員管理機能を利用する権限 |
| `employee` | `employee.view` | 社員閲覧 | 社員情報を閲覧する権限 |
| `employee` | `employee.create` | 社員作成 | 社員を作成する権限 |
| `employee` | `employee.edit` | 社員編集 | 社員情報を編集する権限 |
| `employee` | `employee.delete` | 社員削除 | 社員を削除する権限 |
| `role` | `role.use` | 役割利用 | 役割管理機能を利用する権限 |
| `role` | `role.view` | 役割閲覧 | 役割情報を閲覧する権限 |
| `role` | `role.create` | 役割作成 | 役割を作成する権限 |
| `role` | `role.edit` | 役割編集 | 役割情報を編集する権限 |
| `role` | `role.delete` | 役割削除 | 役割を削除する権限 |
| `department` | `department.use` | 部署利用 | 部署管理機能を利用する権限 |
| `department` | `department.view` | 部署閲覧 | 部署情報を閲覧する権限 |
| `department` | `department.create` | 部署作成 | 部署を作成する権限 |
| `department` | `department.edit` | 部署編集 | 部署情報を編集する権限 |
| `department` | `department.delete` | 部署削除 | 部署を削除する権限 |
| `system` | `system.use` | システム利用 | システム管理機能を利用する権限 |
| `system` | `system.view` | システム閲覧 | システム情報を閲覧する権限 |
| `system` | `system.edit` | システム編集 | システム設定を編集する権限 |
| `approval` | `approval.use` | 承認利用 | 承認管理ページ（承認フロー管理・承認依頼管理）へのアクセス権限 |
| `approval` | `approval.flow.view` | 承認フロー閲覧 | 承認フローを閲覧する権限 |
| `approval` | `approval.flow.create` | 承認フロー作成 | 承認フローを作成する権限 |
| `approval` | `approval.flow.edit` | 承認フロー編集 | 承認フローを編集する権限 |
| `approval` | `approval.flow.delete` | 承認フロー削除 | 承認フローを削除する権限 |
| `approval` | `approval.usage` | 承認usage | ダッシュボードでの承認依頼一覧表示・承認者機能の利用権限 |
| `partner` | `partner.use` | 取引先利用 | 取引先管理機能を利用する権限 |
| `partner` | `partner.view` | 取引先閲覧 | 取引先情報を閲覧する権限 |
| `partner` | `partner.create` | 取引先作成 | 取引先を作成する権限 |
| `partner` | `partner.edit` | 取引先編集 | 取引先情報を編集する権限 |
| `partner` | `partner.delete` | 取引先削除 | 取引先を削除する権限 |
| `permission` | `permission.use` | 権限利用 | 権限管理機能を利用する権限 |
| `permission` | `permission.view` | 権限閲覧 | 権限情報を閲覧する権限 |
| `permission` | `permission.create` | 権限作成 | 権限を作成する権限 |
| `permission` | `permission.edit` | 権限編集 | 権限情報を編集する権限 |
| `permission` | `permission.delete` | 権限削除 | 権限を削除する権限 |

#### 1.1 承認権限の詳細説明

承認機能は2つの階層で構成されています：

**1. システム承認権限（`approval.*`）**
- `approval.use`: 承認管理ページへのアクセス権限
- `approval.flow.*`: 承認フローの管理権限
- `approval.usage`: ダッシュボードでの承認依頼一覧表示権限

**2. 業務別承認権限（`{business}.approval.*`）**
各業務（見積、予算、発注、工事、一般）で個別の承認フロー権限を設定：
- `{business}.approval.request`: 承認依頼作成
- `{business}.approval.view`: 承認依頼閲覧
- `{business}.approval.approve`: 承認
- `{business}.approval.reject`: 却下
- `{business}.approval.return`: 差し戻し
- `{business}.approval.cancel`: 承認依頼キャンセル

**権限の使い分け**：
- 承認管理ページの利用: `approval.use`
- 承認フローの設定・管理: `approval.flow.*`
- ダッシュボードでの承認依頼確認: `approval.usage`
- 各業務での承認処理: `{business}.approval.*`

### 2. ビジネスロジック権限

#### 2.1 見積モジュール
| 権限キー | 表示名 | 説明 |
|----------|--------|------|
| `estimate.use` | 見積利用 | 見積管理機能を利用する権限 |
| `estimate.create` | 見積作成 | 見積書を作成する権限 |
| `estimate.view` | 見積閲覧 | 見積書を閲覧する権限 |
| `estimate.edit` | 見積編集 | 見積書を編集する権限 |
| `estimate.delete` | 見積削除 | 見積書を削除する権限 |
| `estimate.approval.request` | 見積承認依頼作成 | 見積の承認依頼を作成する権限 |
| `estimate.approval.view` | 見積承認依頼閲覧 | 見積の承認依頼を閲覧する権限 |
| `estimate.approval.approve` | 見積承認 | 見積を承認する権限 |
| `estimate.approval.reject` | 見積却下 | 見積を却下する権限 |
| `estimate.approval.return` | 見積差し戻し | 見積を差し戻す権限 |
| `estimate.approval.cancel` | 見積承認依頼キャンセル | 見積の承認依頼をキャンセルする権限 |

#### 2.2 予算モジュール
| 権限キー | 表示名 | 説明 |
|----------|--------|------|
| `budget.use` | 予算利用 | 予算管理機能を利用する権限 |
| `budget.create` | 予算作成 | 予算を作成する権限 |
| `budget.view` | 予算閲覧 | 予算を閲覧する権限 |
| `budget.edit` | 予算編集 | 予算を編集する権限 |
| `budget.delete` | 予算削除 | 予算を削除する権限 |
| `budget.approval.request` | 予算承認依頼作成 | 予算の承認依頼を作成する権限 |
| `budget.approval.view` | 予算承認依頼閲覧 | 予算の承認依頼を閲覧する権限 |
| `budget.approval.approve` | 予算承認 | 予算を承認する権限 |
| `budget.approval.reject` | 予算却下 | 予算を却下する権限 |
| `budget.approval.return` | 予算差し戻し | 予算を差し戻す権限 |
| `budget.approval.cancel` | 予算承認依頼キャンセル | 予算の承認依頼をキャンセルする権限 |

#### 2.3 発注モジュール
| 権限キー | 表示名 | 説明 |
|----------|--------|------|
| `purchase.create` | 発注作成 | 発注を作成する権限 |
| `purchase.view` | 発注閲覧 | 発注を閲覧する権限 |
| `purchase.edit` | 発注編集 | 発注を編集する権限 |
| `purchase.delete` | 発注削除 | 発注を削除する権限 |
| `purchase.approval.request` | 発注承認依頼作成 | 発注の承認依頼を作成する権限 |
| `purchase.approval.view` | 発注承認依頼閲覧 | 発注の承認依頼を閲覧する権限 |
| `purchase.approval.approve` | 発注承認 | 発注を承認する権限 |
| `purchase.approval.reject` | 発注却下 | 発注を却下する権限 |
| `purchase.approval.return` | 発注差し戻し | 発注を差し戻す権限 |
| `purchase.approval.cancel` | 発注承認依頼キャンセル | 発注の承認依頼をキャンセルする権限 |

#### 2.4 工事モジュール
| 権限キー | 表示名 | 説明 |
|----------|--------|------|
| `construction.create` | 工事作成 | 工事を作成する権限 |
| `construction.view` | 工事閲覧 | 工事を閲覧する権限 |
| `construction.edit` | 工事編集 | 工事を編集する権限 |
| `construction.delete` | 工事削除 | 工事を削除する権限 |
| `construction.approval.request` | 工事承認依頼作成 | 工事の承認依頼を作成する権限 |
| `construction.approval.view` | 工事承認依頼閲覧 | 工事の承認依頼を閲覧する権限 |
| `construction.approval.approve` | 工事承認 | 工事を承認する権限 |
| `construction.approval.reject` | 工事却下 | 工事を却下する権限 |
| `construction.approval.return` | 工事差し戻し | 工事を差し戻す権限 |
| `construction.approval.cancel` | 工事承認依頼キャンセル | 工事の承認依頼をキャンセルする権限 |

#### 2.5 一般モジュール
| 権限キー | 表示名 | 説明 |
|----------|--------|------|
| `general.create` | 一般作成 | 一般的な申請を作成する権限 |
| `general.view` | 一般閲覧 | 一般的な申請を閲覧する権限 |
| `general.edit` | 一般編集 | 一般的な申請を編集する権限 |
| `general.delete` | 一般削除 | 一般的な申請を削除する権限 |
| `general.approval.request` | 一般承認依頼作成 | 一般的な承認依頼を作成する権限 |
| `general.approval.view` | 一般承認依頼閲覧 | 一般的な承認依頼を閲覧する権限 |
| `general.approval.approve` | 一般承認 | 一般的な申請を承認する権限 |
| `general.approval.reject` | 一般却下 | 一般的な申請を却下する権限 |
| `general.approval.return` | 一般差し戻し | 一般的な申請を差し戻す権限 |
| `general.approval.cancel` | 一般承認依頼キャンセル | 一般的な承認依頼をキャンセルする権限 |

## 権限キーの分類

### 1. 基本操作権限
| アクション | 説明 | 例 |
|------------|------|-----|
| `view` | 閲覧権限 | `user.view`, `estimate.view` |
| `create` | 作成権限 | `user.create`, `estimate.create` |
| `edit` | 編集権限 | `user.edit`, `estimate.edit` |
| `delete` | 削除権限 | `user.delete`, `estimate.delete` |

### 2. 承認関連権限
| アクション | 説明 | 例 |
|------------|------|-----|
| `approval.request` | 承認依頼作成 | `estimate.approval.request` |
| `approval.view` | 承認依頼閲覧 | `estimate.approval.view` |
| `approval.approve` | 承認 | `estimate.approval.approve` |
| `approval.reject` | 却下 | `estimate.approval.reject` |
| `approval.return` | 差し戻し | `estimate.approval.return` |
| `approval.cancel` | 承認依頼キャンセル | `estimate.approval.cancel` |

### 3. 業務利用権限
| アクション | 説明 | 例 |
|------------|------|-----|
| `use` | 業務機能の利用 | `estimate.use`, `budget.use`, `purchase.use`, `construction.use`, `general.use` |

### 4. 特殊権限
| 権限キー | 説明 | 用途 |
|----------|------|------|
| `approval.usage` | 承認使用状況閲覧 | 承認フローの使用状況を確認 |
| `system.view` | システム情報閲覧 | システム設定の閲覧 |
| `system.edit` | システム設定編集 | システム設定の変更 |

## 権限判定の実装

### 1. 権限判定メソッド

```php
// User モデル
public function hasPermission(string $permission): bool
{
    // システム管理者は全ての権限を持つ
    if ($this->is_admin) {
        return true;
    }

    // システム権限レベルによる権限チェック
    if ($this->systemLevel) {
        $systemPermissions = $this->systemLevel->permissions()
            ->where('name', $permission)
            ->where('is_active', true)
            ->exists();
        
        if ($systemPermissions) {
            return true;
        }
    }

    // 役割による権限チェック
    $rolePermissions = $this->activeRoles()
        ->whereHas('permissions', function ($query) use ($permission) {
            $query->where('name', $permission)->where('is_active', true);
        })
        ->exists();

    if ($rolePermissions) {
        return true;
    }

    // 部署による権限チェック
    if ($this->employee && $this->employee->department) {
        $departmentPermissions = $this->employee->department->permissions()
            ->where('name', $permission)
            ->where('is_active', true)
            ->exists();
            
        if ($departmentPermissions) {
            return true;
        }
    }

    // 職位による権限チェック
    if ($this->position) {
        $positionPermissions = $this->position->permissions()
            ->where('name', $permission)
            ->where('is_active', true)
            ->exists();
            
        if ($positionPermissions) {
            return true;
        }
    }

    // 個別権限チェック
    $individualPermissions = $this->permissions()
        ->where('name', $permission)
        ->where('is_active', true)
        ->exists();

    return $individualPermissions;
}
```

### 2. 使用例

```php
// 権限判定の使用例
if ($user->hasPermission('estimate.create')) {
    // 見積作成権限がある場合の処理
}

if ($user->hasPermission('approval.approve')) {
    // 承認権限がある場合の処理
}

if ($user->hasPermission('user.delete')) {
    // ユーザー削除権限がある場合の処理
}
```

## 権限キーの拡張ルール

### 1. 新規モジュール追加時

1. **モジュール名の決定**: 機能領域を表す英小文字
2. **基本権限の定義**: `view`, `create`, `edit`, `delete`
3. **承認権限の定義**: 承認フローが必要な場合
4. **特殊権限の定義**: モジュール固有の操作

### 2. 新規アクション追加時

1. **命名規則の遵守**: 英小文字、アンダースコア使用
2. **既存パターンの活用**: 類似機能の命名パターンを参考
3. **階層の制限**: 最大3階層まで（module.action.sub_action）

### 3. 権限キーの変更時

1. **後方互換性の考慮**: 既存の権限キーは変更しない
2. **段階的移行**: 新しい権限キーを追加し、段階的に移行
3. **ドキュメント更新**: 変更内容をドキュメントに反映

## データベース設計

### 1. permissions テーブル

```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,        -- 権限キー
    display_name VARCHAR(255) NOT NULL,       -- 表示名
    description TEXT,                         -- 説明
    module VARCHAR(100) NOT NULL,            -- モジュール名
    action VARCHAR(100) NOT NULL,            -- アクション名
    resource VARCHAR(100),                   -- リソース名（将来拡張用）
    is_system BOOLEAN DEFAULT FALSE,         -- システム権限フラグ
    is_active BOOLEAN DEFAULT TRUE,          -- 有効フラグ
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 2. インデックス

```sql
-- 権限キー検索用
CREATE INDEX idx_permissions_name ON permissions(name);

-- モジュール別検索用
CREATE INDEX idx_permissions_module ON permissions(module);

-- アクション別検索用
CREATE INDEX idx_permissions_action ON permissions(action);

-- 有効権限検索用
CREATE INDEX idx_permissions_is_active ON permissions(is_active);
```

## 運用ガイドライン

### 1. 権限キーの命名

- **一意性**: システム全体で一意であること
- **可読性**: 機能と操作が分かりやすいこと
- **拡張性**: 将来の機能追加に対応できること
- **一貫性**: 既存の命名規則に従うこと

### 2. 権限の管理

- **最小権限の原則**: 必要最小限の権限のみ付与
- **定期的な見直し**: 不要な権限の削除
- **監査ログ**: 権限変更の記録
- **テスト**: 権限判定の動作確認

### 3. パフォーマンス考慮

- **インデックス活用**: 権限キー検索の最適化
- **キャッシュ**: 頻繁にアクセスされる権限情報のキャッシュ
- **遅延読み込み**: 必要時のみ権限情報を読み込み

## まとめ

本設計により、以下のメリットが得られます：

1. **明確な権限判定**: Permission の紐づけのみで権限判定
2. **柔軟な権限管理**: 5階層の権限管理による細かい制御
3. **保守性の向上**: 表示名と権限キーの分離
4. **拡張性**: 新規機能追加時の権限設計の明確化
5. **一貫性**: 統一された命名規則による管理の簡素化

この設計に基づいて、権限管理システムの実装と運用を行います。
