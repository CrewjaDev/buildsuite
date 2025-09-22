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
        // PostgreSQLでは、bigintからuuidへの変換に特別な処理が必要
        DB::statement('ALTER TABLE approval_requests ALTER COLUMN request_id TYPE uuid USING request_id::text::uuid');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // PostgreSQLでは、uuidからbigintへの変換に特別な処理が必要
        DB::statement('ALTER TABLE approval_requests ALTER COLUMN request_id TYPE bigint USING request_id::text::bigint');
    }
};
