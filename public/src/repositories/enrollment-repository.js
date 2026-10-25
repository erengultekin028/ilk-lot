// Katılım ve grup ataması: katılımcı kodla girmez; anonim kullanıcı ilk girişte sıradaki boş "yuvayı" alır.
// ARAŞTIRMA: Yuvalar araştırmacının önceden ürettiği 4'lük bloklu listeden gelir (her blokta 2 A + 2 B). Katılımcı grubunu seçemez:
// sırayı Firestore işlemi (transaction) belirler, aynı yuvayı iki kişi alamaz.
//
// Veri modeli (ayrıntı: firebase/firestore.rules):
//   meta/counter      { next: 7 }                     sıradaki boş yuva numarası
//   slots/{no}        { code }                        yuva numarası -> katılım kodu (grup bilgisi YOK)
//   allocations/{kod} { grp, order, no, block }       kodun grubu (yalnızca kodun sahibi ve araştırmacı okuyabilir)
//   claims/{kod}      { uid, slot, at }               yuvayı alan kullanıcı (bir kez yazılır, değişmez)
//   users/{uid}       { code, slot, at }              kullanıcının kodu (bir kez yazılır, değişmez)

import { getServices } from '../services/firebase-service.js';

export const enrollmentRepository = {
  // Bu kullanıcı daha önce yuva almış mı? Aldıysa { code, slot } döner; yoksa null
  async findEnrollment(uid) {
    const snapshot = await getServices().db.collection('users').doc(uid).get();
    return snapshot.exists ? snapshot.data() : null;
  },

  // Sıradaki boş yuvayı alır ve { code, slot } döndürür. İşlem tekrar denendiğinde aynı sonucu verir (idempotent).
  async enroll(uid) {
    const { db } = getServices();
    const counterRef = db.collection('meta').doc('counter');
    const userRef = db.collection('users').doc(uid);
    return db.runTransaction(async function (transaction) {
      const existing = await transaction.get(userRef);
      if (existing.exists) return existing.data();
      const counter = await transaction.get(counterRef);
      if (!counter.exists)
        throw new Error('Katılım listesi henüz hazır değil. Araştırmacıyla iletişime geç.');
      const slotNumber = counter.data().next;
      const slot = await transaction.get(db.collection('slots').doc(String(slotNumber)));
      if (!slot.exists) throw new Error('Tüm katılım yuvaları dolu. Araştırmacıyla iletişime geç.');
      const code = slot.data().code;
      const record = { code: code, slot: slotNumber, at: new Date().toISOString() };
      transaction.set(db.collection('claims').doc(code), { uid: uid, slot: slotNumber, at: record.at });
      transaction.set(userRef, record);
      transaction.update(counterRef, { next: slotNumber + 1 });
      return record;
    });
  },

  // Kodun grubunu ve set sırasını getirir (yalnızca kodun sahibi okuyabilir)
  async getAllocation(code) {
    const snapshot = await getServices().db.collection('allocations').doc(code).get();
    return snapshot.exists ? snapshot.data() : null;
  },
};
