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
            // employee_idカラムが既に存在する場合は何もしない
            // 既存のemployee_idカラムの型を確認・調整
            if (Schema::hasColumn('users', 'employee_id')) {
                // 既存のemployee_idカラムをnullableに変更（もしnullableでない場合）
                $table->string('employee_id', 50)->nullable()->change();
            } else {
                // employee_idカラムが存在しない場合は追加
                $table->string('employee_id', 50)->nullable()->after('id')->comment('社員ID（外部キー）');
            }
            
            // システム権限関連のカラムを調整
            $table->string('login_id')->nullable()->change();
            $table->string('password')->nullable()->change();
            $table->string('system_level', 50)->nullable()->change();
            
            // インデックスを追加（存在しない場合のみ）
            if (!Schema::hasIndex('users', ['employee_id'])) {
                $table->index('employee_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 追加したカラムを削除
            $table->dropIndex(['employee_id']);
            $table->dropColumn('employee_id');
            
            // カラムを元に戻す
            $table->string('login_id')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
            $table->string('system_level', 50)->nullable(false)->change();
        });
    }
};
