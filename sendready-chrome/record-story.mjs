// Records the real SendReady extension for the story promo, one language at a time, on fictional local pages with six
// live AI requests: mail (polite rewrite applied, greeting snippet by trigger + Tab, "//p text" + Tab), chat (reply to a
// received message, copied, pasted and sent), news (summary of two paragraphs), social post (own instruction, then
// translation, both applied); then stills of the real popup (presets, history) for the feature cards.
// Every pointer move, click and the box of each clicked control is logged with its time; story.mjs retimes the
// recording and draws the pointer from that log. Frames go to %LOCALAPPDATA%/SendReady/story-capture/<lang>.
//   node sendready-chrome/record-story.mjs [lang…]   (a language with a finished recording is skipped; --force redoes it)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import copy from "./story-copy.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ext = path.resolve(process.env.SENDREADY_EXT || path.join(here, "../../SendReady-Chrome"));
export const captureRoot = process.env.SENDREADY_CAPTURE_DIR || path.join(process.env.LOCALAPPDATA || os.homedir(), "SendReady", "story-capture");
// The page is 1280x720 CSS px captured at 3x, so the 4K video can zoom in without blurring the extension's panel.
export const view = { width: 1280, height: 720, scale: 3 };
// Branded Chrome no longer loads unpacked extensions from the command line; Chrome for Testing does.
function chromePath() {
  if (process.env.SENDREADY_CHROME) return process.env.SENDREADY_CHROME;
  const root = path.join(os.homedir(), ".cache/puppeteer/chrome");
  const builds = fs.existsSync(root) ? fs.readdirSync(root).sort().reverse() : [];
  for (const b of builds) {
    const exe = path.join(root, b, "chrome-win64/chrome.exe");
    if (fs.existsSync(exe)) return exe;
  }
  throw Error("Chrome for Testing not found; set SENDREADY_CHROME");
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const fonts = { ja: "'Yu Gothic UI','Meiryo'", zh: "'Microsoft YaHei UI'", zh_TW: "'Microsoft JhengHei UI'", ko: "'Malgun Gothic'", hi: "'Nirmala UI'", bn: "'Nirmala UI'", th: "'Leelawadee UI'", vi: "'Segoe UI'" /* Yu Gothic, the stage's default, breaks Vietnamese tone marks */ };
const chromeLang = { zh: "zh-CN", zh_TW: "zh-TW", pt: "pt-BR" };

const base = (lang, title, body, css) => `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title>
<style>*{box-sizing:border-box;margin:0}html,body{height:100%}body{font:15px/1.6 ${fonts[lang] || "'Segoe UI'"},sans-serif;color:#1f2433;background:#f3f5fa;display:flex}
.side{width:210px;background:#fff;border-inline-end:1px solid #e3e7f0;padding:22px 16px}.side b{display:block;font-size:20px;margin-bottom:22px;color:#0b5ed6}.side div{padding:8px 12px;border-radius:8px;color:#5a6075}.side .on{background:#eaf3ff;color:#0b5ed6;font-weight:700}
main{flex:1;padding:24px 34px;display:flex;flex-direction:column;gap:16px;min-width:0}.btn{border:0;border-radius:8px;background:#0f77f2;color:#fff;font:700 15px inherit;font-family:inherit;padding:9px 22px;cursor:pointer}${css}</style></head><body>${body}</body></html>`;

export function mailPage(lang) {
  const m = copy[lang].mail;
  return base(lang, m.app, `<nav class="side"><b>✉ ${esc(m.app)}</b><div class="on">${esc(m.folder)}</div></nav><main>
<article class="card"><h1>${esc(m.subject)}</h1><div class="from"><span class="av">${esc([...m.from][0])}</span><div><strong>${esc(m.from)}</strong> <span>${esc(m.fromOrg)}</span></div><time>${esc(m.time)}</time></div>
<div class="body">${m.body.map((l) => `<p>${esc(l)}</p>`).join("")}</div></article>
<section class="card reply"><div class="re">${esc(m.replyTo)}</div><div id="compose" contenteditable="true" spellcheck="false">${esc(copy[lang].draft)}</div><div class="bar"><button class="btn" type="button">${esc(m.send)}</button></div></section></main>`,
    `.card{background:#fff;border:1px solid #e3e7f0;border-radius:14px;padding:20px 26px}h1{font-size:21px;margin-bottom:12px}.from{display:flex;align-items:center;gap:12px;color:#5a6075;margin-bottom:12px}.from time{margin-inline-start:auto}.av{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#ffe9b3;color:#8a6200;font-weight:700}.from strong{color:#1f2433}.body p{margin:2px 0}
.reply{display:flex;flex-direction:column;gap:10px;border-color:#bcd6fb;box-shadow:0 6px 20px #0f77f214}.re{color:#5a6075;font-size:14px}#compose{min-height:96px;padding:12px 14px;border:1px solid #d6dbe8;border-radius:10px;font-size:17px;outline:none;white-space:pre-wrap}#compose:focus{border-color:#0f77f2}.bar{display:flex;justify-content:flex-end}`);
}

export function chatPage(lang) {
  const c = copy[lang].chat;
  return base(lang, c.app, `<nav class="side"><b>💬 ${esc(c.app)}</b><div class="on"># ${esc(c.channel)}</div></nav><main>
<header># ${esc(c.channel)}</header><div id="log"><div class="msg"><span class="av">${esc([...c.who][0])}</span><div><div class="who"><strong>${esc(c.who)}</strong> <time>${esc(c.time)}</time></div><p id="received">${esc(c.message)}</p></div></div></div>
<form id="box" onsubmit="event.preventDefault()"><div id="input" contenteditable="true" spellcheck="false" data-placeholder="${esc(c.input)}"></div><button class="btn" id="send" type="submit">${esc(c.send)}</button></form>
<script>
document.getElementById('send').onclick=()=>{const i=document.getElementById('input'),t=i.innerText.trim();if(!t)return;
const d=document.createElement('div');d.className='msg mine';d.innerHTML='<span class="av">'+${JSON.stringify(esc([...c.me][0]))}+'</span><div><div class="who"><strong>'+${JSON.stringify(esc(c.me))}+'</strong> <time>16:05</time></div><p></p></div>';
d.querySelector('p').textContent=t;document.getElementById('log').appendChild(d);i.textContent='';};
</script></main>`,
    `header{font-size:20px;font-weight:700;padding-bottom:12px;border-bottom:1px solid #e3e7f0}#log{flex:1;display:flex;flex-direction:column;gap:18px;padding-top:8px}.msg{display:flex;gap:14px}.av{flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:10px;background:#d9f2e3;color:#1d7a46;font-weight:700}.mine .av{background:#dbe9ff;color:#0b5ed6}
.who{color:#5a6075;font-size:14px}.who strong{color:#1f2433;font-size:15px}#log p{font-size:18px;white-space:pre-wrap}#box{display:flex;gap:12px;align-items:flex-end;background:#fff;border:1px solid #d6dbe8;border-radius:12px;padding:10px 12px}#input{flex:1;min-height:30px;padding:4px 6px;font-size:17px;outline:none;white-space:pre-wrap}#input:empty::before{content:attr(data-placeholder);color:#9aa0b4}`);
}

export function articlePage(lang) {
  const a = copy[lang].article;
  return base(lang, a.app, `<nav class="side"><b>📰 ${esc(a.app)}</b><div class="on">${esc(a.section)}</div></nav><main><article class="paper">
<div class="kicker">${esc(a.section)}</div><h1>${esc(a.title)}</h1><div id="story">${a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div></article></main>`,
    `.paper{background:#fff;border:1px solid #e3e7f0;border-radius:14px;padding:28px 40px}.kicker{color:#0b5ed6;font-weight:700;font-size:14px}h1{font-size:28px;margin:6px 0 18px;line-height:1.35}#story p{font-size:17px;line-height:1.85;margin-bottom:14px}`);
}

export function postPage(lang) {
  const s = copy[lang].sns, me = copy[lang].chat.me;
  return base(lang, s.app, `<nav class="side"><b>✦ ${esc(s.app)}</b><div class="on">${esc(me)}</div></nav><main>
<section class="composer"><span class="av">${esc([...me][0])}</span><div class="col"><div id="post" contenteditable="true" spellcheck="false">${esc(s.draft)}</div><div class="bar"><button class="btn" type="button">${esc(s.post)}</button></div></div></section>
<div class="feed"><div></div><div></div></div></main>`,
    `.composer{display:flex;gap:16px;background:#fff;border:1px solid #bcd6fb;border-radius:16px;padding:22px 26px;box-shadow:0 6px 20px #0f77f214}.av{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#dbe9ff;color:#0b5ed6;font-weight:700}.col{flex:1;display:flex;flex-direction:column;gap:12px}
#post{min-height:110px;font-size:20px;line-height:1.7;outline:none;white-space:pre-wrap}.bar{display:flex;justify-content:flex-end;border-top:1px solid #eef1f6;padding-top:12px}.feed div{height:120px;background:#fff;border:1px solid #e3e7f0;border-radius:16px;margin-top:16px;opacity:.6}`);
}

export async function record(lang, { force = false } = {}) {
  const c = copy[lang];
  if (!c) throw Error("No story copy for " + lang);
  const dir = path.join(captureRoot, lang);
  if (!force && fs.existsSync(path.join(dir, "evidence.json"))) { console.log("SKIP " + lang + " (recorded)"); return; }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const posts = [];
  const server = http.createServer((req, res) => {
    if (req.method !== "GET") { posts.push(req.method + " " + req.url); res.writeHead(405).end(); return; }
    const page = { "/mail": mailPage, "/chat": chatPage, "/article": articlePage, "/post": postPage }[new URL(req.url, "http://x").pathname];
    if (!page) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(page(lang));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const evidence = { lang, liveAI: true, view, events: {}, boxes: {}, pointer: [], frames: [], pageSubmissions: posts };
  let browser, session, frameIndex = 0, writing = Promise.resolve();
  const start = Date.now(), now = () => (Date.now() - start) / 1000;
  const step = (what) => console.log(`${lang} · ${what} ${now().toFixed(2)}s`);
  const mark = (name) => { evidence.events[name] = now(); console.log(`${lang} ${name} ${evidence.events[name].toFixed(2)}s`); };
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath(), headless: true, enableExtensions: true, protocolTimeout: 60000, defaultViewport: null,
      args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, `--lang=${chromeLang[lang] || lang}`, "--hide-scrollbars",
        // The screencast sends frames at the window's device pixels; a viewport override alone gives 1x frames.
        `--force-device-scale-factor=${view.scale}`, `--window-size=${view.width + 16},${view.height + 95}`,
        "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
    });
    step("browser up");
    const target = await browser.waitForTarget((t) => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"));
    // Seed the language's default presets from an extension page (evaluating in the service worker never returns in
    // this Chrome). The extension's own history and success count later prove the two live AI results.
    const control = await browser.newPage();
    await control.goto(target.url().replace(/[^/]+$/, "popup.html"), { waitUntil: "load" });
    const store = (fn, arg) => control.evaluate(fn, arg);
    await store(async (lang) => {
      await chrome.storage.sync.set({ presets: SR_PRESETS.srDefaultPresets(lang), lang, theme: "light", toolbarEnabled: true });
      await chrome.storage.local.set({ onboarded: true, history: [], review: { successCount: 0, status: "dismissed" } /* the rating prompt (after 3 successes) would cover the results */ });
    }, lang);
    for (const p of await browser.pages()) if (p !== control && !p.url().startsWith("about:")) await p.close(); // a first-run guide tab, if any
    step("extension seeded");
    const page = await browser.newPage();
    await page.bringToFront(); // only the front tab paints, and the screencast needs paints
    await browser.defaultBrowserContext().overridePermissions(origin, ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);
    step("permissions");
    await page.goto(origin + "/mail", { waitUntil: "load" });
    step("mail loaded");
    await page.evaluate(() => document.fonts.ready);
    const size = await page.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]);
    assert.deepEqual(size, [view.width, view.height, view.scale], `${lang}: the page is ${size}, not ${view.width}x${view.height}@${view.scale}x`);
    await page.waitForFunction(() => document.documentElement.getAttribute("data-sendready-build"), { timeout: 10000 });

    step("content script ready");
    // Frames: Chrome's screencast sends one JPEG per painted frame; a still page sends none and the last frame holds.
    session = await page.createCDPSession();
    session.on("Page.screencastFrame", ({ data, sessionId }) => {
      const file = `f${String(frameIndex++).padStart(5, "0")}.jpg`, time = now();
      evidence.frames.push({ time, file });
      writing = writing.then(() => fs.promises.writeFile(path.join(dir, file), Buffer.from(data, "base64")));
      session.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    });
    await session.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: view.width * view.scale, maxHeight: view.height * view.scale, everyNthFrame: 1 });

    // Pointer: real mouse events, eased between points at ~60 Hz, every position logged for the video's cursor.
    let pos = { x: view.width * 0.62, y: view.height * 0.9 };
    const log = (type) => evidence.pointer.push({ t: now(), x: +pos.x.toFixed(1), y: +pos.y.toFixed(1), type });
    log("move");
    const moveTo = async (x, y, ms = 450) => {
      const from = { ...pos }, steps = Math.max(2, Math.round(ms / 16));
      for (let i = 1; i <= steps; i++) {
        const p = i / steps, e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
        pos = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
        await page.mouse.move(pos.x, pos.y);
        log("move");
        await sleep(12);
      }
    };
    const shadowBox = (sel) => page.evaluate((sel) => {
      const el = document.querySelector(".sendready-host")?.shadowRoot?.querySelector(sel);
      if (!el || !el.offsetParent && getComputedStyle(el).position !== "fixed") return null;
      const b = el.getBoundingClientRect();
      return b.width ? { x: b.x, y: b.y, w: b.width, h: b.height } : null;
    }, sel);
    const pageBox = (sel) => page.evaluate((sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }, sel);
    const waitShadow = async (sel, timeout = 8000) => {
      const end = Date.now() + timeout;
      for (;;) { const b = await shadowBox(sel); if (b) return b; if (Date.now() > end) { await page.screenshot({ path: path.join(dir, "failed.png") }); fs.writeFileSync(path.join(dir, "failed.html"), await page.evaluate(() => document.querySelector(".sendready-host")?.shadowRoot?.innerHTML || "(no host)")); throw Error(`${lang}: ${sel} did not appear (failed.png)`); } await sleep(50); }
    };
    // Click a control: travel there, then press; the box and the press time go to the evidence under `name`.
    const click = async (name, box, { ms = 480, pause = 160 } = {}) => {
      evidence.boxes[name] = box;
      await moveTo(box.x + box.w * 0.5, box.y + box.h * 0.55, ms);
      await sleep(pause);
      mark(name); log("down");
      await page.mouse.down(); await sleep(70); await page.mouse.up();
      log("up");
    };
    // Drag across one element's text, as a person selects it; returns the selected text.
    const dragSelect = async (name, sel) => {
      const r = await page.evaluate((sel) => {
        // Start on the first character and end on the last one: a range over the element also reports the boxes of
        // its paragraphs, whose last box ends mid-paragraph.
        const el = document.querySelector(sel), range = document.createRange();
        range.selectNodeContents(el);
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.data.trim() ? 1 : 3 }), texts = [];
        for (let n; (n = w.nextNode());) texts.push(n);
        const charBox = (t, i) => { const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1); const rs = r.getClientRects(); return rs[rs.length - 1]; };
        const first = texts[0], last = texts.at(-1), a = charBox(first, first.data.search(/\S/)), b = charBox(last, last.data.trimEnd().length - 1);
        const rtl = getComputedStyle(el).direction === "rtl";
        return { rtl, x0: rtl ? a.right - 1 : a.left + 1, y0: a.top + a.height / 2, x1: rtl ? b.left + 1 : b.right - 1, y1: b.top + b.height / 2, box: (() => { const u = range.getBoundingClientRect(); return { x: u.x, y: u.y, w: u.width, h: u.height }; })() };
      }, sel);
      evidence.boxes[name] = r.box;
      await moveTo(r.x0 + (r.rtl ? 2 : -2), r.y0, 520); await sleep(150);
      mark(name + "Start"); log("down"); await page.mouse.down();
      const steps = 34;
      for (let i = 1; i <= steps; i++) { pos = { x: r.x0 + (r.x1 - r.x0) * i / steps, y: r.y0 + (r.y1 - r.y0) * i / steps }; await page.mouse.move(pos.x, pos.y); log("move"); await sleep(22); }
      await page.mouse.up(); log("up"); mark(name + "End");
      return page.evaluate(() => String(getSelection()));
    };
    const type = async (text, delay) => { for (const ch of text) { await page.keyboard.type(ch); await sleep(delay); } };
    const panelBox = () => shadowBox(".sr-panel");

    const resultText = () => page.evaluate(() => document.querySelector(".sendready-host").shadowRoot.querySelector(".sr-result").value);
    const text = (sel) => page.evaluate((sel) => document.querySelector(sel).innerText, sel);
    // Open the palette on the current selection, choose a preset (1-based) or run `preset()`, then run; returns the AI's result.
    const runPreset = async (key, preset, from) => {
      await sleep(450); // the field launcher shows on mousedown; the selection launcher replaces it after mouseup
      await click(key + "LauncherClick", await waitShadow(".sr-launcher"));
      await waitShadow(".sr-go");
      await sleep(450);
      evidence.boxes[key + "Palette"] = await panelBox();
      if (typeof preset === "number") await click(key + "PresetClick", await waitShadow(`.sr-list-style .sr-item:nth-child(${preset})`));
      else await preset();
      await sleep(300);
      evidence.boxes[key + "Palette"] = await panelBox();
      await click(key + "RunClick", await waitShadow(".sr-go"));
      await waitShadow(".sr-result", 60000);
      mark(key + "Result");
      const result = await resultText();
      assert.ok(result && result.trim() !== from.trim(), `${lang} ${key}: the AI returned nothing new`);
      await sleep(400);
      evidence.boxes[key + "Result"] = await panelBox();
      return result;
    };
    const applyResult = async (key, field, result) => {
      await sleep(900);
      await click(key + "ApplyClick", await waitShadow(".sr-actions .sr-btn-primary"));
      await sleep(300);
      const now = await text(field);
      assert.ok(now.includes(result.trim().split("\n")[0]), `${lang} ${key}: Apply did not put the result in the field`);
      mark(key + "Applied");
      return now;
    };
    const lastTextBox = (sel) => page.evaluate((sel) => {
      const w = document.createTreeWalker(document.querySelector(sel), NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.data.trim() ? 1 : 3 });
      let t, n; while ((n = w.nextNode())) t = n;
      const r = document.createRange(); r.setStart(t, t.data.length - 1); r.setEnd(t, t.data.length);
      const b = r.getBoundingClientRect(), rtl = getComputedStyle(t.parentElement).direction === "rtl"; return { x: rtl ? b.left - 10 : b.right + 2, y: b.y, w: 8, h: b.height };
    }, sel);
    const results = {};

    // --- Mail (1) polite rewrite, applied ------------------------------------------------------------------------
    await sleep(1200);
    assert.equal((await dragSelect("draft", "#compose")).trim(), c.draft, `${lang}: the drag did not select the draft`);
    results.polite = await runPreset("polite", 1, c.draft);
    evidence.applied = await applyResult("polite", "#compose", results.polite);
    await sleep(1100);

    // --- Mail (2) the greeting snippet at the top --------------------------------------------------------------------
    const first = await page.evaluate(() => {
      const t = document.createTreeWalker(document.querySelector("#compose"), NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.data.trim() ? 1 : 3 }).nextNode(), r = document.createRange();
      r.setStart(t, 0); r.setEnd(t, 1);
      const b = r.getBoundingClientRect(), rtl = getComputedStyle(t.parentElement).direction === "rtl";
      return { x: rtl ? b.right - 3 : b.x - 3, y: b.y, w: 6, h: b.height };
    });
    await click("caretClick", first);
    await page.evaluate(() => { // the click lands before the first character; make sure the caret is exactly there
      const t = document.createTreeWalker(document.querySelector("#compose"), NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.data.trim() ? 1 : 3 }).nextNode();
      getSelection().collapse(t, 0);
    });
    await sleep(450);
    mark("snippetStart");
    await type(c.trigger, 150);
    await sleep(300);
    mark("snippetTab");
    await page.keyboard.press("Tab");
    await sleep(120);
    await page.keyboard.press("Enter");
    evidence.withGreeting = await text("#compose");
    const greeting = (await store(() => chrome.storage.sync.get("presets"))).presets.find((p) => p.trigger === c.trigger)?.content;
    assert.ok(greeting, `${lang}: no snippet preset with the trigger ${c.trigger}`);
    const flat = (s) => s.replace(/\s+/g, " ").trim();
    assert.ok(flat(evidence.withGreeting).startsWith(flat(greeting)) && !evidence.withGreeting.includes(c.trigger), `${lang}: the snippet did not expand`);
    evidence.boxes.compose = await pageBox(".reply");
    await sleep(1100);

    // --- Mail (3) inline AI trigger: "//p text" + Tab on a new last line ------------------------------------------------
    await click("endClick", await lastTextBox("#compose"));
    await page.evaluate(() => { const s = getSelection(); s.selectAllChildren(document.querySelector("#compose")); s.collapseToEnd(); });
    await sleep(300);
    await page.keyboard.press("Enter");
    mark("inlineStart");
    await type("//p " + c.mail.inline, 85);
    await sleep(350);
    mark("inlineTab");
    await page.keyboard.press("Tab");
    await waitShadow(".sr-result", 60000);
    mark("inlineResult");
    results.inline = await resultText();
    await sleep(400);
    evidence.boxes.inlineResult = await panelBox();
    evidence.withInline = await applyResult("inline", "#compose", results.inline);
    assert.ok(!evidence.withInline.includes("//p"), `${lang}: the inline trigger stayed in the mail`);
    evidence.boxes.compose = await pageBox(".reply");
    await sleep(1500);
    mark("mailEnd");

    // --- Chat (4) reply to a received message --------------------------------------------------------------------
    await page.goto(origin + "/chat", { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    mark("chatShown");
    await sleep(800);
    assert.equal((await dragSelect("received", "#received")).trim(), c.chat.message, `${lang}: the drag did not select the message`);
    results.reply = await runPreset("reply", async () => {
      await click("replyCheckClick", await waitShadow(".sr-check-lbl"));
      await waitShadow(".sr-reply-form textarea");
      await sleep(250);
      await click("replyPresetClick", await waitShadow(".sr-list-style .sr-item:nth-child(1)"));
      await sleep(200);
      await click("gistClick", await waitShadow(".sr-reply-form textarea"), { ms: 380 });
      await sleep(200);
      mark("gistStart");
      await type(c.chat.gist, 95);
      mark("gistEnd");
    }, c.chat.message);
    await sleep(800);
    await click("copyClick", await waitShadow(".sr-actions .sr-btn-primary"));
    await sleep(450);
    await click("closeClick", await waitShadow(".sr-x"), { ms: 380 });
    await sleep(250);
    await click("inputClick", await pageBox("#input"));
    await sleep(300);
    // Paste what the extension put on the clipboard (Ctrl+V does not reach the clipboard in headless Chrome).
    // Windows hands the clipboard back with CRLF line ends; compare and paste with LF.
    evidence.clipboard = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n?/g, "\n");
    assert.equal(evidence.clipboard.trim(), results.reply.trim(), `${lang}: Copy did not put the reply on the clipboard`);
    mark("pasted");
    await page.keyboard.sendCharacter(evidence.clipboard);
    await sleep(800);
    await click("sendClick", await pageBox("#send"));
    await sleep(250);
    evidence.sent = await page.evaluate(() => document.querySelector(".mine p")?.textContent);
    // Pasted paragraphs come back from the chat with their own blank lines; compare the words.
    const words = (s) => String(s || "").replace(/\s+/g, " ").trim();
    assert.equal(words(evidence.sent), words(results.reply), `${lang}: the reply was not sent in the chat`);
    await sleep(1800);
    mark("chatEnd");

    // --- Article (5) summary of two paragraphs (read-only text: the result is copied) ------------------------------------
    await page.goto(origin + "/article", { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    mark("articleShown");
    await sleep(900);
    const article = (await dragSelect("article", "#story")).trim();
    assert.ok(article.includes(c.article.paragraphs[0].slice(0, 12)) && article.includes(c.article.paragraphs[1].slice(-8)), `${lang}: the drag did not select the article`);
    results.summary = await runPreset("summary", 3, article);
    await sleep(2000);
    await click("summaryCloseClick", await waitShadow(".sr-x"), { ms: 380 });
    await sleep(500);
    mark("articleEnd");

    // --- Social post (6) own instruction, then (7) English translation, both applied -------------------------------------------
    await page.goto(origin + "/post", { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    mark("postShown");
    await sleep(800);
    assert.equal((await dragSelect("post", "#post")).trim(), c.sns.draft, `${lang}: the drag did not select the post`);
    results.custom = await runPreset("custom", async () => {
      await click("moreClick", await waitShadow(".sr-style-more"));
      await waitShadow(".sr-style-input");
      await sleep(250);
      mark("instructionStart");
      await type(c.sns.instruction, 95);
      mark("instructionEnd");
    }, c.sns.draft);
    evidence.customized = await applyResult("custom", "#post", results.custom);
    evidence.boxes.post = await pageBox(".composer");
    await sleep(1300);
    const custom = (await dragSelect("post2", "#post")).trim();
    assert.equal(custom, evidence.customized.trim(), `${lang}: the drag did not select the rewritten post`);
    results.translate = await runPreset("translate", 2, custom);
    evidence.translated = await applyResult("translate", "#post", results.translate);
    evidence.boxes.post = await pageBox(".composer");
    await sleep(2000);
    mark("end");

    await session.send("Page.stopScreencast");
    await writing;
    evidence.results = results;
    evidence.rewrite = results.polite;
    evidence.reply = results.reply;
    const after = await store(() => chrome.storage.local.get(["history", "review", "usage"]));
    evidence.extensionState = { successCount: after.review?.successCount, history: (after.history || []).map((h) => h.text), usage: after.usage };
    assert.equal(after.review?.successCount, 6, `${lang}: expected exactly six successful AI requests`);
    assert.deepEqual(evidence.extensionState.history.map((t) => t.trim()), ["translate", "custom", "summary", "reply", "inline"].map((k) => results[k].trim()), `${lang}: the history does not hold the AI results`);
    assert.deepEqual(posts, []);

    // Stills of the real popup for the feature cards: the preset list and the generation history.
    await control.bringToFront();
    await control.reload({ waitUntil: "load" });
    await control.evaluate(() => document.fonts.ready);
    await sleep(600);
    const shoot = async (name) => {
      const b = await control.evaluate(() => { const r = document.body.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 640) }; });
      await control.screenshot({ path: path.join(dir, name + ".png"), clip: b, captureBeyondViewport: false });
      return { file: name + ".png", width: b.width, height: b.height };
    };
    evidence.stills = { presets: await shoot("popup-presets") };
    await control.evaluate(() => document.querySelector("#history-btn").click());
    await sleep(500);
    evidence.stills.history = await shoot("popup-history");
    evidence.frameSize = await (async () => { const b = fs.readFileSync(path.join(dir, evidence.frames[0].file)); let i = 2; while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc2) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; } return null; })();
    fs.writeFileSync(path.join(dir, "evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
    console.log(`PASS ${lang}: ${evidence.frames.length} frames ${evidence.frameSize}`);
    for (const [k, v] of Object.entries(results)) console.log(`  ${k}: ${v.replace(/\n/g, " / ")}`);
  } finally {
    if (session) await session.send("Page.stopScreencast").catch(() => {});
    await writing.catch(() => {});
    if (browser) await browser.close();
    await new Promise((r) => server.close(r));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), force = args.includes("--force");
  const langs = args.filter((a) => copy[a]);
  for (const lang of langs.length ? langs : Object.keys(copy)) await record(lang, { force });
}
