# 階層別承認フロー設定ガイド

## 概要

このドキュメントでは、組織階層に応じた複雑な承認フローの設定方法について詳しく説明します。特に「担当者→上長→社長」の階層構造と、上長が申請者にもなる場合の動的フロー変更について解説します。

## 🎯 要求仕様の整理

### **基本承認フロー**
```
【一般担当者の申請の場合】
担当者（申請のみ） → 上長（部長・1回目承認） → 社長（最終決裁・2回目承認）

【上長（部長）の申請の場合】
上長（申請＋承認権限） → 社長（最終決裁・1回目承認のみ）

【社長の場合】
社長（承認のみ） → 承認フロー不要（直接決裁）
```

### **役割定義**
- **担当者**: 申請専門（承認権限なし）
- **上長（部長）**: 申請＋承認権限（金額制限なし）
- **社長**: 承認専門（申請は行わない、最終決裁者）

## 🎨 権限設定画面

### 階層別権限設定画面

```
┌─────────────────────────────────────────────────────────────┐
│ 階層別承認フロー設定                                         │
├─────────────────────────────────────────────────────────────┤
│ 【組織階層設定】                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 社長                                                   │ │
│ │ ├─ 営業部長（上長）                                     │ │
│ │ │  ├─ 営業課長                                         │ │
│ │ │  ├─ 営業担当A（申請専門）                            │ │
│ │ │  ├─ 営業担当B（申請専門）                            │ │
│ │ │  └─ 営業担当C（申請専門）                            │ │
│ │ ├─ 技術部長（上長）                                     │ │
│ │ │  ├─ 技術課長                                         │ │
│ │ │  ├─ 技術担当A（申請専門）                            │ │
│ │ │  └─ 技術担当B（申請専門）                            │ │
│ │ └─ 管理部長（上長）                                     │ │
│ │    ├─ 管理担当A（申請専門）                            │ │
│ │    └─ 管理担当B（申請専門）                            │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 【承認フロー設定】                                          │
│                                                           │
│ ■申請者タイプ別フロー                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 【担当者申請の場合】                                     │ │
│ │ Step1: [上長（部長）] 金額制限: [制限なし]              │ │
│ │ Step2: [社長] 最終決裁                                  │ │
│ │                                                       │ │
│ │ 【上長（部長）申請の場合】                               │ │
│ │ Step1: [社長] 最終決裁（1回のみ）                       │ │
│ │                                                       │ │
│ │ 【社長の場合】                                          │ │
│ │ 承認フローなし（直接決裁）                              │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 【権限マトリックス】                                        │
│ ┌─┬─────────┬─────┬─────┬─────┬─────┬─────┬─────┐ │
│ │ │役職       │申請  │承認1 │承認2 │参照  │編集  │削除  │ │
│ ├─┼─────────┼─────┼─────┼─────┼─────┼─────┼─────┤ │
│ │ │担当       │  ○  │  -  │  -  │ 自分 │ 自分 │ 自分 │ │
│ │ │上長（部長）│  ○  │  ○  │  -  │ 部署 │ 部署 │ 部署 │ │
│ │ │社長       │  -  │  ○  │  ○  │ 全社 │ 全社 │ 全社 │ │
│ └─┴─────────┴─────┴─────┴─────┴─────┴─────┴─────┘ │
├─────────────────────────────────────────────────────────────┤
│ 【動的フロー変更設定】                                      │
│ ☑ 申請者の役職に応じて自動フロー調整                        │
│ ☑ 上長申請時の承認ステップ短縮                              │
│ ☑ 社長申請時の自動承認                                      │
├─────────────────────────────────────────────────────────────┤
│ [保存] [プレビュー] [テスト実行] [リセット]                  │
└─────────────────────────────────────────────────────────────┘
```

### フロー可視化画面

```
┌─────────────────────────────────────────────────────────────┐
│ 承認フロー可視化                                            │
├─────────────────────────────────────────────────────────────┤
│ 申請者: [営業担当A ▼]                                       │
├─────────────────────────────────────────────────────────────┤
│ 【担当者申請のフロー】                                      │
│                                                           │
│ ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│ │ 営業担当A │───▶│ 営業部長 │───▶│  社長   │               │
│ │ (申請者) │    │ (1次承認)│    │(最終承認)│               │
│ └─────────┘    └─────────┘    └─────────┘               │
│      申請           承認1          承認2                    │
│                                                           │
│ 申請者: [営業部長 ▼]                                       │
│ 【上長申請のフロー】                                        │
│                                                           │
│ ┌─────────┐              ┌─────────┐                     │
│ │ 営業部長 │─────────────▶│  社長   │                     │
│ │ (申請者) │              │(最終承認)│                     │
│ └─────────┘              └─────────┘                     │
│      申請                    承認1                         │
│                                                           │
│ 申請者: [社長 ▼]                                           │
│ 【社長の場合】                                              │
│                                                           │
│ ┌─────────┐                                               │
│ │  社長   │ → 申請機能は利用不可                           │
│ │(承認専門)│    承認待ち案件のみ表示                        │
│ └─────────┘                                               │
├─────────────────────────────────────────────────────────────┤
│ [フロー詳細] [権限確認] [テストシミュレーション]             │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 技術実装

### 1. 階層別承認フロー設定テーブル

```php
// 階層別承認フロー設定
CREATE TABLE hierarchical_approval_flows (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    organization_level ENUM('staff', 'manager', 'director', 'president'),
    flow_steps JSON, -- 承認ステップの定義
    conditions JSON, -- 適用条件
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 組織階層定義
CREATE TABLE organization_hierarchy (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    level ENUM('staff', 'manager', 'director', 'president'),
    department_id BIGINT,
    superior_id BIGINT NULL, -- 上長のuser_id
    is_final_approver BOOLEAN DEFAULT FALSE, -- 最終決裁者フラグ
    approval_authority JSON, -- 承認権限の詳細
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (superior_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

### 2. 動的フロー決定サービス

```php
class HierarchicalApprovalFlowService
{
    /**
     * 申請者に応じた承認フローを動的に決定
     */
    public function determineApprovalFlow(User $applicant, ApprovalRequest $request): array
    {
        $hierarchy = $this->getOrganizationHierarchy($applicant);
        
        switch ($hierarchy->level) {
            case 'staff':
                // 担当者の場合: 上長 → 社長
                return $this->createStaffApprovalFlow($applicant, $request);
                
            case 'manager':
            case 'director':
                // 上長の場合: 社長のみ
                return $this->createManagerApprovalFlow($applicant, $request);
                
            case 'president':
                // 社長の場合: 承認フローなし
                return $this->createPresidentApprovalFlow($applicant, $request);
                
            default:
                throw new InvalidArgumentException('Unknown organization level');
        }
    }
    
    /**
     * 担当者申請の承認フロー（2段階）
     */
    private function createStaffApprovalFlow(User $applicant, ApprovalRequest $request): array
    {
        $superior = $this->getSuperior($applicant);
        $president = $this->getPresident();
        
        return [
            [
                'step_order' => 1,
                'approver_id' => $superior->id,
                'approver_type' => 'superior',
                'approval_type' => 'first_approval',
                'amount_limit' => null, // 制限なし
                'is_required' => true,
                'can_delegate' => true,
            ],
            [
                'step_order' => 2,
                'approver_id' => $president->id,
                'approver_type' => 'final_approver',
                'approval_type' => 'final_approval',
                'amount_limit' => null,
                'is_required' => true,
                'can_delegate' => false, // 社長は委譲不可
            ]
        ];
    }
    
    /**
     * 上長申請の承認フロー（1段階）
     */
    private function createManagerApprovalFlow(User $applicant, ApprovalRequest $request): array
    {
        $president = $this->getPresident();
        
        return [
            [
                'step_order' => 1,
                'approver_id' => $president->id,
                'approver_type' => 'final_approver',
                'approval_type' => 'final_approval',
                'amount_limit' => null,
                'is_required' => true,
                'can_delegate' => false,
            ]
        ];
    }
    
    /**
     * 社長申請の承認フロー（フローなし）
     */
    private function createPresidentApprovalFlow(User $applicant, ApprovalRequest $request): array
    {
        // 社長は承認フロー不要、直接承認済みとして処理
        return [
            [
                'step_order' => 1,
                'approver_id' => $applicant->id,
                'approver_type' => 'auto_approved',
                'approval_type' => 'direct_approval',
                'amount_limit' => null,
                'is_required' => false,
                'auto_approve' => true, // 自動承認
            ]
        ];
    }
    
    /**
     * 承認権限チェック
     */
    public function canUserApprove(User $user, ApprovalRequest $request, int $stepOrder): bool
    {
        $hierarchy = $this->getOrganizationHierarchy($user);
        $currentStep = $this->getCurrentApprovalStep($request, $stepOrder);
        
        // 申請者本人は承認不可（自己承認防止）
        if ($user->id === $request->requested_by) {
            return false;
        }
        
        // 担当者（staff）は承認権限なし
        if ($hierarchy->level === 'staff') {
            return false;
        }
        
        // 指定された承認者かチェック
        if ($currentStep['approver_id'] !== $user->id) {
            return false;
        }
        
        // 上長は1段階目の承認のみ
        if ($hierarchy->level === 'director' && $stepOrder > 1) {
            return false;
        }
        
        // 社長は全段階の承認が可能
        if ($hierarchy->level === 'president') {
            return true;
        }
        
        return true;
    }
    
    /**
     * 申請権限チェック
     */
    public function canUserApply(User $user): bool
    {
        $hierarchy = $this->getOrganizationHierarchy($user);
        
        // 社長は申請を行わない（承認専門）
        if ($hierarchy->level === 'president') {
            return false;
        }
        
        // 担当者と上長は申請可能
        return in_array($hierarchy->level, ['staff', 'manager', 'director']);
    }
    
    private function getSuperior(User $user): User
    {
        $hierarchy = OrganizationHierarchy::where('user_id', $user->id)->first();
        return User::find($hierarchy->superior_id);
    }
    
    private function getPresident(): User
    {
        $president = OrganizationHierarchy::where('level', 'president')
            ->where('is_final_approver', true)
            ->first();
        return User::find($president->user_id);
    }
    
    private function getOrganizationHierarchy(User $user): OrganizationHierarchy
    {
        return OrganizationHierarchy::where('user_id', $user->id)->first();
    }
}
```

### 3. 承認フロー実行制御

```php
class ApprovalFlowExecutor
{
    private $hierarchicalService;
    
    public function __construct(HierarchicalApprovalFlowService $hierarchicalService)
    {
        $this->hierarchicalService = $hierarchicalService;
    }
    
    /**
     * 承認依頼作成時のフロー設定
     */
    public function createApprovalRequest(User $applicant, array $requestData): ApprovalRequest
    {
        // 申請権限チェック
        if (!$this->hierarchicalService->canUserApply($applicant)) {
            throw new UnauthorizedException('この役職では申請できません');
        }
        
        // 申請作成
        $request = ApprovalRequest::create([
            'requested_by' => $applicant->id,
            'request_data' => $requestData,
            'status' => 'pending',
            'current_step' => 1,
        ]);
        
        // 動的フロー決定
        $flowSteps = $this->hierarchicalService->determineApprovalFlow($applicant, $request);
        
        // 承認ステップ作成
        foreach ($flowSteps as $stepData) {
            ApprovalStep::create([
                'approval_request_id' => $request->id,
                'step_order' => $stepData['step_order'],
                'approver_id' => $stepData['approver_id'],
                'approver_type' => $stepData['approver_type'],
                'approval_type' => $stepData['approval_type'],
                'status' => $stepData['step_order'] === 1 ? 'pending' : 'waiting',
                'is_required' => $stepData['is_required'],
                'can_delegate' => $stepData['can_delegate'],
                'auto_approve' => $stepData['auto_approve'] ?? false,
            ]);
        }
        
        // 自動承認処理（社長の直接申請など）
        $this->processAutoApproval($request);
        
        return $request;
    }
    
    /**
     * 承認実行
     */
    public function executeApproval(User $approver, ApprovalRequest $request, string $action, ?string $comment = null): bool
    {
        $currentStep = $request->currentStep();
        
        // 承認権限チェック
        if (!$this->hierarchicalService->canUserApprove($approver, $request, $currentStep->step_order)) {
            throw new UnauthorizedException('この申請を承認する権限がありません');
        }
        
        // 承認履歴記録
        ApprovalHistory::create([
            'approval_request_id' => $request->id,
            'step_id' => $currentStep->id,
            'approver_id' => $approver->id,
            'action' => $action,
            'comment' => $comment,
            'approved_at' => now(),
        ]);
        
        // ステップ状態更新
        $currentStep->update([
            'status' => $action,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'comment' => $comment,
        ]);
        
        // 次のステップへ進む or 完了処理
        if ($action === 'approved') {
            return $this->moveToNextStep($request);
        }
        
        return true;
    }
    
    /**
     * 自動承認処理
     */
    private function processAutoApproval(ApprovalRequest $request): void
    {
        $autoApprovalSteps = $request->steps()->where('auto_approve', true)->get();
        
        foreach ($autoApprovalSteps as $step) {
            $step->update([
                'status' => 'approved',
                'approved_by' => $step->approver_id,
                'approved_at' => now(),
                'comment' => '自動承認（社長直接申請）',
            ]);
            
            ApprovalHistory::create([
                'approval_request_id' => $request->id,
                'step_id' => $step->id,
                'approver_id' => $step->approver_id,
                'action' => 'approved',
                'comment' => '自動承認（社長直接申請）',
                'approved_at' => now(),
            ]);
        }
        
        // 全ステップが自動承認の場合は完了
        if ($request->steps()->where('auto_approve', false)->count() === 0) {
            $request->update(['status' => 'approved']);
        }
    }
}
```

### 4. GraphQL実装

```php
// 階層別承認フロー用のGraphQLクエリ
class HierarchicalApprovalFlowQuery
{
    public function getApprovalFlowByApplicant(User $applicant): array
    {
        $service = new HierarchicalApprovalFlowService();
        $dummyRequest = new ApprovalRequest(); // フロー確認用
        
        return $service->determineApprovalFlow($applicant, $dummyRequest);
    }
    
    public function getOrganizationHierarchy(): array
    {
        return OrganizationHierarchy::with(['user', 'department', 'superior'])
            ->orderBy('level')
            ->orderBy('department_id')
            ->get()
            ->toArray();
    }
}

// 階層別承認フロー用のGraphQLミューテーション
class CreateHierarchicalApprovalRequestMutation
{
    public function create($root, array $args): ApprovalRequest
    {
        $user = Auth::user();
        $executor = new ApprovalFlowExecutor(new HierarchicalApprovalFlowService());
        
        return $executor->createApprovalRequest($user, $args['input']);
    }
}
```

## 📋 実際の運用例

### 営業部の承認フロー例

```
【営業担当Aが100万円の見積を申請】
1. 営業担当A → 申請作成
2. システム → 営業部長（上長）に1次承認依頼
3. 営業部長 → 承認実行（金額制限なし）
4. システム → 社長に最終承認依頼  
5. 社長 → 最終承認実行
6. システム → 申請完了、営業担当Aに通知

【営業部長が500万円の見積を申請】
1. 営業部長 → 申請作成
2. システム → 社長に直接最終承認依頼（1段階のみ）
3. 社長 → 承認実行
4. システム → 申請完了、営業部長に通知

【社長が申請する場合】
1. 社長 → 申請作成機能は利用不可
2. システム → 承認待ち案件のみ表示
3. 社長 → 承認実行のみ可能
```

### 権限マトリックス

```
┌─────────────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 役職        │申請  │承認1 │承認2 │参照  │編集  │削除  │
├─────────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 営業担当A   │  ○  │  ×  │  ×  │ 自分 │ 自分 │ 自分 │
│ 営業担当B   │  ○  │  ×  │  ×  │ 自分 │ 自分 │ 自分 │
│ 営業部長    │  ○  │  ○  │  ×  │ 部署 │ 部署 │ 部署 │
│ 技術部長    │  ○  │  ○  │  ×  │ 部署 │ 部署 │ 部署 │
│ 社長        │  ×  │  ○  │  ○  │ 全社 │ 全社 │ 全社 │
└─────────────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### 組織設定データ例

```php
// 組織階層データの設定例
$organizationData = [
    [
        'user_id' => 1,
        'level' => 'president',
        'department_id' => null,
        'superior_id' => null,
        'is_final_approver' => true,
    ],
    [
        'user_id' => 2,
        'level' => 'director',
        'department_id' => 1, // 営業部
        'superior_id' => 1, // 社長
        'is_final_approver' => false,
    ],
    [
        'user_id' => 3,
        'level' => 'staff',
        'department_id' => 1, // 営業部
        'superior_id' => 2, // 営業部長
        'is_final_approver' => false,
    ],
    [
        'user_id' => 4,
        'level' => 'staff',
        'department_id' => 1, // 営業部
        'superior_id' => 2, // 営業部長
        'is_final_approver' => false,
    ],
];
```

## 🎯 このアプローチのメリット

### ✅ **動的フロー制御**
- 申請者の役職に応じた自動フロー調整
- 不要な承認ステップの自動スキップ
- 効率的な承認プロセス

### ✅ **権限の明確化**
- 役職別の明確な権限分離
- 自己承認の防止
- 責任の所在の明確化

### ✅ **運用の効率化**
- 上長申請時の承認ステップ短縮
- 社長申請時の自動処理
- 組織階層に最適化された業務フロー

### ✅ **柔軟性とスケーラビリティ**
- 組織変更への対応
- 新しい役職・部署への拡張
- 承認ルールのカスタマイズ

## 🔧 実装時の注意点

### **データ整合性の確保**
- 組織階層データの正確性
- 上長関係の循環参照防止
- 最終決裁者の一意性保証

### **パフォーマンス最適化**
- 組織階層クエリの最適化
- 承認フロー決定ロジックのキャッシュ
- 大量申請時の処理効率

### **セキュリティ考慮事項**
- 権限昇格の防止
- 承認フローの改ざん防止
- 監査ログの完全性

この階層別承認フロー設定により、**組織の実態に合わせた効率的で柔軟な承認システム**が実現できます。
