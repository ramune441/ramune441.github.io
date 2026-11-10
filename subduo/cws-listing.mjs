// SubDuo's Chrome Web Store listing: per language tab the live demo video (youtube-live.json) and, with --images, the
// five localized screenshots (images/<lang>/); English also fills the all-languages video and screenshots and the
// marquee (the small tile stays). Same store steps as formpilot/cws-videos.js, plus cancelling a pending review and
// uploading the package, which the dashboard locks while an item is under review.
// node subduo/cws-listing.mjs [--read] [--cancel-review] [--package] [--images] [--submit]
// Drives the signed-in store profile started with --remote-debugging-port=9333 (CWS_BROWSER_URL overrides); it opens
// its own tab and closes only that. The script never types credentials.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),ext='C:/Users/Warlo/OneDrive/Documents/MyProduct/SubDuo';
const {default:puppeteer}=await import(pathToFileURL(join(ext,'node_modules/puppeteer/lib/puppeteer/puppeteer.js')));
const item='https://chrome.google.com/webstore/devconsole/86b19d4f-f24f-44ae-9d1d-d2578fe36daf/ngifacacaecobbekalngmocklcgkoigo/edit/';
const liveFile=join(here,'youtube-live.json'),adoptedFile=join(here,'youtube-store-videos.json');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// Store language tabs follow the package's _locales; the site's language codes differ for three of them.
const tabCode={zh:'zh_CN','zh-TW':'zh_TW',pt:'pt_BR'},globalLocale='en';
const locales=['en','ja','zh','zh-TW','ko','es','fr','de','pt','hi','id','ar','vi','it','tr','pl','th','nl','ru','bn'];
const flag=name=>process.argv.includes(name),read=flag('--read'),submit=flag('--submit'),images=flag('--images');
const imageDir=lang=>join(here,'images',lang===globalLocale?'':lang),shots=[1,2,3,4,5].map(n=>`store-image-${n}.png`);
const version=JSON.parse(readFileSync(join(ext,'manifest.json'),'utf8')).version;

const live=JSON.parse(readFileSync(liveFile,'utf8')).items;
const ready=locales.filter(l=>live[l]?.publicVerifiedAt&&live[l]?.watchUrl);
if(submit&&ready.length!==locales.length)throw Error('Not public yet: '+locales.filter(l=>!ready.includes(l)).join(' '));

const browser=await puppeteer.connect({browserURL:process.env.CWS_BROWSER_URL||'http://127.0.0.1:9333',defaultViewport:{width:1600,height:1200},protocolTimeout:300000});
const page=await browser.newPage();
page.on('dialog',dialog=>dialog.accept().catch(()=>{}));
const shot=name=>{const file=join(process.env.LOCALAPPDATA,'subduo-live-preview','cws-'+name+'.png');console.log('screenshot '+file);return page.screenshot({path:file}).catch(()=>{});};
const text=()=>page.evaluate(()=>document.body.innerText);
const click=async handle=>{const b=handle&&await handle.boundingBox();if(b&&b.width)await page.mouse.click(b.x+b.width/2,b.y+b.height/2);else await handle.evaluate(e=>e.click());};
// Buttons and menu items by text across shadow roots.
const button=(pattern,role='')=>page.evaluateHandle((source,role)=>{const re=new RegExp(source);const walk=(node,out=[])=>{for(const e of node.querySelectorAll('*')){if((role?e.getAttribute('role')===role:e.tagName==='BUTTON')&&re.test(e.innerText)&&!e.disabled)out.push(e);if(e.shadowRoot)walk(e.shadowRoot,out);}return out;};return walk(document)[0]||null;},pattern,role).then(h=>h.asElement());
const open=async sub=>{
 await page.goto(item+sub,{waitUntil:'networkidle2',timeout:90000});await page.bringToFront();await sleep(3000);
 // The console often opens on Google's account chooser; picking the signed-in account is enough.
 if(/accounts\.google\.com\/.*accountchooser/.test(page.url())&&await page.evaluate(()=>{const e=[...document.querySelectorAll('[data-identifier],[data-email]')].find(e=>/warload57@gmail\.com/.test(e.getAttribute('data-identifier')||e.getAttribute('data-email')||''));e?.click();return!!e;})){
  await page.waitForNavigation({waitUntil:'networkidle2',timeout:60000}).catch(()=>{});await sleep(3000);
  if(!page.url().startsWith(item+sub))await page.goto(item+sub,{waitUntil:'networkidle2',timeout:90000}),await sleep(3000);
 }
 if(!page.url().startsWith(item)){await shot('signin');throw Error('Signed out: '+page.url().slice(0,80));}
};
const status=async()=>(await text()).match(/ステータス:[^\n]+/)?.[0]||'';
// Uploaded images go into the draft by themselves, so after image-only changes the button may stay disabled; the
// read-back after a reload confirms them.
const save=async(imagesOnly=false)=>{
 let handle=null;for(let i=0;i<(imagesOnly?16:60)&&!handle;i++){handle=await button('下書きとして保存');if(!handle)await sleep(500);}
 if(!handle&&imagesOnly)return;
 if(!handle){await shot('save');throw Error('Save button not found');}
 await click(handle);
 for(let i=0;i<40;i++){await sleep(500);const t=await text();if(/アイテムが保存されました/.test(t))return;if(/保存中にエラー/.test(t)){await shot('save');throw Error('Save failed (sign in again in the Chrome window)');}}
 await shot('save');throw Error('Save was not confirmed');
};
// The review dialog: the confirm button inside a dialog whose text matches.
const dialogButton=(dialogPattern,buttonPattern)=>page.evaluateHandle((d,b)=>{const walk=(node,out=[])=>{for(const e of node.querySelectorAll('*')){if(e.getAttribute('role')==='dialog'&&new RegExp(d).test(e.innerText))out.push(e);if(e.shadowRoot)walk(e.shadowRoot,out);}return out;};const dialog=walk(document).pop();return dialog?[...dialog.querySelectorAll('button')].filter(x=>new RegExp(b).test(x.innerText)&&!x.disabled).pop()||null:null;},dialogPattern,buttonPattern).then(h=>h.asElement());
const dialogText=()=>page.evaluate(()=>{const walk=(node,out=[])=>{for(const e of node.querySelectorAll('*')){if(e.getAttribute('role')==='dialog'&&e.innerText.trim())out.push(e.innerText.replace(/\s+/g,' ').trim());if(e.shadowRoot)walk(e.shadowRoot,out);}return out;};return walk(document).join(' || ');});

try{
 await open('listing');
 console.log(await status());
 if(flag('--cancel-review')&&/審査待ち|審査中/.test(await status())){
  await click(await page.$('>>> button[aria-label="メニュー オプションをさらに表示"]'));await sleep(1200);
  const entry=await button('^\\s*審査をキャンセル\\s*$','menuitem')||await button('^\\s*審査をキャンセル\\s*$');
  if(!entry){await shot('cancel');throw Error('Cancel review menu item not found');}
  await click(entry);await sleep(2000);
  console.log('dialog: '+(await dialogText()).slice(0,300));
  const confirm=await dialogButton('審査','審査をキャンセル|キャンセルする|確認|はい');
  if(!confirm){await shot('cancel');throw Error('Cancel review confirmation not found');}
  await click(confirm);await sleep(5000);
  await open('listing');
  if(/審査待ち|審査中/.test(await status())){await shot('cancel');throw Error('Still under review: '+await status());}
  console.log('Review cancelled: '+await status());
 }
 if(/審査待ち|審査中/.test(await status())&&!read)throw Error('The item is under review. Run with --cancel-review, or wait for it to finish.');

 if(flag('--package')){
  await open('package');
  const draftVersion=()=>page.evaluate(()=>{const t=document.body.innerText,from=t.indexOf('ドラフト');if(from<0)return null;return(t.slice(from,t.indexOf('公開済み',from)).match(/バージョン\s+([\d.]+)/)||[])[1];});
  if(await draftVersion()!==version){
   const zip=join(ext,'SubDuo-'+version+'.zip');if(!existsSync(zip))throw Error('Run npm run zip first: '+zip);
   await click(await button('新しいパッケージをアップロード'));await sleep(2000);
   const input=(await page.$$('>>> input[type=file]'))[0];if(!input){await shot('package');throw Error('Package input not found');}
   await input.uploadFile(zip);await sleep(15000);
   await open('package');
   if(await draftVersion()!==version){await shot('package');throw Error('Draft package is not '+version+': '+await draftVersion());}
  }
  const languages=await page.evaluate(()=>{const t=document.body.innerText,draft=t.slice(t.indexOf('ドラフト'));return((draft.match(/言語\s+([^\n]+)/)||[])[1]||'').split(/,\s*/).length;});
  console.log('package draft '+version+' with '+languages+' languages');
  if(languages!==locales.length)throw Error('Draft package languages: '+languages+', expected '+locales.length);
  await open('listing');
 }

 // Language tabs: a Material dropdown whose options read like 「英語 – en」.
 const combobox=async()=>{for(const handle of await page.$$('>>> [role=combobox]'))if(/言語/.test(await handle.evaluate(e=>e.innerText+(e.getAttribute('aria-label')||''))))return handle;throw Error('Language selector not found');};
 const shown=async()=>(await combobox()).evaluate(e=>e.innerText.replace(/\s+/g,' ').trim());
 const switchTo=async code=>{
  for(let attempt=0;attempt<3;attempt++){
   await click(await combobox());await sleep(1200);
   let target=null;
   for(const option of await page.$$('>>> li[role=option]')){const t=await option.evaluate(e=>e.innerText.trim());if(t.slice(t.lastIndexOf('–')+1).trim().split(/\s/)[0].replace('-','_')===code)target={option,text:t};}
   if(!target)throw Error('Language tab not found: '+code);
   const name=target.text.slice(0,target.text.lastIndexOf('–')).trim();
   if(attempt===0&&(await shown()).includes(name)){await page.keyboard.press('Escape');await sleep(800);return target.text;}
   // A mouse click misses when the window is minimized or covered; fall back to a DOM click.
   if(attempt===0)await click(target.option);else await target.option.evaluate(e=>e.click());
   // Typing before the tab re-renders lands in the previous language's field; confirm the selector shows it.
   for(let i=0;i<10;i++){await sleep(500);if((await shown()).includes(name)){await sleep(2000);return target.text;}}
  }
  throw Error('Could not switch to the language tab: '+code+' (shows '+await shown()+')');
 };
 const videoInputs=()=>page.$$('>>> input[placeholder*="YouTube"]');
 // The fields only register keyboard input.
 const typeInto=async(handle,value)=>{
  if(await handle.evaluate(e=>e.value)===value)return false;
  await handle.click({clickCount:3});
  await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');await page.keyboard.press('Backspace');
  await page.keyboard.type(value);await sleep(500);
  if(await handle.evaluate(e=>e.value)!==value)throw Error('Value did not stick: '+value.slice(0,40));
  return true;
 };
 // Image sections: the file input under a heading such as 「ローカライズ版スクリーンショット」, and the images shown there.
 const section=heading=>page.evaluateHandle(source=>{
  const re=new RegExp(source),inputs=[];const walk=n=>{for(const e of n.querySelectorAll('*')){if(e.tagName==='INPUT'&&e.type==='file')inputs.push(e);if(e.shadowRoot)walk(e.shadowRoot);}};walk(document);
  // The nearest block that starts with the heading and holds only this one file input (an emptied tile has a different
  // inner layout, so the heading can sit a few levels further up).
  for(const input of inputs){let el=input;for(let k=0;k<15&&el;k++){el=el.parentElement||el.getRootNode().host;if(!el)break;
   if(el.querySelectorAll('input[type=file]').length>1)break;if(re.test((el.innerText||'').trim()))return{el,input};}}
  return null;
 },heading);
 const part=async(heading,name)=>{const h=await section(heading);if(!await h.evaluate(x=>!!x))throw Error('Image section not found: '+heading);return(await h.getProperty(name)).asElement();};
 const count=async heading=>(await part(heading,'el')).evaluate(e=>[...e.querySelectorAll('img')].filter(i=>i.getBoundingClientRect().width>20).length);
 const replace=async(heading,files)=>{
  for(let guard=0;guard<8&&await count(heading)>0;guard++){
   let removed=false;
   // The delete control is a div[role=button] labelled 「画像を削除 スクリーンショット N」, shown on hover; a DOM click works.
   for(const b of await (await part(heading,'el')).$$('[role=button], button'))if(/画像を削除/.test(await b.evaluate(e=>e.getAttribute('aria-label')||''))){await b.evaluate(e=>e.click());removed=true;break;}
   if(!removed){await shot('images');throw Error('Delete button not found: '+heading);}
   await sleep(1200);
   // The marquee asks 「この画像を削除してもよろしいですか？」 first.
   const confirm=await dialogButton('この画像を削除','^\\s*削除\\s*$');
   if(confirm){await confirm.evaluate(e=>e.click());await sleep(1500);}
  }
  for(const file of files){
   const before=await count(heading);
   await (await part(heading,'input')).uploadFile(file);
   for(let i=0;i<40&&await count(heading)<=before;i++)await sleep(500);
   if(await count(heading)!==before+1){await shot('images');throw Error('Upload did not show: '+file);}
  }
 };
 const LOCAL='^ローカライズ版スクリーンショット',ALL='^全言語向けスクリーンショット',MARQUEE='^マーキー プロモーション タイル';

 const targets=read?locales:images?locales:ready;
 // --from=<lang> resumes an interrupted run at that language (the read-back below still checks every language).
 const from=(process.argv.find(a=>a.startsWith('--from='))||'').slice(7);
 for(const locale of targets){
  if(from&&targets.indexOf(locale)<targets.indexOf(from))continue;
  const tab=await switchTo(tabCode[locale]||locale),[localized,global]=await videoInputs();
  if(read){console.log(tab+': '+(await localized.evaluate(e=>e.value)||'(none)')+(locale===globalLocale?' / all languages: '+(await global.evaluate(e=>e.value)||'(none)'):'')+', screenshots '+await count(LOCAL));continue;}
  const changes=[];
  if(live[locale]?.publicVerifiedAt){
   const url=live[locale].watchUrl;
   if(await typeInto(localized,url))changes.push('video');
   if(locale===globalLocale&&await typeInto(global,url))changes.push('video for all languages');
  }
  if(images){
   await replace(LOCAL,shots.map(f=>join(imageDir(locale),f)));changes.push('screenshots');
   if(locale===globalLocale){await replace(ALL,shots.map(f=>join(imageDir(locale),f)));await replace(MARQUEE,[join(imageDir(locale),'store-image-marquee.png')]);changes.push('all-language screenshots','marquee');}
  }
  console.log(tab+': '+(changes.join(', ')||'unchanged'));
  if(changes.length)await save(changes.every(c=>/screenshots|marquee/.test(c)));
 }
 if(read)process.exit(0);

 // Read back after a reload: every tab keeps its video and five screenshots.
 await open('listing');
 for(const locale of targets){
  await switchTo(tabCode[locale]||locale);
  const [localized,global]=await videoInputs(),url=live[locale]?.watchUrl;
  if(url&&live[locale].publicVerifiedAt&&(await localized.evaluate(e=>e.value)!==url||(locale===globalLocale&&await global.evaluate(e=>e.value)!==url)))throw Error('Video not saved for '+locale);
  if(images&&await count(LOCAL)!==5)throw Error('Screenshots not saved for '+locale+': '+await count(LOCAL));
  if(images&&locale===globalLocale&&(await count(ALL)!==5||await count(MARQUEE)!==1))throw Error('All-language screenshots or marquee not saved');
 }
 console.log('Verified '+targets.length+' languages after reload');
 const adopted=JSON.parse(readFileSync(adoptedFile,'utf8'));
 for(const locale of targets){const i=live[locale];adopted.items[locale]={videoId:i.videoId,url:i.watchUrl,title:i.title,channel:'Just One More Animal',publicVerifiedAt:i.publicVerifiedAt};}
 adopted.verifiedAt=new Date().toISOString();writeFileSync(adoptedFile,JSON.stringify(adopted,null,2)+'\n');console.log('Recorded the store videos in youtube-store-videos.json');

 if(submit){
  await click(await button('審査のため送信'));await sleep(3000);
  // The confirmation dialog (auto-publish after approval stays checked) has its own submit button.
  const confirm=await dialogButton('審査のために送信しますか','審査のため送信');
  if(!confirm){await shot('submit');throw Error('Submit confirmation dialog not found');}
  await click(confirm);
  let done=false;for(let i=0;i<30&&!done;i++){await sleep(500);done=/審査のために送信されました/.test(await text());}
  if(!done){await shot('submit');throw Error('Submission was not confirmed');}
  console.log('Submitted for review');
 }
}finally{await page.close().catch(()=>{});await browser.disconnect();}
