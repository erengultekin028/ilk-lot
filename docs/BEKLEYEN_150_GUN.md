# Bekleyen değişiklik: simülatör 400 günden 150 güne

**Durum:** Uygulanmadı. Not (b8): kullanıcı bunun yerine **300 gün** istedi ve o uygulandı (bkz. `docs/SIMULATOR_TOHUMU.md`). Bu dosyadaki 150 günlük plan ayrıdır; kaynak şu an 300 gün. Aşağıdaki kriz günleri ve tohum bilgisi 150 günlük takvim içindir; uygulanırsa tohum yeniden aranmalıdır.

## Karar verilen ve hazırlanan
- `simTicks: 150` (süre ≈ 3,75 dakika; tick süresi 1,5 sn aynı kalır).
- Krizler orantılı olarak içeri alınır: **28. gün** TUPRS + KOZAL (−%18), **70. gün** ASELS (−%20), **112. gün** THYAO + PGSUS (−%16); her biri 7 gün.
- Haber takvimi (gün: haber): 0 sakin başlangıç · 12 perakende (BIMAS) · 22 enerji uyarısı · 28 enerji ve madencilik krizi · 46 yatay gün · 64 savunma uyarısı · 70 savunma krizi · 90 havayolları rotaları · 106 jet yakıtı uyarısı · 112 havacılık krizi · 135 sakin gün.
- **Tohum:** `simSeed: 'ilklot-sim3-v117'`. 400 aday arasından 84'ü ölçütleri geçti; v117 kriz dibinden sona ortalama −%0,02, 20 gün sonra +%0,04, 5 olaydan 2 (sona) ve 3 (20 gün sonra) yükselen, BIMAS +%3,0, kriz öncesi en büyük sapma %3,8. Eski tohum (v80) yeni takvimde **kullanılmamalı**, tarafsızlığı doğrulanmadı.

## Uygulanırken güncellenecekler
- Metinler: "yaklaşık 30 dakika" (onam özeti, onam metni, indirilen metin, tanıtım ekranı, tanıtım sayfası, ön kayıt) → ≈ 25 dakika; "10 dakikalık simülatör" (ön kayıt, veri sözlüğü, README) → ≈ 4 dakika; hızlı mod açıklaması (panel metni, KURULUM): "10 dk yerine yaklaşık 1 dk" → "≈ 4 dk yerine ≈ 25 sn".
- İlerleme çubuğu ağırlıkları (`GP_W`, simülatör payı küçülür).
- Testler: `fiyat_gosterimi` 399. güne kadar gidiyor (150 altına çekilmeli); kriz günlerine bağlı sabitler (`simulatore_gec` 80/90) yeni krizlere göre doğrulanmalı.
- Pilot aracı eşikleri (`ilklot_pilot.py`, `PILOT_PLANI.md`): beklenen toplam süre ≈ 25 dk olduğundan 35/40 dk eşikleri 30/35'e çekilmeli.
- Örnek veri üreticisi: simülatör süresi ve oturum süresi.
- Panelde "Akış" satırı ve poster/kartlar yeniden üretilmeli.
- **Etik ve başvuru belgeleri:** `etik/materyalleri_uret.py` yeniden çalıştırılmalı (onam ve bilgilendirme metni, ekran görüntüleri); `etik/ETIK_KURUL_BASVURU_TASLAGI.md` ve `docs/TUBITAK_YONTEM_BOLUMU.md` içindeki süreler (≈ 30 dk, 10 dakikalık simülatör) güncellenmeli.

## Risk
Karar süresi kısalıyor ve kriz sayısı aynı kalıyor: bekleme ekranını gören A oranı düşebilir (güç hesabı %70 varsayıyor). Pilot önce ölçmeli.
