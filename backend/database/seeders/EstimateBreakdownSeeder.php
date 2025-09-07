<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\EstimateBreakdown;
use App\Models\Estimate;
use Illuminate\Support\Str;

class EstimateBreakdownSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 既存の見積内訳データをクリア
        EstimateBreakdown::truncate();

        // 見積データを取得
        $estimates = Estimate::all();
        
        if ($estimates->isEmpty()) {
            $this->command->warn('見積データが存在しません。先にEstimateSeederを実行してください。');
            return;
        }

        foreach ($estimates as $estimate) {
            $this->createEstimateBreakdowns($estimate);
        }

        $this->command->info('見積内訳構造データを作成しました。');
    }

    private function createEstimateBreakdowns($estimate)
    {
        $displayOrder = 1;

        // 大内訳1: 外壁補修工事
        $exteriorRepairId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $exteriorRepairId,
            'estimate_id' => $estimate->id,
            'parent_id' => null,
            'breakdown_type' => 'large',
            'name' => '外壁補修工事',
            'display_order' => $displayOrder++,
            'description' => '建物外壁の補修・改修工事',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 中内訳1: 西面
        $westSideId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $westSideId,
            'estimate_id' => $estimate->id,
            'parent_id' => $exteriorRepairId,
            'breakdown_type' => 'medium',
            'name' => '西面',
            'display_order' => $displayOrder++,
            'description' => '建物西面の補修工事',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 小内訳1: クラック補修
        $crackRepairId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $crackRepairId,
            'estimate_id' => $estimate->id,
            'parent_id' => $westSideId,
            'breakdown_type' => 'small',
            'name' => 'クラック補修',
            'display_order' => $displayOrder++,
            'description' => 'コンクリートクラックの補修',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 小内訳2: 塗装工事
        $paintingId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $paintingId,
            'estimate_id' => $estimate->id,
            'parent_id' => $westSideId,
            'breakdown_type' => 'small',
            'name' => '塗装工事',
            'display_order' => $displayOrder++,
            'description' => '外壁塗装工事',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 中内訳2: 北面
        $northSideId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $northSideId,
            'estimate_id' => $estimate->id,
            'parent_id' => $exteriorRepairId,
            'breakdown_type' => 'medium',
            'name' => '北面',
            'display_order' => $displayOrder++,
            'description' => '建物北面の補修工事',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 小内訳3: 防水工事
        $waterproofingId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $waterproofingId,
            'estimate_id' => $estimate->id,
            'parent_id' => $northSideId,
            'breakdown_type' => 'small',
            'name' => '防水工事',
            'display_order' => $displayOrder++,
            'description' => '防水処理工事',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 大内訳2: 諸経費
        $miscellaneousId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $miscellaneousId,
            'estimate_id' => $estimate->id,
            'parent_id' => null,
            'breakdown_type' => 'large',
            'name' => '諸経費',
            'display_order' => $displayOrder++,
            'description' => 'その他の経費',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 中内訳3: 一般管理費
        $overheadId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $overheadId,
            'estimate_id' => $estimate->id,
            'parent_id' => $miscellaneousId,
            'breakdown_type' => 'medium',
            'name' => '一般管理費',
            'display_order' => $displayOrder++,
            'description' => '一般管理費',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 小内訳4: 一式（直接金額入力の例）
        $lumpSumId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $lumpSumId,
            'estimate_id' => $estimate->id,
            'parent_id' => $overheadId,
            'breakdown_type' => 'small',
            'name' => '一式',
            'display_order' => $displayOrder++,
            'description' => '一式金額（直接入力）',
            'quantity' => 1.00,
            'unit' => '式',
            'unit_price' => 500000,
            'direct_amount' => 500000, // 一式金額の例
            'calculated_amount' => 500000,
            'estimated_cost' => 400000,
            'supplier_id' => null,
            'construction_method' => '一式工事',
            'construction_classification_id' => 1,
            'remarks' => '一式金額',
            'order_request_content' => '一式工事の実施',
            'is_active' => true,
        ]);

        // 小内訳5: 交通費
        $transportationId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $transportationId,
            'estimate_id' => $estimate->id,
            'parent_id' => $overheadId,
            'breakdown_type' => 'small',
            'name' => '交通費',
            'display_order' => $displayOrder++,
            'description' => '交通費',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);

        // 小内訳6: 諸雑費
        $miscExpensesId = (string) Str::uuid();
        EstimateBreakdown::create([
            'id' => $miscExpensesId,
            'estimate_id' => $estimate->id,
            'parent_id' => $overheadId,
            'breakdown_type' => 'small',
            'name' => '諸雑費',
            'display_order' => $displayOrder++,
            'description' => '諸雑費',
            'direct_amount' => 0,
            'calculated_amount' => 0,
            'is_active' => true,
        ]);
    }
}
