# 権限階層とPermissionの関係性整理

## 概要

5階層権限システムにおける各階層と`permissions`テーブルの関係性を明確に定義し、権限の統合ロジックを整理します。

## 権限階層の構造

```
ユーザー最終権限 = システム権限レベル + 役割 + 職位 + 部署 + 個別権限
```

### 1. システム権限レベル（System Level）
**目的**: 組織の階層的な基本権限
**データベース**: `system_levels` テーブル
**権限の紐づけ**: `system_level_permissions` テーブル

### 2. 役割（Role）
**目的**: 業務機能に特化した権限
**データベース**: `roles` テーブル
**権限の紐づけ**: `role_permissions` テーブル

### 3. 職位（Position）
**目的**: 組織の階層的な役職権限
**データベース**: `positions` テーブル
**権限の紐づけ**: `position_permissions` テーブル

### 4. 部署（Department）
**目的**: 所属部署に応じた権限
**データベース**: `departments` テーブル
**権限の紐づけ**: `department_permissions` テーブル

### 5. 個別権限（User Individual）
**目的**: 特定ユーザーにのみ付与する権限
**データベース**: `users` テーブル
**権限の紐づけ**: `user_permissions` テーブル

## Permissionテーブルの役割

### 基本権限の定義
`permissions`テーブルは、システム内で使用可能な**最小単位の権限**を定義します。

```sql
permissions テーブル
├─ id: 権限ID
├─ name: 権限名（例: "estimate.view", "user.create"）
├─ display_name: 表示名（例: "見積閲覧", "ユーザー作成"）
├─ description: 説明
├─ module: モジュール（例: "estimate", "user"）
├─ action: アクション（例: "view", "create", "edit", "delete"）
└─ is_active: 有効フラグ
```

### 権限の命名規則
```
{module}.{action}
例:
- estimate.view: 見積閲覧
- estimate.create: 見積作成
- estimate.edit: 見積編集
- estimate.approve: 見積承認
- user.view: ユーザー閲覧
- user.create: ユーザー作成
- user.edit: ユーザー編集
- user.delete: ユーザー削除
```

## 各階層とPermissionの関係

### 1. システム権限レベル → Permission
```sql
-- システム権限レベルに権限を付与
system_level_permissions テーブル
├─ system_level_code: システム権限レベルコード
├─ permission_id: 権限ID
└─ is_active: 有効フラグ
```

**例**:
```
staff (担当者) システム権限レベル:
├─ estimate.view
├─ estimate.create
├─ user.view (自分のみ)
└─ profile.edit (自分のみ)

supervisor (上長) システム権限レベル:
├─ estimate.view
├─ estimate.create
├─ estimate.edit
├─ estimate.approve
├─ user.view (部下のみ)
└─ user.edit (部下のみ)
```

### 2. 役割 → Permission
```sql
-- 役割に権限を付与
role_permissions テーブル
├─ role_id: 役割ID
├─ permission_id: 権限ID
└─ is_active: 有効フラグ
```

**例**:
```
営業マネージャー役割:
├─ estimate.view
├─ estimate.create
├─ estimate.edit
├─ estimate.approve
├─ customer.view
├─ customer.create
└─ customer.edit

経理担当役割:
├─ estimate.view
├─ estimate.approve
├─ accounting.view
├─ accounting.create
└─ accounting.edit
```

### 3. 職位 → Permission
```sql
-- 職位に権限を付与
position_permissions テーブル
├─ position_id: 職位ID
├─ permission_id: 権限ID
└─ is_active: 有効フラグ
```

**例**:
```
課長職位:
├─ team.view
├─ team.manage
├─ report.view
└─ report.create

部長職位:
├─ department.view
├─ department.manage
├─ budget.view
├─ budget.manage
└─ report.view
```

### 4. 部署 → Permission
```sql
-- 部署に権限を付与
department_permissions テーブル
├─ department_id: 部署ID
├─ permission_id: 権限ID
└─ is_active: 有効フラグ
```

**例**:
```
営業部:
├─ customer.view
├─ customer.create
├─ customer.edit
├─ estimate.view
└─ estimate.create

経理部:
├─ accounting.view
├─ accounting.create
├─ accounting.edit
├─ budget.view
└─ budget.manage
```

### 5. 個別権限 → Permission
```sql
-- ユーザーに個別権限を付与
user_permissions テーブル
├─ user_id: ユーザーID
├─ permission_id: 権限ID
└─ is_active: 有効フラグ
```

**例**:
```
特定ユーザー（山田太郎）の個別権限:
├─ special.report.view
├─ special.analysis.view
└─ emergency.access
```

## 権限の統合ロジック

### 優先順位（高い順）
1. **個別権限**（最優先）
2. **部署権限**
3. **職位権限**
4. **役割権限**
5. **システム権限レベル**（基本権限）

### 統合方式
- **OR論理**: 各階層の権限を統合（重複は除去）
- **上書きなし**: 上位階層が下位階層を上書きしない
- **累積**: すべての階層の権限が累積される

### 権限計算の例
```
ユーザー: 山田太郎
├─ システム権限レベル: supervisor
│  └─ 権限: [estimate.view, estimate.create, estimate.edit, estimate.approve]
├─ 役割: 営業マネージャー
│  └─ 権限: [estimate.view, estimate.create, estimate.edit, estimate.approve, customer.view, customer.create]
├─ 職位: 課長
│  └─ 権限: [team.view, team.manage, report.view]
├─ 部署: 営業部
│  └─ 権限: [customer.view, customer.create, estimate.view]
└─ 個別権限: なし
    └─ 権限: []

最終権限（重複除去後）:
[estimate.view, estimate.create, estimate.edit, estimate.approve, 
 customer.view, customer.create, team.view, team.manage, report.view]
```

## 管理者権限の特別扱い

### 完全システム管理者（is_admin = true）
- **権限計算をスキップ**: 5階層の権限計算を行わない
- **全権限付与**: システム内のすべての権限を自動的に持つ
- **バイパス**: 権限チェックを常にパスする

### 業務システム管理者（system_manager役割）
- **通常の権限計算**: 5階層の権限システム内で管理
- **追加権限**: システム管理関連の権限を付与
- **制限あり**: 完全システム管理者より制限された権限

## 実装上の考慮事項

### 1. 権限の一意性
- 各`permission`は一意の`name`を持つ
- モジュールとアクションの組み合わせで識別

### 2. 権限の階層化
- モジュール単位で権限をグループ化
- アクション単位で権限を細分化

### 3. 権限の継承
- 上位職位は下位職位の権限を継承
- 役割は独立して設定可能

### 4. 権限の動的計算
- ユーザーの属性変更時に権限を再計算
- キャッシュ機能でパフォーマンスを向上

## データベース設計

### 既存テーブル
```sql
-- 権限の基本定義
permissions
├─ id (PK)
├─ name (UNIQUE)
├─ display_name
├─ description
├─ module
├─ action
└─ is_active

-- システム権限レベル
system_levels
├─ code (PK)
├─ display_name
├─ priority
└─ is_active

-- 役割
roles
├─ id (PK)
├─ name
├─ display_name
├─ description
└─ is_active

-- 職位
positions
├─ id (PK)
├─ name
├─ display_name
├─ level
└─ is_active

-- 部署
departments
├─ id (PK)
├─ name
├─ display_name
└─ is_active
```

### 権限紐づけテーブル
```sql
-- システム権限レベル → 権限
system_level_permissions
├─ system_level_code (FK)
├─ permission_id (FK)
└─ is_active

-- 役割 → 権限
role_permissions
├─ role_id (FK)
├─ permission_id (FK)
└─ is_active

-- 職位 → 権限
position_permissions
├─ position_id (FK)
├─ permission_id (FK)
└─ is_active

-- 部署 → 権限
department_permissions
├─ department_id (FK)
├─ permission_id (FK)
└─ is_active

-- ユーザー → 権限（個別）
user_permissions
├─ user_id (FK)
├─ permission_id (FK)
└─ is_active
```

## まとめ

1. **Permissionテーブル**: システム内の最小単位の権限を定義
2. **各階層**: システム権限レベル、役割、職位、部署、個別権限
3. **権限紐づけ**: 各階層からPermissionへの多対多の関係
4. **統合ロジック**: OR論理で全階層の権限を統合
5. **管理者権限**: 完全システム管理者は権限計算をスキップ

この構造により、柔軟で拡張性の高い権限管理システムを実現できます。

---

**作成日**: 2024年1月21日
**更新日**: 2024年1月21日
**作成者**: AI Assistant
