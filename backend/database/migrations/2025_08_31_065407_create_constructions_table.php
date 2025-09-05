<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Added missing import

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 一時的に無効化（partnersテーブルのID型不一致のため）
        // TODO: partnersテーブルのIDをuuidに変更後に有効化
        /*
        Schema::create('constructions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('construction_number', 50)->unique()->comment('工事番号');
            $table->integer('change_count')->default(1)->comment('変更回数');
            $table->string('completion_classification', 50)->default('未成')->comment('完成区分');
            $table->string('estimate_number', 100)->nullable()->comment('見積番号');
            $table->date('order_date')->nullable()->comment('受注日');
            $table->date('report_date')->nullable()->comment('報告日');
            $table->date('construction_completion_date')->nullable()->comment('工事完成日');
            $table->date('construction_finish_date')->nullable()->comment('工事完了日');
            $table->string('project_name', 255)->comment('工事名称');
            $table->text('project_location')->nullable()->comment('工事場所');
            $table->date('construction_period_start')->nullable()->comment('工期開始日');
            $table->date('construction_period_end')->nullable()->comment('工期終了日');
            $table->foreignUuid('partner_id')->constrained('partners')->comment('受注先（取引先ID）');
            $table->string('person_in_charge', 100)->nullable()->comment('担当者');
            $table->foreignId('department_id')->nullable()->constrained('departments')->comment('部門ID');
            
            // 金額関連
            $table->decimal('order_amount_excluding_tax', 12, 2)->default(0)->comment('税抜受注金額');
            $table->decimal('tax_rate', 5, 2)->default(0.10)->comment('消費税率');
            $table->decimal('tax_amount', 12, 2)->default(0)->comment('消費税額');
            $table->decimal('total_order_amount', 12, 2)->default(0)->comment('受注金額');
            $table->decimal('overhead_rate', 5, 2)->default(0.20)->comment('一般管理費率');
            $table->decimal('overhead_amount', 12, 2)->default(0)->comment('一般管理費');
            $table->decimal('construction_cost', 12, 2)->default(0)->comment('工事原価');
            
            // 支払い条件
            $table->integer('closing_date')->default(99)->comment('締日');
            $table->string('payment_cycle', 50)->default('翌月')->comment('入金サイト');
            $table->integer('payment_date')->default(99)->comment('支払日');
            $table->integer('due_date')->default(99)->comment('着日');
            $table->integer('cash_ratio')->default(10)->comment('現金比率');
            $table->integer('bill_ratio')->default(0)->comment('手形比率');
            
            // 現場情報
            $table->string('site_person_in_charge', 100)->nullable()->comment('現場担当者');
            $table->string('site_mobile_number', 20)->nullable()->comment('現場担当者携帯番号');
            $table->string('site_phone_number', 20)->nullable()->comment('現場電話番号');
            $table->string('site_fax_number', 20)->nullable()->comment('現場FAX番号');
            
            // システム管理
            $table->string('status', 50)->default('planning')->comment('工事ステータス');
            $table->decimal('progress_rate', 5, 2)->default(0)->comment('進捗率');
            $table->text('remarks')->nullable()->comment('備考');
            $table->foreignId('created_by')->constrained('users')->comment('作成者');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('construction_number');
            $table->index('partner_id');
            $table->index('status');
            $table->index('created_by');
            $table->index('construction_period_start');
            $table->index('construction_period_end');
        });
        */
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('constructions');
    }
};
