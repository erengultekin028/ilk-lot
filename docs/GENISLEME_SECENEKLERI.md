# İlk Lot: ana çalışmadan sonra eklenebilecekler (karar değil, seçenek listesi)

> **Hiçbiri ana çalışmaya eklenmemeli.** Uygulama değişirse ön kayıt, etik onay ve testler yeniden açılır. Bu liste, ana veri toplandıktan sonra ya da ayrı bir çalışma olarak düşünülebilecekleri sıralar. Güç, maliyet ve kapsam rakamları verilmemiştir; hiçbiri hesaplanmadı.

## 1. Takip ölçümü (1-2 hafta sonra)

- **Soru:** Etki kalıcı mı? Şu an yalnızca simülatörden hemen sonraki "kısa süreli aktarım" ölçülüyor; sonuçlar bu çerçevede yorumlanır.
- **Gerekli:** Kimlikten ayrı bir geri dönüş yolu (kod ya da e-posta). E-posta toplamak veriyi takma adlı yapar ve onam/etik değişir.
- **Risk:** Büyük katılımcı kaybı; geri dönenler seçilmiş olur. Güç düşer.
- **Uygulamada:** 3. bölüm benzeri yeni bir karar seti (farklı hisseler) ve kısa form. Kaynakta `set_order` mantığı var ama yeni set ve oturum akışı yazılmalı.

## 2. Replikasyon ya da ikinci örneklem

- **Ne zaman:** Ana çalışma sonucu çıktıktan sonra. Farklı bir üniversitede ya da aynı üniversitede farklı dönemde.
- **Sebep:** Tek örneklem, tek dönem; bulgu kesinleşmez. Ön kayıt tekrar kullanılabilir.
- **Gerekli:** Aynı sürüm dondurulmuş uygulama, kodlar, analiz betiği.

## 3. Üçüncü grup

- **Seçenekler:** Farklı bekleme süresi (ör. 5 sn), bekleme ekranı yerine yalnızca bilgi (zararı gösteren kart), sürü bilgisi olmayan ekran.
- **Risk:** Örneklem büyümesi gerekir; mevcut güç hesabı iki grup içindir.

## 4. Ek ölçekler

- **Risk tutumu (tek soru):** Moderatör olarak yararlı olabilir; ön teste eklenirse süre uzar. Etik ve ön kayıt güncellenir.
- **Bilgi ölçeğinin doğrulanması:** 3 ek maddenin ve Big Three çevirisinin ayrı bir küçük çalışmayla doğrulanması (geri çeviri, uzman, pilot).

## 5. Katılımcı tarafında

- **Bilgilendirme sonrası "öğren" modu:** Katılımcı bilgilendirmeden sonra terimleri ve kendi kararını incelesin. Bilgilendirmeden sonra olduğu için veriyi etkilemez, ama etik materyalleri ve ekran sayısı artar.
- **Sonuçları paylaşma sayfası:** Çalışma bitince yalnız toplu sonuçları gösteren bir sayfa.

## 6. Altyapı

- **Ekran okuyucu ve gerçek cihaz erişilebilirlik testi** (şu an yalnızca masaüstü Chromium ve kendi taramam).
- **İngilizce arayüz:** Yayın ya da başka ülke için; çeviri ve etik yeniden gerekir.
- **CI:** Testleri her değişiklikte otomatik çalıştırmak.

## Önerim

Ana çalışma bitmeden hiçbirini eklememek. En faydalısı 2 (replikasyon): tek bir ek çalışma için uygulama ve ön kayıt hazır olur. 1 (takip), sonuç umut verirse ayrı bir izinle yapılır.
