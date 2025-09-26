<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SystemLevel;
use App\Models\Permission;

class SystemLevelPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 上長以上に承認権限を付与
        $supervisorLevel = SystemLevel::where('code', 'supervisor')->first();
        if ($supervisorLevel) {
            $approvalPermissions = Permission::whereIn('name', [
                'estimate.approval.view',
                'estimate.approval.approve',
                'estimate.approval.reject',
                'estimate.approval.return',
                'estimate.approval.request',
                'approval.usage' // 承認者機能利用権限を追加
            ])->get();
            
            $supervisorLevel->permissions()->attach($approvalPermissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1 // システム管理者のID
            ]);
        }
        
        // 機能特化型の権限は役割に移行したため、削除
        
        // 最高責任者以上に最終承認権限を付与
        $executiveLevel = SystemLevel::where('code', 'executive')->first();
        if ($executiveLevel) {
            $finalApprovalPermissions = Permission::whereIn('name', [
                'estimate.approval.view',
                'estimate.approval.approve',
                'estimate.approval.reject',
                'estimate.approval.return',
                'estimate.approval.request',
                'approval.usage' // 承認者機能利用権限を追加
            ])->get();
            
            $executiveLevel->permissions()->attach($finalApprovalPermissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }
        
        // システム管理者に全権限を付与
        $systemAdminLevel = SystemLevel::where('code', 'system_admin')->first();
        if ($systemAdminLevel) {
            $allPermissions = Permission::all();
            
            $systemAdminLevel->permissions()->attach($allPermissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }
        
        // 担当者に基本権限を付与
        $staffLevel = SystemLevel::where('code', 'staff')->first();
        if ($staffLevel) {
            $basicPermissions = Permission::whereIn('name', [
                'estimate.view',
                'estimate.create',
                'estimate.edit',
                'estimate.approval.request'
            ])->get();
            
            $staffLevel->permissions()->attach($basicPermissions->pluck('id'), [
                'granted_at' => now(),
                'granted_by' => 1
            ]);
        }
    }
}
