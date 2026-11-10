// Record the real extension against a local fictional contact form. One live AI
// request; saving and restoring use the actual popup and persistent Chrome data.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile);
const ext=path.resolve(process.env.FORMPILOT_EXT||path.join(__dirname,'../../formpilot'));
const puppeteer=require(path.join(ext,'node_modules/puppeteer')),chrome=puppeteer.executablePath();
const media=path.join(os.tmpdir(),'formpilot-media-tools/node_modules'),ffmpeg=require(path.join(media,'ffmpeg-static')),ffprobe=require(path.join(media,'ffprobe-static')).path;
const work=path.join(os.tmpdir(),'formpilot-live-demo-ja'),output=path.join(__dirname,'previews');
fs.mkdirSync(work,{recursive:true});fs.mkdirSync(output,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function probe(file){return JSON.parse((await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file])).stdout);}
async function duration(file){const info=await probe(file);if(Number.isFinite(+info.format.duration))return +info.format.duration;const p=JSON.parse((await run(ffprobe,['-v','error','-select_streams','v:0','-show_entries','packet=pts_time,duration_time','-of','json',file],{maxBuffer:4e6})).stdout).packets;return Math.max(...p.map(x=>+x.pts_time+(+x.duration_time||1/30)));}
async function cursor(page,selector,beforeClick){
 await page.evaluate(selector=>{let p=document.getElementById('recording-pointer');if(!p){p=document.createElement('div');p.id='recording-pointer';p.style.cssText='position:fixed;left:0;top:0;width:24px;height:30px;pointer-events:none;z-index:2147483647;transition:transform .4s ease;filter:drop-shadow(1px 2px 2px #0006)';p.innerHTML='<svg viewBox="0 0 24 30"><path d="M2 2L2 23L8 18L13 28L17 26L12 16L21 15Z" fill="white" stroke="#064e3b" stroke-width="2"/></svg>';document.body.appendChild(p);}const b=document.querySelector(selector).getBoundingClientRect(),zoom=Number(getComputedStyle(document.documentElement).zoom)||1;p.style.transform=`translate(${(b.x+b.width*.65)/zoom}px,${(b.y+b.height*.55)/zoom}px)`;},selector);
 await sleep(550);if(beforeClick)await beforeClick();await page.evaluate(selector=>document.querySelector(selector).click(),selector);
}
async function capture(){
 const posts=[];const server=http.createServer((req,res)=>{if(req.method!=='GET'){posts.push(req.method);res.writeHead(405).end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(__dirname,'live-demo.html')));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,framesTask,stopFrames=false;
 const evidence={extension:'pedgekkfockobnmkokefjkclahjekend',liveAI:true,marks:{},pageSubmissions:posts};
 try{
  browser=await puppeteer.launch({executablePath:chrome,headless:true,enableExtensions:true,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`,'--disable-background-timer-throttling','--disable-renderer-backgrounding'],protocolTimeout:45000});
  console.log('Isolated recording browser started.');
  const target=await browser.waitForTarget(t=>t.type()==='service_worker');assert.equal(new URL(target.url()).host,evidence.extension);
  const worker=await target.worker();
  await worker.evaluate(()=>{globalThis.demoNetwork=[];const realFetch=globalThis.fetch;globalThis.fetch=async(...args)=>{const r=await realFetch(...args);globalThis.demoNetwork.push({url:String(args[0]),status:r.status});return r;};});
  console.log('Real extension service worker ready.');
  const control=await browser.newPage();await control.goto(`chrome-extension://${evidence.extension}/popup.html`);
  const profile=require(path.join(ext,'scripts/build-store-assets')).sample('ja').profile;
  profile.email='taro@example.com';profile.customFields=[{key:'お問い合わせ種別',value:'製品について'},{key:'お問い合わせ内容',value:'製品について詳しく教えてください。'}];
  await control.evaluate(async profile=>{await chrome.storage.local.clear();await chrome.storage.local.set({lang:'ja',theme:'light',skipFilled:false,onboardDismissed:true,profiles:{activePresetId:'p1',presets:{p1:{name:'個人用',data:profile,shortcut:'Alt+Shift+1',createdAt:new Date().toISOString()}}},siteProfiles:{}});},profile);
  const url=`http://127.0.0.1:${server.address().port}/contact`;
  const tab=await control.evaluate(url=>chrome.tabs.create({url,active:true}),url);
  const form=await(await browser.waitForTarget(t=>t.url()===url)).page();await form.setViewport({width:2560,height:1800,deviceScaleFactor:1});await form.evaluate(()=>{document.documentElement.style.zoom='2';});
  // The popup is captured as a background tab. Route only its active-tab lookup
  // to this local form, as a toolbar popup would; Chrome storage, messages,
  // live AI, collection, writing, saving and restoration remain real.
  await control.evaluateOnNewDocument(({tabId,url})=>{const query=chrome.tabs.query.bind(chrome.tabs);chrome.tabs.query=async options=>options?.active&&options?.currentWindow?[{id:tabId,url,title:'お問い合わせフォーム'}]:query(options);},{tabId:tab.id,url});
  evidence.popupCapture='real popup in a background tab with active-tab routing to the local form';
  await control.reload({waitUntil:'load'});await control.setViewport({width:800,height:1160,deviceScaleFactor:1});await control.evaluate(()=>{document.documentElement.style.zoom='2';});
  await control.waitForFunction(()=>document.documentElement.lang==='ja'&&document.querySelector('#run-preset-select').value==='p1');
  await form.bringToFront();
  await control.evaluate(()=>checkSiteData());
  const active=await control.evaluate(async()=> (await chrome.tabs.query({active:true,currentWindow:true}))[0].id);assert.equal(active,tab.id);
  for(let i=0;i<40;i++){try{if((await control.evaluate(id=>chrome.tabs.sendMessage(id,{action:'ping'}),tab.id))?.pong)break;}catch{}await sleep(100);}
  const read=()=>form.evaluate(()=>Object.fromEntries([...document.querySelectorAll('input,select,textarea')].map(el=>[el.name,el.value])));
  evidence.empty=await read();assert.ok(Object.values(evidence.empty).every(v=>v===''));
  await Promise.all([form.evaluate(()=>document.fonts.ready),control.evaluate(()=>document.fonts.ready)]);
  await form.screenshot({path:path.join(work,'form-before.png')});await control.screenshot({path:path.join(work,'popup-before.png')});
  const frames=[],frameStart=Date.now();let pauseFrames=false,frameBusy=false,lastForm=fs.readFileSync(path.join(work,'form-before.png')),popupFrame=fs.readFileSync(path.join(work,'popup-before.png'));
  // Keep the form foreground while recording; refresh the real popup image
  // between interactions, without simultaneous captures of hidden surfaces.
  const refreshPopup=async()=>{pauseFrames=true;while(frameBusy)await sleep(20);try{await control.bringToFront();popupFrame=await control.screenshot();}finally{await form.bringToFront();pauseFrames=false;}};
  const popupClick=async selector=>{await form.bringToFront();await cursor(control,selector,refreshPopup);await sleep(200);await refreshPopup();};
  framesTask=(async()=>{let index=0;while(!stopFrames){if(pauseFrames){await sleep(20);continue;}const time=(Date.now()-frameStart)/1000;const names=['form','popup'].map(name=>path.join(work,`${name}-${String(index).padStart(5,'0')}.png`));frameBusy=true;try{lastForm=await form.screenshot();fs.writeFileSync(names[0],lastForm);fs.writeFileSync(names[1],popupFrame);frames.push({time,names});index++;}finally{frameBusy=false;}await sleep(60);}})();
  const start=Date.now(),mark=name=>{evidence.marks[name]=(Date.now()-start)/1000;console.log('STEP '+name+' '+evidence.marks[name]+'s');};
  mark('begin');await sleep(1600);await popupClick('#analyze-btn');console.log('AI request started through the real popup.');
  await control.waitForFunction(async()=>{const s=await chrome.runtime.sendMessage({action:'getAutoFillStatus'});if(s?.state==='error')throw Error(s.message);return s?.state==='done';},{timeout:90000,polling:200});
  evidence.aiStatus=await control.evaluate(()=>chrome.runtime.sendMessage({action:'getAutoFillStatus'}));
  evidence.filled=await read();assert.equal(evidence.filled.lastName,'山田');assert.equal(evidence.filled.firstName,'太郎');assert.equal(evidence.filled.email,'taro@example.com');assert.equal(evidence.filled.state,'東京都');assert.equal(evidence.filled.inquiry,'製品について');assert.equal(evidence.filled.message,profile.customFields[1].value);assert.equal(Object.values(evidence.filled).filter(Boolean).length,9);
  await refreshPopup();
  mark('filled');await sleep(1600);await cursor(form,'textarea');await form.evaluate(()=>{document.querySelector('textarea').focus();document.querySelector('textarea').select();});await form.keyboard.type('請求書の送付先を変更したいです。',{delay:45});await sleep(1000);
  evidence.beforeSave=await read();assert.equal(evidence.beforeSave.message,'請求書の送付先を変更したいです。');
  mark('save');await popupClick('#site-save-btn');await control.waitForFunction(()=>document.querySelector('.site-save-dialog.visible'),{polling:200});await sleep(700);await control.evaluate(()=>document.querySelector('.site-save-name-input').focus());await control.keyboard.type('お問い合わせ用',{delay:140});await refreshPopup();await sleep(900);await popupClick('.btn-site-save-confirm');await control.waitForFunction(()=>document.querySelector('.btn-history-restore'),{polling:200});await sleep(1800);
  const saved=await control.evaluate(()=>chrome.storage.local.get('siteProfiles'));evidence.savedEntries=Object.values(saved.siteProfiles).flat();assert.equal(evidence.savedEntries.length,1);assert.equal(evidence.savedEntries[0].name,'お問い合わせ用');assert.equal(Object.keys(evidence.savedEntries[0].fields).length,9);
  fs.writeFileSync(path.join(work,'popup-saved.png'),popupFrame);
  mark('reopen');await Promise.all([form.waitForNavigation({waitUntil:'load'}),cursor(form,'#reopen')]);await form.evaluate(()=>{document.documentElement.style.zoom='2';});await sleep(1300);evidence.reopened=await read();assert.deepEqual(evidence.reopened,evidence.empty);
  fs.writeFileSync(path.join(work,'form-reopened.png'),lastForm);
  evidence.aiCallsBeforeRestore=await worker.evaluate(()=>globalThis.demoNetwork.length);
  mark('restore');await popupClick('.btn-history-restore');await form.waitForFunction(()=>document.querySelector('textarea').value==='請求書の送付先を変更したいです。',{polling:200});await sleep(600);evidence.restored=await read();assert.deepEqual(evidence.restored,evidence.beforeSave);
  evidence.aiCallsAfterRestore=await worker.evaluate(()=>globalThis.demoNetwork.length);evidence.network=await worker.evaluate(()=>globalThis.demoNetwork);assert.equal(evidence.aiCallsBeforeRestore,evidence.aiCallsAfterRestore);assert.ok(evidence.network.some(r=>r.status===200));assert.deepEqual(posts,[]);
  fs.writeFileSync(path.join(work,'form-restored.png'),lastForm);fs.writeFileSync(path.join(work,'popup-restored.png'),popupFrame);await sleep(3000);mark('end');
  fs.writeFileSync(path.join(work,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  stopFrames=true;await framesTask;framesTask=null;
  for(const [i,name] of ['form','popup'].entries()){
   const list=path.join(work,`${name}-frames.txt`),last=frames.at(-1).names[i].replace(/\\/g,'/');
   const lines=frames.map((frame,n)=>`file '${frame.names[i].replace(/\\/g,'/')}'\nduration ${Math.max(.03,(frames[n+1]?.time||evidence.marks.end)-frame.time)}`);
   lines.push("file '"+last+"'");fs.writeFileSync(list,lines.join('\n')+'\n');
   await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','18','-threads','4','-an',path.join(work,name+'.raw.mp4')],{timeout:300000,maxBuffer:2e6});
  }
  console.log('PASS: real AI filled 9 fields; actual popup saved them; reload cleared them; restore recovered the edited values with no AI request or form submission.');
 }finally{stopFrames=true;if(framesTask)await framesTask.catch(()=>{});if(browser)await browser.close();await new Promise(r=>server.close(r));}
 return evidence;
}
async function stageImages(){
 const browser=await puppeteer.launch({headless:true,executablePath:chrome});try{
  const page=await browser.newPage();await page.setViewport({width:3840,height:2160,deviceScaleFactor:1});
  const titles=['AIがフォームを自動入力','入力内容を確認・編集','入力した内容を保存','フォームを開き直す','保存した内容をワンクリックで復元'];
  for(let i=0;i<titles.length;i++){
   await page.setContent(`<html lang="ja"><style>*{box-sizing:border-box}body{margin:0;width:3840px;height:2160px;background:linear-gradient(130deg,#ecfdf5,#f8fafc);font-family:'Yu Gothic','Meiryo',sans-serif;color:#064e3b}h1{position:absolute;top:55px;left:100px;font-size:82px;margin:0;font-weight:800}.line{position:absolute;top:176px;left:104px;font-size:44px;color:#475569}.card{position:absolute;top:290px;left:85px;width:1080px;height:1560px;background:white;box-shadow:0 16px 60px #0f172a12;border:2px solid #d1fae5;border-radius:32px}.right{left:1230px;top:285px;width:2510px;height:1780px}.foot{position:absolute;left:105px;bottom:88px;font-size:38px;color:#047857}.count{position:absolute;right:110px;top:100px;color:#10b981;font-size:52px;font-weight:800}</style><h1>${titles[i]}</h1><div class="line">一度入力した内容を、次回もそのまま。</div><div class="count">FormPilot</div><div class="card"></div><div class="card right"></div><div class="foot">自動入力 → 保存 → 復元</div></html>`);
   await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(work,`stage-${i}.png`)});
  }
 }finally{await browser.close();}
}
async function encode(evidence){
 await stageImages();
 const marks=evidence.marks,phases=[['begin','filled',4.5],['filled','save',3.5],['save','reopen',5.5],['reopen','restore',3.5],['restore','end',4.5]];
 const streams=await Promise.all(['form','popup'].map(async name=>({name,duration:await duration(path.join(work,name+'.raw.mp4'))})));
 const segments=[];
 for(let index=0;index<phases.length;index++){
  const [from,to,seconds]=phases[index],file=path.join(work,`demo-${index}.mp4`);segments.push(file);
  const trim=stream=>{const scale=stream.duration/marks.end,start=marks[from]*scale,end=marks[to]*scale;return `trim=start=${start}:end=${end},setpts=(PTS-STARTPTS)*${seconds/(end-start)},fps=30`};
  const filter=`[0:v]${trim(streams[0])},scale=2470:1737,setsar=1[form];[1:v]${trim(streams[1])},scale=1040:1508,setsar=1[popup];[2:v]fps=30,setsar=1[bg];[bg][popup]overlay=105:315[one];[one][form]overlay=1250:305,format=yuv420p[v]`;
  await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',path.join(work,'form.raw.mp4'),'-i',path.join(work,'popup.raw.mp4'),'-loop','1','-i',path.join(work,`stage-${index}.png`),'-filter_complex_threads','2','-filter_complex',filter,'-map','[v]','-t',String(seconds),'-c:v','libx264','-profile:v','high','-pix_fmt','yuv420p','-crf','19','-preset','veryfast','-threads','4','-an',file],{timeout:300000,maxBuffer:2e6});console.log(`Encoded actual demo ${index+1}/5`);
 }
 const reference=path.join(__dirname,'promo-ja.mp4'),intro=path.join(work,'intro.mp4'),outro=path.join(work,'outro.mp4');
 for(const [file,start,seconds] of [[intro,0,7],[outro,28.5,4.5]])await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-ss',String(start),'-i',reference,'-t',String(seconds),'-an','-vf','setsar=1,fps=30,format=yuv420p','-c:v','libx264','-profile:v','high','-crf','19','-preset','veryfast','-threads','4',file],{timeout:180000});
 const list=path.join(work,'concat.txt');fs.writeFileSync(list,[intro,...segments,outro].map(f=>`file '${f.replace(/\\/g,'/')}'`).join('\n'));
 const file=path.join(output,'promo-ja-demo.mp4');
 await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-i',reference,'-map','0:v:0','-map','1:a:0','-c','copy','-t','33','-movflags','+faststart',file],{timeout:180000});
 await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-ss','21','-i',file,'-frames:v','1','-vf','scale=1280:720',path.join(output,'promo-ja-demo-poster.jpg')]);
 await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',file,'-vf',"select='eq(n,60)+eq(n,300)+eq(n,420)+eq(n,540)+eq(n,660)+eq(n,810)',scale=800:450,tile=3x2",'-frames:v','1',path.join(output,'promo-ja-demo-scenes.jpg')]);
 const info=await probe(file);evidence.output={file:path.basename(file),duration:+info.format.duration,bytes:fs.statSync(file).size,width:info.streams[0].width,height:info.streams[0].height,audioCodec:info.streams.find(s=>s.codec_type==='audio')?.codec_name};
 assert.equal(evidence.output.width,3840);assert.equal(evidence.output.height,2160);assert.ok(Math.abs(evidence.output.duration-33)<.1);assert.equal(evidence.output.audioCodec,'aac');
 fs.writeFileSync(path.join(output,'promo-ja-demo-report.json'),JSON.stringify(evidence,null,2)+'\n');
 fs.writeFileSync(path.join(output,'demo.html'),'<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>FormPilot 実操作デモ</title><style>body{margin:24px;background:#f0fdf4;color:#064e3b;font:16px system-ui}main{max-width:1200px;margin:auto}video{width:100%;border-radius:16px}</style><main><h1>FormPilot 自動入力・保存・復元</h1><video controls playsinline preload="metadata" poster="promo-ja-demo-poster.jpg" src="promo-ja-demo.mp4"></video></main></html>');
 console.log(JSON.stringify(evidence.output));
}
if(require.main===module)(async()=>{const evidence=process.argv.includes('--encode-only')?JSON.parse(fs.readFileSync(path.join(work,'evidence.json'),'utf8')):await capture();await encode(evidence);})().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={capture,encode};
