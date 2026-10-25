// Eylemler: serbest mod.

import { DEMO_MODE } from '../../constants/app-config.js';
import { render } from '../../views/app-shell.js';
import { state } from '../app-state.js';
import { byId } from '../../utils/dom.js';
import {
  FREE_PLAY_LEVELS,
  FREE_PLAY_LOSS_LIMITS,
  FREE_PLAY_PORTFOLIOS,
  FREE_PLAY_SCENARIOS,
} from '../../constants/free-play-data.js';
import { applyFreePlayPortfolio, initFreePlay } from '../../models/free-play-model.js';
import { freePlayOrderHtml } from '../../views/free-play-view.js';
import { finishFreePlay } from '../market-controller.js';
import { initSimulation } from '../../models/market-simulation.js';
import { closeModal, openModal } from '../../widgets/modal.js';
import { freePlayBannerNews, updateNewsBanner } from '../../views/simulator-view.js';

export const freePlayActions = {
  openFreePlay: function () {
    if (
      state.freePlay ||
      !(state.stage === 'end' || (DEMO_MODE && ['demoland', 'demoend', 'sim'].indexOf(state.stage) >= 0))
    )
      return;
    closeModal();
    state.freePlay = {
      lvl: 'o',
      peak: 0,
      keep: {
        stage: state.stage,
        sim: state.simulation,
        simSer: state.simulationSeriesCache,
        simTab: state.marketTab,
        tabT: state.tabTimes,
        tabSince: state.tabActiveSince,
        newsSeen: state.newsSeenDay,
        simRange: state.detailRangeDays,
        simDetail: state.detailSymbol,
        scrubDay: state.scrubDay,
      },
    };
    state.stage = 'freemenu';
    render();
    window.scrollTo(0, 0);
  },
  selectFreePlayLevel: function (value) {
    if (!state.freePlay || !FREE_PLAY_LEVELS[value]) return;
    state.freePlay.lvl = value;
    render();
  },
  selectFreePlayLimit: function (value) {
    if (!state.freePlay) return;
    var count = value === 'd' ? null : +value;
    if (count !== null && FREE_PLAY_LOSS_LIMITS.indexOf(count) < 0) return;
    state.freePlay.lim = count;
    render();
  },
  selectFreePlayScenario: function (value) {
    if (!state.freePlay || !FREE_PLAY_SCENARIOS[value]) return;
    state.freePlay.sc = value;
    render();
  },
  selectFreePlayPortfolio: function (value) {
    if (!state.freePlay || !FREE_PLAY_PORTFOLIOS[value]) return;
    state.freePlay.pf = value;
    render();
  },
  closeNewsBanner: function () {
    var news = freePlayBannerNews();
    if (state.freePlay && news) {
      state.freePlay.bn = news[0];
      updateNewsBanner();
    }
  },
  setFreePlaySpeed: function (value) {
    var count = +value;
    if (!state.freePlay || [0, 1, 2, 4].indexOf(count) < 0) return;
    state.freePlay.speed = count;
    document.querySelectorAll('[data-a=setFreePlaySpeed]').forEach(function (item) {
      var isOn = +item.dataset.v === count;
      item.classList.toggle('is-active', isOn);
      item.setAttribute('aria-pressed', isOn);
    });
  },
  setFreePlayOrder: function (innerValue) {
    var items = String(innerValue).split('|'),
      key = items[0],
      value = items[1],
      simulation = state.simulation;
    if (!state.freePlay || !simulation || !simulation.pos[key] || (value !== 'stop' && value !== 'take'))
      return;
    var count = items[2] === 'x' ? null : +items[2];
    if (count !== null && (value === 'stop' ? [0.05, 0.1, 0.15, 0.2] : [0.1, 0.2, 0.3]).indexOf(count) < 0)
      return;
    if (!simulation.pos[key].q) return;
    var order = (simulation.orders[key] = simulation.orders[key] || { stop: null, take: null });
    order[value] = count;
    if (order.stop == null && order.take == null) delete simulation.orders[key];
    var orderSectionElement = byId('order-section');
    if (orderSectionElement) orderSectionElement.innerHTML = freePlayOrderHtml(key);
  },
  showFreePlayMenu: function () {
    if (!state.freePlay) return;
    state.simulation = null;
    state.stage = 'freemenu';
    render();
  },
  startFreePlay: function () {
    var freePlay = state.freePlay;
    if (!freePlay || !FREE_PLAY_LEVELS[freePlay.lvl]) return;
    closeModal();
    clearInterval(state.cooldownTimer);
    initSimulation('serbest-' + Date.now() + '-' + Math.floor(Math.random() * 1e9));
    applyFreePlayPortfolio(state.simulation, freePlay.pf || 'd');
    initFreePlay(freePlay.lvl, freePlay.sc || 'r');
    freePlay.peak = state.simulation.v0;
    freePlay.res = null;
    state.marketTab = 'p';
    state.detailSymbol = null;
    state.tradeDraft = null;
    state.sellReasonDraft = null;
    state.simulatorCooldown = null;
    state.tour = null;
    state.scrubDay = null;
    state.detailRangeDays = state.detailRangeDays || 30;
    state.tabTimes = { p: 0, m: 0, a: 0 };
    state.tabActiveSince = Date.now();
    state.stage = 'sim';
    render();
  },
  quitFreePlay: function () {
    if (!state.freePlay || state.stage !== 'sim') return;
    openModal(
      '<h2>Oyunu bitirelim mi?</h2><p>Oyun burada sona erer. İstersen sonra yeniden başlayabilirsin.</p><button class="button is-primary" data-a="endFreePlay">Oyunu bitir</button><button class="button" data-a="cancelModal">Devam et</button>'
    );
  },
  endFreePlay: function () {
    finishFreePlay('quit');
  },
  leaveFreePlay: function () {
    var freePlay = state.freePlay;
    if (!freePlay) return;
    var keep = freePlay.keep;
    closeModal();
    clearInterval(state.cooldownTimer);
    state.simulation = keep.sim;
    state.simulationSeriesCache = keep.simSer;
    state.marketTab = keep.simTab;
    state.tabTimes = keep.tabT;
    state.tabActiveSince = keep.tabSince;
    state.newsSeenDay = keep.newsSeen;
    state.detailRangeDays = keep.simRange;
    state.detailSymbol = keep.simDetail;
    state.scrubDay = keep.scrubDay;
    state.tradeDraft = null;
    state.sellReasonDraft = null;
    state.simulatorCooldown = null;
    state.freePlay = null;
    state.stage = keep.stage || 'end';
    render();
    window.scrollTo(0, 0);
  },
};
