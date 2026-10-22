"""Analiz betiklerinin kendi testleri. Betiklerde bir değişiklik yaptıktan sonra çalıştır:
  python test_betikler.py
Tümü geçerse çıkış kodu 0'dır. Yaklaşık 30-60 saniye sürer."""
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import time

import numpy as np
import pandas as pd
from scipy import optimize, stats
from scipy.special import expit

KLASOR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, KLASOR)
from ilklot_ortak import (bilgi_modeli, cohen_kappa, holm, lojistik_kume, ols_hc3, permutasyon_farki, tasarim_matrisi, tost_or)  # noqa: E402
from ilklot_ornek_veri import KATILIMCI_KOLONLARI, OLAY_KOLONLARI, uret, yaz  # noqa: E402
from ilklot_guc import simule, tasarim, tost_p, toplu_lojistik  # noqa: E402

GERCEK_K = os.path.join(KLASOR, 'ornek', 'uygulama_ciktisi_ornegi_katilimci.csv')
GERCEK_O = os.path.join(KLASOR, 'ornek', 'uygulama_ciktisi_ornegi_olaylar.csv')
sonuclar = []


def test(ad):
    def sar(f):
        t0 = time.time()
        try:
            f()
            sonuclar.append((ad, True, '', time.time() - t0))
        except Exception as e:  # noqa: BLE001
            sonuclar.append((ad, False, f'{type(e).__name__}: {e}', time.time() - t0))
        return f
    return sar


def analiz_calistir(k, olaylar=None, ek=(), cikti=None):
    cikti = cikti or tempfile.mkdtemp()
    cmd = [sys.executable, os.path.join(KLASOR, 'ilklot_analiz.py'), k, '--cikti', cikti, '--perm', '2000', '--boot', '1000'] + list(ek)
    if olaylar:
        cmd += ['--olaylar', olaylar]
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=KLASOR)
    return r, cikti


@test('Çekirdek: lojistik regresyon bağımsız en büyük olabilirlik tahminiyle uyuşuyor')
def _():
    rng = np.random.default_rng(7)
    n = 60
    A = np.repeat([0, 1], n // 2)
    sira = np.array(['X→Y', 'Y→X'] * (n // 2))
    u = rng.normal(0, 1.2, n)
    sp = np.where(sira == 'X→Y', 0, 1)
    pre = rng.binomial(4, expit(0.1 + u + 0.2 * sp)) / 4
    post = rng.binomial(4, expit(0.1 + u - 0.2 + 0.2 * (1 - sp) - 0.7 * A)) / 4
    X, k, m, kume, _, _ = tasarim_matrisi(A, pre, post, sira)
    r = lojistik_kume(X, k, m, kume)
    nll = lambda b: -np.sum(k * (X @ b) - m * np.logaddexp(0, X @ b))
    grad = lambda b: -(X.T @ (k - m * expit(X @ b)))
    o = optimize.minimize(nll, np.zeros(X.shape[1]), jac=grad, method='BFGS', options=dict(gtol=1e-10))
    assert np.abs(o.x - r['beta']).max() < 1e-6
    mu = expit(X @ r['beta'])
    w = m * mu * (1 - mu)
    ekmek = np.linalg.inv(sum(w[i] * np.outer(X[i], X[i]) for i in range(len(k))))
    et = np.zeros((X.shape[1],) * 2)
    for g in range(n):
        s = sum(X[i] * (k[i] - m[i] * mu[i]) for i in range(len(k)) if kume[i] == g)
        et += np.outer(s, s)
    N, p = m.sum(), X.shape[1]
    V = (n / (n - 1)) * ((N - 1) / (N - p)) * ekmek @ et @ ekmek
    assert np.abs(np.sqrt(np.diag(V)) - r['se']).max() < 1e-9
    Xe, ke, ce = [], [], []
    for i in range(len(k)):
        for j in range(int(m[i])):
            Xe.append(X[i]); ke.append(1.0 if j < k[i] else 0.0); ce.append(kume[i])
    re = lojistik_kume(np.array(Xe), np.array(ke), np.ones(len(ke)), np.array(ce))
    assert np.abs(re['beta'] - r['beta']).max() < 1e-9 and np.abs(re['se'] - r['se']).max() < 1e-9


@test('Çekirdek: HC3, Holm ve permütasyon')
def _():
    rng = np.random.default_rng(1)
    X = np.column_stack([np.ones(40), rng.integers(0, 2, 40), rng.normal(size=40)])
    y = rng.normal(size=40)
    oo = ols_hc3(X, y)
    H = X @ np.linalg.inv(X.T @ X) @ X.T
    e = y - H @ y
    h = np.diag(H)
    Vh = np.linalg.inv(X.T @ X) @ (X.T @ np.diag(e ** 2 / (1 - h) ** 2) @ X) @ np.linalg.inv(X.T @ X)
    assert np.abs(np.sqrt(np.diag(Vh)) - oo['se']).max() < 1e-10
    assert np.allclose(holm([0.01, 0.04, 0.03, 0.2]), [0.04, 0.09, 0.09, 0.2])
    a = rng.choice([-.5, -.25, 0, .25, .5], 30)
    b = rng.choice([-.25, 0, .25, .5, .75], 30)
    _, p = permutasyon_farki(a, b, 40000, np.random.default_rng(2))
    r = np.random.default_rng(3)
    tum = np.concatenate([a, b]); obs = a.mean() - b.mean(); c = 0
    for _ in range(20000):
        q = r.permutation(tum); c += abs(q[:30].mean() - q[30:].mean()) >= abs(obs) - 1e-12
    assert abs(p - (1 + c) / 20001) < 0.02


@test('Güç: toplu hesap tek tek hesapla aynı sonucu veriyor')
def _():
    rng = np.random.default_rng(3)
    n = 25
    N, A, set_pre, X = tasarim(n)
    R = 15
    u = rng.normal(0, 1.2, (R, N))
    K = np.zeros((R, 2 * N))
    K[:, 0::2] = rng.binomial(4, expit(u + 0.2 * set_pre))
    K[:, 1::2] = rng.binomial(4, expit(u - 0.2 + 0.2 * (1 - set_pre) - 0.6 * A))
    b3, pv, _ = toplu_lojistik(X, K, 4.0, N)
    for r in range(R):
        s = lojistik_kume(X, K[r], np.full(2 * N, 4.0), np.repeat(np.arange(N), 2))
        assert abs(s['beta'][3] - b3[r]) < 1e-9 and abs(s['p'][3] - pv[r]) < 1e-7


@test('Güç: OR = 1 iken I. tip hata ≈ %5 (4000 tekrar, n = 20 ve 40)')
def _():
    rng = np.random.default_rng(11)
    for n in (20, 40):
        s = simule(n, 1.0, 4000, 1.2, 0.0, -0.2, 0.2, 0.7, rng)
        oran = np.mean((s['p_birincil'] < 0.05) & ~s['basarisiz'])
        assert 0.035 <= oran <= 0.065, f'n={n}: I. tip hata {oran:.3f}'
        assert s['basarisiz'].mean() < 0.01


@test('Güç: n büyüdükçe ve etki büyüdükçe güç artıyor')
def _():
    rng = np.random.default_rng(5)
    g = lambda n, o: np.mean((simule(n, o, 1500, 1.2, 0.0, -0.2, 0.2, 0.7, rng)['p_birincil'] < 0.05))
    assert g(30, 0.4) < g(80, 0.4) < g(200, 0.4)
    assert g(60, 0.7) < g(60, 0.4) < g(60, 0.2)


@test('Üretici: başlıklar uygulamanın gerçek dışa aktarımıyla birebir aynı')
def _():
    g = pd.read_csv(GERCEK_K, encoding='utf-8-sig', dtype=str, keep_default_na=False)
    o = pd.read_csv(GERCEK_O, encoding='utf-8-sig', dtype=str, keep_default_na=False)
    assert list(g.columns) == KATILIMCI_KOLONLARI, 'katılımcı sütunları uygulamayla uyuşmuyor'
    assert list(o.columns) == OLAY_KOLONLARI, 'olay sütunları uygulamayla uyuşmuyor'


@test('Üretici: set sırası ve grup dengeli, test modu ve tamamlamayan satırlar var')
def _():
    df, ol = uret(n_grup=40, or_etki=0.5, seed=3)
    assert abs((df.grp == 'A').sum() - (df.grp == 'B').sum()) <= 2
    gercek = df[df.test_mode == '']
    ct = pd.crosstab(gercek.grp, gercek.set_order)
    assert (ct.max(axis=1) - ct.min(axis=1)).abs().max() <= 2
    assert (df.test_mode == '1').sum() == 2 and (df.completed == '0').sum() >= 1
    assert len(ol) > 800


@test('Uçtan uca: filtreler ve ham fark, bağımsız pandas hesabıyla uyuşuyor')
def _():
    d = tempfile.mkdtemp()
    df, ol = uret(n_grup=70, or_etki=0.4, seed=21)
    yaz(df, os.path.join(d, 'k.csv')); yaz(ol, os.path.join(d, 'o.csv'))
    r, cikti = analiz_calistir(os.path.join(d, 'k.csv'), os.path.join(d, 'o.csv'))
    assert r.returncode == 0, r.stderr
    j = json.load(open(os.path.join(cikti, 'analiz_ozeti.json'), encoding='utf-8'))
    x = df[(df.test_mode == '') & (df.completed == '1') & (df.decisions == '12')].copy()
    x['ch'] = x.panic_rate_post.astype(float) - x.panic_rate_pre.astype(float)
    nA, nB = (x.grp == 'A').sum(), (x.grp == 'B').sum()
    assert (j['nA'], j['nB']) == (nA, nB)
    bagimsiz = 100 * (x[x.grp == 'A'].ch.mean() - x[x.grp == 'B'].ch.mean())
    assert abs(j['birincil']['fark_yp'] - bagimsiz) < 1e-9
    for f in ('rapor.md', 'dislama_kaydi.csv', 'fig1_panik_oranlari.png', 'fig2_degisim.png'):
        assert os.path.exists(os.path.join(cikti, f)), f
    rapor = open(os.path.join(cikti, 'rapor.md'), encoding='utf-8').read()
    assert not re.search(r'\bnan\b', rapor.lower()), 'raporda "nan" var'
    assert 'Olay kaydı kontrolü' in rapor
    ol_or = float(rapor.split('model (sürü kovaryatsız) OR = ')[1].split(' ')[0].replace(',', '.'))
    assert abs(ol_or - j['birincil']['OR']) < 0.006, 'olay kaydı ile katılımcı özeti aynı OR vermeli'


@test('Bilgi düzeyi modeli: gerçek üçlü etkileşimi geri buluyor, etkileşim yokken 1\'i içeriyor; rapor satırı bağımsız hesapla uyuşuyor')
def _():
    def veri(n_grup, b_A, b_3, seed):
        rng = np.random.default_rng(seed)
        n = 2 * n_grup
        A = np.r_[np.ones(n_grup), np.zeros(n_grup)]
        z = rng.standard_normal(n)
        u = rng.normal(0, 1.0, n)
        eff = A * (b_A + b_3 * z)
        pre = rng.binomial(4, expit(u)) / 4
        post = rng.binomial(4, expit(u - 0.2 + eff)) / 4
        return A, pre, post, np.where(rng.random(n) < .5, 'X→Y', 'Y→X'), z
    # Gerçek etkileşim: log-OR(A×bölüm) = -0,7 + 0,5·z  → üçlü OR ≈ e^0,5 ≈ 1,65; düşük bilgide etki güçlü
    r = bilgi_modeli(*veri(1500, -0.7, 0.5, 5))
    assert not r['basarisiz'] and abs(math.log(r['uc_OR']) - 0.5) < 0.15, r['uc_OR']
    assert r['p'] < 0.01 and r['dusuk']['OR'] < r['yuksek']['OR'] < 1.2
    assert abs(math.log(r['dusuk']['OR']) - (-1.2)) < 0.25 and abs(math.log(r['yuksek']['OR']) - (-0.2)) < 0.25
    # Etkileşim yok: güven aralığı 1'i içermeli
    r0 = bilgi_modeli(*veri(1500, -0.7, 0.0, 6))
    assert r0['uc_lo'] < 1 < r0['uc_hi'], r0
    # Yanlış işaretli bir uygulama (z ters) basit etkileri yer değiştirir
    A, pre, post, sira, z = veri(1500, -0.7, 0.5, 5)
    rt = bilgi_modeli(A, pre, post, sira, -z)
    assert rt['uc_OR'] < 1 and rt['dusuk']['OR'] > rt['yuksek']['OR']
    # Uçtan uca: rapor satırı, dışarıdan çağrılan modelle aynı OR'u verir
    d = tempfile.mkdtemp()
    df, ol = uret(n_grup=80, or_etki=0.5, seed=3)
    yaz(df, os.path.join(d, 'k.csv')); yaz(ol, os.path.join(d, 'o.csv'))
    rr, cikti = analiz_calistir(os.path.join(d, 'k.csv'), os.path.join(d, 'o.csv'))
    assert rr.returncode == 0, rr.stderr
    rapor = open(os.path.join(cikti, 'rapor.md'), encoding='utf-8').read()
    satir = [x for x in rapor.splitlines() if x.startswith('| Bilgi düzeyi × grup × bölüm')]
    assert len(satir) == 1, 'raporda bilgi düzeyi satırı olmalı'
    x = df[(df.test_mode == '') & (df.completed == '1') & (df.decisions == '12')].copy()
    x = x[x.pre_test.astype(str) != '']
    pt = x.pre_test.astype(float)
    zz = (pt - pt.mean()) / pt.std(ddof=0)
    bm = bilgi_modeli((x.grp == 'A').astype(float).to_numpy(), x.panic_rate_pre.astype(float).to_numpy(), x.panic_rate_post.astype(float).to_numpy(), x.set_order.to_numpy(), zz.to_numpy())
    beklenen = f'OR = {bm["uc_OR"]:.2f}'.replace('.', ',')
    assert beklenen in satir[0], (beklenen, satir[0][:200])
    # Duyarlılık notu: yalnızca Big Three puanıyla bağımsız hesap; Holm tablosunda ayrı satır olmamalı
    xb = x[x.pre_test_b3.astype(str) != '']
    pb = xb.pre_test_b3.astype(float)
    zb = (pb - pb.mean()) / pb.std(ddof=0)
    bb = bilgi_modeli((xb.grp == 'A').astype(float).to_numpy(), xb.panic_rate_pre.astype(float).to_numpy(), xb.panic_rate_post.astype(float).to_numpy(), xb.set_order.to_numpy(), zb.to_numpy())
    nots = [l for l in rapor.splitlines() if 'yalnızca Big Three' in l]
    assert len(nots) == 1, 'duyarlılık notu raporda bir kez olmalı'
    assert f'OR = {bb["uc_OR"]:.2f}'.replace('.', ',') in nots[0], (bb['uc_OR'], nots[0])
    assert not [l for l in rapor.splitlines() if l.startswith('|') and 'Big Three' in l], 'duyarlılık Holm tablosuna girmemeli'


@test('Uçtan uca: müdahale kontrolü tablosu bağımsız hesapla aynı (dizin hizalama hatası geri gelmesin)')
def _():
    d = tempfile.mkdtemp()
    df, _ = uret(n_grup=60, or_etki=0.5, seed=5)
    yaz(df, os.path.join(d, 'k.csv'))
    r, cikti = analiz_calistir(os.path.join(d, 'k.csv'))
    assert r.returncode == 0, r.stderr
    rapor = open(os.path.join(cikti, 'rapor.md'), encoding='utf-8').read()
    x = df[(df.test_mode == '') & (df.completed == '1') & (df.decisions == '12')].copy()
    x['sh'] = pd.to_numeric(x.cooldown_shown)
    sinif = np.where(x.grp == 'B', 'B (kontrol)', np.where(x.sh >= 1, 'A, bekleme ekranını gördü', 'A, bekleme ekranını görmedi'))
    ct = pd.crosstab(pd.Series(sinif, index=x.index, name='g'), x.manip_saw_wait.replace('', 'Cevaplamadı'))
    bolum = rapor.split('## 6.')[1].split('**Amaç tahmini')[0]
    for ad in ct.index:
        satir = [l for l in bolum.split('\n') if l.startswith('| ' + ad)][0]
        hucre = [c.strip() for c in satir.strip('|').split('|')][1:]
        basliklar = [c.strip() for c in [l for l in bolum.split('\n') if l.startswith('| Grup')][0].strip('|').split('|')][1:]
        for b, h in zip(basliklar, hucre):
            assert int(h) == int(ct.loc[ad, b]), f'{ad}/{b}: rapor {h}, bağımsız {ct.loc[ad, b]}'


@test('Gerçek uygulama çıktısı (6 test katılımcısı): çökmeden çalışıyor, küçük örneklem uyarıları çıkıyor')
def _():
    r, cikti = analiz_calistir(GERCEK_K, GERCEK_O)
    assert r.returncode == 0, r.stderr
    rapor = open(os.path.join(cikti, 'rapor.md'), encoding='utf-8').read()
    assert 'Birincil analiz kümesi' in rapor and '20\'den az' in rapor
    assert 'Traceback' not in r.stderr


@test('Kenar durumları: eksik sütun, boş dosya, tek grup, yinelenen kod, isteğe bağlı sütunlar yok')
def _():
    d = tempfile.mkdtemp()
    df, _ = uret(n_grup=30, or_etki=0.5, seed=8)
    df.drop(columns=['panic_rate_pre']).pipe(yaz, os.path.join(d, 'eksik.csv'))
    r, _ = analiz_calistir(os.path.join(d, 'eksik.csv'))
    assert r.returncode != 0 and 'beklenen sütunlar yok' in (r.stdout + r.stderr)
    open(os.path.join(d, 'bos.csv'), 'w', encoding='utf-8-sig').write(','.join(KATILIMCI_KOLONLARI) + '\n')
    r, _ = analiz_calistir(os.path.join(d, 'bos.csv'))
    assert r.returncode != 0
    tek = df[df.grp == 'A']
    yaz(tek, os.path.join(d, 'tek.csv'))
    r, _ = analiz_calistir(os.path.join(d, 'tek.csv'))
    assert r.returncode == 0, r.stderr
    yin = pd.concat([df, df.iloc[:3]])
    yaz(yin, os.path.join(d, 'yin.csv'))
    r, _ = analiz_calistir(os.path.join(d, 'yin.csv'))
    assert r.returncode == 0 and 'yinelenen' in r.stdout
    min_kol = df[['code', 'grp', 'completed', 'decisions', 'panic_rate_pre', 'panic_rate_post', 'set_order', 'test_mode']]
    yaz(min_kol, os.path.join(d, 'min.csv'))
    r, _ = analiz_calistir(os.path.join(d, 'min.csv'))
    assert r.returncode == 0, r.stderr


@test('Kodlama dosyası: manuel kodlama anahtar kelime taramasının yerine geçiyor')
def _():
    d = tempfile.mkdtemp()
    df, _ = uret(n_grup=50, or_etki=0.5, seed=9)
    yaz(df, os.path.join(d, 'k.csv'))
    r, cikti = analiz_calistir(os.path.join(d, 'k.csv'))
    sb = pd.read_csv(os.path.join(cikti, 'amac_tahmini_kodlama.csv'), encoding='utf-8-sig', dtype=str, keep_default_na=False)
    assert 'grp' not in sb.columns, 'kodlama şablonu grup bilgisi içermemeli (kör kodlama)'
    assert {'kodlayici1', 'kodlayici2', 'uzlasma'}.issubset(sb.columns), 'şablon iki kodlayıcılı olmalı'
    sb['manuel_dogru'] = [('1' if i % 5 == 0 else '0') for i in range(len(sb))]
    sb.to_csv(os.path.join(d, 'kod.csv'), index=False, encoding='utf-8-sig')
    r2, cikti2 = analiz_calistir(os.path.join(d, 'k.csv'), ek=['--kodlama', os.path.join(d, 'kod.csv')])
    assert r2.returncode == 0, r2.stderr
    assert 'manuel kodlama' in open(os.path.join(cikti2, 'rapor.md'), encoding='utf-8').read()


@test('Pilot aracı: maruz kalma sayısı ve medyan süre bağımsız hesapla aynı')
def _():
    d = tempfile.mkdtemp()
    df, ol = uret(n_grup=10, or_etki=0.5, seed=12, test_sayisi=1)
    yaz(df, os.path.join(d, 'k.csv')); yaz(ol, os.path.join(d, 'o.csv'))
    r = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_pilot.py'), os.path.join(d, 'k.csv'), '--olaylar', os.path.join(d, 'o.csv')], capture_output=True, text=True, cwd=KLASOR)
    assert r.returncode == 0, r.stderr
    x = df[(df.test_mode == '') & (df.completed == '1') & (df.decisions == '12')]
    a_ = x[x.grp == 'A']
    gor = int((pd.to_numeric(a_.cooldown_shown) >= 1).sum())
    assert f'**{gor}/{len(a_)} = ' in r.stdout, 'maruz kalan sayısı bağımsız hesapla uyuşmuyor'
    ol['t'] = pd.to_datetime(ol.ts, utc=True)
    sureler = []
    for kod in x.code:
        e = ol[ol.code == kod]
        sureler.append((e[e.type == 'debrief_view'].t.iloc[0] - e[e.type == 'session_start'].t.iloc[0]).total_seconds() / 60)
    assert f'medyan **{np.median(sureler):.1f}'.replace('.', ',') in r.stdout, 'medyan süre bağımsız hesapla uyuşmuyor'
    assert 'Test modu' not in r.stdout and 'hızlı test modu oturumu dışarıda' in r.stdout


@test('Pilot aracı: gerçek uygulama çıktısında çökmüyor; eksik sütun ve olay dosyasız durumda anlaşılır davranıyor')
def _():
    r = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_pilot.py'), GERCEK_K, '--olaylar', GERCEK_O], capture_output=True, text=True, cwd=KLASOR)
    assert r.returncode == 0 and 'Karar tablosu' in r.stdout and 'Yalnızca' in r.stdout, r.stderr
    r2 = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_pilot.py'), GERCEK_K], capture_output=True, text=True, cwd=KLASOR)
    assert r2.returncode == 0 and 'Süre hesaplanamadı' in r2.stdout
    d = tempfile.mkdtemp()
    pd.read_csv(GERCEK_K, encoding='utf-8-sig', dtype=str, keep_default_na=False).drop(columns=['grp']).to_csv(os.path.join(d, 'x.csv'), index=False)
    r3 = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_pilot.py'), os.path.join(d, 'x.csv')], capture_output=True, text=True, cwd=KLASOR)
    assert r3.returncode != 0 and 'beklenen sütunlar yok' in (r3.stdout + r3.stderr)


@test('Pilot aracı: geri bildirim özeti bağımsız hesapla aynı; "Evet" rahatsızlık İNCELE; yanıt yoksa bölüm sessiz kalır')
def _():
    g = pd.read_csv(GERCEK_K, encoding='utf-8-sig', dtype=str, keep_default_na=False)
    d = tempfile.mkdtemp()
    # 6 katılımcı: 5 yanıt (biri yalnızca süre), 1 atlama. Yanıtlar elle seçildi; beklenen değerler elle hesaplandı.
    g['pilot_clear'] = ['5', '4', '3', '2', '', '']
    g['pilot_duration'] = ['Uygun', 'Uzun', 'Uzun', 'Çok uzun', 'Uygun', '']
    g['pilot_unease'] = ['Hayır', 'Biraz', 'Evet', 'Hayır', '', '']
    g.to_csv(os.path.join(d, 'k.csv'), index=False, encoding='utf-8-sig')
    r = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_pilot.py'), os.path.join(d, 'k.csv')], capture_output=True, text=True, cwd=KLASOR)
    assert r.returncode == 0, r.stderr
    o = r.stdout
    assert 'Yanıtlayan: 5/6' in o, o
    assert 'n = 4: ortalama 3,5; 4-5 diyen **%50** (2/4)' in o, 'anlama özeti elle hesapla uyuşmuyor'
    assert 'Çok kısa 0, Uygun 2, Uzun 2, Çok uzun 1' in o and '**%60**' in o, 'süre algısı elle hesapla uyuşmuyor'
    assert 'Hayır 2, Biraz 1, Evet 1' in o
    sat = {l.split('|')[1].strip(): l for l in o.splitlines() if l.startswith('| ') and l.count('|') >= 6}
    assert 'İNCELE' in sat['Başta anlama (geri bildirim, 4-5)'] and 'İNCELE' in sat['Süreyi uzun bulan (geri bildirim)'] and 'İNCELE' in sat['Rahatsız olduğunu söyleyen (Evet)']
    # Rahatsızlık yok, anlama iyi, süre uygun: üçü de "tamam"
    g['pilot_clear'] = ['5', '5', '4', '4', '', '']
    g['pilot_duration'] = ['Uygun', 'Uygun', 'Uzun', 'Çok kısa', '', '']
    g['pilot_unease'] = ['Hayır', 'Biraz', 'Hayır', 'Hayır', '', '']
    g.to_csv(os.path.join(d, 'k2.csv'), index=False, encoding='utf-8-sig')
    o2 = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_pilot.py'), os.path.join(d, 'k2.csv')], capture_output=True, text=True, cwd=KLASOR).stdout
    sat2 = {l.split('|')[1].strip(): l for l in o2.splitlines() if l.startswith('| ') and l.count('|') >= 6}
    assert all('tamam' in sat2[a] and 'İNCELE' not in sat2[a] for a in ('Başta anlama (geri bildirim, 4-5)', 'Süreyi uzun bulan (geri bildirim)', 'Rahatsız olduğunu söyleyen (Evet)')), sat2
    # Yanıt yok (gerçek veri toplama): bölüm "yanıt yok" der, karar satırı eklemez
    g[['pilot_clear', 'pilot_duration', 'pilot_unease']] = ''
    g.to_csv(os.path.join(d, 'k3.csv'), index=False, encoding='utf-8-sig')
    o3 = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_pilot.py'), os.path.join(d, 'k3.csv')], capture_output=True, text=True, cwd=KLASOR).stdout
    assert 'Yanıt yok' in o3 and 'geri bildirim' not in o3.split('## 6.')[1].split('## 7.')[0]
    # Eski biçimli CSV (pilot sütunları hiç yok) çökmeden çalışır
    g.drop(columns=['pilot_clear', 'pilot_duration', 'pilot_unease']).to_csv(os.path.join(d, 'k4.csv'), index=False, encoding='utf-8-sig')
    r4 = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_pilot.py'), os.path.join(d, 'k4.csv')], capture_output=True, text=True, cwd=KLASOR)
    assert r4.returncode == 0 and 'Pilot geri bildirimi' not in r4.stdout


@test('Kodlayıcı uyumu: ders kitabı örneği (κ = 0,40), tanımsız durumlar, uzlaşma akışı')
def _():
    k1 = np.array([1] * 20 + [1] * 5 + [0] * 10 + [0] * 15)
    k2 = np.array([1] * 20 + [0] * 5 + [1] * 10 + [0] * 15)
    r = cohen_kappa(k1, k2, np.random.default_rng(1))
    assert abs(r['kappa'] - 0.4) < 1e-12 and abs(r['po'] - 0.7) < 1e-12 and abs(r['pe'] - 0.5) < 1e-12, r
    assert r['ci_lo'] < 0.4 < r['ci_hi'] and r['tablo'] == dict(a=20, b=5, c=10, d=15)
    assert cohen_kappa([1, 0, 1, 0, 1], [1, 0, 1, 0, 1])['kappa'] == 1.0
    assert np.isnan(cohen_kappa([0, 0, 0, 0], [0, 0, 0, 0])['kappa']), 'tüm kodlar aynıysa kappa tanımsız olmalı'
    d = tempfile.mkdtemp()
    df, _ = uret(n_grup=80, or_etki=0.5, seed=14)
    yaz(df, os.path.join(d, 'k.csv'))
    x = df[(df.test_mode == '') & (df.completed == '1') & (df.decisions == '12')]
    kodlar = list(x.code[:50])
    tablo = pd.DataFrame({'code': kodlar, 'purpose_guess': '', 'kodlayici1': k1, 'kodlayici2': k2, 'uzlasma': ''})
    tablo.to_csv(os.path.join(d, 'kod.csv'), index=False, encoding='utf-8-sig')
    r1, c1 = analiz_calistir(os.path.join(d, 'k.csv'), ek=['--kodlama', os.path.join(d, 'kod.csv')])
    assert r1.returncode == 0, r1.stderr
    rapor = open(os.path.join(c1, 'rapor.md'), encoding='utf-8').read()
    assert 'Cohen κ | 0,40' in rapor and '%70' in rapor and 'katı' in rapor
    ih = pd.read_csv(os.path.join(c1, 'kodlama_ihtilaf.csv'), encoding='utf-8-sig')
    assert len(ih) == 15 and set(ih.code) == set(kodlar[20:35])
    assert 'çözülmedi' in r1.stdout, 'uzlaşma yokken ihtilaf uyarısı çıkmalı'
    j = json.load(open(os.path.join(c1, 'analiz_ozeti.json'), encoding='utf-8'))
    assert abs(j['kodlama']['kappa'] - 0.4) < 1e-9 and j['kodlama']['n'] == 50
    tablo.loc[20:34, 'uzlasma'] = ['1'] * 7 + ['0'] * 8
    tablo.to_csv(os.path.join(d, 'kod2.csv'), index=False, encoding='utf-8-sig')
    r2, c2 = analiz_calistir(os.path.join(d, 'k.csv'), ek=['--kodlama', os.path.join(d, 'kod2.csv')])
    assert r2.returncode == 0 and 'çözülmedi' not in r2.stdout, r2.stdout[-400:]
    assert 'Cohen κ | 0,40' in open(os.path.join(c2, 'rapor.md'), encoding='utf-8').read(), 'uzlaşma, kodlayıcılar arası uyumu değiştirmemeli'


@test('TOST: p değeri %90 GA\'nın sınırlar içinde olmasıyla aynı karar; simetri; hatalı sınır reddi')
def _():
    rng = np.random.default_rng(21)
    for _ in range(400):
        beta, se, df = rng.normal(0, 0.4), rng.uniform(0.05, 0.6), int(rng.integers(5, 200))
        alt, ust = rng.uniform(0.2, 0.95), rng.uniform(1.05, 5)
        r = tost_or(beta, se, df, alt, ust)
        kr = stats.t.ppf(0.95, df)
        icinde = (beta - kr * se > math.log(alt)) and (beta + kr * se < math.log(ust))
        assert r['esdeger'] == icinde, (beta, se, df, alt, ust)
        assert abs(r['ci90_lo'] - math.exp(beta - kr * se)) < 1e-12
        assert r['p_tost'] == max(r['p_alt'], r['p_ust'])
    r = tost_or(0.0, 0.2, 100, 0.5, 2.0)
    assert abs(r['p_alt'] - r['p_ust']) < 1e-12 and r['esdeger'] and 0 < r['p_tost'] < 0.05
    assert not tost_or(0.0, 0.5, 100, 0.5, 2.0)['esdeger'], 'geniş GA eşdeğerlik vermemeli'
    assert not tost_or(math.log(2.5), 0.05, 100, 0.5, 2.0)['esdeger'], 'tahmin aralık dışındaysa eşdeğer olmamalı'
    assert not tost_or(float('nan'), 0.2, 10, 0.5, 2.0)['hesaplandi']
    for kotu in ((2.0, 0.5), (1.2, 2.0), (0.5, 0.9), (-1.0, 2.0)):
        try:
            tost_or(0.0, 0.2, 50, *kotu)
        except ValueError:
            continue
        raise AssertionError(f'hatalı sınır kabul edildi: {kotu}')


@test('TOST: rapor ve JSON, bağımsız (GA\'dan geri kurulan) hesapla aynı; bayrak yoksa bölüm yok; hatalı bayrak reddedilir')
def _():
    d = tempfile.mkdtemp()
    df, _ = uret(n_grup=60, or_etki=0.5, seed=5)
    yaz(df, os.path.join(d, 'k.csv'))
    r0, c0 = analiz_calistir(os.path.join(d, 'k.csv'))
    assert r0.returncode == 0 and 'TOST' not in open(os.path.join(c0, 'rapor.md'), encoding='utf-8').read()
    assert json.load(open(os.path.join(c0, 'analiz_ozeti.json'), encoding='utf-8'))['esdegerlik'] is None
    r, c = analiz_calistir(os.path.join(d, 'k.csv'), ek=['--esdeger-or', '3'])
    assert r.returncode == 0, r.stderr
    rapor = open(os.path.join(c, 'rapor.md'), encoding='utf-8').read()
    assert '### Eşdeğerlik (TOST)' in rapor and 'ön kayıtta belirlenmiş olmalıdır' in rapor
    j = json.load(open(os.path.join(c, 'analiz_ozeti.json'), encoding='utf-8'))
    b, e = j['birincil'], j['esdegerlik']
    assert abs(e['or_alt'] - 1 / 3) < 1e-12 and e['or_ust'] == 3
    df_ = b['G'] - 1
    beta = math.log(b['OR'])
    se = (math.log(b['ci_hi']) - math.log(b['ci_lo'])) / (2 * stats.t.ppf(0.975, df_))
    p_alt = stats.t.sf((beta - math.log(1 / 3)) / se, df_)
    p_ust = stats.t.cdf((beta - math.log(3)) / se, df_)
    assert abs(e['p_tost'] - max(p_alt, p_ust)) < 1e-7
    assert abs(e['ci90_lo'] - math.exp(beta - stats.t.ppf(0.95, df_) * se)) < 1e-7
    assert e['esdeger'] == (e['p_tost'] < 0.05)
    r2, c2 = analiz_calistir(os.path.join(d, 'k.csv'), ek=['--esdeger-or', '0.5', '2'])
    assert r2.returncode == 0 and abs(json.load(open(os.path.join(c2, 'analiz_ozeti.json'), encoding='utf-8'))['esdegerlik']['or_alt'] - 0.5) < 1e-12
    for kotu in (['0.5'], ['2', '0.5'], ['1']):
        rk, _ = analiz_calistir(os.path.join(d, 'k.csv'), ek=['--esdeger-or'] + kotu)
        assert rk.returncode != 0 and '--esdeger-or' in rk.stderr, kotu


@test('TOST gücü: toplu hesap tek tek hesapla aynı; seyreltme yokken sınırdaki OR için güç ≈ α; OR = 1 için yüksek')
def _():
    s = simule(40, 0.5, 30, 1.2, 0.0, -0.2, 0.2, 0.7, np.random.default_rng(2))
    pt = tost_p(s, 0.5, 2.0)
    for i in range(30):
        if np.isfinite(s['se'][i]) and s['se'][i] > 1e-4:
            assert abs(tost_or(s['beta'][i], s['se'][i], s['df'], 0.5, 2.0)['p_tost'] - pt[i]) < 1e-9
    rng = np.random.default_rng(9)
    sinir = simule(60, 0.5, 1500, 0.05, 0.0, -0.2, 0.2, 0.99, rng)
    g_sinir = np.mean((tost_p(sinir, 0.5, 2.0) < 0.05) & ~sinir['basarisiz'])
    assert g_sinir < 0.09, f'sınırdaki etki için TOST gücü ≈ %5 olmalı, bulunan {g_sinir:.3f}'
    sifir = simule(100, 1.0, 600, 1.2, 0.0, -0.2, 0.2, 0.7, rng)
    assert np.mean((tost_p(sifir, 0.5, 2.0) < 0.05) & ~sifir['basarisiz']) > 0.8


@test('Kör analiz: etiketler maskelenir, değişen etiketlerde OR tam 1/OR ve p aynı, anahtar yazılır/açılır, grubu ele veren bilgi raporda yok')
def _():
    d = tempfile.mkdtemp()
    k = os.path.join(d, 'k.csv')
    o = os.path.join(d, 'o.csv')
    df, ol = uret(n_grup=40, or_etki=0.5, seed=11)
    yaz(df, k)
    yaz(ol, o)
    rn, cn = analiz_calistir(k, olaylar=o)
    assert rn.returncode == 0, rn.stderr
    normal = json.load(open(os.path.join(cn, 'analiz_ozeti.json'), encoding='utf-8'))['birincil']
    gorulen = set()
    for tohum in (1, 2, 3, 4):
        anahtar = os.path.join(d, f'anahtar{tohum}.json')
        r, c = analiz_calistir(k, olaylar=o, ek=['--kor', '--kor-anahtar', anahtar, '--kor-tohum', str(tohum)])
        assert r.returncode == 0, r.stderr
        rapor = open(os.path.join(c, 'rapor.md'), encoding='utf-8').read()
        for yasak in ('bekleme süreli', '(kontrol)', 'Beklenen yön', 'Doz-yanıt', 'Sürü bilgisi etkisi', 'gördü', 'grup A', 'A grubu', 'B grubu'):
            assert yasak not in rapor, f'kör raporda grubu ele veren ifade: {yasak!r}'
        assert 'KÖR ANALİZ' in rapor and 'G1' in rapor
        assert not re.search(r'\bA\b|\bB\b', rapor.replace('Birincil: tüm', '')), 'kör raporda ham A/B etiketi kaldı'
        assert 'Kör modda olay dosyası kullanılmadı' in rapor
        anah = json.load(open(anahtar, encoding='utf-8'))
        degisti = anah['etiketler_degisti']
        gorulen.add(degisti)
        ozet = json.load(open(os.path.join(c, 'analiz_ozeti.json'), encoding='utf-8'))
        b = ozet['birincil']
        beklenen = 1 / normal['OR'] if degisti else normal['OR']
        assert abs(b['OR'] - beklenen) < 1e-6 * beklenen, (tohum, degisti, b['OR'], normal['OR'])
        assert abs(b['p'] - normal['p']) < 1e-9
        assert ozet['kor'] is True
        # rapordaki özet, anahtar dosyasının özetiyle aynı
        import hashlib
        h = hashlib.sha256(open(anahtar, 'rb').read()).hexdigest()
        assert h in rapor
        ra = subprocess.run([sys.executable, os.path.join(KLASOR, 'ilklot_analiz.py'), '--kor-ac', anahtar], capture_output=True, text=True)
        assert ra.returncode == 0 and h in ra.stdout and ('evet' if degisti else 'hayır') in ra.stdout
        # dışlama kaydındaki grup etiketi gerçekten yer değiştirmiş mi
        dk = pd.read_csv(os.path.join(c, 'dislama_kaydi.csv'), dtype=str)
        dn = pd.read_csv(os.path.join(cn, 'dislama_kaydi.csv'), dtype=str)
        m = dk.merge(dn, on='code', suffixes=('_k', '_n'))
        esit = (m.grp_k == m.grp_n).all()
        assert esit != degisti
    assert gorulen == {True, False}, 'dört denemede iki sonuç da görülmeli'
    # var olan anahtar üzerine yazılmaz; anahtarsız --kor reddedilir
    rv, _ = analiz_calistir(k, ek=['--kor', '--kor-anahtar', os.path.join(d, 'anahtar1.json')])
    assert rv.returncode != 0 and 'zaten var' in (rv.stdout + rv.stderr)
    rk, _ = analiz_calistir(k, ek=['--kor'])
    assert rk.returncode != 0 and '--kor-anahtar' in rk.stderr


@test('Bağımsız incelemeden gelen düzeltmeler: Holm NaN, yinelenen kodlama kodu, 0-1 dışı oran, tanınmayan set, grubu geçersiz satır, özdeş katılımcılar')
def _():
    # Holm: NaN aileye girmez, NaN kalır
    h = holm([0.001, float('nan'), 0.03, 0.5])
    assert np.allclose(h[[0, 2, 3]], [0.003, 0.06, 0.5]) and np.isnan(h[1])
    assert np.isnan(holm([float('nan'), float('nan')])).all()
    d = tempfile.mkdtemp()
    df, _ = uret(n_grup=40, or_etki=0.5, seed=21)
    k = os.path.join(d, 'k.csv')
    yaz(df, k)
    r0, c0 = analiz_calistir(k)
    assert r0.returncode == 0, r0.stderr
    j0 = json.load(open(os.path.join(c0, 'analiz_ozeti.json'), encoding='utf-8'))
    rapor0 = open(os.path.join(c0, 'rapor.md'), encoding='utf-8').read()
    assert 'Yalnızca amacı doğru tahmin edenler çıkarıldı' in rapor0, 'amaç tahmini tek başına duyarlılık satırı yok'
    assert 'Fisher' in rapor0, 'tamamlama farkı (Fisher) her zaman raporlanmalı'
    assert os.path.exists(os.path.join(c0, 'amac_tahmini_kodlama.csv'))
    assert 'otomatik_aday' not in open(os.path.join(c0, 'amac_tahmini_kodlama.csv'), encoding='utf-8-sig').read(), 'kör şablonda grupla ilişkili sütun olmamalı'

    def degistir(f):
        x = pd.read_csv(k, dtype=str, keep_default_na=False, encoding='utf-8-sig')
        f(x)
        y = os.path.join(d, f'x{len(os.listdir(d))}.csv')
        x.to_csv(y, index=False, encoding='utf-8-sig')
        return y
    tam = pd.read_csv(k, dtype=str, keep_default_na=False, encoding='utf-8-sig')
    idx = tam.index[(tam.completed == '1') & (tam.test_mode != '1')][:3]
    # 0-1 dışı oran dışlanır ve uyarı verir
    def oran(x):
        x.loc[idx, 'panic_rate_post'] = ['1.5', '-0.5', '2']
    r1, c1 = analiz_calistir(degistir(oran))
    j1 = json.load(open(os.path.join(c1, 'analiz_ozeti.json'), encoding='utf-8'))
    assert r1.returncode == 0 and j1['n_dahil'] == j0['n_dahil'] - 3 and any('0-1 aralığı dışında' in u for u in j1['uyarilar'])
    # tanınmayan set yazımı uyarı verir
    def setyaz(x):
        x.loc[idx[0], 'set_order'] = 'X->Y'
    r2, c2 = analiz_calistir(degistir(setyaz))
    j2 = json.load(open(os.path.join(c2, 'analiz_ozeti.json'), encoding='utf-8'))
    assert any('SetY kovaryatı bu yüzden modele girmedi' in u for u in j2['uyarilar'])
    # grubu geçersiz satır, farklı kaybı gizlememeli; test_mode=1 + boş grup 'test modu' sayılır
    def grup(x):
        x.loc[x.index[-1], 'grp'] = 'C'
        x.loc[x.index[0], ['grp', 'test_mode']] = ['', '1']
    r3, c3 = analiz_calistir(degistir(grup))
    rap3 = open(os.path.join(c3, 'rapor.md'), encoding='utf-8').read()
    assert r3.returncode == 0 and 'Fisher' in rap3
    # kodlama dosyasında aynı kod iki kez: katılımcı iki kez sayılmaz
    ek = pd.read_csv(os.path.join(c0, 'amac_tahmini_kodlama.csv'), dtype=str, keep_default_na=False, encoding='utf-8-sig')
    ek['manuel_dogru'] = '0'
    ek = pd.concat([ek, ek.iloc[:3]])
    ekyol = os.path.join(d, 'kod.csv')
    ek.to_csv(ekyol, index=False, encoding='utf-8-sig')
    r4, c4 = analiz_calistir(k, ek=['--kodlama', ekyol])
    j4 = json.load(open(os.path.join(c4, 'analiz_ozeti.json'), encoding='utf-8'))
    assert r4.returncode == 0 and any('yinelenen kod' in u for u in j4['uyarilar'])
    assert j4['birincil']['nA'] + j4['birincil']['nB'] == j0['n_dahil'], 'yinelenen kodlama satırı katılımcıyı çoğalttı'
    # özdeş katılımcılar: rapor yine de yazılır (çökmez)
    def ozdes(x):
        x['panic_rate_pre'] = '0.5'
        x['panic_rate_post'] = '0.5'
    r5, c5 = analiz_calistir(degistir(ozdes))
    assert r5.returncode == 0 and os.path.exists(os.path.join(c5, 'rapor.md')), r5.stderr[-300:]


@test('Kuru çalıştırma: sahte veride hat tamam; gerçek-veri modunda bozuk dosya yakalanır ve etki (OR, p) ekrana yazılmaz')
def _():
    r = subprocess.run([sys.executable, os.path.join(KLASOR, 'kuru_calistirma.py')], capture_output=True, text=True, cwd=KLASOR)
    assert r.returncode == 0 and 'denetim tamam' in r.stdout, r.stdout[-400:] + r.stderr[-300:]
    d = tempfile.mkdtemp()
    df, _ = uret(n_grup=30, or_etki=0.3, seed=4)
    df = df[df.test_mode != '1']
    iyi = os.path.join(d, 'iyi.csv')
    yaz(df, iyi)
    ri = subprocess.run([sys.executable, os.path.join(KLASOR, 'kuru_calistirma.py'), '--pilot', iyi], capture_output=True, text=True, cwd=KLASOR)
    assert ri.returncode == 0, ri.stdout[-500:]
    bozuk = df.drop(columns=['pre_test_b3']).copy()
    bozuk = pd.concat([bozuk, bozuk.iloc[:2]])
    bozuk.loc[bozuk.index[3], 'grp'] = 'C'
    by = os.path.join(d, 'bozuk.csv')
    yaz(bozuk, by)
    rb = subprocess.run([sys.executable, os.path.join(KLASOR, 'kuru_calistirma.py'), '--pilot', by], capture_output=True, text=True, cwd=KLASOR)
    assert rb.returncode == 1
    for beklenen in ('pre_test_b3', 'yinelenen kod', 'geçersiz etiket'):
        assert beklenen in rb.stdout, beklenen
    for cikti in (ri.stdout, rb.stdout):
        assert not re.search(r'OR\s*=|p\s*=\s*0|Hedges|ham fark', cikti, re.I), 'gerçek-veri modu etkiyi ele veren bir şey yazdı'


if __name__ == '__main__':
    gecen = sum(1 for _, ok, _, _ in sonuclar if ok)
    for ad, ok, hata, sure in sonuclar:
        print(('GEÇTİ ' if ok else 'KALDI ') + f'({sure:4.1f} sn)  {ad}' + ('' if ok else f'\n         -> {hata}'))
    print(f'\n{gecen}/{len(sonuclar)} test geçti.')
    sys.exit(0 if gecen == len(sonuclar) else 1)
