# Simülatör tohumu (300 günlük takvim)

**Durum:** `CFG.simSeed = 'ilklot-sim4-v2669'`, `simTicks = 300`, `simTickMs = 1500` (7,5 dk). Pilot başladıktan sonra bu alanlar ve `simCrises` değiştirilmez.

## Neden tohum seçiliyor?
Simülatör rastgele ama tohumla belirlenir: herkes aynı piyasayı görür. Tasarım "nötr piyasa"dır: kriz dışında yön yok. Rastgele bir tohumda krizden sonra hisseler kendiliğinden toparlanabilir ya da düşmeye devam edebilir. Bu, "satmak doğru muydu?" algısını katılımcılar arasında değil **tohum yüzünden** sistematik biçimde kaydırır. Bu yüzden 3000 aday tohum içinden aşağıdaki ölçütlere uyanlar seçildi.

## Takvim
| Kriz | Başlangıç günü | Süre | Düşüş | Hisseler |
|---|---|---|---|---|
| 1 | 52 | 7 | %18 | TUPRS, KOZAL |
| 2 | 135 | 7 | %20 | ASELS |
| 3 | 218 | 7 | %16 | THYAO, PGSUS |

Olumsuz haberler: 46 (uyarı) ve 52, 129 ve 135, 212 ve 218. Son kriz bitişi (gün 224) ile oturum sonu (300) arası 76 gün. BIMAS krizsiz kontrol hissesidir.

Tarafsız haberler (b18): 17 madde (günler 0, 10, 22, 34, 40, 82, 90, 100, 112, 122, 172, 195, 204, 250, 262, 276, 288). Uyarı ve kriz haberlerinin günü ve metni değişmedi; her kriz için uyarıdan (kriz günü −6) kriz bitişinden 20 gün sonrasına kadar olan pencerede yeni haber yok (46–79, 129–162, 212–245). Tarafsız haberlerin yönü 0; fiyatı etkilemezler (haberler fiyat üretmez, yalnızca ekranda gösterilir). Aynı tablo iki gruba da gösterilir.

## Ölçütler (hepsi birden)
Her kriz-hisse olayı için (5 olay) kriz dibinden **sona** ve **dipten 20 gün sonraya** değişim:
1. Olayların ortalaması her iki ufukta da |%0,5| içinde.
2. Olayların 2-3'ü yükselmiş (her iki ufukta).
3. Tek bir olayın değişimi |%6| içinde.
4. İlk krizden önce hiçbir hisse başlangıçtan %4,5'ten fazla sapmamış.
5. BIMAS toplam |%3,5| içinde.
6. Hiçbir fiyat 1'in altına inmemiş.

**Bu ölçütler benim seçimimdir, bilimsel bir standart değil.** Eşikleri değiştirmek farklı tohum seçtirir; gerekçeyi etik kurula/danışmana siz savunmalısınız.

## Seçilen tohumun değerleri
| Ölçüt | Değer |
|---|---|
| Dipten sona ortalama | +%0,17 |
| Dipten +20 gün ortalama | −%0,03 |
| Yükselen olay (son / +20) | 3 / 2 (5 üzerinden) |
| En büyük tek olay (son) | %3,0 |
| İlk krizden önce en büyük sapma | %2,2 |
| BIMAS toplam | +%0,1 |

3000 adaydan 96'sı ölçütleri geçti; geçenler arasında bileşik sapma en küçük olan seçildi.

## Yeniden arama
```
node analiz/simulator_tohum_ara.js 300 '[{"at":52,"len":7,"drop":0.18,"stocks":["TUPRS","KOZAL"]},{"at":135,"len":7,"drop":0.20,"stocks":["ASELS"]},{"at":218,"len":7,"drop":0.16,"stocks":["THYAO","PGSUS"]}]' ilklot-sim4-v 3000
```
Araç, `kaynak/02_core.js` içindeki `simInit/simStep` ile aynı üretimi kullanır (elle kopya; o fonksiyonlar değişirse araç da güncellenmeli). Uygulama testi `piyasa_tarafsizligi` aynı ölçütleri uygulamanın kendi kodu üzerinde sınar; takvim ya da tohum bozulursa kalır.

## Uyarılar
- Eski tohum `ilklot-sim2-v80` 400 günlük takvim içindi; yeni takvimde **geçersizdir**.
- `docs/BEKLEYEN_150_GUN.md` 150 günlük ayrı bir plandır ve uygulanmamıştır; kendi takvimine göre ayrı tohum gerekir.
- Takvim değiştiyse fiyat serileri değişmiştir: eski sürümle toplanmış veri (varsa) yeni sürümle karşılaştırılamaz.


## Serbest mod (b19)

Çalışma tohumu (yukarıdaki kriz ve haber takvimi) serbest modda KULLANILMAZ ve değişmedi. Serbest modda her oyun yeni bir tohumdan başlar; olaylar (düşüş ya da yükseliş, bazıları tüm piyasayı kapsar) ve haberler ileriye doğru üretilir (`freePlan`, `kaynak/02_core.js`). Zorluk parametreleri `FREE_LV` içindedir. Çalışma fiyat yolunun değişmediği testle sabitlenmiştir (`serbest_mod_calisma_simulatorunu_degistirmez`).

**b23 özelleştirmeler** (hepsi yalnızca serbest modda, çalışma simülatörüne dokunmaz): (1) *Kayıp sınırı* zorluğun varsayılanı ya da %10/%20/%30/%50 (`freeLim`). (2) *Senaryo* (`FREE_SC`): Rastgele (b19-b22 ile birebir aynı takvim, testle sabit), Sakin dönem (olay aralığı ×1,6, büyüklük ×0,7), Kriz dönemi (aralık ×0,7, büyüklük ×1,1, yükseliş olasılığı 0,25), Yükseliş dönemi (yükseliş olasılığı 0,75). Çarpanlar `rnd2` çağrı sırasını değiştirmez. Kriz dönemi sürüklenmeyi bilerek negatif yapar: pasif tutan oyuncu için simülasyonda (100 tohum) Orta+Kriz ortalama 291 günde, Zor+Kriz 81 günde bitti; Tamamen nakit portföy hiçbir ayarda bitmedi (hisse alınmadıkça kayıp yok). Yalnızca basit stratejilerle ayarlandı, insan oyunuyla denenmedi. (3) *Başlangıç portföyü* (`FREE_PF`): Dengeli (çalışmadaki gibi), Tamamen nakit, Hisse ağırlıklı (%90 hisse). (4) *Piyasa hızı*: duraklat/1×/2×/4× (`S.free.speed`). (5) *Otomatik sat emri* (`freeOrders`): hisse başına zarar eşiği (−%5/10/15/20) ve kâr eşiği (+%10/20/30), ortalama alış fiyatına göre; tetiklenince hissenin tamamı o anki fiyattan satılır (sert düşüşte eşiğin altında olabilir), emir bir kez çalışır.
