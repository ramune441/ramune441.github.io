// One timeline drives the picture and the sound: every overlay and sound effect is placed from these entries.
// The storyboard reads the capture (capture-live-preview.mjs): its language, each action's time, pointer position and
// the boxes of the elements it touched. Coordinates are CSS px of the 1920x1080 page; capture frames are `capture.scale`
// times that. `time` maps scene seconds to capture seconds (piecewise linear), so overlays land on the action whatever
// the capture's pace. On-screen text comes from live-i18n.mjs and the extension's own messages saved with the capture.
import {createHash} from 'node:crypto';
import {languages,languageName} from './live-i18n.mjs';
export const fps=30,bpm=120,bar=4*60/bpm;
export const layouts={
 wide:{x:160,y:118,w:1600,h:680,r:26},
 // Footage above the study scene's strip of subtitle lines.
 upper:{x:300,y:150,w:1320,h:562,r:24},
 full:{x:0,y:0,w:1920,h:1080,r:0},
};
export const hookTiming={typeAt:.2,typeEnd:1.1,dropAt:1.3,logoAt:2,tagAt:2.5};
export const ctaTiming={logoAt:.05,tagAt:.5,sitesAt:1,siteStep:.25,buttonAt:2.5,searchAt:3};
export const sites=['YouTube','Netflix','Prime Video','Disney+','TED'];
// SubDuo changes the line size by 5% per wheel notch.
export const wheelStep=1.05;

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,p)=>a+(b-a)*p;
const inout=p=>(p=clamp(p))<.5?4*p*p*p:1-(-2*p+2)**3/2;
const mid=b=>[b.x+b.w/2,b.y+b.h/2];

export function storyboard(capture){
 const lang=capture.lang||'ja',L=languages[lang];if(!L)throw new Error('Unknown language: '+lang);
 const clip=name=>{const c=capture.clips.find(c=>c.name===name);if(!c)throw new Error('No capture for '+name);return c;};
 const events=(name,event)=>clip(name).events.filter(e=>e.name===event);
 const ev=(name,event,i=0)=>{const e=events(name,event)[i];if(!e)throw new Error(`No ${event} in ${name} capture`);return e;};
 // Key labels as the extension shows them, without the "(D)" key hint.
 const message=key=>{const m=capture.messages?.[key];if(!m)throw new Error('No extension message '+key);return m.replace(/\s*[（(][A-Z][)）]\s*$/,'');};
 const v=clip('dual').before.videoBox,player={x:v.x,y:v.y,w:v.w,h:v.h};
 // While the pointer is over the player, YouTube shows its control bar (with the chapter title) in the bottom 60 px.
 const playerAboveControls={...player,h:v.h-62};
 const vocabPage={x:0,y:0,w:1920,h:1080};
 const cap=([title,sub],at)=>[at,title,sub];
 const rtl=L.dir==='rtl';

 const dual=clip('dual').before;
 const drag=ev('position','drag'),dropped=ev('position','dropped'),wheels=events('position','wheel'),grown=ev('position','grown');
 const toast=ev('study','toast').box,saveAt=ev('word','save'),alt=ev('word','alt'),page=ev('vocab','page');
 // The card grows when its meaning arrives, so frame the larger of its size on opening and at saving.
 const opened=ev('word','card').box,full=saveAt.card||opened,x0=Math.min(opened.x,full.x),y0=Math.min(opened.y,full.y);
 const card={x:x0,y:y0,w:Math.max(opened.x+opened.w,full.x+full.w)-x0,h:Math.max(opened.y+opened.h,full.y+full.h)-y0};
 const word=clip('word').before,last=name=>recorded(clip(name));
 // Time maps hang on the recorded actions, since every capture paces them a little differently.
 const line0=ev('dual','line',0).t,line1=ev('dual','line',1).t,dualStart=Math.max(.15,line0-2.6);
 const posStart=Math.max(0,drag.t-.6),wordStart=Math.max(0,alt.t-.95);
 // The line size shown after each notch, in % of the starting size, from the sizes the extension actually applied
 // (a notch can be dropped). Captures without per-notch sizes spread the measured grown and shrunk sizes evenly.
 const px=v=>parseFloat(v),startPx=px(clip('position').before.font),shrunk=ev('position','shrunk');
 const lineSize=wheels.map((w,i)=>{
  if(w.font)return Math.round(100*px(w.font)/startPx);
  const ups=wheels.filter(x=>x.dir==='up').length,[from,to,k,n]=w.dir==='up'?[startPx,px(grown.font),i+1,ups]:[px(grown.font),px(shrunk.font),i+1-ups,wheels.length-ups];
  return Math.round(100*from*(to/from)**(k/n)/startPx);
 });
 // The page can apply the last notch after it was measured; the size then catches up when the turning stops.
 const settle=[[grown,wheels.filter(w=>w.dir==='up').length-1],[shrunk,wheels.length-1]]
  .filter(([mark,i])=>Math.round(100*px(mark.font)/startPx)!==lineSize[i]).map(([mark])=>({at:{raw:mark.t},size:Math.round(100*px(mark.font)/startPx)}));
 // Study: real time up to just after the toast, fast-forward to just before the automatic pause, then the paused
 // picture stays while the line strip explains what happened.
 // D / A move between lines, S repeats, Q switches the stop on (captures from before A was added press only D, S, Q).
 const keys=events('study','key'),keyAt=k=>({raw:keys.find(e=>e.key===k).t}),toastAt=ev('study','toast').t,pausedAt=ev('study','paused').t,studyLength=keys.some(k=>k.key==='A')?9.5:8;
 const keyLabel={A:'navPrev',S:'navRepeat',D:'navNext',Q:'labelAutoPause'};
 const studyStart=Math.max(0,keys[0].t-.8),ffFrom=toastAt+.6,ffTo=Math.max(ffFrom,pausedAt-.35),ffScene=ffFrom-studyStart;
 const ffLength=ffTo>ffFrom?Math.min(ffTo-ffFrom,Math.max(.8,(ffTo-ffFrom)/2.2)):0,fastForward=ffTo-ffFrom>ffLength+.3;
 const studyTime=[[0,studyStart],[ffScene,ffFrom],...(ffLength?[[ffScene+ffLength,ffTo]]:[]),[studyLength,Math.max(ffTo+.5,Math.min(last('study'),ffTo+studyLength-ffScene-ffLength))]];
 // The subtitle lines the keys move between: the one on screen before D, the one D jumps to, and the one after it.
 const study=clip('study'),jumped=study.events.find(e=>e.name==='line'&&e.t>keys[0].t)?.a||study.after.a;
 // Which line sits in the middle of the strip after each D / A (0 is the line on screen before the first key).
 let middle=0;const moves=keys.filter(k=>k.key==='D'||k.key==='A').map(k=>({at:{raw:k.t},index:middle=Math.max(0,middle+(k.key==='D'?1:-1))}));
 const stage=[
  {name:'hook',duration:4,type:word.a,drop:word.b,tag:L.tag},
  // The gap between the two lines (no subtitle on screen) passes quickly.
  {name:'dual',duration:6,chapter:0,bounds:player,time:[[0,dualStart],[2.5,line0-.1],[3,line1-.1],[6,Math.min(last('dual'),line1+2.9)]],
   camera:[[0,'wide',684,352,1336],[.6,'wide',684,352,1336],[1.4,'full',690,424,760],[6,'full',690,440,700]],
   captions:[cap(L.dual1,.25),cap(L.dual2,{raw:line1})],
   overlays:[
    {type:'pin',at:1.45,until:{raw:line0-.12},x:dual.boxA.x+28,y:mid(dual.boxA)[1],label:L.original.replace('{lang}',languageName(lang,'en')),side:'up',tone:'blue'},
    {type:'pin',at:1.7,until:{raw:line0-.12},x:dual.boxB.x+dual.boxB.w-28,y:dual.boxB.y+dual.boxB.h-4,label:languageName(lang,L.track),side:'down',tone:'amber'},
   ]},
  {name:'position',duration:8,chapter:1,bounds:playerAboveControls,time:[[0,posStart],[8,Math.min(last('position'),posStart+8)]],
   // Wide enough that the grown line and the wheel beside it both stay in frame.
   camera:[[0,'full',720,440,880],[{raw:wheels[0].t-.6},'full',720,440,880],[{raw:wheels[0].t},'full',790,400,840],[8,'full',790,400,820]],
   captions:[cap(L.pos1,.25),cap(L.pos2,{raw:wheels[0].t-.35}),cap(L.pos3,{raw:wheels.find(w=>w.dir==='down').t-.25})],
   overlays:[
    {type:'ripple',at:{raw:drag.t},x:drag.x,y:drag.y},
    {type:'arrow',at:{raw:drag.t+.05},until:{raw:wheels[0].t-.5},from:[drag.x+drag.boxA.w/2+18,drag.y+8],to:[dropped.x+drag.boxA.w/2+24,dropped.y]},
    {type:'wheel',at:{raw:wheels[0].t-.3},until:8,x:grown.boxA.x+grown.boxA.w+60,y:mid(grown.boxA)[1],label:L.wheel,notches:wheels.map((w,i)=>({at:{raw:w.t},dir:w.dir,size:lineSize[i]})),...(settle.length&&{settle})},
   ]},
  // The footage shows the whole player (the toast included) above a strip of subtitle lines that spells out each key:
  // D slides the strip to the next line, S sends its play bar back to the start, Q switches on the stop, and the bar
  // reaching its end is the moment the video stops.
  {name:'study',duration:studyLength,chapter:2,bounds:player,time:studyTime,
   camera:[[0,'upper',684,352,1336],[studyLength,'upper',684,352,1336]],
   captions:[cap(L.study1,.25),cap(L.study2,{raw:toastAt})],
   overlays:[
    ...keys.map(k=>({type:'key',at:{raw:k.t},key:k.key,label:message(keyLabel[k.key])})),
    {type:'lines',at:0,lines:[study.before.a,jumped],moves,repeat:keyAt('S'),stop:keyAt('Q'),paused:{raw:pausedAt},
     labels:{next:message('navNext'),...(keys.some(k=>k.key==='A')&&{prev:message('navPrev')}),repeat:message('navRepeat'),stop:message('labelAutoPause'),paused:L.paused}},
    // The 1行ごとに止める toast stays up for about 1.2 s after it is seen; the box leaves before it does.
    {type:'box',at:{raw:toastAt},until:{raw:toastAt+.9},rect:[toast.x,toast.y,toast.x+toast.w,toast.y+toast.h],tone:'amber'},
    ...(fastForward?[{type:'badge',at:ffScene+.05,until:ffScene+ffLength-.05,screen:[960,460],text:'⏩ '+L.ff}]:[]),
   ]},
  {name:'word',duration:6,chapter:3,bounds:playerAboveControls,time:[[0,wordStart],[6,Math.min(last('word'),wordStart+5.8)]],
   // Follows the picked word, then the card that opens beside it.
   camera:[[0,'full',alt.x,alt.y-100,760],[{raw:alt.t+.25},'full',alt.x,alt.y-100,760],[{raw:alt.t+.95},'full',mid(card)[0],mid(card)[1]+15,560],[6,'full',mid(card)[0]+10,mid(card)[1]+10,540]],
   captions:[cap(L.word1,.25),cap(L.word2,{raw:alt.t+.6}),cap(L.word3,{raw:saveAt.t+.1})],
   overlays:[
    {type:'key',at:{raw:alt.t-.2},key:'Alt',label:L.click},
    {type:'ripple',at:{raw:alt.t},x:alt.x,y:alt.y},
    {type:'box',at:{raw:alt.t+.6},until:{raw:saveAt.t-.3},rect:[card.x,card.y,card.x+card.w,card.y+card.h],tone:'blue'},
    {type:'ripple',at:{raw:saveAt.t},x:saveAt.x,y:saveAt.y},
    {type:'stamp',at:{raw:saveAt.t+.12},x:saveAt.box.x+saveAt.box.w+40,y:saveAt.box.y-30,text:L.stamp},
   ]},
  {name:'vocab',duration:4,chapter:4,bounds:vocabPage,time:[[0,0],[4,Math.min(4,last('vocab'))]],captionAt:'bottom',
   camera:[[0,'full',960,300,1300],[.6,'full',960,300,1300],[1.6,'full',960,230,820],[4,'full',960,226,780]],
   captions:[cap(L.vocab1,.25),cap(L.vocab2,2.6)],
   overlays:[
    // The entry's text starts at its leading edge: left, or right on a right-to-left page.
    {type:'pin',at:1.9,until:3.9,x:rtl?page.entry.x+page.entry.w-70:page.entry.x+70,y:page.entry.y+53,label:L.vocabWord,side:rtl?'left':'right',tone:'blue'},
    {type:'pin',at:2.2,until:3.9,x:rtl?page.entry.x+page.entry.w-190:page.entry.x+190,y:page.entry.y+90,label:L.vocabLine,side:rtl?'left':'right',tone:'amber'},
    {type:'box',at:2.7,until:3.9,rect:[page.study.x-2,page.study.y-2,page.study.x+page.study.w+2,page.study.y+page.study.h+2],tone:'blue'},
   ]},
  // The closing card takes up the slack so the video ends on a bar line.
  {name:'cta',duration:6,tag:L.tag,button:L.button,search:L.search},
 ];
 const total=stage.reduce((n,s)=>n+s.duration,0);stage.at(-1).duration+=Math.ceil(total/bar-1e-9)*bar-total;
 // Resolve {raw:t} (capture seconds) into scene seconds.
 for(const scene of stage){
  if(!scene.time)continue;
  const at=v=>v&&typeof v==='object'&&'raw' in v?+sceneTime(scene,v.raw).toFixed(4):v;
  scene.camera=scene.camera.map(([t,...rest])=>[at(t),...rest]);
  scene.captions=scene.captions.map(([t,...rest])=>[at(t),...rest]);
  scene.overlays=scene.overlays.map(o=>({...o,at:at(o.at),until:at(o.until),...(o.notches&&{notches:o.notches.map(n=>({...n,at:at(n.at)}))}),...(o.settle&&{settle:o.settle.map(n=>({...n,at:at(n.at)}))}),...(o.type==='lines'&&{moves:o.moves.map(m=>({...m,at:at(m.at)})),repeat:at(o.repeat),stop:at(o.stop),paused:at(o.paused)})}));
 }
 return stage;
}

// Everything the stage shows besides the scenes: language, font, chapter names, credit and the substitute-track note.
export function copy(capture){
 const lang=capture.lang||'ja',L=languages[lang],colon=/^(ja|zh)/.test(lang)?'：':': ';
 return{lang,html:L.html,dir:L.dir||'ltr',font:L.font,chapters:L.chapters,
  credit:`${L.credit}${colon}Sintel © copyright Blender Foundation | durian.blender.org · CC BY 3.0`,
  note:L.substitute?L.note.replace('{missing}',languageName(lang,L.html)).replace('{shown}',languageName(lang,L.track)):null};
}

export function timeline(scenes){
 let start=0;
 const result=scenes.map(scene=>{
  const item={...scene,start};
  if(scene.time){
   const t=scene.time;
   if(t[0][0]!==0||t.at(-1)[0]!==scene.duration||t.some((p,i)=>i&&!(p[0]>t[i-1][0]&&p[1]>=t[i-1][1])))throw new Error('Invalid time map: '+scene.name);
   for(const [at,layout] of scene.camera)if(!layouts[layout]||!(at>=0&&at<=scene.duration))throw new Error('Invalid camera: '+scene.name);
   for(const o of scene.overlays)if(!(o.at>=0&&o.at<scene.duration&&(o.until===undefined||o.until>o.at&&o.until<=scene.duration)))throw new Error('Invalid overlay: '+scene.name+' '+o.type);
   for(const [at] of scene.captions)if(!(at>=0&&at<scene.duration))throw new Error('Invalid caption: '+scene.name);
  }
  start+=scene.duration;return item;
 });
 // Whole bars, so the closing chord lands on a downbeat.
 if(start%bar)throw new Error('Video must end on a bar line');
 return{scenes:result,duration:start,frames:start*fps};
}

// Fingerprint of what a language's video shows; the build records it and the tests rebuild it from the capture.
export const timelineSha=(plan,text)=>createHash('sha256').update(JSON.stringify({scenes:plan.scenes,copy:text})).digest('hex');

// Capture seconds the clip covers: from its first frame to the end of the recorded action (the screen may be still at the end).
export const recorded=clip=>clip.events.find(e=>e.name==='start').t+clip.wallSeconds;

// Capture seconds for a scene time, and back.
export function rawTime(scene,t){
 const map=scene.time;let i=1;while(i<map.length-1&&t>map[i][0])i++;
 const [a,ra]=map[i-1],[b,rb]=map[i];return ra+(rb-ra)*clamp((t-a)/(b-a));
}
export function sceneTime(scene,raw){
 const map=scene.time;let i=1;while(i<map.length-1&&raw>map[i][1])i++;
 const [a,ra]=map[i-1],[b,rb]=map[i];return a+(b-a)*clamp((raw-ra)/(rb-ra));
}

// Source rect `s` (CSS px of the capture) drawn into screen rect `d`. Eased between keyframes and clamped to the scene's
// bounds, so the camera never shows the site's chrome or other videos' thumbnails beside the player.
export function camera(scene,t){
 const k=scene.camera;let i=0;while(i<k.length-1&&t>=k[i+1][0])i++;
 const a=k[i],b=k[Math.min(i+1,k.length-1)],p=b===a?0:inout((t-a[0])/(b[0]-a[0]));
 const la=layouts[a[1]],lb=layouts[b[1]],d={};for(const key of ['x','y','w','h','r'])d[key]=lerp(la[key],lb[key],p);
 let sw=lerp(a[4],b[4],p),sh=sw*d.h/d.w;const B=scene.bounds,fit=Math.min(1,B.w/sw,B.h/sh);sw*=fit;sh*=fit;
 const cx=clamp(lerp(a[2],b[2],p),B.x+sw/2,B.x+B.w-sw/2),cy=clamp(lerp(a[3],b[3],p),B.y+sh/2,B.y+B.h-sh/2);
 // A short punch-in on every press and click (and the first notch of each wheel turn); it enlarges the picture, never the source rect.
 let punch=0;
 const hit=at=>{if(t>=at)punch+=.045*Math.exp(-(t-at)/.11);};
 for(const o of scene.overlays){
  if(['key','ripple','stamp'].includes(o.type))hit(o.at);
  if(o.type==='wheel')o.notches.forEach((n,i)=>{if(!i||n.dir!==o.notches[i-1].dir)hit(n.at);});
 }
 const g=1+punch;d.x-=d.w*(g-1)/2;d.y-=d.h*(g-1)/2;d.w*=g;d.h*=g;
 return{d,s:{x:cx-sw/2,y:cy-sh/2,w:sw,h:sh}};
}

// Everything the stage needs to draw output frame n.
export function frameState(plan,n){
 const T=n/fps,scene=plan.scenes.find(s=>T>=s.start&&T<s.start+s.duration)||plan.scenes.at(-1),t=T-scene.start;
 return scene.time?{T,raw:rawTime(scene,t),cam:camera(scene,t)}:{T};
}

// Sound effects follow the timeline, so they always land on what the picture shows.
export function soundEvents(plan){
 const events=[];
 for(const scene of plan.scenes){
  const at=t=>+(scene.start+t).toFixed(4);
  if(scene.start)events.push({time:at(-.32),kind:'whoosh'});
  if(scene.name==='hook'){
   const H=hookTiming,chars=scene.type.length;
   for(let i=0;i<chars;i++)if(scene.type[i]!==' ')events.push({time:at(H.typeAt+(H.typeEnd-H.typeAt)*i/chars),kind:'tick'});
   events.push({time:at(H.dropAt),kind:'pop',pitch:1},{time:at(H.logoAt),kind:'impact'},{time:at(H.tagAt),kind:'pop',pitch:2},{time:at(3),kind:'riser',length:1});
  }
  if(scene.name==='cta'){
   const C=ctaTiming;
   events.push({time:at(C.tagAt),kind:'pop',pitch:1});
   sites.forEach((_,i)=>events.push({time:at(C.sitesAt+i*C.siteStep),kind:'pop',pitch:2+i}));
   events.push({time:at(C.buttonAt),kind:'success'});
  }
  for(const o of scene.overlays||[]){
   if(o.type==='pin')events.push({time:at(o.at),kind:'pop',pitch:o.tone==='amber'?2:1});
   if(o.type==='ripple')events.push({time:at(o.at),kind:'click'});
   if(o.type==='arrow')events.push({time:at(o.at),kind:'swish'});
   if(o.type==='key')events.push({time:at(o.at),kind:'key'});
   // One tick per notch, rising while it grows and falling while it shrinks.
   if(o.type==='wheel'){let size=0;for(const n of o.notches){size+=n.dir==='up'?1:-1;events.push({time:at(n.at),kind:'notch',pitch:size});}}
   if(o.type==='stamp')events.push({time:at(o.at),kind:'success'});
   if(o.type==='box')events.push({time:at(o.at),kind:'pop',pitch:0});
   if(o.type==='badge')events.push({time:at(o.at),kind:'pop',pitch:o.tone==='amber'?3:0});
   // The line strip's keys already sound; it adds a note when the play bar reaches the end and the video stops.
   if(o.type==='lines')events.push({time:at(o.paused),kind:'pop',pitch:4});
  }
 }
 return events.sort((a,b)=>a.time-b.time);
}
