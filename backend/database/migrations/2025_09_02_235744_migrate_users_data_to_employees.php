<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 既存のusersテーブルのデータをemployeesテーブルに移行
        $users = DB::table('users')->get();
        
        foreach ($users as $user) {
            // 部署IDを取得（nullの場合はデフォルト部署を設定）
            $departmentId = $this->getDepartmentId($user->id);
            if (!$departmentId) {
                // デフォルト部署を取得（最初の有効な部署）
                $defaultDepartment = DB::table('departments')
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->first();
                $departmentId = $defaultDepartment ? $defaultDepartment->id : 1; // フォールバック
            }
            
            // employee_idがnullの場合は自動生成
            $employeeIdValue = $user->employee_id;
            if (!$employeeIdValue) {
                $employeeIdValue = 'EMP' . str_pad($user->id, 6, '0', STR_PAD_LEFT);
            }
            
            // employeesテーブルにデータを挿入
            $employeeId = DB::table('employees')->insertGetId([
                'employee_id' => $employeeIdValue,
                'name' => $user->name,
                'name_kana' => $user->name_kana,
                'email' => $user->email,
                'birth_date' => $user->birth_date,
                'gender' => $user->gender,
                'phone' => $user->phone,
                'mobile_phone' => $user->mobile_phone,
                'postal_code' => $user->postal_code,
                'prefecture' => $user->prefecture,
                'address' => $user->address,
                'job_title' => $user->job_title,
                'hire_date' => $user->hire_date,
                'service_years' => $user->service_years,
                'service_months' => $user->service_months,
                'department_id' => $departmentId,
                'position_id' => $user->position_id,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);
            
            // usersテーブルのemployee_idを更新（新しいemployeesテーブルのIDに置き換え）
            DB::table('users')->where('id', $user->id)->update([
                'employee_id' => (string)$employeeId  // 文字列として保存
            ]);
        }
        
        // 外部キー制約は後のマイグレーションで追加
        // （employee_idの型をintegerに変更した後）
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 外部キー制約を削除
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['employee_id']);
        });
        
        // employeesテーブルのデータを削除
        DB::table('employees')->truncate();
        
        // usersテーブルのemployee_idをnullに戻す
        DB::table('users')->update(['employee_id' => null]);
    }
    
    /**
     * ユーザーの主要部署IDを取得
     */
    private function getDepartmentId($userId): ?int
    {
        $department = DB::table('user_departments')
            ->where('user_id', $userId)
            ->where('is_primary', true)
            ->where('is_active', true)
            ->first();
            
        return $department ? $department->department_id : null;
    }
};
