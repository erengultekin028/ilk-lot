# KVKK birimine gönderilecek e-posta (tek sayfa)

> Yanıt adresi: **erengltkn1905@gmail.com** (28.10.2026 kararı; imzaya yazıldı). Köşeli parantezli `[…]` yerleri kendin doldur. Danışmanını bilgiye (CC) ekle. Aşağıdaki metin `docs/KONUM_VE_KVKK_KARARI.md` bölüm 7'nin e-postaya uyarlanmış halidir. Yanıtı aldığında özetini o belgenin bölüm 8'ine ("Karar kaydı") yaz.
>
> **Ekler:** `etik/veri_akisi.svg` (veri akışı şeması, PDF'e çevirebilirsin), `etik/onam_metni_v1.txt` (onam metni), `docs/VERI_SOZLUGU.md` (alanlar), `docs/VERI_YONETIM_PLANI.md` (yaşam döngüsü).

---

**Konu:** Kişisel veri değerlendirmesi ve yurt dışı aktarım görüşü talebi: "İlk Lot" araştırma projesi

Sayın [KVKK birimi / Ad Soyad],

Yönetim Bilişim Sistemleri bölümü lisans öğrencisiyim. Danışmanım [Unvan Ad Soyad] ile birlikte, üniversite öğrencilerinin **kurgusal bir yatırım simülatöründeki kararlarını** inceleyen bir araştırma yürütüyorum (etik kurul başvurusu: [durum / numara]). Veri toplamaya başlamadan önce, kişisel veri ve yurt dışı aktarım açısından görüşünüzü rica ediyorum.

**Sistem özeti.** Katılımcılar web uygulamasına tarayıcıdan girer (yaklaşık 30 dakika; gerçek para yok). **Ad, e-posta, telefon ya da öğrenci numarası toplanmaz.** Kaydedilenler: rastgele bir katılım kodu ve grup, kararlar ve süreleri, test puanları, isteğe bağlı aralıklı demografik bilgi (yaş aralığı, cinsiyet, bölüm alanı, sınıf, yatırım deneyimi), serbest metin (en fazla 400 karakter), tarayıcı türü ve ekran boyutu. Uygulama Google Firebase üzerinde çalışır: veritabanı Cloud Firestore (şu an ABD çok bölgeli konumunda; Avrupa'ya taşınabilir), katılımcı girişi **anonim kimlik doğrulama** (tarayıcıya bağlı rastgele oturum kimliği; kişiyle eşleştirilmez), site Firebase Hosting. Google'ın belgelerine göre kimlik doğrulama hizmeti yalnızca ABD veri merkezlerinde çalışmakta ve IP günlükleri birkaç hafta tutulmaktadır; Türkiye'de Firestore konumu bulunmamaktadır. Katılımcı çekilebilir; kayıt silinmez, analiz dışı işaretlenir.

**Görüşünüzü rica ettiğim sorular:**

1. Yukarıdaki veriler (özellikle rastgele kod, anonim oturum kimliği, IP günlükleri, demografik aralıklar ve serbest metin) **kişisel veri** sayılır mı? Hangileri?
2. **Veri sorumlusu** kimdir (üniversite mi, araştırmacı mı)? Google bu durumda **veri işleyen** midir?
3. Yurt dışı aktarım (KVKK m. 9, 7499 sayılı Kanun sonrası) hangi **güvenceye** dayanmalıdır? Standart sözleşme gerekiyorsa kim imzalar, 5 iş günü içindeki Kurum bildirimini kim yapar ve hangi Google sözleşmesi kullanılır?
4. Araştırma verisinin **Avrupa'da saklanması** (kimlik doğrulama ABD'de kalsa da) değerlendirmeyi değiştirir mi? Tercih ettiğiniz bir bölge var mı?
5. Onam ekranındaki **açık rıza** bu aktarım için tek başına yeterli midir, yoksa ayrıca bir güvence şart mıdır? **Aydınlatma metni** ile açık rıza ayrı mı sunulmalıdır?
6. Onam metnine ve etik başvuruya **hangi ifadeler** yazılmalıdır (konum, aktarım, veri işleyen, saklama süresi)?
7. **VERBİS** kaydı ya da başka bir kurumsal yükümlülük (envanter vb.) gerekir mi?
8. Sayfa açıldığında, onam verilmeden önce Google'a teknik istekler gitmektedir (site ve yazılım dosyalarının yüklenmesi, anonim giriş). Bunun için **ek bir önlem** (örneğin Firebase'i yalnızca onamdan sonra başlatmak) istenir mi?
9. **Saklama süresi** ve talep üzerine erişim/silme prosedürü nasıl olmalıdır (kayıtlar silinmeden işaretlenmektedir; kalıcı silme gerekirse nasıl uygulanmalı)?

Pilot uygulamaya ve poster basımına geçmeden önce yanıtınızı [tarih] tarihine kadar alabilirsem planı ona göre yapabilirim. Ekte veri akışı şemasını, onam metnini ve veri sözlüğünü paylaşıyorum; gerekirse kısa bir görüşme için de müsaitim.

Saygılarımla,
Eren Gültekin · Yönetim Bilişim Sistemleri · erengltkn1905@gmail.com · [telefon, isteğe bağlı]
Danışman: [Unvan Ad Soyad]
