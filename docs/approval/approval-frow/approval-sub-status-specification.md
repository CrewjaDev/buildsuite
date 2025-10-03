# 承認フロー サブステータス仕様書

## 概要

承認フローの状態管理において、メインステータスとサブステータスを組み合わせた階層的な状態管理システムを定義します。これにより、承認プロセスの詳細な状態を表現し、柔軟な編集制御を実現します。

## 設計思想

### 基本原則
- **メインステータス**: 承認フローの主要な状態（pending, approved, rejected等）
- **サブステータス**: メインステータス内の詳細な状態（reviewing, expired等）
- **階層構造**: サブステータスはメインステータスの詳細化として機能

### 状態管理の構造
```
承認依頼の状態
├── メインステータス: pending
│   ├── サブステータス: null (承認待ち・未開封)
│   ├── サブステータス: reviewing (審査中・開封済み)
│   ├── サブステータス: step_approved (ステップ承認済み・次のステップ待ち)
│   └── サブステータス: expired (期限切れ)
├── メインステータス: approved
│   └── サブステータス: null (承認済み)
├── メインステータス: rejected
│   └── サブステータス: null (却下)
├── メインステータス: returned
│   └── サブステータス: null (差し戻し)
└── メインステータス: cancelled
    └── サブステータス: null (キャンセル)
```

## データベース設計

### approval_requestsテーブルの拡張
```sql
-- サブステータスカラムの追加
ALTER TABLE approval_requests 
ADD COLUMN sub_status VARCHAR(50) NULL 
COMMENT 'サブステータス（メインステータス内の詳細状態）';

-- 複合インデックスの追加（パフォーマンス向上）
CREATE INDEX idx_approval_requests_status_sub_status 
ON approval_requests(status, sub_status);

-- 既存データの移行（既存のpendingステータスはsub_status=nullに設定）
UPDATE approval_requests 
SET sub_status = NULL 
WHERE status = 'pending' AND sub_status IS NULL;
```

### ステータス定数の定義
```php
// ApprovalRequestモデル内で定義
class ApprovalRequest extends Model
{
    // メインステータス定数
    const STATUS_PENDING = 'pending';      // 承認待ち（承認フロー進行中）
    const STATUS_APPROVED = 'approved';    // 承認済み（全ステップ完了）
    const STATUS_REJECTED = 'rejected';    // 却下（承認者が却下）
    const STATUS_RETURNED = 'returned';    // 差し戻し（承認者が差し戻し）
    const STATUS_CANCELLED = 'cancelled';  // キャンセル（申請者がキャンセル）
    
    // サブステータス定数（pendingステータス専用）
    const SUB_STATUS_REVIEWING = 'reviewing';          // 審査中（承認者が内容確認中）
    const SUB_STATUS_STEP_APPROVED = 'step_approved';  // ステップ承認済み（次のステップ待ち）
    const SUB_STATUS_EXPIRED = 'expired';              // 期限切れ（承認期限超過）
    const SUB_STATUS_NONE = null;                      // サブステータスなし（未開封状態）
    
    protected $fillable = [
        'status',           // メインステータス
        'sub_status',       // サブステータス
        'current_step',
        // ... その他のフィールド
    ];
}
```

### データ例
```sql
-- 承認待ち（未開封）
INSERT INTO approval_requests (status, sub_status, current_step, ...) 
VALUES ('pending', NULL, 1, ...);

-- 審査中
INSERT INTO approval_requests (status, sub_status, current_step, ...) 
VALUES ('pending', 'reviewing', 1, ...);

-- ステップ承認済み（次のステップ待ち）
INSERT INTO approval_requests (status, sub_status, current_step, ...) 
VALUES ('pending', 'step_approved', 2, ...);

-- 期限切れ
INSERT INTO approval_requests (status, sub_status, current_step, ...) 
VALUES ('pending', 'expired', 1, ...);

-- 承認済み
INSERT INTO approval_requests (status, sub_status, current_step, ...) 
VALUES ('approved', NULL, 3, ...);
```

## 状態遷移フロー

### 1. 承認依頼作成時
```php
// 承認依頼作成
$approvalRequest = ApprovalRequest::create([
    'status' => ApprovalRequest::STATUS_PENDING,
    'sub_status' => ApprovalRequest::SUB_STATUS_NONE,  // 承認待ち（未開封）
    'current_step' => 1,
    // ... その他のフィールド
]);
```

### 2. 承認者が詳細ページを開いた時
```php
public function startReview(User $user): bool
{
    if (!$this->isCurrentApprover($user)) {
        return false;
    }
    
    // pending状態でサブステータスがnullの場合のみ審査開始可能
    if ($this->status === self::STATUS_PENDING && !$this->sub_status) {
        $this->update(['sub_status' => self::SUB_STATUS_REVIEWING]);
        
        // 審査開始履歴を記録
        $this->histories()->create([
            'action' => 'review_start',
            'acted_by' => $user->id,
            'comment' => '承認依頼の詳細を確認開始',
        ]);
        
        return true;
    }
    
    return false;
}
```

### 3. 承認完了時
```php
public function approve(User $user): bool
{
    if ($this->status === self::STATUS_PENDING && $this->sub_status === self::SUB_STATUS_REVIEWING) {
        $this->update([
            'status' => self::STATUS_APPROVED,
            'sub_status' => self::SUB_STATUS_NONE,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);
        
        return true;
    }
    
    return false;
}
```

## 編集制御ロジック

### データ編集権限の判定
```php
public function canEdit(User $user): bool
{
    // 基本権限チェック
    if (!$user->hasPermission('estimate.edit.estimate')) {
        return false;
    }
    
    // 承認依頼が存在しない場合は編集可能
    if (!$this->approvalRequest) {
        return $this->created_by === $user->id || $user->is_admin;
    }
    
    // メインステータス + サブステータスで判定
    if ($this->approvalRequest->status === ApprovalRequest::STATUS_PENDING) {
        switch ($this->approvalRequest->sub_status) {
            case ApprovalRequest::SUB_STATUS_REVIEWING:
                // 審査中は編集不可
                return false;
            case ApprovalRequest::SUB_STATUS_STEP_APPROVED:
                // ステップ承認済み（次のステップ待ち）は編集不可
                return false;
            case ApprovalRequest::SUB_STATUS_EXPIRED:
                // 期限切れは編集不可
                return false;
            default:
                // 承認待ち（未開封）のみ編集可能
                return $this->created_by === $user->id || $user->is_admin;
        }
    }
    
    // その他のメインステータスは編集不可
    return false;
}
```

## UI表示仕様

### 承認フロー状態表示の仕様

#### 基本原則
- **完了したステップ数**を表示（現在のステップ番号ではない）
- **審査中状態**を明確に区別して表示
- **直感的で分かりやすい**状態表示

#### 状態表示パターン

| 状態 | 表示 | 説明 |
|------|------|------|
| **承認依頼作成時** | `承認待ち 0/2` | まだどのステップも開始されていない |
| **ステップ1審査開始** | `審査中 1/2` | ステップ1の審査が進行中 |
| **ステップ1承認完了** | `承認待ち 2/2` | ステップ1完了、ステップ2待ち |
| **ステップ2審査開始** | `審査中 2/2` | ステップ2の審査が進行中 |
| **ステップ2承認完了** | `承認完了 2/2` | 全ステップ完了 |

#### 表示ロジック

```php
public function getStatusDisplay(): array
{
    $totalSteps = $this->getTotalSteps();
    
    if ($this->status === self::STATUS_PENDING) {
        switch ($this->sub_status) {
            case self::SUB_STATUS_REVIEWING:
                // 審査中: 現在のステップ番号を表示
                return [
                    'status' => self::STATUS_PENDING,
                    'sub_status' => self::SUB_STATUS_REVIEWING,
                    'display' => "審査中 {$this->current_step}/{$totalSteps}",
                    'color' => 'orange',
                    'icon' => 'eye',
                    'can_edit' => false,
                    'message' => '承認者が内容を確認中です',
                ];
            case self::SUB_STATUS_STEP_APPROVED:
                // ステップ承認済み: 完了したステップ数を表示
                $completedSteps = $this->current_step - 1;
                return [
                    'status' => self::STATUS_PENDING,
                    'sub_status' => self::SUB_STATUS_STEP_APPROVED,
                    'display' => "承認待ち {$completedSteps}/{$totalSteps}",
                    'color' => 'blue',
                    'icon' => 'clock',
                    'can_edit' => false,
                    'message' => '次の承認者による確認待ちです',
                ];
            case self::SUB_STATUS_EXPIRED:
                return [
                    'status' => self::STATUS_PENDING,
                    'sub_status' => self::SUB_STATUS_EXPIRED,
                    'display' => '期限切れ',
                    'color' => 'red',
                    'icon' => 'clock',
                    'can_edit' => false,
                    'message' => '承認期限が過ぎています',
                ];
            default:
                // 承認待ち（未開封）: 完了したステップ数を表示
                $completedSteps = max(0, $this->current_step - 1);
                return [
                    'status' => self::STATUS_PENDING,
                    'sub_status' => self::SUB_STATUS_NONE,
                    'display' => "承認待ち {$completedSteps}/{$totalSteps}",
                    'color' => 'blue',
                    'icon' => 'clock',
                    'can_edit' => true,
                    'message' => '承認者による確認待ちです',
                ];
        }
    }
    
    // 承認完了
    if ($this->status === self::STATUS_APPROVED) {
        return [
            'status' => self::STATUS_APPROVED,
            'sub_status' => self::SUB_STATUS_NONE,
            'display' => "承認完了 {$totalSteps}/{$totalSteps}",
            'color' => 'green',
            'icon' => 'check',
            'can_edit' => false,
            'message' => '承認が完了しました',
        ];
    }
    
    // その他のメインステータス
    return [
        'status' => $this->status,
        'sub_status' => self::SUB_STATUS_NONE,
        'display' => $this->getMainStatusDisplay(),
        'color' => $this->getMainStatusColor(),
        'icon' => $this->getMainStatusIcon(),
        'can_edit' => false,
        'message' => $this->getMainStatusMessage(),
    ];
}
```

#### フロントエンド実装

##### 1. 右上の承認フロー状態表示（EstimateApprovalRequestButton）
```typescript
// ステップ情報を追加
if (statusInfo && estimate.current_step && estimate.total_steps) {
  if (approvalStatus === 'pending') {
    if (estimate.sub_status === 'reviewing') {
      // 審査中: 現在のステップ番号を表示
      statusInfo.label = `審査中 ${estimate.current_step}/${estimate.total_steps}`
    } else {
      // 承認待ち: 完了したステップ数を表示
      const completedSteps = Math.max(0, estimate.current_step - 1)
      statusInfo.label = `承認待ち ${completedSteps}/${estimate.total_steps}`
    }
  } else if (approvalStatus === 'approved') {
    // 承認完了: 全ステップ完了を表示
    statusInfo.label = `承認完了 ${estimate.total_steps}/${estimate.total_steps}`
  }
}
```

##### 2. 基本情報カード内のバッジ表示（EstimateDetailView）
```typescript
// サブステータスに基づく表示ラベルの決定
const getStatusLabel = () => {
  if (userApprovalStatus.status === 'pending') {
    if (userApprovalStatus.sub_status === 'reviewing') {
      // 審査中: 現在のステップ番号を表示
      return userApprovalStatus.step && userApprovalStatus.total_steps 
        ? `審査中 ${userApprovalStatus.step}/${userApprovalStatus.total_steps}`
        : '審査中'
    } else {
      // 承認待ち: 完了したステップ数を表示
      const completedSteps = Math.max(0, (userApprovalStatus.step || 1) - 1)
      return userApprovalStatus.total_steps 
        ? `承認待ち ${completedSteps}/${userApprovalStatus.total_steps}`
        : '承認待ち'
    }
  }
  
  if (userApprovalStatus.status === 'approved') {
    // 承認完了: 全ステップ完了を表示
    return userApprovalStatus.total_steps 
      ? `承認完了 ${userApprovalStatus.total_steps}/${userApprovalStatus.total_steps}`
      : '承認完了'
  }
  
  // その他の状態
  return userApprovalStatus.step && userApprovalStatus.total_steps 
    ? `承認待ち ${userApprovalStatus.step}/${userApprovalStatus.total_steps}`
    : '承認待ち'
}
```

#### 表示の一貫性

##### 共通ルール
1. **審査中状態** (`sub_status === 'reviewing'`): `審査中 X/2`
2. **承認待ち状態** (`sub_status === null` かつ `pending`): `承認待ち X/2` (完了したステップ数)
3. **承認完了状態** (`status === 'approved'`): `承認完了 2/2`

##### ステップ数の計算
- **完了したステップ数**: `max(0, current_step - 1)`
- **現在のステップ番号**: `current_step`
- **総ステップ数**: `total_steps`

#### ユーザビリティの向上

##### 利点
1. **状態が明確**: 「審査中」と「承認待ち」が区別される
2. **直感的**: 現在どのステップが進行中かが分かりやすい
3. **一貫性**: サブステータス（`reviewing`）と表示が連動する
4. **ユーザビリティ**: 承認者が現在何をすべきかが明確

##### 表示例
```
承認依頼作成 → 承認待ち 0/2
ステップ1審査開始 → 審査中 1/2
ステップ1承認完了 → 承認待ち 1/2
ステップ2審査開始 → 審査中 2/2
ステップ2承認完了 → 承認完了 2/2
```

### フロントエンド表示例
```typescript
// 承認状態バッジの表示
const ApprovalStatusBadge = ({ approvalRequest }: { approvalRequest: ApprovalRequest }) => {
  const statusDisplay = approvalRequest.getStatusDisplay();
  
  return (
    <Badge 
      variant={statusDisplay.color}
      className="flex items-center gap-1"
    >
      <Icon name={statusDisplay.icon} size={16} />
      {statusDisplay.display}
    </Badge>
  );
};

// 編集ボタンの表示制御
const EditButton = ({ estimate }: { estimate: Estimate }) => {
  const canEdit = estimate.canEdit(currentUser);
  
  if (!canEdit) {
    return null;
  }
  
  return (
    <Button onClick={handleEdit}>
      <Edit className="h-4 w-4 mr-2" />
      編集
    </Button>
  );
};
```

## API仕様

### 承認依頼詳細取得API
```php
// GET /api/approval-requests/{id}
public function show($id): JsonResponse
{
    $approvalRequest = ApprovalRequest::with(['histories', 'approvalFlow'])
        ->findOrFail($id);
    
    $user = auth()->user();
    
    // 承認者が詳細ページを開いた時点で審査開始
    if ($approvalRequest->isCurrentApprover($user) && 
        $approvalRequest->status === ApprovalRequest::STATUS_PENDING && 
        !$approvalRequest->sub_status) {
        
        $approvalRequest->startReview($user);
    }
    
    return response()->json([
        'data' => [
            'id' => $approvalRequest->id,
            'status' => $approvalRequest->status,
            'sub_status' => $approvalRequest->sub_status,
            'status_display' => $approvalRequest->getStatusDisplay(),
            'current_step' => $approvalRequest->current_step,
            'total_steps' => $approvalRequest->getTotalSteps(),
            'histories' => $approvalRequest->histories,
        ],
        'message' => '承認依頼詳細を取得しました'
    ]);
}
```

### 承認操作API
```php
// POST /api/approval-requests/{id}/approve
public function approve(Request $request, $id): JsonResponse
{
    $approvalRequest = ApprovalRequest::findOrFail($id);
    $user = auth()->user();
    
    // 審査中状態でのみ承認可能
    if ($approvalRequest->status !== ApprovalRequest::STATUS_PENDING || 
        $approvalRequest->sub_status !== ApprovalRequest::SUB_STATUS_REVIEWING) {
        
        return response()->json([
            'success' => false,
            'message' => '承認可能な状態ではありません（審査中のみ承認可能）'
        ], 422);
    }
    
    if ($approvalRequest->approve($user, $request->comment)) {
        return response()->json([
            'success' => true,
            'message' => '承認が完了しました'
        ]);
    }
    
    return response()->json([
        'success' => false,
        'message' => '承認に失敗しました'
    ], 500);
}
```

## 実装手順

### Phase 1: データベース拡張
1. `approval_requests`テーブルに`sub_status`カラムを追加
2. 複合インデックス`(status, sub_status)`の作成
3. 既存データの移行（既存のpendingステータスはsub_status=nullに設定）
4. マイグレーションファイルの作成と実行

### Phase 2: バックエンド実装
1. `ApprovalRequest`モデルの拡張（定数定義、メソッド追加）
2. サブステータス管理メソッドの実装（`startReview()`, `approve()`等）
3. 編集制御ロジックの更新（`canEdit()`メソッド）
4. APIエンドポイントの更新（状態判定ロジック）
5. 既存コードの定数使用への変更

### Phase 3: フロントエンド実装
1. 状態表示コンポーネントの更新
2. 編集ボタンの表示制御
3. 承認依頼詳細ページの更新
4. 状態遷移の実装

### Phase 4: テスト・検証
1. 状態遷移のテスト
2. 編集制御のテスト
3. UI表示のテスト
4. パフォーマンステスト

## 注意事項

### 既存データの互換性
- 既存の`pending`ステータスは`sub_status=null`として扱う
- 既存のAPIレスポンスに`sub_status`フィールドを追加
- フロントエンドでの後方互換性を確保
- 定数を使用することで文字列のタイポを防止

### パフォーマンス考慮
- `status`と`sub_status`の複合インデックスを作成
- 状態判定クエリの最適化
- キャッシュ戦略の検討

### セキュリティ
- 承認者の権限チェックを強化
- 状態遷移の不正操作を防ぐ
- 監査ログの充実

## 排他制御要件

### 競合ケースの整理

#### 1. 同時編集の競合
- **ケース**: 複数のユーザーが同時に編集を開始
- **問題**: データの不整合、作業内容の消失
- **要件**: 1つの承認依頼を同時に複数ユーザーが編集することを防ぐ

#### 2. 承認者開封と申請者編集の競合
- **ケース**: 申請者が編集中に承認者が詳細ページを開く
- **問題**: 承認者が見ている内容が途中で変わる可能性
- **要件**: 承認者の審査を最優先し、編集中でも承認者開封を許可

### 排他制御の優先順位

#### 優先度（高い順）
1. **承認者の審査開始** - 最優先
2. **申請者の編集** - 承認者開封前のみ許可
3. **その他のユーザーの編集** - 基本的に不可

#### 競合時の動作
```
申請者が編集中 → 承認者が開封
↓
承認者の開封が優先され、申請者の編集は強制終了
↓
承認者開封中は編集不可
```

### 編集可能な条件

#### 編集可能
- 承認依頼が存在しない
- `pending + null`（承認待ち・未開封）
- `pending + editing`（自分が編集中の場合のみ）

#### 編集不可
- `pending + reviewing`（審査中）
- `pending + step_approved`（ステップ承認済み）
- `pending + expired`（期限切れ）
- `pending + editing`（他のユーザーが編集中）
- その他のメインステータス（approved, rejected等）

### タイムアウト機能

#### 編集ロックのタイムアウト
- **時間**: 30分
- **動作**: タイムアウト後は自動的に編集ロックを解除
- **目的**: 長時間の編集ロックを防ぐ

#### タイムアウト判定
- 編集開始時刻から30分経過した場合
- 編集中のユーザーが非アクティブとみなす
- 他のユーザーが編集を開始可能

### ユーザビリティ要件

#### 状態表示
- 編集中のユーザー名を表示
- 編集中の理由を明確に表示
- 編集可能/不可の理由を説明

#### エラーメッセージ
- 承認者開封中の編集試行: 「承認者が内容を確認中です。審査完了後に編集してください。」
- 他ユーザー編集中の編集試行: 「他のユーザーが編集中です。しばらく待ってから再度お試しください。」
- タイムアウト後の編集試行: 「編集ロックが解除されました。再度編集を開始してください。」

### データ整合性要件

#### 編集内容の保護
- 承認者が審査中は編集内容を変更しない
- 編集中のユーザーの作業内容を保護
- 競合時の適切な状態遷移

#### 履歴管理
- 編集開始・終了の記録
- 承認者開封による編集強制終了の記録
- タイムアウトによる編集ロック解除の記録

## 承認フロー設定による制御

### 設定可能な項目

#### 編集・キャンセル許可の設定
```json
{
  "allow_editing_after_request": true,     // 承認依頼後の編集許可
  "allow_cancellation_after_request": true, // 承認依頼後のキャンセル許可
  "editing_conditions": {
    "allow_during_pending": true,          // 承認待ち中の編集許可
    "allow_during_reviewing": false,       // 審査中の編集許可
    "allow_during_step_approved": false,   // ステップ承認済みの編集許可
    "allow_during_expired": false          // 期限切れの編集許可
  },
  "cancellation_conditions": {
    "allow_during_pending": true,          // 承認待ち中のキャンセル許可
    "allow_during_reviewing": false,       // 審査中のキャンセル許可
    "allow_during_step_approved": false,   // ステップ承認済みのキャンセル許可
    "allow_during_expired": false          // 期限切れのキャンセル許可
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
```
- **用途**: 承認者開封前のみ編集・キャンセル許可
- **メリット**: 承認プロセス保護と業務柔軟性のバランス

#### パターン3: 非常に柔軟な制御
```json
{
  "allow_editing_after_request": true,
  "allow_cancellation_after_request": true,
  "editing_conditions": {
    "allow_during_pending": true,
    "allow_during_reviewing": true,
    "allow_during_step_approved": false,
    "allow_during_expired": false
  },
  "cancellation_conditions": {
    "allow_during_pending": true,
    "allow_during_reviewing": true,
    "allow_during_step_approved": false,
    "allow_during_expired": false
  }
}
```
- **用途**: 審査中でも編集・キャンセル許可
- **メリット**: 最大限の業務柔軟性

### 設定による制御ロジック

#### 編集制御の実装
```php
public function canEdit(User $user): bool
{
    // 基本権限チェック
    if (!$user->hasPermission('estimate.edit.estimate')) {
        return false;
    }
    
    // 承認依頼が存在しない場合は編集可能
    if (!$this->approvalRequest) {
        return $this->created_by === $user->id || $user->is_admin;
    }
    
    // 承認フロー設定を取得
    $flowConfig = $this->approvalRequest->approvalFlow->flow_config ?? [];
    
    // 承認依頼後の編集が許可されていない場合
    if (!($flowConfig['allow_editing_after_request'] ?? false)) {
        return false;
    }
    
    // サブステータス別の編集許可チェック
    $editingConditions = $flowConfig['editing_conditions'] ?? [];
    
    if ($this->approvalRequest->status === ApprovalRequest::STATUS_PENDING) {
        switch ($this->approvalRequest->sub_status) {
            case ApprovalRequest::SUB_STATUS_REVIEWING:
                return $editingConditions['allow_during_reviewing'] ?? false;
            case ApprovalRequest::SUB_STATUS_STEP_APPROVED:
                return $editingConditions['allow_during_step_approved'] ?? false;
            case ApprovalRequest::SUB_STATUS_EXPIRED:
                return $editingConditions['allow_during_expired'] ?? false;
            case ApprovalRequest::SUB_STATUS_EDITING:
                return $this->approvalRequest->editing_user_id === $user->id;
            default:
                return $editingConditions['allow_during_pending'] ?? true;
        }
    }
    
    return false;
}
```

#### キャンセル制御の実装
```php
public function canCancel(User $user): bool
{
    // 申請者本人または管理者のみキャンセル可能
    if ($this->approvalRequest->requested_by !== $user->id && !$user->is_admin) {
        return false;
    }
    
    // 承認フロー設定を取得
    $flowConfig = $this->approvalRequest->approvalFlow->flow_config ?? [];
    
    // 承認依頼後のキャンセルが許可されていない場合
    if (!($flowConfig['allow_cancellation_after_request'] ?? false)) {
        return false;
    }
    
    // サブステータス別のキャンセル許可チェック
    $cancellationConditions = $flowConfig['cancellation_conditions'] ?? [];
    
    if ($this->approvalRequest->status === ApprovalRequest::STATUS_PENDING) {
        switch ($this->approvalRequest->sub_status) {
            case ApprovalRequest::SUB_STATUS_REVIEWING:
                return $cancellationConditions['allow_during_reviewing'] ?? false;
            case ApprovalRequest::SUB_STATUS_STEP_APPROVED:
                return $cancellationConditions['allow_during_step_approved'] ?? false;
            case ApprovalRequest::SUB_STATUS_EXPIRED:
                return $cancellationConditions['allow_during_expired'] ?? false;
            case ApprovalRequest::SUB_STATUS_EDITING:
                return $this->approvalRequest->editing_user_id === $user->id;
            default:
                return $cancellationConditions['allow_during_pending'] ?? true;
        }
    }
    
    return false;
}
```

### 設定画面の設計

#### 承認フロー設定画面
- **編集許可設定**: チェックボックスで各状態での編集許可を設定
- **キャンセル許可設定**: チェックボックスで各状態でのキャンセル許可を設定
- **プリセット選択**: よく使用される設定パターンを選択可能
- **カスタム設定**: 詳細な条件を個別に設定可能

### メリット

#### 1. 柔軟性
- プログラム変更なしに業務要件に対応
- 承認フローごとに異なる制御が可能

#### 2. 保守性
- 設定変更で動作を調整可能
- コードの修正が不要

#### 3. ユーザビリティ
- 業務に応じた最適な設定が可能
- 段階的な制御の導入が可能

#### 4. 拡張性
- 新しい制御条件の追加が容易
- 将来の要件変更に対応可能

## 承認依頼キャンセル要件

### キャンセル可能な条件（編集可能条件と同じ）

#### キャンセル可能
- **申請者**: 自分が作成した承認依頼
- **管理者**: システム管理者権限を持つユーザー
- **承認依頼が存在しない**: キャンセル対象なし
- **`pending + null`**: 承認待ち（未開封）
- **`pending + editing`**: 編集中（自分が編集中の場合のみ）

#### キャンセル不可
- **`pending + reviewing`**: 審査中（承認者が開封済み）
- **`pending + step_approved`**: ステップ承認済み
- **`pending + expired`**: 期限切れ
- **`pending + editing`**: 他のユーザーが編集中
- **その他のメインステータス**: 承認済み、却下、差し戻し、既にキャンセル済み

### キャンセル時の状態遷移

#### 各サブステータスからのキャンセル
```
pending + null → cancelled + null (キャンセル可能)
pending + editing → cancelled + null (自分が編集中の場合のみキャンセル可能)
pending + reviewing → キャンセル不可
pending + step_approved → キャンセル不可
pending + expired → キャンセル不可
```

### キャンセル時の処理

#### 1. 状態更新
- メインステータス: `pending` → `cancelled`
- サブステータス: 任意の値 → `null`
- キャンセル情報: `cancelled_by`, `cancelled_at`を設定

#### 2. 関連データの処理
- **編集ロック解除**: `editing_user_id`, `editing_started_at`をクリア
- **承認者通知**: 承認者にキャンセル通知を送信
- **履歴記録**: キャンセルアクションを履歴に記録

#### 3. 権限チェック
- 申請者本人または管理者のみキャンセル可能
- 承認者はキャンセル不可（却下・差し戻しを使用）

### キャンセル後の動作

#### データの状態
- **承認依頼**: `cancelled`状態で保持
- **関連データ**: 見積データ等は元の状態に戻る
- **編集権限**: 承認依頼作成前の状態に戻る

#### 再提出の可否
- **可能**: キャンセル後は新しい承認依頼を作成可能
- **制限**: 同一データに対する重複承認依頼の防止

### ユーザビリティ要件

#### キャンセルボタンの表示条件
- 申請者本人または管理者のみ表示
- キャンセル可能な状態の場合のみ表示
- 承認者には表示しない

#### キャンセル確認ダイアログ
- **確認メッセージ**: 「承認依頼をキャンセルしますか？この操作は取り消せません。」
- **理由入力**: キャンセル理由の入力（任意）
- **承認者への通知**: キャンセル理由を承認者に通知

#### エラーメッセージ
- 審査中: 「承認者が内容を確認中です。審査完了後にキャンセルしてください。」
- ステップ承認済み: 「承認が進行中です。キャンセルできません。」
- 期限切れ: 「承認期限が過ぎています。キャンセルできません。」
- 他ユーザー編集中: 「他のユーザーが編集中です。キャンセルできません。」
- 権限不足: 「承認依頼をキャンセルする権限がありません。」
- 既にキャンセル済み: 「この承認依頼は既にキャンセルされています。」

### 通知機能

#### 承認者への通知
- **通知内容**: 承認依頼がキャンセルされた旨
- **通知方法**: メール、システム内通知
- **通知タイミング**: キャンセル実行時

#### 申請者への通知
- **通知内容**: キャンセル完了の確認
- **通知方法**: システム内通知
- **通知タイミング**: キャンセル実行時

### セキュリティ要件

#### 権限チェック
- 申請者本人の確認
- 管理者権限の確認
- キャンセル可能状態の確認

#### 監査ログ
- キャンセル実行者の記録
- キャンセル実行時刻の記録
- キャンセル理由の記録
- キャンセル前の状態の記録

## ステータス一覧

### メインステータス
| ステータス | 説明 | 編集可能 |
|-----------|------|----------|
| `pending` | 承認待ち | 条件による |
| `approved` | 承認済み | ❌ |
| `rejected` | 却下 | ❌ |
| `returned` | 差し戻し | ❌ |
| `cancelled` | キャンセル | ❌ |

### サブステータス（pendingステータス専用）
| サブステータス | 説明 | 編集可能 | 表示色 | アイコン |
|---------------|------|----------|--------|----------|
| `null` | 承認待ち（未開封） | ✅ | 青 | clock |
| `reviewing` | 審査中（開封済み） | ❌ | オレンジ | eye |
| `editing` | 編集中（排他制御） | 条件による | 紫 | edit |
| `step_approved` | ステップ承認済み（次のステップ待ち） | ❌ | 緑 | check |
| `expired` | 期限切れ | ❌ | 赤 | clock |

### 状態遷移パターン
```
承認依頼作成 → pending + null (編集可能)
     ↓
申請者が編集開始 → pending + editing (編集中ユーザーのみ編集可能)
     ↓
承認者が開封 → pending + reviewing (編集不可、申請者編集は強制終了)
     ↓
承認者が承認 → pending + step_approved (編集不可) または approved + null (編集不可)
     ↓
次の承認者が開封 → pending + reviewing (編集不可)
     ↓
最終承認 → approved + null (編集不可)
```

### 排他制御の状態遷移
```
申請者が編集開始 → pending + editing
     ↓
承認者が開封 → pending + reviewing (編集強制終了)
     ↓
申請者が再度編集試行 → 編集不可（審査中）
     ↓
承認者が承認 → pending + step_approved
     ↓
申請者が編集試行 → 編集不可（ステップ承認済み）
```

### キャンセル機能の状態遷移
```
承認依頼作成 → pending + null
     ↓
申請者がキャンセル → cancelled + null (キャンセル可能)
     ↓
新しい承認依頼作成可能

申請者が編集中 → pending + editing
     ↓
申請者がキャンセル → cancelled + null (自分が編集中の場合のみキャンセル可能)
     ↓
新しい承認依頼作成可能

承認者が審査中 → pending + reviewing
     ↓
申請者がキャンセル試行 → キャンセル不可（審査中）
     ↓
承認完了後にキャンセル可能
```

## まとめ

このサブステータス設計により、以下のメリットが得られます：

1. **直感的な状態管理**: 承認待ちの中に審査中があるという自然な構造
2. **安全な編集制御**: ステップ承認後も編集を防ぐことでデータ整合性を保持
3. **排他制御**: 同時編集の競合を防ぎ、承認プロセスの信頼性を確保
4. **キャンセル機能**: 申請者が承認依頼を取り消すことで柔軟性を提供
5. **透明性**: 承認プロセスの詳細な状態が可視化
6. **拡張性**: 将来的な状態の追加が容易
7. **複数ステップ対応**: 各ステップでの状態管理が明確
8. **ユーザビリティ**: 競合時の適切なメッセージ表示

### 排他制御の重要性

- **承認者優先**: 承認者の審査を最優先し、データ整合性を保持
- **編集保護**: 編集中のユーザーの作業内容を保護
- **競合回避**: 同時編集によるデータ不整合を防止
- **タイムアウト機能**: 長時間の編集ロックを自動解除

### キャンセル機能の重要性

- **柔軟性**: 申請者が承認依頼を取り消すことで業務の柔軟性を提供
- **権限制御**: 申請者本人または管理者のみキャンセル可能
- **通知機能**: 承認者への適切な通知で透明性を確保
- **再提出可能**: キャンセル後の新しい承認依頼作成を許可

この仕様に基づいて実装することで、より使いやすく信頼性の高い承認フローシステムが構築できます。
