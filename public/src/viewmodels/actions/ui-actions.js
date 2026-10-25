// Eylemler: menü, tema, yazı boyutu, pencereler, çekilme.

import { actions } from './index.js';
import { CONFIG, DEMO_MODE, setDemoMode, setPilotMode } from '../../constants/app-config.js';
import { render } from '../../views/app-shell.js';
import { state } from '../app-state.js';
import { eventLog, flushEvents, logEvent } from '../../services/event-log.js';
import { GLOSSARY } from '../../constants/glossary.js';
import { initSimulation, stepSimulation } from '../../models/market-simulation.js';
import { helpHtml, menuHtml, termHtml } from '../../views/menu-view.js';
import { askConfirm, closeModal, openModal } from '../../widgets/modal.js';
import { rememberCode } from '../../utils/participant-code.js';
import { enterCode, withdrawParticipant } from '../session-lifecycle.js';
import { saveSnapshot } from '../../services/session-persistence.js';
import { showToast } from '../../widgets/toast.js';
import { endTour, renderTour } from '../tour-controller.js';

// ═════════════════ EYLEMLER ═════════════════// ═════════════════ EYLEMLER ═════════════════
let logoTaps = [];

export const uiActions = {
  startDemo: function () {
    if (state.participantCode) {
      showToast('Açık bir katılımcı oturumu var; önce sayfayı yenile.');
      return;
    }
    setDemoMode(true);
    setPilotMode(false);
    clearInterval(state.cooldownTimer);
    eventLog.queue = [];
    state.trial = null;
    state.pilotFeedback = null;
    state.group = 'B';
    state.stage = 'demoland';
    state.previousStage = null;
    render();
  },
  exitDemo: function () {
    var unit = new URL(location.href);
    unit.searchParams.delete('demo');
    location.replace(unit.toString());
  },
  setDemoSpeed: function (value) {
    var count = +value;
    if (!DEMO_MODE || [1, 2, 4].indexOf(count) < 0) return;
    state.demoSpeed = count;
    document.querySelectorAll('[data-a=setDemoSpeed]').forEach(function (item) {
      var isOn = +item.dataset.v === count;
      item.classList.toggle('is-active', isOn);
      item.setAttribute('aria-pressed', isOn);
    });
  },
  skipToNextCrisis: function () {
    if (!DEMO_MODE || !state.simulation || state.freePlay) return;
    var simulation = state.simulation,
      value = CONFIG.simCrises.filter(function (item) {
        return item.at - 2 > simulation.tick;
      })[0];
    if (!value) {
      showToast('Başka kriz kalmadı.');
      return;
    }
    while (simulation.tick < value.at - 2 && simulation.tick < CONFIG.simTicks) stepSimulation();
    closeModal();
    render();
    showToast('Gün ' + simulation.tick + ': krizden hemen önce.');
  },
  startDemoSimulation: function () {
    closeModal();
    state.group = 'B';
    state.phase = 'sim';
    state.detailSymbol = null;
    state.tradeDraft = null;
    state.sellReasonDraft = null;
    state.simulatorCooldown = null;
    initSimulation();
    state.marketTab = 'p';
    state.tabTimes = { p: 0, m: 0, a: 0 };
    state.tabActiveSince = Date.now();
    state.stage = 'sim';
    render();
  },
  nextTourStep: function () {
    var tour = state.tour;
    if (!tour) return;
    state.seenTourSteps[tour.steps[tour.i][0]] = 1;
    if (tour.i + 1 >= tour.steps.length) return endTour(false);
    tour.i++;
    renderTour();
  },
  skipTour: function () {
    endTour(true);
  },
  openTerm: function (value) {
    var i = +value;
    if (!(i >= 0 && i < GLOSSARY.length)) return;
    logEvent('term_open', { k: GLOSSARY[i][0], stage: state.stage });
    openModal(termHtml(i));
  },
  openHelp: function () {
    state.helpOpenCount = (state.helpOpenCount || 0) + 1;
    logEvent('help_open', { stage: state.stage });
    openModal(helpHtml());
  },
  openMenu: function () {
    openModal(menuHtml());
  },
  requestWithdraw: function () {
    askConfirm(
      'Çalışmadan çekil',
      'Bu koda ait tüm verilerin analizden çıkarılacak ve silinecek. Bu kodla tekrar giriş yapamayacaksın.',
      'Çekil ve sil',
      true,
      withdrawParticipant
    );
  },
  moveDevice: function () {
    askConfirm(
      'Başka cihazda devam et',
      'Kararların kaydedilip bu cihazda kapatılacak. Ardından yeni cihazınla okutacağın bir QR göreceksin.',
      'Devam',
      false,
      async function () {
        logEvent('device_transfer', { ti: state.trialIndex, phase: state.phase });
        clearInterval(state.cooldownTimer);
        await saveSnapshot();
        await flushEvents();
        state.movedCode = state.participantCode;
        rememberCode(null);
        state.participantCode = null;
        state.trial = null;
        state.stage = 'moved';
        render();
      }
    );
  },
  cancelMoveDevice: function () {
    enterCode(state.movedCode);
  },
  confirmModal: function () {
    var confirmCallback = state.confirmCallback;
    state.confirmCallback = null;
    closeModal();
    if (confirmCallback) confirmCallback();
  },
  cancelModal: function () {
    if (state.simulatorCooldown) {
      actions.cancelCooldown();
      return;
    }
    state.tradeDraft = null;
    state.sellReasonDraft = null;
    state.confirmCallback = null;
    closeModal();
  },
  setFontSize: function (value) {
    var count = +value;
    if ([0, 1, 2].indexOf(count) < 0) return;
    var documentElement = document.documentElement;
    if (count) documentElement.setAttribute('data-fs', String(count));
    else documentElement.removeAttribute('data-fs');
    try {
      localStorage.setItem('ilklot:fs', String(count));
    } catch (error) {}
    document.querySelectorAll('[data-a=setFontSize]').forEach(function (item) {
      var isOn = +item.dataset.v === count;
      item.classList.toggle('is-active', isOn);
      item.setAttribute('aria-pressed', isOn);
    });
    logEvent('fs_set', { level: count });
  },
  toggleTheme: function () {
    var documentElement = document.documentElement,
      count = documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    documentElement.setAttribute('data-theme', count);
    try {
      localStorage.setItem('ilklot:theme', count);
    } catch (error) {}
    logEvent('theme_set', { theme: count });
  },
  tapLogo: function () {
    if (DEMO_MODE) return;
    var now = Date.now();
    logoTaps = logoTaps.filter(function (item) {
      return now - item < 2500;
    });
    logoTaps.push(now);
    if (logoTaps.length >= 5) {
      logoTaps = [];
      if (state.stage !== 'admin') {
        state.previousStage = state.stage;
        state.stage = 'admin';
      }
      render();
    }
  },
  closeAdmin: function () {
    state.stage = state.previousStage || 'consent';
    render();
  },
};
