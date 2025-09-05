# 承認フロー機能の実装状況

## 概要

このドキュメントは、承認フロー機能の現在の実装状況をまとめたものです。データベース設計からGraphQL API、モデル実装まで、各層の実装状況を詳細に記載しています。

## 実装状況サマリー

| 機能カテゴリ | 実装状況 | 備考 |
|------------|----------|------|
| データベース設計 | ✅ 完了 | 5つのテーブル（flows, steps, conditions, requests, histories） |
| Eloquentモデル | ✅ 完了 | 全モデル実装済み、リレーション設定済み |
| GraphQL Types | ✅ 完了 | 全エンティティのGraphQLタイプ定義済み |
| GraphQL Queries | ✅ 完了 | 承認フロー・依頼一覧取得クエリ実装済み |
| GraphQL Mutations | ✅ 完了 | CRUD操作・承認処理のミューテーション実装済み |
| ミドルウェア | ✅ 完了 | 承認権限チェック機能実装済み |
| REST API | ❌ 未実装 | GraphQL優先のため未実装 |
| フロントエンド | ❌ 未実装 | 今後実装予定 |

## 1. データベース設計

### 実装済みテーブル

#### 1.1 approval_flows テーブル
- **目的**: 承認フローの基本情報を管理
- **主要フィールド**: 
  - `name`: フロー名
  - `flow_type`: フロータイプ（estimate, budget, order, progress, payment）
  - `is_active`: アクティブ状態
  - `is_system`: システムフロー判定
  - `priority`: 優先度

#### 1.2 approval_steps テーブル
- **目的**: 承認フローのステップを管理
- **主要フィールド**:
  - `step_order`: ステップ順序
  - `approver_type`: 承認者タイプ（user, role, department, system_level）
  - `approver_id`: 承認者ID
  - `approver_condition`: 承認条件（JSON）
  - `timeout_hours`: タイムアウト時間

#### 1.3 approval_conditions テーブル
- **目的**: 承認フローの適用条件を管理
- **主要フィールド**:
  - `condition_type`: 条件タイプ（amount, department, role, project, custom）
  - `field_name`: フィールド名
  - `operator`: 演算子（equals, greater_than, less_than, contains, in など）
  - `value`: 条件値（JSON）

#### 1.4 approval_requests テーブル
- **目的**: 承認依頼の管理
- **主要フィールド**:
  - `request_type`: 依頼タイプ
  - `request_data`: 依頼データ（JSON）
  - `status`: ステータス（pending, approved, rejected, returned, cancelled）
  - `priority`: 優先度（low, normal, high, urgent）
  - `expires_at`: 期限日時

#### 1.5 approval_histories テーブル
- **目的**: 承認履歴の管理
- **主要フィールド**:
  - `action`: アクション（approve, reject, return, cancel, delegate）
  - `acted_by`: 実行者
  - `comment`: コメント
  - `delegated_to`: 委譲先

## 2. Eloquentモデル

### 実装済みモデル

#### 2.1 ApprovalFlow
- **ファイル**: `app/Models/ApprovalFlow.php`
- **実装機能**:
  - ✅ 基本CRUD操作
  - ✅ リレーション設定（steps, conditions, requests）
  - ✅ スコープメソッド（active, byType, system）
  - ✅ ビジネスロジック（matchesConditions, isUsable）

#### 2.2 ApprovalStep
- **ファイル**: `app/Models/ApprovalStep.php`
- **実装機能**:
  - ✅ 基本CRUD操作
  - ✅ 複数承認者タイプ対応（user, role, department, system_level）
  - ✅ 承認者取得ロジック（getApprovers）
  - ✅ 条件評価機能（evaluateConditions）
  - ✅ タイムアウト管理

#### 2.3 ApprovalCondition
- **ファイル**: `app/Models/ApprovalCondition.php`
- **実装機能**:
  - ✅ 基本CRUD操作
  - ✅ 条件評価エンジン（evaluate）
  - ✅ 複数演算子対応（12種類の演算子）
  - ✅ ネストフィールド対応
  - ✅ 表示名生成機能

#### 2.4 ApprovalRequest
- **ファイル**: `app/Models/ApprovalRequest.php`
- **実装機能**:
  - ✅ 基本CRUD操作
  - ✅ 承認処理（approve, reject, return, cancel）
  - ✅ ステップ進行管理（moveToNextStep）
  - ✅ 権限チェック（isApprover, isRequester）
  - ✅ ステータス管理

#### 2.5 ApprovalHistory
- **ファイル**: `app/Models/ApprovalHistory.php`
- **実装機能**:
  - ✅ 基本CRUD操作
  - ✅ アクション判定メソッド
  - ✅ 表示名・色情報取得
  - ✅ スコープメソッド

## 3. GraphQL API

### 3.1 GraphQL Types（完全実装済み）

#### ApprovalFlowType
- **ファイル**: `app/GraphQL/Types/ApprovalFlowType.php`
- **フィールド**: 基本情報 + リレーション + 計算フィールド（step_count, is_usable）

#### ApprovalStepType
- **ファイル**: `app/GraphQL/Types/ApprovalStepType.php`
- **フィールド**: 基本情報 + 各承認者タイプのリレーション

#### ApprovalConditionType
- **ファイル**: `app/GraphQL/Types/ApprovalConditionType.php`
- **フィールド**: 基本情報 + JSON値の処理

#### ApprovalRequestType
- **ファイル**: `app/GraphQL/Types/ApprovalRequestType.php`
- **フィールド**: 基本情報 + 全リレーション + ステータス判定メソッド

#### ApprovalHistoryType
- **ファイル**: `app/GraphQL/Types/ApprovalHistoryType.php`
- **フィールド**: 基本情報 + リレーション

### 3.2 GraphQL Queries（実装済み）

#### ApprovalFlowsQuery
- **ファイル**: `app/GraphQL/Queries/ApprovalFlowsQuery.php`
- **機能**: 
  - ✅ フィルタリング（name, flow_type, is_active, created_by）
  - ✅ ソート機能
  - ✅ ページネーション

#### ApprovalRequestsQuery
- **ファイル**: `app/GraphQL/Queries/ApprovalRequestsQuery.php`
- **機能**:
  - ✅ フィルタリング（status, request_type, priority, requested_by, approval_flow_id）
  - ✅ 期限切れフィルタ
  - ✅ ページネーション

#### ApprovalRequestsByApproverQuery
- **ファイル**: `app/GraphQL/Queries/ApprovalRequestsByApproverQuery.php`
- **機能**: 承認者向けの承認依頼一覧取得

### 3.3 GraphQL Mutations（実装済み）

#### 承認フロー管理
- ✅ `CreateApprovalFlowMutation.php`: 承認フロー作成
- ✅ `UpdateApprovalFlowMutation.php`: 承認フロー更新
- ✅ `DeleteApprovalFlowMutation.php`: 承認フロー削除
- ✅ `GetApprovalFlowMutation.php`: 承認フロー取得

#### 承認ステップ管理
- ✅ `CreateApprovalStepMutation.php`: 承認ステップ作成

#### 承認依頼管理
- ✅ `CreateApprovalRequestMutation.php`: 承認依頼作成
- ✅ `UpdateApprovalRequestMutation.php`: 承認依頼更新
- ✅ `DeleteApprovalRequestMutation.php`: 承認依頼削除
- ✅ `GetApprovalRequestMutation.php`: 承認依頼取得

#### 承認処理
- ✅ `ApproveRequestMutation.php`: 承認処理
- ✅ `RejectRequestMutation.php`: 却下処理
- ✅ `ReturnRequestMutation.php`: 差し戻し処理
- ✅ `CancelRequestMutation.php`: キャンセル処理

## 4. ミドルウェア

### ApprovalPermissionMiddleware
- **ファイル**: `app/GraphQL/Middleware/ApprovalPermissionMiddleware.php`
- **実装機能**:
  - ✅ 認証チェック
  - ✅ 操作別権限チェック
  - ✅ 作成者権限チェック
  - ✅ 管理者権限対応

## 5. 未実装機能

### 5.1 REST API
- **状況**: GraphQL優先のため未実装
- **必要性**: フロントエンドの要件に応じて検討

### 5.2 通知機能
- **状況**: 未実装
- **必要機能**:
  - 承認依頼通知
  - 期限通知
  - 承認完了通知

### 5.3 バッチ処理
- **状況**: 未実装
- **必要機能**:
  - 期限切れ承認依頼の自動処理
  - 通知バッチ
  - 統計情報生成

### 5.4 承認フロー設定UI
- **状況**: 未実装
- **必要機能**:
  - フロー設計インターフェース
  - 条件設定UI
  - ステップ管理UI

## 6. 次のステップ

### 優先度高
1. **フロントエンド実装**: 承認フロー管理画面の作成
2. **通知システム**: メール・プッシュ通知の実装
3. **テストケース**: 単体テスト・統合テストの追加

### 優先度中
1. **バッチ処理**: 定期実行処理の実装
2. **監査ログ**: 詳細な操作ログの実装
3. **パフォーマンス最適化**: クエリ最適化・キャッシュ実装

### 優先度低
1. **REST API**: 必要に応じて実装
2. **レポート機能**: 承認統計・分析機能
3. **外部システム連携**: API連携機能

## 7. 技術的な特徴

### 7.1 設計の特徴
- **柔軟な承認者設定**: ユーザー、役割、部署、システム権限レベルに対応
- **条件ベースフロー選択**: 複雑な条件設定によるフロー自動選択
- **完全な履歴管理**: 全ての承認操作を記録
- **タイムアウト対応**: ステップレベルでのタイムアウト設定

### 7.2 拡張性
- **新しい承認者タイプの追加**: モデル修正のみで対応可能
- **カスタム条件の追加**: 演算子・条件タイプの拡張が容易
- **フロータイプの追加**: 設定値の追加のみで対応可能

### 7.3 セキュリティ
- **権限ベースアクセス制御**: 操作別の詳細な権限チェック
- **作成者権限**: 作成者のみが編集・削除可能
- **管理者権限**: 全操作に対する管理者権限

## 8. 結論

承認フロー機能のバックエンド実装は非常に高い完成度に達しています。データベース設計からGraphQL API、ビジネスロジックまで、包括的に実装されており、複雑な承認要件にも対応可能な柔軟な設計となっています。

次のフェーズでは、フロントエンド実装と通知システムの構築に注力することで、完全に機能する承認システムを提供できる状況です。
