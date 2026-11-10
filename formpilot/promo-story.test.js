const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const story=require('./promo-story'),copy=require('./promo-story-copy'),{rate,soundtrack}=require('./promo-sound');
const dir=path.join(__dirname,'youtube-assets/story'),locales=Object.keys(copy);
const reports=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>/^promo-.+\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))):[];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rms=(wav,a,b)=>{let s=0,n=0;for(let i=Math.round(a*rate);i<Math.round(b*rate);i++)for(let c=0;c<2;c++){const v=wav.readInt16LE(44+i*4+c*2)/32768;s+=v*v;n++;}return Math.sqrt(s/n);};
const db=x=>20*Math.log10(x);
const words=r=>story.text(r.locale,{fill:r.words.fill,name:r.words.typed,nameLabel:r.words.field});

test('20言語すべての文言がそろい、約束しない表現（3秒・誤入力ゼロ・全フォーム対応）を使わない',()=>{
 assert.equal(locales.length,20);
 for(const [locale,c] of Object.entries(copy)){
  assert.equal(c.form.length,11,locale);assert.equal(c.form[3].length,3,locale);assert.equal(c.hook.length,2,locale);assert.equal(c.chips.length,3,locale);
  assert.equal(c.steps.length,6,locale);assert.ok(c.steps[0].includes('{fill}'),locale);assert.ok(c.count.includes('{n}'),locale);
  assert.ok(c.form[6]!==c.form[7],'修正後の文は元の文と違う: '+locale);
  assert.equal(c.kinds.length,3,locale);assert.ok(c.newsletter&&c.yes,locale);
 }
 const all=JSON.stringify(copy);
 for(const word of ['3秒','３秒','誤入力ゼロ','すべてのフォーム','全フォーム','正確に','3 seconds','100%'])assert.ok(!all.includes(word),word);
});

test('全言語の動画を書き出してある',()=>{assert.deepEqual(reports.map(r=>r.locale).sort(),[...locales].sort());});

for(const r of reports){
 const rec=r.recording,c=words(r);
 test(`${r.locale}: 実録は順に進み、待ち時間だけを早送りする`,()=>{
  const pieces=story.pieces(rec);
  pieces.forEach(([a,b,ra,rb],i)=>{
   assert.ok(b>a&&rb>ra&&ra>=0&&rb<=rec.events.end+1e-6,'piece '+i);
   if(i){assert.equal(a,pieces[i-1][1],'場面の途中に空白を作らない');assert.ok(ra>=pieces[i-1][3]-1e-6,'録画を巻き戻さない '+i);}
   // The AI's own wait (piece 1) may run up to 4x and the typing (pieces 3 and 4) up to 3x; the rest stays within 2.5x.
   const speed=(rb-ra)/(b-a);assert.ok(speed>=.7&&speed<=({1:4,3:3,4:3}[i]||2.5)+1e-9,`piece ${i} speed ${speed.toFixed(2)}`);
  });
  assert.equal(pieces[0][0],5);assert.equal(pieces.at(-1)[1],20);
  for(const name of ['analyzeClick','filled','editStart','saveClick','confirmClick','reopenClick','restoreClick','restored'])assert.equal(story.rawTime(rec,story.outTime(rec,rec.events[name])).toFixed(3),rec.events[name].toFixed(3),name);
 });
 test(`${r.locale}: 実際の拡張で入力・保存・復元し、フォームは送信していない`,()=>{
  assert.equal(rec.aiStatus.state,'done');assert.ok(Object.values(rec.filled).every(Boolean),'AIが全欄を入力');
  assert.equal(rec.filled.gender,'male','ラジオボタン');assert.equal(rec.filled.newsletter,'on','チェックボックス');assert.equal(rec.filled.birthday,'1990-12-31','日付欄（カレンダー）');
  assert.equal(rec.restoredMatchesSaved,true);assert.equal(rec.pageSubmissions,0);
 });
 test(`${r.locale}: クリックの波紋と音は録画の中のクリックと同じ時刻に出て、カメラはその場所を映している`,()=>{
  const events=story.soundEvents(rec,c);
  for(const k of story.clicks(rec,c.rtl)){
   assert.ok(events.some(e=>e.kind==='click'&&Math.abs(e.time-k.time)<1e-3),k.name);
   assert.ok(story.frame(k.time+.1,rec,c).demo.ripples.some(p=>Math.abs(p.x-k.x)<1e-6&&Math.abs(p.y-k.y)<1e-6),k.name);
   const cam=story.camera(story.cameraKeys(rec,c.rtl),k.time),x=960+(k.x-cam.x)*cam.s,y=600+(k.y-cam.y)*cam.s;
   assert.ok(x>40&&x<1880&&y>150&&y<1060,`${k.name} at ${x.toFixed(0)},${y.toFixed(0)}`);
  }
  for(const raw of [rec.events.filled,rec.events.restored])assert.ok(story.frame(story.outTime(rec,raw)+.2,rec,c).demo.glows.length>0,'入力された欄を光らせる');
 });
 test(`${r.locale}: ラジオボタン・チェックボックス・日付欄に、入力後その種類を示すラベルが順に出て、画面内で読める`,()=>{
  const times=story.badgeTimes(rec);
  times.forEach((at,i)=>{
   assert.ok(at>story.outTime(rec,rec.events.filled)&&at<story.badgeEnd-1,'入力後、読む時間を残して出る '+story.badgeKinds[i]);
   const t=story.badgeEnd-.05,b=story.frame(t,rec,c).demo.badges.find(x=>x.kind===story.badgeKinds[i]),cam=story.camera(story.cameraKeys(rec,c.rtl),t);
   assert.ok(b&&b.p>.5&&b.text===c.kinds[i],story.badgeKinds[i]);
   const x=960+(b.x-cam.x)*cam.s,y=600+(b.y-cam.y)*cam.s;assert.ok(x>20&&x<1900&&y>150&&y<1060,`${b.kind} at ${x.toFixed(0)},${y.toFixed(0)}`);
  });
  assert.equal(story.frame(story.badgeEnd+.3,rec,c).demo.badges.length,0);
 });
 test(`${r.locale}: どのコマも何かが映り、場面はクロスフェードでつながる`,()=>{
  for(let n=0;n<story.duration*story.fps;n+=3){const s=story.frame(n/story.fps,rec,c);assert.ok(Object.values(s.opacity).reduce((a,b)=>a+b,0)>=.99,`frame ${n}`);}
 });
 test(`${r.locale}: 音は台本から毎回同じに生成され、書き出した動画と一致する`,()=>{
  const plan=story.soundPlan(rec,c),pcm=soundtrack(plan);assert.ok(pcm.equals(soundtrack(plan)));
  assert.equal(sha(pcm),r.audio.pcmSha256,'台本・文言・音を変えたら node formpilot/build-promo-story.js で書き出し直す');
  assert.deepEqual(r.audio.events,plan.events);assert.equal(r.audio.original,true);assert.equal(r.audio.thirdPartySamples,false);
  assert.ok(Math.abs(r.audio.integratedLufs+16)<.6);assert.ok(r.audio.truePeakDbtp<=-1);
  for(const [name,file] of [['story','promo-story.js'],['copy','promo-story-copy.js'],['sound','promo-sound.js'],['stage','promo-story.html']])assert.equal(r.sourceSha256[name],sha(fs.readFileSync(path.join(__dirname,file))),file+' が書き出し後に変わった');
 });
 test(`${r.locale}: 4K・30fps・25秒のMP4と字幕`,()=>{
  const bytes=fs.readFileSync(path.join(dir,r.file));assert.equal(sha(bytes),r.sha256);assert.equal(bytes.length,r.bytes);
  assert.equal(r.width,3840);assert.equal(r.height,2160);assert.equal(r.fps,'30/1');assert.equal(r.audioCodec,'aac');assert.equal(r.audioChannels,2);assert.ok(Math.abs(r.duration-story.duration)<.1);
  const vtt=fs.readFileSync(path.join(dir,r.captions),'utf8');assert.ok(vtt.startsWith('WEBVTT'));for(const line of c.steps)assert.ok(vtt.includes(line.replace(/^[①-⑥]\s*/,'')));
 });
}

// The gentle style keeps the actions (clicks, completions, the logo) about as loud as the music, and the typing and
// scene changes well under it as texture. Compared with the same mix settings, effects alone against music alone.
test('控えめの効果音: 操作の音は聞き取れ、打鍵と場面転換は背景として小さく鳴る',()=>{
 const r=reports.find(x=>x.locale==='ja')||reports[0];if(!r)return;
 const plan=story.soundPlan(r.recording,words(r)),fx=soundtrack(plan,{music:false,normalize:false}),music=soundtrack(plan,{effects:false,normalize:false});
 const window={key:.04,click:.06,success:.3,whoosh:.6,impact:.5,pop:.2},floor={click:-4,success:-4,impact:-4,pop:-6,key:-11,whoosh:-16},ceiling={key:-4,whoosh:-6};
 for(const e of plan.events){
  const margin=db(rms(fx,e.time,e.time+window[e.kind]))-db(rms(music,e.time,e.time+window[e.kind]));
  assert.ok(margin>floor[e.kind],`${e.kind} ${e.time} is buried: ${margin.toFixed(1)} dB`);
  if(ceiling[e.kind])assert.ok(margin<ceiling[e.kind],`${e.kind} ${e.time} stands out: ${margin.toFixed(1)} dB`);
 }
});
