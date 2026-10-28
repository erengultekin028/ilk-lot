# Gerçek cihaz ve Firebase deneme protokolü (b34 sonrası akış)

> Güncelleme: 26 Ekim 2026. Önceki sürüm kartlı, kod girişli ve "başka cihazda devam et" akışını anlatıyordu; bunların hepsi kalktı. Bu protokol **anonim giriş + sıralı yuva** akışına göredir (`docs/MIMARI.md`).

Otomatik testler şunları zaten denetler: `python testler/ekran_testleri.py` (masaüstü Chromium; Firebase **kesik**, gerçek veri yazılmaz), `firebase/kural_testleri` (kurallar, emulator), `npm run check:*`. Aşağıdakileri yalnızca **gerçek telefonlarda ve gerçek Firebase projesinde** görebilirsin. Her satırı işaretle, sonucu yaz; **bir satır ✗ ise pilota başlama.**

**Önkoşul:** Site yayında (`https://ilk-lot-pilot.web.app`; `main` dalına her gönderim otomatik yayınlanır), araştırmacı hesabıyla `/admin/` girişi çalışıyor, `meta/counter` ve yuva listesi var (panel → Randomizasyon listesi → "Listeyi yükle" sayıyı göstermeli). **Deneme kayıtları gerçek kayıttır**; protokol bitince panelden "Test kayıtları" ile ayır.

**Durum sütunu:** ✅ otomatik testle denendi (masaüstü, Firebase kesik) · ⚠️ denenmedi, bu protokolde dene. Sonuç sütununa ✓/✗ ve not yaz.

## A. Her cihazda (telefon başına)

| # | Dene | Beklenen | Durum |
|---|---|---|---|
| A1 | Katılım bağlantısını (panel → Katılım bağlantısı → QR/kopyala) telefonda aç; QR'ı kamerayla okut | Site açılır, "Yükleniyor…" sonra onam ekranı gelir; kod girmen istenmez | ⚠️ |
| A2 | Onam ekranı: yazı boyutu (Normal/Büyük/Çok büyük), açılır ayrıntılar, onay kutusu | Hepsi çalışır; onay kutusu işaretlenmeden "Katılıyorum" ilerlemez; metin taşmaz | ✅ ekranın çizilmesi (masaüstü) · ⚠️ onay kutusu kapısı ve telefon |
| A3 | Onamı kabul et (**yeni yuva tüketir**) | Form/ön test ekranına geçilir; panelde "Alınan yuva" 1 artar; konsolda `users`, `claims`, `participants/{kod}` ve altında `events` oluşur | ⚠️ |
| A4 | Panel → **Sistem testini çalıştır** (ayrı bir cihazda, araştırmacı girişiyle) | Tüm satırlar ✓; "Sonucu kopyala" ile kaydet | ⚠️ gerçek Firebase |
| A5 | Tam akış: form → ön test → tanıtım ve alıştırma (rehberli tur) → 1. bölüm (6 karar) → simülatör (7,5 dk) → 3. bölüm (6 karar) → son test → bilgilendirme | Hiçbir ekran takılmaz; ilerleme çubuğu geri gitmez; bitişte teşekkür ekranı | ✅ ekranlar · ⚠️ uçtan uca gerçek |
| A6 | Rehberli tur (alıştırma ve simülatör başı) | Adımlar sırayla çıkar, ilgili öğe vurgulanır, "Anladım" turu kapatır | ✅ masaüstü · ⚠️ telefon |
| A7 | Simülatörde Portföy / Piyasa / Analiz sekmeleri, hisse ayrıntısı (grafik üzerinde parmakla gezme) | Toplam, nakit, gün canlı güncellenir; Piyasa kartları dolu; gezme doğru günü gösterir | ✅ masaüstü (fare) · ⚠️ dokunmatik |
| A8 | **A grubu:** simülatörde zarardaki hisseyi sat (gerekçe seç) | 10 sn bekleme ekranı gelir, sayı **ilerler**, süre bitince "Satışı onayla" açılır; "Vazgeç" işlem penceresine döndürür. B grubunda bu ekran **çıkmaz**. Grubu panelden (Gizli liste CSV'si, `code` → `grp`) doğrula | ✅ masaüstü · ⚠️ telefon |
| A9 | Lot kutusuna dokun, klavyeyle yaz | Klavye açılınca "Sat/Al" düğmesi ve özet erişilebilir kalır | ⚠️ (masaüstünde taklit edilemez) |
| A10 | Simülatör ortasında sayfayı **yenile** | Aynı kişi ("Tekrar hoş geldin"), aynı fiyat ve portföyle devam; yeni yuva **alınmaz** (panelde "Alınan yuva" artmaz) | ⚠️ |
| A11 | Simülatör ortasında ekranı kilitle, 30 sn sonra dön; başka uygulamaya geç, 1 dk sonra dön | Kaldığı yerden devam; kayıt kaybı yok | ⚠️ |
| A12 | Telefonu yatay çevir | Düzen bozulmaz, hiçbir düğme kesilmez | ⚠️ |
| A13 | Sistem yazı boyutunu en büyüğe al; uygulamada Büyük ve Çok büyük yazı | Metin taşmaz, yatay kaydırma çıkmaz; yenileyince seçim kalır | ✅ masaüstü (axe taraması) · ⚠️ telefon |
| A14 | Koyu/açık tema düğmesi; sistem koyu modu; düşük güç modu; hareketi azalt | Okunur kontrast; animasyonlar bozulmaz. (Bilinen: açık temada kırmızı rozet kontrastı 4,13:1, `docs/ERISILEBILIRLIK.md`) | ✅ axe · ⚠️ telefon |
| A15 | Menü (⋯) → **Çalışmadan çekil** (**yalnızca denemelik bir kayıtla; geri açılamaz**) | İlk onaydan sonra "Emin misin?" gelir; vazgeçersen kayıt değişmez; onaylarsan "Çalışmadan çekildin" ve yenileyince aynı ekran; ekranda **"Yeni katılım başlat"** düğmesi görünür (18 yaş altı kayıtta görünmez) | ✅ masaüstü · ⚠️ gerçek (konsolda `withdrawn: true`) |
| A16 | "Çekildin" ekranında **Yeni katılım başlat** → onayla | Sayfa yenilenir, onam ekranı gelir; onayladığında **yeni yuva** alınır (panelde "Alınan yuva" 1 artar), önceki kayıt çekilmiş kalır; tema/yazı boyutu tercihi korunur | ✅ masaüstü (yenileme, anahtar temizliği) · ✅ gerçek site, araştırmacının kendi denemesi 28.10.2026: "Yeni katılım başlat" deyince baştan başlıyor · ⚠️ yeni yuvanın alındığı (panelde "Alınan yuva" +1) henüz doğrulanmadı |

## B. Özel durumlar

| # | Dene | Beklenen | Durum |
|---|---|---|---|
| B1 | **iPhone özel gezinme** ve **uygulama içi tarayıcı** (WhatsApp/Instagram bağlantısı) ile aç | Anonim giriş tarayıcı deposuna (IndexedDB) bağlıdır; çalışmayabilir ya da oturum yenilemede kaybolabilir ("Bağlantı kurulamadı" ya da yeni yuva). **Sonucu yaz.** Gerçek pilotta katılımcıdan Safari/Chrome'da açmasını iste | ⚠️ |
| B2 | Simülatör sırasında **uçak modunu 30 sn aç, kapat** | Oyun devam eder; üstteki nokta "bağlantı yok/bekliyor" durumuna geçer; bağlantı gelince olaylar gönderilir (Sistem testinde "Olay kuyruğu" önce > 0, sonra 0) | ⚠️ |
| B3 | Yavaş ağ (kötü Wi-Fi ya da ağ hız sınırı) | Karar ekranları takılmaz; yazma gecikmesi katılımcıyı bekletmez | ⚠️ |
| B4 | **Aynı tarayıcıda iki sekme** aç (aynı anonim kimlik, aynı kayıt) | Korunmuyor: iki sekme olay numaralarını çakıştırıp birbirini ezebilir. Katılımcıya tek sekme kullanmasını söyle; ne olduğunu not et | ⚠️ |
| B5 | **Tarayıcı verisini sil**, siteyi yeniden aç | Yeni anonim kimlik ve **yeni yuva** alınır; eski kayıt bu kişiye bağlanamaz (katılımcı uyarısı menüde yazılı) | ⚠️ |
| B6 | **Başka tarayıcıdan** (Chrome yerine Safari) ya da "Ana ekrana ekle" kısayolundan aç | Yeni yuva alınır (aynı kişi iki kez sayılabilir); menü uyarısı görünür | ⚠️ |
| B7 | **Bağlantısız aç** (uçak modunda siteyi aç) | "Bağlantı kurulamadı" ekranı ve "Tekrar dene"; yerel/örnek veri **yok** | ✅ masaüstü (Firebase kesik) · ⚠️ telefon |

## C. Firebase projesi ve araştırmacı paneli

| # | Dene | Beklenen | Durum |
|---|---|---|---|
| C1 | Güvenlik kuralları | Yayınlı kurallar `firebase/firestore.rules` ile aynı; **18 emulator testi geçiyor** (`cd firebase/kural_testleri && npm test`) | ✅ otomatik (emulator, CI'da) |
| C2 | Konsolda bir deneme katılımcısı | `participants/{kod}` (grp, consentAt, demo, pre, `sess_1`…), `events` alt koleksiyonu, `users/{uid}`, `claims/{kod}`; `meta/counter.next` arttı | ⚠️ |
| C3 | Panel → **Randomizasyon listesi** | Toplam yuva, A/B sayısı, "Alınan yuva" ve "Sıradaki yuva" doğru; **Gizli liste CSV**'si iner | ⚠️ |
| C4 | Panel → **Canlı pano** | Onam veren, aktif, tamamlayan, ilerleme; birkaç dakika içinde deneme oturumu "şu an ekranda" listesinde | ⚠️ |
| C5 | Panel → **Test kayıtları**: yükle, süzgeç, seç, işaretle, geri al | İşaretlenen kayıt panoda "Test kaydı (dışarıda)" sayısına girer; CSV'lere girmez; geri alınca döner (`testRecord` alanları konsolda) | ✅ masaüstü (sahte veriyle) · ⚠️ gerçek |
| C6 | Panel → **Tam yedek (JSON)** | `ilklot_tam_yedek_GIZLI_*.json` iner; içindeki sayımlar panodakiyle uyuşur; çekilmiş ve test kayıtları da içindedir | ✅ masaüstü (sahte veriyle) · ⚠️ gerçek |
| C7 | Panelden **Katılımcı özeti** ve **Tüm olaylar** CSV'sini indir → `analiz/ilklot_analiz.py` ile çalıştır | Sütunlar eşleşir, rapor üretilir; test/çekilmiş kayıtlar **yok** | ⚠️ gerçek Firebase çıktısı |
| C8 | Araştırmacı dışı hesapla (ya da çıkış yapıp) `/admin/` aç | Giriş formu gelir; katılımcı hesabı liste okuyamaz (kurallar) | ✅ kurallar · ⚠️ elle |
| C9 | Araştırmacı hesabında iki faktörlü doğrulama | Açık | ⚠️ |

## D. Klavye ve ekran okuyucu (~20 dk, gerçek telefonda ve masaüstünde)

Otomatik axe taraması (`docs/ERISILEBILIRLIK.md`) yalnızca biçimsel sorunları bulur; ekran okuyucunun **ne okuduğunu** ve klavye akışını göremez. iPhone'da VoiceOver ya da Android'de TalkBack ile (ve masaüstünde yalnızca klavye ile) şu akışı yürüt:

| # | Dene | Beklenen | Durum |
|---|---|---|---|
| D1 | Onam ekranı: metni sırayla oku, onay kutusunu işaretle, devam et | Başlıklar başlık olarak okunur; kutu "işaretli/işaretsiz" söyler; düğme adı anlaşılır | ⚠️ |
| D2 | Form ve ön test soruları | Her alanın adı okunur; seçenekler tek tek ve seçili durumuyla okunur | ⚠️ |
| D3 | Karar ekranı: hisse bilgisi, yükseliş/düşüş, Sat/Tut/Daha al | Yükseliş/düşüş yalnız renkle değil sözle de anlaşılır; üç düğme ayırt edilir | ⚠️ |
| D4 | ⋯ menüsünü aç, kapat | Açılınca pencere başlığı okunur, odak pencerede; arka plana geçilemez; kapanınca odak ⋯ düğmesine döner | ⚠️ (odak ve okuma; otomatik test yok) |
| D5 | Simülatör portföy: hisse seç, detay, işlem penceresi | Fiyat, adet, kâr/zarar okunur; işlem penceresi açıkken piyasanın durduğu anlaşılır | ⚠️ |
| D6 | **Bekleme ekranı (A grubu), 10 sn** | Geri sayım duyurulur (ya da en azından "bekle" denir); süre dolunca "Satışı onayla" düğmesinin açıldığı duyulur | ⚠️ **Bu, müdahalenin kendisi.** Koddan gördüğüm (denemedim): sayı sessizce güncelleniyor (`#cooldown-number` üzerinde `aria-live` yok) ve düğme sessizce açılıyor; ekran okuyucu kullanıcısı bunu duymayabilir. Farklı çalışıyorsa grup farkı bozulur; düzeltme bir **uygulama değişikliğidir** (sürüm, test, etik materyal) |
| D7 | Terim açıklaması (noktalı alt çizgili kelime) | Düğme olarak okunur; açıklama penceresi başlıkla gelir | ⚠️ |
| D8 | Bilgilendirme ekranı, çekilme düğmesi (iki aşamalı onay) | Okunur ve ulaşılabilir; ikinci pencerenin başlığı ("Emin misin?") okunur | ⚠️ |
| D9 | Yalnızca klavye (masaüstü): Sekme ile onamdan karar ekranına, menüye ve bekleme penceresine ulaş; Esc ile pencere kapat | Odak görünür, mantıklı sırada; pencerede odak tuzağı vardır | ⚠️ |

**Ekran okuyucu kullanan birini katılımcı olarak almayı planlamıyorsan bile** bu senaryoyu bir kez yürütmen, etik kurul sorduğunda dürüst bir cevap verir. Hata bulursan başvurudaki "erişilebilirlik" cümlesini buna göre yaz (otomatik tarama + manuel deneme sonucu; "tam erişilebilir" deme).

## E. Sonuçları kaydet

Her cihaz için bir satır:

| Cihaz (model) | İşletim sistemi | Tarayıcı | Sistem testi | A | B | D | Sorunlar / notlar |
|---|---|---|---|---|---|---|---|
| | | | | ✓/✗ | ✓/✗ | ✓/✗ | |

Pilot raporuna (`docs/PILOT_PLANI.md`) ek olarak sakla. **Deneme bittiğinde:** panelden önce **Tam yedek** al, sonra deneme kayıtlarını **Test kaydı olarak işaretle** (pilot için yeni yuva listesi oluştur; tüketilen yuvalar geri verilemez).
