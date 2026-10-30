// 動画専用の翻訳。LP全体の対応言語とは独立して、公開済み12言語と追加8言語を扱う。
(() => {
  const names = {id:'Bahasa Indonesia',ar:'العربية',vi:'Tiếng Việt',tr:'Türkçe',pl:'Polski',th:'ภาษาไทย',nl:'Nederlands',bn:'বাংলা'};
  const keys = ['b1','b4','a3','a4','watch','adjust','left','center','right','hint','drag','resize','panel','color','opacity','reset','detected','languages','appearance','size','dual','choose','onScreen','style','cap0','cap1','cap3','features','featureh','sync','privacy','cue4'];
  const rows = {
    id:[
      'Hanya satu bahasa takarir','Ukuran dan posisi takarir tetap','Seret, ubah ukuran dan perataan di video','Warna tiap baris, pengaturan tiap situs','Tonton dan sesuaikan','Seret untuk memindah, gulir untuk ukuran, klik kanan untuk warna.',
      'Kiri','Tengah','Kanan','Seret: pindah / Panah: geser / Gulir: ukuran / Klik kanan: warna','Seret untuk memindah','Gulir untuk mengubah ukuran','Pengaturan tampilan SubDuo','Warna teks','Transparansi latar','Atur ulang warna dan transparansi','Terdeteksi: 6 bahasa','Bahasa','Tampilan','Ukuran teks',
      'Takarir ganda','Pilih bahasa','Atur di layar','Gaya tiap baris','Dua bahasa dalam satu kotak. Bahasa asli di atas, bahasa Anda di bawah.','Pilih dua bahasa di popup. Semua takarir yang tersedia untuk judul itu ditampilkan.','Atur warna teks serta transparansi teks dan latar secara terpisah untuk tiap baris.','Fitur','Kecil, tetapi lengkap','Pengaturan disimpan per situs dan disinkronkan melalui akun Chrome Anda.','Privasi Anda','Beberapa pintu hanya terbuka sekali.'
    ],
    ar:[
      'لغة ترجمة نصية واحدة فقط','حجم وموضع ثابتان للترجمة','اسحب وغيّر الحجم والمحاذاة على الفيديو','لون لكل سطر وإعدادات لكل موقع','شاهد واضبط','اسحب للتحريك، ومرّر لتغيير الحجم، وانقر بالزر الأيمن لتغيير الألوان.',
      'يسار','وسط','يمين','سحب: تحريك / أسهم: ضبط / تمرير: حجم / زر أيمن: ألوان','اسحب للتحريك','مرّر لتغيير حجم السطر','إعدادات عرض SubDuo','لون النص','شفافية الخلفية','إعادة ضبط الألوان والشفافية','تم اكتشاف 6 لغات','اللغات','المظهر','حجم النص',
      'ترجمة نصية بلغتين','اختر اللغات','اضبط على الشاشة','نسّق كل سطر','لغتان في إطار واحد. الأصل في الأعلى ولغتك في الأسفل.','اختر لغتين من النافذة المنبثقة. تظهر كل الترجمات النصية المتاحة للعمل.','اضبط لون النص وشفافية النص والخلفية لكل سطر على حدة.','المزايا','إضافة صغيرة ومدروسة','تُحفظ إعدادات كل موقع على حدة وتُزامن عبر حساب Chrome.','خصوصيتك','بعض الأبواب لا تُفتح إلا مرة واحدة.'
    ],
    vi:[
      'Chỉ một ngôn ngữ phụ đề','Cỡ chữ và vị trí cố định','Kéo, đổi cỡ và căn ngay trên video','Màu riêng từng dòng, cài đặt riêng từng trang','Xem và điều chỉnh','Kéo để di chuyển, cuộn để đổi cỡ, nhấp phải để đổi màu.',
      'Trái','Giữa','Phải','Kéo: di chuyển / Phím mũi tên: chỉnh / Cuộn: cỡ / Nhấp phải: màu','Kéo để di chuyển','Cuộn để đổi cỡ dòng','Cài đặt hiển thị SubDuo','Màu chữ','Độ trong suốt nền','Đặt lại màu và độ trong suốt','Đã tìm thấy: 6 ngôn ngữ','Ngôn ngữ','Giao diện','Cỡ chữ',
      'Phụ đề song ngữ','Chọn ngôn ngữ','Chỉnh ngay trên màn hình','Kiểu riêng từng dòng','Hai ngôn ngữ trong một khung. Tiếng gốc ở trên, tiếng của bạn ở dưới.','Chọn hai ngôn ngữ trong cửa sổ tiện ích. Mọi phụ đề có sẵn của phim đều được liệt kê.','Đặt màu chữ, độ trong suốt chữ và nền riêng cho từng dòng.','Tính năng','Nhỏ gọn, đầy đủ','Cài đặt được lưu riêng từng trang và đồng bộ qua tài khoản Chrome.','Quyền riêng tư','Có những cánh cửa chỉ mở một lần.'
    ],
    tr:[
      'Aynı anda yalnızca bir altyazı dili','Sabit altyazı boyutu ve konumu','Videonun üzerinde taşı, boyutlandır ve hizala','Her satırın rengi, her sitenin ayarı ayrı','İzle ve ayarla','Taşımak için sürükle, boyut için kaydır, renk için sağ tıkla.',
      'Sol','Orta','Sağ','Sürükle: taşı / Oklar: ince ayar / Kaydır: boyut / Sağ tık: renk','Taşımak için sürükle','Boyut için kaydır','SubDuo görüntü ayarları','Yazı rengi','Arka plan saydamlığı','Renkleri ve saydamlığı sıfırla','Algılandı: 6 dil','Diller','Görünüm','Yazı boyutu',
      'Çift altyazı','Dilleri seç','Ekranda ayarla','Her satırı biçimlendir','Tek kutuda iki dil. Üstte özgün dil, altta sizin diliniz.','Açılır pencerede iki dil seçin. Yapımın tüm mevcut altyazıları listelenir.','Yazı rengini, yazı ve arka plan saydamlığını her satır için ayrı ayarlayın.','Özellikler','Küçük ama özenli','Ayarlar her site için ayrı kaydedilir ve Chrome hesabınızla eşitlenir.','Gizliliğiniz','Bazı kapılar yalnızca bir kez açılır.'
    ],
    pl:[
      'Tylko jeden język napisów naraz','Stały rozmiar i położenie napisów','Przesuwaj, zmieniaj rozmiar i wyrównanie na filmie','Osobny kolor wiersza i ustawienia witryny','Oglądaj i dostosuj','Przeciągnij, aby przesunąć; przewiń, aby zmienić rozmiar; kliknij prawym, aby zmienić kolory.',
      'Lewo','Środek','Prawo','Przeciągnij: przesuń / Strzałki: popraw / Kółko: rozmiar / Prawy: kolory','Przeciągnij, aby przesunąć','Przewiń, aby zmienić rozmiar','Ustawienia wyświetlania SubDuo','Kolor tekstu','Przezroczystość tła','Przywróć kolory i przezroczystość','Wykryto: 6 języków','Języki','Wygląd','Rozmiar tekstu',
      'Podwójne napisy','Wybierz języki','Dostosuj na ekranie','Styl każdego wiersza','Dwa języki w jednej ramce. Oryginał u góry, Twój język na dole.','Wybierz dwa języki w oknie rozszerzenia. Lista zawiera wszystkie napisy dostępne dla filmu.','Ustaw kolor tekstu oraz przezroczystość tekstu i tła osobno dla każdego wiersza.','Funkcje','Małe, ale przemyślane','Ustawienia są zapisywane osobno dla każdej witryny i synchronizowane przez konto Chrome.','Twoja prywatność','Niektóre drzwi otwierają się tylko raz.'
    ],
    th:[
      'แสดงคำบรรยายได้ทีละภาษา','ขนาดและตำแหน่งคำบรรยายตายตัว','ลาก ปรับขนาด และจัดแนวบนวิดีโอ','แยกสีแต่ละบรรทัดและการตั้งค่าแต่ละเว็บ','รับชมและปรับแต่ง','ลากเพื่อย้าย เลื่อนเพื่อปรับขนาด คลิกขวาเพื่อเปลี่ยนสี',
      'ซ้าย','กลาง','ขวา','ลาก: ย้าย / ลูกศร: ขยับ / เลื่อน: ขนาด / คลิกขวา: สี','ลากเพื่อย้าย','เลื่อนเพื่อปรับขนาดบรรทัด','การตั้งค่าการแสดงผล SubDuo','สีข้อความ','ความโปร่งใสพื้นหลัง','รีเซ็ตสีและความโปร่งใส','ตรวจพบ: 6 ภาษา','ภาษา','รูปลักษณ์','ขนาดข้อความ',
      'คำบรรยายสองภาษา','เลือกภาษา','ปรับบนหน้าจอ','แต่งแต่ละบรรทัด','สองภาษาในกรอบเดียว ต้นฉบับอยู่ด้านบน ภาษาของคุณอยู่ด้านล่าง','เลือกสองภาษาในป๊อปอัป โดยจะแสดงคำบรรยายทั้งหมดที่วิดีโอมีให้','ปรับสีข้อความ ความโปร่งใสข้อความและพื้นหลังแยกกันในแต่ละบรรทัด','คุณสมบัติ','เล็กแต่ใส่ใจทุกรายละเอียด','บันทึกการตั้งค่าแยกตามเว็บไซต์และซิงค์ผ่านบัญชี Chrome ของคุณ','ความเป็นส่วนตัว','ประตูบางบานเปิดเพียงครั้งเดียว'
    ],
    nl:[
      'Eén ondertitelingstaal tegelijk','Vaste grootte en positie','Sleep, schaal en lijn uit op de video','Eigen kleuren per regel, instellingen per site','Kijk en pas aan','Sleep om te verplaatsen, scroll voor de grootte en klik rechts voor kleuren.',
      'Links','Midden','Rechts','Slepen: verplaatsen / Pijlen: bijstellen / Scrollen: grootte / Rechtsklik: kleuren','Sleep om te verplaatsen','Scroll om de regel te vergroten','SubDuo-weergave-instellingen','Tekstkleur','Achtergrondtransparantie','Kleuren en transparantie herstellen','Gevonden: 6 talen','Talen','Weergave','Tekstgrootte',
      'Dubbele ondertiteling','Kies talen','Pas aan op het scherm','Stijl per regel','Twee talen in één kader. Het origineel boven, jouw taal onder.','Kies twee talen in de pop-up. Alle ondertitels van de titel staan in de lijst.','Stel tekstkleur, teksttransparantie en achtergrondtransparantie per regel in.','Functies','Klein en doordacht','Instellingen worden per site bewaard en via je Chrome-account gesynchroniseerd.','Jouw privacy','Sommige deuren gaan maar één keer open.'
    ],
    bn:[
      'একবারে শুধু একটি ভাষার সাবটাইটেল','সাবটাইটেলের আকার ও অবস্থান নির্দিষ্ট','ভিডিওতেই সরান, আকার ও সারিবিন্যাস বদলান','প্রতি লাইনের রং ও প্রতি সাইটের সেটিং আলাদা','দেখুন ও সাজিয়ে নিন','সরাতে টানুন, আকার বদলাতে স্ক্রল করুন, রঙের জন্য ডান-ক্লিক করুন।',
      'বাম','মাঝে','ডান','টানুন: সরান / তির: সামান্য সরান / স্ক্রল: আকার / ডান-ক্লিক: রং','টেনে সরান','স্ক্রল করে আকার বদলান','SubDuo প্রদর্শন সেটিং','লেখার রং','পটভূমির স্বচ্ছতা','রং ও স্বচ্ছতা রিসেট','পাওয়া গেছে: ৬টি ভাষা','ভাষা','চেহারা','লেখার আকার',
      'দুই ভাষার সাবটাইটেল','ভাষা বেছে নিন','পর্দাতেই ঠিক করুন','প্রতি লাইনের সাজ আলাদা','এক ফ্রেমে দুই ভাষা। উপরে মূল ভাষা, নিচে আপনার ভাষা।','পপআপে দুইটি ভাষা বেছে নিন। ভিডিওটির সব উপলব্ধ সাবটাইটেল তালিকায় থাকে।','প্রতি লাইনের লেখার রং, লেখা ও পটভূমির স্বচ্ছতা আলাদা করে ঠিক করুন।','সুবিধা','ছোট, তবু যত্নে তৈরি','প্রতি সাইটের সেটিং আলাদা করে রাখা হয় এবং Chrome অ্যাকাউন্টে সিঙ্ক হয়।','আপনার গোপনীয়তা','কিছু দরজা জীবনে একবারই খোলে।'
    ]
  };
  const clean = s => s.replace(/^[^\p{L}\p{N}]+/u,'');
  const copy = {};
  for (const [lang, row] of Object.entries(rows)) {
    if (row.length !== keys.length) throw new Error(`Incomplete promo translation: ${lang}`);
    const p = Object.fromEntries(keys.map((key,i) => [key,row[i]]));
    const s = SUBDUO_STORE_EXTRA[lang];
    copy[lang] = {
      hero_h1:s.fb_title.replace(/<em>/g,"<span class='accent'>").replace(/<\/em>/g,'</span>'),
      tag_compare:`${s.bl} / ${s.al}`,problem_h2:s.h2,ba_before:s.bl,ba_b1:p.b1,ba_b2:clean(s.bc3),ba_b3:clean(s.bc2),ba_b4:p.b4,ba_after:s.al,ba_a1:s.h1,ba_a2:s.st3,ba_a3:p.a3,ba_a4:p.a4,
      tag_how:clean(s.e5),flow_h2:s.h5,flow1_h3:s.st1,flow1_p:`${s.st2}: Prime Video, YouTube, Netflix, Disney+ & TED.`,flow2_h3:s.st3,flow2_p:s.s4,flow3_h3:p.watch,flow3_p:p.adjust,
      demo_title:s.title,demo_ep:s.ep,tb_left:p.left,tb_center:p.center,tb_right:p.right,sd_hint:p.hint,anno_drag:p.drag,anno_wheel:p.resize,
      pn_title:p.panel,pn_top:s.pu_top,pn_color:p.color,pn_bg_op:p.opacity,pn_bottom:s.pu_bottom,pn_reset:p.reset,pu_status:p.detected,pu_sec_lang:p.languages,pu_top:s.pu_top,pu_lang_a:'English',pu_lang_b:names[lang],pu_bottom:s.pu_bottom,pu_sec_app:p.appearance,pu_color:p.color,pu_size:p.size,
      demo_tab0:p.dual,demo_cap0:`<b>${p.dual}.</b> ${p.cap0}`,demo_tab1:p.choose,demo_cap1:`<b>${p.choose}.</b> ${p.cap1}`,demo_tab2:p.onScreen,demo_cap2:`<b>${p.onScreen}.</b> ${p.adjust}`,demo_tab3:p.style,demo_cap3:`<b>${p.style}.</b> ${p.cap3}`,
      tag_features:p.features,features_h2:p.featureh,feat1_h3:clean(s.p2),feat1_p:'Prime Video · YouTube · Netflix · Disney+ · TED',feat2_h3:s.st3,feat2_p:s.s4,feat3_h3:p.onScreen,feat3_p:p.adjust,feat4_h3:p.style,feat4_p:p.cap3,feat5_h3:clean(s.p4),feat5_p:p.sync,safe1_h3:p.privacy,safety_lead:s.s5,
      cta_h2:s.h1,cta_btn:s.addbtn,hero_note:clean(s.p1),
      cue1_a:s.cue1_a,cue1_b:s.cue1_b,cue2_a:s.cue2_a,cue2_b:s.cue2_b,cue3_a:s.cue3_a.replace(/<[^>]+>/g,''),cue3_b:s.cue3_b,cue4_a:'Some doors only open once.',cue4_b:p.cue4
    };
    LP_MESSAGES[lang] = copy[lang];
  }
  globalThis.SUBDUO_PROMO = {names,copy,locales:['en','ja','zh','zh-TW','ko','es','fr','de','pt','hi','id','ar','vi','it','tr','pl','th','nl','ru','bn'],additional:Object.keys(copy),duration:39.5};
  document.addEventListener('lp:lang', () => {
    document.documentElement.dir = document.documentElement.lang === 'ar' ? 'rtl' : 'ltr';
  });
})();
