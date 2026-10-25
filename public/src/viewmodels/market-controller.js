// Simülatör denetleyicisi: piyasa adımı, alım/satım, bitiş, grafik gezinme.

import { DEMO_MODE } from '../constants/app-config.js';
import { render, updateHeader } from '../views/app-shell.js';
import { state } from './app-state.js';
import { byId } from '../utils/dom.js';
import { flushEvents, logEvent } from '../services/event-log.js';
import { formatNumber, round2 } from '../utils/format.js';
import { freePlayLossFloorFor } from '../models/free-play-model.js';
import { STOCK_BASES } from '../constants/market-data.js';
import {
  crisisAt,
  portfolioValue,
  simulationTickLimit,
  stepSimulation,
  stockCrisisAt,
} from '../models/market-simulation.js';
import { closeModal, isModalOpen } from '../widgets/modal.js';
import { renderDetailChart } from '../widgets/price-chart.js';
import { saveSnapshot } from '../services/session-persistence.js';
import { updateSimulatorLive } from '../views/simulator-view.js';
import { showToast } from '../widgets/toast.js';
import { renderTour } from './tour-controller.js';

// Piyasa döngüsü: sadece simülatör ekranında, sekme görünürken ve işlem penceresi kapalıyken ilerler
export function marketTick() {
  if (
    state.stage !== 'sim' ||
    !state.simulation ||
    document.hidden ||
    isModalOpen() ||
    state.tour ||
    state.simulation.tick >= simulationTickLimit()
  )
    return;
  stepSimulation();
  updateSimulatorLive();
  updateHeader();
  const simulation = state.simulation;
  const crisis = crisisAt(simulation.tick);
  if (crisis && simulation.tick === crisis.at) {
    logEvent('sim_crisis_start', { stocks: crisis.stocks, tab: state.marketTab });
    if (state.marketTab !== 'p') showToast('Sert düşüş: ' + crisis.stocks.join(', ') + '. Portföyüne bak.');
    if (navigator.vibrate)
      try {
        navigator.vibrate([80, 60, 80]);
      } catch (error) {}
  }
  if (state.freePlay) {
    executeFreePlayOrders();
    const portfolioTotal = portfolioValue();
    if (portfolioTotal > state.freePlay.peak) state.freePlay.peak = portfolioTotal;
    if (portfolioTotal <= freePlayLossFloorFor(state.freePlay, simulation.v0)) {
      finishFreePlay('limit');
      return;
    }
  }
  if (simulation.tick % 10 === 0) {
    saveSnapshot();
    flushEvents();
  }
  if (simulation.tick >= simulationTickLimit()) {
    if (state.practice) endPractice(false);
    else endSimulation();
  }
}

// b23: serbest mod otomatik sat emirleri. Eşik, hissenin ORTALAMA ALIŞ fiyatına göre kâr/zarardır; tetiklenince hissenin tamamı O ANKİ fiyattan satılır
// (sert düşüşte eşiğin altından satış olabilir). Hissenin tamamı satıldığı için doSimSell emri siler: emir bir kez çalışır.
function executeFreePlayOrders() {
  const simulation = state.simulation;
  if (!state.freePlay || !simulation || !simulation.orders) return;
  STOCK_BASES.forEach(function (item) {
    const key = item[0];
    const order = simulation.orders[key];
    const position = simulation.pos[key];
    if (!order || !position || position.q < 1) return;
    const profitLossPercent = simulation.p[key] / position.avg - 1;
    let value = null;
    if (order.stop != null && profitLossPercent <= -order.stop) value = 'stop';
    else if (order.take != null && profitLossPercent >= order.take) value = 'take';
    if (!value) return;
    const quantity = position.q;
    const price = simulation.p[key];
    sellStock(key, quantity, false);
    const trialState = simulation.trades[simulation.trades.length - 1];
    if (trialState) trialState.auto = value;
    showToast(
      'Otomatik emir: ' +
        key +
        (value === 'stop'
          ? ' zarar eşiği (−%' + Math.round(order.stop * 100) + ')'
          : ' kâr eşiği (+%' + Math.round(order.take * 100) + ')') +
        ' aşıldı, ' +
        quantity +
        ' lot ₺' +
        formatNumber(price) +
        ' fiyattan satıldı.'
    );
  });
}

export function trackTabTime() {
  if (state.stage !== 'sim' || !state.tabActiveSince) return;
  const timestamp = Date.now();
  state.tabTimes[state.marketTab] =
    (state.tabTimes[state.marketTab] || 0) + (timestamp - state.tabActiveSince);
  state.tabActiveSince = timestamp;
}

export function endPractice(skipped) {
  const practice = state.practice;
  if (!practice) return;
  trackTabTime();
  state.tabActiveSince = null;
  closeModal();
  clearInterval(state.cooldownTimer);
  const count = state.simulation ? state.simulation.trades.length : 0;
  const tick = state.simulation ? state.simulation.tick : 0;
  state.practice = null;
  state.simulation = null;
  state.detailSymbol = null;
  state.tradeDraft = null;
  state.sellReasonDraft = null;
  state.simulatorCooldown = null;
  state.tour = null;
  renderTour();
  logEvent('practice_sim', { trades: count, tick: tick, skipped: !!skipped, ms: Date.now() - practice.t0 });
  flushEvents();
  state.stage = 'bridge';
  state.bridge = 'simready';
  render();
}

export function finishFreePlay(kind) {
  const freePlay = state.freePlay;
  const simulation = state.simulation;
  if (!freePlay || !simulation || freePlay.res) return;
  closeModal();
  clearInterval(state.cooldownTimer);
  state.tradeDraft = null;
  state.sellReasonDraft = null;
  state.simulatorCooldown = null;
  freePlay.res = {
    kind: kind,
    tick: simulation.tick,
    value: portfolioValue(),
    v0: simulation.v0,
    peak: freePlay.peak,
    trades: simulation.trades.length,
  };
  state.stage = 'freeend';
  render();
  window.scrollTo(0, 0);
}

function endSimulation() {
  trackTabTime();
  state.tabActiveSince = null;
  closeModal();
  clearInterval(state.cooldownTimer);
  const simulation = state.simulation;
  if (DEMO_MODE) {
    state.stage = 'demoend';
    render();
    return;
  }
  logEvent('sim_end', { value: Math.round(portfolioValue()), trades: simulation.trades.length });
  state.stage = 'stress';
  state.stressKey = 'b_sim';
  state.stressStartedAt = Date.now();
  saveSnapshot();
  flushEvents();
  render();
}

function recordTrade(symbol, side, quantity, price, extra) {
  const simulation = state.simulation;
  const position = simulation.pos[symbol];
  const map = {
    t: simulation.tick,
    sym: symbol,
    side: side,
    q: quantity,
    p: round2(price),
    pl: position ? Math.round((price / position.avg - 1) * 10000) / 10000 : null,
    // Bu hisse şu an krizde mi; ya da krizinden sonraki 20 gün içinde mi (dipteki satışlar buraya düşer)
    crisis: !!stockCrisisAt(symbol, simulation.tick, 0),
    postCrisis: !!stockCrisisAt(symbol, simulation.tick, 20),
    decMs: state.tradeDraft ? Date.now() - state.tradeDraft.t0 : null,
  };
  for (const x in extra) map[x] = extra[x];
  return map;
}

export function sellStock(symbol, quantity, afterCooldown) {
  const simulation = state.simulation;
  const position = simulation.pos[symbol];
  const price = simulation.p[symbol];
  if (!position || quantity < 1 || quantity > position.q) return;
  const value = state.tradeDraft || {};
  const innerRecordTrade = recordTrade(symbol, 'S', quantity, price, {
    frac: Math.round((quantity / position.q) * 1000) / 1000,
    afterCooldown: !!afterCooldown,
    value: Math.round(quantity * price),
    why: state.sellReasonDraft ? state.sellReasonDraft.why : null,
    qMode: value.mode || null,
    qEdits: value.edits || 0,
  });
  state.sellReasonDraft = null;
  simulation.cash += quantity * price;
  position.q -= quantity;
  if (state.freePlay && position.q < 1 && simulation.orders) delete simulation.orders[symbol];
  simulation.trades.push(innerRecordTrade);
  logEvent('sim_trade', innerRecordTrade);
  state.tradeDraft = null;
  closeModal();
  saveSnapshot();
  if (state.detailSymbol) render();
  else updateSimulatorLive();
  showToast(symbol + ': ' + quantity + ' lot satıldı (₺' + formatNumber(quantity * price, 0) + ').');
}

export function buyStock(symbol, quantity) {
  const simulation = state.simulation;
  const price = simulation.p[symbol];
  const position = simulation.pos[symbol];
  const innerValue = quantity * price;
  if (!(quantity >= 1) || innerValue > simulation.cash + 1e-9) return;
  const value = state.tradeDraft || {};
  const innerRecordTrade = recordTrade(symbol, 'B', quantity, price, {
    value: Math.round(innerValue),
    qMode: value.mode || null,
    qEdits: value.edits || 0,
  });
  position.avg =
    position.q > 0 ? (position.avg * position.q + price * quantity) / (position.q + quantity) : price;
  position.q += quantity;
  simulation.cash = Math.max(0, simulation.cash - innerValue);
  simulation.trades.push(innerRecordTrade);
  logEvent('sim_trade', innerRecordTrade);
  state.tradeDraft = null;
  closeModal();
  saveSnapshot();
  if (state.detailSymbol) render();
  else updateSimulatorLive();
  showToast(symbol + ': ' + quantity + ' lot alındı (₺' + formatNumber(innerValue, 0) + ').');
}

// Hisse grafiğinde parmakla (ya da fareyle) gezme: o günün fiyatı gösterilir. Bırakılınca 1,5 sn sonra kaybolur.
// Hareketler tek tek kaydedilmez; jest bitince tek olay (sim_chart_scrub: k, moves, ms, tick)
export const scrubState = { timer: null, gesture: null };

export function scrubChartAt(event) {
  const element = document.querySelector('#detail-chart svg');
  if (!element || !state.simulation || !state.detailSymbol) return;
  const rect = element.getBoundingClientRect();
  if (!rect.width) return;
  const simulation = state.simulation;
  const detailSymbol = state.detailSymbol;
  const count = Math.min(state.detailRangeDays, simulation.h[detailSymbol].length);
  const i = Math.round(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * (count - 1));
  state.scrubDay = simulation.tick - (count - 1 - i);
  if (scrubState.gesture) scrubState.gesture.moves++;
  const detailChartElement = byId('detail-chart');
  if (detailChartElement) detailChartElement.innerHTML = renderDetailChart(detailSymbol);
}

export function endChartScrub() {
  clearTimeout(scrubState.timer);
  scrubState.timer = null;
  if (scrubState.gesture && scrubState.gesture.moves > 2)
    logEvent('sim_chart_scrub', {
      k: state.detailSymbol,
      moves: scrubState.gesture.moves,
      ms: Date.now() - scrubState.gesture.t0,
      tick: state.simulation ? state.simulation.tick : null,
    });
  scrubState.gesture = null;
  scrubState.timer = setTimeout(function () {
    scrubState.timer = null;
    state.scrubDay = null;
    const detailChartElement = byId('detail-chart');
    if (detailChartElement && state.detailSymbol && state.simulation)
      detailChartElement.innerHTML = renderDetailChart(state.detailSymbol);
  }, 1500);
}
