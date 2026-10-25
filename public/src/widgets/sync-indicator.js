// Başlıktaki eşzamanlama göstergesi.

import { byId } from '../utils/dom.js';
import { syncStatus } from '../services/event-log.js';

export function updateSyncIndicator() {
  const syncDotElement = byId('sync-dot');
  if (!syncDotElement) return;
  const status = syncStatus();
  syncDotElement.className =
    'dot' + (status === 'is-correct' ? '' : ' ' + (status === 'pend' ? 'is-pending' : 'is-error'));
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
