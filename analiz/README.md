# İlk Lot analiz araçları

Uygulamadan indirilen CSV'leri analiz eder, örneklem büyüklüğünü hesaplar. Gerçek veri gelmeden önce sahte veriyle denenebilir.

## Kurulum

Python 3.9 ya da üstü. Bağımlılıklar:

```
pip install numpy pandas scipy matplotlib
```

Test edilen sürümler: Python 3.12, numpy 2.4, pandas 3.0, scipy 1.17, matplotlib 3.10. Farklı sürümlerde önce `python test_betikler.py` çalıştır; hepsi geçerse devam et.

## Ne zaman ne çalıştırılır

0. **Her şeyden önce (1 dakika):** `python kuru_calistirma.py`: sahte veriyle CSV → pilot özeti → analiz hattı çalışıyor mu. Pilot verisi gelince `python kuru_calistirma.py --pilot KATILIMCI.csv --olaylar OLAYLAR.csv`: dosyanın **biçimini** denetler (sütunlar, yinelenen kod, grup etiketi, set_order, oran aralığı); etkiye bakmaz, OR ve grup farkı yazmaz.
1. **Pilot (10-12 kişi):** `docs/PILOT_PLANI.md`'ye göre yap, `ilklot_pilot.py` ile özetle; ölçülen maruz kalma oranıyla `ilklot_guc.py`'yi güncelle.
1. **Veri toplamadan önce:** `ilklot_guc.py` ile örneklem hedefini belirle, `docs/ON_KAYIT_TASLAGI.md`'yi doldurup kaydet.
2. **Veri toplarken:** Sonuçlara bakma. Araştırmacı panelinden yalnızca süreç bilgisine (katılım, denge, kayıp) bak.
3. **Veri toplama bitince:** Panelden "Katılımcı özeti" ve "Tüm olaylar" CSV'lerini indir.
4. **Amaç tahmini kodlaması:** `ilklot_analiz.py` ilk çalıştırmada `amac_tahmini_kodlama.csv` üretir (grup bilgisi yok). **İki bağımsız kodlayıcı** gruptan habersiz `kodlayici1` ve `kodlayici2` sütunlarını doldurur (1 = hipotezi doğru tahmin etti, 0 = etmedi). Betik Cohen κ'yı hesaplar, ayrıştıkları maddeleri `kodlama_ihtilaf.csv`'ye yazar; uzlaşma toplantısında `uzlasma` sütununu doldurup `--kodlama` ile yeniden çalıştır. Tek kodlayıcı kullanıyorsan `manuel_dogru` sütunu yeter (uyum hesaplanmaz).
5. **Analiz:** aşağıdaki komut.

## Komutlar

```
python ilklot_analiz.py KATILIMCI.csv --olaylar OLAYLAR.csv --cikti rapor --hedef-n 100
python ilklot_analiz.py KATILIMCI.csv --olaylar OLAYLAR.csv --kodlama kodlama.csv --cikti rapor

python ilklot_analiz.py KATILIMCI.csv --kor --kor-anahtar anahtar.json --cikti kor_rapor   # kör analiz (aşağıda)
python ilklot_analiz.py --kor-ac anahtar.json                  # anahtarı aç (analiz planı dondurulduktan sonra)

python ilklot_pilot.py KATILIMCI.csv --olaylar OLAYLAR.csv    # pilot özeti (süre, maruz kalma, anlama, hata, karar tablosu)
python ilklot_guc.py                                   # varsayılan güç tablosu (yaklaşık 15 sn)
python ilklot_guc.py --n 40 60 100 --or 1 0.5 0.4      # kendi ızgaran
python ilklot_guc.py --deneme 8 --maruz 0.95           # "tasarımı değiştirseydik" senaryosu
python ilklot_guc.py --duyarlilik                      # varsayımlar değişince güç nasıl değişiyor
python ilklot_guc.py --esdeger-or 2 --or 1 0.8 0.5     # TOST gücü de hesaplanır (sınır örnektir, seçim sana ait)
python ilklot_analiz.py KATILIMCI.csv --esdeger-or 2   # raporda TOST bölümü: tek değer x → [1/x, x]; iki değer: alt üst

python ilklot_ornek_veri.py --n-grup 100 --or 0.4 --seed 1 --cikti sahte   # SAHTE veri üret
python test_betikler.py                                # kendi testleri (yaklaşık 30 sn)
```

`--olaylar` isteğe bağlıdır ama sürü etkisi ve iki dosyanın tutarlılık denetimi için gerekir. `--not "..."` rapor başına uyarı notu ekler.

## Çıktı klasörü

| Dosya | İçerik |
|---|---|
| `rapor.md` | Katılım akışı, grup dengesi, birincil analiz, duyarlılık, ikincil analizler, kontroller, uyarılar |
| `fig1_panik_oranlari.png`, `fig2_degisim.png` | Grup ortalamaları ve kişi başına değişim |
| `dislama_kaydi.csv` | Her katılımcı neden dahil/hariç |
| `amac_tahmini_kodlama.csv` | Kör kodlama şablonu |
| `analiz_ozeti.json` | Makine okunur ana sonuçlar |

## Raporu okurken

- **Birincil analiz:** grup × bölüm etkileşimi (OR < 1: A grubunda satış B'ye göre daha çok azaldı). Katılımcıya göre kümelenmiş dayanıklı standart hatalı lojistik regresyon; karma model değildir. OR popülasyon ortalamalıdır ve kişiye özgü OR'den küçük (1'e yakın) çıkar.
- **Uyarılar bölümü** otomatik denetimlerdir (örneklem hedefin altında, farklı kayıp, bulaşma, tavan/taban etkisi, duyarlılıkta değişen sonuç). Boş çıkması "sorun yok" demek değildir, sadece bu denetimlerin tetiklenmediğini gösterir.
- **İkincil analizler keşifseldir.** Holm düzeltmeli p değerlerine bak. Bilgi düzeyi × grup × bölüm analizi (betik sürümü 1.1) düşük güçlüdür; güç simülasyonu: `python ilklot_bilgi_guc.py`.
- **Bekleme ekranını görenlerle B karşılaştırması** nedensel değildir: bekleme ekranını görmek rastgele atanmadı.

## Eşdeğerlik (TOST)

`--esdeger-or` verilmezse TOST çalışmaz. **Sınırı bu araçlar seçmez**: hangi OR'nin "ihmal edilebilir" sayılacağı bilimsel bir karardır; danışmanla belirle ve veriye bakmadan ön kayda yaz. Yukarıdaki `2` örnek değerdir, öneri değildir.

- Aynı kümeye dayanıklı standart hata ve t dağılımı (df = G − 1) kullanılır. Karar, %90 GA'nın sınırların içinde kalmasıyla aynıdır.
- **Seyreltme yanlılığı:** birincil OR iki nedenle 1'e doğru seyrelir: A'da bekleme ekranını görmeyenler ve popülasyon ortalamalı OR'nin kişiye özgü OR'den 1'e yakın olması. Bu yüzden etkisi sınırın tam üzerinde olan bir müdahale bile sık "eşdeğer" çıkar. Simülasyonda (n = 100, sınır 2, gerçek maruz-kalan OR = 0,5, %70 maruz kalma) TOST gücü ≈ %50'ydi; seyreltme kaldırıldığında (maruz kalma %99, sigma ≈ 0) ≈ %4'e (beklenen α) indi. Sonucu "etki yok" diye değil, "seyreltilmiş OR bu aralıkta" diye yorumla.
- Güç düşükse (grup başına ~100) geniş bir aralık dışında çoğu zaman "eşdeğerlik gösterilemedi" çıkar; bu, etki olduğu anlamına gelmez. Planlamak için `ilklot_guc.py --esdeger-or` kullan.
- Doğrulama: `test_betikler.py` içindeki üç TOST testi (GA ile karar eşdeğerliği, rapordan bağımsız geri hesap, seyreltme yokken güç ≈ α). Bunlar bilinçli bozmayla (p yönü ters, %95 GA) denendi ve yakaladı.

## Sınırlar

- Güç, `ilklot_guc.py` içindeki varsayımlara bağlıdır (özellikle bekleme ekranına maruz kalma oranı). Gerçek veriyle bu varsayımları güncelle.
- Betikler gerçek bir Firebase dışa aktarımıyla denenmedi; uygulamanın yerel (demo) modunda ürettiği gerçek çıktıyla denendi (`ornek/uygulama_ciktisi_ornegi_*.csv`, otomatik test katılımcıları).
- `ornek/SAHTE_VERI_ornek_rapor/` yapay veriden üretildi. Gerçek etki OR = 0,4 verilmesine rağmen bu örnek raporda sonuç anlamlı çıkmadı; tohum bilerek seçilmedi. 300 tohumluk denemede anlamlılık oranı %76'ydı, yani o örnek şanssız bir çekiliş. Rapor biçimini göstermek dışında bir şey kanıtlamaz.

## Kör analiz (isteğe bağlı, **[KARAR]**: ön kayıtta yazılacaksa şimdiden)

Amaç: analiz kararlarını (dışlamalar, model, hangi ikincil analizler) sonuç hangi yöndeyken verdiğini bilmeden vermek. `--kor` grup etiketlerini yazı-turayla yer değiştirir (G1/G2), `cooldown_*` sütunlarını atar, rapordan "bekleme süreli / kontrol / beklenen yön" ifadelerini çıkarır ve etiket eşlemesini `--kor-anahtar` dosyasına yazar.

Akış:
1. Veri toplama bitince `--kor` ile çalıştır; anahtar dosyasını **açma**, danışmanında ya da bir arkadaşında dursun. Raporun başındaki SHA-256 özeti anahtarın sonradan değiştirilmediğini gösterir.
2. Kör raporla analiz planını tamamla: dışlama kuralları, model sorunları (yakınsama, uç oranlar), duyarlılık satırları. Planı yaz, tarihle ve dondur.
3. Anahtarı aç (`--kor-ac`). Etiketler değiştiyse birincil OR gerçekte **1/OR**, p ve güven aralığının genişliği aynıdır (testlerle doğrulandı).
4. Normal modda çalıştır; sonuç kör raporun sonucuyla aynı olmalı. Farklıysa nedenini yaz.

Sınırlar (bilmen gerekenler):
- **Güçlü bir körleme değildir.** Ham CSV'de `cooldown_*` sütunları grubu açıkça gösterir; kör mod yalnızca raporu ve betiği maskeler. Verilere bakan kişi grubu zaten ayırt edebilir; amaç öz disiplin ve kayıt altına alınmış bir sıra düzenidir.
- Kör modda bekleme ekranını görme/doz-yanıt analizi, müdahale-fark-etme tablosu ve olay dosyası analizi **yok** (bunlar grubu ele verir). Bunlar anahtar açıldıktan sonra normal modda çalışır ve keşifsel sayılmalıdır.
- `--kor-tohum` yalnızca test içindir; gerçek analizde verme.
