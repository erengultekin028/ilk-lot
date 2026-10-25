// Yönetim paneli veri katmanı: randomizasyon listesi, katılımcılar, olaylar, sistem testi.
// GÜVENLİK: Bu işlemlerin hepsi yalnızca araştırmacı hesabına açıktır; yetki Firestore kurallarında denetlenir.
// Politika A (soft delete): hiçbir silme işlemi yoktur.

import { getServices } from '../services/firebase-service.js';
import { eventLog } from '../services/event-log.js';

const BATCH_LIMIT = 400; // Firestore bir toplu yazmada en çok 500 işleme izin verir

async function readAll(collection) {
  const snapshot = await collection.get();
  const items = [];
  snapshot.forEach(function (doc) {
    items.push({ id: doc.id, data: doc.data() });
  });
  return items;
}

export const adminRepository = {
  // Randomizasyon listesi: { kod: { grp, order, no, block } }
  async listAllocations() {
    const map = {};
    (await readAll(getServices().db.collection('allocations'))).forEach(function (item) {
      map[item.id] = item.data;
    });
    return map;
  },

  // Yuvayı alan katılımcı sayısı (claims) ve sıradaki boş yuva numarası
  async getEnrollmentProgress() {
    const { db } = getServices();
    const [claims, counter] = await Promise.all([
      readAll(db.collection('claims')),
      db.collection('meta').doc('counter').get(),
    ]);
    return { claimed: claims.length, next: counter.exists ? counter.data().next : null };
  },

  // Yeni randomizasyon listesini yazar: allocations/{kod} (grup), slots/{no} (sıra -> kod) ve gerekirse meta/counter.
  // Var olan kodlar ve grupları değişmez (yalnızca yeni kodlar eklenir).
  async createAllocationList(allocationList) {
    const { db } = getServices();
    const codes = Object.keys(allocationList);
    const perBatch = Math.floor(BATCH_LIMIT / 2); // her kod iki belge yazar
    for (let start = 0; start < codes.length; start += perBatch) {
      const batch = db.batch();
      codes.slice(start, start + perBatch).forEach(function (code) {
        batch.set(db.collection('allocations').doc(code), allocationList[code]);
        batch.set(db.collection('slots').doc(String(allocationList[code].no)), { code: code });
      });
      await batch.commit();
    }
    const counterRef = db.collection('meta').doc('counter');
    if (!(await counterRef.get()).exists) await counterRef.set({ next: 1 });
  },

  // Tüm katılımcı kayıtları (çekilenler dahil; dışa aktarmada süzülür)
  async listParticipants() {
    return (await readAll(getServices().db.collection('participants'))).map(function (item) {
      return item.data;
    });
  },

  // Katılımcı kayıtlarını alan güncellemeleriyle yazar (silme yok): updates = [{ code, fields }]
  async updateParticipants(updates) {
    const { db } = getServices();
    for (let start = 0; start < updates.length; start += BATCH_LIMIT) {
      const batch = db.batch();
      updates.slice(start, start + BATCH_LIMIT).forEach(function (item) {
        batch.update(db.collection('participants').doc(item.code), item.fields);
      });
      await batch.commit();
    }
  },

  // Bir katılımcının olay kayıtları
  async listEvents(code) {
    const collection = getServices().db.collection('participants').doc(code).collection('events');
    return (await readAll(collection)).map(function (item) {
      return item.data;
    });
  },

  // Sistem testi: bağlantı, kimlik, yazma yetkisi, olay kuyruğu. Sonuç: [{ ad, ok (true/false/null=bilgi), d }]
  async selfTest(adminEmail) {
    const results = [];
    const pass = (name, detail) => results.push({ ad: name, ok: true, d: detail || '' });
    const fail = (name, detail) => results.push({ ad: name, ok: false, d: detail || '' });
    const info = (name, detail) => results.push({ ad: name, ok: null, d: detail || '' });
    try {
      localStorage.setItem('ilklot:_st', '1');
      const value = localStorage.getItem('ilklot:_st');
      localStorage.removeItem('ilklot:_st');
      value === '1'
        ? pass('Tarayıcı deposu', 'yazma ve okuma çalışıyor')
        : fail('Tarayıcı deposu', 'yazılan değer okunamadı');
    } catch (error) {
      fail('Tarayıcı deposu', 'erişim hatası');
    }
    pass('Kayıt yeri', 'Firebase (bulut)');
    const { db } = getServices();
    const startedAt = Date.now();
    try {
      await db.collection('meta').doc('counter').get();
      pass('Firestore okuma', 'erişildi (' + (Date.now() - startedAt) + ' ms)');
    } catch (error) {
      fail('Firestore okuma', (error && error.code) || String(error));
    }
    try {
      const reference = db.collection('selftest').doc('yazma');
      await reference.set({ t: Date.now(), by: adminEmail || null });
      const reader = await reference.get();
      reader.exists
        ? pass('Firestore yazma (araştırmacı)', 'yazma ve okuma başarılı')
        : fail('Firestore yazma', 'yazılan kayıt okunamadı');
    } catch (error) {
      fail('Firestore yazma (araştırmacı)', (error && error.code) || String(error));
    }
    info('Olay kuyruğu', eventLog.queue.length + ' gönderilmemiş olay');
    return results;
  },
};
