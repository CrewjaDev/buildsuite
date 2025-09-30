<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Estimate;
use App\Models\Partner;
use App\Models\ProjectType;
use App\Models\TaxRate;
use Illuminate\Support\Str;

class EstimateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 既存の見積データをクリア
        Estimate::truncate();

        // マスターデータの取得
        $partners = Partner::all();
        $projectTypes = ProjectType::all();
        $taxRates = TaxRate::all();

        if ($partners->isEmpty() || $projectTypes->isEmpty() || $taxRates->isEmpty()) {
            $this->command->warn('マスターデータが不足しています。先にPartnerSeeder、ProjectTypesSeeder、TaxRateSeederを実行してください。');
            return;
        }

        // テスト用ユーザーを取得（存在しない場合は作成）
        $user = \App\Models\User::first();
        if (!$user) {
            $user = \App\Models\User::create([
                'employee_id' => 'TEST001',
                'name' => 'テストユーザー',
                'email' => 'test@example.com',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]);
        }

        // テスト用社員データを取得（最初の社員を使用）
        $employee = \App\Models\Employee::first();
        if (!$employee) {
            $employee = \App\Models\Employee::create([
                'employee_id' => 'TEST001',
                'name' => 'テストユーザー',
                'email' => 'test@example.com',
                'is_active' => true,
            ]);
        }


        // 見積テストデータの作成
        $estimates = [
            [
                'estimate_number' => 'EST-2024-001',
                'project_name' => '新築住宅建設工事',
                'project_location' => '東京都渋谷区渋谷1-1-1',
                'description' => '東京都渋谷区 3LDK住宅新築工事',
                'partner_id' => $partners->first()->id,
                'project_type_id' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->id ?? $projectTypes->first()->id,
                'issue_date' => now()->subDays(30)->format('Y-m-d'),
                'expiry_date' => now()->addDays(60)->format('Y-m-d'),
                'project_period_start' => now()->addDays(7)->format('Y-m-d'),
                'project_period_end' => now()->addDays(180)->format('Y-m-d'),
                'status' => 'draft',
                'subtotal' => 25000000,
                'overhead_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->overhead_rate ?? 20.00,
                'overhead_amount' => 25000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->overhead_rate ?? 20.00) / 100),
                'cost_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->cost_expense_rate ?? 3.00,
                'cost_expense_amount' => 25000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->cost_expense_rate ?? 3.00) / 100),
                'material_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->material_expense_rate ?? 5.00,
                'material_expense_amount' => 25000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->material_expense_rate ?? 5.00) / 100),
                'tax_rate' => $taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10,
                'tax_rate_id' => $taxRates->where('name', '標準税率（10%）')->first()?->id ?? $taxRates->first()->id,
                'tax_amount' => 25000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10),
                'total_amount' => 25000000 + (25000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10)),
                'profit_margin' => 0.15,
                'profit_amount' => 3750000,
                'currency' => 'JPY',
                'payment_terms' => '着工時30%、中間30%、完成時40%',
                'notes' => '標準仕様での見積もりです。オプション追加の場合は別途見積もりいたします。',
                'created_by' => $employee->id,
            ],
            [
                'estimate_number' => 'EST-2024-002',
                'project_name' => 'オフィスビル改修工事',
                'project_location' => '東京都新宿区新宿1-2-3',
                'description' => '東京都新宿区 オフィスビル内装改修工事',
                'partner_id' => $partners->skip(1)->first()?->id ?? $partners->first()->id,
                'project_type_id' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->id ?? $projectTypes->first()->id,
                'issue_date' => now()->subDays(15)->format('Y-m-d'),
                'expiry_date' => now()->addDays(45)->format('Y-m-d'),
                'project_period_start' => now()->addDays(3)->format('Y-m-d'),
                'project_period_end' => now()->addDays(90)->format('Y-m-d'),
                'status' => 'draft',
                'subtotal' => 15000000,
                'overhead_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->overhead_rate ?? 18.00,
                'overhead_amount' => 15000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->overhead_rate ?? 18.00) / 100),
                'cost_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->cost_expense_rate ?? 2.50,
                'cost_expense_amount' => 15000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->cost_expense_rate ?? 2.50) / 100),
                'material_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->material_expense_rate ?? 4.00,
                'material_expense_amount' => 15000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->material_expense_rate ?? 4.00) / 100),
                'tax_rate' => $taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10,
                'tax_rate_id' => $taxRates->where('name', '標準税率（10%）')->first()?->id ?? $taxRates->first()->id,
                'tax_amount' => 15000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10),
                'total_amount' => 15000000 + (15000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10)),
                'profit_margin' => 0.12,
                'profit_amount' => 1800000,
                'currency' => 'JPY',
                'payment_terms' => '契約時50%、完成時50%',
                'notes' => '工期：3ヶ月、平日のみ施工',
                'created_by' => $employee->id,
            ],
            [
                'estimate_number' => 'EST-2024-003',
                'project_name' => '店舗改装工事',
                'description' => '東京都原宿 カフェ店舗改装工事',
                'partner_id' => $partners->skip(2)->first()?->id ?? $partners->first()->id,
                'project_type_id' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->id ?? $projectTypes->first()->id,
                'issue_date' => now()->subDays(7)->format('Y-m-d'),
                'expiry_date' => now()->addDays(30)->format('Y-m-d'),
                'status' => 'draft',
                'subtotal' => 8000000,
                'overhead_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->overhead_rate ?? 15.00,
                'overhead_amount' => 8000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->overhead_rate ?? 15.00) / 100),
                'cost_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->cost_expense_rate ?? 2.00,
                'cost_expense_amount' => 8000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->cost_expense_rate ?? 2.00) / 100),
                'material_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->material_expense_rate ?? 3.50,
                'material_expense_amount' => 8000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->material_expense_rate ?? 3.50) / 100),
                'tax_rate' => $taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10,
                'tax_rate_id' => $taxRates->where('name', '標準税率（10%）')->first()?->id ?? $taxRates->first()->id,
                'tax_amount' => 8000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10),
                'total_amount' => 8000000 + (8000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10)),
                'profit_margin' => 0.18,
                'profit_amount' => 1440000,
                'currency' => 'JPY',
                'payment_terms' => '着工時40%、完成時60%',
                'notes' => 'デザイン重視の内装工事。材料費は別途実費精算',
                'created_by' => $employee->id,
            ],
            [
                'estimate_number' => 'EST-2024-004',
                'project_name' => '工場設備導入工事',
                'description' => '埼玉県川越市 製造工場設備導入・設置工事',
                'partner_id' => $partners->skip(3)->first()?->id ?? $partners->first()->id,
                'project_type_id' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->id ?? $projectTypes->first()->id,
                'issue_date' => now()->subDays(3)->format('Y-m-d'),
                'expiry_date' => now()->addDays(90)->format('Y-m-d'),
                'status' => 'draft',
                'subtotal' => 45000000,
                'overhead_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->overhead_rate ?? 22.00,
                'overhead_amount' => 45000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->overhead_rate ?? 22.00) / 100),
                'cost_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->cost_expense_rate ?? 3.50,
                'cost_expense_amount' => 45000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->cost_expense_rate ?? 3.50) / 100),
                'material_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->material_expense_rate ?? 6.00,
                'material_expense_amount' => 45000000 * (($projectTypes->where('type_name', 'LIKE', '%建築一式（元請）民間%')->first()?->material_expense_rate ?? 6.00) / 100),
                'tax_rate' => $taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10,
                'tax_rate_id' => $taxRates->where('name', '標準税率（10%）')->first()?->id ?? $taxRates->first()->id,
                'tax_amount' => 45000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10),
                'total_amount' => 45000000 + (45000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10)),
                'profit_margin' => 0.20,
                'profit_amount' => 9000000,
                'currency' => 'JPY',
                'payment_terms' => '契約時30%、設備到着時40%、完成時30%',
                'notes' => '大型設備のため、設置場所の事前確認が必要です。',
                'created_by' => $employee->id,
            ],
            [
                'estimate_number' => 'EST-2024-005',
                'project_name' => 'マンション外壁補修工事',
                'description' => '東京都世田谷区 分譲マンション外壁補修・塗装工事',
                'partner_id' => $partners->skip(4)->first()?->id ?? $partners->first()->id,
                'project_type_id' => $projectTypes->where('type_name', 'LIKE', '%塗装（元請）民間%')->first()?->id ?? $projectTypes->first()->id,
                'issue_date' => now()->subDays(1)->format('Y-m-d'),
                'expiry_date' => now()->addDays(45)->format('Y-m-d'),
                'status' => 'draft',
                'subtotal' => 12000000,
                'overhead_rate' => $projectTypes->where('type_name', 'LIKE', '%塗装（元請）民間%')->first()?->overhead_rate ?? 12.00,
                'overhead_amount' => 12000000 * (($projectTypes->where('type_name', 'LIKE', '%塗装（元請）民間%')->first()?->overhead_rate ?? 12.00) / 100),
                'cost_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%塗装（元請）民間%')->first()?->cost_expense_rate ?? 1.50,
                'cost_expense_amount' => 12000000 * (($projectTypes->where('type_name', 'LIKE', '%塗装（元請）民間%')->first()?->cost_expense_rate ?? 1.50) / 100),
                'material_expense_rate' => $projectTypes->where('type_name', 'LIKE', '%塗装（元請）民間%')->first()?->material_expense_rate ?? 2.50,
                'material_expense_amount' => 12000000 * (($projectTypes->where('type_name', 'LIKE', '%塗装（元請）民間%')->first()?->material_expense_rate ?? 2.50) / 100),
                'tax_rate' => $taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10,
                'tax_rate_id' => $taxRates->where('name', '標準税率（10%）')->first()?->id ?? $taxRates->first()->id,
                'tax_amount' => 12000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10),
                'total_amount' => 12000000 + (12000000 * ($taxRates->where('name', '標準税率（10%）')->first()?->rate ?? 0.10)),
                'profit_margin' => 0.10,
                'profit_amount' => 1200000,
                'currency' => 'JPY',
                'payment_terms' => '着工時50%、完成時50%',
                'notes' => '足場設置費用は別途見積もり。住民への事前説明が必要。',
                'created_by' => $employee->id,
            ],
        ];

        foreach ($estimates as $estimateData) {
            // 発行日に基づいて適切な税率を取得
            $issueDate = new \DateTime($estimateData['issue_date']);
            $applicableTaxRate = TaxRate::getTaxRateAtDate($issueDate);
            
            if ($applicableTaxRate) {
                $estimateData['tax_rate'] = $applicableTaxRate->rate;
                $estimateData['tax_rate_id'] = $applicableTaxRate->id;
                // 税額を再計算
                $estimateData['tax_amount'] = $estimateData['subtotal'] * $applicableTaxRate->rate;
                // 合計金額を再計算（小計 + 税額）
                $estimateData['total_amount'] = $estimateData['subtotal'] + $estimateData['tax_amount'];
            }
            
            // 承認フロー関連のフィールドを除外して見積を作成
            $estimateCreateData = $estimateData;
            unset($estimateCreateData['approval_status']);
            
            $estimate = Estimate::create($estimateCreateData);
        }

        $this->command->info('見積テストデータを5件作成しました。');
    }

}
