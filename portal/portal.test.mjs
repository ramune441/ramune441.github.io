// node --test portal/
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { loadMessages, buildPage, pagePath, pageURL } from "./build.mjs";

const M = loadMessages();
const LANGS = ["en", "ja", "zh", "zh-TW", "ko", "es", "fr", "de", "pt", "hi", "id", "ar", "it", "nl", "pl", "ru", "tr", "vi", "th", "bn"];
// 検索結果の表示幅の目安: 全角（漢字・かな・ハングル）を 2、それ以外を 1 と数える
const width = (s) => [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-鿿가-힯＀-￯]/.test(c) ? 2 : 1), 0);

test("20 言語すべてに全キーがあり、空でない", () => {
  assert.deepEqual(Object.keys(M).sort(), [...LANGS].sort());
  const keys = Object.keys(M.en).sort();
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(M[l]).sort(), keys, l);
    for (const k of keys) assert.ok(String(M[l][k]).trim(), `${l}.${k} が空`);
  }
});

test("title と description が検索結果で切れない長さ", () => {
  for (const l of LANGS) {
    assert.ok(width(M[l].t) <= 64, `${l} title 幅 ${width(M[l].t)}`);
    assert.ok(width(M[l].d) <= 180, `${l} description 幅 ${width(M[l].d)}`);
  }
});

test("SubDuo を『完全ローカル／何も送らない』と書かない", () => {
  for (const l of LANGS) assert.doesNotMatch(JSON.stringify(M[l]), /完全ローカル|何も送らない|100% local|nothing leaves/i, l);
});

test("生成物が最新（再生成しても差分が無い）", () => {
  for (const l of LANGS) {
    assert.ok(existsSync(pagePath(l)), `${l} のページが無い`);
    assert.equal(readFileSync(pagePath(l), "utf8"), buildPage(l, M), `${l} が古い。node portal/build.mjs を実行する`);
  }
});

test("canonical・hreflang（20 言語＋x-default）・JSON-LD・lang/dir", () => {
  for (const l of LANGS) {
    const html = buildPage(l, M);
    assert.match(html, new RegExp(`<link rel="canonical" href="${pageURL(l)}">`), l);
    assert.equal((html.match(/<link rel="alternate" hreflang=/g) || []).length, 21, l);
    assert.match(html, new RegExp(`<html lang="${l}" dir="${l === "ar" ? "rtl" : "ltr"}"`), l);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, l);
    const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((x) => JSON.parse(x[1]));
    const list = lds.find((o) => o["@type"] === "ItemList");
    assert.equal(list.itemListElement.length, 8, l);
    for (const e of list.itemListElement) assert.ok(e.item.name && e.item.url && e.item.description, l);
  }
});

test("sitemap.xml: 正しい XML で、載せた URL と hreflang の先がすべてインデックス可能なページ", () => {
  const xml = readFileSync(new URL("../sitemap.xml", import.meta.url), "utf8");
  // XML のコメントに "--" を書くと文書全体が不正になり、Search Console が読めない
  for (const c of xml.matchAll(/<!--([\s\S]*?)-->/g)) assert.ok(!c[1].includes("--"), `コメントに -- がある: ${c[0]}`);
  assert.equal((xml.match(/<url>/g) || []).length, (xml.match(/<\/url>/g) || []).length);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(new Set(locs).size, locs.length, "重複した <loc>");
  const urls = new Set([...locs, ...[...xml.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)].map((m) => m[1])]);
  for (const u of urls) {
    assert.ok(u.startsWith("https://ramune441.github.io/"), u);
    let path = u.slice("https://ramune441.github.io/".length);
    if (!path || path.endsWith("/")) path += "index.html";
    const file = new URL(`../${path}`, import.meta.url);
    assert.ok(existsSync(file), `ページが無い: ${u}`);
    const html = readFileSync(file, "utf8");
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/, `noindex: ${u}`);
    if (locs.includes(u)) assert.match(html, new RegExp(`rel="canonical" href="${u.replace(/[.?]/g, "\\$&")}"`), `canonical: ${u}`);
  }
});

test("llms.txt のリンク先がこのサイトに実在する", () => {
  const txt = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
  for (const [, u] of txt.matchAll(/\]\((https:\/\/ramune441\.github\.io\/[^)]*)\)/g)) {
    let path = u.slice("https://ramune441.github.io/".length);
    if (!path || path.endsWith("/")) path += "index.html";
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), u);
  }
});

test("カードのリンクはその言語のプロダクトページがあればそこへ向く", () => {
  const html = buildPage("ja", M);
  assert.match(html, /href="\/kura\/ja\/"/);
  const en = buildPage("en", M);
  assert.match(en, /href="\/kura\/"/);
  assert.match(buildPage("zh-TW", M), /href="\/formpilot\/zh-Hant\/"/);
});
