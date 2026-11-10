// One timeline drives the SendReady story promo: scenes, the retimed real recording from record-story.mjs, the camera,
// the pointer, captions and every sound. build-story.mjs draws each frame from frame() and the audio from soundPlan().
// `rec` is a recording's evidence: event times (s), control boxes and the pointer log, in page CSS px.
// The demo plays seven features in recording order: polite, snippet, inline (mail), reply (chat), summary (article),
// custom and translate (social post); a card scene shows the rest, then the closing card.
import copy from "./story-copy.mjs";

export const fps = 30;
const round = (t) => +t.toFixed(4);
const clamp = (p) => Math.min(1, Math.max(0, p));
const out3 = (p) => 1 - (1 - p) ** 3;
const ease = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const appear = (t, at, len = 0.45) => out3(clamp((t - at) / len));
export const hookEnd = 3.4, brandEnd = 5.4, moreLength = 5.6, ctaLength = 5.6;
export const features = ["polite", "snippet", "inline", "reply", "summary", "custom", "translate"];

// Where the 1280x720 recording sits on the 1920x1080 stage, under a 44 px window bar.
export const win = { x: 180, y: 150, w: 1560, h: 877.5, bar: 44, page: [1280, 720] };
const k = win.w / win.page[0];
export const toStage = (x, y) => ({ x: win.x + x * k, y: win.y + y * k });
const centre = (b) => toStage(b.x + b.w / 2, b.y + b.h / 2);

// An AI feature run from the palette: travel and choose, the AI's wait (always 0.6 s), the result, Apply.
const aiPieces = (part, e, key, from, applied) => [
  [part, from, e[key + "LauncherClick"] + 0.6, 1.5],
  [part, e[key + "LauncherClick"] + 0.6, e[key + "RunClick"] + 0.2, 1.5],
  [part, e[key + "RunClick"] + 0.2, e[key + "Result"], { fixed: 0.6 }],
  [part, e[key + "Result"], applied ? e[key + "ApplyClick"] + 0.5 : e[key + "Result"] + 2.0, 1.3],
];
// The recording plays in pieces: [feature, raw from, raw to, speed] or {fixed: output seconds}. Each piece hangs off the
// recording's own moments, so any language's timing fits the same story.
export function pieces({ events: e }) {
  return [
    ...aiPieces("polite", e, "polite", e.draftStart - 0.7, true),
    ["polite", e.politeApplyClick + 0.5, e.politeApplied + 0.7, 1.1],
    ["snippet", e.caretClick - 0.55, e.snippetTab + 0.9, 1.15],
    ["inline", e.endClick - 0.5, e.inlineTab + 0.1, 1.45],
    ["inline", e.inlineTab + 0.1, e.inlineResult, { fixed: 0.6 }],
    ["inline", e.inlineResult, e.inlineApplyClick + 0.5, 1.3],
    ["inline", e.inlineApplyClick + 0.5, e.inlineApplied + 0.8, 1.1],
    ["reply", e.chatShown + 0.5, e.replyLauncherClick + 0.6, 1.5],
    ["reply", e.replyLauncherClick + 0.6, e.gistEnd + 0.3, 1.65],
    ["reply", e.gistEnd + 0.3, e.replyRunClick + 0.2, 1.4],
    ["reply", e.replyRunClick + 0.2, e.replyResult, { fixed: 0.6 }],
    ["reply", e.replyResult, e.copyClick + 0.4, 1.35],
    ["reply", e.copyClick + 0.4, e.chatEnd - 0.6, 1.9],
    ...aiPieces("summary", e, "summary", e.articleShown + 0.5, false),
    ...aiPieces("custom", e, "custom", e.postShown + 0.5, true),
    ["custom", e.customApplyClick + 0.5, e.customApplied + 0.6, 1.1],
    ...aiPieces("translate", e, "translate", e.post2Start - 0.6, true),
    ["translate", e.translateApplyClick + 0.5, e.end - 0.4, 1],
  ];
}
// The pieces placed on the output clock: [feature, outFrom, outTo, rawFrom, rawTo].
export function placed(rec) {
  let t = brandEnd;
  return pieces(rec).map(([part, a, b, speed]) => {
    if (!(b > a)) throw Error(`Recording piece ${part} is empty (${a}..${b})`);
    const len = typeof speed === "object" ? speed.fixed : (b - a) / speed, p = [part, round(t), round(t + len), a, b];
    t += len;
    return p;
  });
}
export const demoEnd = (rec) => placed(rec).at(-1)[2];
export const moreEnd = (rec) => round(demoEnd(rec) + moreLength);
export const duration = (rec) => round(moreEnd(rec) + ctaLength);
export function rawTime(rec, t) {
  const all = placed(rec), p = all.find(([, a, b]) => t >= a && t < b) || (t < all[0][1] ? all[0] : all.at(-1));
  return p[3] + (Math.min(Math.max(t, p[1]), p[2]) - p[1]) * (p[4] - p[3]) / (p[2] - p[1]);
}
export function outTime(rec, raw) {
  const p = placed(rec).find(([, , , a, b]) => raw >= a && raw <= b);
  if (!p) throw Error("Recording time outside the story: " + raw);
  return round(p[1] + (raw - p[3]) * (p[2] - p[1]) / (p[4] - p[3]));
}
// Cuts: where consecutive pieces skip recording time, the picture cross-fades over the last 0.25 s before the cut.
export const cuts = (rec) => { const p = placed(rec); return p.slice(1).filter((x, i) => x[3] - p[i][4] > 0.05).map((x) => ({ at: x[1], raw: x[3] })); };
export const featureStart = (rec, part) => placed(rec).find((p) => p[0] === part)[1];
const partAt = (rec, t) => (placed(rec).find(([, a, b]) => t >= a && t < b) || placed(rec).at(-1))[0];
const pageOf = { polite: "mail", snippet: "mail", inline: "mail", reply: "chat", summary: "news", custom: "social", translate: "social" };

// Pointer: the logged position at a raw time, eased between log points; pressed while the button is down.
function pointerAt(rec, raw) {
  const log = rec.pointer;
  let i = log.findIndex((p) => p.t > raw);
  if (i < 0) i = log.length;
  const a = log[Math.max(0, i - 1)], b = log[Math.min(log.length - 1, i)];
  const p = b.t > a.t ? clamp((raw - a.t) / (b.t - a.t)) : 0, x = a.x + (b.x - a.x) * p, y = a.y + (b.y - a.y) * p;
  const down = log.filter((q) => q.type === "down" && q.t <= raw).at(-1), up = down && log.find((q) => q.type === "up" && q.t >= down.t);
  const pressed = down && raw <= (up ? up.t : raw) + 0.08;
  return { ...toStage(x, y), press: pressed ? 0.85 : 1 };
}
// Clicks the video shows: every press that falls inside a played piece.
export const clicks = (rec) => {
  const p = placed(rec);
  return rec.pointer.filter((q) => q.type === "down" && p.some(([, , , a, b]) => q.t >= a && q.t <= b)).map((q) => ({ time: outTime(rec, q.t), ...toStage(q.x, q.y) }));
};

// Camera: shots [scale, centre x, centre y]; each move eases over 0.6 s and the shot holds until the next move.
export function cameraKeys(rec) {
  const e = rec.events, b = rec.boxes, o = (n, d = 0) => outTime(rec, e[n]) + d;
  const clampY = (y) => Math.min(Math.max(y, 420), 700);
  const at = (box, s) => { const c = centre(box); return [s, c.x, clampY(c.y)]; };
  // Text is read from its start: keep the box's left edge just inside the view, not its centre.
  // Right-to-left text starts at the right edge.
  const rtl = rec.lang === "ar";
  const lead = (box, s) => { const half = 960 / (s * k), c = centre(box); return [s, toStage(rtl ? box.x + box.w + 50 - half : box.x - 50 + half, 0).x, clampY(c.y)]; };
  const keys = [];
  const cut = (t, shot) => keys.push([t, ...shot], [t + 0.001, ...shot]);
  const go = (t, shot) => { const last = keys.at(-1); if (t > last[0]) keys.push([t, ...last.slice(1)]); keys.push([Math.max(t, last[0]) + 0.6, ...shot]); };
  // A palette feature: from the text, to the palette, to the result, back to the field after Apply.
  const ai = (key, start, field, applied) => {
    cut(start, field);
    go(o(key + "LauncherClick", -0.1), at(b[key + "Palette"], 1.5));
    go(o(key + "Result", -0.05), at(b[key + "Result"], 1.55));
    if (applied) go(o(key + "ApplyClick", 0.05), applied);
  };
  const compose = lead(b.compose, 1.7), post = lead(b.post, 1.45);
  ai("polite", brandEnd, lead(b.draft, 1.7), compose);
  cut(featureStart(rec, "snippet"), compose);
  cut(featureStart(rec, "inline"), compose);
  go(o("inlineResult", -0.05), at(b.inlineResult, 1.55));
  go(o("inlineApplyClick", 0.05), compose);
  ai("reply", featureStart(rec, "reply"), lead(b.received, 1.6), null);
  go(o("closeClick", 0.1), [1.25, 1060, 720]);
  go(o("sendClick", 0.15), lead(b.received, 1.5));
  ai("summary", featureStart(rec, "summary"), lead(b.article, 1.2), null);
  ai("custom", featureStart(rec, "custom"), post, post);
  ai("translate", featureStart(rec, "translate"), post, post);
  keys.push([demoEnd(rec), ...keys.at(-1).slice(1)]);
  return keys.sort((x, y) => x[0] - y[0]);
}
function camera(keys, t) {
  const i = keys.findIndex((x) => x[0] > t);
  if (i <= 0) { const x = keys[i < 0 ? keys.length - 1 : 0]; return { s: x[1], x: x[2], y: x[3] }; }
  const [a, s0, x0, y0] = keys[i - 1], [b, s1, x1, y1] = keys[i], p = ease((t - a) / (b - a));
  return { s: s0 + (s1 - s0) * p, x: x0 + (x1 - x0) * p, y: y0 + (y1 - y0) * p };
}

// The words for one language.
export function text(lang) {
  const c = copy[lang];
  if (!c) throw Error("No story copy for " + lang);
  return { ...c, rtl: lang === "ar" };
}
// Captions: one per feature, from its first piece to the next feature.
export const captionTimes = (rec) => features.map((f) => [featureStart(rec, f), f]);
// Glows: a box lights up when a result lands in it.
function glowList(rec) {
  const e = rec.events, b = rec.boxes, o = (n) => outTime(rec, e[n]);
  return [[o("politeApplied") - 0.3, b.compose], [o("snippetTab") + 0.05, b.compose], [o("inlineApplied") - 0.3, b.compose],
    [o("customApplied") - 0.3, b.post], [o("translateApplied") - 0.3, b.post]];
}
// Keycaps shown while a trigger is typed and fired.
function keyList(rec, t, c) {
  const o = (n) => outTime(rec, rec.events[n]), keys = [];
  const show = (from, tab, label, until) => {
    if (t < from || t >= until) return;
    const fade = clamp((until - t) / 0.25);
    keys.push({ text: label, p: appear(t, from, 0.3) * fade, hot: false });
    if (t >= tab - 0.05) keys.push({ text: "Tab", p: appear(t, tab - 0.05, 0.25) * fade, hot: t < tab + 0.45 });
  };
  show(o("snippetStart"), o("snippetTab"), c.trigger, featureStart(rec, "inline"));
  show(o("inlineStart"), o("inlineTab"), "//p", o("inlineResult") + 0.6);
  return keys;
}
const typedHook = [0.3, 1.5], hookLines = [1.65, 2.15];

export function frame(t, rec, c) {
  const end = duration(rec), dEnd = demoEnd(rec), mEnd = moreEnd(rec);
  const scenes = [["hook", 0, hookEnd], ["brand", hookEnd, brandEnd], ["demo", brandEnd, dEnd], ["more", dEnd, mEnd], ["cta", mEnd, end]];
  // Neighbouring scenes cross-fade over the 0.3 s around each boundary.
  const opacity = Object.fromEntries(scenes.map(([n, s, e]) => [n, Math.min(s ? clamp((t - s + 0.15) / 0.3) : 1, e < end ? clamp((e + 0.15 - t) / 0.3) : 1)]));
  const state = { t, opacity };
  if (opacity.hook) {
    const chars = [...c.draft], shown = Math.ceil(chars.length * clamp((t - typedHook[0]) / (typedHook[1] - typedHook[0])));
    state.hook = { to: c.mail.replyTo, text: chars.slice(0, shown).join(""), caret: t < typedHook[1] ? true : Math.floor(t * 2.5) % 2 === 0,
      lines: c.hook.map((s, i) => ({ text: s, p: appear(t, hookLines[i]) })) };
  }
  if (opacity.brand) state.brand = { tagline: c.tagline, logo: appear(t, hookEnd + 0.05, 0.5), line: appear(t, hookEnd + 0.55) };
  if (opacity.demo) {
    const raw = rawTime(rec, t), part = partAt(rec, t), cut = cuts(rec).find((x) => t >= x.at - 0.25 && t < x.at);
    state.demo = {
      raw, address: pageOf[part] + ".example", camera: camera(cameraKeys(rec), t),
      cut: cut ? { raw: cut.raw, p: (t - (cut.at - 0.25)) / 0.25 } : null,
      caption: { text: c.steps[part], p: appear(t, featureStart(rec, part), 0.35) },
      pointer: pointerAt(rec, raw),
      ripples: clicks(rec).filter((x) => t >= x.time && t < x.time + 0.6).map((x) => { const p = (t - x.time) / 0.6; return { x: x.x, y: x.y, r: 12 + 40 * out3(p), o: 1 - p }; }),
      glows: glowList(rec).flatMap(([at, box]) => { const p = (t - at) / 0.9; if (p < 0 || p > 1) return []; const s = toStage(box.x, box.y); return [{ x: s.x, y: s.y, w: box.w * k, h: box.h * k, o: 1 - p }]; }),
      keys: keyList(rec, t, c),
    };
  }
  if (opacity.more) state.more = { title: c.more.title, titleP: appear(t, dEnd + 0.15), menu: c.more.menu,
    cards: c.more.cards.map((label, i) => ({ label, p: appear(t, dEnd + 0.5 + i * 0.35, 0.5) })) };
  if (opacity.cta) {
    const s = mEnd;
    state.cta = { title: c.cta.title, titleP: appear(t, s + 0.2), chips: c.cta.chips.map((x, i) => ({ text: x, p: appear(t, s + 0.8 + i * 0.2, 0.35) })),
      button: c.cta.button, buttonP: appear(t, s + 1.8), note: c.cta.note, noteP: appear(t, s + 2.4) };
  }
  return state;
}

// Captions (WebVTT cues): the same lines the picture shows, timed with it.
export function cues(rec, c) {
  const caps = captionTimes(rec), d = demoEnd(rec), m = moreEnd(rec);
  return [[0, hookEnd, c.hook.join("")], [hookEnd, brandEnd, "SendReady — " + c.tagline],
    ...caps.map(([s, key], i) => [s, caps[i + 1]?.[0] ?? d, c.steps[key].replace(/^[①-⑨]\s*/, "")]),
    [d, m, c.more.title + ": " + c.more.cards.join(" / ")], [m, duration(rec), c.cta.title + " " + c.cta.note]].map(([a, b, s]) => [round(a), round(b), s]);
}

// Sound: original music and interface sounds (formpilot/promo-sound.js renders them; no samples).
export function soundEvents(rec, c) {
  const ev = [], at = (time, kind, extra) => ev.push({ time: round(time), kind, ...extra }), e = rec.events, o = (n) => outTime(rec, e[n]);
  const ticks = (from, to, text) => { const ch = [...text]; ch.forEach((x, i) => { if (x.trim()) at(from + (to - from) * i / ch.length, "key"); }); };
  ticks(typedHook[0], typedHook[1], c.draft);
  at(hookLines[1], "pop", { pitch: 2 });
  at(hookEnd - 0.32, "whoosh"); at(hookEnd + 0.05, "impact"); at(brandEnd - 0.32, "whoosh");
  for (const x of clicks(rec)) at(x.time, "click");
  ticks(o("snippetStart"), o("snippetTab") - 0.25, c.trigger);
  ticks(o("inlineStart"), o("inlineTab") - 0.3, "//p " + c.mail.inline);
  ticks(o("gistStart"), o("gistEnd"), c.chat.gist);
  ticks(o("instructionStart"), o("instructionEnd"), c.sns.instruction);
  for (const key of ["polite", "inline", "reply", "summary", "custom", "translate"]) at(o(key + "Result"), "sparkle");
  for (const key of ["polite", "inline", "custom", "translate"]) at(o(key + "Applied"), "success");
  at(o("snippetTab"), "success"); at(outTime(rec, e.sendClick) + 0.1, "success");
  for (const x of cuts(rec)) at(x.at - 0.3, "whoosh");
  features.slice(1).forEach((f, i) => at(featureStart(rec, f) + 0.05, "pop", { pitch: i % 5 }));
  const d = demoEnd(rec), m = moreEnd(rec);
  at(d - 0.32, "whoosh"); c.more.cards.forEach((_, i) => at(d + 0.5 + i * 0.35, "pop", { pitch: 3 + i }));
  at(m - 0.32, "whoosh"); at(m + 1.8, "success");
  const end = duration(rec);
  return ev.filter((x) => x.time >= 0 && x.time < end).sort((a, b) => a.time - b.time || a.kind.localeCompare(b.kind));
}
export function soundPlan(rec, c) {
  const end = duration(rec), m = moreEnd(rec), bar = 2, loop = ["D", "A", "Bm", "G"];
  const parts = [{ at: 0, chord: "Bm", kind: "calm" }, { at: 1.7, chord: "G", kind: "calm" }, { at: hookEnd, chord: "D", kind: "intro" }];
  for (let at = brandEnd, i = 0; at < m - 0.01; at += bar, i++) parts.push({ at: round(at), chord: loop[i % 4], kind: "groove" });
  parts.push({ at: round(m), chord: "G", kind: "cta" }, { at: round(m + 1), chord: "A", kind: "cta" }, { at: round(m + 2), chord: "D", kind: "final" });
  const scenes = [["hook", 0], ["brand", hookEnd], ["demo", brandEnd], ["more", demoEnd(rec)], ["cta", m]].map(([name, start]) => ({ name, nominal: start, start }));
  return { duration: end, scenes, music: { bpm: 120, parts }, events: soundEvents(rec, c), palette: "soft" };
}
