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
        // approval_step_idは既に削除され、stepカラムは既に存在するので、インデックスのみ更新
        // インデックスの更新（存在チェック付き）
        DB::statement('DROP INDEX IF EXISTS approval_histories_approval_step_id_index');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_approval_histories_step ON approval_histories (step)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // approval_stepsテーブルが削除されているため、完全なロールバックは不可能
        // インデックスのみ削除
        DB::statement('DROP INDEX IF EXISTS idx_approval_histories_step');
        DB::statement('CREATE INDEX IF EXISTS approval_histories_approval_step_id_index ON approval_histories (approval_step_id)');
    }
};
