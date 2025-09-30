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
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('税率名');
            $table->decimal('rate', 5, 4)->comment('税率（0.10 = 10%）');
            $table->date('effective_from')->comment('適用開始日');
            $table->date('effective_to')->nullable()->comment('適用終了日');
            $table->boolean('is_active')->default(true)->comment('有効フラグ');
            $table->text('description')->nullable()->comment('説明');
            $table->timestamps();
            
            // インデックス
            $table->index(['is_active', 'effective_from', 'effective_to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_rates');
    }
};
