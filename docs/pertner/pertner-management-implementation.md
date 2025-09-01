# 取引先管理機能 実装タスク管理

## プロジェクト概要
- **プロジェクト名**: BuildSuite 取引先管理機能
- **実装期間**: 約5-7日
- **技術スタック**: Next.js 14 + TanStack Table + Shadcn/ui + Laravel API
- **担当者**: 開発チーム

## 実装計画

### Phase 1: バックエンド基盤構築（1-2日）
**目標**: 基本的な取引先管理APIの動作確認

#### 1.1 依存関係の確認
- [x] Partnerモデルの作成完了
- [x] マイグレーションファイルの実行完了
- [x] PartnerControllerの作成完了

#### 1.2 基本ファイル構造の作成
- [x] `app/Models/Partner.php` - 取引先モデル
- [x] `app/Http/Controllers/PartnerController.php` - 取引先APIコントローラー
- [x] `routes/api.php` - APIルートの追加
- [ ] `app/Http/Requests/PartnerRequest.php` - バリデーションリクエスト

#### 1.3 実装順序
1. [x] Partnerモデル（リレーション、スコープ、アクセサ、ミューテータ）
2. [x] PartnerController（CRUD操作、検索・フィルター、バリデーション）
3. [x] APIルート設定
4. [ ] バリデーションリクエストクラス

**Phase 1 完了条件**: 取引先一覧が取得でき、基本的なAPI通信が動作すること

**Phase 1 進捗**: ✅ 完了

---

### Phase 2: フロントエンド基盤構築（2-3日）🚀 **進行中**
**目標**: 取引先一覧表示、検索、フィルター、ページネーション

#### 2.1 実装する機能
- [ ] 取引先一覧表示（スティッキーヘッダー）
- [ ] 検索機能（取引先コード、名前、カナ、メール、電話）
- [ ] フィルター機能（取引先区分、アクティブ状態、外注フラグ）
- [ ] ページネーション
- [ ] 列移動機能
- [ ] 列幅リサイズ機能

#### 2.2 基本ファイル構造の作成
- [x] `types/features/partners/partner.ts` - 取引先型定義
- [x] `services/features/partners/partnerService.ts` - 取引先APIサービス
- [x] `hooks/features/partners/usePartners.ts` - 取引先管理フック
- [x] `components/features/partners/` - 取引先管理コンポーネント
- [x] `app/(features)/partners/page.tsx` - 取引先一覧ページ

#### 2.3 実装順序
1. [x] 取引先型定義（`Partner`インターフェース）
2. [x] 取引先サービス（`partnerService.ts`）
3. [x] React Queryフック（`usePartners.ts`）
4. [x] 基本UIコンポーネント（`components/features/partners/`）
5. [x] 取引先一覧ページ（`app/(features)/partners/page.tsx`）

**Phase 2 完了条件**: 取引先一覧が表示され、基本的なAPI通信が動作すること

**Phase 2 進捗**: ✅ 完了

---

### Phase 3: 基本機能実装（2-3日）🚀 **進行中**
**目標**: 取引先一覧表示、検索、フィルター、ページネーション

#### 3.1 実装する機能
- [ ] 取引先一覧表示（スティッキーヘッダー）
- [ ] 検索機能（取引先コード、名前、カナ、メール、電話）
- [ ] フィルター機能（取引先区分、アクティブ状態、外注フラグ）
- [ ] ページネーション
- [ ] 列移動機能
- [ ] 列幅リサイズ機能

#### 3.2 取引先一覧テーブル列定義
```typescript
const partnerColumns: ColumnDef<Partner>[] = [
  {
    accessorKey: 'partner_code',
    header: '取引先コード',
    size: 150,
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'partner_name',
    header: '取引先名',
    size: 250,
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'partner_type',
    header: '取引先区分',
    size: 120,
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => {
      const type = row.getValue('partner_type') as string
      return getPartnerTypeLabel(type)
    },
  },
  {
    accessorKey: 'phone',
    header: '電話番号',
    size: 150,
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'email',
    header: 'メールアドレス',
    size: 200,
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'is_active',
    header: '状態',
    size: 100,
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? '有効' : '無効'}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: '操作',
    size: 120,
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => {
      const partner = row.original
      return (
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={() => onView(partner)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(partner)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(partner)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
```

**Phase 3 完了条件**: 取引先一覧が表示され、検索・フィルター・ページネーションが動作すること

**Phase 3 進捗**: ✅ 完了

---

### Phase 4: 詳細・編集機能実装（1-2日）🚀 **進行中**
**目標**: 取引先の詳細表示、作成・編集フォーム

#### 4.1 実装する機能
- [ ] 取引先詳細表示ページ
- [ ] 取引先作成フォーム
- [ ] 取引先編集フォーム
- [ ] フォームバリデーション
- [ ] エラーハンドリング

#### 4.2 取引先フォーム項目
```typescript
interface PartnerFormData {
  // 基本情報
  partner_code: string;
  partner_name: string;
  partner_name_print?: string;
  partner_name_kana?: string;
  partner_type: 'customer' | 'supplier' | 'both';
  
  // 連絡先情報
  representative?: string;
  representative_kana?: string;
  branch_name?: string;
  postal_code?: string;
  address?: string;
  building_name?: string;
  phone?: string;
  fax?: string;
  email?: string;
  
  // 取引情報
  is_subcontractor: boolean;
  closing_date?: number;
  deposit_terms?: string;
  deposit_date?: number;
  deposit_method?: string;
  cash_allocation?: number;
  bill_allocation?: number;
  
  // 企業情報
  establishment_date?: Date;
  capital_stock?: number;
  previous_sales?: number;
  employee_count?: number;
  business_description?: string;
  
  // 銀行情報
  bank_name?: string;
  branch_name_bank?: string;
  account_type?: 'savings' | 'current';
  account_number?: string;
  account_holder?: string;
  
  // システム情報
  login_id?: string;
  journal_code?: string;
  is_active: boolean;
}
```

**Phase 4 完了条件**: 取引先の詳細表示、作成・編集が動作すること

**Phase 4 進捗**: ✅ 完了

---

### Phase 5: 高度な機能実装（1日）
**目標**: エクスポート・インポート、一括操作

#### 5.1 実装する機能
- [ ] 取引先データのエクスポート（CSV/Excel）
- [ ] 取引先データのインポート（CSV/Excel）
- [ ] 一括削除機能
- [ ] 一括ステータス変更機能

#### 5.2 エクスポート・インポート機能
```typescript
// エクスポート機能
const handleExport = async (format: 'csv' | 'excel') => {
  try {
    const response = await partnerService.export(format, searchParams)
    // ファイルダウンロード処理
  } catch (error) {
    console.error('エクスポートエラー:', error)
  }
}

// インポート機能
const handleImport = async (file: File) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    await partnerService.import(formData)
    // 成功時の処理
  } catch (error) {
    console.error('インポートエラー:', error)
  }
}
```

**Phase 5 完了条件**: エクスポート・インポート、一括操作が動作すること

---

## 技術的な実装ポイント

### 1. データベース設計
- **ソフトデリート**: `deleted_at`カラムによる論理削除
- **インデックス**: 検索・フィルター用の適切なインデックス設定
- **リレーション**: 見積管理、工事管理との関連性

### 2. API設計
- **RESTful API**: 標準的なCRUD操作
- **検索・フィルター**: 柔軟な検索条件のサポート
- **ページネーション**: 大量データの効率的な取得
- **バリデーション**: 包括的な入力値検証

### 3. フロントエンド設計
- **型安全性**: TypeScriptによる厳密な型定義
- **状態管理**: React Queryによる効率的なデータ管理
- **UI/UX**: ユーザー管理と統一されたデザイン
- **レスポンシブ**: モバイル・タブレット対応

### 4. パフォーマンス最適化
- **遅延読み込み**: 必要に応じたデータ取得
- **キャッシュ**: React Queryによる適切なキャッシュ戦略
- **仮想化**: 大量データの効率的な表示

## 完了条件

### 全体完了条件
1. **取引先一覧**: 検索・フィルター・ソート・ページネーションが動作
2. **取引先詳細**: 全フィールドの表示が可能
3. **取引先作成・編集**: フォームによるデータ入力・更新が可能
4. **取引先削除**: ソフトデリートによる安全な削除
5. **エクスポート・インポート**: データの入出力が可能
6. **見積管理との連携**: 取引先選択が正常に動作

### 品質基準
- **エラー処理**: 適切なエラーメッセージとハンドリング
- **バリデーション**: フロントエンド・バックエンド両方での入力検証
- **レスポンシブ**: 各種デバイスでの正常表示
- **アクセシビリティ**: キーボード操作、スクリーンリーダー対応
- **パフォーマンス**: 1000件以上のデータでも快適な操作

## 今後の拡張予定

### 短期（1-2ヶ月）
- **取引先履歴**: 変更履歴の追跡
- **取引先評価**: 取引実績に基づく評価システム
- **通知機能**: 重要情報の変更通知

### 中期（3-6ヶ月）
- **取引先分析**: 売上・支払いデータの分析
- **取引先マッピング**: 地理情報の可視化
- **API連携**: 外部システムとの連携

### 長期（6ヶ月以上）
- **AI分析**: 取引先のリスク評価
- **予測機能**: 取引実績の予測
- **統合管理**: 他の管理システムとの統合
