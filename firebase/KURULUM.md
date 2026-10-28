# İlk Lot – Firebase kurulumu (gerçek pilot için)

Uygulama yalnızca Firebase ile çalışır: yerel (tarayıcıda) kayıt kipi, tanıtım kipi ve örnek veri yoktur. Firebase'e ulaşılamazsa katılımcı "Bağlantı kurulamadı" ekranını görür.

## 1. Firebase projesi
1. console.firebase.google.com → yeni proje (şu an: `ilk-lot-pilot`, Spark planı yeterli).
2. **Firestore Database** → oluştur. Konum sonradan değiştirilemez; onam metnindeki barındırma satırıyla ve KVKK değerlendirmenle uyumlu seç (şu an `nam5` = ABD; bunu danışmanınla netleştir).
3. **Authentication** → Sign-in method:
   - **Anonymous**: aç (katılımcılar için; kimlik bilgisi toplanmaz, kod girilmez).
   - **Email/Password**: aç (yalnızca araştırmacı için).
4. Authentication → Users → araştırmacı hesabını ekle (e-posta, `firestore.rules` içindekiyle birebir aynı olmalı).
5. Authentication → Settings → Authorized domains: yayın adresini (`<proje>.web.app`) ekle (Hosting kullanırsan kendiliğinden vardır).

## 2. Güvenlik kuralları
- `firebase/firestore.rules` içinde `isAdmin()` e-posta listesi senin adresinle dolu olmalı (`python firebase/dagit.py` kontrol eder).
- Kurallar yeni katılım modelini içerir (`meta/counter`, `slots`, `claims`, `users`, `allocations`, `participants`); hiçbir yerde silme izni yoktur (politika A).
- Önce emulator testlerini çalıştır: `cd firebase/kural_testleri && npm install && npm test` (Node ve Java gerekir). Sonra yayınla: Firebase konsolu → Firestore → Rules'a yapıştır ya da `firebase deploy --only firestore:rules`.

## 3. Uygulamayı bağla
- Web uygulaması config'i `public/src/constants/app-config.js` içinde `CONFIG.firebase` alanındadır (`apiKey`, `authDomain`, `projectId`, `appId`). Web `apiKey` gizli değildir; güvenliği kurallar sağlar.
- Komutla almak için: `firebase apps:sdkconfig WEB <appId> --project <proje>`.

## 3b. Çalışma ayarları (`CONFIG`)
- `contact`: bilgilendirme ekranında görünen iletişim adresi. Mutlaka değiştir.
- `cooldownSec`, `lossThreshold`: bekleme süresi ve tetiklenme eşiği.
- `simTicks`, `simTickMs`, `simCrises`, `simSeed`: simülatör süresi ve krizi. `simSeed` nötr piyasa için seçildi; değiştirirsen nötrlüğü yeniden kontrol et.
- Pilot başladıktan sonra bu ayarların hiçbirini değiştirme (`python firebase/dagit.py --kilitle` kaydeder, sonra değişirse ön kontrol HATA verir).

## 3c. Onam metni (ZORUNLU)
- `CONFIG.consentInfo` içindeki `controller`, `ethics`, `retention`, `hosting`, `support` alanlarını ve `CONFIG.contact` adresini doldur. `funding` boşsa onamda TÜBİTAK/destek cümlesi geçmez; destek kesinleşince yaz.
- Doldurulmamış alanlar onam ekranında **sarı işaretli** görünür; yönetim panelindeki "Onam metni" bölümü hangilerinin boş olduğunu listeler.
- Silme politikası A seçildiği için onam ve çekilme metinleri değişmeli: `etik/ONAM_V2_TASLAGI.md` (danışman ve etik kurul onayı gerekir; `CONSENT_VERSION` artar).

## 4. Yayınla (Firebase Hosting)
- Ön kontrol: `python firebase/dagit.py`. HATA varsa yayınlama.
- Yayın klasörü doğrudan `public/`'dir (derleme yok). Kökteki `firebase.json` Hosting'i (`public`) ve kuralları yayınlar (`.firebaserc` varsayılan projeyi `ilk-lot-pilot` yapar). **Otomatik yayın:** `main` dalına her gönderimde `.github/workflows/yayin.yml` lint ve modül kontrolünden sonra Hosting'i canlıya yayınlar (sır: `FIREBASE_SERVICE_ACCOUNT_ILK_LOT_PILOT`). Güvenlik kuralları otomatik yayınlanmaz, elle:
  `python firebase/dagit.py --yayinla --proje PROJE_KIMLIGI` (firebase-tools kurulu ve `firebase login` yapılmış olmalı; `--kuru` yalnızca komutu yazar). Elle (proje kökünden): `firebase deploy --only hosting,firestore:rules --project PROJE`.
- Adresler: katılımcı `https://<proje>.web.app/`, yönetim `https://<proje>.web.app/admin/`. İstersen yönetim paneli için Firebase'de **ikinci bir Hosting sitesi** açıp yalnızca `admin/` klasörünü ona yayınlayabilirsin (adres tamamen ayrılır; panelde "Katılım bağlantısı" alanına katılımcı sitesinin adresini yaz).
- **Dikkat:** aynı adreste (`/` ve `/admin/`) Firebase oturumu paylaşılır. Panelde oturum açıkken aynı tarayıcıda katılımcı olarak deneme yapma; önce panelden çık.
- **Pilot başlarken** `python firebase/dagit.py --kilitle`: sürüm ve ölçüt ayarları `firebase/yayin_kaydi.json`'a yazılır; sonra biri değişirse ön kontrol HATA verir.
- **Saklama hatırlatmaları:** `python etik/saklama_takvimi.py --toplama-baslangic GGGG-AA-GG --toplama-bitis GGGG-AA-GG --saklama-ay N` (süreyi etik kurul ve KVKK birimiyle belirle; araç süre önermez).

## 5. Pilotu yürüt
1. Yönetim sayfasını aç (`/admin/`), araştırmacı e-postasıyla giriş yap.
2. **"Yeni liste"** ile yuvaları oluştur (4'erli bloklar; her yuva bir katılım kodu ve grup taşır). İlk listede `meta/counter` otomatik oluşur.
3. **"Katılım bağlantısı"**: tek ortak adres (ya da QR) katılımcılara verilir. Katılımcılar kod girmez; onamdan sonra sıradaki yuvayı otomatik alır.
4. **"Gizli liste"** CSV'sini sakla: yuva–kod–grup eşleşmesi yalnızca burada ve Firebase'dedir. Katılımcıyla paylaşma.
   - **Pilottan önce test kayıtlarını ayır:** panelde **Test kayıtları → Kayıtları yükle**; süzgeçlerle (eski sürüm, bekleme ekranı görenler, tamamlanmayan) deneme kayıtlarını seç, **Test kaydı olarak işaretle**. Kayıt silinmez, analizden ve dışa aktarmadan çıkar; işaret geri alınabilir. Test sırasında alınan yuvalar geri verilemez, bu yüzden pilot için yine **Yeni liste** oluştur.
5. Tek oturum (yaklaşık 30 dk): 6 karar → 7,5 dk simülatör → 6 karar. Yarıda bırakan katılımcı aynı tarayıcıdan tekrar açınca kaldığı yerden devam eder.
6. **Yedek:** panelde **Tam yedek (JSON) → Tam yedeği indir**; veri toplama sırasında en az haftada bir, dosyayı şifreli diskte (iki kopya) sakla; dosya grup bilgisini içerir, paylaşma.
7. Veri toplama bitince: "Katılımcı özeti" ve "Tüm olaylar" CSV'lerini indir (sütunlar: `docs/VERI_SOZLUGU.md`).

## Kontrol listesi
- [ ] `/admin/` sayfasında giriş yapılıyor mu? "Sistem testini çalıştır" tüm satırlar ✓ mi?
- [ ] "Yeni liste" (ör. 8 kişi) → konsolda `allocations`, `slots` (8 belge) ve `meta/counter` (`next: 1`) oluştu mu?
- [ ] Katılım bağlantısını telefonda aç → onam → akış başlıyor mu? Konsolda `users`, `claims`, `participants/{kod}` ve altında `events` oluştu mu? `meta/counter.next` 2 oldu mu?
- [ ] Aynı tarayıcıda sayfayı yenile → "Tekrar hoş geldin" (ya da kaldığın yerden devam) geliyor mu? Aynı kişi ikinci yuva almadı mı?
- [ ] Bir A grubunda simülatörde zarardaki bir hisseyi sat → 10 sn bekleme ekranı çıkıyor mu? 1. ve 3. bölümde çıkmıyor mu? B grubunda hiç çıkmıyor mu?
- [ ] CSV'ler iniyor mu, satırlar dolu mu?
- [ ] "Çalışmadan çekil" → panelde "Çekilen" sayısı arttı mı, CSV'den düştü mü? (Politika A: kayıt silinmez, `withdrawn: true` kalır.)
- [ ] Onam ekranı: onay kutusu işaretlenmeden "Katılmayı kabul ediyorum" pasif mi? Sarı yer tutucu kalmadı mı?
- [ ] İki farklı cihazda panelde **uyaran parmak izi** aynı mı?

## Dikkat
- Firestore ücretsiz (Spark) planının günlük yazma kotası 20.000'dir; bir katılımcı yaklaşık 90–230 yazma yapar (`rapor/02_firebase_yazma_olcumu.md`; yeni yuva alma işlemi +3 yazma ve birkaç okuma ekler). Tüm katılımcıları aynı güne koyma.
- Anonim kullanıcı tarayıcı verisi silinirse kaybolur: aynı kişi başka tarayıcıdan ya da "Ana ekrana ekle" kısayolundan girerse yeni yuva alır. Katılımcılara aynı tarayıcıyı kullanmalarını söyle.
