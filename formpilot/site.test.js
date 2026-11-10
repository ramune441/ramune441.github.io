const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {locales,labels,extras,copy,ui,url,faq,forms,surveys,version}=require('./build-site');
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
  assert.ok(!/\{ui:|undefined|AI in 3 seconds|Zero input errors/.test(html),file);
  for(const link of html.matchAll(/<a\b[^>]*href="(\/formpilot\/[^\"]*)"/g)){
   let target=path.join(root,new URL(link[1],'https://ramune441.github.io').pathname.slice('/formpilot/'.length));if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');assert.ok(fs.existsSync(target),`${lang}/${page}: ${link[1]}`);
  }
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
 const ctx={FORMPILOT_SITE:{locales,labels,forms:{}},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(fs.readFileSync(path.join(root,'i18n-lp-runtime.js'),'utf8'),ctx);
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
const pages=['index.html','guide.html','privacy-policy.html'],cjk=['ja','zh','zh-Hant','ko'],store='https://chromewebstore.google.com/detail/pedgekkfockobnmkokefjkclahjekend';
const read=(lang,page)=>fs.readFileSync(path.join(root,lang==='en'?'':lang,page),'utf8');
const unescape=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
const graph=html=>[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const data=JSON.parse(m[1]);return data['@graph']||[data];});
test('LP structured data names the product FormPilot and links the real store listing, author, version and localized assets',()=>{
 for(const lang of locales){
  const nodes=graph(read(lang,'index.html')),app=nodes.find(n=>n['@type']==='SoftwareApplication');
  assert.equal(app.name,'FormPilot',lang);
  assert.ok(app.installUrl.startsWith(store+'?hl='),lang);assert.deepEqual(app.sameAs,[store]);
  assert.deepEqual(app.author,{'@type':'Person','@id':'https://ramune441.github.io/#person',name:'Ramune',url:'https://ramune441.github.io/'});
  assert.equal(app.softwareVersion,version);assert.ok(app.description.length>0);assert.deepEqual(app.featureList,copy[lang].features);
  assert.equal(app.offers.price,'0');
  for(const shot of app.screenshot){assert.ok(shot.startsWith('https://ramune441.github.io/formpilot/screens/'+lang+'/'),shot);assert.ok(fs.existsSync(path.join(root,shot.slice('https://ramune441.github.io/formpilot/'.length))),shot);}
  for(const page of pages){
   const crumbs=graph(read(lang,page)).find(n=>n['@type']==='BreadcrumbList');
   assert.ok(crumbs,lang+'/'+page);assert.equal(crumbs.itemListElement[0].item,'https://ramune441.github.io/');assert.equal(crumbs.itemListElement.at(-1).item,'https://ramune441.github.io'+url(lang,page));
  }
  for(const page of ['guide.html','privacy-policy.html']){
   const web=graph(read(lang,page)).find(n=>n['@type']==='WebPage');assert.equal(web.about['@id'],app['@id'],lang+'/'+page);assert.equal(web.about.name,'FormPilot');
  }
  const guide=read(lang,'guide.html'),howto=graph(guide).find(n=>n['@type']==='WebPage').mainEntity;assert.equal(howto['@type'],'HowTo');assert.equal(howto.step.length,5);
  for(const step of howto.step)assert.ok(guide.includes('id="'+step.url.split('#')[1]+'"'),step.url);
 }
});
test('FAQ has at least five real questions per language and the FAQPage data matches the visible FAQ',()=>{
 for(const lang of locales){
  const html=read(lang,'index.html'),items=faq(lang),data=graph(html).find(n=>n['@type']==='FAQPage');
  assert.ok(items.length>=5,lang);assert.equal(new Set(items.map(([q])=>q)).size,items.length,lang);
  const visible=[...html.matchAll(/<details class="faq"><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map(m=>[unescape(m[1]),unescape(m[2])]);
  assert.deepEqual(visible,items,lang);
  assert.deepEqual(data.mainEntity.map(q=>[q.name,q.acceptedAnswer.text]),items,lang);
  for(const [q,a] of items)assert.ok(q.trim()&&a.trim()&&!/\{(?:tab|save|active|fill)\}/.test(a),lang+': '+q);
  assert.ok(!/3秒|誤入力ゼロ|全フォームに完全対応|in 3 seconds|zero input errors|every form/i.test(items.flat().join(' ')),lang);
 }
});
test('titles and descriptions stay within search-result limits in every language',()=>{
 for(const lang of locales)for(const page of pages){
  const html=read(lang,page),title=unescape(html.match(/<title>([^<]*)<\/title>/)[1]),description=unescape(html.match(/<meta name="description" content="([^"]*)"/)[1]);
  const [maxTitle,maxDescription]=cjk.includes(lang)?[32,90]:[60,155];
  assert.ok([...title].length<=maxTitle,`${lang}/${page} title ${[...title].length}: ${title}`);
  assert.ok(description.length>=50&&[...description].length<=maxDescription,`${lang}/${page} description ${[...description].length}`);
  assert.ok(title.includes('FormPilot'));
  assert.equal(unescape(html.match(/<meta property="og:title" content="([^"]*)"/)[1]),title);
  assert.equal(unescape(html.match(/<meta property="og:description" content="([^"]*)"/)[1]),description);
 }
 assert.equal(new Set(locales.map(lang=>read(lang,'index.html').match(/<title>([^<]*)<\/title>/)[1])).size,20);
});
test('every page has exactly one h1 and alt text on every image',()=>{
 const files=[...locales.flatMap(lang=>pages.map(page=>path.join(root,lang==='en'?'':lang,page))),...['contact.html','uninstall.html','privacy-details.html'].map(f=>path.join(root,f))];
 for(const file of files){
  const html=fs.readFileSync(file,'utf8');assert.equal((html.match(/<h1\b/g)||[]).length,1,file);
  for(const img of html.matchAll(/<img\b[^>]*>/g)){
   assert.match(img[0],/\salt="[^"]*"/,file+': '+img[0]);
   if(!/icon48\.png/.test(img[0]))assert.match(img[0],/\salt="[^"]+"/,file+': '+img[0]); // only the logo next to the "FormPilot" text is decorative
  }
 }
});
test('contact form and uninstall survey switch between the same 20 languages without changing what is sent',()=>{
 const ctx={};vm.runInNewContext(fs.readFileSync(path.join(root,'site-data.js'),'utf8')+';this.site=FORMPILOT_SITE;',ctx);
 assert.deepEqual(Object.keys(ctx.site.forms),locales);assert.deepEqual(Object.keys(surveys).sort(),[...locales].sort());
 for(const file of ['contact.html','uninstall.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8'),keys=[...html.matchAll(/data-i18n(?:-ph)?="(\w+)"/g)].map(m=>m[1]);
  assert.ok(keys.length>=15,file);
  for(const lang of locales)for(const key of keys)assert.ok(ctx.site.forms[lang][key]?.trim(),`${file} ${lang}/${key}`);
  for(const m of html.matchAll(/<(\w+)[^>]*\bdata-i18n="(\w+)"[^>]*>([\s\S]*?)<\/\1>/g))assert.equal(unescape(m[3]),forms('en')[m[2]],file+': '+m[2]);
  for(const m of html.matchAll(/data-i18n-ph="(\w+)"\s+placeholder="([^"]*)"/g))assert.equal(unescape(m[2]),forms('en')[m[1]],file+': '+m[1]);
  const select=html.match(/<select\b[^>]*id="lang-select"[^>]*>([\s\S]*?)<\/select>/)[1];
  assert.deepEqual([...select.matchAll(/<option value="([^"]+)">/g)].map(m=>m[1]),locales,file);
  assert.ok(html.includes("var ENDPOINT = 'https://contact-api.warload57.workers.dev/';"),file);
  assert.ok(html.includes('<html lang="en">'),file);
  for(const script of ['site-data','i18n-lp'])assert.equal((html.match(new RegExp(`src="${script}\\.js`,'g'))||[]).length,1,file);
 }
 const contact=fs.readFileSync(path.join(root,'contact.html'),'utf8');
 for(const value of ['Bug Report','Feature Request','Other'])assert.ok(contact.includes(`<option value="${value}" data-i18n=`),value);
 assert.ok(contact.includes('<meta name="robots" content="index, follow">')&&contact.includes('<link rel="canonical" href="https://ramune441.github.io/formpilot/contact.html">'));
 assert.ok(contact.includes('<meta property="og:title" content="FormPilot · Contact">')&&contact.includes('<meta property="og:locale" content="en_US">'));
 assert.ok(!/[ぁ-んァ-ヶ]/.test(contact.replace(/<select\b[^>]*id="lang-select"[\s\S]*?<\/select>/,'')),'contact.html keeps no Japanese default text');
 assert.equal(graph(contact).find(n=>n['@type']==='ContactPage').url,'https://ramune441.github.io/formpilot/contact.html');
 const survey=fs.readFileSync(path.join(root,'uninstall.html'),'utf8');
 assert.ok(survey.includes('<meta name="robots" content="noindex, nofollow">'));
 assert.deepEqual([...survey.matchAll(/name="reasons" value="([^"]+)"/g)].map(m=>m[1]),["Didn't know how to use it","It didn't work properly / had bugs",'Not what I expected','No longer needed','Performance issues','Switched to another tool','Other']);
 for(const field of ['name="kind" value="uninstall"','name="product" value="FormPilot"','name="diagnostics" id="f-diagnostics"','name="language" value="en" id="f-language"',"['v', 'days', 'fills', 'profile', 'opened', 'err']"])assert.ok(survey.includes(field),field);
});
