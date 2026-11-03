// SendReady のストア画像を store-images.html から書き出す。
//   node sendready-chrome/render-store-images.mjs [lang…]   （指定なしで全言語）
// 出力: en は images/、他は images/<lang>/ に store-image-{1..5}.png（1280x800）と
// store-image-feature.png（1400x560）。小タイル store-tile-small.png（440x280）は en だけ。
// puppeteer-core とローカルの Chrome（CHROME_PATH で指定可）が要る。
import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = dirname(fileURLToPath(import.meta.url));
export const LOCALES = [
  "en", "ja", "zh", "zh-TW", "ko", "es", "fr", "de", "it", "nl", "pl", "pt",
  "ru", "tr", "vi", "th", "hi", "bn", "id", "ar",
];
const SHOTS = [
  ...[1, 2, 3, 4, 5].map((i) => ({ id: `img${i}`, file: `store-image-${i}.png`, width: 1280, height: 800 })),
  { id: "feature", file: "store-image-feature.png", width: 1400, height: 560 },
];
const TILE = { id: "tile", file: "store-tile-small.png", width: 440, height: 280 };
const outDir = (lang) => join(ROOT, "images", lang === "en" ? "" : lang);

const selected = process.argv.slice(2);
const locales = selected.length ? selected : LOCALES;
assert.ok(locales.every((l) => LOCALES.includes(l)), "未対応の言語");
const executablePath = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find(existsSync);
assert.ok(executablePath, "Chrome の場所を CHROME_PATH で指定してください");

const browser = await puppeteer.launch({
  headless: true, executablePath, defaultViewport: { width: 1600, height: 1100, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  for (const lang of locales) {
    const url = pathToFileURL(join(ROOT, "store-images.html"));
    url.searchParams.set("lang", lang);
    await page.goto(url.href, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.__storeReady === true);
    const state = await page.evaluate(() => ({
      badFonts: [...document.fonts].filter((f) => f.status === "error").map((f) => f.family),
      // 文字の要素がキャンバスの外へ出ていないか。キャンバスの scrollHeight は装飾のはみ出しも
      // 含むので使わず、文字の要素の矩形で見る。ボタンは文字が横にあふれていないか。
      overflow: [...document.querySelectorAll(".si, .feat-banner")].flatMap((c) => {
        const r = c.getBoundingClientRect();
        const texts = [...c.querySelectorAll("h1, p, .fb-title, .fb-sub, .fb-pill, [data-i]")].filter((t) => {
          const b = t.getBoundingClientRect();
          return b.width && (b.left < r.left - 1 || b.right > r.right + 1 || b.top < r.top - 1 || b.bottom > r.bottom + 1);
        });
        const btns = [...c.querySelectorAll(".p-btn, .p-go")].filter((b) => b.scrollWidth > b.clientWidth + 1);
        return [...texts, ...btns].map((t) => `${c.id}:${t.dataset.i || t.className || t.tagName}`);
      }),
      pill: document.querySelector('[data-i="fbp4"]').textContent,
    }));
    assert.deepEqual(state.badFonts, [], `${lang}: 読み込めないフォント`);
    assert.deepEqual(state.overflow, [], `${lang}: キャンバスからあふれている`);
    assert.ok(/20|২০/.test(state.pill), `${lang}: 言語数が 20 でない（${state.pill}）`);
    mkdirSync(outDir(lang), { recursive: true });
    for (const shot of [...SHOTS, ...(lang === "en" ? [TILE] : [])]) {
      const el = await page.$(`#${shot.id}`);
      const box = await el.boundingBox();
      assert.equal(box.width, shot.width, `${lang} ${shot.id} の幅`);
      assert.equal(box.height, shot.height, `${lang} ${shot.id} の高さ`);
      await el.screenshot({ path: join(outDir(lang), shot.file) });
    }
    console.log(`${lang}: OK`);
  }
  assert.deepEqual(errors, [], "ページ内エラー");
} finally {
  await browser.close();
}
