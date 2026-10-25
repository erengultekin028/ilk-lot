// Yönetim paneli: "Test kayıtları" bölümü (denemelerden kalan kayıtları analizden ayırma).

import { adminState } from './admin-state.js';
import { RECORD_FILTERS, buildNumber, filterRecords } from './test-records.js';
import { APP_VERSION } from '../constants/app-config.js';
import { escapeHtml } from '../utils/format.js';
import { section } from '../widgets/section.js';

const MAX_VISIBLE_ROWS = 200;

export function currentBuildNumber() {
  return buildNumber(APP_VERSION);
}

function shortVersion(version) {
  const match = /-b(\d+)$/.exec(version || '');
  return match ? 'b' + match[1] : version || '—';
}

function shortTime(value) {
  return value ? String(value).slice(0, 16).replace('T', ' ') : '—';
}

function statusText(row) {
  if (row.marked) return 'Test kaydı';
  if (row.withdrawn) return 'Çekildi';
  if (row.ended) return 'Bitti';
  return row.started ? 'Yarıda' : 'Başlamadı';
}

function recordRowHtml(row) {
  const isOld = row.build < currentBuildNumber();
  return (
    '<label class="record-row"><input type="checkbox" data-in="recordCheck" data-code="' +
    escapeHtml(row.code) +
    '"' +
    (adminState.selectedRecords[row.code] ? ' checked' : '') +
    ' aria-label="' +
    escapeHtml(row.code) +
    ' seç"><span class="record-code">' +
    escapeHtml(row.code) +
    '</span><span>' +
    escapeHtml(row.grp) +
    '</span><span>' +
    (row.slot == null ? '—' : row.slot) +
    '</span><span class="' +
    (isOld ? 'record-flag' : '') +
    '">' +
    escapeHtml(shortVersion(row.version)) +
    '</span><span>' +
    statusText(row) +
    '</span><span class="' +
    (row.cooldownShown ? 'record-flag' : '') +
    '">' +
    row.cooldownShown +
    '</span><span>' +
    shortTime(row.updatedAt) +
    '</span></label>'
  );
}

export function selectedRecordCount() {
  return Object.keys(adminState.selectedRecords).length;
}

export function renderTestRecordsSection() {
  const intro =
    '<p class="muted small-text" style="margin:0 0 10px">Denemelerden kalan kayıtları analizden ve dışa aktarmadan çıkarır. Kayıt <b>silinmez</b>: ' +
    '"çekilmiş" gibi işaretlenir ve "test kaydı" olarak not edilir; işaret geri alınabilir. Hangi kaydın deneme olduğunu sürüm, durum, yuva ve son harekete bakarak ayırt et. Kırmızı sürüm, şu anki uygulamadan eski demektir; kırmızı bekleme sayısı, A grubunda bekleme ekranı gösterildiğini belirtir.</p>';
  if (!adminState.recordRows)
    return section(
      'Test kayıtları',
      intro +
        '<button class="button" data-a="loadTestRecords"' +
        (adminState.recordBusy ? ' disabled' : '') +
        '>' +
        (adminState.recordBusy ? 'Yükleniyor…' : 'Kayıtları yükle') +
        '</button>'
    );
  const rows = adminState.recordRows;
  const build = currentBuildNumber();
  const visible = filterRecords(rows, adminState.recordFilter, build);
  const chips = RECORD_FILTERS.map(function (item) {
    const count = filterRecords(rows, item[0], build).length;
    return (
      '<button class="chip' +
      (adminState.recordFilter === item[0] ? ' is-active' : '') +
      '" aria-pressed="' +
      (adminState.recordFilter === item[0]) +
      '" data-a="setRecordFilter" data-v="' +
      item[0] +
      '">' +
      item[1] +
      ' (' +
      count +
      ')</button>'
    );
  }).join('');
  const isMarkedView = adminState.recordFilter === 'marked';
  return section(
    'Test kayıtları',
    intro +
      '<div class="font-size-selector" role="group" aria-label="Süzgeç" style="margin:0 0 10px">' +
      chips +
      '</div>' +
      '<div class="record-head"><span></span><span>Kod</span><span>Grup</span><span>Yuva</span><span>Sürüm</span><span>Durum</span><span>Bekleme</span><span>Son hareket</span></div>' +
      '<div class="record-list">' +
      (visible.length
        ? visible.slice(0, MAX_VISIBLE_ROWS).map(recordRowHtml).join('')
        : '<p class="muted small-text" style="margin:12px 8px">Bu süzgece uyan kayıt yok.</p>') +
      '</div>' +
      (visible.length > MAX_VISIBLE_ROWS
        ? '<p class="muted small-text" style="margin:6px 0 0">İlk ' +
          MAX_VISIBLE_ROWS +
          ' kayıt gösteriliyor; "Süzgeçtekilerin hepsini seç" ' +
          visible.length +
          ' kaydın hepsini seçer.</p>'
        : '') +
      '<div class="record-actions"><span class="muted small-text">Seçili: <b id="record-selected-count">' +
      selectedRecordCount() +
      '</b> / ' +
      visible.length +
      '</span><button class="button small-text" data-a="selectFilteredRecords">Süzgeçtekilerin hepsini seç</button>' +
      '<button class="button small-text" data-a="clearRecordSelection">Seçimi temizle</button>' +
      (isMarkedView
        ? '<button class="button is-primary small-text" data-a="unmarkSelectedRecords">İşareti geri al</button>'
        : '<button class="button is-primary small-text" data-a="markSelectedRecords">Test kaydı olarak işaretle</button>') +
      '<button class="button small-text" data-a="loadTestRecords">Yenile</button></div>'
  );
}
