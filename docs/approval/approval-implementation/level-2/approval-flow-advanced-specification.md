# 柔軟な承認フローシステム仕様書

## 1. 概要

承認フローシステムの高度な仕様を定義する。承認依頼者と承認ステップを承認フローに直接設定し、permissionテーブルでの承認操作権限管理から分離する設計を採用する。

### 1.1 設計目標
- **柔軟性**: 様々な組織構造や業務フローに対応
- **拡張性**: 新しい承認パターンに容易に対応
- **汎用性**: 見積承認以外の様々な承認業務に対応
- **管理性**: 承認フローの設定・変更を容易に

## 2. 基本設計思想

### 2.1 権限管理の分離設計

#### 2.1.1 承認フロー設定権限
- **管理場所**: システム権限レベル（`system_level_permissions`テーブル）
- **権限例**: `approval.flow.view`, `approval.flow.create`, `approval.flow.edit`, `approval.flow.delete`
- **用途**: 承認管理ページでの承認フロー設定・編集・削除
- **設定方法**: システム権限レベル別に権限を付与

#### 2.1.2 承認操作権限
- **管理場所**: 承認フローのステップ設定（`approval_flows.approval_steps` JSON）
- **権限例**: `estimate.approval.view`, `estimate.approval.approve`, `estimate.approval.reject`, `estimate.approval.return`
- **用途**: 実際の承認操作（閲覧、承認、却下、差し戻し）
- **設定方法**: 各ステップで`available_permissions`配列に権限を指定

#### 2.1.3 権限チェックの原則
- **承認者判定**: 部署、職位、システム権限レベル、個人の条件で判定
- **権限チェック**: ステップで設定された`available_permissions`のみをチェック
- **ユーザー個別権限**: 承認操作では不要（ステップ設定が権限を制御）


### 2.2 承認フローの構造
```
承認フロー（approval_flowsテーブル）
├── 基本情報
│   ├── フロー名 → name (VARCHAR)
│   ├── 説明 → description (TEXT)
│   ├── フロー種別（見積、予算、発注、その他） → flow_type (VARCHAR)
│   ├── 適用条件（金額、期間、プロジェクト等） → conditions (JSON)
│   └── 有効/無効 → is_active (BOOLEAN)
├── 承認依頼者設定 → requesters (JSON)
│   ├── システム権限レベル
│   ├── 職位
│   ├── 部署
│   └── 個別ユーザー
└── 承認ステップ設定（最大5ステップ） → approval_steps (JSON)
    ├── ステップ0: 承認依頼作成（available_permissionsで権限制御）
    ├── ステップ1: 第1承認（available_permissionsで権限制御）
    ├── ステップ2: 第2承認（available_permissionsで権限制御）
    ├── ステップ3: 第3承認（available_permissionsで権限制御）
    ├── ステップ4: 第4承認（available_permissionsで権限制御）
    └── ステップ5: 最終承認（available_permissionsで権限制御）
```

**データベース設計の特徴**
- **柔軟性**: JSONカラム（`conditions`, `requesters`, `approval_steps`）により、動的な設定が可能
- **拡張性**: 新しい承認パターンや条件を追加する際に、テーブル構造の変更が不要
- **パフォーマンス**: GINインデックスにより、JSONカラムの高速検索が可能


## 3. JSON構造の詳細ルール

### 3.1 基本ルール

#### 3.1.1 データ型の厳密性
- **文字列**: 必ずダブルクォートで囲む
- **数値**: クォートなし（整数・浮動小数点）
- **真偽値**: `true`/`false`（クォートなし）
- **null**: `null`（クォートなし）
- **配列**: `[]`で囲む
- **オブジェクト**: `{}`で囲む

#### 3.1.2 必須フィールドの定義
- すべてのJSONオブジェクトで必須フィールドを明確に定義
- オプションフィールドは`optional`マークを付与
- デフォルト値がある場合は明記

#### 3.1.3 値の制約
- 文字列の最大長制限
- 数値の範囲制限
- 列挙値の定義
- 正規表現パターンの定義



#### 3.2 json項目の設定ルール

#### 3.2.1 適用条件（conditions）
```json
{
  "amount_min": 0,
  "amount_max": 10000000,
  "project_types": ["construction", "renovation"],
  "departments": [1, 2, 3]
}
```

### 3.2.2 承認依頼者設定（requesters）

#### 3.2.2.1 基本構造
```json
{
  "requesters": [
    {
      "type": "system_level|position|user|department",
      "value": "string|integer",
      "display_name": "string"
    }
  ]
}
```

#### 3.2.2.2 フィールド詳細ルール

**type（必須）**
- **型**: 文字列
- **制約**: 以下の4つの値のみ許可
  - `"system_level"`: システム権限レベルベース
  - `"position"`: 職位ベース
  - `"user"`: 個別ユーザーベース
  - `"department"`: 部署ベース
- **例**: `"system_level"`

**value（必須）**
- **型**: 文字列または整数
- **制約**: typeに応じて異なる
  - `system_level`: システム権限レベルのコード（文字列）
  - `position`: 職位ID（整数）
  - `user`: ユーザーID（整数）
  - `department`: 部署ID（整数）
- **例**: `"supervisor"` または `123`

**display_name（必須）**
- **型**: 文字列
- **制約**: 最大100文字、空文字列禁止
- **用途**: UI表示用の人間が読める名前
- **例**: `"上長"`



#### 3.2.2.3 設定例


**承認者設定オブジェクト**
```json
{
  "type": "system_level|position|user|department",
  "value": "string|integer",
  "display_name": "string"
}
```

**システム権限レベルベース**
```json
{
  "type": "system_level",
  "value": "supervisor",
  "display_name": "上長"
}
```

**職位ベース**
```json
{
  "type": "position",
  "value": 5,
  "display_name": "主任"
}
```

**個別ユーザーベース**
```json
{
  "type": "user",
  "value": 123,
  "display_name": "山田太郎"
}
```

**部署ベース**
```json
{
  "type": "department",
  "value": 3,
  "display_name": "営業部"
}
```

#### 3.2.2.4 承認依頼者設定の制限
承認依頼者設定では、以下のタイプのみ使用可能：
- `system_level`: システム権限レベルベース
- `position`: 職位ベース
- `user`: 個別ユーザーベース
- `department`: 部署ベース

**注意**: 承認依頼者設定では権限ベース（`permission`）は使用しません。権限による制御は承認操作時（ステップの`available_permissions`）で行います。


##### 3.2.2.4.1 承認依頼者の権限チェック
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
            case 'permission':
                // 承認依頼者設定での権限ベースは削除
                // 権限ベースの承認依頼者は、ステップのavailable_permissionsで制御
                break;
        }
    }
    return false;
}
```


### 3.2.3 承認ステップ設定（approval_steps）

#### 3.2.3.1 基本構造
```json
{
  "approval_steps": [
    {
      "step": "integer (0-5)",
      "name": "string",
      "approvers": "array",
      "available_permissions": "array",
      "approval_type": "string (optional)"
    }
  ]
}
```

#### 3.2.3.2 フィールド詳細ルール

##### 3.2.3.2.1 step（必須）
- **型**: 整数
- **制約**: 0-5の範囲
  - `0`: 承認依頼作成ステップ
  - `1-5`: 承認ステップ（第1承認〜第5承認）
- **例**: `0`, `1`, `2`

##### 3.2.3.2.2 name（必須）
- **型**: 文字列
- **制約**: 最大100文字、空文字列禁止
- **用途**: ステップの表示名
- **例**: `"承認依頼作成"`, `"第1承認"`, `"最終承認"`

##### 3.2.3.2.3 approvers（必須）
- **型**: 配列
- **制約**: 1つ以上の承認者設定が必要
- **構造**: 承認者設定オブジェクトの配列


##### 3.2.3.2.4 available_permissions（必須）
- **型**: 配列
- **制約**: 1つ以上の権限が必要
- **要素**: 文字列（権限名）
- **例**: `["estimate.approval.view", "estimate.approval.approve"]`

**権限名の制約**
- **型**: 文字列
- **制約**: 最大100文字、英数字とドットのみ許可
- **パターン**: `^[a-zA-Z0-9.]+$`
- **例**: `"estimate.approval.request"`, `"estimate.approval.approve"`

##### 3.2.3.2.5 approval_type（オプション）
- **型**: 文字列
- **制約**: 以下の3つの値のみ許可
  - `"required"`: 必須承認（全員の承認が必要）
  - `"majority"`: 過半数承認（過半数の承認が必要）
  - `"optional"`: 任意承認（1人でも承認すればOK）
- **デフォルト**: `"required"`
- **例**: `"majority"`





#### 3.2.3.3 ステップ設定例

##### 3.2.3.3.1 承認依頼作成ステップ（step: 0）
```json
{
  "approval_steps": [
    {
      "step": 0,
      "name": "承認依頼作成",
      "approvers": [
        {
          "type": "system_level",
          "value": "employee",
          "display_name": "担当者"
        }
      ],
      "available_permissions": [
        "estimate.approval.request"
      ],
      "approval_type": "required"
    }
  ]
}
```

##### 3.2.3.3.2 基本承認ステップ（step: 1）
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
      "available_permissions": [
        "estimate.approval.view",
        "estimate.approval.approve",
        "estimate.approval.return"
      ],
      "approval_type": "required"
    }
  ]
}
```



## 4. バリデーションルール

### 4.1 JSON構造のバリデーション

#### 4.1.1 必須フィールドチェック
- すべての必須フィールドが存在するか
- 必須フィールドが空でないか
- データ型が正しいか

#### 4.1.2 値の制約チェック
- 文字列の最大長制限
- 数値の範囲制限
- 列挙値の妥当性
- 正規表現パターンの適合性

#### 4.1.3 論理的整合性チェック
- ステップ番号の連続性
- 承認者設定の妥当性
- 権限設定の整合性

### 4.2 エラーハンドリング

#### 4.2.1 バリデーションエラー
```json
{
  "errors": [
    {
      "field": "string",
      "message": "string",
      "code": "string"
    }
  ]
}
```

#### 4.2.2 エラーコード
- `REQUIRED_FIELD_MISSING`: 必須フィールドが不足
- `INVALID_DATA_TYPE`: データ型が不正
- `VALUE_OUT_OF_RANGE`: 値が範囲外
- `INVALID_ENUM_VALUE`: 列挙値が不正
- `LOGICAL_INCONSISTENCY`: 論理的整合性エラー


## 5. 実装時の注意事項

### 5.1 パフォーマンス考慮
- JSONカラムのインデックス設定
- 承認者判定の最適化

### 5.2 セキュリティ考慮
- 権限設定の適切な検証
- データの整合性保証

### 5.3 拡張性考慮
- 新しい承認パターンの追加
- 既存データとの互換性




## 6. 使用例

### 6.1 基本的な見積承認フロー
```json
{
  "requesters": [
    {
      "type": "system_level",
      "value": "employee",
      "display_name": "担当者"
    }
  ],
}
{
  "approval_steps": [
    {
      "step": 0,
      "name": "承認依頼作成",
      "approvers": [
        {
          "type": "system_level",
          "value": "employee",
          "display_name": "担当者"
        }
      ],
      "available_permissions": [
        "estimate.approval.request"
      ]
    },
    {
      "step": 1,
      "name": "第1承認",
      "approvers": [
        {
          "type": "system_level",
          "value": "employee",
          "display_name": "担当者"
        }
      ],
      "available_permissions": [
        "estimate.approval.view",
        "estimate.approval.approve",
        "estimate.approval.return"
      ],
      "approval_type": "required"
    }
  ]
}
```

### 6.2 ステップ承認フロー
```json
{
  "flow_type": "estimate",
  "requesters": [
    {
      "type": "system_level",
      "value": "employee",
      "display_name": "担当者"
    }
  ],
  "approval_steps": [
    {
      "step": 0,
      "name": "承認依頼作成",
      "approvers": [
        {
          "type": "system_level",
          "value": "employee",
          "display_name": "担当者"
        }
      ],
      "available_permissions": [
        "estimate.approval.request"
      ]
    },
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
      "available_permissions": [
        "estimate.approval.view",
        "estimate.approval.approve",
        "estimate.approval.return"
      ],
      "approval_type": "required"
    },
    {
      "step": 2,
      "name": "第2承認",
      "approvers": [
        {
          "type": "position",
          "value": 5,
          "display_name": "部長"
        }
      ],
      "available_permissions": [
        "estimate.approval.view",
        "estimate.approval.approve",
        "estimate.approval.reject",
        "estimate.approval.return"
      ],
      "approval_type": "required"
    },
    {
      "step": 3,
      "name": "最終承認",
      "approvers": [
        {
          "type": "system_level",
          "value": "executive",
          "display_name": "最高責任者"
        }
      ],
      "available_permissions": [
        "estimate.approval.view",
        "estimate.approval.approve",
        "estimate.approval.reject",
        "estimate.approval.return",
        "estimate.approval.cancel"
      ],
      "approval_type": "required"
    }
  ]
}
```

## 7. まとめ

このJSON構造の詳細ルールにより、以下のことが保証されます：

1. **データの整合性**: 厳密な型定義と制約により、データの整合性が保たれる
2. **実装の一貫性**: 明確なルールにより、実装時の混乱を防ぐ
3. **拡張性**: 新しい承認パターンを追加する際の指針を提供
4. **保守性**: 明確な構造により、保守・運用が容易になる
5. **パフォーマンス**: 適切なインデックス設定により、高速な検索が可能

これらのルールに従って実装することで、シンプルで拡張性の高い承認フローシステムを構築できます。



## 8. データベース設計

### 8.1 approval_flowsテーブルの拡張
```sql
-- 基本情報の拡張
ALTER TABLE approval_flows ADD COLUMN flow_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE approval_flows ADD COLUMN priority INTEGER DEFAULT 1;

-- 承認フロー設定
ALTER TABLE approval_flows ADD COLUMN requesters JSON;
ALTER TABLE approval_flows ADD COLUMN approval_steps JSON;

-- インデックスの追加
CREATE INDEX idx_approval_flows_flow_type ON approval_flows (flow_type);
CREATE INDEX idx_approval_flows_priority ON approval_flows (priority);
CREATE INDEX idx_approval_flows_requesters ON approval_flows USING GIN (requesters);
CREATE INDEX idx_approval_flows_approval_steps ON approval_flows USING GIN (approval_steps);
```




## 9. 承認依頼処理

### 9.1 承認依頼作成時の処理
```php
public function createApprovalRequest($userId, $requestData) {
    // 1. 承認フローを選択
    $approvalFlow = $this->selectApprovalFlow($userId);
    
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
    
    // 3. 第1ステップの承認者に通知
    $this->notifyApprovers($approvalRequest, 1);
    
    return $approvalRequest;
}
```

### 9.2 承認処理
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
        // 4. 次のステップへ
        $nextStep = $currentStep + 1;
        $flow = $approvalRequest->approvalFlow;
        
        if ($nextStep <= count($flow->approval_steps) - 1) {
            $approvalRequest->update(['current_step' => $nextStep]);
            $this->notifyApprovers($approvalRequest, $nextStep);
        } else {
            // 最終承認完了
            $approvalRequest->update(['status' => 'approved']);
        }
    }
    
    return $approvalRequest;
}
```

### 9.3 承認者権限チェック
```php
public function canApprove($userId, $approvalRequest, $step) {
    $flow = ApprovalFlow::find($approvalRequest->approval_flow_id);
    $approvalSteps = $flow->approval_steps;
    
    // 指定されたステップの設定を取得
    $stepConfig = null;
    foreach ($approvalSteps as $stepData) {
        if ($stepData['step'] == $step) {
            $stepConfig = $stepData;
            break;
        }
    }
    
    if (!$stepConfig) {
        return false;
    }
    
    foreach ($stepConfig['approvers'] as $approver) {
        switch ($approver['type']) {
            case 'system_level':
                if (User::find($userId)->system_level == $approver['value']) {
                    return true;
                }
                break;
            case 'position':
                if (User::find($userId)->employee->position_id == $approver['value']) {
                    return true;
                }
                break;
            case 'user':
                if ($userId == $approver['value']) {
                    return true;
                }
                break;
            case 'department':
                if (User::find($userId)->employee->department_id == $approver['value']) {
                    return true;
                }
                break;
        }
    }
    return false;
}

```

## 10. UI設計

### 10.1 承認フロー設定画面
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
│   ├── ステップ0: 承認依頼作成
│   │   ├── 承認者: システム権限レベル [上長]
│   │   └── 利用可能権限: [承認依頼作成]
│   ├── ステップ1: 第1承認
│   │   ├── 承認者: システム権限レベル [上長]
│   │   ├── 利用可能権限: [閲覧] [承認] [差し戻し]
│   │   └── 承認条件: [必須承認] [過半数承認] [任意承認]
│   ├── ステップ2: 第2承認
│   │   ├── 承認者: 職位 [部長] + 個別ユーザー [佐藤花子]
│   │   ├── 利用可能権限: [閲覧] [承認] [却下] [差し戻し]
│   │   └── 承認条件: [必須承認] [過半数承認] [任意承認]
│   └── ステップ3: 最終承認
│       ├── 承認者: システム権限レベル [最高責任者]
│       ├── 利用可能権限: [閲覧] [承認] [却下] [差し戻し] [キャンセル]
│       └── 承認条件: [必須承認] [過半数承認] [任意承認]
└── 操作ボタン
    ├── [保存]
    ├── [キャンセル]
    └── [プレビュー]
```

### 10.2 承認依頼作成画面
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

## 11. 権限管理の変更

### 11.1 権限管理の分離

#### 11.1.1 承認フロー設定権限（permissionテーブルで管理）
```sql
-- 承認フロー設定権限のみ残す
SELECT * FROM permissions WHERE name IN (
    'approval.flow.view',
    'approval.flow.create',
    'approval.flow.edit',
    'approval.flow.delete'
);
```

#### 11.1.2 承認操作権限（ステップ設定で管理）
```json
{
  "available_permissions": [
    "estimate.approval.view",
    "estimate.approval.approve",
    "estimate.approval.reject",
    "estimate.approval.return",
    "estimate.approval.cancel"
  ]
}
```


### 11.2 権限チェックの実装

#### 11.2.1 承認操作時の権限チェック
```php
public function canPerformAction($userId, $approvalRequest, $action) {
    $stepConfig = $this->getCurrentStepConfig($approvalRequest);
    
    // 1. 承認者かどうかチェック
    if (!$this->isApprover($userId, $stepConfig)) {
        return false;
    }
    
    // 2. そのステップでその権限が使えるかチェック（ユーザー個別権限チェックは不要）
    $requiredPermission = "estimate.approval.{$action}";
    if (!in_array($requiredPermission, $stepConfig['available_permissions'])) {
        return false;
    }
    
    return true;
}
```

### 11.3 承認管理ページの権限設定
- **承認フロー設定権限**: システム権限レベルで管理
- **承認操作権限**: ステップ設定で管理（承認管理ページでは設定しない）


## 12. 実装手順

### Phase 1: データベース設計
1. approval_flowsテーブルの拡張
2. 承認依頼者・承認ステップのJSON構造設計
3. 既存データの移行

### Phase 2: バックエンド実装
1. 承認フロー設定API実装
2. 承認依頼処理API実装
3. 承認者判定ロジック実装

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

## 13. メリット

### 13.1 柔軟性の向上
- 承認フローごとに異なる承認者を設定可能
- プロジェクトや案件に応じた動的な承認者設定
- 承認フローの複製時に承認者も一緒に複製

### 13.2 管理の簡素化
- 承認フローと承認者が一箇所で管理される
- 承認フローの変更時に承認者も同時に変更可能
- 権限テーブルの複雑化を回避

### 13.3 運用の現実性
- 実際の業務フローに即した設定方法
- 承認フロー設計者が承認者も同時に設定可能
- 承認フローのテスト時に承認者も含めてテスト可能

### 13.4 セキュリティの向上
- 承認フローごとの細かい権限制御
- 承認依頼者と承認者の明確な分離
- 承認フロー設定権限と承認操作権限の分離

## 14. 注意事項

### 14.1 既存データの移行
- 既存の承認フローに承認依頼者・承認ステップを設定
- 既存の承認依頼の処理方法を決定
- 権限テーブルの整理

### 14.2 パフォーマンス
- JSON形式のデータアクセス最適化
- 承認者判定のキャッシュ機能
- 大量データでの動作確認

### 14.3 エラーハンドリング
- 承認フロー設定のバリデーション
- 承認者不在時の処理
