# İlk Lot – Firebase kurulumu (gerçek pilot için)

claude.ai'deki sürüm verileri sadece tarayıcıda tutar (demo). Gerçek pilotta veriler Firebase'e gitmeli.

## 1. Firebase projesi
1. console.firebase.google.com → yeni proje.
2. **Firestore Database** → oluştur → konum olarak `europe-west` seç.
3. **Authentication** → Sign-in method:
   - **Anonymous**: aç (katılımcılar için; kimlik bilgisi toplanmaz).
   - **Email/Password**: aç (araştırmacı için).
4. Authentication → Users → araştırmacı hesabını ekle.

## 2. Güvenlik kuralları
- `firestore.rules` dosyasını aç, `arastirmaci@ornek.edu.tr` yerine kendi e-postanı yaz.
- Firestore → Rules sekmesine yapıştır → Publish.

## 3. Uygulamayı bağla
- Firebase → Project settings → Web app ekle → çıkan config nesnesini kopyala.
- `ilk-lot.html` içinde `CFG` bölümünü bul, `firebase:null` yerine yapıştır:
  `firebase:{apiKey:"...",authDomain:"...",projectId:"...",appId:"..."}`

## 3b. Çalışma ayarları (`CFG`)
- `contact`: bilgilendirme ekranında görünen iletişim adresi. Mutlaka değiştir.
- `cooldownSec`, `lossThreshold`: bekleme süresi ve tetiklenme eşiği.
- `simTicks`, `simTickMs`, `simCrises`, `simSeed`: simülatör süresi ve krizi. `simSeed` nötr piyasa için seçildi; değiştirirsen nötrlüğü yeniden kontrol et.
- Pilot başladıktan sonra bu ayarların hiçbirini değiştirme.

## 3c. Onam metni (ZORUNLU)
- `CFG.consentInfo` içindeki `controller`, `ethics`, `retention`, `hosting` alanlarını ve `CFG.contact` adresini doldur. `funding` boşsa onamda TÜBİTAK/destek cümlesi geçmez; destek kesinleşince yaz.
- Doldurulmamış alanlar onam ekranında **sarı işaretli** görünür; araştırmacı panelindeki "Onam metni" bölümü hangilerinin boş olduğunu listeler.
- Panelden "Onam metnini indir" ile metni alıp **etik kurul başvurusuna ekle**. Kurulun istediği ifadeler farklıysa metni `consentSections()` içinde düzenle ve `CONSENT_VER` değerini artır (hangi katılımcının hangi sürümü kabul ettiği kaydedilir).
- Metinde "uygulamayı barındıran hizmetin teknik kayıtlarında IP adresi tutulabilir" cümlesi var. Kendi barındırma ayarlarını kontrol edip doğruluğundan emin ol.

## 3d. Hızlı test modu (sadece geliştirme)
- Simülatörü 7,5 dakika beklemeden denemek için: adresin sonuna `?hizli=1` ekle ya da araştırmacı panelinden "Hızlı test modunu aç" de. Piyasa 10 kat hızlı akar (yaklaşık 45 sn), bekleme 3 sn olur; fiyatlar, krizler ve haberler aynı günlerde gelir.
- Açıkken ekranda "HIZLI TEST MODU" şeridi görünür; panelden açılan mod 30 dk sonra kendiliğinden kapanır; CSV'de `test_mode` = 1 olur.
- **Tanıtım modu:** adrese `?demo=1` ekle. Simülatör serbestçe oynanır, hiçbir veri kaydedilmez, bekleme ekranı çıkmaz; Firebase tanımlı olsa da bağlanmaz. Adres değiştirilemiyorsa panelde "Tanıtım modunu aç". Okulda/sunumda göstermek için. Katılımcı kartlarına ve gerçek linklere koyma.
- **Pilot geri bildirim formu:** pilot için `kaynak/02_core.js` içinde `pilot:true` yap, derle, `python firebase/dagit.py --pilot` çalıştır. Ana veri toplamadan önce `pilot:false` yap, `APP_VERSION` artır; `dagit.py` formun açık kaldığı yayını HATA ile durdurur.
- **Gerçek pilotta çalışmaz:** `CFG.firebase` doluyken `?hizli=1` yok sayılır ve panel düğmesi gizlenir. Katılımcıya hızlı test bağlantısı ulaşsa bile pilot verisi bozulmaz.

## 3f. Sistem testi ve pilot
- Panel → **Sistem testini çalıştır**: depolama, Firebase bağlantısı ve yetki, olay kuyruğu, cihaz bilgisi. Pilottan önce her test cihazında çalıştır; sonucu kopyalayıp sakla. Protokol: `docs/GERCEK_CIHAZ_TESTI.md`. Pilot planı: `docs/PILOT_PLANI.md`.
- Onam ve bilgilendirme metnindeki **destek bilgisi** (`CFG.consentInfo.support`) de doldurulmalı (üniversite psikolojik danışma birimi vb.); boşsa katılımcıya sarı işaretli yer tutucu görünür.

## 3e. Analiz araçları
- Veri toplamadan önce `analiz/ilklot_guc.py` ile örneklem hedefini belirle; veri bitince `analiz/ilklot_analiz.py` ile raporu üret. Adımlar ve komutlar: `analiz/README.md`. Ön kayıt taslağı: `docs/ON_KAYIT_TASLAGI.md`.

## 4. Yayınla
- Kaynak `kaynak/` klasöründedir; değişiklik yaptıysan `python kaynak/derle.py` ile `ilk-lot.html`'i yeniden üret ve `python testler/uygulama_testleri.py` çalıştır. Mimari: `docs/MIMARI.md`.
- **Ön kontrol:** `python firebase/dagit.py`. Boş `[DOLDUR]` alanı, `CFG.firebase: null`, `firestore.rules` içindeki örnek e-posta ve eski derleme gibi yayın engellerini listeler; HATA varsa yayınlama.
- Firebase Hosting ile: `python firebase/dagit.py --hazirla` (`firebase/yayin/` üretir; önbellek kapalı başlık dahil), sonra `--yayinla --proje PROJE_KIMLIGI` (firebase-tools kurulu ve `firebase login` yapılmış olmalı; `--kuru` yalnızca komutu yazar). **Bu yol gerçek Firebase'e karşı hiç denenmedi**: ilk yayında çıktıyı izle, ardından `docs/GERCEK_CIHAZ_TESTI.md` C bölümünü yürüt. GitHub Pages da olur; o zaman `ilk-lot.html`'i `index.html` olarak yayınla ve kuralları konsoldan yapıştır.
- **Pilot başlarken** `python firebase/dagit.py --kilitle`: sürüm ve ölçüt ayarları `firebase/yayin_kaydi.json`'a yazılır; sonra biri değişirse ön kontrol HATA verir.
- **Saklama hatırlatmaları:** `python etik/saklama_takvimi.py --toplama-baslangic GGGG-AA-GG --toplama-bitis GGGG-AA-GG --saklama-ay N` (süreyi etik kurul ve KVKK birimiyle belirle, onam metnindeki saklama süresiyle aynı olmalı; araç süre önermez). Çıkan `.ics` dosyasını takvimine aktar.
- claude.ai içinde Firebase ÇALIŞMAZ (sayfa dış sunuculara bağlanamaz). Kendi adresinde yayınlamalısın.

## 5. Pilotu yürüt
- Sayfayı `#admin` ile aç (ya da logoya 5 kez dokun) → araştırmacı girişi.
- "Yeni liste" ile kodları oluştur (4'erli bloklar).
- "Kartlardaki link adresi" alanına kendi yayın adresini yaz.
- "QR kartlarını indir" → HTML dosyasını aç → yazdır → kes → katılımcılara tek tek dağıt.
- "Gizli liste" CSV'sini sakla: kod–grup eşleşmesi sadece burada var. Katılımcıyla paylaşma.
- Tek oturum (yaklaşık 30 dk): 6 karar → 7,5 dk simülatör → 6 karar. Yarıda bırakan katılımcı aynı linkle kaldığı yerden devam eder (simülatör dahil).
- Veri toplama bitince: "Katılımcı özeti" ve "Tüm olaylar" CSV'lerini indir (sütunlar: docs/VERI_SOZLUGU.md).

## Kontrol listesi
- [ ] Bir karttaki QR'ı telefonla okut → onam → doğrudan başlıyor mu? Adres çubuğunda kod kayboluyor mu?
- [ ] Aynı cihazda tekrar aç → "Tekrar hoş geldin" ekranı geliyor mu?
- [ ] İki farklı cihazda araştırmacı panelindeki **uyaran parmak izi** aynı mı?
- [ ] Onam ekranı: onay kutusu işaretlenmeden "Katılmayı kabul ediyorum" pasif mi? Onam metni iniyor mu? Sarı yer tutucu kalmadı mı?
- [ ] Bir A koduyla simülatörde, kriz sonrası bir hisseyi sat → 10 sn bekleme çıkıyor mu? 1. ve 3. bölümde çıkmıyor mu?
- [ ] Bir B kodu ile aynısını dene → bekleme çıkmıyor mu?
- [ ] Sayfayı yenile, aynı kodla gir → kaldığın yerden devam ediyor mu?
- [ ] CSV'leri indir, satırlar dolu mu?
- [ ] Bir test koduyla "Çalışmadan çekil" de → panelde "Çekilen" sayısı arttı mı, CSV'den düştü mü? "Kalıcı sil" çalışıyor mu?

## Dikkat
- Firestore ücretsiz planının günlük yazma kotası sınırlı. Tüm katılımcıları aynı güne koyarsan kotayı aşabilirsin. Güncel limitleri kontrol et; gerekirse oturumları günlere yay ya da Blaze planına geç (bu ölçekte maliyet çok düşük).
