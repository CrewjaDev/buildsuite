<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\EstimateItem;
use App\Models\EstimateBreakdown;
use App\Models\Estimate;
use App\Models\Partner;
use Illuminate\Support\Str;

class EstimateItemNewSeeder extends Seeder
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
            $this->updateBreakdownAmounts($estimate->id);
        }

        $this->command->info('見積明細アイテムデータを作成しました。');
    }

    private function createEstimateItems($estimate, $suppliers)
    {
        $displayOrder = 1;

        // 見積内訳構造を取得
        $breakdowns = EstimateBreakdown::where('estimate_id', $estimate->id)->get();
        
        if ($breakdowns->isEmpty()) {
            $this->command->warn("見積ID {$estimate->id} の内訳構造が存在しません。先にEstimateBreakdownSeederを実行してください。");
            return;
        }

        // 小内訳を取得
        $smallBreakdowns = $breakdowns->where('breakdown_type', 'small');

        foreach ($smallBreakdowns as $breakdown) {
            $this->createItemsForBreakdown($breakdown, $suppliers, $displayOrder);
        }
    }

    private function createItemsForBreakdown($breakdown, $suppliers, &$displayOrder)
    {
        switch ($breakdown->name) {
            case 'クラック補修':
                $this->createCrackRepairItems($breakdown, $suppliers, $displayOrder);
                break;
            case '塗装工事':
                $this->createPaintingItems($breakdown, $suppliers, $displayOrder);
                break;
            case '防水工事':
                $this->createWaterproofingItems($breakdown, $suppliers, $displayOrder);
                break;
            case '交通費':
                $this->createTransportationItems($breakdown, $suppliers, $displayOrder);
                break;
            case '諸雑費':
                $this->createMiscExpensesItems($breakdown, $suppliers, $displayOrder);
                break;
            // 一式の場合は明細を作成しない（direct_amountを使用）
            case '一式':
                // 明細は作成せず、breakdownのdirect_amountを使用
                break;
        }
    }

    private function createCrackRepairItems($breakdown, $suppliers, &$displayOrder)
    {
        // クラック補修の明細
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
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
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);

        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => 'ひび割れ補修',
            'description' => 'エポキシ樹脂注入によるひび割れ補修',
            'quantity' => 15.00,
            'unit' => 'm',
            'unit_price' => 3500,
            'amount' => 52500,
            'estimated_cost' => 42000,
            'supplier_id' => $suppliers->first()?->id,
            'order_request_content' => 'ひび割れ補修工事の実施',
            'construction_method' => 'エポキシ樹脂注入',
            'construction_classification_id' => 1,
            'remarks' => '材料（材工）費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);
    }

    private function createPaintingItems($breakdown, $suppliers, &$displayOrder)
    {
        // 塗装工事の明細
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => '外壁塗装',
            'description' => 'アクリル系塗料による外壁塗装',
            'quantity' => 50.00,
            'unit' => 'm²',
            'unit_price' => 2500,
            'amount' => 125000,
            'estimated_cost' => 100000,
            'supplier_id' => $suppliers->skip(1)->first()?->id,
            'order_request_content' => '外壁塗装工事の実施',
            'construction_method' => 'アクリル系塗料',
            'construction_classification_id' => 2,
            'remarks' => '材料（材工）費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);

        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => '下地処理',
            'description' => '塗装前の下地処理',
            'quantity' => 50.00,
            'unit' => 'm²',
            'unit_price' => 800,
            'amount' => 40000,
            'estimated_cost' => 32000,
            'supplier_id' => $suppliers->skip(1)->first()?->id,
            'order_request_content' => '下地処理工事の実施',
            'construction_method' => '下地処理',
            'construction_classification_id' => 2,
            'remarks' => '材料（材工）費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);
    }

    private function createWaterproofingItems($breakdown, $suppliers, &$displayOrder)
    {
        // 防水工事の明細
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => '防水処理',
            'description' => 'ウレタン系防水材による防水処理',
            'quantity' => 30.00,
            'unit' => 'm²',
            'unit_price' => 6000,
            'amount' => 180000,
            'estimated_cost' => 150000,
            'supplier_id' => $suppliers->skip(2)->first()?->id,
            'order_request_content' => '防水処理工事の実施',
            'construction_method' => 'ウレタン系防水材',
            'construction_classification_id' => 3,
            'remarks' => '材料（材工）費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);

        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => '防水下地処理',
            'description' => '防水材施工前の下地処理',
            'quantity' => 30.00,
            'unit' => 'm²',
            'unit_price' => 1200,
            'amount' => 36000,
            'estimated_cost' => 30000,
            'supplier_id' => $suppliers->skip(2)->first()?->id,
            'order_request_content' => '防水下地処理工事の実施',
            'construction_method' => '下地処理',
            'construction_classification_id' => 3,
            'remarks' => '材料（材工）費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);
    }

    private function createTransportationItems($breakdown, $suppliers, &$displayOrder)
    {
        // 交通費の明細
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => '現場交通費',
            'description' => '現場への交通費',
            'quantity' => 10.00,
            'unit' => '回',
            'unit_price' => 2000,
            'amount' => 20000,
            'estimated_cost' => 20000,
            'supplier_id' => null,
            'order_request_content' => '',
            'construction_method' => '',
            'construction_classification_id' => null,
            'remarks' => '交通費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);

        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => '材料運搬費',
            'description' => '材料の運搬費',
            'quantity' => 5.00,
            'unit' => '回',
            'unit_price' => 5000,
            'amount' => 25000,
            'estimated_cost' => 25000,
            'supplier_id' => null,
            'order_request_content' => '',
            'construction_method' => '',
            'construction_classification_id' => null,
            'remarks' => '運搬費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);
    }

    private function createMiscExpensesItems($breakdown, $suppliers, &$displayOrder)
    {
        // 諸雑費の明細
        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => '清掃費',
            'description' => '工事後の清掃費',
            'quantity' => 1.00,
            'unit' => '式',
            'unit_price' => 15000,
            'amount' => 15000,
            'estimated_cost' => 15000,
            'supplier_id' => null,
            'order_request_content' => '',
            'construction_method' => '',
            'construction_classification_id' => null,
            'remarks' => '清掃費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);

        EstimateItem::create([
            'id' => Str::uuid(),
            'estimate_id' => $breakdown->estimate_id,
            'breakdown_id' => $breakdown->id,
            'name' => '諸雑費',
            'description' => 'その他の諸雑費',
            'quantity' => 1.00,
            'unit' => '式',
            'unit_price' => 10000,
            'amount' => 10000,
            'estimated_cost' => 10000,
            'supplier_id' => null,
            'order_request_content' => '',
            'construction_method' => '',
            'construction_classification_id' => null,
            'remarks' => '諸雑費',
            'is_active' => true,
            'display_order' => $displayOrder++,
        ]);
    }

    /**
     * 見積内訳の金額を明細の集計値で更新
     */
    private function updateBreakdownAmounts($estimateId)
    {
        // 小内訳の金額を明細の集計値で更新
        $smallBreakdowns = EstimateBreakdown::where('estimate_id', $estimateId)
            ->where('breakdown_type', 'small')
            ->get();

        foreach ($smallBreakdowns as $breakdown) {
            $items = EstimateItem::where('breakdown_id', $breakdown->id)->get();
            
            $totalAmount = $items->sum('amount');
            $totalEstimatedCost = $items->sum('estimated_cost');
            
            // 明細がある場合は集計値、ない場合はdirect_amountを使用
            $calculatedAmount = $items->count() > 0 ? $totalAmount : $breakdown->direct_amount;
            $calculatedEstimatedCost = $items->count() > 0 ? $totalEstimatedCost : $breakdown->estimated_cost;
            
            $breakdown->update([
                'calculated_amount' => $calculatedAmount,
                'estimated_cost' => $calculatedEstimatedCost,
            ]);
        }

        // 中内訳の金額を子要素の集計値で更新
        $mediumBreakdowns = EstimateBreakdown::where('estimate_id', $estimateId)
            ->where('breakdown_type', 'medium')
            ->get();

        foreach ($mediumBreakdowns as $breakdown) {
            $children = EstimateBreakdown::where('parent_id', $breakdown->id)->get();
            
            $totalAmount = $children->sum('calculated_amount');
            $totalEstimatedCost = $children->sum('estimated_cost');
            
            $breakdown->update([
                'calculated_amount' => $totalAmount,
                'estimated_cost' => $totalEstimatedCost,
            ]);
        }

        // 大内訳の金額を子要素の集計値で更新
        $largeBreakdowns = EstimateBreakdown::where('estimate_id', $estimateId)
            ->where('breakdown_type', 'large')
            ->get();

        foreach ($largeBreakdowns as $breakdown) {
            $children = EstimateBreakdown::where('parent_id', $breakdown->id)->get();
            
            $totalAmount = $children->sum('calculated_amount');
            $totalEstimatedCost = $children->sum('estimated_cost');
            
            $breakdown->update([
                'calculated_amount' => $totalAmount,
                'estimated_cost' => $totalEstimatedCost,
            ]);
        }
    }
}
