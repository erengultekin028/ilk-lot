# İlk Lot: ön kayıt taslağı (OSF)

> **Bu bir taslaktır.** `[DOLDUR]` ve `[KARAR]` işaretli yerleri sen ve danışmanın tamamlamalısın. Ön kayıt, **veri toplamaya başlamadan önce** yapılmalıdır; sonradan yapılan kayıt ön kayıt sayılmaz. Hiçbir sayı bu belgede kendiliğinden doğru kabul edilmemeli; güç tabloları aşağıda yazılı varsayımlara bağlıdır.

## Kayda geçmeden önce karar verilecekler

1. **[KARAR] Örneklem yolu.** Mevcut tasarımla grup başına en az ~100 tamamlayan katılımcı mı, yoksa tasarımı değiştirip (bölüm başına 8 deneme, A'daki herkesin bekleme ekranını görmesi) grup başına ~60 mı? Ayrıntı 3. bölümde. Bu karar uygulamayı da etkiler, o yüzden **uygulama değişecekse önce değişiklik yapılıp test edilmeli, sonra kayıt yapılmalı.**
2. **[KARAR] Birincil model.** Varsayılan: kümeye dayanıklı lojistik regresyon. Rastgele kesişimli karma model istenirse bu belgenin 5. bölümü ve `ilklot_analiz.py` değişmeli.
3. **[KARAR] Yön.** Hipotez yönlüdür; test **iki yönlüdür** (varsayılan, daha tutucu). Tek yönlü test seçilecekse nedeni yazılmalı.
4. **[KARAR]** Ölçek çevirisi. Ön test, Lusardi ve Mitchell'in "Big Three" sorularının benim yaptığım Türkçe çevirisidir (ön teste ayrıca 3 **doğrulanmamış, araştırmacı yazımı** madde eklendi: risk-getiri ilişkisi, hisse sahipliği, bileşik getiri; bu maddeler puanı inceltir, ölçek özelliği iddia edilmez; yalnızca Big Three ile duyarlılık analizi raporlanır); geri çeviri ya da yayımlanmış bir Türkçe uyarlamayla doğrulanmadı. Atıf bilgilerini (özellikle Big Five uzantısı için) kendin doğrula.
5. **[DOLDUR]** Yazarlar, kurum, etik kurul onay bilgisi, kayıt tarihi.
6. **[KARAR]** Pilot: 10-12 kişilik pilot (`docs/PILOT_PLANI.md`) kayıttan önce yapılacak ve örneklem kararı pilot sonrası verilecek mi?
7. **[KARAR]** Bilgi düzeyi analizi: "Bilgi düzeyi × grup × bölüm" (aşağıda 5. bölüm) ikincil/keşifsel analiz olarak kayda geçsin mi? Önerim: evet, **keşifsel** ve **iki yönlü** olarak. Düşük güçlüdür (aşağıya bak); anlamlı çıkmaması "bilgiyle değişmiyor" anlamına gelmez.

## 1. Çalışma bilgileri

**Başlık:** [DOLDUR]

**Açıklama:** Genç yatırımcılarda zararına satıştan önce uygulanan kısa bir bekleme süresinin, panik satış davranışını azaltıp azaltmadığı ve bu etkinin müdahale ortadan kalktığında sürüp sürmediği (kısa süreli aktarım).

**Hipotezler**

- **H1 (birincil, doğrulayıcı).** Simülatörde zararına satış öncesi 10 saniyelik bekleme ekranıyla karşılaşan grupta (A), "sert düşüş + zarar" karar anlarında satış oranı, simülatörden sonra (3. bölüm) simülatörden öncesine (1. bölüm) göre, bekleme ekranı olmayan gruba (B) kıyasla daha çok azalır. Test edilecek parametre: grup × bölüm etkileşimi; beklenen yön odds oranı (OR) < 1.
- **H2 (keşifsel).** A grubunda bekleme ekranını görme sayısı arttıkça azalma büyür (doz-yanıt).
- **Diğer keşifsel sorular.** Satış gerekçeleri ("Korktum" payı), gerginlik puanları, karar süresi, sürü bilgisinin etkisi.

## 2. Tasarım planı

- **Tür:** Randomize, grup arası (A / B) × bölüm içi (1. / 3. bölüm); tek oturum, yaklaşık 30 dakika; telefonda çevrimiçi.
- **Randomizasyon:** Katılım kodları önceden, 4'lük bloklarda (2 A + 2 B) rastgele sıralanmış ve kartlara basılmıştır. Karar setlerinin sırası (X→Y / Y→X) bloklar içinde gruplar arasında dengelenmiştir. Katılımcı grubunu ve sırasını seçemez.
- **Körleme:** Katılımcılar araştırmanın amacını ve gruplaşmayı bilmez; amaç oturum sonunda açıklanır. Müdahale (bekleme ekranı) A grubunda görünür olduğu için tam körlük yoktur; bunun için "bekleme gördün mü?" sorusu ve "araştırma neyi ölçüyordu?" sorusu vardır. Araştırmacı panosunda yalnızca süreç bilgisi (katılım, grup dengesi, kayıp, veri kalitesi) gösterilir, sonuç değişkenleri gösterilmez; ancak CSV dışa aktarımı teknik olarak her an mümkündür. **[KARAR]** Araştırmacının veri toplama bitmeden CSV'yi sonuç amacıyla açmayacağına dair taahhüt buraya yazılacak mı? **[KARAR]** Analizde grup etiketlerinin kör çalıştırılması (A/B yerine rastgele harf) önerilir.
- **Bölümler:**
  1. 1. bölüm: 6 karar anı (4 "sert düşüş + zarar"); Sat / Tut / Daha al; **iki grupta da bekleme yok**.
  2. 2. bölüm: 7,5 dakikalık piyasa simülatörü (6 hisse, 3 sektörel kriz). **A grubu:** pozisyon en az %2 zarardayken "Sat" onayından önce 10 saniyelik bekleme ekranı (vazgeçme mümkün). **B grubu:** bekleme yok. İki grupta da her satışta kısa gerekçe sorusu.
  3. 3. bölüm: farklı hisselerle 6 karar anı; **iki grupta da bekleme yok**.
- **Uyaranlar:** Sabit tohumdan üretilir; herkes aynı uyaranları görür. Hisse adları gerçek BIST şirketleridir, fiyatlar, grafikler, haberler ve sonuçlar kurgusaldır ve katılımcıya bildirilir. Her hücrede yükseliş ve düşüş sonuçları eşit büyüklükte eşleştirilmiştir (beklenen sonuç sıfır); simülatör piyasası kriz sonrası yatay seyredecek şekilde seçilmiştir.

## 3. Örnekleme planı

- **Hedef kitle:** 18 yaş ve üzeri üniversite öğrencileri. **İşe alım yolu:** [DOLDUR].
- **Mevcut veri:** Uygulama geliştirme sırasında yalnızca otomatik ve elle yapılan deneme oturumları oluşmuştur; ayrıca [DOLDUR: pilot yapıldıysa tarihi ve n'si]. Pilot verisi ana analize girmez. Bunlar analize girmez. **[DOLDUR]** Ön denemeye katılan kişilerin kodları analizden çıkarılacaktır / çıkarılmayacaktır.
- **Örneklem büyüklüğü: [KARAR]**

  **Seçenek A: tasarımı güçlendir.** Bölüm başına "sert düşüş + zarar" denemesini 4'ten 8'e çıkar ve A'daki her katılımcının simülatörde bekleme ekranıyla karşılaşmasını sağla. Duyarlılık analizinde (n = grup başına 60, maruz kalma %95, 8 deneme): gerçek OR = 0,5 için güç ≈ %89, OR = 0,4 için ≈ %98. Hedef: grup başına **60 tamamlayan** [DOLDUR: işe alım sayısı, kayıp oranına göre].

  **Seçenek B: mevcut tasarım.** Grup başına **100 tamamlayan** (≈ 112 işe alım). Güç ≈ %80, yalnızca **OR ≈ 0,4 ya da daha güçlü** bir etkide (bekleme ekranını gören A katılımcısı için); OR = 0,5'te ≈ %55-58. Gerçek etki OR = 0,5 civarındaysa bu tasarım çoğu zaman anlamlı sonuç üretemez. Bu sınırlılık raporda açıkça yazılacaktır.

- **Güç analizi (ek tablolara bakınız):** Simülasyonla; birincil testin kendisi (kümeye dayanıklı lojistik, t, df = G − 1, α = 0,05 iki yönlü) kullanılmıştır. Varsayımlar: 1. bölümde ortalama %50 satış, kişiler arası değişkenlik σ = 1,2 (logit), ortak değişim −0,2, A grubunun %70'i simülatörde bekleme ekranını görüyor. Bu varsayımlar ölçülmüş değil, varsayılmıştır; gerçek değerler farklıysa güç değişir. Etki yokken (OR = 1) test, tüm denenen n değerlerinde yaklaşık %5 hata vermektedir.
- **Durdurma kuralı:** Sabit örneklem; ara analiz yapılmaz; hedef tamamlayan sayısına ulaşılınca ya da [DOLDUR: son tarih] gelince veri toplama durur. Hedefe ulaşılamazsa ulaşılan n ve gücün bu n'de nasıl değiştiği raporlanır.

## 4. Değişkenler

- **Manipüle edilen:** Grup (A: simülatörde bekleme ekranı; B: yok).
- **Bölüm (kişi içi):** 1. bölüm (simülatör öncesi), 3. bölüm (simülatör sonrası).
- **Birincil bağımlı değişken (`panic_rate`):** Bir bölümdeki 4 "sert düşüş + zarar" denemesinde son kararın "Sat" olduğu denemelerin oranı (0, 0,25, 0,5, 0,75 ya da 1). "Sert düşüş": son haftada %10-16 düşüş; "zarar": pozisyon %12-22 zararda.
- **Kontrol değişkeni:** Karar seti (X ya da Y).
- **İkincil/keşifsel değişkenler:** Bekleme ekranı sayısı (görülen, vazgeçilen, onaylanan); simülatördeki zararına satış sayısı; satış gerekçeleri (Planım buydu / Haber yüzünden / Korktum / Diğerleri satıyor / Söylemek istemiyorum); gerginlik (1-5; her bölüm sonunda); karar süresi (ilk seçime kadar, ms); sürü bilgisi var / yok; demografik değişkenler; ön test (finansal okuryazarlık; 6 madde: Big Three + 3 doğrulanmamış ek madde; `pre_test_b3` yalnız ilk 3) ve son test (2 madde; farklı maddeler, değişim hesaplanmaz).
- **Kalite ve müdahale kontrolleri:** Dikkat kontrolü; anlama kontrolü (3 soru; her oturumda 3 havuzdan 6 sorunun her birinden biri rastgele çekilir; ilk denemede doğru sayısı; çekilen soru `comprehension` olayında `form` olarak kayıtlı); "bekleme gördün mü?"; amaç tahmini (serbest metin).

## 5. Analiz planı

**Birincil analiz.** Analiz kümesi: **tamamlayan tüm katılımcılar** (12 karar), dışlama olmadan.

> logit P(satış) = b0 + b1·A + b2·Bölüm3 + b3·(A × Bölüm3) + b4·SetY

Yalnızca "sert düşüş + zarar" denemeleri; katılımcıya göre kümelenmiş CR1 dayanıklı standart hata; Wald testi, t dağılımı, df = G − 1 (G: katılımcı sayısı); α = 0,05 iki yönlü. Raporlanacak: b3'ün odds oranı ve %95 güven aralığı.

**Karar kuralı.** p < 0,05 **ve** OR < 1 ise H1 desteklenmiş sayılır. Diğer tüm durumlarda H1 desteklenmemiştir; bu durum "etki yok" diye yorumlanmayacak, güven aralığı verilecektir. OR > 1 ve anlamlıysa, beklenenin tersi bir sonuç olarak raporlanır.

**Aynı soruya bakan yardımcı analizler (birincil değil, tutarlılık için).** Değişim puanında (3. bölüm − 1. bölüm) grup farkı: permütasyon testi (10.000), bootstrap güven aralığı (5.000), Welch t; ANCOVA (3. bölüm ~ grup + 1. bölüm + set, HC3); Hedges g. Bu analizler birincil sonuçla çelişirse çelişki raporlanır; hangisinin "kazandığı" sonradan seçilmez.

**Dışlama kuralları (veri görülmeden belirlenir).**
- *Birincil analizde:* hızlı test modunda üretilen oturumlar; 12 kararı tamamlamayanlar; çekilenler (veri silinir); panik satış oranı geçersiz olanlar. Başka dışlama yoktur.
- *Duyarlılık analizinde (ayrı ayrı ve birlikte):* dikkat kontrolünü geçemeyenler; anlama kontrolünde ilk denemede 2'den az doğru yapanlar; araştırmanın amacını doğru tahmin edenler (gruptan habersiz **iki bağımsız kodlayıcı**; uyum Cohen κ ile raporlanır; uyuşmazlıklar [DOLDUR: üçüncü kodlayıcı ya da uzlaşma toplantısı] ile çözülür; çözülmeyenler katı duyarlılık satırında çıkarılır).
- Duyarlılık analizi sonuçları birincil sonuçla yön ya da anlamlılık bakımından ayrışırsa bu raporda açıkça belirtilir.

**Eksik veri ve kayıp.** Tamamlamayanlar birincil analize girmez. Gruplar arası farklı kayıp Fisher testiyle kontrol edilir ve raporlanır; farklı kayıp varsa sonuç temkinli yorumlanır. **[KARAR]** Farklı kayıp durumunda ek bir analiz (örneğin en kötü/en iyi durum) yapılacak mı?

**İkincil ve keşifsel analizler.** Doz-yanıt (Spearman); bekleme ekranını gören A katılımcıları ile B karşılaştırması (nedensel yorum için zayıf; görmek randomize değildir); gerekçe payı, gerginlik ve karar süresi (Mann-Whitney); sürü bilgisi etkisi (deneme düzeyi model). Bu analizler **keşifseldir**; p değerleri Holm yöntemiyle düzeltilir.

**Bilgi düzeyi × grup × bölüm (ikincil, keşifsel; [KARAR] 7).** Soru: bekleme ekranının etkisi (grup × bölüm) katılımcının finans bilgisine göre değişiyor mu? Moderatör: **ön test puanı** (6 madde, 0-100; Big Three çevirisi ve 3 doğrulanmamış ek madde, bkz. [KARAR] 4), analiz kümesinde **kişi düzeyinde z-puanına** çevrilir ve **sürekli** kullanılır (bölme noktası seçilmez; yatırım deneyimi ve diğer demografikler betimseldir). Model: birincil modele z, z×A, z×Bölüm3 ve z×A×Bölüm3 eklenir (aynı kümeye dayanıklı CR1 lojistik). Raporlanan: üçlü terimin OR'u ve %95 GA'sı (z'de 1 SS artış başına müdahale etkisinin log-OR'daki değişimi; OR > 1 etkinin bilgiyle zayıfladığını gösterir) ve z = −1 / +1 SS için basit etkiler (A × Bölüm3 OR). **Duyarlılık:** aynı model yalnızca Big Three puanıyla (3 madde) tekrarlanır ve rapora not olarak yazılır (Holm dışı); iki sonuç ayrışırsa ek maddeler yorumu belirlemiş olabilir. Test iki yönlüdür; hipotez yönü önceden belirtilmemiştir. **Güç düşüktür:** simülasyonda (bilgi düşükken OR ≈ 0,35, yüksekken ≈ 0,70; kişiler arası SD = 1,2; A'nın %70'i maruz) üçlü terim için güç grup başına 60 kişide ≈ %13, 100 kişide ≈ %19, 150 kişide ≈ %28 (300 tekrar; I. tip hata ≈ %6; yeniden üretmek için `analiz/ilklot_bilgi_guc.py`). Bu yüzden sonuç **tahmin olarak** (güven aralığıyla) yorumlanır; anlamlı olmaması etkinin bilgiden bağımsız olduğunu göstermez. Pilotta ön test puanı çok az farklı değer alıyorsa (6 madde yalnızca 7 farklı değer verebilir) analiz yine çalışır ama basit etkiler belirsiz çıkar.

**Yazılım.** Python; `ilklot_analiz.py` (sürüm 1.2). Kayıttan önce kod dosyalarının özetini al: `shasum -a 256 analiz/*.py`. Çıktıyı ön kayda ekle; kod sonradan değişirse sapma olarak bildirilir. Tohum: 1.

## 5b. Kayıt anında dondurulan şeyler

Kayıttan sonra aşağıdakilerden biri değişirse bu **sapma** sayılır ve raporda gerekçesiyle yazılır. Kayıt metnine yazılacak değerleri kayıt gününde buradan doldur.

| Dondurulan | Nerede | Değer |
|---|---|---|
| Uygulama sürümü | `CFG` / `APP_VERSION` (`kaynak/02_core.js`) | [DOLDUR: örn. 2026.10.20-b23 sonrası son sürüm] |
| Karar seti tohumu ve simülatör tohumu | `seed`, `simSeed` | [DOLDUR] |
| Kriz günleri, bekleme süresi, zarar eşiği | `simCrises`, `cooldownSec` (10), `lossThreshold` (−%2) | [DOLDUR] |
| Gün sayısı | `simTicks` (300) | [DOLDUR] |
| Ön ve son test maddeleri | `TQ` (8 madde) | metin ve sıra kayda eklenir |
| CSV başlığı | `analiz/ilklot_ornek_veri.py` `KATILIMCI_KOLONLARI` | [DOLDUR: sütun sayısı] |
| Analiz kodu | `shasum -a 256 analiz/*.py` | [DOLDUR: özet değerleri] |
| Onam sürümü | `CONSENT_VER` | [DOLDUR] |

## 5c. Kayıt öncesi kontrol listesi

- [ ] Başlıktaki [KARAR] 1-7 kapatıldı ve ilgili bölümlerdeki alternatif metinler silindi (yalnız seçilen yol kaldı).
- [ ] Pilot yapıldı mı? Yapıldıysa maruz kalma oranı ve süre bu belgeye işlendi; pilot verisi ana analizden ayrı.
- [ ] Uygulama dondu: yukarıdaki tablo dolu, `python firebase/dagit.py --kilitle` çalıştırıldı.
- [ ] Etik kurul onayı alındı ve belge numarası 1. bölüme yazıldı.
- [ ] Hiçbir ana veri toplanmadı (pilot hariç). Sonradan yapılan kayıt ön kayıt sayılmaz.
- [ ] Danışman metni okudu; hipotez yönü, dışlama ve analiz kuralları ona açıklandı.
- [ ] Kayıt bağlantısı ve tarihi çalışma belgelerine eklendi.

## 6. Diğer

- **Bilinen sınırlılıklar:** Simüle piyasa ve kurgusal fiyatlar (dış geçerlik); tek oturum ve kısa müdahale (sonuçlar "kısa süreli aktarım" olarak adlandırılacaktır); gerçek şirket adlarının önyargı yaratma olasılığı; müdahalenin görünür olması; bekleme ekranını görmenin randomize olmaması; ana ölçütün bölüm başına yalnızca 4 denemeye dayanması (gücü sınırlar).
- **Sapmalar:** Ön kayıttan her sapma, gerekçesiyle birlikte raporda ayrıca listelenir.
- **Veri ve kod paylaşımı:** [DOLDUR]

---

## Ek: güç analizi çıktıları

Aşağıdaki sayılar `analiz/ornek/` klasöründeki dosyalardan alınmıştır ve şu komutlarla yeniden üretilebilir:
`python ilklot_guc.py --tekrar 1000 --seed 1` ve `python ilklot_guc.py --duyarlilik --tekrar 1500 --seed 1`.
İki tablo farklı rastgele sayı dizileriyle üretildiği için aynı hücrede birkaç puanlık fark Monte Carlo hatasıdır (tek hücrede standart hata ±1,3-1,6 puan).

### Mevcut tasarım (bölüm başına 4 deneme, A'nın %70'i bekleme ekranını görüyor)

Satır: grup başına tamamlayan (parantezde işe alım, %10 kayıp). Sütun: bekleme ekranını gören A katılımcısındaki gerçek OR (ek: A'nın B'ye göre beklenen ek değişimi, yüzde puan). OR = 1 sütunu I. tip hatadır.

| Grup başına n (işe alım) | OR = 1 | OR = 0,7 (ek -5 yp) | OR = 0,5 (ek -9,6 yp) | OR = 0,4 (ek -12,6 yp) | OR = 0,3 (ek -16,3 yp) |
|---|---|---|---|---|---|
| 20 (23) | %5 | %10 | %18 | %28 | %39 |
| 30 (34) | %5 | %8 | %22 | %33 | %51 |
| 40 (45) | %5 | %10 | %28 | %44 | %64 |
| 60 (67) | %6 | %16 | %39 | %58 | %79 |
| 80 (89) | %5 | %18 | %50 | %71 | %90 |
| 100 (112) | %5 | %21 | %55 | %81 | %95 |
| 150 (167) | %5 | %28 | %78 | %94 | %100 |

### Varsayımlar değişirse (n = grup başına 60)

| Değişiklik | OR = 0,5 | OR = 0,4 |
|---|---|---|
| Taban (4 deneme, %70 maruz kalma, σ = 1,2) | %39 | %59 |
| σ = 0,6 | %42 | %63 |
| σ = 2 | %36 | %55 |
| Maruz kalma %40 | %15 | %23 |
| Maruz kalma %95 | %58 | %83 |
| 6 deneme | %53 | %76 |
| 8 deneme | %65 | %86 |
| 12 deneme | %80 | %96 |
| Maruz kalma %95 + 8 deneme | %89 | %98 |

Birleşik iyileştirmede (maruz kalma %95 ve 8 deneme) grup başına 30 / 40 / 60 / 80 kişide OR = 0,5 için güç sırasıyla %62 / %74 / %89 / %96'dır.
