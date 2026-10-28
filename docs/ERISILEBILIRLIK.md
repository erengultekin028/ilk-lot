# İlk Lot: erişilebilirlik (WCAG 2.1 A/AA, otomatik tarama)

> **Ne ölçüldü, ne ölçülmedi:** Otomatik tarama (axe-core 4.14, etiketler `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) yalnızca makinenin yakalayabildiği sorunları bulur (kontrast, etiket, rol, dil, başlık sırası vb.); genelde sorunların bir kısmını kapsar. **Ekran okuyucuyla, klavyeyle ve gerçek kullanıcıyla deneme yapılmadı.** "Erişilebilir" demeden önce gerçek cihaz testinde (`docs/GERCEK_CIHAZ_TESTI.md`) klavye ve ekran okuyucu denemesi eklenmelidir.

## Kapsam
`python testler/ekran_testleri.py "axe-core"` (≈90 sn). Her biri **koyu tema**, **açık tema** ve **açık tema + büyük yazı** için taranır:

| Katılımcı uygulaması (telefon 390 px ve masaüstü 1440 px) | Yönetim paneli |
|---|---|
| Onam, karar anı, simülatör (portföy, piyasa, analiz), hisse ayrıntısı, bekleme penceresi, menü penceresi | Yönetim paneli (giriş sonrası: yeni eklenenler, test kayıtları, tam yedek, diğer bölümler) |

Test CI'da çalışır (`.github/workflows/test.yml`); yeni bir ihlal eklenirse kırmızı olur. Üç mutasyonla doğrulandı: rolsüz `aria-label`, silinen sayfa dili (`<html lang>`), soluk metin rengi.

## Sonuç (26 Ekim 2026)
- **Koyu tema, büyük yazı:** ihlal yok.
- **Düzeltilen:** karar ekranındaki ilerleme çubuğu (`.steps`) rolsüz bir `div` üzerinde `aria-label` taşıyordu (`aria-prohibited-attr`); `role="img"` eklendi. Görünüm değişmedi.
- **Açık tema (b38'de düzeltildi, 28.10.2026):** simülatör portföyünde `-%x başlangıca göre` rozeti (`#portfolio-change`): kırmızı metin `#c2412d`, açık kırmızı rozet zemini (`#f0e4e2`) üzerinde **4,13:1** veriyordu, eşik **4,5:1** (WCAG 1.4.3). Araştırmacı onayıyla **seçenek A** uygulandı: açık temada `--dn` → `#b53a27` (**4,70:1**). Test artık bilinen istisna içermiyor (`BILINEN_ISTISNALAR` boş) ve eski renge dönülürse kırmızıya döner (mutasyonla doğrulandı).

## Karar kaydı: açık temadaki kırmızı rozet (A seçildi, uygulandı)
Bu renk **fiyat yönünü gösteren uyaran renkleridir** (iki grupta da aynı); değiştirmek, kayıp gösteriminin görünümünü küçük ölçüde değiştirir. Bu yüzden önce araştırmacıya sunuldu. **Seçilen: A.** Etkisi: açık temada tüm "kayıp" kırmızıları (grafik çizgisi, ▼ rozetleri, zarar yazıları) ≈ %6 koyulaştı; **koyu tema aynı**, fiyat yolu ve uyaran içeriği değişmedi. Pilot ve ana veri toplama bu renkle yapılacağı için, değişiklik **ön kayıttan önce** yapıldı. Aşağıdaki tablo karar anındaki seçenekleri gösterir.

| Seçenek | Ne değişir | Kontrast (rozet) | Not |
|---|---|---|---|
| **A. Açık temada `--dn` değerini `#b53a27` yap** (öneri) | Açık temada tüm "kayıp" kırmızıları biraz koyulaşır (grafik çizgisi, ▼ rozetleri, zarar yazıları); koyu tema aynı kalır | **4,70:1** (beyaz zeminde 5,83) | Ucuz; tek satır. Fark ≈ %6 parlaklık |
| B. Yalnızca rozetin zeminini açmak (`--dns` alfa 0,09 → 0,04) | Rozet zemini neredeyse kaybolur | 4,43:1, **hâlâ yetmez** | Tek başına çözmez |
| C. Olduğu gibi bırak, istisna olarak raporla | Hiçbir şey | 4,13:1 | Başvuruda "bilinen sınırlılık" olarak yazılır |

Hesap: WCAG göreli parlaklık formülü; fg `#c2412d` / `#bb3d2a` / `#b53a27` / `#b03725`, zemin `#f0e4e2` (rozet, sayfa zemini üstünde) ve `#faeeec` (rozet, beyaz kart üstünde; bu durumda mevcut renk 4,53:1 ile zaten geçer, yani sorun yalnızca gri sayfa zemini üstündeki rozette).

## Kapsam dışı / sonraki adımlar
- **Klavye:** Sekme sırası, odak göstergesi ve pencere tuzağı (modal) elle denenmedi.
- **Ekran okuyucu:** Hiç denenmedi (TalkBack/VoiceOver).
- **Ölçeklendirme:** Büyük yazı seçeneği (`data-fs`) taranıyor; tarayıcı yakınlaştırması (200%) elle denenmeli.
- **Hareket:** `prefers-reduced-motion` kuralları var (`motion-and-responsive.css`); elle denenmedi.
- **Renk körlüğü:** Yön yalnızca renkle verilmiyor (▲ ▼ simgeleri ve yüzdeler var); gerçek kullanıcı denemesi yapılmadı.
