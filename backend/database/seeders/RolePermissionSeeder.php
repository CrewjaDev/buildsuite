<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 経理責任者権限
        $accountingManager = Role::where('name', 'accounting_manager')->first();
        if ($accountingManager) {
            $permissions = Permission::whereIn('name', [
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
                'budget.approval.view',
                'budget.approval.approve',
                'budget.approval.reject',
                'budget.approval.return',
                'payment.approval.view',
                'payment.approval.approve',
                'payment.approval.reject',
                'payment.approval.return',
                'approval.usage'
            ])->get();
            
            $accountingManager->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 経理担当権限
        $accountingStaff = Role::where('name', 'accounting_staff')->first();
        if ($accountingStaff) {
            $permissions = Permission::whereIn('name', [
                'budget.view',
                'budget.create',
                'budget.edit',
                'payment.view',
                'payment.create',
                'payment.edit',
                'budget.approval.request',
                'payment.approval.request'
            ])->get();
            
            $accountingStaff->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 事務長権限
        $officeManager = Role::where('name', 'office_manager')->first();
        if ($officeManager) {
            $permissions = Permission::whereIn('name', [
                'user.view',
                'user.create',
                'user.edit',
                'department.view',
                'department.create',
                'department.edit',
                'system.view',
                'approval.usage'
            ])->get();
            
            $officeManager->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 事務担当権限
        $officeStaff = Role::where('name', 'office_staff')->first();
        if ($officeStaff) {
            $permissions = Permission::whereIn('name', [
                'user.view',
                'department.view'
            ])->get();
            
            $officeStaff->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 工事責任者権限
        $constructionManager = Role::where('name', 'construction_manager')->first();
        if ($constructionManager) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.approve',
                'estimate.report',
                'progress.view',
                'progress.create',
                'progress.edit',
                'progress.approve',
                'progress.report',
                'estimate.approval.view',
                'estimate.approval.approve',
                'estimate.approval.reject',
                'estimate.approval.return',
                'progress.approval.view',
                'progress.approval.approve',
                'progress.approval.reject',
                'progress.approval.return',
                'approval.usage'
            ])->get();
            
            $constructionManager->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 工事担当権限
        $constructionStaff = Role::where('name', 'construction_staff')->first();
        if ($constructionStaff) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'progress.view',
                'progress.create',
                'progress.edit',
                'estimate.approval.request',
                'progress.approval.request'
            ])->get();
            
            $constructionStaff->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 上級見積担当権限
        $estimatorSenior = Role::where('name', 'estimator_senior')->first();
        if ($estimatorSenior) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.approve',
                'estimate.report',
                'estimate.approval.view',
                'estimate.approval.approve',
                'estimate.approval.reject',
                'estimate.approval.return',
                'approval.usage'
            ])->get();
            
            $estimatorSenior->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 見積担当権限
        $estimator = Role::where('name', 'estimator')->first();
        if ($estimator) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.report',
                'estimate.approval.request'
            ])->get();
            
            $estimator->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 営業マネージャー権限
        $salesManager = Role::where('name', 'sales_manager')->first();
        if ($salesManager) {
            $permissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.approve',
                'estimate.report',
                'partner.view',
                'partner.create',
                'partner.edit',
                'estimate.approval.view',
                'estimate.approval.approve',
                'estimate.approval.reject',
                'estimate.approval.return',
                'approval.usage'
            ])->get();
            
            $salesManager->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // 営業担当権限
        $salesStaff = Role::where('name', 'sales_staff')->first();
        if ($salesStaff) {
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
            
            $salesStaff->permissions()->attach($permissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }

        // システム管理者権限（全権限）
        $systemManager = Role::where('name', 'system_manager')->first();
        if ($systemManager) {
            $allPermissions = Permission::where('is_active', true)->get();
            
            $systemManager->permissions()->attach($allPermissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 2
            ]);
        }
    }
}
