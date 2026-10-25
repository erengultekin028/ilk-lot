// Firestore güvenlik kuralları testleri (firebase/firestore.rules).
// Firebase Emulator (kendi bilgisayarında çalışan sahte Firestore) üzerinde, gerçek projeye dokunmadan çalışır.
// Çalıştırma: firebase/kural_testleri klasöründe `npm test` (Node.js ve Java gerekir).
// Kurallar dosyadan okunur; araştırmacı e-postası test e-postasıyla değiştirilir, böylece gerçek e-postadan bağımsızdır.
//
// Model: katılımcı kod girmez. Anonim kullanıcı onamdan sonra tek işlemde (batch) sıradaki yuvayı alır:
//   meta/counter artar + claims/{kod} + users/{uid}. Politika A (soft delete): kimse hiçbir şeyi silemez.
const { test, before, after, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, writeBatch, setLogLevel } = require('firebase/firestore');

setLogLevel('silent');

const ADMIN_EPOSTA = 'admin@test.local';
let env;

before(async () => {
  let kurallar = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const ornek = kurallar.match(/in \['([^']+)'\]/);
  if (!ornek) throw new Error('kurallarda araştırmacı e-posta listesi bulunamadı');
  kurallar = kurallar.replace(ornek[1], ADMIN_EPOSTA);
  env = await initializeTestEnvironment({ projectId: 'demo-ilklot', firestore: { rules: kurallar, host: '127.0.0.1', port: 8080 } });
});
after(async () => { await env.cleanup(); });

// Her testten önce:
//  - randomizasyon: AAAA (grup A, yuva 1), BBBB (B, yuva 2), EEEE (A, yuva 3), FFFF (B, yuva 4); sayaç sıradaki yuva = 3
//  - uA, AAAA yuvasını; uB, BBBB yuvasını almış (claims + users); BBBB çekilmiş (withdrawn)
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const liste = { AAAA: ['A', 1], BBBB: ['B', 2], EEEE: ['A', 3], FFFF: ['B', 4] };
    for (const [kod, [grp, no]] of Object.entries(liste)) {
      await setDoc(doc(db, 'allocations', kod), { grp, no, order: 0, block: 1 });
      await setDoc(doc(db, 'slots', String(no)), { code: kod });
    }
    await setDoc(doc(db, 'meta', 'counter'), { next: 3 });
    await setDoc(doc(db, 'claims', 'AAAA'), { uid: 'uA', slot: 1, at: 't' });
    await setDoc(doc(db, 'users', 'uA'), { code: 'AAAA', slot: 1, at: 't' });
    await setDoc(doc(db, 'claims', 'BBBB'), { uid: 'uB', slot: 2, at: 't' });
    await setDoc(doc(db, 'users', 'uB'), { code: 'BBBB', slot: 2, at: 't' });
    await setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'A' });
    await setDoc(doc(db, 'participants', 'AAAA', 'events', 'e1'), { type: 'x', n: 1 });
    await setDoc(doc(db, 'participants', 'BBBB'), { code: 'BBBB', grp: 'B', withdrawn: true, withdrawnAt: '2026-01-01' });
  });
});

const anonim = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const admin = () => env.authenticatedContext('adm', { email: ADMIN_EPOSTA }).firestore();
const digerEposta = () => env.authenticatedContext('x', { email: 'baska@test.local' }).firestore();
const girissiz = () => env.unauthenticatedContext().firestore();

// Yuva alma işlemi: sayaç + claims + users aynı toplu yazmada
function yuvaAl(db, uid, kod, slot, ekler = {}) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'claims', kod), { uid, slot, at: 't', ...(ekler.claim ?? {}) });
  batch.set(doc(db, 'users', uid), { code: kod, slot, at: 't', ...(ekler.user ?? {}) });
  batch.update(doc(db, 'meta', 'counter'), ekler.counter ?? { next: slot + 1 });
  return batch.commit();
}

// ── 1. Giriş yapmamış kimse hiçbir şey okuyamaz ya da yazamaz ──
test('giriş yapmamış: okuma ve yazma hepsi reddedilir', async () => {
  const db = girissiz();
  await assertFails(getDoc(doc(db, 'allocations', 'AAAA')));
  await assertFails(getDoc(doc(db, 'participants', 'AAAA')));
  await assertFails(getDoc(doc(db, 'meta', 'counter')));
  await assertFails(getDoc(doc(db, 'slots', '3')));
  await assertFails(getDocs(collection(db, 'participants')));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'A' }));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e2'), { type: 'y' }));
  await assertFails(setDoc(doc(db, 'selftest', 'yazma'), { t: 1 }));
});

// ── 2. Yuva alma (anonim giriş + sıralı yuva) ──
test('yeni anonim kullanıcı: sayaç + claims + users aynı işlemde yazılırsa yuva alır', async () => {
  const db = anonim('uNew');
  await assertSucceeds(getDoc(doc(db, 'meta', 'counter')));
  await assertSucceeds(getDoc(doc(db, 'slots', '3')));
  await assertSucceeds(yuvaAl(db, 'uNew', 'EEEE', 3));
  // Yuvayı aldıktan sonra kendi kodunun grubunu okuyabilir
  await assertSucceeds(getDoc(doc(db, 'allocations', 'EEEE')));
});

test('yuva alma: eksik parça reddedilir (yalnız sayaç, yalnız claims, yalnız users)', async () => {
  const db = anonim('uNew');
  await assertFails(updateDoc(doc(db, 'meta', 'counter'), { next: 4 }));
  await assertFails(setDoc(doc(db, 'claims', 'EEEE'), { uid: 'uNew', slot: 3, at: 't' }));
  await assertFails(setDoc(doc(db, 'users', 'uNew'), { code: 'EEEE', slot: 3, at: 't' }));
  // users + claims var ama sayaç artmadı: claims/users yine de geçerli olabilir (sayaç yalnızca ipucudur), ama sayaç tek başına artamaz
  const batch = writeBatch(db);
  batch.update(doc(db, 'meta', 'counter'), { next: 99 });
  await assertFails(batch.commit());
});

test('yuva alma: başkasının uid\'siyle ya da alınmış yuvayla yazılamaz', async () => {
  // Başka kullanıcı adına claims
  await assertFails(yuvaAl(anonim('uNew'), 'uNew', 'EEEE', 3, { claim: { uid: 'uBaska' } }));
  // Zaten alınmış kod (AAAA, uA'da): claims belgesi var, create reddedilir
  await assertFails(yuvaAl(anonim('uNew'), 'uNew', 'AAAA', 1));
  // Listede olmayan kodla yuva alınamaz
  await assertFails(yuvaAl(anonim('uNew'), 'uNew', 'ZZZZ', 9));
  // Başka kullanıcının users belgesini yazamaz
  const db = anonim('uNew');
  const batch = writeBatch(db);
  batch.set(doc(db, 'claims', 'EEEE'), { uid: 'uNew', slot: 3, at: 't' });
  batch.set(doc(db, 'users', 'uBaska'), { code: 'EEEE', slot: 3, at: 't' });
  batch.update(doc(db, 'meta', 'counter'), { next: 4 });
  await assertFails(batch.commit());
});

test('yuva alma: sayaç geriye gidemez, 50\'den fazla sıçrayamaz; her kullanıcı yalnızca bir kez alır', async () => {
  await assertFails(yuvaAl(anonim('uNew'), 'uNew', 'EEEE', 3, { counter: { next: 2 } }));
  await assertFails(yuvaAl(anonim('uNew'), 'uNew', 'EEEE', 3, { counter: { next: 60 } }));
  // uA zaten yuva almış: ikinci kez alamaz
  await assertFails(yuvaAl(anonim('uA'), 'uA', 'EEEE', 3));
  // users belgesi sonradan değiştirilemez
  await assertFails(updateDoc(doc(anonim('uA'), 'users', 'uA'), { code: 'EEEE' }));
});

// ── 3. Katılımcı yalnızca kendi kodunu görür ──
test('katılımcı: yalnızca kendi users/allocations/participants kaydını okur; listeleyemez', async () => {
  const db = anonim('uA');
  await assertSucceeds(getDoc(doc(db, 'users', 'uA')));
  await assertFails(getDoc(doc(db, 'users', 'uB')));
  await assertSucceeds(getDoc(doc(db, 'allocations', 'AAAA')));
  await assertFails(getDoc(doc(db, 'allocations', 'EEEE'))); // başkasının (henüz alınmamış) kodunun grubu
  await assertFails(getDoc(doc(db, 'allocations', 'BBBB')));
  await assertSucceeds(getDoc(doc(db, 'participants', 'AAAA')));
  await assertFails(getDoc(doc(db, 'participants', 'BBBB')));
  await assertFails(getDocs(collection(db, 'allocations')));
  await assertFails(getDocs(collection(db, 'participants')));
  await assertFails(getDocs(collection(db, 'users')));
  await assertFails(getDocs(collection(db, 'claims')));
});

test('katılımcı: randomizasyon listesine, yuvalara ve sayaca hiçbir şey yazamaz', async () => {
  const db = anonim('uA');
  await assertFails(setDoc(doc(db, 'allocations', 'CCCC'), { grp: 'A', no: 9 }));
  await assertFails(updateDoc(doc(db, 'allocations', 'AAAA'), { grp: 'B' }));
  await assertFails(setDoc(doc(db, 'slots', '9'), { code: 'CCCC' }));
  await assertFails(updateDoc(doc(db, 'slots', '3'), { code: 'CCCC' }));
  await assertFails(updateDoc(doc(db, 'meta', 'counter'), { next: 10 }));
});

// ── 4. Grup değiştirilemez ──
test('katılımcı: kendi kodunda doğru grupla kayıt açar; yanlış grup ve başkasının kodu reddedilir', async () => {
  // uNew yuva alır (EEEE, grup A); henüz participants/EEEE yok
  await assertSucceeds(yuvaAl(anonim('uNew'), 'uNew', 'EEEE', 3));
  const db = anonim('uNew');
  await assertFails(setDoc(doc(db, 'participants', 'EEEE'), { code: 'EEEE', grp: 'B' })); // A kodu B yazamaz
  await assertFails(setDoc(doc(db, 'participants', 'EEEE'), { code: 'EEEE' })); // grup alanı yok
  await assertSucceeds(setDoc(doc(db, 'participants', 'EEEE'), { code: 'EEEE', grp: 'A', pre: 100 }));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'A' })); // başkasının kodu
  await assertSucceeds(updateDoc(doc(db, 'participants', 'EEEE'), { pre: 50 }));
  await assertFails(updateDoc(doc(db, 'participants', 'EEEE'), { grp: 'B' }));
});

test('yuva almamış kullanıcı: katılımcı ya da olay kaydı açamaz', async () => {
  const db = anonim('uYok');
  await assertFails(setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'A' }));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e9'), { type: 'x' }));
  await assertFails(getDoc(doc(db, 'allocations', 'AAAA')));
});

// ── 5. Olay kaydı değiştirilemez, silinemez ──
test('olay kaydı: sahibi ekler; içeriği değiştirilemez; birebir aynı veri yeniden yazılabilir; başkası yazamaz', async () => {
  const db = anonim('uA');
  await assertSucceeds(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e2'), { type: 'y', n: 2 }));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e1'), { type: 'x', n: 999 }));
  await assertFails(updateDoc(doc(db, 'participants', 'AAAA', 'events', 'e1'), { n: 2 }));
  await assertSucceeds(setDoc(doc(db, 'participants', 'AAAA', 'events', 'e1'), { type: 'x', n: 1 })); // bağlantı kopması sonrası tekrar gönderim
  await assertFails(updateDoc(doc(admin(), 'participants', 'AAAA', 'events', 'e1'), { n: 5 })); // araştırmacı da değiştiremez
  await assertFails(setDoc(doc(anonim('uB'), 'participants', 'AAAA', 'events', 'e3'), { type: 'z' })); // başkasının kodu
});

// ── 6. Çekilmiş kayıt katılımcı tarafından geri açılamaz ──
test('çekilmiş kayıt: katılımcı geri açamaz; araştırmacı güncelleyebilir', async () => {
  const db = anonim('uB');
  await assertFails(setDoc(doc(db, 'participants', 'BBBB'), { code: 'BBBB', grp: 'B', withdrawn: false }));
  await assertFails(updateDoc(doc(db, 'participants', 'BBBB'), { withdrawn: false }));
  await assertFails(updateDoc(doc(db, 'participants', 'BBBB'), { pre: 1 }));
  await assertSucceeds(updateDoc(doc(admin(), 'participants', 'BBBB'), { note: 'inceleme' }));
});

test('çekilme: katılımcı kendi kaydını çekildi olarak işaretleyebilir (soft delete)', async () => {
  await assertSucceeds(setDoc(doc(anonim('uA'), 'participants', 'AAAA'), { code: 'AAAA', grp: 'A', withdrawn: true, withdrawnAt: '2026-10-22' }, { merge: true }));
});

// ── 6b. Test kaydı işareti: yalnızca araştırmacı yazar, geri alınabilir, katılımcı değiştiremez ──
test('test kaydı işareti: katılımcı kendi kaydını işaretleyemez (oluştururken de, güncellerken de)', async () => {
  const db = anonim('uA');
  await assertFails(updateDoc(doc(db, 'participants', 'AAAA'), { testRecord: true }));
  await assertFails(updateDoc(doc(db, 'participants', 'AAAA'), { testMarkedAt: 't' }));
  await assertFails(setDoc(doc(db, 'participants', 'AAAA'), { code: 'AAAA', grp: 'A', testRecord: true }, { merge: true }));
  // Yeni kayıt açarken de işaret koyamaz
  await assertSucceeds(yuvaAl(anonim('uNew'), 'uNew', 'EEEE', 3));
  await assertFails(setDoc(doc(anonim('uNew'), 'participants', 'EEEE'), { code: 'EEEE', grp: 'A', testRecord: true }));
  // Normal yazma etkilenmez
  await assertSucceeds(updateDoc(doc(db, 'participants', 'AAAA'), { pre: 3 }));
});

test('test kaydı işareti: araştırmacı işaretler (kayıt çekilmiş gibi kapanır) ve geri alır; geri alınca katılımcı yeniden yazabilir', async () => {
  const kayit = doc(admin(), 'participants', 'AAAA');
  await assertSucceeds(updateDoc(kayit, { withdrawn: true, testRecord: true, testMarkedAt: 't', testMarkedBy: 'a@b', testPrevWithdrawn: false }));
  await assertFails(updateDoc(doc(anonim('uA'), 'participants', 'AAAA'), { pre: 9 })); // işaretliyken katılımcı yazamaz
  await assertSucceeds(updateDoc(kayit, { withdrawn: false, testRecord: false, testUnmarkedAt: 't2' }));
  await assertSucceeds(updateDoc(doc(anonim('uA'), 'participants', 'AAAA'), { pre: 9 })); // geri alınca yazabilir (işaret alanları değişmedi)
  await assertFails(updateDoc(doc(anonim('uA'), 'participants', 'AAAA'), { testRecord: true })); // ama işareti kendisi koyamaz
  await assertFails(updateDoc(doc(anonim('uA'), 'participants', 'AAAA'), { testUnmarkedAt: 'x' }));
});

// ── 7. Yalnızca araştırmacı listeler / olayları okur / liste üretir ──
test('araştırmacı: katılımcıları, listeyi, yuvaları, claims/users kayıtlarını ve olayları okur; diğer e-postalar okuyamaz', async () => {
  await assertSucceeds(getDocs(collection(admin(), 'participants')));
  await assertSucceeds(getDocs(collection(admin(), 'allocations')));
  await assertSucceeds(getDocs(collection(admin(), 'claims')));
  await assertSucceeds(getDocs(collection(admin(), 'users')));
  await assertSucceeds(getDocs(collection(admin(), 'participants', 'AAAA', 'events')));
  await assertSucceeds(getDoc(doc(admin(), 'participants', 'AAAA', 'events', 'e1')));
  await assertFails(getDocs(collection(digerEposta(), 'participants')));
  await assertFails(getDocs(collection(digerEposta(), 'allocations')));
  await assertFails(getDocs(collection(anonim('uA'), 'participants', 'AAAA', 'events'))); // katılımcı kendi olaylarını bile okuyamaz
  await assertFails(getDoc(doc(anonim('uA'), 'participants', 'AAAA', 'events', 'e1')));
});

test('araştırmacı: yeni yuva listesi (allocations + slots + sayaç) ve sistem testi yazabilir', async () => {
  const db = admin();
  const batch = writeBatch(db);
  batch.set(doc(db, 'allocations', 'GGGG'), { grp: 'A', no: 5, order: 1, block: 2 });
  batch.set(doc(db, 'slots', '5'), { code: 'GGGG' });
  await assertSucceeds(batch.commit());
  await assertSucceeds(setDoc(doc(db, 'meta', 'counter'), { next: 3 }));
  await assertSucceeds(setDoc(doc(db, 'selftest', 'yazma'), { t: 1 }));
  await assertSucceeds(getDoc(doc(db, 'selftest', 'yazma')));
  await assertFails(setDoc(doc(anonim('uA'), 'selftest', 'yazma'), { t: 2 }));
});

// ── 8. Politika A: kimse hiçbir şeyi silemez ──
test('silme: katılımcı da araştırmacı da hiçbir belgeyi silemez', async () => {
  for (const db of [anonim('uA'), admin(), girissiz()]) {
    await assertFails(deleteDoc(doc(db, 'participants', 'AAAA')));
    await assertFails(deleteDoc(doc(db, 'participants', 'BBBB')));
    await assertFails(deleteDoc(doc(db, 'participants', 'AAAA', 'events', 'e1')));
    await assertFails(deleteDoc(doc(db, 'allocations', 'AAAA')));
    await assertFails(deleteDoc(doc(db, 'slots', '1')));
    await assertFails(deleteDoc(doc(db, 'claims', 'AAAA')));
    await assertFails(deleteDoc(doc(db, 'users', 'uA')));
    await assertFails(deleteDoc(doc(db, 'meta', 'counter')));
  }
  await assertSucceeds(setDoc(doc(admin(), 'selftest', 'yazma'), { t: 1 }));
  await assertFails(deleteDoc(doc(admin(), 'selftest', 'yazma')));
});

// ── 9. Tanımsız yollar kapalı ──
test('tanımsız koleksiyonlar: araştırmacı bile yazamaz/okuyamaz (varsayılan red)', async () => {
  await assertFails(setDoc(doc(admin(), 'baska', 'x'), { a: 1 }));
  await assertFails(getDoc(doc(admin(), 'baska', 'x')));
});
