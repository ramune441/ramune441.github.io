// 実サイトと実拡張の操作を収録する。出力は一時ディレクトリ。公開・投稿は行わない。
// 画質: ヘッドレスChromeを --force-device-scale-factor=2 で起動し、1920x1080 の配置のまま2倍の密度で描かせる。
// コマは CDP の Page.startScreencast から JPEG 品質95で受け取り、そのまま保存する（puppeteer の page.screencast は
// 録画中に等倍へ戻したうえ VP9 で再圧縮するので使わない）。座標はすべて CSS px、コマは CSS px の2倍。
// 操作のたびに時刻・位置・関係する要素の箱を記録し、編集側（live-plan.mjs）はそこから注釈と効果音を置く。
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {languages} from './live-i18n.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const ext=resolve(process.env.SUBDUO_EXT||join(here,'../../SubDuo'));
// SUBDUO_LANG picks the video language (live-i18n.mjs): the extension's UI language and the lower subtitle line.
const lang=process.env.SUBDUO_LANG||'ja',L=languages[lang];if(!L)throw new Error('Unknown SUBDUO_LANG: '+lang);
// Not under the OS temp folder: disk clean-up empties it, deleting frames mid-build and the profile's translation models.
const base=join(process.env.LOCALAPPDATA||tmpdir(),'subduo-live-preview'),work=process.env.SUBDUO_CAPTURE_DIR||join(base,lang);
const {default:puppeteer}=await import(pathToFileURL(join(ext,'node_modules/puppeteer/lib/puppeteer/puppeteer.js')));
mkdirSync(work,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const source='https://www.youtube.com/watch?v=eRsGyueVLvQ',scale=2;
// 撮影専用プロファイルだけを使い、利用者の普段のプロファイルや単語帳には触れない。
const browser=await puppeteer.launch({headless:true,enableExtensions:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',userDataDir:join(base,'chrome'),
 args:[`--force-device-scale-factor=${scale}`,'--window-size=1920,1080','--autoplay-policy=no-user-gesture-required',`--lang=${L.html}`],defaultViewport:null});
const allMessages=JSON.parse(readFileSync(join(ext,'_locales',L.ui,'messages.json')));
const messages=Object.fromEntries(['navPrev','navNext','navRepeat','labelAutoPause','cardSave','cardSaved'].map(k=>[k,allMessages[k].message]));
const evidence={version:JSON.parse(readFileSync(join(ext,'package.json'))).version,source,lang,ui:L.ui,track:L.track,messages,capturedAt:new Date().toISOString(),liveSite:true,liveExtension:true,aiRequest:false,scale,checks:{},clips:[]};
try{
 await browser.installExtension(ext);
 const sw=await(await browser.waitForTarget(t=>t.type()==='service_worker'&&t.url().startsWith('chrome-extension://'))).worker();
 const extId=await sw.evaluate(()=>chrome.runtime.id);
 const settings=async patch=>sw.evaluate(async(patch,ui)=>{const s=(await chrome.storage.sync.get('subduo')).subduo||{};await chrome.storage.sync.set({subduoUiLang:ui,subduo:{...s,sites:{...s.sites,youtube:{...s.sites?.youtube,...patch}}}});},patch,L.ui);
 await settings({enabled:true,langA:'en',langB:L.track,fontScaleA:1.2,fontScaleB:1,anchorXPct:50,bottomPct:12,blurA:false,autoPause:false});
 await sw.evaluate(()=>chrome.storage.local.remove('subduoVocab'));
 const page=await browser.newPage();
 await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome','Chrome'));
 // The card's meaning comes from Chrome's on-device translator (picked line's language → UI language). A missing language
 // pack downloads only after a user gesture and takes longer than the card waits, so fetch it before recording.
 const translator=s=>/^zh[-_](tw|hant)/i.test(s)?'zh-Hant':s.split(/[-_]/)[0];
 const pick=L.pick||{line:'a',word:'searching'},pair={sourceLanguage:translator(pick.line==='a'?'en':L.track),targetLanguage:translator(L.ui)};
 if(pair.sourceLanguage!==pair.targetLanguage){
  await page.goto('https://www.youtube.com/robots.txt');
  const availability=()=>page.evaluate(p=>Translator.availability(p),pair);
  if(await availability()!=='available'){
   await page.evaluate(p=>{document.body.innerHTML='<button id=go style="width:300px;height:120px">download</button>';document.getElementById('go').onclick=()=>{window.__pack=Translator.create(p).then(()=>'ok',e=>e.message);};},pair);
   await page.click('#go');
   console.log('Translator pack',pair,await page.evaluate(()=>Promise.race([window.__pack,new Promise(r=>setTimeout(()=>r('timeout'),240000))])));
  }
  assert.equal(await availability(),'available',`端末内翻訳 ${pair.sourceLanguage}→${pair.targetLanguage} が使えない`);
 }
 await page.setViewport({width:1920,height:1080,deviceScaleFactor:scale});
 const cdp=await page.createCDPSession();
 const box=sel=>page.evaluate(sel=>{const e=document.querySelector(sel);if(!e||e.closest('.subduo-hidden'))return null;const r=e.getBoundingClientRect();return r.width?{x:r.x,y:r.y,w:r.width,h:r.height}:null;},sel);
 const state=()=>page.evaluate(()=>{const v=document.querySelector('video'),r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height};};
  if(!v)return{page:location.pathname};
  return{videoBox:r(v),time:v.currentTime,paused:v.paused,ready:v.readyState,error:v.error?.message||null,quality:document.querySelector('#movie_player')?.getPlaybackQuality?.()||null,
   a:document.querySelector('.subduo-a')?.textContent,b:document.querySelector('.subduo-b')?.textContent,boxA:r(document.querySelector('.subduo-a')),boxB:r(document.querySelector('.subduo-b')),
   font:getComputedStyle(document.querySelector('.subduo-a')).fontSize,card:document.querySelector('.subduo-card:not(.subduo-hidden)')?.innerText||'',cardBox:r(document.querySelector('.subduo-card:not(.subduo-hidden)'))};});
 let marks=[];
 const mark=async(name,extra={})=>{marks.push({name,t:Date.now()/1000,...extra});};
 // `expect` ({line,text}) holds the cue until that line shows that text; a slow load can play past it, then it reloads.
 const cue=async(t,expect)=>{
  // 独立した場面は通常のURLで開き直す。配信URLの期限切れや古いプレイヤーの失敗状態を持ち越さない。
  // 下段の字幕の取得がまれに間に合わないので、上下2段がそろわなければ開き直す。
  for(let attempt=1;;attempt++){
   try{
    await page.goto(source+'&t='+t+'s',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.querySelector('video')?.readyState>=3,{timeout:45000});
    // 2倍描画のプレイヤー幅（約2700px）に見合う配信品質を指定する。指定できない環境ではプレイヤー任せ。
    await page.evaluate(()=>{const p=document.querySelector('#movie_player'),levels=p?.getAvailableQualityLevels?.()||[];const best=levels.find(q=>['hd2160','hd1440','hd1080'].includes(q));if(best)p.setPlaybackQualityRange(best,best);});
    // 決まった時間だけ再生して止めると、読み込みの速さ次第で字幕の合間に止まる。2段とも出るまで再生してから止める。
    await page.evaluate(()=>document.querySelector('video').play());
    await page.waitForFunction((t,expect)=>{const v=document.querySelector('video'),shown=s=>{const e=document.querySelector(s);return e?.textContent&&e.getBoundingClientRect().width>0;};
     return v.currentTime>=t&&shown('.subduo-a')&&shown('.subduo-b')&&(!expect||document.querySelector('.subduo-'+expect.line).textContent.includes(expect.text));},{timeout:20000},t+.8,expect||null);
    break;
   }catch(e){
    await page.screenshot({path:join(work,`cue-failed-${attempt}.png`)}).catch(()=>{});
    if(attempt>=3)throw e;console.log('Retrying cue',t,'after',e.message);
   }
  }
  await page.evaluate(()=>document.querySelector('video').pause());await page.mouse.move(20,20);await sleep(1800);
  assert.equal((await state()).error,null);
  await page.evaluate(()=>{const el=document.createElement('div');el.id='recording-pointer';el.style.cssText='position:fixed;left:0;top:0;width:28px;height:34px;pointer-events:none;z-index:2147483647;filter:drop-shadow(1px 2px 3px #0008);display:none';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 28 34');const path=document.createElementNS(svg.namespaceURI,'path');for(const[k,v]of Object.entries({d:'M2 2V26L9 20L15 32L20 29L14 18H25Z',fill:'white',stroke:'#0f766e','stroke-width':'2'}))path.setAttribute(k,v);svg.append(path);el.append(svg);document.documentElement.append(el);
   // 字幕の行が替わった時刻と箱を記録する（D・S での移動や再生中の切り替わり）。
   window.__lines=[];const a=document.querySelector('.subduo-a');new MutationObserver(()=>{const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height};};window.__lines.push({name:'line',t:Date.now()/1000,a:a.textContent,boxA:r(a),boxB:r(document.querySelector('.subduo-b'))});}).observe(a,{childList:true,characterData:true,subtree:true});});
 };
 const move=async(x,y,steps=12)=>{await page.evaluate(({x,y})=>{const e=document.querySelector('#recording-pointer');e.style.display='block';e.style.transform=`translate(${x}px,${y}px)`;},{x,y});await page.mouse.move(x,y,{steps});};
 const center=b=>({x:b.x+b.w/2,y:b.y+b.h/2});
 const record=async(name,action)=>{
  const dir=join(work,name);rmSync(dir,{recursive:true,force:true});mkdirSync(dir,{recursive:true});
  const frames=[],writes=[];let first;const started=new Promise(r=>first=r);
  const onFrame=f=>{const file=String(frames.length+1).padStart(5,'0')+'.jpg';frames.push({file,t:f.metadata.timestamp});writes.push(writeFile(join(dir,file),Buffer.from(f.data,'base64')));cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{});first();};
  cdp.on('Page.screencastFrame',onFrame);
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:95});await started;
  marks=[];const start=Date.now();const before=await state();await mark('start');await action();const after=await state();
  await sleep(400);await cdp.send('Page.stopScreencast');cdp.off('Page.screencastFrame',onFrame);await Promise.all(writes);
  const lines=await page.evaluate(()=>window.__lines||[]).catch(()=>[]);
  const t0=frames[0].t,rel=t=>+(t-t0).toFixed(4);
  const clip={name,dir:name,frames:frames.map(f=>rel(f.t)),events:[...marks,...lines].map(m=>({...m,t:rel(m.t)})).sort((a,b)=>a.t-b.t),wallSeconds:(Date.now()-start)/1000,before,after};
  // 画面が変わらない間はコマが届かない（静止した単語帳など）。編集側は直前のコマを使い続ける。
  assert.ok(frames.length>0,'コマが届かない: '+name);
  evidence.clips.push(clip);writeFileSync(join(work,'capture.json'),JSON.stringify(evidence,null,2));
  console.log('Captured',name,frames.length,'frames',clip.wallSeconds.toFixed(1)+'s');
 };

 await cue(129.5);
 await record('dual',async()=>{await page.evaluate(()=>document.querySelector('video').play());await mark('play');await sleep(6500);await page.evaluate(()=>document.querySelector('video').pause());});
 evidence.checks.twoLanguages=!!(evidence.clips[0].before.a&&evidence.clips[0].before.b);

 // Every language starts these scenes on the same line, so the drag, the resize and D/S/Q look alike.
 const searching={line:'a',text:'searching'};
 await cue(135.15,searching);
 await record('position',async()=>{
  const b=(await state()).boxA,p=center(b);
  await move(p.x,p.y);await sleep(500);
  await mark('drag',{x:p.x,y:p.y,boxA:b});await page.mouse.down();await move(p.x+110,p.y-110,16);await page.mouse.up();
  await mark('dropped',{x:p.x+110,y:p.y-110,boxA:await box('.subduo-a'),boxB:await box('.subduo-b'),toolbar:await box('.subduo-toolbar')});
  await sleep(700);
  const a=await box('.subduo-a'),q=center(a);await move(q.x,q.y);await sleep(400);
  // ホイール1刻みで5%ずつ。拡大を8刻み、縮小を5刻み、目で追える間隔で回す。
  for(const [dir,count] of [['up',8],['down',5]]){
   // A notch can be dropped, so each one records the size the line actually has afterwards.
   for(let i=0;i<count;i++){
    const notch={name:'wheel',t:Date.now()/1000,dir,x:q.x,y:q.y};marks.push(notch);
    await page.mouse.wheel({deltaY:dir==='up'?-100:100});await sleep(150);
    notch.font=await page.$eval('.subduo-a',e=>getComputedStyle(e).fontSize);
   }
   await mark(dir==='up'?'grown':'shrunk',{boxA:await box('.subduo-a'),boxB:await box('.subduo-b'),font:await page.$eval('.subduo-a',e=>getComputedStyle(e).fontSize)});
   await sleep(700);
  }
  await move(30,30);await sleep(600);
 });
 {const p=evidence.clips[1],m=n=>p.events.find(e=>e.name===n);
  evidence.checks.drag=p.after.boxA.y<p.before.boxA.y-60;
  evidence.checks.resize=parseFloat(m('grown').font)>parseFloat(p.before.font)*1.3&&parseFloat(m('shrunk').font)<parseFloat(m('grown').font);}

 await page.keyboard.press('Escape');
 await settings({anchorXPct:50,bottomPct:12,fontScaleA:1.2});await cue(135.1,searching);
 await record('study',async()=>{
  await move(30,30);await page.evaluate(()=>document.activeElement?.blur());await sleep(500);
  // D → A → D shows moving both ways between lines, then S repeats the line and Q stops at its end.
  const press=async k=>{await mark('key',{key:k.toUpperCase()});await page.keyboard.press(k);};
  const a=await state();await press('d');await sleep(900);
  const d=await state();await press('a');await sleep(900);
  const back=await state();await press('d');await sleep(900);
  const d2=await state();await press('s');await sleep(650);
  const s=await state();
  evidence.checks.next=d.time>a.time&&d.a!==a.a&&d2.a===d.a;evidence.checks.prev=back.a===a.a&&back.time<d.time;evidence.checks.repeat=s.time<d2.time;
  await mark('key',{key:'Q'});await page.keyboard.press('q');await sleep(200);await mark('toast',{box:await box('.subduo-toast')});
  await page.waitForFunction(()=>document.querySelector('video').paused,{timeout:12000});await mark('paused');
  evidence.checks.autoPause=(await state()).paused;await sleep(1700);await page.keyboard.press('q');
 });

 await cue(135.1,{line:pick.line,text:pick.word});
 await record('word',async()=>{
  const words=await page.$$(`.subduo-${pick.line} .subduo-w`);const match=[];for(const w of words)if(await w.evaluate((e,word)=>e.textContent===word,pick.word))match.push(w);
  assert.equal(match.length,1,`字幕に「${pick.word}」が1つだけ見つからない: `+(await page.$eval(`.subduo-${pick.line}`,e=>e.textContent)));
  const b=await match[0].boundingBox(),p={x:b.x+b.width/2,y:b.y+b.height/2};
  await move(p.x,p.y);await sleep(700);
  await mark('alt',{x:p.x,y:p.y,word:{x:b.x,y:b.y,w:b.width,h:b.height}});
  await page.keyboard.down('Alt');await page.mouse.click(p.x,p.y);await page.keyboard.up('Alt');
  await page.waitForSelector('.subduo-card:not(.subduo-hidden)',{timeout:5000});await mark('card',{box:await box('.subduo-card')});await sleep(2100);
  const save=await box('.subduo-card-save'),q=center(save);await move(q.x,q.y);await sleep(500);
  await mark('save',{x:q.x,y:q.y,box:save,card:await box('.subduo-card')});await page.click('.subduo-card-save');await sleep(1500);
  evidence.checks.saved=await sw.evaluate(async word=>{const entries=(await chrome.storage.local.get('subduoVocab')).subduoVocab||[];return entries.length===1&&entries[0].phrase===word&&entries[0].sentence.includes(word);},pick.word);
 });

 await page.keyboard.press('Escape');
 await page.goto(`chrome-extension://${extId}/src/vocab.html`,{waitUntil:'domcontentloaded'});await sleep(1000);
 // 単語帳は実ページをそのまま収録する（内容の注入や架空の解説は行わない）。
 await record('vocab',async()=>{
  const r=sel=>page.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height};},sel);
  await mark('page',{entry:await r('.entry'),study:await r('#study'),body:await r('body')});await sleep(4500);
 });
 // The entry shows the meaning and the subtitle line only when the on-device translation worked.
 const text=await page.$eval('body',e=>e.innerText),sentence=evidence.clips.find(c=>c.name==='word').before[pick.line].trim();
 evidence.pick=pick;evidence.checks.vocabVisible=text.includes(pick.word)&&text.includes(sentence);
 assert.ok(Object.values(evidence.checks).every(Boolean),JSON.stringify(evidence.checks));
 writeFileSync(join(work,'capture.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence.checks));
}finally{await browser.close();}
