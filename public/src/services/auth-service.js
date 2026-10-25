// Kimlik doğrulama: katılımcı için anonim giriş, araştırmacı için e-posta/şifre girişi.
// GÜVENLİK: Yetki kararı burada değil, Firestore güvenlik kurallarında (firebase/firestore.rules) verilir.

import { getServices } from './firebase-service.js';

// Sayfa yenilenince Firebase kayıtlı oturumu bir süre sonra geri yükler; ilk tepkiyi bekler.
// Bu bekleme olmazsa her yenilemede yeni bir anonim kullanıcı oluşur ve katılımcı kaydını kaybeder.
export function waitForRestoredUser() {
  const { auth } = getServices();
  return new Promise(function (resolve) {
    const unsubscribe = auth.onAuthStateChanged(function (user) {
      unsubscribe();
      resolve(user);
    });
  });
}

// Katılımcı girişi: kayıtlı kullanıcı varsa onu, yoksa yeni bir anonim kullanıcı döndürür
export async function signInAnonymouslyIfNeeded() {
  const restored = await waitForRestoredUser();
  if (restored) return restored;
  const credential = await getServices().auth.signInAnonymously();
  return credential.user;
}

// Araştırmacı girişi (yönetim uygulaması)
export async function signInWithEmail(email, password) {
  const credential = await getServices().auth.signInWithEmailAndPassword(email, password);
  return credential.user;
}

export async function signOutUser() {
  await getServices().auth.signOut();
}

// Anonim olmayan, e-postası olan kullanıcı araştırmacı adayıdır (asıl yetki kurallarda denetlenir)
export function isEmailUser(user) {
  return !!user && !user.isAnonymous && !!user.email;
}
