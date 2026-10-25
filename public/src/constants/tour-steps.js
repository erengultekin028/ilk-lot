// Rehberli tur adımları (karar görevi ve simülatör).

// ═════════════════ YENİ BAŞLAYANLAR İÇİN ═════════════════
// Rehberli tur adımları: sadece ekranda olan öğeler gösterilir. İki gruba da aynıdır.
export const TASK_TOUR_STEPS = [
  [
    'tc',
    'Bu, hissenin son 30 günlük fiyat grafiği. Sağdaki gri alan son haftayı gösterir. Üstteki rozet son haftadaki değişim: <b>▲ yeşil</b> yükseliş, <b>▼ kırmızı</b> düşüş.',
  ],
  [
    'tpos',
    'Bu hisse için ne ödediğini ve şu an ne ettiğini gösterir. Şu anki değer ödediğinden fazlaysa <b>kârdasın ▲</b>, azsa <b>zarardasın ▼</b>.',
  ],
  ['tnews', 'Bazı anlarda o güne ait bir haber görürsün.'],
  [
    'tcrowd',
    'Diğer yatırımcıların bugün ne yaptığını gösterir: kırmızı kısım satanlar, yeşil kısım alanlar.',
  ],
  [
    'tch',
    "Üç seçeneğin var. <b>Sat:</b> hisseyi satıp parayı alırsın, sonraki fiyat değişimi seni etkilemez. <b>Tut:</b> hisse sende kalır, değeri değişir. <b>Daha al:</b> ₺5.000'lik daha alırsın, değişimden daha çok etkilenirsin. Hazırsan birini seç; doğru ya da yanlış cevap yok.",
  ],
];

export const SIMULATOR_TOUR_STEPS = [
  [
    'snews',
    'Burada piyasa haberleri çıkar. Haberler herkese aynı anda gelir; bazıları belirli sektörleri etkiler.',
  ],
  ['shero', 'Bu senin toplam paran: elindeki hisselerin değeri ve boştaki nakit. Başlangıçta ₺100.000.'],
  ['salloc', 'Paranın hisseler ve nakit arasında nasıl dağıldığını gösterir.'],
  [
    'slist',
    'Bunlar elindeki 6 hisse. Her biri yaklaşık ₺10.000 ile başlıyor. Bir hisseye dokunarak ayrıntısını görebilir, satabilir ya da daha alabilirsin.',
  ],
  [
    'nav',
    'Alttan <b>Piyasa</b> sekmesinde tüm haberleri ve grafikleri, <b>Analiz</b> sekmesinde bu bölümdeki işlemlerinin özetini görebilirsin.',
  ],
  ['tm', 'Sağ üstte kalan süre görünür. İşlem penceresi açıkken zaman durur, acele etmene gerek yok.'],
];
