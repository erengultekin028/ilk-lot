# Etik kurul başvuru taslağı: İlk Lot

> **Taslaktır.** Kurumunun başvuru formunu bilmiyorum; içeriği buradan formun alanlarına taşıyacaksın. `[DOLDUR]` ve `[KARAR]` işaretli yerleri sen ve danışmanın tamamlamalısın. Bu belge hukuki görüş değildir; KVKK ve yurt dışı aktarım gibi konularda kurumunun KVKK/hukuk birimine danış.
>
> **Metinler uygulamadan üretilmiştir** (`materyalleri_uret.py`): `onam_metni_v1.txt`, `bilgilendirme_metni_v1.txt`, `ekranlar/`. Uygulamada ya da `CFG.consentInfo` alanlarında bir şey değişirse yeniden üret; başvurudaki metin uygulamadakinden farklı olmamalı. Bu taslak ilk olarak uygulama sürümü 2026.10.08-b3 ve onam sürümü v1 için yazıldı; sonradan yatırım tavsiyesi notu, karar kartı, alıştırma simülatörü ve 6 maddelik ön test eklendi (güncel sürüm 2026.10.20-b23). **Portföy grafiği (b12) ve diğer görünüm değişiklikleri bu taslakta yazılı olmayabilir; başvurmadan önce kontrol et.**

## 1. Çalışmanın özeti

Çalışma, üniversite öğrencilerinin yatırım kararlarını piyasada sert düşüş gibi baskılı durumlarda nasıl verdiğini ve karar öncesi kısa bir bekleme süresinin zararına satışı azaltıp azaltmadığını inceliyor. Katılımcılar, telefondan, yaklaşık 30 dakikalık tek bir oturumda **kurgusal** bir piyasada karar verir: kısa karar senaryoları, ardından bir piyasa simülatörü, ardından yeniden karar senaryoları. Hiçbir aşamada gerçek para kullanılmaz. Katılımcılar rastgele iki gruba ayrılır; grupların tek farkı, simülatörde zararına satış öncesi 10 saniyelik bir bekleme ekranının yalnızca bir grupta çıkmasıdır. Bu fark, katılımcıdan **oturum sonunda** açıklanana kadar saklanır (4. bölüm). Ad, e-posta ya da öğrenci numarası toplanmaz; veri rastgele bir katılım koduyla eşleşir.

**Risk düzeyi (öneri):** Minimal risk. Gerekçe: gerçek parasal kayıp yok, katılım gönüllü ve her an bırakılabilir, kimlik bilgisi toplanmıyor. Bu sınıflandırmayı kurulun kendi ölçütlerine göre sen doğrula. **[DOLDUR]**

## 2. Katılımcılar

| | |
|---|---|
| Hedef kitle | 18 yaş ve üzeri üniversite öğrencileri |
| Dahil etme | 18 yaş ve üzeri (beyanla), akıllı telefon |
| Dışlama | 18 yaş altı. Uygulama ilk form sorusunda yaşı sorar; "Hayır" denirse katılım biter ve o koda ait demografik ya da davranış verisi saklanmaz (yalnızca kodun kullanıldığı ve çekildiği kaydı kalır). Yaş **doğrulanmaz**, beyana dayanır. |
| Savunmasız grup | Yok (hasta, hükümlü, öğrenci olmanın ötesinde bağımlı ilişki, çocuk yok) |
| Örneklem | **[KARAR]** Grup başına tamamlayan katılımcı sayısı: mevcut tasarımla 100 (≈ 224 işe alım) ya da tasarım güçlendirilirse 60 (≈ 134 işe alım). Gerekçe: `docs/ON_KAYIT_TASLAGI.md`, güç analizi. |
| İşe alım | **[DOLDUR]** (duyuru kanalı, tanıtım sayfası ve QR'lı poster) |
| Teşvik | **[DOLDUR]** (yoksa "yok" yaz; varsa kimlikten ayrı bir formla verilecek şekilde tasarla) |

**Bağımlılık ilişkisi:** Araştırmacı ve katılımcılar aynı üniversiteden olabilir. Araştırmacının ders verdiği, not verdiği ya da danışmanlığını yaptığı öğrencilerin işe alınmaması **önerilir**. **[KARAR]** Politikanı buraya yaz.

## 3. Prosedür (katılımcının gördüğü akış)

Ekran görüntüleri: `ekranlar/`.

| Adım | Ne olur | Süre |
|---|---|---|
| 1. Onam | Üç özet kart, açılır ayrıntılar, indirilebilir metin; **onay kutusu işaretlenmeden devam edilemez** | 2 dk |
| 2. Kod | Kartta ya da linkte gelen rastgele kod | — |
| 3. Form | "18 yaşını doldurdun mu?" zorunlu; yaş aralığı, cinsiyet, bölüm alanı, sınıf, yatırım deneyimi, simülasyon deneyimi **isteğe bağlı** | 1 dk |
| 4. Ön test | 6 finansal okuryazarlık sorusu ("Bilmiyorum" seçeneğiyle) ve 1 dikkat sorusu | 2 dk |
| 5. Tanıtım | Rehberli tur, 2 alıştırma, 3 soruluk anlama kontrolü | 4 dk |
| 5b. Simülatör alıştırması | 30 saniyelik kısa simülatör (kriz yok, bekleme ekranı yok; işlemler kaydedilmez, yalnızca "alıştırma yapıldı/atlandı ve kaç işlem" sayısı yazılır); atlanabilir | 0,5 dk |
| 6. 1. bölüm | 6 karar anı: grafik, haber, pozisyon; Sat / Tut / Daha al. Kararın sonucu hemen gösterilir | 4 dk |
| 7. 2. bölüm | Piyasa simülatörü (6 hisse, 3 sektörel kriz). **Bekleme ekranı bu bölümde ve yalnızca bir grupta** | 7,5 dk |
| 8. 3. bölüm | 6 karar anı | 4 dk |
| 9. Gerginlik | Her bölüm sonunda 1-5 arası tek soru; **atlanabilir** | 1 dk |
| 10. Son adımlar | 2 finans sorusu, "bekleme gördün mü?", isteğe bağlı "araştırma neyi ölçüyordu?" | 2 dk |
| 11. Bilgilendirme | Amaç, grubu, kurgusal olduğu, destek bilgisi, çekilme seçeneği. İsteğe bağlı "karar kartı" (aşağıdaki not) | 2 dk |
| 12. Serbest mod (isteğe bağlı, **çalışma bittikten sonra**) | Katılımcı kendi seçtiği zorlukla (Kolay / Orta / Zor), kayıp sınırıyla (%10-%50), senaryoyla (rastgele / sakin / kriz / yükseliş dönemi) ve başlangıç portföyüyle simülatörü oyun gibi oynayabilir; oyun sırasında piyasayı durdurabilir ya da hızlandırabilir ve hisselere otomatik sat emri koyabilir; toplam para seçilen kayıp sınırının altına inince oyun biter. **Çalışmanın parçası değildir: hiçbir olay, işlem ya da ayar kaydedilmez**, bekleme ekranı yoktur, süre sınırı yoktur; puan, sıralama, ödül ve paylaşım yoktur. **[KARAR]** Etik kurulun bu ekranı da görmesi gerekir; bu ekranlar `etik/ekranlar/` içine henüz eklenmedi. | serbest |

Hisse adları gerçek BIST şirketlerine aittir; **fiyatlar, grafikler, haberler ve sonuçlar tamamen kurgusaldır** ve her aşamada katılımcıya bildirilir. Karar sonuçları, "sat" ya da "tut" ortalamada avantaj sağlamayacak şekilde dengelenmiştir; sonda katılımcıya hiçbir kararın "doğru" ya da "yanlış" olmadığı söylenir.

**Yatırım tavsiyesi ve risk profili:** Uygulama yatırım tavsiyesi vermez, bir risk profili ya da uygunluk testi çıkarmaz, katılımcıya hisse önermez; haber ve fiyatlar kurgusaldır. Görev ve simülatör ekranlarında sabit bir satırda "Kurgusal piyasa · yatırım tavsiyesi değildir" yazar; bilgilendirmede de yer alır. (Gerçek aracı kurumlardaki SPK uygunluk testi bu çalışmada yoktur; çünkü gerçek işlem ve gerçek para yoktur.)

**Karar kartı (isteğe bağlı çıktı):** Bilgilendirmeden SONRA katılımcı, kendi kararlarının sayısını (1. ve 3. bölümde sat/tut/al ve simülatördeki işlem sayısı) gösteren bir resim oluşturup kaydedebilir. Resimde **ad, kod, grup ya da çalışmanın amacı yoktur**; yalnızca sayılar ve "kurgusal / yatırım tavsiyesi değildir" notu bulunur. Katılımcıya, çalışma sürerken amacı başkalarıyla paylaşmaması söylenir (diğer katılımcıların kararlarını etkilememek için). Oluşturma bir olay olarak kaydedilir (`summary_card`); resim sunucuya gönderilmez, cihazda üretilir.

> Süre, yayındaki 7,5 dakikalık simülatörle geçerlidir. Simülatör kısaltılırsa (bkz. `docs/BEKLEYEN_150_GUN.md`) süreler ve metinler güncellenir.

## 4. Eksik bilgilendirme (incomplete disclosure) ve gerekçesi

**Saklanan şey:** (a) araştırmanın hipotezi, (b) iki grubun bulunduğu ve farkın bekleme ekranı olduğu, (c) hangi grupta olduğu. **Saklanmayan şeyler:** riskler, süre, veri toplama biçimi, gerçek para olmadığı, kurgusal fiyatlar. Katılımcıya **yanlış bilgi verilmez**: kurgusal piyasa açıkça kurgusal olarak sunulur, müdahale ise sadece önceden adı konmaz.

**Gerekçe:** Katılımcı, bekleme ekranının satışı azaltmayı amaçladığını bilirse davranışını ona göre ayarlayabilir (talep özellikleri); ölçmek istediğimiz doğal tepki bozulur. Tam bilgilendirmeyle yapılan bir çalışma sorunun cevabını veremez.

**Önlemler:**
- Onam metni bunu açıkça söyler: "Araştırmanın bazı ayrıntıları, davranışını etkileyebileceği için çalışmanın sonunda açıklanacak."
- Oturum sonunda tam açıklama yapılır ve katılımcı hangi grupta olduğunu öğrenir (`bilgilendirme_metni_v1.txt`).
- Açıklamadan sonra katılımcı verisinin kullanılmasını **reddedebilir** (çekilme düğmesi aynı ekrandadır).
- Açıklamadan önce "amaç neydi?" sorusu sorulur; bu cevap hipotezi tahmin edenleri analizde ayırmak içindir.
- Destek bilgisi ve iletişim adresi aynı ekranda verilir.

## 5. Riskler, önlemler, yararlar

| Risk | Değerlendirme | Önlem |
|---|---|---|
| Gerginlik ya da rahatsızlık (simüle düşüşler, zarar) | Düşük, geçici; kurgusal para | Gerçek para yok; her an durabilir ve çekilebilir; gerginlik sorusu atlanabilir; bilgilendirmede destek bilgisi ve iletişim: **[DOLDUR: psikolojik danışma birimi]** |
| Zaman yükü | ≈ 30 dk | Süre onamda ve tanıtımda yazılı; yarıda bırakılabilir |
| Mahremiyet | Davranış verisi kodla eşleşir; cihaz türü, ekran boyutu ve barındırıcı günlüklerinde IP bulunabilir | Kimlik bilgisi toplanmaz; erişim kontrollü; kart dağıtımında kişi-kod eşleşmesi tutulmaz (6. bölüm) |
| Eksik bilgilendirme | Bkz. 4. bölüm | Bkz. 4. bölüm |
| Yanlış öğrenme ("satmak/tutmak işe yarar" izlenimi) | Düşük | Sonuçlar dengelenmiş; sonda "doğru ya da yanlış yok" ve "yatırım tavsiyesi değildir" |
| Baskı ya da bağımlılık (tanıdık araştırmacı) | Öğrenci katılımcılarda olası | Gönüllülük vurgusu; ders notuyla ilişki yok; işe alım politikası (2. bölüm) |
| **Gerçek şirket adlarının kullanımı** | Kurgusal olumsuz haberler ve çöküşler gerçek şirket adlarıyla gösteriliyor; itibar ve hukuki yönü olabilir | Her ekranda ve bilgilendirmede "adlar gerçek, fiyat ve haberler kurgusal" uyarısı; veriler kimliksiz ve toplu yayımlanır. **[KARAR]** Kurul ya da hukuk birimi itiraz ederse adlar kurgusal olanlarla değiştirilir (kod değişikliği küçüktür, `kaynak/02_core.js`). |

**Yararlar:** Katılımcıya doğrudan maddi yarar yok (onamda da bu yazılı). Kendi karar kalıplarını gösteren bir özet (kararlarının filmi) ve bilgilendirme verilir. Toplumsal yarar: genç yatırımcılara yönelik finansal okuryazarlık eğitimlerinin tasarımına bilimsel veri.

## 6. Veri yönetimi ve KVKK

Veri akışı şeması: `veri_akisi.svg` (PNG: `veri_akisi.png`). Alan tanımları: `docs/VERI_SOZLUGU.md`.

| Veri | Örnek | Kimliği belirler mi? |
|---|---|---|
| Katılım kodu ve grup | `KM7D-P2XR-9TQA`, A/B | Hayır (rastgele; kişi–kod eşleşmesi tutulmaz). Tarayıcıya bağlı anonim oturum kimliği (uid) yuva koduna bağlıdır; bu bir kişiyi değil bir tarayıcıyı gösterir ama veriyi teknik olarak **takma adlı** yapar |
| Demografik (isteğe bağlı) | Yaş aralığı, cinsiyet, bölüm alanı, sınıf, yatırım ve simülasyon deneyimi | Tek başına hayır; çok küçük gruplarda dolaylı belirleme riski, bu yüzden aralıklı kategoriler kullanılır |
| Davranış | Kararlar, süreler, simülatör işlemleri, gerekçeler, gerginlik, test cevapları, ekran ve sekme etkinliği | Hayır |
| Serbest metin | "Araştırma neyi ölçüyordu?" (en fazla 400 karakter) | **Katılımcı yazarsa kişisel bilgi içerebilir**; analizden önce gözden geçirilir ve gerekirse temizlenir |
| Teknik | Tarayıcı ve cihaz türü (kısa dize), ekran boyutu | Hayır |
| Barındırıcı günlükleri | IP adresi vb. | Barındırıcıda durabilir, araştırma verisiyle eşleştirilmez; **[DOLDUR: barındırma ayarlarını kontrol et]** |

- **Veri sorumlusu:** [DOLDUR]
- **Hukuki dayanak:** Açık rıza (onam ekranı ve onay kutusu; kabul edilen onam sürümü ve zaman damgası kaydedilir). **[DOLDUR]** Kurumun KVKK birimi onaylamalı.
- **Saklama ve silme:** [DOLDUR: süre]. Süre sonunda ham veri silinir; yalnızca kimliksiz toplu sonuçlar kalır.
- **Erişim:** Yalnızca [DOLDUR: araştırmacılar]. Sunucuda kurallarla zorlanır: katılımcı grubunu değiştiremez ve çekilmiş kaydı geri açamaz; kayıtları listeleme ve olay kayıtlarını okuma yalnızca yetkili araştırmacı hesabındadır. Katılımcı **kod girmez**: Firebase anonim girişle sıradaki yuvayı alır ve yalnızca **kendi** yuvasına ait kaydı okuyup yazabilir (kural, oturum kimliği ile yuva kaydını eşleştirir); başkasının kaydına, listeye ya da olaylara erişemez. 18 otomatik kural testi vardır (`firebase/kural_testleri`). Araştırmacı hesabı tek e-postadır; iki adımlı doğrulama önerilir. **[DOLDUR]**
- **Yurt dışı aktarım:** Araştırma verisi Google Firebase'de (şu an Firestore konumu **nam5, ABD**; AB bölgesine taşıma seçeneği `docs/KONUM_VE_KVKK_KARARI.md` içinde) saklanır; **kimlik doğrulama (anonim oturum) ve ağ günlükleri yalnızca ABD veri merkezlerinde işlenir** (Firebase gizlilik sayfası). Bunun KVKK m. 9 kapsamında hangi dayanakla yapılacağını **kurumunun KVKK/hukuk birimine danış** (soru listesi aynı belgede); sözleşme bilgisi: **[DOLDUR]**.
- **Yuva ataması (kart yok):** Katılımcıya kod ya da kart verilmez; ortak bağlantıyla girer ve onamdan sonra sıradaki yuvayı otomatik alır. Kimin hangi yuvayı aldığı **kaydedilmez**; tutulan tek bağ tarayıcıya bağlı anonim kimliktir (yukarıdaki tablo). **[KARAR]** Veriyi "anonim" değil "takma adlı" olarak tanımlamak ve onamdaki "kimliksiz" ifadesini buna uydurmak (karar paketi madde 3).
- **Tarayıcı verisini silen katılımcı:** Aynı tarayıcıya bağlı kaydına dönemez, yeni yuva alır; eski kaydı bulunamaz (kimlik tutulmadığı için). Katılımcı, ekranda gösterilen kodunu (menüde maskeli) bilerek destek isteyebilir.
- **Yayın ve paylaşım:** Yalnızca kimliksiz, toplu sonuçlar. **[KARAR]** Anonim satır düzeyinde veri (serbest metin hariç) açık veri olarak paylaşılacak mı?
- **Veri ihlali:** [DOLDUR: kime, ne zaman bildirilecek]

## 7. Çekilme prosedürü

1. Katılımcı, çalışma sırasında sağ üstteki **⋯ menüsünden** "Çalışmadan çekil, verilerimi sil" der (oturum sonunda bilgilendirme ekranında da aynı seçenek vardır). Gerekçe göstermez.
2. **Yerel modda** (demo) veri anında silinir. **Bulut modunda** katılımcının kaydı "çekildi" olarak işaretlenir ve analizden çıkar; katılımcı olay kayıtlarını kendisi silemez (güvenlik kuralları). Araştırmacı panelden **"Çekilenlerin verisini kalıcı sil"** ile olay kayıtlarını siler; yalnızca kod, grup ve çekilme tarihi kalır (kodun yeniden kullanılmaması için). Silme süresi: [DOLDUR: örn. 7 gün].
3. **18 yaş altı** beyanı: katılım ilk formda biter; o koda ait hiçbir demografik ya da davranış verisi saklanmaz.
4. **Sınır (onamda da yazılı):** Sonuçlar analiz edilip yayımlandıktan sonra, kimliksiz toplu sonuçlardan bir katılımcının verisini ayıklamak mümkün olmayabilir.

## 8. Başvuru öncesi kontrol listesi

- [ ] `CFG.consentInfo` ve `CFG.contact` dolduruldu; panel "Tüm onam alanları dolu" diyor (sarı yer tutucu yok)
- [ ] `materyalleri_uret.py` yeniden çalıştırıldı; ekler güncel
- [ ] Bu belgedeki tüm `[DOLDUR]` ve `[KARAR]` alanları kapatıldı
- [ ] Kurumun form şablonuna taşındı
- [ ] KVKK/hukuk birimi yurt dışı aktarımı ve gerçek şirket adlarını değerlendirdi
- [ ] Pilot, başvurunun kapsamında mı? (pilot katılımcı da onam alır; `docs/PILOT_PLANI.md`)
- [ ] Bilgilendirmedeki destek birimi gerçekten ulaşılabilir ve haberdar edildi

## 9. Ekler

| Ek | Dosya |
|---|---|
| Onam ve bilgilendirme metni | `onam_metni_v1.txt` |
| Oturum sonu bilgilendirme metni | `bilgilendirme_metni_v1.txt` |
| Katılımcı ekranları (onam, form, test, karar, simülatör, bekleme, bilgilendirme) | `ekranlar/01…09` |
| Veri akışı şeması | `veri_akisi.svg` (`.png`) |
| Veri sözlüğü | `docs/VERI_SOZLUGU.md` |
| Güvenlik kuralları | `firebase/firestore.rules` |
| Ön kayıt taslağı (hipotez, analiz planı) | `docs/ON_KAYIT_TASLAGI.md` |
| Tanıtım sayfası ve poster/kart örneği | yayın linki; panelden indirilen poster ve kartlar |
