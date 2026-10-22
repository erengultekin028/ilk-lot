# Gerçek cihaz ve Firebase deneme protokolü

Otomatik testler (`testler/uygulama_testleri.py`) masaüstü Chromium'da çalışır ve Firebase'i **sahte bir SDK** ile dener. Aşağıdakileri yalnızca gerçek telefonlarda ve gerçek Firebase projende görebilirsin. Her satırı işaretle, sonucu yaz.

**Önkoşul:** Uygulamayı kendi adresinde yayınla (Firebase Hosting ya da GitHub Pages) ve `CFG.firebase`'i doldur. claude.ai içinde Firebase çalışmaz; orada yalnızca yerel (demo) mod denenebilir.

**Durum sütunu:** ✅ otomatik testle denendi (masaüstü) · ⚠️ denenmedi, bu protokolde dene.

## A. Her cihazda

| # | Dene | Beklenen | Durum |
|---|---|---|---|
| A1 | Karttaki QR'ı telefonun kamerasıyla okut | Link açılır, kod ekranı atlanır, onam ekranı gelir | ⚠️ |
| A2 | Linkte `#k=KOD` var; sayfa açılınca adres çubuğuna bak | Kod adres çubuğundan silinir | ⚠️ |
| A3 | Panel → **Sistem testini çalıştır** | Tüm kontroller ✓; "Sonucu kopyala" ile kaydet | ✅ yerel · ⚠️ Firebase |
| A4 | Tam akış (kartla, baştan sona) | 12 karar + simülatör + bitiş tamamlanır | ✅ yerel · ⚠️ Firebase |
| A5 | Lot kutusuna dokun, klavyeyle yaz | Klavye açılınca "lot sat/al" düğmesi ve özet erişilebilir kalır | ⚠️ (masaüstünde taklit edilemez) |
| A6 | Simülatör ortasında sayfayı yenile | Aynı fiyat ve portföyle devam | ✅ yerel · ⚠️ Firebase |
| A7 | Simülatör ortasında ekranı kilitle, 30 sn sonra dön | Piyasa duruyordu, kaldığı yerden devam; kayıt kaybı yok | ⚠️ |
| A8 | Başka uygulamaya geç, 1 dk sonra dön | Aynı | ⚠️ |
| A9 | Menü → **Başka cihazda devam et** → ikinci telefondan QR | İkinci cihaz kaldığı yerden devam eder, ilk cihaz kodu unutur | ✅ yerel · ⚠️ Firebase |
| A10 | Telefonu yatay çevir | Düzen bozulmaz, hiçbir buton kesilmez | ⚠️ |
| A11 | Sistem yazı boyutunu en büyüğe al | Metin taşmaz; tablo okunur | ⚠️ |
| A12 | Koyu mod / düşük güç modu / hareketi azalt | Okunur kontrast; ilerleme çubuğu ve animasyonlar bozulmaz | ⚠️ |
| A13 | VoiceOver ya da TalkBack ile onam ve bir karar ekranı (5 dk) | Düğmeler adlandırılmış; yükseliş/düşüş okunur; pencere (⋯ menü) açılınca ekran okuyucu başlığı okur ve arka plana geçmez | ⚠️ |
| A14 | Onam ekranında ve ⋯ menüsünde **Yazı boyutu**: Büyük ve Çok büyük seç; onam, karar, simülatör portföy ve hisse detayı ekranlarına bak (iPhone Safari ve Android Chrome/Firefox) | Metin büyür, hiçbir düğme ya da sayı kesilmez, yatay kaydırma çıkmaz, üst çubuk düğmeleri ekrana sığar; yenileyince seçim kalır | ⚠️ (yalnızca masaüstü Chromium'da denendi) |

## B. Özel durumlar

| # | Dene | Beklenen | Durum |
|---|---|---|---|
| B1 | **iPhone özel gezinme** ya da **uygulama içi tarayıcı** (WhatsApp/Instagram bağlantısı) ile aç; Sistem testi | Tarayıcı deposu ✗ olabilir. Yerel modda veri bellekte tutulur (sayfa kapanınca silinir). **Gerçek pilotta bu görünümde katılım yaptırma**; katılımcıdan Safari/Chrome'da açmasını iste | ✅ yerel · ⚠️ Firebase |
| B2 | Simülatör sırasında **uçak modunu 30 sn aç, kapat** (Firebase modunda) | Oyun devam eder; üstteki durum noktası "Bağlantı yok, veriler cihazda bekliyor" durumuna geçer; bağlantı gelince olaylar gönderilir (Sistem testinde "Olay kuyruğu" önce > 0, sonra 0) | ⚠️ |
| B3 | Yavaş ağ (Ayarlar → geliştirici → ağ hız sınırı ya da kötü Wi-Fi) | Karar ekranları takılmaz; yazma gecikmesi katılımcıyı bekletmez | ⚠️ |
| B4 | Aynı kodla iki cihazdan **aynı anda** girmeye çalış | **Korunmuyor, davranış belirsiz.** İki cihaz aynı olay numaralarını üretip birbirinin kaydını ezebilir. Katılımcıya tek cihaz kullanmasını söyle; cihaz değiştirmek gerekirse Menü → "Başka cihazda devam et" akışını kullandır (A9). Bunu bilerek deneyip ne olduğunu not et | ⚠️ |

## C. Firebase projesi

| # | Dene | Beklenen | Durum |
|---|---|---|---|
| C1 | `firestore.rules` yayınla; Firebase konsolunda **Rules Playground** | Anonim kullanıcı: kendi `allocations/{kod}` kaydını **okuyabilir**, listeleyemez; kod listede yoksa `participants` yazamaz | ⚠️ (kurallar hiç çalıştırılmadı) |
| C2 | Kullanılmamış bir kartla akışı bitir | Konsolda `participants/{kod}` (grp, consentAt, demo, pre, `sess_1` …) ve `events` alt koleksiyonu görünür | ✅ sahte SDK · ⚠️ gerçek |
| C3 | **Rules Playground**'da `participants/{kod}` üzerinde, anonim kullanıcıyla ve `grp` alanını listedekinden **farklı** bir değerle bir güncelleme simüle et | Reddedilmeli. (Konsoldaki elle düzenleme kurallardan geçmez; kuralları bu yüzden konsoldan sınayamazsın) | ⚠️ |
| C4 | Katılımcı menüden **Çalışmadan çekil** | Kayıt `withdrawn: true` olur; olaylar hâlâ durur (katılımcı silemez) | ✅ sahte SDK · ⚠️ gerçek |
| C5 | Araştırmacı olarak giriş → **Çekilenlerin verisini kalıcı sil** düğmesi | Olaylar silinir; kayıtta yalnızca kod, grup, çekilme tarihi, `purgedAt` kalır | ✅ sahte SDK · ⚠️ gerçek |
| C6 | Araştırmacı girişiyle **Sistem testi** | "Firestore yazma (araştırmacı)" ✓ | ✅ sahte SDK · ⚠️ gerçek |
| C7 | Panelden CSV indir → `analiz/ilklot_analiz.py` ile çalıştır | Sütunlar eşleşir, rapor üretilir | ✅ yerel örnek · ⚠️ Firebase çıktısı |
| C8 | Güvenlik kurallarında `arastirmaci@ornek.edu.tr` yerine kendi e-postanı yaz | Araştırmacı girişi çalışır; başkası liste okuyamaz | ⚠️ |

## D. Ekran okuyucu senaryosu (A13'ün ayrıntısı, ~15 dk, gerçek telefonda)

Otomatik tarama (`testler/erisilebilirlik_taramasi.py`) yalnızca adsız öğe, taşma ve küçük hedef gibi biçimsel sorunları arar; ekran okuyucunun **ne okuduğunu** göremez. iPhone'da VoiceOver (Ayarlar → Erişilebilirlik) ya da Android'de TalkBack ile, ekrana bakmadan şu akışı yürüt ve her satıra not düş:

| # | Dene | Beklenen | Durum |
|---|---|---|---|
| D1 | Onam ekranı: metni sırayla oku, onay kutusunu işaretle, devam et | Başlıklar başlık olarak okunur; kutu "işaretli/işaretsiz" söyler; düğme adı anlaşılır | ⚠️ |
| D2 | Kod ekranı, form, ön test soruları | Her alanın adı okunur; cevap seçenekleri tek tek ve seçili durumuyla okunur | ⚠️ |
| D3 | Karar ekranı: hisse bilgisi, yükseliş/düşüş, Sat/Tut/Al | Yükseliş ve düşüş yalnız renkle değil sözle de anlaşılır; üç düğme ayırt edilir | ⚠️ |
| D4 | ⋯ menüsünü aç, kapat | Açılınca pencere başlığı okunur, odak pencerede; arka plana geçilemez; kapanınca odak ⋯ düğmesine döner | ✅ otomatik (odak) · ⚠️ okuma |
| D5 | Simülatör portföy: bir hisseyi seç, detay, işlem penceresi | Fiyat, adet, kâr/zarar okunur; piyasa **durmuş** olduğu söylenir ya da anlaşılır | ⚠️ |
| D6 | Bekleme ekranı (A grubu): 10 sn boyunca | Geri sayım duyurulur (ya da en azından "bekle" denir); ekran okuyucu kullanıcısı bunun bir bekleme olduğunu anlar; süre dolunca düğme duyurulur | ⚠️ **Bu, müdahalenin kendisi; ekran okuyucuyla farklı çalışırsa grup farkı bozulur.** Koddan gördüğüm (denemedim): geri sayım sayısı sessizce güncelleniyor (`aria-live` yok, `kaynak/07_app.js` `setTxt('cdn',…)`) ve süre bitince "devam" düğmesi sessizce açılıyor; okuyucu kullanıcısı bitişi duymayabilir. Gerçek cihazda doğrula; sorun çıkarsa düzeltme uygulama değişikliğidir (sürüm, test, etik materyal) |
| D7 | Terim açıklaması (noktalı alt çizgili kelime) | Düğme olarak okunur, açıklama penceresi başlıkla gelir | ⚠️ |
| D8 | Bilgilendirme ekranı ve çekilme düğmesi | Okunur ve ulaşılabilir | ⚠️ |

**Ekran okuyucu kullanan birini katılımcı olarak almayı planlamıyorsan bile** bu senaryoyu bir kez yürütmen, kullanıcı gerçekten ihtiyaç duyduğunda ve etik kurul sorduğunda dürüst bir cevap verir. Hata bulursan etik başvurudaki "erişilebilirlik" cümlesini buna göre yaz (otomatik tarama + manuel deneme sonucu; "tam erişilebilir" deme).

## Sonuçları kaydet

Her cihaz için: model, işletim sistemi sürümü, tarayıcı, Sistem testi çıktısı, işaretlenen satırlar, gözlenen sorunlar. Pilot raporuna (`PILOT_PLANI.md`) ek olarak sakla. Bir satır ✗ ise pilota başlama.
