# ユーザー別承認状態表示仕様書

## 概要

承認フローにおいて、各ユーザーが自分の承認状態を正しく把握できるよう、ユーザーごとに異なる承認状態を表示する仕様を定義します。

## 問題の背景

### 現在の問題
- 承認依頼の全体ステータス（`pending`, `approved`, `rejected`）のみ表示
- ユーザーが自分の承認状況を把握できない
- 承認済みユーザーも「承認待ち」と表示されてしまう

### 期待される動作
- **山田太郎（ステップ1承認済み）**: 「承認済み」と表示
- **社長（ステップ2承認待ち）**: 「承認待ち」と表示
- **承認依頼作成者**: 全体の進行状況を把握

## ユーザー別承認状態の定義

### 状態の種類
1. **承認済み**: ユーザーが担当するステップを承認済み
2. **承認待ち**: ユーザーが担当するステップが現在のステップ
3. **未開始**: ユーザーが担当するステップがまだ開始されていない
4. **完了**: 承認フロー全体が完了
5. **却下/差し戻し**: 承認フローが却下または差し戻しされた

### 判定ロジック

```typescript
interface UserApprovalStatus {
  status: 'completed' | 'pending' | 'not_started' | 'finished' | 'rejected' | 'returned'
  step: number
  stepName: string
  canAct: boolean
  message: string
}

const getUserApprovalStatus = (user: User, approvalRequest: ApprovalRequest): UserApprovalStatus => {
  // 1. 承認フロー全体の状態をチェック
  if (approvalRequest.status === 'approved') {
    return {
      status: 'finished',
      step: approvalRequest.current_step,
      stepName: '承認完了',
      canAct: false,
      message: '承認が完了しました'
    }
  }
  
  if (approvalRequest.status === 'rejected') {
    return {
      status: 'rejected',
      step: approvalRequest.current_step,
      stepName: '却下',
      canAct: false,
      message: '承認が却下されました'
    }
  }
  
  if (approvalRequest.status === 'returned') {
    return {
      status: 'returned',
      step: approvalRequest.current_step,
      stepName: '差し戻し',
      canAct: false,
      message: '承認が差し戻しされました'
    }
  }
  
  // 2. ユーザーが担当するステップを特定
  const userStep = findUserStep(user, approvalRequest.approvalFlow)
  
  if (!userStep) {
    return {
      status: 'not_started',
      step: 0,
      stepName: '対象外',
      canAct: false,
      message: '承認対象ではありません'
    }
  }
  
  // 3. ユーザーのステップと現在のステップを比較
  if (userStep.step < approvalRequest.current_step) {
    // ユーザーのステップは既に完了
    return {
      status: 'completed',
      step: userStep.step,
      stepName: userStep.name,
      canAct: false,
      message: '承認済み'
    }
  }
  
  if (userStep.step === approvalRequest.current_step) {
    // ユーザーのステップが現在のステップ
    return {
      status: 'pending',
      step: userStep.step,
      stepName: userStep.name,
      canAct: true,
      message: '承認待ち'
    }
  }
  
  // ユーザーのステップはまだ開始されていない
  return {
    status: 'not_started',
    step: userStep.step,
    stepName: userStep.name,
    canAct: false,
    message: '承認待ち（未開始）'
  }
}
```

## データベース設計

### 既存テーブルの活用
- **`approval_requests`**: 承認依頼の基本情報
- **`approval_histories`**: 承認履歴（誰がいつ何をしたか）
- **`approval_flows`**: 承認フローの定義

### 追加が必要な機能
1. **ユーザー別ステップ判定**: ユーザーがどのステップの承認者かを判定
2. **承認履歴ベースの状態判定**: 履歴からユーザーの承認状況を判定

## バックエンド実装

### 1. ApprovalRequestモデルにメソッド追加

```php
class ApprovalRequest extends Model
{
    /**
     * 指定されたユーザーの承認状態を取得
     */
    public function getUserApprovalStatus(User $user): array
    {
        // 承認フロー全体の状態をチェック
        if ($this->status === 'approved') {
            return [
                'status' => 'finished',
                'step' => $this->current_step,
                'step_name' => '承認完了',
                'can_act' => false,
                'message' => '承認が完了しました'
            ];
        }
        
        if (in_array($this->status, ['rejected', 'returned'])) {
            return [
                'status' => $this->status,
                'step' => $this->current_step,
                'step_name' => $this->status === 'rejected' ? '却下' : '差し戻し',
                'can_act' => false,
                'message' => $this->status === 'rejected' ? '承認が却下されました' : '承認が差し戻しされました'
            ];
        }
        
        // ユーザーが担当するステップを特定
        $userStep = $this->getUserStep($user);
        
        if (!$userStep) {
            return [
                'status' => 'not_started',
                'step' => 0,
                'step_name' => '対象外',
                'can_act' => false,
                'message' => '承認対象ではありません'
            ];
        }
        
        // ユーザーのステップと現在のステップを比較
        if ($userStep['step'] < $this->current_step) {
            // ユーザーのステップは既に完了
            return [
                'status' => 'completed',
                'step' => $userStep['step'],
                'step_name' => $userStep['name'],
                'can_act' => false,
                'message' => '承認済み'
            ];
        }
        
        if ($userStep['step'] === $this->current_step) {
            // ユーザーのステップが現在のステップ
            return [
                'status' => 'pending',
                'step' => $userStep['step'],
                'step_name' => $userStep['name'],
                'can_act' => true,
                'message' => '承認待ち'
            ];
        }
        
        // ユーザーのステップはまだ開始されていない
        return [
            'status' => 'not_started',
            'step' => $userStep['step'],
            'step_name' => $userStep['name'],
            'can_act' => false,
            'message' => '承認待ち（未開始）'
        ];
    }
    
    /**
     * 指定されたユーザーが担当するステップを取得
     */
    private function getUserStep(User $user): ?array
    {
        $flow = $this->approvalFlow;
        if (!$flow || !$flow->approval_steps) {
            return null;
        }
        
        foreach ($flow->approval_steps as $step) {
            if ($step['step'] === 0) continue; // ステップ0は承認依頼作成なので除外
            
            // ユーザーがこのステップの承認者かチェック
            if ($this->isUserApproverForStep($user, $step)) {
                return $step;
            }
        }
        
        return null;
    }
    
    /**
     * ユーザーが指定されたステップの承認者かチェック
     */
    private function isUserApproverForStep(User $user, array $step): bool
    {
        if (!isset($step['approvers'])) {
            return false;
        }
        
        foreach ($step['approvers'] as $approver) {
            if ($this->checkApproverMatch($user, $approver)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 承認者条件とユーザーの一致をチェック
     */
    private function checkApproverMatch(User $user, array $approver): bool
    {
        switch ($approver['type']) {
            case 'user':
                return $user->id == $approver['value'];
            case 'system_level':
                return $user->system_level === $approver['value'];
            case 'department':
                $employee = $user->employee;
                return $employee && $employee->department_id == $approver['value'];
            case 'position':
                $employee = $user->employee;
                return $employee && $employee->position_id == $approver['value'];
            default:
                return false;
        }
    }
}
```

### 2. APIエンドポイント追加

```php
// EstimateApprovalController.php
public function getUserApprovalStatus(string $id): JsonResponse
{
    try {
        $estimate = Estimate::findOrFail($id);
        $user = auth()->user();
        
        if (!$estimate->approval_request_id) {
            return response()->json([
                'status' => 'not_started',
                'step' => 0,
                'step_name' => '承認依頼なし',
                'can_act' => false,
                'message' => '承認依頼が作成されていません'
            ]);
        }
        
        $approvalRequest = ApprovalRequest::find($estimate->approval_request_id);
        $userStatus = $approvalRequest->getUserApprovalStatus($user);
        
        return response()->json($userStatus);
        
    } catch (\Exception $e) {
        return response()->json(['error' => '承認状態の取得に失敗しました'], 500);
    }
}
```

## フロントエンド実装

### 1. 型定義の追加

```typescript
interface UserApprovalStatus {
  status: 'completed' | 'pending' | 'not_started' | 'finished' | 'rejected' | 'returned'
  step: number
  step_name: string
  can_act: boolean
  message: string
}

interface Estimate {
  // ... 既存のプロパティ
  user_approval_status?: UserApprovalStatus
}
```

### 2. サービス関数の追加

```typescript
// estimateApprovalService.ts
export const getUserApprovalStatus = async (estimateId: string): Promise<UserApprovalStatus> => {
  try {
    const response = await api.get(`/estimates/${estimateId}/approval/user-status`)
    return response.data
  } catch (error) {
    console.error('ユーザー承認状態取得エラー:', error)
    throw new Error('ユーザー承認状態の取得に失敗しました')
  }
}
```

### 3. コンポーネントでの使用

```typescript
// EstimateDetailView.tsx
const [userApprovalStatus, setUserApprovalStatus] = useState<UserApprovalStatus | null>(null)

useEffect(() => {
  const fetchUserApprovalStatus = async () => {
    if (estimate.approval_request_id) {
      try {
        const status = await getUserApprovalStatus(estimate.id)
        setUserApprovalStatus(status)
      } catch (error) {
        console.error('ユーザー承認状態の取得に失敗:', error)
      }
    }
  }
  
  fetchUserApprovalStatus()
}, [estimate.id, estimate.approval_request_id])

// ユーザー別承認状態バッジの表示
const getUserApprovalStatusBadge = () => {
  if (!userApprovalStatus) return null
  
  const statusMap = {
    'completed': { label: '承認済み', variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    'pending': { label: '承認待ち', variant: 'default' as const, icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    'not_started': { label: '承認待ち（未開始）', variant: 'outline' as const, icon: Clock, color: 'bg-gray-100 text-gray-600' },
    'finished': { label: '承認完了', variant: 'default' as const, icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
    'rejected': { label: '却下', variant: 'destructive' as const, icon: XCircle, color: 'bg-red-100 text-red-800' },
    'returned': { label: '差し戻し', variant: 'secondary' as const, icon: RotateCcw, color: 'bg-orange-100 text-orange-800' }
  }
  
  const config = statusMap[userApprovalStatus.status] || statusMap.pending
  const IconComponent = config.icon
  
  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
      <IconComponent className="h-4 w-4" />
      {config.label}
    </Badge>
  )
}
```

## 表示例

### 山田太郎（ステップ1承認済み）の表示
```
[承認済み] ✅ ステップ1: 上長承認  ⏳ ステップ2: 社長承認
```

### 社長（ステップ2承認待ち）の表示
```
[承認待ち] ✅ ステップ1: 上長承認  ⏳ ステップ2: 社長承認
```

### 承認依頼作成者の表示
```
[承認待ち] ✅ ステップ1: 上長承認  ⏳ ステップ2: 社長承認
```

## 実装の優先順位

1. **Phase 1**: バックエンドのユーザー別承認状態判定機能
2. **Phase 2**: APIエンドポイントの追加
3. **Phase 3**: フロントエンドの型定義とサービス関数
4. **Phase 4**: コンポーネントでの表示実装
5. **Phase 5**: テストとデバッグ

## テスト仕様

### 単体テスト
- 各ユーザー状態の判定ロジック
- 承認履歴ベースの状態判定

### 統合テスト
- 複数ユーザーでの承認フロー進行
- ユーザー別状態表示の確認

### E2Eテスト
- 実際の承認フローでのユーザー別表示確認
