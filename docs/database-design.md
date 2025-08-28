# BuildSuite データベース設計書

## 概要
BuildSuiteシステムのデータベース設計に関する詳細な仕様書です。
開発時はこのドキュメントを参照して、一貫性のあるデータベース設計を行ってください。

## データベース基本情報
- **DBMS**: PostgreSQL 15+
- **文字エンコーディング**: UTF-8
- **タイムゾーン**: Asia/Tokyo
- **接続プール**: PgBouncer (本番環境)

## テーブル設計原則

### 命名規則
- **テーブル名**: 複数形、スネークケース (例: `users`, `estimate_items`)
- **カラム名**: スネークケース (例: `created_at`, `user_id`)
- **インデックス名**: `idx_テーブル名_カラム名` (例: `idx_users_email`)
- **外部キー制約名**: `fk_テーブル名_参照テーブル名` (例: `fk_estimates_user_id`)

### 共通カラム
すべてのテーブルに以下のカラムを含める：
```sql
id BIGSERIAL PRIMARY KEY,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
deleted_at TIMESTAMP WITH TIME ZONE NULL
```

### データ型ガイドライン
- **ID**: `BIGSERIAL` (自動インクリメント)
- **文字列**: `VARCHAR(255)` (必要に応じて長さ調整)
- **長文テキスト**: `TEXT`
- **数値**: `INTEGER` または `DECIMAL(10,2)` (金額)
- **真偽値**: `BOOLEAN`
- **日時**: `TIMESTAMP WITH TIME ZONE`
- **JSON**: `JSONB` (PostgreSQL固有)

## 認証・ユーザー管理

### users テーブル
**概要**: システムユーザーの基本情報を管理するテーブルです。ログイン認証、権限管理、ユーザープロフィール情報を格納します。
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    employee_id VARCHAR(50) UNIQUE NOT NULL,                     -- 社員ID（一意）
    name VARCHAR(255) NOT NULL,                                  -- 氏名
    name_kana VARCHAR(255) NULL,                                 -- 氏名（カナ）
    email VARCHAR(255) UNIQUE NOT NULL,                          -- メールアドレス（一意）
    email_verified_at TIMESTAMP WITH TIME ZONE NULL,             -- メール認証日時
    password VARCHAR(255) NOT NULL,                              -- パスワード（ハッシュ化）
    remember_token VARCHAR(100) NULL,                            -- ログイン記憶トークン
    birth_date DATE NULL,                                        -- 生年月日
    gender VARCHAR(10) NULL,                                     -- 性別
    phone VARCHAR(20) NULL,                                      -- 固定電話番号
    mobile_phone VARCHAR(20) NULL,                               -- 携帯電話番号
    postal_code VARCHAR(10) NULL,                                -- 郵便番号
    prefecture VARCHAR(50) NULL,                                 -- 都道府県
    address TEXT NULL,                                           -- 住所
    position VARCHAR(100) NULL,                                  -- 職位
    position_id BIGINT NULL,                                     -- 職位ID（positionsテーブル参照）
    job_title VARCHAR(100) NULL,                                 -- 役職名
    hire_date DATE NULL,                                         -- 入社日
    service_years INTEGER NULL,                                  -- 勤続年数
    service_months INTEGER NULL,                                 -- 勤続月数
    system_level VARCHAR(50) DEFAULT 'staff',                   -- システム権限レベル
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    is_admin BOOLEAN DEFAULT false,                              -- 管理者フラグ
    last_login_at TIMESTAMP WITH TIME ZONE NULL,                 -- 最終ログイン日時
    password_changed_at TIMESTAMP WITH TIME ZONE NULL,           -- パスワード変更日時
    password_expires_at TIMESTAMP WITH TIME ZONE NULL,           -- パスワード有効期限
    failed_login_attempts INTEGER DEFAULT 0,                    -- ログイン失敗回数
    locked_at TIMESTAMP WITH TIME ZONE NULL,                     -- アカウントロック日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時（ソフトデリート）
);

-- インデックス
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_birth_date ON users(birth_date);
CREATE INDEX idx_users_hire_date ON users(hire_date);
CREATE INDEX idx_users_system_level ON users(system_level);
CREATE INDEX idx_users_postal_code ON users(postal_code);
CREATE INDEX idx_users_prefecture ON users(prefecture);
CREATE INDEX idx_users_position_id ON users(position_id);
```

## ユーザー管理関連テーブル

### roles テーブル
**概要**: ユーザーの役割を管理するテーブルです。システム内での権限レベルと機能アクセス権限を定義します。
```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    name VARCHAR(100) UNIQUE NOT NULL,                           -- 役割名（一意）
    display_name VARCHAR(255) NOT NULL,                          -- 表示名
    description TEXT NULL,                                       -- 説明
    priority INTEGER DEFAULT 0,                                  -- 優先度
    is_system BOOLEAN DEFAULT false,                             -- システム役割フラグ
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時（ソフトデリート）
);

-- インデックス
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_priority ON roles(priority);
CREATE INDEX idx_roles_is_active ON roles(is_active);
```

### departments テーブル
**概要**: 組織の部署構造を管理するテーブルです。階層構造、部署コード、管理者情報を格納します。
```sql
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    name VARCHAR(255) NOT NULL,                                  -- 部署名
    code VARCHAR(50) UNIQUE NOT NULL,                            -- 部署コード（一意）
    description TEXT NULL,                                       -- 説明
    parent_id BIGINT NULL,                                       -- 親部署ID
    level INTEGER DEFAULT 0,                                     -- 階層レベル
    path VARCHAR(500) NULL,                                      -- 階層パス
    sort_order INTEGER DEFAULT 0,                                -- ソート順
    manager_id BIGINT NULL,                                      -- 管理者ID
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL,                     -- 削除日時（ソフトデリート）
    
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

### system_levels テーブル
**概要**: システム権限レベルを管理するテーブルです。ユーザーのシステム全体での権限レベルを定義します。
```sql
CREATE TABLE system_levels (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    code VARCHAR(50) UNIQUE NOT NULL,                             -- システムレベルコード（一意）
    name VARCHAR(100) NOT NULL,                                   -- システムレベル名
    display_name VARCHAR(255) NOT NULL,                           -- 表示名
    description TEXT NULL,                                        -- 説明
    priority INTEGER NOT NULL,                                    -- 優先度
    is_system BOOLEAN DEFAULT false,                              -- システムレベルフラグ
    is_active BOOLEAN DEFAULT true,                               -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                      -- 削除日時（ソフトデリート）
);

-- インデックス
CREATE INDEX idx_system_levels_code ON system_levels(code);
CREATE INDEX idx_system_levels_priority ON system_levels(priority);
CREATE INDEX idx_system_levels_is_active ON system_levels(is_active);
```

### permissions テーブル
**概要**: システム内の権限を管理するテーブルです。モジュール、アクション、リソース別に権限を定義します。
```sql
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    name VARCHAR(100) UNIQUE NOT NULL,                            -- 権限名（一意）
    display_name VARCHAR(255) NOT NULL,                           -- 表示名
    description TEXT NULL,                                        -- 説明
    module VARCHAR(100) NOT NULL,                                 -- モジュール名
    action VARCHAR(100) NOT NULL,                                 -- アクション名
    resource VARCHAR(100) NULL,                                   -- リソース名
    is_system BOOLEAN DEFAULT false,                              -- システム権限フラグ
    is_active BOOLEAN DEFAULT true,                               -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                      -- 削除日時（ソフトデリート）
);

-- インデックス
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_is_active ON permissions(is_active);
```

### user_roles テーブル
**概要**: ユーザーと役割の多対多関係を管理するテーブルです。ユーザーに役割を割り当て、有効期限や割り当て履歴を管理します。
```sql
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    user_id BIGINT NOT NULL,                                     -- ユーザーID
    role_id BIGINT NOT NULL,                                     -- 役割ID
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 割り当て日時
    assigned_by BIGINT NULL,                                     -- 割り当て者ID
    expires_at TIMESTAMP WITH TIME ZONE NULL,                    -- 有効期限
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_roles_user_role UNIQUE (user_id, role_id)
);

-- インデックス
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
```

### user_departments テーブル
**概要**: ユーザーと部署の多対多関係を管理するテーブルです。ユーザーの所属部署、役職、プライマリ部署を管理します。
```sql
CREATE TABLE user_departments (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    user_id BIGINT NOT NULL,                                     -- ユーザーID
    department_id BIGINT NOT NULL,                               -- 部署ID
    position VARCHAR(100) NULL,                                  -- 役職
    is_primary BOOLEAN DEFAULT false,                            -- プライマリ部署フラグ
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 割り当て日時
    assigned_by BIGINT NULL,                                     -- 割り当て者ID
    expires_at TIMESTAMP WITH TIME ZONE NULL,                    -- 有効期限
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    
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

### role_permissions テーブル
**概要**: 役割と権限の多対多関係を管理するテーブルです。役割に権限を付与し、付与履歴を管理します。
```sql
CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    role_id BIGINT NOT NULL,                                     -- 役割ID
    permission_id BIGINT NOT NULL,                               -- 権限ID
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 付与日時
    granted_by BIGINT NULL,                                      -- 付与者ID
    
    CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_role_permissions_role_permission UNIQUE (role_id, permission_id)
);

-- インデックス
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
```

### department_permissions テーブル
**概要**: 部署と権限の多対多関係を管理するテーブルです。部署に権限を付与し、付与履歴を管理します。
```sql
CREATE TABLE department_permissions (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    department_id BIGINT NOT NULL,                               -- 部署ID
    permission_id BIGINT NOT NULL,                               -- 権限ID
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 付与日時
    granted_by BIGINT NULL,                                      -- 付与者ID
    
    CONSTRAINT fk_department_permissions_department_id FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    CONSTRAINT fk_department_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_department_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_department_permissions_department_permission UNIQUE (department_id, permission_id)
);

-- インデックス
CREATE INDEX idx_department_permissions_department_id ON department_permissions(department_id);
CREATE INDEX idx_department_permissions_permission_id ON department_permissions(permission_id);
```

### system_level_permissions テーブル
**概要**: システム権限レベルと権限の多対多関係を管理するテーブルです。システムレベルに権限を付与し、付与履歴を管理します。
```sql
CREATE TABLE system_level_permissions (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    system_level_id BIGINT NOT NULL,                             -- システムレベルID
    permission_id BIGINT NOT NULL,                               -- 権限ID
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 付与日時
    granted_by BIGINT NULL,                                      -- 付与者ID
    
    CONSTRAINT fk_system_level_permissions_system_level_id FOREIGN KEY (system_level_id) REFERENCES system_levels(id) ON DELETE CASCADE,
    CONSTRAINT fk_system_level_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_system_level_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_system_level_permissions_system_level_permission UNIQUE (system_level_id, permission_id)
);

-- インデックス
CREATE INDEX idx_system_level_permissions_system_level_id ON system_level_permissions(system_level_id);
CREATE INDEX idx_system_level_permissions_permission_id ON system_level_permissions(permission_id);
```

### user_login_history テーブル
**概要**: ユーザーのログイン履歴を管理するテーブルです。ログイン・ログアウト時刻、IPアドレス、セッション情報を記録します。
```sql
CREATE TABLE user_login_history (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    user_id BIGINT NOT NULL,                                     -- ユーザーID
    login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- ログイン日時
    logout_at TIMESTAMP WITH TIME ZONE NULL,                     -- ログアウト日時
    ip_address INET NULL,                                        -- IPアドレス
    user_agent TEXT NULL,                                        -- ユーザーエージェント
    session_id VARCHAR(255) NULL,                                -- セッションID
    status VARCHAR(50) NOT NULL,                                 -- ステータス
    failure_reason VARCHAR(255) NULL,                            -- 失敗理由
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    
    CONSTRAINT fk_user_login_history_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_user_login_history_user_id ON user_login_history(user_id);
CREATE INDEX idx_user_login_history_login_at ON user_login_history(login_at);
CREATE INDEX idx_user_login_history_status ON user_login_history(status);
```

### positions テーブル
**概要**: 職位マスタを管理するテーブルです。組織内の職位、レベル、表示名を定義します。
```sql
CREATE TABLE positions (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    code VARCHAR(50) UNIQUE NOT NULL,                            -- 職位コード（一意）
    name VARCHAR(100) NOT NULL,                                  -- 職位名
    display_name VARCHAR(255) NOT NULL,                          -- 表示名
    description TEXT NULL,                                       -- 説明
    level INTEGER NOT NULL,                                      -- 職位レベル（1:社員, 2:担当, 3:課長, 4:部長, 5:取締役）
    sort_order INTEGER DEFAULT 0,                                -- ソート順
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時（ソフトデリート）
);

-- インデックス
CREATE INDEX idx_positions_code ON positions(code);
CREATE INDEX idx_positions_level ON positions(level);
CREATE INDEX idx_positions_is_active ON positions(is_active);
CREATE INDEX idx_positions_sort_order ON positions(sort_order);
```

### user_sessions テーブル
**概要**: ユーザーのアクティブセッションを管理するテーブルです。セッションID、IPアドレス、最終アクティビティ時刻を記録します。
```sql
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,                                    -- 主キーID
    user_id BIGINT NOT NULL,                                     -- ユーザーID
    session_id VARCHAR(255) UNIQUE NOT NULL,                     -- セッションID（一意）
    ip_address INET NULL,                                        -- IPアドレス
    user_agent TEXT NULL,                                        -- ユーザーエージェント
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 最終アクティビティ時刻
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,                -- 有効期限
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    
    CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
```

### personal_access_tokens テーブル (Laravel Sanctum)
**概要**: Laravel SanctumによるAPI認証用のトークンを管理するテーブルです。ユーザーのAPIアクセス権限とトークンの有効期限を制御します。
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

## 顧客管理

### customers テーブル
**概要**: 見積対象となる顧客企業の情報を管理するテーブルです。企業名、担当者情報、連絡先、住所などの基本情報を格納し、見積書作成時の顧客選択に使用します。
```sql
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    postal_code VARCHAR(10) NULL,
    city VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'Japan',
    tax_id VARCHAR(50) NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- インデックス
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customers_created_by ON customers(created_by);
```

## 見積管理

### estimates テーブル
**概要**: 見積書の基本情報を管理するテーブルです。見積番号、顧客情報、金額計算、ステータス管理、有効期限、承認フローなどの見積書作成から承認までの全プロセスを管理します。
```sql
CREATE TABLE estimates (
    id BIGSERIAL PRIMARY KEY,
    estimate_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0.10,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'JPY',
    notes TEXT NULL,
    terms_conditions TEXT NULL,
    created_by BIGINT NOT NULL,
    approved_by BIGINT NULL,
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    CONSTRAINT fk_estimates_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_estimates_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_estimates_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- インデックス
CREATE INDEX idx_estimates_estimate_number ON estimates(estimate_number);
CREATE INDEX idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_issue_date ON estimates(issue_date);
CREATE INDEX idx_estimates_expiry_date ON estimates(expiry_date);
CREATE INDEX idx_estimates_created_by ON estimates(created_by);
```

### estimate_items テーブル
**概要**: 見積書の明細項目を管理するテーブルです。商品・サービスの詳細、数量、単価、小計などの明細情報を格納し、見積書の内訳計算に使用します。estimatesテーブルと1対多の関係で管理されます。
```sql
CREATE TABLE estimate_items (
    id BIGSERIAL PRIMARY KEY,
    estimate_id BIGINT NOT NULL,
    item_order INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT '個',
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    CONSTRAINT fk_estimate_items_estimate_id FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_estimate_items_estimate_id ON estimate_items(estimate_id);
CREATE INDEX idx_estimate_items_item_order ON estimate_items(estimate_id, item_order);
```

## システム管理

### system_settings テーブル
**概要**: システム全体の設定値を管理するテーブルです。税率、通貨設定、システムパラメータ、機能フラグなどの動的設定値を格納し、アプリケーションの動作制御に使用します。
```sql
CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT NULL,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, integer, boolean, json
    description TEXT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_public ON system_settings(is_public);
```

### audit_logs テーブル
**概要**: システム内の全操作履歴を記録する監査ログテーブルです。データの作成・更新・削除、ログイン・ログアウト、権限変更などのセキュリティ監査とコンプライアンス要件に対応するための操作履歴を管理します。
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NULL,
    record_id BIGINT NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);

-- インデックス
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## マイグレーション管理

### マイグレーションファイル命名規則
```
YYYY_MM_DD_HHMMSS_create_テーブル名_table.php
```

例：
- `2024_01_15_143000_create_users_table.php`
- `2024_01_15_143100_create_customers_table.php`
- `2024_01_15_143200_create_estimates_table.php`

### シーダーファイル命名規則
```
テーブル名Seeder.php
```

例：
- `UserSeeder.php`
- `CustomerSeeder.php`
- `SystemSettingSeeder.php`

## パフォーマンス最適化

### インデックス戦略
1. **主キー**: 自動的にインデックス作成
2. **外部キー**: 自動的にインデックス作成
3. **検索頻度の高いカラム**: 手動でインデックス作成
4. **複合インデックス**: 複数カラムでの検索に使用

### パーティショニング戦略
- **audit_logs**: 月次パーティショニング
- **estimates**: 年次パーティショニング（大量データの場合）

### クエリ最適化
- N+1問題の回避（Eager Loading）
- 不要なカラムの選択回避
- 適切なWHERE句の使用
- インデックスの活用

## バックアップ・復旧

### バックアップ戦略
- **フルバックアップ**: 日次
- **差分バックアップ**: 時間単位
- **WALアーカイブ**: 継続的

### 復旧手順
1. データベース停止
2. バックアップファイル復元
3. WALログ適用
4. データベース起動
5. 整合性チェック

## セキュリティ

### アクセス制御
- 最小権限の原則
- ロールベースアクセス制御
- 接続制限（IP制限）

### データ暗号化
- 機密データの暗号化
- 通信の暗号化（SSL/TLS）
- バックアップの暗号化

### 監査ログ
- 全操作のログ記録
- 変更履歴の追跡
- セキュリティイベントの監視

## 開発時の注意事項

### マイグレーション作成時
1. 既存データへの影響を確認
2. ロールバック手順を準備
3. パフォーマンスへの影響を考慮
4. セキュリティ要件を満たす

### データ投入時
1. テストデータの品質確保
2. 本番データとの混在防止
3. 個人情報の適切な取り扱い
4. データ量の制御

### 運用時
1. 定期的なパフォーマンス監視
2. インデックスの最適化
3. 不要データの削除
4. バックアップの検証
