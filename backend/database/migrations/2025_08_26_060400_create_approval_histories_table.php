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
        Schema::create('approval_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_request_id')->constrained('approval_requests')->onDelete('cascade');
            $table->integer('step')->nullable()->comment('ステップ番号（1-5）');
            $table->string('action', 20); // approve, reject, return, cancel, delegate
            $table->foreignId('acted_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('acted_at')->useCurrent();
            $table->text('comment')->nullable();
            $table->foreignId('delegated_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('delegated_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('approval_request_id');
            $table->index('step');
            $table->index('action');
            $table->index('acted_by');
            $table->index('acted_at');
            $table->index('delegated_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_histories');
    }
};
