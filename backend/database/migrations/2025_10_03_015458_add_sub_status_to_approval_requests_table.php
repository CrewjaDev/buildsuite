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
        Schema::table('approval_requests', function (Blueprint $table) {
            // サブステータスカラムの追加
            $table->string('sub_status', 50)->nullable()->comment('サブステータス（メインステータス内の詳細状態）');
            
            // 編集ロック関連カラムの追加
            $table->uuid('editing_user_id')->nullable()->comment('編集中のユーザーID');
            $table->timestamp('editing_started_at')->nullable()->comment('編集開始日時');
        });
        
        // 複合インデックスの追加（パフォーマンス向上）
        Schema::table('approval_requests', function (Blueprint $table) {
            $table->index(['status', 'sub_status'], 'idx_approval_requests_status_sub_status');
            $table->index('editing_user_id', 'idx_approval_requests_editing_user');
        });
        
        // 既存データの移行（既存のpendingステータスはsub_status=nullに設定）
        // 注意: 新しく追加されたカラムは既にNULLなので、このUPDATEは実際には不要だが、
        // 明示的にNULLを設定することで意図を明確にする
        DB::statement("UPDATE approval_requests SET sub_status = NULL WHERE status = 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approval_requests', function (Blueprint $table) {
            // インデックスの削除
            $table->dropIndex('idx_approval_requests_status_sub_status');
            $table->dropIndex('idx_approval_requests_editing_user');
            
            // カラムの削除
            $table->dropColumn(['sub_status', 'editing_user_id', 'editing_started_at']);
        });
    }
};
