# スナップショット監査整合性要件

## 概要

スナップショット機能の監査対応において、**スナップショットの保存と参照元の変更履歴の記録がセット**になっている必要があります。スナップショットの日時の保存内容と、同一日時の参照元の内容が一致していることが保証される仕組みが監査対応には不可欠です。

## 監査整合性の要件

### 🎯 **基本的な要件**

#### **1. スナップショットの固定性**
```php
// スナップショット作成時の完全な状態保存
class SnapshotCreation
{
    public function createSnapshotAtPointInTime(Estimate $estimate, User $creator)
    {
        $snapshotData = [
            'snapshot_created_at' => now(), // 正確な作成日時
            'user' => [
                'id' => $creator->id,
                'login_id' => $creator->login_id,
                'system_level' => $creator->system_level,
                // この時点での完全な状態
            ],
            'employee' => [
                'id' => $creator->employee->id,
                'name' => $creator->employee->name,
                'department_id' => $creator->employee->department_id,
                'department_name' => $creator->employee->department->name,
                // この時点での部署情報
            ],
            'position' => [
                'code' => $creator->employee->position->code,
                'name' => $creator->employee->position->name,
                'level' => $creator->employee->position->level,
                // この時点での職位情報
            ]
        ];
        
        return $snapshotData;
    }
}
```

#### **2. 参照元の変更履歴記録**
```php
// 参照元の変更履歴を記録する仕組み
class ReferenceChangeAudit
{
    public function recordReferenceChanges($entityType, $entityId, $changes)
    {
        $auditLog = [
            'entity_type' => $entityType, // 'user', 'employee', 'department', etc.
            'entity_id' => $entityId,
            'changes' => $changes,
            'changed_at' => now(),
            'changed_by' => auth()->id(),
            'change_reason' => 'organizational_update', // 異動、昇進など
        ];
        
        // 監査ログテーブルに記録
        AuditLog::create($auditLog);
        
        return $auditLog;
    }
}
```

### 📊 **監査整合性の検証**

#### **スナップショットと参照元の整合性確認**
```php
class SnapshotAuditIntegrity
{
    public function validateSnapshotIntegrity(Estimate $estimate)
    {
        $snapshot = $estimate->created_by_snapshot;
        $snapshotCreatedAt = Carbon::parse($snapshot['snapshot_created_at']);
        
        // 1. スナップショット作成時点での参照元データを再構築
        $reconstructedData = $this->reconstructReferenceDataAtTime(
            $estimate->created_by,
            $snapshotCreatedAt
        );
        
        // 2. スナップショットデータとの整合性確認
        $integrityIssues = [];
        
        // 部署情報の整合性
        if ($snapshot['employee']['department_id'] !== $reconstructedData['department_id']) {
            $integrityIssues[] = [
                'field' => 'department_id',
                'snapshot_value' => $snapshot['employee']['department_id'],
                'reconstructed_value' => $reconstructedData['department_id'],
                'issue_type' => 'data_mismatch'
            ];
        }
        
        // 職位情報の整合性
        if ($snapshot['position']['code'] !== $reconstructedData['position_code']) {
            $integrityIssues[] = [
                'field' => 'position_code',
                'snapshot_value' => $snapshot['position']['code'],
                'reconstructed_value' => $reconstructedData['position_code'],
                'issue_type' => 'data_mismatch'
            ];
        }
        
        return $integrityIssues;
    }
    
    private function reconstructReferenceDataAtTime($userId, $targetTime)
    {
        // 指定時点での参照元データを再構築
        $user = User::find($userId);
        
        // 変更履歴から指定時点での状態を復元
        $departmentHistory = $this->getDepartmentHistoryAtTime($user->employee_id, $targetTime);
        $positionHistory = $this->getPositionHistoryAtTime($user->employee_id, $targetTime);
        
        return [
            'department_id' => $departmentHistory['department_id'],
            'department_name' => $departmentHistory['department_name'],
            'position_code' => $positionHistory['position_code'],
            'position_name' => $positionHistory['position_name'],
        ];
    }
}
```

### 🔍 **変更履歴の管理**

#### **部署変更履歴の記録**
```php
// 部署変更時の履歴記録
class DepartmentChangeAudit
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
        $this->recordReferenceChanges('employee_department', $employeeId, [
            'old_department_id' => $oldDepartmentId,
            'new_department_id' => $newDepartmentId,
            'change_reason' => $reason,
        ]);
        
        // 3. 関連するスナップショットの整合性チェック
        $this->validateRelatedSnapshots($employeeId, $changeLog);
        
        return $changeLog;
    }
    
    private function validateRelatedSnapshots($employeeId, $changeLog)
    {
        // この従業員に関連するスナップショットの整合性をチェック
        $relatedEstimates = Estimate::whereHas('creator.employee', function($query) use ($employeeId) {
            $query->where('id', $employeeId);
        })->whereNotNull('created_by_snapshot')->get();
        
        foreach ($relatedEstimates as $estimate) {
            $integrityIssues = $this->validateSnapshotIntegrity($estimate);
            
            if (!empty($integrityIssues)) {
                // 整合性問題をログに記録
                Log::warning('Snapshot integrity issue detected', [
                    'estimate_id' => $estimate->id,
                    'employee_id' => $employeeId,
                    'change_log_id' => $changeLog->id,
                    'integrity_issues' => $integrityIssues
                ]);
            }
        }
    }
}
```

#### **職位変更履歴の記録**
```php
// 職位変更時の履歴記録
class PositionChangeAudit
{
    public function recordPositionChange($employeeId, $oldPositionId, $newPositionId, $reason = null)
    {
        // 1. 変更履歴を記録
        $changeLog = EmployeePositionHistory::create([
            'employee_id' => $employeeId,
            'old_position_id' => $oldPositionId,
            'new_position_id' => $newPositionId,
            'change_date' => now(),
            'change_reason' => $reason,
            'changed_by' => auth()->id(),
        ]);
        
        // 2. 監査ログに記録
        $this->recordReferenceChanges('employee_position', $employeeId, [
            'old_position_id' => $oldPositionId,
            'new_position_id' => $newPositionId,
            'change_reason' => $reason,
        ]);
        
        return $changeLog;
    }
}
```

### 📋 **監査証跡の完全性**

#### **スナップショット作成時の監査証跡**
```php
class SnapshotAuditTrail
{
    public function createSnapshotWithAuditTrail(Estimate $estimate, User $creator)
    {
        $snapshotCreatedAt = now();
        
        // 1. スナップショット作成前の整合性チェック
        $preSnapshotIntegrity = $this->validatePreSnapshotIntegrity($estimate, $creator);
        if (!empty($preSnapshotIntegrity)) {
            throw new \Exception('スナップショット作成前の整合性チェックに失敗');
        }
        
        // 2. スナップショット作成
        $snapshotData = $this->createSnapshotAtPointInTime($estimate, $creator);
        
        // 3. 監査証跡の記録
        $auditTrail = [
            'snapshot_created_at' => $snapshotCreatedAt,
            'snapshot_data' => $snapshotData,
            'reference_data_at_time' => $this->getReferenceDataAtTime($creator, $snapshotCreatedAt),
            'integrity_verified' => true,
            'audit_trail_id' => $this->generateAuditTrailId(),
        ];
        
        // 4. スナップショット作成後の整合性チェック
        $postSnapshotIntegrity = $this->validatePostSnapshotIntegrity($estimate, $snapshotData);
        if (!empty($postSnapshotIntegrity)) {
            throw new \Exception('スナップショット作成後の整合性チェックに失敗');
        }
        
        // 5. 監査証跡をスナップショットに含める
        $snapshotData['audit_trail'] = $auditTrail;
        
        return $snapshotData;
    }
    
    private function getReferenceDataAtTime($creator, $targetTime)
    {
        // 指定時点での参照元データを取得
        return [
            'user' => [
                'id' => $creator->id,
                'login_id' => $creator->login_id,
                'system_level' => $creator->system_level,
            ],
            'employee' => [
                'id' => $creator->employee->id,
                'name' => $creator->employee->name,
                'department_id' => $creator->employee->department_id,
                'department_name' => $creator->employee->department->name,
            ],
            'position' => [
                'code' => $creator->employee->position->code,
                'name' => $creator->employee->position->name,
                'level' => $creator->employee->position->level,
            ]
        ];
    }
}
```

### 🔄 **継続的な整合性監視**

#### **定期整合性チェック**
```php
class ContinuousIntegrityMonitoring
{
    public function performRegularIntegrityCheck()
    {
        $estimates = Estimate::whereNotNull('created_by_snapshot')->get();
        $integrityReport = [
            'check_date' => now(),
            'total_estimates' => $estimates->count(),
            'integrity_issues' => [],
            'compliance_status' => 'compliant'
        ];
        
        foreach ($estimates as $estimate) {
            $issues = $this->validateSnapshotIntegrity($estimate);
            
            if (!empty($issues)) {
                $integrityReport['integrity_issues'][] = [
                    'estimate_id' => $estimate->id,
                    'issues' => $issues,
                    'severity' => $this->calculateSeverity($issues)
                ];
                $integrityReport['compliance_status'] = 'non_compliant';
            }
        }
        
        // 整合性レポートを保存
        $this->saveIntegrityReport($integrityReport);
        
        return $integrityReport;
    }
    
    private function calculateSeverity($issues)
    {
        $criticalIssues = array_filter($issues, function($issue) {
            return $issue['issue_type'] === 'data_mismatch';
        });
        
        return count($criticalIssues) > 0 ? 'critical' : 'warning';
    }
}
```

## 監査要件への対応

### 📊 **監査証跡の完全性**

#### **1. スナップショットの固定性**
- **作成時点での完全な状態保存**
- **後からの変更不可**
- **時点での正確な記録**

#### **2. 参照元の変更履歴**
- **すべての変更の記録**
- **変更理由の記録**
- **変更者の記録**

#### **3. 整合性の検証**
- **スナップショットと参照元の一致確認**
- **時点でのデータ再構築**
- **継続的な監視**

### 🎯 **監査対応の要件**

#### **法的要件への適合**
```php
// 監査要件への適合性確認
class AuditComplianceCheck
{
    public function validateAuditCompliance(Estimate $estimate)
    {
        $complianceReport = [
            'estimate_id' => $estimate->id,
            'compliance_status' => 'compliant',
            'requirements' => [
                'snapshot_fixed' => $this->checkSnapshotFixed($estimate),
                'reference_history_recorded' => $this->checkReferenceHistory($estimate),
                'integrity_verified' => $this->checkIntegrity($estimate),
                'audit_trail_complete' => $this->checkAuditTrail($estimate),
            ]
        ];
        
        // すべての要件を満たしているかチェック
        foreach ($complianceReport['requirements'] as $requirement => $status) {
            if (!$status) {
                $complianceReport['compliance_status'] = 'non_compliant';
                break;
            }
        }
        
        return $complianceReport;
    }
}
```

## まとめ

### 🎯 **監査整合性の要件**

1. **スナップショットの固定性**: 作成時点での完全な状態保存
2. **参照元の変更履歴**: すべての変更の記録
3. **整合性の検証**: スナップショットと参照元の一致確認
4. **継続的な監視**: 定期的な整合性チェック

### ✅ **監査対応の仕組み**

1. **スナップショット作成時**: 完全な状態保存と監査証跡の記録
2. **参照元変更時**: 変更履歴の記録と関連スナップショットの整合性チェック
3. **定期監視**: 継続的な整合性チェックとレポート生成
4. **監査時**: 完全な監査証跡の提供

### 🔍 **重要なポイント**

- **スナップショットの保存と参照元の変更履歴記録がセット**
- **スナップショットの日時の保存内容と同一日時の参照元の内容が一致**
- **継続的な整合性監視と検証**
- **完全な監査証跡の提供**

**結論**: スナップショット機能の監査対応には、スナップショットの固定性と参照元の変更履歴記録がセットになった仕組みが不可欠です。これにより、スナップショットの日時の保存内容と同一日時の参照元の内容が一致していることが保証され、監査要件を満たすことができます。

---

**作成日**: 2025年1月27日  
**解説者**: システム開発チーム  
**対象者**: 開発者、監査担当者、運用担当者
