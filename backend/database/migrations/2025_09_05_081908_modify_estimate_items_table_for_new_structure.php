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
        Schema::table('estimate_items', function (Blueprint $table) {
            // 既存のカラムを削除（存在する場合のみ）
            if (Schema::hasColumn('estimate_items', 'parent_id')) {
                $table->dropColumn('parent_id');
            }
            if (Schema::hasColumn('estimate_items', 'item_type')) {
                $table->dropColumn('item_type');
            }
            if (Schema::hasColumn('estimate_items', 'is_expanded')) {
                $table->dropColumn('is_expanded');
            }
            
            // 新しいカラムを追加（存在しない場合のみ）
            if (!Schema::hasColumn('estimate_items', 'breakdown_id')) {
                $table->uuid('breakdown_id')->nullable()->after('estimate_id')->comment('小内訳への紐付け');
            }
            if (!Schema::hasColumn('estimate_items', 'order_request_content')) {
                $table->text('order_request_content')->nullable()->after('remarks')->comment('発注依頼内容');
            }
        });
        
        // 外部キー制約とインデックスを追加（breakdown_idが存在する場合のみ）
        if (Schema::hasColumn('estimate_items', 'breakdown_id')) {
            Schema::table('estimate_items', function (Blueprint $table) {
                $table->foreign('breakdown_id')->references('id')->on('estimate_breakdowns')->onDelete('cascade');
                $table->index('breakdown_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estimate_items', function (Blueprint $table) {
            // 外部キー制約を削除
            $table->dropForeign(['breakdown_id']);
            $table->dropIndex(['breakdown_id']);
            
            // 新しいカラムを削除
            $table->dropColumn(['breakdown_id', 'order_request_content']);
            
            // 既存のカラムを復元
            $table->uuid('parent_id')->nullable()->after('estimate_id')->comment('親明細ID（階層構造用）');
            $table->string('item_type', 20)->after('parent_id')->comment('明細種別（large/medium/small/detail）');
            $table->boolean('is_expanded')->default(true)->after('is_active')->comment('展開状態');
        });
    }
};
