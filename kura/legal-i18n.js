// Kura のプライバシーポリシーとアカウント削除のページの言語切り替え（両ページ共通）。
// 文言は先に読む i18n-pp.js / i18n-delete.js（window.KURA_LEGAL。node kura/build-lp.mjs が生成）にある。
// 言語は ?lang=<lang> > 前に選んだ言語（localStorage kura_lang）> ブラウザの言語 > 英語。HTML の既定文は日本語。
(function () {
  var data = window.KURA_LEGAL;
  if (!data) return;
  var KEY = 'kura_lang';
  var root = document.documentElement;
  var langs = {};
  data.langs.forEach(function (l) { langs[l[0]] = {code: l[0], name: l[1], hreflang: l[2], ogLocale: l[3], font: l[4]}; });
  var canonical = (document.querySelector('link[rel="canonical"]') || {}).href || location.href.split(/[?#]/)[0];

  function normalize(tag) {
    if (!tag) return null;
    var t = String(tag).replace('_', '-').toLowerCase();
    if (/^zh-(tw|hk|mo)|^zh-hant/.test(t)) return 'zh-TW';
    var short = t.split('-')[0];
    if (short === 'in') short = 'id';
    for (var code in langs) if (code.toLowerCase() === t || code === short) return code;
    return null;
  }
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(code) { try { localStorage.setItem(KEY, code); } catch (e) {} }
  function setMeta(sel, value) { var el = document.querySelector(sel); if (el) el.setAttribute('content', value); }

  // その言語の文字の Noto を読む（ラテン文字と日本語は HTML が読み込み済み）
  function loadFont(lang) {
    var family = lang.font.replace(/\+/g, ' ');
    root.style.setProperty('--font-script', "'" + family + "'");
    if (lang.font === 'Noto+Sans' || lang.font === 'Noto+Sans+JP' || document.getElementById('font-' + lang.font)) return;
    var link = document.createElement('link');
    link.id = 'font-' + lang.font;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + lang.font + ':wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }

  function apply(code) {
    var lang = langs[code], d = data.strings[code];
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = d[el.getAttribute('data-i18n')]; if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = d[el.getAttribute('data-i18n-html')]; if (v != null) el.innerHTML = v;
    });
    // 同じサイトの関連ページへのリンクは同じ言語で開く
    document.querySelectorAll('a[href^="privacy-policy.html"], a[href^="delete-account.html"]').forEach(function (a) {
      a.setAttribute('href', a.getAttribute('href').split(/[?#]/)[0] + '?lang=' + code);
    });
    document.querySelectorAll('a[data-lp]').forEach(function (a) { a.setAttribute('href', code === 'en' ? './' : code + '/'); });
    root.lang = lang.hreflang;
    root.dir = code === 'ar' ? 'rtl' : 'ltr';
    var title = d[data.page + '_meta_title'], desc = d[data.page + '_meta_desc'];
    document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', desc);
    setMeta('meta[property="og:locale"]', lang.ogLocale);
    setMeta('meta[property="og:url"]', canonical + '?lang=' + code);
    loadFont(lang);
    var sel = document.getElementById('langSelect');
    if (sel) sel.value = code;
  }

  var sel = document.getElementById('langSelect');
  if (sel) {
    sel.innerHTML = '';
    data.langs.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l[0];
      o.textContent = l[1];
      o.lang = l[2];
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      save(this.value);
      apply(this.value);
      try { history.replaceState(null, '', '?lang=' + this.value + location.hash); } catch (e) {}
    });
  }

  var q = (location.search.match(/[?&]lang=([A-Za-z_-]+)/) || [])[1];
  var browser = null;
  var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (var i = 0; i < list.length && !browser; i++) browser = normalize(list[i]);
  var code = normalize(q) || normalize(saved()) || browser || 'en';
  if (normalize(q)) save(code);
  apply(code);
})();
