// SubDuo LP を 20 言語ぶん生成する。
//   入力: subduo/lp-template.html（ページの形）、subduo/lp-i18n/<lang>.json（文言）、
//         subduo/youtube-store-videos.json（言語別の紹介動画）、拡張の manifest.json（版）
//   出力: subduo/index.html（英語）、subduo/<lang>/index.html（ほか 19 言語）
//         --sitemap を付けたときだけ sitemap.xml の SubDuo LP 部分（subduo-lp の印の間）も書き直す
// 使い方: node subduo/build-lp.mjs [--sitemap]（Node だけで動く）。文言や形を直したら実行して、生成物ごとコミットする。
// 拡張の場所は SUBDUO_EXT（既定はこのリポジトリと同じ階層の SubDuo）。無ければ生成済みページの版を引き継ぐ。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://ramune441.github.io';
const BASE_URL = `${SITE}/subduo/`;
export const STORE = 'https://chromewebstore.google.com/detail/ngifacacaecobbekalngmocklcgkoigo';
export const EXT_DIR = process.env.SUBDUO_EXT || path.join(here, '../../SubDuo');

// フォルダ名, 表示名, hreflang/lang 属性, og:locale, ウェブストアの hl, Google Fonts（その文字の Noto。ラテン・キリル文字は Inter）
export const LANGS = [
  ['en', 'English', 'en', 'en_US', 'en', null],
  ['ja', '日本語', 'ja', 'ja_JP', 'ja', 'Noto+Sans+JP'],
  ['zh', '简体中文', 'zh-Hans', 'zh_CN', 'zh-CN', 'Noto+Sans+SC'],
  ['zh-TW', '繁體中文', 'zh-TW', 'zh_TW', 'zh-TW', 'Noto+Sans+TC'],
  ['ko', '한국어', 'ko', 'ko_KR', 'ko', 'Noto+Sans+KR'],
  ['es', 'Español', 'es', 'es_ES', 'es', null],
  ['fr', 'Français', 'fr', 'fr_FR', 'fr', null],
  ['de', 'Deutsch', 'de', 'de_DE', 'de', null],
  ['pt', 'Português', 'pt-BR', 'pt_BR', 'pt-BR', null],
  ['hi', 'हिन्दी', 'hi', 'hi_IN', 'hi', 'Noto+Sans+Devanagari'],
  ['id', 'Bahasa Indonesia', 'id', 'id_ID', 'id', null],
  ['ar', 'العربية', 'ar', 'ar_AR', 'ar', 'Noto+Sans+Arabic'],
  ['it', 'Italiano', 'it', 'it_IT', 'it', null],
  ['nl', 'Nederlands', 'nl', 'nl_NL', 'nl', null],
  ['pl', 'Polski', 'pl', 'pl_PL', 'pl', null],
  ['ru', 'Русский', 'ru', 'ru_RU', 'ru', null],
  ['tr', 'Türkçe', 'tr', 'tr_TR', 'tr', null],
  ['vi', 'Tiếng Việt', 'vi', 'vi_VN', 'vi', null],
  ['th', 'ไทย', 'th', 'th_TH', 'th', 'Noto+Sans+Thai'],
  ['bn', 'বাংলা', 'bn', 'bn_BD', 'bn', 'Noto+Sans+Bengali'],
].map(([code, name, hreflang, ogLocale, hl, font]) => ({code, name, hreflang, ogLocale, hl, font}));

// 値に HTML を持てるキー（使えるのは <br>・<b>・span.accent / span.highlight だけ）
export const HTML_KEYS = ['hero_h1', 'problem_p', 'note1', 'note2', 'note3', 'note4', 'note5'];
const ALLOWED_TAG = /<(?!br>|b>|\/b>|span class="(accent|highlight)">|\/span>)/;
export const FAQ_COUNT = 8;
export const FEATURE_COUNT = 9;

export const pageUrl = code => BASE_URL + (code === 'en' ? '' : code + '/');
export const storeUrl = lang => `${STORE}?hl=${lang.hl}&utm_source=subduo-lp&utm_medium=web&utm_campaign=${lang.code}`;
const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const indentJson = obj => JSON.stringify(obj, null, 2).replace(/^/gm, '  ');
// 改行と連続する空白だけを詰める（フランス語の約物の前の改行しない空白は残す）
export const plain = s => String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/[ \t\r\n]+/g, ' ').trim();

export function loadDicts() {
  const en = JSON.parse(fs.readFileSync(path.join(here, 'lp-i18n/en.json'), 'utf8'));
  const keys = Object.keys(en);
  const dicts = {};
  for (const {code} of LANGS) {
    const d = JSON.parse(fs.readFileSync(path.join(here, `lp-i18n/${code}.json`), 'utf8'));
    const missing = keys.filter(k => typeof d[k] !== 'string' || !d[k].trim());
    const extra = Object.keys(d).filter(k => !keys.includes(k));
    if (missing.length || extra.length) throw new Error(`${code}: missing ${missing.join(',')} extra ${extra.join(',')}`);
    for (const [k, v] of Object.entries(d)) {
      if (HTML_KEYS.includes(k) ? ALLOWED_TAG.test(v) : /[<>]/.test(v)) throw new Error(`${code}.${k}: HTML not allowed here`);
    }
    dicts[code] = d;
  }
  return dicts;
}

// 紹介動画はストアの動画欄と同じ採用台帳から取る。公開を確認できていない言語は英語の動画にする
export function videoIds() {
  const ledger = JSON.parse(fs.readFileSync(path.join(here, 'youtube-store-videos.json'), 'utf8')).items;
  const ok = item => item && /^[\w-]{11}$/.test(item.videoId) && Number.isFinite(Date.parse(item.publicVerifiedAt));
  if (!ok(ledger.en)) throw new Error('youtube-store-videos.json: no public English video');
  return Object.fromEntries(LANGS.map(({code}) => [code, (ok(ledger[code]) ? ledger[code] : ledger.en).videoId]));
}

// 版は拡張の manifest から。拡張が無い環境では生成済みの英語ページの値を引き継ぐ
export function softwareVersion() {
  const manifest = path.join(EXT_DIR, 'manifest.json');
  if (fs.existsSync(manifest)) return JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
  const page = path.join(here, 'index.html');
  const m = fs.existsSync(page) && fs.readFileSync(page, 'utf8').match(/"softwareVersion": "([\d.]+)"/);
  if (!m) throw new Error(`SubDuo manifest not found at ${manifest} (set SUBDUO_EXT)`);
  return m[1];
}

// その言語のストア画像（無ければ英語）
export function imageDir(code) {
  return code !== 'en' && fs.existsSync(path.join(here, 'images', code, 'store-image-1.png')) ? `images/${code}/` : 'images/';
}

function assetVersion() {
  const h = crypto.createHash('sha256');
  for (const f of ['lp.css', 'lp.js']) h.update(fs.readFileSync(path.join(here, f)));
  return h.digest('hex').slice(0, 8);
}

export function jsonLd(lang, d, version) {
  const img = imageDir(lang.code);
  const app = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'SubDuo',
    alternateName: 'SubDuo — Dual Subtitles for Streaming', description: d.seo_desc,
    url: pageUrl(lang.code), inLanguage: lang.hreflang,
    applicationCategory: 'BrowserApplication', applicationSubCategory: 'Language learning',
    operatingSystem: 'Chrome', browserRequirements: 'Requires Google Chrome 116 or later (desktop)',
    softwareVersion: version, installUrl: STORE, sameAs: [STORE],
    image: `${BASE_URL}${img}store-image-1.png`,
    screenshot: [1, 2, 3, 4, 5].map(i => `${BASE_URL}${img}store-image-${i}.png`),
    featureList: Array.from({length: FEATURE_COUNT}, (_, i) => d[`feat${i + 1}_h3`]),
    offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
    author: {'@type': 'Person', name: 'Ramune', url: `${SITE}/`},
  };
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang.hreflang,
    mainEntity: Array.from({length: FAQ_COUNT}, (_, i) => ({'@type': 'Question', name: plain(d[`faq${i + 1}_q`]),
      acceptedAnswer: {'@type': 'Answer', text: plain(d[`faq${i + 1}_a`])}})),
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Ramune Apps', item: `${SITE}/`},
      {'@type': 'ListItem', position: 2, name: 'SubDuo', item: pageUrl(lang.code)},
    ],
  };
  // </script> を値に含めても閉じないように < を逃がす
  return [app, faq, crumbs].map(o => `  <script type="application/ld+json">\n${indentJson(o).replace(/</g, '\\u003c')}\n  </script>`).join('\n');
}

function faqHtml(d) {
  return Array.from({length: FAQ_COUNT}, (_, i) => `        <div class="faq-item">
          <button class="faq-q" aria-expanded="false"><span>${escapeHtml(d[`faq${i + 1}_q`])}</span></button>
          <div class="faq-a"><div class="faq-a-inner">${escapeHtml(d[`faq${i + 1}_a`])}</div></div>
        </div>`).join('\n');
}

export function render(lang, d, video, version) {
  const template = fs.readFileSync(path.join(here, 'lp-template.html'), 'utf8');
  const base = lang.code === 'en' ? '' : '../';
  const hreflang = [...LANGS.map(l => `  <link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code)}">`),
    `  <link rel="alternate" hreflang="x-default" href="${pageUrl('en')}">`].join('\n');
  const options = LANGS.map(l => `<option value="${l.code}"${l.code === lang.code ? ' selected' : ''}>${l.name}</option>`).join('');
  const fonts = ['Inter', ...(lang.font ? [lang.font] : [])];
  const cues = [1, 2, 3, 4].map(i => [d[`cue${i}_a`], d[`cue${i}_b`]]);
  const vars = {
    lang: lang.code, htmlLang: lang.hreflang, dir: lang.code === 'ar' ? 'rtl' : 'ltr', base, self: './', url: pageUrl(lang.code),
    ogLocale: lang.ogLocale, ogImage: `${BASE_URL}${imageDir(lang.code)}store-image-1.png`, hreflang,
    jsonld: jsonLd(lang, d, version), langOptions: options, faq: faqHtml(d),
    store: escapeHtml(storeUrl(lang)), img: base + imageDir(lang.code),
    video: `https://www.youtube-nocookie.com/embed/${video}?rel=0&amp;hl=${lang.hl}`,
    privacy: `${base}privacy-policy.html?lang=${lang.code}`,
    contact: `${base}contact.html?lang=${lang.code}`,
    cues: escapeHtml(JSON.stringify(cues)), assetVersion: assetVersion(),
    fontQuery: fonts.map(f => `family=${f}:wght@400;500;600;700;800;900`).join('&amp;'),
    fontFamily: fonts.map(f => `'${f.replace(/\+/g, ' ')}'`).join(', '),
  };
  const out = template
    .replace(/\{\{\{(\w+)\}\}\}/g, (m, k) => { if (!HTML_KEYS.includes(k)) throw new Error(`${k} is not an HTML key`); return d[k]; })
    .replace(/\{\{@(\w+)\}\}/g, (m, k) => { if (!(k in vars)) throw new Error(`unknown variable ${k}`); return vars[k]; })
    .replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in d)) throw new Error(`${lang.code}: no text for ${k}`); return escapeHtml(d[k]); });
  if (/\{\{/.test(out)) throw new Error(`${lang.code}: placeholder left`);
  return out;
}

export function sitemapBlock(lastmod) {
  const alternates = [...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en')}"/>`].join('\n');
  return LANGS.map(l => `  <url>\n    <loc>${pageUrl(l.code)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${l.code === 'en' ? '0.9' : '0.8'}</priority>\n${alternates}\n  </url>`).join('\n');
}

export const outputPath = code => path.join(here, code === 'en' ? 'index.html' : `${code}/index.html`);

function writeSitemap(changed) {
  const file = path.join(here, '../sitemap.xml');
  const raw = fs.readFileSync(file, 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const sitemap = raw.replace(/\r\n/g, '\n');
  const START = '  <!-- subduo-lp:start（subduo/build-lp.mjs が生成） -->', END = '  <!-- subduo-lp:end -->';
  const old = sitemap.includes(START) ? sitemap.slice(sitemap.indexOf(START), sitemap.indexOf(END) + END.length) : null;
  // lastmod はページが変わったときだけ今日にする
  const lastmod = (!changed && old && old.match(/<lastmod>([\d-]+)<\/lastmod>/)?.[1]) || new Date().toISOString().slice(0, 10);
  const block = `${START}\n${sitemapBlock(lastmod)}\n${END}`;
  let next;
  if (old) next = sitemap.replace(old, () => block);
  else {
    // 初回: 既存の /subduo/ の <url> を差し替える
    const single = /  <url>\n    <loc>https:\/\/ramune441\.github\.io\/subduo\/<\/loc>[\s\S]*?<\/url>/;
    if (!single.test(sitemap)) throw new Error('sitemap: SubDuo LP entry not found');
    next = sitemap.replace(single, () => block);
  }
  next = next.replace(/\n/g, nl);
  if (next !== raw) { fs.writeFileSync(file, next); console.log('wrote sitemap.xml'); }
}

function main() {
  const dicts = loadDicts();
  const videos = videoIds();
  const version = softwareVersion();
  let changed = false;
  for (const lang of LANGS) {
    const file = outputPath(lang.code);
    const html = render(lang, dicts[lang.code], videos[lang.code], version);
    const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (before !== html) {
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, html);
      changed = true;
      console.log('wrote', path.relative(here, file));
    }
  }
  if (process.argv.includes('--sitemap')) writeSitemap(changed);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
