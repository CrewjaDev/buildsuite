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
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('partner_code', 50)->unique()->comment('取引先コード');
            $table->string('partner_name', 255)->comment('取引先名');
            $table->string('partner_name_print', 255)->nullable()->comment('取引先名（印刷用）');
            $table->string('partner_name_kana', 255)->nullable()->comment('取引先名フリガナ');
            $table->string('partner_type', 20)->comment('取引先区分（customer/supplier/both）');
            $table->string('representative', 255)->nullable()->comment('代表者');
            $table->string('representative_kana', 255)->nullable()->comment('代表者名フリガナ');
            $table->string('branch_name', 255)->nullable()->comment('支店・営業所名');
            $table->string('postal_code', 10)->nullable()->comment('郵便番号');
            $table->text('address')->nullable()->comment('住所');
            $table->string('building_name', 255)->nullable()->comment('建物名');
            $table->string('phone', 50)->nullable()->comment('電話番号');
            $table->string('fax', 50)->nullable()->comment('FAX番号');
            $table->string('invoice_number', 50)->nullable()->comment('インボイス登録番号');
            $table->string('email', 255)->nullable()->comment('メールアドレス');
            $table->boolean('is_subcontractor')->default(false)->comment('外注フラグ');
            
            // 入金情報（得意先向け）
            $table->integer('closing_date')->nullable()->comment('締日（99:月末）');
            $table->string('deposit_terms', 50)->nullable()->comment('入金サイト');
            $table->integer('deposit_date')->nullable()->comment('入金日（99:月末）');
            $table->string('deposit_method', 50)->nullable()->comment('入金方法区分');
            $table->decimal('cash_allocation', 5, 2)->nullable()->comment('現金配分');
            $table->decimal('bill_allocation', 5, 2)->nullable()->comment('手形配分');
            
            // 支払情報（仕入先向け）
            $table->integer('payment_date')->nullable()->comment('支払日（99:月末）');
            $table->string('payment_method', 50)->nullable()->comment('支払方法区分');
            $table->decimal('payment_cash_allocation', 5, 2)->nullable()->comment('支払現金配分');
            $table->decimal('payment_bill_allocation', 5, 2)->nullable()->comment('支払手形配分');
            
            // 企業情報
            $table->date('establishment_date')->nullable()->comment('設立年月日');
            $table->bigInteger('capital_stock')->nullable()->comment('資本金（千円）');
            $table->bigInteger('previous_sales')->nullable()->comment('昨期売上高（千円）');
            $table->integer('employee_count')->nullable()->comment('従業員数（名）');
            $table->text('business_description')->nullable()->comment('事業内容');
            
            // 銀行情報
            $table->string('bank_name', 255)->nullable()->comment('銀行名');
            $table->string('branch_name_bank', 255)->nullable()->comment('支店名');
            $table->string('account_type', 20)->nullable()->comment('口座種別（savings/current）');
            $table->string('account_number', 50)->nullable()->comment('口座番号');
            $table->string('account_holder', 255)->nullable()->comment('口座名義');
            
            // システム情報
            $table->string('login_id', 100)->nullable()->comment('ログインID');
            $table->string('journal_code', 50)->nullable()->comment('仕訳CD');
            $table->boolean('is_active')->default(true)->comment('アクティブ状態');
            $table->foreignId('created_by')->constrained('users')->comment('作成者ID');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('partner_code');
            $table->index('partner_name');
            $table->index('partner_type');
            $table->index('is_active');
            $table->index('created_by');
            $table->index('email');
            $table->index('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
