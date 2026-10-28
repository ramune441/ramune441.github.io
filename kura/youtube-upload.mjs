// Upload Kura promo videos to YouTube Studio (Just One More Animal) as private, from the signed-in cws-profile, headless.
// node kura/youtube-upload.mjs <lang…>. Writes videoId/watchUrl into kura/images/promo/youtube.json; then youtube-publish.mjs.
// REC_LOG=<record-promo log> makes it wait for each language's recording to finish; without it the file must already exist.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url)).split(path.sep).join('/');
const puppeteer = createRequire(root + '/render-store-images.mjs')('puppeteer-core');
const metaFile = root + '/images/promo/youtube.json';
const recLog = process.env.REC_LOG;
const CHANNEL = 'UCrjA6ffzb5pUw2URh0BcdRQ';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  userDataDir: 'C:/Users/Warlo/cws-profile', args: ['--no-first-run'], protocolTimeout: 600000, defaultViewport: { width: 1600, height: 1000 } });
try {
  for (const lang of process.argv.slice(2)) {
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    const item = meta.items[lang];
    if (item.videoId) { console.log(`${lang}: already ${item.videoId}`); continue; }
    // The recorder writes the file as it goes; wait for its "done" line.
    while (recLog ? !fs.readFileSync(recLog, 'utf8').includes(`${lang}: C:`) : !fs.existsSync(`${root}/images/promo/${item.file}`)) await sleep(10000);
    const page = await browser.newPage();
    // Studio turns HeadlessChrome away as an unsupported browser.
    await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome', 'Chrome'));
    await page.goto(`https://studio.youtube.com/channel/${CHANNEL}/videos/upload?d=ud`, { waitUntil: 'networkidle2', timeout: 90000 });
    const input = await page.waitForSelector('ytcp-uploads-file-picker input[type=file], input[type=file]', { timeout: 60000 });
    await input.uploadFile(`${root}/images/promo/${item.file}`);
    const result = await page.evaluate(async meta => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const q = s => document.querySelector('ytcp-uploads-dialog ' + s);
      for (let i = 0; i < 120 && !q('ytcp-video-title #textbox'); i++) await wait(500);
      await wait(2000);
      const put = (box, text) => { box.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, text); box.dispatchEvent(new Event('input', { bubbles: true })); };
      put(q('ytcp-video-title #textbox'), meta.title); await wait(500);
      put(q('ytcp-video-description #textbox'), meta.description); await wait(800);
      const title = q('ytcp-video-title #textbox').innerText, desc = q('ytcp-video-description #textbox').innerText.trim();
      q('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').click(); await wait(600);
      for (let i = 0; i < 3; i++) { q('#next-button').click(); await wait(1500); }
      q('tp-yt-paper-radio-button[name="PRIVATE"]').click(); await wait(600);
      let progress = '';
      for (let i = 0; i < 600; i++) { progress = q('.progress-label')?.innerText || ''; if (progress && !/アップロード中|Uploading/.test(progress)) break; await wait(1000); }
      const link = [...document.querySelectorAll('ytcp-uploads-dialog a')].map(a => a.href).find(h => /youtu\.be\//.test(h));
      q('#done-button').click();
      for (let i = 0; i < 20; i++) {
        await wait(700);
        const d = [...document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog')].find(x => x.offsetParent && /閉じる|Close/.test(x.innerText) && !x.closest('ytcp-uploads-dialog'));
        const b = d && [...d.querySelectorAll('ytcp-button, button')].find(b => /^(閉じる|Close)$/.test(b.innerText.trim()));
        if (b) { b.click(); break; }
      }
      return { title, descOk: desc === meta.description, link, progress };
    }, { title: item.title, description: item.description });
    const id = result.link?.split('/').pop();
    if (!id || result.title !== item.title || !result.descOk) throw new Error(`${lang}: ${JSON.stringify(result)}`);
    const latest = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    Object.assign(latest.items[lang], { videoId: id, watchUrl: `https://www.youtube.com/watch?v=${id}` });
    fs.writeFileSync(metaFile, JSON.stringify(latest, null, 2));
    console.log(`${lang}: ${id} (${result.progress})`);
    await sleep(3000);
    await page.close();
  }
} finally { await browser.close(); }
