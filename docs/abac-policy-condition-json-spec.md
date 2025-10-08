# ABACポリシー条件式JSON仕様書

## 概要

この仕様書は、ABAC（Attribute-Based Access Control）ポリシーの条件式をJSON形式で表現する際の構造とルールを定義します。

## 基本構造

### 条件式の基本形式

```json
{
  "operator": "and" | "or",
  "rules": [
    // 条件ルールの配列
  ]
}
```

### 条件ルールの種類

#### 1. 属性条件（Attribute Condition）

```json
{
  "field": "user.department_id",
  "operator": "in",
  "value": [1, 2, 3]
}
```

**フィールド**:
- `user.department_id`: ユーザーの部署ID
- `user.position_id`: ユーザーの職位ID
- `user.system_level`: ユーザーのシステムレベル
- `user.roles`: ユーザーの役割
- `user.id`: ユーザーID
- `data.department_id`: データの部署ID
- `data.created_by`: データの作成者
- `data.amount`: データの金額
- `data.status`: データのステータス
- `data.created_at`: データの作成日時
- `current_time.hour`: 現在時刻（時間）
- `current_time.weekday`: 現在時刻（曜日）
- `request.ip`: リクエストのIPアドレス

**注意**: `user.access_restriction` は特別なフィールドで、フロントエンドで生成されるが、バックエンドに送信される前に展開される

**演算子**:
- `in`: 含む（配列内の値のいずれかと一致）
- `gte`: 以上（数値比較）
- `lte`: 以下（数値比較）
- `eq`: 等しい
- `ne`: 等しくない
- `gt`: より大きい
- `lt`: より小さい
- `exists`: 存在する
- `regex`: 正規表現マッチ
- `and`: 論理AND（ネストした条件用）
- `or`: 論理OR（ネストした条件用）

**注意**: `nin` は定義されているが、現在の実装では使用されていない

**値の型**:
- 数値: `1`, `2`, `3`
- 文字列: `"承認済み"`, `"2025-01-01"`
- 配列: `[1, 2, 3]`, `["承認済み", "承認依頼中"]`

#### 2. 論理条件（Logical Condition）

```json
{
  "operator": "and" | "or",
  "rules": [
    // ネストした条件ルールの配列
  ]
}
```

## 構造ルール

### 1. 基本ルール

1. **ルートレベル**: 必ず `operator` と `rules` を持つ
2. **rules配列**: 条件ルールの配列（空配列は不可）
3. **ネスト制限**: 最大5階層まで

### 2. 属性条件のルール

1. **必須フィールド**: `field`, `operator`, `value`
2. **フィールド名**: 上記で定義されたフィールドのみ使用可能
3. **演算子**: 上記で定義された演算子のみ使用可能
4. **値の型**: 演算子に応じた適切な型を使用

### 3. 論理条件のルール

1. **必須フィールド**: `operator`, `rules`
2. **フィールド**: `field` は不要
3. **演算子**: `and` または `or` のみ
4. **rules配列**: 空配列は不可、少なくとも1つの条件を含む

### 4. 値の型制約

#### 数値フィールド
- `user.department_id`, `user.position_id`, `user.system_level`, `user.id`, `data.department_id`, `data.created_by`, `data.amount`
- 演算子: `in`, `gte`, `lte`, `eq`, `ne`, `gt`, `lt`
- 値: 数値または数値配列

#### 文字列フィールド
- `user.roles`, `data.status`, `data.created_at`, `current_time.hour`, `current_time.weekday`, `request.ip`
- 演算子: `in`, `eq`, `ne`, `regex`
- 値: 文字列または文字列配列

#### 日時フィールド
- `data.created_at`, `current_time.hour`, `current_time.weekday`
- 演算子: `gte`, `lte`, `eq`, `ne`
- 値: 日時文字列（ISO 8601形式）または数値

## 実装上の制約

### 1. フロントエンド制約

1. **空の配列の除外**: `value` が空配列の条件は送信しない
2. **無効な条件の除外**: `field` または `operator` が未設定の条件は送信しない
3. **ネストした条件の展開**: `user.access_restriction` フィールドは展開してネストした条件を直接親レベルに移動
4. **値の型変換**: `gte`/`lte` 演算子の場合は配列値を単一の数値に変換
5. **オブジェクト形式の変換**: ネストした条件の `rules` がオブジェクト形式の場合は配列形式に変換

### 2. バックエンド制約

1. **バリデーション**: 上記の構造ルールに従ってバリデーション
2. **演算子の制限**: 定義された演算子のみ許可（`nin` は除外）
3. **フィールドの制限**: 定義されたフィールドのみ許可
4. **値の型チェック**: 演算子に応じた適切な型をチェック
5. **再帰的バリデーション**: ネストした条件式も同様にバリデーション
6. **エラーメッセージ**: 日本語で分かりやすいエラーメッセージを提供

## 例

### 例1: 基本的な条件式

```json
{
  "operator": "and",
  "rules": [
    {
      "field": "user.department_id",
      "operator": "in",
      "value": [1, 2, 3]
    },
    {
      "field": "user.system_level",
      "operator": "gte",
      "value": 2
    }
  ]
}
```

### 例2: ネストした条件式

```json
{
  "operator": "and",
  "rules": [
    {
      "field": "data.department_id",
      "operator": "in",
      "value": [1, 2, 3]
    },
    {
      "operator": "and",
      "rules": [
        {
          "field": "user.department_id",
          "operator": "in",
          "value": [1, 2, 3]
        },
        {
          "field": "user.system_level",
          "operator": "gte",
          "value": 2
        }
      ]
    }
  ]
}
```

### 例3: 複雑な条件式

```json
{
  "operator": "and",
  "rules": [
    {
      "field": "data.department_id",
      "operator": "in",
      "value": [1, 2, 3]
    },
    {
      "field": "data.amount",
      "operator": "lte",
      "value": 1000000
    },
    {
      "field": "data.status",
      "operator": "in",
      "value": ["承認済み", "承認依頼中"]
    },
    {
      "operator": "and",
      "rules": [
        {
          "field": "user.department_id",
          "operator": "in",
          "value": [1, 2, 3]
        },
        {
          "field": "user.system_level",
          "operator": "gte",
          "value": 2
        }
      ]
    },
    {
      "operator": "and",
      "rules": [
        {
          "field": "current_time.hour",
          "operator": "gte",
          "value": 9
        },
        {
          "field": "current_time.hour",
          "operator": "lt",
          "value": 18
        }
      ]
    }
  ]
}
```

## エラーハンドリング

### 1. バリデーションエラー

- **構造エラー**: JSONの構造が仕様に合わない場合
- **フィールドエラー**: 未定義のフィールドが使用された場合
- **演算子エラー**: 未定義の演算子が使用された場合
- **値の型エラー**: 演算子に適さない型の値が使用された場合

### 2. エラーメッセージ

- 日本語で分かりやすいエラーメッセージを提供
- エラーの箇所を特定できるインデックス情報を含む
- 修正方法のヒントを含む

### 3. 実装でのエラー処理例

```json
{
  "success": false,
  "message": "条件式のバリデーションエラー",
  "errors": [
    "rules[1].operatorは有効な値である必要があります",
    "rules[operator]は配列である必要があります",
    "rules[rules].fieldは必須です",
    "rules[rules].operatorは必須です"
  ]
}
```

### 4. フロントエンドでの事前検証

- 空の配列の除外
- 無効な条件の除外
- 型変換の実行
- 構造の正規化

## バージョン管理

- **v1.0**: 初期仕様（現在のバージョン）
- 将来の拡張時はバージョンを更新し、後方互換性を考慮

## 参考資料

- [ABACポリシー仕様書](./abac-policy-spec.md)
- [ユーザー属性設定仕様書](./user-attribute-settings-spec.md)
- [リソース属性設定仕様書](./resource-attribute-settings-spec.md)
