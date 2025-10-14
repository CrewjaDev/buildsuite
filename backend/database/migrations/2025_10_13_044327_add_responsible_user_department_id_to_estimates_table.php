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
            $table->unsignedBigInteger('responsible_user_department_id')->nullable()->after('responsible_user_id')->comment('担当者の部署ID');
            $table->foreign('responsible_user_department_id')->references('id')->on('departments')->onDelete('set null');
            $table->index('responsible_user_department_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->dropForeign(['responsible_user_department_id']);
            $table->dropIndex(['responsible_user_department_id']);
            $table->dropColumn('responsible_user_department_id');
        });
    }
};
