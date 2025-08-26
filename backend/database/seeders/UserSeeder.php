<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // システム管理者ユーザーを作成
        $adminUserId = DB::table('users')->insertGetId([
            'employee_id' => 'ADMIN001',
            'name' => 'システム管理者',
            'name_kana' => 'システムカンリシャ',
            'email' => 'admin@buildsuite.local',
            'password' => Hash::make('password123'),
            'phone' => '03-1234-5678',
            'mobile_phone' => '090-1234-5678',
            'postal_code' => '100-0001',
            'prefecture' => '東京都',
            'address' => '千代田区千代田1-1-1',
            'position' => 'システム管理者',
            'job_title' => 'システム管理者',
            'hire_date' => '2020-01-01',
            'service_years' => 5,
            'service_months' => 0,
            'system_level' => 'system_admin',
            'is_active' => true,
            'is_admin' => true,
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // システム管理者にシステム管理者役割を割り当て
        $systemAdminRoleId = DB::table('roles')->where('name', 'system_admin')->value('id');
        if ($systemAdminRoleId) {
            DB::table('user_roles')->insert([
                'user_id' => $adminUserId,
                'role_id' => $systemAdminRoleId,
                'assigned_at' => now(),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // テストユーザーを作成
        $testUsers = [
            [
                'employee_id' => 'EMP001',
                'name' => '山田太郎',
                'name_kana' => 'ヤマダタロウ',
                'email' => 'yamada@buildsuite.local',
                'password' => Hash::make('password123'),
                'phone' => '03-2345-6789',
                'mobile_phone' => '090-2345-6789',
                'postal_code' => '100-0002',
                'prefecture' => '東京都',
                'address' => '千代田区千代田2-2-2',
                'position' => '主任',
                'job_title' => '営業主任',
                'hire_date' => '2020-04-01',
                'service_years' => 3,
                'service_months' => 6,
                'system_level' => 'supervisor',
                'is_active' => true,
                'is_admin' => false,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'employee_id' => 'EMP002',
                'name' => '佐藤花子',
                'name_kana' => 'サトウハナコ',
                'email' => 'sato@buildsuite.local',
                'password' => Hash::make('password123'),
                'phone' => '03-3456-7890',
                'mobile_phone' => '090-3456-7890',
                'postal_code' => '100-0003',
                'prefecture' => '東京都',
                'address' => '千代田区千代田3-3-3',
                'position' => '担当者',
                'job_title' => '営業担当',
                'hire_date' => '2021-04-01',
                'service_years' => 2,
                'service_months' => 6,
                'system_level' => 'staff',
                'is_active' => true,
                'is_admin' => false,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($testUsers as $userData) {
            $userId = DB::table('users')->insertGetId($userData);
            
            // 役割を割り当て
            $roleName = $userData['system_level'];
            $roleId = DB::table('roles')->where('name', $roleName)->value('id');
            if ($roleId) {
                DB::table('user_roles')->insert([
                    'user_id' => $userId,
                    'role_id' => $roleId,
                    'assigned_at' => now(),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }
}
