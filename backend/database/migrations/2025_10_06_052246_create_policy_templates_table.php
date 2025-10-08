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
        Schema::create('policy_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_code', 100)->unique()->comment('テンプレートコード');
            $table->string('name', 255)->comment('テンプレート名');
            $table->text('description')->nullable()->comment('説明');
            $table->string('category', 100)->comment('カテゴリ');
            $table->string('condition_type', 100)->comment('条件タイプ');
            $table->json('condition_rule')->comment('条件ルール');
            $table->json('parameters')->nullable()->comment('パラメータ設定');
            $table->json('applicable_actions')->comment('適用可能なアクション');
            $table->json('tags')->nullable()->comment('タグ');
            $table->boolean('is_system')->default(false)->comment('システムテンプレート');
            $table->boolean('is_active')->default(true)->comment('アクティブ');
            $table->integer('priority')->default(50)->comment('優先度');
            $table->json('metadata')->nullable()->comment('メタデータ');
            $table->timestamps();
            
            // インデックス
            $table->index('template_code');
            $table->index('category');
            $table->index('condition_type');
            $table->index('is_system');
            $table->index('is_active');
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policy_templates');
    }
};
