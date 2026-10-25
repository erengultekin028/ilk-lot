// Karar anı fiyat grafiği.

import { escapeHtml } from '../utils/format.js';
import { lastWeekChangePercent } from '../models/trial-generator.js';

// Son 30 işlem günü: alan grafiği. Renk son haftanın yönüne göre
export function renderTrialChart(trial) {
  const path = trial.path;
  const min = Math.min.apply(0, path);
  const max = Math.max.apply(0, path);
  const range = max - min || 1;
  const width = 320;
  const height = 96;
  const padding = 8;
  const point = path.map(function (item, index) {
    return [
      (index / (path.length - 1)) * width,
      padding + (height - 2 * padding) * (1 - (item - min) / range),
    ];
  });
  const isUp = lastWeekChangePercent(trial) >= 0;
  const color = isUp ? 'var(--up)' : 'var(--dn)';
  const line = point
    .map(function (item) {
      return item[0].toFixed(1) + ',' + item[1].toFixed(1);
    })
    .join(' ');
  return (
    '<svg viewBox="0 0 ' +
    width +
    ' ' +
    (height + 12) +
    '" width="100%" role="img" aria-label="' +
    escapeHtml(trial.sym) +
    ' son 30 işlem günü fiyat grafiği"><rect x="' +
    ((width * 25) / 29 - 4).toFixed(1) +
    '" y="0" width="' +
    ((width * 4) / 29 + 8).toFixed(1) +
    '" height="' +
    height +
    '" fill="var(--sf2)" rx="4"/><polygon points="0,' +
    height +
    ' ' +
    line +
    ' ' +
    width +
    ',' +
    height +
    '" fill="' +
    color +
    '" opacity=".12"/><polyline points="' +
    line +
    '" fill="none" stroke="' +
    color +
    '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><text x="2" y="' +
    (height + 11) +
    '" font-size="9" fill="var(--mu)">30 gün önce</text><text x="' +
    width +
    '" y="' +
    (height + 11) +
    '" font-size="9" text-anchor="end" fill="var(--mu)">bugün · gri alan: son hafta</text></svg>'
  );
}
