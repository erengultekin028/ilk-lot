# b27 dönüşüm raporu (25 Ekim 2026)

**Dal:** `mimari` (yerelde; GitHub'a gönderilmedi). Önceki durum: `refaktor` dalı (b26). **Testleri sen koşacaksın; ben tarayıcıda, gerçek Firebase'de ya da Python/emulator test takımlarında hiçbir şeyi koşmadım.** Aşağıda "yapıldı" yazanlar kod olarak vardır; "doğrulandı" yazanlar yalnızca belirtilen statik/hesaplamalı denetimdir.

## 1. Ne yapıldı

| # | İş | Durum |
|---|---|---|
| 1 | **Kodla giriş kalktı.** Katılımcı onamdan sonra anonim girişle sıradaki yuvayı alır; grup `allocations/{kod}` kaydından gelir. Kart/QR, `#k=` bağlantısı, "başka cihazda devam et" kaldırıldı. | Yazıldı, denenmedi |
| 2 | **Güvenlik kuralları yeniden yazıldı** (`meta/counter`, `slots`, `claims`, `users`, `allocations`, `participants`, `events`, `selftest`); hiçbir silme izni yok. 16 emulator testi yazıldı (`firebase/kural_testleri/kural.test.js`). | Yazıldı, **koşulmadı** |
| 3 | **MVVM yeniden yapılandırma:** tek `kaynak/` + `derle.py` → `public/src/` (constants, models, viewmodels, views, widgets, services, repositories, utils, admin, vendor). 276 üst düzey öğe, ~1.060 iç değişken, 90 durum alanı, 94 eylem, 64 DOM kimliği, 188 CSS sınıfı İngilizce ve standart adlara çevrildi. Yorumlar Türkçe. Eski→yeni tablo: `docs/ESKI_YENI_ADLAR.md`. | Yapıldı (otomatik, kapsam duyarlı araçla) |
| 4 | **Yönetim paneli ayrıldı:** `public/admin/index.html` + `public/src/admin/`. Katılımcı uygulaması admin kodunu içe aktarmaz. Panel masaüstü öncelikli (`styles/admin.css`). | Yazıldı, denenmedi |
| 5 | **Örnek/yerel veri kaldırıldı:** yerel kayıt kipi, 40 örnek kod, tanıtım (`?demo=1`), hızlı test (`?hizli=1`), `?pilot=1`, `?oturum=`; `claude.ai` indirme köprüsü. Bağlantı yoksa "Bağlantı kurulamadı" ekranı. Simülatörün kurgusal fiyat/haber/kriz içeriği (araştırma uyaranı) KALDI. | Yapıldı |
| 6 | **Geniş ekran:** `styles/desktop.css` (≥768 px panel görünümü, ≥1100 px simülatörde iki sütun). `< 768 px` hiçbir CSS satırı değişmedi. | Yazıldı, **görsel doğrulanmadı** |
| 7 | **Web standartları:** `package.json`, ESLint, Prettier, `.editorconfig`, `firebase.json` Hosting yapılandırması, `dagit.py` yeni yapıya uyarlandı, CI tanımı güncellendi, belgeler yeniden yazıldı. | Yapıldı |

## 2. Doğrulananlar (denetim türü: statik / hesaplamalı)
- **Uyaran ve fiyat yolu eşdeğerliği:** `node tools/check-equivalence.mjs <eski ilk-lot.html>` — eski b26 kodu ile yeni modüller aynı sonucu verdi: uyaran parmak izi, X/Y karar setleri, alıştırma uyaranları, 300 günlük çalışma fiyat yolu özeti (`3171573551 18600`). Bu, **modelin** değişmediğini gösterir; ekranları göstermez.
- `npm run lint`: 0 hata (10 uyarı: ölü kod). `npm run check:modules`: iki giriş noktasında da tüm modüller bağlandı. `npm run check:classes`: JS'te kullanılan CSS sınıflarının hepsi CSS'te tanımlı (yalnızca poster/kart iç belgelerinin kendi sınıfları ve 3 eskiden de stilsiz olan kanca sınıf hariç).
- Python dosyaları sözdizimi olarak derleniyor (`arac_testleri.py`); koşulmadı.

## 3. Senin koşacakların (sıra önerisi)
1. `npm install` → `npm run lint` → `npm run check:modules` → `npm run check:classes`
2. `cd firebase/kural_testleri && npm install && npm test` (**16 test; yeni güvenlik kuralları. Kırmızı varsa kuralları yayınlama.**)
3. `python testler/arac_testleri.py`, `python analiz/test_betikler.py`
4. `python firebase/dagit.py` (şu an yalnızca `[DOLDUR]` alanlarından ve iletişim adresinden HATA verir; bunlar sende)
5. `npm run serve` → tarayıcıda `http://localhost:8088/admin/`: giriş, "Sistem testini çalıştır", "Yeni liste" (8 kişi) → konsolda `allocations`, `slots`, `meta/counter` var mı? **Önce kuralları yayınla** (`firebase deploy --only firestore:rules` ya da konsola yapıştır); yayınlanmamış eski kurallarla yeni akış çalışmaz.
6. `http://localhost:8088/` (aynı tarayıcıda panelden çıkış yaptıktan sonra): onam → akış başlıyor mu? Konsolda `users`, `claims`, `participants/{kod}`, `events` oluştu mu? Sayfa yenile → devam ediyor mu?
7. Telefon (360–412 px) ve masaüstü (1280+ px) görünümü: eski görünümle karşılaştır. Özellikle: karar ekranları, simülatör (portföy/piyasa/analiz/hisse detayı/işlem penceresi/bekleme ekranı), bitiş ve serbest mod. **CSS sınıfı yeniden adlandırma görsel olarak doğrulanmadı**; bozuk bir stil görürsen `docs/ESKI_YENI_ADLAR.md` ile eşleştir.
8. `firebase/KURULUM.md` "Kontrol listesi".

## 4. Bilinen riskler ve eksikler (dürüst liste)
- **Yazılırken hiçbir ekran açılmadı.** Olası kırılma noktaları: ES modül döngüleri (statik olarak bağlanıyor ama çalışma zamanı denenmedi), CSS sınıfı/id yeniden adlandırması, geniş ekran ızgarası (`desktop.css` kuralları ekran yapısına göre tahminle yazıldı), yönetim sayfasının stilleri.
- **Yeni katılım akışı** (anonim giriş + işlem) ve **kurallar** gerçek Firebase/emulator'de denenmedi. Kural sürümünde `string()` gibi riskli işlevden kaçınıldı; yine de emulator testleri bilinmeyen bir kural hatası gösterebilir.
- **Python tarayıcı testleri** (`uygulama_testleri.py`, `erisilebilirlik_taramasi.py`, `gorsel_karsilastirma.py`; `etik/materyalleri_uret.py` de `uygulama_testleri`'ni içe aktardığı için ekran görüntüleri üretemez) eski yapıya bağlı; **çalışmaz, yeniden yazılmalı** (`testler/README.md`). Kapsam listesi README'de duruyor. Ekran görüntü referansları (`testler/gorsel_referans`) eski görünümü gösterir; yeni yapıyı eskiyle karşılaştırmak için işe yarar.
- **Yerel değişken adları** kural tabanlı üretildi; bazıları yaklaşık olabilir (ör. bazı `data`, `value`, `item`, `target` adları). Davranışı etkilemez; okunabilirliği elle iyileştirilebilir. `public/src/` içindeki kod artık kaynak gerçeğidir: araçla yeniden üretilmez (üretim araçları silindi, git geçmişinde `tools/refactor`).
- **Onam metni DEĞİŞMEDİ** ve silme politikası A ile hâlâ çelişiyor ("verilerin silinir"); `etik/ONAM_DEGISIKLIK_ONERISI_A.md` onay bekliyor. Çekilme penceresinde ve "çekildin" ekranında da eski ifade duruyor (onay sonrası değişecek).
- **Anonim kullanıcı kaybı:** tarayıcı verisi silinirse ya da başka tarayıcıdan/ana ekran kısayolundan girilirse aynı kişi yeni yuva alır; kart sisteminde fiziksel sınır vardı. Pilotta izle. Menüde katılımcıya uyarı yazıldı.
- **Firestore konumu nam5 (ABD)** KVKK açısından hâlâ danışmanla netleşmeli.
- **Firebase Authentication oturumu paylaşımı:** panel ve katılımcı sayfası aynı sitede ise aynı tarayıcıda birbirinin oturumunu değiştirir; ayrı Hosting sitesi öneriliyor (`KURULUM.md` bölüm 4).
- `docs/` ve `etik/` belgelerinde eski ifadeler (kart, QR kartı, kod girişi, `kaynak/`, `ilk-lot.html`, `derle.py`) kalmış olabilir; listelenenler `etik/ONAM_DEGISIKLIK_ONERISI_A.md` sonundaki b27 notunda. Tam tarama yapılmadı.

## 5. Süre
Tahmin: 4,5–6,5 iş günü. Gerçekleşen: tek uzun oturum. Bunun nedeni test koşmadan, araçla dönüştürerek ilerlemekti; bedeli yukarıdaki "denenmedi" listesidir.

## 6. Sonraki adım önerisi
Önce kural testleri ve yerelde sunucuyla gözle kontrol; sorunlar çıkarsa bana kısa listele (ekran görüntüsü + hangi adım). Her şey yolundaysa: onam metni onayı → `mimari` dalını GitHub'a gönder → Hosting yayını → gerçek cihaz protokolü.
