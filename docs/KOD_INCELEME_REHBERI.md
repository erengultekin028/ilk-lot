# İlk Lot: analiz kodu için bağımsız inceleme rehberi

Amaç: analiz betiklerini yazandan başka biri (danışman, istatistik bilen bir arkadaş) okuyup yanlış formül, ön kayıtla uyuşmayan kural ve sessiz hata arasın. Tek kişinin yazdığı analiz kodunda hatalar çoğunlukla yazan kişi tarafından görülmez.

## İncelemeciye ver

1. `analiz/` klasörü (özellikle `ilklot_ortak.py`, `ilklot_analiz.py`).
2. `docs/ON_KAYIT_TASLAGI.md` (kod bununla karşılaştırılacak; özellikle 5, 5b, 5c).
3. Bu rehber.

Çalıştırma (SAHTE veriyle, 1 dakika):

```
cd analiz
pip install numpy pandas scipy matplotlib
python test_betikler.py                                   # 23 test geçmeli
python ilklot_ornek_veri.py --n-grup 60 --or 0.5 --seed 3 --cikti sahte
python ilklot_analiz.py sahte_katilimci.csv --olaylar sahte_olaylar.csv --cikti rapor
```

## Sorulacak sorular (öncelik sırasıyla)

1. **Birincil model ön kayıttakiyle aynı mı?** Binom lojit; terimler: grup, bölüm, grup × bölüm, set (SetY); katılımcıya göre kümelenmiş CR1 standart hata; t dağılımı (df = G − 1). `ilklot_ortak.py` içinde `lojistik_kume` ve `tasarim_matrisi`.
2. **Dışlama kuralları ön kayıtla eşleşiyor mu?** `ilklot_analiz.py` içinde `durumlari_belirle` ve duyarlılık kümeleri.
3. **Sessiz hata var mı?** Bozuk ya da eksik veriyle (boş sütun, tekrar eden kod, 0-1 dışı oran, yanlış yazılmış grup) betik uyarı veriyor mu, yoksa sonucu sessizce değiştiriyor mu?
4. **Rapor metni kodun yaptığını mı söylüyor?** Özellikle "anlamlı", "beklenen yön", eşdeğerlik (TOST) ve uyarı cümleleri.
5. **Çoklu karşılaştırma:** Holm ailesi hangi testleri kapsıyor (aşağıdaki açık nokta).
6. **Kör mod** (`--kor`): rapor, uyarı, grafik ve çıktı dosyalarında grubu ele veren bir şey kalıyor mu?

Bir şey bulursan: dosya + satır, ne beklediğin, ne olduğu, çalıştırdığın komut.

## Yapay zekâ ile yapılan ilk inceleme (11.10.2026)

Betikleri benim yazdığım bağlamdan bağımsız bir yapay zekâ ajanı okudu ve sayısal olarak denedi. **Bu bir insan incelemesinin yerini tutmaz**; ikisi birbirini tamamlar. Ajan, lojistik katsayıları ve kümeye dayanıklı standart hataları (CR1) elle yazdığı bağımsız bir hesapla, TOST yönünü, Hedges g'yi, Cohen κ'yı, HC3'ü ve güç simülasyonunu doğrulamış. Sentetik veride kör modun OR'yi tam 1/OR'ye çevirdiğini de görmüş. `statsmodels` kurulamadığı için gerçek bir istatistik paketiyle karşılaştırma **yapılmadı**; insan inceleyici bunu yapabilirse değerlidir.

**Bulunup düzeltilenler** (her biri için test eklendi, testlerin bozulunca kaldığı doğrulandı):

| Bulgu | Düzeltme |
|---|---|
| Kodlama dosyasında aynı kod iki kez olunca katılımcı analizde iki kez sayılıyordu | Yinelenen satır atılır, uyarı verilir |
| Holm, hesaplanamayan (NaN) p'yi 1 yapıyor ve diğerlerini yanlış büyütüyordu | NaN aileye girmez, NaN kalır |
| 0-1 dışı panik satış oranı (1,5 gibi) analize giriyordu | Geçersiz sayılır, uyarı verilir |
| Tanınmayan `set_order` yazımı set kovaryatını sessizce modelden atıyordu | Uyarı verir, rapordaki neden metni düzeltildi |
| Geçersiz gruplu satır varsa farklı kayıp (Fisher) testi sessizce atlanıyordu; sonuç yalnız p < 0,1'de görünüyordu | Yalnız A/B satırlarıyla hesaplanır, her zaman raporlanır |
| Hızlı test modundaki boş gruplu satır "geçersiz grup" sayılıyordu | Önce test modu kontrol edilir |
| Özdeş katılımcılarda ANCOVA çöküp raporu hiç yazmıyordu | Çökmez, ANCOVA satırı boş kalır |
| Ön kaydın "dışlamalar ayrı ayrı ve birlikte" cümlesine karşın amaç tahmini tek başına satırı yoktu | Satır eklendi |
| Kör kodlama şablonunda anahtar kelime sonucu (`otomatik_aday`) vardı; bu grupla ilişkili ve kodlayıcıyı yönlendirir | Şablondan çıkarıldı |
| p = 0,0497 "p = 0,050" yazılıp "anlamlı" deniyordu | 0,0495-0,0505 arası dört basamak yazılır |
| Pilot raporu `cooldown_cancel` sütunu yoksa çöküyordu | Sütun yoksa 0 sayılır |

**Açık kalanlar** (karar ya da ek çalışma gerekir):

1. **Yinelenen kod kuralı.** Aynı kod iki kez gelirse en son kayıt kullanılıyor. Tamamlamış birinin sonradan gelen yarım kaydı onu düşürebilir. Betik şimdi bu durumu ve kodun grubunun farklı olmasını uyarıyor, ama kural ön kayıtta yazılı değil. **[KARAR]** Hangi kayıt geçerli?
2. **Holm ailesi tanımsız.** Ailenin büyüklüğü olay dosyası verilip verilmediğine göre 6 ya da 7 olabilir. Ön kayıtta ikincil analizlerin listesi ve aile sabitlenmeli. **[KARAR]**
3. Duyarlılık satırında model yakınsamazsa hücre "yetersiz veri" ile aynı şekilde "-" yazıyor; neden belirtilmiyor.
4. `ilklot_pilot.py` pilottan türettiği `--taban` değerini ortalama oranın logit'i olarak veriyor; sigma = 1,2 iken simülasyondaki ortalama oran 0,5'e çekildiği için sapma var (0,80 hedef → ≈ 0,75). Kaba kalibrasyon, güç tahminini küçük ölçüde etkiler.
5. `analiz/ornek/SAHTE_VERI_ornek_rapor/` eski betik sürümüyle üretilmiş (1.0); güncel çıktıyla birebir aynı olmayabilir.
6. Doğrulanamayan şüpheler: `lojistik_kume` adım yarılama 1e-8'e inince yanlışlıkla "yakınsadı" diyebilir (gerçek veride tetiklenemedi); amaç tahmini anahtar kelime taramasında "bekle" kökü "beklenti" gibi sözcüklerde yanlış pozitif verebilir (yalnızca yaklaşık sütun); kör anahtar dosyası silinip analiz yeniden çalıştırılırsa yazı-tura yeniden atılır (anahtar dosyası zaten varsa betik üzerine yazmayı reddediyor).

## İncelemeden sonra

Bulguları buraya ekle, düzeltilenler için `APP_VERSION` değil `SURUM` (analiz betiği) güncelle ve ön kayıtta betik sürümünü ve özet değerini (`shasum`) yeniden yaz.
