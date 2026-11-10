// LP 用の軽い画像を作る: 拡張リポジトリの store-assets/<locale>/store-image-{1,2}.png → images/lp/<lang>/
//   store-image-1.jpg … og:image・JSON-LD の screenshot（1280x800。SNS カードは JPEG が確実）
//   store-image-2.webp … 日本語以外の LP のデモ画像（実画面＋その言語のパネル）
// 使い方: node ashiato-maker/build-lp-images.mjs [lang…]（repo 直下の puppeteer-core と Chrome。拡張のストア画像を作り直したら実行する）
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {LANGS, EXT_DIR} from './build-pages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv.slice(2);
const targets = LANGS.filter(l => !only.length || only.includes(l.code));
const FILES = [['store-image-1', 'image/jpeg', 0.85, 'jpg'], ['store-image-2', 'image/webp', 0.82, 'webp']];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
await page.goto('about:blank');
for (const lang of targets) {
  const dir = path.join(here, 'images/lp', lang.code);
  fs.mkdirSync(dir, {recursive: true});
  for (const [name, type, quality, ext] of FILES) {
    if (lang.code === 'ja' && name === 'store-image-2') continue; // 日本語 LP は Pairs の実画面＋パネル再現を使う
    const src = 'data:image/png;base64,' + fs.readFileSync(path.join(EXT_DIR, 'store-assets', lang.ext, name + '.png')).toString('base64');
    const b64 = await page.evaluate(async (src, type, quality) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      return c.toDataURL(type, quality).split(',')[1];
    }, src, type, quality);
    const out = path.join(dir, `${name}.${ext}`);
    fs.writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log(path.relative(here, out), Math.round(fs.statSync(out).size / 1024) + 'KB');
  }
}
await browser.close();
