<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemBusinessCodeSeeder extends Seeder
{
    /**
     * システム固定の業務コードを定義
     * 
     * このseederはシステム基盤に関わる業務コードを定義します。
     * 頻繁に変更されることがなく、システムの安定性が重要です。
     * ハードコーディングにより型安全性とパフォーマンスを確保します。
     * 
     * 注意: システム固定コードはデータベースに登録せず、
     * コード内で定数として管理します。
     */
    public function run(): void
    {
        // システム固定コードはデータベースに登録しない
        // 代わりに、PermissionSeederで直接権限を生成する
        
        // このseederは将来の拡張性のために残しておくが、
        // 実際の処理はPermissionSeederで行う
        $this->command->info('システム固定コードはPermissionSeederで処理されます');
    }

    /**
     * システム固定の業務コード定数を取得
     * 
     * @return array
     */
    public static function getSystemBusinessCodes(): array
    {
        return \App\Services\BusinessCodeService::getSystemBusinessCodes();
    }
}
