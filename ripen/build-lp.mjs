// Ripen の LP（20 言語）・プライバシーポリシー・お問い合わせの文言を生成する。
//   入力: ripen/lp-template.html（LP の形）、ripen/lp-i18n/<lang>.json（LP の文言）、
//         ripen/pp-i18n/<lang>.json（プライバシーポリシー。ja が正）、ripen/contact-i18n/<lang>.json（お問い合わせ）
//   出力: ripen/index.html（日本語）、ripen/<lang>/index.html（ほか 19 言語）、
//         ripen/i18n-pp.js と privacy-policy.html の既定文（日本語）・<head>、contact.html の辞書・既定文（日本語）・<head>
// 使い方: node ripen/build-lp.mjs（Node だけで動く）。文言や形を直したら実行して、生成物ごとコミットする。
//         node ripen/build-lp.mjs --sitemap で sitemap.xml の Ripen LP 部分（ripen-lp:start〜end）も作り直す。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://ramune441.github.io';
const BASE_URL = `${SITE}/ripen/`;
export const PLAY = 'https://play.google.com/store/apps/details?id=com.ripen.app';

// コード, 表示名, hreflang/lang 属性, og:locale, Play の hl, Google Fonts（その文字の Noto）
export const LANGS = [
  ['ja', '日本語', 'ja', 'ja_JP', 'ja', 'Noto+Sans+JP'],
  ['en', 'English', 'en', 'en_US', 'en', 'Noto+Sans'],
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

// アプリ（UI・ストア掲載・ストア画像・紹介動画）が対応している 12 言語。ほかの 8 言語は Web だけ訳す
export const APP_LANGS = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'hi', 'ar'];
// 言語別の紹介動画（YouTube ID は spec/contract.md の動画 ID 表）。無い言語は近い言語 → 英語
export const VIDEOS = {
  en: 'YWXSLB3oNIk', ja: 'ZQU_WGjQm_I', zh: 'IfsfJfg0vNo', ko: 'WPGNv3VMRiw', es: 'NbepPxeCQCQ', fr: 'ckaQ6bCZWyk',
  de: 'CZ40F6x5vhk', it: 'ick4Fth687I', pt: 'XyePSrbkaps', ru: 's7OqzqooMc8', hi: 'pUys6pfdarU', ar: 'nfaGKUhp_J8',
};
const VIDEO_FALLBACK = {'zh-TW': 'zh'};
export const videoOf = code => VIDEOS[code] || VIDEOS[VIDEO_FALLBACK[code]] || VIDEOS.en;
// 検索結果で切れない長さ（CJK は 1 文字が 2 倍の幅）
export const CJK = ['ja', 'zh', 'zh-TW', 'ko'];
export const LIMITS = {title: [60, 32], desc: [155, 90]};
export const limitOf = (code, kind) => LIMITS[kind][CJK.includes(code) ? 1 : 0];

// 値に HTML を持てるキー（使えるのは <br> と span.accent / span.gold / span.highlight だけ）
export const HTML_KEYS = ['hero_h1', 'concept_h', 'problem_p', 'show1_h3', 'show2_h3', 'show3_h3', 'show4_h3', 'show5_h3', 'cta_h2'];
const ALLOWED_TAG = /<(?!br>|span class="(accent|gold|highlight)">|\/span>)/;
export const PP_HTML_KEYS = ['pp_s11_p'];
const FAQ_COUNT = 8, FEAT_COUNT = 9, SHOTS = ['store-image-1', 'store-image-2', 'store-image-3', 'store-image-4', 'store-image-5'];

export const pageUrl = code => BASE_URL + (code === 'ja' ? '' : code + '/');
export const outputPath = code => path.join(here, code === 'ja' ? 'index.html' : `${code}/index.html`);
// 言語別のストア画像（images/store/<lang>/）。アプリ未対応の言語は英語の画像
export const imageDir = code => fs.existsSync(path.join(here, 'images/store', code, 'store-image-feature.png')) ? `images/store/${code}/` : 'images/store/en/';
const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = s => String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const indentJson = obj => JSON.stringify(obj, null, 2).replace(/^/gm, '  ');
const readJson = file => JSON.parse(fs.readFileSync(path.join(here, file), 'utf8'));

// 辞書を読む。en のキーと過不足があれば・空の値・許されない HTML があれば止める
export function loadSet(dir, htmlKeys, allowed = ALLOWED_TAG) {
  const keys = Object.keys(readJson(`${dir}/en.json`));
  const dicts = {};
  for (const {code} of LANGS) {
    const d = readJson(`${dir}/${code}.json`);
    const missing = keys.filter(k => !d[k] || !String(d[k]).trim());
    const extra = Object.keys(d).filter(k => !keys.includes(k));
    if (missing.length || extra.length) throw new Error(`${dir}/${code}: missing ${missing.join(',')} extra ${extra.join(',')}`);
    for (const [k, v] of Object.entries(d)) {
      if (htmlKeys.includes(k) ? allowed.test(v) : /[<>]/.test(v)) throw new Error(`${dir}/${code}.${k}: HTML not allowed here`);
    }
    dicts[code] = d;
  }
  return dicts;
}
export const loadDicts = () => loadSet('lp-i18n', HTML_KEYS);
export const loadPp = () => loadSet('pp-i18n', PP_HTML_KEYS, /<(?!a href="contact\.html">|\/a>)/);
export const loadContact = () => loadSet('contact-i18n', []);

function jsonLd(lang, d) {
  const url = pageUrl(lang.code);
  const img = `${BASE_URL}${imageDir(lang.code)}`;
  const app = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Ripen', description: d.seo_desc,
    url, inLanguage: lang.hreflang, applicationCategory: 'LifestyleApplication', operatingSystem: 'Android',
    installUrl: PLAY, sameAs: [PLAY], image: `${img}store-image-feature.png`,
    screenshot: SHOTS.map(s => `${img}${s}.png`),
    featureList: Array.from({length: FEAT_COUNT}, (_, i) => d[`feat${i + 1}_h3`]),
    offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
    author: {'@type': 'Person', name: 'Ramune', url: `${SITE}/`},
  };
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang.hreflang,
    mainEntity: Array.from({length: FAQ_COUNT}, (_, i) => ({'@type': 'Question', name: d[`faq${i + 1}_q`], acceptedAnswer: {'@type': 'Answer', text: d[`faq${i + 1}_a`]}})),
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Ramune Apps', item: `${SITE}/`},
      {'@type': 'ListItem', position: 2, name: 'Ripen', item: url},
    ],
  };
  // </script> を値に含めても閉じないように < を逃がす
  return [app, faq, crumbs].map(o => `  <script type="application/ld+json">\n${indentJson(o).replace(/</g, '\\u003c')}\n  </script>`).join('\n');
}

export function render(lang, d, dicts) {
  const template = fs.readFileSync(path.join(here, 'lp-template.html'), 'utf8');
  const isRoot = lang.code === 'ja';
  const base = isRoot ? '' : '../';
  const hreflang = [...LANGS.map(l => `  <link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code)}">`),
    `  <link rel="alternate" hreflang="x-default" href="${pageUrl('en')}">`].join('\n');
  const options = LANGS.map(l => `<option value="${l.code}"${l.code === lang.code ? ' selected' : ''}>${l.name}</option>`).join('');
  const fonts = lang.font === 'Noto+Sans' ? ['Noto+Sans'] : [lang.font, 'Noto+Sans'];
  const faqItems = Array.from({length: FAQ_COUNT}, (_, i) => `        <div class="faq-item">
          <button class="faq-q" aria-expanded="false"><span>${escapeHtml(d[`faq${i + 1}_q`])}</span></button>
          <div class="faq-a"><div class="faq-a-inner">${escapeHtml(d[`faq${i + 1}_a`])}</div></div>
        </div>`).join('\n');
  // /ripen/ だけ: ブラウザ言語のページへの案内（文言は各言語の lang_suggest）
  const suggest = isRoot
    ? `  <div class="lang-suggest" id="langSuggest" hidden><a href="en/">${escapeHtml(dicts.en.lang_suggest)}</a><button type="button" aria-label="Close">&times;</button></div>
  <script type="application/json" id="langSuggestText">${JSON.stringify(Object.fromEntries(LANGS.filter(l => l.code !== 'ja').map(l => [l.code, dicts[l.code].lang_suggest]))).replace(/</g, '\\u003c')}</script>\n`
    : '';
  const vars = {
    lang: lang.code, htmlLang: lang.hreflang, dir: lang.code === 'ar' ? 'rtl' : 'ltr', base, url: pageUrl(lang.code), self: './',
    ogLocale: lang.ogLocale, hreflang, jsonld: jsonLd(lang, d), langOptions: options, faqItems, suggest,
    ogLocaleAlternates: LANGS.filter(l => l.code !== lang.code).map(l => `  <meta property="og:locale:alternate" content="${l.ogLocale}">`).join('\n'),
    ogImage: `${BASE_URL}${imageDir(lang.code)}store-image-feature.png`, img: imageDir(lang.code),
    play: `${PLAY}&amp;hl=${lang.hl}`, video: `https://www.youtube-nocookie.com/embed/${videoOf(lang.code)}?rel=0&amp;hl=${lang.hl}`,
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

// ── プライバシーポリシー・お問い合わせ（1 つの URL で ?lang= により表示を切り替える） ─────────────

// data-i18n / data-i18n-html の要素の中身を辞書の値（日本語）に差し替える。同名タグの入れ子を数えて閉じタグを探す
export function fillBaseline(html, msgs, htmlKeys = []) {
  const open = /<([a-zA-Z][\w-]*)\b[^>]*?\sdata-i18n(-html)?="([^"]+)"[^>]*>/g;
  let out = '', pos = 0, m;
  while ((m = open.exec(html))) {
    const [tag, name, isHtml, key] = m;
    const innerStart = m.index + tag.length;
    const re = new RegExp(`<${name}\\b[^>]*>|</${name}>`, 'gi');
    re.lastIndex = innerStart;
    let depth = 1, close;
    while (depth && (close = re.exec(html))) depth += close[0][1] === '/' ? -1 : 1;
    if (depth) throw new Error(`no closing tag for ${key}`);
    if (!(key in msgs)) throw new Error(`no text for ${key}`);
    if (isHtml && !htmlKeys.includes(key)) throw new Error(`${key} is not an HTML key`);
    out += html.slice(pos, innerStart) + (isHtml ? msgs[key] : escapeHtml(msgs[key]));
    pos = close.index;
    open.lastIndex = close.index;
  }
  return out + html.slice(pos);
}
// data-i18n-ph（placeholder）も日本語に
const fillPlaceholders = (html, msgs) => html.replace(/(data-i18n-ph="(\w+)" placeholder=")[^"]*"/g, (m, pre, k) => `${pre}${escapeHtml(msgs[k])}"`);

function replaceBlock(html, start, end, body, file) {
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error(`${file}: marker ${start} not found`);
  return html.slice(0, a + start.length) + '\n' + body + '\n  ' + html.slice(b);
}

function singlePageHead({title, desc, url, imageAlt}) {
  const img = `${BASE_URL}images/store/ja/store-image-feature.png`;
  return [
    `  <title>${escapeHtml(title)}</title>`,
    `  <meta name="description" content="${escapeHtml(desc)}">`,
    `  <meta name="author" content="Ramune">`,
    `  <meta name="robots" content="index, follow">`,
    `  <link rel="canonical" href="${url}">`,
    `  <meta property="og:title" content="${escapeHtml(title)}">`,
    `  <meta property="og:description" content="${escapeHtml(desc)}">`,
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:image" content="${img}">`,
    `  <meta property="og:image:width" content="1024">`,
    `  <meta property="og:image:height" content="500">`,
    `  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}">`,
    `  <meta property="og:locale" content="ja_JP">`,
    `  <meta property="og:site_name" content="Ripen">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${escapeHtml(title)}">`,
    `  <meta name="twitter:description" content="${escapeHtml(desc)}">`,
    `  <meta name="twitter:image" content="${img}">`,
  ].join('\n');
}

// i18n-pp.js: 20 言語の辞書＋切り替え。?lang= > 前に選んだ言語（ripen_lp_lang）> ブラウザ言語 > 日本語（HTML の既定文）
export function renderPpScript(pp) {
  const langs = LANGS.map(l => [l.code, l.name, l.ogLocale, l.hreflang]);
  return `// 生成物: ripen/pp-i18n/<lang>.json から node ripen/build-lp.mjs で作る。直接直さない。
// Ripen のプライバシーポリシーを 20 言語で表示する（日本語が正。HTML の既定文は日本語）。
// 言語は ?lang= > 前に選んだ言語（localStorage ripen_lp_lang）> ブラウザ言語 > 日本語。ar は右から左。
(function () {
  var MESSAGES = ${JSON.stringify(pp).replace(/</g, '\\u003c')};
  var LANGS = ${JSON.stringify(langs)};
  var KEY = 'ripen_lp_lang';
  var codes = LANGS.map(function (l) { return l[0]; });
  function normalize(tag) {
    if (!tag) return null;
    var t = String(tag).replace('_', '-').toLowerCase();
    if (/^zh-(tw|hk|mo)|^zh-hant/.test(t)) return 'zh-TW';
    var short = t.split('-')[0];
    if (short === 'in') short = 'id';
    for (var i = 0; i < codes.length; i++) if (codes[i].toLowerCase() === t || codes[i] === short) return codes[i];
    return null;
  }
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function detect() {
    var q = (location.search.match(/[?&]lang=([A-Za-z_-]+)/) || [])[1];
    var hit = normalize(q) || normalize(saved());
    if (hit) return hit;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var i = 0; i < list.length; i++) { hit = normalize(list[i]); if (hit) return hit; }
    return 'ja';
  }
  function setMeta(sel, val) { var el = document.querySelector(sel); if (el) el.setAttribute('content', val); }
  function apply(lang) {
    var d = MESSAGES[lang];
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = d[el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = d[el.getAttribute('data-i18n-html')]; });
    document.querySelectorAll('[data-contact-link] a, a[data-contact-link]').forEach(function (a) { a.setAttribute('href', 'contact.html?lang=' + lang); });
    document.querySelectorAll('[data-lp-link]').forEach(function (a) { a.setAttribute('href', lang === 'ja' ? './' : lang + '/'); });
    var root = document.documentElement;
    root.lang = LANGS[codes.indexOf(lang)][3];
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    var title = d.pp_title + '｜Ripen';
    document.title = title;
    setMeta('meta[property="og:title"]', title); setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="description"]', d.pp_desc); setMeta('meta[property="og:description"]', d.pp_desc); setMeta('meta[name="twitter:description"]', d.pp_desc);
    setMeta('meta[property="og:locale"]', LANGS[codes.indexOf(lang)][2]);
    var sel = document.getElementById('langSelect'); if (sel) sel.value = lang;
  }
  var sel = document.getElementById('langSelect');
  if (sel) {
    LANGS.forEach(function (l) { var o = document.createElement('option'); o.value = l[0]; o.textContent = l[1]; sel.appendChild(o); });
    sel.addEventListener('change', function () {
      try { localStorage.setItem(KEY, this.value); } catch (e) {}
      apply(this.value);
      try { history.replaceState(null, '', location.pathname + '?lang=' + this.value + location.hash); } catch (e) {}
    });
  }
  apply(detect());
})();
`;
}

export function renderPrivacy(html, pp) {
  const ja = pp.ja;
  html = replaceBlock(html, '<!-- seo:start (node ripen/build-lp.mjs) -->', '<!-- seo:end -->',
    singlePageHead({title: `${ja.pp_title}｜Ripen`, desc: ja.pp_desc, url: `${BASE_URL}privacy-policy.html`, imageAlt: 'Ripen'}), 'privacy-policy.html');
  return fillBaseline(html, ja, PP_HTML_KEYS);
}

export function renderContact(html, contact) {
  const ja = contact.ja;
  html = replaceBlock(html, '<!-- seo:start (node ripen/build-lp.mjs) -->', '<!-- seo:end -->',
    singlePageHead({title: `${ja.contact_title}｜Ripen`, desc: ja.contact_meta_desc, url: `${BASE_URL}contact.html`, imageAlt: 'Ripen'}), 'contact.html');
  const ordered = Object.fromEntries(LANGS.map(l => [l.code, contact[l.code]]));
  if (!/var MESSAGES = \{.*\};/.test(html)) throw new Error('contact.html: MESSAGES not found');
  html = html.replace(/var MESSAGES = \{.*\};/, () => `var MESSAGES = ${JSON.stringify(ordered).replace(/</g, '\\u003c')};`);
  html = html.replace(/var LANG_NAMES = \[.*\];/, () => `var LANG_NAMES = ${JSON.stringify(LANGS.map(l => [l.code, l.name]))};`);
  return fillPlaceholders(fillBaseline(html, ja), ja);
}

// ── sitemap.xml の Ripen LP 部分 ─────────────────────────────────────
const SM_START = '  <!-- ripen-lp:start（ripen/build-lp.mjs が生成） -->', SM_END = '  <!-- ripen-lp:end -->';
export function sitemapBlock(today) {
  const alternates = [...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en')}"/>`].join('\n');
  return LANGS.map(l => `  <url>\n    <loc>${pageUrl(l.code)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${l.code === 'ja' ? '0.9' : '0.8'}</priority>\n${alternates}\n  </url>`).join('\n');
}
// 印の間を作り直す（初回は既存の /ripen/ の <url> と置き換える）。lastmod はページが変わったときだけ今日にする
export function updateSitemap(raw, changed, today = new Date().toISOString().slice(0, 10)) {
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const sitemap = raw.replace(/\r\n/g, '\n');
  const old = sitemap.includes(SM_START) ? sitemap.slice(sitemap.indexOf(SM_START), sitemap.indexOf(SM_END) + SM_END.length) : null;
  const lastmod = (!changed && old && old.match(/<lastmod>([\d-]+)<\/lastmod>/)?.[1]) || today;
  const block = `${SM_START}\n${sitemapBlock(lastmod)}\n${SM_END}`;
  let next;
  if (old) next = sitemap.replace(old, () => block);
  else {
    const single = /  <url>\n    <loc>https:\/\/ramune441\.github\.io\/ripen\/<\/loc>[\s\S]*?<\/url>/;
    if (!single.test(sitemap)) throw new Error('sitemap: Ripen LP entry not found');
    next = sitemap.replace(single, () => block);
  }
  if (!next.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) throw new Error('sitemap: xhtml namespace missing');
  return next.replace(/\n/g, nl);
}

// 生成物の一覧（パス → 中身）。テストも同じものを作って比べる
export function buildAll() {
  const dicts = loadDicts(), pp = loadPp(), contact = loadContact();
  const files = new Map();
  for (const lang of LANGS) files.set(outputPath(lang.code), render(lang, dicts[lang.code], dicts));
  files.set(path.join(here, 'i18n-pp.js'), renderPpScript(pp));
  const read = f => fs.readFileSync(path.join(here, f), 'utf8');
  files.set(path.join(here, 'privacy-policy.html'), renderPrivacy(read('privacy-policy.html'), pp));
  files.set(path.join(here, 'contact.html'), renderContact(read('contact.html'), contact));
  return files;
}

function main() {
  let changed = false;
  for (const [file, content] of buildAll()) {
    const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (before !== content) {
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, content);
      changed = true;
      console.log('wrote', path.relative(here, file));
    }
  }
  if (process.argv.includes('--sitemap')) {
    const sitemapFile = path.join(here, '../sitemap.xml');
    const raw = fs.readFileSync(sitemapFile, 'utf8');
    const next = updateSitemap(raw, changed);
    if (next !== raw) { fs.writeFileSync(sitemapFile, next); console.log('wrote sitemap.xml'); }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
