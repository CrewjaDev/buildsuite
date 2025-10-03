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
        Schema::table('approval_flows', function (Blueprint $table) {
            // フロー設定カラムの追加
            $table->jsonb('flow_config')->nullable()->comment('フロー設定（編集・キャンセル制御等）');
        });
        
        // GINインデックスの追加（PostgreSQL用）
        DB::statement('CREATE INDEX idx_approval_flows_flow_config ON approval_flows USING GIN (flow_config)');
        
        // 既存データにデフォルト設定を追加
        DB::statement("UPDATE approval_flows SET flow_config = '{}' WHERE flow_config IS NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // GINインデックスの削除
        DB::statement('DROP INDEX IF EXISTS idx_approval_flows_flow_config');
        
        Schema::table('approval_flows', function (Blueprint $table) {
            // カラムの削除
            $table->dropColumn('flow_config');
        });
    }
};
