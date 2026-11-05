// Make the promos a language has moved on from private, once Play shows the new ones. Marks each in items.retiredDone of youtube.json.
// node kura/youtube-retire.mjs [lang…] (all by default). Screenshots failures.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url)).split(path.sep).join('/');
const puppeteer = createRequire(root + '/render-store-images.mjs')('puppeteer-core');
const metaFile = root + '/images/promo/youtube.json';
const shots = process.env.SHOTS || '.';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const all = JSON.parse(fs.readFileSync(metaFile, 'utf8')).items;
const langs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(all);

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  userDataDir: 'C:/Users/Warlo/cws-profile', args: ['--no-first-run'], protocolTimeout: 300000, defaultViewport: { width: 1600, height: 1000 } });
try {
  for (const lang of langs) {
    const item = all[lang];
    for (const id of (item.retired || []).filter(id => !(item.retiredDone || []).includes(id))) {
      const page = await browser.newPage();
      await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome', 'Chrome'));
      try {
        await page.goto(`https://studio.youtube.com/video/${id}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
        await page.waitForSelector('ytcp-video-metadata-visibility', { timeout: 60000 });
        await sleep(2500);
        // Polymer's controls answer real clicks only.
        const clickVisible = async sel => {
          const box = await page.evaluate(sel => { const e = [...document.querySelectorAll(sel)].find(e => e.offsetParent); if (!e) return null;
            const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, sel);
          if (!box) throw new Error(`${lang}: nothing visible at ${sel}`);
          await page.mouse.click(box.x, box.y); await sleep(1500);
        };
        await clickVisible('ytcp-video-metadata-visibility');
        await clickVisible('tp-yt-paper-radio-button[name="PRIVATE"]');
        await clickVisible('#save-button');
        await clickVisible('ytcp-button#save');
        await sleep(4000);
        const shown = await page.evaluate(() => document.querySelector('ytcp-video-metadata-visibility').innerText.replace(/\s+/g, ' '));
        if (!/非公開|Private/.test(shown)) throw new Error(`${lang}: ${id} still ${shown}`);
        const latest = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        (latest.items[lang].retiredDone ||= []).push(id);
        fs.writeFileSync(metaFile, JSON.stringify(latest, null, 2));
        console.log(`${lang}: ${id} private`);
      } catch (e) {
        await page.screenshot({ path: `${shots}/retire-${lang}.png` });
        throw e;
      } finally { await page.close(); }
    }
  }
} finally { await browser.close(); }
