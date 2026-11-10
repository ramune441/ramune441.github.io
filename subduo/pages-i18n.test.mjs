// SubDuo の問い合わせ・アンインストールアンケート・プライバシーポリシーの20言語と送信内容を確かめる。
// 送信は確かめない（本物の contact-api へ送らない）。フォームの項目は20言語化の前の版と突き合わせる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LANGS = ['en', 'ja', 'zh', 'zh-TW', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'hi', 'id', 'ar', 'vi', 'tr', 'pl', 'th', 'nl', 'bn'];
const ENDPOINT = 'https://contact-api.warload57.workers.dev/';
// 20言語化の前の版（フォームの項目・送信先・選択肢の正規値の基準）
const BASELINE = 'b27c7f0';

const read = (name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
function baseline(name) {
  try {
    return execFileSync('git', ['show', `${BASELINE}:subduo/${name}`], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

// ページの <script> から `var NAME = {...};` を取り出して評価する
function objectLiteral(html, name) {
  const start = html.indexOf(`var ${name} = `);
  assert.ok(start !== -1, `${name} が無い`);
  const end = html.indexOf('\n      };', start);
  return Function(`return (${html.slice(start + `var ${name} = `.length, end + '\n      }'.length)});`)();
}

// ページの normalize(raw) を取り出して、対応言語の一覧つきで使えるようにする
function normalizer(html, supported) {
  const m = html.match(/function normalize\(raw\) \{[\s\S]*?\n      \}/);
  assert.ok(m, 'normalize が無い');
  return Function('SUPPORTED', `${m[0]}; return normalize;`)(supported);
}

// 拡張が渡す言語タグ（popup は zh-CN / pt-BR、アンインストールは chrome.i18n.getUILanguage()）と、ブラウザ言語の揺れ
const LANG_CASES = {
  en: 'en', 'en-US': 'en', ja: 'ja', 'zh-CN': 'zh', zh_CN: 'zh', 'zh-Hans': 'zh', 'zh-SG': 'zh', 'zh-TW': 'zh-TW', zh_TW: 'zh-TW',
  'zh-HK': 'zh-TW', 'zh-Hant-HK': 'zh-TW', 'pt-BR': 'pt', pt_BR: 'pt', 'pt-PT': 'pt', 'es-419': 'es', 'ar-EG': 'ar',
  id: 'id', vi: 'vi', tr: 'tr', pl: 'pl', th: 'th', nl: 'nl', bn: 'bn', 'bn-IN': 'bn', hi: 'hi', fil: '', '': '',
};

function fields(html) {
  const out = new Set();
  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    const name = m[0].match(/\bname="([^"]+)"/);
    if (!name) continue;
    const type = m[0].match(/\btype="([^"]+)"/);
    out.add(`${m[1]}:${type ? type[1] : ''}:${name[1]}`);
  }
  return out;
}
const hiddenValues = (html) => Object.fromEntries([...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)"/g)].map((m) => [m[1], m[2]]));
function selectValues(html, name) {
  const m = html.match(new RegExp(`<select[^>]*name="${name}"[^>]*>([\\s\\S]*?)</select>`));
  assert.ok(m, `select ${name}`);
  return [...m[1].matchAll(/<option value="([^"]*)"/g)].map((o) => o[1]);
}
const checkboxValues = (html, name) => [...html.matchAll(new RegExp(`<input type="checkbox" name="${name}" value="([^"]*)"`, 'g'))].map((m) => m[1]);
const endpoint = (html) => (html.match(/var ENDPOINT = '([^']+)'/) || [])[1];
const keysInMarkup = (html) => new Set([...html.matchAll(/data-i18n(?:-ph|-aria)?="([^"]+)"/g)].map((m) => m[1]));
const isCanonical = (v) => /^[\x20-\x7E]+$/.test(v) && v.trim() === v;

for (const page of ['contact.html', 'uninstall.html']) {
  const html = read(page);

  test(`${page}: 20言語すべてが英語と同じキーを空でない文字列で持つ`, () => {
    const messages = objectLiteral(html, 'MESSAGES');
    assert.deepEqual(Object.keys(messages), LANGS);
    const keys = Object.keys(messages.en).sort();
    for (const lang of LANGS) {
      assert.deepEqual(Object.keys(messages[lang]).sort(), keys, `${lang}: キーが英語と違う`);
      for (const [k, v] of Object.entries(messages[lang])) assert.ok(typeof v === 'string' && v.trim(), `${lang}.${k} が空`);
    }
    for (const key of keysInMarkup(html)) assert.ok(key in messages.en, `HTML の ${key} が辞書に無い`);
    // 未翻訳のまま英語を流用していない（固定の placeholder・送信中表示などの短い語は除く）
    for (const lang of LANGS.filter((l) => l !== 'en')) {
      const same = Object.keys(messages.en).filter((k) => messages[lang][k] === messages.en[k] && messages.en[k].length > 12 && !/@/.test(messages.en[k]));
      assert.deepEqual(same, [], `${lang}: 英語のまま`);
    }
    for (const [lang, script] of Object.entries({ ar: /\p{Script=Arabic}/u, th: /\p{Script=Thai}/u, bn: /\p{Script=Bengali}/u, hi: /\p{Script=Devanagari}/u })) {
      assert.ok(Object.values(messages[lang]).join('').match(new RegExp(script.source, 'gu')).length > 200, `${lang}: 文字体系`);
    }
  });

  test(`${page}: 言語の選択肢と言語タグの正規化が拡張の20言語に揃う`, () => {
    assert.deepEqual(Object.keys(objectLiteral(html, 'LANG_NAMES')), LANGS);
    const normalize = normalizer(html, LANGS);
    for (const [raw, want] of Object.entries(LANG_CASES)) assert.equal(normalize(raw), want, raw);
    // 表示言語に合わせて文字方向・言語属性を切り替える（アラビア語だけ右から左）
    assert.match(html, /document\.documentElement\.dir = locale === 'ar' \? 'rtl' : 'ltr'/);
    assert.match(html, /document\.documentElement\.lang = locale/);
    assert.match(html, /<html lang="en" dir="ltr">/);
  });

  test(`${page}: 画像はすべて alt を持つ`, () => {
    for (const img of html.match(/<img\b[^>]*>/g) || []) assert.match(img, /\balt="/, img);
  });

  test(`${page}: 送信先・項目名・hidden の値・選択肢の正規値が20言語化の前と同じ`, (t) => {
    const before = baseline(page);
    if (!before) return t.skip(`${BASELINE} を読めない（浅いクローンなど）`);
    assert.equal(endpoint(html), ENDPOINT);
    assert.equal(endpoint(html), endpoint(before));
    assert.match(html, /fetch\(ENDPOINT, \{ method: 'POST', body: /);
    assert.deepEqual([...fields(html)].sort(), [...fields(before)].sort());
    assert.deepEqual(hiddenValues(html), hiddenValues(before));
    assert.ok(!/name="botcheck"[^>]*value=/.test(html), 'ハニーポットは空のまま');
  });
}

test('contact.html: 選択肢は英語の正規値で、従来の値を保ち、対応5サイトを選べる', (t) => {
  const html = read('contact.html');
  const category = selectValues(html, 'category');
  assert.deepEqual(category, ['Bug Report', 'Feature Request', 'Other']);
  const app = selectValues(html, 'app');
  for (const v of [...category, ...app]) assert.ok(isCanonical(v), v);
  for (const site of ['Prime Video', 'YouTube', 'Netflix', 'Disney+', 'TED']) assert.ok(app.includes(site), site);
  // 送信時は表示中の言語を language に入れる（翻訳した文字列は送らない）
  assert.match(html, /data\.set\('language', locale\)/);
  const before = baseline('contact.html');
  if (!before) return t.skip('基準の版を読めない');
  for (const v of selectValues(before, 'app')) assert.ok(app.includes(v), `従来の値 ${v} が消えた`);
  assert.deepEqual(selectValues(before, 'category'), category);
});

test('contact.html: 検索向けの head（title・description・canonical・OGP・index）を持つ', () => {
  const html = read('contact.html');
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{60,}">/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/ramune441\.github\.io\/subduo\/contact\.html">/);
  for (const p of ['og:title', 'og:description', 'og:type', 'og:image', 'og:locale', 'og:site_name']) assert.match(html, new RegExp(`<meta property="${p}" content="[^"]+">`), p);
  assert.match(html, /<meta property="og:url" content="https:\/\/ramune441\.github\.io\/subduo\/contact\.html">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  // プライバシーポリシーは表示中の言語で開く
  assert.match(html, /'privacy-policy\.html\?lang=' \+ encodeURIComponent\(locale\)/);
  // 診断は v / days / err を hidden の diagnostics にまとめる
  assert.match(html, /\['v', 'days', 'err'\]/);
});

test('uninstall.html: noindex のまま、匿名の診断 hidden と必須の詳細欄を保つ', () => {
  const html = read('uninstall.html');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<input type="hidden" name="language" value="en" id="f-language">/);
  assert.match(html, /<input type="hidden" name="diagnostics" id="f-diagnostics">/);
  assert.match(html, /\['v', 'days', 'err'\]/);
  assert.match(html, /<textarea id="f-details" name="content" maxlength="5000"/);
  assert.match(html, /if \(!details\.value\.trim\(\)\) \{\s*showError\(msgs\.un_details_required\)/);
  assert.match(html, /if \(!form\.querySelectorAll\('input\[name="reasons"\]:checked'\)\.length\)/);
  const reasons = checkboxValues(html, 'reasons');
  assert.equal(reasons.length, 7);
  for (const v of reasons) assert.ok(isCanonical(v), v);
  const before = baseline('uninstall.html');
  if (before) assert.deepEqual(reasons, checkboxValues(before, 'reasons'));
});
