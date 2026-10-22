"""İlk Lot analizlerinin ortak istatistik işlevleri (yalnızca numpy, pandas, scipy)."""
import math

import numpy as np
from scipy import stats
from scipy.special import expit

BLOK_DENEME = 4
ALFA = 0.05
MARUZ_KATSAYI = 0.6

_GH_X, _GH_W = np.polynomial.hermite_e.hermegauss(60)
_GH_W = _GH_W / _GH_W.sum()


def normal_beklenen(f, sigma):
    return float(np.sum(_GH_W * f(sigma * _GH_X)))


def kalibre_lambda0(hedef, sigma):
    """Maruz kalma olasılığının ortalaması `hedef` olacak şekilde Poisson taban oranını bulur.
    Maruz kalma = simülatörde en az bir zararına satış denemesi; eğilimli (u büyük) kişilerde daha olası."""
    f = lambda ll: normal_beklenen(lambda u: 1 - np.exp(-np.exp(ll) * np.exp(MARUZ_KATSAYI * u)), sigma)
    lo, hi = -8.0, 8.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if f(mid) < hedef:
            lo = mid
        else:
            hi = mid
    return math.exp((lo + hi) / 2)


def lojistik_kume(X, k, m, kume):
    """Binom lojistik regresyon (k başarı / m deneme), IRLS ve kümeye dayanıklı (CR1) kovaryans.

    Katılımcı içi tekrarlı ölçümler bağımsız sayılmadığı için standart hatalar katılımcı kümesine göre
    hesaplanır (popülasyon ortalamalı model; GEE'nin bağımsız çalışma korelasyonlu sürümüyle eşdeğer).
    CR1 düzeltmesi G/(G-1) * (N-1)/(N-p), N = toplam deneme sayısı."""
    X = np.asarray(X, float)
    k = np.asarray(k, float)
    m = np.asarray(m, float)
    n, p = X.shape
    _, idx = np.unique(np.asarray(kume), return_inverse=True)
    G = int(idx.max()) + 1
    beta = np.zeros(p)

    def ll(b):
        eta = X @ b
        return float(np.sum(k * eta - m * np.logaddexp(0, eta)))

    cur = ll(beta)
    yakinsadi = False
    for _ in range(100):
        mu = expit(X @ beta)
        w = m * mu * (1 - mu)
        g = X.T @ (k - m * mu)
        H = (X * w[:, None]).T @ X
        try:
            adim = np.linalg.solve(H + 1e-9 * np.eye(p), g)
        except np.linalg.LinAlgError:
            break
        t = 1.0
        while t > 1e-8:
            if ll(beta + t * adim) >= cur - 1e-12:
                break
            t /= 2
        beta = beta + t * adim
        cur = ll(beta)
        if np.max(np.abs(t * adim)) < 1e-10:
            yakinsadi = True
            break
    bos = dict(basarisiz=True, beta=beta, se=np.full(p, np.nan), p=np.full(p, np.nan),
               ci_lo=np.full(p, np.nan), ci_hi=np.full(p, np.nan), G=G, N=float(m.sum()), df=G - 1)
    if not yakinsadi or np.abs(beta).max() > 20 or G < 3:
        return bos
    mu = expit(X @ beta)
    w = m * mu * (1 - mu)
    try:
        ekmek = np.linalg.inv((X * w[:, None]).T @ X)
    except np.linalg.LinAlgError:
        return bos
    skor = X * (k - m * mu)[:, None]
    toplam = np.zeros((G, p))
    np.add.at(toplam, idx, skor)
    et = toplam.T @ toplam
    N = float(m.sum())
    duzelt = G / (G - 1) * (N - 1) / (N - p)
    V = duzelt * ekmek @ et @ ekmek
    se = np.sqrt(np.diag(V))
    df = G - 1
    tv = beta / se
    pv = 2 * stats.t.sf(np.abs(tv), df)
    kritik = stats.t.ppf(1 - ALFA / 2, df)
    return dict(basarisiz=False, beta=beta, se=se, p=pv, ci_lo=beta - kritik * se, ci_hi=beta + kritik * se,
                G=G, N=N, df=df, V=V)


def ols_hc3(X, y):
    """Sıradan EKK, HC3 dayanıklı standart hata (küçük örneklemde HC3 önerilir)."""
    X = np.asarray(X, float)
    y = np.asarray(y, float)
    n, p = X.shape
    XtXi = np.linalg.inv(X.T @ X)
    beta = XtXi @ X.T @ y
    e = y - X @ beta
    h = np.einsum('ij,jk,ik->i', X, XtXi, X)
    u = e / (1 - h)
    V = XtXi @ (X.T * (u ** 2)) @ X @ XtXi
    se = np.sqrt(np.diag(V))
    df = n - p
    pv = 2 * stats.t.sf(np.abs(beta / se), df)
    kritik = stats.t.ppf(1 - ALFA / 2, df)
    return dict(beta=beta, se=se, p=pv, ci_lo=beta - kritik * se, ci_hi=beta + kritik * se, df=df, n=n)


def tasarim_matrisi(A, pre, post, sira, set_kovaryati=True):
    """İki satırlık (1. ve 3. bölüm) birleştirilmiş binom veri: sütunlar sabit, A, bölüm, A×bölüm, [set].
    Her bölümde 4 'sert düşüş + zarar' denemesi var; oran × 4 = satılan deneme sayısı.
    Set kovaryatı: kişinin 1. bölümde hangi seti gördüğü sıraya (X→Y / Y→X) bağlı; set zorluğu için ayarlanır."""
    A = np.asarray(A, float)
    pre = np.asarray(pre, float)
    post = np.asarray(post, float)
    n = len(A)
    kpre = np.rint(pre * BLOK_DENEME)
    kpost = np.rint(post * BLOK_DENEME)
    set_pre = np.array([0.0 if s == 'X→Y' else 1.0 if s == 'Y→X' else np.nan for s in sira])
    kullan = bool(set_kovaryati) and not np.isnan(set_pre).any() and len(np.unique(set_pre)) > 1
    X = np.zeros((2 * n, 5 if kullan else 4))
    k = np.zeros(2 * n)
    X[:, 0] = 1
    X[0::2, 1] = A
    X[1::2, 1] = A
    X[1::2, 2] = 1
    X[1::2, 3] = A
    if kullan:
        X[0::2, 4] = set_pre
        X[1::2, 4] = 1 - set_pre
    k[0::2] = kpre
    k[1::2] = kpost
    m = np.full(2 * n, float(BLOK_DENEME))
    kume = np.repeat(np.arange(n), 2)
    isimler = ['sabit', 'A_grubu', 'bolum3', 'A_x_bolum3'] + (['set_Y'] if kullan else [])
    return X, k, m, kume, isimler, kullan


def birincil_model(A, pre, post, sira):
    X, k, m, kume, isimler, kullan = tasarim_matrisi(A, pre, post, sira)
    r = lojistik_kume(X, k, m, kume)
    i = isimler.index('A_x_bolum3')
    sonuc = dict(isimler=isimler, set_kullanildi=kullan, basarisiz=r['basarisiz'], G=r['G'], df=r['df'], r=r)
    if r['basarisiz']:
        sonuc.update(OR=np.nan, ci_lo=np.nan, ci_hi=np.nan, p=np.nan, beta=np.nan, se=np.nan)
    else:
        sonuc.update(OR=math.exp(r['beta'][i]), ci_lo=math.exp(r['ci_lo'][i]), ci_hi=math.exp(r['ci_hi'][i]),
                     p=float(r['p'][i]), beta=float(r['beta'][i]), se=float(r['se'][i]))
    return sonuc


def bilgi_modeli(A, pre, post, sira, z):
    """Keşifsel (ön kayıtta ikincil): bilgi düzeyi × grup × bölüm. z = kişi düzeyinde standartlaştırılmış ön test puanı.

    Birincil modele z, z×A, z×bölüm3 ve z×A×bölüm3 eklenir. Üçlü terim, müdahale etkisinin (A×bölüm3, log-OR) z'de
    1 standart sapma artış başına ne kadar değiştiğidir (OR > 1: müdahale etkisi bilgi arttıkça zayıflıyor).
    Basit etkiler z = −1 ve +1 için aynı kovaryans matrisinden doğrusal bileşimle alınır. Güç düşüktür; yalnızca keşifsel."""
    X, k, m, kume, isimler, kullan = tasarim_matrisi(A, pre, post, sira)
    zz = np.repeat(np.asarray(z, float), 2)
    a, b3 = X[:, 1], X[:, 2]
    X2 = np.column_stack([X, zz, zz * a, zz * b3, zz * a * b3])
    isimler2 = isimler + ['z', 'z_x_A', 'z_x_bolum3', 'z_x_A_x_bolum3']
    r = lojistik_kume(X2, k, m, kume)
    nan = float('nan')
    sonuc = dict(isimler=isimler2, basarisiz=bool(r['basarisiz']), G=r['G'], df=r['df'])
    if r['basarisiz']:
        sonuc.update(uc_OR=nan, uc_lo=nan, uc_hi=nan, p=nan, dusuk=None, yuksek=None)
        return sonuc
    iA, i3 = isimler2.index('A_x_bolum3'), isimler2.index('z_x_A_x_bolum3')
    kritik = stats.t.ppf(1 - ALFA / 2, r['df'])
    sonuc.update(uc_OR=math.exp(r['beta'][i3]), uc_lo=math.exp(r['ci_lo'][i3]), uc_hi=math.exp(r['ci_hi'][i3]), p=float(r['p'][i3]))
    for ad, zv in (('dusuk', -1.0), ('yuksek', 1.0)):
        b = r['beta'][iA] + zv * r['beta'][i3]
        v = r['V'][iA, iA] + zv ** 2 * r['V'][i3, i3] + 2 * zv * r['V'][iA, i3]
        se = math.sqrt(max(v, 0.0))
        sonuc[ad] = dict(OR=math.exp(b), lo=math.exp(b - kritik * se), hi=math.exp(b + kritik * se),
                         p=float(2 * stats.t.sf(abs(b / se), r['df'])) if se > 0 else nan)
    return sonuc


def tost_or(beta, se, df, or_alt, or_ust, alfa=ALFA):
    """İki tek yönlü test (TOST) ile eşdeğerlik: gerçek OR, [or_alt, or_ust] içinde mi?

    Sınırlar veri görülmeden, bilimsel gerekçeyle belirlenmelidir; burada varsayılan yoktur.
    H0a: OR <= or_alt, H0b: OR >= or_ust. İkisi de reddedilirse (p_tost = büyük olan p < alfa) eşdeğerlik sonucu çıkar.
    Eşdeğer olarak %(100 - 2·alfa) güven aralığı sınırların içinde kalmalıdır (alfa = 0,05 için %90 GA)."""
    if not (0 < or_alt < or_ust):
        raise ValueError('Eşdeğerlik sınırları 0 < alt < üst olmalı')
    if not (or_alt < 1 < or_ust):
        raise ValueError('Eşdeğerlik aralığı OR = 1\'i içermeli (alt < 1 < üst)')
    if any(map(lambda v: v is None or not math.isfinite(v), (beta, se, df))) or se <= 0:
        return dict(hesaplandi=False, or_alt=or_alt, or_ust=or_ust)
    t_alt = (beta - math.log(or_alt)) / se
    t_ust = (beta - math.log(or_ust)) / se
    p_alt = float(stats.t.sf(t_alt, df))
    p_ust = float(stats.t.cdf(t_ust, df))
    kritik = stats.t.ppf(1 - alfa, df)
    p_tost = max(p_alt, p_ust)
    return dict(hesaplandi=True, or_alt=or_alt, or_ust=or_ust, OR=math.exp(beta),
                ci90_lo=math.exp(beta - kritik * se), ci90_hi=math.exp(beta + kritik * se),
                p_alt=p_alt, p_ust=p_ust, p_tost=p_tost, esdeger=bool(p_tost < alfa))


def permutasyon_farki(a, b, n_perm, rng):
    """Grup etiketlerini rastgele karıştırarak ortalama farkı (a-b) için iki yönlü p."""
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    tum = np.concatenate([a, b])
    na = len(a)
    gozlenen = a.mean() - b.mean()
    sira = np.argsort(rng.random((n_perm, len(tum))), axis=1)[:, :na]
    toplam_a = tum[sira].sum(axis=1)
    fark = toplam_a / na - (tum.sum() - toplam_a) / len(b)
    p = (1 + np.sum(np.abs(fark) >= abs(gozlenen) - 1e-12)) / (1 + n_perm)
    return gozlenen, float(p)


def bootstrap_fark(a, b, n_boot, rng):
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    ia = rng.integers(0, len(a), (n_boot, len(a)))
    ib = rng.integers(0, len(b), (n_boot, len(b)))
    d = a[ia].mean(axis=1) - b[ib].mean(axis=1)
    return float(np.percentile(d, 2.5)), float(np.percentile(d, 97.5))


def hedges_g(a, b):
    a = np.asarray(a, float)
    b = np.asarray(b, float)
    na, nb = len(a), len(b)
    sp = math.sqrt(((na - 1) * a.var(ddof=1) + (nb - 1) * b.var(ddof=1)) / (na + nb - 2))
    if sp == 0:
        return np.nan, np.nan, np.nan
    d = (a.mean() - b.mean()) / sp
    j = 1 - 3 / (4 * (na + nb) - 9)
    g = d * j
    se = math.sqrt((na + nb) / (na * nb) + g ** 2 / (2 * (na + nb)))
    return g, g - 1.96 * se, g + 1.96 * se


def holm(pdeger):
    """Holm-Bonferroni. Hesaplanamayan (NaN) p değerleri aileye girmez ve NaN kalır; aile yalnızca sayısal p'lerden oluşur."""
    p = np.asarray(pdeger, float)
    duz = np.full(len(p), np.nan)
    gecerli = np.where(~np.isnan(p))[0]
    n = len(gecerli)
    en_yuksek = 0.0
    for r, i in enumerate(gecerli[np.argsort(p[gecerli], kind='stable')]):
        en_yuksek = max(en_yuksek, (n - r) * p[i])
        duz[i] = min(1.0, en_yuksek)
    return duz


def cohen_kappa(a, b, rng=None, n_boot=5000):
    """İki kodlayıcı arasında 0/1 kodlar için Cohen kappası. Güven aralığı: maddeler üzerinden bootstrap (küçük n ve
    dengesiz dağılımda analitik standart hatadan daha güvenilir). Tüm kodlar aynıysa kappa tanımsızdır (NaN)."""
    a = np.asarray(a, int)
    b = np.asarray(b, int)
    n = len(a)

    def hesap(x, y):
        po = np.mean(x == y)
        p1, p2 = np.mean(x == 1), np.mean(y == 1)
        pe = p1 * p2 + (1 - p1) * (1 - p2)
        return ((po - pe) / (1 - pe) if pe < 1 else np.nan), po, pe

    kappa, po, pe = hesap(a, b)
    tablo = dict(a=int(((a == 1) & (b == 1)).sum()), b=int(((a == 1) & (b == 0)).sum()),
                 c=int(((a == 0) & (b == 1)).sum()), d=int(((a == 0) & (b == 0)).sum()))
    ci = (np.nan, np.nan)
    if rng is not None and n >= 5 and not np.isnan(kappa):
        idx = rng.integers(0, n, (n_boot, n))
        x, y = a[idx], b[idx]
        pob = (x == y).mean(axis=1)
        p1, p2 = (x == 1).mean(axis=1), (y == 1).mean(axis=1)
        peb = p1 * p2 + (1 - p1) * (1 - p2)
        with np.errstate(divide='ignore', invalid='ignore'):
            kb = (pob - peb) / (1 - peb)
        kb = kb[np.isfinite(kb)]
        if len(kb) > 100:
            ci = (float(np.percentile(kb, 2.5)), float(np.percentile(kb, 97.5)))
    return dict(n=n, po=float(po), pe=float(pe), kappa=float(kappa), ci_lo=ci[0], ci_hi=ci[1], tablo=tablo)
