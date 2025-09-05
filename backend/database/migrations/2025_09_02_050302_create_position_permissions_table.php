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
        Schema::create('position_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('position_id')->constrained('positions')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->timestamp('granted_at')->useCurrent();
            $table->foreignId('granted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // ユニーク制約
            $table->unique(['position_id', 'permission_id']);
            
            // インデックス
            $table->index('position_id');
            $table->index('permission_id');
            $table->index('granted_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('position_permissions');
    }
};
