# İlk Lot: pilot planı (10-12 kişi)

**Amaç:** Ana çalışmadan önce dört şeyi ölçmek: (1) A grubunun ne kadarı simülatörde bekleme ekranını görüyor (güç hesabının en belirsiz varsayımı, %70 varsayıldı), (2) oturum gerçekte kaç dakika sürüyor, (3) katılımcı nerede takılıyor, (4) teknik hata var mı.

**Pilot bir hipotez testi değildir.** 10-12 kişiyle müdahale etkisi hakkında hiçbir şey söylenemez; pilot verisinde etkiye bakma. Pilot verisi ana analize girmez; pilot kodlarını [DOLDUR: kod aralığı] ayrı bir listeyle işaretle.

## Pilottan önce (hepsi tamam olmadan başlama)

- [ ] **Sarı yer tutucu kalmadı.** Panel → "Onam metni" bölümü "Tüm onam alanları dolu" demeli (kurum, etik onay, saklama, barındırma, **destek birimi**, iletişim).
- [ ] **Gerçek modda çalışıyorsun.** `CFG.firebase` dolu ve kendi adresinde yayınlı (claude.ai içinde Firebase çalışmaz). Hızlı test modu bu durumda kilitlidir.
- [ ] **Sistem testi** (panel → "Sistem testini çalıştır") her test cihazında ✓; sonuçları kopyalayıp sakla. `docs/GERCEK_CIHAZ_TESTI.md` protokolünü uygula.
- [ ] **Etik onay pilotu da kapsıyor mu?** [DOLDUR] Uygulama içi 3 soruluk geri bildirim formunu (aşağıda) da kapsadığından emin ol.
- [ ] **Pilot formu açık, doğru dosyadan:** `kaynak/02_core.js` içinde `pilot:true`, derle, `python firebase/dagit.py --pilot` (HATA yok). Ana veri toplama dosyasında bu `false` olmalı.
- [ ] **Kartlar basıldı**, pilot kodları ayrı sırada.
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

1. Katılımcı kendi telefonunda, karttaki QR ile girer. Sen yanında sessizce gözlersin.
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

- **`pilot:false` yap** ve `APP_VERSION`'ı artır; ana veri toplama formsuz dosyayla yapılır (`python firebase/dagit.py`, `--pilot` olmadan, form açıksa HATA verir).
- Uygulamada **herhangi bir değişiklik** yaparsan `APP_VERSION`'ı artır (`kaynak/02_core.js`) ve yeniden derle (`python kaynak/derle.py`). Ana veri tek sürümden gelmeli.
- Ön kayıt, **bu değişikliklerden sonra** yapılır.
- Pilot verisini ayrı bir klasörde sakla; analiz betiği ona karışmasın.
