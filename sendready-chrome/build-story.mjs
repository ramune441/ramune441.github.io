// Renders the SendReady story promo per language from story.mjs, one frame at a time: story.html draws each frame
// around that language's real recording (record-story.mjs; frames stay in %LOCALAPPDATA%/SendReady/story-capture),
// and the soundtrack comes from the same timeline through FormPilot's synthesizer (formpilot/promo-sound.js).
// Writes sendready-chrome/story/promo-<lang>.{mp4,vtt,json}; the MP4 stays out of git.
//   node sendready-chrome/build-story.mjs [lang…] [--stills=6,9.5]   (--stills writes only those seconds as PNGs)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import * as story from "./story.mjs";
import copy from "./story-copy.mjs";
import { captureRoot, ext, fonts } from "./record-story.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { rate, soundtrack } = require("../formpilot/promo-sound.js");
const { ffmpeg, loudness, normalizer, probe } = require("../formpilot/build-youtube-sound.js");
export const output = path.join(here, "story");
const work = path.join(process.env.LOCALAPPDATA || os.homedir(), "SendReady", "story-render");
const browserPath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sha = (x) => crypto.createHash("sha256").update(Buffer.isBuffer(x) ? x : fs.readFileSync(x)).digest("hex");
export const sources = ["story.mjs", "story-copy.mjs", "story.html", "build-story.mjs", "../formpilot/promo-sound.js"];

export function recording(lang) {
  const file = path.join(captureRoot, lang, "evidence.json");
  if (!fs.existsSync(file)) throw Error(`No recording for ${lang}; run node sendready-chrome/record-story.mjs ${lang}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
const frameAt = (frames, raw) => (frames.filter((f) => f.time <= raw + 1e-6).at(-1) || frames[0]).file;

function serve(dir) {
  const types = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png" };
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, "http://x").pathname).slice(1);
    const [root, rest] = name.startsWith("rec/") ? [dir, name.slice(4)] : name.startsWith("ext/") ? [ext, name.slice(4)] : [here, name];
    const file = path.resolve(root, rest);
    if (!file.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}
const run = (args) => new Promise((resolve, reject) => spawn(ffmpeg, args, { stdio: "inherit", windowsHide: true }).on("close", (c) => (c ? reject(Error("ffmpeg exited " + c)) : resolve())));

export async function render(lang, stills) {
  const rec = recording(lang), c = story.text(lang), dir = path.join(captureRoot, lang), total = story.duration(rec);
  fs.mkdirSync(work, { recursive: true });
  fs.mkdirSync(output, { recursive: true });
  const server = await serve(dir), base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await puppeteer.launch({ headless: true, executablePath: browserPath, protocolTimeout: 180000 });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    await page.goto(base + "story.html");
    await page.evaluate((s) => window.setup(s), { logo: "ext/icons/icon128.png", stills: rec.stills && { history: "rec/" + rec.stills.history.file, presets: "rec/" + rec.stills.presets.file }, win: story.win, lang, dir: c.rtl ? "rtl" : "ltr", font: fonts[lang] ? `${fonts[lang]},'Segoe UI',sans-serif` : undefined });
    await page.evaluate(() => document.fonts.ready);
    const draw = async (t) => {
      const s = story.frame(t, rec, c);
      if (s.demo) {
        s.demo.frame = "rec/" + frameAt(rec.frames, s.demo.raw);
        if (s.demo.cut) s.demo.next = { frame: "rec/" + frameAt(rec.frames, s.demo.cut.raw + 0.05), p: s.demo.cut.p };
      }
      await page.evaluate((s) => window.draw(s), s);
    };
    if (stills) {
      for (const t of stills) { await draw(t); const file = path.join(work, `${lang}-${t}.png`); await page.screenshot({ path: file }); console.log("STILL", file); }
      return;
    }
    const plan = story.soundPlan(rec, c), pcm = soundtrack(plan), wav = path.join(work, `${lang}.wav`);
    fs.writeFileSync(wav, pcm);
    const file = path.join(output, `promo-${lang}.mp4`), filter = await normalizer(wav);
    // veryfast with four threads: slower presets run x264 out of memory at 4K in this ffmpeg build.
    const encoder = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(story.fps), "-c:v", "mjpeg", "-i", "-", "-i", wav,
      "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-profile:v", "high", "-preset", "veryfast", "-crf", "16", "-threads", "4", "-pix_fmt", "yuv420p", "-r", String(story.fps),
      "-af", filter, "-ar", String(rate), "-ac", "2", "-c:a", "aac", "-b:a", "192k", "-t", String(total), "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"], windowsHide: true });
    const done = new Promise((resolve, reject) => { encoder.on("error", reject); encoder.on("close", (code) => (code ? reject(Error("ffmpeg exited " + code)) : resolve())); });
    const frames = Math.round(total * story.fps);
    for (let n = 0; n < frames; n++) {
      await draw(n / story.fps);
      const jpg = await page.screenshot({ type: "jpeg", quality: 94 });
      if (!encoder.stdin.write(jpg)) await new Promise((r) => encoder.stdin.once("drain", r));
      if (n % 150 === 0) console.log(`${lang} frame ${n}/${frames}`);
    }
    encoder.stdin.end();
    await done;
    const audio = await loudness(file), info = await probe(file), v = info.streams.find((s) => s.codec_type === "video"), a = info.streams.find((s) => s.codec_type === "audio");
    if (Math.abs(+audio.input_i + 16) > 0.6 || +audio.input_tp > -1) throw Error(`${lang}: loudness out of range: ${audio.input_i} LUFS, ${audio.input_tp} dBTP`);
    const stamp = (t) => new Date(t * 1000).toISOString().slice(11, 23), vtt = path.join(output, `promo-${lang}.vtt`);
    fs.writeFileSync(vtt, "WEBVTT\n\n" + story.cues(rec, c).map(([s, e, line], i) => `${i + 1}\n${stamp(s)} --> ${stamp(e)}\n${line}\n`).join("\n"));
    const report = {
      lang, file: path.basename(file), sha256: sha(file), bytes: fs.statSync(file).size, duration: +info.format.duration, width: v.width, height: v.height, fps: v.r_frame_rate,
      audioCodec: a.codec_name, audioChannels: a.channels, captions: path.basename(vtt),
      recording: { events: rec.events, results: rec.results, withInline: rec.withInline, sent: rec.sent, translated: rec.translated, extensionState: rec.extensionState, pageSubmissions: rec.pageSubmissions.length },
      timeline: { pieces: story.placed(rec), cuts: story.cuts(rec), captions: story.captionTimes(rec) },
      sourceSha256: Object.fromEntries(sources.map((s) => [s, sha(path.join(here, s))])),
      audio: { original: true, thirdPartySamples: false, palette: plan.palette, pcmSha256: sha(pcm), events: plan.events, integratedLufs: +audio.input_i, truePeakDbtp: +audio.input_tp },
    };
    fs.writeFileSync(path.join(output, `promo-${lang}.json`), JSON.stringify(report, null, 2) + "\n");
    await run(["-hide_banner", "-loglevel", "error", "-y", "-i", file, "-vf", "fps=1,scale=640:-2,tile=6x6", "-frames:v", "1", path.join(work, `${lang}-scenes.jpg`)]);
    console.log(`READY ${lang}: ${report.duration}s, ${audio.input_i} LUFS, ${(report.bytes / 1e6).toFixed(1)} MB`);
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), stills = (args.find((a) => a.startsWith("--stills=")) || "").slice(9).split(",").filter(Boolean).map(Number);
  const langs = args.filter((a) => copy[a]);
  for (const lang of langs.length ? langs : Object.keys(copy)) await render(lang, stills.length ? stills : null);
}
