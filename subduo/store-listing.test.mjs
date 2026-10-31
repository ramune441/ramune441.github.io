import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const listing=JSON.parse(readFileSync(new URL('./store-listing.json',import.meta.url),'utf8'));
const expected=['en','ja','zh','zh-TW','ko','es','fr','de','pt','hi','id','ar','vi','it','tr','pl','th','nl','ru','bn'];
test('説明本文は対応する20言語すべてを持ち、英語本文のコピーを含まない',()=>{
 assert.deepEqual(Object.keys(listing).filter(k=>k!=='_').sort(),[...expected].sort());
 assert.equal(new Set(expected.map(lang=>listing[lang])).size,20);
 for(const locale of expected){
  const body=listing[locale];assert.ok(body.length>1000&&body.length<=16000,locale);
  if(locale!=='en')assert.ok(!body.includes('Turn what you love to watch into your best language lesson'),locale);
  if(locale!=='en')for(const paragraph of listing.en.split('\n\n').slice(0,3).filter(p=>p.length>80))assert.ok(!body.includes(paragraph),`${locale}: English body fallback`);
  for(const site of ['Prime Video','YouTube','Netflix','Disney+','TED'])assert.ok(body.includes(site),`${locale}: ${site}`);
  for(const fact of ['storage','scripting','sidePanel','116','138','OpenAI','IP'])assert.ok(body.includes(fact),`${locale}: ${fact}`);
  assert.match(body.split('\n').find(line=>line.startsWith('🌏')),/20/,locale);
  assert.match(body,/https:\/\/ramune441\.github\.io\/subduo\/contact\.html(?:\?lang=[\w-]+)?$/,locale);
 }
});
test('追加8言語は本文全体の見出しと母語表記を持つ',()=>{
 const checks={id:['FITUR UTAMA','SITUS YANG DIDUKUNG','PRIVASI','SEBELUM MENGGUNAKAN'],ar:['المزايا الرئيسية','المواقع المدعومة','الخصوصية','قبل الاستخدام'],vi:['TÍNH NĂNG CHÍNH','CÁC TRANG ĐƯỢC HỖ TRỢ','QUYỀN RIÊNG TƯ','TRƯỚC KHI SỬ DỤNG'],tr:['TEMEL ÖZELLİKLER','DESTEKLENEN SİTELER','GİZLİLİK','KULLANMADAN ÖNCE'],pl:['GŁÓWNE FUNKCJE','OBSŁUGIWANE WITRYNY','PRYWATNOŚĆ','PRZED UŻYCIEM'],th:['คุณสมบัติหลัก','เว็บไซต์ที่รองรับ','ความเป็นส่วนตัว','ก่อนใช้งาน'],nl:['BELANGRIJKSTE FUNCTIES','ONDERSTEUNDE SITES','PRIVACY','GOED OM TE WETEN'],bn:['প্রধান সুবিধা','সমর্থিত সাইট','গোপনীয়তা','ব্যবহারের আগে জেনে নিন']};
 for(const [locale,headings] of Object.entries(checks)){
  for(const heading of headings)assert.ok(listing[locale].includes(heading),`${locale}: ${heading}`);
  assert.equal(listing[locale].split('\n').filter(line=>line.startsWith('▶')).length,5,locale);
 }
 for(const [locale,pattern] of Object.entries({ar:/\p{Script=Arabic}/u,th:/\p{Script=Thai}/u,bn:/\p{Script=Bengali}/u}))assert.ok([...listing[locale]].filter(c=>pattern.test(c)).length>500,locale);
});
