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
            // 1. 権限マスタの作成（ビジネスコードより先に必要）
            PermissionSeeder::class,
            
            // 2. ビジネスコードの初期設定（必須）
            BusinessCodeSeeder::class,
            
            // 3. システム権限レベルの初期設定
            SystemLevelSeeder::class,
            
            // 4. その他のseeder
            // UserSeeder::class,
            // RoleSeeder::class,
            // DepartmentSeeder::class,
            // PositionSeeder::class,
        ]);
        
        $this->command->info('データベースの初期設定が完了しました。');
        
        // ビジネスコードの整合性チェック
        $businessCodeSeeder = new BusinessCodeSeeder();
        $businessCodeSeeder->validateBusinessCodes();
    }
}