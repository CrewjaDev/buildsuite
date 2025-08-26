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
        Schema::create('system_level_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('system_level_id')->constrained('system_levels')->onDelete('cascade');
            $table->unsignedBigInteger('permission_id'); // 外部キー制約を一時的に削除
            $table->timestamp('granted_at')->useCurrent();
            $table->foreignId('granted_by')->nullable()->constrained('users')->onDelete('set null');
            
            // ユニーク制約
            $table->unique(['system_level_id', 'permission_id']);
            
            // インデックス
            $table->index('system_level_id');
            $table->index('permission_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_level_permissions');
    }
};
