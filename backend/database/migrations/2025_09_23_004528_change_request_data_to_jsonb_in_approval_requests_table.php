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
        // PostgreSQLではjson型からjsonb型に変更する必要がある
        DB::statement('ALTER TABLE approval_requests ALTER COLUMN request_data TYPE jsonb USING request_data::jsonb');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // jsonb型からjson型に戻す
        DB::statement('ALTER TABLE approval_requests ALTER COLUMN request_data TYPE json USING request_data::json');
    }
};