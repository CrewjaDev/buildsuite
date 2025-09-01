<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ConstructionClassification;

class ConstructionClassificationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 工事分類データ
        $classifications = [
            [
                'classification_code' => 'LABOR_COSTS',
                'classification_name' => '労務費',
                'subject_code' => '10',
                'description' => '人件費、労務費',
                'display_order' => 10,
                'is_active' => true,
            ],
            [
                'classification_code' => 'VEHICLE_COSTS',
                'classification_name' => '車両費',
                'subject_code' => '20',
                'description' => '車両・重機の使用料',
                'display_order' => 20,
                'is_active' => true,
            ],
            [
                'classification_code' => 'MATERIAL_LABOR',
                'classification_name' => '材料（材工）費',
                'subject_code' => '30',
                'description' => '材料費と工事費の合計',
                'display_order' => 30,
                'is_active' => true,
            ],
            [
                'classification_code' => 'OUTSOURCING',
                'classification_name' => '外注費',
                'subject_code' => '40',
                'description' => '外部委託費',
                'display_order' => 40,
                'is_active' => true,
            ],
            [
                'classification_code' => 'RENTAL',
                'classification_name' => '賃借費',
                'subject_code' => '50',
                'description' => '機材・設備の賃借料',
                'display_order' => 50,
                'is_active' => true,
            ],
            [
                'classification_code' => 'SITE_EXPENSES',
                'classification_name' => '現場経費',
                'subject_code' => '60',
                'description' => '現場で発生する経費',
                'display_order' => 60,
                'is_active' => true,
            ],
            [
                'classification_code' => 'INDUSTRIAL_WASTE',
                'classification_name' => '産廃処理',
                'subject_code' => '70',
                'description' => '産業廃棄物処理費',
                'display_order' => 70,
                'is_active' => true,
            ],
            [
                'classification_code' => 'MATERIALS_ONLY',
                'classification_name' => '材料のみ',
                'subject_code' => '80',
                'description' => '材料費のみ',
                'display_order' => 80,
                'is_active' => true,
            ],
        ];

        foreach ($classifications as $classificationData) {
            ConstructionClassification::create($classificationData);
        }
    }
}
