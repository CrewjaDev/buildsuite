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
        Schema::create('business_code_access_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_code_id')->constrained('business_codes')->onDelete('cascade');
            $table->foreignId('access_policy_id')->constrained('access_policies')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // ユニーク制約
            $table->unique(['business_code_id', 'access_policy_id']);
            
            // インデックス
            $table->index('business_code_id');
            $table->index('access_policy_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_code_access_policies');
    }
};
