import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {LANGS, loadDicts, videoIds, render, outputPath, pageUrl, FEATURE_KEYS, screenshotUrls,
  LEGAL_PAGES, LEGAL_HTML_KEYS, loadLegal, legalBundle, legalStrings, fillLegalPage} from './build-lp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const dicts = loadDicts(); // throws on a missing/extra key, an empty value or HTML outside the allowed keys
const videos = videoIds();
const listing = JSON.parse(fs.readFileSync(path.join(here, 'store-listing.json'), 'utf8'));
const PLAY = 'https://play.google.com/store/apps/details?id=app.kura.photos';

// 検索結果で切れない長さ。漢字・かな・ハングル・タイ文字は 1 字が広いので短く数える（書記素で数える）
const TIGHT = ['ja', 'zh', 'zh-TW', 'ko', 'th'];
const segmenter = new Intl.Segmenter('und', {granularity: 'grapheme'});
const graphemes = s => [...segmenter.segment(s)].length;
const limits = code => TIGHT.includes(code) ? {title: 32, desc: 90} : {title: 60, desc: 155};
const unescape = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const jsonLdOf = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));

test('the LP has the same 20 languages as the app and its Play listing', () => {
  assert.deepEqual(LANGS.map(l => l.code).sort(), Object.keys(listing.locales).sort());
  assert.deepEqual(fs.readdirSync(path.join(here, 'lp-i18n')).map(f => f.replace('.json', '')).sort(), LANGS.map(l => l.code).sort());
});

test('every generated page matches its dictionary and the template (run node kura/build-lp.mjs)', () => {
  for (const lang of LANGS) {
    assert.equal(fs.readFileSync(outputPath(lang.code), 'utf8'), render(lang, dicts[lang.code], videos[lang.code]), lang.code);
  }
});

test('each language is actually translated, not English left in place', () => {
  const en = dicts.en;
  for (const {code} of LANGS.filter(l => l.code !== 'en')) {
    // 小見出しの英字ラベル（*_tag）は日本語ページでは英語のまま見せるので数えない
    const same = Object.keys(en).filter(k => !k.endsWith('_tag') && dicts[code][k] === en[k]);
    assert.ok(same.length <= 8, `${code}: ${same.length} values identical to English: ${same.join(', ')}`);
  }
});

test('facts that must not change survive translation', () => {
  for (const {code} of LANGS) {
    const d = dicts[code];
    for (const [key, text] of [['price_p1', 'US$0.99'], ['price_p2', 'US$4.99'], ['price_p3', 'US$9.99'], ['faq1_a', 'US$0.99'],
      ['note1', '11'], ['flow1_p', '11'], ['faq6_a', '11'], ['note4', '30'], ['price_plan4', '30'], ['video_h2', '44']]) {
      assert.ok(d[key].includes(text), `${code}.${key} should contain ${text}: ${d[key]}`);
    }
    for (const key of ['hero_h1', 's1_h3', 's2_h3', 's3_h3', 's4_h3', 's5_h3', 's6_h3', 'cta_h2']) {
      assert.match(d[key], /<span class="accent">[^<]+<\/span>/, `${code}.${key} keeps its accent`);
    }
    assert.match(d.problem_p, /<span class="highlight">[^<]+<\/span>/, `${code}.problem_p keeps its highlight`);
  }
});

test('each page links every language, its own video, image folder and Play language', () => {
  for (const lang of LANGS) {
    const html = fs.readFileSync(outputPath(lang.code), 'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="${pageUrl(lang.code)}">`), lang.code);
    assert.equal((html.match(/<link rel="alternate" hreflang=/g) || []).length, LANGS.length + 1, lang.code);
    assert.ok(html.includes(`embed/${videos[lang.code]}?`), `${lang.code} video`);
    assert.ok(html.includes(`images/lp/${lang.code}/store-image-2.webp`), `${lang.code} images`);
    assert.ok(html.includes(`hl=${lang.hl}"`), `${lang.code} Play link`);
    assert.equal(/dir="rtl"/.test(html), lang.code === 'ar', `${lang.code} direction`);
  }
});

test('the light LP images exist for every language and are newer than the store images', () => {
  const files = ['store-image-feature', 'store-image-2', 'store-image-3', 'store-image-4', 'store-image-5', 'store-image-6', 'store-image-7'];
  for (const {code} of LANGS) {
    for (const name of files) {
      const lp = path.join(here, 'images/lp', code, name + '.webp');
      const store = path.join(here, 'images/store', code, name + '.png');
      assert.ok(fs.existsSync(lp), `${code}/${name}: run node kura/build-lp-images.mjs`);
      assert.ok(fs.statSync(lp).size < 150 * 1024, `${code}/${name} is too heavy for the LP`);
      assert.ok(fs.statSync(lp).mtimeMs >= fs.statSync(store).mtimeMs, `${code}/${name} is older than the store image: run node kura/build-lp-images.mjs ${code}`);
    }
  }
  const template = fs.readFileSync(path.join(here, 'lp-template.html'), 'utf8');
  for (const [, src] of template.matchAll(/src="\{\{@base\}\}((?:icons|images\/lp\/photos)\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(here, src)), src);
  }
});

test('the portal links the LP and the sitemap lists every language with alternates', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="\/kura\/(?:[a-zA-Z-]+\/)?"/);
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const {code} of LANGS) assert.ok(sitemap.includes(`<loc>${pageUrl(code)}</loc>`), code);
  const block = sitemap.slice(sitemap.indexOf('kura-lp:start'), sitemap.indexOf('kura-lp:end'));
  assert.equal((block.match(/<xhtml:link /g) || []).length, LANGS.length * (LANGS.length + 1));
});

test('search titles and descriptions fit in results and lead with Kura and the all-in-one message', () => {
  for (const {code} of LANGS) {
    const d = dicts[code], {title, desc} = limits(code);
    assert.ok(graphemes(d.seo_title) <= title, `${code}.seo_title: ${graphemes(d.seo_title)}/${title} ${d.seo_title}`);
    assert.ok(graphemes(d.seo_desc) <= desc, `${code}.seo_desc: ${graphemes(d.seo_desc)}/${desc} ${d.seo_desc}`);
    assert.match(d.seo_title, /^Kura[ :｜|]/, `${code}.seo_title starts with Kura`);
    assert.ok(d.seo_desc.includes('Kura') && d.seo_desc.includes('Android'), `${code}.seo_desc names Kura and Android`);
    assert.ok(/AI|IA|KI|ИИ|YZ|ذكي|الذكاء/.test(d.seo_title + d.seo_desc), `${code} mentions AI editing`);
    const html = fs.readFileSync(outputPath(code), 'utf8');
    assert.ok(html.includes(`<title>${d.seo_title.replace(/&/g, '&amp;')}</title>`), `${code} <title>`);
  }
});

test('structured data describes the app in the page language and the FAQ matches what is shown', () => {
  for (const lang of LANGS) {
    const d = dicts[lang.code];
    const html = fs.readFileSync(outputPath(lang.code), 'utf8');
    const [app, faq, crumbs] = jsonLdOf(html);
    assert.equal(app['@type'], 'SoftwareApplication');
    assert.equal(app.description, d.og_desc);
    assert.equal(app.inLanguage, lang.hreflang);
    assert.equal(app.installUrl, PLAY);
    assert.deepEqual(app.sameAs, [PLAY]);
    assert.equal(app.author.url, 'https://ramune441.github.io/');
    assert.ok(!('softwareVersion' in app), 'softwareVersion is not known reliably here');
    assert.deepEqual(app.featureList, FEATURE_KEYS.map(k => d[k]));
    const visible = unescape(html);
    for (const text of app.featureList) assert.ok(visible.includes(`<span>${text}</span>`) || visible.includes(`<h3>${text}</h3>`), `${lang.code} feature shown: ${text}`);
    assert.deepEqual(app.screenshot, screenshotUrls(lang.code));
    assert.equal(app.screenshot.length, listing.screenshotOrder.length);
    for (const url of app.screenshot) {
      assert.ok(url.startsWith(`https://ramune441.github.io/kura/images/store/${lang.code}/`), url);
      assert.ok(fs.existsSync(path.join(here, url.replace('https://ramune441.github.io/kura/', ''))), url);
    }
    // FAQPage = 見えている FAQ（質問と答えを同じ順で）
    const shown = [...html.matchAll(/<button class="faq-q"[^>]*><span>([^<]*)<\/span><\/button>\s*<div class="faq-a"><div class="faq-a-inner">([^<]*)<\/div>/g)]
      .map(m => [unescape(m[1]), unescape(m[2])]);
    assert.equal(faq['@type'], 'FAQPage');
    assert.equal(shown.length, 6);
    assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), shown, `${lang.code} FAQ`);
    assert.equal(crumbs['@type'], 'BreadcrumbList');
  }
});

test('every page declares its language and direction, and every image has alt text', () => {
  for (const lang of LANGS) {
    const html = fs.readFileSync(outputPath(lang.code), 'utf8');
    assert.match(html, new RegExp(`<html lang="${lang.hreflang}" dir="${lang.code === 'ar' ? 'rtl' : 'ltr'}"`), lang.code);
    for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(img, /\salt="[^"]*"/, `${lang.code}: ${img}`);
      // 内容を伝える画像（ストア画像）は空にしない。アイコンや飾りの写真は alt="" で読み上げない
      if (/images\/lp\/[a-zA-Z-]+\/store-image/.test(img)) assert.match(img, /\salt="[^"]+"/, `${lang.code}: ${img}`);
    }
  }
  for (const {file} of LEGAL_PAGES) {
    for (const [img] of fs.readFileSync(path.join(here, file), 'utf8').matchAll(/<img\b[^>]*>/g)) assert.match(img, /\salt="[^"]*"/, file);
  }
});

test('each LP links the privacy policy and account deletion in its own language', () => {
  for (const lang of LANGS) {
    const html = fs.readFileSync(outputPath(lang.code), 'utf8');
    const base = lang.code === 'en' ? '' : '../';
    assert.ok(html.includes(`href="${base}privacy-policy.html?lang=${lang.code}"`), `${lang.code} privacy link`);
    assert.ok(html.includes(`href="${base}delete-account.html?lang=${lang.code}"`), `${lang.code} delete link`);
  }
});

// ---- プライバシーポリシーとアカウント削除 ----
const legal = loadLegal(dicts); // throws on a missing/extra/empty key, HTML outside the allowed keys or a changed link
const appStrings = (() => {
  const context = {window: {}};
  vm.runInNewContext(fs.readFileSync(path.join(here, 'store-images-app-strings.js'), 'utf8'), context);
  return context.window.APP_STRINGS;
})();

test('the privacy policy and the deletion page have the same 20 languages as the LP, with every key filled', () => {
  const files = fs.readdirSync(path.join(here, 'legal-i18n')).map(f => f.replace('.json', '')).sort();
  assert.deepEqual(files, LANGS.map(l => l.code).sort());
  const keys = Object.keys(legal.en);
  for (const {code} of LANGS) {
    assert.deepEqual(Object.keys(legal[code]), keys, code);
    for (const k of keys) assert.ok(legal[code][k].trim(), `${code}.${k} is empty`);
  }
});

test('the legal pages and their language files are generated from the dictionaries (run node kura/build-lp.mjs)', () => {
  for (const page of LEGAL_PAGES) {
    assert.equal(fs.readFileSync(path.join(here, page.bundle), 'utf8'), legalBundle(page, legal), page.bundle);
    const html = fs.readFileSync(path.join(here, page.file), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(fillLegalPage(html, page, legal.ja), html, `${page.file}: Japanese default text`);
    // ページが使うキーと辞書のキーが一致する（題名と説明は <head> が使う）
    const used = [...html.matchAll(/\sdata-i18n(?:-html)?="(\w+)"/g)].map(m => m[1]);
    const own = Object.keys(legalStrings(page, legal.ja)).filter(k => !/_meta_(title|desc)$/.test(k));
    assert.equal(new Set(used).size, used.length, `${page.file}: a key is used twice`);
    const unusedUi = own.filter(k => k.startsWith('ui_') && !used.includes(k));
    assert.deepEqual(used.sort(), own.filter(k => !unusedUi.includes(k)).sort(), page.file);
    assert.ok(html.includes(`<script src="${page.bundle}"></script>\n  <script src="legal-i18n.js"></script>`), `${page.file} loads its strings, then the switcher`);
    assert.ok(html.includes('id="langSelect"'), `${page.file} has a language selector`);
    assert.ok(html.includes(`<link rel="canonical" href="https://ramune441.github.io/kura/${page.file}">`), page.file);
    assert.match(html, /<meta property="og:title" content="[^"]+">/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
  }
});

test('legal titles and descriptions fit search results', () => {
  for (const {code} of LANGS) {
    const {desc} = limits(code);
    for (const prefix of ['pp_', 'del_']) {
      const d = legal[code];
      assert.ok(graphemes(d[prefix + 'meta_desc']) <= desc, `${code}.${prefix}meta_desc: ${graphemes(d[prefix + 'meta_desc'])}/${desc}`);
      assert.match(d[prefix + 'meta_title'], /[|｜] ?Kura$/, `${code}.${prefix}meta_title`);
    }
  }
});

test("legal facts survive translation and use the app's own words", () => {
  for (const {code} of LANGS) {
    const d = legal[code], a = appStrings[code];
    for (const [key, text] of [['pp_age_p', '18'], ['pp_retention_li3', '30'], ['del_contact_p', '30'], ['pp_move_p', '7'],
      ['del_step2', 'DELETE'], ['del_step2', 'Delete everything'], ['pp_contact_p', 'warload57@gmail.com'],
      ['pp_ai_li1', 'Cloudflare Workers AI'], ['pp_backup_p2', 'Backblaze B2'], ['pp_maps_li2', 'OpenStreetMap'], ['pp_move_p', 'Google Takeout']]) {
      assert.ok(d[key].includes(text), `${code}.${key} should contain ${text}`);
    }
    // 削除の前にすること: アプリの画面の名前どおり（設定 › クラウドバックアップ › 自動バックアップ）
    for (const k of ['settings_title', 'cloud_title', 'settings_auto_backup']) assert.ok(d.del_before_p.includes(a[k]), `${code}.del_before_p uses "${a[k]}"`);
    assert.ok(d.pp_backup_li3.includes(a.lib_vault), `${code}.pp_backup_li3 names Private as the app does: ${a.lib_vault}`);
    for (const k of LEGAL_HTML_KEYS) assert.ok(d[k].includes('<a href="'), `${code}.${k} keeps its link`);
    if (code !== 'en') {
      const same = Object.keys(legal.en).filter(k => !k.startsWith('ui_') && d[k] === legal.en[k]);
      // 見出し 1 語（Contact など）は同じ綴りの言語がある
      assert.ok(same.length <= 2 && same.every(k => k.endsWith('_h')), `${code}: identical to English: ${same.join(', ')}`);
    }
  }
});

test('the privacy policy makes no claim the app contradicts', () => {
  // サインインは必須、削除は Web のページ、旧名「保管庫」は使わない
  const ja = Object.entries(legal.ja).filter(([k]) => k.startsWith('pp_')).map(([, v]) => v).join('\n');
  const en = Object.entries(legal.en).filter(([k]) => k.startsWith('pp_')).map(([, v]) => v).join('\n');
  assert.doesNotMatch(ja, /サインインは任意|「クラウド」画面|保管庫/);
  assert.doesNotMatch(en, /Signing in is optional|app's Cloud screen|vault/i);
  for (const code of ['ja', 'en']) assert.ok(legal[code].pp_retention_li2.includes('https://kura-api.warload57.workers.dev/web/delete'));
});
