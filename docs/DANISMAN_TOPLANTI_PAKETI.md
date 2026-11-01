# Danışman toplantı paketi (2 Kasım 2026)

> Hazırlayan: Claude, 1 Kasım 2026. Kararlar sizin ve danışmanınızındır; bu belge yalnızca seçenekleri, kaynaklı sayıları ve sorulacakları toplar. Sayıların hepsi `analiz/ornek/` ve `docs/` altındaki belgelerden alındı (kaynak her bölümde yazılı); yeni bir hesap koşmadım. **Güç sayıları simülasyon çıktısıdır ve varsayımlara bağlıdır** (bölüm 2).

## 1. Tek bakışta

**Ne hazır:** Uygulama b41 (`main` dalına gönderildi; canlı sitenin güncel olduğunu ayrıca kontrol etmedim), 6 karar anı + 7,5 dk simülatör + 6 karar anı akışı, yönetim paneli, analiz betikleri (kümeye dayanıklı lojistik, TOST, kör analiz), pilot raporu aracı, ön kayıt ve etik başvuru taslakları, KVKK ve etik kurul e-posta taslakları.

**Ne eksik (ve kodla çözülmez):**
1. **Örneklem ve güç:** mevcut tasarım yalnızca OR ≈ 0,4 ve daha güçlü etkide %80 güce ulaşıyor.
2. **Bilimsel kararlar açık:** örneklem yolu, TOST sınırı, birincil model, ön kayıt zamanı.
3. **Etik ve hukuk:** konum / yurt dışı aktarım, onam v2 (mevcut onam "verilerin silinir" diyor ama uygulama silmiyor), gerçek şirket adları (madde 18). **Mevcut onam metniyle gerçek katılımcıya (pilot dahil) gidilmemeli.**
4. **Doğrulanmayanlar:** pilot yapılmadı (maruz kalma oranı, süre, anlaşılırlık ölçülmedi); gerçek telefonlarda ve gerçek Firebase'de tam akış denenmedi; Big Three çevirisi geri çeviriyle doğrulanmadı.

## 2. Örneklem ve güç (en önemli konu)

**Sorun:** Ana ölçüt bölüm başına yalnızca 4 "sert düşüş + zarar" denemesine dayanıyor. Güç, bekleme ekranını **gerçekten gören** A katılımcılarındaki etkiye bağlı.

**Varsayımlar (ölçülmedi, varsayıldı):** 1. bölümde ~%50 satış; kişiler arası değişkenlik σ = 1,2 (logit); ortak değişim −0,2; **A grubunun %70'i bekleme ekranını görüyor**; α = 0,05 iki yönlü. (Kaynak: `analiz/ornek/guc_tablosu_varsayilan.txt`, `docs/ON_KAYIT_TASLAGI.md` bölüm 3)

**Mevcut tasarım, grup başına tamamlayan n ve etki (OR = bekleme gören A'daki gerçek odds oranı):**

| Grup başına n (işe alım) | OR = 0,7 | OR = 0,5 | OR = 0,4 | OR = 0,3 |
|---|---|---|---|---|
| 60 (67) | %16 | %39 | %58 | %79 |
| 80 (89) | %18 | %50 | %71 | %90 |
| 100 (112) | %21 | %55 | %81 | %95 |
| 150 (167) | %28 | %78 | %94 | %100 |

- %80 güce ulaşan en küçük n: OR = 0,4 → 100 (112 işe alım); OR = 0,3 → 80 (89); OR = 0,5 ve 0,7 → 150 ile bile ulaşılamıyor.
- Tahminlerin standart hatası en fazla ±1,6 puan. (`guc_duyarlilik.md` farklı bir koşuda n = 100 için %58 / %79 veriyor; fark simülasyon gürültüsüdür.)

**Gücü en çok artıran iki şey** (n = 60, `guc_duyarlilik.md`):

| Değişken | OR = 0,5 | OR = 0,4 |
|---|---|---|
| Maruz kalma %40 / %70 / %95 | %15 / %39 / %58 | %23 / %59 / %83 |
| Bölüm başına deneme 4 / 8 / 12 | %39 / %65 / %80 | %59 / %86 / %96 |
| **Birleşik: %95 maruz kalma + 8 deneme** (n = 60) | **%89** | **%98** |

**İki yol (karar paketi madde 8, ön kayıt [KARAR] 1):**

| | Seçenek A: tasarımı güçlendir | Seçenek B: mevcut tasarım |
|---|---|---|
| Ne | Bölüm başına 8 deneme; A'daki herkes simülatörde bekleme ekranını görür | Değişiklik yok |
| Hedef | Grup başına **60** tamamlayan | Grup başına **100** tamamlayan (≈ 112 işe alım) |
| Güç | OR = 0,5'te ≈ %89, OR = 0,4'te ≈ %98 | OR = 0,4'te ≈ %80; OR = 0,5'te ≈ %55-58 |
| Bedel | **Uygulama değişir:** karar anı sayısı (4 → 8) ve simülatör davranışı değişir, test ve eşdeğerlik kontrolü gerekir; oturum süresi uzar (ölçülmedi). Ön kayıttan ve pilottan **önce** yapılmalı | Gerçek etki OR = 0,5 civarındaysa çoğu zaman anlamlı sonuç çıkmaz; sınırlılık raporda açıkça yazılır |

**Sorulacaklar:**
1. Hangi gerçek etki büyüklüğü **bilimsel olarak makul** (OR = 0,5 mi, 0,4 mü)? Literatürde dayanak var mı? (Ben uydurmam; bu danışman ve literatür kararı.)
2. Karar **pilot sonrasına** mı bırakılsın? Mevcut pilot planı buna göre kurulu: pilot maruz kalma oranını ölçer; **<%60 → tasarımı güçlendir; %60-80 → sınırda, iki senaryoyla karar; ≥%80 → mevcut tasarım yeterli olabilir** (`docs/PILOT_PLANI.md`).
3. Seçenek A seçilirse bu, uyaran setlerinin ve fiyat yolunun değişmesi demektir; kabul mü?
4. Gerçekçi **işe alım hızı ve kanal** (karar paketi madde 7) 100-112 kişiye yeter mi? İşe alım sayıları, hedefin yaklaşık %12 fazlası (100 → 112) olarak varsayılmış kayıp payını içerir; gerçek kayıp pilotta ölçülecek.

## 3. Bilimsel kararlar (kısa)

| Konu | Mevcut durum | Sorulacak |
|---|---|---|
| **TOST sınırı** (madde 9) | Araç hazır (`ilklot_analiz.py --esdeger-or`, `ilklot_guc.py --esdeger-or`) ama **sınır verilmeden çalışmaz.** Seyreltme yanlılığı uyarısı var (`analiz/README.md`) | "İhmal edilebilir" saydığınız en büyük OR nedir? **Ben sayı önermem.** Sınır gelince gücü hesaplarım |
| **Birincil model** | Kümeye dayanıklı (CR1) lojistik regresyon; grup × bölüm etkileşimi. Karma model değil | Karma model (rastgele kesişim) istenir mi? İstenirse analiz betiği ve ön kayıt değişir |
| **Test yönü** | İki yönlü (varsayılan, daha tutucu) | Tek yönlü gerekçesi var mı? |
| **Panik satış tanımı** (madde 10) | "Sert düşüş + zarar" anlarında satış (mevcut) | Mevcut tanım ön kayda aynen yazılsın mı? |
| **Bilgi düzeyi × grup × bölüm** | İkincil/keşifsel, düşük güçlü (grup başına 100'de ≈ %19, `analiz/ilklot_bilgi_guc.py`) | Keşifsel olarak kayda girsin mi? |
| **Yeni ölçüm** (madde 15, ör. `stress_sell`) | Eklenmedi | Eklenecekse ön kayıttan önce karar, sonra dondurma |
| **Kör analiz / CSV taahhüdü** | `--kor` aracı var; güçlü körleme değildir | Araştırmacının veri toplama bitmeden CSV'yi sonuç amacıyla açmama taahhüdü ön kayda yazılsın mı? |
| **Ön kayıt zamanı** (madde 11) | OSF; pilottan sonra, ana toplamadan önce | Etik onaydan ve `--kilitle`'den sonra mı? |

## 4. Pilot (karar paketi dışında ama danışman onayı gerekir)

- **10-12 kişilik pilot** kayıttan önce yapılacak mı? (`docs/PILOT_PLANI.md`)
- **Eşikler benim başlangıç önerimdir, danışmanla gözden geçirilmeli:** medyan süre >40 dk "kısalt", 35-40 sınırda; tamamlama <%80; anlama kontrolü <%80; müdahaleyi fark etme <%60; taban panik satış oranı <0,15 ya da >0,85; dikkat kontrolü <%85. (Süre için `BEKLEYEN_150_GUN.md` farklı bir öneri, 30/35 dk, taşıyor; karar bekliyor.)
- **Etik onay, pilot geri bildirim formunu (3 isteğe bağlı soru) kapsıyor mu?** Doğrulanmadı.
- **Yeniden katılım ("Yeni katılım başlat")** pilota kadar açık (madde 17); ana toplamadan önce kapatılacak, `dagit.py` unutulmasını engelliyor.

## 5. Etik, hukuk, KVKK (yönlendirme istenecek)

| Konu | Durum | Danışmandan istenen |
|---|---|---|
| **Konum / yurt dışı aktarım** (madde 1) | Veri ABD'de (nam5). Firebase Authentication yalnızca ABD'de çalışır, yani AB'ye taşıma aktarımı kaldırmaz. Konum sonradan değişmez | Kurumunuzda KVKK birimi kim? E-posta taslağı hazır: `docs/KVKK_BIRIMINE_EPOSTA.md` |
| **Onam v2 / silme politikası** (madde 2, 3) | Soft delete uygulanıyor; onam "silinir" diyor (çelişki). Taslak: `etik/ONAM_V2_TASLAGI.md`, **uygulanmadı** | Soft delete kabul mü, kalıcı silme mi? Veri "anonim" mi "takma adlı" mı? |
| **Gerçek şirket adları** (madde 18) | 6 gerçek BIST adı, kurgusal fiyat ve olumsuz haberlerle. Pilottan sonra değiştirmek verileri karşılaştırılamaz yapar | Etik kurul ve hukuk birimi kim? E-posta taslağı: `docs/ETIK_KURULA_SIRKET_ADLARI_EPOSTASI.md` |
| **Saklama süresi, ödül, kanallar** (madde 5, 6, 7) | Açık; etik kurul belirler | Kurulun beklentisi |
| **`[DOLDUR]` alanları** (madde 12) | Onam ekranında sarı işaretli | Etik onay numarası ve iletişim adresi ne zaman netleşir? |
| **Araştırmacı hesabı** (madde 14) | Tek e-posta tüm yönetim erişimine sahip | 2FA açılsın; hesap danışmanla yedeklensin mi? |

## 6. Danışmanın bilmesi gereken sınırlılıklar (dürüst liste)

- **Maruz kalma oranı (%70) bir varsayımdır**, ölçülmedi. Gerçek değer düşükse güç hızla düşer (n = 60'ta %40 maruz kalmada OR = 0,5 gücü %15).
- **Tek oturum, kısa müdahale:** sonuçlar "kısa süreli aktarım" olarak adlandırılacak; simüle piyasa dış geçerliği sınırlar.
- **Gerçek şirket adları** katılımcıda önceden fikir uyandırabilir (ön kayıtta sınırlılık olarak yazılı).
- **Bekleme ekranını görmek randomize değil** (A grubunda yalnızca ≥%2 zarardaki satışta çıkar); müdahale görünür olduğu için tam körlük yok.
- **Ön test:** Big Three çevirisi araştırmacı çevirisi, doğrulanmadı; 3 ek madde doğrulanmamış araştırmacı yazımı.
- **Uyaran görünümü b38'de değişti** (açık tema kayıp rengi ≈%6 koyulaştı); ön kayıt ve `--kilitle` bundan sonra yapılmalı.
- **Doğrulanmayanlar:** gerçek Firebase ve kuralların tam akışı, gerçek telefonlar (klavye, uygulama içi tarayıcılar, Safari/Firefox), ekran okuyucu.
- **Ön kayıt taslağında bir eskime var:** `ON_KAYIT_TASLAGI.md` bölüm 2 "katılım kodları … kartlara basılmıştır" diyor. Kart/kod dağıtımı b27'de kalktı; gruplar artık önceden üretilmiş 4'lük bloklu listeden sırayla yuvalara dağıtılıyor (`docs/MIMARI.md`). Blok mantığı duruyor, kart ifadesi yanlış: **ön kayda geçmeden önce düzeltilmeli** (bu belgede düzeltmedim, karar sizin).

## 7. Toplantıda doldurulacak karar kaydı

Her satır için karar ve tarih yazın; sonra `docs/KARAR_PAKETI.md`'ye işlenir.

| # | Konu | Danışmanın görüşü / karar | Tarih | Sonraki adım ve sorumlu |
|---|---|---|---|---|
| 8 | Örneklem yolu (A: güçlendir / B: mevcut / pilot sonrası karar) | | | |
| 9 | TOST sınırı (OR) | | | |
| 9 | Birincil model; test yönü | | | |
| 10 | Panik satış tanımı | | | |
| 11 | Ön kayıt zamanı | | | |
| 15 | Yeni ölçüm eklensin mi | | | |
| — | Pilot (10-12 kişi) ve eşikler | | | |
| — | Pilot formu etik onay kapsamında mı | | | |
| 1 | Konum / KVKK birimi kim, e-posta kime | | | |
| 2, 3 | Soft delete ve takma adlı veri | | | |
| 18 | Gerçek şirket adları: kime sorulacak | | | |
| 17 | Pilotta yeniden katılım açık kalsın mı | | | |
| 5, 6, 7 | Saklama, ödül, kanallar | | | |
| 14 | Araştırmacı hesabı: 2FA ve yedek | | | |
| — | Ölçek çevirisi: geri çeviri kim yapar | | | |

## 8. Danışmandan isteyebileceğiniz somut şeyler

1. KVKK birimi ve etik kurul / hukuk birimi için **doğru kişi ve e-posta adresi** (iki e-posta taslağı hazır, danışmanı CC'ye eklemek için).
2. **Örneklem ve etki büyüklüğü için literatür** (gerçekçi OR aralığı).
3. TOST için **"ihmal edilebilir etki" sınırı**.
4. **Pilot için izin ve katılımcı kaynağı** (10-12 kişi).
5. **Ön kayıt platformu** (OSF) ve zamanlaması konusunda onay.
6. **Ölçek çevirisinin doğrulanması** için kim yapabilir (geri çeviri ya da yayımlanmış Türkçe uyarlama).
