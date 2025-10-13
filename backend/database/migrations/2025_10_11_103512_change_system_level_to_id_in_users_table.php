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
        // 既存のsystem_levelデータをIDに変換
        $users = DB::table('users')->get();
        foreach ($users as $user) {
            if ($user->system_level) {
                $systemLevel = DB::table('system_levels')->where('code', $user->system_level)->first();
                if ($systemLevel) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['system_level' => $systemLevel->id]);
                } else {
                    // 存在しないコードの場合は、デフォルトでstaff（ID: 1）に設定
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['system_level' => 1]);
                }
            }
        }

        // system_levelカラムを文字列から整数に変更（PostgreSQL対応）
        DB::statement('ALTER TABLE users ALTER COLUMN system_level TYPE integer USING system_level::integer');
        DB::statement('ALTER TABLE users ALTER COLUMN system_level DROP NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // system_levelカラムを整数から文字列に戻す（PostgreSQL対応）
        DB::statement('ALTER TABLE users ALTER COLUMN system_level TYPE varchar(255) USING system_level::varchar(255)');
        DB::statement('ALTER TABLE users ALTER COLUMN system_level DROP NOT NULL');

        // 既存のsystem_levelデータをIDから文字列に戻す
        $users = DB::table('users')->get();
        foreach ($users as $user) {
            if ($user->system_level) {
                $systemLevel = DB::table('system_levels')->where('id', $user->system_level)->first();
                if ($systemLevel) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['system_level' => $systemLevel->code]);
                }
            }
        }
    }
};
