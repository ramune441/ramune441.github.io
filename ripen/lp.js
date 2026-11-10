// Ripen LP の共通スクリプト（全言語のページが読む）。
// 各言語のページは生成済みなので、ここでは訳さない。言語の切り替えはその言語の URL へ移るだけ。
// /ripen/（日本語）だけ: ?lang= > 前に選んだ言語 のページへ移す。ブラウザの言語では移さず、案内の帯を出すだけ
// （クローラは英語ブラウザとして描画するので、ブラウザ言語で移すと日本語ページが索引されなくなる）。
(function () {
  var root = document.documentElement;
  var base = root.getAttribute('data-base') || '';
  var current = root.getAttribute('data-lang');
  var KEY = 'ripen_lp_lang';
  var sel = document.getElementById('langSelect');
  var langs = sel ? Array.prototype.map.call(sel.options, function (o) { return o.value; }) : [];

  function pageOf(lang) { return base + (lang === 'ja' ? '' : lang + '/'); }
  function normalize(tag) {
    if (!tag) return null;
    var t = String(tag).replace('_', '-').toLowerCase();
    if (/^zh-(tw|hk|mo)|^zh-hant/.test(t)) return 'zh-TW';
    var short = t.split('-')[0];
    if (short === 'in') short = 'id';
    for (var i = 0; i < langs.length; i++) if (langs[i].toLowerCase() === t || langs[i] === short) return langs[i];
    return null;
  }
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(lang) { try { localStorage.setItem(KEY, lang); } catch (e) {} }

  if (sel) {
    sel.value = current;
    sel.addEventListener('change', function () {
      save(this.value);
      location.href = pageOf(this.value) + location.hash;
    });
  }

  if (base === '' && current === 'ja') {
    var q = (location.search.match(/[?&]lang=([A-Za-z_-]+)/) || [])[1];
    var target = normalize(q) || (q ? null : normalize(saved()));
    if (target && target !== 'ja') { location.replace(pageOf(target) + location.hash); return; }
    if (!q && !saved()) suggest();
  }

  // ブラウザの言語に合うページがあれば、上部に案内の帯を出す（閉じたら次から出さない）
  function suggest() {
    var bar = document.getElementById('langSuggest');
    var data = document.getElementById('langSuggestText');
    if (!bar || !data) return;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    var lang = null;
    for (var i = 0; i < list.length && !lang; i++) lang = normalize(list[i]);
    if (!lang || lang === 'ja') return;
    var texts = {};
    try { texts = JSON.parse(data.textContent); } catch (e) { return; }
    if (!texts[lang]) return;
    var link = bar.querySelector('a');
    link.textContent = texts[lang];
    link.href = pageOf(lang);
    link.setAttribute('hreflang', lang);
    link.addEventListener('click', function () { save(lang); });
    bar.querySelector('button').addEventListener('click', function () { save('ja'); bar.hidden = true; document.body.classList.remove('has-suggest'); });
    bar.hidden = false;
    document.body.classList.add('has-suggest');
  }

  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = this.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
        el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) { item.classList.add('open'); this.setAttribute('aria-expanded', 'true'); }
    });
  });
})();
