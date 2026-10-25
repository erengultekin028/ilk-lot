// Rehberli tur denetleyicisi.

import { state } from './app-state.js';
import { byId } from '../utils/dom.js';
import { logEvent } from '../services/event-log.js';
import { saveSnapshot } from '../services/session-persistence.js';
import { SIMULATOR_TOUR_STEPS, TASK_TOUR_STEPS, TOUR_TARGET_IDS } from '../constants/tour-steps.js';

// Tur adımının hedef öğesi (adım anahtarından DOM kimliğine)
function tourTarget(stepKey) {
  return byId(TOUR_TARGET_IDS[stepKey] || stepKey);
}

// ═════════════════ REHBERLİ TUR ═════════════════
// İlk alıştırmada ve simülatörün başında ekranın parçalarını sırayla vurgular.
// Görev turunda her adım bir kez gösterilir: 2. alıştırmada sadece ilkinde olmayan öğe (ör. satanların oranı) anlatılır.
export function maybeStartTour() {
  if (state.tour) return;
  let scrollTop;
  if (
    state.stage === 'task' &&
    state.trial &&
    state.trial.mode === 'practice' &&
    state.trial.phase === 'choose'
  ) {
    scrollTop = TASK_TOUR_STEPS.filter(function (item) {
      return tourTarget(item[0]) && !state.seenTourSteps[item[0]];
    });
    if (scrollTop.length) startTour(scrollTop, 'task');
  } else if (state.stage === 'sim' && !state.freePlay && !state.seenTourSteps.sim) {
    scrollTop = SIMULATOR_TOUR_STEPS.filter(function (item) {
      return tourTarget(item[0]);
    });
    if (scrollTop.length) startTour(scrollTop, 'sim');
  }
}

function startTour(steps, key) {
  state.tour = { steps: steps, i: 0, key: key, t0: Date.now() };
  logEvent('tour_start', { key: key, n: steps.length });
}

export function renderTour() {
  const tourPopupElement = byId('tour-popup');
  const appElement = byId('app');
  document.querySelectorAll('.highlight').forEach(function (item) {
    item.classList.remove('highlight');
  });
  if (!state.tour) {
    tourPopupElement.hidden = true;
    tourPopupElement.innerHTML = '';
    appElement.classList.remove('is-touring');
    return;
  }
  const tour = state.tour;
  const text = tour.steps[tour.i];
  const element = tourTarget(text[0]);
  const last = tour.i + 1 >= tour.steps.length;
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
    const innerRect = byId('main-view').getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const cardTop = tourPopupElement.getBoundingClientRect().top;
    if (text[0] !== 'nav' && (rect.top < innerRect.top || rect.bottom > cardTop - 12)) {
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
  const tour = state.tour;
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
