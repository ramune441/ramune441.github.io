// Upload the live demos (previews/live-demo-<lang>.mp4) to YouTube Studio (Just One More Animal) from the signed-in
// cws-profile, add each language's captions, and make them public once YouTube's checks are done. Same Studio steps
// as formpilot/youtube-story.js. The ledger is youtube-live.json (video ids, so a rerun never uploads twice).
// node subduo/youtube-live.mjs renew | metadata | upload | captions | publish | retire | check [lang…]
// The signed-in profile usually runs already with --remote-debugging-port=9333; the script then opens its own tabs
// there and closes only those. Otherwise it starts the profile headless.
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {languages,substituted,languageName} from './live-i18n.mjs';
const here=dirname(fileURLToPath(import.meta.url)),previews=join(here,'previews'),ledger=join(here,'youtube-live.json');
const puppeteer=createRequire(join(here,'../../SubDuo/package.json'))('puppeteer');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const read=()=>JSON.parse(readFileSync(ledger,'utf8'));
const save=(lang,values)=>{const all=read();all.items[lang]={...all.items[lang],...values};for(const k of Object.keys(all.items[lang]))if(all.items[lang][k]===undefined)delete all.items[lang][k];writeFileSync(ledger,JSON.stringify(all,null,2)+'\n');};
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const STORE='https://chromewebstore.google.com/detail/ngifacacaecobbekalngmocklcgkoigo';
// Language names as the (Japanese) Studio UI lists them.
const studioLanguage={ja:'日本語',en:'英語',es:'スペイン語',fr:'フランス語',pt:'ポルトガル語 (ブラジル)',id:'インドネシア語',ko:'韓国語',zh:'中国語 (簡体字)','zh-TW':'中国語 (繁体字)',de:'ドイツ語',it:'イタリア語',ru:'ロシア語',hi:'ヒンディー語',tr:'トルコ語',vi:'ベトナム語',th:'タイ語',pl:'ポーランド語',ar:'アラビア語',nl:'オランダ語',bn:'ベンガル語'};
// Title and the first line of the description; {lower} is the lower subtitle's language in the video's language.
const copy={
 ja:['SubDuo 実演：二言語字幕・一文ずつ再生・単語帳（Chrome拡張）','実際の YouTube で SubDuo を操作した様子です。上段は映画の英語、下段は{lower}の字幕です。'],
 en:['SubDuo in action: dual subtitles, line-by-line replay & vocabulary (Chrome extension)',"SubDuo used for real on YouTube: the film's English on top, {lower} below."],
 zh:['SubDuo 实际操作：双语字幕、逐句重播、生词本（Chrome 扩展）','在 YouTube 上实际使用 SubDuo 的演示：上方是影片的英语，下方是{lower}字幕。'],
 'zh-TW':['SubDuo 實際操作：雙語字幕、逐句重播、單字本（Chrome 擴充功能）','在 YouTube 上實際使用 SubDuo 的示範：上方是影片的英語，下方是{lower}字幕。'],
 ko:['SubDuo 실제 사용: 이중 자막·한 줄씩 다시 듣기·단어장 (Chrome 확장 프로그램)','YouTube에서 SubDuo를 실제로 사용한 모습입니다. 위는 영화의 영어, 아래는 {lower} 자막입니다.'],
 es:['SubDuo en acción: subtítulos dobles, repaso frase a frase y vocabulario (extensión de Chrome)','SubDuo usado de verdad en YouTube: arriba el inglés de la película, abajo {lower}.'],
 fr:['SubDuo en action : double sous-titrage, ligne par ligne et vocabulaire (extension Chrome)',"SubDuo utilisé pour de vrai sur YouTube : l'anglais du film en haut, {lower} en bas."],
 de:['SubDuo in Aktion: doppelte Untertitel, Zeile für Zeile und Vokabeln (Chrome-Erweiterung)','SubDuo im echten Einsatz auf YouTube: oben das Englisch des Films, unten {lower}.'],
 pt:['SubDuo na prática: legendas duplas, frase a frase e vocabulário (extensão do Chrome)','SubDuo usado de verdade no YouTube: em cima o inglês do filme, embaixo {lower}.'],
 hi:['SubDuo का डेमो: दो भाषाओं के सबटाइटल, पंक्ति दर पंक्ति और शब्दकोश (Chrome एक्सटेंशन)','YouTube पर SubDuo का असली इस्तेमाल: ऊपर फ़िल्म की अंग्रेज़ी, नीचे {lower}।'],
 id:['SubDuo beraksi: subtitel ganda, ulang baris demi baris, dan kosakata (ekstensi Chrome)','SubDuo dipakai langsung di YouTube: bahasa Inggris film di atas, {lower} di bawah.'],
 ar:['SubDuo عمليًا: ترجمة بلغتين، إعادة سطرًا بسطر، والمفردات (إضافة Chrome)','استخدام فعلي لـ SubDuo على YouTube: إنجليزية الفيلم في الأعلى، و{lower} في الأسفل.'],
 vi:['SubDuo thực tế: phụ đề song ngữ, nghe lại từng câu và từ vựng (tiện ích Chrome)','SubDuo dùng thật trên YouTube: tiếng Anh của phim ở trên, {lower} ở dưới.'],
 it:['SubDuo in azione: doppi sottotitoli, riga per riga e vocabolario (estensione Chrome)',"SubDuo usato davvero su YouTube: in alto l'inglese del film, in basso {lower}."],
 tr:['SubDuo iş başında: çift altyazı, satır satır tekrar ve sözcükler (Chrome uzantısı)',"SubDuo'nun YouTube'da gerçek kullanımı: üstte filmin İngilizcesi, altta {lower}."],
 pl:['SubDuo w akcji: podwójne napisy, zdanie po zdaniu i słownictwo (rozszerzenie Chrome)','SubDuo w prawdziwym użyciu na YouTube: u góry angielski z filmu, na dole {lower}.'],
 th:['SubDuo ใช้งานจริง: ซับสองภาษา ฟังซ้ำทีละประโยค และคำศัพท์ (ส่วนขยาย Chrome)','การใช้ SubDuo จริงบน YouTube: ด้านบนเป็นภาษาอังกฤษของภาพยนตร์ ด้านล่างเป็น{lower}'],
 nl:['SubDuo in actie: dubbele ondertitels, regel voor regel en woordenschat (Chrome-extensie)','SubDuo echt gebruikt op YouTube: boven het Engels van de film, onder {lower}.'],
 ru:['SubDuo в деле: двойные субтитры, построчное повторение и словарь (расширение Chrome)','SubDuo в реальной работе на YouTube: сверху английский фильма, снизу {lower}.'],
 bn:['SubDuo বাস্তবে: দুই ভাষার সাবটাইটেল, লাইন ধরে ধরে শোনা ও শব্দভান্ডার (Chrome এক্সটেনশন)','YouTube-এ SubDuo-র আসল ব্যবহার: ওপরে ছবির ইংরেজি, নিচে {lower}।'],
};

// Title, description (with the film's CC BY attribution, which the licence requires) and file hashes per language.
function metadata(langs){
 const meta=existsSync(ledger)?read():{channelId:'UCrjA6ffzb5pUw2URh0BcdRQ',items:{}};
 for(const lang of langs){
  const L=languages[lang],[title,intro]=copy[lang],file=`live-demo-${lang}.mp4`,captions=`live-demo-${lang}.vtt`;
  const report=JSON.parse(readFileSync(join(previews,`live-demo-${lang}.json`),'utf8'));
  if(report.sha256!==sha(join(previews,file)))throw Error(lang+': the video differs from its report; rebuild it');
  const note=substituted(lang)?'\n'+L.note.replace('{missing}',languageName(lang,L.html)).replace('{shown}',languageName(lang,L.track))+'.':'';
  const description=[intro.replace('{lower}',languageName(lang,L.track))+note,'',L.chapters.map((c,i)=>`${i+1}. ${c}`).join('\n'),'','Prime Video · YouTube · Netflix · Disney+ · TED','',
   '▶ Chrome Web Store: '+STORE,'🌐 https://ramune441.github.io/subduo/','📄 https://ramune441.github.io/subduo/privacy-policy.html','',
   `${L.credit}: Sintel © copyright Blender Foundation | durian.blender.org`,
   'CC BY 3.0 https://creativecommons.org/licenses/by/3.0/ — excerpted screen recording, cropped and retimed, with SubDuo’s UI, titles and annotations added. The film’s audio is not included.',
   '#SubDuo #dualsubtitles #languagelearning'].join('\n');
  if([...title].length>100||description.length>5000||/[<>]/.test(title+description))throw Error('YouTube metadata limit: '+lang);
  const old=meta.items[lang]||{};
  if(old.videoId&&old.uploadedSha256!==report.sha256)throw Error(`${lang}: the uploaded video ${old.videoId} is another file`);
  meta.items[lang]={...old,file,captions,sha256:report.sha256,title,description,language:studioLanguage[lang],visibility:'public',madeForKids:false,notifySubscribers:false};
 }
 writeFileSync(ledger,JSON.stringify(meta,null,2)+'\n');console.log('YouTube metadata: '+langs.length+' languages');
}

async function browserFor(){
 try{
  const browser=await puppeteer.connect({browserURL:'http://127.0.0.1:9333',defaultViewport:{width:1600,height:1000},protocolTimeout:600000});
  return{browser,attached:true};
 }catch{
  return{browser:await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:'C:/Users/Warlo/cws-profile',args:['--no-first-run'],protocolTimeout:600000,defaultViewport:{width:1600,height:1000}}),attached:false};
 }
}
const done=async({browser,attached})=>attached?browser.disconnect():browser.close();
async function studioPage({browser,attached}){
 const page=await browser.newPage();
 // Studio turns HeadlessChrome away as an unsupported browser.
 if(!attached)await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome','Chrome'));
 page.on('dialog',dialog=>dialog.accept().catch(()=>{}));
 return page;
}
async function shot(page,name){try{const file=join(process.env.LOCALAPPDATA,'subduo-live-preview',`youtube-${name}.png`);mkdirSync(dirname(file),{recursive:true});await page.screenshot({path:file});console.log('screenshot '+file);}catch{}}

async function upload(langs){
 const meta=read(),session=await browserFor();
 try{
  for(const lang of langs){
   const item=meta.items[lang],file=join(previews,item.file);
   if(item.videoId){console.log(lang+': already '+item.videoId);continue;}
   if(sha(file)!==item.sha256)throw Error(lang+': file differs from metadata; run metadata');
   const page=await studioPage(session);
   try{
    // An interrupted upload stays as a draft; resume it (draftId) instead of uploading the file twice.
    await page.goto('https://studio.youtube.com/channel/'+meta.channelId+'/videos/upload?d=ud'+(item.draftId?'&udvid='+item.draftId:''),{waitUntil:'networkidle2',timeout:90000});
    if(!item.draftId){
     for(let i=0;i<120&&!await page.evaluate(()=>!!document.querySelector('input[type=file]'));i++)await sleep(500);
     // Puppeteer's element handles hang on Studio pages; set the file through CDP.
     const client=await page.createCDPSession();
     const {root:doc}=await client.send('DOM.getDocument',{depth:-1,pierce:true});
     const {nodeId}=await client.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'input[type=file]'});
     if(!nodeId)throw Error(lang+': upload input not found (signed out?)');
     await client.send('DOM.setFileInputFiles',{nodeId,files:[file]});
     // Record the draft as soon as Studio names it, so a failure later resumes it.
     let draftId=null;
     for(let i=0;i<120&&!draftId;i++){await sleep(500);draftId=new URL(page.url()).searchParams.get('udvid')||await page.evaluate(()=>([...document.querySelectorAll('ytcp-uploads-dialog a')].map(a=>a.href).find(h=>/youtu\.be\//.test(h))||'').split('/').pop()||null);}
     if(!draftId)throw Error(lang+': the upload did not get a video id');
     save(lang,{draftId});
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
    const id=result.link?.split('/').pop();
    if(!id||result.title!==item.title||!result.descriptionOk||!result.categorySet||!result.notifyOff)throw Error(lang+': '+JSON.stringify(result));
    if(!result.languageSet)console.log(lang+': video language left for the details page');
    save(lang,{videoId:id,watchUrl:'https://www.youtube.com/watch?v='+id,uploadedSha256:item.sha256,draftId:undefined,uploadedAt:new Date().toISOString()});
    console.log(lang+': '+id+' '+result.progress.replace(/\s+/g,' '));
    await sleep(3000);
   }catch(error){await shot(page,'upload-'+lang);throw error;}finally{await page.close();}
  }
 }finally{await done(session);}
}

// The video language and the title/description language, set on the details page and saved (visibility unchanged).
async function setLanguages(page,lang,label){
 await page.goto('https://studio.youtube.com/video/'+read().items[lang].videoId+'/edit',{waitUntil:'networkidle2',timeout:90000});
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
 if(!result)throw Error(lang+': video and title/description language not set');
 if(result==='changed'){
  const box=await page.evaluate(()=>{const e=document.querySelector('ytcp-button#save');e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};});
  await page.mouse.click(box.x,box.y);
  // Saving dims the page for a while; the save button turns disabled once it is done.
  for(let i=0;i<30&&await page.evaluate(()=>!document.querySelector('ytcp-button#save')?.hasAttribute('disabled'));i++)await sleep(500);
  if(await page.evaluate(()=>!document.querySelector('ytcp-button#save')?.hasAttribute('disabled')))throw Error(lang+': language change not saved');
 }
 return result;
}

// Captions in the video's language: Language page → upload manually → with timecodes.
async function captions(langs){
 const session=await browserFor();
 try{
  for(const lang of langs){
   const item=read().items[lang];
   if(!item.videoId||item.captionsUploaded)continue;
   const page=await studioPage(session);
   try{
    console.log(lang+': language '+await setLanguages(page,lang,item.language));
    await page.goto('https://studio.youtube.com/video/'+item.videoId+'/translations',{waitUntil:'networkidle2',timeout:90000});
    for(let i=0;i<60&&!await page.evaluate(()=>!!document.querySelector('#upload-default-language-button'));i++)await sleep(500);
    let heading='';
    for(let i=0;i<30&&!heading.includes('動画の言語: '+item.language);i++){await sleep(500);heading=await page.evaluate(()=>(document.querySelector('ytgn-video-translations-section')?.innerText||'').replace(/\s+/g,' '));}
    if(!heading.includes('動画の言語: '+item.language))throw Error(lang+': video language is not '+item.language);
    await page.evaluate(()=>document.querySelector('#upload-default-language-button').click());await sleep(2000);
    await page.evaluate(()=>[...document.querySelectorAll('tp-yt-paper-radio-button[name="with-timing"]')].find(e=>e.offsetParent).click());await sleep(800);
    // The format dialog sometimes ignores the first press of 続行; press until it closes.
    for(let i=0;i<5;i++){
     const open=await page.evaluate(()=>{const d=[...document.querySelectorAll('ytcp-dialog')].find(x=>x.offsetParent&&/ファイル形式を選択/.test(x.innerText));if(!d)return false;[...d.querySelectorAll('ytcp-button')].find(b=>/続行/.test(b.innerText))?.click();return true;});
     await sleep(2000);if(!open)break;
    }
    const client=await page.createCDPSession();
    const {root:doc}=await client.send('DOM.getDocument',{depth:-1,pierce:true});
    const {nodeIds}=await client.send('DOM.querySelectorAll',{nodeId:doc.nodeId,selector:'input[type=file]'});
    if(!nodeIds.length)throw Error(lang+': caption file input not found');
    await client.send('DOM.setFileInputFiles',{nodeId:nodeIds[nodeIds.length-1],files:[join(previews,item.captions)]});
    // Studio publishes the file at once and confirms with a toast such as 「英語 の字幕をアップロードしました」.
    let toast='';
    for(let i=0;i<40&&!toast;i++){await sleep(500);toast=await page.evaluate(()=>[...document.querySelectorAll('tp-yt-paper-toast, ytcp-toast, #toast')].map(t=>t.innerText.trim()).find(t=>/字幕をアップロードしました/.test(t))||'');}
    if(!toast.includes(item.language))throw Error(lang+': caption upload not confirmed: '+toast);
    save(lang,{captionsUploaded:true});console.log(lang+': '+toast);
   }catch(error){await shot(page,'captions-'+lang);throw error;}finally{await page.close();}
  }
 }finally{await done(session);}
}

// A private video goes public from its details page once YouTube's checks are done; until then it stays private.
async function publish(langs){
 const session=await browserFor();
 try{
  for(const lang of langs){
   const item=read().items[lang];
   if(!item.videoId||item.published&&item.publicVerifiedAt)continue;
   const page=await studioPage(session);
   try{
    await page.goto('https://studio.youtube.com/video/'+item.videoId+'/edit',{waitUntil:'networkidle2',timeout:90000});
    for(let i=0;i<120&&!await page.evaluate(()=>!!document.querySelector('ytcp-video-title #textbox'));i++)await sleep(500);
    await sleep(2500);
    const r=await page.evaluate(()=>({title:document.querySelector('ytcp-video-title #textbox').innerText.trim(),description:document.querySelector('ytcp-video-description #textbox').innerText.trim()}));
    if(r.title!==item.title||r.description!==item.description)throw Error(lang+': metadata mismatch '+JSON.stringify(r).slice(0,200));
    // Polymer's controls on the details page answer real clicks only.
    const clickVisible=async selector=>{
     // The visibility dialog can take a few seconds to render its options.
     let box=null;
     for(let i=0;i<20&&!box;i++,await sleep(i&&!box?500:0))box=await page.evaluate(selector=>{const e=[...document.querySelectorAll(selector)].find(e=>e.offsetParent);if(!e)return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};},selector);
     if(!box)throw Error(lang+': nothing visible at '+selector);
     await page.mouse.click(box.x,box.y);await sleep(1500);
    };
    // The store shows the video embedded, and the channel's upload default does not allow embedding: tick it here.
    const embed=await page.evaluate(async()=>{
     const wait=ms=>new Promise(r=>setTimeout(r,ms));
     const find=()=>[...document.querySelectorAll('ytcp-checkbox-lit, tp-yt-paper-checkbox')].find(e=>/埋め込みを許可/.test(e.innerText));
     if(!find()?.offsetParent){document.querySelector('#toggle-button')?.click();await wait(2000);}
     const el=find();if(!el)return'';el.scrollIntoView({block:'center'});
     const box=el.querySelector('[role=checkbox]')||el;
     if(box.getAttribute('aria-checked')!=='true'){box.click();await wait(800);}
     return box.getAttribute('aria-checked')==='true'?'on':'';
    });
    if(!embed)throw Error(lang+': could not allow embedding');
    const visibility=()=>page.evaluate(()=>document.querySelector('ytcp-video-metadata-visibility').innerText.replace(/\s+/g,' ').trim());
    if(!/ 公開$/.test(await visibility())){
     await clickVisible('ytcp-video-metadata-visibility');
     await clickVisible('tp-yt-paper-radio-button[name="PUBLIC"]');
     await clickVisible('#save-button');
     if(await page.evaluate(()=>[...document.querySelectorAll('tp-yt-paper-dialog, ytcp-dialog')].some(d=>d.offsetParent&&/まだ確認中|still being checked/.test(d.innerText)))){console.log(lang+': checks still running, later');continue;}
    }
    if(!/ 公開$/.test(await visibility())||await page.evaluate(()=>!document.querySelector('ytcp-button#save')?.hasAttribute('disabled'))){await clickVisible('ytcp-button#save');await sleep(4000);}
    // The page can show 公開 after saving while Studio keeps the video private (checks still running); reload to know.
    await page.reload({waitUntil:'networkidle2',timeout:90000});
    for(let i=0;i<120&&!await page.evaluate(()=>!!document.querySelector('ytcp-video-metadata-visibility'));i++)await sleep(500);
    await sleep(2500);
    if(!/ 公開$/.test(await visibility())){console.log(lang+': still '+await visibility()+' after reload, later');continue;}
    save(lang,{published:true,publishedAt:new Date().toISOString()});console.log(lang+': public');
   }catch(error){await shot(page,'publish-'+lang);throw error;}finally{await page.close();}
  }
 }finally{await done(session);}
}

// oEmbed answers 200 only for videos anyone can watch and embed; the title and channel are checked too.
async function check(langs){
 let ok=true;
 for(const lang of langs){
  const item=read().items[lang];
  const r=item?.videoId?await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(item.watchUrl)):null;
  const data=r?.status===200?await r.json():null,good=!!data&&data.title===item.title&&data.author_name==='Just One More Animal';
  if(good&&!item.publicVerifiedAt)save(lang,{publicVerifiedAt:new Date().toISOString()});
  if(!good)ok=false;
  console.log(lang+': '+(item?.videoId||'-')+' '+(r?r.status:'none')+(good?' ok':''));
 }
 if(!ok)process.exitCode=1;
}

// A rebuilt video cannot replace the uploaded file: the old entry moves to `retired` and the new file is uploaded anew.
function renew(langs){
 const all=read();all.retired||=[];
 for(const lang of langs){
  const item=all.items[lang],report=JSON.parse(readFileSync(join(previews,`live-demo-${lang}.json`),'utf8'));
  if(!item?.videoId||item.uploadedSha256===report.sha256)continue;
  all.retired.push({lang,videoId:item.videoId,watchUrl:item.watchUrl,title:item.title,replacedAt:new Date().toISOString()});delete all.items[lang];
  console.log(lang+': '+item.videoId+' retired');
 }
 writeFileSync(ledger,JSON.stringify(all,null,2)+'\n');
}

// Retired videos go private once their language's new video is public (the store keeps pointing somewhere public).
async function retire(langs){
 const session=await browserFor();
 try{
  for(const old of read().retired||[]){
   if(!langs.includes(old.lang)||old.privateAt)continue;
   if(!read().items[old.lang]?.publicVerifiedAt){console.log(old.lang+': the new video is not public yet, later');continue;}
   const page=await studioPage(session);
   try{
    await page.goto('https://studio.youtube.com/video/'+old.videoId+'/edit',{waitUntil:'networkidle2',timeout:90000});
    for(let i=0;i<120&&!await page.evaluate(()=>!!document.querySelector('ytcp-video-metadata-visibility'));i++)await sleep(500);
    await sleep(2500);
    const visibility=()=>page.evaluate(()=>document.querySelector('ytcp-video-metadata-visibility').innerText.replace(/\s+/g,' ').trim());
    const clickVisible=async selector=>{
     let box=null;
     for(let i=0;i<20&&!box;i++,await sleep(i&&!box?500:0))box=await page.evaluate(selector=>{const e=[...document.querySelectorAll(selector)].find(e=>e.offsetParent);if(!e)return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};},selector);
     if(!box)throw Error(old.lang+': nothing visible at '+selector);
     await page.mouse.click(box.x,box.y);await sleep(1500);
    };
    if(!/ 非公開$/.test(await visibility())){
     await clickVisible('ytcp-video-metadata-visibility');
     await clickVisible('tp-yt-paper-radio-button[name="PRIVATE"]');
     await clickVisible('#save-button');
     await clickVisible('ytcp-button#save');await sleep(4000);
    }
    if(!/ 非公開$/.test(await visibility()))throw Error(old.lang+': still '+await visibility());
    const all=read();all.retired.find(r=>r.videoId===old.videoId).privateAt=new Date().toISOString();writeFileSync(ledger,JSON.stringify(all,null,2)+'\n');
    console.log(old.lang+': '+old.videoId+' private');
   }catch(error){await shot(page,'retire-'+old.lang);throw error;}finally{await page.close();}
  }
 }finally{await done(session);}
}

const [command,...args]=process.argv.slice(2),langs=args.length?args:Object.keys(languages);
const commands={renew:async()=>renew(langs),metadata:async()=>metadata(langs),upload:()=>upload(langs),captions:()=>captions(langs),publish:()=>publish(langs),retire:()=>retire(langs),check:()=>check(langs)};
(commands[command]||(()=>{throw Error('Usage: node subduo/youtube-live.mjs renew|metadata|upload|captions|publish|retire|check [lang…]');}))().catch(error=>{console.error(error);process.exitCode=1;});
