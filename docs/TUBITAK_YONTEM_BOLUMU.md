# TÜBİTAK 2209-A: yöntem bölümü taslağı

> **Taslaktır.** Başvuru formunun sayfa ya da kelime sınırını bilmiyorum; bu yüzden **uzun sürüm (A)** ve **kısa sürüm (B, yaklaşık 300 kelime)** var. `[DOLDUR]` ve `[KARAR]` işaretli yerleri sen ve danışmanın tamamlamalısın. Metin, `docs/ON_KAYIT_TASLAGI.md` ve `etik/ETIK_KURUL_BASVURU_TASLAGI.md` ile tutarlı yazıldı; birini değiştirirsen diğerlerini de güncelle.

## Yazmadan önce verilecek kararlar

1. **[KARAR] Örneklem yolu:** mevcut tasarımla grup başına 100 tamamlayan, ya da tasarım güçlendirilip grup başına 60. Aşağıdaki 2. bölümde ikisi de yazılı; birini sil. Karar pilot sonucuna bağlı olabilir (8. bölüm).
2. **[KARAR] Birincil model:** kümeye dayanıklı lojistik regresyon (varsayılan) ya da rastgele kesişimli karma model.
3. **[DOLDUR]** Proje adı, yürütücü ve danışman, ön kayıt bağlantısı (OSF), etik kurul onay bilgisi.

---

## A. Uzun sürüm

### 1. Araştırma modeli

Çalışma, **randomize kontrollü** ve **2 (grup: simülatörde bekleme ekranı var / yok; gruplar arası) × 2 (bölüm: simülatör öncesi / sonrası; bölüm içi)** karışık desenlidir. Her katılımcı tek bir oturumda (yaklaşık 30 dakika, telefonda çevrimiçi) üç bölümden geçer. Katılımcılar, önceden hazırlanıp 4'lük bloklarda dengelenmiş rastgele bir listeyle iki gruba atanır; karar setlerinin sunum sırası da gruplar içinde dengelenir. Katılımcı grubunu ve sırasını seçemez.

### 2. Evren ve örneklem

Evren, 18 yaş ve üzeri üniversite öğrencileridir. İşe alım: [DOLDUR]. 18 yaş altı beyan edenler çalışmadan çıkarılır ve verileri saklanmaz.

**Güç analizi.** Birincil test (grup × bölüm etkileşimi; kümeye dayanıklı lojistik regresyon, t dağılımı, df = G − 1, α = 0,05 iki yönlü) için güç, testin kendisini kullanan bir simülasyonla (her hücre için 1.000 tekrar) hesaplandı. Varsayımlar: 1. bölümde ortalama %50 satış, kişiler arası değişkenlik σ = 1,2 (logit), 3. bölümde iki grupta ortak değişim −0,2, A grubundaki katılımcıların %70'inin simülatörde bekleme ekranını görmesi. **Bu varsayımlar ölçülmemiştir**; pilotla güncellenecektir (8. bölüm). Etki yokken (OR = 1) test, denenen tüm örneklem büyüklüklerinde yaklaşık %5 hata vermiştir (ölçülen: %5-6).

| Grup başına tamamlayan | OR = 0,5 (ek −9,6 yp) | OR = 0,4 (ek −12,6 yp) | OR = 0,3 (ek −16,3 yp) |
|---|---|---|---|
| 60 | %39 | %58 | %79 |
| 100 | %55 | %81 | %95 |
| 150 | %78 | %94 | %100 |

OR, bekleme ekranını gören katılımcıdaki gerçek odds oranıdır; "ek" sütunu, A grubunun B'ye göre beklenen ek düşüşüdür (yüzde puan). Tablo, `analiz/ilklot_guc.py` ile yeniden üretilebilir.

**[KARAR] Seçenek B (mevcut tasarım):** Grup başına **100 tamamlayan** (kayıp %10 varsayımıyla ≈ 112 işe alım, toplam ≈ 224) hedeflenmiştir. Bu örneklemle %80 güce yalnızca **OR ≈ 0,4 ya da daha güçlü** bir etkide ulaşılır; OR = 0,5 ise ≈ %55 güçle yakalanır. Bu bir sınırlılıktır ve 8. bölümde ele alınmıştır.

**[KARAR] Seçenek A (güçlendirilmiş tasarım):** Bölüm başına "sert düşüş + zarar" denemesi 4'ten 8'e çıkarılır ve A grubundaki katılımcıların bekleme ekranıyla karşılaşması sağlanır (maruz kalma %95). Bu durumda grup başına **60 tamamlayan** (≈ 67 işe alım, toplam ≈ 134) ile OR = 0,5 için güç ≈ %89, OR = 0,4 için ≈ %98'dir.

**Durdurma kuralı:** Sabit örneklem; ara analiz yoktur. Hedefe [DOLDUR: son tarih]'e kadar ulaşılamazsa, ulaşılan n ve bu n'deki güç raporlanır.

### 3. Veri toplama aracı

Çalışma için geliştirilen **İlk Lot** web uygulaması kullanılır (telefonda tarayıcıdan, kurulum gerektirmez). Piyasa ve şirket verileri **kurgusaldır**; hisse adları gerçek BIST şirketlerine aittir ve katılımcıya her aşamada fiyatların, grafiklerin ve haberlerin kurgusal olduğu bildirilir. Aracın geçerliliği için şu önlemler alınmıştır:

- **Standart uyaran:** Tüm uyaranlar sabit bir rastgele tohumdan üretilir; her katılımcı aynı karar anlarını görür.
- **Tarafsız sonuçlar:** Karar anlarında her hücrede (piyasa × pozisyon) yükseliş ve düşüş sonuçları eşit büyüklükte eşleştirilmiştir; "sat" ya da "tut" ortalamada avantaj sağlamaz. Simülatör piyasası, krizden sonra ortalamada yatay seyredecek biçimde (aday tohumlar arasından ölçütle) seçilmiştir.
- **Bölümlerden bağımsız dozlama:** Bekleme ekranı yalnızca 2. bölümde ve yalnızca A grubundadır; 1. ve 3. bölümde iki grup için de yoktur. Bu, 3. bölümdeki değişimi **aktarım** (müdahale yokken de süren etki) olarak yorumlamayı sağlar.
- **Yazılım doğrulaması:** Uygulama ve analiz kodu otomatik testlerle sınanmıştır (uygulama 44, analiz 23, araç 14 test; ayrıca testlerin hata yakaladığı bilinçli bozmalarla doğrulanmıştır). Testler simülasyon ve sahte veriyle yapıldığından gerçek veri davranışını garanti etmez.

### 4. Ölçümler

**Birincil bağımlı değişken (panik satış oranı):** Bir bölümdeki 4 "sert düşüş + zarar" karar anında son kararın "Sat" olduğu denemelerin oranı. "Sert düşüş": son haftada %10-16 düşüş; "zarar": pozisyon %12-22 zararda.

**Diğer ölçümler (keşifsel):** bekleme ekranı sayısı (doz), simülatördeki zararına satışlar ve satış gerekçeleri (Planım buydu / Haber yüzünden / Korktum / Diğerleri satıyor), her bölüm sonunda gerginlik (1-5), karar süresi, sürü bilgisinin etkisi.

**Kontrol ve kalite ölçümleri:** finansal okuryazarlık ön testi (Lusardi ve Mitchell'in "Big Three" soruları + araştırmacının yazdığı 3 ek soru; çeviri ve ek sorular doğrulanmamıştır, **[DOLDUR: doğrulama yöntemi]**), dikkat kontrolü, anlama kontrolü (3 soru), "bekleme ekranı gördün mü?" (müdahale kontrolü), "araştırma neyi ölçüyordu?" (hipotezi tahmin edenleri ayırmak için), isteğe bağlı demografik form.

### 5. Uygulama

Katılımcı onam verir (katmanlı, onay kutulu), formu doldurur, ön testi çözer, iki alıştırma, 30 saniyelik alıştırma simülatörü ve anlama kontrolüyle tanışır. **1. bölüm:** 6 karar anı (Sat / Tut / Daha al). **2. bölüm:** 7,5 dakikalık piyasa simülatörü; 6 hisseli hazır bir portföyle, üç sektörel kriz boyunca isteğe bağlı al-sat. **A grubunda**, pozisyon en az %2 zarardayken "Sat" onayından önce 10 saniyelik bir bekleme ekranı çıkar (vazgeçilebilir). İki grupta da her satışta kısa bir gerekçe sorusu vardır. **3. bölüm:** farklı hisselerle 6 karar anı. Oturum sonunda son test, müdahale kontrolü ve amaç tahmini sorulur; ardından amaç, grup ve kurgusal içerik açıklanır ve katılımcı verisini çekebilir.

### 6. Veri analizi

**Birincil analiz (ön kayıtlı):** Tamamlayan tüm katılımcılarla, "sert düşüş + zarar" denemelerinde satış olasılığı için grup, bölüm, grup × bölüm ve karar seti terimlerini içeren lojistik regresyon; standart hatalar katılımcıya göre kümelenmiş (CR1). Odds oranı ve %95 güven aralığı raporlanır; beklenen yön OR < 1'dir. **Aynı soruya bakan yardımcı analizler:** permütasyon testi, bootstrap güven aralığı, ANCOVA, Hedges g (birincil değildir; çelişirlerse çelişki raporlanır). **Duyarlılık analizi:** dikkat kontrolünü geçemeyen, anlama kontrolünde 2'den az doğru yapan ve amacı doğru tahmin eden katılımcılar çıkarılarak (amaç tahmini iki bağımsız kodlayıcıyla, uyum Cohen κ ile raporlanır). **Keşifsel analizler** Holm yöntemiyle çoklu karşılaştırma düzeltmesine tabidir. Analiz Python'da (numpy, pandas, scipy, matplotlib) yapılır; betikler ve hesaplamalar açıkça belgelenmiştir. Analiz planı veri toplamadan önce OSF'de ön kayıtla sabitlenecektir: **[DOLDUR: bağlantı]**.

### 7. Geçerlik tehditleri ve önlemler

| Tehdit | Önlem |
|---|---|
| Katılımcı amacı tahmin eder | Amaç sonda açıklanır; "amaç neydi?" sorusu ve duyarlılık analizi |
| Müdahale fark edilmez | "Bekleme gördün mü?" kontrolü; doz (ekran sayısı) kaydı |
| Uyaranların ipucu vermesi ("tut kazandırır") | Her hücrede sonuçlar dengeli; simülatör kriz sonrası yatay |
| Ön testin davranışı yönlendirmesi | Ön test yalnızca finansal okuryazarlığı ölçer; ölçülen davranışı ima etmez |
| Gruplar arası farklı kayıp | Tamamlama oranları Fisher testiyle karşılaştırılır ve raporlanır |
| Gruplar arası bulaşma (aynı üniversite) | Analizde B grubunda "bekleme gördüm" cevapları izlenir (%10'u aşarsa uyarı). Uygulamada "başkalarına anlatma" notu yalnızca bilgilendirmeden sonraki karar kartı bölümünde var; bilgilendirme metnine eklenmesi **[KARAR]** |

### 8. Sınırlılıklar ve risk yönetimi

- **Güç.** Ana ölçüt bölüm başına yalnızca 4 denemeye dayanır. Gerçek etki küçükse (OR ≈ 0,5 ya da daha zayıf), mevcut tasarımla yapılan bir çalışma çoğu zaman anlamlı sonuç üretemez. Önlemler: (i) **pilotta** (10-12 kişi) A grubunun bekleme ekranını görme oranı ölçülür ve güç hesabı bu değerle güncellenir; (ii) oran %60'ın altındaysa tasarım güçlendirilir (Seçenek A); (iii) sonuç anlamlı değilse **etkisizlik iddia edilmez**, güven aralığı verilir ve bu aralığın dışladığı etkiler belirtilir.
- **Dış geçerlik.** Piyasa simülasyonu kurgusaldır ve gerçek para kullanılmaz; sonuçlar gerçek yatırım davranışına doğrudan genellenemez.
- **Müdahale süresi.** Tek oturum ve kısa süreli müdahale: sonuçlar "kısa süreli aktarım" olarak adlandırılacak, kalıcılık iddia edilmeyecektir.
- **Maruz kalma randomize değildir.** Bekleme ekranını görmek, simülatörde zararına satış denemesine bağlıdır; bu yüzden birincil analiz tüm A katılımcılarını içerir (niyet-tedavi mantığı), "görenler"in analizi keşifseldir.
- **Gerçek şirket adları.** Katılımcıların bu şirketlere dair önceden fikri kararlarını etkileyebilir; iki grup aynı adları gördüğü için karşılaştırmayı bozmaz.

### 9. Etik

Başvuru için etik kurul onayı alınacaktır ([DOLDUR]). Katılım gönüllüdür; onam katmanlı ve onay kutuludur; kimlik bilgisi toplanmaz; veri rastgele bir kodla eşleşir; katılımcı istediği an gerekçesiz çekilebilir ve verisi silinir. Araştırmanın amacı **oturum sonunda** açıklanır (eksik bilgilendirme gerekçesi etik başvuruda ayrıntılıdır) ve katılımcıya destek bilgisi verilir. Ayrıntılar: `etik/ETIK_KURUL_BASVURU_TASLAGI.md`.

---

## B. Kısa sürüm (≈ 300 kelime)

**Yöntem.** Çalışma, randomize kontrollü, 2 (grup: simülatörde bekleme ekranı var / yok) × 2 (bölüm: simülatör öncesi / sonrası) karışık desendedir. 18 yaş ve üzeri üniversite öğrencileri, telefonda yaklaşık 30 dakikalık tek bir oturumda, geliştirilen İlk Lot web uygulamasında kurgusal bir piyasada karar verir; gerçek para kullanılmaz. Katılımcılar önceden dengelenmiş rastgele bir listeyle iki gruba ayrılır. Oturum üç bölümden oluşur: (1) 6 karar anı (Sat / Tut / Daha al), (2) 7,5 dakikalık piyasa simülatörü, (3) farklı hisselerle 6 karar anı. Yalnızca bir gruba, simülatörde zararına satış öncesi 10 saniyelik bir bekleme ekranı gösterilir; 1. ve 3. bölümde iki grupta da bekleme yoktur. Böylece 3. bölümdeki değişim, müdahale yokken de süren etkiyi (aktarım) gösterir. Amaç, oturum sonunda açıklanır.

**Uyaranlar.** Uyaranlar sabit bir tohumdan üretilir, herkes aynı karar anlarını görür; sonuçlar "sat" ya da "tut" ortalamada avantaj sağlamayacak şekilde dengelenmiştir.

**Ölçüm.** Birincil değişken, sert düşüş ve zarar anlarında satış oranıdır (bölüm başına 4 deneme). Ayrıca doz (bekleme ekranı sayısı), satış gerekçeleri, gerginlik, karar süresi, finansal okuryazarlık ön testi, dikkat ve anlama kontrolü ile müdahale kontrolü ölçülür.

**Örneklem.** Güç analizi, testin kendisini kullanan simülasyonla yapıldı. Grup başına **[100 / 60]** tamamlayan katılımcı **[%80 güçle OR ≈ 0,4'te / OR = 0,5'te %89 güçle]** hedeflenmiştir; ara analiz yapılmayacaktır.

**Analiz.** Birincil: grup × bölüm etkileşimi için, katılımcıya göre kümelenmiş standart hatalı lojistik regresyon (α = 0,05); yardımcı olarak permütasyon testi ve ANCOVA; duyarlılık analizleri ve Holm düzeltmeli keşifsel analizler. Plan OSF'de ön kayıtla sabitlenecektir.

**Sınırlılık ve risk.** Ana ölçüt az denemeye dayandığından gerçek etki küçükse güç yetersiz kalabilir; bu yüzden pilotla maruz kalma oranı ölçülecek ve gerekirse tasarım güçlendirilecektir. Anlamlı olmayan sonuç etkisizlik olarak yorumlanmayacaktır.
