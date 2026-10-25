// Yönetim paneli görünümleri: giriş formu ve araştırmacı paneli.

import { renderDashboard } from './admin-dashboard.js';
import { renderTestRecordsSection } from './admin-records-view.js';
import { adminState } from './admin-state.js';
import { APP_VERSION, CONFIG, CONSENT_VERSION } from '../constants/app-config.js';
import { escapeHtml } from '../utils/format.js';
import { simulationMinutesText } from '../models/market-simulation.js';
import { section } from '../widgets/section.js';
import { TRIAL_SETS, stimulusFingerprint } from '../models/trial-generator.js';

// Katılımcıların gireceği adres: elle yazılan > CONFIG.baseUrl > bu sitenin kökü (yönetim paneli /admin/ altındaysa)
export function participantUrl() {
  if (adminState.participantUrlInput) return adminState.participantUrlInput;
  if (CONFIG.baseUrl) return CONFIG.baseUrl;
  return location.origin + location.pathname.replace(/admin\/(index\.html)?$/, '');
}

function renderLogin() {
  return section(
    'Araştırmacı girişi',
    '<p class="muted small-text" style="margin:0 0 10px">Bu sayfa yalnızca araştırmacı içindir. Katılımcılar için ana adresi kullan.</p>' +
      '<input id="admin-email" class="field" type="email" placeholder="E-posta" aria-label="E-posta" autocomplete="username">' +
      '<input id="admin-password" class="field" type="password" placeholder="Şifre" aria-label="Şifre" autocomplete="current-password" style="margin-top:8px">' +
      '<button class="button is-primary" style="margin-top:10px" data-a="adminLogin">Giriş yap</button>' +
      (adminState.adminError
        ? '<p class="price-down small-text">' + escapeHtml(adminState.adminError) + '</p>'
        : '')
  );
}

function renderConsentSection() {
  const unfilled = ['controller', 'ethics', 'retention', 'hosting', 'support', 'contact'].filter(
    function (key) {
      return /^\[DOLDUR|ornek\.edu\.tr/.test(key === 'contact' ? CONFIG.contact : CONFIG.consentInfo[key]);
    }
  );
  return section(
    'Onam metni',
    '<div class="key-value"><span>Sürüm</span><b>' +
      CONSENT_VERSION +
      '</b></div>' +
      (unfilled.length
        ? '<div class="note" style="margin:10px 0"><span><b>Doldurulmamış alan var:</b> ' +
          unfilled.join(', ') +
          '. Pilottan önce <code>CONFIG.consentInfo</code> ve <code>CONFIG.contact</code> alanlarını doldur; aksi halde katılımcıya sarı işaretli yer tutucular görünür.</span></div>'
        : '<p class="price-up small-text" style="margin:8px 0">Tüm onam alanları dolu.</p>') +
      '<button class="button" data-a="downloadConsentText">Onam metnini indir (.txt)</button>'
  );
}

function renderSelfTestSection() {
  return section(
    'Sistem testi',
    '<p class="muted small-text" style="margin:0 0 10px">Firebase bağlantısını, yazma yetkisini, olay kuyruğunu, cihaz ve ekran bilgisini kontrol eder. <b>Pilottan önce çalıştır</b> ve sonucu kopyalayıp sakla.</p>' +
      '<button class="button is-primary" data-a="runSelfTest">Sistem testini çalıştır</button>'
  );
}

function renderSettingsSection() {
  return section(
    'Çalışma ayarları',
    '<div class="key-value"><span>Uygulama sürümü</span><b>' +
      APP_VERSION +
      '</b></div>' +
      '<div class="key-value"><span>Kayıt yeri</span><b>Firebase (' +
      escapeHtml(CONFIG.firebase.projectId) +
      ')</b></div>' +
      '<div class="key-value"><span>Oturum</span><b>' +
      escapeHtml(CONFIG.session) +
      '</b></div>' +
      '<div class="key-value"><span>Akış</span><b>' +
      TRIAL_SETS.X.length +
      ' karar → ' +
      simulationMinutesText() +
      ' dk simülatör → ' +
      TRIAL_SETS.Y.length +
      ' karar</b></div>' +
      '<div class="key-value"><span>Set sırası</span><b>X→Y / Y→X, gruplar içinde dengeli</b></div>' +
      '<div class="key-value"><span>Bekleme (A grubu)</span><b>Sadece simülatörde, ' +
      CONFIG.cooldownSec +
      ' sn, zarar ≤ %' +
      Math.abs(CONFIG.lossThreshold * 100) +
      '</b></div>' +
      '<div class="key-value"><span>Simülatör krizleri</span><b>' +
      CONFIG.simCrises
        .map(function (crisis) {
          return crisis.stocks.join('+') + ' @' + crisis.at;
        })
        .join(', ') +
      '</b></div>' +
      '<div class="key-value"><span>Gruplar arası fark</span><b>Sadece simülatördeki bekleme</b></div>' +
      '<div class="key-value"><span>Uyaran parmak izi</span><b class="tabular-number">' +
      stimulusFingerprint() +
      '</b></div>' +
      '<p class="muted small-text" style="margin-top:10px">Parmak izi her cihazda aynı çıkmalı. Farklıysa katılımcılar farklı uyaranlar görüyor demektir.</p>'
  );
}

// Randomizasyon listesi: her kod bir "yuva"dır; katılımcılar onamdan sonra sıradaki yuvayı otomatik alır (kod girmezler)
function renderAllocationSection() {
  const allocations = adminState.allocationCache;
  const counts = allocations
    ? Object.keys(allocations).reduce(
        function (sum, code) {
          sum[allocations[code].grp]++;
          return sum;
        },
        { A: 0, B: 0 }
      )
    : null;
  const progress = adminState.enrollmentProgress;
  return section(
    'Randomizasyon listesi (yuvalar)',
    (counts
      ? '<div class="stat-row" style="margin:4px 0 12px"><div class="stat"><span>Toplam yuva</span><b>' +
        (counts.A + counts.B) +
        '</b></div>' +
        '<div class="stat"><span>A (bekleme)</span><b>' +
        counts.A +
        '</b></div><div class="stat"><span>B (kontrol)</span><b>' +
        counts.B +
        '</b></div></div>' +
        (progress
          ? '<div class="key-value"><span>Alınan yuva</span><b>' +
            progress.claimed +
            '</b></div><div class="key-value"><span>Sıradaki yuva</span><b>' +
            (progress.next == null ? '—' : progress.next) +
            '</b></div>'
          : '')
      : '<button class="button" data-a="loadAllocations">Listeyi yükle</button>') +
      '<p class="muted small-text">Katılımcılar kod girmez: onamdan sonra sıradaki boş yuvayı otomatik alır; grubunu seçemez. Liste biterse yeni liste oluştur. Hangi yuvanın hangi grupta olduğunu katılımcıyla paylaşma.</p>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><input id="allocation-count" class="field" type="number" inputmode="numeric" value="80" min="4" step="4" aria-label="Kişi sayısı"><button class="button small-text" style="white-space:nowrap" data-a="generateAllocations">Yeni liste</button></div>' +
      '<button class="button" style="margin-top:10px" data-a="downloadAllocations">Gizli liste: no, kod, grup (CSV)</button>'
  );
}

// Katılım bağlantısı: tüm katılımcılar için tek ortak adres (QR ile de dağıtılabilir)
function renderParticipationLinkSection() {
  return section(
    'Katılım bağlantısı',
    '<p class="muted small-text" style="margin:0 0 8px">Katılımcılara verilecek tek ortak adres. Yönetim paneli ayrı bir sitedeyse buraya katılımcı sitesinin adresini yaz.</p>' +
      '<input id="participant-url" class="field" data-in="participantUrl" placeholder="https://…" value="' +
      escapeHtml(participantUrl()) +
      '" aria-label="Katılım adresi">' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="button is-primary" style="flex:1" data-a="copyParticipationLink">Bağlantıyı kopyala</button><button class="button" style="flex:1;margin:0" data-a="downloadParticipationQr">QR (SVG)</button></div>'
  );
}

function renderWithdrawnSection() {
  return section(
    'Çekilen katılımcılar',
    adminState.withdrawnCount == null
      ? '<button class="button" data-a="countWithdrawn">Say</button>'
      : '<div class="key-value"><span>Çekilen</span><b>' +
          adminState.withdrawnCount +
          '</b></div><p class="muted small-text">Çekilenlerin verisi dışa aktarmaya girmez. Kayıtları silinmez; "withdrawn" olarak işaretli kalır ve analize girmez.</p>'
  );
}

function renderPosterSection() {
  return section(
    'Poster',
    '<p class="muted small-text" style="margin:0 0 8px">Tanıtım sayfasının yayın adresini yaz. Posterdeki QR oraya gider.</p>' +
      '<input class="field" data-in="landingUrl" placeholder="https://…/tanitim.html" value="' +
      escapeHtml(adminState.landingUrlInput || '') +
      '" aria-label="Tanıtım sayfası adresi">' +
      '<input class="field" style="margin-top:8px" data-in="posterEmail" placeholder="İletişim e-postası (isteğe bağlı)" value="' +
      escapeHtml(adminState.posterEmail || '') +
      '" aria-label="İletişim e-postası">' +
      '<input class="field" style="margin-top:8px" data-in="posterFooter" placeholder="Alt bilgi, örn. Üniversite adı (isteğe bağlı)" value="' +
      escapeHtml(adminState.posterFooter || '') +
      '" aria-label="Alt bilgi">' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button class="button is-primary" style="flex:1" data-a="downloadPoster" data-v="A4">Poster A4</button><button class="button is-primary" style="flex:1;margin:0" data-a="downloadPoster" data-v="A3">Poster A3</button></div>' +
      '<button class="button" data-a="downloadPosterQr">Sadece QR (SVG)</button>' +
      '<p class="muted small-text" style="margin-top:10px">Posterde hipotez ve müdahale geçmez; katılımcıyı etkilememek için bilinçli olarak genel tutuldu.</p>'
  );
}

function renderExportSection() {
  return section(
    'Veri dışa aktarma',
    '<button class="button is-primary" data-a="downloadParticipants">Katılımcı özeti (CSV)</button><button class="button" data-a="downloadEvents">Tüm olaylar (CSV)</button>' +
      '<p class="muted small-text" style="margin-top:10px">Özet dosyada panic_rate = zararına yapılan elle satışlar / tüm elle satışlar. Analizi olay dosyasından da yeniden hesaplayabilirsin.</p>' +
      '<button class="button" style="margin-top:6px" data-a="adminLogout">Araştırmacı çıkışı (' +
      escapeHtml(adminState.user.email) +
      ')</button>'
  );
}

// Sayfanın tamamı: giriş yapılmamışsa giriş formu, yapılmışsa panel
export function renderAdminPage() {
  const heading = '<h1 class="admin-title">Araştırmacı paneli</h1>';
  if (adminState.connectionError)
    return (
      heading +
      '<div class="note"><span><b>Bağlantı kurulamadı.</b> ' +
      escapeHtml(adminState.connectionError) +
      '</span></div><button class="button is-primary" data-a="reloadPage">Sayfayı yenile</button>'
    );
  if (!adminState.user) return heading + renderLogin();
  return (
    heading +
    '<div class="admin-grid">' +
    renderDashboard() +
    renderAllocationSection() +
    renderParticipationLinkSection() +
    renderExportSection() +
    renderWithdrawnSection() +
    renderTestRecordsSection() +
    renderConsentSection() +
    renderSelfTestSection() +
    renderSettingsSection() +
    renderPosterSection() +
    '</div>'
  );
}
