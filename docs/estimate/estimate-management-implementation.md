# 見積管理機能 実装ガイド・進捗管理

## プロジェクト概要
- **プロジェクト名**: BuildSuite 見積管理機能
- **実装期間**: 約15-20日
- **技術スタック**: Next.js 15 + TanStack Table + Shadcn/ui + Laravel RESTful API
- **担当者**: 開発チーム

## 新しいディレクトリ構成

### 見積機能専用ディレクトリ構造
```
frontend/src/
├── services/features/estimates/           # 見積機能専用APIサービス
│   ├── estimateService.ts                 # 見積基本情報API
│   ├── estimateItemService.ts             # 見積明細API
│   ├── partnerService.ts                  # 取引先API
│   ├── projectTypeService.ts              # プロジェクトタイプAPI
│   └── constructionClassificationService.ts # 工事分類API
├── types/features/estimates/              # 見積機能専用型定義
│   ├── estimate.ts                        # 見積基本情報型
│   ├── estimateItem.ts                    # 見積明細型
│   ├── partner.ts                         # 取引先型
│   ├── projectType.ts                     # プロジェクトタイプ型
│   └── constructionClassification.ts      # 工事分類型
├── hooks/features/estimates/              # 見積機能専用フック
│   ├── useEstimates.ts                    # 見積一覧・CRUD
│   ├── useEstimateItems.ts                # 見積明細CRUD
│   ├── usePartners.ts                     # 取引先管理
│   ├── useProjectTypes.ts                 # プロジェクトタイプ
│   └── useConstructionClassifications.ts  # 工事分類
├── components/features/estimates/         # 見積機能専用コンポーネント
│   ├── EstimateList/                      # 見積一覧
│   │   ├── EstimateTable.tsx
│   │   ├── EstimateSearchFilters.tsx
│   │   └── EstimateListHeader.tsx
│   ├── EstimateDetail/                    # 見積詳細
│   │   ├── EstimateDetailView.tsx
│   │   ├── EstimateDetailEdit.tsx
│   │   ├── EstimateInfoCard.tsx
│   │   ├── EstimatePartnerCard.tsx
│   │   ├── EstimateItemsCard.tsx
│   │   ├── EstimateAmountCard.tsx
│   │   └── EstimateMetaCard.tsx
│   ├── EstimateItems/                     # 見積明細管理
│   │   ├── EstimateItemTree.tsx
│   │   ├── EstimateItemForm.tsx
│   │   └── EstimateItemRow.tsx
│   └── EstimateOutput/                    # 見積書出力
│       ├── EstimatePreview.tsx
│       ├── EstimatePDF.tsx
│       └── EstimateExcel.tsx
└── app/(features)/estimates/              # 見積機能ページ
    ├── page.tsx                           # 見積一覧ページ
    ├── [id]/                              # 見積詳細
    │   ├── page.tsx
    │   ├── edit/page.tsx
    │   └── print/page.tsx
    ├── create/                            # 見積作成
    │   └── page.tsx
 
```

## 実装状況サマリー

### 完了済み機能 ✅
- **Phase 1**: 基盤構築（型定義、APIサービス、React Queryフック）
- **Phase 2**: 見積一覧機能（表示、検索、フィルター、ページネーション）
- **Phase 3**: 見積詳細機能（照会・編集・作成・削除）
- **Phase 4**: 見積詳細機能の拡張（データ整合性確保、UI/UX改善）
- **Phase 4.5**: 見積内訳・明細の新設計実装（2段階プロセス、テーブル分離）
- **見積内訳・明細2段管理**: 完全実装完了（新設計による2段階プロセス）

### 現在の実装状況
- **見積一覧**: 完全実装済み
- **見積詳細**: 完全実装済み（照会・編集タブ、データ整合性確保）
- **見積作成**: 基本実装済み
- **見積内訳構造**: 完全実装済み（新設計による2段階プロセス）
- **見積明細**: 照会機能実装済み（階層表示、金額集計、列位置調整完了）
- **見積内訳**: 照会機能実装済み（タブ切り分け、階層表示、バッジ表示制御完了）
- **見積内訳・明細2段管理**: 完全実装完了（テーブル分離、金額計算、予想原価計算）

### 次の実装対象
- **Phase 5**: ダイアログベース編集機能の実装

---

## 実装計画（改訂版）

### Phase 1: 基盤構築（3-4日）
**目標**: 見積管理機能の基本構造とAPI連携の確立

#### 1.1 ディレクトリ構造の作成
- [x] 見積機能専用ディレクトリ構造の作成 ✅
- [x] 型定義ファイルの作成 ✅
- [x] APIサービスファイルの作成 ✅
- [x] React Queryフックファイルの作成 ✅

#### 1.2 基本型定義の実装
- [x] `types/features/estimates/estimate.ts` - 見積基本情報型 ✅
- [x] `types/features/estimates/estimateItem.ts` - 見積明細型 ✅
- [x] `types/features/estimates/partner.ts` - 取引先型 ✅
- [x] `types/features/estimates/projectType.ts` - プロジェクトタイプ型 ✅
- [x] `types/features/estimates/constructionClassification.ts` - 工事分類型 ✅

#### 1.3 APIサービスの実装
- [x] `services/features/estimates/estimateService.ts` - 見積基本情報API ✅
- [x] `services/features/estimates/estimateItemService.ts` - 見積明細API ✅
- [x] `services/features/estimates/partnerService.ts` - 取引先API ✅
- [x] `services/features/estimates/projectTypeService.ts` - プロジェクトタイプAPI ✅
- [x] `services/features/estimates/constructionClassificationService.ts` - 工事分類API ✅

#### 1.4 React Queryフックの実装
- [x] `hooks/features/estimates/useEstimates.ts` - 見積一覧・CRUD ✅
- [x] `hooks/features/estimates/useEstimateItems.ts` - 見積明細CRUD ✅
- [x] `hooks/features/estimates/usePartners.ts` - 取引先管理 ✅
- [x] `hooks/features/estimates/useProjectTypes.ts` - プロジェクトタイプ ✅
- [x] `hooks/features/estimates/useConstructionClassifications.ts` - 工事分類 ✅

**Phase 1 完了条件**: 型定義、APIサービス、React Queryフックが完成し、基本的なAPI通信が動作すること

---

### Phase 2: 見積一覧機能（3-4日）
**目標**: 見積一覧の表示、検索、フィルター、ページネーション

#### 2.1 見積一覧ページの実装
- [x] `app/(features)/estimates/page.tsx` - 見積一覧ページ
- [x] ~~`components/features/estimates/EstimateList/EstimateListPage.tsx` - ページコンポーネント~~ (削除済み)

#### 2.2 見積一覧コンポーネントの実装
- [x] `components/features/estimates/EstimateList/EstimateTable.tsx` - 見積テーブル
- [x] `components/features/estimates/EstimateList/EstimateSearchFilters.tsx` - 検索・フィルター
- [x] `components/features/estimates/EstimateList/EstimateListHeader.tsx` - ヘッダー

#### 2.3 機能実装
- [x] 見積一覧表示（スティッキーヘッダー対応）
- [x] 検索機能（見積番号、プロジェクト名、取引先名）
- [x] フィルター機能（ステータス、取引先、プロジェクトタイプ）
- [x] ページネーション
- [x] 列移動・列幅調整
- [x] レスポンシブ対応

**Phase 2 完了条件**: 見積一覧が表示され、検索・フィルター・ページネーションが正常に動作すること

---

### Phase 3: 見積詳細機能（4-5日）
**目標**: 見積詳細の表示、編集、作成、削除機能

#### 3.1 見積詳細ページの実装
- [x] `app/(features)/estimates/[id]/page.tsx` - 見積詳細ページ
- [x] `app/(features)/estimates/[id]/edit/page.tsx` - 見積編集ページ
- [x] ~~`components/features/estimates/EstimateDetail/EstimateDetailPage.tsx` - 詳細ページコンポーネント~~ (削除済み)

#### 3.2 見積詳細コンポーネントの実装
- [x] `components/features/estimates/EstimateDetail/EstimateDetailView.tsx` - 照会モード ✅
- [x] `components/features/estimates/EstimateDetail/EstimateDetailEdit.tsx` - 編集モード ✅
- [x] `components/features/estimates/EstimateDetail/EstimateDetailHeader.tsx` - ヘッダーコンポーネント ✅
- [x] `components/features/estimates/EstimateDetail/EstimateInfoCard.tsx` - 基本情報カード ✅
- [x] ~~`components/features/estimates/EstimateDetail/EstimatePartnerCard.tsx` - 取引先情報カード~~ (削除済み)
- [x] `components/features/estimates/EstimateDetail/EstimateItemsCard.tsx` - 見積明細カード（プレースホルダー） ✅
- [x] `components/features/estimates/EstimateDetail/EstimateAmountCard.tsx` - 金額情報カード ✅
- [x] `components/features/estimates/EstimateDetail/EstimateMetaCard.tsx` - メタ情報カード ✅

#### 3.3 見積作成機能の実装
- [x] `app/(features)/estimates/create/page.tsx` - 見積作成ページ
- [x] `components/features/estimates/EstimateCreate/EstimateCreateForm.tsx` - 作成フォームコンポーネント

**Phase 3 完了条件**: 見積詳細の照会・編集・作成・削除が正常に動作すること

---

### Phase 4: 見積詳細機能の拡張（完了）
**目標**: 見積詳細機能の完全実装とデータ整合性の確保

#### 4.1 見積詳細機能の拡張実装
- [x] 見積詳細ページのタブ機能（照会・編集） ✅
- [x] 見積基本情報の編集機能 ✅
- [x] 工事種別選択による費率自動設定 ✅
- [x] 日付フィールドの正しい保存・表示 ✅
- [x] データ更新後の自動反映機能 ✅

#### 4.2 データ整合性の確保
- [x] フロントエンド・バックエンド間のフィールド名マッピング ✅
- [x] 見積日・工期期間の正しい保存処理 ✅
- [x] 工事種別費率の自動取得・設定 ✅
- [x] 更新後のキャッシュ無効化とデータ再取得 ✅

#### 4.3 UI/UX改善
- [x] 編集可能フィールドの視認性向上 ✅
- [x] 費率フィールドの表示専用化 ✅
- [x] 工期期間の期間入力（from-to）対応 ✅
- [x] 工事番号の表示機能 ✅

**Phase 4 完了条件**: 見積詳細機能が完全に動作し、データの整合性が保たれること

---

### Phase 4.5: 見積内訳・明細の新設計実装（完了）
**目標**: 見積内訳と見積明細の新設計による2段階プロセスの実装

#### 4.5.1 データベース設計の実装
- [x] 見積内訳構造テーブル（estimate_breakdowns）の作成 ✅
- [x] 見積明細アイテムテーブル（estimate_items）の修正 ✅
- [x] 一式金額対応（direct_amount、calculated_amount）の実装 ✅
- [x] 階層構造の外部キー制約設定 ✅

#### 4.5.2 バックエンド実装
- [x] EstimateBreakdownモデルの実装 ✅
- [x] EstimateItemモデルの更新 ✅
- [x] EstimateBreakdownControllerの実装 ✅
- [x] 金額計算ロジックの実装 ✅
- [x] APIルートの設定 ✅

#### 4.5.3 データシーダーの実装
- [x] EstimateBreakdownSeederの実装 ✅
- [x] EstimateItemNewSeederの実装 ✅
- [x] 階層構造の仮データ作成 ✅
- [x] 一式金額のサンプルデータ作成 ✅

#### 4.5.4 新設計の特徴
- [x] 2段階プロセス（内訳構造定義→明細入力・紐付け） ✅
- [x] テーブル分離（内訳構造と明細アイテム） ✅
- [x] 柔軟な金額計算（自動集計と直接入力） ✅
- [x] 一式金額対応（実務的な要件） ✅

**Phase 4.5 完了条件**: 新設計による見積内訳・明細のバックエンド実装が完成し、データが正常に作成されること

---

### Phase 5: 見積内訳・明細の登録・編集機能の実装（3-4日）
**目標**: 見積内訳と見積明細の登録・編集機能の完全実装

#### 5.1 見積内訳の編集機能（見積詳細編集タブ内で実装）
- [x] 見積内訳編集機能の実装 ✅
  - [x] 既存データの編集（seederデータを活用）
  - [x] 階層構造の変更（親子関係の変更）
  - [x] 一式金額の編集
  - [x] 内訳タイプ変更（大/中/小内訳）
  - [x] 名称、説明の編集
- [x] 見積内訳削除機能の実装 ✅
  - [x] 子内訳・明細の存在チェック
  - [x] 削除確認ダイアログ
  - [x] 関連データの整合性確保
- [x] 見積内訳新規追加機能の実装 ✅
  - [x] 既存見積への内訳追加
  - [x] 親内訳選択（階層構造対応）
  - [x] バリデーション機能

#### 5.1.1 見積新規登録時の内訳登録機能（将来実装）
- [ ] 見積作成時の内訳構造一括登録
  - [ ] 内訳タイプ選択（大/中/小内訳）
  - [ ] 親内訳選択（階層構造対応）
  - [ ] 名称、説明、金額の入力
  - [ ] バリデーション機能

#### 5.2 見積明細の登録・編集機能
- [ ] 見積明細新規登録フォームの実装
  - [ ] 内訳選択（階層構造を考慮したドロップダウン）
  - [ ] 工法、工事分類、数量、単価等の入力
  - [ ] 金額自動計算機能
  - [ ] バリデーション機能
- [ ] 見積明細編集機能の実装
  - [ ] 既存データの編集（seederデータを活用）
  - [ ] 内訳変更機能
  - [ ] 数量・単価変更時の金額再計算
- [ ] 見積明細削除機能の実装
  - [ ] 削除確認ダイアログ
  - [ ] 関連する内訳金額の再計算

#### 5.3 既存コンポーネントの活用・拡張
- [x] `components/features/estimates/EstimateItems/EstimateItemTree.tsx` - 階層構造表示 ✅
- [x] `components/features/estimates/EstimateItems/EstimateItemForm.tsx` - 明細フォーム ✅
- [x] `components/features/estimates/EstimateItems/EstimateItemRow.tsx` - 明細行 ✅
- [x] `components/features/estimates/EstimateItems/EstimateItemsCard.tsx` - 明細管理カード ✅
- [x] `components/features/estimates/EstimateBreakdowns/EstimateBreakdownStructureCard.tsx` - 内訳構造カード ✅
- [x] `components/features/estimates/EstimateBreakdowns/EstimateBreakdownTreeView.tsx` - 内訳ツリー表示 ✅

#### 5.4 新規実装が必要なコンポーネント
- [x] `components/features/estimates/EstimateBreakdowns/EstimateBreakdownForm.tsx` - 内訳編集フォーム ✅
- [x] `components/features/estimates/EstimateBreakdowns/EstimateBreakdownEditDialog.tsx` - 内訳編集ダイアログ ✅
- [ ] `components/features/estimates/EstimateItems/EstimateItemEditDialog.tsx` - 明細編集ダイアログ
- [x] 見積詳細編集タブ内での内訳管理UI統合 ✅

#### 5.5 データ連携・整合性の確保
- [x] 内訳登録時の階層構造バリデーション ✅
- [ ] 明細登録時の内訳存在チェック
- [ ] 金額計算の自動更新機能
- [x] 削除時の関連データ整合性チェック ✅
- [x] キャッシュ無効化とデータ再取得 ✅

**Phase 5 完了条件**: 見積詳細編集タブ内での見積内訳・明細の編集・削除機能が完全に動作し、データの整合性が保たれること

---

### Phase 6: 見積書出力機能（2-3日）
**目標**: 見積書のプレビュー、PDF出力、Excel出力

#### 6.1 見積書出力コンポーネントの実装
- [ ] `components/features/estimates/EstimateOutput/EstimatePreview.tsx` - プレビュー
- [ ] `components/features/estimates/EstimateOutput/EstimatePDF.tsx` - PDF出力
- [ ] `components/features/estimates/EstimateOutput/EstimateExcel.tsx` - Excel出力

#### 6.2 出力ページの実装
- [ ] `app/(features)/estimates/[id]/print/page.tsx` - 印刷ページ

#### 6.3 機能実装
- [ ] 見積書プレビュー画面
- [ ] PDF出力機能
- [ ] Excel出力機能
- [ ] 印刷機能

**Phase 6 完了条件**: 見積書の出力機能が正常に動作すること

---

### Phase 7: 承認フロー統合（2-3日）
**目標**: 見積承認フローとの統合

#### 7.1 承認機能の実装
- [ ] 見積承認依頼作成
- [ ] 見積承認依頼一覧
- [ ] 見積承認アクション
- [ ] 承認履歴表示
- [ ] 承認コメント機能

**Phase 7 完了条件**: 見積承認フローが正常に動作すること

---

### Phase 8: 最適化・テスト（2-3日）
**目標**: パフォーマンス最適化、テスト、ドキュメント

#### 8.1 最適化・テスト項目
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング
- [ ] アクセシビリティ対応
- [ ] テスト実装
- [ ] ドキュメント作成

**Phase 8 完了条件**: 本番環境での運用に耐える品質であること

---

## 技術仕様（改訂版）

### 使用技術
- **フロントエンド**: Next.js 15 (App Router)
- **UIライブラリ**: TanStack Table + Shadcn/ui
- **状態管理**: TanStack Query + Redux Toolkit
- **バックエンド**: Laravel 12 + RESTful API
- **データベース**: PostgreSQL

### API仕様
- **エンドポイント**: `/api/estimates`, `/api/estimate-items`, `/api/partners` など
- **認証**: Laravel Sanctum
- **レスポンス形式**: JSON
- **ページネーション**: サーバーサイド

### 主要なAPI操作
```typescript
// 見積関連
GET    /api/estimates              # 見積一覧取得
POST   /api/estimates              # 見積作成
GET    /api/estimates/{id}         # 見積詳細取得
PUT    /api/estimates/{id}         # 見積更新
DELETE /api/estimates/{id}         # 見積削除

// 見積明細関連
GET    /api/estimate-items         # 見積明細一覧取得
POST   /api/estimate-items         # 見積明細作成
GET    /api/estimate-items/{id}    # 見積明細詳細取得
PUT    /api/estimate-items/{id}    # 見積明細更新
DELETE /api/estimate-items/{id}    # 見積明細削除

// マスターデータ関連
GET    /api/partners               # 取引先一覧
GET    /api/project-types          # プロジェクトタイプ一覧
GET    /api/construction-classifications # 工事分類一覧
```

---

## 進捗管理

### 現在の状況
- **開始日**: 2025年9月1日
- **現在のPhase**: Phase 5.2.2（見積内訳編集ダイアログの実装）準備完了
- **完了率**: Phase 1: 100%, Phase 2: 100%, Phase 3: 100%, Phase 4: 100%, Phase 4.5: 100%, Phase 5.1: 100%, Phase 5.2.1: 100%, Phase 5.2.2: 0%
- **見積内訳・明細2段管理**: 完全実装完了（新設計による2段階プロセス）

### 進捗ログ

#### 2025年9月1日 - Phase 1完了
- ✅ 見積機能実装計画の策定完了
- ✅ 新しいディレクトリ構成の設計完了
- ✅ タスクの整理・優先度の設定完了
- ✅ 型定義ファイルの作成完了
- ✅ APIサービスファイルの作成完了
- ✅ React Queryフックファイルの作成完了
- ✅ TanStack Query v5対応完了

#### 2025年9月1日 - Phase 2完了
- ✅ 見積一覧ページの実装完了
- ✅ 見積一覧コンポーネントの実装完了
- ✅ 検索・フィルター機能の実装完了
- ✅ ページネーション機能の実装完了
- ✅ レスポンシブ対応完了
- ✅ ディレクトリ構成の整理完了
- 🎯 **次のアクション**: Phase 3（見積詳細機能）開始準備

#### 2025年9月1日 - Phase 3完了
- ✅ 見積詳細ページの実装完了
- ✅ 見積詳細コンポーネント群の実装完了
- ✅ 見積編集機能の実装完了
- ✅ 見積作成機能の実装完了（コンポーネント化対応）
- ✅ 見積削除・複製機能の実装完了
- ✅ toast実装の統一完了
- ✅ パスワードマネージャー誤動作防止対応完了
- 🎯 **次のアクション**: Phase 4（見積詳細機能の拡張）開始準備

#### 2025年9月5日 - Phase 4.5完了
- ✅ 見積内訳・明細の新設計仕様策定完了
- ✅ データベース設計の実装完了（estimate_breakdowns、estimate_items修正）
- ✅ バックエンド実装完了（EstimateBreakdown、EstimateItemモデル、Controller）
- ✅ 金額計算ロジックの実装完了（一式金額対応）
- ✅ データシーダーの実装完了（階層構造の仮データ）
- ✅ APIルートの設定完了
- ✅ 新設計の特徴実装完了（2段階プロセス、テーブル分離）

#### 2025年9月6日 - Phase 5開始準備完了
- ✅ 見積明細の照会機能実装完了（階層表示、金額集計、列位置調整）
- ✅ 見積内訳の照会機能実装完了（タブ切り分け、階層表示、バッジ表示制御）
- ✅ 既存コンポーネントの整理・最適化完了
- ✅ Phase 5実装計画の策定完了

#### 2025年9月6日 - Phase 5.1完了
- ✅ 見積内訳編集フォームコンポーネントの実装完了
- ✅ 見積内訳編集ダイアログの実装完了
- ✅ 見積詳細編集タブへの内訳編集機能統合完了
- ✅ 見積内訳削除機能の実装完了
- ✅ 見積内訳新規追加機能の実装完了
- 🎯 **次のアクション**: Phase 5.2（ダイアログベース編集機能）実装開始

#### 2025年9月6日 - ダイアログベース編集方式への移行決定
- ✅ インライン編集方式からダイアログベース編集方式への移行決定
- ✅ 統合ダイアログ設計の策定完了
- ✅ 見積内訳・明細統合編集ダイアログの仕様策定完了
- 🎯 **次のアクション**: Phase 5.2（ダイアログベース編集機能）実装開始

#### 2025年9月6日 - 見積内訳の金額・予想原価仕様の明確化
- ✅ 見積内訳の金額・予想原価の仕様を設計書に追加完了
- ✅ データベース構造の更新（direct_estimated_cost, calculated_estimated_cost）
- ✅ 開発時の注意点（データ保存・読み込み時の連動処理）を文書化
- ✅ 集計ロジックと表示ロジックの仕様策定完了
- 🎯 **次のアクション**: Phase 5.2.1（基本情報編集ダイアログ）実装開始

#### 2025年9月6日 - Phase 5.2.1完了
- ✅ 基本情報編集ダイアログの実装完了
- ✅ 見積基本情報の編集機能（工事名称、受注先、担当者、工期等）動作確認完了
- ✅ バリデーション機能の動作確認完了
- ✅ データ保存・更新機能の動作確認完了
- ✅ ダイアログベース編集方式の基本実装完了
- 🎯 **次のアクション**: Phase 5.2.2（見積内訳編集ダイアログ）実装開始

#### 2025年9月7日 - 見積内訳・明細2段管理の完全実装完了
- ✅ 見積内訳と見積明細の2段管理仕様書の最新化完了
- ✅ テーブル設計の実装状況反映完了（estimate_breakdowns, estimate_items）
- ✅ 金額計算ロジックの実装状況反映完了（自動集計と直接入力）
- ✅ 予想原価計算ロジックの実装状況反映完了
- ✅ 実装フェーズの完了状況反映完了（全6フェーズ完了）
- ✅ 運用上の考慮事項の実装状況反映完了
- ✅ 実装例の最新化完了（実際のファイル名反映）
- 🎯 **次のアクション**: Phase 5.2.2（見積内訳編集ダイアログ）実装開始

---

## 品質基準

### 機能要件
- [ ] 見積一覧表示
- [ ] 検索・フィルター機能
- [ ] ページネーション
- [ ] CRUD操作
- [ ] 階層構造管理
- [ ] 承認フロー統合
- [ ] 見積書出力
- [ ] レスポンシブ対応

### 非機能要件
- [ ] パフォーマンス（1000件以上のデータでスムーズな表示）
- [ ] アクセシビリティ（WCAG 2.1 AA準拠）
- [ ] セキュリティ（認証・認可の適切な実装）
- [ ] 保守性（コンポーネントの再利用性）

---

## 完了チェックリスト

### Phase 1 完了チェック
- [ ] 見積機能専用ディレクトリ構造の作成完了
- [ ] 型定義ファイルの作成完了
- [ ] APIサービスファイルの作成完了
- [ ] React Queryフックファイルの作成完了
- [ ] 基本的なAPI通信の動作確認

### Phase 2 完了チェック
- [x] 見積一覧ページの実装完了
- [x] 検索機能の動作確認
- [x] フィルター機能の動作確認
- [x] ページネーションの動作確認
- [x] レスポンシブ対応の確認

### Phase 3 完了チェック
- [x] 見積詳細ページの実装完了
- [x] 見積編集機能の動作確認
- [x] 見積作成機能の動作確認
- [x] 見積削除機能の動作確認
- [x] バリデーションの確認

### Phase 4 完了チェック
- [x] 見積詳細機能の拡張実装完了
- [x] データ整合性の確保完了
- [x] UI/UX改善完了

### Phase 4.5 完了チェック
- [x] 見積内訳構造テーブルの実装完了
- [x] 見積明細アイテムテーブルの修正完了
- [x] バックエンド実装完了
- [x] データシーダーの実装完了
- [x] 新設計の特徴実装完了

### 見積内訳・明細2段管理 完了チェック
- [x] テーブル設計の実装完了（estimate_breakdowns, estimate_items）
- [x] 金額計算ロジックの実装完了（自動集計と直接入力）
- [x] 予想原価計算ロジックの実装完了
- [x] 実装フェーズの完了（全6フェーズ完了）
- [x] 運用上の考慮事項の実装完了
- [x] 実装例の最新化完了
- [x] 仕様書の最新化完了

### Phase 5.1 完了チェック
- [x] 見積内訳編集フォームコンポーネントの実装完了
- [x] 見積内訳編集ダイアログの実装完了
- [x] 見積詳細編集タブへの内訳編集機能統合完了
- [x] 見積内訳削除機能の実装完了
- [x] 見積内訳新規追加機能の実装完了

### Phase 5.2 完了チェック（ダイアログベース編集機能）
- [x] 基本情報編集ダイアログの実装完了
- [ ] 見積内訳編集ダイアログの実装完了
- [ ] 見積明細編集ダイアログの実装完了
- [ ] 金額情報編集ダイアログの実装完了
- [ ] 既存インライン編集方式の削除完了
- [ ] 見積内訳の金額・予想原価仕様の実装完了

### Phase 5 完了チェック
- [x] 見積内訳構造管理の実装完了
- [x] 見積明細管理の実装完了
- [x] 新設計対応の機能実装完了
- [ ] 2段階プロセスの動作確認

### Phase 6 完了チェック
- [ ] 見積書プレビューの動作確認
- [ ] PDF出力機能の動作確認

---

## Phase 5.2: ダイアログベース編集機能の実装仕様

### 5.2.1 基本方針
**照会モードを基本とし、必要な部分のみダイアログで編集する方式**

#### 利点
- **段階的編集**: 必要な部分だけを編集できる
- **誤操作防止**: 全体を編集モードにせず、意図した部分のみ編集
- **直感的操作**: 編集したい部分をクリック → ダイアログで編集
- **データ整合性**: 編集した部分のみ保存、他の部分は影響なし
- **並行編集対応**: 複数ユーザーが異なる部分を同時編集可能

### 5.2.2 編集ダイアログの種類

#### 5.2.2.1 基本情報編集ダイアログ ✅ 完了
```
【基本情報編集ダイアログ】
┌─────────────────────────────────────┐
│ 基本情報編集                        │
├─────────────────────────────────────┤
│ 見積番号: [EST-2024-001        ]    │
│ 工事名称: [〇〇ビル新築工事     ]    │
│ 受注先:   [株式会社ABC ▼       ]    │
│ 担当者:   [田中太郎 ▼          ]    │
│ 工期:     [2024/04/01] 〜 [2024/12/31] │
│ 工事種別: [新築工事 ▼          ]    │
│ 備考:     [                    ]    │
│          [                    ]    │
├─────────────────────────────────────┤
│              [キャンセル] [保存]    │
└─────────────────────────────────────┘
```

#### 5.2.2.2 見積内訳編集ダイアログ（次の実装対象）
```
【見積内訳編集ダイアログ】
┌─────────────────────────────────────────────────────────┐
│ 見積内訳編集                                            │
├─────────────────────────────────────────────────────────┤
│ [大内訳] [中内訳] [小内訳]                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 大内訳一覧:                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │工法│工事分類│摘要│数量│単価│金額│発注先│予想原価│操作│ │
│ ├─────────────────────────────────────────────────────┤ │
│ │基礎│基礎工事│基礎工事│1│3,000,000│3,000,000│A社│2,700,000│[▼][編集][削除]│ │
│ │ │ │ ├─中内訳1│ │ │ │ │ │ │ │ │ │
│ │ │ │ ├─中内訳2│ │ │ │ │ │ │ │ │ │
│ │ │ │ └─小内訳1│ │ │ │ │ │ │ │ │ │
│ │躯体│躯体工事│躯体工事│1│5,000,000│5,000,000│B社│4,500,000│[▼][編集][削除]│ │
│ └─────────────────────────────────────────────────────┘ │
│ [新規内訳追加] [内訳を上に] [内訳を下に] [階層を上げる] [階層を下げる] │
├─────────────────────────────────────────────────────────┤
│                    [キャンセル] [保存]                  │
└─────────────────────────────────────────────────────────┘
```

#### 5.2.2.3 見積明細編集ダイアログ
```
【見積明細編集ダイアログ】
┌─────────────────────────────────────────────────────────┐
│ 見積明細編集                                            │
├─────────────────────────────────────────────────────────┤
│ 明細一覧:                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │工法│工事分類│摘要│数量│単価│金額│発注先│予想原価│操作│ │
│ ├─────────────────────────────────────────────────────┤ │
│ │基礎│コンクリート│打設│100│30,000│3,000,000│A社│2,700,000│[編集][削除]│ │
│ │基礎│鉄筋    │配筋│50 │80,000│4,000,000│B社│3,600,000│[編集][削除]│ │
│ └─────────────────────────────────────────────────────┘ │
│ [明細追加] [一括編集] [CSV取込] [内訳に移動]           │
├─────────────────────────────────────────────────────────┤
│                    [キャンセル] [保存]                  │
└─────────────────────────────────────────────────────────┘
```

#### 5.2.2.4 金額情報編集ダイアログ
```
【金額情報編集ダイアログ】
┌─────────────────────────────────────┐
│ 金額情報編集                        │
├─────────────────────────────────────┤
│ 税抜見積金額: [¥10,000,000     ]    │
│ 消費税率:     [10% ▼           ]    │
│ 消費税額:     [¥1,100,000      ]    │
│ 割引額:       [¥0              ]    │
│ 合計金額:     [¥11,100,000     ]    │
│                                     │
├─────────────────────────────────────┤
│              [キャンセル] [保存]    │
└─────────────────────────────────────┘
```

### 5.2.3 見積内訳の項目設計

#### 内訳行の項目構成
```
見積内訳行の項目:
├── 工法 (内訳の工法分類)
├── 工事分類 (内訳の工事分類)
├── 摘要 (内訳の名称・説明)
├── 数量 (内訳の数量)
├── 単価 (内訳の単価)
├── 金額 (数量 × 単価 または 子要素の合計)
├── 発注先 (内訳の発注先)
├── 予想原価 (内訳の予想原価)
└── 備考 (内訳の備考)
```

#### 内訳と明細の項目対応
| 項目 | 内訳 | 明細 | 説明 |
|------|------|------|------|
| 工法 | ✅ | ✅ | 工法分類 |
| 工事分類 | ✅ | ✅ | 工事分類 |
| 摘要 | ✅ | ✅ | 名称・説明 |
| 数量 | ✅ | ✅ | 数量 |
| 単価 | ✅ | ✅ | 単価 |
| 金額 | ✅ | ✅ | 計算金額 |
| 発注先 | ✅ | ✅ | 発注先 |
| 予想原価 | ✅ | ✅ | 予想原価 |
| 備考 | ✅ | ✅ | 備考 |

### 5.2.4 操作機能の詳細

#### 内訳の追加・削除
- **新規内訳追加**: 大内訳・中内訳・小内訳の追加
- **内訳削除**: 選択した内訳とその子要素を削除
- **階層変更**: 内訳の階層レベルを上げる/下げる
- **順序変更**: 内訳の表示順序を変更

#### 明細の追加・削除
- **明細追加**: 選択した内訳に明細を追加
- **明細削除**: 選択した明細を削除
- **明細移動**: 明細を別の内訳に移動
- **一括編集**: 複数の明細を一括で編集

#### 統合操作
- **内訳から明細へ**: 内訳を明細に変換
- **明細から内訳へ**: 明細を内訳に変換
- **CSV取込**: CSVファイルから明細を一括取込
- **一括保存**: 内訳・明細を一括で保存

### 5.2.5 保存・更新フロー

#### 部分保存方式
1. **ダイアログで編集** → 該当部分のみ保存
2. **保存完了** → ダイアログ閉じる
3. **詳細ページ更新** → 最新状態を反映
4. **キャッシュ無効化** → React Queryで最新データ取得

#### エラーハンドリング
- **保存失敗時**: ダイアログ内でエラー表示、詳細ページは変更なし
- **ネットワークエラー**: リトライ機能付き
- **バリデーションエラー**: リアルタイム検証

### 5.2.6 実装優先順位

#### Phase 5.2.1: 基本情報編集ダイアログ
- **対象**: 見積基本情報（工事名称、受注先、担当者、工期等）
- **特徴**: 最もシンプル、バリデーション少ない
- **実装**: フォーム + バリデーション + 保存API

#### Phase 5.2.2: 金額情報編集ダイアログ
- **対象**: 見積金額、消費税、各種費率
- **特徴**: 計算ロジック含む、自動計算機能
- **実装**: 計算式 + リアルタイム更新 + 保存API

#### Phase 5.2.3: 見積内訳・明細統合編集ダイアログ
- **対象**: 大内訳・中内訳・小内訳の階層構造 + 明細項目
- **特徴**: 階層構造対応、ドラッグ&ドロップ、統合管理
- **実装**: ツリー表示 + 階層操作 + 一括保存API

### 5.2.7 技術実装詳細

#### 共通ダイアログ基盤
```typescript
interface BaseEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  title: string
  children: React.ReactNode
}

// 共通ダイアログコンポーネント
export function BaseEditDialog({ isOpen, onClose, onSave, title, children }: BaseEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={onSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### 統合状態管理
```typescript
// 統合ダイアログコンポーネント
export function EstimateBreakdownsAndItemsEditDialog({ 
  estimate, 
  isOpen, 
  onClose 
}: Props) {
  const [activeTab, setActiveTab] = useState<'breakdowns' | 'items'>('breakdowns')
  
  // 統合状態管理
  const [breakdowns, setBreakdowns] = useState<EstimateBreakdownTree[]>([])
  const [items, setItems] = useState<EstimateItem[]>([])
  
  // 一括保存
  const handleSave = async () => {
    await updateEstimateBreakdownsAndItems.mutateAsync({
      estimateId: estimate.id,
      breakdowns: breakdowns,
      items: items
    })
    onClose()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>見積内訳・明細編集</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="breakdowns">見積内訳</TabsTrigger>
            <TabsTrigger value="items">見積明細</TabsTrigger>
          </TabsList>
          
          <TabsContent value="breakdowns">
            <EstimateBreakdownsEditTab 
              breakdowns={breakdowns}
              onBreakdownsChange={setBreakdowns}
              items={items}
              onItemsChange={setItems}
            />
          </TabsContent>
          
          <TabsContent value="items">
            <EstimateItemsEditTab 
              items={items}
              onItemsChange={setItems}
              breakdowns={breakdowns}
              onBreakdownsChange={setBreakdowns}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### 楽観的更新
```typescript
// 保存後の楽観的更新
const updateEstimateMutation = useMutation({
  mutationFn: updateEstimate,
  onSuccess: () => {
    // キャッシュを無効化して最新データを取得
    queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
    
    // 成功通知
    addToast({
      title: "保存完了",
      description: "見積情報が正常に保存されました。",
      type: "success"
    })
  },
  onError: (error) => {
    // エラー通知
    addToast({
      title: "保存失敗",
      description: "保存中にエラーが発生しました。",
      type: "error"
    })
  }
})
```

### 5.2.8 実装完了条件
- [x] 基本情報編集ダイアログの実装完了
- [ ] 見積内訳編集ダイアログの実装完了
- [ ] 見積明細編集ダイアログの実装完了
- [ ] 金額情報編集ダイアログの実装完了
- [ ] 既存インライン編集方式の削除完了
- [ ] エラーハンドリングの実装完了
- [ ] バリデーション機能の実装完了
- [ ] 楽観的更新の実装完了
- [ ] Excel出力機能の動作確認
- [ ] 印刷機能の動作確認

### Phase 7 完了チェック
- [ ] 承認依頼作成の動作確認
- [ ] 承認依頼一覧の動作確認
- [ ] 承認アクションの動作確認
- [ ] 承認履歴表示の確認

### Phase 8 完了チェック
- [ ] パフォーマンス最適化の確認
- [ ] エラーハンドリングの確認
- [ ] アクセシビリティの確認
- [ ] テストの実行確認
- [ ] ドキュメントの完成確認

---

**最終更新日**: 2025年9月7日  
**更新者**: 開発チーム  
**次回更新予定**: 2025年9月8日（Phase 5.2.2完了時）
