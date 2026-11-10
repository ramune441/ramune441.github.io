import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {storyboard,timeline,soundEvents,camera,rawTime,sceneTime,recorded,layouts,fps,wheelStep} from './live-plan.mjs';
import {languages} from './live-i18n.mjs';
import {soundtrack,rate} from './live-sound.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const rms=(wav,a,b)=>{let s=0,n=0;for(let i=Math.round(a*rate);i<Math.round(b*rate);i++)for(let c=0;c<2;c++){const v=wav.readInt16LE(44+i*4+c*2)/32768;s+=v*v;n++;}return Math.sqrt(s/n);};
const db=x=>20*Math.log10(x);
// The delivered metadata carries the capture (actions, boxes, frame times), so each plan can be rebuilt without the raw frames.
const rendered=Object.keys(languages).filter(code=>existsSync(join(root,`previews/live-demo-${code}.json`)));
const load=code=>{const meta=JSON.parse(readFileSync(join(root,`previews/live-demo-${code}.json`)));const plan=timeline(storyboard(meta));return{meta,plan,events:soundEvents(plan),clip:name=>meta.clips.find(c=>c.name===name)};};

for(const code of rendered){
 const {meta,plan,events,clip}=load(code);
 test(`${code}: 2倍の密度の収録で、カメラは場面の範囲の外（サイトの枠・関連動画）を映さない`,()=>{
  assert.equal(meta.scale,2);
  for(const scene of plan.scenes.filter(s=>s.time)){
   assert.equal(meta.frames[scene.name].count,clip(scene.name).frames.length);
   for(let n=0;n<scene.duration*fps;n++){
    const {s,d}=camera(scene,n/fps),B=scene.bounds;
    assert.ok(s.x>=B.x-.01&&s.y>=B.y-.01&&s.x+s.w<=B.x+B.w+.01&&s.y+s.h<=B.y+B.h+.01,scene.name+' '+n);
    assert.ok(Math.abs(s.w/s.h-d.w/d.h)<.01,'縦横比を崩さない');
   }
  }
 });
 test(`${code}: 注釈は録画の操作と同じ瞬間に出て、場面は収録の範囲に収まる`,()=>{
  const at=(name,o)=>rawTime(plan.scenes.find(s=>s.name===name),o.at);
  const ev=(name,event,i=0)=>clip(name).events.filter(e=>e.name===event)[i].t;
  const overlays=name=>plan.scenes.find(s=>s.name===name).overlays;
  assert.ok(Math.abs(at('position',overlays('position').find(o=>o.type==='ripple'))-ev('position','drag'))<.01);
  assert.ok(Math.abs(at('word',overlays('word').filter(o=>o.type==='ripple')[1])-ev('word','save'))<.01);
  overlays('study').filter(o=>o.type==='key').forEach((o,i)=>assert.ok(Math.abs(at('study',o)-ev('study','key',i))<.01));
  const wheel=overlays('position').find(o=>o.type==='wheel'),s=plan.scenes.find(s=>s.name==='position');
  wheel.notches.forEach((n,i)=>assert.ok(Math.abs(rawTime(s,n.at)-ev('position','wheel',i))<.01));
  for(const sc of plan.scenes.filter(s=>s.time)){
   // Capture → scene → capture comes back exactly (scene → capture → scene cannot: a hold maps many scene times to one).
   const [from,to]=[sc.time[0][1],sc.time.at(-1)[1]];
   for(const r of [from,(from+to)/2,to])assert.ok(Math.abs(rawTime(sc,sceneTime(sc,r))-r)<1e-6,sc.name);
   assert.ok(rawTime(sc,0)>=0&&rawTime(sc,sc.duration)<=recorded(clip(sc.name))+.05,sc.name);
  }
  // About 40 seconds, ending on a bar line.
  assert.ok(plan.duration>=38&&plan.duration<=48&&plan.duration%2===0,String(plan.duration));assert.equal(plan.frames,plan.duration*fps);
  // The study scene explains its keys on a strip of the subtitle lines, timed by the recorded keys and pause.
  const strip=plan.scenes.find(s=>s.name==='study').overlays.find(o=>o.type==='lines'),study=plan.scenes.find(s=>s.name==='study');
  const keyAt=k=>clip('study').events.find(e=>e.name==='key'&&e.key===k).t,jumps=clip('study').events.filter(e=>e.name==='key'&&'DA'.includes(e.key));
  // D and A move the strip both ways (to the next line and back), each on its recorded key press.
  assert.equal(strip.moves.length,jumps.length);strip.moves.forEach((m,i)=>assert.ok(Math.abs(rawTime(study,m.at)-jumps[i].t)<.01));
  assert.deepEqual(strip.moves.map(m=>m.index),jumps.map((_,i)=>jumps.slice(0,i+1).reduce((n,j)=>Math.max(0,n+(j.key==='D'?1:-1)),0)));
  assert.ok(strip.moves.at(-1).at<strip.repeat&&strip.repeat<strip.stop&&strip.stop<strip.paused&&strip.paused<study.duration);
  assert.equal(strip.lines[0],clip('study').before.a);
  [['repeat',keyAt('S')],['stop',keyAt('Q')],['paused',ev('study','paused')]].forEach(([k,raw])=>assert.ok(Math.abs(rawTime(study,strip[k])-raw)<.01,k));
 });
 test(`${code}: 拡大・縮小の表示は拡張が実際に適用した文字サイズと合う`,()=>{
  const p=clip('position'),font=n=>parseFloat(p.events.find(e=>e.name===n).font),start=parseFloat(p.before.font);
  const wheels=p.events.filter(e=>e.name==='wheel'),ups=wheels.filter(w=>w.dir==='up').length,downs=wheels.length-ups;
  assert.ok(ups>=6&&downs>=3,'拡大と縮小の両方を見せる');
  assert.ok(font('grown')>start*1.3&&font('shrunk')<font('grown'),'目で分かるほど大きくしてから小さくする');
  const scene=plan.scenes.find(s=>s.name==='position'),wheel=scene.overlays.find(o=>o.type==='wheel'),notches=wheel.notches;
  // What the chip shows once each turn has settled: the last notch, or the size the line caught up to after it.
  const shown=t=>[...notches,...(wheel.settle||[])].filter(n=>n.at<=t).sort((a,b)=>a.at-b.at).at(-1).size;
  assert.equal(shown(notches[ups].at-1e-6),Math.round(100*font('grown')/start));assert.equal(shown(scene.duration),Math.round(100*font('shrunk')/start));
  wheels.forEach((w,i)=>{if(w.font)assert.equal(notches[i].size,Math.round(100*parseFloat(w.font)/start));});
  // A notch can be dropped by the page, but the sizes still step towards the turning direction.
  notches.forEach((n,i)=>{if(i&&n.dir===notches[i-1].dir)assert.ok(n.dir==='up'?n.size>=notches[i-1].size:n.size<=notches[i-1].size);});
  assert.ok(wheelStep>1);
 });
 test(`${code}: 効果音は画面の出来事と同じ時刻に置かれ、配布物の音と一致する`,()=>{
  for(const scene of plan.scenes)for(const o of scene.overlays||[]){
   const kind={pin:'pop',ripple:'click',arrow:'swish',key:'key',stamp:'success',box:'pop',badge:'pop'}[o.type];
   if(o.type==='wheel'){for(const n of o.notches)assert.ok(events.some(e=>e.kind==='notch'&&Math.abs(e.time-(scene.start+n.at))<1e-3));continue;}
   if(o.type==='lines'){assert.ok(events.some(e=>e.kind==='pop'&&Math.abs(e.time-(scene.start+o.paused))<1e-3),'行の終わりで止まった音');continue;}
   assert.ok(events.some(e=>e.kind===kind&&Math.abs(e.time-(scene.start+o.at))<1e-3),scene.name+' '+o.type);
  }
  for(const scene of plan.scenes.slice(1))assert.ok(events.some(e=>e.kind==='whoosh'&&Math.abs(e.time-(scene.start-.32))<1e-3),'場面転換の風切り音: '+scene.name);
  assert.ok(events.every(e=>e.time>=0&&e.time<plan.duration));
  assert.equal(hash(soundtrack(plan,events)),meta.audio.pcmSha256);assert.deepEqual(meta.audio.events,events);
  assert.equal(meta.audio.original,true);assert.equal(meta.audio.thirdPartySamples,false);
  assert.ok(Math.abs(meta.audio.integratedLufs+16)<.6);assert.ok(meta.audio.truePeakDbtp<=-1);
 });
}

// Every language uses the same synthesis; only the event times differ, so the mix is checked once.
test('効果音は BGM に埋もれず、うるさくもなく、音は毎回同じに生成されて最後はフェードアウトする',()=>{
 const {plan,events}=load(rendered.includes('ja')?'ja':rendered[0]);
 const fx=soundtrack(plan,events,{music:false,normalize:false}),music=soundtrack(plan,events,{effects:false,normalize:false});
 const window={click:.05,key:.08,notch:.04,pop:.12,success:.35,whoosh:.6,swish:.35,impact:.5,tick:.03};
 // Same mix gains for both renders. Each sound stays audible; on average a kind sits about level with the music,
 // and only the highlights (logo hit, saved, closing) rise a few dB above it.
 const over={};
 for(const e of events.filter(e=>window[e.kind])){const d=db(rms(fx,e.time,e.time+window[e.kind]))-db(rms(music,e.time,e.time+window[e.kind]));assert.ok(d>-8,'聞こえない: '+e.kind+' '+e.time);(over[e.kind]??=[]).push(d);}
 for(const [kind,list] of Object.entries(over)){const avg=list.reduce((a,b)=>a+b)/list.length;assert.ok(avg<=(['impact','success'].includes(kind)?8:4),`うるさい: ${kind} ${avg.toFixed(1)} dB`);}
 const a=soundtrack(plan,events),b=soundtrack(plan,events);assert.ok(a.equals(b));
 assert.equal(a.toString('ascii',0,4),'RIFF');assert.equal(a.readUInt32LE(24),rate);assert.equal(a.readUInt16LE(22),2);assert.equal((a.length-44)/4/rate,plan.duration);
 assert.equal(rms(soundtrack(plan,events,{music:false,effects:false}),0,plan.duration),0);
 assert.ok(rms(a,plan.duration-.05,plan.duration)<rms(a,30,31)/4);
});

test('台本の不正な値は書き出し前に止める',()=>{
 const {plan}=load(rendered[0]),scene=plan.scenes.find(s=>s.name==='dual');
 const broken=extra=>timeline(plan.scenes.map(s=>s.name==='dual'?{...scene,...extra}:s));
 assert.throws(()=>broken({time:[[0,0],[5,5]]}),/time map/);
 assert.throws(()=>broken({camera:[[0,'tall',0,0,100]]}),/camera/);
 assert.throws(()=>broken({overlays:[{type:'pin',at:scene.duration+1}]}),/overlay/);
 assert.throws(()=>timeline([{name:'x',duration:3}]),/bar/);
 assert.throws(()=>storyboard({lang:'ja',clips:[]}),/No capture/);
 assert.throws(()=>storyboard({lang:'xx',clips:[]}),/Unknown language/);
 assert.ok(layouts.full.w===1920&&layouts.full.h===1080);
});
