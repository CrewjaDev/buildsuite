<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Permission;

class DepartmentPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 営業部権限
        $salesDept = Department::where('code', 'sales')->first();
        if ($salesDept) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.report',
                'partner.view',
                'partner.create',
                'partner.edit',
                'estimate.approval.request'
            ])->get();
            
            $salesDept->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }

        // 工事部権限
        $constructionDept = Department::where('code', 'construction')->first();
        if ($constructionDept) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.report',
                'progress.view',
                'progress.create',
                'progress.edit',
                'progress.report',
                'estimate.approval.request',
                'progress.approval.request'
            ])->get();
            
            $constructionDept->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }

        // 経理部権限
        $accountingDept = Department::where('code', 'accounting')->first();
        if ($accountingDept) {
            $permissions = Permission::whereIn('name', [
                'budget.view',
                'budget.create',
                'budget.edit',
                'budget.report',
                'payment.view',
                'payment.create',
                'payment.edit',
                'payment.report',
                'budget.approval.request',
                'payment.approval.request'
            ])->get();
            
            $accountingDept->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }

        // 総務部権限
        $generalDept = Department::where('code', 'general')->first();
        if ($generalDept) {
            $permissions = Permission::whereIn('name', [
                'user.view',
                'user.create',
                'user.edit',
                'department.view',
                'department.create',
                'department.edit',
                'system.view'
            ])->get();
            
            $generalDept->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }
    }
}
