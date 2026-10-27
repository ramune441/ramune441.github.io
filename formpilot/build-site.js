const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=__dirname,ext=path.resolve(process.env.FORMPILOT_EXT||path.join(root,'../../formpilot'));
const labels={...require('./translations'),...require('./translations-new')},extras=require('./translations-extra');
const copy=require(path.join(ext,'store/content')),version=require(path.join(ext,'manifest.json')).version;
const ctx={};vm.runInNewContext(fs.readFileSync(path.join(ext,'i18n.js'),'utf8')+';this.ui=messages;this.locales=SUPPORTED_LOCALES;',ctx);
const locales=Array.from(ctx.locales),ui=JSON.parse(JSON.stringify(ctx.ui));
const fillCounts=Object.fromEntries(require(path.join(ext,'store/build-report.json')).locales.map(r=>[r.locale,r.filled]));
const names={en:'English',ja:'日本語',zh:'简体中文','zh-Hant':'繁體中文',ko:'한국어',es:'Español',fr:'Français',de:'Deutsch',pt:'Português',hi:'हिन्दी',id:'Indonesia',ar:'العربية',vi:'Tiếng Việt',it:'Italiano',tr:'Türkçe',pl:'Polski',th:'ไทย',nl:'Nederlands',ru:'Русский',bn:'বাংলা'};
const base='https://ramune441.github.io/formpilot/',asset='/formpilot/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(locale,page='index.html')=>asset+(locale==='en'?'':locale+'/')+(page==='index.html'?'':page);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
function render(lang,page){
 const c=copy[lang],l=labels[lang],u=ui[lang],[formats,demo,details,server,website,region,deletion]=extras[lang];
 if(!c||!l||!u||!extras[lang])throw Error('Missing locale '+lang);
 const fill=s=>s.replace('{fill}',u.btn_ai_autofill);
 const title=page==='guide.html'?l.guide:page==='privacy-policy.html'?l.privacy:c.slides[0][0];
 const description=page==='guide.html'?l.guide+'。'+c.steps.map(fill).join(' ')+' '+l.desktopAnswer:page==='privacy-policy.html'?l.privacy+'。'+c.privacy+' '+deletion:c.intro+' '+c.features[0]+' '+c.features[2];
 const a=(page,text)=>`<a href="${page==='contact.html'?asset+'contact.html?lang='+lang:url(lang,page)}">${esc(text)}</a>`;
 const guideImage=kind=>`${asset}guide-shots/${lang}/${kind}.webp?v=${hash(path.join(root,'guide-shots',lang,kind+'.webp'))}`;
 const shot=(kind,label)=>`<details class="screenshot"><summary>${esc(label)} · FormPilot</summary><a href="${guideImage(kind)}"><img src="${guideImage(kind)}" alt="${esc(label)}" loading="lazy" width="400"></a></details>`;
 const p=s=>`<p>${esc(s)}</p>`,kbd=s=>`<kbd>${esc(s)}</kbd>`;
 const card=(title,body)=>`<section class="card"><h2>${esc(title)}</h2>${body}</section>`;
 const videoBlock=kind=>{
  const folder=path.join(root,'media',lang),file=path.join(folder,kind+'.mp4');if(!fs.existsSync(file))return '';
  const digest=hash(file),prefix=`${asset}media/${lang}/${kind}`,vtt=fs.readFileSync(path.join(folder,kind+'.vtt'),'utf8');
  const lines=vtt.trim().split(/\r?\n\r?\n/).slice(1).map(cue=>cue.split(/\r?\n/).slice(2).join(' '));
  return `<section class="card video-card"><video controls playsinline preload="none" width="1920" height="1080" poster="${prefix}.jpg?v=${digest}" aria-label="${esc(kind==='promo'?c.slides[0][0]:l.guide)}"><source src="${prefix}.mp4?v=${digest}" type="video/mp4"><track kind="captions" srclang="${lang==='zh'?'zh-Hans':lang}" label="${names[lang]}" src="${prefix}.vtt?v=${digest}"></video><details><summary>${esc(l.guide)}</summary><ol>${lines.map(line=>`<li>${esc(line)}</li>`).join('')}</ol></details></section>`;
 };
 const tutorial=`<section class="card tutorial" data-tutorial><h2>${esc(l.context)}</h2>${p(demo)}
 <div class="tutorial-grid"><div>${p(c.features[1])}<p>FormPilot → ${esc(u.menu_fill_with)} → ${esc(c.personal)}</p><div class="demo-actions"><button type="button" data-demo="fill">${esc(u.menu_fill_with)} · ${esc(c.personal)}</button><button type="button" data-demo="restore">${esc(u.menu_restore)}</button><button type="button" data-demo="reset">${esc(c.before)}</button></div><p data-demo-status role="status" aria-live="polite">${esc(c.before)}</p>${p(c.steps[2])}</div><img data-demo-image src="${asset}screens/${lang}/before.png" alt="${esc(c.before)}" width="480" height="580" loading="lazy"></div></section>`;
 const regional=card(formats,p(region)+`<dl class="examples"><div><dt>JA · カナ</dt><dd>ヤマダ → やまだ / ﾔﾏﾀﾞ</dd></div><div><dt>TH · พ.ศ.</dt><dd>1990 → 2533</dd></div><div><dt>TW · 民國</dt><dd>1990 → 79</dd></div><div><dt>NL · tussenvoegsel</dt><dd>Jan / van der / Berg</dd></div><div><dt>RU · Отчество</dt><dd>Петров / Иван / Сергеевич</dd></div><div><dt>${esc(u.section_custom)}</dt><dd>${esc(u.section_custom_hint)}</dd></div></dl>`);
 const privacy=card(l.privacy,p(c.privacy)+p(server)+p(website)+p(deletion));
 let body;
 if(page==='index.html')body=`<section class="hero"><div><p class="eyebrow">${esc(c.slides[3][0])}</p><h1>${esc(c.slides[0][0])}</h1>${p(c.intro)}<div class="actions"><a class="button" href="https://chromewebstore.google.com/detail/pedgekkfockobnmkokefjkclahjekend?hl=${lang==='zh-Hant'?'zh-TW':lang}">${esc(l.install)}</a>${a('guide.html',l.guide)}</div>${p(c.limits)}</div><img src="${guideImage('run')}" alt="${esc(l.run)}" width="400" loading="eager"></section>
 ${videoBlock('promo')}${card(c.headings[0],`<ol class="steps">${c.steps.map(s=>`<li>${esc(fill(s))}</li>`).join('')}</ol>`)}
 ${card(c.headings[1],`<ul>${c.features.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><div class="gallery">${[3,4].map(i=>`<a href="${asset}screens/${lang}/${i}.png"><img src="${asset}screens/${lang}/${i}.png" alt="${esc(c.slides[i-1][0])}" width="1280" height="800" loading="lazy"></a>`).join('')}</div>`)}${tutorial}${regional}${privacy}${card(l.faq,`<details><summary>${esc(l.desktopQuestion)}</summary>${p(l.desktopAnswer)}</details><details><summary>${esc(c.headings[2])}</summary>${p(c.privacy)}</details><details><summary>${esc(c.headings[3])}</summary>${p(c.limits)}</details>`+a('guide.html',l.guide))}`;
 else if(page==='guide.html')body=`<header class="intro"><h1>${esc(l.guide)}</h1>${p(c.intro)}${p(c.limits)}</header>${videoBlock('tutorial')}
 ${card('1 · '+l.profiles,p(c.steps[0])+`<ol><li>${kbd(u.tab_profile)} → ${kbd(u.btn_add_profile)} · ${esc(u.tip_add_profile)}</li><li>${esc(u.tip_tab_profile)}</li><li>${kbd(u.section_custom)} · ${esc(u.tip_custom_key)} · ${esc(u.tip_custom_value)} · ${esc(u.tip_add_custom)}</li><li>${kbd(u.btn_save)}</li></ol>`+p(c.features[0])+shot('profile',l.profiles))}
 ${card('2 · '+l.run,`<ol><li>${esc(c.steps[1].replace('{fill}',u.btn_ai_autofill))}</li><li>${kbd(u.skip_filled)} · ${esc(u.tip_skip_filled)}</li><li>${kbd(u.btn_cancel)} · ${esc(u.tip_cancel_run)}</li><li>${esc(c.steps[2])}</li></ol>`+p(c.privacy)+shot('run',l.run))}
 ${card('3 · '+l.saved,p(c.features[2])+`<ol><li>${kbd(u.btn_save_form)} → ${kbd(u.btn_save)}</li><li>${kbd(u.lbl_match_url)} · ${esc(u.tip_match_url||u.lbl_match_url)}</li><li>${kbd(u.btn_restore)} · ${esc(u.tip_restore)}</li></ol>`+p(l.storageNote)+shot('saved',l.saved))}
 ${card('4 · '+l.shortcut,p(u.tip_shortcut)+`<ol><li>${kbd(u.tab_profile)} → ${kbd(u.shortcut)} → ${kbd(u.btn_change_shortcut)}</li><li>${esc(u.shortcut_recording)}</li><li>${esc(u.shortcut_rule_combo)}</li><li>${esc(u.shortcut_rule_never)}</li><li>${kbd(u.btn_clear_shortcut)} · ${esc(u.tip_clear_shortcut)}</li></ol>`+shot('shortcut',l.shortcut))}
 ${card('5 · '+l.settings,p('20 · '+Object.values(names).join(' · '))+p(u.tip_lang||u.lang_auto)+p(u.tip_theme)+shot('settings',l.settings))}${tutorial}${regional}${privacy}`;
 else body=`<header class="intro"><h1>${esc(l.privacy)}</h1></header>${privacy}${card(u.appName||'FormPilot',p('storage · activeTab · scripting · contextMenus · host permissions')+p(u.tip_save_form)+p(u.tip_restore)+a('contact.html',l.contact))}<p><a href="${asset}privacy-details.html">${esc(details)}</a></p>`;
 const canonical=base+url(lang,page).slice(asset.length);
 const schema={'@context':'https://schema.org','@type':page==='index.html'?'SoftwareApplication':'WebPage',name:'FormPilot · '+title,inLanguage:lang,description,url:canonical,...(page==='index.html'?{applicationCategory:'BrowserApplication',operatingSystem:'Desktop Google Chrome',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}}:{})};
 return `<!doctype html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FormPilot · ${esc(title)}</title><meta name="robots" content="index, follow"><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}">${locales.map(code=>`<link rel="alternate" hreflang="${code==='zh'?'zh-Hans':code}" href="${base+url(code,page).slice(asset.length)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${base+url('en',page).slice(asset.length)}"><meta property="og:title" content="FormPilot · ${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="website"><meta property="og:image" content="${base}screens/${lang}/1.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="FormPilot · ${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><link rel="icon" href="${asset}icons/icon48.png"><link rel="stylesheet" href="${asset}site.css?v=${hash(path.join(root,'site.css'))}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>${page==='index.html'?'<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:[{'@type':'Question',name:l.desktopQuestion,acceptedAnswer:{'@type':'Answer',text:l.desktopAnswer}}]}).replace(/</g,'\\u003c')+'</script>':''}<script async src="https://www.googletagmanager.com/gtag/js?id=G-4QPZE2JTLP"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-4QPZE2JTLP');</script></head>
 <body data-page="${page}" data-locale="${lang}"><header class="nav"><a class="brand" href="${url(lang)}"><img src="${asset}icons/icon48.png" width="32" height="32" alt="">FormPilot</a><nav>${a('guide.html',l.guide)}<label class="language">🌐 <select id="lang-select" aria-label="${esc(l.settings)}">${locales.map(code=>`<option value="${code}"${code===lang?' selected':''}>${names[code]}</option>`).join('')}</select></label></nav></header><main><p class="version">FormPilot v${version}</p>${body}</main><footer>${a('index.html','FormPilot')} ${a('guide.html',l.guide)} ${a('privacy-policy.html',l.privacy)} <a href="${asset}contact.html?lang=${lang}">${esc(l.contact)}</a></footer><script src="${asset}site-data.js?v=${hash(path.join(root,'site-data.js'))}"></script><script src="${asset}i18n-lp.js?v=${hash(path.join(root,'i18n-lp.js'))}"></script></body></html>\n`;
}
function build(){
 fs.copyFileSync(path.join(root,'i18n-lp-runtime.js'),path.join(root,'i18n-lp.js'));
 const data={locales,names,copy,ui,labels,fillCounts};fs.writeFileSync(path.join(root,'site-data.js'),'// Generated by build-site.js.\nconst FORMPILOT_SITE = '+JSON.stringify(data)+';\n');
 for(const lang of locales){
  const dest=path.join(root,'screens',lang);fs.mkdirSync(dest,{recursive:true});
  for(let i=1;i<=5;i++)fs.copyFileSync(path.join(ext,'store/images',lang,`store-image-${i}.png`),path.join(dest,`${i}.png`));
  for(const mode of ['before','after'])fs.copyFileSync(path.join(ext,'store/ui',lang,`${mode}.png`),path.join(dest,`${mode}.png`));
  const folder=lang==='en'?root:path.join(root,lang);fs.mkdirSync(folder,{recursive:true});
  for(const page of ['index.html','guide.html','privacy-policy.html'])fs.writeFileSync(path.join(folder,page),render(lang,page));
 }
 for(let i=1;i<=5;i++)fs.copyFileSync(path.join(ext,`store-image-${i}.png`),path.join(root,`store-image-${i}.png`));
 const sitemapFile=path.join(root,'../sitemap.xml');let sitemap=fs.readFileSync(sitemapFile,'utf8');
 sitemap=sitemap.replace(/\s*<url>\s*<loc>https:\/\/ramune441\.github\.io\/formpilot\/(?:[a-zA-Z-]+\/)?(?:guide\.html|privacy-policy\.html)?<\/loc>[\s\S]*?<\/url>/g,'');
 const entries=locales.flatMap(lang=>['index.html','guide.html','privacy-policy.html'].map(page=>`  <url><loc>${base+url(lang,page).slice(asset.length)}</loc></url>`)).join('\n');
 fs.writeFileSync(sitemapFile,sitemap.replace('</urlset>',entries+'\n</urlset>'));
 fs.writeFileSync(path.join(root,'site-build.json'),JSON.stringify({extensionVersion:version,locales,pages:locales.length*3},null,2)+'\n');
 const contactFile=path.join(root,'contact.html');let contact=fs.readFileSync(contactFile,'utf8');
 if(!contact.includes('id="lang-select"'))contact=contact.replace('</h1>','</h1><p><label>🌐 <select id="lang-select" aria-label="Language"></select></label></p>');
 contact=contact.replace(/<script\b[^>]*\bsrc="(?:site-data|i18n-lp)\.js[^\"]*"><\/script>\s*/g,'');
 contact=contact.replace('</head>',`<script defer src="site-data.js?v=${hash(path.join(root,'site-data.js'))}"></script><script defer src="i18n-lp.js?v=${hash(path.join(root,'i18n-lp.js'))}"></script></head>`);
 contact=contact.replace(/(<select\b[^>]*id="lang-select"[^>]*>)[\s\S]*?<\/select>/,(_,open)=>open+locales.map(code=>`<option value="${code}">${names[code]}</option>`).join('')+'</select>');
 contact=contact.replace(/<(\w+)([^>]*\bdata-i18n="([\w]+)"[^>]*)>[\s\S]*?<\/\1>/g,(all,tag,attrs,key)=>labels.en.contactCopy[key]?`<${tag}${attrs}>${esc(labels.en.contactCopy[key])}</${tag}>`:all);
 contact=contact.replace('<html lang="ja">','<html lang="en">').replace(/<title>[\s\S]*?<\/title>/,'<title>FormPilot · '+esc(labels.en.contact)+'</title>');
 contact=contact.replace(/(<meta name="description" content=")[^"]*"/,'$1'+esc(labels.en.contactCopy.contact_desc)+'"').replace('&copy; 2025','&copy; 2026');
 fs.writeFileSync(contactFile,contact);
 console.log(`Built ${locales.length} languages, ${locales.length*3} pages`);
}
if(require.main===module)build();
module.exports={build,render,locales,labels,extras,copy,ui,url};
