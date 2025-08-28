<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            [
                'name' => '営業部',
                'code' => 'sales',
                'description' => '営業活動を担当する部署',
                'parent_id' => null,
                'level' => 1,
                'path' => '1',
                'sort_order' => 1,
                'manager_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => '経理部',
                'code' => 'accounting',
                'description' => '経理・財務を担当する部署',
                'parent_id' => null,
                'level' => 1,
                'path' => '2',
                'sort_order' => 2,
                'manager_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => '工事部',
                'code' => 'construction',
                'description' => '工事管理を担当する部署',
                'parent_id' => null,
                'level' => 1,
                'path' => '3',
                'sort_order' => 3,
                'manager_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => '調査設計室',
                'code' => 'design',
                'description' => '調査・設計を担当する部署',
                'parent_id' => null,
                'level' => 1,
                'path' => '4',
                'sort_order' => 4,
                'manager_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => '土木事業部',
                'code' => 'civil',
                'description' => '土木工事を担当する部署',
                'parent_id' => null,
                'level' => 1,
                'path' => '5',
                'sort_order' => 5,
                'manager_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => '建設事業部',
                'code' => 'building',
                'description' => '建設工事を担当する部署',
                'parent_id' => null,
                'level' => 1,
                'path' => '6',
                'sort_order' => 6,
                'manager_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => '東京支店',
                'code' => 'tokyo',
                'description' => '東京エリアを担当する支店',
                'parent_id' => null,
                'level' => 1,
                'path' => '7',
                'sort_order' => 7,
                'manager_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => '福岡支店',
                'code' => 'fukuoka',
                'description' => '福岡エリアを担当する支店',
                'parent_id' => null,
                'level' => 1,
                'path' => '8',
                'sort_order' => 8,
                'manager_id' => null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($departments as $department) {
            DB::table('departments')->insert($department);
        }
    }
}
