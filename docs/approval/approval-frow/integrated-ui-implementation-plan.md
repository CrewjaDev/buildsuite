# 統合UI実装計画

## 概要
既存の承認フロー設定画面を拡張して、ステップ別の編集・キャンセル条件設定を統合します。

## 実装方針

### 1. 既存画面の拡張
- **承認フロー設定画面**に「詳細設定」セクションを追加
- 各承認ステップに編集・キャンセル条件の設定を統合
- 保存時は`approval_steps`と`flow_config`を同時更新

### 2. UI構成

#### 2.1 承認フロー設定画面の構成
```
承認フロー設定画面
├── 基本情報
│   ├── フロー名
│   ├── 説明
│   ├── フロータイプ
│   └── 優先度
├── 承認依頼者設定
│   └── 依頼者一覧
├── 承認ステップ設定
│   ├── ステップ1: 第1承認
│   │   ├── 承認者設定
│   │   ├── 条件設定
│   │   └── 【新規】詳細設定
│   │       ├── 編集条件
│   │       └── キャンセル条件
│   ├── ステップ2: 第2承認
│   │   ├── 承認者設定
│   │   ├── 条件設定
│   │   └── 【新規】詳細設定
│   │       ├── 編集条件
│   │       └── キャンセル条件
│   └── ...
└── 基本フロー設定
    ├── 承認依頼後の編集許可
    └── 承認依頼後のキャンセル許可
```

#### 2.2 詳細設定セクションのUI
```
【詳細設定】セクション
├── 編集条件
│   ├── ☑ 承認待ち中に編集を許可
│   ├── ☐ 審査中に編集を許可
│   ├── ☑ ステップ承認後に編集を許可
│   └── ☐ 期限切れ後に編集を許可
└── キャンセル条件
    ├── ☑ 承認待ち中にキャンセルを許可
    ├── ☐ 審査中にキャンセルを許可
    ├── ☐ ステップ承認後にキャンセルを許可
    └── ☐ 期限切れ後にキャンセルを許可
```

## 実装詳細

### 1. フロントエンド実装

#### 1.1 コンポーネント構成
```typescript
// 承認フロー設定画面
interface ApprovalFlowForm {
  // 既存フィールド
  name: string;
  description: string;
  flow_type: string;
  conditions: any;
  requesters: Requester[];
  approval_steps: ApprovalStep[];
  
  // 新規フィールド
  flow_config: {
    allow_editing_after_request: boolean;
    allow_cancellation_after_request: boolean;
    step_settings: {
      [key: string]: {
        editing_conditions: StepConditions;
        cancellation_conditions: StepConditions;
      };
    };
  };
}

interface StepConditions {
  allow_during_pending: boolean;
  allow_during_reviewing: boolean;
  allow_during_step_approved: boolean;
  allow_during_expired: boolean;
}
```

#### 1.2 ステップ設定コンポーネント
```typescript
interface ApprovalStepForm {
  step: number;
  name: string;
  approvers: Approver[];
  condition: Condition;
  
  // 新規：詳細設定
  editing_conditions: StepConditions;
  cancellation_conditions: StepConditions;
}

const ApprovalStepForm: React.FC<{
  step: ApprovalStepForm;
  onChange: (step: ApprovalStepForm) => void;
}> = ({ step, onChange }) => {
  return (
    <div className="approval-step-form">
      {/* 既存の承認者設定 */}
      <ApproverSettings 
        approvers={step.approvers}
        onChange={(approvers) => onChange({...step, approvers})}
      />
      
      {/* 既存の条件設定 */}
      <ConditionSettings 
        condition={step.condition}
        onChange={(condition) => onChange({...step, condition})}
      />
      
      {/* 新規：詳細設定セクション */}
      <div className="step-detail-settings">
        <h4>詳細設定</h4>
        
        {/* 編集条件 */}
        <div className="editing-conditions">
          <h5>編集条件</h5>
          <CheckboxField
            label="承認待ち中に編集を許可"
            checked={step.editing_conditions.allow_during_pending}
            onChange={(checked) => onChange({
              ...step,
              editing_conditions: {
                ...step.editing_conditions,
                allow_during_pending: checked
              }
            })}
          />
          <CheckboxField
            label="審査中に編集を許可"
            checked={step.editing_conditions.allow_during_reviewing}
            onChange={(checked) => onChange({
              ...step,
              editing_conditions: {
                ...step.editing_conditions,
                allow_during_reviewing: checked
              }
            })}
          />
          <CheckboxField
            label="ステップ承認後に編集を許可"
            checked={step.editing_conditions.allow_during_step_approved}
            onChange={(checked) => onChange({
              ...step,
              editing_conditions: {
                ...step.editing_conditions,
                allow_during_step_approved: checked
              }
            })}
          />
          <CheckboxField
            label="期限切れ後に編集を許可"
            checked={step.editing_conditions.allow_during_expired}
            onChange={(checked) => onChange({
              ...step,
              editing_conditions: {
                ...step.editing_conditions,
                allow_during_expired: checked
              }
            })}
          />
        </div>
        
        {/* キャンセル条件 */}
        <div className="cancellation-conditions">
          <h5>キャンセル条件</h5>
          <CheckboxField
            label="承認待ち中にキャンセルを許可"
            checked={step.cancellation_conditions.allow_during_pending}
            onChange={(checked) => onChange({
              ...step,
              cancellation_conditions: {
                ...step.cancellation_conditions,
                allow_during_pending: checked
              }
            })}
          />
          <CheckboxField
            label="審査中にキャンセルを許可"
            checked={step.cancellation_conditions.allow_during_reviewing}
            onChange={(checked) => onChange({
              ...step,
              cancellation_conditions: {
                ...step.cancellation_conditions,
                allow_during_reviewing: checked
              }
            })}
          />
          <CheckboxField
            label="ステップ承認後にキャンセルを許可"
            checked={step.cancellation_conditions.allow_during_step_approved}
            onChange={(checked) => onChange({
              ...step,
              cancellation_conditions: {
                ...step.cancellation_conditions,
                allow_during_step_approved: checked
              }
            })}
          />
          <CheckboxField
            label="期限切れ後にキャンセルを許可"
            checked={step.cancellation_conditions.allow_during_expired}
            onChange={(checked) => onChange({
              ...step,
              cancellation_conditions: {
                ...step.cancellation_conditions,
                allow_during_expired: checked
              }
            })}
          />
        </div>
      </div>
    </div>
  );
};
```

#### 1.3 基本フロー設定コンポーネント
```typescript
const BasicFlowSettings: React.FC<{
  flowConfig: FlowConfig;
  onChange: (config: FlowConfig) => void;
}> = ({ flowConfig, onChange }) => {
  return (
    <div className="basic-flow-settings">
      <h3>基本フロー設定</h3>
      
      <CheckboxField
        label="承認依頼後の編集を許可"
        checked={flowConfig.allow_editing_after_request}
        onChange={(checked) => onChange({
          ...flowConfig,
          allow_editing_after_request: checked
        })}
      />
      
      <CheckboxField
        label="承認依頼後のキャンセルを許可"
        checked={flowConfig.allow_cancellation_after_request}
        onChange={(checked) => onChange({
          ...flowConfig,
          allow_cancellation_after_request: checked
        })}
      />
    </div>
  );
};
```

### 2. データ変換ロジック

#### 2.1 フォームデータからAPIデータへの変換
```typescript
const convertFormToApiData = (formData: ApprovalFlowForm) => {
  const apiData = {
    // 既存フィールド
    name: formData.name,
    description: formData.description,
    flow_type: formData.flow_type,
    conditions: formData.conditions,
    requesters: formData.requesters,
    approval_steps: formData.approval_steps,
    
    // 新規フィールド
    flow_config: {
      allow_editing_after_request: formData.flow_config.allow_editing_after_request,
      allow_cancellation_after_request: formData.flow_config.allow_cancellation_after_request,
      step_settings: {}
    }
  };
  
  // ステップ別設定の変換
  formData.approval_steps.forEach(step => {
    const stepKey = `step_${step.step}`;
    apiData.flow_config.step_settings[stepKey] = {
      editing_conditions: step.editing_conditions,
      cancellation_conditions: step.cancellation_conditions
    };
  });
  
  return apiData;
};
```

#### 2.2 APIデータからフォームデータへの変換
```typescript
const convertApiToFormData = (apiData: any): ApprovalFlowForm => {
  const formData: ApprovalFlowForm = {
    // 既存フィールド
    name: apiData.name,
    description: apiData.description,
    flow_type: apiData.flow_type,
    conditions: apiData.conditions,
    requesters: apiData.requesters,
    approval_steps: apiData.approval_steps,
    
    // 新規フィールド
    flow_config: {
      allow_editing_after_request: apiData.flow_config?.allow_editing_after_request ?? false,
      allow_cancellation_after_request: apiData.flow_config?.allow_cancellation_after_request ?? false,
      step_settings: {}
    }
  };
  
  // ステップ別設定の変換
  if (apiData.flow_config?.step_settings) {
    Object.keys(apiData.flow_config.step_settings).forEach(stepKey => {
      const stepNumber = parseInt(stepKey.replace('step_', ''));
      const stepSettings = apiData.flow_config.step_settings[stepKey];
      
      // 対応するステップに設定を適用
      const step = formData.approval_steps.find(s => s.step === stepNumber);
      if (step) {
        step.editing_conditions = stepSettings.editing_conditions;
        step.cancellation_conditions = stepSettings.cancellation_conditions;
      }
    });
  }
  
  return formData;
};
```

### 3. バリデーション

#### 3.1 フロントエンドバリデーション
```typescript
const validateApprovalFlow = (formData: ApprovalFlowForm): string[] => {
  const errors: string[] = [];
  
  // 既存のバリデーション
  if (!formData.name.trim()) {
    errors.push('フロー名は必須です');
  }
  
  if (!formData.approval_steps.length) {
    errors.push('承認ステップは1つ以上必要です');
  }
  
  // 新規：フロー設定のバリデーション
  if (formData.flow_config.allow_editing_after_request && 
      !formData.flow_config.allow_cancellation_after_request) {
    // 編集は許可するがキャンセルは許可しない場合の警告
    errors.push('編集を許可する場合は、キャンセルも許可することを推奨します');
  }
  
  return errors;
};
```

#### 3.2 バックエンドバリデーション
```php
// ApprovalFlowController.php の update メソッドで実装済み
$validator = Validator::make($request->all(), [
    'flow_config' => 'nullable|array',
    'flow_config.allow_editing_after_request' => 'boolean',
    'flow_config.allow_cancellation_after_request' => 'boolean',
    // ... その他のバリデーションルール
]);
```

### 4. 保存処理

#### 4.1 フロントエンド保存処理
```typescript
const saveApprovalFlow = async (formData: ApprovalFlowForm) => {
  try {
    // バリデーション
    const errors = validateApprovalFlow(formData);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    // APIデータに変換
    const apiData = convertFormToApiData(formData);
    
    // API呼び出し
    const response = await fetch(`/api/approval-flows/${formData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(apiData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('保存に失敗しました:', error);
    throw error;
  }
};
```

#### 4.2 バックエンド保存処理
```php
// ApprovalFlowController.php の update メソッドで実装済み
$updateData = array_merge($updateData, $request->only([
    'flow_type', 'conditions', 'requesters', 'approval_steps', 'flow_config'
]));

$flow->update($updateData);
```

## 実装ステップ

### Phase 1: バックエンド拡張
- [x] ApprovalFlowControllerのupdateメソッド拡張
- [x] バリデーションルール追加
- [x] flow_configの保存処理追加

### Phase 2: フロントエンド実装
- [ ] 既存の承認フロー設定画面の確認
- [ ] 詳細設定セクションの追加
- [ ] ステップ別設定コンポーネントの実装
- [ ] 基本フロー設定コンポーネントの実装
- [ ] データ変換ロジックの実装
- [ ] バリデーションの実装

### Phase 3: テスト・検証
- [ ] 統合テストの実施
- [ ] UI/UXテストの実施
- [ ] パフォーマンステストの実施

## 注意事項

### 1. 既存機能への影響
- 既存の承認フロー設定機能は維持
- 新機能はオプションとして追加
- 既存データとの互換性を確保

### 2. ユーザビリティ
- 詳細設定は折りたたみ可能にする
- デフォルト値は安全な設定にする
- 設定の説明を充実させる

### 3. パフォーマンス
- 大量のステップがある場合の表示最適化
- 保存時のデータサイズ制限
- フロントエンドの状態管理最適化

## 完了後の効果

### 1. 機能面
- ステップ別の柔軟な編集・キャンセル制御
- 承認フローごとの詳細設定
- 既存機能との完全統合

### 2. 運用面
- 管理者による柔軟な権限制御
- 業務要件に応じた設定変更
- 承認フローの細かい調整

### 3. 技術面
- 既存コードへの影響最小化
- 拡張性の確保
- 保守性の向上
