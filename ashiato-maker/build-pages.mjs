// 足あとメーカーの LP（20 言語）・問い合わせ・アンインストールアンケート・プライバシーポリシーを生成する。
//   入力: templates/*.html（ページの形）、i18n/lp/<lang>.json（LP の文言）、i18n/pages/<lang>.json（その他 3 ページの文言）、
//         lp-data.json（拡張の版・ストア ID・言語別の紹介動画・対応アプリの並び。拡張リポジトリがあれば実行のたびに同期する）
//   出力: index.html（日本語）、<lang>/index.html（ほか 19 言語）、contact.html、uninstall.html、privacy-policy.html
//   使い方: node ashiato-maker/build-pages.mjs            … 生成（変わったファイルだけ書く）
//           node ashiato-maker/build-pages.mjs --sitemap  … あわせて ../sitemap.xml の LP 部分（ashiato-lp の印の間）を作り直す
//   拡張リポジトリの場所は ASHIATO_EXT（既定はこのリポジトリと並ぶ ../ashiato-maker）。無ければ lp-data.json をそのまま使う。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SITE = 'https://ramune441.github.io';
export const BASE_URL = `${SITE}/ashiato-maker/`;
export const EXT_DIR = process.env.ASHIATO_EXT || path.resolve(here, '../../ashiato-maker');
const DATA_FILE = path.join(here, 'lp-data.json');

// フォルダ名, 表示名, hreflang/lang 属性, og:locale, ストアの hl, Google Fonts, 拡張の _locales 名
export const LANGS = [
  ['ja', '日本語', 'ja', 'ja_JP', 'ja', 'Noto+Sans+JP', 'ja'],
  ['en', 'English', 'en', 'en_US', 'en', 'Noto+Sans', 'en'],
  ['zh', '简体中文', 'zh-Hans', 'zh_CN', 'zh-CN', 'Noto+Sans+SC', 'zh_CN'],
  ['zh-TW', '繁體中文', 'zh-TW', 'zh_TW', 'zh-TW', 'Noto+Sans+TC', 'zh_TW'],
  ['ko', '한국어', 'ko', 'ko_KR', 'ko', 'Noto+Sans+KR', 'ko'],
  ['es', 'Español', 'es', 'es_ES', 'es', 'Noto+Sans', 'es'],
  ['fr', 'Français', 'fr', 'fr_FR', 'fr', 'Noto+Sans', 'fr'],
  ['de', 'Deutsch', 'de', 'de_DE', 'de', 'Noto+Sans', 'de'],
  ['pt', 'Português', 'pt-BR', 'pt_BR', 'pt-BR', 'Noto+Sans', 'pt_BR'],
  ['it', 'Italiano', 'it', 'it_IT', 'it', 'Noto+Sans', 'it'],
  ['ru', 'Русский', 'ru', 'ru_RU', 'ru', 'Noto+Sans', 'ru'],
  ['id', 'Bahasa Indonesia', 'id', 'id_ID', 'id', 'Noto+Sans', 'id'],
  ['hi', 'हिन्दी', 'hi', 'hi_IN', 'hi', 'Noto+Sans+Devanagari', 'hi'],
  ['tr', 'Türkçe', 'tr', 'tr_TR', 'tr', 'Noto+Sans', 'tr'],
  ['vi', 'Tiếng Việt', 'vi', 'vi_VN', 'vi', 'Noto+Sans', 'vi'],
  ['th', 'ไทย', 'th', 'th_TH', 'th', 'Noto+Sans+Thai', 'th'],
  ['pl', 'Polski', 'pl', 'pl_PL', 'pl', 'Noto+Sans', 'pl'],
  ['ar', 'العربية', 'ar', 'ar_AR', 'ar', 'Noto+Sans+Arabic', 'ar'],
  ['nl', 'Nederlands', 'nl', 'nl_NL', 'nl', 'Noto+Sans', 'nl'],
  ['bn', 'বাংলা', 'bn', 'bn_BD', 'bn', 'Noto+Sans+Bengali', 'bn'],
].map(([code, name, hreflang, ogLocale, hl, font, ext]) => ({code, name, hreflang, ogLocale, hl, font, ext}));

// 対応アプリ（拡張のアプリキー）。ストア画像 4 枚目と同じく、その言語の主要アプリを先に、残りをこの順で並べる
export const APP_KEYS = ['pairs', 'with', 'toukare', 'tinder', 'badoo', 'okcupid', 'match'];
const APP_NAMES = {pairs: 'Pairs', with: 'with', toukare: 'Tokyo Calendar Date', tinder: 'Tinder', badoo: 'Badoo', okcupid: 'OkCupid', match: 'Match'};

// 値に HTML を持てる LP のキー（使えるのは <br>・<strong>・span.accent・span.highlight だけ）
export const HTML_KEYS = ['hero_pain', 'hero_h1', 'hero_sub', 'why_p1', 'why_p2', 'why_p3', 'cta_h2'];
const ALLOWED_TAG = /<(?!br>|\/?strong>|span class="(accent|highlight)">|\/span>)/;
// 日本語ページだけのキー（実画面のパネル再現）
export const JA_ONLY_KEYS = ['panel_reload', 'panel_stop', 'panel_progress', 'panel_until', 'panel_reloads', 'panel_people', 'panel_times'];
// 文字の並びに字間を付けると崩れる文字体系
const NO_TRACKING = ['ar', 'hi', 'bn', 'th'];

export const pageUrl = code => BASE_URL + (code === 'ja' ? '' : code + '/');
export const outputPath = code => path.join(here, code === 'ja' ? 'index.html' : `${code}/index.html`);
export const PAGE_FILES = ['contact.html', 'uninstall.html', 'privacy-policy.html'];
const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const scriptJson = o => JSON.stringify(o).replace(/</g, '\\u003c');
const indentJson = obj => JSON.stringify(obj, null, 2).replace(/^/gm, '  ');
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

// ── 拡張リポジトリから版・紹介動画・主要アプリを写す ─────────────────
export function extensionData(dir = EXT_DIR) {
  if (!fs.existsSync(path.join(dir, 'manifest.json'))) return null;
  const manifest = readJson(path.join(dir, 'manifest.json'));
  const youtube = readJson(path.join(dir, 'store-videos/promo/youtube.json')).items;
  const copy = readJson(path.join(dir, 'store/copy.json'));
  const data = {version: manifest.version, videos: {}, apps: {}, appNames: {}};
  for (const {code, ext} of LANGS) {
    data.videos[code] = youtube[ext].videoId;
    const featured = copy[ext].featured;
    data.apps[code] = [...featured, ...APP_KEYS.filter(k => !featured.includes(k))];
    data.appNames[code] = copy[ext].siteNames || {};
  }
  return data;
}

export function loadData() {
  const data = readJson(DATA_FILE);
  for (const {code} of LANGS) {
    if (!data.videos[code] || !data.apps[code] || !data.appNames[code]) throw new Error(`lp-data.json: ${code} is incomplete`);
    if ([...data.apps[code]].sort().join() !== [...APP_KEYS].sort().join()) throw new Error(`lp-data.json: ${code} apps must list all 7 apps once`);
  }
  return data;
}

function syncData() {
  const ext = extensionData();
  if (!ext) { console.log(`extension repo not found (${EXT_DIR}); using lp-data.json as is`); return; }
  const before = fs.existsSync(DATA_FILE) ? readJson(DATA_FILE) : {};
  const next = {
    _: 'node ashiato-maker/build-pages.mjs が拡張リポジトリ（manifest.json・store-videos/promo/youtube.json・store/copy.json）から写す。手で直さない。',
    extensionId: 'pidobfkbnlmfckdndkabelpjpdboadfo',
    storeUrl: before.storeUrl || 'https://chromewebstore.google.com/detail/%E8%B6%B3%E3%81%82%E3%81%A8%E3%83%A1%E3%83%BC%E3%82%AB%E3%83%BC/pidobfkbnlmfckdndkabelpjpdboadfo',
    ...ext,
  };
  const text = JSON.stringify(next, null, 2) + '\n';
  if (!fs.existsSync(DATA_FILE) || fs.readFileSync(DATA_FILE, 'utf8') !== text) { fs.writeFileSync(DATA_FILE, text); console.log('wrote lp-data.json'); }
}

// ── 辞書 ───────────────────────────────────────────────────────
export function loadDicts(kind) {
  const dir = path.join(here, 'i18n', kind);
  const keys = Object.keys(readJson(path.join(dir, 'en.json')));
  const dicts = {};
  for (const {code} of LANGS) {
    const d = readJson(path.join(dir, `${code}.json`));
    const want = kind === 'lp' && code === 'ja' ? [...keys, ...JA_ONLY_KEYS] : keys;
    const missing = want.filter(k => typeof d[k] !== 'string' || !d[k].trim());
    const extra = Object.keys(d).filter(k => !want.includes(k));
    if (missing.length || extra.length) throw new Error(`i18n/${kind}/${code}.json: missing [${missing}] extra [${extra}]`);
    for (const [k, v] of Object.entries(d)) {
      const html = kind === 'lp' && HTML_KEYS.includes(k);
      if (html ? ALLOWED_TAG.test(v) : /[<>]/.test(v)) throw new Error(`i18n/${kind}/${code}.json ${k}: HTML not allowed here`);
    }
    dicts[code] = d;
  }
  return dicts;
}

// ── テンプレート ─────────────────────────────────────────────────
// {{#ja}}…{{/ja}} / {{^ja}}…{{/ja}}: 日本語ページだけ／日本語以外だけ
// {{{key}}}: 辞書の HTML（HTML_KEYS だけ） / {{@name}}: 生成側の値 / {{key}}: 辞書の文字列（エスケープする）
function fill(template, d, vars, {isJa, htmlKeys = []}) {
  const out = template
    .replace(/\{\{([#^])ja\}\}\n([\s\S]*?)\{\{\/ja\}\}\n/g, (m, kind, body) => ((kind === '#') === isJa ? body : ''))
    .replace(/\{\{\{(\w+)\}\}\}/g, (m, k) => { if (!htmlKeys.includes(k)) throw new Error(`${k} is not an HTML key`); return d[k]; })
    .replace(/\{\{@(\w+)\}\}/g, (m, k) => { if (!(k in vars)) throw new Error(`unknown variable ${k}`); return vars[k]; })
    .replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in d)) throw new Error(`no text for ${k}`); return escapeHtml(d[k]); });
  if (/\{\{/.test(out)) throw new Error('placeholder left');
  return out;
}
const template = name => fs.readFileSync(path.join(here, 'templates', name), 'utf8');

export function storeLink(data, lang) {
  return `${data.storeUrl}?hl=${lang.hl}&utm_source=ashiato-lp&utm_medium=web&utm_campaign=${lang.code}`;
}
const ogImage = code => `${BASE_URL}images/lp/${code}/store-image-1.jpg`;
const demoImage = code => (code === 'ja' ? `${BASE_URL}pairs-real.png` : `${BASE_URL}images/lp/${code}/store-image-2.webp`);
function alternateNames(brand) {
  return [...new Set([brand, 'Auto Like Assistant', 'Ashiato Maker'])].filter(n => n !== '足あとメーカー');
}

function jsonLd(lang, d, data) {
  const url = pageUrl(lang.code);
  const app = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: '足あとメーカー', alternateName: alternateNames(d.brand), description: d.seo_desc, url, inLanguage: lang.hreflang,
    applicationCategory: 'BrowserApplication', operatingSystem: 'Chrome', browserRequirements: 'Google Chrome (desktop)',
    softwareVersion: data.version, installUrl: data.storeUrl, sameAs: [data.storeUrl],
    image: `${BASE_URL}icons/icon128.png`, screenshot: [ogImage(lang.code), demoImage(lang.code)],
    featureList: [1, 2, 3, 4, 5, 6].map(i => d[`f${i}_h3`]),
    offers: {'@type': 'Offer', price: '0', priceCurrency: lang.code === 'ja' ? 'JPY' : 'USD'},
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
      {'@type': 'ListItem', position: 2, name: d.brand, item: url},
    ],
  };
  // </script> を値に含めても閉じないように < を逃がす
  return [app, faq, crumbs].map(o => `  <script type="application/ld+json">\n${indentJson(o).replace(/</g, '\\u003c')}\n  </script>`).join('\n');
}

export function renderLp(lang, d, data, dicts) {
  const isJa = lang.code === 'ja';
  const base = isJa ? '' : '../';
  const rel = code => (base + (code === 'ja' ? '' : code + '/')) || './';
  const hreflang = [...LANGS.map(l => `  <link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code)}">`),
    `  <link rel="alternate" hreflang="x-default" href="${pageUrl('en')}">`].join('\n');
  const fonts = lang.font === 'Noto+Sans' ? ['Noto+Sans'] : [lang.font, 'Noto+Sans'];
  const names = {...APP_NAMES, ...data.appNames[lang.code]};
  const vars = {
    lang: lang.code, htmlLang: lang.hreflang, dir: lang.code === 'ar' ? 'rtl' : 'ltr',
    htmlClass: NO_TRACKING.includes(lang.code) ? 'lp no-tracking' : 'lp', base, url: pageUrl(lang.code),
    ogLocale: lang.ogLocale, ogImage: ogImage(lang.code), hreflang, jsonld: jsonLd(lang, d, data),
    langOptions: LANGS.map(l => `<option value="${rel(l.code)}" data-code="${l.code}" lang="${l.hreflang}"${l.code === lang.code ? ' selected' : ''}>${l.name}</option>`).join(''),
    langLinks: LANGS.map(l => `      <li><a href="${rel(l.code)}" hreflang="${l.hreflang}" lang="${l.hreflang}"${l.code === lang.code ? ' aria-current="page"' : ''}>${l.name}</a></li>`).join('\n'),
    suggestJson: scriptJson(Object.fromEntries(LANGS.map(l => [l.code, dicts[l.code].lang_suggest]))),
    appChips: data.apps[lang.code].map(k => `      <li class="app-chip"><span class="app-dot ${k}"></span><span class="app-chip-name">${escapeHtml(names[k])}</span><span class="app-chip-check" aria-hidden="true">&#10003;</span></li>`).join('\n'),
    store: escapeHtml(storeLink(data, lang)),
    video: `https://www.youtube.com/embed/${data.videos[lang.code]}?hl=${lang.hl}&amp;rel=0`,
    privacy: `${base}privacy-policy.html?lang=${lang.code}`, contact: `${base}contact.html?lang=${lang.code}`,
    demoImage: `${base}images/lp/${lang.code}/store-image-2.webp`,
    fontQuery: fonts.map(f => `family=${f}:wght@400;600;700;900`).join('&amp;'),
    fontFamily: fonts.map(f => `'${f.replace(/\+/g, ' ')}'`).join(', '),
  };
  return fill(template('lp.html'), d, vars, {isJa, htmlKeys: HTML_KEYS});
}

// ── 問い合わせ・アンケート・プライバシー（1 つの URL で ?lang= により切り替える） ──────────
const PAGE_KEYS = {
  'contact.html': k => ['brand', 'lang_label', 'footer_privacy', 'app_toukare'].includes(k) || k.startsWith('contact_'),
  'uninstall.html': k => ['brand', 'lang_label'].includes(k) || k.startsWith('un_'),
  'privacy-policy.html': k => ['brand', 'lang_label'].includes(k) || k.startsWith('pp_'),
};
const TITLE_KEY = {'contact.html': 'contact_doc_title', 'uninstall.html': 'un_title', 'privacy-policy.html': 'pp_doc_title'};

// ?lang=（拡張の zh_TW・pt_BR 形式も可）> 前に選んだ言語 > ブラウザの言語 > en
function localeScript(titleKey) {
  const names = Object.fromEntries(LANGS.map(l => [l.code, l.name]));
  const htmlLang = Object.fromEntries(LANGS.map(l => [l.code, l.hreflang]));
  return `      var LANG_NAMES = ${scriptJson(names)};
      var HTML_LANG = ${scriptJson(htmlLang)};
      var SUPPORTED = Object.keys(LANG_NAMES);
      var LANG_KEY = 'ashiato_lang';
      function matchLocale(tag) {
        var t = String(tag || '').toLowerCase().replace(/_/g, '-');
        if (!t) return null;
        if (/^zh-(tw|hk|mo|hant)/.test(t)) return 'zh-TW';
        if (/^zh/.test(t)) return 'zh';
        var p = t.split('-')[0];
        return SUPPORTED.indexOf(p) !== -1 ? p : null;
      }
      function detectLocale() {
        var q = null, saved = null;
        try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
        try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
        var found = matchLocale(q) || matchLocale(saved);
        var nav = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
        for (var i = 0; !found && i < nav.length; i++) found = matchLocale(nav[i]);
        return found || 'en';
      }
      function applyMessages(code, m) {
        document.documentElement.lang = HTML_LANG[code];
        document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
        document.title = m.${titleKey};
        document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = m[el.getAttribute('data-i18n')]; });
        document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', m[el.getAttribute('data-i18n-ph')]); });
        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', m[el.getAttribute('data-i18n-aria')]); });
        var sel = document.getElementById('lang-select');
        if (sel) sel.value = code;
      }
      function bindSelector(onChange) {
        document.getElementById('lang-select').addEventListener('change', function () {
          var code = this.value;
          try { localStorage.setItem(LANG_KEY, code); } catch (e) {}
          try { var u = new URL(location.href); u.searchParams.set('lang', code); history.replaceState(null, '', u.href); } catch (e) {}
          onChange(code);
        });
      }`;
}

export function renderPage(file, dicts, data) {
  const pick = PAGE_KEYS[file];
  const messages = Object.fromEntries(LANGS.map(l => [l.code, Object.fromEntries(Object.entries(dicts[l.code]).filter(([k]) => pick(k)))]));
  const vars = {
    url: BASE_URL + file, ogImage: ogImage('ja'),
    ogLocaleAlternates: LANGS.filter(l => l.code !== 'ja').map(l => `  <meta property="og:locale:alternate" content="${l.ogLocale}">`).join('\n'),
    langOptions: LANGS.map(l => `<option value="${l.code}" lang="${l.hreflang}"${l.code === 'ja' ? ' selected' : ''}>${l.name}</option>`).join(''),
    lpPaths: scriptJson(Object.fromEntries(LANGS.map(l => [l.code, l.code === 'ja' ? './' : `./${l.code}/`]))),
    messages: scriptJson(messages), localeScript: localeScript(TITLE_KEY[file]),
  };
  return fill(template(file), dicts.ja, vars, {isJa: true});
}

// ── sitemap.xml の LP 部分（--sitemap のときだけ書く） ─────────────────
const SITEMAP_START = '  <!-- ashiato-lp:start（ashiato-maker/build-pages.mjs が生成） -->';
const SITEMAP_END = '  <!-- ashiato-lp:end -->';
export function sitemapBlock(lastmod) {
  const alternates = [...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en')}"/>`].join('\n');
  const urls = LANGS.map(l => `  <url>\n    <loc>${pageUrl(l.code)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${l.code === 'ja' ? '0.9' : '0.8'}</priority>\n${alternates}\n  </url>`);
  return `${SITEMAP_START}\n${urls.join('\n')}\n${SITEMAP_END}`;
}
export function updateSitemap(raw, lastmod) {
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const xml = raw.replace(/\r\n/g, '\n');
  const marked = /  <!-- ashiato-lp:start[^\n]*-->[\s\S]*?<!-- ashiato-lp:end -->/;
  let next;
  if (marked.test(xml)) next = xml.replace(marked, () => sitemapBlock(lastmod));
  else {
    // 初回: 既存の日本語 LP の <url> を差し替える
    const single = /  <url>\n    <loc>https:\/\/ramune441\.github\.io\/ashiato-maker\/<\/loc>[\s\S]*?<\/url>/;
    if (!single.test(xml)) throw new Error('sitemap.xml: ashiato-maker LP entry not found');
    next = xml.replace(single, () => sitemapBlock(lastmod));
  }
  return next.replace(/\n/g, nl);
}

// ── main ───────────────────────────────────────────────────────
export function renderAll() {
  const data = loadData();
  const lp = loadDicts('lp');
  const pages = loadDicts('pages');
  const files = new Map();
  for (const lang of LANGS) files.set(outputPath(lang.code), renderLp(lang, lp[lang.code], data, lp));
  for (const file of PAGE_FILES) files.set(path.join(here, file), renderPage(file, pages, data));
  return files;
}

function main() {
  syncData();
  for (const [file, html] of renderAll()) {
    const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (before !== html) {
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, html);
      console.log('wrote', path.relative(here, file));
    }
  }
  if (process.argv.includes('--sitemap')) {
    const sitemapFile = path.join(here, '../sitemap.xml');
    const raw = fs.readFileSync(sitemapFile, 'utf8');
    const next = updateSitemap(raw, new Date().toISOString().slice(0, 10));
    if (next !== raw) { fs.writeFileSync(sitemapFile, next); console.log('wrote sitemap.xml'); }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
