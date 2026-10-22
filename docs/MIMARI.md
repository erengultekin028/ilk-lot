# İlk Lot: mimari notu

Bu belge, kodu savunmak ya da değiştirmek isteyen biri için. Kodun büyük kısmı tek bir `ilk-lot.html` dosyasında toplanıyor; kaynak `kaynak/` klasöründe parçalar halinde duruyor.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `kaynak/01_head.html` | CSS (tema değişkenleri, bileşen stilleri) ve sayfa iskeleti |
| `kaynak/02_core.js` | **Ayarlar (`CFG`)**, tohumlu rastgelelik, test soruları, **uyaran üretimi** (2 set × 6 karar), simülatör motoru, durum nesnesi `S` |
| `kaynak/03_qr.js` | QR kodlayıcı (Kazuhiko Arase, MIT lisansı) |
| `kaynak/04_study.js` | **Veri katmanı (`Store`)**: yerel/Firebase kipi; randomizasyon, kodlar, olay kaydı, CSV, araştırmacı paneli, poster |
| `kaynak/05_entry.js` | Giriş ekranları: onam, kod, form, test, tanıtım |
| `kaynak/06_task.js` | Görev ekranları: karar anı, sonuç, simülatör, film, bitiş ve bilgilendirme |
| `kaynak/07_app.js` | Ekran çizimi, ilerleme çubuğu, **eylemler (`ACT`)**, simülatör döngüsü, olay dinleyicileri |
| `kaynak/derle.py` | Parçaları sırayla birleştirir → `ilk-lot.html` (`python kaynak/derle.py`) |

Parça sırası önemlidir (ör. `Store`, `ACT`'tan önce tanımlı olmalı). `ilk-lot.html` doğrudan düzenlenmez; değişiklik parçalarda yapılır ve yeniden derlenir.

## Neden tek dosya?
Hosting ve claude.ai önizlemesi için bağımlılıksız çalışır. Dış kaynak: yalnızca Firebase SDK (`www.gstatic.com`, yalnızca Firebase kipinde). Yazı tipi (Bricolage Grotesque, OFL) dosyanın içinde gömülüdür: `kaynak/yazi/*.woff`, `derle.py` `{{YAZI:Ad}}` yer tutucularını base64 ile değiştirir. Bedeli: büyük bir dosya ve tüm işlevlerin tek kapsamda olması. Yeni bir geliştirici için okumayı kolaylaştıran şey parçaların bölümlere ayrılması ve `ACT` (eylem) / `S` (durum) ayrımıdır.

## Akış ve durum
- **Durum nesnesi `S`**: `stage` (hangi ekran), `phase` (pre → sim → post → done), `block`, `ti` (karar sırası), `dec` (kararlar), `sim` (simülatör).
- **Ekran:** `render()` → `vStage()` ilgili `v…()` işlevini çağırır; her tıklama `data-a` niteliğiyle `ACT[...]`'a gider. Durum değişince `render()` yeniden çizer.
- **Tema ve hareket:** `data-theme` açılışta kayıtlı tercihten (`ilklot:theme`), yoksa cihazdan gelir. Ekran geçişi `#view.enter` (yalnızca `render()` anahtarı değişince), pencere `boxIn`; hepsi `prefers-reduced-motion`'da kapalı.
- **Grafikte gezme:** `pointerdown/move/up` belgeye bağlı; `S.scrubDay` mutlak gün numarasıdır (piyasa akarken işaret sabit kalır), jest bitince 1,5 sn sonra silinir; tek olay `sim_chart_scrub`.
- **Piyasa döngüsü:** `marketTick()` işlevi; `setInterval` içinde tanıtımda `S.demoSpeed` kez çağrılır.
- **Tanıtım modu (`DEMO`, `?demo=1`):** `boot()` doğrudan `demoland` ekranına gider, `S.grp='B'`, `S.code=null`. Yazma yolları ayrıca `DEMO` ile korunur (`Store.init/saveP/addEvents/withdraw`, `log`, `saveSnap`, `saveQueue`, `flush`, `remember`); `Store.init` Firebase'e bağlanmaz ve yerel kod listesi oluşturmaz. Simülatör bitince gerginlik sorusu yerine `demoend` ekranı. Mantık: kod yanlışlıkla dolsa bile hiçbir şey yazılmasın (katmanlı koruma; testte elle `S.code` doldurularak denenir).
- **Pilot formu (`PILOT`):** `CFG.pilot` ya da (`CFG.firebase` boşken) `?pilot=1`. `vEnd` sonunda `pilotFbHtml()`; yanıt `S.fb` + katılımcı kaydında `fb`; CSV'de `pilot_*` sütunları. Tanıtım modunda kapalı.
- **Yazı boyutu seçici (b16'da kaldırıldı, b22'de geri geldi):** `html[data-fs]` (1 = %115, 2 = %130) üzerinde CSS `zoom`; Normal/Büyük/Çok büyük seçenekleri onam ekranında ve menüde (`fsHtml`, `ACT.fs`). Tercih `localStorage` `ilklot:fs` (0/1/2; geçersiz değer yok sayılır) ve kod varken `fs_set` olayı. `zoom` etkin düzen genişliğini daraltır ama medya sorguları gerçek genişliğe bakar; bu yüzden üst çubuk için `html[data-fs]` kuralları ayrıca var (`01_head.html`). `zoom` Chromium'da denendi; iPhone Safari ve Firefox'ta gerçek cihazda denenmedi (`docs/GERCEK_CIHAZ_TESTI.md` A14).
- **Pencereler (`openModal`):** açılınca odak `#mbox` kutusuna, kapanınca önceki öğeye döner; başlık `aria-labelledby` ile bağlanır. Bekleme ekranı (`simCoolHtml`) `#mbox` içeriğini yerinde değiştirir; odak kutuda kalır.
- **Devam etme:** `saveSnap()` durumu kaydeder (her karar, simülatörde her 10 gün, sayfa gizlenirken). Yeniden açılışta `restore()`; simülatör fiyatları **tohumdan yeniden üretilir** (saklanmaz), portföy anlık görüntüden gelir.

## Uyaranlar ve simülatör
- Tüm rastgelelik tohumludur (`CFG.seed`, `CFG.simSeed`): **herkes aynı uyaranı görür**. `fingerprint()` iki cihazda aynı olmalı (panelde ve Sistem testinde görünür).
- Karar setleri (`buildSet`): 4 "sert düşüş + zarar" (sürü × sonuç yönü çapraz), 1 normal + kâr, 1 normal + zarar. Sonuçlar eşit büyüklükte yükseliş/düşüş eşleştirmesiyle **beklenen değeri sıfır** yapar; "sat" ya da "tut" ortalamada avantaj sağlamaz.
- Simülatör (`simStep`): 6 hisse, 3 sektörel kriz, kriz dışında sürüklenme yok. Piyasa, işlem penceresi ya da tur açıkken ve sekme gizliyken **durur**. Bekleme ekranı yalnızca A grubunda ve yalnızca simülatörde, pozisyon ≥ %2 zarardayken çıkar (`ACT.simSellGo`).

## Veri
- **İki kaynak:** (1) `sess_1` anlık görüntüsü (kararlar, simülatör işlemleri; katılımcı özeti CSV'si buradan üretilir), (2) olay kaydı (`log()`; her eylem). Birincil analiz (1)'e, ikincil analizler (2)'ye dayanır.
- **`Store`**: yerel kipte `localStorage` (depo engelliyse bellek), Firebase kipinde Firestore. Katılımcılar anonim girişle yazar; güvenlik `firebase/firestore.rules` ile sunucuda zorlanır: grup değiştirilemez, çekilmiş kayıt geri açılamaz, olay kaydı yalnızca eklenir (katılımcı okuyamaz ve değiştiremez), listeleme ve olay okuma yalnızca araştırmacıda. Katılımcı kaydını **kodunu bilen herkes** okuyup yazabilir; koruma kodun tahmin edilemezliğine dayanır.
- **Çekilme:** yerelde veri hemen silinir; Firebase'de katılımcı silemez, kayıt `withdrawn` + `withdrawnAt` ile işaretlenir ve analizden çıkar. **Politika A (soft delete, b26):** uygulamada ve `firestore.rules` içinde hiçbir silme yolu yoktur ("kalıcı sil" kaldırıldı); süre sonu silme Firebase konsolundan yapılır. Onam metni bu politikaya henüz uyarlanmadı: `etik/ONAM_DEGISIKLIK_ONERISI_A.md`.
- **Randomizasyon:** kodlar önceden, 4'lük bloklarda (2 A + 2 B), set sırası bloklar içinde dengeli; katılımcı grubunu seçemez.

## Sürümleme ve değişiklik kuralları
- `APP_VERSION` (`02_core.js`) her olaya ve kayda yazılır. **Pilot ya da veri toplama başladıktan sonra** kodu değiştirirsen artır ve değişikliği kaydet; ana veri tek sürümden gelmeli.
- Pilot başladıktan sonra `CFG` içindeki uyaran/ölçüt ayarlarını (`seed`, `simSeed`, `simCrises`, `cooldownSec`, `lossThreshold`) değiştirme.
- Değişiklikten sonra: `python kaynak/derle.py` → `python testler/uygulama_testleri.py` → `python analiz/test_betikler.py`.

## Bilinen sınırlar
- Katılımcı özeti CSV'sinin sütunları `analiz/ilklot_ornek_veri.py` ve `analiz/ilklot_analiz.py` ile **elle senkron** tutulur; sütun eklenirse üçünü de güncelle (testler başlık uyuşmazlığını yakalar).
- Olay numarası (`evN`) her olayda cihazda saklanır ve yeniden açılışta anlık görüntü, saklı sayaç ve kuyruktaki en büyük numaradan devam eder (sert kapanma testi: `olay_numarasi_surekliligi`). Sayaç cihaza özgüdür; **aynı kodla iki cihazdan eşzamanlı kullanımda numaralar yine çakışabilir.**
- Aynı kodla iki cihazdan eşzamanlı kullanım korunmuyor (bkz. `docs/GERCEK_CIHAZ_TESTI.md`, B4).
- Firebase yolu yalnızca sahte SDK'yla otomatik test edildi; gerçek sunucu ve güvenlik kuralları gerçek cihaz protokolünde denenmelidir.
- Birincil model rastgele kesişimli karma model değildir (kümeye dayanıklı lojistik); bkz. `analiz/README.md`.
