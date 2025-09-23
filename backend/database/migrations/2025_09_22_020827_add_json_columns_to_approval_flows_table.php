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
            // JSONBカラムの追加（PostgreSQL用）
            $table->jsonb('conditions')->nullable()->comment('適用条件（金額、部署、プロジェクト等）');
            $table->jsonb('requesters')->nullable()->comment('承認依頼者設定（システム権限レベル、職位、部署、個別ユーザー）');
            $table->jsonb('approval_steps')->nullable()->comment('承認ステップ設定（最大5ステップ、条件分岐、並列承認対応）');
            
            // 既存カラムの更新
            $table->string('flow_type', 50)->default('general')->change()->comment('フロータイプ（estimate, budget, purchase, contract, general）');
            $table->integer('priority')->default(1)->change()->comment('優先度（数値が小さいほど優先）');
        });
        
        // GINインデックスをraw SQLで作成（PostgreSQL用）
        DB::statement('CREATE INDEX idx_approval_flows_conditions ON approval_flows USING GIN (conditions)');
        DB::statement('CREATE INDEX idx_approval_flows_requesters ON approval_flows USING GIN (requesters)');
        DB::statement('CREATE INDEX idx_approval_flows_approval_steps ON approval_flows USING GIN (approval_steps)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // GINインデックスの削除
        DB::statement('DROP INDEX IF EXISTS idx_approval_flows_conditions');
        DB::statement('DROP INDEX IF EXISTS idx_approval_flows_requesters');
        DB::statement('DROP INDEX IF EXISTS idx_approval_flows_approval_steps');
        
        Schema::table('approval_flows', function (Blueprint $table) {
            // JSONカラムの削除
            $table->dropColumn(['conditions', 'requesters', 'approval_steps']);
            
            // 既存カラムの復元
            $table->string('flow_type', 50)->change();
            $table->integer('priority')->default(0)->change();
        });
    }
};
