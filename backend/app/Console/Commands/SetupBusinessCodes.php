<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\BusinessCodeSeeder;
use Database\Seeders\PermissionSeeder;

class SetupBusinessCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'business-codes:setup 
                            {--force : 既存データを強制的に上書きする}
                            {--validate : 設定後の整合性チェックのみ実行}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'ビジネスコードの初期設定を実行（必須）';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== ビジネスコード初期設定コマンド ===');
        
        if ($this->option('validate')) {
            return $this->validateOnly();
        }
        
        // 権限マスタの確認
        if (!$this->checkPermissionsExist()) {
            $this->error('権限マスタが設定されていません。');
            $this->info('権限マスタを先に設定してください: php artisan db:seed --class=PermissionSeeder');
            return 1;
        }
        
        // 既存データの確認
        if (!$this->option('force') && $this->hasExistingBusinessCodes()) {
            if (!$this->confirm('既存のビジネスコードデータが存在します。上書きしますか？')) {
                $this->info('処理をキャンセルしました。');
                return 0;
            }
        }
        
        // ビジネスコードの初期設定を実行
        $this->info('ビジネスコードの初期設定を実行しています...');
        
        try {
            $seeder = new BusinessCodeSeeder();
            $seeder->setCommand($this);
            $seeder->run();
            
            $this->info('✅ ビジネスコードの初期設定が完了しました。');
            
            // 整合性チェック
            $this->info('整合性チェックを実行しています...');
            if ($seeder->validateBusinessCodes()) {
                $this->info('✅ 整合性チェックが完了しました。');
                return 0;
            } else {
                $this->error('❌ 整合性チェックで問題が発見されました。');
                return 1;
            }
            
        } catch (\Exception $e) {
            $this->error('ビジネスコードの初期設定中にエラーが発生しました: ' . $e->getMessage());
            return 1;
        }
    }
    
    /**
     * 整合性チェックのみ実行
     */
    private function validateOnly(): int
    {
        $this->info('ビジネスコードの整合性チェックを実行しています...');
        
        try {
            $seeder = new BusinessCodeSeeder();
            $seeder->setCommand($this);
            
            if ($seeder->validateBusinessCodes()) {
                $this->info('✅ 整合性チェックが完了しました。問題はありません。');
                return 0;
            } else {
                $this->error('❌ 整合性チェックで問題が発見されました。');
                return 1;
            }
            
        } catch (\Exception $e) {
            $this->error('整合性チェック中にエラーが発生しました: ' . $e->getMessage());
            return 1;
        }
    }
    
    /**
     * 権限マスタの存在確認
     */
    private function checkPermissionsExist(): bool
    {
        return \App\Models\Permission::count() > 0;
    }
    
    /**
     * 既存のビジネスコードデータの存在確認
     */
    private function hasExistingBusinessCodes(): bool
    {
        return \App\Models\BusinessCode::count() > 0;
    }
}
