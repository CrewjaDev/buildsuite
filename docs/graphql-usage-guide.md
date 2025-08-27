# GraphQL 使用ガイド

## 概要

BuildSuiteシステムでは、RESTful APIとGraphQLを併用して、用途に応じて最適なAPIを選択できるようにしています。

## API選択基準

### RESTful API（推奨）
- **用途**: 基本的なCRUD操作、シンプルなデータ取得
- **エンドポイント**: `/api/v1/*`
- **認証**: Laravel Sanctum
- **特徴**: 
  - シンプルで理解しやすい
  - 既存のコントローラーが充実
  - キャッシュが効きやすい
  - 既存システムとの統合が容易

### GraphQL（特定用途）
- **用途**: 複雑なデータ取得、承認フロー関連、柔軟なクエリ
- **エンドポイント**: `/graphql`
- **認証**: Laravel Sanctum
- **特徴**:
  - 複数テーブルの結合クエリ
  - フロントエンドの柔軟なデータ要求
  - オーバーフェッチ・アンダーフェッチの解決
  - 型安全性

## GraphQLの適用場面

### 1. 承認フロー関連の複雑なクエリ

```graphql
query UserPermissions($userId: Int!) {
  userPermissions(userId: $userId) {
    id
    name
    email
    system_level_info {
      code
      name
      priority
    }
    roles {
      id
      name
      display_name
      priority
    }
    departments {
      id
      name
      code
      position
      is_primary
      parent {
        id
        name
        code
      }
      children {
        id
        name
        code
      }
    }
    approval_permissions {
      can_approve_all
      can_reject_all
      can_return_all
      approval_limit
      approval_conditions {
        type
        department_id
        department_name
        position
      }
    }
    department_hierarchy {
      id
      name
      code
      level
      position
      is_primary
      parent {
        id
        name
        code
      }
      ancestors {
        id
        name
        code
        level
      }
      descendants {
        id
        name
        code
        level
      }
    }
  }
}
```

### 2. ユーザー一覧（柔軟なフィルタリング）

```graphql
query Users(
  $search: String
  $systemLevel: String
  $isActive: Boolean
  $departmentId: Int
  $roleId: Int
  $limit: Int
  $offset: Int
) {
  users(
    search: $search
    system_level: $systemLevel
    is_active: $isActive
    department_id: $departmentId
    role_id: $roleId
    limit: $limit
    offset: $offset
  ) {
    id
    employee_id
    name
    email
    system_level
    is_active
    is_admin
    last_login_at
    is_locked
    is_password_expired
    system_level_info {
      code
      name
      display_name
      priority
    }
    roles {
      id
      name
      display_name
      priority
    }
    departments {
      id
      name
      code
      position
      is_primary
    }
  }
}
```

## 実装例

### フロントエンドでの使用例

```typescript
// GraphQL クライアント設定
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: '/api/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

// 承認フロー用の権限取得
import { gql, useQuery } from '@apollo/client';

const GET_USER_PERMISSIONS = gql`
  query UserPermissions($userId: Int!) {
    userPermissions(userId: $userId) {
      id
      name
      approval_permissions {
        can_approve_all
        can_reject_all
        can_return_all
        approval_limit
        approval_conditions {
          type
          department_id
          department_name
          position
        }
      }
    }
  }
`;

function ApprovalComponent({ userId }: { userId: number }) {
  const { loading, error, data } = useQuery(GET_USER_PERMISSIONS, {
    variables: { userId }
  });

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラーが発生しました</div>;

  const { approval_permissions } = data.userPermissions;

  return (
    <div>
      <h2>承認権限</h2>
      <p>承認可能: {approval_permissions.can_approve_all ? 'はい' : 'いいえ'}</p>
      <p>却下可能: {approval_permissions.can_reject_all ? 'はい' : 'いいえ'}</p>
      <p>差し戻し可能: {approval_permissions.can_return_all ? 'はい' : 'いいえ'}</p>
      <p>承認上限: {approval_permissions.approval_limit ? 
        `${approval_permissions.approval_limit.toLocaleString()}円` : '制限なし'}</p>
    </div>
  );
}
```

### バックエンドでの実装

```php
// GraphQL Type定義
class UserType extends GraphQLType
{
    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'ユーザーID',
            ],
            'approval_permissions' => [
                'type' => Type::string(),
                'description' => '承認権限情報',
                'resolve' => function ($root) {
                    return $this->getApprovalPermissions($root);
                },
            ],
            // ... その他のフィールド
        ];
    }
}

// 複雑なクエリの実装
class UserPermissionsQuery extends Query
{
    public function resolve($root, $args, SelectFields $fields, $context)
    {
        $user = User::with([
            'systemLevel',
            'roles.permissions',
            'departments.permissions',
            'departments.parent',
            'departments.children',
        ])->find($args['user_id']);

        // 承認フロー用の権限情報を追加
        $user->approval_permissions = $this->getApprovalPermissions($user);
        
        return $user;
    }
}
```

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

### 1. 段階的な導入
- 既存のRESTful APIを維持
- 新機能からGraphQLを導入
- 段階的な移行計画

### 2. ドキュメント化
- GraphQLスキーマの文書化
- 使用例の提供
- チーム内での共有

### 3. テスト戦略
- GraphQLクエリのテスト
- 権限チェックのテスト
- パフォーマンステスト

## 今後の拡張予定

### 1. リアルタイム更新
- GraphQL Subscriptions
- WebSocket対応

### 2. 承認フロー機能
- 承認ステータスのリアルタイム更新
- 承認履歴の詳細取得

### 3. レポート機能
- 複雑な集計クエリ
- 動的なレポート生成

## まとめ

GraphQLは以下の場面で特に有効です：

1. **承認フロー関連**: 複雑な権限チェックと部署階層
2. **ダッシュボード**: 複数のデータソースからの情報取得
3. **レポート機能**: 柔軟なデータ集計と出力
4. **管理画面**: 詳細なユーザー・権限情報の表示

基本的なCRUD操作は引き続きRESTful APIを使用し、複雑なデータ取得が必要な場面でGraphQLを活用することで、システム全体の保守性とパフォーマンスを最適化できます。
