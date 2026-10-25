// Eylemler: menü, tema, yazı boyutu, pencereler, çekilme.

import { actions } from './index.js';
import { state } from '../app-state.js';
import { logEvent } from '../../services/event-log.js';
import { GLOSSARY } from '../../constants/glossary.js';
import { helpHtml, menuHtml, termHtml } from '../../views/menu-view.js';
import { askConfirm, closeModal, openModal } from '../../widgets/modal.js';
import { withdrawParticipant } from '../session-lifecycle.js';
import { endTour, renderTour } from '../tour-controller.js';

// ═════════════════ EYLEMLER ═════════════════// ═════════════════ EYLEMLER ═════════════════
export const uiActions = {
  nextTourStep: function () {
    const tour = state.tour;
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
    const i = +value;
    if (!(i >= 0 && i < GLOSSARY.length)) return;
    logEvent('term_open', {
      k: GLOSSARY[i][0],
      stage: state.stage,
    });
    openModal(termHtml(i));
  },
  openHelp: function () {
    state.helpOpenCount = (state.helpOpenCount || 0) + 1;
    logEvent('help_open', {
      stage: state.stage,
    });
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
      function () {
        // İkinci onay: çalışmayı "bitirmek" isteyen biri yanlışlıkla çekilmesin (çekilme geri alınamaz)
        askConfirm(
          'Emin misin?',
          'Çalışmayı bitirmek istiyorsan bunu yapma: son ekrana kadar devam etmen yeterli. Çekilirsen bu işlem geri alınamaz.',
          'Evet, çekil',
          true,
          withdrawParticipant
        );
      }
    );
  },
  confirmModal: function () {
    const confirmCallback = state.confirmCallback;
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
    const count = +value;
    if ([0, 1, 2].indexOf(count) < 0) return;
    const documentElement = document.documentElement;
    if (count) documentElement.setAttribute('data-fs', String(count));
    else documentElement.removeAttribute('data-fs');
    try {
      localStorage.setItem('ilklot:fs', String(count));
    } catch (error) {}
    document.querySelectorAll('[data-a=setFontSize]').forEach(function (item) {
      const isOn = +item.dataset.v === count;
      item.classList.toggle('is-active', isOn);
      item.setAttribute('aria-pressed', isOn);
    });
    logEvent('fs_set', {
      level: count,
    });
  },
  toggleTheme: function () {
    const documentElement = document.documentElement;
    const count = documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    documentElement.setAttribute('data-theme', count);
    try {
      localStorage.setItem('ilklot:theme', count);
    } catch (error) {}
    logEvent('theme_set', {
      theme: count,
    });
  },
};
