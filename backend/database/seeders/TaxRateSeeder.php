<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\TaxRate;

class TaxRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 既存の税率データをクリア
        TaxRate::truncate();

        // 税率マスターデータの作成（実際の消費税率変更履歴に基づく）
        $taxRates = [
            [
                'name' => '標準税率（3%）',
                'rate' => 0.03,
                'effective_from' => '1989-04-01',
                'effective_to' => '1997-03-31',
                'is_active' => false,
                'description' => '1989年4月1日から1997年3月31日まで適用された標準税率',
            ],
            [
                'name' => '標準税率（5%）',
                'rate' => 0.05,
                'effective_from' => '1997-04-01',
                'effective_to' => '2014-03-31',
                'is_active' => false,
                'description' => '1997年4月1日から2014年3月31日まで適用された標準税率',
            ],
            [
                'name' => '標準税率（8%）',
                'rate' => 0.08,
                'effective_from' => '2014-04-01',
                'effective_to' => '2019-09-30',
                'is_active' => false,
                'description' => '2014年4月1日から2019年9月30日まで適用された標準税率',
            ],
            [
                'name' => '標準税率（10%）',
                'rate' => 0.10,
                'effective_from' => '2019-10-01',
                'effective_to' => null,
                'is_active' => true,
                'description' => '2019年10月1日から適用されている標準税率',
            ],
            [
                'name' => '軽減税率（8%）',
                'rate' => 0.08,
                'effective_from' => '2019-10-01',
                'effective_to' => null,
                'is_active' => true,
                'description' => '2019年10月1日から適用されている軽減税率（食料品等）',
            ],
        ];

        foreach ($taxRates as $taxRateData) {
            TaxRate::create($taxRateData);
        }

        $this->command->info('税率マスターデータを作成しました。');
    }
}
