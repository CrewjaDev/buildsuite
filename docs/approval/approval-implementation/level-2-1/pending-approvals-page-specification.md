# 承認待ち一覧ページ 機能仕様書

## 概要

承認者が自分に関連する承認依頼を確認・処理するための専用ページ。ダッシュボードからアクセスし、承認待ちの依頼を一覧表示し、各依頼の詳細ページ（関連業務データ）へ遷移できる。

## 機能要件

### 1. アクセス方法
- **ダッシュボード**: 承認待ち件数を表示するカードを配置
- **URL**: `/approvals/pending`
- **権限**: `approval.usage`権限を持つユーザーのみアクセス可能
- **ダッシュボード表示**: `approval.usage`権限を持つユーザーには承認者ダッシュボードを表示

### 2. 表示内容

#### 2.1 承認待ち一覧
- **対象**: 現在のユーザーが承認者として設定されている承認依頼
- **ステータス**: `pending` の承認依頼のみ
- **表示項目**:
  - 依頼ID
  - タイトル
  - 依頼タイプ（estimate, budget, construction等）
  - 依頼者名
  - 現在のステップ
  - 優先度
  - 作成日時
  - 有効期限
  - アクションボタン（詳細）

#### 2.2 フィルタリング・ソート機能
- **ステータスフィルタ**: 承認待ち、承認済み、却下済み、差し戻し済み
- **依頼タイプフィルタ**: estimate, budget, construction等
- **優先度フィルタ**: 低、通常、高、緊急
- **ソート**: 作成日時、有効期限、優先度
- **検索**: タイトル、依頼者名での部分一致検索

#### 2.3 ページネーション
- 1ページあたり20件表示
- ページネーションコントロール

### 3. アクション機能

#### 3.1 詳細表示
- **ボタン**: 「詳細」ボタンをクリック
- **遷移先**: 関連業務の詳細ページ
  - 見積承認依頼 → `/estimates/{id}`
  - 予算承認依頼 → `/budgets/{id}`
  - 工事承認依頼 → `/constructions/{id}`

#### 3.2 一括操作（将来実装）
- 複数選択による一括承認
- 一括却下
- 一括差し戻し

## 技術仕様

### 1. フロントエンド

#### 1.1 ページ構成
```
/approvals/pending
├── PendingApprovalsPage.tsx (メインページ)
├── PendingApprovalsList.tsx (一覧表示)
├── PendingApprovalsFilter.tsx (フィルタリング)
└── PendingApprovalsCard.tsx (個別カード)
```

#### 1.2 状態管理
- **TanStack Query**: 承認待ちデータの取得・キャッシュ
- **React State**: フィルタ、ソート、ページネーション状態
- **URL State**: フィルタ条件をURLパラメータで管理

#### 1.3 UI/UX
- **Shadcn/ui**: コンポーネントライブラリ
- **TanStack Table**: 一覧表示
- **レスポンシブ**: モバイル対応
- **アクセシビリティ**: キーボードナビゲーション対応

### 2. バックエンド

#### 2.1 API エンドポイント
```
GET /api/approvals/pending
- 承認待ち一覧取得
- クエリパラメータ: page, per_page, status, type, priority, search, sort_by, sort_order

GET /api/approvals/pending/count
- 承認待ち件数取得（ダッシュボード用）
```

#### 2.2 データベースクエリ
```sql
-- 承認待ち一覧取得
SELECT ar.*, af.name as flow_name, u.login_id as requester_name
FROM approval_requests ar
JOIN approval_flows af ON ar.approval_flow_id = af.id
JOIN users u ON ar.requested_by = u.id
WHERE ar.status = 'pending'
  AND ar.current_step IN (
    SELECT step_number 
    FROM jsonb_array_elements(af.approval_steps) AS step
    WHERE step->'approvers' @> '[{"type": "user", "value": ?}]'
       OR step->'approvers' @> '[{"type": "system_level", "value": ?}]'
       OR step->'approvers' @> '[{"type": "department", "value": ?}]'
       OR step->'approvers' @> '[{"type": "position", "value": ?}]'
  )
ORDER BY ar.created_at DESC;
```

#### 2.3 承認者判定ロジック
```php
private function isUserApprover($user, $approvalFlow, $currentStep)
{
    $steps = $approvalFlow->approval_steps;
    $step = collect($steps)->firstWhere('step', $currentStep);
    
    if (!$step || !isset($step['approvers'])) {
        return false;
    }
    
    foreach ($step['approvers'] as $approver) {
        switch ($approver['type']) {
            case 'user':
                if ($approver['value'] == $user->id) return true;
                break;
            case 'system_level':
                if ($approver['value'] == $user->system_level) return true;
                break;
            case 'department':
                if ($approver['value'] == $user->employee->department_id) return true;
                break;
            case 'position':
                if ($approver['value'] == $user->employee->position_id) return true;
                break;
        }
    }
    
    return false;
}
```

### 3. セキュリティ

#### 3.1 権限チェック
- `approval.usage`権限を持つユーザーのみアクセス可能
- 各承認依頼に対して承認者判定を実行
- 承認者でない場合は403エラー

#### 3.2 承認者機能利用権限（approval.usage）
- **目的**: 承認者機能の利用可否を制御
- **付与対象**: supervisor以上のシステム権限レベル
- **権限管理**: `system_level_permissions`テーブルで管理
- **ダッシュボード制御**: この権限を持つユーザーに承認者ダッシュボードを表示

#### 3.3 データ保護
- 承認者以外の承認依頼は表示しない
- 機密情報の適切なマスキング
- ログ記録（アクセス、操作履歴）

## 実装スケジュール

### Phase 1: 基本機能
1. **ダッシュボードカード** (1日) ✅
   - 承認待ち件数表示
   - クリックで一覧ページへ遷移

2. **承認待ち一覧ページ** (3日) ✅
   - 基本的な一覧表示
   - フィルタリング機能
   - 詳細ページへの遷移

3. **API実装** (2日) ✅
   - 承認待ち一覧取得API
   - 承認者判定ロジック
   - 件数取得API

4. **承認者機能利用権限** (1日) ✅
   - `approval.usage`権限の追加
   - システム権限レベルとの紐づけ
   - ダッシュボード選択ロジックの実装

### Phase 2: 機能拡張
5. **検索・ソート機能** (2日)
   - 高度な検索機能
   - 複数条件でのソート

6. **UI/UX改善** (2日)
   - レスポンシブ対応
   - アクセシビリティ向上
   - パフォーマンス最適化

### Phase 3: 高度な機能
7. **一括操作** (3日)
   - 複数選択機能
   - 一括承認・却下・差し戻し

8. **通知機能** (2日)
   - リアルタイム通知
   - メール通知

## テスト仕様

### 1. 単体テスト
- 承認者判定ロジックのテスト
- フィルタリング機能のテスト
- API エンドポイントのテスト

### 2. 統合テスト
- ダッシュボードから一覧ページへの遷移
- 一覧ページから詳細ページへの遷移
- 承認処理の統合テスト

### 3. ユーザビリティテスト
- 承認者の操作フロー
- レスポンシブデザイン
- アクセシビリティ

## 運用・保守

### 1. 監視
- 承認待ち件数の監視
- レスポンス時間の監視
- エラー率の監視

### 2. ログ
- アクセスログ
- 操作ログ
- エラーログ

### 3. バックアップ
- 承認依頼データのバックアップ
- 設定データのバックアップ

## 将来の拡張

### 1. モバイルアプリ対応
- プッシュ通知
- オフライン対応

### 2. ワークフロー自動化
- 自動承認ルール
- エスカレーション機能

### 3. 分析・レポート
- 承認時間の分析
- 承認率の分析
- ダッシュボード

## 実装完了状況

### ✅ 完了項目（Phase 1）
- **ダッシュボードカード**: 承認待ち件数表示とページ遷移
- **承認待ち一覧ページ**: 基本的な一覧表示、フィルタリング、詳細ページ遷移
- **API実装**: 承認待ち一覧取得、承認者判定ロジック、件数取得
- **承認者機能利用権限**: `approval.usage`権限の実装とダッシュボード制御

### 🔄 実装詳細
- **権限管理**: `approval.usage`権限をsupervisor以上のシステム権限レベルに付与
- **ダッシュボード制御**: 権限に基づく動的ダッシュボード選択
- **承認者判定**: JSONBベースの柔軟な承認者判定ロジック
- **フロントエンド**: TypeScript型定義の更新と権限チェック実装

## 関連ドキュメント

- [承認フロー高度仕様書](./approval-flow-advanced-specification.md)
- [承認管理ページ実装計画](./approval-management-page-implementation.md)
- [実装進捗トラッカー](./implementation-progress-tracker.md)
