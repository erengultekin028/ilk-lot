# İlk Lot – Veri sözlüğü (sürüm 2026.10.04-q1)

## Tasarım özeti
Tek oturum, ~30 dk. **Ön ölçüm → müdahale → son ölçüm**, iki grup (A / B), rastgele atama.

| Bölüm | İçerik | A grubu | B grubu |
|---|---|---|---|
| 1. bölüm (pre) | 6 karar anı | bekleme yok | bekleme yok |
| 2. bölüm (sim) | Önce 3 kartlık nötr okuma; sonra 7,5 dk sekmeli simülatör (Portföy / Piyasa / Analiz + hisse detay sayfası), 6 hisse tam sayı lot, 3 sektörel kriz, haber şeridi | **zararına satışta 10 sn bekleme** | bekleme yok |
| 3. bölüm (post) | 6 karar anı (farklı hisseler) | bekleme yok | bekleme yok |
| Serbest mod (isteğe bağlı, çalışma bittikten sonra) | Zorluk, kayıp sınırı, senaryo ve başlangıç portföyü seçimli, süresiz simülatör oyunu; piyasa hızı ve otomatik sat emri (b23). **Çalışmanın parçası değil: hiçbir olay, işlem ya da ayar kaydedilmez** (veri sözlüğünde karşılığı yok) | yok | yok |

- **Hipotez (aktarım):** Simülatörde bekleme süresiyle karşılaşan A grubunda, 3. bölümdeki panik satış oranı 1. bölüme göre B grubundan daha fazla azalır.
- **Karar görevindeki hisseler:** X seti GARAN, FROTO, TCELL, EREGL, SISE, ULKER; Y seti AKBNK, TOASO, TTKOM, KCHOL, ARCLK, MGROS. Adlar gerçek; grafikler, haberler ve sonuçlar kurgusal.
- **Karar setleri:** X ve Y, her biri 6 karar: 4 × (sert düşüş + zarar) [ana ölçüt; sürü × sonuç yönü tam çapraz], 1 × (normal + kâr), 1 × (normal + zarar). Tekli hücreler iki set arasında dengelenir (X'te yükselen hücre Y'de aynı büyüklükte düşer); her katılımcı iki seti de gördüğü için kişi içinde her hücrenin beklenen sonucu sıfırdır. Set sırası (`set_order`) her 4'lü blokta gruplar içinde dengelenir.
- **Simülatör:** 300 gün × 1,5 sn. Hisseler gerçek BIST adlarıyla (KOZAL, TUPRS, PGSUS, THYAO, ASELS, BIMAS); **fiyatlar, haberler ve krizler kurgusal** (ekranda ve bilgilendirmede belirtilir). Üç sektörel kriz: 52. gün TUPRS+KOZAL (−%18), 135. gün ASELS (−%20), 218. gün THYAO+PGSUS (−%16); BIMAS hiç etkilenmez. Krizden önce uyarı haberi, kriz başında haber, aralarda nötr haberler (herkese aynı günde). Kriz dışında sürüklenme yok; seçilen tohumda krizdeki hisselerin dipten sona değişimi 5 olaydan 3'ünde yükseliş, ortalama +%0,2; dipten +20 gün ortalaması −%0,03 (nötr; gerekçe `docs/SIMULATOR_TOHUMU.md`). İşlem penceresi açıkken piyasa durur.
- **Miktar girişi (iki grup):** İşlem penceresinde yön (Sat/Al) seçilir; lot sayısı elle yazılır, −/+ ile ayarlanır ya da %25/%50/%75/Tümü(Maks) ile seçilir. Kutu bilinçli olarak **boş** başlar (hazır miktar önermek çıpalama yaratırdı). `frac` = satılan lot / eldeki lot; `qMode` = miktarın son nasıl girildiği (`typed` / `chip` / `step`); `qEdits` = penceredeki miktar değişikliği sayısı (kararsızlık göstergesi). Bekleme ekranından vazgeçince aynı miktarla pencereye dönülür.
- **Satış gerekçesi (iki grup):** Simülatörde her satışta "Planım buydu / Haber yüzünden / Korktum / Diğerleri satıyor / Söylemek istemiyorum" sorulur; A grubunda ardından (zarardaysa) 10 sn bekleme gelir.

## Katılımcı özeti – sütunlar

| Sütun | Anlamı |
|---|---|
| app_version, code, grp, set_order | Sürüm, kod, grup, set sırası (X→Y / Y→X) |
| completed, decisions | Tamamlandı mı; toplam karar (en fazla 12) |
| **panic_rate_pre / _post** | Sert düşüş + zarar denemelerinde (her bölümde 4) satış oranı |
| **panic_rate_change** | post − pre. **Ana bağımlı değişken** (negatif = azalma) |
| sell_rate_crisis_pre / _post | Sert düşüş denemelerinde satış oranı (6 kararlık tasarımda panic_rate ile aynı) |
| sell_rate_gain_* / sell_rate_loss_* | Normal piyasada kârdaki (1) / zarardaki (1) pozisyonu sattı mı (0/1) |
| disposition_pre / _post | gain − loss (çok kaba: hücre başına 1 deneme; sadece betimleyici kullan) |
| buy_more_crisis_pre / _post | Sert düşüşte "daha al" oranı |
| rt_median_pre_ms / _post_ms | İlk seçime kadar geçen süre medyanı |
| sim_trades, sim_sells, sim_buys | Simülatördeki işlem sayıları |
| sim_loss_sells | Zararına (≤ −%2) satışlar |
| sim_loss_sells_crisis | Hissenin kendi krizi ve sonraki 20 gün içinde zararına satışlar |
| sim_time_portfolio_s / _market_s / _analysis_s | Simülatörde Portföy / Piyasa / Analiz sekmesinde geçen süre (sn). Dozun kontrol değişkeni |
| reading_s | Simülatör öncesi okuma ekranında geçen süre (sn) |
| **sim_sell_reasons** | Satış gerekçelerinin dağılımı, ör. "Korktum:2\|Haber yüzünden:1" |
| **cooldown_shown / _cancel / _proceed** | Müdahale dozu: bekleme kaç kez çıktı, kaçında vazgeçildi, kaçında satıldı (sadece A). Olay verisinde `cooldown_cancel` ve (b21'den itibaren) `cooldown_proceed` için `waitedMs`: ekranın açıldığı andan karara kadar geçen süre (ms). b20 ve öncesi verilerde `cooldown_proceed` süre taşımaz. |
| stress_pre / _sim / _post | Her bölüm sonunda gerginlik (1–5) |
| pre_test | **Ön test puanı (6 madde):** Lusardi ve Mitchell'in "Big Three" soruları (faiz, enflasyon, çeşitlendirme; Türkçe çevirisi doğrulanmadı) + **araştırmacının yazdığı 3 ek madde** (risk-getiri, hisse sahipliği, bileşik getiri; **doğrulanmamış**). 6 madde → 0, 17, 33, 50, 67, 83 ya da 100. "Bilmiyorum" yanlış sayılır (ayrı kaydı olay dosyasında, `test_answer.dk`). 1. bölümden önce ölçülür; **kovaryat/tanımlayıcı** ve bilgi düzeyi analizinin moderatörü |
| pre_test_b3 | **Yalnızca Big Three (ilk 3 madde) puanı:** 0, 33, 67 ya da 100. Ek maddeler doğrulanmadığı için duyarlılık analizinde (rapor notu, Holm dışı) kullanılır. Eski oturumlarda boş olabilir |
| post_test | **Son test: "Big Five" uzantısının 4-5. soruları** (konut kredisi, tahvil-faiz). 2 soru → 0, 50 ya da 100. **Ön testle FARKLI sorular: ön-son değişim puanı hesaplanmaz.** Betimleyici / keşifseldir |
| **test_mode** | 1 = **hızlı test modunda** üretilmiş oturum (piyasa 10 kat hızlı, bekleme 3 sn). **Analizden çıkar.** Sadece demo/yerel modda oluşabilir |
| attention_pass | Dikkat kontrolü |
| **comprehension_first_try** | Alıştırmadan sonraki 3 soruluk anlama kontrolünde ilk denemede doğru sayısı (0–3). Her oturumda 3 havuzdan (her biri 6 soru) birer soru rastgele çekilir; hangisinin çekildiği `comprehension` olayındaki `form` alanındadır. Düşük olanlar görevi anlamamış olabilir: duyarlılık analizinde çıkar |
| help_opens | Sözlüğün kaç kez açıldığı (görevi zor bulma göstergesi) |
| manip_saw_wait | "Simülatörde bekleme gördün mü?" |
| **purpose_guess** | "Sence araştırma neyi ölçüyordu?" serbest metin. Amacı doğru tahmin edenleri işaretleyip duyarlılık analizinde çıkar |
| age … sim_exp | Demografik form |
| consent_version | Katılımcının kabul ettiği onam metni sürümü (ör. v1). Metni değiştirirsen `CONSENT_VER` değerini artır |
| consent_sections_opened | Onam ekranında kaç ayrıntı bölümünün açıldığı (0–7): okuma göstergesi |
| consent_downloaded | Onam metnini indirdi mi (1/0) |
| consent_read_s | Onam ekranında geçirilen süre (sn) |
| pilot_clear | **Yalnızca pilot yayınında** (`CFG.pilot:true`): "Ne yapman gerektiğini ilk dakikada anladın mı?" 1-5. Gerçek veri toplamada boş; boşsa form yoktu ya da atlandı |
| pilot_duration | Yalnızca pilot: "Toplam süre sana nasıl geldi?" (Çok kısa / Uygun / Uzun / Çok uzun) |
| pilot_unease | Yalnızca pilot: "Rahatsız ya da çok gergin hissettin mi?" (Hayır / Biraz / Evet) |

## Olay kaydı – önemli türler
`tour_start / tour_done` (ilk alıştırma ve simülatör turu, atlandı mı) · `comprehension_answer / comprehension` (soru sırası `q`, havuzdan çekilen soru `form`, seçim, ilk denemede doğru mu, deneme sayısı) · `help_open` · `term_open` (dokunulan terim: `k` = sözlük başlığı, `stage`; CSV sütunu yok, görev ekranında da açılabildiği için karar süresiyle zaman damgasından eşleştirilir) · `theme_set` (theme: light/dark; yalnızca kod varken) · `sim_chart_scrub` (k, moves, ms, tick: grafikte bir gezme jesti; `session_start.data.theme` açılıştaki tema) · `pilot_feedback` (clear, dur, unease ya da skip; yalnızca pilot yayını, bilgilendirmeden sonra) · `fs_set` (yazı boyutu seçimi: level 0 normal, 1 büyük, 2 çok büyük; yalnızca katılımcı kodu varken; seçici b16–b21 sürümlerinde yoktu, o verilerde bu olay çıkmaz; b22'de geri geldi; analizde yazı boyutunu büyük seçenlerin ekran düzeni farklı görmüş olabileceği için ayrı not edilir) · `consent_given` (ver, opened, dl, ms) · `test_answer` (kind, q, choice, correct, **dk**: "Bilmiyorum" seçildi) · `decision` (block, set, kind, pos, pl, crowd, out, first, final, rtFirst, hid, res) · `sim_start` (readMs) · `sim_tab` (from, to, tick) · `sim_detail` (hisse detay sayfası açıldı: k, tick) · `sim_open` · `sim_trade` (t, sym, side, q, frac, p, pl, why, crisis, postCrisis, afterCooldown, decMs, **qMode**, **qEdits**) · `sim_crisis_start` · `sim_end` · `cooldown_shown / _cancel / _proceed` · `stress_rating` · `test_*` · `attention_check` · `manipulation_check` · `purpose_guess` · `debrief_view` · `practice_sim` (trades, tick, skipped, ms: 30 saniyelik simülatör alıştırması; yalnızca bitince TEK olay, alıştırmadaki işlemler/sekme/detay olayları **kaydedilmez**, `tour_*` olayları kaydedilir; analizde `sim_trade` sayımına girmez) · `summary_card` (n: karttaki simülatör işlem sayısı; katılımcı karar kartı oluşturdu; yalnızca bilgilendirmeden sonra) · `hidden / visible` · `client_error`

Bu sözlükteki sütunları okuyan hazır analiz betikleri `analiz/` klasöründedir (`analiz/README.md`).

## Analiz önerisi
- **Gerçek şirket adları nedeniyle:** katılımcının bu şirketlere dair önceden fikri kararlarını etkileyebilir. Gruplar arası karşılaştırmayı bozmaz (iki grup aynı hisseleri görür), ama hisse düzeyinde rastgele etki eklemek ve ileride "bu şirketlerden birinin hissesine sahip misin?" sorusunu sormak önerilir.
- Karar düzeyinde karma etkili lojistik regresyon: `sat ~ grup × bölüm (pre/post) + set + (1 | katılımcı) + (1 | deneme)`, sadece sert düşüş + zarar denemeleri. Ana test: **grup × bölüm etkileşimi**.
- Doz analizi: A grubunda `cooldown_shown` ile `panic_rate_change` ilişkisi.
- Duyarlılık: amacı doğru tahmin edenler (`purpose_guess`), dikkat kontrolünü geçemeyenler ve anlama kontrolünde ilk denemede 2'den az doğru yapanlar (`comprehension_first_try`) çıkarılarak tekrar.
- Sınır: müdahale (simülatör) 7,5 dakika; sonuçlar "kısa süreli aktarım" olarak raporlanmalı.

## Test kaydı işareti (b32, isteğe bağlı alanlar)
Denemelerden kalan kayıtları analizden ayırmak için yönetim panelindeki "Test kayıtları" bölümü `participants/{kod}` belgesine şu **isteğe bağlı** alanları yazar. Hiçbir kayıt silinmez (politika A); CSV sütunları değişmez.

| Alan | Anlamı |
|---|---|
| `testRecord` | `true`: araştırmacı bu kaydı test olarak işaretledi; `false`: işaret geri alındı |
| `withdrawn` | İşaretlenince `true` olur (pano ve dışa aktarma çekilmiş kaydı zaten dışarıda bırakır) |
| `testPrevWithdrawn` | İşaretlemeden önceki çekilme durumu; geri alırken `withdrawn` buna döner (gerçek çekilme korunur) |
| `testMarkedAt`, `testMarkedBy` | İşaretleme zamanı (ISO) ve araştırmacının e-postası |
| `testUnmarkedAt` | Geri alma zamanı |

Özet ve olay CSV'lerine `testRecord: true` ya da `withdrawn: true` olan katılımcılar girmez. Bu alanları yalnızca araştırmacı yazabilir (`firebase/firestore.rules`).