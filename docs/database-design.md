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
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
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
