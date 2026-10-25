// Yönetim paneli görünümleri.

import { renderDashboard } from './admin-dashboard.js';
import { APP_VERSION, CONFIG, CONSENT_VERSION, QUICK_TEST_MODE } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { eventLog } from '../services/event-log.js';
import { escapeHtml } from '../utils/format.js';
import { simulationMinutesText } from '../models/market-simulation.js';
import { participantRepository } from '../repositories/participant-repository.js';
import { section } from '../widgets/section.js';
import { TRIAL_SETS, stimulusFingerprint } from '../models/trial-generator.js';

// ═════════════════ ARAŞTIRMACI PANELİ ═════════════════
function renderAdminPanel() {
  const allocationCache = state.allocationCache;
  const count = allocationCache
    ? Object.keys(allocationCache).reduce(
        function (accumulator, item) {
          accumulator[allocationCache[item].grp]++;
          return accumulator;
        },
        { A: 0, B: 0 }
      )
    : null;
  let html =
    '<div class="is-wrongsheet-titlee"><span><b>Araştırmacı modu.</b> Bu bölüm katılımcıya görünmez. Kapatmak için logoya 5 kez dokun.</span></div>';
  if (participantRepository.mode() === 'firebase' && !participantRepository.isAdminAuthed())
    return (
      html +
      section(
        'Araştırmacı girişi',
        '<input id="admin-email" class="fiecard-labeld" type="email" placeholder="E-posta" aria-label="E-posta" autocomplete="username"><input id="admin-password" class="fiecard-labeld" type="password" placeholder="Şifre" aria-label="Şifre" autocomplete="current-password" style="margin-top:8px"><button class="button is-primary" style="margin-top:10px" data-a="adminLogin">Giriş yap</button>' +
          (state.adminError
            ? '<p class="price-down small-text">' + escapeHtml(state.adminError) + '</p>'
            : '')
      )
    );
  const items = ['controller', 'ethics', 'retention', 'hosting', 'support', 'contact'].filter(
    function (item) {
      return /^\[DOLDUR|ornek\.edu\.tr/.test(item === 'contact' ? CONFIG.contact : CONFIG.consentInfo[item]);
    }
  );
  html += section(
    'Onam metni',
    '<div class="key-value"><span>Sürüm</span><b>' +
      CONSENT_VERSION +
      '</b></div>' +
      (items.length
        ? '<div class="is-wrongsheet-titlee" style="margin:10px 0"><span><b>Doldurulmamış alan var:</b> ' +
          items.join(', ') +
          '. Pilottan önce <code>CFG.consentInfo</code> ve <code>CFG.contact</code> alanlarını doldur; aksi halde katılımcıya sarı işaretli yer tutucular görünür.</span></div>'
        : '<p class="price-up small-text" style="margin:8px 0">Tüm onam alanları dolu.</p>') +
      '<button class="button" data-a="downloadConsentText">Onam metnini indir (.txt)</button>'
  );
  html += section(
    'Sistem testi',
    '<p class="muted small-text" style="margin:0 0 10px">Depolama, Firebase bağlantısı ve yetki, olay kuyruğu, cihaz ve ekran bilgisini kontrol eder. <b>Pilottan önce her test cihazında çalıştır</b> ve sonucu kopyalayıp sakla.</p><button class="button is-primary" data-a="runSelfTest">Sistem testini çalıştır</button>'
  );
  html += section(
    'Hızlı test modu',
    CONFIG.firebase
      ? '<p class="muted small-text" style="margin:0">Gerçek pilot modunda (Firebase ayarlı) kullanılamaz; bu bilerek böyle.</p>'
      : '<div class="key-value"><span>Durum</span><b>' +
          (QUICK_TEST_MODE ? 'AÇIK' : 'kapalı') +
          '</b></div><p class="muted small-text" style="margin:6px 0 10px">Piyasa 10 kat hızlı akar (7,5 dk yerine yaklaşık 45 sn), bekleme 3 sn olur; fiyatlar, krizler ve haberler aynı günlerde gelir. Açıkken ekranda uyarı şeridi görünür ve 30 dk sonra kendiliğinden kapanır. Bu modda üretilen veri analizde kullanılmamalı (CSV\'de <code>test_mode</code> = 1). Adresin sonuna <code>?hizli=1</code> ekleyerek de açabilirsin.</p><button class="button' +
          (QUICK_TEST_MODE ? '' : ' is-primary') +
          '" data-a="toggleQuickMode">' +
          (QUICK_TEST_MODE ? 'Hızlı test modunu kapat' : 'Hızlı test modunu aç') +
          '</button>'
  );
  html += section(
    'Tanıtım modu',
    '<p class="muted small-text" style="margin:0 0 10px">Simülatörü serbestçe gösterir; hiçbir veri kaydedilmez, bekleme ekranı çıkmaz. Adrese <code>?demo=1</code> eklemek de aynı işi yapar (bazı görünümlerde adres değiştirilemez, o zaman bu düğme). Çıkmak için ⋯ menüsünden "Tanıtımdan çık".</p><button class="button" data-a="startDemo">Tanıtım modunu aç</button>'
  );
  html += renderDashboard();
  html += section(
    'Çalışma ayarları',
    '<div class="key-value"><span>Uygulama sürümü</span><b>' +
      APP_VERSION +
      '</b></div><div class="key-value"><span>Kayıt yeri</span><b>' +
      (participantRepository.mode() === 'firebase' ? 'Firebase' : 'Bu tarayıcı (demo)') +
      '</b></div><div class="key-value"><span>Oturum</span><b>' +
      escapeHtml(CONFIG.session) +
      '</b></div><div class="key-value"><span>Akış</span><b>' +
      TRIAL_SETS.X.length +
      ' karar → ' +
      simulationMinutesText() +
      ' dk simülatör → ' +
      TRIAL_SETS.Y.length +
      ' karar</b></div><div class="key-value"><span>Set sırası</span><b>X→Y / Y→X, gruplar içinde dengeli</b></div><div class="key-value"><span>Bekleme (A grubu)</span><b>Sadece simülatörde, ' +
      CONFIG.cooldownSec +
      ' sn, zarar ≤ %' +
      Math.abs(CONFIG.lossThreshold * 100) +
      '</b></div><div class="key-value"><span>Simülatör krizleri</span><b>' +
      CONFIG.simCrises
        .map(function (item) {
          return item.stocks.join('+') + ' @' + item.at;
        })
        .join(', ') +
      '</b></div><div class="key-value"><span>Gruplar arası fark</span><b>Sadece simülatördeki bekleme</b></div><div class="key-value"><span>Uyaran parmak izi</span><b class="tabular-number">' +
      stimulusFingerprint() +
      '</b></div>' +
      (state.participantCode
        ? '<div class="key-value"><span>Bu cihazdaki katılımcı</span><b>' +
          escapeHtml(state.participantCode) +
          ' / ' +
          state.group +
          '</b></div><div class="key-value"><span>Gönderilmeyi bekleyen olay</span><b>' +
          eventLog.queue.length +
          '</b></div>'
        : '') +
      (state.syncError
        ? '<p class="price-down small-text">Senkron hatası: ' + escapeHtml(state.syncError) + '</p>'
        : '') +
      '<p class="muted small-text" style="margin-top:10px">Parmak izi her cihazda aynı çıkmalı. Farklıysa katılımcılar farklı uyaranlar görüyor demektir.</p>'
  );
  html += section(
    'Randomizasyon listesi',
    (count
      ? '<div class="stat-row" style="margin:4px 0 12px"><div class="stat"><span>Toplam kod</span><b>' +
        (count.A + count.B) +
        '</b></div><div class="stat"><span>A (soğuma)</span><b>' +
        count.A +
        '</b></div><div class="stat"><span>B (kontrol)</span><b>' +
        count.B +
        '</b></div></div>'
      : '<button class="button" data-a="loadAllocations">Listeyi yükle</button>') +
      '<p class="muted small-text">Kodları katılımcılara tek tek dağıt. Hangi kodun hangi grupta olduğunu katılımcıyla paylaşma.</p><div style="display:flex;gap:8px;margin-top:10px"><input id="allocation-count" class="fiecard-labeld" type="number" inputmode="numeric" value="80" min="4" step="4" aria-label="Kişi sayısı"><button class="button small-text" style="white-space:nowrap" data-a="generateAllocations">Yeni liste</button></div><label class="field-label" for="poster-base-url">Kartlardaki link adresi</label><input id="poster-base-url" class="fiecard-labeld" data-in="baseIn" placeholder="https://…/ilk-lot.html" value="' +
      escapeHtml(state.baseUrlInput || CONFIG.baseUrl || location.origin + location.pathname) +
      '"><p class="muted small-text">Kendi yayın adresini yaz. claude.ai önizlemesinin adresi katılımcılar için çalışmaz.</p><button class="button is-primary" style="margin-top:10px" data-a="downloadCards">QR kartlarını indir (yazdırılabilir)</button><button class="button" data-a="downloadAllocations">Gizli liste: no, kod, grup, link (CSV)</button>' +
      (participantRepository.mode() === 'local' && count
        ? '<p class="muted small-text" style="margin-top:10px">Demo kodu: <b style="color:var(--tx)">' +
          Object.keys(allocationCache).sort()[0] +
          '</b></p>'
        : '')
  );
  html += section(
    'Çekilen katılımcılar',
    state.withdrawnCount == null
      ? '<button class="button" data-a="countWithdrawn">Say</button>'
      : '<div class="key-value"><span>Çekilen</span><b>' +
          state.withdrawnCount +
          '</b></div><p class="muted small-text">Çekilenlerin verisi dışa aktarmaya girmez.' +
          (participantRepository.mode() === 'firebase'
            ? ' Kayıtları silinmez; "withdrawn" olarak işaretli kalır ve analize girmez.'
            : ' Yerel modda veri çekilme anında silinir.') +
          '</p>'
  );
  html += section(
    'Poster',
    '<p class="muted small-text" style="margin:0 0 8px">Tanıtım sayfasının yayın adresini yaz. Posterdeki QR oraya gider.</p><input class="fiecard-labeld" data-in="landIn" placeholder="https://…/tanitim.html" value="' +
      escapeHtml(state.landingUrlInput || '') +
      '" aria-label="Tanıtım sayfası adresi"><input class="fiecard-labeld" style="margin-top:8px" data-in="posterMail" placeholder="İletişim e-postası (isteğe bağlı)" value="' +
      escapeHtml(state.posterEmail || '') +
      '" aria-label="İletişim e-postası"><input class="fiecard-labeld" style="margin-top:8px" data-in="posterFoot" placeholder="Alt bilgi, örn. Üniversite adı (isteğe bağlı)" value="' +
      escapeHtml(state.posterFooter || '') +
      '" aria-label="Alt bilgi"><div style="display:flex;gap:8px;margin-top:10px"><button class="button is-primary" style="flex:1" data-a="downloadPoster" data-v="A4">Poster A4</button><button class="button is-primary" style="flex:1;margin:0" data-a="downloadPoster" data-v="A3">Poster A3</button></div><button class="button" data-a="downloadPosterQr">Sadece QR (SVG)</button><p class="muted small-text" style="margin-top:10px">Posterde hipotez ve müdahale geçmez; katılımcıyı etkilememek için bilinçli olarak genel tutuldu.</p>'
  );
  html += section(
    'Veri dışa aktarma',
    '<button class="button is-primary" data-a="downloadParticipants">Katılımcı özeti (CSV)</button><button class="button" data-a="downloadEvents">Tüm olaylar (CSV)</button><p class="muted small-text" style="margin-top:10px">Özet dosyada panic_rate = zararına yapılan elle satışlar / tüm elle satışlar. Analizi olay dosyasından da yeniden hesaplayabilirsin.</p>' +
      (participantRepository.mode() === 'local'
        ? '<button class="button" style="margin-top:6px" data-a="resetLocalData">Yerel demo verisini sıfırla</button>'
        : '<button class="button" style="margin-top:6px" data-a="adminLogout">Araştırmacı çıkışı (' +
          escapeHtml(participantRepository.adminEmail()) +
          ')</button>')
  );
  return html;
}

// ───────────────── Araştırmacı paneli ve menü ─────────────────
export function renderAdmin() {
  return (
    '<div style="display:flex;align-items:center;gap:10px;margin:4px 0 14px"><button class="icon-button" data-a="closeAdmin" aria-label="Paneli kapat">‹</button><span style="font:700 22px var(--fd)">Araştırmacı paneli</span></div>' +
    renderAdminPanel()
  );
}
