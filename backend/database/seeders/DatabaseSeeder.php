<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('データベースの初期設定を開始します...');
        
        // 必須のseederを実行順序で実行
        $this->call([
            // 1. 基本マスタデータ
            TaxRateSeeder::class,
            DepartmentSeeder::class,
            PositionSeeder::class,
            RoleSeeder::class,
            
            // 2. ユーザー・社員データ
            UserSeeder::class,
            
            // 3. 権限マスタの作成（ビジネスコードより先に必要）
            PermissionSeeder::class,
            
            // 4. ビジネスコードの初期設定（必須）
            BusinessCodeSeeder::class,
            
            // 5. システム権限レベルの初期設定
            SystemLevelSeeder::class,
            SystemLevelPermissionSeeder::class,
            
            // 6. 権限設定
            RolePermissionSeeder::class,
            UserRoleSeeder::class,
            
            // 7. その他のマスタデータ
            ProjectTypesSeeder::class,
            PartnersSeeder::class,
            ConstructionClassificationsSeeder::class,
            PermissionCategorySeeder::class,
            
            // 8. テストデータ
            EstimateSeeder::class,
            AccessPolicySeeder::class,
            ApprovalFlowSeeder::class,
        ]);
        
        $this->command->info('データベースの初期設定が完了しました。');
        
        // ビジネスコードの整合性チェック
        $businessCodeSeeder = new BusinessCodeSeeder();
        $businessCodeSeeder->validateBusinessCodes();
    }
}