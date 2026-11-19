// Set each Kura store video's thumbnail to images/promo/thumb-<lang>.jpg (render-store-images.mjs makes them).
// node kura/youtube-thumbnail.mjs [lang…] (all with a videoId by default). Play shows this picture first, above the screenshots;
// left alone, YouTube picks a frame from the film. Uses the signed-in cws-profile, switched to the channel in youtube.json.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url)).split(path.sep).join('/');
const puppeteer = createRequire(root + '/render-store-images.mjs')('puppeteer-core');
const meta = JSON.parse(fs.readFileSync(root + '/images/promo/youtube.json', 'utf8'));
const shots = process.env.SHOTS || '.';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const langs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(meta.items).filter(l => meta.items[l].videoId);
const CHANNEL_NAME = 'Just One More Animal';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  userDataDir: 'C:/Users/Warlo/cws-profile', args: ['--no-first-run'], protocolTimeout: 300000, defaultViewport: { width: 1600, height: 1000 } });
const clickAt = async (page, box) => { await page.mouse.click(box.x, box.y); await sleep(1500); };
try {
  const page = await browser.newPage();
  // Studio turns HeadlessChrome away as an unsupported browser.
  await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome', 'Chrome'));
  // The profile's Google account owns several channels; Studio only opens the videos of the active one.
  await page.goto('https://www.youtube.com/channel_switcher', { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(4000);
  const target = await page.evaluate(name => {
    const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === name);
    if (!el) return null;
    const t = el.closest('a, ytd-account-item-renderer, [role=link], tp-yt-paper-item') || el;
    t.scrollIntoView({ block: 'center' });
    const b = t.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }, CHANNEL_NAME);
  if (!target) throw new Error(`No channel named ${CHANNEL_NAME}`);
  await clickAt(page, target); await sleep(4000);
  for (const lang of langs) {
    const item = meta.items[lang];
    const file = `${root}/images/promo/thumb-${lang}.jpg`;
    if (!fs.existsSync(file)) throw new Error(`${lang}: no ${file}`);
    await page.goto(`https://studio.youtube.com/video/${item.videoId}/edit`, { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForSelector('ytcp-video-title #textbox', { timeout: 60000 });
    await sleep(2500);
    const title = await page.evaluate(() => document.querySelector('ytcp-video-title #textbox').innerText.trim());
    if (title !== item.title) throw new Error(`${lang}: opened "${title}", expected "${item.title}"`);
    const input = await page.$('ytcp-thumbnail-uploader input[type=file]') || await page.$('input[type=file]');
    await input.uploadFile(file);
    // The upload shows as the selected thumbnail, then Save turns on.
    let ready = false;
    for (let i = 0; i < 60 && !ready; i++) {
      await sleep(1000);
      ready = await page.evaluate(() => { const b = document.querySelector('ytcp-button#save'); return b && !b.hasAttribute('disabled') && b.getAttribute('aria-disabled') !== 'true'; });
    }
    if (!ready) { await page.screenshot({ path: `${shots}/thumb-${lang}.png` }); throw new Error(`${lang}: Save never enabled`); }
    const save = await page.evaluate(() => { const b = document.querySelector('ytcp-button#save').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await clickAt(page, save);
    // Saved: the button goes back to disabled with nothing left to save.
    let saved = false;
    for (let i = 0; i < 40 && !saved; i++) {
      await sleep(1000);
      saved = await page.evaluate(() => { const b = document.querySelector('ytcp-button#save'); return b && (b.hasAttribute('disabled') || b.getAttribute('aria-disabled') === 'true'); });
    }
    if (!saved) { await page.screenshot({ path: `${shots}/thumb-${lang}.png` }); throw new Error(`${lang}: not saved`); }
    console.log(`${lang}: thumbnail set on ${item.videoId}`);
  }
} finally { await browser.close(); }
