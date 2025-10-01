<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\BusinessCode;
use App\Models\Permission;
use App\Services\BusinessCodeService;

class BusinessCodeSeeder extends Seeder
{
    /**
     * ビジネスコードの初期設定を実行
     * 
     * このseederは必須であり、システムの正常動作に必要です。
     * ビジネスコードとそのデフォルト権限を確実に設定します。
     */
    public function run(): void
    {
        $this->command->info('ビジネスコードの初期設定を開始します...');
        
        // ビジネスコードの定義を取得（シーダー専用メソッドを使用）
        $businessCodeDefinitions = BusinessCodeService::getSeederDefaultBusinessCodes();
        
        $createdCount = 0;
        $updatedCount = 0;
        
        foreach ($businessCodeDefinitions as $code => $definition) {
            // ビジネスコードの作成または更新
            $businessCode = BusinessCode::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'category' => $definition['category'],
                    'is_system' => $definition['is_system'],
                    'is_core' => $definition['is_core'],
                    'settings' => $definition['settings'] ?? [],
                    'is_active' => true,
                ]
            );
            
            if ($businessCode->wasRecentlyCreated) {
                $createdCount++;
                $this->command->info("ビジネスコード '{$code}' を作成しました");
            } else {
                $updatedCount++;
                $this->command->info("ビジネスコード '{$code}' を更新しました");
            }
            
            // デフォルト権限の設定
            $this->setDefaultPermissions($businessCode, $definition['default_permissions']);
        }
        
        $this->command->info("ビジネスコードの初期設定が完了しました。");
        $this->command->info("作成: {$createdCount}件, 更新: {$updatedCount}件");
    }
    
    /**
     * ビジネスコードのデフォルト権限を設定
     */
    private function setDefaultPermissions(BusinessCode $businessCode, array $defaultPermissionNames): void
    {
        // 既存のデフォルト権限を削除
        DB::table('business_code_permissions')
            ->where('business_code_id', $businessCode->id)
            ->where('is_default', true)
            ->delete();
        
        $permissionIds = [];
        
        foreach ($defaultPermissionNames as $permissionName) {
            $permission = Permission::where('name', $permissionName)->first();
            
            if ($permission) {
                $permissionIds[] = $permission->id;
            } else {
                $this->command->warn("権限 '{$permissionName}' が見つかりません。ビジネスコード: {$businessCode->code}");
            }
        }
        
        // デフォルト権限を一括挿入
        if (!empty($permissionIds)) {
            $insertData = [];
            $now = now();
            
            foreach ($permissionIds as $permissionId) {
                $insertData[] = [
                    'business_code_id' => $businessCode->id,
                    'permission_id' => $permissionId,
                    'is_default' => true,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            
            DB::table('business_code_permissions')->insert($insertData);
            $this->command->info("  → デフォルト権限を " . count($permissionIds) . " 件設定しました");
        }
    }
    
    /**
     * ビジネスコードの整合性チェック
     */
    public function validateBusinessCodes(): bool
    {
        $this->command->info('ビジネスコードの整合性をチェックしています...');
        
        $businessCodeDefinitions = BusinessCodeService::getSeederDefaultBusinessCodes();
        $errors = [];
        
        foreach ($businessCodeDefinitions as $code => $definition) {
            $businessCode = BusinessCode::where('code', $code)->first();
            
            if (!$businessCode) {
                $errors[] = "ビジネスコード '{$code}' がデータベースに存在しません";
                continue;
            }
            
            // デフォルト権限のチェック
            $defaultPermissions = $businessCode->permissions()
                ->wherePivot('is_default', true)
                ->get();
            
            $expectedPermissionNames = $definition['default_permissions'];
            $actualPermissionNames = $defaultPermissions->pluck('name')->toArray();
            
            $missingPermissions = array_diff($expectedPermissionNames, $actualPermissionNames);
            $extraPermissions = array_diff($actualPermissionNames, $expectedPermissionNames);
            
            if (!empty($missingPermissions)) {
                $errors[] = "ビジネスコード '{$code}' に不足している権限: " . implode(', ', $missingPermissions);
            }
            
            if (!empty($extraPermissions)) {
                $errors[] = "ビジネスコード '{$code}' に余分な権限: " . implode(', ', $extraPermissions);
            }
        }
        
        if (empty($errors)) {
            $this->command->info('ビジネスコードの整合性チェックが完了しました。問題はありません。');
            return true;
        } else {
            $this->command->error('ビジネスコードの整合性に問題があります:');
            foreach ($errors as $error) {
                $this->command->error("  - {$error}");
            }
            return false;
        }
    }
}
