// Piyasa simülatörünün sabit verileri: hisse tabanı, haber takvimi, hisse renkleri.

// ═════════════════ SİMÜLATÖR ═════════════════
// Uyaranlardan ayrı bir tohum akışı: simülatör, görev setlerini etkilemez.
// Fiyat = ortak piyasa hareketi + hisseye özgü gürültü. Kriz dışında sürüklenme yok (ortalamaya dönüş yok):
// düşüşten sonra kendiliğinden toparlanma beklenmez, "tutmak kazandırır" dersi verilmez.
export const STOCK_BASES = [
  ['ALTKY', 'Altınköy Madencilik', 84.2, 'Madencilik'],
  ['PTRVA', 'Petrova Enerji', 42.6, 'Enerji'],
  ['BLTAY', 'Bulutay Hava', 27.9, 'Havacılık'],
  ['GKYOL', 'Gökyol Havayolları', 156.4, 'Havacılık'],
  ['TUNCS', 'Tunç Savunma', 63.1, 'Savunma'],
  ['SEPMK', 'Sepet Market', 118.5, 'Perakende'],
];

// Haberler sabit takvimle gelir: her krizden birkaç gün önce bir uyarı, kriz başında bir haber, aralarda nötr haberler
// [gün, metin, yön, ilgili hisseler] — ilgili hisseler, hisse detay sayfasındaki haber listesi için
// b18: 12 tarafsız haber eklendi (yön 0). KURAL: uyarı/kriz haberlerinin günleri ve metinleri DEĞİŞMEZ; her kriz için "uyarıdan krizin bitişi + 20 gün"
// penceresine (46-79, 129-162, 212-245) yeni haber konmaz, çünkü Portföy'de son haber gösterilir ve olumsuz haber o pencerede görünür kalmalı.
// Yeni haberler yön ipucu vermez (karışık/yatay/takvim içerikli) ve her hisseye dengeli dağıtıldı.
export const SIMULATOR_NEWS = [
  [0, 'Piyasa güne sakin başladı.', 0, []],
  [10, 'Piyasada işlem hacmi geçen haftaya yakın seyretti.', 0, []],
  [22, 'Perakende sektöründe talep istikrarlı seyrediyor.', 0, ['SEPMK']],
  [34, 'Madencilik şirketleri yeni üretim verilerini paylaştı.', 0, ['ALTKY']],
  [40, 'Şirketlerin bilanço takvimi açıklandı.', 0, []],
  [46, 'Enerji sektöründe arz sorunu konuşuluyor.', -1, ['PTRVA']],
  [52, 'Enerji ve madencilik hisselerinde sert satış.', -1, ['PTRVA', 'ALTKY']],
  [82, 'Perakende zincirleri mağaza açılışlarını sürdürüyor.', 0, ['SEPMK']],
  [90, 'Piyasa günü yatay tamamladı.', 0, []],
  [100, 'Savunma sanayii fuarı bu hafta düzenleniyor.', 0, ['TUNCS']],
  [112, 'Döviz kurları dar bir bantta hareket etti.', 0, []],
  [122, 'Analistlerin piyasa beklentileri karışık.', 0, []],
  [129, 'Savunma ihracatına yönelik kısıtlama sinyali.', -1, ['TUNCS']],
  [135, 'Savunma hisselerinde satış dalgası.', -1, ['TUNCS']],
  [172, 'Havayolları yeni rotalar duyurdu.', 0, ['GKYOL', 'BLTAY']],
  [195, 'Havalimanlarında yolcu sayısı geçen aya yakın.', 0, ['GKYOL', 'BLTAY']],
  [204, 'Enerji şirketleri bilanço tarihlerini duyurdu.', 0, ['PTRVA']],
  [212, 'Jet yakıtı fiyatlarında ani artış haberi.', -1, ['GKYOL', 'BLTAY']],
  [218, 'Havacılık hisselerinde sert düşüş.', -1, ['GKYOL', 'BLTAY']],
  [250, 'Madencilik şirketlerinden yeni sondaj çalışması duyurusu.', 0, ['ALTKY']],
  [262, 'Piyasa sakin bir gün geçirdi.', 0, []],
  [276, 'Perakende endeksi haftayı yatay kapattı.', 0, ['SEPMK']],
  [288, 'İşlem hacmi sakin; yatırımcılar yeni haberleri bekliyor.', 0, []],
];

// Dağılım renkleri: yeşil ve kırmızı bilerek yok (uygulamada fiyat yönü anlamı taşıyorlar)
export const STOCK_COLORS = {
  ALTKY: '#1F4E8C',
  PTRVA: '#C98A1B',
  BLTAY: '#2B9DA3',
  GKYOL: '#7B5FC4',
  TUNCS: '#D9468F',
  SEPMK: '#5B6B8C',
  cash: '#C9D0DC',
};
