# 見積機能 権限設定ガイド

## 概要

見積基本情報（ヘッダーデータ）に対する権限設定について、現在の実装で実現可能な内容を詳しく説明します。承認フロー機能と権限システムを活用して、きめ細かい権限管理を実現できます。

## 🎯 見積基本情報の権限要件

### 対象データ（Estimateモデル）
```php
// 見積ヘッダー情報
- estimate_number     // 見積番号
- partner_id         // 取引先
- project_type_id    // プロジェクトタイプ
- project_name       // プロジェクト名
- project_location   // プロジェクト場所
- project_period_*   // プロジェクト期間
- status             // ステータス
- total_amount       // 合計金額
- description        // 説明
```

### 必要な権限設定
1. **利用権限**: 見積機能へのアクセス
2. **データ登録権限**: 新規見積作成
3. **編集権限**: 既存見積の修正
4. **削除権限**: 見積の削除
5. **承認フロー利用権限**: 承認プロセスの実行

## ✅ 現在の実装で実現可能な権限設定

### 1. Permission（権限）の定義

現在の権限システムで以下の見積関連権限を定義可能：

```php
// 見積機能の基本権限
$permissions = [
    // 利用権限
    [
        'name' => 'estimate.access',
        'display_name' => '見積機能アクセス',
        'description' => '見積機能へのアクセス権限',
        'module' => 'estimate',
        'action' => 'access',
        'resource' => 'module'
    ],
    
    // データ参照権限
    [
        'name' => 'estimate.view.estimate',
        'display_name' => '見積参照',
        'description' => '見積情報の参照権限',
        'module' => 'estimate',
        'action' => 'view',
        'resource' => 'estimate'
    ],
    
    // データ登録権限
    [
        'name' => 'estimate.create.estimate',
        'display_name' => '見積作成',
        'description' => '新規見積の作成権限',
        'module' => 'estimate',
        'action' => 'create',
        'resource' => 'estimate'
    ],
    
    // 編集権限
    [
        'name' => 'estimate.edit.estimate',
        'display_name' => '見積編集',
        'description' => '見積情報の編集権限',
        'module' => 'estimate',
        'action' => 'edit',
        'resource' => 'estimate'
    ],
    
    // 削除権限
    [
        'name' => 'estimate.delete.estimate',
        'display_name' => '見積削除',
        'description' => '見積の削除権限',
        'module' => 'estimate',
        'action' => 'delete',
        'resource' => 'estimate'
    ],
    
    // ステータス変更権限
    [
        'name' => 'estimate.status.estimate',
        'display_name' => '見積ステータス変更',
        'description' => '見積ステータスの変更権限',
        'module' => 'estimate',
        'action' => 'status',
        'resource' => 'estimate'
    ],
    
    // 承認フロー関連権限
    [
        'name' => 'estimate.approve.estimate',
        'display_name' => '見積承認',
        'description' => '見積の承認権限',
        'module' => 'estimate',
        'action' => 'approve',
        'resource' => 'estimate'
    ]
];
```

### 2. Role（役割）ベースの権限設定

```php
// 見積関連の役割例
$roles = [
    // 見積担当者
    [
        'name' => 'estimate_staff',
        'display_name' => '見積担当者',
        'description' => '見積の作成・編集を行う担当者',
        'permissions' => [
            'estimate.access',
            'estimate.view.estimate',
            'estimate.create.estimate',
            'estimate.edit.estimate',
        ]
    ],
    
    // 見積管理者
    [
        'name' => 'estimate_manager',
        'display_name' => '見積管理者',
        'description' => '見積管理の責任者',
        'permissions' => [
            'estimate.access',
            'estimate.view.estimate',
            'estimate.create.estimate',
            'estimate.edit.estimate',
            'estimate.delete.estimate',
            'estimate.status.estimate',
        ]
    ],
    
    // 見積承認者
    [
        'name' => 'estimate_approver',
        'display_name' => '見積承認者',
        'description' => '見積の承認を行う責任者',
        'permissions' => [
            'estimate.access',
            'estimate.view.estimate',
            'estimate.approve.estimate',
        ]
    ]
];
```

### 3. 権限チェックの実装例

Estimateモデルに権限チェック機能を追加：

```php
// app/Models/Estimate.php に追加
class Estimate extends Model
{
    // ... 既存コード ...
    
    /**
     * ユーザーが見積を参照可能かチェック
     */
    public function canView(User $user): bool
    {
        // 基本権限チェック
        if (!$user->hasPermission('estimate.view.estimate')) {
            return false;
        }
        
        // 作成者または管理者は常に参照可能
        if ($this->created_by === $user->id || $user->is_admin) {
            return true;
        }
        
        // 部署権限チェック（同一部署のみ参照可能等）
        if ($user->employee && $user->employee->department) {
            return $this->isAccessibleByDepartment($user->employee->department_id);
        }
        
        return false;
    }
    
    /**
     * ユーザーが見積を編集可能かチェック
     */
    public function canEdit(User $user): bool
    {
        // 基本権限チェック
        if (!$user->hasPermission('estimate.edit.estimate')) {
            return false;
        }
        
        // ステータスチェック（承認済みは編集不可等）
        if (in_array($this->status, ['approved', 'locked'])) {
            return false;
        }
        
        // 作成者または管理者のみ編集可能
        return $this->created_by === $user->id || $user->is_admin;
    }
    
    /**
     * ユーザーが見積を削除可能かチェック
     */
    public function canDelete(User $user): bool
    {
        // 基本権限チェック
        if (!$user->hasPermission('estimate.delete.estimate')) {
            return false;
        }
        
        // ステータスチェック（ドラフトのみ削除可能等）
        if ($this->status !== 'draft') {
            return false;
        }
        
        return $this->created_by === $user->id || $user->is_admin;
    }
    
    /**
     * 部署による参照権限チェック
     */
    private function isAccessibleByDepartment(int $departmentId): bool
    {
        // 見積作成者の部署と同一部署かチェック
        if ($this->creator && $this->creator->employee) {
            return $this->creator->employee->department_id === $departmentId;
        }
        
        return false;
    }
}
```

## 🔄 承認フローとの連携

### 1. 見積承認フローの設定

```php
// 見積承認フロー作成例
$estimateFlow = ApprovalFlow::create([
    'name' => '見積承認フロー（100万円以上）',
    'description' => '100万円以上の見積に適用される承認フロー',
    'flow_type' => 'estimate',
    'is_active' => true,
    'priority' => 10
]);

// 承認条件設定（金額ベース）
ApprovalCondition::create([
    'approval_flow_id' => $estimateFlow->id,
    'condition_type' => 'amount',
    'field_name' => 'total_amount',
    'operator' => 'greater_than_or_equal',
    'value' => [1000000],
    'is_active' => true
]);

// 承認ステップ設定
ApprovalStep::create([
    'approval_flow_id' => $estimateFlow->id,
    'step_order' => 1,
    'name' => '部長承認',
    'approver_type' => 'role',
    'approver_id' => 2 // 部長ロールID
]);
```

### 2. 見積作成時の承認フロー自動適用

```php
// Estimateモデルに追加
class Estimate extends Model
{
    /**
     * 見積作成後の承認フロー開始
     */
    public function startApprovalProcess(): ?ApprovalRequest
    {
        // 適用可能な承認フローを検索
        $flow = ApprovalFlow::active()
            ->byType('estimate')
            ->get()
            ->first(function ($flow) {
                return $flow->matchesConditions([
                    'total_amount' => $this->total_amount,
                    'department_id' => $this->creator->employee->department_id ?? null,
                ]);
            });
            
        if (!$flow) {
            return null;
        }
        
        // 承認依頼作成
        return ApprovalRequest::create([
            'approval_flow_id' => $flow->id,
            'request_type' => 'estimate',
            'request_id' => $this->id,
            'title' => "見積承認依頼：{$this->project_name}",
            'description' => "見積金額：" . number_format($this->total_amount) . "円",
            'request_data' => [
                'estimate_id' => $this->id,
                'total_amount' => $this->total_amount,
                'project_name' => $this->project_name,
            ],
            'current_step' => $flow->steps()->orderBy('step_order')->first()->id,
            'status' => 'pending',
            'requested_by' => $this->created_by,
            'expires_at' => now()->addDays(7)
        ]);
    }
}
```

## 🎨 フロントエンド実装提案

### 1. 権限設定画面の構成

#### 権限管理メニュー
```
承認フロー設定
├── 見積権限設定
│   ├── 基本権限設定
│   │   ├── 利用権限
│   │   ├── 参照権限
│   │   ├── 作成権限
│   │   ├── 編集権限
│   │   └── 削除権限
│   ├── 役割別権限設定
│   │   ├── 見積担当者
│   │   ├── 見積管理者
│   │   └── 見積承認者
│   └── 部署別権限設定
├── 承認フロー設定
│   ├── フロー一覧・作成
│   ├── 承認ステップ設定
│   └── 承認条件設定
└── 承認依頼管理
    ├── 承認待ち一覧
    ├── 承認履歴
    └── 承認処理
```

### 2. 画面イメージ

#### 見積権限設定画面
```
┌─────────────────────────────────────┐
│ 見積権限設定                          │
├─────────────────────────────────────┤
│ □ 見積機能アクセス                    │
│ □ 見積参照                          │
│ □ 見積作成                          │
│ □ 見積編集                          │
│ □ 見積削除                          │
│ □ 見積承認                          │
├─────────────────────────────────────┤
│ 役割選択: [見積担当者 ▼]               │
│ 部署選択: [営業部 ▼]                 │
├─────────────────────────────────────┤
│ [保存] [キャンセル]                   │
└─────────────────────────────────────┘
```

#### 承認フロー設定画面
```
┌─────────────────────────────────────┐
│ 見積承認フロー設定                    │
├─────────────────────────────────────┤
│ フロー名: [見積承認フロー（高額）]      │
│ 適用条件:                           │
│   金額: [1000000] 円以上             │
│   部署: [すべて ▼]                  │
├─────────────────────────────────────┤
│ 承認ステップ:                        │
│ 1. [部長承認     ] [役割:部長 ▼]     │
│ 2. [役員承認     ] [役割:役員 ▼]     │
│ 3. [+ ステップ追加]                  │
├─────────────────────────────────────┤
│ [保存] [テスト実行] [キャンセル]       │
└─────────────────────────────────────┘
```

## 📋 実装手順

### Phase 1: 権限定義・設定（1週間）

1. **権限マスタデータ作成**
   ```php
   // database/seeders/EstimatePermissionSeeder.php
   php artisan make:seeder EstimatePermissionSeeder
   ```

2. **役割定義・権限割り当て**
   ```php
   // 見積関連役割の作成とデフォルト権限設定
   ```

3. **Estimateモデル拡張**
   ```php
   // 権限チェックメソッドの実装
   // 承認フロー連携メソッドの実装
   ```

### Phase 2: GraphQL API拡張（1週間）

1. **見積権限チェック機能**
   ```graphql
   # 権限チェック付き見積クエリ
   type Query {
     estimates(filter: EstimateFilter): [Estimate]
     canEditEstimate(id: ID!): Boolean
     canDeleteEstimate(id: ID!): Boolean
   }
   ```

2. **権限設定管理API**
   ```graphql
   # 権限設定ミューテーション
   type Mutation {
     updateUserEstimatePermissions(userId: ID!, permissions: [String!]!): User
     updateRoleEstimatePermissions(roleId: ID!, permissions: [String!]!): Role
   }
   ```

### Phase 3: フロントエンド実装（2-3週間）

1. **権限設定画面**
   - ユーザー別権限設定
   - 役割別権限設定
   - 部署別権限設定

2. **見積管理画面**
   - 権限に基づく機能制限
   - ボタン・メニューの表示制御

3. **承認フロー設定画面**
   - 見積用承認フロー設定
   - 条件設定（金額・部署等）

## 🎯 期待される効果

### 1. セキュリティ強化
- **きめ細かい権限制御**: 業務に応じた適切な権限設定
- **不正アクセス防止**: 権限のないユーザーの操作を制限
- **データ保護**: 重要な見積情報の適切な管理

### 2. 業務効率化
- **承認プロセス自動化**: 金額等に応じた自動承認フロー適用
- **権限管理の簡素化**: 役割ベースでの一括権限設定
- **監査証跡**: 完全な操作履歴の記録

### 3. ガバナンス向上
- **組織ルールの徹底**: システムによる権限管理の強制
- **責任の明確化**: 権限と責任の対応関係明確化
- **コンプライアンス対応**: 適切な承認プロセスの実行

## 📝 まとめ

現在の実装により、見積基本情報に対する**包括的な権限設定が実現可能**です：

### ✅ 実現可能な機能
1. **詳細な権限設定**: 利用・参照・作成・編集・削除・承認
2. **多層的な権限管理**: ユーザー・役割・部署・システムレベル
3. **自動承認フロー**: 条件に基づく自動フロー適用
4. **完全な監査証跡**: 全操作の記録・追跡

### 🚀 開発効率
- **基盤完成済み**: 権限システム・承認フローの実装済み
- **短期間実装**: 2-4週間で完全な権限管理機能を構築可能
- **拡張性**: 将来的な見積詳細機能への対応も容易

見積機能の権限設定は、現在の承認フロー実装を活用することで、エンタープライズレベルの管理機能を効率的に構築できます。
