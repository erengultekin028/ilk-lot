// Karar anı uyaranlarının sabit içeriği: sektörler, haber başlıkları, hisse sembolleri.

// ═════════════════ UYARANLAR: 16 KARAR ANI ═════════════════
// Tasarım 2 × 2 × 4: piyasa (sert düşüş / normal) × pozisyon (kârda / zararda) × 4 tekrar.
// Her hücrede: 2 denemede sürü bilgisi var, 2'sinde yok; 2 sonuç yükseliş, 2 düşüş (çapraz dengeli).
// Yükseliş ve düşüşler aynı büyüklükte eşleştirilir: her hücrede beklenen sonuç tam olarak sıfırdır.
// Yani "tutmak kazandırır" ya da "satmak kazandırır" diye bir ders verilmez.
export const SECTORS = [
  'Havacılık',
  'Bankacılık',
  'Perakende',
  'Enerji',
  'Otomotiv',
  'Telekom',
  'Gıda',
  'Savunma',
  'Demir çelik',
  'İnşaat',
  'Kimya',
  'Holding',
  'Cam',
  'Teknoloji',
  'Sağlık',
  'Tekstil',
];

export const CRISIS_HEADLINES = [
  'Kurda sert yükseliş, piyasalarda satış baskısı',
  'Küresel piyasalarda satış dalgası',
  'Faiz kararı beklentilerin üzerinde açıklandı',
  'Sektörde talep daralması uyarısı',
  'Yabancı yatırımcı çıkışı hızlandı',
  'Enflasyon verisi beklentileri aştı',
  'Kredi notu görünümü negatife çevrildi',
  'Bölgesel gerilim piyasaları tedirgin etti',
];

export const NORMAL_HEADLINES = [
  'Şirket yeni yatırım planını açıkladı',
  'Sektör satışlarında hafif artış',
  'Yönetim kurulu toplantısı tamamlandı',
  'Çeyreklik sonuçlar beklentilere yakın geldi',
];

export const TASK_STOCKS = {
  X: [
    ['GARAN', 'Bankacılık'],
    ['FROTO', 'Otomotiv'],
    ['TCELL', 'Telekom'],
    ['EREGL', 'Demir çelik'],
    ['SISE', 'Cam'],
    ['ULKER', 'Gıda'],
  ],
  Y: [
    ['AKBNK', 'Bankacılık'],
    ['TOASO', 'Otomotiv'],
    ['TTKOM', 'Telekom'],
    ['KCHOL', 'Holding'],
    ['ARCLK', 'Beyaz eşya'],
    ['MGROS', 'Perakende'],
  ],
};
