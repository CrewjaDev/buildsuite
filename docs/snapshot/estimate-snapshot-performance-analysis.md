# 見積スナップショット機能 パフォーマンス影響分析

## 概要

見積データのスナップショット機能追加によるデータ量とアクセススピードへの影響を詳細に分析した結果をまとめます。

## 現在の状況分析

### 1. 既存データベース状況

#### **テーブルサイズ**
- **見積件数**: 13件（開発環境）
- **テーブルサイズ**: 176 kB
- **1件あたり平均サイズ**: 約13.5 kB

#### **既存カラム数**
- **総カラム数**: 43カラム
- **主要データ型**:
  - UUID: 1カラム
  - BIGINT: 8カラム
  - VARCHAR: 6カラム
  - TEXT: 4カラム
  - NUMERIC: 12カラム
  - DATE/TIMESTAMP: 6カラム

## スナップショット機能追加による影響

### 1. データ量への影響

#### **追加カラムのサイズ分析**

| カラム名 | データ型 | サイズ | 説明 |
|----------|----------|--------|------|
| `created_by_department_id` | BIGINT | 8 bytes | 部署ID（外部キー） |
| `created_by_position_code` | VARCHAR(50) | 最大50 bytes | 職位コード |
| `created_by_system_level` | VARCHAR(50) | 最大50 bytes | システム権限レベル |
| `created_by_role` | VARCHAR(50) | 最大50 bytes | 役割名 |
| `created_by_snapshot` | JSONB | 可変 | ユーザー情報スナップショット |

#### **JSONBスナップショットのサイズ見積もり**

```json
// 典型的なスナップショットサイズ
{
  "user": { /* 約200 bytes */ },
  "employee": { /* 約300 bytes */ },
  "position": { /* 約150 bytes */ },
  "department": { /* 約100 bytes */ },
  "roles": [ /* 約400 bytes (2役割の場合) */ ],
  "snapshot_created_at": "2025-01-27T14:30:00Z" /* 約30 bytes */
}
// 合計: 約1,180 bytes (1.2 kB)
```

#### **データ量増加の計算**

```
現在の1件あたりサイズ: 13.5 kB
追加カラムサイズ: 約1.2 kB
増加率: 約8.9%

10,000件の場合:
- 現在: 135 MB
- 追加後: 147 MB
- 増加量: 12 MB

100,000件の場合:
- 現在: 1.35 GB
- 追加後: 1.47 GB
- 増加量: 120 MB
```

### 2. インデックスサイズへの影響

#### **追加インデックスのサイズ見積もり**

| インデックス名 | 対象カラム | 推定サイズ（10万件） |
|----------------|------------|---------------------|
| `idx_estimates_created_by_dept` | created_by_department_id | 2.3 MB |
| `idx_estimates_created_by_position` | created_by_position_code | 2.3 MB |
| `idx_estimates_created_by_system_level` | created_by_system_level | 2.3 MB |
| `idx_estimates_created_by_role` | created_by_role | 2.3 MB |
| `idx_estimates_created_by_dept_position` | 複合 | 4.6 MB |
| `idx_estimates_created_by_dept_role` | 複合 | 4.6 MB |
| `idx_estimates_created_by_position_role` | 複合 | 4.6 MB |
| `idx_estimates_created_by_snapshot` | JSONB (GIN) | 15-30 MB |

**合計インデックス増加量**: 約38-53 MB（10万件の場合）

### 3. アクセススピードへの影響

#### **読み取りパフォーマンス**

##### **✅ 改善されるクエリ**
```sql
-- 部署別統計（インデックス活用）
SELECT created_by_department_id, COUNT(*) 
FROM estimates 
WHERE created_by_department_id = 1;
-- 実行時間: 数ミリ秒（インデックス使用）
```

##### **⚠️ 影響を受けるクエリ**
```sql
-- 全件スキャンが必要なクエリ
SELECT * FROM estimates;
-- 実行時間: 若干増加（8.9%のデータ量増加）
```

##### **🔍 JSONB検索のパフォーマンス**
```sql
-- JSONB検索（GINインデックス使用）
SELECT * FROM estimates 
WHERE created_by_snapshot->'employee'->>'name' ILIKE '%田中%';
-- 実行時間: 数ミリ秒（GINインデックス使用）
```

#### **書き込みパフォーマンス**

##### **見積作成時の影響**
```php
// スナップショット作成処理
$snapshotData = $this->createUserSnapshot($user);
// 追加処理時間: 約5-10ms

// データベース書き込み
$estimate = Estimate::create($data);
// 追加書き込み時間: 約2-5ms
```

**総合的な書き込み時間増加**: 約7-15ms（約10-20%増加）

### 4. メモリ使用量への影響

#### **アプリケーションメモリ**
- **モデル読み込み時**: 1件あたり約1.2kB増加
- **一覧表示（100件）**: 約120kB増加
- **JSONB解析**: 追加のメモリ使用量は最小限

#### **データベースメモリ**
- **バッファプール**: インデックス分の追加メモリ必要
- **クエリキャッシュ**: JSONB検索結果のキャッシュ効率向上

## パフォーマンス最適化戦略

### 1. インデックス最適化

#### **段階的インデックス作成**
```sql
-- Phase 1: 最重要インデックス
CREATE INDEX CONCURRENTLY idx_estimates_created_by_dept 
ON estimates(created_by_department_id);

-- Phase 2: 頻出検索用インデックス
CREATE INDEX CONCURRENTLY idx_estimates_created_by_role 
ON estimates(created_by_role);

-- Phase 3: 複合インデックス
CREATE INDEX CONCURRENTLY idx_estimates_dept_role_created_at 
ON estimates(created_by_department_id, created_by_role, created_at);
```

#### **不要インデックスの監視**
```sql
-- インデックス使用状況の監視
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'estimates'
ORDER BY idx_scan DESC;
```

### 2. クエリ最適化

#### **効率的な統計クエリ**
```sql
-- パフォーマンス最適化版
WITH dept_stats AS (
    SELECT 
        created_by_department_id,
        COUNT(*) as count,
        SUM(total_amount) as total
    FROM estimates
    WHERE deleted_at IS NULL
    GROUP BY created_by_department_id
)
SELECT d.name, ds.count, ds.total
FROM dept_stats ds
JOIN departments d ON ds.created_by_department_id = d.id;
```

#### **JSONB検索の最適化**
```sql
-- 効率的なJSONB検索
SELECT id, estimate_number, project_name
FROM estimates
WHERE created_by_snapshot @> '{"employee": {"name": "田中太郎"}}';
-- @> 演算子はGINインデックスを効率的に使用
```

### 3. データアーカイブ戦略

#### **古いデータのアーカイブ**
```sql
-- 5年以上前のデータをアーカイブ
CREATE TABLE estimates_archive (LIKE estimates INCLUDING ALL);

INSERT INTO estimates_archive 
SELECT * FROM estimates 
WHERE created_at < NOW() - INTERVAL '5 years';

DELETE FROM estimates 
WHERE created_at < NOW() - INTERVAL '5 years';
```

#### **スナップショット圧縮**
```php
// 古いスナップショットの圧縮
public function compressOldSnapshots()
{
    $oldEstimates = Estimate::where('created_at', '<', now()->subYears(2))
        ->whereNotNull('created_by_snapshot')
        ->get();
        
    foreach ($oldEstimates as $estimate) {
        $snapshot = $estimate->created_by_snapshot;
        
        // 不要な詳細情報を削除
        unset($snapshot['user']['created_at']);
        unset($snapshot['employee']['email']);
        
        $estimate->update(['created_by_snapshot' => $snapshot]);
    }
}
```

## 監視・メトリクス

### 1. パフォーマンス監視

#### **クエリ実行時間の監視**
```sql
-- スロークエリの監視
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements 
WHERE query LIKE '%estimates%'
ORDER BY mean_time DESC
LIMIT 10;
```

#### **インデックス使用率の監視**
```sql
-- インデックス効率の監視
SELECT 
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_scan = 0 THEN '未使用'
        WHEN idx_tup_fetch::float / idx_tup_read < 0.1 THEN '効率悪'
        ELSE '効率良'
    END as efficiency
FROM pg_stat_user_indexes 
WHERE tablename = 'estimates';
```

### 2. アラート設定

#### **パフォーマンスアラート**
```php
// スロークエリアラート
class PerformanceMonitor
{
    public function checkSlowQueries()
    {
        $slowQueries = DB::select("
            SELECT query, mean_time 
            FROM pg_stat_statements 
            WHERE query LIKE '%estimates%' 
            AND mean_time > 1000
        ");
        
        if (count($slowQueries) > 0) {
            $this->sendAlert('スロークエリ検出', $slowQueries);
        }
    }
    
    public function checkIndexUsage()
    {
        $unusedIndexes = DB::select("
            SELECT indexname 
            FROM pg_stat_user_indexes 
            WHERE tablename = 'estimates' 
            AND idx_scan = 0
        ");
        
        if (count($unusedIndexes) > 0) {
            $this->sendAlert('未使用インデックス検出', $unusedIndexes);
        }
    }
}
```

## 実装時の推奨事項

### 1. 段階的実装

#### **Phase 1: 基盤整備**
- [ ] カラム追加（CONCURRENTLY使用）
- [ ] 基本インデックス作成
- [ ] スナップショット作成機能

#### **Phase 2: 最適化**
- [ ] 複合インデックス作成
- [ ] クエリ最適化
- [ ] パフォーマンス監視

#### **Phase 3: 運用最適化**
- [ ] データアーカイブ
- [ ] 不要インデックス削除
- [ ] 継続的監視

### 2. 運用ガイドライン

#### **定期メンテナンス**
- **週次**: インデックス使用状況確認
- **月次**: スロークエリ分析
- **四半期**: 不要インデックス削除

#### **容量計画**
- **1年後**: データ量1.5倍を想定
- **3年後**: アーカイブ戦略の実施
- **5年後**: データ圧縮の検討

## 結論

### 📊 **影響の総合評価**

| 項目 | 影響度 | 詳細 |
|------|--------|------|
| **データ量** | 🟡 軽微 | 8.9%増加（許容範囲） |
| **読み取り速度** | 🟢 改善 | インデックス活用で高速化 |
| **書き込み速度** | 🟡 軽微 | 10-20%増加（許容範囲） |
| **メモリ使用量** | 🟡 軽微 | インデックス分の追加 |
| **監査機能** | 🟢 大幅改善 | 完全な履歴追跡可能 |

### ✅ **推奨事項**

1. **実装推奨**: パフォーマンス影響は許容範囲内
2. **段階的導入**: リスクを最小化する段階的実装
3. **継続監視**: パフォーマンスメトリクスの継続監視
4. **最適化**: 運用開始後の継続的最適化

### 🎯 **期待される効果**

- **監査対応**: 完全な作成者履歴の保持
- **分析機能**: 詳細な統計・レポート機能
- **セキュリティ**: 役割ベースのアクセス制御強化
- **将来対応**: 組織変更時の影響分析

**結論**: スナップショット機能の追加は、パフォーマンスへの影響を最小限に抑えながら、大幅な機能向上をもたらす価値のある実装です。

---

**作成日**: 2025年1月27日  
**分析者**: システム開発チーム  
**承認者**: パフォーマンス監視チーム
