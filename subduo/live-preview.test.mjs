import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {storyboard,timeline,timelineSha,copy} from './live-plan.mjs';
import {languages,substituted} from './live-i18n.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'previews');
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const rendered=Object.keys(languages).filter(code=>existsSync(join(root,`live-demo-${code}.json`)));

test('どの言語も見出し・注釈の文言がそろい、強調の印が対になっている',()=>{
 const keys=Object.keys(languages.ja).filter(k=>!['ui','html','track','font','dir','substitute','note'].includes(k));
 for(const [code,L] of Object.entries(languages)){
  for(const k of keys)assert.ok(L[k]!==undefined&&L[k]!=='', code+' '+k);
  assert.equal(L.chapters.length,5,code);
  for(const k of keys.filter(k=>Array.isArray(L[k])&&k!=='chapters'))assert.equal((L[k][0].match(/【/g)||[]).length,(L[k][0].match(/】/g)||[]).length,code+' '+k);
  assert.ok(L.wheel.includes('{n}')&&L.original.includes('{lang}'),code);
  if(substituted(code))assert.ok(L.note.includes('{missing}')&&L.note.includes('{shown}'),code);
 }
});

for(const code of rendered){
 const meta=JSON.parse(readFileSync(join(root,`live-demo-${code}.json`))),plan=timeline(storyboard(meta));
 test(`${code}: 実サイトと実拡張の操作が成功し、その言語の字幕とUIで収録されている`,()=>{
  assert.equal(meta.lang,code);assert.equal(meta.ui,languages[code].ui);assert.equal(meta.track,languages[code].track);
  assert.equal(meta.liveSite,true);assert.equal(meta.liveExtension,true);assert.equal(meta.aiRequest,false);
  assert.deepEqual(meta.checks,{twoLanguages:true,drag:true,resize:true,next:true,prev:true,repeat:true,autoPause:true,saved:true,vocabVisible:true});
  for(const clip of meta.clips.filter(c=>c.name!=='vocab')){
   assert.equal(clip.before.error,null);assert.equal(clip.after.error,null);
   // カメラは場面の範囲だけを映す（範囲内に収まることは live-sound.test.mjs で全コマ確かめる）。範囲はプレイヤーの中。
   const B=meta.scenes.find(s=>s.name===clip.name).bounds,v=clip.before.videoBox;
   assert.ok(B.x>=v.x-1&&B.y>=v.y-1&&B.x+B.w<=v.x+v.w+1&&B.y+B.h<=v.y+v.h+1,'映画と実字幕の範囲だけを切り出す');
   assert.ok(clip.before.a&&clip.before.b);assert.ok(clip.wallSeconds>3);
  }
  // 保存した語句のカードは拡張のその言語の表示で、意味も出ている（単語帳に意味と字幕が並ぶ）。
  assert.ok(meta.clips.find(c=>c.name==='word').after.card.includes(meta.messages.cardSaved));
  assert.equal(!!meta.note,substituted(code),'代わりの字幕を使う言語だけ注記する');
 });
 test(`${code}: 配布MP4・字幕の尺とハッシュが一致し、書き出し時の台本と文言が今と同じ`,()=>{
  assert.equal(hash(join(root,meta.file)),meta.sha256);
  assert.equal(meta.width,1920);assert.equal(meta.height,1080);assert.equal(meta.frameRate,'30/1');assert.equal(meta.audioCodec,'aac');assert.equal(meta.audioChannels,2);
  assert.ok(Math.abs(meta.duration-plan.duration)<.1);
  // 今の台本と文言でこの言語のタイムライン（場面・注釈・文言）を組み直し、書き出したときと同じであること。違えば書き出し直す。
  assert.equal(meta.audio.timelineSha256,timelineSha(plan,copy(meta)),'台本か文言の変更でこの言語の映像が変わる。書き出し直す');
  const vtt=readFileSync(join(root,`live-demo-${code}.vtt`),'utf8'),captions=plan.scenes.reduce((n,s)=>n+(s.captions||[]).length,0);
  assert.equal((vtt.match(/ --> /g)||[]).length,captions+2);assert.ok(vtt.includes(new Date(plan.duration*1000).toISOString().slice(11,23)),'字幕は動画の最後まで');
  assert.ok(vtt.includes(languages[code].tag));
  assert.ok(existsSync(join(root,`live-demo-${code}.jpg`)));
 });
}

test('出典・商用編集可能なライセンス・変更点を納品物に残し、プレビューは全言語を切り替えられる',()=>{
 assert.ok(rendered.length>0);
 const meta=JSON.parse(readFileSync(join(root,`live-demo-${rendered[0]}.json`)));
 assert.equal(meta.license.license,'CC BY 3.0');assert.equal(meta.license.creator,'Blender Foundation');assert.ok(meta.license.changes.includes('cropped'));
 assert.equal(meta.license.source,'https://www.youtube.com/watch?v=eRsGyueVLvQ');
 const credits=readFileSync(join(root,'CREDITS.md'),'utf8');assert.ok(credits.includes(meta.license.copyright));assert.ok(credits.includes(meta.license.licenseUrl));assert.ok(credits.includes(meta.license.terms));
 const html=readFileSync(join(root,'index.html'),'utf8');assert.ok(html.includes('noindex'));assert.ok(html.includes('controls'));assert.ok(!html.includes('autoplay'));
 for(const code of rendered)assert.ok(html.includes(`data-lang="${code}"`),code);
});
