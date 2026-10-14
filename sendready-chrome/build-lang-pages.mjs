// SendReady LP の言語別静的ページを生成する。
//   node build-lang-pages.mjs
// index.html（en・ルート）をテンプレートに、i18n-lp.js の LP_MESSAGES で本文を埋めた
// <lang>/index.html を全言語ぶん書き出し、各ページの <head> の SEO ブロック（title・description・
// canonical・hreflang・OGP・JSON-LD）と sitemap.xml の SendReady LP 部分を作り直す。
// 文言を変えたら i18n-lp.js を直してから実行し、生成物ごとコミットする。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DIR = dirname(fileURLToPath(import.meta.url));
const SITE = "https://ramune441.github.io/sendready-chrome/";
const STORE = "https://chromewebstore.google.com/detail/nbjmakcblclblgapocdeaojgacegpono";
const OG_LOCALE = {
  en: "en_US", ja: "ja_JP", zh: "zh_CN", ko: "ko_KR", es: "es_ES", fr: "fr_FR",
  de: "de_DE", pt: "pt_BR", hi: "hi_IN", id: "id_ID", ar: "ar_AR",
};
// hreflang は BCP 47。pt の LP は ブラジルポルトガル語、zh は簡体字
const HREFLANG = { zh: "zh-Hans", pt: "pt-BR" };

// ── i18n-lp.js を読む（DOM 部分は動かさない） ──────────────────────
function loadMessages() {
  const ctx = { document: { readyState: "loading", addEventListener() {} } };
  vm.createContext(ctx);
  vm.runInContext(
    readFileSync(join(DIR, "i18n-lp.js"), "utf8") + "\n;this.M = LP_MESSAGES; this.V = LP_VIDEO_IDS;",
    ctx,
  );
  return { M: ctx.M, V: ctx.V };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => esc(s).replace(/"/g, "&quot;");
// FAQ 回答の HTML（<code> 等）を JSON-LD 用のプレーンテキストにする
const plain = (s) => String(s).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const pageURL = (lang) => (lang === "en" ? SITE : `${SITE}${lang}/`);
const storeURL = (lang) => `${STORE}?utm_source=sendready-lp&utm_medium=web&utm_campaign=${lang}`;

// ── data-i18n / data-i18n-html の要素の中身を差し替える ─────────────
// 同名タグの入れ子を数えて閉じタグを探す（本文に同名タグが入れ子になっていても壊さない）
function translateBody(html, msgs) {
  const open = /<([a-zA-Z][\w-]*)\b[^>]*?\sdata-i18n(-html)?="([^"]+)"[^>]*>/g;
  let out = "", pos = 0, m, missing = [];
  while ((m = open.exec(html))) {
    const [tag, name, isHtml, key] = m;
    const innerStart = m.index + tag.length;
    const re = new RegExp(`<${name}\\b[^>]*>|</${name}>`, "gi");
    re.lastIndex = innerStart;
    let depth = 1, close;
    while (depth && (close = re.exec(html))) depth += close[0][1] === "/" ? -1 : 1;
    if (depth) throw new Error(`閉じタグが見つからない: ${key}`);
    const value = msgs[key];
    if (value === undefined) { missing.push(key); continue; }
    out += html.slice(pos, innerStart) + (isHtml ? value : esc(value));
    pos = close.index;
    open.lastIndex = close.index;
  }
  if (missing.length) throw new Error(`辞書にないキー: ${missing.join(", ")}`);
  return out + html.slice(pos);
}

// ── <head> の SEO ブロック ──────────────────────────────────────────
function seoBlock(lang, msgs, langs) {
  const url = pageURL(lang);
  const img = `${SITE}images/${lang === "en" ? "" : lang + "/"}store-image-1.png`;
  const alt = langs
    .map((l) => `  <link rel="alternate" hreflang="${HREFLANG[l] || l}" href="${pageURL(l)}">`)
    .concat(`  <link rel="alternate" hreflang="x-default" href="${SITE}">`)
    .join("\n");
  const faq = [1, 2, 3, 4]
    .filter((i) => msgs[`faq${i}_q`] && msgs[`faq${i}_a`])
    .map((i) => ({
      "@type": "Question",
      name: plain(msgs[`faq${i}_q`]),
      acceptedAnswer: { "@type": "Answer", text: plain(msgs[`faq${i}_a`]) },
    }));
  const ld = (o) => `  <script type="application/ld+json">\n  ${JSON.stringify(o)}\n  </script>`;
  return [
    `  <title>${esc(msgs.seo_title)}</title>`,
    `  <meta name="description" content="${attr(msgs.seo_desc)}">`,
    `  <meta name="robots" content="index, follow">`,
    `  <link rel="canonical" href="${url}">`,
    alt,
    `  <meta property="og:title" content="${attr(msgs.seo_title)}">`,
    `  <meta property="og:description" content="${attr(msgs.seo_desc)}">`,
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:image" content="${img}">`,
    `  <meta property="og:image:width" content="1280">`,
    `  <meta property="og:image:height" content="800">`,
    `  <meta property="og:image:alt" content="${attr(msgs.seo_title)}">`,
    `  <meta property="og:locale" content="${OG_LOCALE[lang]}">`,
    `  <meta property="og:site_name" content="SendReady">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${attr(msgs.seo_title)}">`,
    `  <meta name="twitter:description" content="${attr(msgs.seo_desc)}">`,
    `  <meta name="twitter:image" content="${img}">`,
    ld({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "SendReady",
      description: msgs.seo_desc,
      url,
      inLanguage: HREFLANG[lang] || lang,
      applicationCategory: "BrowserApplication",
      operatingSystem: "Chrome",
      installUrl: STORE,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@type": "Person", name: "Ramune" },
    }),
    ld({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: HREFLANG[lang] || lang, mainEntity: faq }),
    ld({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ramune Apps", item: "https://ramune441.github.io/" },
        { "@type": "ListItem", position: 2, name: "SendReady", item: url },
      ],
    }),
  ].join("\n");
}

// ── 1ページ分 ─────────────────────────────────────────────────────
function buildPage(template, lang, msgs, videos, langs) {
  const isRoot = lang === "en";
  let html = template;

  // <head> と <body> を分け、本文だけ訳す（head のスクリプトや SEO ブロックは触らない）
  const bodyAt = html.indexOf("<body>");
  let head = html.slice(0, bodyAt), body = html.slice(bodyAt);
  body = translateBody(body, msgs);

  head = head.replace(
    /<!-- seo:start([^>]*)-->[\s\S]*?<!-- seo:end -->/,
    (_, note) => `<!-- seo:start${note}-->\n${seoBlock(lang, msgs, langs)}\n  <!-- seo:end -->`,
  );
  head = head.replace(
    /<html\b[^>]*>/,
    `<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}" data-lp-base="${isRoot ? "./" : "../"}"${isRoot ? "" : ` data-lp-lang="${lang}"`} prefix="og: https://ogp.me/ns#">`,
  );
  html = head + body;

  // ウェブストアへのリンク（流入元を言語別に計測）
  html = html.replace(new RegExp(STORE.replace(/[.?/]/g, "\\$&") + `[^"]*`, "g"), storeURL(lang));
  // その言語のプロモ動画
  html = html.replace(/(id="promo-video" src="https:\/\/www\.youtube\.com\/embed\/)[^"]+/, `$1${videos[lang] || videos.en}`);

  // サブディレクトリに置くので、相対パスの src / href を 1 階層上へ
  if (!isRoot) {
    html = html.replace(/\b(src|href)=(["'])(?![a-z][a-z0-9+.-]*:|#|\/|\.\.\/)([^"']+)\2/gi, "$1=$2../$3$2");
  }
  return html;
}

// ── sitemap.xml の SendReady LP 部分 ────────────────────────────────
function updateSitemap(langs) {
  const p = join(DIR, "..", "sitemap.xml");
  let xml = readFileSync(p, "utf8");
  const today = new Date().toISOString().slice(0, 10);
  const alts = langs
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l] || l}" href="${pageURL(l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}"/>`)
    .join("\n");
  const block = langs
    .map((l) => `  <url>\n    <loc>${pageURL(l)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${l === "en" ? "0.9" : "0.8"}</priority>\n${alts}\n  </url>`)
    .join("\n");
  const marked = /  <!-- sendready-lp:start[^>]*-->[\s\S]*?<!-- sendready-lp:end -->/;
  const wrapped = `  <!-- sendready-lp:start（sendready-chrome/build-lang-pages.mjs が生成） -->\n${block}\n  <!-- sendready-lp:end -->`;
  if (marked.test(xml)) {
    xml = xml.replace(marked, wrapped);
  } else {
    // 初回: 既存のルート LP の <url> を差し替える
    const single = new RegExp(`  <url>\\s*<loc>${SITE.replace(/[.?/]/g, "\\$&")}</loc>[\\s\\S]*?</url>`);
    if (!single.test(xml)) throw new Error("sitemap.xml に SendReady LP の <url> が無い");
    xml = xml.replace(single, wrapped);
  }
  if (!xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) {
    xml = xml.replace(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    );
  }
  writeFileSync(p, xml);
}

// ── main ─────────────────────────────────────────────────────────
const { M, V } = loadMessages();
const langs = Object.keys(M);
for (const l of langs) {
  if (!M[l].seo_title || !M[l].seo_desc) throw new Error(`seo_title / seo_desc が無い: ${l}`);
}
const template = readFileSync(join(DIR, "index.html"), "utf8");
for (const lang of langs) {
  const html = buildPage(template, lang, M[lang], V, langs);
  const out = lang === "en" ? join(DIR, "index.html") : join(DIR, lang, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`wrote ${lang === "en" ? "index.html" : lang + "/index.html"}`);
}
updateSitemap(langs);
console.log("updated ../sitemap.xml");
