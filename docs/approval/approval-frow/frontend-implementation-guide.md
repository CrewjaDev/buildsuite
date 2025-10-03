# フロントエンド実装ガイド

## 概要
承認フロー編集ダイアログに新機能（ステップ別編集・キャンセル条件設定）を追加する実装ガイドです。

## 実装が必要なファイル

### 1. ApprovalFlowForm.tsx の拡張

#### 1.1 型定義の追加
```typescript
// 既存の型定義に追加
interface StepConditions {
  allow_during_pending: boolean;
  allow_during_reviewing: boolean;
  allow_during_step_approved: boolean;
  allow_during_expired: boolean;
}

interface ApprovalStep {
  // 既存のプロパティ
  step: number;
  name: string;
  approvers: Approver[];
  condition: Condition;
  
  // 新規追加
  editing_conditions?: StepConditions;
  cancellation_conditions?: StepConditions;
}

interface ApprovalFlow {
  // 既存のプロパティ
  id?: number;
  name: string;
  description: string;
  flow_type: string;
  conditions: ApprovalConditions;
  requesters: ApprovalRequester[];
  approval_steps: ApprovalStep[];
  
  // 新規追加
  flow_config?: {
    allow_editing_after_request: boolean;
    allow_cancellation_after_request: boolean;
    step_settings?: {
      [key: string]: {
        editing_conditions: StepConditions;
        cancellation_conditions: StepConditions;
      };
    };
  };
}
```

#### 1.2 ステップ別詳細設定コンポーネント
```typescript
const StepDetailSettings: React.FC<{
  step: ApprovalStep;
  stepIndex: number;
  onUpdate: (stepIndex: number, field: string, value: any) => void;
}> = ({ step, stepIndex, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const defaultEditingConditions = {
    allow_during_pending: true,
    allow_during_reviewing: false,
    allow_during_step_approved: true,
    allow_during_expired: false,
  };
  
  const defaultCancellationConditions = {
    allow_during_pending: true,
    allow_during_reviewing: false,
    allow_during_step_approved: false,
    allow_during_expired: false,
  };
  
  const editingConditions = step.editing_conditions || defaultEditingConditions;
  const cancellationConditions = step.cancellation_conditions || defaultCancellationConditions;
  
  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">詳細設定</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? '折りたたむ' : '展開'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4 mt-4">
          {/* 編集条件 */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-600">編集条件</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`editing-pending-${stepIndex}`}
                  checked={editingConditions.allow_during_pending}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'editing_conditions', {
                      ...editingConditions,
                      allow_during_pending: checked
                    })
                  }
                />
                <Label htmlFor={`editing-pending-${stepIndex}`} className="text-sm">
                  承認待ち中に編集を許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`editing-reviewing-${stepIndex}`}
                  checked={editingConditions.allow_during_reviewing}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'editing_conditions', {
                      ...editingConditions,
                      allow_during_reviewing: checked
                    })
                  }
                />
                <Label htmlFor={`editing-reviewing-${stepIndex}`} className="text-sm">
                  審査中に編集を許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`editing-step-approved-${stepIndex}`}
                  checked={editingConditions.allow_during_step_approved}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'editing_conditions', {
                      ...editingConditions,
                      allow_during_step_approved: checked
                    })
                  }
                />
                <Label htmlFor={`editing-step-approved-${stepIndex}`} className="text-sm">
                  ステップ承認後に編集を許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`editing-expired-${stepIndex}`}
                  checked={editingConditions.allow_during_expired}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'editing_conditions', {
                      ...editingConditions,
                      allow_during_expired: checked
                    })
                  }
                />
                <Label htmlFor={`editing-expired-${stepIndex}`} className="text-sm">
                  期限切れ後に編集を許可
                </Label>
              </div>
            </div>
          </div>
          
          {/* キャンセル条件 */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-600">キャンセル条件</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`cancellation-pending-${stepIndex}`}
                  checked={cancellationConditions.allow_during_pending}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'cancellation_conditions', {
                      ...cancellationConditions,
                      allow_during_pending: checked
                    })
                  }
                />
                <Label htmlFor={`cancellation-pending-${stepIndex}`} className="text-sm">
                  承認待ち中にキャンセルを許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`cancellation-reviewing-${stepIndex}`}
                  checked={cancellationConditions.allow_during_reviewing}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'cancellation_conditions', {
                      ...cancellationConditions,
                      allow_during_reviewing: checked
                    })
                  }
                />
                <Label htmlFor={`cancellation-reviewing-${stepIndex}`} className="text-sm">
                  審査中にキャンセルを許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`cancellation-step-approved-${stepIndex}`}
                  checked={cancellationConditions.allow_during_step_approved}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'cancellation_conditions', {
                      ...cancellationConditions,
                      allow_during_step_approved: checked
                    })
                  }
                />
                <Label htmlFor={`cancellation-step-approved-${stepIndex}`} className="text-sm">
                  ステップ承認後にキャンセルを許可
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id={`cancellation-expired-${stepIndex}`}
                  checked={cancellationConditions.allow_during_expired}
                  onCheckedChange={(checked) => 
                    onUpdate(stepIndex, 'cancellation_conditions', {
                      ...cancellationConditions,
                      allow_during_expired: checked
                    })
                  }
                />
                <Label htmlFor={`cancellation-expired-${stepIndex}`} className="text-sm">
                  期限切れ後にキャンセルを許可
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 1.3 基本フロー設定コンポーネント
```typescript
const BasicFlowSettings: React.FC<{
  flowConfig: any;
  onUpdate: (field: string, value: any) => void;
}> = ({ flowConfig, onUpdate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          基本フロー設定
        </CardTitle>
        <CardDescription>承認フロー全体の基本設定を行います</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="allow-editing-after-request"
            checked={flowConfig.allow_editing_after_request || false}
            onCheckedChange={(checked) => onUpdate('allow_editing_after_request', checked)}
          />
          <Label htmlFor="allow-editing-after-request" className="text-sm">
            承認依頼後の編集を許可
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="allow-cancellation-after-request"
            checked={flowConfig.allow_cancellation_after_request || false}
            onCheckedChange={(checked) => onUpdate('allow_cancellation_after_request', checked)}
          />
          <Label htmlFor="allow-cancellation-after-request" className="text-sm">
            承認依頼後のキャンセルを許可
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### 1.4 データ変換ロジック
```typescript
// フォームデータからAPIデータへの変換
const convertFormToApiData = (formData: any) => {
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
      allow_editing_after_request: formData.flow_config?.allow_editing_after_request || false,
      allow_cancellation_after_request: formData.flow_config?.allow_cancellation_after_request || false,
      step_settings: {}
    }
  };
  
  // ステップ別設定の変換
  formData.approval_steps.forEach((step: ApprovalStep) => {
    if (step.editing_conditions || step.cancellation_conditions) {
      const stepKey = `step_${step.step}`;
      apiData.flow_config.step_settings[stepKey] = {
        editing_conditions: step.editing_conditions || {
          allow_during_pending: true,
          allow_during_reviewing: false,
          allow_during_step_approved: true,
          allow_during_expired: false,
        },
        cancellation_conditions: step.cancellation_conditions || {
          allow_during_pending: true,
          allow_during_reviewing: false,
          allow_during_step_approved: false,
          allow_during_expired: false,
        }
      };
    }
  });
  
  return apiData;
};

// APIデータからフォームデータへの変換
const convertApiToFormData = (apiData: any) => {
  const formData = {
    // 既存フィールド
    name: apiData.name,
    description: apiData.description,
    flow_type: apiData.flow_type,
    conditions: apiData.conditions,
    requesters: apiData.requesters,
    approval_steps: apiData.approval_steps,
    
    // 新規フィールド
    flow_config: {
      allow_editing_after_request: apiData.flow_config?.allow_editing_after_request || false,
      allow_cancellation_after_request: apiData.flow_config?.allow_cancellation_after_request || false,
    }
  };
  
  // ステップ別設定の変換
  if (apiData.flow_config?.step_settings) {
    Object.keys(apiData.flow_config.step_settings).forEach(stepKey => {
      const stepNumber = parseInt(stepKey.replace('step_', ''));
      const stepSettings = apiData.flow_config.step_settings[stepKey];
      
      // 対応するステップに設定を適用
      const step = formData.approval_steps.find((s: ApprovalStep) => s.step === stepNumber);
      if (step) {
        step.editing_conditions = stepSettings.editing_conditions;
        step.cancellation_conditions = stepSettings.cancellation_conditions;
      }
    });
  }
  
  return formData;
};
```

## 実装手順

### 1. 型定義の更新
- `@/types/features/approvals/approvalFlows.ts` に新しい型定義を追加

### 2. ApprovalFlowForm.tsx の更新
- 既存の承認ステップ設定に詳細設定セクションを追加
- 基本フロー設定セクションを追加
- データ変換ロジックを実装

### 3. バリデーションの追加
- フロントエンド側での設定値の検証
- エラーメッセージの表示

### 4. テストの実施
- 新機能の動作確認
- 既存機能への影響確認

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
