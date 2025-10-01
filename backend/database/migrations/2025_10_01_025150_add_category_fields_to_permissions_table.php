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
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('category', 100)->nullable()->after('resource')->comment('権限カテゴリ');
            $table->string('subcategory', 100)->nullable()->after('category')->comment('権限サブカテゴリ');
            
            // インデックス追加
            $table->index('category', 'idx_permissions_category');
            $table->index('subcategory', 'idx_permissions_subcategory');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropIndex('idx_permissions_category');
            $table->dropIndex('idx_permissions_subcategory');
            $table->dropColumn(['category', 'subcategory']);
        });
    }
};
