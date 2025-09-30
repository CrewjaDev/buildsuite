# ビジネスコードベース権限管理システム実装計画

## 概要

ビジネスコードベース権限管理システムの実装計画を策定します。段階的な実装により、安全で効率的な権限管理システムを構築します。

## 実装フェーズ

### フェーズ1: 基盤構築（2週間）

#### 1.1 バックエンドAPI基盤（1週間）

**目標**: ビジネスコード権限管理の基盤APIを構築

**実装内容**:

1. **BusinessCodeController作成**
   ```bash
   php artisan make:controller BusinessCodeController
   ```

2. **API ルート定義**
   ```php
   // routes/api.php
   Route::prefix('business-codes')->group(function () {
       Route::get('/', [BusinessCodeController::class, 'index']);
       Route::get('/{code}', [BusinessCodeController::class, 'show']);
       Route::get('/{code}/permissions', [BusinessCodeController::class, 'getPermissions']);
       Route::get('/{code}/assignment-status', [BusinessCodeController::class, 'getAssignmentStatus']);
   });
   ```

3. **基本API実装**
   - `GET /api/business-codes` - ビジネスコード一覧取得
   - `GET /api/business-codes/{code}` - ビジネスコード詳細取得
   - `GET /api/business-codes/{code}/permissions` - 権限一覧取得
   - `GET /api/business-codes/{code}/assignment-status` - 権限付与状況取得

**成果物**:
- `backend/app/Http/Controllers/BusinessCodeController.php`
- API仕様書
- 単体テスト

#### 1.2 フロントエンド基盤（1週間）

**目標**: ビジネスコード権限管理の基盤UIを構築

**実装内容**:

1. **カスタムフック作成**
   ```typescript
   // frontend/src/hooks/features/permission/useBusinessCodes.ts
   export function useBusinessCodes(category?: string)
   export function useBusinessCode(code: string | null)
   export function useBusinessCodePermissions(code: string | null)
   export function useBusinessCodeAssignmentStatus(code: string | null)
   ```

2. **サービス層作成**
   ```typescript
   // frontend/src/services/features/permission/businessCodeService.ts
   export const businessCodeService = {
     getBusinessCodes: (category?: string) => Promise<BusinessCode[]>,
     getBusinessCode: (code: string) => Promise<BusinessCode>,
     getBusinessCodePermissions: (code: string) => Promise<Permission[]>,
     getAssignmentStatus: (code: string) => Promise<AssignmentStatus>,
   }
   ```

3. **基本コンポーネント作成**
   ```typescript
   // frontend/src/components/features/permissions/BusinessCodePermissionManagement.tsx
   // frontend/src/components/features/permissions/BusinessCodeList.tsx
   // frontend/src/components/features/permissions/BusinessCodeDetail.tsx
   ```

**成果物**:
- カスタムフック
- サービス層
- 基本コンポーネント
- 型定義

### フェーズ2: 一括設定機能（2週間）

#### 2.1 バックエンド一括設定API（1週間）

**目標**: 一括権限設定のAPIを実装

**実装内容**:

1. **一括設定API実装**
   ```php
   // BusinessCodeController.php
   public function bulkAssignPermissions(Request $request, string $code): JsonResponse
   public function checkConflicts(Request $request, string $code): JsonResponse
   public function previewBulkAssign(Request $request, string $code): JsonResponse
   ```

2. **競合チェック機能**
   ```php
   private function checkConflicts(array $targets, array $permissions, string $mode): array
   private function getExistingPermissions(array $targets): array
   ```

3. **権限付与機能**
   ```php
   private function addToSystemLevels(string $code, array $permissions, array $systemLevelIds): void
   private function addToRoles(string $code, array $permissions, array $roleIds): void
   private function addToDepartments(string $code, array $permissions, array $departmentIds): void
   private function addToPositions(string $code, array $permissions, array $positionIds): void
   ```

**成果物**:
- 一括設定API
- 競合チェック機能
- 権限付与機能
- 単体テスト

#### 2.2 フロントエンド一括設定UI（1週間）

**目標**: 一括権限設定のUIを実装

**実装内容**:

1. **一括設定ダイアログ**
   ```typescript
   // frontend/src/components/features/permissions/BulkPermissionAssignment.tsx
   // - 設定モード選択（追加・置換・削除）
   // - 権限選択機能
   // - 付与先選択機能
   // - 競合警告表示
   ```

2. **競合警告コンポーネント**
   ```typescript
   // frontend/src/components/features/permissions/ConflictWarning.tsx
   // - 競合情報の表示
   // - 警告レベルの表示
   // - 解決方法の提示
   ```

3. **プレビュー機能**
   ```typescript
   // frontend/src/components/features/permissions/PreviewSection.tsx
   // - 変更内容のプレビュー
   // - 影響範囲の表示
   // - 確認機能
   ```

**成果物**:
- 一括設定ダイアログ
- 競合警告コンポーネント
- プレビュー機能
- 統合テスト

### フェーズ3: 高度な機能（2週間）

#### 3.1 置換・削除モード（1週間）

**目標**: 置換・削除モードの実装

**実装内容**:

1. **置換モード実装**
   ```php
   private function replaceInSystemLevels(string $code, array $permissions, array $systemLevelIds): void
   private function replaceInRoles(string $code, array $permissions, array $roleIds): void
   ```

2. **削除モード実装**
   ```php
   private function removeFromSystemLevels(string $code, array $permissions, array $systemLevelIds): void
   private function removeFromRoles(string $code, array $permissions, array $roleIds): void
   ```

3. **安全機能実装**
   ```php
   private function validateReplaceOperation(array $targets, array $permissions): array
   private function createBackup(array $targets): array
   private function rollbackChanges(array $backup): void
   ```

**成果物**:
- 置換・削除モード
- 安全機能
- ロールバック機能
- テスト

#### 3.2 高度なUI機能（1週間）

**目標**: 高度なUI機能の実装

**実装内容**:

1. **権限選択の高度化**
   ```typescript
   // frontend/src/components/features/permissions/AdvancedPermissionSelector.tsx
   // - カテゴリ別権限選択
   // - 一括選択機能
   // - フィルタリング機能
   ```

2. **付与先選択の高度化**
   ```typescript
   // frontend/src/components/features/permissions/AdvancedTargetSelector.tsx
   // - 階層別選択
   // - 条件付き選択
   // - 一括選択機能
   ```

3. **履歴・ログ機能**
   ```typescript
   // frontend/src/components/features/permissions/PermissionHistory.tsx
   // - 権限変更履歴
   // - 操作ログ
   // - ロールバック機能
   ```

**成果物**:
- 高度な権限選択
- 高度な付与先選択
- 履歴・ログ機能
- テスト

### フェーズ4: 統合・最適化（1週間）

#### 4.1 既存システムとの統合（3日）

**目標**: 既存の権限管理システムとの統合

**実装内容**:

1. **権限管理ページの統合**
   ```typescript
   // frontend/src/components/features/permissions/PermissionManagement.tsx
   // - ビジネスコード権限管理タブの追加
   // - 既存タブとの連携
   // - ナビゲーションの統合
   ```

2. **権限判定の統合**
   ```php
   // User.php
   public function hasPermission(string $permission): bool
   // - ビジネスコードベースの権限判定を統合
   // - 既存の権限判定との互換性確保
   ```

3. **データ整合性の確保**
   ```php
   // データベース整合性チェック
   // 権限の重複チェック
   // 階層間の整合性チェック
   ```

**成果物**:
- 統合された権限管理ページ
- 統合された権限判定
- データ整合性チェック

#### 4.2 パフォーマンス最適化（2日）

**目標**: パフォーマンスの最適化

**実装内容**:

1. **キャッシュ機能**
   ```php
   // ビジネスコード情報のキャッシュ
   // 権限付与状況のキャッシュ
   // 競合チェック結果のキャッシュ
   ```

2. **データベース最適化**
   ```sql
   -- インデックスの追加
   -- クエリの最適化
   -- バッチ処理の実装
   ```

3. **フロントエンド最適化**
   ```typescript
   // 仮想スクロール
   // 遅延読み込み
   // メモ化
   ```

**成果物**:
- キャッシュ機能
- 最適化されたクエリ
- 最適化されたUI

## 実装詳細

### 1. データベース設計

#### 1.1 既存テーブルの活用
```sql
-- 既存のテーブルを活用
permissions
system_levels
roles
departments
positions
users

-- 既存の関連テーブル
system_level_permissions
role_permissions
department_permissions
position_permissions
user_permissions
```

#### 1.2 新規テーブル（必要に応じて）
```sql
-- ビジネスコード権限履歴テーブル
CREATE TABLE business_code_permission_history (
    id BIGINT PRIMARY KEY,
    business_code VARCHAR(100) NOT NULL,
    operation_type ENUM('add', 'replace', 'remove') NOT NULL,
    target_type ENUM('system_level', 'role', 'department', 'position') NOT NULL,
    target_id BIGINT NOT NULL,
    permissions JSON NOT NULL,
    executed_by BIGINT NOT NULL,
    executed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 2. API設計

#### 2.1 エンドポイント一覧
```php
// ビジネスコード管理
GET    /api/business-codes                    // 一覧取得
GET    /api/business-codes/{code}             // 詳細取得
GET    /api/business-codes/{code}/permissions // 権限一覧
GET    /api/business-codes/{code}/assignment-status // 付与状況

// 一括権限設定
POST   /api/business-codes/{code}/permissions/bulk-assign // 一括設定
POST   /api/business-codes/{code}/permissions/check-conflicts // 競合チェック
POST   /api/business-codes/{code}/permissions/preview // プレビュー

// 履歴・ログ
GET    /api/business-codes/{code}/history     // 履歴取得
POST   /api/business-codes/{code}/rollback    // ロールバック
```

#### 2.2 レスポンス形式
```json
{
  "success": true,
  "data": {
    "business_codes": [...],
    "pagination": {...}
  },
  "message": "Success"
}
```

### 3. フロントエンド設計

#### 3.1 コンポーネント構成
```
PermissionManagement/
├── BusinessCodePermissionManagement.tsx     // メインコンポーネント
├── BusinessCodeList.tsx                     // 一覧表示
├── BusinessCodeDetail.tsx                   // 詳細表示
├── BulkPermissionAssignment.tsx             // 一括設定ダイアログ
├── ConflictWarning.tsx                      // 競合警告
├── PreviewSection.tsx                       // プレビュー
├── AdvancedPermissionSelector.tsx           // 高度な権限選択
├── AdvancedTargetSelector.tsx               // 高度な付与先選択
└── PermissionHistory.tsx                    // 履歴表示
```

#### 3.2 状態管理
```typescript
// 状態管理の構成
interface BusinessCodeState {
  businessCodes: BusinessCode[];
  selectedBusinessCode: string | null;
  permissions: Permission[];
  assignmentStatus: AssignmentStatus | null;
  conflicts: Conflict[];
  history: PermissionHistory[];
}
```

### 4. セキュリティ考慮事項

#### 4.1 認証・認可
```php
// ミドルウェア
Route::middleware(['auth:sanctum', 'can:manage-permissions'])->group(function () {
    // ビジネスコード権限管理のルート
});
```

#### 4.2 入力検証
```php
// バリデーションルール
$validator = Validator::make($request->all(), [
    'permissions' => 'required|array|min:1',
    'permissions.*' => 'required|string|exists:permissions,name',
    'targets' => 'required|array',
    'mode' => 'required|in:add,replace,remove',
]);
```

#### 4.3 監査ログ
```php
// 操作ログの記録
Log::info('Business code permission bulk assignment', [
    'business_code' => $code,
    'permissions' => $permissions,
    'targets' => $targets,
    'mode' => $mode,
    'user_id' => auth()->id(),
]);
```

## テスト計画

### 1. 単体テスト

#### 1.1 バックエンドテスト
```php
// BusinessCodeControllerTest.php
class BusinessCodeControllerTest extends TestCase
{
    public function testGetBusinessCodes()
    public function testGetBusinessCode()
    public function testBulkAssignPermissions()
    public function testCheckConflicts()
    public function testPreviewBulkAssign()
}
```

#### 1.2 フロントエンドテスト
```typescript
// BusinessCodePermissionManagement.test.tsx
describe('BusinessCodePermissionManagement', () => {
  it('should display business codes list')
  it('should show business code detail')
  it('should handle bulk permission assignment')
  it('should show conflict warnings')
})
```

### 2. 統合テスト

#### 2.1 API統合テスト
```php
// エンドツーエンドのAPIテスト
// 権限設定の一連の流れのテスト
// 競合チェックのテスト
```

#### 2.2 UI統合テスト
```typescript
// ユーザー操作の一連の流れのテスト
// 一括設定のテスト
// 競合警告のテスト
```

### 3. パフォーマンステスト

#### 3.1 負荷テスト
```php
// 大量のビジネスコードでのテスト
// 大量の権限設定でのテスト
// 同時アクセスのテスト
```

#### 3.2 メモリテスト
```typescript
// メモリリークのテスト
// 大量データ表示のテスト
// 長時間使用のテスト
```

## デプロイ計画

### 1. 段階的デプロイ

#### 1.1 ステージング環境
- フェーズ1完了後: ステージング環境にデプロイ
- 基本機能のテスト
- パフォーマンステスト

#### 1.2 本番環境
- フェーズ4完了後: 本番環境にデプロイ
- 段階的な機能公開
- 監視・ログ収集

### 2. ロールバック計画

#### 2.1 データベースロールバック
```sql
-- 権限設定のロールバック
-- 履歴テーブルからの復元
-- 整合性チェック
```

#### 2.2 アプリケーションロールバック
```bash
# 前バージョンへのロールバック
# 設定ファイルの復元
# キャッシュのクリア
```

## 運用・保守計画

### 1. 監視

#### 1.1 パフォーマンス監視
- API応答時間の監視
- データベースクエリの監視
- メモリ使用量の監視

#### 1.2 エラー監視
- エラーログの監視
- 例外の監視
- ユーザーエラーの監視

### 2. メンテナンス

#### 2.1 定期メンテナンス
- データベースの最適化
- キャッシュのクリア
- ログファイルの整理

#### 2.2 緊急対応
- 障害時の対応手順
- エスカレーション手順
- 復旧手順

## スケジュール

| フェーズ | 期間 | 開始日 | 終了日 | 主要成果物 |
|----------|------|--------|--------|------------|
| フェーズ1 | 2週間 | Week 1 | Week 2 | 基盤API・UI |
| フェーズ2 | 2週間 | Week 3 | Week 4 | 一括設定機能 |
| フェーズ3 | 2週間 | Week 5 | Week 6 | 高度な機能 |
| フェーズ4 | 1週間 | Week 7 | Week 7 | 統合・最適化 |
| **合計** | **7週間** | | | **完全なシステム** |

## リスク管理

### 1. 技術リスク

#### 1.1 パフォーマンスリスク
- **リスク**: 大量データでの性能劣化
- **対策**: 段階的な負荷テスト、キャッシュ機能

#### 1.2 データ整合性リスク
- **リスク**: 権限設定の不整合
- **対策**: トランザクション処理、整合性チェック

### 2. 運用リスク

#### 2.1 ユーザビリティリスク
- **リスク**: 複雑なUIによる操作ミス
- **対策**: ユーザーテスト、直感的なUI設計

#### 2.2 セキュリティリスク
- **リスク**: 権限の不正設定
- **対策**: 認証・認可、監査ログ

## 成功指標

### 1. 機能指標
- ビジネスコード一覧の表示時間 < 2秒
- 一括設定の実行時間 < 5秒
- 競合チェックの実行時間 < 1秒

### 2. 品質指標
- テストカバレッジ > 90%
- バグ発生率 < 1%
- ユーザー満足度 > 4.0/5.0

### 3. 運用指標
- システム稼働率 > 99.9%
- 平均応答時間 < 1秒
- エラー率 < 0.1%

この実装計画に基づいて、段階的かつ安全にビジネスコードベース権限管理システムを構築します。
