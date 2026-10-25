// Sözlük, okuma kartları ve satış gerekçesi seçenekleri.

// Simülatörden önce herkese aynı okuma. Bilinçli olarak nötr: "satma" ya da "tut" demez
export const READING_CARDS = [
  [
    'Çeşitlendirme',
    'Paranı farklı sektörlerdeki hisselere bölmek, tek bir şirketteki sert düşüşün toplam parana etkisini azaltır.',
  ],
  [
    'Fiyatlar dalgalanır',
    'Hisse fiyatları her gün yükselip düşer. Geçmişteki bir düşüş ya da yükseliş, sonrasında ne olacağını tek başına göstermez.',
  ],
  ['Haberler ve sektörler', 'Bir haber çoğu zaman tüm piyasayı değil, ilgili sektördeki şirketleri etkiler.'],
];

// Simülatörde her satışta sorulur (iki gruba da). Panik satışın nedenine dair veri
export const SELL_REASONS = [
  'Planım buydu',
  'Haber yüzünden',
  'Korktum',
  'Diğerleri satıyor',
  'Söylemek istemiyorum',
];

export const GLOSSARY = [
  ['Hisse', 'Bir şirketin küçük bir parçası. Fiyatı her gün değişir.'],
  [
    'Lot',
    'Hisse adedi. 1 lot = 1 adet hisse. 100 lot × ₺84 = ₺8.400. Al ya da sat penceresinde kaç lot istediğini kendin yazabilirsin.',
  ],
  [
    'Ortalama alış (ort.)',
    'Elindeki lotlar için ödediğin ortalama fiyat. Şu anki fiyat bunun üstündeyse kârdasın.',
  ],
  ['Elindeki hissenin değeri', 'Hisseni şu an satsan alacağın para.'],
  ['Bu hisse için ödediğin', 'Hisseyi alırken verdiğin para.'],
  ['Kâr / zarar', 'Şu anki değer ile ödediğin arasındaki fark. ▲ yeşil kâr, ▼ kırmızı zarar.'],
  ['Sert düşüş', 'Fiyatın kısa sürede, örneğin bir haftada, çok düşmesi.'],
  ['Satanların oranı', 'Diğer yatırımcıların ne kadarının o gün sattığı.'],
  ['Sat / Tut / Daha al', 'Sat: parayı al, çık. Tut: bekle. Daha al: aynı hisseden ekle.'],
  ['Nakit', 'Hisseye yatırılmamış, boşta duran paran.'],
  ['Toplam paran', 'Hisselerinin değeri + nakit.'],
];
