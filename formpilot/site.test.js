const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {locales,labels,extras,copy,ui,url}=require('./build-site');
const root=__dirname;
test('website copy covers the same 20 languages as the extension without label fallbacks',()=>{
 assert.equal(locales.length,20);
 for(const lang of locales){
  for(const key of Object.keys(labels.en)){assert.ok(labels[lang][key],`${lang}/${key}`);}
  assert.equal(extras[lang].length,7);
  assert.deepEqual(Object.keys(labels[lang].contactCopy).sort(),Object.keys(labels.en.contactCopy).sort());
  for(const value of Object.values(labels[lang].contactCopy))assert.ok(value.trim());
  assert.ok(copy[lang].features[0].includes('50')||lang==='bn');
 }
});
test('every translated page is pre-rendered with its own canonical, 20 language alternatives and actual UI assets',()=>{
 for(const lang of locales)for(const page of ['index.html','guide.html','privacy-policy.html']){
  const file=path.join(root,lang==='en'?'':lang,page),html=fs.readFileSync(file,'utf8');
  assert.ok(html.includes(`<html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"`));
  assert.ok(html.includes(`href="https://ramune441.github.io${url(lang,page)}"`));
  assert.equal((html.match(/hreflang=/g)||[]).length,21);
  assert.ok(html.includes('<meta name="robots" content="index, follow">'));
  if(lang==='ja'){const description=html.match(/<meta name="description" content="([^"]+)"/)[1];assert.ok(description.length>=120&&description.length<=160,description.length);}
  assert.ok(!/\{ui:|undefined|AI in 3 seconds|Zero input errors/.test(html),file);
  for(const match of html.matchAll(/(?:src|href)="(\/formpilot\/(?:guide-shots|screens)\/[^"]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1].split('?')[0].slice('/formpilot/'.length))),match[1]);
  if(page==='guide.html'){
   for(const label of [ui[lang].btn_save,ui[lang].btn_restore,ui[lang].btn_change_shortcut,ui[lang].shortcut_rule_never])assert.ok(html.includes(label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')),`${lang}: ${label}`);
  }
  if(page!=='privacy-policy.html'){
   assert.equal((html.match(/<video\b/g)||[]).length,1);
   assert.ok(html.includes(`srclang="${lang==='zh'?'zh-Hans':lang}"`));
   for(const file of ['mp4','jpg','vtt'])assert.ok(fs.existsSync(path.join(root,'media',lang,(page==='index.html'?'promo':'tutorial')+'.'+file)));
  }
 }
});
test('Chinese scripts and regional browser languages route to the correct materials',()=>{
 const ctx={FORMPILOT_SITE:{locales,labels},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(fs.readFileSync(path.join(root,'i18n-lp-runtime.js'),'utf8'),ctx);
 for(const [value,expected] of [['zh-TW','zh-Hant'],['ZH_hant_HK','zh-Hant'],['zh-HK','zh-Hant'],['zh-CN','zh'],['pt-PT','pt'],['bn-BD','bn'],['ru-RU','ru'],['uk-UA',null]])assert.equal(ctx.normalizeLPLocale(value),expected);
});
test('sitemap includes every public translated page once and omits detailed-policy duplicate',()=>{
 const xml=fs.readFileSync(path.join(root,'../sitemap.xml'),'utf8');
 for(const lang of locales)for(const page of ['index.html','guide.html','privacy-policy.html'])assert.equal(xml.split(`<loc>https://ramune441.github.io${url(lang,page)}</loc>`).length-1,1);
 assert.ok(!xml.includes('privacy-details.html'));
});
test('contact page loads each shared script once after repeated generation',()=>{
 const html=fs.readFileSync(path.join(root,'contact.html'),'utf8');
 assert.ok(html.includes('id="lang-select"'));
 for(const file of ['site-data','i18n-lp'])assert.equal((html.match(new RegExp(`src="${file}\\.js`,'g'))||[]).length,1);
});
