# İlk Lot: pilot planı (10-12 kişi)

**Amaç:** Ana çalışmadan önce dört şeyi ölçmek: (1) A grubunun ne kadarı simülatörde bekleme ekranını görüyor (güç hesabının en belirsiz varsayımı, %70 varsayıldı), (2) oturum gerçekte kaç dakika sürüyor, (3) katılımcı nerede takılıyor, (4) teknik hata var mı.

**Pilot bir hipotez testi değildir.** 10-12 kişiyle müdahale etkisi hakkında hiçbir şey söylenemez; pilot verisinde etkiye bakma. Pilot verisi ana analize girmez; pilot kodlarını [DOLDUR: kod aralığı] ayrı bir listeyle işaretle.

## Pilottan önce (hepsi tamam olmadan başlama)

- [ ] **Sarı yer tutucu kalmadı.** Panel → "Onam metni" bölümü "Tüm onam alanları dolu" demeli (kurum, etik onay, saklama, barındırma, **destek birimi**, iletişim).
- [ ] **Gerçek Firebase'de yayında.** Site `https://ilk-lot-pilot.web.app` (ya da karar paketi madde 1'in sonucuna göre yeni proje); `main` dalına her gönderim otomatik yayınlanır. Bağlantı kurulamazsa uygulama "Bağlantı kurulamadı" der; yerel/örnek veri kipi **yoktur**.
- [ ] **Karar paketi kapandı:** özellikle madde 1 (konum/KVKK), madde 2 (onam v2, silme politikası), madde 3 (anonim/takma adlı ifadesi). Onam metni değiştiyse `CONSENT_VERSION` ve etik onay güncel.
- [ ] **Gerçek cihaz protokolü** (`docs/GERCEK_CIHAZ_TESTI.md`) uygulandı, hiçbir satır ✗ değil; Sistem testi (panel → "Sistem testini çalıştır") her test cihazında ✓, sonuçlar kopyalanıp saklandı.
- [ ] **Etik onay pilotu da kapsıyor mu?** [DOLDUR] Uygulama içi 3 soruluk geri bildirim formunu (aşağıda) da kapsadığından emin ol.
- [ ] **Pilot formu açık:** `public/src/constants/app-config.js` içinde `CONFIG.pilot: true`, `python firebase/dagit.py --pilot` (HATA yok). Ana veri toplamada bu `false` olmalı.
- [ ] **Yuva listesi hazır ve temiz:** Önceki denemelerin kayıtları panelden **Test kayıtları** ile işaretlendi (silinmez; analizden çıkar); pilot için yeterli büyüklükte (12 kişi + yedek) **yeni liste** oluşturuldu (panel → Randomizasyon listesi → Yeni liste). Tüketilen yuvalar geri verilmez.
- [ ] **Yedek alışkanlığı:** Panel → **Tam yedek (JSON)** denendi; pilot boyunca ve sonunda alınacak.
- [ ] **Güç hedefi hâlâ açık.** Pilot, ON_KAYIT_TASLAGI.md'deki "Örneklem yolu" kararını netleştirmek için yapılır; karardan önce kayıt yapma.

## Örneklem ve cihaz çeşitliliği

6 A + 6 B (blok randomizasyonla). Cihazlar:

| Gerekli | En az |
|---|---|
| iPhone, Safari | 3 |
| Android, Chrome | 3 |
| Düşük donanımlı / eski telefon | 1 |
| Uygulama içi tarayıcı (WhatsApp ya da Instagram'dan açılan bağlantı) | 2 |
| Koyu mod açık | 1 |
| Küçük ekran (≈ 5 inç) | 1 |

Kişileri gerçek hedef kitleden seç (üniversite öğrencisi, borsa bilgisi az olanlar dahil). Tanıdık olanlar da olabilir; ama "anlaşılmıyor" demekten çekinmeyecek kişiler olsun.

## Uygulama

1. Katılımcı kendi telefonunda, **ortak bağlantı ya da QR** ile girer (panel → Katılım bağlantısı); kod ya da kart yoktur, onamdan sonra sıradaki yuvayı otomatik alır (grubunu sen de seçmezsin, görmezsin). Sen yanında sessizce gözlersin. Katılımcıya "tek sekme, aynı tarayıcı; tarayıcı verisini silme" de.
2. **İki kişide yüksek sesle düşünme:** "Ne düşündüğünü söyleyerek ilerle." Müdahale etme, yönlendirme.
3. Gözlem notu (süre uygulamadan otomatik gelir): nerede durakladı, neyi yanlış anladı, neye güldü / sıkıldı / kaşlarını çattı.
4. Bilgilendirme ekranının **sonunda**, uygulama içinde 3 isteğe bağlı soru çıkar (yalnızca pilot yayınında): ilk dakikada anlama (1-5), süre algısı, rahatsızlık/gerginlik. Yanıtlar CSV'ye (`pilot_clear`, `pilot_duration`, `pilot_unease`) gider ve `ilklot_pilot.py` raporuna girer; aşağıdaki 1. ve 3. sorunun kaba karşılığıdır, **açık uçlu cevap yerine geçmez**.
5. Bilgilendirme ekranından **sonra**, uygulama dışında 7 soru:
   1. Ne yapman gerektiğini ilk dakikada anladın mı? (1-5)
   2. Hangi kelime ya da ekran anlaşılmadı? (açık uçlu)
   3. Toplam süre sana nasıl geldi? (çok kısa / uygun / uzun / çok uzun)
   4. Simülatörde ekrana bir bekleme geldi mi? O sırada ne düşündün? *(sadece pilot katılımcısına, bilgilendirmeden sonra sorulur)*
   5. Simülatör sana gerçek bir piyasa gibi geldi mi? (1-5) Neden?
   6. En gergin hissettiğin an hangisiydi?
   7. Yavaşlama, donma, ekranda kayma ya da başka teknik sorun gördün mü?

## Analiz

```
python analiz/ilklot_pilot.py KATILIMCI.csv --olaylar OLAYLAR.csv --cikti pilot_raporu.md
```

Rapor süreyi, maruz kalma oranını (güven aralığıyla), anlama ve dikkat kontrolünü, taban davranışı ve teknik hataları özetler; "Karar tablosu" aşağıdaki eşiklere göre **İNCELE** işaretler koyar. Sonda, ölçülen değerlerle çalıştırılacak güncel güç komutları verilir (ölçülen ve güven aralığının alt sınırıyla).

## Karar kuralları

| Ölçüt | Eşik | Karar |
|---|---|---|
| Bekleme ekranını gören A oranı | < %60 | Tasarımı güçlendir (ON_KAYIT_TASLAGI.md, Seçenek A) |
| | %60-80 | Sınırda; güncel güç tablosuna bak, iki senaryoyla karar ver |
| | ≥ %80 | Mevcut tasarım yeterli olabilir |
| Medyan süre | > 40 dk | Kısalt (tanıtım adımları, simülatör) |
| | 35-40 dk | Sınırda |
| Tamamlama | < %80 | Nedenleri görüşmelerle araştır |
| Anlama kontrolü (ilk denemede ≥ 2 doğru) | < %80 | Tanıtım ve alıştırma metinlerini sadeleştir |
| Müdahaleyi fark etme (ekranı görenlerin "gördüm" demesi) | < %60 | Bekleme ekranı belirgin değil ya da soru anlaşılmıyor |
| Taban panik satış oranı | < 0,15 ya da > 0,85 | Tavan/taban etkisi; uyaran zorluğunu ayarla |
| Dikkat kontrolü | < %85 | Talimat ya da test uzunluğu sorunlu |
| Tarayıcı hatası | herhangi | Olay dosyasında `client_error` satırlarına bak |

## Küçük örneklem uyarısı

6 A katılımcısıyla %60 maruz kalma, gerçekte %23 ile %88 arasında herhangi bir değer demek olabilir. Bu yüzden tek bir sayıya bakıp karar verme: hem ölçülen hem alt sınır senaryosunda güç hesabını çalıştır. Pilot, "bu varsayım korkunç derecede yanlış mı?" sorusunu cevaplar, "tam olarak kaç?" sorusunu değil.

## Pilot sonrası

**Sıra önemli (pilot verisini kaybetme):**
1. Panelden önce **Katılımcı özeti** ve **Tüm olaylar** CSV'lerini indir ve `ilklot_pilot.py` raporunu üret. (Test olarak işaretlenen kayıtlar CSV'lere girmez; işaretlemeden **önce** indir.)
2. Panelden **Tam yedek (JSON)** al; pilot verisinin tam kopyasıdır (çekilmiş ve test kayıtları dahil). Dosya grup bilgisi içerir, paylaşma; pilot verisini ayrı klasörde sakla, ana analize karışmasın.
3. Pilot kayıtlarını panelden **Test kayıtları → işaretle** (silinmez; ana analizden ve dışa aktarmadan çıkar). Ana toplama için **yeni yuva listesi** oluştur; pilotta kullanılan yuvalar geri verilmez.

- **`CONFIG.pilot: false` yap** ve `APP_VERSION`'ı artır (`public/src/constants/app-config.js`); ana veri toplama formsuz sürümle yapılır (`python firebase/dagit.py`, `--pilot` olmadan, form açıksa HATA verir).
- **"Yeni katılım başlat" seçeneğini kapat:** `public/src/constants/ui-constants.js` içinde `ALLOW_FRESH_START_AFTER_WITHDRAWAL = false` (karar paketi madde 17: pilota kadar açık). Açık kalırsa aynı ön kontrol (`--pilot` olmadan) HATA verir; çünkü çekilen kişi yeniden katılırsa aynı kişi iki kez sayılabilir ve bağ tutulmadığı için analizde ayıklanamaz.
- Uygulamada **herhangi bir değişiklik** yaparsan `APP_VERSION`'ı artır; testleri koş (`npm run lint`, `npm run check:*`, `python testler/arac_testleri.py`, `python testler/ekran_testleri.py`, kural testleri); `main`'e gönderince site otomatik yayınlanır. Ana veri tek sürümden gelmeli.
- Ön kayıt, **bu değişikliklerden sonra**, ardından `python firebase/dagit.py --kilitle` ile ölçüt ayarlarını kilitle.

## Pilot raporu şablonu

`pilot_raporu.md` (üretilen rapora ek) şu başlıklarla yazılır; **hipotez testi yapma**, yalnızca uygulanabilirliği raporla:

| Bölüm | İçerik |
|---|---|
| 1. Özet | Kaç kişi, kaç A/B, hangi tarihler, uygulama sürümü (`APP_VERSION`), tek cümlelik sonuç |
| 2. Katılımcılar ve cihazlar | Cihaz/tarayıcı tablosu (iPhone Safari, Android Chrome, eski telefon, uygulama içi tarayıcı, koyu mod, küçük ekran) ve her cihazın gerçek cihaz protokolü sonucu |
| 3. Ölçülenler | Medyan süre ve dağılım, tamamlama oranı, bekleme ekranını gören A oranı (güven aralığıyla), anlama kontrolü (ilk denemede ≥ 2 doğru), dikkat kontrolü, taban panik satış oranı |
| 4. Karar kuralları | Yukarıdaki tablonun her satırı için ölçülen değer, eşik, karar (geç/sınırda/değiştir) |
| 5. Gözlem ve görüşmeler | Nerede takıldı/duraksadı, anlaşılmayan kelime ve ekranlar, uygulama içi 3 soru ve 7 görüşme sorusunun özeti |
| 6. Teknik sorunlar | `client_error` olayları, bağlantı/kuyruk sorunları, yuva ve oturum sorunları (aynı kişi iki kez, tarayıcı verisi silme vb.), panel sorunları |
| 7. Erişilebilirlik | Otomatik axe sonucu, elle denenen klavye/ekran okuyucu (D bölümü), bekleme ekranının ekran okuyucuyla davranışı |
| 8. Güç hesabı | Ölçülen ve güven aralığı alt sınırıyla çalıştırılan güç komutlarının çıktısı |
| 9. Yapılacak değişiklikler | Uygulama/metin/örneklem değişiklikleri; her biri için etki (sürüm, test, etik onay, ön kayıt) |
| 10. Karar | Pilot ana çalışmaya geçişi için "devam / değiştirip devam / tekrarla" ve gerekçe |
