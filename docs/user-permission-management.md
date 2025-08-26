# BuildSuite ユーザー・権限管理仕様書

## 概要
BuildSuiteシステムのユーザー・権限管理に関する詳細な仕様書です。
建設業向けの業務システムとして、組織の階層構造と業務権限を適切に管理し、セキュリティと業務効率を両立させます。

## システムアーキテクチャ

### 権限管理モデル
```
BuildSuite 権限管理システム
├── 認証・認可
│   ├── Laravel Sanctum (API認証)
│   ├── JWT トークン管理
│   └── セッション管理
├── ユーザー管理
│   ├── ユーザー基本情報
│   ├── ユーザープロフィール
│   └── ユーザー状態管理
├── 役割管理 (RBAC)
│   ├── 役割定義
│   ├── 権限設定
│   └── 役割割り当て
├── 部門管理 (DBAC)
│   ├── 部門階層
│   ├── 部門権限
│   └── 部門割り当て
└── 機能制御
    ├── 画面表示制御
    ├── 操作制御
    └── データアクセス制御
```

## データベース設計

### ユーザー管理テーブル

#### users テーブル
**概要**: システムユーザーの基本情報を管理するテーブルです。
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,           -- 社員番号
    name VARCHAR(255) NOT NULL,                        -- 社員名
    name_kana VARCHAR(255) NULL,                       -- 社員名（カナ）
    birth_date DATE NULL,                              -- 生年月日
    gender VARCHAR(10) NULL,                           -- 性別 (male, female, other)
    email VARCHAR(255) UNIQUE NOT NULL,                -- メールアドレス
    email_verified_at TIMESTAMP WITH TIME ZONE NULL,   -- メール認証日時
    password VARCHAR(255) NOT NULL,                    -- パスワード（ハッシュ化）
    phone VARCHAR(20) NULL,                            -- 電話番号
    mobile_phone VARCHAR(20) NULL,                     -- 携帯電話番号
    position VARCHAR(100) NULL,                        -- 職位
    job_title VARCHAR(100) NULL,                       -- 役職名
    hire_date DATE NULL,                               -- 入社日
    service_years INTEGER NULL,                        -- 勤続期間（年）
    service_months INTEGER NULL,                       -- 勤続期間（月）
    system_level VARCHAR(50) DEFAULT 'staff',          -- システム権限レベル
    is_active BOOLEAN DEFAULT true,                    -- アクティブ状態
    is_admin BOOLEAN DEFAULT false,                    -- 管理者フラグ
    last_login_at TIMESTAMP WITH TIME ZONE NULL,       -- 最終ログイン日時
    password_changed_at TIMESTAMP WITH TIME ZONE NULL, -- パスワード変更日時
    password_expires_at TIMESTAMP WITH TIME ZONE NULL, -- パスワード有効期限
    failed_login_attempts INTEGER DEFAULT 0,           -- ログイン失敗回数
    locked_at TIMESTAMP WITH TIME ZONE NULL,           -- アカウントロック日時
    remember_token VARCHAR(100) NULL,                  -- リメンバートークン
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- インデックス
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_birth_date ON users(birth_date);
CREATE INDEX idx_users_hire_date ON users(hire_date);
CREATE INDEX idx_users_system_level ON users(system_level);
```

### 役割管理テーブル (RBAC)

#### roles テーブル
**概要**: システム内の役割を定義するテーブルです。
```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,                 -- 役割名
    display_name VARCHAR(255) NOT NULL,                -- 表示名
    description TEXT NULL,                             -- 説明
    priority INTEGER DEFAULT 0,                        -- 優先度（数値が大きいほど上位）
    is_system BOOLEAN DEFAULT false,                   -- システム役割フラグ
    is_active BOOLEAN DEFAULT true,                    -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- インデックス
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_priority ON roles(priority);
CREATE INDEX idx_roles_is_active ON roles(is_active);
```

#### permissions テーブル
**概要**: システム内の権限を定義するテーブルです。
```sql
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,                 -- 権限名
    display_name VARCHAR(255) NOT NULL,                -- 表示名
    description TEXT NULL,                             -- 説明
    module VARCHAR(100) NOT NULL,                      -- モジュール名
    action VARCHAR(100) NOT NULL,                      -- アクション名
    resource VARCHAR(100) NULL,                        -- リソース名
    is_system BOOLEAN DEFAULT false,                   -- システム権限フラグ
    is_active BOOLEAN DEFAULT true,                    -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- インデックス
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_is_active ON permissions(is_active);
```

#### role_permissions テーブル
**概要**: 役割と権限の関連を管理するテーブルです。
```sql
CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by BIGINT NULL,
    
    CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_role_permissions UNIQUE (role_id, permission_id)
);

-- インデックス
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
```

#### user_roles テーブル
**概要**: ユーザーと役割の関連を管理するテーブルです。
```sql
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,           -- 役割有効期限
    is_active BOOLEAN DEFAULT true,                    -- アクティブ状態
    
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_roles UNIQUE (user_id, role_id)
);

-- インデックス
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
```

### 部門管理テーブル (DBAC)

#### departments テーブル
**概要**: 組織の部門構造を管理するテーブルです。
```sql
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                        -- 部門名
    code VARCHAR(50) UNIQUE NOT NULL,                  -- 部門コード
    description TEXT NULL,                             -- 説明
    parent_id BIGINT NULL,                             -- 親部門ID
    level INTEGER DEFAULT 0,                           -- 階層レベル
    path VARCHAR(500) NULL,                            -- 階層パス
    sort_order INTEGER DEFAULT 0,                      -- 表示順序
    manager_id BIGINT NULL,                            -- 部門長ID
    is_active BOOLEAN DEFAULT true,                    -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    CONSTRAINT fk_departments_parent_id FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_departments_manager_id FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_level ON departments(level);
CREATE INDEX idx_departments_path ON departments(path);
CREATE INDEX idx_departments_is_active ON departments(is_active);
```

#### user_departments テーブル
**概要**: ユーザーと部門の関連を管理するテーブルです。
```sql
CREATE TABLE user_departments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    position VARCHAR(100) NULL,                        -- 部門内役職
    is_primary BOOLEAN DEFAULT false,                  -- 主所属フラグ
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,           -- 所属有効期限
    is_active BOOLEAN DEFAULT true,                    -- アクティブ状態
    
    CONSTRAINT fk_user_departments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_departments_department_id FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_departments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX idx_user_departments_department_id ON user_departments(department_id);
CREATE INDEX idx_user_departments_is_primary ON user_departments(is_primary);
CREATE INDEX idx_user_departments_is_active ON user_departments(is_active);
```

#### department_permissions テーブル
**概要**: 部門別の権限を管理するテーブルです。
```sql
CREATE TABLE department_permissions (
    id BIGSERIAL PRIMARY KEY,
    department_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by BIGINT NULL,
    
    CONSTRAINT fk_department_permissions_department_id FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    CONSTRAINT fk_department_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_department_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_department_permissions UNIQUE (department_id, permission_id)
);

-- インデックス
CREATE INDEX idx_department_permissions_department_id ON department_permissions(department_id);
CREATE INDEX idx_department_permissions_permission_id ON department_permissions(permission_id);
```

### 認証・セッション管理テーブル

#### personal_access_tokens テーブル (Laravel Sanctum)
**概要**: API認証用のトークンを管理するテーブルです。
```sql
CREATE TABLE personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    abilities TEXT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_personal_access_tokens_tokenable_type_tokenable_id ON personal_access_tokens(tokenable_type, tokenable_id);
```

#### user_sessions テーブル
**概要**: ユーザーのセッション情報を管理するテーブルです。
```sql
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
```

#### user_login_history テーブル
**概要**: ユーザーのログイン履歴を管理するテーブルです。
```sql
CREATE TABLE user_login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP WITH TIME ZONE NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL,                       -- success, failed, locked
    failure_reason VARCHAR(255) NULL,                  -- 失敗理由
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_login_history_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_user_login_history_user_id ON user_login_history(user_id);
CREATE INDEX idx_user_login_history_login_at ON user_login_history(login_at);
CREATE INDEX idx_user_login_history_status ON user_login_history(status);
```

## ユーザー情報項目マッピング

### 基本情報
| 項目名 | フィールド名 | データ型 | 必須 | 説明 |
|--------|-------------|----------|------|------|
| 社員番号 | employee_id | VARCHAR(50) | ○ | 一意の社員番号 |
| 社員名 | name | VARCHAR(255) | ○ | 氏名 |
| 生年月日 | birth_date | DATE | - | 生年月日 |
| 性別 | gender | VARCHAR(10) | - | male, female, other |

### 住所・連絡先
| 項目名 | フィールド名 | データ型 | 必須 | 説明 |
|--------|-------------|----------|------|------|
| 郵便番号 | postal_code | VARCHAR(10) | - | 郵便番号 |
| 都道府県 | prefecture | VARCHAR(50) | - | 都道府県名 |
| 現住所 | address | TEXT | - | 詳細住所 |
| メールアドレス | email | VARCHAR(255) | ○ | メールアドレス |

### 所属
| 項目名 | フィールド名 | データ型 | 必須 | 説明 |
|--------|-------------|----------|------|------|
| 所属部署 | department_id | BIGINT | - | 部門ID（user_departments） |
| 職位 | position | VARCHAR(100) | - | 職位 |
| 役職名 | job_title | VARCHAR(100) | - | 役職名 |
| 入社日 | hire_date | DATE | - | 入社日 |
| 勤続期間 | service_years, service_months | INTEGER | - | 勤続年数・月数 |
| システム権限レベル | system_level | VARCHAR(50) | ○ | 既存システムの権限レベル |

## 権限管理モデル

### システム権限レベル定義
既存システムの権限レベルを基に、以下の階層構造を定義します：

```
システム権限レベル階層
├── システム管理者 (system_admin) - 最高権限
├── 最高責任者 (executive) - 経営判断権限
├── 経理責任者 (accounting_manager) - 経理・財務権限
├── 事務長 (office_manager) - 事務管理権限
├── 工事責任者 (construction_manager) - 工事管理権限
├── 上長 (supervisor) - 管理監督権限
├── 見積担当 (estimator) - 見積業務権限
└── 担当者 (staff) - 基本業務権限
```

### 権限レベル詳細定義

#### 1. 担当者 (staff)
**概要**: 基本的な業務機能の利用権限を持つ一般ユーザー
**優先度**: 1
**権限範囲**:
- 見積データの閲覧・作成・編集（自分の担当分）
- 予算データの閲覧・作成・編集（自分の担当分）
- 発注データの閲覧・作成・編集（自分の担当分）
- 出来高データの閲覧・作成・編集（自分の担当分）
- 支払データの閲覧・作成・編集（自分の担当分）

#### 2. 見積担当 (estimator)
**概要**: 見積業務に特化した権限を持つユーザー
**優先度**: 2
**権限範囲**:
- 担当者の全権限
- 見積データの全件閲覧・編集
- 見積書の出力
- 見積承認依頼の作成
- 見積関連レポートの閲覧

#### 3. 上長 (supervisor)
**概要**: 部下の業務を管理監督する権限を持つユーザー
**優先度**: 3
**権限範囲**:
- 見積担当の全権限
- 部下の業務データの閲覧・承認
- 部門内の承認処理
- 部門内レポートの閲覧・出力
- 部下の業務進捗管理

#### 4. 工事責任者 (construction_manager)
**概要**: 工事管理に特化した権限を持つユーザー
**優先度**: 4
**権限範囲**:
- 上長の全権限
- 工事関連データの全件管理
- 工事予算の承認
- 工事発注の承認
- 出来高の承認
- 工事関連レポートの管理

#### 5. 事務長 (office_manager)
**概要**: 事務管理に特化した権限を持つユーザー
**優先度**: 5
**権限範囲**:
- 工事責任者の全権限
- 事務関連データの全件管理
- 契約書類の管理
- 事務関連レポートの管理
- システム設定の一部管理

#### 6. 経理責任者 (accounting_manager)
**概要**: 経理・財務に特化した権限を持つユーザー
**優先度**: 6
**権限範囲**:
- 事務長の全権限
- 経理データの全件管理
- 支払データの承認
- 財務レポートの管理
- 税務関連データの管理
- 経理関連設定の管理

#### 7. 最高責任者 (executive)
**概要**: 経営判断を行う権限を持つユーザー
**優先度**: 7
**権限範囲**:
- 経理責任者の全権限
- 全業務データの閲覧・承認
- 経営判断レポートの閲覧・出力
- システム全体の設定変更
- ユーザー管理（一部制限あり）

#### 8. システム管理者 (system_admin)
**概要**: システム全体の管理権限を持つユーザー
**優先度**: 8
**権限範囲**:
- 最高責任者の全権限
- システム設定の全件管理
- ユーザー・権限の全件管理
- データベース管理
- システムログの管理
- バックアップ・復旧

### 権限の階層構造
```
権限管理システム
├── システム権限 (System Permissions)
│   ├── ユーザー管理 (user.*)
│   ├── 役割管理 (role.*)
│   ├── 部門管理 (department.*)
│   └── システム設定 (system.*)
├── 業務権限 (Business Permissions)
│   ├── 見積管理 (estimate.*)
│   ├── 予算管理 (budget.*)
│   ├── 発注管理 (order.*)
│   ├── 出来高管理 (progress.*)
│   └── 支払管理 (payment.*)
├── 承認権限 (Approval Permissions)
│   ├── 見積承認 (estimate.approval.*)
│   ├── 予算承認 (budget.approval.*)
│   ├── 発注承認 (order.approval.*)
│   ├── 出来高承認 (progress.approval.*)
│   └── 支払承認 (payment.approval.*)
└── 帳票権限 (Report Permissions)
    ├── 見積書出力 (estimate.report.*)
    ├── 予算書出力 (budget.report.*)
    ├── 発注書出力 (order.report.*)
    ├── 出来高報告書出力 (progress.report.*)
    └── 支払通知書出力 (payment.report.*)
```

### 権限命名規則
権限名は以下の形式で定義します：
```
{モジュール}.{アクション}.{リソース}
```

#### モジュール一覧
- `user`: ユーザー管理
- `role`: 役割管理
- `department`: 部門管理
- `system`: システム設定
- `estimate`: 見積管理
- `budget`: 予算管理
- `order`: 発注管理
- `progress`: 出来高管理
- `payment`: 支払管理
- `report`: レポート機能

#### アクション一覧
- `view`: 閲覧
- `create`: 作成
- `edit`: 編集
- `delete`: 削除
- `approve`: 承認
- `reject`: 却下
- `return`: 差し戻し
- `export`: 出力
- `import`: インポート

#### 権限例
```php
// ユーザー管理権限
'user.view'      // ユーザー一覧閲覧
'user.create'    // ユーザー作成
'user.edit'      // ユーザー編集
'user.delete'    // ユーザー削除

// 見積管理権限
'estimate.view'      // 見積一覧閲覧
'estimate.create'    // 見積作成
'estimate.edit'      // 見積編集
'estimate.delete'    // 見積削除
'estimate.approve'   // 見積承認
'estimate.report'    // 見積書出力

// 承認権限
'estimate.approval.view'     // 承認依頼閲覧
'estimate.approval.approve'  // 見積承認
'estimate.approval.reject'   // 見積却下
'estimate.approval.return'   // 見積差し戻し
```

### 役割定義

#### システム権限レベル別役割定義
```php
// システム管理者
'system_admin' => [
    'display_name' => 'システム管理者',
    'description' => 'システム全体の管理権限を持つ',
    'system_level' => 'system_admin',
    'priority' => 8,
    'permissions' => [
        'user.*', 'role.*', 'department.*', 'system.*',
        'estimate.*', 'budget.*', 'order.*', 'progress.*', 'payment.*',
        'report.*'
    ]
],

// 最高責任者
'executive' => [
    'display_name' => '最高責任者',
    'description' => '経営判断を行う権限を持つ',
    'system_level' => 'executive',
    'priority' => 7,
    'permissions' => [
        'user.view', 'user.edit',
        'estimate.*', 'budget.*', 'order.*', 'progress.*', 'payment.*',
        'report.*', 'system.view', 'system.edit'
    ]
],

// 経理責任者
'accounting_manager' => [
    'display_name' => '経理責任者',
    'description' => '経理・財務に特化した権限を持つ',
    'system_level' => 'accounting_manager',
    'priority' => 6,
    'permissions' => [
        'estimate.view', 'budget.*', 'order.view', 'progress.view', 'payment.*',
        'report.budget.*', 'report.payment.*', 'system.view'
    ]
],

// 事務長
'office_manager' => [
    'display_name' => '事務長',
    'description' => '事務管理に特化した権限を持つ',
    'system_level' => 'office_manager',
    'priority' => 5,
    'permissions' => [
        'estimate.view', 'budget.view', 'order.*', 'progress.view', 'payment.view',
        'report.order.*', 'system.view'
    ]
],

// 工事責任者
'construction_manager' => [
    'display_name' => '工事責任者',
    'description' => '工事管理に特化した権限を持つ',
    'system_level' => 'construction_manager',
    'priority' => 4,
    'permissions' => [
        'estimate.view', 'budget.*', 'order.*', 'progress.*', 'payment.view',
        'report.budget.*', 'report.order.*', 'report.progress.*'
    ]
],

// 上長
'supervisor' => [
    'display_name' => '上長',
    'description' => '部下の業務を管理監督する権限を持つ',
    'system_level' => 'supervisor',
    'priority' => 3,
    'permissions' => [
        'estimate.view', 'estimate.create', 'estimate.edit',
        'budget.view', 'budget.create', 'budget.edit',
        'order.view', 'order.create', 'order.edit',
        'progress.view', 'progress.create', 'progress.edit',
        'payment.view', 'payment.create', 'payment.edit',
        'estimate.approval.view', 'budget.approval.view', 'order.approval.view',
        'progress.approval.view', 'payment.approval.view'
    ]
],

// 見積担当
'estimator' => [
    'display_name' => '見積担当',
    'description' => '見積業務に特化した権限を持つ',
    'system_level' => 'estimator',
    'priority' => 2,
    'permissions' => [
        'estimate.*', 'estimate.report.*',
        'budget.view', 'order.view', 'progress.view', 'payment.view'
    ]
],

// 担当者
'staff' => [
    'display_name' => '担当者',
    'description' => '基本的な業務機能の利用権限',
    'system_level' => 'staff',
    'priority' => 1,
    'permissions' => [
        'estimate.view', 'estimate.create', 'estimate.edit',
        'budget.view', 'budget.create', 'budget.edit',
        'order.view', 'order.create', 'order.edit',
        'progress.view', 'progress.create', 'progress.edit',
        'payment.view', 'payment.create', 'payment.edit'
    ]
]
```

#### 業務役割（追加）
```php
// 営業担当者
'sales' => [
    'display_name' => '営業担当者',
    'description' => '見積・受注管理を担当',
    'permissions' => [
        'estimate.*', 'estimate.approval.view',
        'customer.*', 'report.estimate.*'
    ]
],

// 工事担当者
'construction' => [
    'display_name' => '工事担当者',
    'description' => '工事管理・出来高管理を担当',
    'permissions' => [
        'budget.*', 'budget.approval.view',
        'order.*', 'order.approval.view',
        'progress.*', 'progress.approval.view',
        'report.budget.*', 'report.order.*', 'report.progress.*'
    ]
],

// 経理担当者
'accounting' => [
    'display_name' => '経理担当者',
    'description' => '支払管理・経理処理を担当',
    'permissions' => [
        'payment.*', 'payment.approval.view',
        'report.payment.*'
    ]
],

// 承認者
'approver' => [
    'display_name' => '承認者',
    'description' => '各種承認処理を担当',
    'permissions' => [
        'estimate.approval.*', 'budget.approval.*',
        'order.approval.*', 'progress.approval.*',
        'payment.approval.*'
    ]
]
```

## API設計

### 認証API

#### ログイン
```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password",
    "remember": false
}

Response:
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "employee_id": "EMP001",
            "name": "山田太郎",
            "email": "user@example.com",
            "birth_date": "1990-01-01",
            "gender": "male",
            "position": "主任",
            "job_title": "営業主任",
            "hire_date": "2020-04-01",
            "service_years": 3,
            "service_months": 6,
            "system_level": "supervisor",
            "roles": [...],
            "departments": [...],
            "permissions": [...]
        },
        "token": "1|abc123...",
        "token_type": "Bearer",
        "expires_in": 3600
    }
}
```

#### ログアウト
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}

Response:
{
    "success": true,
    "message": "ログアウトしました"
}
```

#### ユーザー情報取得
```http
GET /api/v1/auth/user
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "employee_id": "EMP001",
            "name": "山田太郎",
            "email": "user@example.com",
            "birth_date": "1990-01-01",
            "gender": "male",
            "position": "主任",
            "job_title": "営業主任",
            "hire_date": "2020-04-01",
            "service_years": 3,
            "service_months": 6,
            "system_level": "supervisor",
            "roles": [...],
            "departments": [...],
            "permissions": [...]
        }
    }
}
```

### ユーザー管理API

#### ユーザー一覧取得
```http
GET /api/v1/users?page=1&per_page=20&search=山田&department_id=1&role_id=2&system_level=supervisor
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "users": [...],
        "pagination": {...}
    }
}
```

#### ユーザー作成
```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

{
    "employee_id": "EMP001",
    "name": "山田太郎",
    "name_kana": "ヤマダタロウ",
    "birth_date": "1990-01-01",
    "gender": "male",
    "email": "yamada@example.com",
    "password": "password123",
    "phone": "03-1234-5678",
    "mobile_phone": "090-1234-5678",
    "position": "主任",
    "job_title": "営業主任",
    "hire_date": "2020-04-01",
    "system_level": "supervisor",
    "postal_code": "100-0001",
    "prefecture": "東京都",
    "address": "千代田区千代田1-1-1",
    "department_ids": [1, 2],
    "role_ids": [3, 4]
}

Response:
{
    "success": true,
    "data": {
        "user": {...}
    }
}
```

#### ユーザー更新
```http
PUT /api/v1/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "山田太郎（更新）",
    "position": "課長",
    "job_title": "営業課長",
    "system_level": "construction_manager",
    "department_ids": [1, 3],
    "role_ids": [2, 4]
}

Response:
{
    "success": true,
    "data": {
        "user": {...}
    }
}
```

### 役割管理API

#### 役割一覧取得
```http
GET /api/v1/roles?page=1&per_page=20&search=営業&system_level=supervisor
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "roles": [...],
        "pagination": {...}
    }
}
```

#### 役割作成
```http
POST /api/v1/roles
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "senior_sales",
    "display_name": "シニア営業",
    "description": "シニア営業担当者の役割",
    "system_level": "supervisor",
    "priority": 5,
    "permission_ids": [1, 2, 3, 4, 5]
}

Response:
{
    "success": true,
    "data": {
        "role": {...}
    }
}
```

### 部門管理API

#### 部門一覧取得
```http
GET /api/v1/departments?page=1&per_page=20&parent_id=1
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "departments": [...],
        "pagination": {...}
    }
}
```

#### 部門作成
```http
POST /api/v1/departments
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "営業部",
    "code": "SALES",
    "description": "営業部門",
    "parent_id": 1,
    "manager_id": 5,
    "permission_ids": [1, 2, 3]
}

Response:
{
    "success": true,
    "data": {
        "department": {...}
    }
}
```

## フロントエンド設計

### 認証状態管理 (Redux Toolkit)

#### Auth Slice
```typescript
// store/slices/authSlice.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  }
});
```

#### Permission Slice
```typescript
// store/slices/permissionSlice.ts
interface PermissionState {
  permissions: Permission[];
  roles: Role[];
  departments: Department[];
  systemLevels: SystemLevel[];
  isLoading: boolean;
}

const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
    },
    setDepartments: (state, action) => {
      state.departments = action.payload;
    },
    setSystemLevels: (state, action) => {
      state.systemLevels = action.payload;
    }
  }
});
```

### 権限チェックコンポーネント

#### PermissionGuard
```typescript
// components/common/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null
}) => {
  const { user } = useAuth();
  
  if (!user || !hasPermission(user, permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

#### SystemLevelGuard
```typescript
// components/common/SystemLevelGuard.tsx
interface SystemLevelGuardProps {
  minLevel: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const SystemLevelGuard: React.FC<SystemLevelGuardProps> = ({
  minLevel,
  children,
  fallback = null
}) => {
  const { user } = useAuth();
  
  if (!user || !hasSystemLevel(user, minLevel)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

#### RoleBasedView
```typescript
// components/common/RoleBasedView.tsx
interface RoleBasedViewProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleBasedView: React.FC<RoleBasedViewProps> = ({
  roles,
  children,
  fallback = null
}) => {
  const { user } = useAuth();
  
  if (!user || !hasRole(user, roles)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

### ユーザー管理画面

#### ユーザー一覧画面
```typescript
// pages/UserManagement/UserList.tsx
const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    department_id: '',
    role_id: '',
    system_level: '',
    is_active: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers(filters);
      setUsers(response.data.users);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <UserListFilters filters={filters} onFilterChange={setFilters} />
      <UserListTable users={users} loading={loading} />
    </div>
  );
};
```

#### ユーザー作成・編集画面
```typescript
// pages/UserManagement/UserForm.tsx
const UserForm: React.FC<{ userId?: number }> = ({ userId }) => {
  const [formData, setFormData] = useState<UserFormData>({
    employee_id: '',
    name: '',
    name_kana: '',
    birth_date: '',
    gender: '',
    email: '',
    password: '',
    phone: '',
    mobile_phone: '',
    position: '',
    job_title: '',
    hire_date: '',
    system_level: 'staff',
    postal_code: '',
    prefecture: '',
    address: '',
    department_ids: [],
    role_ids: []
  });

  const handleSubmit = async (data: UserFormData) => {
    try {
      if (userId) {
        await userService.updateUser(userId, data);
      } else {
        await userService.createUser(data);
      }
      // 成功処理
    } catch (error) {
      // エラー処理
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <UserBasicInfo formData={formData} onChange={setFormData} />
      <UserAddressContact formData={formData} onChange={setFormData} />
      <UserAffiliation formData={formData} onChange={setFormData} />
      <UserSystemLevel formData={formData} onChange={setFormData} />
      <UserDepartmentRole formData={formData} onChange={setFormData} />
      <UserPermissions formData={formData} onChange={setFormData} />
    </form>
  );
};
```

## 権限レベル管理メンテナンス機能

### 1. データベース設計の拡張

#### system_levels テーブル（新規追加）
```sql
CREATE TABLE system_levels (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,                  -- 権限レベルコード
    name VARCHAR(100) NOT NULL,                        -- 権限レベル名
    display_name VARCHAR(255) NOT NULL,                -- 表示名
    description TEXT NULL,                             -- 説明
    priority INTEGER NOT NULL,                         -- 優先度（数値が大きいほど上位）
    is_system BOOLEAN DEFAULT false,                   -- システム固定フラグ
    is_active BOOLEAN DEFAULT true,                    -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- インデックス
CREATE INDEX idx_system_levels_code ON system_levels(code);
CREATE INDEX idx_system_levels_priority ON system_levels(priority);
CREATE INDEX idx_system_levels_is_active ON system_levels(is_active);
```

#### system_level_permissions テーブル（新規追加）
```sql
CREATE TABLE system_level_permissions (
    id BIGSERIAL PRIMARY KEY,
    system_level_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by BIGINT NULL,
    
    CONSTRAINT fk_system_level_permissions_system_level_id FOREIGN KEY (system_level_id) REFERENCES system_levels(id) ON DELETE CASCADE,
    CONSTRAINT fk_system_level_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_system_level_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_system_level_permissions UNIQUE (system_level_id, permission_id)
);

-- インデックス
CREATE INDEX idx_system_level_permissions_system_level_id ON system_level_permissions(system_level_id);
CREATE INDEX idx_system_level_permissions_permission_id ON system_level_permissions(permission_id);
```

### 2. 初期データ（シーダー）

#### システム権限レベルの初期設定
```php
// database/seeders/SystemLevelSeeder.php
class SystemLevelSeeder extends Seeder
{
    public function run()
    {
        $levels = [
            [
                'code' => 'system_admin',
                'name' => 'システム管理者',
                'display_name' => 'システム管理者',
                'description' => 'システム全体の管理権限を持つ',
                'priority' => 8,
                'is_system' => true,
                'is_active' => true
            ],
            [
                'code' => 'executive',
                'name' => '最高責任者',
                'display_name' => '最高責任者',
                'description' => '経営判断を行う権限を持つ',
                'priority' => 7,
                'is_system' => false,
                'is_active' => true
            ],
            [
                'code' => 'accounting_manager',
                'name' => '経理責任者',
                'display_name' => '経理責任者',
                'description' => '経理・財務に特化した権限を持つ',
                'priority' => 6,
                'is_system' => false,
                'is_active' => true
            ],
            [
                'code' => 'office_manager',
                'name' => '事務長',
                'display_name' => '事務長',
                'description' => '事務管理に特化した権限を持つ',
                'priority' => 5,
                'is_system' => false,
                'is_active' => true
            ],
            [
                'code' => 'construction_manager',
                'name' => '工事責任者',
                'display_name' => '工事責任者',
                'description' => '工事管理に特化した権限を持つ',
                'priority' => 4,
                'is_system' => false,
                'is_active' => true
            ],
            [
                'code' => 'supervisor',
                'name' => '上長',
                'display_name' => '上長',
                'description' => '部下の業務を管理監督する権限を持つ',
                'priority' => 3,
                'is_system' => false,
                'is_active' => true
            ],
            [
                'code' => 'estimator',
                'name' => '見積担当',
                'display_name' => '見積担当',
                'description' => '見積業務に特化した権限を持つ',
                'priority' => 2,
                'is_system' => false,
                'is_active' => true
            ],
            [
                'code' => 'staff',
                'name' => '担当者',
                'display_name' => '担当者',
                'description' => '基本的な業務機能の利用権限',
                'priority' => 1,
                'is_system' => false,
                'is_active' => true
            ]
        ];

        foreach ($levels as $level) {
            SystemLevel::create($level);
        }
    }
}
```

### 3. API設計

#### 権限レベル管理API

##### 権限レベル一覧取得
```http
GET /api/v1/system-levels?page=1&per_page=20&is_active=true
Authorization: Bearer {token}

Response:
{
    "success": true,
    "data": {
        "system_levels": [
            {
                "id": 1,
                "code": "system_admin",
                "name": "システム管理者",
                "display_name": "システム管理者",
                "description": "システム全体の管理権限を持つ",
                "priority": 8,
                "is_system": true,
                "is_active": true,
                "permissions": [...],
                "user_count": 2
            }
        ],
        "pagination": {...}
    }
}
```

##### 権限レベル作成
```http
POST /api/v1/system-levels
Authorization: Bearer {token}
Content-Type: application/json

{
    "code": "project_manager",
    "name": "プロジェクトマネージャー",
    "display_name": "プロジェクトマネージャー",
    "description": "プロジェクト管理に特化した権限を持つ",
    "priority": 4,
    "permission_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

Response:
{
    "success": true,
    "data": {
        "system_level": {...}
    }
}
```

##### 権限レベル更新
```http
PUT /api/v1/system-levels/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "プロジェクトマネージャー（更新）",
    "description": "プロジェクト管理に特化した権限を持つ（更新）",
    "priority": 5,
    "permission_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}

Response:
{
    "success": true,
    "data": {
        "system_level": {...}
    }
}
```

##### 権限レベル削除
```http
DELETE /api/v1/system-levels/{id}
Authorization: Bearer {token}

Response:
{
    "success": true,
    "message": "権限レベルを削除しました"
}
```

##### 権限レベル権限設定
```http
POST /api/v1/system-levels/{id}/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
    "permission_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

Response:
{
    "success": true,
    "data": {
        "system_level": {...}
    }
}
```

### 4. フロントエンド設計

#### 権限レベル管理画面

##### 権限レベル一覧画面
```typescript
// pages/SystemLevelManagement/SystemLevelList.tsx
const SystemLevelList: React.FC = () => {
  const [systemLevels, setSystemLevels] = useState<SystemLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    is_active: '',
    is_system: ''
  });

  const fetchSystemLevels = async () => {
    setLoading(true);
    try {
      const response = await systemLevelService.getSystemLevels(filters);
      setSystemLevels(response.data.system_levels);
    } catch (error) {
      console.error('権限レベル取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SystemLevelListFilters filters={filters} onFilterChange={setFilters} />
      <SystemLevelListTable systemLevels={systemLevels} loading={loading} />
    </div>
  );
};
```

##### 権限レベル作成・編集画面
```typescript
// pages/SystemLevelManagement/SystemLevelForm.tsx
const SystemLevelForm: React.FC<{ systemLevelId?: number }> = ({ systemLevelId }) => {
  const [formData, setFormData] = useState<SystemLevelFormData>({
    code: '',
    name: '',
    display_name: '',
    description: '',
    priority: 1,
    is_system: false,
    is_active: true,
    permission_ids: []
  });

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = async () => {
    try {
      const response = await permissionService.getPermissions();
      setPermissions(response.data.permissions);
    } catch (error) {
      console.error('権限取得エラー:', error);
    }
  };

  const handleSubmit = async (data: SystemLevelFormData) => {
    setLoading(true);
    try {
      if (systemLevelId) {
        await systemLevelService.updateSystemLevel(systemLevelId, data);
      } else {
        await systemLevelService.createSystemLevel(data);
      }
      // 成功処理
    } catch (error) {
      // エラー処理
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <SystemLevelBasicInfo formData={formData} onChange={setFormData} />
      <SystemLevelPermissions 
        formData={formData} 
        onChange={setFormData}
        permissions={permissions}
      />
      <SystemLevelSettings formData={formData} onChange={setFormData} />
    </form>
  );
};
```

##### 権限レベル権限設定画面
```typescript
// pages/SystemLevelManagement/SystemLevelPermissions.tsx
const SystemLevelPermissions: React.FC<{ systemLevelId: number }> = ({ systemLevelId }) => {
  const [systemLevel, setSystemLevel] = useState<SystemLevel | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSystemLevelPermissions = async () => {
    setLoading(true);
    try {
      const [levelResponse, permissionsResponse] = await Promise.all([
        systemLevelService.getSystemLevel(systemLevelId),
        permissionService.getPermissions()
      ]);
      
      setSystemLevel(levelResponse.data.system_level);
      setPermissions(permissionsResponse.data.permissions);
      setSelectedPermissions(levelResponse.data.system_level.permissions.map(p => p.id));
    } catch (error) {
      console.error('権限レベル権限取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (permissionIds: number[]) => {
    setLoading(true);
    try {
      await systemLevelService.updateSystemLevelPermissions(systemLevelId, {
        permission_ids: permissionIds
      });
      setSelectedPermissions(permissionIds);
      // 成功処理
    } catch (error) {
      // エラー処理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SystemLevelPermissionTree
        permissions={permissions}
        selectedPermissions={selectedPermissions}
        onPermissionChange={handlePermissionChange}
        loading={loading}
      />
    </div>
  );
};
```

#### 権限レベル権限ツリーコンポーネント
```typescript
// components/SystemLevelManagement/PermissionTree.tsx
const PermissionTree: React.FC<PermissionTreeProps> = ({
  permissions,
  selectedPermissions,
  onPermissionChange,
  loading
}) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  const handleModuleToggle = (module: string) => {
    setExpandedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const handlePermissionToggle = (permissionId: number) => {
    const newSelected = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    onPermissionChange(newSelected);
  };

  return (
    <div className="permission-tree">
      {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
        <div key={module} className="permission-module">
          <div 
            className="module-header"
            onClick={() => handleModuleToggle(module)}
          >
            <ExpandIcon expanded={expandedModules.includes(module)} />
            <span className="module-name">{getModuleDisplayName(module)}</span>
            <span className="permission-count">
              ({modulePermissions.filter(p => selectedPermissions.includes(p.id)).length}/{modulePermissions.length})
            </span>
          </div>
          
          {expandedModules.includes(module) && (
            <div className="module-permissions">
              {modulePermissions.map(permission => (
                <div key={permission.id} className="permission-item">
                  <Checkbox
                    checked={selectedPermissions.includes(permission.id)}
                    onChange={() => handlePermissionToggle(permission.id)}
                    disabled={loading}
                  />
                  <span className="permission-name">{permission.display_name}</span>
                  <span className="permission-description">{permission.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### 5. バックエンド実装

#### SystemLevelモデル
```php
// app/Models/SystemLevel.php
class SystemLevel extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code', 'name', 'display_name', 'description',
        'priority', 'is_system', 'is_active'
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'priority' => 'integer'
    ];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'system_level_permissions')
                    ->withTimestamps();
    }

    public function users()
    {
        return $this->hasMany(User::class, 'system_level', 'code');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }
}
```

#### SystemLevelController
```php
// app/Http/Controllers/Api/SystemLevelController.php
class SystemLevelController extends Controller
{
    public function index(Request $request)
    {
        $query = SystemLevel::with(['permissions', 'users']);

        // フィルター適用
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('display_name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        if ($request->filled('is_system')) {
            $query->where('is_system', $request->is_system);
        }

        $systemLevels = $query->orderBy('priority', 'desc')
                             ->paginate($request->get('per_page', 20));

        // ユーザー数を追加
        $systemLevels->getCollection()->transform(function ($level) {
            $level->user_count = $level->users->count();
            return $level;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'system_levels' => $systemLevels->items(),
                'pagination' => [
                    'current_page' => $systemLevels->currentPage(),
                    'last_page' => $systemLevels->lastPage(),
                    'per_page' => $systemLevels->perPage(),
                    'total' => $systemLevels->total()
                ]
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:system_levels',
            'name' => 'required|string|max:100',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|integer|min:1|max:100',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id'
        ]);

        $systemLevel = SystemLevel::create($validated);

        if (!empty($validated['permission_ids'])) {
            $systemLevel->permissions()->attach($validated['permission_ids']);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'system_level' => $systemLevel->load('permissions')
            ]
        ], 201);
    }

    public function update(Request $request, SystemLevel $systemLevel)
    {
        // システム固定レベルは更新不可
        if ($systemLevel->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'システム固定の権限レベルは更新できません'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|integer|min:1|max:100',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id'
        ]);

        $systemLevel->update($validated);

        if (isset($validated['permission_ids'])) {
            $systemLevel->permissions()->sync($validated['permission_ids']);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'system_level' => $systemLevel->load('permissions')
            ]
        ]);
    }

    public function destroy(SystemLevel $systemLevel)
    {
        // システム固定レベルは削除不可
        if ($systemLevel->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'システム固定の権限レベルは削除できません'
            ], 403);
        }

        // ユーザーが割り当てられている場合は削除不可
        if ($systemLevel->users()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'この権限レベルを使用しているユーザーが存在するため削除できません'
            ], 400);
        }

        $systemLevel->delete();

        return response()->json([
            'success' => true,
            'message' => '権限レベルを削除しました'
        ]);
    }

    public function updatePermissions(Request $request, SystemLevel $systemLevel)
    {
        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id'
        ]);

        $systemLevel->permissions()->sync($validated['permission_ids']);

        return response()->json([
            'success' => true,
            'data' => [
                'system_level' => $systemLevel->load('permissions')
            ]
        ]);
    }
}
```

### 6. セキュリティ考慮事項

#### 権限チェック
```php
// app/Http/Middleware/SystemLevelPermissionMiddleware.php
class SystemLevelPermissionMiddleware
{
    public function handle($request, Closure $next, $permission)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // システム管理者は全権限を持つ
        if ($user->system_level === 'system_admin') {
            return $next($request);
        }

        // 権限レベルによる権限チェック
        $systemLevel = SystemLevel::where('code', $user->system_level)->first();
        if (!$systemLevel || !$systemLevel->is_active) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $hasPermission = $systemLevel->permissions()
            ->where('name', $permission)
            ->exists();

        if (!$hasPermission) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        return $next($request);
    }
}
```

### 7. 運用・保守機能

#### 権限レベル監査機能
```php
// app/Console/Commands/AuditSystemLevels.php
class AuditSystemLevels extends Command
{
    protected $signature = 'system:audit-levels';
    protected $description = '権限レベルの監査を実行';

    public function handle()
    {
        $this->info('権限レベル監査を開始します...');

        // 未使用の権限レベルを検出
        $unusedLevels = SystemLevel::whereDoesntHave('users')->get();
        
        if ($unusedLevels->count() > 0) {
            $this->warn('未使用の権限レベル:');
            foreach ($unusedLevels as $level) {
                $this->line("- {$level->display_name} ({$level->code})");
            }
        }

        // 権限が設定されていない権限レベルを検出
        $levelsWithoutPermissions = SystemLevel::whereDoesntHave('permissions')->get();
        
        if ($levelsWithoutPermissions->count() > 0) {
            $this->warn('権限が設定されていない権限レベル:');
            foreach ($levelsWithoutPermissions as $level) {
                $this->line("- {$level->display_name} ({$level->code})");
            }
        }

        $this->info('権限レベル監査が完了しました。');
    }
}
```

この設計により、以下の機能を実現できます：

## 実現可能な機能

### 1. **権限レベルの柔軟な管理**
- 新しい権限レベルの追加
- 既存権限レベルの編集・削除
- 権限レベルの優先度変更
- 権限レベルの有効/無効切り替え

### 2. **権限の詳細設定**
- 権限レベルごとの権限設定
- モジュール別の権限管理
- 権限の一括設定・解除
- 権限設定の履歴管理

### 3. **既存システムとの互換性**
- 既存の権限レベルコードを維持
- 段階的な移行が可能
- 後方互換性の確保

### 4. **セキュリティ機能**
- システム固定レベルの保護
- 使用中の権限レベルの削除防止
- 権限変更の監査ログ
- 権限エスカレーション防止

### 5. **運用・保守機能**
- 権限レベルの監査機能
- 未使用権限レベルの検出
- 権限設定の不整合検出
- 定期メンテナンス機能

このメンテナンス機能により、システム管理者は業務の変化に応じて権限レベルを柔軟に調整でき、より細かい権限制御が可能になります。