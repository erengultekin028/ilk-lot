// Yönetim paneli eylemleri: giriş/çıkış, liste oluşturma, dışa aktarma, sistem testi.

import { loadDashboard } from './admin-dashboard.js';
import { adminRepository } from './admin-repository.js';
import { render } from './admin-shell.js';
import { adminState } from './admin-state.js';
import { participantUrl } from './admin-view.js';
import { exportAllocations, exportEvents, exportParticipants, exportPoster } from './admin-exports.js';
import { APP_VERSION } from '../constants/app-config.js';
import { consentText } from '../views/consent-view.js';
import { state } from '../viewmodels/app-state.js';
import { signInWithEmail, signOutUser } from '../services/auth-service.js';
import { stimulusFingerprint } from '../models/trial-generator.js';
import { buildAllocationList } from './allocation-builder.js';
import { byId } from '../utils/dom.js';
import { escapeHtml } from '../utils/format.js';
import { saveFile } from '../utils/file-download.js';
import { askConfirm, closeModal, openModal } from '../widgets/modal.js';
import { renderQrSvg } from '../widgets/qr-code.js';
import { showToast } from '../widgets/toast.js';

const errorText = (error) => (error && (error.code || error.message)) || String(error);

export const adminActions = {
  // ── Oturum ──
  adminLogin: async function () {
    adminState.adminError = '';
    try {
      adminState.user = await signInWithEmail(byId('admin-email').value, byId('admin-password').value);
    } catch (error) {
      adminState.adminError = 'Giriş başarısız: ' + errorText(error);
    }
    render();
  },
  adminLogout: async function () {
    await signOutUser();
    Object.assign(adminState, {
      user: null,
      allocationCache: null,
      enrollmentProgress: null,
      dashboard: null,
      withdrawnCount: null,
    });
    render();
  },
  reloadPage: function () {
    location.reload();
  },
  toggleTheme: function () {
    const root = document.documentElement;
    const theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('ilklot:theme', theme);
    } catch (error) {}
  },

  // ── Pano ve listeler ──
  refreshDashboard: function () {
    loadDashboard();
  },
  loadAllocations: async function () {
    try {
      adminState.allocationCache = await adminRepository.listAllocations();
      adminState.enrollmentProgress = await adminRepository.getEnrollmentProgress();
    } catch (error) {
      showToast('Liste okunamadı: ' + errorText(error));
    }
    render();
  },
  generateAllocations: function () {
    const count = Math.max(4, Math.round((parseInt(byId('allocation-count').value, 10) || 0) / 4) * 4);
    askConfirm(
      'Yeni liste',
      count + " kişilik yeni liste oluşturulacak. Firebase'deki mevcut yuvalar korunur, yenileri eklenir.",
      'Oluştur',
      false,
      function () {
        adminActions.generateAllocationsConfirmed(count);
      }
    );
  },
  generateAllocationsConfirmed: async function (count) {
    try {
      const current = await adminRepository.listAllocations();
      const allocationList = buildAllocationList(count, 4, Object.keys(current).length);
      // Yalnızca yeni kodlar ve yuvalar yazılır; mevcut kodlar ve grupları değişmez
      await adminRepository.createAllocationList(allocationList);
      adminState.allocationCache = await adminRepository.listAllocations();
      adminState.enrollmentProgress = await adminRepository.getEnrollmentProgress();
      showToast(count + ' yuva oluşturuldu.');
    } catch (error) {
      showToast('Kaydedilemedi: ' + errorText(error));
    }
    render();
  },
  countWithdrawn: async function () {
    const participants = await adminRepository.listParticipants();
    adminState.withdrawnCount = participants.filter(function (item) {
      return item.withdrawn;
    }).length;
    render();
  },

  // ── Dışa aktarma ──
  downloadAllocations: function () {
    exportAllocations().catch(function (error) {
      showToast('Dışa aktarılamadı: ' + errorText(error));
    });
  },
  downloadParticipants: function () {
    exportParticipants().catch(function (error) {
      showToast('Dışa aktarılamadı: ' + errorText(error));
    });
  },
  downloadEvents: function () {
    exportEvents().catch(function (error) {
      showToast('Dışa aktarılamadı: ' + errorText(error));
    });
  },
  downloadConsentText: function () {
    saveFile('ilklot_onam_metni.txt', consentText()).catch(function () {
      showToast('Metin indirilemedi.');
    });
  },

  // ── Katılım bağlantısı ve poster ──
  copyParticipationLink: function () {
    navigator.clipboard.writeText(participantUrl()).then(
      function () {
        showToast('Bağlantı kopyalandı.');
      },
      function () {
        showToast('Kopyalanamadı; adresi elle kopyala.');
      }
    );
  },
  downloadParticipationQr: function () {
    saveFile('ilklot_katilim_qr.svg', renderQrSvg(participantUrl(), 600));
  },
  downloadPoster: function (value) {
    exportPoster(value).catch(function (error) {
      showToast('Poster oluşturulamadı: ' + errorText(error));
    });
  },
  downloadPosterQr: function () {
    const url = (adminState.landingUrlInput || '').trim();
    if (!/^https?:\/\//.test(url)) {
      showToast('Önce tanıtım sayfasının adresini yaz (https:// ile).');
      return;
    }
    saveFile('ilklot_poster_qr.svg', renderQrSvg(url, 600));
  },

  // ── Pencereler ──
  confirmModal: function () {
    const callback = state.confirmCallback;
    state.confirmCallback = null;
    closeModal();
    if (callback) callback();
  },
  cancelModal: function () {
    state.confirmCallback = null;
    closeModal();
  },

  // ── Sistem testi ──
  runSelfTest: async function () {
    openModal('<h2>Sistem testi</h2><p>Çalışıyor…</p>');
    let results = [];
    try {
      results = await adminRepository.selfTest(adminState.user && adminState.user.email);
    } catch (error) {
      results = [{ ad: 'Sistem testi', ok: false, d: errorText(error) }];
    }
    const timezoneOffset = -new Date().getTimezoneOffset() / 60;
    results = results.concat([
      { ad: 'Uyaran parmak izi', ok: null, d: stimulusFingerprint() + ' (tüm cihazlarda aynı olmalı)' },
      { ad: 'Uygulama sürümü', ok: null, d: APP_VERSION },
      {
        ad: 'Cihaz saati',
        ok: null,
        d: new Date().toLocaleString('tr-TR') + ' · UTC' + (timezoneOffset >= 0 ? '+' : '') + timezoneOffset,
      },
      {
        ad: 'Ekran ve ağ',
        ok: navigator.onLine,
        d:
          innerWidth +
          '×' +
          innerHeight +
          ' · yoğunluk ' +
          devicePixelRatio +
          ' · ' +
          (navigator.onLine ? 'çevrimiçi' : 'ÇEVRİMDIŞI'),
      },
      { ad: 'Tarayıcı', ok: null, d: (navigator.userAgent || '').slice(0, 110) },
    ]);
    adminState.selfTestResults = results;
    const mark = (item) => (item.ok === true ? '✓' : item.ok === false ? '✗' : 'ⓘ');
    const colorName = (item) => (item.ok === true ? 'up' : item.ok === false ? 'dn' : 'mu');
    byId('modal-box').innerHTML =
      '<h2>Sistem testi</h2><div style="max-height:52vh;overflow:auto;text-align:left">' +
      results
        .map(function (item) {
          return (
            '<div class="key-value" style="align-items:flex-start;gap:10px"><span style="flex:none;font-weight:800;color:var(--' +
            colorName(item) +
            ')">' +
            mark(item) +
            '</span><span style="flex:1"><b style="color:var(--tx)">' +
            escapeHtml(item.ad) +
            '</b><br><span class="muted small-text">' +
            escapeHtml(item.d) +
            '</span></span></div>'
          );
        })
        .join('') +
      '</div>' +
      (results.some(function (item) {
        return item.ok === false;
      })
        ? '<div class="note" style="margin:10px 0"><span><b>Başarısız kontrol var.</b> Pilota başlamadan önce düzelt.</span></div>'
        : '') +
      '<button class="button" data-a="copySelfTest">Sonucu kopyala</button><button class="button is-primary" data-a="cancelModal">Kapat</button>';
  },
  copySelfTest: function () {
    const text = (adminState.selfTestResults || [])
      .map(function (item) {
        return (
          (item.ok === true ? '[OK] ' : item.ok === false ? '[HATA] ' : '[BİLGİ] ') + item.ad + ': ' + item.d
        );
      })
      .join('\n');
    navigator.clipboard.writeText(text).then(
      function () {
        showToast('Kopyalandı.');
      },
      function () {
        showToast('Kopyalanamadı; ekran görüntüsü al.');
      }
    );
  },
};
