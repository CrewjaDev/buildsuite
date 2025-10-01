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
        Schema::create('business_code_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_code_id')->constrained('business_codes')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->boolean('is_default')->default(true); // デフォルト権限かどうか
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // ユニーク制約
            $table->unique(['business_code_id', 'permission_id']);
            
            // インデックス
            $table->index('business_code_id');
            $table->index('permission_id');
            $table->index('is_default');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_code_permissions');
    }
};
