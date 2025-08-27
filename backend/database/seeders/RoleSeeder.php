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
        $roles = [
            [
                'name' => 'admin',
                'display_name' => '管理者',
                'description' => 'システム全体の管理権限を持つ',
                'priority' => 10,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'manager',
                'display_name' => 'マネージャー',
                'description' => '部下の業務を管理監督する権限を持つ',
                'priority' => 5,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'user',
                'display_name' => 'ユーザー',
                'description' => '基本的な業務機能の利用権限',
                'priority' => 1,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'system_admin',
                'display_name' => 'システム管理者',
                'description' => 'システム全体の管理権限を持つ',
                'priority' => 8,
                'is_system' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'executive',
                'display_name' => '最高責任者',
                'description' => '経営判断を行う権限を持つ',
                'priority' => 7,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
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
                'name' => 'supervisor',
                'display_name' => '上長',
                'description' => '部下の業務を管理監督する権限を持つ',
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
            [
                'name' => 'staff',
                'display_name' => '担当者',
                'description' => '基本的な業務機能の利用権限',
                'priority' => 1,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'sales',
                'display_name' => '営業担当者',
                'description' => '見積・受注管理を担当',
                'priority' => 2,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'construction',
                'display_name' => '工事担当者',
                'description' => '工事管理・出来高管理を担当',
                'priority' => 3,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'accounting',
                'display_name' => '経理担当者',
                'description' => '支払管理・経理処理を担当',
                'priority' => 4,
                'is_system' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'approver',
                'display_name' => '承認者',
                'description' => '各種承認処理を担当',
                'priority' => 5,
                'is_system' => false,
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
