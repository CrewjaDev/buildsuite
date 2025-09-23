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
            // request_idをUUID対応に変更
            $table->uuid('request_id')->change()->comment('依頼元ID（UUID対応）');
            
            // current_stepを数値型に変更（approval_stepsテーブルへの外部キーを削除）
            $table->dropForeign(['current_step']);
            $table->integer('current_step')->default(1)->change()->comment('現在のステップ番号（1-5）');
            
            // インデックスの更新
            $table->dropIndex(['current_step']);
            $table->index('current_step', 'idx_approval_requests_current_step');
            
            // request_dataにGINインデックスを追加（PostgreSQL用）
            // Laravelの標準的なindex()メソッドではGINインデックスが作成できないため、
            // 後でraw SQLでGINインデックスを作成する
        });
        
        // GINインデックスをraw SQLで作成
        DB::statement('CREATE INDEX idx_approval_requests_request_data ON approval_requests USING GIN (request_data)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // GINインデックスの削除
        DB::statement('DROP INDEX IF EXISTS idx_approval_requests_request_data');
        
        Schema::table('approval_requests', function (Blueprint $table) {
            // インデックスの削除
            $table->dropIndex('idx_approval_requests_current_step');
            
            // current_stepを元に戻す
            $table->dropIndex(['current_step']);
            $table->foreignId('current_step')->nullable()->constrained('approval_steps')->onDelete('set null')->change();
            $table->index('current_step');
            
            // request_idを元に戻す
            $table->foreignId('request_id')->change();
        });
    }
};
