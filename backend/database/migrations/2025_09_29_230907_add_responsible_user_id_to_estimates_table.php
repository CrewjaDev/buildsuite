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
            $table->unsignedBigInteger('responsible_user_id')->nullable()->after('created_by')->comment('担当者ID');
            $table->foreign('responsible_user_id')->references('id')->on('users')->onDelete('set null');
            $table->index('responsible_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->dropForeign(['responsible_user_id']);
            $table->dropIndex(['responsible_user_id']);
            $table->dropColumn('responsible_user_id');
        });
    }
};
