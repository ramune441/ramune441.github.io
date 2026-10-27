const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {locales,ui}=require('./build-site'),manifest=require('./media/manifest.json');
test('both video types cover all 20 languages',()=>assert.deepEqual(Object.keys(manifest).sort(),[...locales].sort()));
for(const locale of locales)for(const kind of ['promo','tutorial'])test(`${locale}/${kind}: complete H.264 video, native captions and poster`,()=>{
 const root=path.join(__dirname,'media',locale),data=manifest[locale][kind],bytes=fs.readFileSync(path.join(root,kind+'.mp4')),vtt=fs.readFileSync(path.join(root,kind+'.vtt'),'utf8');
 assert.equal(bytes.subarray(4,8).toString(),'ftyp');assert.equal(bytes.length,data.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),data.sha256);
 assert.equal(data.width,1920);assert.equal(data.height,1080);assert.equal(data.fps,'30/1');assert.ok(Math.abs(data.duration-(kind==='promo'?28.4:28))<.1);
 assert.ok(fs.statSync(path.join(root,kind+'.jpg')).size>10000);assert.ok(vtt.startsWith('WEBVTT\n'));assert.equal((vtt.match(/ --> /g)||[]).length,kind==='promo'?5:6);assert.ok(!/\{\d\}|undefined/.test(vtt));
 if(kind==='tutorial'){assert.ok(vtt.includes(ui[locale].btn_save_form));assert.ok(vtt.includes(ui[locale].btn_restore));}
});
