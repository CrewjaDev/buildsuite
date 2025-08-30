# ユーザー詳細ページ設計仕様

## 📋 概要

ユーザー管理機能の詳細ページについて、照会と編集を統合したタブ方式での実装を採用する。

## 🎯 設計方針

### **基本コンセプト**
- **単一ページ + タブ方式**を採用
- 照会と編集を同一ページ内で切り替え
- 権限に応じたタブ表示制御
- レスポンシブデザイン対応

### **理由**
1. **UX向上**: ページ遷移が少なく、操作がスムーズ
2. **パフォーマンス**: データの再読み込みが不要
3. **権限管理**: 明確な権限制御が可能
4. **モバイル対応**: タブ切り替えが直感的

## 🏗️ 技術構成

### **フレームワーク・ライブラリ**
- **Next.js 14** (App Router)
- **React 19.1.0**
- **TypeScript 5**
- **TanStack Query v5** (データ取得・キャッシュ)
- **Shadcn/ui** (UIコンポーネント)
  - `Tabs` - タブ切り替え
  - `Select` - モバイル用セレクト
  - `Button` - アクションボタン
  - `Card` - 情報表示
  - `Form` - 編集フォーム

### **状態管理**
- **TanStack Query**: サーバー状態管理
- **React State**: ローカル状態（タブ切り替え、フォーム状態）

## 📁 ファイル構成

```
frontend/src/app/(management)/users/
├── page.tsx                    # ユーザー一覧ページ
├── [id]/
│   ├── page.tsx               # ユーザー詳細ページ（メイン）
│   ├── components/
│   │   ├── UserDetailHeader.tsx    # ヘッダー（ユーザー名、アクション）
│   │   ├── UserDetailView.tsx      # 照会タブコンテンツ
│   │   ├── UserDetailEdit.tsx      # 編集タブコンテンツ
│   │   ├── UserInfoCard.tsx        # 基本情報カード
│   │   ├── UserDepartmentCard.tsx  # 所属部署カード
│   │   ├── UserRoleCard.tsx        # 権限・役割カード
│   │   └── UserHistoryCard.tsx     # 履歴カード
│   └── hooks/
│       └── useUserDetail.ts        # 詳細データ取得フック
```

## 🔗 URL設計

### **基本URL**
```
/users/{id}          # 照会モード（デフォルト）
/users/{id}?mode=edit # 編集モード
```

### **URLパラメータ**
- `id`: ユーザーID（必須）
- `mode`: 表示モード（'view' | 'edit'、デフォルト: 'view'）

## 🔐 権限管理

### **権限定義**
```typescript
interface UserPermissions {
  'user.view': boolean;    // 照会権限
  'user.edit': boolean;    // 編集権限
  'user.delete': boolean;  // 削除権限
}
```

### **権限制御**
```typescript
// タブ表示制御
const canView = userPermissions.includes('user.view');
const canEdit = userPermissions.includes('user.edit');

// 編集タブの表示
{canEdit && <Tab value="edit">編集</Tab>}

// 編集モードへのアクセス制御
if (mode === 'edit' && !canEdit) {
  redirect('/users/' + id); // 照会モードにリダイレクト
}
```

## 📱 レスポンシブ対応

### **デスクトップ**
- タブ形式での切り替え
- サイドバー + メインコンテンツのレイアウト

### **タブレット**
- タブ形式を維持
- コンテンツ幅の調整

### **モバイル**
- タブをセレクトボックスに変更
- カード形式での情報表示
- 縦スクロール中心のレイアウト

## 🎨 UI/UX設計

### **照会モード**
- **情報カード形式**: 関連情報をグループ化
- **読み取り専用**: 編集不可の表示
- **印刷対応**: 詳細情報の印刷機能

### **編集モード**
- **フォーム形式**: 編集可能なフィールド
- **バリデーション**: リアルタイム検証
- **保存確認**: 変更内容の確認ダイアログ

### **共通要素**
- **ヘッダー**: ユーザー名、アクションボタン
- **ナビゲーション**: 一覧への戻るボタン
- **ローディング**: データ取得中の表示
- **エラー処理**: エラー状態の表示

## 🔄 データフロー

### **データ取得**
```typescript
// ユーザー詳細データ取得
const { data: user, isLoading, error } = useUserDetail(id);

// 関連データ取得
const { data: departments } = useDepartments();
const { data: positions } = usePositions();
const { data: roles } = useRoles();
```

### **データ更新**
```typescript
// ユーザー情報更新
const updateUserMutation = useUpdateUser();

const handleSave = async (formData: UserFormData) => {
  await updateUserMutation.mutateAsync({ id, data: formData });
  // 成功時の処理（タブ切り替え、通知など）
};
```

## 📊 表示項目

### **基本情報**
- 社員ID
- 社員名（漢字・カナ）
- 性別
- 生年月日
- メールアドレス
- 電話番号
- 住所

### **所属情報**
- 所属部署（プライマリ）
- 職位
- 役職
- 入社年月日
- 勤続年数

### **権限・役割**
- システム権限レベル
- 割り当て役割
- 管理者権限

### **アカウント情報**
- アカウント状態（有効/無効）
- ロック状態
- 最終ログイン日時
- パスワード有効期限

### **履歴情報**
- 作成日時
- 更新日時
- 作成者
- 更新者

## 🚀 実装優先順位

### **Phase 1: 基本構造**
1. 詳細ページの基本レイアウト
2. タブ切り替え機能
3. 照会モードの基本表示

### **Phase 2: 照会機能**
1. 基本情報カード
2. 所属情報カード
3. 権限・役割カード

### **Phase 3: 編集機能**
1. 編集フォーム
2. バリデーション
3. 保存機能

### **Phase 4: 高度な機能**
1. 履歴表示
2. 印刷機能
3. レスポンシブ対応の最適化

## 📝 注意事項

### **パフォーマンス**
- データの遅延読み込み
- 不要な再レンダリングの防止
- キャッシュ戦略の最適化

### **セキュリティ**
- 権限チェックの徹底
- 入力値のサニタイゼーション
- CSRF対策

### **アクセシビリティ**
- キーボードナビゲーション
- スクリーンリーダー対応
- フォーカス管理

---

**作成日**: 2024年8月28日  
**更新日**: 2024年8月28日  
**作成者**: AI Assistant  
**承認者**: ユーザー