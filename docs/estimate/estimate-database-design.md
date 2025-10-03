# 見積管理機能 データベース設計書

## 概要
見積管理機能のデータベース設計に関する詳細仕様書です。
見積内訳と見積明細の2段管理による新設計のテーブル定義を記載します。

## テーブル一覧

### 1. 見積基本情報テーブル (estimates)
```sql
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                    -- 見積ID（主キー）
    estimate_number VARCHAR(50) UNIQUE NOT NULL,                      -- 見積番号（一意）
    partner_id BIGINT NOT NULL REFERENCES partners(id),               -- 取引先ID（外部キー）
    project_type_id BIGINT NOT NULL REFERENCES project_types(id),     -- 工事種別ID（外部キー）
    project_name VARCHAR(500) NOT NULL,                               -- 工事名称
    project_location TEXT,                                            -- 工事場所
    project_period_start DATE,                                        -- 工事期間開始日
    project_period_end DATE,                                          -- 工事期間終了日
    description TEXT,                                                 -- 工事内容詳細
    status VARCHAR(20) DEFAULT 'draft',                               -- 見積ステータス（draft/approved/rejected）
    issue_date DATE,                                                  -- 発行日
    expiry_date DATE,                                                 -- 有効期限
    currency VARCHAR(10) NOT NULL DEFAULT 'JPY',                      -- 通貨
    subtotal NUMERIC DEFAULT 0,                                       -- 税抜見積金額
    overhead_rate NUMERIC DEFAULT 0,                                  -- 一般管理費率（%）
    overhead_amount NUMERIC DEFAULT 0,                                -- 一般管理費額
    cost_expense_rate NUMERIC DEFAULT 0,                              -- 原価経費率（%）
    cost_expense_amount NUMERIC DEFAULT 0,                            -- 原価経費額
    material_expense_rate NUMERIC DEFAULT 0,                          -- 材料経費率（%）
    material_expense_amount NUMERIC DEFAULT 0,                        -- 材料経費額
    tax_rate NUMERIC DEFAULT 0.1,                                     -- 消費税率（%）
    tax_amount NUMERIC DEFAULT 0,                                     -- 消費税額
    discount_rate NUMERIC DEFAULT 0,                                  -- 割引率（%）
    discount_amount NUMERIC DEFAULT 0,                                -- 割引額
    total_amount NUMERIC DEFAULT 0,                                   -- 合計金額（税込）
    profit_margin NUMERIC DEFAULT 0,                                  -- 利益率（%）
    profit_amount NUMERIC DEFAULT 0,                                  -- 利益額
    payment_terms TEXT,                                               -- 支払条件
    delivery_terms TEXT,                                              -- 納期条件
    warranty_period VARCHAR(255),                                     -- 保証期間
    notes TEXT,                                                       -- 備考
    created_by BIGINT NOT NULL REFERENCES users(id),                  -- 作成者ID（外部キー）
    approved_by BIGINT REFERENCES users(id),                          -- 承認者ID（外部キー）
    approved_at TIMESTAMP,                                            -- 承認日時
    approval_request_id BIGINT,                                       -- 承認リクエストID
    approval_status VARCHAR(20) DEFAULT 'draft',                      -- 承認ステータス
    approval_flow_id BIGINT,                                          -- 承認フローID
    tax_rate_id BIGINT,                                               -- 税率ID
    visibility VARCHAR(20) DEFAULT 'private',                         -- 可視性
    department_id BIGINT,                                             -- 部門ID
    responsible_user_id BIGINT,                                       -- 責任者ID    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- 作成日時
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- 更新日時
    deleted_at TIMESTAMP NULL                                         -- 削除日時（ソフトデリート）
);
```

### 2. 見積内訳構造テーブル (estimate_breakdowns) ✅ 実装済み
```sql
CREATE TABLE estimate_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                    -- 内訳ID（主キー）
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE, -- 見積ID（外部キー）
    parent_id UUID REFERENCES estimate_breakdowns(id),                -- 親内訳ID（階層構造用、自己参照）
    breakdown_type VARCHAR(20) NOT NULL,                              -- 内訳種別（'large': 大内訳, 'medium': 中内訳, 'small': 小内訳）
    name VARCHAR(500) NOT NULL,                                       -- 内訳名
    display_order INTEGER DEFAULT 0,                                  -- 表示順序
    description TEXT,                                                 -- 詳細説明
    quantity DECIMAL(12,2) DEFAULT 1,                                 -- 数量
    unit VARCHAR(50) DEFAULT '個',                                    -- 単位
    unit_price BIGINT DEFAULT 0,                                      -- 単価（顧客提示用）
    direct_amount BIGINT DEFAULT 0,                                   -- 直接入力金額（一式等のケース用）
    calculated_amount BIGINT DEFAULT 0,                               -- 最終表示金額（システム計算による自動集計）
    estimated_cost BIGINT DEFAULT 0,                                  -- 予想原価（社内用）
    supplier_id BIGINT REFERENCES partners(id),                       -- 発注先ID（外部キー）
    construction_method VARCHAR(255),                                 -- 工法
    construction_classification_id BIGINT REFERENCES construction_classifications(id), -- 工事分類ID（外部キー）
    remarks TEXT,                                                     -- 備考
    order_request_content TEXT,                                       -- 発注依頼内容
    is_active BOOLEAN DEFAULT true,                                   -- 有効フラグ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                          -- 削除日時（ソフトデリート）
);
```

### 3. 見積明細アイテムテーブル (estimate_items) ✅ 実装済み
```sql
CREATE TABLE estimate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                    -- 明細ID（主キー）
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE, -- 見積ID（外部キー）
    breakdown_id UUID REFERENCES estimate_breakdowns(id),             -- 小内訳ID（外部キー、nullable）
    name VARCHAR(500) NOT NULL,                                       -- 品名・仕様
    description TEXT,                                                 -- 詳細説明
    quantity DECIMAL(12,2) DEFAULT 1,                                 -- 数量
    unit VARCHAR(50) DEFAULT '個',                                    -- 単位
    unit_price BIGINT DEFAULT 0,                                      -- 単価（顧客提示用）
    amount BIGINT DEFAULT 0,                                          -- 金額（quantity × unit_price の計算結果）
    estimated_cost BIGINT DEFAULT 0,                                  -- 予想原価（社内用）
    supplier_id BIGINT REFERENCES partners(id),                       -- 発注先ID（外部キー）
    construction_method VARCHAR(255),                                 -- 工法
    construction_classification_id BIGINT REFERENCES construction_classifications(id), -- 工事分類ID（外部キー）
    remarks TEXT,                                                     -- 備考
    order_request_content TEXT,                                       -- 発注依頼内容
    is_active BOOLEAN DEFAULT true,                                   -- 有効フラグ
    display_order INTEGER DEFAULT 0,                                  -- 表示順序
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                          -- 削除日時（ソフトデリート）
);
```

## インデックス設計

### estimate_breakdowns テーブルのインデックス
```sql
-- 基本インデックス
CREATE INDEX idx_estimate_breakdowns_estimate_id ON estimate_breakdowns(estimate_id);                    -- 見積ID検索用
CREATE INDEX idx_estimate_breakdowns_parent_id ON estimate_breakdowns(parent_id);                        -- 親内訳検索用
CREATE INDEX idx_estimate_breakdowns_breakdown_type ON estimate_breakdowns(breakdown_type);              -- 内訳種別検索用
CREATE INDEX idx_estimate_breakdowns_display_order ON estimate_breakdowns(display_order);                -- 表示順序ソート用
CREATE INDEX idx_estimate_breakdowns_is_active ON estimate_breakdowns(is_active);                        -- 有効フラグ検索用

-- 外部キー関連インデックス
CREATE INDEX idx_estimate_breakdowns_construction_classification_id ON estimate_breakdowns(construction_classification_id); -- 工事分類検索用
CREATE INDEX idx_estimate_breakdowns_supplier_id ON estimate_breakdowns(supplier_id);                    -- 発注先検索用

-- 複合インデックス
CREATE INDEX idx_estimate_breakdowns_estimate_type_order ON estimate_breakdowns(estimate_id, breakdown_type, display_order); -- 見積別内訳一覧表示用
CREATE INDEX idx_estimate_breakdowns_parent_type ON estimate_breakdowns(parent_id, breakdown_type);      -- 親内訳別子内訳検索用
```

### estimate_items テーブルのインデックス
```sql
-- 基本インデックス
CREATE INDEX idx_estimate_items_estimate_id ON estimate_items(estimate_id);                                -- 見積ID検索用
CREATE INDEX idx_estimate_items_breakdown_id ON estimate_items(breakdown_id);                              -- 小内訳ID検索用
CREATE INDEX idx_estimate_items_display_order ON estimate_items(display_order);                            -- 表示順序ソート用
CREATE INDEX idx_estimate_items_is_active ON estimate_items(is_active);                                    -- 有効フラグ検索用

-- 外部キー関連インデックス
CREATE INDEX idx_estimate_items_construction_classification_id ON estimate_items(construction_classification_id); -- 工事分類検索用
CREATE INDEX idx_estimate_items_supplier_id ON estimate_items(supplier_id);                                -- 発注先検索用

-- 複合インデックス
CREATE INDEX idx_estimate_items_estimate_breakdown ON estimate_items(estimate_id, breakdown_id);            -- 見積別小内訳別明細検索用
CREATE INDEX idx_estimate_items_breakdown_order ON estimate_items(breakdown_id, display_order);            -- 小内訳別明細表示順序用
```

## 外部キー制約

### estimate_breakdowns テーブル
```sql
-- 見積基本情報への参照（見積削除時は内訳も削除）
ALTER TABLE estimate_breakdowns 
ADD CONSTRAINT fk_estimate_breakdowns_estimate_id 
FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE;

-- 親内訳への自己参照（親内訳削除時は子内訳も削除）
ALTER TABLE estimate_breakdowns 
ADD CONSTRAINT fk_estimate_breakdowns_parent_id 
FOREIGN KEY (parent_id) REFERENCES estimate_breakdowns(id) ON DELETE CASCADE;

-- 工事分類への参照（工事分類削除時はNULLに設定）
ALTER TABLE estimate_breakdowns 
ADD CONSTRAINT fk_estimate_breakdowns_construction_classification_id 
FOREIGN KEY (construction_classification_id) REFERENCES construction_classifications(id);

-- 発注先への参照（発注先削除時はNULLに設定）
ALTER TABLE estimate_breakdowns 
ADD CONSTRAINT fk_estimate_breakdowns_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES partners(id);
```

### estimate_items テーブル
```sql
-- 見積基本情報への参照（見積削除時は明細も削除）
ALTER TABLE estimate_items 
ADD CONSTRAINT fk_estimate_items_estimate_id 
FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE;

-- 小内訳への参照（小内訳削除時は明細も削除）
ALTER TABLE estimate_items 
ADD CONSTRAINT fk_estimate_items_breakdown_id 
FOREIGN KEY (breakdown_id) REFERENCES estimate_breakdowns(id) ON DELETE CASCADE;

-- 工事分類への参照（工事分類削除時はNULLに設定）
ALTER TABLE estimate_items 
ADD CONSTRAINT fk_estimate_items_construction_classification_id 
FOREIGN KEY (construction_classification_id) REFERENCES construction_classifications(id);

-- 発注先への参照（発注先削除時はNULLに設定）
ALTER TABLE estimate_items 
ADD CONSTRAINT fk_estimate_items_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES partners(id);
```

## データ型の説明

### 主要フィールドの説明

#### estimates テーブル
- **estimate_number**: 見積番号（一意制約、自動採番）
- **partner_id**: 取引先ID（必須、外部キー）
- **project_type_id**: 工事種別ID（必須、外部キー）
- **status**: 見積ステータス（'draft': 下書き, 'approved': 承認済み, 'rejected': 却下）
- **currency**: 通貨（デフォルト: 'JPY'）
- **subtotal**: 税抜見積金額（内訳・明細の合計）
- **total_amount**: 合計金額（税込、割引適用後）
- **overhead_rate/amount**: 一般管理費率・額
- **cost_expense_rate/amount**: 原価経費率・額
- **material_expense_rate/amount**: 材料経費率・額
- **profit_margin/amount**: 利益率・額
- **payment_terms**: 支払条件
- **delivery_terms**: 納期条件
- **warranty_period**: 保証期間
- **approval_request_id**: 承認リクエストID
- **approval_status**: 承認ステータス
- **approval_flow_id**: 承認フローID
- **tax_rate_id**: 税率ID
- **visibility**: 可視性（'private': 非公開, 'public': 公開）
- **department_id**: 部門ID
- **responsible_user_id**: 責任者ID
- **created_by_department_id**: 作成時の部署ID（監査用）
- **created_by_position_code**: 作成時の職位コード（監査用）
- **created_by_system_level**: 作成時のシステム権限レベル（監査用）
- **created_by_role**: 作成時の役割（監査用）
- **created_by_snapshot**: 作成時のユーザー情報スナップショット（監査用）

#### estimate_breakdowns テーブル
- **breakdown_type**: 内訳種別（'large': 大内訳, 'medium': 中内訳, 'small': 小内訳）
- **parent_id**: 親内訳ID（階層構造用、自己参照）
- **direct_amount**: 直接入力金額（一式等のケース用）
- **calculated_amount**: 最終表示金額（システム計算による自動集計）
- **estimated_cost**: 予想原価（社内用）

#### estimate_items テーブル
- **breakdown_id**: 小内訳ID（外部キー、nullable、小内訳に紐づかない明細も許可）
- **amount**: 金額（quantity × unit_price の計算結果）
- **estimated_cost**: 予想原価（社内用）

## 金額計算ロジック

### 内訳金額の決定ルール
1. **下位アイテムの合計計算**
   - その内訳に紐づく下位のアイテム（明細や小内訳）の金額を合計
   - 明細の場合は`amount`フィールドの合計
   - 小内訳の場合は`calculated_amount`フィールドの合計

2. **金額の決定**
   - **合計値 > 0**: 下位アイテムが存在する場合、合計値を内訳の金額として採用
   - **合計値 = 0**: 下位アイテムが存在しない場合、`direct_amount`を内訳の金額として採用

3. **最終金額の設定**
   - 決定された金額を`calculated_amount`フィールドに保存
   - 画面表示やPDF出力では`calculated_amount`を使用

### 予想原価の決定ルール
1. **下位アイテムの合計計算**
   - その内訳に紐づく下位のアイテム（明細や小内訳）の予想原価を合計
   - 明細の場合は`estimated_cost`フィールドの合計
   - 小内訳の場合は`estimated_cost`フィールドの合計

2. **予想原価の決定**
   - **合計値 > 0**: 下位アイテムが存在する場合、合計値を内訳の予想原価として採用
   - **合計値 = 0**: 下位アイテムが存在しない場合、内訳自身の`estimated_cost`を採用

3. **最終予想原価の設定**
   - 決定された予想原価を`estimated_cost`フィールドに保存
   - 画面表示やPDF出力では`estimated_cost`を使用

## 実装状況

### 完了済み項目 ✅
- [x] テーブル構造の実装完了
- [x] インデックスの実装完了
- [x] 外部キー制約の実装完了
- [x] 金額計算ロジックの実装完了
- [x] 予想原価計算ロジックの実装完了
- [x] データシーダーの実装完了
- [x] API実装の完了

### 実装ファイル
- **マイグレーション**: `backend/database/migrations/2025_09_05_081757_create_estimate_breakdowns_table.php`
- **モデル**: `backend/app/Models/EstimateBreakdown.php`
- **コントローラー**: `backend/app/Http/Controllers/EstimateBreakdownController.php`
- **シーダー**: `backend/database/seeders/EstimateBreakdownSeeder.php`

---

**最終更新日**: 2025年1月27日  
**更新者**: 開発チーム  
**実装状況**: 完全実装完了（estimatesテーブル構造を実際のDBに同期、スナップショット機能追加）
