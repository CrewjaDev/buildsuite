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
        Schema::create('construction_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('construction_id')->constrained('constructions')->onDelete('cascade')->comment('工事ID');
            $table->uuid('parent_id')->nullable()->comment('親明細ID（階層構造用）');
            $table->string('item_type', 20)->comment('明細種別');
            $table->integer('display_order')->default(0)->comment('表示順序');
            $table->string('name', 500)->comment('実行予算時の品名・仕様');
            $table->text('description')->nullable()->comment('実行予算時の詳細説明');
            $table->decimal('quantity', 12, 2)->default(1)->comment('実行予算時の数量');
            $table->string('unit', 50)->default('個')->comment('実行予算時の単位');
            $table->bigInteger('unit_price')->default(0)->comment('実行予算時の単価');
            $table->bigInteger('amount')->default(0)->comment('実行予算時の金額');
            $table->bigInteger('estimated_cost')->default(0)->comment('実行予算時の予想原価');
            $table->string('supplier', 255)->nullable()->comment('実行予算時の発注先');
            $table->string('construction_method', 255)->nullable()->comment('実行予算時の工法');
            $table->foreignUuid('construction_classification_id')->nullable()->constrained('construction_classifications')->comment('工事分類ID');
            $table->decimal('progress_rate', 5, 2)->default(0)->comment('進捗率');
            $table->date('start_date')->nullable()->comment('開始日');
            $table->date('end_date')->nullable()->comment('完了日');
            $table->text('remarks')->nullable()->comment('備考');
            $table->boolean('is_expanded')->default(true)->comment('展開フラグ');
            $table->boolean('is_active')->default(true)->comment('有効フラグ');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('construction_id');
            $table->index('parent_id');
            $table->index('item_type');
            $table->index('display_order');
            $table->index('construction_classification_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('construction_items');
    }
};
