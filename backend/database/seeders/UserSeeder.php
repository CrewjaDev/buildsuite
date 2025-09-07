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
        // システム管理者の社員情報を作成
        $adminEmployeeId = DB::table('employees')->insertGetId([
            'employee_id' => 'ADMIN001',
            'name' => 'システム管理者',
            'name_kana' => 'システムカンリシャ',
            'email' => 'admin@buildsuite.local',
            'birth_date' => '1980-01-01',
            'gender' => 'male',
            'phone' => '03-1234-5678',
            'mobile_phone' => '090-1234-5678',
            'postal_code' => '100-0001',
            'prefecture' => '東京都',
            'address' => '千代田区千代田1-1-1',
            'position_id' => 5, // 取締役
            'department_id' => 1, // 営業部
            'job_title' => 'システム管理者',
            'hire_date' => '2020-01-01',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // システム管理者ユーザーを作成
        $adminUserId = DB::table('users')->insertGetId([
            'login_id' => 'admin',
            'employee_id' => $adminEmployeeId,
            'password' => Hash::make('password123'),
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
                'employee_id' => 'EMP001',
                'name' => '山田太郎',
                'name_kana' => 'ヤマダタロウ',
                'email' => 'yamada@buildsuite.local',
                'birth_date' => '1985-03-15',
                'gender' => 'male',
                'phone' => '03-2345-6789',
                'mobile_phone' => '090-2345-6789',
                'postal_code' => '100-0002',
                'prefecture' => '東京都',
                'address' => '千代田区千代田2-2-2',
                'position_id' => 2, // 担当
                'job_title' => '営業主任',
                'hire_date' => '2020-04-01',
                'is_active' => true,
                'login_id' => 'yamada',
                'password' => Hash::make('password123'),
                'system_level' => 'supervisor',
                'is_admin' => false,
                'email_verified_at' => now()
            ],
            [
                'employee_id' => 'EMP002',
                'name' => '佐藤花子',
                'name_kana' => 'サトウハナコ',
                'email' => 'sato@buildsuite.local',
                'birth_date' => '1990-07-22',
                'gender' => 'female',
                'phone' => '03-3456-7890',
                'mobile_phone' => '090-3456-7890',
                'postal_code' => '100-0003',
                'prefecture' => '東京都',
                'address' => '千代田区千代田3-3-3',
                'position_id' => 1, // 社員
                'job_title' => '営業担当',
                'hire_date' => '2021-04-01',
                'is_active' => true,
                'login_id' => 'sato',
                'password' => Hash::make('password123'),
                'system_level' => 'staff',
                'is_admin' => false,
                'email_verified_at' => now()
            ]
        ];

        foreach ($testUsers as $userData) {
            // 社員情報を作成
            $employeeId = DB::table('employees')->insertGetId([
                'employee_id' => $userData['employee_id'],
                'name' => $userData['name'],
                'name_kana' => $userData['name_kana'],
                'email' => $userData['email'],
                'birth_date' => $userData['birth_date'],
                'gender' => $userData['gender'],
                'phone' => $userData['phone'],
                'mobile_phone' => $userData['mobile_phone'],
                'postal_code' => $userData['postal_code'],
                'prefecture' => $userData['prefecture'],
                'address' => $userData['address'],
                'position_id' => $userData['position_id'],
                'department_id' => 1, // 営業部
                'job_title' => $userData['job_title'],
                'hire_date' => $userData['hire_date'],
                'is_active' => $userData['is_active'],
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // ユーザー情報を作成
            $userId = DB::table('users')->insertGetId([
                'login_id' => $userData['login_id'],
                'employee_id' => $employeeId,
                'password' => $userData['password'],
                'system_level' => $userData['system_level'],
                'is_active' => true,
                'is_admin' => $userData['is_admin'],
                'email_verified_at' => $userData['email_verified_at'],
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
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

        // ランダムユーザー作成は一旦無効化（新しいテーブル構造に対応するため）
        // TODO: 新しいテーブル構造に対応したランダムユーザー作成を実装
        /*
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
        */
    }
}