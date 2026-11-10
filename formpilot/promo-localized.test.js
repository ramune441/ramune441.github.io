const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=__dirname,sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),html=fs.readFileSync(path.join(root,'promo.html'),'utf8');
const ctx={};for(const file of ['site-data.js','promo-translations.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);vm.runInNewContext(html.slice(html.indexOf('const I18N ='),html.indexOf('const LANG ='))+';this.table=I18N;',ctx);
const targets=['zh-Hant','vi','it','tr','pl','nl','th','bn'];
test('The original seven scenes and animation timeline are unchanged',()=>{
 const scenes=html.slice(html.indexOf('<body>'),html.indexOf('<script')).trim().replace(/\r\n/g,'\n');
 const timeline=html.slice(html.indexOf('function buildTimeline()'),html.indexOf('function resetAll()')).trim().replace(/\r\n/g,'\n');
 assert.equal(sha(scenes),'423ab13f13f3661fb6094ad3d9984b36d9b24590e5ef9fbcde4eebd937f7f235');
 assert.equal(sha(timeline),'aed67ab3780770d248c713e17d19b75041aa616384c9a938fa4747eeb2bdf133');
});
test('All missing languages translate every original Japanese promo key',()=>{
 const keys=Object.keys(ctx.table.ja).sort();for(const locale of targets){assert.deepEqual(Object.keys(ctx.table[locale]).sort(),keys);for(const key of keys)assert.ok(typeof ctx.table[locale][key]==='string'&&ctx.table[locale][key].length,locale+'/'+key);}
});
test('The upload manifest covers only the missing languages',()=>{
 const meta=JSON.parse(fs.readFileSync(path.join(root,'youtube-promo-localized.json'),'utf8'));
 assert.equal(meta.channelId,'UCrjA6ffzb5pUw2URh0BcdRQ');assert.deepEqual(Object.keys(meta.items).sort(),[...targets].sort());
 assert.equal(meta.baseSha256,sha(fs.readFileSync(path.join(root,'promo-ja.mp4'))));
 const ids=Object.values(meta.items).filter(x=>x.videoId).map(x=>x.videoId);assert.equal(new Set(ids).size,ids.length);
});
for(const locale of targets)test(locale+': same duration, scene timing and BGM as the original Japanese video',()=>{
 const item=JSON.parse(fs.readFileSync(path.join(root,'youtube-promo-localized.json'),'utf8')).items[locale];assert.ok(item,locale);
 const tools=path.join(os.tmpdir(),'formpilot-media-tools/node_modules'),probe=require(path.join(tools,'ffprobe-static')).path,ffmpeg=require(path.join(tools,'ffmpeg-static'));
 const file=path.join(root,item.file),info=JSON.parse(execFileSync(probe,['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 const v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');assert.equal(v.width,3840);assert.equal(v.height,2160);assert.equal(v.codec_name,'h264');assert.equal(v.avg_frame_rate,'30/1');assert.equal(v.pix_fmt,'yuv420p');assert.ok(Math.abs(+info.format.duration-33)<.05);assert.equal(a.codec_name,'aac');assert.equal(a.channels,2);
 assert.equal(item.sha256,sha(fs.readFileSync(file)));assert.deepEqual(item.sceneTimes,[0,2500,9000,15000,18500,24000,27500]);
 const audio=f=>execFileSync(ffmpeg,['-v','error','-i',f,'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8'}).trim();assert.equal(audio(file),audio(path.join(root,'promo-ja.mp4')));
 assert.equal((fs.readFileSync(path.join(root,item.captions),'utf8').match(/-->/g)||[]).length,7);
 if(item.videoId){assert.equal(item.uploadedSha256,item.sha256);assert.equal(item.watchUrl,'https://www.youtube.com/watch?v='+item.videoId);}
});
test('Chrome decodes and seeks through every translated video',async()=>{
 const puppeteer=require('puppeteer-core'),browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage();
  for(const locale of targets){
   await page.goto('file:///'+path.join(root,`promo-${locale}.mp4`).replace(/\\/g,'/'));
   await page.waitForFunction(()=>document.querySelector('video')?.readyState>=1,{polling:100,timeout:10000});
   const state=await page.evaluate(async()=>{const v=document.querySelector('video');v.muted=true;v.pause();for(const t of [2,17,23,32])await new Promise((resolve,reject)=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=t;setTimeout(()=>reject(Error('Seek timed out')),4000);});return {width:v.videoWidth,height:v.videoHeight,time:v.currentTime,error:v.error?.code||null};});
   assert.equal(state.width,3840,locale);assert.equal(state.height,2160,locale);assert.equal(state.time,32,locale);assert.equal(state.error,null,locale);
  }
 }finally{await browser.close();}
});
