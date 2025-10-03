# ApprovalPermissionService 実装仕様書

## 概要

ApprovalPermissionServiceは、承認フローにおける権限チェックロジックを集約し、**承認フロー設定**と**既存のユーザー権限システム**を連携させるサービスです。

### 設計思想

1. **承認フロー設定による制御**: フローごとの編集・キャンセル許可設定を管理
2. **既存権限システムとの連携**: 現状のpermissionシステムをそのまま活用
3. **権限チェックロジックの集約**: 複雑な権限判定を一箇所に集約
4. **シンプルな実装**: 不要な権限追加を避け、既存システムを活用

## ApprovalFlowServiceとの役割の違い

### ApprovalFlowService（既存）
- **役割**: 承認フローの選択・適用・検証を担当
- **主な機能**:
  - 承認フローの選択（`selectApprovalFlow`）
  - 適用条件のマッチング（`matchesConditions`）
  - 承認ステップの動的決定（`determineApprovalSteps`）
  - 承認フローの検証（`validateFlow`）
- **処理タイミング**: 承認依頼作成時、フロー選択時
- **対象**: 承認フロー全体の管理

#### ApprovalFlowServiceの実装例
```php
// 承認依頼作成時の承認フロー選択
public function selectApprovalFlow(array $requestData, int $userId): ?ApprovalFlow
{
    $user = User::with('employee')->find($userId);
    
    $availableFlows = ApprovalFlow::where('is_active', true)
        ->where('flow_type', $requestData['flow_type'] ?? 'general')
        ->orderBy('priority')
        ->get();
    
    foreach ($availableFlows as $flow) {
        // 1. 承認依頼者権限チェック
        if (!$flow->canCreateApprovalRequest($user)) {
            continue;
        }
        
        // 2. 適用条件チェック
        if (!$this->matchesConditions($flow, $requestData)) {
            continue;
        }
        
        return $flow;
    }
    
    return null;
}
```

### ApprovalPermissionService（新規作成）
- **役割**: 承認依頼に対する操作権限のチェックを担当
- **主な機能**:
  - ユーザーの権限情報取得（`getUserPermissions`）
  - 編集権限チェック（`canEdit`）
  - キャンセル権限チェック（`canCancel`）
  - 承認権限チェック（`canApprove`）
  - 却下権限チェック（`canReject`）
  - 差し戻し権限チェック（`canReturn`）
- **処理タイミング**: 承認依頼の操作時（編集、キャンセル、承認等）
- **対象**: 承認依頼に対する個別の操作権限

#### ApprovalPermissionServiceの実装例
```php
// 承認依頼編集時の権限チェック
public function canEdit(User $user, ApprovalRequest $approvalRequest): bool
{
    // 1. レイヤー1: 承認フロー設定での許可チェック
    if (!$this->checkFlowConfig($approvalRequest, 'edit')) {
        return false;
    }
    
    // 2. レイヤー2: 既存のユーザー権限チェック
    $requestType = $approvalRequest->request_type;
    if (!$this->permissionService->hasPermission($user, "{$requestType}.edit")) {
        return false;
    }
    
    // 3. 業務ロジックチェック
    return $approvalRequest->canEdit($user);
}
```

### 役割の比較表

| 項目 | ApprovalFlowService | ApprovalPermissionService |
|------|---------------------|--------------------------|
| **主な役割** | 承認フローの選択・適用 | 承認依頼操作の権限チェック |
| **処理対象** | 承認フロー全体 | 承認依頼の個別操作 |
| **処理タイミング** | 承認依頼作成時 | 承認依頼操作時（編集、キャンセル、承認等） |
| **チェック内容** | フロー選択条件、ステップ決定 | 操作権限（編集、キャンセル、承認等） |
| **依存関係** | ApprovalFlowモデル | ApprovalRequestモデル、PermissionService |
| **設定参照** | 適用条件（conditions） | フロー設定（flow_config）、ユーザー権限 |
| **連携対象** | ApprovalRequestモデル | 既存のPermissionService |

### 連携の流れ

```
[承認依頼作成時]
ApprovalFlowService
    ↓ フロー選択
ApprovalRequestモデル
    ↓ 承認依頼作成
ApprovalRequestController

[承認依頼操作時]
ApprovalRequestController
    ↓ 権限チェック依頼
ApprovalPermissionService
    ↓ フロー設定チェック
ApprovalFlow.flow_config
    ↓ ユーザー権限チェック
PermissionService
    ↓ 業務ロジックチェック
ApprovalRequestモデル
```

### 責任の分離

#### ApprovalFlowServiceの責任
- どの承認フローを適用するか決定
- 承認ステップの動的な決定
- 承認フローの妥当性検証

#### ApprovalPermissionServiceの責任
- 承認依頼に対する操作が許可されているか判定
- フロー設定とユーザー権限の統合チェック
- UIに表示する権限情報の提供

### 使い分けの例

#### ApprovalFlowServiceを使う場面
```php
// 承認依頼作成時に適切なフローを選択
$approvalFlow = $approvalFlowService->selectApprovalFlow($requestData, $userId);
if (!$approvalFlow) {
    return response()->json(['error' => '適用可能な承認フローがありません'], 400);
}

// 次の承認ステップを決定
$applicableSteps = $approvalFlowService->determineApprovalSteps($approvalRequest);
```

#### ApprovalPermissionServiceを使う場面
```php
// 承認依頼編集時に権限をチェック
if (!$approvalPermissionService->canEdit($user, $approvalRequest)) {
    return response()->json(['error' => '編集権限がありません'], 403);
}

// UIに表示する権限情報を取得
$userPermissions = $approvalPermissionService->getUserPermissions($user, $approvalRequest);
return response()->json([
    'data' => $approvalRequest,
    'user_permissions' => $userPermissions
]);
```

## 権限チェックの構成

### 2層の権限チェック

#### レイヤー1: 承認フロー設定層（ApprovalFlow.flow_config）
- **役割**: フローごとの編集・キャンセル許可設定
- **管理場所**: 承認管理ページの承認フロー設定
- **設定内容**: ステップ別の編集・キャンセル許可

#### レイヤー2: ユーザー権限層（Permissionテーブル）
- **役割**: ログインユーザーの権限付与
- **管理場所**: 権限設定ページと社員管理
- **設定内容**: 既存の権限システム（追加なし）

### 権限チェックフロー
```php
public function canEdit(User $user, ApprovalRequest $approvalRequest): bool
{
    // 1. レイヤー1: 承認フロー設定での許可チェック
    if (!$this->checkFlowConfig($approvalRequest, 'edit')) {
        return false; // フロー設定で編集が許可されていない
    }
    
    // 2. レイヤー2: 既存のユーザー権限チェック
    if (!$this->permissionService->hasPermission($user, 'estimate.edit')) {
        return false; // ユーザーに編集権限が付与されていない
    }
    
    // 3. 業務ロジックチェック
    return $approvalRequest->canEdit($user);
}
```

## 承認フロー設定の拡張

### ステップ別の設定構造
```json
{
  "allow_editing_after_request": true,
  "allow_cancellation_after_request": true,
  "step_settings": {
    "step_1": {
      "editing_conditions": {
        "allow_during_pending": true,
        "allow_during_reviewing": false,
        "allow_during_step_approved": false,
        "allow_during_expired": false
      },
      "cancellation_conditions": {
        "allow_during_pending": true,
        "allow_during_reviewing": false,
        "allow_during_step_approved": false,
        "allow_during_expired": false
      }
    },
    "step_2": {
      "editing_conditions": {
        "allow_during_pending": true,
        "allow_during_reviewing": false,
        "allow_during_step_approved": false,
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
```

### 設定パターンの例

#### パターン1: 厳格な制御（デフォルト）
```json
{
  "allow_editing_after_request": false,
  "allow_cancellation_after_request": false
}
```
- **用途**: 承認依頼後は一切の編集・キャンセルを禁止
- **メリット**: 承認プロセスの完全な保護

#### パターン2: 柔軟な制御
```json
{
  "allow_editing_after_request": true,
  "allow_cancellation_after_request": true,
  "step_settings": {
    "step_1": {
      "editing_conditions": {
        "allow_during_pending": true,
        "allow_during_reviewing": false,
        "allow_during_step_approved": false,
        "allow_during_expired": false
      }
    }
  }
}
```
- **用途**: 承認者開封前のみ編集・キャンセル許可
- **メリット**: 承認プロセス保護と業務柔軟性のバランス

## ApprovalPermissionServiceの実装

### クラス構造
```php
<?php

namespace App\Services\Approval;

use App\Models\ApprovalRequest;
use App\Models\User;
use App\Services\PermissionService;

class ApprovalPermissionService
{
    protected $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * ユーザーの権限情報を取得
     */
    public function getUserPermissions(User $user, ApprovalRequest $approvalRequest): array
    {
        return [
            'can_edit' => $this->canEdit($user, $approvalRequest),
            'can_cancel' => $this->canCancel($user, $approvalRequest),
            'can_approve' => $this->canApprove($user, $approvalRequest),
            'can_reject' => $this->canReject($user, $approvalRequest),
            'can_return' => $this->canReturn($user, $approvalRequest),
            'is_requester' => $approvalRequest->isRequester($user),
            'is_approver' => $approvalRequest->isApprover($user),
        ];
    }

    /**
     * 編集可能かチェック
     */
    public function canEdit(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー1: 承認フロー設定での許可チェック
        if (!$this->checkFlowConfig($approvalRequest, 'edit')) {
            return false;
        }
        
        // 2. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.edit")) {
            return false;
        }
        
        // 3. 業務ロジックチェック
        return $approvalRequest->canEdit($user);
    }

    /**
     * キャンセル可能かチェック
     */
    public function canCancel(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー1: 承認フロー設定での許可チェック
        if (!$this->checkFlowConfig($approvalRequest, 'cancel')) {
            return false;
        }
        
        // 2. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.edit")) {
            return false;
        }
        
        // 3. 業務ロジックチェック
        return $approvalRequest->canCancel($user);
    }

    /**
     * 承認可能かチェック
     */
    public function canApprove(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.approval.approve")) {
            return false;
        }
        
        // 2. 業務ロジックチェック
        return $approvalRequest->isApprover($user);
    }

    /**
     * 却下可能かチェック
     */
    public function canReject(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.approval.reject")) {
            return false;
        }
        
        // 2. 業務ロジックチェック
        return $approvalRequest->isApprover($user);
    }

    /**
     * 差し戻し可能かチェック
     */
    public function canReturn(User $user, ApprovalRequest $approvalRequest): bool
    {
        // 1. レイヤー2: 既存のユーザー権限チェック
        $requestType = $approvalRequest->request_type;
        if (!$this->permissionService->hasPermission($user, "{$requestType}.approval.return")) {
            return false;
        }
        
        // 2. 業務ロジックチェック
        return $approvalRequest->isApprover($user);
    }

    /**
     * 承認フロー設定での許可チェック
     */
    private function checkFlowConfig(ApprovalRequest $approvalRequest, string $action): bool
    {
        $flowConfig = $approvalRequest->approvalFlow->flow_config ?? [];
        
        // 基本設定のチェック
        if ($action === 'edit' && !($flowConfig['allow_editing_after_request'] ?? false)) {
            return false;
        }
        
        if ($action === 'cancel' && !($flowConfig['allow_cancellation_after_request'] ?? false)) {
            return false;
        }
        
        // ステップ別設定のチェック
        $currentStep = $approvalRequest->current_step;
        $stepSettings = $flowConfig['step_settings']["step_{$currentStep}"] ?? [];
        
        if ($action === 'edit') {
            $editingConditions = $stepSettings['editing_conditions'] ?? [];
            $subStatus = $approvalRequest->sub_status ?? 'null';
            
            switch ($subStatus) {
                case 'reviewing':
                    return $editingConditions['allow_during_reviewing'] ?? false;
                case 'step_approved':
                    return $editingConditions['allow_during_step_approved'] ?? false;
                case 'expired':
                    return $editingConditions['allow_during_expired'] ?? false;
                default:
                    return $editingConditions['allow_during_pending'] ?? true;
            }
        }
        
        if ($action === 'cancel') {
            $cancellationConditions = $stepSettings['cancellation_conditions'] ?? [];
            $subStatus = $approvalRequest->sub_status ?? 'null';
            
            switch ($subStatus) {
                case 'reviewing':
                    return $cancellationConditions['allow_during_reviewing'] ?? false;
                case 'step_approved':
                    return $cancellationConditions['allow_during_step_approved'] ?? false;
                case 'expired':
                    return $cancellationConditions['allow_during_expired'] ?? false;
                default:
                    return $cancellationConditions['allow_during_pending'] ?? true;
            }
        }
        
        return true;
    }
}
```

## 既存権限システムとの連携

### 使用する既存権限
```php
// 編集・キャンセル用（申請者）
'estimate.edit'           // 見積編集権限
'budget.edit'            // 予算編集権限
'purchase.edit'          // 発注編集権限

// 承認操作用（承認者）
'estimate.approval.approve'  // 見積承認権限
'estimate.approval.reject'   // 見積却下権限
'estimate.approval.return'   // 見積差し戻し権限
```

### 権限チェックの例
```php
// 見積の編集権限チェック
public function canEdit(User $user, ApprovalRequest $approvalRequest): bool
{
    // 1. フロー設定チェック
    if (!$this->checkFlowConfig($approvalRequest, 'edit')) {
        return false;
    }
    
    // 2. 既存権限チェック（見積編集権限）
    if (!$this->permissionService->hasPermission($user, 'estimate.edit')) {
        return false;
    }
    
    // 3. 業務ロジックチェック
    return $approvalRequest->canEdit($user);
}
```

## コントローラーでの使用

### ApprovalRequestControllerの更新
```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Services\Approval\ApprovalPermissionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApprovalRequestController extends Controller
{
    protected $permissionService;

    public function __construct(ApprovalPermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * 承認依頼詳細取得
     */
    public function show($id): JsonResponse
    {
        $user = auth()->user();
        $approvalRequest = ApprovalRequest::with(['approvalFlow', 'editingUser'])->findOrFail($id);
        
        return response()->json([
            'data' => $approvalRequest,
            'user_permissions' => $this->permissionService->getUserPermissions($user, $approvalRequest),
            'status_display' => $approvalRequest->getStatusDisplay()
        ]);
    }

    /**
     * 承認依頼更新
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = auth()->user();
        $approvalRequest = ApprovalRequest::findOrFail($id);
        
        // 権限チェック
        if (!$this->permissionService->canEdit($user, $approvalRequest)) {
            return response()->json([
                'success' => false,
                'message' => '編集権限がありません'
            ], 403);
        }
        
        // 更新処理
        $approvalRequest->update($request->validated());
        
        return response()->json([
            'success' => true,
            'message' => '承認依頼が更新されました',
            'data' => $approvalRequest
        ]);
    }

    /**
     * 承認依頼キャンセル
     */
    public function cancel($id): JsonResponse
    {
        $user = auth()->user();
        $approvalRequest = ApprovalRequest::findOrFail($id);
        
        // 権限チェック
        if (!$this->permissionService->canCancel($user, $approvalRequest)) {
            return response()->json([
                'success' => false,
                'message' => 'キャンセル権限がありません'
            ], 403);
        }
        
        // キャンセル処理
        $approvalRequest->update([
            'status' => 'cancelled',
            'sub_status' => null,
            'cancelled_by' => $user->id,
            'cancelled_at' => now(),
        ]);
        
        return response()->json([
            'success' => true,
            'message' => '承認依頼がキャンセルされました'
        ]);
    }

    /**
     * 承認
     */
    public function approve(Request $request, $id): JsonResponse
    {
        $user = auth()->user();
        $approvalRequest = ApprovalRequest::findOrFail($id);
        
        // 権限チェック
        if (!$this->permissionService->canApprove($user, $approvalRequest)) {
            return response()->json([
                'success' => false,
                'message' => '承認権限がありません'
            ], 403);
        }
        
        // 承認処理
        // ... 承認ロジック
        
        return response()->json([
            'success' => true,
            'message' => '承認が完了しました'
        ]);
    }
}
```

## フロントエンドでの使用

### APIレスポンスの活用
```typescript
// React/TypeScriptでの実装例
const EstimateDetailPage = ({ estimate }: { estimate: Estimate }) => {
  const { user_permissions, status_display } = estimate.approval_request;
  
  return (
    <div>
      {/* 状態表示 */}
      <StatusBadge 
        status={status_display.display} 
        color={status_display.color} 
        icon={status_display.icon} 
      />
      
      {/* 編集ボタン（権限がある場合のみ表示） */}
      {user_permissions.can_edit && (
        <Button onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          編集
        </Button>
      )}
      
      {/* キャンセルボタン（権限がある場合のみ表示） */}
      {user_permissions.can_cancel && (
        <Button onClick={handleCancel} variant="destructive">
          <X className="h-4 w-4 mr-2" />
          キャンセル
        </Button>
      )}
      
      {/* 承認ボタン（権限がある場合のみ表示） */}
      {user_permissions.can_approve && (
        <Button onClick={handleApprove} variant="success">
          <Check className="h-4 w-4 mr-2" />
          承認
        </Button>
      )}
    </div>
  );
};
```

## 実装手順

### Phase 1: ApprovalPermissionServiceの作成
1. サービスクラスの作成
2. 権限チェックメソッドの実装
3. フロー設定チェックロジックの実装

### Phase 2: 承認フロー設定の拡張
1. ApprovalFlowモデルの拡張
2. ステップ別設定の実装
3. 設定画面の更新

### Phase 3: コントローラーの更新
1. ApprovalRequestControllerの更新
2. 権限チェックの適用
3. エラーハンドリングの追加

### Phase 4: テスト・検証
1. 権限チェックのテスト
2. フロー設定のテスト
3. UI表示のテスト

## メリット

### 1. シンプルな実装
- 既存の権限システムをそのまま活用
- 不要な権限追加を避ける
- 複雑な権限管理を排除

### 2. 柔軟な制御
- フローごとに編集・キャンセル許可を設定
- ステップ別の細かい制御
- プログラム変更なしに業務要件に対応

### 3. 保守性
- 権限チェックロジックを一箇所に集約
- 既存システムとの連携
- テストが容易

### 4. 拡張性
- 新しいフローでも設定で制御可能
- 将来の要件変更に対応可能

### 5. 責任の明確化
- ApprovalFlowServiceはフロー選択・適用
- ApprovalPermissionServiceは操作権限チェック
- 各サービスの役割が明確

## まとめ

ApprovalPermissionServiceにより、以下が実現されます：

1. **承認フロー設定による制御**: フローごとの編集・キャンセル許可設定
2. **既存権限システムとの連携**: 現状のpermissionシステムをそのまま活用
3. **権限チェックロジックの集約**: 複雑な権限判定を一箇所に集約
4. **シンプルで柔軟な制御**: プログラム変更なしに業務要件に対応
5. **ApprovalFlowServiceとの役割分離**: フロー選択と操作権限チェックを分離

この仕様に基づいて実装することで、より使いやすく保守性の高い承認フローシステムが構築できます。
