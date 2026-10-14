# SPECIFICATION — ramune441.github.io（入口）

Ramune の Chrome 拡張・Android アプリ・Web サービスの LP・使い方・問い合わせ・アンケート・プライバシーポリシーと、ストア／YouTube 用の素材（プロモ動画・ストア画像・掲載文）を置く静的サイト。GitHub Pages で配信する。

## 約束すること
- インデックス対象ページは title・description・canonical・OGP・JSON-LD を持ち、sitemap.xml に載せる。録画用・画像生成用・アンケートは noindex で robots.txt でも除外する。
- 問い合わせとアンインストールアンケートはすべて自前フォーム＋ Worker `contact-api` で受ける（Google フォームは使わない）。
- 拡張が渡す匿名診断クエリはアンケートの hidden 欄に集約して送り、それ以外の個人情報は集めない。
- LP の文言は各プロダクトの `i18n-lp.js` を正とし、HTML の既定文（英語）や生成ページはそこから作る。

## 約束しないこと
- 外部ドメインで運用するプロダクト（Charmly = `charm-ly.com` など）のページ。ポータルのカードと JSON-LD だけ持つ。
- ストアのデベロッパーコンソール・YouTube Studio への反映。素材と原稿を置くだけで、反映は手動（サインインが要る）。

## 既知の限界
- GitHub Pages は 301 を返せない。移転は meta refresh＋JS の転送ページで代用する。
- SubDuo の LP は v1.0 系（4 サービス・完全ローカル）の記述のまま。拡張 v1.3（TED・語句解説と単語帳・解説サーバー）に追従していない。

## 残タスク
- SubDuo LP を拡張 v1.3 に追従させる（対応 5 サービス・Alt+クリックの語句解説・「調べた語句だけ送る」）。
- SendReady の YouTube 11 本のタイトル・説明文を `sendready-chrome/youtube.json` に差し替える。
- Search Console で SendReady LP の fr / de / ko / zh / id / hi / ar のインデックス登録をリクエストする（en・ja・es・pt はリクエスト済み。1 日の上限があるので数件ずつ）。
- Search Console の `sitemap.xml` が「取得できませんでした」のままなら原因を調べる（公開 URL は 200 で返る）。
- Kura の LP を作り、ポータルと sitemap に載せる。

## 目次
- [spec/product.md](spec/product.md) — ページを足す・変える、プロダクトごとの LP・素材の決まりを確かめるとき
- [spec/contract.md](spec/contract.md) — URL・クエリ・フォームの項目・計測 ID・動画 ID を使う／変えるとき
- [spec/ops.md](spec/ops.md) — デプロイ、生成スクリプトの実行、外部サービス、録画と素材の作り方
