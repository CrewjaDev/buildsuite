# 承認権限システム API仕様書

## 概要
承認権限システムのAPI仕様書です。ステップ別設定、編集制御、権限チェック機能のエンドポイントを定義します。

## ベースURL
```
/api
```

## 認証
すべてのAPIは認証が必要です。Bearer Tokenを使用してください。

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "message": "操作が完了しました"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "message": "エラーメッセージ",
  "error": "詳細なエラー情報",
  "errors": { ... } // バリデーションエラーの場合
}
```

### HTTPステータスコード
- `200` - 成功
- `400` - バリデーションエラー
- `401` - 認証エラー
- `403` - 権限エラー
- `404` - リソースが見つからない
- `409` - 競合エラー（編集中等）
- `500` - サーバーエラー

---

## 1. 承認フロー設定 API

### 1.1 承認フロー一覧取得
```http
GET /api/approval-flows
```

#### レスポンス
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "見積承認フロー",
      "description": "金額に応じた段階的承認フロー",
      "flow_type": "estimate",
      "priority": 1,
      "is_active": true,
      "is_system": false,
      "flow_config": {
        "allow_editing_after_request": true,
        "allow_cancellation_after_request": true,
        "step_settings": {
          "step_1": {
            "editing_conditions": {
              "allow_during_pending": true,
              "allow_during_reviewing": false,
              "allow_during_step_approved": true,
              "allow_during_expired": false
            },
            "cancellation_conditions": {
              "allow_during_pending": true,
              "allow_during_reviewing": false,
              "allow_during_step_approved": false,
              "allow_during_expired": false
            }
          }
        }
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 1.2 承認フロー詳細取得
```http
GET /api/approval-flows/{id}
```

#### パラメータ
- `id` (integer) - 承認フローID

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "見積承認フロー",
    "description": "金額に応じた段階的承認フロー",
    "flow_type": "estimate",
    "conditions": { ... },
    "requesters": [ ... ],
    "approval_steps": [ ... ],
    "flow_config": { ... },
    "priority": 1,
    "is_active": true,
    "is_system": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 1.3 承認フロー設定更新
```http
PUT /api/approval-flows/{id}
```

#### パラメータ
- `id` (integer) - 承認フローID

#### リクエストボディ
```json
{
  "name": "見積承認フロー（更新）",
  "description": "更新された説明",
  "flow_config": {
    "allow_editing_after_request": true,
    "allow_cancellation_after_request": true,
    "step_settings": {
      "step_1": {
        "editing_conditions": {
          "allow_during_pending": true,
          "allow_during_reviewing": false,
          "allow_during_step_approved": true,
          "allow_during_expired": false
        },
        "cancellation_conditions": {
          "allow_during_pending": true,
          "allow_during_reviewing": false,
          "allow_during_step_approved": false,
          "allow_during_expired": false
        }
      }
    }
  }
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "見積承認フロー（更新）",
    "description": "更新された説明",
    "flow_config": { ... },
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "承認フローが更新されました"
}
```

### 1.4 ステップ別設定更新
```http
PUT /api/approval-flows/{id}/step-config/{step}
```

#### パラメータ
- `id` (integer) - 承認フローID
- `step` (integer) - ステップ番号

#### リクエストボディ
```json
{
  "editing_conditions": {
    "allow_during_pending": true,
    "allow_during_reviewing": false,
    "allow_during_step_approved": true,
    "allow_during_expired": false
  },
  "cancellation_conditions": {
    "allow_during_pending": true,
    "allow_during_reviewing": false,
    "allow_during_step_approved": false,
    "allow_during_expired": false
  }
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "step": 1,
    "editing_conditions": { ... },
    "cancellation_conditions": { ... }
  },
  "message": "ステップ設定が更新されました"
}
```

---

## 2. 承認依頼操作 API

### 2.1 承認依頼詳細取得（権限情報付き）
```http
GET /api/approval-requests/{id}
```

#### パラメータ
- `id` (integer) - 承認依頼ID

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "新築工事見積承認依頼",
    "description": "東京都渋谷区の新築工事",
    "request_type": "estimate",
    "request_id": "uuid-string",
    "current_step": 1,
    "status": "pending",
    "sub_status": "null",
    "priority": "normal",
    "requested_by": 5,
    "requester_name": "大野五郎",
    "editing_user_id": null,
    "editing_user_name": null,
    "status_display": {
      "main_status": "pending",
      "sub_status": "null",
      "display_text": "承認待ち",
      "color": "orange",
      "icon": "clock"
    },
    "approval_flow": { ... },
    "request_data": { ... },
    "histories": [ ... ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "user_permissions": {
    "can_edit": true,
    "can_cancel": true,
    "can_approve": false,
    "can_reject": false,
    "can_return": false,
    "is_requester": true,
    "is_approver": false
  }
}
```

### 2.2 編集開始
```http
POST /api/approval-requests/{id}/start-editing
```

#### パラメータ
- `id` (integer) - 承認依頼ID

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sub_status": "editing",
    "editing_user_id": 5,
    "editing_user_name": "大野五郎",
    "editing_started_at": "2024-01-01T00:00:00Z"
  },
  "message": "編集を開始しました"
}
```

#### エラーケース
- `403` - 編集権限がない
- `409` - 他のユーザーが編集中

### 2.3 編集終了
```http
POST /api/approval-requests/{id}/stop-editing
```

#### パラメータ
- `id` (integer) - 承認依頼ID

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sub_status": "null",
    "editing_user_id": null,
    "editing_user_name": null,
    "editing_started_at": null
  },
  "message": "編集を終了しました"
}
```

### 2.4 審査開始
```http
POST /api/approval-requests/{id}/start-reviewing
```

#### パラメータ
- `id` (integer) - 承認依頼ID

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sub_status": "reviewing",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "審査を開始しました"
}
```

#### エラーケース
- `403` - 承認者ではない

### 2.5 承認処理（更新版）
```http
POST /api/approval-requests/{id}/approve
```

#### パラメータ
- `id` (integer) - 承認依頼ID

#### リクエストボディ
```json
{
  "comment": "承認します"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "pending",
    "sub_status": "null",
    "current_step": 2,
    "approved_by": 5,
    "approved_at": "2024-01-01T00:00:00Z"
  },
  "message": "承認が完了しました"
}
```

#### エラーケース
- `403` - 承認権限がない

### 2.6 却下処理（更新版）
```http
POST /api/approval-requests/{id}/reject
```

#### パラメータ
- `id` (integer) - 承認依頼ID

#### リクエストボディ
```json
{
  "comment": "却下します"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "rejected",
    "sub_status": "null",
    "rejected_by": 5,
    "rejected_at": "2024-01-01T00:00:00Z"
  },
  "message": "却下が完了しました"
}
```

### 2.7 差し戻し処理（更新版）
```http
POST /api/approval-requests/{id}/return
```

#### パラメータ
- `id` (integer) - 承認依頼ID

#### リクエストボディ
```json
{
  "comment": "差し戻します",
  "return_to_step": 1
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "returned",
    "sub_status": "null",
    "current_step": 1,
    "returned_by": 5,
    "returned_at": "2024-01-01T00:00:00Z"
  },
  "message": "差し戻しが完了しました"
}
```

### 2.8 キャンセル処理（更新版）
```http
POST /api/approval-requests/{id}/cancel
```

#### パラメータ
- `id` (integer) - 承認依頼ID

#### リクエストボディ
```json
{
  "comment": "キャンセルします"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "cancelled",
    "sub_status": "null",
    "cancelled_by": 5,
    "cancelled_at": "2024-01-01T00:00:00Z"
  },
  "message": "キャンセルが完了しました"
}
```

---

## 3. 承認依頼一覧 API

### 3.1 承認依頼一覧取得（サブステータス対応）
```http
GET /api/approval-requests
```

#### クエリパラメータ
- `status` (string) - ステータスフィルタ
- `sub_status` (string) - サブステータスフィルタ
- `editing` (boolean) - 編集中フィルタ
- `page` (integer) - ページ番号
- `per_page` (integer) - 1ページあたりの件数

#### レスポンス
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "新築工事見積承認依頼",
      "request_type": "estimate",
      "current_step": 1,
      "status": "pending",
      "sub_status": "editing",
      "priority": "normal",
      "requester_name": "大野五郎",
      "editing_user_name": "大野五郎",
      "status_display": {
        "main_status": "pending",
        "sub_status": "editing",
        "display_text": "編集中",
        "color": "blue",
        "icon": "edit"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 100,
    "last_page": 5
  }
}
```

---

## 4. エラーレスポンス詳細

### 4.1 権限エラー (403)
```json
{
  "success": false,
  "message": "編集権限がありません",
  "error": "Permission denied"
}
```

### 4.2 競合エラー (409)
```json
{
  "success": false,
  "message": "他のユーザーが編集中です",
  "error": "Conflict: Another user is editing"
}
```

### 4.3 バリデーションエラー (400)
```json
{
  "success": false,
  "message": "バリデーションエラー",
  "errors": {
    "comment": ["コメントは必須です"],
    "return_to_step": ["差し戻し先ステップは必須です"]
  }
}
```

---

## 5. 使用例

### 5.1 編集開始から終了までの流れ
```javascript
// 1. 承認依頼詳細を取得
const response = await fetch('/api/approval-requests/1');
const { data, user_permissions } = await response.json();

// 2. 編集権限をチェック
if (user_permissions.can_edit) {
  // 3. 編集開始
  const startResponse = await fetch('/api/approval-requests/1/start-editing', {
    method: 'POST'
  });
  
  // 4. 編集作業...
  
  // 5. 編集終了
  const stopResponse = await fetch('/api/approval-requests/1/stop-editing', {
    method: 'POST'
  });
}
```

### 5.2 ステップ別設定の更新
```javascript
// ステップ1の編集条件を更新
const response = await fetch('/api/approval-flows/1/step-config/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    editing_conditions: {
      allow_during_pending: true,
      allow_during_reviewing: false,
      allow_during_step_approved: true,
      allow_during_expired: false
    },
    cancellation_conditions: {
      allow_during_pending: true,
      allow_during_reviewing: false,
      allow_during_step_approved: false,
      allow_during_expired: false
    }
  })
});
```

---

## 6. 注意事項

### 6.1 権限チェック
- すべての操作で権限チェックが実行されます
- フロー設定とユーザー権限の両方がチェックされます

### 6.2 排他制御
- 編集開始時は排他制御が適用されます
- 他のユーザーが編集中の場合は編集開始できません

### 6.3 ステータス遷移
- 承認・却下・差し戻し・キャンセル時はサブステータスがクリアされます
- ステップ承認時は次のステップに進みます

### 6.4 パフォーマンス
- 大量データの場合はページネーションを使用してください
- 権限チェックはキャッシュされる場合があります
