// Record the real extension for the story promo, one language at a time: a local fictional contact form in that
// language, the extension's own UI language and sample person, one live AI request, then save, reopen and restore
// through the actual popup. Frames, click times and the boxes of every clicked control go to %LOCALAPPDATA%/FormPilot/story-capture.
// node formpilot/record-story.js [lang…]   (each language is skipped when its recording already exists)
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict');
const ext=path.resolve(process.env.FORMPILOT_EXT||path.join(__dirname,'../../formpilot'));
const puppeteer=require(path.join(ext,'node_modules/puppeteer')),chrome=puppeteer.executablePath();
const {sample}=require(path.join(ext,'scripts/build-store-assets')),copy=require('./promo-story-copy');
const vm=require('node:vm'),ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(ext,'i18n.js'),'utf8')+'\nglobalThis.r={messages,SUPPORTED_LOCALES};',ctx);
const {messages,SUPPORTED_LOCALES:locales}=JSON.parse(JSON.stringify(ctx.r));
const captureRoot=process.env.FORMPILOT_CAPTURE_DIR||path.join(process.env.LOCALAPPDATA||os.homedir(),'FormPilot','story-capture');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const familyFirst=['ja','zh','zh-Hant','ko'];
const fonts={ja:"'Yu Gothic','Meiryo'",zh:"'Microsoft YaHei'",'zh-Hant':"'Microsoft JhengHei'",ko:"'Malgun Gothic'",hi:"'Nirmala UI'",bn:"'Nirmala UI'",th:"'Leelawadee UI'",ar:"'Segoe UI'"};

// The demo form: the extension's own field labels, a gender radio group, a birthday date picker, an inquiry select,
// a message and a newsletter checkbox (the last three filled from custom fields). Every field sits in a `.cell`;
// `data-kind` marks the radio group, the checkbox and the date picker for the video's badges.
function form(locale){
 const u=messages[locale],p=sample(locale).profile,c=copy[locale],[title,tag,inquiry,options,select,message,,,reopen,footer]=c.form,font=fonts[locale]||"'Segoe UI'";
 // A sample person with a single name (Indonesian) gets one full-name field, labelled as the regional fixture does.
 const names=!p.lastName?[['name',sample(locale).nameLabel]]:familyFirst.includes(locale)?[['lastName',u.last_name],['firstName',u.first_name]]:[['firstName',u.first_name],['lastName',u.last_name]];
 const text=(n,l,ltr)=>`<label class="cell">${escape(l)}<input name="${n}"${ltr?' dir="ltr"':''}></label>`;
 const cells=[...names.map(([n,l])=>text(n,l)),text('email',u.email,1),text('phone',u.phone,1),
  `<label class="cell" data-kind="date">${escape(u.birthday)}<input type="date" name="birthday"></label>`,
  `<fieldset class="cell" data-kind="radio"><legend>${escape(u.gender)}</legend><div class="choices">${[['male',u.gender_male],['female',u.gender_female]].map(([v,l])=>`<label class="choice"><input type="radio" name="gender" value="${v}">${escape(l)}</label>`).join('')}</div></fieldset>`,
  ...(p.postalCode?[text('postal',u.postal_code,1)]:[])];
 const fields=[...names.map(([n])=>n),'email','phone','birthday','gender',...(p.postalCode?['postal']:[]),'inquiry','message','newsletter'];
 return {fields,html:`<!doctype html><html lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${escape(title)}</title>
<style>*{box-sizing:border-box}html,body{margin:0;background:#f8fafc;color:#1e293b;font-family:${font},sans-serif}main{margin:20px auto;padding:28px 46px;max-width:1180px;background:white;border:1px solid #e2e8f0;border-radius:22px;box-shadow:0 12px 38px #0f172a0c}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}h1{margin:0;font-size:32px}header span{color:#64748b;font-size:17px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 26px}.cell{display:flex;flex-direction:column;gap:8px;font-size:21px;font-weight:700;margin:0;padding:0;border:0;min-width:0}legend{padding:0;margin-bottom:8px}.choices{display:flex;gap:34px;align-items:center;height:57px;width:max-content}.choice,.check{display:flex;flex-direction:row;align-items:center;gap:12px;font-weight:400;font-size:23px}.check{font-weight:700;font-size:21px;justify-self:start}input,select,textarea{width:100%;padding:11px 15px;border:2px solid #cbd5e1;border-radius:9px;font:23px/1.4 ${font},sans-serif;color:#1e293b;background:white}input,select{height:57px}input[type=radio],input[type=checkbox]{width:30px;height:30px;margin:0;padding:0;accent-color:#059669;flex:none}textarea{resize:none;height:80px}.wide{grid-column:1/-1}footer{display:flex;justify-content:space-between;align-items:center;margin-top:18px;font-size:17px;color:#64748b}button{border:1px solid #a7f3d0;border-radius:9px;background:#ecfdf5;color:#047857;padding:12px 20px;font:700 18px ${font},sans-serif;cursor:pointer}input:focus,select:focus,textarea:focus{outline:3px solid #a7f3d0;border-color:#059669}</style></head>
<body><main><header><h1>${escape(title)}</h1><span>${escape(tag)}</span></header><form autocomplete="off" onsubmit="event.preventDefault()"><div class="grid">
${cells.join('')}
<label class="cell${cells.length%2?'':' wide'}">${escape(inquiry)}<select name="inquiry"><option value="">${escape(select)}</option>${options.map(o=>`<option>${escape(o)}</option>`).join('')}</select></label>
<label class="cell wide">${escape(message)}<textarea name="message" rows="2"></textarea></label>
<label class="cell wide check" data-kind="checkbox"><input type="checkbox" name="newsletter" value="yes">${escape(c.newsletter)}</label></div><footer><span>${escape(footer)}</span><button type="button" id="reopen" onclick="location.reload()">${escape(reopen)}</button></footer></form></main></body></html>`};
}
// Chrome's language for the date picker's display format (the extension's own UI language is set separately).
const chromeLang={zh:'zh-CN','zh-Hant':'zh-TW',pt:'pt-BR'};

async function cursor(page,selector){
 return page.evaluate(selector=>{let p=document.getElementById('recording-pointer');if(!p){p=document.createElement('div');p.id='recording-pointer';p.style.cssText='position:fixed;left:0;top:0;width:24px;height:30px;pointer-events:none;z-index:2147483647;transition:transform .4s ease;filter:drop-shadow(1px 2px 2px #0006)';p.innerHTML='<svg viewBox="0 0 24 30"><path d="M2 2L2 23L8 18L13 28L17 26L12 16L21 15Z" fill="white" stroke="#064e3b" stroke-width="2"/></svg>';document.body.appendChild(p);}const b=document.querySelector(selector).getBoundingClientRect(),zoom=Number(getComputedStyle(document.documentElement).zoom)||1,rtl=document.dir==='rtl';p.style.transform=`translate(${(b.x+b.width*(rtl?.35:.65))/zoom}px,${(b.y+b.height*.55)/zoom}px)`;return{x:b.x,y:b.y,w:b.width,h:b.height};},selector);
}

async function record(locale){
 const dir=path.join(captureRoot,locale);
 if(fs.existsSync(path.join(dir,'evidence.json'))){console.log('SKIP '+locale+' (recorded)');return;}
 fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
 const c=copy[locale],demo=form(locale),[,,inquiryLabel,options,,messageLabel,firstMessage,edited,,,entryName]=c.form;
 const posts=[];const server=http.createServer((req,res)=>{if(req.method!=='GET'){posts.push(req.method);res.writeHead(405).end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(demo.html);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,framesTask,stopFrames=false;
 const evidence={locale,extension:'pedgekkfockobnmkokefjkclahjekend',liveAI:true,events:{},boxes:{},pageSubmissions:posts};
 try{
  // Chrome now and then fails to start right after the previous one closed; try again before giving up.
  for(let i=0;!browser;i++){try{browser=await puppeteer.launch({executablePath:chrome,headless:true,enableExtensions:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`,'--disable-background-timer-throttling','--disable-renderer-backgrounding',`--lang=${chromeLang[locale]||locale}`],protocolTimeout:45000});}catch(e){if(i>=2)throw e;await sleep(3000);}}
  const target=await browser.waitForTarget(t=>t.type()==='service_worker');assert.equal(new URL(target.url()).host,evidence.extension);
  const worker=await target.worker();
  await worker.evaluate(()=>{globalThis.demoNetwork=[];const realFetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const r=await realFetch(...args);globalThis.demoNetwork.push({url:String(args[0]),status:r.status});return r;};});
  const control=await browser.newPage();await control.goto(`chrome-extension://${evidence.extension}/popup.html`);
  const profile={...sample(locale).profile,customFields:[{key:inquiryLabel,value:options[0]},{key:messageLabel,value:firstMessage},{key:c.newsletter,value:c.yes}]};evidence.profile=profile;
  // The extension's first-run setup can land after this write and put back a default profile, so write until it stays.
  for(let i=0;;i++){
   await control.evaluate(async(profile,lang)=>{await chrome.storage.local.clear();await chrome.storage.local.set({lang,theme:'light',skipFilled:false,onboardDismissed:true,profiles:{activePresetId:'p1',presets:{p1:{name:'FormPilot',data:profile,shortcut:'Alt+Shift+1',createdAt:new Date().toISOString()}}},siteProfiles:{}});},profile,locale);
   await sleep(1500);
   if(await control.evaluate(async()=>(await chrome.storage.local.get('profiles')).profiles?.presets?.p1?.name==='FormPilot'))break;
   if(i>=5)throw Error(locale+': the sample profile did not stay in storage');
  }
  const url=`http://127.0.0.1:${server.address().port}/contact`;
  const tab=await control.evaluate(url=>chrome.tabs.create({url,active:true}),url);
  const page=await(await browser.waitForTarget(t=>t.url()===url)).page();await page.setViewport({width:2560,height:1800,deviceScaleFactor:1});await page.evaluate(()=>{document.documentElement.style.zoom='2';});
  // The popup is captured as a background tab. Route only its active-tab lookup to this local form, as a toolbar
  // popup would; Chrome storage, messages, live AI, collection, writing, saving and restoration remain real.
  await control.evaluateOnNewDocument(({tabId,url})=>{const query=chrome.tabs.query.bind(chrome.tabs);chrome.tabs.query=async options=>options?.active&&options?.currentWindow?[{id:tabId,url,title:'Contact'}]:query(options);},{tabId:tab.id,url});
  await control.reload({waitUntil:'load'});await control.setViewport({width:800,height:1160,deviceScaleFactor:1});await control.evaluate(()=>{document.documentElement.style.zoom='2';});
  // A background tab never paints, so poll on a timer rather than per animation frame.
  await control.waitForFunction(()=>document.querySelector('#run-preset-select')?.value==='p1',{polling:200,timeout:30000}).catch(async e=>{throw Error(locale+': popup did not load the profile: '+await control.evaluate(()=>document.body.innerText.slice(0,300)));});
  await page.bringToFront();await control.evaluate(()=>checkSiteData());
  for(let i=0;i<40;i++){try{if((await control.evaluate(id=>chrome.tabs.sendMessage(id,{action:'ping'}),tab.id))?.pong)break;}catch{}await sleep(100);}
  // One value per field: a radio group gives its checked value, a checkbox 'on' when ticked.
  const read=()=>page.evaluate(()=>{const o={};for(const el of document.querySelectorAll('input,select,textarea')){if(el.type==='radio')o[el.name]=o[el.name]||(el.checked?el.value:'');else if(el.type==='checkbox')o[el.name]=el.checked?'on':'';else o[el.name]=el.value;}return o;});
  evidence.empty=await read();assert.deepEqual(Object.keys(evidence.empty),demo.fields);assert.ok(Object.values(evidence.empty).every(v=>v===''));
  await Promise.all([page.evaluate(()=>document.fonts.ready),control.evaluate(()=>document.fonts.ready)]);
  const boxes=await page.evaluate(()=>{const box=el=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height};};return{fields:[...document.querySelectorAll('.cell')].map(box),kinds:Object.fromEntries([...document.querySelectorAll('[data-kind]')].map(el=>[el.dataset.kind,box(el)])),
   // Where each badge goes: beside the radio choices and the checkbox, at the end of the date's label row.
   badges:(()=>{const rtl=document.dir==='rtl',side=b=>rtl?{x:b.x-28,y:b.y+b.height/2,align:'right'}:{x:b.right+28,y:b.y+b.height/2,align:'left'};const d=document.querySelector('[data-kind=date]').getBoundingClientRect(),z=2;
    return{radio:side(document.querySelector('.choices').getBoundingClientRect()),checkbox:side(document.querySelector('.check').getBoundingClientRect()),date:{x:rtl?d.x:d.right,y:d.y+15*z,align:rtl?'left':'right'}};})(),form:box(document.querySelector('main'))};});
  Object.assign(evidence.boxes,boxes);assert.ok(boxes.form.y+boxes.form.h<=1800,locale+': the form runs off the captured page');
  const frames=[],start=Date.now();let pauseFrames=false,frameBusy=false,popupFrame=await control.screenshot(),index=0;
  const now=()=>(Date.now()-start)/1000,mark=name=>{evidence.events[name]=now();console.log(`${locale} ${name} ${evidence.events[name].toFixed(2)}s`);};
  const save=(name,image)=>{const file=`${name}-${String(index).padStart(5,'0')}.png`;fs.writeFileSync(path.join(dir,file),image);return file;};
  // Keep the form in front while recording; refresh the real popup image between interactions.
  const refreshPopup=async()=>{pauseFrames=true;while(frameBusy)await sleep(20);try{await control.bringToFront();popupFrame=await control.screenshot();}finally{await page.bringToFront();pauseFrames=false;}};
  const popupClick=async(selector,name)=>{evidence.boxes[name]=await cursor(control,selector);await sleep(550);await refreshPopup();mark(name);await control.evaluate(selector=>document.querySelector(selector).click(),selector);await sleep(200);await refreshPopup();};
  framesTask=(async()=>{while(!stopFrames){if(pauseFrames){await sleep(20);continue;}frameBusy=true;try{const time=now(),formFile=save('form',await page.screenshot()),popupFile=save('popup',popupFrame);frames.push({time,form:formFile,popup:popupFile});index++;}finally{frameBusy=false;}await sleep(60);}})();
  await sleep(1600);await popupClick('#analyze-btn','analyzeClick');
  await control.waitForFunction(async()=>{const s=await chrome.runtime.sendMessage({action:'getAutoFillStatus'});if(s?.state==='error')throw Error(s.message);return s?.state==='done';},{timeout:90000,polling:200});
  evidence.aiStatus=await control.evaluate(()=>chrome.runtime.sendMessage({action:'getAutoFillStatus'}));
  evidence.filled=await read();
  const missing=Object.entries(evidence.filled).filter(([,v])=>!v).map(([k])=>k);if(missing.length)throw Error(`${locale}: AI left ${missing.join(', ')} empty`);
  assert.equal(evidence.filled.inquiry,options[0]);assert.equal(evidence.filled.message,firstMessage);
  assert.equal(evidence.filled.gender,'male');assert.equal(evidence.filled.birthday,'1990-12-31');assert.equal(evidence.filled.newsletter,'on');
  // The fill lands before the popup reports done; the first form frame that changed is the moment it shows.
  evidence.events.filled=frames.find(f=>f.time>evidence.events.analyzeClick&&!fs.readFileSync(path.join(dir,f.form)).equals(fs.readFileSync(path.join(dir,frames[0].form))))?.time??now();
  await refreshPopup();
  await sleep(1600);evidence.boxes.message=await cursor(page,'textarea');await sleep(500);mark('editStart');
  await page.evaluate(()=>{document.querySelector('textarea').focus();document.querySelector('textarea').select();});await page.keyboard.type(edited,{delay:45});mark('editEnd');await sleep(1000);
  evidence.beforeSave=await read();assert.equal(evidence.beforeSave.message,edited);
  await popupClick('#site-save-btn','saveClick');await control.waitForFunction(()=>document.querySelector('.site-save-dialog.visible'),{polling:200});await sleep(700);
  await control.evaluate(()=>{const input=document.querySelector('.site-save-name-input');input.focus();input.select();});await control.keyboard.type(entryName,{delay:140});await refreshPopup();await sleep(900);
  await popupClick('.btn-site-save-confirm','confirmClick');await control.waitForFunction(()=>document.querySelector('.btn-history-restore'),{polling:200});await refreshPopup();mark('saved');await sleep(1800);
  const saved=await control.evaluate(()=>chrome.storage.local.get('siteProfiles'));evidence.savedEntries=Object.values(saved.siteProfiles).flat();
  assert.equal(evidence.savedEntries.length,1);assert.equal(evidence.savedEntries[0].name,entryName);assert.equal(Object.keys(evidence.savedEntries[0].fields).length,demo.fields.length);
  evidence.boxes.reopenClick=await cursor(page,'#reopen');await sleep(550);mark('reopenClick');
  await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.evaluate(()=>document.querySelector('#reopen').click())]);await page.evaluate(()=>{document.documentElement.style.zoom='2';});
  await sleep(1300);evidence.reopened=await read();assert.deepEqual(evidence.reopened,evidence.empty);
  evidence.aiCallsBeforeRestore=await worker.evaluate(()=>globalThis.demoNetwork.length);
  await popupClick('.btn-history-restore','restoreClick');await page.waitForFunction(text=>document.querySelector('textarea').value===text,{polling:100},edited);mark('restored');await sleep(600);
  evidence.restored=await read();assert.deepEqual(evidence.restored,evidence.beforeSave);
  evidence.aiCallsAfterRestore=await worker.evaluate(()=>globalThis.demoNetwork.length);evidence.network=await worker.evaluate(()=>globalThis.demoNetwork);
  assert.equal(evidence.aiCallsBeforeRestore,evidence.aiCallsAfterRestore);assert.ok(evidence.network.some(r=>r.status===200));assert.deepEqual(posts,[]);
  await sleep(3000);mark('end');
  stopFrames=true;await framesTask;framesTask=null;
  evidence.frames=frames;evidence.formSize=[2560,1800];evidence.popupSize=[800,1160];
  fs.writeFileSync(path.join(dir,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(`PASS ${locale}: real AI filled ${demo.fields.length} fields; the popup saved them; reopening cleared them; restore brought back the edited values with no AI request or submission.`);
 }finally{stopFrames=true;if(framesTask)await framesTask.catch(()=>{});if(browser)await browser.close();await new Promise(r=>server.close(r));}
}

if(require.main===module)(async()=>{const targets=process.argv.slice(2).filter(a=>locales.includes(a));for(const locale of targets.length?targets:locales)await record(locale);})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={record,form,captureRoot,locales};
