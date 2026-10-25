# İlk Lot: proje klasörü

**Önce `DEVIR_NOTU.md`'yi oku** (proje durumu, kararlar, kurallar, doğrulanmayanlar). Mimari: `docs/MIMARI.md`.

| Klasör / dosya | İçerik |
|---|---|
| `public/` | **Yayınlanan site** (Firebase Hosting). `index.html` katılımcı uygulaması, `admin/index.html` araştırmacı paneli (ayrı adres), `src/` kod, `styles/` CSS, `assets/` yazı tipi ve simge |
| `public/src/` | MVVM katmanları: `constants/`, `models/`, `viewmodels/`, `views/`, `widgets/`, `services/`, `repositories/`, `utils/`, `admin/`, `vendor/` (ayrıntı `docs/MIMARI.md`) |
| `firebase/` | `firestore.rules` (güvenlik kuralları), `firebase.json` (Hosting + kurallar), `dagit.py` (yayın ön kontrolü, ölçüt kilidi, yayınlama), `kural_testleri/` (Emulator testleri), `KURULUM.md` |
| `tools/` | Geliştirme araçları: `check-modules.mjs` (modül bağlantıları), `check-classes.mjs` (CSS sınıf tutarlılığı), `check-equivalence.mjs` (eski/yeni uyaran ve fiyat yolu karşılaştırması) |
| `testler/` | Python testleri: `arac_testleri.py` (yayın aracı, takvim, CI, klasör yapısı). `uygulama_testleri.py`, `erisilebilirlik_taramasi.py`, `gorsel_karsilastirma.py` **eski yapı için yazıldı, yeniden yazılmalı** (`testler/README.md`) |
| `analiz/` | Analiz, güç hesabı, pilot özeti, örnek veri üretici, kendi testleri |
| `etik/` | Etik kurul başvuru taslağı; onam ve bilgilendirme metinleri; `ONAM_DEGISIKLIK_ONERISI_A.md` (onaylanmamış öneri); `saklama_takvimi.py` |
| `docs/` | Ön kayıt, TÜBİTAK yöntem bölümü, pilot planı, veri sözlüğü, mimari, **`ESKI_YENI_ADLAR.md`** (yeniden adlandırma tablosu) vb. |
| `rapor/` | Çalışma raporları (başlangıç testleri, planlar, yazma ölçümü) |
| `tanitim.html` | Katılımcı tanıtım sayfası (ayrı, bağımsız dosya) |
| `package.json`, `eslint.config.mjs`, `.prettierrc.json` | Geliştirme araçları (ESLint, Prettier) |
| `arsiv/` | Projenin ilk tasarımı (güncel değil) |

## Çalıştırma (bilgisayarında)

```bash
npm install            # ilk seferde (geliştirme araçları)
npm run serve          # public/ klasörünü http://localhost:8088 adresinde sunar
```

Katılımcı uygulaması `http://localhost:8088/`, araştırmacı paneli `http://localhost:8088/admin/`. Dosyaya çift tıklayarak açılmaz (ES modülleri bir web sunucusu ister). Firebase ayarları `public/src/constants/app-config.js` içindedir; uygulama gerçek Firebase'e bağlanır (yerel/örnek veri kipi yoktur).

## Denetimler

```bash
npm run lint           # ESLint: tanımsız ad, sabit atama, içe aktarma atamaları
npm run check:modules  # tüm modüller içe aktarılabiliyor mu (sahte tarayıcı ortamıyla)
npm run check:classes  # JS'te kullanılan CSS sınıfları CSS'te tanımlı mı
python testler/arac_testleri.py
python analiz/test_betikler.py
cd firebase/kural_testleri && npm install && npm test    # güvenlik kuralları (Node + Java gerekir)
```

**Başlangıç sırası:** `firebase/KURULUM.md` → sarı `[DOLDUR]` alanları (`CONFIG.consentInfo`) → `python firebase/dagit.py` (ön kontrol) → yayın (`firebase deploy` ya da `dagit.py --yayinla`) → `docs/GERCEK_CIHAZ_TESTI.md` ve `docs/PILOT_PLANI.md` → örneklem kararı → ön kayıt (`docs/ON_KAYIT_TASLAGI.md`) → etik başvuru (`etik/`) → veri toplama → `analiz/README.md`.

**Simülatör:** 300 gün (7,5 dk), tohum gerekçesi `docs/SIMULATOR_TOHUMU.md`. 150 günlük alternatif plan `docs/BEKLEYEN_150_GUN.md` içinde, uygulanmadı.
