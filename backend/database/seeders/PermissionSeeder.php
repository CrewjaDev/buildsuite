<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * ビジネスコード定義に基づいて権限を生成
     * BusinessCodeServiceの定義から自動生成
     */
    public function run(): void
    {
        // 環境変数から処理モードを取得
        $forceUpdate = env('PERMISSION_SEEDER_FORCE_UPDATE', false);
        $updateOnly = env('PERMISSION_SEEDER_UPDATE_ONLY', false);
        
        if ($forceUpdate) {
            echo "強制更新モード: 既存データを更新します\n";
            $this->createPermissionsFromBusinessCodes(true);
        } elseif ($updateOnly) {
            echo "更新のみモード: 既存データのみを更新します\n";
            $this->updateExistingPermissions();
        } else {
            echo "初期設定モード: 新規データのみを作成します\n";
            $this->createPermissionsFromBusinessCodes(false);
        }
    }

    /**
     * ビジネスコード定義から権限を生成
     */
    private function createPermissionsFromBusinessCodes(bool $forceUpdate = false): void
    {
        $allBusinessCodes = \App\Services\BusinessCodeService::getSeederDefaultBusinessCodes();
        
        foreach ($allBusinessCodes as $code => $config) {
            foreach ($config['default_permissions'] as $permissionName) {
                $this->createPermissionFromName($permissionName, $code, $config['is_system'], $forceUpdate);
            }
        }
    }

    /**
     * 権限名から権限レコードを作成
     */
    private function createPermissionFromName(string $permissionName, string $module, bool $isSystem = false, bool $forceUpdate = false): void
    {
        // 完全な権限名を生成: module + permissionName
        $fullPermissionName = $module . '.' . $permissionName;
        
        // アクション部分を抽出
        $parts = explode('.', $permissionName);
        if (count($parts) >= 2) {
            $action = implode('.', array_slice($parts, 1)); // 複数階層のアクション対応
        } else {
            $action = $permissionName; // 単一のアクション
        }
        
        $permission = [
            'name' => $fullPermissionName,
            'display_name' => $this->generateDisplayName($permissionName, $module),
            'description' => $this->generateDescription($permissionName, $module),
            'module' => $module,
            'action' => $action,
            'resource' => null,
            'is_system' => $isSystem
        ];
        
        $this->createPermission($permission, $forceUpdate);
    }

    /**
     * 表示名を生成
     */
    private function generateDisplayName(string $permissionName, string $module): string
    {
        $moduleNames = [
            // システム固定コード
            'role' => '役割設定',
            'department' => '部署',
            'system' => 'システム権限設定',
            'approval' => '承認設定',
            'employee' => '社員設定',
            'partner' => '取引先設定',
            'permission' => '権限設定',
            // ビジネスロジックコード
            'estimate' => '見積',
            'budget' => '予算',
            'purchase' => '発注',
            'construction' => '工事',
            'general' => '一般'
        ];
        
        $actionNames = [
            'use' => '利用',
            'list' => '一覧',
            'view' => '照会',
            'create' => '作成',
            'edit' => '編集',
            'delete' => '削除',
            'flow.list' => '承認フロー一覧',
            'flow.create' => '承認フロー作成',
            'flow.view' => '承認フロー照会',
            'flow.edit' => '承認フロー編集',
            'flow.delete' => '承認フロー削除',
            'approval.request' => '承認依頼作成',
            'approval.list' => '承認依頼一覧',
            'approval.view' => '承認依頼照会',
            'approval.approve' => '承認',
            'approval.reject' => '却下',
            'approval.return' => '差し戻し',
            'approval.cancel' => '承認依頼キャンセル',
            'approval.authority' => '承認者機能利用',
        ];
        
        $moduleName = $moduleNames[$module] ?? $module;
        
        // 承認設定モジュールの場合は、権限名全体をチェック
        if ($module === 'approval' && isset($actionNames[$permissionName])) {
            return $moduleName . $actionNames[$permissionName];
        }
        
        $action = str_replace($module . '.', '', $permissionName);
        $actionName = $actionNames[$action] ?? $action;
        
        return $moduleName . $actionName;
    }

    /**
     * 説明を生成
     */
    private function generateDescription(string $permissionName, string $module): string
    {
        $moduleNames = [
            // システム固定コード
            'role' => '役割設定',
            'department' => '部署設定',
            'system' => 'システム権限設定',
            'approval' => '承認設定',
            'employee' => '社員設定',
            'partner' => '取引先設定',
            'permission' => '権限設定',
            // ビジネスロジックコード
            'estimate' => '見積',
            'budget' => '予算',
            'purchase' => '発注',
            'construction' => '工事',
            'general' => '一般'
        ];
        
        $actionNames = [
            'use' => '利用',
            'list' => '一覧',
            'view' => '照会',
            'create' => '作成',
            'edit' => '編集',
            'delete' => '削除',
            'flow.list' => '承認フロー一覧',
            'flow.create' => '承認フロー作成',
            'flow.view' => '承認フロー照会',
            'flow.edit' => '承認フロー編集',
            'flow.delete' => '承認フロー削除',
            'approval.request' => '承認依頼作成',
            'approval.list' => '承認依頼一覧',
            'approval.view' => '承認依頼照会',
            'approval.approve' => '承認',
            'approval.reject' => '却下',
            'approval.return' => '差し戻し',
            'approval.cancel' => 'キャンセル',
            'approval.authority' => '承認者機能利用',
        ];
        
        $moduleName = $moduleNames[$module] ?? $module;
        
        // 承認設定モジュールの場合は、権限名全体をチェック
        if ($module === 'approval' && isset($actionNames[$permissionName])) {
            return $moduleName . $actionNames[$permissionName];
        }
        
        $action = str_replace($module . '.', '', $permissionName);
        $actionName = $actionNames[$action] ?? $action . 'する権限';
        
        return $moduleName . 'を' . $actionName;
    }

    /**
     * 権限レコードを作成
     */
    private function createPermission(array $permission, bool $forceUpdate = false): void
    {
        $existingPermission = DB::table('permissions')
            ->where('name', $permission['name'])
            ->first();
        
        if (!$existingPermission) {
            // 新規作成
            DB::table('permissions')->insert([
                'name' => $permission['name'],
                'display_name' => $permission['display_name'],
                'description' => $permission['description'],
                'module' => $permission['module'],
                'action' => $permission['action'],
                'resource' => $permission['resource'],
                'is_system' => $permission['is_system'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            echo "新規作成: {$permission['name']}\n";
        } elseif ($forceUpdate) {
            // 強制更新
            DB::table('permissions')
                ->where('name', $permission['name'])
                ->update([
                    'display_name' => $permission['display_name'],
                    'description' => $permission['description'],
                    'updated_at' => now()
                ]);
            echo "更新: {$permission['name']}\n";
        } else {
            // 既存データはスキップ
            echo "スキップ: {$permission['name']} (既存)\n";
        }
    }

    /**
     * 既存権限のみを更新
     */
    private function updateExistingPermissions(): void
    {
        echo "既存権限の表示名と説明を更新中...\n";
        
        $allBusinessCodes = \App\Services\BusinessCodeService::getSeederDefaultBusinessCodes();
        
        foreach ($allBusinessCodes as $code => $config) {
            foreach ($config['default_permissions'] as $permissionName) {
                $this->updatePermissionFromName($permissionName, $code);
            }
        }
    }

    /**
     * 既存権限の表示名と説明を更新
     */
    private function updatePermissionFromName(string $permissionName, string $module): void
    {
        // 完全な権限名を生成: module + permissionName
        $fullPermissionName = $module . '.' . $permissionName;
        
        $existingPermission = DB::table('permissions')
            ->where('name', $fullPermissionName)
            ->first();
        
        if ($existingPermission) {
            $displayName = $this->generateDisplayName($permissionName, $module);
            $description = $this->generateDescription($permissionName, $module);
            
            DB::table('permissions')
                ->where('name', $fullPermissionName)
                ->update([
                    'display_name' => $displayName,
                    'description' => $description,
                    'updated_at' => now()
                ]);
            
            echo "更新: {$fullPermissionName} -> {$displayName}\n";
        } else {
            echo "スキップ: {$fullPermissionName} (存在しない)\n";
        }
    }
}
