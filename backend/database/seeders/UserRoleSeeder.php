<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Employee;

class UserRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // システム管理者にシステム管理者役割を割り当て
        $adminUser = User::where('login_id', 'admin')->first();
        $systemManagerRole = Role::where('name', 'system_manager')->first();
        
        if ($adminUser && $systemManagerRole) {
            $adminUser->roles()->attach($systemManagerRole->id, [
                'assigned_at' => now(),
                'assigned_by' => 2,
                'is_active' => true
            ]);
        }

        // 山田太郎（営業主任）に営業マネージャー役割を割り当て
        $yamadaUser = User::where('login_id', 'yamada')->first();
        $salesManagerRole = Role::where('name', 'sales_manager')->first();
        
        if ($yamadaUser && $salesManagerRole) {
            $yamadaUser->roles()->attach($salesManagerRole->id, [
                'assigned_at' => now(),
                'assigned_by' => 2,
                'is_active' => true
            ]);
        }

        // 佐藤花子（営業担当）に営業担当役割を割り当て
        $satoUser = User::where('login_id', 'sato')->first();
        $salesStaffRole = Role::where('name', 'sales_staff')->first();
        
        if ($satoUser && $salesStaffRole) {
            $satoUser->roles()->attach($salesStaffRole->id, [
                'assigned_at' => now(),
                'assigned_by' => 2,
                'is_active' => true
            ]);
        }

        // 工事部ユーザーに工事担当役割を割り当て
        $constructionUser = User::where('login_id', 'construction')->first();
        $constructionStaffRole = Role::where('name', 'construction_staff')->first();
        
        if ($constructionUser && $constructionStaffRole) {
            $constructionUser->roles()->attach($constructionStaffRole->id, [
                'assigned_at' => now(),
                'assigned_by' => 2,
                'is_active' => true
            ]);
        }

        // 経理部ユーザー（課長職位）に経理責任者役割を割り当て
        $accountingUser = User::where('login_id', 'accounting')->first();
        $accountingManagerRole = Role::where('name', 'accounting_manager')->first();
        
        if ($accountingUser && $accountingManagerRole) {
            $accountingUser->roles()->attach($accountingManagerRole->id, [
                'assigned_at' => now(),
                'assigned_by' => 2,
                'is_active' => true
            ]);
        }

        // 役職（job_title）に基づく自動割り当て
        $this->assignRolesByJobTitle();
    }

    /**
     * 役職（job_title）に基づいて役割を自動割り当て
     */
    private function assignRolesByJobTitle(): void
    {
        $employees = Employee::with('user')->get();
        
        foreach ($employees as $employee) {
            if (!$employee->user || !$employee->job_title) {
                continue;
            }

            $role = null;
            
            // 役職名に基づいて役割を決定
            switch ($employee->job_title) {
                case 'システム管理者':
                    $role = Role::where('name', 'system_manager')->first();
                    break;
                case '営業主任':
                    $role = Role::where('name', 'sales_manager')->first();
                    break;
                case '営業担当':
                    $role = Role::where('name', 'sales_staff')->first();
                    break;
                case '工事責任者':
                    $role = Role::where('name', 'construction_manager')->first();
                    break;
                case '工事担当':
                    $role = Role::where('name', 'construction_staff')->first();
                    break;
                case '経理責任者':
                    $role = Role::where('name', 'accounting_manager')->first();
                    break;
                case '経理担当':
                    $role = Role::where('name', 'accounting_staff')->first();
                    break;
                case '事務長':
                    $role = Role::where('name', 'office_manager')->first();
                    break;
                case '事務担当':
                    $role = Role::where('name', 'office_staff')->first();
                    break;
                case '見積担当':
                    $role = Role::where('name', 'estimator')->first();
                    break;
            }

            // 役割が決定され、まだ割り当てられていない場合
            if ($role && !$employee->user->roles()->where('role_id', $role->id)->exists()) {
                $employee->user->roles()->attach($role->id, [
                    'assigned_at' => now(),
                    'assigned_by' => 2,
                    'is_active' => true
                ]);
            }
        }
    }
}
