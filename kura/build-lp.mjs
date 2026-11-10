// Kura LP を 20 言語ぶん生成する。
//   入力: kura/lp-template.html（ページの形）、kura/lp-i18n/<lang>.json（文言）、kura/store-listing.json（言語別の紹介動画）
//   出力: kura/index.html（英語）、kura/<lang>/index.html（ほか 19 言語）、sitemap.xml の Kura LP 部分
// 使い方: node kura/build-lp.mjs（Node だけで動く）。文言や形を直したら実行して、生成物ごとコミットする。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://ramune441.github.io';
const BASE_URL = `${SITE}/kura/`;
const PLAY = 'https://play.google.com/store/apps/details?id=app.kura.photos';

// フォルダ名, 表示名, hreflang/lang 属性, og:locale, Play の hl, Google Fonts（その文字の Noto）
export const LANGS = [
  ['en', 'English', 'en', 'en_US', 'en', 'Noto+Sans'],
  ['ja', '日本語', 'ja', 'ja_JP', 'ja', 'Noto+Sans+JP'],
  ['zh', '简体中文', 'zh-Hans', 'zh_CN', 'zh-CN', 'Noto+Sans+SC'],
  ['zh-TW', '繁體中文', 'zh-TW', 'zh_TW', 'zh-TW', 'Noto+Sans+TC'],
  ['ko', '한국어', 'ko', 'ko_KR', 'ko', 'Noto+Sans+KR'],
  ['es', 'Español', 'es', 'es_ES', 'es', 'Noto+Sans'],
  ['fr', 'Français', 'fr', 'fr_FR', 'fr', 'Noto+Sans'],
  ['de', 'Deutsch', 'de', 'de_DE', 'de', 'Noto+Sans'],
  ['pt', 'Português', 'pt-BR', 'pt_BR', 'pt-BR', 'Noto+Sans'],
  ['it', 'Italiano', 'it', 'it_IT', 'it', 'Noto+Sans'],
  ['ru', 'Русский', 'ru', 'ru_RU', 'ru', 'Noto+Sans'],
  ['id', 'Bahasa Indonesia', 'id', 'id_ID', 'id', 'Noto+Sans'],
  ['hi', 'हिन्दी', 'hi', 'hi_IN', 'hi', 'Noto+Sans+Devanagari'],
  ['tr', 'Türkçe', 'tr', 'tr_TR', 'tr', 'Noto+Sans'],
  ['vi', 'Tiếng Việt', 'vi', 'vi_VN', 'vi', 'Noto+Sans'],
  ['th', 'ไทย', 'th', 'th_TH', 'th', 'Noto+Sans+Thai'],
  ['pl', 'Polski', 'pl', 'pl_PL', 'pl', 'Noto+Sans'],
  ['ar', 'العربية', 'ar', 'ar_AR', 'ar', 'Noto+Sans+Arabic'],
  ['nl', 'Nederlands', 'nl', 'nl_NL', 'nl', 'Noto+Sans'],
  ['bn', 'বাংলা', 'bn', 'bn_BD', 'bn', 'Noto+Sans+Bengali'],
].map(([code, name, hreflang, ogLocale, hl, font]) => ({code, name, hreflang, ogLocale, hl, font}));

// 値に HTML を持てるキー（使えるのは <br> と span.accent / span.highlight だけ）
export const HTML_KEYS = ['hero_h1', 'problem_p', 's1_h3', 's2_h3', 's3_h3', 's4_h3', 's5_h3', 's6_h3', 'cta_h2'];
const ALLOWED_TAG = /<(?!br>|span class="(accent|highlight)">|\/span>)/;

export const pageUrl = code => BASE_URL + (code === 'en' ? '' : code + '/');
const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const indentJson = obj => JSON.stringify(obj, null, 2).replace(/^/gm, '  ');

export function loadDicts() {
  const en = JSON.parse(fs.readFileSync(path.join(here, 'lp-i18n/en.json'), 'utf8'));
  const keys = Object.keys(en);
  const dicts = {};
  for (const {code} of LANGS) {
    const d = JSON.parse(fs.readFileSync(path.join(here, `lp-i18n/${code}.json`), 'utf8'));
    const missing = keys.filter(k => !d[k] || !String(d[k]).trim());
    const extra = Object.keys(d).filter(k => !keys.includes(k));
    if (missing.length || extra.length) throw new Error(`${code}: missing ${missing.join(',')} extra ${extra.join(',')}`);
    for (const [k, v] of Object.entries(d)) {
      if (HTML_KEYS.includes(k) ? ALLOWED_TAG.test(v) : /[<>]/.test(v)) throw new Error(`${code}.${k}: HTML not allowed here`);
    }
    dicts[code] = d;
  }
  return dicts;
}

export function videoIds() {
  const listing = JSON.parse(fs.readFileSync(path.join(here, 'store-listing.json'), 'utf8'));
  return Object.fromEntries(LANGS.map(({code}) => [code, new URL(listing.locales[code].listing.video).searchParams.get('v')]));
}

function jsonLd(lang, d) {
  const app = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Kura', description: d.og_desc,
    applicationCategory: 'MultimediaApplication', operatingSystem: 'Android 11+', inLanguage: lang.hreflang,
    url: pageUrl(lang.code), installUrl: PLAY, image: `${BASE_URL}images/store/${lang.code}/store-image-feature.png`,
    offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
    author: {'@type': 'Person', name: 'Ramune', url: `${SITE}/`},
  };
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang.hreflang,
    mainEntity: [1, 2, 3, 4, 5, 6].map(i => ({'@type': 'Question', name: d[`faq${i}_q`], acceptedAnswer: {'@type': 'Answer', text: d[`faq${i}_a`]}})),
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Ramune Apps', item: `${SITE}/`},
      {'@type': 'ListItem', position: 2, name: 'Kura', item: pageUrl(lang.code)},
    ],
  };
  // </script> を値に含めても閉じないように < を逃がす
  return [app, faq, crumbs].map(o => `  <script type="application/ld+json">\n${indentJson(o).replace(/</g, '\\u003c')}\n  </script>`).join('\n');
}

export function render(lang, d, video) {
  const template = fs.readFileSync(path.join(here, 'lp-template.html'), 'utf8');
  const base = lang.code === 'en' ? '' : '../';
  const hreflang = [...LANGS.map(l => `  <link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code)}">`),
    `  <link rel="alternate" hreflang="x-default" href="${pageUrl('en')}">`].join('\n');
  const options = LANGS.map(l => `<option value="${l.code}"${l.code === lang.code ? ' selected' : ''}>${l.name}</option>`).join('');
  const fonts = lang.font === 'Noto+Sans' ? ['Noto+Sans'] : [lang.font, 'Noto+Sans'];
  const vars = {
    lang: lang.code, htmlLang: lang.hreflang, dir: lang.code === 'ar' ? 'rtl' : 'ltr', base, url: pageUrl(lang.code),
    ogLocale: lang.ogLocale, hreflang, jsonld: jsonLd(lang, d), langOptions: options,
    play: `${PLAY}&amp;hl=${lang.hl}`, video: `https://www.youtube-nocookie.com/embed/${video}?rel=0&amp;hl=${lang.hl}`,
    ppLang: lang.code === 'ja' ? 'ja' : 'en',
    fontQuery: fonts.map(f => `family=${f}:wght@400;500;700;800;900`).join('&amp;'),
    fontFamily: fonts.map(f => `'${f.replace(/\+/g, ' ')}'`).join(', '),
  };
  let out = template
    .replace(/\{\{\{(\w+)\}\}\}/g, (m, k) => { if (!HTML_KEYS.includes(k)) throw new Error(`${k} is not an HTML key`); return d[k]; })
    .replace(/\{\{@(\w+)\}\}/g, (m, k) => { if (!(k in vars)) throw new Error(`unknown variable ${k}`); return vars[k]; })
    .replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in d)) throw new Error(`${lang.code}: no text for ${k}`); return escapeHtml(d[k]); });
  if (/\{\{/.test(out)) throw new Error(`${lang.code}: placeholder left`);
  return out;
}

export function sitemapBlock(today) {
  const alternates = [...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en')}"/>`].join('\n');
  return LANGS.map(l => `  <url>\n    <loc>${pageUrl(l.code)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${l.code === 'en' ? '0.9' : '0.8'}</priority>\n${alternates}\n  </url>`).join('\n');
}

export function outputPath(code) {
  return path.join(here, code === 'en' ? 'index.html' : `${code}/index.html`);
}

function main() {
  const dicts = loadDicts();
  const videos = videoIds();
  let changed = false;
  for (const lang of LANGS) {
    const file = outputPath(lang.code);
    const html = render(lang, dicts[lang.code], videos[lang.code]);
    const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (before !== html) {
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, html);
      changed = true;
      console.log('wrote', path.relative(here, file));
    }
  }
  // sitemap: 印の間を作り直す。lastmod はページが変わったときだけ今日にする
  const sitemapFile = path.join(here, '../sitemap.xml');
  const raw = fs.readFileSync(sitemapFile, 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const sitemap = raw.replace(/\r\n/g, '\n');
  const START = '  <!-- kura-lp:start (node kura/build-lp.mjs) -->', END = '  <!-- kura-lp:end -->';
  const old = sitemap.includes(START) ? sitemap.slice(sitemap.indexOf(START), sitemap.indexOf(END) + END.length) : null;
  const lastmod = (!changed && old && old.match(/<lastmod>([\d-]+)<\/lastmod>/)?.[1]) || new Date().toISOString().slice(0, 10);
  const block = `${START}\n${sitemapBlock(lastmod)}\n${END}`;
  let next;
  if (old) next = sitemap.replace(old, () => block);
  else {
    const single = /  <url>\n    <loc>https:\/\/ramune441\.github\.io\/kura\/<\/loc>[\s\S]*?<\/url>/;
    if (!single.test(sitemap)) throw new Error('sitemap: Kura LP entry not found');
    next = sitemap.replace(single, () => block);
  }
  next = next.replace(/\n/g, nl);
  if (next !== raw) { fs.writeFileSync(sitemapFile, next); console.log('wrote sitemap.xml'); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
