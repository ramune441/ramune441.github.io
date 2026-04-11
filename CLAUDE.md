# プロジェクト: ramune441.github.io

Chrome拡張機能のLP・プロモーション動画・ストア画像を管理するGitHub Pagesリポジトリ。

---

## ディレクトリ構成

```
ramune441.github.io/
├── index.html       # ルートポータル（全プロダクトの一覧）
├── robots.txt       # クローラー設定
├── sitemap.xml      # サイトマップ
├── formpilot/       # FormPilot（フォーム自動入力）
├── ashiato-maker/   # 足あとメーカー（マッチングアプリ自動訪問）
├── lovent/          # Lovent
└── sendready/       # SendReady
```

新しいプロダクトを追加したら、`sitemap.xml` と ルート `index.html` のカードを忘れず更新すること。

各プロダクトに含まれるファイル:
- `index.html` — LP
- `promo.html` — 動画用HTMLアニメーション（1920x1080固定）
- `promo.webm` — 録画済みWebM（Chrome Web Store用）
- `record.mjs` — 録画スクリプト（使い捨て。録画後に削除してよい）
- `privacy-policy.html` — プライバシーポリシー
- `icons/` — アイコン
- `store-image-*.png` — ストア画像

Chrome拡張機能の実装コードは別リポジトリ `C:\Users\Warlo\MyProduct\ChromeExtension\` にある。
promo.htmlのデモシーンを作る際は、そこからUI構造・CSSを参照する。

---

## プロモーション動画 (promo.html → promo.webm)

### promo.html の設計ルール

- **固定サイズ**: `1920x1080px`
- **シーン構造**: `.scene` を `position:absolute;inset:0` で重ね、`opacity` トランジションで切替
- **タイムライン**: `setTimeout` + CSS `transition` で制御
- **リスタート対応**: `start()` = `resetAll()` → `buildTimeline()` → `runTimeline()`

### シーン構成の定番

| # | シーン | 目安時間 |
|---|--------|---------|
| S1 | イントロ（ロゴ＋タグライン＋対応アプリ） | 3s |
| S2 | 課題提起（悩み＋比較カード） | 5-6s |
| S3 | 解決策（3ステップ） | 3-4s |
| S4 | デモ（実UIモック＋機能コールアウト） | 15-20s |
| S5 | 機能一覧（6グリッド） | 3-4s |
| S6 | CTA（インストール誘導） | 3-4s |

### デモシーン(S4)の作り方

1. **プロダクトのcontent.js等からフローティングパネルのHTML/CSSを読み取り、そのまま再現する**
2. 対象アプリ（Pairs等）の画面構造もモックで再現
3. 機能説明は `.callout` 要素で各フェーズごとに表示/非表示
4. 実際の動作を視覚的に再現（モーダル開閉、リロードフラッシュ、進捗更新、ハイライト等）

### デザイン原則

- **LPと同じカラースキーム**を使う
- テキストは**大きく**（動画は小さい画面で見られる）:
  - タイトル: 76-120px / サブタイトル: 36-60px / 本文: 22-30px
  - デモUI内: プロダクト実物の1.3-1.5倍に拡大
- コールアウト: 背景 `#1e1b4b`、タイトル 28px、説明 18px

### タイミング

- コールアウト1つ: 1.5-2秒
- モーダル開閉: 1.5-2秒
- 全体: 35-45秒

---

## promo.webm の録画

### 方式: `page.screencast()` （Puppeteer組み込み）

FormPilotで確立した方式。`headless: 'shell'` + `page.screencast()` でリアルタイム録画する。
CSSアニメーション・トランジションがブラウザと完全に同じ速度で記録される。

### 録画スクリプト テンプレート (record.mjs)

```javascript
import puppeteer from 'puppeteer';
import { resolve } from 'path';

const WIDTH = 1920, HEIGHT = 1080;
const DURATION = 47000; // タイムラインの t += 合計 + 最終シーンのアニメ時間 + 5秒マージン (ms)
const OUTPUT = resolve('promo.webm');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'shell',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: [`--window-size=${WIDTH},${HEIGHT}`, '--disable-gpu', '--no-sandbox'],
    defaultViewport: { width: WIDTH, height: HEIGHT },
  });
  const page = await browser.newPage();
  await page.goto(`file:///${resolve('promo.html').replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle0', timeout: 30000,
  });
  await page.waitForFunction(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1500));

  const recorder = await page.screencast({ path: OUTPUT, speed: 1 });
  await page.evaluate(() => start());

  const t0 = Date.now();
  while (Date.now() - t0 < DURATION) {
    process.stdout.write(`\r  ${((Date.now()-t0)/1000).toFixed(0)}s / ${DURATION/1000}s`);
    await new Promise(r => setTimeout(r, 1000));
  }

  await recorder.stop();
  await browser.close();
  console.log(`\n完了: ${OUTPUT}`);
}
main().catch(e => { console.error(e); process.exit(1); });
```

### 実行手順

```bash
cd <プロダクトディレクトリ>
npm init -y && npm install puppeteer
node record.mjs
# 完了後に掃除
rm -rf node_modules package.json package-lock.json record.mjs
```

### DURATION の決め方

promo.html 内 `buildTimeline()` の `t += ` を合計し、最後のシーンのアニメ完了時間を足して、さらに **5秒のマージン**を追加する。短いと最後が切れる。

### 出力仕様（Chrome Web Store準拠）

| 項目 | 値 |
|------|-----|
| コーデック | VP9 |
| ピクセル形式 | yuv420p |
| 解像度 | 1920x1080 |
| FPS | 30 |
| 長さ | 30-45秒 |
| サイズ | 1-3MB |

### やってはいけないこと

- **CDP Virtual Time** → `Page.captureScreenshot` がハングする
- **JSタイマーオーバーライド** → CSSアニメーション/トランジションと同期しずカクカクになる
- **CDP `Page.startScreencast`** → フレーム落ち・速度ズレが発生しやすい
- **`puppeteer-core`** → `page.screencast()` が使えない。フルバンドルの `puppeteer` を使う

---

## LP（ランディングページ）の作り方

### 共通構成

Hero → 対応アプリ → 課題提起 → 比較 → デモ画像 → メリット → 機能一覧 → 使い方 → 安全性 → 注意事項 → FAQ → CTA

### デザイン共通ルール

- ダークテーマ: 背景 `#0a0e1a`〜`#312e81`、テキスト `#e2e8f0`
- フォント: `Noto Sans JP`（Google Fonts）
- レスポンシブ: `clamp()` + `auto-fit`
- JSON-LD: `SoftwareApplication` + `FAQPage`
- OGP / Twitter Card メタタグ
- Google Analytics (gtag.js)
