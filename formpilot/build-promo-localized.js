const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),vm=require('node:vm'),crypto=require('node:crypto');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile),puppeteer=require('puppeteer-core');
const root=__dirname,work=path.join(os.tmpdir(),'formpilot-original-promo-localized');fs.mkdirSync(work,{recursive:true});
const media=path.join(os.tmpdir(),'formpilot-media-tools/node_modules'),ffmpeg=require(path.join(media,'ffmpeg-static')),ffprobe=require(path.join(media,'ffprobe-static')).path;
const locales=['zh-Hant','vi','it','tr','pl','nl','th','bn'],names={'zh-Hant':'繁體中文',vi:'Tiếng Việt',it:'Italiano',tr:'Türkçe',pl:'Polski',nl:'Nederlands',th:'ภาษาไทย',bn:'বাংলা'};
const ctx={};for(const file of ['site-data.js','promo-translations.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);vm.runInNewContext('this.copy=PROMO_TRANSLATIONS',ctx);const copy=ctx.copy;
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),plain=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const metaFile=path.join(root,'youtube-promo-localized.json');
async function saveRecord(lang,record,initial){
 const lock=metaFile+'.lock';let handle;
 for(let tries=0;tries<300;tries++){try{handle=fs.openSync(lock,'wx');break;}catch(e){if(e.code!=='EEXIST')throw e;await new Promise(r=>setTimeout(r,100));}}
 if(handle===undefined)throw Error('Metadata lock timed out');
 try{const latest=fs.existsSync(metaFile)?JSON.parse(fs.readFileSync(metaFile,'utf8')):initial;const old=latest.items[lang]||{};if(old.videoId&&old.sha256!==record.sha256)throw Error('Existing upload has a different material hash');latest.items[lang]={...old,...record};fs.writeFileSync(metaFile,JSON.stringify(latest,null,2)+'\n');return latest;}finally{fs.closeSync(handle);fs.unlinkSync(lock);}
}
async function info(file){return JSON.parse((await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file])).stdout);}
async function rawDuration(file){const p=await info(file);if(Number.isFinite(+p.format.duration))return +p.format.duration;const packets=JSON.parse((await run(ffprobe,['-v','error','-select_streams','v:0','-show_entries','packet=pts_time,duration_time','-of','json',file],{maxBuffer:3e6})).stdout).packets;return Math.max(...packets.map(p=>+p.pts_time+(+p.duration_time||1/30)));}
const source=()=>fs.readFileSync(path.join(root,'promo.html'),'utf8').replace(/\nstart\(\);\r?\n<\/script>/,'\n// Recording starts when capture is ready.\n</script>');
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1),file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(name==='promo.html'?source():fs.readFileSync(file));}catch{res.writeHead(404).end();}});
async function build(targets=locales){
 let meta=fs.existsSync(metaFile)?JSON.parse(fs.readFileSync(metaFile,'utf8')):{channelId:'UCrjA6ffzb5pUw2URh0BcdRQ',baseVideo:'promo-ja.mp4',baseSha256:sha(path.join(root,'promo-ja.mp4')),duration:33,items:{}};
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',protocolTimeout:120000});
 try{for(const lang of targets){
  if(!locales.includes(lang))throw Error('Only missing languages may be generated: '+lang);
  if(meta.items[lang]?.videoId){console.log('SKIP existing upload '+lang);continue;}
  const file=path.join(root,`promo-${lang}.mp4`),raw=path.join(work,`${lang}.raw.webm`),captureFile=path.join(work,`${lang}.capture.json`);
  const page=await browser.newPage();await page.setViewport({width:3840,height:2160,deviceScaleFactor:1});
  await page.goto(`http://127.0.0.1:${server.address().port}/promo.html?lang=${lang}`,{waitUntil:'networkidle0'});await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{document.documentElement.style.zoom='2';resetAll();showScene('s1');});
  const coverage=await page.evaluate(()=>({language:LANG,missing:[...document.querySelectorAll('[data-i18n]')].filter(e=>L[e.dataset.i18n]===undefined).map(e=>e.dataset.i18n),sceneTimes:(buildTimeline(),timeline.map(([t])=>t))}));
  if(coverage.missing.length||coverage.language!==lang)throw Error('Incomplete promo translation '+JSON.stringify(coverage));
  let capture;
  if(process.argv.includes('--encode-only'))capture=JSON.parse(fs.readFileSync(captureFile,'utf8'));
  else{
   const rec=await page.screencast({path:raw,ffmpegPath:ffmpeg,fps:30,quality:26});const start=Date.now();await page.evaluate(()=>start());const states=[];
   for(const seconds of [2,8,14,17,23,26,32,33]){
    const delay=seconds*1000-(Date.now()-start);if(delay>0)await new Promise(r=>setTimeout(r,delay));
    if(seconds<33){const state=await page.evaluate(()=>{const scene=document.querySelector('.scene.active');return {scene:scene.id,text:scene.innerText,overflow:[...scene.querySelectorAll('[data-i18n]')].filter(el=>{const b=el.getBoundingClientRect();return b.left<0||b.right>innerWidth+2||b.top<0||b.bottom>innerHeight+2;}).map(el=>el.dataset.i18n)};});states.push({seconds,...state});await page.screenshot({path:path.join(work,`${lang}-${seconds}.png`)});}
   }
   capture={wallSeconds:(Date.now()-start)/1000,states,coverage};fs.writeFileSync(captureFile,JSON.stringify(capture,null,2));await rec.stop();
  }
  await page.close();
  const overflow=capture.states.flatMap(s=>s.overflow.map(key=>`${s.scene}/${key}`));if(overflow.length)throw Error('Text exceeds frame '+lang+': '+overflow.join(','));
  const duration=await rawDuration(raw);
  await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',raw,'-i',path.join(root,'promo-ja.mp4'),'-filter:v',`setpts=${33/duration}*PTS,fps=30,format=yuv420p`,'-map','0:v:0','-map','1:a:0','-t','33','-c:v','libx264','-profile:v','high','-preset','veryfast','-crf','20','-threads','4','-c:a','copy','-movflags','+faststart',file],{timeout:300000,maxBuffer:2e6});
  const p=await info(file),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');if(v.width!==3840||v.height!==2160||a?.channels!==2||Math.abs(+p.format.duration-33)>.05)throw Error('Invalid output '+lang);
  const c=copy[lang],cues=[[0,2.5,c.tagline],[2.5,9,c.rep_title+' '+c.save_text],[9,15,c.prob_title+' '+[1,2,3,4,5].map(i=>c['prob'+i]).join(' · ')],[15,18.5,c.sol_title+' '+c.sol_3sec+' '+c.sol_label],[18.5,24,c.demo_title+' '+c.demo_desc],[24,27.5,c.feat_title+' · '+[1,2,3,4,5,6].map(i=>c['f'+i+'_t']).join(' · ')],[27.5,33,c.cta_title+' '+c.cta_btn]];
  const stamp=t=>new Date(t*1000).toISOString().slice(11,23),vtt=`promo-${lang}.vtt`;fs.writeFileSync(path.join(root,vtt),'WEBVTT\n\n'+cues.map(([s,e,t],i)=>`${i+1}\n${stamp(s)} --> ${stamp(e)}\n${plain(t)}\n`).join('\n'));
  const originalMeta=require('./youtube.json').items[lang];
  const record={title:`FormPilot ver2 (${names[lang]})`,description:originalMeta.description,file:path.basename(file),captions:vtt,visibility:'public',madeForKids:false,duration:33,width:3840,height:2160,audioCodec:'aac',audioChannels:2,sha256:sha(file),bytes:fs.statSync(file).size,sceneTimes:capture.coverage.sceneTimes,baseSha256:meta.baseSha256};
  meta=await saveRecord(lang,record,meta);console.log(`READY ${lang}: original 7 scenes, 33 seconds, 4K, original BGM`);
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
}
if(require.main===module){const targets=process.argv.slice(2).filter(l=>locales.includes(l));build(targets.length?targets:locales).catch(e=>{console.error(e);process.exitCode=1;});}
module.exports={locales,names,copy,build};
