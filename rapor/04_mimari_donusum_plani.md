# İlk Lot: giriş değişikliği ve mimari dönüşüm planı

**Durum: PLAN. Kod değişmedi.** Kararlar (25.10.2026, senden): katılımcı anonim girer (kod yok), e-posta/şifre yalnızca araştırmacıya; grup ataması "sıralı yuva"; kod adları İngilizce ve standart, veri sözleşmesi aynı; MVVM; yerel ES modülleri; yayın Firebase Hosting. **Testleri sen koşacaksın, ben koşmayacağım.**

## 1. Hedef klasör yapısı (hepsi İngilizce, yorumlar Türkçe)

```
index.html                 katılımcı uygulaması (giriş noktası)
admin/index.html           yönetim paneli (sonraki aşamada, ayrı adres)
styles/                    tokens.css, base.css, widgets.css, screens/*.css, responsive.css
src/
  main.js                  uygulamayı başlatır
  constants/               config.js (eski CFG), events.js (olay adları), study.js (sayısal sabitler), strings.tr.js (arayüz metinleri)
  models/                  participant, decision-trial, market-simulation, news, trade, session-event
  services/                firebase.service, auth.service, event-log.service, storage.service
  repositories/            participant.repository, allocation.repository, event.repository
  viewmodels/              auth, consent, study-flow, decision-task, market, free-play, debrief
  views/                   login, consent, demographics, pre-test, decision, market, debrief, free-play ...
  widgets/                 button, modal, toast, progress-bar, stock-card, price-chart, tab-bar, news-banner ...
  utils/                   format, random (tohumlu), dom, time
```
- **MVVM karşılığı:** *Model* = veri şekilleri ve saf hesap (fiyat yolu, uyaran üretimi); *ViewModel* = ekran durumu ve eylemler (bugünkü `S` ve `ACT`); *View* = yalnızca HTML üreten/DOM'u güncelleyen ekran dosyaları; *Widget* = tekrar kullanılan arayüz parçaları. Firebase'e yalnızca `services/` ve `repositories/` dokunur.
- **Adlandırma:** dosya `kebab-case.js`, sınıf `PascalCase`, fonksiyon/değişken `camelCase`, sabit `UPPER_SNAKE_CASE`, CSS sınıfı `kebab-case` (BEM benzeri). `S` → `state`, `ACT` → `actions`, `CFG` → `CONFIG`, `Store` → `participant.repository` gibi.
- **Değişmeyenler:** Firestore alanları, olay adları (`session_start`, `cooldown_shown` …), CSV sütunları, `CONFIG` anahtarları, kurgusal fiyat yolları ve `3171573551 18600` özeti, arayüz metinleri ve görünüm.

## 2. Giriş ve grup ataması (kod kalkıyor)

- **Katılımcı:** onam kabulünden sonra tek tuşla `signInAnonymously`; kod ekranı, kod girişi, kart/QR bağlantısı (`#k=`) kalkar. Aynı tarayıcıya dönen katılımcı aynı anonim kullanıcıyla kaldığı yerden devam eder (bugünkü devam etme mantığı korunur).
- **Araştırmacı:** e-posta/şifre girişi yalnızca yönetim panelinde.
- **Sıralı yuva (Firestore, ek sunucu yok):**
  1. Araştırmacı "yeni liste" üretir: 4'lük bloklarla dengeli, her yuvanın bir kodu ve grubu var (bugünkü `makeAlloc` aynen). Yuvalar `slots/{n}` altında.
  2. Katılımcı ilk girişte `slots/{n}` için `claims/{n}` belgesini **yalnız bir kez** (create-only) oluşturur; kural uid'yi doğrular. Başarılıysa `users/{uid}` ile kendi kodu eşleşir ve `participants/{code}` açılır. `code` sütunu ve belge anahtarı korunur, analiz betikleri bozulmaz.
  3. Grup bilgisi yalnızca yuvayı aldıktan sonra okunabilir (sonraki yuvaların grubuna önceden bakılamaz).
- **Güvenlik kuralları yeniden yazılır** ve emulator test dosyası güncellenir (koşmak sende). Yeni kural alanları: `slots`, `claims`, `users`.
- **Bilmen gerekenler:**
  - Anonim kullanıcı tarayıcı verisi silinince kaybolur; aynı kişi yeni bir yuva alıp tekrar katılabilir. Kart sisteminde de benzer bir risk vardı ama kod kartı fiziksel olarak sınırlıydı. Bunu pilotta izle (çözüm: katılım bağlantısını dağıtımla kontrol etmek).
  - Kartlara basılı kod ve QR sistemi (`exportCards`, `exportPoster`) anlamsızlaşır; panelden "katılım bağlantısı"na (tek ortak URL) dönüşür.
  - Onam metninde "rastgele bir kodla eşleşir" cümlesi hâlâ doğru (sistem kod atıyor), ama "kart" geçen yerler değişebilir. Onam v2 zaten silme politikası için bekliyor; birlikte ele alınır, onayı sende.

## 3. Aşamalar ve süre tahmini

Süreler **benim çalışma süremdir** (testi sen yapacağın için hata düzeltme turları hariç). Kod yoğun ve kısa adlı olduğundan, otomatik yeniden adlandırmayı (kapsam farkında araçla, `acorn` tabanlı) elle düzenlemeye tercih edeceğim.

| # | Aşama | İçerik | Tahmin |
|---|---|---|---|
| 1 | **Giriş + yuva ataması** | Kod ekranı kalkar, anonim giriş, `slots/claims/users` kuralları, panelde yeni liste, kurallar test dosyası | 0,5–1 gün |
| 2 | **Yeniden yapılandırma** | `kaynak/` → `src/` (MVVM, constants, widgets), CSS bölünmesi, İngilizce adlar (rename haritası ile), `derle.py` yerine Hosting için statik yapı, yorumlar Türkçe | 2–3 gün |
| 3 | **Yönetim paneli ayrımı** | `admin/index.html` ayrı adres (ikinci Hosting sitesi), katılımcı build'inde panel kodu yok, sahte/yerel veri kaldırma | 1 gün |
| 4 | **Responsive web** | Yalnızca ≥768/1100 px kuralları; telefon görünümü aynı | 0,5–1 gün |
| 5 | **Test ve belge uyarlaması** | Python testleri ve belgeler rename haritasıyla mekanik güncellenir (koşmam), CLAUDE.md/MIMARI/DEVIR_NOTU, rapor | 0,5 gün |

**Toplam: yaklaşık 4,5–6,5 iş günü** (≈ 35–45 saat aktif çalışma). Senin test ve hata bildirimi turlarıyla birlikte pratikte **1,5–2 hafta** düşün. Her aşama sonunda durup sana "şunları test et" listesi veririm; sen onaylamadan sonrakine geçmem.

## 4. Riskler (dürüst)
- **En büyük risk:** ~270 KB dar sıkıştırılmış kodu test koşmadan taşımak. Hatalar senin testinde çıkar; her aşamada küçük adımlar ve git etiketleri bırakırım ki geri dönülebilsin.
- **Mevcut 44+23+14 test:** global adlara (`S`, `ACT`, `CFG`, `simInit` …) ve DOM `id`/`data-a` değerlerine bağlı. Hepsi yeniden adlandırılacağı için testler harita uygulanmadan koşmaz; haritayı ben uygularım ama doğrulamam.
- **ES modülleri:** dosya çift tıklanarak açılmaz; yerelde `python -m http.server`, yayında Firebase Hosting. İnternetsiz çift tıkla açma özelliği gider.
- **Görsel referanslar (100 görüntü):** İngilizce CSS sınıfları ve bölünen CSS yüzünden yeniden alınmaları gerekir; piksel karşılaştırmasını **yeni yapıyı eskisiyle** karşılaştırarak koşma işi sende.
- **Veri uyumu:** Alan/olay/CSV adları aynı kaldığı için eski ve yeni veri birleştirilebilir; yine de sürüm (`APP_VERSION`) artar.
- **Önceki plan (rapor/03) birleşti:** Yönetim ayrımı ve responsive artık yukarıdaki aşama 3 ve 4.

## 5. Bekleyen eski işler (bu plandan bağımsız, sende)
`[DOLDUR]` alanları, onam v2 + danışman/etik kurul onayı, nam5 (ABD) konum kararı, Firebase gerçek bağlantı testi sonucu, `02_core.js` biçimlendirmesi (yeniden yapılandırmada kendiliğinden çözülür).
