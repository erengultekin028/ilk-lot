// Çalışma akışı: karar anı başlatma, seçim, sonuç, kaldığı yerden devam.

import { CONFIG } from '../constants/app-config.js';
import { render } from '../views/app-shell.js';
import { state } from './app-state.js';
import { newComprehensionSelection } from '../models/comprehension.js';
import { flushEvents, logEvent } from '../services/event-log.js';
import { initSimulation } from '../models/market-simulation.js';
import { endSession } from './session-lifecycle.js';
import { saveSnapshot } from '../services/session-persistence.js';
import { PRACTICE_TRIALS, currentBlockTrials } from '../models/trial-generator.js';

// ═════════════════ GÖREV EKRANLARI ═════════════════
export function currentTrial() {
  return state.trial.mode === 'practice'
    ? PRACTICE_TRIALS[state.trial.i]
    : currentBlockTrials()[state.trialIndex];
}

// ═════════════════ AKIŞ ═════════════════
// pre: 1. bölüm (6 karar) → sim: 2. bölüm (simülatör) → post: 3. bölüm (6 karar) → done
function startMainTrial() {
  state.stage = 'task';
  state.trial = { mode: 'main', i: state.trialIndex, phase: 'choose', t0: Date.now(), first: null };
}

export function resumeFlow() {
  if (state.ended || state.phase === 'done') {
    state.stage = 'end';
    return;
  }
  if (state.phase === 'pre') {
    state.block = 'pre';
    if (state.trialIndex < currentBlockTrials().length) return startMainTrial();
    if (!state.pulses.b_pre) {
      state.stage = 'stress';
      state.stressKey = 'b_pre';
      return;
    }
    state.stage = 'bridge';
    state.bridge = 'sim';
    return;
  }
  if (state.phase === 'sim') {
    if (!state.simulation) initSimulation();
    if (state.simulation.tick >= CONFIG.simTicks) {
      state.stage = 'stress';
      state.stressKey = 'b_sim';
      return;
    }
    state.stage = 'sim';
    return;
  }
  if (state.phase === 'post') {
    state.block = 'post';
    if (state.trialIndex < currentBlockTrials().length) return startMainTrial();
    if (!state.pulses.b_post) {
      state.stage = 'stress';
      state.stressKey = 'b_post';
      return;
    }
    state.stage = 'end';
    setTimeout(endSession, 0);
  }
}

export function startTrial() {
  state.trial.phase = 'choose';
  state.trial.t0 = Date.now();
  state.trial.first = null;
  state.trial.firstMs = null;
  state.trial.cdShown = false;
  state.trial.cdWait = null;
  if (state.trial.mode === 'main')
    logEvent('trial_show', {
      id: currentBlockTrials()[state.trialIndex].id,
      block: state.block,
      n: state.trialIndex + 1,
    });
  render();
}

// Görevlerde bekleme süresi YOK (iki grupta da): 1. ve 3. bölüm aktarımı ölçer
export function chooseOption(choice) {
  const trialState = state.trial;
  const timestamp = Date.now();
  if (trialState.first == null) {
    trialState.first = choice;
    trialState.firstMs = timestamp - trialState.t0;
  }
  finalizeChoice(choice);
}

function finalizeChoice(choice) {
  const trialState = state.trial;
  const trial = currentTrial();
  const timestamp = Date.now();
  // Sonuç: sat = fiyat değişiminden etkilenmez; tut = pozisyon × değişim; daha al = (pozisyon + ek) × değişim
  const resolve =
    choice === 'sat'
      ? 0
      : choice === 'tut'
        ? CONFIG.stake * trial.out
        : (CONFIG.stake + CONFIG.addAmount) * trial.out;
  const map = {
    id: trial.id,
    block: state.block,
    set: trial.set,
    n: trial.n,
    sym: trial.sym,
    kind: trial.kind,
    pos: trial.pos,
    pl: trial.pl,
    crowd: trial.crowd,
    news: !!trial.news,
    out: trial.out,
    first: trialState.first,
    final: choice,
    rtFirst: trialState.firstMs,
    rtFinal: timestamp - trialState.t0,
    hid: (state.lastHiddenAt || 0) > trialState.t0,
    res: Math.round(resolve),
  };
  trialState.last = map;
  trialState.phase = 'outcome';
  if (trialState.mode === 'main') {
    state.decisions.push(map);
    state.totalDecisions += map.res;
    state.trialIndex++;
    logEvent('decision', map);
    saveSnapshot();
    flushEvents();
  } else logEvent('practice_trial', { id: trial.id, final: choice, rtFirst: trialState.firstMs });
  render();
}

export function advanceAfterOutcome() {
  const trialState = state.trial;
  if (trialState.mode === 'practice') {
    if (trialState.i + 1 < PRACTICE_TRIALS.length) {
      trialState.i++;
      startTrial();
    } else {
      state.comprehension = state.comprehension || {
        i: 0,
        sel: null,
        first: [],
        att: [],
        f: newComprehensionSelection(),
      };
      trialState.phase = 'quiz';
      logEvent('practice_done', {});
      saveSnapshot();
      render();
    }
    return;
  }
  if (state.trialIndex >= currentBlockTrials().length) {
    state.stage = 'stress';
    state.stressKey = state.block === 'pre' ? 'b_pre' : 'b_post';
    state.stressStartedAt = Date.now();
    render();
    return;
  }
  trialState.i = state.trialIndex;
  startTrial();
}
