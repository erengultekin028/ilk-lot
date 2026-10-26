# İlk Lot: iş-zaman çizelgesi ve bütçe taslağı

> Bu dosya yer tutucudur. **Tarih, tutar ve çağrı kuralları verilmemiştir** ve uydurulmamıştır. Başvuru çağrısının güncel kılavuzunu ve kurumunuzun kurallarını kontrol edip doldurun. TÜBİTAK 2209-A başvuru aşamasındadır.

## 1. İş paketleri (sıra ve bağımlılık)

| # | İş | Çıktı | Önkoşul | Süre [DOLDUR] |
|---|---|---|---|---|
| 1 | Karar toplantısı (danışman) | [KARAR] listesi kapanır: örneklem, model, ön kayıt, ölçek, şirket adları | — | |
| 2 | Barındırma kurulumu ve gerçek cihaz testi | Firebase canlı, `GERCEK_CIHAZ_TESTI.md` tamam | 1 | |
| 3 | Pilot (10-12 kişi) | Maruz kalma, süre, tamamlama ölçülür; plan güncellenir | 2, pilot etik kapsamı | |
| 4 | Etik kurul başvurusu | Onay numarası | 1 | |
| 5 | Uygulamayı dondur, ön kayıt | OSF kaydı | 3, 4 | |
| 6 | Ana veri toplama | Hedef n ya da son tarih | 5 | |
| 7 | Analiz ve rapor | `analiz/` çıktısı, yazı | 6 | |
| 8 | Paylaşım | Poster/bildiri, katılımcı özeti | 7 | |

**Kritik yol:** 4 (etik onay süresi bilinmiyor) ve 6 (haftalık katılım hızı bilinmiyor; pilot ve ilk hafta belirler). İkisi de takvimi uzatabilir; yer tutucu tarih verme, aralık ver.

## 2. Takvim (hafta sayıları; tarihleri doldur)

| Dönem | Hafta | Not |
|---|---|---|
| Kararlar + kurulum | [DOLDUR] | |
| Pilot | [DOLDUR] | Etik onay bekleniyorsa pilot kapsam dışı kalabilir; kurula sor |
| Etik onay | [DOLDUR] | Kurul toplantı takvimine bağlı |
| Ön kayıt | 1 | Onaydan sonra, veri toplamadan önce |
| Veri toplama | [DOLDUR] | Hedef n ve kayıp varsayımı `KATILIMCI_TOPLAMA_PLANI.md` içinde |
| Analiz ve yazım | [DOLDUR] | |

## 3. Bütçe kalemleri (tutarlar boş)

| Kalem | Gerekli mi | Not | Tutar |
|---|---|---|---|
| Barındırma (Firebase) | Evet | Ücretsiz katman yeterli mi, kota denetlenmeli; yurt dışı aktarım KVKK görüşü ayrı | [DOLDUR] |
| Alan adı | Belki | Tanıtım sayfası için | [DOLDUR] |
| Poster baskısı | Evet | Poster ve QR (kart kalktı: katılımcı ortak bağlantıyla girer); yuva listesi hedef n'den fazla üretilir (ör. +%20) | [DOLDUR] |
| Test cihazları / erişim | Belki | Gerçek cihaz testi için | [DOLDUR] |
| Katılımcı ödülü | **[KARAR]** | Yoksa 0; varsa kimlikten ayrı mekanizma, etik görüş | [DOLDUR] |
| Yazılım (analiz, sunum) | Hayır | Python ve açık kaynak araçlar | 0 |
| Yayın / kongre | Belki | Başvuru çağrısı bu kalemi kapsıyor mu kontrol et | [DOLDUR] |

## 4. Riskler ve yedek planlar

| Risk | Etki | Yedek |
|---|---|---|
| Etik onay gecikir | Her şey kayar | Takvimi etik onaya göre kur; pilotu başvuruyla birlikte iste |
| Katılımcı bulunamaz | Hedef n'ye ulaşılmaz | Kanalları çeşitlendir; hedefe ulaşılmazsa ulaşılan n ve güç raporlanır (ön kayıtta yazılı) |
| Pilot tasarımın zayıf olduğunu gösterir | Uygulama ya da örneklem planı değişir | Seçenek A (güçlendirilmiş tasarım) hazır; uygulamada değişiklik ve test gerekir |
| Teknik hata canlıda çıkar | Veri kaybı ya da bozulma | Gerçek cihaz testi ve pilot; ana veri tek sürümden; yedek CSV |
| Sonuç anlamlı çıkmaz | "Başarısız" izlenimi | Ön kayıt güven aralığıyla yorumlanır; bu da bilimsel sonuç |
