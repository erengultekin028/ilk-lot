// Yönetim paneli eylemleri.

import { loadDashboard } from './admin-dashboard.js';
import {
  exportAllocations,
  exportCards,
  exportEvents,
  exportParticipants,
  exportPoster,
  saveFile,
} from './admin-exports.js';
import { APP_VERSION, CONFIG, QUERY_PARAMS, QUICK_TEST_MODE } from '../constants/app-config.js';
import { render } from '../views/app-shell.js';
import { state } from '../viewmodels/app-state.js';
import { byId } from '../utils/dom.js';
import { escapeHtml } from '../utils/format.js';
import { askConfirm, openModal } from '../widgets/modal.js';
import { buildAllocationList } from '../utils/participant-code.js';
import { participantRepository } from '../repositories/participant-repository.js';
import { renderQrSvg } from '../widgets/qr-code.js';
import { showToast } from '../widgets/toast.js';
import { stimulusFingerprint } from '../models/trial-generator.js';

export const ADMIN_ACTIONS = {
  refreshDashboard: function () {
    loadDashboard();
  },
  downloadPoster: function (value) {
    exportPoster(value).catch(function (error) {
      showToast('Poster oluşturulamadı: ' + ((error && error.code) || error));
    });
  },
  downloadPosterQr: function () {
    const unit = (state.landingUrlInput || '').trim();
    if (!/^https?:\/\//.test(unit)) {
      showToast('Önce tanıtım sayfasının adresini yaz (https:// ile).');
      return;
    }
    saveFile('ilklot_poster_qr.svg', renderQrSvg(unit, 600));
  },
  adminLogin: async function () {
    state.adminError = '';
    try {
      await participantRepository.adminLogin(byId('admin-email').value, byId('admin-password').value);
    } catch (error) {
      state.adminError = 'Giriş başarısız: ' + ((error && error.code) || error);
    }
    render();
  },
  adminLogout: async function () {
    await participantRepository.adminLogout();
    state.allocationCache = null;
    render();
  },
  loadAllocations: async function () {
    try {
      state.allocationCache = await participantRepository.listAlloc();
    } catch (error) {
      showToast('Liste okunamadı: ' + ((error && error.code) || error));
    }
    render();
  },
  generateAllocations: function () {
    const count = Math.max(4, Math.round((parseInt(byId('allocation-count').value, 10) || 0) / 4) * 4);
    askConfirm(
      'Yeni liste',
      count +
        ' kişilik yeni liste oluşturulacak.' +
        (participantRepository.mode() === 'local'
          ? ' Yerel listedeki eski kodlar silinir.'
          : " Firebase'deki mevcut kodlar korunur, yenileri eklenir."),
      'Oluştur',
      false,
      function () {
        ADMIN_ACTIONS.generateAllocationsConfirmed(count);
      }
    );
  },
  generateAllocationsConfirmed: async function (count) {
    try {
      const current =
        participantRepository.mode() === 'firebase' ? await participantRepository.listAlloc() : {};
      const allocationList = buildAllocationList(count, 4, Object.keys(current).length);
      // Firebase'de sadece yeni kodlar yazılır; mevcut kodlar ve grupları değişmez
      await participantRepository.saveAlloc(allocationList);
      state.allocationCache = await participantRepository.listAlloc();
      showToast(count + ' kod oluşturuldu.');
    } catch (error) {
      showToast('Kaydedilemedi: ' + ((error && error.code) || error));
    }
    render();
  },
  downloadCards: function () {
    exportCards().catch(function (error) {
      showToast('Kartlar oluşturulamadı: ' + ((error && error.code) || error));
    });
  },
  downloadAllocations: function () {
    exportAllocations().catch(function (error) {
      showToast('Dışa aktarılamadı: ' + ((error && error.code) || error));
    });
  },
  downloadParticipants: function () {
    exportParticipants().catch(function (error) {
      showToast('Dışa aktarılamadı: ' + ((error && error.code) || error));
    });
  },
  downloadEvents: function () {
    exportEvents().catch(function (error) {
      showToast('Dışa aktarılamadı: ' + ((error && error.code) || error));
    });
  },
  resetLocalData: function () {
    askConfirm(
      'Demo verisini sıfırla',
      'Bu tarayıcıdaki tüm demo kayıtları ve kod listesi silinecek.',
      'Sıfırla',
      true,
      function () {
        participantRepository.resetLocal();
        location.reload();
      }
    );
  },
  countWithdrawn: async function () {
    const participants = await participantRepository.listP();
    state.withdrawnCount = participants.filter(function (item) {
      return item.withdrawn;
    }).length;
    render();
  },
};

export const adminSelfTestActions = {
  runSelfTest: async function () {
    openModal('<h2>Sistem testi</h2><p>Çalışıyor…</p>');
    let innerItems = [];
    try {
      innerItems = await participantRepository.selfTest();
    } catch (error) {
      innerItems = [{ ad: 'Sistem testi', ok: false, d: String((error && error.message) || error) }];
    }
    const timezoneOffset = -new Date().getTimezoneOffset() / 60;
    const items = [
      { ad: 'Uyaran parmak izi', ok: null, d: stimulusFingerprint() + ' (tüm cihazlarda aynı olmalı)' },
      {
        ad: 'Uygulama sürümü',
        ok: null,
        d: APP_VERSION + (QUICK_TEST_MODE ? ' · HIZLI TEST MODU AÇIK' : ''),
      },
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
      {
        ad: 'Titreşim ve hareket azaltma',
        ok: null,
        d:
          (navigator.vibrate ? 'titreşim var' : 'titreşim yok') +
          ' · ' +
          (matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'hareket azaltma AÇIK'
            : 'hareket azaltma kapalı'),
      },
    ];
    const all = innerItems.concat(items);
    state.selfTestResults = all;
    const sim = function (x) {
      return x.ok === true ? '✓' : x.ok === false ? '✗' : 'ⓘ';
    };
    const renderClass = function (x) {
      return x.ok === true ? 'up' : x.ok === false ? 'dn' : 'mu';
    };
    byId('modal-box').innerHTML =
      '<h2>Sistem testi</h2><div style="max-height:52vh;overflow:auto;text-align:left">' +
      all
        .map(function (item) {
          return (
            '<div class="key-value" style="align-items:flex-start;gap:10px"><span style="flex:none;font-weight:800;color:var(--' +
            renderClass(item) +
            ')">' +
            sim(item) +
            '</span><span style="flex:1"><b style="color:var(--tx)">' +
            escapeHtml(item.ad) +
            '</b><br><span class="muted small-text">' +
            escapeHtml(item.d) +
            '</span></span></div>'
          );
        })
        .join('') +
      '</div>' +
      (all.some(function (item) {
        return item.ok === false;
      })
        ? '<div class="is-wrongsheet-titlee" style="margin:10px 0"><span><b>Başarısız kontrol var.</b> Pilota başlamadan önce düzelt.</span></div>'
        : '') +
      '<button class="button" data-a="copySelfTest">Sonucu kopyala</button><button class="button is-primary" data-a="cancelModal">Kapat</button>';
  },
  copySelfTest: function () {
    const value = (state.selfTestResults || [])
      .map(function (item) {
        return (
          (item.ok === true ? '[OK] ' : item.ok === false ? '[HATA] ' : '[BİLGİ] ') + item.ad + ': ' + item.d
        );
      })
      .join('\n');
    try {
      navigator.clipboard.writeText(value).then(
        function () {
          showToast('Kopyalandı.');
        },
        function () {
          showToast('Kopyalanamadı; ekran görüntüsü al.');
        }
      );
    } catch (error) {
      showToast('Kopyalanamadı; ekran görüntüsü al.');
    }
  },
  toggleQuickMode: function () {
    if (CONFIG.firebase) return;
    try {
      if (QUICK_TEST_MODE && !QUERY_PARAMS.get('hizli')) localStorage.removeItem('ilklot:quick');
      else localStorage.setItem('ilklot:quick', String(Date.now()));
    } catch (error) {
      showToast('Bu görünümde kalıcı kayıt yok; adresin sonuna ?hizli=1 ekle.');
      return;
    }
    if (QUERY_PARAMS.get('hizli') === '1') {
      showToast('Adreste ?hizli=1 var; kapatmak için o parametreyi kaldır.');
      return;
    }
    location.reload();
  },
};
