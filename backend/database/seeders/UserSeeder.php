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
            'login_id' => 'admin',
            'employee_id' => 'ADMIN001',
            'name' => 'システム管理者',
            'name_kana' => 'システムカンリシャ',
            'email' => 'admin@buildsuite.local',
            'password' => Hash::make('password123'),
            'gender' => 'male',
            'phone' => '03-1234-5678',
            'mobile_phone' => '090-1234-5678',
            'postal_code' => '100-0001',
            'prefecture' => '東京都',
            'address' => '千代田区千代田1-1-1',
            'position_id' => 5, // 取締役
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

        // システム管理者に営業部を割り当て
        DB::table('user_departments')->insert([
            'user_id' => $adminUserId,
            'department_id' => 1, // 営業部
            'is_primary' => true,
            'assigned_at' => now(),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // テストユーザーを作成
        $testUsers = [
            [
                'login_id' => 'yamada',
                'employee_id' => 'EMP001',
                'name' => '山田太郎',
                'name_kana' => 'ヤマダタロウ',
                'email' => 'yamada@buildsuite.local',
                'password' => Hash::make('password123'),
                'gender' => 'male',
                'phone' => '03-2345-6789',
                'mobile_phone' => '090-2345-6789',
                'postal_code' => '100-0002',
                'prefecture' => '東京都',
                'address' => '千代田区千代田2-2-2',
                'position_id' => 2, // 担当
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
                'login_id' => 'sato',
                'employee_id' => 'EMP002',
                'name' => '佐藤花子',
                'name_kana' => 'サトウハナコ',
                'email' => 'sato@buildsuite.local',
                'password' => Hash::make('password123'),
                'gender' => 'female',
                'phone' => '03-3456-7890',
                'mobile_phone' => '090-3456-7890',
                'postal_code' => '100-0003',
                'prefecture' => '東京都',
                'address' => '千代田区千代田3-3-3',
                'position_id' => 1, // 社員
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

            // 部署を割り当て（営業部）
            DB::table('user_departments')->insert([
                'user_id' => $userId,
                'department_id' => 1, // 営業部
                'is_primary' => true,
                'assigned_at' => now(),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // 100件のランダムユーザーを作成
        $roles = ['admin', 'manager', 'user'];
        $systemLevels = ['executive', 'accounting_manager', 'office_manager', 'construction_manager', 'supervisor', 'estimator', 'staff'];
        $positionIds = [1, 2, 3, 4, 5]; // 社員, 担当, 課長, 部長, 取締役
        $departmentIds = [1, 2, 3, 4, 5, 6, 7, 8]; // 営業部, 経理部, 工事部, 調査設計室, 土木事業部, 建設事業部, 東京支店, 福岡支店
        $genders = ['male', 'female', 'other'];
        $jobTitles = ['営業部長', '工事部長', '経理部長', '営業課長', '工事課長', '経理課長', '営業主任', '工事主任', '営業担当', '工事担当', '経理担当', '見積担当'];
        $prefectures = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'];
        $lastNames = ['田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水'];
        $firstNames = ['太郎', '次郎', '三郎', '花子', '美子', '恵子', '健一', '正一', '和子', '雅子', '博', '誠', '明', '清', '正', '義', '勇', '智', '恵', '美'];

        for ($i = 1; $i <= 100; $i++) {
            $role = $roles[array_rand($roles)];
            $systemLevel = $systemLevels[array_rand($systemLevels)];
            $positionId = $positionIds[array_rand($positionIds)];
            $departmentId = $departmentIds[array_rand($departmentIds)];
            $gender = $genders[array_rand($genders)];
            $jobTitle = $jobTitles[array_rand($jobTitles)];
            $prefecture = $prefectures[array_rand($prefectures)];
            $lastName = $lastNames[array_rand($lastNames)];
            $firstName = $firstNames[array_rand($firstNames)];
            
            // 入社日をランダムに生成（2015年〜2024年の間）
            $hireYear = rand(2015, 2024);
            $hireMonth = rand(1, 12);
            $hireDay = rand(1, 28);
            $hireDate = date('Y-m-d', strtotime("$hireYear-$hireMonth-$hireDay"));
            
            // 勤続年数と月数を計算
            $hireDateTime = new \DateTime($hireDate);
            $now = new \DateTime();
            $interval = $now->diff($hireDateTime);
            $serviceYears = $interval->y;
            $serviceMonths = $interval->m;

            $userId = DB::table('users')->insertGetId([
                'login_id' => strtolower($lastName . $firstName . $i),
                'employee_id' => 'EMP' . str_pad($i + 2, 6, '0', STR_PAD_LEFT),
                'name' => $lastName . $firstName,
                'name_kana' => strtoupper($lastName . $firstName),
                'email' => strtolower($lastName . $firstName . $i) . '@buildsuite.local',
                'password' => Hash::make('password123'),
                'gender' => $gender,
                'phone' => '03-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT) . '-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                'mobile_phone' => '090-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT) . '-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                'postal_code' => str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT) . '-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                'prefecture' => $prefecture,
                'address' => $prefecture . 'の住所' . $i,
                'position_id' => $positionId,
                'job_title' => $jobTitle,
                'hire_date' => $hireDate,
                'service_years' => $serviceYears,
                'service_months' => $serviceMonths,
                'system_level' => $systemLevel,
                'is_active' => rand(1, 10) <= 9, // 90%の確率でアクティブ
                'is_admin' => $role === 'admin',
                'email_verified_at' => now(),
                'created_at' => date('Y-m-d H:i:s', strtotime('-' . rand(0, 365) . ' days')),
                'updated_at' => now()
            ]);
            
            // 役割を割り当て
            $roleId = DB::table('roles')->where('name', $role)->value('id');
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

            // 部署を割り当て（プライマリ部署として）
            DB::table('user_departments')->insert([
                'user_id' => $userId,
                'department_id' => $departmentId,
                'is_primary' => true,
                'assigned_at' => now(),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }
}