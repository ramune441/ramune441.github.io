// Upload the story promo (youtube-assets/story) to YouTube Studio (Just One More Animal) from the signed-in
// cws-profile, then make each video public once YouTube's checks are done. Same Studio steps as ashiato-maker's
// scripts/youtube-promo.cjs. node formpilot/youtube-story.js renew | metadata | upload | captions | publish | retire | check [lang…]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {EXT_DIR}=require('./guide-shots'),{labels}=require('./build-site'),copy=require('./promo-story-copy');
const puppeteer=require(path.join(EXT_DIR,'node_modules/puppeteer'));
const root=path.join(__dirname,'youtube-assets/story'),metaFile=path.join(__dirname,'youtube-story.json');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const read=()=>JSON.parse(fs.readFileSync(metaFile,'utf8'));
const save=(locale,values)=>{const latest=read();latest.items[locale]={...latest.items[locale],...values};for(const k of Object.keys(latest.items[locale]))if(latest.items[locale][k]===undefined)delete latest.items[locale][k];fs.writeFileSync(metaFile,JSON.stringify(latest,null,2)+'\n');};
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
// Language names as the (Japanese) Studio UI lists them.
const studioLanguage={ja:'日本語',en:'英語',es:'スペイン語',fr:'フランス語',pt:'ポルトガル語 (ブラジル)',id:'インドネシア語',ko:'韓国語',zh:'中国語 (簡体字)','zh-Hant':'中国語 (繁体字)',de:'ドイツ語',it:'イタリア語',ru:'ロシア語',hi:'ヒンディー語',tr:'トルコ語',vi:'ベトナム語',th:'タイ語',pl:'ポーランド語',ar:'アラビア語',nl:'オランダ語',bn:'ベンガル語'};

// Title: the brand and the video's closing line. Description: the store's detailed description and the links, as
// the earlier FormPilot uploads (build-youtube.js) carry them.
function metadata(){
 const store=require(path.join(EXT_DIR,'store/listing.json')),meta=fs.existsSync(metaFile)?read():{channelId:'UCrjA6ffzb5pUw2URh0BcdRQ',items:{}};
 for(const locale of Object.keys(copy)){
  const report=JSON.parse(fs.readFileSync(path.join(root,`promo-${locale}.json`),'utf8')),site='https://ramune441.github.io/formpilot/'+(locale==='en'?'':locale+'/');
  const title=`FormPilot | ${copy[locale].title}`;
  const description=store[locale].description+`\n\n${labels[locale].install}\nhttps://chromewebstore.google.com/detail/pedgekkfockobnmkokefjkclahjekend\n\nFormPilot\n${site}?utm_source=youtube&utm_medium=video&utm_campaign=${locale}\n\n${labels[locale].guide}\n${site}guide.html\n\n${labels[locale].privacy}\n${site}privacy-policy.html`;
  if([...title].length>100||description.length>5000||/[<>]/.test(title+description))throw Error('YouTube metadata limit: '+locale);
  const old=meta.items[locale]||{};
  if(old.videoId&&old.uploadedSha256!==report.sha256)throw Error(`${locale}: the uploaded video ${old.videoId} is another file; run renew first`);
  meta.items[locale]={...old,file:report.file,captions:report.captions,sha256:report.sha256,title,description,language:studioLanguage[locale],visibility:'public',madeForKids:false,notifySubscribers:false};
 }
 fs.writeFileSync(metaFile,JSON.stringify(meta,null,2)+'\n');console.log('YouTube metadata: '+Object.keys(meta.items).length+' languages');
}

async function launch(){
 return puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:'C:/Users/Warlo/cws-profile',args:['--no-first-run'],protocolTimeout:600000,defaultViewport:{width:1600,height:1000}});
}
async function studioPage(browser){
 const page=await browser.newPage();
 // Studio turns HeadlessChrome away as an unsupported browser.
 await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome','Chrome'));
 page.on('dialog',dialog=>dialog.accept().catch(()=>{}));
 return page;
}
async function shot(page,name){try{const client=await page.createCDPSession();const {data}=await client.send('Page.captureScreenshot',{format:'png'});const file=path.join(process.env.LOCALAPPDATA||require('node:os').homedir(),'FormPilot',`youtube-${name}.png`);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.from(data,'base64'));console.log('screenshot '+file);}catch{}}

async function upload(locales){
 const meta=read(),browser=await launch();
 try{
  for(const locale of locales){
   const item=meta.items[locale],file=path.join(root,item.file);
   if(item.videoId){console.log(locale+': already '+item.videoId);continue;}
   if(hash(file)!==item.sha256)throw Error(locale+': file differs from metadata; run metadata');
   const page=await studioPage(browser);
   try{
    // An interrupted upload stays as a draft; resume it (draftId) instead of uploading the file twice.
    await page.goto('https://studio.youtube.com/channel/'+meta.channelId+'/videos/upload?d=ud'+(item.draftId?'&udvid='+item.draftId:''),{waitUntil:'networkidle2',timeout:90000});
    if(!item.draftId){
     for(let i=0;i<120&&!await page.evaluate(()=>!!document.querySelector('input[type=file]'));i++)await sleep(500);
     // Puppeteer's element handles hang on Studio pages; set the file through CDP.
     const client=await page.createCDPSession();
     const {root:doc}=await client.send('DOM.getDocument',{depth:-1,pierce:true});
     const {nodeId}=await client.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'input[type=file]'});
     if(!nodeId)throw Error(locale+': upload input not found (signed out?)');
     await client.send('DOM.setFileInputFiles',{nodeId,files:[file]});
     // Record the draft as soon as Studio names it, so a failure later resumes it.
     let draftId=null;
     for(let i=0;i<120&&!draftId;i++){await sleep(500);draftId=new URL(page.url()).searchParams.get('udvid')||await page.evaluate(()=>([...document.querySelectorAll('ytcp-uploads-dialog a')].map(a=>a.href).find(h=>/youtu\.be\//.test(h))||'').split('/').pop()||null);}
     if(!draftId)throw Error(locale+': the upload did not get a video id');
     save(locale,{draftId});
    }
    const result=await page.evaluate(async meta=>{
     const wait=ms=>new Promise(r=>setTimeout(r,ms));
     const q=s=>document.querySelector('ytcp-uploads-dialog '+s);
     for(let i=0;i<120&&!(q('ytcp-video-title #textbox')&&q('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]')&&q('#toggle-button')&&q('#next-button'));i++)await wait(500);
     await wait(2000);
     const press=async selector=>{for(let i=0;i<40&&!q(selector);i++)await wait(500);if(!q(selector))throw new Error('Studio control not found: '+selector);q(selector).click();};
     const put=(box,text)=>{box.focus();document.execCommand('selectAll',false,null);document.execCommand('insertText',false,text);box.dispatchEvent(new Event('input',{bubbles:true}));};
     put(q('ytcp-video-title #textbox'),meta.title);await wait(500);
     put(q('ytcp-video-description #textbox'),meta.description);await wait(800);
     const title=q('ytcp-video-title #textbox').innerText.trim(),description=q('ytcp-video-description #textbox').innerText.trim();
     await press('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]');await wait(600);
     // "Show more": video language, category, and no subscriber notification.
     await press('#toggle-button');await wait(1500);
     const choose=async(select,label)=>{(select.querySelector('#trigger')||select).click();await wait(1200);const option=[...document.querySelectorAll('tp-yt-paper-item')].find(e=>e.offsetParent&&e.innerText.trim()===label);if(!option){document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return false;}option.click();await wait(800);return select.innerText.includes(label);};
     const languageSet=await choose(q('ytcp-form-language-input ytcp-form-select'),meta.language);
     const categorySet=await choose(q('#category'),'科学と技術');
     const notify=[...document.querySelectorAll('ytcp-uploads-dialog ytcp-checkbox-lit')].find(e=>/登録者に通知/.test(e.innerText));
     const box=notify?.querySelector('[role=checkbox]')||notify;
     if(box?.getAttribute('aria-checked')==='true'){box.click();await wait(600);}
     const notifyOff=box?.getAttribute('aria-checked')==='false';
     for(let i=0;i<3;i++){await press('#next-button');await wait(1500);}
     await press('tp-yt-paper-radio-button[name="PRIVATE"]');await wait(600);
     let progress='';
     for(let i=0;i<900;i++){progress=q('.progress-label')?.innerText||'';if(progress&&!/アップロード中|Uploading/.test(progress))break;await wait(1000);}
     const link=[...document.querySelectorAll('ytcp-uploads-dialog a')].map(a=>a.href).find(h=>/youtu\.be\//.test(h));
     await press('#done-button');
     for(let i=0;i<20;i++){await wait(700);const d=[...document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog')].find(x=>x.offsetParent&&/閉じる|Close/.test(x.innerText)&&!x.closest('ytcp-uploads-dialog'));const b=d&&[...d.querySelectorAll('ytcp-button, button')].find(b=>/^(閉じる|Close)$/.test(b.innerText.trim()));if(b){b.click();break;}}
     return{title,descriptionOk:description===meta.description,languageSet,categorySet,notifyOff,link,progress};
    },{title:item.title,description:item.description,language:item.language});
    // The upload dialog's language list sometimes misses an entry; captions sets it on the details page instead.
    const id=result.link?.split('/').pop();
    if(!id||result.title!==item.title||!result.descriptionOk||!result.categorySet||!result.notifyOff)throw Error(locale+': '+JSON.stringify(result));
    if(!result.languageSet)console.log(locale+': video language left for the details page');
    save(locale,{videoId:id,watchUrl:'https://www.youtube.com/watch?v='+id,uploadedSha256:item.sha256,draftId:undefined});
    console.log(locale+': '+id+' '+result.progress.replace(/\s+/g,' '));
    await sleep(3000);
   }catch(error){await shot(page,'upload-'+locale);throw error;}finally{await page.close();}
  }
 }finally{await browser.close();}
}

// The video language and the title/description language, set on the details page and saved (visibility unchanged).
async function setLanguages(page,locale,label){
 await page.goto('https://studio.youtube.com/video/'+read().items[locale].videoId+'/edit',{waitUntil:'networkidle2',timeout:90000});
 for(let i=0;i<120&&!await page.evaluate(()=>!!document.querySelector('ytcp-video-title #textbox'));i++)await sleep(500);
 await sleep(2500);
 const result=await page.evaluate(async label=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const selects=()=>[...document.querySelectorAll('ytcp-form-select')].filter(s=>/^(動画の言語|タイトルと説明の言語)/.test(s.innerText.trim()));
  if(selects().length<2||!selects()[0].offsetParent){document.querySelector('#toggle-button')?.click();await wait(2000);}
  let result='kept';
  for(let i=0;i<selects().length;i++){
   const select=selects()[i];if(select.innerText.includes(label))continue;
   (select.querySelector('#trigger')||select).click();await wait(1200);
   // Each select keeps its own hidden copy of the list; take the shown one, the most recently opened.
   const option=[...document.querySelectorAll('tp-yt-paper-item')].filter(e=>e.offsetParent&&e.innerText.trim()===label).at(-1);
   if(!option)return'';option.scrollIntoView({block:'center'});await wait(300);option.click();await wait(800);
   result=selects()[i].innerText.includes(label)?'changed':'';if(!result)return'';
  }
  return selects().length===2?result:'';
 },label);
 if(!result)throw Error(locale+': video and title/description language not set');
 if(result==='changed'){
  const box=await page.evaluate(()=>{const e=document.querySelector('ytcp-button#save');e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};});
  await page.mouse.click(box.x,box.y);await sleep(4000);
  if(await page.evaluate(()=>!document.querySelector('ytcp-button#save')?.hasAttribute('disabled')))throw Error(locale+': language change not saved');
 }
 return result;
}

// Captions in the video's language: Language page → upload manually → with timecodes.
async function captions(locales){
 const browser=await launch();
 try{
  for(const locale of locales){
   const item=read().items[locale];
   if(!item.videoId||item.captionsUploaded)continue;
   const page=await studioPage(browser);
   try{
    console.log(locale+': language '+await setLanguages(page,locale,item.language));
    await page.goto('https://studio.youtube.com/video/'+item.videoId+'/translations',{waitUntil:'networkidle2',timeout:90000});
    for(let i=0;i<60&&!await page.evaluate(()=>!!document.querySelector('#upload-default-language-button'));i++)await sleep(500);
    let heading='';
    for(let i=0;i<30&&!heading.includes('動画の言語: '+item.language);i++){await sleep(500);heading=await page.evaluate(()=>(document.querySelector('ytgn-video-translations-section')?.innerText||'').replace(/\s+/g,' '));}
    if(!heading.includes('動画の言語: '+item.language))throw Error(locale+': video language is not '+item.language);
    await page.evaluate(()=>document.querySelector('#upload-default-language-button').click());await sleep(2000);
    await page.evaluate(()=>[...document.querySelectorAll('tp-yt-paper-radio-button[name="with-timing"]')].find(e=>e.offsetParent).click());await sleep(800);
    await page.evaluate(()=>{const d=[...document.querySelectorAll('ytcp-dialog')].find(x=>x.offsetParent&&/ファイル形式を選択/.test(x.innerText));[...d.querySelectorAll('ytcp-button')].find(b=>/続行/.test(b.innerText)).click();});await sleep(2000);
    const client=await page.createCDPSession();
    const {root:doc}=await client.send('DOM.getDocument',{depth:-1,pierce:true});
    const {nodeIds}=await client.send('DOM.querySelectorAll',{nodeId:doc.nodeId,selector:'input[type=file]'});
    if(!nodeIds.length)throw Error(locale+': caption file input not found');
    await client.send('DOM.setFileInputFiles',{nodeId:nodeIds[nodeIds.length-1],files:[path.join(root,item.captions)]});
    // Studio publishes the file at once and confirms with a toast such as 「英語 の字幕をアップロードしました」.
    let toast='';
    for(let i=0;i<40&&!toast;i++){await sleep(500);toast=await page.evaluate(()=>[...document.querySelectorAll('tp-yt-paper-toast, ytcp-toast, #toast')].map(t=>t.innerText.trim()).find(t=>/字幕をアップロードしました/.test(t))||'');}
    if(!toast.includes(item.language))throw Error(locale+': caption upload not confirmed: '+toast);
    save(locale,{captionsUploaded:true});console.log(locale+': '+toast);
   }catch(error){await shot(page,'captions-'+locale);throw error;}finally{await page.close();}
  }
 }finally{await browser.close();}
}

// A private video goes public from its details page once YouTube's checks are done; until then it stays private.
async function publish(locales){
 const browser=await launch();
 try{
  for(const locale of locales){
   const item=read().items[locale];
   if(!item.videoId||item.published)continue;
   const page=await studioPage(browser);
   try{
    await page.goto('https://studio.youtube.com/video/'+item.videoId+'/edit',{waitUntil:'networkidle2',timeout:90000});
    for(let i=0;i<120&&!await page.evaluate(()=>!!document.querySelector('ytcp-video-title #textbox'));i++)await sleep(500);
    await sleep(2500);
    const r=await page.evaluate(()=>({title:document.querySelector('ytcp-video-title #textbox').innerText.trim(),description:document.querySelector('ytcp-video-description #textbox').innerText.trim()}));
    if(r.title!==item.title||r.description!==item.description)throw Error(locale+': metadata mismatch '+JSON.stringify(r).slice(0,200));
    // Polymer's controls on the details page answer real clicks only.
    const clickVisible=async selector=>{
     const box=await page.evaluate(selector=>{const e=[...document.querySelectorAll(selector)].find(e=>e.offsetParent);if(!e)return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};},selector);
     if(!box)throw Error(locale+': nothing visible at '+selector);
     await page.mouse.click(box.x,box.y);await sleep(1500);
    };
    // The title/description language exists on the details page only; the video language is rechecked here too.
    const textLanguage=await page.evaluate(async label=>{
     const wait=ms=>new Promise(r=>setTimeout(r,ms));
     const selects=()=>[...document.querySelectorAll('ytcp-form-select')].filter(s=>/^(動画の言語|タイトルと説明の言語)/.test(s.innerText.trim()));
     if(selects().length<2||!selects()[0].offsetParent){document.querySelector('#toggle-button')?.click();await wait(2000);}
     let result='kept';
     for(let i=0;i<selects().length;i++){
      const select=selects()[i];if(select.innerText.includes(label))continue;
      (select.querySelector('#trigger')||select).click();await wait(1200);
      [...document.querySelectorAll('tp-yt-paper-item')].find(e=>e.offsetParent&&e.innerText.trim()===label)?.click();await wait(800);
      result=selects()[i].innerText.includes(label)?'changed':'';if(!result)return'';
     }
     return selects().length===2?result:'';
    },item.language);
    if(!textLanguage)throw Error(locale+': title/description language not set');
    const visibility=()=>page.evaluate(()=>document.querySelector('ytcp-video-metadata-visibility').innerText.replace(/\s+/g,' ').trim());
    if(!/ 公開$/.test(await visibility())){
     await clickVisible('ytcp-video-metadata-visibility');
     await clickVisible('tp-yt-paper-radio-button[name="PUBLIC"]');
     await clickVisible('#save-button');
     if(await page.evaluate(()=>[...document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog')].some(d=>d.offsetParent&&/まだ確認中|still being checked/.test(d.innerText)))){console.log(locale+': checks still running, later');continue;}
    }
    if(textLanguage==='changed'||!/ 公開$/.test(await visibility())||await page.evaluate(()=>!document.querySelector('ytcp-button#save')?.hasAttribute('disabled'))){await clickVisible('ytcp-button#save');await sleep(4000);}
    if(!/ 公開$/.test(await visibility()))throw Error(locale+': still '+await visibility());
    save(locale,{published:true});console.log(locale+': public');
   }catch(error){await shot(page,'publish-'+locale);throw error;}finally{await page.close();}
  }
 }finally{await browser.close();}
}

// YouTube cannot replace a video's file. A rebuilt video is uploaded as a new one: renew moves the old video to
// `retired`, and retire makes it private once the new one is public.
function renew(locales){
 for(const locale of locales){
  const item=read().items[locale],report=JSON.parse(fs.readFileSync(path.join(root,`promo-${locale}.json`),'utf8'));
  if(!item.videoId||item.uploadedSha256===report.sha256)continue;
  save(locale,{retired:[...(item.retired||[]),{videoId:item.videoId,private:false}],videoId:undefined,watchUrl:undefined,uploadedSha256:undefined,captionsUploaded:undefined,published:undefined,draftId:undefined});
  console.log(locale+': '+item.videoId+' will be replaced');
 }
}
async function retire(locales){
 const browser=await launch();
 try{
  for(const locale of locales){
   const item=read().items[locale];
   if(!item.published){if(item.retired?.some(r=>!r.private))console.log(locale+': the new video is not public yet; keep the old one');continue;}
   for(const old of item.retired||[]){
    if(old.private)continue;
    // oEmbed answers 200 only while anyone can watch; the Studio visibility label does not always read back.
    const watchable=async()=>(await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+old.videoId))).status===200;
    if(!await watchable()){save(locale,{retired:read().items[locale].retired.map(r=>r.videoId===old.videoId?{...r,private:true}:r)});console.log(locale+': '+old.videoId+' private');continue;}
    const page=await studioPage(browser);
    try{
     await page.goto('https://studio.youtube.com/video/'+old.videoId+'/edit',{waitUntil:'networkidle2',timeout:90000});
     for(let i=0;i<120&&!await page.evaluate(()=>!!document.querySelector('ytcp-video-metadata-visibility'));i++)await sleep(500);
     await sleep(2500);
     const clickVisible=async selector=>{
      const box=await page.evaluate(selector=>{const e=[...document.querySelectorAll(selector)].find(e=>e.offsetParent);if(!e)return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};},selector);
      if(!box)throw Error(locale+': nothing visible at '+selector);
      await page.mouse.click(box.x,box.y);await sleep(1500);
     };
     await clickVisible('ytcp-video-metadata-visibility');await clickVisible('tp-yt-paper-radio-button[name="PRIVATE"]');await clickVisible('#save-button');await clickVisible('ytcp-button#save');await sleep(4000);
     for(let i=0;i<30&&await watchable();i++)await sleep(1000);
     if(await watchable())throw Error(locale+': '+old.videoId+' is still watchable');
     save(locale,{retired:read().items[locale].retired.map(r=>r.videoId===old.videoId?{...r,private:true}:r)});
     console.log(locale+': '+old.videoId+' private');
    }catch(error){await shot(page,'retire-'+locale);throw error;}finally{await page.close();}
   }
  }
 }finally{await browser.close();}
}

// oEmbed answers 200 only for videos anyone can watch.
async function check(locales){
 let ok=true;
 for(const locale of locales){
  const item=read().items[locale],status=item.videoId?(await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(item.watchUrl))).status:'none';
  if(status!==200)ok=false;
  console.log(locale+': '+(item.videoId||'-')+' '+status);
 }
 if(!ok)process.exitCode=1;
}

if(require.main===module){
 const [command,...args]=process.argv.slice(2),locales=args.length?args:Object.keys(copy);
 ({metadata:async()=>metadata(),renew:async()=>renew(locales),retire:()=>retire(locales),upload:()=>upload(locales),captions:()=>captions(locales),publish:()=>publish(locales),check:()=>check(locales)}[command]||(()=>{throw Error('Usage: node formpilot/youtube-story.js renew|metadata|upload|captions|publish|retire|check [lang…]');}))().catch(error=>{console.error(error);process.exitCode=1;});
}
module.exports={metadata,studioLanguage};
