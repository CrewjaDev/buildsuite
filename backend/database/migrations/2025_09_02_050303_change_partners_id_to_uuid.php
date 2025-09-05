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
        // 一時的に無効化（constructionsテーブルが存在しないため）
        // TODO: constructionsテーブル作成後に有効化
        /*
        // 外部キー制約を一時的に削除
        Schema::table('constructions', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
        });

        // partnersテーブルのIDをuuidに変更
        Schema::table('partners', function (Blueprint $table) {
            $table->uuid('id')->change();
        });

        // constructionsテーブルのpartner_idをuuidに変更
        Schema::table('constructions', function (Blueprint $table) {
            $table->uuid('partner_id')->change();
        });

        // 外部キー制約を再作成
        Schema::table('constructions', function (Blueprint $table) {
            $table->foreign('partner_id')->references('id')->on('partners')->onDelete('cascade');
        });
        */
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 外部キー制約を一時的に削除
        Schema::table('constructions', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
        });

        // constructionsテーブルのpartner_idをbigintに戻す
        Schema::table('constructions', function (Blueprint $table) {
            $table->bigInteger('partner_id')->change();
        });

        // partnersテーブルのIDをbigintに戻す
        Schema::table('partners', function (Blueprint $table) {
            $table->bigIncrements('id')->change();
        });

        // 外部キー制約を再作成
        Schema::table('constructions', function (Blueprint $table) {
            $table->foreign('partner_id')->references('id')->on('partners')->onDelete('cascade');
        });
    }
};
