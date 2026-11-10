// node --test ashiato-maker/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  LANGS, APP_KEYS, JA_ONLY_KEYS, BASE_URL, EXT_DIR, PAGE_FILES,
  loadDicts, loadData, extensionData, renderAll, outputPath, pageUrl, storeLink, updateSitemap,
} from './build-pages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const lp = loadDicts('lp'); // missing/extra keys, empty values or HTML outside the allowed keys throw here
const pages = loadDicts('pages');
const data = loadData();
const ext = extensionData(); // null when the extension repo is not next to this one
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const html = Object.fromEntries(LANGS.map(l => [l.code, read(outputPath(l.code))]));
const CJK = ['ja', 'zh', 'zh-TW', 'ko'];
const decode = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#10003;/g, '✓').replace(/&amp;/g, '&');
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const metaContent = (doc, key) => decode((doc.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)">`)) || [])[1] || '');
const jsonLd = doc => [...doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const gitHead = file => { try { return execFileSync('git', ['show', `HEAD:ashiato-maker/${file}`], {cwd: root, encoding: 'utf8'}); } catch { return null; } };

test('20 languages, the same set as the extension UI, each with complete LP and page dictionaries', () => {
  assert.equal(LANGS.length, 20);
  for (const kind of ['lp', 'pages']) {
    assert.deepEqual(fs.readdirSync(path.join(here, 'i18n', kind)).map(f => f.replace('.json', '')).sort(), LANGS.map(l => l.code).sort(), kind);
  }
  assert.ok(JA_ONLY_KEYS.every(k => lp.ja[k] && !(k in lp.en)));
  if (ext) assert.deepEqual(fs.readdirSync(path.join(EXT_DIR, '_locales')).sort(), LANGS.map(l => l.ext).sort());
});

test('brand and terms come from the extension _locales of each language', { skip: !ext && 'extension repo not found' }, () => {
  for (const l of LANGS) {
    const m = JSON.parse(fs.readFileSync(path.join(EXT_DIR, '_locales', l.ext, 'messages.json'), 'utf8'));
    assert.equal(lp[l.code].brand, m.popupTitle.message, `${l.code} brand`);
    assert.equal(pages[l.code].brand, m.popupTitle.message, `${l.code} page brand`);
    assert.equal(pages[l.code].footer_privacy, m.privacyPolicy.message, `${l.code} privacy term`);
  }
  assert.equal(lp.ja.panel_reload, JSON.parse(fs.readFileSync(path.join(EXT_DIR, '_locales/ja/messages.json'), 'utf8')).reloadPerPeople.message);
});

test('each language is actually translated, not English left in place', () => {
  for (const {code} of LANGS.filter(l => l.code !== 'en')) {
    for (const [kind, d, en] of [['lp', lp[code], lp.en], ['pages', pages[code], pages.en]]) {
      const same = Object.keys(en).filter(k => !k.startsWith('tag_') && !['compare_manual_num', 'contact_email_ph', 'app_toukare', 'pp_email_label'].includes(k) && d[k] === en[k]);
      // 同じ綴りの語（fr: Contact / Message、de: Optional など）は数件ある
      assert.ok(same.length <= 5, `${code} ${kind}: ${same.length} values identical to English: ${same.join(', ')}`);
    }
  }
});

test('generated pages are fresh (run node ashiato-maker/build-pages.mjs)', () => {
  for (const [file, expected] of renderAll()) assert.equal(read(file), expected, path.relative(root, file));
});

test('lp-data.json matches the extension: version, promo videos, featured apps', { skip: !ext && 'extension repo not found' }, () => {
  assert.equal(data.version, ext.version);
  assert.deepEqual(data.videos, ext.videos);
  assert.deepEqual(data.apps, ext.apps);
  assert.deepEqual(data.appNames, ext.appNames);
  assert.ok(fs.readFileSync(path.join(EXT_DIR, 'spec/ops.md'), 'utf8').includes(data.extensionId), 'store id is the one the extension documents');
});

test('canonical, html lang/dir, one h1 and the language selector', () => {
  for (const l of LANGS) {
    const doc = html[l.code];
    assert.deepEqual([...doc.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map(m => m[1]), [pageUrl(l.code)], l.code);
    assert.match(doc, new RegExp(`<html lang="${l.hreflang}" dir="${l.code === 'ar' ? 'rtl' : 'ltr'}"`), l.code);
    assert.equal((doc.match(/<h1[\s>]/g) || []).length, 1, `${l.code} h1`);
    assert.equal((doc.match(/<option value="[^"]*" data-code=/g) || []).length, 20, `${l.code} selector`);
    assert.equal((doc.match(/<li><a href="[^"]*" hreflang=/g) || []).length, 20, `${l.code} footer language links`);
    assert.equal(metaContent(doc, 'og:url'), pageUrl(l.code));
    assert.equal(metaContent(doc, 'og:locale'), l.ogLocale);
  }
  assert.ok(fs.existsSync(path.join(here, 'index.html')) && !fs.existsSync(path.join(here, 'ja')), 'Japanese stays at /ashiato-maker/');
});

test('hreflang is complete and reciprocal, x-default is the English page', () => {
  const all = new Map(LANGS.map(l => [pageUrl(l.code), l]));
  for (const l of LANGS) {
    const alts = [...html[l.code].matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m => [m[1], m[2]]);
    assert.equal(alts.length, 21, l.code);
    assert.deepEqual(alts.find(([h]) => h === 'x-default'), ['x-default', pageUrl('en')]);
    for (const [h, href] of alts.filter(([h]) => h !== 'x-default')) {
      const target = all.get(href);
      assert.ok(target, `${l.code}: ${href} is not a page`);
      assert.equal(h, target.hreflang, `${l.code}: hreflang of ${href}`);
      assert.ok(html[target.code].includes(`hreflang="${l.hreflang}" href="${pageUrl(l.code)}"`), `${target.code} links back to ${l.code}`);
    }
  }
});

test('title and description: localized, within length limits, and also used for OGP / Twitter', () => {
  for (const l of LANGS) {
    const doc = html[l.code];
    const title = decode(doc.match(/<title>([^<]+)<\/title>/)[1]);
    const desc = metaContent(doc, 'description');
    const cjk = CJK.includes(l.code);
    assert.ok([...title].length <= (cjk ? 32 : 60), `${l.code} title ${[...title].length}: ${title}`);
    assert.ok([...desc].length <= (cjk ? 90 : 155) && [...desc].length >= (cjk ? 40 : 70), `${l.code} description ${[...desc].length}`);
    assert.equal(metaContent(doc, 'og:title'), title);
    assert.equal(metaContent(doc, 'twitter:title'), title);
    assert.equal(metaContent(doc, 'og:description'), desc);
    assert.equal(metaContent(doc, 'twitter:card'), 'summary_large_image');
    assert.ok(metaContent(doc, 'og:image').startsWith(BASE_URL));
    assert.ok(new Set(LANGS.map(x => lp[x.code].seo_title)).size === 20, 'titles differ per language');
  }
});

test('JSON-LD: SoftwareApplication with the real store URL and version, FAQPage = visible FAQ, BreadcrumbList', () => {
  const version = ext ? ext.version : data.version;
  for (const l of LANGS) {
    const doc = html[l.code];
    const [app, faq, crumbs] = jsonLd(doc);
    assert.equal(app['@type'], 'SoftwareApplication');
    assert.equal(app.name, '足あとメーカー');
    assert.ok(app.alternateName.includes('Auto Like Assistant'));
    if (l.code !== 'ja') assert.ok(app.alternateName.includes(lp[l.code].brand));
    assert.equal(app.url, pageUrl(l.code));
    assert.equal(app.inLanguage, l.hreflang);
    assert.equal(app.applicationCategory, 'BrowserApplication');
    assert.equal(app.operatingSystem, 'Chrome');
    assert.equal(app.softwareVersion, version, `${l.code} version`);
    assert.match(app.installUrl, /^https:\/\/chromewebstore\.google\.com\/detail\/[^?]*\/pidobfkbnlmfckdndkabelpjpdboadfo$/);
    assert.deepEqual(app.sameAs, [app.installUrl]);
    assert.equal(app.offers.price, '0');
    assert.deepEqual(app.author, {'@type': 'Person', name: 'Ramune', url: 'https://ramune441.github.io/'});
    assert.equal(app.featureList.length, 6);
    for (const url of [...app.screenshot, app.image]) {
      assert.ok(url.startsWith(BASE_URL), url);
      assert.ok(fs.existsSync(path.join(here, url.slice(BASE_URL.length))), `${l.code}: ${url} exists`);
    }
    const visibleQ = [...doc.matchAll(/<button class="faq-q"[^>]*>([^<]+)<\/button>/g)].map(m => decode(m[1]));
    const visibleA = [...doc.matchAll(/<div class="faq-a-inner">([^<]+)<\/div>/g)].map(m => decode(m[1]));
    assert.equal(faq['@type'], 'FAQPage');
    assert.deepEqual(faq.mainEntity.map(q => q.name), visibleQ, `${l.code} FAQ questions`);
    assert.deepEqual(faq.mainEntity.map(q => q.acceptedAnswer.text), visibleA, `${l.code} FAQ answers`);
    assert.equal(crumbs['@type'], 'BreadcrumbList');
    assert.deepEqual(crumbs.itemListElement.map(i => i.item), ['https://ramune441.github.io/', pageUrl(l.code)]);
  }
});

test('store links are real Chrome Web Store URLs in the static HTML, in the page language', () => {
  for (const l of LANGS) {
    const links = [...html[l.code].matchAll(/href="(https:\/\/chromewebstore\.google\.com\/[^"]+)"/g)].map(m => decode(m[1]));
    assert.equal(links.length, 2, l.code);
    for (const href of links) {
      assert.equal(href, storeLink(data, l));
      const u = new URL(href);
      assert.equal(u.searchParams.get('hl'), l.hl);
      assert.equal(u.searchParams.get('utm_campaign'), l.code);
    }
  }
});

test('every image has alt text (only the decorative panel icon is empty) and exists', () => {
  for (const l of LANGS) {
    const doc = html[l.code];
    for (const m of doc.matchAll(/<img\b[^>]*>/g)) {
      const alt = attr(m[0], 'alt');
      assert.notEqual(alt, undefined, `${l.code}: ${m[0]}`);
      if (alt === '') assert.match(doc.slice(m.index - 60, m.index), /class="rp-h"/, `${l.code}: empty alt only for the decorative panel icon`);
      const src = attr(m[0], 'src');
      assert.ok(fs.existsSync(path.join(path.dirname(outputPath(l.code)), src)), `${l.code}: ${src}`);
    }
    if (l.code !== 'ja') assert.ok(doc.includes(`alt="${lp[l.code].demo_alt.replace(/"/g, '&quot;')}"`), `${l.code} localized demo alt`);
  }
});

test('supported apps: all 7 on every page, the language featured apps first, the video of that language', () => {
  for (const l of LANGS) {
    const chips = [...html[l.code].matchAll(/<span class="app-dot (\w+)">/g)].map(m => m[1]);
    assert.deepEqual([...chips].sort(), [...APP_KEYS].sort(), l.code);
    assert.deepEqual(chips, data.apps[l.code]);
    assert.ok(html[l.code].includes(`youtube.com/embed/${data.videos[l.code]}?`), `${l.code} video`);
  }
});

test('privacy policy lists exactly the manifest permissions and hosts', { skip: !ext && 'extension repo not found' }, () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'manifest.json'), 'utf8'));
  const doc = read(path.join(here, 'privacy-policy.html'));
  const perms = [...doc.matchAll(/<li><strong>([\w_]+)<\/strong>:/g)].map(m => m[1]);
  assert.deepEqual(perms, [...manifest.permissions, 'host_permissions']);
  const hosts = manifest.host_permissions.map(h => h.replace('https://*.', '').replace('/*', ''));
  for (const l of LANGS) for (const h of hosts) assert.ok(pages[l.code].pp_perm_hosts.includes(h), `${l.code} names ${h}`);
});

// 問い合わせ・アンケートの送信先と項目は、変えると contact-api と集計が壊れる
function formShape(doc) {
  const form = doc.slice(doc.indexOf('<form'), doc.indexOf('</form>'));
  return {
    endpoint: doc.match(/var ENDPOINT = '([^']+)'/)[1],
    names: [...new Set([...form.matchAll(/<(?:input|select|textarea)\b[^>]*\sname="([^"]+)"/g)].map(m => m[1]))].sort(),
    hidden: [...form.matchAll(/<input type="hidden" name="([^"]+)"(?: id="[^"]+")? value="([^"]*)"/g)].filter(m => m[1] !== 'language').map(m => `${m[1]}=${m[2]}`).sort(),
    values: Object.fromEntries(['category', 'reasons'].map(n => [n, [...form.matchAll(new RegExp(`name="${n}"[\\s\\S]*?(?=<\\/select>|<input type="text")`, 'g'))].join('').match(/value="[^"]+"/g)?.sort() || []])),
    diag: (doc.match(/\[('v'[^\]]*)\]\.forEach/) || [])[1],
  };
}

test('contact and uninstall forms keep the endpoint, field names and English values of the committed version', () => {
  for (const file of ['contact.html', 'uninstall.html']) {
    const now = formShape(read(path.join(here, file)));
    assert.equal(now.endpoint, 'https://contact-api.warload57.workers.dev/');
    const headDoc = gitHead(file);
    if (!headDoc) continue;
    const before = formShape(headDoc.replace(/\r\n/g, '\n'));
    assert.equal(now.endpoint, before.endpoint, file);
    assert.deepEqual(now.names, before.names, file);
    assert.deepEqual(now.hidden, before.hidden, file);
    assert.deepEqual(now.values, before.values, file);
    for (const k of before.diag.match(/'(\w+)'/g)) assert.ok(now.diag.includes(k), `${file} still forwards ${k}`);
  }
  const contact = read(path.join(here, 'contact.html'));
  const headContact = gitHead('contact.html');
  if (headContact) {
    const appValues = s => [...s.slice(s.indexOf('id="f-app"'), s.indexOf('</select>', s.indexOf('id="f-app"'))).matchAll(/value="([^"]+)"/g)].map(m => m[1]);
    for (const v of appValues(headContact)) assert.ok(appValues(contact).includes(v), `app value ${v} kept`);
  }
  assert.match(read(path.join(here, 'uninstall.html')), /<meta name="robots" content="noindex, nofollow">/);
  assert.match(read(path.join(here, 'uninstall.html')), /if \(!details\.value\.trim\(\)\)/, 'details stay required');
});

test('contact / uninstall / privacy: 20 languages, Japanese static text, SEO tags', () => {
  for (const file of PAGE_FILES) {
    const doc = read(path.join(here, file));
    const messages = JSON.parse(doc.match(/var MESSAGES = (\{.*\});/)[1]);
    assert.deepEqual(Object.keys(messages), LANGS.map(l => l.code), file);
    for (const l of LANGS) for (const v of Object.values(messages[l.code])) assert.ok(v.trim(), `${file} ${l.code}`);
    assert.match(doc, /<html lang="ja">/);
    assert.equal((doc.match(/<option value="[^"]+" lang=/g) || []).length, 20, `${file} selector`);
    if (file !== 'uninstall.html') {
      assert.ok(doc.includes(`<link rel="canonical" href="${BASE_URL}${file}">`), file);
      for (const key of ['description', 'og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'og:site_name']) assert.ok(metaContent(doc, key), `${file} ${key}`);
    }
  }
});

test('?lang= (also the extension zh_TW / pt_BR form) > saved choice > browser language > English', () => {
  const doc = read(path.join(here, 'contact.html'));
  const script = doc.match(/(var LANG_NAMES[\s\S]*?)\n\n      var locale/)[1];
  const run = (search, languages, saved) => {
    const ctx = {
      location: {search}, navigator: {languages, language: languages[0]}, URLSearchParams,
      localStorage: {getItem: () => saved || null},
    };
    vm.runInNewContext(script + '\nthis.result = detectLocale();', ctx);
    return ctx.result;
  };
  assert.equal(run('?lang=zh_TW', ['ja']), 'zh-TW');
  assert.equal(run('?lang=pt_BR', ['ja']), 'pt');
  assert.equal(run('?lang=ar&v=1.0.30', ['en']), 'ar');
  assert.equal(run('', ['zh-HK']), 'zh-TW');
  assert.equal(run('', ['zh-CN']), 'zh');
  assert.equal(run('', ['fr-CA', 'en']), 'fr');
  assert.equal(run('', ['sv-SE', 'nl']), 'nl');
  assert.equal(run('', ['sv-SE']), 'en');
  assert.equal(run('', ['en-US'], 'th'), 'th');
  assert.equal(run('?lang=ko', ['en-US'], 'th'), 'ko');
});

test('sitemap updater replaces the Japanese LP entry with all 20 languages and is stable (writes only with --sitemap)', () => {
  const raw = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const once = updateSitemap(raw, '2026-11-10');
  const block = once.slice(once.indexOf('ashiato-lp:start'), once.indexOf('ashiato-lp:end'));
  for (const l of LANGS) assert.ok(block.includes(`<loc>${pageUrl(l.code)}</loc>`), l.code);
  assert.equal((block.match(/<xhtml:link /g) || []).length, 20 * 21);
  assert.equal((once.match(/<loc>https:\/\/ramune441\.github\.io\/ashiato-maker\/<\/loc>/g) || []).length, 1);
  assert.ok(once.includes('<loc>https://ramune441.github.io/ashiato-maker/contact.html</loc>'));
  assert.equal(updateSitemap(once, '2026-11-10'), once);
});
