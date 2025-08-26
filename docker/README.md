# BuildSuite Docker Management Guide

このディレクトリには、BuildSuiteプロジェクトのDocker環境を管理するためのMakefileとdocker-composeファイルが含まれています。

## 📁 ファイル構成

```
docker/
├── Makefile                           # Docker管理用Makefile
├── README.md                          # このファイル
├── docker-compose_pgsql.yml           # PostgreSQL + pgAdmin設定
├── docker-compose_backend.dev.yml     # バックエンド開発環境設定
├── docker-compose.all.dev.yml         # 全サービス統合設定
├── dockerfile.backend.dev             # バックエンド開発用Dockerfile
└── dockerfile.bscknd.prod             # バックエンド本番用Dockerfile
```

## 🚀 クイックスタート

### 初回セットアップ
```bash
cd docker
make setup
```

### 開発環境起動
```bash
make up
```

### 開発環境停止
```bash
make down
```

## 📋 利用可能なコマンド

### ヘルプ表示
```bash
make help
```
利用可能な全コマンドとその説明を表示します。

## 🔧 開発環境セットアップ

### 基本セットアップ
```bash
make setup
```
- Dockerネットワークを作成
- PostgreSQLコンテナを起動
- バックエンドコンテナを起動
- Composer依存関係をインストール
- Laravelアプリケーションキーを生成
- データベースマイグレーションを実行

### 新規セットアップ（データリセット）
```bash
make setup-fresh
```
- 基本セットアップと同じ手順
- データベースをリセットしてマイグレーションを実行

## 🐳 サービス管理

### PostgreSQL管理
```bash
make pgsql-up        # PostgreSQLコンテナを起動
make pgsql-down      # PostgreSQLコンテナを停止
make pgsql-restart   # PostgreSQLコンテナを再起動
make pgsql-logs      # PostgreSQLコンテナのログを表示
make pgsql-status    # PostgreSQLコンテナの状態を確認
```

### バックエンド管理
```bash
make backend-up      # バックエンドコンテナを起動
make backend-down    # バックエンドコンテナを停止
make backend-restart # バックエンドコンテナを再起動
make backend-logs    # バックエンドコンテナのログを表示
make backend-status  # バックエンドコンテナの状態を確認
make backend-build   # バックエンドイメージをビルド
make backend-rebuild # バックエンドイメージを再ビルド（キャッシュなし）
```

### 全サービス管理
```bash
make all-up          # 全サービスを起動
make all-down        # 全サービスを停止
make all-restart     # 全サービスを再起動
make all-logs        # 全サービスのログを表示
make all-status      # 全サービスの状態を確認
```

## 🎯 Laravel管理

### Artisanコマンド
```bash
make artisan cmd="<command>"
```
例：
```bash
make artisan cmd="route:list"      # ルート一覧表示
make artisan cmd="make:controller UserController"  # コントローラー作成
make artisan cmd="make:model User"                 # モデル作成
make artisan cmd="make:migration create_users_table"  # マイグレーション作成
```

### データベース管理
```bash
make migrate         # データベースマイグレーションを実行
make migrate-fresh   # データベースをリセットしてマイグレーションを実行
make migrate-status  # マイグレーション状況を確認
```

### 依存関係管理
```bash
make composer-install  # Composer依存関係をインストール
make composer-update   # Composer依存関係を更新
```

### アプリケーション管理
```bash
make key-generate   # Laravelアプリケーションキーを生成
make cache-clear    # Laravelキャッシュをクリア
```

## 🛠️ デバッグ・メンテナンス

### コンテナ操作
```bash
make shell           # バックエンドコンテナにシェルで接続
make shell-postgres  # PostgreSQLコンテナにシェルで接続
```

### 状態確認
```bash
make ps              # 全Dockerコンテナの状態を表示
make logs            # 全コンテナのログを表示
make logs-pgsql      # PostgreSQLコンテナのログを表示
make logs-backend    # バックエンドコンテナのログを表示
make status          # 全サービスの状態を確認
make health          # 全サービスのヘルスチェック
```

## 🧹 クリーンアップ

### コンテナ・ボリューム管理
```bash
make clean           # 全コンテナを停止
make clean-all       # 全コンテナとボリュームを削除
```

### Dockerシステム管理
```bash
make clean-images    # 未使用のDockerイメージを削除
make clean-system    # Dockerシステム全体をクリーンアップ
```

## 🔗 ショートカット

```bash
make up              # make setup のエイリアス
make down            # make clean のエイリアス
make restart         # make all-restart のエイリアス
```

## 📊 サービス情報

### ポート番号
- **PostgreSQL**: 5432
- **pgAdmin**: 8081
- **Redis**: 6379
- **MeiliSearch**: 7700
- **Laravel (PHP-FPM)**: 9000

### アクセス情報
- **pgAdmin**: http://localhost:8081
  - Email: admin@admin.com
  - Password: admin
- **PostgreSQL**: localhost:5432
  - Database: mydatabase
  - Username: myuser
  - Password: mypassword

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. コンテナが起動しない
```bash
# ログを確認
make logs              # 全サービスのログ
make logs-backend      # バックエンドのログ
make logs-pgsql        # PostgreSQLのログ

# 状態を確認
make status

# 再起動
make restart
```

#### 2. データベース接続エラー
```bash
# PostgreSQLの状態確認
make pgsql-status

# ヘルスチェック
make health

# マイグレーション再実行
make migrate
```

#### 3. 権限エラー
```bash
# コンテナに接続して権限を修正
make shell
chown -R www-data:www-data /var/www/html/storage
chmod -R 775 /var/www/html/storage
exit
```

#### 4. キャッシュ関連の問題
```bash
# キャッシュをクリア
make cache-clear

# コンテナを再起動
make backend-restart
```

#### 5. 完全リセットが必要な場合
```bash
# 全データをリセット
make clean-all
make setup-fresh
```

## 🔄 開発フロー

### 日常的な開発サイクル

1. **開発開始**
   ```bash
   make up
   ```

2. **開発作業**
   - コード編集
   - マイグレーション実行: `make migrate`
   - キャッシュクリア: `make cache-clear`

3. **デバッグ**
   - ログ確認: `make logs` (全サービス) / `make logs-backend` (バックエンド) / `make logs-pgsql` (PostgreSQL)
   - シェル接続: `make shell`
   - ヘルスチェック: `make health`

4. **開発終了**
   ```bash
   make down
   ```

### 新機能開発時

1. **環境準備**
   ```bash
   make setup-fresh
   ```

2. **開発・テスト**
   ```bash
   make artisan cmd="make:controller NewController"
   make artisan cmd="make:migration create_new_table"
   make migrate
   ```

3. **動作確認**
   ```bash
   make health
   make artisan cmd="route:list"
   ```

## 📝 注意事項

1. **初回起動時**
   - 初回の`make setup`は時間がかかります
   - イメージのダウンロードとビルドが実行されます

2. **データの永続化**
   - PostgreSQLデータは`postgres_data`ボリュームに保存されます
   - `make clean-all`を実行するとデータが削除されます

3. **ネットワーク**
   - `buildsuite-network`が自動的に作成されます
   - 既に存在する場合は作成をスキップします

4. **環境変数**
   - バックエンドの設定は`../backend/.env`ファイルで管理されます
   - データベース接続情報は`docker-compose_pgsql.yml`と一致している必要があります

## 🤝 チーム開発での利用

### 新メンバーの環境構築
```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd buildsuite

# 2. 環境構築
cd docker
make setup

# 3. 動作確認
make health
```

### コードレビュー前の確認
```bash
# 1. 最新のコードを取得
git pull origin main

# 2. 環境を更新
make backend-rebuild
make migrate

# 3. テスト実行
make artisan cmd="test"
```

このガイドを参考に、効率的なDocker環境での開発を行ってください。
