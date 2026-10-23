// Regenerate the Play artwork from the same strings as the Android onboarding.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(await fs.readFile(path.join(here, 'store-listing.json'), 'utf8'));
const languages = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(data.locales);
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({executablePath:chrome, headless:true, args:['--allow-file-access-from-files'], defaultViewport:{width:1200,height:2200,deviceScaleFactor:1}});
const reportPath = path.join(here,'../_probe/kura-store-render.json');
let report = {};
try { report = JSON.parse(await fs.readFile(reportPath,'utf8')); } catch {}
try {
  for (const lang of languages) {
    if (!data.locales[lang]) throw new Error(`Unknown locale: ${lang}`);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(here, 'store-images.html')).href + '?lang=' + lang, {waitUntil:'networkidle0',timeout:60000});
    await page.evaluate(() => window.READY);
    const problems = await page.evaluate(() => {
      const issues = [];
      for (const el of document.querySelectorAll('.cap, #fg .brand, #fg .ft')) {
        const box = el.getBoundingClientRect();
        for (const child of el.children) {
          const rect = child.getBoundingClientRect();
          if (rect.right > box.right + 2 || rect.bottom > box.bottom + 2 || rect.left < box.left - 2) issues.push('Overflow: '+child.textContent);
        }
      }
      if ([...document.images].some(img => !img.complete || !img.naturalWidth)) issues.push('Missing photo');
      return issues;
    });
    if (errors.length || problems.length) throw new Error(`${lang}: ${[...errors,...problems].join('; ')}`);
    const dir = path.join(here,'images/store',lang);
    await fs.mkdir(dir,{recursive:true});
    for (const [selector,name] of [['#fg','store-image-feature.png'],...Array.from({length:5},(_,i)=>['#p'+(i+1),`store-image-${i+1}.png`]),...Array.from({length:5},(_,i)=>['#t'+(i+1),`store-image-tablet-${i+1}.png`])]) {
      await (await page.$(selector)).screenshot({path:path.join(dir,name),omitBackground:false});
    }
    report[lang] = await page.evaluate(() => ({privateTitle:document.querySelector('#p4 h1').textContent,privateText:document.querySelector('#p4 .cap p').textContent,fonts:document.fonts.status}));
    console.log(`${lang}: 11 images verified`);
    await page.close();
  }
  await fs.mkdir(path.join(here,'../_probe'),{recursive:true});
  await fs.writeFile(reportPath,JSON.stringify(report,null,2));
} finally { await browser.close(); }
