// Sayı, para, yüzde ve süre biçimlendirme; HTML kaçışlama.

export function formatNumber(value, decimals) {
  decimals = decimals == null ? 2 : decimals;
  value = Number(value);
  if (Math.abs(value) < 0.5 * Math.pow(10, -decimals)) value = 0;
  return value.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function round2(value) {
  return Math.round(value * 100) / 100;
}

function signPrefix(value) {
  return round2(value) >= 0 ? '+' : '';
}

export function directionClass(value) {
  return round2(value) >= 0 ? 'price-up' : 'price-down';
}

// Yön sadece renkle değil işaretle de gösterilir (renk körü katılımcılar için)
export function formatPercentChange(value) {
  const rounded = round2(value);
  return (rounded > 0 ? '▲ ' : rounded < 0 ? '▼ ' : '') + formatNumber(Math.abs(value)) + '%';
}

export function formatLira(value) {
  return (value < 0 ? '−' : '') + '₺' + formatNumber(Math.abs(value), 0);
}

export function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatMinutesSeconds(seconds) {
  seconds = Math.max(0, Math.round(seconds));
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}
