// Olay kaydı kuyruğu, gönderim ve eşzamanlama durumu.

import { APP_VERSION, CONFIG } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { participantRepository } from '../repositories/participant-repository.js';
import { updateSyncIndicator } from '../widgets/sync-indicator.js';
import { showToast } from '../widgets/toast.js';

// ═════════════════ OLAY KAYDI ═════════════════
// Her anlamlı eylem zaman damgası + deneme numarasıyla kaydedilir. Analiz bu ham veriden yapılır.
export const eventLog = {
  queue: [],
  counter: 0,
  flushing: false,
};

// Alıştırma simülatöründe (S.prac) yalnızca tur olayları kaydedilir
export function logEvent(type, data) {
  if (!state.participantCode || state.isReplay || state.freePlay) return;
  if (state.practice && type.indexOf('tour_') !== 0) return;
  eventLog.counter++;
  // Sayaç anlık görüntüden bağımsız saklanır: uygulama sert kapanırsa (ör. işletim sistemi sekmeyi öldürürse) yeniden açılışta aynı olay numaraları kullanılmasın
  try {
    localStorage.setItem('ilklot:evn:' + state.participantCode, String(eventLog.counter));
  } catch (error) {}
  eventLog.queue.push({
    v: APP_VERSION,
    code: state.participantCode,
    grp: state.group,
    session: CONFIG.session,
    n: eventLog.counter,
    ts: new Date().toISOString(),
    ti: state.trialIndex,
    type: type,
    data: data || {},
  });
  persistEventQueue();
}

// ── Kayıt durumu ──
// ok: tüm olaylar gönderildi · pend: gönderilmeyi bekleyen olay var · err: bağlantı yok ya da gönderim hatası
export function syncStatus() {
  if (state.syncError || !navigator.onLine) return 'err';
  return eventLog.queue.length ? 'pend' : 'ok';
}
addEventListener('online', function () {
  state.syncError = null;
  showToast('Bağlantı geri geldi, veriler gönderiliyor.');
  flushEvents();
});
addEventListener('offline', function () {
  showToast('Bağlantı koptu. İşlemlerin cihazda bekliyor, bağlantı gelince gönderilecek.');
  updateSyncIndicator();
});
function persistEventQueue() {
  try {
    localStorage.setItem('ilklot:q:' + state.participantCode, JSON.stringify(eventLog.queue));
  } catch (error) {}
}
export async function flushEvents() {
  if (eventLog.flushing || !eventLog.queue.length || !state.participantCode) return;
  eventLog.flushing = true;
  const batch = eventLog.queue.slice(0, 400);
  try {
    await participantRepository.addEvents(state.participantCode, batch);
    eventLog.queue = eventLog.queue.slice(batch.length);
    persistEventQueue();
    state.syncError = null;
  } catch (error) {
    state.syncError = String((error && error.message) || error);
  } // Gönderilemeyen olaylar kuyrukta kalır, sonra tekrar denenir
  eventLog.flushing = false;
  updateSyncIndicator();
}
