# İlk Lot: web uyumu, gerçek veri ve ayrı yönetim paneli planı

**Durum: PLAN. Hiçbir kod değişmedi.** Onayından sonra başlanır. Aşağıdaki "Senden gerekenler" bölümündeki kararlar gelmeden dokunmayacağım.

## 1. Şu an ne var (ölçtüklerim)

| Konu | Bugün | Sonuç |
|---|---|---|
| **Genişlik** | Uygulama `max-width: 460px` bir sütun; ekran büyüyünce ortada dar bir telefon gibi durur. Sayfa kaydırması iç kutuda (`body` kaydırmaz). Genişlik kuralı yalnızca küçük telefonlar için var (≤379 px, ≤359 px). | Bilgisayarda yaşadığın "uymuyor" sorunu bu. |
| **Sahte/yerel veri** | Firebase açılmazsa uygulama **sessizce yerel moda düşer** ve 40 örnek kod üretir. Kod ekranında "Demo modu… bir koda dokun" düğmeleri var. Ayrıca tanıtım modu (`?demo=1`), hızlı test modu (`?hizli=1`), pilot formu (`?pilot=1`) var. Koddaki `DEMO` ifadesi 30 yerde geçiyor. | Gerçek çalışmada bunların hiçbiri olmamalı. |
| **Yönetim paneli** | Katılımcı uygulamasının içinde: logoya 5 kez dokunma ya da `#admin`. `04_study.js` dosyasının **%81'i** (≈41 KB) panel, CSV, kart/QR, afiş kodu; QR kütüphanesi (30 KB) de büyük ölçüde panel için. Her katılımcı bu kodu indiriyor. | Ayrılması gereken kısım net ve büyük. |
| **Firebase** | Config yazıldı, kurallar yayında (`ilk-lot-pilot`), katılımcı anonim girişi ve araştırmacı e-posta girişi kodda var. **Gerçek bağlantı testi bitmedi:** sistem testi sonucu ve Firestore'a veri düşmesi henüz doğrulanmadı. Hosting'e yayın yapılmadı. | Önce bu kapanacak. |

## 2. Yapılacak dört iş

### A. Web (responsive) görünüm: **telefon görünümü piksel piksel aynı kalır**
- **İlke:** Yalnızca ek kurallar eklenir (`@media (min-width: 768px)` ve `(min-width: 1100px)`). 767 px'e kadar hiçbir CSS satırı değişmez, yani telefon tasarımı bozulamaz.
- **Kanıt:** Elimdeki 100 referans görüntü (360 ve 412 px, açık/koyu, 25 ekran) her adımda **0 farkla** geçmek zorunda. Ek olarak 768, 1024 ve 1440 px için yeni referanslar alınır.
- **Önerilen web düzeni:**
  - Sayfa arka planı geniş, içerik daha geniş bir ana sütunda (ör. 720–960 px), kenarlarda boşluk.
  - Simülatörde bilgisayarda yan yana düzen: portföy/piyasa solda, hisse detayı ve grafik sağda (telefonda sekmeler aynen kalır).
  - Karar anı ve onam ekranları ortalanmış, okunur satır uzunluğunda.
  - Sayfanın kendi kaydırması (telefon kabuğu yerine) masaüstünde doğal olur.
- **Dokunulmayacaklar:** renkler, yazı tipi, metinler, akış sırası, fiyat yolları, `CFG`.

### B. Sahte veri ve yerel modun kaldırılması
- Üretim derlemesinde **yalnızca Firebase** vardır: yerel kayıt, 40 örnek kod, "Demo modu" düğmeleri, hızlı test modu, `?demo=1`, `?pilot=1` kaldırılır.
- Firebase'e ulaşılamazsa sessiz yerel moda geçmek yerine **hata ekranı** çıkar ("Bağlantı kurulamadı, tekrar dene"). Hiçbir veri yerel modda yazılmaz.
- **Sınır:** Simülatördeki kurgusal hisse fiyatları, haberler ve krizler araştırmanın **uyaranıdır** (deney tasarımı, fiyat yolu özeti `3171573551 18600`). Bunlar "sahte veri" sayılıp silinemez. Kaldırılacak olan, kayıt/kod/oturum tarafındaki örnek ve yerel verilerdir.
- **En büyük iş:** 44 uygulama testinin hepsi şu an yerel modda koşuyor. Üretim kodunda yerel mod kalmayacağı için testler **sahte Firebase SDK'sı** üzerinden koşacak şekilde yeniden bağlanır (`sayfa()` yardımcısı bunu merkezden yapar; bu kolaylaştırır). Böylece testler gerçek üretim koduyla çalışır.

### C. Yönetim panelini ayrı dosyaya taşıma
- **Yeni çıktı:** `yonetim.html` (ayrı derlenir, ayrı adreste açılır). `ilk-lot.html` içinde panel kodu, logoya 5 dokunma ve `#admin` **hiç olmaz**.
- **Yeni kaynak yapısı:** `kaynak/ortak/` (Firebase katmanı, kod üretimi, uyaran parmak izi), `kaynak/katilimci/`, `kaynak/yonetim/` (panel, CSV, kartlar/QR, afiş, sistem testi, canlı pano). `derle.py` iki dosya üretir.
- Yönetim paneli **masaüstü öncelikli** tasarlanır (geniş tablolar, yan yana kutular); yeni dosya olduğu için tasarım kısıtı yok.
- **Adres:** iki seçenek, birini seç. (1) Aynı Firebase Hosting sitesinde ayrı yol: `.../yonetim.html`. (2) Firebase'de **ikinci bir site** (ör. `ilk-lot-yonetim.web.app`): adres tamamen ayrı, Spark planında ücretsiz. Önerim 2.
- **Güvenlik notu:** Ayrı adres **bir gizlilik değil, düzen** sağlar. Asıl koruma Firestore kuralları ve araştırmacı girişidir (yalnızca `erengltkn1905@gmail.com`). `yonetim.html`'e arama motoru girmesin diye `noindex` konur. Ayrıca kural tarafına "e-posta doğrulanmış olmalı" şartı eklemeyi öneriyorum.
- **Dikkat:** Aynı tarayıcıda hem panele hem katılımcı sayfasına giriş yapılırsa Firebase oturumu paylaşılır; katılımcı testi yaparken panel oturumunu kapatmak gerekir. Panelde bu uyarı ve belirgin "Çıkış" olur.

### D. Firebase'in uçtan uca bağlanması
1. Sistem testi ve bir test oturumunun Firestore'a düştüğünü birlikte doğrulama (bu turdaki bekleyen iş).
2. Authentication: Anonim ve E-posta/Şifre açık mı, yetkili alan adları (yayın adresi eklenir).
3. İki Hosting sitesi (katılımcı + yönetim), `dagit.py` ön kontrolü iki dosya için güncellenir.
4. Test verilerinin temizlenmesi (politika A'da silme yok; konsoldan elle).
5. Gerçek cihaz protokolü (`docs/GERCEK_CIHAZ_TESTI.md`) C bölümü.

## 3. Sıra ve her adımın kapısı
0. **Önce:** `02_core.js` biçimlendirme sorununu çöz (aşağıda). Araç testleri 14/14'e dönmeli.
1. **Firebase doğrulaması** (D.1–D.2): küçük, risksiz, her şeyin temeli.
2. **Responsive web** (A): sadece CSS; her adımda 100 referans = 0 fark.
3. **Sahte veri/yerel mod kaldırma** (B) + testlerin sahte SDK'ya taşınması. Bitince 44 test geçmeli.
4. **Yönetim panelini ayırma** (C) + `derle.py` iki çıktı + `dagit.py`.
5. **Hosting yayını** (D.3), gerçek bağlantı testi, belgeler ve rapor.

Her adım ayrı commit. Kırmızı test varsa sonrakine geçilmez. Beklenen büyüklük: A ve D küçük/orta, **B ve C büyük** (ikisi de test altyapısına dokunuyor). Bunlar günler değil saatler mertebesinde ama tek oturuma sığmayabilir.

## 4. Riskler
- **Tek dosya kuralı değişiyor:** Proje "tek HTML" idi; artık iki HTML (`ilk-lot.html`, `yonetim.html`). Her biri kendi içinde bağımsız, paket yöneticisi/framework yok. Yine internetsiz derlenir.
- **Ortak kod çoğalır:** İki dosya aynı Firebase katmanı ve uyaran kodunu içerir (kaynak tek, çıktı iki). Yönetim dosyası tahminen 150–200 KB olur (ölçülmedi).
- **CSV sözleşmesi, olay adları, `CFG`, fiyat yolu:** değişmez; ayrılma sırasında her adımda hash ve CSV başlık testleri koşar.
- **Test kapsamı:** gerçek telefon, gerçek kota ve gerçek kullanım yine denenmemiş kalır.
- **Pilot başlamadan yapılmalı:** Pilottan sonra `CFG` ve davranış değiştirmek veriyi bölerdi. Bu plan davranışı değiştirmediği için güvenli, ama `APP_VERSION` artar (b27+).

## 5. Senden gerekenler (kararlar)
1. **"Dummy veri" tanımı:** Yerel mod, 40 örnek kod, demo/hızlı test/pilot modları ve tanıtım düğmeleri gidecek. Simülatörün kurgusal fiyatları/haberleri **kalacak**. Doğru mu?
2. **Tanıtım modu (`?demo=1`):** Sunumda kullanmak için tutulsun mu (ayrı küçük bir "tanıtım" dosyası olarak, kayıtsız) yoksa tamamen kalksın mı? Önerim: ayrı dosya olarak kalsın (`tanitim.html` zaten var), katılımcı uygulamasında olmasın.
3. **Yönetim adresi:** Aynı sitede ayrı yol mu, ikinci Hosting sitesi mi? (Önerim: ikinci site.)
4. **Web düzeni:** Önerdiğim (geniş ana sütun + simülatörde iki sütun) uyar mı, yoksa telefonu sadece ortada büyütmemi mi istersin?
5. **Bilgisayardan katılım:** Gerçek katılımcılar bilgisayardan da girecek mi? (Girecekse web düzeni araştırma verisini de etkiler: pencere genişliği ve tarayıcı bilgisi zaten kaydediliyor (`innerWidth`, `userAgent`), analizde kovaryat olabilir; yine de gruplar arası dengelendiği kontrol edilmeli. Danışmanla konuşulmalı.)

## 6. Önce çözülmesi gereken bir sorun
`kaynak/02_core.js` biçimlendirilmiş (örn. `var APP_VERSION = '…'`). Ben farkında olmadan commit'leyip GitHub'a göndermişim. `derle.py` sürümü "?" gösteriyor, `dagit.py` CFG'yi bulamıyor, 6 araç testi kırmızı. İki yol: biçimlendirmeyi geri almak (önerim, 5 dakika) ya da araçları yeni biçime uyarlamak. Bu karar plana başlamadan lazım.
