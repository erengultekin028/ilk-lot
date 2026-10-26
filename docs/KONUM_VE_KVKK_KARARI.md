# İlk Lot: veri konumu ve KVKK kararı (karar paketi madde 1)

> Hazırlayan: Claude, 26 Ekim 2026. **Hukuki görüş değildir.** Aşağıdaki "doğrulanan gerçekler" resmî Firebase belgelerine ve KVKK Kurumu duyurularına dayanır (bağlantılar ilgili satırlarda); hukuki yorumlar ise kurumunuzun KVKK/hukuk birimince onaylanmalıdır. Kodda hiçbir şey, bu karar verilmeden değiştirilmedi.

## 1. Bir bakışta (özet)

1. **Firestore'u AB'ye taşımak, yurt dışı aktarımı ortadan kaldırmaz.** Türkiye'de Firestore konumu yok (AB de Türkiye açısından yurt dışı), üstelik **Firebase Authentication yalnızca ABD veri merkezlerinde çalışıyor** ([Firebase gizlilik sayfası](https://firebase.google.com/support/privacy)); IP günlükleri birkaç hafta tutuluyor. Katılımcı anonim girişle bağlandığı için bu ABD işlemesi her seçenekte vardır.
2. AB bölgesinin sağladığı fark **araştırma verisinin (kararlar, testler, demografik aralıklar, olaylar)** saklandığı yerdir: ABD yerine AB. Bu etik başvuruda anlatımı kolaylaştırır; hukuki zorunluluğu kaldırmaz.
3. **Konum sonradan değiştirilemez** ([Firestore konum belgesi](https://firebase.google.com/docs/firestore/locations): "once you provision a database instance, you cannot change its location setting"). Gerçek veri henüz yok; bu yüzden taşıma **en ucuz zaman şimdi**.
4. **Önerim:** Önce KVKK birimine bölüm 7'deki soruları sor. Birim "bölge fark etmez, standart sözleşme gerekir" derse **nam5'te kal** ve güvenceyi tamamla. Birim ya da etik kurul "veri AB'de olsun" derse **eur3'e taşı** (bölüm 6, tahmini 2–3 saat). Soruyu sormadan taşıma, işe yaramayan bir iş olabilir.

## 2. Doğrulanan gerçekler

| Konu | Gerçek | Kaynak |
|---|---|---|
| Firestore konumları | Çok bölgeli: **eur3** (Avrupa), **nam5** (ABD merkez), **nam7** (ABD merkez+doğu). Avrupa'da tek bölgeler: Londra, Belçika, Hollanda, Milano, Madrid, Paris, Torino, Berlin, Frankfurt, Finlandiya, Stockholm, Varşova, Zürih. Orta Doğu: Doha, Dammam, Tel Aviv. **Türkiye/İstanbul yok.** | [Firebase belgesi](https://firebase.google.com/docs/firestore/locations) |
| Konum değişmez | Bir kez oluşturulunca konum değiştirilemez; varsayılan veritabanı konumu proje düzeyinde de sabit | Aynı belge |
| Authentication | Yalnızca ABD veri merkezlerinde çalışır; IP günlükleri birkaç hafta tutulur; diğer kimlik verisi, müşteri kullanıcıyı silene kadar tutulur ve silmeden sonra 180 güne kadar yedeklerden kalkar | [Firebase gizlilik sayfası](https://firebase.google.com/support/privacy) |
| Diğer Firebase hizmetleri | Konum seçimi sunmayan hizmetlerde veri Google'ın tesislerinde herhangi bir yerde işlenebilir | Aynı sayfa |
| KVKK m. 9 (yurt dışı aktarım) | 7499 sayılı Kanun'la 1 Haziran 2024'te değişti: sırasıyla **yeterlilik kararı**, **uygun güvenceler** (standart sözleşme, bağlayıcı şirket kuralları vb.) ve istisnai haller. Standart sözleşme imzalandıktan sonra **5 iş günü içinde** Kurum'a bildirim gerekir; ayrıntı Yönetmelik'te (RG 10.07.2024, 32598) | [KVKK Kurumu duyurusu](https://www.kvkk.gov.tr/Icerik/7938/Standart-Sozlesmeler-ve-Baglayici-Sirket-Kurallarina-Iliskin-Dokumanlar-Hakkinda-Kamuoyu-Duyurusu), [özet haber](https://www.alomaliye.com/2024/10/30/kvkk-standart-sozlesme-bildirim-modulu/) |

**Doğrulanamayanlar (kurum yanıtlamalı):** ücretsiz (Spark) planda eur3'ün seçilebilir olduğu (beklenir, ama yeni projede denemeden söyleyemem); anonim oturum kimliğinin Google tarafında kişisel veri sayılıp sayılmadığı; açık rızanın yurt dışı aktarım için tek başına yeterli olup olmadığı (2024 değişikliğinden sonra istisnai hallere indirildiği izlenimi var, **metni kurumunuz doğrulamalı**).

## 3. Veri envanteri: ne, nerede, kimde

| Veri | Nerede | Konumu seçebilir miyiz? | Not |
|---|---|---|---|
| Karar, süre, test, simülatör işlemleri, demografik aralıklar, serbest metin (≤400 kr), `ua` (tarayıcı, 120 kr) ve ekran boyutu | **Firestore** (`participants`, `events`) | **Evet** (nam5 şimdi) | Araştırma verisinin kendisi |
| Yuva listesi, grup, yuva sırası | Firestore (`allocations`, `slots`, `claims`) | Evet | Gruplar yalnızca araştırmacıda |
| Anonim oturum kimliği (uid) ↔ yuva kodu | Firestore (`users`) ve **Authentication** | Firestore evet; **Auth hayır (ABD)** | Tarayıcıya bağlı takma ad; kişiyi göstermez ama veri teknik olarak takma adlıdır |
| IP adresi, oturum belirteci | **Authentication / Hosting / gstatic** günlükleri | **Hayır** | Araştırma verisiyle eşleştirilmez; Google'da kalır |
| Araştırmacı e-postası ve şifresi | Authentication (ABD) | Hayır | Tek hesap |
| Sayfa dosyaları | Firebase Hosting (küresel CDN) | Hayır (CDN) | Erişim günlüğü Google'da |
| Oturum anlık görüntüsü, olay kuyruğu | Katılımcının tarayıcısı (localStorage) | — | Cihazda |
| CSV/JSON dışa aktarımlar, tam yedek | Araştırmacının diski | — | Şifreli diskte tutulmalı |
| Kod ve belgeler | GitHub (herkese açık depo) | — | **Katılımcı verisi yok** |

**Onamdan önceki temas:** Sayfa açılır açılmaz uygulama Firebase SDK'sını (`gstatic.com`) yükler ve **anonim giriş yapar**; yani onam ekranı gösterilirken bile Google'a istek gider ve bir anonim kullanıcı oluşur. Araştırma verisi yazılmaz ama IP ve oturum kimliği işlenir. (Bkz. seçenek D.)

## 4. Seçenekler

| | Seçenek | Ne değişir | Artı | Eksi | İş (benim) | Risk |
|---|---|---|---|---|---|---|
| **A** | **nam5'te kal** + yurt dışı güvencelerini tamamla | Kod aynı kalır; kurum standart sözleşme/KVKK sürecini yürütür | Sıfır teknik iş, mevcut proje ve bağlantılar durur | Araştırma verisi ABD'de; etik kurul tepkisi olabilir | Yok (belgeleri güncellerim) | Kurum süreci uzayabilir |
| **B** | **eur3'e taşı** (AB çok bölgeli: Belçika+Hollanda, Finlandiya tanık) | Yeni Firebase projesi; Auth yine ABD | Araştırma verisi AB'de; ABD'ye benzer çok bölgeli dayanıklılık | Aktarım yine var (Auth/IP); site adresi değişir; bir kez emek | 2–3 saat (bölüm 6) | URL değişimi (poster/QR basılmadan yap) |
| **B2** | **Tek bölge AB** (ör. Frankfurt `europe-west3`) | B ile aynı | Verinin tek ülkede olduğunu söylemek kolay | Çok bölgeliye göre daha az dayanıklı | B ile aynı | B ile aynı |
| **C** | **Kurum sunucusu / Türkiye** (Firebase dışı) | Veritabanı, kimlik, yetki ve yedek sıfırdan yazılır | Aktarım olmayabilir | **Hafta mertebesinde iş**, güvenlik kurallarının test altyapısı gider, bakım yükü | Büyük (ayrı proje) | Yüksek. Yalnızca kurum zorunlu tutarsa |
| **D** | **Onam öncesi temas azaltma** (A veya B ile birlikte) | Statik site kurum sunucusunda ya da Hosting'de kalır; Firebase SDK ve anonim giriş **yalnızca onamdan sonra** yüklenir (yeni ziyaretçi için) | Onamdan önce Google'a veri/IP gitmeyen bir akış (Hosting'i de kurumda barındırırsanız) | Dönen katılımcıyı tanımak için yerel bir işaret gerekir; barındırma kararı sizin; akış ve test değişir | ~yarım gün + test | Orta (akışı etkiler, ekran testleriyle kapsanır) |

**Hiçbir seçenek** şunu söyletmez: "Veri Türkiye'dedir" (C hariç). A ve B için etik başvuruda doğru ifade: *"Araştırma verileri [ABD/AB] bölgesinde Google Firebase'de saklanır; kimlik doğrulama ve ağ günlükleri ABD'de işlenir; aktarım [dayanak] ile yapılır."*

## 5. Öneri

1. **Bu hafta:** Bölüm 7'deki soru listesini kurumunuzun KVKK birimine ve danışmanınıza gönderin.
2. **Yanıta göre:**
   - "Standart sözleşme ile ABD de olur" → **A** (+ onam metnine ABD'yi yaz).
   - "Veri AB'de kalsın / etik kurul istiyor" → **B** (çok bölgeli) ya da **B2**, projeyi **poster/QR basılmadan ve pilottan önce** taşıyın.
   - "Kurum dışına çıkamaz" → **C**'yi ayrı bir iş olarak planlayın (bu çalışma için büyük); o zaman bütçe ve süre değişir.
3. **Hangisi seçilirse seçilsin** D'yi (onamdan önce temas azaltma) değerlendirin; en çok etik savunulabilirlik sağlayan, ucuz iyileştirme budur.
4. Kararı bu belgede bölüm 8'e işleyin; ardından benden uygulamasını isteyin.

## 6. Taşıma planı (B / B2 seçilirse)

**Önkoşul:** Seçim (eur3 ya da bir AB bölgesi) ve kimin Firebase hesabıyla yeni proje kurulacağı.

| Adım | Kim | Ne | Süre |
|---|---|---|---|
| 1 | Sen (konsol) | Yeni Firebase projesi aç (ör. `ilk-lot-eu`); **Firestore'u seçilen konumla** oluştur (üretim kipi); Authentication'da **Anonim** ve **E-posta/Şifre**'yi aç; araştırmacı kullanıcısını ekle; web uygulaması ekle, yapılandırmayı (config) bana ver | 20–30 dk |
| 2 | Ben | Yeni projeye geçiş: `.firebaserc`, `CONFIG.firebase` (`public/src/constants/app-config.js`), `CONFIG.consentInfo.hosting` metni için öneri, GitHub Actions `projectId` ve yeni servis hesabı sırrı (`firebase init hosting:github`), belgelerdeki proje adı | 30 dk |
| 3 | Ben | Kuralları yeni projeye yayınla (`firebase deploy --only firestore:rules`, önce `--dry-run`); `firebase/kural_testleri` 18/18 yeniden | 10 dk |
| 4 | Ben + sen | Yetkili alan adları (Authentication → Settings) kontrolü; `python firebase/dagit.py` ön kontrol; panelde giriş, **Sistem testini çalıştır**, **Yeni liste** (8 kişi), bir deneme oturumu, **Test kaydı işaretle**, **Tam yedek** | 30–45 dk |
| 5 | Ben | `python testler/ekran_testleri.py`, `npm run check:*`, yayın; README/KURULUM/CLAUDE/DEVIR güncelle; onam (v1 veya v2) ve etik başvuru konum ifadesi için metin önerisi (onayına) | 30 dk |
| 6 | Sen | Eski projeyi (`ilk-lot-pilot`): önce **Tam yedek** al; sonra projeyi silmek (30 gün geri alınabilir) ya da pasif bırakmak sana kalmış. **Ben silmem.** | — |

**Geri dönüş:** Eski proje silinene kadar yaşar; sorun çıkarsa `CONFIG.firebase` ve `.firebaserc` eski değere döner (tek commit).

**Taşınmayacaklar:** Mevcut Firestore içeriği (yalnızca deneme kayıtları var; gerekirse Tam yedekten alınır, geri yükleme aracı yazılmadı). Yuva listesi yeni projede yeniden oluşturulur.

**Maliyet:** Ücretsiz planda kalması beklenir; yeni projede doğrularım. **Adres değişir** (`ilk-lot-pilot.web.app` yerine yeni ad): README, panel bağlantısı, poster ve QR güncellenir; bu yüzden **basım ve dağıtımdan önce** karar verin.

## 7. KVKK birimine ve etik kurula sorulacaklar

1. Toplanan veri (rastgele kod, davranış verisi, aralıklı demografik bilgi, tarayıcıya bağlı anonim oturum kimliği, tarayıcı/ekran bilgisi) **kişisel veri** sayılıyor mu? Hangi alanlar?
2. **Veri sorumlusu** kim (üniversite mi, araştırmacı mı)? Google bu durumda **veri işleyen** mi?
3. Firebase kullanımında yurt dışı aktarım **hangi dayanakla** yapılabilir? **Standart sözleşme** gerekiyorsa kim imzalar, 5 iş günü içindeki Kurum bildirimini kim yapar, Google'ın hangi belgesi kullanılır?
4. **Veri AB bölgesinde saklanması** değerlendirmeyi değiştiriyor mu, yoksa Kimlik Doğrulama ve ağ günlüklerinin ABD'de işlenmesi nedeniyle aynı mı kalıyor?
5. **Açık rıza** (onam ekranı) bu aktarım için tek başına yeterli mi?
6. Onam metnine ve etik başvuruya **hangi ifade** yazılmalı (konum, aktarım, işleyen, saklama süresi)?
7. **VERBİS** kaydı ya da başka bir kurumsal yükümlülük gerekiyor mu?
8. Onamdan önce Google'a giden istekler (sayfa yüklemesi, SDK, anonim giriş) için bir ek önlem isteniyor mu? (seçenek D)
9. Saklama süresi ve silme prosedürü (politika A soft delete ile uyum, onam v2).

## 8. Karar kaydı

| Tarih | Karar | Kim | Not |
|---|---|---|---|
| | ☐ A · ☐ B · ☐ B2 · ☐ C | | |
| | D uygulansın mı: ☐ evet ☐ hayır | | |
| | KVKK birimi yanıtı (özet) | | |
