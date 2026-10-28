# Onam metni v2: TASLAK (uygulamaya KONMADI)

**Durum: öneri.** Uygulamadaki onam (`CONSENT_VERSION = 'v1'`), menü, çekilme ve bitiş metinleri aynen duruyor. Bu belge, **danışman, etik kurul ve KVKK birimi** onayından sonra uygulanacak v2 metnini ve değişecek her yeri listeler. `[KVKK-YANITI]` ve `[DOLDUR]` işaretli yerler, `docs/KARAR_PAKETI.md` kararlarına (madde 1, 2, 3, 5) ve `docs/KVKK_BIRIMINE_EPOSTA.md` yanıtına bağlıdır; yanıt gelmeden kapatılmamalıdır. Hukuki görüş değildir. Bu belge `etik/ONAM_DEGISIKLIK_ONERISI_A.md`'nin yerini alır (o belge eski dosya adlarına bağlıdır, tarihsel kayıt olarak kalır).

## 1. Neden v2

| # | v1'deki durum | Sorun |
|---|---|---|
| 1 | "verilerin silinir", "Çalışmadan çekil, verilerimi sil" | Uygulama **hiçbir şeyi silmiyor** (politika A, soft delete): çekilen kayıt işaretlenir ve analizden çıkar. Metin ve davranış **çelişiyor** (pilot dahil gerçek katılımcıyla kullanılmadan düzeltilmeli) |
| 2 | "Kimliksiz", "rastgele bir kodla eşleşir", "sana verilen kod" | Katılımcıya kod verilmiyor, **sistem atıyor**; ayrıca tarayıcıya bağlı anonim oturum kimliği (uid) koda bağlı tutuluyor. Veri **takma adlıdır** (karar paketi madde 3) |
| 3 | "Veriler [DOLDUR: örn. Google Firebase, Avrupa bölgesi] üzerinde saklanır" | Gerçek durum: veriler şu an **ABD** (nam5); **kimlik doğrulama hizmeti yalnızca ABD'de** çalışır. Yurt dışı aktarım var ve metinde açıkça yazılmalı (karar paketi madde 1) |
| 4 | "Veriler üçüncü kişilerle paylaşılmaz" | Google (Firebase) veri işleyen olarak devrede; "üçüncü kişi" ifadesi netleştirilmeli |
| 5 | Silme/erişim hakkı cümlesi | Talebin nasıl karşılanacağı (yalnızca analizden çıkarma mı, kalıcı silme mi) belirsiz (karar paketi madde 2, 5) |
| 6 | 18 yaş altı ekranı: "Bu koda ait bir veri saklanmadı" | Saklanan: kod, grup, "koşulu karşılamıyor" işareti ve onam zamanı; yaş ve diğer yanıtlar saklanmaz. Ayrıca, "Hayır" cevabından **önce** sunucuya gönderilmiş olay varsa (onam ve oturum başlangıcı: tarayıcı türü, ekran boyutu) onlar da kalır (bekleyen kuyruk silinir, gönderilmişler silinmez). **Cümle bu haliyle yanlış; kesin durumu gerçek kayıtta kontrol et** |
| 7 | Tarayıcı verisi silinirse | Yeni yuva alınır, eski kayıt bulunamaz; onamda yazmıyor (menüde uyarı var) |

## 2. v2 metni (öneri)

> `etik/onam_metni_v1.txt` ile aynı bölüm sırası; **değişen yerler kalın** gösterildi (dosyaya yazılırken kalın işaret konmaz). Dil v1'deki gibi ikinci tekil kişidir.

**İLK LOT ARAŞTIRMASI**
Gönüllü katılım ve bilgilendirme metni (sürüm v2)
[DOLDUR: tarih]

**ÖZET**
- Yaklaşık 30 dakika; gerçek para yok.
- Adın, e-postan ya da öğrenci numaran istenmez; verilerin **sistemin atadığı rastgele bir katılım koduyla** eşleşir.
- Gönüllüsün; istediğin an gerekçe göstermeden çekilebilirsin; **çekilirsen verilerin analize alınmaz.**

**ARAŞTIRMANIN AMACI** *(v1 ile aynı)*
Bu çalışma, üniversite öğrencilerinin yatırım kararlarını, piyasada sert düşüş gibi baskılı durumlarda nasıl verdiğini inceliyor. Bulgular, gençlere yönelik finansal okuryazarlık eğitimlerinin geliştirilmesine katkı sağlamayı amaçlıyor.

Araştırmanın bazı ayrıntıları, davranışını etkileyebileceği için çalışmanın sonunda açıklanacak. O noktada tam bilgi verilecek ve istersen verilerinin kullanılmasını reddedebileceksin.

**NE YAPACAKSIN?** *(v1 ile aynı)*
Kısa bir form (isteğe bağlı), iki kısa test, iki alıştırma, toplam 12 kısa karar ve 7,5 dakikalık bir piyasa simülatörü (öncesinde 30 saniyelik bir alıştırma). Toplam yaklaşık 30 dakika sürer.

Hiçbir aşamada gerçek para kullanılmaz. Hisse adları gerçek BIST şirketlerine ait olabilir; ama fiyatlar, grafikler ve haberler tamamen kurgusaldır ve bu şirketlerin gerçek durumunu yansıtmaz.

**NELER KAYDEDİLİR?**
Verdiğin kararlar ve bunları verme süren, simülatördeki işlemlerin, test ve anket cevapların, uygulamada hangi ekranlarda ne kadar kaldığın, cihaz türü ve ekran boyutu gibi teknik bilgiler. **Bunlar, sana atanan rastgele katılım koduyla ve bu tarayıcıya bağlı rastgele bir oturum kimliğiyle eşleştirilir.**

Adın, e-postan, telefon numaran, öğrenci numaran, konumun, sesin ve görüntün kaydedilmez. Form sorularının hepsi isteğe bağlıdır; yaş sorusu sadece katılım koşulunu (18 yaş ve üzeri) denetlemek içindir.

**Uygulamayı barındıran ve oturumunu yöneten hizmetlerin (Google Firebase) teknik kayıtlarında IP adresin gibi bilgiler tutulabilir; bunlar araştırma verisiyle eşleştirilmez.**

**GİZLİLİK VE KVKK**
**Verilerin, adınla değil, sistemin atadığı rastgele bir katılım koduyla ve bu tarayıcıya bağlı rastgele bir oturum kimliğiyle eşleşir; araştırmacı seni isimle tanımaz. [KVKK-YANITI: "anonim" mi, "takma adlı" mı: önerilen ifade "verilerin kimliğini doğrudan belirtmez; takma adlı olarak işlenir"].**

Veri sorumlusu: [DOLDUR: üniversite ve araştırmacı adı]. **Araştırma verileri Google Firebase üzerinde [DOLDUR: ABD / Avrupa] veri merkezlerinde saklanır; oturum ve kimlik doğrulama hizmeti Google tarafından ABD'deki veri merkezlerinde işlenir. Bu nedenle verilerin yurt dışına aktarılır. [KVKK-YANITI: aktarımın dayanağı ve onaylı ifade, örn. standart sözleşme].** Veriler yalnızca bu araştırmada kullanılır. Saklama süresi: [DOLDUR: örn. araştırma bittikten sonra 2 yıl].

**Veriler, hizmet sağlayıcı (Google) dışında üçüncü kişilerle paylaşılmaz;** sonuçlar yayımlanırsa yalnızca kimliksiz ve toplu olarak yayımlanır. KVKK kapsamında verilerine erişme, düzeltilmesini ve silinmesini isteme haklarını [DOLDUR: iletişim adresi] adresine başvurarak kullanabilirsin. **[KVKK-YANITI: silme talebinin nasıl karşılanacağı; öneri: "Verilerin kimliksiz olduğundan, talebini sana verilen katılım koduyla birlikte iletmen gerekir"].**

**OLASI RAHATSIZLIKLAR VE YARARLAR** *(v1 ile aynı)*
Simülatörde piyasada sert düşüşler olacak; bu bir miktar gerginlik yaratabilir. Gerçek para olmadığı için maddi bir riskin yok. Rahatsız olursan istediğin an durabilirsin. Çalışma sırasında bazı noktalarda ne kadar gergin hissettiğini soracağız; cevaplamak zorunda değilsin.

Katılmanın sana doğrudan bir yararı yok; bulgular finansal okuryazarlık çalışmalarına katkı sağlayabilir. Çalışmanın sonunda, rahatsız hissedersen başvurabileceğin destek bilgisi de verilecek. Uygulama yatırım tavsiyesi vermez.

**ÇEKİLME HAKKIN**
Çalışma sırasında sağ üstteki ⋯ menüsünden **"Çalışmadan çekil"** diyebilirsin (**yanlışlıkla çekilmemen için bir onay sorusu daha çıkar**). Gerekçe göstermen gerekmez ve bunun bir sonucu olmaz. **Çekilirsen bu katılıma ait veriler analizden çıkarılır ve hiçbir analizde, tabloda ya da yayında kullanılmaz; kayıt geri açılmaz. Kimliksiz ham kayıt, saklama süresi ([DOLDUR]) dolana kadar güvenli sunucuda tutulur ve süre sonunda silinir. [KARAR: kalıcı silme talep üzerine yapılacaksa bu cümle değişir (karar paketi madde 2, seçenek B)].**

Sonuçlar analiz edilip yayımlandıktan sonra, kimliksiz toplu sonuçlardan senin verini ayıklamak mümkün olmayabilir.

**Tarayıcı verilerini silersen ya da başka bir tarayıcıdan girersen sistem seni yeni bir katılımcı olarak görür ve önceki kaydına dönemezsin; çalışmayı bitirene kadar aynı tarayıcıyı kullan.**

**İLETİŞİM VE ETİK ONAY** *(v1 ile aynı)*
Sorularını [DOLDUR: iletişim adresi] adresine iletebilirsin.

Bu çalışma [DOLDUR: etik kurul adı, tarih ve sayı] onayıyla yürütülür.

Bu metni indirmen, çalışmaya katılmayı kabul ettiğin anlamına gelmez.

> **Pilot notu (karar paketi madde 17):** Pilotta "Çalışmadan çekildin" ekranında "Yeni katılım başlat" seçeneği açıktır; çekilen kişi ayrı bir yeni katılım başlatabilir. Ana veri toplamada kapatılır (`ALLOW_FRESH_START_AFTER_WITHDRAWAL = false`). Pilot katılımcısına bu seçenek onam metninde anlatılmaz, ekranda açıklanır; etik kurul pilotta "yeniden katılım"ı kabul etmiyorsa pilotta da kapatılmalıdır.

## 3. Uygulamada değişecek yerler (v2 onaylanınca)

| # | Yer | Şimdiki ifade | v2'de |
|---|---|---|---|
| 1 | `public/src/views/consent-view.js` satır 65 | "Verilerin yalnızca sana verilen rastgele bir kodla eşleşir; araştırmacı seni isimle tanımaz." | Yukarıdaki "GİZLİLİK VE KVKK" ilk paragraf |
| 2 | Aynı dosya, satır 58 | "Uygulamayı barındıran hizmetin teknik kayıtlarında IP adresin gibi bilgiler tutulabilir …" | "… barındıran ve oturumunu yöneten hizmetlerin (Google Firebase) …" |
| 3 | Aynı dosya, satır 70 civarı ve `CONFIG.consentInfo.hosting` | `[DOLDUR]` yer tutucusu | Konum ve ABD'deki kimlik doğrulama cümlesi (KVKK yanıtına göre) |
| 4 | Aynı dosya, satır 73 | "Veriler üçüncü kişilerle paylaşılmaz …" | "Veriler, hizmet sağlayıcı (Google) dışında …" ve silme talebi cümlesi |
| 5 | Aynı dosya, satır 90 | "… ⋯ menüsünden "Çalışmadan çekil, verilerimi sil" … veriler analizden çıkarılır ve silinir." | "Çalışmadan çekil" ve soft delete ifadesi, ikinci onay, tarayıcı uyarısı |
| 6 | Aynı dosya, satır 114 (indirilen metnin özeti) ve satır 153–159 (özet kartları: "Kimliksiz", "Gönüllüsün") | "verilerin silinir", "verilerin silinir." | "verilerin analize alınmaz"; "Kimliksiz" kutusu için karar paketi madde 3'e göre başlık ("Takma adlı" ya da "Kimliğin tutulmaz") |
| 7 | `public/src/views/menu-view.js` satır 74 | düğme: "Çalışmadan çekil, verilerimi sil" | "Çalışmadan çekil" |
| 8 | `public/src/views/end-view.js` satır 108 | düğme: "Çalışmadan çekil, verilerimi sil" | "Çalışmadan çekil" |
| 9 | `public/src/viewmodels/actions/ui-actions.js` satır 47 (ilk onay penceresi) | "Bu koda ait tüm verilerin analizden çıkarılacak ve silinecek. Bu kodla tekrar giriş yapamayacaksın." (düğme "Çekil ve sil") | "Bu katılıma ait tüm verilerin analizden çıkarılacak. Bu kayıtla tekrar giriş yapamayacaksın." (düğme "Çekil") |
| 10 | `public/src/views/stage-view.js` satır 91 ("Çalışmadan çekildin" ekranı) | "Verilerin analize dahil edilmeyecek ve araştırmacı tarafından kalıcı olarak silinecek." | "Verilerin analize dahil edilmeyecek." |
| 11 | Aynı dosya, 18 yaş altı ekranı (`inelig`) | "Bu koda ait bir veri saklanmadı." | "Yaşın ve diğer yanıtların saklanmadı; yalnızca katılım koşulunu karşılamadığın bilgisi (ve o ana kadar gönderilmiş teknik bilgiler) katılım koduyla birlikte tutulur." (kesin metin, gerçek kayıt kontrolünden sonra) |
| 12 | `public/src/constants/app-config.js` | `CONSENT_VERSION = 'v1'`, `consentInfo` yer tutucuları | `'v2'`, doldurulmuş alanlar |
| 13 | `etik/onam_metni_v1.txt` → `etik/onam_metni_v2.txt`; `etik/materyalleri_uret.py` yeniden çalıştırılır | v1 | v2 (ve veri akışı şeması konum bilgisiyle güncel) |
| 14 | `etik/ETIK_KURUL_BASVURU_TASLAGI.md`, `docs/TUBITAK_YONTEM_BOLUMU.md` (satır 85), `tanitim.html`, poster | "verisi silinir" ve "kimliksiz" ifadeleri | v2 ile uyumlu |

**Uygulama etkileri:** `CONSENT_VERSION` değişince kimin hangi sürümü kabul ettiği kayıtlarda ayrışır (`consent_version` sütunu); pilot kayıtları v1'de kalırsa analizde ayrılmalıdır. `python firebase/dagit.py --kilitle` sonrası bu değişiklik yeni sürüm sayılır (`APP_VERSION` artar, ön kayıt öncesinde yapılmalı). `testler/ekran_testleri.py` içindeki onam testi ("Kimliksiz", "Gönüllüsün") yeni başlıklara göre güncellenir; `etik/` materyalleri yeniden üretilir.

## 4. Açık sorular (KVKK birimi ve etik kurul)
1. **Aydınlatma metni ile açık rıza ayrı mı sunulmalı?** KVKK Kurumu kılavuzları genellikle ikisinin ayrı olmasını önerir; bu belge ikisini v1 gibi tek metinde tutuyor. Birimin yanıtına göre onam ekranı iki adıma bölünebilir (yeni ekran ve test gerektirir).
2. Veri "anonim" mi, "takma adlı" mı sayılıyor (karar paketi madde 3).
3. Silme talebi nasıl karşılanacak (madde 2): yalnızca analizden çıkarma mı, kalıcı silme mi; kalıcı silme seçilirse bu, uygulamada bir silme yolu gerektirir (şu an yok, kurallar da izin vermiyor).
4. Saklama süresi (madde 5) ve saklama bitince silmenin kim tarafından, nasıl yapılacağı.
5. Yurt dışı aktarım dayanağı ve metinde yazacak ifade (madde 1).
6. Pilotta "Yeni katılım başlat"ın kabul edilebilirliği (madde 17).
