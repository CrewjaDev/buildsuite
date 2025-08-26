# BuildSuite

Backend（Laravel）とFrontend（Next.js）を含むフルスタックWebアプリケーション

## プロジェクト構成

このプロジェクトは**Monorepo**構成を採用しており、backendとfrontendのソースコードを単一のgitリポジトリで管理しています。

```
buildsuite/
├── backend/          # Laravel API
├── frontend/         # Next.js フロントエンド
├── docker/           # Docker設定
├── docs/             # ドキュメント
└── README.md         # このファイル
```

## 開発環境のセットアップ

### 前提条件
- Node.js 18+
- PHP 8.1+
- Composer
- Docker（オプション）

### Backend（Laravel）のセットアップ

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend（Next.js）のセットアップ

```bash
cd frontend
npm install
npm run dev
```

## 開発ワークフロー

### 新機能開発
1. 新しいブランチを作成: `git checkout -b feature/new-feature`
2. backendとfrontendの両方で開発
3. 関連する変更を同じコミットに含める
4. プルリクエストを作成

### API変更時の注意点
- backendのAPI変更とfrontendの対応変更は同じコミットに含める
- APIの破壊的変更がある場合は、マイグレーション戦略を検討

## デプロイ

### 本番環境
- backend: Laravel Forge / Vapor / その他
- frontend: Vercel / Netlify / その他

### ステージング環境
- Docker Composeを使用した統合環境

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. プルリクエストを作成

## ライセンス

[ライセンス情報を追加]
