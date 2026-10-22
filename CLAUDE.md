# İlk Lot – Claude Code için notlar

Önce `DEVIR_NOTU.md`, sonra `README.md` ve `docs/MIMARI.md` oku. Kullanıcıyla Türkçe konuş; kısa, doğrudan, sonuç önce.

## Kurallar
- `ilk-lot.html` ELLE DÜZENLENMEZ. Kaynak `kaynak/` klasöründe; değişiklikten sonra `python kaynak/derle.py`.
- Değişiklik sonrası testler:
  - `python testler/uygulama_testleri.py` (Playwright + Chromium; `CHROMIUM=<yol>` isteğe bağlı; ~4 dk; aynı anda iki tarayıcı testi koşma)
  - `python analiz/test_betikler.py`, `python testler/arac_testleri.py`
  - Yeni test eklersen koda bilerek hata sokarak (mutasyon) yakaladığını doğrula.
- Çalışma simülatörünün fiyat yolu özeti sabittir (`SIM_HASH_B18 = '3171573551 18600'`); değişmemeli.
- Sürüm: `kaynak/02_core.js` içinde `APP_VERSION` (şu an `2026.10.20-b25`). Her yayında artır, `DEVIR_NOTU.md`'ye kayıt yaz.
- Pilot başladıktan sonra çalışma ayarlarını (`CFG`) değiştirme.

## Kullanıcıya ait kararlar (sen karar verme, sor)
Örneklem, TOST sınırı, ana model, ön kayıt, panik satış tanımı, `[DOLDUR]` alanları (onam), Firestore konumu/KVKK, barındırma, etik kapsamı, yeni ölçüm eklemek (ör. `stress_sell`), çalışma simülatörüne haber vurgusu.

## Firebase (yarım)
Proje `ilk-lot-pilot` açıldı; Firestore üretim modunda, Authentication'da araştırmacı kullanıcısı eklendi. Kalan: Anonim girişin açık olduğunu doğrula, web uygulaması config'ini `CFG.firebase`'e yaz (`kaynak/02_core.js`), `firebase/firestore.rules` içindeki örnek e-postayı değiştirip kuralları konsola yapıştır, `python firebase/dagit.py` ön kontrol. Rehber: `firebase/KURULUM.md`. Gerçek Firebase'e karşı hiçbir şey henüz denenmedi.

"TÜBİTAK destekli" yazma: proje başvuru aşamasında.
