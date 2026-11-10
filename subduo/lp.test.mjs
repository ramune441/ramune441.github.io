import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {LANGS, STORE, EXT_DIR, HTML_KEYS, FAQ_COUNT, loadDicts, videoIds, softwareVersion, render, outputPath, pageUrl, imageDir, sitemapBlock, plain} from './build-lp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dicts = loadDicts(); // throws on a missing/extra key, an empty value or HTML outside the allowed keys
const videos = videoIds();
const version = softwareVersion();
const pages = Object.fromEntries(LANGS.map(l => [l.code, fs.readFileSync(outputPath(l.code), 'utf8')]));
const CJK = ['ja', 'zh', 'zh-TW', 'ko'];
const graphemes = s => [...new Intl.Segmenter('und', {granularity: 'grapheme'}).segment(s)].length;
const unescape = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const jsonLds = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
// 「完全ローカル／何も送らない」の類（product.md: 語句を調べたら解説サーバーへ送るので書かない）
const FORBIDDEN = /100\s?%|nothing leaves|sends nothing|no server|完全ローカル|何も送|完全本地|完全在本地|不会发送任何|不會傳送任何|완전 로컬|아무것도 보내지|nada sale|no envía nada|não envia nada|nada sai|rien ne quitte|n'envoie rien|nichts verlässt|sendet nichts|niente esce|non invia nulla|niets verlaat|verstuurt niets|nic nie opuszcza|nie wysyła nic|ничего не покидает|ничего не отправляет|hiçbir şey göndermez|hiçbir şey çıkmaz|không gửi gì|tidak mengirim apa pun|tidak ada yang keluar|ไม่ส่งอะไร|कुछ नहीं भेजता|कुछ बाहर नहीं|কিছুই পাঠায় না|لا يرسل أي شيء|لا شيء يغادر/i;

test('the LP has the same 20 languages as the extension UI, the store listing and the store images', () => {
  const codes = LANGS.map(l => l.code).sort();
  assert.equal(codes.length, 20);
  assert.deepEqual(fs.readdirSync(path.join(here, 'lp-i18n')).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).sort(), codes);
  const listing = JSON.parse(fs.readFileSync(path.join(here, 'store-listing.json'), 'utf8'));
  assert.deepEqual(Object.keys(listing).filter(k => k !== '_').sort(), codes);
  for (const {code} of LANGS) assert.ok(code === 'en' || imageDir(code) === `images/${code}/`, `${code}: store images`);
  const locales = path.join(EXT_DIR, '_locales');
  if (fs.existsSync(locales)) {
    const ext = {zh_CN: 'zh', zh_TW: 'zh-TW', pt_BR: 'pt'};
    assert.deepEqual(fs.readdirSync(locales).map(l => ext[l] || l).sort(), codes);
  }
});

test('every generated page matches its dictionary and the template (run node subduo/build-lp.mjs)', () => {
  for (const lang of LANGS) assert.equal(pages[lang.code], render(lang, dicts[lang.code], videos[lang.code], version), lang.code);
});

test('each language is actually translated, not English left in place', () => {
  for (const {code} of LANGS.filter(l => l.code !== 'en')) {
    const same = Object.keys(dicts.en).filter(k => !/^cue\d_a$|^demo_title$|^tag_/.test(k) && dicts[code][k] === dicts.en[k]);
    assert.ok(same.length <= 3, `${code}: ${same.length} values identical to English: ${same.join(', ')}`);
  }
});

test('facts and markup that must survive translation', () => {
  for (const {code} of LANGS) {
    const d = dicts[code];
    for (const [key, text] of [['feat3_p', '20'], ['note4', '20'], ['faq6_a', '20'], ['note4', '138'], ['note5', '116'],
      ['faq1_a', 'TED'], ['flow1_p', 'TED'], ['faq5_a', 'OpenAI'], ['safe2_p', 'OpenAI'], ['safe4_p', 'sidePanel'], ['seo_title', 'SubDuo']]) {
      assert.ok(d[key].includes(text), `${code}.${key} should contain ${text}`);
    }
    assert.match(d.hero_h1, /<span class="accent">[^<]+<\/span>/, `${code}.hero_h1 keeps its accent`);
    assert.match(d.problem_p, /<span class="highlight">[^<]+<\/span>/, `${code}.problem_p keeps its highlight`);
    for (let i = 1; i <= 5; i++) assert.match(d[`note${i}`], /^<b>[^<]+<\/b>/, `${code}.note${i} starts bold`);
    // 上段は学ぶ側の言語（英語ページはスペイン語、ほかは英語）、下段はページの言語
    for (let i = 1; i <= 4; i++) assert.equal(d[`cue${i}_a`], code === 'en' ? dicts.en[`cue${i}_a`] : dicts.en[`cue${i}_b`], `${code}.cue${i}_a`);
  }
});

test('no "fully local / sends nothing" claims in any language', () => {
  for (const {code} of LANGS) {
    for (const [k, v] of Object.entries(dicts[code])) assert.ok(!FORBIDDEN.test(v), `${code}.${k}: ${v.match(FORBIDDEN)?.[0]}`);
    assert.ok(!FORBIDDEN.test(plain(pages[code].replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ''))), `${code} page`);
  }
});

test('title and description fit the search result limits', () => {
  for (const {code} of LANGS) {
    const d = dicts[code], cjk = CJK.includes(code);
    assert.ok(graphemes(d.seo_title) <= (cjk ? 32 : 60), `${code} title ${graphemes(d.seo_title)}: ${d.seo_title}`);
    assert.ok(graphemes(d.seo_desc) <= (cjk ? 90 : 155), `${code} description ${graphemes(d.seo_desc)}`);
    const html = pages[code];
    assert.equal(unescape(html.match(/<title>([^<]+)<\/title>/)[1]), d.seo_title);
    assert.equal(unescape(html.match(/<meta name="description" content="([^"]+)">/)[1]), d.seo_desc);
  }
});

test('canonical, language attributes, OGP and Twitter card per page', () => {
  for (const lang of LANGS) {
    const html = pages[lang.code], url = pageUrl(lang.code);
    assert.equal((html.match(/<link rel="canonical" href="([^"]+)">/g) || []).length, 1, lang.code);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${lang.code} canonical`);
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`), `${lang.code} og:url`);
    assert.ok(html.includes(`<meta property="og:locale" content="${lang.ogLocale}">`), `${lang.code} og:locale`);
    assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'), `${lang.code} twitter`);
    assert.match(html, new RegExp(`<html lang="${lang.hreflang}" dir="${lang.code === 'ar' ? 'rtl' : 'ltr'}"`), `${lang.code} html lang/dir`);
    const og = html.match(/<meta property="og:image" content="https:\/\/ramune441\.github\.io\/subduo\/([^"]+)">/)[1];
    assert.ok(fs.existsSync(path.join(here, og)), `${lang.code} og:image ${og}`);
  }
  assert.ok(pageUrl('en').endsWith('/subduo/') && pageUrl('ja').endsWith('/subduo/ja/'));
});

test('hreflang lists all 20 languages plus x-default on every page, and the links are reciprocal', () => {
  const alt = {};
  for (const {code} of LANGS) {
    alt[code] = Object.fromEntries([...pages[code].matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m => [m[1], m[2]]));
    assert.equal(Object.keys(alt[code]).length, 21, code);
    assert.equal(alt[code]['x-default'], pageUrl('en'), `${code} x-default`);
  }
  for (const a of LANGS) {
    assert.equal(alt[a.code][a.hreflang], pageUrl(a.code), `${a.code} refers to itself`);
    for (const b of LANGS) assert.equal(alt[a.code][b.hreflang], alt[b.code][b.hreflang], `${a.code} <-> ${b.code}`);
  }
  assert.ok(alt.en['zh-Hans'] && alt.en['pt-BR'] && alt.en['zh-TW']);
});

test('JSON-LD: SoftwareApplication with the current version and store URL, FAQPage matching the visible FAQ, breadcrumbs', () => {
  const manifest = path.join(EXT_DIR, 'manifest.json');
  if (fs.existsSync(manifest)) assert.equal(version, JSON.parse(fs.readFileSync(manifest, 'utf8')).version, 'softwareVersion follows the extension manifest');
  for (const lang of LANGS) {
    const html = pages[lang.code], d = dicts[lang.code];
    const [app, faq, crumbs] = jsonLds(html);
    assert.equal(app['@type'], 'SoftwareApplication');
    assert.equal(app.name, 'SubDuo');
    assert.equal(app.softwareVersion, version);
    assert.equal(app.installUrl, STORE);
    assert.deepEqual(app.sameAs, [STORE]);
    assert.equal(app.url, pageUrl(lang.code));
    assert.equal(app.inLanguage, lang.hreflang);
    assert.equal(app.applicationCategory, 'BrowserApplication');
    assert.equal(app.operatingSystem, 'Chrome');
    assert.equal(app.description, d.seo_desc);
    assert.equal(app.offers.price, '0');
    assert.deepEqual(app.author, {'@type': 'Person', name: 'Ramune', url: 'https://ramune441.github.io/'});
    assert.equal(app.featureList.length, 9);
    assert.equal(app.screenshot.length, 5);
    for (const url of app.screenshot) {
      assert.ok(url.startsWith(`https://ramune441.github.io/subduo/${imageDir(lang.code)}`), url);
      assert.ok(fs.existsSync(path.join(here, url.replace('https://ramune441.github.io/subduo/', ''))), url);
    }
    assert.equal(faq['@type'], 'FAQPage');
    assert.equal(faq.mainEntity.length, FAQ_COUNT);
    const visible = [...html.matchAll(/<button class="faq-q"[^>]*><span>([^<]+)<\/span><\/button>\s*<div class="faq-a"><div class="faq-a-inner">([^<]+)<\/div>/g)].map(m => [unescape(m[1]), unescape(m[2])]);
    assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), visible, `${lang.code} FAQ`);
    assert.equal(crumbs['@type'], 'BreadcrumbList');
    assert.equal(crumbs.itemListElement[1].item, pageUrl(lang.code));
  }
});

test('store links are the real listing URL written into the HTML', () => {
  for (const lang of LANGS) {
    const links = [...pages[lang.code].matchAll(/href="(https:\/\/chromewebstore\.google\.com[^"]*)"/g)].map(m => unescape(m[1]));
    assert.ok(links.length >= 3, lang.code);
    for (const href of links) {
      assert.ok(href.startsWith(`${STORE}?`), href);
      assert.equal(new URL(href).searchParams.get('hl'), lang.hl);
      assert.equal(new URL(href).searchParams.get('utm_campaign'), lang.code);
    }
  }
});

test('one h1, every image has alt text, each page embeds its own published video and images', () => {
  const ledger = JSON.parse(fs.readFileSync(path.join(here, 'youtube-store-videos.json'), 'utf8')).items;
  for (const lang of LANGS) {
    const html = pages[lang.code];
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${lang.code} h1`);
    for (const img of html.match(/<img\b[^>]*>/g)) assert.match(img, /\salt="[^"]+"/, `${lang.code}: ${img}`);
    assert.ok(html.includes(`/embed/${videos[lang.code]}?`), `${lang.code} video`);
    if (ledger[lang.code]?.publicVerifiedAt) assert.equal(videos[lang.code], ledger[lang.code].videoId, `${lang.code} uses its own video`);
    for (const [, src] of html.matchAll(/src="((?:\.\.\/)?(?:images|icons)\/[^"]+)"/g)) {
      assert.ok(fs.existsSync(path.join(path.dirname(outputPath(lang.code)), src)), `${lang.code}: ${src}`);
    }
    assert.ok(html.includes(`privacy-policy.html?lang=${lang.code}`), `${lang.code} privacy link`);
  }
});

test('the English root moves ?lang= to the language page; language pages never redirect', () => {
  const src = fs.readFileSync(path.join(here, 'lp.js'), 'utf8');
  const run = ({base, lang, search, saved = null, nav = ['en-US']}) => {
    const moved = [];
    const store = {subduo_lp_lang: saved};
    const options = LANGS.map(l => ({value: l.code}));
    const ctx = {
      URLSearchParams, navigator: {languages: nav, language: nav[0]},
      localStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }},
      location: {search, hash: '', replace: u => moved.push(u)},
      window: {matchMedia: () => ({matches: true})},
      document: {
        documentElement: {getAttribute: a => ({'data-base': base, 'data-lang': lang})[a]},
        getElementById: id => (id === 'langSelect' ? {options, addEventListener() {}} : null),
        querySelectorAll: () => [],
      },
    };
    vm.runInNewContext(src, ctx);
    return moved;
  };
  assert.deepEqual(run({base: '', lang: 'en', search: '?lang=ja'}), ['ja/']);
  assert.deepEqual(run({base: '', lang: 'en', search: '?lang=zh_TW&utm_source=x'}), ['zh-TW/?utm_source=x']);
  assert.deepEqual(run({base: '', lang: 'en', search: '?lang=pt-BR'}), ['pt/']);
  assert.deepEqual(run({base: '', lang: 'en', search: '?lang=en', nav: ['ja']}), []);
  assert.deepEqual(run({base: '', lang: 'en', search: '', nav: ['ar-EG']}), ['ar/']);
  assert.deepEqual(run({base: '', lang: 'en', search: '', saved: 'ko', nav: ['fr']}), ['ko/']);
  assert.deepEqual(run({base: '../', lang: 'ja', search: '?lang=fr'}), []);
});

test('the sitemap block lists every language with all alternates (written only with --sitemap)', () => {
  const block = sitemapBlock('2026-01-01');
  assert.equal((block.match(/<loc>/g) || []).length, 20);
  assert.equal((block.match(/<xhtml:link /g) || []).length, 20 * 21);
  const sitemap = fs.readFileSync(path.join(here, '../sitemap.xml'), 'utf8');
  if (sitemap.includes('subduo-lp:start')) for (const {code} of LANGS) assert.ok(sitemap.includes(`<loc>${pageUrl(code)}</loc>`), code);
});

test('the promo dictionary no longer claims to describe the current LP or v0.2.0', () => {
  const head = fs.readFileSync(path.join(here, 'i18n-lp.js'), 'utf8').split('var LP_MESSAGES')[0];
  assert.ok(!/v0\.2/.test(head));
  assert.ok(head.includes('promo.html'));
  assert.ok(HTML_KEYS.every(k => k in dicts.en));
});
