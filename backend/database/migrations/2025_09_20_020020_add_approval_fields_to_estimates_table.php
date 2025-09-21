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
        Schema::table('estimates', function (Blueprint $table) {
            $table->foreignId('approval_request_id')->nullable()->constrained('approval_requests');
            $table->string('approval_status', 20)->default('draft');
            $table->foreignId('approval_flow_id')->nullable()->constrained('approval_flows');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estimates', function (Blueprint $table) {
            $table->dropForeign(['approval_request_id']);
            $table->dropForeign(['approval_flow_id']);
            $table->dropColumn(['approval_request_id', 'approval_status', 'approval_flow_id']);
        });
    }
};
