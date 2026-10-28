# İlk Lot: iş-zaman çizelgesi (Gantt) ve risk matrisi

> **Süreler öneridir.** Tarihler, çağrı kuralları ve etik kurulun onay süresi bilinmediği için **hafta numaraları göreli** verilmiştir (H1 = proje başlangıcı). Gerçek takvimi `docs/IS_ZAMAN_BUTCE_TASLAGI.md` ve başvuru çağrısının güncel kılavuzuyla doldurun. İş paketlerinin içeriği ve bağımlılıkları o belgededir; burası onların görsel özeti ve genişletilmiş risk tablosudur.

## 1. Gantt (24 haftalık örnek çerçeve)

Her sütun 2 haftadır (H1–2, H3–4, …). ■ = çalışılan dönem, ▨ = beklenen/kritik bekleme.

| İş paketi | H1–2 | H3–4 | H5–6 | H7–8 | H9–10 | H11–12 | H13–14 | H15–16 | H17–18 | H19–20 | H21–22 | H23–24 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Kararlar (`KARAR_PAKETI.md`), danışman toplantısı | ■ | ■ | | | | | | | | | | |
| 2. Literatür ve kuramsal çerçeve | ■ | ■ | ■ | | | | | | | | | |
| 3. Barındırma, gerçek cihaz testi, yedekleme düzeni | | ■ | ■ | | | | | | | | | |
| 4. Etik kurul başvurusu ve onay | | ■ | ▨ | ▨ | ▨ | | | | | | | |
| 5. Pilot (10–12 kişi) ve pilot raporu | | | | ■ | ■ | | | | | | | |
| 6. Uygulamayı dondur, ön kayıt (OSF) | | | | | | ■ | | | | | | |
| 7. Ana veri toplama | | | | | | | ■ | ■ | ■ | ■ | | |
| 8. Analiz ve rapor | | | | | | | | | | | ■ | ■ |
| 9. Paylaşım (poster, bildiri, açık kaynak sürümü) | | | | | | | | | | | ■ | ■ |

**Kritik yol:** 4 (etik onay süresi) ve 7 (katılım hızı). İkisi de uzayabilir; bu yüzden pilot ve veri toplamayı etik onaya göre kurun, tarih değil aralık verin.

## 2. Kilometre taşları ve kabul ölçütleri

| Kilometre taşı | Ne zaman tamam sayılır | Kanıt |
|---|---|---|
| M1: Kararlar kapandı | `KARAR_PAKETI.md` tablosunda açık satır yok | Belge |
| M2: Altyapı hazır | Gerçek cihaz testi geçti; `python firebase/dagit.py` HATA vermiyor; yedek alma denendi | `docs/GERCEK_CIHAZ_TESTI.md`, ön kontrol çıktısı |
| M3: Etik onay | Onay numarası alındı | Onay yazısı |
| M4: Pilot raporu | Anlaşılırlık, süre, tamamlama, teknik sorun raporlandı | Rapor |
| M5: Ön kayıt | OSF kaydı yapıldı, uygulama dondu (`--kilitle`), "yeni katılım başlat" seçeneği kapatıldı (karar paketi madde 17) | OSF bağlantısı, `firebase/yayin_kaydi.json` |
| M6: Veri toplama bitti | Hedef n ya da son tarih; test kayıtları ayrıldı | Pano, CSV |
| M7: Rapor ve paylaşım | Rapor, poster/bildiri, açık kaynak sürüm (DOI) | Çıktılar |

## 3. Risk matrisi

Olasılık ve etki: D = düşük, O = orta, Y = yüksek (sizin değerlendirmenizle güncellenmeli).

| # | Risk | Olasılık | Etki | Önlem / yedek |
|---|---|---|---|---|
| R1 | Etik onay gecikir | O | Y | Takvimi onaya göre kur; pilotun kapsamını kurula sor; bu sırada kuramsal bölüm ve altyapı sürer |
| R2 | Hedef n'ye ulaşılamaz | O | Y | Kanalları çeşitlendir; ulaşılan n ve güç ön kayıtta yazılı olduğu gibi raporlanır |
| R3 | **Ortak bağlantı herkese açık: davetli olmayanlar yuva tüketir ya da otomatik istek gelir** | O | O | Yuva listesini hedef n'den fazla üret; panelden alınan yuvayı izle; gerekirse listeyi kapat, bağlantıyı yalnızca oturum sırasında paylaş; (isteğe bağlı) Firebase App Check eklenmesi değerlendirilir |
| R4 | Veri kaybı veya bozulma | D | Y | Panelden haftalık Tam yedek (JSON) ve CSV; ana toplama tek sürümden; test kayıtları işaretlenir, silinmez |
| R5 | Teknik hata canlıda çıkar (b27 sonrası bekleme ekranı hatası gibi) | O | Y | Gerçek cihaz testi, pilot, uçtan uca testler ve DOM kimlik denetimi; kurallar emulator testleri; sürüm kilidi |
| R6 | Firebase kotası (ücretsiz katman) aşılır | D | O | Yazma sayısı ölçümü (`rapor/02_firebase_yazma_olcumu.md`); günlük katılımcıyı güvenli sayıda tut |
| R7 | KVKK/yurt dışı aktarım itirazı | O | Y | `KARAR_PAKETI.md` madde 1; erken görüş al; AB bölgesi ya da kurum sunucusu seçeneği |
| R8 | Onam metni ile uygulamanın gerçek davranışı çelişir ("verilerin silinir" / soft delete) | Y | Y | Onam v2 (madde 2) pilottan önce |
| R9 | Aynı kişi iki kez katılır (tarayıcı verisini silip yeniden girer) | O | D | Menüde uyarı; pilotta gözle; analizde küçük kayıp olarak raporla |
| R10 | Etki küçük/anlamsız çıkar | Y | O | Ön kayıt: güven aralığı ve TOST ile yorumla; "başarısız" değil bilimsel sonuç |
| R11 | Araştırmacı hesabı ele geçirilir ya da kaybolur | D | Y | 2FA, hesabı danışmanla paylaşılan kurtarma yolu, şifre yöneticisi; olay planı `VERI_YONETIM_PLANI.md` bölüm 4 |
| R12 | Katılımcı grubunu öğrenir ya da müdahaleyi konuşur (bulaşma) | O | O | Sınıf oturumlarında ayrı zamanlar; amaç debriefing'de açıklanır; grup bilgisi uygulamada görünmez |
| R13 | Danışman/araştırmacı zaman darlığı | O | O | Kilometre taşlarına tarih ver; paketleri küçük tut |
