"""Bilgi düzeyi × grup × bölüm üçlü etkileşimi için simülasyonla güç (keşifsel analiz; docs/ON_KAYIT_TASLAGI.md).

Kullanım:  python ilklot_bilgi_guc.py [--tekrar 300] [--seed 1]
Varsayımlar (ön kayıttaki sayılarla aynı): log-OR(A×bölüm) = −0,70 + 0,35·z (z = standartlaştırılmış ön test puanı);
yani z = −1'de OR ≈ 0,35, z = +1'de OR ≈ 0,70; kişiler arası SD = 1,2; A grubunun %70'i bekleme ekranını görüyor; 4 deneme/bölüm.
Çıktı: grup başına 60, 100, 150 kişi için güç ve etkileşim yokken (b3 = 0) I. tip hata. Varsayımlar değişirse sonuç değişir."""
import argparse

import numpy as np
from scipy.special import expit

from ilklot_ortak import bilgi_modeli


def guc(n_grup, b_a, b_3, tekrar, seed, sigma=1.2, maruz=0.7):
    rng = np.random.default_rng(seed)
    isabet = tamam = 0
    for _ in range(tekrar):
        n = 2 * n_grup
        A = np.r_[np.ones(n_grup), np.zeros(n_grup)]
        z = rng.standard_normal(n)
        u = rng.normal(0, sigma, n)
        eff = A * (b_a + b_3 * z) * np.where(A == 1, rng.random(n) < maruz, 0)
        pre = rng.binomial(4, expit(u)) / 4
        post = rng.binomial(4, expit(u - 0.2 + eff)) / 4
        sira = np.where(rng.random(n) < .5, 'X→Y', 'Y→X')
        r = bilgi_modeli(A, pre, post, sira, z)
        if r['basarisiz']:
            continue
        tamam += 1
        isabet += r['p'] < 0.05
    return isabet / max(tamam, 1), tamam


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--tekrar', type=int, default=300)
    ap.add_argument('--seed', type=int, default=1)
    a = ap.parse_args()
    for n in (60, 100, 150):
        g, k = guc(n, -0.70, 0.35, a.tekrar, a.seed)
        print(f'grup başına {n}: güç ≈ %{100 * g:.0f} ({k} tekrar tamam)')
    g, k = guc(100, -0.70, 0.0, a.tekrar, a.seed + 1)
    print(f'etkileşim yok (grup başına 100): I. tip hata ≈ %{100 * g:.0f}')
