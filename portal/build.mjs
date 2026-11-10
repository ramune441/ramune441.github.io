// ポータル（全プロダクト一覧）を 20 言語の静的ページとして生成する。
//   node portal/build.mjs
// 文言は portal/i18n.json が正。ja はルート /index.html、他の言語は /<lang>/index.html。
// 各カードのリンクは、その言語のプロダクトページがあればそこへ、無ければプロダクトのルートへ向ける。
// プロダクトの言語ページを足したら再実行して生成物ごとコミットする。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://ramune441.github.io/";
export const DEFAULT_LANG = "ja";
// hreflang は BCP 47（zh は簡体字、pt はブラジルポルトガル語）
const HREFLANG = { zh: "zh-Hans", pt: "pt-BR" };
const OG_LOCALE = {
  en: "en_US", ja: "ja_JP", zh: "zh_CN", "zh-TW": "zh_TW", ko: "ko_KR", es: "es_ES", fr: "fr_FR",
  de: "de_DE", pt: "pt_BR", hi: "hi_IN", id: "id_ID", ar: "ar_AR", it: "it_IT", nl: "nl_NL",
  pl: "pl_PL", ru: "ru_RU", tr: "tr_TR", vi: "vi_VN", th: "th_TH", bn: "bn_BD",
};
const LANG_NAME = {
  en: "English", ja: "日本語", zh: "简体中文", "zh-TW": "繁體中文", ko: "한국어", es: "Español",
  fr: "Français", de: "Deutsch", pt: "Português", hi: "हिन्दी", id: "Bahasa Indonesia", ar: "العربية",
  it: "Italiano", nl: "Nederlands", pl: "Polski", ru: "Русский", tr: "Türkçe", vi: "Tiếng Việt",
  th: "ไทย", bn: "বাংলা",
};
// プロダクトごとに、言語ページのディレクトリ名が違うもの（FormPilot の繁体字は zh-Hant）
const DIR_ALIAS = { "zh-TW": ["zh-TW", "zh-Hant"] };

export const loadMessages = () => JSON.parse(readFileSync(join(ROOT, "portal", "i18n.json"), "utf8"));
export const pageURL = (lang) => (lang === DEFAULT_LANG ? SITE : `${SITE}${lang}/`);
export const pagePath = (lang) => join(ROOT, ...(lang === DEFAULT_LANG ? [] : [lang]), "index.html");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => esc(s).replace(/"/g, "&quot;");

// その言語のプロダクトページ（無ければルート）
function productHref(dir, lang) {
  for (const d of DIR_ALIAS[lang] || [lang]) {
    if (existsSync(join(ROOT, dir, d, "index.html"))) return `/${dir}/${d}/`;
  }
  return `/${dir}/`;
}

function products(m, lang) {
  return [
    { name: "FormPilot", dir: "formpilot", kind: "chrome", desc: m.f },
    { name: m.ashiatoName, alt: "足あとメーカー", dir: "ashiato-maker", kind: "chrome", desc: m.ashiatoDesc },
    { name: "SendReady", dir: "sendready-chrome", kind: "chrome", desc: m.sendreadyDesc },
    { name: "SubDuo", dir: "subduo", kind: "chrome", desc: m.subduoDesc },
    { name: "Kura", dir: "kura", kind: "android", desc: m.kuraDesc, category: "MultimediaApplication" },
    { name: "Ripen", dir: "ripen", kind: "android", desc: m.r, category: "LifestyleApplication" },
    { name: "Charmly", url: "https://charm-ly.com/", kind: "web", desc: m.c },
    { name: "Cookpal", url: "https://cookpal-ai.com/", kind: "web", desc: m.k },
  ].map((p) => ({ ...p, href: p.url || productHref(p.dir, lang) }));
}

function jsonLd(lang, m, items) {
  const ld = (o) => `  <script type="application/ld+json">\n  ${JSON.stringify(o)}\n  </script>`;
  const inLanguage = HREFLANG[lang] || lang;
  const element = (p, i) => {
    const item = { "@type": p.kind === "web" ? "WebApplication" : "SoftwareApplication", name: p.name };
    if (p.alt && p.alt !== p.name) item.alternateName = p.alt;
    item.url = p.url || SITE + p.href.slice(1);
    item.applicationCategory = p.kind === "chrome" ? "BrowserApplication" : p.category || "LifestyleApplication";
    if (p.kind !== "web") item.operatingSystem = p.kind === "chrome" ? "Chrome" : "Android";
    item.description = p.desc;
    item.author = { "@id": `${SITE}#person` };
    return { "@type": "ListItem", position: i + 1, item };
  };
  return [
    ld({ "@context": "https://schema.org", "@type": "WebSite", name: "Ramune Apps", url: pageURL(lang), inLanguage, publisher: { "@id": `${SITE}#person` } }),
    ld({ "@context": "https://schema.org", "@type": "Person", "@id": `${SITE}#person`, name: "Ramune", url: SITE, sameAs: ["https://github.com/ramune441"] }),
    ld({ "@context": "https://schema.org", "@type": "ItemList", name: m.list, inLanguage, numberOfItems: items.length, itemListElement: items.map(element) }),
  ].join("\n");
}

export function buildPage(lang, M) {
  const m = M[lang];
  const langs = Object.keys(M);
  const url = pageURL(lang);
  const items = products(m, lang);
  const isRoot = lang === DEFAULT_LANG;
  const alternates = langs
    .map((l) => `  <link rel="alternate" hreflang="${HREFLANG[l] || l}" href="${pageURL(l)}">`)
    .concat(`  <link rel="alternate" hreflang="x-default" href="${pageURL("en")}">`)
    .join("\n");
  const options = langs
    .map((l) => `<option value="${pageURL(l).slice(SITE.length - 1)}"${l === lang ? " selected" : ""}>${LANG_NAME[l]}</option>`)
    .join("");
  const cards = items
    .map((p) => {
      const ext = p.url ? ' target="_blank" rel="noopener"' : "";
      const label = { chrome: m.chrome, android: m.android, web: m.web }[p.kind];
      return `        <a class="card" href="${p.href}"${ext}>
          <span class="card-platform ${p.kind}">${esc(label)}</span>
          <h2>${esc(p.name)}</h2>
          <p>${esc(p.desc)}</p>
        </a>`;
    })
    .join("\n\n");
  const ogImage = `${SITE}formpilot/store-image-1.png`;

  return `<!DOCTYPE html>
<!-- portal/build.mjs が portal/i18n.json から生成。直接編集しない -->
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}" prefix="og: https://ogp.me/ns#">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-4YHTG3FQSX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-4YHTG3FQSX');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${isRoot ? `  <meta name="google-site-verification" content="prSam5v9XLSOs51WRCTyq592bxz1Xmf6HiBGRA-_ke0" />
  <meta name="msvalidate.01" content="1C375C5F8B9811B7B6156E4202B36EA4" />
` : ""}  <title>${esc(m.t)}</title>
  <meta name="description" content="${attr(m.d)}">
  <meta name="author" content="Ramune">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
${alternates}

  <!-- OGP -->
  <meta property="og:title" content="${attr(m.t)}">
  <meta property="og:description" content="${attr(m.d)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="800">
  <meta property="og:image:alt" content="${attr(m.t)}">
  <meta property="og:locale" content="${OG_LOCALE[lang]}">
  <meta property="og:site_name" content="Ramune Apps">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(m.t)}">
  <meta name="twitter:description" content="${attr(m.d)}">
  <meta name="twitter:image" content="${ogImage}">

${jsonLd(lang, m, items)}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap">

  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Noto Sans JP', system-ui, sans-serif;
      background: linear-gradient(135deg, #0a0e1a 0%, #1e1b4b 50%, #312e81 100%);
      color: #e2e8f0;
      min-height: 100vh;
      line-height: 1.7;
    }
    .container { max-width: 1100px; margin: 0 auto; padding: clamp(40px, 8vw, 80px) clamp(20px, 5vw, 40px); }
    .langbar { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .langbar select {
      background: rgba(255, 255, 255, 0.06); color: #e2e8f0; border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 999px; padding: 6px 14px; font: inherit; font-size: 14px;
    }
    .langbar option { color: #0f172a; }
    header { text-align: center; margin-bottom: clamp(40px, 8vw, 80px); }
    h1 {
      font-size: clamp(36px, 6vw, 64px);
      font-weight: 900;
      background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }
    .tagline {
      font-size: clamp(16px, 2.5vw, 22px);
      color: #94a3b8;
      max-width: 700px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: clamp(20px, 3vw, 32px);
    }
    .card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: clamp(24px, 4vw, 36px);
      text-decoration: none;
      color: inherit;
      display: block;
      transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(167, 139, 250, 0.5);
      background: rgba(255, 255, 255, 0.07);
    }
    .card-platform {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    .card-platform.chrome { background: rgba(52, 211, 153, 0.15); color: #34d399; }
    .card-platform.android { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
    .card-platform.web { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
    .card h2 {
      font-size: clamp(22px, 3vw, 28px);
      font-weight: 800;
      margin-bottom: 12px;
      color: #f8fafc;
      overflow-wrap: anywhere;
    }
    .card p {
      font-size: 15px;
      color: #94a3b8;
    }
    footer {
      text-align: center;
      margin-top: clamp(40px, 8vw, 80px);
      padding-top: 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="langbar">
      <select aria-label="${attr(m.lang)}" onchange="location.href=this.value">${options}</select>
    </div>
    <header>
      <h1>Ramune Apps</h1>
      <p class="tagline">${esc(m.tag)}</p>
    </header>

    <main>
      <div class="grid">
${cards}
      </div>
    </main>

    <footer>
      <p>&copy; 2026 Ramune. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>
`;
}

// sitemap.xml のポータル部分（ルートの <url> を 20 言語ぶんに置き換える）
export function sitemapBlock(M) {
  const langs = Object.keys(M);
  const today = new Date().toISOString().slice(0, 10);
  const alts = langs
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l] || l}" href="${pageURL(l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageURL("en")}"/>`)
    .join("\n");
  const urls = langs
    .map((l) => `  <url>\n    <loc>${pageURL(l)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${l === DEFAULT_LANG ? "1.0" : "0.8"}</priority>\n${alts}\n  </url>`)
    .join("\n");
  return `  <!-- portal:start（portal/build.mjs が生成） -->\n${urls}\n  <!-- portal:end -->`;
}

function updateSitemap(M) {
  const p = join(ROOT, "sitemap.xml");
  let xml = readFileSync(p, "utf8");
  const marked = /  <!-- portal:start[^>]*-->[\s\S]*?<!-- portal:end -->/;
  const single = /  <url>\s*<loc>https:\/\/ramune441\.github\.io\/<\/loc>[\s\S]*?<\/url>/;
  if (marked.test(xml)) xml = xml.replace(marked, sitemapBlock(M));
  else if (single.test(xml)) xml = xml.replace(single, sitemapBlock(M));
  else throw new Error("sitemap.xml にポータルの <url> が無い");
  writeFileSync(p, xml);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const M = loadMessages();
  for (const lang of Object.keys(M)) {
    const out = pagePath(lang);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, buildPage(lang, M));
    console.log(`wrote ${lang === DEFAULT_LANG ? "index.html" : lang + "/index.html"}`);
  }
  if (process.argv.includes("--sitemap")) {
    updateSitemap(M);
    console.log("updated sitemap.xml");
  }
}
