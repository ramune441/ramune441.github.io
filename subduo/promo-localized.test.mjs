import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
const c={document:{readyState:'loading',addEventListener(){}}};
for(const file of ['i18n-lp.js','store-image-locales.js','promo-locales.js'])vm.runInNewContext(readFileSync(join(root,file),'utf8'),c);
const html=readFileSync(join(root,'promo.html'),'utf8');
const required=[...new Set([...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map(m=>m[1]))];
test('20言語の動画ロケールと既存12言語のIDを重複なく扱う',()=>{
  assert.equal(c.SUBDUO_PROMO.locales.length,20);assert.equal(new Set(c.SUBDUO_PROMO.locales).size,20);
  assert.equal(Object.keys(c.LP_VIDEO_IDS).length,12);
  assert.equal(c.SUBDUO_PROMO.additional.length,8);
  assert.ok(c.SUBDUO_PROMO.additional.every(lang=>!c.LP_VIDEO_IDS[lang]));
});
for(const lang of c.SUBDUO_PROMO.additional)test(`${lang}: 全シーン・字幕・操作ラベルを翻訳する`,()=>{
  const copy=c.SUBDUO_PROMO.copy[lang];
  for(const key of [...required,'pu_lang_b',...Array.from({length:4},(_,i)=>['cue'+(i+1)+'_a','cue'+(i+1)+'_b']).flat()])assert.ok(typeof copy[key]==='string'&&copy[key].trim(),`${lang}/${key}`);
  assert.equal(copy.pu_lang_b,c.SUBDUO_PROMO.names[lang]);
  assert.notEqual(copy.cue1_a,copy.cue1_b);
  assert.ok(copy.feat1_p.includes('TED'));
  assert.ok(!/100%|100 %/.test(copy.safety_lead));
  assert.ok(copy.safety_lead.includes(c.SUBDUO_STORE_EXTRA[lang].c_ask));
});
test('公開済み動画を生成・投稿で上書きしない',()=>{
  const builder=readFileSync(join(root,'build-promo-localized.mjs'),'utf8');
  assert.ok(builder.includes('additional.includes(x)'));
  assert.ok(builder.includes('meta.items[lang]?.videoId'));
  assert.equal(c.SUBDUO_PROMO.duration,39.5);
});
test('生成した動画と字幕のハッシュ・長さ・全シーンを照合する',()=>{
  const metaPath=join(root,'youtube-promo-localized.json');
  if(!existsSync(metaPath))return;
  const meta=JSON.parse(readFileSync(metaPath,'utf8'));
  for(const [lang,item] of Object.entries(meta.items)){
    assert.ok(c.SUBDUO_PROMO.additional.includes(lang));
    assert.equal(item.sha256,createHash('sha256').update(readFileSync(join(root,item.file))).digest('hex'));
    assert.ok(Math.abs(item.duration-39.5)<.06);assert.equal(item.width,3840);assert.equal(item.height,2160);assert.equal(item.audioChannels,2);
    assert.equal(item.madeForKids,false);assert.equal(item.notifySubscribers,false);
    assert.ok([...item.title].length<=100);
    const vtt=readFileSync(join(root,item.captions),'utf8').replace(/\r\n/g,'\n');
    assert.ok(vtt.startsWith('WEBVTT\n'));assert.equal((vtt.match(/ --> /g)||[]).length,9);assert.ok(vtt.includes('00:00:39.500'));
    const capture=JSON.parse(readFileSync(join(root,item.captureFile),'utf8'));
    assert.deepEqual(capture.errors,[]);assert.deepEqual(capture.coverage.missing,[]);assert.deepEqual(capture.states.flatMap(s=>s.overflow),[]);
    assert.deepEqual(capture.states.map(s=>s.scene),['s1','s2','s3','ds','ds','ds','ds','s5','s6']);
  }
});
test('採用台帳の20言語が公開確認済みで、既存IDと追加素材に対応する',()=>{
  const registry=JSON.parse(readFileSync(join(root,'youtube-store-videos.json'),'utf8'));
  const meta=JSON.parse(readFileSync(join(root,'youtube-promo-localized.json'),'utf8'));
  assert.deepEqual(Object.keys(registry.items).sort(),[...c.SUBDUO_PROMO.locales].sort());
  assert.equal(new Set(Object.values(registry.items).map(item=>item.videoId)).size,20);
  for(const [lang,item] of Object.entries(registry.items)){
    assert.match(item.videoId,/^[\w-]{11}$/);assert.equal(item.channel,'Just One More Animal');assert.ok(Number.isFinite(Date.parse(item.publicVerifiedAt)));
    assert.equal(item.url,'https://www.youtube.com/watch?v='+item.videoId);
    if(c.LP_VIDEO_IDS[lang])assert.equal(item.videoId,c.LP_VIDEO_IDS[lang]);
    else {assert.equal(meta.items[lang].videoId,item.videoId);assert.equal(meta.items[lang].sha256,item.sha256);assert.equal(meta.items[lang].captionVerification.cues,9);}
  }
});
