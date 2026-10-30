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
| SendReady LP の言語別ページ | `cd sendready-chrome && node build-lang-pages.mjs`（Node だけで動く） | `sendready-chrome/<lang>/index.html`、ルート `index.html` の SEO ブロック、`sitemap.xml` の SendReady LP 部分 |
| FormPilot の公開資料 | `node formpilot/guide-shots.js` → `node formpilot/build-site.js`（puppeteer-core と Chrome、同階層の FormPilot 拡張ソースが必要。別配置は `FORMPILOT_EXT`） | 20言語の実画面・LP・ガイド・プライバシー説明、共通問い合わせ翻訳、サイトマップ |
| FormPilot の動画 | 上記の画像生成後に `node formpilot/build-videos.js` → `node formpilot/build-site.js` | 20言語各2本のMP4・WebVTT・ポスター、再生ページと動画の検証情報 |
| SubDuo ストア画像 | `node subduo/render-store-images.mjs [lang…]` → `node --test subduo/store-assets.test.mjs`（puppeteer-core・Chromeが必要。ブラウザは `CHROME_PATH` で指定可能） | `subduo/images/` と寸法・SHA-256を記録した `subduo/store-assets.json`。指定なしで全言語、指定ありで対象言語を再生成 |
| SubDuo の追加言語動画 | `node subduo/build-promo-localized.mjs [lang…]` → `node --test subduo/promo-localized.test.mjs`（FFmpeg・FFprobe・Chrome・puppeteer-coreが必要） | 39.5秒・4K/30fpsのMP4とWebVTT。既存英語版のAAC BGMを再利用し、公開済みIDがある素材は再生成しない |
| Kura ストア画像 | `node kura/store-images-strings.mjs` → `node kura/render-store-images.mjs`（puppeteer-core と Chrome が必要） | `kura/images/store/<lang>/` |
- SendReady LP の文言は `sendready-chrome/i18n-lp.js` を直してから生成する。生成ページを手で直すと次の生成で消える。
- FormPilot は生成後に `node --test formpilot/site.test.js formpilot/media.test.js` と `node formpilot/verify-site.js` を通す。後者は20言語のPC・390px画面、キーボード、言語移動、画像、動画の再生・シーク・字幕、フォーム送信が発生しないことを一時Chromeで確認する。
- 動画生成にはFFmpeg・FFprobeを使う。実行ファイルは `FFMPEG_PATH` / `FFPROBE_PATH`、または `FORMPILOT_MEDIA_TOOLS` 配下の `ffmpeg-static` / `ffprobe-static` を使用し、生成フレームはOSの一時フォルダーに置く。
- FormPilot の機能文は拡張の `store/content.js`、操作名・説明は `i18n.js`、ストア画像は `store/images/` から取り込む。追加のWeb用翻訳だけをこのリポジトリで管理し、生成物もコミットする。
- 公開はmasterへのpush後、GitHub Pagesのビルド完了と本番の言語ページ・共有JS/CSS・代表画像を照合する。push成功だけでは公開完了にしない。
- 注意: 録画ページの描画を 4K にするとき、`deviceScaleFactor=2` では `page.screencast()` が CSS px のまま 1080p で撮れる。SubDuo は 3840x2160 ビューポート＋ `html{zoom:2}` で撮る。録画の実時間がずれるので、実測係数（wall-clock ÷ raw 実尺）で setpts して尺を合わせる。録画の基本手順はプロジェクトの CLAUDE.md。
- 注意: ストア画像のあふれ判定に scrollHeight を使わない（overflow:hidden でも装飾のはみ出しを含む）。装飾を除いて判定する。

## ストアへの反映（手動）
- SubDuoの動画は「Just One More Animal」で公開し、投稿直後のIDと素材ハッシュを保存して重複投稿を防ぐ。言語・字幕・子ども向けではない設定・埋め込み許可・通知なしとチェック完了を読み戻し、公開再生を確認したURLだけを採用台帳とストアに使う。
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
