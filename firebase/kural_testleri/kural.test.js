// Firestore güvenlik kuralları testleri (firebase/firestore.rules).
// Firebase Emulator (kendi bilgisayarında çalışan sahte Firestore) üzerinde, gerçek projeye dokunmadan çalışır.
// Çalıştırma: firebase/kural_testleri klasöründe `npm test` (Node.js ve Java gerekir).
// Kurallar dosyadan okunur; örnek araştırmacı e-postası test e-postasıyla değiştirilir, böylece gerçek e-postadan bağımsızdır.
// Politika A (soft delete): kimse hiçbir şeyi silemez. Bu da burada denenir.
const { test, before, after, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, setLogLevel } = require('firebase/firestore');

setLogLevel('silent');

const ADMIN_EPOSTA = 'admin@test.local';
const KODLAR = { AAAA: 'A', BBBB: 'B', EEEE: 'A' }; // EEEE: listede var, henüz katılımcı kaydı yok (ilk kayıt açma denemesi için)
let env;

before(async () => {
  let kurallar = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const ornek = kurallar.match(/in \['([^']+)'\]/);
  if (!ornek) throw new Error('kurallarda araştırmacı e-posta listesi bulunamadı');
  kurallar = kurallar.replace(ornek[1], ADMIN_EPOSTA);
  env = await initializeTestEnvironment({ projectId: 'demo-ilklot', firestore: { rules: kurallar, host: '127.0.0.1', port: 8080 } });
});
after(async () => { await env.cleanup(); });

// Her testten önce: randomizasyon listesi (iki kod) ve BBBB için çekilmiş bir katılımcı kaydı
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [kod, grp] of Object.entries(KODLAR)) await setDoc(doc(db, 'allocations', kod), { grp, no: 1 });
    await setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'A' });
    await setDoc(doc(db, 'participants', 'AAAA', 'events', 'e1'), { type: 'x', n: 1 });
    await setDoc(doc(db, 'participants', 'BBBB'), { code: 'BBBB', grp: 'B', withdrawn: true, withdrawnAt: '2026-01-01' });
  });
});

const anonim = (uid = 'k1') => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const admin = () => env.authenticatedContext('adm', { email: ADMIN_EPOSTA }).firestore();
const digerAdmin = () => env.authenticatedContext('x', { email: 'baska@test.local' }).firestore();
const girissiz = () => env.unauthenticatedContext().firestore();

// ── 1. Giriş yapmamış kimse hiçbir şey okuyamaz ya da yazamaz ──
test('giriş yapmamış: okuma ve yazma hepsi reddedilir', async () => {
  const db = girissiz();
  await assertFails(getDoc(doc(db, 'allocations', 'AAAA')));
  await assertFails(getDoc(doc(db, 'participants', 'AAAA')));
  await assertFails(getDocs(collection(db, 'participants')));
  await assertFails(getDocs(collection(db, 'participants', 'AAAA', 'events')));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'A' }));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e2'), { type: 'y' }));
  await assertFails(setDoc(doc(db, 'selftest', 'yazma'), { t: 1 }));
});

// ── 2. Katılımcı yalnız kendi kodunu getirir, listeyi göremez ──
test('katılımcı: kendi kodunu getirebilir; kod listesini ve katılımcı listesini göremez', async () => {
  const db = anonim();
  await assertSucceeds(getDoc(doc(db, 'allocations', 'AAAA')));
  await assertSucceeds(getDoc(doc(db, 'participants', 'AAAA')));
  await assertFails(getDocs(collection(db, 'allocations')));
  await assertFails(getDocs(collection(db, 'participants')));
});

test('katılımcı: randomizasyon listesine hiçbir şey yazamaz; listede olmayan kodla kayıt açamaz', async () => {
  const db = anonim();
  await assertFails(setDoc(doc(db, 'allocations', 'CCCC'), { grp: 'A', no: 9 }));
  await assertFails(updateDoc(doc(db, 'allocations', 'AAAA'), { grp: 'B' }));
  await assertFails(setDoc(doc(db, 'participants', 'CCCC'), { code: 'CCCC', grp: 'A' }));
  await assertFails(setDoc(doc(db, 'participants', 'CCCC', 'events', 'e1'), { type: 'x' }));
});

// ── 3. Grup değiştirilemez ──
test('katılımcı: doğru grupla kayıt açar, yanlış grup yazamaz, grubunu sonradan değiştiremez', async () => {
  const db = anonim();
  // İlk kayıt açma (create): yanlış grup reddedilir, doğru grup kabul edilir
  await assertFails(setDoc(doc(db, 'participants', 'EEEE'), { code: 'EEEE', grp: 'B' }));
  await assertFails(setDoc(doc(db, 'participants', 'EEEE'), { code: 'EEEE' }));
  await assertSucceeds(setDoc(doc(db, 'participants', 'EEEE'), { code: 'EEEE', grp: 'A' }));
  // Var olan kaydı güncelleme (update)
  await assertFails(setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'B' })); // A kodu B yazamaz
  await assertSucceeds(setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'A', pre: 100 }));
  await assertSucceeds(updateDoc(doc(db, 'participants', 'AAAA'), { pre: 50 }));
  await assertFails(updateDoc(doc(db, 'participants', 'AAAA'), { grp: 'B' }));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA' })); // grup alanı olmayan yazım
});

// ── 4. Olay kaydı değiştirilemez, silinemez ──
test('olay kaydı: eklenir; içeriği değiştirilemez; birebir aynı veri yeniden yazılabilir', async () => {
  const db = anonim();
  await assertSucceeds(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e2'), { type: 'y', n: 2 }));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e1'), { type: 'x', n: 999 }));
  await assertFails(updateDoc(doc(db, 'participants', 'AAAA', 'events', 'e1'), { n: 2 }));
  await assertSucceeds(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e1'), { type: 'x', n: 1 })); // bağlantı kopması sonrası tekrar gönderim
  await assertFails(updateDoc(doc(admin(), 'participants', 'AAAA', 'events', 'e1'), { n: 5 })); // araştırmacı da değiştiremez
});

// ── 5. Çekilmiş kayıt katılımcı tarafından geri açılamaz ──
test('çekilmiş kayıt: katılımcı geri açamaz; araştırmacı güncelleyebilir', async () => {
  await assertFails(setDoc(doc(anonim(), 'participants', 'BBBB'), { code: 'BBBB', grp: 'B', withdrawn: false }));
  await assertFails(updateDoc(doc(anonim(), 'participants', 'BBBB'), { withdrawn: false }));
  await assertFails(updateDoc(doc(anonim(), 'participants', 'BBBB'), { pre: 1 }));
  await assertSucceeds(updateDoc(doc(admin(), 'participants', 'BBBB'), { note: 'inceleme' }));
});

test('çekilme: katılımcı kendi kaydını çekildi olarak işaretleyebilir (soft delete)', async () => {
  await assertSucceeds(setDoc(doc(anonim(), 'participants', 'AAAA'), { code: 'AAAA', grp: 'A', withdrawn: true, withdrawnAt: '2026-10-22' }, { merge: true }));
});

// ── 6. Yalnızca araştırmacı listeler / olayları okur ──
test('araştırmacı: katılımcıları, kod listesini ve olayları listeler; diğer e-postalar ve katılımcılar listeleyemez', async () => {
  await assertSucceeds(getDocs(collection(admin(), 'participants')));
  await assertSucceeds(getDocs(collection(admin(), 'allocations')));
  await assertSucceeds(getDocs(collection(admin(), 'participants', 'AAAA', 'events')));
  await assertSucceeds(getDoc(doc(admin(), 'participants', 'AAAA', 'events', 'e1')));
  await assertFails(getDocs(collection(digerAdmin(), 'participants')));
  await assertFails(getDocs(collection(digerAdmin(), 'allocations')));
  await assertFails(getDocs(collection(anonim(), 'participants', 'AAAA', 'events')));
  await assertFails(getDoc(doc(anonim(), 'participants', 'AAAA', 'events', 'e1')));
});

test('araştırmacı: yeni kod ekleyebilir ve sistem testini yazabilir', async () => {
  await assertSucceeds(setDoc(doc(admin(), 'allocations', 'DDDD'), { grp: 'A', no: 3 }));
  await assertSucceeds(setDoc(doc(admin(), 'selftest', 'yazma'), { t: 1 }));
  await assertSucceeds(getDoc(doc(admin(), 'selftest', 'yazma')));
  await assertFails(setDoc(doc(anonim(), 'selftest', 'yazma'), { t: 2 }));
});

// ── 7. Politika A: kimse hiçbir şeyi silemez ──
test('silme: katılımcı da araştırmacı da hiçbir belgeyi silemez', async () => {
  for (const db of [anonim(), admin(), girissiz()]) {
    await assertFails(deleteDoc(doc(db, 'participants', 'AAAA')));
    await assertFails(deleteDoc(doc(db, 'participants', 'BBBB')));
    await assertFails(deleteDoc(doc(db, 'participants', 'AAAA', 'events', 'e1')));
    await assertFails(deleteDoc(doc(db, 'allocations', 'AAAA')));
  }
  await assertSucceeds(setDoc(doc(admin(), 'selftest', 'yazma'), { t: 1 }));
  await assertFails(deleteDoc(doc(admin(), 'selftest', 'yazma')));
});

// ── 8. Tanımsız yollar kapalı ──
test('tanımsız koleksiyonlar: araştırmacı bile yazamaz/okuyamaz (varsayılan red)', async () => {
  await assertFails(setDoc(doc(admin(), 'baska', 'x'), { a: 1 }));
  await assertFails(getDoc(doc(admin(), 'baska', 'x')));
});
