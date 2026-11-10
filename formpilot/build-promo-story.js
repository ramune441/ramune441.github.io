// Renders the story promo per language from promo-story.js, one frame at a time: promo-story.html draws each frame
// around that language's real recording (record-story.js; its frames stay in %LOCALAPPDATA%/FormPilot/story-capture), and the soundtrack
// comes from the same timeline. Writes youtube-assets/story/promo-<lang>.{mp4,vtt,json}.
// node formpilot/build-promo-story.js [lang…] [--stills=5,8.5] [--sfx=minimal,none]
//   --stills writes only those seconds as PNGs; --sfx keeps the rendered picture and writes the sound styles to compare.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto'),{spawn}=require('node:child_process'),puppeteer=require('puppeteer-core');
const story=require('./promo-story'),{rate,soundtrack}=require('./promo-sound'),{EXT_DIR}=require('./guide-shots');
const {ffmpeg,loudness,normalizer,probe}=require('./build-youtube-sound'),{captureRoot,locales}=require('./record-story');
const {sample}=require(path.join(EXT_DIR,'scripts/build-store-assets'));
const vm=require('node:vm'),ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(EXT_DIR,'i18n.js'),'utf8')+'\nglobalThis.r=messages;',ctx);const messages=JSON.parse(JSON.stringify(ctx.r));
const work=path.join(process.env.LOCALAPPDATA||os.homedir(),'FormPilot','promo-story'),output=path.join(__dirname,'youtube-assets/story');
const sha=file=>crypto.createHash('sha256').update(Buffer.isBuffer(file)?file:fs.readFileSync(file)).digest('hex');
const run=(args,stdio='inherit')=>new Promise((resolve,reject)=>spawn(ffmpeg,args,{stdio,windowsHide:true}).on('close',c=>c?reject(Error('ffmpeg exited '+c)):resolve()));
const fonts={ja:"'Yu Gothic UI','Yu Gothic','Meiryo'",zh:"'Microsoft YaHei UI','Microsoft YaHei'",'zh-Hant':"'Microsoft JhengHei UI','Microsoft JhengHei'",ko:"'Malgun Gothic'",hi:"'Nirmala UI'",bn:"'Nirmala UI'",th:"'Leelawadee UI'",ar:"'Segoe UI'"};
const noSpace=['zh','zh-Hant','ko'],familyFirst=['ja','zh','zh-Hant','ko'];

function recording(locale){
 const file=path.join(captureRoot,locale,'evidence.json');
 if(!fs.existsSync(file))throw Error(`No recording for ${locale}; run node formpilot/record-story.js ${locale}`);
 return JSON.parse(fs.readFileSync(file,'utf8'));
}
// The words for one language: the extension's button label and the recording's sample person.
function words(locale,evidence){
 const p=evidence.profile,parts=(familyFirst.includes(locale)?[p.lastName,p.firstName]:[p.firstName,p.lastName]).filter(Boolean);
 return story.text(locale,{fill:messages[locale].btn_ai_autofill,name:parts.join(noSpace.includes(locale)?'':' '),nameLabel:sample(locale).nameLabel});
}
const frameAt=(frames,raw,key)=>(frames.filter(f=>f.time<=raw+1e-6).at(-1)||frames[0])[key];
// The popup runs in a background tab, so its pointer is caught mid-move in the shot taken just before each click.
// Around a popup click, show the popup as it was before that shot; the shot after the click has the pointer in place.
const popupClicks=['analyzeClick','saveClick','confirmClick','restoreClick'];
function popupAt(evidence,raw){
 const click=popupClicks.map(n=>evidence.events[n]).find(c=>raw>c-.6&&raw<c+.3);
 return frameAt(evidence.frames,click===undefined?raw:click-.6,'popup');
}

function serve(dir){
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png'};
 const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1),[root,rest]=name.startsWith('rec/')?[dir,name.slice(4)]:[__dirname,name],file=path.resolve(root,rest);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 return new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server)));
}

async function render(locale,stills){
 const evidence=recording(locale),rec={events:evidence.events,boxes:evidence.boxes},c=words(locale,evidence),dir=path.join(captureRoot,locale);
 const logo=fs.readFileSync(path.join(EXT_DIR,'icons/icon128.html'),'utf8').match(/<svg[\s\S]*<\/svg>/)[0].replace(/ width="128" height="128"/,' width="100%" height="100%"');
 fs.mkdirSync(work,{recursive:true});fs.mkdirSync(output,{recursive:true});
 const server=await serve(dir),base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',protocolTimeout:180000});
 try{
  const page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:2});
  await page.goto(base+'promo-story.html');await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(setup=>window.setup(setup),{logo,panes:story.panes,lang:locale,dir:c.rtl?'rtl':'ltr',font:fonts[locale]?`${fonts[locale]},'Segoe UI',sans-serif`:undefined});
  const draw=async t=>{const s=story.frame(t,rec,c),raw=s.demo?.raw??0;await page.evaluate((s,i)=>draw(s,i),s,{popup:'rec/'+popupAt(evidence,raw),form:'rec/'+frameAt(evidence.frames,raw,'form')});};
  if(stills){for(const t of stills){await draw(t);const file=path.join(work,`${locale}-${t}.png`);await page.screenshot({path:file});console.log('STILL',file);}return;}

  const plan=story.soundPlan(rec,c),pcm=soundtrack(plan),wav=path.join(work,`${locale}.wav`);fs.writeFileSync(wav,pcm);
  const file=path.join(output,`promo-${locale}.mp4`),filter=await normalizer(wav);
  // veryfast with four threads: slower presets run x264 out of memory at 4K in this ffmpeg build.
  const encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(story.fps),'-c:v','mjpeg','-i','-','-i',wav,'-map','0:v','-map','1:a','-c:v','libx264','-profile:v','high','-preset','veryfast','-crf','16','-threads','4','-pix_fmt','yuv420p','-r',String(story.fps),'-af',filter,'-ar',String(rate),'-ac','2','-c:a','aac','-b:a','192k','-t',String(story.duration),'-movflags','+faststart',file],{stdio:['pipe','inherit','inherit'],windowsHide:true});
  const done=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code?reject(Error('ffmpeg exited '+code)):resolve());});
  for(let n=0;n<story.duration*story.fps;n++){
   await draw(n/story.fps);const jpg=await page.screenshot({type:'jpeg',quality:94});
   if(!encoder.stdin.write(jpg))await new Promise(r=>encoder.stdin.once('drain',r));
  }
  encoder.stdin.end();await done;
  const audio=await loudness(file),info=await probe(file),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
  if(Math.abs(+audio.input_i+16)>.6||+audio.input_tp>-1)throw Error(`${locale}: loudness out of range: ${audio.input_i} LUFS, ${audio.input_tp} dBTP`);
  const stamp=t=>new Date(t*1000).toISOString().slice(11,23),vtt=path.join(output,`promo-${locale}.vtt`);
  fs.writeFileSync(vtt,'WEBVTT\n\n'+story.cues(c).map(([s,e,line],i)=>`${i+1}\n${stamp(s)} --> ${stamp(e)}\n${line}\n`).join('\n'));
  const report={locale,file:path.basename(file),sha256:sha(file),bytes:fs.statSync(file).size,duration:+info.format.duration,width:v.width,height:v.height,fps:v.r_frame_rate,audioCodec:a.codec_name,audioChannels:a.channels,captions:path.basename(vtt),
   recording:{events:evidence.events,boxes:evidence.boxes,aiStatus:evidence.aiStatus,filled:evidence.filled,restoredMatchesSaved:JSON.stringify(evidence.restored)===JSON.stringify(evidence.beforeSave),pageSubmissions:evidence.pageSubmissions.length},
   words:{fill:messages[locale].btn_ai_autofill,typed:c.typed,field:c.field},sourceSha256:{story:sha(path.join(__dirname,'promo-story.js')),copy:sha(path.join(__dirname,'promo-story-copy.js')),sound:sha(path.join(__dirname,'promo-sound.js')),stage:sha(path.join(__dirname,'promo-story.html'))},
   audio:{original:true,thirdPartySamples:false,style:'gentle',pcmSha256:sha(pcm),events:plan.events,integratedLufs:+audio.input_i,truePeakDbtp:+audio.input_tp}};
  fs.writeFileSync(path.join(output,`promo-${locale}.json`),JSON.stringify(report,null,2)+'\n');
  await run(['-hide_banner','-loglevel','error','-y','-i',file,'-vf','fps=1,scale=640:-2,tile=5x5','-frames:v','1',path.join(work,`${locale}-scenes.jpg`)]);
  console.log(`READY ${locale}: ${report.duration}s, ${audio.input_i} LUFS`);
 }finally{await browser.close();server.close();}
}

async function remix(locale,style){
 const report=JSON.parse(fs.readFileSync(path.join(output,`promo-${locale}.json`),'utf8')),evidence=recording(locale),c=words(locale,evidence),wav=path.join(work,`${locale}-${style}.wav`);
 fs.mkdirSync(work,{recursive:true});fs.writeFileSync(wav,soundtrack(story.soundPlan({events:evidence.events,boxes:evidence.boxes},c,style)));
 const file=path.join(work,`promo-${locale}-sfx-${style}.mp4`);
 await run(['-hide_banner','-loglevel','error','-y','-i',path.join(output,report.file),'-i',wav,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',await normalizer(wav),'-ar',String(rate),'-ac','2','-c:a','aac','-b:a','192k','-t',String(story.duration),'-movflags','+faststart',file]);
 console.log('READY '+file);
}

if(require.main===module)(async()=>{
 const option=name=>(process.argv.find(a=>a.startsWith(`--${name}=`))||'').slice(name.length+3).split(',').filter(Boolean);
 const targets=process.argv.slice(2).filter(a=>locales.includes(a)),stills=option('stills').map(Number),sfx=option('sfx');
 for(const locale of targets.length?targets:locales){if(sfx.length)for(const s of sfx)await remix(locale,s);else await render(locale,stills.length?stills:null);}
})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={render,remix,recording,words};
