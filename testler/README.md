# Testler

> **b27 uyarısı (25.10.2026):** Uygulama köklü yeniden yapılandırıldı (`docs/MIMARI.md`). Bu klasördeki tarayıcı tabanlı testler (`uygulama_testleri.py`, `erisilebilirlik_taramasi.py`, `gorsel_karsilastirma.py`) **eski tek dosya yapısı için yazılmıştı** (`ilk-lot.html`, global `S`/`ACT`/`CFG` adları, kodla giriş, yerel kayıt kipi) ve **olduğu gibi ÇALIŞMAZ**. Yeniden yazılırken: adlar için `docs/ESKI_YENI_ADLAR.md` (`docs/eski_yeni_adlar.json`), uygulama sayfası `http://localhost:8088/` (`npm run serve`), testlerin çevrimdışı çalışması için Firebase'in sahte SDK'sı ya da Emulator kullanılmalı, katılım akışı için anonim giriş + yuva alma (`public/src/repositories/enrollment-repository.js`) kurulmalı, ekran görüntüsü referansları (`gorsel_referans/`) eski yapının görüntüleridir, geniş ekran için yeni referans gerekir. Geçerli otomatik denetimler: `arac_testleri.py` (aşağıdaki listenin dışında), `npm run lint`, `npm run check:modules`, `npm run check:classes`, `firebase/kural_testleri`, `analiz/test_betikler.py`.
>
> Aşağıdaki liste ESKİ (b26) uygulama testlerini anlatır ve yeniden yazım için kapsam listesi olarak durur.

`uygulama_testleri.py`: ilk-lot.html'i gerçek bir tarayıcıda (Chromium) uçtan uca sınar. Assert tabanlıdır; hepsi geçerse çıkış kodu 0.

```
pip install playwright
playwright install chromium
python uygulama_testleri.py              # hepsi (~190 sn)
python uygulama_testleri.py lot onam     # adında "lot" ya da "onam" geçenler
```

`ILKLOT_HTML` (varsayılan `../ilk-lot.html`) ve `CHROMIUM` (tarayıcı yolu) ortam değişkenleriyle ayarlanır.

| Test | Neyi sınar |
|---|---|
| `akis_A_ve_B` | Baştan sona A ve B oturumu; bekleme yalnızca A'da ve yalnızca simülatörde; ölçek puanları; ilerleme çubuğu geri gitmez; CSV başlığı analiz betiğiyle aynı |
| `devam_etme` | Karar bölümü ve simülatör ortasında yenileme: aynı yerden, aynı fiyat ve portföyle devam |
| `cekilme_ve_18_alti` | Çekilen ve 18 yaş altı katılımcının verisi silinir, kod tekrar kullanılamaz |
| `depo_engelli` | Tarayıcı deposu engelliyken akış çalışır (bellek modu) |
| `lot_girisi` | Lot yazma, sınırlar, yön, yüzde düğmeleri, bekleme ekranından geri dönüşte miktar korunur |
| `onam_ve_metin` | Onay kutusu olmadan devam edilemez; metin hipotezi ele vermez; boş alanlar panelde uyarılır |
| `hizli_mod_kilidi` | Hızlı test modu Firebase ayarlıyken açılmaz; bayrak süresi |
| `uyaran_determinizmi` | Her cihazda aynı uyaranlar; her hücrede beklenen sonuç sıfır |
| `olcek_ve_dk` | Big Three/Five soruları, doğru cevaplar, "Bilmiyorum" kaydı, puan hesabı |
| `serbest_mod_calisma_simulatorunu_degistirmez` | Serbest mod eklemesi çalışma simülatörünün fiyat yolunu (b18 özeti) ve olay/haber listelerini değiştirmez |
| `serbest_mod_kayit_yok_ve_kosullar` | Serbest mod yalnızca bitiş ekranından açılır; olay, katılımcı kaydı ve tarayıcı depolaması değişmez; bekleme ve gerekçe sorusu yok; çalışma simülatörü geri gelir |
| `serbest_mod_tanitimda` | Serbest mod tanıtım modundan da açılır, depolamaya yazmaz, döndüğü ekrana geri gelir |
| `serbest_mod_zorluk_ve_kayip_siniri` | Kayıp sınırları (%30/%20/%10), sınırda oyun sonu, süre sınırı yok, 320 px taşma |
| `serbest_mod_haber_derinligi_ve_olaylar` | Uyarı → olay takvimi, tarafsız haber pencereleri, haber derinliği zorlukla artar, log-simetrik yükseliş, aynı tohum aynı takvim |
| `bekleme_suresi_kaydi` | Bekleme ekranından vazgeçme ve onaylama olayları `waitedMs` (geçen süre) taşır (b21) |
| `serbest_mod_menu_ve_baslangic` | Serbest mod menüsü: kayıp sınırı, senaryo, başlangıç portföyü seçenekleri; geçersiz değer yok sayılır; özel sınırda oyun biter; varsayılan senaryo b22 takvimiyle aynı, diğerleri beklenen yönde; 320 px (b23) |
| `serbest_mod_hiz_ve_otomatik_emir` | Duraklat/4× hız; otomatik sat emri eşikleri, tetiklenince tam satış ve emrin silinmesi, geçersiz değer, çalışma simülatöründe emir yok, depolama ve olay kaydı değişmez (b23) |
| `serbest_mod_haber_seridi_ve_hisse_isareti` | Yalnızca serbest modda: yeni haber şeridi (kapatma, süre, Piyasa/kriz durumları, 44 px hedef) ve etkilenen hissede rozet; çalışma simülatöründe ve alıştırmada yok (b25) |
| `logo_ve_simge` | Başlık logosu yeni tasarım (eski logonun öğeleri yok); favicon ve ana ekran simgesi geçerli 180×180 PNG (b24) |
| `sistem_testi` | Panel sistem testi; depo engelini hata olarak bildirir |
| `fiyat_gosterimi` | Ekrandaki fiyat, değer ve toplamlar modelle birebir aynı |
| `sahte_firebase_entegrasyonu` | Firebase kod yolu (sahte SDK): yazma, olaylar, çekilme (soft delete: silme yolu yok), sistem testi |
| `yazi_boyutu_secici` | Yazı boyutu seçici (onam + menü): üç seçenek, %115/%130, yenilemede kalır, geçersiz kayıtlı değer yok sayılır, `fs_set` yalnızca kodla yazılır, depolama engelliyken çalışır (b22) |
| `yazi_boyutu_tasma_yok` | Büyük/Çok büyük yazıda 320 ve 360 px'te tarama temiz; üst çubuk sağ kenar boşluğunu yemez (b22) |
| `adet_fiyat_gosterimi` | Portföy satırı "adet × 1 lot fiyatı = değer" olarak tutarlı (5 farklı günde), kâr/zarar işareti ve rengi, ortalama alış; detay ve işlem penceresinde aynı adlandırma; işlem özetinde "N lot × ₺fiyat" ve tutar |
| `pencere_odagi` | Pencere açılınca odak pencerede, kapanınca eski düğmede, başlığa bağlı, Esc, iç içe pencere |
| `tanitim_modu` | `?demo=1`: hiçbir `localStorage` anahtarı yazılmaz (hiçbir anahtar), bekleme çıkmaz (grup A zorlansa da), panel açılmaz, gerçek katılımcının kaydı değişmez, Firebase tanımlıyken SDK yüklenmez; kod elle doldurulsa da kayıt yolları yazmaz; panelden açma ve menüden çıkma |
| `pilot_geri_bildirim` | Form yalnızca pilot kipinde ve bilgilendirmeden sonra; yanıt CSV'ye ve olaya yazılır; geçersiz değer yok sayılır; yeniden açınca tekrar sorulmaz; seçim yapmadan gönderme = atlama; Firebase doluyken `?pilot=1` formu açmaz, `CFG.pilot:true` açar |
| `tema_yazi_ve_hareket` | Tema cihazdan gelir, tercih saklanır ve cihazı geçer, `theme_set` ve `session_start.theme`; yazı tipi gömülü (dış istek yok, yüklü); ekran geçişinde animasyon var, hareket azaltmada yok |
| `grafik_gezme` | Gezilen gün ve fiyat gerçek verinin aynısı (uçlar ve orta); sınır dışı; piyasa akarken işaret sabit; bırakınca kaybolur; sürükleme tek `sim_chart_scrub` olayı |
| `tanitim_hiz_ve_kriz` | 4× hız ~4 kat ilerler; geçersiz hız yok sayılır; krize atlama doğru günde; tanıtım dışında ikisi de etkisiz |
| `piyasa_tarafsizligi` | 300 günlük takvimde kriz sonrası ortalama değişim ~0, olayların 2-3'ü yükselen, haber günleri kriz günleriyle uyumlu; tohum/takvim bozulursa kalır |
| `karar_karti_ve_uyari` | Karar kartı yalnızca bilgilendirmeden sonra; kart sayıları kararlarla ve işlem sayısıyla uyuşur; kartta grup/amaç ipucu yok; PNG 1080×1350; `summary_card` olayı; sabit uyarı satırı yalnızca görev ve simülatörde; ana ekran simgesi gömülü; portföy grafiği serisi gerçek son değerle uyuşur, işaret sayısı işlemlerle aynı |
| `alistirma_simulatoru` | Alıştırma gerçek simülatörden önce; işlem/sekme/detay olayı ve anlık görüntü kaydı yok, A grubunda bekleme ekranı yok; atlayınca ya da 20. günde tek `practice_sim` olayı; gerçek simülatör sıfırdan ve bekleme ekranıyla başlar |
| `on_test_puani` | Ön test 6 madde üzerinden; `pre_test_b3` yalnız ilk 3 maddeden; yeniden açılışta korunur; CSV'de iki sütun |
| `terim_aciklama` | Terim düğmesi sözlük metnini açar, piyasa durur, odak döner, `term_open` kaydı; iç içe düğme ve işlem penceresinde terim yok; geçersiz indeks yok sayılır |
| `canli_pano` | Şu an ekranda/durmuş listesi ve konumlar, test modu dışarıda, 24 saat uyarısı, otomatik yenileme koşulları |
| `kontrast_ve_kaynak_denetimi` | Metin renkleri iki temada WCAG AA (4,5:1); kırmızı zeminde sabit beyaz yazı yok |

`arac_testleri.py` (tarayıcısız, ~1 sn): yayın aracı `firebase/dagit.py` (ön kontrol, ölçüt kilidi, `--hazirla`, sahte `firebase` komutuyla `--yayinla`), saklama takvimi `etik/saklama_takvimi.py` (tarih hesabı, geçerli .ics) ve `.github/workflows/test.yml` (geçerli YAML, olmayan betik çağırmıyor). Bu testlerin yakalamasını bilinçli bozmayla da denedim (6 bozma, 6 yakalama; pilot formu denetimi sonradan eklendi, 1 bozma 1 yakalama). Ayrıca `ilk-lot.html` ve `tanitim.html` dış yazı tipi sunucusuna bağlanmıyor mu, `derle.py` yazı tipi dosyası eksikse duruyor mu denetlenir.

**Sınır:** Firebase testi sahte bir SDK'yla yapılır; gerçek sunucuyu ve güvenlik kurallarını sınamaz (`docs/GERCEK_CIHAZ_TESTI.md`). Testler masaüstü Chromium'da çalışır; gerçek telefon davranışını (klavye, ekran kilidi, uygulama içi tarayıcı) sınamaz.
| `erisilebilirlik_taramasi_calisiyor` | Keşif taraması gerçek uygulamada temiz biter; bilerek bozulmuş kopyada adsız düğmeyi ve yatay taşmayı yakalar; `--axe` verilince (sahte axe ile) çalışır |

## Erişilebilirlik keşif taraması

`erisilebilirlik_taramasi.py` testlerden ayrı bir keşif aracıdır: tüm ekranları gezer, her ekranda yatay taşma, adsız düğme/alan, küçük dokunma hedefi (< 24 px) ve düğme olmayan tıklanır öğe arar.

```
python erisilebilirlik_taramasi.py                      # 320/360/412 px
python erisilebilirlik_taramasi.py --koyu --hareket-azalt --yatay
python erisilebilirlik_taramasi.py --yazi 0 1 2          # üç yazı boyutunda tara (b22)
npm install axe-core@4.10.2                              # ağ erişimli bilgisayarda
python erisilebilirlik_taramasi.py --axe node_modules/axe-core/axe.min.js
```

**Ne yapmaz:** ekran okuyucunun gerçekte ne okuduğunu, gerçek telefonları, Safari/WebKit'i, odak sırasının anlamlı olup olmadığını denetlemez. Bunlar `docs/GERCEK_CIHAZ_TESTI.md` A13-A14 ve D bölümünde elle yapılır. Bulgu yok demek erişilebilir demek değildir.

