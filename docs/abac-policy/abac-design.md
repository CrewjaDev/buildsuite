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



## ABAC の AccessPolicy は「どのデータへのどんな種類の操作を許すか」を条件付きで設定できる仕組みです。

一覧閲覧（list）のほかにも、業務上よく使うさまざまなアクセス種類を制御対象にできます。

🔑 ABACで制御できる主な「アクセス種類」

AccessPolicy の action カラムに指定するイメージです。

アクセス種類 (action)	            用途例	                        ABACでの制御ポイント
list（一覧表示）        	    画面やAPIでレコード一覧を取得	     検索結果をユーザ属性・データ属性でフィルタ（例：自部署の見積のみ表示）
read / view（詳細閲覧）	      1件のレコードを開いて参照	         Confidentialタグや部署で閲覧可否を制限
create（作成）	              新規レコード登録	                作成先プロジェクトや顧客の制限（例：特定プロジェクトのみ作成可）
update / edit（編集）       	既存レコードの更新	               承認済みは編集不可、自分が作成したもののみ可 など
delete / soft_delete（削除）	レコード削除                    	管理者のみ許可、承認済みは削除不可 など
approve / return /
 reject / cancel（承認系）	  承認フローの操作	                金額しきい値・承認ステップ・自部署の案件のみ など
export / download / print	   CSVエクスポートや印刷出力	        機密案件はダウンロード不可 など
share / visibility_change	   外部共有・公開範囲変更	            権限を持つ部門だけ共有可能 など
archive / restore	           アーカイブ化や復元	                過去年度データを経理部のみ参照 など
audit.read / history.read    監査ログや履歴の閲覧	              監査ロールだけ許可 など

🌟 見積モジュールでの具体例

一覧閲覧（list）
　営業は自部署の見積だけ表示、経理は承認済みのみ表示
　scope=department:selfDept, condition=status IN['approved','requesting']

詳細閲覧（read）
　Confidential案件は管理職以上のみ
　condition=visibility IN['public','internal']

編集（update）
　承認済みは編集不可、自分が作成した草案のみ編集可
　condition=status='draft' AND created_by=user.id

承認（approve）
　課長は100万以下のみ、自部署のみ
　scope=department:selfDept, condition=total_amount<=1000000

エクスポート（export）
　承認済みデータだけCSV出力可
　condition=status='approved'

🔎 まとめ

ABAC は「一覧」「詳細」「編集」「削除」「承認」「エクスポート」などデータに対するあらゆる操作に対して設定可能。

特に業務システムでは list と read のフィルタリングがもっとも効果的で、表示段階で不要データを除外できます。

action を適切に設計しておくと、モジュールごとに再利用しやすくなります。

👉 一覧制限は入り口に過ぎず、あらゆるアクションを条件で細かく制御できるのが ABAC の強みです。


## 複数の組み合わせを表現できる

  AccessPolicy の scope と condition を組み合わせることで、複数の条件を表現できます。

📝 例：見積の削除ルール

要件：

管理者はすべて削除できる

作成者本人は status='draft' のときのみ削除可

承認済み(status='approved')は誰も削除不可

1. 管理者向けポリシー
カラム	値
resource_type	estimate
action	delete
scope	organization（全体）
condition	status != 'approved'
attached_to_type	role
attached_to_id	uuid(管理者ロール)
enabled	true

👉 管理者は承認済み以外のレコードを削除できる

2. 作成者向けポリシー
カラム	値
resource_type	estimate
action	delete
scope	self（自分が作成したレコード）
condition	status = 'draft'
attached_to_type	user（または全ユーザ共通なら全体ロール）
attached_to_id	ALL など
enabled	true

👉 作成者は自分の草案のみ削除できる

3. 承認済みの扱い

どのポリシーにも status='approved' を許容条件に含めていないため、
👉 承認済みは どのユーザでも削除不可（デフォルト拒否）

🔑 複数ポリシーの評価方法

ユーザに適用されるすべてのポリシーを取得

scope は合成（交差 ∩）し、condition は論理積（AND）

少なくとも 1 つのポリシーがレコードを包含していれば許可
　※今回の例では 作成者ポリシー OR 管理者ポリシー でカバー

💡 実装メモ

OR 条件を作るには → 複数ポリシーとして登録し、評価時に「いずれか満たせばOK」 とする

AND 条件を作るには → 同じポリシー内の condition に複数条件を書く

✅ まとめ

AccessPolicy はレコード削除などにも柔軟に対応できます。

管理者用ポリシー

作成者用ポリシー
のように複数行登録すれば OR 条件が実現でき、
さらに各ポリシー内で AND 条件を組み合わせて詳細な制約を記述できます。