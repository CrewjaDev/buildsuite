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
        Schema::create('project_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_code', 20)->unique()->comment('工事種別コード');
            $table->string('type_name', 100)->comment('工事種別名称');
            $table->string('type_symbol', 10)->nullable()->comment('工事種別記号');
            $table->text('description')->nullable()->comment('説明');
            $table->decimal('overhead_rate', 5, 2)->default(0)->comment('一般管理費率（%）');
            $table->decimal('cost_expense_rate', 5, 2)->default(0)->comment('原価経費率（%）');
            $table->decimal('material_expense_rate', 5, 2)->default(0)->comment('材料経費率（%）');
            $table->boolean('is_active')->default(true)->comment('有効フラグ');
            $table->integer('sort_order')->default(0)->comment('表示順序');
            $table->foreignId('created_by')->constrained('users')->comment('作成者ID');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('type_code');
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_types');
    }
};
