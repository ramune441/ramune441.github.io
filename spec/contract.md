# 名前・値・書式

このファイルは、拡張・アプリ・Worker・ストアとの間で変えると壊れる取り決めを書く。

## SEO の必須タグ（インデックス対象ページ）
FormPilot の言語別URLは `/formpilot/<lang>/`、`/guide.html`、`/privacy-policy.html`。英語だけは `<lang>/` を省き、`zh-Hant` を繁体字の正規値にする。
従来の `?lang=` は同じ言語のページへ移り、その他のクエリとフラグメントを保持する。問い合わせは共通URLの `?lang=` で表示を切り替え、選択値は `formpilot_lang` に保存する。

| タグ | 内容 |
|---|---|
| `<title>` | ページ固有。60 字以内（ja・zh・zh-TW・ko・th は 32 字） |
| `meta description` | ページ固有。155 字以内（同 90 字） |
| `meta robots` | `index, follow`（noindex は録画・画像生成・アンケートだけ） |
| `link canonical` | 自身の絶対 URL |
| OGP | `og:title` `og:description` `og:type` `og:url` `og:image`（＋ LP とポータルは `:width` `:height` `:alt`）`og:locale` `og:site_name` |
| Twitter | `twitter:card=summary_large_image` |
| JSON-LD | ポータル＝`WebSite`＋`Person`＋`ItemList` / LP＝`SoftwareApplication`（`installUrl`・`sameAs`・`featureList`・`screenshot`・`author`）＋`FAQPage`＋`BreadcrumbList` / 使い方＝`HowTo` |
| hreflang | 全 20 言語＋`x-default`（英語のページ）。`zh-Hans`・`pt-BR`、ほかは言語コードのまま |

言語別URLは `/<product>/<lang>/`（既定言語だけ `<lang>/` を省く。既定は Kura・SubDuo・SendReady・FormPilot が英語、足あとメーカー・Ripen・ポータル `/` が日本語）。SendReady の使い方は `/sendready-chrome/<lang>/how-to.html`。
言語を覚える localStorage: `kura_lp_lang`・`kura_lang`（Kura の LP・法務）、`subduo_lp_lang`（SubDuo LP）、`lp_lang`（SendReady・SubDuo の他ページ）、`ripen_lp_lang`（Ripen）、`ashiato_lang`（足あとメーカー）、`formpilot_lang`（FormPilot）。
`sitemap.xml` は生成スクリプトごとの印 `<!-- <名前>:start（…が生成） -->`〜`<!-- <名前>:end -->` の間をそのスクリプトが書き換える → コメントに `--` を書かない（XML が不正になる）。`portal/portal.test.mjs` が確かめる。

Kura LP の言語別URLは `/kura/<lang>/`（`<lang>` はストア画像と同じ言語コード）、英語だけ `/kura/`。hreflang は `zh-Hans`・`pt-BR`、ほかは言語コードのまま。
`/kura/` だけが `?lang=` > localStorage `kura_lp_lang`（言語を選ぶと保存）> ブラウザ言語 のページへ移る。各言語のページは移さない。

## 拡張から渡るクエリ（変えると拡張側が壊れる）
| ページ | クエリ |
|---|---|
| 各 LP・使い方・問い合わせ | `lang`（UI 言語） |
| `/formpilot/uninstall.html` | `v` `lang` `days` `fills` `profile` `opened` `err` |
| `/sendready-chrome/uninstall.html` | `v` `lang` `days` `uses` `err` |
| `/sendready-chrome/contact.html` | `lang` `v` `days` `uses` `err` |
| `/subduo/uninstall.html` | `v` `lang` `days` `err` |
| `/ashiato-maker/uninstall.html` | `v` `days` `visits` `runs` `ev` `evLast` `evSpan` |
| `/ashiato-maker/contact.html` | `v` `days` `visits` `runs` `ev` `evLast` `evSpan` `app` |
| Lovent の問い合わせ | `device` `os` |
- 診断値は hidden `diagnostics` にまとめて送る。`lang` は hidden `language` にも入れる。

## contact-api（`https://contact-api.warload57.workers.dev/`、POST multipart/form-data）
| フィールド | 値 |
|---|---|
| `kind` | `contact`（既定）/ `uninstall` |
| `product` | `FormPilot` `SendReady` `SubDuo` `Ashiato Maker` `Lovent` `Ripen` `Charmly` `Cookpal`。**許可リスト外は 400 `Invalid product`**（新プロダクトは Worker の一覧に足してデプロイするまで送れない） |
| `category` | `Bug Report` / `Feature Request` / `Other`（contact で必須） |
| `reasons[]` | 英語の正規値（uninstall で必須）。`reasonOther` は自由記述 |
| `content` | 5,000 文字まで（超えると 400） |
| `email` `app` `device` `osVersion` `language` `diagnostics` | 任意。`app` は SubDuo が `Prime Video` `YouTube` `Netflix` `Disney+` `TED` `Other`、足あとメーカーは対応アプリ名（Badoo・OkCupid・Match を含む） |
| `attachment` | 任意。画像・動画・PDF・テキスト、25MB まで |
| `botcheck` | ハニーポット（空であること） |
- Origin は ramune441.github.io / charm-ly.com / cookpal-ai.com / localhost だけ許可。IP あたり毎時 5 件・毎日 20 件。

## ストアへのリンクの utm
- LP: `utm_source=sendready-lp&utm_medium=web&utm_campaign=<lang>`。ルートでその場で言語を変えたら `utm_campaign` も変える。
- YouTube: `utm_source=youtube&utm_medium=video&utm_campaign=<lang>`。
- SubDuo・足あとメーカーの LP: `?hl=<ストアの言語>&utm_source=subduo-lp|ashiato-lp&utm_medium=web&utm_campaign=<lang>`。JSON-LD の `installUrl`・`sameAs` はクエリなしの詳細 URL。

## 計測・認証 ID
| 対象 | ID |
|---|---|
| GA4 ポータル・Ripen・SubDuo | G-4YHTG3FQSX |
| GA4 FormPilot・SendReady | G-4QPZE2JTLP |
| GA4 足あとメーカー | G-NLL1M8ZFGH（＋ Google 広告 AW-17017238782） |
| Search Console | `google-site-verification` = `prSam5v9XLSOs51WRCTyq592bxz1Xmf6HiBGRA-_ke0`（ポータル） |
| Bing | `msvalidate.01` = `1C375C5F8B9811B7B6156E4202B36EA4`（ポータル＋ `BingSiteAuth.xml`） |

## YouTube 動画 ID（言語別。ストアのプロモ動画欄と各LPで使用する）
- SubDuoの採用URLは `subduo/youtube-store-videos.json`、追加8言語の動画・字幕・ハッシュ・投稿IDは `subduo/youtube-promo-localized.json` を正とする。既存動画のIDを再生成時に上書きしない。
- FormPilot の採用動画IDは `formpilot/youtube-store-videos.json`、追加した8言語の素材・投稿と照合結果は `formpilot/youtube-promo-localized.json` を正とする。ストアの `zh-CN` は `zh`、`zh-TW` は `zh-Hant`、`pt-BR` は `pt` に対応する。
| プロダクト | en | ja | zh | zh-TW | ko | es | fr | de | it | pt | ru | hi | id | ar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SendReady | EgFYF6ePogI | XJfutrY5Hi4 | O14tQiPTOuM | | EP851RRJ960 | i5upjawC5Wc | yy85fFNBexM | A27lAS3KP6A | | gUgKhme1FLg | | XCgpLPoVV8I | vuDxSAuPJJk | 4li9HWk8jf0 |
| Ripen | YWXSLB3oNIk | ZQU_WGjQm_I | IfsfJfg0vNo | | WPGNv3VMRiw | NbepPxeCQCQ | ckaQ6bCZWyk | CZ40F6x5vhk | ick4Fth687I | XyePSrbkaps | s7OqzqooMc8 | pUys6pfdarU | | nfaGKUhp_J8 |
- チャンネルは「Just One More Animal」。SubDuoの既存12言語の投稿情報は `subduo/youtube.json`、他製品は `sendready-chrome/youtube.json`・`ripen/images/promo/audio/youtube.json`。

## 素材のファイル名と仕様
- SubDuoのストア説明は `subduo/store-listing.json` の言語コード別の文字列で保持する。`_` は管理用の注記で、各本文は改行を含むプレーンテキスト・16000文字以内とする。
SubDuo の画像言語コードは `en / ja / zh / zh-TW / ko / es / fr / de / pt / hi / id / ar / vi / it / tr / pl / th / nl / ru / bn`。英語は `subduo/images/`、他はその配下の言語フォルダに置く。拡張の `zh_CN / zh_TW / pt_BR` はそれぞれ `zh / zh-TW / pt` に対応する。
| 素材 | 仕様 |
|---|---|
| ストア用プロモ動画 `promo[-lang].webm` | VP9 / yuv420p / 1920x1080 / 30fps / 無音。en は無印 |
| YouTube 用 `promo[-lang].mp4` | 4K（3840x2160）H.264 High / yuv420p / 30fps ＋ AAC BGM |
| FormPilot 実録版 `formpilot/youtube-assets/story/promo-<lang>.mp4` | 3840x2160 / H.264 High / yuv420p / 30fps / 25秒 / AAC 192kbps 48kHz ステレオ。字幕は同名の `.vtt`、照合情報は同名の `.json`（録画の操作時刻とボタン位置、AIの入力結果、音の出来事とPCMハッシュ、音量、生成元4ファイルのハッシュ） |
| SendReady 実録版 `sendready-chrome/story/promo-<lang>.mp4`（git に入れない） | 3840x2160 / H.264 High / yuv420p / 30fps / 約64秒（7機能の実演＋「ほかにも」＋締め。録画の実時間で言語ごとに変わる）/ AAC 192kbps 48kHz ステレオ・-16 LUFS。字幕は同名の `.vtt`、照合情報は同名の `.json`（録画の操作時刻・6回のAIの結果・時間割・音の出来事とPCMハッシュ・生成元ファイルのハッシュ）。`<lang>` は拡張の UI 言語コード（`story-copy.mjs` のキー） |
| FormPilot 実録版の投稿台帳 `formpilot/youtube-story.json` | 言語別に `file`・`sha256`・`title`（`FormPilot \| <締めの一文>`）・`description`（ストア詳細説明＋ストア・LP・ガイド・プライバシーのURL）・`language`（Studioの表示名）・`videoId`・`uploadedSha256`・`captionsUploaded`・`published`。中断した投稿は `draftId` から再開し、同じ素材を二重に上げない |
| FormPilot の自作音入り YouTube 用 `formpilot/youtube-assets/original-sound/{promo-<lang>,formpilot-<version>-<lang>}.mp4` | 元動画の映像ストリームをそのまま（再エンコードしない）＋ AAC 192kbps / 48kHz / ステレオ。照合情報は `formpilot/youtube-sound.json`（元動画と映像のハッシュ、測った場面開始、音のPCMハッシュ、音量、生成した `promo-sound.js` のハッシュ） |
| SubDuo 実操作試作 `subduo/previews/live-demo-<lang>.mp4` | 1920x1080 / H.264 / yuv420p / 30fps / 約40秒（2秒単位）/ AAC。`<lang>` はストア画像と同じ言語コード。字幕は同名のWebVTT、ポスターは同名JPEG、照合情報は同名JSON、出典と変更点は共通の `CREDITS.md`、全言語の切り替えは `index.html` |
| Chrome ストア画像 | `store-image-{1..5}.png` 1280x800、マーキー 1400x560、小タイル 440x280。翻訳版は `images/<lang>/` |
| Play ストア画像 | フィーチャー 1024x500、スクショは 1080x1920 |
