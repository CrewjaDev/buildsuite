<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * 制約が存在するかチェック
     */
    private function constraintExists($table, $constraint)
    {
        $constraints = DB::select("
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = ? AND constraint_name = ?
        ", [$table, $constraint]);
        
        return count($constraints) > 0;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // employeesテーブルに移行済みの社員基本情報カラムを削除
            $table->dropColumn([
                'name',
                'name_kana', 
                'email',
                'birth_date',
                'gender',
                'phone',
                'mobile_phone',
                'postal_code',
                'prefecture',
                'address',
                'job_title',
                'hire_date',
                'service_years',
                'service_months',
                'position_id'
            ]);
        });
        
        // employee_idの型をunsignedBigIntegerに変更し、制約を追加
        // PostgreSQLでは型変換にUSINGを使用する必要がある
        DB::statement('ALTER TABLE users ALTER COLUMN employee_id TYPE bigint USING employee_id::bigint');
        
        Schema::table('users', function (Blueprint $table) {
            // ユニーク制約を追加（存在しない場合のみ）
            if (!$this->constraintExists('users', 'users_employee_id_unique')) {
                $table->unique('employee_id');
            }
            // 外部キー制約を追加（存在しない場合のみ）
            if (!$this->constraintExists('users', 'users_employee_id_foreign')) {
                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ユニーク制約を削除
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['employee_id']);
        });
        
        // 削除したカラムを復元
        Schema::table('users', function (Blueprint $table) {
            $table->string('name', 255)->after('employee_id');
            $table->string('name_kana', 255)->nullable()->after('name');
            $table->string('email')->nullable()->after('name_kana');
            $table->date('birth_date')->nullable()->after('email');
            $table->string('gender', 10)->nullable()->after('birth_date');
            $table->string('phone', 20)->nullable()->after('gender');
            $table->string('mobile_phone', 20)->nullable()->after('phone');
            $table->string('postal_code', 10)->nullable()->after('mobile_phone');
            $table->string('prefecture', 50)->nullable()->after('postal_code');
            $table->text('address')->nullable()->after('prefecture');
            $table->string('job_title', 100)->nullable()->after('address');
            $table->date('hire_date')->nullable()->after('job_title');
            $table->integer('service_years')->nullable()->after('hire_date');
            $table->integer('service_months')->nullable()->after('service_years');
            $table->foreignId('position_id')->nullable()->constrained('positions')->after('service_months');
        });
    }
};
