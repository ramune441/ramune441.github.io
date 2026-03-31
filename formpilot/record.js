const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG = require('ffmpeg-static');
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const FRAME_MS = 1000 / FPS;
const DURATION_SEC = 32;
const FRAMES_DIR = path.join(__dirname, '_frames');
const OUTPUT = path.join(__dirname, 'promo.webm');

(async () => {
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'shell',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: [`--window-size=${WIDTH},${HEIGHT}`, '--disable-frame-rate-limit', '--run-all-compositor-stages-before-draw'],
    protocolTimeout: 120000,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  // Install virtual clock that controls JS timers + CSS animations
  await page.evaluateOnNewDocument(() => {
    let virtualNow = Date.now();
    const timers = [];
    let nextId = 1;

    Date.now = () => virtualNow;
    const perfStart = virtualNow;
    performance.now = () => virtualNow - perfStart;

    const _origSetTimeout = window.setTimeout;
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

    // Track virtual elapsed time for CSS animation seeking
    let totalElapsed = 0;

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
        try { earliest.fn(); } catch(e) { console.error(e); }
      }
      virtualNow = target;
      totalElapsed += ms;

      // Seek all running CSS transitions/animations to match virtual time
      try {
        const animations = document.getAnimations();
        for (const anim of animations) {
          if (anim.playState === 'running' || anim.playState === 'paused') {
            // Pause the animation so it doesn't auto-advance with real time
            anim.pause();
            // Set current time to advance by our tick
            anim.currentTime = (anim.currentTime || 0) + ms;
          }
        }
      } catch(e) {}
    };
  });

  const fileUrl = 'file:///' + path.resolve(__dirname, 'promo.html').replace(/\\/g, '/');
  console.log('Loading:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);

  // Restart animation under virtual clock control
  await page.evaluate(() => {
    if (typeof start === 'function') start();
  });

  const totalFrames = FPS * DURATION_SEC;
  console.log(`Capturing ${totalFrames} frames at ${FPS}fps...`);

  for (let i = 0; i < totalFrames; i++) {
    await page.evaluate((ms) => window.__tickVirtualClock(ms), FRAME_MS);

    // Force layout/paint
    await page.evaluate(() => document.body.offsetHeight);

    const framePath = path.join(FRAMES_DIR, `frame_${String(i).padStart(5, '0')}.png`);
    const buf = await page.screenshot({ type: 'png', encoding: 'binary' });
    fs.writeFileSync(framePath, buf);

    if (i % (FPS * 5) === 0) {
      console.log(`  ${Math.round(i / totalFrames * 100)}% (${i}/${totalFrames})`);
    }
  }
  console.log('  100% - All frames captured');

  await browser.close();

  console.log('Encoding WebM with ffmpeg...');
  const cmd = [
    `"${FFMPEG}"`,
    '-y',
    `-framerate ${FPS}`,
    `-i "${path.join(FRAMES_DIR, 'frame_%05d.png')}"`,
    '-c:v libvpx-vp9',
    '-b:v 2M',
    '-crf 30',
    '-pix_fmt yuv420p',
    `-s ${WIDTH}x${HEIGHT}`,
    `"${OUTPUT}"`,
  ].join(' ');

  console.log('Running:', cmd);
  execSync(cmd, { stdio: 'inherit', timeout: 300000 });

  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  console.log(`\nDone! Video saved to: ${OUTPUT}`);
})();
