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
        Schema::create('approval_request_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();                    // タイプコード
            $table->string('name', 255);                             // タイプ名
            $table->text('description')->nullable();                 // 説明
            $table->string('icon', 100)->nullable();                 // アイコン
            $table->string('color', 20)->nullable();                 // 色
            $table->unsignedBigInteger('default_approval_flow_id')->nullable(); // デフォルト承認フロー
            $table->boolean('is_active')->default(true);             // 有効/無効
            $table->integer('sort_order')->default(0);               // 並び順
            $table->unsignedBigInteger('created_by')->nullable();    // 作成者
            $table->unsignedBigInteger('updated_by')->nullable();    // 更新者
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('code');
            $table->index('is_active');
            $table->index('sort_order');
            
            // 外部キー制約
            $table->foreign('default_approval_flow_id')->references('id')->on('approval_flows')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_request_types');
    }
};
