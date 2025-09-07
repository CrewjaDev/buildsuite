# 見積管理機能 新設計仕様書

## 概要
見積明細の入力編集操作方法を、より直感的で効率的な2段階プロセスに変更します。
内訳構造の事前定義と明細行の入力・紐付けを分離することで、業務フローを改善します。

## 新設計の基本概念

### 設計思想
1. **内訳構造の事前定義**: 見積書の「章立て」や「目次」を先に作成
2. **明細行の入力と紐付け**: 作成した内訳構造に明細を紐付けて入力
3. **テーブル分離**: 内訳構造と明細アイテムを独立したテーブルで管理
4. **柔軟な金額計算**: 自動集計と直接入力の両方をサポート

### 業務フロー
```
ステップ1: 内訳構造の事前定義
    ↓
ステップ2: 明細行の入力と内訳への紐付け
    ↓
ステップ3: 見積書の生成・出力
```

## ステップ1: 内訳構造の事前定義

### 1.1 専用UIの提供
- 見積作成画面に「見積内訳を設定する」ボタンを配置
- 内訳構造定義専用のモーダルまたはページを開く
- 階層構造を視覚的に管理できるUI

### 1.2 階層構造の作成
#### 小内訳の作成
- 内訳の最小単位の名前を入力
- 例：「サーバー機器」「ソフトウェア」「設定作業」
- 各小内訳は独立したエンティティとして管理

#### 中内訳の作成
- 小内訳をグループ化する形で中内訳を作成
- 例：「ハードウェア調達」という中内訳に「サーバー機器」を紐付け
- 親子関係を視覚的に設定

#### 大内訳の作成
- 中内訳をグループ化する形で大内訳を作成
- 例：「システム導入費用」という大内訳に「ハードウェア調達」を紐付け
- 3階層の構造を完成

### 1.3 作成される構造例
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

## ステップ2: 明細行の入力と内訳への紐付け

### 2.1 明細入力画面
- 通常の明細入力画面に戻る
- 新しい明細行追加時に「内訳」選択項目を提供

### 2.2 内訳選択機能
- ドロップダウンリストで小内訳一覧を表示
- ステップ1で作成した小内訳のみが選択可能
- 例：「Dell PowerEdge R760」という品名に「サーバー機器」を選択

### 2.3 自動グループ化
- 選択された小内訳（と、それに紐づく中・大内訳）に従って自動グループ化
- 集計・表示を自動実行
- 階層構造に基づく見積書レイアウトの生成

## データベース設計

### 3.1 見積内訳構造テーブル (estimate_breakdowns)
```sql
CREATE TABLE estimate_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES estimate_breakdowns(id),
    breakdown_type VARCHAR(20) NOT NULL, -- 'large', 'medium', 'small'
    name VARCHAR(500) NOT NULL,
    display_order INTEGER DEFAULT 0,
    description TEXT,
    direct_amount BIGINT DEFAULT 0, -- 直接入力金額（一式等のケース用）
    calculated_amount BIGINT DEFAULT 0, -- 最終表示金額（システム計算）
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

### 3.2 見積明細アイテムテーブル (estimate_items)
```sql
CREATE TABLE estimate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    breakdown_id UUID NOT NULL REFERENCES estimate_breakdowns(id), -- 小内訳への紐付け
    name VARCHAR(500) NOT NULL,
    description TEXT,
    quantity DECIMAL(12,2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT '個',
    unit_price BIGINT DEFAULT 0,
    amount BIGINT DEFAULT 0,
    estimated_cost BIGINT DEFAULT 0,
    supplier_id INTEGER REFERENCES partners(id),
    construction_method VARCHAR(255),
    construction_classification_id INTEGER REFERENCES construction_classifications(id),
    remarks TEXT,
    order_request_content TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

## 金額計算ロジック

### 4.1 内訳金額の決定ルール
内訳の金額は以下のルールに基づいて決定されます：

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

### 4.2 計算処理のタイミング
以下の操作時に金額計算を実行：
- 明細の追加・削除・編集
- 内訳の`direct_amount`の編集
- 内訳構造の変更（親子関係の変更）

### 4.3 計算処理の流れ
```
1. 明細レベルの計算
   - 各明細のamount = quantity × unit_price
   ↓
2. 小内訳レベルの計算
   - 小内訳のcalculated_amount = 紐づく明細のamount合計
   - 明細がない場合はdirect_amountを使用
   ↓
3. 中内訳レベルの計算
   - 中内訳のcalculated_amount = 紐づく小内訳のcalculated_amount合計
   - 小内訳がない場合はdirect_amountを使用
   ↓
4. 大内訳レベルの計算
   - 大内訳のcalculated_amount = 紐づく中内訳のcalculated_amount合計
   - 中内訳がない場合はdirect_amountを使用
```

## 実装方針

### 5.1 フロントエンド実装
#### 内訳構造設定UI
- 階層構造を視覚的に表示するツリーコンポーネント
- ドラッグ&ドロップによる階層変更
- 内訳の追加・編集・削除機能
- **直接金額入力フィールド**（一式等のケース用）

#### 明細入力UI
- 内訳選択ドロップダウン
- 明細行の追加・編集・削除
- 内訳別のグループ表示
- **金額の自動計算表示**

### 5.2 バックエンド実装
#### API設計
- 内訳構造のCRUD操作
- 明細アイテムのCRUD操作
- 階層構造の取得・更新
- **金額計算API**（リアルタイム計算）

#### データ整合性
- 内訳削除時の明細アイテム処理
- 階層構造の循環参照防止
- 表示順序の自動調整
- **金額計算の整合性保証**

### 5.3 金額計算の実装
#### バックエンド処理
```php
// 例：Laravelでの実装
class EstimateBreakdownService
{
    public function calculateAmounts($estimateId)
    {
        // 1. 明細レベルの計算
        $this->calculateItemAmounts($estimateId);
        
        // 2. 小内訳レベルの計算
        $this->calculateSmallBreakdownAmounts($estimateId);
        
        // 3. 中内訳レベルの計算
        $this->calculateMediumBreakdownAmounts($estimateId);
        
        // 4. 大内訳レベルの計算
        $this->calculateLargeBreakdownAmounts($estimateId);
    }
    
    private function calculateBreakdownAmount($breakdown)
    {
        $subItemsTotal = $this->getSubItemsTotal($breakdown);
        
        if ($subItemsTotal > 0) {
            return $subItemsTotal;
        } else {
            return $breakdown->direct_amount;
        }
    }
}
```

#### フロントエンド処理
```typescript
// 例：Reactでの実装
const useAmountCalculation = (estimateId: string) => {
  const { mutate: calculateAmounts } = useMutation({
    mutationFn: () => estimateService.calculateAmounts(estimateId),
    onSuccess: () => {
      queryClient.invalidateQueries(['estimate-breakdowns', estimateId]);
    }
  });

  return { calculateAmounts };
};
```

## 移行計画

### 6.1 既存データの移行
1. 既存のestimate_itemsテーブルのデータを分析
2. 階層構造を抽出してestimate_breakdownsテーブルに移行
3. 明細データを新しい構造に紐付け
4. **金額計算ロジックの適用**
5. データ整合性の検証

### 6.2 段階的リリース
1. 新テーブル構造の作成
2. 内訳構造設定機能の実装
3. 明細入力機能の更新
4. **金額計算機能の実装**
5. 既存データの移行
6. 旧機能の廃止

## メリット

### 7.1 業務効率の向上
- 内訳構造の再利用が可能
- 明細入力時の迷いが減少
- 見積書の一貫性が向上
- **一式等の柔軟な金額設定が可能**

### 7.2 システム設計の改善
- テーブル分離による責任の明確化
- データ整合性の向上
- 拡張性の向上
- **柔軟な金額計算ロジック**

### 7.3 ユーザビリティの向上
- 直感的な操作フロー
- 視覚的な階層管理
- エラーの削減
- **自動計算と手動入力の使い分け**

## 今後の拡張

### 8.1 内訳テンプレート機能
- よく使用する内訳構造をテンプレート化
- 業界別・工事種別別のテンプレート提供
- **一式金額のテンプレート化**

### 8.2 高度な集計機能
- 内訳別の利益率分析
- 原価との比較分析
- トレンド分析
- **直接入力と自動計算の混在分析**

### 8.3 承認フロー連携
- 内訳レベルでの承認設定
- 金額閾値に基づく承認ルート
- **一式金額の特別承認フロー**

## 技術的詳細

### 9.1 フロントエンド技術スタック
- **React**: コンポーネントベースのUI構築
- **TypeScript**: 型安全性の確保
- **TanStack Table**: テーブル表示とソート機能
- **React Query**: データフェッチとキャッシュ管理
- **Shadcn/ui**: UIコンポーネントライブラリ

### 9.2 バックエンド技術スタック
- **Laravel**: PHPフレームワーク
- **PostgreSQL**: リレーショナルデータベース
- **Eloquent ORM**: データベース操作
- **UUID**: プライマリキーとして使用

### 9.3 データフロー
```
1. ユーザーが内訳構造を設定
   ↓
2. フロントエンドからAPI経由でestimate_breakdownsテーブルに保存
   ↓
3. ユーザーが明細を入力し、小内訳を選択
   ↓
4. フロントエンドからAPI経由でestimate_itemsテーブルに保存
   ↓
5. 金額計算APIが自動実行され、calculated_amountを更新
   ↓
6. 見積書生成時に階層構造に基づいてデータを取得・表示
```

## 実装フェーズ

### フェーズ1: 基盤構築
- [ ] 新テーブル構造のマイグレーション作成
- [ ] バックエンドAPIの実装
- [ ] 基本的なCRUD操作の実装

### フェーズ2: 内訳構造設定機能
- [ ] 内訳構造設定UIの実装
- [ ] 階層構造の視覚化
- [ ] ドラッグ&ドロップ機能
- [ ] **直接金額入力フィールドの実装**

### フェーズ3: 明細入力機能
- [ ] 内訳選択ドロップダウンの実装
- [ ] 明細入力フォームの更新
- [ ] 内訳別グループ表示

### フェーズ4: 金額計算機能
- [ ] **金額計算ロジックの実装**
- [ ] **リアルタイム計算APIの実装**
- [ ] **フロントエンドでの金額表示更新**

### フェーズ5: データ移行
- [ ] 既存データの分析
- [ ] 移行スクリプトの作成
- [ ] **金額計算の適用**
- [ ] データ整合性の検証

### フェーズ6: テスト・リリース
- [ ] 機能テストの実施
- [ ] **金額計算の精度テスト**
- [ ] パフォーマンステスト
- [ ] 本番環境へのリリース

## 運用上の考慮事項

### 10.1 一式金額の運用ルール
- 一式金額は明細がない場合のみ有効
- 一式金額と明細が混在する場合は明細を優先
- 一式金額の変更時は関連する上位内訳の再計算を実行

### 10.2 パフォーマンス最適化
- 金額計算は非同期処理で実行
- 大量データの場合はバッチ処理を検討
- 計算結果のキャッシュ機能を実装

### 10.3 エラーハンドリング
- 金額計算エラー時のロールバック機能
- 不正な金額データの検証
- ユーザーへの適切なエラーメッセージ表示

## 実装例

### 11.1 一式金額入力のUI例
```typescript
// 内訳編集フォームでの一式金額入力
<div className="space-y-2">
  <Label htmlFor="direct_amount">一式金額（明細がない場合のみ有効）</Label>
  <Input
    id="direct_amount"
    type="number"
    value={formData.direct_amount}
    onChange={(e) => handleInputChange('direct_amount', parseInt(e.target.value) || 0)}
    placeholder="一式金額を入力"
    disabled={hasSubItems} // 下位アイテムがある場合は無効化
  />
  {hasSubItems && (
    <p className="text-sm text-gray-500">
      下位アイテムが存在するため、一式金額は無効です
    </p>
  )}
</div>
```

### 11.2 金額表示のUI例
```typescript
// 内訳一覧での金額表示
<div className="flex items-center justify-between">
  <span className="font-medium">{breakdown.name}</span>
  <div className="text-right">
    <div className="text-lg font-bold">
      ¥{formatCurrency(breakdown.calculated_amount)}
    </div>
    {breakdown.direct_amount > 0 && breakdown.calculated_amount !== breakdown.direct_amount && (
      <div className="text-xs text-gray-500">
        一式: ¥{formatCurrency(breakdown.direct_amount)}
      </div>
    )}
  </div>
</div>
```

### 11.3 金額計算のバックエンド実装例
```php
// Laravelでの金額計算サービス
class EstimateBreakdownCalculationService
{
    public function recalculateAllAmounts($estimateId)
    {
        DB::transaction(function () use ($estimateId) {
            // 明細の金額を再計算
            $this->recalculateItemAmounts($estimateId);
            
            // 小内訳から大内訳まで順次計算
            $this->recalculateBreakdownAmounts($estimateId, 'small');
            $this->recalculateBreakdownAmounts($estimateId, 'medium');
            $this->recalculateBreakdownAmounts($estimateId, 'large');
        });
    }
    
    private function recalculateBreakdownAmounts($estimateId, $breakdownType)
    {
        $breakdowns = EstimateBreakdown::where('estimate_id', $estimateId)
            ->where('breakdown_type', $breakdownType)
            ->get();
            
        foreach ($breakdowns as $breakdown) {
            $subItemsTotal = $this->getSubItemsTotal($breakdown);
            
            $calculatedAmount = $subItemsTotal > 0 
                ? $subItemsTotal 
                : $breakdown->direct_amount;
                
            $breakdown->update(['calculated_amount' => $calculatedAmount]);
        }
    }
}
```