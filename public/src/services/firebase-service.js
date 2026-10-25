// Firebase SDK'sını (compat sürümü) yükler ve uygulamayı başlatır. Hem katılımcı hem yönetim uygulaması kullanır.
// Veritabanı (Firestore) ve kimlik doğrulama (Authentication) nesneleri yalnızca bu dosyadan alınır.

import { CONFIG } from '../constants/app-config.js';

const SDK_BASE_URL = 'https://www.gstatic.com/firebasejs/10.12.2/';
const SDK_FILES = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'];

let services = null;

// Bir betik dosyasını sayfaya ekler ve yüklenmesini bekler
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    const element = document.createElement('script');
    element.src = src;
    element.onload = resolve;
    element.onerror = function () {
      reject(new Error('Firebase dosyası yüklenemedi: ' + src));
    };
    document.head.appendChild(element);
  });
}

// SDK dosyalarını sırayla yükler, uygulamayı başlatır ve { db, auth } döndürür. Birden çok kez çağrılabilir.
export async function connectFirebase() {
  if (services) return services;
  if (!CONFIG.firebase) throw new Error('CONFIG.firebase boş: Firebase ayarı yapılmamış.');
  for (const file of SDK_FILES) await loadScript(SDK_BASE_URL + file);
  firebase.initializeApp(CONFIG.firebase);
  const db = firebase.firestore();
  // Kayıtlarda tanımsız (undefined) alan olursa Firestore tüm yazmayı reddeder; bu ayarla tanımsız alanlar yok sayılır
  db.settings({ ignoreUndefinedProperties: true, merge: true });
  services = { db: db, auth: firebase.auth() };
  return services;
}

// Bağlantı kurulduktan sonra veritabanı ve kimlik doğrulama nesnelerini verir
export function getServices() {
  if (!services) throw new Error('Firebase henüz bağlanmadı.');
  return services;
}
