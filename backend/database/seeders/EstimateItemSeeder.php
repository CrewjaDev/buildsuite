<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\EstimateItem;
use App\Models\Estimate;
use App\Models\Partner;
use Illuminate\Support\Str;

class EstimateItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 既存の見積明細データをクリア
        EstimateItem::truncate();

        // 見積データを取得
        $estimates = Estimate::all();
        
        if ($estimates->isEmpty()) {
            $this->command->warn('見積データが存在しません。先にEstimateSeederを実行してください。');
            return;
        }

        // 取引先データを取得（発注先として使用）
        $suppliers = Partner::where('partner_type', 'supplier')->get();
        if ($suppliers->isEmpty()) {
            $suppliers = Partner::take(3)->get();
        }

        foreach ($estimates as $estimate) {
            $this->createEstimateItems($estimate, $suppliers);
        }

        $this->command->info('見積明細データを作成しました。');
    }

    private function createEstimateItems($estimate, $suppliers)
    {
        $displayOrder = 1;

        // 大分類1: 外壁補修工事
        $exteriorRepairId = Str::uuid();
        EstimateItem::create([
            'id' => $exteriorRepairId,
            'estimate_id' => $estimate->id,
            'parent_id' => null,
            'item_type' => 'large',
            'display_order' => $displayOrder++,
            'name' => '外壁補修工事',
            'description' => 'ALC外壁の補修・シーリング工事',
            'quantity' => 1,
            'unit' => '式',
            'unit_price' => 0,
            'amount' => 0,
            'estimated_cost' => 0,
            'supplier_id' => $suppliers->first()?->id,
            'construction_method' => '高所作業車使用',
            'remarks' => '西面・北面の補修工事',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 中分類1-1: 西面工事
        $westSideId = Str::uuid();
        EstimateItem::create([
            'id' => $westSideId,
            'estimate_id' => $estimate->id,
            'parent_id' => $exteriorRepairId,
            'item_type' => 'medium',
            'display_order' => $displayOrder++,
            'name' => '西面',
            'description' => '西面外壁の補修工事',
            'quantity' => 1,
            'unit' => '式',
            'unit_price' => 0,
            'amount' => 310300,
            'estimated_cost' => 250000,
            'supplier_id' => $suppliers->first()?->id,
            'construction_method' => '高所作業車13m',
            'remarks' => '西面補修一式',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-1-1: クラック補修
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $westSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => 'クラック補修',
            'description' => 'A-NC工法によるクラック補修',
            'quantity' => 20.00,
            'unit' => 'm',
            'unit_price' => 4000,
            'amount' => 80000,
            'estimated_cost' => 65000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => 'クラック補修工事の実施',
            'construction_method' => 'A-NC工法',
            'construction_classification_id' => 1, // 仮の工事分類ID
            'remarks' => '材料（材工）費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-1-2: ALC縦目地
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $westSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => 'ALC縦目地',
            'description' => 'シーリング打増MS-2',
            'quantity' => 106.00,
            'unit' => 'm',
            'unit_price' => 1000,
            'amount' => 106000,
            'estimated_cost' => 85000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => 'ALC縦目地シーリング工事',
            'construction_method' => 'シーリング打増MS-2',
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-1-3: ALC横目地
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $westSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => 'ALC横目地',
            'description' => 'W=60シーリング打増MS-2',
            'quantity' => 41.00,
            'unit' => 'm',
            'unit_price' => 1500,
            'amount' => 61500,
            'estimated_cost' => 50000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => 'ALC横目地シーリング工事',
            'construction_method' => 'W=60シーリング打増MS-2',
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-1-4: 樋取合シーリング打替
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $westSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => '樋取合シーリング打替',
            'description' => 'MS-2',
            'quantity' => 4.00,
            'unit' => 'ヶ所',
            'unit_price' => 700,
            'amount' => 2800,
            'estimated_cost' => 2200,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => '樋取合シーリング打替工事',
            'construction_method' => 'MS-2',
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-1-5: 高所作業車
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $westSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => '高所作業車',
            'description' => '13ｍ',
            'quantity' => 1.00,
            'unit' => '式',
            'unit_price' => 60000,
            'amount' => 60000,
            'estimated_cost' => 48000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => '高所作業車レンタル',
            'construction_method' => '13ｍ',
            'construction_classification_id' => 2,
            'remarks' => '車両費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 中分類1-2: 北面工事
        $northSideId = Str::uuid();
        EstimateItem::create([
            'id' => $northSideId,
            'estimate_id' => $estimate->id,
            'parent_id' => $exteriorRepairId,
            'item_type' => 'medium',
            'display_order' => $displayOrder++,
            'name' => '北面',
            'description' => '北面外壁の補修工事',
            'quantity' => 1,
            'unit' => '式',
            'unit_price' => 0,
            'amount' => 363750,
            'estimated_cost' => 290000,
            'supplier_id' => $suppliers->first()?->id,
            'construction_method' => '高所作業車25.5m屈折タイプ',
            'remarks' => '北面補修一式',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-2-1: クラック補修（北面）
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $northSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => 'クラック補修',
            'description' => 'A-NC工法によるクラック補修',
            'quantity' => 13.00,
            'unit' => 'm',
            'unit_price' => 4000,
            'amount' => 52000,
            'estimated_cost' => 42000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => 'クラック補修工事の実施',
            'construction_method' => 'A-NC工法',
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-2-2: ALC横目地（北面）
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $northSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => 'ALC横目地',
            'description' => 'W=60シーリング打増MS-2',
            'quantity' => 2.70,
            'unit' => 'm',
            'unit_price' => 1500,
            'amount' => 4050,
            'estimated_cost' => 3200,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => 'ALC横目地シーリング工事',
            'construction_method' => 'W=60シーリング打増MS-2',
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-2-3: 建具廻りシーリング打替
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $northSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => '建具廻りシーリング打替',
            'description' => 'MS-2',
            'quantity' => 36.80,
            'unit' => 'm',
            'unit_price' => 1500,
            'amount' => 55200,
            'estimated_cost' => 44000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => '樋取合シーリング打替工事',
            'construction_method' => 'MS-2',
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-2-4: 欠損部補修
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $northSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => '欠損部補修',
            'description' => '撤去・シーリング充填MS-2',
            'quantity' => 15.00,
            'unit' => 'm',
            'unit_price' => 3500,
            'amount' => 52500,
            'estimated_cost' => 42000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => '欠損部補修工事',
            'construction_method' => '撤去・シーリング充填MS-2',
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-2-5: 高所作業車（北面）
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $northSideId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => '高所作業車',
            'description' => '25.5ｍ　屈折タイプ',
            'quantity' => 1.00,
            'unit' => '式',
            'unit_price' => 200000,
            'amount' => 200000,
            'estimated_cost' => 160000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => '高所作業車レンタル（屈折タイプ）',
            'construction_method' => '25.5ｍ　屈折タイプ',
            'construction_classification_id' => 2,
            'remarks' => '車両費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 中分類1-3: 諸経費
        $miscExpensesId = Str::uuid();
        EstimateItem::create([
            'id' => $miscExpensesId,
            'estimate_id' => $estimate->id,
            'parent_id' => $exteriorRepairId,
            'item_type' => 'medium',
            'display_order' => $displayOrder++,
            'name' => '諸経費',
            'description' => '諸経費',
            'quantity' => 1,
            'unit' => '式',
            'unit_price' => 0,
            'amount' => 25950,
            'estimated_cost' => 20000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => '諸経費',
            'construction_method' => '',
            'construction_classification_id' => 3,
            'remarks' => '諸経費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 詳細1-3-1: 諸経費詳細
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $estimate->id,
            'parent_id' => $miscExpensesId,
            'item_type' => 'detail',
            'display_order' => $displayOrder++,
            'name' => '諸経費',
            'description' => '諸経費',
            'quantity' => 1,
            'unit' => '式',
            'unit_price' => 25950,
            'amount' => 25950,
            'estimated_cost' => 20000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => '諸経費',
            'construction_method' => '',
            'construction_classification_id' => 3,
            'remarks' => '諸経費',
            'is_expanded' => true,
            'is_active' => true,
        ]);

        // 金額の再計算（親アイテムの金額を子アイテムの合計で更新）
        $this->updateParentAmounts($estimate->id);
    }

    private function updateParentAmounts($estimateId)
    {
        // 親アイテムの金額を子アイテムの合計で更新
        $parentItems = EstimateItem::where('estimate_id', $estimateId)
            ->whereNotNull('parent_id')
            ->where('item_type', '!=', 'detail')
            ->get();

        foreach ($parentItems as $parent) {
            $children = EstimateItem::where('estimate_id', $estimateId)
                ->where('parent_id', $parent->id)
                ->get();

            $totalAmount = $children->sum('amount');
            $totalEstimatedCost = $children->sum('estimated_cost');

            $parent->update([
                'amount' => $totalAmount,
                'estimated_cost' => $totalEstimatedCost,
            ]);
        }

        // 大分類の金額を更新
        $largeItems = EstimateItem::where('estimate_id', $estimateId)
            ->whereNull('parent_id')
            ->where('item_type', 'large')
            ->get();

        foreach ($largeItems as $large) {
            $children = EstimateItem::where('estimate_id', $estimateId)
                ->where('parent_id', $large->id)
                ->get();

            $totalAmount = $children->sum('amount');
            $totalEstimatedCost = $children->sum('estimated_cost');

            $large->update([
                'amount' => $totalAmount,
                'estimated_cost' => $totalEstimatedCost,
            ]);
        }
    }
}
