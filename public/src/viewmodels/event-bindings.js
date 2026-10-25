// Belge düzeyi olay dinleyicileri ve zamanlayıcılar.

import { actions } from './actions/index.js';

import { CONFIG } from '../constants/app-config.js';
import { state } from './app-state.js';
import { byId } from '../utils/dom.js';
import { eventLog, flushEvents, logEvent } from '../services/event-log.js';
import { endChartScrub, marketTick, scrubChartAt, scrubState } from './market-controller.js';

import { saveSnapshot } from '../services/session-persistence.js';
import { updateTradePreview } from '../views/simulator-view.js';

// Tanıtım modunda hız çarpanı (1, 2, 4): aynı turu art arda çalıştırır; gerçek akışta çarpan hep 1
// b23: serbest modda hız (0 duraklat, 1, 2, 4) oyuncunun kendi seçimidir; tanıtım hızı yalnızca serbest dışında geçerli
setInterval(function () {
  const count = state.freePlay ? (state.freePlay.speed == null ? 1 : state.freePlay.speed) : 1;
  for (let i = 0; i < count; i++) marketTick();
}, CONFIG.simTickMs);
document.addEventListener('pointerdown', function (event) {
  if (!event.target.closest || !event.target.closest('#detail-chart')) return;
  clearTimeout(scrubState.timer);
  scrubState.gesture = {
    moves: 0,
    t0: Date.now(),
  };
  scrubChartAt(event);
});
document.addEventListener('pointermove', function (event) {
  const insideChart = event.target.closest && event.target.closest('#detail-chart');
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
  const target = event.target.closest('[data-a]');
  if (!target) return;
  const handler = actions[target.dataset.a];
  if (handler) {
    event.preventDefault();
    handler(target.dataset.v, target);
  }
});
document.addEventListener('input', function (event) {
  const key = event.target.dataset && event.target.dataset.in;
  if (!key) return;
  const value = event.target.value;
  if (key === 'simq') {
    const degrees = value.replace(/\D/g, '').slice(0, 6);
    if (degrees !== value) event.target.value = degrees;
    if (state.tradeDraft) {
      state.tradeDraft.q = degrees === '' ? 0 : parseInt(degrees, 10);
      state.tradeDraft.mode = 'typed';
      state.tradeDraft.edits++;
      updateTradePreview();
    }
  } else if (key === 'consentOk') {
    state.consentChecked = event.target.checked;
    const consentButtonElement = byId('consent-button');
    if (consentButtonElement) consentButtonElement.disabled = !state.consentChecked || !!state.busy;
  }
});

// Onam ayrıntılarından hangileri açıldı (okuma göstergesi). 'toggle' kabarcıklanmaz: yakalama aşamasında dinlenir
document.addEventListener(
  'toggle',
  function (event) {
    const target = event.target;
    if (target && target.dataset && target.dataset.cs) {
      state.consentOpenSections = state.consentOpenSections || {};
      state.consentOpenSections[target.dataset.cs] = 1;
    }
  },
  true
);
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

// Yazı boyutu (b22 geri geldi): kayıtlı tercih 'ilklot:fs' (0/1/2); geçersiz değer yok sayılır. Bir arayüz ayarıdır, katılımcı verisi değil.
(function () {
  let handler = null;
  try {
    handler = localStorage.getItem('ilklot:fs');
  } catch (error) {}
  if (handler === '1' || handler === '2') document.documentElement.setAttribute('data-fs', handler);
})();

// Tema: kayıtlı tercih > görüntüleyicinin verdiği data-theme > cihazın teması. Tercih bir arayüz ayarıdır (katılımcı verisi değil).
(function () {
  let value = null;
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
