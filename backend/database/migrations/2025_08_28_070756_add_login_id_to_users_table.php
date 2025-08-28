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
        Schema::table('users', function (Blueprint $table) {
            $table->string('login_id')->nullable()->after('id')->comment('ログインID');
        });

        // 既存のユーザーにデフォルトのlogin_idを設定
        DB::table('users')->whereNull('login_id')->orderBy('id')->each(function ($user) {
            $loginId = 'user_' . $user->id;
            DB::table('users')->where('id', $user->id)->update(['login_id' => $loginId]);
        });

        // login_idをNOT NULLに変更
        Schema::table('users', function (Blueprint $table) {
            $table->string('login_id')->nullable(false)->change();
        });

        // ユニーク制約を追加
        Schema::table('users', function (Blueprint $table) {
            $table->unique('login_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['login_id']);
            $table->dropColumn('login_id');
        });
    }
};
