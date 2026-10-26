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
import { currentBuildNumber, selectedRecordCount } from './admin-records-view.js';
import { describeRecord, filterRecords, planMark, planUnmark } from './test-records.js';
import { backupFileName, buildBackup, verifyBackup } from './backup.js';
import { dismissWhatsNew } from './whats-new.js';
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
      recordSource: null,
      recordRows: null,
      selectedRecords: {},
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
      return item.withdrawn && !item.testRecord;
    }).length;
    render();
  },

  // ── Test kayıtları: denemelerden kalan kayıtları analizden ayırma (silme yok, işaret geri alınabilir) ──
  loadTestRecords: async function () {
    adminState.recordBusy = true;
    render();
    try {
      const [participants, allocations] = await Promise.all([
        adminRepository.listParticipants(),
        adminRepository.listAllocations(),
      ]);
      const source = {};
      participants.forEach(function (item) {
        if (item.code) source[item.code] = item;
      });
      adminState.recordSource = source;
      adminState.recordRows = Object.keys(source)
        .map(function (code) {
          return describeRecord(source[code], allocations[code] ? allocations[code].no : null);
        })
        .sort(function (left, right) {
          return (left.slot == null ? 1e9 : left.slot) - (right.slot == null ? 1e9 : right.slot);
        });
      adminState.selectedRecords = {};
    } catch (error) {
      showToast('Kayıtlar okunamadı: ' + errorText(error));
    }
    adminState.recordBusy = false;
    render();
  },
  setRecordFilter: function (value) {
    adminState.recordFilter = value;
    adminState.selectedRecords = {};
    render();
  },
  toggleRecord: function (code, checked) {
    if (checked) adminState.selectedRecords[code] = true;
    else delete adminState.selectedRecords[code];
    const counter = byId('record-selected-count');
    if (counter) counter.textContent = String(selectedRecordCount());
  },
  selectFilteredRecords: function () {
    filterRecords(adminState.recordRows || [], adminState.recordFilter, currentBuildNumber()).forEach(
      function (row) {
        adminState.selectedRecords[row.code] = true;
      }
    );
    render();
  },
  clearRecordSelection: function () {
    adminState.selectedRecords = {};
    render();
  },
  markSelectedRecords: function () {
    const plan = planMark(
      adminState.recordSource || {},
      Object.keys(adminState.selectedRecords),
      adminState.user && adminState.user.email,
      new Date().toISOString()
    );
    if (!plan.length) {
      showToast('İşaretlenecek seçili kayıt yok.');
      return;
    }
    askConfirm(
      'Test kaydı olarak işaretle',
      plan.length +
        ' kayıt analizden ve dışa aktarmadan çıkarılacak (örnek: ' +
        plan
          .slice(0, 6)
          .map(function (item) {
            return item.code;
          })
          .join(', ') +
        '). Kayıtlar silinmez; işaret geri alınabilir.',
      'İşaretle',
      true,
      function () {
        adminActions.applyRecordUpdates(plan, 'işaretlendi');
      }
    );
  },
  unmarkSelectedRecords: function () {
    const plan = planUnmark(
      adminState.recordSource || {},
      Object.keys(adminState.selectedRecords),
      new Date().toISOString()
    );
    if (!plan.length) {
      showToast('Geri alınacak seçili kayıt yok.');
      return;
    }
    askConfirm(
      'İşareti geri al',
      plan.length + ' kaydın test işareti kaldırılacak; kayıtlar yeniden analize girebilir.',
      'Geri al',
      false,
      function () {
        adminActions.applyRecordUpdates(plan, 'geri alındı');
      }
    );
  },
  applyRecordUpdates: async function (plan, resultText) {
    try {
      await adminRepository.updateParticipants(plan);
      showToast(plan.length + ' kayıt ' + resultText + '.');
    } catch (error) {
      showToast('Kaydedilemedi: ' + errorText(error));
      return;
    }
    adminState.withdrawnCount = null;
    adminState.dashboard = null;
    await adminActions.loadTestRecords();
  },

  // ── Tam yedek (JSON) ──
  downloadBackup: async function () {
    if (adminState.backupBusy) return;
    adminState.backupBusy = true;
    adminState.backupProgress = 'Katılımcılar okunuyor…';
    render();
    const progress = function (text) {
      adminState.backupProgress = text;
      const element = byId('backup-progress');
      if (element) element.textContent = text;
    };
    try {
      const participants = await adminRepository.listParticipants();
      const allocations = await adminRepository.listAllocations();
      const eventsByCode = {};
      for (let index = 0; index < participants.length; index++) {
        progress('Olaylar okunuyor: ' + (index + 1) + ' / ' + participants.length);
        eventsByCode[participants[index].code] = await adminRepository.listEvents(participants[index].code);
      }
      const now = new Date().toISOString();
      const backup = buildBackup({
        participants: participants,
        eventsByCode: eventsByCode,
        allocations: allocations,
        appVersion: APP_VERSION,
        exportedAt: now,
        exportedBy: adminState.user && adminState.user.email,
      });
      const problems = verifyBackup(backup);
      if (problems.length) throw new Error('Yedek doğrulanamadı: ' + problems.join(' '));
      await saveFile(backupFileName(now), JSON.stringify(backup));
      adminState.backupLast = { at: now, counts: backup.counts };
      adminState.backupProgress = 'Hazır: dosya indirildi.';
    } catch (error) {
      adminState.backupProgress = '';
      showToast('Yedek alınamadı: ' + errorText(error));
    }
    adminState.backupBusy = false;
    render();
  },
  dismissWhatsNew: function () {
    dismissWhatsNew();
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
