# BuildSuite 権限管理システム

## 概要
BuildSuiteシステムの権限管理に関する詳細な仕様書です。5階層の権限管理システムにより、組織の要件に応じた柔軟な権限設定が可能です。

## 権限管理の階層構造

### 1. システム権限レベル（SystemLevel）
**概要**: ユーザーの基本的なシステムアクセス権限を定義
**特徴**: 
- ユーザー作成時に**必須選択**
- 基本的なログイン・機能アクセス権限
- 組織の階層に応じた権限レベル

**権限レベル例**:
- `staff`: 一般社員（基本機能のみ）
- `manager`: 管理者（管理機能付き）
- `admin`: システム管理者（全機能アクセス）

### 2. 役割（Role）
**概要**: 機能別の役割権限を定義
**特徴**:
- **設定可能**（設定しなくてもOK）
- 業務機能に特化した権限
- ユーザーに複数役割を割り当て可能

**役割例**:
- `user_management`: ユーザー管理
- `estimate_management`: 見積管理
- `approval_management`: 承認管理
- `partner_management`: 取引先管理

### 3. 部署（Department）
**概要**: 部署固有の権限を定義
**特徴**:
- **設定可能**（設定しなくてもOK）
- 部署が扱うデータに特化した権限
- 部署変更時の権限自動更新

**部署権限例**:
- 経理部署: 財務データアクセス権限
- 営業部署: 顧客データアクセス権限
- 技術部署: 技術資料アクセス権限

### 4. 職位（Position）
**概要**: 職位固有の権限を定義
**特徴**:
- **設定可能**（設定しなくてもOK）
- 職位の責任範囲に応じた権限
- 職位変更時の権限自動更新

**職位権限例**:
- 部長: 承認権限、管理権限
- 課長: 管理権限、指導権限
- 担当: 業務権限、閲覧権限

### 5. ユーザー個別（User Individual）
**概要**: 特定ユーザーの特別権限を定義
**特徴**:
- **設定可能**（設定しなくてもOK）
- 個別ユーザーのみに付与される権限
- 組織の階層を超えた特別な権限

**個別権限例**:
- システム設定権限
- 特定データの特別アクセス権限
- 緊急時の特別操作権限

## 権限の優先順位と継承

### 権限の計算式
```
ユーザー最終権限 = システム権限レベル + 役割 + 部署 + 職位 + ユーザー個別
```

### 権限の優先順位
1. **ユーザー個別**（最優先）
2. **部署**
3. **職位**
4. **役割**
5. **システム権限レベル**（基本権限）

### 権限の重複処理
- 同じ権限が複数階層で設定されている場合、**和集合**として処理
- 上位階層の権限が下位階層の権限を上書きすることはない
- 権限の削除は、該当階層でのみ有効

## 権限設定の実装方法

### 1. データベース構造

#### 基本テーブル
```sql
-- 権限マスタ
permissions (
    id, name, display_name, description, 
    module, action, resource, 
    is_system, is_active
)

-- システム権限レベル
system_levels (
    id, code, name, display_name, 
    description, priority, is_system, is_active
)

-- 役割
roles (
    id, name, display_name, description, 
    priority, is_system, is_active
)

-- 部署
departments (
    id, name, code, description, 
    parent_id, level, path, sort_order, is_active
)

-- 職位
positions (
    id, code, name, display_name, 
    description, level, sort_order, is_active
)

-- ユーザー
users (
    id, employee_id, name, email, 
    system_level, is_active, is_admin
)
```

#### 中間テーブル（権限関連）
```sql
-- システム権限レベルと権限
system_level_permissions (
    system_level_id, permission_id, granted_at, granted_by
)

-- 役割と権限
role_permissions (
    role_id, permission_id, granted_at, granted_by
)

-- 部署と権限
department_permissions (
    department_id, permission_id, granted_at, granted_by
)

-- 職位と権限
position_permissions (
    position_id, permission_id, granted_at, granted_by
)

-- ユーザーと権限（個別権限）
user_permissions (
    user_id, permission_id, granted_at, granted_by
)
```

#### 中間テーブル（ユーザー関連）
```sql
-- ユーザーと役割
user_roles (
    user_id, role_id, assigned_at, assigned_by, expires_at, is_active
)

-- ユーザーと部署
user_departments (
    user_id, department_id, position, is_primary, assigned_at, assigned_by, expires_at, is_active
)
```

### 2. モデルリレーション

#### Positionモデル
```php
class Position extends Model
{
    // 職位に属する権限とのリレーション
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'position_permissions')
            ->withPivot(['granted_at', 'granted_by'])
            ->withTimestamps();
    }

    // この職位を持つユーザーとのリレーション
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
```

#### Userモデル
```php
class User extends Authenticatable
{
    // ユーザーの最終権限を取得
    public function getAllPermissions()
    {
        $permissions = collect();

        // システム権限レベル
        if ($this->systemLevel) {
            $permissions = $permissions->merge($this->systemLevel->permissions);
        }

        // 役割
        $permissions = $permissions->merge($this->roles->flatMap->permissions);

        // 部署
        $permissions = $permissions->merge($this->departments->flatMap->permissions);

        // 職位
        if ($this->position) {
            $permissions = $permissions->merge($this->position->permissions);
        }

        // 個別権限
        $permissions = $permissions->merge($this->permissions);

        // 重複を除去して返す
        return $permissions->unique('id');
    }

    // 特定の権限を持っているかチェック
    public function hasPermission(string $permission): bool
    {
        return $this->getAllPermissions()->contains('name', $permission);
    }
}
```

## 権限設定の使い方

### 1. 基本的な権限設定

#### システム権限レベルのみ設定
```php
// 最小限の設定（基本権限のみ）
$user = User::create([
    'name' => '田中太郎',
    'email' => 'tanaka@example.com',
    'system_level' => 'staff', // 一般社員権限
    'password' => Hash::make('password'),
]);
```

#### 役割を追加
```php
// 役割を追加して機能権限を付与
$user->roles()->attach($roleId, [
    'assigned_at' => now(),
    'assigned_by' => auth()->id(),
    'is_active' => true,
]);
```

#### 部署を追加
```php
// 部署を追加して部署固有権限を付与
$user->departments()->attach($departmentId, [
    'position' => '担当',
    'is_primary' => true,
    'assigned_at' => now(),
    'assigned_by' => auth()->id(),
    'is_active' => true,
]);
```

### 2. 職位権限の設定

#### 職位に権限を付与
```php
// 部長職位に承認権限を付与
$managerPosition = Position::where('code', 'manager')->first();
$managerPosition->permissions()->attach([
    'approval.create' => ['granted_at' => now(), 'granted_by' => auth()->id()],
    'approval.approve' => ['granted_at' => now(), 'granted_by' => auth()->id()],
    'user.manage' => ['granted_at' => now(), 'granted_by' => auth()->id()],
]);
```

#### 職位の権限を削除
```php
// 職位から特定の権限を削除
$managerPosition->permissions()->detach(['approval.create']);
```

### 3. 権限の確認と検証

#### ユーザーの権限確認
```php
// ユーザーが特定の権限を持っているかチェック
if ($user->hasPermission('user.create')) {
    // ユーザー作成処理
}

// ユーザーの全権限を取得
$allPermissions = $user->getAllPermissions();
```

#### 権限の階層別確認
```php
// システム権限レベルの権限
$systemPermissions = $user->systemLevel->permissions;

// 役割の権限
$rolePermissions = $user->roles->flatMap->permissions;

// 部署の権限
$departmentPermissions = $user->departments->flatMap->permissions;

// 職位の権限
$positionPermissions = $user->position->permissions;

// 個別権限
$individualPermissions = $user->permissions;
```

## 権限設定の運用パターン

### 1. 最小権限の原則
- 必要最小限の権限のみを付与
- 段階的に権限を追加
- 定期的な権限の見直し

### 2. 組織変更時の権限管理
```php
// ユーザーの部署変更
$user->departments()->updateExistingPivot($oldDepartmentId, [
    'is_active' => false,
    'expires_at' => now(),
]);

$user->departments()->attach($newDepartmentId, [
    'position' => '担当',
    'is_primary' => true,
    'assigned_at' => now(),
    'assigned_by' => auth()->id(),
    'is_active' => true,
]);

// 部署変更により権限が自動更新される
// 古い部署の権限は無効化、新しい部署の権限が有効化
```

### 3. 権限の一括管理
```php
// 部署の全ユーザーに権限を一括付与
$department = Department::find($departmentId);
$department->permissions()->attach($permissionIds, [
    'granted_at' => now(),
    'granted_by' => auth()->id(),
]);

// 職位の全ユーザーに権限を一括付与
$position = Position::find($positionId);
$position->permissions()->attach($permissionIds, [
    'granted_at' => now(),
    'granted_by' => auth()->id(),
]);
```

## 権限管理のベストプラクティス

### 1. 権限設計の原則
- **最小権限の原則**: 必要最小限の権限のみ付与
- **職務分離の原則**: 重要な操作は複数ユーザーの承認が必要
- **定期見直しの原則**: 定期的に権限の妥当性を確認

### 2. 権限設定のガイドライン
- **システム権限レベル**: 組織の階層に応じて適切に設定
- **役割**: 業務機能に特化した権限を設定
- **部署**: 部署が扱うデータに特化した権限を設定
- **職位**: 職位の責任範囲に応じた権限を設定
- **個別**: 例外的な権限のみ設定

### 3. セキュリティ考慮事項
- 権限の付与・削除は適切な承認プロセスを経て実行
- 権限変更のログを適切に記録
- 定期的な権限の監査を実施
- 不要な権限は速やかに削除

## トラブルシューティング

### 1. よくある問題

#### 権限が反映されない
- リレーションが正しく設定されているか確認
- 中間テーブルのデータが正しく存在するか確認
- キャッシュが古くないか確認

#### 権限の重複
- 同じ権限が複数階層で設定されていないか確認
- 権限の優先順位が正しく設定されているか確認

#### パフォーマンスの問題
- 権限取得時のN+1問題を回避
- 適切なインデックスが設定されているか確認
- 権限キャッシュの活用

### 2. デバッグ方法

#### ログ出力
```php
// 権限の詳細をログ出力
Log::info('User permissions:', [
    'user_id' => $user->id,
    'system_level' => $user->systemLevel->permissions->pluck('name'),
    'roles' => $user->roles->map(fn($role) => [
        'role' => $role->name,
        'permissions' => $role->permissions->pluck('name')
    ]),
    'departments' => $user->departments->map(fn($dept) => [
        'department' => $dept->name,
        'permissions' => $dept->permissions->pluck('name')
    ]),
    'position' => $user->position ? [
        'position' => $user->position->name,
        'permissions' => $user->position->permissions->pluck('name')
    ] : null,
    'individual' => $user->permissions->pluck('name'),
]);
```

#### 権限の階層別確認
```php
// 各階層の権限を個別に確認
$debugInfo = [
    'system_level' => $user->systemLevel ? $user->systemLevel->name : 'none',
    'system_permissions' => $user->systemLevel ? $user->systemLevel->permissions->pluck('name') : [],
    'roles' => $user->roles->pluck('name'),
    'role_permissions' => $user->roles->flatMap->permissions->pluck('name'),
    'departments' => $user->departments->pluck('name'),
    'department_permissions' => $user->departments->flatMap->permissions->pluck('name'),
    'position' => $user->position ? $user->position->name : 'none',
    'position_permissions' => $user->position ? $user->position->permissions->pluck('name') : [],
    'individual_permissions' => $user->permissions->pluck('name'),
];

dd($debugInfo);
```

## まとめ

BuildSuiteの権限管理システムは、5階層の柔軟な権限設定により、組織の要件に応じた最適な権限管理を実現します。

- **システム権限レベル**: 基本権限（必須）
- **役割**: 機能別権限（オプション）
- **部署**: 部署固有権限（オプション）
- **職位**: 職位固有権限（オプション）
- **ユーザー個別**: 特別権限（オプション）

各階層は独立して設定可能で、設定しなくてもシステムは正常に動作します。必要に応じて段階的に権限を追加することで、組織の成長に合わせた権限管理が可能です。
