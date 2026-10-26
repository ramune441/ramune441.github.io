# ページと素材の決定

## サイト構成
| パス | 種別 | 索引 | sitemap |
|---|---|---|---|
| `/` | ポータル（全プロダクト一覧） | index | yes |
| `/<product>/` | LP | index | yes |
| `/<product>/contact.html` | 問い合わせ | index | yes |
| `/<product>/privacy-policy.html` | プライバシーポリシー | index | yes |
| `/<product>/uninstall.html` | アンインストール理由アンケート | noindex | no |
| `/<product>/promo.html` `store-images.html` `icon-512.html` 等 | 録画・画像生成用 | noindex | no |
| `/sendready-chrome/<lang>/` | SendReady LP の言語別ページ（10 言語） | index | yes |
| `/sendready/contact.html` | 転送（→ `/sendready-chrome/contact.html`） | noindex | no |

プロダクト: FormPilot・足あとメーカー・SendReady（Chrome）・SubDuo・Ripen（Android）・Kura（Android、LP 未作成でポータルと sitemap に載せない）。

## LP 共通
- 構成は Hero → 対応先 → 課題 → 比較 → デモ → メリット → 機能 → 使い方 → 安全性 → 注意 → FAQ → CTA。
- 多言語は `i18n-lp.js`（言語の決め方は `?lang=` > localStorage `lp_lang` > ブラウザ言語）。**HTML の既定文は en 辞書と同じ文字列にする**（実行時に上書きされるので、ずれるとクローラだけが古い文言を見る）。
- YouTube 埋め込み（`#promo-video`）は表示言語の動画に切り替える。

## SendReady LP（`/sendready-chrome/`）
- **言語ごとに URL を持つ**: en はルート、他は `/sendready-chrome/<lang>/`。各ページは本文をその言語で生成済みで、実行時に訳し直さない（クローラが英語ブラウザとして描画しても、その言語で索引させるため）。言語セレクターはその言語のページへ移動する。
- ルートは拡張が `?lang=` 付きで開くため、従来どおりその場で言語を切り替える。使い方ページ（how-to.html）もその場で切り替える。
- title / description は検索語入り（`i18n-lp.js` の `seo_title` / `seo_desc`）。ja は「敬語」「ビジネスメール」「書き換え」「返信」「定型文」、他言語は「AI 書き換え（rewrite / reformuler / umschreiben …）」「メール返信」「テキスト展開・テンプレート」の語。
- 各ページは hreflang（全 11 言語＋ x-default=ルート）と、その言語の SoftwareApplication・FAQPage・BreadcrumbList を持つ。
- ウェブストアへのリンクは言語別の utm 付き（contract.md）。
- `/sendready/contact.html` は削除済み Android 版の旧問い合わせ URL。ストア公開中の古い拡張が持つため転送ページとして残す。

## SubDuo の素材
- 言語は拡張 UI と同じ 12 言語（zh-TW・it・ru を含む）。uninstall.html も 12 言語。
- ストア画像は「困りごと → 解決」の型で、機能の羅列にしない。字幕サンプルは上段＝原語・下段＝UI 言語。
- **「完全ローカル／何も送らない」とは書かない**（語句を調べたときは語句と字幕行を解説サーバーへ送るため）。「字幕はブラウザの外に出ない・送るのは調べた語句だけ」と書く。
- ストア掲載文（`subduo/store-listing.json`）は「要約 → できること → 対応サイト → 使い方 → プライバシー → 注意 → URL」の順。名前と概要は拡張の `_locales` が使われるので持たない。
- プライバシーポリシーは英語／日本語切替（`?lang=ja`）。権限の記述は manifest の permissions と一致させる。

## Ripen・Kura の素材
- Kura は写真や動画をプライベートに隠せることと、開く際の端末認証を、ストア掲載の短い説明・本文・画像・アプリ紹介で揃えて伝える。暗号化や独自 PIN は約束しない。
- Kura の掲載文と言語対応・画像の順序は `kura/store-listing.json` を正とする。アプリ紹介と画像の見出し・説明はアプリの翻訳から取り込んで一致させる。
- Kura のストア素材はアプリと同じ 20 言語を用意し、スペイン語・ポルトガル語の地域別掲載を含む 22 掲載先で使う。各言語に掲載文、携帯電話・タブレット各 5 枚とフィーチャー画像を持つ。
- ストア画像は「ユーザー自身の困りごと → 解決」の型。製品への疑いを見出しに置かない（カルーセルは大見出しだけ読まれ、不安だけが残るため）。
- Kura の端末内の文言はアプリの strings.xml そのもの、キャプションだけ別辞書。金庫の名前は改名中なので `{vault}` でアプリの文言を差し込む。価格は en=$、ja=円、他は USD 表記（現地通貨は Play が換算するので推測しない）。
- Kura のフィーチャーグラフィックは写真管理アプリとして 4 機能を出し、スワイプを主役にしない。

## 足あとメーカーの素材
- デモ画像・動画は実際の Pairs 画面のキャプチャ。会員の顔写真・名前・自己紹介は必ずぼかす。
- 連続稼働キャプチャは進捗をリセットせずに撮る（重複訪問になるため進捗リセットは禁止）。

## 問い合わせ・アンケート
- 各ページは成功をその場に表示する（AJAX 送信）。選択肢は英語の正規値で送り、表示だけ翻訳する。
- アンインストールアンケートは詳細欄を必須にする。
