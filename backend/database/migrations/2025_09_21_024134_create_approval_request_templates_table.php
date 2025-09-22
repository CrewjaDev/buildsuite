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
        Schema::create('approval_request_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);                             // テンプレート名
            $table->text('description')->nullable();                 // 説明
            $table->string('request_type', 50);                      // 依頼タイプ
            $table->json('template_data');                           // テンプレートデータ
            $table->boolean('is_active')->default(true);             // 有効/無効
            $table->boolean('is_system')->default(false);            // システムテンプレート
            $table->integer('usage_count')->default(0);              // 使用回数
            $table->unsignedBigInteger('created_by')->nullable();    // 作成者
            $table->unsignedBigInteger('updated_by')->nullable();    // 更新者
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('request_type');
            $table->index('is_active');
            $table->index('is_system');
            $table->index('usage_count');
            
            // 外部キー制約
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_request_templates');
    }
};
