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
            
            // current_stepは既に数値型になっているので、インデックスのみ更新
            // インデックスの更新（存在しない場合はスキップ）
            try {
                $table->dropIndex(['current_step']);
            } catch (Exception $e) {
                // インデックスが存在しない場合はスキップ
            }
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
            
            // approval_stepsテーブルが削除されているため、current_stepの型変更は不可能
            // インデックスのみ元に戻す
            $table->index('current_step');
            
            // request_idを元に戻す
            $table->foreignId('request_id')->change();
        });
    }
};
