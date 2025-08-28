<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $positions = [
            [
                'code' => 'employee',
                'name' => '社員',
                'display_name' => '社員',
                'description' => '基本的な業務機能の利用権限を持つ一般社員',
                'level' => 1,
                'sort_order' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'staff',
                'name' => '担当',
                'display_name' => '担当',
                'description' => '特定の業務を担当し、部下を指導する権限を持つ',
                'level' => 2,
                'sort_order' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'section_chief',
                'name' => '課長',
                'display_name' => '課長',
                'description' => '課の業務を統括し、部下の管理監督を行う権限を持つ',
                'level' => 3,
                'sort_order' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'department_manager',
                'name' => '部長',
                'display_name' => '部長',
                'description' => '部の業務を統括し、経営判断に参加する権限を持つ',
                'level' => 4,
                'sort_order' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'code' => 'director',
                'name' => '取締役',
                'display_name' => '取締役',
                'description' => '会社の経営判断を行い、全社的な業務を統括する権限を持つ',
                'level' => 5,
                'sort_order' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($positions as $position) {
            DB::table('positions')->insert($position);
        }
    }
}
