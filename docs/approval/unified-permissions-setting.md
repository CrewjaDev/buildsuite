# 統合承認権限設定ガイド

## 概要

ユーザー個別設定と部署・役職別設定を一つの画面で統合的に管理する方法について説明します。階層的な権限継承と例外設定により、効率的で柔軟な権限管理を実現します。

## 🎯 統合権限管理の考え方

### 権限継承の階層構造

```
会社全体の基本権限
    ↓ 継承
部署別権限設定
    ↓ 継承  
役職別権限設定
    ↓ 継承
ユーザー個別権限（例外設定）
```

### 設定優先順位
1. **ユーザー個別設定** （最高優先度）
2. **役職別設定**
3. **部署別設定** 
4. **会社基本設定** （最低優先度）

## 🎨 統合権限設定画面の設計

### メイン設定画面

```
┌─────────────────────────────────────────────────────────────┐
│ 承認権限統合設定                                            │
├─────────────────────────────────────────────────────────────┤
│ 設定方法: ●階層設定 ○個別設定 ○一括設定                     │
│                                                           │
│ 【設定対象選択】                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 会社: [株式会社サンプル]                               │ │
│ │ 部署: [営業部 ▼] [技術部 ▼] [管理部 ▼] [すべて選択]    │ │
│ │ 役職: [部長 ▼] [課長 ▼] [主任 ▼] [担当 ▼] [すべて選択] │ │
│ │ ユーザー: [田中課長] [佐藤主任] [個別指定...]           │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 【権限設定エリア】                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ タブ: [基本権限] [申請権限] [承認権限] [管理権限]       │ │
│ │                                                       │ │
│ │ ■基本権限                                             │ │
│ │ □ 見積機能アクセス    継承元: [会社基本 ▼]              │ │
│ │ □ 見積参照           継承元: [部署設定 ▼]              │ │
│ │ □ 見積作成           継承元: [役職設定 ▼] ⚠️例外あり    │ │
│ │                                                       │ │
│ │ ■申請権限                                             │ │
│ │ □ 承認依頼作成       範囲: [自部署+協力部署 ▼]         │ │
│ │   └ 営業部: [✓] 技術部: [協力のみ] 管理部: [✗]        │ │
│ │ □ 承認依頼編集       条件: [ドラフト+差戻 ▼]           │ │
│ │ □ 承認依頼キャンセル  金額制限: [500万円以下]           │ │
│ │                                                       │ │
│ │ ■承認権限                                             │ │
│ │ □ 承認実行           金額上限: [2000万円]              │ │
│ │   └ 部長: [5000万円] 課長: [2000万円] 主任: [500万円]  │ │
│ │ □ 却下実行           条件: [コメント必須 ☑]            │ │
│ │ □ 差戻実行           条件: [理由選択必須 ☑]            │ │
│ │ □ 承認委譲           範囲: [同役職以下 ▼]              │ │
│ │                                                       │ │
│ │ ■管理権限                                             │ │
│ │ □ フロー設計         範囲: [部署内フロー ▼]            │ │
│ │ □ フロー変更         条件: [上司承認必要 ☑]            │ │
│ │ □ 統計参照           範囲: [自部署のみ ▼]              │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 【権限プレビュー】                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 選択中の設定が適用されるユーザー:                       │ │
│ │                                                       │ │
│ │ 営業部・課長 (3名): 田中課長, 佐藤課長, 山田課長       │ │
│ │ │                                                     │ │
│ │ └─ 田中課長: 承認上限 2000万円 ※個別設定: 3000万円    │ │
│ │ └─ 佐藤課長: 承認上限 2000万円                        │ │
│ │ └─ 山田課長: 承認上限 2000万円                        │ │
│ │                                                       │ │
│ │ 技術部・課長 (2名): 鈴木課長, 高橋課長                 │ │
│ │ └─ 鈴木課長: 承認上限 2000万円                        │ │
│ │ └─ 高橋課長: 承認上限 2000万円                        │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [保存] [一括適用] [例外設定] [プレビュー] [リセット]          │
└─────────────────────────────────────────────────────────────┘
```

### 例外設定ダイアログ

```
┌─────────────────────────────────────────────────────────────┐
│ 個別例外設定：田中課長                                       │
├─────────────────────────────────────────────────────────────┤
│ 基本情報: 営業部・課長 → 個別例外設定                        │
│                                                           │
│ 【継承設定と例外設定】                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 権限項目          │継承値    │例外設定  │適用値    │     │ │
│ │─────────────────┼─────────┼─────────┼─────────┼─────│ │
│ │ 見積機能アクセス   │ ✓       │ (継承)   │ ✓       │     │ │
│ │ 承認依頼作成      │ ✓       │ (継承)   │ ✓       │     │ │
│ │ 承認実行          │ ✓       │ ✓       │ ✓       │ ⚠️  │ │
│ │ 承認金額上限      │2000万円  │3000万円  │3000万円  │ ⚠️  │ │
│ │ 却下実行          │ ✓       │ (継承)   │ ✓       │     │ │
│ │ フロー設計        │ ✗       │ ✓       │ ✓       │ ⚠️  │ │
│ │ フロー変更        │ ✗       │ (継承)   │ ✗       │     │ │
│ └─────────────────┴─────────┴─────────┴─────────┴─────┘ │
│                                                           │
│ 例外理由: [営業統括責任者のため承認上限を引き上げ       ]   │
│ 有効期間: [2024/01/01] ～ [2024/12/31]                    │
│ 承認者:   [鈴木部長] 承認日: [2024/01/15]                  │
├─────────────────────────────────────────────────────────────┤
│ [保存] [継承に戻す] [他ユーザーにコピー] [キャンセル]          │
└─────────────────────────────────────────────────────────────┘
```

### 権限継承ビューア

```
┌─────────────────────────────────────────────────────────────┐
│ 権限継承ビューア：田中課長の権限構成                          │
├─────────────────────────────────────────────────────────────┤
│                                                           │
│ 【権限継承フロー】                                         │
│                                                           │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│ │ 会社基本権限    │───▶│ 営業部権限      │───▶│ 課長役職権限    │      │
│ │ • アクセス権    │    │ • 申請権限      │    │ • 承認権限      │      │
│ │ • 基本操作      │    │ • 部署内参照    │    │ • 金額上限      │      │
│ └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                     │                     │         │
│         └─────────────────────┼─────────────────────┘         │
│                               ▼                               │
│                    ┌─────────────────────┐                    │
│                    │ 田中課長個別設定     │                    │
│                    │ • 承認上限: 3000万円 │                    │
│                    │ • フロー設計権限     │                    │
│                    │ ※例外設定あり      │                    │
│                    └─────────────────────┘                    │
│                                                           │
│ 【最終適用権限】                                           │
│ ✓ 見積アクセス (会社基本)                                  │
│ ✓ 承認依頼作成 (営業部)                                    │
│ ✓ 承認実行 (課長役職) 金額上限: 3000万円 (個別例外)         │
│ ✓ フロー設計 (個別例外)                                    │
│ ✗ フロー変更 (権限なし)                                    │
├─────────────────────────────────────────────────────────────┤
│ [編集] [履歴表示] [権限レポート] [閉じる]                    │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 技術実装アプローチ

### 1. 権限継承テーブル設計

```php
// 権限テンプレートテーブル
CREATE TABLE permission_templates (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    template_type ENUM('company', 'department', 'position', 'user'),
    target_id BIGINT NULL, -- 部署ID、役職ID、ユーザーID
    permissions JSON,
    inherit_from_id BIGINT NULL, -- 継承元テンプレートID
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

// 権限例外設定テーブル
CREATE TABLE permission_exceptions (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    permission_name VARCHAR(255),
    exception_value JSON,
    reason TEXT,
    approved_by BIGINT,
    approved_at TIMESTAMP,
    valid_from DATETIME,
    valid_until DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

// 権限継承履歴テーブル
CREATE TABLE permission_inheritance_log (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    permission_name VARCHAR(255),
    source_type ENUM('company', 'department', 'position', 'exception'),
    source_value JSON,
    final_value JSON,
    calculated_at TIMESTAMP
);
```

### 2. 権限計算エンジン

```php
class PermissionCalculator
{
    public function calculateUserPermissions(User $user): array
    {
        $permissions = [];
        
        // 1. 会社基本権限を取得
        $companyPermissions = $this->getCompanyPermissions();
        $permissions = array_merge($permissions, $companyPermissions);
        
        // 2. 部署権限を取得して上書き
        if ($user->employee && $user->employee->department) {
            $deptPermissions = $this->getDepartmentPermissions($user->employee->department_id);
            $permissions = $this->mergePermissions($permissions, $deptPermissions);
        }
        
        // 3. 役職権限を取得して上書き
        if ($user->employee && $user->employee->position) {
            $positionPermissions = $this->getPositionPermissions($user->employee->position_id);
            $permissions = $this->mergePermissions($permissions, $positionPermissions);
        }
        
        // 4. 個別例外設定を適用
        $exceptions = $this->getUserExceptions($user->id);
        $permissions = $this->applyExceptions($permissions, $exceptions);
        
        // 5. 計算結果をログに記録
        $this->logPermissionCalculation($user->id, $permissions);
        
        return $permissions;
    }
    
    private function mergePermissions(array $base, array $override): array
    {
        foreach ($override as $key => $value) {
            if (isset($base[$key])) {
                if (is_array($value) && is_array($base[$key])) {
                    $base[$key] = array_merge($base[$key], $value);
                } else {
                    $base[$key] = $value; // 上位設定で上書き
                }
            } else {
                $base[$key] = $value;
            }
        }
        return $base;
    }
    
    private function applyExceptions(array $permissions, array $exceptions): array
    {
        foreach ($exceptions as $exception) {
            if ($this->isExceptionValid($exception)) {
                $permissions[$exception['permission_name']] = $exception['exception_value'];
            }
        }
        return $permissions;
    }
}
```

### 3. 統合設定APIの実装

```php
class UnifiedPermissionController
{
    public function updateBulkPermissions(Request $request)
    {
        $targets = $request->input('targets'); // 部署、役職、ユーザーの配列
        $permissions = $request->input('permissions');
        $applyMethod = $request->input('apply_method'); // 'inherit', 'override', 'exception'
        
        DB::transaction(function () use ($targets, $permissions, $applyMethod) {
            foreach ($targets as $target) {
                switch ($target['type']) {
                    case 'department':
                        $this->updateDepartmentPermissions($target['id'], $permissions);
                        break;
                    case 'position':
                        $this->updatePositionPermissions($target['id'], $permissions);
                        break;
                    case 'user':
                        if ($applyMethod === 'exception') {
                            $this->createUserException($target['id'], $permissions);
                        } else {
                            $this->updateUserPermissions($target['id'], $permissions);
                        }
                        break;
                }
            }
            
            // 影響を受けるユーザーの権限を再計算
            $this->recalculateAffectedUsers($targets);
        });
    }
    
    public function getPermissionPreview(Request $request)
    {
        $targets = $request->input('targets');
        $permissions = $request->input('permissions');
        
        $preview = [];
        foreach ($targets as $target) {
            $affectedUsers = $this->getAffectedUsers($target);
            foreach ($affectedUsers as $user) {
                $currentPermissions = app(PermissionCalculator::class)->calculateUserPermissions($user);
                $newPermissions = $this->simulatePermissionChange($currentPermissions, $permissions, $target);
                
                $preview[] = [
                    'user' => $user,
                    'current_permissions' => $currentPermissions,
                    'new_permissions' => $newPermissions,
                    'changes' => $this->getPermissionDiff($currentPermissions, $newPermissions)
                ];
            }
        }
        
        return response()->json($preview);
    }
}
```

## 📊 設定手順とベストプラクティス

### 1. 基本設定手順

1. **会社基本権限設定**
   - 全社員共通の最低限権限
   - システムアクセス権、基本操作権限

2. **部署別権限設定**
   - 部署固有の業務権限
   - 他部署との協力範囲

3. **役職別権限設定**
   - 承認権限、金額上限
   - 管理権限、設定変更権限

4. **個別例外設定**
   - 特別な責任者権限
   - 一時的な権限委譲

### 2. 権限設定のベストプラクティス

#### 階層設計の原則
```
最小権限の原則: 必要最小限の権限から開始
継承の活用: 共通権限は上位で設定
例外の最小化: 個別例外は最小限に抑制
定期見直し: 権限の定期的な見直し実施
```

#### 設定例：営業部の場合
```php
// 1. 会社基本権限
$companyBase = [
    'system.access' => true,
    'estimate.view' => true,
];

// 2. 営業部権限
$salesDepartment = [
    'estimate.create' => true,
    'estimate.edit' => true,
    'customer.manage' => true,
];

// 3. 課長権限
$managerPosition = [
    'approval.execute' => true,
    'approval.amount_limit' => 20000000,
    'team.manage' => true,
];

// 4. 田中課長例外（営業統括責任者）
$tanakaException = [
    'approval.amount_limit' => 30000000, // 上限引き上げ
    'flow.design' => true, // フロー設計権限追加
];
```

## 🎯 統合設定のメリット

### 1. 管理効率の向上
- **一画面操作**: 複数の設定を一度に管理
- **権限継承**: 階層的な設定により重複を削減
- **プレビュー機能**: 変更前の影響確認

### 2. 柔軟性と制御
- **例外処理**: 特別な要件への個別対応
- **一時権限**: 期間限定の権限付与
- **承認フロー**: 権限変更の承認プロセス

### 3. 監査・コンプライアンス
- **完全な履歴**: 全ての権限変更を記録
- **継承トレース**: 権限の出所を明確に追跡
- **定期レビュー**: 権限の適切性を定期確認

## 📝 まとめ

統合承認権限設定により、以下が実現できます：

### ✅ 効率的な管理
- 部署・役職・個人の権限を一画面で管理
- 権限継承による設定の簡素化
- 一括変更と例外設定の両立

### ✅ 柔軟な制御
- 階層的な権限設定
- 個別例外による細かい調整
- 期間限定権限の対応

### ✅ 透明性の確保
- 権限継承の可視化
- 変更履歴の完全記録
- 影響範囲の事前確認

この統合アプローチにより、組織の複雑な権限要件に対応しながら、管理負荷を最小限に抑えた効率的な権限管理システムを実現できます。
