<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // システム権限
            ['name' => 'user.view', 'display_name' => 'ユーザー一覧閲覧', 'description' => 'ユーザー一覧を閲覧する権限', 'module' => 'user', 'action' => 'view', 'resource' => null, 'is_system' => true],
            ['name' => 'user.create', 'display_name' => 'ユーザー作成', 'description' => 'ユーザーを作成する権限', 'module' => 'user', 'action' => 'create', 'resource' => null, 'is_system' => true],
            ['name' => 'user.edit', 'display_name' => 'ユーザー編集', 'description' => 'ユーザーを編集する権限', 'module' => 'user', 'action' => 'edit', 'resource' => null, 'is_system' => true],
            ['name' => 'user.delete', 'display_name' => 'ユーザー削除', 'description' => 'ユーザーを削除する権限', 'module' => 'user', 'action' => 'delete', 'resource' => null, 'is_system' => true],
            
            ['name' => 'role.view', 'display_name' => '役割一覧閲覧', 'description' => '役割一覧を閲覧する権限', 'module' => 'role', 'action' => 'view', 'resource' => null, 'is_system' => true],
            ['name' => 'role.create', 'display_name' => '役割作成', 'description' => '役割を作成する権限', 'module' => 'role', 'action' => 'create', 'resource' => null, 'is_system' => true],
            ['name' => 'role.edit', 'display_name' => '役割編集', 'description' => '役割を編集する権限', 'module' => 'role', 'action' => 'edit', 'resource' => null, 'is_system' => true],
            ['name' => 'role.delete', 'display_name' => '役割削除', 'description' => '役割を削除する権限', 'module' => 'role', 'action' => 'delete', 'resource' => null, 'is_system' => true],
            
            ['name' => 'department.view', 'display_name' => '部門一覧閲覧', 'description' => '部門一覧を閲覧する権限', 'module' => 'department', 'action' => 'view', 'resource' => null, 'is_system' => true],
            ['name' => 'department.create', 'display_name' => '部門作成', 'description' => '部門を作成する権限', 'module' => 'department', 'action' => 'create', 'resource' => null, 'is_system' => true],
            ['name' => 'department.edit', 'display_name' => '部門編集', 'description' => '部門を編集する権限', 'module' => 'department', 'action' => 'edit', 'resource' => null, 'is_system' => true],
            ['name' => 'department.delete', 'display_name' => '部門削除', 'description' => '部門を削除する権限', 'module' => 'department', 'action' => 'delete', 'resource' => null, 'is_system' => true],
            
            ['name' => 'system.view', 'display_name' => 'システム設定閲覧', 'description' => 'システム設定を閲覧する権限', 'module' => 'system', 'action' => 'view', 'resource' => null, 'is_system' => true],
            ['name' => 'system.edit', 'display_name' => 'システム設定編集', 'description' => 'システム設定を編集する権限', 'module' => 'system', 'action' => 'edit', 'resource' => null, 'is_system' => true],
            
            // 業務権限
            ['name' => 'estimate.view', 'display_name' => '見積一覧閲覧', 'description' => '見積一覧を閲覧する権限', 'module' => 'estimate', 'action' => 'view', 'resource' => null, 'is_system' => false],
            ['name' => 'estimate.create', 'display_name' => '見積作成', 'description' => '見積を作成する権限', 'module' => 'estimate', 'action' => 'create', 'resource' => null, 'is_system' => false],
            ['name' => 'estimate.edit', 'display_name' => '見積編集', 'description' => '見積を編集する権限', 'module' => 'estimate', 'action' => 'edit', 'resource' => null, 'is_system' => false],
            ['name' => 'estimate.delete', 'display_name' => '見積削除', 'description' => '見積を削除する権限', 'module' => 'estimate', 'action' => 'delete', 'resource' => null, 'is_system' => false],
            ['name' => 'estimate.approve', 'display_name' => '見積承認', 'description' => '見積を承認する権限', 'module' => 'estimate', 'action' => 'approve', 'resource' => null, 'is_system' => false],
            ['name' => 'estimate.report', 'display_name' => '見積書出力', 'description' => '見積書を出力する権限', 'module' => 'estimate', 'action' => 'report', 'resource' => null, 'is_system' => false],
            
            ['name' => 'budget.view', 'display_name' => '予算一覧閲覧', 'description' => '予算一覧を閲覧する権限', 'module' => 'budget', 'action' => 'view', 'resource' => null, 'is_system' => false],
            ['name' => 'budget.create', 'display_name' => '予算作成', 'description' => '予算を作成する権限', 'module' => 'budget', 'action' => 'create', 'resource' => null, 'is_system' => false],
            ['name' => 'budget.edit', 'display_name' => '予算編集', 'description' => '予算を編集する権限', 'module' => 'budget', 'action' => 'edit', 'resource' => null, 'is_system' => false],
            ['name' => 'budget.delete', 'display_name' => '予算削除', 'description' => '予算を削除する権限', 'module' => 'budget', 'action' => 'delete', 'resource' => null, 'is_system' => false],
            ['name' => 'budget.approve', 'display_name' => '予算承認', 'description' => '予算を承認する権限', 'module' => 'budget', 'action' => 'approve', 'resource' => null, 'is_system' => false],
            ['name' => 'budget.report', 'display_name' => '予算書出力', 'description' => '予算書を出力する権限', 'module' => 'budget', 'action' => 'report', 'resource' => null, 'is_system' => false],
            
            ['name' => 'order.view', 'display_name' => '発注一覧閲覧', 'description' => '発注一覧を閲覧する権限', 'module' => 'order', 'action' => 'view', 'resource' => null, 'is_system' => false],
            ['name' => 'order.create', 'display_name' => '発注作成', 'description' => '発注を作成する権限', 'module' => 'order', 'action' => 'create', 'resource' => null, 'is_system' => false],
            ['name' => 'order.edit', 'display_name' => '発注編集', 'description' => '発注を編集する権限', 'module' => 'order', 'action' => 'edit', 'resource' => null, 'is_system' => false],
            ['name' => 'order.delete', 'display_name' => '発注削除', 'description' => '発注を削除する権限', 'module' => 'order', 'action' => 'delete', 'resource' => null, 'is_system' => false],
            ['name' => 'order.approve', 'display_name' => '発注承認', 'description' => '発注を承認する権限', 'module' => 'order', 'action' => 'approve', 'resource' => null, 'is_system' => false],
            ['name' => 'order.report', 'display_name' => '発注書出力', 'description' => '発注書を出力する権限', 'module' => 'order', 'action' => 'report', 'resource' => null, 'is_system' => false],
            
            ['name' => 'progress.view', 'display_name' => '出来高一覧閲覧', 'description' => '出来高一覧を閲覧する権限', 'module' => 'progress', 'action' => 'view', 'resource' => null, 'is_system' => false],
            ['name' => 'progress.create', 'display_name' => '出来高作成', 'description' => '出来高を作成する権限', 'module' => 'progress', 'action' => 'create', 'resource' => null, 'is_system' => false],
            ['name' => 'progress.edit', 'display_name' => '出来高編集', 'description' => '出来高を編集する権限', 'module' => 'progress', 'action' => 'edit', 'resource' => null, 'is_system' => false],
            ['name' => 'progress.delete', 'display_name' => '出来高削除', 'description' => '出来高を削除する権限', 'module' => 'progress', 'action' => 'delete', 'resource' => null, 'is_system' => false],
            ['name' => 'progress.approve', 'display_name' => '出来高承認', 'description' => '出来高を承認する権限', 'module' => 'progress', 'action' => 'approve', 'resource' => null, 'is_system' => false],
            ['name' => 'progress.report', 'display_name' => '出来高報告書出力', 'description' => '出来高報告書を出力する権限', 'module' => 'progress', 'action' => 'report', 'resource' => null, 'is_system' => false],
            
            ['name' => 'payment.view', 'display_name' => '支払一覧閲覧', 'description' => '支払一覧を閲覧する権限', 'module' => 'payment', 'action' => 'view', 'resource' => null, 'is_system' => false],
            ['name' => 'payment.create', 'display_name' => '支払作成', 'description' => '支払を作成する権限', 'module' => 'payment', 'action' => 'create', 'resource' => null, 'is_system' => false],
            ['name' => 'payment.edit', 'display_name' => '支払編集', 'description' => '支払を編集する権限', 'module' => 'payment', 'action' => 'edit', 'resource' => null, 'is_system' => false],
            ['name' => 'payment.delete', 'display_name' => '支払削除', 'description' => '支払を削除する権限', 'module' => 'payment', 'action' => 'delete', 'resource' => null, 'is_system' => false],
            ['name' => 'payment.approve', 'display_name' => '支払承認', 'description' => '支払を承認する権限', 'module' => 'payment', 'action' => 'approve', 'resource' => null, 'is_system' => false],
            ['name' => 'payment.report', 'display_name' => '支払通知書出力', 'description' => '支払通知書を出力する権限', 'module' => 'payment', 'action' => 'report', 'resource' => null, 'is_system' => false],
            
            // 承認権限
            ['name' => 'estimate.approval.view', 'display_name' => '見積承認依頼閲覧', 'description' => '見積承認依頼を閲覧する権限', 'module' => 'estimate', 'action' => 'approval', 'resource' => 'view', 'is_system' => false],
            ['name' => 'estimate.approval.approve', 'display_name' => '見積承認', 'description' => '見積を承認する権限', 'module' => 'estimate', 'action' => 'approval', 'resource' => 'approve', 'is_system' => false],
            ['name' => 'estimate.approval.reject', 'display_name' => '見積却下', 'description' => '見積を却下する権限', 'module' => 'estimate', 'action' => 'approval', 'resource' => 'reject', 'is_system' => false],
            ['name' => 'estimate.approval.return', 'display_name' => '見積差し戻し', 'description' => '見積を差し戻す権限', 'module' => 'estimate', 'action' => 'approval', 'resource' => 'return', 'is_system' => false],
            
            ['name' => 'budget.approval.view', 'display_name' => '予算承認依頼閲覧', 'description' => '予算承認依頼を閲覧する権限', 'module' => 'budget', 'action' => 'approval', 'resource' => 'view', 'is_system' => false],
            ['name' => 'budget.approval.approve', 'display_name' => '予算承認', 'description' => '予算を承認する権限', 'module' => 'budget', 'action' => 'approval', 'resource' => 'approve', 'is_system' => false],
            ['name' => 'budget.approval.reject', 'display_name' => '予算却下', 'description' => '予算を却下する権限', 'module' => 'budget', 'action' => 'approval', 'resource' => 'reject', 'is_system' => false],
            ['name' => 'budget.approval.return', 'display_name' => '予算差し戻し', 'description' => '予算を差し戻す権限', 'module' => 'budget', 'action' => 'approval', 'resource' => 'return', 'is_system' => false],
            
            ['name' => 'order.approval.view', 'display_name' => '発注承認依頼閲覧', 'description' => '発注承認依頼を閲覧する権限', 'module' => 'order', 'action' => 'approval', 'resource' => 'view', 'is_system' => false],
            ['name' => 'order.approval.approve', 'display_name' => '発注承認', 'description' => '発注を承認する権限', 'module' => 'order', 'action' => 'approval', 'resource' => 'approve', 'is_system' => false],
            ['name' => 'order.approval.reject', 'display_name' => '発注却下', 'description' => '発注を却下する権限', 'module' => 'order', 'action' => 'approval', 'resource' => 'reject', 'is_system' => false],
            ['name' => 'order.approval.return', 'display_name' => '発注差し戻し', 'description' => '発注を差し戻す権限', 'module' => 'order', 'action' => 'approval', 'resource' => 'return', 'is_system' => false],
            
            ['name' => 'progress.approval.view', 'display_name' => '出来高承認依頼閲覧', 'description' => '出来高承認依頼を閲覧する権限', 'module' => 'progress', 'action' => 'approval', 'resource' => 'view', 'is_system' => false],
            ['name' => 'progress.approval.approve', 'display_name' => '出来高承認', 'description' => '出来高を承認する権限', 'module' => 'progress', 'action' => 'approval', 'resource' => 'approve', 'is_system' => false],
            ['name' => 'progress.approval.reject', 'display_name' => '出来高却下', 'description' => '出来高を却下する権限', 'module' => 'progress', 'action' => 'approval', 'resource' => 'reject', 'is_system' => false],
            ['name' => 'progress.approval.return', 'display_name' => '出来高差し戻し', 'description' => '出来高を差し戻す権限', 'module' => 'progress', 'action' => 'approval', 'resource' => 'return', 'is_system' => false],
            
            ['name' => 'payment.approval.view', 'display_name' => '支払承認依頼閲覧', 'description' => '支払承認依頼を閲覧する権限', 'module' => 'payment', 'action' => 'approval', 'resource' => 'view', 'is_system' => false],
            ['name' => 'payment.approval.approve', 'display_name' => '支払承認', 'description' => '支払を承認する権限', 'module' => 'payment', 'action' => 'approval', 'resource' => 'approve', 'is_system' => false],
            ['name' => 'payment.approval.reject', 'display_name' => '支払却下', 'description' => '支払を却下する権限', 'module' => 'payment', 'action' => 'approval', 'resource' => 'reject', 'is_system' => false],
            ['name' => 'payment.approval.return', 'display_name' => '支払差し戻し', 'description' => '支払を差し戻す権限', 'module' => 'payment', 'action' => 'approval', 'resource' => 'return', 'is_system' => false],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->insert([
                'name' => $permission['name'],
                'display_name' => $permission['display_name'],
                'description' => $permission['description'],
                'module' => $permission['module'],
                'action' => $permission['action'],
                'resource' => $permission['resource'],
                'is_system' => $permission['is_system'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }
}
