// One timeline drives the story promo: the scenes, the retimed real recording from record-story.js, the camera,
// the captions and every sound. build-promo-story.js draws each frame from frame() and the audio from soundPlan().
// `rec` is a recording's {events, boxes}: when each step happened (seconds) and where each control was (capture px).
const copy=require('./promo-story-copy');
const duration=25,fps=30,round=t=>+t.toFixed(4);
const scenes=[['hook',0],['brand',3],['demo',5],['cta',20]];

// Output seconds [from, to) play the recording's seconds [rawFrom, rawTo) at a steady speed. The gaps skip waits;
// each piece is placed around the recording's own moments, so any language's timing fits the same story. The edit
// gets the longer slot: typing a sentence takes 1.3-4.5 s in the recordings, depending on the language. Saving is
// cut after the confirm click: the background popup can take seconds to show the saved entry.
// Pieces 1 (the AI's wait), 3 (typing the edit) and 4 (typing the entry name) may run faster than the rest. The filled
// form holds longest, so the badges on the radio buttons, the checkbox and the date picker can be read.
function pieces({events:e}){
 // The filled form holds until just before the edit starts, which can come under 2.2 s after the fill.
 const fill=e.filled-.15,shown=Math.min(fill+2.2,e.editStart-.3),r=e.reopenClick,x=e.restoreClick,saved=Math.max(e.saved-.1,e.confirmClick+.3);
 return[[5,6.6,e.analyzeClick-1.6,e.analyzeClick],[6.6,7.6,e.analyzeClick,fill],[7.6,10.2,fill,shown],[10.2,12,shown,e.editEnd+.3],
  [12,14.8,e.saveClick-.5,e.confirmClick+.3],[14.8,15.2,saved,saved+.4],[15.2,16.4,r-1,r+.8],[16.4,18.6,x-.9,x+1.3],[18.6,20,x+1.3,x+2.7]];
}
function rawTime(rec,t){const all=pieces(rec),p=all.find(([a,b])=>t>=a&&t<b)||(t<all[0][0]?all[0]:all.at(-1));return p[2]+(Math.min(Math.max(t,p[0]),p[1])-p[0])*(p[3]-p[2])/(p[1]-p[0]);}
function outTime(rec,raw){const p=pieces(rec).find(([,,a,b])=>raw>=a&&raw<b);if(!p)throw Error('Recording time outside the story: '+raw);return round(p[0]+(raw-p[2])*(p[1]-p[0])/(p[3]-p[2]));}

// Stage layout (1920x1080 CSS px). The popup capture is 800x1160 px, the form capture 2560x1800 px.
const panes={popup:{x:70,y:170,w:593,h:860,source:800},form:{x:720,y:190,w:1130,h:795,source:2560}};
const toStage=(pane,x,y)=>{const p=panes[pane],k=p.w/p.source;return{x:p.x+x*k,y:p.y+y*k,k};};
// Where the recording's pointer lands on a control: 65% across (35% in right-to-left pages) and 55% down.
const point=(box,rtl)=>({x:box.x+box.w*(rtl?.35:.65),y:box.y+box.h*.55});
const clickNames=[['analyzeClick','popup'],['saveClick','popup'],['confirmClick','popup'],['reopenClick','form'],['restoreClick','popup']];
const clicks=(rec,rtl)=>clickNames.map(([name,pane])=>{const p=point(rec.boxes[name],rtl);return{name,time:outTime(rec,rec.events[name]),...toStage(pane,p.x,p.y)};});

// Camera: [time, scale, centre x, centre y]; it eases between keys and holds when two keys match.
function cameraKeys(rec,rtl){
 const at=name=>clicks(rec,rtl).find(c=>c.name===name),popupX=panes.popup.x+panes.popup.w/2,y=name=>Math.min(820,Math.max(420,at(name).y));
 const wide=[1,960,600],form=[1.22,1285,600],ai=[1.5,popupX,y('analyzeClick')],save=[1.5,popupX,y('saveClick')],restore=[1.5,popupX,y('restoreClick')];
 return[[5,...wide],[5.7,...wide],[6.2,...ai],[6.9,...ai],[7.5,...form],[11.7,...form],[12.2,...save],[15.1,...save],[15.6,...wide],[16.3,...wide],[16.8,...restore],[17.6,...restore],[18.2,...form],[20,...form]];
}
const ease=p=>p<.5?4*p**3:1-(-2*p+2)**3/2,out=p=>1-(1-p)**3,clamp=p=>Math.min(1,Math.max(0,p));
function camera(keys,t){
 const i=keys.findIndex(k=>k[0]>t);if(i<=0){const k=keys[i<0?keys.length-1:0];return{s:k[1],x:k[2],y:k[3]};}
 const [a,s0,x0,y0]=keys[i-1],[b,s1,x1,y1]=keys[i],p=ease((t-a)/(b-a));
 return{s:s0+(s1-s0)*p,x:x0+(x1-x0)*p,y:y0+(y1-y0)*p};
}

// The video's words for one language: `fill` is the extension's own button label, `name` the sample person as
// typed in the hook, `nameLabel` the form label it goes into.
function text(locale,{fill,name,nameLabel}){
 const c=copy[locale];if(!c)throw Error('No story copy for '+locale);
 return{...c,steps:c.steps.map(s=>s.replace('{fill}',fill)),count:n=>c.count.replace('{n}',n),typed:name,field:nameLabel,name:'FormPilot',rtl:locale==='ar'};
}
const stepTimes=[5,7.6,10.2,12,15.2,16.4];
// The hook types the name three times; [start, end] of each round, the field clears between them.
const rounds=[[.35,.95],[1.35,1.85],[2.2,2.65]];
const appear=(t,at,len=.45)=>out(clamp((t-at)/len));
// Badges naming the radio buttons, the checkbox and the date picker, shown one after another once the AI has filled them.
const badgeKinds=['radio','checkbox','date'],badgeTimes=rec=>badgeKinds.map((_,i)=>round(outTime(rec,rec.events.filled)+.3+i*.3)),badgeEnd=10.1;

function frame(t,rec,c){
 // Neighbouring scenes cross-fade over the 0.3 s around each boundary.
 const opacity=Object.fromEntries(scenes.map(([name,s],i)=>{const end=scenes[i+1]?.[1]??duration;return[name,Math.min(s?clamp((t-s+.15)/.3):1,end<duration?clamp((end+.15-t)/.3):1)];}));
 const state={t,opacity};
 if(opacity.hook){
  const r=rounds.findIndex(([a],i)=>t>=a&&(!rounds[i+1]||t<rounds[i+1][0])),[a,b]=rounds[Math.max(0,r)];
  const chars=[...c.typed],shown=r<0?0:t<b+.25?Math.ceil(chars.length*clamp((t-a)/(b-a))):0;
  state.hook={lines:c.hook.map((text,i)=>({text,p:appear(t,.12+i*.55)})),field:c.field,text:chars.slice(0,shown).join(''),caret:Math.floor(t*4)%2===0,count:c.count(3+Math.max(0,r)),countPop:r<0?0:1-clamp((t-a)/.25)};
 }
 if(opacity.brand)state.brand={name:c.name,tagline:c.tagline,logo:appear(t,3.05,.5),line:appear(t,3.55)};
 if(opacity.demo){
  const step=Math.max(0,stepTimes.filter(s=>t>=s).length-1),fields=rec.boxes.fields;
  state.demo={raw:rawTime(rec,t),camera:camera(cameraKeys(rec,c.rtl),t),panes,caption:{text:c.steps[step],p:appear(t,stepTimes[step],.35)},
   ripples:clicks(rec,c.rtl).filter(k=>t>=k.time&&t<k.time+.6).map(k=>{const p=(t-k.time)/.6;return{x:k.x,y:k.y,r:14+46*out(p),o:1-p};}),
   badges:badgeKinds.map((kind,i)=>{const at=badgeTimes(rec)[i],a=rec.boxes.badges[kind],s=toStage('form',a.x,a.y);if(t<at||t>=badgeEnd+.25)return null;return{kind,text:c.kinds[i],x:s.x,y:s.y,align:a.align,p:appear(t,at,.3)*clamp((badgeEnd+.25-t)/.25)};}).filter(Boolean),
   glows:[outTime(rec,rec.events.filled),outTime(rec,rec.events.restored)].flatMap(at=>fields.map((f,i)=>{const p=(t-at-i*.05)/.8;if(p<0||p>1)return null;const s=toStage('form',f.x,f.y);return{x:s.x,y:s.y,w:f.w*s.k,h:f.h*s.k,o:1-p};})).filter(Boolean)};
 }
 if(opacity.cta)state.cta={title:c.title,titleP:appear(t,20.2),chips:c.chips.map((text,i)=>({text,p:appear(t,20.8+i*.2,.35)})),button:c.button,buttonP:appear(t,21.8),note:c.note,noteP:appear(t,22.4)};
 return state;
}

// Captions (WebVTT cues): the same lines the picture shows, timed with it.
function cues(c){
 return[[0,3,c.hook.join(' ')],[3,5,'FormPilot — '+c.tagline],...stepTimes.map((s,i)=>[s,stepTimes[i+1]??20,c.steps[i].replace(/^[①-⑥]\s*/,'')]),[20,duration,c.title+' '+c.note]];
}

// How many interface sounds play: 'full' marks every on-screen event; 'gentle' (the default) the hook's typing,
// the logo, the clicks, the two completions, the three badges, the scene changes and the closing button; 'minimal' drops the typing,
// logo and button; 'none' is music only. 'gentle' and 'minimal' use the soft palette.
const sfxStyles=['gentle','minimal','full','none'];
function soundEvents(rec,c,style='gentle'){
 if(!sfxStyles.includes(style))throw Error('Unknown sound style: '+style);
 if(style==='none')return[];
 const e=[],at=(time,kind,extra)=>e.push({time:round(time),kind,...extra}),chars=[...c.typed],cl=clicks(rec,c.rtl);
 const typing=()=>rounds.forEach(([a,b])=>chars.forEach((ch,i)=>{if(ch.trim())at(a+(b-a)*i/chars.length,'key');}));
 const filled=outTime(rec,rec.events.filled),restored=outTime(rec,rec.events.restored);
 if(style!=='full'){
  if(style==='gentle'){typing();at(3.05,'impact');at(21.8,'success');badgeTimes(rec).forEach((b,i)=>at(b,'pop',{pitch:2+i}));}
  for(const [,s] of scenes.slice(2))at(s-.32,'whoosh');
  for(const k of cl)at(k.time,'click');
  at(filled,'success');at(restored,'success');
 }else{
  typing();rounds.forEach(([a],r)=>{at(a,'pop',{pitch:r});if(r)at(a-.15,'swish');});
  at(.12,'pop',{pitch:1});at(.67,'pop',{pitch:0});at(3,'impact');at(3.05,'sparkle');at(3.55,'pop',{pitch:4});
  for(const [,s] of scenes.slice(2))at(s-.32,'whoosh');
  stepTimes.forEach((s,i)=>at(s,'pop',{pitch:i+2}));
  for(const k of cl)at(k.time,'click');
  at(filled,'success');rec.boxes.fields.forEach((_,i)=>at(filled+i*.05,'check',{pitch:i%9}));
  at(outTime(rec,rec.events.confirmClick)+.1,'ok');at(restored,'success');
  at(20.2,'pop',{pitch:2});[20.8,21,21.2].forEach((s,i)=>at(s,'pop',{pitch:5+i}));at(21.8,'success');
 }
 return e.filter(x=>x.time>=0&&x.time<duration).sort((a,b)=>a.time-b.time||a.kind.localeCompare(b.kind));
}
function soundPlan(rec,c,style='gentle'){
 const parts=[{at:0,chord:'Bm',kind:'calm'},{at:2,chord:'G',kind:'calm'},{at:3,chord:'D',kind:'intro'},
  ...[[5,'D'],[7,'A'],[9,'Bm'],[11,'G'],[13,'D'],[15,'A'],[17,'Bm'],[19,'G']].map(([at,chord])=>({at,chord,kind:'groove'})),
  {at:20,chord:'G',kind:'cta'},{at:21,chord:'A',kind:'cta'},{at:22,chord:'D',kind:'final'}];
 return{duration,scenes:scenes.map(([name,start])=>({name,nominal:start,start})),music:{bpm:120,parts},events:soundEvents(rec,c,style),palette:style==='full'?'bright':'soft'};
}

module.exports={duration,fps,scenes,badgeKinds,badgeTimes,badgeEnd,pieces,rawTime,outTime,panes,toStage,clicks,cameraKeys,camera,text,stepTimes,frame,cues,sfxStyles,soundEvents,soundPlan};
