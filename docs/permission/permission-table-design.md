# 権限管理システム テーブル設計書

## 概要

本ドキュメントは、ユーザー・社員管理と5階層の権限管理システムにおけるテーブル設計について定義します。システム権限レベルを他の階層と同様のIDベース中間テーブル設計に統一し、一貫性のある権限管理システムを構築します。

## 設計方針

### 1. 基本原則

- **1:1関係**: ユーザーと社員は1:1の関係
- **IDベース紐づけ**: 全階層でIDベースの中間テーブルを使用
- **一貫性**: 5階層すべてで同じパターンの権限管理
- **柔軟性**: 履歴管理、有効/無効切り替え、複数割り当て対応

### 2. 権限管理階層

1. **システム権限レベル** (System Level)
2. **役割** (Role)
3. **部署** (Department)
4. **職位** (Position)
5. **個別ユーザー権限** (Individual User Permission)

## テーブル設計

### 1. 基本エンティティ

#### 1.1 users テーブル
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    employee_id BIGINT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    password_expires_at TIMESTAMP NULL,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_at TIMESTAMP NULL,
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    
    INDEX idx_users_login_id (login_id),
    INDEX idx_users_employee_id (employee_id),
    INDEX idx_users_is_active (is_active)
);
```

#### 1.2 employees テーブル
```sql
CREATE TABLE employees (
    id BIGINT PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(100),
    email VARCHAR(255),
    birth_date DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    postal_code VARCHAR(10),
    prefecture VARCHAR(20),
    address TEXT,
    job_title VARCHAR(100),
    hire_date DATE,
    department_id BIGINT,
    position_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
    
    INDEX idx_employees_employee_id (employee_id),
    INDEX idx_employees_department_id (department_id),
    INDEX idx_employees_position_id (position_id),
    INDEX idx_employees_is_active (is_active)
);
```

### 2. 権限管理エンティティ

#### 2.1 system_levels テーブル
```sql
CREATE TABLE system_levels (
    id BIGINT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    INDEX idx_system_levels_code (code),
    INDEX idx_system_levels_is_active (is_active)
);
```

#### 2.2 roles テーブル
```sql
CREATE TABLE roles (
    id BIGINT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    INDEX idx_roles_code (code),
    INDEX idx_roles_is_active (is_active)
);
```

#### 2.3 departments テーブル
```sql
CREATE TABLE departments (
    id BIGINT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id BIGINT,
    sort_order INTEGER DEFAULT 0,
    manager_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
    
    INDEX idx_departments_code (code),
    INDEX idx_departments_parent_id (parent_id),
    INDEX idx_departments_is_active (is_active)
);
```

#### 2.4 positions テーブル
```sql
CREATE TABLE positions (
    id BIGINT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    INDEX idx_positions_code (code),
    INDEX idx_positions_is_active (is_active)
);
```

#### 2.5 permissions テーブル
```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    INDEX idx_permissions_name (name),
    INDEX idx_permissions_module (module),
    INDEX idx_permissions_action (action),
    INDEX idx_permissions_is_active (is_active)
);
```

### 3. 中間テーブル（権限紐づけ）

#### 3.1 user_system_levels テーブル（新規作成）
```sql
CREATE TABLE user_system_levels (
    id BIGINT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,  -- 1:1関係を強制
    system_level_id BIGINT NOT NULL,
    assigned_at TIMESTAMP,
    assigned_by BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (system_level_id) REFERENCES system_levels(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_system_levels_user_id (user_id),
    INDEX idx_user_system_levels_system_level_id (system_level_id),
    INDEX idx_user_system_levels_is_active (is_active)
);
```

#### 3.2 user_roles テーブル
```sql
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP,
    assigned_by BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(user_id, role_id),
    INDEX idx_user_roles_user_id (user_id),
    INDEX idx_user_roles_role_id (role_id),
    INDEX idx_user_roles_is_active (is_active)
);
```

#### 3.3 user_departments テーブル
```sql
CREATE TABLE user_departments (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    assigned_at TIMESTAMP,
    assigned_by BIGINT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(user_id, department_id),
    INDEX idx_user_departments_user_id (user_id),
    INDEX idx_user_departments_department_id (department_id),
    INDEX idx_user_departments_is_active (is_active)
);
```


### 4. 権限紐づけテーブル

各階層エンティティ（システム権限レベル、役割、部署、職位、ユーザー）と権限（permissions）を紐づけるテーブルです。これにより、各階層に権限を割り当てることができます。

#### 4.1 system_level_permissions テーブル
**用途**: システム権限レベルに権限を割り当て
```sql
CREATE TABLE system_level_permissions (
    id BIGINT PRIMARY KEY,
    system_level_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP,
    granted_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (system_level_id) REFERENCES system_levels(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(system_level_id, permission_id),
    INDEX idx_system_level_permissions_system_level_id (system_level_id),
    INDEX idx_system_level_permissions_permission_id (permission_id)
);
```

#### 4.2 role_permissions テーブル
**用途**: 役割に権限を割り当て
```sql
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP,
    granted_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(role_id, permission_id),
    INDEX idx_role_permissions_role_id (role_id),
    INDEX idx_role_permissions_permission_id (permission_id)
);
```

#### 4.3 department_permissions テーブル
**用途**: 部署に権限を割り当て
```sql
CREATE TABLE department_permissions (
    id BIGINT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP,
    granted_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(department_id, permission_id),
    INDEX idx_department_permissions_department_id (department_id),
    INDEX idx_department_permissions_permission_id (permission_id)
);
```

#### 4.4 position_permissions テーブル
**用途**: 職位に権限を割り当て
```sql
CREATE TABLE position_permissions (
    id BIGINT PRIMARY KEY,
    position_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP,
    granted_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(position_id, permission_id),
    INDEX idx_position_permissions_position_id (position_id),
    INDEX idx_position_permissions_permission_id (permission_id)
);
```

#### 4.5 user_permissions テーブル
**用途**: ユーザー個別に対する特別権限の設定
```sql
CREATE TABLE user_permissions (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    assigned_at TIMESTAMP,
    assigned_by BIGINT,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(user_id, permission_id),
    INDEX idx_user_permissions_user_id (user_id),
    INDEX idx_user_permissions_permission_id (permission_id),
    INDEX idx_user_permissions_is_active (is_active)
);
```

## 権限判定ロジック

### 1. 統合権限取得クエリ

```php
public static function getUserEffectivePermissions(User $user): array
{
    // システム管理者は全権限
    if ($user->is_admin) {
        return ['*'];
    }
    
    // 単一クエリで全権限を取得
    $permissions = \DB::table('permissions')
        ->select('permissions.name')
        ->where('permissions.is_active', true)
        ->where(function ($query) use ($user) {
            $query
                // 1. システム権限レベル
                ->orWhereExists(function ($subQuery) use ($user) {
                    $subQuery->select(\DB::raw(1))
                        ->from('system_level_permissions')
                        ->join('user_system_levels', 'system_level_permissions.system_level_id', '=', 'user_system_levels.system_level_id')
                        ->whereColumn('system_level_permissions.permission_id', 'permissions.id')
                        ->where('user_system_levels.user_id', $user->id)
                        ->where('user_system_levels.is_active', true);
                })
                // 2. 役割
                ->orWhereExists(function ($subQuery) use ($user) {
                    $subQuery->select(\DB::raw(1))
                        ->from('role_permissions')
                        ->join('user_roles', 'role_permissions.role_id', '=', 'user_roles.role_id')
                        ->whereColumn('role_permissions.permission_id', 'permissions.id')
                        ->where('user_roles.user_id', $user->id)
                        ->where('user_roles.is_active', true);
                })
                // 3. 部署
                ->orWhereExists(function ($subQuery) use ($user) {
                    $subQuery->select(\DB::raw(1))
                        ->from('department_permissions')
                        ->join('user_departments', 'department_permissions.department_id', '=', 'user_departments.department_id')
                        ->whereColumn('department_permissions.permission_id', 'permissions.id')
                        ->where('user_departments.user_id', $user->id)
                        ->where('user_departments.is_active', true);
                })
                // 4. 職位
                ->orWhereExists(function ($subQuery) use ($user) {
                    $subQuery->select(\DB::raw(1))
                        ->from('position_permissions')
                        ->join('employees', 'position_permissions.position_id', '=', 'employees.position_id')
                        ->whereColumn('position_permissions.permission_id', 'permissions.id')
                        ->where('employees.id', $user->employee_id);
                })
                // 5. 個別ユーザー権限
                ->orWhereExists(function ($subQuery) use ($user) {
                    $subQuery->select(\DB::raw(1))
                        ->from('user_permissions')
                        ->whereColumn('user_permissions.permission_id', 'permissions.id')
                        ->where('user_permissions.user_id', $user->id)
                        ->where('user_permissions.is_active', true);
                });
        })
        ->pluck('name')
        ->toArray();
    
    return array_unique($permissions);
}
```

## データ移行計画

### 1. 移行手順

1. **user_system_levels テーブル作成**
2. **既存データ移行**
   ```sql
   INSERT INTO user_system_levels (user_id, system_level_id, assigned_at, is_active)
   SELECT 
       u.id,
       sl.id,
       NOW(),
       TRUE
   FROM users u
   JOIN system_levels sl ON u.system_level = sl.code
   WHERE u.system_level IS NOT NULL;
   ```
3. **PermissionService 修正**
4. **users テーブルから system_level カラム削除**

### 2. 移行後の確認

- 全ユーザーの権限が正しく取得できること
- システム権限レベルの変更が正常に動作すること
- 他の階層との一貫性が保たれること

## メリット

### 1. 一貫性
- 全5階層が同じIDベース中間テーブル設計
- 統一された権限管理ロジック

### 2. 柔軟性
- 1ユーザーに複数のシステム権限レベル割り当て可能
- 履歴管理（assigned_at, assigned_by）
- 有効/無効の切り替え（is_active）

### 3. 保守性
- 文字列マッチングからIDベースの確実な紐づけ
- 他の階層と同じパターンで理解しやすい
- データ整合性の向上

### 4. 拡張性
- 新しい権限階層の追加が容易
- 複雑な権限ルールの実装が可能

## まとめ

この設計により、ユーザー・社員管理と5階層の権限管理が統合された、一貫性があり拡張性の高い権限管理システムが構築されます。システム権限レベルも他の階層と同様のIDベース設計に統一することで、保守性と柔軟性が大幅に向上します。
