// i18n-lp — Kura LP（日本語は HTML が持ち、英語はここ。プライバシーポリシーと同じ ja / en）
// 本文・画像の alt・メタ・ストア画像・紹介動画・Play のリンクを言語に合わせる。?lang= > localStorage kura_lang > ブラウザ言語。
(function () {
  var translations = {
  "en": {
    "seo_title": "Kura | One app for everything photos: gallery, cleanup, AI editing and backup for Android",
    "seo_desc": "Kura is an all-in-one Android photo app: a full gallery, duplicate and blur cleanup, portrait and AI editing, private photos, original-quality cloud backup and moving from Google Photos. Browsing, sorting and deleting are free, with no ads.",
    "og_title": "Kura | All your photos, all in one app.",
    "nav_web": "Web app",
    "nav_cta": "Get it on Google Play",
    "hero_badge": "Photo app for Android · No ads",
    "hero_h1": "All your photos,<br><span class=\"accent\">all in one app.</span>",
    "hero_desc": "Gallery, cleanup, AI editing, private storage, backup and moving from Google Photos. With Kura, you don't need a different app for each.",
    "hero_cta": "Get it on Google Play",
    "hero_web": "Open the web app",
    "hero_note": "Android 11 or later · Browsing, sorting and deleting are free · Sign in with Google",
    "hero_alt": "Kura - All your photos, all in one app.",
    "problem_h2": "How many apps do your photos need?",
    "problem_p": "A gallery to look at them, a cleaner to free up space, another app to edit, another service to back up. Every switch means finding the same photo again.<br><span class=\"highlight\">Kura does all of it in one library.</span>",
    "cmp_tag": "All in one",
    "cmp_h2": "Four apps, now one.",
    "cmp_lead": "View, clean up, edit and back up the same photos, in the same place.",
    "cmp_before_h": "Before",
    "cmp_b1": "Browse in a gallery app",
    "cmp_b2": "Hunt for duplicates in a cleaner app",
    "cmp_b3": "Open the photo in an editing app",
    "cmp_b4": "Back up with yet another service",
    "cmp_after_h": "With Kura",
    "cmp_a1": "Browse by date, people, places and memories",
    "cmp_a2": "Find duplicates, similar shots and blur on your phone, then swipe to clean up",
    "cmp_a3": "Retouch, filters and AI edits from the same screen",
    "cmp_a4": "Back up in original quality, and view it from a browser too",
    "video_tag": "Watch",
    "video_h2": "Kura in 44 seconds",
    "video_lead": "From the library to cleanup, editing, moving and backup.",
    "s1_tag": "Cleanup",
    "s1_h3": "Swipe to clean up,<br><span class=\"accent\">a whole batch at once.</span>",
    "s1_p": "Kura finds exact duplicates, similar photos, blurry shots and large files on your phone. Swipe right to keep, left to trash, and see right away how much space you can free.",
    "s1_f1": "The best shot is marked among similar photos",
    "s1_f2": "Clean up by month or by folder",
    "s1_f3": "Undo any step; trashed photos wait in the trash",
    "s1_alt": "Swiping to clean up photos",
    "s2_tag": "Edit",
    "s2_h3": "Better photos,<br><span class=\"accent\">and a better you.</span>",
    "s2_p": "Retouch, reshape, makeup, hair and background, plus 30 filters, adjustments and crop. There are filters that make dishes look delicious and body tools for your whole figure. You always save a copy, so the original stays as it was.",
    "s2_f1": "AI edits for hairstyle and expression (with a cloud plan)",
    "s2_f2": "\"Ask AI\": describe the change you want",
    "s2_f3": "Edits are saved separately; the original stays",
    "s2_alt": "Portrait editing and AI edit examples",
    "s3_tag": "Library",
    "s3_h3": "The photo you want,<br><span class=\"accent\">found in seconds.</span>",
    "s3_p": "A grid by date, with memories from the same day in past years. Search by place, by what is in the photo or by text inside it, and faces are grouped by person on your phone.",
    "s3_f1": "People, places (map), albums and folders",
    "s3_f2": "Motion photos, panoramas and slideshows",
    "s3_f3": "Lossless JPEG rotation and printing",
    "s3_alt": "Library with people, places and search",
    "s4_tag": "Private",
    "s4_h3": "Photos you'd rather not show,<br><span class=\"accent\">kept private.</span>",
    "s4_p": "Move photos and videos to Private to hide them from your gallery and other apps. Open it with your phone's screen lock.",
    "s4_f1": "Lock the whole app if you like",
    "s4_f2": "Location is removed from shared photos (on by default)",
    "s4_alt": "The Private screen",
    "s5_tag": "Backup",
    "s5_h3": "Original quality,<br><span class=\"accent\">safe in the cloud.</span>",
    "s5_p": "Back up photos and videos with no recompression. Remove backed-up copies from your phone to free up space; they stay viewable from the cloud.",
    "s5_f1": "Monthly plans: 100 GB / 500 GB / 1 TB",
    "s5_f2": "Share with a link, with an expiry date and password",
    "s5_f3": "View and organize from your computer's browser too",
    "s5_alt": "Cloud backup screen",
    "s6_tag": "Move",
    "s6_h3": "Move from Google Photos,<br><span class=\"accent\">all at once.</span>",
    "s6_p": "Just send your Google Takeout .zip from the app or the web app. Kura brings over your albums, favorites and the photos it doesn't have yet. Kura's server unpacks it in the background, so you can close the app and the browser.",
    "s6_f1": "Moving needs a cloud plan",
    "s6_f2": "For large libraries, the web app on a computer is easiest",
    "s6_f3": "Locations recorded by your camera stay in the files",
    "s6_alt": "Moving from Google Photos",
    "web_tag": "Web",
    "web_h2": "The same library in your computer's browser.",
    "web_p": "Photos in your Kura cloud can be viewed, organized, cleaned up, edited, shared and uploaded in the web app, just like in the app. Favorites stay in sync with the app.",
    "web_btn": "Open the web app",
    "web_note": "Sign in with Google · English and Japanese",
    "feat_tag": "Features",
    "feat_h2": "Everything else your photos need",
    "feat_lead": "All you'd expect from the gallery you use every day.",
    "f1_h": "Search what's inside",
    "f1_p": "Find photos by place, by what's in them, or by text in the picture.",
    "f2_h": "People and places",
    "f2_p": "Faces grouped by person on your phone, and your photos on a map.",
    "f3_h": "On this day",
    "f3_p": "Photos from the same day in past years, at the top of your library.",
    "f4_h": "30 filters",
    "f4_p": "Brightness and color adjustments, crop and brush, plus filters for food.",
    "f5_h": "Share with a link",
    "f5_p": "Add an expiry date and a password, and send to people without the app.",
    "f6_h": "App lock",
    "f6_p": "Confirm with your screen lock each time you open it. You can also hide Private.",
    "flow_tag": "How to start",
    "flow_h2": "Four steps to start",
    "flow_lead": "Install it and your photos appear, already organized.",
    "flow1_h": "Install",
    "flow1_p": "Get it on Google Play (Android 11 or later)",
    "flow2_h": "Photo access",
    "flow2_p": "Choose \"Allow all\" to load your whole library",
    "flow3_h": "Sign in",
    "flow3_p": "Sign in with your Google account",
    "flow4_h": "Browse and clean up",
    "flow4_p": "Sort right away; add backup when you need it",
    "price_tag": "Pricing",
    "price_h2": "Browsing and cleanup are free. Cloud only when you want it.",
    "price_lead": "No ads. You only pay when you use the cloud.",
    "price_free_h": "Free",
    "price_free_sub": "Everything on your phone",
    "price_free1": "Library, search, people, places and memories",
    "price_free2": "Duplicate, similar and blurry photo cleanup",
    "price_free3": "Editing such as retouch and filters",
    "price_free4": "Private and app lock",
    "price_plan_h": "Cloud plans",
    "price_plan_sub": "Billed monthly through Google Play. Cancel any time",
    "price_p1": "US$0.99/mo",
    "price_p2": "US$4.99/mo",
    "price_p3": "US$9.99/mo",
    "price_plan1": "Original-quality cloud backup",
    "price_plan2": "The web app in your browser",
    "price_plan3": "Moving from Google Photos",
    "price_plan4": "AI edits (up to 30 a day)",
    "price_note": "Google Play shows prices in your local currency.",
    "safe_tag": "Privacy",
    "safe_h2": "Your photos are sorted without leaving your phone.",
    "safe_lead": "Photos leave your phone only when you do something that clearly sends them somewhere.",
    "safe1_h": "All detection on your phone",
    "safe1_p": "Duplicate, blur, face, object and text detection run on your phone. No photo is uploaded to be sorted.",
    "safe2_h": "Always asked before deleting",
    "safe2_p": "Android asks you before any file is deleted, and trashed photos wait in the trash until you empty it.",
    "safe3_h": "Only your account ID is sent",
    "safe3_p": "When you sign in, our server keeps only your Google account's ID. Your name and email address are never sent.",
    "safe4_h": "AI edits send only the face area",
    "safe4_p": "AI edits send only the area around the face, and neither the photo nor the result is kept on the server.",
    "note_h": "Before you start",
    "note1": "Kura runs on Android 11 or later. There is no iPhone app.",
    "note2": "To organize your whole library, photo access must be set to \"Allow all\".",
    "note3": "You need to sign in with a Google account to get started.",
    "note4": "AI edits need a cloud plan and a connection (up to 30 a day).",
    "note5": "The web app has no People, AI edits or Private.",
    "faq_tag": "FAQ",
    "faq_h2": "Questions",
    "faq1_q": "Is it free?",
    "faq1_a": "Browsing, sorting and deleting photos are free, with no ads. Cloud backup, the web app, moving from Google Photos and AI edits come with a monthly cloud plan (from US$0.99 for 100 GB).",
    "faq2_q": "Are my photos sent anywhere?",
    "faq2_a": "All detection for sorting (duplicates, blur, faces, objects and text) runs on your phone. Photos and videos leave your phone only when you turn on automatic backup, or when you share, use AI edits or do something else that clearly sends them.",
    "faq3_q": "Can I move from Google Photos?",
    "faq3_a": "Yes. Send the .zip you downloaded with Google Takeout from the app or the web app, and Kura brings over your albums, favorites and the photos it doesn't have yet. Moving needs a cloud plan. Descriptions, people and places added in Google Photos don't come over.",
    "faq4_q": "Can I see my photos on a computer?",
    "faq4_a": "Yes. Sign in to the web app in a browser to view, organize, clean up, share and upload the photos in your Kura cloud.",
    "faq5_q": "What happens to my photos if I cancel?",
    "faq5_a": "Photos on your phone stay where they are. Data in your Kura cloud may be deleted some time after your subscription ends, so save anything you need to your phone or computer first.",
    "faq6_q": "Does it work on iPhone?",
    "faq6_a": "The app is Android only (Android 11 or later). Photos in your Kura cloud can be viewed from any browser, including on iPhone, in the web app.",
    "cta_h2": "All your photos, <span class=\"accent\">in Kura.</span>",
    "cta1": "View, search and relive them in one library",
    "cta2": "Swipe away duplicates and blurry shots",
    "cta3": "From retouch to AI edits, with the original kept",
    "cta4": "Original-quality backup, viewable in a browser",
    "cta_btn": "Get it on Google Play",
    "cta_note": "No ads · Browsing, sorting and deleting are free",
    "footer_web": "Web app",
    "footer_privacy": "Privacy Policy",
    "footer_delete": "Delete account"
  }
};
  // 紹介動画は store-listing.json の listing.video と同じもの
  var VIDEO = { ja: 'kLPCBIHNpDM', en: 'KWMlLVyj3IU' };
  var LOCALE = { ja: 'ja_JP', en: 'en_US' };
  var LANGS = [['ja', '日本語'], ['en', 'English']];
  var PLAY = 'https://play.google.com/store/apps/details?id=app.kura.photos';
  function detect() {
    var l = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return l.indexOf('ja') === 0 ? 'ja' : 'en';
  }
  var baseline = { t: {}, h: {}, a: {} };
  var baseMeta = {};
  function meta(sel) { return document.querySelector(sel); }
  function capture() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) { baseline.t[el.getAttribute('data-i18n')] = el.textContent; });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) { baseline.h[el.getAttribute('data-i18n-html')] = el.innerHTML; });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) { baseline.a[el.getAttribute('data-i18n-alt')] = el.getAttribute('alt'); });
    baseMeta.title = document.title;
    baseMeta.desc = meta('meta[name="description"]').getAttribute('content');
    baseMeta.ogTitle = meta('meta[property="og:title"]').getAttribute('content');
    baseMeta.ogDesc = meta('meta[property="og:description"]').getAttribute('content');
  }
  function setMeta(sel, val) { var el = meta(sel); if (el && val != null) el.setAttribute('content', val); }
  function applyMeta(lang) {
    var d = translations[lang];
    var title = d ? d.seo_title : baseMeta.title;
    var desc = d ? d.seo_desc : baseMeta.desc;
    var ogTitle = d ? d.og_title : baseMeta.ogTitle;
    var ogDesc = d ? d.seo_desc : baseMeta.ogDesc;
    document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', ogTitle);
    setMeta('meta[name="twitter:title"]', ogTitle);
    setMeta('meta[property="og:description"]', ogDesc);
    setMeta('meta[name="twitter:description"]', ogDesc);
    setMeta('meta[property="og:locale"]', LOCALE[lang]);
  }
  function apply(lang) {
    var dict = translations[lang] || null;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n'); var v = dict ? dict[k] : baseline.t[k];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html'); var v = dict ? dict[k] : baseline.h[k];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-alt'); var v = dict ? dict[k] : baseline.a[k];
      if (v != null) el.setAttribute('alt', v);
    });
    document.querySelectorAll('img[data-img]').forEach(function (el) {
      var src = 'images/lp/' + lang + '/' + el.getAttribute('data-img');
      if (el.getAttribute('src') !== src) el.setAttribute('src', src);
    });
    var video = document.getElementById('promo-video');
    if (video) {
      var vsrc = 'https://www.youtube-nocookie.com/embed/' + VIDEO[lang] + '?rel=0&hl=' + lang;
      if (video.getAttribute('src') !== vsrc) video.setAttribute('src', vsrc);
    }
    document.querySelectorAll('a.js-play').forEach(function (a) { a.setAttribute('href', PLAY + '&hl=' + lang); });
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
  var q = (location.search.match(/[?&]lang=(ja|en)/) || [])[1];
  setLang(q || saved || detect());
})();
