// node subduo/render-store-images.mjs [locale…]。既存のHTMLを同じ寸法で描き出す。
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = dirname(fileURLToPath(import.meta.url));
export const LOCALES = ['en', 'ja', 'zh', 'zh-TW', 'ko', 'es', 'fr', 'de', 'pt', 'hi', 'id', 'ar', 'vi', 'it', 'tr', 'pl', 'th', 'nl', 'ru', 'bn'];
export const SHOTS = [
  ...Array.from({ length: 5 }, (_, i) => ({ id: `img${i + 1}`, file: `store-image-${i + 1}.png`, width: 1280, height: 800 })),
  { id: 'marquee', file: 'store-image-marquee.png', width: 1400, height: 560 },
];
const tile = { id: 'tile', file: 'store-tile-small.png', width: 440, height: 280 };
const outDir = lang => join(ROOT, 'images', lang === 'en' ? '' : lang);
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');

async function main() {
  const selected = process.argv.slice(2);
  const locales = selected.length ? selected : LOCALES;
  assert.ok(locales.every(lang => LOCALES.includes(lang)), '未対応の言語');
  const executablePath = process.env.CHROME_PATH || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ].find(existsSync);
  assert.ok(executablePath, 'Chromeの場所をCHROME_PATHで指定してください');
  const browser = await puppeteer.launch({ headless: true, executablePath, defaultViewport: { width: 1600, height: 1100, deviceScaleFactor: 1 } });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const report = [];
  try {
    for (const lang of locales) {
      const url = pathToFileURL(join(ROOT, 'store-images.html'));
      url.searchParams.set('lang', lang);
      await page.goto(url.href, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__storeReady === true);
      // フォント取得に失敗したまま端末依存の代替フォントで画像を作らない。
      const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'error').map(f => f.family));
      assert.deepEqual(fonts, [], `${lang}: 読み込めないフォント`);
      const state = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        overflow: window.__overflow(),
        heading: document.querySelector('#img1 h1').textContent,
        count: document.querySelector('[data-i="p5"]').textContent,
        bottom: document.querySelector('#img1 .sd-b').textContent,
        pairBottoms: window.__store.pairs.map(p => p[1]),
        rtl: document.querySelector('.card').dir,
      }));
      assert.equal(state.lang, lang);
      if (state.overflow.length) {
        const probe = join(ROOT, '..', '_probe');
        mkdirSync(probe, { recursive: true });
        await (await page.$('#img3')).screenshot({ path: join(probe, `subduo-store-${lang}-layout.png`) });
      }
      assert.deepEqual(state.overflow, [], `${lang}: 見切れ・重なり`);
      assert.ok(/20|２０|২০/.test(state.count), `${lang}: 言語数`);
      assert.ok(state.pairBottoms.every(v => v === lang), `${lang}: 下段がUI言語でない`);
      if (lang === 'ar') assert.equal(state.rtl, 'rtl');
      mkdirSync(outDir(lang), { recursive: true });
      for (const shot of [...SHOTS, ...(lang === 'en' ? [tile] : [])]) {
        const element = await page.$(`#${shot.id}`);
        const box = await element.boundingBox();
        assert.equal(box.width, shot.width);
        assert.equal(box.height, shot.height);
        await element.screenshot({ path: join(outDir(lang), shot.file) });
      }
      report.push({ locale: lang, ...state });
      console.log(`${lang}: 6 images, fonts and layout OK`);
    }
    assert.deepEqual(errors, [], 'ページ内エラー');
    const reportDir = join(ROOT, '..', '_probe');
    mkdirSync(reportDir, { recursive: true });
    const reportPath = join(reportDir, 'subduo-store-render.json');
    const previous = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : [];
    const combined = new Map([...previous, ...report].map(r => [r.locale, r]));
    writeFileSync(reportPath, JSON.stringify(LOCALES.filter(l => combined.has(l)).map(l => combined.get(l)), null, 2) + '\n');
  } finally {
    await browser.close();
  }
  // 一部だけ再生成した場合も全画像の目録を作り直し、古いハッシュを残さない。
  if (!LOCALES.every(lang => SHOTS.every(s => existsSync(join(outDir(lang), s.file))))) {
    console.log('全言語の画像が揃うと目録を生成します。初回は言語指定なしで実行してください。');
    return;
  }
  const assets = { locales: LOCALES, images: {}, common: { file: `images/${tile.file}`, width: tile.width, height: tile.height, sha256: sha256(join(outDir('en'), tile.file)) } };
  for (const lang of LOCALES) assets.images[lang] = SHOTS.map(s => ({
    file: `images/${lang === 'en' ? '' : `${lang}/`}${s.file}`, width: s.width, height: s.height,
    sha256: sha256(join(outDir(lang), s.file)),
  }));
  writeFileSync(join(ROOT, 'store-assets.json'), JSON.stringify(assets, null, 2) + '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]))) await main();
