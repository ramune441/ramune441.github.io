// Make the uploaded Kura promos public once YouTube's checks are done, after reading back title and description.
// node kura/youtube-publish.mjs [lang…] (all with a videoId by default). Marks items.published in youtube.json; screenshots failures.
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
const langs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(all).filter(l => all[l].videoId && !all[l].published);

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  userDataDir: 'C:/Users/Warlo/cws-profile', args: ['--no-first-run'], protocolTimeout: 300000, defaultViewport: { width: 1600, height: 1000 } });
try {
  for (const lang of langs) {
    const item = all[lang];
    const page = await browser.newPage();
    await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome', 'Chrome'));
    try {
      await page.goto(`https://studio.youtube.com/video/${item.videoId}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
      await page.waitForSelector('ytcp-video-title #textbox', { timeout: 60000 });
      await sleep(2500);
      // A draft is published from its upload dialog: "Edit draft", then the visibility step.
      const r = await page.evaluate(async meta => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        const q = s => document.querySelector('ytcp-uploads-dialog ' + s);
        const edit = [...document.querySelectorAll('ytcp-button, button')].find(b => /ドラフトを編集|Edit draft/.test(b.innerText) && b.offsetParent);
        if (!edit) {
          // Saved as private: the visibility box on the details page, then Save.
          const title = document.querySelector('ytcp-video-title #textbox').innerText.trim();
          const descBox = document.querySelector('ytcp-video-description #textbox');
          let fixed = false;
          if (descBox.innerText.trim() !== meta.description) {
            descBox.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, meta.description);
            descBox.dispatchEvent(new Event('input', { bubbles: true })); fixed = true; await wait(800);
          }
          return { title, fixed, private: true };
        }
        edit.click();
        for (let i = 0; i < 60 && !q('ytcp-video-title #textbox'); i++) await wait(500);
        await wait(1500);
        const title = q('ytcp-video-title #textbox').innerText.trim();
        const descBox = q('ytcp-video-description #textbox');
        let fixed = false;
        if (descBox.innerText.trim() !== meta.description) {
          descBox.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, meta.description);
          descBox.dispatchEvent(new Event('input', { bubbles: true })); fixed = true; await wait(800);
        }
        for (let i = 0; i < 3; i++) { q('#next-button').click(); await wait(1500); }
        const checks = q('ytcp-uploads-checks')?.innerText || '';
        q('tp-yt-paper-radio-button[name="PUBLIC"]').click(); await wait(800);
        q('#done-button').click();
        for (let i = 0; i < 20; i++) {
          await wait(800);
          const warn = [...document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog')].find(d => d.offsetParent && /まだ確認中|still being checked/.test(d.innerText));
          if (warn) { [...warn.querySelectorAll('ytcp-button, button')].find(b => /戻る|Go back/.test(b.innerText))?.click(); await wait(800);
            q('tp-yt-paper-radio-button[name="PRIVATE"]')?.click(); await wait(500); q('#close-button')?.click(); return { title, pending: true, checks }; }
          const share = [...document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog')].find(d => d.offsetParent && !d.closest('ytcp-uploads-dialog') && /公開しました|published|動画を処理しています|閉じる/.test(d.innerText));
          if (share) { const t = share.innerText.slice(0, 120); [...share.querySelectorAll('ytcp-button, button')].find(b => /^(閉じる|Close)$/.test(b.innerText.trim()))?.click(); return { title, fixed, visibility: '公開', share: t }; }
        }
        return { title, error: 'no confirmation', checks };
      }, { description: item.description });
      // Saved as private: Polymer's controls answer real clicks only.
      if (r.private) {
        const clickVisible = async sel => {
          const box = await page.evaluate(sel => { const e = [...document.querySelectorAll(sel)].find(e => e.offsetParent); if (!e) return null;
            const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, sel);
          if (!box) throw new Error(`${lang}: nothing visible at ${sel}`);
          await page.mouse.click(box.x, box.y); await sleep(1500);
        };
        await clickVisible('ytcp-video-metadata-visibility');
        await clickVisible('tp-yt-paper-radio-button[name="PUBLIC"]');
        await clickVisible('#save-button');
        const warn = await page.evaluate(() => [...document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog')].some(d => d.offsetParent && /まだ確認中|still being checked/.test(d.innerText)));
        if (warn) { console.log(`${lang}: checks still running, later`); continue; }
        await clickVisible('ytcp-button#save');
        await sleep(4000);
        r.visibility = await page.evaluate(() => document.querySelector('ytcp-video-metadata-visibility').innerText.replace(/\s+/g, ' '));
        if (!/ 公開$/.test(r.visibility)) { await page.screenshot({ path: `${shots}/publish-${lang}.png` }); throw new Error(`${lang}: still ${r.visibility}`); }
      }
      if (r.title !== item.title) { await page.screenshot({ path: `${shots}/publish-${lang}.png` }); throw new Error(`${lang}: ${JSON.stringify(r)}`); }
      if (r.pending) { console.log(`${lang}: checks still running, later`); continue; }
      if (r.error) {
        await page.screenshot({ path: `${shots}/publish-${lang}.png` });
        throw new Error(`${lang}: ${JSON.stringify(r)}`);
      }
      const latest = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      latest.items[lang].published = true;
      fs.writeFileSync(metaFile, JSON.stringify(latest, null, 2));
      console.log(`${lang}: public${r.fixed ? ' (description fixed)' : ''}`);
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
