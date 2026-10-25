// Katılımcı kayıtları: oturum özeti (participants/{kod}) ve olay kaydı (participants/{kod}/events/*).
// Veri yalnızca Firebase'dedir; yerel depo ya da örnek veri yoktur.
// Politika A (soft delete): bu katmanda hiçbir silme işlemi yoktur; çekilen katılımcı "withdrawn" olarak işaretlenir.

import { getServices } from '../services/firebase-service.js';

const participantDoc = (code) => getServices().db.collection('participants').doc(code);

export const participantRepository = {
  // Katılımcının kaydını getirir; yoksa null
  async getParticipant(code) {
    const snapshot = await participantDoc(code).get();
    return snapshot.exists ? snapshot.data() : null;
  },

  // Kaydı birleştirerek yazar (var olan alanlar korunur)
  async saveParticipant(code, data) {
    await participantDoc(code).set(data, { merge: true });
  },

  // Olayları tek toplu yazmayla ekler. Belge numarası sabit olduğu için aynı olay tekrar gönderilirse üzerine yazılmaz, aynı kalır.
  async addEvents(code, events) {
    if (!events.length) return;
    const { db } = getServices();
    const batch = db.batch();
    const collection = participantDoc(code).collection('events');
    events.forEach(function (event) {
      batch.set(collection.doc(event.session + '-' + String(event.n).padStart(6, '0')), event);
    });
    await batch.commit();
  },

  // Çekilme: kayıt silinmez, işaretlenir ve analizden çıkar (ARAŞTIRMA: çekilen katılımcı CSV'ye girmez)
  async withdraw(code, group, extra) {
    const marker = { code: code, grp: group, withdrawn: true, withdrawnAt: new Date().toISOString() };
    Object.assign(marker, extra || {});
    await participantDoc(code).set(marker, { merge: true });
  },
};
