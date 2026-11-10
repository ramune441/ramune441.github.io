// Uploads the SendReady story promo (story/promo-<lang>.mp4) to YouTube Studio (Just One More Animal) from the
// signed-in cws-profile, sets the language and captions, makes each video public once YouTube's checks are done and
// makes the replaced videos private. Same Studio steps as formpilot/youtube-story.js.
//   node sendready-chrome/youtube-story.mjs metadata | upload | captions | publish | retire | check [lang…]
// `lang` is the story's language key (story-copy.mjs); the site uses the same codes with "-" (zh_TW → zh-TW).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import copy from "./story-copy.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "story"), metaFile = path.join(here, "youtube-story.json"), textFile = path.join(here, "youtube.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const read = () => JSON.parse(fs.readFileSync(metaFile, "utf8"));
const save = (lang, values) => {
  const latest = read();
  latest.items[lang] = { ...latest.items[lang], ...values };
  for (const k of Object.keys(latest.items[lang])) if (latest.items[lang][k] === undefined) delete latest.items[lang][k];
  fs.writeFileSync(metaFile, JSON.stringify(latest, null, 2) + "\n");
};
const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
export const siteCode = (lang) => lang.replace("_", "-");
// Language names as the (Japanese) Studio UI lists them.
const studioLanguage = { ja: "日本語", en: "英語", es: "スペイン語", fr: "フランス語", pt: "ポルトガル語 (ブラジル)", id: "インドネシア語", ko: "韓国語", zh: "中国語 (簡体字)", zh_TW: "中国語 (繁体字)", de: "ドイツ語", it: "イタリア語", ru: "ロシア語", hi: "ヒンディー語", tr: "トルコ語", vi: "ベトナム語", th: "タイ語", pl: "ポーランド語", ar: "アラビア語", nl: "オランダ語", bn: "ベンガル語" };
// The videos these replace (the animated promo, 11 languages); retire makes them private once the new one is public.
const previous = { en: "EgFYF6ePogI", ja: "XJfutrY5Hi4", zh: "O14tQiPTOuM", ko: "EP851RRJ960", es: "i5upjawC5Wc", fr: "yy85fFNBexM", de: "A27lAS3KP6A", pt: "gUgKhme1FLg", hi: "XCgpLPoVV8I", id: "vuDxSAuPJJk", ar: "4li9HWk8jf0" };

// Title and description from youtube.json (searchable title, store and site links with utm).
function metadata() {
  const text = JSON.parse(fs.readFileSync(textFile, "utf8"));
  const meta = fs.existsSync(metaFile) ? read() : { channelId: "UCrjA6ffzb5pUw2URh0BcdRQ", items: {} };
  for (const lang of Object.keys(copy)) {
    const report = JSON.parse(fs.readFileSync(path.join(root, `promo-${lang}.json`), "utf8")), t = text[siteCode(lang)];
    if (!t) throw Error(`${lang}: no title/description in youtube.json`);
    if ([...t.title].length > 100 || t.description.length > 5000 || /[<>]/.test(t.title + t.description)) throw Error("YouTube metadata limit: " + lang);
    const old = meta.items[lang] || {};
    if (old.videoId && old.uploadedSha256 !== report.sha256) throw Error(`${lang}: the uploaded video ${old.videoId} is another file; move it to retired first`);
    meta.items[lang] = { ...old, file: report.file, captions: report.captions, sha256: report.sha256, title: t.title, description: t.description, language: studioLanguage[lang],
      visibility: "public", madeForKids: false, notifySubscribers: false, retired: old.retired || (previous[lang] ? [{ videoId: previous[lang], private: false }] : []) };
  }
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2) + "\n");
  console.log("YouTube metadata: " + Object.keys(meta.items).length + " languages");
}

const launch = () => puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, userDataDir: "C:/Users/Warlo/cws-profile",
  args: ["--no-first-run"], protocolTimeout: 600000, defaultViewport: { width: 1600, height: 1000 } });
async function studioPage(browser) {
  const page = await browser.newPage();
  // Studio turns HeadlessChrome away as an unsupported browser.
  await page.setUserAgent((await browser.userAgent()).replace("HeadlessChrome", "Chrome"));
  page.on("dialog", (d) => d.accept().catch(() => {}));
  return page;
}
async function shot(page, name) {
  try {
    const client = await page.createCDPSession(), { data } = await client.send("Page.captureScreenshot", { format: "png" });
    const file = path.join(process.env.LOCALAPPDATA || os.homedir(), "SendReady", `youtube-${name}.png`);
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(data, "base64")); console.log("screenshot " + file);
  } catch {}
}
const clickVisibleOn = (page, lang) => async (selector) => {
  const box = await page.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((e) => e.offsetParent); if (!e) return null; e.scrollIntoView({ block: "center" }); const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, selector);
  if (!box) throw Error(lang + ": nothing visible at " + selector);
  await page.mouse.click(box.x, box.y); await sleep(1500);
};

async function upload(langs) {
  const meta = read(), browser = await launch();
  try {
    for (const lang of langs) {
      const item = meta.items[lang], file = path.join(root, item.file);
      if (item.videoId) { console.log(lang + ": already " + item.videoId); continue; }
      if (hash(file) !== item.sha256) throw Error(lang + ": file differs from metadata; run metadata");
      const page = await studioPage(browser);
      try {
        // An interrupted upload stays as a draft; resume it (draftId) instead of uploading the file twice.
        await page.goto("https://studio.youtube.com/channel/" + meta.channelId + "/videos/upload?d=ud" + (item.draftId ? "&udvid=" + item.draftId : ""), { waitUntil: "networkidle2", timeout: 90000 });
        if (!item.draftId) {
          for (let i = 0; i < 120 && !(await page.evaluate(() => !!document.querySelector("input[type=file]"))); i++) await sleep(500);
          // Puppeteer's element handles hang on Studio pages; set the file through CDP.
          const client = await page.createCDPSession(), { root: doc } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
          const { nodeId } = await client.send("DOM.querySelector", { nodeId: doc.nodeId, selector: "input[type=file]" });
          if (!nodeId) throw Error(lang + ": upload input not found (signed out?)");
          await client.send("DOM.setFileInputFiles", { nodeId, files: [file] });
          let draftId = null;
          for (let i = 0; i < 120 && !draftId; i++) { await sleep(500); draftId = new URL(page.url()).searchParams.get("udvid") || (await page.evaluate(() => ([...document.querySelectorAll("ytcp-uploads-dialog a")].map((a) => a.href).find((h) => /youtu\.be\//.test(h)) || "").split("/").pop() || null)); }
          if (!draftId) throw Error(lang + ": the upload did not get a video id");
          save(lang, { draftId });
        }
        const result = await page.evaluate(async (meta) => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          const q = (s) => document.querySelector("ytcp-uploads-dialog " + s);
          for (let i = 0; i < 120 && !(q("ytcp-video-title #textbox") && q('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]') && q("#toggle-button") && q("#next-button")); i++) await wait(500);
          await wait(2000);
          const press = async (s) => { for (let i = 0; i < 40 && !q(s); i++) await wait(500); if (!q(s)) throw new Error("Studio control not found: " + s); q(s).click(); };
          const put = (box, text) => { box.focus(); document.execCommand("selectAll", false, null); document.execCommand("insertText", false, text); box.dispatchEvent(new Event("input", { bubbles: true })); };
          put(q("ytcp-video-title #textbox"), meta.title); await wait(500);
          put(q("ytcp-video-description #textbox"), meta.description); await wait(800);
          const title = q("ytcp-video-title #textbox").innerText.trim(), description = q("ytcp-video-description #textbox").innerText.trim();
          await press('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]'); await wait(600);
          await press("#toggle-button"); await wait(1500);
          const choose = async (select, label) => { (select.querySelector("#trigger") || select).click(); await wait(1200); const option = [...document.querySelectorAll("tp-yt-paper-item")].find((e) => e.offsetParent && e.innerText.trim() === label); if (!option) { document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return false; } option.click(); await wait(800); return select.innerText.includes(label); };
          const languageSet = await choose(q("ytcp-form-language-input ytcp-form-select"), meta.language);
          const categorySet = await choose(q("#category"), "科学と技術");
          const notify = [...document.querySelectorAll("ytcp-uploads-dialog ytcp-checkbox-lit")].find((e) => /登録者に通知/.test(e.innerText));
          const box = notify?.querySelector("[role=checkbox]") || notify;
          if (box?.getAttribute("aria-checked") === "true") { box.click(); await wait(600); }
          const notifyOff = box?.getAttribute("aria-checked") === "false";
          for (let i = 0; i < 3; i++) { await press("#next-button"); await wait(1500); }
          await press('tp-yt-paper-radio-button[name="PRIVATE"]'); await wait(600);
          let progress = "";
          for (let i = 0; i < 900; i++) { progress = q(".progress-label")?.innerText || ""; if (progress && !/アップロード中|Uploading/.test(progress)) break; await wait(1000); }
          const link = [...document.querySelectorAll("ytcp-uploads-dialog a")].map((a) => a.href).find((h) => /youtu\.be\//.test(h));
          await press("#done-button");
          for (let i = 0; i < 20; i++) { await wait(700); const d = [...document.querySelectorAll("tp-yt-paper-dialog, ytcp-dialog")].find((x) => x.offsetParent && /閉じる|Close/.test(x.innerText) && !x.closest("ytcp-uploads-dialog")); const b = d && [...d.querySelectorAll("ytcp-button, button")].find((b) => /^(閉じる|Close)$/.test(b.innerText.trim())); if (b) { b.click(); break; } }
          return { title, descriptionOk: description === meta.description.trim(), languageSet, categorySet, notifyOff, link, progress };
        }, { title: item.title, description: item.description, language: item.language });
        const id = result.link?.split("/").pop();
        if (!id || result.title !== item.title || !result.descriptionOk || !result.categorySet || !result.notifyOff) throw Error(lang + ": " + JSON.stringify(result));
        if (!result.languageSet) console.log(lang + ": video language left for the details page");
        save(lang, { videoId: id, watchUrl: "https://www.youtube.com/watch?v=" + id, uploadedSha256: item.sha256, draftId: undefined });
        console.log(lang + ": " + id + " " + result.progress.replace(/\s+/g, " "));
        await sleep(3000);
      } catch (error) { await shot(page, "upload-" + lang); throw error; } finally { await page.close(); }
    }
  } finally { await browser.close(); }
}

// The video language and the title/description language, on the details page; returns kept | changed | ''.
const setLanguagesIn = (label) => (async (label) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const selects = () => [...document.querySelectorAll("ytcp-form-select")].filter((s) => /^(動画の言語|タイトルと説明の言語)/.test(s.innerText.trim()));
  if (selects().length < 2 || !selects()[0].offsetParent) { document.querySelector("#toggle-button")?.click(); await wait(2000); }
  let result = "kept";
  for (let i = 0; i < selects().length; i++) {
    const select = selects()[i]; if (select.innerText.includes(label)) continue;
    (select.querySelector("#trigger") || select).click(); await wait(1200);
    // Each select keeps its own hidden copy of the list; take the shown one, the most recently opened.
    const option = [...document.querySelectorAll("tp-yt-paper-item")].filter((e) => e.offsetParent && e.innerText.trim() === label).at(-1);
    if (!option) return ""; option.scrollIntoView({ block: "center" }); await wait(300); option.click(); await wait(800);
    result = selects()[i].innerText.includes(label) ? "changed" : ""; if (!result) return "";
  }
  return selects().length === 2 ? result : "";
});
async function openDetails(page, videoId) {
  await page.goto("https://studio.youtube.com/video/" + videoId + "/edit", { waitUntil: "networkidle2", timeout: 90000 });
  for (let i = 0; i < 120 && !(await page.evaluate(() => !!document.querySelector("ytcp-video-title #textbox"))); i++) await sleep(500);
  await sleep(2500);
}

// Captions in the video's language: Language page → upload manually → with timecodes.
async function captions(langs) {
  const browser = await launch();
  try {
    for (const lang of langs) {
      const item = read().items[lang];
      if (!item.videoId || item.captionsUploaded) continue;
      const page = await studioPage(browser);
      try {
        await openDetails(page, item.videoId);
        const set = await page.evaluate(setLanguagesIn(item.language), item.language);
        if (!set) throw Error(lang + ": video and title/description language not set");
        if (set === "changed") {
          await clickVisibleOn(page, lang)("ytcp-button#save"); await sleep(4000);
          if (await page.evaluate(() => !document.querySelector("ytcp-button#save")?.hasAttribute("disabled"))) throw Error(lang + ": language change not saved");
        }
        console.log(lang + ": language " + set);
        await page.goto("https://studio.youtube.com/video/" + item.videoId + "/translations", { waitUntil: "networkidle2", timeout: 90000 });
        for (let i = 0; i < 60 && !(await page.evaluate(() => !!document.querySelector("#upload-default-language-button"))); i++) await sleep(500);
        let heading = "";
        for (let i = 0; i < 30 && !heading.includes("動画の言語: " + item.language); i++) { await sleep(500); heading = await page.evaluate(() => (document.querySelector("ytgn-video-translations-section")?.innerText || "").replace(/\s+/g, " ")); }
        if (!heading.includes("動画の言語: " + item.language)) throw Error(lang + ": video language is not " + item.language);
        await page.evaluate(() => document.querySelector("#upload-default-language-button").click()); await sleep(2000);
        await page.evaluate(() => [...document.querySelectorAll('tp-yt-paper-radio-button[name="with-timing"]')].find((e) => e.offsetParent).click()); await sleep(800);
        await page.evaluate(() => { const d = [...document.querySelectorAll("ytcp-dialog")].find((x) => x.offsetParent && /ファイル形式を選択/.test(x.innerText)); [...d.querySelectorAll("ytcp-button")].find((b) => /続行/.test(b.innerText)).click(); }); await sleep(2000);
        const client = await page.createCDPSession(), { root: doc } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
        const { nodeIds } = await client.send("DOM.querySelectorAll", { nodeId: doc.nodeId, selector: "input[type=file]" });
        if (!nodeIds.length) throw Error(lang + ": caption file input not found");
        await client.send("DOM.setFileInputFiles", { nodeId: nodeIds[nodeIds.length - 1], files: [path.join(root, item.captions)] });
        let toast = "";
        for (let i = 0; i < 40 && !toast; i++) { await sleep(500); toast = await page.evaluate(() => [...document.querySelectorAll("tp-yt-paper-toast, ytcp-toast, #toast")].map((t) => t.innerText.trim()).find((t) => /字幕をアップロードしました/.test(t)) || ""); }
        if (!toast.includes(item.language)) throw Error(lang + ": caption upload not confirmed: " + toast);
        save(lang, { captionsUploaded: true }); console.log(lang + ": " + toast);
      } catch (error) { await shot(page, "captions-" + lang); throw error; } finally { await page.close(); }
    }
  } finally { await browser.close(); }
}

// A private video goes public from its details page once YouTube's checks are done; until then it stays private.
// Embedding is allowed (the LP embeds the video), and public is read back from oEmbed, not from the saved screen.
const watchable = async (id) => (await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id))).status === 200;
async function publish(langs) {
  const browser = await launch();
  try {
    for (const lang of langs) {
      const item = read().items[lang];
      if (!item.videoId || item.published) continue;
      const page = await studioPage(browser), clickVisible = clickVisibleOn(page, lang);
      try {
        await openDetails(page, item.videoId);
        const r = await page.evaluate(() => ({ title: document.querySelector("ytcp-video-title #textbox").innerText.trim(), description: document.querySelector("ytcp-video-description #textbox").innerText.trim() }));
        if (r.title !== item.title || r.description !== item.description.trim()) throw Error(lang + ": metadata mismatch " + JSON.stringify(r).slice(0, 200));
        const textLanguage = await page.evaluate(setLanguagesIn(item.language), item.language);
        if (!textLanguage) throw Error(lang + ": title/description language not set");
        const visibility = () => page.evaluate(() => document.querySelector("ytcp-video-metadata-visibility").innerText.replace(/\s+/g, " ").trim());
        if (!/ 公開$/.test(await visibility())) {
          await clickVisible("ytcp-video-metadata-visibility");
          await clickVisible('tp-yt-paper-radio-button[name="PUBLIC"]');
          await clickVisible("#save-button");
          if (await page.evaluate(() => [...document.querySelectorAll("tp-yt-paper-dialog, ytcp-dialog")].some((d) => d.offsetParent && /まだ確認中|still being checked/.test(d.innerText)))) { console.log(lang + ": checks still running, later"); continue; }
        }
        // Allow embedding (Show more → License and distribution) so the LP's embed plays.
        // The channel's upload default does not allow embedding (oEmbed then answers 403); same step as subduo/youtube-live.mjs.
        const embed = await page.evaluate(async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          const find = () => [...document.querySelectorAll("ytcp-checkbox-lit, tp-yt-paper-checkbox")].find((e) => /埋め込みを許可/.test(e.innerText));
          if (!find()?.offsetParent) { document.querySelector("#toggle-button")?.click(); await wait(2000); }
          const el = find(); if (!el) return "";
          el.scrollIntoView({ block: "center" });
          const box = el.querySelector("[role=checkbox]") || el;
          if (box.getAttribute("aria-checked") === "true") return "kept";
          box.click(); await wait(800);
          return box.getAttribute("aria-checked") === "true" ? "changed" : "";
        });
        if (!embed) throw Error(lang + ": embedding not allowed");
        if (textLanguage === "changed" || embed === "changed" || (await page.evaluate(() => !document.querySelector("ytcp-button#save")?.hasAttribute("disabled")))) { await clickVisible("ytcp-button#save"); await sleep(4000); }
        let ok = false;
        for (let i = 0; i < 20 && !(ok = await watchable(item.videoId)); i++) await sleep(3000);
        if (!ok) { console.log(lang + ": not watchable yet (" + (await visibility()) + "), later"); continue; }
        save(lang, { published: true }); console.log(lang + ": public");
      } catch (error) { await shot(page, "publish-" + lang); throw error; } finally { await page.close(); }
    }
  } finally { await browser.close(); }
}

// The replaced videos go private once the new one in the same language is public.
async function retire(langs) {
  const browser = await launch();
  try {
    for (const lang of langs) {
      const item = read().items[lang];
      if (!item.published) { if (item.retired?.some((r) => !r.private)) console.log(lang + ": the new video is not public yet; keep the old one"); continue; }
      for (const old of item.retired || []) {
        if (old.private) continue;
        const mark = () => save(lang, { retired: read().items[lang].retired.map((r) => (r.videoId === old.videoId ? { ...r, private: true } : r)) });
        if (!(await watchable(old.videoId))) { mark(); console.log(lang + ": " + old.videoId + " private"); continue; }
        const page = await studioPage(browser), clickVisible = clickVisibleOn(page, lang);
        try {
          await page.goto("https://studio.youtube.com/video/" + old.videoId + "/edit", { waitUntil: "networkidle2", timeout: 90000 });
          for (let i = 0; i < 120 && !(await page.evaluate(() => !!document.querySelector("ytcp-video-metadata-visibility"))); i++) await sleep(500);
          await sleep(2500);
          await clickVisible("ytcp-video-metadata-visibility"); await clickVisible('tp-yt-paper-radio-button[name="PRIVATE"]'); await clickVisible("#save-button"); await clickVisible("ytcp-button#save"); await sleep(4000);
          for (let i = 0; i < 30 && (await watchable(old.videoId)); i++) await sleep(1000);
          if (await watchable(old.videoId)) throw Error(lang + ": " + old.videoId + " is still watchable");
          mark(); console.log(lang + ": " + old.videoId + " private");
        } catch (error) { await shot(page, "retire-" + lang); throw error; } finally { await page.close(); }
      }
    }
  } finally { await browser.close(); }
}

async function check(langs) {
  let ok = true;
  for (const lang of langs) {
    const item = read().items[lang], status = item?.videoId ? (await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(item.watchUrl))).status : "none";
    if (status !== 200) ok = false;
    console.log(lang + ": " + (item?.videoId || "-") + " " + status);
  }
  if (!ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2), langs = args.length ? args : Object.keys(copy);
  const run = { metadata: async () => metadata(), upload: () => upload(langs), captions: () => captions(langs), publish: () => publish(langs), retire: () => retire(langs), check: () => check(langs) }[command];
  if (!run) throw Error("Usage: node sendready-chrome/youtube-story.mjs metadata|upload|captions|publish|retire|check [lang…]");
  await run();
}
