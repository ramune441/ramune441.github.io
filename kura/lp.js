// Kura LP の共通スクリプト（全言語のページが読む）。
// 各言語のページは生成済みなので、ここでは訳さない。言語の切り替えはその言語の URL へ移るだけ。
// /kura/（英語）を開いたときだけ、?lang= > 前に選んだ言語 > ブラウザの言語 のページへ移す。
(function () {
  var root = document.documentElement;
  var base = root.getAttribute('data-base') || '';
  var current = root.getAttribute('data-lang');
  var KEY = 'kura_lp_lang';
  var sel = document.getElementById('langSelect');
  var langs = sel ? Array.prototype.map.call(sel.options, function (o) { return o.value; }) : [];

  function pageOf(lang) { return base + (lang === 'en' ? '' : lang + '/'); }
  function normalize(tag) {
    if (!tag) return null;
    var t = String(tag).replace('_', '-').toLowerCase();
    if (/^zh-(tw|hk|mo)|^zh-hant/.test(t)) return 'zh-TW';
    var short = t.split('-')[0];
    if (short === 'zh') return 'zh';
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

  if (base === '' && current === 'en') {
    var q = (location.search.match(/[?&]lang=([A-Za-z_-]+)/) || [])[1];
    var browser = null;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var i = 0; i < list.length && !browser; i++) browser = normalize(list[i]);
    var target = normalize(q) || normalize(saved()) || browser;
    if (target && target !== 'en') location.replace(pageOf(target) + location.hash);
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
