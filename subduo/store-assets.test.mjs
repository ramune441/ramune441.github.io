import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { LOCALES, SHOTS } from './render-store-images.mjs';
const ROOT = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(ROOT, 'store-images.html'), 'utf8');
const context = vm.createContext({});
vm.runInContext(readFileSync(join(ROOT, 'store-image-locales.js'), 'utf8'), context);
vm.runInContext(html.slice(html.indexOf('const I18N ='), html.indexOf('// IMG 4 pair cards:')) + ';globalThis.dict = I18N', context);
const dictionaries = context.dict;

test('翻訳は英語の既定値と19言語、追加8言語の全67キーが揃う', () => {
  const extra = context.SUBDUO_STORE_EXTRA;
  assert.deepEqual(['en', ...Object.keys(dictionaries), ...Object.keys(extra)].sort(), [...LOCALES].sort());
  const keys = Object.keys(dictionaries.ja).sort();
  assert.equal(keys.length, 67);
  for (const [locale, dict] of Object.entries(extra)) {
    assert.deepEqual(Object.keys(dict).sort(), keys, locale);
    for (const [key, text] of Object.entries(dict)) assert.ok(typeof text === 'string' && text.trim(), `${locale}.${key}`);
    assert.ok(dict.cue3_a.includes(`<mark>${dict.c_phrase}</mark>`), locale);
    assert.ok(/20|২০/.test(dict.p5), locale);
  }
});

test('既存言語の表示言語数も20に揃い、画像生成ページは検索対象外', () => {
  for (const [locale, dict] of Object.entries(dictionaries)) assert.match(dict.p5, /20/, locale);
  assert.match(html, /noindex, nofollow/);
  assert.match(html, /Pick from 20 display languages/);
});

test('ストア掲載文の対応言語数が画像と同じ20になっている', () => {
  const listing = JSON.parse(readFileSync(join(ROOT, 'store-listing.json'), 'utf8'));
  for (const [locale, text] of Object.entries(listing)) {
    if (locale === '_') continue;
    const count = text.split('\n').find(line => line.startsWith('🌏')) || '';
    assert.match(count, /20/, locale);
    assert.ok(!count.includes('12'), locale);
  }
});

test('20言語の画像120枚と共通タイルがPNGの寸法・内容ハッシュに一致する', () => {
  const assets = JSON.parse(readFileSync(join(ROOT, 'store-assets.json'), 'utf8'));
  assert.deepEqual(assets.locales, LOCALES);
  const files = [];
  for (const locale of LOCALES) {
    assert.equal(assets.images[locale].length, 6);
    assert.deepEqual(assets.images[locale].map(i => [i.width, i.height]), SHOTS.map(s => [s.width, s.height]));
    files.push(...assets.images[locale]);
  }
  files.push(assets.common);
  assert.equal(new Set(files.map(f => f.file)).size, 121);
  assert.equal(new Set(files.map(f => f.sha256)).size, 121, '翻訳画像を別の言語からコピーしていない');
  for (const asset of files) {
    const png = readFileSync(join(ROOT, asset.file));
    assert.equal(png.subarray(1, 4).toString(), 'PNG', asset.file);
    assert.equal(png.readUInt32BE(16), asset.width, asset.file);
    assert.equal(png.readUInt32BE(20), asset.height, asset.file);
    assert.equal(createHash('sha256').update(png).digest('hex'), asset.sha256, asset.file);
  }
});
