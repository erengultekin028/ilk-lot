// Ön test ve son test soruları (Big Three + araştırmacı maddeleri) ile dikkat sorusu.

// ═════════════════ TEST SORULARI ═════════════════
// Finansal bilgi testi: Lusardi ve Mitchell'in "Big Three" soruları (1-3, ön test) ve "Big Five" uzantısının 4-5. soruları (son test).
// ÇEVİRİ araştırmacı tarafından doğrulanmalıdır (geri çeviri ya da yayımlanmış Türkçe uyarlama). İki testte FARKLI sorular vardır:
// ön-son değişim puanı hesaplanmaz. Eski sorular ("piyasa düşerken ilk adım: planına bak") ölçülen davranışı önceden hazırlıyordu.
// Her sorunun son seçeneği "Bilmiyorum": bu, yanlış cevaptan ayrı kaydedilir (olay kaydında dk).
export const TEST_QUESTIONS = [
  [
    "Tasarruf hesabında 100 ₺'n olduğunu ve faiz oranının yılda %2 olduğunu düşün. Parayı hesapta bırakırsan 5 yıl sonra hesapta ne kadar olur?",
    ["102 ₺'den fazla", 'Tam olarak 102 ₺', "102 ₺'den az", 'Bilmiyorum'],
    0,
  ],
  [
    'Tasarruf hesabındaki faiz oranının yılda %1, enflasyonun yılda %2 olduğunu düşün. 1 yıl sonra bu hesaptaki parayla, bugün alabildiğinden daha fazlasını mı, aynısını mı, daha azını mı alabilirsin?',
    ['Bugünkünden daha fazlasını', 'Aynısını', 'Bugünkünden daha azını', 'Bilmiyorum'],
    2,
  ],
  [
    '"Tek bir şirketin hissesini almak, genellikle bir hisse senedi yatırım fonuna göre daha güvenli bir getiri sağlar." Bu ifade doğru mu yanlış mı?',
    ['Doğru', 'Yanlış', 'Bilmiyorum'],
    1,
  ],
  [
    '"15 yıl vadeli bir konut kredisinin aylık taksitleri genellikle 30 yıl vadeliye göre daha yüksektir, ama kredi boyunca ödenen toplam faiz daha azdır." Bu ifade doğru mu yanlış mı?',
    ['Doğru', 'Yanlış', 'Bilmiyorum'],
    0,
  ],
  [
    'Faiz oranları yükselirse tahvil fiyatlarına genellikle ne olur?',
    [
      'Yükselir',
      'Düşer',
      'Aynı kalır',
      'Faiz oranları ile tahvil fiyatları arasında ilişki yoktur',
      'Bilmiyorum',
    ],
    1,
  ],
  // 5-7: araştırmacının yazdığı, doğrulanmamış ön test maddeleri (Big Three ile birlikte puanı inceltmek için; yalnızca Big Three puanı ayrıca saklanır: pre_test_b3)
  [
    'Genel olarak, daha yüksek getiri vaat eden yatırımların riski de nasıl olur?',
    ['Daha yüksek', 'Daha düşük', 'Değişmez', 'Bilmiyorum'],
    0,
  ],
  [
    'Bir şirketin hissesine sahip olmak ne anlama gelir?',
    [
      'Şirkete borç vermiş olmak',
      'Şirketin küçük bir ortağı olmak',
      'Şirketin ürünlerinde kalıcı indirim hakkı kazanmak',
      'Bilmiyorum',
    ],
    1,
  ],
  [
    "Yıllık %10 getiri sağlayan bir yatırımda kazancı çekmeden bırakırsan, 100 ₺'n 2 yıl sonra kaç ₺ olur?",
    ['120 ₺', '121 ₺', '110 ₺', 'Bilmiyorum'],
    1,
  ],
];

export const ATTENTION_QUESTION = [
  'Dikkat kontrolü: Bu soruda lütfen "Mevduat" seçeneğini işaretle.',
  ['Hisse senedi', 'Altın', 'Mevduat', 'Döviz'],
  2,
];

export function testQuestionSequence(kind) {
  return kind === 'pre' ? [0, 1, 'att', 2, 5, 6, 7] : [3, 4];
} // 0-2 Big Three, 5-7 ek maddeler; 3-4 son test
