import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const listing = JSON.parse(fs.readFileSync(path.join(here,'store-listing.json'),'utf8'));
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(here,'store-images-app-strings.js'),'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(here,'store-images-i18n.js'),'utf8'), context);
const strings = context.window.APP_STRINGS;

test('every app language has listing copy and keeps private promotion in sync',()=>{
  const requested = 'en es ja pt de fr ko id zh-TW hi zh vi it ar tr pl th nl ru bn'.split(' ').sort();
  assert.deepEqual(Object.keys(listing.locales).sort(),requested);
  assert.deepEqual(Object.keys(listing.locales).sort(),Object.keys(strings).sort());
  assert.deepEqual(Object.keys(listing.locales).sort(),Object.keys(context.window.STORE_I18N).sort());
  for (const [lang, entry] of Object.entries(listing.locales)) {
    const a = strings[lang];
    assert.equal(entry.privateCopy.title,a.intro_private_title,lang);
    assert.equal(entry.privateCopy.move.replace('{vault}','%1$s')+' '+entry.privateCopy.unlock,a.intro_private_text,lang);
    assert.ok(entry.listing.fullDescription.includes(entry.privateCopy.move.replace('{vault}',a.lib_vault)),lang);
    assert.ok(entry.listing.fullDescription.includes(entry.privateCopy.unlock),lang);
  }
});
test('Play titles, summaries and descriptions stay within their character limits',()=>{
  for (const [lang, {listing:l}] of Object.entries(listing.locales)) {
    for (const [key,limit] of [['title',30],['shortDescription',80],['fullDescription',4000]]) {
      assert.ok(l[key].trim() && l[key].length <= limit,`${lang}.${key}: ${l[key].length}/${limit}`);
      assert.ok(!l[key].includes('{vault}') && !l[key].includes('%1$s'),lang);
    }
  }
});
test('five screenshots in their own order, and regional listings share one source',()=>{
  // 1 introduction, 2 swipe and cleanup, 3 Private, 4 library, 5 backup.
  assert.deepEqual(listing.screenshotOrder,[1,2,3,4,5]);
  const languages = Object.values(listing.locales).flatMap(l=>l.playLanguages);
  assert.equal(languages.length,22);
  assert.equal(new Set(languages).size,22);
  assert.deepEqual(listing.locales.es.playLanguages,['es-ES','es-419']);
  assert.deepEqual(listing.locales.pt.playLanguages,['pt-BR','pt-PT']);
  assert.deepEqual(listing.locales.nl.playLanguages,['nl-NL']);
  assert.deepEqual(listing.locales.bn.playLanguages,['bn-BD']);
});
test('each language has only the feature graphic and the phone screenshots',()=>{
  // The web store lists every form factor's screenshots together; tablet copies would show the same art three times.
  const expected = ['store-image-feature.png',...listing.screenshotOrder.map(n=>`store-image-${n}.png`)].sort();
  for (const lang of Object.keys(listing.locales)) {
    const files = fs.readdirSync(path.join(here,'images/store',lang)).filter(f=>f.endsWith('.png')).sort();
    assert.deepEqual(files,expected,lang);
  }
});
test('all captions have the full translated template without missing placeholders',()=>{
  const captions = context.window.STORE_I18N;
  const tokens = text => [...text.matchAll(/\{[a-z0-9]+\}/g)].map(m=>m[0]).sort();
  for (const [language, copy] of Object.entries(captions)) {
    assert.deepEqual(Object.keys(copy).sort(),Object.keys(captions.en).sort(),language);
    for (const [key, value] of Object.entries(copy)) {
      if (Array.isArray(value)) {
        assert.equal(value.length,captions.en[key].length,`${language}.${key}`);
        assert.ok(value.every(v=>v.trim()),language);
      } else {
        assert.ok(value.trim(),`${language}.${key}`);
        // Arabic names Private directly.
        if (language === 'nl' || language === 'bn') {
          assert.deepEqual(tokens(value),tokens(captions.en[key]),`${language}.${key}`);
        }
      }
    }
  }
});
