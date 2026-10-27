const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util'),puppeteer=require('puppeteer-core');
const run=promisify(execFile),{locales,labels,copy,ui,extras}=require('./build-site'),{openPopup,storageFor,makeT,loadExtensionStrings,EXT_DIR}=require('./guide-shots');
const mediaTools=process.env.FORMPILOT_MEDIA_TOOLS||path.join(os.tmpdir(),'formpilot-media-tools/node_modules');
const ffmpeg=process.env.FFMPEG_PATH&&fs.existsSync(process.env.FFMPEG_PATH)?process.env.FFMPEG_PATH:require(path.join(mediaTools,'ffmpeg-static')),ffprobe=process.env.FFPROBE_PATH&&fs.existsSync(process.env.FFPROBE_PATH)?process.env.FFPROBE_PATH:require(path.join(mediaTools,'ffprobe-static')).path;
const out=path.join(__dirname,'media'),work=path.join(os.tmpdir(),'formpilot-video-build');fs.mkdirSync(work,{recursive:true});
const version=require(path.join(EXT_DIR,'manifest.json')).version;
const fillCounts=Object.fromEntries(require(path.join(EXT_DIR,'store/build-report.json')).locales.map(r=>[r.locale,r.filled]));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fileURL=file=>'file:///'+file.replace(/\\/g,'/');
const clock=s=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${(s%60).toFixed(3).padStart(6,'0')}`;
function captions(lines,seconds,fade=.4){return 'WEBVTT\n\n'+lines.map((line,i)=>`${i+1}\n${clock(i*(seconds-fade))} --> ${clock(i===lines.length-1?lines.length*seconds-(lines.length-1)*fade:(i+1)*(seconds-fade))}\n${line.replace(/\n/g,' ')}\n`).join('\n');}
async function encode(frames,seconds,output){
 const fade=.4,args=['-y','-hide_banner','-loglevel','error'];for(const frame of frames)args.push('-loop','1','-framerate','30','-t',String(seconds),'-i',frame);
 const filters=frames.map((_,i)=>`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xf8fcfa,setsar=1,format=yuv420p,settb=AVTB[v${i}]`);
 let previous='v0';for(let i=1;i<frames.length;i++){const next='x'+i;filters.push(`[${previous}][v${i}]xfade=transition=fade:duration=${fade}:offset=${(i*(seconds-fade)).toFixed(3)}[${next}]`);previous=next;}
 args.push('-filter_complex_threads','2','-filter_complex',filters.join(';'),'-map',`[${previous}]`,'-an','-c:v','libx264','-preset','veryfast','-crf','23','-threads','2','-pix_fmt','yuv420p','-r','30','-movflags','+faststart',output);
 await run(ffmpeg,args,{timeout:600000,maxBuffer:2e6});
 const {stdout}=await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',output],{maxBuffer:2e6});const info=JSON.parse(stdout),video=info.streams.find(s=>s.codec_type==='video');
 if(!video||video.codec_name!=='h264'||video.width!==1920||video.height!==1080||Math.abs(+info.format.duration-(frames.length*seconds-(frames.length-1)*fade))>.2)throw Error('Invalid video '+output);
 return {width:video.width,height:video.height,fps:video.avg_frame_rate,duration:+info.format.duration,bytes:+info.format.size,sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex')};
}
async function poster(frame,output){await run(ffmpeg,['-y','-loglevel','error','-i',frame,'-vf','scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xf8fcfa','-frames:v','1','-q:v','3',output],{maxBuffer:1e6});}
async function tutorialFrames(browser,lang){
 const folder=path.join(work,lang);fs.mkdirSync(folder,{recursive:true});const messages=loadExtensionStrings(),t=makeT(messages,lang),u=ui[lang],c=copy[lang],l=labels[lang],count=fillCounts[lang];if(!count)throw Error('Missing browser-verified fill count '+lang);
 for(const mode of ['idle','filled','saved']){
  const store=storageFor(lang,t,{withEntries:mode==='saved'});store.lastRunResult=mode==='idle'?null:{message:t('status_filled',String(count)),type:'success',timestamp:new Date(2026,9,27,12).getTime()};
  if(mode==='saved')for(const entries of Object.values(store.siteProfiles))for(const entry of entries)entry.fields=Object.fromEntries(Array.from({length:count},(_,i)=>['field'+i,'sample']));
  const page=await openPopup(browser,lang,store);await page.screenshot({path:path.join(folder,mode+'.png')});await page.close();
 }
 const stages=[
  [l.profiles,c.steps[0]+' '+c.features[0],path.join(EXT_DIR,'store/ui',lang,'profile.png'),null],
  [l.run,c.steps[1].replace('{fill}',u.btn_ai_autofill),path.join(folder,'idle.png'),path.join(__dirname,'screens',lang,'before.png')],
  [l.run,c.steps[2],path.join(folder,'filled.png'),path.join(__dirname,'screens',lang,'after.png')],
  [l.saved,u.btn_save_form+' → '+u.btn_save+' · '+u.tip_save_form,path.join(folder,'saved.png'),path.join(__dirname,'screens',lang,'after.png')],
  [l.saved,u.btn_restore+' · '+u.tip_restore,path.join(folder,'saved.png'),path.join(__dirname,'screens',lang,'before.png')],
  [l.saved,u.status_restored.replace('{0}',c.saved).replace('{1}',String(count))+' · '+c.steps[2],path.join(folder,'saved.png'),path.join(__dirname,'screens',lang,'after.png')]
 ];
 const frames=[],page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
 for(let i=0;i<stages.length;i++){
  const [title,note,left,right]=stages[i];
  const html=`<!doctype html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#f8fcfa;color:#073e32;font-family:system-ui,"Segoe UI",sans-serif}.brand{position:absolute;inset-block-start:26px;inset-inline-start:64px;font-size:30px;font-weight:800}.step{position:absolute;inset-block-start:26px;inset-inline-end:64px;font:28px system-ui;direction:ltr}h1{position:absolute;top:68px;left:64px;right:64px;margin:0;font-size:54px;line-height:1.25;max-height:144px;overflow:hidden}p{position:absolute;top:202px;left:64px;right:64px;margin:0;font-size:30px;line-height:1.45;max-height:100px;overflow:hidden}.stage{position:absolute;top:320px;bottom:70px;left:64px;right:64px;display:flex;justify-content:space-evenly;align-items:center;gap:60px}.stage img{max-height:100%;max-width:47%;height:100%;width:auto;object-fit:contain;border-radius:16px;box-shadow:0 12px 40px #073e3220}.note{font-size:24px;position:absolute;bottom:20px;left:64px;right:64px;text-align:center}.single img{max-width:70%}</style><div class="brand">FormPilot · v${version}</div><div class="step">${i+1} / ${stages.length}</div><h1>${esc(title)}</h1><p>${esc(note)}</p><div class="stage ${right?'':'single'}"><img src="${fileURL(left)}" alt="">${right?`<img src="${fileURL(right)}" alt="">`:''}</div><div class="note">${esc(extras[lang][1])}</div></html>`;
  const file=path.join(folder,`scene-${i}.html`);fs.writeFileSync(file,html);await page.goto(fileURL(file));await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));await page.evaluate(()=>document.fonts.ready);
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('h1,p,.note')].some(el=>el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2));if(overflow)throw Error(`Video text overflow ${lang}/${i}`);
  const frame=path.join(folder,`tutorial-${i}.png`);await page.screenshot({path:frame});frames.push(frame);
 }
 await page.close();return {frames,lines:stages.map(s=>s[0]+': '+s[1])};
}
async function main(){
 const targets=process.argv.slice(2).filter(l=>locales.includes(l));if(!targets.length)targets.push(...locales);
 const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files']});
 const manifestFile=path.join(out,'manifest.json');let manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{};
 try{for(const lang of targets){
  const dir=path.join(out,lang);fs.mkdirSync(dir,{recursive:true});const promo=Array.from({length:5},(_,i)=>path.join(__dirname,'screens',lang,`${i+1}.png`));
  const tutorial=await tutorialFrames(browser,lang);
  const reports=await Promise.all([encode(promo,6,path.join(dir,'promo.mp4')),encode(tutorial.frames,5,path.join(dir,'tutorial.mp4'))]);
  await poster(promo[0],path.join(dir,'promo.jpg'));await poster(tutorial.frames[0],path.join(dir,'tutorial.jpg'));
  fs.writeFileSync(path.join(dir,'promo.vtt'),captions(copy[lang].slides.map(s=>s.join(' · ')),6));fs.writeFileSync(path.join(dir,'tutorial.vtt'),captions(tutorial.lines,5));
  manifest[lang]={promo:reports[0],tutorial:reports[1]};fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');console.log(`PASS ${lang}: promo ${reports[0].duration}s, tutorial ${reports[1].duration}s`);
 }}finally{await browser.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={captions,clock};
