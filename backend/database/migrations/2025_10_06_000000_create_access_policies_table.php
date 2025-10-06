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
        Schema::create('access_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100); // ポリシー名
            $table->text('description')->nullable(); // ポリシー説明
            $table->string('business_code', 50); // ビジネスコード（estimate, budget等）
            $table->string('action', 50); // アクション（view, create, edit, delete等）
            $table->string('resource_type', 50); // リソースタイプ（estimate, budget等）
            $table->json('conditions'); // 条件式（JSON形式）
            $table->json('scope')->nullable(); // スコープ設定（JSON形式）
            $table->enum('effect', ['allow', 'deny'])->default('allow'); // 効果（許可/拒否）
            $table->integer('priority')->default(0); // 優先度（数値が大きいほど優先）
            $table->boolean('is_active')->default(true); // アクティブフラグ
            $table->boolean('is_system')->default(false); // システムポリシーフラグ
            $table->json('metadata')->nullable(); // メタデータ（JSON形式）
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('business_code');
            $table->index('action');
            $table->index('resource_type');
            $table->index('effect');
            $table->index('priority');
            $table->index('is_active');
            $table->index('is_system');
            $table->index(['business_code', 'action', 'resource_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_policies');
    }
};
