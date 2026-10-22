"""Uygulamanın dışa aktardığı CSV biçiminde, bilinen etkili SAHTE katılımcı verisi üretir.

Amaç: analiz betiğini ve güç hesabını gerçek veri gelmeden denemek. Üretilen veri gerçek değildir;
varsayımlar (taban oran, kişiler arası değişkenlik, maruz kalma oranı) komut satırından değiştirilebilir.

Kullanım:
  python ilklot_ornek_veri.py --n-grup 40 --or 0.5 --seed 1 --cikti ornek
  -> ornek_katilimci.csv ve ornek_olaylar.csv
"""
import argparse
import json
import math
import string

import numpy as np
import pandas as pd
from scipy.special import expit

from ilklot_ortak import kalibre_lambda0, MARUZ_KATSAYI

KATILIMCI_KOLONLARI = ['app_version', 'code', 'grp', 'set_order', 'completed', 'decisions', 'panic_rate_pre',
    'panic_rate_post', 'panic_rate_change', 'sell_rate_crisis_pre', 'sell_rate_crisis_post', 'sell_rate_gain_pre',
    'sell_rate_loss_pre', 'sell_rate_gain_post', 'sell_rate_loss_post', 'disposition_pre', 'disposition_post',
    'buy_more_crisis_pre', 'buy_more_crisis_post', 'rt_median_pre_ms', 'rt_median_post_ms', 'sim_trades', 'sim_sells',
    'sim_loss_sells', 'sim_loss_sells_crisis', 'sim_buys', 'sim_sell_reasons', 'cooldown_shown', 'cooldown_cancel',
    'cooldown_proceed', 'sim_time_portfolio_s', 'sim_time_market_s', 'sim_time_analysis_s', 'reading_s', 'stress_pre',
    'stress_sim', 'stress_post', 'updated_at', 'test_mode', 'pre_test', 'pre_test_b3', 'post_test', 'attention_pass',
    'comprehension_first_try', 'help_opens', 'manip_saw_wait', 'purpose_guess', 'age', 'gender', 'field', 'year',
    'invest_exp', 'sim_exp', 'consent_version', 'consent_sections_opened', 'consent_downloaded', 'consent_read_s',
    'pilot_clear', 'pilot_duration', 'pilot_unease']
OLAY_KOLONLARI = ['app_version', 'code', 'grp', 'session', 'n', 'ts', 'trial_index', 'type', 'data']

SURUM = '2026.10.04-q1'
SELL_WHY = ['Planım buydu', 'Haber yüzünden', 'Korktum', 'Diğerleri satıyor', 'Söylemek istemiyorum']
# [hisse, sektör, piyasa, pozisyon, sürü bilgisi var mı, sonuç yönü] — uygulamadaki sabit setlerin yaklaşık karşılığı
SETLER = {
    'X': [('GARAN', 'Bankacılık', 'normal', 'zarar', False, -1), ('FROTO', 'Otomotiv', 'kriz', 'zarar', False, -1),
          ('TCELL', 'Telekom', 'kriz', 'zarar', True, -1), ('EREGL', 'Demir çelik', 'normal', 'kar', True, 1),
          ('SISE', 'Cam', 'kriz', 'zarar', False, 1), ('ULKER', 'Gıda', 'kriz', 'zarar', True, 1)],
    'Y': [('AKBNK', 'Bankacılık', 'normal', 'kar', True, -1), ('TOASO', 'Otomotiv', 'kriz', 'zarar', False, -1),
          ('TTKOM', 'Telekom', 'kriz', 'zarar', True, 1), ('KCHOL', 'Holding', 'kriz', 'zarar', True, -1),
          ('ARCLK', 'Beyaz eşya', 'kriz', 'zarar', False, 1), ('MGROS', 'Perakende', 'normal', 'zarar', False, 1)]}
YAS = ['18–20', '21–23', '24–26', '27 ve üzeri', 'Belirtmek istemiyorum']
CINSIYET = ['Kadın', 'Erkek', 'Diğer', 'Belirtmek istemiyorum']
ALAN = ['İktisadi ve idari bilimler', 'Mühendislik ve fen', 'Sağlık', 'Sosyal ve beşeri', 'Diğer']
SINIF = ['Hazırlık / 1', '2', '3', '4 ve üzeri', 'Lisansüstü']
DOGRU_TAHMIN = ['bekleme süresinin satışı azaltıp azaltmadığını', '10 saniye bekletmenin etkisini', 'satmadan önce beklemeyi ölçüyorlar']
DIGER_TAHMIN = ['panik satışı ölçüyorlar', 'risk alma davranışını', 'borsa bilgisini', 'stresi', 'yatırım kararlarını', 'sürüye uymayı']


def kod_uret(rng, kullanilan):
    alfabe = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    while True:
        k = ''.join(rng.choice(list(alfabe), 12))
        k = k[:4] + '-' + k[4:8] + '-' + k[8:]
        if k not in kullanilan:
            kullanilan.add(k)
            return k


def g(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return ''
    return '%g' % v


def kayma_ekle(kayma, bolum):
    return kayma if bolum == 1 else 0.0


def blok_dagit(n, rng):
    """Uygulamadaki gibi: her 4 kişilik blokta 2 A + 2 B, set sırası (X→Y / Y→X) gruplar içinde dengeli."""
    liste = []
    while len(liste) < n:
        blok = [('A', 0), ('A', 1), ('B', 0), ('B', 1)]
        rng.shuffle(blok)
        liste += blok
    return liste[:n]


def uret(n_grup=40, or_etki=0.5, sigma=1.2, taban=0.0, kayma=-0.2, set_etkisi=0.2, maruz=0.7, kayip=0.08,
         surup_etkisi=0.4, test_sayisi=2, seed=1):
    rng = np.random.default_rng(seed)
    N = 2 * n_grup
    theta = math.log(or_etki)
    lam0 = kalibre_lambda0(maruz, sigma)
    kodlar = set()
    dagit = blok_dagit(N, rng)
    satirlar, olaylar = [], []
    sira_no = {}
    for i in range(N + test_sayisi):
        test = i >= N
        grp, order = dagit[i % N] if not test else ('A', 0)
        siralama = 'X→Y' if order == 0 else 'Y→X'
        u = rng.normal(0, sigma)
        kod = kod_uret(rng, kodlar)
        deneme = rng.poisson(lam0 * math.exp(MARUZ_KATSAYI * u))
        maruz_kaldi = (grp == 'A') and deneme >= 1
        tamam = (not test) and rng.random() > kayip
        karar = 12 if (tamam or test) else int(rng.choice([3, 6, 6, 8, 10]))
        sets = ['X', 'Y'] if order == 0 else ['Y', 'X']
        denemeler = []
        for bolum, set_ad in enumerate(sets):
            for (hisse, sektor, piyasa, poz, surup, yon) in SETLER[set_ad]:
                set_y = 1 if set_ad == 'Y' else 0
                ek = 0.0 if (piyasa == 'kriz') else (0.4 if poz == 'kar' else -0.4)
                eta = taban + u + kayma_ekle(kayma, bolum) + set_etkisi * set_y + ek
                if piyasa == 'kriz' and surup:
                    eta += surup_etkisi
                if bolum == 1 and maruz_kaldi and piyasa == 'kriz' and poz == 'zarar':
                    eta += theta
                sat = rng.random() < expit(eta)
                al = (not sat) and piyasa == 'kriz' and rng.random() < 0.2
                son = 'sat' if sat else ('al' if al else 'tut')
                out = yon * 0.04
                denemeler.append(dict(block='pre' if bolum == 0 else 'post', set=set_ad, sym=hisse, kind=piyasa, pos=poz,
                                      crowd=(70 if (surup and piyasa == 'kriz') else 45) if surup else None, out=out, final=son,
                                      rt=int(rng.lognormal(7.6 + (0.1 if piyasa == 'kriz' else 0), 0.35))))
        gor = denemeler[:karar]
        satir = _satir(rng, kod, grp, siralama, tamam, karar, gor, u, maruz_kaldi, deneme, test, i, sira_no)
        satirlar.append(satir)
        olaylar += _olaylar(kod, grp, gor, satir, rng, tamam or test)
    df = pd.DataFrame(satirlar, columns=KATILIMCI_KOLONLARI)
    ol = pd.DataFrame(olaylar, columns=OLAY_KOLONLARI)
    return df, ol


def _oran(gor, blok, kosul, hedef='sat'):
    a = [d for d in gor if d['block'] == blok and kosul(d)]
    if not a:
        return ''
    return g(round(sum(1 for d in a if d['final'] == hedef) / len(a), 2))


def _medyan(a):
    a = sorted(a)
    if not a:
        return ''
    n = len(a)
    return g(a[(n - 1) // 2] if n % 2 else round((a[n // 2 - 1] + a[n // 2]) / 2))


def _satir(rng, kod, grp, siralama, tamam, karar, gor, u, maruz_kaldi, deneme, test, i, sira_no):
    kz = lambda d: d['kind'] == 'kriz' and d['pos'] == 'zarar'
    pre = _oran(gor, 'pre', kz)
    post = _oran(gor, 'post', kz)
    degisim = g(round(float(post) - float(pre), 2)) if pre != '' and post != '' else ''
    kar_pre = _oran(gor, 'pre', lambda d: d['kind'] == 'normal' and d['pos'] == 'kar')
    zar_pre = _oran(gor, 'pre', lambda d: d['kind'] == 'normal' and d['pos'] == 'zarar')
    kar_post = _oran(gor, 'post', lambda d: d['kind'] == 'normal' and d['pos'] == 'kar')
    zar_post = _oran(gor, 'post', lambda d: d['kind'] == 'normal' and d['pos'] == 'zarar')
    disp = lambda a, b: g(round(float(a) - float(b), 2)) if a != '' and b != '' else ''
    maruz_say = deneme if grp == 'A' and deneme >= 1 else 0
    iptal = int(rng.binomial(maruz_say, 0.45)) if maruz_say else 0
    sim_sat = deneme + int(rng.poisson(0.7))
    sim_al = int(rng.poisson(1.2))
    sebep = {w: 0 for w in SELL_WHY}
    for _ in range(sim_sat):
        p_k = expit(-0.3 + 0.8 * u)
        sebep['Korktum' if rng.random() < p_k else str(rng.choice(['Planım buydu', 'Haber yüzünden', 'Diğerleri satıyor', 'Söylemek istemiyorum']))] += 1
    sebep_txt = '|'.join(f'{w}:{n}' for w, n in sebep.items() if n)
    ilk_deneme_dogru_tahmin = (maruz_say > 0 and rng.random() < 0.15) or rng.random() < 0.03
    tahmin = '' if rng.random() < 0.4 else (str(rng.choice(DOGRU_TAHMIN)) if ilk_deneme_dogru_tahmin else str(rng.choice(DIGER_TAHMIN)))
    if grp == 'A':
        manip = 'Evet' if maruz_say and rng.random() < 0.9 else ('Hiç satış yapmadım' if not deneme and rng.random() < 0.6 else str(rng.choice(['Hayır', 'Hatırlamıyorum'])))
    else:
        manip = 'Evet' if rng.random() < 0.03 else ('Hiç satış yapmadım' if not deneme and rng.random() < 0.6 else str(rng.choice(['Hayır', 'Hayır', 'Hatırlamıyorum'])))
    stres = lambda ek: '' if rng.random() < 0.08 else g(int(np.clip(round(rng.normal(2.6 + 0.3 * u + ek, 0.9)), 1, 5)))
    # 6 maddelik ön test: Big Three (3) + ek maddeler (3); iki puan ilişkili ama aynı değil
    b3_n = int(rng.choice([0, 1, 2, 3], p=[0.05, 0.2, 0.4, 0.35]))
    ek_n = int(np.clip(b3_n + rng.integers(-1, 2), 0, 3))
    pre_t = int(round((b3_n + ek_n) / 6 * 100))
    pre_b3 = int(round(b3_n / 3 * 100))
    post_t = int(rng.choice([0, 50, 100], p=[0.1, 0.35, 0.55]))
    gecen = pd.Timestamp('2026-10-20') + pd.Timedelta(minutes=int(i * 17 + rng.integers(0, 14)))
    inv = 'Hiç yapmadım' if rng.random() < 0.55 else '|'.join(rng.choice(['Hisse senedi', 'Kripto', 'Yatırım fonu', 'Altın / döviz'], int(rng.integers(1, 3)), replace=False))
    bitti = tamam or test
    return [SURUM, kod, grp, siralama, g(1 if bitti else 0), g(karar), pre, post, degisim,
            pre, post, kar_pre, zar_pre, kar_post, zar_post, disp(kar_pre, zar_pre), disp(kar_post, zar_post),
            _oran(gor, 'pre', lambda d: d['kind'] == 'kriz', 'al'), _oran(gor, 'post', lambda d: d['kind'] == 'kriz', 'al'),
            _medyan([d['rt'] for d in gor if d['block'] == 'pre']), _medyan([d['rt'] for d in gor if d['block'] == 'post']),
            g(sim_sat + sim_al), g(sim_sat), g(deneme), g(deneme), g(sim_al), sebep_txt,
            g(maruz_say), g(iptal), g(maruz_say - iptal), g(int(rng.integers(150, 330))), g(int(rng.integers(20, 160))),
            g(int(rng.integers(5, 90))), g(int(rng.integers(15, 80))), stres(0), stres(0.3), stres(0.1),
            gecen.strftime('%Y-%m-%dT%H:%M:%S.000Z'), g(1) if test else '', g(pre_t), g(pre_b3), g(post_t) if bitti else '',
            g(1 if rng.random() < 0.95 else 0), g(int(rng.choice([0, 1, 2, 3], p=[0.02, 0.1, 0.35, 0.53]))),
            g(int(rng.poisson(0.6))), manip, tahmin, str(rng.choice(YAS)), str(rng.choice(CINSIYET)), str(rng.choice(ALAN)),
            str(rng.choice(SINIF)), inv, str(rng.choice(['Evet', 'Hayır'], p=[0.25, 0.75])), 'v1', g(int(rng.integers(0, 8))),
            g(1 if rng.random() < 0.1 else 0), g(int(rng.integers(8, 120))), '', '', '']


def _olaylar(kod, grp, gor, satir, rng, bitti):
    """Oturum zaman çizelgesi (başlangıç, bölümler, simülatör, bitiş) ve karar olayları. Pilot aracının süre hesabı için."""
    bitis_zamani = pd.Timestamp(satir[KATILIMCI_KOLONLARI.index('updated_at')])
    sure = float(np.clip(rng.normal(1800, 420), 900, 3600))
    t = bitis_zamani - pd.Timedelta(seconds=sure)
    olay, sayac = [], [0]

    def ek(tip, zaman, veri, j=0):
        sayac[0] += 1
        olay.append([SURUM, kod, grp, 1, sayac[0], zaman.strftime('%Y-%m-%dT%H:%M:%S.000Z'), j, tip, json.dumps(veri, ensure_ascii=False)])

    def karar(d, j, zaman):
        veri = dict(id=d['set'] + str(j % 6 + 1), block=d['block'], set=d['set'], n=j % 6 + 1, sym=d['sym'], kind=d['kind'], pos=d['pos'],
                    pl=-0.15 if d['pos'] == 'zarar' else 0.08, crowd=d['crowd'], news=d['kind'] == 'kriz', out=d['out'], first=d['final'],
                    final=d['final'], rtFirst=d['rt'], rtFinal=d['rt'], hid=False,
                    res=0 if d['final'] == 'sat' else int(10000 * d['out'] if d['final'] == 'tut' else 15000 * d['out']))
        ek('decision', zaman, veri, j % 6)

    ek('consent_given', t, dict(ver='v1', opened=[], dl=False, ms=30000))
    ek('session_start', t + pd.Timedelta(seconds=2), dict(quick=False, v=SURUM))
    t_pre = t + pd.Timedelta(seconds=240)
    ek('task_start', t_pre, dict(block='pre'))
    pre = [d for d in gor if d['block'] == 'pre']
    post = [d for d in gor if d['block'] == 'post']
    z = t_pre
    for j, d in enumerate(pre):
        z = z + pd.Timedelta(seconds=35)
        karar(d, j, z)
    if len(pre) < 6:
        return olay
    t_sim = z + pd.Timedelta(seconds=60)
    ek('sim_start', t_sim, dict(readMs=40000))
    maruz = int(satir[KATILIMCI_KOLONLARI.index('cooldown_shown')] or 0)
    for k in range(maruz):
        ek('cooldown_shown', t_sim + pd.Timedelta(seconds=120 + 60 * k), dict(k='TUPRS', pl=-0.17, tick=90 + 10 * k, why='Korktum'))
    t_sim_end = t_sim + pd.Timedelta(seconds=600 + float(rng.integers(0, 180)))
    ek('sim_end', t_sim_end, dict(value=95000, trades=3))
    if len(post) == 0 and not bitti:
        return olay
    t_post = t_sim_end + pd.Timedelta(seconds=45)
    ek('task_start', t_post, dict(block='post'))
    z = t_post
    for j, d in enumerate(post):
        z = z + pd.Timedelta(seconds=35)
        karar(d, j, z)
    for k in range(int(rng.poisson(0.5))):
        ek('hidden', t_pre + pd.Timedelta(seconds=300 + 40 * k), {})
    if bitti:
        ek('session_end', z + pd.Timedelta(seconds=30), dict(total=0, decisions=12))
        ek('debrief_view', z + pd.Timedelta(seconds=180), {})
    return olay


def yaz(df, yol):
    df.to_csv(yol, index=False, encoding='utf-8-sig', lineterminator='\n')


def main():
    ap = argparse.ArgumentParser(description='İlk Lot örnek (SAHTE) veri üretici')
    ap.add_argument('--n-grup', type=int, default=40, help='Grup başına işe alınan katılımcı (varsayılan 40)')
    ap.add_argument('--or', dest='or_etki', type=float, default=0.5, help='A×bölüm etkileşiminin gerçek odds oranı (<1: A daha çok azalır)')
    ap.add_argument('--sigma', type=float, default=1.2, help='Kişiler arası değişkenlik (logit SD)')
    ap.add_argument('--taban', type=float, default=0.0, help='Taban logit (0 = %%50 satış)')
    ap.add_argument('--kayma', type=float, default=-0.2, help='3. bölümde iki grupta ortak değişim (logit)')
    ap.add_argument('--maruz', type=float, default=0.7, help='A grubunda bekleme ekranını görme oranı (ortalama)')
    ap.add_argument('--kayip', type=float, default=0.08, help='Tamamlamayan oranı')
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--cikti', default='ornek', help='Dosya öneki')
    a = ap.parse_args()
    df, ol = uret(a.n_grup, a.or_etki, a.sigma, a.taban, a.kayma, 0.2, a.maruz, a.kayip, 0.4, 2, a.seed)
    yaz(df, a.cikti + '_katilimci.csv')
    yaz(ol, a.cikti + '_olaylar.csv')
    print(f'{len(df)} katılımcı satırı ({int((df.completed == "1").sum())} tamamlayan, {int((df.test_mode == "1").sum())} test modu), {len(ol)} olay satırı yazıldı: {a.cikti}_*.csv')


if __name__ == '__main__':
    main()
