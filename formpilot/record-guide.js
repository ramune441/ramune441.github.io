// Record guide-demo.html (context-menu how-to animation) into
// guide-demo-{lang}.webm for each language.
//
//   node record-guide.js                 -> all 11 languages
//   node record-guide.js ja en           -> selected languages
//   node record-guide.js --probe ja      -> still frames at key moments (_probe/)
//
// Same virtual-clock pipeline as record.js (promo video).
const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG = require('ffmpeg-static');
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const FRAME_MS = 1000 / FPS;
const DURATION_SEC = 23;
const ALL_LANGS = ['en', 'ja', 'zh', 'ko', 'es', 'fr', 'de', 'pt', 'hi', 'id', 'ar'];
const PROBE_TIMES = [2.2, 4.5, 6.3, 8.0, 9.8, 12.0, 15.5, 18.2, 20.7, 22.5];

const args = process.argv.slice(2);
const probeMode = args.includes('--probe');
const langs = args.filter(a => ALL_LANGS.includes(a));
const targets = langs.length ? langs : ALL_LANGS;

function installVirtualClock(page) {
  return page.evaluateOnNewDocument(() => {
    let virtualNow = Date.now();
    const timers = [];
    let nextId = 1;

    Date.now = () => virtualNow;
    const perfStart = virtualNow;
    performance.now = () => virtualNow - perfStart;

    window.setTimeout = (fn, delay = 0, ...args) => {
      if (typeof fn !== 'function') return 0;
      const id = nextId++;
      timers.push({ id, fn, fireAt: virtualNow + delay, args, type: 'timeout' });
      return id;
    };
    window.clearTimeout = (id) => {
      const idx = timers.findIndex(t => t.id === id);
      if (idx !== -1) timers.splice(idx, 1);
    };
    window.setInterval = (fn, delay, ...args) => {
      if (typeof fn !== 'function') return 0;
      const id = nextId++;
      function schedule() {
        timers.push({ id, fn: () => { fn(...args); schedule(); }, fireAt: virtualNow + delay, args: [], type: 'interval' });
      }
      schedule();
      return id;
    };
    window.clearInterval = window.clearTimeout;

    window.__tickVirtualClock = (ms) => {
      const target = virtualNow + ms;
      while (true) {
        let earliest = null;
        let earliestIdx = -1;
        for (let i = 0; i < timers.length; i++) {
          if (timers[i].fireAt <= target) {
            if (!earliest || timers[i].fireAt < earliest.fireAt) {
              earliest = timers[i];
              earliestIdx = i;
            }
          }
        }
        if (!earliest) break;
        virtualNow = earliest.fireAt;
        timers.splice(earliestIdx, 1);
        try { earliest.fn(); } catch (e) { console.error(e); }
      }
      virtualNow = target;

      try {
        const animations = document.getAnimations();
        for (const anim of animations) {
          if (anim.playState === 'running' || anim.playState === 'paused') {
            anim.pause();
            anim.currentTime = (anim.currentTime || 0) + ms;
          }
        }
      } catch (e) {}
    };
  });
}

async function loadDemo(browser, lang) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  await installVirtualClock(page);
  const fileUrl = 'file:///' + path.resolve(__dirname, 'guide-demo.html').replace(/\\/g, '/') + '?lang=' + lang;
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { if (typeof start === 'function') start(); });
  return page;
}

function launchBrowser() {
  return puppeteer.launch({
    headless: 'shell',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: [`--window-size=${WIDTH},${HEIGHT}`, '--disable-frame-rate-limit', '--run-all-compositor-stages-before-draw'],
    protocolTimeout: 120000,
  });
}

async function shot(page) {
  try {
    return await page.screenshot({ type: 'png', encoding: 'binary' });
  } catch (e) {
    // transient CDP hiccup — retry once
    await new Promise(r => global.setTimeout(r, 500));
    return await page.screenshot({ type: 'png', encoding: 'binary' });
  }
}

(async () => {
  if (probeMode) {
    const browser = await launchBrowser();
    const probeDir = path.join(__dirname, '_probe');
    if (!fs.existsSync(probeDir)) fs.mkdirSync(probeDir);
    for (const lang of targets) {
      console.log(`Probing ${lang}...`);
      const page = await loadDemo(browser, lang);
      let elapsed = 0;
      for (const t of PROBE_TIMES) {
        const targetMs = t * 1000;
        while (elapsed < targetMs) {
          const step = Math.min(FRAME_MS, targetMs - elapsed);
          await page.evaluate((ms) => window.__tickVirtualClock(ms), step);
          elapsed += step;
        }
        await page.evaluate(() => document.body.offsetHeight);
        const buf = await shot(page);
        fs.writeFileSync(path.join(probeDir, `${lang}-${String(t).replace('.', '_')}s.png`), buf);
      }
      await page.close();
    }
    await browser.close();
    console.log('Probe frames written to _probe/');
    return;
  }

  for (const lang of targets) {
    const output = path.join(__dirname, `guide-demo-${lang}.webm`);
    if (fs.existsSync(output)) {
      console.log(`Skipping ${lang} (${path.basename(output)} already exists)`);
      continue;
    }

    const framesDir = path.join(__dirname, '_frames_guide');
    if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true });
    fs.mkdirSync(framesDir);

    console.log(`\n=== Recording ${lang} ===`);
    // Fresh browser per language: one crashed renderer must not kill the batch
    const browser = await launchBrowser();
    const page = await loadDemo(browser, lang);

    const totalFrames = FPS * DURATION_SEC;
    for (let i = 0; i < totalFrames; i++) {
      await page.evaluate((ms) => window.__tickVirtualClock(ms), FRAME_MS);
      await page.evaluate(() => document.body.offsetHeight);
      const framePath = path.join(framesDir, `frame_${String(i).padStart(5, '0')}.png`);
      const buf = await shot(page);
      fs.writeFileSync(framePath, buf);
      if (i % (FPS * 5) === 0) console.log(`  ${Math.round(i / totalFrames * 100)}% (${i}/${totalFrames})`);
    }
    await browser.close();
    console.log('  100% - frames captured, encoding...');

    const cmd = [
      `"${FFMPEG}"`,
      '-y',
      `-framerate ${FPS}`,
      `-i "${path.join(framesDir, 'frame_%05d.png')}"`,
      '-c:v libvpx-vp9',
      '-b:v 1M',
      '-crf 34',
      '-pix_fmt yuv420p',
      `-s ${WIDTH}x${HEIGHT}`,
      `"${output}"`,
    ].join(' ');
    execSync(cmd, { stdio: 'inherit', timeout: 600000 });
    fs.rmSync(framesDir, { recursive: true, force: true });
    console.log(`  Done: ${output}`);
  }

  console.log('\nAll done.');
})();
