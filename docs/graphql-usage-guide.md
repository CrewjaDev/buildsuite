# GraphQL 使用ガイド

## 概要

BuildSuiteシステムでは、**承認フロー関連の複雑なクエリのみ**でGraphQLを使用し、各業務機能ではRESTful APIを使用する方針に変更しました。

## API選択基準

### RESTful API（推奨）
- **用途**: 基本的なCRUD操作、シンプルなデータ取得、各業務機能
- **エンドポイント**: `/api/v1/*`
- **認証**: Laravel Sanctum
- **特徴**: 
  - シンプルで理解しやすい
  - 既存のコントローラーが充実
  - キャッシュが効きやすい
  - 既存システムとの統合が容易
  - フロントエンドとの一貫性が保てる

### GraphQL（承認フロー専用）
- **用途**: 承認フロー関連の複雑な権限チェック・データ取得のみ
- **エンドポイント**: `/graphql`
- **認証**: Laravel Sanctum
- **特徴**:
  - 複数テーブルの結合クエリ
  - 複雑な権限チェックロジック
  - 承認者判定の柔軟な実装
  - 型安全性

## GraphQLの適用場面（限定）

### 1. 承認フロー関連の複雑なクエリのみ

```graphql
query UserPermissions($userId: Int!) {
  user(id: $userId) {
    id
    name
    approval_permissions
    systemLevel {
      id
      name
      permissions {
        id
        name
      }
    }
    roles {
      id
      name
      permissions {
        id
        name
      }
    }
    departments {
      id
      name
      permissions {
        id
        name
      }
    }
  }
}
```

### 2. 承認依頼の複雑な検索・フィルタリング

```graphql
query ApprovalRequests($filters: ApprovalRequestFilters!) {
  approvalRequests(filters: $filters) {
    id
    title
    status
    requester {
      id
      name
    }
    approvers {
      id
      name
      approval_status
    }
    approvalFlow {
      id
      name
      steps {
        id
        name
        conditions {
          id
          type
          value
        }
      }
    }
  }
}
```

## 削除対象のGraphQL API

以下の業務機能関連のGraphQL APIは削除し、RESTful APIに統一します：

### 見積管理機能
- `estimates` Query
- `estimateItems` Query
- `createEstimate` Mutation
- `updateEstimate` Mutation
- `deleteEstimate` Mutation
- `Estimate` Type
- `EstimateItem` Type

### マスタデータ
- `partners` Query
- `projectTypes` Query
- `constructionClassifications` Query
- `Partner` Type
- `ProjectType` Type
- `ConstructionClassification` Type

### 原価計画機能
- `costPlans` Query
- `costPlanItems` Query
- `createCostPlan` Mutation
- `updateCostPlan` Mutation
- `deleteCostPlan` Mutation
- `CostPlan` Type
- `CostPlanItem` Type

## 移行計画

### Phase 1: 設定ファイルの更新 ✅
- GraphQL設定ファイルから業務機能関連のAPIを無効化
- 承認フロー関連のAPIのみ有効化

### Phase 2: フロントエンドの確認 ✅
- フロントエンドは既にRESTful APIを使用済み
- GraphQL APIへの依存がないことを確認

### Phase 3: 不要ファイルの削除（予定）
- 業務機能関連のGraphQLファイルを削除
- 承認フロー関連のファイルのみ保持

## セキュリティ考慮事項

### 1. 認証・認可
- Laravel Sanctumによるトークン認証
- 権限チェックの実装
- クエリの複雑度制限

### 2. レート制限
- GraphQLエンドポイントのレート制限
- クエリの実行時間制限

### 3. エラーハンドリング
- デバッグ情報の制御
- エラーログの記録

## パフォーマンス最適化

### 1. N+1問題の回避
- Eloquentのwith()を使用
- DataLoaderパターンの実装

### 2. キャッシュ戦略
- クエリ結果のキャッシュ
- 権限情報のキャッシュ

### 3. クエリの最適化
- 必要なフィールドのみ取得
- ページネーションの実装

## 開発時の注意点

### 1. 承認フロー専用の使用
- 新機能は原則RESTful APIで実装
- 承認フロー関連のみGraphQLを使用
- 複雑な権限チェックが必要な場合のみ検討

### 2. ドキュメント化
- GraphQLスキーマの文書化
- 使用例の提供
- 承認フロー関連のAPI仕様書
