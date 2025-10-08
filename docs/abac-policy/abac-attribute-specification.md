# ABAC属性仕様書

## 概要

本仕様書では、ABAC（属性ベースアクセス制御）におけるユーザー属性とリソース属性の定義、分類、設定方法について詳細に説明します。

## 目次

1. [属性の基本概念](#属性の基本概念)
2. [ユーザー属性（User Attributes）](#ユーザー属性user-attributes)
3. [リソース属性（Resource Attributes）](#リソース属性resource-attributes)
4. [環境属性（Environment Attributes）](#環境属性environment-attributes)
5. [アクション属性（Action Attributes）](#アクション属性action-attributes)
6. [属性の組み合わせ](#属性の組み合わせ)
7. [テンプレート設計](#テンプレート設計)
8. [ポリシー設定UI](#ポリシー設定ui)
9. [実装例](#実装例)

## 属性の基本概念

### ABACの4つの属性カテゴリ

ABACでは、アクセス制御の決定に以下の4つの属性カテゴリを使用します：

1. **ユーザー属性（User Attributes）**: アクセスを試行するユーザーの特性
2. **リソース属性（Resource Attributes）**: アクセス対象となるリソースの特性
3. **環境属性（Environment Attributes）**: アクセス時の環境条件
4. **アクション属性（Action Attributes）**: 実行しようとするアクション

### 属性の命名規則

```
{カテゴリ}.{プロパティ名}
例: user.department_id, data.created_by, environment.time
```

## ユーザー属性（User Attributes）

### 定義

アクセスを試行するユーザーの特性を表す属性。ユーザーの所属、権限、役割などの情報を含みます。

### 主要なユーザー属性

| 属性名 | データ型 | 説明 | 例 |
|--------|----------|------|-----|
| `user.id` | integer | ユーザーID | 12345 |
| `user.department_id` | integer | ユーザーの所属部署ID | 1 (営業部) |
| `user.position_id` | integer | ユーザーの職位ID | 3 (課長) |
| `user.role` | string | ユーザーのロール | "sales_manager" |
| `user.system_level` | string | ユーザーのシステムレベル | "system_admin" |
| `user.is_admin` | boolean | 管理者フラグ | true |
| `user.is_active` | boolean | アクティブフラグ | true |
| `user.created_at` | datetime | ユーザー作成日時 | "2024-01-01 00:00:00" |

### ユーザー属性ベースのテンプレート

#### 1. ユーザー部署制限テンプレート

```json
{
  "template_code": "user_department_restriction",
  "name": "ユーザー部署制限",
  "description": "特定部署のユーザーのみアクセス可能",
  "category": "ユーザー属性",
  "condition_rule": {
    "field": "user.department_id",
    "operator": "in",
    "value": "{{user_department_ids}}"
  },
  "parameters": {
    "required_fields": ["user.department_id"],
    "configurable_values": {
      "user_department_ids": {
        "type": "array",
        "label": "対象部署ID",
        "default": [],
        "description": "アクセス可能なユーザーの部署IDリスト"
      }
    }
  }
}
```

#### 2. ユーザー職位制限テンプレート

```json
{
  "template_code": "user_position_restriction",
  "name": "ユーザー職位制限",
  "description": "特定職位以上のユーザーのみアクセス可能",
  "category": "ユーザー属性",
  "condition_rule": {
    "field": "user.position_id",
    "operator": "in",
    "value": "{{allowed_positions}}"
  },
  "parameters": {
    "required_fields": ["user.position_id"],
    "configurable_values": {
      "allowed_positions": {
        "type": "array",
        "label": "許可職位ID",
        "default": [1, 2, 3],
        "description": "アクセス可能な職位のIDリスト"
      }
    }
  }
}
```

#### 3. ユーザーロール制限テンプレート

```json
{
  "template_code": "user_role_restriction",
  "name": "ユーザーロール制限",
  "description": "特定ロールのユーザーのみアクセス可能",
  "category": "ユーザー属性",
  "condition_rule": {
    "field": "user.role",
    "operator": "in",
    "value": "{{allowed_roles}}"
  },
  "parameters": {
    "required_fields": ["user.role"],
    "configurable_values": {
      "allowed_roles": {
        "type": "array",
        "label": "許可ロール",
        "default": ["sales_manager"],
        "description": "アクセス可能なロールのリスト"
      }
    }
  }
}
```

## リソース属性（Resource Attributes）

### 定義

アクセス対象となるリソース（データ）の特性を表す属性。データの作成者、所属、内容、状態などの情報を含みます。

### 主要なリソース属性

| 属性名 | データ型 | 説明 | 例 |
|--------|----------|------|-----|
| `data.id` | integer | データID | 67890 |
| `data.department_id` | integer | データの所属部署ID | 2 (工事部) |
| `data.created_by` | integer | データの作成者ID | 12345 |
| `data.created_at` | datetime | データの作成日時 | "2024-01-15 10:30:00" |
| `data.business_code` | string | ビジネスコード | "estimate" |
| `data.amount` | decimal | 金額 | 1000000.00 |
| `data.status` | string | ステータス | "approved" |
| `data.priority` | integer | 優先度 | 1 |
| `data.is_active` | boolean | アクティブフラグ | true |

### リソース属性ベースのテンプレート

#### 1. データ部署制限テンプレート

```json
{
  "template_code": "data_department_restriction",
  "name": "データ部署制限",
  "description": "特定部署が作成したデータのみアクセス可能",
  "category": "リソース属性",
  "condition_rule": {
    "field": "data.department_id",
    "operator": "in",
    "value": "{{data_department_ids}}"
  },
  "parameters": {
    "required_fields": ["data.department_id"],
    "configurable_values": {
      "data_department_ids": {
        "type": "array",
        "label": "対象部署ID",
        "default": [],
        "description": "アクセス可能なデータの部署IDリスト"
      }
    }
  }
}
```

#### 2. データ作成者制限テンプレート

```json
{
  "template_code": "data_creator_restriction",
  "name": "データ作成者制限",
  "description": "自分が作成したデータのみアクセス可能",
  "category": "リソース属性",
  "condition_rule": {
    "field": "data.created_by",
    "operator": "eq",
    "value": "user.id"
  },
  "parameters": {
    "required_fields": ["data.created_by", "user.id"],
    "configurable_values": {}
  }
}
```

#### 3. データ金額制限テンプレート

```json
{
  "template_code": "data_amount_restriction",
  "name": "データ金額制限",
  "description": "指定金額以上のデータのみアクセス可能",
  "category": "リソース属性",
  "condition_rule": {
    "field": "data.amount",
    "operator": "gte",
    "value": "{{min_amount}}"
  },
  "parameters": {
    "required_fields": ["data.amount"],
    "configurable_values": {
      "min_amount": {
        "type": "number",
        "label": "最小金額",
        "default": 0,
        "description": "アクセス可能な最小金額"
      }
    }
  }
}
```

#### 4. データ期間制限テンプレート

```json
{
  "template_code": "data_period_restriction",
  "name": "データ期間制限",
  "description": "指定期間内のデータのみアクセス可能",
  "category": "リソース属性",
  "condition_rule": {
    "operator": "and",
    "rules": [
      {
        "field": "data.created_at",
        "operator": "gte",
        "value": "{{start_date}}"
      },
      {
        "field": "data.created_at",
        "operator": "lte",
        "value": "{{end_date}}"
      }
    ]
  },
  "parameters": {
    "required_fields": ["data.created_at"],
    "configurable_values": {
      "start_date": {
        "type": "date",
        "label": "開始日",
        "default": null,
        "description": "アクセス可能な期間の開始日"
      },
      "end_date": {
        "type": "date",
        "label": "終了日",
        "default": null,
        "description": "アクセス可能な期間の終了日"
      }
    }
  }
}
```

## 環境属性（Environment Attributes）

### 定義

アクセス時の環境条件を表す属性。時間、場所、デバイス、ネットワークなどの情報を含みます。

### 主要な環境属性

| 属性名 | データ型 | 説明 | 例 |
|--------|----------|------|-----|
| `environment.time` | datetime | アクセス時刻 | "2024-01-15 14:30:00" |
| `environment.day_of_week` | integer | 曜日 (1-7) | 1 (月曜日) |
| `environment.ip_address` | string | IPアドレス | "192.168.1.100" |
| `environment.user_agent` | string | ユーザーエージェント | "Mozilla/5.0..." |
| `environment.location` | string | アクセス場所 | "office" |

### 環境属性ベースのテンプレート

#### 1. 時間制限テンプレート

```json
{
  "template_code": "time_restriction",
  "name": "時間制限",
  "description": "指定時間内のみアクセス可能",
  "category": "環境属性",
  "condition_rule": {
    "operator": "and",
    "rules": [
      {
        "field": "environment.time",
        "operator": "gte",
        "value": "{{start_time}}"
      },
      {
        "field": "environment.time",
        "operator": "lte",
        "value": "{{end_time}}"
      }
    ]
  },
  "parameters": {
    "required_fields": ["environment.time"],
    "configurable_values": {
      "start_time": {
        "type": "time",
        "label": "開始時間",
        "default": "09:00",
        "description": "アクセス可能な開始時間"
      },
      "end_time": {
        "type": "time",
        "label": "終了時間",
        "default": "18:00",
        "description": "アクセス可能な終了時間"
      }
    }
  }
}
```

## アクション属性（Action Attributes）

### 定義

実行しようとするアクションの特性を表す属性。操作の種類、重要度、影響範囲などの情報を含みます。

### 主要なアクション属性

| 属性名 | データ型 | 説明 | 例 |
|--------|----------|------|-----|
| `action.name` | string | アクション名 | "delete" |
| `action.type` | string | アクションタイプ | "destructive" |
| `action.risk_level` | string | リスクレベル | "high" |

## 属性の組み合わせ

### 基本的な組み合わせパターン

#### 1. AND条件（すべての条件を満たす）

```json
{
  "operator": "and",
  "rules": [
    {
      "field": "user.department_id",
      "operator": "eq",
      "value": 1
    },
    {
      "field": "data.business_code",
      "operator": "eq",
      "value": "estimate"
    }
  ]
}
```

**意味**: 営業部のユーザー かつ 見積データの場合のみアクセス可能

#### 2. OR条件（いずれかの条件を満たす）

```json
{
  "operator": "or",
  "rules": [
    {
      "field": "user.position_id",
      "operator": "eq",
      "value": 3
    },
    {
      "field": "user.system_level",
      "operator": "eq",
      "value": "system_admin"
    }
  ]
}
```

**意味**: 課長以上のユーザー または システム管理者の場合のみアクセス可能

#### 3. 複雑な組み合わせ

```json
{
  "operator": "and",
  "rules": [
    {
      "operator": "or",
      "rules": [
        {
          "field": "user.department_id",
          "operator": "eq",
          "value": 1
        },
        {
          "field": "user.department_id",
          "operator": "eq",
          "value": 2
        }
      ]
    },
    {
      "field": "data.amount",
      "operator": "lt",
      "value": 1000000
    }
  ]
}
```

**意味**: (営業部 または 工事部) かつ 金額100万円未満の場合のみアクセス可能

## テンプレート設計

### テンプレートの分類

#### 1. カテゴリ別分類

```
【ユーザー属性】
├── ユーザー部署制限
├── ユーザー職位制限
├── ユーザーロール制限
└── ユーザー管理者制限

【リソース属性】
├── データ部署制限
├── データ作成者制限
├── データ金額制限
├── データ期間制限
└── データステータス制限

【環境属性】
├── 時間制限
├── 曜日制限
└── 場所制限
```

#### 2. テンプレート命名規則

```
{属性カテゴリ}_{制限タイプ}_restriction

例:
- user_department_restriction
- data_creator_restriction
- environment_time_restriction
```

### テンプレートの共通構造

```json
{
  "template_code": "string",
  "name": "string",
  "description": "string",
  "category": "ユーザー属性|リソース属性|環境属性",
  "condition_type": "string",
  "condition_rule": {
    "field": "string",
    "operator": "string",
    "value": "mixed"
  },
  "parameters": {
    "required_fields": ["string"],
    "configurable_values": {
      "param_name": {
        "type": "string",
        "label": "string",
        "default": "mixed",
        "description": "string"
      }
    }
  },
  "applicable_actions": ["string"],
  "tags": ["string"],
  "is_system": "boolean",
  "is_active": "boolean",
  "priority": "integer",
  "metadata": "object"
}
```

## ポリシー設定UI

### UI設計の原則

#### 1. 属性カテゴリの明確な分離

```
ステップ2: テンプレート選択

【ユーザー属性の設定】
┌─────────────────────────────────────┐
│ □ ユーザー部署制限                  │
│   → 営業部のユーザーのみ            │
│                                     │
│ □ ユーザー職位制限                  │
│   → 課長以上のユーザーのみ          │
└─────────────────────────────────────┘

【リソース属性の設定】
┌─────────────────────────────────────┐
│ □ データ部署制限                    │
│   → 営業部が作成したデータのみ      │
│                                     │
│ □ データ作成者制限                  │
│   → 自分が作成したデータのみ        │
└─────────────────────────────────────┘

【環境属性の設定】
┌─────────────────────────────────────┐
│ □ 時間制限                          │
│   → 営業時間内のみ                  │
└─────────────────────────────────────┘
```

#### 2. 条件式の可視化

```
生成される条件式:

┌─────────────────────────────────────┐
│ ユーザー属性: user.department_id = 1 │
│ リソース属性: data.business_code =   │
│              "estimate"              │
│ 環境属性: environment.time が        │
│          営業時間内                  │
│                                     │
│ すべての条件を満たす場合のみ        │
│ アクセス可能                        │
└─────────────────────────────────────┘
```

#### 3. 設定結果のプレビュー

```
ポリシー設定結果:

【アクセス可能なユーザー】
• 営業部のユーザー

【アクセス可能なデータ】
• 見積データ

【アクセス可能な時間】
• 営業時間内（9:00-18:00）

【アクセス可能なアクション】
• 削除

→ 営業部のユーザーが営業時間内に見積データを削除可能
```

## 実装例

### 例1: 営業部のユーザーは見積データを削除可能

#### 設定手順

1. **ユーザー属性**: ユーザー部署制限テンプレート
   - 部署: 営業部

2. **リソース属性**: データビジネスコード制限テンプレート
   - ビジネスコード: estimate

3. **アクション**: delete

#### 生成される条件式

```json
{
  "operator": "and",
  "rules": [
    {
      "field": "user.department_id",
      "operator": "eq",
      "value": 1
    },
    {
      "field": "data.business_code",
      "operator": "eq",
      "value": "estimate"
    }
  ]
}
```

### 例2: 課長以上は100万円以上の見積データを承認可能

#### 設定手順

1. **ユーザー属性**: ユーザー職位制限テンプレート
   - 職位: 課長以上

2. **リソース属性**: データ金額制限テンプレート
   - 最小金額: 1000000

3. **アクション**: approve

#### 生成される条件式

```json
{
  "operator": "and",
  "rules": [
    {
      "field": "user.position_id",
      "operator": "gte",
      "value": 3
    },
    {
      "field": "data.amount",
      "operator": "gte",
      "value": 1000000
    }
  ]
}
```

### 例3: 営業時間内に自部署のデータのみ編集可能

#### 設定手順

1. **ユーザー属性**: ユーザー部署制限テンプレート
   - 部署: 営業部

2. **リソース属性**: データ部署制限テンプレート
   - 部署: 営業部

3. **環境属性**: 時間制限テンプレート
   - 開始時間: 09:00
   - 終了時間: 18:00

4. **アクション**: edit

#### 生成される条件式

```json
{
  "operator": "and",
  "rules": [
    {
      "field": "user.department_id",
      "operator": "eq",
      "value": 1
    },
    {
      "field": "data.department_id",
      "operator": "eq",
      "value": 1
    },
    {
      "operator": "and",
      "rules": [
        {
          "field": "environment.time",
          "operator": "gte",
          "value": "09:00"
        },
        {
          "field": "environment.time",
          "operator": "lte",
          "value": "18:00"
        }
      ]
    }
  ]
}
```

## まとめ

本仕様書では、ABACにおける属性の定義と分類、テンプレート設計、UI設計について詳細に説明しました。

### 重要なポイント

1. **属性の明確な分類**: ユーザー属性、リソース属性、環境属性、アクション属性の4つに分類
2. **テンプレートの体系化**: 属性カテゴリごとにテンプレートを整理
3. **UI設計の改善**: 属性カテゴリを明確に分離し、設定結果を可視化
4. **組み合わせの柔軟性**: 複数の属性を組み合わせた複雑な条件の実現

この仕様に基づいて実装することで、ユーザーが直感的に理解できるABACポリシー設定システムを構築できます。
