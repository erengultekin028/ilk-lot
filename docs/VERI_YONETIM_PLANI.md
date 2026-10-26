# İlk Lot: veri yönetim planı (taslak)

> Etik başvurudaki 6. bölümün (`etik/ETIK_KURUL_BASVURU_TASLAGI.md`) yaşam döngüsü özetidir; çelişirse başvuru belgesi ve kurumun KVKK birimi geçerlidir. `[DOLDUR]` ve `[KARAR]` yerlerini sen ve danışmanın kapatmalısın. Hukuki görüş değildir.

## 1. Yaşam döngüsü

| Aşama | Ne olur | Kim | Not |
|---|---|---|---|
| Toplama | Katılımcı kodu, grup, davranış, test, isteğe bağlı demografik, serbest metin tek alan (≤ 400 karakter) | Uygulama → Firebase | Ad, e-posta, öğrenci no toplanmaz |
| Barındırma | Firebase (Google): proje `ilk-lot-pilot`, Firestore konumu **nam5 (ABD)**, site Firebase Hosting | [DOLDUR: sözleşme] | Yurt dışı aktarım KVKK birimine danışılacak; AB bölgesine taşıma seçeneği `docs/KARAR_PAKETI.md` içinde |
| Erişim | Yalnızca araştırmacı hesabı | [DOLDUR: kimler] | Katılımcı grubunu değiştiremez, çekilmiş kaydı geri açamaz |
| Dışa aktarma | Panelden CSV (katılımcı ve olay) | Araştırmacı | **[KARAR]** Veri toplama bitmeden sonuç amacıyla açılmaz (ön kayıt taslağında bu karar bekliyor) |
| Yedek | Panelden **Tam yedek (JSON)** ve CSV dışa aktarımları, şifreli diskte iki kopya | [DOLDUR: kimde, nerede] | Veri toplama sırasında en az haftalık; bulutta ikinci kopya tutulacaksa yeri belirtilir |
| Temizlik | Serbest metin kişisel bilgi içeriyor mu diye gözden geçirilir, gerekirse silinir | Araştırmacı | Analizden önce yapılır |
| Çekilme | Katılımcı menüden çekilir (iki aşamalı onay). **Kayıt silinmez** (politika A, soft delete): `withdrawn: true` ile işaretlenir, analize ve dışa aktarmaya girmez, katılımcı geri açamaz | Katılımcı / araştırmacı | **[KARAR]** Kalıcı silme gerekirse süreci ve süresi onam v2'de yazılmalı (`etik/ONAM_DEGISIKLIK_ONERISI_A.md`) |
| Test kayıtları | Denemelerden kalan kayıtlar panelden "test kaydı" olarak işaretlenir (silinmez, geri alınabilir); analize girmez | Araştırmacı | Pilot ve ana toplamadan önce yapılır |
| Saklama | [DOLDUR: süre ve başlangıç tarihi] | Araştırmacı | `etik/saklama_takvimi.py` hatırlatma takvimi üretir; süreyi **o seçmez**, etik kurul ve KVKK birimiyle aynı olmalı |
| Silme | Süre sonunda ham veri silinir | Araştırmacı | Yalnızca kimliksiz toplu sonuçlar kalır |
| Paylaşım | Bkz. 3 | | |

## 2. Anonim mi, takma adlı mı

- Katılımcı kod girmez: Firebase **anonim girişle** sıradaki yuvayı alır. Kod rastgeledir, kişiyle eşleşmesi tutulmaz; ad, e-posta, öğrenci numarası toplanmaz.
- Yine de tamamen anonim demek zordur: `users/{uid}` kaydı, tarayıcıya bağlı anonim kimliği (uid) yuva koduna bağlar (aynı tarayıcının kaldığı yerden devam edebilmesi için). Bu kimlik bir **kişiyi değil bir tarayıcıyı** gösterir ve araştırmacıya kimlik bilgisi vermez, ama veri teknik olarak **takma adlıdır**. Onamdaki "kimliksiz" ifadesi ve etik başvuru bununla uyumlu olmalı. **[KARAR]**
- Yuva–kod–grup listesi yalnızca araştırmacıdadır; kim hangi yuvayı aldı eşleşmesi (kişi ↔ yuva) hiçbir yerde tutulmaz. Cihaz türü, ekran boyutu ve küçük gruplarda demografik birleşim yine de dolaylı belirleme riski taşır.
- Tarayıcı verisi silinirse ya da başka tarayıcıdan girilirse aynı kişi yeni yuva alır; kayıp yuva geri verilmez. Menüde katılımcıya uyarı yazılı.

## 3. Paylaşım ve açık bilim

| Seçenek | Ne paylaşılır | Risk | Gerek |
|---|---|---|---|
| Yok | Yalnızca makale ve toplu sonuçlar | Yok | Hiçbir şey |
| Kod ve analiz betiği | `analiz/` klasörü, tohum, sürüm numarası | Yok | Kurum kod politikası |
| Anonim satır düzeyinde veri | CSV (serbest metin ve kimlik riski taşıyan alanlar hariç) | Küçük hücrelerde dolaylı belirleme; **onamda yazmıyorsa paylaşılamaz** | Etik kurul ve onam metni değişikliği, [KARAR] |

Kod paylaşımı veri paylaşımı değildir; ikisi ayrı karar. Onam metni (`etik/onam_metni_v1.txt`) verilerin üçüncü kişilerle paylaşılmadığını ve sonuçların yalnızca kimliksiz ve toplu yayımlandığını söylüyor; **satır düzeyinde veri paylaşımı bununla uyuşmuyor**. Paylaşmak istersen önce onam metni ve etik onay güncellenir (uygulama sürümü ve `CONSENT_VER` değişir).

## 4. İhlal ve olay

- Hesap ya da cihaz ele geçirilirse: Firebase erişimini kapat, kimlik bilgilerini değiştir, CSV'leri sil ve yenisini indir.
- Kime bildirilir, ne zaman: [DOLDUR: kurumun KVKK birimi ve etik kurul prosedürü]
- Katılımcıya bildirim gerekiyorsa ona ulaşılamaz (kimlik yok); bu sınırlılık başvuruda yazılı olmalı.

## 5. Açık noktalar

- Barındırıcı günlüklerinde IP kalabilir; araştırma verisiyle eşleştirilmez ama ayar kontrolü [DOLDUR].
- Güvenlik kuralları (b27 sonrası): katılımcı yalnızca **kendi** yuvasına ait kaydı okur/yazar, grubunu değiştiremez, çekilmiş kaydı geri açamaz, test işaretini yazamaz; hiçbir kullanıcı hiçbir şeyi silemez; kayıtları listelemek ve olayları okumak yalnızca araştırmacı hesabındadır. 18 emulator testi GitHub Actions'ta çalışır (`firebase/kural_testleri`).
- Firebase kuruldu (`ilk-lot-pilot`), ama gerçek cihaz protokolü ve pilot henüz yapılmadı; bu plan o zaman doğrulanmalı.
- Araştırmacı hesabı tek e-postadır; iki faktörlü doğrulama ve hesabın kimde olduğu yazılmalı. **[DOLDUR]**
