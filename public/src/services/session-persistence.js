// Oturum anlık görüntüsü: kaydet, geri yükle, özetle.

import { APP_VERSION, CONFIG } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { eventLog } from './event-log.js';
import { round2 } from '../utils/format.js';
import { SELL_REASONS } from '../constants/glossary.js';
import { trackTabTime } from '../viewmodels/market-controller.js';
import { initSimulation, stepSimulation } from '../models/market-simulation.js';
import { participantRepository } from '../repositories/participant-repository.js';

// ═════════════════ ANLIK GÖRÜNTÜ VE DEVAM ═════════════════
function createSnapshot() {
  const simulation = state.simulation;

  if (typeof trackTabTime === 'function') trackTabTime();
  return {
    quick: 0,
    tabT: state.tabTimes,
    readMs: state.readingMs,
    tourSeen: state.seenTourSteps,
    comp: state.comprehension,
    helpN: state.helpOpenCount || 0,
    v: APP_VERSION,
    seed: CONFIG.seed,
    phase: state.phase,
    block: state.block,
    order: state.setOrder,
    guess: state.purposeGuess,
    sim: simulation
      ? {
          tick: simulation.tick,
          cash: simulation.cash,
          pos: simulation.pos,
          trades: simulation.trades,
          v0: simulation.v0,
        }
      : null,
    ti: state.trialIndex,
    dec: state.decisions,
    total: state.totalDecisions,
    pulses: state.pulses,
    practiced: !!state.practiceDone,
    cd: state.cooldownStats,
    ended: state.ended,
    endedAt: state.endedAt || null,
    evN: eventLog.counter,
    updatedAt: new Date().toISOString(),
  };
}
export async function saveSnapshot() {
  if (state.practice || state.freePlay || !state.participantCode) return;
  const map = {};
  map['sess_' + CONFIG.session] = createSnapshot();
  map.updatedAt = new Date().toISOString();
  map.lastVersion = APP_VERSION;
  try {
    await participantRepository.saveParticipant(state.participantCode, map);
  } catch (error) {
    state.syncError = String((error && error.message) || error);
  }
}

// Uyaranlar tohumdan sabit olduğu için sadece kararlar ve sıradaki deneme numarası geri yüklenir
// Kayıtlı anlık görüntüdeki anahtar (veri sözleşmesi, değişmez) -> durum nesnesindeki alan adı
const PERSISTED_STATE_KEYS = {
  phase: 'phase',
  block: 'block',
  ti: 'trialIndex',
  dec: 'decisions',
  total: 'totalDecisions',
  pulses: 'pulses',
  practiced: 'practiceDone',
  cd: 'cooldownStats',
  ended: 'ended',
  endedAt: 'endedAt',
  guess: 'purposeGuess',
  tourSeen: 'seenTourSteps',
  comp: 'comprehension',
  helpN: 'helpOpenCount',
  tabT: 'tabTimes',
  readMs: 'readingMs',
};
export function restoreSnapshot(snapshot) {
  Object.keys(PERSISTED_STATE_KEYS).forEach(function (key) {
    if (snapshot[key] !== undefined) state[PERSISTED_STATE_KEYS[key]] = snapshot[key];
  });
  eventLog.counter = Math.max(eventLog.counter, snapshot.evN || 0);
  // Simülatör: fiyatlar tohumdan kaydedilen güne kadar yeniden üretilir, portföy anlık görüntüden gelir
  if (snapshot.sim) {
    initSimulation();
    while (state.simulation.tick < snapshot.sim.tick) stepSimulation();
    state.simulation.cash = snapshot.sim.cash;
    state.simulation.pos = snapshot.sim.pos;
    state.simulation.trades = snapshot.sim.trades || [];
    state.marketTab = 'p';
    state.tabActiveSince = Date.now();
  }
  if (!state.tabTimes)
    state.tabTimes = {
      p: 0,
      m: 0,
      a: 0,
    };
}

// ═════════════════ GİRİŞ AKIŞI ═════════════════
// Sıradaki oturum: bitmemiş ilk oturum. Böylece tek link bütün oturumlar için yeterli
export function findNextSession(participant) {
  for (let i = 1; i <= CONFIG.totalSessions; i++) {
    const snapshot = participant['sess_' + i];
    if (!snapshot || !snapshot.ended)
      return {
        n: String(i),
        prev: participant['sess_' + (i - 1)],
      };
  }
  return null;
}
export function gapLeftMs(previousSession) {
  if (!previousSession || !previousSession.endedAt || !CONFIG.minGapHours) return 0;
  return Math.max(0, new Date(previousSession.endedAt).getTime() + CONFIG.minGapHours * 3600000 - Date.now());
}

// Katılımcı özeti: her satır bir katılımcı. pre = 1. bölüm, post = 3. bölüm (VERI_SOZLUGU.md)
export function summarizeSnapshot(code, innerGroup, session, snapshot) {
  const innerData = snapshot.dec || [];
  const cd = snapshot.cd || {
    n: 0,
    v: 0,
    g: 0,
  };
  const pulses = snapshot.pulses || {};
  const sim = snapshot.sim || {
    trades: [],
  };
  const trials = sim.trades || [];
  const bounds = function (other) {
    return innerData.filter(function (item) {
      return item.block === other;
    });
  };
  const rate = function (items, handler, group) {
    items = items.filter(handler);
    return items.length ? round2(items.filter(group).length / items.length) : '';
  };
  const isSell = function (data) {
    return data.final === 'sat';
  };
  const classNames = function (data) {
    return data.kind === 'kriz' && data.pos === 'zarar';
  };
  const med = function (items) {
    items = items
      .filter(function (item) {
        return item != null;
      })
      .sort(function (left, right) {
        return left - right;
      });
    return items.length
      ? items.length % 2
        ? items[(items.length - 1) / 2]
        : Math.round((items[items.length / 2 - 1] + items[items.length / 2]) / 2)
      : '';
  };
  const blk = function (other) {
    const items = bounds(other);
    const group = rate(
      items,
      function (data) {
        return data.kind === 'normal' && data.pos === 'kar';
      },
      isSell
    );
    const level = rate(
      items,
      function (data) {
        return data.kind === 'normal' && data.pos === 'zarar';
      },
      isSell
    );
    return [
      rate(items, classNames, isSell),
      rate(
        items,
        function (data) {
          return data.kind === 'kriz';
        },
        isSell
      ),
      group,
      level,
      group !== '' && level !== '' ? round2(group - level) : '',
      rate(
        items,
        function (data) {
          return data.kind === 'kriz';
        },
        function (data) {
          return data.final === 'al';
        }
      ),
      med(
        items
          .filter(function (item) {
            return !item.hid;
          })
          .map(function (item) {
            return item.rtFirst;
          })
      ),
    ];
  };
  const pre = blk('pre');
  const post = blk('post');
  const sells = trials.filter(function (item) {
    return item.side === 'S';
  });
  return [
    snapshot.v || '',
    code,
    innerGroup,
    snapshot.order === 1 ? 'Y→X' : 'X→Y',
    snapshot.ended ? 1 : 0,
    innerData.length,
    pre[0],
    post[0],
    pre[0] !== '' && post[0] !== '' ? round2(post[0] - pre[0]) : '',
    // ana ölçüt: panik satış oranı ve değişimi
    pre[1],
    post[1],
    pre[2],
    pre[3],
    post[2],
    post[3],
    pre[4],
    post[4],
    pre[5],
    post[5],
    pre[6],
    post[6],
    trials.length,
    sells.length,
    sells.filter(function (item) {
      return item.pl != null && item.pl <= CONFIG.lossThreshold;
    }).length,
    sells.filter(function (item) {
      return item.pl != null && item.pl <= CONFIG.lossThreshold && item.postCrisis;
    }).length,
    trials.filter(function (item) {
      return item.side === 'B';
    }).length,
    // Satış gerekçeleri: "Korktum:2|Haber yüzünden:1" biçiminde
    SELL_REASONS.map(function (innerItem) {
      const length = sells.filter(function (item) {
        return item.why === innerItem;
      }).length;
      return length ? innerItem + ':' + length : '';
    })
      .filter(Boolean)
      .join('|'),
    cd.n,
    cd.v,
    cd.g,
    Math.round(((snapshot.tabT || {}).p || 0) / 1000),
    Math.round(((snapshot.tabT || {}).m || 0) / 1000),
    Math.round(((snapshot.tabT || {}).a || 0) / 1000),
    snapshot.readMs != null ? Math.round(snapshot.readMs / 1000) : '',
    (pulses.b_pre && pulses.b_pre.v) || '',
    (pulses.b_sim && pulses.b_sim.v) || '',
    (pulses.b_post && pulses.b_post.v) || '',
    snapshot.updatedAt,
    snapshot.quick ? 1 : '',
  ];
}
