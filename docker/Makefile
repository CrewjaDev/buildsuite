# BuildSuite Docker Management Makefile
# 使用方法: make <target>

# 変数定義
COMPOSE_PGSQL = docker-compose -f docker-compose_pgsql.yml
COMPOSE_BACKEND = docker-compose -f docker-compose.all.dev.yml
COMPOSE_ALL = docker-compose -f docker-compose.all.dev.yml
NETWORK_NAME = buildsuite-network

# デフォルトターゲット
.DEFAULT_GOAL := help

# ヘルプ表示
.PHONY: help
help: ## 利用可能なコマンドを表示
	@echo "BuildSuite Docker Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# ネットワーク管理
# =============================================================================

.PHONY: network-create
network-create: ## Dockerネットワークを作成
	@echo "Creating Docker network: $(NETWORK_NAME)"
	docker network create $(NETWORK_NAME) || echo "Network already exists"

.PHONY: network-remove
network-remove: ## Dockerネットワークを削除
	@echo "Removing Docker network: $(NETWORK_NAME)"
	docker network rm $(NETWORK_NAME) || echo "Network does not exist"

# =============================================================================
# PostgreSQL管理
# =============================================================================

.PHONY: pgsql-up
pgsql-up: network-create ## PostgreSQLコンテナを起動
	@echo "Starting PostgreSQL services..."
	$(COMPOSE_PGSQL) up -d

.PHONY: pgsql-down
pgsql-down: ## PostgreSQLコンテナを停止
	@echo "Stopping PostgreSQL services..."
	$(COMPOSE_PGSQL) down

.PHONY: pgsql-restart
pgsql-restart: pgsql-down pgsql-up ## PostgreSQLコンテナを再起動

.PHONY: pgsql-logs
pgsql-logs: ## PostgreSQLコンテナのログを表示
	$(COMPOSE_PGSQL) logs -f

.PHONY: pgsql-status
pgsql-status: ## PostgreSQLコンテナの状態を確認
	$(COMPOSE_PGSQL) ps

# =============================================================================
# バックエンド管理
# =============================================================================

.PHONY: backend-up
backend-up: network-create ## バックエンドコンテナを起動
	@echo "Starting Backend services..."
	$(COMPOSE_BACKEND) up -d

.PHONY: backend-down
backend-down: ## バックエンドコンテナを停止
	@echo "Stopping Backend services..."
	$(COMPOSE_BACKEND) down

.PHONY: backend-restart
backend-restart: backend-down backend-up ## バックエンドコンテナを再起動

.PHONY: backend-logs
backend-logs: ## バックエンドコンテナのログを表示
	$(COMPOSE_BACKEND) logs -f

.PHONY: backend-status
backend-status: ## バックエンドコンテナの状態を確認
	$(COMPOSE_BACKEND) ps

.PHONY: backend-build
backend-build: ## バックエンドイメージをビルド
	@echo "Building Backend image..."
	$(COMPOSE_BACKEND) build

.PHONY: backend-rebuild
backend-rebuild: ## バックエンドイメージを再ビルド（キャッシュなし）
	@echo "Rebuilding Backend image (no cache)..."
	$(COMPOSE_BACKEND) build --no-cache

# =============================================================================
# フロントエンド管理 (Next.js)
# =============================================================================

.PHONY: frontend-up
frontend-up: network-create ## フロントエンドコンテナを起動
	@echo "Starting Frontend services..."
	$(COMPOSE_ALL) up -d frontend

.PHONY: frontend-down
frontend-down: ## フロントエンドコンテナを停止
	@echo "Stopping Frontend services..."
	$(COMPOSE_ALL) stop frontend

.PHONY: frontend-restart
frontend-restart: frontend-down frontend-up ## フロントエンドコンテナを再起動

.PHONY: frontend-logs
frontend-logs: ## フロントエンドコンテナのログを表示
	$(COMPOSE_ALL) logs -f frontend

.PHONY: frontend-status
frontend-status: ## フロントエンドコンテナの状態を確認
	$(COMPOSE_ALL) ps frontend

.PHONY: frontend-build
frontend-build: ## フロントエンドイメージをビルド
	@echo "Building Frontend image..."
	$(COMPOSE_ALL) build frontend

.PHONY: frontend-rebuild
frontend-rebuild: ## フロントエンドイメージを再ビルド（キャッシュなし）
	@echo "Rebuilding Frontend image (no cache)..."
	$(COMPOSE_ALL) build --no-cache frontend

.PHONY: npm-install
npm-install: ## フロントエンド依存関係をインストール
	docker exec buildsuite-frontend-container npm install

.PHONY: npm-build
npm-build: ## フロントエンドをビルド
	docker exec buildsuite-frontend-container npm run build

.PHONY: npm-dev
npm-dev: ## フロントエンド開発サーバーを起動
	docker exec buildsuite-frontend-container npm run dev

# =============================================================================
# 全サービス管理
# =============================================================================

.PHONY: all-up
all-up: network-create ## 全サービスを起動
	@echo "Starting all services..."
	$(COMPOSE_ALL) up -d

.PHONY: all-down
all-down: ## 全サービスを停止
	@echo "Stopping all services..."
	$(COMPOSE_ALL) down

.PHONY: all-restart
all-restart: all-down all-up ## 全サービスを再起動

.PHONY: all-logs
all-logs: ## 全サービスのログを表示
	$(COMPOSE_ALL) logs -f

.PHONY: all-status
all-status: ## 全サービスの状態を確認
	$(COMPOSE_ALL) ps

.PHONY: all-build
all-build: ## 全サービスのイメージをビルド
	@echo "Building all service images..."
	$(COMPOSE_ALL) build

# =============================================================================
# Laravel管理
# =============================================================================

.PHONY: artisan
artisan: ## Laravel Artisanコマンドを実行 (例: make artisan cmd="migrate")
	@if [ -z "$(cmd)" ]; then \
		echo "Usage: make artisan cmd=\"<command>\""; \
		echo "Example: make artisan cmd=\"migrate\""; \
		exit 1; \
	fi
	docker exec buildsuite-backend-container php artisan $(cmd)

.PHONY: migrate
migrate: ## データベースマイグレーションを実行
	docker exec buildsuite-backend-container php artisan migrate

.PHONY: migrate-fresh
migrate-fresh: ## データベースをリセットしてマイグレーションを実行
	docker exec buildsuite-backend-container php artisan migrate:fresh

.PHONY: migrate-status
migrate-status: ## マイグレーション状況を確認
	docker exec buildsuite-backend-container php artisan migrate:status

.PHONY: composer-install
composer-install: ## Composer依存関係をインストール
	docker exec buildsuite-backend-container composer install

.PHONY: composer-update
composer-update: ## Composer依存関係を更新
	docker exec buildsuite-backend-container composer update

.PHONY: key-generate
key-generate: ## Laravelアプリケーションキーを生成
	docker exec buildsuite-backend-container php artisan key:generate

.PHONY: cache-clear
cache-clear: ## Laravelキャッシュをクリア
	docker exec buildsuite-backend-container php artisan cache:clear
	docker exec buildsuite-backend-container php artisan config:clear
	docker exec buildsuite-backend-container php artisan route:clear
	docker exec buildsuite-backend-container php artisan view:clear

# =============================================================================
# 開発環境セットアップ
# =============================================================================

.PHONY: setup
setup: network-create all-up ## 開発環境をセットアップ
	@echo "Waiting for services to be ready..."
	@sleep 15
	@echo "Installing backend dependencies..."
	$(MAKE) composer-install
	@echo "Installing frontend dependencies..."
	$(MAKE) npm-install
	@echo "Generating application key..."
	$(MAKE) key-generate
	@echo "Running migrations..."
	$(MAKE) migrate
	@echo "Setup complete!"

.PHONY: setup-fresh
setup-fresh: network-create all-up ## 開発環境を新規セットアップ（データリセット）
	@echo "Waiting for services to be ready..."
	@sleep 15
	@echo "Installing backend dependencies..."
	$(MAKE) composer-install
	@echo "Installing frontend dependencies..."
	$(MAKE) npm-install
	@echo "Generating application key..."
	$(MAKE) key-generate
	@echo "Running fresh migrations..."
	$(MAKE) migrate-fresh
	@echo "Fresh setup complete!"

# =============================================================================
# クリーンアップ
# =============================================================================

.PHONY: clean
clean: all-down ## 全コンテナを停止
	@echo "All containers stopped"

.PHONY: clean-all
clean-all: all-down ## 全コンテナとボリュームを削除
	@echo "Removing all containers and volumes..."
	$(COMPOSE_PGSQL) down -v
	$(COMPOSE_BACKEND) down -v
	$(COMPOSE_ALL) down -v
	@echo "Cleanup complete!"

.PHONY: clean-images
clean-images: ## 未使用のDockerイメージを削除
	@echo "Removing unused Docker images..."
	docker image prune -f

.PHONY: clean-system
clean-system: ## Dockerシステム全体をクリーンアップ
	@echo "Cleaning up Docker system..."
	docker system prune -f

# =============================================================================
# デバッグ・メンテナンス
# =============================================================================

.PHONY: shell-backend
shell-backend: ## バックエンドコンテナにシェルで接続
	docker exec -it buildsuite-backend-container bash

.PHONY: shell-frontend
shell-frontend: ## フロントエンドコンテナにシェルで接続
	docker exec -it buildsuite-frontend-container sh

.PHONY: shell-nginx
shell-nginx: ## Nginxコンテナにシェルで接続
	docker exec -it buildsuite-nginx-container sh

.PHONY: shell-postgres
shell-postgres: ## PostgreSQLコンテナにシェルで接続
	docker exec -it postgres_container bash

.PHONY: ps
ps: ## 全Dockerコンテナの状態を表示
	docker ps -a

.PHONY: logs
logs: ## 全コンテナのログを表示
	@echo "=== PostgreSQL Services Logs ==="
	$(COMPOSE_PGSQL) logs -f || exit 0
	@echo ""
	@echo "=== Backend Services Logs ==="
	$(COMPOSE_BACKEND) logs -f || exit 0
	@echo ""
	@echo "=== Frontend Services Logs ==="
	$(COMPOSE_ALL) logs -f frontend || exit 0

.PHONY: logs-pgsql
logs-pgsql: ## PostgreSQLコンテナのログを表示
	$(COMPOSE_PGSQL) logs -f || exit 0

.PHONY: logs-backend
logs-backend: ## バックエンドコンテナのログを表示
	$(COMPOSE_BACKEND) logs -f || exit 0

.PHONY: logs-frontend
logs-frontend: ## フロントエンドコンテナのログを表示
	$(COMPOSE_ALL) logs -f frontend || exit 0

# =============================================================================
# ヘルスチェック
# =============================================================================

.PHONY: health
health: ## 全サービスのヘルスチェック
	@echo "Checking PostgreSQL..."
	@docker exec postgres_container pg_isready -U myuser || echo "PostgreSQL is not ready"
	@echo "Checking Redis..."
	@docker exec docker-redis-1 redis-cli ping || echo "Redis is not ready"
	@echo "Checking Laravel..."
	@docker exec buildsuite-backend-container php artisan route:list || echo "Laravel is not ready"
	@echo "Checking Next.js..."
	@docker exec buildsuite-frontend-container curl -f http://localhost:3000/api/health || echo "Next.js is not ready"
	@echo "Health check complete!"

# =============================================================================
# ショートカット
# =============================================================================

# 統合されたコマンドのみを使用
.PHONY: up
up: all-up ## 開発環境を起動

.PHONY: down  
down: all-down ## 開発環境を停止

.PHONY: restart
restart: all-restart ## 全サービスを再起動

.PHONY: status
status: ## 全サービスの状態を確認
	@echo "=== PostgreSQL Services ==="
	$(MAKE) pgsql-status
	@echo ""
	@echo "=== Backend Services ==="
	$(MAKE) backend-status
	@echo ""
	@echo "=== Frontend Services ==="
	$(MAKE) frontend-status
