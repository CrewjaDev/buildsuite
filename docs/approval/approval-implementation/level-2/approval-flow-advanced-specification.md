# 柔軟な承認フローシステム仕様書

## 1. 概要

承認フローシステムの高度な仕様を定義する。承認依頼者と承認ステップを承認フローに直接設定し、permissionテーブルでの承認操作権限管理から分離する設計を採用する。

### 1.1 設計目標
- **柔軟性**: 様々な組織構造や業務フローに対応
- **拡張性**: 新しい承認パターンに容易に対応
- **汎用性**: 見積承認以外の様々な承認業務に対応
- **管理性**: 承認フローの設定・変更を容易に

## 2. 基本設計思想

### 2.1 権限管理の分離
- **承認フロー設定権限**: permissionテーブルで管理
- **承認操作権限**: 承認フローで直接制御（permissionテーブルでは管理しない）
- **承認依頼権限**: 承認フローで直接制御（permissionテーブルでは管理しない）

### 2.2 承認フローの構造
```
承認フロー
├── 基本情報
│   ├── フロー名
│   ├── 説明
│   ├── フロー種別（見積、予算、発注、その他）
│   ├── 適用条件（金額、期間、プロジェクト等）
│   └── 有効/無効
├── 承認依頼者設定
│   ├── システム権限レベル
│   ├── 職位
│   ├── 部署
│   ├── 個別ユーザー
│   └── 条件付き設定（金額、期間等）
└── 承認ステップ設定（最大5ステップ）
    ├── ステップ1: 第1承認
    ├── ステップ2: 第2承認
    ├── ステップ3: 第3承認
    ├── ステップ4: 第4承認
    └── ステップ5: 最終承認
```

## 3. 承認依頼者設定

### 3.1 承認依頼者の定義
承認依頼を出せるユーザーを定義する。複数の条件を組み合わせて設定可能。

### 3.2 承認依頼者の設定方法

#### 3.2.1 システム権限レベルベース
```json
{
  "type": "system_level",
  "value": "supervisor",
  "display_name": "上長"
}
```

#### 3.2.2 職位ベース
```json
{
  "type": "position",
  "value": "manager",
  "display_name": "部長"
}
```

#### 3.2.3 個別ユーザーベース
```json
{
  "type": "user",
  "value": 123,
  "display_name": "山田太郎"
}
```

#### 3.2.4 部署ベース
```json
{
  "type": "department",
  "value": 1,
  "display_name": "Aチーム"
}
```

### 3.3 承認依頼者の権限チェック
```php
public function canCreateApprovalRequest($userId, $approvalFlowId) {
    $flow = ApprovalFlow::find($approvalFlowId);
    $requesters = $flow->requesters;
    
    foreach ($requesters as $requester) {
        switch ($requester['type']) {
            case 'system_level':
                if (User::find($userId)->system_level_id == $requester['value']) {
                    return true;
                }
                break;
            case 'position':
                if (User::find($userId)->position_id == $requester['value']) {
                    return true;
                }
                break;
            case 'user':
                if ($userId == $requester['value']) {
                    return true;
                }
                break;
            case 'department':
                if (User::find($userId)->department_id == $requester['value']) {
                    return true;
                }
                break;
        }
    }
    return false;
}
```

## 4. 承認ステップ設定

### 4.1 承認ステップの制限
- **最大ステップ数**: 5ステップ
- **ステップ名**: 各ステップに名前を設定可能
- **承認者設定**: 各ステップで複数の承認者を設定可能
- **条件分岐**: 金額や内容に応じた条件分岐設定
- **並列承認**: 複数の承認者による並列承認設定

### 4.2 承認者の設定方法

#### 4.2.1 システム権限レベルベース
```json
{
  "type": "system_level",
  "value": "supervisor",
  "display_name": "上長"
}
```

#### 4.2.2 職位ベース
```json
{
  "type": "position",
  "value": "manager",
  "display_name": "部長"
}
```

#### 4.2.3 個別ユーザーベース
```json
{
  "type": "user",
  "value": 123,
  "display_name": "山田太郎"
}
```

#### 4.2.4 部署ベース
```json
{
  "type": "department",
  "value": 1,
  "display_name": "Aチーム"
}
```

#### 4.2.5 条件付き設定
```json
{
  "type": "conditional",
  "condition": {
    "field": "amount",
    "operator": ">=",
    "value": 1000000
  },
  "approvers": [
    {
      "type": "system_level",
      "value": "executive",
      "display_name": "最高責任者"
    }
  ]
}
```

#### 4.2.6 並列承認設定
```json
{
  "type": "parallel",
  "approvers": [
    {
      "type": "department",
      "value": 1,
      "display_name": "Aチーム"
    },
    {
      "type": "department", 
      "value": 2,
      "display_name": "Bチーム"
    }
  ],
  "condition": {
    "type": "majority",
    "display_name": "過半数承認"
  }
}
```

### 4.3 承認条件の設定

#### 4.3.1 必須承認
全員の承認が必要
```json
{
  "type": "required",
  "display_name": "必須承認",
  "description": "全員の承認が必要"
}
```

#### 4.3.2 過半数承認
過半数の承認でOK
```json
{
  "type": "majority",
  "display_name": "過半数承認",
  "description": "過半数の承認でOK"
}
```

#### 4.3.3 任意承認
1人でも承認すればOK
```json
{
  "type": "optional",
  "display_name": "任意承認",
  "description": "1人でも承認すればOK"
}
```

### 4.4 承認条件の判定ロジック
```php
public function checkApprovalCondition($step, $approvals) {
    $condition = $step['condition'];
    $totalApprovers = count($step['approvers']);
    $approvedCount = count($approvals);
    
    switch ($condition['type']) {
        case 'required':
            return $approvedCount === $totalApprovers;
        case 'majority':
            return $approvedCount > ($totalApprovers / 2);
        case 'optional':
            return $approvedCount > 0;
        default:
            return false;
    }
}
```

### 4.5 条件分岐の実装（コード定義が必要）

#### 4.5.1 条件分岐判定クラス
```php
<?php

namespace App\Services\Approval;

class ApprovalConditionEvaluator
{
    /**
     * 承認依頼データに基づいて条件分岐を判定
     */
    public function evaluateCondition($condition, $requestData)
    {
        switch ($condition['type']) {
            case 'amount':
                return $this->evaluateAmountCondition($condition, $requestData);
            case 'vendor_type':
                return $this->evaluateVendorTypeCondition($condition, $requestData);
            case 'project_type':
                return $this->evaluateProjectTypeCondition($condition, $requestData);
            case 'department':
                return $this->evaluateDepartmentCondition($condition, $requestData);
            case 'custom':
                return $this->evaluateCustomCondition($condition, $requestData);
            default:
                return false;
        }
    }

    /**
     * 金額条件の判定
     */
    private function evaluateAmountCondition($condition, $requestData)
    {
        $amount = $requestData['amount'] ?? 0;
        $operator = $condition['operator'];
        $value = $condition['value'];

        switch ($operator) {
            case '>=':
                return $amount >= $value;
            case '>':
                return $amount > $value;
            case '<=':
                return $amount <= $value;
            case '<':
                return $amount < $value;
            case '==':
                return $amount == $value;
            case '!=':
                return $amount != $value;
            default:
                return false;
        }
    }

    /**
     * 業者タイプ条件の判定
     */
    private function evaluateVendorTypeCondition($condition, $requestData)
    {
        $vendorType = $requestData['vendor_type'] ?? '';
        $operator = $condition['operator'];
        $value = $condition['value'];

        switch ($operator) {
            case '==':
                return $vendorType === $value;
            case '!=':
                return $vendorType !== $value;
            case 'in':
                return in_array($vendorType, $value);
            case 'not_in':
                return !in_array($vendorType, $value);
            default:
                return false;
        }
    }

    /**
     * プロジェクトタイプ条件の判定
     */
    private function evaluateProjectTypeCondition($condition, $requestData)
    {
        $projectType = $requestData['project_type'] ?? '';
        $operator = $condition['operator'];
        $value = $condition['value'];

        switch ($operator) {
            case '==':
                return $projectType === $value;
            case 'in':
                return in_array($projectType, $value);
            default:
                return false;
        }
    }

    /**
     * 部署条件の判定
     */
    private function evaluateDepartmentCondition($condition, $requestData)
    {
        $departmentId = $requestData['department_id'] ?? null;
        $operator = $condition['operator'];
        $value = $condition['value'];

        switch ($operator) {
            case '==':
                return $departmentId == $value;
            case 'in':
                return in_array($departmentId, $value);
            default:
                return false;
        }
    }

    /**
     * カスタム条件の判定（拡張用）
     */
    private function evaluateCustomCondition($condition, $requestData)
    {
        // カスタムロジックの実装
        // 例: 複雑な業務ルール、外部API連携等
        $customLogic = $condition['logic'] ?? null;
        
        if ($customLogic && class_exists($customLogic)) {
            $evaluator = new $customLogic();
            return $evaluator->evaluate($requestData);
        }
        
        return false;
    }
}
```

#### 4.5.2 承認者判定サービスの拡張
```php
<?php

namespace App\Services\Approval;

use App\Models\ApprovalFlow;
use App\Models\ApprovalRequest;
use App\Models\User;

class ApprovalFlowService
{
    private $conditionEvaluator;

    public function __construct(ApprovalConditionEvaluator $conditionEvaluator)
    {
        $this->conditionEvaluator = $conditionEvaluator;
    }

    /**
     * 承認依頼作成時の承認フロー選択
     */
    public function selectApprovalFlow($requestData, $userId)
    {
        $user = User::find($userId);
        $availableFlows = ApprovalFlow::where('is_active', true)
            ->where('flow_type', $requestData['flow_type'] ?? 'general')
            ->get();

        $applicableFlows = [];

        foreach ($availableFlows as $flow) {
            // 1. 承認依頼者権限チェック
            if (!$this->canCreateApprovalRequest($user, $flow)) {
                continue;
            }

            // 2. 適用条件チェック
            if (!$this->matchesConditions($flow, $requestData)) {
                continue;
            }

            $applicableFlows[] = $flow;
        }

        // 優先度順でソート
        usort($applicableFlows, function ($a, $b) {
            return $a->priority <=> $b->priority;
        });

        return $applicableFlows[0] ?? null;
    }

    /**
     * 適用条件のマッチング
     */
    private function matchesConditions(ApprovalFlow $flow, $requestData)
    {
        $conditions = $flow->conditions ?? [];

        foreach ($conditions as $field => $condition) {
            if (!$this->conditionEvaluator->evaluateCondition([
                'type' => $field,
                'operator' => $condition['operator'] ?? '==',
                'value' => $condition['value']
            ], $requestData)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 承認ステップの動的決定
     */
    public function determineApprovalSteps(ApprovalRequest $approvalRequest)
    {
        $flow = $approvalRequest->approvalFlow;
        $requestData = $approvalRequest->request_data;
        $applicableSteps = [];

        foreach ($flow->approval_steps as $step) {
            $isApplicable = true;

            // ステップ内の条件分岐をチェック
            foreach ($step['approvers'] as $approver) {
                if ($approver['type'] === 'conditional') {
                    if (!$this->conditionEvaluator->evaluateCondition(
                        $approver['condition'], 
                        $requestData
                    )) {
                        $isApplicable = false;
                        break;
                    }
                }
            }

            if ($isApplicable) {
                $applicableSteps[] = $step;
            }
        }

        return $applicableSteps;
    }
}
```

## 5. データベース設計

### 5.1 approval_flowsテーブルの拡張
```sql
-- 基本情報の拡張
ALTER TABLE approval_flows ADD COLUMN flow_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE approval_flows ADD COLUMN conditions JSON;
ALTER TABLE approval_flows ADD COLUMN priority INTEGER DEFAULT 1;

-- 承認フロー設定
ALTER TABLE approval_flows ADD COLUMN requesters JSON;
ALTER TABLE approval_flows ADD COLUMN approval_steps JSON;

-- インデックスの追加
CREATE INDEX idx_approval_flows_flow_type ON approval_flows (flow_type);
CREATE INDEX idx_approval_flows_priority ON approval_flows (priority);
CREATE INDEX idx_approval_flows_conditions ON approval_flows USING GIN (conditions);
CREATE INDEX idx_approval_flows_requesters ON approval_flows USING GIN (requesters);
CREATE INDEX idx_approval_flows_approval_steps ON approval_flows USING GIN (approval_steps);
```

### 5.2 データ構造例

#### 5.2.1 基本情報設定
```json
{
  "flow_type": "estimate",
  "conditions": {
    "amount_min": 0,
    "amount_max": 10000000,
    "project_types": ["construction", "renovation"],
    "departments": [1, 2, 3]
  },
  "priority": 1
}
```

#### 5.2.2 承認依頼者設定
```json
{
  "requesters": [
    {
      "type": "system_level",
      "value": "supervisor",
      "display_name": "上長"
    },
    {
      "type": "position",
      "value": "manager",
      "display_name": "部長"
    },
    {
      "type": "user",
      "value": 123,
      "display_name": "山田太郎"
    }
  ]
}
```

#### 5.2.3 承認ステップ設定
```json
{
  "approval_steps": [
    {
      "step": 1,
      "name": "第1承認",
      "approvers": [
        {
          "type": "system_level",
          "value": "supervisor",
          "display_name": "上長"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 2,
      "name": "第2承認",
      "approvers": [
        {
          "type": "position",
          "value": "manager",
          "display_name": "部長"
        },
        {
          "type": "user",
          "value": 456,
          "display_name": "佐藤花子"
        }
      ],
      "condition": {
        "type": "majority",
        "display_name": "過半数承認"
      }
    },
    {
      "step": 3,
      "name": "条件分岐承認",
      "approvers": [
        {
          "type": "conditional",
          "condition": {
            "field": "amount",
            "operator": ">=",
            "value": 5000000
          },
          "approvers": [
            {
              "type": "system_level",
              "value": "executive",
              "display_name": "最高責任者"
            }
          ]
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 4,
      "name": "並列承認",
      "approvers": [
        {
          "type": "parallel",
          "approvers": [
            {
              "type": "department",
              "value": 1,
              "display_name": "Aチーム"
            },
            {
              "type": "department",
              "value": 2,
              "display_name": "Bチーム"
            }
          ],
          "condition": {
            "type": "majority",
            "display_name": "過半数承認"
          }
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 5,
      "name": "最終承認",
      "approvers": [
        {
          "type": "user",
          "value": 999,
          "display_name": "野瀬社長"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    }
  ]
}
```

## 6. 承認依頼処理

### 6.1 承認依頼作成時の処理（条件分岐対応）
```php
public function createApprovalRequest($userId, $requestData) {
    // 1. 承認フローを動的に選択
    $approvalFlow = $this->approvalFlowService->selectApprovalFlow($requestData, $userId);
    
    if (!$approvalFlow) {
        throw new UnauthorizedException('適用可能な承認フローがありません');
    }
    
    // 2. 承認依頼を作成
    $approvalRequest = ApprovalRequest::create([
        'user_id' => $userId,
        'approval_flow_id' => $approvalFlow->id,
        'request_data' => $requestData,
        'status' => 'pending',
        'current_step' => 1
    ]);
    
    // 3. 適用可能な承認ステップを決定
    $applicableSteps = $this->approvalFlowService->determineApprovalSteps($approvalRequest);
    
    // 4. 第1ステップの承認者に通知
    if (!empty($applicableSteps)) {
        $this->notifyApprovers($approvalRequest, $applicableSteps[0]);
    }
    
    return $approvalRequest;
}
```

### 6.2 承認処理（条件分岐対応）
```php
public function approveRequest($approvalRequestId, $userId, $comment = null) {
    $approvalRequest = ApprovalRequest::find($approvalRequestId);
    $currentStep = $approvalRequest->current_step;
    
    // 1. 承認者権限をチェック
    if (!$this->canApprove($userId, $approvalRequest, $currentStep)) {
        throw new UnauthorizedException('承認権限がありません');
    }
    
    // 2. 承認履歴を記録
    ApprovalHistory::create([
        'approval_request_id' => $approvalRequestId,
        'step' => $currentStep,
        'approver_id' => $userId,
        'action' => 'approve',
        'comment' => $comment,
        'acted_at' => now()
    ]);
    
    // 3. 承認条件をチェック
    if ($this->isStepCompleted($approvalRequest, $currentStep)) {
        // 4. 適用可能な次のステップを決定
        $applicableSteps = $this->approvalFlowService->determineApprovalSteps($approvalRequest);
        $nextStepIndex = $currentStep; // 現在のステップのインデックス
        
        // 次の適用可能なステップを探す
        $nextStep = null;
        for ($i = $nextStepIndex; $i < count($applicableSteps); $i++) {
            if ($applicableSteps[$i]['step'] > $currentStep) {
                $nextStep = $applicableSteps[$i];
                break;
            }
        }
        
        if ($nextStep) {
            // 次のステップへ
            $approvalRequest->update(['current_step' => $nextStep['step']]);
            $this->notifyApprovers($approvalRequest, $nextStep);
        } else {
            // 最終承認完了
            $approvalRequest->update(['status' => 'approved']);
        }
    }
    
    return $approvalRequest;
}
```

### 6.3 承認者権限チェック（条件分岐対応）
```php
public function canApprove($userId, $approvalRequest, $step) {
    $flow = ApprovalFlow::find($approvalRequest->approval_flow_id);
    $requestData = $approvalRequest->request_data;
    
    // 適用可能なステップを取得
    $applicableSteps = $this->approvalFlowService->determineApprovalSteps($approvalRequest);
    $currentStepConfig = null;
    
    foreach ($applicableSteps as $stepConfig) {
        if ($stepConfig['step'] == $step) {
            $currentStepConfig = $stepConfig;
            break;
        }
    }
    
    if (!$currentStepConfig) {
        return false;
    }
    
    foreach ($currentStepConfig['approvers'] as $approver) {
        switch ($approver['type']) {
            case 'system_level':
                if (User::find($userId)->system_level_id == $approver['value']) {
                    return true;
                }
                break;
            case 'position':
                if (User::find($userId)->position_id == $approver['value']) {
                    return true;
                }
                break;
            case 'user':
                if ($userId == $approver['value']) {
                    return true;
                }
                break;
            case 'department':
                if (User::find($userId)->department_id == $approver['value']) {
                    return true;
                }
                break;
            case 'conditional':
                // 条件分岐の場合は、条件を満たす場合のみ承認可能
                if ($this->conditionEvaluator->evaluateCondition($approver['condition'], $requestData)) {
                    foreach ($approver['approvers'] as $conditionalApprover) {
                        if ($this->checkApproverPermission($userId, $conditionalApprover)) {
                            return true;
                        }
                    }
                }
                break;
            case 'parallel':
                // 並列承認の場合は、いずれかの承認者に該当すれば承認可能
                foreach ($approver['approvers'] as $parallelApprover) {
                    if ($this->checkApproverPermission($userId, $parallelApprover)) {
                        return true;
                    }
                }
                break;
        }
    }
    return false;
}

/**
 * 承認者権限の個別チェック
 */
private function checkApproverPermission($userId, $approver) {
    $user = User::find($userId);
    
    switch ($approver['type']) {
        case 'system_level':
            return $user->system_level_id == $approver['value'];
        case 'position':
            return $user->position_id == $approver['value'];
        case 'user':
            return $userId == $approver['value'];
        case 'department':
            return $user->department_id == $approver['value'];
        default:
            return false;
    }
}
```

## 7. UI設計

### 7.1 承認フロー設定画面
```
承認フロー設定
├── 基本情報
│   ├── フロー名: [見積承認フロー]
│   ├── 説明: [見積書の承認フローです]
│   └── 有効/無効: [有効] [無効]
├── 承認依頼者設定
│   ├── システム権限レベル: [上長] [最高責任者]
│   ├── 職位: [部長] [課長]
│   └── 個別ユーザー: [山田太郎] [佐藤花子]
├── 承認ステップ設定
│   ├── ステップ1: 第1承認
│   │   ├── 承認者: システム権限レベル [上長]
│   │   └── 承認条件: [必須承認] [過半数承認] [任意承認]
│   ├── ステップ2: 第2承認
│   │   ├── 承認者: 職位 [部長] + 個別ユーザー [佐藤花子]
│   │   └── 承認条件: [必須承認] [過半数承認] [任意承認]
│   └── ステップ3: 最終承認
│       ├── 承認者: システム権限レベル [最高責任者]
│       └── 承認条件: [必須承認] [過半数承認] [任意承認]
└── 操作ボタン
    ├── [保存]
    ├── [キャンセル]
    └── [プレビュー]
```

### 7.2 承認依頼作成画面
```
承認依頼作成
├── 承認フロー選択
│   └── [見積承認フロー] ← ユーザーが依頼可能なフローのみ表示
├── 依頼内容
│   ├── 件名: [見積書承認依頼]
│   ├── 説明: [詳細な説明]
│   └── 添付ファイル: [ファイル選択]
├── 承認フロー情報
│   ├── 承認ステップ: 3ステップ
│   ├── 第1承認: 上長（必須承認）
│   ├── 第2承認: 部長 + 佐藤花子（過半数承認）
│   └── 最終承認: 最高責任者（必須承認）
└── 操作ボタン
    ├── [承認依頼を送信]
    └── [下書き保存]
```

## 8. 権限管理の変更

### 8.1 permissionテーブルから削除する権限
```sql
-- 以下の権限を削除
DELETE FROM permissions WHERE name IN (
    'estimate.approval.approve',
    'estimate.approval.reject',
    'estimate.approval.return',
    'estimate.approval.request',
    'estimate.approval.cancel'
);
```

### 8.2 残す権限
```sql
-- 承認フロー設定権限のみ残す
SELECT * FROM permissions WHERE name IN (
    'approval.flow.view',
    'approval.flow.create',
    'approval.flow.edit',
    'approval.flow.delete'
);
```

### 8.3 承認管理ページの権限設定
- 承認フロー設定権限のみを管理
- 承認操作権限は管理対象外

## 9. 実装手順

### Phase 1: データベース設計
1. approval_flowsテーブルの拡張
2. 承認依頼者・承認ステップのJSON構造設計
3. 既存データの移行

### Phase 2: バックエンド実装
1. 承認フロー設定API実装
2. 承認依頼処理API実装
3. 承認者判定ロジック実装
4. 承認条件判定ロジック実装

### Phase 3: フロントエンド実装
1. 承認フロー設定画面実装
2. 承認依頼作成画面実装
3. 承認処理画面実装
4. 承認履歴表示画面実装

### Phase 4: 統合・テスト
1. フロントエンド・バックエンド統合
2. 動作テスト
3. エラーハンドリング実装
4. UI/UX改善

## 10. メリット

### 10.1 柔軟性の向上
- 承認フローごとに異なる承認者を設定可能
- プロジェクトや案件に応じた動的な承認者設定
- 承認フローの複製時に承認者も一緒に複製

### 10.2 管理の簡素化
- 承認フローと承認者が一箇所で管理される
- 承認フローの変更時に承認者も同時に変更可能
- 権限テーブルの複雑化を回避

### 10.3 運用の現実性
- 実際の業務フローに即した設定方法
- 承認フロー設計者が承認者も同時に設定可能
- 承認フローのテスト時に承認者も含めてテスト可能

### 10.4 セキュリティの向上
- 承認フローごとの細かい権限制御
- 承認依頼者と承認者の明確な分離
- 承認フロー設定権限と承認操作権限の分離

## 11. 注意事項

### 11.1 既存データの移行
- 既存の承認フローに承認依頼者・承認ステップを設定
- 既存の承認依頼の処理方法を決定
- 権限テーブルの整理

### 11.2 パフォーマンス
- JSON形式のデータアクセス最適化
- 承認者判定のキャッシュ機能
- 大量データでの動作確認

### 11.3 エラーハンドリング
- 承認フロー設定のバリデーション
- 承認者不在時の処理
- 承認条件不成立時の処理

## 12. 柔軟な承認フローの実装例

### 12.1 見積承認フロー（金額別）
```json
{
  "name": "見積承認フロー（金額別）",
  "description": "金額に応じた段階的承認フロー",
  "flow_type": "estimate",
  "conditions": {
    "amount_min": 0,
    "amount_max": 50000000,
    "project_types": ["construction", "renovation"]
  },
  "requesters": [
    {
      "type": "department",
      "value": 1,
      "display_name": "Aチーム"
    },
    {
      "type": "department",
      "value": 2,
      "display_name": "Bチーム"
    }
  ],
  "approval_steps": [
    {
      "step": 1,
      "name": "チームリーダー承認",
      "approvers": [
        {
          "type": "conditional",
          "condition": {
            "field": "amount",
            "operator": "<",
            "value": 1000000
          },
          "approvers": [
            {
              "type": "position",
              "value": "team_leader",
              "display_name": "チームリーダー"
            }
          ]
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 2,
      "name": "部門長承認",
      "approvers": [
        {
          "type": "conditional",
          "condition": {
            "field": "amount",
            "operator": ">=",
            "value": 1000000
          },
          "approvers": [
            {
              "type": "position",
              "value": "department_manager",
              "display_name": "部門長"
            }
          ]
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 3,
      "name": "役員承認",
      "approvers": [
        {
          "type": "conditional",
          "condition": {
            "field": "amount",
            "operator": ">=",
            "value": 10000000
          },
          "approvers": [
            {
              "type": "system_level",
              "value": "executive",
              "display_name": "役員"
            }
          ]
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    }
  ]
}
```

### 12.2 予算承認フロー（並列承認）
```json
{
  "name": "予算承認フロー",
  "description": "複数部門による並列承認フロー",
  "flow_type": "budget",
  "conditions": {
    "amount_min": 5000000,
    "departments": [1, 2, 3]
  },
  "requesters": [
    {
      "type": "system_level",
      "value": "manager",
      "display_name": "マネージャー以上"
    }
  ],
  "approval_steps": [
    {
      "step": 1,
      "name": "部門並列承認",
      "approvers": [
        {
          "type": "parallel",
          "approvers": [
            {
              "type": "department",
              "value": 1,
              "display_name": "Aチーム"
            },
            {
              "type": "department",
              "value": 2,
              "display_name": "Bチーム"
            },
            {
              "type": "department",
              "value": 3,
              "display_name": "Cチーム"
            }
          ],
          "condition": {
            "type": "majority",
            "display_name": "過半数承認"
          }
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 2,
      "name": "最終承認",
      "approvers": [
        {
          "type": "user",
          "value": 999,
          "display_name": "野瀬社長"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    }
  ]
}
```

### 12.3 発注承認フロー（複雑な条件分岐）
```json
{
  "name": "発注承認フロー",
  "description": "金額と発注先に応じた複雑な承認フロー",
  "flow_type": "purchase",
  "conditions": {
    "amount_min": 0,
    "vendor_types": ["new", "existing"]
  },
  "requesters": [
    {
      "type": "position",
      "value": "purchaser",
      "display_name": "発注担当者"
    }
  ],
  "approval_steps": [
    {
      "step": 1,
      "name": "新規業者承認",
      "approvers": [
        {
          "type": "conditional",
          "condition": {
            "field": "vendor_type",
            "operator": "==",
            "value": "new"
          },
          "approvers": [
            {
              "type": "system_level",
              "value": "supervisor",
              "display_name": "上長"
            }
          ]
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 2,
      "name": "金額別承認",
      "approvers": [
        {
          "type": "conditional",
          "condition": {
            "field": "amount",
            "operator": ">=",
            "value": 1000000
          },
          "approvers": [
            {
              "type": "position",
              "value": "manager",
              "display_name": "マネージャー"
            }
          ]
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 3,
      "name": "高額承認",
      "approvers": [
        {
          "type": "conditional",
          "condition": {
            "field": "amount",
            "operator": ">=",
            "value": 10000000
          },
          "approvers": [
            {
              "type": "system_level",
              "value": "executive",
              "display_name": "役員"
            }
          ]
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    }
  ]
}
```

## 13. チーム別承認ルートの実装例

### 12.0 部署テーブルとの連携

既存のdepartmentテーブルと社員テーブルの部署項目を活用した承認フロー設定：

```sql
-- 部署テーブル例
departments:
- id: 1, name: "Aチーム", code: "team_a"
- id: 2, name: "Bチーム", code: "team_b"  
- id: 3, name: "Cチーム", code: "team_c"

-- 社員テーブル例
users:
- id: 101, name: "久保井", department_id: 1
- id: 102, name: "中野", department_id: 1
- id: 103, name: "三浦", department_id: 1
- id: 201, name: "高井", department_id: 2
- id: 202, name: "工藤", department_id: 2
- id: 203, name: "三野", department_id: 2
- id: 301, name: "光枝", department_id: 3
- id: 302, name: "古賀", department_id: 3
```

### 12.1 Aチーム承認フロー（部署ベース）
```json
{
  "name": "Aチーム承認フロー",
  "description": "Aチーム（山田リーダー）の承認フロー",
  "requesters": [
    {
      "type": "department",
      "value": 1,
      "display_name": "Aチーム"
    }
  ],
  "approval_steps": [
    {
      "step": 1,
      "name": "チームリーダー承認",
      "approvers": [
        {
          "type": "user",
          "value": 100,
          "display_name": "山田リーダー"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 2,
      "name": "社長承認",
      "approvers": [
        {
          "type": "user",
          "value": 999,
          "display_name": "野瀬社長"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    }
  ]
}
```

### 12.2 Bチーム承認フロー（部署ベース）
```json
{
  "name": "Bチーム承認フロー",
  "description": "Bチーム（田中リーダー）の承認フロー",
  "requesters": [
    {
      "type": "department",
      "value": 2,
      "display_name": "Bチーム"
    }
  ],
  "approval_steps": [
    {
      "step": 1,
      "name": "チームリーダー承認",
      "approvers": [
        {
          "type": "user",
          "value": 200,
          "display_name": "田中リーダー"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 2,
      "name": "社長承認",
      "approvers": [
        {
          "type": "user",
          "value": 999,
          "display_name": "野瀬社長"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    }
  ]
}
```

### 12.3 Cチーム承認フロー（部署ベース）
```json
{
  "name": "Cチーム承認フロー",
  "description": "Cチーム（吉田リーダー）の承認フロー",
  "requesters": [
    {
      "type": "department",
      "value": 3,
      "display_name": "Cチーム"
    }
  ],
  "approval_steps": [
    {
      "step": 1,
      "name": "チームリーダー承認",
      "approvers": [
        {
          "type": "user",
          "value": 300,
          "display_name": "吉田リーダー"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    },
    {
      "step": 2,
      "name": "社長承認",
      "approvers": [
        {
          "type": "user",
          "value": 999,
          "display_name": "野瀬社長"
        }
      ],
      "condition": {
        "type": "required",
        "display_name": "必須承認"
      }
    }
  ]
}
```

## 13. 今後の拡張予定

### 13.1 機能拡張
- 承認フローのテンプレート機能
- 承認フローのバージョン管理
- 承認フローの承認者代理設定

### 12.4 部署ベース設定のメリット

#### 12.4.1 管理の簡素化
- 個別ユーザーを指定する必要がない
- 部署に所属する全メンバーが自動的に承認依頼可能
- 新メンバーの追加時に承認フロー設定の変更不要

#### 12.4.2 柔軟性の向上
- 部署の変更時に承認フローも自動的に適用
- 部署統合・分割時の承認フロー管理が容易
- 組織変更に対する承認フローの対応が迅速

#### 12.4.3 実装例の比較

**個別ユーザーベース（従来方式）:**
```json
{
  "requesters": [
    {"type": "user", "value": 101, "display_name": "久保井"},
    {"type": "user", "value": 102, "display_name": "中野"},
    {"type": "user", "value": 103, "display_name": "三浦"}
  ]
}
```

**部署ベース（推奨方式）:**
```json
{
  "requesters": [
    {"type": "department", "value": 1, "display_name": "Aチーム"}
  ]
}
```

## 13. 今後の拡張予定

### 13.1 機能拡張
- 承認フローのテンプレート機能
- 承認フローのバージョン管理
- 承認フローの承認者代理設定

### 13.2 UI改善
- ドラッグ&ドロップでの承認ステップ設定
- 承認フローの視覚的表示
- 承認フローのシミュレーション機能
- 部署選択UIの実装
- 条件分岐の視覚的設定UI
- 並列承認の設定UI

## 14. コード定義が必要な機能

### 14.1 条件分岐ロジックの実装

#### 14.1.1 基本的な条件分岐
```php
// 金額による条件分岐
if ($requestData['amount'] >= 1000000) {
    // 高額案件の承認フロー
    $approvers = ['executive', 'ceo'];
} else {
    // 通常案件の承認フロー
    $approvers = ['supervisor', 'manager'];
}
```

#### 14.1.2 複雑な条件分岐
```php
// 複数条件の組み合わせ
if ($requestData['amount'] >= 5000000 && 
    $requestData['vendor_type'] === 'new' && 
    $requestData['project_type'] === 'construction') {
    // 新規業者・建設・高額案件の特別承認フロー
    $approvers = ['executive', 'legal', 'ceo'];
}
```

#### 14.1.3 カスタム条件の実装
```php
<?php

namespace App\Services\Approval\Conditions;

class CustomBusinessRuleEvaluator
{
    public function evaluate($requestData)
    {
        // 複雑な業務ルールの実装
        // 例: 外部API連携、データベース照会等
        
        // 例: 過去の承認履歴をチェック
        $previousApprovals = $this->getPreviousApprovals($requestData['user_id']);
        
        // 例: 月間承認金額の制限チェック
        $monthlyAmount = $this->getMonthlyApprovalAmount($requestData['user_id']);
        
        // 例: 業者の信頼度チェック
        $vendorReliability = $this->getVendorReliability($requestData['vendor_id']);
        
        return $this->applyBusinessRules($requestData, $previousApprovals, $monthlyAmount, $vendorReliability);
    }
    
    private function applyBusinessRules($requestData, $previousApprovals, $monthlyAmount, $vendorReliability)
    {
        // 複雑な業務ルールの適用
        if ($monthlyAmount > 10000000) {
            return false; // 月間制限超過
        }
        
        if ($vendorReliability < 0.7 && $requestData['amount'] > 1000000) {
            return false; // 信頼度不足
        }
        
        return true;
    }
}
```

### 14.2 動的承認フロー選択

#### 14.2.1 承認フロー選択ロジック
```php
<?php

namespace App\Services\Approval;

class ApprovalFlowSelector
{
    public function selectFlow($requestData, $userId)
    {
        $user = User::find($userId);
        $availableFlows = ApprovalFlow::where('is_active', true)->get();
        
        $applicableFlows = [];
        
        foreach ($availableFlows as $flow) {
            $score = $this->calculateFlowScore($flow, $requestData, $user);
            if ($score > 0) {
                $applicableFlows[] = [
                    'flow' => $flow,
                    'score' => $score
                ];
            }
        }
        
        // スコア順でソート
        usort($applicableFlows, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });
        
        return $applicableFlows[0]['flow'] ?? null;
    }
    
    private function calculateFlowScore($flow, $requestData, $user)
    {
        $score = 0;
        
        // フロー種別の一致
        if ($flow->flow_type === $requestData['flow_type']) {
            $score += 100;
        }
        
        // 金額範囲の一致
        if ($this->isAmountInRange($flow, $requestData)) {
            $score += 50;
        }
        
        // 部署の一致
        if ($this->isDepartmentMatched($flow, $user)) {
            $score += 30;
        }
        
        // プロジェクトタイプの一致
        if ($this->isProjectTypeMatched($flow, $requestData)) {
            $score += 20;
        }
        
        return $score;
    }
}
```

### 14.3 承認ステップの動的決定

#### 14.3.1 ステップ決定ロジック
```php
<?php

namespace App\Services\Approval;

class ApprovalStepDeterminer
{
    public function determineSteps($approvalRequest)
    {
        $flow = $approvalRequest->approvalFlow;
        $requestData = $approvalRequest->request_data;
        $applicableSteps = [];
        
        foreach ($flow->approval_steps as $step) {
            if ($this->isStepApplicable($step, $requestData)) {
                $applicableSteps[] = $step;
            }
        }
        
        return $applicableSteps;
    }
    
    private function isStepApplicable($step, $requestData)
    {
        // ステップの条件をチェック
        foreach ($step['conditions'] ?? [] as $condition) {
            if (!$this->conditionEvaluator->evaluateCondition($condition, $requestData)) {
                return false;
            }
        }
        
        // 承認者の条件をチェック
        foreach ($step['approvers'] as $approver) {
            if ($approver['type'] === 'conditional') {
                if (!$this->conditionEvaluator->evaluateCondition($approver['condition'], $requestData)) {
                    return false;
                }
            }
        }
        
        return true;
    }
}
```

### 14.4 並列承認の実装

#### 14.4.1 並列承認処理
```php
<?php

namespace App\Services\Approval;

class ParallelApprovalProcessor
{
    public function processParallelApproval($approvalRequest, $step)
    {
        $approvers = $this->getParallelApprovers($step);
        $approvals = $this->getStepApprovals($approvalRequest, $step['step']);
        
        $condition = $step['condition'];
        
        switch ($condition['type']) {
            case 'required':
                return count($approvals) === count($approvers);
            case 'majority':
                return count($approvals) > (count($approvers) / 2);
            case 'optional':
                return count($approvals) > 0;
            case 'custom':
                return $this->evaluateCustomCondition($condition, $approvals, $approvers);
            default:
                return false;
        }
    }
    
    private function getParallelApprovers($step)
    {
        $approvers = [];
        
        foreach ($step['approvers'] as $approver) {
            if ($approver['type'] === 'parallel') {
                foreach ($approver['approvers'] as $parallelApprover) {
                    $approvers = array_merge($approvers, $this->resolveApprovers($parallelApprover));
                }
            }
        }
        
        return $approvers;
    }
    
    private function resolveApprovers($approver)
    {
        switch ($approver['type']) {
            case 'department':
                return User::where('department_id', $approver['value'])->pluck('id')->toArray();
            case 'system_level':
                return User::where('system_level_id', $approver['value'])->pluck('id')->toArray();
            case 'position':
                return User::where('position_id', $approver['value'])->pluck('id')->toArray();
            case 'user':
                return [$approver['value']];
            default:
                return [];
        }
    }
}
```

## 15. 柔軟な承認フローシステムの特徴

### 14.1 対応可能な承認パターン

#### 14.1.1 金額別承認
- 小額: チームリーダー承認のみ
- 中額: 部門長承認が必要
- 高額: 役員承認が必要

#### 14.1.2 条件分岐承認
- 新規業者: 追加承認が必要
- 既存業者: 通常の承認フロー
- 緊急案件: 簡略化された承認フロー

#### 14.1.3 並列承認
- 複数部門による同時承認
- 過半数承認による効率化
- 専門部門による専門承認

#### 14.1.4 段階的承認
- 最大5ステップの段階的承認
- 各ステップでの条件分岐
- 承認者の柔軟な設定

### 14.2 拡張性

#### 14.2.1 新しい承認タイプの追加
- フロー種別の追加（estimate, budget, purchase, contract等）
- 新しい承認条件の追加
- カスタム承認ロジックの実装

#### 14.2.2 組織変更への対応
- 部署統合・分割時の自動対応
- 人事異動時の権限自動更新
- 組織再編時の承認フロー調整

#### 14.2.3 業務フロー変更への対応
- 承認フローの動的変更
- 一時的な承認フロー設定
- 承認フローのバージョン管理

### 14.3 運用性

#### 14.3.1 承認フロー管理
- 承認フローの一覧表示
- 承認フローの複製・テンプレート化
- 承認フローの有効/無効切り替え

#### 14.3.2 承認状況の可視化
- 承認進捗のリアルタイム表示
- 承認履歴の詳細表示
- 承認遅延のアラート機能

#### 14.3.3 承認フローの最適化
- 承認時間の分析
- 承認フローの効率化提案
- 承認者の負荷分散
