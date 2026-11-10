import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  LANGS, APP_LANGS, PLAY, HTML_KEYS, loadDicts, loadPp, loadContact, buildAll, outputPath, pageUrl, imageDir,
  videoOf, limitOf, updateSitemap,
} from './build-lp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
// loadDicts/loadPp/loadContact は、キーの過不足・空の値・許されない HTML で止まる
const dicts = loadDicts(), pp = loadPp(), contact = loadContact();
const page = code => fs.readFileSync(outputPath(code), 'utf8');
const decode = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const codes = LANGS.map(l => l.code);

test('LP, privacy policy and contact each have all 20 languages with complete keys', () => {
  assert.equal(LANGS.length, 20);
  for (const dir of ['lp-i18n', 'pp-i18n', 'contact-i18n']) {
    assert.deepEqual(fs.readdirSync(path.join(here, dir)).map(f => f.replace('.json', '')).sort(), [...codes].sort(), dir);
  }
  for (const set of [dicts, pp, contact]) assert.deepEqual(Object.keys(set).sort(), [...codes].sort());
});

test('every generated file is fresh (run node ripen/build-lp.mjs)', () => {
  for (const [file, content] of buildAll()) {
    assert.equal(fs.readFileSync(file, 'utf8'), content, path.relative(here, file));
  }
});

test('each language is actually translated, not English left in place', () => {
  for (const [name, set] of [['lp', dicts], ['pp', pp], ['contact', contact]]) {
    const en = set.en;
    for (const code of codes.filter(c => c !== 'en')) {
      const same = Object.keys(en).filter(k => set[code][k] === en[k] && !/^(Ripen|FAQ|Video|Dashboard|example@example\.com)$/.test(en[k]) && !k.endsWith('_tag'));
      assert.ok(same.length <= 3, `${name}/${code}: ${same.length} values identical to English: ${same.join(', ')}`);
    }
  }
});

test('facts and emphasis survive translation', () => {
  for (const code of codes) {
    const d = dicts[code];
    for (const [key, text] of [['hero_note', '8.0'], ['faq8_a', '8.0'], ['concept_sub', '25'], ['faq5_a', '30'], ['feat6_p', '30'], ['note5', '12'], ['feat9_h3', '12'], ['show1_f3', '120']]) {
      assert.ok(d[key].includes(text), `${code}.${key} should contain ${text}: ${d[key]}`);
    }
    for (const key of HTML_KEYS) {
      const spans = s => (s.match(/<span class="(accent|gold|highlight)">/g) || []).join();
      assert.equal(spans(d[key]), spans(dicts.en[key]), `${code}.${key} keeps the same emphasis`);
      assert.doesNotMatch(d[key], /<span class="\w+"><\/span>/, `${code}.${key} has an empty span`);
    }
    assert.match(pp[code].pp_s11_p, /^[^<]*<a href="contact\.html">[^<]+<\/a>[^<]*$/, `${code}.pp_s11_p keeps one contact link`);
    assert.equal(contact[code].contact_email_ph, 'example@example.com');
  }
});

test('titles and descriptions fit search results (≤60/155, CJK ≤32/90) and say what the app is', () => {
  for (const code of codes) {
    const {seo_title: t, seo_desc: d} = dicts[code];
    assert.ok([...t].length <= limitOf(code, 'title'), `${code} title is ${[...t].length} chars: ${t}`);
    assert.ok([...d].length <= limitOf(code, 'desc'), `${code} description is ${[...d].length} chars: ${d}`);
    assert.ok(t.startsWith('Ripen'), `${code} title starts with Ripen`);
    assert.match(t, /Android/, `${code} title says Android`);
  }
});

test('each page: canonical, one h1, localized meta, alt on every image, real Play link, own video and images', () => {
  for (const lang of LANGS) {
    const html = page(lang.code), d = dicts[lang.code], code = lang.code;
    assert.ok(html.includes(`<link rel="canonical" href="${pageUrl(code)}">`), `${code} canonical`);
    assert.ok(html.includes(`<html lang="${lang.hreflang}" dir="${code === 'ar' ? 'rtl' : 'ltr'}"`), `${code} lang/dir`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${code} one h1`);
    assert.equal(decode(html.match(/<title>([^<]+)<\/title>/)[1]), d.seo_title, `${code} title`);
    assert.equal(decode(html.match(/<meta name="description" content="([^"]+)">/)[1]), d.seo_desc, `${code} description`);
    for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt']) assert.match(html, new RegExp(`<meta property="${p}" content="[^"]+">`), `${code} ${p}`);
    assert.ok(html.includes(`<meta property="og:locale" content="${lang.ogLocale}">`), `${code} og:locale`);
    assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'), `${code} twitter card`);
    for (const img of html.match(/<img\b[^>]*>/g)) {
      const alt = img.match(/\balt="([^"]*)"/);
      assert.ok(alt && alt[1].trim(), `${code}: image without alt: ${img}`);
      const src = img.match(/\bsrc="([^"]+)"/)[1];
      assert.ok(fs.existsSync(path.join(path.dirname(outputPath(code)), src)), `${code}: missing image ${src}`);
      assert.ok(src.includes(imageDir(code)), `${code}: ${src} should come from ${imageDir(code)}`);
    }
    if (APP_LANGS.includes(code)) assert.equal(imageDir(code), `images/store/${code}/`, `${code} has its own store images`);
    const plays = html.match(/href="https:\/\/play\.google\.com\/[^"]+"/g) || [];
    assert.ok(plays.length >= 3, `${code} Play links`);
    for (const p of plays) assert.equal(p, `href="${PLAY}&amp;hl=${lang.hl}"`, `${code} Play link`);
    assert.ok(html.includes(`/embed/${videoOf(code)}?`), `${code} video`);
    assert.ok(html.includes(`privacy-policy.html?lang=${code}"`) && html.includes(`contact.html?lang=${code}"`), `${code} footer links`);
    assert.ok(!/data-i18n/.test(html), `${code} needs no runtime translation`);
  }
});

test('hreflang: all 20 + x-default on every page, identical everywhere and reciprocal', () => {
  const expected = [...LANGS.map(l => [l.hreflang, pageUrl(l.code)]), ['x-default', pageUrl('en')]];
  for (const code of codes) {
    const alts = [...page(code).matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m => [m[1], m[2]]);
    assert.deepEqual(alts, expected, `${code} hreflang set`);
  }
  // 各 alternate の先のページは自分自身を canonical にしている（＝相互リンクが成立する）
  for (const [hreflang, url] of expected) {
    const target = LANGS.find(l => pageUrl(l.code) === url);
    assert.ok(target, url);
    assert.ok(page(target.code).includes(`<link rel="canonical" href="${url}">`), `${hreflang} target is canonical`);
    if (hreflang !== 'x-default') assert.equal(target.hreflang, hreflang);
  }
});

test('JSON-LD parses: SoftwareApplication with Play installUrl, FAQPage matching the visible FAQ, BreadcrumbList', () => {
  for (const lang of LANGS) {
    const html = page(lang.code), d = dicts[lang.code];
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const app = blocks.find(b => b['@type'] === 'SoftwareApplication');
    const faq = blocks.find(b => b['@type'] === 'FAQPage');
    const crumbs = blocks.find(b => b['@type'] === 'BreadcrumbList');
    assert.ok(app && faq && crumbs, `${lang.code} has all three`);
    assert.equal(app.name, 'Ripen');
    assert.equal(app.installUrl, PLAY);
    assert.deepEqual(app.sameAs, [PLAY]);
    assert.equal(app.url, pageUrl(lang.code));
    assert.equal(app.inLanguage, lang.hreflang);
    assert.equal(app.operatingSystem, 'Android');
    assert.equal(app.description, d.seo_desc);
    assert.deepEqual(app.author, {'@type': 'Person', name: 'Ramune', url: 'https://ramune441.github.io/'});
    assert.equal(app.offers.price, '0');
    assert.equal(app.featureList.length, 9);
    for (const shot of [app.image, ...app.screenshot]) {
      assert.match(shot, /^https:\/\/ramune441\.github\.io\/ripen\/images\/store\/[\w-]+\/store-image-[\w]+\.png$/);
      assert.ok(fs.existsSync(path.join(here, shot.replace('https://ramune441.github.io/ripen/', ''))), shot);
    }
    const visible = [...html.matchAll(/<button class="faq-q"[^>]*><span>([^<]+)<\/span><\/button>\s*<div class="faq-a"><div class="faq-a-inner">([^<]+)<\/div>/g)].map(m => [decode(m[1]), decode(m[2])]);
    assert.equal(visible.length, 8, `${lang.code} visible FAQ`);
    assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), visible, `${lang.code} FAQPage matches the page`);
    assert.equal(crumbs.itemListElement[1].item, pageUrl(lang.code));
  }
});

test('the language selector lists all 20 pages and /ripen/ keeps ?lang= support', () => {
  for (const code of codes) {
    const options = [...page(code).matchAll(/<option value="([^"]+)"( selected)?>/g)];
    assert.deepEqual(options.map(m => m[1]), codes, `${code} options`);
    assert.deepEqual(options.filter(m => m[2]).map(m => m[1]), [code], `${code} selected`);
  }
  const js = fs.readFileSync(path.join(here, 'lp.js'), 'utf8');
  assert.match(js, /\[\?&\]lang=/, 'lp.js reads ?lang=');
  assert.match(page('ja'), /id="langSuggestText">\{/, 'the root page carries the language hints');
  assert.ok(!page('en').includes('langSuggest'), 'only the root page suggests languages');
});

test('privacy policy: 20 languages in i18n-pp.js, Japanese baseline, every key used', () => {
  const html = fs.readFileSync(path.join(here, 'privacy-policy.html'), 'utf8');
  const used = [...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual([...new Set(used)].sort(), Object.keys(pp.en).filter(k => k !== 'pp_desc').sort());
  assert.ok(html.includes(`<title>${pp.ja.pp_title}｜Ripen</title>`));
  assert.ok(html.includes('<link rel="canonical" href="https://ramune441.github.io/ripen/privacy-policy.html">'));
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta property="og:image" content="https:[^"]+">/);
  const ctx = {document: {querySelectorAll: () => [], querySelector: () => null, getElementById: () => null, documentElement: {}, title: ''},
    location: {search: '?lang=th', pathname: '/ripen/privacy-policy.html', hash: ''}, navigator: {language: 'en'}, localStorage: {getItem: () => null}, history: {}};
  // 実行すると ?lang=th の文言で <title> が変わる（DOM の代わりに最小のスタブで動かす）
  vm.runInNewContext(fs.readFileSync(path.join(here, 'i18n-pp.js'), 'utf8'), ctx);
  assert.equal(ctx.document.title, `${pp.th.pp_title}｜Ripen`);
  assert.equal(ctx.document.documentElement.dir, 'ltr');
});

test('contact keeps the same endpoint, fields and values as before, in 20 languages', () => {
  const now = fs.readFileSync(path.join(here, 'contact.html'), 'utf8');
  const before = execFileSync('git', ['show', 'HEAD:ripen/contact.html'], {cwd: root, encoding: 'utf8'});
  const pick = html => ({
    endpoint: html.match(/var ENDPOINT = '([^']+)'/)[1],
    maxBytes: html.match(/var MAX_FILE_BYTES = ([^;]+);/)[1],
    form: html.match(/<form id="contact-form"[^>]*>/)[0],
    names: [...html.slice(html.indexOf('<form'), html.indexOf('</form>')).matchAll(/\bname="([^"]+)"/g)].map(m => m[1]),
    values: [...html.matchAll(/<(?:option|input type="hidden")[^>]*\bvalue="([^"]+)"/g)].map(m => m[1]),
    accept: html.match(/accept="([^"]+)"/)[1],
    required: [...html.matchAll(/<(input|select|textarea)\b[^>]*\brequired\b/g)].length,
    post: /fetch\(ENDPOINT, \{ method: 'POST', body: data \}\)/.test(html),
    language: /data\.set\('language', locale\)/.test(html),
    inline: /success\.classList\.add\('show'\)/.test(html),
  });
  assert.deepEqual(pick(now), pick(before));
  assert.equal(pick(now).endpoint, 'https://contact-api.warload57.workers.dev/');
  const messages = JSON.parse(now.match(/var MESSAGES = (\{.*\});/)[1]);
  assert.deepEqual(Object.keys(messages), codes);
  const used = new Set([...now.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)].map(m => m[1]));
  for (const code of codes) for (const key of used) assert.ok(messages[code][key], `${code}.${key}`);
  assert.ok(now.includes('<link rel="canonical" href="https://ramune441.github.io/ripen/contact.html">'));
});

test('the sitemap updater (only with --sitemap) lists every language with alternates and keeps the other pages', () => {
  const raw = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const next = updateSitemap(raw, false, '2026-11-10').replace(/\r\n/g, '\n');
  for (const code of codes) assert.ok(next.includes(`<loc>${pageUrl(code)}</loc>`), code);
  const block = next.slice(next.indexOf('ripen-lp:start'), next.indexOf('ripen-lp:end'));
  assert.equal((block.match(/<url>/g) || []).length, 20);
  assert.equal((block.match(/<xhtml:link /g) || []).length, 20 * 21);
  assert.ok(next.includes('<loc>https://ramune441.github.io/ripen/contact.html</loc>'));
  assert.ok(next.includes('<loc>https://ramune441.github.io/ripen/privacy-policy.html</loc>'));
  assert.equal(updateSitemap(updateSitemap(raw, false, '2026-11-10'), false, '2026-12-01'), updateSitemap(raw, false, '2026-11-10'), 'unchanged pages keep their lastmod');
});
