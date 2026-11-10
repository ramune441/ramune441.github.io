const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {locales,copy}=require('./build-site'),meta=require('./youtube.json');
const dir=process.env.FORMPILOT_MEDIA_TOOLS||path.join(os.tmpdir(),'formpilot-media-tools/node_modules');
const ffprobe=require(path.join(dir,'ffprobe-static')).path;
test('YouTube store materials cover all 20 languages on the intended brand channel',()=>{
 assert.equal(meta.channelId,'UCrjA6ffzb5pUw2URh0BcdRQ');assert.deepEqual(Object.keys(meta.items).sort(),[...locales].sort());
});
test('Uploaded video records are unique and tied to the verified material',()=>{
 const uploaded=Object.values(meta.items).filter(item=>item.videoId);
 assert.equal(new Set(uploaded.map(item=>item.videoId)).size,uploaded.length);
 for(const item of uploaded){
  assert.equal(item.uploadedSha256,item.sha256);
  assert.equal(item.watchUrl,`https://www.youtube.com/watch?v=${item.videoId}`);
  if(item.publicVerified){assert.equal(item.captionPublished,true);assert.ok(Number.isFinite(Date.parse(item.verifiedAt)));}
 }
});
for(const locale of locales)test(`${locale}: 4K H.264 with stereo AAC BGM and localized metadata`,()=>{
 const item=meta.items[locale],file=path.join(__dirname,item.file),bytes=fs.readFileSync(file),info=JSON.parse(execFileSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 const video=info.streams.find(s=>s.codec_type==='video'),audio=info.streams.find(s=>s.codec_type==='audio');
 assert.equal(video.codec_name,'h264');assert.equal(video.profile,'High');assert.equal(video.pix_fmt,'yuv420p');assert.equal(video.width,3840);assert.equal(video.height,2160);assert.equal(video.avg_frame_rate,'30/1');
 assert.equal(audio.codec_name,'aac');assert.equal(audio.channels,2);assert.equal(audio.sample_rate,'48000');assert.ok(Math.abs(+info.format.duration-28.4)<.1);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);assert.equal(bytes.length,item.bytes);
 assert.ok(item.title.includes(copy[locale].slides[0][0]));assert.ok([...item.title].length<=100);assert.ok(item.description.length<=5000);assert.equal(item.madeForKids,false);
 assert.ok(fs.existsSync(path.join(__dirname,item.captions)));if(item.videoId)assert.match(item.videoId,/^[\w-]{11}$/);
});
