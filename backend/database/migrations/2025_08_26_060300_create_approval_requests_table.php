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
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_flow_id')->constrained('approval_flows')->onDelete('cascade');
            $table->string('request_type', 50); // estimate, budget, order, progress, payment
            $table->foreignId('request_id'); // 依頼元のID
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->jsonb('request_data')->nullable(); // 依頼データ（JSONB）
            $table->integer('current_step')->default(1)->comment('現在のステップ番号（1-5）');
            $table->string('status', 20)->default('pending'); // pending, approved, rejected, returned, cancelled
            $table->string('priority', 20)->default('normal'); // low, normal, high, urgent
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('rejected_at')->nullable();
            $table->foreignId('returned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('returned_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('approval_flow_id');
            $table->index('request_type');
            $table->index('request_id');
            $table->index('current_step');
            $table->index('status');
            $table->index('priority');
            $table->index('requested_by');
            $table->index('approved_by');
            $table->index('rejected_by');
            $table->index('returned_by');
            $table->index('cancelled_by');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_requests');
    }
};
