// Uygulama sürümü ve çalışma ayarları (CONFIG). Tüm modüller buradan okur; pilot başladıktan sonra ölçüt ayarları DEĞİŞTİRİLMEZ.

// Her olay ve anlık görüntü bu sürümle etiketlenir. Pilot ortasında kodu değiştirirsen MUTLAKA artır.
export const APP_VERSION = '2026.10.28-b37';

// ═════════════════ ÇALIŞMA AYARLARI ═════════════════
export const CONFIG = {
  session: '1',
  totalSessions: 1, // Tek oturum, ~30 dk: 1. bölüm (6 karar) → simülatör (7,5 dk) → 3. bölüm (6 karar)
  minGapHours: 0,
  baseUrl: '', // Katılım bağlantısı (yönetim panelinde gösterilir). Boşsa katılımcı sitesinin kök adresi kullanılır
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
  seed: 'ilklot-gorev-v1', // karar anı uyaranlarının tohumu; pilot başladıktan sonra DEĞİŞTİRME
  firebase: {
    apiKey: 'AIzaSyBQEsokUK7ShXU2sj35dM4wTN5UW6HDHgM',
    authDomain: 'ilk-lot-pilot.firebaseapp.com',
    projectId: 'ilk-lot-pilot',
    appId: '1:1067188269577:web:cdb9bfdecb20c85335fed8',
  }, // ilk-lot-pilot web uygulaması (KURULUM.md)
};

// Pilot geri bildirim formu: yalnızca CONFIG.pilot ile açılır. Gerçek veri toplamada MUTLAKA false (firebase/dagit.py kontrol eder).
export const PILOT_MODE = CONFIG.pilot === true;

// ═════════════════ DURUM ═════════════════
export const CONSENT_VERSION = 'v1';
