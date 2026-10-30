import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import puppeteer from 'puppeteer-core';
const run=promisify(execFile),root=dirname(fileURLToPath(import.meta.url));
const work=join(root,'../_probe/subduo-video');mkdirSync(work,{recursive:true});
const tools=join(tmpdir(),'formpilot-media-tools/node_modules');
const ffmpeg=process.env.FFMPEG_PATH||join(tools,'ffmpeg-static/ffmpeg.exe');
const ffprobe=process.env.FFPROBE_PATH||join(tools,'ffprobe-static/bin/win32/x64/ffprobe.exe');
const context={document:{readyState:'loading',addEventListener(){}}};
for(const file of ['i18n-lp.js','store-image-locales.js','promo-locales.js'])vm.runInNewContext(readFileSync(join(root,file),'utf8'),context);
const {additional,names,duration}=context.SUBDUO_PROMO;
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const metaPath=join(root,'youtube-promo-localized.json');
const meta=existsSync(metaPath)?JSON.parse(readFileSync(metaPath,'utf8')):{channelId:'UCrjA6ffzb5pUw2URh0BcdRQ',baseVideo:'promo.mp4',baseSha256:sha(join(root,'promo.mp4')),duration,items:{}};
const plain=text=>text.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const probe=async file=>JSON.parse((await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file])).stdout);
const targets=process.argv.slice(2).filter(x=>!x.startsWith('--'));
assert.ok(targets.every(x=>additional.includes(x)),'追加8言語だけを生成してください');
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,protocolTimeout:120000,defaultViewport:{width:3840,height:2160,deviceScaleFactor:1}});
try{for(const lang of targets.length?targets:additional){
  if(meta.items[lang]?.videoId){console.log(`SKIP ${lang}: upload already recorded`);continue;}
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(join(root,'promo.html')).href+'?lang='+lang,{waitUntil:'networkidle0'});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{reset();document.documentElement.style.zoom='2';});
  const coverage=await page.evaluate(()=>({language:document.documentElement.lang,direction:document.documentElement.dir,missing:[...document.querySelectorAll('[data-i18n],[data-i18n-html]')].map(el=>el.dataset.i18n||el.dataset.i18nHtml).filter(key=>!SUBDUO_PROMO.copy[document.documentElement.lang]?.[key]),timeline:(reset(),buildTimeline(),T.map(([t])=>t))}));
  assert.equal(coverage.language,lang);assert.equal(coverage.direction,lang==='ar'?'rtl':'ltr');assert.deepEqual(coverage.missing,[]);assert.deepEqual(errors,[]);
  const raw=join(work,`${lang}.raw.webm`),captureFile=join(work,`${lang}.capture.json`);
  let capture;
  if(process.argv.includes('--encode-only'))capture=JSON.parse(readFileSync(captureFile,'utf8'));
  else{
    const rec=await page.screencast({path:raw,ffmpegPath:ffmpeg,fps:30,quality:26});
    const start=Date.now();await page.evaluate(()=>start());const states=[];
    for(const seconds of [2,6,10,14,20,25,30,34,38,39.5]){
      const remaining=seconds*1000-(Date.now()-start);if(remaining>0)await new Promise(r=>setTimeout(r,remaining));
      if(seconds===39.5)break;
      const state=await page.evaluate(()=>{
        const scene=[...document.querySelectorAll('.scene.show,#ds.show')].at(-1);
        const overflow=[...scene.querySelectorAll('[data-i18n],[data-i18n-html],#sdA,#sdB')].filter(el=>{
          let n=el;while(n&&n!==scene){if(+getComputedStyle(n).opacity===0)return false;n=n.parentElement;}
          const b=el.getBoundingClientRect();return b.left<-.5||b.top<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5||el.scrollWidth>el.clientWidth+2;
        }).map(el=>({key:el.dataset.i18n||el.dataset.i18nHtml||el.id,text:el.innerText}));
        return {scene:scene.id,text:scene.innerText,overflow};
      });
      states.push({seconds,...state});await page.screenshot({path:join(work,`${lang}-${seconds}.png`)});
    }
    capture={wallSeconds:(Date.now()-start)/1000,coverage,states,errors};
    writeFileSync(captureFile,JSON.stringify(capture,null,2));await rec.stop();
  }
  await page.close();
  assert.deepEqual(capture.states.flatMap(s=>s.overflow),[],`${lang}: text overflow`);
  mkdirSync(join(root,'promo-verification'),{recursive:true});
  writeFileSync(join(root,'promo-verification',lang+'.json'),JSON.stringify(capture,null,2)+'\n');
  const rawInfo=await probe(raw);
  let rawSeconds=+rawInfo.format.duration;
  if(!Number.isFinite(rawSeconds)){
    const packets=JSON.parse((await run(ffprobe,['-v','error','-select_streams','v:0','-show_entries','packet=pts_time,duration_time','-of','json',raw],{maxBuffer:3e6})).stdout).packets;
    rawSeconds=Math.max(...packets.map(p=>+p.pts_time+(+p.duration_time||1/30)));
  }
  const file=join(root,`promo-${lang}.mp4`);
  await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',raw,'-i',join(root,'promo.mp4'),'-filter:v',`setpts=${duration/rawSeconds}*PTS,fps=30,format=yuv420p`,'-map','0:v:0','-map','1:a:0','-t',String(duration),'-c:v','libx264','-profile:v','high','-preset','veryfast','-crf','20','-threads','4','-c:a','copy','-movflags','+faststart',file],{timeout:300000,maxBuffer:2e6});
  const output=await probe(file),v=output.streams.find(s=>s.codec_type==='video'),a=output.streams.find(s=>s.codec_type==='audio');
  assert.equal(v.width,3840);assert.equal(v.height,2160);assert.equal(v.codec_name,'h264');assert.equal(v.pix_fmt,'yuv420p');assert.equal(v.r_frame_rate,'30/1');assert.equal(a.codec_name,'aac');assert.equal(a.channels,2);assert.ok(Math.abs(+output.format.duration-duration)<.06);
  const c=context.SUBDUO_PROMO.copy[lang],s=context.SUBDUO_STORE_EXTRA[lang];
  const cues=[[0,3,c.hero_h1],[3,8,c.problem_h2],[8,11.5,c.flow_h2+' '+c.flow1_h3+' · '+c.flow2_h3+' · '+c.flow3_h3],[11.5,16.5,c.demo_cap0],[16.5,22,c.demo_cap1],[22,27,c.demo_cap2],[27,31.5,c.demo_cap3],[31.5,36,c.features_h2+' · '+[1,2,3,4,5].map(n=>c['feat'+n+'_h3']).join(' · ')],[36,39.5,c.cta_h2+' '+c.cta_btn]];
  const stamp=t=>new Date(t*1000).toISOString().slice(11,23),captions=`promo-${lang}.vtt`;
  writeFileSync(join(root,captions),'WEBVTT\n\n'+cues.map(([s,e,t],i)=>`${i+1}\n${stamp(s)} --> ${stamp(e)}\n${plain(t)}\n`).join('\n'));
  meta.items[lang]={title:`SubDuo — ${s.h1} (${names[lang]})`,description:`${s.fb_sub}\n\nPrime Video · YouTube · Netflix · Disney+ · TED\n${s.s5}\n\n▶ Chrome Web Store: https://chromewebstore.google.com/detail/ngifacacaecobbekalngmocklcgkoigo\n🌐 https://ramune441.github.io/subduo/\n📄 https://ramune441.github.io/subduo/privacy-policy.html\n#SubDuo #dualsubtitles #languagelearning`,file:`promo-${lang}.mp4`,captions,language:lang,width:v.width,height:v.height,duration:+output.format.duration,audioChannels:a.channels,sha256:sha(file),baseSha256:meta.baseSha256,visibility:'public',madeForKids:false,notifySubscribers:false,captureFile:`promo-verification/${lang}.json`};
  writeFileSync(metaPath,JSON.stringify(meta,null,2)+'\n');
  console.log(`READY ${lang}: 39.5 seconds, 4K, original BGM, translated demo and captions`);
}}finally{await browser.close();}
