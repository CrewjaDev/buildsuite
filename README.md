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


## Git運用ルール

### ブランチ戦略

#### メインブランチ
- **main**: 本番環境用のブランチ。直接コミット禁止
- **develop**: 開発用のメインブランチ。feature ブランチのマージ先

#### 作業用ブランチ
- **feature/**: 新機能開発用 `feature/機能名`
- **bugfix/**: バグ修正用 `bugfix/課題番号`
- **hotfix/**: 緊急バグ修正用 `hotfix/課題番号`
- **release/**: リリース準備用 `release/バージョン番号`

### コミットルール
- コミットメッセージは日本語で記述
- プレフィックスを付与:
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント
  - `style:` コードスタイル修正
  - `refactor:` リファクタリング
  - `test:` テストコード
  - `chore:` ビルド・補助ツール

### マージルール
1. プルリクエストを作成
2. コードレビューを実施
3. CI/CDパイプラインの成功確認
4. 承認後にマージ

### リリースフロー
1. develop → release ブランチを作成
2. リリース準備とテスト実施
3. release → main へマージ
4. main にタグ付け
5. main → develop へマージ






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
