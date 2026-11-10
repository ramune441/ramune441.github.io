const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util'),puppeteer=require('puppeteer-core');
const run=promisify(execFile),{locales,copy,labels}=require('./build-site'),{EXT_DIR}=require('./guide-shots');
const toolsDir=process.env.FORMPILOT_MEDIA_TOOLS||path.join(os.tmpdir(),'formpilot-media-tools/node_modules');
const ffmpeg=require(path.join(toolsDir,'ffmpeg-static')),ffprobe=require(path.join(toolsDir,'ffprobe-static')).path;
const version=require(path.join(EXT_DIR,'manifest.json')).version,store=require(path.join(EXT_DIR,'store/listing.json'));
const work=path.join(os.tmpdir(),'formpilot-youtube-build'),output=path.join(__dirname,'youtube-assets');fs.mkdirSync(work,{recursive:true});fs.mkdirSync(output,{recursive:true});
const fileURL=file=>'file:///'+file.replace(/\\/g,'/');
async function build(){
 const args=process.argv.slice(2).filter(l=>locales.includes(l)),targets=args.length?args:locales;
 const metadataFile=path.join(__dirname,'youtube.json'),metadata=fs.existsSync(metadataFile)?JSON.parse(fs.readFileSync(metadataFile,'utf8')):{channelId:'UCrjA6ffzb5pUw2URh0BcdRQ',version,items:{}};
 const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage();await page.setViewport({width:1280,height:800,deviceScaleFactor:2});
  for(const locale of targets){
   const frames=[];
   for(let slide=1;slide<=5;slide++){
    await page.goto(fileURL(path.join(EXT_DIR,'store/frame.html'))+`?lang=${locale}&slide=${slide}`);
    await page.waitForFunction(()=>window.storeRendered&&[...document.images].every(img=>img.complete&&img.naturalWidth));
    const frame=path.join(work,`${locale}-${slide}.png`);await page.screenshot({path:frame});frames.push(frame);
   }
   const file=path.join(output,`formpilot-${version}-${locale}.mp4`),cmd=['-y','-hide_banner','-loglevel','error'];
   for(const frame of frames)cmd.push('-loop','1','-framerate','1','-t','6','-i',frame);
   cmd.push('-i',path.join(__dirname,'promo.mp4'));
   const filters=frames.map((_,i)=>`[${i}:v]scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2:color=0xf8fcfa,setsar=1,format=yuv420p,fps=30,settb=AVTB[v${i}]`);
   let previous='v0';for(let i=1;i<5;i++){filters.push(`[${previous}][v${i}]xfade=transition=fade:duration=0.4:offset=${(i*5.6).toFixed(3)}[x${i}]`);previous='x'+i;}
   cmd.push('-filter_complex_threads','2','-filter_complex',filters.join(';'),'-map',`[${previous}]`,'-map','5:a:0','-t','28.4','-c:v','libx264','-profile:v','high','-preset','veryfast','-tune','stillimage','-crf','22','-threads','4','-pix_fmt','yuv420p','-r','30','-af','afade=t=in:d=0.3,afade=t=out:st=26.9:d=1.5','-c:a','aac','-b:a','160k','-ar','48000','-ac','2','-movflags','+faststart',file);
   await run(ffmpeg,cmd,{timeout:600000,maxBuffer:2e6});
   const {stdout}=await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file]);const info=JSON.parse(stdout),video=info.streams.find(s=>s.codec_type==='video'),audio=info.streams.find(s=>s.codec_type==='audio');
   if(video?.width!==3840||video?.height!==2160||audio?.codec_name!=='aac'||audio?.channels!==2||Math.abs(+info.format.duration-28.4)>.1)throw Error('Invalid YouTube file '+locale);
   const title=`FormPilot v${version} | ${copy[locale].slides[0][0]}`;
   const root='https://ramune441.github.io/formpilot/'+(locale==='en'?'':locale+'/');
   const description=store[locale].description+`\n\n${labels[locale].install}\nhttps://chromewebstore.google.com/detail/pedgekkfockobnmkokefjkclahjekend\n\nFormPilot\n${root}?utm_source=youtube&utm_medium=video&utm_campaign=${locale}\n\n${labels[locale].guide}\n${root}guide.html\n\n${labels[locale].privacy}\n${root}privacy-policy.html`;
   if([...title].length>100||description.length>5000)throw Error('YouTube metadata limit '+locale);
   metadata.items[locale]={...metadata.items[locale],title,description,file:path.relative(__dirname,file).replace(/\\/g,'/'),captions:`media/${locale}/promo.vtt`,visibility:'public',madeForKids:false,duration:+info.format.duration,width:video.width,height:video.height,audioCodec:audio.codec_name,audioChannels:audio.channels,bytes:+info.format.size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
   fs.writeFileSync(metadataFile,JSON.stringify(metadata,null,2)+'\n');console.log(`PASS ${locale}: 4K + AAC BGM, ${title}`);
  }
 }finally{await browser.close();}
}
if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={build};
