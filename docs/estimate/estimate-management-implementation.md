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

## 実装計画（改訂版）

### Phase 1: 基盤構築（3-4日）
**目標**: 見積管理機能の基本構造とAPI連携の確立

#### 1.1 ディレクトリ構造の作成
- [ ] 見積機能専用ディレクトリ構造の作成
- [ ] 型定義ファイルの作成
- [ ] APIサービスファイルの作成
- [ ] React Queryフックファイルの作成

#### 1.2 基本型定義の実装
- [ ] `types/features/estimates/estimate.ts` - 見積基本情報型
- [ ] `types/features/estimates/estimateItem.ts` - 見積明細型
- [ ] `types/features/estimates/partner.ts` - 取引先型
- [ ] `types/features/estimates/projectType.ts` - プロジェクトタイプ型
- [ ] `types/features/estimates/constructionClassification.ts` - 工事分類型

#### 1.3 APIサービスの実装
- [ ] `services/features/estimates/estimateService.ts` - 見積基本情報API
- [ ] `services/features/estimates/estimateItemService.ts` - 見積明細API
- [ ] `services/features/estimates/partnerService.ts` - 取引先API
- [ ] `services/features/estimates/projectTypeService.ts` - プロジェクトタイプAPI
- [ ] `services/features/estimates/constructionClassificationService.ts` - 工事分類API

#### 1.4 React Queryフックの実装
- [ ] `hooks/features/estimates/useEstimates.ts` - 見積一覧・CRUD
- [ ] `hooks/features/estimates/useEstimateItems.ts` - 見積明細CRUD
- [ ] `hooks/features/estimates/usePartners.ts` - 取引先管理
- [ ] `hooks/features/estimates/useProjectTypes.ts` - プロジェクトタイプ
- [ ] `hooks/features/estimates/useConstructionClassifications.ts` - 工事分類

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
- [x] `components/features/estimates/EstimateDetail/EstimateDetailView.tsx` - 照会モード
- [x] `components/features/estimates/EstimateDetail/EstimateDetailEdit.tsx` - 編集モード
- [x] `components/features/estimates/EstimateDetail/EstimateInfoCard.tsx` - 基本情報カード
- [x] `components/features/estimates/EstimateDetail/EstimatePartnerCard.tsx` - 取引先情報カード
- [x] `components/features/estimates/EstimateDetail/EstimateItemsCard.tsx` - 見積明細カード（プレースホルダー）
- [x] `components/features/estimates/EstimateDetail/EstimateAmountCard.tsx` - 金額情報カード
- [x] `components/features/estimates/EstimateDetail/EstimateMetaCard.tsx` - メタ情報カード

#### 3.3 見積作成機能の実装
- [x] `app/(features)/estimates/create/page.tsx` - 見積作成ページ
- [x] `components/features/estimates/EstimateCreate/EstimateCreateForm.tsx` - 作成フォームコンポーネント

**Phase 3 完了条件**: 見積詳細の照会・編集・作成・削除が正常に動作すること

---

### Phase 4: 見積明細管理機能（3-4日）
**目標**: 見積明細の階層構造管理、ドラッグ&ドロップ機能

#### 4.1 見積明細コンポーネントの実装
- [ ] `components/features/estimates/EstimateItems/EstimateItemTree.tsx` - 階層構造表示
- [ ] `components/features/estimates/EstimateItems/EstimateItemForm.tsx` - 明細フォーム
- [ ] `components/features/estimates/EstimateItems/EstimateItemRow.tsx` - 明細行

#### 4.2 機能実装
- [ ] 階層構造表示・編集UI
- [ ] ドラッグ&ドロップ機能
- [ ] 展開・折りたたみ機能
- [ ] 金額自動計算機能
- [ ] 見積明細CRUD機能

**Phase 4 完了条件**: 見積明細の階層構造管理が正常に動作すること

---

### Phase 5: 見積書出力機能（2-3日）
**目標**: 見積書のプレビュー、PDF出力、Excel出力

#### 5.1 見積書出力コンポーネントの実装
- [ ] `components/features/estimates/EstimateOutput/EstimatePreview.tsx` - プレビュー
- [ ] `components/features/estimates/EstimateOutput/EstimatePDF.tsx` - PDF出力
- [ ] `components/features/estimates/EstimateOutput/EstimateExcel.tsx` - Excel出力

#### 5.2 出力ページの実装
- [ ] `app/(features)/estimates/[id]/print/page.tsx` - 印刷ページ

#### 5.3 機能実装
- [ ] 見積書プレビュー画面
- [ ] PDF出力機能
- [ ] Excel出力機能
- [ ] 印刷機能

**Phase 5 完了条件**: 見積書の出力機能が正常に動作すること

---

### Phase 6: 承認フロー統合（2-3日）
**目標**: 見積承認フローとの統合

#### 6.1 承認機能の実装
- [ ] 見積承認依頼作成
- [ ] 見積承認依頼一覧
- [ ] 見積承認アクション
- [ ] 承認履歴表示
- [ ] 承認コメント機能

**Phase 6 完了条件**: 見積承認フローが正常に動作すること

---

### Phase 7: 最適化・テスト（2-3日）
**目標**: パフォーマンス最適化、テスト、ドキュメント

#### 7.1 最適化・テスト項目
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング
- [ ] アクセシビリティ対応
- [ ] テスト実装
- [ ] ドキュメント作成

**Phase 7 完了条件**: 本番環境での運用に耐える品質であること

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
- **現在のPhase**: Phase 3（見積詳細機能）完了
- **完了率**: Phase 1: 100%, Phase 2: 100%, Phase 3: 100%

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
- 🎯 **次のアクション**: Phase 4（見積明細管理機能）開始準備

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
- [ ] 見積明細階層構造の実装完了
- [ ] ドラッグ&ドロップ機能の動作確認
- [ ] 金額自動計算の動作確認
- [ ] 見積明細CRUDの動作確認

### Phase 5 完了チェック
- [ ] 見積書プレビューの動作確認
- [ ] PDF出力機能の動作確認
- [ ] Excel出力機能の動作確認
- [ ] 印刷機能の動作確認

### Phase 6 完了チェック
- [ ] 承認依頼作成の動作確認
- [ ] 承認依頼一覧の動作確認
- [ ] 承認アクションの動作確認
- [ ] 承認履歴表示の確認

### Phase 7 完了チェック
- [ ] パフォーマンス最適化の確認
- [ ] エラーハンドリングの確認
- [ ] アクセシビリティの確認
- [ ] テストの実行確認
- [ ] ドキュメントの完成確認

---

**最終更新日**: 2025年9月1日  
**更新者**: 開発チーム  
**次回更新予定**: 2025年9月2日（Phase 4開始時）
