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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id', 50)->unique()->comment('社員ID');
            $table->string('name', 255)->comment('氏名');
            $table->string('name_kana', 255)->nullable()->comment('フリガナ');
            $table->string('email')->nullable()->unique()->comment('メールアドレス');
            $table->date('birth_date')->nullable()->comment('生年月日');
            $table->string('gender', 10)->nullable()->comment('性別');
            $table->string('phone', 20)->nullable()->comment('電話番号');
            $table->string('mobile_phone', 20)->nullable()->comment('携帯電話番号');
            $table->string('postal_code', 10)->nullable()->comment('郵便番号');
            $table->string('prefecture', 50)->nullable()->comment('都道府県');
            $table->text('address')->nullable()->comment('住所');
            $table->string('job_title', 100)->nullable()->comment('役職');
            $table->date('hire_date')->nullable()->comment('入社日');
            $table->integer('service_years')->nullable()->comment('勤続年数');
            $table->integer('service_months')->nullable()->comment('勤続月数');
            $table->foreignId('department_id')->constrained('departments')->comment('所属部署ID');
            $table->foreignId('position_id')->nullable()->constrained('positions')->comment('職位ID');
            $table->boolean('is_active')->default(true)->comment('在職状況');
            $table->timestamps();
            $table->softDeletes();
            
            // インデックス
            $table->index('employee_id');
            $table->index('name');
            $table->index('department_id');
            $table->index('position_id');
            $table->index('is_active');
            $table->index('hire_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
