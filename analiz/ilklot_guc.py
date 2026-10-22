"""Birincil testin (A × bölüm etkileşimi, kümeye dayanıklı lojistik) örneklem büyüklüğü simülasyonu.

Güç, veri üretim varsayımlarına bağlıdır: taban satış oranı, kişiler arası değişkenlik (sigma), bekleme
ekranına maruz kalma oranı ve gerçek etki. Bu betik varsayımları açıkça yazar ve I. tip hatayı
(OR = 1) ayrıca raporlar; kalibrasyon yoksa güç sayısına güvenilmez.

Kullanım:
  python ilklot_guc.py [--n 20 30 40 60 80 100 150] [--or 1 0.7 0.5 0.4 0.3] [--sigma 1.2]
                       [--maruz 0.7] [--kayip 0.1] [--tekrar 1000] [--cikti guc_tablosu.csv]
"""
import argparse
import math

import numpy as np
import pandas as pd
from scipy import stats
from scipy.special import expit

from ilklot_ortak import ALFA, BLOK_DENEME, MARUZ_KATSAYI, kalibre_lambda0, normal_beklenen


def beklenen_fark_yp(or_etki, sigma, taban, kayma, set_etkisi, maruz):
    """A grubunun B'ye göre beklenen EK değişimi (yüzde puan): maruz kalanda gerçek etki, maruz kalmayanda sıfır."""
    theta = math.log(or_etki)
    lam0 = kalibre_lambda0(maruz, sigma)

    def f(u):
        e = 1 - np.exp(-lam0 * np.exp(MARUZ_KATSAYI * u))
        fark = 0.0
        for s in (0.0, 1.0):
            eta = taban + u + kayma + set_etkisi * s
            fark = fark + 0.5 * (expit(eta + theta) - expit(eta))
        return e * fark
    return 100 * normal_beklenen(f, sigma)


def tasarim(n_grup):
    """Her grupta n_grup tamamlayan; set sırası gruplar içinde dengeli (X→Y / Y→X)."""
    N = 2 * n_grup
    A = np.repeat([0.0, 1.0], n_grup)
    set_pre = np.tile([0.0, 1.0], n_grup)
    X = np.zeros((2 * N, 5))
    X[:, 0] = 1
    X[0::2, 1] = A
    X[1::2, 1] = A
    X[1::2, 2] = 1
    X[1::2, 3] = A
    X[0::2, 4] = set_pre
    X[1::2, 4] = 1 - set_pre
    return N, A, set_pre, X


def toplu_lojistik(X, K, m, N, se_dondur=False):
    """Tüm tekrarlar için aynı anda IRLS + kümeye dayanıklı (CR1) etkileşim p değeri.
    Katılımcı başına iki satır (1. ve 3. bölüm) olduğundan küme toplamı satır çiftlerinin toplamıdır."""
    R, n = K.shape
    p = X.shape[1]
    beta = np.zeros((R, p))
    yak = np.zeros(R, bool)
    I = 1e-9 * np.eye(p)
    for _ in range(40):
        mu = expit(beta @ X.T)
        w = m * mu * (1 - mu)
        g = (K - m * mu) @ X
        H = np.einsum('rn,np,nq->rpq', w, X, X) + I
        adim = np.clip(np.linalg.solve(H, g[..., None])[..., 0], -5, 5)
        beta = beta + adim * (~yak)[:, None]
        yak |= np.abs(adim).max(axis=1) < 1e-9
        if yak.all():
            break
    basarisiz = (~yak) | (np.abs(beta).max(axis=1) > 20)
    mu = expit(beta @ X.T)
    w = m * mu * (1 - mu)
    H = np.einsum('rn,np,nq->rpq', w, X, X) + I
    ekmek = np.linalg.inv(H)
    skor = (K - m * mu)[:, :, None] * X[None]
    gt = skor.reshape(R, N, 2, p).sum(axis=2)
    et = np.einsum('rgp,rgq->rpq', gt, gt)
    Ntop = m * n
    duzelt = N / (N - 1) * (Ntop - 1) / (Ntop - p)
    V = duzelt * ekmek @ et @ ekmek
    se = np.sqrt(np.maximum(V[:, 3, 3], 1e-30))
    t = beta[:, 3] / se
    pv = 2 * stats.t.sf(np.abs(t), N - 1)
    if se_dondur:
        return beta[:, 3], pv, basarisiz, se
    return beta[:, 3], pv, basarisiz


def welch_degisim(K, n_grup, m=BLOK_DENEME):
    ch = (K[:, 1::2] - K[:, 0::2]) / m
    a, b = ch[:, n_grup:], ch[:, :n_grup]
    va, vb = a.var(axis=1, ddof=1), b.var(axis=1, ddof=1)
    se2 = va / n_grup + vb / n_grup
    t = (a.mean(axis=1) - b.mean(axis=1)) / np.sqrt(np.maximum(se2, 1e-30))
    df = se2 ** 2 / np.maximum((va / n_grup) ** 2 / (n_grup - 1) + (vb / n_grup) ** 2 / (n_grup - 1), 1e-30)
    return 2 * stats.t.sf(np.abs(t), df)


def simule(n_grup, or_etki, tekrar, sigma, taban, kayma, set_etkisi, maruz, rng, deneme=BLOK_DENEME):
    N, A, set_pre, X = tasarim(n_grup)
    lam0 = kalibre_lambda0(maruz, sigma)
    theta = math.log(or_etki)
    u = rng.normal(0, sigma, (tekrar, N))
    girisim = rng.poisson(lam0 * np.exp(MARUZ_KATSAYI * u))
    maruz_kaldi = ((girisim >= 1) & (A[None] == 1)).astype(float)
    eta_pre = taban + u + set_etkisi * set_pre[None]
    eta_post = taban + u + kayma + set_etkisi * (1 - set_pre)[None] + theta * maruz_kaldi
    K = np.zeros((tekrar, 2 * N))
    K[:, 0::2] = rng.binomial(deneme, expit(eta_pre))
    K[:, 1::2] = rng.binomial(deneme, expit(eta_post))
    b3, pv, bas, se = toplu_lojistik(X, K, float(deneme), N, se_dondur=True)
    pw = welch_degisim(K, n_grup, deneme)
    return dict(p_birincil=pv, basarisiz=bas, p_welch=pw, beta=b3, se=se, df=N - 1)


def tost_p(s, or_alt, or_ust):
    """Simülasyon çıktısı için TOST p değerleri (ilklot_ortak.tost_or ile aynı mantık, tüm tekrarlar birden)."""
    t_alt = (s['beta'] - math.log(or_alt)) / s['se']
    t_ust = (s['beta'] - math.log(or_ust)) / s['se']
    return np.maximum(stats.t.sf(t_alt, s['df']), stats.t.cdf(t_ust, s['df']))


def guc_tablosu(n_listesi, or_listesi, tekrar, sigma, taban, kayma, set_etkisi, maruz, kayip, seed, deneme=BLOK_DENEME, esdeger=None):
    rng = np.random.default_rng(seed)
    satirlar = []
    for n in n_listesi:
        for o in or_listesi:
            s = simule(n, o, tekrar, sigma, taban, kayma, set_etkisi, maruz, rng, deneme)
            tamam = ~s['basarisiz']
            satirlar.append(dict(
                n_grup_tamamlayan=n, n_grup_isealim=math.ceil(n / (1 - kayip)), or_gercek=o,
                ek_degisim_yp=round(beklenen_fark_yp(o, sigma, taban, kayma, set_etkisi, maruz), 1),
                guc_birincil=float(np.mean((s['p_birincil'] < ALFA) & tamam)),
                guc_welch=float(np.mean(s['p_welch'] < ALFA)),
                guc_tost=(float(np.mean((tost_p(s, *esdeger) < ALFA) & tamam)) if esdeger else np.nan),
                basarisiz_orani=float(np.mean(~tamam)),
                ort_tahmin_or=float(np.exp(s['beta'][tamam].mean())) if tamam.any() else np.nan,
                deneme_bolum=deneme, tekrar=tekrar))
    return pd.DataFrame(satirlar)


def duyarlilik_raporu(a):
    """Varsayımlar değişince güç nasıl değişiyor? Aynı rastgele sayılarla (ortak tohum) tek tek bozar."""
    def guc(n, o, **kw):
        p = dict(sigma=a.sigma, maruz=a.maruz, deneme=a.deneme)
        p.update(kw)
        rng = np.random.default_rng(a.seed)
        s = simule(n, o, a.tekrar, p['sigma'], a.taban, a.kayma, a.set_etkisi, p['maruz'], rng, p['deneme'])
        return float(np.mean((s['p_birincil'] < ALFA) & ~s['basarisiz']))
    n = a.duyarlilik_n
    print(f'# Güç duyarlılık analizi\n\nTaban varsayımlar: sigma = {vg(a.sigma)}, maruz kalma = %{100 * a.maruz:.0f}, bölüm başına {a.deneme} deneme, '
          f'1. bölümde ~%{100 * expit(a.taban):.0f} satış, tekrar = {a.tekrar}, tohum = {a.seed}. Hücre = birincil test gücü. OR = maruz kalan A katılımcısındaki gerçek odds oranı.\n')
    print('## Taban varsayımlarla grup başına n\n\n| n | OR = 0,5 | OR = 0,4 |\n|---|---|---|')
    for k in (40, 60, 80, 100, 150):
        print(f'| {k} | {yuzde(guc(k, 0.5))} | {yuzde(guc(k, 0.4))} |')
    print(f'\n## Kişiler arası değişkenlik (sigma), n = {n}\n\n| sigma | OR = 0,5 | OR = 0,4 |\n|---|---|---|')
    for v in (0.6, 1.2, 2.0):
        print(f'| {vg(v)} | {yuzde(guc(n, 0.5, sigma=v))} | {yuzde(guc(n, 0.4, sigma=v))} |')
    print(f'\n## A grubunda bekleme ekranına maruz kalma oranı, n = {n}\n\n| Maruz kalma | Ek değişim (OR = 0,5) | OR = 0,5 | OR = 0,4 |\n|---|---|---|---|')
    for v in (0.4, 0.55, 0.7, 0.85, 0.95):
        print(f'| %{100 * v:.0f} | {vg(beklenen_fark_yp(0.5, a.sigma, a.taban, a.kayma, a.set_etkisi, v), 1)} yp | {yuzde(guc(n, 0.5, maruz=v))} | {yuzde(guc(n, 0.4, maruz=v))} |')
    print(f'\n## Bölüm başına "sert düşüş + zarar" denemesi, n = {n}\n\n| Deneme | OR = 0,5 | OR = 0,4 |\n|---|---|---|')
    for v in (4, 6, 8, 12):
        print(f'| {v} | {yuzde(guc(n, 0.5, deneme=v))} | {yuzde(guc(n, 0.4, deneme=v))} |')
    print('\n## Birleşik iyileştirme: maruz kalma %95 ve bölüm başına 8 deneme\n\n| n | OR = 0,5 | OR = 0,4 |\n|---|---|---|')
    for k in (30, 40, 60, 80):
        print(f'| {k} | {yuzde(guc(k, 0.5, maruz=0.95, deneme=8))} | {yuzde(guc(k, 0.4, maruz=0.95, deneme=8))} |')
    print('\nBu analiz uygulamadaki mevcut tasarımı (4 deneme, %70 maruz kalma varsayımı) değiştirmez; "şu değişikliği yapsaydık gücümüz ne olurdu?" sorusu içindir.')


def yuzde(x):
    return f'%{100 * x:.0f}'


def vg(x, d=None):
    """Türkçe ondalık ayracı (virgül)."""
    return (f'{x:.{d}f}' if d is not None else f'{x:g}').replace('.', ',')


def main():
    ap = argparse.ArgumentParser(description='İlk Lot güç simülasyonu')
    ap.add_argument('--n', type=int, nargs='+', default=[20, 30, 40, 60, 80, 100, 150], help='Grup başına TAMAMLAYAN katılımcı sayıları')
    ap.add_argument('--or', dest='ors', type=float, nargs='+', default=[1.0, 0.7, 0.5, 0.4, 0.3], help='Maruz kalan A katılımcısındaki gerçek odds oranı (1 = etki yok, I. tip hata)')
    ap.add_argument('--sigma', type=float, default=1.2, help='Kişiler arası değişkenlik (logit SD)')
    ap.add_argument('--taban', type=float, default=0.0, help='Taban logit (0 = 1. bölümde %%50 satış)')
    ap.add_argument('--kayma', type=float, default=-0.2, help='3. bölümde iki grupta ortak değişim (logit)')
    ap.add_argument('--set-etkisi', type=float, default=0.2)
    ap.add_argument('--maruz', type=float, default=0.7, help='A grubunda bekleme ekranını görme oranı')
    ap.add_argument('--kayip', type=float, default=0.1, help='Tamamlamama oranı (işe alım sayısı için)')
    ap.add_argument('--deneme', type=int, default=BLOK_DENEME, help='Bölüm başına "sert düşüş + zarar" denemesi (uygulamada 4; "ya şöyle olsaydı" senaryoları için)')
    ap.add_argument('--tekrar', type=int, default=1000)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--cikti', default='guc_tablosu.csv')
    ap.add_argument('--esdeger-or', type=float, nargs='+', metavar='SINIR', help='TOST gücü de hesaplanır. Tek değer x > 1: [1/x, x]; iki değer: alt üst. Sınırı sen ya da danışman belirler; varsayılan yok')
    ap.add_argument('--duyarlilik', action='store_true', help='Varsayımlar değişince gücün nasıl değiştiğini yazdırır (tablo yerine)')
    ap.add_argument('--duyarlilik-n', type=int, default=60, help='Duyarlılık analizinde grup başına n')
    a = ap.parse_args()
    if a.duyarlilik:
        duyarlilik_raporu(a)
        return
    esdeger = None
    if a.esdeger_or is not None:
        v = a.esdeger_or
        if len(v) == 1 and v[0] > 1:
            esdeger = (1 / v[0], v[0])
        elif len(v) == 2 and 0 < v[0] < 1 < v[1]:
            esdeger = (v[0], v[1])
        else:
            ap.error('--esdeger-or: tek değer 1\'den büyük olmalı (ör. 2) ya da iki değer alt < 1 < üst (ör. 0.5 2)')
    t = guc_tablosu(a.n, a.ors, a.tekrar, a.sigma, a.taban, a.kayma, a.set_etkisi, a.maruz, a.kayip, a.seed, a.deneme, esdeger)
    t.to_csv(a.cikti, index=False, encoding='utf-8-sig')
    print(f'VARSAYIMLAR: 1. bölümde ~%{100 * expit(a.taban):.0f} satış, sigma = {vg(a.sigma)}, A grubunun %{100 * a.maruz:.0f}\'i bekleme ekranını görüyor, '
          f'ortak kayma = {vg(a.kayma)}, bölüm başına {a.deneme} deneme, tekrar = {a.tekrar}. Güç = anlamlı sonuç oranı (α = {ALFA}, iki yönlü).\n')
    print('Birincil test gücü (satır: grup başına tamamlayan; sütun: maruz kalanda gerçek OR). OR = 1 sütunu I. tip hatadır (≈ %5 olmalı).')
    ors = sorted(set(t.or_gercek), reverse=True)
    ek = {o: t[t.or_gercek == o].ek_degisim_yp.iloc[0] for o in ors}
    baslik = '| Grup başına n (işe alım) | ' + ' | '.join(f'OR = {vg(o)}' + ('' if o == 1 else f' (ek {vg(ek[o])} yp)') for o in ors) + ' |'
    print(baslik)
    print('|' + '|'.join(['---'] * (len(ors) + 1)) + '|')
    for n in sorted(set(t.n_grup_tamamlayan)):
        x = t[t.n_grup_tamamlayan == n]
        print(f'| {n} ({x.n_grup_isealim.iloc[0]}) | ' + ' | '.join(yuzde(x[x.or_gercek == o].guc_birincil.iloc[0]) for o in ors) + ' |')
    print('\n%80 güce ulaşılan en küçük n (grup başına tamamlayan):')
    for o in ors:
        if o == 1:
            continue
        x = t[(t.or_gercek == o) & (t.guc_birincil >= 0.8)]
        if len(x):
            en_kucuk = x.loc[x.n_grup_tamamlayan.idxmin()]
            print(f'  OR = {vg(o)} (ek {vg(ek[o])} yp): {int(en_kucuk.n_grup_tamamlayan)} ({int(en_kucuk.n_grup_isealim)} işe alım)')
        else:
            print(f'  OR = {vg(o)} (ek {vg(ek[o])} yp): taranan en büyük n ({max(a.n)}) ile bile ulaşılamadı')
    if esdeger:
        print(f'\nEşdeğerlik (TOST) gücü: aralık OR ∈ [{vg(esdeger[0], 2)}; {vg(esdeger[1], 2)}], α = {vg(ALFA)} (her iki tek yönlü test). Satır: grup başına tamamlayan; sütun: maruz kalanda gerçek OR.')
        print('DİKKAT: sütunlar MARUZ KALANDAKİ kişiye özgü OR\'dir; test edilen birincil OR ise iki nedenle 1\'e doğru seyreltilir: '
              '(1) A\'nın bir kısmı bekleme ekranını hiç görmez, (2) popülasyon ortalamalı OR kişiye özgü OR\'den 1\'e daha yakındır. '
              'Sonuç: etkisi sınırın tam üzerinde olan bir müdahale bile sık sık "eşdeğer" çıkar (seyreltme olmasaydı güç ≈ %5 olurdu). '
              'Sınırı bu seyreltmeyi hesaba katarak seç ve eşdeğerliği "etki yok" kanıtı olarak sunma.')
        print('| Grup başına n | ' + ' | '.join(f'OR = {vg(o)}' for o in ors) + ' |')
        print('|' + '|'.join(['---'] * (len(ors) + 1)) + '|')
        for n in sorted(set(t.n_grup_tamamlayan)):
            x = t[t.n_grup_tamamlayan == n]
            print(f'| {n} | ' + ' | '.join(yuzde(x[x.or_gercek == o].guc_tost.iloc[0]) for o in ors) + ' |')
    print(f'\nGüç tahminlerinin standart hatası en fazla ±{vg(100 * math.sqrt(0.25 / a.tekrar), 1)} puan. Sonuç dosyası: {a.cikti}')


if __name__ == '__main__':
    main()
