# SPECIFICATION — ramune441.github.io

Chrome拡張機能・Androidアプリ・WebサービスのLP/プライバシーポリシーを提供する静的サイト。GitHub Pagesホスティング。

## サイト構成

| パス | 種別 | インデックス | sitemap | 説明 |
|---|---|---|---|---|
| `/` | ルートポータル | index | yes | 全プロダクト一覧 |
| `/formpilot/` | LP | index | yes | Chrome拡張 |
| `/formpilot/guide.html` | 使い方ガイド | index | yes | 操作手順 |
| `/formpilot/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/formpilot/promo.html` | 動画用 | noindex | no | 録画専用 |
| `/formpilot/images/<lang>/` | ストア画像(翻訳版) | - | no | `store-image-{1..5}.png`(1280x800) + `store-tile-marquee.png`(1400x560) × 10言語。生成元は拡張リポジトリ FormPilot の `store-image-*.html` + `store-i18n.js`(`?lang=` 指定・ar はRTL)。en は `/formpilot/` 直下 |
| `/ashiato-maker/` | LP | index | yes | Chrome拡張。デモは**実際のPairs画面のキャプチャ**(`pairs-real.png`)＋日本語パネルレプリカ重ね。写真は実会員のため実写真にブラー(blur 9px)をかけた上で撮影 |
| `/ashiato-maker/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/ashiato-maker/pairs-real.png` | 画像 | - | no | 実際のPairs検索画面キャプチャ(2400x1500)。会員写真は実写真ぼかし処理。LPのデモ画像に使用 |
| `/ashiato-maker/live-b.png` `live-seq-1..6.png` `live-visit.png` `live-full.png` | 画像 | - | no | **拡張機能を実際に稼働させた**Pairs画面キャプチャ(2400x1500)。seq1..6=**リセットせず連続実行し、訪問中バッジが別々の新しい会員へ移り✓訪問済が増えていく実連続**(進捗39→43)、visit=お相手詳細オーバーレイを開いて足あとを残す瞬間(顔/名前/自己紹介ぼかし)、full=1画面まるごと✓訪問済。実パネル日本語化。写真は実写真ぼかし。※重複訪問しないよう進捗リセットは禁止 |
| `/ashiato-maker/promo.html` | 動画用 | noindex | no | （旧方式・録画専用）現行の `promo.webm` はこのHTML録画ではなく**ffmpeg合成方式**で生成（下記promo.webm欄参照） |
| `/ashiato-maker/promo.webm` `promo.mp4` | 動画 | - | no | **ライトモード・6シーン合成**（イントロ→課題提起+4ステップ→**実稼働デモ13秒×1.3倍スロー**[コールアウト6個: 開始ボタン/訪問中…巡回/✓訪問済スキップ/最大訪問数・ディレイ/自動リロード無限ループ/進捗100人+]→比較「その"ポチポチ"、今日で終わり。」→機能6グリッド→CTA）約34秒・VP9/H.264。生成法: シーン別HTML(Puppeteer PNG)+gdigrab実写録画を ffmpeg overlay/concat/per-scene setpts で合成（デモ以外は高速テンポ）。会員写真10px・名前9pxぼかし |
| `/ashiato-maker/store-image-{1..5}.png` | ストア画像 | - | no | 1280x800ネイティブのライトモード専用デザイン（動画フレーム流用ではない）。**実際のPairs稼働キャプチャ**（グリッド+日本語パネル / お相手詳細オーバーレイ）をブラウザ枠モックに載せて使用。1=ヒーロー(コピー+実画面)、2=実稼働アノテーション(訪問中/✓訪問済/パネルをリング強調)、3=プロフ詳細訪問(1人ずつちゃんと訪問)、4=ポチポチ比較、5=機能6グリッド |
| `/ashiato-maker/store-tile-small.png` `store-tile-marquee.png` | ストア画像 | - | no | プロモーションタイル(440x280)とマーキープロモーションタイル(1400x560)。store-imageと同一のライトモードデザイン。マーキーは左コピー+右実稼働キャプチャ |
| `/lovent/` | LP | index | yes | Android |
| `/lovent/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/lovent/promo.html` | 動画用 | noindex | no | 録画専用 |
| `/lovent/store-images.html` | ストア画像生成 | noindex | no | スクショ撮影用 |
| `/sendready/` | LP | index | yes | Android |
| `/sendready/tutorial.html` | 使い方ガイド | index | yes | 操作手順 |
| `/sendready/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/sendready/promo.html` | 動画用 | noindex | no | 録画専用 |
| `/sendready-chrome/` | LP | index | yes | Chrome拡張（SendReady）。`i18n-lp.js` で11言語対応 |
| `/sendready-chrome/how-to.html` | 使い方ガイド | index | no | 操作手順（LPからリンク） |
| `/sendready-chrome/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー（英語） |
| `/sendready-chrome/promo.html` | 動画用 | noindex | no | 録画専用 |
| `/sendready-chrome/store-images.html` | ストア画像生成 | noindex | no | スクショ撮影用。`images/store-image-{1..5}.png`(1280x800) + `store-image-feature.png`(1400x560) + `store-tile-small.png`(440x280・enのみ) を Puppeteer の要素スクショで生成。`?lang=` で11言語対応(en=DOM既定、翻訳版は `images/<lang>/` に同名で出力。文言は拡張の lib/i18n.js・lib/presets.js・LP の i18n-lp.js と同期、ar は RTL) |
| `/ripen/` | LP | index | yes | Android（旧称 Focus First）。`i18n-lp.js` で12言語対応（ja/en/zh/ko/es/fr/de/it/pt/ru/ar/hi）＋言語セレクター |
| `/ripen/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー。`i18n-pp.js` で同12言語対応＋言語セレクター |
| `/ripen/promo.html` | 動画用 | noindex | no | 録画専用（英語）。Lovent と同じ6シーン構成 |
| `/ripen/promo.mp4` | 動画 | - | no | Play/ストア紹介用（H.264 High/1080p/30fps/約2.6MB/35.9秒） |
| `/ripen/store-images.html` | ストア画像生成 | noindex | no | スクショ撮影用 |
| `/ripen/icon-512.html` | アイコン生成 | noindex | no | 512pxアイコン撮影用 |
| `/ripen/fgs-demo/fgs-demo.html` | 動画用 | noindex | no | FOREGROUND_SERVICE_SPECIAL_USE 権限説明動画の録画ソース |
| `/ripen/fgs-demo/fgs-demo.mp4` | 動画 | - | no | Play Console 提出用（H.264/1080p）。`fgs-demo.webm` も同梱 |

外部ドメイン運用のプロダクト（リポジトリにディレクトリを持たない）:

| プロダクト | URL | 種別 |
|---|---|---|
| Charmly | https://charm-ly.com/ | Web |

## SEO 設計

### 必須メタタグ（全インデックス対象ページ）

| タグ | 内容 |
|---|---|
| `<title>` | 日本語、ページ固有、60文字以内 |
| `meta description` | 日本語、120-160文字 |
| `meta robots` | `index, follow` (`noindex` は promo/store-images のみ) |
| `link canonical` | 自身の絶対URL |
| `og:title` `og:description` `og:type` `og:url` `og:image` `og:locale=ja_JP` `og:site_name` | 必須 |
| `twitter:card=summary_large_image` | 必須 |
| `og:image:width` `og:image:height` `og:image:alt` | LPおよびルートで設定 |

### JSON-LD 構造化データ

| ページ | 構造化データ |
|---|---|
| `/` (ルート) | `WebSite` + `Person`(`@id`参照) + `ItemList`(各SoftwareApplication入れ子) |
| 各LP | `SoftwareApplication` + `FAQPage` + `BreadcrumbList` |
| guide/tutorial | 現状なし（将来 `HowTo` 追加余地あり） |

### sitemap.xml / robots.txt

- `sitemap.xml`: 全インデックス対象ページを列挙。`lastmod` はリリース毎に更新。
- `robots.txt`: 全許可。`promo.html` `store-images.html` `node_modules/` を `Disallow`。

### Google Analytics 計測ID

| プロダクト | gtag ID |
|---|---|
| ルート (`/`) | G-4YHTG3FQSX |
| formpilot | G-4QPZE2JTLP |
| ashiato-maker | G-NLL1M8ZFGH (+ Google広告 AW-17017238782) |
| lovent | G-4YHTG3FQSX |
| sendready | G-4YHTG3FQSX |
| ripen | G-4YHTG3FQSX |

### Google Search Console 認証

- ルートに `<meta name="google-site-verification" content="prSam5v9XLSOs51WRCTyq592bxz1Xmf6HiBGRA-_ke0">` を設置済み。

### Bing Webmaster Tools 認証

- ルート `index.html` に `<meta name="msvalidate.01" content="1C375C5F8B9811B7B6156E4202B36EA4">` を設置済み。
- ルートに `BingSiteAuth.xml` も設置済み（同一コード。どちらか一方が残っていれば検証は維持される）。
- sitemap.xml 送信済み・全15 URL を URL Submission で送信済み（2026-07-11）。

## 新規プロダクト追加時の必須作業

1. ディレクトリ作成 (`<product>/`)
2. `index.html` を作成（CLAUDE.md のLP構成に従う）
3. ルート `index.html` のカードとItemList JSON-LDに追加
4. `sitemap.xml` にURL追加（最低 `/`・`privacy-policy.html`）
5. 必要に応じて `robots.txt` の Disallow に `promo.html` 追加
6. このSPECIFICATIONのサイト構成表を更新

## デプロイ

GitHub Pages（masterブランチ直push）。手動ビルドなし。

## 使用外部サービス

| サービス | 用途 | 認証 | 制約 |
|---|---|---|---|
| GitHub Pages | ホスティング | - | 1リポジトリ1サイト |
| Google Analytics 4 | アクセス計測 | gtag.js | - |
| Google Ads | 広告計測 (ashiato-maker のみ) | gtag.js | - |
| Google Fonts | Webフォント | - | Noto Sans JP / Inter |
| Google Search Console | サーチ計測 | metaタグ認証 | - |
| Bing Webmaster Tools | サーチ計測・URL送信 | metaタグ + BingSiteAuth.xml 認証 | URL Submission は1日100件まで |
