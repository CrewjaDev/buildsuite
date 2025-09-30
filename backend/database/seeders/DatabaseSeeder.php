<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 初期必須データ（マスターデータ）
        $this->call([
            // 1. 業務タイプ定義（完全ハードコーディングのため不要）
            // BusinessTypeSeeder::class,  // 削除：完全ハードコーディングに変更
            
            // 2. システム基盤
            SystemLevelSeeder::class,
            
            // 3. 組織構造
            DepartmentSeeder::class,
            PositionSeeder::class,
            
            // 4. 権限システム（業務タイプの後に実行）
            RoleSeeder::class,
            PermissionSeeder::class,          // ハイブリッド方式で権限生成
            SystemLevelPermissionSeeder::class,
            RolePermissionSeeder::class,
            PositionPermissionSeeder::class,
            DepartmentPermissionSeeder::class,
            
            // 5. ユーザー関連
            UserSeeder::class,
            UserRoleSeeder::class,
            
            // 6. 見積関連のマスターデータ
            PartnersSeeder::class,
            ProjectTypesSeeder::class,
            ConstructionClassificationsSeeder::class,
            
            // 7. 見積テストデータ
            EstimateSeeder::class,
            EstimateBreakdownSeeder::class,
            EstimateItemNewSeeder::class,
            
            // 8. 承認フローテストデータ
            ApprovalFlowSeeder::class,
        ]);
    }
}
