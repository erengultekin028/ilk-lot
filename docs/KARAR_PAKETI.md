# İlk Lot: karar paketi (danışmanla ve etik/KVKK birimiyle kapatılacaklar)

> Bu belge, pilot ve ana veri toplamadan önce **sizin** vermeniz gereken kararları tek yerde toplar. Her satırda seçenekler, bir öneri ve kararın neyi etkilediği yazılıdır. Hukuki görüş değildir; KVKK ve etik kurul ifadeleri kurumunuzun birimlerince doğrulanmalıdır. Kodda hiçbir şey, ilgili karar verilmeden değiştirilmez.

Durum: ☐ açık · ☑ kapandı (kapanınca tarih ve kararı yaz)

| # | Karar | Seçenekler | Öneri | Neyi etkiler | Durum |
|---|---|---|---|---|---|
| 1 | **Firestore konumu / yurt dışı aktarım** | (a) Mevcut: nam5 (ABD). (b) AB çok bölgeli (eur3) ya da bir AB bölgesi: yeni Firebase projesi gerekir, çünkü konum sonradan değişmez. (c) Üniversitenin kendi sunucusu (Firebase dışı): ayrı mimari, büyük iş | **Ayrıntı ve taşıma planı: `docs/KONUM_VE_KVKK_KARARI.md`.** Önce KVKK birimine oradaki soru listesini sor. Not: Türkiye'de Firestore bölgesi yok; **AB bölgesi de "yurt dışı"dır** ve **Firebase Authentication yalnızca ABD'de çalışır**, yani (b) aktarımı kaldırmaz, yalnızca araştırma verisini AB'de tutar. Konum sonradan değişmez; gerçek veri yokken taşıma en ucuz zamandır | Onam ve etik metni ("verilerin saklandığı yer"), `CONFIG.consentInfo.hosting`, veri yönetim planı. (b) seçilirse benim yapacağım iş: yeni proje, yapılandırma, kurallar, yayın hattı, yeni araştırmacı hesabı | ☐ |
| 2 | **Silme politikası ve onam v2** | (A) Soft delete: kayıt silinmez, `withdrawn` ile analiz dışı kalır (şu an uygulanan). (B) Talep üzerine kalıcı silme prosedürü | A + onam metnini buna uydur. Mevcut onam "verilerin silinir" diyor ve **A ile çelişiyor** | Onam metni, çekilme ekranı, `CONSENT_VERSION` (v2), etik başvuru. Taslak: `etik/ONAM_V2_TASLAGI.md` | ☐ |
| 3 | **Anonim ya da takma adlı** | Veriyi "kimliksiz/anonim" mi, "takma adlı" mı tanımlayacaksınız | Takma adlı (tarayıcıya bağlı anonim kimlik `users/{uid}` içinde tutuluyor) ve onamda dürüstçe yaz | Onamdaki "Kimliksiz" kutusu, etik başvuru 6. bölüm | ☐ |
| 4 | **Satır düzeyinde veri paylaşımı** | Yok / yalnızca kod ve betik / anonim satır düzeyinde veri | Önce kod ve betik; veri paylaşımı onam metninde yazıyorsa ve etik onay varsa | Onam metni, `docs/VERI_YONETIM_PLANI.md` bölüm 3 | ☐ |
| 5 | **Saklama süresi** | Etik kurul ve KVKK birimi belirler | Ben süre önermem | `etik/saklama_takvimi.py` hatırlatmaları, onam | ☐ |
| 6 | **Katılımcı ödülü** | Yok / var (kimlikten ayrı mekanizma) | Etik kurulun görüşünü al; ödül kimliğe ve koda bağlanmamalı | Bütçe, onam, toplama planı | ☐ |
| 7 | **Katılım kanalları** | Sınıf oturumu, kampüs standı, duyuru, çevrimiçi | Ağırlık kampüs standı ve sınıf oturumu | Hedef n, hız. Not: ortak bağlantı herkese açıktır, yuva sayısı kadar katılım olur | ☐ |
| 8 | **Örneklem yolu** | Grup başına ~60 / ~100 | Güç analizi çıktılarına göre danışmanla | Yuva listesi büyüklüğü, süre, ön kayıt | ☐ |
| 9 | **TOST sınırı ve ana model** | Ön kayıt taslağındaki seçenekler | Danışmanla | Ön kayıt, analiz betikleri | ☐ |
| 10 | **Panik satış tanımı** | "Sert düşüş + zarar" anlarında satış (mevcut) | Mevcut tanımı ön kayda aynen yaz | Ön kayıt, analiz | ☐ |
| 11 | **Ön kayıt zamanı** | OSF; pilottan sonra, ana toplamadan önce | Etik onaydan sonra, uygulamayı dondurduktan (`--kilitle`) sonra | Zaman damgası, bilimsel güvence | ☐ |
| 12 | **`[DOLDUR]` alanları** | `CONFIG.consentInfo` (denetleyen, etik, saklama, barındırma, destek, iletişim) | Etik onay numarası ve iletişim adresi netleşince | Onam ekranı (şu an sarı işaretli) | ☐ |
| 13 | **Lisans** | Kod: MIT/Apache-2.0 gibi; metin ve belgeler: CC-BY gibi; ya da "tüm hakları saklıdır" | Açık kaynak görünümü için kod lisansı + DOI | `LICENSE`, `CITATION.cff` (yazar adı ve kurum gerekli) | ☐ |
| 14 | **Araştırmacı hesabı güvenliği** | Tek e-posta; iki faktörlü doğrulama, hesap kimde | 2FA aç, hesabı danışmanla yedekle | `firebase/firestore.rules` e-posta listesi | ☐ |
| 15 | **Yeni ölçüm eklemek** (ör. `stress_sell`) | Evet / hayır | Ön kayıttan önce karar, sonra dondur | Veri sözleşmesi, ön kayıt | ☐ |
| 16 | **Sonuçların katılımcıyla paylaşılması** | Söz verilir / verilmez | Söz verilecekse tarih gerçekçi olsun; onam metni değişir | Onam, bilgilendirme | ☐ |
| 17 | **Çekilen katılımcı "Yeni katılım başlat" ile yeniden girebilsin mi** (b36'da **açık**, sen isteyince eklendi) | (a) Açık: çekilen kişi onamdan yeniden başlar, ayrı kimlik ve ayrı yuva alır (şu an). (b) Kapalı: çekilen kişi bir daha giremez | Pilot ve testte (a) kolaylık sağlar; **ana veri toplamada (b)'yi düşün**: aynı kişi iki kez katılabilir, bağ tutulmadığı için analizde ayıklanamaz, yuva tüketir. 18 yaş altı kayıtlarda seçenek hiçbir zaman görünmez. Tek satır: `ALLOW_FRESH_START_AFTER_WITHDRAWAL` (`public/src/constants/ui-constants.js`) | Veri toplama bütünlüğü, yuva sayısı, onam ("tekrar katılım" ifadesi) | ☑ **28.10.2026: pilota kadar AÇIK; ana veri toplamadan önce kapatılacak.** `python firebase/dagit.py` (`--pilot` olmadan) açıkken HATA verir, yani ana toplamada unutulamaz. Açık bırakmaya karar verirsen bu satırı ve o denetimi güncelle |

## Kararlar kapanınca benim yapacaklarım
- 1(b): yeni Firebase projesi (AB), yapılandırma, kurallar, yayın hattı, deneme ve eski projenin kapatılması.
- 2: onam v2 metni, çekilme metinleri, `CONSENT_VERSION` ve sürüm kaydı (onayınla).
- 12: `[DOLDUR]` alanlarının işlenmesi ve `python firebase/dagit.py` ön kontrolü.
- 13: `LICENSE`, `CITATION.cff` ve Zenodo bağlantısı.
- 11 sonrası: `python firebase/dagit.py --kilitle`.
