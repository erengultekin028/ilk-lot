// Karar anı uyaranlarının üretimi (X/Y setleri, alıştırma), fiyat yolu ve uyaran parmak izi.

import { state } from '../viewmodels/app-state.js';
import { round2 } from '../utils/format.js';
import { STOCK_BASES } from '../constants/market-data.js';
import { hashSeed, random, randomBetween, rngState, shuffleArray } from '../utils/random.js';
import { CRISIS_HEADLINES, NORMAL_HEADLINES, SECTORS, TASK_STOCKS } from '../constants/stimulus-content.js';

function makePricePath(kind, last5, startPrice) {
  var items = [startPrice],
    i,
    base = startPrice;
  // İlk 25 gün: sakin dalgalanma
  for (i = 1; i < 25; i++) {
    base *= 1 + (random() - 0.5) * 0.022;
    items.push(base);
  }
  // Son 5 gün: istenen toplam değişim; sert düşüşte bir gün daha büyük pay alır
  var width = kind === 'kriz' ? [0.12, 0.18, 0.38, 0.2, 0.12] : [0.2, 0.2, 0.2, 0.2, 0.2];
  for (i = 0; i < 5; i++) {
    base *= Math.pow(1 + last5, width[i]) * (1 + (random() - 0.5) * (kind === 'kriz' ? 0.004 : 0.008));
    items.push(base);
  }
  return items;
}

// Her set 6 karar: 4 × (sert düşüş + zarar) [ana ölçüt, sürü × sonuç tam çapraz] + 1 × (normal + kâr) + 1 × (normal + zarar).
// Tekli hücreler iki set arasında dengelenir: X'te normal-kâr yükselir, Y'de aynı büyüklükte düşer (normal-zarar tersi).
// Her katılımcı iki seti de gördüğü için kişi içinde beklenen sonuç sıfırdır.
const PAIR_PARAMS = (function () {
  rngState.main = hashSeed('ilklot-pair');
  return { nk: round2(randomBetween(2.5, 7.5)) / 100, nz: round2(randomBetween(2.5, 7.5)) / 100 };
})();

function buildTrialSet(name) {
  rngState.main = hashSeed('ilklot-set6-' + name);
  var items = [],
    letters = (name === 'X' ? 'ABCDEF' : 'GHJKLM').split(''),
    innerShuffleArray = shuffleArray(SECTORS.slice()),
    shuffleArray2 = shuffleArray(CRISIS_HEADLINES.slice()),
    shuffleArray3 = shuffleArray(NORMAL_HEADLINES.slice()),
    key = 0,
    xValue = name === 'X';
  function add(kind, position, crowd, sign, mag, news) {
    var last5 = kind === 'kriz' ? -randomBetween(0.1, 0.16) : randomBetween(-0.03, 0.03),
      profitLossPercent =
        kind === 'kriz'
          ? -randomBetween(0.12, 0.22)
          : position === 'kar'
            ? randomBetween(0.06, 0.14)
            : -randomBetween(0.06, 0.14),
      p0 = Math.round(randomBetween(20, 300) * 100) / 100;
    items.push({
      id: name + (items.length + 1),
      set: name,
      kind: kind,
      pos: position,
      crowd: crowd ? Math.round(kind === 'kriz' ? randomBetween(62, 85) : randomBetween(35, 58)) : null,
      out: sign * mag,
      news: news,
      pl: round2(profitLossPercent * 100) / 100,
      path: makePricePath(kind, last5, p0).map(function (item) {
        return Math.round(item * 100) / 100;
      }),
      sector: innerShuffleArray[key++],
    });
  }
  var marketA = round2(randomBetween(2.5, 7.5)) / 100,
    marketB = round2(randomBetween(2.5, 7.5)) / 100;
  [
    [true, 1, marketA],
    [true, -1, marketA],
    [false, 1, marketB],
    [false, -1, marketB],
  ].forEach(function (item) {
    add('kriz', 'zarar', item[0], item[1], item[2], shuffleArray2[key % shuffleArray2.length]);
  });
  add('normal', 'kar', xValue, xValue ? 1 : -1, PAIR_PARAMS.nk, xValue ? shuffleArray3[0] : null);
  add('normal', 'zarar', !xValue, xValue ? -1 : 1, PAIR_PARAMS.nz, xValue ? null : shuffleArray3[1]);
  shuffleArray(items);
  if (items[0].kind === 'kriz') {
    var j = items.findIndex(function (item) {
      return item.kind === 'normal';
    });
    var x = items[0];
    items[0] = items[j];
    items[j] = x;
  }
  items.forEach(function (item, index) {
    item.n = index + 1;
    item.sym = TASK_STOCKS[name][index][0];
    item.sector = TASK_STOCKS[name][index][1];
  });
  return items;
}

export const TRIAL_SETS = { X: buildTrialSet('X'), Y: buildTrialSet('Y') };

// Hangi set önce: randomizasyon listesindeki "order" alanı (0: X→Y, 1: Y→X), gruplar içinde dengeli
export function currentBlockTrials() {
  var first = state.setOrder === 1 ? 'Y' : 'X';
  return state.block === 'post' ? TRIAL_SETS[first === 'X' ? 'Y' : 'X'] : TRIAL_SETS[first];
}

// Alıştırma: kayda girmez, bekleme ekranı göstermez (B grubuna müdahaleyi ele vermemek için)
function buildPracticeTrials() {
  rngState.main = hashSeed('ilklot-alistirma');
  return [
    {
      id: 'p1',
      kind: 'normal',
      pos: 'kar',
      crowd: null,
      out: 0.03,
      news: 'Şirket yeni ürününü tanıttı',
      pl: 0.08,
      path: makePricePath('normal', 0.01, 100),
      sector: 'Örnek sektör',
      sym: 'Örnek hisse 1',
      n: 1,
      practice: true,
    },
    {
      id: 'p2',
      kind: 'kriz',
      pos: 'zarar',
      crowd: 70,
      out: -0.03,
      news: 'Piyasalarda satış baskısı',
      pl: -0.12,
      path: makePricePath('kriz', -0.12, 80),
      sector: 'Örnek sektör',
      sym: 'Örnek hisse 2',
      n: 2,
      practice: true,
    },
  ];
}

export const PRACTICE_TRIALS = buildPracticeTrials();

// Uyaran parmak izi: iki cihazda aynı çıkmalı (herkes aynı 16 anı görüyor mu?)
export function stimulusFingerprint() {
  var handler = function (trials) {
    return trials.map(function (item) {
      return [item.kind, item.pos, item.crowd, item.out, item.pl, item.path[29]];
    });
  };
  return (
    'k-' + hashSeed(JSON.stringify([handler(TRIAL_SETS.X), handler(TRIAL_SETS.Y), STOCK_BASES])).toString(36)
  );
}

export function lastWeekChangePercent(trial) {
  var path = trial.path;
  return (path[path.length - 1] / path[path.length - 6] - 1) * 100;
}
