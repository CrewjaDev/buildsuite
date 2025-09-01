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
        Schema::create('estimates', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('estimate_number', 50)->unique()->comment('見積番号');
            $table->foreignId('partner_id')->constrained('partners')->comment('取引先ID');
            $table->foreignId('project_type_id')->constrained('project_types')->comment('工事種別ID');
            $table->string('project_name', 255)->comment('工事名称');
            $table->text('project_location')->nullable()->comment('工事場所');
            $table->date('project_period_start')->nullable()->comment('工事期間開始日');
            $table->date('project_period_end')->nullable()->comment('工事期間終了日');
            $table->text('description')->nullable()->comment('工事内容詳細');
            $table->string('status', 50)->default('draft')->comment('見積ステータス');
            $table->date('issue_date')->nullable()->comment('発行日');
            $table->date('expiry_date')->nullable()->comment('有効期限');
            $table->string('currency', 3)->default('JPY')->comment('通貨');
            $table->decimal('subtotal', 12, 2)->default(0)->comment('小計');
            $table->decimal('overhead_rate', 5, 2)->default(0)->comment('一般管理費率（%）');
            $table->decimal('overhead_amount', 12, 2)->default(0)->comment('一般管理費額');
            $table->decimal('cost_expense_rate', 5, 2)->default(0)->comment('原価経費率（%）');
            $table->decimal('cost_expense_amount', 12, 2)->default(0)->comment('原価経費額');
            $table->decimal('material_expense_rate', 5, 2)->default(0)->comment('材料経費率（%）');
            $table->decimal('material_expense_amount', 12, 2)->default(0)->comment('材料経費額');
            $table->decimal('tax_rate', 5, 2)->default(0.10)->comment('消費税率');
            $table->decimal('tax_amount', 12, 2)->default(0)->comment('消費税額');
            $table->decimal('discount_rate', 5, 2)->default(0)->comment('割引率');
            $table->decimal('discount_amount', 12, 2)->default(0)->comment('割引額');
            $table->decimal('total_amount', 12, 2)->default(0)->comment('合計金額');
            $table->decimal('profit_margin', 5, 2)->default(0)->comment('利益率');
            $table->decimal('profit_amount', 12, 2)->default(0)->comment('利益額');
            $table->text('payment_terms')->nullable()->comment('支払条件');
            $table->text('delivery_terms')->nullable()->comment('納期条件');
            $table->string('warranty_period', 100)->nullable()->comment('保証期間');
            $table->text('notes')->nullable()->comment('備考');
            $table->foreignId('created_by')->constrained('users')->comment('作成者ID');
            $table->foreignId('approved_by')->nullable()->constrained('users')->comment('承認者ID');
            $table->timestamp('approved_at')->nullable()->comment('承認日時');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('partner_id');
            $table->index('project_type_id');
            $table->index('status');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimates');
    }
};
