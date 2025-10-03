## ABACの設定について設計検討

### ABACポリシー画面のイメージ

対象業務（resource_type）とアクション（action）を選択
　例：見積 × 閲覧(list) / 見積 × 承認(approve) など

対象者を選ぶ（付与先）
　部署・役割・職位・個人ユーザ

scope（許容集合）を選択
　- 自分のみ（self）
　- 自部署のみ（department:selfDept）
　- プロジェクトを指定（project:IN)
　- 組織全体（organization）

条件（condition）を追加
　- 金額：amount ≤ 1,000,000
　- ステータス：status IN['承認済み','承認依頼中']
　- 承認ステップ：approval_step = 1
　- 時間帯：time BETWEEN 09:00–17:00 など

プレビュー／確認
　- 合成後にどのデータが対象になるかを確認できるテストモードを付けると運用が安心


※ABAC は「条件式の組み合わせ」でポリシーを作るので、
ユーザーにSQLのWHERE句を直接書かせないUI が必要


## UI設計のコツ

・プルダウン＋条件入力式 にして SQL を隠蔽

・テンプレート化された条件ブロック を用意する（例：「自部署のみ」「自分が作成」「金額条件」）

・初期段階では 管理者のみ設定可能 にする方が安全

・監査対応として「いつ誰がポリシーを変更したか」の履歴を残す



### 実装ステップ例

AccessPolicy テーブルを用意（resource_type / action / scope / condition / attached_to）

API：ポリシー CRUD と評価用エンドポイントを実装

管理画面（UI）：上記5ステップをウィザード形式で

一覧・詳細画面の検索や操作ボタンに ABAC 判定ロジックを組み込み


### 構造イメージ

AccessPolicy テーブル例

カラム名	                型	            説明
id      	            PK  	        ポリシーID
title                   text            タイトル名称
resource_type	        text    	    見積、請求、勤怠 などの業務リソース
action	                text	        list / read / edit / approve などの操作
scope	                jsonb / text	許容集合（例：{"department":"selfDept"}）
condition	            jsonb / text	条件式（例：{"amount":{"lte":1000000},"status":["承認済み","承認依頼中"]}）
attached_to_type	    enum	        部署 / 役割 / 職位 / 権限レベル / 個別ユーザ
attached_to_id	        uuid	        付与先のID
enabled	                boolean	        有効/無効
valid_from / valid_to	timestamp   	適用期間
created_by / updated_by	uuid	        設定した管理者
created_at / updated_at	timestamp	    作成・更新日時

※ 補足
・scope や condition は JSON 形式にして、UI 側でテンプレートを編集できるようにすると柔軟です。
・attached_to_type は ENUM にして ['department','role','position','level','user'] のように管理すると良いです。
・同じポリシーでも 複数の付与先に適用したい場合はレコードを分けて複数行登録する 方がシンプルです。
・ユーザが複数のポリシーに該当する場合は、それらの scope∩・condition∧ を合成して最終判定します。



### 「Permitしか無い」構造の違い
	                            RBAC	                            ABAC
・判定レイヤー　	    機能レベル（ボタン/エンドポイント）	     データレベル（レコードのフィルタ）
・判定材料      　  	ロール・部署・ユーザ                    ユーザ属性 × データ属性 × 環境属性
・デフォルト動作　　	 Permitが無い → 入口に入れない	        条件に合わない → レコードに触れない
・Denyの必要性	    　　無し（付与されない＝使えない）	　　　　　無し（条件を満たさない＝触れない）


1️⃣ RBAC の Permit

- 目的：機能（アクション）そのものを使えるかを判定

- 単位：resource_type × action

  例：estimate.view / estimate.edit / estimate.approve

  Permit の意味：
   → その機能ボタン／APIを使う入口の鍵を持っている

- Deny は通常不要（付与しない＝使えない）

- 付与先：ロール・部署・ユーザ など

   例：

    estimate.approve が付与されていなければ、承認ボタン自体が表示されない／押せない

    👉 RBAC = 「ドアの鍵を持っているか」


2️⃣ ABAC（AccessPolicy）の Permit

- 目的：その機能を持っているユーザが、どのレコードに対して許されるかを条件で判定

- 単位：resource_type × action × 条件(scope / condition)

  例：

  estimate.approve のうち
  department_id = user.department_id AND total_amount ≤ 1,000,000

- Permit の意味：
  → 指定された条件を満たすレコードにだけ “使ってよい” と宣言

- Deny は不要
  → 条件を満たさないレコードはデフォルト拒否されるため

- 付与先：部署・役職・個人 など

  例：

  課長は estimate.approve 権限を持っていても、
  100万円超のレコードは条件を満たさないため承認不可

  👉 ABAC = 「部屋の中のどの棚を開けてよいか」