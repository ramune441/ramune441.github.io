// contact.js — 全LP共有のお問い合わせモーダル
// 使い方: <script src="/contact/contact.js" defer></script> を読み込み、
// トリガーに data-contact-form="<product>" を付ける（クリックはdocument委譲なのでi18nのinnerHTML差し替え後も動く）。
// data-contact-label を併せて付けると、リンク文言も本スクリプトが html[lang] に連動して翻訳する。
// 送信先: Cloudflare Worker (contact-api)。html[lang] / dir=rtl は各ページの i18n スクリプトが管理する前提。
(function () {
  var API = 'https://contact-api.warload57.workers.dev/api/contact';

  var T = {
    ja: { contact: 'お問い合わせ', title: 'お問い合わせ', category: '種別', cat_bug: '不具合', cat_request: '要望', cat_other: 'その他', email: 'メールアドレス（任意・返信が必要な場合）', message: 'お問い合わせ内容', send: '送信', sending: '送信中…', done: '送信しました。ありがとうございます。', error: '送信に失敗しました。時間をおいて再度お試しください。', close: '閉じる' },
    en: { contact: 'Contact', title: 'Contact Us', category: 'Type', cat_bug: 'Bug report', cat_request: 'Feature request', cat_other: 'Other', email: 'Email (optional, if you need a reply)', message: 'Message', send: 'Send', sending: 'Sending…', done: 'Your message has been sent. Thank you!', error: 'Failed to send. Please try again later.', close: 'Close' },
    zh: { contact: '联系我们', title: '联系我们', category: '类型', cat_bug: '问题反馈', cat_request: '功能建议', cat_other: '其他', email: '邮箱（选填，需要回复时）', message: '内容', send: '发送', sending: '发送中…', done: '已发送，感谢您的反馈！', error: '发送失败，请稍后重试。', close: '关闭' },
    ko: { contact: '문의하기', title: '문의하기', category: '유형', cat_bug: '버그 신고', cat_request: '기능 요청', cat_other: '기타', email: '이메일 (선택, 답변이 필요한 경우)', message: '문의 내용', send: '보내기', sending: '보내는 중…', done: '전송되었습니다. 감사합니다!', error: '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.', close: '닫기' },
    es: { contact: 'Contacto', title: 'Contacto', category: 'Tipo', cat_bug: 'Informe de error', cat_request: 'Sugerencia', cat_other: 'Otro', email: 'Correo (opcional, si necesitas respuesta)', message: 'Mensaje', send: 'Enviar', sending: 'Enviando…', done: 'Mensaje enviado. ¡Gracias!', error: 'No se pudo enviar. Inténtalo más tarde.', close: 'Cerrar' },
    fr: { contact: 'Contact', title: 'Nous contacter', category: 'Type', cat_bug: 'Signaler un bug', cat_request: 'Suggestion', cat_other: 'Autre', email: 'E-mail (facultatif, si vous attendez une réponse)', message: 'Message', send: 'Envoyer', sending: 'Envoi…', done: 'Message envoyé. Merci !', error: "Échec de l'envoi. Veuillez réessayer plus tard.", close: 'Fermer' },
    de: { contact: 'Kontakt', title: 'Kontakt', category: 'Art', cat_bug: 'Fehlermeldung', cat_request: 'Funktionswunsch', cat_other: 'Sonstiges', email: 'E-Mail (optional, falls Antwort gewünscht)', message: 'Nachricht', send: 'Senden', sending: 'Wird gesendet…', done: 'Nachricht gesendet. Vielen Dank!', error: 'Senden fehlgeschlagen. Bitte später erneut versuchen.', close: 'Schließen' },
    it: { contact: 'Contatti', title: 'Contattaci', category: 'Tipo', cat_bug: 'Segnalazione bug', cat_request: 'Richiesta funzionalità', cat_other: 'Altro', email: 'Email (facoltativa, se desideri una risposta)', message: 'Messaggio', send: 'Invia', sending: 'Invio…', done: 'Messaggio inviato. Grazie!', error: 'Invio non riuscito. Riprova più tardi.', close: 'Chiudi' },
    pt: { contact: 'Contato', title: 'Fale conosco', category: 'Tipo', cat_bug: 'Relatar erro', cat_request: 'Sugestão', cat_other: 'Outro', email: 'E-mail (opcional, se precisar de resposta)', message: 'Mensagem', send: 'Enviar', sending: 'Enviando…', done: 'Mensagem enviada. Obrigado!', error: 'Falha ao enviar. Tente novamente mais tarde.', close: 'Fechar' },
    ru: { contact: 'Связаться', title: 'Обратная связь', category: 'Тип', cat_bug: 'Ошибка', cat_request: 'Пожелание', cat_other: 'Другое', email: 'Email (необязательно, если нужен ответ)', message: 'Сообщение', send: 'Отправить', sending: 'Отправка…', done: 'Сообщение отправлено. Спасибо!', error: 'Не удалось отправить. Попробуйте позже.', close: 'Закрыть' },
    ar: { contact: 'اتصل بنا', title: 'اتصل بنا', category: 'النوع', cat_bug: 'الإبلاغ عن خطأ', cat_request: 'اقتراح ميزة', cat_other: 'أخرى', email: 'البريد الإلكتروني (اختياري، إذا كنت بحاجة إلى رد)', message: 'الرسالة', send: 'إرسال', sending: 'جارٍ الإرسال…', done: 'تم إرسال رسالتك. شكرًا لك!', error: 'فشل الإرسال. يرجى المحاولة لاحقًا.', close: 'إغلاق' },
    hi: { contact: 'संपर्क करें', title: 'हमसे संपर्क करें', category: 'प्रकार', cat_bug: 'बग रिपोर्ट', cat_request: 'सुझाव', cat_other: 'अन्य', email: 'ईमेल (वैकल्पिक, यदि उत्तर चाहिए)', message: 'संदेश', send: 'भेजें', sending: 'भेजा जा रहा है…', done: 'आपका संदेश भेज दिया गया है। धन्यवाद!', error: 'भेजने में विफल। कृपया बाद में पुनः प्रयास करें।', close: 'बंद करें' },
    id: { contact: 'Hubungi kami', title: 'Hubungi Kami', category: 'Jenis', cat_bug: 'Laporan bug', cat_request: 'Saran fitur', cat_other: 'Lainnya', email: 'Email (opsional, jika perlu balasan)', message: 'Pesan', send: 'Kirim', sending: 'Mengirim…', done: 'Pesan terkirim. Terima kasih!', error: 'Gagal mengirim. Silakan coba lagi nanti.', close: 'Tutup' }
  };

  function lang() {
    var l = (document.documentElement.lang || 'ja').toLowerCase().split('-')[0];
    return T[l] ? l : 'en';
  }
  function t(k) { return T[lang()][k] || T.en[k]; }

  var CSS = '\
.cw-overlay{position:fixed;inset:0;background:rgba(4,6,14,.72);backdrop-filter:blur(3px);z-index:9990;display:flex;align-items:center;justify-content:center;padding:16px}\
.cw-modal{background:#131a2e;border:1px solid #312e81;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;padding:28px;color:#e2e8f0;font-size:15px;box-shadow:0 24px 64px rgba(0,0,0,.5)}\
.cw-modal h2{margin:0 0 18px;font-size:20px;color:#fff}\
.cw-modal label{display:block;margin:14px 0 6px;font-size:13px;color:#94a3b8}\
.cw-modal select,.cw-modal input,.cw-modal textarea{width:100%;box-sizing:border-box;background:#0a0e1a;color:#e2e8f0;border:1px solid #334;border-radius:8px;padding:10px 12px;font:inherit;font-size:14px}\
.cw-modal select:focus,.cw-modal input:focus,.cw-modal textarea:focus{outline:none;border-color:#6366f1}\
.cw-modal textarea{min-height:120px;resize:vertical}\
.cw-actions{display:flex;gap:10px;margin-top:20px;justify-content:flex-end}\
.cw-btn{border:none;border-radius:8px;padding:10px 22px;font:inherit;font-size:14px;cursor:pointer}\
.cw-send{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:700}\
.cw-send:disabled{opacity:.55;cursor:default}\
.cw-close{background:transparent;color:#94a3b8;border:1px solid #334}\
.cw-status{margin-top:14px;font-size:14px;display:none}\
.cw-status.cw-ok{display:block;color:#34d399}\
.cw-status.cw-ng{display:block;color:#f87171}\
.cw-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}\
';

  var overlay = null;

  function build(product) {
    if (!overlay) {
      var style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);
      overlay = document.createElement('div');
      overlay.className = 'cw-overlay';
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.parentNode) close(); });
      document.body.appendChild(overlay);
    }
    overlay.innerHTML =
      '<div class="cw-modal" role="dialog" aria-modal="true" dir="' + (lang() === 'ar' ? 'rtl' : 'ltr') + '">' +
      '<h2>' + t('title') + '</h2>' +
      '<form>' +
      '<label>' + t('category') + '</label>' +
      '<select name="category">' +
      '<option value="bug">' + t('cat_bug') + '</option>' +
      '<option value="request">' + t('cat_request') + '</option>' +
      '<option value="other">' + t('cat_other') + '</option>' +
      '</select>' +
      '<label>' + t('email') + '</label>' +
      '<input type="email" name="email" autocomplete="email">' +
      '<label>' + t('message') + '</label>' +
      '<textarea name="message" required maxlength="5000"></textarea>' +
      '<div class="cw-hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>' +
      '<div class="cw-status"></div>' +
      '<div class="cw-actions">' +
      '<button type="button" class="cw-btn cw-close">' + t('close') + '</button>' +
      '<button type="submit" class="cw-btn cw-send">' + t('send') + '</button>' +
      '</div>' +
      '</form></div>';

    overlay.querySelector('.cw-close').addEventListener('click', close);
    overlay.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      submit(this, product);
    });
    overlay.style.display = 'flex';
    overlay.querySelector('textarea').focus();
  }

  function close() {
    if (overlay) overlay.style.display = 'none';
  }

  function submit(form, product) {
    var btn = form.querySelector('.cw-send');
    var status = form.querySelector('.cw-status');
    btn.disabled = true;
    btn.textContent = t('sending');
    status.className = 'cw-status';
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: product,
        category: form.category.value,
        email: form.email.value.trim(),
        message: form.message.value.trim(),
        lang: lang(),
        website: form.website.value
      })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) throw new Error(d.error || 'error');
      form.querySelectorAll('select,input,textarea,button[type=submit]').forEach(function (el) { el.disabled = true; });
      status.className = 'cw-status cw-ok';
      status.textContent = t('done');
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = t('send');
      status.className = 'cw-status cw-ng';
      status.textContent = t('error');
    });
  }

  // トリガー（i18nがinnerHTMLを差し替えても動くようdocument委譲）
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-contact-form]') : null;
    if (!a) return;
    e.preventDefault();
    build(a.getAttribute('data-contact-form'));
  });

  // data-contact-label 付きトリガーの文言を html[lang] に連動して翻訳
  function applyLabels() {
    document.querySelectorAll('[data-contact-label]').forEach(function (el) { el.textContent = t('contact'); });
  }
  new MutationObserver(applyLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLabels);
  } else {
    applyLabels();
  }
})();
