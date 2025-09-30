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
        Schema::table('estimates', function (Blueprint $table) {
            $table->string('visibility', 20)->default('private')->after('status')->comment('データ可視性: private, department, division, company');
            $table->unsignedBigInteger('department_id')->nullable()->after('created_by')->comment('部署ID');
            
            // インデックスを追加
            $table->index(['visibility', 'department_id', 'created_by'], 'idx_estimates_visibility');
            
            // 外部キー制約
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropIndex('idx_estimates_visibility');
            $table->dropColumn(['visibility', 'department_id']);
        });
    }
};
