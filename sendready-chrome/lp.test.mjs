// SendReady の公開ページ（LP・使い方・プライバシーポリシー・アンインストールアンケート・問い合わせ）の検査。
//   node --test sendready-chrome/lp.test.mjs
// 生成物の鮮度・20 言語・hreflang の相互参照・JSON-LD・画像の alt・title/description の長さと検索語・
// アンケートの送信先と項目名（HEAD との比較）・拡張が ?lang= で渡す言語コードの受け付けを確かめる。
// フォームは偽の DOM で動かし、送信（fetch）は呼ばれたら失敗にする。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, copyFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const DIR = dirname(fileURLToPath(import.meta.url));
const REPO = join(DIR, "..");
const SITE = "https://ramune441.github.io/sendready-chrome/";
const STORE = "https://chromewebstore.google.com/detail/nbjmakcblclblgapocdeaojgacegpono";
const EXT = process.env.SENDREADY_EXT || join(REPO, "..", "SendReady-Chrome");
const CJK = new Set(["ja", "zh", "zh-TW", "ko"]);
// 拡張が ?lang= で渡す UI 言語コード（SendReady-Chrome の lib/i18n.js の STRINGS のキー）
const EXT_LANGS = ["ja", "en", "es", "fr", "de", "it", "nl", "pl", "pt", "ru", "tr", "zh", "zh_TW", "ko", "vi", "th", "id", "hi", "bn", "ar"];
const toSite = (code) => (code === "zh_TW" ? "zh-TW" : code);

const read = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const len = (s) => [...s].length;

function loadLP() {
  const ctx = { document: { readyState: "loading", addEventListener() {} } };
  vm.createContext(ctx);
  vm.runInContext(read(join(DIR, "i18n-lp.js")) + "\n;this.M = LP_MESSAGES;", ctx);
  return ctx.M;
}
const M = loadLP();
const LANGS = Object.keys(M);
const pageFile = (lang, file) => join(DIR, lang === "en" ? "" : lang, file);
const pageURL = (lang, path) => `${SITE}${lang === "en" ? "" : lang + "/"}${path}`;
const GENERATED = LANGS.flatMap((l) => [
  { lang: l, kind: "lp", file: pageFile(l, "index.html"), url: pageURL(l, "") },
  { lang: l, kind: "howto", file: pageFile(l, "how-to.html"), url: pageURL(l, "how-to.html") },
]);

const ldBlocks = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const alternates = (html) =>
  Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]));
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
const titleOf = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1];
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── 生成物の鮮度 ──────────────────────────────────────────────────
test("生成ページと sitemap が i18n-lp.js・テンプレートから作り直したものと一致する（lastmod を除く）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "sendready-lp-"));
  try {
    const out = join(tmp, "sendready-chrome");
    mkdirSync(out);
    for (const f of ["build-lang-pages.mjs", "i18n-lp.js", "index.html", "how-to.html"]) copyFileSync(join(DIR, f), join(out, f));
    copyFileSync(join(REPO, "sitemap.xml"), join(tmp, "sitemap.xml"));
    // 生成スクリプトは画像の有無だけ見るので、空のファイルで代用する
    const imgs = join(DIR, "images");
    for (const sub of ["", ...readdirSync(imgs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)]) {
      mkdirSync(join(out, "images", sub), { recursive: true });
      for (const f of readdirSync(join(imgs, sub))) if (f.endsWith(".png")) writeFileSync(join(out, "images", sub, f), "");
    }
    execFileSync(process.execPath, [join(out, "build-lang-pages.mjs")], {
      env: { ...process.env, SENDREADY_EXT: EXT }, stdio: "pipe",
    });
    const norm = (s) => s.replace(/<lastmod>[^<]*<\/lastmod>/g, "");
    const stale = [];
    for (const p of GENERATED) {
      const rel = p.file.slice(DIR.length + 1);
      if (!existsSync(p.file) || read(p.file) !== read(join(out, rel))) stale.push(rel);
    }
    if (norm(read(join(REPO, "sitemap.xml"))) !== norm(read(join(tmp, "sitemap.xml")))) stale.push("../sitemap.xml");
    assert.deepEqual(stale, [], "古い生成物がある。cd sendready-chrome && node build-lang-pages.mjs を実行する");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// ── 20 言語 ───────────────────────────────────────────────────────
test("LP・使い方の辞書は拡張 UI と同じ 20 言語で、全言語が同じキーを持つ", () => {
  assert.deepEqual([...LANGS].sort(), EXT_LANGS.map(toSite).sort());
  const keys = Object.keys(M.en).sort();
  for (const l of LANGS) assert.deepEqual(Object.keys(M[l]).sort(), keys, l);
  if (existsSync(join(EXT, "_locales"))) {
    const locales = readdirSync(join(EXT, "_locales")).map((c) => ({ zh_CN: "zh", zh_TW: "zh-TW", pt_BR: "pt" })[c] || c);
    assert.deepEqual(locales.sort(), [...LANGS].sort(), "拡張の _locales と言語が一致する");
  }
});

test("LP と使い方は 20 言語ぶんのページがある", () => {
  for (const p of GENERATED) assert.ok(existsSync(p.file), p.file);
  assert.equal(GENERATED.length, 40);
});

// ── hreflang・canonical・sitemap ──────────────────────────────────
test("各ページの canonical は自身、hreflang は 20 言語＋ x-default で相互に参照する", () => {
  const byURL = new Map(GENERATED.map((p) => [p.url, { ...p, html: read(p.file) }]));
  for (const p of byURL.values()) {
    assert.equal(canonical(p.html), p.url, p.file);
    const alt = alternates(p.html);
    assert.equal(Object.keys(alt).length, 21, p.file);
    assert.equal(alt["x-default"], pageURL("en", p.kind === "lp" ? "" : "how-to.html"), p.file);
    assert.ok(Object.values(alt).includes(p.url), `${p.file} が自身を hreflang に含む`);
    for (const [hl, url] of Object.entries(alt)) {
      const target = byURL.get(url);
      assert.ok(target, `${p.file} の hreflang ${hl} の先 ${url} が生成ページにない`);
      assert.equal(target.kind, p.kind);
      assert.ok(Object.values(alternates(target.html)).includes(p.url), `${url} が ${p.url} を参照し返す`);
    }
  }
});

test("sitemap の sendready-lp 部分は LP と使い方の 40 URL と同じ hreflang を持つ", () => {
  const xml = read(join(REPO, "sitemap.xml"));
  const block = xml.match(/<!-- sendready-lp:start[^>]*-->([\s\S]*?)<!-- sendready-lp:end -->/)[1];
  const urls = [...block.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  assert.deepEqual(urls.map((u) => u.match(/<loc>([^<]+)<\/loc>/)[1]).sort(), GENERATED.map((p) => p.url).sort());
  for (const u of urls) {
    const loc = u.match(/<loc>([^<]+)<\/loc>/)[1];
    const page = GENERATED.find((p) => p.url === loc);
    const alt = Object.fromEntries([...u.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    assert.deepEqual(alt, alternates(read(page.file)), loc);
  }
});

// ── JSON-LD ───────────────────────────────────────────────────────
function checkSoftwareApp(app, lang, where) {
  assert.equal(app["@type"], "SoftwareApplication", where);
  assert.match(app.installUrl, new RegExp(`^${STORE.replace(/[.?/]/g, "\\$&")}\\?utm_source=sendready-lp&utm_medium=web&utm_campaign=${lang}$`), where);
  assert.deepEqual(app.sameAs, [STORE], where);
  assert.equal(app.author.url, "https://ramune441.github.io/", where);
  assert.match(app.softwareVersion, /^\d+\.\d+\.\d+$/, where);
  if (existsSync(join(EXT, "manifest.json"))) {
    assert.equal(app.softwareVersion, JSON.parse(readFileSync(join(EXT, "manifest.json"), "utf8")).version, where);
  }
  assert.equal(app.featureList.length, 6, where);
  for (const f of app.featureList) assert.ok(f && !/[<>]/.test(f), where);
  assert.deepEqual(app.featureList, [1, 2, 3, 4, 5, 6].map((i) => M[lang][`feat${i}_h3`]), `${where} featureList はその言語の機能名`);
  assert.equal(app.screenshot.length, 5, where);
  for (const s of app.screenshot) {
    assert.ok(s.startsWith(`${SITE}images/`), where);
    assert.ok(existsSync(join(DIR, s.slice(SITE.length))), `${where} の画像 ${s} がある`);
    if (existsSync(join(DIR, "images", lang))) assert.ok(s.includes(`/images/${lang}/`), `${where} はその言語の画像を使う`);
  }
}

test("LP の JSON-LD は SoftwareApplication（installUrl・featureList・screenshot ほか）・FAQPage・BreadcrumbList", () => {
  for (const p of GENERATED.filter((g) => g.kind === "lp")) {
    const blocks = ldBlocks(read(p.file));
    assert.deepEqual(blocks.map((b) => b["@type"]), ["SoftwareApplication", "FAQPage", "BreadcrumbList"], p.file);
    checkSoftwareApp(blocks[0], p.lang, p.file);
    assert.equal(blocks[0].url, p.url);
    assert.ok(blocks[1].mainEntity.length >= 4, p.file);
  }
});

test("使い方の JSON-LD は HowTo（4 手順、about は SoftwareApplication）と 3 段の BreadcrumbList", () => {
  for (const p of GENERATED.filter((g) => g.kind === "howto")) {
    const html = read(p.file);
    const blocks = ldBlocks(html);
    assert.deepEqual(blocks.map((b) => b["@type"]), ["HowTo", "BreadcrumbList"], p.file);
    const [howto, crumbs] = blocks;
    assert.equal(howto.url, p.url);
    assert.equal(howto.name, M[p.lang].howto_seo_title);
    assert.deepEqual(howto.step.map((s) => s.name), [1, 2, 3, 4].map((i) => M[p.lang][`flow${i}_h3`]));
    checkSoftwareApp(howto.about, p.lang, p.file);
    assert.deepEqual(crumbs.itemListElement.map((i) => i.item), ["https://ramune441.github.io/", pageURL(p.lang, ""), p.url]);
    // 本文はその言語で生成済み（実行時に訳さない）
    assert.match(html, new RegExp(`data-lp-lang="${p.lang}"|<html lang="en"`));
    assert.ok(html.includes(`<li data-from="0"`), `${p.file} の手順が書き出されている`);
    assert.ok(html.includes(esc(M[p.lang].flow1_h3)), p.file);
  }
});

// ── 画像の alt ────────────────────────────────────────────────────
test("すべての img に alt がある（生成ページ・プライバシー・アンケート・問い合わせ・辞書の HTML）", () => {
  const files = [...GENERATED.map((p) => p.file), ...["privacy-policy.html", "uninstall.html", "contact.html"].map((f) => join(DIR, f))];
  for (const f of files) {
    for (const tag of read(f).match(/<img\b[^>]*>/g) || []) assert.match(tag, /\salt=["']/, `${f}: ${tag}`);
  }
  for (const l of LANGS) for (const [k, v] of Object.entries(M[l])) {
    for (const tag of String(v).match(/<img\b[^>]*>/g) || []) assert.match(tag, /\salt=["']/, `${l}.${k}`);
  }
  // LP のデモ内のアイコンは各言語の alt
  for (const l of LANGS) {
    const html = read(pageFile(l, "index.html"));
    assert.equal(html.split(`alt="${M[l].img_logo_alt.replace(/"/g, "&quot;")}" data-i18n-alt="img_logo_alt"`).length - 1, 2, l);
  }
});

// ── title / description ───────────────────────────────────────────
// 検索語（spec/product.md）: ja は敬語・ビジネスメール・書き換え・返信・定型文、他は AI 書き換え・メール返信・テキスト展開/テンプレート
const TERMS = {
  en: [/rewrite/i, /reply/i, /text expander/i],
  ja: [/敬語/, /ビジネスメール/, /書き換え/, /返信/, /定型文/],
  zh: [/改写/, /邮件回复/, /文本扩展|模板/],
  "zh-TW": [/改寫/, /回覆/, /常用語|範本/],
  ko: [/다듬기|교정/, /답장/, /상용구/],
  es: [/reescrib/i, /correo/i, /plantilla|expansor/i],
  fr: [/reformul/i, /e-mail|réponse/i, /expanseur|modèle/i],
  de: [/umschreib|formuliert um/i, /E-Mail|Antwort/i, /Textbaustein/i],
  pt: [/reescrev/i, /e-mail/i, /modelo|expansor/i],
  it: [/riformul|riscriv/i, /email|rispost/i, /text expander|modell/i],
  nl: [/herschrijv/i, /e-mail|antwoord/i, /tekstexpander|sjablo/i],
  pl: [/parafraz|przeredag/i, /e-mail|odpowied/i, /szablon|text expander/i],
  ru: [/рерайт|перефраз|перепиш/i, /письм/i, /шаблон/i],
  tr: [/yeniden yaz/i, /e-posta/i, /şablon|metin genişletici/i],
  vi: [/viết lại/i, /email/i, /gõ tắt|mẫu câu/i],
  th: [/รีไรท์/, /อีเมล/, /ข้อความสำเร็จรูป/],
  hi: [/पुनर्लेखन|दोबारा लिख/, /ईमेल/, /एक्सपैंडर/],
  bn: [/রিরাইট/, /ইমেইল/, /এক্সপ্যান্ডার/],
  id: [/tulis ulang/i, /email/i, /template/i],
  ar: [/صياغ/, /البريد|الرد/, /قوالب/],
};

test("title は 60 字（日中韓は 32 字）、description は 155 字（日中韓は 90 字）以内で、LP は検索語を含む", () => {
  for (const l of LANGS) {
    const [T, D] = CJK.has(l) ? [32, 90] : [60, 155];
    const m = M[l];
    for (const k of ["seo_title", "howto_seo_title"]) assert.ok(len(m[k]) <= T, `${l}.${k} が ${len(m[k])} 字`);
    for (const k of ["seo_desc", "howto_seo_desc"]) assert.ok(len(m[k]) <= D, `${l}.${k} が ${len(m[k])} 字`);
    assert.ok(m.seo_title.includes("SendReady") && m.howto_seo_title.includes("SendReady"), l);
    for (const re of TERMS[l]) assert.match(m.seo_title + " " + m.seo_desc, re, `${l} の LP に検索語 ${re}`);
  }
  for (const p of GENERATED) {
    const html = read(p.file);
    const m = M[p.lang];
    assert.equal(unesc(titleOf(html)), p.kind === "lp" ? m.seo_title : m.howto_seo_title, p.file);
    const desc = unesc(html.match(/<meta name="description" content="([^"]*)">/)[1]);
    assert.equal(desc, p.kind === "lp" ? m.seo_desc : m.howto_seo_desc, p.file);
  }
});

// ── 偽の DOM でページのスクリプトを動かす ──────────────────────────
function runPage(file, search, { preload = [], storage = null } = {}) {
  const html = read(join(DIR, file));
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const els = {};
  const el = (id) => (els[id] ||= {
    id, value: "", hidden: false, textContent: "", innerHTML: "", style: {}, files: [], attrs: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    addEventListener() {}, focus() {}, reportValidity() { return true; }, querySelectorAll() { return []; },
  });
  const ctx = {
    document: {
      documentElement: { lang: "en", dir: "ltr", getAttribute() { return null; }, hasAttribute() { return false; } },
      readyState: "complete", title: "", addEventListener() {},
      getElementById: el, querySelectorAll: () => [], querySelector: () => null,
    },
    location: { search, href: "https://ramune441.github.io/sendready-chrome/" + file + search },
    navigator: { language: "en-US" },
    localStorage: { getItem: () => storage, setItem() {} },
    URLSearchParams, console,
    scrollTo() {},
    fetch: () => { throw new Error("送信してはいけない"); },
  };
  ctx.window = ctx; // gtag の window.dataLayer を大域に置く
  vm.createContext(ctx);
  for (const p of preload) vm.runInContext(read(join(DIR, p)), ctx);
  for (const s of inline) vm.runInContext(s, ctx);
  return { ctx, el };
}
const optionCount = (sel) => (sel.innerHTML.match(/<option /g) || []).length;

// ── アンインストールアンケート ──────────────────────────────────────
test("アンケートは HEAD と同じ送信先・項目名・英語の選択値・noindex・詳細必須を保つ", () => {
  let before;
  try {
    before = execFileSync("git", ["show", "HEAD:sendready-chrome/uninstall.html"], { cwd: REPO, encoding: "utf8" });
  } catch {
    return; // git が無い環境では比較しない
  }
  const now = read(join(DIR, "uninstall.html"));
  const endpoint = (s) => s.match(/var ENDPOINT = '([^']+)'/)[1];
  const names = (s) => [...new Set([...s.matchAll(/\sname="([^"]+)"/g)].map((m) => m[1]).filter((n) => !["description", "robots", "viewport"].includes(n)))].sort();
  const hidden = (s) => [...s.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
  const reasons = (s) => [...s.matchAll(/name="reasons" value="([^"]+)"/g)].map((m) => m[1]);
  const diag = (s) => s.match(/\[('v'[^\]]*)\]\.forEach/)[1];
  assert.equal(endpoint(now), endpoint(before));
  assert.equal(endpoint(now), "https://contact-api.warload57.workers.dev/");
  assert.deepEqual(names(now), names(before));
  assert.deepEqual(hidden(now), hidden(before));
  assert.deepEqual(reasons(now), reasons(before));
  assert.equal(diag(now), diag(before));
  assert.match(now, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(now, /if \(!details\.value\.trim\(\)\) \{\s*showError\(msgs\.un_details_required\)/);
  assert.match(now, /<textarea id="f-details" name="content"/);
});

test("アンケートは 20 言語で、拡張が渡す言語コードをそれぞれ表示し、診断値を hidden に入れる", () => {
  for (const code of EXT_LANGS) {
    const { ctx, el } = runPage("uninstall.html", `?v=1.2.1&lang=${code}&days=3&uses=7&err=net`);
    assert.equal(ctx.document.documentElement.lang, toSite(code), code);
    assert.equal(ctx.document.documentElement.dir, code === "ar" ? "rtl" : "ltr", code);
    assert.equal(el("f-language").value, code, "language は拡張の言語コードのまま");
    assert.equal(el("f-diagnostics").value, "v=1.2.1, days=3, uses=7, err=net");
    assert.equal(optionCount(el("lang-select")), 20);
  }
  // 対応外の言語は英語、拡張以外の経路（?lang= 無し）はブラウザ言語
  assert.equal(runPage("uninstall.html", "?lang=sv").ctx.document.documentElement.lang, "en");
  const html = read(join(DIR, "uninstall.html"));
  const keys = [...html.matchAll(/data-i18n(?:-ph)?="(\w+)"/g)].map((m) => m[1]);
  // 既定の HTML は en と同じ文字列（placeholder 含む）
  const en = JSON.parse(JSON.stringify(vm.runInNewContext(`(${html.match(/var MESSAGES = (\{[\s\S]*?\n {6}\});/)[1]})`)));
  assert.equal(Object.keys(en).length, 20);
  for (const l of Object.keys(en)) assert.deepEqual(Object.keys(en[l]).sort(), Object.keys(en.en).sort(), l);
  for (const k of new Set(keys)) assert.ok(en.en[k], k);
  for (const m of html.matchAll(/data-i18n="(\w+)"[^>]*>([^<]*)</g)) assert.equal(unesc(m[2]), en.en[m[1]], m[1]);
  for (const m of html.matchAll(/data-i18n-ph="(\w+)" placeholder="([^"]*)"/g)) assert.equal(unesc(m[2]), en.en[m[1]], m[1]);
});

// ── プライバシーポリシー ───────────────────────────────────────────
function loadPrivacy() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read(join(DIR, "privacy-i18n.js")) + "\n;this.P = PRIVACY_MESSAGES;", ctx);
  return JSON.parse(JSON.stringify(ctx.P));
}

test("プライバシーポリシーは 20 言語・同じキーと HTML 構造で、既定文は英語（正本）と一致する", () => {
  const P = loadPrivacy();
  assert.deepEqual(Object.keys(P).sort(), [...LANGS].sort());
  const keys = Object.keys(P.en).sort();
  const tags = (s) => (s.match(/<\/?(li|strong|code|a)\b/g) || []).sort().join();
  const hrefs = (s) => (s.match(/href="[^"]*"/g) || []).join();
  for (const l of Object.keys(P)) {
    assert.deepEqual(Object.keys(P[l]).sort(), keys, l);
    for (const k of keys) {
      if (k !== "pp_notice") assert.ok(P[l][k], `${l}.${k}`);
      assert.equal(tags(P[l][k]), tags(P.en[k]), `${l}.${k} のタグ`);
      assert.equal(hrefs(P[l][k]), hrefs(P.en[k]), `${l}.${k} のリンク`);
    }
    if (l !== "en") assert.ok(P[l].pp_notice, `${l} は英語版が優先する旨を出す`);
  }
  const html = read(join(DIR, "privacy-policy.html"));
  let n = 0;
  for (const m of html.matchAll(/<(p|h1|h2|ul|a)\b[^>]*\sdata-i18n(-html)?="(\w+)"[^>]*>([\s\S]*?)<\/\1>/g)) {
    assert.equal(m[2] ? m[4] : unesc(m[4]), P.en[m[3]], m[3]);
    n++;
  }
  assert.equal(n, keys.length - 1, "pp_meta_title 以外のキーは本文にある");
  assert.match(html, /<link rel="canonical" href="https:\/\/ramune441\.github\.io\/sendready-chrome\/privacy-policy\.html">/);
  assert.match(html, /<meta name="description" content="[^"]{50,155}">/);
  for (const og of ["og:title", "og:description", "og:type", "og:url", "og:image", "og:locale", "og:site_name"]) assert.ok(html.includes(`property="${og}"`), og);
  for (const b of ldBlocks(html)) assert.ok(b["@type"]);
});

test("プライバシーポリシーは拡張の権限・送信先と一致する", () => {
  const P = loadPrivacy();
  const manifestPath = join(EXT, "manifest.json");
  if (!existsSync(manifestPath)) return;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const perm of manifest.permissions) assert.ok(P.en.pp_l6.includes(`<strong>${perm}</strong>`), perm);
  assert.equal((P.en.pp_l6.match(/<li>/g) || []).length, manifest.permissions.length + 2, "権限＋コンテンツスクリプト＋ホスト権限だけ");
  for (const host of manifest.host_permissions) assert.ok(P.en.pp_p2.includes(host.replace(/\/\*$/, "")), host);
});

test("プライバシーポリシーは ?lang= の言語コードで表示言語を選ぶ", () => {
  for (const code of EXT_LANGS) {
    const { ctx, el } = runPage("privacy-policy.html", `?lang=${code}`, { preload: ["privacy-i18n.js"] });
    assert.equal(ctx.document.documentElement.lang, code === "en" ? "en" : toSite(code), code);
    assert.equal(optionCount(el("lang-select")), 20);
  }
  assert.equal(runPage("privacy-policy.html", "", { preload: ["privacy-i18n.js"], storage: "ko" }).ctx.document.documentElement.lang, "ko");
});

// ── 問い合わせ ────────────────────────────────────────────────────
test("問い合わせは 20 言語で、拡張の言語コードを受け付ける", () => {
  for (const code of EXT_LANGS) {
    const { ctx, el } = runPage("contact.html", `?lang=${code}&v=1.2.1`);
    assert.equal(ctx.document.documentElement.lang, toSite(code), code);
    assert.equal(optionCount(el("lang-select")), 20);
    assert.equal(el("f-diagnostics").value, "v=1.2.1");
  }
});
