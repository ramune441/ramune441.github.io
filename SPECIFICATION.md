# SPECIFICATION — ramune441.github.io

Chrome拡張機能・Androidアプリ・WebサービスのLP/プライバシーポリシーを提供する静的サイト。GitHub Pagesホスティング。

## サイト構成

| パス | 種別 | インデックス | sitemap | 説明 |
|---|---|---|---|---|
| `/` | ルートポータル | index | yes | 全プロダクト一覧 |
| `/formpilot/` | LP | index | yes | Chrome拡張。`i18n-lp.js` で11言語対応。YouTube埋め込み（`#promo-video`）は `LP_VIDEO_IDS` により表示言語の動画に自動切替 |
| `/formpilot/guide.html` | 使い方ガイド | index | yes | 操作手順 |
| `/formpilot/contact.html` | 問い合わせ | index | yes | 自前フォーム（下記「問い合わせフォーム基盤」参照）。`i18n-lp.js` で11言語対応 |
| `/formpilot/uninstall.html` | アンケート | noindex | no | アンインストール理由アンケート（英語）。`chrome.runtime.setUninstallURL` の遷移先。拡張がクエリで渡す匿名診断（`v`/`lang`/`days`/`fills`/`err`）を hidden `diagnostics` に集約して送信し、`lang` は hidden `language` にも反映。詳細欄は**必須** |
| `/formpilot/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/formpilot/promo.html` | 動画用 | noindex | no | 録画専用。`?lang=` で11言語対応（en=DOM既定、sendready-chrome/promo.html と同方式。文言は i18n-lp.js と同期、デモの人物・住所も言語別、ar は RTL） |
| `/formpilot/promo[-lang].webm` `promo[-lang].mp4` | 動画 | - | no | プロモ動画 ×11言語（en=無印）。**4K録画（deviceScaleFactor=2）**から生成: webm=1080p VP9(lanczos縮小/33.0s)、mp4=4K H.264+AAC BGM（YouTube用。BGM は旧動画「FormPilot ver2」と同一音源）。**YouTube 公開済み（4K版・タイトル「FormPilot ver2 (言語名)」）**: en=c02Ka-_WdIE / ja=2Caux6fcero / zh=3RzbNsLkw6Q / ko=qqjFaQIk0IQ / es=4eLZeM5lRLo / fr=ljIlLc6FTM8 / de=FhwzRQyPnQo / pt=df5TcuOgLvM / hi=ZSdSh7UxRnc / id=nmI-oOZIHRs / ar=Uue8B-AuAj4（旧1080p版11本は非公開化済み）。各言語のストア掲載情報のプロモ動画欄に `https://www.youtube.com/watch?v=<ID>` を設定（手動） |
| `/formpilot/images/<lang>/` | ストア画像(翻訳版) | - | no | `store-image-{1..5}.png`(1280x800) + `store-tile-marquee.png`(1400x560) × 10言語。生成元は拡張リポジトリ FormPilot の `store-image-*.html` + `store-i18n.js`(`?lang=` 指定・ar はRTL)。en は `/formpilot/` 直下 |
| `/ashiato-maker/` | LP | index | yes | Chrome拡張。デモは**実際のPairs画面のキャプチャ**(`pairs-real.png`)＋日本語パネルレプリカ重ね。写真は実会員のため実写真にブラー(blur 9px)をかけた上で撮影 |
| `/ashiato-maker/contact.html` | 問い合わせ | index | yes | 自前フォーム（自己完結型・インライン11言語辞書）。「使っているアプリ」選択（Pairs/With/東カレデート/Tinder → `app` フィールド）つき |
| `/ashiato-maker/uninstall.html` | アンケート | noindex | no | アンインストール理由アンケート（日本語）。`chrome.runtime.setUninstallURL` の遷移先。拡張がクエリで渡す匿名診断（`v`/`days`/`visits`/`runs`）を hidden `diagnostics` に集約して送信。詳細欄は**必須** |
| `/ashiato-maker/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/ashiato-maker/pairs-real.png` | 画像 | - | no | 実際のPairs検索画面キャプチャ(2400x1500)。会員写真は実写真ぼかし処理。LPのデモ画像に使用 |
| `/ashiato-maker/live-b.png` `live-seq-1..6.png` `live-visit.png` `live-full.png` | 画像 | - | no | **拡張機能を実際に稼働させた**Pairs画面キャプチャ(2400x1500)。seq1..6=**リセットせず連続実行し、訪問中バッジが別々の新しい会員へ移り✓訪問済が増えていく実連続**(進捗39→43)、visit=お相手詳細オーバーレイを開いて足あとを残す瞬間(顔/名前/自己紹介ぼかし)、full=1画面まるごと✓訪問済。実パネル日本語化。写真は実写真ぼかし。※重複訪問しないよう進捗リセットは禁止 |
| `/ashiato-maker/promo.html` | 動画用 | noindex | no | （旧方式・録画専用）現行の `promo.webm` はこのHTML録画ではなく**ffmpeg合成方式**で生成（下記promo.webm欄参照） |
| `/ashiato-maker/promo.webm` `promo.mp4` | 動画 | - | no | **ライトモード・6シーン合成**（イントロ→課題提起+4ステップ→**実稼働デモ13秒×1.3倍スロー**[コールアウト6個: 開始ボタン/訪問中…巡回/✓訪問済スキップ/最大訪問数・ディレイ/自動リロード無限ループ/進捗100人+]→比較「その"ポチポチ"、今日で終わり。」→機能6グリッド→CTA）約34秒・VP9/H.264。生成法: シーン別HTML(Puppeteer PNG)+gdigrab実写録画を ffmpeg overlay/concat/per-scene setpts で合成（デモ以外は高速テンポ）。会員写真10px・名前9pxぼかし |
| `/ashiato-maker/store-image-{1..5}.png` | ストア画像 | - | no | 1280x800ネイティブのライトモード専用デザイン（動画フレーム流用ではない）。**実際のPairs稼働キャプチャ**（グリッド+日本語パネル / お相手詳細オーバーレイ）をブラウザ枠モックに載せて使用。1=ヒーロー(コピー+実画面)、2=実稼働アノテーション(訪問中/✓訪問済/パネルをリング強調)、3=プロフ詳細訪問(1人ずつちゃんと訪問)、4=ポチポチ比較、5=機能6グリッド |
| `/ashiato-maker/store-tile-small.png` `store-tile-marquee.png` | ストア画像 | - | no | プロモーションタイル(440x280)とマーキープロモーションタイル(1400x560)。store-imageと同一のライトモードデザイン。マーキーは左コピー+右実稼働キャプチャ |
| `/sendready-chrome/` | LP | index | yes | Chrome拡張（SendReady）。`i18n-lp.js` で11言語対応。YouTube埋め込み（`#promo-video`）は `LP_VIDEO_IDS` により表示言語の動画に自動切替 |
| `/sendready-chrome/how-to.html` | 使い方ガイド | index | no | 操作手順（LPからリンク） |
| `/sendready-chrome/contact.html` | 問い合わせ | index | yes | 自前フォーム（自己完結型・インライン11言語辞書＋言語セレクター）。拡張の `SR_CONFIG.FEEDBACK_URL`（設定画面の「お問い合わせ」・満足度ゲート）の遷移先。`?lang=` と診断クエリ（`v`/`days`/`uses`/`err`）を受け取り、後者は hidden `diagnostics` に集約して送信 |
| `/sendready/contact.html` | 転送 | noindex | no | `/sendready-chrome/contact.html` へ meta refresh + JS で転送（クエリ引き継ぎ）。GitHub Pages は 301 を返せない。Android版削除後もストア公開中の拡張が旧 `FEEDBACK_URL` を持つため残す |
| `/sendready-chrome/uninstall.html` | アンケート | noindex | no | アンインストール理由アンケート（英語）。`chrome.runtime.setUninstallURL` の遷移先。診断クエリ（`v`/`lang`/`days`/`uses`/`err`）を hidden `diagnostics` に集約して送信（拡張側は v1.1.6 で対応済み）。詳細欄は**必須** |
| `/sendready-chrome/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー（英語） |
| `/sendready-chrome/promo.html` | 動画用 | noindex | no | 録画専用。`?lang=` で11言語対応（en=DOM既定、store-images.html と同方式。文言は i18n-lp.js と同期、ar は RTL） |
| `/sendready-chrome/promo[-lang].webm` | 動画 | - | no | Chrome Web Store 用（VP9/yuv420p/1080p/30fps/約34.6秒）。en=`promo.webm`、翻訳版=`promo-{ja,zh,ko,es,fr,de,pt,hi,id,ar}.webm`。**4K録画（deviceScaleFactor=2）から lanczos 縮小**。`page.screencast()` で録画し、録画ごとに実測係数（wall-clock ÷ raw実尺）で setpts 再エンコード |
| `/sendready-chrome/promo[-lang].mp4` | 動画 | - | no | YouTube 掲載用 **4K**（H.264 High/yuv420p/3840x2160/30fps + AAC BGM、約8-10MB）。BGM は旧動画と同一音源。**YouTube 公開済み（4K版・チャンネル: Just One More Animal、タイトル「SendReady ChromeExtension (言語名)」）**: en=EgFYF6ePogI / ja=XJfutrY5Hi4 / zh=O14tQiPTOuM / ko=EP851RRJ960 / es=i5upjawC5Wc / fr=yy85fFNBexM / de=A27lAS3KP6A / pt=gUgKhme1FLg / hi=XCgpLPoVV8I / id=vuDxSAuPJJk / ar=4li9HWk8jf0（旧1080p版11本は非公開化済み）。各言語のストア掲載情報のプロモーション動画欄に `https://www.youtube.com/watch?v=<ID>` を設定（デベロッパーコンソールは拡張から操作不可のため手動） |
| `/sendready-chrome/store-images.html` | ストア画像生成 | noindex | no | スクショ撮影用。`images/store-image-{1..5}.png`(1280x800) + `store-image-feature.png`(1400x560) + `store-tile-small.png`(440x280・enのみ) を Puppeteer の要素スクショで生成。`?lang=` で11言語対応(en=DOM既定、翻訳版は `images/<lang>/` に同名で出力。文言は拡張の lib/i18n.js・lib/presets.js・LP の i18n-lp.js と同期、ar は RTL) |
| `/subduo/` | LP | index | yes | Chrome拡張（SubDuo・動画配信の二言語字幕）。**対応は Prime Video / YouTube / Netflix / Disney+ の4サービス**で、設定はサイトごとに独立（プリセット機能は無い）。ダークテーマ。`i18n-lp.js` で拡張UIと同じ12言語対応（en=DOM既定、ja/zh/zh-TW/ko/es/fr/de/it/pt/ru/hi）＋言語セレクター（`?lang=` > localStorage > ブラウザ言語）。**HTMLの既定文（英語）は必ず `i18n-lp.js` の en 辞書と同じ文字列にする**（実行時に上書きされるため、ずれるとクローラだけが古い文言を見る）。デモは実画面ではなく架空作品のプレイヤーモック（ヒーローは cue を3.6秒周期で切替）。**ウェブストアCTAは `SUBDUO_STORE_URL` 定数のプレースホルダ（公開後に掲載URLへ差し替え）** |
| `/subduo/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー（英語／日本語の切替ボタン、`?lang=ja` で日本語）。完全ローカル動作・権限は storage / tabs / scripting と対応4サイトのみ。YouTube の字幕一覧取得は Cookie を送らない旨も明記 |
| `/subduo/store-images.html` | ストア画像生成 | noindex | no | `record-store.mjs`（puppeteer-core・要素スクショ）で `images/store-image-{1..5}.png`(1280x800) + `store-image-marquee.png`(1400x560) + `store-tile-small.png`(440x280・enのみ) を生成。`?lang=` で12言語（翻訳版は `images/<lang>/`、zh-TW はディレクトリ名も `zh-TW`）。5枚は構図を変えて「1=全面シネマ（夜景）に大きな二言語字幕＋対応4サービス / 2=Before(一時停止・?)→After の痛み→解決 / 3=言語ペア6カード（ペアは `PAIRS[locale]`、UI言語を下段に固定） / 4=同じ場面で3つの見た目（標準・大きく上に・色変え背景なし） / 5=導入3ステップ＋信頼チップ」。機能説明の羅列ではなく困りごと→解決の型にする。字幕サンプルは「上段=原語 / 下段=UI言語」（en のみ上段スペイン語）。あふれ判定は装飾 `.glow` を除いた `window.__overflow()` で行う（scrollHeight は overflow:hidden でも装飾のはみ出しを含むため使わない） |
| `/ripen/` | LP | index | yes | Android（旧称 Focus First）。`i18n-lp.js` で12言語対応（ja/en/zh/ko/es/fr/de/it/pt/ru/ar/hi）＋言語セレクター |
| `/ripen/contact.html` | 問い合わせ | index | yes | 自前フォーム（自己完結型・インライン11言語辞書。it/ru は en にフォールバック） |
| `/ripen/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー。`i18n-pp.js` で同12言語対応＋言語セレクター |
| `/ripen/promo.html` | 動画用 | noindex | no | 録画専用。`?lang=` で12言語対応（en=DOM既定、ar は RTL）。イントロ＋実機画面6カット（端末を左右交互に配置）＋CTA で約29.5秒 |
| `/ripen/promo.mp4` | 動画 | - | no | LP/ストア紹介用。`images/promo/audio/promo-en.mp4` と同一ファイル（BGM入り） |
| `/ripen/images/promo/promo-<lang>.mp4` | 動画 | - | no | BGM 無しの中間ファイル×12言語で**リポジトリ管理外**（BGM版から作り直せるため追跡しない）。H.264 High/yuv420p/1080p/30fps/約32.7秒。`page.screencast()` で実時間録画し、フレーム数から逆算した実fpsで再タイミング＋末尾1.5秒フリーズ |
| `/ripen/images/promo/audio/promo-<lang>.mp4` | 動画 | - | no | 上記に BGM を足した YouTube 掲載用×12言語（AAC 192k/48kHz stereo）。BGM は `mp3/271_BPM110.mp3`（音源はライセンス品のためリポジトリ管理外）を音量0.85・冒頭0.6秒フェードイン・末尾2秒フェードアウト。掲載タイトル/説明文は同ディレクトリの `youtube.json`（`YOUTUBE.md` は同内容の閲覧用）。**YouTube 公開済み（チャンネル: Just One More Animal、タイトル「Ripen — <各言語のコピー>」）**: en=YWXSLB3oNIk / ja=ZQU_WGjQm_I / ko=WPGNv3VMRiw / zh=IfsfJfg0vNo / de=CZ40F6x5vhk / es=NbepPxeCQCQ / fr=ckaQ6bCZWyk / it=ick4Fth687I / pt=XyePSrbkaps / ru=s7OqzqooMc8 / hi=pUys6pfdarU / ar=nfaGKUhp_J8。Play Console のストア掲載情報「アプリの YouTube プロモ動画の URL」に `https://www.youtube.com/watch?v=<ID>` を言語別に設定（12言語ぶんを1回の保存でコミット→`公開の概要` で審査に送信。デベロッパーコンソールは手動サインインが必要） |
| `/ripen/store-images.html` | ストア画像生成 | noindex | no | スクショ撮影用。`?lang=` で12言語対応（en=DOM既定、ar は RTL）。Puppeteer の要素スクショで `images/store/<lang>/store-image-{feature,1..5}.png`(1024x500) を出力。5枚とも「ユーザーの痛み → RIPEN なら → 解決」の型で、痛みは**製品への疑いではなくユーザー自身の困りごとを置く**（ストアのカルーセルは大見出しだけ読まれるため、疑いを置くと不安だけが残る）。掲載手順は `images/store/UPLOAD.md` |
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
| ripen | G-4YHTG3FQSX |
| subduo | G-4YHTG3FQSX（ルートと共用） |

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

## 問い合わせ／アンケート基盤（contact-api）

2026-07-26 に Google フォームを**全廃**し、自前フォーム＋Cloudflare Worker に移行。

- **エンドポイント**: `https://contact-api.warload57.workers.dev/`（POST, multipart/form-data）
- **実装リポジトリ**: `C:\Users\Warlo\MyProduct\Website\contact-api\`（詳細はそちらの SPECIFICATION.md）
- **通知先**: warload57@gmail.com（Cloudflare Email Routing send_email、差出人 `contact@suredon.com`）
- **2種類の送信**: `kind=contact`（既定）と `kind=uninstall`（アンインストール理由アンケート）
- **フィールド**: `product`（FormPilot/SendReady/Ashiato Maker/Lovent/Ripen/Charmly/Cookpal）/ `category`（Bug Report/Feature Request/Other、contact時必須）/ `reasons[]`（uninstall時必須・英語カノニカル値）/ `reasonOther` / `content` / `email`（任意）/ `app`（ashiato用）/ `device` `osVersion`（Loventアプリが `?device=&os=` で引き渡し）/ `attachment`（任意、画像・動画・PDF・テキスト、25MBまで → R2 保存しメールにDLリンク記載）/ `language` / `botcheck`（ハニーポット）
- **スパム対策**: ハニーポット + IPレート制限（毎時5件・毎日20件）+ Origin 許可制（ramune441.github.io / charm-ly.com / cookpal-ai.com / localhost）
- 各ページは成功時にインライン成功表示（AJAX送信）。選択肢は英語カノニカル値で送信し、表示のみ翻訳
- **Google フォームは全て撤廃**（問い合わせ3件・アンインストールアンケート3件・Charmly・Cookpal・Lovent）

## デプロイ

GitHub Pages（masterブランチ直push）。手動ビルドなし。

## 使用外部サービス

| サービス | 用途 | 認証 | 制約 |
|---|---|---|---|
| GitHub Pages | ホスティング | - | 1リポジトリ1サイト |
| Cloudflare Workers (contact-api) | 問い合わせフォーム受信・通知メール | APIトークン（グローバルCLAUDE.md記載） | 無料枠 10万req/日。メール5MiB/32添付。R2添付はリンク配布 |
| Google Analytics 4 | アクセス計測 | gtag.js | - |
| Google Ads | 広告計測 (ashiato-maker のみ) | gtag.js | - |
| Google Fonts | Webフォント | - | Noto Sans JP / Inter |
| Google Search Console | サーチ計測 | metaタグ認証 | - |
| Bing Webmaster Tools | サーチ計測・URL送信 | metaタグ + BingSiteAuth.xml 認証 | URL Submission は1日100件まで |
