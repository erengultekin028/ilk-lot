// Anlama kontrolü soru havuzları (üç havuz, her biri altı soru).

// Anlama kontrolü: alıştırmadan sonra, 1. bölümün kararlarından önce. İlk denemedeki doğru sayısı kaydedilir (görevi anladı mı?)
// 3 soru sorulur; her sıranın havuzunda 6 soru var, oturum başına her havuzdan biri rastgele seçilir (18 soru, 216 kombinasyon).
// Sıra 1: ekrandaki sayıları okumak (kâr/zarar, ödediğin). Sıra 2: "Tut" ve "Daha al". Sıra 3: "Sat" ve görevin işleyişi.
// KURAL: sorular yalnızca görevin mekaniğini sorar; hiçbiri sat/tut'tan birini önermez ya da bir sonucu "iyi/kötü" diye çerçevelemez
// (READING ile aynı ilke). Seçim grupla ilgisizdir (Math.random; kod tohumundan bağımsız), anlık görüntüde saklanır, yeniden
// yüklemede değişmez, aynı tarayıcıda bir önceki oturumdakiyle aynı soru art arda gelmez. Seçilen soru `comprehension` olayında `form`.
export const COMPREHENSION_POOLS = [
  [
    {
      q: 'Bu hisse için ₺12.000 ödedin, şu anki değeri ₺10.000. Hissen ne durumda?',
      o: ['Kârda', 'Zararda', 'Bilmiyorum'],
      a: 1,
      e: 'Şu anki değer (₺10.000) ödediğinden (₺12.000) az, yani ₺2.000 zarardasın.',
    },
    {
      q: 'Bu hisse için ₺8.000 ödedin, şu anki değeri ₺9.500. Hissen ne durumda?',
      o: ['Kârda', 'Zararda', 'Bilmiyorum'],
      a: 0,
      e: 'Şu anki değer (₺9.500) ödediğinden (₺8.000) fazla, yani ₺1.500 kârdasın.',
    },
    {
      q: 'Bu hisse için ₺15.000 ödedin, şu anki değeri ₺13.500. Hissen ne durumda?',
      o: ['Zararda', 'Kârda', 'Bilmiyorum'],
      a: 0,
      e: 'Şu anki değer (₺13.500) ödediğinden (₺15.000) az, yani ₺1.500 zarardasın.',
    },
    {
      q: 'Bir hisse için ₺10.000 ödedin, şu anki değeri de ₺10.000. Durumun ne?',
      o: ['Kârdayım', 'Zarardayım', 'Ne kâr ne zarar'],
      a: 2,
      e: 'Ödediğin tutar ile şu anki değer eşit; ne kâr var ne zarar.',
    },
    {
      q: '"Bu hisse için ödediğin" satırı neyi gösterir?',
      o: ['Hisseyi alırken verdiğin parayı', 'Bir hafta sonraki fiyatı', 'Hissenin şu anki değerini'],
      a: 0,
      e: 'Bu satır, hisseyi alırken verdiğin parayı gösterir. Şu anki değeri ise "Şu anki değeri" satırında görürsün.',
    },
    {
      q: '"Kârın / zararın" satırında kırmızı ▼ görürsen bu ne demektir?',
      o: ['Hisse ödediğinden daha değerli', 'Hissenin şu anki değeri ödediğinden az', 'Hisse satıldı'],
      a: 1,
      e: 'Kırmızı ▼ zarar demektir: şu anki değer, hisse için ödediğinden az.',
    },
  ],
  [
    {
      q: '"Tut" seçersen ne olur?',
      o: ['Hisseyi satarım', 'Hisse bende kalır, değeri artabilir ya da azalabilir', '₺5.000 daha alırım'],
      a: 1,
      e: '"Tut" hiçbir şey yapmamak demek: hisse sende kalır ve bir hafta sonraki fiyat değişimi değerini etkiler.',
    },
    {
      q: 'Bir hissede "Tut" seçtin. Hisseye ne olur?',
      o: ['Hisse hemen satılır', '₺5.000 daha hisse alınır', 'Hisse bende kalır'],
      a: 2,
      e: '"Tut" hiçbir şey yapmamak demek: hisse sende kalır ve bir hafta sonraki fiyat değişimi değerini etkiler.',
    },
    {
      q: 'Bir hissede "Tut" seçtin. Bir hafta sonra fiyat yükselirse ne olur?',
      o: ['Hissenin değeri artar', 'Bir şey olmaz, hisse artık bende değil', 'Hisse otomatik satılır'],
      a: 0,
      e: '"Tut" dediğinde hisse sende kalır; fiyat yükselirse değeri de artar.',
    },
    {
      q: '"Daha al" seçersen ne olur?',
      o: ['Elimdeki hisse satılır', 'Aynı hisseden ₺5.000 değerinde daha alırım', 'Hiçbir şey olmaz'],
      a: 1,
      e: '"Daha al" seçince aynı hisseden ₺5.000 değerinde ek alım yapılır.',
    },
    {
      q: 'Hangi seçenek elindeki hisse miktarını artırır?',
      o: ['Tut', 'Sat', 'Daha al'],
      a: 2,
      e: 'Yalnızca "Daha al" aynı hisseden ek alım yapar. "Tut" hiçbir şeyi değiştirmez, "Sat" hisseyi elinden çıkarır.',
    },
    {
      q: 'Hangi seçenek "hiçbir şey yapmamak" demektir?',
      o: ['Sat', 'Tut', 'Daha al'],
      a: 1,
      e: '"Tut" hiçbir şey yapmamak demektir: hisse sende kalır.',
    },
  ],
  [
    {
      q: '"Sat" seçersen, bir hafta sonra fiyat değişince bu seni etkiler mi?',
      o: ['Evet, etkiler', 'Hayır, etkilemez'],
      a: 1,
      e: 'Sattığında hisse artık sende değildir; sonraki fiyat değişimi seni etkilemez.',
    },
    {
      q: 'Bir hissede "Sat" seçtin. Hisseye ne olur?',
      o: ['Hisse satılır, artık bende olmaz', 'Hisse bende kalır', '₺5.000 daha hisse alınır'],
      a: 0,
      e: 'Sattığında hisse artık sende değildir; sonraki fiyat değişimi seni etkilemez.',
    },
    {
      q: 'Bir hisseyi sattın. Bir hafta sonra fiyat yükselirse bu senin paranı değiştirir mi?',
      o: ['Evet, paran artar', 'Hayır, hisse artık sende değil'],
      a: 1,
      e: 'Sattığında hisse artık sende değildir; sonraki fiyat değişimi seni etkilemez.',
    },
    {
      q: 'Kararının sonucu ne zaman gösterilir?',
      o: [
        'Bütün kararlar bittikten sonra',
        'Hiç gösterilmez',
        'Kararından hemen sonra, bir hafta sonrası olarak',
      ],
      a: 2,
      e: 'Her kararın sonucu, bir hafta sonrası olarak hemen gösterilir.',
    },
    {
      q: 'Kararlarında doğru ya da yanlış bir cevap var mı?',
      o: ['Evet, tek bir doğru cevap var', 'Hayır, doğru ya da yanlış cevap yok'],
      a: 1,
      e: 'Doğru ya da yanlış cevap yok; kararını kendin verirsin.',
    },
    {
      q: 'Her kararda elindeki hissenin değeri yaklaşık ne kadardır?',
      o: ['₺1.000', '₺10.000', '₺100.000'],
      a: 1,
      e: 'Her kararda elinde yaklaşık ₺10.000 değerinde bir hisse var.',
    },
  ],
];
