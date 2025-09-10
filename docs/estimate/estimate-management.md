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

### 1. 見積内訳と見積明細の2段管理（新設計）

#### 1.1 新設計の基本概念

**実装状況**: 全ての機能が実装完了し、本番環境で稼働中です。

##### 設計思想
1. **内訳構造の事前定義**: 見積書の「章立て」や「目次」を先に作成
2. **明細行の入力と紐付け**: 作成した内訳構造に明細を紐付けて入力
3. **テーブル分離**: 内訳構造と明細アイテムを独立したテーブルで管理
4. **柔軟な金額計算**: 自動集計と直接入力の両方をサポート

##### 業務フロー
```
ステップ1: 内訳構造の事前定義
    ↓
ステップ2: 明細行の入力と内訳への紐付け
    ↓
ステップ3: 見積書の生成・出力
```

#### 1.2 ステップ1: 内訳構造の事前定義

##### 1.2.1 専用UIの提供
- 見積作成画面に「見積内訳を設定する」ボタンを配置
- 内訳構造定義専用のモーダルまたはページを開く
- 階層構造を視覚的に管理できるUI

##### 1.2.2 階層構造の作成
**小内訳の作成**
- 内訳の最小単位の名前を入力
- 例：「サーバー機器」「ソフトウェア」「設定作業」
- 各小内訳は独立したエンティティとして管理

**中内訳の作成**
- 小内訳をグループ化する形で中内訳を作成
- 例：「ハードウェア調達」という中内訳に「サーバー機器」を紐付け
- 親子関係を視覚的に設定

**大内訳の作成**
- 中内訳をグループ化する形で大内訳を作成
- 例：「システム導入費用」という大内訳に「ハードウェア調達」を紐付け
- 3階層の構造を完成

##### 1.2.3 作成される構造例
```
大内訳：システム導入費用
├── 中内訳：ハードウェア調達
│   └── 小内訳：サーバー機器
├── 中内訳：ソフトウェア
│   ├── 小内訳：OSライセンス
│   └── 小内訳：DBライセンス
└── 中内訳：その他費用
    └── 小内訳：設定作業
```

#### 1.3 ステップ2: 明細行の入力と内訳への紐付け

##### 1.3.1 明細入力画面
- 通常の明細入力画面に戻る
- 新しい明細行追加時に「内訳」選択項目を提供

##### 1.3.2 内訳選択機能
- ドロップダウンリストで小内訳一覧を表示
- ステップ1で作成した小内訳のみが選択可能
- 例：「Dell PowerEdge R760」という品名に「サーバー機器」を選択

##### 1.3.3 自動グループ化
- 選択された小内訳（と、それに紐づく中・大内訳）に従って自動グループ化
- 集計・表示を自動実行
- 階層構造に基づく見積書レイアウトの生成

### 2. 見積基本情報を親とした階層構造

#### 2.1 基本概念
見積基本情報を親として、以下の階層構造で構成されます：

1. **見積基本情報（Estimate）**: 見積の基本情報を管理（親）
2. **見積内訳（Estimate Breakdowns）**: 大内訳・中内訳・小内訳の階層構造を管理（子）
3. **見積明細（Estimate Items）**: 小内訳に紐づく明細項目を管理（孫）
4. **拡張テーブル**: 原価計画、見積枝番等の関連データ（子）

```typescript
// 見積基本情報を親とした階層構造
interface EstimateHierarchy {
  estimate: Estimate;                     // 見積基本情報（親）
  breakdowns: EstimateBreakdown[];        // 見積内訳一覧（階層構造）
  items: EstimateItem[];                  // 見積明細一覧（小内訳に紐づく）
  costPlans: CostPlan[];                  // 原価計画一覧
  branches: EstimateBranch[];             // 見積枝番一覧
}
// 見積基本情報
interface Estimate {
  id: string;                             // 見積ID（UUID）
  estimate_number: string;                // 見積番号
  partner_id: number;                     // 取引先ID
  project_type_id: number;                // 工事種別ID
  project_name: string;                   // 工事名称
  project_location?: string;              // 工事場所
  project_period_start?: Date;            // 工事期間開始日
  project_period_end?: Date;              // 工事期間終了日
  description?: string;                   // 工事内容詳細
  status: string;                         // 見積ステータス（draft/approved/rejected）
  issue_date: Date;                       // 発行日
  expiry_date: Date;                      // 有効期限
  total_amount: number;                   // 税抜見積金額
  tax_rate: number;                       // 消費税率（%）
  tax_amount: number;                     // 消費税額
  discount_amount: number;                // 割引額
  final_amount: number;                   // 合計金額（税込）
  general_management_fee_rate: number;    // 一般管理費率（%）
  overhead_cost_rate: number;             // 原価経費率（%）
  material_cost_rate: number;             // 材料経費率（%）
  created_by: number;                     // 作成者ID
  approved_by?: number;                   // 承認者ID
  approved_at?: Date;                     // 承認日時
  remarks?: string;                       // 備考
  is_active: boolean;                     // 有効フラグ
  created_at: Date;                       // 作成日時
  updated_at: Date;                       // 更新日時
  deleted_at?: Date;                      // 削除日時
}

// 見積内訳（階層構造）
interface EstimateBreakdown {
  id: string;                             // 内訳ID
  estimate_id: string;                    // 見積ID（親）
  parent_id?: string;                     // 親内訳ID（階層構造用）
  breakdown_type: 'large' | 'medium' | 'small'; // 内訳種別
  name: string;                           // 内訳名
  display_order: number;                  // 表示順序
  description?: string;                   // 詳細説明
  direct_amount: number;                  // 直接入力金額
  calculated_amount: number;              // 計算金額
  estimated_cost: number;                 // 予想原価
  is_active: boolean;                     // 有効フラグ
  children?: EstimateBreakdown[];         // 子内訳
  level: number;                          // 階層レベル
  created_at: Date;                       // 作成日時
  updated_at: Date;                       // 更新日時
}

// 見積明細（小内訳に紐づく）
interface EstimateItem {
  id: string;                             // 明細ID
  estimate_id: string;                    // 見積ID（親）
  breakdown_id?: string;                  // 小内訳ID（紐付け先）
  name: string;                           // 品名・仕様
  description?: string;                   // 詳細説明
  quantity: number;                       // 数量
  unit: string;                           // 単位
  unit_price: number;                     // 単価（顧客提示用）
  amount: number;                         // 金額（顧客提示用）
  estimated_cost: number;                 // 予想原価（社内用）
      supplier_id?: number;                   // 発注先（取引先ID）
    construction_method?: string;           // 工法
    construction_classification_id?: string; // 工事分類ID
    remarks?: string;                       // 備考
  display_order: number;                  // 表示順序
  is_active: boolean;                     // 有効フラグ
  created_at: Date;                       // 作成日時
  updated_at: Date;                       // 更新日時
}
```

#### 2.2 見積内訳と明細の関係性

見積内訳と明細は以下の関係性で構成されます：

1. **大内訳（Large）**: 最上位の分類（例：土木工事、建築工事）
2. **中内訳（Medium）**: 中間分類（例：基礎工事、躯体工事）
3. **小内訳（Small）**: 最小分類（例：コンクリート工事、鉄筋工事）
4. **明細行（Items）**: 小内訳に紐づく具体的な工事項目

```typescript
// 内訳種別の定義
enum BreakdownType {
  LARGE = 'large',      // 大内訳
  MEDIUM = 'medium',    // 中内訳
  SMALL = 'small'       // 小内訳
}

// 階層構造の制約
interface HierarchyConstraints {
  // 大内訳は親を持たない
  large: { parent_id: null };
  
  // 中内訳は大内訳の子のみ
  medium: { parent_type: 'large' };
  
  // 小内訳は中内訳の子のみ
  small: { parent_type: 'medium' };
  
  // 明細行は小内訳に紐づく
  items: { breakdown_type: 'small' };
}

// 階層構造の例
const hierarchyExample = {
  estimate: {
    id: 'estimate-uuid',
    estimate_number: 'EST-2025-001',
    project_name: '土木工事プロジェクト'
  },
  breakdowns: [
  {
    id: 'uuid-1',
      breakdown_type: 'large',
    name: '土木工事',
    parent_id: null,
    level: 0,
    children: [
      {
        id: 'uuid-2',
          breakdown_type: 'medium',
        name: '基礎工事',
        parent_id: 'uuid-1',
        level: 1,
        children: [
          {
            id: 'uuid-4',
              breakdown_type: 'small',
            name: 'コンクリート工事',
            parent_id: 'uuid-2',
              level: 2
            }
          ]
        }
      ]
    }
  ],
  items: [
              {
                id: 'uuid-6',
      breakdown_id: 'uuid-4', // 小内訳に紐づく
                name: 'コンクリート打設',
                quantity: 100,
                unit: 'm³',
                unit_price: 5000,
                amount: 500000
              }
            ]
};
```

#### 2.3 データの関係性と制約

- **見積基本情報**: 全てのデータの親として機能
- **見積内訳**: 見積基本情報に直接紐づく階層構造
- **見積明細**: 小内訳にのみ紐づく明細項目
- **拡張テーブル**: 見積基本情報に直接紐づく関連データ
- **制限**: 階層構造の制約に従って親子関係を管理

```typescript
// 見積管理機能
interface EstimateManagement {
  // 見積内訳の管理
  createBreakdown(estimate_id: string, breakdown_type: BreakdownType, name: string, parent_id?: string): EstimateBreakdown;
  updateBreakdown(breakdown_id: string, data: Partial<EstimateBreakdown>): void;
  deleteBreakdown(breakdown_id: string): void;
  
  // 見積明細の管理
  createItem(estimate_id: string, breakdown_id: string, name: string, quantity: number, unit: string, unit_price: number): EstimateItem;
  updateItem(item_id: string, data: Partial<EstimateItem>): void;
  deleteItem(item_id: string): void;
  
  // 階層の移動
  moveBreakdown(breakdown_id: string, new_parent_id: string | null): void;
  moveItem(item_id: string, new_breakdown_id: string): void;
  
  // 表示順序の変更
  reorderBreakdowns(breakdown_ids: string[]): void;
  reorderItems(item_ids: string[]): void;
  
  // 拡張テーブルの管理
  createCostPlan(estimate_id: string, plan_name: string): CostPlan;
  createEstimateBranch(estimate_id: string, branch_name: string): EstimateBranch;
}
```

### 3. 見積内訳・明細管理機能

#### 3.1 見積内訳・明細画面

見積内訳・明細画面では以下の機能を提供します：

```typescript
// 見積内訳・明細画面の機能
interface EstimateBreakdownItemsScreen {
  // 表示切替
  currentView: 'hierarchy' | 'flat' | 'summary'; // 現在の表示種別
  switchView(view: 'hierarchy' | 'flat' | 'summary'): void; // 表示切替
  
  // 内訳追加ボタン
  addLargeBreakdown(): void;              // 大内訳追加
  addMediumBreakdown(): void;             // 中内訳追加
  addSmallBreakdown(): void;              // 小内訳追加
  
  // 明細追加ボタン
  addItem(breakdown_id: string): void;    // 明細行追加（小内訳に紐づく）
  
  // 内訳・明細一覧表示
  displayHierarchy(): EstimateBreakdown[]; // 階層構造表示
  displayFlat(): (EstimateBreakdown | EstimateItem)[]; // フラット表示
  displaySummary(): EstimateBreakdown[];   // サマリー表示
  
  // 内訳・明細編集
  editBreakdown(breakdown_id: string): void;
  editItem(item_id: string): void;
  deleteBreakdown(breakdown_id: string): void;
  deleteItem(item_id: string): void;
  
  // 階層管理
  manageHierarchy(): void;                // 階層構造の管理
  moveBreakdown(breakdown_id: string, new_parent_id: string | null): void;
  moveItem(item_id: string, new_breakdown_id: string): void;
  reorderBreakdowns(breakdown_ids: string[]): void;
  reorderItems(item_ids: string[]): void;
  toggleExpansion(breakdown_id: string): void;
}
```

#### 3.2 見積内訳・明細テーブル構造

見積内訳・明細画面では、表示切替により以下の3つの表示モードを切り替えて表示します：

```typescript
// 見積内訳・明細表示切替
interface BreakdownItemsViewModes {
  hierarchy: '階層表示';                  // 階層構造表示
  flat: 'フラット表示';                   // フラット表示
  summary: 'サマリー表示';                // サマリー表示
}

// 階層表示テーブル列定義
interface HierarchyTableColumns {
  level: number;                          // 階層レベル
  type: 'breakdown' | 'item';             // 種別（内訳 or 明細）
  breakdown_type?: string;                // 内訳種別（大・中・小）
  name: string;                           // 品名・仕様・内訳名
  quantity?: number;                      // 数量（明細のみ）
  unit?: string;                          // 単位（明細のみ）
  unit_price?: number;                    // 単価（明細のみ）
  amount: number;                         // 金額
  estimated_cost: number;                 // 予想原価
  supplier_id?: number;                   // 発注先（取引先ID）
  construction_classification?: string;   // 工事分類
  actions: string[];                      // 操作ボタン
}

// フラット表示テーブル列定義
interface FlatTableColumns {
  type: 'breakdown' | 'item';             // 種別（内訳 or 明細）
  breakdown_type?: string;                // 内訳種別（大・中・小）
  name: string;                           // 品名・仕様・内訳名
  parent_name?: string;                   // 親内訳名
  quantity?: number;                      // 数量（明細のみ）
  unit?: string;                          // 単位（明細のみ）
  unit_price?: number;                    // 単価（明細のみ）
  amount: number;                         // 金額
  estimated_cost: number;                 // 予想原価
  supplier_id?: number;                   // 発注先（取引先ID）
  construction_classification?: string;   // 工事分類
  actions: string[];                      // 操作ボタン
}

// サマリー表示テーブル列定義
interface SummaryTableColumns {
  breakdown_type: string;                 // 内訳種別
  name: string;                           // 内訳名
  item_count: number;                     // 項目数
  total_amount: number;                   // 合計金額
  total_estimated_cost: number;           // 合計予想原価
  actions: string[];                      // 操作ボタン
}
```

### 4. 拡張テーブル管理機能

#### 4.1 原価計画管理

原価計画管理では以下の機能を提供します：

```typescript
// 原価計画管理の機能
interface CostPlanManagement {
  // 原価計画の作成・編集・削除
  createCostPlan(estimate_id: string, plan_name: string): CostPlan;
  updateCostPlan(cost_plan_id: string, data: Partial<CostPlan>): void;
  deleteCostPlan(cost_plan_id: string): void;
  
  // 原価計画明細の管理
  addCostPlanItem(cost_plan_id: string, estimate_item_id: string, supplier_id: number, estimated_cost: number): CostPlanItem;
  updateCostPlanItem(item_id: string, data: Partial<CostPlanItem>): void;
  deleteCostPlanItem(item_id: string): void;
  
  // 原価計画の表示
  displayCostPlans(estimate_id: string): CostPlan[];
  displayCostPlanItems(cost_plan_id: string): CostPlanItem[];
}
```

#### 4.2 見積枝番管理

見積枝番管理では以下の機能を提供します：

```typescript
// 見積枝番管理の機能
interface EstimateBranchManagement {
  // 見積枝番の作成・編集・削除
  createEstimateBranch(estimate_id: string, branch_name: string, branch_number: number): EstimateBranch;
  updateEstimateBranch(branch_id: string, data: Partial<EstimateBranch>): void;
  deleteEstimateBranch(branch_id: string): void;
  
  // 見積枝番の表示
  displayEstimateBranches(estimate_id: string): EstimateBranch[];
  displayBranchDetails(branch_id: string): EstimateBranch;
}
```

#### 4.3 データの関係性図

見積基本情報を親とした階層構造の関係性を図示します：

```
見積基本情報 (estimates)
├── 見積内訳 (estimate_breakdowns)
│   ├── 大内訳 (breakdown_type: 'large')
│   │   └── 中内訳 (breakdown_type: 'medium')
│   │       └── 小内訳 (breakdown_type: 'small')
│   │           └── 見積明細 (estimate_items)
│   │               └── 原価計画明細 (cost_plan_items)
│   └── 一式金額 (direct_amount)
├── 原価計画 (cost_plans)
│   └── 原価計画明細 (cost_plan_items)
└── 見積枝番 (estimate_branches)
```

**関係性の説明**:
- **見積基本情報**: 全てのデータの親として機能
- **見積内訳**: 見積基本情報に直接紐づく階層構造（大→中→小）
- **見積明細**: 小内訳にのみ紐づく明細項目
- **原価計画**: 見積基本情報に直接紐づく関連データ
- **見積枝番**: 見積基本情報に直接紐づく関連データ

### 5. データベース設計（見積基本情報・見積内訳・見積明細・拡張テーブル）

#### 5.1 見積テーブル（基盤テーブル）

**詳細なテーブル定義は [`estimate-database-design.md`](./estimate-database-design.md) を参照してください。**

### 見積基本情報テーブル (estimates)
- **目的**: 見積の基本情報と金額情報を管理
- **特徴**: UUID主キー、ステータス管理、承認フロー対応
- **主要フィールド**: estimate_number, partner_id, project_type_id, status, total_amount, final_amount

#### 5.2 見積内訳構造テーブル

**詳細なテーブル定義は [`estimate-database-design.md`](./estimate-database-design.md) を参照してください。**

### 見積内訳構造テーブル (estimate_breakdowns)
- **目的**: 大内訳・中内訳・小内訳の階層構造を管理
- **特徴**: 一式金額対応、自動集計機能、階層構造管理
- **主要フィールド**: breakdown_type, direct_amount, calculated_amount, estimated_cost

#### 5.2.1 見積内訳の金額・予想原価仕様

見積内訳では、金額と予想原価について以下の仕様を採用します：

##### 5.2.1.1 金額の仕様
- **direct_amount**: 内訳自身の金額設定（一式等の直接入力ケース用）
- **calculated_amount**: 下位層の集計金額（子要素・明細の集計値）
- **表示ロジック**: どちらか数字が入っている方を表示
  - `calculated_amount > 0 ? calculated_amount : direct_amount`

##### 5.2.1.2 予想原価の仕様
- **direct_estimated_cost**: 内訳自身の予想原価設定（一式等の直接入力ケース用）
- **calculated_estimated_cost**: 下位層の集計予想原価（子要素・明細の集計値）
- **表示ロジック**: どちらか数字が入っている方を表示
  - `calculated_estimated_cost > 0 ? calculated_estimated_cost : direct_estimated_cost`

##### 5.2.1.3 集計ロジック
**小内訳の場合**:
- 明細がある場合：明細の集計値を`calculated_amount`と`calculated_estimated_cost`にセット
- 明細がない場合：内訳自身の値を`direct_amount`と`direct_estimated_cost`にセット

**中内訳・大内訳の場合**:
- 子要素がある場合：子要素の集計値を`calculated_amount`と`calculated_estimated_cost`にセット
- 子要素がない場合：内訳自身の値を`direct_amount`と`direct_estimated_cost`にセット

##### 5.2.1.4 実装例
```php
// 小内訳の集計処理
foreach ($smallBreakdowns as $breakdown) {
    $items = EstimateItem::where('breakdown_id', $breakdown->id)->get();
    
    if ($items->count() > 0) {
        // 明細がある場合：集計値を使用
        $breakdown->update([
            'calculated_amount' => $items->sum('amount'),
            'calculated_estimated_cost' => $items->sum('estimated_cost'),
        ]);
    } else {
        // 明細がない場合：直接入力値を使用
        $breakdown->update([
            'direct_amount' => $breakdown->direct_amount,
            'direct_estimated_cost' => $breakdown->direct_estimated_cost,
        ]);
    }
}

// 中内訳・大内訳の集計処理
foreach ($parentBreakdowns as $breakdown) {
    $children = EstimateBreakdown::where('parent_id', $breakdown->id)->get();
    
    if ($children->count() > 0) {
        // 子要素がある場合：集計値を使用
        $breakdown->update([
            'calculated_amount' => $children->sum('calculated_amount') + $children->sum('direct_amount'),
            'calculated_estimated_cost' => $children->sum('calculated_estimated_cost') + $children->sum('direct_estimated_cost'),
        ]);
    } else {
        // 子要素がない場合：直接入力値を使用
        $breakdown->update([
            'direct_amount' => $breakdown->direct_amount,
            'direct_estimated_cost' => $breakdown->direct_estimated_cost,
        ]);
    }
}
```

#### 5.2.2 開発時の注意点

##### 5.2.2.1 データ保存時の連動処理
見積内訳と見積明細のデータ保存時には、以下の連動処理を必ず実装する必要があります：

**明細データ保存時**:
1. 明細の`amount`と`estimated_cost`を更新
2. 関連する小内訳の`calculated_amount`と`calculated_estimated_cost`を再計算
3. 親の中内訳・大内訳の`calculated_amount`と`calculated_estimated_cost`を再計算
4. 階層構造を遡って全ての親要素の集計値を更新

**内訳データ保存時**:
1. 内訳の`direct_amount`と`direct_estimated_cost`を更新
2. 親の中内訳・大内訳の`calculated_amount`と`calculated_estimated_cost`を再計算
3. 階層構造を遡って全ての親要素の集計値を更新

##### 5.2.2.2 データ読み込み時の連動処理
データ読み込み時には、以下の処理を実装する必要があります：

**表示ロジック**:
```typescript
// フロントエンドでの表示ロジック
const displayAmount = (breakdown: EstimateBreakdown) => {
  return breakdown.calculated_amount > 0 
    ? breakdown.calculated_amount 
    : breakdown.direct_amount;
};

const displayEstimatedCost = (breakdown: EstimateBreakdown) => {
  return breakdown.calculated_estimated_cost > 0 
    ? breakdown.calculated_estimated_cost 
    : breakdown.direct_estimated_cost;
};
```

**APIレスポンス**:
- 見積内訳APIでは`direct_amount`, `calculated_amount`, `direct_estimated_cost`, `calculated_estimated_cost`の全てを返す
- フロントエンドで表示ロジックを適用

##### 5.2.2.3 実装時の必須チェック項目
1. **集計処理の実装**: 明細・内訳の保存時に必ず集計処理を実行
2. **トランザクション処理**: 複数テーブルの更新をトランザクションで囲む
3. **エラーハンドリング**: 集計処理失敗時のロールバック処理
4. **パフォーマンス**: 大量データでの集計処理の最適化
5. **データ整合性**: 集計値と実際の子要素の合計値の一致確認

##### 5.2.2.4 テスト項目
- 明細追加・更新・削除時の内訳集計値の正確性
- 内訳追加・更新・削除時の親内訳集計値の正確性
- 階層構造変更時の集計値の正確性
- 大量データでの集計処理のパフォーマンス
- 並行更新時のデータ整合性

#### 5.3 見積明細アイテムテーブル

**詳細なテーブル定義は [`estimate-database-design.md`](./estimate-database-design.md) を参照してください。**

### 見積明細アイテムテーブル (estimate_items)
- **目的**: 小内訳に紐づく明細項目を管理
- **特徴**: 小内訳への紐付け、金額自動計算、予想原価管理
- **主要フィールド**: breakdown_id, amount, estimated_cost

#### 5.4 原価計画テーブル

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

#### 5.5 原価計画明細テーブル

```sql
-- 原価計画明細テーブル
CREATE TABLE cost_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),              -- 原価計画明細ID
    cost_plan_id UUID REFERENCES cost_plans(id) ON DELETE CASCADE, -- 原価計画ID
    estimate_item_id UUID REFERENCES estimate_items(id),        -- 見積明細ID
    supplier_id BIGINT REFERENCES partners(id),                 -- 発注先（取引先ID）
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

#### 5.6 見積枝番テーブル

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

### 6. API設計（見積基本情報・見積内訳・見積明細・拡張テーブル）

#### 6.1 見積内訳API

```php
// 見積内訳API
GET    /api/v1/estimates/{id}/breakdowns                   # 見積内訳一覧取得（階層構造）
POST   /api/v1/estimates/{id}/breakdowns                   # 見積内訳作成
GET    /api/v1/estimates/{id}/breakdowns/{breakdown_id}    # 見積内訳詳細取得
PUT    /api/v1/estimates/{id}/breakdowns/{breakdown_id}    # 見積内訳更新
DELETE /api/v1/estimates/{id}/breakdowns/{breakdown_id}    # 見積内訳削除

// 階層管理API
POST   /api/v1/estimates/{id}/breakdowns/{breakdown_id}/move # 階層移動
POST   /api/v1/estimates/{id}/breakdowns/reorder            # 表示順序変更
POST   /api/v1/estimates/{id}/breakdowns/{breakdown_id}/toggle-expansion # 展開・折りたたみ
GET    /api/v1/estimates/{id}/breakdowns/hierarchy          # 階層構造取得
GET    /api/v1/estimates/{id}/breakdowns/{breakdown_id}/children # 子要素取得
GET    /api/v1/estimates/{id}/breakdowns/{breakdown_id}/parents # 親要素取得

// 金額計算API
POST   /api/v1/estimates/{id}/breakdowns/calculate          # 金額計算実行
GET    /api/v1/estimates/{id}/breakdowns/summary            # 内訳サマリー取得
```

#### 6.2 見積明細API

```php
// 見積明細API
GET    /api/v1/estimates/{id}/items                        # 見積明細一覧取得
POST   /api/v1/estimates/{id}/items                        # 見積明細作成
GET    /api/v1/estimates/{id}/items/{item_id}              # 見積明細詳細取得
PUT    /api/v1/estimates/{id}/items/{item_id}              # 見積明細更新
DELETE /api/v1/estimates/{id}/items/{item_id}              # 見積明細削除

// 明細管理API
POST   /api/v1/estimates/{id}/items/{item_id}/move         # 小内訳間移動
POST   /api/v1/estimates/{id}/items/reorder                # 表示順序変更
GET    /api/v1/estimates/{id}/items/by-breakdown           # 小内訳別明細取得
GET    /api/v1/estimates/{id}/items/summary                # 明細サマリー取得
```

#### 6.3 拡張テーブルAPI

```php
// 原価計画API
GET    /api/v1/estimates/{id}/cost-plans                   # 原価計画一覧取得
POST   /api/v1/estimates/{id}/cost-plans                   # 原価計画作成
GET    /api/v1/estimates/{id}/cost-plans/{plan_id}         # 原価計画詳細取得
PUT    /api/v1/estimates/{id}/cost-plans/{plan_id}         # 原価計画更新
DELETE /api/v1/estimates/{id}/cost-plans/{plan_id}         # 原価計画削除

// 見積枝番API
GET    /api/v1/estimates/{id}/branches                     # 見積枝番一覧取得
POST   /api/v1/estimates/{id}/branches                     # 見積枝番作成
GET    /api/v1/estimates/{id}/branches/{branch_id}         # 見積枝番詳細取得
PUT    /api/v1/estimates/{id}/branches/{branch_id}         # 見積枝番更新
DELETE /api/v1/estimates/{id}/branches/{branch_id}         # 見積枝番削除
```

### 7. フロントエンド設計（見積基本情報・見積内訳・見積明細・拡張テーブル）

#### 7.1 コンポーネント構成

```typescript
// 見積管理コンポーネント
components/
├── estimate/
│   ├── EstimateBasicInfo.tsx           # 見積基本情報管理（メイン）
│   ├── EstimateForm.tsx                # 見積基本情報作成・編集フォーム
│   ├── EstimateSummary.tsx             # 見積基本情報サマリー表示
│   ├── EstimateBreakdowns.tsx          # 見積内訳管理（メイン・階層構造対応）
│   ├── BreakdownHierarchy.tsx          # 内訳階層構造表示・操作
│   ├── BreakdownForm.tsx               # 内訳作成・編集フォーム
│   ├── BreakdownTable.tsx              # 内訳階層対応テーブル
│   ├── BreakdownRow.tsx                # 内訳行コンポーネント
│   ├── BreakdownActions.tsx            # 内訳操作ボタン群
│   ├── EstimateItems.tsx               # 見積明細管理（メイン）
│   ├── ItemForm.tsx                    # 明細作成・編集フォーム
│   ├── ItemTable.tsx                   # 明細テーブル
│   ├── ItemRow.tsx                     # 明細行コンポーネント
│   ├── ItemActions.tsx                 # 明細操作ボタン群
│   ├── HierarchyControls.tsx           # 階層操作コントロール
│   ├── AmountCalculation.tsx           # 金額計算コンポーネント
│   ├── BreakdownSummary.tsx            # 内訳サマリー表示
│   ├── ItemSummary.tsx                 # 明細サマリー表示
│   ├── CostPlan.tsx                    # 原価計画管理
│   ├── CostPlanForm.tsx                # 原価計画作成・編集フォーム
│   ├── EstimateBranch.tsx              # 見積枝番管理
│   ├── BranchForm.tsx                  # 枝番作成フォーム
│   └── OrderRequest.tsx                # 受注申請

#### 7.2 状態管理

```typescript
// 見積管理の状態管理
interface EstimateManagementState {
  // 表示制御
  currentView: 'hierarchy' | 'flat' | 'summary'; // 現在の表示種別
  
  // 見積基本情報
  estimate: Estimate | null;
  
  // 見積内訳データ
  breakdowns: EstimateBreakdown[];
  hierarchyBreakdowns: EstimateBreakdown[];
  selectedBreakdowns: string[];
  expandedBreakdowns: string[];
  
  // 見積明細データ
  items: EstimateItem[];
  selectedItems: string[];
  
  // 拡張テーブルデータ
  costPlans: CostPlan[];
  estimateBranches: EstimateBranch[];
  
  // UI状態
  loading: boolean;
  error: string | null;
}

// 見積内訳インターフェース
interface EstimateBreakdown {
  id: string;
  estimate_id: string;
  parent_id: string | null;
  breakdown_type: 'large' | 'medium' | 'small';
  display_order: number;
  name: string;
  description?: string;
  direct_amount: number;
  calculated_amount: number;
  estimated_cost: number;
  is_active: boolean;
  children?: EstimateBreakdown[];
  level: number;
}

// 見積明細インターフェース
interface EstimateItem {
  id: string;
  estimate_id: string;
  breakdown_id: string | null;
  display_order: number;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  estimated_cost: number;
  supplier_id?: number;
  construction_method?: string;
  construction_classification_id?: string;
  remarks?: string;
  is_active: boolean;
}

// Actions
const estimateManagementSlice = createSlice({
  name: 'estimateManagement',
  initialState,
  reducers: {
    // 表示切替
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    
    // 見積基本情報管理
    setEstimate: (state, action) => {
      state.estimate = action.payload;
    },
    
    // 見積内訳管理
    setBreakdowns: (state, action) => {
      state.breakdowns = action.payload;
    },
    addBreakdown: (state, action) => {
      state.breakdowns.push(action.payload);
    },
    updateBreakdown: (state, action) => {
      const index = state.breakdowns.findIndex(breakdown => breakdown.id === action.payload.id);
      if (index !== -1) {
        state.breakdowns[index] = action.payload;
      }
    },
    deleteBreakdown: (state, action) => {
      state.breakdowns = state.breakdowns.filter(breakdown => breakdown.id !== action.payload);
    },
    
    // 見積明細管理
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
    setHierarchyBreakdowns: (state, action) => {
      state.hierarchyBreakdowns = action.payload;
    },
    moveBreakdown: (state, action) => {
      const { breakdownId, newParentId } = action.payload;
      const breakdown = state.breakdowns.find(breakdown => breakdown.id === breakdownId);
      if (breakdown) {
        breakdown.parent_id = newParentId;
      }
    },
    moveItem: (state, action) => {
      const { itemId, newBreakdownId } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item) {
        item.breakdown_id = newBreakdownId;
      }
    },
    reorderBreakdowns: (state, action) => {
      const { breakdownIds } = action.payload;
      breakdownIds.forEach((breakdownId, index) => {
        const breakdown = state.breakdowns.find(breakdown => breakdown.id === breakdownId);
        if (breakdown) {
          breakdown.display_order = index;
        }
      });
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
    setSelectedBreakdowns: (state, action) => {
      state.selectedBreakdowns = action.payload;
    },
    setSelectedItems: (state, action) => {
      state.selectedItems = action.payload;
    },
    setExpandedBreakdowns: (state, action) => {
      state.expandedBreakdowns = action.payload;
    },
    toggleBreakdownExpansion: (state, action) => {
      const breakdownId = action.payload;
      const index = state.expandedBreakdowns.indexOf(breakdownId);
      if (index !== -1) {
        state.expandedBreakdowns.splice(index, 1);
      } else {
        state.expandedBreakdowns.push(breakdownId);
      }
    },
    
    // 拡張テーブル管理
    setCostPlans: (state, action) => {
      state.costPlans = action.payload;
    },
    setEstimateBranches: (state, action) => {
      state.estimateBranches = action.payload;
    },
    
    // その他のアクション
  }
});
```

### 8. ユーザーインターフェース仕様

#### 8.1 見積内訳・明細画面

- **タイトル**: "見積内訳・明細"
- **表示切替**:
  - "階層表示"（初期表示）
  - "フラット表示"
  - "サマリー表示"
- **アクションボタン**:
  - "大内訳追加"
  - "中内訳追加"
  - "小内訳追加"
  - "明細行追加"（小内訳に紐づく）
  - "階層移動"
  - "表示順序変更"
- **階層表示テーブル列**:
  - 階層レベル
  - 種別（内訳 or 明細）
  - 内訳種別（大・中・小）
  - 品名・仕様・内訳名
  - 数量（明細のみ）
  - 単位（明細のみ）
  - 単価（明細のみ）
  - 金額
  - 予想原価
  - 発注先
  - 工事分類
  - 操作
- **フラット表示テーブル列**:
  - 種別（内訳 or 明細）
  - 内訳種別（大・中・小）
  - 品名・仕様・内訳名
  - 親内訳名
  - 数量（明細のみ）
  - 単位（明細のみ）
  - 単価（明細のみ）
  - 金額
  - 予想原価
  - 発注先
  - 工事分類
  - 操作
- **サマリー表示テーブル列**:
  - 内訳種別
  - 内訳名
  - 項目数
  - 合計金額
  - 合計予想原価
  - 操作

#### 8.2 拡張テーブル管理画面

- **タイトル**: "原価計画・見積枝番"
- **原価計画管理**:
  - 原価計画一覧表示
  - 原価計画作成・編集・削除
  - 原価計画明細の管理
- **見積枝番管理**:
  - 見積枝番一覧表示
  - 見積枝番作成・編集・削除
  - 枝番別の詳細管理
- **テーブル列**:
  - 計画番号・枝番番号
  - 計画名称・枝番名称
  - ステータス
  - 作成日時
  - 操作

### 9. 業務フロー

#### 9.1 見積内訳・明細設定フロー

1. **初期表示**: 階層表示で内訳・明細一覧を表示
2. **内訳構造作成**: 
   - 大内訳を作成
   - 中内訳を作成（大内訳の子として）
   - 小内訳を作成（中内訳の子として）
3. **明細行入力**: 小内訳に紐づく明細行を入力
4. **階層整理**: 内訳・明細を適切な階層に配置
5. **表示切替**: 表示モードを切り替えて各階層の状況を確認

#### 9.2 明細入力フロー

1. **小内訳選択**: 明細を入力する小内訳を選択
2. **明細追加**: 選択した小内訳に明細行を追加
3. **詳細入力**: 工法、数量、単価などの詳細を入力
4. **金額計算**: 自動的に金額を計算
5. **階層確認**: 階層構造によるグルーピングを確認

#### 9.3 拡張テーブル管理フロー

1. **原価計画作成**: 見積基本情報に紐づく原価計画を作成
2. **原価計画明細設定**: 見積明細に紐づく原価計画明細を設定
3. **見積枝番作成**: 見積基本情報に紐づく見積枝番を作成
4. **枝番管理**: 枝番別の詳細管理とステータス管理

### 10. 検証・制約

#### 10.1 データ整合性

- **見積基本情報**: 全てのデータの親として機能
- **見積内訳**: 見積基本情報に直接紐づく階層構造（大→中→小）
- **見積明細**: 小内訳にのみ紐づく明細項目
- **拡張テーブル**: 見積基本情報に直接紐づく関連データ
- **階層構造の循環参照を防ぐ**
- **削除時は関連するデータの処理を考慮**

#### 10.2 パフォーマンス

- 大量の内訳・明細がある場合の表示最適化
- 階層構造の効率的な取得
- 金額計算の最適化
- 拡張テーブルデータの効率的な取得

### 11. 変更履歴

#### 2025-09-07: 見積基本情報を親とした階層構造の明確化

**変更内容**:
- 見積基本情報を親とした階層構造の関係性を明確化
- 見積内訳と見積明細の関係性を整理
- 拡張テーブル（原価計画、見積枝番）の関係性を追加
- 旧設計の記述を削除し、新設計に統一
- データの関係性図を追加

#### 2025-09-06: テーブル定義書の更新

**変更内容**:
- `estimates.id`の型を`BIGSERIAL`から`UUID`に変更

**変更理由**:
1. **セキュリティ向上**: UUID型により連番推測が困難
2. **分散システム対応**: マイクロサービス間でのID衝突回避
3. **データ移行安全性**: データベース間移行時のID衝突リスク軽減
4. **実装との整合性**: 現在の実装がUUID型で動作している

**影響範囲**:
- `estimate_breakdowns.estimate_id` → 既にUUID型で正しく実装済み
- `estimate_items.estimate_id` → 既にUUID型で正しく実装済み
- 他のテーブルとの外部キー関係 → 影響なし（`partner_id`、`project_type_id`等はBIGINT型のまま）

**実装上の利点**:
- 現在のエラー（`"tree"`エラー）の根本解決
- フロントエンドとの整合性確保
- 既存データの保持
