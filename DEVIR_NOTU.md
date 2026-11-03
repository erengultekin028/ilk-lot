# Devir notu (başka bir Claude oturumu ve geliştirici için)

Bu belge, projeyi ilk kez gören biri için yazıldı. Önce bunu, sonra `README.md` ve `docs/MIMARI.md`'yi oku. Çalışma kuralları ve komutlar `CLAUDE.md`'dedir. **Sürüm geçmişi (b5–b43) ve eski notların tamamı `CHANGELOG.md`'dedir**; bu belge yalnızca güncel durumu tutar. Son güncelleme: **1 Kasım 2026**. Uygulama sürümü **2026.11.01-b43**, onam sürümü **v1**.

## Güncel durum (1 Kasım 2026)
- **Yayın:** https://ilk-lot-pilot.web.app (Firebase Hosting; `main`'e gönderimde GitHub Actions ile). Pilot başlamadı. 28.10 panel kontrolü: 80 yuva (40/40), 10 alınmış, hepsi deneme kaydı, Sistem testi ✓.
- **b46 (4 Kasım, yerelde, COMMIT'LENMEDİ, test koşulmadı, YAYINLANMADI):** kalan tüm gerçek şirket adları/kodları kaldırıldı (karar anı görevi hisseleri KLSBK…PZRLK; haber 10'daki "Borsa İstanbul"; örnek veri, eski testler, belgeler). `arsiv/` ve `docs/ETIK_KURULA_SIRKET_ADLARI_EPOSTASI.md` silindi. Karar paketi madde 18 kapandı. Ayrıntı CHANGELOG b46.
- **b45 (3 Kasım, COMMIT'LENDİ, YAYINLANMADI):** simülatör hisseleri kurgusal yapıldı (ALTKY, PTRVA, BLTAY, GKYOL, TUNCS, SEPMK); onam cümlesi güncellendi, `CONSENT_VERSION` = `v1.1` (`v2` silme politikası için ayrı).
- **b44 (1 Kasım, yerelde, COMMIT'LENMEDİ, test koşulmadı, YAYINLANMADI):** onam ekranı "Veri sorumlusu" alanı dolduruldu (Gümüşhane Üniversitesi, Eren Gültekin); `CITATION.cff` eklendi; `tanitim.html` yürütücü/üniversite dolduruldu. Davranış aynı. Ayrıntı `CHANGELOG.md`.
- **b43 (1 Kasım, YAYINDA; `main` = `mimari`, `testler` ve `yayin` yeşil, canlı sitede b43):** telefonda Portföy satırlarına renkli hisse kutusu (kullanıcı isteği; halka grafik, pay çubuğu, sol özet telefonda hâlâ gizli). Kullanıcı gerçek telefonda denedi, "olmuş" dedi; hangi telefon/tarayıcı ve büyük yazı/koyu tema kayda geçmedi. Yeni testin mutasyon doğrulaması yok.
- **b42 (1 Kasım, YAYINDA, b43 ile birlikte):** CI'ı kıran erişilebilirlik hatası düzeltildi (`#market-news` klavyeyle odaklanabilir) ve kullanılmayan kod temizlendi; ayrıntı `CHANGELOG.md`.
- **b41:** geniş ekran (≥1100 px) simülatör ekranları yeni tasarım dilinde (Portföy, Piyasa, Analiz, hisse ayrıntısı; Manrope + Inter). Telefon/tablet, karar anı ekranları (1. ve 3. bölüm) ve fiyat yolu özeti (`3171573551 18600`) değişmedi.
- **Uyaranın görünümü b38'de değişti** (açık temada kayıp rengi ≈%6 koyulaştı, araştırmacı onayıyla): ön kayıt ve `--kilitle` bundan SONRA yapılmalı.
- **Onam v2 UYGULANMADI** (`etik/ONAM_V2_TASLAGI.md`, KVKK yanıtı ve onay bekliyor). Mevcut onam "verilerin silinir" diyor, soft delete (politika A) ile çelişiyor: gerçek katılımcıyla (pilot dahil) kullanma.
- **Yeniden katılım** ("Yeni katılım başlat") pilota kadar AÇIK; ana veri toplamadan önce `ALLOW_FRESH_START_AFTER_WITHDRAWAL = false` (karar paketi madde 17; `dagit.py` ana toplamada engeller).
- **Lisans:** tüm hakları saklı, `LICENSE` yok; `CITATION.cff` için ad/kurum/ORCID bekleniyor.
- **Karar paketi:** madde 18 (şirket adları) kapandı: hepsi kurgusal (b45-b46). KVKK e-postası `docs/KVKK_BIRIMINE_EPOSTA.md` taslak; gönderim durumu kayıtlı değil.
- **Geçersiz veri uyarısı:** b27–b30 ile toplanmış A grubu verisi geçerli sayılmaz (b31: bekleme ekranı geri sayımı ilerlemiyordu); pilot başlamadığı için bilinen böyle veri yok. Eski sürümlerle toplanmış veri yeni sürümle **birleştirilmez** (ayrıntı: `CHANGELOG.md` b8, b13).

## Proje nedir
**İlk Lot:** TÜBİTAK 2209-A başvurusu için hazırlanan bir araştırma uygulaması (başvuru aşamasında; destek kesinleşmedi, "destekli" yazma). Soru: genç yatırımcılarda **zararına satış öncesi 10 saniyelik bir bekleme ekranı panik satışı azaltır mı ve etki, bekleme ekranı ortadan kalktığında da sürer mi (aktarım)?** Telefonda ve geniş ekranda çalışan web uygulaması (`public/` altında ES modülleri, derleme yok); katılımcı kaydı Firebase'e yazılır (b27'den beri yerel kayıt kipi yok). Araştırmayı yürüten kişi üniversite öğrencisi; danışmanı ve etik kurulu var.

Eski claude.ai artifact bağlantıları b27 öncesi tek dosya sürümüdür ve güncel değildir (`CHANGELOG.md`, "Tarihsel notlar").

## Mevcut tasarım (yayında olan)
- **Tek oturum ≈ 30 dk:** katmanlı onam → anonim giriş + sıradaki yuva (kod girişi yok, b27) → form (yalnızca "18+" zorunlu) → ön test (Lusardi-Mitchell "Big Three" 3 soru + araştırmacının 3 ek sorusu + dikkat sorusu; CSV: `pre_test` 6 madde, `pre_test_b3` yalnız ilk 3) → tanıtım, 2 alıştırma, anlama kontrolü → **1. bölüm:** 6 karar anı → **2. bölüm:** 7,5 dk piyasa simülatörü (300 gün × 1,5 sn) → **3. bölüm:** 6 karar anı (farklı hisseler) → son test (2 soru) → müdahale kontrolü, "araştırma neyi ölçüyordu?" → bilgilendirme (amaç, grup, kurgusal olduğu, destek, çekilme).
- **Müdahale:** A grubunda, yalnızca 2. bölümde (simülatör), pozisyon ≥ %2 zarardayken "Sat" onayından önce 10 sn bekleme ekranı. B grubunda yok. 1. ve 3. bölümde iki grupta da yok. İki grupta da her satışta gerekçe sorusu.
- **Karar anları:** X ve Y setleri (6'şar karar): 4 "sert düşüş + zarar" (sürü bilgisi × sonuç yönü çapraz) + 1 normal/kâr + 1 normal/zarar. Her hücrede beklenen sonuç sıfır ("sat" ya da "tut" avantaj sağlamaz). Set sırası gruplar içinde dengeli.
- **Simülatör:** 6 hisse, **kurgusal şirket adları** (ALTKY, PTRVA, BLTAY, GKYOL, TUNCS, SEPMK; b45) ve **kurgusal fiyat, haber ve krizler** (her yerde belirtilir); 3 sektörel kriz (52., 135., 218. gün); tohum nötr piyasa için seçildi; tam sayı lot, elle lot girişi, sekmeler (Portföy / Piyasa / Analiz), hisse detay sayfası.
- **Randomizasyon:** katılımcı onamdan sonra anonim girişle sıradaki "yuvayı" alır; grup `allocations/{kod}` kaydından gelir (yalnızca sahibi okur). Kart/QR dağıtımı, `#k=` bağlantısı ve hızlı test/tanıtım kipleri b27'de kalktı (`docs/MIMARI.md`, `docs/VERI_SOZLUGU.md`).
- **Birincil analiz:** "sert düşüş + zarar" denemelerinde grup × bölüm etkileşimi; katılımcıya göre kümelenmiş (CR1) lojistik regresyon. Karma model değildir.

## Ana bulgu: güç yetersiz olabilir
Ana ölçüt bölüm başına yalnızca 4 denemeye dayanıyor. Varsayımlarla (taban %50 satış, σ = 1,2, A'nın %70'i bekleme ekranını görüyor) grup başına 100 tamamlayan, **%80 güce yalnızca OR ≈ 0,4 ya da daha güçlü etkide** ulaşır (OR = 0,5'te ≈ %55). Gücü en çok artıranlar: maruz kalma oranı ve bölüm başına deneme sayısı (`analiz/ornek/guc_duyarlilik.md`). **%70 maruz kalma bir varsayımdır, ölçülmedi;** pilot ölçecek.

## Bekleyen kararlar (kullanıcıya ait; senin yerine verme)
1. **Örneklem yolu:** mevcut tasarımla grup başına ~100 mü, yoksa tasarımı güçlendirip (bölüm başına 8 deneme, A'da herkesin bekleme görmesi) ~60 mı? Pilot sonrası.
2. **Simülatör süresi:** kullanıcı 150 yerine **300 gün** istedi ve b8'de uygulandı (7,5 dk). `docs/BEKLEYEN_150_GUN.md` ayrı, uygulanmamış bir plandır. Takvim ya da tohum değişirse tohum yeniden aranmalı: `docs/SIMULATOR_TOHUMU.md`.
3. **Eşdeğerlik sınırı (TOST):** hangi OR'nin "ihmal edilebilir" sayılacağı bilimsel karar; kullanıcıdan ve danışmandan iste, uydurma. **Araç hazır** (`ilklot_analiz.py --esdeger-or`, `ilklot_guc.py --esdeger-or`) ama sınır verilmedikçe çalışmaz; seyreltme yanlılığına dikkat (`analiz/README.md`, "Eşdeğerlik").
4. Birincil modelin türü, tek/çift yönlü test (varsayılan: iki yönlü), ön kayıt, ölçek çevirisinin doğrulanması, kart dağıtım politikası, veri paylaşımı.
5. **Sarı `[DOLDUR]` alanları** (`CFG.consentInfo`: etik onay, saklama, barındırma, destek birimi; `CFG.contact`; `controller` b44'te dolduruldu): boşken uygulamada sarı işaretli görünür.

## Değiştirme kuralları
Ayrıntı ve komut listesi `CLAUDE.md`'dedir (geçerli olan odur). Özet:
1. **Kaynak doğrudan `public/` içindedir, derleme yok** (katılımcı uygulaması `public/index.html` + `public/src/`, yönetim paneli `public/admin/`).
2. **Davranış değiştiren her değişiklikte `APP_VERSION`'ı artır** (`public/src/constants/app-config.js`) ve `CHANGELOG.md`'ye kayıt yaz. Pilot ya da veri toplama başladıktan sonra `CONFIG` ölçüt ayarlarını (`seed`, `simSeed`, `simCrises`, `cooldownSec`, `lossThreshold` vb.) değiştirme; başlarken `python firebase/dagit.py --kilitle` çalıştır (sürüm ve ölçüt ayarları kaydedilir, sonra biri değişirse ön kontrol HATA verir).
3. **CSV sütunları senkron:** `public/src/admin/admin-exports.js`, `analiz/ilklot_ornek_veri.py` (`KATILIMCI_KOLONLARI`) ve analiz betikleri. Veri sözleşmesi (Firestore alanları, olay adları, CSV sütunları, `CONFIG` anahtarları) DEĞİŞMEZ: `docs/VERI_SOZLUGU.md`.
4. **Belgeye "uygulama şunu yapar" yazmadan önce kodu oku ya da test et.** Bu projede belgeler yazılırken birçok yanlış iddia yakalandı (güvenlik kuralı kapsamı, uygulamada olmayan bir not, silme sonrası kalan alanlar). Doğrulanamayanı "doğrulanmadı" diye yaz.
5. **Testin yakaladığını bilinçli bozmayla (mutasyon) doğrula.** İlk denemede bozmanın kendisi etkisiz çıkabilir (iki kez oldu).

## Çalıştırma
Testleri kullanıcı koşar (25.10.2026 kararı); koşmadığın testi "geçti" yazma. Komutlar (`CLAUDE.md`):
```
npm run lint && npm run check:modules && npm run check:classes && npm run check:records
python testler/arac_testleri.py
python analiz/test_betikler.py
python testler/ekran_testleri.py        # tarayıcı testleri, Firebase kesik, gerçek veri yazılmaz; CI'da da çalışır
cd firebase/kural_testleri && npm test  # kurallar değiştiyse
node tools/check-equivalence.mjs <eski ilk-lot.html>   # davranışa dokunduysan; uyaran/fiyat yolu özeti aynı kalmalı
```
Eski `testler/uygulama_testleri.py`, `erisilebilirlik_taramasi.py`, `gorsel_karsilastirma.py` eski tek dosya yapısı içindi ve çalışmaz (`testler/README.md`). Yayın öncesi: `python firebase/dagit.py` (ön kontrol); ayrıntı `firebase/dagit.py` başlığında.

## Doğrulanmayanlar
- **Gerçek Firebase ve güvenlik kuralları:** `CLAUDE.md`'ye göre b27'deki yeni katılım akışı ve kurallar gerçek Firebase'de ve emulator'de denenmedi. `CHANGELOG.md` b32 notu "kural testleri 18/18" diyor; hangi ortamda koşulduğu belgelenmemiş, koşulduysa kaydını ekle.
- **Gerçek telefonlar:** klavye, ekran kilidi, uygulama içi tarayıcı, yazı büyütme, ekran okuyucu denenmedi (protokolde ⚠️).
- **Ölçek çevirisi** (Big Three) araştırmacı çevirisidir; geri çeviri ya da yayımlanmış uyarlamayla doğrulanmadı.
- **Eşzamanlı iki cihaz:** eski kodlu girişte korunmuyordu (olay numaraları çakışabilirdi); yuva modelinde durumu denenmedi.
- Pilot yapılmadı; maruz kalma oranı, süre ve anlaşılırlık ölçülmedi.
- **Safari/Firefox** denenmedi (`docs/GERCEK_CIHAZ_TESTI.md`). Otomatik erişilebilirlik taraması (axe-core) `ekran_testleri.py` içinde.

## Önerilen ama yapılmayanlar
Tek soruluk risk tutumu, takip ölçümü (1-2 hafta), üçüncü grup, katılım teşviki, bilgilendirme sonrası "öğren" modu, ekran okuyucu ve gerçek telefonda erişilebilirlik denemesi (otomatik tarama var, insan denemesi yok). ("Başkalarına anlatma" notu b11'de karar kartı bölümüne eklendi; onam ekranında yok.) Karar gerektirenler (maruz kalmayı garantilemek, deneme sayısını artırmak) pilot sonucundan önce uygulanmamalı.

## Kullanıcıyla çalışma tercihleri
Türkçe konuş. Doğrudan ve kısa cevap ver; sonucu başa yaz. Övme, boş umut ya da pembe tablo yok; riskleri ve doğrulanmayanları açıkça söyle. Kod yorumları Türkçe olsun ve yalnızca "neden"in açık olmadığı yerlerde, kısaca. Büyük işleri sorun çıkana kadar sessizce yapmak yerine, ne yaptığını, neyi test ettiğini ve neyi test etmediğini yaz.

## İlk yapılacaklar (öneri)
1. `README.md`, bu not, `docs/MIMARI.md`'yi oku; test komutları `CLAUDE.md`'de (testleri kullanıcı koşar).
2. Kullanıcıya hangi bekleyen kararı vermek istediğini sor; kararsız olan işleri başlatma.
3. Pilot ve sarı alanlar kapanmadan ön kayıt ve başvuru işlerini "bitti" sayma.
