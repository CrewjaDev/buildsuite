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
        Schema::create('construction_classifications', function (Blueprint $table) {
            $table->id();
            $table->string('classification_code', 20)->unique()->comment('工事分類コード');
            $table->string('classification_name', 100)->comment('工事分類名称');
            $table->string('subject_code', 10)->comment('科目CD');
            $table->text('description')->nullable()->comment('説明');
            $table->integer('display_order')->default(0)->comment('表示順序');
            $table->boolean('is_active')->default(true)->comment('有効フラグ');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('classification_code');
            $table->index('display_order');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('construction_classifications');
    }
};
