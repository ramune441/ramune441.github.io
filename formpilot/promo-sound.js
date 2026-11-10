// Original soundtrack for the FormPilot YouTube videos: a bright D major pop that stays sparse while the picture shows
// the chore of filling forms, lifts on the solution and resolves IV–V–I on the closing card, with interface sounds on
// what the picture shows. Everything is synthesized here; no samples or third-party music.
const rate=48000,tau=2*Math.PI,midi=n=>440*2**((n-69)/12);

// Seeded noise keeps every render byte-identical.
function random(seed){let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/2147483648-1;};}

const chords={
 D:{notes:[57,61,62,66],bass:38},
 A:{notes:[57,59,61,64],bass:45},
 Bm:{notes:[57,59,62,66],bass:35},
 G:{notes:[55,59,62,66],bass:43},
 Em:{notes:[55,59,62,64],bass:40},
 Fs:{notes:[54,58,61,64],bass:42},
};

// promo.html runs these scenes (seconds); the effects below use the delays of each scene's setTimeout calls.
const promoScenes=[['intro',0],['repeat',2.5],['autofill',9],['solution',15],['demo',18.5],['features',24],['cta',27.5]],promoDuration=33;
// The first visible change of each scene: the intro logo rises at 0.2 s, every other scene starts with its fade.
const firstChange=[.2,0,0,0,0,0,0];
const median=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const round=t=>+t.toFixed(4);

function promoEvents(scenes){
 const start=Object.fromEntries(scenes.map(s=>[s.name,s.start])),events=[];
 const at=(scene,delay,kind,extra)=>events.push({time:round(start[scene]+delay),kind,...extra});
 at('intro',.2,'pop',{pitch:0});at('intro',.6,'sparkle');
 for(const s of scenes.slice(1))if(s.name!=='solution')at(s.name,-.32,'whoosh');
 // Five forms stack up, then the sigh and the way out.
 at('repeat',.2,'pop',{pitch:1});for(let i=0;i<5;i++)at('repeat',.6+i*.7,'card');at('repeat',4.2,'sigh');at('repeat',5.5,'pop',{pitch:4});
 // Chrome's autofill: each field lands right, empty or wrong, then the list of problems.
 at('autofill',.2,'pop',{pitch:1});at('autofill',.4,'swish');
 for(const [delay,status] of [[.9,'ok'],[1.05,'empty'],[1.2,'ok'],[1.35,'wrong'],[1.5,'empty'],[1.65,'empty']])at('autofill',delay,{ok:'ok',empty:'blank',wrong:'error'}[status]);
 at('autofill',2.6,'pop',{pitch:0});for(let i=0;i<5;i++)at('autofill',2.9+i*.25,'drop',{pitch:4-i});
 at('solution',-1.2,'riser',{length:1.2});at('solution',0,'impact');
 [[.2,2],[.5,5],[1.1,3],[1.6,4]].forEach(([delay,pitch])=>at('solution',delay,'pop',{pitch}));
 // The demo: the button is pressed, four text fields fill, then a select, the radio, a select and the checkbox.
 at('demo',.15,'pop',{pitch:1});at('demo',.4,'swish');at('demo',1.8,'click');at('demo',1.85,'sparkle');
 [2.2,2.35,2.5,2.65].forEach(delay=>at('demo',delay,'type'));[2.85,3.05,3.25,3.45].forEach((delay,i)=>at('demo',delay,'check',{pitch:i+1}));at('demo',3.75,'success');
 at('features',.2,'pop',{pitch:1});for(let i=0;i<6;i++)at('features',.4+i*.15,'pop',{pitch:i+2});
 at('cta',.2,'pop',{pitch:2});at('cta',.7,'ok');at('cta',1.2,'success');at('cta',1.7,'pop',{pitch:5});
 return events.sort((a,b)=>a.time-b.time);
}

// `starts` are the scene starts measured in a recorded video; recordings run a few tenths behind the script,
// so the effects follow each scene and the music shifts by the typical delay.
function promoPlan(starts=promoScenes.map(([,t])=>t)){
 if(starts.length!==promoScenes.length)throw Error('One start per promo scene');
 const scenes=promoScenes.map(([name,nominal],i)=>({name,nominal,start:round(starts[i])}));
 const lag=median(scenes.map(s=>s.start-s.nominal)),part=(t,chord,kind)=>({at:t?round(t+lag):0,chord,kind});
 const parts=[part(0,'D','intro'),
  ...[[2.5,'Bm','calm'],[4.5,'G','calm'],[6.5,'Em','calm'],[8,'Fs','calm'],[9,'Bm','tense'],[11,'G','tense'],[13,'Em','tense'],[14,'A','tense']].map(p=>part(...p)),
  ...[[15,'D'],[17,'A'],[19,'Bm'],[21,'G'],[23,'D'],[25,'A']].map(([t,c])=>part(t,c,'groove')),
  part(27.5,'G','cta'),part(29.5,'A','cta'),part(31.5,'D','final')];
 return {duration:promoDuration,scenes,music:{bpm:120,parts},events:promoEvents(scenes)};
}

// build-youtube.js crossfades five store slides: one every 5.6 s, 0.4 s fades, 28.4 s in all.
const slideStep=5.6,slideFade=.4,slidesDuration=28.4;
function slidesPlan(){
 const bpm=900/7,bar=240/bpm,loop=['D','A','Bm','G'],parts=[]; // three bars per slide
 for(let b=0;b<12;b++)parts.push({at:round(b*bar),chord:loop[b%4],kind:b?b<3?'calm':'groove':'intro'});
 parts.push({at:round(12*bar),chord:'G',kind:'cta'},{at:round(13*bar),chord:'A',kind:'cta'},{at:round(14*bar),chord:'D',kind:'final'});
 const scenes=[0,1,2,3,4].map(i=>({name:'slide'+(i+1),nominal:round(i*slideStep),start:round(i*slideStep)}));
 const events=[{time:.15,kind:'sparkle'}];
 for(const s of scenes.slice(1))events.push({time:round(s.start+slideFade/2-.31),kind:'whoosh'},{time:round(s.start+slideFade),kind:'pop',pitch:+s.name.slice(5)});
 events.push({time:round(scenes[4].start+slideFade+.4),kind:'success'});
 return {duration:slidesDuration,scenes,music:{bpm,parts},events:events.sort((a,b)=>a.time-b.time)};
}

// `normalize:false` keeps the mix level fixed, so separate music and effect renders can be compared.
// `palette:'soft'` swaps the bright interface sounds for quieter ones.
function soundtrack(plan,{music=true,effects=true,normalize=true,palette=plan.palette||'bright'}={}){
 const length=Math.round(plan.duration*rate),beat=60/plan.music.bpm;
 const bus=()=>[new Float32Array(length),new Float32Array(length)];
 const drums=bus(),tone=bus(),fx=bus(),send=new Float32Array(length),duck=new Float32Array(length).fill(1);
 const noise=random(0xf0a1);
 // Mixes one voice in; `voice(t)` returns the sample t seconds after its start and is called once per sample in order.
 const add=(target,start,duration,voice,gain,pan=0,wet=0)=>{
  const first=Math.max(0,Math.round(start*rate)),last=Math.min(length,Math.round((start+duration)*rate));
  const l=gain*Math.cos((pan+1)*Math.PI/4)*Math.SQRT2,r=gain*Math.sin((pan+1)*Math.PI/4)*Math.SQRT2;
  // Measured starts fall between samples; never hand a voice a negative time (fractional powers turn it into NaN).
  for(let i=first;i<last;i++){const v=voice(Math.max(0,i/rate-start));target[0][i]+=v*l;target[1][i]+=v*r;send[i]+=v*gain*wet;}
 };
 const env=(t,held,attack,release)=>Math.min(1,t/attack)*(t<held?1:Math.max(0,1-(t-held)/release));

 // Drums
 const kick=(at,gain)=>{let ph=0;add(drums,at,.42,t=>{ph+=tau*(50+105*Math.exp(-t*30))/rate;return Math.sin(ph)*Math.exp(-t*8)+noise()*.2*Math.exp(-t*300);},gain);
  const first=Math.round(at*rate);for(let i=Math.max(0,first);i<Math.min(length,first+.3*rate);i++)duck[i]=Math.min(duck[i],1-.45*Math.exp(-(i-first)/rate/.09));};
 const clap=(at,gain)=>{let lo=0;add(drums,at,.28,t=>{const n=noise();lo+=(n-lo)*.32;const burst=[0,.01,.02].reduce((s,o)=>s+(t>=o?Math.exp(-(t-o)*170):0),0);return(n-lo)*(burst*.6+Math.exp(-t*18)*.5);},gain,-.05,.5);};
 const hat=(at,gain,open,pan=.3)=>{let p=0;add(drums,at,open?.22:.05,t=>{const n=noise(),h=n-p;p=n;return h*Math.exp(-t*(open?16:85));},gain,pan);};
 const crash=(at,gain)=>{let p=0;add(drums,at,2.4,t=>{const n=noise(),h=n-p;p=n;return h*Math.exp(-t*1.5);},gain,.2,.6);};

 // Tonal
 const pad=(note,at,held,gain)=>{const f=midi(note);add(tone,at,held+1,t=>env(t,held,.6,1)*(Math.sin(tau*f*t)+Math.sin(tau*f*1.005*t)+.25*Math.sin(tau*2.003*f*t))/2.25,gain,(note%3-1)*.4,.6);};
 // Electric piano: a little FM brightens the attack and mellows as it rings.
 const keys=(note,at,held,gain)=>{const f=midi(note);add(tone,at,held+.5,t=>env(t,held,.004,.5)*Math.sin(tau*f*t+1.2*Math.exp(-t*4)*Math.sin(tau*f*t))*Math.exp(-t*1.2),gain,(note-62)/16,.35);};
 // Mallet for the arpeggio: the fundamental plus a fast-fading fourth partial.
 const mallet=(note,at,gain,pan)=>{const f=midi(note);add(tone,at,.5,t=>(Math.sin(tau*f*t)*Math.exp(-t*9)+.35*Math.sin(tau*3.98*f*t)*Math.exp(-t*28))*Math.min(1,t/.002),gain,pan,.4);};
 const bass=(note,at,held,gain)=>{const f=midi(note);add(tone,at,held+.05,t=>env(t,held,.006,.05)*Math.tanh(1.6*(Math.sin(tau*f*t)+.4*Math.sin(tau*2*f*t)*Math.exp(-t*5))),gain);};
 const lead=(note,at,held,gain)=>{const f=midi(note);let ph=0;add(tone,at,held+.25,t=>{ph+=tau*f*(1+.005*Math.sin(tau*5.2*t)*Math.min(1,t/.3))/rate;return env(t,held,.015,.25)*(Math.sin(ph)+.25*Math.sin(2*ph)+.12*Math.sin(3*ph));},gain,-.1,.5);};
 const bell=(note,at,gain,pan=0,decay=5,target=tone)=>{const f=midi(note);add(target,at,1.1,t=>(Math.sin(tau*f*t)+.3*Math.sin(tau*2*f*t)*Math.exp(-t*6)+.1*Math.sin(tau*3.01*f*t)*Math.exp(-t*12))*Math.exp(-t*decay)*Math.min(1,t/.003),gain,pan,.45);};

 const phrases={G:[[0,74,1],[1.5,76,.5],[2,78,1.5],[3.5,76,.5]],A:[[0,76,1],[1.5,78,.5],[2,81,1.5],[3.5,85,.5]]};
 const arp=[0,2,1,3,2,1,3,2];
 if(music)plan.music.parts.forEach((p,i,parts)=>{
  const end=i+1<parts.length?parts[i+1].at:plan.duration,beats=Math.round((end-p.at)/beat),c=chords[p.chord],B=k=>p.at+k*beat,entering=parts[i-1]?.kind!==p.kind;
  if(p.kind==='final'){
   kick(p.at,.75);crash(p.at,.15);bass(c.bass,p.at,1.4,.36);
   for(const n of c.notes){pad(n,p.at,1.6,.05);keys(n,p.at,2.2,.11);}
   [74,78,81,86,90,93].forEach((n,k)=>bell(n,p.at+.1+k*beat/4,.08*(1-k/9),k%2?.4:-.4,3));
   return;
  }
  for(const n of c.notes)pad(n,p.at,end-p.at,p.kind==='intro'?.05:p.kind==='groove'?.03:.04);
  if(p.kind==='intro'){for(let k=0;k<beats*2;k++)mallet(c.notes[arp[k%8]]+12,B(k/2),.05*(.3+.7*Math.min(1,B(k/2)/Math.max(beat,end))),k%2?.4:-.4);return;}
  if(p.kind==='calm'||p.kind==='tense'){
   for(let q=0;q<beats;q+=2)bass(c.bass,B(q),beat*1.7,.28);
   for(let k=0;k<beats*2;k++){mallet(c.notes[arp[k%8]]+12,B(k/2),.035,k%2?.4:-.4);hat(B(k/2),k%2?.04:.022,false);}
   if(p.kind==='tense')for(let q=0;q<beats;q++){if(q%2===0)kick(B(q),.5);else hat(B(q+.25),.02,false,-.3);}
   return;
  }
  // groove and cta
  if(entering)crash(p.at,.12);
  const light=p.kind==='cta';
  for(let q=0;q<beats;q++){
   kick(B(q),light?.55:.65);if(q%2)clap(B(q),light?.18:.24);
   hat(B(q+.5),light?.05:.07,q%4===3);if(!light){hat(B(q+.25),.022,false,-.3);hat(B(q+.75),.022,false,-.3);}
   bass(c.bass,B(q+.5),beat*.4,.32);if(q%2)bass(c.bass+12,B(q+.75),beat*.2,.14);
  }
  if(light){for(const n of c.notes)keys(n,p.at,end-p.at-.1,.05);for(const [o,n,h] of phrases[p.chord]||[])if(o<beats)lead(n,B(o),h*beat*.9,.07);}
  else{for(let k=0;k<beats*4;k++)mallet(c.notes[arp[k%8]]+12,B(k/4),k%4?.025:.04,k%2?.45:-.45);for(const off of [1.5,3])if(off<beats)for(const n of c.notes)keys(n,B(off),beat*.3,.045);}
 });

 // Interface sounds; `pitch` steps through the D major pentatonic.
 const pent=[1,9/8,5/4,3/2,5/3,2,9/4,5/2,3];
 const fxv={
  pop:(at,e)=>{const f=midi(74)*pent[e.pitch||0];let ph=0;add(fx,at,.25,t=>{ph+=tau*f*(1+.35*Math.exp(-t*70))/rate;return(Math.sin(ph)+.25*Math.sin(2*ph))*Math.min(1,t/.002)*Math.exp(-t*18);},.38,.1,.4);},
  drop:(at,e)=>{const f=midi(57)*pent[e.pitch||0];let ph=0;add(fx,at,.28,t=>{ph+=tau*f*(1-.12*Math.min(1,t/.2))/rate;return Math.sin(ph)*Math.min(1,t/.003)*Math.exp(-t*14);},.5,-.1,.3);},
  card:at=>{let lo=0,ph=0;add(fx,at,.18,t=>{lo+=(noise()-lo)*.3;return lo*Math.sin(Math.PI*t/.18)**2;},.6,.2,.2);add(fx,at+.12,.15,t=>{ph+=tau*(95+60*Math.exp(-t*40))/rate;return Math.sin(ph)*Math.exp(-t*30);},.5);},
  sigh:at=>{let ph=0;add(fx,at,.6,t=>{ph+=tau*(523-150*Math.min(1,t/.45))/rate;return(Math.sin(ph)+.2*Math.sin(3*ph))*env(t,.4,.03,.2);},.24,0,.4);},
  ok:at=>[1318.5,1760].forEach((f,i)=>add(fx,at+i*.05,.12,t=>Math.sin(tau*f*t)*Math.min(1,t/.002)*Math.exp(-t*35),.32,.2,.3)),
  blank:at=>add(fx,at,.1,t=>(Math.sin(tau*260*t)+noise()*.3*Math.exp(-t*200))*Math.exp(-t*45),.55,-.2,.1),
  error:at=>[0,.11].forEach(o=>add(fx,at+o,.08,t=>(Math.sin(tau*155*t)+Math.sin(tau*465*t)/3+Math.sin(tau*775*t)/5)*Math.min(1,t/.003,(.08-t)/.01),.26,0,.15)),
  swish:at=>{let lo=0;add(fx,at,.35,t=>{lo+=(noise()-lo)*(.06+.4*Math.sin(Math.PI*t/.35));return lo*Math.sin(Math.PI*t/.35)**2;},.5,.15,.3);},
  whoosh:at=>{let lo=0;add(fx,at,.62,t=>{const p=t/.62;lo+=(noise()-lo)*(.02+.3*Math.sin(Math.PI*p));return lo*Math.sin(Math.PI*p)**1.5;},.55,0,.4);},
  riser:(at,e)=>{const len=e.length;let lo=0,ph=0;add(fx,at,len,t=>{const p=t/len;lo+=(noise()-lo)*(.02+.5*p*p);ph+=tau*(220+880*p*p)/rate;return(lo*.8+Math.sin(ph)*.15)*p*p;},.32,0,.4);},
  impact:at=>{let ph=0,lo=0;add(fx,at,1.2,t=>{ph+=tau*(38+45*Math.exp(-t*9))/rate;lo+=(noise()-lo)*.08;return Math.sin(ph)*Math.exp(-t*3)+lo*Math.exp(-t*8)*1.3;},.34,0,.3);crash(at,.12);},
  click:at=>[2200,2900].forEach((f,i)=>add(fx,at+i*.07,.04,t=>(noise()*.4+Math.sin(tau*f*t)*.6)*Math.exp(-t*140),i?.55:.9,.1)),
  key:at=>{add(fx,at,.06,t=>(noise()*.5+Math.sin(tau*1500*t)*.5)*Math.exp(-t*110),.5,noise()*.3,.1);add(fx,at,.08,t=>Math.sin(tau*180*t)*Math.exp(-t*60),.3);},
  // Auto-fill: a quick run of rising key ticks for each field.
  type:at=>{for(let i=0;i<5;i++)add(fx,at+i*.024,.03,t=>(Math.sin(tau*(1900+180*i)*t)*.6+noise()*.4)*Math.exp(-t*160),.75-.05*i,(i-2)*.12,.1);},
  check:(at,e)=>{const f=midi(81)*pent[e.pitch||0];add(fx,at,.16,t=>(Math.sin(tau*f*t)+.3*Math.sin(tau*2*f*t)*Math.exp(-t*40))*Math.min(1,t/.002)*Math.exp(-t*26)+noise()*.15*Math.exp(-t*250),.36,.15,.3);},
  sparkle:at=>[0,4,7,12,16].forEach((n,i)=>bell(86+n,at+i*.035,.14*(1-i*.12),(i-2)*.25,9,fx)),
  success:at=>[74,78,81,86].forEach((n,i)=>bell(n,at+i*.07,.3,(i-1.5)*.2,4.5,fx)),
 };
 // The soft palette: wooden taps and marimba notes, quieter and with less ducking, for videos that should stay calm.
 const soft=palette==='soft';
 if(soft){
  const marimba=(note,at,gain,pan=0)=>{const f=midi(note);add(fx,at,.7,t=>(Math.sin(tau*f*t)+.25*Math.sin(tau*3.99*f*t)*Math.exp(-t*20))*Math.exp(-t*5)*Math.min(1,t/.003),gain,pan,.5);};
  Object.assign(fxv,{
   click:at=>add(fx,at,.08,t=>(Math.sin(tau*1050*t)*Math.exp(-t*55)+.4*Math.sin(tau*2600*t)*Math.exp(-t*120))*Math.min(1,t/.001),.32,.1,.15),
   key:at=>add(fx,at,.04,t=>(Math.sin(tau*1200*t)+noise()*.2)*Math.exp(-t*150),.18,noise()*.3,.05),
   pop:(at,e)=>marimba(74+[0,2,4,7,9,12,14,16,19][e.pitch||0],at,.16,.1),
   success:at=>[74,81].forEach((n,i)=>marimba(n,at+i*.09,.22,i?.2:-.2)),
   whoosh:at=>{let lo=0;add(fx,at,.62,t=>{const p=t/.62;lo+=(noise()-lo)*(.01+.12*Math.sin(Math.PI*p));return lo*Math.sin(Math.PI*p)**1.5;},.22,0,.4);},
   impact:at=>bell(62,at,.2,0,2,fx),
   sparkle:at=>[86,93].forEach((n,i)=>bell(n,at+i*.06,.06,i?.25:-.25,8,fx)),
  });
 }
 if(effects)for(const e of plan.events){
  if(!fxv[e.kind])throw Error('Unknown sound event: '+e.kind);
  fxv[e.kind](e.time,e);
 }

 // Small stereo room on the send bus.
 const reverb=(combs,allpasses)=>{
  const out=new Float32Array(length);
  for(const d of combs){const buf=new Float32Array(d);let k=0,damp=0;for(let i=0;i<length;i++){const v=buf[k];damp=v*.68+damp*.32;buf[k]=send[i]+damp*.78;k=(k+1)%d;out[i]+=v/combs.length;}}
  for(const d of allpasses){const buf=new Float32Array(d);let k=0;for(let i=0;i<length;i++){const s=buf[k],v=out[i];buf[k]=v+s*.5;out[i]=s-v*.5;k=(k+1)%d;}}
  return out;
 };
 const wet=[reverb([1601,1693,1531,1459],[241,563]),reverb([1624,1716,1554,1482],[264,586])];

 // The music sits under the interface sounds and steps back further while one plays, so every action is heard.
 const left=new Float32Array(length),right=new Float32Array(length);let peak=0,level=0;
 for(let i=0;i<length;i++){
  const a=Math.max(Math.abs(fx[0][i]),Math.abs(fx[1][i]));level=a>level?level+(a-level)*.02:level*(1-1/(.15*rate));
  const bed=.42*(1-(soft?.25:.5)*Math.min(1,level*5));
  for(const [c,out] of [[0,left],[1,right]])out[i]=Math.tanh(((drums[c][i]+tone[c][i]*duck[i])*bed+fx[c][i]*(soft?.9:1.5)+wet[c][i]*.3)*1.1);
  peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
 }
 const fade=1.5*rate,pcm=Buffer.alloc(44+length*4);
 for(let i=0;i<length;i++){
  const g=(normalize?(peak?.6/peak:0):.5)*Math.min(1,i/(.01*rate),(length-i)/fade);
  pcm.writeInt16LE(Math.round(left[i]*g*32767),44+i*4);pcm.writeInt16LE(Math.round(right[i]*g*32767),46+i*4);
 }
 pcm.write('RIFF',0);pcm.writeUInt32LE(36+length*4,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(2,22);
 pcm.writeUInt32LE(rate,24);pcm.writeUInt32LE(rate*4,28);pcm.writeUInt16LE(4,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(length*4,40);
 return pcm;
}

module.exports={rate,promoScenes,firstChange,promoPlan,slidesPlan,soundtrack};
