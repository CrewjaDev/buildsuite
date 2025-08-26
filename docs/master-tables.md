# マスタテーブル 詳細仕様書

## 概要
BuildSuiteシステムで使用するマスタテーブルの詳細仕様書です。
各種マスタデータの定義、構造、基本データについて説明します。

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

