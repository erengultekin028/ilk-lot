// Piyasa simülatörünün sabit verileri: hisse tabanı, haber takvimi, hisse renkleri.

// ═════════════════ SİMÜLATÖR ═════════════════
// Uyaranlardan ayrı bir tohum akışı: simülatör, görev setlerini etkilemez.
// Fiyat = ortak piyasa hareketi + hisseye özgü gürültü. Kriz dışında sürüklenme yok (ortalamaya dönüş yok):
// düşüşten sonra kendiliğinden toparlanma beklenmez, "tutmak kazandırır" dersi verilmez.
export const STOCK_BASES = [
  ['KOZAL', 'Koza Altın', 84.2, 'Madencilik'],
  ['TUPRS', 'Tüpraş', 42.6, 'Enerji'],
  ['PGSUS', 'Pegasus', 27.9, 'Havacılık'],
  ['THYAO', 'Türk Hava Yolları', 156.4, 'Havacılık'],
  ['ASELS', 'Aselsan', 63.1, 'Savunma'],
  ['BIMAS', 'BİM', 118.5, 'Perakende'],
];

// Haberler sabit takvimle gelir: her krizden birkaç gün önce bir uyarı, kriz başında bir haber, aralarda nötr haberler
// [gün, metin, yön, ilgili hisseler] — ilgili hisseler, hisse detay sayfasındaki haber listesi için
// b18: 12 tarafsız haber eklendi (yön 0). KURAL: uyarı/kriz haberlerinin günleri ve metinleri DEĞİŞMEZ; her kriz için "uyarıdan krizin bitişi + 20 gün"
// penceresine (46-79, 129-162, 212-245) yeni haber konmaz, çünkü Portföy'de son haber gösterilir ve olumsuz haber o pencerede görünür kalmalı.
// Yeni haberler yön ipucu vermez (karışık/yatay/takvim içerikli) ve her hisseye dengeli dağıtıldı.
export const SIMULATOR_NEWS = [
  [0, 'Piyasa güne sakin başladı.', 0, []],
  [10, 'Borsa İstanbul işlem hacmi geçen haftaya yakın seyretti.', 0, []],
  [22, 'Perakende sektöründe talep istikrarlı seyrediyor.', 0, ['BIMAS']],
  [34, 'Madencilik şirketleri yeni üretim verilerini paylaştı.', 0, ['KOZAL']],
  [40, 'Şirketlerin bilanço takvimi açıklandı.', 0, []],
  [46, 'Enerji sektöründe arz sorunu konuşuluyor.', -1, ['TUPRS']],
  [52, 'Enerji ve madencilik hisselerinde sert satış.', -1, ['TUPRS', 'KOZAL']],
  [82, 'Perakende zincirleri mağaza açılışlarını sürdürüyor.', 0, ['BIMAS']],
  [90, 'Piyasa günü yatay tamamladı.', 0, []],
  [100, 'Savunma sanayii fuarı bu hafta düzenleniyor.', 0, ['ASELS']],
  [112, 'Döviz kurları dar bir bantta hareket etti.', 0, []],
  [122, 'Analistlerin piyasa beklentileri karışık.', 0, []],
  [129, 'Savunma ihracatına yönelik kısıtlama sinyali.', -1, ['ASELS']],
  [135, 'Savunma hisselerinde satış dalgası.', -1, ['ASELS']],
  [172, 'Havayolları yeni rotalar duyurdu.', 0, ['THYAO', 'PGSUS']],
  [195, 'Havalimanlarında yolcu sayısı geçen aya yakın.', 0, ['THYAO', 'PGSUS']],
  [204, 'Enerji şirketleri bilanço tarihlerini duyurdu.', 0, ['TUPRS']],
  [212, 'Jet yakıtı fiyatlarında ani artış haberi.', -1, ['THYAO', 'PGSUS']],
  [218, 'Havacılık hisselerinde sert düşüş.', -1, ['THYAO', 'PGSUS']],
  [250, 'Madencilik şirketlerinden yeni sondaj çalışması duyurusu.', 0, ['KOZAL']],
  [262, 'Piyasa sakin bir gün geçirdi.', 0, []],
  [276, 'Perakende endeksi haftayı yatay kapattı.', 0, ['BIMAS']],
  [288, 'İşlem hacmi sakin; yatırımcılar yeni haberleri bekliyor.', 0, []],
];

// Dağılım renkleri: yeşil ve kırmızı bilerek yok (uygulamada fiyat yönü anlamı taşıyorlar)
export const STOCK_COLORS = {
  KOZAL: '#1F4E8C',
  TUPRS: '#C98A1B',
  PGSUS: '#2B9DA3',
  THYAO: '#7B5FC4',
  ASELS: '#D9468F',
  BIMAS: '#5B6B8C',
  cash: '#C9D0DC',
};
