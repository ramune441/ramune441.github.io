// Points SendReady's Chrome Web Store listing at the story promo videos (youtube-story.json): per language tab the
// localized video, and English as the video for all languages. Saves a draft per tab, reads every tab back after a
// reload, then records the adopted URLs in youtube-store-videos.json. Same store steps as formpilot/cws-videos.js.
//   node sendready-chrome/cws-videos.mjs [--read] [--submit]
// CWS_BROWSER_URL=http://127.0.0.1:9333 drives a normal Chrome started with --remote-debugging-port on the same
// profile, for when Google asks to sign in again (the person signs in there; the script never types credentials).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const item = "https://chrome.google.com/webstore/devconsole/86b19d4f-f24f-44ae-9d1d-d2578fe36daf/nbjmakcblclblgapocdeaojgacegpono/edit/";
const storyFile = path.join(here, "youtube-story.json"), adoptedFile = path.join(here, "youtube-store-videos.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Store language tabs follow the package's _locales; the story's keys differ for two of them.
const tabCode = { zh: "zh_CN", pt: "pt_BR" }, globalLang = "en";
const videos = () => { const items = JSON.parse(fs.readFileSync(storyFile, "utf8")).items; for (const [l, i] of Object.entries(items)) if (!i.published) throw Error(l + ": the story video is not public yet"); return items; };

const read = process.argv.includes("--read"), attached = process.env.CWS_BROWSER_URL, items = read ? JSON.parse(fs.readFileSync(storyFile, "utf8")).items : videos();
const browser = attached ? await puppeteer.connect({ browserURL: attached, defaultViewport: { width: 1600, height: 1200 }, protocolTimeout: 300000 })
  : await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, userDataDir: "C:/Users/Warlo/cws-profile", args: ["--no-first-run"], protocolTimeout: 300000, defaultViewport: { width: 1600, height: 1200 } });
const page = await browser.newPage();
if (!attached) await page.setUserAgent((await browser.userAgent()).replace("HeadlessChrome", "Chrome"));
page.on("dialog", (d) => d.accept().catch(() => {}));
const shot = (name) => { const file = path.join(process.env.LOCALAPPDATA || os.homedir(), "SendReady", "cws-" + name + ".png"); fs.mkdirSync(path.dirname(file), { recursive: true }); console.log("screenshot " + file); return page.screenshot({ path: file }).catch(() => {}); };
const center = async (h) => { const b = h && (await h.boundingBox()); return b && b.width ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; };
const click = async (h) => { const c = await center(h); if (c) await page.mouse.click(c.x, c.y); else await h.evaluate((e) => e.click()); };
// Buttons by text across shadow roots.
const button = (pattern) => page.evaluateHandle((source) => { const re = new RegExp(source); const walk = (node, out = []) => { for (const e of node.querySelectorAll("*")) { if (e.tagName === "BUTTON" && re.test(e.innerText) && !e.disabled) out.push(e); if (e.shadowRoot) walk(e.shadowRoot, out); } return out; }; return walk(document)[0] || null; }, pattern).then((h) => h.asElement());
const open = async (sub) => {
  await page.goto(item + sub, { waitUntil: "networkidle2", timeout: 90000 }); if (attached) await page.bringToFront(); await sleep(3000);
  // The console often opens on Google's account chooser; picking the signed-in account is enough.
  if (/accounts\.google\.com\/.*accountchooser/.test(page.url()) && (await page.evaluate(() => { const e = [...document.querySelectorAll("[data-identifier],[data-email]")].find((e) => /warload57@gmail\.com/.test(e.getAttribute("data-identifier") || e.getAttribute("data-email") || "")); e?.click(); return !!e; }))) {
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}); await sleep(3000);
    if (!page.url().startsWith(item + sub)) { await page.goto(item + sub, { waitUntil: "networkidle2", timeout: 90000 }); await sleep(3000); }
  }
  if (!page.url().startsWith(item)) { await shot("signin"); throw Error("Signed out: " + page.url().slice(0, 80)); }
};
const saveDraft = async () => {
  const h = await button("下書きとして保存"); if (!h) { await shot("save"); throw Error("Save button not found"); }
  await click(h);
  for (let i = 0; i < 40; i++) { await sleep(500); const text = await page.evaluate(() => document.body.innerText); if (/アイテムが保存されました/.test(text)) return; if (/保存中にエラー/.test(text)) { await shot("save"); throw Error("Save failed (sign in again in the Chrome window)"); } }
  await shot("save"); throw Error("Save was not confirmed");
};
try {
  await open("listing");
  const status = await page.evaluate(() => document.body.innerText.match(/ステータス:[^\n]+/)?.[0]); console.log(status);
  if (/審査待ち|審査中/.test(status || "") && !read) throw Error("The item is under review. Cancel the review in the dashboard first, or wait for it to finish.");
  // Language tabs: a Material dropdown whose options read like 「英語 – en」.
  const combobox = async () => { for (const h of await page.$$(">>> [role=combobox]")) if (/言語/.test(await h.evaluate((e) => e.innerText + (e.getAttribute("aria-label") || "")))) return h; throw Error("Language selector not found"); };
  const shown = async () => (await combobox()).evaluate((e) => e.innerText.replace(/\s+/g, " ").trim());
  const switchTo = async (code) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await click(await combobox()); await sleep(1200);
      let target = null;
      for (const option of await page.$$(">>> li[role=option]")) { const text = await option.evaluate((e) => e.innerText.trim()); if (text.slice(text.lastIndexOf("–") + 1).trim().split(/\s/)[0].replace("-", "_") === code) target = { option, text }; }
      if (!target) throw Error("Language tab not found: " + code);
      const name = target.text.slice(0, target.text.lastIndexOf("–")).trim();
      if (attempt === 0 && (await shown()).includes(name)) { await page.keyboard.press("Escape"); await sleep(800); return target.text; }
      if (attempt === 0) await click(target.option); else await target.option.evaluate((e) => e.click());
      for (let i = 0; i < 10; i++) { await sleep(500); if ((await shown()).includes(name)) { await sleep(2000); return target.text; } }
    }
    throw Error("Could not switch to the language tab: " + code + " (shows " + (await shown()) + ")");
  };
  const videoInputs = () => page.$$('>>> input[placeholder*="YouTube"]');
  // The fields only register keyboard input.
  const typeInto = async (h, value) => {
    if ((await h.evaluate((e) => e.value)) === value) return false;
    await h.click({ clickCount: 3 });
    await page.keyboard.down("Control"); await page.keyboard.press("KeyA"); await page.keyboard.up("Control"); await page.keyboard.press("Backspace");
    await page.keyboard.type(value); await sleep(500);
    if ((await h.evaluate((e) => e.value)) !== value) throw Error("Value did not stick: " + value.slice(0, 40));
    return true;
  };
  const langs = [globalLang, ...Object.keys(items).filter((l) => l !== globalLang)];
  for (const lang of langs) {
    const tab = await switchTo(tabCode[lang] || lang), [localized, global] = await videoInputs(), url = items[lang].watchUrl;
    if (read) { console.log(tab + ": " + ((await localized.evaluate((e) => e.value)) || "(none)") + (lang === globalLang ? " / all languages: " + ((await global.evaluate((e) => e.value)) || "(none)") : "")); continue; }
    const changes = [];
    if (await typeInto(localized, url)) changes.push("video");
    if (lang === globalLang && (await typeInto(global, url))) changes.push("video for all languages");
    console.log(tab + ": " + (changes.join(", ") || "unchanged"));
    if (changes.length) await saveDraft();
  }
  if (!read) {
    await open("listing");
    for (const lang of langs) {
      await switchTo(tabCode[lang] || lang);
      const [localized, global] = await videoInputs(), url = items[lang].watchUrl;
      if ((await localized.evaluate((e) => e.value)) !== url || (lang === globalLang && (await global.evaluate((e) => e.value)) !== url)) throw Error("Not saved for " + lang);
    }
    console.log("Verified " + langs.length + " languages after reload");
    const adopted = { items: {} };
    for (const lang of langs) { const i = items[lang]; adopted.items[lang] = { videoId: i.videoId, watchUrl: i.watchUrl, title: i.title }; }
    adopted.verifiedAt = new Date().toISOString(); fs.writeFileSync(adoptedFile, JSON.stringify(adopted, null, 2) + "\n"); console.log("Recorded the store videos in " + path.basename(adoptedFile));
    if (process.argv.includes("--submit")) {
      await click(await button("審査のため送信")); await sleep(3000);
      const confirm = await page.evaluateHandle(() => { const walk = (node, out = []) => { for (const e of node.querySelectorAll("*")) { if (e.getAttribute("role") === "dialog" && /審査のために送信しますか/.test(e.innerText)) out.push(e); if (e.shadowRoot) walk(e.shadowRoot, out); } return out; }; const dialog = walk(document)[0]; return dialog ? [...dialog.querySelectorAll("button")].filter((b) => /審査のため送信/.test(b.innerText) && !b.disabled).pop() : null; });
      if (!confirm.asElement()) { await shot("submit"); throw Error("Submit confirmation dialog not found"); }
      await click(confirm.asElement());
      let done = false;
      for (let i = 0; i < 30 && !done; i++) { await sleep(500); done = await page.evaluate(() => /審査のために送信されました/.test(document.body.innerText)); }
      if (!done) { await shot("submit"); throw Error("Submission was not confirmed"); }
      console.log("Submitted for review");
    }
  }
} finally { await page.close().catch(() => {}); if (attached) await browser.disconnect(); else await browser.close(); }
