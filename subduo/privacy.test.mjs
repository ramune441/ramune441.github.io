import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const html = readFileSync(new URL('./privacy-policy.html', import.meta.url), 'utf8');

const LANGS = ['en', 'ja', 'zh', 'zh-TW', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'hi', 'id', 'ar', 'vi', 'tr', 'pl', 'th', 'nl', 'bn'];
// 拡張 manifest.json（v1.8.1）の permissions。拡張のリポジトリが隣にあれば実物と照合する
const PERMISSIONS = ['storage', 'scripting', 'sidePanel'];
// 各言語の「AIに聞く」ボタンの文言（拡張 _locales の cardAskAi。ポリシーは同じ語で案内する）
const ASK_AI = {
  en: 'Ask AI', ja: 'AIに聞く', zh: '询问 AI', 'zh-TW': '詢問 AI', ko: 'AI에게 묻기', es: 'Preguntar a la IA', fr: 'Demander à l’IA',
  de: 'KI fragen', it: 'Chiedi all’IA', pt: 'Perguntar à IA', ru: 'Спросить ИИ', hi: 'AI से पूछें', id: 'Tanya AI',
  ar: 'اسأل الذكاء الاصطناعي', vi: 'Hỏi AI', tr: 'Yapay zekâya sor', pl: 'Zapytaj AI', th: 'ถาม AI', nl: 'Vraag AI', bn: 'AI-কে জিজ্ঞাসা',
};
const SECTIONS = ['device', 'ai', 'use', 'perm', 'choices', 'contact'];
// 「完全ローカル・何も送らない」とは書かない（語句を調べると解説サーバーへ送るため）
const FORBIDDEN = /has no server|collects nothing|sends nothing|100% local|fully local|completely local|サーバーはありません|何も送信せず|完全ローカル/i;

// data-lang ごとの本文ブロック
const blocks = Object.fromEntries(
  [...html.matchAll(/<div class="container(?: on)?" data-lang="([\w-]+)"[^>]*>([\s\S]*?)\n  <\/div>/g)].map((m) => [m[1], { open: m[0].slice(0, m[0].indexOf('>') + 1), body: m[2] }]),
);
// タグの骨組み（要素名と class / data-sec / data-perm の並び）。文言以外の構成が英語と同じかを見る
const skeleton = (body) => [...body.matchAll(/<(\/?)(\w+)([^>]*)>/g)].map((m) => {
  const attrs = ['class', 'data-sec', 'data-perm'].map((a) => (m[3].match(new RegExp(`${a}="([^"]*)"`)) || [])[0]).filter(Boolean).join(' ');
  return `${m[1]}${m[2]}${attrs ? ` ${attrs}` : ''}`;
}).join(',');

test('両言語で現行5サイト・端末内保存・任意AIの送信先と識別子を開示する', () => {
  const parts = [blocks.en.body, blocks.ja.body];
  for (const part of parts) {
    for (const term of ['Prime Video', 'YouTube', 'Netflix', 'Disney+', 'TED', 'chrome.storage.sync', 'chrome.storage.local', 'sidePanel', 'subduo-explain.warload57.workers.dev', 'Cloudflare', 'OpenAI', 'IP']) assert.ok(part.includes(term), term);
    assert.match(part, /Ask AI|AIに聞く/);
    assert.match(part, /24/);
    assert.match(part, /30/);
    assert.ok(part.includes('https://developers.openai.com/api/docs/guides/your-data'));
    assert.ok(!/has no server|collects nothing|sends nothing|サーバーはありません|何も送信せず/.test(part));
  }
});

test('公開ポリシーのURLと言語切替を保ち、古い外部送信なしのSEO説明を残さない', () => {
  assert.ok(html.includes('https://ramune441.github.io/subduo/privacy-policy.html'));
  assert.match(html, /data-set="en"/);
  assert.match(html, /data-set="ja"/);
  assert.ok(!/runs entirely in the browser: no server/.test(html));
});

test('20言語すべてが同じ構成の本文を持ち、各言語の選択肢がある', () => {
  assert.deepEqual(Object.keys(blocks), LANGS);
  assert.match(blocks.en.open, /class="container on"/, '静的HTMLでは英語を表示');
  const base = skeleton(blocks.en.body);
  const options = [...html.matchAll(/<option value="([\w-]+)" data-set="\1"/g)].map((m) => m[1]);
  assert.deepEqual(options, LANGS);
  for (const lang of LANGS) {
    const { open, body } = blocks[lang];
    assert.equal(skeleton(body), base, `${lang}: 構成が英語と違う`);
    assert.deepEqual([...body.matchAll(/<h2 data-sec="(\w+)">(\d)\. \S/g)].map((m) => m[1]), SECTIONS, `${lang}: 6節`);
    assert.match(open, new RegExp(`dir="${lang === 'ar' ? 'rtl' : 'ltr'}"`), `${lang}: 文字方向`);
    assert.match(open, /lang="[\w-]+"/, `${lang}: lang 属性`);
    assert.match(body, new RegExp(`<a href="index\\.html${lang === 'en' ? '' : `\\?lang=${lang}`}" class="back">`), `${lang}: LP へ同じ言語で戻る`);
    // 空の要素を残さない（翻訳漏れ）
    for (const m of body.matchAll(/<(h1|h2|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) assert.ok(m[2].replace(/<[^>]+>/g, '').trim(), `${lang}: 空の ${m[1]}`);
  }
});

test('20言語すべてが送信先・保存先・期間・権限を同じ事実で開示し、「何も送らない」と書かない', () => {
  for (const lang of LANGS) {
    const { body } = blocks[lang];
    for (const term of ['Prime Video', 'YouTube', 'Netflix', 'Disney+', 'TED', 'Amazon', '<code>chrome.storage.sync</code>', '<code>chrome.storage.local</code>', '<code>subduo-explain.warload57.workers.dev</code>', 'Cloudflare', 'OpenAI', 'IP', 'Google', '🔊', 'mailto:warload57@gmail.com', 'https://www.cloudflare.com/privacypolicy/', 'https://developers.openai.com/api/docs/guides/your-data']) {
      assert.ok(body.includes(term), `${lang}: ${term}`);
    }
    assert.ok(body.includes(ASK_AI[lang]), `${lang}: 「${ASK_AI[lang]}」`);
    for (const n of ['200', '24', '30']) assert.ok(new RegExp(`(^|\\D)${n}(\\D|$)`).test(body), `${lang}: ${n}`);
    assert.match(body, /1[,. ]?000/, `${lang}: 1,000`);
    assert.match(body, /2026/, `${lang}: 更新日`);
    assert.ok(!FORBIDDEN.test(body), `${lang}: 外部送信なしの表現`);
    // 権限の節は manifest の permissions と対応サイトへのアクセスだけを並べる
    const perms = [...body.matchAll(/<li data-perm="(\w+)"><strong>([^<]+)<\/strong>/g)];
    assert.deepEqual(perms.map((m) => m[1]), [...PERMISSIONS, 'host'], `${lang}: 権限の並び`);
    for (const m of perms.slice(0, -1)) assert.equal(m[2], m[1], `${lang}: 権限名は manifest の表記のまま`);
  }
});

test('権限の一覧は拡張の manifest.json と一致する', (t) => {
  const path = process.env.SUBDUO_EXT ? `${process.env.SUBDUO_EXT}/manifest.json` : new URL('../../SubDuo/manifest.json', import.meta.url);
  if (!existsSync(path)) return t.skip('拡張のリポジトリが隣に無い（SUBDUO_EXT で指定できる）');
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  assert.deepEqual(manifest.permissions, PERMISSIONS);
  const hosts = manifest.host_permissions.join(' ');
  for (const host of ['primevideo.com', 'amazon.', 'youtube.com', 'netflix.com', 'disneyplus.com', 'ted.com']) assert.ok(hosts.includes(host), host);
});

test('検索向けの head と、表示言語に合わせた lang・dir・title の切替を持つ', () => {
  assert.match(html, /<html lang="en" dir="ltr">/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(html, /<meta name="description" content="[^"]{60,}">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/ramune441\.github\.io\/subduo\/privacy-policy\.html">/);
  for (const p of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:locale', 'og:site_name']) assert.match(html, new RegExp(`<meta property="${p}" content="[^"]+">`), p);
  assert.match(html, /document\.documentElement\.lang = block\.getAttribute\('lang'\)/);
  assert.match(html, /document\.documentElement\.dir = block\.getAttribute\('dir'\)/);
  for (const img of html.match(/<img\b[^>]*>/g) || []) assert.match(img, /\balt="/, img);
  // ?lang= の言語タグ（拡張は zh-CN / zh-TW / pt-BR、_locales 名も可）を20言語へ寄せる
  const fn = html.match(/function normalize\(raw\) \{[\s\S]*?\n      \}/)[0];
  const normalize = Function('SUPPORTED', `${fn}; return normalize;`)(LANGS);
  const cases = { ja: 'ja', JA: 'ja', 'en-GB': 'en', 'zh-CN': 'zh', zh_CN: 'zh', 'zh-TW': 'zh-TW', zh_TW: 'zh-TW', 'zh-HK': 'zh-TW', 'zh-Hant': 'zh-TW', 'pt-BR': 'pt', pt_BR: 'pt', 'es-419': 'es', ar: 'ar', th: 'th', bn: 'bn', xx: '', '': '' };
  for (const [raw, want] of Object.entries(cases)) assert.equal(normalize(raw), want, raw);
});
