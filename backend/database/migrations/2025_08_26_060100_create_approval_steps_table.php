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
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_flow_id')->constrained('approval_flows')->onDelete('cascade');
            $table->integer('step_order');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('approver_type', 50); // user, role, department, system_level
            $table->foreignId('approver_id')->nullable(); // 承認者ID（approver_typeに応じて）
            $table->json('approver_condition')->nullable(); // 承認条件（JSON）
            $table->boolean('is_required')->default(true);
            $table->boolean('can_delegate')->default(false);
            $table->integer('timeout_hours')->nullable(); // タイムアウト時間（時間）
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('approval_flow_id');
            $table->index('step_order');
            $table->index('approver_type');
            $table->index('approver_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
