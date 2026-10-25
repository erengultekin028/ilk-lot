# Onam metni değişiklik ÖNERİSİ: silme politikası A (tamamen soft delete)

**Durum: ÖNERİ. Uygulamaya KONMADI.** Uygulamadaki onam metinleri (`consentSections()`, `CONSENT_VER = v1`) ve `etik/` altındaki metinler aynen duruyor. Bu belge, politika A seçildiği için hangi cümlelerin uyuşmaz hale geldiğini ve önerilen yeni ifadeleri listeler. Danışman ve etik kurul onayından sonra, kullanıcı "uygula" derse metinler değiştirilir, `CONSENT_VER` `v2` olur ve `etik/materyalleri_uret.py` yeniden çalıştırılır.

## Neden gerekli
Kurallar ve panel artık hiçbir kaydı silmiyor. Çekilen katılımcının kaydı `withdrawn: true` + `withdrawnAt` ile işaretlenir, dışa aktarmadan ve analizden çıkar; ham kayıt veritabanında kalır. Mevcut metinler ise "verilerin silinir" diyor. **Bu iki şey şu an çelişiyor; çelişki giderilmeden gerçek katılımcıyla kullanılmamalı** (pilot dahil).

## Değişmesi gereken yerler ve öneriler
| # | Yer | Şimdiki ifade | Önerilen ifade |
|---|---|---|---|
| 1 | Onam, özet (`05_entry.js` satır 18 ve `etik/onam_metni_v1.txt` satır 8) | "istediğin an gerekçe göstermeden çekilebilirsin ve verilerin silinir." | "istediğin an gerekçe göstermeden çekilebilirsin; verilerin analizden çıkarılır." |
| 2 | Onam, özet kartı (`05_entry.js` satır 25) | "İstediğin an, gerekçe göstermeden çekilebilirsin; verilerin silinir." | "İstediğin an, gerekçe göstermeden çekilebilirsin; verilerin analize dahil edilmez." |
| 3 | Onam, ayrıntı: çekilme (`05_entry.js` satır 16, `etik/onam_metni_v1.txt` satır 40) | "Çalışma sırasında sağ üstteki ⋯ menüsünden "Çalışmadan çekil, verilerimi sil" diyebilirsin. … Çekilirsen bu koda ait veriler analizden çıkarılır ve silinir." | "… ⋯ menüsünden "Çalışmadan çekil" diyebilirsin. … Çekilirsen bu koda ait veriler analizden çıkarılır ve hiçbir analizde, tabloda ya da yayında kullanılmaz. Kimliksiz ham kayıt, araştırma verisi saklama süresi ([DOLDUR: süre]) dolana kadar güvenli sunucuda tutulur ve süre sonunda silinir." |
| 4 | Onam, ayrıntı: haklar (`05_entry.js` satır 14, `etik/onam_metni_v1.txt` satır 32) | "KVKK kapsamında verilerine erişme, düzeltilmesini ve silinmesini isteme haklarını … başvurarak kullanabilirsin." | **[KARAR]** Danışman ve KVKK birimiyle netleştirilecek: veri kimliksiz (rastgele kod) olduğundan, silme talebinin nasıl karşılanacağı (yalnızca analizden çıkarma mı, Firebase konsolundan manuel silme mi) ve bu hakkın metinde nasıl anılacağı. |
| 5 | Çekilme onay penceresi (`07_app.js` satır 258) | "Çalışmadan çekil" / "Bu koda ait tüm verilerin analizden çıkarılacak ve silinecek. … " düğme: "Çekil ve sil" | "Bu koda ait tüm verilerin analizden çıkarılacak. Bu kodla tekrar giriş yapamayacaksın." düğme: "Çekil" |
| 6 | Çekildin ekranı, bulut modu (`05_entry.js` satır 41) | "Verilerin analize dahil edilmeyecek ve araştırmacı tarafından kalıcı olarak silinecek." | "Verilerin analize dahil edilmeyecek." |
| 7 | ⋯ menüsündeki düğme adı | "Çalışmadan çekil, verilerimi sil" (onam metninde geçen ad) | "Çalışmadan çekil" (menüdeki gerçek düğme metni kontrol edilecek) |
| 8 | Etik başvuru taslağı (`etik/ETIK_KURUL_BASVURU_TASLAGI.md` satır 108) | "Araştırmacı panelden "Çekilenlerin verisini kalıcı sil" …" | Kalıcı sil düğmesi kalktı; çekilen kayıt işaretli kalır, analizden çıkar. |
| 9 | Veri yönetim planı (`docs/VERI_YONETIM_PLANI.md` satır 15, 17) | "araştırmacı 'Çekilenlerin verisini kalıcı sil' der" | Çekilme: kayıt işaretlenir ve analizden çıkar. Silme: yalnızca saklama süresi sonunda, Firebase konsolundan (kurallar uygulama üzerinden silmeye izin vermez) ve tarih/kişi notuyla. |
| 10 | TÜBİTAK yöntem bölümü (`docs/TUBITAK_YONTEM_BOLUMU.md` satır 85) | "… istediği an gerekçesiz çekilebilir ve verisi silinir." | "… verisi analizden çıkarılır." |

## Bilinmesi gerekenler
- **Süre sonunda silme hâlâ mümkün ama uygulama dışından:** Güvenlik kuralları uygulamadan gelen silmeyi engeller; proje sahibi Firebase konsolundan koleksiyon ya da projeyi silebilir. Saklama süresi bitince ham verinin silinmesi bu yolla yapılmalı.
- **Demo/yerel mod değişmedi:** Yerel modda (veri yalnızca katılımcının cihazında) çekilme kendi cihazındaki kaydı siler. Bu, araştırma verisi değildir; gerçek çalışmada bulut modu kullanılır.
- **Bu metnin onaylanması danışmana ve etik kurula aittir.** Hukuki görüş değildir.

## b27 notu: kodla giriş kalktı (25.10.2026)
Katılımcılar artık kart ve kod kullanmıyor: onamdan sonra anonim girişle sıradaki yuvayı otomatik alıyor. Onam metnindeki "verilerin yalnızca sana verilen rastgele bir kodla eşleşir" cümlesi hâlâ doğru (kodu sistem atıyor). Metinde ya da etik başvuruda **kart**, **QR kartı** ya da **kodunu yaz** anlamına gelen ifadeler varsa (özellikle `etik/ETIK_KURUL_BASVURU_TASLAGI.md`, `docs/KATILIMCI_TOPLAMA_PLANI.md`, `docs/VERI_YONETIM_PLANI.md`, `tanitim.html`, poster) güncellenmeli. Yeni risk: aynı kişi farklı tarayıcıdan tekrar katılırsa yeni yuva alır (pilotta izlenmeli); etik kurula "katılımcı kimliksiz, anonim Firebase oturumu" olarak bildirilebilir.
