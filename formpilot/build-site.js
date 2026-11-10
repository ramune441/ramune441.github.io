const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=__dirname,ext=path.resolve(process.env.FORMPILOT_EXT||path.join(root,'../../formpilot'));
const labels={...require('./translations'),...require('./translations-new')},extras=require('./translations-extra'),seo=require('./translations-seo'),surveys=require('./translations-survey');
const copy=require(path.join(ext,'store/content')),version=require(path.join(ext,'manifest.json')).version,appName=require(path.join(ext,'_locales/en/messages.json')).appName.message;
const ctx={};vm.runInNewContext(fs.readFileSync(path.join(ext,'i18n.js'),'utf8')+';this.ui=messages;this.locales=SUPPORTED_LOCALES;',ctx);
const locales=Array.from(ctx.locales),ui=JSON.parse(JSON.stringify(ctx.ui));
const fillCounts=Object.fromEntries(require(path.join(ext,'store/build-report.json')).locales.map(r=>[r.locale,r.filled]));
const names={en:'English',ja:'日本語',zh:'简体中文','zh-Hant':'繁體中文',ko:'한국어',es:'Español',fr:'Français',de:'Deutsch',pt:'Português',hi:'हिन्दी',id:'Indonesia',ar:'العربية',vi:'Tiếng Việt',it:'Italiano',tr:'Türkçe',pl:'Polski',th:'ไทย',nl:'Nederlands',ru:'Русский',bn:'বাংলা'};
const base='https://ramune441.github.io/formpilot/',asset='/formpilot/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(locale,page='index.html')=>asset+(locale==='en'?'':locale+'/')+(page==='index.html'?'':page);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
const site='https://ramune441.github.io/',store='https://chromewebstore.google.com/detail/pedgekkfockobnmkokefjkclahjekend';
const storeUrl=lang=>`${store}?hl=${lang==='zh-Hant'?'zh-TW':lang}`;
const hreflang=lang=>lang==='zh'?'zh-Hans':lang,absolute=(locale,page='index.html')=>base+url(locale,page).slice(asset.length);
const ogLocales={en:'en_US',ja:'ja_JP',zh:'zh_CN','zh-Hant':'zh_TW',ko:'ko_KR',es:'es_ES',fr:'fr_FR',de:'de_DE',pt:'pt_BR',hi:'hi_IN',id:'id_ID',ar:'ar_AR',vi:'vi_VN',it:'it_IT',tr:'tr_TR',pl:'pl_PL',th:'th_TH',nl:'nl_NL',ru:'ru_RU',bn:'bn_BD'};
const author={'@type':'Person','@id':site+'#person',name:'Ramune',url:site};
const ld=data=>`<script type="application/ld+json">${JSON.stringify(data).replace(/</g,'\\u003c')}</script>`;
// Search title/description per page; CJK pages are measured with tighter limits in site.test.js.
function meta(lang,page){
 const s=seo[lang];if(!s)throw Error('Missing SEO copy '+lang);
 return page==='index.html'?{title:s.title,description:s.description}:page==='guide.html'?{title:s.guideTitle,description:s.guideDescription}:{title:'FormPilot · '+labels[lang].privacy,description:s.privacyDescription};
}
// Visible FAQ and FAQPage JSON-LD share this list. Facts come from the extension's store copy and UI labels.
function faq(lang){
 const s=seo[lang],c=copy[lang],l=labels[lang],u=ui[lang],[,,,server,,region]=extras[lang],join=(...parts)=>parts.join(['ja','zh','zh-Hant'].includes(lang)?'':' ');
 const [free,account,forms,submit,edit]=s.answers;
 return [[s.faq[0],join(free,c.features[0])],[s.faq[1],account],[s.faq[2],join(c.privacy,server)],[s.faq[3],forms],[s.faq[4],join(submit,c.steps[2])],[s.faq[5],join(c.features[3],region)],
  [s.faq[6],edit.replace('{tab}',u.tab_profile).replace('{save}',u.btn_save).replace('{active}',u.active_profile)],[l.desktopQuestion,l.desktopAnswer]];
}
// Contact form and uninstall survey text, shared with i18n-lp.js through site-data.js.
const forms=lang=>({...labels[lang].contactCopy,nav_cta:labels[lang].install,guide_back:(lang==='ar'?'→ ':'← ')+labels[lang].contactCopy.contact_success_back,...surveys[lang]});
function render(lang,page){
 const c=copy[lang],l=labels[lang],u=ui[lang],[formats,demo,details,server,website,region,deletion]=extras[lang];
 if(!c||!l||!u||!extras[lang])throw Error('Missing locale '+lang);
 const fill=s=>s.replace('{fill}',u.btn_ai_autofill);
 const {title,description}=meta(lang,page);
 const a=(page,text)=>`<a href="${page==='contact.html'?asset+'contact.html?lang='+lang:url(lang,page)}">${esc(text)}</a>`;
 const guideImage=kind=>`${asset}guide-shots/${lang}/${kind}.webp?v=${hash(path.join(root,'guide-shots',lang,kind+'.webp'))}`;
 const shot=(kind,label)=>`<details class="screenshot"><summary>${esc(label)} · FormPilot</summary><a href="${guideImage(kind)}"><img src="${guideImage(kind)}" alt="${esc(label)}" loading="lazy" width="400"></a></details>`;
 const p=s=>`<p>${esc(s)}</p>`,kbd=s=>`<kbd>${esc(s)}</kbd>`;
 const card=(title,body,id)=>`<section class="card"${id?` id="${id}"`:''}><h2>${esc(title)}</h2>${body}</section>`;
 const questions=faq(lang);
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
 if(page==='index.html')body=`<section class="hero"><div><p class="eyebrow">${esc(c.slides[3][0])}</p><h1>${esc(c.slides[0][0])}</h1>${p(c.intro)}<div class="actions"><a class="button" href="${storeUrl(lang)}">${esc(l.install)}</a>${a('guide.html',l.guide)}</div>${p(c.limits)}</div><img src="${guideImage('run')}" alt="${esc(l.run)}" width="400" loading="eager"></section>
 ${videoBlock('promo')}${card(c.headings[0],`<ol class="steps">${c.steps.map(s=>`<li>${esc(fill(s))}</li>`).join('')}</ol>`)}
 ${card(c.headings[1],`<ul>${c.features.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><div class="gallery">${[3,4].map(i=>`<a href="${asset}screens/${lang}/${i}.png"><img src="${asset}screens/${lang}/${i}.png" alt="${esc(c.slides[i-1][0])}" width="1280" height="800" loading="lazy"></a>`).join('')}</div>`)}${tutorial}${regional}${privacy}${card(l.faq,questions.map(([question,answer])=>`<details class="faq"><summary>${esc(question)}</summary>${p(answer)}</details>`).join('')+a('guide.html',l.guide),'faq')}`;
 else if(page==='guide.html')body=`<header class="intro"><h1>${esc(l.guide)}</h1>${p(c.intro)}${p(c.limits)}</header>${videoBlock('tutorial')}
 ${card('1 · '+l.profiles,p(c.steps[0])+`<ol><li>${kbd(u.tab_profile)} → ${kbd(u.btn_add_profile)} · ${esc(u.tip_add_profile)}</li><li>${esc(u.tip_tab_profile)}</li><li>${kbd(u.section_custom)} · ${esc(u.tip_custom_key)} · ${esc(u.tip_custom_value)} · ${esc(u.tip_add_custom)}</li><li>${kbd(u.btn_save)}</li></ol>`+p(c.features[0])+shot('profile',l.profiles),'step-1')}
 ${card('2 · '+l.run,`<ol><li>${esc(c.steps[1].replace('{fill}',u.btn_ai_autofill))}</li><li>${kbd(u.skip_filled)} · ${esc(u.tip_skip_filled)}</li><li>${kbd(u.btn_cancel)} · ${esc(u.tip_cancel_run)}</li><li>${esc(c.steps[2])}</li></ol>`+p(c.privacy)+shot('run',l.run),'step-2')}
 ${card('3 · '+l.saved,p(c.features[2])+`<ol><li>${kbd(u.btn_save_form)} → ${kbd(u.btn_save)}</li><li>${kbd(u.lbl_match_url)} · ${esc(u.tip_match_url||u.lbl_match_url)}</li><li>${kbd(u.btn_restore)} · ${esc(u.tip_restore)}</li></ol>`+p(l.storageNote)+shot('saved',l.saved),'step-3')}
 ${card('4 · '+l.shortcut,p(u.tip_shortcut)+`<ol><li>${kbd(u.tab_profile)} → ${kbd(u.shortcut)} → ${kbd(u.btn_change_shortcut)}</li><li>${esc(u.shortcut_recording)}</li><li>${esc(u.shortcut_rule_combo)}</li><li>${esc(u.shortcut_rule_never)}</li><li>${kbd(u.btn_clear_shortcut)} · ${esc(u.tip_clear_shortcut)}</li></ol>`+shot('shortcut',l.shortcut),'step-4')}
 ${card('5 · '+l.settings,p('20 · '+Object.values(names).join(' · '))+p(u.tip_lang||u.lang_auto)+p(u.tip_theme)+shot('settings',l.settings),'step-5')}${tutorial}${regional}${privacy}`;
 else body=`<header class="intro"><h1>${esc(l.privacy)}</h1></header>${privacy}${card(u.appName||'FormPilot',p('storage · activeTab · scripting · contextMenus · host permissions')+p(u.tip_save_form)+p(u.tip_restore)+a('contact.html',l.contact))}<p><a href="${asset}privacy-details.html">${esc(details)}</a></p>`;
 const canonical=absolute(lang,page),lp=absolute(lang),inLanguage=hreflang(lang),graph=[];
 const app={'@type':'SoftwareApplication','@id':lp+'#app',name:'FormPilot',url:lp,applicationCategory:'BrowserApplication',operatingSystem:'Google Chrome (desktop)',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}};
 const crumbs=[['Ramune Apps',site],['FormPilot',lp],...(page==='index.html'?[]:[[page==='guide.html'?l.guide:l.privacy,canonical]])];
 const breadcrumb={'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:crumbs.map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))};
 if(page==='index.html')graph.push({...app,alternateName:appName,description,inLanguage,softwareVersion:version,installUrl:storeUrl(lang),sameAs:[store],isAccessibleForFree:true,browserRequirements:'Requires desktop Google Chrome',featureList:c.features,image:base+'icons/icon128.png',screenshot:[1,2,3,4,5].map(i=>`${base}screens/${lang}/${i}.png`),author,publisher:author},
  {'@type':'FAQPage','@id':canonical+'#faq',url:canonical,inLanguage,mainEntity:questions.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))});
 else{
  const shots={1:'profile',2:'run',3:'saved',4:'shortcut',5:'settings'},steps=[[l.profiles,c.steps[0]],[l.run,fill(c.steps[1])],[l.saved,c.features[2]],[l.shortcut,u.tip_shortcut],[l.settings,u.tip_lang||u.lang_auto]];
  graph.push({'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,description,inLanguage,isPartOf:{'@type':'WebSite',name:'Ramune Apps',url:site},about:app,author,breadcrumb:{'@id':breadcrumb['@id']},
   ...(page==='guide.html'?{mainEntity:{'@type':'HowTo',name:title,description,inLanguage,tool:[{'@type':'HowToTool',name:'Google Chrome (desktop)'},{'@type':'HowToTool',name:'FormPilot'}],step:steps.map(([name,text],i)=>({'@type':'HowToStep',position:i+1,name,text,url:canonical+'#step-'+(i+1),image:`${base}guide-shots/${lang}/${shots[i+1]}.webp`}))}}:{})});
 }
 graph.push(breadcrumb);
 const og=[['og:title',title],['og:description',description],['og:url',canonical],['og:type','website'],['og:image',`${base}screens/${lang}/1.png`],['og:image:width','1280'],['og:image:height','800'],['og:image:alt',c.slides[0][0]],['og:locale',ogLocales[lang]],['og:site_name','FormPilot']];
 return `<!doctype html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="robots" content="index, follow"><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}">${locales.map(code=>`<link rel="alternate" hreflang="${hreflang(code)}" href="${absolute(code,page)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${absolute('en',page)}">${og.map(([property,content])=>`<meta property="${property}" content="${esc(content)}">`).join('')}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${base}screens/${lang}/1.png"><link rel="icon" href="${asset}icons/icon48.png"><link rel="stylesheet" href="${asset}site.css?v=${hash(path.join(root,'site.css'))}">${ld({'@context':'https://schema.org','@graph':graph})}<script async src="https://www.googletagmanager.com/gtag/js?id=G-4QPZE2JTLP"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-4QPZE2JTLP');</script></head>
 <body data-page="${page}" data-locale="${lang}"><header class="nav"><a class="brand" href="${url(lang)}"><img src="${asset}icons/icon48.png" width="32" height="32" alt="">FormPilot</a><nav>${a('guide.html',l.guide)}<label class="language">🌐 <select id="lang-select" aria-label="${esc(l.settings)}">${locales.map(code=>`<option value="${code}"${code===lang?' selected':''}>${names[code]}</option>`).join('')}</select></label></nav></header><main><p class="version">FormPilot v${version}</p>${body}</main><footer>${a('index.html','FormPilot')} ${a('guide.html',l.guide)} ${a('privacy-policy.html',l.privacy)} <a href="${asset}contact.html?lang=${lang}">${esc(l.contact)}</a></footer><script src="${asset}site-data.js?v=${hash(path.join(root,'site-data.js'))}"></script><script src="${asset}i18n-lp.js?v=${hash(path.join(root,'i18n-lp.js'))}"></script></body></html>\n`;
}
function build(){
 fs.copyFileSync(path.join(root,'i18n-lp-runtime.js'),path.join(root,'i18n-lp.js'));
 const siteLabels=Object.fromEntries(locales.map(lang=>{const {contactCopy,...rest}=labels[lang];return [lang,rest];}));
 const data={locales,names,copy,ui,labels:siteLabels,forms:Object.fromEntries(locales.map(lang=>[lang,forms(lang)])),fillCounts};fs.writeFileSync(path.join(root,'site-data.js'),'// Generated by build-site.js.\nconst FORMPILOT_SITE = '+JSON.stringify(data)+';\n');
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
 const en=forms('en');
 // Contact form and uninstall survey are hand-written pages; the build keeps their English defaults,
 // language list and shared scripts in step with the translations (i18n-lp.js switches the language).
 const formPage=(file,edit)=>{
  const target=path.join(root,file),raw=fs.readFileSync(target,'utf8'),crlf=raw.includes('\r\n');let html=raw.replace(/\r\n/g,'\n');
  if(!html.includes('id="lang-select"'))html=html.replace('</h1>','</h1><p><label>🌐 <select id="lang-select" aria-label="Language"></select></label></p>');
  html=html.replace(/<script\b[^>]*\bsrc="(?:site-data|i18n-lp)\.js[^"]*"><\/script>\s*/g,'');
  html=html.replace('</head>',`<script defer src="site-data.js?v=${hash(path.join(root,'site-data.js'))}"></script><script defer src="i18n-lp.js?v=${hash(path.join(root,'i18n-lp.js'))}"></script></head>`);
  html=html.replace(/(<select\b[^>]*id="lang-select"[^>]*>)[\s\S]*?<\/select>/,(_,open)=>open+locales.map(code=>`<option value="${code}">${names[code]}</option>`).join('')+'</select>');
  html=html.replace(/<(\w+)([^>]*\bdata-i18n="([\w]+)"[^>]*)>[\s\S]*?<\/\1>/g,(all,tag,attrs,key)=>en[key]?`<${tag}${attrs}>${esc(en[key])}</${tag}>`:all);
  html=html.replace(/(data-i18n-ph="(\w+)"\s+placeholder=")[^"]*"/g,(all,head,key)=>en[key]?head+esc(en[key])+'"':all);
  html=html.replace('<html lang="ja">','<html lang="en">').replace('&copy; 2025','&copy; 2026');
  html=edit(html);fs.writeFileSync(target,crlf?html.replace(/\n/g,'\r\n'):html);
 };
 formPage('contact.html',html=>{
  const title='FormPilot · '+labels.en.contact,description=en.contact_desc,canonical=base+'contact.html',image=base+'store-image-1.png';
  html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(title)+'</title>').replace(/(<meta name="description" content=")[^"]*"/,'$1'+esc(description)+'"');
  html=html.replace(/\s*<meta (?:property="og:|name="twitter:)[^>]*>/g,'').replace(/\s*<script type="application\/ld\+json" data-generated>[\s\S]*?<\/script>/g,'');
  const tags=[['og:title',title],['og:description',description],['og:type','website'],['og:url',canonical],['og:image',image],['og:image:width','1280'],['og:image:height','800'],['og:image:alt','FormPilot'],['og:locale','en_US'],['og:site_name','FormPilot']].map(([property,content])=>`<meta property="${property}" content="${esc(content)}">`);
  const graph=[{'@type':'ContactPage','@id':canonical+'#webpage',url:canonical,name:title,description,inLanguage:'en',about:{'@type':'SoftwareApplication','@id':base+'#app',name:'FormPilot',url:base},breadcrumb:{'@id':canonical+'#breadcrumb'}},
   {'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:[['Ramune Apps',site],['FormPilot',base],[labels.en.contact,canonical]].map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))}];
  const block=['',...tags,'<meta name="twitter:card" content="summary_large_image">',`<meta name="twitter:title" content="${esc(title)}">`,`<meta name="twitter:description" content="${esc(description)}">`,`<meta name="twitter:image" content="${image}">`,
   '<script type="application/ld+json" data-generated>'+JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')+'</script>'].join('\n  ');
  return html.replace(/(<link rel="canonical"[^>]*>)/,'$1'+block);
 });
 formPage('uninstall.html',html=>html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(en.un_title)+'</title>').replace(/(<meta name="description" content=")[^"]*"/,'$1'+esc(en.un_desc)+'"'));
 console.log(`Built ${locales.length} languages, ${locales.length*3} pages`);
}
if(require.main===module)build();
module.exports={build,render,locales,labels,extras,copy,ui,url,seo,surveys,faq,forms,meta,version};
