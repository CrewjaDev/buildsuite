# 業務コード完全ハードコーディング戦略

## 採用戦略：完全ハードコーディング

### 決定理由
データ削除リスクを完全に排除し、システムの安定性とパフォーマンスを最大化するため、**全業務コードをハードコーディング**する戦略を採用しました。

## 実装された業務コード構成

### システム管理コード（5種類）
```typescript
export const BUSINESS_CODES = {
  // システム管理
  USER: 'user',           // ユーザー管理
  ROLE: 'role',           // 役割管理
  DEPARTMENT: 'department', // 部署管理
  SYSTEM: 'system',       // システム管理
  APPROVAL: 'approval',   // 承認管理
  // ビジネスロジック
  ESTIMATE: 'estimate',   // 見積
  BUDGET: 'budget',       // 予算
  PURCHASE: 'purchase',   // 発注
  CONSTRUCTION: 'construction', // 工事
  GENERAL: 'general'      // 一般
} as const;
```

### ビジネスロジックコード（5種類）
1. **estimate** (見積) - 財務関連
2. **budget** (予算) - 財務関連
3. **purchase** (発注) - 財務関連
4. **construction** (工事) - 工事関連
5. **general** (一般) - 一般業務

## アーキテクチャ設計

### バックエンド実装
```php
// backend/app/Services/BusinessCodeService.php
class BusinessCodeService
{
    private const ALL_BUSINESS_CODES = [
        'user' => [...],
        'role' => [...],
        'estimate' => [...],
        // 全10種類の業務コードを定義
    ];
    
    public function getAllBusinessCodes(): array
    public function getBusinessCodeInfo(string $code): ?array
    public function isSystemCode(string $code): bool
}
```

### フロントエンド実装
```typescript
// frontend/src/types/features/business/businessCodes.ts
export const ALL_BUSINESS_CODES: Record<BusinessCode, BusinessCodeInfo> = {
  [BUSINESS_CODES.USER]: { name: 'ユーザー管理', ... },
  [BUSINESS_CODES.ESTIMATE]: { name: '見積', ... },
  // 全業務コードの詳細情報
};

// frontend/src/services/features/business/businessCodeService.ts
export const businessCodeService = new BusinessCodeService();
```

## 完全ハードコーディングのメリット

### 1. データ削除リスクの完全排除
- ✅ **データベース依存なし**: テーブル削除やデータ消失の影響を受けない
- ✅ **システム安定性**: 外部要因による業務コードの消失リスクゼロ
- ✅ **災害復旧**: データベース復旧不要でシステム稼働可能

### 2. パフォーマンス最適化
- ✅ **高速アクセス**: データベースクエリ不要
- ✅ **メモリ効率**: 定数としてメモリに常駐
- ✅ **レスポンス向上**: API応答時間の短縮

### 3. 型安全性と開発効率
- ✅ **TypeScript完全対応**: コンパイル時型チェック
- ✅ **IDE支援**: 自動補完とエラー検出
- ✅ **リファクタリング安全**: 型ベースの安全な変更

### 4. 運用・保守性
- ✅ **バージョン管理**: Gitで変更履歴を完全追跡
- ✅ **デプロイ安全**: コードとデータの整合性保証
- ✅ **テスト容易**: モック不要の単純なテスト

## 業務追加・変更プロセス

### 新規業務コード追加
1. **バックエンド**: `BusinessCodeService.php`の定数に追加
2. **フロントエンド**: `businessCodes.ts`の型定義と定数に追加
3. **権限**: `PermissionSeeder.php`で権限を自動生成
4. **テスト**: 単体テストと統合テストの実行
5. **デプロイ**: コードレビュー後の本番デプロイ

### 既存業務コード変更
1. **影響範囲調査**: 使用箇所の特定
2. **段階的変更**: 非破壊的変更の実施
3. **データ移行**: 既存データの整合性確保
4. **テスト**: 回帰テストの実行

## データベーステーブル削除

### 削除されたテーブル
- ❌ `business_types` テーブル（不要になったため削除）

### マイグレーション
```php
// 2025_01_21_200000_drop_business_types_table.php
Schema::dropIfExists('business_types');
```

## 実装完了状況

### ✅ 完了項目
- [x] バックエンド`BusinessCodeService`の完全ハードコーディング
- [x] フロントエンド型定義とサービスの分離
- [x] `business_types`テーブルの削除
- [x] 関連Seederの更新
- [x] 権限自動生成の実装

### 📋 今後の拡張
- 新規業務コードの追加は上記プロセスに従って実施
- 必要に応じてカテゴリ分類の拡張
- 権限体系の細分化

## 結論

**採用戦略**: 完全ハードコーディング
- 全10種類の業務コードをハードコーディング
- データ削除リスクの完全排除
- パフォーマンスと型安全性の最大化
- 運用・保守性の向上

この戦略により、システムの安定性、パフォーマンス、開発効率を同時に実現しています。

---

**作成日**: 2024年1月21日
**更新日**: 2025年1月21日
**作成者**: AI Assistant
**最終更新**: 完全ハードコーディング戦略への移行完了
