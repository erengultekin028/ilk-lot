# Güç duyarlılık analizi

Taban varsayımlar: sigma = 1,2, maruz kalma = %70, bölüm başına 4 deneme, 1. bölümde ~%50 satış, tekrar = 1500, tohum = 1. Hücre = birincil test gücü. OR = maruz kalan A katılımcısındaki gerçek odds oranı.

## Taban varsayımlarla grup başına n

| n | OR = 0,5 | OR = 0,4 |
|---|---|---|
| 40 | %29 | %44 |
| 60 | %39 | %59 |
| 80 | %48 | %73 |
| 100 | %58 | %79 |
| 150 | %75 | %94 |

## Kişiler arası değişkenlik (sigma), n = 60

| sigma | OR = 0,5 | OR = 0,4 |
|---|---|---|
| 0,6 | %42 | %63 |
| 1,2 | %39 | %59 |
| 2 | %36 | %55 |

## A grubunda bekleme ekranına maruz kalma oranı, n = 60

| Maruz kalma | Ek değişim (OR = 0,5) | OR = 0,5 | OR = 0,4 |
|---|---|---|---|
| %40 | -5,5 yp | %15 | %23 |
| %55 | -7,6 yp | %25 | %38 |
| %70 | -9,6 yp | %39 | %59 |
| %85 | -11,6 yp | %52 | %74 |
| %95 | -12,7 yp | %58 | %83 |

## Bölüm başına "sert düşüş + zarar" denemesi, n = 60

| Deneme | OR = 0,5 | OR = 0,4 |
|---|---|---|
| 4 | %39 | %59 |
| 6 | %53 | %76 |
| 8 | %65 | %86 |
| 12 | %80 | %96 |

## Birleşik iyileştirme: maruz kalma %95 ve bölüm başına 8 deneme

| n | OR = 0,5 | OR = 0,4 |
|---|---|---|
| 30 | %62 | %83 |
| 40 | %74 | %92 |
| 60 | %89 | %98 |
| 80 | %96 | %100 |

Bu analiz uygulamadaki mevcut tasarımı (4 deneme, %70 maruz kalma varsayımı) değiştirmez; "şu değişikliği yapsaydık gücümüz ne olurdu?" sorusu içindir.
