# スナップショット機能実装ロードマップ

## 概要

見積管理システムにおけるスナップショット機能の実装計画と現状の整理。監査対応のための作成者情報の時点保存機能を段階的に実装するための包括的なガイド。

## 現状の実装状況

### 🎯 **現在実装済みの機能**

#### **1. 基本的な見積管理機能**
```php
// 現在のestimatesテーブル構造
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_number VARCHAR(50) UNIQUE NOT NULL,
    partner_id BIGINT NOT NULL REFERENCES partners(id),
    project_type_id BIGINT NOT NULL REFERENCES project_types(id),
    project_name VARCHAR(500) NOT NULL,
    // ... その他の基本フィールド
    created_by BIGINT NOT NULL REFERENCES users(id),
    responsible_user_id BIGINT REFERENCES users(id),
    visibility VARCHAR(20) DEFAULT 'private',
    department_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

#### **2. データ可視性制御**
```php
// EstimateController.php - 現在の実装
class EstimateController extends Controller
{
    public function index(Request $request)
    {
        $estimates = Estimate::with([
            'partner', 'projectType', 'constructionClassification',
            'creator', 'creatorEmployee', 'responsibleUser'
        ])
        ->visibleTo($request->user())
        ->paginate(20);
        
        return response()->json($estimates);
    }
    
    public function store(Request $request)
    {
        $estimate = Estimate::create([
            'created_by' => $request->user()->id,
            'responsible_user_id' => $request->responsible_user_id ?? $request->user()->id,
            'visibility' => $request->visibility ?? 'private',
            'department_id' => $request->user()->employee->department_id ?? null,
            // ... その他のフィールド
        ]);
        
        return response()->json($estimate, 201);
    }
}
```

#### **3. ユーザー・組織管理**
```php
// 現在の関連テーブル構造
- users (ユーザー情報)
- employees (従業員情報)
- departments (部署情報)
- positions (職位情報)
- user_departments (ユーザー-部署関連)
- user_roles (ユーザー-役割関連)
```

### 📊 **現在の監査対応レベル**

#### **実装済みの監査要素**
1. **作成者記録**: `created_by` フィールドで作成者を記録
2. **責任者設定**: `responsible_user_id` で責任者を明示
3. **可視性制御**: `visibility` でデータアクセス制御
4. **部署情報**: `department_id` で作成時の部署を記録
5. **タイムスタンプ**: `created_at`, `updated_at` で作成・更新日時を記録

#### **現在の制限事項**
1. **時点での組織情報保存なし**: 部署異動後、作成時の部署情報が失われる
2. **職位情報の保存なし**: 作成時の職位情報が記録されない
3. **権限レベルの保存なし**: 作成時のシステム権限レベルが記録されない
4. **変更履歴管理なし**: 参照元の変更履歴が記録されない

## スナップショット機能の実装計画

### 🎯 **Phase 1: 基本的なスナップショット機能**

#### **1.1 データベーススキーマ拡張**
```sql
-- estimatesテーブルにスナップショット関連カラムを追加
ALTER TABLE estimates ADD COLUMN created_by_department_id BIGINT;
ALTER TABLE estimates ADD COLUMN created_by_position_code VARCHAR(50);
ALTER TABLE estimates ADD COLUMN created_by_system_level VARCHAR(50);
ALTER TABLE estimates ADD COLUMN created_by_role VARCHAR(50);
ALTER TABLE estimates ADD COLUMN created_by_snapshot JSONB;

-- インデックス作成
CREATE INDEX idx_estimates_created_by_department_id ON estimates(created_by_department_id);
CREATE INDEX idx_estimates_created_by_position_code ON estimates(created_by_position_code);
CREATE INDEX idx_estimates_created_by_system_level ON estimates(created_by_system_level);
CREATE INDEX idx_estimates_created_by_snapshot ON estimates USING GIN(created_by_snapshot);
```

#### **1.2 基本的なスナップショット作成機能**
```php
// SnapshotService.php - 新規作成
class SnapshotService
{
    public function createUserSnapshot(User $user)
    {
        return [
            'created_by_department_id' => $user->employee->department_id ?? null,
            'created_by_position_code' => $user->employee->position->code ?? null,
            'created_by_system_level' => $user->system_level,
            'created_by_role' => $this->getUserPrimaryRole($user),
            'created_by_snapshot' => [
                'snapshot_created_at' => now(),
                'user' => [
                    'id' => $user->id,
                    'login_id' => $user->login_id,
                    'system_level' => $user->system_level,
                ],
                'employee' => [
                    'id' => $user->employee->id,
                    'name' => $user->employee->name,
                    'department_id' => $user->employee->department_id,
                    'department_name' => $user->employee->department->name ?? null,
                ],
                'position' => [
                    'code' => $user->employee->position->code ?? null,
                    'name' => $user->employee->position->name ?? null,
                    'level' => $user->employee->position->level ?? null,
                ],
                'roles' => $this->getUserRoles($user),
            ]
        ];
    }
}
```

#### **1.3 見積作成時のスナップショット適用**
```php
// EstimateController.php - 拡張
class EstimateController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        
        // スナップショット作成
        $snapshotData = app(SnapshotService::class)->createUserSnapshot($user);
        
        $estimate = Estimate::create([
            'created_by' => $user->id,
            'responsible_user_id' => $request->responsible_user_id ?? $user->id,
            'visibility' => $request->visibility ?? 'private',
            'department_id' => $user->employee->department_id ?? null,
            // スナップショットデータを追加
            'created_by_department_id' => $snapshotData['created_by_department_id'],
            'created_by_position_code' => $snapshotData['created_by_position_code'],
            'created_by_system_level' => $snapshotData['created_by_system_level'],
            'created_by_role' => $snapshotData['created_by_role'],
            'created_by_snapshot' => $snapshotData['created_by_snapshot'],
            // ... その他のフィールド
        ]);
        
        return response()->json($estimate, 201);
    }
}
```

### 🔄 **Phase 2: 変更履歴管理機能**

#### **2.1 変更履歴テーブル作成**
```sql
-- 部署変更履歴テーブル
CREATE TABLE employee_department_history (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    old_department_id BIGINT REFERENCES departments(id),
    new_department_id BIGINT NOT NULL REFERENCES departments(id),
    change_date TIMESTAMP NOT NULL,
    change_reason TEXT,
    changed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 職位変更履歴テーブル
CREATE TABLE employee_position_history (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    old_position_id BIGINT REFERENCES positions(id),
    new_position_id BIGINT NOT NULL REFERENCES positions(id),
    change_date TIMESTAMP NOT NULL,
    change_reason TEXT,
    changed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 監査ログテーブル
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    changed_at TIMESTAMP NOT NULL,
    changed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **2.2 変更履歴記録機能**
```php
// ChangeHistoryService.php - 新規作成
class ChangeHistoryService
{
    public function recordDepartmentChange($employeeId, $oldDepartmentId, $newDepartmentId, $reason = null)
    {
        // 1. 変更履歴を記録
        $changeLog = EmployeeDepartmentHistory::create([
            'employee_id' => $employeeId,
            'old_department_id' => $oldDepartmentId,
            'new_department_id' => $newDepartmentId,
            'change_date' => now(),
            'change_reason' => $reason,
            'changed_by' => auth()->id(),
        ]);
        
        // 2. 監査ログに記録
        AuditLog::create([
            'entity_type' => 'employee_department',
            'entity_id' => $employeeId,
            'action' => 'department_change',
            'changes' => [
                'old_department_id' => $oldDepartmentId,
                'new_department_id' => $newDepartmentId,
                'change_reason' => $reason,
            ],
            'changed_at' => now(),
            'changed_by' => auth()->id(),
        ]);
        
        return $changeLog;
    }
}
```

### 🔍 **Phase 3: 整合性チェック機能**

#### **3.1 整合性チェックサービス**
```php
// IntegrityCheckService.php - 新規作成
class IntegrityCheckService
{
    public function validateSnapshotIntegrity(Estimate $estimate)
    {
        $snapshot = $estimate->created_by_snapshot;
        $issues = [];
        
        // 1. 必須フィールドの存在確認
        $requiredFields = ['user', 'employee', 'snapshot_created_at'];
        foreach ($requiredFields as $field) {
            if (!isset($snapshot[$field])) {
                $issues[] = "missing_required_field: {$field}";
            }
        }
        
        // 2. データ型の整合性
        if (isset($snapshot['user']['id']) && !is_numeric($snapshot['user']['id'])) {
            $issues[] = 'invalid_user_id_type';
        }
        
        // 3. 時系列の整合性
        if (isset($snapshot['snapshot_created_at'])) {
            $snapshotTime = Carbon::parse($snapshot['snapshot_created_at']);
            if ($snapshotTime > $estimate->created_at) {
                $issues[] = 'snapshot_created_after_estimate_creation';
            }
        }
        
        return $issues;
    }
}
```

#### **3.2 定期整合性チェック**
```php
// IntegrityCheckCommand.php - 新規作成
class IntegrityCheckCommand extends Command
{
    protected $signature = 'estimates:check-integrity {--fix : 自動修正を実行}';
    
    public function handle()
    {
        $this->info('見積データの整合性チェックを開始...');
        
        $estimates = Estimate::whereNotNull('created_by_snapshot')->get();
        $totalIssues = 0;
        
        foreach ($estimates as $estimate) {
            $issues = app(IntegrityCheckService::class)->validateSnapshotIntegrity($estimate);
            
            if (!empty($issues)) {
                $totalIssues += count($issues);
                $this->warn("見積ID {$estimate->id}: " . implode(', ', $issues));
            }
        }
        
        if ($totalIssues === 0) {
            $this->info('✅ すべてのデータが整合性を保っています');
        } else {
            $this->error("❌ {$totalIssues}件の整合性問題が見つかりました");
        }
    }
}
```

### 📊 **Phase 4: 監査レポート機能**

#### **4.1 監査レポート生成**
```php
// AuditReportService.php - 新規作成
class AuditReportService
{
    public function generateIntegrityReport($dateFrom, $dateTo)
    {
        $estimates = Estimate::whereBetween('created_at', [$dateFrom, $dateTo])
            ->whereNotNull('created_by_snapshot')
            ->get();
        
        $report = [
            'period' => ['from' => $dateFrom, 'to' => $dateTo],
            'total_estimates' => $estimates->count(),
            'snapshot_integrity' => [],
            'reference_changes' => [],
            'compliance_status' => 'compliant'
        ];
        
        foreach ($estimates as $estimate) {
            // スナップショットの整合性チェック
            $snapshotIssues = app(IntegrityCheckService::class)->validateSnapshotIntegrity($estimate);
            
            if (!empty($snapshotIssues)) {
                $report['snapshot_integrity'][] = [
                    'estimate_id' => $estimate->id,
                    'issues' => $snapshotIssues
                ];
                $report['compliance_status'] = 'non_compliant';
            }
        }
        
        return $report;
    }
}
```

## 実装の優先順位

### 🎯 **Phase 1 (高優先度)**
- **基本的なスナップショット機能**
- **データベーススキーマ拡張**
- **見積作成時のスナップショット適用**

**理由**: 監査要件の基本的な対応が可能になる

### 🔄 **Phase 2 (中優先度)**
- **変更履歴管理機能**
- **参照元変更の記録**

**理由**: 完全な監査証跡の提供が可能になる

### 🔍 **Phase 3 (中優先度)**
- **整合性チェック機能**
- **定期チェック機能**

**理由**: データの信頼性と整合性の保証

### 📊 **Phase 4 (低優先度)**
- **監査レポート機能**
- **詳細な分析機能**

**理由**: 監査業務の効率化と詳細分析

## 現在の実装からの移行計画

### 📋 **移行手順**

#### **Step 1: データベース準備**
```bash
# マイグレーションファイル作成
php artisan make:migration add_snapshot_columns_to_estimates_table

# マイグレーション実行
php artisan migrate
```

#### **Step 2: サービス実装**
```bash
# サービスファイル作成
php artisan make:service SnapshotService
php artisan make:service ChangeHistoryService
php artisan make:service IntegrityCheckService
```

#### **Step 3: 既存データの移行**
```php
// 既存の見積データにスナップショットを追加
class MigrateExistingEstimatesCommand extends Command
{
    public function handle()
    {
        $estimates = Estimate::whereNull('created_by_snapshot')->get();
        
        foreach ($estimates as $estimate) {
            $creator = User::find($estimate->created_by);
            if ($creator) {
                $snapshotData = app(SnapshotService::class)->createUserSnapshot($creator);
                
                $estimate->update([
                    'created_by_department_id' => $snapshotData['created_by_department_id'],
                    'created_by_position_code' => $snapshotData['created_by_position_code'],
                    'created_by_system_level' => $snapshotData['created_by_system_level'],
                    'created_by_role' => $snapshotData['created_by_role'],
                    'created_by_snapshot' => $snapshotData['created_by_snapshot'],
                ]);
            }
        }
    }
}
```

## 監査要件への対応

### 🎯 **現在の対応レベル**
- **基本的な作成者記録**: ✅ 実装済み
- **責任者設定**: ✅ 実装済み
- **可視性制御**: ✅ 実装済み
- **部署情報記録**: ✅ 実装済み

### 📊 **スナップショット実装後の対応レベル**
- **時点での組織情報保存**: ✅ 実装予定
- **職位情報の保存**: ✅ 実装予定
- **権限レベルの保存**: ✅ 実装予定
- **変更履歴管理**: ✅ 実装予定
- **整合性チェック**: ✅ 実装予定
- **監査レポート**: ✅ 実装予定

## まとめ

### 🎯 **現状の理解**
- 基本的な監査要素は実装済み
- スナップショット機能は将来の拡張として計画
- 段階的な実装により、リスクを最小化

### 📋 **実装時の考慮事項**
1. **段階的な実装**: Phase 1から順次実装
2. **既存データの移行**: 既存見積データのスナップショット化
3. **パフォーマンス影響**: インデックス設計とクエリ最適化
4. **監査要件**: 法的要件への適合性確認

### ✅ **期待される効果**
- **監査証跡の完全性**: 作成時の正確な状態を永続的に保持
- **データの信頼性**: 整合性チェックによる品質保証
- **運用効率の向上**: 自動化による効率化
- **コンプライアンス対応**: 法的要件への適合

**結論**: 現在の実装を基盤として、段階的にスナップショット機能を実装することで、完全な監査対応システムを構築できます。各Phaseの実装により、監査要件を満たしながら、システムの安定性とパフォーマンスを維持できます。

---

**作成日**: 2025年1月27日  
**解説者**: システム開発チーム  
**対象者**: 開発者、監査担当者、運用担当者
