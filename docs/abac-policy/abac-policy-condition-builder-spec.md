# ABACポリシー条件設定UI仕様書

## 概要

現在のJSON直接入力方式から、ユーザーフレンドリーな条件設定UIに変更し、ポリシーの作成・編集を直感的に行えるようにする。

## 目標

- 非技術者でも簡単にポリシー条件を設定できる
- 入力ミスを減らし、バリデーション機能を強化する
- よく使われる条件パターンをテンプレート化する
- リアルタイムで条件式の結果をプレビューできる

## 機能要件

### 1. 条件タイプ

#### 1.1 数値比較条件
- **対象フィールド**: `data.amount`, `user.position_id`, `user.department_id` など
- **オペレーター**: `=`, `!=`, `>`, `>=`, `<`, `<=`, `範囲内`, `範囲外`
- **値入力**: 数値入力フィールド、範囲指定（最小値〜最大値）

#### 1.2 文字列比較条件
- **対象フィールド**: `user.name`, `data.status`, `data.category` など
- **オペレーター**: `=`, `!=`, `含む`, `含まない`, `で始まる`, `で終わる`
- **値入力**: テキスト入力フィールド

#### 1.3 選択条件
- **対象フィールド**: `user.department_id`, `user.position_id`, `data.status` など
- **オペレーター**: `=`, `!=`, `含む`, `含まない`
- **値入力**: ドロップダウン選択（既存データから選択）

#### 1.4 存在チェック条件
- **対象フィールド**: 任意のフィールド
- **オペレーター**: `存在する`, `存在しない`
- **値入力**: 不要

#### 1.5 日付比較条件
- **対象フィールド**: `data.created_at`, `data.updated_at` など
- **オペレーター**: `=`, `!=`, `より前`, `より後`, `範囲内`
- **値入力**: 日付選択、日付範囲指定

### 2. フィールド定義

#### 2.1 ユーザー関連フィールド
```typescript
const userFields = [
  { key: 'user_id', label: 'ユーザーID', type: 'number' },
  { key: 'user.name', label: 'ユーザー名', type: 'string' },
  { key: 'user.department_id', label: '部署ID', type: 'select', options: 'departments' },
  { key: 'user.position_id', label: '職位ID', type: 'select', options: 'positions' },
  { key: 'user.system_level', label: 'システムレベル', type: 'select', options: 'system_levels' },
  { key: 'user.is_active', label: 'アクティブ状態', type: 'boolean' }
];
```

#### 2.2 データ関連フィールド
```typescript
const dataFields = [
  { key: 'data.amount', label: '金額', type: 'number' },
  { key: 'data.status', label: 'ステータス', type: 'select', options: 'statuses' },
  { key: 'data.created_by', label: '作成者ID', type: 'number' },
  { key: 'data.department_id', label: 'データ部署ID', type: 'select', options: 'departments' },
  { key: 'data.created_at', label: '作成日時', type: 'date' }
];
```

#### 2.3 リソース関連フィールド
```typescript
const resourceFields = [
  { key: 'resource.id', label: 'リソースID', type: 'number' },
  { key: 'resource.type', label: 'リソースタイプ', type: 'string' },
  { key: 'resource.owner_id', label: '所有者ID', type: 'number' }
];
```

### 3. オペレーター定義

#### 3.1 数値用オペレーター
```typescript
const numberOperators = [
  { key: 'eq', label: '等しい', inputType: 'number' },
  { key: 'ne', label: '等しくない', inputType: 'number' },
  { key: 'gt', label: 'より大きい', inputType: 'number' },
  { key: 'gte', label: '以上', inputType: 'number' },
  { key: 'lt', label: 'より小さい', inputType: 'number' },
  { key: 'lte', label: '以下', inputType: 'number' },
  { key: 'between', label: '範囲内', inputType: 'range' },
  { key: 'not_between', label: '範囲外', inputType: 'range' }
];
```

#### 3.2 文字列用オペレーター
```typescript
const stringOperators = [
  { key: 'eq', label: '等しい', inputType: 'text' },
  { key: 'ne', label: '等しくない', inputType: 'text' },
  { key: 'contains', label: '含む', inputType: 'text' },
  { key: 'not_contains', label: '含まない', inputType: 'text' },
  { key: 'starts_with', label: 'で始まる', inputType: 'text' },
  { key: 'ends_with', label: 'で終わる', inputType: 'text' }
];
```

#### 3.3 選択用オペレーター
```typescript
const selectOperators = [
  { key: 'eq', label: '等しい', inputType: 'select' },
  { key: 'ne', label: '等しくない', inputType: 'select' },
  { key: 'in', label: '含む', inputType: 'multi-select' },
  { key: 'nin', label: '含まない', inputType: 'multi-select' }
];
```

#### 3.4 存在チェック用オペレーター
```typescript
const existenceOperators = [
  { key: 'exists', label: '存在する', inputType: 'none' },
  { key: 'not_exists', label: '存在しない', inputType: 'none' }
];
```

### 4. UI構成

#### 4.1 条件設定エリア
```
┌─────────────────────────────────────────────────────────┐
│ 条件設定                                                │
├─────────────────────────────────────────────────────────┤
│ 論理演算子: [AND ▼] [OR ▼]                             │
│                                                         │
│ ┌─ 条件 1 ───────────────────────────────────────────┐ │
│ │ フィールド: [ユーザー.部署ID ▼]                    │ │
│ │ オペレーター: [等しい ▼]                           │ │
│ │ 値: [営業部 ▼]                                     │ │
│ │ [削除]                                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ 条件 2 ───────────────────────────────────────────┐ │
│ │ フィールド: [データ.金額 ▼]                        │ │
│ │ オペレーター: [より大きい ▼]                       │ │
│ │ 値: [1000000] (円)                                 │ │
│ │ [削除]                                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ 条件を追加]                                          │
└─────────────────────────────────────────────────────────┘
```

#### 4.2 プレビューエリア
```
┌─────────────────────────────────────────────────────────┐
│ 条件式プレビュー                                        │
├─────────────────────────────────────────────────────────┤
│ 生成された条件式:                                       │
│ {                                                       │
│   "operator": "and",                                    │
│   "rules": [                                            │
│     {                                                   │
│       "field": "user.department_id",                    │
│       "operator": "eq",                                 │
│       "value": 1                                        │
│     },                                                  │
│     {                                                   │
│       "field": "data.amount",                           │
│       "operator": "gt",                                 │
│       "value": 1000000                                  │
│     }                                                   │
│   ]                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

#### 4.3 テストエリア
```
┌─────────────────────────────────────────────────────────┐
│ 条件テスト                                              │
├─────────────────────────────────────────────────────────┤
│ テストコンテキスト:                                     │
│ {                                                       │
│   "user": {                                             │
│     "id": 1,                                            │
│     "department_id": 1,                                 │
│     "position_id": 2                                    │
│   },                                                    │
│   "data": {                                             │
│     "amount": 1500000,                                  │
│     "status": "draft"                                   │
│   }                                                     │
│ }                                                       │
│                                                         │
│ [テスト実行] 結果: 拒否 (条件に一致)                    │
└─────────────────────────────────────────────────────────┘
```

### 5. テンプレート機能

#### 5.1 よく使われる条件パターン
```typescript
const conditionTemplates = [
  {
    name: '部署別アクセス制限',
    description: '特定の部署のユーザーのみアクセス可能',
    conditions: [
      { field: 'user.department_id', operator: 'eq', value: '{{department_id}}' }
    ]
  },
  {
    name: '金額制限',
    description: '指定金額以上のデータへのアクセスを制限',
    conditions: [
      { field: 'data.amount', operator: 'gt', value: '{{amount}}' }
    ]
  },
  {
    name: '作成者権限',
    description: '作成者のみが編集可能',
    conditions: [
      { field: 'user_id', operator: 'eq', value: 'data.created_by' }
    ]
  },
  {
    name: 'ステータス別制限',
    description: '特定ステータスのデータへのアクセスを制限',
    conditions: [
      { field: 'data.status', operator: 'in', value: ['{{status1}}', '{{status2}}'] }
    ]
  }
];
```

### 6. バリデーション

#### 6.1 入力値バリデーション
- 数値フィールド: 数値形式チェック、範囲チェック
- 日付フィールド: 日付形式チェック、論理的な日付範囲チェック
- 選択フィールド: 選択肢の存在チェック
- 必須フィールド: 空値チェック

#### 6.2 条件式バリデーション
- 最低1つの条件が必要
- 論理演算子の適切な使用
- 循環参照のチェック
- 無効なフィールド参照のチェック

### 7. データ取得API

#### 7.1 フィールド定義取得
```
GET /api/access-policies/field-definitions
Response: {
  "user_fields": [...],
  "data_fields": [...],
  "resource_fields": [...]
}
```

#### 7.2 選択肢データ取得
```
GET /api/access-policies/options/departments
GET /api/access-policies/options/positions
GET /api/access-policies/options/system-levels
GET /api/access-policies/options/statuses
```

#### 7.3 テンプレート取得
```
GET /api/access-policies/templates
Response: {
  "templates": [...]
}
```

### 8. 実装フェーズ

#### Phase 1: 基本条件設定UI
- 単一条件の設定
- 基本的なフィールド・オペレーター・値の選択
- JSON形式への変換

#### Phase 2: 複数条件・論理演算子
- 複数条件の追加・削除
- AND/OR演算子の選択
- 条件の並び替え

#### Phase 3: 高度な機能
- テンプレート機能
- プレビュー機能
- テスト機能

#### Phase 4: 最適化・拡張
- パフォーマンス最適化
- 追加フィールドタイプの対応
- カスタムオペレーターの追加

### 9. 技術仕様

#### 9.1 コンポーネント構成
```
PolicyConditionBuilder/
├── index.tsx                    # メインコンポーネント
├── ConditionRow.tsx            # 個別条件行
├── FieldSelector.tsx           # フィールド選択
├── OperatorSelector.tsx        # オペレーター選択
├── ValueInput.tsx              # 値入力
├── LogicOperatorSelector.tsx   # 論理演算子選択
├── ConditionPreview.tsx        # プレビュー表示
├── ConditionTester.tsx         # テスト機能
└── templates/
    ├── TemplateSelector.tsx    # テンプレート選択
    └── TemplateEditor.tsx      # テンプレート編集
```

#### 9.2 データ構造
```typescript
interface PolicyCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  valueType: 'single' | 'multiple' | 'range' | 'none';
}

interface PolicyConditionGroup {
  id: string;
  operator: 'and' | 'or';
  conditions: (PolicyCondition | PolicyConditionGroup)[];
}
```

### 10. ユーザビリティ要件

#### 10.1 操作性
- ドラッグ&ドロップでの条件並び替え
- キーボードショートカット対応
- 自動保存機能
- 元に戻す/やり直し機能

#### 10.2 視覚性
- 条件の階層構造を視覚的に表現
- 色分けによる条件タイプの識別
- アイコンによる直感的な操作
- レスポンシブデザイン対応

#### 10.3 ヘルプ機能
- ツールチップによる説明
- サンプル条件の表示
- エラーメッセージの詳細説明
- チュートリアル機能

## まとめ

この仕様により、技術者でなくても直感的にABACポリシーの条件を設定できるようになり、システムの柔軟性と使いやすさが大幅に向上します。段階的な実装により、リスクを最小化しながら機能を拡張していくことが可能です。
