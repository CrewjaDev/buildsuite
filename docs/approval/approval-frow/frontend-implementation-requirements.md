# 承認権限システム フロントエンド実装要件

## 概要
承認権限システムのバックエンド実装は完了していますが、フロントエンド側の実装が必要です。

## 実装が必要な画面・機能

### 1. 承認フロー設定画面

#### 1.1 基本設定
- フロー名、説明の編集
- フロータイプの選択
- アクティブ状態の切り替え

#### 1.2 ステップ別設定
- 各承認ステップの編集・キャンセル条件設定
- サブステータス別の許可設定
  - `allow_during_pending`: 承認待ち中の編集・キャンセル許可
  - `allow_during_reviewing`: 審査中の編集・キャンセル許可
  - `allow_during_step_approved`: ステップ承認後の編集・キャンセル許可
  - `allow_during_expired`: 期限切れ後の編集・キャンセル許可

#### 1.3 設定UI例
```typescript
interface StepConfig {
  step: number;
  name: string;
  editingConditions: {
    allow_during_pending: boolean;
    allow_during_reviewing: boolean;
    allow_during_step_approved: boolean;
    allow_during_expired: boolean;
  };
  cancellationConditions: {
    allow_during_pending: boolean;
    allow_during_reviewing: boolean;
    allow_during_step_approved: boolean;
    allow_during_expired: boolean;
  };
}
```

### 2. 承認依頼詳細画面

#### 2.1 権限に基づくボタン表示
- 編集開始ボタン（`can_edit`がtrueの場合のみ）
- 編集終了ボタン（編集中の場合のみ）
- 審査開始ボタン（承認者かつ`can_approve`がtrueの場合のみ）
- キャンセルボタン（`can_cancel`がtrueの場合のみ）

#### 2.2 ステータス表示
- メインステータス（pending, approved, rejected等）
- サブステータス（null, reviewing, editing, step_approved, expired）
- 編集中ユーザー情報（編集中の場合）

#### 2.3 権限情報の表示
```typescript
interface UserPermissions {
  can_edit: boolean;
  can_cancel: boolean;
  can_approve: boolean;
  can_reject: boolean;
  can_return: boolean;
  is_requester: boolean;
  is_approver: boolean;
}
```

### 3. 承認依頼一覧画面

#### 3.1 ステータス表示の更新
- サブステータスの表示
- 編集中の表示
- 権限に基づくアクションボタン

#### 3.2 フィルタリング機能
- サブステータス別フィルタ
- 編集中の承認依頼フィルタ

## 実装が必要なAPI呼び出し

### 1. 承認フロー設定関連
```typescript
// フロー設定の取得
GET /api/approval-flows/{id}

// フロー設定の更新
PUT /api/approval-flows/{id}

// ステップ別設定の更新
PUT /api/approval-flows/{id}/step-config/{step}
```

### 2. 承認依頼操作関連
```typescript
// 編集開始
POST /api/approval-requests/{id}/start-editing

// 編集終了
POST /api/approval-requests/{id}/stop-editing

// 審査開始
POST /api/approval-requests/{id}/start-reviewing

// 承認依頼詳細（権限情報付き）
GET /api/approval-requests/{id}
```

## 実装優先度

### 高優先度
1. **承認依頼詳細画面の更新**
   - 権限に基づくボタン表示制御
   - ステータス表示の更新
   - 編集開始・終了機能

2. **承認依頼一覧画面の更新**
   - サブステータス表示
   - 編集中の表示

### 中優先度
3. **承認フロー設定画面**
   - ステップ別設定UI
   - フロー設定の管理

### 低優先度
4. **高度な機能**
   - フィルタリング機能
   - 一括操作機能

## 技術要件

### フロントエンド技術スタック
- React/Vue.js（既存の技術スタックに合わせる）
- TypeScript
- 状態管理（Redux/Vuex等）

### UI/UX要件
- レスポンシブデザイン
- アクセシビリティ対応
- エラーハンドリング
- ローディング状態の表示

### セキュリティ要件
- 権限チェックの実装
- CSRF対策
- XSS対策

## 実装例

### 承認依頼詳細画面のコンポーネント例
```typescript
interface ApprovalRequestDetailProps {
  requestId: number;
}

const ApprovalRequestDetail: React.FC<ApprovalRequestDetailProps> = ({ requestId }) => {
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovalRequest();
  }, [requestId]);

  const fetchApprovalRequest = async () => {
    try {
      const response = await api.get(`/approval-requests/${requestId}`);
      setRequest(response.data.data);
      setPermissions(response.data.user_permissions);
    } catch (error) {
      console.error('承認依頼の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditing = async () => {
    try {
      await api.post(`/approval-requests/${requestId}/start-editing`);
      fetchApprovalRequest(); // データを再取得
    } catch (error) {
      console.error('編集開始に失敗しました:', error);
    }
  };

  const handleStopEditing = async () => {
    try {
      await api.post(`/approval-requests/${requestId}/stop-editing`);
      fetchApprovalRequest(); // データを再取得
    } catch (error) {
      console.error('編集終了に失敗しました:', error);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!request || !permissions) return <ErrorMessage />;

  return (
    <div className="approval-request-detail">
      <h1>{request.title}</h1>
      
      {/* ステータス表示 */}
      <StatusDisplay 
        status={request.status} 
        subStatus={request.sub_status}
        editingUser={request.editing_user_name}
      />
      
      {/* アクションボタン */}
      <div className="action-buttons">
        {permissions.can_edit && (
          <button onClick={handleStartEditing}>
            編集開始
          </button>
        )}
        
        {request.sub_status === 'editing' && (
          <button onClick={handleStopEditing}>
            編集終了
          </button>
        )}
        
        {permissions.can_approve && (
          <button onClick={handleApprove}>
            承認
          </button>
        )}
        
        {permissions.can_cancel && (
          <button onClick={handleCancel}>
            キャンセル
          </button>
        )}
      </div>
      
      {/* 承認依頼の詳細内容 */}
      <ApprovalRequestContent request={request} />
    </div>
  );
};
```

## 次のステップ

1. **フロントエンド開発チームとの連携**
   - 要件の共有
   - 技術仕様の確認
   - 開発スケジュールの調整

2. **API仕様書の作成**
   - エンドポイントの詳細仕様
   - リクエスト・レスポンス形式
   - エラーハンドリング

3. **UI/UXデザインの作成**
   - 画面設計
   - ユーザーフロー
   - プロトタイプ

4. **実装・テスト**
   - コンポーネント実装
   - 統合テスト
   - ユーザーテスト
