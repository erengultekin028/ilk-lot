// Eylemler: simülatör ve işlem.

import { actions } from './index.js';
import { CONFIG } from '../../constants/app-config.js';
import { render } from '../../views/app-shell.js';
import { state } from '../app-state.js';
import { byId, setText } from '../../utils/dom.js';
import { flushEvents, logEvent } from '../../services/event-log.js';
import { SELL_REASONS } from '../../constants/glossary.js';
import { buyStock, endPractice, sellStock, trackTabTime } from '../market-controller.js';
import { initSimulation, latestNewsAt, simulationTickLimit } from '../../models/market-simulation.js';
import { closeModal, openModal } from '../../widgets/modal.js';
import { saveSnapshot } from '../../services/session-persistence.js';
import {
  calculateTrade,
  sellReasonHtml,
  simulatorCooldownHtml,
  tradeWindowHtml,
  updateTradePreview,
} from '../../views/simulator-view.js';
import { startTrial } from '../study-flow.js';
export const marketActions = {
  startPracticeSimulator: function () {
    state.readingMs = state.readingStartedAt ? Date.now() - state.readingStartedAt : null;
    state.practice = {
      t0: Date.now(),
    };
    initSimulation(CONFIG.pracSeed);
    state.marketTab = 'p';
    state.detailSymbol = null;
    state.tradeDraft = null;
    state.sellReasonDraft = null;
    state.simulatorCooldown = null;
    state.tabTimes = {
      p: 0,
      m: 0,
      a: 0,
    };
    state.tabActiveSince = Date.now();
    state.stage = 'sim';
    render();
  },
  skipPracticeSimulator: function () {
    endPractice(true);
  },
  startSimulation: function () {
    if (state.readingMs == null)
      state.readingMs = state.readingStartedAt ? Date.now() - state.readingStartedAt : null;
    state.phase = 'sim';
    initSimulation();
    state.marketTab = 'p';
    state.tabTimes = {
      p: 0,
      m: 0,
      a: 0,
    };
    state.tabActiveSince = Date.now();
    logEvent('sim_start', {
      readMs: state.readingMs,
    });
    state.stage = 'sim';
    saveSnapshot();
    flushEvents();
    render();
  },
  switchMarketTab: function (value) {
    if (value === state.marketTab && !state.detailSymbol) return;
    trackTabTime();
    logEvent('sim_tab', {
      from: state.marketTab,
      to: value,
      tick: state.simulation.tick,
    });
    state.marketTab = value;
    state.detailSymbol = null;
    if (value === 'm') {
      const news = latestNewsAt(state.simulation.tick);
      state.newsSeenDay = news ? news[0] : 0;
    }
    render();
  },
  openStockDetail: function (key) {
    state.detailSymbol = key;
    state.scrubDay = null;
    logEvent('sim_detail', {
      k: key,
      tick: state.simulation.tick,
    });
    document.getElementById('main-view').scrollTop = 0;
    render();
  },
  closeStockDetail: function () {
    state.detailSymbol = null;
    state.scrubDay = null;
    render();
  },
  setChartRange: function (value) {
    state.detailRangeDays = +value;
    render();
  },
  startPostBlock: function () {
    logEvent('task_start', {
      block: 'post',
    });
    state.phase = 'post';
    state.block = 'post';
    state.trialIndex = 0;
    state.trial = {
      mode: 'main',
      i: 0,
    };
    state.stage = 'task';
    startTrial();
  },
  openTradeWindow: function (innerValue) {
    if (state.simulation.tick >= simulationTickLimit()) return;
    const value = String(innerValue).split('|');
    const key = value[0];
    const position = state.simulation.pos[key];
    const side = value[1] || (position && position.q > 0 ? 'S' : 'B');
    state.tradeDraft = {
      k: key,
      t0: Date.now(),
      side: side,
      q: 0,
      mode: null,
      edits: 0,
    };
    logEvent('sim_open', {
      k: key,
      side: side,
    });
    openModal(tradeWindowHtml(key));
  },
  closeTradeWindow: function () {
    state.tradeDraft = null;
    state.sellReasonDraft = null;
    closeModal();
  },
  setTradeSide: function (value) {
    const tradeDraft = state.tradeDraft;
    if (!tradeDraft || tradeDraft.side === value) return;
    tradeDraft.side = value;
    tradeDraft.q = 0;
    tradeDraft.mode = null;
    tradeDraft.edits++;
    const i = byId('trade-quantity');
    if (i) i.value = '';
    updateTradePreview();
  },
  setTradeQuantity: function (value) {
    const tradeDraft = state.tradeDraft;
    if (!tradeDraft) return;
    const trade = calculateTrade();
    let quantity = tradeDraft.q || 0;
    if (value === '+1') quantity = Math.min(trade.lim, quantity + 1);
    else if (value === '-1') quantity = Math.max(0, quantity - 1);
    else {
      const handler = {
        p25: 0.25,
        p50: 0.5,
        p75: 0.75,
      }[value];
      quantity =
        trade.lim < 1 ? 0 : value === 'max' ? trade.lim : Math.max(1, Math.floor(trade.lim * handler));
    }
    tradeDraft.q = quantity;
    tradeDraft.mode = value === '+1' || value === '-1' ? 'step' : 'chip';
    tradeDraft.edits++;
    const i = byId('trade-quantity');
    if (i) i.value = quantity || '';
    updateTradePreview();
  },
  submitTrade: function () {
    const tradeDraft = state.tradeDraft;
    if (!tradeDraft) return;
    const trade = calculateTrade();
    if (trade.q < 1 || trade.over) return;
    if (trade.sell && state.freePlay) sellStock(tradeDraft.k, trade.q, false);
    else if (trade.sell) {
      state.sellReasonDraft = {
        k: tradeDraft.k,
        q: trade.q,
      };
      byId('modal-box').innerHTML = sellReasonHtml(tradeDraft.k, trade.q);
    } else buyStock(tradeDraft.k, trade.q);
  },
  cancelSellReason: function () {
    const key = state.sellReasonDraft.k;
    state.sellReasonDraft = null;
    byId('modal-box').innerHTML = tradeWindowHtml(key);
  },
  chooseSellReason: function (i) {
    const sellReasonDraft = state.sellReasonDraft;
    sellReasonDraft.why = SELL_REASONS[+i];
    actions.confirmSell();
  },
  confirmSell: function () {
    const sellReasonDraft = state.sellReasonDraft;
    const key = sellReasonDraft.k;
    const quantity = sellReasonDraft.q;
    const simulation = state.simulation;
    const position = simulation.pos[key];
    const profitLossPercent = position ? simulation.p[key] / position.avg - 1 : 0;
    if (
      !state.practice &&
      !state.freePlay &&
      state.group === 'A' &&
      profitLossPercent <= CONFIG.lossThreshold
    ) {
      const value = (state.cooldownStats = state.cooldownStats || {
        n: 0,
        v: 0,
        g: 0,
      });
      value.n++;
      state.simulatorCooldown = {
        k: key,
        q: quantity,
        left: CONFIG.cooldownSec,
        t0: Date.now(),
      };
      logEvent('cooldown_shown', {
        k: key,
        pl: Math.round(profitLossPercent * 10000) / 10000,
        tick: simulation.tick,
        why: sellReasonDraft.why,
        q: quantity,
      });
      byId('modal-box').innerHTML = simulatorCooldownHtml(key, profitLossPercent * 100);
      clearInterval(state.cooldownTimer);
      state.cooldownTimer = setInterval(function () {
        if (!state.simulatorCooldown) {
          clearInterval(state.cooldownTimer);
          return;
        }
        state.simulatorCooldown.left--;
        setText('cooldown-number', String(Math.max(0, state.simulatorCooldown.left)));
        if (state.simulatorCooldown.left <= 0) {
          clearInterval(state.cooldownTimer);
          const cooldownConfirmElement = byId('cooldown-confirm');
          if (cooldownConfirmElement) cooldownConfirmElement.disabled = false;
        }
      }, 1000);
      return;
    }
    sellStock(key, quantity, false);
  },
  cancelCooldown: function () {
    const simulatorCooldown = state.simulatorCooldown;
    state.cooldownStats.v++;
    clearInterval(state.cooldownTimer);
    logEvent('cooldown_cancel', {
      k: simulatorCooldown.k,
      waitedMs: Date.now() - simulatorCooldown.t0,
    });
    state.simulatorCooldown = null;
    state.sellReasonDraft = null;
    byId('modal-box').innerHTML = tradeWindowHtml(simulatorCooldown.k);
  },
  confirmAfterCooldown: function () {
    const simulatorCooldown = state.simulatorCooldown;
    if (!simulatorCooldown || simulatorCooldown.left > 0) return;
    state.cooldownStats.g++;
    clearInterval(state.cooldownTimer);
    logEvent('cooldown_proceed', {
      k: simulatorCooldown.k,
      waitedMs: Date.now() - simulatorCooldown.t0,
    });
    state.simulatorCooldown = null;
    sellStock(simulatorCooldown.k, simulatorCooldown.q, true);
  },
};
