<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Estimate;
use App\Models\User;
use App\Models\Employee;
use App\Models\Department;
use Carbon\Carbon;

class TestEstimateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // テスト用ユーザーを取得
        $testUsers = User::where('login_id', 'like', '%@test.com')->with('employee')->get();
        
        if ($testUsers->isEmpty()) {
            $this->command->error('No test users found. Please run TestUserSeeder first.');
            return;
        }

        // 部署データを取得
        $departments = Department::all()->keyBy('name');

        // 見積もりステータス
        $statuses = ['draft', 'submitted', 'approved', 'rejected', 'cancelled'];
        
        // 見積もりタイプ
        $types = ['construction', 'renovation', 'maintenance', 'consulting', 'equipment'];
        
        // 顧客名
        $customers = [
            '株式会社ABC建設', '株式会社XYZ不動産', '株式会社DEF工務店',
            '株式会社GHI設計', '株式会社JKL設備', '株式会社MNO開発',
            '株式会社PQR建設', '株式会社STU不動産', '株式会社VWX工務店',
            '株式会社YZA設計', '株式会社BCD設備', '株式会社EFG開発',
            '株式会社HIJ建設', '株式会社KLM不動産', '株式会社NOP工務店',
            '株式会社QRS設計', '株式会社TUV設備', '株式会社WXY開発',
            '株式会社ZAB建設', '株式会社CDE不動産'
        ];

        // 工事内容
        $descriptions = [
            '新築住宅建設工事', 'リフォーム工事', '外壁塗装工事', '屋根工事',
            '内装工事', '電気工事', '配管工事', 'エアコン設置工事',
            'バリアフリー改修工事', '耐震補強工事', '断熱工事', '防水工事',
            '外構工事', '造園工事', '解体工事', '基礎工事',
            '建具取付工事', 'クロス張替工事', 'フローリング工事', 'キッチン工事'
        ];

        $this->command->info('Creating test estimates...');

        // 既存の見積もり番号を確認
        $existingEstimates = Estimate::where('estimate_number', 'like', 'EST-2025-%')->count();
        $startIndex = $existingEstimates + 1;

        for ($i = 1; $i <= 100; $i++) {
            // ランダムにユーザーを選択
            $user = $testUsers->random();
            $employee = $user->employee;
            
            // 見積もり番号を生成（既存の番号から続きを作成）
            $year = Carbon::now()->year;
            $estimateNumber = "EST-{$year}-" . str_pad($startIndex + $i - 1, 3, '0', STR_PAD_LEFT);
            
            // ランダムな金額を生成（10万円〜5000万円）
            $baseAmount = rand(100000, 50000000);
            $taxRate = 0.10; // 10%
            $taxAmount = $baseAmount * $taxRate;
            $totalAmount = $baseAmount + $taxAmount;
            
            // ランダムな日付を生成（過去1年以内）
            $createdAt = Carbon::now()->subDays(rand(1, 365));
            $updatedAt = $createdAt->copy()->addDays(rand(0, 30));
            
            // 見積もりを作成
            $estimate = Estimate::create([
                'estimate_number' => $estimateNumber,
                'partner_id' => rand(1, 5), // パートナーIDをランダムに設定
                'project_type_id' => rand(1, 5), // プロジェクトタイプIDをランダムに設定
                'project_name' => $descriptions[array_rand($descriptions)],
                'project_location' => '東京都' . ['千代田区', '中央区', '港区', '新宿区', '渋谷区'][array_rand(['千代田区', '中央区', '港区', '新宿区', '渋谷区'])] . '工事町1-2-3',
                'project_period_start' => $createdAt->copy()->addDays(rand(30, 90)),
                'project_period_end' => $createdAt->copy()->addDays(rand(120, 180)),
                'description' => $descriptions[array_rand($descriptions)],
                'subtotal' => $baseAmount,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => $statuses[array_rand($statuses)],
                'department_id' => $employee->department_id,
                'created_by' => $user->id,
                'responsible_user_id' => $user->id,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
                'visibility' => rand(0, 1) ? 'public' : 'private',
                'notes' => "テスト用見積もりデータ #{$i}",
                'approval_status' => 'draft', // 承認ステータスを追加
                'issue_date' => $createdAt,
                'expiry_date' => $createdAt->copy()->addDays(30),
                'currency' => 'JPY',
            ]);

            // 進捗率はテーブルに存在しないため削除

            if ($i % 10 === 0) {
                $this->command->info("Created {$i} estimates...");
            }
        }

        $this->command->info('Test estimates created successfully!');
        
        // 統計情報を表示
        $this->command->info('Estimate Statistics:');
        $this->command->info('Total estimates: ' . Estimate::count());
        $this->command->info('By status:');
        foreach ($statuses as $status) {
            $count = Estimate::where('status', $status)->count();
            $this->command->info("  {$status}: {$count}");
        }
        
        $this->command->info('By department:');
        foreach ($departments as $department) {
            $count = Estimate::where('department_id', $department->id)->count();
            $this->command->info("  {$department->name}: {$count}");
        }
    }
}
