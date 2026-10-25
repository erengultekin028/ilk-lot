// Belge düzeyi olay dinleyicileri ve zamanlayıcılar.

import { actions } from './actions/index.js';
import { dashboardAutoRefresh } from '../admin/admin-dashboard.js';
import { CONFIG, DEMO_MODE } from '../constants/app-config.js';
import { state } from './app-state.js';
import { byId } from '../utils/dom.js';
import { eventLog, flushEvents, logEvent } from '../services/event-log.js';
import { endChartScrub, marketTick, scrubChartAt, scrubState } from './market-controller.js';
import { formatCodeInput } from '../utils/participant-code.js';
import { enterCode } from './session-lifecycle.js';
import { saveSnapshot } from '../services/session-persistence.js';
import { updateTradePreview } from '../views/simulator-view.js';

// Tanıtım modunda hız çarpanı (1, 2, 4): aynı turu art arda çalıştırır; gerçek akışta çarpan hep 1
// b23: serbest modda hız (0 duraklat, 1, 2, 4) oyuncunun kendi seçimidir; tanıtım hızı yalnızca serbest dışında geçerli
setInterval(function () {
  var count = state.freePlay
    ? state.freePlay.speed == null
      ? 1
      : state.freePlay.speed
    : DEMO_MODE
      ? state.demoSpeed || 1
      : 1;
  for (var i = 0; i < count; i++) marketTick();
}, CONFIG.simTickMs);

document.addEventListener('pointerdown', function (event) {
  if (!event.target.closest || !event.target.closest('#detail-chart')) return;
  clearTimeout(scrubState.timer);
  scrubState.gesture = { moves: 0, t0: Date.now() };
  scrubChartAt(event);
});

document.addEventListener('pointermove', function (event) {
  var insideChart = event.target.closest && event.target.closest('#detail-chart');
  if (!insideChart) {
    if (event.pointerType === 'mouse' && !scrubState.gesture && state.scrubDay != null && !scrubState.timer)
      endChartScrub();
    return;
  }
  if (event.pointerType === 'mouse' && !scrubState.gesture && event.buttons === 0) {
    clearTimeout(scrubState.timer);
    scrubState.timer = null;
    scrubChartAt(event);
    return;
  }
  if (scrubState.gesture) scrubChartAt(event);
});

document.addEventListener('pointerup', function () {
  if (scrubState.gesture || state.scrubDay != null) endChartScrub();
});

document.addEventListener('pointercancel', function () {
  if (scrubState.gesture || state.scrubDay != null) endChartScrub();
});

// ═════════════════ OLAYLAR ═════════════════
document.addEventListener('click', function (event) {
  var target = event.target.closest('[data-a]');
  if (!target) return;
  var handler = actions[target.dataset.a];
  if (handler) {
    event.preventDefault();
    handler(target.dataset.v, target);
  }
});

document.addEventListener('input', function (event) {
  var key = event.target.dataset && event.target.dataset.in;
  if (!key) return;
  var value = event.target.value;
  if (key === 'code') {
    state.codeError = '';
    if (event.isComposing) {
      state.codeInput = value;
      return;
    }
    var formatted = formatCodeInput(value);
    if (formatted !== value) event.target.value = formatted;
    state.codeInput = formatted;
  } else if (key === 'simq') {
    var degrees = value.replace(/\D/g, '').slice(0, 6);
    if (degrees !== value) event.target.value = degrees;
    if (state.tradeDraft) {
      state.tradeDraft.q = degrees === '' ? 0 : parseInt(degrees, 10);
      state.tradeDraft.mode = 'typed';
      state.tradeDraft.edits++;
      updateTradePreview();
    }
  } else if (key === 'consentOk') {
    state.consentChecked = event.target.checked;
    var consentButtonElement = byId('consent-button');
    if (consentButtonElement) consentButtonElement.disabled = !state.consentChecked || !!state.busy;
  } else if (key === 'dashAuto') {
    state.dashboardAutoRefresh = event.target.checked;
  } else if (key === 'baseIn') {
    state.baseUrlInput = value;
  } else if (key === 'landIn') {
    state.landingUrlInput = value;
  } else if (key === 'posterMail') {
    state.posterEmail = value;
  } else if (key === 'posterFoot') {
    state.posterFooter = value;
  }
});

// Onam ayrıntılarından hangileri açıldı (okuma göstergesi). 'toggle' kabarcıklanmaz: yakalama aşamasında dinlenir
document.addEventListener(
  'toggle',
  function (event) {
    var target = event.target;
    if (target && target.dataset && target.dataset.cs) {
      state.consentOpenSections = state.consentOpenSections || {};
      state.consentOpenSections[target.dataset.cs] = 1;
    }
  },
  true
);

document.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && event.target && event.target.id === 'code-input')
    enterCode(event.target.value);
});

document.addEventListener('compositionend', function (event) {
  if (event.target && event.target.id === 'code-input') {
    var formatted = formatCodeInput(event.target.value);
    event.target.value = formatted;
    state.codeInput = formatted;
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && byId('modal').classList.contains('is-open')) actions.cancelModal();
});

// Sekme gizlenince: karar süresi ölçümü için işaretlenir, durum kaydedilir
document.addEventListener('visibilitychange', function () {
  if (document.hidden) state.lastHiddenAt = Date.now();
  if (!state.participantCode) return;
  logEvent(document.hidden ? 'hidden' : 'visible', {});
  if (document.hidden) {
    saveSnapshot();
    flushEvents();
  }
});

addEventListener('pagehide', function () {
  if (state.participantCode) {
    saveSnapshot();
    flushEvents();
  }
});

setInterval(function () {
  if (state.participantCode && eventLog.queue.length) flushEvents();
}, 15000);

setInterval(dashboardAutoRefresh, 30000); // Bağlantı kopmuşsa kuyruğu düzenli dene

// Yazı boyutu (b22 geri geldi): kayıtlı tercih 'ilklot:fs' (0/1/2); geçersiz değer yok sayılır. Bir arayüz ayarıdır, katılımcı verisi değil.
(function () {
  var handler = null;
  try {
    handler = localStorage.getItem('ilklot:fs');
  } catch (error) {}
  if (handler === '1' || handler === '2') document.documentElement.setAttribute('data-fs', handler);
})();

// Tema: kayıtlı tercih > görüntüleyicinin verdiği data-theme > cihazın teması. Tercih bir arayüz ayarıdır (katılımcı verisi değil).
(function () {
  var value = null;
  try {
    value = localStorage.getItem('ilklot:theme');
  } catch (error) {}
  if (value !== 'light' && value !== 'dark') {
    value = null;
    if (
      !document.documentElement.getAttribute('data-theme') &&
      matchMedia('(prefers-color-scheme: dark)').matches
    )
      value = 'dark';
  }
  if (value) document.documentElement.setAttribute('data-theme', value);
})();
