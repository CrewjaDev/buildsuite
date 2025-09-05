# ノーコード承認フロー設計画面 - 最終仕様書

## 概要

このドキュメントでは、ノーコードで承認フローを視覚的に設計・設定できる画面の最終仕様について詳しく説明します。画面設計、機能設計、および現在の実装との適合性について包括的に整理します。

## 🎨 画面設計仕様

### 1. メイン設計画面レイアウト

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 承認フロー設計システム                                                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [新規作成] [テンプレート▼] [保存] [プレビュー] [テスト実行] [公開] [履歴] [ヘルプ]    │
├─┬─────────────────────────┬─────────────────────────────────┬───────────────────────┤
│ │ ■ コンポーネントパレット  │ ■ 設計キャンバス                │ ■ プロパティパネル    │
│ │                         │                               │                     │
│ │ 📝 基本コンポーネント     │ ┌─────────────────────────────┐ │ 選択中: なし          │
│ │ ├─ 📤 申請開始          │ │                             │ │                     │
│ │ ├─ 👤 承認者            │ │     フローをここに設計        │ │ ┌─────────────────┐ │
│ │ ├─ 👥 グループ承認      │ │                             │ │ │                 │ │
│ │ ├─ ⚡ 条件分岐          │ │     ドラッグ&ドロップで      │ │ │                 │ │
│ │ ├─ 📋 条件設定          │ │     コンポーネントを配置      │ │ │                 │ │
│ │ ├─ 📤 通知              │ │                             │ │ │                 │ │
│ │ ├─ 🔄 ループ処理        │ │                             │ │ │                 │ │
│ │ ├─ ✅ 承認完了          │ │                             │ │ │                 │ │
│ │ └─ ❌ 却下処理          │ │                             │ │ │                 │ │
│ │                         │ └─────────────────────────────┘ │ │                 │ │
│ │ 🔧 高度なコンポーネント  │                               │ │                 │ │
│ │ ├─ 🎭 申請者判定        │ ■ ミニマップ                   │ └─────────────────┘ │
│ │ ├─ 🔀 動的分岐          │ ┌───────────────────────────────┐ │                     │
│ │ ├─ 🏗️ 階層制御         │ │ ┌─┐  ┌─┐                   │ │ ■ 検証結果           │
│ │ ├─ 🎯 権限チェック      │ │ │ │─→│ │                   │ │ ✅ フロー妥当性      │
│ │ ├─ 💰 金額判定          │ │ └─┘  └─┘                   │ │ ✅ 承認者設定        │
│ │ ├─ 📅 期限管理          │ │      ↓                      │ │ ⚠️ 循環参照チェック   │
│ │ └─ 🚨 エスカレーション  │ │    ┌─┐                     │ │ ❌ 未接続ノード      │
│ │                         │ │    │ │                     │ │                     │
│ │ 📚 テンプレート          │ │    └─┘                     │ │ ■ 統計情報           │
│ │ ├─ 🏢 部署承認フロー     │ └───────────────────────────────┘ │ ノード数: 0          │
│ │ ├─ 💰 金額別承認        │                               │ 接続数: 0            │
│ │ ├─ 📊 階層承認          │ ■ 設計情報                     │ 承認者数: 0          │
│ │ ├─ ⚡ 緊急承認          │ フロー名: [未設定]             │ 条件数: 0            │
│ │ ├─ 🔄 複合条件承認      │ 作成者: 田中太郎               │                     │
│ │ └─ 🎯 カスタムテンプレート│ 更新日: 2024/01/15            │                     │
│ │                         │ バージョン: v1.0              │                     │
│ │ ■ 最近の設計             │ 状態: 下書き                   │                     │
│ │ ├─ 見積承認フロー       │                               │                     │
│ │ ├─ 契約承認フロー       │                               │                     │
│ │ └─ 備品購入フロー       │                               │                     │
├─┴─────────────────────────┴─────────────────────────────────┴───────────────────────┤
│ ■ ステータスバー                                                                   │
│ 💾 自動保存: 有効 | 🔍 ズーム: 100% | 📐 グリッド: 表示 | 🎯 スナップ: 有効 | ⚡ 接続中... │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. 設計キャンバス詳細

#### 2-1. 基本操作機能
```
┌─────────────────────────────────────────────────────────────┐
│ 設計キャンバス操作メニュー                                   │
├─────────────────────────────────────────────────────────────┤
│ 🎯 選択モード  ✏️ 編集モード  🔗 接続モード  ✂️ 切り取り      │
│ 📋 コピー     📌 貼り付け    🗑️ 削除      ↩️ 元に戻す       │
│ ↪️ やり直し   🔍 ズームイン  🔍 ズームアウト 📐 グリッド表示   │
│ 🎯 中央揃え   📏 自動整列    💾 自動保存    🔄 リフレッシュ   │
├─────────────────────────────────────────────────────────────┤
│ ■ 右クリックメニュー                                        │
│ ├─ ✏️ ノード編集                                           │
│ ├─ 📋 コピー                                               │
│ ├─ 🗑️ 削除                                                │
│ ├─ 🔗 接続開始                                             │
│ ├─ 📊 プロパティ表示                                        │
│ ├─ 🎨 スタイル変更                                          │
│ └─ 📝 コメント追加                                          │
└─────────────────────────────────────────────────────────────┘
```

#### 2-2. ノード表示仕様
```
┌─────────────────────────────────────────────────────────────┐
│ ノード表示パターン                                           │
├─────────────────────────────────────────────────────────────┤
│ ■ 基本ノード                                               │
│ ┌─────────┐                                               │
│ │ 🎭 申請者判定 │ ← アイコン + タイトル                      │
│ │ (役職確認)  │ ← サブタイトル                             │
│ └─────────┘                                               │
│   ●     ●   ← 入力・出力コネクター                          │
│                                                           │
│ ■ 条件分岐ノード                                           │
│ ┌─────────┐                                               │
│ │ ⚡ 金額判定  │                                             │
│ │ (1000円)   │                                             │
│ └─────────┘                                               │
│   ●   ●   ●  ← 複数出力コネクター                          │
│  ≤1000 >1000                                              │
│                                                           │
│ ■ 承認者ノード                                             │
│ ┌─────────┐                                               │
│ │ 👤 営業部長  │                                             │
│ │ (田中部長)  │ ← 実際の承認者名                            │
│ │ 💰制限なし   │ ← 金額制限表示                             │
│ │ ⏰3日以内   │ ← 期限表示                                 │
│ └─────────┘                                               │
│   ●     ●                                                 │
│                                                           │
│ ■ エラー状態表示                                           │
│ ┌─────────┐                                               │
│ │ ❌ 未設定    │ ← エラーアイコン                            │
│ │ (承認者未定) │                                             │
│ └─────────┘                                               │
│   ●     ●                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 3. プロパティパネル設計

#### 3-1. 基本ノードプロパティ
```
┌─────────────────────────────────────────────────────────────┐
│ プロパティパネル - 承認者ノード                              │
├─────────────────────────────────────────────────────────────┤
│ ■ 基本設定                                                 │
│ ノード名: [営業部長承認              ]                      │
│ 表示名: [営業部長（1次承認）        ]                      │
│ 説明: [営業案件の1次承認を行う       ]                      │
│ アイコン: [👤 ▼] 色: [#28A745 ▼]                          │
│                                                           │
│ ■ 承認者設定                                               │
│ 指定方法: ○特定ユーザー ●役職指定 ○グループ指定            │
│                                                           │
│ 部署: [営業部 ▼]                                          │
│ 役職: [部長 ▼]                                            │
│ 代理人: [副部長 ▼] ☑不在時自動設定                         │
│                                                           │
│ ■ 承認条件                                                 │
│ 金額上限: [1000000] 円 ☐制限なし                          │
│ 期限: [3] 営業日 ☐期限なし                                 │
│ 必須承認: ☑必須 ☐任意                                      │
│ 委譲可能: ☑可能 ☐不可                                      │
│                                                           │
│ ■ 通知設定                                                 │
│ 承認依頼: ☑メール ☑システム内 ☐Slack ☐SMS                │
│ リマインダー: ☑1日後 ☑3日後 ☐なし                         │
│ 完了通知: ☑申請者 ☑関係者 ☐なし                           │
│                                                           │
│ ■ 高度な設定                                               │
│ ☑ログ記録 ☑監査対象 ☐自動承認条件                          │
│ コメント必須: ☐承認時 ☑却下時 ☐常時                        │
│                                                           │
│ [保存] [キャンセル] [テスト] [削除]                          │
└─────────────────────────────────────────────────────────────┘
```

#### 3-2. 条件分岐ノードプロパティ
```
┌─────────────────────────────────────────────────────────────┐
│ プロパティパネル - 条件分岐ノード                            │
├─────────────────────────────────────────────────────────────┤
│ ■ 基本設定                                                 │
│ ノード名: [金額による分岐判定          ]                     │
│ 説明: [申請金額に応じて承認ルートを分岐]                     │
│ アイコン: [⚡ ▼] 色: [#FFC107 ▼]                          │
│                                                           │
│ ■ 判定設定                                                 │
│ 判定項目: [申請データ.金額 ▼]                               │
│ データ型: [数値（整数） ▼]                                  │
│ データソース: [業務データ直接参照 ▼]                        │
│ 参照テーブル: [estimates ▼]                                │
│ 参照フィールド: [amount ▼]                                 │
│                                                           │
│ ■ 分岐条件                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 条件1: [1000000円以下]                                 │ │
│ │ ├─ 演算子: [以下 ≤ ▼]                                  │ │
│ │ ├─ 基準値: [1000000] 円                               │ │
│ │ ├─ 接続先: [営業部長承認 ▼]                            │ │
│ │ ├─ ラベル: [100万円以下]                               │ │
│ │ └─ 色: [緑 #28A745]                                   │ │
│ │                                                       │ │
│ │ 条件2: [1000000円超過]                                │ │
│ │ ├─ 演算子: [より大きい > ▼]                            │ │
│ │ ├─ 基準値: [1000000] 円                               │ │
│ │ ├─ 接続先: [役員承認 ▼]                                │ │
│ │ ├─ ラベル: [100万円超過]                               │ │
│ │ └─ 色: [赤 #DC3545]                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                           │
│ [条件追加] [削除] [順序変更] [条件テスト]                    │
│                                                           │
│ ■ エラーハンドリング                                        │
│ データなし時: [エラー表示 ▼]                               │
│ 無効値時: [管理者通知 ▼]                                   │
│ 条件不一致時: [デフォルトルート ▼]                          │
│                                                           │
│ [保存] [キャンセル] [判定テスト] [削除]                      │
└─────────────────────────────────────────────────────────────┘
```

### 4. テンプレート選択画面

```
┌─────────────────────────────────────────────────────────────┐
│ フローテンプレート選択                                       │
├─────────────────────────────────────────────────────────────┤
│ 検索: [                    ] カテゴリ: [全て ▼] 難易度: [全て ▼] │
├─────────────────────────────────────────────────────────────┤
│ ■ 基本テンプレート                                          │
│ ┌───────┬─────────────────────────────────────────────────┐ │
│ │ 📊    │ 階層別承認フロー                               │ │
│ │ 階層別 │ 申請者の役職に応じて承認ルートが自動変更       │ │
│ │       │ 💡 初心者向け ⭐⭐⭐⭐⭐ 使用頻度: 高       │ │
│ │       │ [プレビュー] [選択] [カスタマイズ]             │ │
│ ├───────┼─────────────────────────────────────────────────┤ │
│ │ 💰    │ 金額別承認フロー                               │ │
│ │ 金額別 │ 申請金額に応じて承認者を自動選択               │ │
│ │       │ 💡 初心者向け ⭐⭐⭐⭐☆ 使用頻度: 高       │ │
│ │       │ [プレビュー] [選択] [カスタマイズ]             │ │
│ ├───────┼─────────────────────────────────────────────────┤ │
│ │ 🏢    │ 部署別承認フロー                               │ │
│ │ 部署別 │ 申請者の所属部署に応じた承認ルート             │ │
│ │       │ 💡 初心者向け ⭐⭐⭐☆☆ 使用頻度: 中       │ │
│ │       │ [プレビュー] [選択] [カスタマイズ]             │ │
│ └───────┴─────────────────────────────────────────────────┘ │
│                                                           │
│ ■ 高度なテンプレート                                        │
│ ┌───────┬─────────────────────────────────────────────────┐ │
│ │ 🔄    │ 複合条件承認フロー                             │ │
│ │ 複合条件│ 複数条件を組み合わせた高度な承認制御           │ │
│ │       │ 💡 上級者向け ⭐⭐☆☆☆ 使用頻度: 中       │ │
│ │       │ [プレビュー] [選択] [カスタマイズ]             │ │
│ ├───────┼─────────────────────────────────────────────────┤ │
│ │ ⚡    │ 緊急承認フロー                                 │ │
│ │ 緊急対応│ 緊急時の迅速な承認プロセス                     │ │
│ │       │ 💡 中級者向け ⭐⭐⭐☆☆ 使用頻度: 低       │ │
│ │       │ [プレビュー] [選択] [カスタマイズ]             │ │
│ └───────┴─────────────────────────────────────────────────┘ │
│                                                           │
│ ■ カスタムテンプレート                                      │
│ ┌───────┬─────────────────────────────────────────────────┐ │
│ │ 🎯    │ 見積承認フロー（営業部専用）                   │ │
│ │ カスタム│ 営業部の見積承認に特化したフロー               │ │
│ │       │ 💡 作成者: 田中部長 最終更新: 2024/01/10      │ │
│ │       │ [プレビュー] [選択] [編集] [複製]              │ │
│ └───────┴─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [空白から作成] [テンプレート作成] [インポート] [キャンセル]   │
└─────────────────────────────────────────────────────────────┘
```

### 5. テスト・シミュレーション画面

```
┌─────────────────────────────────────────────────────────────┐
│ フローテスト・シミュレーション                               │
├─────────────────────────────────────────────────────────────┤
│ フロー: [見積承認フロー v2.1 ▼] 状態: [テスト中 🔄]          │
├─────────────────────────────────────────────────────────────┤
│ ■ テストデータ設定                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 申請者: [営業担当A ▼]                                   │ │
│ │ 申請種別: [見積申請 ▼]                                   │ │
│ │ 見積金額: [2500000] 円                                  │ │
│ │ 部署: [営業部 ▼]                                       │ │
│ │ 緊急度: [通常 ▼]                                       │ │
│ │ その他データ: [カスタムデータ設定...]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                           │
│ ■ シミュレーション実行結果                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 実行ログ                          実行時間: 0.23秒     │ │
│ │ ═══════════════════════════════════════════════════════ │ │
│ │ ✅ Step1: 申請開始                                     │ │
│ │    └─ 申請者: 営業担当A (ID: 123)                      │ │
│ │    └─ 申請データ: 正常                                 │ │
│ │                                                       │ │
│ │ ✅ Step2: 申請者判定                                   │ │
│ │    └─ 判定結果: 平社員レベル                           │ │
│ │    └─ 次ステップ: 金額判定へ                           │ │
│ │                                                       │ │
│ │ ✅ Step3: 金額判定                                     │ │
│ │    └─ 判定値: 2,500,000円                             │ │
│ │    └─ 判定結果: 1,000,000円超過                       │ │
│ │    └─ 次ステップ: 営業部長承認へ                       │ │
│ │                                                       │ │
│ │ ✅ Step4: 営業部長承認                                 │ │
│ │    └─ 承認者: 田中部長 (ID: 456) ✅権限あり            │ │
│ │    └─ 期限: 3営業日以内                               │ │
│ │    └─ 次ステップ: 役員承認へ                           │ │
│ │                                                       │ │
│ │ ✅ Step5: 役員承認                                     │ │
│ │    └─ 承認者: 佐藤役員 (ID: 789) ✅権限あり            │ │
│ │    └─ 期限: 5営業日以内                               │ │
│ │    └─ 次ステップ: 承認完了                             │ │
│ │                                                       │ │
│ │ 🎯 予想処理時間: 3-8営業日                             │ │
│ │ 📧 通知対象者: 5名 (申請者、承認者、関係者)             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                           │
│ ■ 検証結果サマリー                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ フロー妥当性: 正常                                   │ │
│ │ ✅ 承認者権限: 全て確認済み                             │ │
│ │ ✅ データ整合性: 問題なし                               │ │
│ │ ⚠️  性能: 承認者5名 (推奨3名以下)                       │ │
│ │ ❌ 循環参照: なし                                       │ │
│ │ ❌ デッドロック: なし                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [再実行] [詳細ログ] [パフォーマンス分析] [本番適用]          │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 機能設計仕様

### 1. コア機能一覧

#### 1-1. フロー設計機能
```
■ 基本設計機能
- ドラッグ&ドロップによるノード配置
- ビジュアル接続線での関係定義
- リアルタイムプレビュー
- 自動レイアウト調整
- グリッドスナップ機能

■ ノード管理機能
- 基本ノード: 申請開始、承認者、条件分岐、承認完了
- 高度ノード: 申請者判定、動的分岐、階層制御、権限チェック
- カスタムノード: 業務固有の処理ノード
- ノードプロパティ設定
- ノード検証・エラー表示

■ 接続管理機能
- ビジュアル接続線
- 条件付き接続
- 接続検証
- 循環参照検出
- デッドロック検出
```

#### 1-2. 条件設定機能
```
■ 基本条件設定
- 金額条件 (以上、以下、範囲)
- 文字列条件 (等しい、含む、正規表現)
- 日付条件 (期間、相対日付)
- 数値条件 (四則演算、比較演算)

■ 複合条件設定
- AND/OR論理演算
- 複数条件の組み合わせ
- 条件グループ化
- 優先度設定

■ 動的条件設定
- 申請者属性参照
- 業務データ参照
- 外部システム連携
- リアルタイム条件評価
```

#### 1-3. 承認者設定機能
```
■ 承認者指定方法
- 特定ユーザー指定
- 役職による指定
- 部署による指定
- グループによる指定
- 申請者の上長指定
- 動的承認者選択

■ 承認条件設定
- 金額上限設定
- 期限設定
- 必須/任意設定
- 委譲可能設定
- 代理承認設定

■ 通知設定
- 承認依頼通知
- リマインダー通知
- 完了通知
- エスカレーション通知
- 通知チャネル選択 (メール、システム内、Slack、SMS)
```

### 2. テンプレート管理機能

#### 2-1. 標準テンプレート
```
■ 基本パターン
- 階層別承認フロー
- 金額別承認フロー
- 部署別承認フロー
- 期限管理承認フロー

■ 複合パターン
- 階層×金額複合フロー
- 部署×緊急度複合フロー
- 契約種別×リスク複合フロー
- システム×影響度複合フロー

■ 業務別パターン
- 見積・契約承認
- 経費・出張承認
- 人事・採用承認
- IT・システム承認
```

#### 2-2. カスタムテンプレート
```
■ テンプレート作成機能
- 既存フローからテンプレート化
- テンプレート設定のパラメータ化
- テンプレートプレビュー機能
- テンプレート説明・タグ付け

■ テンプレート管理機能
- テンプレート一覧・検索
- カテゴリ分類
- 使用頻度統計
- バージョン管理
- 共有・権限管理
```

### 3. テスト・検証機能

#### 3-1. フロー検証機能
```
■ 静的検証
- フロー完全性チェック
- 承認者存在確認
- 権限妥当性チェック
- 循環参照検出
- デッドロック検出
- 到達不可能ノード検出

■ 動的検証
- シミュレーション実行
- テストデータでの動作確認
- パフォーマンス測定
- エラーケース検証
- 境界値テスト
```

#### 3-2. シミュレーション機能
```
■ テストシナリオ実行
- 複数パターンの自動テスト
- エッジケーステスト
- パフォーマンステスト
- 負荷テスト

■ 結果分析機能
- 実行ログ詳細表示
- 処理時間分析
- ボトルネック特定
- 改善提案表示
```

### 4. データ連携機能

#### 4-1. 業務データ連携
```
■ データソース設定
- 業務テーブル参照設定
- フィールドマッピング
- データ型変換設定
- リアルタイムデータ取得

■ 外部システム連携
- REST API連携
- GraphQL連携
- Webhook設定
- 認証情報管理
```

#### 4-2. 申請フォーム連携
```
■ フォーム自動生成
- フロー設定からフォーム生成
- 必須項目自動設定
- 入力検証ルール生成
- レスポンシブデザイン対応

■ カスタムフォーム設定
- 独自フィールド追加
- レイアウトカスタマイズ
- 条件付き表示制御
- ファイル添付対応
```

## 🗄️ 現在の実装との適合性分析

### 1. データベーステーブル適合性

#### 1-1. 既存テーブルでの実装可能性

```sql
-- ✅ 完全対応可能
CREATE TABLE approval_flows (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),           -- フロー名
    description TEXT,            -- フロー説明
    design_data JSON,           -- ノーコード設計データ ★新規追加必要
    canvas_data JSON,           -- キャンバス配置データ ★新規追加必要
    is_active BOOLEAN,          -- 有効/無効
    created_by BIGINT,          -- 作成者
    version INTEGER DEFAULT 1,   -- バージョン管理 ★新規追加必要
    template_id BIGINT,         -- テンプレートID ★新規追加必要
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- ✅ 完全対応可能
CREATE TABLE approval_steps (
    id BIGINT PRIMARY KEY,
    approval_flow_id BIGINT,    -- 既存
    step_order INTEGER,         -- 既存
    step_type VARCHAR(50),      -- 既存
    node_id VARCHAR(100),       -- ノーコード設計でのノードID ★新規追加必要
    approver_id BIGINT,         -- 既存
    approver_type ENUM('user', 'position', 'group', 'superior'), -- ★新規追加必要
    department_id BIGINT,       -- ★新規追加必要
    position_id BIGINT,         -- ★新規追加必要
    group_id BIGINT,            -- ★新規追加必要
    conditions JSON,            -- 既存（条件設定データ）
    is_required BOOLEAN,        -- 既存
    can_delegate BOOLEAN,       -- 既存
    deadline_hours INTEGER,     -- 既存
    amount_limit DECIMAL(15,2), -- ★新規追加必要
    notification_settings JSON, -- ★新規追加必要
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- ✅ 基本対応可能（拡張必要）
CREATE TABLE approval_conditions (
    id BIGINT PRIMARY KEY,
    approval_flow_id BIGINT,    -- 既存
    step_id BIGINT,             -- 既存
    condition_type VARCHAR(50), -- 既存
    field_name VARCHAR(100),    -- 既存
    operator VARCHAR(20),       -- 既存
    value TEXT,                 -- 既存
    logical_operator VARCHAR(10), -- AND/OR ★新規追加必要
    condition_group INTEGER,    -- 条件グループ化 ★新規追加必要
    priority INTEGER,           -- 優先度 ★新規追加必要
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### 1-2. 新規追加が必要なテーブル

```sql
-- ★新規テーブル: ノーコード設計テンプレート
CREATE TABLE no_code_flow_templates (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    template_data JSON NOT NULL,
    preview_image VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ★新規テーブル: ノーコード設計バージョン管理
CREATE TABLE no_code_flow_versions (
    id BIGINT PRIMARY KEY,
    flow_id BIGINT NOT NULL,
    version_number INTEGER NOT NULL,
    design_data JSON NOT NULL,
    canvas_data JSON,
    change_description TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    
    FOREIGN KEY (flow_id) REFERENCES approval_flows(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_flow_version (flow_id, version_number)
);

-- ★新規テーブル: テスト実行履歴
CREATE TABLE flow_test_executions (
    id BIGINT PRIMARY KEY,
    flow_id BIGINT NOT NULL,
    test_data JSON NOT NULL,
    execution_result JSON NOT NULL,
    execution_time_ms INTEGER,
    status ENUM('success', 'error', 'warning') DEFAULT 'success',
    error_details TEXT,
    executed_by BIGINT,
    executed_at TIMESTAMP,
    
    FOREIGN KEY (flow_id) REFERENCES approval_flows(id),
    FOREIGN KEY (executed_by) REFERENCES users(id)
);

-- ★新規テーブル: 承認者グループ管理
CREATE TABLE approver_groups (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    approval_type ENUM('all', 'any', 'majority') DEFAULT 'any',
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ★新規テーブル: 承認者グループメンバー
CREATE TABLE approver_group_members (
    id BIGINT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    priority_order INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES approver_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_group_member (group_id, user_id)
);
```

### 2. Laravel Eloquentモデル適合性

#### 2-1. 既存モデルの拡張

```php
// ✅ 基本対応可能（拡張必要）
class ApprovalFlow extends Model
{
    protected $fillable = [
        'name', 'description', 'is_active', 'created_by',
        'design_data',      // ★新規追加
        'canvas_data',      // ★新規追加
        'version',          // ★新規追加
        'template_id',      // ★新規追加
    ];

    protected $casts = [
        'design_data' => 'array',   // ★新規追加
        'canvas_data' => 'array',   // ★新規追加
        'is_active' => 'boolean',
    ];

    // ★新規リレーション
    public function template()
    {
        return $this->belongsTo(NoCodeFlowTemplate::class, 'template_id');
    }

    public function versions()
    {
        return $this->hasMany(NoCodeFlowVersion::class, 'flow_id');
    }

    public function testExecutions()
    {
        return $this->hasMany(FlowTestExecution::class, 'flow_id');
    }

    // ★新規メソッド: ノーコード設計からフロー生成
    public function generateFromDesign(array $designData): bool
    {
        // 実装必要
        return true;
    }

    // ★新規メソッド: フロー妥当性検証
    public function validateDesign(): array
    {
        // 実装必要
        return [];
    }
}

// ✅ 基本対応可能（拡張必要）
class ApprovalStep extends Model
{
    protected $fillable = [
        'approval_flow_id', 'step_order', 'step_type', 'approver_id',
        'conditions', 'is_required', 'can_delegate', 'deadline_hours',
        'node_id',                  // ★新規追加
        'approver_type',           // ★新規追加
        'department_id',           // ★新規追加
        'position_id',             // ★新規追加
        'group_id',                // ★新規追加
        'amount_limit',            // ★新規追加
        'notification_settings',   // ★新規追加
    ];

    protected $casts = [
        'conditions' => 'array',
        'notification_settings' => 'array',  // ★新規追加
        'amount_limit' => 'decimal:2',       // ★新規追加
        'is_required' => 'boolean',
        'can_delegate' => 'boolean',
    ];

    // ★新規リレーション
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function approverGroup()
    {
        return $this->belongsTo(ApproverGroup::class, 'group_id');
    }

    // ★新規メソッド: 動的承認者解決
    public function resolveApprover(ApprovalRequest $request): ?User
    {
        switch ($this->approver_type) {
            case 'user':
                return User::find($this->approver_id);
            case 'position':
                return $this->findUserByPosition($this->department_id, $this->position_id);
            case 'superior':
                return $request->requestedBy->getSuperior();
            case 'group':
                return $this->approverGroup->getNextApprover();
            default:
                return null;
        }
    }
}
```

#### 2-2. 新規モデルの実装

```php
// ★新規モデル
class NoCodeFlowTemplate extends Model
{
    protected $fillable = [
        'name', 'description', 'category', 'difficulty_level',
        'template_data', 'preview_image', 'is_public', 'created_by'
    ];

    protected $casts = [
        'template_data' => 'array',
        'is_public' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function flows()
    {
        return $this->hasMany(ApprovalFlow::class, 'template_id');
    }

    public function incrementUsageCount(): void
    {
        $this->increment('usage_count');
    }
}

// ★新規モデル
class NoCodeFlowVersion extends Model
{
    protected $fillable = [
        'flow_id', 'version_number', 'design_data', 
        'canvas_data', 'change_description', 'created_by'
    ];

    protected $casts = [
        'design_data' => 'array',
        'canvas_data' => 'array',
    ];

    public function flow()
    {
        return $this->belongsTo(ApprovalFlow::class, 'flow_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

// ★新規モデル
class ApproverGroup extends Model
{
    protected $fillable = [
        'name', 'description', 'approval_type', 'created_by'
    ];

    public function members()
    {
        return $this->hasMany(ApproverGroupMember::class, 'group_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'approver_group_members', 'group_id', 'user_id')
                   ->withPivot('is_primary', 'priority_order')
                   ->orderBy('pivot_priority_order');
    }

    public function getNextApprover(): ?User
    {
        switch ($this->approval_type) {
            case 'any':
                return $this->users->first();
            case 'all':
                return $this->users->first(); // 最初のメンバーから開始
            case 'majority':
                return $this->users->first(); // 過半数承認の最初のメンバー
            default:
                return null;
        }
    }
}
```

### 3. GraphQL API適合性

#### 3-1. 既存GraphQLの拡張

```php
// ✅ 基本対応可能（拡張必要）
class ApprovalFlowType extends ObjectType
{
    public function fields(): array
    {
        return [
            'id' => ['type' => Type::nonNull(Type::id())],
            'name' => ['type' => Type::string()],
            'description' => ['type' => Type::string()],
            'is_active' => ['type' => Type::boolean()],
            
            // ★新規フィールド
            'design_data' => ['type' => Type::string()], // JSON文字列として返す
            'canvas_data' => ['type' => Type::string()], // JSON文字列として返す
            'version' => ['type' => Type::int()],
            'template' => ['type' => NoCodeFlowTemplateType::class],
            'versions' => [
                'type' => Type::listOf(NoCodeFlowVersionType::class),
                'resolve' => fn($root) => $root->versions()->orderBy('version_number', 'desc')->get()
            ],
            'test_executions' => [
                'type' => Type::listOf(FlowTestExecutionType::class),
                'resolve' => fn($root) => $root->testExecutions()->latest()->limit(10)->get()
            ],
            
            // 既存フィールド
            'steps' => ['type' => Type::listOf(ApprovalStepType::class)],
            'conditions' => ['type' => Type::listOf(ApprovalConditionType::class)],
            'created_at' => ['type' => Type::string()],
            'updated_at' => ['type' => Type::string()],
        ];
    }
}

// ★新規GraphQLタイプ
class NoCodeFlowTemplateType extends ObjectType
{
    public function fields(): array
    {
        return [
            'id' => ['type' => Type::nonNull(Type::id())],
            'name' => ['type' => Type::string()],
            'description' => ['type' => Type::string()],
            'category' => ['type' => Type::string()],
            'difficulty_level' => ['type' => Type::int()],
            'usage_count' => ['type' => Type::int()],
            'template_data' => ['type' => Type::string()],
            'preview_image' => ['type' => Type::string()],
            'is_public' => ['type' => Type::boolean()],
            'creator' => ['type' => UserType::class],
            'created_at' => ['type' => Type::string()],
        ];
    }
}
```

#### 3-2. 新規GraphQL Queries/Mutations

```php
// ★新規クエリ
class NoCodeFlowTemplatesQuery extends Query
{
    public function type(): Type
    {
        return Type::listOf(NoCodeFlowTemplateType::class);
    }

    public function args(): array
    {
        return [
            'category' => ['type' => Type::string()],
            'difficulty_level' => ['type' => Type::int()],
            'is_public' => ['type' => Type::boolean()],
            'search' => ['type' => Type::string()],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $query = NoCodeFlowTemplate::query();

        if (isset($args['category'])) {
            $query->where('category', $args['category']);
        }

        if (isset($args['difficulty_level'])) {
            $query->where('difficulty_level', '<=', $args['difficulty_level']);
        }

        if (isset($args['is_public'])) {
            $query->where('is_public', $args['is_public']);
        }

        if (isset($args['search'])) {
            $query->where(function($q) use ($args) {
                $q->where('name', 'LIKE', '%' . $args['search'] . '%')
                  ->orWhere('description', 'LIKE', '%' . $args['search'] . '%');
            });
        }

        return $query->orderBy('usage_count', 'desc')->get();
    }
}

// ★新規ミューテーション
class CreateFlowFromTemplateMutation extends Mutation
{
    public function type(): Type
    {
        return ApprovalFlowType::class;
    }

    public function args(): array
    {
        return [
            'template_id' => ['type' => Type::nonNull(Type::id())],
            'name' => ['type' => Type::nonNull(Type::string())],
            'description' => ['type' => Type::string()],
            'customizations' => ['type' => Type::string()], // JSON文字列
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $template = NoCodeFlowTemplate::findOrFail($args['template_id']);
        $template->incrementUsageCount();

        $designData = $template->template_data;
        
        // カスタマイズがある場合は適用
        if (isset($args['customizations'])) {
            $customizations = json_decode($args['customizations'], true);
            $designData = $this->applyCustomizations($designData, $customizations);
        }

        $flow = ApprovalFlow::create([
            'name' => $args['name'],
            'description' => $args['description'] ?? '',
            'template_id' => $template->id,
            'design_data' => $designData,
            'canvas_data' => $template->template_data['canvas_data'] ?? [],
            'version' => 1,
            'is_active' => false, // 設計完了後に有効化
            'created_by' => auth()->id(),
        ]);

        // テンプレートからステップとコンディションを生成
        $this->generateStepsFromDesign($flow, $designData);

        return $flow;
    }
}

// ★新規ミューテーション
class TestFlowDesignMutation extends Mutation
{
    public function type(): Type
    {
        return FlowTestExecutionType::class;
    }

    public function args(): array
    {
        return [
            'flow_id' => ['type' => Type::nonNull(Type::id())],
            'test_data' => ['type' => Type::nonNull(Type::string())], // JSON文字列
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $flow = ApprovalFlow::findOrFail($args['flow_id']);
        $testData = json_decode($args['test_data'], true);

        $startTime = microtime(true);
        
        try {
            $simulator = new FlowSimulator($flow);
            $result = $simulator->execute($testData);
            $executionTime = round((microtime(true) - $startTime) * 1000);

            $execution = FlowTestExecution::create([
                'flow_id' => $flow->id,
                'test_data' => $testData,
                'execution_result' => $result,
                'execution_time_ms' => $executionTime,
                'status' => $result['status'] ?? 'success',
                'error_details' => $result['errors'] ?? null,
                'executed_by' => auth()->id(),
                'executed_at' => now(),
            ]);

            return $execution;

        } catch (\Exception $e) {
            $executionTime = round((microtime(true) - $startTime) * 1000);
            
            return FlowTestExecution::create([
                'flow_id' => $flow->id,
                'test_data' => $testData,
                'execution_result' => ['status' => 'error'],
                'execution_time_ms' => $executionTime,
                'status' => 'error',
                'error_details' => $e->getMessage(),
                'executed_by' => auth()->id(),
                'executed_at' => now(),
            ]);
        }
    }
}
```

### 4. 実装難易度・工数見積もり

#### 4-1. 実装フェーズ分析

```
■ Phase 1: 基盤実装 (工数: 4-6週間)
✅ 既存テーブル拡張: 2週間
  - approval_flows, approval_steps, approval_conditionsの拡張
  - 新規カラム追加とマイグレーション

✅ 新規テーブル作成: 1週間
  - テンプレート管理テーブル
  - バージョン管理テーブル
  - テスト実行履歴テーブル

✅ Eloquentモデル拡張: 2週間
  - 既存モデルの機能拡張
  - 新規モデル作成
  - リレーション定義

✅ GraphQL API拡張: 1週間
  - 新規タイプ定義
  - クエリ・ミューテーション追加

■ Phase 2: コア機能実装 (工数: 6-8週間)
🔶 フロー設計エンジン: 3週間
  - ノーコード設計データ構造定義
  - フロー生成ロジック実装
  - 設計妥当性検証機能

🔶 条件評価エンジン: 2週間
  - 複合条件評価ロジック
  - 動的データ参照機能
  - エラーハンドリング

🔶 承認者解決エンジン: 2週間
  - 動的承認者選択ロジック
  - 権限チェック機能
  - 代理・委譲処理

🔶 テスト・シミュレーション: 1週間
  - フローシミュレーター
  - テスト実行エンジン
  - 結果分析機能

■ Phase 3: フロントエンド実装 (工数: 8-12週間)
🔶 設計キャンバス: 4週間
  - React/TypeScript実装
  - ドラッグ&ドロップ機能
  - ビジュアル接続機能

🔶 プロパティパネル: 2週間
  - 動的フォーム生成
  - 条件設定UI
  - リアルタイムバリデーション

🔶 テンプレート管理: 2週間
  - テンプレート選択UI
  - プレビュー機能
  - カスタマイズ機能

🔶 テスト・シミュレーション画面: 2週間
  - テスト実行UI
  - 結果表示機能
  - ログ・分析機能

🔶 統合・最適化: 2週間
  - パフォーマンス最適化
  - UX改善
  - ブラウザ対応

■ Phase 4: 高度機能・運用対応 (工数: 4-6週間)
🔶 外部システム連携: 2週間
  - REST API連携
  - Webhook対応
  - 認証情報管理

🔶 監査・ログ機能: 1週間
  - 設計変更履歴
  - 使用状況分析
  - セキュリティログ

🔶 運用管理機能: 2週間
  - バックアップ・復元
  - パフォーマンス監視
  - エラー通知

🔶 ドキュメント・ヘルプ: 1週間
  - ユーザーガイド
  - API仕様書
  - 運用マニュアル

【総工数見積もり: 22-32週間 (約5.5-8ヶ月)】
```

#### 4-2. 技術的課題と対応策

```
■ 高難易度課題
🔶 複合条件の動的評価
  課題: 複数条件の組み合わせによる性能劣化
  対策: 条件評価の最適化、キャッシュ機能、インデックス最適化

🔶 大規模フローの描画性能
  課題: ノード数が多い場合のレンダリング性能
  対策: 仮想化レンダリング、遅延読み込み、Canvas API活用

🔶 リアルタイムデータ連携
  課題: 外部システムとの動的データ取得
  対策: 非同期処理、タイムアウト制御、フォールバック機能

■ 中難易度課題
🔶 フロー設計の妥当性検証
  課題: 複雑な設計での検証ロジック
  対策: ルールエンジン活用、段階的検証、警告レベル分け

🔶 承認者の動的解決
  課題: 組織変更への動的対応
  対策: 定期的な承認者更新、代理設定の自動化

🔶 バージョン管理とマイグレーション
  課題: 設計変更時の既存申請への影響
  対策: 段階的移行、影響範囲分析、ロールバック機能

■ 低難易度課題
🔶 UI/UX最適化
  課題: 直感的な操作性の実現
  対策: ユーザビリティテスト、段階的改善

🔶 テンプレート管理
  課題: テンプレートの分類・検索
  対策: タグ機能、使用頻度による推奨
```

## 📋 実装推奨事項

### 1. 開発優先順位

```
■ 最優先 (必須機能)
1. 基本的なノーコード設計機能
2. 階層別・金額別承認フローテンプレート
3. 簡単な条件分岐機能
4. 基本的なテスト・シミュレーション機能

■ 高優先 (重要機能)
1. 複合条件承認フロー
2. 動的承認者解決
3. 業務データ連携
4. 詳細なテスト・分析機能

■ 中優先 (付加価値機能)  
1. 高度なテンプレート管理
2. 外部システム連携
3. パフォーマンス最適化
4. 監査・ログ機能

■ 低優先 (将来拡張)
1. AI支援機能
2. 高度な分析・レポート
3. モバイル対応
4. 多言語対応
```

### 2. 技術選択推奨

```
■ フロントエンド
- React 18 + TypeScript
- React Flow (フロー設計ライブラリ)
- Material-UI または Ant Design
- Apollo Client (GraphQL)

■ バックエンド
- Laravel 10.x (既存環境)
- GraphQL (lighthouse-php)
- Redis (キャッシュ・セッション)
- MySQL 8.0 (既存環境)

■ 追加ツール・ライブラリ
- React Flow: ノーコード設計UI
- JSON Schema: 設計データ検証
- Queue システム: 非同期処理
- WebSocket: リアルタイム通信
```

この仕様書に基づいて実装することで、**既存の承認フローシステムを基盤として、90%以上の機能をノーコードで設計・設定可能な高度な承認フロー管理システム**を構築できます。

現在の実装との適合性は**約80%**で、主要な拡張ポイントは明確に特定できており、段階的な実装が可能です。
