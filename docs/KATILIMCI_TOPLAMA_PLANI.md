# İlk Lot: katılımcı toplama planı (taslak)

> `[DOLDUR]` ve `[KARAR]` yerlerini sen ve danışmanın kapatmalısın. Sayılar `docs/ON_KAYIT_TASLAGI.md` ve `docs/PILOT_PLANI.md` ile aynı varsayımlara dayanır; ölçülmüş değil, varsayılmıştır (özellikle %10 kayıp).

## 1. Kaç kişi gerekli

| Yol | Tamamlayan (grup başına) | Kayıp varsayımı | İşe alım (toplam) |
|---|---|---|---|
| Seçenek A (güçlendirilmiş tasarım) | 60 + 60 | %10 | ≈ 134 |
| Seçenek B (mevcut tasarım) | 100 + 100 | %10 | ≈ 224 |

- İşe alım = tamamlayan ÷ (1 − kayıp). Kayıp %20 çıkarsa A için ≈ 150, B için ≈ 250 kişi gerekir.
- **Gerçek kayıp bilinmiyor.** Pilot tamamlama oranını ölçer; ana plan o sayıyla yeniden hesaplanır.
- Kartlar, işe alım sayısından **fazla** basılmalı (ör. +%20), ama dağıtım sırası bozulmamalı (aşağıda).
- Durdurma kuralı sabittir: hedef tamamlayan sayısı ya da [DOLDUR: son tarih]. Ara analiz yapılmaz.

## 2. Kimi alıyoruz

- 18 yaş ve üzeri üniversite öğrencisi, akıllı telefonu olan.
- Borsa bilgisi az olanlar da, çok olanlar da dahil. Yalnızca "yatırım yapanları" çağırma; örneklem yatırımcı kulübüne kayar ve genç yatırımcı yerine ilgili öğrencileri ölçersin.
- **Bağımlılık:** Araştırmacının ders verdiği, not verdiği ya da danışmanlığını yaptığı öğrenciler alınmaz. **[KARAR]** Bu politikayı etik başvuruya aynen yaz.
- Aynı kişi bir kez katılır. Kod aynı kişiye ikinci kez verilmez. Yine de aynı kişinin ikinci kez girmesi kodlardan anlaşılamaz; bunu sınırlılık olarak yaz.

## 3. Nereden ve nasıl

| Kanal | Artısı | Eksisi |
|---|---|---|
| Sınıfta toplu oturum (ders hocasının izniyle) | Hızlı, düşük kayıp; tek ortak bağlantı/QR yeterli | Baskı hissi; aynı sınıf birbirine anlatır (bulaşma); hoca iznine bağlı |
| Kampüs standı / koridor (poster + QR) | Gönüllülük net; kişiler dağınık | Yavaş; telefonla 30 dk durmayı kabul edenler seçilir |
| Duyuru (öğrenci toplulukları, kulüpler) | Geniş erişim; tek ortak bağlantı | Yatırım ilgisi olanlara kayar; bağlantı serbestçe yayılabilir (yuva listesi bitince katılım kapanır) |
| Çevrimiçi (ortak bağlantı mesajla gönderilir) | Kolay erişim | Bağlantıyı herkes açabilir; yuva sayısı kadar katılım olur, davetli olmayanlar yuva tüketir; kişi tamamlamayabilir |

**[KARAR]** Hangi kanallar? Önerim: ağırlığı kampüs standı ve sınıf oturumuna ver, çevrimiçi duyuruyu yalnız yedek olarak kullan; kanalı oturum başına not al (kimlik tutmadan), analizde betimsel rapor edilir.

## 4. Yuva ataması ve randomizasyon bozulmasın

- Yuva listesi önceden 4'lük bloklarda (2 A + 2 B) rastgele üretilir (yönetim paneli → "Yeni liste"); grup yuvanın içinde saklıdır, katılımcıya görünmez.
- Katılımcı kod ya da kart almaz: **tek ortak bağlantı/QR** ile girer, onamdan sonra **sıradaki boş yuvayı** otomatik alır (Firebase anonim giriş). Grubunu seçemez, sen de seçtiremezsin.
- Liste biterse yeni liste oluştur; mevcut yuvalar korunur. Sırayı bozacak elle müdahale yok: yuva alma tek bir veritabanı işlemidir.
- **Pilot ve denemelerde tüketilen yuvalar geri verilemez.** Ana toplamaya geçmeden önce deneme kayıtlarını panelden "test kaydı" olarak işaretle, sonra yeni liste oluştur.
- **[KARAR]** Kim hangi yuvayı aldı **kaydedilmez** (anonimlik için); tutulan tek bağ tarayıcıya bağlı anonim kimliktir (`docs/VERI_YONETIM_PLANI.md` bölüm 2).
- Tarayıcı verisini silen ya da başka tarayıcıdan giren kişi yeni yuva alır ve aynı kişi iki kez sayılabilir; menüde uyarı yazılı, pilotta gözle.

## 5. Ödül

**[KARAR]** Ödül var mı? Yoksa "yok" yaz. Varsa:
- Kimliğe bağlı olmamalı: ödül formu çalışma verisinden **ayrı** olmalı ve kodla bağlanmamalı.
- Ödülün büyüklüğü katılımı yönlendirir (ilgisiz kişileri çeker, baskı yaratabilir). Etik kurulun görüşünü al.
- Karar kartı ve sonuç özeti ödül yerine geçmez, ama merak çekici olabilir; sonuçları paylaşma sözü verilecekse tarihi gerçekçi olsun (bkz. `docs/OZET_1_SAYFA.md`).

## 6. Riskler

| Risk | Ne olur | Önlem |
|---|---|---|
| **Seçilim** | Telefonla 30 dk ayırmaya gönüllü olanlar ilgili ve bilgili olur; sonuç genç yatırımcılara genellenmez | Kanalı çeşitlendir, ön test puanı ve deneyim betimsel rapor edilir, sınırlılıkta yaz |
| **Bulaşma** | Katılan, bekleme ekranını arkadaşına anlatır; B grubundaki kişi amacı öğrenir | Oturumları kısa sürede yürüt; sözlü olarak "henüz katılmamış kişilere amacı anlatma" ricası (uygulamada "başkalarına anlatma" notu yalnızca bilgilendirmeden sonraki karar kartı bölümünde var; bilgilendirme metninin kendisinde yok. Metne eklemek uygulama ve etik onay değişikliği gerektirir, **[KARAR]**); "araştırma neyi ölçüyordu?" cevabı duyarlılık analizinde zaten kullanılıyor |
| **Düşük tamamlama** | 30 dk uzun gelir, yarıda bırakılır | Pilot ölçer; süre kısalt ya da planı güçlendir |
| **Gruba göre farklı kayıp** | Bekleme ekranı sıkıcı bulunur ve A'dan daha çok kişi çıkar | Zaten raporlanıyor (Fisher), farklı kayıpta temkinli yorum |
| **Kart karışması** | Randomizasyon bozulur | Sıra kuralı (4. bölüm), atılan kartların ayrı listesi |
| **Baskı / gönüllülük** | Danışman ya da hoca öğrenciye "katıl" der | Öğrencinin kendi hocasıyla ilişkisini dışla; gönüllülüğü ilk ekranda vurgula |

## 7. Saha takvimi (taslak)

| Hafta | İş | Ölçüt |
|---|---|---|
| 0 | Pilot (10-12 kişi) | Maruz kalma, süre, tamamlama ölçülür; plan güncellenir |
| 1 | Etik onay, ön kayıt, uygulamayı dondur | `ON_KAYIT_TASLAGI.md` 5c listesi tamam |
| 2-[DOLDUR] | Ana veri toplama | Haftalık hedef: işe alım ÷ hafta sayısı = [DOLDUR] |
| Her hafta | Panelden katılım, grup dengesi, kayıp bakılır (sonuç değişkenleri bakılmaz) | Gruplar arası fark %10'u geçerse nedenini ara |
| Son | Sabit örnekleme ulaşıldı ya da son tarih | Veri toplama durur; CSV ilk kez analiz için açılır |

## 8. Şu an cevaplanamayanlar

- Hangi üniversite, hangi bölümler, kaç öğrenciye erişim var: [DOLDUR]
- Haftada kaç kişi toplanabilir: pilotla ve ilk ana haftayla netleşir. Takvim buna göre güncellenecek, şimdiki tarihler yer tutucudur.
