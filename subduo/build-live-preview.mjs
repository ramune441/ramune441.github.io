// 収録済みの実操作（capture-live-preview.mjs の出力）から実操作プレビューを書き出す。公開・投稿は行わない。
// SUBDUO_LANG で言語を選ぶ（既定 ja）。出力は previews/live-demo-<lang>.{mp4,vtt,jpg,json} と、全言語を切り替えて見る index.html。
// SUBDUO_STILLS="7,12.5" を付けると、その時刻の静止画だけを作業ディレクトリの stills/ に出して終わる（試写用）。
// SUBDUO_AUDIO_ONLY=1 は前回の映像を使い回し、音だけ作り直す。SUBDUO_DROP_FRAMES=1 は書き出し後に収録コマを消す（約0.6GB/言語）。
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {execFile,spawn} from 'node:child_process';
import {once} from 'node:events';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {storyboard,copy,timeline,timelineSha,frameState,rawTime,recorded,soundEvents,fps,bpm,layouts,hookTiming,ctaTiming,sites,wheelStep} from './live-plan.mjs';
import {languages} from './live-i18n.mjs';
import {soundtrack,rate} from './live-sound.mjs';
const require=createRequire(import.meta.url),puppeteer=require('puppeteer-core');
const run=promisify(execFile),root=dirname(fileURLToPath(import.meta.url));
const lang=process.env.SUBDUO_LANG||'ja';assert.ok(languages[lang],'Unknown SUBDUO_LANG: '+lang);
const work=process.env.SUBDUO_CAPTURE_DIR||join(process.env.LOCALAPPDATA||tmpdir(),'subduo-live-preview',lang);
const out=join(root,'previews');mkdirSync(out,{recursive:true});
// Shared media tools outside the OS temp folder (spec/ops.md); FFMPEG_PATH / FFPROBE_PATH override them.
const tools=join(process.env.LOCALAPPDATA||tmpdir(),'FormPilot/media-tools/node_modules');
const ffmpeg=process.env.FFMPEG_PATH||join(tools,'ffmpeg-static/ffmpeg.exe');
const ffprobe=process.env.FFPROBE_PATH||join(tools,'ffprobe-static/bin/win32/x64/ffprobe.exe');
const capture=JSON.parse(readFileSync(join(work,'capture.json')));
assert.equal(capture.lang,lang);
assert.ok(Object.values(capture.checks).every(Boolean));assert.equal(capture.liveSite,true);assert.equal(capture.liveExtension,true);
const probe=async file=>JSON.parse((await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file])).stdout);
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const plan=timeline(storyboard(capture)),text=copy(capture),stills=process.env.SUBDUO_STILLS?.split(',').map(Number);
assert.equal(capture.scale,2,'2倍の密度で収録したものだけを使う（等倍の録画を拡大すると画質が落ちる）');
const name=ext=>`live-demo-${lang}.${ext}`;

// The capture's own JPEG frames are drawn directly (no re-encode before the final one); each has its capture time.
// A sound-only rebuild keeps the rendered picture, so it needs neither the frames nor a new check of them.
const audioOnly=!!process.env.SUBDUO_AUDIO_ONLY,previous=audioOnly?JSON.parse(readFileSync(join(out,name('json')))):null;
if(audioOnly)assert.equal(previous.capturedAt,capture.capturedAt,'書き出し済みの映像と収録が違う');
const frames={};
for(const scene of plan.scenes.filter(s=>s.time)){
 const clip=capture.clips.find(c=>c.name===scene.name);
 if(audioOnly){frames[scene.name]={times:clip.frames,captureSha256:previous.frames[scene.name].captureSha256};continue;}
 const dir=join(work,clip.dir),files=readdirSync(dir).sort();
 assert.equal(files.length,clip.frames.length,'コマの数が記録と合わない: '+scene.name);
 // The screencast sends no frames while nothing changes (a paused video), so compare with how long it recorded.
 assert.ok(rawTime(scene,scene.duration)<=recorded(clip)+.05,'収録が場面の時間に足りない: '+scene.name);
 const digest=createHash('sha256');for(const f of files)digest.update(readFileSync(join(dir,f)));
 frames[scene.name]={base:pathToFileURL(dir).href+'/',times:clip.frames,captureSha256:digest.digest('hex')};
}

const video=join(work,'live-video.mp4');
if(!process.env.SUBDUO_AUDIO_ONLY){
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--force-device-scale-factor=1','--hide-scrollbars']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1920,height:1080});
 await page.goto(pathToFileURL(join(root,'live-stage.html')).href);
 await page.evaluate(p=>window.init(p),{...plan,fps,layouts,copy:text,hookTiming,ctaTiming,sites,frames,scale:capture.scale,wheelStep});
 const cdp=await page.createCDPSession();
 const shot=async n=>{await page.evaluate(s=>window.render(s),frameState(plan,n));return Buffer.from((await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:93})).data,'base64');};
 if(stills){
  mkdirSync(join(work,'stills'),{recursive:true});
  for(const T of stills)writeFileSync(join(work,'stills',`${T}.jpg`),await shot(Math.round(T*fps)));
  assert.deepEqual(errors,[]);console.log('STILLS',join(work,'stills'));
 }else{
 const encoder=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-vf','scale=in_range=full:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-crf','18','-r',String(fps),video],{stdio:['pipe','inherit','inherit']});
 const done=once(encoder,'exit');
 for(let n=0;n<plan.frames;n++){
  if(!encoder.stdin.write(await shot(n)))await once(encoder.stdin,'drain');
  if(n%300===0)console.log(lang,'frame',n,'/',plan.frames);
 }
 encoder.stdin.end();assert.equal((await done)[0],0);assert.deepEqual(errors,[]);
 }
}finally{await browser.close();}
if(stills)process.exit(0);
}

// Sound: the same plan places every effect, then loudness is normalised to -16 LUFS (two-pass).
const events=soundEvents(plan),wav=join(work,'soundtrack.wav');
writeFileSync(wav,soundtrack(plan,events));
const target='loudnorm=I=-16:TP=-1.5:LRA=11';
// ffmpeg 8.1 prints a status line after the JSON block, so read only the block itself.
const analyze=async input=>{const {stderr}=await run(ffmpeg,['-hide_banner','-nostats','-i',input,'-vn','-af',target+':print_format=json','-f','null','-'],{maxBuffer:2e6});const json=stderr.slice(stderr.lastIndexOf('{'));return JSON.parse(json.slice(0,json.indexOf('}')+1));};
const m=await analyze(wav);
// The limiter keeps the sharp interface sounds under -1 dBTP after AAC encoding.
const normalize=target+`:measured_I=${m.input_i}:measured_LRA=${m.input_lra}:measured_TP=${m.input_tp}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,alimiter=limit=0.66:level=disabled`;
const file=join(out,name('mp4'));
await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',video,'-i',wav,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',normalize,'-ar',String(rate),'-c:a','aac','-b:a','192k','-t',String(plan.duration),'-metadata:s:a:0',`language=${languages[lang].html}`,'-movflags','+faststart',file],{timeout:120000});
const finalAudio=await analyze(file);
assert.ok(Math.abs(+finalAudio.input_i+16)<.6);assert.ok(+finalAudio.input_tp<=-1);
const info=await probe(file),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
assert.equal(v.width,1920);assert.equal(v.height,1080);assert.equal(v.pix_fmt,'yuv420p');assert.equal(a.codec_name,'aac');assert.ok(Math.abs(+info.format.duration-plan.duration)<.1);

await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-ss','7.2','-i',file,'-frames:v','1','-q:v','3',join(out,name('jpg'))]);
// Captions: one cue per on-screen headline.
const stamp=t=>new Date(t*1000).toISOString().slice(11,23),hook=plan.scenes[0],cta=plan.scenes.at(-1);
const cues=[[0,'SubDuo — '+hook.tag]];
for(const s of plan.scenes)for(const [at,title,sub] of s.captions||[])cues.push([s.start+at,title.replace(/[【】]/g,'')+(sub?' '+sub:'')]);
cues.push([cta.start,cta.tag+' '+cta.search]);
writeFileSync(join(out,name('vtt')),'WEBVTT\n\n'+cues.map(([at,cue],i)=>`${i+1}\n${stamp(at)} --> ${stamp(i+1<cues.length?cues[i+1][0]:plan.duration)}\n${cue}\n`).join('\n'));
const scenes=plan.scenes.map(({name,start,duration,captions,camera,bounds,time})=>({name,start,duration,captions,camera,bounds,time}));
const meta={...capture,scenes,note:text.note,frames:Object.fromEntries(Object.entries(frames).map(([k,f])=>[k,{count:f.times.length,captureSha256:f.captureSha256}])),
 audio:{style:'SubDuo original pop, synthesized',original:true,thirdPartySamples:false,rate,bpm,key:'A minor / C major',events,pcmSha256:sha(wav),sourceSha256:sha(join(root,'live-sound.mjs')),planSha256:sha(join(root,'live-plan.mjs')),i18nSha256:sha(join(root,'live-i18n.mjs')),stageSha256:sha(join(root,'live-stage.html')),
 // The resolved timeline of this language (scenes, overlays, text): code changes that leave it as it is need no new render.
 timelineSha256:timelineSha(plan,text),integratedLufs:+finalAudio.input_i,truePeakDbtp:+finalAudio.input_tp},
 width:v.width,height:v.height,duration:+info.format.duration,frameRate:v.r_frame_rate,audioCodec:a.codec_name,audioChannels:a.channels,file:name('mp4'),sha256:sha(file),renderedAt:new Date().toISOString(),
 license:{title:'Sintel',creator:'Blender Foundation',copyright:'© copyright Blender Foundation | durian.blender.org',source:capture.source,terms:'https://durian.blender.org/sharing/',license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',changes:'Excerpted screen recording, cropped, zoomed and retimed; SubDuo UI, titles and annotations added. Original film audio omitted.'}};
writeFileSync(join(out,name('json')),JSON.stringify(meta,null,2)+'\n');
writeFileSync(join(out,'CREDITS.md'),`# 実操作プレビューの素材 / Credits\n\nSintel — © copyright Blender Foundation | durian.blender.org\n\n- 映像原本 / Source: ${capture.source}\n- 公式の利用条件 / Terms: https://durian.blender.org/sharing/\n- CC BY 3.0: https://creativecommons.org/licenses/by/3.0/\n- 変更: 映像の一部を実ブラウザで収録し、切り出し・拡大・速度調整を行い、SubDuoの実UI、各言語の見出しと注釈を追加。原作音声は収録していません。\n- Changes: excerpted screen recording, cropped, zoomed and retimed; SubDuo UI, titles and annotations added in each language. Original film audio omitted.\n- BGM・効果音 / Music and sounds: SubDuo用に合成したオリジナル（${bpm} BPM）。第三者の楽曲・音声サンプルは使用していません。\n\n映像の権利者によるSubDuoの推奨・提携を示すものではありません。 / This does not imply endorsement by the rights holders.\n`);

// Preview page: every language rendered so far, switchable, never autoplaying.
const rendered=Object.keys(languages).filter(code=>existsSync(join(out,`live-demo-${code}.json`)));
const label=code=>new Intl.DisplayNames([languages[code].html],{type:'language'}).of(languages[code].html);
writeFileSync(join(out,'index.html'),`<!doctype html>
<html lang="ja"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SubDuo — 実操作プレビュー</title>
<style>body{font-family:system-ui,sans-serif;margin:40px auto;padding:0 20px;max-width:1200px;background:#f3f7fc;color:#183454}h1{font-size:26px}video{display:block;width:100%;border-radius:16px;box-shadow:0 14px 48px #18345422;background:#111}p{line-height:1.8}a{color:#1765b6}nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}nav button{font:inherit;border:1px solid #bcd6f1;background:#fff;border-radius:20px;padding:4px 14px;cursor:pointer}nav button[aria-pressed=true]{background:#1765b6;color:#fff;border-color:#1765b6}</style>
<h1>SubDuo — 実操作プレビュー（約45秒・BGM／効果音つき・${rendered.length}言語）</h1>
<nav aria-label="言語">${rendered.map(code=>`<button type="button" data-lang="${code}" lang="${languages[code].html}">${label(code)}</button>`).join('')}</nav>
<video controls preload="metadata"></video>
<p>実際のYouTubeとSubDuoで、二言語字幕・移動とサイズ変更・一文ずつの練習・語句の保存・単語帳を各言語で収録しています。上段は映画の英語、下段と画面の説明はその言語です（作品に字幕がない言語は、画面に代わりの字幕を明記しています）。</p>
<p>操作の瞬間に合わせて画面が寄り、キー・クリック・保存を注釈と効果音で示します。BGMと効果音はSubDuo用に合成したオリジナルです。音量はプレイヤーで調整できます。</p>
<p>Sintel — © copyright Blender Foundation | durian.blender.org · <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>。映像の一部を画面収録し、切り出し・拡大・速度調整のうえ説明と注釈を追加しています。<a href="CREDITS.md">素材と出典</a> · <a id="download" download>MP4を保存</a></p>
<script>
const video=document.querySelector('video'),buttons=[...document.querySelectorAll('nav button')];
function show(code){
 video.pause();video.innerHTML='';video.poster='live-demo-'+code+'.jpg';
 const source=document.createElement('source');source.src='live-demo-'+code+'.mp4';source.type='video/mp4';
 const track=document.createElement('track');Object.assign(track,{kind:'captions',src:'live-demo-'+code+'.vtt',srclang:buttons.find(b=>b.dataset.lang===code).lang,label:buttons.find(b=>b.dataset.lang===code).textContent});
 video.append(source,track);video.load();document.getElementById('download').href=source.src;
 for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.lang===code));
}
for(const b of buttons)b.addEventListener('click',()=>show(b.dataset.lang));
show(buttons.some(b=>b.dataset.lang==='ja')?'ja':buttons[0].dataset.lang);
</script>
</html>
`);
if(process.env.SUBDUO_DROP_FRAMES)for(const clip of capture.clips)rmSync(join(work,clip.dir),{recursive:true,force:true});
console.log('READY',file,plan.duration,'seconds');
