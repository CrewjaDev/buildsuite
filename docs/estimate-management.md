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
2. **見積内訳（Estimate Breakdown）**: 工事の分類・階層構造を管理（子）
3. **明細（Details）**: 各内訳に対する具体的な工事項目を管理（孫）

```typescript
// 見積基本情報を親とした階層構造
interface EstimateHierarchy {
  estimate: Estimate;                     // 見積基本情報（親）
  breakdowns: EstimateBreakdown[];        // 見積内訳一覧（子）
  details: EstimateDetail[];              // 明細一覧（孫）
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

// 見積内訳（階層構造）
interface EstimateBreakdown {
  id: number;                             // 内訳ID
  estimate_id: number;                    // 見積ID
  breakdown_type: 'large' | 'medium' | 'small'; // 内訳種別
  parent_id?: number;                     // 親内訳ID（階層構造用）
  name: string;                           // 内訳名称
  description?: string;                   // 説明
  sort_order: number;                     // 表示順序
  is_active: boolean;                     // 有効フラグ
  created_at: Date;                       // 作成日時
  updated_at: Date;                       // 更新日時
}

// 明細（詳細項目）
interface EstimateDetail {
  id: number;                             // 明細ID
  estimate_id: number;                    // 見積ID
  breakdown_id: number;                   // 所属内訳ID
  item_order: number;                     // 項目順序
  construction_method: string;            // 工法
  work_classification: string;            // 工事分類
  summary: string;                        // 摘要
  quantity: number;                       // 数量
  unit: string;                           // 単位
  unit_price: number;                     // 単価
  amount: number;                         // 金額（数量×単価）
  remarks?: string;                       // 備考
  supplier?: string;                      // 発注先
  order_request_content?: string;         // 発注依頼内容
  estimated_cost?: number;                // 予想原価
  created_at: Date;                       // 作成日時
  updated_at: Date;                       // 更新日時
}
```

#### 1.2 見積内訳の3段階階層構造

見積内訳は以下の3段階の階層構造をサポートします：

1. **大内訳（Large Breakdown）**: 最上位の分類（例：土木工事、建築工事）
2. **中内訳（Medium Breakdown）**: 中間分類（例：基礎工事、躯体工事）
3. **小内訳（Small Breakdown）**: 最小分類（例：コンクリート工事、鉄筋工事）

```typescript
// 内訳階層構造の定義
interface BreakdownHierarchy {
  large_breakdowns: LargeBreakdown[];     // 大内訳一覧
  medium_breakdowns: MediumBreakdown[];   // 中内訳一覧
  small_breakdowns: SmallBreakdown[];     // 小内訳一覧
}

// 大内訳
interface LargeBreakdown {
  id: number;                             // 大内訳ID
  estimate_id: number;                    // 見積ID
  name: string;                           // 大内訳名称
  description?: string;                   // 説明
  sort_order: number;                     // 表示順序
  total_amount: number;                   // 合計金額
  medium_breakdowns: MediumBreakdown[];   // 所属中内訳
}

// 中内訳
interface MediumBreakdown {
  id: number;                             // 中内訳ID
  estimate_id: number;                    // 見積ID
  large_breakdown_id: number;             // 所属大内訳ID
  name: string;                           // 中内訳名称
  description?: string;                   // 説明
  sort_order: number;                     // 表示順序
  total_amount: number;                   // 合計金額
  small_breakdowns: SmallBreakdown[];     // 所属小内訳
}

// 小内訳
interface SmallBreakdown {
  id: number;                             // 小内訳ID
  estimate_id: number;                    // 見積ID
  medium_breakdown_id?: number;           // 所属中内訳ID（オプション）
  large_breakdown_id?: number;            // 所属大内訳ID（直接所属の場合）
  name: string;                           // 小内訳名称
  description?: string;                   // 説明
  sort_order: number;                     // 表示順序
  total_amount: number;                   // 合計金額
  details: EstimateDetail[];              // 所属明細
}
```

#### 1.3 初期状態と階層作成

- **初期状態**: 小内訳のみが存在する状態
- **階層作成**: 必要に応じて中内訳、大内訳を作成可能
- **制限**: 小内訳は中内訳を経由せずに大内訳に直接所属することは不可

```typescript
// 階層作成・管理機能
interface BreakdownManagement {
  // 小内訳の作成（初期状態）
  createSmallBreakdown(estimate_id: number, name: string): SmallBreakdown;
  
  // 中内訳の作成
  createMediumBreakdown(estimate_id: number, name: string, large_breakdown_id: number): MediumBreakdown;
  
  // 大内訳の作成
  createLargeBreakdown(estimate_id: number, name: string): LargeBreakdown;
  
  // 階層の変更
  moveSmallBreakdownToMedium(small_id: number, medium_id: number): void;
  moveSmallBreakdownToLarge(small_id: number, large_id: number): void;
  
  // 階層の削除
  deleteMediumBreakdown(medium_id: number): void;
  deleteLargeBreakdown(large_id: number): void;
}
```

### 2. 見積内訳管理機能

#### 2.1 見積内訳画面

見積内訳画面では以下の機能を提供します：

```typescript
// 見積内訳画面の機能
interface EstimateBreakdownScreen {
  // 表示切替タブ
  currentView: 'small' | 'medium' | 'large'; // 現在の表示種別
  switchView(view: 'small' | 'medium' | 'large'): void; // 表示切替
  
  // 内訳追加ボタン
  addLargeBreakdown(): void;              // 大内訳追加
  addMediumBreakdown(): void;             // 中内訳追加
  addSmallBreakdown(): void;              // 小内訳追加
  
  // 内訳一覧表示（表示種別別）
  displaySmallBreakdowns(): SmallBreakdown[];    // 小内訳一覧表示
  displayMediumBreakdowns(): MediumBreakdown[];  // 中内訳一覧表示
  displayLargeBreakdowns(): LargeBreakdown[];    // 大内訳一覧表示
  
  // 内訳編集
  editBreakdown(breakdown_id: number): void;
  deleteBreakdown(breakdown_id: number): void;
  
  // 階層管理
  manageHierarchy(): void;                // 階層構造の管理
}
```

#### 2.2 見積内訳テーブル構造

見積内訳画面では、表示切替タブにより以下の3つのテーブルを切り替えて表示します：

```typescript
// 見積内訳表示切替タブ
interface BreakdownViewTabs {
  small: '小内訳';                        // 小内訳タブ
  medium: '中内訳';                       // 中内訳タブ
  large: '大内訳';                        // 大内訳タブ
}

// 小内訳テーブル列定義
interface SmallBreakdownTableColumns {
  name: string;                           // 小内訳名称
  description?: string;                   // 説明
  parent_breakdown?: string;              // 所属内訳（中内訳または大内訳）
  total_amount: number;                   // 合計金額
  item_count: number;                     // 明細項目数
  actions: string[];                      // 操作ボタン
}

// 中内訳テーブル列定義
interface MediumBreakdownTableColumns {
  name: string;                           // 中内訳名称
  description?: string;                   // 説明
  parent_breakdown: string;               // 所属大内訳
  small_breakdown_count: number;          // 所属小内訳数
  total_amount: number;                   // 合計金額
  actions: string[];                      // 操作ボタン
}

// 大内訳テーブル列定義
interface LargeBreakdownTableColumns {
  name: string;                           // 大内訳名称
  description?: string;                   // 説明
  medium_breakdown_count: number;         // 所属中内訳数
  small_breakdown_count: number;          // 所属小内訳数
  total_amount: number;                   // 合計金額
  actions: string[];                      // 操作ボタン
}
```

### 3. 明細管理機能

#### 3.1 明細画面

明細画面では以下の機能を提供します：

```typescript
// 明細画面の機能
interface EstimateDetailScreen {
  // 小内訳によるグルーピング表示
  displayDetailsByBreakdown(): GroupedDetails[];
  
  // 明細の追加・編集・削除
  addDetail(breakdown_id: number): void;
  editDetail(detail_id: number): void;
  deleteDetail(detail_id: number): void;
  
  // 小内訳の選択
  selectSmallBreakdown(breakdown_id: number): void;
  
  // 金額計算
  calculateAmounts(): void;
}
```

#### 3.2 明細テーブル構造

明細画面のテーブルには以下の列を表示します：

```typescript
// 明細テーブル列定義
interface DetailTableColumns {
  small_breakdown: string;                // 小内訳（選択可能）
  construction_method: string;            // 工法
  work_classification: string;            // 工事分類
  summary: string;                        // 摘要
  quantity: number;                       // 数量
  unit: string;                           // 単位
  unit_price: number;                     // 単価
  amount: number;                         // 金額
  remarks?: string;                       // 備考
  supplier?: string;                      // 発注先
  order_request_content?: string;         // 発注依頼内容
  estimated_cost?: number;                // 予想原価
}
```

#### 3.3 グルーピング機能

明細は小内訳ごとにグルーピングして表示します：

```typescript
// グルーピング表示
interface GroupedDetails {
  breakdown: SmallBreakdown;              // 小内訳情報
  details: EstimateDetail[];              // 所属明細
  total_amount: number;                   // 小内訳合計金額
  is_expanded: boolean;                   // 展開状態
}

// グルーピング表示例
// ▲ 小内訳:小内訳1 (3 items) - 合計: ¥500,000
//   ├─ コンクリート工事 - 数量: 10m³ - 単価: ¥50,000 - 金額: ¥500,000
//   ├─ 鉄筋工事 - 数量: 5t - 単価: ¥80,000 - 金額: ¥400,000
//   └─ 型枠工事 - 数量: 100m² - 単価: ¥3,000 - 金額: ¥300,000
// 
// ▲ 小内訳:小内訳2 (2 items) - 合計: ¥300,000
//   ├─ 塗装工事 - 数量: 200m² - 単価: ¥1,500 - 金額: ¥300,000
//   └─ 防水工事 - 数量: 150m² - 単価: ¥2,000 - 金額: ¥300,000
```

### 4. データベース設計（見積基本情報・見積内訳・明細）

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

#### 4.2 見積内訳テーブル

```sql
-- 見積内訳テーブル
CREATE TABLE estimate_breakdowns (
    id BIGSERIAL PRIMARY KEY,                                     -- 内訳ID
    estimate_id BIGINT REFERENCES estimates(id) ON DELETE CASCADE, -- 見積ID
    breakdown_type VARCHAR(20) NOT NULL,                          -- 内訳種別（large/medium/small）
    parent_id BIGINT REFERENCES estimate_breakdowns(id),          -- 親内訳ID
    name VARCHAR(255) NOT NULL,                                   -- 内訳名称
    description TEXT,                                             -- 説明
    sort_order INTEGER NOT NULL DEFAULT 0,                        -- 表示順序
    total_amount DECIMAL(12,2) DEFAULT 0,                         -- 合計金額
    item_count INTEGER DEFAULT 0,                                 -- 明細項目数
    is_active BOOLEAN DEFAULT true,                               -- 有効フラグ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                      -- 削除日時
);

-- 見積内訳のインデックス
CREATE INDEX idx_estimate_breakdowns_estimate_id ON estimate_breakdowns(estimate_id);
CREATE INDEX idx_estimate_breakdowns_parent_id ON estimate_breakdowns(parent_id);
CREATE INDEX idx_estimate_breakdowns_type ON estimate_breakdowns(breakdown_type);
```

#### 4.3 明細テーブル（重要テーブル・削除対象外）

```sql
-- 見積明細テーブル（重要テーブル・削除対象外）
CREATE TABLE estimate_details (
    id BIGSERIAL PRIMARY KEY,                                     -- 明細ID
    estimate_id BIGINT REFERENCES estimates(id) ON DELETE CASCADE, -- 見積ID
    breakdown_id BIGINT REFERENCES estimate_breakdowns(id) ON DELETE CASCADE, -- 所属内訳ID
    item_order INTEGER NOT NULL,                                  -- 項目順序
    construction_method VARCHAR(255),                             -- 工法
    work_classification VARCHAR(255),                             -- 工事分類
    summary TEXT NOT NULL,                                        -- 摘要
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,                    -- 数量
    unit VARCHAR(50) DEFAULT '個',                                -- 単位
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,                  -- 単価
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,                      -- 金額
    remarks TEXT,                                                 -- 備考
    supplier VARCHAR(255),                                        -- 発注先
    order_request_content TEXT,                                   -- 発注依頼内容
    estimated_cost DECIMAL(12,2),                                 -- 予想原価
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                      -- 削除日時
);

-- 明細のインデックス
CREATE INDEX idx_estimate_details_estimate_id ON estimate_details(estimate_id);
CREATE INDEX idx_estimate_details_breakdown_id ON estimate_details(breakdown_id);
CREATE INDEX idx_estimate_details_order ON estimate_details(item_order);
```

### 5. API設計（見積基本情報・見積内訳・明細）

#### 5.1 見積内訳API

```php
// 見積内訳API
GET    /api/v1/estimates/{id}/breakdowns                    # 見積内訳一覧取得
POST   /api/v1/estimates/{id}/breakdowns                    # 見積内訳作成
GET    /api/v1/estimates/{id}/breakdowns/{breakdown_id}     # 見積内訳詳細取得
PUT    /api/v1/estimates/{id}/breakdowns/{breakdown_id}     # 見積内訳更新
DELETE /api/v1/estimates/{id}/breakdowns/{breakdown_id}     # 見積内訳削除

// 階層管理API
POST   /api/v1/estimates/{id}/breakdowns/{breakdown_id}/move # 内訳階層移動
GET    /api/v1/estimates/{id}/breakdowns/hierarchy          # 階層構造取得
```

#### 5.2 明細API

```php
// 明細API
GET    /api/v1/estimates/{id}/details                      # 明細一覧取得（グルーピング）
GET    /api/v1/estimates/{id}/breakdowns/{breakdown_id}/details # 内訳別明細取得
POST   /api/v1/estimates/{id}/details                      # 明細作成
PUT    /api/v1/estimates/{id}/details/{detail_id}          # 明細更新
DELETE /api/v1/estimates/{id}/details/{detail_id}          # 明細削除

// 明細計算API
POST   /api/v1/estimates/{id}/details/calculate            # 金額計算
GET    /api/v1/estimates/{id}/details/summary              # 明細サマリー取得
```

### 6. フロントエンド設計（見積基本情報・見積内訳・明細）

#### 6.1 コンポーネント構成

```typescript
// 見積基本情報・見積内訳・明細管理コンポーネント
components/
├── estimate/
│   ├── EstimateBasicInfo.tsx           # 見積基本情報管理（メイン）
│   ├── EstimateForm.tsx                # 見積基本情報作成・編集フォーム
│   ├── EstimateSummary.tsx             # 見積基本情報サマリー表示
│   ├── EstimateBreakdown.tsx           # 見積内訳管理（メイン）
│   ├── BreakdownTabs.tsx               # 表示切替タブ
│   ├── SmallBreakdownTable.tsx         # 小内訳テーブル
│   ├── MediumBreakdownTable.tsx        # 中内訳テーブル
│   ├── LargeBreakdownTable.tsx         # 大内訳テーブル
│   ├── EstimateDetail.tsx              # 明細管理
│   ├── BreakdownHierarchy.tsx          # 階層構造表示
│   ├── BreakdownForm.tsx               # 内訳作成・編集フォーム
│   ├── DetailForm.tsx                  # 明細作成・編集フォーム
│   ├── DetailGrouping.tsx              # 明細グルーピング表示
│   ├── BreakdownSelector.tsx           # 内訳選択コンポーネント
│   ├── DetailCalculation.tsx           # 明細金額計算
│   ├── EstimateStatus.tsx              # 見積ステータス管理
│   └── EstimateApproval.tsx            # 見積承認フロー管理

#### 6.2 状態管理

```typescript
// 見積基本情報・見積内訳・明細の状態管理
interface EstimateBreakdownState {
  // 表示制御
  currentView: 'small' | 'medium' | 'large'; // 現在の表示種別
  
  // 内訳データ
  smallBreakdowns: SmallBreakdown[];
  mediumBreakdowns: MediumBreakdown[];
  largeBreakdowns: LargeBreakdown[];
  
  // 明細データ
  details: EstimateDetail[];
  groupedDetails: GroupedDetails[];
  selectedBreakdown: EstimateBreakdown | null;
  
  // 階層構造
  hierarchy: BreakdownHierarchy;
  
  // UI状態
  loading: boolean;
  error: string | null;
}

// Actions
const breakdownSlice = createSlice({
  name: 'estimateBreakdown',
  initialState,
  reducers: {
    // 表示切替
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    
    // 小内訳管理
    setSmallBreakdowns: (state, action) => {
      state.smallBreakdowns = action.payload;
    },
    addSmallBreakdown: (state, action) => {
      state.smallBreakdowns.push(action.payload);
    },
    updateSmallBreakdown: (state, action) => {
      const index = state.smallBreakdowns.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.smallBreakdowns[index] = action.payload;
      }
    },
    
    // 中内訳管理
    setMediumBreakdowns: (state, action) => {
      state.mediumBreakdowns = action.payload;
    },
    addMediumBreakdown: (state, action) => {
      state.mediumBreakdowns.push(action.payload);
    },
    updateMediumBreakdown: (state, action) => {
      const index = state.mediumBreakdowns.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.mediumBreakdowns[index] = action.payload;
      }
    },
    
    // 大内訳管理
    setLargeBreakdowns: (state, action) => {
      state.largeBreakdowns = action.payload;
    },
    addLargeBreakdown: (state, action) => {
      state.largeBreakdowns.push(action.payload);
    },
    updateLargeBreakdown: (state, action) => {
      const index = state.largeBreakdowns.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.largeBreakdowns[index] = action.payload;
      }
    },
    
    // 明細管理
    setDetails: (state, action) => {
      state.details = action.payload;
    },
    addDetail: (state, action) => {
      state.details.push(action.payload);
    },
    updateDetail: (state, action) => {
      const index = state.details.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.details[index] = action.payload;
      }
    },
    setGroupedDetails: (state, action) => {
      state.groupedDetails = action.payload;
    },
    
    // その他のアクション
  }
});
```

### 7. ユーザーインターフェース仕様

#### 7.1 見積内訳画面

- **タイトル**: "見積内訳"
- **表示切替タブ**:
  - "小内訳"（初期表示）
  - "中内訳"
  - "大内訳"
- **アクションボタン**:
  - "小内訳追加"（小内訳タブで表示）
  - "中内訳追加"（中内訳タブで表示）
  - "大内訳追加"（大内訳タブで表示）
- **小内訳テーブル列**:
  - 小内訳名称
  - 説明
  - 所属内訳（中内訳または大内訳）
  - 合計金額
  - 明細項目数
  - 操作
- **中内訳テーブル列**:
  - 中内訳名称
  - 説明
  - 所属大内訳
  - 所属小内訳数
  - 合計金額
  - 操作
- **大内訳テーブル列**:
  - 大内訳名称
  - 説明
  - 所属中内訳数
  - 所属小内訳数
  - 合計金額
  - 操作

#### 7.2 明細画面

- **タイトル**: "明細"
- **グルーピング表示**:
  - 小内訳ごとのグループヘッダー
  - 展開・折りたたみ機能
  - グループ合計金額表示
- **テーブル列**:
  - 小内訳（選択可能）
  - 工法
  - 工事分類
  - 摘要
  - 数量
  - 単位
  - 単価
  - 金額
  - 備考
  - 発注先
  - 発注依頼内容
  - 予想原価

### 8. 業務フロー

#### 8.1 見積内訳設定フロー

1. **初期表示**: 小内訳タブで小内訳一覧を表示
2. **小内訳作成**: 必要な小内訳を複数作成
3. **階層化（オプション）**: 
   - 中内訳タブで中内訳を作成
   - 大内訳タブで大内訳を作成
4. **内訳整理**: 小内訳を適切な階層に配置
5. **表示切替**: タブを切り替えて各階層の状況を確認

#### 8.2 明細入力フロー

1. **小内訳選択**: 明細を入力する小内訳を選択
2. **明細追加**: 選択した小内訳に明細を追加
3. **詳細入力**: 工法、数量、単価などの詳細を入力
4. **金額計算**: 自動的に金額を計算
5. **グルーピング確認**: 小内訳ごとのグルーピングを確認

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
