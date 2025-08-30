# 見積管理機能 詳細仕様書

## 概要
BuildSuiteシステムの見積管理機能に関する詳細な仕様書です。
建設業向けの見積書作成から承認、出力までを管理する機能の詳細を定義します。

## 機能概要

### 見積管理の目的
- 建設工事の見積書を効率的に作成・管理
- 承認フローによる適切な承認プロセス
- 高品質な見積書の出力
- 見積履歴の管理と分析

### 対象ユーザー
- **営業担当者**: 見積書の作成・編集
- **部門長**: 見積書の承認
- **経営陣**: 最終承認
- **管理者**: 見積分析・レポート

## 見積仕様

### 1. 見積基本情報を親とした階層構造

#### 1.1 基本概念
見積基本情報を親として、以下の階層構造で構成されます：

1. **見積基本情報（Estimate）**: 見積の基本情報を管理（親）
2. **見積明細（Estimate Items）**: 階層構造を持つ明細項目を管理（子）

```typescript
// 見積基本情報を親とした階層構造
interface EstimateHierarchy {
  estimate: Estimate;                     // 見積基本情報（親）
  items: EstimateItem[];                  // 見積明細一覧（階層構造）
}
// 見積基本情報
interface Estimate {
  id: number;                             // 見積ID
  estimate_number: string;                // 見積番号
  customer_id: number;                    // 顧客ID
  project_type_id: number;                // 工事種別ID
  project_name: string;                   // 工事名称
  project_location?: string;              // 工事場所
  project_period_start?: Date;            // 工事期間開始日
  project_period_end?: Date;              // 工事期間終了日
  description?: string;                   // 工事内容詳細
  status: string;                         // 見積ステータス
  issue_date: Date;                       // 発行日
  expiry_date: Date;                      // 有効期限
  currency: string;                       // 通貨
  subtotal: number;                       // 小計
  overhead_rate: number;                  // 一般管理費率（%）
  overhead_amount: number;                // 一般管理費額
  cost_expense_rate: number;              // 原価経費率（%）
  cost_expense_amount: number;            // 原価経費額
  material_expense_rate: number;          // 材料経費率（%）
  material_expense_amount: number;        // 材料経費額
  tax_rate: number;                       // 消費税率
  tax_amount: number;                     // 消費税額
  discount_rate: number;                  // 割引率
  discount_amount: number;                // 割引額
  total_amount: number;                   // 合計金額
  profit_margin: number;                  // 利益率
  profit_amount: number;                  // 利益額
  payment_terms?: string;                 // 支払条件
  delivery_terms?: string;                // 納期条件
  warranty_period?: string;               // 保証期間
  notes?: string;                         // 備考
  created_by: number;                     // 作成者ID
  approved_by?: number;                   // 承認者ID
  approved_at?: Date;                     // 承認日時
  created_at: Date;                       // 作成日時
  updated_at: Date;                       // 更新日時
  deleted_at?: Date;                      // 削除日時
}

// 見積明細（階層構造対応）
interface EstimateItem {
  id: string;                             // 明細ID
  estimate_id: string;                    // 見積ID
  parent_id?: string;                     // 親明細ID（階層構造用）
  item_type: 'large' | 'medium' | 'small' | 'detail'; // 明細種別
  display_order: number;                  // 表示順序
  name: string;                           // 品名・仕様・内訳名
  description?: string;                   // 詳細説明
  quantity: number;                       // 数量
  unit: string;                           // 単位
  unit_price: number;                     // 単価（顧客提示用）
  amount: number;                         // 金額（顧客提示用）
  estimated_cost: number;                 // 予想原価（社内用）
      supplier?: string;                      // 発注先
    construction_method?: string;           // 工法
    construction_classification_id?: string; // 工事分類ID
    remarks?: string;                       // 備考
  is_expanded: boolean;                   // 展開状態
  is_active: boolean;                     // 有効フラグ
  children?: EstimateItem[];              // 子要素
  level: number;                          // 階層レベル
  created_at: Date;                       // 作成日時
  updated_at: Date;                       // 更新日時
}
```

#### 1.2 見積明細の階層構造

見積明細は以下の階層構造をサポートします：

1. **大内訳（Large）**: 最上位の分類（例：土木工事、建築工事）
2. **中内訳（Medium）**: 中間分類（例：基礎工事、躯体工事）
3. **小内訳（Small）**: 最小分類（例：コンクリート工事、鉄筋工事）
4. **明細行（Detail）**: 具体的な工事項目

```typescript
// 明細種別の定義
enum ItemType {
  LARGE = 'large',      // 大内訳
  MEDIUM = 'medium',    // 中内訳
  SMALL = 'small',      // 小内訳
  DETAIL = 'detail'     // 明細行
}

// 階層構造の制約
interface HierarchyConstraints {
  // 大内訳は親を持たない
  large: { parent_id: null };
  
  // 中内訳は大内訳の子のみ
  medium: { parent_type: 'large' };
  
  // 小内訳は中内訳の子のみ
  small: { parent_type: 'medium' };
  
  // 明細行は小内訳の子のみ
  detail: { parent_type: 'small' };
}

// 階層構造の例
const hierarchyExample = [
  {
    id: 'uuid-1',
    item_type: 'large',
    name: '土木工事',
    parent_id: null,
    level: 0,
    children: [
      {
        id: 'uuid-2',
        item_type: 'medium',
        name: '基礎工事',
        parent_id: 'uuid-1',
        level: 1,
        children: [
          {
            id: 'uuid-4',
            item_type: 'small',
            name: 'コンクリート工事',
            parent_id: 'uuid-2',
            level: 2,
            children: [
              {
                id: 'uuid-6',
                item_type: 'detail',
                name: 'コンクリート打設',
                parent_id: 'uuid-4',
                level: 3,
                quantity: 100,
                unit: 'm³',
                unit_price: 5000,
                amount: 500000
              }
            ]
          }
        ]
      }
    ]
  }
];
```

#### 1.3 初期状態と階層作成

- **初期状態**: 明細行のみが存在する状態
- **階層作成**: 必要に応じて小内訳、中内訳、大内訳を作成可能
- **制限**: 階層構造の制約に従って親子関係を管理

```typescript
// 階層作成・管理機能
interface ItemManagement {
  // 明細行の作成（初期状態）
  createDetail(estimate_id: string, name: string, quantity: number, unit: string, unit_price: number): EstimateItem;
  
  // 小内訳の作成
  createSmallBreakdown(estimate_id: string, name: string): EstimateItem;
  
  // 中内訳の作成
  createMediumBreakdown(estimate_id: string, name: string, parent_id: string): EstimateItem;
  
  // 大内訳の作成
  createLargeBreakdown(estimate_id: string, name: string): EstimateItem;
  
  // 階層の移動
  moveItem(item_id: string, new_parent_id: string | null): void;
  
  // 表示順序の変更
  reorderItems(item_ids: string[]): void;
  
  // 階層の削除
  deleteItem(item_id: string): void;
  
  // 階層の展開・折りたたみ
  toggleExpansion(item_id: string): void;
}
```

### 2. 見積明細管理機能

#### 2.1 見積明細画面

見積明細画面では以下の機能を提供します：

```typescript
// 見積明細画面の機能
interface EstimateItemsScreen {
  // 表示切替
  currentView: 'hierarchy' | 'flat' | 'summary'; // 現在の表示種別
  switchView(view: 'hierarchy' | 'flat' | 'summary'): void; // 表示切替
  
  // 明細追加ボタン
  addDetail(): void;                      // 明細行追加
  addSmallBreakdown(): void;              // 小内訳追加
  addMediumBreakdown(): void;             // 中内訳追加
  addLargeBreakdown(): void;              // 大内訳追加
  
  // 明細一覧表示
  displayHierarchy(): EstimateItem[];     // 階層構造表示
  displayFlat(): EstimateItem[];          // フラット表示
  displaySummary(): EstimateItem[];       // サマリー表示
  
  // 明細編集
  editItem(item_id: string): void;
  deleteItem(item_id: string): void;
  
  // 階層管理
  manageHierarchy(): void;                // 階層構造の管理
  moveItem(item_id: string, new_parent_id: string | null): void;
  reorderItems(item_ids: string[]): void;
  toggleExpansion(item_id: string): void;
}
```

#### 2.2 見積明細テーブル構造

見積明細画面では、表示切替により以下の3つの表示モードを切り替えて表示します：

```typescript
// 見積明細表示切替
interface ItemsViewModes {
  hierarchy: '階層表示';                  // 階層構造表示
  flat: 'フラット表示';                   // フラット表示
  summary: 'サマリー表示';                // サマリー表示
}

// 階層表示テーブル列定義
interface HierarchyTableColumns {
  level: number;                          // 階層レベル
  item_type: string;                      // 明細種別
  name: string;                           // 品名・仕様・内訳名
  quantity: number;                       // 数量
  unit: string;                           // 単位
  unit_price: number;                     // 単価
  amount: number;                         // 金額
  estimated_cost: number;                 // 予想原価
  supplier?: string;                      // 発注先
  construction_classification?: string;   // 工事分類
  actions: string[];                      // 操作ボタン
}

// フラット表示テーブル列定義
interface FlatTableColumns {
  item_type: string;                      // 明細種別
  name: string;                           // 品名・仕様・内訳名
  parent_name?: string;                   // 親内訳名
  quantity: number;                       // 数量
  unit: string;                           // 単位
  unit_price: number;                     // 単価
  amount: number;                         // 金額
  estimated_cost: number;                 // 予想原価
  supplier?: string;                      // 発注先
  construction_classification?: string;   // 工事分類
  actions: string[];                      // 操作ボタン
}

// サマリー表示テーブル列定義
interface SummaryTableColumns {
  item_type: string;                      // 明細種別
  name: string;                           // 品名・仕様・内訳名
  item_count: number;                     // 項目数
  total_amount: number;                   // 合計金額
  total_estimated_cost: number;           // 合計予想原価
  actions: string[];                      // 操作ボタン
}
```

### 3. 明細管理機能

#### 3.1 明細画面

明細画面では以下の機能を提供します：

```typescript
// 明細画面の機能
interface EstimateDetailScreen {
  // 階層によるグルーピング表示
  displayDetailsByHierarchy(): GroupedItems[];
  
  // 明細の追加・編集・削除
  addDetail(parent_id: string): void;
  editDetail(item_id: string): void;
  deleteDetail(item_id: string): void;
  
  // 内訳の選択
  selectParentItem(parent_id: string): void;
  
  // 金額計算
  calculateAmounts(): void;
  
  // 階層操作
  moveItem(item_id: string, new_parent_id: string | null): void;
  reorderItems(item_ids: string[]): void;
  toggleExpansion(item_id: string): void;
}
```

#### 3.2 明細テーブル構造

明細画面のテーブルには以下の列を表示します：

```typescript
// 明細テーブル列定義
interface DetailTableColumns {
  level: number;                          // 階層レベル
  item_type: string;                      // 明細種別
  name: string;                           // 品名・仕様・内訳名
  construction_method?: string;           // 工法
  construction_classification?: string;   // 工事分類
  quantity: number;                       // 数量
  unit: string;                           // 単位
  unit_price: number;                     // 単価
  amount: number;                         // 金額
  estimated_cost: number;                 // 予想原価
  remarks?: string;                       // 備考
  supplier?: string;                      // 発注先
  actions: string[];                      // 操作ボタン
}
```

#### 3.3 グルーピング機能

明細は階層構造に従ってグルーピングして表示します：

```typescript
// グルーピング表示
interface GroupedItems {
  item: EstimateItem;                     // 内訳情報
  children: EstimateItem[];               // 子要素
  total_amount: number;                   // 内訳合計金額
  total_estimated_cost: number;           // 内訳合計予想原価
  is_expanded: boolean;                   // 展開状態
}

// グルーピング表示例
// ▼ 大内訳:土木工事 (合計: ¥1,500,000)
//   ▼ 中内訳:基礎工事 (合計: ¥800,000)
//     ▼ 小内訳:コンクリート工事 (合計: ¥500,000)
//       ├─ コンクリート打設 - 数量: 100m³ - 単価: ¥5,000 - 金額: ¥500,000
//       └─ 型枠工事 - 数量: 200m² - 単価: ¥1,500 - 金額: ¥300,000
//     └─ 小内訳:鉄筋工事 (合計: ¥300,000)
//       └─ 鉄筋組立 - 数量: 50t - 単価: ¥6,000 - 金額: ¥300,000
//   └─ 中内訳:躯体工事 (合計: ¥700,000)
//     └─ 小内訳:躯体工事 (合計: ¥700,000)
//       └─ 躯体工事 - 数量: 1式 - 単価: ¥700,000 - 金額: ¥700,000
```

### 4. データベース設計（見積基本情報・見積明細）

#### 4.1 見積テーブル（基盤テーブル）

```sql
-- 見積テーブル
CREATE TABLE estimates (
    id BIGSERIAL PRIMARY KEY,                                    -- 見積ID
    estimate_number VARCHAR(50) UNIQUE NOT NULL,                 -- 見積番号
    customer_id BIGINT REFERENCES customers(id),                 -- 顧客ID
    project_type_id BIGINT REFERENCES project_types(id),         -- 工事種別ID
    project_name VARCHAR(255) NOT NULL,                          -- 工事名称
    project_location TEXT,                                       -- 工事場所
    project_period_start DATE,                                   -- 工事期間開始日
    project_period_end DATE,                                     -- 工事期間終了日
    description TEXT,                                            -- 工事内容詳細
    status VARCHAR(50) DEFAULT 'draft',                          -- 見積ステータス
    issue_date DATE NOT NULL,                                    -- 発行日
    expiry_date DATE NOT NULL,                                   -- 有効期限
    currency VARCHAR(3) DEFAULT 'JPY',                           -- 通貨
    subtotal DECIMAL(12,2) DEFAULT 0,                            -- 小計
    overhead_rate DECIMAL(5,2) DEFAULT 0,                        -- 一般管理費率（%）
    overhead_amount DECIMAL(12,2) DEFAULT 0,                     -- 一般管理費額
    cost_expense_rate DECIMAL(5,2) DEFAULT 0,                    -- 原価経費率（%）
    cost_expense_amount DECIMAL(12,2) DEFAULT 0,                 -- 原価経費額
    material_expense_rate DECIMAL(5,2) DEFAULT 0,                -- 材料経費率（%）
    material_expense_amount DECIMAL(12,2) DEFAULT 0,             -- 材料経費額
    tax_rate DECIMAL(5,2) DEFAULT 0.10,                          -- 消費税率
    tax_amount DECIMAL(12,2) DEFAULT 0,                          -- 消費税額
    discount_rate DECIMAL(5,2) DEFAULT 0,                        -- 割引率
    discount_amount DECIMAL(12,2) DEFAULT 0,                     -- 割引額
    total_amount DECIMAL(12,2) DEFAULT 0,                        -- 合計金額
    profit_margin DECIMAL(5,2) DEFAULT 0,                        -- 利益率
    profit_amount DECIMAL(12,2) DEFAULT 0,                       -- 利益額
    payment_terms TEXT,                                          -- 支払条件
    delivery_terms TEXT,                                         -- 納期条件
    warranty_period VARCHAR(100),                                -- 保証期間
    notes TEXT,                                                  -- 備考
    created_by BIGINT REFERENCES users(id),                      -- 作成者ID
    approved_by BIGINT REFERENCES users(id),                     -- 承認者ID
    approved_at TIMESTAMP WITH TIME ZONE,                        -- 承認日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時
);

-- 見積テーブルのインデックス
CREATE INDEX idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX idx_estimates_project_type_id ON estimates(project_type_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_created_by ON estimates(created_by);
```

#### 4.2 見積明細テーブル（階層構造対応）

```sql
-- 見積明細テーブル（階層構造対応）
CREATE TABLE estimate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),              -- 明細ID
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE, -- 見積ID
    parent_id UUID REFERENCES estimate_items(id),               -- 親明細ID（階層構造用）
    item_type VARCHAR(20) NOT NULL,                             -- 明細種別（large/medium/small/detail）
    display_order INTEGER NOT NULL DEFAULT 0,                   -- 表示順序
    name VARCHAR(500) NOT NULL,                                 -- 品名・仕様・内訳名
    description TEXT,                                           -- 詳細説明
    quantity DECIMAL(12,2) DEFAULT 1,                           -- 数量
    unit VARCHAR(50) DEFAULT '個',                              -- 単位
    unit_price BIGINT DEFAULT 0,                                -- 単価（顧客提示用）
    amount BIGINT DEFAULT 0,                                    -- 金額（顧客提示用）
    estimated_cost BIGINT DEFAULT 0,                            -- 予想原価（社内用）
    supplier VARCHAR(255),                                      -- 発注先
    construction_method VARCHAR(255),                           -- 工法
    construction_classification_id UUID REFERENCES construction_classifications(id), -- 工事分類ID
    remarks TEXT,                                               -- 備考
    is_expanded BOOLEAN DEFAULT true,                           -- 展開状態
    is_active BOOLEAN DEFAULT true,                             -- 有効フラグ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時
);

-- 見積明細のインデックス
CREATE INDEX idx_estimate_items_estimate_id ON estimate_items(estimate_id);
CREATE INDEX idx_estimate_items_parent_id ON estimate_items(parent_id);
CREATE INDEX idx_estimate_items_type ON estimate_items(item_type);
CREATE INDEX idx_estimate_items_order ON estimate_items(display_order);
CREATE INDEX idx_estimate_items_active ON estimate_items(is_active);
CREATE INDEX idx_estimate_items_classification ON estimate_items(construction_classification_id);
```

#### 4.3 原価計画テーブル

```sql
-- 原価計画テーブル
CREATE TABLE cost_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),              -- 原価計画ID
    estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE, -- 見積ID
    plan_number INTEGER NOT NULL,                               -- 計画番号（一次、二次、三次...）
    plan_name VARCHAR(255),                                     -- 計画名称
    description TEXT,                                           -- 説明
    is_active BOOLEAN DEFAULT false,                            -- 有効フラグ
    created_by UUID REFERENCES users(id),                       -- 作成者ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時
);

-- 原価計画のインデックス
CREATE INDEX idx_cost_plans_estimate_id ON cost_plans(estimate_id);
CREATE INDEX idx_cost_plans_active ON cost_plans(is_active);
```

#### 4.4 原価計画明細テーブル

```sql
-- 原価計画明細テーブル
CREATE TABLE cost_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),              -- 原価計画明細ID
    cost_plan_id UUID REFERENCES cost_plans(id) ON DELETE CASCADE, -- 原価計画ID
    estimate_item_id UUID REFERENCES estimate_items(id),        -- 見積明細ID
    supplier VARCHAR(255),                                      -- 発注先
    estimated_cost BIGINT DEFAULT 0,                            -- 予想原価
    remarks TEXT,                                               -- 備考
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時
);

-- 原価計画明細のインデックス
CREATE INDEX idx_cost_plan_items_cost_plan_id ON cost_plan_items(cost_plan_id);
CREATE INDEX idx_cost_plan_items_estimate_item_id ON cost_plan_items(estimate_item_id);
```

#### 4.5 見積枝番テーブル

```sql
-- 見積枝番テーブル
CREATE TABLE estimate_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),              -- 枝番ID
    parent_estimate_id UUID REFERENCES estimates(id),           -- 親見積ID
    branch_number INTEGER NOT NULL,                             -- 枝番番号
    branch_name VARCHAR(255),                                   -- 枝番名称
    description TEXT,                                           -- 説明
    status VARCHAR(50) DEFAULT 'draft',                         -- ステータス
    created_by UUID REFERENCES users(id),                       -- 作成者ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時
);

-- 見積枝番のインデックス
CREATE INDEX idx_estimate_branches_parent_id ON estimate_branches(parent_estimate_id);
CREATE INDEX idx_estimate_branches_status ON estimate_branches(status);
```

### 5. API設計（見積基本情報・見積明細）

#### 5.1 見積明細API（階層構造対応）

```php
// 見積明細API
GET    /api/v1/estimates/{id}/items                        # 見積明細一覧取得（階層構造）
POST   /api/v1/estimates/{id}/items                        # 見積明細作成
GET    /api/v1/estimates/{id}/items/{item_id}              # 見積明細詳細取得
PUT    /api/v1/estimates/{id}/items/{item_id}              # 見積明細更新
DELETE /api/v1/estimates/{id}/items/{item_id}              # 見積明細削除

// 階層管理API
POST   /api/v1/estimates/{id}/items/{item_id}/move         # 階層移動
POST   /api/v1/estimates/{id}/items/reorder                # 表示順序変更
POST   /api/v1/estimates/{id}/items/{item_id}/toggle-expansion # 展開・折りたたみ
GET    /api/v1/estimates/{id}/items/hierarchy              # 階層構造取得
GET    /api/v1/estimates/{id}/items/{item_id}/children     # 子要素取得
GET    /api/v1/estimates/{id}/items/{item_id}/parents      # 親要素取得

// 金額計算API
POST   /api/v1/estimates/{id}/items/calculate              # 金額計算実行
GET    /api/v1/estimates/{id}/items/summary                # 明細サマリー取得
GET    /api/v1/estimates/{id}/items/breakdown-summary      # 内訳別サマリー取得
```

### 6. フロントエンド設計（見積基本情報・見積明細）

#### 6.1 コンポーネント構成

```typescript
// 見積基本情報・見積明細管理コンポーネント
components/
├── estimate/
│   ├── EstimateBasicInfo.tsx           # 見積基本情報管理（メイン）
│   ├── EstimateForm.tsx                # 見積基本情報作成・編集フォーム
│   ├── EstimateSummary.tsx             # 見積基本情報サマリー表示
│   ├── EstimateItems.tsx               # 見積明細管理（メイン・階層構造対応）
│   ├── ItemHierarchy.tsx               # 階層構造表示・操作
│   ├── ItemForm.tsx                    # 明細・内訳作成・編集フォーム
│   ├── ItemTable.tsx                   # 階層対応テーブル
│   ├── ItemRow.tsx                     # 明細行コンポーネント
│   ├── BreakdownRow.tsx                # 内訳行コンポーネント
│   ├── ItemActions.tsx                 # 明細操作ボタン群
│   ├── HierarchyControls.tsx           # 階層操作コントロール
│   ├── ItemCalculation.tsx             # 金額計算コンポーネント
│   ├── ItemSummary.tsx                 # 明細サマリー表示
│   ├── CostPlan.tsx                    # 原価計画管理
│   ├── CostPlanForm.tsx                # 原価計画作成・編集フォーム
│   ├── EstimateBranch.tsx              # 見積枝番管理
│   ├── BranchForm.tsx                  # 枝番作成フォーム
│   └── OrderRequest.tsx                # 受注申請

#### 6.2 状態管理

```typescript
// 見積基本情報・見積明細の状態管理
interface EstimateItemsState {
  // 表示制御
  currentView: 'hierarchy' | 'flat' | 'summary'; // 現在の表示種別
  
  // 明細データ
  items: EstimateItem[];
  hierarchyItems: EstimateItem[];
  selectedItems: string[];
  expandedItems: string[];
  
  // UI状態
  loading: boolean;
  error: string | null;
}

// 見積明細インターフェース
interface EstimateItem {
  id: string;
  estimate_id: string;
  parent_id: string | null;
  item_type: 'large' | 'medium' | 'small' | 'detail';
  display_order: number;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  estimated_cost: number;
  supplier?: string;
  construction_method?: string;
  work_classification?: string;
  remarks?: string;
  is_expanded: boolean;
  is_active: boolean;
  children?: EstimateItem[];
  level: number;
}

// Actions
const itemsSlice = createSlice({
  name: 'estimateItems',
  initialState,
  reducers: {
    // 表示切替
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    
    // 明細管理
    setItems: (state, action) => {
      state.items = action.payload;
    },
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    
    // 階層管理
    setHierarchyItems: (state, action) => {
      state.hierarchyItems = action.payload;
    },
    moveItem: (state, action) => {
      const { itemId, newParentId } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item) {
        item.parent_id = newParentId;
      }
    },
    reorderItems: (state, action) => {
      const { itemIds } = action.payload;
      itemIds.forEach((itemId, index) => {
        const item = state.items.find(item => item.id === itemId);
        if (item) {
          item.display_order = index;
        }
      });
    },
    
    // 選択・展開状態管理
    setSelectedItems: (state, action) => {
      state.selectedItems = action.payload;
    },
    setExpandedItems: (state, action) => {
      state.expandedItems = action.payload;
    },
    toggleExpansion: (state, action) => {
      const itemId = action.payload;
      const index = state.expandedItems.indexOf(itemId);
      if (index !== -1) {
        state.expandedItems.splice(index, 1);
      } else {
        state.expandedItems.push(itemId);
      }
    },
    
    // その他のアクション
  }
});
```

### 7. ユーザーインターフェース仕様

#### 7.1 見積明細画面

- **タイトル**: "見積明細"
- **表示切替**:
  - "階層表示"（初期表示）
  - "フラット表示"
  - "サマリー表示"
- **アクションボタン**:
  - "明細行追加"
  - "小内訳追加"
  - "中内訳追加"
  - "大内訳追加"
  - "階層移動"
  - "表示順序変更"
- **階層表示テーブル列**:
  - 階層レベル
  - 明細種別
  - 品名・仕様・内訳名
  - 数量
  - 単位
  - 単価
  - 金額
  - 予想原価
  - 発注先
  - 工事分類
  - 操作
- **フラット表示テーブル列**:
  - 明細種別
  - 品名・仕様・内訳名
  - 親内訳名
  - 数量
  - 単位
  - 単価
  - 金額
  - 予想原価
  - 発注先
  - 工事分類
  - 操作
- **サマリー表示テーブル列**:
  - 明細種別
  - 品名・仕様・内訳名
  - 項目数
  - 合計金額
  - 合計予想原価
  - 操作

#### 7.2 明細画面

- **タイトル**: "明細"
- **グルーピング表示**:
  - 階層構造によるグループヘッダー
  - 展開・折りたたみ機能
  - グループ合計金額・予想原価表示
- **テーブル列**:
  - 階層レベル
  - 明細種別
  - 品名・仕様・内訳名
  - 工法
  - 工事分類
  - 数量
  - 単位
  - 単価
  - 金額
  - 予想原価
  - 備考
  - 発注先
  - 操作

### 8. 業務フロー

#### 8.1 見積明細設定フロー

1. **初期表示**: 階層表示で明細一覧を表示
2. **明細行入力**: 必要な明細行を複数入力
3. **階層化（オプション）**: 
   - 小内訳を作成して明細行をグループ化
   - 中内訳を作成して小内訳をグループ化
   - 大内訳を作成して中内訳をグループ化
4. **階層整理**: 明細行を適切な階層に配置
5. **表示切替**: 表示モードを切り替えて各階層の状況を確認

#### 8.2 明細入力フロー

1. **親内訳選択**: 明細を入力する親内訳を選択
2. **明細追加**: 選択した親内訳に明細行を追加
3. **詳細入力**: 工法、数量、単価などの詳細を入力
4. **金額計算**: 自動的に金額を計算
5. **階層確認**: 階層構造によるグルーピングを確認

### 9. 検証・制約

#### 9.1 データ整合性

- 小内訳は必ず何らかの階層に所属する必要がある
- 明細は必ず小内訳に所属する必要がある
- 階層構造の循環参照を防ぐ
- 削除時は関連する明細の処理を考慮

#### 9.2 パフォーマンス

- 大量の明細がある場合の表示最適化
- 階層構造の効率的な取得
- 金額計算の最適化
