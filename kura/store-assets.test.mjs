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
const strings = context.window.APP_STRINGS;

test('every app language has listing copy and keeps private promotion in sync',()=>{
  assert.deepEqual(Object.keys(listing.locales).sort(),Object.keys(strings).sort());
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
test('Private is the second screenshot and regional listings share one source',()=>{
  assert.deepEqual(listing.screenshotOrder,[2,4,3,1,5]);
  const languages = Object.values(listing.locales).flatMap(l=>l.playLanguages);
  assert.equal(languages.length,20);
  assert.equal(new Set(languages).size,20);
  assert.deepEqual(listing.locales.es.playLanguages,['es-ES','es-419']);
  assert.deepEqual(listing.locales.pt.playLanguages,['pt-BR','pt-PT']);
});
