import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const listing = JSON.parse(fs.readFileSync(path.join(here, 'store-listing.json'), 'utf8'));
const script = fs.readFileSync(path.join(here, 'i18n-lp.js'), 'utf8');
const en = vm.runInNewContext('(' + script.match(/var translations = (\{[\s\S]*?\n\});/)[1] + ').en');
const keys = attr => [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map(m => m[1]);
const META_ONLY = ['seo_title', 'seo_desc', 'og_title'];

test('every Japanese string in the page has an English one, and nothing extra', () => {
  const page = [...keys('data-i18n'), ...keys('data-i18n-html'), ...keys('data-i18n-alt')];
  assert.equal(new Set(page).size, page.length, 'a key is used twice');
  assert.deepEqual([...page].sort(), Object.keys(en).filter(k => !META_ONLY.includes(k)).sort());
  for (const k of META_ONLY) assert.ok(en[k], k);
});

test('the page loads the light LP images, and they are newer than the store images they come from', () => {
  for (const file of keys('data-img')) {
    for (const lang of ['ja', 'en']) {
      const lp = path.join(here, 'images/lp', lang, file);
      const store = path.join(here, 'images/store', lang, file.replace(/\.webp$/, '.png'));
      assert.ok(fs.existsSync(lp), `${lang}/${file}: run node kura/build-lp-images.mjs`);
      assert.ok(fs.statSync(lp).size < 150 * 1024, `${lang}/${file} is too heavy for the LP`);
      assert.ok(fs.statSync(lp).mtimeMs >= fs.statSync(store).mtimeMs, `${lang}/${file} is older than the store image: run node kura/build-lp-images.mjs`);
    }
  }
  for (const src of keys('src').filter(s => !/^https?:/.test(s) && !s.endsWith('.js'))) {
    assert.ok(fs.existsSync(path.join(here, src)), src);
  }
});

test('the promo video matches the Play listing of each language', () => {
  const ids = Object.fromEntries(['ja', 'en'].map(l => [l, listing.locales[l].listing.video.split('v=')[1]]));
  assert.match(script, new RegExp(`ja: '${ids.ja}', en: '${ids.en}'`));
  assert.match(html, new RegExp(`embed/${ids.ja}\\?`));
});

test('the LP is linked from the portal and listed in the sitemap', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="\/kura\/"/);
  assert.match(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/ramune441\.github\.io\/kura\/<\/loc>/);
});
