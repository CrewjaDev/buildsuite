# 本番環境でのマイグレーション・バックアップ戦略

## 概要

本番環境でのデータベースマイグレーション実行時における、データ保護とリスク軽減のための包括的な戦略を記載します。

## 目次

1. [基本原則](#基本原則)
2. [バックアップ戦略](#バックアップ戦略)
3. [マイグレーション実行手順](#マイグレーション実行手順)
4. [緊急時の復旧手順](#緊急時の復旧手順)
5. [監視・ログ戦略](#監視ログ戦略)
6. [チェックリスト](#チェックリスト)

## 基本原則

### 1. データ保護の原則
- **データの完全性を最優先**とする
- **バックアップなしにマイグレーションを実行しない**
- **段階的な実行**でリスクを最小化する
- **ロールバック計画**を必ず準備する

### 2. 本番環境での禁止事項
- `php artisan migrate:fresh` の使用禁止
- `php artisan migrate:reset` の使用禁止
- `--force` オプションの安易な使用禁止
- メンテナンス時間外でのマイグレーション実行禁止

## バックアップ戦略

### 1. 自動バックアップシステム

#### 1.1 定期的なフルバックアップ
```bash
#!/bin/bash
# scripts/backup-database.sh

# 設定
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="production_database"
DB_USER="backup_user"
BACKUP_DIR="/var/backups/database"
RETENTION_DAYS=30

# バックアップファイル名
BACKUP_FILE="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"

# バックアップ実行
docker exec postgres_container pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    --file="${BACKUP_DIR}/${BACKUP_FILE}"

# 圧縮
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# 古いバックアップの削除
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

#### 1.2 マイグレーション前の自動バックアップ
```bash
#!/bin/bash
# scripts/pre-migration-backup.sh

MIGRATION_NAME=$1
BACKUP_DIR="/var/backups/pre-migration"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# マイグレーション前バックアップ
BACKUP_FILE="pre_migration_${MIGRATION_NAME}_${TIMESTAMP}.sql"

docker exec postgres_container pg_dump \
    -U myuser \
    -d mydatabase \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    --file="${BACKUP_DIR}/${BACKUP_FILE}"

echo "Pre-migration backup created: ${BACKUP_FILE}"
echo "BACKUP_FILE=${BACKUP_FILE}" > /tmp/current_backup.txt
```

### 2. Laravel Artisan コマンドの拡張

#### 2.1 カスタムマイグレーションコマンド
```php
<?php
// app/Console/Commands/SafeMigrate.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SafeMigrate extends Command
{
    protected $signature = 'migrate:safe {--backup : マイグレーション前にバックアップを作成}';
    protected $description = '安全なマイグレーション実行（バックアップ付き）';

    public function handle()
    {
        if ($this->option('backup')) {
            $this->createBackup();
        }

        $this->info('マイグレーションを実行します...');
        
        try {
            DB::transaction(function () {
                $this->call('migrate', ['--force' => true]);
            });
            
            $this->info('マイグレーションが正常に完了しました。');
        } catch (\Exception $e) {
            $this->error('マイグレーションに失敗しました: ' . $e->getMessage());
            $this->warn('バックアップからの復旧を検討してください。');
            return 1;
        }

        return 0;
    }

    private function createBackup()
    {
        $timestamp = now()->format('Ymd_His');
        $backupFile = "pre_migration_backup_{$timestamp}.sql";
        
        $this->info("バックアップを作成中: {$backupFile}");
        
        // バックアップ実行ロジック
        $command = "docker exec postgres_container pg_dump -U myuser -d mydatabase --format=custom > /var/backups/{$backupFile}";
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            $this->info("バックアップが正常に作成されました: {$backupFile}");
        } else {
            $this->error("バックアップの作成に失敗しました");
            exit(1);
        }
    }
}
```

#### 2.2 データベース復旧コマンド
```php
<?php
// app/Console/Commands/RestoreDatabase.php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RestoreDatabase extends Command
{
    protected $signature = 'db:restore {backup_file} {--confirm : 復旧を確認}';
    protected $description = 'データベースをバックアップから復旧';

    public function handle()
    {
        $backupFile = $this->argument('backup_file');
        
        if (!$this->option('confirm')) {
            $this->warn('この操作は現在のデータベースを完全に置き換えます。');
            if (!$this->confirm('本当に復旧を実行しますか？')) {
                $this->info('復旧をキャンセルしました。');
                return;
            }
        }

        $this->info("バックアップから復旧中: {$backupFile}");
        
        try {
            $command = "docker exec -i postgres_container pg_restore -U myuser -d mydatabase --clean --if-exists /var/backups/{$backupFile}";
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0) {
                $this->info('データベースの復旧が完了しました。');
            } else {
                $this->error('データベースの復旧に失敗しました。');
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('復旧中にエラーが発生しました: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
```

## マイグレーション実行手順

### 1. 本番環境でのマイグレーション手順

#### 1.1 事前準備
```bash
# 1. メンテナンスモードの有効化
php artisan down --message="データベースメンテナンス中"

# 2. 現在のバックアップ作成
./scripts/pre-migration-backup.sh "migration_$(date +%Y%m%d_%H%M%S)"

# 3. マイグレーション状態の確認
php artisan migrate:status

# 4. 実行予定のマイグレーションの確認
php artisan migrate:status | grep "Pending"
```

#### 1.2 マイグレーション実行
```bash
# 1. 安全なマイグレーション実行
php artisan migrate:safe --backup

# 2. マイグレーション後の確認
php artisan migrate:status

# 3. アプリケーションの動作確認
php artisan route:cache
php artisan config:cache
php artisan view:cache
```

#### 1.3 事後確認
```bash
# 1. データベースの整合性チェック
php artisan db:check-integrity

# 2. アプリケーションの動作テスト
php artisan test --testsuite=Integration

# 3. メンテナンスモードの解除
php artisan up
```

### 2. 緊急時のロールバック手順

#### 2.1 マイグレーションのロールバック
```bash
# 1. メンテナンスモードの有効化
php artisan down --message="緊急メンテナンス中"

# 2. 最新のマイグレーションをロールバック
php artisan migrate:rollback --step=1

# 3. アプリケーションの動作確認
php artisan up
```

#### 2.2 バックアップからの完全復旧
```bash
# 1. メンテナンスモードの有効化
php artisan down --message="データベース復旧中"

# 2. バックアップからの復旧
php artisan db:restore backup_20241006_120000.sql --confirm

# 3. アプリケーションの動作確認
php artisan up
```

## 監視・ログ戦略

### 1. マイグレーション実行の監視

#### 1.1 ログ設定
```php
// config/logging.php に追加
'channels' => [
    'migration' => [
        'driver' => 'daily',
        'path' => storage_path('logs/migration.log'),
        'level' => 'debug',
        'days' => 30,
    ],
],
```

#### 1.2 マイグレーション実行のログ記録
```php
<?php
// app/Console/Commands/LogMigration.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class LogMigration extends Command
{
    protected $signature = 'migrate:log {action} {details?}';
    protected $description = 'マイグレーション実行のログ記録';

    public function handle()
    {
        $action = $this->argument('action');
        $details = $this->argument('details') ?? '';
        
        Log::channel('migration')->info("Migration {$action}", [
            'timestamp' => now(),
            'user' => auth()->user()?->id ?? 'system',
            'details' => $details,
            'environment' => app()->environment(),
        ]);
        
        $this->info("Migration {$action} logged");
    }
}
```

### 2. データベース監視

#### 2.1 データベース接続監視
```php
<?php
// app/Console/Commands/MonitorDatabase.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MonitorDatabase extends Command
{
    protected $signature = 'db:monitor';
    protected $description = 'データベースの状態監視';

    public function handle()
    {
        try {
            // 接続テスト
            DB::connection()->getPdo();
            $this->info('データベース接続: OK');
            
            // テーブル数チェック
            $tableCount = DB::select("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'")[0]->count;
            $this->info("テーブル数: {$tableCount}");
            
            // マイグレーション状態チェック
            $pendingMigrations = DB::table('migrations')->whereNull('batch')->count();
            if ($pendingMigrations > 0) {
                $this->warn("未実行のマイグレーション: {$pendingMigrations}件");
            } else {
                $this->info('マイグレーション状態: 最新');
            }
            
        } catch (\Exception $e) {
            $this->error('データベース監視エラー: ' . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}
```

## チェックリスト

### マイグレーション実行前チェックリスト

- [ ] メンテナンス時間の確保
- [ ] 関係者への事前通知
- [ ] バックアップの作成と確認
- [ ] マイグレーション内容のレビュー
- [ ] ロールバック計画の準備
- [ ] 監視体制の確立
- [ ] テスト環境での事前実行確認

### マイグレーション実行中チェックリスト

- [ ] メンテナンスモードの有効化
- [ ] バックアップの作成完了確認
- [ ] マイグレーション実行
- [ ] エラーログの確認
- [ ] データベースの整合性チェック
- [ ] アプリケーションの動作確認

### マイグレーション実行後チェックリスト

- [ ] マイグレーション状態の確認
- [ ] アプリケーションの動作テスト
- [ ] パフォーマンスの確認
- [ ] ログの確認
- [ ] メンテナンスモードの解除
- [ ] 関係者への完了通知

## 緊急連絡先・手順

### 1. 緊急時の連絡先
- **システム管理者**: [連絡先]
- **データベース管理者**: [連絡先]
- **開発チームリーダー**: [連絡先]

### 2. 緊急時の判断基準
- **データ損失の可能性**: 即座にバックアップからの復旧
- **アプリケーション停止**: ロールバックの実行
- **パフォーマンス低下**: 監視継続、必要に応じて対応

### 3. 復旧時間目標
- **完全復旧**: 30分以内
- **部分復旧**: 15分以内
- **緊急対応**: 5分以内

## 参考資料

- [Laravel Migration Documentation](https://laravel.com/docs/migrations)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- [Docker Volume Management](https://docs.docker.com/storage/volumes/)

---

**重要**: このドキュメントは定期的に更新し、実際の運用経験に基づいて改善してください。
