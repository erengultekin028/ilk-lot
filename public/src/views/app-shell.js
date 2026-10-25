// Uygulama kabuğu: ekran çizimi, başlık, ilerleme çubuğu.

import { CONFIG, DEMO_MODE, QUICK_TEST_MODE } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { byId } from '../utils/dom.js';
import { startFilm } from '../widgets/film-widget.js';
import { formatMinutesSeconds } from '../utils/format.js';
import { crisisAt, simulationTickLimit } from '../models/market-simulation.js';
import { simulatorNavHtml, updateSimulatorLive } from './simulator-view.js';
import { renderStage } from './stage-view.js';
import { currentTrial, resumeFlow } from '../viewmodels/study-flow.js';
import { updateSyncIndicator } from '../widgets/sync-indicator.js';
import { maybeStartTour, renderTour } from '../viewmodels/tour-controller.js';
import { TRIAL_SETS, currentBlockTrials, lastWeekChangePercent } from '../models/trial-generator.js';
import { PROGRESS_LABELS, PROGRESS_WEIGHTS } from '../constants/ui-constants.js';

// ═════════════════ ÇİZİM ═════════════════
export function render() {
  // Kaldığı yerden devam: "app" aşaması akıştaki doğru ekrana çevrilir
  if (state.stage === 'app') resumeFlow();
  const mainViewElement = byId('main-view');
  const key = [
    state.stage,
    state.marketTab,
    state.detailSymbol,
    state.testQuestion ? state.testQuestion.kind + state.testQuestion.i : '',
    state.introStep,
    state.bridge,
    state.stressKey,
    state.trial ? state.trial.mode + state.trial.i + state.trial.phase + state.trialIndex + state.block : '',
  ].join('|');
  const scrollTop = mainViewElement.scrollTop;
  mainViewElement.innerHTML = renderStage();
  mainViewElement.scrollTop = key === state.renderKey ? scrollTop : 0;
  if (key !== state.renderKey) {
    mainViewElement.classList.remove('is-entering');
    void mainViewElement.offsetWidth;
    mainViewElement.classList.add('is-entering');
  }
  state.renderKey = key;
  byId('disclaimer').hidden = !(state.stage === 'task' || state.stage === 'sim');
  const simulatorNavElement = byId('simulator-nav');
  if (state.stage === 'sim') {
    simulatorNavElement.innerHTML = simulatorNavHtml();
    simulatorNavElement.hidden = false;
  } else {
    simulatorNavElement.hidden = true;
    simulatorNavElement.innerHTML = '';
  }
  updateHeader();
  if (state.stage === 'sim') updateSimulatorLive();
  if (byId('film-clip-rect')) startFilm();
  maybeStartTour();
  renderTour();
}

export function updateHeader() {
  byId('quick-test-banner').hidden = !QUICK_TEST_MODE;
  byId('mode-banner').hidden = !(DEMO_MODE || state.practice || state.freePlay);
  if (state.freePlay) byId('mode-banner').textContent = 'SERBEST MOD · araştırmaya dahil değil, kaydedilmez';
  else if (state.practice) byId('mode-banner').textContent = 'ALIŞTIRMA · işlemlerin sayılmaz';
  else if (DEMO_MODE) byId('mode-banner').textContent = 'TANITIM MODU · hiçbir veri kaydedilmez';
  byId('sync-dot').hidden = DEMO_MODE || !!state.freePlay;
  const inTask = state.stage === 'task' && state.trial && state.trial.mode === 'main';
  const inSim = state.stage === 'sim' && state.simulation;
  byId('timer-chip').hidden = !(inTask || inSim);
  if (inTask) {
    const shown = state.trial.phase === 'outcome' ? state.trialIndex : state.trialIndex + 1;
    byId('timer-text').textContent =
      'Karar ' +
      Math.min(Math.max(shown, 1), currentBlockTrials().length) +
      '/' +
      currentBlockTrials().length;
  }
  if (inSim)
    byId('timer-text').textContent = state.freePlay
      ? 'Gün ' + state.simulation.tick
      : '⏱ ' +
        formatMinutesSeconds(((simulationTickLimit() - state.simulation.tick) * CONFIG.simTickMs) / 1000);
  byId('menu-button').hidden = !(
    (state.participantCode || DEMO_MODE) &&
    ['task', 'intro', 'pre', 'demo', 'end', 'sim', 'bridge', 'stress'].indexOf(state.stage) >= 0
  );
  byId('help-button').hidden = !(
    (state.participantCode || DEMO_MODE) &&
    ['task', 'intro', 'sim', 'bridge'].indexOf(state.stage) >= 0
  );
  // Yön ışığı (iki gruba da aynı): kararda son haftanın yönü, sonuçta sonucun yönü, simülatörde kriz anı
  let direction = 0;
  let strong = false;
  if (CONFIG.crisisFx && state.stage === 'task' && state.trial) {
    const phase = state.trial.phase;
    if (phase === 'choose' || phase === 'cool') {
      const innerLastWeekChangePercent = lastWeekChangePercent(currentTrial());
      direction = innerLastWeekChangePercent >= 0 ? 1 : -1;
      strong = innerLastWeekChangePercent <= -8;
    } else if (phase === 'outcome' && state.trial.last) {
      direction = state.trial.last.out >= 0 ? 1 : -1;
    }
  }
  if (CONFIG.crisisFx && inSim && crisisAt(state.simulation.tick)) {
    direction = -1;
    strong = true;
  }
  const appElement = byId('app');
  appElement.classList.toggle('glow-up', direction > 0);
  appElement.classList.toggle('glow-down', direction < 0);
  appElement.classList.toggle('glow-strong', strong);
  updateSyncIndicator();
  updateProgressBar();
}

function progressState() {
  if (DEMO_MODE || state.freePlay) return null;
  const stage = state.stage;
  const length = TRIAL_SETS.X.length;
  if (state.testQuestion && state.testQuestion.kind === 'post') return [4, 0.1];
  if (stage === 'demo') return [0, 0.12];
  if (stage === 'pre') return [0, 0.3];
  if (stage === 'intro') return [0, 0.45 + 0.1 * state.introStep];
  if (stage === 'task' && state.trial) {
    if (state.trial.mode === 'practice')
      return state.trial.phase === 'quiz'
        ? [0, 0.88]
        : state.trial.phase === 'ready'
          ? [0, 0.97]
          : [0, 0.65 + 0.1 * state.trial.i];
    return [state.block === 'post' ? 3 : 1, Math.min(1, state.trialIndex / length)];
  }
  if (stage === 'stress')
    return state.stressKey === 'b_post' ? [3, 1] : state.stressKey === 'b_sim' ? [2, 1] : [1, 1];
  if (stage === 'bridge') return state.bridge === 'post' ? [3, 0] : [2, 0];
  if (stage === 'sim' && state.simulation)
    return state.practice ? [2, 0] : [2, Math.min(1, state.simulation.tick / CONFIG.simTicks)];
  if (stage === 'end')
    return [
      4,
      state.postTest == null
        ? 0.15
        : !state.manipulationCheck
          ? 0.45
          : state.purposeGuess == null
            ? 0.7
            : 0.9,
    ];
  return null;
}

function updateProgressBar() {
  const studyProgressElement = byId('study-progress');
  const innerProgressState = progressState();
  if (!innerProgressState) {
    studyProgressElement.hidden = true;
    return;
  }
  let percent = 0;
  let i;
  for (i = 0; i < innerProgressState[0]; i++) percent += PROGRESS_WEIGHTS[i];
  percent = Math.round((percent + PROGRESS_WEIGHTS[innerProgressState[0]] * innerProgressState[1]) * 100);
  const html = PROGRESS_LABELS.map(function (item, index) {
    const fill =
      index < innerProgressState[0]
        ? 100
        : index === innerProgressState[0]
          ? Math.round(innerProgressState[1] * 100)
          : 0;
    return (
      '<div><div class="progress-track"><i style="width:' +
      fill +
      '%"></i></div><div class="glossary-list' +
      (index === innerProgressState[0] ? ' is-current' : index < innerProgressState[0] ? ' is-done' : '') +
      '">' +
      item +
      '</div></div>'
    );
  }).join('');
  if (studyProgressElement._h !== html) {
    studyProgressElement.innerHTML = '<div class="progress-steps">' + html + '</div>';
    studyProgressElement._h = html;
  }
  studyProgressElement.setAttribute('aria-valuenow', percent);
  studyProgressElement.setAttribute(
    'aria-valuetext',
    PROGRESS_LABELS[innerProgressState[0]] + ', toplam %' + percent
  );
  studyProgressElement.hidden = false;
}
