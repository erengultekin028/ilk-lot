# İlk Lot: veri yönetim planı (taslak)

> Etik başvurudaki 6. bölümün (`etik/ETIK_KURUL_BASVURU_TASLAGI.md`) yaşam döngüsü özetidir; çelişirse başvuru belgesi ve kurumun KVKK birimi geçerlidir. `[DOLDUR]` ve `[KARAR]` yerlerini sen ve danışmanın kapatmalısın. Hukuki görüş değildir.

## 1. Yaşam döngüsü

| Aşama | Ne olur | Kim | Not |
|---|---|---|---|
| Toplama | Katılımcı kodu, grup, davranış, test, isteğe bağlı demografik, serbest metin tek alan (≤ 400 karakter) | Uygulama → Firebase | Ad, e-posta, öğrenci no toplanmaz |
| Barındırma | Firebase (Google) | [DOLDUR: bölge, sözleşme] | Yurt dışı aktarım KVKK birimine danışılacak |
| Erişim | Yalnızca araştırmacı hesabı | [DOLDUR: kimler] | Katılımcı grubunu değiştiremez, çekilmiş kaydı geri açamaz |
| Dışa aktarma | Panelden CSV (katılımcı ve olay) | Araştırmacı | **[KARAR]** Veri toplama bitmeden sonuç amacıyla açılmaz (ön kayıt taslağında bu karar bekliyor) |
| Yedek | CSV, şifreli diskte iki kopya | [DOLDUR] | Bulutta ikinci kopya tutulacaksa yeri belirtilir |
| Temizlik | Serbest metin kişisel bilgi içeriyor mu diye gözden geçirilir, gerekirse silinir | Araştırmacı | Analizden önce yapılır |
| Çekilme | Katılımcı menüden çekilir, araştırmacı "Çekilenlerin verisini kalıcı sil" der | Araştırmacı | Süre: [DOLDUR: örn. haftalık] |
| Saklama | [DOLDUR: süre ve başlangıç tarihi] | Araştırmacı | `etik/saklama_takvimi.py` hatırlatma takvimi üretir; süreyi **o seçmez**, etik kurul ve KVKK birimiyle aynı olmalı |
| Silme | Süre sonunda ham veri silinir | Araştırmacı | Yalnızca kimliksiz toplu sonuçlar kalır |
| Paylaşım | Bkz. 3 | | |

## 2. Anonim mi, takma adlı mı

- Kod rastgeledir, kişiyle eşleşmesi tutulmuyorsa veri **kimlik içermez** ama tamamen anonim demek de zordur (cihaz türü, ekran boyutu, küçük gruplarda demografik birleşim).
- Kart dağıtımında kim hangi kodu aldı kaydedilirse veri **takma adlı** olur; bu durumda onamda, etik başvuruda ve silme talebi prosedüründe açıkça yazılmalı. **[KARAR]** Önerim: kaydetme.
- Katılımcı kodunu kaybederse verisi bulunamaz; onam metninde bu yazılı.

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
- Firebase güvenlik kuralları kodu bilen herkesin kaydı okuyup yazmasına izin verir; koruma kodun tahmin edilemezliğine dayanır (12 karakter). Bu sınırlılık etik başvuruda yazılı ve KVKK birimiyle konuşulmalı.
- Gerçek Firebase kurulumu henüz yapılmadı; bu plan o zaman doğrulanmalı.
