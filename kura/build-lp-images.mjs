// LP 用の軽い画像を作る: images/store/<lang>/ の PNG → images/lp/<lang>/ の WebP。
// 電話の画面は表示幅 330px の 2 倍（660px）、フィーチャー画像は 1024px のまま。
// 使い方: node kura/build-lp-images.mjs [lang…]（puppeteer-core と Chrome。ストア画像を作り直したら実行する。指定なしで全 20 言語）
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {LANGS as LP_LANGS} from './build-lp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv.slice(2);
const LANGS = LP_LANGS.map(l => l.code).filter(c => !only.length || only.includes(c));
const FILES = {'store-image-feature': 1024, 'store-image-2': 660, 'store-image-3': 660, 'store-image-4': 660,
  'store-image-5': 660, 'store-image-6': 660, 'store-image-7': 660};
const QUALITY = 0.82;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.goto('about:blank');
for (const lang of LANGS) {
  const dir = path.join(here, 'images/lp', lang);
  fs.mkdirSync(dir, {recursive: true});
  for (const [name, width] of Object.entries(FILES)) {
    const src = 'data:image/png;base64,' + fs.readFileSync(path.join(here, 'images/store', lang, name + '.png')).toString('base64');
    const webp = await page.evaluate(async (src, width, quality) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = Math.round(img.naturalHeight * width / img.naturalWidth);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', quality);
    }, src, width, QUALITY);
    if (!webp.startsWith('data:image/webp')) throw new Error(`${lang}/${name}: WebP を書けない`);
    const out = path.join(dir, name + '.webp');
    fs.writeFileSync(out, Buffer.from(webp.split(',')[1], 'base64'));
    console.log(path.relative(here, out), Math.round(fs.statSync(out).size / 1024) + 'KB');
  }
}
// Web 版の絵のサムネイル（images/photos の写真を中央で正方形に切って 240px）
const PHOTOS = ['p10', 'p28', 'p110', 'p164', 'p200', 'p237', 'p287', 'p323', 'p369', 'p433', 'p509', 'p558'];
fs.mkdirSync(path.join(here, 'images/lp/photos'), {recursive: true});
for (const name of PHOTOS) {
  const src = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(here, 'images/photos', name + '.jpg')).toString('base64');
  const webp = await page.evaluate(async (src, quality) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 240, 240);
    return canvas.toDataURL('image/webp', quality);
  }, src, QUALITY);
  const out = path.join(here, 'images/lp/photos', name + '.webp');
  fs.writeFileSync(out, Buffer.from(webp.split(',')[1], 'base64'));
  console.log(path.relative(here, out), Math.round(fs.statSync(out).size / 1024) + 'KB');
}
await browser.close();
