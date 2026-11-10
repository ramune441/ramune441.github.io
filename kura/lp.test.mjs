import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LANGS, loadDicts, videoIds, render, outputPath, pageUrl} from './build-lp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const dicts = loadDicts(); // throws on a missing/extra key, an empty value or HTML outside the allowed keys
const videos = videoIds();
const listing = JSON.parse(fs.readFileSync(path.join(here, 'store-listing.json'), 'utf8'));

test('the LP has the same 20 languages as the app and its Play listing', () => {
  assert.deepEqual(LANGS.map(l => l.code).sort(), Object.keys(listing.locales).sort());
  assert.deepEqual(fs.readdirSync(path.join(here, 'lp-i18n')).map(f => f.replace('.json', '')).sort(), LANGS.map(l => l.code).sort());
});

test('every generated page matches its dictionary and the template (run node kura/build-lp.mjs)', () => {
  for (const lang of LANGS) {
    assert.equal(fs.readFileSync(outputPath(lang.code), 'utf8'), render(lang, dicts[lang.code], videos[lang.code]), lang.code);
  }
});

test('each language is actually translated, not English left in place', () => {
  const en = dicts.en;
  for (const {code} of LANGS.filter(l => l.code !== 'en')) {
    // 小見出しの英字ラベル（*_tag）は日本語ページでは英語のまま見せるので数えない
    const same = Object.keys(en).filter(k => !k.endsWith('_tag') && dicts[code][k] === en[k]);
    assert.ok(same.length <= 8, `${code}: ${same.length} values identical to English: ${same.join(', ')}`);
  }
});

test('facts that must not change survive translation', () => {
  for (const {code} of LANGS) {
    const d = dicts[code];
    for (const [key, text] of [['price_p1', 'US$0.99'], ['price_p2', 'US$4.99'], ['price_p3', 'US$9.99'], ['faq1_a', 'US$0.99'],
      ['note1', '11'], ['flow1_p', '11'], ['faq6_a', '11'], ['note4', '30'], ['price_plan4', '30'], ['video_h2', '44']]) {
      assert.ok(d[key].includes(text), `${code}.${key} should contain ${text}: ${d[key]}`);
    }
    for (const key of ['hero_h1', 's1_h3', 's2_h3', 's3_h3', 's4_h3', 's5_h3', 's6_h3', 'cta_h2']) {
      assert.match(d[key], /<span class="accent">[^<]+<\/span>/, `${code}.${key} keeps its accent`);
    }
    assert.match(d.problem_p, /<span class="highlight">[^<]+<\/span>/, `${code}.problem_p keeps its highlight`);
  }
});

test('each page links every language, its own video, image folder and Play language', () => {
  for (const lang of LANGS) {
    const html = fs.readFileSync(outputPath(lang.code), 'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="${pageUrl(lang.code)}">`), lang.code);
    assert.equal((html.match(/<link rel="alternate" hreflang=/g) || []).length, LANGS.length + 1, lang.code);
    assert.ok(html.includes(`embed/${videos[lang.code]}?`), `${lang.code} video`);
    assert.ok(html.includes(`images/lp/${lang.code}/store-image-2.webp`), `${lang.code} images`);
    assert.ok(html.includes(`hl=${lang.hl}"`), `${lang.code} Play link`);
    assert.equal(/dir="rtl"/.test(html), lang.code === 'ar', `${lang.code} direction`);
  }
});

test('the light LP images exist for every language and are newer than the store images', () => {
  const files = ['store-image-feature', 'store-image-2', 'store-image-3', 'store-image-4', 'store-image-5', 'store-image-6', 'store-image-7'];
  for (const {code} of LANGS) {
    for (const name of files) {
      const lp = path.join(here, 'images/lp', code, name + '.webp');
      const store = path.join(here, 'images/store', code, name + '.png');
      assert.ok(fs.existsSync(lp), `${code}/${name}: run node kura/build-lp-images.mjs`);
      assert.ok(fs.statSync(lp).size < 150 * 1024, `${code}/${name} is too heavy for the LP`);
      assert.ok(fs.statSync(lp).mtimeMs >= fs.statSync(store).mtimeMs, `${code}/${name} is older than the store image: run node kura/build-lp-images.mjs ${code}`);
    }
  }
  const template = fs.readFileSync(path.join(here, 'lp-template.html'), 'utf8');
  for (const [, src] of template.matchAll(/src="\{\{@base\}\}((?:icons|images\/lp\/photos)\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(here, src)), src);
  }
});

test('the portal links the LP and the sitemap lists every language with alternates', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="\/kura\/"/);
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const {code} of LANGS) assert.ok(sitemap.includes(`<loc>${pageUrl(code)}</loc>`), code);
  const block = sitemap.slice(sitemap.indexOf('kura-lp:start'), sitemap.indexOf('kura-lp:end'));
  assert.equal((block.match(/<xhtml:link /g) || []).length, LANGS.length * (LANGS.length + 1));
});
