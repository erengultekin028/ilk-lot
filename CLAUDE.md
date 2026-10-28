# İlk Lot – Claude Code için notlar

Önce `DEVIR_NOTU.md`, sonra `README.md` ve `docs/MIMARI.md` oku. Kullanıcıyla Türkçe konuş; kısa, doğrudan, sonuç önce.

## Kurallar
- Kaynak doğrudan `public/` içindedir (derleme yok): katılımcı uygulaması `public/index.html` + `public/src/`, yönetim paneli `public/admin/`. Adlar İngilizce ve standart, **yorumlar ve arayüz metinleri Türkçe**. Eski → yeni ad tablosu: `docs/ESKI_YENI_ADLAR.md`.
- Mimari MVVM'dir (`models` DOM'a dokunmaz; Firebase'e yalnızca `services/firebase-service.js` ve `repositories/`). Katılımcı kodu `src/admin/` içe aktarmaz.
- Kayıt veri sözleşmesi DEĞİŞMEZ: Firestore alanları, olay adları, CSV sütunları, `CONFIG` anahtarları, kayıtlı anlık görüntü anahtarları (`docs/VERI_SOZLUGU.md`).
- Değişiklik sonrası: `npm run lint`, `npm run check:modules`, `npm run check:classes`, `npm run check:records`, `python testler/arac_testleri.py`, `python analiz/test_betikler.py`; kurallar değiştiyse `firebase/kural_testleri` (`npm test`). Davranışa dokunduysan `node tools/check-equivalence.mjs <eski ilk-lot.html>` (git geçmişinden alınır) ile uyaran/fiyat yolu özetinin değişmediğini göster.
- Tarayıcı testleri: `python testler/ekran_testleri.py` (yeni yapı, Firebase kesik, gerçek veri yazılmaz; CI'da da çalışır). Eski `uygulama_testleri.py`, `erisilebilirlik_taramasi.py`, `gorsel_karsilastirma.py` eski tek dosya yapısı içindi ve çalışmaz (`testler/README.md`). Yeni ekran/akış eklersen ona bir test ekle ve mutasyonla doğrula.
- Kararlar `docs/KARAR_PAKETI.md` tablosunda toplanır; orada açık olan bir kararı sen verme.
- Yeni test eklersen koda bilerek hata sokarak (mutasyon) yakaladığını doğrula.
- Çalışma simülatörünün fiyat yolu özeti sabittir (`3171573551 18600`, 300 gün × 6 hisse); değişmemeli.
- Sürüm: `public/src/constants/app-config.js` içinde `APP_VERSION` (şu an `2026.10.28-b39`). Her yayında artır, `DEVIR_NOTU.md`'ye kayıt yaz.
- Pilot başladıktan sonra çalışma ayarlarını (`CONFIG`) değiştirme (`python firebase/dagit.py --kilitle`).
- Kullanıcı testleri kendisi koşar (25.10.2026 kararı): koşmadığın testi "geçti" diye yazma; ne denendi, ne denenmedi açıkça belirt.

## Kullanıcıya ait kararlar (sen karar verme, sor)
Örneklem, TOST sınırı, ana model, ön kayıt, panik satış tanımı, `[DOLDUR]` alanları (onam), onam metni ve `CONSENT_VERSION`, Firestore konumu/KVKK (nam5 = ABD), barındırma, etik kapsamı, yeni ölçüm eklemek (ör. `stress_sell`), çalışma simülatörüne haber vurgusu, silme politikası (şu an A: soft delete).

## Firebase
Proje `ilk-lot-pilot`; web uygulaması config'i `CONFIG.firebase` içinde; kurallar `firebase/firestore.rules` (araştırmacı e-postası yazılı, anonim giriş + yuva modeli). b27'deki yeni katılım akışı ve kurallar gerçek Firebase'de ve emulator'de denenmedi. Rehber: `firebase/KURULUM.md`.

"TÜBİTAK destekli" yazma: proje başvuru aşamasında.
