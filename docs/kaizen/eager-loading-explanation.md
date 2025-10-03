# Eager Loading 完全解説

## 概要

Eager Loading（イーガーローディング）は、データベースのパフォーマンス最適化技術の一つで、関連するデータを事前に一括で読み込むことで、N+1クエリ問題を解決する手法です。

## N+1クエリ問題とは

### 1. 問題の発生パターン

#### **問題のあるコード例**
```php
// 見積一覧を取得（1回のクエリ）
$estimates = Estimate::all(); // SELECT * FROM estimates

foreach ($estimates as $estimate) {
    // 各見積ごとに部署情報を取得（N回のクエリ）
    $department = Department::find($estimate->department_id);
    echo $estimate->project_name . ' - ' . $department->name;
}
```

#### **実行されるクエリ**
```sql
-- 1回目のクエリ（見積一覧取得）
SELECT * FROM estimates;

-- 2回目のクエリ（1件目の見積の部署情報）
SELECT * FROM departments WHERE id = 1;

-- 3回目のクエリ（2件目の見積の部署情報）
SELECT * FROM departments WHERE id = 2;

-- 4回目のクエリ（3件目の見積の部署情報）
SELECT * FROM departments WHERE id = 1;

-- ... 100件の見積がある場合、合計101回のクエリが実行される
```

### 2. パフォーマンスへの影響

#### **クエリ数の比較**
```
見積件数: 100件
- 問題のあるコード: 101回のクエリ（1 + 100）
- Eager Loading使用: 2回のクエリ（1 + 1）
- 改善率: 98%のクエリ削減
```

#### **実行時間の比較**
```
100件の見積表示:
- 問題のあるコード: 約500ms
- Eager Loading使用: 約50ms
- 改善率: 90%の時間短縮
```

## Eager Loadingの仕組み

### 1. 基本的な仕組み

#### **Eager Loading使用例**
```php
// 見積一覧と関連する部署情報を一括取得
$estimates = Estimate::with('department')->get();

foreach ($estimates as $estimate) {
    // 追加クエリなしで部署名を取得
    echo $estimate->project_name . ' - ' . $estimate->department->name;
}
```

#### **実行されるクエリ**
```sql
-- 1回目のクエリ（見積一覧取得）
SELECT * FROM estimates;

-- 2回目のクエリ（関連する部署情報を一括取得）
SELECT * FROM departments WHERE id IN (1, 2, 3, 4, 5, ...);
```

### 2. LaravelでのEager Loading

#### **基本的な使用方法**
```php
// 単一のリレーション
$estimates = Estimate::with('department')->get();

// 複数のリレーション
$estimates = Estimate::with(['department', 'partner', 'projectType'])->get();

// ネストしたリレーション
$estimates = Estimate::with('department.manager')->get();

// 条件付きEager Loading
$estimates = Estimate::with(['department' => function ($query) {
    $query->where('is_active', true);
}])->get();
```

## 実装例とパフォーマンス比較

### 1. 見積システムでの実装例

#### **問題のあるコード（N+1問題）**
```php
class EstimateController extends Controller
{
    public function index()
    {
        // 見積一覧を取得
        $estimates = Estimate::select([
            'id', 'estimate_number', 'project_name', 
            'total_amount', 'department_id'
        ])->get();
        
        // 各見積の部署名を表示
        foreach ($estimates as $estimate) {
            $department = Department::find($estimate->department_id);
            echo $estimate->project_name . ' - ' . $department->name;
        }
        
        // 実行クエリ数: 1 + N回（Nは見積件数）
    }
}
```

#### **Eager Loading使用（最適化済み）**
```php
class EstimateController extends Controller
{
    public function index()
    {
        // 見積一覧と関連する部署情報を一括取得
        $estimates = Estimate::select([
            'id', 'estimate_number', 'project_name', 
            'total_amount', 'department_id'
        ])
        ->with(['department:id,name']) // Eager Loading
        ->get();
        
        // 各見積の部署名を表示
        foreach ($estimates as $estimate) {
            echo $estimate->project_name . ' - ' . $estimate->department->name;
        }
        
        // 実行クエリ数: 2回（見積取得 + 部署情報一括取得）
    }
}
```

### 2. パフォーマンス測定

#### **クエリ数の測定**
```php
// クエリ数の測定
DB::enableQueryLog();

// 問題のあるコード
$estimates = Estimate::all();
foreach ($estimates as $estimate) {
    $department = Department::find($estimate->department_id);
}

$queries = DB::getQueryLog();
echo "実行クエリ数: " . count($queries); // 101回

// Eager Loading使用
DB::flushQueryLog();
$estimates = Estimate::with('department')->get();
foreach ($estimates as $estimate) {
    $department = $estimate->department;
}

$queries = DB::getQueryLog();
echo "実行クエリ数: " . count($queries); // 2回
```

#### **実行時間の測定**
```php
// 実行時間の測定
$start = microtime(true);

// 問題のあるコード
$estimates = Estimate::all();
foreach ($estimates as $estimate) {
    $department = Department::find($estimate->department_id);
}

$time1 = microtime(true) - $start; // 約500ms

// Eager Loading使用
$start = microtime(true);
$estimates = Estimate::with('department')->get();
foreach ($estimates as $estimate) {
    $department = $estimate->department;
}

$time2 = microtime(true) - $start; // 約50ms

echo "改善率: " . (($time1 - $time2) / $time1 * 100) . "%"; // 90%改善
```

## 高度なEager Loading

### 1. 条件付きEager Loading

#### **基本的な条件指定**
```php
// アクティブな部署のみを取得
$estimates = Estimate::with(['department' => function ($query) {
    $query->where('is_active', true);
}])->get();

// 特定の部署のみを取得
$estimates = Estimate::with(['department' => function ($query) {
    $query->whereIn('id', [1, 2, 3]);
}])->get();
```

#### **複雑な条件指定**
```php
// 部署の管理者情報も含めて取得
$estimates = Estimate::with([
    'department' => function ($query) {
        $query->where('is_active', true)
              ->with('manager:id,name,email');
    }
])->get();
```

### 2. ネストしたEager Loading

#### **多階層のリレーション**
```php
// 見積 → 部署 → 管理者 → 役職
$estimates = Estimate::with([
    'department.manager.position',
    'partner.contactPerson'
])->get();

// 実行されるクエリ
// 1. SELECT * FROM estimates
// 2. SELECT * FROM departments WHERE id IN (...)
// 3. SELECT * FROM employees WHERE id IN (...)
// 4. SELECT * FROM positions WHERE id IN (...)
// 5. SELECT * FROM partners WHERE id IN (...)
// 6. SELECT * FROM contact_persons WHERE id IN (...)
```

### 3. 遅延Eager Loading

#### **必要時のみ読み込み**
```php
// 最初は見積のみ取得
$estimates = Estimate::all();

// 後で必要になった時にEager Loading
$estimates->load('department');

// または条件付きで読み込み
$estimates->load(['department' => function ($query) {
    $query->where('is_active', true);
}]);
```

## スナップショット機能でのEager Loading

### 1. 見積スナップショットでの活用

#### **スナップショット列でのEager Loading**
```php
// 見積一覧表示（スナップショット列使用）
$estimates = Estimate::select([
    'id', 'estimate_number', 'project_name', 'total_amount',
    'created_by_department_id', 'created_by_role'
])
->with(['createdByDepartment:id,name']) // スナップショット列の部署情報
->get();

foreach ($estimates as $estimate) {
    // 追加クエリなしで部署名を取得
    echo $estimate->project_name . ' - ' . $estimate->createdByDepartment->name;
}
```

#### **複数のスナップショット列でのEager Loading**
```php
// 複数のスナップショット列を効率的に取得
$estimates = Estimate::select([
    'id', 'estimate_number', 'project_name',
    'created_by_department_id', 'created_by_position_code', 'created_by_role'
])
->with([
    'createdByDepartment:id,name',
    'createdByPosition:id,name,display_name'
])
->get();
```

### 2. 統計・レポートでの活用

#### **部署別統計でのEager Loading**
```php
// 部署別の見積統計
$departmentStats = Estimate::select([
    'created_by_department_id',
    DB::raw('COUNT(*) as estimate_count'),
    DB::raw('SUM(total_amount) as total_amount')
])
->with(['createdByDepartment:id,name'])
->groupBy('created_by_department_id')
->get();

foreach ($departmentStats as $stat) {
    echo $stat->createdByDepartment->name . ': ' . $stat->estimate_count . '件';
}
```

## パフォーマンス最適化のベストプラクティス

### 1. 必要なフィールドのみ選択

#### **SELECT最適化との組み合わせ**
```php
// 最適化されたクエリ
$estimates = Estimate::select([
    'id', 'estimate_number', 'project_name', 'total_amount',
    'created_by_department_id'
])
->with(['createdByDepartment:id,name']) // 部署テーブルも必要最小限
->get();
```

### 2. インデックスの活用

#### **Eager Loading用のインデックス**
```sql
-- 見積テーブルの外部キーインデックス
CREATE INDEX idx_estimates_department_id ON estimates(created_by_department_id);

-- 部署テーブルの主キーインデックス（通常は自動作成）
-- CREATE INDEX idx_departments_id ON departments(id);
```

### 3. キャッシュとの組み合わせ

#### **Eager Loading + キャッシュ**
```php
// キャッシュと組み合わせたEager Loading
$estimates = Cache::remember('estimates_with_departments', 3600, function () {
    return Estimate::select([
        'id', 'estimate_number', 'project_name', 'total_amount',
        'created_by_department_id'
    ])
    ->with(['createdByDepartment:id,name'])
    ->get();
});
```

## よくある間違いと対策

### 1. 過度なEager Loading

#### **問題のあるコード**
```php
// 不要なリレーションまで読み込む
$estimates = Estimate::with([
    'department', 'partner', 'projectType', 'creator', 
    'approver', 'items', 'breakdowns'
])->get();

// 実際に使用するのは department のみ
foreach ($estimates as $estimate) {
    echo $estimate->department->name; // 他のリレーションは使用しない
}
```

#### **最適化されたコード**
```php
// 必要なリレーションのみ読み込む
$estimates = Estimate::with(['department:id,name'])->get();

foreach ($estimates as $estimate) {
    echo $estimate->department->name;
}
```

### 2. ネストしすぎたEager Loading

#### **問題のあるコード**
```php
// 過度にネストしたEager Loading
$estimates = Estimate::with([
    'department.manager.position.permissions',
    'partner.contactPerson.department.manager'
])->get();
```

#### **対策**
```php
// 必要最小限のネスト
$estimates = Estimate::with([
    'department:id,name',
    'partner:id,name'
])->get();
```

### 3. 条件付きEager Loadingの誤用

#### **問題のあるコード**
```php
// 条件が厳しすぎて関連データが取得されない
$estimates = Estimate::with(['department' => function ($query) {
    $query->where('name', '特定の部署名'); // 他の部署の見積で関連データが取得されない
}])->get();
```

#### **対策**
```php
// 適切な条件設定
$estimates = Estimate::with(['department' => function ($query) {
    $query->where('is_active', true); // 適切な条件
}])->get();
```

## 監視・デバッグ

### 1. クエリログの確認

#### **Laravelでのクエリログ**
```php
// クエリログを有効化
DB::enableQueryLog();

// 処理実行
$estimates = Estimate::with('department')->get();

// クエリログを取得
$queries = DB::getQueryLog();
foreach ($queries as $query) {
    echo $query['query'] . ' - ' . $query['time'] . 'ms';
}
```

### 2. パフォーマンス監視

#### **クエリ数の監視**
```php
class QueryMonitor
{
    public function monitorEagerLoading()
    {
        $startQueries = count(DB::getQueryLog());
        
        $estimates = Estimate::with('department')->get();
        
        $endQueries = count(DB::getQueryLog());
        $queryCount = $endQueries - $startQueries;
        
        if ($queryCount > 10) {
            Log::warning('Eager Loadingが適切に動作していない可能性があります', [
                'query_count' => $queryCount,
                'estimate_count' => $estimates->count()
            ]);
        }
    }
}
```

## まとめ

### ✅ **Eager Loadingの効果**

1. **クエリ数削減**: N+1問題の解決
2. **実行時間短縮**: 90%以上の改善が可能
3. **メモリ効率**: 関連データの一括読み込み
4. **スケーラビリティ**: 大量データでの安定した性能

### 🎯 **ベストプラクティス**

1. **必要なリレーションのみ**: 過度なEager Loadingを避ける
2. **SELECT最適化**: 必要なフィールドのみ選択
3. **インデックス活用**: 外部キーに適切なインデックス
4. **監視・デバッグ**: クエリログでの性能確認

### 📊 **スナップショット機能での活用**

- **スナップショット列**: 作成時の部署・職位情報の効率的取得
- **統計・レポート**: 大量データでの高速集計
- **一覧表示**: レスポンス時間の大幅改善

Eager Loadingは、データベースのパフォーマンス最適化において不可欠な技術です。適切に使用することで、N+1クエリ問題を解決し、大幅な性能向上を実現できます。

---

**作成日**: 2025年1月27日  
**解説者**: システム開発チーム  
**対象者**: 開発者、パフォーマンス監視担当者
