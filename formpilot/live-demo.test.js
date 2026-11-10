const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const dir=path.join(__dirname,'previews'),report=JSON.parse(fs.readFileSync(path.join(dir,'promo-ja-demo-report.json'),'utf8'));
test('The real extension filled nine fields using a successful live AI request',()=>{
 assert.equal(report.extension,'pedgekkfockobnmkokefjkclahjekend');assert.equal(report.liveAI,true);assert.equal(report.aiStatus.state,'done');
 assert.ok(report.network.some(r=>r.url==='https://formpilot-1-1-0.warload57.workers.dev/'&&r.status===200));
 assert.equal(report.filled.lastName,'山田');assert.equal(report.filled.firstName,'太郎');assert.equal(report.filled.email,'taro@example.com');assert.equal(report.filled.state,'東京都');
 assert.equal(Object.values(report.filled).filter(Boolean).length,9);
});
test('Saved page inputs survive reopening and restore edits without another AI call',()=>{
 assert.equal(report.savedEntries.length,1);assert.equal(report.savedEntries[0].name,'お問い合わせ用');assert.equal(Object.keys(report.savedEntries[0].fields).length,9);
 assert.notEqual(report.beforeSave.message,report.filled.message);assert.equal(report.beforeSave.message,'請求書の送付先を変更したいです。');
 assert.ok(Object.values(report.reopened).every(v=>v===''));assert.deepEqual(report.restored,report.beforeSave);
 assert.equal(report.aiCallsBeforeRestore,report.aiCallsAfterRestore);assert.deepEqual(report.pageSubmissions,[]);
});
test('Review video contains the complete flow in 4K H.264 with stereo BGM',()=>{
 const ffprobe=require(path.join(os.tmpdir(),'formpilot-media-tools/node_modules/ffprobe-static')).path;
 const p=JSON.parse(execFileSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',path.join(dir,report.output.file)],{encoding:'utf8'}));
 const v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
 assert.equal(v.codec_name,'h264');assert.equal(v.width,3840);assert.equal(v.height,2160);assert.equal(v.avg_frame_rate,'30/1');assert.equal(v.pix_fmt,'yuv420p');assert.equal(a.codec_name,'aac');assert.equal(a.channels,2);assert.ok(Math.abs(+p.format.duration-33)<.1);
 const m=report.marks;assert.ok(m.begin<m.filled&&m.filled<m.save&&m.save<m.reopen&&m.reopen<m.restore&&m.restore<m.end);
});
test('Chrome plays the review video and seeks across the edited scenes',async()=>{
 const extension=path.resolve(process.env.FORMPILOT_EXT||path.join(__dirname,'../../formpilot'));
 const puppeteer=require(path.join(extension,'node_modules/puppeteer'));
 const browser=await puppeteer.launch({headless:true});
 try{
  const page=await browser.newPage();await page.goto('file:///'+path.join(dir,'demo.html').replace(/\\/g,'/'));
  const result=await page.evaluate(async()=>{
   const video=document.querySelector('video');video.muted=true;
   if(video.readyState<1)await new Promise((resolve,reject)=>{video.addEventListener('loadedmetadata',resolve,{once:true});video.addEventListener('error',()=>reject(Error('Video decoding failed')),{once:true});setTimeout(()=>reject(Error('Metadata timeout')),5000);});
   await Promise.race([video.play(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Playback timeout')),5000))]);
   await new Promise(resolve=>setTimeout(resolve,400));const played=video.currentTime>0;video.pause();
   for(const second of [7.2,11.6,18,23,27,31])await new Promise((resolve,reject)=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=second;setTimeout(()=>reject(Error('Seek timeout')),5000);});
   return {played,width:video.videoWidth,height:video.videoHeight,error:video.error?.code||null,end:video.currentTime};
  });
  assert.equal(result.played,true);assert.equal(result.width,3840);assert.equal(result.height,2160);assert.equal(result.error,null);assert.equal(result.end,31);
 }finally{await browser.close();}
});
