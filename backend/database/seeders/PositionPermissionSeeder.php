<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Position;
use App\Models\Permission;

class PositionPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 取締役権限（最高権限）
        $director = Position::where('code', 'director')->first();
        if ($director) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.approve',
                'estimate.report',
                'budget.view',
                'budget.create',
                'budget.edit',
                'budget.approve',
                'budget.report',
                'payment.view',
                'payment.create',
                'payment.edit',
                'payment.approve',
                'payment.report',
                'user.view',
                'user.create',
                'user.edit',
                'department.view',
                'department.create',
                'department.edit',
                'system.view',
                'approval.usage'
            ])->get();
            
            $director->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }

        // 部長権限（管理権限）
        $departmentManager = Position::where('code', 'department_manager')->first();
        if ($departmentManager) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.approve',
                'estimate.report',
                'budget.view',
                'budget.create',
                'budget.edit',
                'budget.approve',
                'budget.report',
                'payment.view',
                'payment.create',
                'payment.edit',
                'payment.approve',
                'payment.report',
                'user.view',
                'user.create',
                'user.edit',
                'department.view',
                'department.create',
                'department.edit',
                'approval.usage'
            ])->get();
            
            $departmentManager->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }

        // 課長権限（中級管理権限）
        $sectionChief = Position::where('code', 'section_chief')->first();
        if ($sectionChief) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.approve',
                'estimate.report',
                'budget.view',
                'budget.create',
                'budget.edit',
                'budget.approve',
                'budget.report',
                'payment.view',
                'payment.create',
                'payment.edit',
                'payment.approve',
                'payment.report',
                'user.view',
                'department.view',
                'approval.usage'
            ])->get();
            
            $sectionChief->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }

        // 担当権限（基本業務権限）
        $staff = Position::where('code', 'staff')->first();
        if ($staff) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.report',
                'budget.view',
                'budget.create',
                'budget.edit',
                'budget.report',
                'payment.view',
                'payment.create',
                'payment.edit',
                'payment.report',
                'user.view',
                'department.view'
            ])->get();
            
            $staff->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }

        // 社員権限（基本閲覧権限）
        $employee = Position::where('code', 'employee')->first();
        if ($employee) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.report',
                'budget.view',
                'budget.report',
                'payment.view',
                'payment.report',
                'user.view',
                'department.view'
            ])->get();
            
            $employee->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }
    }
}
