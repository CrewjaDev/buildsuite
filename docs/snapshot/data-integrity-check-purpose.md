# データ整合性チェックの目的と重要性

## 概要

データ整合性チェックは、システムの信頼性とデータの一貫性を保つために行う重要な機能です。**スナップショット機能では、ある時点の静的状態を保存し、参照元が変更されることを前提とした管理方法**であることを理解することが重要です。

## スナップショットの本質的な目的

### 🎯 **スナップショットの基本概念**

#### **時点での静的状態保存**
```php
// スナップショットの本質的な目的
class SnapshotPurpose
{
    /**
     * スナップショットは「ある時点の静的状態」を保存する
     * 参照元が変更されることを前提とした管理方法
     */
    public function createSnapshotAtPointInTime(Estimate $estimate, User $creator)
    {
        // この時点での作成者の状態を完全に保存
        $snapshotData = [
            'snapshot_created_at' => now(),
            'user' => [
                'id' => $creator->id,
                'login_id' => $creator->login_id,
                'system_level' => $creator->system_level,
                // この時点での状態を保存
            ],
            'employee' => [
                'id' => $creator->employee->id,
                'name' => $creator->employee->name,
                'department_id' => $creator->employee->department_id,
                // この時点での部署情報を保存
            ],
            'position' => [
                'code' => $creator->employee->position->code,
                'name' => $creator->employee->position->name,
                'level' => $creator->employee->position->level,
                // この時点での職位情報を保存
            ]
        ];
        
        return $snapshotData;
    }
}
```

**重要なポイント:**
- **時点での完全な状態保存**: 作成時の状態を完全に記録
- **参照元の変更を前提**: 後で参照元が変更されても問題なし
- **監査証跡の保証**: 作成時の正確な状態を永続的に保持

### 📊 **参照元変更を前提とした管理**

#### **部署異動の例**
```php
// 部署異動後のスナップショット管理
class DepartmentTransferExample
{
    public function handleDepartmentTransfer()
    {
        // 1. 見積作成時（2024年1月）
        $estimate = Estimate::create([
            'created_by' => 123,
            'created_by_department_id' => 10, // 営業部
            'created_by_snapshot' => [
                'employee' => [
                    'department_id' => 10,
                    'department_name' => '営業部'
                ]
            ]
        ]);
        
        // 2. 部署異動（2024年3月）
        $user = User::find(123);
        $user->employee->update(['department_id' => 20]); // 企画部に異動
        
        // 3. スナップショットは変更されない（正しい動作）
        $estimate->refresh();
        // created_by_department_id = 10 (営業部) - 変更されない
        // created_by_snapshot['employee']['department_id'] = 10 (営業部) - 変更されない
        
        // 4. 現在のユーザー情報
        $currentUser = User::find(123);
        // $currentUser->employee->department_id = 20 (企画部) - 現在の状態
    }
}
```

**この動作が正しい理由:**
- **監査証跡の保持**: 作成時の正確な状態を保持
- **責任の明確化**: 誰がどの部署で作成したかを明確に記録
- **法的要件への対応**: 作成時の状態を証拠として保持

## 整合性チェックの真の目的

### 🔍 **スナップショット作成時の整合性**

#### **作成時点でのデータ整合性**
```php
class SnapshotCreationIntegrity
{
    public function validateSnapshotCreation(Estimate $estimate, User $creator)
    {
        $issues = [];
        
        // 作成時点でのデータ整合性チェック
        $snapshot = $estimate->created_by_snapshot;
        
        // 1. スナップショット作成日時の整合性
        if ($snapshot['snapshot_created_at'] > $estimate->created_at) {
            $issues[] = 'snapshot_created_after_estimate_creation';
        }
        
        // 2. 作成時点でのユーザー情報の整合性
        if ($snapshot['user']['id'] !== $creator->id) {
            $issues[] = 'creator_id_mismatch_at_creation_time';
        }
        
        // 3. 作成時点での部署情報の整合性
        if ($snapshot['employee']['department_id'] !== $creator->employee->department_id) {
            $issues[] = 'department_id_mismatch_at_creation_time';
        }
        
        return $issues;
    }
}
```

**目的:**
- **作成時点での正確性**: スナップショット作成時のデータが正確か
- **データの完全性**: 必要な情報がすべて含まれているか
- **時系列の整合性**: 作成日時が論理的に正しいか

### 📈 **参照元変更後の整合性チェック**

#### **変更後の状態確認（正常な動作）**
```php
class PostChangeIntegrityCheck
{
    public function validateAfterReferenceChange(Estimate $estimate)
    {
        $issues = [];
        $snapshot = $estimate->created_by_snapshot;
        
        // 現在のユーザー情報を取得
        $currentUser = User::find($estimate->created_by);
        
        // 1. 部署が変更されている場合（正常な動作）
        $snapshotDeptId = $snapshot['employee']['department_id'] ?? null;
        $currentDeptId = $currentUser->employee->department_id ?? null;
        
        if ($snapshotDeptId !== $currentDeptId) {
            // これは正常な動作 - スナップショットは変更されない
            $issues[] = 'department_changed_after_creation'; // 情報として記録
        }
        
        // 2. 職位が変更されている場合（正常な動作）
        $snapshotPositionCode = $snapshot['position']['code'] ?? null;
        $currentPositionCode = $currentUser->employee->position->code ?? null;
        
        if ($snapshotPositionCode !== $currentPositionCode) {
            // これは正常な動作 - スナップショットは変更されない
            $issues[] = 'position_changed_after_creation'; // 情報として記録
        }
        
        return $issues;
    }
}
```

**重要な理解:**
- **変更は正常な動作**: 参照元の変更は想定内
- **スナップショットは不変**: 作成時の状態を保持
- **監査証跡の保護**: 作成時の正確な状態を維持

### 🎯 **真の整合性チェック項目**

#### **1. スナップショット作成時の整合性**
```php
class TrueIntegrityCheck
{
    public function validateSnapshotIntegrity(Estimate $estimate)
    {
        $issues = [];
        $snapshot = $estimate->created_by_snapshot;
        
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

#### **2. データ構造の整合性**
```php
class DataStructureIntegrity
{
    public function validateDataStructure($snapshot)
    {
        $issues = [];
        
        // JSONB構造の整合性
        if (isset($snapshot['user'])) {
            $userFields = ['id', 'login_id', 'system_level'];
            foreach ($userFields as $field) {
                if (!isset($snapshot['user'][$field])) {
                    $issues[] = "missing_user_field: {$field}";
                }
            }
        }
        
        if (isset($snapshot['employee'])) {
            $employeeFields = ['id', 'name', 'department_id'];
            foreach ($employeeFields as $field) {
                if (!isset($snapshot['employee'][$field])) {
                    $issues[] = "missing_employee_field: {$field}";
                }
            }
        }
        
        return $issues;
    }
}

## 整合性チェックの実行タイミング

### 1. スナップショット作成時

#### **作成時点での整合性チェック**
```php
class SnapshotCreationService
{
    public function createSnapshotOnApproval(Estimate $estimate, User $approver)
    {
        // 1. 作成時点での整合性チェック
        $creationIssues = $this->validateCreationTimeIntegrity($estimate);
        if (!empty($creationIssues)) {
            throw new \Exception('スナップショット作成時の整合性チェックに失敗: ' . implode(', ', $creationIssues));
        }
        
        // 2. スナップショット作成
        $snapshotData = $this->createUserSnapshot($estimate->creator);
        
        // 3. 作成後の整合性チェック
        $postCreationIssues = $this->validatePostCreationIntegrity($estimate, $snapshotData);
        if (!empty($postCreationIssues)) {
            throw new \Exception('スナップショット作成後の整合性チェックに失敗: ' . implode(', ', $postCreationIssues));
        }
        
        // 4. データ更新
        $estimate->update([
            'created_by_department_id' => $snapshotData['created_by_department_id'],
            'created_by_position_code' => $snapshotData['created_by_position_code'],
            'created_by_system_level' => $snapshotData['created_by_system_level'],
            'created_by_role' => $snapshotData['created_by_role'],
            'created_by_snapshot' => $snapshotData['created_by_snapshot'],
        ]);
    }
}
```

### 2. 定期実行（参照元変更の確認）

#### **変更履歴の記録**
```php
class ReferenceChangeTracking
{
    public function trackReferenceChanges()
    {
        $estimates = Estimate::whereNotNull('created_by_snapshot')->get();
        
        foreach ($estimates as $estimate) {
            $snapshot = $estimate->created_by_snapshot;
            $currentUser = User::find($estimate->created_by);
            
            // 変更履歴の記録（正常な動作）
            $changes = $this->detectChanges($snapshot, $currentUser);
            
            if (!empty($changes)) {
                // 変更履歴をログに記録
                Log::info('Reference changes detected', [
                    'estimate_id' => $estimate->id,
                    'changes' => $changes,
                    'note' => 'These changes are expected and normal'
                ]);
            }
        }
    }
    
    private function detectChanges($snapshot, $currentUser)
    {
        $changes = [];
        
        // 部署変更の検出
        $snapshotDeptId = $snapshot['employee']['department_id'] ?? null;
        $currentDeptId = $currentUser->employee->department_id ?? null;
        
        if ($snapshotDeptId !== $currentDeptId) {
            $changes[] = [
                'field' => 'department_id',
                'snapshot_value' => $snapshotDeptId,
                'current_value' => $currentDeptId,
                'change_type' => 'department_transfer'
            ];
        }
        
        return $changes;
    }
}
```

### 3. 監査時

#### **監査用の整合性レポート**
```php
class AuditIntegrityReport
{
    public function generateAuditReport($dateFrom, $dateTo)
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
            $snapshotIssues = $this->validateSnapshotIntegrity($estimate);
            
            if (!empty($snapshotIssues)) {
                $report['snapshot_integrity'][] = [
                    'estimate_id' => $estimate->id,
                    'issues' => $snapshotIssues
                ];
                $report['compliance_status'] = 'non_compliant';
            }
            
            // 参照元変更の記録（正常な動作）
            $changes = $this->detectReferenceChanges($estimate);
            if (!empty($changes)) {
                $report['reference_changes'][] = [
                    'estimate_id' => $estimate->id,
                    'changes' => $changes,
                    'note' => 'Expected changes due to organizational updates'
                ];
            }
        }
        
        return $report;
    }
}
```

## まとめ

### 🎯 **スナップショットの本質的理解**

1. **時点での静的状態保存**: ある時点の完全な状態を記録
2. **参照元変更を前提**: 後で参照元が変更されても問題なし
3. **監査証跡の保護**: 作成時の正確な状態を永続的に保持

### 🔍 **整合性チェックの真の目的**

1. **作成時点での整合性**: スナップショット作成時のデータが正確か
2. **データ構造の整合性**: JSONB構造が正しいか
3. **時系列の整合性**: 作成日時が論理的に正しいか

### ❌ **整合性チェックで確認すべきでない項目**

1. **参照元の変更**: 部署異動、職位変更など（正常な動作）
2. **現在の状態との差異**: スナップショットは不変であるべき
3. **外部キーの現在の有効性**: 作成時点での有効性のみ確認

### ✅ **正しい整合性チェックのアプローチ**

1. **作成時点での完全性**: 必要な情報がすべて含まれているか
2. **データ型の正確性**: 各フィールドのデータ型が正しいか
3. **時系列の論理性**: 作成日時が論理的に正しいか
4. **変更履歴の記録**: 参照元の変更を情報として記録（エラーではない）

**結論**: スナップショットは「ある時点の静的状態」を保存するもので、参照元の変更は想定内の動作です。整合性チェックは、スナップショット作成時の正確性とデータ構造の整合性を確認することが主な目的であり、参照元の変更をエラーとして扱うべきではありません。

---

**作成日**: 2025年1月27日  
**解説者**: システム開発チーム  
**対象者**: 開発者、監査担当者、運用担当者
