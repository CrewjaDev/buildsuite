# 工事管理機能 業務要件・設計書

## 概要
BuildSuiteシステムの工事管理機能に関する業務要件と設計書です。
見積管理から工事管理、発注管理、支払管理までの一連の業務フローを管理する機能の詳細を定義します。

## 業務フロー概要

### 工事管理の目的
- 見積受注後の工事実行を効率的に管理
- 工事明細の独立管理による柔軟な工事内容調整
- 発注先別の発注書作成と管理
- 支払スケジュールと支払実績の管理
- 工事進捗と原価管理の統合

### 対象ユーザー
- **工事担当者**: 工事計画・実行管理
- **発注担当者**: 発注書作成・管理
- **経理担当者**: 支払管理・原価管理
- **管理者**: 工事進捗・原価分析

## データ連携構造

### 1. 全体の業務フロー構造

```
見積管理 → 工事管理 → 発注管理 → 出来高管理 → 支払管理
    ↓           ↓           ↓           ↓           ↓
  見積データ → 工事データ → 発注データ → 出来高データ → 支払データ
```

### 2. データの独立管理方針

#### 2.1 各段階の独立性
- **見積明細**: 顧客との契約内容として固定保持
- **工事明細**: 実際の工事に応じて柔軟に変更可能
- **発注明細**: 発注時の内容として独立管理
- **支払明細**: 支払時の内容として独立管理

#### 2.2 連携の考え方
- 見積受注時に工事データを初期作成（コピー）
- その後は各段階で独立して管理・変更
- 必要に応じて手動で同期可能
- 履歴として各段階の内容を保持

## データベース設計

### 3. 工事基本情報テーブル

```sql
-- 工事基本情報テーブル
CREATE TABLE constructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    construction_number VARCHAR(50) UNIQUE NOT NULL,             -- 工事番号（例：A-2025-00003）
    change_count INTEGER DEFAULT 1,                              -- 変更回数
    completion_classification VARCHAR(50) DEFAULT '未成',        -- 完成区分（未成/完成）
    estimate_number VARCHAR(100),                                -- 見積番号（例：A-2025-00005-1 [承認待ち]）
    order_date DATE,                                             -- 受注日
    report_date DATE,                                            -- 報告日
    construction_completion_date DATE,                           -- 工事完成日
    construction_finish_date DATE,                               -- 工事完了日
    project_name VARCHAR(255) NOT NULL,                          -- 工事名称
    project_location TEXT,                                       -- 工事場所
    construction_period_start DATE,                              -- 工期開始日
    construction_period_end DATE,                                -- 工期終了日
    partner_id UUID REFERENCES partners(id),                     -- 受注先（取引先ID）
    person_in_charge VARCHAR(100),                               -- 担当者
    department_id UUID REFERENCES departments(id),               -- 部門ID
    order_amount_excluding_tax DECIMAL(12,2) DEFAULT 0,         -- 税抜受注金額
    tax_rate DECIMAL(5,2) DEFAULT 0.10,                          -- 消費税率
    tax_amount DECIMAL(12,2) DEFAULT 0,                          -- 消費税額
    total_order_amount DECIMAL(12,2) DEFAULT 0,                  -- 受注金額
    overhead_rate DECIMAL(5,2) DEFAULT 0.20,                     -- 一般管理費率
    overhead_amount DECIMAL(12,2) DEFAULT 0,                     -- 一般管理費
    construction_cost DECIMAL(12,2) DEFAULT 0,                   -- 工事原価
    
    -- 支払い条件
    closing_date INTEGER DEFAULT 99,                             -- 締日（99:末日）
    payment_cycle VARCHAR(50) DEFAULT '翌月',                    -- 入金サイト
    payment_date INTEGER DEFAULT 99,                             -- 支払日（99:末日）
    due_date INTEGER DEFAULT 99,                                 -- 着日（99:末日）
    cash_ratio INTEGER DEFAULT 10,                               -- 現金比率
    bill_ratio INTEGER DEFAULT 0,                                -- 手形比率
    
    -- 現場情報
    site_person_in_charge VARCHAR(100),                          -- 現場担当者
    site_mobile_number VARCHAR(20),                              -- 現場担当者携帯番号
    site_phone_number VARCHAR(20),                               -- 現場電話番号
    site_fax_number VARCHAR(20),                                 -- 現場FAX番号
    
    -- システム管理
    status VARCHAR(50) DEFAULT 'planning',                       -- 工事ステータス
    progress_rate DECIMAL(5,2) DEFAULT 0,                        -- 進捗率
    remarks TEXT,                                                -- 備考
    created_by UUID REFERENCES users(id),                        -- 作成者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 4. 実行予算内訳テーブル（工事分類別予算管理）

```sql
-- 実行予算内訳テーブル（工事分類別予算管理）
CREATE TABLE construction_budget_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    construction_id UUID REFERENCES constructions(id) ON DELETE CASCADE,
    construction_classification_id UUID REFERENCES construction_classifications(id), -- 工事分類ID
    initial_budget DECIMAL(12,2) DEFAULT 0,                      -- 初期予算（見積明細の工事分類別合計）
    execution_budget DECIMAL(12,2) DEFAULT 0,                    -- 実行予算（実行予算明細の工事分類別合計）
    display_order INTEGER DEFAULT 0,                             -- 表示順序
    is_active BOOLEAN DEFAULT true,                              -- 有効フラグ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 5. 変更履歴テーブル

```sql
-- 変更履歴テーブル
CREATE TABLE construction_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    construction_id UUID REFERENCES constructions(id) ON DELETE CASCADE,
    change_count INTEGER NOT NULL,                               -- 変更回数
    order_amount_excluding_tax DECIMAL(12,2) DEFAULT 0,         -- 税抜受注金額
    initial_budget_amount DECIMAL(12,2) DEFAULT 0,               -- 初期予算金額
    execution_budget_amount DECIMAL(12,2) DEFAULT 0,             -- 実行予算金額
    change_reason TEXT,                                          -- 変更理由
    change_details TEXT,                                         -- 変更詳細
    created_by UUID REFERENCES users(id),                        -- 作成者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6. 実行予算明細テーブル（発注との連携）

```sql
-- 実行予算明細テーブル（発注との連携）
CREATE TABLE construction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    construction_id UUID REFERENCES constructions(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES construction_items(id),            -- 実行予算明細の階層構造
    item_type VARCHAR(20) NOT NULL,                              -- large/medium/small/detail
    display_order INTEGER NOT NULL DEFAULT 0,
    name VARCHAR(500) NOT NULL,                                  -- 実行予算時の品名・仕様
    description TEXT,                                            -- 実行予算時の詳細説明
    quantity DECIMAL(12,2) DEFAULT 1,                            -- 実行予算時の数量
    unit VARCHAR(50) DEFAULT '個',                               -- 実行予算時の単位
    unit_price BIGINT DEFAULT 0,                                 -- 実行予算時の単価
    amount BIGINT DEFAULT 0,                                     -- 実行予算時の金額
    estimated_cost BIGINT DEFAULT 0,                             -- 実行予算時の予想原価
    supplier VARCHAR(255),                                       -- 実行予算時の発注先
    construction_method VARCHAR(255),                            -- 実行予算時の工法
    construction_classification_id UUID REFERENCES construction_classifications(id), -- 工事分類ID
    progress_rate DECIMAL(5,2) DEFAULT 0,                        -- 進捗率
    start_date DATE,                                             -- 開始日
    end_date DATE,                                               -- 完了日
    remarks TEXT,                                                -- 備考
    is_expanded BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 7. 発注ヘッダテーブル（発注書基本情報）

```sql
-- 発注ヘッダテーブル（発注書基本情報）
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    construction_id UUID REFERENCES constructions(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partners(id),                     -- 発注先（取引先ID）
    order_number VARCHAR(50) UNIQUE NOT NULL,                    -- 発注番号（注文書番号）
    order_date DATE NOT NULL,                                    -- 発注日（注文日）
    delivery_date DATE,                                          -- 納期
    person_in_charge VARCHAR(100),                               -- 担当者
    department_id UUID REFERENCES departments(id),               -- 部門ID
    construction_classification_id UUID REFERENCES construction_classifications(id), -- 工事分類ID
    remarks TEXT,                                                -- 備考
    
    -- 支払情報
    cash_ratio INTEGER DEFAULT 0,                                -- 現金比率
    bill_ratio INTEGER DEFAULT 0,                                -- 手形比率
    payment_terms TEXT,                                          -- 支払サイト（支払条件）
    order_amount_excluding_tax BIGINT DEFAULT 0,                -- 税抜発注金額
    tax_rate DECIMAL(5,2) DEFAULT 0.10,                          -- 消費税率
    tax_amount BIGINT DEFAULT 0,                                 -- 消費税額
    total_amount BIGINT DEFAULT 0,                               -- 合計金額
    
    -- システム管理
    status VARCHAR(50) DEFAULT 'draft',                          -- 発注ステータス
    created_by UUID REFERENCES users(id),                        -- 作成者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 8. 発注明細テーブル（発注書明細）

```sql
-- 発注明細テーブル（発注書明細）
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    construction_item_id UUID REFERENCES construction_items(id), -- 実行予算明細ID（元データ）
    display_order INTEGER NOT NULL DEFAULT 0,                    -- 表示順序
    construction_method VARCHAR(255),                            -- 工法/摘要
    unit_price BIGINT NOT NULL,                                  -- 単価
    quantity DECIMAL(12,2) NOT NULL,                             -- 数量
    unit VARCHAR(50) NOT NULL,                                   -- 単位
    amount BIGINT NOT NULL,                                      -- 金額
    remarks TEXT,                                                -- 備考
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 9. 支払基本情報テーブル

```sql
-- 支払基本情報テーブル（発注との連携）
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,       -- 発注との連携
    partner_id UUID REFERENCES partners(id),                     -- 支払先（取引先ID）
    payment_number VARCHAR(50) UNIQUE NOT NULL,                  -- 支払番号
    payment_date DATE NOT NULL,                                  -- 支払日
    total_amount BIGINT DEFAULT 0,                               -- 支払合計金額
    payment_method VARCHAR(50),                                  -- 支払方法
    status VARCHAR(50) DEFAULT 'pending',                        -- 支払ステータス
    remarks TEXT,                                                -- 備考
    created_by UUID REFERENCES users(id),                        -- 作成者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 10. 出来高管理テーブル（発注に対する納品分記録）

```sql
-- 出来高管理テーブル（納品分記録）
CREATE TABLE construction_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,        -- 発注ID
    achievement_date DATE NOT NULL,                              -- 出来高日
    quantity DECIMAL(12,2) NOT NULL,                             -- 今回出来高数量
    amount BIGINT NOT NULL,                                      -- 今回出来高金額
    remarks TEXT,                                                -- 備考
    created_by UUID REFERENCES users(id),                        -- 作成者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 11. 支払明細テーブル（発注明細とのみ連携）

```sql
-- 支払明細テーブル（発注明細とのみ連携）
CREATE TABLE payment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id),               -- 発注明細とのみ連携
    item_name VARCHAR(500) NOT NULL,                             -- 支払時の品名
    quantity DECIMAL(12,2) NOT NULL,                             -- 支払数量
    unit VARCHAR(50) NOT NULL,                                   -- 支払単位
    unit_price BIGINT NOT NULL,                                  -- 支払単価
    amount BIGINT NOT NULL,                                      -- 支払金額
    payment_date DATE NOT NULL,                                  -- 支払日
    remarks TEXT,                                                -- 備考
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

## インデックス設計

### 11. 工事基本情報のインデックス

```sql
-- 工事基本情報のインデックス
CREATE INDEX idx_constructions_number ON constructions(construction_number);
CREATE INDEX idx_constructions_estimate_number ON constructions(estimate_number);
CREATE INDEX idx_constructions_partner_id ON constructions(partner_id);
CREATE INDEX idx_constructions_department_id ON constructions(department_id);
CREATE INDEX idx_constructions_status ON constructions(status);
CREATE INDEX idx_constructions_order_date ON constructions(order_date);
```

### 12. 実行予算内訳のインデックス

```sql
-- 実行予算内訳のインデックス
CREATE INDEX idx_budget_breakdowns_construction_id ON construction_budget_breakdowns(construction_id);
CREATE INDEX idx_budget_breakdowns_classification_id ON construction_budget_breakdowns(construction_classification_id);
```

### 13. 変更履歴のインデックス

```sql
-- 変更履歴のインデックス
CREATE INDEX idx_change_history_construction_id ON construction_change_history(construction_id);
CREATE INDEX idx_change_history_change_count ON construction_change_history(change_count);
CREATE INDEX idx_change_history_created_at ON construction_change_history(created_at);
```

### 14. 実行予算明細のインデックス

```sql
-- 実行予算明細のインデックス
CREATE INDEX idx_construction_items_construction_id ON construction_items(construction_id);
CREATE INDEX idx_construction_items_parent_id ON construction_items(parent_id);
CREATE INDEX idx_construction_items_type ON construction_items(item_type);
CREATE INDEX idx_construction_items_classification ON construction_items(construction_classification_id);
```

### 15. 発注関連のインデックス

```sql
-- 発注ヘッダのインデックス
CREATE INDEX idx_orders_construction_id ON orders(construction_id);
CREATE INDEX idx_orders_partner_id ON orders(partner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);

-- 発注明細のインデックス
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_construction_item_id ON order_items(construction_item_id);
CREATE INDEX idx_order_items_classification ON order_items(construction_classification_id);
CREATE INDEX idx_order_items_display_order ON order_items(display_order);

-- 出来高管理のインデックス
CREATE INDEX idx_construction_achievements_order_id ON construction_achievements(order_id);
CREATE INDEX idx_construction_achievements_date ON construction_achievements(achievement_date);
CREATE INDEX idx_construction_achievements_order_date ON construction_achievements(order_id, achievement_date);

-- 支払明細のインデックス
CREATE INDEX idx_payment_items_payment_id ON payment_items(payment_id);
CREATE INDEX idx_payment_items_order_item_id ON payment_items(order_item_id);
```
```
```

## データ変換・連携機能

### 9. 見積→工事データの変換

```typescript
// 見積から工事データへの変換インターフェース
interface EstimateToConstructionConverter {
  // 見積から工事データを作成
  convertEstimateToConstruction(estimate_id: number): ConstructionData;
  
  // 見積明細から工事明細を作成（初期コピー）
  convertEstimateItemsToConstructionItems(
    estimate_id: number, 
    construction_id: number
  ): ConstructionItemData[];
  
  // 個別明細の変換
  convertEstimateItemToConstructionItem(
    estimate_item_id: number,
    construction_id: number
  ): ConstructionItemData;
}

// 工事データ構造
interface ConstructionData {
  id: number;
  estimate_id: number;
  construction_number: string;
      partner_id: number;
  project_name: string;
  project_location: string;
  project_period_start: Date;
  project_period_end: Date;
  order_date: Date;
  order_amount: number;
  status: string;
  created_at: Date;
}

// 工事明細データ構造
interface ConstructionItemData {
  id: number;
  construction_id: number;
  estimate_item_id: number;
  item_type: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  estimated_cost: number;
  supplier: string;
  construction_method: string;
  work_classification: string;
  progress_rate: number;
  start_date: Date;
  end_date: Date;
  remarks: string;
  created_at: Date;
}
```

### 10. 実行予算明細→発注データの変換

```typescript
// 実行予算明細から発注データへの変換インターフェース
interface ConstructionToOrderConverter {
  // 実行予算明細から発注書を作成（1明細1発注書）
  createOrderFromConstructionItem(
    construction_item_id: number,
    partner_id: number
  ): OrderData;
  
  // 複数の実行予算明細から発注書を作成
  createOrdersFromConstructionItems(
    construction_item_ids: number[]
  ): OrderData[];
  
  // 発注先別に発注書を作成
  createOrdersBySupplier(construction_id: number): OrderData[];
  
  // 実行予算明細から発注明細を作成
  createOrderItemsFromConstructionItems(
    construction_item_ids: number[],
    order_id: number
  ): OrderItemData[];
}
```

// 発注ヘッダデータ構造
interface OrderData {
  id: number;
  construction_id: number;
  partner_id: number;
  order_number: string;
  order_date: Date;
  delivery_date: Date;
  total_amount: number;
  status: string;
  created_at: Date;
}

// 発注明細データ構造
interface OrderItemData {
  id: number;
  order_id: number;
  construction_item_id: number;  // 実行予算明細ID（元データ）
  display_order: number;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  delivery_date: Date;
  construction_method: string;
  construction_classification_id: number;
  remarks: string;
  created_at: Date;
}
```

### 11. 発注データ→支払データの変換

```typescript
// 発注データから支払データへの変換インターフェース
interface OrderToPaymentConverter {
  // 発注書から支払データを作成
  createPaymentFromOrder(order_id: number): PaymentData;
  
  // 発注明細から支払明細を作成
  createPaymentItemsFromOrderItems(
    order_item_ids: number[],
    payment_id: number
  ): PaymentItemData[];
  
  // 支払スケジュールを作成
  createPaymentSchedule(order_id: number): PaymentScheduleData[];
}
```

// 支払データ構造
interface PaymentData {
  id: number;
  order_id: number;
  partner_id: number;
  payment_number: string;
  payment_date: Date;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: Date;
}

// 支払明細データ構造
interface PaymentItemData {
  id: number;
  payment_id: number;
  order_item_id: number;  // 発注明細との連携
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  payment_date: Date;
  remarks: string;
  created_at: Date;
}

// 支払スケジュールデータ構造
interface PaymentScheduleData {
  id: number;
  order_id: number;
  payment_number: string;
  scheduled_date: Date;
  amount: number;
  payment_condition: string;
  status: string;
  created_at: Date;
}
```

## API設計

### 12. 工事管理API

```php
// 工事基本情報API
GET    /api/v1/constructions                           # 工事一覧取得
POST   /api/v1/constructions                           # 工事作成
GET    /api/v1/constructions/{id}                      # 工事詳細取得
PUT    /api/v1/constructions/{id}                      # 工事更新
DELETE /api/v1/constructions/{id}                      # 工事削除

// 工事明細API
GET    /api/v1/constructions/{id}/items                # 工事明細一覧取得
POST   /api/v1/constructions/{id}/items                # 工事明細作成
GET    /api/v1/constructions/{id}/items/{item_id}      # 工事明細詳細取得
PUT    /api/v1/constructions/{id}/items/{item_id}      # 工事明細更新
DELETE /api/v1/constructions/{id}/items/{item_id}      # 工事明細削除

// 発注管理API
GET    /api/v1/constructions/{id}/orders               # 発注一覧取得
POST   /api/v1/constructions/{id}/orders               # 発注作成
GET    /api/v1/constructions/{id}/orders/{order_id}    # 発注詳細取得
PUT    /api/v1/constructions/{id}/orders/{order_id}    # 発注更新
DELETE /api/v1/constructions/{id}/orders/{order_id}    # 発注削除

// 発注明細管理API
GET    /api/v1/orders/{id}/items                       # 発注明細一覧取得
POST   /api/v1/orders/{id}/items                       # 発注明細作成
GET    /api/v1/orders/{id}/items/{item_id}             # 発注明細取得
PUT    /api/v1/orders/{id}/items/{item_id}             # 発注明細更新
DELETE /api/v1/orders/{id}/items/{item_id}             # 発注明細削除

// 支払管理API
GET    /api/v1/orders/{id}/payments                    # 支払一覧取得
POST   /api/v1/orders/{id}/payments                    # 支払作成
GET    /api/v1/orders/{id}/payments/{payment_id}       # 支払詳細取得
PUT    /api/v1/orders/{id}/payments/{payment_id}       # 支払更新
DELETE /api/v1/orders/{id}/payments/{payment_id}       # 支払削除
```

### 13. データ変換・連携API

```php
// 見積から工事データへの変換API
POST   /api/v1/estimates/{id}/convert-to-construction    # 見積から工事データ作成

// 工事データから発注データへの変換API
POST   /api/v1/constructions/{id}/create-orders          # 工事から発注書作成
POST   /api/v1/constructions/{id}/create-orders-by-supplier # 発注先別発注書作成

// 発注データから支払データへの変換API
POST   /api/v1/orders/{id}/create-payment                # 発注から支払データ作成
POST   /api/v1/orders/{id}/create-payment-schedule       # 発注から支払スケジュール作成

// データ連携状況確認API
GET    /api/v1/constructions/{id}/linkage-status         # 工事連携状況確認
GET    /api/v1/orders/{id}/linkage-status                # 発注連携状況確認
```

## フロントエンド設計

### 14. コンポーネント構成

```typescript
// 工事管理コンポーネント
components/
├── construction/
│   ├── ConstructionList.tsx           # 工事一覧
│   ├── ConstructionDetail.tsx         # 工事詳細
│   ├── ConstructionForm.tsx           # 工事作成・編集フォーム
│   ├── ConstructionItems.tsx          # 工事明細管理
│   ├── ConstructionItemForm.tsx       # 工事明細作成・編集フォーム
│   ├── OrderManagement.tsx            # 発注管理
│   ├── OrderForm.tsx                  # 発注書作成・編集フォーム
│   ├── OrderItems.tsx                 # 発注明細管理
│   ├── PaymentManagement.tsx          # 支払管理
│   ├── PaymentForm.tsx                # 支払作成・編集フォーム
│   ├── PaymentItems.tsx               # 支払明細管理
│   ├── ProgressManagement.tsx         # 進捗管理
│   ├── CostManagement.tsx             # 原価管理
│   └── DataComparison.tsx             # データ比較・分析
```

### 15. 状態管理

```typescript
// 工事管理の状態管理
interface ConstructionState {
  // 工事データ
  constructions: Construction[];
  currentConstruction: Construction | null;
  
  // 工事明細データ
  constructionItems: ConstructionItem[];
  selectedItems: string[];
  
  // 発注データ
  orders: Order[];
  currentOrder: Order | null;
  
  // 支払データ
  payments: Payment[];
  currentPayment: Payment | null;
  
  // UI状態
  loading: boolean;
  error: string | null;
}
```

## 業務フロー

### 16. 工事管理フロー

#### 16.1 見積受注→工事開始フロー
1. **見積受注**: 見積が受注される
2. **工事データ作成**: 見積データから工事データを初期作成
3. **工事計画策定**: 工事明細の詳細計画を策定
4. **工事開始**: 工事ステータスを「実行中」に変更

#### 16.2 発注管理フロー
1. **発注計画**: 工事明細から発注計画を策定
2. **発注先選定**: 各明細の発注先を決定
3. **発注書作成**: 発注先別に発注書を作成
4. **発注実行**: 発注書を発行・管理

#### 16.3 支払管理フロー
1. **支払計画**: 発注内容から支払計画を策定
2. **支払スケジュール**: 支払条件に基づくスケジュール作成
3. **支払実行**: 実際の支払を記録・管理
4. **原価分析**: 支払実績から原価分析を実施

### 17. データ比較・分析機能

#### 17.1 見積vs工事の比較
- 見積時の数量・単価・金額と工事時の差異分析
- 変更理由の記録・管理
- 影響度の評価

#### 17.2 工事vs発注の比較
- 工事計画と発注内容の差異分析
- 発注先別の原価分析
- 発注効率の評価

#### 17.3 発注vs支払の比較
- 発注金額と支払金額の差異分析
- 支払遅延の管理
- 支払効率の評価

## 検証・制約

### 18. データ整合性

#### 18.1 階層構造の制約
- 工事明細の階層構造は見積明細と同様の制約
- 発注明細は工事明細との1対1対応
- 支払明細は発注明細との1対1対応

#### 18.2 金額計算の制約
- 工事明細の合計金額と工事基本情報の整合性
- 発注明細の合計金額と発注基本情報の整合性
- 支払明細の合計金額と支払基本情報の整合性

### 19. パフォーマンス

#### 19.1 大量データ対応
- 工事明細の階層構造表示の最適化
- 発注先別データの効率的な取得
- 支払スケジュールの計算最適化

#### 19.2 同時アクセス対応
- 複数ユーザーによる工事データの同時編集
- 発注書の同時作成・編集
- 支払データの同時更新

この設計により、見積から工事管理、発注管理、支払管理までの一貫した業務フローを実現し、各段階のデータを独立して管理しながら、必要な連携を維持することができます。
