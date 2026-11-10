// node --test sendready-chrome/story.test.mjs
// Checks the story promo's words, and for each recorded language its timeline and (once built) that the video was
// rendered from the current sources and recording.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as story from "./story.mjs";
import copy from "./story-copy.mjs";
import { captureRoot } from "./record-story.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const evidence = (lang) => { const f = path.join(captureRoot, lang, "evidence.json"); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null; };
const report = (lang) => { const f = path.join(here, "story", `promo-${lang}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null; };
const shape = copy.ja;

test("every language has the same words as Japanese, none empty", () => {
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, p + k + ".") : [[p + k, v]]));
  const want = keys(shape).map(([k, v]) => [k, Array.isArray(v) ? v.length : "s"]);
  for (const [lang, c] of Object.entries(copy)) {
    const got = keys(c);
    assert.deepEqual(got.map(([k, v]) => [k, Array.isArray(v) ? v.length : "s"]), want, lang);
    for (const [k, v] of got) for (const s of [v].flat()) assert.ok(String(s).trim(), `${lang} ${k} is empty`);
  }
});

for (const lang of Object.keys(copy)) {
  const rec = evidence(lang);
  test(`${lang}: timeline fits the recording`, { skip: !rec && "not recorded" }, () => {
    const p = story.placed(rec);
    p.forEach(([part, a, b, ra, rb], i) => { assert.ok(b > a && rb > ra, `${part} piece ${i}`); if (i) assert.equal(a, p[i - 1][2]); });
    const total = story.duration(rec);
    assert.ok(total > 40 && total < 75, `duration ${total}`);
    const caps = story.captionTimes(rec);
    caps.forEach(([t], i) => { assert.ok(t >= story.hookEnd && t < story.demoEnd(rec)); if (i) assert.ok(t > caps[i - 1][0], `caption ${i} out of order`); });
    for (const c of story.clicks(rec)) assert.ok(c.time >= story.brandEnd && c.time < story.demoEnd(rec), `click at ${c.time} outside the demo`);
    const plan = story.soundPlan(rec, story.text(lang));
    assert.ok(plan.events.every((e) => e.time >= 0 && e.time < total));
    assert.ok(plan.music.parts.every((x, i, a) => !i || x.at > a[i - 1].at), "music parts out of order");
    // The recording proves the live AI results reached the page.
    assert.equal(rec.extensionState.successCount, 6);
    for (const key of ["polite", "inline", "reply", "summary", "custom", "translate"]) assert.ok(rec.results[key]?.trim(), `${key} has no AI result`);
    assert.ok(rec.withInline.includes(rec.results.inline.trim()) && !rec.withInline.includes("//p"));
    const words = (s) => String(s || "").replace(/\s+/g, " ").trim(); // pasted paragraphs gain blank lines in the chat
    assert.equal(words(rec.sent), words(rec.results.reply));
    assert.equal(rec.translated.trim(), rec.results.translate.trim());
    assert.ok(rec.stills?.history && rec.stills?.presets, "popup stills missing");
    // Every feature gets its own caption, in the demo's order.
    assert.deepEqual(caps.map(([, f]) => f), story.features);
  });
  const r = report(lang);
  test(`${lang}: video was built from the current sources and recording`, { skip: !r && "not built" }, () => {
    for (const [file, hash] of Object.entries(r.sourceSha256)) assert.equal(sha(path.join(here, file)), hash, `${file} changed; rebuild ${lang}`);
    if (rec) assert.deepEqual(r.recording.events, rec.events, `recording changed; rebuild ${lang}`);
    assert.equal(r.width, 3840); assert.equal(r.height, 2160); assert.equal(r.fps, "30/1");
    assert.ok(Math.abs(r.audio.integratedLufs + 16) <= 0.6 && r.audio.truePeakDbtp <= -1);
    assert.ok(fs.existsSync(path.join(here, "story", r.captions)));
  });
}
