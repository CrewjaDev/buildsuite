# ビジネスコードベース権限管理システム設計

## 概要

ビジネスコード（ビジネスタイプ）を権限管理ページで一覧表示し、各ビジネスコードに対してpermissionの操作設定ができる仕組みを設計します。これにより、業務単位での権限管理が可能になり、より直感的で管理しやすい権限システムを実現します。

## 設計方針

### 1. 基本概念

- **ビジネスコード**: 業務の種類を表す識別子（例：`estimate`, `budget`, `purchase`）
- **権限管理の単位**: ビジネスコードごとに権限を管理
- **階層構造**: ビジネスコード → 操作権限 → 各階層への付与

### 2. 権限管理フロー

```
ビジネスコード一覧 → ビジネスコード選択 → 操作権限設定 → 各階層への権限付与
```

## 現在のビジネスコード分析

### 1. ビジネスコード分類

#### 1.1 システム固定コード（8種類）
| コード | 名称 | カテゴリ | 説明 |
|--------|------|----------|------|
| `employee` | 社員管理 | system | 社員の作成・編集・削除・閲覧業務 |
| `role` | 役割管理 | system | 役割の作成・編集・削除・閲覧業務 |
| `department` | 部署管理 | system | 部署の作成・編集・削除・閲覧業務 |
| `system` | システム管理 | system | システム設定・管理業務 |
| `approval` | 承認管理 | system | 承認フロー・承認依頼の管理業務 |
| `partner` | 取引先管理 | system | 取引先の作成・編集・削除・閲覧業務 |
| `permission` | 権限管理 | system | 権限設定・権限管理業務 |

#### 1.2 ビジネスロジックコード（5種類）
| コード | 名称 | カテゴリ | 説明 |
|--------|------|----------|------|
| `estimate` | 見積 | financial | 見積書の作成・承認業務 |
| `budget` | 予算 | financial | 予算の申請・承認業務 |
| `purchase` | 発注 | financial | 発注の申請・承認業務 |
| `construction` | 工事 | construction | 工事関連の承認業務 |
| `general` | 一般 | general | 一般的な承認業務 |

### 2. 各ビジネスコードの権限パターン

#### 2.1 基本操作権限（4種類）
- `{code}.view` - 閲覧権限
- `{code}.create` - 作成権限
- `{code}.edit` - 編集権限
- `{code}.delete` - 削除権限

#### 2.2 承認関連権限（6種類）
- `{code}.approval.request` - 承認依頼作成
- `{code}.approval.view` - 承認依頼閲覧
- `{code}.approval.approve` - 承認
- `{code}.approval.reject` - 却下
- `{code}.approval.return` - 差し戻し
- `{code}.approval.cancel` - 承認依頼キャンセル

#### 2.3 特殊権限
- `approval.usage` - ダッシュボードでの承認依頼一覧表示・承認者機能の利用権限
- `system.view` - システム情報閲覧
- `system.edit` - システム設定編集

### 3. 承認権限の階層構造

承認機能は2つの階層で構成されています：

#### 3.1 システム承認権限
- **`approval.use`**: 承認管理ページ（承認フロー管理・承認依頼管理）へのアクセス権限
- **`approval.flow.*`**: 承認フローの管理権限（作成・編集・削除・閲覧）
- **`approval.usage`**: ダッシュボードでの承認依頼一覧表示・承認者機能の利用権限

#### 3.2 業務別承認権限
各業務（見積、予算、発注、工事、一般）で個別の承認フロー権限を設定：
- **`{business}.approval.request`**: 承認依頼作成
- **`{business}.approval.view`**: 承認依頼閲覧
- **`{business}.approval.approve`**: 承認
- **`{business}.approval.reject`**: 却下
- **`{business}.approval.return`**: 差し戻し
- **`{business}.approval.cancel`**: 承認依頼キャンセル

#### 3.3 権限の使い分け
- **承認管理ページの利用**: `approval.use`
- **承認フローの設定・管理**: `approval.flow.*`
- **ダッシュボードでの承認依頼確認**: `approval.usage`
- **各業務での承認処理**: `{business}.approval.*`

## UI設計

### 1. 権限管理ページの構成

```
権限管理
├── システム権限レベル管理
├── 役割管理
├── 部署管理
├── 職位管理
├── ユーザー個別権限管理
├── 権限階層表示
└── 【新規】ビジネスコード権限管理 ← 追加
```

### 2. ビジネスコード権限管理タブ

#### 2.1 メイン画面構成

```
┌─────────────────────────────────────────────────────────────┐
│ ビジネスコード権限管理                                        │
├─────────────────────────────────────────────────────────────┤
│ カテゴリフィルタ: [すべて] [システム] [財務] [工事] [一般]      │
├─────────────────────────────────────────────────────────────┤
│ ビジネスコード一覧                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 見積 (estimate)                    [権限設定] [詳細]     │ │
│ │ 見積書の作成・承認業務                                   │ │
│ │ 権限数: 10 | 付与階層: 3/5                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 予算 (budget)                     [権限設定] [詳細]     │ │
│ │ 予算の申請・承認業務                                     │ │
│ │ 権限数: 10 | 付与階層: 2/5                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 発注 (purchase)                    [権限設定] [詳細]     │ │
│ │ 発注の申請・承認業務                                     │ │
│ │ 権限数: 10 | 付与階層: 4/5                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2 ビジネスコード詳細画面

```
┌─────────────────────────────────────────────────────────────┐
│ 見積 (estimate) - 権限設定                                   │
├─────────────────────────────────────────────────────────────┤
│ 基本情報                                                     │
│ コード: estimate | 名称: 見積 | カテゴリ: 財務                │
│ 説明: 見積書の作成・承認業務                                  │
├─────────────────────────────────────────────────────────────┤
│ 操作権限一覧                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 基本操作                                                 │ │
│ │ ☑ 見積閲覧 (estimate.view)                              │ │
│ │ ☑ 見積作成 (estimate.create)                            │ │
│ │ ☑ 見積編集 (estimate.edit)                              │ │
│ │ ☑ 見積削除 (estimate.delete)                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 承認操作                                                 │ │
│ │ ☑ 見積承認依頼作成 (estimate.approval.request)          │ │
│ │ ☑ 見積承認依頼閲覧 (estimate.approval.view)             │ │
│ │ ☑ 見積承認 (estimate.approval.approve)                  │ │
│ │ ☑ 見積却下 (estimate.approval.reject)                   │ │
│ │ ☑ 見積差し戻し (estimate.approval.return)               │ │
│ │ ☑ 見積承認依頼キャンセル (estimate.approval.cancel)     │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 階層別権限付与状況                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ システム権限レベル                                       │ │
│ │ ☑ システム管理者 | ☑ 最高責任者 | ☐ 上長 | ☐ 担当者     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 役割                                                     │ │
│ │ ☑ 経理部長 | ☑ 経理担当 | ☐ 営業部長 | ☐ 営業担当       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 部署                                                     │ │
│ │ ☑ 経理部 | ☐ 営業部 | ☐ 工事部                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 職位                                                     │ │
│ │ ☑ 部長 | ☑ 課長 | ☐ 主任 | ☐ 一般                      │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [保存] [キャンセル] [一括設定]                               │
└─────────────────────────────────────────────────────────────┘
```

### 3. 一括設定機能

#### 3.1 一括設定ダイアログ（改良版）

```
┌─────────────────────────────────────────────────────────────┐
│ 一括権限設定                                                 │
├─────────────────────────────────────────────────────────────┤
│ 対象ビジネスコード: 見積 (estimate)                          │
├─────────────────────────────────────────────────────────────┤
│ 設定対象                                                     │
│ ☑ システム権限レベル ☑ 役割 ☑ 部署 ☑ 職位 ☐ ユーザー個別   │
├─────────────────────────────────────────────────────────────┤
│ 付与する権限                                                 │
│ ☑ 基本操作権限 (view, create, edit, delete)                │
│ ☑ 承認操作権限 (request, view, approve, reject, return, cancel) │
│ ☐ カスタム選択                                               │
├─────────────────────────────────────────────────────────────┤
│ 付与先の選択                                                 │
│ システム権限レベル: [システム管理者] [最高責任者]             │
│ 役割: [経理部長] [経理担当]                                 │
│ 部署: [経理部]                                              │
│ 職位: [部長] [課長]                                         │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ 競合警告: 経理部長に既存の詳細設定があります              │
│ 既存設定: estimate.view, estimate.create (2個)              │
│ 追加予定: estimate.edit, estimate.delete (2個)              │
│ 結果: 合計4個の権限が設定されます                           │
├─────────────────────────────────────────────────────────────┤
│ [プレビュー] [実行] [キャンセル]                             │
└─────────────────────────────────────────────────────────────┘
```

## 実装設計

### 1. バックエンドAPI設計

#### 1.1 ビジネスコード一覧取得

```php
// GET /api/business-codes
public function index(Request $request): JsonResponse
{
    $category = $request->get('category', 'all');
    $businessCodes = BusinessCodeService::getAllBusinessCodes();
    
    if ($category !== 'all') {
        $businessCodes = BusinessCodeService::getBusinessCodesByCategory($category);
    }
    
    // 各ビジネスコードの権限付与状況を取得
    $result = [];
    foreach ($businessCodes as $code => $config) {
        $result[] = [
            'code' => $code,
            'name' => $config['name'],
            'description' => $config['description'],
            'category' => $config['category'],
            'is_system' => $config['is_system'],
            'is_core' => $config['is_core'],
            'permissions_count' => count($config['default_permissions']),
            'assigned_levels' => $this->getAssignedLevels($code),
            'assigned_roles' => $this->getAssignedRoles($code),
            'assigned_departments' => $this->getAssignedDepartments($code),
            'assigned_positions' => $this->getAssignedPositions($code),
        ];
    }
    
    return response()->json(['business_codes' => $result]);
}
```

#### 1.2 ビジネスコード詳細取得

```php
// GET /api/business-codes/{code}
public function show(string $code): JsonResponse
{
    $businessCode = BusinessCodeService::getBusinessCodeInfo($code);
    if (!$businessCode) {
        return response()->json(['error' => 'Business code not found'], 404);
    }
    
    $permissions = BusinessCodeService::getDefaultPermissions($code);
    $settings = BusinessCodeService::getSettings($code);
    
    return response()->json([
        'business_code' => [
            'code' => $code,
            'name' => $businessCode['name'],
            'description' => $businessCode['description'],
            'category' => $businessCode['category'],
            'is_system' => $businessCode['is_system'],
            'is_core' => $businessCode['is_core'],
            'settings' => $settings,
        ],
        'permissions' => $permissions,
        'assignment_status' => $this->getAssignmentStatus($code),
    ]);
}
```

#### 1.3 ビジネスコード権限一括設定（改良版）

```php
// POST /api/business-codes/{code}/permissions/bulk-assign
public function bulkAssignPermissions(Request $request, string $code): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'permissions' => 'required|array',
        'targets' => 'required|array',
        'targets.system_levels' => 'array',
        'targets.roles' => 'array',
        'targets.departments' => 'array',
        'targets.positions' => 'array',
        'mode' => 'required|in:add,replace,remove', // 追加: add, 置換: replace, 削除: remove
    ]);
    
    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }
    
    $permissions = $request->get('permissions');
    $targets = $request->get('targets');
    $mode = $request->get('mode', 'add'); // デフォルトは追加
    
    // 競合チェック
    $conflicts = $this->checkConflicts($targets, $permissions, $mode);
    if (!empty($conflicts) && $mode === 'replace') {
        return response()->json([
            'message' => 'Conflicts detected',
            'conflicts' => $conflicts,
            'requires_confirmation' => true
        ], 409);
    }
    
    // 各階層に権限を付与（追加モードのみ）
    if ($mode === 'add') {
        if (!empty($targets['system_levels'])) {
            $this->addToSystemLevels($code, $permissions, $targets['system_levels']);
        }
        
        if (!empty($targets['roles'])) {
            $this->addToRoles($code, $permissions, $targets['roles']);
        }
        
        if (!empty($targets['departments'])) {
            $this->addToDepartments($code, $permissions, $targets['departments']);
        }
        
        if (!empty($targets['positions'])) {
            $this->addToPositions($code, $permissions, $targets['positions']);
        }
    }
    
    return response()->json(['message' => 'Permissions assigned successfully']);
}

// 競合チェック
private function checkConflicts(array $targets, array $permissions, string $mode): array
{
    $conflicts = [];
    
    // システム権限レベルの競合チェック
    if (!empty($targets['system_levels'])) {
        foreach ($targets['system_levels'] as $systemLevelId) {
            $existingPermissions = $this->getSystemLevelPermissions($systemLevelId);
            if (!empty($existingPermissions)) {
                $conflicts[] = [
                    'type' => 'system_level',
                    'id' => $systemLevelId,
                    'name' => $this->getSystemLevelName($systemLevelId),
                    'existing_permissions' => $existingPermissions,
                    'new_permissions' => $permissions,
                    'mode' => $mode
                ];
            }
        }
    }
    
    // 役割の競合チェック
    if (!empty($targets['roles'])) {
        foreach ($targets['roles'] as $roleId) {
            $existingPermissions = $this->getRolePermissions($roleId);
            if (!empty($existingPermissions)) {
                $conflicts[] = [
                    'type' => 'role',
                    'id' => $roleId,
                    'name' => $this->getRoleName($roleId),
                    'existing_permissions' => $existingPermissions,
                    'new_permissions' => $permissions,
                    'mode' => $mode
                ];
            }
        }
    }
    
    return $conflicts;
}

// 追加モードでの権限付与
private function addToSystemLevels(string $code, array $permissions, array $systemLevelIds): void
{
    foreach ($systemLevelIds as $systemLevelId) {
        $systemLevel = SystemLevel::find($systemLevelId);
        if ($systemLevel) {
            // 既存の権限を取得
            $existingPermissionIds = $systemLevel->permissions()
                ->whereIn('name', $permissions)
                ->pluck('permissions.id')
                ->toArray();
            
            // 新しい権限のみを追加
            $newPermissionIds = Permission::whereIn('name', $permissions)
                ->whereNotIn('id', $existingPermissionIds)
                ->pluck('id')
                ->toArray();
            
            if (!empty($newPermissionIds)) {
                $systemLevel->permissions()->attach($newPermissionIds, [
                    'granted_at' => now(),
                    'granted_by' => auth()->id(),
                ]);
            }
        }
    }
}
```

### 2. フロントエンド実装

#### 2.1 ビジネスコード権限管理コンポーネント

```typescript
// BusinessCodePermissionManagement.tsx
export default function BusinessCodePermissionManagement() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBusinessCode, setSelectedBusinessCode] = useState<string | null>(null);
  const [businessCodes, setBusinessCodes] = useState<BusinessCode[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignmentStatus, setAssignmentStatus] = useState<AssignmentStatus | null>(null);

  const { data: businessCodesResponse, isLoading } = useBusinessCodes(selectedCategory);
  const { data: businessCodeDetail } = useBusinessCode(selectedBusinessCode);

  // ビジネスコード一覧表示
  const renderBusinessCodeList = () => (
    <div className="grid gap-4">
      {businessCodes.map((businessCode) => (
        <Card key={businessCode.code}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{businessCode.name}</h3>
                <p className="text-sm text-muted-foreground">{businessCode.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>権限数: {businessCode.permissions_count}</span>
                  <span>付与階層: {businessCode.assigned_levels.length}/5</span>
                  <Badge variant={businessCode.is_system ? "default" : "secondary"}>
                    {businessCode.category}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedBusinessCode(businessCode.code)}
                >
                  権限設定
                </Button>
                <Button variant="ghost" size="sm">
                  詳細
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ビジネスコード詳細表示
  const renderBusinessCodeDetail = () => (
    <div className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>{businessCodeDetail?.name} ({businessCodeDetail?.code})</CardTitle>
          <CardDescription>{businessCodeDetail?.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* 操作権限一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>操作権限一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionList permissions={permissions} />
        </CardContent>
      </Card>

      {/* 階層別権限付与状況 */}
      <Card>
        <CardHeader>
          <CardTitle>階層別権限付与状況</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignmentStatus status={assignmentStatus} />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ビジネスコード権限管理</h2>
          <p className="text-muted-foreground">
            業務単位での権限管理を行います
          </p>
        </div>
      </div>

      {/* カテゴリフィルタ */}
      <div className="flex gap-2">
        {['all', 'system', 'financial', 'construction', 'general'].map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {getCategoryLabel(category)}
          </Button>
        ))}
      </div>

      {/* メインコンテンツ */}
      {selectedBusinessCode ? (
        <div>
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedBusinessCode(null)}
            >
              ← 一覧に戻る
            </Button>
          </div>
          {renderBusinessCodeDetail()}
        </div>
      ) : (
        renderBusinessCodeList()
      )}
    </div>
  );
}
```

#### 2.2 一括設定コンポーネント（改良版）

```typescript
// BulkPermissionAssignment.tsx
export default function BulkPermissionAssignment({ 
  businessCode, 
  onClose 
}: { 
  businessCode: string; 
  onClose: () => void; 
}) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedTargets, setSelectedTargets] = useState({
    system_levels: [],
    roles: [],
    departments: [],
    positions: []
  });
  const [mode, setMode] = useState<'add' | 'replace' | 'remove'>('add');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // 競合チェック
  const checkConflicts = async () => {
    try {
      const response = await businessCodeService.checkConflicts(businessCode, {
        permissions: selectedPermissions,
        targets: selectedTargets,
        mode
      });
      setConflicts(response.conflicts || []);
    } catch (error) {
      console.error('競合チェックに失敗しました:', error);
    }
  };

  // プレビュー表示
  const handlePreview = async () => {
    await checkConflicts();
    setShowPreview(true);
  };

  const handleBulkAssign = async () => {
    try {
      await businessCodeService.bulkAssignPermissions(businessCode, {
        permissions: selectedPermissions,
        targets: selectedTargets,
        mode
      });
      toast.success('権限の一括設定が完了しました');
      onClose();
    } catch (error) {
      if (error.response?.status === 409) {
        // 競合が検出された場合
        setConflicts(error.response.data.conflicts);
        toast.warning('競合が検出されました。確認してください。');
      } else {
        toast.error('権限の一括設定に失敗しました');
      }
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>一括権限設定</DialogTitle>
          <DialogDescription>
            対象ビジネスコード: {businessCode}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 設定モード選択 */}
          <div>
            <h4 className="font-medium mb-2">設定モード</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="add"
                  checked={mode === 'add'}
                  onChange={(e) => setMode(e.target.value as 'add')}
                />
                <span>追加 (既存設定に追加) - 推奨</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={(e) => setMode(e.target.value as 'replace')}
                />
                <span>置換 (既存設定を置換) - 警告あり</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="remove"
                  checked={mode === 'remove'}
                  onChange={(e) => setMode(e.target.value as 'remove')}
                />
                <span>削除 (指定権限を削除)</span>
              </label>
            </div>
          </div>

          {/* 設定対象選択 */}
          <div>
            <h4 className="font-medium mb-2">設定対象</h4>
            <div className="grid grid-cols-2 gap-2">
              {['system_levels', 'roles', 'departments', 'positions'].map((target) => (
                <label key={target} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTargets[target].length > 0}
                    onChange={(e) => handleTargetChange(target, e.target.checked)}
                  />
                  <span>{getTargetLabel(target)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 付与する権限選択 */}
          <div>
            <h4 className="font-medium mb-2">付与する権限</h4>
            <PermissionSelector 
              permissions={permissions}
              selected={selectedPermissions}
              onChange={setSelectedPermissions}
            />
          </div>

          {/* 付与先の選択 */}
          <div>
            <h4 className="font-medium mb-2">付与先の選択</h4>
            <TargetSelector 
              targets={selectedTargets}
              onChange={setSelectedTargets}
            />
          </div>

          {/* 競合警告 */}
          {conflicts.length > 0 && (
            <ConflictWarning conflicts={conflicts} mode={mode} />
          )}

          {/* プレビュー */}
          {showPreview && (
            <PreviewSection 
              businessCode={businessCode}
              permissions={selectedPermissions}
              targets={selectedTargets}
              mode={mode}
              conflicts={conflicts}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="outline" onClick={handlePreview}>
            プレビュー
          </Button>
          <Button 
            onClick={handleBulkAssign}
            disabled={conflicts.length > 0 && mode === 'replace'}
          >
            実行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 競合警告コンポーネント
const ConflictWarning = ({ conflicts, mode }: { conflicts: Conflict[]; mode: string }) => (
  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <h4 className="font-medium text-yellow-800">設定競合の警告</h4>
    </div>
    <div className="text-sm text-yellow-700">
      <p>以下の階層で既存の詳細設定があります：</p>
      <ul className="mt-2 space-y-1">
        {conflicts.map((conflict) => (
          <li key={conflict.id}>
            • {conflict.name}: {conflict.existing_permissions.length}個の権限が設定済み
          </li>
        ))}
      </ul>
      {mode === 'replace' && (
        <p className="mt-2 font-medium text-red-600">
          ⚠️ 置換モードでは既存の設定が上書きされます。
        </p>
      )}
      {mode === 'add' && (
        <p className="mt-2 font-medium text-green-600">
          ✅ 追加モードでは既存の設定は保持されます。
        </p>
      )}
    </div>
  </div>
);
```

### 3. カスタムフック

```typescript
// useBusinessCodes.ts
export function useBusinessCodes(category: string = 'all') {
  return useQuery({
    queryKey: ['business-codes', category],
    queryFn: async () => {
      const response = await businessCodeService.getBusinessCodes(category);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// useBusinessCode.ts
export function useBusinessCode(code: string | null) {
  return useQuery({
    queryKey: ['business-code', code],
    queryFn: async () => {
      if (!code) return null;
      const response = await businessCodeService.getBusinessCode(code);
      return response.data;
    },
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });
}
```

## メリット

### 1. 業務単位での権限管理
- ビジネスコードごとに権限を管理できる
- 業務の特性に応じた権限設定が可能
- 新規業務追加時の権限設定が容易

### 2. 直感的なUI
- 業務名で権限を管理できる
- 一括設定機能による効率的な権限付与
- 階層別の権限付与状況が一目で分かる

### 3. 保守性の向上
- ビジネスコードと権限の関係が明確
- 権限の変更が業務単位で管理できる
- 権限の影響範囲が把握しやすい

### 4. 拡張性
- 新規ビジネスコードの追加が容易
- カテゴリ別の管理が可能
- 一括操作による効率的な管理

### 5. 競合管理（新規追加）
- 一括設定と詳細設定の競合を適切に管理
- 既存設定の保護機能
- プレビュー機能による事前確認
- 競合警告による安全な操作

## 実装順序

1. **バックエンドAPI実装**
   - ビジネスコード一覧取得API
   - ビジネスコード詳細取得API
   - 一括権限設定API（追加モード）
   - 競合チェックAPI

2. **フロントエンド基本実装**
   - ビジネスコード一覧表示
   - ビジネスコード詳細表示
   - 権限付与状況表示

3. **一括設定機能実装**
   - 一括設定ダイアログ（追加モード）
   - 権限選択機能
   - 付与先選択機能
   - 競合警告機能

4. **高度な機能実装**
   - プレビュー機能
   - 置換・削除モード
   - 競合解決機能

5. **統合とテスト**
   - 既存権限管理との統合
   - 動作テスト
   - パフォーマンステスト
   - 競合管理テスト

## 運用フロー（推奨）

### 1. 基本フロー
1. **各階層で詳細な権限設定を実施**
2. **ビジネスコード単位で一括設定は「追加」のみ**
3. **既存の詳細設定は保持される**

### 2. 競合管理フロー
1. **一括設定実行前に競合チェック**
2. **競合が検出された場合は警告表示**
3. **プレビュー機能で変更内容を確認**
4. **ユーザーの確認を得てから実行**

### 3. 安全な運用
- **追加モードをデフォルトに設定**
- **置換モードは警告付きで実行**
- **既存設定の保護を最優先**
- **段階的な権限設定を推奨**

この設計により、ビジネスコードベースの直感的で効率的、かつ安全な権限管理システムを実現できます。
