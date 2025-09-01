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
        Schema::create('estimate_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('estimate_id')->constrained('estimates')->onDelete('cascade')->comment('見積ID');
            $table->uuid('parent_id')->nullable()->comment('親明細ID（階層構造用）');
            $table->string('item_type', 20)->comment('明細種別（large/medium/small/detail）');
            $table->integer('display_order')->default(0)->comment('表示順序');
            $table->string('name', 500)->comment('品名・仕様・内訳名');
            $table->text('description')->nullable()->comment('詳細説明');
            $table->decimal('quantity', 12, 2)->default(1)->comment('数量');
            $table->string('unit', 50)->default('個')->comment('単位');
            $table->bigInteger('unit_price')->default(0)->comment('単価（顧客提示用）');
            $table->bigInteger('amount')->default(0)->comment('金額（顧客提示用）');
            $table->bigInteger('estimated_cost')->default(0)->comment('予想原価（社内用）');
            $table->foreignId('supplier_id')->nullable()->constrained('partners')->comment('発注先（取引先ID）');
            $table->string('construction_method', 255)->nullable()->comment('工法');
            $table->foreignId('construction_classification_id')->nullable()->constrained('construction_classifications')->comment('工事分類ID');
            $table->text('remarks')->nullable()->comment('備考');
            $table->boolean('is_expanded')->default(true)->comment('展開状態');
            $table->boolean('is_active')->default(true)->comment('有効フラグ');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('estimate_id');
            $table->index('parent_id');
            $table->index('item_type');
            $table->index('display_order');
            $table->index('is_active');
            $table->index('construction_classification_id');
            $table->index('supplier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimate_items');
    }
};
