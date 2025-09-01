<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Partner;
use App\Models\User;

class PartnersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // テスト用ユーザーを取得（存在しない場合は作成）
        $user = User::first();
        if (!$user) {
            $user = User::create([
                'employee_id' => 'TEST001',
                'name' => 'テストユーザー',
                'email' => 'test@example.com',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]);
        }

        // 取引先データ
        $partners = [
            [
                'partner_code' => 'CUST001',
                'partner_name' => '株式会社サンプル建設',
                'partner_name_print' => '株式会社サンプル建設',
                'partner_name_kana' => 'カブシキガイシャサンプルケンセツ',
                'partner_type' => 'customer',
                'representative' => '田中太郎',
                'representative_kana' => 'タナカタロウ',
                'branch_name' => '本社',
                'postal_code' => '100-0001',
                'address' => '東京都千代田区千代田1-1-1',
                'building_name' => 'サンプルビル1F',
                'phone' => '03-1234-5678',
                'fax' => '03-1234-5679',
                'email' => 'info@sample-construction.co.jp',
                'is_subcontractor' => false,
                'closing_date' => 99,
                'deposit_terms' => '翌月',
                'deposit_date' => 99,
                'deposit_method' => '振込',
                'cash_allocation' => 100.00,
                'bill_allocation' => 0.00,
                'establishment_date' => '1990-01-01',
                'capital_stock' => 10000,
                'previous_sales' => 500000,
                'employee_count' => 50,
                'business_description' => '建設業',
                'bank_name' => 'サンプル銀行',
                'branch_name_bank' => '本店',
                'account_type' => 'current',
                'account_number' => '1234567',
                'account_holder' => '株式会社サンプル建設',
                'is_active' => true,
                'created_by' => $user->id,
            ],
            [
                'partner_code' => 'SUPP001',
                'partner_name' => '株式会社サンプル建材',
                'partner_name_print' => '株式会社サンプル建材',
                'partner_name_kana' => 'カブシキガイシャサンプルケンザイ',
                'partner_type' => 'supplier',
                'representative' => '佐藤次郎',
                'representative_kana' => 'サトウジロウ',
                'branch_name' => '本社',
                'postal_code' => '200-0001',
                'address' => '東京都中央区中央1-1-1',
                'building_name' => '建材ビル2F',
                'phone' => '03-2345-6789',
                'fax' => '03-2345-6790',
                'email' => 'info@sample-materials.co.jp',
                'is_subcontractor' => true,
                'payment_date' => 99,
                'payment_method' => '振込',
                'payment_cash_allocation' => 80.00,
                'payment_bill_allocation' => 20.00,
                'establishment_date' => '1985-01-01',
                'capital_stock' => 5000,
                'previous_sales' => 200000,
                'employee_count' => 30,
                'business_description' => '建材販売',
                'bank_name' => '建材銀行',
                'branch_name_bank' => '本店',
                'account_type' => 'current',
                'account_number' => '7654321',
                'account_holder' => '株式会社サンプル建材',
                'is_active' => true,
                'created_by' => $user->id,
            ],
            [
                'partner_code' => 'BOTH001',
                'partner_name' => '株式会社サンプル総合',
                'partner_name_print' => '株式会社サンプル総合',
                'partner_name_kana' => 'カブシキガイシャサンプルソウゴウ',
                'partner_type' => 'both',
                'representative' => '山田三郎',
                'representative_kana' => 'ヤマダサブロウ',
                'branch_name' => '本社',
                'postal_code' => '300-0001',
                'address' => '東京都港区港1-1-1',
                'building_name' => '総合ビル3F',
                'phone' => '03-3456-7890',
                'fax' => '03-3456-7891',
                'email' => 'info@sample-general.co.jp',
                'is_subcontractor' => false,
                'closing_date' => 99,
                'deposit_terms' => '翌月',
                'deposit_date' => 99,
                'deposit_method' => '振込',
                'cash_allocation' => 90.00,
                'bill_allocation' => 10.00,
                'payment_date' => 99,
                'payment_method' => '振込',
                'payment_cash_allocation' => 70.00,
                'payment_bill_allocation' => 30.00,
                'establishment_date' => '1980-01-01',
                'capital_stock' => 15000,
                'previous_sales' => 800000,
                'employee_count' => 100,
                'business_description' => '総合建設業',
                'bank_name' => '総合銀行',
                'branch_name_bank' => '本店',
                'account_type' => 'current',
                'account_number' => '1111111',
                'account_holder' => '株式会社サンプル総合',
                'is_active' => true,
                'created_by' => $user->id,
            ],
        ];

        foreach ($partners as $partnerData) {
            Partner::create($partnerData);
        }
    }
}
