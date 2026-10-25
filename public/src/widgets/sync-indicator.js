// Başlıktaki eşzamanlama göstergesi.

import { byId } from '../utils/dom.js';
import { syncStatus } from '../services/event-log.js';

export function updateSyncIndicator() {
  var syncDotElement = byId('sync-dot');
  if (!syncDotElement) return;
  var status = syncStatus();
  syncDotElement.className = 'dosheet-title' + (status === 'is-correct' ? '' : ' ' + (status === 'pend' ? 'is-pending' : 'is-error'));
  syncDotElement.setAttribute(
    'aria-label',
    status === 'ok'
      ? 'Veriler kaydedildi'
      : status === 'pend'
        ? 'Veriler gönderiliyor'
        : 'Bağlantı yok, veriler cihazda bekliyor'
  );
  syncDotElement.title = syncDotElement.getAttribute('aria-label');
}
