# 見積明細編集画面機能 仕様書

## 概要
見積明細の編集画面機能に関する詳細な仕様書です。
Excelで作成した見積データをインポートし、Web画面上で修正・保存する運用を想定した機能を定義します。

## 1. 機能要件

### 1.1 見積基本情報
- **実装状況**: 登録更新の画面機能は実装済み
- **フロー**: 見積基本情報を登録後、詳細ページから明細の入力フローへ進む

### 1.2 内訳構造（3階層）
大内訳 → 中内訳 → 小内訳 の階層構造を保持する。

#### 1.2.1 小内訳の金額算出モード

**集計モード**:
- 子明細または子内訳の合計金額を自動集計
- 単位は代表単位（全明細が同じ場合のみ表示）
- 単位が混在する場合は空欄＋「単位混在」表示
- 必要に応じて係数（factor）を設定可能

**一式モード**:
- 数量=1、単位=「式」を既定値として編集可能
- 金額は直接入力
- 子明細は根拠情報として保持するが集計には反映しない

### 1.3 明細行
**項目**: 工法、工事分類、摘要、数量、単位、単価、金額、発注先、予想原価

**金額計算**: 金額は数量×単価で自動算出

**所属関係**: 明細は必ず小内訳に所属する。明細作成時、未設定小内訳が自動生成される。

### 1.4 Excelインポート

#### 1.4.1 インポート形式
**階層列方式**: 大・中・小内訳を列で持たせる。空欄は直前行の値を継承。

**区分タグ方式**: 区分（大内訳/中内訳/小内訳/明細）列を持たせる。

#### 1.4.2 インポート処理
- インポート後、未設定小内訳が自動生成される場合がある
- インポートデータは一度仮置きテーブル（estimate_import_drafts）に保存
- ユーザーはWeb画面で修正を行い、「保存」ボタン押下で本テーブルに移行
- キャンセル時は仮データを削除
- 誤取込時のために「インポートやり直し」機能を提供

### 1.5 仮保存と確定保存
- インポートデータは一度仮置きテーブル（estimate_import_drafts）に保存
- ユーザーはWeb画面で修正を行い、「保存」ボタン押下で本テーブル（estimate_breakdowns / estimate_items）に移行
- キャンセル時は仮データを削除
- 誤取込時のために「インポートやり直し」機能を提供

## 2. UI要件

### 2.1 ページ構成
1ページで完結するレイアウト：

- **上部**: 見積基本情報（ヘッダフォーム）
- **中央**: アウトラインテーブル（Excelライクな操作）
- **右サイド**: 詳細編集パネル（必要時のみ表示）
- **下部**: 小計・消費税・合計（税込）と保存ボタン

### 2.2 アウトラインテーブル
**Excelライクな操作**:
- 矢印キー・Tab移動・セルインライン編集
- 行追加／削除／ドラッグ＆ドロップによる階層移動
- 小内訳・明細の編集内容はリアルタイムに合計へ反映
- 編集内容は保存ボタン押下時に本保存

### 2.3 サイドパネル
**機能**:
- 選択行の詳細項目を表示
- 摘要（長文）、発注依頼内容、備考、発注先選択など
- 普段は閉じていてもよい

### 2.4 保存
**処理フロー**:
- 編集内容は一時的に仮置きテーブルに反映
- 「保存」押下で本テーブルに確定保存
- 保存前にブラウザを閉じると未保存データは消える旨を通知

## 3. データ要件（追加・変更点）

### 3.1 estimate_breakdowns テーブル拡張
```sql
-- 追加フィールド
ALTER TABLE estimate_breakdowns ADD COLUMN amount_mode VARCHAR(20) DEFAULT 'sum'; -- 'sum' | 'lumpsum'
ALTER TABLE estimate_breakdowns ADD COLUMN display_unit TEXT; -- 表示用単位
ALTER TABLE estimate_breakdowns ADD COLUMN display_qty NUMERIC; -- 表示用数量、一式用
ALTER TABLE estimate_breakdowns ADD COLUMN factor NUMERIC DEFAULT 1.0; -- 集計用係数
```

### 3.2 estimate_import_drafts テーブル（新規）
```sql
CREATE TABLE estimate_import_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    import_type VARCHAR(20) NOT NULL, -- 'hierarchy' | 'category'
    raw_data JSONB NOT NULL, -- インポート元データ
    processed_data JSONB, -- 処理済みデータ
    status VARCHAR(20) DEFAULT 'draft', -- 'draft' | 'processing' | 'completed' | 'cancelled'
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- インデックス
CREATE INDEX idx_estimate_import_drafts_estimate_id ON estimate_import_drafts(estimate_id);
CREATE INDEX idx_estimate_import_drafts_status ON estimate_import_drafts(status);
```

## 4. バリデーション要件

### 4.1 集計モード
- 数量・単位は編集不可
- 係数は >0 の数値
- 単位混在は「混在」マークで警告

### 4.2 一式モード
- 数量≥0、金額≥0
- 単位は「式」固定（編集可能）

### 4.3 明細行
- 数量≥0、単価≥0
- 金額は数量×単価で自動計算
- 必須項目：品名、数量、単価

## 5. 技術実装仕様

### 5.1 フロントエンド技術スタック

#### 5.1.1 基本技術
- **Next.js 15.5.0** - Reactフレームワーク（App Router使用）
- **React 19.1.0** - UIライブラリ
- **TypeScript 5** - 型安全な開発（strict mode）

#### 5.1.2 UI・スタイリング
- **TanStack Table v8** - 高性能データテーブル
  - @tanstack/react-table - コアテーブル機能
  - @tanstack/react-virtual - 仮想化スクロール
- **Shadcn/ui** - モダンUIコンポーネントライブラリ
- **Tailwind CSS v4** - ユーティリティファーストCSS

#### 5.1.3 状態管理
- **TanStack Query v5** - サーバー状態管理
- **Redux Toolkit v2.8.2** - グローバル状態管理
- **React Hook Form v7.62.0** - フォーム管理

#### 5.1.4 ファイル処理
- **React Dropzone v14.3.8** - ファイルアップロード
- **ExcelJS v4.4.0** - Excelファイル操作

### 5.2 新規ライブラリ検討

#### 5.2.1 アウトラインテーブル実装
**検討ライブラリ**:
1. **@tanstack/react-table** (既存) - 基本テーブル機能
2. **react-beautiful-dnd** - ドラッグ&ドロップ機能
3. **react-window** - 仮想化スクロール（大量データ対応）

**推奨構成**:
```typescript
// アウトラインテーブル実装
import { useReactTable, getCoreRowModel, getExpandedRowModel } from '@tanstack/react-table'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { FixedSizeList as List } from 'react-window'

// 階層構造対応テーブル
const OutlineTable = () => {
  const table = useReactTable({
    data: hierarchicalData,
    columns: outlineColumns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: row => row.children,
  })
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="outline-table">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <List
              height={600}
              itemCount={table.getRowModel().rows.length}
              itemSize={50}
              itemData={table.getRowModel().rows}
            >
              {RowRenderer}
            </List>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
```

#### 5.2.2 Excelインポート機能
**検討ライブラリ**:
1. **ExcelJS** (既存) - Excelファイル読み込み
2. **papaparse** - CSVファイル処理
3. **react-dropzone** (既存) - ファイルアップロード

**実装例**:
```typescript
// Excelインポート処理
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

const ExcelImportHandler = {
  // Excelファイル処理
  async processExcelFile(file: File): Promise<ImportData> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(file)
    
    const worksheet = workbook.getWorksheet(1)
    const data = []
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // ヘッダー行をスキップ
      
      const rowData = {
        large_category: row.getCell(1).value,
        medium_category: row.getCell(2).value,
        small_category: row.getCell(3).value,
        item_name: row.getCell(4).value,
        quantity: row.getCell(5).value,
        unit: row.getCell(6).value,
        unit_price: row.getCell(7).value,
        amount: row.getCell(8).value,
      }
      data.push(rowData)
    })
    
    return this.processHierarchicalData(data)
  },
  
  // CSVファイル処理
  async processCsvFile(file: File): Promise<ImportData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          resolve(this.processHierarchicalData(results.data))
        },
        error: reject
      })
    })
  },
  
  // 階層データ処理
  processHierarchicalData(data: any[]): ImportData {
    // 階層構造の構築ロジック
    const breakdowns = []
    const items = []
    
    // 実装詳細...
    
    return { breakdowns, items }
  }
}
```

#### 5.2.3 インライン編集機能
**検討ライブラリ**:
1. **react-edit-inline** - インライン編集
2. **react-contenteditable** - コンテンツ編集可能
3. **カスタム実装** - 既存のInputコンポーネント活用

**推奨**: カスタム実装（既存のShadcn/ui Inputコンポーネントを活用）

```typescript
// インライン編集コンポーネント
const InlineEditor = ({ value, onChange, type = 'text' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  
  const handleSave = () => {
    onChange(editValue)
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }
  
  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') handleCancel()
        }}
        autoFocus
      />
    )
  }
  
  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-gray-50 p-1 rounded"
    >
      {value}
    </div>
  )
}
```

### 5.3 コンポーネント設計

#### 5.3.1 メインコンポーネント構成
```typescript
// 見積明細編集画面のメインコンポーネント
components/
├── estimate-detail-editor/
│   ├── EstimateDetailEditor.tsx          # メインコンポーネント
│   ├── EstimateHeader.tsx                # 見積基本情報ヘッダー
│   ├── OutlineTable/
│   │   ├── index.tsx                     # アウトラインテーブル
│   │   ├── OutlineTableRow.tsx           # テーブル行コンポーネント
│   │   ├── InlineEditor.tsx              # インライン編集
│   │   ├── DragHandle.tsx                # ドラッグハンドル
│   │   └── RowActions.tsx                # 行操作ボタン
│   ├── DetailPanel/
│   │   ├── index.tsx                     # 詳細編集パネル
│   │   ├── BreakdownDetailForm.tsx       # 内訳詳細フォーム
│   │   └── ItemDetailForm.tsx            # 明細詳細フォーム
│   ├── ImportDialog/
│   │   ├── index.tsx                     # インポートダイアログ
│   │   ├── FileUpload.tsx                # ファイルアップロード
│   │   ├── PreviewTable.tsx              # プレビューテーブル
│   │   └── ImportOptions.tsx             # インポートオプション
│   ├── SummaryPanel/
│   │   ├── index.tsx                     # 合計パネル
│   │   ├── AmountSummary.tsx             # 金額サマリー
│   │   └── TaxCalculation.tsx            # 消費税計算
│   └── hooks/
│       ├── useOutlineTable.ts            # アウトラインテーブルフック
│       ├── useImportData.ts              # インポートデータフック
│       ├── useInlineEdit.ts              # インライン編集フック
│       └── useDragAndDrop.ts             # ドラッグ&ドロップフック
```

#### 5.3.2 状態管理設計
```typescript
// 見積明細編集の状態管理
interface EstimateDetailEditorState {
  // 基本データ
  estimate: Estimate | null
  breakdowns: EstimateBreakdown[]
  items: EstimateItem[]
  importDraft: EstimateImportDraft | null
  
  // UI状態
  selectedRowId: string | null
  expandedRows: string[]
  isDetailPanelOpen: boolean
  isImportDialogOpen: boolean
  
  // 編集状態
  editingCells: Record<string, any>
  hasUnsavedChanges: boolean
  
  // インポート状態
  importStatus: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  importPreview: ImportPreviewData | null
}

// Redux Slice
const estimateDetailEditorSlice = createSlice({
  name: 'estimateDetailEditor',
  initialState,
  reducers: {
    // データ管理
    setEstimate: (state, action) => {
      state.estimate = action.payload
    },
    setBreakdowns: (state, action) => {
      state.breakdowns = action.payload
    },
    setItems: (state, action) => {
      state.items = action.payload
    },
    
    // UI状態管理
    setSelectedRow: (state, action) => {
      state.selectedRowId = action.payload
    },
    toggleRowExpansion: (state, action) => {
      const rowId = action.payload
      const index = state.expandedRows.indexOf(rowId)
      if (index === -1) {
        state.expandedRows.push(rowId)
      } else {
        state.expandedRows.splice(index, 1)
      }
    },
    setDetailPanelOpen: (state, action) => {
      state.isDetailPanelOpen = action.payload
    },
    
    // 編集状態管理
    startCellEdit: (state, action) => {
      const { cellId, value } = action.payload
      state.editingCells[cellId] = value
      state.hasUnsavedChanges = true
    },
    updateCellEdit: (state, action) => {
      const { cellId, value } = action.payload
      state.editingCells[cellId] = value
    },
    finishCellEdit: (state, action) => {
      const { cellId } = action.payload
      delete state.editingCells[cellId]
    },
    
    // インポート管理
    setImportStatus: (state, action) => {
      state.importStatus = action.payload
    },
    setImportPreview: (state, action) => {
      state.importPreview = action.payload
    },
  }
})
```

### 5.4 API設計

#### 5.4.1 見積明細編集API
```typescript
// 見積明細編集関連API
interface EstimateDetailEditorAPI {
  // データ取得
  getEstimateWithDetails(estimateId: string): Promise<EstimateWithDetails>
  
  // 内訳管理
  createBreakdown(estimateId: string, data: CreateBreakdownRequest): Promise<EstimateBreakdown>
  updateBreakdown(breakdownId: string, data: UpdateBreakdownRequest): Promise<EstimateBreakdown>
  deleteBreakdown(breakdownId: string): Promise<void>
  moveBreakdown(breakdownId: string, newParentId: string | null): Promise<void>
  
  // 明細管理
  createItem(estimateId: string, data: CreateItemRequest): Promise<EstimateItem>
  updateItem(itemId: string, data: UpdateItemRequest): Promise<EstimateItem>
  deleteItem(itemId: string): Promise<void>
  moveItem(itemId: string, newBreakdownId: string): Promise<void>
  
  // インポート管理
  uploadImportFile(estimateId: string, file: File): Promise<ImportUploadResponse>
  processImportData(estimateId: string, options: ImportOptions): Promise<ImportProcessResponse>
  applyImportData(estimateId: string, draftId: string): Promise<void>
  cancelImportData(estimateId: string, draftId: string): Promise<void>
  
  // 一括操作
  bulkUpdateBreakdowns(estimateId: string, updates: BulkUpdateRequest[]): Promise<void>
  bulkUpdateItems(estimateId: string, updates: BulkUpdateRequest[]): Promise<void>
  recalculateAmounts(estimateId: string): Promise<AmountCalculationResult>
}
```

#### 5.4.2 APIエンドポイント
```php
// 見積明細編集API
GET    /api/v1/estimates/{id}/details                    # 見積詳細データ取得
POST   /api/v1/estimates/{id}/breakdowns                 # 内訳作成
PUT    /api/v1/estimates/{id}/breakdowns/{breakdown_id}  # 内訳更新
DELETE /api/v1/estimates/{id}/breakdowns/{breakdown_id}  # 内訳削除
POST   /api/v1/estimates/{id}/breakdowns/{breakdown_id}/move # 内訳移動

POST   /api/v1/estimates/{id}/items                      # 明細作成
PUT    /api/v1/estimates/{id}/items/{item_id}            # 明細更新
DELETE /api/v1/estimates/{id}/items/{item_id}            # 明細削除
POST   /api/v1/estimates/{id}/items/{item_id}/move       # 明細移動

// インポート関連API
POST   /api/v1/estimates/{id}/import/upload              # ファイルアップロード
POST   /api/v1/estimates/{id}/import/process             # インポート処理
POST   /api/v1/estimates/{id}/import/apply               # インポート適用
POST   /api/v1/estimates/{id}/import/cancel              # インポートキャンセル

// 一括操作API
POST   /api/v1/estimates/{id}/bulk-update                # 一括更新
POST   /api/v1/estimates/{id}/recalculate                # 金額再計算
```

### 5.5 パフォーマンス最適化

#### 5.5.1 仮想化スクロール
```typescript
// 大量データ対応の仮想化スクロール
import { FixedSizeList as List } from 'react-window'

const VirtualizedOutlineTable = ({ data }) => {
  const RowRenderer = ({ index, style }) => {
    const row = data[index]
    return (
      <div style={style}>
        <OutlineTableRow row={row} />
      </div>
    )
  }
  
  return (
    <List
      height={600}
      itemCount={data.length}
      itemSize={50}
      itemData={data}
    >
      {RowRenderer}
    </List>
  )
}
```

#### 5.5.2 デバウンス処理
```typescript
// インライン編集のデバウンス処理
import { useDebouncedCallback } from 'use-debounce'

const useInlineEdit = (onSave: (value: any) => void) => {
  const [value, setValue] = useState('')
  
  const debouncedSave = useDebouncedCallback(
    (newValue) => {
      onSave(newValue)
    },
    500
  )
  
  const handleChange = (newValue: string) => {
    setValue(newValue)
    debouncedSave(newValue)
  }
  
  return { value, handleChange }
}
```

#### 5.5.3 メモ化
```typescript
// コンポーネントのメモ化
const OutlineTableRow = memo(({ row, onEdit, onDelete }) => {
  return (
    <div className="outline-table-row">
      {/* 行の内容 */}
    </div>
  )
})

// 計算結果のメモ化
const useCalculatedAmounts = (breakdowns: EstimateBreakdown[]) => {
  return useMemo(() => {
    return breakdowns.reduce((acc, breakdown) => {
      acc.total += breakdown.calculated_amount || breakdown.direct_amount
      return acc
    }, { total: 0 })
  }, [breakdowns])
}
```

## 6. 実装優先順位

### 6.1 Phase 1: 基本機能（2週間）
1. **アウトラインテーブル基本実装**
   - TanStack Table + 階層構造表示
   - 基本的な行操作（追加・削除・編集）
   - インライン編集機能

2. **詳細編集パネル**
   - 選択行の詳細表示
   - フォームベースの編集
   - リアルタイム保存

### 6.2 Phase 2: 高度な機能（2週間）
1. **ドラッグ&ドロップ**
   - react-beautiful-dnd実装
   - 階層移動機能
   - 順序変更機能

2. **Excelインポート**
   - ファイルアップロード
   - データ解析・プレビュー
   - インポート適用

### 6.3 Phase 3: 最適化（1週間）
1. **パフォーマンス最適化**
   - 仮想化スクロール
   - メモ化
   - デバウンス処理

2. **UX改善**
   - キーボードショートカット
   - アニメーション
   - エラーハンドリング

## 7. 技術的課題と解決策

### 7.1 課題1: 大量データのパフォーマンス
**問題**: 数千行の明細データでの表示・編集パフォーマンス

**解決策**:
- react-windowによる仮想化スクロール
- TanStack Tableの仮想化機能活用
- ページネーションまたは無限スクロール

### 7.2 課題2: 複雑な階層構造の管理
**問題**: 3階層の内訳構造の効率的な管理

**解決策**:
- フラット化されたデータ構造での管理
- 階層情報をメタデータとして保持
- 表示時に階層構造を再構築

### 7.3 課題3: リアルタイム金額計算
**問題**: 編集時のリアルタイム金額計算とパフォーマンス

**解決策**:
- デバウンス処理による計算頻度制御
- Web Workerによるバックグラウンド計算
- 楽観的更新によるUX向上

### 7.4 課題4: Excelインポートの複雑性
**問題**: 様々なExcel形式への対応

**解決策**:
- ExcelJSによる柔軟なExcel解析
- ユーザーによる列マッピング設定
- プレビュー機能による確認

## 8. テスト戦略

### 8.1 単体テスト
- コンポーネントの単体テスト
- カスタムフックのテスト
- ユーティリティ関数のテスト

### 8.2 統合テスト
- API連携のテスト
- データフローのテスト
- エラーハンドリングのテスト

### 8.3 E2Eテスト
- ユーザー操作フローのテスト
- Excelインポート機能のテスト
- パフォーマンステスト

## 9. セキュリティ考慮事項

### 9.1 ファイルアップロード
- ファイル形式の検証
- ファイルサイズ制限
- マルウェアスキャン

### 9.2 データ検証
- 入力値のサニタイゼーション
- SQLインジェクション対策
- XSS対策

### 9.3 権限管理
- 見積編集権限の確認
- データアクセス制御
- 監査ログの記録

## 10. 今後の拡張性

### 10.1 機能拡張
- テンプレート機能
- バージョン管理
- コメント機能

### 10.2 技術拡張
- リアルタイム協業編集
- オフライン対応
- モバイル対応

---

**最終更新日**: 2025年1月27日  
**更新者**: 開発チーム  
**実装状況**: 設計完了、実装準備中
