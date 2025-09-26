<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 既存のシステムレベルをクリア
        DB::table('system_levels')->truncate();
        
        $levels = [
            [
                'code' => 'system_admin',
                'name' => 'システム管理者',
                'display_name' => 'システム管理者',
                'description' => 'システム全体の管理権限を持つ',
                'priority' => 8,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'executive',
                'name' => '最高責任者',
                'display_name' => '最高責任者',
                'description' => '経営判断を行う権限を持つ',
                'priority' => 7,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'supervisor',
                'name' => '上長',
                'display_name' => '上長',
                'description' => '部下の業務を管理監督する権限を持つ',
                'priority' => 3,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'staff',
                'name' => '担当者',
                'display_name' => '担当者',
                'description' => '基本的な業務機能の利用権限',
                'priority' => 1,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($levels as $level) {
            DB::table('system_levels')->insert($level);
        }
    }
}
