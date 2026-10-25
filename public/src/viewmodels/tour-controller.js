// Rehberli tur denetleyicisi.

import { state } from './app-state.js';
import { byId } from '../utils/dom.js';
import { logEvent } from '../services/event-log.js';
import { saveSnapshot } from '../services/session-persistence.js';
import { SIMULATOR_TOUR_STEPS, TASK_TOUR_STEPS } from '../constants/tour-steps.js';

// ═════════════════ REHBERLİ TUR ═════════════════
// İlk alıştırmada ve simülatörün başında ekranın parçalarını sırayla vurgular.
// Görev turunda her adım bir kez gösterilir: 2. alıştırmada sadece ilkinde olmayan öğe (ör. satanların oranı) anlatılır.
export function maybeStartTour() {
  if (state.tour) return;
  var scrollTop;
  if (
    state.stage === 'task' &&
    state.trial &&
    state.trial.mode === 'practice' &&
    state.trial.phase === 'choose'
  ) {
    scrollTop = TASK_TOUR_STEPS.filter(function (item) {
      return byId(item[0]) && !state.seenTourSteps[item[0]];
    });
    if (scrollTop.length) startTour(scrollTop, 'task');
  } else if (state.stage === 'sim' && !state.freePlay && !state.seenTourSteps.sim) {
    scrollTop = SIMULATOR_TOUR_STEPS.filter(function (item) {
      return byId(item[0]);
    });
    if (scrollTop.length) startTour(scrollTop, 'sim');
  }
}

function startTour(steps, key) {
  state.tour = { steps: steps, i: 0, key: key, t0: Date.now() };
  logEvent('tour_start', { key: key, n: steps.length });
}

export function renderTour() {
  var tourPopupElement = byId('tour-popup'),
    appElement = byId('app');
  document.querySelectorAll('.highlight').forEach(function (item) {
    item.classList.remove('highlight');
  });
  if (!state.tour) {
    tourPopupElement.hidden = true;
    tourPopupElement.innerHTML = '';
    appElement.classList.remove('is-touring');
    return;
  }
  var tour = state.tour,
    text = tour.steps[tour.i],
    element = byId(text[0]),
    last = tour.i + 1 >= tour.steps.length;
  appElement.classList.add('is-touring');
  tourPopupElement.classList.toggle('is-top', text[0] === 'nav');
  tourPopupElement.innerHTML =
    '<div class="tour-text">' +
    (tour.i + 1) +
    ' / ' +
    tour.steps.length +
    '</div><p>' +
    text[1] +
    '</p><div class="tour-footer"><button class="tour-skip" data-a="skipTour">' +
    (last ? '' : 'Turu geç') +
    '</button><button class="tour-count" data-a="nextTourStep">' +
    (last ? 'Anladım' : 'İleri') +
    '</button></div>';
  tourPopupElement.hidden = false;
  if (element) {
    element.classList.add('highlight');
    var viewWidth = byId('main-view').getBoundingClientRect(),
      result = element.getBoundingClientRect(),
      cardTop = tourPopupElement.getBoundingClientRect().top;
    if (text[0] !== 'nav' && (result.top < viewWidth.top || result.bottom > cardTop - 12)) {
      try {
        element.scrollIntoView({
          block: 'start',
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
      } catch (error) {}
    }
  }
}

export function endTour(skipped) {
  var tour = state.tour;
  if (!tour) return;
  tour.steps.forEach(function (item) {
    state.seenTourSteps[item[0]] = 1;
  });
  if (tour.key === 'sim') state.seenTourSteps.sim = 1;
  logEvent('tour_done', { key: tour.key, skipped: !!skipped, atStep: tour.i + 1, ms: Date.now() - tour.t0 });
  state.tour = null;
  renderTour();
  saveSnapshot();
}
