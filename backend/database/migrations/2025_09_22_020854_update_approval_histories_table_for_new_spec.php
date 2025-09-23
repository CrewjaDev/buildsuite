<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('approval_histories', function (Blueprint $table) {
            // approval_step_idを削除し、stepカラムを追加
            $table->dropForeign(['approval_step_id']);
            $table->dropColumn('approval_step_id');
            $table->integer('step')->after('approval_request_id')->comment('ステップ番号（1-5）');
        });
        
        // インデックスの更新（存在チェック付き）
        DB::statement('DROP INDEX IF EXISTS approval_histories_approval_step_id_index');
        DB::statement('CREATE INDEX idx_approval_histories_step ON approval_histories (step)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approval_histories', function (Blueprint $table) {
            // stepカラムを削除し、approval_step_idを復元
            $table->dropIndex('idx_approval_histories_step');
            $table->dropColumn('step');
            $table->foreignId('approval_step_id')->nullable()->constrained('approval_steps')->onDelete('set null');
            $table->index('approval_step_id');
        });
    }
};
