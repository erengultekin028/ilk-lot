# İlk Lot: mimari (b27)

Bu belge, kodu savunmak ya da değiştirmek isteyen biri için. Uygulama **iki bağımsız web sayfasıdır** ve hiçbir paketleyici ya da framework yoktur: tarayıcının yerel ES modülleri (`import`/`export`) kullanılır. Yayın: Firebase Hosting (`public/`). Eski ad → yeni ad karşılığı: `docs/ESKI_YENI_ADLAR.md`.

## Sayfalar

| Adres | Dosya | Giriş noktası | Kim kullanır |
|---|---|---|---|
| `/` | `public/index.html` | `public/src/main.js` | Katılımcılar (anonim giriş) |
| `/admin/` | `public/admin/index.html` | `public/src/admin/admin-main.js` | Araştırmacı (e-posta/şifre) |

Katılımcı uygulaması `src/admin/` altındaki hiçbir dosyayı içe aktarmaz (`testler/arac_testleri.py` bunu denetler). Yönetim sayfası katılımcı kodunun ortak parçalarını (sabitler, modeller, widget'lar, Firebase katmanı) kullanır. Adresi gizlemek güvenlik sağlamaz: yetki Firestore kurallarındadır.

## Klasörler (MVVM)

```
public/src/
  constants/     Sabitler: app-config.js (CONFIG, sürüm), soru/haber/sözlük içerikleri, serbest mod verisi, arayüz sabitleri
  models/        Saf iş mantığı (DOM yok): uyaran üretimi, piyasa simülatörü motoru, serbest mod takvimi, anlama sorusu seçimi
  viewmodels/    Durum ve eylemler: app-state.js (tek durum nesnesi `state`), actions/ (tıklama eylemleri, gruplara ayrılmış),
                 study-flow, market-controller, tour-controller, session-lifecycle (açılış/katılım/bitiş), event-bindings
  views/         Ekranlar: HTML dizesi üreten görünüm işlevleri (consent, stage router, trial, simulator, end, free-play ...)
  widgets/       Yeniden kullanılan arayüz parçaları: modal, toast, section, grafikler, film, QR, eşzamanlama göstergesi
  services/      Firebase bağlantısı, kimlik doğrulama, olay kaydı, hata yakalama, oturum anlık görüntüsü
  repositories/  Veri erişimi: participant-repository (kayıt/olay/çekilme), enrollment-repository (yuva alma, grup)
  utils/         Biçimlendirme, tohumlu rastgelelik, DOM, dosya indirme
  admin/         Yönetim uygulaması: admin-main/shell/state/view/actions/dashboard/exports/repository, allocation-builder
  vendor/        QR kütüphanesi (Kazuhiko Arase, MIT; yeniden yazılmadı)
public/styles/   tokens, base, components, free-play, sheet-and-screens, effects, film-and-tour, simulator, consent,
                 motion-and-responsive, desktop (≥768 px), admin
```

**Katman kuralları:** `models` DOM'a dokunmaz. `repositories` ve `services` Firebase'e yalnızca `firebase-service.js` üzerinden erişir. `views` HTML dizesi döndürür; durumu `viewmodels/actions` değiştirir; `render()` (views/app-shell.js) ekranı yeniden çizer. Sabitler yalnızca `constants/` içinde tanımlanır. Dosya, klasör, işlev, değişken, CSS sınıfı ve DOM kimliği İngilizce ve standart adlıdır; **yorumlar ve arayüz metinleri Türkçedir**.

## Katılım akışı (kod yok)

1. Sayfa açılır → `connectFirebase()` → `signInAnonymouslyIfNeeded()` (aynı tarayıcı aynı anonim kullanıcıya döner).
2. `users/{uid}` varsa katılımcı daha önce yuva almıştır → "Tekrar hoş geldin" ya da onam; yoksa onam ekranı.
3. Onam kabul edilince `enrollmentRepository.enroll(uid)`: tek Firestore işleminde sıradaki boş yuva alınır (`meta/counter` + `claims/{kod}` + `users/{uid}`).
4. `startParticipation(kod)`: grup ve set sırası `allocations/{kod}` kaydından okunur (yalnızca kodun sahibi okuyabilir), oturum başlar ya da kaldığı yerden sürer.

**ARAŞTIRMA:** Gruplar araştırmacının önceden ürettiği 4'lük bloklu listeden (`admin/allocation-builder.js`) sırayla dağıtılır; katılımcı grubunu seçemez ve sonraki yuvaların grubunu göremez.

## Veri sözleşmesi (DEĞİŞMEZ)

Firestore alan adları, olay adları (`session_start`, `cooldown_shown` …), CSV sütunları, `CONFIG` anahtarları ve kayıtlı anlık görüntü anahtarları (`ti`, `dec`, `sim` …) yeniden adlandırılmadı (`docs/VERI_SOZLUGU.md`). Kayıtlı anahtar ↔ durum alanı eşlemesi `services/session-persistence.js` içindeki `PERSISTED_STATE_KEYS`'tedir. Çekilme politikası A (soft delete): hiçbir yerde silme yoktur; kayıt `withdrawn: true` ile işaretlenir.

## Firestore koleksiyonları

`meta/counter`, `slots/{no}`, `claims/{kod}`, `users/{uid}`, `allocations/{kod}`, `participants/{kod}` (+ `events/*`), `selftest/yazma`. Kurallar: `firebase/firestore.rules` (her kural Türkçe açıklamalı), testler: `firebase/kural_testleri/`.

## Tasarım ve geniş ekran

Telefon görünümü (`< 768 px`) değişmedi. `styles/desktop.css` yalnızca `min-width` sorguları içerir: 768 px üstünde uygulama pencerenin tamamını (genişlik ve yükseklik) kaplar; metin ağırlıklı ekranlar (onam, form, test) okunur genişlikte ortalanır, ≥1000 px'te karar ekranı, ≥1100 px'te simülatör iki sütun kullanır. Yönetim paneli geniş ekran için `styles/admin.css` ile ayrıca düzenlenmiştir. Kabuk, ekran adını `#app[data-stage]` ve `#main-view[data-tab]` özniteliklerine yazar (geniş ekran seçicileri için).

## Sürümleme ve değişiklik kuralları
- `APP_VERSION` (`constants/app-config.js`) her olaya ve kayda yazılır. **Pilot ya da veri toplama başladıktan sonra** davranış değişirse artır; ölçüt ayarlarını (`seed`, `simSeed`, `simCrises`, `cooldownSec`, `lossThreshold`) değiştirme. `python firebase/dagit.py --kilitle` bunu makineye yaptırır.
- Değişiklikten sonra: `npm run lint`, `npm run check:modules`, `npm run check:classes`, `python testler/arac_testleri.py`, `python analiz/test_betikler.py`, kural testleri.
- `node tools/check-equivalence.mjs <eski ilk-lot.html>` uyaran parmak izi ve fiyat yolu özetinin (`3171573551 18600`) değişmediğini gösterir.

## Bilinen sınırlar
- Tarayıcı tabanlı uygulama testleri yeni yapı için yeniden yazılmadı (`testler/README.md`).
- Anonim kullanıcı, tarayıcı verisi silinirse ya da başka tarayıcı/"Ana ekrana ekle" kısayolu kullanılırsa kaybolur; aynı kişi yeni yuva alıp tekrar katılabilir (pilotta izle).
- Yeni katılım/yuva akışı ve yeni güvenlik kuralları gerçek Firebase'de ve emulator'de DENENMEDİ (b27 yazılırken test koşulmadı); önce `firebase/kural_testleri` çalıştırılmalı.
- Birincil model rastgele kesişimli karma model değildir (kümeye dayanıklı lojistik); bkz. `analiz/README.md`.
