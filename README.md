# İlk Lot: proje klasörü

**Önce `DEVIR_NOTU.md`'yi oku** (proje durumu, kararlar, kurallar, doğrulanmayanlar).

| Klasör / dosya | İçerik |
|---|---|
| `ilk-lot.html` | Yayına hazır uygulama (tek dosya). **Doğrudan düzenleme**, `kaynak/`'tan derle |
| `kaynak/` | Uygulama kaynağı parçalar halinde ve `derle.py`. Değişiklikten sonra: `python kaynak/derle.py` |
| `testler/` | Uygulamanın uçtan uca testleri (`uygulama_testleri.py`) |
| `analiz/` | Analiz, güç hesabı, pilot özeti, örnek veri üretici, kendi testleri |
| `etik/` | Etik kurul başvuru taslağı; onam ve bilgilendirme metinleri ve ekran görüntüleri (uygulamadan üretilir); `saklama_takvimi.py` (veri saklama ve silme hatırlatmaları, .ics) |
| `docs/` | Ön kayıt, TÜBİTAK yöntem bölümü, pilot planı, katılımcı toplama planı, veri yönetim planı, iş-zaman ve bütçe taslağı, bir sayfalık özet, sunum iskeleti, genişleme seçenekleri, gerçek cihaz protokolü, analiz kodu için bağımsız inceleme rehberi, mimari, veri sözlüğü |
| `firebase/` | Kurulum rehberi, güvenlik kuralları ve `dagit.py` (yayın ön kontrolü, hazırlama, ölçüt kilidi, yayınlama) |
| `ekran_goruntuleri/` | Simülatör ekran görüntüleri |
| `tanitim.html` | Katılımcı tanıtım sayfası |
| `.github/workflows/test.yml` | CI tanımı (proje bir git deposunun kökü olursa çalışır; hiç çalıştırılmadı) |
| `arsiv/` | Projenin ilk tasarımı (güncel değil) |

**Başlangıç sırası:** `firebase/KURULUM.md` → sarı `[DOLDUR]` alanları (`CFG.consentInfo`) → `python firebase/dagit.py` (ön kontrol) → `docs/GERCEK_CIHAZ_TESTI.md` ve `docs/PILOT_PLANI.md` → örneklem kararı → ön kayıt (`docs/ON_KAYIT_TASLAGI.md`) → etik başvuru (`etik/`) → veri toplama → `analiz/README.md`.

**Simülatör:** 300 gün (7,5 dk), tohum gerekçesi `docs/SIMULATOR_TOHUMU.md`. 150 günlük alternatif plan `docs/BEKLEYEN_150_GUN.md` içinde, uygulanmadı.
