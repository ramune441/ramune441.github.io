// Original soundtrack for the live demo: a bright 120 BPM pop loop (Am–F–C–G, cadence F–G–C on the closing card)
// with interface sounds placed from the plan's events. Everything is synthesized here; no samples or third-party music.
import {bpm} from './live-plan.mjs';
export const rate=48000;
const beat=60/bpm,bar=beat*4;
const midi=n=>440*2**((n-69)/12);
const tau=2*Math.PI;

// Seeded noise keeps every render byte-identical.
function random(seed){let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/2147483648-1;};}

const chords={
 Am:{notes:[57,60,64,69],bass:45},
 F:{notes:[57,60,65,69],bass:41},
 C:{notes:[55,60,64,67],bass:36},
 G:{notes:[55,59,62,67],bass:43},
};
const loop=['Am','F','C','G'];
// Closing card: four bars after the groove, IV–V then I rings out.
const chordAt=(b,bars)=>b>=bars-1?'C':b===bars-2?'G':b===bars-3?'F':loop[b%4];

// `normalize:false` keeps the mix level fixed, so separate music and effect renders can be compared.
export function soundtrack(plan,events,{music=true,effects=true,normalize=true}={}){
 const length=Math.round(plan.duration*rate),bars=Math.round(plan.duration/bar);
 const groove=plan.scenes[1].start,closing=plan.scenes.at(-1).start,final=(bars-1)*bar;
 const bus=()=>[new Float32Array(length),new Float32Array(length)];
 const drums=bus(),tone=bus(),fx=bus(),send=new Float32Array(length),duck=new Float32Array(length).fill(1);
 const noise=random(0x5b1d0);
 const add=(target,start,duration,voice,gain,pan=0,wet=0)=>{
  const first=Math.max(0,Math.round(start*rate)),last=Math.min(length,Math.round((start+duration)*rate));
  const l=gain*Math.cos((pan+1)*Math.PI/4)*Math.SQRT2,r=gain*Math.sin((pan+1)*Math.PI/4)*Math.SQRT2;
  for(let i=first;i<last;i++){const v=voice(i/rate-start);target[0][i]+=v*l;target[1][i]+=v*r;send[i]+=v*gain*wet;}
 };
 const env=(t,held,attack,release)=>Math.min(1,t/attack)*(t<held?1:Math.max(0,1-(t-held)/release));

 // Drums
 const kick=(at,gain)=>{let ph=0;add(drums,at,.45,t=>{ph+=tau*(46+120*Math.exp(-t*28))/rate;return Math.sin(ph)*Math.exp(-t*7)+noise()*.25*Math.exp(-t*320);},gain);
  const first=Math.round(at*rate);for(let i=first;i<Math.min(length,first+.3*rate);i++)duck[i]=Math.min(duck[i],1-.5*Math.exp(-(i-first)/rate/.08));};
 const clap=(at,gain)=>{let lo=0;add(drums,at,.3,t=>{const n=noise();lo+=(n-lo)*.3;const burst=[0,.011,.022].reduce((s,o)=>s+(t>=o?Math.exp(-(t-o)*160):0),0);return(n-lo)*(burst*.6+Math.exp(-t*16)*.5);},gain,.05,.5);};
 const hat=(at,gain,open,pan=.3)=>{let p=0;add(drums,at,open?.25:.05,t=>{const n=noise(),h=n-p;p=n;return h*Math.exp(-t*(open?14:80));},gain,pan);};
 const crash=(at,gain)=>{let p=0;add(drums,at,2.6,t=>{const n=noise(),h=n-p;p=n;return h*Math.exp(-t*1.4)*(1+.5*Math.sin(tau*5.3*t));},gain,-.15,.6);};

 // Tonal
 const pad=(note,at,held,gain)=>{const f=midi(note);add(tone,at,held+1,t=>env(t,held,.5,1)*(Math.sin(tau*f*t)+Math.sin(tau*f*1.004*t)+.3*Math.sin(tau*2*f*t))/2.3,gain,(note%3-1)*.4,.6);};
 const stab=(note,at,gain)=>{const f=midi(note);add(tone,at,.32,t=>{let v=0;for(const d of [.993,1,1.007])for(let k=1;k<=9;k++)v+=Math.sin(tau*f*d*k*t+k*d)/k**1.4;return v/4*Math.exp(-t*9)*Math.min(1,t/.004);},gain,(note%2?.35:-.35),.35);};
 const bell=(note,at,gain,pan=0,decay=7,target=tone)=>{const f=midi(note);add(target,at,1.1,t=>(Math.sin(tau*f*t)+.35*Math.sin(tau*2*f*t)*Math.exp(-t*6)+.12*Math.sin(tau*3.01*f*t)*Math.exp(-t*12))*Math.exp(-t*decay)*Math.min(1,t/.003),gain,pan,.45);};
 const bass=(note,at,held,gain)=>{const f=midi(note);let lo=0;add(tone,at,held+.05,t=>{const v=Math.sin(tau*f*t)+.55*Math.sin(tau*2*f*t)+.3*Math.sin(tau*3*f*t)+.15*Math.sin(tau*4*f*t);lo+=(v-lo)*.25;return env(t,held,.006,.05)*lo*.7;},gain);};
 const lead=(note,at,held,gain)=>{const f=midi(note);add(tone,at,held+.2,t=>{const vib=1+.006*Math.sin(tau*5.5*t)*Math.min(1,t/.25);let v=0;for(const k of [1,3,5,7])v+=Math.sin(tau*f*vib*k*t)/k;return env(t,held,.01,.2)*v*.8;},gain,.1,.5);};

 if(music)for(let b=0;b<bars;b++){
  const at=b*bar,name=chordAt(b,bars),chord=chords[name],intro=at<groove,cta=at>=closing,last=at>=final;
  if(last){
   kick(at,.75);crash(at,.16);
   for(const n of chord.notes){pad(n,at,1.6,.05);stab(n,at,.11);stab(n+12,at,.05);}
   bass(chord.bass,at,1.2,.36);
   chord.notes.concat(chord.notes.map(n=>n+12)).forEach((n,i)=>bell(n+12,at+.12+i*beat/4,.09*(1-i/10),i%2?.4:-.4,3));
   continue;
  }
  for(const n of chord.notes)pad(n,at,bar,intro?.05:.035);
  // 16th-note bell arpeggio; the intro opens from soft to full.
  const arp=[0,1,2,3,2,1,2,3];
  for(let i=0;i<16;i++){const lift=intro?.35+.65*(at+i*beat/4)/groove:1;bell(chord.notes[arp[i%8]]+12,at+i*beat/4,(i%4?.035:.055)*lift,i%2?.45:-.45);}
  if(intro)continue;
  if(at===groove||cta&&at===closing)crash(at,.12);
  for(let q=0;q<4;q++){
   const t=at+q*beat;kick(t,.7);if(q%2)clap(t,.26);
   hat(t+beat/2,.08,q===3);hat(t+beat/4,.025,false,-.3);hat(t+beat*.75,.025,false,-.3);
   bass(chord.bass,t+beat/2,beat*.42,.34);bass(chord.bass+12,t+beat*.75,beat*.2,.16);
  }
  for(const off of [1.5,3])for(const n of chord.notes)stab(n,at+off*beat,.06);
  if(cta){
   const phrase=name==='F'?[[0,72,1],[1.5,74,.5],[2,76,1.5],[3.5,74,.5]]:[[0,74,1],[1.5,76,.5],[2,79,1.5],[3.5,83,.5]];
   for(const [o,n,h] of phrase)lead(n,at+o*beat,h*beat*.9,.07);
  }
 }

 // Interface sounds: soft, tonal and in the song's key (C major pentatonic) — mallet and celesta notes and a muted tap.
 // Raw noise bursts, bubbly pitch drops and hissy sweeps were found unpleasant; the only noise left is the warm, low
 // air of a scene change.
 const scale=[60,62,64,67,69],step=i=>scale[((i%5)+5)%5]+12*Math.floor(i/5);
 const mallet=(note,at,gain,pan=0,decay=7)=>{const f=midi(note);add(fx,at,Math.min(1.6,7/decay),t=>(Math.sin(tau*f*t)+.18*Math.sin(tau*3.93*f*t)*Math.exp(-t*decay*3)+.05*Math.sin(tau*9.2*f*t)*Math.exp(-t*decay*6))*Math.min(1,t/.003)*Math.exp(-t*decay),gain,pan,.35);};
 const tap=(at,gain,f=1500,pan=0)=>add(fx,at,.07,t=>(Math.sin(tau*f*t)*.5*Math.exp(-t*240)+Math.sin(tau*f*.27*t)*Math.exp(-t*80))*Math.min(1,t/.0015),gain,pan,.1);
 const glide=(from,to,at,len,gain)=>{let ph=0;add(fx,at,len,t=>{const f=midi(from+(to-from)*t/len);ph+=tau*f/rate;return(Math.sin(ph)+.25*Math.sin(2*ph))*Math.sin(Math.PI*t/len)**2;},gain,.1,.4);};
 const fxv={
  tick:at=>tap(at,.05,2000+noise()*150,noise()*.25),
  // Pins and badges climb the scale as they appear.
  pop:(at,e)=>mallet(step(7+(e.pitch||0)),at,.2,.15),
  click:at=>{tap(at,.45,1700);tap(at+.07,.2,2100);},
  key:at=>{tap(at,.5,900);tap(at+.09,.16,1300);},
  swish:at=>glide(72,79,at,.32,.22),
  whoosh:at=>{let lo=0;add(fx,at,.62,t=>{const p=t/.62;lo+=(noise()-lo)*(.008+.05*Math.sin(Math.PI*p));return lo*Math.sin(Math.PI*p)**1.5;},1.25,0,.4);},
  // One wheel notch: a short mallet tick, a scale step up while growing and down while shrinking.
  notch:(at,e)=>mallet(step(7+(e.pitch||0)),at,.18,.2,16),
  success:at=>[79,84,88,91].forEach((n,i)=>bell(n,at+i*.07,.15,(i-1.5)*.2,4,fx)),
  // The logo lands on a warm C chord with a soft low thump.
  impact:at=>{[48,55,64,72].forEach((n,i)=>mallet(n,at,[.07,.045,.035,.03][i],(i-1.5)*.2,2.5));add(fx,at,.8,t=>Math.sin(tau*65*t)*Math.exp(-t*7),.11);},
  // Build-up into the first scene: a mallet arpeggio that speeds up and swells.
  riser:(at,e)=>{const len=e.length||1,n=10;for(let i=0;i<n;i++)mallet(step(i),at+len*Math.sqrt(i/n)*.95,.04+.07*i/n,(i%2?.3:-.3),9);},
 };
 if(effects)for(const e of events){
  if(!fxv[e.kind])throw new Error('Unknown sound event: '+e.kind);
  fxv[e.kind](e.time,e);
 }

 // Small stereo room on the send bus.
 const reverb=(combs,allpasses)=>{
  const out=new Float32Array(length);
  for(const d of combs){const buf=new Float32Array(d);let i0=0,damp=0;for(let i=0;i<length;i++){const v=buf[i0];damp=v*.65+damp*.35;buf[i0]=send[i]+damp*.8;i0=(i0+1)%d;out[i]+=v/combs.length;}}
  for(const d of allpasses){const buf=new Float32Array(d);let i0=0;for(let i=0;i<length;i++){const s=buf[i0],v=out[i];buf[i0]=v+s*.5;out[i]=s-v*.5;i0=(i0+1)%d;}}
  return out;
 };
 const wet=[reverb([1557,1617,1491,1422],[225,556]),reverb([1580,1640,1514,1445],[248,579])];

 // Interface sounds sit about level with the music (louder ones were reported as noisy); the music dips slightly while one plays.
 const left=new Float32Array(length),right=new Float32Array(length);let peak=0,level=0;
 for(let i=0;i<length;i++){
  const a=Math.max(Math.abs(fx[0][i]),Math.abs(fx[1][i]));level=a>level?level+(a-level)*.02:level*(1-1/(.15*rate));
  const bed=.42*(1-.2*Math.min(1,level*5));
  for(const [c,out] of [[0,left],[1,right]])out[i]=Math.tanh(((drums[c][i]+tone[c][i]*duck[i])*bed+fx[c][i]*.85+wet[c][i]*.3)*1.1);
  peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
 }
 const fade=1.6*rate,pcm=Buffer.alloc(44+length*4);
 for(let i=0;i<length;i++){
  const g=(normalize?(peak?.6/peak:0):.5)*Math.min(1,i/(.01*rate),(length-i)/fade);
  pcm.writeInt16LE(Math.round(left[i]*g*32767),44+i*4);pcm.writeInt16LE(Math.round(right[i]*g*32767),46+i*4);
 }
 pcm.write('RIFF',0);pcm.writeUInt32LE(36+length*4,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(2,22);
 pcm.writeUInt32LE(rate,24);pcm.writeUInt32LE(rate*4,28);pcm.writeUInt16LE(4,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(length*4,40);
 return pcm;
}
