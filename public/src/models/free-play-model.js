// Serbest mod: olay/haber takvimi üretimi, portföy kurulumu, kayıp sınırı hesapları.

import { state } from '../viewmodels/app-state.js';
import {
  FREE_PLAY_LEVELS,
  FREE_PLAY_NEUTRAL_NEWS,
  FREE_PLAY_NEWS,
  FREE_PLAY_SCENARIOS,
  FREE_PLAY_SECTORS,
} from '../constants/free-play-data.js';
import { STOCK_BASES } from '../constants/market-data.js';
import { marketRandom } from '../utils/random.js';

function pickRandomItem(items) {
  return items[Math.floor(marketRandom() * items.length)];
}

// Başlangıç portföyünü ayarlar (olay üretimini etkilemez: rnd2 kullanmaz)
export function applyFreePlayPortfolio(simulation, innerKey) {
  if (innerKey !== 'n' && innerKey !== 'h') return;
  var invested = 0,
    per = innerKey === 'h' ? (0.9 * simulation.v0) / STOCK_BASES.length : 0;
  STOCK_BASES.forEach(function (item) {
    var key = item[0],
      startPrice = simulation.p0[key],
      quantity = per ? Math.round(per / startPrice) : 0;
    simulation.pos[key] = { q: quantity, avg: startPrice };
    invested += quantity * startPrice;
  });
  simulation.cash = Math.round((simulation.v0 - invested) * 100) / 100;
}

export function initFreePlay(level, scenario) {
  var simulation = state.simulation;
  simulation.free = level;
  simulation.fsc = FREE_PLAY_SCENARIOS[scenario] ? scenario : 'r';
  simulation.orders = {};
  simulation.crises = [];
  simulation.news = [[0, FREE_PLAY_NEUTRAL_NEWS[FREE_PLAY_LEVELS[level].d][0], 0, []]];
  simulation.fr = { at: 0, end: 0, first: 1, lastSec: -1, lastSec2: -1, lastNeu: '' };
  planFreePlayEvents(simulation);
}

// Tohumdan ileriye (150 gün) olay ve haber planlar. Haberler gün sırasıyla eklenir; tarafsız haberler olayın uyarısından 3 gün önce ve bitişinden 8 gün sonra arasına konur.
export function planFreePlayEvents(simulation) {
  var list = FREE_PLAY_LEVELS[simulation.free],
    handler = simulation.fr,
    SC = FREE_PLAY_SCENARIOS[simulation.fsc || 'r'];
  while (handler.at < simulation.tick + 150) {
    var gap = Math.round((list.gap[0] + marketRandom() * (list.gap[1] - list.gap[0])) * SC.gap);
    if (handler.first) {
      gap = Math.round(gap * 0.5);
      handler.first = 0;
    }
    var at = handler.at + gap,
      wd = at - list.warn,
      lo = handler.end + 8,
      hi = wd - 3,
      count = 2 + (marketRandom() < 0.5 ? 1 : 0),
      days = [],
      i;
    for (i = 0; i < count; i++) {
      var data = Math.round(lo + ((i + 0.5) * (hi - lo)) / count + (marketRandom() - 0.5) * 4);
      if (data >= lo && data <= hi && (!days.length || data - days[days.length - 1] >= 6)) days.push(data);
    }
    days.forEach(function (item) {
      var value,
        items = FREE_PLAY_NEUTRAL_NEWS[list.d],
        group = 0;
      do {
        value = pickRandomItem(items);
        group++;
      } while (value === handler.lastNeu && group < 9);
      handler.lastNeu = value;
      simulation.news.push([item, value, 0, []]);
    });
    var all = marketRandom() < list.mkt,
      stockIndex = 5;
    if (!all) {
      do {
        stockIndex = Math.floor(marketRandom() * 5);
      } while (stockIndex === handler.lastSec || stockIndex === handler.lastSec2);
      handler.lastSec2 = handler.lastSec;
      handler.lastSec = stockIndex;
    }
    var isUp = marketRandom() < (SC.up == null ? list.up : SC.up),
      mg = (list.drop[0] + marketRandom() * (list.drop[1] - list.drop[0])) * SC.drop,
      len = 5 + Math.floor(marketRandom() * 5),
      scrollTop = FREE_PLAY_SECTORS[stockIndex][1];
    if (all) mg *= 0.6;
    if (isUp) mg = mg / (1 - mg);
    mg = Math.round(mg * 1000) / 1000;
    simulation.crises.push({ at: at, len: len, drop: isUp ? -mg : mg, stocks: scrollTop });
    simulation.news.push([
      wd,
      FREE_PLAY_NEWS[stockIndex][isUp ? 2 : 0][list.d],
      !isUp && list.d < 2 ? -1 : 0,
      scrollTop,
    ]);
    simulation.news.push([at, FREE_PLAY_NEWS[stockIndex][isUp ? 3 : 1][list.d], isUp ? 1 : -1, scrollTop]);
    handler.at = at;
    handler.end = at + len;
  }
}

function freePlayLossFloor(level, startValue) {
  return Math.round(startValue * (1 - FREE_PLAY_LEVELS[level].lim));
}

// b23: kayıp sınırı kullanıcı seçimi (f.lim) ya da zorluğun varsayılanı
export function freePlayLossLimit(freePlay) {
  return freePlay.lim != null ? freePlay.lim : FREE_PLAY_LEVELS[freePlay.lvl].lim;
}

export function freePlayLossFloorFor(freePlay, startValue) {
  return Math.round(startValue * (1 - freePlayLossLimit(freePlay)));
}
