// Gives the YouTube videos the original soundtrack from promo-sound.js: the picture is copied as is, the audio is
// rendered from each video's own scene timing and normalised to -16 LUFS. Outputs go to youtube-assets/original-sound/
// as new files, because an uploaded YouTube video cannot have its file replaced.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const run=promisify(execFile),{locales}=require('./build-site'),{rate,promoScenes,firstChange,promoPlan,slidesPlan,soundtrack}=require('./promo-sound');
// Tools and work files live under %LOCALAPPDATA%/FormPilot: the OS temp folder gets cleaned while a build runs.
const toolsDir=process.env.FORMPILOT_MEDIA_TOOLS||path.join(process.env.LOCALAPPDATA||os.homedir(),'FormPilot','media-tools/node_modules');
const ffmpeg=process.env.FFMPEG_PATH&&fs.existsSync(process.env.FFMPEG_PATH)?process.env.FFMPEG_PATH:require(path.join(toolsDir,'ffmpeg-static'));
const ffprobe=process.env.FFPROBE_PATH&&fs.existsSync(process.env.FFPROBE_PATH)?process.env.FFPROBE_PATH:require(path.join(toolsDir,'ffprobe-static')).path;
const work=path.join(process.env.LOCALAPPDATA||os.homedir(),'FormPilot','youtube-sound'),outDir=path.join(__dirname,'youtube-assets/original-sound'),manifestFile=path.join(__dirname,'youtube-sound.json');
const sha=file=>crypto.createHash('sha256').update(Buffer.isBuffer(file)?file:fs.readFileSync(file)).digest('hex');
const rel=file=>path.relative(__dirname,file).replace(/\\/g,'/');

// Both families of uploaded videos: the recorded promo ("FormPilot ver2") and the store-slide video.
const sources=()=>[
 ...locales.map(locale=>({kind:'promo',locale,source:path.join(__dirname,locale==='en'?'promo.mp4':`promo-${locale}.mp4`),file:path.join(outDir,`promo-${locale}.mp4`)})),
 ...Object.entries(require('./youtube.json').items).map(([locale,item])=>({kind:'slides',locale,source:path.join(__dirname,item.file),file:path.join(outDir,path.basename(item.file))})),
].filter(s=>fs.existsSync(s.source));

// Scene starts as the recording shows them. The capture only adds a frame when the page changes, so changes come in
// steps with still frames between. A scene fade changes the whole picture (a mean difference of 2+ from the still
// before it), while the previous scene's last animations, which late recordings push into the window, change far
// less; so find the fade, then step back through the changes that lead into it (gaps up to 6 frames) to its start.
// The first scene has nothing before it, so its first change is its start.
const fps=30,W=64,H=36,gap=6;
async function sceneStarts(file){
 const {stdout}=await run(ffmpeg,['-hide_banner','-loglevel','error','-i',file,'-an','-vf',`fps=${fps},scale=${W}:${H},format=gray`,'-f','rawvideo','-'],{encoding:'buffer',maxBuffer:1e8,timeout:600000});
 const count=stdout.length/(W*H),diff=(a,b)=>{let s=0;for(let k=0;k<W*H;k++)s+=Math.abs(stdout[a*W*H+k]-stdout[b*W*H+k]);return s/(W*H);};
 return promoScenes.map(([name,nominal],i)=>{
  const expected=nominal+firstChange[i],base=Math.max(0,Math.round((expected-.15)*fps)),limit=Math.min(count-1,Math.round((expected+1.2)*fps));
  let n=base+1;while(n<=limit&&diff(n,base)<(i?2:.5))n++;
  if(n>limit)throw Error(`No scene change near ${expected}s (${name}) in ${rel(file)}`);
  if(i)for(let k=n-1;k>base&&k>=n-gap;k--)if(diff(k,k-1)>=.1)n=k;
  return +((n-.5)/fps-firstChange[i]).toFixed(3);
 });
}

const target='loudnorm=I=-16:TP=-1.5:LRA=11';
// Read only the JSON block; newer ffmpeg builds print a status line after it.
async function loudness(file){const {stderr}=await run(ffmpeg,['-hide_banner','-nostats','-i',file,'-vn','-af',target+':print_format=json','-f','null','-'],{maxBuffer:2e6});const json=stderr.slice(stderr.lastIndexOf('{'));return JSON.parse(json.slice(0,json.indexOf('}')+1));}
// Two-pass loudness; the limiter keeps the sharp interface sounds under -1 dBTP after AAC encoding.
async function normalizer(wav){const m=await loudness(wav);return target+`:measured_I=${m.input_i}:measured_LRA=${m.input_lra}:measured_TP=${m.input_tp}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,alimiter=limit=0.66:level=disabled`;}
async function videoHash(file){return (await run(ffmpeg,['-hide_banner','-loglevel','error','-i',file,'-map','0:v:0','-c','copy','-f','streamhash','-hash','sha256','-'],{maxBuffer:1e6})).stdout.trim().split('SHA256=')[1];}
async function probe(file){return JSON.parse((await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file])).stdout);}

async function build(){
 const args=process.argv.slice(2),kinds=args.filter(a=>a==='promo'||a==='slides'),only=args.filter(a=>locales.includes(a));
 const targets=sources().filter(s=>(!kinds.length||kinds.includes(s.kind))&&(!only.length||only.includes(s.locale)));
 if(!targets.length)throw Error('Nothing to build');
 fs.mkdirSync(work,{recursive:true});fs.mkdirSync(outDir,{recursive:true});
 const manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{items:{}};
 manifest.audio={style:'FormPilot original pop, synthesized',original:true,thirdPartySamples:false,rate,key:'D major',soundSha256:sha(path.join(__dirname,'promo-sound.js'))};
 for(const s of targets){
  const starts=s.kind==='promo'?await sceneStarts(s.source):undefined,plan=s.kind==='promo'?promoPlan(starts):slidesPlan();
  const source=await probe(s.source),duration=+source.format.duration;
  if(Math.abs(duration-plan.duration)>.1)throw Error(`${rel(s.source)} is ${duration}s, the plan is ${plan.duration}s`);
  const pcm=soundtrack(plan),wav=path.join(work,`${s.kind}-${s.locale}.wav`);fs.writeFileSync(wav,pcm);
  await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',s.source,'-i',wav,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',await normalizer(wav),'-ar',String(rate),'-ac','2','-c:a','aac','-b:a','192k','-t',String(plan.duration),'-movflags','+faststart',s.file],{timeout:300000,maxBuffer:2e6});
  const final=await loudness(s.file),info=await probe(s.file),v=info.streams.find(x=>x.codec_type==='video'),a=info.streams.find(x=>x.codec_type==='audio');
  if(Math.abs(+final.input_i+16)>.6||+final.input_tp>-1)throw Error(`Loudness out of range for ${rel(s.file)}: ${final.input_i} LUFS, ${final.input_tp} dBTP`);
  if(v.width!==3840||v.height!==2160||a?.codec_name!=='aac'||a.channels!==2||Math.abs(+info.format.duration-plan.duration)>.1)throw Error('Invalid output '+rel(s.file));
  const picture=await videoHash(s.file);if(picture!==await videoHash(s.source))throw Error('Picture changed in '+rel(s.file));
  manifest.items[rel(s.file)]={kind:s.kind,locale:s.locale,source:rel(s.source),sourceSha256:sha(s.source),...(starts&&{sceneStarts:starts}),pcmSha256:sha(pcm),
   integratedLufs:+final.input_i,truePeakDbtp:+final.input_tp,videoStreamSha256:picture,duration:+info.format.duration,width:v.width,height:v.height,audioCodec:a.codec_name,audioChannels:a.channels,bytes:fs.statSync(s.file).size,sha256:sha(s.file)};
  manifest.items=Object.fromEntries(Object.entries(manifest.items).sort(([x],[y])=>x.localeCompare(y)));
  fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');fs.rmSync(wav,{force:true});
  console.log(`READY ${rel(s.file)}: ${final.input_i} LUFS, ${final.input_tp} dBTP`+(starts?`, scenes at ${starts.join(' ')}`:''));
 }
}
if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={build,sources,sceneStarts,ffmpeg,ffprobe,loudness,normalizer,videoHash,probe};
