// Serbest mod seviyeleri, senaryoları, portföyleri ve haber havuzları.

// ═════════════════ SERBEST MOD (b19) ═════════════════
// Çalışmanın parçası DEĞİL: çalışma bittikten sonra bilgilendirme ekranından açılır; hiçbir şey kaydedilmez, bekleme ekranı ve satış gerekçesi sorusu yoktur.
// Süre sınırı yok. Toplam para, başlangıcın (1 − lim) katının altına inince oyun biter. Zorluk: kayıp sınırı, olayların büyüklüğü ve sıklığı, uyarı süresi, haber derinliği (d: 0 kısa/net, 1 nedenli, 2 çok katmanlı/belirsiz).
// Olaylar (düşüş ya da yükseliş) S.sim.crises'ta, haberler S.sim.news'te tutulur; ikisi de tohumdan ileriye doğru üretilir. Çalışma simülatörü bunlara dokunmaz (m.free tanımsız).
// up: yükseliş olasılığı (hepsinde 0,5: yükseliş düşüşün log-simetriği, beklenen sürüklenme yok). mkt: olayın tüm piyasayı kapsama olasılığı. warn: uyarının olaydan kaç gün önce geldiği.
// Değerler, pasif ve tam yatırımlı iki basit stratejiyle simülasyonda ayarlandı (insan oyunuyla denenmedi).
export const FREE_PLAY_LEVELS = {
  k: { ad: 'Kolay', lim: 0.3, drop: [0.12, 0.18], gap: [55, 90], up: 0.5, mkt: 0, warn: 8, d: 0 },
  o: { ad: 'Orta', lim: 0.2, drop: [0.18, 0.28], gap: [30, 55], up: 0.5, mkt: 0.2, warn: 6, d: 1 },
  z: { ad: 'Zor', lim: 0.1, drop: [0.2, 0.32], gap: [25, 45], up: 0.5, mkt: 0.3, warn: 4, d: 2 },
};

export const FREE_PLAY_SECTORS = [
  ['Madencilik', ['KOZAL']],
  ['Enerji', ['TUPRS']],
  ['Havacılık', ['THYAO', 'PGSUS']],
  ['Savunma', ['ASELS']],
  ['Perakende', ['BIMAS']],
  ['Genel piyasa', ['KOZAL', 'TUPRS', 'PGSUS', 'THYAO', 'ASELS', 'BIMAS']],
];

// Her sektör: [düşüş uyarısı, düşüş haberi, yükseliş uyarısı, yükseliş haberi]; her biri [kolay, orta, zor]. Zor uyarılar yön vermez (iki yönde aynı metin).
export const FREE_PLAY_NEWS = [
  [
    [
      'Madencilik sektöründe satış baskısı bekleniyor.',
      'Maliyet artışı sürerken madencilik sektöründe satış baskısı bekleniyor.',
      'Madencilik sektöründe hareketli bir gün bekleniyor: üretim maliyetleri ve talep verisi karşıt sinyal veriyor.',
    ],
    [
      'Madencilik hisselerinde sert düşüş.',
      'Üretim maliyetlerinin beklentinin üzerinde gelmesiyle madencilik hisselerinde sert düşüş.',
      'Madencilik hisselerinde sert düşüş: maliyet verisi beklentinin üzerinde geldi; bazı analistler düşüşü aşırı buluyor, işlem hacmi normalin iki katına çıktı.',
    ],
    [
      'Madencilik sektöründe alım ilgisi bekleniyor.',
      'Talepteki toparlanma sürerken madencilik sektöründe alım ilgisi bekleniyor.',
      'Madencilik sektöründe hareketli bir gün bekleniyor: üretim maliyetleri ve talep verisi karşıt sinyal veriyor.',
    ],
    [
      'Madencilik hisselerinde sert yükseliş.',
      'Talep verisinin güçlü gelmesiyle madencilik hisselerinde sert yükseliş.',
      'Madencilik hisselerinde sert yükseliş: talep verisi beklentiyi aştı, ancak şirketlerin bir kısmı kâr satışı uyarısı yaptı ve yükselişin sürüp sürmeyeceği tartışılıyor.',
    ],
  ],
  [
    [
      'Enerji sektöründe satış baskısı bekleniyor.',
      'Rafineri bakım takviminin uzamasıyla enerji sektöründe satış baskısı bekleniyor.',
      'Enerji sektöründe hareketli bir gün bekleniyor: arz verisi ve talep tahminleri karşıt sinyal veriyor.',
    ],
    [
      'Enerji hisselerinde sert düşüş.',
      'Rafineri duruşlarının uzamasıyla enerji hisselerinde sert düşüş.',
      'Enerji hisselerinde sert düşüş: duruşun süresi belirsiz; bazı analistler geçici, bazıları kalıcı kapasite kaybı olduğunu söylüyor.',
    ],
    [
      'Enerji sektöründe alım ilgisi bekleniyor.',
      'Rafineri marjlarındaki iyileşmeyle enerji sektöründe alım ilgisi bekleniyor.',
      'Enerji sektöründe hareketli bir gün bekleniyor: arz verisi ve talep tahminleri karşıt sinyal veriyor.',
    ],
    [
      'Enerji hisselerinde sert yükseliş.',
      'Rafineri marjlarının beklentiyi aşmasıyla enerji hisselerinde sert yükseliş.',
      'Enerji hisselerinde sert yükseliş: marjlar beklentiyi aştı, ancak bunun mevsimsel mi kalıcı mı olduğu belirsiz.',
    ],
  ],
  [
    [
      'Havacılık sektöründe satış baskısı bekleniyor.',
      'Yakıt maliyetlerinin artmasıyla havacılık sektöründe satış baskısı bekleniyor.',
      'Havacılık sektöründe hareketli bir gün bekleniyor: yolcu verisi ve yakıt maliyeti karşıt sinyal veriyor.',
    ],
    [
      'Havacılık hisselerinde sert düşüş.',
      'Yakıt maliyetlerindeki ani artışla havacılık hisselerinde sert düşüş.',
      'Havacılık hisselerinde sert düşüş: yakıt maliyeti sıçradı, yolcu doluluğu ise yüksek; piyasa hangisine ağırlık vereceğini tartışıyor.',
    ],
    [
      'Havacılık sektöründe alım ilgisi bekleniyor.',
      'Yakıt fiyatlarının gerilemesiyle havacılık sektöründe alım ilgisi bekleniyor.',
      'Havacılık sektöründe hareketli bir gün bekleniyor: yolcu verisi ve yakıt maliyeti karşıt sinyal veriyor.',
    ],
    [
      'Havacılık hisselerinde sert yükseliş.',
      'Yakıt fiyatlarındaki gerilemeyle havacılık hisselerinde sert yükseliş.',
      'Havacılık hisselerinde sert yükseliş: yakıt fiyatları geriledi, ancak sezon sonrası talebin azalması bekleniyor.',
    ],
  ],
  [
    [
      'Savunma sektöründe satış baskısı bekleniyor.',
      'İhracat izinlerindeki gecikmeyle savunma sektöründe satış baskısı bekleniyor.',
      'Savunma sektöründe hareketli bir gün bekleniyor: sipariş haberleri ve ihracat izinleri karşıt sinyal veriyor.',
    ],
    [
      'Savunma hisselerinde sert düşüş.',
      'İhracat izinlerinin gecikmesiyle savunma hisselerinde sert düşüş.',
      'Savunma hisselerinde sert düşüş: ihracat izinleri gecikti, sipariş defteri ise dolu; gecikmenin kalıcı olup olmayacağı belirsiz.',
    ],
    [
      'Savunma sektöründe alım ilgisi bekleniyor.',
      'Yeni sipariş görüşmeleriyle savunma sektöründe alım ilgisi bekleniyor.',
      'Savunma sektöründe hareketli bir gün bekleniyor: sipariş haberleri ve ihracat izinleri karşıt sinyal veriyor.',
    ],
    [
      'Savunma hisselerinde sert yükseliş.',
      'Yeni sipariş haberleriyle savunma hisselerinde sert yükseliş.',
      'Savunma hisselerinde sert yükseliş: sipariş haberi geldi, ancak sözleşme ayrıntıları açıklanmadı ve teslimat takvimi belirsiz.',
    ],
  ],
  [
    [
      'Perakende sektöründe satış baskısı bekleniyor.',
      'Tüketici harcamalarındaki yavaşlamayla perakende sektöründe satış baskısı bekleniyor.',
      'Perakende sektöründe hareketli bir gün bekleniyor: satış hacmi ve kâr marjı karşıt sinyal veriyor.',
    ],
    [
      'Perakende hisselerinde sert düşüş.',
      'Tüketici harcamalarının beklentinin altında kalmasıyla perakende hisselerinde sert düşüş.',
      'Perakende hisselerinde sert düşüş: harcamalar beklentinin altında kaldı, ancak mağaza sayısındaki artış marjı destekleyebilir.',
    ],
    [
      'Perakende sektöründe alım ilgisi bekleniyor.',
      'Tüketici harcamalarındaki toparlanmayla perakende sektöründe alım ilgisi bekleniyor.',
      'Perakende sektöründe hareketli bir gün bekleniyor: satış hacmi ve kâr marjı karşıt sinyal veriyor.',
    ],
    [
      'Perakende hisselerinde sert yükseliş.',
      'Tüketici harcamalarının beklentiyi aşmasıyla perakende hisselerinde sert yükseliş.',
      'Perakende hisselerinde sert yükseliş: harcamalar beklentiyi aştı, ancak gelir artışının ne kadarının fiyat artışından geldiği tartışılıyor.',
    ],
  ],
  [
    [
      'Genel piyasada satış baskısı bekleniyor.',
      'Küresel risk iştahının zayıflamasıyla genel piyasada satış baskısı bekleniyor.',
      'Genel piyasada hareketli bir gün bekleniyor: yurt dışı sinyalleri ve yerel veri karışık.',
    ],
    [
      'Piyasada genel sert düşüş.',
      'Küresel risk iştahının zayıflamasıyla piyasada genel sert düşüş.',
      'Piyasada genel sert düşüş: yurt dışı kaynaklı satış dalgası tüm sektörlere yayıldı, ancak yerel verilerde bozulma görülmüyor.',
    ],
    [
      'Genel piyasada alım ilgisi bekleniyor.',
      'Küresel risk iştahının artmasıyla genel piyasada alım ilgisi bekleniyor.',
      'Genel piyasada hareketli bir gün bekleniyor: yurt dışı sinyalleri ve yerel veri karışık.',
    ],
    [
      'Piyasada genel sert yükseliş.',
      'Küresel risk iştahının artmasıyla piyasada genel sert yükseliş.',
      'Piyasada genel sert yükseliş: yurt dışı kaynaklı alım tüm sektörlere yayıldı, ancak işlem hacmi düşük olduğundan hareketin kalıcılığı belirsiz.',
    ],
  ],
];

export const FREE_PLAY_NEUTRAL_NEWS = [
  [
    'Piyasa güne sakin başladı.',
    'Piyasa günü yatay tamamladı.',
    'İşlem hacmi geçen haftaya yakın seyretti.',
    'Döviz kurları dar bir bantta hareket etti.',
    'Şirketlerin bilanço takvimi açıklandı.',
  ],
  [
    'Piyasa yatay seyrediyor; yatırımcılar yeni bilanço verilerini bekliyor.',
    'Döviz kurları dar bantta; ihracatçı şirketlerde belirgin bir hareket yok.',
    'İşlem hacmi geçen haftaya yakın; sektörler arasında belirgin bir ayrışma görülmüyor.',
    'Faiz kararı beklentisi nedeniyle piyasada temkinli bir gün yaşanıyor.',
    'Bilanço takvimi açıklandı; ilk sonuçların önümüzdeki hafta gelmesi bekleniyor.',
  ],
  [
    'Piyasa yatay seyrediyor: bazı analistler kısa vadeli düşüş, bazıları toparlanma bekliyor.',
    'Yabancı yatırımcı payı ile yerel işlem hacmi zıt yönde hareket etti; günün toplam etkisi nötr.',
    'Faiz beklentileri ve enflasyon verisi bir arada gündemde; piyasa yönsüz kaldı.',
    'Bilanço takvimi açıklandı; beklentiler sektörlere göre farklı yönlerde, genel görünüm net değil.',
    'Döviz kuru dar bantta ama vadeli işlemlerde hareketlilik arttı; yön konusunda net bir ipucu yok.',
  ],
];

// b23: senaryo (olay sıklığı, büyüklüğü ve yönü) ve başlangıç portföyü seçenekleri. 'r' (rastgele) çarpanları 1 ve up=null: b19-b22 ile birebir aynı olay takvimi (rnd2 çağrı sırası değişmez).
export const FREE_PLAY_SCENARIOS = {
  r: {
    ad: 'Rastgele',
    gap: 1,
    drop: 1,
    up: null,
    tx: 'Olaylar zorluk seviyene göre gelir; düşüş ve yükseliş eşit olasılıkta.',
  },
  s: {
    ad: 'Sakin dönem',
    gap: 1.6,
    drop: 0.7,
    up: null,
    tx: 'Olaylar daha seyrek ve daha küçük; piyasa çoğu zaman sakin.',
  },
  k: {
    ad: 'Kriz dönemi',
    gap: 0.7,
    drop: 1.1,
    up: 0.25,
    tx: 'Olaylar daha sık ve çoğu düşüş; oyun daha çabuk bitebilir.',
  },
  y: {
    ad: 'Yükseliş dönemi',
    gap: 1,
    drop: 1,
    up: 0.75,
    tx: 'Olayların çoğu yükseliş, ama düşüşler de gelir.',
  },
};

export const FREE_PLAY_PORTFOLIOS = {
  d: { ad: 'Dengeli', tx: "Altı hissede ₺10.000'er lot ve ₺40.000 nakit (çalışmadaki gibi)." },
  n: { ad: 'Tamamen nakit', tx: '₺100.000 nakitle başlarsın; hisseleri kendin seçip alırsın.' },
  h: { ad: 'Hisse ağırlıklı', tx: 'Altı hissede eşit paylarla ₺90.000, ₺10.000 nakit.' },
};

export const FREE_PLAY_LOSS_LIMITS = [0.1, 0.2, 0.3, 0.5];
