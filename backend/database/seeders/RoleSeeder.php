<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 既存の役割をクリア
        DB::table('roles')->truncate();
        
        $roles = [
            // 経理・財務関連
            [
                'name' => 'accounting_manager',
                'display_name' => '経理責任者',
                'description' => '経理・財務に特化した権限を持つ',
                'priority' => 6,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'accounting_staff',
                'display_name' => '経理担当',
                'description' => '経理業務に特化した権限を持つ',
                'priority' => 2,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // 事務管理関連
            [
                'name' => 'office_manager',
                'display_name' => '事務長',
                'description' => '事務管理に特化した権限を持つ',
                'priority' => 5,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'office_staff',
                'display_name' => '事務担当',
                'description' => '事務業務に特化した権限を持つ',
                'priority' => 2,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // 工事関連
            [
                'name' => 'construction_manager',
                'display_name' => '工事責任者',
                'description' => '工事管理に特化した権限を持つ',
                'priority' => 4,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'construction_staff',
                'display_name' => '工事担当',
                'description' => '工事業務に特化した権限を持つ',
                'priority' => 2,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // 見積関連
            [
                'name' => 'estimator_senior',
                'display_name' => '上級見積担当',
                'description' => '複雑な見積業務に特化した権限を持つ',
                'priority' => 3,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'estimator',
                'display_name' => '見積担当',
                'description' => '見積業務に特化した権限を持つ',
                'priority' => 2,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // 営業関連
            [
                'name' => 'sales_manager',
                'display_name' => '営業マネージャー',
                'description' => '営業管理に特化した権限を持つ',
                'priority' => 4,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'sales_staff',
                'display_name' => '営業担当',
                'description' => '営業業務に特化した権限を持つ',
                'priority' => 2,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // システム管理関連
            [
                'name' => 'system_manager',
                'display_name' => 'システム管理者',
                'description' => 'システム管理に特化した権限を持つ',
                'priority' => 8,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($roles as $role) {
            DB::table('roles')->insert($role);
        }
    }
}