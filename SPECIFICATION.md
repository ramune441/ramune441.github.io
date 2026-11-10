# SPECIFICATION — ramune441.github.io（入口）

Ramune の Chrome 拡張・Android アプリ・Web サービスの LP・使い方・問い合わせ・アンケート・プライバシーポリシーと、ストア／YouTube 用の素材（プロモ動画・ストア画像・掲載文）を置く静的サイト。GitHub Pages で配信する。

## 約束すること
- インデックス対象ページは title・description・canonical・OGP・JSON-LD を持ち、sitemap.xml に載せる。録画用・画像生成用・アンケートは noindex で robots.txt でも除外する。
- ポータルと各 LP は拡張・アプリと同じ 20 言語を言語ごとの URL で、本文を生成済みのまま配信し hreflang で結ぶ。問い合わせ・アンケート・プライバシーポリシーも 20 言語。
- AI 検索向けに、ルートの `llms.txt` へ各プロダクトの概要と LP・ストア・プライバシーの URL を載せる。
- 問い合わせとアンインストールアンケートはすべて自前フォーム＋ Worker `contact-api` で受ける（Google フォームは使わない）。
- 拡張が渡す匿名診断クエリはアンケートの hidden 欄に集約して送り、それ以外の個人情報は集めない。
- LP の文言は各プロダクトの翻訳辞書を正とし、HTML の既定文と生成ページを一致させる。FormPilot の文言・画面は拡張の資料と共通化する（product.md）。
- SubDuoのプライバシー説明は、拡張と解説サーバーが実際に扱うデータ・用途・保存先・期間に合わせ、公開ページとストアの申告を一致させる。

## 約束しないこと
- 外部ドメインで運用するプロダクト（Charmly = `charm-ly.com` など）のページ。ポータルのカードと JSON-LD だけ持つ。
- Kura 以外のストア掲載と YouTube Studio への自動反映。Kura は認証済み Android Publisher API で、検証した掲載文と画像を反映できる。

## 既知の限界
- GitHub Pages は 301 を返せない。移転は meta refresh＋JS の転送ページで代用する。
- 問い合わせ・アンケート・プライバシーポリシーは 1 つの URL を `?lang=` で切り替えるため、検索エンジンと JS を動かさないクローラが読むのは既定言語の本文だけ。
- 英語・日本語以外の訳はネイティブの校正を通していない。
- Ripen アプリの表示は 12 言語。LP の残り 8 言語は英語の画像・動画を使う。

## 残タスク
- Search Console で SendReady LP の fr / de / ko / zh / id / hi / ar / zh-TW / vi / th / bn / it / nl / pl / ru / tr のインデックス登録をリクエストする（en・ja・es・pt はリクエスト済み。1 日の上限があるので数件ずつ）。続けて、新しく増えた言語別ページ（ポータル・SubDuo・Ripen・足あとメーカー・SendReady の使い方）も同じようにリクエストする。
- Search Console で `sitemap.xml` を送信し直し、「取得できませんでした」が消えるか確かめる（ファイルは正しい XML で、載せた URL はすべて実在・インデックス可能・canonical 一致）。
- SubDuo のストア掲載文（`subduo/store-listing.json`）のプライバシーポリシー URL に各言語の `?lang=<lang>` を付ける。
- SubDuo の読み上げ（🔊）は Chrome の Google オンライン音声だと文字列を Google が処理する。拡張の仕様の「外部へ送らない」とプライバシーポリシーのどちらに揃えるか決める。
- Ripen のストア掲載文・画像・動画を LP に揃える（単語クイズ・使用状況アクセスとユーザー補助が必須になったこと）。

## 目次
- [spec/product.md](spec/product.md) — ページを足す・変える、プロダクトごとの LP・素材の決まりを確かめるとき
- [spec/contract.md](spec/contract.md) — URL・クエリ・フォームの項目・計測 ID・動画 ID を使う／変えるとき
- [spec/ops.md](spec/ops.md) — デプロイ、生成スクリプトの実行、外部サービス、録画と素材の作り方
