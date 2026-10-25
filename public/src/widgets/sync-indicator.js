// Başlıktaki eşzamanlama göstergesi.

import { byId } from '../utils/dom.js';
import { syncStatus } from '../services/event-log.js';

export function updateSyncIndicator() {
  const syncDotElement = byId('sync-dot');
  if (!syncDotElement) return;
  const status = syncStatus();
  syncDotElement.className =
    'dot' + (status === 'ok' ? '' : ' ' + (status === 'pend' ? 'is-pending' : 'is-offline'));
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
