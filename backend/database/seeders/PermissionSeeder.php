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
        // ビジネスコード定義から権限を生成
        $this->createPermissionsFromBusinessCodes();
    }

    /**
     * ビジネスコード定義から権限を生成
     */
    private function createPermissionsFromBusinessCodes(): void
    {
        $allBusinessCodes = \App\Services\BusinessCodeService::getSeederDefaultBusinessCodes();
        
        foreach ($allBusinessCodes as $code => $config) {
            foreach ($config['default_permissions'] as $permissionName) {
                $this->createPermissionFromName($permissionName, $code, $config['is_system']);
            }
        }
    }

    /**
     * 権限名から権限レコードを作成
     */
    private function createPermissionFromName(string $permissionName, string $module, bool $isSystem = false): void
    {
        // permissionName: "estimate.view" -> action: "view"
        $parts = explode('.', $permissionName);
        if (count($parts) >= 2) {
            $action = implode('.', array_slice($parts, 1)); // 複数階層のアクション対応
            
            $permission = [
                'name' => $permissionName,
                'display_name' => $this->generateDisplayName($permissionName, $module),
                'description' => $this->generateDescription($permissionName, $module),
                'module' => $module,
                'action' => $action,
                'resource' => null,
                'is_system' => $isSystem
            ];
            
            $this->createPermission($permission);
        }
    }

    /**
     * 表示名を生成
     */
    private function generateDisplayName(string $permissionName, string $module): string
    {
        $moduleNames = [
            // システム固定コード
            'role' => '役割',
            'department' => '部署',
            'system' => 'システム',
            'approval' => '承認',
            'employee' => '社員',
            'partner' => '取引先',
            'permission' => '権限',
            // ビジネスロジックコード
            'estimate' => '見積',
            'budget' => '予算',
            'purchase' => '発注',
            'construction' => '工事',
            'general' => '一般'
        ];
        
        $actionNames = [
            'use' => '利用',
            'view' => '閲覧',
            'create' => '作成',
            'edit' => '編集',
            'delete' => '削除',
            'approval.request' => '承認依頼作成',
            'approval.view' => '承認依頼閲覧',
            'approval.approve' => '承認',
            'approval.reject' => '却下',
            'approval.return' => '差し戻し',
            'approval.cancel' => '承認依頼キャンセル'
        ];
        
        $moduleName = $moduleNames[$module] ?? $module;
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
            'role' => '役割',
            'department' => '部署',
            'system' => 'システム',
            'approval' => '承認',
            'employee' => '社員',
            'partner' => '取引先',
            'permission' => '権限',
            // ビジネスロジックコード
            'estimate' => '見積',
            'budget' => '予算',
            'purchase' => '発注',
            'construction' => '工事',
            'general' => '一般'
        ];
        
        $actionNames = [
            'use' => '機能を利用する権限',
            'view' => '閲覧する権限',
            'create' => '作成する権限',
            'edit' => '編集する権限',
            'delete' => '削除する権限',
            'approval.request' => '承認依頼を作成する権限',
            'approval.view' => '承認依頼を閲覧する権限',
            'approval.approve' => '承認する権限',
            'approval.reject' => '却下する権限',
            'approval.return' => '差し戻す権限',
            'approval.cancel' => '承認依頼をキャンセルする権限'
        ];
        
        $moduleName = $moduleNames[$module] ?? $module;
        $action = str_replace($module . '.', '', $permissionName);
        $actionName = $actionNames[$action] ?? $action . 'する権限';
        
        return $moduleName . 'を' . $actionName;
    }

    /**
     * 権限レコードを作成
     */
    private function createPermission(array $permission): void
    {
            $existingPermission = DB::table('permissions')
                ->where('name', $permission['name'])
                ->first();
            
            if (!$existingPermission) {
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
        }
    }
}
