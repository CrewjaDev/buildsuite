# 承認依頼・承認機能 ボタン表示仕様書

## 概要

承認依頼と承認機能における業務データの状態に応じたボタン表示の仕様を定義します。見積データを例として、各状態での表示内容と動作を明確化します。

## 承認依頼機能

### 承認依頼者判定

#### 判定条件
1. **権限チェック**: ログインユーザーが `{business}.approval.request` 権限を持っているか
2. **業務データ状態**: 業務データが承認依頼可能な状態か
3. **承認依頼存在チェック**: 既に承認依頼が作成されていないか

#### 見積データの場合
- **権限**: `estimate.approval.request`
- **状態**: `status = 'draft'` かつ `approval_request_id IS NULL`

### 承認依頼作成ボタン表示

#### 表示条件
```typescript
const canRequestApproval = () => {
  // 1. バックエンドの状態チェック
  const backendCheck = estimate.can_request_approval
  
  // 2. フロントエンドの権限チェック
  const frontendCheck = hasPermission('estimate.approval.request')
  
  return backendCheck && frontendCheck
}
```

#### ボタン表示パターン

| 業務データ状態 | 権限 | 承認依頼存在 | 表示内容 | ボタン動作 |
|---|---|---|---|---|
| `draft` | ✅ あり | ❌ なし | 「承認依頼」ボタン | 承認依頼ダイアログを開く |
| `draft` | ❌ なし | ❌ なし | 非表示 | - |
| `submitted` | ✅ あり | ✅ あり | 承認状態バッジ | 非クリック可能 |
| `approved` | ✅ あり | ✅ あり | 「承認済み」バッジ | 非クリック可能 |
| `rejected` | ✅ あり | ✅ あり | 「却下」バッジ | 非クリック可能 |

#### 承認状態バッジ
```typescript
const getApprovalStatusBadge = (status: string) => {
  const statusMap = {
    'pending': { label: '承認待ち', variant: 'default', icon: Clock },
    'approved': { label: '承認済み', variant: 'default', icon: CheckCircle },
    'rejected': { label: '却下', variant: 'destructive', icon: XCircle },
    'returned': { label: '差し戻し', variant: 'secondary', icon: RotateCcw }
  }
  return statusMap[status] || { label: '不明', variant: 'secondary', icon: HelpCircle }
}
```

## 承認機能

### 承認者判定

#### 判定条件
1. **権限チェック**: ログインユーザーが `{business}.approval.*` 権限を持っているか
2. **承認者チェック**: ログインユーザーが現在の承認ステップの承認者か
3. **承認フロー状態**: 承認依頼が `pending` 状態か

#### 見積データの場合
- **権限**: `estimate.approval.approve`, `estimate.approval.reject`, `estimate.approval.return`
- **状態**: `approval_request.status = 'pending'`
- **承認者**: 現在の承認ステップの承認者に含まれる

### 承認機能ボタン表示

#### 表示条件
```typescript
const canApprove = () => {
  // 1. 承認依頼が存在するか
  if (!estimate.approval_request_id) return false
  
  // 2. 承認依頼が pending 状態か
  if (estimate.approval_status !== 'pending') return false
  
  // 3. 現在のユーザーが承認者か
  const isApprover = checkCurrentUserIsApprover(estimate.approval_request_id)
  
  // 4. 権限チェック
  const hasApprovePermission = hasPermission('estimate.approval.approve')
  const hasRejectPermission = hasPermission('estimate.approval.reject')
  const hasReturnPermission = hasPermission('estimate.approval.return')
  
  return isApprover && (hasApprovePermission || hasRejectPermission || hasReturnPermission)
}
```

#### ボタン表示パターン

| 承認依頼状態 | 承認者判定 | 権限 | 表示内容 | ボタン動作 |
|---|---|---|---|---|
| `pending` | ✅ 承認者 | ✅ あり | 承認ボタン群 | 承認処理ダイアログを開く |
| `pending` | ❌ 非承認者 | ✅ あり | 非表示 | - |
| `pending` | ✅ 承認者 | ❌ なし | 非表示 | - |
| `approved` | ✅ 承認者 | ✅ あり | 承認状態表示 | 非クリック可能 |
| `rejected` | ✅ 承認者 | ✅ あり | 承認状態表示 | 非クリック可能 |

#### 承認ボタン群
```typescript
const renderApprovalButtons = () => {
  if (!canApprove()) return null
  
  return (
    <div className="flex gap-2">
      {hasPermission('estimate.approval.approve') && (
        <Button 
          variant="default" 
          onClick={() => handleApproval('approve')}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          承認
        </Button>
      )}
      
      {hasPermission('estimate.approval.reject') && (
        <Button 
          variant="destructive" 
          onClick={() => handleApproval('reject')}
        >
          <XCircle className="h-4 w-4 mr-2" />
          却下
        </Button>
      )}
      
      {hasPermission('estimate.approval.return') && (
        <Button 
          variant="secondary" 
          onClick={() => handleApproval('return')}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          差し戻し
        </Button>
      )}
    </div>
  )
}
```

## 業務データ状態とボタン表示の関係

### 見積データの状態遷移

```
[draft] → [submitted] → [approved/rejected/returned]
   ↓           ↓              ↓
承認依頼    承認待ち        承認完了
ボタン      ボタン群        状態表示
```

### 状態別表示内容

#### 1. 下書き状態 (`draft`)
- **承認依頼者**: 「承認依頼」ボタン表示
- **承認者**: 非表示（承認依頼が存在しないため）

#### 2. 承認待ち状態 (`submitted` + `approval_status = 'pending'`)
- **承認依頼者**: 承認状態バッジ表示（「承認待ち」）
- **承認者**: 承認ボタン群表示（承認・却下・差し戻し）

#### 3. 承認完了状態 (`approved`/`rejected`/`returned`)
- **承認依頼者**: 承認状態バッジ表示（「承認済み」/「却下」/「差し戻し」）
- **承認者**: 承認状態バッジ表示（非クリック可能）

## 実装上の注意点

### 1. 権限チェックの2段階構成
- **1段階目**: ログインユーザーの基本権限
- **2段階目**: 承認フローで設定された許可権限

### 2. 状態の整合性
- 業務データの状態と承認依頼の状態の整合性を保つ
- 状態変更時のリアルタイム更新

### 3. エラーハンドリング
- 権限不足時の適切なメッセージ表示
- ネットワークエラー時の再試行機能

### 4. ユーザビリティ
- ボタンの有効/無効状態の明確な表示
- 操作前の確認ダイアログ
- 処理結果のフィードバック

## 関連ファイル

- `EstimateApprovalRequestButton.tsx` - 承認依頼ボタン
- `EstimateDetailView.tsx` - 見積詳細ページ（承認ボタン追加予定）
- `ApprovalProcessDialog.tsx` - 承認処理ダイアログ（作成予定）
- `EstimateApprovalController.php` - 承認処理API
