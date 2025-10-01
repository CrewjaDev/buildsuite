<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemLevel;

class SystemLevelSeeder extends Seeder
{
    /**
     * システム権限レベルの初期設定
     */
    public function run(): void
    {
        $this->command->info('システム権限レベルの初期設定を開始します...');
        
        $systemLevels = [
            [
                'code' => 'staff',
                'name' => 'staff',
                'display_name' => '一般社員',
                'description' => '基本的な業務権限を持つ一般社員レベル',
                'priority' => 1,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'supervisor',
                'name' => 'supervisor',
                'display_name' => '上長',
                'description' => '部下の管理と承認権限を持つ上長レベル',
                'priority' => 2,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'manager',
                'name' => 'manager',
                'display_name' => '管理者',
                'description' => '部署や部門の管理権限を持つ管理者レベル',
                'priority' => 3,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'admin',
                'name' => 'admin',
                'display_name' => 'システム管理者',
                'description' => 'システム全体の管理権限を持つ管理者レベル',
                'priority' => 4,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'executive',
                'name' => 'executive',
                'display_name' => '最高責任者',
                'description' => '組織の最高責任者レベル',
                'priority' => 5,
                'is_system' => true,
                'is_active' => true,
            ],
        ];
        
        $createdCount = 0;
        $updatedCount = 0;
        
        foreach ($systemLevels as $levelData) {
            $systemLevel = SystemLevel::updateOrCreate(
                ['code' => $levelData['code']],
                $levelData
            );
            
            if ($systemLevel->wasRecentlyCreated) {
                $createdCount++;
                $this->command->info("システム権限レベル '{$levelData['code']}' を作成しました");
            } else {
                $updatedCount++;
                $this->command->info("システム権限レベル '{$levelData['code']}' を更新しました");
            }
        }
        
        $this->command->info("システム権限レベルの初期設定が完了しました。");
        $this->command->info("作成: {$createdCount}件, 更新: {$updatedCount}件");
    }
}