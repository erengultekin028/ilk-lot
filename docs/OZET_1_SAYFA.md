# İlk Lot: bir sayfalık özet

*Danışman, etik kurul ve ilgilenen katılımcılar için. TÜBİTAK 2209-A başvuru aşamasında; sonuç yoktur.*

**Soru.** Genç yatırımcılar kayıptaki bir hisseyi sert düşüş sırasında panikle satıyor mu? Zararına satıştan önce konulan 10 saniyelik bir bekleme ekranı bu davranışı azaltır mı ve bekleme ekranı kalktıktan sonra etki sürer mi?

**Yöntem.** Telefonda tek oturum (yaklaşık 30 dakika), 18 yaş üstü üniversite öğrencileri, rastgele iki grup:

| | A grubu | B grubu |
|---|---|---|
| Simülatörde zararına satış öncesi | 10 sn bekleme ekranı | Bekleme yok |
| 1. ve 3. bölüm (karar anları) | Aynı | Aynı |

1. bölüm: 6 karar anı (Sat / Tut / Daha al). 2. bölüm: 7,5 dakikalık kurgusal piyasa simülatörü. 3. bölüm: farklı hisselerle 6 karar anı. Ana ölçüt, "sert düşüş + zarar" anlarında satış oranının 1. bölümden 3. bölüme değişimi ve bunun iki grupta farklı olup olmadığı.

**Neden bu tasarım.** Karşılaştırma iki grup arasında; her şey aynı, tek fark bekleme ekranı. Piyasa kurgusal ve herkes için aynıdır, yani fark piyasadan gelemez. Katılımcı grubunu seçemez.

**Etik.** Katılımcı amacı oturum sonunda öğrenir (eksik bilgilendirme gerekçesi etik başvuruda). Piyasa kurgusaldır, gerçek para yoktur, yatırım tavsiyesi verilmez. Çekilme her an mümkündür. Kimlik bilgisi toplanmaz.

**Gerçekçi beklenti.**
- Etkinin küçük çıkma ihtimali vardır. Örneklem ve güç hesabı buna göre planlanıyor; hedef sayıya ulaşılsa bile sonuç "anlamlı" çıkmayabilir.
- Sonuç, simülatör ve kısa süreli aktarım için geçerlidir; gerçek yatırım davranışına doğrudan genellenemez.

**Şu an hazır olan:** uygulama (testlerle), analiz betikleri, ön kayıt ve etik başvuru taslakları. **Henüz olmayan:** pilot, gerçek Firebase kurulumu ve gerçek telefonlarda test, etik kurul onayı, ön kayıt.

**Karar gerektirenler (ben ve danışmanım):** örneklem yolu (grup başına ~60 ya da ~100), analiz modeli, ön kayıt, ölçek doğrulaması, veri paylaşımı, ödül.

---

## Sonuçları katılımcılarla paylaşma (taslak)

Çalışma bittikten ve analiz tamamlandıktan sonra, katılımcıların kendilerine ulaşabilmesi mümkün değil (kimlik toplanmıyor). Seçenekler:

1. **Tanıtım sayfasında kısa duyuru:** "Sonuçlar [DOLDUR: tarih]'te şuraya yazıldı." Kod ve kişi eşleşmesi gerekmez.
2. **Çalışmaya özel bir sayfa** (toplu, grafikli özet; kimlik riski yok).
3. **Poster ya da sunum** (bkz. `docs/SUNUM_ISKELETI.md`).

Söz verilecekse tarih gerçekçi olsun; analiz ve danışman onayı süresi hesaba katılmalı. Onam metninde ve bilgilendirmede böyle bir söz **şu an yok**; verilirse metinler ve etik onay güncellenir.

**Katılımcıya örnek metin (sonuç gelince doldurulacak, şimdi kullanılmaz):**

> Katıldığın çalışmanın sonuçları yayımlandı. Genel olarak [DOLDUR: bulgu, abartısız ve belirsizlikle birlikte]. Bu sonuçlar tek bir çalışmaya, kurgusal bir simülatöre ve üniversite öğrencilerine dayanır; gerçek yatırım davranışı hakkında kesin bir şey söylemez.
