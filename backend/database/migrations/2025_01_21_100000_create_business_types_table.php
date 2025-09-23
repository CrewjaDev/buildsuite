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
        Schema::create('business_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('業務コード（estimate, budget, purchase等）');
            $table->string('name', 100)->comment('業務名（見積、予算、発注等）');
            $table->string('description')->nullable()->comment('業務説明');
            $table->string('category', 50)->default('general')->comment('業務カテゴリ（financial, operational, administrative等）');
            $table->integer('sort_order')->default(0)->comment('表示順序');
            $table->boolean('is_active')->default(true)->comment('有効フラグ');
            $table->boolean('requires_approval')->default(true)->comment('承認必須フラグ');
            $table->jsonb('default_permissions')->nullable()->comment('デフォルト権限設定');
            $table->jsonb('settings')->nullable()->comment('業務固有設定');
            $table->timestamps();
            
            $table->index(['is_active', 'sort_order']);
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_types');
    }
};
