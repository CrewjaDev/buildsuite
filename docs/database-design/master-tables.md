# マスタテーブル 詳細仕様書

## 概要
BuildSuiteシステムで使用するマスタテーブルの詳細仕様書です。
各種マスタデータの定義、構造、基本データについて説明します。


## 作成済マスタテーブル一覧

### 既に定義済みのマスタテーブル
- **システムレベル権限マスタ（system_levels）**: ユーザーのシステム全体での権限レベル
- **職位マスタ（positions）**: 組織内の職位・レベル管理
- **部門マスタ（departments）**: 組織の部署構造管理
- **操作権限マスタ（permissions）**: システム内の権限管理
- **工事種別マスタ（project_types）**: 工事種別と経費率管理
- **工事分類マスタ（construction_classifications）**: 実行予算内訳の分類管理

## システムレベル権限マスタテーブル

### 1. テーブル定義

```sql
-- システムレベル権限マスタテーブル
CREATE TABLE system_levels (
    id BIGSERIAL PRIMARY KEY,                                    -- システムレベルID
    code VARCHAR(50) UNIQUE NOT NULL,                            -- システムレベルコード（一意）
    name VARCHAR(100) NOT NULL,                                  -- システムレベル名
    display_name VARCHAR(255) NOT NULL,                          -- 表示名
    description TEXT NULL,                                       -- 説明
    priority INTEGER NOT NULL,                                   -- 優先度
    is_system BOOLEAN DEFAULT false,                             -- システムレベルフラグ
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時（論理削除用）
);

-- システムレベル権限マスタのインデックス
CREATE INDEX idx_system_levels_code ON system_levels(code);
CREATE INDEX idx_system_levels_priority ON system_levels(priority);
CREATE INDEX idx_system_levels_is_active ON system_levels(is_active);
```

### 2. カラム詳細

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | BIGSERIAL | PRIMARY KEY | システムレベルID（自動採番） |
| code | VARCHAR(50) | UNIQUE NOT NULL | システムレベルコード（一意） |
| name | VARCHAR(100) | NOT NULL | システムレベル名 |
| display_name | VARCHAR(255) | NOT NULL | 表示名 |
| description | TEXT | - | 説明 |
| priority | INTEGER | NOT NULL | 優先度（数値が大きいほど権限が高い） |
| is_system | BOOLEAN | DEFAULT false | システムレベルフラグ |
| is_active | BOOLEAN | DEFAULT true | アクティブ状態 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 削除日時（論理削除用） |

### 3. 基本データ

```sql
-- システムレベル権限マスタの基本データ
INSERT INTO system_levels (code, name, display_name, description, priority, is_system, is_active) VALUES
('SUPER_ADMIN', 'Super Administrator', 'システム管理者', 'システム全体の管理権限を持つ最高権限者', 100, true, true),
('ADMIN', 'Administrator', '管理者', '組織全体の管理権限を持つ管理者', 80, true, true),
('MANAGER', 'Manager', 'マネージャー', '部門・プロジェクトの管理権限を持つマネージャー', 60, true, true),
('LEADER', 'Leader', 'リーダー', 'チーム・作業の管理権限を持つリーダー', 40, true, true),
('MEMBER', 'Member', 'メンバー', '基本的な業務権限を持つメンバー', 20, true, true),
('GUEST', 'Guest', 'ゲスト', '閲覧のみ可能なゲストユーザー', 10, true, true);
```

## 職位マスタテーブル

### 1. テーブル定義

```sql
-- 職位マスタテーブル
CREATE TABLE positions (
    id BIGSERIAL PRIMARY KEY,                                    -- 職位ID
    code VARCHAR(50) UNIQUE NOT NULL,                            -- 職位コード（一意）
    name VARCHAR(100) NOT NULL,                                  -- 職位名
    display_name VARCHAR(255) NOT NULL,                          -- 表示名
    description TEXT NULL,                                       -- 説明
    level INTEGER NOT NULL,                                      -- 職位レベル（1:社員, 2:担当, 3:課長, 4:部長, 5:取締役）
    sort_order INTEGER DEFAULT 0,                                -- ソート順
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時（論理削除用）
);

-- 職位マスタのインデックス
CREATE INDEX idx_positions_code ON positions(code);
CREATE INDEX idx_positions_level ON positions(level);
CREATE INDEX idx_positions_is_active ON positions(is_active);
CREATE INDEX idx_positions_sort_order ON positions(sort_order);
```

### 2. カラム詳細

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 職位ID（自動採番） |
| code | VARCHAR(50) | UNIQUE NOT NULL | 職位コード（一意） |
| name | VARCHAR(100) | NOT NULL | 職位名 |
| display_name | VARCHAR(255) | NOT NULL | 表示名 |
| description | TEXT | - | 説明 |
| level | INTEGER | NOT NULL | 職位レベル（1:社員, 2:担当, 3:課長, 4:部長, 5:取締役） |
| sort_order | INTEGER | DEFAULT 0 | ソート順 |
| is_active | BOOLEAN | DEFAULT true | アクティブ状態 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 削除日時（論理削除用） |

### 3. 基本データ

```sql
-- 職位マスタの基本データ
INSERT INTO positions (code, name, display_name, description, level, sort_order, is_active) VALUES
('DIRECTOR', '取締役', '取締役', '取締役職', 5, 50, true),
('DEPARTMENT_HEAD', '部長', '部長', '部長職', 4, 40, true),
('SECTION_CHIEF', '課長', '課長', '課長職', 3, 30, true),
('SUPERVISOR', '担当', '担当', '担当職', 2, 20, true),
('STAFF', '社員', '社員', '一般社員', 1, 10, true);
```

## 部門マスタテーブル

### 1. テーブル定義

```sql
-- 部門マスタテーブル
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,                                    -- 部門ID
    name VARCHAR(255) NOT NULL,                                  -- 部門名
    code VARCHAR(50) UNIQUE NOT NULL,                            -- 部門コード（一意）
    description TEXT NULL,                                       -- 説明
    parent_id BIGINT NULL,                                       -- 親部門ID
    level INTEGER DEFAULT 0,                                     -- 階層レベル
    path VARCHAR(500) NULL,                                      -- 階層パス
    sort_order INTEGER DEFAULT 0,                                -- ソート順
    manager_id BIGINT NULL,                                      -- 管理者ID
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL,                     -- 削除日時（論理削除用）
    
    CONSTRAINT fk_departments_parent_id FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_departments_manager_id FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 部門マスタのインデックス
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_level ON departments(level);
CREATE INDEX idx_departments_path ON departments(path);
CREATE INDEX idx_departments_is_active ON departments(is_active);
```

### 2. カラム詳細

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 部門ID（自動採番） |
| name | VARCHAR(255) | NOT NULL | 部門名 |
| code | VARCHAR(50) | UNIQUE NOT NULL | 部門コード（一意） |
| description | TEXT | - | 説明 |
| parent_id | BIGINT | REFERENCES departments(id) | 親部門ID（階層構造用） |
| level | INTEGER | DEFAULT 0 | 階層レベル |
| path | VARCHAR(500) | - | 階層パス |
| sort_order | INTEGER | DEFAULT 0 | ソート順 |
| manager_id | BIGINT | REFERENCES users(id) | 管理者ID |
| is_active | BOOLEAN | DEFAULT true | アクティブ状態 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 削除日時（論理削除用） |

### 3. 基本データ

```sql
-- 部門マスタの基本データ
INSERT INTO departments (name, code, description, parent_id, level, path, sort_order, is_active) VALUES
('本社', 'HQ', '本社', NULL, 0, '/HQ', 10, true),
('営業部', 'SALES', '営業部', 1, 1, '/HQ/SALES', 20, true),
('工事部', 'CONSTRUCTION', '工事部', 1, 1, '/HQ/CONSTRUCTION', 30, true),
('経理部', 'ACCOUNTING', '経理部', 1, 1, '/HQ/ACCOUNTING', 40, true),
('営業1課', 'SALES_1', '営業1課', 2, 2, '/HQ/SALES/SALES_1', 21, true),
('営業2課', 'SALES_2', '営業2課', 2, 2, '/HQ/SALES/SALES_2', 22, true),
('土木工事課', 'CIVIL', '土木工事課', 3, 2, '/HQ/CONSTRUCTION/CIVIL', 31, true),
('建築工事課', 'ARCHITECTURE', '建築工事課', 3, 2, '/HQ/CONSTRUCTION/ARCHITECTURE', 32, true);
```

## 操作権限マスタテーブル

### 1. テーブル定義

```sql
-- 操作権限マスタテーブル
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,                                    -- 権限ID
    name VARCHAR(100) UNIQUE NOT NULL,                           -- 権限名（一意）
    display_name VARCHAR(255) NOT NULL,                          -- 表示名
    description TEXT NULL,                                       -- 説明
    module VARCHAR(100) NOT NULL,                                -- モジュール名
    action VARCHAR(100) NOT NULL,                                -- アクション名
    resource VARCHAR(100) NULL,                                  -- リソース名
    is_system BOOLEAN DEFAULT false,                             -- システム権限フラグ
    is_active BOOLEAN DEFAULT true,                              -- アクティブ状態
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時（論理削除用）
);

-- 操作権限マスタのインデックス
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_is_active ON permissions(is_active);
```

### 2. カラム詳細

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 権限ID（自動採番） |
| name | VARCHAR(100) | UNIQUE NOT NULL | 権限名（一意） |
| display_name | VARCHAR(255) | NOT NULL | 表示名 |
| description | TEXT | - | 説明 |
| module | VARCHAR(100) | NOT NULL | モジュール名（estimate, construction, order, payment等） |
| action | VARCHAR(100) | NOT NULL | アクション名（create, read, update, delete等） |
| resource | VARCHAR(100) | - | リソース名（estimates, construction_items等） |
| is_system | BOOLEAN | DEFAULT false | システム権限フラグ |
| is_active | BOOLEAN | DEFAULT true | アクティブ状態 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 削除日時（論理削除用） |

### 3. 基本データ

```sql
-- 操作権限マスタの基本データ
INSERT INTO permissions (name, display_name, description, module, action, resource, is_system, is_active) VALUES
-- 見積管理権限
('estimate.create', '見積作成', '見積書の作成権限', 'estimate', 'create', 'estimates', true, true),
('estimate.read', '見積閲覧', '見積書の閲覧権限', 'estimate', 'read', 'estimates', true, true),
('estimate.update', '見積更新', '見積書の更新権限', 'estimate', 'update', 'estimates', true, true),
('estimate.delete', '見積削除', '見積書の削除権限', 'estimate', 'delete', 'estimates', true, true),
('estimate.approve', '見積承認', '見積書の承認権限', 'estimate', 'approve', 'estimates', true, true),

-- 工事管理権限
('construction.create', '工事作成', '工事データの作成権限', 'construction', 'create', 'constructions', true, true),
('construction.read', '工事閲覧', '工事データの閲覧権限', 'construction', 'read', 'constructions', true, true),
('construction.update', '工事更新', '工事データの更新権限', 'construction', 'update', 'constructions', true, true),
('construction.delete', '工事削除', '工事データの削除権限', 'construction', 'delete', 'constructions', true, true),

-- 発注管理権限
('order.create', '発注作成', '発注書の作成権限', 'order', 'create', 'orders', true, true),
('order.read', '発注閲覧', '発注書の閲覧権限', 'order', 'read', 'orders', true, true),
('order.update', '発注更新', '発注書の更新権限', 'order', 'update', 'orders', true, true),
('order.delete', '発注削除', '発注書の削除権限', 'order', 'delete', 'orders', true, true),

-- 支払管理権限
('payment.create', '支払作成', '支払データの作成権限', 'payment', 'create', 'payments', true, true),
('payment.read', '支払閲覧', '支払データの閲覧権限', 'payment', 'read', 'payments', true, true),
('payment.update', '支払更新', '支払データの更新権限', 'payment', 'update', 'payments', true, true),
('payment.delete', '支払削除', '支払データの削除権限', 'payment', 'delete', 'payments', true, true),

-- システム管理権限
('system.user.manage', 'ユーザー管理', 'ユーザーの管理権限', 'system', 'manage', 'users', true, true),
('system.role.manage', '役割管理', '役割の管理権限', 'system', 'manage', 'roles', true, true),
('system.permission.manage', '権限管理', '権限の管理権限', 'system', 'manage', 'permissions', true, true);
```


## 工事種別マスタテーブル

### 1. テーブル定義

```sql
-- 工事種別マスタテーブル
CREATE TABLE project_types (
    id BIGSERIAL PRIMARY KEY,                                    -- 工事種別ID
    type_code VARCHAR(20) UNIQUE NOT NULL,                       -- 工事種別コード
    type_name VARCHAR(100) NOT NULL,                             -- 工事種別名称
    type_symbol VARCHAR(10),                                     -- 工事種別記号
    description TEXT,                                            -- 説明
    overhead_rate DECIMAL(5,2) DEFAULT 0,                        -- 一般管理費率（%）
    cost_expense_rate DECIMAL(5,2) DEFAULT 0,                    -- 原価経費率（%）
    material_expense_rate DECIMAL(5,2) DEFAULT 0,                -- 材料経費率（%）
    is_active BOOLEAN DEFAULT true,                              -- 有効フラグ
    sort_order INTEGER DEFAULT 0,                                -- 表示順序
    created_by BIGINT REFERENCES users(id),                      -- 作成者ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 更新日時
    deleted_at TIMESTAMP WITH TIME ZONE NULL                     -- 削除日時
);

-- 工事種別マスタのインデックス
CREATE INDEX idx_project_types_type_code ON project_types(type_code);
CREATE INDEX idx_project_types_is_active ON project_types(is_active);
CREATE INDEX idx_project_types_sort_order ON project_types(sort_order);
```

### 2. カラム詳細

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 工事種別ID（自動採番） |
| type_code | VARCHAR(20) | UNIQUE NOT NULL | 工事種別コード（一意） |
| type_name | VARCHAR(100) | NOT NULL | 工事種別名称 |
| type_symbol | VARCHAR(10) | - | 工事種別記号 |
| description | TEXT | - | 説明 |
| overhead_rate | DECIMAL(5,2) | DEFAULT 0 | 一般管理費率（%） |
| cost_expense_rate | DECIMAL(5,2) | DEFAULT 0 | 原価経費率（%） |
| material_expense_rate | DECIMAL(5,2) | DEFAULT 0 | 材料経費率（%） |
| is_active | BOOLEAN | DEFAULT true | 有効フラグ |
| sort_order | INTEGER | DEFAULT 0 | 表示順序 |
| created_by | BIGINT | REFERENCES users(id) | 作成者ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 削除日時（論理削除用） |

### 3. 基本データ

-- 工事種別マスタの基本データ
工事種別CD	工事種別名	工事種別記号	一般管理費率	原価経費率	材料経費率
6	F:その他工事	F	10 %	3 %	5 %
10	土木一式	D	20 %	3 %	5 %
20	建築一式（元請）公共		20 %	3 %	5 %
21	建築一式（元請）民間		20 %	3 %	5 %
23	建築一式（下請）公共		20 %	3 %	5 %
24	建築一式（下請）民間		20 %	3 %	5 %
50	とび土工（元請）公共		20 %	3 %	5 %
51	とび土工（元請）民間		20 %	3 %	5 %
52	とび土工（下請）公共		20 %	3 %	5 %
53	とび土工（下請）民間		20 %	3 %	5 %
170	塗装（元請）公共		20 %	3 %	5 %
171	塗装（元請）民間		20 %	3 %	5 %
172	塗装（下請）公共		20 %	3 %	5 %
173	塗装（下請）民間		20 %	3 %	5 %
180	防水新築（元請）公共		13.5 %	3 %	5 %
181	防水新築（元請）民間		13.5 %	3 %	5 %
182	防水新築（下請）公共		13.5 %	3 %	5 %
183	防水新築（下請）民間		13.5 %	3 %	5 %
184	防水（元請）公共		20 %	3 %	5 %
185	防水（元請）民間		20 %	3 %	5 %
186	防水（下請）公共		20 %	3 %	5 %
187	防水（下請）民間		20 %	3 %	5 %
290	解体		20 %	3 %	5 %



### 5. API設計

```php
// 工事種別マスタAPI
GET    /api/v1/project-types                 # 工事種別一覧取得
GET    /api/v1/project-types/{id}            # 工事種別詳細取得
POST   /api/v1/project-types                 # 工事種別作成
PUT    /api/v1/project-types/{id}            # 工事種別更新
DELETE /api/v1/project-types/{id}            # 工事種別削除

// 工事種別検索API
GET    /api/v1/project-types/search          # 工事種別検索
GET    /api/v1/project-types/active          # 有効な工事種別一覧取得
```

### 6. フロントエンド設計

```typescript
// 工事種別マスタの型定義
interface ProjectType {
  id: number;                     // 工事種別ID
  type_code: string;              // 工事種別コード
  type_name: string;              // 工事種別名称
  type_symbol: string;            // 工事種別記号
  description: string;            // 説明
  overhead_rate: number;          // 一般管理費率（%）
  cost_expense_rate: number;      // 原価経費率（%）
  material_expense_rate: number;  // 材料経費率（%）
  is_active: boolean;             // 有効フラグ
  sort_order: number;             // 表示順序
  created_by: number;             // 作成者ID
  created_at: Date;               // 作成日時
  updated_at: Date;               // 更新日時
  deleted_at?: Date;              // 削除日時
}

// 工事種別選択コンポーネント
interface ProjectTypeSelector {
  selectedType: ProjectType | null;
  availableTypes: ProjectType[];
  onTypeChange: (type: ProjectType) => void;
  isRequired: boolean;
  placeholder?: string;
}
```

## 共通API設計

### 7. マスタテーブル共通API

```php
// システムレベル権限マスタAPI
GET    /api/v1/system-levels                 # システムレベル一覧取得
GET    /api/v1/system-levels/{id}            # システムレベル詳細取得
POST   /api/v1/system-levels                 # システムレベル作成
PUT    /api/v1/system-levels/{id}            # システムレベル更新
DELETE /api/v1/system-levels/{id}            # システムレベル削除

// 職位マスタAPI
GET    /api/v1/positions                     # 職位一覧取得
GET    /api/v1/positions/{id}                # 職位詳細取得
POST   /api/v1/positions                     # 職位作成
PUT    /api/v1/positions/{id}                # 職位更新
DELETE /api/v1/positions/{id}                # 職位削除

// 部門マスタAPI
GET    /api/v1/departments                   # 部門一覧取得
GET    /api/v1/departments/{id}              # 部門詳細取得
POST   /api/v1/departments                   # 部門作成
PUT    /api/v1/departments/{id}              # 部門更新
DELETE /api/v1/departments/{id}              # 部門削除
GET    /api/v1/departments/tree              # 部門階層構造取得

// 操作権限マスタAPI
GET    /api/v1/permissions                   # 権限一覧取得
GET    /api/v1/permissions/{id}              # 権限詳細取得
POST   /api/v1/permissions                   # 権限作成
PUT    /api/v1/permissions/{id}              # 権限更新
DELETE /api/v1/permissions/{id}              # 権限削除
GET    /api/v1/permissions/by-module/{module} # モジュール別権限取得
```

## 共通フロントエンド設計

### 8. マスタテーブル共通コンポーネント

```typescript
// システムレベル権限マスタの型定義
interface SystemLevel {
  id: number;
  code: string;
  name: string;
  display_name: string;
  description: string;
  priority: number;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// 職位マスタの型定義
interface Position {
  id: number;
  code: string;
  name: string;
  display_name: string;
  description: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// 部門マスタの型定義
interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  parent_id: number | null;
  level: number;
  path: string;
  sort_order: number;
  manager_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  children?: Department[];
}

// 操作権限マスタの型定義
interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
  module: string;
  action: string;
  resource: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// マスタ選択コンポーネント
interface MasterSelector<T> {
  selectedItem: T | null;
  availableItems: T[];
  onItemChange: (item: T) => void;
  isRequired: boolean;
  placeholder?: string;
  displayField: keyof T;
  valueField: keyof T;
}

// 部門階層選択コンポーネント
interface DepartmentTreeSelector {
  selectedDepartment: Department | null;
  departmentTree: Department[];
  onDepartmentChange: (department: Department) => void;
  isRequired: boolean;
  placeholder?: string;
}
```

## データ整合性・制約

### 9. マスタテーブル共通制約

#### 9.1 外部キー制約
- 部門マスタの`parent_id`は自身のテーブルを参照
- 部門マスタの`manager_id`はユーザーテーブルを参照
- 各マスタテーブルの`created_by`はユーザーテーブルを参照

#### 9.2 一意性制約
- システムレベル権限マスタの`code`は一意
- 職位マスタの`code`は一意
- 部門マスタの`code`は一意
- 操作権限マスタの`name`は一意
- 工事種別マスタの`type_code`は一意

#### 9.3 階層構造制約
- 部門マスタの階層レベルは親部門のレベル+1
- 部門マスタのパスは親部門のパス+自身のコード
- 階層の深さは最大5レベルまで

### 10. パフォーマンス最適化

#### 10.1 インデックス戦略
- 各マスタテーブルの主キーに自動インデックス
- 一意制約のあるカラムにインデックス
- 検索頻度の高いカラムにインデックス
- 階層構造のパス検索用インデックス

#### 10.2 キャッシュ戦略
- マスタデータは頻繁に変更されないため、アプリケーションレベルでキャッシュ
- 階層構造データはツリー形式でキャッシュ
- 権限データはユーザーセッションでキャッシュ

この設計により、システム全体で使用するマスタデータを統一的に管理し、権限管理、組織管理、工事種別管理を効率的に実現できます。

## 工事分類マスタテーブル

### 1. テーブル定義

```sql
-- 工事分類マスタテーブル（見積明細・実行予算内訳用）
CREATE TABLE construction_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classification_code VARCHAR(20) UNIQUE NOT NULL,             -- 分類コード
    classification_name VARCHAR(100) NOT NULL,                   -- 分類名称
    subject_code VARCHAR(10) NOT NULL,                           -- 科目CD
    description TEXT,                                            -- 説明
    display_order INTEGER DEFAULT 0,                             -- 表示順序
    is_active BOOLEAN DEFAULT true,                              -- 有効フラグ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 工事分類マスタのインデックス
CREATE INDEX idx_construction_classifications_code ON construction_classifications(classification_code);
CREATE INDEX idx_construction_classifications_display_order ON construction_classifications(display_order);
CREATE INDEX idx_construction_classifications_active ON construction_classifications(is_active);
```

### 2. カラム詳細

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY | 工事分類ID（自動採番） |
| classification_code | VARCHAR(20) | UNIQUE NOT NULL | 分類コード（一意） |
| classification_name | VARCHAR(100) | NOT NULL | 分類名称 |
| subject_code | VARCHAR(10) | NOT NULL | 科目CD |
| description | TEXT | - | 説明 |
| display_order | INTEGER | DEFAULT 0 | 表示順序 |
| is_active | BOOLEAN | DEFAULT true | 有効フラグ |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新日時 |

### 3. 基本データ

```sql
-- 工事分類マスタの基本データ
INSERT INTO construction_classifications (classification_code, classification_name, subject_code, display_order) VALUES
('LABOR_COSTS', '労務費', '10', 10),
('VEHICLE_COSTS', '車両費', '20', 20),
('MATERIAL_LABOR', '材料（材工）費', '30', 30),
('OUTSOURCING', '外注費', '40', 40),
('RENTAL', '賃借費', '50', 50),
('SITE_EXPENSES', '現場経費', '60', 60),
('INDUSTRIAL_WASTE', '産廃処理', '70', 70),
('MATERIALS_ONLY', '材料のみ', '80', 80);
```

### 4. API設計

```php
// 工事分類マスタAPI
GET    /api/v1/construction-classifications                 # 工事分類一覧取得
GET    /api/v1/construction-classifications/{id}            # 工事分類詳細取得
POST   /api/v1/construction-classifications                 # 工事分類作成
PUT    /api/v1/construction-classifications/{id}            # 工事分類更新
DELETE /api/v1/construction-classifications/{id}            # 工事分類削除

// 工事分類検索API
GET    /api/v1/construction-classifications/search          # 工事分類検索
GET    /api/v1/construction-classifications/active          # 有効な工事分類一覧取得
```

### 5. フロントエンド設計

```typescript
// 工事分類マスタの型定義
interface ConstructionClassification {
  id: string;                     // 工事分類ID
  classification_code: string;     // 分類コード
  classification_name: string;     // 分類名称
  subject_code: string;           // 科目CD
  description: string;            // 説明
  display_order: number;          // 表示順序
  is_active: boolean;             // 有効フラグ
  created_at: Date;               // 作成日時
  updated_at: Date;               // 更新日時
}

// 工事分類選択コンポーネント
interface ConstructionClassificationSelector {
  selectedClassification: ConstructionClassification | null;
  availableClassifications: ConstructionClassification[];
  onClassificationChange: (classification: ConstructionClassification) => void;
  isRequired: boolean;
  placeholder?: string;
}
```

### 6. 工事種別マスタとの違い

#### 6.1 工事種別マスタ（project_types）
- **用途**: 見積・工事の基本情報で使用
- **内容**: 土木一式、建築一式、防水工事などの大分類
- **特徴**: 経費率（一般管理費率、原価経費率、材料経費率）を管理

#### 6.2 工事分類マスタ（construction_classifications）
- **用途**: 見積明細・実行予算内訳で使用
- **内容**: 労務費、車両費、材料（材工）費、外注費などの原価分類
- **特徴**: 見積明細での選択リスト、実行予算内訳での集計に使用

この設計により、工事種別マスタと工事分類マスタを適切に使い分け、見積・工事の基本情報と実行予算内訳の管理を効率的に実現できます。

