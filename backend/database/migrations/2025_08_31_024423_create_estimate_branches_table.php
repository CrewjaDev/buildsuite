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
        Schema::create('estimate_branches', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('parent_estimate_id')->constrained('estimates')->comment('親見積ID');
            $table->integer('branch_number')->comment('枝番番号');
            $table->string('branch_name', 255)->nullable()->comment('枝番名称');
            $table->text('description')->nullable()->comment('説明');
            $table->string('status', 50)->default('draft')->comment('ステータス');
            $table->foreignId('created_by')->constrained('users')->comment('作成者ID');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('parent_estimate_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimate_branches');
    }
};
