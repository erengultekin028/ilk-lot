// Uygulama sürümü, çalışma ayarları (CONFIG) ve çalışma kipi bayrakları. Tüm modüller buradan okur; pilot başladıktan sonra ölçüt ayarları DEĞİŞTİRİLMEZ.

// Her olay ve anlık görüntü bu sürümle etiketlenir. Pilot ortasında kodu değiştirirsen MUTLAKA artır.
export const APP_VERSION = '2026.10.22-b26';

// ═════════════════ ÇALIŞMA AYARLARI ═════════════════
export const QUERY_PARAMS = new URLSearchParams(location.search);

// Kişiye özel link: ...ilk-lot.html#k=KM7D-P2XR-9TQA  (# sonrası sunucuya gönderilmez)
export const HASH_PARAMS = new URLSearchParams(location.hash.slice(1));

export const CONFIG = {
  session: '1',
  totalSessions: 1, // Tek oturum, ~30 dk: 1. bölüm (6 karar) → simülatör (7,5 dk) → 3. bölüm (6 karar)
  minGapHours: 0,
  baseUrl: '', // Kartlardaki link adresi. Boşsa sayfanın kendi adresi
  contact: 'arastirmaci@ornek.edu.tr', // DEĞİŞTİR: bilgilendirme ve onam ekranındaki iletişim adresi
  // Onam metnindeki doldurulacak alanlar. "[DOLDUR…" ile başlayanlar ekranda sarı işaretli görünür ve
  // araştırmacı panelinde "doldurulmamış" olarak listelenir. Pilottan ÖNCE hepsini doldur.
  consentInfo: {
    controller: '[DOLDUR: üniversite ve araştırmacı adı]',
    ethics: '[DOLDUR: etik kurul adı, tarih ve sayı]',
    retention: '[DOLDUR: örn. araştırma bittikten sonra 2 yıl]',
    hosting: '[DOLDUR: örn. Google Firebase, Avrupa bölgesi]',
    support: '[DOLDUR: üniversite psikolojik danışma ve rehberlik birimi, iletişim bilgisi]',
    funding: '',
  },
  stake: 10000, // Her karar anında elde tutulan pozisyonun değeri (₺)
  addAmount: 5000, // "Daha al" seçilince eklenen tutar (₺)
  cooldownSec: 10, // A grubu: zararına satışta bekleme süresi
  lossThreshold: -0.02, // Bekleme, pozisyon bu orandan fazla zarardayken tetiklenir
  // Simülatör: 6 hisselik hazır portföy + nakit. Üç planlı kriz; krizde pozisyonlar zarara girer
  cash0: 40000,
  posValue: 10000,
  pracTicks: 20,
  pracSeed: 'ilklot-prac-v1', // alıştırma simülatörü: 20 gün (30 sn), kriz yok, kayıt yok, bekleme ekranı yok
  simTicks: 300,
  simTickMs: 1500, // 300 gün × 1,5 sn = 7,5 dk
  // Sektörel krizler: her biri farklı hisseleri vurur. Bir hisseyi satmak diğer krizlerden kaçırmaz,
  // böylece piyasa nötr kalır ama katılımcı her krizde yeniden karar verir (bekleme dozu dağılır).
  // BIMAS hiçbir krizden etkilenmez (karşılaştırma hissesi). Kriz dışında sürüklenme yok.
  // Hisse adları gerçek BIST şirketleri; fiyatlar, haberler ve krizler KURGUSAL (ekranda ve bilgilendirmede belirtilir).
  simCrises: [
    { at: 52, len: 7, drop: 0.18, stocks: ['TUPRS', 'KOZAL'] },
    { at: 135, len: 7, drop: 0.2, stocks: ['ASELS'] },
    { at: 218, len: 7, drop: 0.16, stocks: ['THYAO', 'PGSUS'] },
  ],
  simSeed: 'ilklot-sim4-v2669', // 300 günlük takvim için seçildi: kriz dibinden sona ve +20 güne ortalama değişim ~0 (nötr piyasa); docs/SIMULATOR_TOHUMU.md
  crisisFx: true, // Yön ışığı: yükselişte yeşil, düşüşte kırmızı kenar ışığı (iki gruba da aynı)
  // Pilot yayını için true: bilgilendirme ekranının sonunda 3 soruluk geri bildirim formu çıkar (CSV: pilot_clear, pilot_duration, pilot_unease).
  // Gerçek veri toplamada MUTLAKA false: ana veride bu sorular olmamalı. firebase/dagit.py true bırakılmışsa yayını durdurur.
  pilot: false,
  firebase: {
    apiKey: 'AIzaSyBQEsokUK7ShXU2sj35dM4wTN5UW6HDHgM',
    authDomain: 'ilk-lot-pilot.firebaseapp.com',
    projectId: 'ilk-lot-pilot',
    appId: '1:1067188269577:web:cdb9bfdecb20c85335fed8',
  }, // ilk-lot-pilot web uygulaması (KURULUM.md)
};

// ── Hızlı test modu ──
// Sadece geliştirme/demo içindir: piyasa 10 kat hızlı akar (7,5 dk yerine ~45 sn), bekleme 3 sn olur.
// Fiyatlar, krizler ve haberler AYNI günlerde olur (sadece gerçek zaman kısalır). Açma yolları: adrese ?hizli=1 ya da
// araştırmacı panelindeki düğme (30 dk sonra kendiliğinden kapanır). CFG.firebase doluysa (gerçek pilot) HİÇBİR ZAMAN açılmaz.
export const QUICK_TEST_MODE = (function () {
  if (CONFIG.firebase) return false;
  if (QUERY_PARAMS.get('hizli') === '1') return true;
  try {
    var value = +localStorage.getItem('ilklot:quick');
    return !!value && Date.now() - value < 1800000;
  } catch (error) {
    return false;
  }
})();

if (QUICK_TEST_MODE) {
  CONFIG.simTickMs = 150;
  CONFIG.cooldownSec = 3;
}

// ── Tanıtım modu (?demo=1) ──
// Okulda, sunumda ya da arkadaşa gösterirken kullanılır: simülatör serbestçe oynanır, HİÇBİR şey kaydedilmez (ne yerel ne Firebase),
// bekleme ekranı çıkmaz (müdahale gösterilmez, böylece tanıtımı gören biri sonradan gerçek katılımcı olursa ön bilgi edinmez).
// CFG.firebase dolu olsa da Firebase'e hiç bağlanılmaz. Gerçek veri toplamada bu adres kartlara/linklere KONMAZ.
export let DEMO_MODE = QUERY_PARAMS.get('demo') === '1';
export function setDemoMode(value) {
  DEMO_MODE = value;
}

// Pilot geri bildirim formu: CFG.pilot ya da (Firebase yokken) adrese ?pilot=1. CFG.firebase doluyken adres parametresi çalışmaz;
// gerçek kurulumda formu yalnızca yayındaki dosyanın kendisi açar, katılımcı linkine parametre eklenerek açılamaz.
export let PILOT_MODE =
  !DEMO_MODE && (CONFIG.pilot === true || (!CONFIG.firebase && QUERY_PARAMS.get('pilot') === '1'));
export function setPilotMode(value) {
  PILOT_MODE = value;
}

CONFIG.seed = 'ilklot-gorev-v1';

export const FORCED_SESSION = QUERY_PARAMS.get('oturum');

// ═════════════════ DURUM ═════════════════
export const CONSENT_VERSION = 'v1';
