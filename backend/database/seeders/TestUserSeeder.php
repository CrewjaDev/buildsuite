<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Position;
use App\Models\Role;
use App\Models\SystemLevel;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 部署データを取得
        $departments = [
            '営業部' => Department::find(1),
            '経理部' => Department::find(2),
            '工事部' => Department::find(3),
            '大阪支店' => Department::find(9),
            '東京支店' => Department::find(7),
            '福岡支店' => Department::find(8),
        ];

        // 職位データを取得
        $positions = [
            '取締役' => Position::find(5),
            '部長' => Position::find(4),
            '課長' => Position::find(3),
            '担当' => Position::find(2),
            '社員' => Position::find(1),
        ];

        // 役割データを取得
        $roles = [
            '経理責任者' => Role::find(1), // accounting_manager
            '工事責任者' => Role::find(5), // construction_manager
            '営業マネージャー' => Role::find(9), // sales_manager
            '見積担当' => Role::find(8), // estimator
            '工事担当' => Role::find(6), // construction_staff
            '経理担当' => Role::find(2), // accounting_staff
            '最高決裁者' => Role::find(12),
        ];

        // システム権限レベルデータを取得
        $systemLevels = [
            'システム管理者' => SystemLevel::find(4), // admin
            '管理者' => SystemLevel::find(3), // manager
            '上長' => SystemLevel::find(2), // supervisor
            '一般社員' => SystemLevel::find(1), // staff
        ];

        // テスト用ユーザーの組み合わせパターン
        $testUsers = [
            // 営業部
            ['name' => '営業部長田中', 'email' => 'tanaka@test.com', 'department' => '営業部', 'position' => '部長', 'role' => '営業マネージャー', 'system_level' => '管理者'],
            ['name' => '営業課長佐藤', 'email' => 'sato@test.com', 'department' => '営業部', 'position' => '課長', 'role' => '見積担当', 'system_level' => '上長'],
            ['name' => '営業担当山田', 'email' => 'yamada@test.com', 'department' => '営業部', 'position' => '担当', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '営業社員鈴木', 'email' => 'suzuki@test.com', 'department' => '営業部', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '営業社員高橋', 'email' => 'takahashi@test.com', 'department' => '営業部', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],

            // 経理部
            ['name' => '経理部長伊藤', 'email' => 'ito@test.com', 'department' => '経理部', 'position' => '部長', 'role' => '経理責任者', 'system_level' => '管理者'],
            ['name' => '経理課長加藤', 'email' => 'kato@test.com', 'department' => '経理部', 'position' => '課長', 'role' => '経理担当', 'system_level' => '上長'],
            ['name' => '経理担当林', 'email' => 'hayashi@test.com', 'department' => '経理部', 'position' => '担当', 'role' => '経理担当', 'system_level' => '一般社員'],
            ['name' => '経理社員森', 'email' => 'mori@test.com', 'department' => '経理部', 'position' => '社員', 'role' => '経理担当', 'system_level' => '一般社員'],
            ['name' => '経理社員清水', 'email' => 'shimizu@test.com', 'department' => '経理部', 'position' => '社員', 'role' => '経理担当', 'system_level' => '一般社員'],

            // 工事部
            ['name' => '工事部長斎藤', 'email' => 'saito@test.com', 'department' => '工事部', 'position' => '部長', 'role' => '工事責任者', 'system_level' => '管理者'],
            ['name' => '工事課長松本', 'email' => 'matsumoto@test.com', 'department' => '工事部', 'position' => '課長', 'role' => '工事担当', 'system_level' => '上長'],
            ['name' => '工事担当井上', 'email' => 'inoue@test.com', 'department' => '工事部', 'position' => '担当', 'role' => '工事担当', 'system_level' => '一般社員'],
            ['name' => '工事社員木村', 'email' => 'kimura@test.com', 'department' => '工事部', 'position' => '社員', 'role' => '工事担当', 'system_level' => '一般社員'],
            ['name' => '工事社員中村', 'email' => 'nakamura@test.com', 'department' => '工事部', 'position' => '社員', 'role' => '工事担当', 'system_level' => '一般社員'],

            // 大阪支店
            ['name' => '大阪支店長小林', 'email' => 'kobayashi@test.com', 'department' => '大阪支店', 'position' => '部長', 'role' => '営業マネージャー', 'system_level' => '管理者'],
            ['name' => '大阪課長吉田', 'email' => 'yoshida@test.com', 'department' => '大阪支店', 'position' => '課長', 'role' => '見積担当', 'system_level' => '上長'],
            ['name' => '大阪担当青木', 'email' => 'aoki@test.com', 'department' => '大阪支店', 'position' => '担当', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '大阪社員福田', 'email' => 'fukuda@test.com', 'department' => '大阪支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '大阪社員岡田', 'email' => 'okada@test.com', 'department' => '大阪支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],

            // 東京支店
            ['name' => '東京支店長近藤', 'email' => 'kondo@test.com', 'department' => '東京支店', 'position' => '部長', 'role' => '営業マネージャー', 'system_level' => '管理者'],
            ['name' => '東京課長石川', 'email' => 'ishikawa@test.com', 'department' => '東京支店', 'position' => '課長', 'role' => '見積担当', 'system_level' => '上長'],
            ['name' => '東京担当前田', 'email' => 'maeda@test.com', 'department' => '東京支店', 'position' => '担当', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '東京社員藤田', 'email' => 'fujita@test.com', 'department' => '東京支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '東京社員村上', 'email' => 'murakami@test.com', 'department' => '東京支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],

            // 福岡支店
            ['name' => '福岡支店長長谷川', 'email' => 'hasegawa@test.com', 'department' => '福岡支店', 'position' => '部長', 'role' => '営業マネージャー', 'system_level' => '管理者'],
            ['name' => '福岡課長橋本', 'email' => 'hashimoto@test.com', 'department' => '福岡支店', 'position' => '課長', 'role' => '見積担当', 'system_level' => '上長'],
            ['name' => '福岡担当西村', 'email' => 'nishimura@test.com', 'department' => '福岡支店', 'position' => '担当', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '福岡社員渡辺', 'email' => 'watanabe@test.com', 'department' => '福岡支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '福岡社員山口', 'email' => 'yamaguchi@test.com', 'department' => '福岡支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],

            // 取締役・最高決裁者
            ['name' => '取締役社長', 'email' => 'president@test.com', 'department' => '営業部', 'position' => '取締役', 'role' => '最高決裁者', 'system_level' => 'システム管理者'],
            ['name' => '取締役専務', 'email' => 'senior@test.com', 'department' => '経理部', 'position' => '取締役', 'role' => '最高決裁者', 'system_level' => '管理者'],
            ['name' => '取締役常務', 'email' => 'junior@test.com', 'department' => '工事部', 'position' => '取締役', 'role' => '最高決裁者', 'system_level' => '管理者'],

            // 追加のテストケース
            ['name' => '営業部員A', 'email' => 'sales_a@test.com', 'department' => '営業部', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '営業部員B', 'email' => 'sales_b@test.com', 'department' => '営業部', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '経理部員A', 'email' => 'account_a@test.com', 'department' => '経理部', 'position' => '社員', 'role' => '経理担当', 'system_level' => '一般社員'],
            ['name' => '経理部員B', 'email' => 'account_b@test.com', 'department' => '経理部', 'position' => '社員', 'role' => '経理担当', 'system_level' => '一般社員'],
            ['name' => '工事部員A', 'email' => 'construction_a@test.com', 'department' => '工事部', 'position' => '社員', 'role' => '工事担当', 'system_level' => '一般社員'],
            ['name' => '工事部員B', 'email' => 'construction_b@test.com', 'department' => '工事部', 'position' => '社員', 'role' => '工事担当', 'system_level' => '一般社員'],
            ['name' => '大阪部員A', 'email' => 'osaka_a@test.com', 'department' => '大阪支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '大阪部員B', 'email' => 'osaka_b@test.com', 'department' => '大阪支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '東京部員A', 'email' => 'tokyo_a@test.com', 'department' => '東京支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '東京部員B', 'email' => 'tokyo_b@test.com', 'department' => '東京支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '福岡部員A', 'email' => 'fukuoka_a@test.com', 'department' => '福岡支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => '福岡部員B', 'email' => 'fukuoka_b@test.com', 'department' => '福岡支店', 'position' => '社員', 'role' => '見積担当', 'system_level' => '一般社員'],
            ['name' => 'システム管理者', 'email' => 'admin@test.com', 'department' => '経理部', 'position' => '部長', 'role' => '経理責任者', 'system_level' => 'システム管理者'],
            ['name' => '管理者A', 'email' => 'manager_a@test.com', 'department' => '営業部', 'position' => '部長', 'role' => '営業マネージャー', 'system_level' => '管理者'],
            ['name' => '管理者B', 'email' => 'manager_b@test.com', 'department' => '工事部', 'position' => '部長', 'role' => '工事責任者', 'system_level' => '管理者'],
        ];

        $this->command->info('Creating test users...');

        // 既存のテストユーザー数を確認
        $existingTestUsers = User::where('login_id', 'like', '%@test.com')->count();
        $startIndex = $existingTestUsers + 1;

        foreach ($testUsers as $index => $userData) {
            $currentIndex = $startIndex + $index;
            
            // メールアドレスにインデックスを追加して重複を避ける
            $email = str_replace('@test.com', ".abac{$currentIndex}@test.com", $userData['email']);
            
            // 社員データを先に作成
            $employee = Employee::create([
                'employee_id' => 'TEST' . str_pad($currentIndex, 4, '0', STR_PAD_LEFT),
                'name' => $userData['name'],
                'name_kana' => 'テストユーザー',
                'email' => $email,
                'department_id' => $departments[$userData['department']]->id,
                'position_id' => $positions[$userData['position']]->id,
                'hire_date' => now()->subDays(rand(30, 1000)),
                'is_active' => true,
            ]);

            // ユーザーを作成
            $user = User::create([
                'login_id' => $email,
                'password' => Hash::make('password123'),
                'system_level_id' => $systemLevels[$userData['system_level']]->id,
                'is_admin' => $userData['system_level'] === 'システム管理者',
                'is_active' => true,
                'email_verified_at' => now(),
                'employee_id' => $employee->id,
            ]);

            // 役割をアタッチ
            $role = $roles[$userData['role']];
            $user->roles()->attach($role->id, ['is_active' => true]);

            $this->command->info("Created user: {$userData['name']} (Department: {$userData['department']}, Position: {$userData['position']}, Role: {$userData['role']}, System Level: {$userData['system_level']})");
        }

        $this->command->info('Test users created successfully!');
    }
}
