# 見積データ スナップショット管理設計書

## 概要

見積データの作成時スナップショット機能について、監査対応とデータ管理の観点から設計した仕様書です。
作成者の組織情報を時点で固定保存することで、将来の監査要件や組織変更時のデータ整合性を確保します。

## 設計思想

### 1. 基本方針

- **時点固定**: 作成時の組織情報を永続的に保存
- **監査対応**: 将来の監査要件に柔軟に対応
- **パフォーマンス**: 頻出フィルタ用の列とJSONBの併用
- **データ整合性**: 外部キー制約による品質保証

### 2. アーキテクチャパターン

```
┌─────────────────────────────────────────────────────────────┐
│                    見積データテーブル                        │
├─────────────────────────────────────────────────────────────┤
│ 基本情報 + 業務データ + 作成時スナップショット                │
│                                                             │
│ ┌─────────────────┐  ┌─────────────────────────────────────┐ │
│ │ 頻出フィルタ用列 │  │        JSONBスナップショット        │ │
│ │                 │  │                                     │ │
│ │ • department_id │  │ • 完全なユーザー情報                 │ │
│ │ • position_code │  │ • 組織情報                          │ │
│ │ • system_level  │  │ • 作成時点の全データ                 │ │
│ └─────────────────┘  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## データベース設計

### 1. テーブル構造

#### **追加カラム定義**

```sql
-- 見積基本情報テーブル (estimates) への追加カラム
ALTER TABLE estimates ADD COLUMN created_by_department_id BIGINT COMMENT '作成時の部署ID';
ALTER TABLE estimates ADD COLUMN created_by_position_code VARCHAR(50) COMMENT '作成時の職位コード';
ALTER TABLE estimates ADD COLUMN created_by_system_level VARCHAR(50) COMMENT '作成時のシステム権限レベル';
ALTER TABLE estimates ADD COLUMN created_by_role VARCHAR(50) COMMENT '作成時の役割';
ALTER TABLE estimates ADD COLUMN created_by_snapshot JSONB COMMENT '作成時のユーザー情報スナップショット';
```

#### **インデックス設計**

```sql
-- 頻出フィルタ用の単一インデックス
CREATE INDEX idx_estimates_created_by_dept ON estimates(created_by_department_id);
CREATE INDEX idx_estimates_created_by_position ON estimates(created_by_position_code);
CREATE INDEX idx_estimates_created_by_system_level ON estimates(created_by_system_level);
CREATE INDEX idx_estimates_created_by_role ON estimates(created_by_role);

-- 複合インデックス（よく使われる組み合わせ）
CREATE INDEX idx_estimates_created_by_dept_position ON estimates(created_by_department_id, created_by_position_code);
CREATE INDEX idx_estimates_created_by_dept_level ON estimates(created_by_department_id, created_by_system_level);
CREATE INDEX idx_estimates_created_by_dept_role ON estimates(created_by_department_id, created_by_role);
CREATE INDEX idx_estimates_created_by_position_role ON estimates(created_by_position_code, created_by_role);

-- JSONB用のGINインデックス（柔軟な検索用）
CREATE INDEX idx_estimates_created_by_snapshot ON estimates USING GIN (created_by_snapshot);
```

#### **外部キー制約**

```sql
-- 部署IDの外部キー制約
ALTER TABLE estimates 
ADD CONSTRAINT fk_estimates_created_by_department_id 
FOREIGN KEY (created_by_department_id) REFERENCES departments(id) ON DELETE SET NULL;
```

### 2. JSONBスナップショット構造

#### **スナップショットデータ構造**

```json
{
  "user": {
    "id": 123,
    "login_id": "user001",
    "system_level": "org_manager",
    "is_admin": false,
    "is_active": true,
    "created_at": "2025-01-15T10:30:00Z"
  },
  "employee": {
    "id": 456,
    "employee_id": "EMP001",
    "name": "田中太郎",
    "name_kana": "タナカタロウ",
    "email": "tanaka@example.com",
    "job_title": "営業部長",
    "hire_date": "2020-04-01",
    "department_id": 1,
    "position_id": 3,
    "is_active": true
  },
  "position": {
    "id": 3,
    "code": "section_manager",
    "name": "部長",
    "display_name": "営業部長",
    "level": 5,
    "sort_order": 3
  },
  "department": {
    "id": 1,
    "name": "営業部",
    "code": "SALES",
    "level": 1,
    "parent_id": null
  },
  "roles": [
    {
      "id": 1,
      "name": "estimate_manager",
      "display_name": "見積管理者",
      "description": "見積の作成・編集・承認権限"
    },
    {
      "id": 2,
      "name": "department_manager",
      "display_name": "部署管理者",
      "description": "部署内データの管理権限"
    }
  ],
  "snapshot_created_at": "2025-01-27T14:30:00Z"
}
```

## アプリケーション実装

### 1. モデル層

#### **Estimateモデルの更新**

```php
<?php

namespace App\Models;

class Estimate extends Model
{
    protected $fillable = [
        // ... 既存のフィールド ...
        
        // 作成時スナップショット
        'created_by_department_id',
        'created_by_position_code',
        'created_by_system_level',
        'created_by_role',
        'created_by_snapshot',
    ];

    protected $casts = [
        // ... 既存のキャスト ...
        
        // 作成時スナップショット
        'created_by_snapshot' => 'array',
    ];

    /**
     * 作成時の部署情報を取得
     */
    public function createdByDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'created_by_department_id');
    }

    /**
     * 作成時の職位情報を取得
     */
    public function getCreatedByPositionAttribute()
    {
        return Position::where('code', $this->created_by_position_code)->first();
    }

    /**
     * 作成時のシステム権限レベル情報を取得
     */
    public function getCreatedBySystemLevelAttribute()
    {
        return SystemLevel::where('code', $this->created_by_system_level)->first();
    }

    /**
     * スナップショットから作成者名を取得
     */
    public function getCreatedByNameAttribute(): ?string
    {
        return $this->created_by_snapshot['employee']['name'] ?? null;
    }

    /**
     * スナップショットから作成時の部署名を取得
     */
    public function getCreatedByDepartmentNameAttribute(): ?string
    {
        return $this->created_by_snapshot['department']['name'] ?? null;
    }

    /**
     * スナップショットから作成時の職位名を取得
     */
    public function getCreatedByPositionNameAttribute(): ?string
    {
        return $this->created_by_snapshot['position']['display_name'] ?? null;
    }
}
```

### 2. コントローラー層

#### **EstimateControllerの更新**

```php
<?php

namespace App\Http\Controllers;

class EstimateController extends Controller
{
    /**
     * 見積作成処理
     */
    public function store(Request $request)
    {
        // ... 既存のバリデーション処理 ...

        DB::beginTransaction();
        try {
            $data = $request->all();
            $user = auth()->user();
            
            // 基本情報の設定
            $data['created_by'] = $user->id;
            $data['responsible_user_id'] = $data['responsible_user_id'] ?? $user->id;
            $data['visibility'] = 'private';
            $data['department_id'] = $user->employee?->department_id;
            
            // 作成時スナップショット情報の保存
            $data = array_merge($data, $this->createUserSnapshot($user));
            
            // ... 既存の処理 ...
            
            $estimate = Estimate::create($data);
            
            DB::commit();
            return response()->json($estimate, 201);
            
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => '見積の作成に失敗しました'], 500);
        }
    }

    /**
     * 作成時のユーザー情報スナップショットを作成
     */
    private function createUserSnapshot($user): array
    {
        $employee = $user->employee;
        $position = $employee?->position;
        $department = $employee?->department;
        
        // 頻出フィルタ用の列データ
        $snapshotData = [
            'created_by_department_id' => $employee?->department_id,
            'created_by_position_code' => $position?->code,
            'created_by_system_level' => $user->system_level,
            'created_by_role' => $this->getUserPrimaryRole($user),
        ];
        
        // 監査・特殊条件向けのJSONBスナップショット
        $snapshotData['created_by_snapshot'] = [
            'user' => [
                'id' => $user->id,
                'login_id' => $user->login_id,
                'system_level' => $user->system_level,
                'is_admin' => $user->is_admin,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at?->toISOString(),
            ],
            'employee' => $employee ? [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'name' => $employee->name,
                'name_kana' => $employee->name_kana,
                'email' => $employee->email,
                'job_title' => $employee->job_title,
                'hire_date' => $employee->hire_date?->toDateString(),
                'department_id' => $employee->department_id,
                'position_id' => $employee->position_id,
                'is_active' => $employee->is_active,
            ] : null,
            'position' => $position ? [
                'id' => $position->id,
                'code' => $position->code,
                'name' => $position->name,
                'display_name' => $position->display_name,
                'level' => $position->level,
                'sort_order' => $position->sort_order,
            ] : null,
            'department' => $department ? [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'level' => $department->level,
                'parent_id' => $department->parent_id,
            ] : null,
            'roles' => $this->getUserRoles($user),
            'snapshot_created_at' => now()->toISOString(),
        ];
        
        return $snapshotData;
    }

    /**
     * ユーザーの主要役割を取得
     */
    private function getUserPrimaryRole($user): ?string
    {
        $primaryRole = $user->roles()
            ->wherePivot('is_active', true)
            ->orderBy('roles.level', 'desc')
            ->first();
            
        return $primaryRole?->name;
    }

    /**
     * ユーザーの全役割情報を取得
     */
    private function getUserRoles($user): array
    {
        return $user->roles()
            ->wherePivot('is_active', true)
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'description' => $role->description,
                    'level' => $role->level,
                ];
            })
            ->toArray();
    }
}
```

### 3. サービス層

#### **スナップショット管理サービス**

```php
<?php

namespace App\Services;

class SnapshotService
{
    /**
     * ユーザー情報のスナップショットを作成
     */
    public function createUserSnapshot(User $user): array
    {
        $employee = $user->employee;
        $position = $employee?->position;
        $department = $employee?->department;
        
        return [
            'user' => $this->getUserData($user),
            'employee' => $employee ? $this->getEmployeeData($employee) : null,
            'position' => $position ? $this->getPositionData($position) : null,
            'department' => $department ? $this->getDepartmentData($department) : null,
            'roles' => $this->getUserRolesData($user),
            'snapshot_created_at' => now()->toISOString(),
        ];
    }

    /**
     * スナップショットから検索条件を生成
     */
    public function buildSearchConditions(array $snapshot): array
    {
        return [
            'created_by_department_id' => $snapshot['employee']['department_id'] ?? null,
            'created_by_position_code' => $snapshot['position']['code'] ?? null,
            'created_by_system_level' => $snapshot['user']['system_level'] ?? null,
            'created_by_role' => $this->getPrimaryRoleFromSnapshot($snapshot),
        ];
    }

    /**
     * スナップショットの整合性チェック
     */
    public function validateSnapshot(array $snapshot): bool
    {
        $required = ['user', 'snapshot_created_at'];
        
        foreach ($required as $field) {
            if (!isset($snapshot[$field])) {
                return false;
            }
        }
        
        return true;
    }

    private function getUserData(User $user): array
    {
        return [
            'id' => $user->id,
            'login_id' => $user->login_id,
            'system_level' => $user->system_level,
            'is_admin' => $user->is_admin,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }

    private function getEmployeeData(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'employee_id' => $employee->employee_id,
            'name' => $employee->name,
            'name_kana' => $employee->name_kana,
            'email' => $employee->email,
            'job_title' => $employee->job_title,
            'hire_date' => $employee->hire_date?->toDateString(),
            'department_id' => $employee->department_id,
            'position_id' => $employee->position_id,
            'is_active' => $employee->is_active,
        ];
    }

    private function getPositionData(Position $position): array
    {
        return [
            'id' => $position->id,
            'code' => $position->code,
            'name' => $position->name,
            'display_name' => $position->display_name,
            'level' => $position->level,
            'sort_order' => $position->sort_order,
        ];
    }

    private function getDepartmentData(Department $department): array
    {
        return [
            'id' => $department->id,
            'name' => $department->name,
            'code' => $department->code,
            'level' => $department->level,
            'parent_id' => $department->parent_id,
        ];
    }

    private function getUserRolesData(User $user): array
    {
        return $user->roles()
            ->wherePivot('is_active', true)
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'description' => $role->description,
                    'level' => $role->level,
                ];
            })
            ->toArray();
    }

    private function getPrimaryRoleFromSnapshot(array $snapshot): ?string
    {
        if (empty($snapshot['roles'])) {
            return null;
        }

        // レベルが最も高い役割を主要役割とする
        $primaryRole = collect($snapshot['roles'])
            ->sortByDesc('level')
            ->first();

        return $primaryRole['name'] ?? null;
    }
}
```

## クエリパターン

### 1. 頻出フィルタ用クエリ

#### **部署別の見積一覧**

```sql
-- 部署別の見積件数
SELECT 
    d.name as department_name,
    COUNT(*) as estimate_count,
    SUM(e.total_amount) as total_amount
FROM estimates e
LEFT JOIN departments d ON e.created_by_department_id = d.id
WHERE e.deleted_at IS NULL
GROUP BY d.id, d.name
ORDER BY estimate_count DESC;
```

#### **職位別の統計**

```sql
-- 職位別の見積統計
SELECT 
    created_by_position_code,
    COUNT(*) as estimate_count,
    AVG(total_amount) as avg_amount,
    MAX(total_amount) as max_amount,
    MIN(total_amount) as min_amount
FROM estimates
WHERE deleted_at IS NULL
GROUP BY created_by_position_code
ORDER BY estimate_count DESC;
```

#### **権限レベル別の分析**

```sql
-- システム権限レベル別の分析
SELECT 
    created_by_system_level,
    COUNT(*) as estimate_count,
    AVG(total_amount) as avg_amount
FROM estimates
WHERE deleted_at IS NULL
GROUP BY created_by_system_level
ORDER BY estimate_count DESC;
```

#### **役割別の統計**

```sql
-- 役割別の見積統計
SELECT 
    created_by_role,
    COUNT(*) as estimate_count,
    AVG(total_amount) as avg_amount,
    MAX(total_amount) as max_amount,
    MIN(total_amount) as min_amount
FROM estimates
WHERE deleted_at IS NULL
GROUP BY created_by_role
ORDER BY estimate_count DESC;
```

### 2. JSONB活用クエリ

#### **作成者名での検索**

```sql
-- 作成者名での検索
SELECT 
    id,
    estimate_number,
    project_name,
    total_amount,
    created_by_snapshot->'employee'->>'name' as creator_name,
    created_by_snapshot->'department'->>'name' as department_name
FROM estimates
WHERE created_by_snapshot->'employee'->>'name' ILIKE '%田中%'
AND deleted_at IS NULL;
```

#### **特定の部署・職位の組み合わせ**

```sql
-- 特定の部署・職位の組み合わせで作成された見積
SELECT 
    id,
    estimate_number,
    project_name,
    created_by_snapshot->'employee'->>'name' as creator_name,
    created_by_snapshot->'position'->>'display_name' as position_name
FROM estimates
WHERE created_by_snapshot->'department'->>'name' = '営業部'
AND created_by_snapshot->'position'->>'code' = 'section_manager'
AND deleted_at IS NULL;
```

#### **作成時期と組織情報の組み合わせ**

```sql
-- 特定期間に特定の部署で作成された見積
SELECT 
    id,
    estimate_number,
    project_name,
    created_at,
    created_by_snapshot->'employee'->>'name' as creator_name
FROM estimates
WHERE created_at >= '2025-01-01'
AND created_at < '2025-02-01'
AND created_by_snapshot->'department'->>'code' = 'SALES'
AND deleted_at IS NULL
ORDER BY created_at DESC;
```

#### **役割別の詳細検索**

```sql
-- 特定の役割を持つユーザーが作成した見積
SELECT 
    id,
    estimate_number,
    project_name,
    created_by_snapshot->'employee'->>'name' as creator_name,
    created_by_snapshot->'roles' as roles
FROM estimates
WHERE created_by_snapshot->'roles' @> '[{"name": "estimate_manager"}]'
AND deleted_at IS NULL
ORDER BY created_at DESC;
```

#### **複数役割の組み合わせ検索**

```sql
-- 部署管理者かつ見積管理者の役割を持つユーザーが作成した見積
SELECT 
    id,
    estimate_number,
    project_name,
    created_by_snapshot->'employee'->>'name' as creator_name,
    created_by_snapshot->'department'->>'name' as department_name
FROM estimates
WHERE created_by_snapshot->'roles' @> '[{"name": "department_manager"}]'
AND created_by_snapshot->'roles' @> '[{"name": "estimate_manager"}]'
AND deleted_at IS NULL
ORDER BY created_at DESC;
```

## 監査・レポート機能

### 1. 監査レポート

#### **作成者別の見積履歴**

```php
<?php

namespace App\Services;

class AuditService
{
    /**
     * 作成者別の見積履歴レポート
     */
    public function getCreatorHistoryReport(array $filters = []): array
    {
        $query = Estimate::select([
            'id',
            'estimate_number',
            'project_name',
            'total_amount',
            'created_at',
            'created_by_snapshot'
        ])
        ->whereNotNull('created_by_snapshot')
        ->orderBy('created_at', 'desc');

        // フィルタ適用
        if (isset($filters['creator_name'])) {
            $query->whereRaw("created_by_snapshot->'employee'->>'name' ILIKE ?", 
                ['%' . $filters['creator_name'] . '%']);
        }

        if (isset($filters['department_code'])) {
            $query->whereRaw("created_by_snapshot->'department'->>'code' = ?", 
                [$filters['department_code']]);
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        return $query->get()->map(function ($estimate) {
            $snapshot = $estimate->created_by_snapshot;
            return [
                'id' => $estimate->id,
                'estimate_number' => $estimate->estimate_number,
                'project_name' => $estimate->project_name,
                'total_amount' => $estimate->total_amount,
                'created_at' => $estimate->created_at,
                'creator' => [
                    'name' => $snapshot['employee']['name'] ?? null,
                    'department' => $snapshot['department']['name'] ?? null,
                    'position' => $snapshot['position']['display_name'] ?? null,
                    'system_level' => $snapshot['user']['system_level'] ?? null,
                ]
            ];
        })->toArray();
    }

    /**
     * 組織変更の影響分析
     */
    public function analyzeOrganizationChangeImpact(int $departmentId): array
    {
        // 変更前の部署で作成された見積の数
        $estimatesCount = Estimate::where('created_by_department_id', $departmentId)
            ->where('deleted_at', null)
            ->count();

        // 現在の部署メンバー数
        $currentMembersCount = Employee::where('department_id', $departmentId)
            ->where('is_active', true)
            ->count();

        return [
            'department_id' => $departmentId,
            'estimates_created_in_department' => $estimatesCount,
            'current_members_count' => $currentMembersCount,
            'impact_level' => $this->calculateImpactLevel($estimatesCount, $currentMembersCount),
        ];
    }

    private function calculateImpactLevel(int $estimatesCount, int $membersCount): string
    {
        if ($estimatesCount === 0) return 'none';
        if ($estimatesCount < 10) return 'low';
        if ($estimatesCount < 50) return 'medium';
        return 'high';
    }
}
```

### 2. データ移行・整合性チェック

#### **スナップショット整合性チェック**

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Estimate;

class ValidateSnapshotsCommand extends Command
{
    protected $signature = 'estimates:validate-snapshots';
    protected $description = '見積データのスナップショット整合性をチェック';

    public function handle()
    {
        $this->info('スナップショット整合性チェックを開始...');

        $estimates = Estimate::whereNotNull('created_by_snapshot')->get();
        $errors = [];

        foreach ($estimates as $estimate) {
            $snapshot = $estimate->created_by_snapshot;
            
            // 必須フィールドのチェック
            if (!isset($snapshot['user']['id'])) {
                $errors[] = "Estimate {$estimate->id}: user.id が存在しません";
            }

            if (!isset($snapshot['snapshot_created_at'])) {
                $errors[] = "Estimate {$estimate->id}: snapshot_created_at が存在しません";
            }

            // 列データとの整合性チェック
            if ($estimate->created_by_department_id !== ($snapshot['employee']['department_id'] ?? null)) {
                $errors[] = "Estimate {$estimate->id}: department_id の整合性エラー";
            }

            if ($estimate->created_by_position_code !== ($snapshot['position']['code'] ?? null)) {
                $errors[] = "Estimate {$estimate->id}: position_code の整合性エラー";
            }

            if ($estimate->created_by_system_level !== ($snapshot['user']['system_level'] ?? null)) {
                $errors[] = "Estimate {$estimate->id}: system_level の整合性エラー";
            }

            // 役割の整合性チェック
            $primaryRole = $this->getPrimaryRoleFromSnapshot($snapshot);
            if ($estimate->created_by_role !== $primaryRole) {
                $errors[] = "Estimate {$estimate->id}: role の整合性エラー";
            }
        }

        if (empty($errors)) {
            $this->info('✅ すべてのスナップショットが正常です');
        } else {
            $this->error('❌ 以下のエラーが見つかりました:');
            foreach ($errors as $error) {
                $this->error("  - {$error}");
            }
        }

        return empty($errors) ? 0 : 1;
    }

    private function getPrimaryRoleFromSnapshot(array $snapshot): ?string
    {
        if (empty($snapshot['roles'])) {
            return null;
        }

        // レベルが最も高い役割を主要役割とする
        $primaryRole = collect($snapshot['roles'])
            ->sortByDesc('level')
            ->first();

        return $primaryRole['name'] ?? null;
    }
}
```

## パフォーマンス考慮

### 1. インデックス戦略

#### **頻出クエリパターンに基づくインデックス**

```sql
-- 部署別統計用
CREATE INDEX idx_estimates_dept_created_at ON estimates(created_by_department_id, created_at);

-- 職位別統計用
CREATE INDEX idx_estimates_position_created_at ON estimates(created_by_position_code, created_at);

-- 権限レベル別統計用
CREATE INDEX idx_estimates_system_level_created_at ON estimates(created_by_system_level, created_at);

-- 役割別統計用
CREATE INDEX idx_estimates_role_created_at ON estimates(created_by_role, created_at);

-- 複合検索用
CREATE INDEX idx_estimates_dept_position_created_at ON estimates(created_by_department_id, created_by_position_code, created_at);
CREATE INDEX idx_estimates_dept_role_created_at ON estimates(created_by_department_id, created_by_role, created_at);
CREATE INDEX idx_estimates_position_role_created_at ON estimates(created_by_position_code, created_by_role, created_at);
```

### 2. クエリ最適化

#### **効率的な統計クエリ**

```sql
-- パフォーマンスを考慮した統計クエリ
WITH department_stats AS (
    SELECT 
        created_by_department_id,
        COUNT(*) as estimate_count,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as avg_amount
    FROM estimates
    WHERE deleted_at IS NULL
    GROUP BY created_by_department_id
)
SELECT 
    d.name as department_name,
    ds.estimate_count,
    ds.total_amount,
    ds.avg_amount
FROM department_stats ds
LEFT JOIN departments d ON ds.created_by_department_id = d.id
ORDER BY ds.estimate_count DESC;
```

## 運用・保守

### 1. データクリーンアップ

#### **古いスナップショットの整理**

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Estimate;

class CleanupSnapshotsCommand extends Command
{
    protected $signature = 'estimates:cleanup-snapshots {--days=365}';
    protected $description = '古いスナップショットデータのクリーンアップ';

    public function handle()
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $this->info("{$days}日前より古いスナップショットをクリーンアップします...");

        // 削除された見積のスナップショットをクリーンアップ
        $deletedCount = Estimate::onlyTrashed()
            ->where('deleted_at', '<', $cutoffDate)
            ->update(['created_by_snapshot' => null]);

        $this->info("削除された見積のスナップショット: {$deletedCount}件をクリーンアップしました");

        return 0;
    }
}
```

### 2. 監視・アラート

#### **スナップショット作成失敗の監視**

```php
<?php

namespace App\Services;

class SnapshotMonitoringService
{
    /**
     * スナップショット作成失敗の監視
     */
    public function monitorSnapshotCreation(): array
    {
        // 過去24時間でスナップショットが作成されていない見積をチェック
        $recentEstimates = Estimate::where('created_at', '>=', now()->subDay())
            ->whereNull('created_by_snapshot')
            ->get();

        $alerts = [];
        
        if ($recentEstimates->count() > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "スナップショットが作成されていない見積が {$recentEstimates->count()} 件あります",
                'estimates' => $recentEstimates->pluck('id')->toArray(),
            ];
        }

        return $alerts;
    }
}
```

## セキュリティ考慮

### 1. データ保護

#### **機密情報のマスキング**

```php
<?php

namespace App\Services;

class SnapshotSecurityService
{
    /**
     * スナップショットから機密情報をマスキング
     */
    public function maskSensitiveData(array $snapshot): array
    {
        $masked = $snapshot;

        // メールアドレスのマスキング
        if (isset($masked['employee']['email'])) {
            $masked['employee']['email'] = $this->maskEmail($masked['employee']['email']);
        }

        // 電話番号のマスキング
        if (isset($masked['employee']['phone'])) {
            $masked['employee']['phone'] = $this->maskPhone($masked['employee']['phone']);
        }

        return $masked;
    }

    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) === 2) {
            $username = $parts[0];
            $domain = $parts[1];
            $maskedUsername = substr($username, 0, 2) . str_repeat('*', max(0, strlen($username) - 2));
            return $maskedUsername . '@' . $domain;
        }
        return $email;
    }

    private function maskPhone(string $phone): string
    {
        if (strlen($phone) > 4) {
            return substr($phone, 0, 3) . str_repeat('*', strlen($phone) - 6) . substr($phone, -3);
        }
        return $phone;
    }
}
```

## 実装計画

### Phase 1: 基盤整備（1週間）
- [ ] データベースマイグレーション作成
- [ ] モデルの更新
- [ ] 基本的なスナップショット作成機能

### Phase 2: コア機能実装（2週間）
- [ ] コントローラーの更新
- [ ] スナップショット管理サービス
- [ ] 基本的なクエリ機能

### Phase 3: 監査・レポート機能（2週間）
- [ ] 監査レポート機能
- [ ] データ整合性チェック
- [ ] パフォーマンス最適化

### Phase 4: 運用・保守機能（1週間）
- [ ] データクリーンアップ機能
- [ ] 監視・アラート機能
- [ ] セキュリティ機能

## 運用ガイドライン

### 1. スナップショット作成の原則
- 見積作成時に必ずスナップショットを作成
- スナップショット作成失敗時は見積作成を停止
- 定期的なスナップショット整合性チェック

### 2. データ管理
- 削除された見積のスナップショットは一定期間後にクリーンアップ
- 機密情報の適切なマスキング
- 定期的なパフォーマンス監視

### 3. 監査対応
- 監査時のスナップショットデータ提供
- 組織変更時の影響分析
- 作成者履歴の追跡可能性確保

---

**作成日**: 2025年1月27日  
**バージョン**: 1.0  
**作成者**: システム開発チーム  
**承認者**: プロジェクトマネージャー
