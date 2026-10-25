// Simülatör grafikleri: mini grafik, hisse detay grafiği, portföy seyri.

import { CONFIG, DEMO_MODE } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { formatNumber } from '../utils/format.js';
import { STOCK_BASES } from '../constants/market-data.js';
import { initSimulation, stepSimulation } from '../models/market-simulation.js';

// ───────────────── Simülatör ekranı ─────────────────
export function renderSparkline(values, isUp) {
  const width = 64;
  const height = 24;
  const min = Math.min.apply(0, values);
  const max = Math.max.apply(0, values);
  const result = max - min || 1;
  return (
    '<svg width="' +
    width +
    '" height="' +
    height +
    '" aria-hidden="true"><polyline points="' +
    values
      .map(function (item, index) {
        return (
          ((index / Math.max(1, values.length - 1)) * width).toFixed(1) +
          ',' +
          (height - 2 - ((item - min) / result) * (height - 4)).toFixed(1)
        );
      })
      .join(' ') +
    '" fill="none" stroke="' +
    (isUp ? 'var(--up)' : 'var(--dn)') +
    '" stroke-width="1.8" stroke-linejoin="round"/></svg>'
  );
}

// ── Hisse detay sayfası: büyük grafik (10/30/60 gün), ortalama alış çizgisi, pozisyon, ilgili haberler ──
export function renderDetailChart(symbol) {
  const simulation = state.simulation;
  const history = simulation.h[symbol].slice(-state.detailRangeDays);
  const position = simulation.pos[symbol];
  const avg = position && position.q > 0 ? position.avg : null;
  const vals = avg ? history.concat([avg]) : history;
  const min = Math.min.apply(0, vals);
  const max = Math.max.apply(0, vals);
  const range = max - min || 1;
  const width = 320;
  const height = 150;
  const padding = 10;
  const length = history.length;
  const isUp = history[history.length - 1] >= history[0];
  const color = isUp ? 'var(--up)' : 'var(--dn)';
  const yValue = function (value) {
    return padding + (height - 2 * padding) * (1 - (value - min) / range);
  };
  const point = history
    .map(function (item, index) {
      return (length > 1 ? (index / (length - 1)) * width : 0).toFixed(1) + ',' + yValue(item).toFixed(1);
    })
    .join(' ');
  let html =
    '<svg viewBox="0 0 ' +
    width +
    ' ' +
    (height + 14) +
    '" width="100%" role="img" aria-label="' +
    symbol +
    ' son ' +
    length +
    ' günlük fiyat grafiği"><polygon points="0,' +
    height +
    ' ' +
    point +
    ' ' +
    width +
    ',' +
    height +
    '" fill="' +
    color +
    '" opacity=".1"/><polyline points="' +
    point +
    '" fill="none" stroke="' +
    color +
    '" stroke-width="2.2" stroke-linejoin="round"/>';
  if (avg)
    html +=
      '<line x1="0" x2="' +
      width +
      '" y1="' +
      yValue(avg).toFixed(1) +
      '" y2="' +
      yValue(avg).toFixed(1) +
      '" stroke="var(--ac)" stroke-dasharray="4 4" stroke-width="1.4"/><text x="4" y="' +
      (yValue(avg) - 5).toFixed(1) +
      '" font-size="10" font-weight="700" fill="var(--act)" stroke="var(--sf)" stroke-width="3" paint-order="stroke">ortalama alışın ₺' +
      formatNumber(avg) +
      '</text>';
  // Parmakla gezme: S.scrubDay mutlak gün numarasıdır (piyasa akarken işaret aynı güne sabit kalır; pencerenin dışına çıkarsa kaybolur)
  const stockIndex = state.scrubDay != null ? length - 1 - (simulation.tick - state.scrubDay) : -1;
  if (stockIndex >= 0 && stockIndex < length) {
    const startX = length > 1 ? (stockIndex / (length - 1)) * width : 0;
    const startY = yValue(history[stockIndex]);
    const label = 'Gün ' + state.scrubDay + ' · ₺' + formatNumber(history[stockIndex]);
    const analysis = startX < width * 0.28 ? 'start' : startX > width * 0.72 ? 'end' : 'middle';
    html +=
      '<line x1="' +
      startX.toFixed(1) +
      '" x2="' +
      startX.toFixed(1) +
      '" y1="' +
      padding +
      '" y2="' +
      height +
      '" stroke="var(--mu)" stroke-width="1" stroke-dasharray="3 3"/><circle cx="' +
      startX.toFixed(1) +
      '" cy="' +
      startY.toFixed(1) +
      '" r="4.5" fill="' +
      color +
      '" stroke="var(--sf)" stroke-width="2"/><text id="scrub-label" x="' +
      Math.min(width - 2, Math.max(2, startX)).toFixed(1) +
      '" y="11" font-size="11" font-weight="700" text-anchor="' +
      analysis +
      '" fill="var(--tx)" stroke="var(--sf)" stroke-width="3" paint-order="stroke">' +
      label +
      '</text>';
  }
  return (
    html +
    '<text x="2" y="' +
    (height + 12) +
    '" font-size="9.5" fill="var(--mu)">' +
    length +
    ' gün önce</text><text x="' +
    width +
    '" y="' +
    (height + 12) +
    '" font-size="9.5" text-anchor="end" fill="var(--mu)">bugün · en düşük ₺' +
    formatNumber(Math.min.apply(0, history)) +
    ', en yüksek ₺' +
    formatNumber(Math.max.apply(0, history)) +
    '</text></svg>'
  );
}

// Portföy değerinin gün gün seyri: fiyatlar tohumdan, portföy işlemlerden yeniden kurulur (devam edilen oturumda S.sim.vh güvenilir değil).
// Yalnızca simülatör bitmişken çağrılır (simInit sayacı sıfırlar). Sonuç S.simSer içinde saklanır.
export function simulationSeries() {
  if (state.simulationSeriesCache) return state.simulationSeriesCache;
  const keep = state.simulation;
  if (DEMO_MODE || !keep || keep.tick < CONFIG.simTicks) return null;
  const simTicks = CONFIG.simTicks;
  const trades = keep.trades
    .map(function (item, index) {
      return [item, index];
    })
    .sort(function (left, right) {
      return left[0].t - right[0].t || left[1] - right[1];
    })
    .map(function (item) {
      return item[0];
    });
  initSimulation();
  const simulation = state.simulation;
  const map = {};
  const items = [];
  let ti = 0;
  let cash = simulation.cash;
  STOCK_BASES.forEach(function (item) {
    map[item[0]] = simulation.pos[item[0]].q;
  });
  function applied(value) {
    while (ti < trades.length && trades[ti].t <= value) {
      const result = trades[ti++];
      const price = simulation.p[result.sym];
      if (result.side === 'S') {
        cash += result.q * price;
        map[result.sym] -= result.q;
      } else {
        cash = Math.max(0, cash - result.q * price);
        map[result.sym] += result.q;
      }
    }
  }
  function innerValue() {
    let x = cash;
    for (const key in map) x += map[key] * simulation.p[key];
    return x;
  }
  applied(0);
  items.push(innerValue());
  for (let value2 = 1; value2 <= simTicks; value2++) {
    stepSimulation();
    applied(value2);
    items.push(innerValue());
  }
  state.simulation = keep;
  return (state.simulationSeriesCache = {
    v: items,
    v0: keep.v0,
    tr: trades.map(function (item) {
      return { t: item.t, side: item.side };
    }),
  });
}

export function simulationChartGeometry(width, height, left, right, top, bottom) {
  const series = simulationSeries();
  const simTicks = CONFIG.simTicks;
  let min = Math.min.apply(0, series.v.concat([series.v0]));
  let max = Math.max.apply(0, series.v.concat([series.v0]));
  const padding = (max - min) * 0.08 || 1;
  min -= padding;
  max += padding;
  return {
    d: series,
    X: function (value) {
      return left + ((width - left - right) * value) / simTicks;
    },
    Y: function (x) {
      return top + (height - top - bottom) * (1 - (x - min) / (max - min));
    },
  };
}

export function simulationChartSvg() {
  if (!simulationSeries()) return '';
  const width = 340;
  const height = 150;
  const innerSimulationChartGeometry = simulationChartGeometry(width, height, 8, 8, 10, 22);
  const data = innerSimulationChartGeometry.d;
  const simTicks = CONFIG.simTicks;
  const length = data.tr.filter(function (item) {
    return item.side === 'S';
  }).length;
  const buyCount = data.tr.length - length;
  let html =
    '<svg viewBox="0 0 ' +
    width +
    ' ' +
    height +
    '" width="100%" role="img" aria-label="Simülatörde toplam paranın gün gün seyri. ' +
    length +
    ' satış ve ' +
    buyCount +
    ' alış noktası işaretli." style="display:block">';
  CONFIG.simCrises.forEach(function (item) {
    html +=
      '<rect x="' +
      innerSimulationChartGeometry.X(item.at).toFixed(1) +
      '" y="10" width="' +
      (innerSimulationChartGeometry.X(item.at + item.len) - innerSimulationChartGeometry.X(item.at)).toFixed(
        1
      ) +
      '" height="' +
      (height - 32) +
      '" fill="var(--sf2)"/>';
  });
  html +=
    '<line x1="8" x2="' +
    (width - 8) +
    '" y1="' +
    innerSimulationChartGeometry.Y(data.v0).toFixed(1) +
    '" y2="' +
    innerSimulationChartGeometry.Y(data.v0).toFixed(1) +
    '" stroke="var(--mu)" stroke-width="1" stroke-dasharray="4 4"/>';
  html +=
    '<polyline fill="none" stroke="var(--tx)" stroke-width="2" stroke-linejoin="round" points="' +
    data.v
      .map(function (item, index) {
        return (
          innerSimulationChartGeometry.X(index).toFixed(1) +
          ',' +
          innerSimulationChartGeometry.Y(item).toFixed(1)
        );
      })
      .join(' ') +
    '"/>';
  data.tr.forEach(function (item) {
    const centerX = innerSimulationChartGeometry.X(item.t).toFixed(1);
    const centerY = innerSimulationChartGeometry.Y(data.v[item.t]).toFixed(1);
    html +=
      item.side === 'S'
        ? '<circle cx="' +
          centerX +
          '" cy="' +
          centerY +
          '" r="4.5" fill="var(--tx)" stroke="var(--sf)" stroke-width="1.5"/>'
        : '<circle cx="' +
          centerX +
          '" cy="' +
          centerY +
          '" r="4.5" fill="var(--sf)" stroke="var(--tx)" stroke-width="2"/>';
  });
  html +=
    '<text x="8" y="' +
    (height - 6) +
    '" font-size="11" fill="var(--mu)">Gün 0</text><text x="' +
    (width - 8) +
    '" y="' +
    (height - 6) +
    '" font-size="11" text-anchor="end" fill="var(--mu)">Gün ' +
    simTicks +
    '</text><text x="' +
    (width - 8) +
    '" y="' +
    (innerSimulationChartGeometry.Y(data.v0) - 4).toFixed(1) +
    '" font-size="11" text-anchor="end" fill="var(--mu)">başlangıç</text></svg>';
  return html;
}
