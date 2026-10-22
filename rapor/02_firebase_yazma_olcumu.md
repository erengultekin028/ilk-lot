# Firebase yazma ölçümü (Aşama 1, madde 8)

**Yöntem:** Uygulamanın Firebase yolu, sahte bir Firestore SDK'sı ile (testlerdeki `SAHTE_FIREBASE`) çalıştırıldı; her `set` ve her toplu yazma kalemi sayıldı. Tam bir katılımcı akışı koşuldu (onam → ön test → 6 karar → simülatör → 6 karar → bitiş). **Gerçek Firestore'a karşı ölçülmedi.**

| Grup | Yazma | Okuma | Olay belgesi |
|---|---|---|---|
| A (bekleme ekranı görüldü) | 95 | 2 | 65 |
| B | 89 | 2 | 60 |

**Sınırlar:**
- Ölçüm simülatörün 80. gününe kadar ilerletilerek yapıldı (gerçek çalışma 300 gün). Anlık görüntü her 10 günde yazıldığı için tam oturumda yaklaşık +22 yazma beklenir → **≈ 115 yazma**.
- Test akışı asgari etkileşimlidir (grafikte gezme, terim açma, ek işlem yok). Gerçek katılımcılar daha çok olay üretir; **2 kat güvenlik payı** ile **≈ 230 yazma/oturum** varsayıldı. Bu bir tahmindir, ölçülmüş değil.

**Spark planı:** günlük 20.000 yazma ve 50.000 okuma (sınırlar değişebilir; güncelini Firebase belgelerinden kontrol et).
- İyimser (115 yazma): günde ≈ 170 katılımcı.
- Güvenli varsayım (230 yazma): günde ≈ **85 katılımcı**.
- Okuma kotası (katılımcı başına ~2 okuma ölçüldü) darboğaz değil.
- **Öneri:** Aynı güne 85'ten fazla katılımcı koyma; pilotta gerçek yazma sayısını Firebase konsolundaki "Kullanım" sekmesinden doğrula.
