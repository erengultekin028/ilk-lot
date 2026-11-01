# Etik kurula ve hukuk birimine gönderilecek e-posta (karar paketi madde 18, kısmen madde 17)

> Taslaktır; **hukuki görüş değildir.** Köşeli parantezli `[…]` yerleri kendin doldur, danışmanını bilgiye (CC) ekle. KVKK sorularının e-postası ayrıdır: `docs/KVKK_BIRIMINE_EPOSTA.md`. İkisini aynı kişilere göndermek zorunda değilsin; etik kurul ve hukuk birimi KVKK biriminden farklı olabilir. Yanıtı aldığında özetini `docs/KARAR_PAKETI.md` madde 18'in "Durum" hücresine (tarih ve karar) yaz.
>
> **Zamanlama:** Pilottan ÖNCE yanıt gelmeli. Şirket adları pilottan sonra değişirse pilot ve ana veri karşılaştırılamaz olur (fiyat yolu özeti değişebilir, bkz. madde 18). Etik başvurunun "Gerçek şirket adlarının kullanımı" satırı (`etik/ETIK_KURUL_BASVURU_TASLAGI.md`) bu e-postayla tutarlı olmalı; başvuru zaten gittiyse bu konuyu bilgi olarak bildir.
>
> **Ekler (öneri):** `etik/ekranlar/` altındaki ekran görüntüleri (şirket adının göründüğü ekranlar), `etik/onam_metni_v1.txt` (onam metni), bu e-postadaki 1. ve 3. bölümler için aşağıdaki haber listesi.

---

**Konu:** Kurgusal yatırım simülatöründe gerçek şirket adlarının kullanımı hakkında görüş talebi: "İlk Lot" araştırma projesi

Sayın [Etik Kurul Başkanlığı / Hukuk Müşavirliği / Ad Soyad],

Yönetim Bilişim Sistemleri bölümü lisans öğrencisiyim. Danışmanım [Unvan Ad Soyad] ile birlikte, üniversite öğrencilerinin **kurgusal bir yatırım simülatöründeki kararlarını** inceleyen bir araştırma yürütüyorum (etik kurul başvurusu: [durum / numara]). Veri toplamaya (pilot dahil) başlamadan önce, simülatörde **gerçek şirket adlarının kullanımı** konusunda görüşünüzü rica ediyorum.

**1. Ne yapıyoruz?** Simülatörde altı hisse vardır ve adları gerçek Borsa İstanbul şirketlerinindir: Koza Altın (KOZAL), Tüpraş (TUPRS), Pegasus (PGSUS), Türk Hava Yolları (THYAO), Aselsan (ASELS), BİM (BIMAS). Bu hisselerin **fiyatları, grafikleri, haberleri ve krizleri tamamen kurgusaldır** ve şirketlerin gerçek durumuyla ilgisi yoktur. Oturum boyunca üç kurgusal sektör krizi yaşanır (ilgili hisselerde yedi simülasyon günü içinde sırasıyla %18 [TUPRS, KOZAL], %20 [ASELS] ve %16 [THYAO, PGSUS] kurgusal düşüş). Haberlerin bir kısmı olumsuzdur; şirket adı geçmez, sektör ve hisse etiketiyle verilir. Örnekler:

- "Enerji sektöründe arz sorunu konuşuluyor." (TUPRS)
- "Enerji ve madencilik hisselerinde sert satış." (TUPRS, KOZAL)
- "Savunma ihracatına yönelik kısıtlama sinyali." (ASELS)
- "Jet yakıtı fiyatlarında ani artış haberi." (THYAO, PGSUS)
- "Havacılık hisselerinde sert düşüş." (THYAO, PGSUS)

Haberlerin tamamı kurgusal, araştırmacı yazımıdır; tam liste ek olarak verilebilir.

**2. Katılımcıya nasıl anlatılıyor?** Onam ekranında ("Hisse adları gerçek BIST şirketlerine ait olabilir; ama fiyatlar, grafikler ve haberler tamamen kurgusaldır ve bu şirketlerin gerçek durumunu yansıtmaz."), simülatör ve karar ekranlarının altında ("Şirket adları gerçek; fiyatlar, grafikler ve haberler kurgusaldır ve bu şirketlerin gerçek durumunu yansıtmaz. Yatırım tavsiyesi değildir.") ve bilgilendirme ekranında uyarı vardır. Gerçek para kullanılmaz. Araştırma verisi kimliksiz/takma adlıdır ve yalnızca toplu yayımlanacaktır. **Uygulamanın kaynak kodu ve haber metinleri herkese açık bir GitHub deposunda görüntülenebilir.**

**3. Neden gerçek adlar?** Katılımcıların tanıdık bir ortamda karar vermesi (dış geçerlik) amaçlanmıştır. İki gruba da aynı adlar gösterilir, bu yüzden gruplar arası karşılaştırma bozulmaz. Sınırlılık olarak: katılımcıların bu şirketlere dair önceden fikri olabilir. Alternatif, **kurgusal şirket adları ve kodları**dır; bu mümkündür ama fiyat yolunu etkileyebileceği için pilottan sonra değiştirilemez.

**Görüşünüzü rica ettiğim sorular:**

1. Etik kurul açısından, gerçek şirket adlarının **kurgusal olumsuz haberler ve kurgusal fiyat düşüşleriyle** gösterilmesi uygun mudur? Yukarıdaki uyarılar yeterli midir, yoksa ek önlem (örneğin onam metninde daha açık bir cümle, ekranda sabit uyarı) istenir mi?
2. Hukuk açısından, şirket adlarının (marka niteliği taşıyabilir) bilimsel amaçla ve kurgusal içerikle kullanılması için **izin ya da bildirim** gerekir mi? Kurgusal olumsuz haberlerin gerçek şirketlerle eşleşmesi **itibar** yönünden bir sakınca doğurur mu?
3. Simülatörün kurgusal fiyatları ve hisse etiketli haberleri, **yatırım tavsiyesi** ya da piyasayı etkileme gibi bir yönden (ör. SPK mevzuatı açısından) değerlendirilebilir mi? Mevcut "yatırım tavsiyesi değildir" uyarısı yeterli midir?
4. Kaynak kodun ve haber metinlerinin herkese açık depoda durması bu değerlendirmeyi değiştirir mi? Kod açık kalmalı mı, yoksa haber metni dosyası depoda saklanmamalı mı?
5. **Kurgusal şirket adlarına** (ör. "A Madencilik", "B Enerji") geçilmesi tercih edilirse, etik kuruldan **ek bir değişiklik bildirimi/onayı** gerekir mi? Geçiş pilottan önce yapılırsa süreç nedir?
6. Araştırma sonuçları yayımlanırken (rapor, bildiri) şirket adları ve kodları anılabilir mi, yoksa sonuçlar yalnızca "Hisse 1…6" gibi anonim etiketlerle mi verilmelidir?

**Ek soru (madde 17, yalnızca etik kurula):** Çalışmadan çekilen bir katılımcı, çekilme ekranındaki "Yeni katılım başlat" ile **yeni ve ayrı bir kimlikle yeniden katılabilmektedir** (eski ve yeni katılım arasında bağ tutulmaz; 18 yaş altı nedeniyle kapanan kayıtta seçenek görünmez). Pilot ve test için bunun açık kalmasını, **ana veri toplamadan önce kapatmayı** planlıyorum, çünkü aynı kişinin iki kez katılması analizde ayıklanamaz. Pilotta açık olması etik açıdan kabul edilebilir mi? Onam metnine "tekrar katılım" ile ilgili bir ifade eklenmesi gerekir mi?

Pilot uygulamaya ve poster basımına geçmeden önce yanıtınızı [tarih] tarihine kadar alabilirsem planı ona göre yapabilirim. Gerekirse ekran görüntülerini ve haber listesini paylaşırım; kısa bir görüşmeye de müsaitim.

Saygılarımla,
Eren Gültekin · Yönetim Bilişim Sistemleri · erengltkn1905@gmail.com · [telefon, isteğe bağlı]
Danışman: [Unvan Ad Soyad]

---

## Benim için notlar (e-postaya dahil değil)

- Haber metinleri ve hisse adları `public/src/constants/market-data.js` içindedir; krizlerin hisse listesi `public/src/constants/app-config.js`, serbest mod grupları `public/src/constants/free-play-data.js`. Doğrulanan: haber metinlerinde şirket adı geçmez, hisse etiketi vardır (e-postadaki 1. bölüm bu dosyadan alındı).
- Kriz oranları ve süresi (`len: 7`, `drop` 0,18 / 0,20 / 0,16) `app-config.js` satır 39-41'den alındı. "Yedi simülasyon günü" `len: 7` yorumumdur; gerçek anlamını (düşüşün kaç günde gerçekleştiği) kodda doğrulamadım, göndermeden önce kontrol et.
- `etik/ekranlar/` içindeki görüntüler eski tasarımdan olabilir (b39–b41 ve b9/b10 öncesi paletler); göndermeden önce şirket adlarının göründüğü güncel ekran görüntülerini `docs/ekran_goruntuleri/` altından seçmek daha doğru olabilir. Kontrol etmedim.
- Madde 18'in (b) seçeneği (kurgusal adlar) seçilirse yapılacaklar `docs/KARAR_PAKETI.md` "Kararlar kapanınca benim yapacaklarım" altında 18(b) satırındadır. Kararı sen verirsin; ben yalnızca uygularım.
