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
| YouTube（チャンネル Just One More Animal） | プロモ動画の公開 | 手動サインイン | — |

## 生成スクリプト（文言や拡張の UI を変えたら実行して生成物ごとコミット）
| 対象 | 実行 | 生成物 |
|---|---|---|
| SendReady LP の言語別ページ | `cd sendready-chrome && node build-lang-pages.mjs`（Node だけで動く） | `sendready-chrome/<lang>/index.html`、ルート `index.html` の SEO ブロック、`sitemap.xml` の SendReady LP 部分 |
| FormPilot 使い方ガイド | `cd formpilot && node guide-shots.js && node record-guide.js`（puppeteer-core・ffmpeg-static が必要。録画は約 30 分） | `guide-ui.js`・`guide-shots/<lang>/`・`guide-demo-<lang>.mp4` |
| SubDuo ストア画像・動画 | `node record-store.mjs [lang…]` / `record-promo.mjs` | `subduo/images/`・`promo[-lang].webm` |
| Kura ストア画像 | `record-store-i18n.mjs`（文言は Kura リポジトリから `store-images-strings.mjs` で取り込む） | `kura/images/store/<lang>/` |
- SendReady LP の文言は `sendready-chrome/i18n-lp.js` を直してから生成する。生成ページを手で直すと次の生成で消える。
- 注意: 録画ページの描画を 4K にするとき、`deviceScaleFactor=2` では `page.screencast()` が CSS px のまま 1080p で撮れる。SubDuo は 3840x2160 ビューポート＋ `html{zoom:2}` で撮る。録画の実時間がずれるので、実測係数（wall-clock ÷ raw 実尺）で setpts して尺を合わせる。録画の基本手順はプロジェクトの CLAUDE.md。
- 注意: ストア画像のあふれ判定に scrollHeight を使わない（overflow:hidden でも装飾のはみ出しを含む）。装飾を除いて判定する。

## ストアへの反映（手動）
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
