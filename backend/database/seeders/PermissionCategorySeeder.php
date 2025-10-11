<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('権限のカテゴリ分類を開始します...');

        // 承認ステップ用権限の分類
        $approvalStepPermissions = Permission::where(function ($query) {
            $query->where('name', 'like', '%.approval.approve')
                  ->orWhere('name', 'like', '%.approval.reject')
                  ->orWhere('name', 'like', '%.approval.return');
        })->get();

        foreach ($approvalStepPermissions as $permission) {
            $permission->update([
                'category' => 'approval_step',
                'subcategory' => 'action'
            ]);
        }

        $this->command->info("承認ステップ用権限: {$approvalStepPermissions->count()}件を分類しました");

        // 承認依頼用権限の分類
        $approvalRequestPermissions = Permission::where('name', 'like', '%.approval.request')->get();

        foreach ($approvalRequestPermissions as $permission) {
            $permission->update([
                'category' => 'approval_request',
                'subcategory' => 'action'
            ]);
        }

        $this->command->info("承認依頼用権限: {$approvalRequestPermissions->count()}件を分類しました");

        // 承認依頼一覧用権限の分類
        $approvalListPermissions = Permission::where('name', 'like', '%.approval.list')->get();

        foreach ($approvalListPermissions as $permission) {
            $permission->update([
                'category' => 'approval_request',
                'subcategory' => 'list'
            ]);
        }

        $this->command->info("承認依頼一覧用権限: {$approvalListPermissions->count()}件を分類しました");

        // 承認閲覧用権限の分類
        $approvalViewPermissions = Permission::where('name', 'like', '%.approval.view')->get();

        foreach ($approvalViewPermissions as $permission) {
            $permission->update([
                'category' => 'approval_view',
                'subcategory' => 'action'
            ]);
        }

        $this->command->info("承認閲覧用権限: {$approvalViewPermissions->count()}件を分類しました");

        // 承認キャンセル用権限の分類
        $approvalCancelPermissions = Permission::where('name', 'like', '%.approval.cancel')->get();

        foreach ($approvalCancelPermissions as $permission) {
            $permission->update([
                'category' => 'approval_cancel',
                'subcategory' => 'action'
            ]);
        }

        $this->command->info("承認キャンセル用権限: {$approvalCancelPermissions->count()}件を分類しました");

        // 基本操作権限の分類
        $basicOperationPermissions = Permission::where(function ($query) {
            $query->where('name', 'like', '%.view')
                  ->orWhere('name', 'like', '%.create')
                  ->orWhere('name', 'like', '%.edit')
                  ->orWhere('name', 'like', '%.delete');
        })->where('name', 'not like', '%.approval.%')->get();

        foreach ($basicOperationPermissions as $permission) {
            $permission->update([
                'category' => 'basic_operation',
                'subcategory' => 'crud'
            ]);
        }

        $this->command->info("基本操作権限: {$basicOperationPermissions->count()}件を分類しました");

        // 一覧権限の分類
        $listPermissions = Permission::where('name', 'like', '%.list')
            ->where('name', 'not like', '%.approval.%')
            ->where('name', 'not like', '%.flow.%')
            ->get();

        foreach ($listPermissions as $permission) {
            $permission->update([
                'category' => 'basic_operation',
                'subcategory' => 'list'
            ]);
        }

        $this->command->info("一覧権限: {$listPermissions->count()}件を分類しました");

        // 利用権限の分類
        $usePermissions = Permission::where('name', 'like', '%.use')->get();

        foreach ($usePermissions as $permission) {
            $permission->update([
                'category' => 'module_access',
                'subcategory' => 'use'
            ]);
        }

        $this->command->info("利用権限: {$usePermissions->count()}件を分類しました");

        // システム権限の分類
        $systemPermissions = Permission::where('name', 'like', 'system.%')
            ->orWhere('name', 'like', 'approval.flow.%')
            ->orWhere('name', 'like', 'approval.authority')
            ->orWhere('name', 'like', 'approval.list')
            ->get();

        foreach ($systemPermissions as $permission) {
            $permission->update([
                'category' => 'system',
                'subcategory' => 'management'
            ]);
        }

        $this->command->info("システム権限: {$systemPermissions->count()}件を分類しました");

        $this->command->info('権限のカテゴリ分類が完了しました。');
    }
}
