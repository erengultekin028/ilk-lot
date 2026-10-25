// Piyasa simülatörü motoru: fiyat adımı, krizler, haberler, portföy değeri.

import { CONFIG } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { planFreePlayEvents } from './free-play-model.js';
import { SIMULATOR_NEWS, STOCK_BASES } from '../constants/market-data.js';
import { hashSeed, marketRandom, rngState } from '../utils/random.js';

export function simulationTickLimit() {
  return state.freePlay ? Infinity : state.practice ? CONFIG.pracTicks : CONFIG.simTicks;
}

export function simulationMinutesText() {
  const x = Math.round(((CONFIG.simTicks * CONFIG.simTickMs) / 60000) * 2) / 2;
  return String(x).replace('.', ',');
}

export function tickSecondsText() {
  return String(CONFIG.simTickMs / 1000).replace('.', ',');
}

export function initSimulation(seed) {
  rngState.market = hashSeed(seed || CONFIG.simSeed);
  const map = {
    tick: 0,
    cash: CONFIG.cash0,
    pos: {},
    p: {},
    h: {},
    p0: {},
    trades: [],
    v0: CONFIG.cash0 + STOCK_BASES.length * CONFIG.posValue,
    vh: [],
  };
  let invested = 0;
  STOCK_BASES.forEach(function (item) {
    const quantity = Math.round(CONFIG.posValue / item[2]);
    map.p[item[0]] = item[2];
    map.p0[item[0]] = item[2];
    map.h[item[0]] = [item[2]];
    map.pos[item[0]] = { q: quantity, avg: item[2] };
    invested += quantity * item[2];
  });
  map.cash = Math.round((map.v0 - invested) * 100) / 100;
  map.vh.push(map.v0);
  state.newsSeenDay = 0;
  state.simulation = map;
}

// b19: serbest modda olaylar S.sim.crises'ta tutulur (çalışma simülatöründe tanımsız: her zaman CFG.simCrises). simCrisis yalnız DÜŞÜŞ olaylarını döndürür (uyarı/kırmızı vurgu)
function activeCrises() {
  return (state.simulation && state.simulation.crises) || CONFIG.simCrises;
}

export function crisisAt(tick) {
  const crises = activeCrises();
  for (let i = 0; i < crises.length; i++) {
    const value = crises[i];
    if (value.drop > 0 && tick >= value.at && tick < value.at + value.len) return value;
  }
  return null;
}

// Hissenin şu an krizde (ya da krizden sonraki 20 günde) olup olmadığı
export function stockCrisisAt(symbol, tick, after) {
  const crises = activeCrises();
  for (let i = 0; i < crises.length; i++) {
    const value = crises[i];
    if (value.stocks.indexOf(symbol) >= 0 && tick >= value.at && tick < value.at + value.len + (after || 0))
      return value;
  }
  return null;
}

export function newsItems() {
  return (state.simulation && state.simulation.news) || SIMULATOR_NEWS;
}

export function latestNewsAt(tick) {
  let count = null;
  newsItems().forEach(function (item) {
    if (item[0] <= tick) count = item;
  });
  return count;
}

export function stepSimulation() {
  const simulation = state.simulation;
  simulation.tick++;
  if (simulation.free) planFreePlayEvents(simulation);
  const marketChange = (marketRandom() - 0.5) * 0.005;
  // Krizdeki hisse: sektöre özgü sert düşüş; diğerleri sadece ortak piyasa gürültüsü + kendi gürültüsü
  STOCK_BASES.forEach(function (item) {
    const key = item[0];
    const crisis = stockCrisisAt(key, simulation.tick, 0);
    const sharesHeld = crisis ? Math.pow(1 - crisis.drop, 1 / crisis.len) - 1 : 0;
    simulation.p[key] = Math.max(
      1,
      simulation.p[key] * (1 + marketChange + sharesHeld + (marketRandom() - 0.5) * 0.008)
    );
    simulation.h[key].push(simulation.p[key]);
    if (simulation.h[key].length > 60) simulation.h[key].shift();
  });
  simulation.vh.push(Math.round(portfolioValue()));
}

export function portfolioValue() {
  const simulation = state.simulation;
  let cash = simulation.cash;
  for (const key in simulation.pos) cash += simulation.pos[key].q * simulation.p[key];
  return cash;
}

function findStockBase(symbol) {
  for (let i = 0; i < STOCK_BASES.length; i++) if (STOCK_BASES[i][0] === symbol) return STOCK_BASES[i];
  return null;
}

export function stockCompanyName(symbol) {
  const stockBase = findStockBase(symbol);
  return stockBase ? stockBase[1] : '';
}

export function stockFullName(symbol) {
  const stockBase = findStockBase(symbol);
  return stockBase ? stockBase[1] + ' · ' + stockBase[3] : '';
}
