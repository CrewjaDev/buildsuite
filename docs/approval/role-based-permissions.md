# 役割別権限設定ガイド

## 概要

申請専門担当者、承認者、管理者など、役割に応じた権限設定について詳しく説明します。特に「申請はするが承認はしない担当者」への対応方法を中心に解説します。

## 🎯 役割別権限分類

### 1. 基本的な役割分類

#### A. 申請専門担当者（一般担当者）
```
権限内容:
✓ 見積参照・作成・編集
✓ 承認依頼作成・編集・キャンセル
✗ 承認実行（承認・却下・差戻）
✗ フロー設計・変更
✗ 他者の申請内容参照
```

#### B. 承認者（課長・部長等）
```
権限内容:
✓ 見積参照・作成・編集
✓ 承認依頼作成・編集・キャンセル
✓ 承認実行（承認・却下・差戻）
✓ 部署内案件の参照
✗ フロー設計・変更（部長以上のみ可）
```

#### C. 管理者（システム管理者・上級管理職）
```
権限内容:
✓ 全ての基本機能
✓ 承認実行（制限なし）
✓ フロー設計・変更
✓ 全案件参照
✓ 権限設定変更
```

## 🎨 役割別権限設定画面

### メイン設定画面

```
┌─────────────────────────────────────────────────────────────┐
│ 役割別権限設定                                              │
├─────────────────────────────────────────────────────────────┤
│ 【役割選択】                                               │
│ ○ 申請専門担当者  ○ 承認者  ○ 管理者  ○ カスタム役割       │
│                                                           │
│ 【対象設定】                                               │
│ 部署: [営業部 ▼] 役職: [担当 ▼]                            │
│ 対象者: 山田担当, 鈴木担当, 高橋担当... (15名)              │
├─────────────────────────────────────────────────────────────┤
│ 【申請専門担当者の権限設定】                               │
│                                                           │
│ ■基本権限                                                 │
│ ☑ 見積機能アクセス                                        │
│ ☑ 見積参照         範囲: [自分作成分のみ ▼]               │
│ ☑ 見積作成         制限: [部署予算範囲内 ▼]               │
│ ☑ 見積編集         条件: [未申請分のみ ▼]                 │
│ ☑ 見積削除         条件: [ドラフトのみ ▼]                 │
│                                                           │
│ ■申請権限                                                 │
│ ☑ 承認依頼作成     範囲: [自分作成見積のみ ▼]             │
│ ☑ 承認依頼編集     条件: [未承認開始のみ ▼]               │
│ ☑ 承認依頼キャンセル 条件: [自分申請分のみ ▼]               │
│ ☑ 承認依頼再提出   条件: [差戻分のみ ▼]                   │
│ ☑ 申請状況確認     範囲: [自分申請分のみ ▼]               │
│                                                           │
│ ■制限事項                                                 │
│ ☐ 承認実行         ※申請専門担当者は承認不可               │
│ ☐ 他者申請参照     ※自分の申請のみ参照可能                 │
│ ☐ フロー設計       ※管理権限なし                          │
│ ☐ 権限設定変更     ※管理権限なし                          │
├─────────────────────────────────────────────────────────────┤
│ 【通知設定】                                               │
│ ☑ 申請受付通知     ☑ 承認完了通知     ☑ 却下・差戻通知     │
│ ☑ 期限アラート     ☐ 他者申請通知     ☐ システム通知       │
├─────────────────────────────────────────────────────────────┤
│ [保存] [プレビュー] [テンプレート保存] [リセット]            │
└─────────────────────────────────────────────────────────────┘
```

### 部署・役職・役割マトリックス

```
┌─────────────────────────────────────────────────────────────┐
│ 部署・役職・役割マトリックス                                 │
├─────────────────────────────────────────────────────────────┤
│ 表示: [権限概要 ▼] フィルタ: [営業部 ▼]                     │
├─┬─────────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ │           │部長  │課長  │主任  │担当  │役割  │備考  │
├─┼─────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│営│営業部      │承認者│承認者│承認者│申請者│     │     │
│業│           │制限  │2000万│500万 │-    │     │15名 │
│ │           │なし  │     │     │     │     │     │
├─┼─────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│技│技術部      │承認者│承認者│承認者│申請者│     │     │
│術│           │制限  │1500万│300万 │-    │     │8名  │
│ │           │なし  │     │     │     │     │     │
├─┼─────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│管│管理部      │承認者│承認者│申請者│申請者│     │     │
│理│           │制限  │1000万│-    │-    │     │5名  │
│ │           │なし  │     │     │     │     │     │
├─┼─────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│総│総務部      │承認者│承認者│申請者│申請者│     │     │
│務│           │制限  │500万 │-    │-    │     │3名  │
│ │           │なし  │     │     │     │     │     │
├─┴─────────┴─────┴─────┴─────┴─────┴─────┴─────┤
│ 凡例: 承認者=承認権限あり, 申請者=申請のみ, -=権限なし        │
│       金額=承認上限額                                      │
├─────────────────────────────────────────────────────────────┤
│ [詳細設定] [一括変更] [役割テンプレート] [エクスポート]       │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 技術実装

### 1. 役割ベース権限テーブル

```php
// 役割定義テーブル
CREATE TABLE permission_roles (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100), -- 'applicant', 'approver', 'admin'
    display_name VARCHAR(255),
    description TEXT,
    permissions JSON, -- 役割の権限定義
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

// 部署・役職・役割の関連テーブル
CREATE TABLE department_position_roles (
    id BIGINT PRIMARY KEY,
    department_id BIGINT,
    position_id BIGINT,
    role_id BIGINT,
    additional_permissions JSON NULL, -- 追加権限
    restrictions JSON NULL, -- 制限事項
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    UNIQUE KEY unique_dept_pos (department_id, position_id)
);
```

### 2. 権限チェック実装

```php
class RoleBasedPermissionService
{
    public function canUserApprove(User $user, ApprovalRequest $request): bool
    {
        // 1. ユーザーの役割を取得
        $userRole = $this->getUserRole($user);
        
        // 2. 申請専門担当者は承認不可
        if ($userRole->name === 'applicant') {
            return false;
        }
        
        // 3. 承認者の場合は金額制限等をチェック
        if ($userRole->name === 'approver') {
            return $this->checkApprovalLimits($user, $request);
        }
        
        // 4. 管理者は制限なし
        return $userRole->name === 'admin';
    }
    
    public function canUserViewRequest(User $user, ApprovalRequest $request): bool
    {
        $userRole = $this->getUserRole($user);
        
        switch ($userRole->name) {
            case 'applicant':
                // 申請者は自分の申請のみ参照可能
                return $request->requested_by === $user->id;
                
            case 'approver':
                // 承認者は部署内案件を参照可能
                return $this->isSameDepartment($user, $request->requester);
                
            case 'admin':
                // 管理者は全案件参照可能
                return true;
                
            default:
                return false;
        }
    }
    
    private function getUserRole(User $user): PermissionRole
    {
        $deptPosRole = DepartmentPositionRole::where('department_id', $user->employee->department_id)
            ->where('position_id', $user->employee->position_id)
            ->first();
            
        return $deptPosRole ? $deptPosRole->role : $this->getDefaultRole();
    }
    
    private function checkApprovalLimits(User $user, ApprovalRequest $request): bool
    {
        $userRole = $this->getUserRole($user);
        $permissions = $userRole->permissions;
        
        // 金額制限チェック
        if (isset($permissions['approval_amount_limit'])) {
            $requestAmount = $this->getRequestAmount($request);
            if ($requestAmount > $permissions['approval_amount_limit']) {
                return false;
            }
        }
        
        // 部署制限チェック
        if (isset($permissions['approval_scope']) && $permissions['approval_scope'] === 'department_only') {
            return $this->isSameDepartment($user, $request->requester);
        }
        
        return true;
    }
}
```

### 3. 役割テンプレート定義

```php
// 役割テンプレートのシーダー
class PermissionRoleSeeder extends Seeder
{
    public function run()
    {
        // 申請専門担当者
        PermissionRole::create([
            'name' => 'applicant',
            'display_name' => '申請専門担当者',
            'description' => '見積作成と承認依頼のみ可能',
            'permissions' => [
                'estimate.view' => ['scope' => 'own_only'],
                'estimate.create' => true,
                'estimate.edit' => ['condition' => 'own_draft_only'],
                'estimate.delete' => ['condition' => 'own_draft_only'],
                'approval.request.create' => ['scope' => 'own_estimates_only'],
                'approval.request.edit' => ['condition' => 'before_approval'],
                'approval.request.cancel' => ['scope' => 'own_only'],
                'approval.request.view' => ['scope' => 'own_only'],
                'approval.execute' => false, // 承認不可
                'approval.flow.design' => false, // フロー設計不可
            ],
            'is_system' => true
        ]);
        
        // 承認者（課長クラス）
        PermissionRole::create([
            'name' => 'approver_manager',
            'display_name' => '承認者（課長）',
            'description' => '部署内案件の承認が可能',
            'permissions' => [
                'estimate.view' => ['scope' => 'department'],
                'estimate.create' => true,
                'estimate.edit' => ['scope' => 'department'],
                'estimate.delete' => ['condition' => 'draft_only'],
                'approval.request.create' => true,
                'approval.request.edit' => ['condition' => 'before_approval'],
                'approval.request.cancel' => ['scope' => 'department'],
                'approval.request.view' => ['scope' => 'department'],
                'approval.execute' => true,
                'approval_amount_limit' => 20000000, // 2000万円
                'approval.flow.design' => false,
            ],
            'is_system' => true
        ]);
        
        // 管理者
        PermissionRole::create([
            'name' => 'admin',
            'display_name' => '管理者',
            'description' => '全権限を持つ管理者',
            'permissions' => [
                'estimate.view' => ['scope' => 'all'],
                'estimate.create' => true,
                'estimate.edit' => ['scope' => 'all'],
                'estimate.delete' => ['scope' => 'all'],
                'approval.request.create' => true,
                'approval.request.edit' => ['scope' => 'all'],
                'approval.request.cancel' => ['scope' => 'all'],
                'approval.request.view' => ['scope' => 'all'],
                'approval.execute' => true,
                'approval_amount_limit' => null, // 制限なし
                'approval.flow.design' => true,
                'system.admin' => true,
            ],
            'is_system' => true
        ]);
    }
}
```

## 📋 運用例

### 営業部の場合

```
営業部長（承認者）:
├─ 営業課長A（承認者）: 2000万円まで承認可能
│  ├─ 営業主任A（承認者）: 500万円まで承認可能  
│  ├─ 営業担当A（申請者）: 申請のみ
│  ├─ 営業担当B（申請者）: 申請のみ
│  └─ 営業担当C（申請者）: 申請のみ
└─ 営業課長B（承認者）: 2000万円まで承認可能
   ├─ 営業担当D（申請者）: 申請のみ
   ├─ 営業担当E（申請者）: 申請のみ
   └─ 営業担当F（申請者）: 申請のみ
```

### 申請フロー例

```
1. 営業担当A が見積を作成
2. 営業担当A が承認依頼を申請
3. 営業主任A が1次承認（500万円以下なら完了）
4. 営業課長A が2次承認（2000万円以下なら完了）
5. 営業部長 が最終承認（2000万円超の場合）
```

## 🎯 このアプローチのメリット

### ✅ **明確な役割分離**
- 申請者と承認者の責任が明確
- 権限の混乱が発生しにくい
- 監査時の責任追跡が容易

### ✅ **効率的な権限管理**
- 役職に応じた自動権限付与
- 大量の担当者への一括設定
- 異動時の権限変更が簡単

### ✅ **セキュリティの向上**
- 申請者は自分の案件のみアクセス
- 承認者は必要な範囲のみアクセス
- 不正な権限行使を防止

### ✅ **業務フローの最適化**
- 申請者は申請業務に集中
- 承認者は承認業務に集中
- 管理者は全体管理に集中

この役割ベースの権限設定により、**申請専門担当者複数に対して効率的で安全な権限管理**が実現できます。
