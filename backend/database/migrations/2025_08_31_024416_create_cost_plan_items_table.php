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
        Schema::create('cost_plan_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('cost_plan_id')->constrained('cost_plans')->onDelete('cascade')->comment('原価計画ID');
            $table->foreignUuid('estimate_item_id')->constrained('estimate_items')->comment('見積明細ID');
            $table->foreignId('supplier_id')->nullable()->constrained('partners')->comment('発注先（取引先ID）');
            $table->bigInteger('estimated_cost')->default(0)->comment('予想原価');
            $table->text('remarks')->nullable()->comment('備考');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('cost_plan_id');
            $table->index('estimate_item_id');
            $table->index('supplier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cost_plan_items');
    }
};
