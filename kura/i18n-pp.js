// i18n-pp — Kura (ja baseline in HTML + en, the app's two languages)
// 本文 + メタ(title/description/OGP/Twitter/og:locale) を言語連動。自動判定 + #langSelect + localStorage。
(function () {
  var translations = {
  "en": {
    "pp_title": "Privacy Policy",
    "pp_updated": "Last updated: September 26, 2026",
    "pp_intro": "Kura (“the app”) is an Android photo app developed and provided by Ramune. It helps you sort and browse the photos and videos on your phone and, if you choose, back them up to the cloud. This policy explains how the app handles your information.",
    "pp_callout": "In short: all photo analysis (faces, contents, blur and so on) happens on your device. Your photos and videos leave the phone only when you turn on cloud backup or create a share link. The only account information our server keeps is your Google account's identifier — never your name or email address. The app contains no ads or analytics.",
    "pp_h1": "Photo analysis (on your device)",
    "pp_s1_p": "To help you organize, the app reads the photos and videos on your device (photos and videos permission).",
    "pp_s1_li1": "Face detection and grouping by person, content labels, and blur and similar-photo detection all run on your device, using Google ML Kit and similar on-device tools.",
    "pp_s1_li2": "Analysis results are stored in a database on your device and are never sent out.",
    "pp_s1_li3": "Face information is used only to group photos of the same person, never to identify who someone is.",
    "pp_s1_li4": "To improve its features and catch problems, Google ML Kit sends Google the device model and OS version, app information, performance data such as processing times, and device identifiers. Your photos and analysis results are not sent.",
    "pp_h2": "Signing in with Google",
    "pp_s2_p": "Signing in is optional and only needed for cloud backup and share links.",
    "pp_s2_li1": "You sign in with your Google account. Our server keeps only the per-account identifier Google issues (a random number).",
    "pp_s2_li2": "Your name, email address and profile photo are not stored on our server.",
    "pp_h3": "Cloud backup",
    "pp_s3_p": "Only when you turn on automatic backup does the app send the following to our server, where it is stored:",
    "pp_s3_li1": "Your photo and video files (including information inside them, such as where they were taken) and their thumbnails",
    "pp_s3_li2": "Information needed to restore them: original file name, date taken, file type and size",
    "pp_s3_li3": "Files in the vault (when backup is on)",
    "pp_s3_p2": "All traffic is encrypted with HTTPS, and files are encrypted at rest. Our server runs on Cloudflare (the API) and Backblaze B2 (file storage, in a data center in the United States). These providers handle the data only to store and deliver it. We do not analyze your backed-up photos, use them for advertising or any other purpose, or sell or give them to third parties.",
    "pp_h4": "Share links",
    "pp_s4_li1": "When you create a share link, the photos and videos you chose are uploaded to our server, and anyone with the link can view them. Files in the vault cannot be shared.",
    "pp_s4_li2": "You can set a password and an expiry date. An expired link can no longer be viewed.",
    "pp_s4_li3": "Removing location from shared photos is on by default.",
    "pp_h5": "Subscriptions",
    "pp_s5_p": "Cloud storage plans are purchased through Google Play. Google Play handles payment; we never receive your card number or other payment details. To verify a purchase, our server receives and stores the purchase token, the plan, its expiry, and a hash derived from your account identifier.",
    "pp_h6": "Place names and maps",
    "pp_s6_li1": "When a photo has a location, the app uses Android's built-in Geocoder to show a place name. This may send approximate coordinates to your device's location service provider (usually Google).",
    "pp_s6_li2": "The map screen loads map images from OpenStreetMap, which lets the map servers see your IP address and the area shown.",
    "pp_h7": "Information the app does NOT collect",
    "pp_s7_li1": "Advertising ID",
    "pp_s7_li2": "Contacts, call logs or browsing history",
    "pp_s7_li3": "Your current location (the app does not use the location permission; it only handles the location recorded in your photos)",
    "pp_s7_li4": "Usage analytics (the app uses no advertising SDKs, analytics or tracking; the diagnostic data ML Kit sends is described in section 1)",
    "pp_h8": "Retention and deletion",
    "pp_s8_li1": "Data on your device (analysis results and settings) is deleted when you uninstall the app or choose Android Settings > Apps > Kura > Storage > Clear data. Your photos themselves are not deleted.",
    "pp_s8_li2": "For cloud data, “Delete account” at the bottom of the app's Cloud screen deletes every backed-up file and all share links.",
    "pp_s8_li3": "After a subscription ends, backed-up data may be deleted after a period of time.",
    "pp_s8_li4": "Purchase records may be kept after account deletion for accounting and legal reasons.",
    "pp_s8_li5": "If you can't use the app, you can ask for deletion at the contact below.",
    "pp_h9": "Age",
    "pp_s9_p": "The app is not directed at anyone under 18. We do not knowingly collect personal information from anyone under 18.",
    "pp_h10": "Changes to this policy",
    "pp_s10_p": "We may revise this privacy policy as needed. When we do, we will update the “Last updated” date at the top of this page.",
    "pp_h11": "Contact",
    "pp_s11_p": "For questions about this privacy policy or data deletion, contact <a href='mailto:warload57@gmail.com'>warload57@gmail.com</a> (operated by Ramune).",
    "pp_home": "Home"
  }
};
  var LOCALE = { ja: 'ja_JP', en: 'en_US' };
  var LANGS = [['ja','日本語'],['en','English']];
  function detect() {
    var l = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return l.indexOf('ja') === 0 ? 'ja' : 'en';
  }
  var baseline = { t: {}, h: {} };
  var baseMeta = { title: '', desc: '' };
  function capture() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) { baseline.t[el.getAttribute('data-i18n')] = el.textContent; });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) { baseline.h[el.getAttribute('data-i18n-html')] = el.innerHTML; });
    baseMeta.title = document.title;
    var md = document.querySelector('meta[name="description"]');
    baseMeta.desc = md ? md.getAttribute('content') : '';
  }
  function composeTitle(d) { return d.pp_title + '｜Kura'; }
  function composeDesc(d) { return d.pp_callout; }
  function setMeta(sel, val) { if (val == null) return; var el = document.querySelector(sel); if (el) el.setAttribute('content', val); }
  function applyMeta(lang) {
    var title, desc;
    if (lang === 'ja') { title = baseMeta.title; desc = baseMeta.desc; }
    else { var d = translations[lang]; title = composeTitle(d); desc = composeDesc(d); }
    if (title) { document.title = title; setMeta('meta[property="og:title"]', title); setMeta('meta[name="twitter:title"]', title); }
    if (desc) { setMeta('meta[name="description"]', desc); setMeta('meta[property="og:description"]', desc); setMeta('meta[name="twitter:description"]', desc); }
    setMeta('meta[property="og:locale"]', LOCALE[lang] || 'ja_JP');
  }
  function apply(lang) {
    var dict = lang === 'ja' ? null : translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      var v = dict ? dict[k] : baseline.t[k];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      var v = dict ? dict[k] : baseline.h[k];
      if (v != null) el.innerHTML = v;
    });
    document.documentElement.lang = lang;
    applyMeta(lang);
  }
  function setLang(lang) {
    if (lang !== 'ja' && !translations[lang]) lang = 'ja';
    apply(lang);
    try { localStorage.setItem('kura_lang', lang); } catch (e) {}
    var sel = document.getElementById('langSelect'); if (sel) sel.value = lang;
  }
  function buildSelector() {
    var sel = document.getElementById('langSelect'); if (!sel) return;
    sel.innerHTML = '';
    LANGS.forEach(function (L) { var o = document.createElement('option'); o.value = L[0]; o.textContent = L[1]; sel.appendChild(o); });
    sel.addEventListener('change', function () { setLang(this.value); });
  }
  capture();
  buildSelector();
  var saved = null; try { saved = localStorage.getItem('kura_lang'); } catch (e) {}
  // ?lang=en lets the Play listing link straight to one language.
  var q = (location.search.match(/[?&]lang=(ja|en)/) || [])[1];
  setLang(q || saved || detect());
})();
