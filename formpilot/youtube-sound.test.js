const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {rate,promoScenes,promoPlan,slidesPlan,soundtrack}=require('./promo-sound'),meta=require('./youtube-sound.json');
const dir=process.env.FORMPILOT_MEDIA_TOOLS||path.join(process.env.LOCALAPPDATA||os.homedir(),'FormPilot','media-tools/node_modules');
const ffmpeg=require(path.join(dir,'ffmpeg-static'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rms=(wav,a,b)=>{let s=0,n=0;for(let i=Math.round(a*rate);i<Math.round(b*rate);i++)for(let c=0;c<2;c++){const v=wav.readInt16LE(44+i*4+c*2)/32768;s+=v*v;n++;}return Math.sqrt(s/n);};
const db=x=>20*Math.log10(x);
const html=fs.readFileSync(path.join(__dirname,'promo.html'),'utf8'),plan=promoPlan();
const relative=(kinds,scene)=>plan.events.filter(e=>kinds.includes(e.kind)&&e.time>=scene.start&&e.time<scene.start+6).map(e=>+(e.time-scene.start).toFixed(3));
const scene=name=>plan.scenes.find(s=>s.name===name);

test('場面の開始時刻は promo.html の台本と一致する',()=>{
 let t=0;const starts=[0,...[...html.matchAll(/t \+= (\d+);/g)].map(m=>(t+=+m[1])/1000)];
 assert.deepEqual(promoScenes.map(([,s])=>s),starts);
});

test('効果音は台本の出来事と同じ時刻に置かれる',()=>{
 // Chrome の自動入力: 正しく入る欄・空のまま・誤入力
 const fields=[...html.matchAll(/\['cf\d',[^\]]*?'(ok|empty|wrong)',(\d+)\]/g)].map(m=>[{ok:'ok',empty:'blank',wrong:'error'}[m[1]],+m[2]/1000]);
 assert.equal(fields.length,6);
 for(const [kind,at] of fields)assert.ok(relative([kind],scene('autofill')).includes(at),kind+' '+at);
 // デモ: 4つの文字欄と、選択・ラジオ・選択・チェックの4操作
 const demo=html.slice(html.indexOf('const steps = ['),html.indexOf('steps.forEach')),steps=[...demo.matchAll(/\[(\d{4}), \(\) =>/g)].map(m=>+m[1]/1000);
 assert.equal(steps.length,8);assert.deepEqual(relative(['type','check'],scene('demo')),steps);
 assert.ok(html.includes('}, 1800);')&&relative(['click'],scene('demo')).includes(1.8),'AI 自動入力ボタンを押す音');
 // 積み重なるフォーム5枚とため息
 assert.ok(html.includes('600 + i * 700'));assert.deepEqual(relative(['card'],scene('repeat')),[.6,1.3,2,2.7,3.4]);
 assert.ok(html.includes("anim('e2sigh', {opacity:1, transform:'translateY(0)'}), 4200"));assert.deepEqual(relative(['sigh'],scene('repeat')),[4.2]);
 // 場面転換: 解決の場面はライザーと衝撃音、それ以外は風切り音
 for(const s of plan.scenes.slice(1)){
  if(s.name==='solution')assert.ok(plan.events.some(e=>e.kind==='impact'&&e.time===s.start));
  else assert.ok(plan.events.some(e=>e.kind==='whoosh'&&Math.abs(e.time-(s.start-.32))<1e-6),s.name);
 }
 for(const p of [plan,slidesPlan()])assert.ok(p.events.every(e=>e.time>=0&&e.time<p.duration));
});

test('録画の遅れに合わせると効果音は場面ごとにずれ、BGM は全体の遅れだけずれる',()=>{
 const late=promoPlan(promoScenes.map(([,t],i)=>t+(i===4?.6:.3)));
 const at=(p,kind)=>p.events.find(e=>e.kind===kind).time;
 assert.equal(+(at(late,'type')-at(plan,'type')).toFixed(3),.6);assert.equal(+(at(late,'card')-at(plan,'card')).toFixed(3),.3);
 assert.equal(late.music.parts[0].at,0);assert.equal(+(late.music.parts[1].at-plan.music.parts[1].at).toFixed(3),.3);
});

test('効果音は BGM に埋もれない（同じ音量設定で効果音だけと BGM だけを比べる）',()=>{
 const window={pop:.12,drop:.15,card:.25,sigh:.5,ok:.15,blank:.08,error:.2,swish:.3,whoosh:.6,impact:.5,click:.1,type:.12,check:.12,sparkle:.2,success:.35};
 for(const p of [plan,slidesPlan()]){
  const fx=soundtrack(p,{music:false,normalize:false}),music=soundtrack(p,{effects:false,normalize:false});
  // The riser builds up from silence under the music on purpose.
  for(const e of p.events.filter(e=>e.kind!=='riser'))assert.ok(db(rms(fx,e.time,e.time+window[e.kind]))-db(rms(music,e.time,e.time+window[e.kind]))>-1,e.kind+' '+e.time);
 }
});

test('音は第三者素材なしで毎回同じに生成され、最後はフェードアウトする',()=>{
 for(const p of [plan,slidesPlan()]){
  const a=soundtrack(p),b=soundtrack(p);assert.ok(a.equals(b));
  assert.equal(a.toString('ascii',0,4),'RIFF');assert.equal(a.readUInt32LE(24),rate);assert.equal(a.readUInt16LE(22),2);assert.equal((a.length-44)/4/rate,p.duration);
  assert.equal(rms(soundtrack(p,{music:false,effects:false}),0,p.duration),0);
  assert.ok(rms(a,p.duration-.05,p.duration)<rms(a,p.duration-4,p.duration-3)/4);
 }
 assert.throws(()=>soundtrack({...plan,events:[{time:1,kind:'beep'}]}),/Unknown sound event/);
 assert.equal(meta.audio.original,true);assert.equal(meta.audio.thirdPartySamples,false);
 assert.equal(meta.audio.soundSha256,sha(fs.readFileSync(path.join(__dirname,'promo-sound.js'))),'promo-sound.js を変えたら node formpilot/build-youtube-sound.js で作り直す');
});

const items=Object.entries(meta.items);
test('紹介動画（全20言語）とストア画像の動画（台帳の全言語）の音を差し替えてある',()=>{
 const {locales}=require('./build-site'),slides=Object.keys(require('./youtube.json').items);
 const has=(kind,locale)=>items.some(([,i])=>i.kind===kind&&i.locale===locale);
 for(const l of locales.filter(l=>fs.existsSync(path.join(__dirname,l==='en'?'promo.mp4':`promo-${l}.mp4`))))assert.ok(has('promo',l),'promo '+l);
 for(const l of slides)assert.ok(has('slides',l),'slides '+l);
});

for(const [file,item] of items)test(`${file}: 元の映像のまま、測った場面に合わせた音で -16 LUFS`,()=>{
 const bytes=fs.readFileSync(path.join(__dirname,file));
 assert.equal(sha(bytes),item.sha256);assert.equal(bytes.length,item.bytes);
 assert.equal(sha(fs.readFileSync(path.join(__dirname,item.source))),item.sourceSha256);
 const p=item.kind==='promo'?promoPlan(item.sceneStarts):slidesPlan();
 if(item.kind==='promo')item.sceneStarts.forEach((t,i)=>{const lag=t-promoScenes[i][1];assert.ok(lag>-.2&&lag<.9,`scene ${i} lag ${lag}`);});
 assert.equal(sha(soundtrack(p)),item.pcmSha256);
 const picture=f=>execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-i',path.join(__dirname,f),'-map','0:v:0','-c','copy','-f','streamhash','-hash','sha256','-'],{encoding:'utf8'}).trim().split('SHA256=')[1];
 assert.equal(picture(file),item.videoStreamSha256);assert.equal(picture(item.source),item.videoStreamSha256);
 assert.ok(Math.abs(item.integratedLufs+16)<.6);assert.ok(item.truePeakDbtp<=-1);
 assert.equal(item.width,3840);assert.equal(item.height,2160);assert.equal(item.audioCodec,'aac');assert.equal(item.audioChannels,2);assert.ok(Math.abs(item.duration-p.duration)<.1);
});
