# 業務コード定義戦略

## 概要

業務コード（モジュールコード）の定義方法について、業務の性質に応じた最適な戦略を定義します。

## 定義方式の使い分け

### 1. システム固定コード（ハードコーディング）

**対象**: システム基盤に関わる業務
**理由**: 頻繁に変更されることがなく、システムの安定性が重要

```typescript
// システム固定の業務コード
export const SYSTEM_BUSINESS_CODES = {
  USER: 'user',
  ROLE: 'role', 
  DEPARTMENT: 'department',
  SYSTEM: 'system',
  APPROVAL: 'approval'
} as const;

export type SystemBusinessCode = typeof SYSTEM_BUSINESS_CODES[keyof typeof SYSTEM_BUSINESS_CODES];
```

### 2. データベース設定コード（現在の方式）

**対象**: ビジネスロジックに関わる業務
**理由**: 業務要件の変更に柔軟に対応する必要がある

```php
// business_types テーブルで管理
[
    'code' => 'estimate',      // 見積業務
    'code' => 'budget',        // 予算業務  
    'code' => 'construction',  // 工事業務
    'code' => 'purchase',      // 発注業務
]
```

## 実装方式

### 1. 業務コードの取得方法

```typescript
// 業務コード取得サービス
class BusinessCodeService {
  // システム固定コード
  private static readonly SYSTEM_CODES = {
    USER: 'user',
    ROLE: 'role',
    DEPARTMENT: 'department', 
    SYSTEM: 'system',
    APPROVAL: 'approval'
  };

  // データベースから動的コードを取得
  async getDynamicCodes(): Promise<string[]> {
    const businessTypes = await businessTypeService.getActiveBusinessTypes();
    return businessTypes.map(bt => bt.code);
  }

  // 全業務コードを取得
  async getAllCodes(): Promise<string[]> {
    const systemCodes = Object.values(BusinessCodeService.SYSTEM_CODES);
    const dynamicCodes = await this.getDynamicCodes();
    return [...systemCodes, ...dynamicCodes];
  }

  // 業務コードの種類を判定
  isSystemCode(code: string): boolean {
    return Object.values(BusinessCodeService.SYSTEM_CODES).includes(code);
  }

  isDynamicCode(code: string): boolean {
    return !this.isSystemCode(code);
  }
}
```

### 2. 権限生成の自動化

```php
// PermissionSeeder の改良版
class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // システム固定権限
        $this->createSystemPermissions();
        
        // 動的業務権限（business_types から生成）
        $this->createDynamicPermissions();
    }

    private function createSystemPermissions(): void
    {
        $systemPermissions = [
            // ユーザー管理
            ['name' => 'user.view', 'module' => 'user', 'action' => 'view'],
            ['name' => 'user.create', 'module' => 'user', 'action' => 'create'],
            ['name' => 'user.edit', 'module' => 'user', 'action' => 'edit'],
            ['name' => 'user.delete', 'module' => 'user', 'action' => 'delete'],
            
            // 役割管理
            ['name' => 'role.view', 'module' => 'role', 'action' => 'view'],
            ['name' => 'role.create', 'module' => 'role', 'action' => 'create'],
            ['name' => 'role.edit', 'module' => 'role', 'action' => 'edit'],
            ['name' => 'role.delete', 'module' => 'role', 'action' => 'delete'],
            
            // システム管理
            ['name' => 'system.view', 'module' => 'system', 'action' => 'view'],
            ['name' => 'system.edit', 'module' => 'system', 'action' => 'edit'],
        ];

        foreach ($systemPermissions as $permission) {
            $this->createPermission($permission, true); // is_system = true
        }
    }

    private function createDynamicPermissions(): void
    {
        $businessTypes = BusinessType::where('is_active', true)->get();
        
        foreach ($businessTypes as $businessType) {
            // デフォルト権限を生成
            if ($businessType->default_permissions) {
                foreach ($businessType->default_permissions as $permissionName) {
                    $this->createPermissionFromName($permissionName, $businessType->code);
                }
            }
        }
    }

    private function createPermissionFromName(string $permissionName, string $module): void
    {
        // permissionName: "estimate.view" -> module: "estimate", action: "view"
        $parts = explode('.', $permissionName);
        if (count($parts) >= 2) {
            $action = implode('.', array_slice($parts, 1)); // 複数階層のアクション対応
            $this->createPermission([
                'name' => $permissionName,
                'module' => $module,
                'action' => $action
            ], false); // is_system = false
        }
    }
}
```

### 3. フロントエンドでの型安全性

```typescript
// 業務コードの型定義
export const SYSTEM_BUSINESS_CODES = {
  USER: 'user',
  ROLE: 'role',
  DEPARTMENT: 'department',
  SYSTEM: 'system',
  APPROVAL: 'approval'
} as const;

// 動的業務コード（APIから取得）
export type DynamicBusinessCode = string;

// 全業務コードの型
export type BusinessCode = typeof SYSTEM_BUSINESS_CODES[keyof typeof SYSTEM_BUSINESS_CODES] | DynamicBusinessCode;

// 権限名の型
export type PermissionName = `${BusinessCode}.${string}`;

// 権限チェック関数
export function hasPermission(user: User, permission: PermissionName): boolean {
  return user.permissions?.includes(permission) ?? false;
}
```

## 運用方針

### 1. システム固定コードの追加

**条件**: 以下のいずれかに該当する場合
- システム基盤に関わる機能
- 頻繁に変更されることがない機能
- セキュリティ上重要な機能

**手順**:
1. `SYSTEM_BUSINESS_CODES` に追加
2. 対応する権限を `PermissionSeeder` に追加
3. フロントエンドの型定義を更新
4. アプリケーションを再デプロイ

### 2. 動的業務コードの追加

**条件**: 以下のいずれかに該当する場合
- ビジネスロジックに関わる機能
- 業務要件の変更に応じて追加・変更される可能性がある機能
- 運用中に追加される可能性がある機能

**手順**:
1. `business_types` テーブルに新しいレコードを追加
2. `default_permissions` に必要な権限を定義
3. 権限を自動生成（seeder実行または管理画面から）
4. アプリケーションの再デプロイは不要

## 移行計画

### Phase 1: 現状維持
- 現在の `business_types` テーブル方式を継続
- システム固定コードの概念を導入

### Phase 2: ハイブリッド化
- システム固定コードを分離
- 権限生成の自動化を実装

### Phase 3: 最適化
- パフォーマンス最適化
- 管理画面での業務コード管理機能

## まとめ

**推奨**: ハイブリッド方式
- **システム固定**: ユーザー管理、役割管理、システム管理など
- **データベース設定**: 見積、予算、工事、発注など

この方式により、システムの安定性と運用の柔軟性を両立できます。

---

**作成日**: 2024年1月21日
**更新日**: 2024年1月21日
**作成者**: AI Assistant
