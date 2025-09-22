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
        Schema::create('approval_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('approval_request_id');        // 承認依頼ID
            $table->string('notification_type', 50);                  // 通知タイプ
            $table->unsignedBigInteger('recipient_id');               // 受信者ID
            $table->string('title', 255);                             // タイトルを
            $table->text('message');                                  // メッセージ
            $table->boolean('is_read')->default(false);               // 既読フラグ
            $table->timestamp('read_at')->nullable();                 // 既読日時
            $table->timestamp('sent_at')->nullable();                 // 送信日時
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('approval_request_id');
            $table->index('notification_type');
            $table->index('recipient_id');
            $table->index('is_read');
            $table->index('sent_at');
            
            // 外部キー制約
            $table->foreign('approval_request_id')->references('id')->on('approval_requests')->onDelete('cascade');
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_notifications');
    }
};
