# 承認フロー GraphQL API リファレンス

## 概要

承認フロー機能は GraphQL API で提供されています。このドキュメントでは、利用可能な Queries、Mutations、Types について詳細に説明します。

## エンドポイント

- **本番環境**: `/graphql` (認証必要)
- **テスト環境**: `/graphql-test` (認証不要)

### テスト環境での利用

テスト用エンドポイント `/graphql-test` では認証なしでGraphQL APIをテストできます：

```javascript
// テスト環境での利用例
fetch('/graphql-test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // 認証ヘッダーは不要
  },
  body: JSON.stringify({ 
    query: 'query { approvalFlows { id name } }' 
  })
})
```

## 認証

GraphQL API へのアクセスには Laravel Sanctum による認証が必要です（テスト環境除く）。

```javascript
// リクエストヘッダーに認証トークンを含める
headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json'
}
```

## Types

### ApprovalFlow

承認フローの情報を表現する型

```graphql
type ApprovalFlow {
  id: Int!
  name: String!
  description: String
  flow_type: String!
  is_active: Boolean!
  is_system: Boolean!
  priority: Int!
  steps: [ApprovalStep]
  conditions: [ApprovalCondition]
  requests: [ApprovalRequest]
  creator: User
  updater: User
  step_count: Int
  is_usable: Boolean
  created_at: String
  updated_at: String
}
```

### ApprovalStep

承認ステップの情報を表現する型

```graphql
type ApprovalStep {
  id: Int!
  approval_flow_id: Int!
  step_order: Int!
  name: String!
  description: String
  approver_type: String!
  approver_id: Int
  approver_condition: String # JSON文字列
  is_required: Boolean!
  can_delegate: Boolean!
  timeout_hours: Int
  is_active: Boolean!
  flow: ApprovalFlow
  approver: User
  approver_role: Role
  approver_department: Department
  approver_system_level: SystemLevel
  histories: [ApprovalHistory]
  creator: User
  updater: User
  created_at: String
  updated_at: String
}
```

### ApprovalCondition

承認条件の情報を表現する型

```graphql
type ApprovalCondition {
  id: Int!
  approval_flow_id: Int!
  condition_type: String!
  field_name: String!
  operator: String!
  value: String # JSON文字列
  value_type: String
  is_active: Boolean!
  priority: Int!
  description: String
  flow: ApprovalFlow
  creator: User
  updater: User
  created_at: String
  updated_at: String
}
```

### ApprovalRequest

承認依頼の情報を表現する型

```graphql
type ApprovalRequest {
  id: Int!
  approval_flow_id: Int!
  request_type: String!
  request_id: Int!
  title: String!
  description: String
  request_data: String # JSON文字列
  current_step: Int
  status: String!
  priority: String!
  requested_by: Int!
  approved_by: Int
  approved_at: String
  rejected_by: Int
  rejected_at: String
  returned_by: Int
  returned_at: String
  cancelled_by: Int
  cancelled_at: String
  expires_at: String
  flow: ApprovalFlow
  requester: User
  approver: User
  rejecter: User
  returner: User
  canceller: User
  current_step_info: ApprovalStep
  histories: [ApprovalHistory]
  is_pending: Boolean
  is_approved: Boolean
  is_rejected: Boolean
  is_returned: Boolean
  is_cancelled: Boolean
  is_expired: Boolean
  is_completed: Boolean
  is_in_progress: Boolean
  created_at: String
  updated_at: String
}
```

### ApprovalHistory

承認履歴の情報を表現する型

```graphql
type ApprovalHistory {
  id: Int!
  approval_request_id: Int!
  approval_step_id: Int
  action: String!
  acted_by: Int!
  acted_at: String
  comment: String
  delegated_to: Int
  delegated_at: String
  request: ApprovalRequest
  step: ApprovalStep
  actor: User
  delegate: User
  creator: User
  updater: User
  created_at: String
  updated_at: String
}
```

## Queries

### approvalFlows

承認フロー一覧を取得します。

```graphql
query ApprovalFlows(
  $name: String
  $flow_type: String
  $is_active: Boolean
  $created_by: Int
  $limit: Int = 15
  $offset: Int = 0
  $sort_by: String = "created_at"
  $sort_order: String = "desc"
) {
  approvalFlows(
    name: $name
    flow_type: $flow_type
    is_active: $is_active
    created_by: $created_by
    limit: $limit
    offset: $offset
    sort_by: $sort_by
    sort_order: $sort_order
  ) {
    id
    name
    flow_type
    is_active
    step_count
    is_usable
    created_at
  }
}
```

**パラメータ:**
- `name`: フロー名での部分一致検索
- `flow_type`: フロータイプ（`estimate`, `budget`, `order`, `progress`, `payment`）
- `is_active`: アクティブ状態
- `created_by`: 作成者ID
- `limit`: 取得件数（デフォルト: 15）
- `offset`: オフセット（デフォルト: 0）
- `sort_by`: ソート項目（デフォルト: "created_at"）
- `sort_order`: ソート順序（デフォルト: "desc"）

### approvalRequests

承認依頼一覧を取得します。

```graphql
query ApprovalRequests(
  $status: String
  $request_type: String
  $priority: String
  $requested_by: Int
  $approval_flow_id: Int
  $is_expired: Boolean
  $limit: Int = 15
  $offset: Int = 0
) {
  approvalRequests(
    status: $status
    request_type: $request_type
    priority: $priority
    requested_by: $requested_by
    approval_flow_id: $approval_flow_id
    is_expired: $is_expired
    limit: $limit
    offset: $offset
  ) {
    id
    title
    status
    priority
    requester {
      id
      name
    }
    flow {
      id
      name
    }
    created_at
  }
}
```

**パラメータ:**
- `status`: ステータス（`pending`, `approved`, `rejected`, `returned`, `cancelled`）
- `request_type`: 依頼タイプ
- `priority`: 優先度（`low`, `normal`, `high`, `urgent`）
- `requested_by`: 依頼者ID
- `approval_flow_id`: 承認フローID
- `is_expired`: 期限切れフラグ
- `limit`: 取得件数（デフォルト: 15）
- `offset`: オフセット（デフォルト: 0）

## Mutations

### createApprovalFlow

新しい承認フローを作成します。

```graphql
mutation CreateApprovalFlow($input: CreateApprovalFlowInput!) {
  createApprovalFlow(input: $input) {
    id
    name
    flow_type
    is_active
    created_at
  }
}
```

**入力例:**
```json
{
  "input": {
    "name": "見積承認フロー（100万円以上）",
    "description": "100万円以上の見積に適用される承認フロー",
    "flow_type": "estimate",
    "is_active": true,
    "priority": 10
  }
}
```

### updateApprovalFlow

既存の承認フローを更新します。

```graphql
mutation UpdateApprovalFlow($id: Int!, $input: UpdateApprovalFlowInput!) {
  updateApprovalFlow(id: $id, input: $input) {
    id
    name
    flow_type
    is_active
    updated_at
  }
}
```

### deleteApprovalFlow

承認フローを削除します。

```graphql
mutation DeleteApprovalFlow($id: Int!) {
  deleteApprovalFlow(id: $id) {
    success
    message
  }
}
```

### createApprovalRequest

新しい承認依頼を作成します。

```graphql
mutation CreateApprovalRequest($input: CreateApprovalRequestInput!) {
  createApprovalRequest(input: $input) {
    id
    title
    status
    flow {
      id
      name
    }
    created_at
  }
}
```

**入力例:**
```json
{
  "input": {
    "approval_flow_id": 1,
    "request_type": "estimate",
    "request_id": 123,
    "title": "見積承認依頼：プロジェクトA",
    "description": "プロジェクトAの見積について承認をお願いします",
    "request_data": {
      "total_amount": 1500000,
      "department_id": 1,
      "project_id": 5
    },
    "priority": "normal",
    "expires_at": "2024-01-31T23:59:59Z"
  }
}
```

### approveRequest

承認依頼を承認します。

```graphql
mutation ApproveRequest($id: Int!, $comment: String) {
  approveRequest(id: $id, comment: $comment) {
    id
    status
    approved_by
    approved_at
  }
}
```

### rejectRequest

承認依頼を却下します。

```graphql
mutation RejectRequest($id: Int!, $comment: String) {
  rejectRequest(id: $id, comment: $comment) {
    id
    status
    rejected_by
    rejected_at
  }
}
```

### returnRequest

承認依頼を差し戻します。

```graphql
mutation ReturnRequest($id: Int!, $comment: String) {
  returnRequest(id: $id, comment: $comment) {
    id
    status
    returned_by
    returned_at
  }
}
```

### cancelRequest

承認依頼をキャンセルします。

```graphql
mutation CancelRequest($id: Int!, $comment: String) {
  cancelRequest(id: $id, comment: $comment) {
    id
    status
    cancelled_by
    cancelled_at
  }
}
```

## 使用例

### 承認フロー一覧の取得

```javascript
const query = `
  query {
    approvalFlows(flow_type: "estimate", is_active: true) {
      id
      name
      step_count
      conditions {
        id
        field_name
        operator
        value
      }
      steps {
        id
        name
        step_order
        approver_type
      }
    }
  }
`;

fetch('/graphql', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query })
})
.then(response => response.json())
.then(data => console.log(data));
```

### 承認依頼の作成

```javascript
const mutation = `
  mutation CreateApprovalRequest($input: CreateApprovalRequestInput!) {
    createApprovalRequest(input: $input) {
      id
      title
      status
      flow {
        name
      }
    }
  }
`;

const variables = {
  input: {
    approval_flow_id: 1,
    request_type: "estimate",
    request_id: 123,
    title: "見積承認依頼",
    request_data: {
      total_amount: 1500000
    }
  }
};

fetch('/graphql', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: mutation, variables })
})
.then(response => response.json())
.then(data => console.log(data));
```

### 承認処理

```javascript
const mutation = `
  mutation ApproveRequest($id: Int!, $comment: String) {
    approveRequest(id: $id, comment: $comment) {
      id
      status
      histories {
        action
        actor {
          name
        }
        comment
        acted_at
      }
    }
  }
`;

const variables = {
  id: 1,
  comment: "内容を確認し、承認いたします。"
};

fetch('/graphql', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: mutation, variables })
})
.then(response => response.json())
.then(data => console.log(data));
```

## エラーハンドリング

GraphQL API では、エラー情報は `errors` フィールドに格納されます。

```json
{
  "data": null,
  "errors": [
    {
      "message": "認証が必要です",
      "extensions": {
        "category": "authentication"
      }
    }
  ]
}
```

### 主なエラーカテゴリ

- **authentication**: 認証エラー
- **authorization**: 認可エラー
- **validation**: バリデーションエラー
- **business**: ビジネスロジックエラー

## 権限管理

承認フロー API の利用には以下の権限が必要です：

### フロー管理
- `approval.flow.manage`: フローの作成・更新・削除

### 承認依頼管理
- `approval.request.create`: 承認依頼の作成
- `approval.request.manage`: 承認依頼の管理
- `approval.request.approve`: 承認処理
- `approval.request.reject`: 却下処理
- `approval.request.return`: 差し戻し処理
- `approval.request.cancel`: キャンセル処理

## パフォーマンス最適化

### N+1問題の回避

GraphQL クエリでは、適切な `with` 句を使用してリレーションを事前読み込みしています。

```graphql
# 効率的なクエリ例
query {
  approvalRequests {
    id
    title
    requester {  # 事前読み込み済み
      name
    }
    flow {       # 事前読み込み済み
      name
    }
  }
}
```

### ページネーション

大量のデータを扱う場合は、`limit` と `offset` パラメータを使用してページネーションを実装してください。

```graphql
query {
  approvalRequests(limit: 20, offset: 40) {
    id
    title
  }
}
```

## まとめ

承認フロー GraphQL API は包括的な機能を提供し、複雑な承認ワークフローに対応できる柔軟性を持っています。適切な認証・認可機能と組み合わせることで、セキュアで効率的な承認システムを構築できます。
