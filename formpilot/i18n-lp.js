function normalizeLPLocale(value){
 const raw=String(value||'').replace(/_/g,'-').toLowerCase();
 if(/^zh-(?:hant|tw|hk|mo)(?:-|$)/.test(raw))return 'zh-Hant';
 if(raw==='zh'||raw.startsWith('zh-'))return 'zh';
 const code=raw.split('-')[0];return FORMPILOT_SITE.locales.includes(code)?code:null;
}
function detectLPLocale(){
 const forced=normalizeLPLocale(new URLSearchParams(location.search).get('lang'));if(forced)return forced;
 if(document.body?.dataset.locale&&document.body.dataset.locale!=='en')return document.body.dataset.locale;
 try{const saved=normalizeLPLocale(localStorage.getItem('formpilot_lang')||localStorage.getItem('lp_lang'));if(saved)return saved;}catch{}
 return normalizeLPLocale(navigator.language)||'en';
}
function localePage(locale,page){return '/formpilot/'+(locale==='en'?'':locale+'/')+(page==='index.html'?'':page);}
const LP_MESSAGES=Object.fromEntries(Object.entries(FORMPILOT_SITE.labels).map(([lang,l])=>[lang,l.contactCopy]));
function applyLPTranslations(locale){
 locale=normalizeLPLocale(locale)||'en';const data=FORMPILOT_SITE,msg=data.labels[locale].contactCopy;
 document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';
 document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(msg[key]!==undefined)el.textContent=msg[key];});
 document.querySelectorAll('[data-i18n-ph]').forEach(el=>{if(msg[el.dataset.i18nPh]!==undefined)el.placeholder=msg[el.dataset.i18nPh];});
 if(!document.body.dataset.page){document.title='FormPilot · '+data.labels[locale].contact;document.querySelectorAll('a[href]').forEach(a=>{const value=a.getAttribute('href');if(['./','index.html','guide.html','privacy-policy.html'].includes(value))a.dataset.pageTarget=value==='./'?'index.html':value;if(a.dataset.pageTarget)a.href=localePage(locale,a.dataset.pageTarget);});}
 const selector=document.getElementById('lang-select');if(selector){selector.value=locale;selector.setAttribute('aria-label',data.labels[locale].settings);}
 try{localStorage.setItem('formpilot_lang',locale);}catch{}
}
function initLP(){
 const lang=detectLPLocale(),page=document.body.dataset.page;
 if(page&&lang!==document.body.dataset.locale){try{localStorage.setItem('formpilot_lang',lang);}catch{}const target=new URL(localePage(lang,page),location.origin);target.search=location.search;target.searchParams.delete('lang');target.hash=location.hash;location.replace(target);return;}
 applyLPTranslations(lang);
 const selector=document.getElementById('lang-select');if(selector){selector.replaceChildren(...FORMPILOT_SITE.locales.map(code=>new Option(FORMPILOT_SITE.names[code],code,code===lang,code===lang)));selector.addEventListener('change',()=>{try{localStorage.setItem('formpilot_lang',selector.value);}catch{}if(page){const target=new URL(localePage(selector.value,page),location.origin);target.search=location.search;target.searchParams.delete('lang');target.hash=location.hash;location.href=target;}else{const url=new URL(location.href);url.searchParams.set('lang',selector.value);history.replaceState(null,'',url);applyLPTranslations(selector.value);}});}
 document.querySelectorAll('[data-tutorial]').forEach(demo=>{
  demo.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{
   const mode=button.dataset.demo,filled=mode!=='reset',c=FORMPILOT_SITE.copy[lang],u=FORMPILOT_SITE.ui[lang],img=demo.querySelector('[data-demo-image]');
   img.src='/formpilot/screens/'+lang+'/'+(filled?'after':'before')+'.png';img.alt=filled?c.after:c.before;
   const count=String(FORMPILOT_SITE.fillCounts[lang]);demo.querySelector('[data-demo-status]').textContent=mode==='fill'?u.status_filled.replace('{0}',count):mode==='restore'?u.status_restored.replace('{0}',c.saved).replace('{1}',count):c.before;
   demo.querySelectorAll('[data-demo]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initLP);else initLP();
