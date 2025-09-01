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
        Schema::create('cost_plans', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('estimate_id')->constrained('estimates')->onDelete('cascade')->comment('見積ID');
            $table->integer('plan_number')->comment('計画番号（一次、二次、三次...）');
            $table->string('plan_name', 255)->nullable()->comment('計画名称');
            $table->text('description')->nullable()->comment('説明');
            $table->boolean('is_active')->default(false)->comment('有効フラグ');
            $table->foreignId('created_by')->constrained('users')->comment('作成者ID');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('estimate_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cost_plans');
    }
};
