# 運用

## デプロイ
- GitHub Pages。master に push すると反映される。ビルドはない（生成スクリプトの出力もコミットする）。

## 外部サービス
| サービス | 用途 | 認証 | 制約 |
|---|---|---|---|
| GitHub Pages | ホスティング | なし | 1 リポジトリ 1 サイト。301 不可 |
| Cloudflare Workers `contact-api`（実装 `C:\Users\Warlo\MyProduct\Website\contact-api\`） | フォーム受信 → warload57@gmail.com へ通知（差出人 `contact@suredon.com`）、添付は R2 に置きリンクを送る | Cloudflare API トークン（グローバル CLAUDE.md） | 無料枠 10 万 req/日。メール 5MiB |
| Google Analytics 4 / Google 広告 | 計測 | gtag.js | — |
| Google Search Console / Bing Webmaster Tools | 検索の計測・URL 送信 | meta タグ（Bing は `BingSiteAuth.xml` も） | Bing の URL 送信は 1 日 100 件。Search Console のインデックス登録リクエストは 1 日数件で上限 |
| IndexNow（`https://api.indexnow.org/indexnow`、Bing・Yandex 等へ通知） | 更新した URL の通知 | ルートのキーファイル `9eefbdc8fcbeed0e98d72998716f8861.txt`（中身はキーそのもの。消すと送信できない） | POST `{host, key, keyLocation, urlList}` |
| Google Fonts | Noto Sans JP / Inter | — | — |
| Google Play Android Publisher API | Kura の掲載文・画像の更新と検証 | リポジトリ外のサービスアカウント鍵、`androidpublisher` OAuth スコープ | 文章・画像の制約を送信前に検証し、429 は再試行する。審査中の変更は自動で取り消さない |
| YouTube Studio（Just One More Animal） | プロモ動画と字幕の登録・照合 | Google認証済みChrome。接続のAllowは管理者が操作する | チャンネル・動画と字幕の言語・チェック完了・外部再生を確認する |

## 生成スクリプト（文言や拡張の UI を変えたら実行して生成物ごとコミット）
| 対象 | 実行 | 生成物 |
|---|---|---|
| ポータル | `node portal/build.mjs [--sitemap]` → `node --test portal/portal.test.mjs` | ルート `index.html`（ja）と `/<lang>/index.html`、`--sitemap` で `sitemap.xml` の `portal` の印の間。プロダクトの言語ページを増やしたら再実行する（カードのリンク先が変わる） |
| SendReady LP の言語別ページ | `cd sendready-chrome && node build-lang-pages.mjs`（Node だけで動く）→ `node --test sendready-chrome/lp.test.mjs` | `sendready-chrome/<lang>/index.html` と `<lang>/how-to.html`、ルート `index.html`・`how-to.html` の SEO ブロック、`sitemap.xml` の SendReady 部分。版は拡張の manifest（`SENDREADY_EXT`）から取るので、拡張の版を上げたら再生成する |
| SubDuo LP | `node subduo/build-lp.mjs [--sitemap]` → `node --test subduo/lp.test.mjs` | `subduo/index.html`（英語）と `subduo/<lang>/index.html`、`--sitemap` で `subduo-lp` の印の間。文言は `subduo/lp-i18n/<lang>.json`、版は拡張の manifest（`SUBDUO_EXT`） |
| Ripen LP・法務 | `node ripen/build-lp.mjs [--sitemap]` → `node --test ripen/lp.test.mjs` | `ripen/index.html`（日本語）と `ripen/<lang>/index.html`、`i18n-pp.js`、プライバシーポリシーと問い合わせの既定文。文言は `ripen/lp-i18n/`・`pp-i18n/`・`contact-i18n/` |
| 足あとメーカーのページ | `node ashiato-maker/build-pages.mjs [--sitemap]` → `node --test "ashiato-maker/**/*.test.mjs"`。画像は拡張のストア画像を作り直したら `node ashiato-maker/build-lp-images.mjs` | LP 20 言語と問い合わせ・アンケート・プライバシー。文言は `ashiato-maker/i18n/`、形は `templates/`。拡張（`ASHIATO_EXT`）があれば版・動画・主要アプリを `lp-data.json` へ写す |
| SendReady ストア画像 | `node sendready-chrome/render-store-images.mjs [lang…]`（puppeteer-core と Chrome。指定なしで全 20 言語） | `sendready-chrome/images/`（en）と `images/<lang>/` の紹介画像 5 枚とマーキー、en だけ小タイル。文字がキャンバス外・言語数が 20 でない場合は失敗する |
| SendReady の実録版紹介動画（YouTube用） | `node sendready-chrome/record-story.mjs [lang…]`（Chrome for Testing と拡張の実ソース `SENDREADY_EXT`。1言語ごとに本物のAIリクエスト6回＝丁寧に・//p トリガー・返信・要約・好きな指示・翻訳。録画済みは飛ばし、`--force` で録り直す）→ `node sendready-chrome/build-story.mjs [lang…]`（Chrome・FFmpeg。`--stills=秒,…` は静止画だけ）→ `node --test sendready-chrome/story.test.mjs` | `sendready-chrome/story/promo-<lang>.{mp4,vtt,json}`。構成・カメラ・音は `story.mjs`、文言は `story-copy.mjs`、画面は `story.html`、音源は `formpilot/promo-sound.js` を共用。録画のコマ（3840x2160 JPEG）は `%LOCALAPPDATA%/SendReady/story-capture`（`SENDREADY_CAPTURE_DIR`）に置く。注意: このChromeではサービスワーカー内の evaluate が返らないので、初期設定は拡張の popup.html から書き、AIの成功は拡張の履歴と成功回数で照合する。最後にポップアップのプリセット一覧と履歴を静止画で撮り、「ほかにも」のカードに使う。注意: 高解像度のコマは `--force-device-scale-factor` で起動したときだけ届く（`setViewport` の倍率では1倍のまま） |
| FormPilot の公開資料 | `node formpilot/guide-shots.js` → `node formpilot/build-site.js`（puppeteer-core と Chrome、同階層の FormPilot 拡張ソースが必要。別配置は `FORMPILOT_EXT`） | 20言語の実画面・LP・ガイド・プライバシー説明、問い合わせとアンケートの翻訳、サイトマップ。検索用の文言は `formpilot/translations-seo.js`、アンケートは `translations-survey.js` |
| FormPilot の動画 | 上記の画像生成後に `node formpilot/build-videos.js` → `node formpilot/build-site.js` | 20言語各2本のMP4・WebVTT・ポスター、再生ページと動画の検証情報 |
| FormPilot の未投稿言語の動画 | `node formpilot/build-promo-localized.js` → `node --test formpilot/promo-localized.test.js` | 元の日本語版と同じ構成・尺・BGMの翻訳動画、字幕、`formpilot/youtube-promo-localized.json` の掲載情報 |
| FormPilot のYouTube動画の音 | `node formpilot/build-youtube-sound.js [promo\|slides] [lang…]` → `node --test formpilot/youtube-sound.test.js`（FFmpeg・FFprobeのみ。全39本で数分） | 紹介動画とストア画像動画の映像はそのまま、自作BGM・効果音に差し替えたMP4と `formpilot/youtube-sound.json`。`promo-sound.js` か元動画を変えたら作り直す（古いと検証で失敗する）。YouTubeは動画ファイルを差し替えられないため、新しい動画として投稿し、ストアの動画URLを差し替えてから旧動画を非公開にする |
| FormPilot の実録版紹介動画（YouTube用・20言語） | `node formpilot/record-story.js [lang…]`（拡張とChrome for Testing。1言語ごとに本物のAIリクエスト1回。録画済みの言語は飛ばす）→ `node formpilot/build-promo-story.js [lang…]`（Chrome・FFmpeg。4Kを1コマずつ描いて1言語約2分。`--stills=秒,…` は静止画だけ、`--sfx=minimal,none,full` は音違いの比較用）→ `node --test formpilot/promo-story.test.js` | `formpilot/youtube-assets/story/promo-<lang>.{mp4,vtt,json}`。台本・画面・音は `promo-story.js`、文言は `promo-story-copy.js` が正。録画のコマは `%LOCALAPPDATA%/FormPilot/story-capture`（`FORMPILOT_CAPTURE_DIR`）に置き、リポジトリに入れない |
| FormPilot の実録版のYouTube投稿 | `node formpilot/youtube-story.js renew`（作り直した言語の旧動画を `retired` へ）→ `metadata` → `upload` → `captions`（動画とタイトルの言語も詳細画面で設定）→ `publish`（チェック中の言語は非公開のまま残るので、後で再実行）→ `retire`（新しい動画が公開済みの言語だけ旧動画を非公開に）→ `check` | `formpilot/youtube-story.json` に動画ID・素材のSHA-256・字幕と公開の状態。サインイン済みの `C:\Users\Warlo\cws-profile` を使い、API認証は不要 |
| FormPilot のストアの動画欄 | ストアのプロフィールで通常のChromeを `--remote-debugging-port=9333` 付きで開き、`CWS_BROWSER_URL=http://127.0.0.1:9333 node formpilot/cws-videos.js`（`--read` は確認のみ、`--submit` で審査へ送信）。動画が全言語公開済みであることを確かめてから、言語タブごとに `youtube-story.json` の動画、英語は全言語向けにも入れて下書き保存し、再読み込みして照合する | `formpilot/youtube-store-videos.json` に採用URL。審査を通ると公開される |
| FormPilot の実操作プレビュー | `node formpilot/record-live-demo.js` → `node --test formpilot/live-demo.test.js` | 日本語の自動入力・保存・再読込・復元を実拡張で録画した確認用動画。架空の情報だけを使い、フォーム送信はしない |
| SubDuo ストア画像 | `node subduo/render-store-images.mjs [lang…]` → `node --test subduo/store-assets.test.mjs`（puppeteer-core・Chromeが必要。ブラウザは `CHROME_PATH` で指定可能） | `subduo/images/` と寸法・SHA-256を記録した `subduo/store-assets.json`。指定なしで全言語、指定ありで対象言語を再生成 |
| SubDuo の追加言語動画 | `node subduo/build-promo-localized.mjs [lang…]` → `node --test subduo/promo-localized.test.mjs`（FFmpeg・FFprobe・Chrome・puppeteer-coreが必要） | 39.5秒・4K/30fpsのMP4とWebVTT。既存英語版のAAC BGMを再利用し、公開済みIDがある素材は再生成しない |
| SubDuo の実操作プレビュー | 言語ごとに `SUBDUO_LANG=<lang> node subduo/capture-live-preview.mjs` → `SUBDUO_LANG=<lang> SUBDUO_DROP_FRAMES=1 node subduo/build-live-preview.mjs`、最後に `node --test subduo/live-preview.test.mjs subduo/live-sound.test.mjs` | 自作BGM・効果音つきの約40秒のMP4・WebVTT・出典・実操作と音量の検証情報（20言語、文言は `subduo/live-i18n.mjs`）。Chrome・実拡張とFFmpeg/FFprobeが必要。拡張の場所は `SUBDUO_EXT`、一時録画先は `SUBDUO_CAPTURE_DIR`（既定は `%LOCALAPPDATA%/subduo-live-preview/<lang>`、2倍密度のJPEGコマで約0.6GB/言語。`SUBDUO_DROP_FRAMES=1` で書き出し後に消す。OS一時フォルダはディスクの掃除で書き出し中に消されるので使わない）。試写は `SUBDUO_STILLS=秒,秒…`（静止画だけ）、音だけ直すときは `SUBDUO_AUDIO_ONLY=1`。注釈・効果音・速度調整は録画に記録した操作の時刻と位置から置くので、録り直しても手で合わせ直さない。テストは各言語のタイムライン（場面・注釈・文言）を組み直して書き出し時のハッシュと照合し、変わった言語だけ書き出し直しを求める（コマを残していれば録り直しは不要） |
| SubDuo の実操作プレビューの投稿とストアの動画欄 | `node subduo/youtube-live.mjs metadata\|upload\|captions\|publish\|check [lang…]`（書き出し直した言語は先に `renew` で旧動画を `retired` へ移し、新しい動画の公開後に `retire` で旧動画を非公開にする） → ストアのプロフィールの Chrome（`--remote-debugging-port=9333`）で `node subduo/cws-listing.mjs [--cancel-review] [--package] [--images] [--submit]`（`--read` は確認のみ、`--from=<lang>` で途中の言語から再開）。審査待ちなら取り消し、拡張の版の ZIP を下書きに上げて20言語を確かめ、公開を確認した言語の動画と、`--images` なら各言語のスクリーンショット5枚（英語は全言語向けとマーキーも）を言語タブごとに入れて再読み込みで照合する。注意: 画像は上げた時点で下書きに入り「下書きとして保存」が押せないままになる。マーキーの削除には確認の窓が出る | `subduo/youtube-live.json` に動画ID・素材のSHA-256・字幕と公開の状態、採用URLは `subduo/youtube-store-videos.json`。`--submit` は20言語すべて公開済みのときだけ送る。注意: YouTube は既定で埋め込みが許可されず、oEmbed が403になる。`publish` で埋め込みを許可してから公開を確かめる。注意: YouTube のチェック中は保存直後の画面に「公開」と出ても非公開のまま戻る。再読み込みして公開を読み戻せた動画だけを公開済みにする |
| Kura ストア画像 | `node kura/store-images-strings.mjs` → `node kura/render-store-images.mjs`（puppeteer-core と Chrome が必要） | `kura/images/store/<lang>/` |
| Kura LP | `node kura/build-lp.mjs`（Node だけで動く）→ `node --test kura/lp.test.mjs`。形は `kura/lp-template.html`・`lp.css`・`lp.js`、文言は `kura/lp-i18n/<lang>.json`、法務 2 ページは `kura/legal-i18n/<lang>.json` を直す | `kura/index.html`（英語）と `kura/<lang>/index.html`、`kura/i18n-pp.js`・`i18n-delete.js` と法務 2 ページの日本語既定文、`sitemap.xml` の `kura-lp` の印の間 |
| Kura LP の画像 | ストア画像を作り直したら `node kura/build-lp-images.mjs [lang…]` → `node --test kura/lp.test.mjs`（puppeteer-core と Chrome。古いとテストで失敗する） | `kura/images/lp/<lang>/` の WebP と `kura/images/lp/photos/` のサムネイル |
| Kura 紹介動画 | `node kura/record-promo.mjs [lang…]`（FFmpeg は `FFMPEG_PATH`。1コマずつ描いて撮る。音は先に `python kura/promo-audio.py` で合成する。サンプルなしで、効果音は `kura/promo.html` の時刻に合わせてある） | `kura/images/promo/promo-<lang>.mp4`（4K・30fps・44秒・20言語。リポジトリには入れない）→ `node kura/youtube-upload.mjs <lang…>` → `node kura/youtube-publish.mjs` → Play の差し替え後に `node kura/youtube-retire.mjs` で旧動画を非公開。採用URLは `kura/images/promo/youtube.json`、ストアの `video` は `kura/store-listing.json` |
- SendReady LP の文言は `sendready-chrome/i18n-lp.js` を直してから生成する。生成ページを手で直すと次の生成で消える。
- `node --test <フォルダ>/` は Node 24 ではフォルダを受け付けない。`node --test subduo/*.test.mjs` のようにファイルで指定する。
- FormPilot は生成後に `node --test formpilot/site.test.js formpilot/media.test.js` と `node formpilot/verify-site.js` を通す。後者は20言語×5ページ（LP・ガイド・プライバシー・問い合わせ・アンケート）のPC・390px画面、キーボード、言語移動、画像、動画の再生・シーク・字幕、フォーム送信が発生しないことを一時Chromeで確認する。
- 動画生成にはFFmpeg・FFprobeを使う。実行ファイルは `FFMPEG_PATH` / `FFPROBE_PATH`、または `FORMPILOT_MEDIA_TOOLS` 配下の `ffmpeg-static` / `ffprobe-static` を使用し、生成フレームはOSの一時フォルダーに置く。実録版と自作音の書き出しは `%LOCALAPPDATA%/FormPilot/media-tools`（`npm install ffmpeg-static ffprobe-static`）を既定とする。
  - 注意: OSの一時フォルダーは作業中でも中身が消されることがある（道具・録画・puppeteerのChromeが消えた）。残したい録画や道具は一時フォルダーに置かない。
- 実操作録画は分離したChromeと拡張の実ソースを使い、AI分類も実サービスへ依頼する。認証・利用制限は拡張の運用仕様に従い、保存・復元には追加のAI呼出しがないことと、再読込前後の値の一致を照合する。
- FormPilot の機能文は拡張の `store/content.js`、操作名・説明は `i18n.js`、ストア画像は `store/images/` から取り込む。追加のWeb用翻訳だけをこのリポジトリで管理し、生成物もコミットする。
- 公開はmasterへのpush後、GitHub Pagesのビルド完了と本番の言語ページ・共有JS/CSS・代表画像を照合する。push成功だけでは公開完了にしない。
- 注意: 録画ページの描画を 4K にするとき、`deviceScaleFactor=2` では `page.screencast()` が CSS px のまま 1080p で撮れる。SubDuo は 3840x2160 ビューポート＋ `html{zoom:2}` で撮る。録画の実時間がずれるので、実測係数（wall-clock ÷ raw 実尺）で setpts して尺を合わせる。録画の基本手順はプロジェクトの CLAUDE.md。
- 実サイトの操作録画は、ヘッドレスChromeを `--force-device-scale-factor=2` で起動し、CDP の `Page.startScreencast`（JPEG品質95）で届くコマをそのまま保存する。編集で寄っても文字と映像がぼやけない。
  - 注意: 等倍で撮って拡大するとぼやける。`page.screencast()` は録画中に等倍へ戻してVP9で再圧縮し、ヘッドフルや `setViewport` の倍率指定だけでも1920幅のコマしか届かない。
- SubDuo の語句カードの意味は Chrome の端末内翻訳から出る。収録スクリプトは録画前に、その言語の翻訳モデル（約80MB、収録用プロファイル内）が使えるか確かめ、なければクリック操作でダウンロードさせて待つ。
  - 注意: 録画中にダウンロードが始まると間に合わず、カードは「この端末では翻訳できません」になり単語帳に意味と字幕が出ない。モデルとダウンロードキャッシュ（`component_crx_cache`）は不要になれば消してよい。
  - 注意: 再生時間を決め打ちして止めると、読み込みの速さ次第で字幕の合間に止まる。上下2段がそろうまで再生してから止め、そろわなければ開き直す。
- 注意: ストア画像のあふれ判定に scrollHeight を使わない（overflow:hidden でも装飾のはみ出しを含む）。装飾を除いて判定する。

## ストアへの反映（手動）
- SubDuoの説明本文は `node --test subduo/store-listing.test.mjs subduo/store-assets.test.mjs` で全20言語の存在・翻訳・動作要件を確認する。登録後は各言語を再選択し、本文全体の一致と画像・動画URLが保持されていることを読み戻す。
- SubDuoの動画は「Just One More Animal」で公開し、投稿直後のIDと素材ハッシュを保存して重複投稿を防ぐ。言語・字幕・子ども向けではない設定・埋め込み許可・通知なしとチェック完了を読み戻し、公開再生を確認したURLだけを採用台帳とストアに使う。
- FormPilot のYouTube動画は「Just One More Animal」チャンネルを照合し、動画の処理・チェック完了後に公開設定を保存する。認証は管理者が行い、外部からの再生・埋め込みを確認したURLだけを採用台帳とストアの言語別欄へ反映する。
- 元動画を翻訳した投稿の結果は `youtube-promo-localized.json` に保存し、既存の公開動画と合わせて `youtube-store-videos.json` に採用URLをまとめる。動画の言語と字幕エディタの言語が一致することを、保存後の画面で読み戻す。
- ログイン済みChromeへ `chrome-devtools-mcp` の `--autoConnect --channel stable` で接続できる場合は、YouTube Studioから動画・言語別タイトルと説明・タイムコード付き字幕を登録する。Chromeの接続許可は管理者が行い、追加のAPI認証は不要。
- FormPilot は投稿直後の動画IDと素材のSHA-256を保存し、再開時に重複投稿しない。動画の言語・子ども向けではない設定・埋め込み許可を照合し、登録者への通知を無効にする。
- Kura は `node --test kura/store-assets.test.mjs` と `python kura/publish-store.py` で検証し、`--publish` で Play に反映、`--verify` で読み戻して照合する。詳しくは `kura/images/store/UPLOAD.md`。
- Chrome ウェブストアの掲載情報（説明・プロモ動画 URL）・Play Console の掲載情報・YouTube Studio の動画のタイトルと説明は、サインイン済みの Chrome プロファイル `C:\Users\Warlo\cws-profile` から貼る（`--remote-debugging-port` 付きで起動すれば puppeteer-core で自動化できる）。審査中のストア掲載情報は保存できない（⋮ → 審査をキャンセル → 保存 → 再提出）。
- 注意: 自動化でウィンドウが隠れていると要素のクリック（scrollIntoView）が終わらない。クリックは DOM の `click()` で行う。YouTube Studio のタイトル欄は Ctrl+A で全選択されず、旧タイトルの前に追記されたまま保存されたことがある。Range で全選択して消し、空になったのを確かめてから入力する。

## 新しいプロダクトを足すとき
1. `<product>/` に LP・プライバシーポリシーを作る（構成は product.md）。
2. ポータル `index.html` のカードと `ItemList` JSON-LD に足す。
3. `sitemap.xml` に LP とプライバシーポリシーを足し、録画・画像生成ページは `robots.txt` で Disallow。
4. 問い合わせを置くなら `contact-api` の許可プロダクトに足してデプロイする。

## 復旧
- フォームが 400 `Invalid product` を返す: `contact-api` の許可リストにプロダクト名を足して Worker をデプロイする。
- 問い合わせメールが届かない: Cloudflare Email Routing と Worker のログを見る。
- 検索に言語別ページが出ない: Search Console で `sitemap.xml` を再送信し、hreflang のエラーを確認する。
