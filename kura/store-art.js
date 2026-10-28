// Kura の画面パーツ: 言語・アプリの画面（写真タブ・スワイプ・プライベート・コレクション・バックアップ）・画面の横に置くカード。
// store-images.html（ストア画像）と promo.html（紹介動画）が共有する。先に store-images-app-strings.js と store-images-i18n.js を読む。
const CAP = window.STORE_I18N;

// ─────────────── language ───────────────
const L = new URLSearchParams(location.search).get('lang') || 'en';
// Folder codes (images/store/<lang>) → the locale for dates, plurals and numbers.
// Thai dates in the Gregorian years the app shows, not the Buddhist era a browser picks for th.
const LOC = { zh:'zh-CN', pt:'pt-BR', th:'th-TH-u-ca-gregory' }[L] || L;
const A = APP_STRINGS[L], EN = APP_STRINGS.en, C = CAP[L];
document.documentElement.lang = LOC;
const CJK = { ja:'Noto Sans JP', zh:'Noto Sans SC', 'zh-TW':'Noto Sans TC', ko:'Noto Sans KR' }[L];
if (CJK) {
  document.body.classList.add('cjk');
  document.documentElement.style.setProperty('--cjk', `'${CJK}'`);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${CJK.replace(/ /g, '+')}:wght@400;500;600;700;800&display=block`;
  document.head.appendChild(link);
}
// Scripts Geist does not draw: their Noto face, through the same fallback slot as CJK.
const SCRIPT = { hi:'Noto Sans Devanagari', th:'Noto Sans Thai', ar:'Noto Sans Arabic', bn:'Noto Sans Bengali' }[L];
if (SCRIPT) {
  document.body.classList.add('untracked');
  document.documentElement.style.setProperty('--cjk', `'${SCRIPT}'`);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${SCRIPT.replace(/ /g, '+')}:wght@400;500;600;700;800&display=block`;
  document.head.appendChild(link);
}
if (L === 'ar') document.body.classList.add('rtl');
const fmt = (s, a) => { let i = 0; return s.replace(/%(\d+)\$[ds]|%[ds]/g, (m, p) => String(p ? a[p - 1] : a[i++])); };
const t = (k, ...a) => fmt(A[k] ?? EN[k], a);
const pl = (k, n, ...a) => { const f = A[k] ?? EN[k]; return fmt(f[new Intl.PluralRules(LOC).select(n)] ?? f.other, [n, ...a]); };
// domain/ByteFormat.kt: decimal units, Locale.US, one decimal under 100.
const bytes = gb => { let v = gb * 1e9, u = -1; const U = ['KB','MB','GB','TB']; while (v >= 1000 && u < 3) { v /= 1000; u++; }
  const text = (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + ' ' + U[u];
  // In Arabic a size is one left-to-right run, or "GB 38.2" comes out reversed.
  return L === 'ar' ? '⁦' + text + '⁩' : text; };
const D = (y, m, d, h = 12, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s);
const TODAY = D(2026, 9, 28);
const df = (o, d) => new Intl.DateTimeFormat(LOC, o).format(d);
const monthTitle = (y, m) => df({ year:'numeric', month:'long' }, D(y, m, 1));
const dayTitle = d => { const diff = Math.round((TODAY - d) / 864e5);
  return diff === 0 ? t('day_today') : diff === 1 ? t('day_yesterday') : df({ weekday:'short', month:'short', day:'numeric' }, d); };
const P = n => `images/photos/${n}.jpg`;
// {vault} = the app's own name for the vault (lib_vault: Private / プライベート / Tresor …), so a rename in the app carries over.
// A size never splits from its unit across lines ("500 GB").
const fill = s => s.replace(/\{vault\}/g, t('lib_vault')).replace(/(\d) (GB|TB|Go|To|ГБ|ТБ)/g, '$1 $2');
const mi = (n, cls = 'mi', st = '') => `<i class="${cls}" style="${st}">${n}</i>`;

// ─────────────── the icon (res/drawable/ic_launcher_foreground.xml on @color/brand) ───────────────
const ICON_SVG = (vb = '0 0 108 108') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">
  <rect x="-20" y="-20" width="148" height="148" fill="#236B46"/>
  <path d="M27,45 Q31,44.5 35,42 L54,30 L73,42 Q77,44.5 81,45" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="rotate(8 56 60)"><path fill="#fff" fill-opacity=".5" d="M43.5,47 h25 a3.5,3.5 0 0 1 3.5,3.5 v19 a3.5,3.5 0 0 1 -3.5,3.5 h-25 a3.5,3.5 0 0 1 -3.5,-3.5 v-19 a3.5,3.5 0 0 1 3.5,-3.5 z"/></g>
  <path fill="#fff" d="M39.5,50 h29 a3.5,3.5 0 0 1 3.5,3.5 v21 a3.5,3.5 0 0 1 -3.5,3.5 h-29 a3.5,3.5 0 0 1 -3.5,-3.5 v-21 a3.5,3.5 0 0 1 3.5,-3.5 z"/>
  <path fill="#236B46" d="M40.5,74 L50.5,62.5 L56.5,69 L61,64.5 L67.5,74 z"/>
  <path fill="#236B46" d="M59.3,57 a3.2,3.2 0 1 0 6.4,0 a3.2,3.2 0 1 0 -6.4,0 z"/>
</svg>`;
// The roof alone, as a faint watermark behind the captions.
const ROOF = (w, st) => `<svg class="roof" style="${st}" width="${w}" viewBox="25 27 58 20"><path d="M27,45 Q31,44.5 35,42 L54,30 L73,42 Q77,44.5 81,45"
  fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ─────────────── shared app chrome ───────────────
const statusBar = () => `<div class="sb"><span>10:24</span><span class="ic">${mi('signal_cellular_alt')}${mi('wifi')}${mi('battery_full')}</span></div>`;
const navBar = on => {
  const items = [['photo', t('tab_library')], ['collections_bookmark', t('tab_collections')], ['cleaning_services', t('tab_sort')], ['settings', t('settings_title')]];
  return `<div class="nav"><div class="row">${items.map(([ic, lb], i) =>
    `<div class="it ${i === on ? 'on' : ''}"><div class="pill">${mi(ic, i === on ? 'mi' : 'mo')}</div><div class="lb">${lb}</div></div>`).join('')}</div>
    <div class="gest"><b></b></div></div>`;
};
const gestOnly = () => `<div class="gest"><b></b></div>`;
const tabHeader = (title, sub, acts) => `<div class="th ${sub ? 'sub' : ''}"><div class="tt"><h2>${title}</h2>${sub ? `<div class="st">${sub}</div>` : ''}</div>
  <div class="acts">${acts.map(a => mi(a, 'mo')).join('')}</div></div>`;
const screenBar = (title, sub, acts = []) => `<div class="sbar">${mi('arrow_back')}<div><h3>${title}</h3>${sub ? `<div class="st">${sub}</div>` : ''}</div>
  ${acts.length ? `<div class="acts" style="top:8px">${acts.map(a => mi(a, 'mo')).join('')}</div>` : ''}</div>`;
const label = (text, action) => `<div class="lbl"><span>${text}</span>${action ? `<em>${action}</em>` : ''}</div>`;
const photoCard = ({ src, title, detail, w, h, icon, tone, style = '' }) => `<div class="card" style="width:${w}px;height:${h}px">
  <img class="ph" src="${P(src)}" style="${style}"><div class="scrim"></div>
  ${icon ? `<div class="disc" style="background:var(--${tone}C);color:var(--on${tone[0].toUpperCase() + tone.slice(1)}C)">${mi(icon, 'mo')}</div>` : ''}
  <div class="tx"><b>${title}</b>${detail ? `<small>${detail}</small>` : ''}</div></div>`;
const meter = f => `<div class="meter"><b style="width:${f * 100}%"></b></div>`;
const roundAction = (icon, lb, size, bg, fg, border = '') => `<div class="ra"><div class="o" style="width:${size}px;height:${size}px;background:${bg};color:${fg};${border}">
  ${mi(icon, 'mi', `font-size:${size * .42}px`)}</div><small>${lb}</small></div>`;
const decisionBar = info => `<div class="dbar">
  ${roundAction('undo', t('undo'), 48, 'var(--cHigh)', 'var(--onVar)')}
  ${roundAction('close', t('swipe_trash'), 70, 'var(--bg)', 'var(--error)', 'border:1.5px solid rgba(179,38,30,.7);')}
  ${roundAction('check', t('swipe_keep'), 70, 'var(--primary)', '#fff')}
  ${info ? `<div style="width:40px;height:70px;display:flex;align-items:center;justify-content:center;color:var(--onVar)">${mi('info', 'mo', 'font-size:20px')}</div>` : ''}</div>`;
const seal = (word, ink, side, tilt, st = '') => `<div class="seal" style="${side}:28px;border-color:${ink};color:${ink};transform:rotate(${tilt}deg);${st}">
  <span style="border-color:${ink}99">${word.toLocaleUpperCase(LOC)}</span></div>`;

// ─────────────── pieces of app screens laid beside the phone ───────────────
// The burst strip (tidy/BurstPicker.kt): one burst of the same dog, each frame a slightly different crop, the way a burst drifts.
function burstCallout() {
  const frames = ['transform:scale(1.14) translate(-3%,2%)', 'transform:scale(1.02)', 'transform:scale(1.1) translate(4%,-2%);filter:brightness(.9)',
    'transform:scale(1.08) translate(2%,3%);filter:blur(1.2px)'];
  const dec = [-1, 0, -1, -1]; // trashed / open
  return `<div class="hd">${mi('burst_mode', 'mo')}${t('session_similar')}</div>
    <div class="strip">${frames.map((f, i) => `<div class="sth ${i === 1 ? 'f' : ''}"><img class="ph" src="${P('p237')}" style="${f};${dec[i] < 0 ? 'opacity:.35' : ''}">
      ${dec[i] < 0 ? `<div class="mb" style="background:var(--error);color:#fff;left:22px;top:22px">${mi('close')}</div>` : ''}
      ${i === 1 ? `<div class="mb" style="background:var(--secondaryC);color:var(--onSecondaryC);left:3px;top:3px">${mi('auto_awesome')}</div>` : ''}</div>`).join('')}</div>
    <div><span class="qc">${mi('auto_awesome')}${t('burst_keep_best_rest')}</span></div>`;
}

// Search by a place name: the geocoder names places in the phone's language, so this finds them in every language.
function searchCallout() {
  const found = ['p512', 'p509', 'p565', 'p558', 'p13', 'p507'];
  return `<div class="sfield">${mi('search', 'mo')}<span>${C.cities[1]}</span>${mi('close')}</div>
    <div class="scount">${pl('search_count', 86, bytes(.412))}</div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr);width:240px;border-radius:12px;overflow:hidden">
      ${found.map(src => `<div class="cell"><img src="${P(src)}"></div>`).join('')}</div>`;
}

// The map (collections/MapScreen.kt): each place a disc with how many shots are there. The streets are drawn, not tiles.
function mapCallout() {
  const pins = [[64, 58, 241], [176, 112, 86], [206, 40, 12], [104, 150, 37]];
  return `<div class="hd">${mi('map', 'mo')}${t('places_title')}</div>
    <div class="map"><svg viewBox="0 0 250 190" width="250" height="190">
      <rect width="250" height="190" fill="#ECEBE3"/>
      <path d="M0 128 C40 118 70 140 112 132 C150 124 170 150 210 146 C230 144 242 150 250 152 V190 H0 Z" fill="#B7D2E2"/>
      <path d="M150 0 C146 30 160 54 154 80 C150 98 160 112 176 126" fill="none" stroke="#B7D2E2" stroke-width="12"/>
      <path d="M14 20 h52 v38 h-52 z M188 70 c20 -8 44 4 52 22 l-40 10 z" fill="#D2E5C6"/>
      <path d="M0 92 L250 64 M84 0 L104 190 M0 30 L150 46 M196 0 L226 190" stroke="#fff" stroke-width="6" fill="none"/>
      <path d="M0 92 L250 64 M84 0 L104 190" stroke="#F3DFA8" stroke-width="3" fill="none"/>
      <path d="M30 0 L44 120 M120 20 L250 30 M0 160 L120 100" stroke="#fff" stroke-width="3" fill="none"/>
    </svg>${pins.map(([x, y, n]) => `<span class="pin" style="left:${x}px;top:${y}px">${n}</span>`).join('')}</div>`;
}

// A video that is only in the cloud: it plays from there (viewer/Media.kt CloudVideo).
function videoCallout() {
  return `<div class="vthumb"><img class="ph" src="${P('p124')}"><span class="play">${mi('play_arrow')}</span>
      <span class="dur">${mi('videocam')}1:08</span><i class="mo cl">cloud</i></div>
    <div class="cmark">${mi('cloud', 'mo')}${t('cloud_only_mark')} · ${bytes(1.21)}</div>`;
}

// Backup going now (cloud/BackupState.kt BackupHero).
function backupHero() {
  return `<div class="hero"><span class="dsc" style="width:48px;height:48px;background:var(--primaryC);color:var(--onPrimaryC)">${mi('cloud_upload', 'mo', 'font-size:26px')}</span>
    <div class="n"><b>${t('backup_running_title')}</b><small>${t('progress_n_of_m', 412, 1204)}</small></div></div>${meter(412 / 1204)}`;
}

function privateCallout() {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;max-width:210px;text-align:center;padding:12px 8px">
    ${mi('lock', 'mo', 'font-size:44px;color:var(--primary)')}
    <b style="font-size:18px;line-height:1.4">${t('vault_locked')}</b>
    <span class="qc">${t('vault_unlock')}</span></div>`;
}

// ─────────────── the library the screens show ───────────────
const POOL = ['p110','p1025','p164','p431','p509','p419','p13','p106','p292','p392','p124','p200','p49','p360','p237','p434','p525','p28','p429',
  'p517','p235','p369','p163','p77','p512','p152','p450','p199','p288','p401','p323','p493','p10','p169','p565','p437','p225','p507','p287','p102',
  'p516','p128','p436','p488','p558','p165','p215','p327','p400','p54','p519','p553','p381','p159','p433','p219'];
const DAYS = [ // [date, count, size in GB]
  [D(2026, 9, 28), 3, .0214], [D(2026, 9, 27), 6, .0561], [D(2026, 9, 25), 5, .1872], [D(2026, 9, 22), 8, .0724],
  [D(2026, 9, 19), 7, .0643], [D(2026, 9, 14), 9, .2391], [D(2026, 9, 12), 6, .0512],
];
const VIDEOS = { 4:'0:24', 13:'1:08', 27:'0:11' };
function libraryGrid(cols) {
  let k = 0, html = `<div class="mh">${monthTitle(2026, 9)}</div>`;
  DAYS.forEach(([d, n, gb], di) => {
    html += `<div class="dh"><b>${dayTitle(d)}</b><small>${bytes(gb)}</small>${mi('radio_button_unchecked', 'mo')}</div><div class="grid" style="grid-template-columns:repeat(${cols},1fr)">`;
    for (let i = 0; i < n; i++, k++) {
      const v = VIDEOS[k];
      html += `<div class="cell"><img src="${P(POOL[k % POOL.length])}">
        ${v ? `<span class="vd">${mi('play_arrow')}${v}</span>` : ''}${di > 0 ? `<i class="mi cl">cloud_done</i>` : ''}</div>`;
    }
    html += `</div>`;
  });
  return html;
}

// ─────────────── the screens ───────────────
const SCREENS = {
  photos: ({ cols }) => `${statusBar()}
    ${tabHeader(t('tab_library'), pl('stats_items', 12480), ['grid_view', 'search'])}
    <div class="body">
      <div class="chips">
        <div><span class="chip dd">${mi('date_range', 'mo')}${t('filter_date_range')}${mi('arrow_drop_down')}</span><span class="chip">${mi('favorite_border', 'mo')}${t('lib_favorites')}</span></div>
        <div><span class="chip">${t('kind_photo')}</span><span class="chip">${t('kind_video')}</span><span class="chip">${t('kind_screenshot')}</span></div>
      </div>
      ${label(t('memories_title'))}
      <div class="hscroll">
        ${photoCard({ src:'p49', title:t('session_today'), detail:`2025 · ${pl('stats_items', 23)}`, w:124, h:172 })}
        ${photoCard({ src:'p419', title:t('session_today'), detail:`2024 · ${pl('stats_items', 41)}`, w:124, h:172 })}
        ${photoCard({ src:'p512', title:t('session_today'), detail:`2023 · ${pl('stats_items', 9)}`, w:124, h:172 })}
        ${photoCard({ src:'p164', title:monthTitle(2024, 9), detail:pl('stats_items', 86), w:124, h:172 })}
        ${photoCard({ src:'p525', title:monthTitle(2023, 9), detail:pl('stats_items', 57), w:124, h:172 })}
        ${photoCard({ src:'p507', title:monthTitle(2022, 9), detail:pl('stats_items', 33), w:124, h:172 })}
        ${photoCard({ src:'p392', title:monthTitle(2021, 9), detail:pl('stats_items', 28), w:124, h:172 })}
        ${photoCard({ src:'p434', title:monthTitle(2020, 9), detail:pl('stats_items', 14), w:124, h:172 })}
      </div>
      ${libraryGrid(cols)}
    </div>${navBar(0)}`,

  // The photo before this one has just been kept and flies out of the phone (shot 2 draws it on the canvas).
  swipe: () => `${statusBar()}${screenBar(t('session_today'), t('swipe_progress', 4, 24))}
    <div style="padding:0 20px">${meter(4 / 24)}</div>
    <div class="body" style="display:flex;flex-direction:column;gap:12px;padding:12px 16px 16px">
      <div class="deck">
        <div class="mcard" style="transform:translateY(12px) scale(.95);left:10px;right:10px"><img src="${P('p431')}"></div>
        <div class="mcard" style="box-shadow:0 12px 34px rgba(0,0,0,.25)"><img src="${P('p509')}"></div>
      </div>
      <div class="meta">${t('kind_photo')} · ${bytes(.0042)} · ${df({ year:'numeric', month:'short', day:'numeric' }, D(2023, 9, 28))}</div>
      ${decisionBar(false)}
      <div class="hint">${t('swipe_hint')}</div>
    </div>${gestOnly()}`,

  // Collections (collections/CollectionsScreen.kt): the fixed places, people, places, then the albums.
  collections: () => {
    const tile = (icon, lb, n, accent) => `<div class="sc"><span class="dsc" style="background:var(--${accent ? 'primaryC' : 'secondaryC'});
      color:var(--on${accent ? 'PrimaryC' : 'SecondaryC'})">${mi(icon, 'mo')}</span><div><b>${lb}</b><small>${n}</small></div></div>`;
    // Each face cropped from its photo, as FaceThumbs does: [photo, name, count, face centre x, y (0-1), zoom].
    const people = [['p1027', 'Emma', 214, .52, .47, 1.7], ['p836', 'Sofia', 132, .33, .2, 3.6], ['p832', 'Aiko', 87, .58, .34, 3.4],
      ['p838', 'Lena', 64, .48, .33, 2.8], ['p64', 'Maya', 23, .55, .43, 2.6]];
    const face = (x, y, z) => `width:${72 * z}px;left:${36 - x * 72 * z}px;top:${36 - y * 72 * z}px`;
    const places = [['p419', C.cities[0], 241], ['p512', C.cities[1], 86], ['p436', C.cities[2], 57]];
    return `${statusBar()}${tabHeader(t('tab_collections'), null, ['sort', 'add'])}
    <div class="body">
      <div class="scs">${tile('favorite_border', t('lib_favorites'), 214, true)}${tile('folder', t('lib_folders'), 12)}${tile('lock', t('lib_vault'), 38)}</div>
      <div style="height:8px"></div>${label(`<span style="display:flex;align-items:center;gap:6px">${t('people_title')}${mi('info', 'mo', 'font-size:18px;color:var(--onVar);font-weight:400')}</span>`)}
      <div class="faces">${people.map(([src, name, n, x, y, z]) => `<div class="face"><span><img src="${P(src)}" style="${face(x, y, z)}"></span><b>${name}</b><small>${n}</small></div>`).join('')}</div>
      <div style="height:8px"></div>${label(t('places_title'), `${mi('map', 'mo')}${t('map_open')}`)}
      <div class="hscroll">${places.map(([src, title, n]) => photoCard({ src, title, detail:pl('stats_items', n), w:148, h:112 })).join('')}</div>
      <div style="height:8px"></div>${label(t('tab_albums'))}
      <div class="atiles"><div class="atile"><span class="dsc" style="width:48px;height:48px;background:var(--cHighest);color:var(--on)">${mi('add', 'mi', 'font-size:26px')}</span></div>
        <div class="atile"><img class="ph" src="${P('p163')}"></div></div>
    </div>${navBar(1)}`;
  },

  vault: ({ cols }) => {
    const pool = ['p225','p163','p360','p1025','p429','p437','p106','p493','p102','p152','p400','p169','p431','p488','p292','p517','p200','p219','p159','p13'];
    const days = [[D(2026, 9, 26), 4], [D(2026, 9, 18), 6], [D(2026, 8, 30), 5], [D(2026, 8, 12), 7]];
    let k = 0, grid = '';
    days.forEach(([d, n], di) => {
      if (di === 0) grid += `<div class="mh">${monthTitle(2026, 9)}</div>`;
      if (di === 2) grid += `<div class="mh">${monthTitle(2026, 8)}</div>`;
      grid += `<div class="dh"><b>${dayTitle(d)}</b>${mi('radio_button_unchecked', 'mo')}</div><div class="grid" style="grid-template-columns:repeat(${cols},1fr)">`;
      for (let i = 0; i < n; i++, k++) grid += `<div class="cell"><img src="${P(pool[k % pool.length])}"></div>`;
      grid += '</div>';
    });
    return `${statusBar()}${screenBar(t('lib_vault'), pl('stats_items', 38), ['grid_view'])}
    <div class="body">
      <div style="padding:4px 16px 12px"><div class="panel" style="padding:14px 18px"><div class="okline">${mi('cloud_done')}<span style="flex:1">${t('vault_backup_on_short')}</span>${mi('info', 'mo', 'font-size:20px;color:var(--onVar)')}</div></div></div>
      <div class="hscroll">${[['p360', C.vaultAlbums[0], 26], ['p1025', C.vaultAlbums[1], 12]].map(([src, title, n]) => photoCard({ src, title, detail:pl('stats_items', n), w:168, h:118 })).join('')}</div>
      ${grid}
    </div>${gestOnly()}`;
  },

  // Settings' cloud backup (cloud/BackupState.kt BackupHero) while a run goes, and what is only in the cloud. No plan prices.
  cloud: () => {
    const onlyThere = ['p199', 'p124', 'p77', 'p215', 'p434', 'p381', 'p128', 'p10'];
    return `${statusBar()}${screenBar(t('cloud_title'))}
    <div class="body"><div class="stack">
      <div class="panel" style="padding:18px 20px;display:flex;flex-direction:column;gap:12px">
        <div class="big"><div class="l">${t('plan_plus')} · ${bytes(100)}</div><div class="v">${bytes(38.2)}</div></div>${meter(38.2 / 100)}</div>
      <div class="panel" style="padding:18px 20px;display:flex;flex-direction:column;gap:16px">
        <div class="sw"><div class="n"><b>${t('settings_auto_backup')}</b><small>${t('settings_auto_backup_hint')}</small></div><div class="switch"><b>${mi('check')}</b></div></div>
        <div class="rule"></div>
        ${backupHero()}</div>
      <div class="sec">${label(t('cloud_sync_title'))}
        <div class="grid" style="grid-template-columns:repeat(4,1fr);border-radius:14px;overflow:hidden">
          ${onlyThere.map((src, i) => `<div class="cell"><img src="${P(src)}">${i === 1 || i === 6 ? `<span class="vd">${mi('play_arrow')}${i === 1 ? '1:08' : '0:37'}</span>` : ''}<i class="mo cl">cloud</i></div>`).join('')}</div></div>
    </div></div>${gestOnly()}`;
  },
};

// A phone's glass with one of SCREENS in it, drawn at f.w x f.h dp and scaled by f.zoom.
const screen = (name, f) => `<div class="glass" style="width:${f.w * f.zoom}px;height:${f.h * f.zoom}px"><div class="cam"></div>
  <div class="scr" style="zoom:${f.zoom};width:${f.w}px;height:${f.h}px">${SCREENS[name](f)}</div></div>`;

// Tab labels shrink to 9sp to stay on one line (NavBar.kt); screen-bar titles likewise.
function shrink(el, min) {
  let s = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth + 0.5 && s > min) { s -= .5; el.style.fontSize = s + 'px'; }
}
// What the app fits on its own: tab labels, tab titles, and the Collections shortcuts sharing one size.
function fitScreens() {
  document.querySelectorAll('.nav .lb').forEach(el => shrink(el, 9));
  document.querySelectorAll('.th h2').forEach(el => { el.style.overflow = 'hidden'; shrink(el, 20); });
  // Shortcut names share the largest size at which all of them fit (CollectionsScreen.kt ShortcutTiles).
  const names = [...document.querySelectorAll('.sc b')];
  for (let s = 14; names.some(b => b.scrollWidth > b.clientWidth) && s > 9; s -= .5) names.forEach(b => b.style.fontSize = s + 'px');
}
