# 見積スナップショット タイミング戦略

## 概要

データの確定（更新不可）時にスナップショットを作成する戦略について、一般的なベストプラクティスと実装方法を分析します。

## 一般的なスナップショットタイミング戦略

### 1. 業界標準のアプローチ

#### **金融・会計システム**
- **確定時スナップショット**: 決算確定、取引確定時
- **例**: 会計伝票の確定、銀行取引の確定
- **目的**: 監査証跡、法的要件への対応

#### **ERP・業務システム**
- **承認時スナップショット**: 承認完了時
- **例**: 購買承認、予算承認、契約承認
- **目的**: 承認者の責任明確化、変更履歴の保持

#### **文書管理システム**
- **公開時スナップショット**: 文書公開・配布時
- **例**: 契約書の締結、仕様書の確定
- **目的**: 版管理、変更履歴の保持

### 2. 見積システムでの一般的なパターン

#### **パターン1: 承認時スナップショット（推奨）**
```
見積作成 → 下書き → 提出 → 承認 → [スナップショット作成] → 確定
```

#### **パターン2: 提出時スナップショット**
```
見積作成 → 下書き → [スナップショット作成] → 提出 → 承認 → 確定
```

#### **パターン3: 複数タイミング**
```
見積作成 → [初回スナップショット] → 下書き → 提出 → [提出時スナップショット] → 承認 → [確定時スナップショット]
```

## 見積データの確定タイミング分析

### 1. 見積のライフサイクル

#### **現在の見積ステータス**
```php
// 見積のステータス遷移
$statusFlow = [
    'draft' => '下書き',
    'submitted' => '提出済み',
    'under_review' => '審査中',
    'approved' => '承認済み',
    'rejected' => '却下',
    'finalized' => '確定済み',  // 更新不可
    'expired' => '期限切れ'
];
```

#### **確定タイミングの候補**

| タイミング | メリット | デメリット | 適用場面 |
|------------|----------|------------|----------|
| **承認時** | 承認者の責任明確化 | 承認前の変更履歴が失われる | 承認フローが厳格な場合 |
| **提出時** | 提出者の責任明確化 | 承認プロセス中の変更が追跡できない | 提出が重要なマイルストーンの場合 |
| **確定時** | 最終的な責任者を明確化 | 確定前の変更履歴が失われる | 確定が重要なマイルストーンの場合 |
| **複数タイミング** | 完全な履歴保持 | データ量増加、複雑性向上 | 厳格な監査要件がある場合 |

### 2. 推奨アプローチ: 承認時スナップショット

#### **理由**
1. **責任の明確化**: 承認者が最終的な責任を持つ
2. **監査要件**: 承認時点での組織情報を保持
3. **法的要件**: 承認者の権限・役割を記録
4. **実用性**: 承認後の変更は通常発生しない

#### **実装例**

```php
<?php

namespace App\Services;

class EstimateSnapshotService
{
    /**
     * 承認時にスナップショットを作成
     */
    public function createSnapshotOnApproval(Estimate $estimate, User $approver)
    {
        // 承認前の状態をスナップショットとして保存
        $snapshotData = $this->createUserSnapshot($estimate->creator);
        
        // スナップショットデータを更新
        $estimate->update([
            'created_by_department_id' => $snapshotData['created_by_department_id'],
            'created_by_position_code' => $snapshotData['created_by_position_code'],
            'created_by_system_level' => $snapshotData['created_by_system_level'],
            'created_by_role' => $snapshotData['created_by_role'],
            'created_by_snapshot' => $snapshotData['created_by_snapshot'],
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'status' => 'approved'
        ]);
        
        // 承認後の見積は更新不可に設定
        $this->makeEstimateReadOnly($estimate);
        
        return $estimate;
    }
    
    /**
     * 見積を読み取り専用にする
     */
    private function makeEstimateReadOnly(Estimate $estimate)
    {
        // フラグで更新不可を制御
        $estimate->update(['is_readonly' => true]);
        
        // または、ステータスで制御
        $estimate->update(['status' => 'finalized']);
    }
}
```

## 実装戦略の詳細

### 1. データベース設計の更新

#### **追加カラム**
```sql
-- 見積の読み取り専用制御
ALTER TABLE estimates ADD COLUMN is_readonly BOOLEAN DEFAULT false;
ALTER TABLE estimates ADD COLUMN snapshot_created_at TIMESTAMP;
ALTER TABLE estimates ADD COLUMN snapshot_reason VARCHAR(100); -- 'approval', 'submission', 'finalization'
```

#### **更新制御の実装**
```php
// Estimateモデルでの更新制御
class Estimate extends Model
{
    protected static function boot()
    {
        parent::boot();
        
        // 更新前のチェック
        static::updating(function ($estimate) {
            if ($estimate->is_readonly) {
                throw new \Exception('確定済みの見積は更新できません');
            }
        });
        
        // 削除前のチェック
        static::deleting(function ($estimate) {
            if ($estimate->is_readonly) {
                throw new \Exception('確定済みの見積は削除できません');
            }
        });
    }
}
```

### 2. 承認フローとの連携

#### **承認完了時の自動スナップショット**
```php
<?php

namespace App\Http\Controllers;

class EstimateApprovalController extends Controller
{
    /**
     * 見積承認処理
     */
    public function approve(Request $request, $estimateId)
    {
        $estimate = Estimate::findOrFail($estimateId);
        $approver = auth()->user();
        
        // 承認権限チェック
        if (!$this->canApprove($estimate, $approver)) {
            return response()->json(['message' => '承認権限がありません'], 403);
        }
        
        DB::beginTransaction();
        try {
            // 承認処理
            $estimate->update([
                'status' => 'approved',
                'approved_by' => $approver->id,
                'approved_at' => now()
            ]);
            
            // スナップショット作成
            $snapshotService = new EstimateSnapshotService();
            $snapshotService->createSnapshotOnApproval($estimate, $approver);
            
            // 承認通知
            $this->sendApprovalNotification($estimate);
            
            DB::commit();
            
            return response()->json([
                'message' => '見積を承認しました',
                'estimate' => $estimate
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => '承認に失敗しました'], 500);
        }
    }
}
```

### 3. 複数タイミングでのスナップショット

#### **段階的スナップショット戦略**
```php
<?php

namespace App\Services;

class MultiStageSnapshotService
{
    /**
     * 提出時スナップショット
     */
    public function createSnapshotOnSubmission(Estimate $estimate)
    {
        $snapshotData = $this->createUserSnapshot($estimate->creator);
        
        $estimate->update([
            'submission_snapshot' => $snapshotData,
            'submission_snapshot_at' => now(),
            'status' => 'submitted'
        ]);
    }
    
    /**
     * 承認時スナップショット
     */
    public function createSnapshotOnApproval(Estimate $estimate, User $approver)
    {
        $snapshotData = $this->createUserSnapshot($estimate->creator);
        
        $estimate->update([
            'approval_snapshot' => $snapshotData,
            'approval_snapshot_at' => now(),
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'status' => 'approved'
        ]);
    }
    
    /**
     * 確定時スナップショット
     */
    public function createSnapshotOnFinalization(Estimate $estimate)
    {
        $snapshotData = $this->createUserSnapshot($estimate->creator);
        
        $estimate->update([
            'final_snapshot' => $snapshotData,
            'final_snapshot_at' => now(),
            'is_readonly' => true,
            'status' => 'finalized'
        ]);
    }
}
```

## 業界別のベストプラクティス

### 1. 建設業界

#### **一般的なパターン**
```
見積作成 → 内部検討 → 提出 → 顧客検討 → 受注 → [確定時スナップショット]
```

#### **特徴**
- **受注確定時**: 契約締結時点でのスナップショット
- **責任者**: 営業責任者、技術責任者
- **監査要件**: 受注プロセスの透明性

### 2. 製造業界

#### **一般的なパターン**
```
見積作成 → 技術検討 → 承認 → 提出 → [承認時スナップショット]
```

#### **特徴**
- **承認時**: 技術承認完了時点でのスナップショット
- **責任者**: 技術責任者、営業責任者
- **監査要件**: 技術仕様の確定

### 3. サービス業界

#### **一般的なパターン**
```
見積作成 → 内部承認 → 提出 → 顧客承認 → [顧客承認時スナップショット]
```

#### **特徴**
- **顧客承認時**: 顧客の承認完了時点でのスナップショット
- **責任者**: プロジェクト責任者
- **監査要件**: 顧客合意の記録

## 実装時の考慮事項

### 1. パフォーマンス考慮

#### **スナップショット作成の最適化**
```php
// バッチ処理でのスナップショット作成
class BatchSnapshotService
{
    public function createSnapshotsForApprovedEstimates()
    {
        $estimates = Estimate::where('status', 'approved')
            ->whereNull('approval_snapshot')
            ->chunk(100, function ($estimates) {
                foreach ($estimates as $estimate) {
                    $this->createSnapshotOnApproval($estimate, $estimate->approver);
                }
            });
    }
}
```

### 2. データ整合性

#### **スナップショット整合性チェック**
```php
class SnapshotIntegrityService
{
    public function validateSnapshotIntegrity(Estimate $estimate)
    {
        $issues = [];
        
        // 承認時スナップショットの整合性チェック
        if ($estimate->approval_snapshot) {
            $snapshot = $estimate->approval_snapshot;
            $current = $this->getCurrentUserData($estimate->creator);
            
            if ($snapshot['employee']['department_id'] !== $current['employee']['department_id']) {
                $issues[] = 'department_changed_after_approval';
            }
        }
        
        return $issues;
    }
}
```

### 3. 監査・コンプライアンス

#### **監査ログの記録**
```php
class AuditLogService
{
    public function logSnapshotCreation(Estimate $estimate, $reason)
    {
        AuditLog::create([
            'estimate_id' => $estimate->id,
            'action' => 'snapshot_created',
            'reason' => $reason,
            'snapshot_data' => $estimate->approval_snapshot,
            'created_by' => auth()->id(),
            'created_at' => now()
        ]);
    }
}
```

## 推奨実装戦略

### 1. 段階的実装

#### **Phase 1: 基本実装**
- [ ] 承認時スナップショットの実装
- [ ] 読み取り専用制御の実装
- [ ] 基本的な整合性チェック

#### **Phase 2: 高度な機能**
- [ ] 複数タイミングでのスナップショット
- [ ] バッチ処理でのスナップショット作成
- [ ] 詳細な監査ログ

#### **Phase 3: 運用最適化**
- [ ] パフォーマンス最適化
- [ ] 継続的な整合性チェック
- [ ] 監査レポート機能

### 2. 運用ガイドライン

#### **スナップショット作成の原則**
1. **承認時**: 承認完了時に必ずスナップショット作成
2. **整合性**: スナップショット作成時の整合性チェック
3. **不可逆性**: 確定後の見積は更新不可
4. **監査**: スナップショット作成の監査ログ記録

#### **例外処理**
- **緊急時**: 管理者権限での更新（監査ログ必須）
- **データ修正**: 別テーブルでの修正履歴管理
- **復旧**: バックアップからの復旧手順

## 結論

### ✅ **推奨アプローチ: 承認時スナップショット**

**理由:**
1. **責任の明確化**: 承認者が最終的な責任を持つ
2. **監査要件**: 承認時点での組織情報を保持
3. **実用性**: 承認後の変更は通常発生しない
4. **業界標準**: 多くの業界で採用されているパターン

### 🎯 **実装のポイント**

1. **確定タイミング**: 承認完了時
2. **更新制御**: 確定後の見積は読み取り専用
3. **整合性チェック**: スナップショット作成時の検証
4. **監査ログ**: スナップショット作成の記録

### 📊 **業界別の適用**

| 業界 | 推奨タイミング | 理由 |
|------|----------------|------|
| **建設業** | 受注確定時 | 契約締結の重要性 |
| **製造業** | 承認時 | 技術仕様の確定 |
| **サービス業** | 顧客承認時 | 顧客合意の記録 |

**結論**: 承認時スナップショットは、監査要件と実用性のバランスが取れた最適なアプローチです。業界の特性に応じて微調整することで、効果的な監査対応システムを構築できます。

---

**作成日**: 2025年1月27日  
**分析者**: システム開発チーム  
**承認者**: 監査・コンプライアンスチーム
