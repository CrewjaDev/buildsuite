<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 基本情報の追加
            $table->string('employee_id', 50)->unique()->after('id');
            $table->string('name_kana')->nullable()->after('name');
            $table->date('birth_date')->nullable()->after('name_kana');
            $table->string('gender', 10)->nullable()->after('birth_date');
            
            // 連絡先情報の追加
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('mobile_phone', 20)->nullable()->after('phone');
            
            // 住所情報の追加
            $table->string('postal_code', 10)->nullable()->after('mobile_phone');
            $table->string('prefecture', 50)->nullable()->after('postal_code');
            $table->text('address')->nullable()->after('prefecture');

            // 所属情報の追加
            $table->string('position', 100)->nullable()->after('mobile_phone');
            $table->string('job_title', 100)->nullable()->after('position');
            $table->date('hire_date')->nullable()->after('job_title');
            $table->integer('service_years')->nullable()->after('hire_date');
            $table->integer('service_months')->nullable()->after('service_years');
            
            // システム情報の追加
            $table->string('system_level', 50)->default('staff')->after('service_months');
            $table->boolean('is_active')->default(true)->after('system_level');
            $table->boolean('is_admin')->default(false)->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('is_admin');
            $table->timestamp('password_changed_at')->nullable()->after('last_login_at');
            $table->timestamp('password_expires_at')->nullable()->after('password_changed_at');
            $table->integer('failed_login_attempts')->default(0)->after('password_expires_at');
            $table->timestamp('locked_at')->nullable()->after('failed_login_attempts');
            
            // インデックスの追加
            $table->index('employee_id');
            $table->index('is_active');
            $table->index('is_admin');
            $table->index('birth_date');
            $table->index('hire_date');
            $table->index('system_level');
            $table->index('postal_code');
            $table->index('prefecture');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 追加したカラムを削除
            $table->dropColumn([
                'employee_id', 'name_kana', 'birth_date', 'gender',
                'phone', 'mobile_phone', 'postal_code', 'prefecture', 'address',
                'position', 'job_title', 'hire_date', 'service_years', 'service_months',
                'system_level', 'is_active', 'is_admin', 'last_login_at',
                'password_changed_at', 'password_expires_at',
                'failed_login_attempts', 'locked_at'
            ]);
            
            // 追加したインデックスを削除
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['is_admin']);
            $table->dropIndex(['birth_date']);
            $table->dropIndex(['hire_date']);
            $table->dropIndex(['system_level']);
            $table->dropIndex(['postal_code']);
            $table->dropIndex(['prefecture']);
        });
    }
};