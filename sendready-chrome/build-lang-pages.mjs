// SendReady の LP と使い方ページの言語別静的ページを生成する。
//   node build-lang-pages.mjs
// index.html（LP・en・ルート）と how-to.html（使い方・en・ルート）をテンプレートに、i18n-lp.js の
// LP_MESSAGES で本文を埋めた <lang>/index.html・<lang>/how-to.html を全言語ぶん書き出し、各ページの
// <head> の SEO ブロック（title・description・canonical・hreflang・OGP・JSON-LD）と
// sitemap.xml の sendready-lp 部分を作り直す。
// 文言を変えたら i18n-lp.js を直してから実行し、生成物ごとコミットする。
// JSON-LD の softwareVersion は拡張の manifest.json（SENDREADY_EXT、既定は同階層の SendReady-Chrome）から取る。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = "https://ramune441.github.io/";
const SITE = `${ROOT}sendready-chrome/`;
const STORE = "https://chromewebstore.google.com/detail/nbjmakcblclblgapocdeaojgacegpono";
const EXT = process.env.SENDREADY_EXT || join(DIR, "..", "..", "SendReady-Chrome");
const OG_LOCALE = {
  en: "en_US", ja: "ja_JP", zh: "zh_CN", ko: "ko_KR", es: "es_ES", fr: "fr_FR",
  de: "de_DE", pt: "pt_BR", hi: "hi_IN", id: "id_ID", ar: "ar_AR",
  "zh-TW": "zh_TW", it: "it_IT", nl: "nl_NL", pl: "pl_PL", ru: "ru_RU", tr: "tr_TR",
  vi: "vi_VN", th: "th_TH", bn: "bn_BD",
};
// hreflang は BCP 47。pt の LP は ブラジルポルトガル語、zh は簡体字
const HREFLANG = { zh: "zh-Hans", pt: "pt-BR" };
const hreflang = (l) => HREFLANG[l] || l;

// ページの種類。file はルートと <lang>/ に置くファイル名、path は URL のファイル部分
const PAGES = {
  lp: { file: "index.html", path: "" },
  howto: { file: "how-to.html", path: "how-to.html" },
};

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

// 拡張の版。拡張ソースが無い環境では生成済み LP の版を引き継ぐ（生成物を変えないため）
function extensionVersion() {
  const manifest = join(EXT, "manifest.json");
  if (existsSync(manifest)) return JSON.parse(readFileSync(manifest, "utf8")).version;
  const m = readFileSync(join(DIR, "index.html"), "utf8").match(/"softwareVersion":"([^"]+)"/);
  if (m) {
    console.warn(`拡張の manifest.json が無い（${manifest}）。生成済みの版 ${m[1]} を使う`);
    return m[1];
  }
  throw new Error(`拡張の manifest.json が無い: ${manifest}（SENDREADY_EXT で場所を指定する）`);
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => esc(s).replace(/"/g, "&quot;");
// FAQ 回答などの HTML（<code> 等）を JSON-LD 用のプレーンテキストにする
const plain = (s) => String(s).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// テンプレートは CRLF のこともあるので LF に揃えて扱う（git が正規化するので差分にならない）
const readText = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const pageURL = (lang, page = "lp") => `${SITE}${lang === "en" ? "" : lang + "/"}${PAGES[page].path}`;
const storeURL = (lang) => `${STORE}?utm_source=sendready-lp&utm_medium=web&utm_campaign=${lang}`;
// 言語別のストア画像が無い言語は en の画像を使う
const imageDir = (lang) =>
  lang !== "en" && existsSync(join(DIR, "images", lang, "store-image-1.png")) ? lang + "/" : "";
const screenshots = (lang) => [1, 2, 3, 4, 5].map((i) => {
  const rel = `images/${imageDir(lang)}store-image-${i}.png`;
  if (!existsSync(join(DIR, rel))) throw new Error(`ストア画像が無い: ${rel}`);
  return SITE + rel;
});

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

// data-i18n-alt="key" の要素の alt を差し替える
function translateAlt(html, msgs) {
  return html.replace(/<img\b[^>]*\sdata-i18n-alt="([^"]+)"[^>]*>/g, (tag, key) => {
    if (msgs[key] === undefined) throw new Error(`辞書にないキー: ${key}`);
    const alt = `alt="${attr(msgs[key])}"`;
    return /\salt="[^"]*"/.test(tag) ? tag.replace(/alt="[^"]*"/, alt) : tag.replace(/^<img\b/, `<img ${alt}`);
  });
}

// 使い方ページの番号付きステップ（i18n のパイプ区切り）を書き出す。動画との同期区間は data-ranges
function renderSteps(html, msgs) {
  return html.replace(
    /(<ol class="vsteps" data-key="([^"]+)" data-ranges="([^"]+)">)[\s\S]*?(<\/ol>)/g,
    (_, open, key, ranges, close) => {
      if (msgs[key] === undefined) throw new Error(`辞書にないキー: ${key}`);
      const r = ranges.split(",");
      const parts = msgs[key].split("|");
      if (parts.length !== r.length - 1) throw new Error(`${key} の手順数（${parts.length}）が区間数と合わない`);
      return open + parts.map((p, i) => `<li data-from="${r[i]}" data-to="${r[i + 1]}">${p}</li>`).join("") + close;
    },
  );
}

// ── <head> の SEO ブロック ──────────────────────────────────────────
const ld = (o) => `  <script type="application/ld+json">\n  ${JSON.stringify(o)}\n  </script>`;

function metaTags({ lang, page, title, desc, langs }) {
  const url = pageURL(lang, page);
  const img = screenshots(lang)[0];
  const alt = langs
    .map((l) => `  <link rel="alternate" hreflang="${hreflang(l)}" href="${pageURL(l, page)}">`)
    .concat(`  <link rel="alternate" hreflang="x-default" href="${pageURL("en", page)}">`)
    .join("\n");
  return [
    `  <title>${esc(title)}</title>`,
    `  <meta name="description" content="${attr(desc)}">`,
    `  <meta name="robots" content="index, follow">`,
    `  <link rel="canonical" href="${url}">`,
    alt,
    `  <meta property="og:title" content="${attr(title)}">`,
    `  <meta property="og:description" content="${attr(desc)}">`,
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:image" content="${img}">`,
    `  <meta property="og:image:width" content="1280">`,
    `  <meta property="og:image:height" content="800">`,
    `  <meta property="og:image:alt" content="${attr(title)}">`,
    `  <meta property="og:locale" content="${OG_LOCALE[lang]}">`,
    `  <meta property="og:site_name" content="SendReady">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${attr(title)}">`,
    `  <meta name="twitter:description" content="${attr(desc)}">`,
    `  <meta name="twitter:image" content="${img}">`,
  ].join("\n");
}

function softwareApp(lang, msgs, version) {
  return {
    "@type": "SoftwareApplication",
    name: "SendReady",
    description: msgs.seo_desc,
    url: pageURL(lang),
    inLanguage: hreflang(lang),
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome",
    softwareVersion: version,
    installUrl: storeURL(lang),
    sameAs: [STORE],
    featureList: [1, 2, 3, 4, 5, 6].map((i) => plain(msgs[`feat${i}_h3`])),
    screenshot: screenshots(lang),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: "Ramune", url: ROOT },
  };
}

function lpSeo(lang, msgs, langs, version) {
  const url = pageURL(lang);
  const faq = [1, 2, 3, 4]
    .filter((i) => msgs[`faq${i}_q`] && msgs[`faq${i}_a`])
    .map((i) => ({
      "@type": "Question",
      name: plain(msgs[`faq${i}_q`]),
      acceptedAnswer: { "@type": "Answer", text: plain(msgs[`faq${i}_a`]) },
    }));
  return [
    metaTags({ lang, page: "lp", title: msgs.seo_title, desc: msgs.seo_desc, langs }),
    ld({ "@context": "https://schema.org", ...softwareApp(lang, msgs, version) }),
    ld({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: hreflang(lang), mainEntity: faq }),
    ld({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ramune Apps", item: ROOT },
        { "@type": "ListItem", position: 2, name: "SendReady", item: url },
      ],
    }),
  ].join("\n");
}

function howtoSeo(lang, msgs, langs, version) {
  const url = pageURL(lang, "howto");
  return [
    metaTags({ lang, page: "howto", title: msgs.howto_seo_title, desc: msgs.howto_seo_desc, langs }),
    ld({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: msgs.howto_seo_title,
      description: msgs.howto_seo_desc,
      url,
      inLanguage: hreflang(lang),
      image: screenshots(lang)[0],
      step: [1, 2, 3, 4].map((i) => ({
        "@type": "HowToStep",
        position: i,
        name: plain(msgs[`flow${i}_h3`]),
        text: plain(msgs[`flow${i}_p`]),
      })),
      about: softwareApp(lang, msgs, version),
    }),
    ld({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ramune Apps", item: ROOT },
        { "@type": "ListItem", position: 2, name: "SendReady", item: pageURL(lang) },
        { "@type": "ListItem", position: 3, name: plain(msgs.nav_howto), item: url },
      ],
    }),
  ].join("\n");
}

// ── 1ページ分 ─────────────────────────────────────────────────────
function buildPage(template, page, lang, msgs, ctx) {
  const isRoot = lang === "en";
  // <head> と <body> を分け、本文だけ訳す（head のスクリプトや SEO ブロックは触らない）
  const bodyAt = template.indexOf("<body>");
  let head = template.slice(0, bodyAt), body = template.slice(bodyAt);
  body = translateAlt(translateBody(body, msgs), msgs);
  if (page === "howto") body = renderSteps(body, msgs);
  // 本文のウェブストアへのリンク（流入元を言語別に計測）。head の JSON-LD（sameAs は utm 無し）は触らない
  body = body.replace(new RegExp(STORE.replace(/[.?/]/g, "\\$&") + `[^"]*`, "g"), storeURL(lang));

  const seo = page === "lp" ? lpSeo(lang, msgs, ctx.langs, ctx.version) : howtoSeo(lang, msgs, ctx.langs, ctx.version);
  head = head.replace(
    /<!-- seo:start([^>]*)-->[\s\S]*?<!-- seo:end -->/,
    (_, note) => `<!-- seo:start${note}-->\n${seo}\n  <!-- seo:end -->`,
  );
  head = head.replace(
    /<html\b[^>]*>/,
    `<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}" data-lp-base="${isRoot ? "./" : "../"}"` +
      (page === "lp" ? "" : ` data-lp-page="${PAGES[page].file}"`) +
      (isRoot ? "" : ` data-lp-lang="${lang}"`) +
      ` prefix="og: https://ogp.me/ns#">`,
  );
  let html = head + body;

  // その言語のプロモ動画
  html = html.replace(/(id="promo-video" src="https:\/\/www\.youtube\.com\/embed\/)[^"]+/, `$1${ctx.videos[lang] || ctx.videos.en}`);

  // サブディレクトリに置くので、相対パスの src / href を 1 階層上へ。
  // LP（./）と使い方（how-to.html）は同じ言語のページを指すのでそのまま、
  // 言語別 URL を持たない問い合わせ・プライバシーポリシーは ?lang= を付けて開く
  if (!isRoot) {
    html = html.replace(/\b(src|href)=(["'])(?![a-z][a-z0-9+.-]*:|#|\/|\.\.\/)([^"']+)\2/gi, (m, a, q, p) => {
      if (p === "./" || p === PAGES.howto.file) return m;
      if (/^(contact|privacy-policy)\.html$/.test(p)) return `${a}=${q}../${p}?lang=${lang}${q}`;
      return `${a}=${q}../${p}${q}`;
    });
  }
  return html;
}

// ── sitemap.xml の SendReady 部分（LP と使い方） ─────────────────────
function updateSitemap(langs) {
  const p = join(DIR, "..", "sitemap.xml");
  let xml = readText(p);
  const today = new Date().toISOString().slice(0, 10);
  const entries = (page, top, rest) => {
    const alts = langs
      .map((l) => `    <xhtml:link rel="alternate" hreflang="${hreflang(l)}" href="${pageURL(l, page)}"/>`)
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageURL("en", page)}"/>`)
      .join("\n");
    return langs.map((l) =>
      `  <url>\n    <loc>${pageURL(l, page)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${l === "en" ? top : rest}</priority>\n${alts}\n  </url>`);
  };
  const block = [...entries("lp", "0.9", "0.8"), ...entries("howto", "0.7", "0.6")].join("\n");
  const marked = /  <!-- sendready-lp:start[^>]*-->[\s\S]*?<!-- sendready-lp:end -->/;
  const wrapped = `  <!-- sendready-lp:start（sendready-chrome/build-lang-pages.mjs が生成） -->\n${block}\n  <!-- sendready-lp:end -->`;
  if (!marked.test(xml)) throw new Error("sitemap.xml に sendready-lp の印が無い");
  xml = xml.replace(marked, wrapped);
  writeFileSync(p, xml);
}

// ── main ─────────────────────────────────────────────────────────
const { M, V } = loadMessages();
const langs = Object.keys(M);
for (const l of langs) {
  for (const k of ["seo_title", "seo_desc", "howto_seo_title", "howto_seo_desc"]) {
    if (!M[l][k]) throw new Error(`${k} が無い: ${l}`);
  }
}
const ctx = { langs, videos: V, version: extensionVersion() };
for (const page of Object.keys(PAGES)) {
  const { file } = PAGES[page];
  const template = readText(join(DIR, file));
  for (const lang of langs) {
    const html = buildPage(template, page, lang, M[lang], ctx);
    const out = lang === "en" ? join(DIR, file) : join(DIR, lang, file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
  }
  console.log(`wrote ${file} + ${langs.length - 1} languages`);
}
updateSitemap(langs);
console.log("updated ../sitemap.xml");
