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
        // システムレベルを先に作成
        $this->call([
            SystemLevelSeeder::class,
            DepartmentSeeder::class,
            PositionSeeder::class,
            RoleSeeder::class,
            PermissionSeeder::class,
            SystemLevelPermissionSeeder::class,
            RolePermissionSeeder::class,
            PositionPermissionSeeder::class,
            DepartmentPermissionSeeder::class,
            UserSeeder::class,
            UserRoleSeeder::class,
            // 見積関連のマスターデータ
            PartnersSeeder::class,
            ProjectTypesSeeder::class,
            ConstructionClassificationsSeeder::class,
            // 見積テストデータ
            EstimateSeeder::class,
            EstimateBreakdownSeeder::class,
            EstimateItemNewSeeder::class,
            // 承認フローテストデータ
            BusinessTypeSeeder::class,
            ApprovalFlowSeeder::class,
        ]);
    }
}
