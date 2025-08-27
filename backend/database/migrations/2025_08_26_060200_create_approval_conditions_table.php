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
        Schema::create('approval_conditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_flow_id')->constrained('approval_flows')->onDelete('cascade');
            $table->string('condition_type', 50); // amount, department, role, project, custom
            $table->string('field_name', 100);
            $table->string('operator', 50); // equals, not_equals, greater_than, less_than, contains, in, not_in
            $table->json('value')->nullable();
            $table->string('value_type', 20)->default('string'); // string, integer, float, boolean, array
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('approval_flow_id');
            $table->index('condition_type');
            $table->index('field_name');
            $table->index('operator');
            $table->index('is_active');
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_conditions');
    }
};
