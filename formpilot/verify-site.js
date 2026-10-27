const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const {locales,url}=require('./build-site');
const selected=process.argv.slice(2).filter(lang=>locales.includes(lang)),targets=selected.length?selected:locales;
const root=path.resolve(__dirname,'..'),out=path.join(os.tmpdir(),'formpilot-site-verification');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.xml':'application/xml','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');const bytes=fs.readFileSync(file),range=req.headers.range;if(range){const match=/bytes=(\d+)-(\d*)/.exec(range);if(!match){res.writeHead(416).end();return;}const start=+match[1],end=match[2]?Math.min(+match[2],bytes.length-1):bytes.length-1;res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));}else{res.setHeader('Content-Length',bytes.length);res.end(bytes);}}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const reports=[];
 try{
  for(const locale of targets){
   const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],missing=[],posts=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()===404)missing.push(r.url());});
   await page.setRequestInterception(true);page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());r.url().startsWith(origin)?r.continue():r.abort();});
   for(const width of [1280,390]){
    await page.setViewport({width,height:900});
    for(const kind of ['index.html','guide.html','privacy-policy.html','contact.html']){
     const target=kind==='contact.html'?`/formpilot/contact.html?lang=${locale}`:url(locale,kind);
     await page.goto(origin+target,{waitUntil:'networkidle0'});
     await page.waitForFunction(lang=>document.documentElement.lang===lang,{},locale);
     await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve;})));});
     const state=await page.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,options:document.querySelector('#lang-select').options.length,overflow:document.documentElement.scrollWidth>innerWidth+2,broken:[...document.images].filter(img=>!img.naturalWidth).map(img=>img.src),text:document.body.innerText,desc:document.querySelector('meta[name=description]')?.content}));
     assert.equal(state.options,20,`${locale}/${kind}`);assert.equal(state.dir,locale==='ar'?'rtl':'ltr');assert.equal(state.overflow,false,`${locale}/${kind}/${width}: overflow`);assert.deepEqual(state.broken,[]);
     assert.ok(!/undefined|\{ui:/.test(state.text),`${locale}/${kind}`);
     if(kind==='index.html'||kind==='guide.html'){
      if(width===1280){
       const duration=await page.$eval('video',async video=>{video.muted=true;video.load();if(video.readyState<1)await new Promise((resolve,reject)=>{video.addEventListener('loadedmetadata',resolve,{once:true});video.addEventListener('error',()=>reject(Error('Video decode error')),{once:true});});await video.play();await new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=12;});video.pause();video.textTracks[0].mode='hidden';return video.duration;});
       assert.ok(duration>27&&duration<30);await page.waitForFunction(()=>document.querySelector('track').readyState===2);assert.ok(await page.$eval('video',video=>video.textTracks[0].cues.length>=5));
      }
      const fill=await page.$('[data-demo=fill]');await fill.focus();await page.keyboard.press('Enter');assert.ok((await page.$eval('[data-demo-image]',el=>el.src)).endsWith('/after.png'));
      await page.focus('[data-demo=restore]');await page.keyboard.press('Enter');assert.equal(await page.$eval('[data-demo=restore]',el=>el.getAttribute('aria-pressed')),'true');
      await page.focus('[data-demo=reset]');await page.keyboard.press('Space');assert.ok((await page.$eval('[data-demo-image]',el=>el.src)).endsWith('/before.png'));
      if(kind==='guide.html'){await page.click('.screenshot summary');assert.equal(await page.$eval('.screenshot',el=>el.open),true);}
     }
     if(kind==='privacy-policy.html'&&width===1280){const href=await page.$eval('main a[href*="contact"]',el=>el.href);assert.equal(new URL(href).pathname,'/formpilot/contact.html');await page.goto(href,{waitUntil:'networkidle0'});assert.equal(await page.$eval('html',el=>el.lang),locale);}
     if(['en','ja','ar','zh-Hant','th','bn'].includes(locale)&&kind==='index.html'){await page.screenshot({path:path.join(out,`${locale}-${width}-tutorial.png`)});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,`${locale}-${width}.png`)});}
     reports.push({locale,kind,width,ok:true});
    }
   }
   assert.deepEqual(errors,[],locale);assert.deepEqual(missing,[],locale);assert.deepEqual(posts,[],locale);await context.close();console.log(`PASS ${locale}: PC/mobile, tutorial keyboard, images and no submissions`);
  }
  const page=await browser.newPage();await page.goto(origin+'/formpilot/guide.html?lang=zh-TW&from=installed',{waitUntil:'networkidle0'});assert.ok(page.url().includes('/zh-Hant/guide.html?from=installed'));
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.select('#lang-select','ru')]);assert.equal(await page.$eval('html',el=>el.lang),'ru');assert.ok(page.url().includes('/ru/guide.html'));
  await page.goto(origin+'/formpilot/contact.html?lang=ja',{waitUntil:'networkidle0'});await page.select('#lang-select','bn');assert.equal(await page.$eval('html',el=>el.lang),'bn');assert.equal(await page.$eval('footer a[href*="guide"]',el=>new URL(el.href).pathname),'/formpilot/bn/guide.html');
  await page.goto(origin+'/formpilot/ja/guide.html?lang=en',{waitUntil:'networkidle0'});assert.equal(await page.$eval('html',el=>el.lang),'en');assert.ok(page.url().endsWith('/formpilot/guide.html'));
  fs.writeFileSync(path.join(out,selected.length?'report-selected.json':'report.json'),JSON.stringify({cases:reports.length,reports,routing:true},null,2));console.log(`PASS ${reports.length} page/viewport cases + language routing`);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
