// Veri katmanı: yerel/Firebase kayıt, randomizasyon listesi, olay yazma, araştırmacı girişi.

import { CONFIG, DEMO_MODE } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { eventLog } from '../services/event-log.js';
import { CODE_PATTERN, buildAllocationList, rememberCode } from '../utils/participant-code.js';

// ═════════════════ VERİ KATMANI ═════════════════
// İki mod:
//  - local: kayıt bu tarayıcının localStorage'ında. claude.ai önizlemesi ve demo için.
//  - firebase: CFG.firebase doluysa ve sayfa kendi sunucunda yayındaysa. Gerçek pilot için.
// Uygulamanın geri kalanı hangi modda olduğunu bilmez; sadece Store'u çağırır.
export const participantRepository = (function () {
  var mode = 'local',
    feedback = null,
    ready = false,
    adminUser = null;
  // Bazı mobil görünümler tarayıcı deposunu tamamen engelliyor. O durumda demo, bellekte çalışır
  // (sayfa kapanınca silinir). Eskiden bu durumda kod listesi hiç oluşmuyor ve hiçbir kod kabul edilmiyordu.
  var innerMap = {},
    memMode = false;
  try {
    localStorage.setItem('ilklot:_t', '1');
    localStorage.removeItem('ilklot:_t');
  } catch (error) {
    memMode = true;
  }
  function list(key, value) {
    if (memMode) {
      if (value === undefined) return innerMap[key] !== undefined ? JSON.parse(innerMap[key]) : null;
      innerMap[key] = JSON.stringify(value);
      return true;
    }
    try {
      if (value === undefined) {
        var result = localStorage.getItem('ilklot:' + key);
        return result ? JSON.parse(result) : null;
      }
      localStorage.setItem('ilklot:' + key, JSON.stringify(value));
      return true;
    } catch (error) {
      return null;
    }
  }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var element = document.createElement('script');
      element.src = src;
      element.onload = resolve;
      element.onerror = reject;
      document.head.appendChild(element);
    });
  }
  async function initFb() {
    var text = 'https://www.gstatic.com/firebasejs/10.12.2/';
    await loadScript(text + 'firebase-app-compat.js');
    await loadScript(text + 'firebase-auth-compat.js');
    await loadScript(text + 'firebase-firestore-compat.js');
    firebase.initializeApp(CONFIG.firebase);
    // Katılımcılar anonim oturum açar: kimlik bilgisi toplanmaz ama güvenlik kuralları çalışır
    if (!firebase.auth().currentUser) await firebase.auth().signInAnonymously();
    feedback = { db: firebase.firestore(), auth: firebase.auth() };
    var currentUser = feedback.auth.currentUser;
    adminUser = currentUser && !currentUser.isAnonymous ? currentUser.email : null;
  }
  return {
    mode: function () {
      return mode;
    },
    memMode: function () {
      return memMode;
    },
    isAdminAuthed: function () {
      return mode === 'local' || !!adminUser;
    },
    adminEmail: function () {
      return adminUser;
    },
    init: async function () {
      if (DEMO_MODE) {
        ready = true;
        return;
      } // Tanıtım: sunucuya bağlanma, yerel liste oluşturma
      if (CONFIG.firebase) {
        try {
          await initFb();
          mode = 'firebase';
        } catch (error) {
          console.warn('Firebase başlatılamadı, yerel kayda geçildi', error);
          mode = 'local';
        }
      }
      // Demo kolaylığı: yerel modda liste yoksa 40 kişilik örnek liste oluştur
      // Eski biçimdeki (P001-ABC) demo listesi varsa yenisiyle değiştir
      var alert = mode === 'local' ? list('alloc') : null;
      if (
        mode === 'local' &&
        (!alert ||
          Object.keys(alert).some(function (item) {
            return !CODE_PATTERN.test(item);
          }))
      ) {
        list('alloc', buildAllocationList(40, 4, 0));
        rememberCode(null);
      }
      ready = true;
    },
    getAlloc: async function (code) {
      if (mode === 'firebase') {
        var data = await feedback.db.collection('allocations').doc(code).get();
        return data.exists ? data.data() : null;
      }
      return (list('alloc') || {})[code] || null;
    },
    getP: async function (code) {
      if (mode === 'firebase') {
        var data = await feedback.db.collection('participants').doc(code).get();
        return data.exists ? data.data() : null;
      }
      return list('p:' + code);
    },
    saveP: async function (code, data) {
      if (DEMO_MODE) return;
      if (mode === 'firebase')
        return feedback.db.collection('participants').doc(code).set(data, { merge: true });
      var current = list('p:' + code) || {};
      for (var key in data) current[key] = data[key];
      list('p:' + code, current);
      var level = list('plist') || [];
      if (level.indexOf(code) < 0) {
        level.push(code);
        list('plist', level);
      }
    },
    addEvents: async function (code, evs) {
      if (DEMO_MODE || !evs.length) return;
      if (mode === 'firebase') {
        var other = feedback.db.batch(),
          color = feedback.db.collection('participants').doc(code).collection('events');
        evs.forEach(function (item) {
          other.set(color.doc(item.session + '-' + String(item.n).padStart(6, '0')), item);
        });
        return other.commit();
      }
      var current = list('ev:' + code) || [];
      if (list('ev:' + code, current.concat(evs)) === null) throw new Error('Yerel depolama dolu');
    },
    // ── Araştırmacı işlemleri ──
    adminLogin: async function (email, pw) {
      if (mode !== 'firebase') return;
      var value = await feedback.auth.signInWithEmailAndPassword(email, pw);
      adminUser = value.user.email;
    },
    adminLogout: async function () {
      if (mode !== 'firebase') return;
      await feedback.auth.signOut();
      await feedback.auth.signInAnonymously();
      adminUser = null;
    },
    listAlloc: async function () {
      if (mode === 'firebase') {
        var quantity = await feedback.db.collection('allocations').get(),
          map = {};
        quantity.forEach(function (item) {
          map[item.id] = item.data();
        });
        return map;
      }
      return list('alloc') || {};
    },
    saveAlloc: async function (map) {
      if (mode === 'firebase') {
        var keys = Object.keys(map);
        for (var i = 0; i < keys.length; i += 400) {
          var other = feedback.db.batch();
          keys.slice(i, i + 400).forEach(function (item) {
            other.set(feedback.db.collection('allocations').doc(item), map[item]);
          });
          await other.commit();
        }
        return;
      }
      list('alloc', map);
    },
    listP: async function () {
      if (mode === 'firebase') {
        var quantity = await feedback.db.collection('participants').get(),
          items = [];
        quantity.forEach(function (item) {
          items.push(item.data());
        });
        return items;
      }
      return (list('plist') || [])
        .map(function (item) {
          return list('p:' + item);
        })
        .filter(Boolean);
    },
    listEvents: async function (code) {
      if (mode === 'firebase') {
        var quantity = await feedback.db.collection('participants').doc(code).collection('events').get(),
          items = [];
        quantity.forEach(function (item) {
          items.push(item.data());
        });
        return items;
      }
      return list('ev:' + code) || [];
    },
    // Çekilme: yerelde veri hemen silinir (yalnızca demo kipi; gerçek veri Firebase'dedir). Firebase'de HİÇBİR silme yolu yoktur
    // (politika A, soft delete): kayıt "withdrawn:true + withdrawnAt" ile işaretlenir ve analizden/dışa aktarmadan çıkarılır.
    withdraw: async function (code, grp, extra) {
      if (DEMO_MODE) return;
      var tomb = { code: code, grp: grp, withdrawn: true, withdrawnAt: new Date().toISOString() };
      for (var key in extra || {}) tomb[key] = extra[key];
      if (mode === 'firebase')
        return feedback.db.collection('participants').doc(code).set(tomb, { merge: true });
      try {
        ['ev:', 'q:', 'evn:'].forEach(function (item) {
          localStorage.removeItem('ilklot:' + item + code);
        });
      } catch (error) {}
      list('p:' + code, tomb);
    },
    // Sistem testi: depolama, bağlantı, yetki, olay kuyruğu. Katılımcı yazma yetkisi gerçek bir kod gerektirdiği için
    // Firebase'de yazma testi sadece araştırmacı girişliyken yapılır (selftest/yazma yazılır ve okunur; politika A'da silme yolu olmadığı için belge silinmez, her testte üzerine yazılır).
    selfTest: async function () {
      var innerItems = [],
        isValid = function (items, data) {
          innerItems.push({ ad: items, ok: true, d: data || '' });
        },
        no = function (items, data) {
          innerItems.push({ ad: items, ok: false, d: data || '' });
        },
        bil = function (items, data) {
          innerItems.push({ ad: items, ok: null, d: data || '' });
        };
      if (memMode)
        no(
          'Tarayıcı deposu',
          'Engelli: kayıtlar bellekte tutulur ve sayfa kapanınca silinir. Bu görünümde (ör. bazı uygulama içi tarayıcılar) gerçek veri toplama yapılmamalı.'
        );
      else {
        try {
          localStorage.setItem('ilklot:_st', '1');
          var value = localStorage.getItem('ilklot:_st');
          localStorage.removeItem('ilklot:_st');
          value === '1'
            ? isValid('Tarayıcı deposu', 'yazma ve okuma çalışıyor')
            : no('Tarayıcı deposu', 'yazılan değer okunamadı');
        } catch (error) {
          no('Tarayıcı deposu', 'erişim hatası');
        }
      }
      isValid(
        'Kayıt modu',
        mode === 'firebase' ? 'Firebase (bulut)' : 'Yerel (demo): veri yalnızca bu cihazda'
      );
      if (CONFIG.firebase && mode !== 'firebase')
        no(
          'Firebase bağlantısı',
          'CFG.firebase dolu ama bağlanılamadı; yerel kayda düşüldü. Ağı, apiKey/projectId değerlerini ve Authentication > Authorized domains listesini kontrol et.'
        );
      if (mode === 'firebase') {
        var startTime = Date.now();
        try {
          await feedback.db.collection('allocations').doc('__selftest__').get();
          isValid('Firestore okuma ve anonim giriş', 'erişildi (' + (Date.now() - startTime) + ' ms)');
        } catch (error) {
          no('Firestore okuma', (error && error.code) || String(error));
        }
        if (adminUser) {
          try {
            var reference = feedback.db.collection('selftest').doc('yazma');
            await reference.set({ t: Date.now() });
            var reader = await reference.get();
            reader.exists
              ? isValid('Firestore yazma (araştırmacı)', 'yazma ve okuma başarılı')
              : no('Firestore yazma', 'yazılan kayıt okunamadı');
          } catch (error) {
            no('Firestore yazma (araştırmacı)', (error && error.code) || String(error));
          }
        } else
          bil(
            'Firestore yazma',
            'Katılımcı yazması gerçek bir kod gerektirir. Araştırmacı girişi yap ya da kullanılmamış bir kartla akışı bitirip kaydın panelde göründüğünü doğrula.'
          );
      } else {
        try {
          list('p:__selftest__', { t: Date.now() });
          var quantity = list('p:__selftest__');
          if (memMode) delete innerMap['p:__selftest__'];
          else localStorage.removeItem('ilklot:p:__selftest__');
          quantity && quantity.t
            ? isValid('Yerel kayıt turu', 'yaz, oku, sil başarılı')
            : no('Yerel kayıt turu', 'okunamadı');
        } catch (error) {
          no('Yerel kayıt turu', String(error));
        }
      }
      bil(
        'Olay kuyruğu',
        (typeof eventLog.queue !== 'undefined' ? eventLog.queue.length : 0) +
          ' gönderilmemiş olay' +
          (typeof state !== 'undefined' && state.syncError ? ' · son senkron hatası: ' + state.syncError : '')
      );
      return innerItems;
    },
    resetLocal: function () {
      for (var marketChange in innerMap) delete innerMap[marketChange];
      try {
        Object.keys(localStorage)
          .filter(function (item) {
            return item.indexOf('ilklot:') === 0;
          })
          .forEach(function (item) {
            localStorage.removeItem(item);
          });
      } catch (error) {}
      list('alloc', buildAllocationList(40, 4, 0));
    },
  };
})();
