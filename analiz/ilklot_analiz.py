"""İlk Lot analiz betiği: uygulamadan indirilen CSV'leri okur, ön kayıtlı birincil analizi ve
duyarlılık/ikincil analizleri çalıştırır, Markdown rapor ve grafik üretir.

Kullanım:
  python ilklot_analiz.py KATILIMCI.csv [--olaylar OLAYLAR.csv] [--kodlama KODLAMA.csv]
                          [--hedef-n 40] [--cikti rapor_klasoru] [--seed 1]
  python ilklot_analiz.py KATILIMCI.csv --kor --kor-anahtar anahtar.json   # kör analiz (grup etiketleri maskeli)
  python ilklot_analiz.py --kor-ac anahtar.json                            # anahtarı aç (analiz planı dondurulduktan sonra)
"""
import argparse
import json
import math
import os
import hashlib
import re
import secrets
import sys
import warnings
from datetime import datetime

import numpy as np
import pandas as pd
from scipy import stats

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from ilklot_ortak import (ALFA, BLOK_DENEME, bilgi_modeli, birincil_model, bootstrap_fark, cohen_kappa, hedges_g, holm, lojistik_kume, tost_or,
                          ols_hc3, permutasyon_farki, tasarim_matrisi)

SURUM = '1.2'
GEREKLI = ['code', 'grp', 'completed', 'decisions', 'panic_rate_pre', 'panic_rate_post', 'set_order', 'test_mode']
SAYISAL = ['completed', 'decisions', 'panic_rate_pre', 'panic_rate_post', 'panic_rate_change', 'sell_rate_gain_pre',
           'sell_rate_loss_pre', 'sell_rate_gain_post', 'sell_rate_loss_post', 'rt_median_pre_ms', 'rt_median_post_ms',
           'sim_trades', 'sim_sells', 'sim_loss_sells', 'sim_buys', 'cooldown_shown', 'cooldown_cancel', 'cooldown_proceed',
           'stress_pre', 'stress_sim', 'stress_post', 'pre_test', 'pre_test_b3', 'post_test', 'attention_pass', 'comprehension_first_try',
           'help_opens', 'test_mode', 'consent_sections_opened', 'consent_read_s']
RENK_A, RENK_B = '#4338A8', '#C98A1B'
KOR = False  # kör analiz modu: ana() içinde --kor ile açılır
KOR_SUTUNLAR = re.compile(r'^cooldown_')  # grubu doğrudan ele veren sütunlar (bekleme ekranı yalnız A'da çıkar)
GUCLU_TAHMIN = re.compile(r'bekle|beklet|saniye|\bsn\b|geciktir|gecikme|ekran(ı)? çık|durdur|duraks|yavaşlat')
ZAYIF_TAHMIN = re.compile(r'panik')


def kor_maskele(metin):
    """Kör modda rapor metnindeki grup adlarını nötr etiketlere çevirir. Gerçek etiketler rastgele
    yer değiştirmiş olduğundan "A" artık "ilk grup" demektir; "bekleme süreli/kontrol" açıklamaları yanıltır, silinir."""
    metin = re.sub(r' ?\(bekleme süreli\)', '', metin)
    metin = re.sub(r' ?\(kontrol\)', '', metin)
    metin = re.sub(r'\bA\b', 'G1', metin)
    return re.sub(r'\bB\b', 'G2', metin)


def tr_kucuk(s):
    return str(s).replace('İ', 'i').replace('I', 'ı').lower()


def sayi(x, d=2):
    if x is None or (isinstance(x, (float, np.floating)) and (math.isnan(x) or math.isinf(x))):
        return '-'
    return f'{x:.{d}f}'.replace('.', ',')


def yuzde(x):
    return '-' if x is None or (isinstance(x, (float, np.floating)) and (math.isnan(x) or math.isinf(x))) else f'%{100 * x:.0f}'


def pdeg(p):
    if p is None or (isinstance(p, (float, np.floating)) and math.isnan(p)):
        return '-'
    if 0.0495 <= p < 0.0505:
        return 'p = ' + f'{p:.4f}'.replace('.', ',')  # 0,050 yazılırsa "anlamlı" kararıyla çelişir
    return 'p < 0,001' if p < 0.001 else 'p = ' + f'{p:.3f}'.replace('.', ',')


def md_tablo(basliklar, satirlar):
    cikti = ['| ' + ' | '.join(basliklar) + ' |', '|' + '|'.join(['---'] * len(basliklar)) + '|']
    for s in satirlar:
        cikti.append('| ' + ' | '.join(str(x) for x in s) + ' |')
    return '\n'.join(cikti)


def oku(yol):
    df = pd.read_csv(yol, encoding='utf-8-sig', dtype=str, keep_default_na=False)
    return df


def sayisala(df):
    for c in SAYISAL:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors='coerce')
    return df


def sebep_ayristir(metin):
    sonuc = {}
    for parca in str(metin).split('|'):
        if ':' in parca:
            ad, n = parca.rsplit(':', 1)
            try:
                sonuc[ad] = sonuc.get(ad, 0) + int(n)
            except ValueError:
                pass
    return sonuc


def durumlari_belirle(df):
    durum = []
    for _, r in df.iterrows():
        if r['test_mode'] == 1:
            durum.append('test_modu')
        elif r['grp'] not in ('A', 'B'):
            durum.append('grup_gecersiz')
        elif not (r['completed'] == 1 and r['decisions'] == 12):
            durum.append('tamamlamadi')
        else:
            pre, post = r['panic_rate_pre'], r['panic_rate_post']
            gecerli = all(not math.isnan(v) and 0 <= v <= 1 and abs(v * BLOK_DENEME - round(v * BLOK_DENEME)) < 1e-6 for v in (pre, post))
            durum.append('dahil' if gecerli else 'oran_gecersiz')
    return durum


def birincil_hesapla(d, rng, n_perm=10000, n_boot=5000, tam=True):
    A = d['A'].to_numpy()
    nA, nB = int((A == 1).sum()), int((A == 0).sum())
    sonuc = dict(nA=nA, nB=nB, yeterli=nA >= 3 and nB >= 3)
    if not sonuc['yeterli']:
        return sonuc
    pre, post = d['pre'].to_numpy(), d['post'].to_numpy()
    sira = d['set_order'].to_numpy()
    mod = birincil_model(A, pre, post, sira)
    ch = post - pre
    sonuc.update(model=mod, OR=mod['OR'], ci_lo=mod['ci_lo'], ci_hi=mod['ci_hi'], p=mod['p'], basarisiz=mod['basarisiz'],
                 G=mod['G'], set_kullanildi=mod['set_kullanildi'],
                 fark_yp=100 * (ch[A == 1].mean() - ch[A == 0].mean()))
    if tam:
        _, p_perm = permutasyon_farki(ch[A == 1], ch[A == 0], n_perm, rng)
        lo, hi = bootstrap_fark(ch[A == 1], ch[A == 0], n_boot, rng)
        g, glo, ghi = hedges_g(ch[A == 1], ch[A == 0])
        set_post = np.array([1.0 if s == 'X→Y' else 0.0 if s == 'Y→X' else np.nan for s in sira])
        kolon = [np.ones(len(A)), A, pre]
        if not np.isnan(set_post).any() and len(np.unique(set_post)) > 1:
            kolon.append(set_post)
        try:
            anc = ols_hc3(np.column_stack(kolon), post)
        except np.linalg.LinAlgError:
            anc = dict(beta=np.full(len(kolon), np.nan), ci_lo=np.full(len(kolon), np.nan), ci_hi=np.full(len(kolon), np.nan), p=np.full(len(kolon), np.nan))
        welch = stats.ttest_ind(ch[A == 1], ch[A == 0], equal_var=False)
        sonuc.update(p_perm=p_perm, fark_lo=100 * lo, fark_hi=100 * hi, g=g, g_lo=glo, g_hi=ghi,
                     ancova_b=100 * anc['beta'][1], ancova_lo=100 * anc['ci_lo'][1], ancova_hi=100 * anc['ci_hi'][1], ancova_p=anc['p'][1],
                     welch_p=float(welch.pvalue))
    return sonuc


def yon_cumlesi(r):
    if not r.get('yeterli'):
        return 'Yeterli katılımcı yok; test çalıştırılmadı.'
    if r.get('basarisiz'):
        return 'Model yakınsamadı (verideki bir hücrede hiç ya da tüm denemelerde satış olabilir); sonuçlar için permütasyon ve ANCOVA satırlarına bak.'
    anlamli = r['p'] < ALFA
    if KOR:
        return (f"Birincil test {'anlamlı' if anlamli else 'anlamlı değil'} (OR = {sayi(r['OR'])}, %95 GA [{sayi(r['ci_lo'])}; {sayi(r['ci_hi'])}], {pdeg(r['p'])}). "
                "OR < 1 ise 3. bölümde satış G1'de, OR > 1 ise G2'de daha çok düştü; hangisinin bekleme ekranı grubu olduğu anahtar açılana kadar bilinmiyor.")
    if anlamli and r['OR'] < 1:
        return (f"Birincil test anlamlı ve beklenen yönde: A grubunda panik satış oranı 1. bölümden 3. bölüme B grubuna göre daha çok azaldı "
                f"(OR = {sayi(r['OR'])}, %95 GA [{sayi(r['ci_lo'])}; {sayi(r['ci_hi'])}], {pdeg(r['p'])}).")
    if anlamli:
        return (f"Birincil test anlamlı ama beklenenin TERSİ yönde: A grubunda panik satış B grubuna göre daha az azaldı ya da arttı "
                f"(OR = {sayi(r['OR'])}, %95 GA [{sayi(r['ci_lo'])}; {sayi(r['ci_hi'])}], {pdeg(r['p'])}).")
    return (f"Birincil test anlamlı değil (OR = {sayi(r['OR'])}, %95 GA [{sayi(r['ci_lo'])}; {sayi(r['ci_hi'])}], {pdeg(r['p'])}). "
            "Bu, etkinin olmadığını göstermez; güven aralığının dışında kalan etkiler bu veriyle olası görünmüyor.")


def grafikler(d, klasor):
    yollar = []
    fig, ax = plt.subplots(figsize=(5.2, 4.2))
    rng = np.random.default_rng(0)
    ad_a, ad_b = ('G1', 'G2') if KOR else ('A (bekleme süreli)', 'B (kontrol)')
    for grp, renk, ad, kay in (('A', RENK_A, ad_a, -0.04), ('B', RENK_B, ad_b, 0.04)):
        x = d[d.grp == grp]
        for _, r in x.iterrows():
            j = rng.uniform(-0.02, 0.02)
            ax.plot([0 + kay + j, 1 + kay + j], [np.clip(r.pre + rng.uniform(-.015, .015), 0, 1), np.clip(r.post + rng.uniform(-.015, .015), 0, 1)], color=renk, alpha=0.08, lw=0.8)
        ort = [x.pre.mean(), x.post.mean()]
        se = [x.pre.std(ddof=1) / math.sqrt(len(x)), x.post.std(ddof=1) / math.sqrt(len(x))] if len(x) > 1 else [0, 0]
        t = stats.t.ppf(0.975, max(len(x) - 1, 1))
        ax.errorbar([0 + kay, 1 + kay], ort, yerr=[t * s for s in se], color=renk, marker='o', lw=2.4, capsize=4, label=f'{ad}, n = {len(x)}')
    ax.set_xticks([0, 1], ['1. bölüm\n(simülatörden önce)', '3. bölüm\n(simülatörden sonra)'])
    ax.set_ylabel('Panik satış oranı\n(sert düşüş + zarar denemelerinde satış)')
    ax.set_ylim(-0.03, 1.03)
    ax.set_xlim(-0.35, 1.35)
    ax.legend(frameon=False, loc='upper right', fontsize=9)
    ax.spines[['top', 'right']].set_visible(False)
    ax.set_title('Grup ortalaması ve %95 güven aralığı\n(soluk çizgiler: tek tek katılımcılar)', fontsize=10)
    fig.tight_layout()
    y1 = os.path.join(klasor, 'fig1_panik_oranlari.png')
    fig.savefig(y1, dpi=160)
    plt.close(fig)
    yollar.append(y1)
    fig, ax = plt.subplots(figsize=(5.2, 3.8))
    for i, (grp, renk, ad) in enumerate((('A', RENK_A, ad_a), ('B', RENK_B, ad_b))):
        v = d[d.grp == grp].degisim.to_numpy()
        ax.scatter(i + rng.uniform(-0.12, 0.12, len(v)), v, color=renk, alpha=0.45, s=22)
        ax.hlines(v.mean(), i - 0.25, i + 0.25, color=renk, lw=3)
    ax.axhline(0, color='#8E8DA3', lw=0.8, ls='--')
    ax.set_xticks([0, 1], [ad_a, ad_b])
    ax.set_ylabel('Değişim (3. bölüm − 1. bölüm)')
    ax.spines[['top', 'right']].set_visible(False)
    ax.set_title('Kişi başına panik satış değişimi\n(kalın çizgi: grup ortalaması)', fontsize=10)
    fig.tight_layout()
    y2 = os.path.join(klasor, 'fig2_degisim.png')
    fig.savefig(y2, dpi=160)
    plt.close(fig)
    yollar.append(y2)
    return yollar


def denge_tablosu(d):
    satirlar = []
    a, b = d[d.A == 1], d[d.A == 0]
    for ad, kol in (('1. bölüm panik satış oranı', 'pre'), ('Ön test puanı', 'pre_test')):
        if kol in d.columns and d[kol].notna().sum() > 3:
            x, y = a[kol].dropna(), b[kol].dropna()
            if len(x) > 1 and len(y) > 1:
                sp = math.sqrt((x.var(ddof=1) + y.var(ddof=1)) / 2)
                smd = (x.mean() - y.mean()) / sp if sp > 0 else np.nan
                satirlar.append([ad, f'{sayi(x.mean())} ({sayi(x.std())})', f'{sayi(y.mean())} ({sayi(y.std())})', f'SMD = {sayi(smd)}', pdeg(stats.ttest_ind(x, y, equal_var=False).pvalue)])
    kat = [('Set sırası', 'set_order'), ('Yaş aralığı', 'age'), ('Cinsiyet', 'gender'), ('Bölüm alanı', 'field'), ('Sınıf', 'year'), ('Simülasyon deneyimi', 'sim_exp')]
    for ad, kol in kat:
        if kol not in d.columns:
            continue
        s = d[kol].replace('', 'Cevaplamadı')
        ct = pd.crosstab(d.A, s)
        if ct.shape[1] < 2 or ct.shape[0] < 2:
            continue
        try:
            p = stats.fisher_exact(ct.to_numpy())[1] if ct.shape == (2, 2) else stats.chi2_contingency(ct.to_numpy())[1]
        except ValueError:
            p = np.nan
        dag = lambda g_: ', '.join(f'{k}: {int(ct.loc[g_, k])}' for k in ct.columns if g_ in ct.index)
        satirlar.append([ad, dag(1), dag(0), '-', pdeg(p)])
    if 'invest_exp' in d.columns:
        yat = d.invest_exp.map(lambda v: 'Cevaplamadı' if v == '' else ('Hayır' if v == 'Hiç yapmadım' else 'Evet'))
        ct = pd.crosstab(d.A, yat)
        if ct.shape[1] >= 2 and ct.shape[0] == 2:
            satirlar.append(['Gerçek yatırım deneyimi', ', '.join(f'{k}: {int(ct.loc[1, k])}' for k in ct.columns), ', '.join(f'{k}: {int(ct.loc[0, k])}' for k in ct.columns), '-', pdeg(stats.fisher_exact(ct.to_numpy())[1] if ct.shape == (2, 2) else stats.chi2_contingency(ct.to_numpy())[1])])
    return satirlar


def olay_analizi(yol, d):
    ol = oku(yol)
    gerekli = {'code', 'type', 'data', 'session', 'n'}
    if not gerekli.issubset(ol.columns):
        return dict(hata='Olay dosyasında beklenen sütunlar yok.')
    ol = ol.drop_duplicates(subset=['code', 'session', 'n'])
    ol = ol[(ol['type'] == 'decision') & (ol['code'].isin(d['code']))]
    satir = []
    for _, r in ol.iterrows():
        try:
            v = json.loads(r['data'])
        except json.JSONDecodeError:
            continue
        v['code'] = r['code']
        satir.append(v)
    if not satir:
        return dict(hata='Olay dosyasında "decision" kaydı bulunamadı.')
    t = pd.DataFrame(satir)
    kz = t[(t['kind'] == 'kriz') & (t['pos'] == 'zarar')].copy()
    kz['y'] = (kz['final'] == 'sat').astype(float)
    kz['crowd_var'] = kz['crowd'].notna().astype(float)
    kz = kz.merge(d[['code', 'A']], on='code')
    kz['post'] = (kz['block'] == 'post').astype(float)
    kz['setY'] = (kz['set'] == 'Y').astype(float)
    sonuc = dict(n_karar=len(t), n_kriz_zarar=len(kz))
    ozet = kz.groupby(['code', 'block']).y.sum().unstack().fillna(0)
    tut = d.set_index('code')
    farkli = 0
    for kod, r in ozet.iterrows():
        if kod in tut.index:
            farkli += int(abs(r.get('pre', 0) / 4 - tut.loc[kod, 'pre']) > 1e-6 or abs(r.get('post', 0) / 4 - tut.loc[kod, 'post']) > 1e-6)
    sonuc['uyumsuz_katilimci'] = farkli
    kod_no = {k: i for i, k in enumerate(sorted(kz.code.unique()))}
    kume = kz.code.map(kod_no).to_numpy()
    sets_ok = kz.setY.nunique() > 1
    kolonlar = [np.ones(len(kz)), kz.A, kz.post, kz.A * kz.post] + ([kz.setY] if sets_ok else [])
    m0 = lojistik_kume(np.column_stack(kolonlar), kz.y, np.ones(len(kz)), kume)
    sonuc['m0_or'] = math.exp(m0['beta'][3]) if not m0['basarisiz'] else np.nan
    m1 = lojistik_kume(np.column_stack(kolonlar + [kz.crowd_var]), kz.y, np.ones(len(kz)), kume)
    i = 4 + (1 if sets_ok else 0)
    sonuc['surup_or'] = math.exp(m1['beta'][i]) if not m1['basarisiz'] else np.nan
    sonuc['surup_lo'] = math.exp(m1['ci_lo'][i]) if not m1['basarisiz'] else np.nan
    sonuc['surup_hi'] = math.exp(m1['ci_hi'][i]) if not m1['basarisiz'] else np.nan
    sonuc['surup_p'] = float(m1['p'][i]) if not m1['basarisiz'] else np.nan
    sonuc['satis_surulu'] = float(kz[kz.crowd_var == 1].y.mean())
    sonuc['satis_surusuz'] = float(kz[kz.crowd_var == 0].y.mean())
    return sonuc


def kor_hazirla(df, args, uyarilar):
    """Grup etiketlerini rastgele (yazı-tura) değiştirir, grubu ele veren sütunları atar, anahtarı yazar.
    Etiket değişimi simetriktir: değişen gruplarda birincil OR tam olarak 1/OR, p aynı çıkar."""
    if not args.kor_anahtar:
        sys.exit('HATA: --kor ile birlikte --kor-anahtar DOSYA gerekli (anahtar, analiz planı dondurulana kadar açılmayacak).')
    if os.path.exists(args.kor_anahtar):
        sys.exit(f'HATA: {args.kor_anahtar} zaten var; üzerine yazılmadı (eski anahtarla yeni analizi karıştırma).')
    if args.kor_tohum is not None:
        degis = bool(np.random.default_rng(args.kor_tohum).integers(0, 2))
    else:
        degis = bool(secrets.randbelow(2))
    if degis:
        df['grp'] = df['grp'].map({'A': 'B', 'B': 'A'}).fillna(df['grp'])
    atilan = [c for c in df.columns if KOR_SUTUNLAR.match(c)]
    df = df.drop(columns=atilan)
    anahtar = dict(surum=SURUM, girdi=os.path.basename(args.katilimci),
                   girdi_sha256=hashlib.sha256(open(args.katilimci, 'rb').read()).hexdigest(),
                   etiketler_degisti=degis,
                   anlam=('G1 = gerçekte B (kontrol), G2 = gerçekte A (bekleme süreli); birincil OR için gerçek değer = 1/OR' if degis
                          else 'G1 = gerçekte A (bekleme süreli), G2 = gerçekte B (kontrol); birincil OR değişmez'),
                   olusturma=datetime.now().isoformat(timespec='seconds'))
    metin = json.dumps(anahtar, ensure_ascii=False, indent=1)
    with open(args.kor_anahtar, 'w', encoding='utf-8') as f:
        f.write(metin)
    ozet = hashlib.sha256(metin.encode('utf-8')).hexdigest()
    if args.olaylar:
        uyarilar.append('Kör modda olay dosyası kullanılmadı (bekleme olayları grubu ele verir).')
        args.olaylar = None
    if atilan:
        uyarilar.append(f'Kör mod: grubu ele veren sütunlar analizden çıkarıldı ({", ".join(atilan)}); bekleme ekranını görme/doz-yanıt analizleri ve müdahale-fark-etme tablosu kör modda yok.')
    return df, ozet


def ana(args):
    global KOR
    KOR = bool(args.kor)
    warnings.filterwarnings('ignore', category=RuntimeWarning)
    rng = np.random.default_rng(args.seed)
    os.makedirs(args.cikti, exist_ok=True)
    ham = oku(args.katilimci)
    eksik = [c for c in GEREKLI if c not in ham.columns]
    if eksik:
        sys.exit(f'HATA: CSV dosyasında beklenen sütunlar yok: {", ".join(eksik)}. Uygulamadan indirilen "Katılımcı özeti" dosyasını verdiğinden emin ol.')
    if len(ham) == 0:
        sys.exit('HATA: CSV dosyası boş.')
    df = sayisala(ham.copy())
    df['grp'] = df['grp'].str.strip().str.upper()
    uyarilar = []
    kor_ozet = None
    if KOR:
        df, kor_ozet = kor_hazirla(df, args, uyarilar)
    if 'updated_at' in df.columns:
        df = df.sort_values('updated_at')
    yinelenen = int(df.duplicated('code', keep='last').sum())
    if yinelenen:
        farkli = df[df.duplicated('code', keep=False)].groupby('code').agg(g=('grp', 'nunique'), t=('completed', 'nunique'))
        if (farkli.g > 1).any():
            uyarilar.append(f'{int((farkli.g > 1).sum())} kodun kayıtlarında grup farklı (randomizasyon bütünlüğü sorunu olabilir); en son kayıt kullanıldı, bu kodları incele.')
        if (farkli.t > 1).any():
            uyarilar.append(f'{int((farkli.t > 1).sum())} kodun kayıtlarında tamamlanma durumu farklı; en son kayıt kullanıldı (tamamlamış birinin sonradan gelen yarım kaydı onu düşürmüş olabilir), bu kodları incele.')
        uyarilar.append(f'{yinelenen} yinelenen katılımcı kodu bulundu; her kodun en son kaydı kullanıldı.')
        df = df.drop_duplicates('code', keep='last')
    df = df.reset_index(drop=True)
    df['durum'] = durumlari_belirle(df)
    surumler = sorted(set(df['app_version'])) if 'app_version' in df.columns else []
    if len(surumler) > 1:
        uyarilar.append(f'Veride birden fazla uygulama sürümü var ({", ".join(surumler)}). Sürümler arasında araç değiştiyse bunları ayrı değerlendirmen gerekebilir.')

    toplam = len(df)
    sayac = df.durum.value_counts().to_dict()
    gercek = df[df.durum != 'test_modu']
    akis = [['Dosyadaki kayıt', toplam, '', '']]
    akis.append(['Hızlı test modu (çıkarıldı)', sayac.get('test_modu', 0), '', ''])
    akis.append(['Gerçek katılımcı', len(gercek), int((gercek.grp == 'A').sum()), int((gercek.grp == 'B').sum())])
    tam = gercek[gercek.durum.isin(['dahil', 'oran_gecersiz'])]
    akis.append(['Tamamlayan (12 karar)', len(tam), int((tam.grp == 'A').sum()), int((tam.grp == 'B').sum())])
    tml = gercek[gercek.durum == 'tamamlamadi']
    akis.append(['Tamamlamayan (birincil analize girmez)', len(tml), int((tml.grp == 'A').sum()), int((tml.grp == 'B').sum())])
    gec = gercek[gercek.durum == 'oran_gecersiz']
    if len(gec):
        akis.append(['Oranı geçersiz (çıkarıldı)', len(gec), int((gec.grp == 'A').sum()), int((gec.grp == 'B').sum())])
        uyarilar.append(f'{len(gec)} tamamlayan katılımcının panik satış oranı 0,25 katı değil, 0-1 aralığı dışında ya da boş; birincil analizden çıkarıldı.')
    d = df[df.durum == 'dahil'].copy()
    akis.append(['**Birincil analiz kümesi**', len(d), int((d.grp == 'A').sum()), int((d.grp == 'B').sum())])
    sabit_kayip = None
    ab = gercek[gercek.grp.isin(['A', 'B'])]
    if len(ab) and (ab.grp == 'A').any() and (ab.grp == 'B').any():
        ct = pd.crosstab(ab.grp, ab.durum == 'tamamlamadi')
        if ct.shape == (2, 2):
            sabit_kayip = stats.fisher_exact(ct.to_numpy())[1]
            if sabit_kayip < 0.1:
                uyarilar.append(f'Gruplar arasında tamamlama oranı farklı olabilir (Fisher {pdeg(sabit_kayip)}). Farklı kayıp, sonucu yanlı kılabilir; müdahale ekranının çıkışı etkileyip etkilemediğine bak.')

    d['A'] = (d.grp == 'A').astype(int)
    d['pre'] = d['panic_rate_pre']
    d['post'] = d['panic_rate_post']
    d['degisim'] = d['post'] - d['pre']
    d['dikkat_kaldi'] = d['attention_pass'].eq(0) if 'attention_pass' in d.columns else False
    d['anlama_dusuk'] = d['comprehension_first_try'].lt(2) if 'comprehension_first_try' in d.columns else False
    if 'purpose_guess' in d.columns:
        kucuk = d.purpose_guess.map(tr_kucuk)
        d['amac_aday'] = kucuk.map(lambda s: bool(GUCLU_TAHMIN.search(s)))
        d['amac_zayif'] = kucuk.map(lambda s: bool(ZAYIF_TAHMIN.search(s)))
    else:
        d['amac_aday'] = False
        d['amac_zayif'] = False
    d['amac_dogru'] = np.nan
    d['amac_kati'] = np.nan
    kodlama_kullanildi = False
    iki_kodlayici = False
    uyum = None
    if args.kodlama:
        kod = oku(args.kodlama)
        if 'code' in kod.columns and kod.duplicated('code').any():
            uyarilar.append(f'Kodlama dosyasında {int(kod.duplicated("code").sum())} yinelenen kod var; her kodun son satırı kullanıldı (aksi hâlde katılımcı analizde iki kez sayılırdı). Dosyayı düzelt.')
            kod = kod.drop_duplicates('code', keep='last')
        kolonlar = set(kod.columns)
        for c in ('kodlayici1', 'kodlayici2', 'uzlasma', 'manuel_dogru'):
            if c in kolonlar:
                kod[c] = pd.to_numeric(kod[c], errors='coerce')
                kod.loc[~kod[c].isin([0, 1]), c] = np.nan
        iki = {'code', 'kodlayici1', 'kodlayici2'}.issubset(kolonlar) and (kod['kodlayici1'].notna().any() or kod['kodlayici2'].notna().any())
        if iki:
            # İki bağımsız kodlayıcı: uyum Cohen kappası; nihai kod = uzlaşma (varsa), yoksa iki kodlayıcı aynıysa o kod
            k1, k2 = kod['kodlayici1'], kod['kodlayici2']
            ikisi = k1.notna() & k2.notna()
            uz = kod['uzlasma'] if 'uzlasma' in kolonlar else pd.Series(np.nan, index=kod.index)
            kod['nihai'] = np.where(uz.notna(), uz, np.where(ikisi & (k1 == k2), k1, np.nan))
            kod['kati'] = np.where(k1.notna() | k2.notna(), ((k1 == 1) | (k2 == 1)).astype(float), np.nan)
            if ikisi.sum() >= 1:
                uyum = cohen_kappa(k1[ikisi].astype(int), k2[ikisi].astype(int), rng)
            ihtilaf = kod[ikisi & (k1 != k2)]
            cozulmeyen = ihtilaf[ihtilaf['nihai'].isna()] if len(ihtilaf) else ihtilaf
            if len(ihtilaf):
                sutunlar = [c for c in ('code', 'purpose_guess', 'kodlayici1', 'kodlayici2', 'uzlasma') if c in kod.columns]
                ihtilaf[sutunlar].to_csv(os.path.join(args.cikti, 'kodlama_ihtilaf.csv'), index=False, encoding='utf-8-sig')
            if len(cozulmeyen):
                uyarilar.append(f'{len(cozulmeyen)} kodlama ihtilafı uzlaşmayla çözülmedi (`kodlama_ihtilaf.csv`, `uzlasma` sütununu doldur). Çözülmeyenler birincil duyarlılık satırında "doğru tahmin etmedi" sayılmadı; katı satırda çıkarıldı.')
            if uyum and uyum['n'] < 20:
                uyarilar.append(f'Kodlayıcılar arası uyum yalnızca {uyum["n"]} maddeye dayanıyor; kappa ve güven aralığı çok belirsiz.')
            d = d.drop(columns=['amac_dogru', 'amac_kati']).merge(kod[['code', 'nihai', 'kati']].rename(columns={'nihai': 'amac_dogru', 'kati': 'amac_kati'}), on='code', how='left')
            kodlama_kullanildi = True
            iki_kodlayici = True
            bos = int(d.amac_dogru.isna().sum()) - len(cozulmeyen) if len(cozulmeyen) <= int(d.amac_dogru.isna().sum()) else 0
            if bos > 0:
                uyarilar.append(f'Amaç tahmini kodlamasında {bos} katılımcı için karar yok (kodlanmamış); bunlar "doğru tahmin etmedi" sayılmadı, duyarlılık analizinde tutuldu.')
        elif {'code', 'manuel_dogru'}.issubset(kolonlar):
            d = d.drop(columns=['amac_dogru']).merge(kod[['code', 'manuel_dogru']].rename(columns={'manuel_dogru': 'amac_dogru'}), on='code', how='left')
            kodlama_kullanildi = True
            bos = int(d.amac_dogru.isna().sum())
            if bos:
                uyarilar.append(f'Amaç tahmini kodlama dosyasında {bos} katılımcı için karar boş; bunlar "doğru tahmin etmedi" sayılmadı, duyarlılık analizinde tutuldu.')
        else:
            uyarilar.append('Kodlama dosyasında "code" ile ("kodlayici1" ve "kodlayici2") ya da "manuel_dogru" sütunları yok ya da boş; kullanılmadı.')
    d['amac_cikar'] = d.amac_dogru.eq(1) if kodlama_kullanildi else d.amac_aday
    d['amac_kati_cikar'] = d.amac_kati.eq(1) if iki_kodlayici else False
    for kol in ('attention_pass', 'comprehension_first_try'):
        if kol in d.columns and d[kol].isna().any():
            uyarilar.append(f'{kol} {int(d[kol].isna().sum())} katılımcıda boş; bu katılımcılar o dışlama kuralında tutuldu.')

    tanimsiz_set = int((~d.set_order.isin(['X→Y', 'Y→X'])).sum())
    if tanimsiz_set:
        uyarilar.append(f'{tanimsiz_set} katılımcıda set_order "X→Y" ya da "Y→X" değil (boş ya da farklı yazım); ön kayıtlı modeldeki SetY kovaryatı bu yüzden modele girmedi. CSV\'yi uygulamadan indirildiği hâliyle ver; elle düzenleme yapıldıysa düzelt.')
    nA, nB = int(d.A.sum()), int((1 - d.A).sum())
    if args.hedef_n and min(nA, nB) < args.hedef_n:
        uyarilar.append(f'Grup başına tamamlayan katılımcı sayısı hedefin altında (A: {nA}, B: {nB}; hedef: {args.hedef_n}). Sonuç güç analizinin öngördüğünden daha belirsiz olur.')
    if 0 < min(nA, nB) < 20:
        uyarilar.append('Grup başına 20\'den az katılımcı var; kümeye dayanıklı standart hatalar ve güven aralıkları bu boyutta güvenilir olmayabilir.')
    for kol, ad in (('pre', '1. bölüm'), ('post', '3. bölüm')):
        if len(d) and (d[kol].mean() > 0.9 or d[kol].mean() < 0.1):
            uyarilar.append(f'{ad} panik satış oranı çok uçta (ortalama {sayi(d[kol].mean())}); tavan/taban etkisi nedeniyle fark ölçülemeyebilir.')

    # Birincil
    bir = birincil_hesapla(d, rng, args.perm, args.boot)
    # Duyarlılık
    maske = lambda m: d[m.to_numpy()]
    kume_tanim = [('Birincil: tüm tamamlayanlar', d), ('Dikkat kontrolünü geçenler', maske(~d.dikkat_kaldi)),
                  ('Anlama kontrolünde ilk denemede ≥ 2 doğru', maske(~d.anlama_dusuk)),
                  ('Dikkat ve anlama kontrolü birlikte', maske(~d.dikkat_kaldi & ~d.anlama_dusuk)),
                  ('Yalnızca amacı doğru tahmin edenler çıkarıldı' + (' (manuel kodlama)' if kodlama_kullanildi else ' (anahtar kelime taraması, yaklaşık)'), maske(~d.amac_cikar)),
                  ('Dikkat, anlama ve amaç tahmini birlikte (amacı doğru tahmin edenler de çıkarıldı)' + (' (manuel kodlama)' if kodlama_kullanildi else ' (anahtar kelime taraması, yaklaşık)'),
                   maske(~d.dikkat_kaldi & ~d.anlama_dusuk & ~d.amac_cikar))]
    if iki_kodlayici:
        kume_tanim.append(('Ayrıca herhangi bir kodlayıcının doğru saydığı da çıkarıldı (katı; ihtilaflılar dahil)', maske(~d.dikkat_kaldi & ~d.anlama_dusuk & ~d.amac_cikar & ~d.amac_kati_cikar)))
    duyarlilik = []
    for ad, x in kume_tanim:
        r = bir if ad.startswith('Birincil') else birincil_hesapla(x, rng, tam=False)
        duyarlilik.append((ad, r))
    degisen = []
    if bir.get('yeterli') and not bir.get('basarisiz'):
        for ad, r in duyarlilik[1:]:
            if r.get('yeterli') and not r.get('basarisiz') and ((r['p'] < ALFA) != (bir['p'] < ALFA) or (r['OR'] < 1) != (bir['OR'] < 1)):
                degisen.append(ad)
    if degisen:
        uyarilar.append('Duyarlılık analizinde sonuç değişiyor (yön ya da anlamlılık): ' + '; '.join(degisen) + '. Bu, birincil sonucun dışlama kurallarına duyarlı olduğunu gösterir.')

    # İkincil
    ikincil = []
    notlar_ik = []
    A_ = d[d.A == 1]
    B_ = d[d.A == 0]
    if len(A_) > 4 and 'cooldown_shown' in d.columns and A_.cooldown_shown.nunique() > 1:
        rho, p = stats.spearmanr(A_.cooldown_shown, A_.degisim)
        ikincil.append(('Doz-yanıt: A grubunda bekleme ekranı sayısı ile değişim (Spearman)', f'ρ = {sayi(rho)}, n = {len(A_)}', p))
    maruz = A_[A_.cooldown_shown >= 1] if 'cooldown_shown' in d.columns else A_.iloc[0:0]
    maruz_degil = A_[A_.cooldown_shown == 0] if 'cooldown_shown' in d.columns else A_.iloc[0:0]
    if len(maruz) >= 3 and len(B_) >= 3:
        f_, p = permutasyon_farki(maruz.degisim.to_numpy(), B_.degisim.to_numpy(), args.perm, rng)
        ikincil.append(('Bekleme ekranını gören A katılımcıları ile B: değişim farkı (permütasyon)', f'fark = {sayi(100 * f_)} yp, n = {len(maruz)} / {len(B_)}', p))
        notlar_ik.append('Bekleme ekranını görmek rastgele atanmadı: yalnızca simülatörde zararına satış deneyenler gördü. Bu karşılaştırma nedensel yorum için zayıftır, birincil analiz (tüm A) esastır.')
    if 'sim_sell_reasons' in d.columns:
        def korku(m):
            c = sebep_ayristir(m)
            payda = sum(v for k, v in c.items() if k != 'Söylemek istemiyorum')
            return c.get('Korktum', 0) / payda if payda else np.nan
        d['korku_payi'] = d.sim_sell_reasons.map(korku)
        xa, xb = d[d.A == 1].korku_payi.dropna(), d[d.A == 0].korku_payi.dropna()
        if len(xa) >= 3 and len(xb) >= 3:
            p = stats.mannwhitneyu(xa, xb, alternative='two-sided').pvalue
            ikincil.append(('Satış gerekçelerinde "Korktum" payı (simülatör), A ve B', f'A: {sayi(xa.mean())} (n={len(xa)}), B: {sayi(xb.mean())} (n={len(xb)})', p))
    for ad, kol in (('Gerginlik değişimi (3. bölüm sonrası − 1. bölüm sonrası)', None), ('Simülatör sonrası gerginlik', 'stress_sim')):
        if kol is None and {'stress_pre', 'stress_post'}.issubset(d.columns):
            v = (d.stress_post - d.stress_pre)
        elif kol and kol in d.columns:
            v = d[kol]
        else:
            continue
        xa, xb = v[d.A == 1].dropna(), v[d.A == 0].dropna()
        if len(xa) >= 3 and len(xb) >= 3:
            ikincil.append((ad + ', A ve B', f'A: {sayi(xa.mean())} (n={len(xa)}), B: {sayi(xb.mean())} (n={len(xb)})', stats.mannwhitneyu(xa, xb, alternative='two-sided').pvalue))
    if {'rt_median_pre_ms', 'rt_median_post_ms'}.issubset(d.columns):
        v = np.log(d.rt_median_post_ms / d.rt_median_pre_ms).replace([np.inf, -np.inf], np.nan)
        xa, xb = v[d.A == 1].dropna(), v[d.A == 0].dropna()
        if len(xa) >= 3 and len(xb) >= 3:
            ikincil.append(('Karar süresi değişimi (log oran, 3. / 1. bölüm), A ve B', f'A: {sayi(xa.mean())}, B: {sayi(xb.mean())}', stats.mannwhitneyu(xa, xb, alternative='two-sided').pvalue))
    olay = None
    if args.olaylar:
        olay = olay_analizi(args.olaylar, d)
        if 'hata' in olay:
            uyarilar.append(olay['hata'])
            olay = None
        else:
            if olay['uyumsuz_katilimci']:
                uyarilar.append(f'Olay kaydındaki kararlar {olay["uyumsuz_katilimci"]} katılımcıda katılımcı özetindeki oranlarla uyuşmuyor. İki dosyanın aynı anda indirildiğinden emin ol.')
            if not math.isnan(olay['surup_p']):
                ikincil.append(('Sürü bilgisi etkisi (sert düşüş + zarar denemelerinde, sürü bilgisi var / yok; deneme düzeyi, kümeye dayanıklı)',
                                f'satış oranı {sayi(olay["satis_surulu"])} / {sayi(olay["satis_surusuz"])}, OR = {sayi(olay["surup_or"])} [{sayi(olay["surup_lo"])}; {sayi(olay["surup_hi"])}]', olay['surup_p']))
            else:
                notlar_ik.append('Sürü bilgisi etkisi modeli yakınsamadı (veri çok az ya da bir hücrede hiç/tüm denemelerde satış var); Holm düzeltmesine alınmadı.')
    # Bilgi düzeyi × grup × bölüm (ön kayıtta ikincil/keşifsel): ön test puanı kişi düzeyinde z-puanı, sürekli (bölme noktası seçilmez)
    if 'pre_test' in d.columns:
        dz = d[d.pre_test.notna()]
        if len(dz) >= 10 and dz.pre_test.nunique() > 1 and (dz.A == 1).sum() >= 3 and (dz.A == 0).sum() >= 3:
            z = (dz.pre_test - dz.pre_test.mean()) / dz.pre_test.std(ddof=0)
            bm = bilgi_modeli(dz.A.to_numpy(), dz.pre.to_numpy(), dz.post.to_numpy(), dz.set_order.to_numpy(), z.to_numpy())
            if bm['basarisiz']:
                notlar_ik.append('Bilgi düzeyi × grup × bölüm modeli yakınsamadı (veri çok az); Holm düzeltmesine alınmadı.')
            else:
                ikincil.append(('Bilgi düzeyi × grup × bölüm (ön test puanı, z; üçlü etkileşim OR > 1: etki bilgiyle zayıflıyor; kümeye dayanıklı)',
                                f'OR = {sayi(bm["uc_OR"])} [{sayi(bm["uc_lo"])}; {sayi(bm["uc_hi"])}]; düşük bilgi (−1 SS) A×bölüm OR = {sayi(bm["dusuk"]["OR"])} [{sayi(bm["dusuk"]["lo"])}; {sayi(bm["dusuk"]["hi"])}], yüksek bilgi (+1 SS) OR = {sayi(bm["yuksek"]["OR"])} [{sayi(bm["yuksek"]["lo"])}; {sayi(bm["yuksek"]["hi"])}]; n = {len(dz)}', bm['p']))
        else:
            notlar_ik.append('Bilgi düzeyi × grup × bölüm için ön test puanı yetersiz (en az 10 kişi, değişen puan, her grupta ≥ 3).')
    # Duyarlılık: yalnızca Big Three puanıyla aynı model (doğrulanmamış ek maddeler sonucu belirliyor mu?). Holm'a girmez, yalnızca not.
    if 'pre_test_b3' in d.columns:
        db = d[d.pre_test_b3.notna()]
        if len(db) >= 10 and db.pre_test_b3.nunique() > 1 and (db.A == 1).sum() >= 3 and (db.A == 0).sum() >= 3:
            zb = (db.pre_test_b3 - db.pre_test_b3.mean()) / db.pre_test_b3.std(ddof=0)
            bb = bilgi_modeli(db.A.to_numpy(), db.pre.to_numpy(), db.post.to_numpy(), db.set_order.to_numpy(), zb.to_numpy())
            if not bb['basarisiz']:
                notlar_ik.append(f'Duyarlılık (yalnızca Big Three puanı, 3 madde): bilgi düzeyi × grup × bölüm OR = {sayi(bb["uc_OR"])} [{sayi(bb["uc_lo"])}; {sayi(bb["uc_hi"])}], p = {sayi(bb["p"])} (Holm dışı, yalnızca karşılaştırma için).')
    pler = [x[2] for x in ikincil]
    duz = holm(pler) if pler else []

    # Manipülasyon kontrolü
    manip = None
    if 'manip_saw_wait' in d.columns and not KOR:
        sinif = np.where(d.A == 0, 'B (kontrol)', np.where(d.get('cooldown_shown', pd.Series(0, index=d.index)).fillna(0) >= 1, 'A, bekleme ekranını gördü', 'A, bekleme ekranını görmedi'))
        manip = pd.crosstab(pd.Series(sinif, index=d.index, name='grup'), d.manip_saw_wait.replace('', 'Cevaplamadı'))
        gor = d[(d.A == 1) & (d.get('cooldown_shown', 0) >= 1)]
        if len(gor) >= 3 and (gor.manip_saw_wait != 'Evet').mean() > 0.4:
            uyarilar.append('Bekleme ekranını gören A katılımcılarının %40\'tan fazlası bunu hatırlamıyor/bildirmiyor: müdahale fark edilmemiş olabilir.')
        kar = d[(d.A == 0) & (d.manip_saw_wait == 'Evet')]
        if len(d[d.A == 0]) and len(kar) / len(d[d.A == 0]) > 0.1:
            uyarilar.append('B (kontrol) grubunda bekleme gördüğünü söyleyenlerin oranı %10\'u aşıyor: gruplar arası bulaşma olabilir.')

    # Dosyalar
    dd = df[['code', 'grp', 'durum']].copy()
    ek = d[['code', 'dikkat_kaldi', 'anlama_dusuk', 'amac_aday']]
    dd = dd.merge(ek, on='code', how='left')
    dd.to_csv(os.path.join(args.cikti, 'dislama_kaydi.csv'), index=False, encoding='utf-8-sig')
    kodlama_sablon = None
    if 'purpose_guess' in d.columns and not kodlama_kullanildi and (d.purpose_guess != '').any():
        sb = d[d.purpose_guess != ''][['code', 'purpose_guess']].sample(frac=1, random_state=args.seed)
        sb['kodlayici1'] = ''
        sb['kodlayici2'] = ''
        sb['uzlasma'] = ''
        kodlama_sablon = os.path.join(args.cikti, 'amac_tahmini_kodlama.csv')
        sb.to_csv(kodlama_sablon, index=False, encoding='utf-8-sig')
    tost = None
    if args.esdeger_or and bir.get('yeterli') and not bir.get('basarisiz'):
        m_ = bir['model']
        tost = tost_or(m_['beta'], m_['se'], m_['df'], *args.esdeger_or)
    grafik_yollari = []
    if bir.get('yeterli'):
        grafik_yollari = [os.path.basename(y) for y in grafikler(d, args.cikti)]

    # Rapor
    R = []
    R.append('# İlk Lot – Analiz raporu\n')
    if KOR:
        R.append('> **KÖR ANALİZ.** Grup etiketleri rastgele yer değiştirilmiş olabilir; G1/G2 hangi gruba karşılık geliyor bilinmiyor. '
                 f'Anahtar dosyası açılmadan analiz planı (dışlamalar, model, ikincil analizler) dondurulmalı. Anahtar özeti (SHA-256): `{kor_ozet}`\n')
    if args.not_metni:
        R.append('> **' + args.not_metni + '**\n')
    R.append(f'Oluşturulma: {datetime.now().strftime("%d.%m.%Y %H:%M")} · betik sürümü {SURUM} · girdi: `{os.path.basename(args.katilimci)}`' + (f' + `{os.path.basename(args.olaylar)}`' if args.olaylar else '') + f' · tohum {args.seed}\n')
    R.append('## Özet\n')
    R.append(yon_cumlesi(bir) + '\n')
    if bir.get('yeterli'):
        R.append(f"Ham fark: A grubunda değişim {sayi(100 * d[d.A == 1].degisim.mean())} yüzde puan, B grubunda {sayi(100 * d[d.A == 0].degisim.mean())} yüzde puan; fark {sayi(bir['fark_yp'])} yp (%95 GA [{sayi(bir['fark_lo'])}; {sayi(bir['fark_hi'])}], bootstrap).\n")
    R.append('## Uyarılar\n')
    R.append('\n'.join('- ' + u for u in uyarilar) + '\n' if uyarilar else 'Otomatik denetimlerde uyarı çıkmadı.\n')
    R.append('## 1. Katılım akışı\n')
    R.append(md_tablo(['Adım', 'Toplam', 'A', 'B'], akis) + '\n')
    if sabit_kayip is not None:
        R.append(f'Gruplar arasında tamamlama farkı (Fisher, tamamlamayan / tamamlayan): {pdeg(sabit_kayip)}.\n')
    R.append('## 2. Gruplar arası denge\n')
    if len(d) >= 4:
        dt = denge_tablosu(d)
        R.append(md_tablo(['Değişken', 'A', 'B', 'Standartlaştırılmış fark', 'Test'], dt) + '\n')
        R.append('Rastgele atamada denge testlerindeki p değerleri hipotez testi değil, tanı amaçlıdır; çok sayıda değişken test edildiği için bir-iki anlamlı sonuç şansla da beklenir. SMD > 0,5 olan ve sonuçla ilişkili görünen değişkenleri ek model olarak değerlendir.\n')
    else:
        R.append('Katılımcı sayısı çok az; denge tablosu üretilmedi.\n')
    R.append('## 3. Birincil analiz (ön kayıtlı)\n')
    R.append('**Model:** logit P(satış) = b0 + b1·A + b2·Bölüm3 + b3·(A × Bölüm3) + b4·SetY; yalnızca "sert düşüş + zarar" denemeleri (bölüm başına 4); katılımcıya göre kümelenmiş CR1 standart hata; t dağılımı (df = G − 1); α = 0,05 iki yönlü. ' + ('**Yön:** anahtar açılana kadar bilinmiyor (OR < 1: G1\'de satış daha çok düştü).' if KOR else '**Beklenen yön:** b3 < 0 (OR < 1).') + '\n')
    if bir.get('yeterli'):
        R.append(f'- Birincil analiz kümesi: A n = {bir["nA"]}, B n = {bir["nB"]} (G = {bir["G"]})' + ('' if bir.get('set_kullanildi') else '; set kovaryatı modele GİRMEDİ (set_order eksik/tanınmayan değer içeriyor ya da tek değerli)') + '\n')
        or_satir = (['**A × Bölüm 3 etkileşimi (odds oranı)**', 'model yakınsamadı', '-', '-'] if bir.get('basarisiz')
                    else ['**A × Bölüm 3 etkileşimi (odds oranı)**', sayi(bir['OR']), f"[{sayi(bir['ci_lo'])}; {sayi(bir['ci_hi'])}]", pdeg(bir['p'])])
        R.append(md_tablo(['Ölçüt', 'Tahmin', '%95 GA', 'Test'], [or_satir,
            ['Ham değişim farkı A − B (yüzde puan)', sayi(bir['fark_yp']), f"[{sayi(bir['fark_lo'])}; {sayi(bir['fark_hi'])}] (bootstrap)", f"{pdeg(bir['p_perm'])} (permütasyon)"],
            ['ANCOVA: 3. bölüm ~ grup + 1. bölüm (yüzde puan)', sayi(bir['ancova_b']), f"[{sayi(bir['ancova_lo'])}; {sayi(bir['ancova_hi'])}]", pdeg(bir['ancova_p'])],
            ['Standartlaştırılmış etki (Hedges g, değişim puanı)', sayi(bir['g']), f"[{sayi(bir['g_lo'])}; {sayi(bir['g_hi'])}]", f"Welch {pdeg(bir['welch_p'])}"]]) + '\n')
        R.append('OR < 1: A grubunda 3. bölümde satış olasılığı 1. bölüme göre B grubundan daha çok düştü. OR popülasyon ortalamalı bir odds oranıdır (kişiye özgü değil). Permütasyon, ANCOVA ve Welch satırları aynı soruya farklı varsayımlarla bakar; birbirleriyle çelişiyorlarsa sonucu temkinli yorumla.\n')
        gtab = []
        for ad, x in (('A (bekleme süreli)', d[d.A == 1]), ('B (kontrol)', d[d.A == 0])):
            gtab.append([ad, len(x), f'{sayi(x.pre.mean())} ({sayi(x.pre.std())})', f'{sayi(x.post.mean())} ({sayi(x.post.std())})', f'{sayi(x.degisim.mean())} ({sayi(x.degisim.std())})'])
        R.append(md_tablo(['Grup', 'n', '1. bölüm: ort. (SS)', '3. bölüm: ort. (SS)', 'Değişim: ort. (SS)'], gtab) + '\n')
        for y in grafik_yollari:
            R.append(f'![{y}]({y})\n')
        R.append('## 4. Duyarlılık analizi (dışlama kurallarına göre)\n')
        satir = []
        for ad, r in duyarlilik:
            if not r.get('yeterli') or r.get('basarisiz'):
                satir.append([ad, r.get('nA', '-'), r.get('nB', '-'), '-', '-', '-'])
            else:
                satir.append([ad, r['nA'], r['nB'], sayi(r['OR']), f"[{sayi(r['ci_lo'])}; {sayi(r['ci_hi'])}]", pdeg(r['p'])])
        R.append(md_tablo(['Küme', 'A n', 'B n', 'OR', '%95 GA', 'Test'], satir) + '\n')
        if args.esdeger_or:
            R.append('### Eşdeğerlik (TOST)\n')
            if tost is None or not tost.get('hesaplandi'):
                R.append('Birincil model yakınsamadığı için eşdeğerlik testi hesaplanamadı.\n')
            else:
                R.append(f"Eşdeğerlik aralığı: OR ∈ [{sayi(tost['or_alt'])}; {sayi(tost['or_ust'])}]. Sınırlar veri görülmeden, ön kayıtta belirlenmiş olmalıdır; bu betik sınır seçmez.\n")
                R.append(md_tablo(['Ölçüt', 'Değer'], [['Etkileşim OR', sayi(tost['OR'])], ['%90 GA', f"[{sayi(tost['ci90_lo'])}; {sayi(tost['ci90_hi'])}]"],
                    ['Alt sınıra karşı p (H0: OR ≤ alt)', pdeg(tost['p_alt'])], ['Üst sınıra karşı p (H0: OR ≥ üst)', pdeg(tost['p_ust'])],
                    ['TOST p (büyük olan)', pdeg(tost['p_tost'])], ['Sonuç', 'Eşdeğer (aralık içinde)' if tost['esdeger'] else 'Eşdeğerlik gösterilemedi']]) + '\n')
                R.append('Aynı kümeye dayanıklı standart hata ve t dağılımı (df = G − 1) kullanılır. "Eşdeğerlik gösterilemedi", "etki yok" demek değildir; örneklem küçükse güven aralığı geniştir ve çoğu zaman sonuçsuz kalır. Birincil OR iki nedenle 1\'e doğru seyrelir (müdahaleyi almayan katılımcılar; popülasyon ortalamalı OR kişiye özgü OR\'den 1\'e yakındır). Bu, eşdeğerlik lehine yanlılık yaratır: sınırın tam üzerindeki bir etki bile sık sık "eşdeğer" çıkabilir (`ilklot_guc.py --esdeger-or`). Sonucu "etki yok" diye değil, "seyreltilmiş OR bu aralıkta" diye yorumla.\n')
    else:
        R.append('Gruplardan birinde 3\'ten az katılımcı var; birincil test çalıştırılmadı.\n')
    R.append('## 5. İkincil ve keşifsel analizler\n')
    R.append('Bunlar ön kayıtta keşifsel olarak tanımlanmıştır; aşağıdaki p değerleri Holm yöntemiyle çoklu karşılaştırma için düzeltilmiştir.\n')
    if ikincil:
        R.append(md_tablo(['Analiz', 'Sonuç', 'p (ham)', 'p (Holm)'], [[a, b, pdeg(c).replace('p = ', '').replace('p < ', '< '), pdeg(duz[i]).replace('p = ', '').replace('p < ', '< ')] for i, (a, b, c) in enumerate(ikincil)]) + '\n')
    else:
        R.append('Yeterli veri olmadığı için ikincil analiz çalıştırılmadı.\n')
    for n_ in notlar_ik:
        R.append('- ' + n_ + '\n')
    if len(maruz_degil) and len(A_):
        R.append(f'- A grubunda {len(maruz_degil)}/{len(A_)} katılımcı simülatörde hiç bekleme ekranı görmedi (müdahaleyi almadı). Birincil analiz niyet-tedavi mantığıyla hepsini içerir; bu oran etkinin neden küçük çıkabileceğini açıklar.\n')
    if olay:
        if math.isnan(olay['m0_or']):
            R.append(f'- Olay kaydı kontrolü: {olay["n_karar"]} karar okundu; deneme düzeyi model yakınsamadı.\n')
        else:
            R.append(f'- Olay kaydı kontrolü: {olay["n_karar"]} karar okundu; deneme düzeyi model (sürü kovaryatsız) OR = {sayi(olay["m0_or"])} (katılımcı özetinden birincil OR = {sayi(bir.get("OR"))}; ikisi aynı olmalı).\n')
    R.append('## 6. Müdahale ve amaç tahmini kontrolleri\n')
    if manip is not None:
        R.append('**"Simülatörde bekleme ekranı gördün mü?" cevapları (sayı):**\n')
        R.append(md_tablo(['Grup'] + list(manip.columns), [[i] + [int(v) for v in r] for i, r in manip.iterrows()]) + '\n')
    if 'purpose_guess' in d.columns:
        dolu = int((d.purpose_guess != '').sum())
        if dolu == 0:
            R.append('**Amaç tahmini:** yazılı tahmin bırakan katılımcı yok.\n')
        else:
            R.append(f'**Amaç tahmini:** {dolu} katılımcı yazılı tahmin bıraktı; anahtar kelime taraması "bekleme/saniye/durdurma" geçen {int(d.amac_aday.sum())} yanıt buldu (yaklaşık; yanlış pozitif/negatif içerir). ' + ('Manuel kodlama kullanıldı.\n' if kodlama_kullanildi else 'Doğru bir kodlama için `amac_tahmini_kodlama.csv` dosyasını gruptan habersiz iki kişiyle kodla (`manuel_dogru` = 1 ya da 0) ve `--kodlama` ile yeniden çalıştır.\n'))
    if uyum:
        t = uyum['tablo']
        kb = lambda k: ('tanımsız' if k is None or (isinstance(k, float) and math.isnan(k)) else 'zayıf (< 0)' if k < 0 else 'çok az (0,00-0,20)' if k <= 0.20 else 'düşük (0,21-0,40)' if k <= 0.40 else 'orta (0,41-0,60)' if k <= 0.60 else 'önemli (0,61-0,80)' if k <= 0.80 else 'neredeyse mükemmel (0,81-1,00)')
        R.append('**Kodlayıcılar arası uyum (amaç tahmini, doğru / yanlış tahmin):**\n')
        R.append(md_tablo(['Ölçüt', 'Değer'], [['İki kodlayıcının da kodladığı madde', uyum['n']], ['Ham uyum', yuzde(uyum['po'])], ['Cohen κ', sayi(uyum['kappa'])],
                  ['%95 GA (bootstrap)', f"[{sayi(uyum['ci_lo'])}; {sayi(uyum['ci_hi'])}]"], ['Yorum (Landis ve Koch bantları)', kb(uyum['kappa'])]]) + '\n')
        R.append(md_tablo(['', 'Kodlayıcı 2: doğru', 'Kodlayıcı 2: yanlış'], [['Kodlayıcı 1: doğru', t['a'], t['b']], ['Kodlayıcı 1: yanlış', t['c'], t['d']]]) + '\n')
        R.append('Doğru tahmin nadirse ham uyum yüksek olsa da κ düşük çıkabilir (dağılım dengesizliği); ikisine birlikte bak. İhtilaflı maddeler `kodlama_ihtilaf.csv` içindedir; nihai kod uzlaşmadan gelir. Yanıt sayısı küçükse aralık geniştir.\n')
    R.append('## 7. Yöntem notları\n')
    R.append('- **Birincil model** kişi içi tekrarlı ölçümü katılımcı kümesine göre dayanıklı standart hatayla hesaba katar; mixed-model (rastgele kesişim) değildir. İki yaklaşımın etkisi karşılaştırılabilir ama tam aynı değildir.\n'
             '- **Küçük örneklem:** G küçükken (20-30 grup başına) kümeye dayanıklı Wald testi hafif liberal olabilir; bu yüzden permütasyon ve ANCOVA satırları da raporlanır. Güç ve I. tip hata kalibrasyonu için `ilklot_guc.py` çalıştırılmalıdır.\n'
             '- **Dışlamalar** veri görülmeden ön kayıtla belirlenir; bu betik sıralamayı değiştirmez. Birincil analizde dışlama yoktur (tamamlayanların hepsi).\n'
             '- **Ham fark** yüzde puan cinsindendir (0,10 = 10 yp).\n')
    R.append('## Dosyalar\n- `dislama_kaydi.csv`: her katılımcının neden dahil/hariç olduğu\n' + ('- `amac_tahmini_kodlama.csv`: kör kodlama şablonu (grup bilgisi içermez)\n' if kodlama_sablon else '') + ('- `kodlama_ihtilaf.csv`: iki kodlayıcının ayrıştığı maddeler (`uzlasma` sütununu doldur)\n' if iki_kodlayici and os.path.exists(os.path.join(args.cikti, 'kodlama_ihtilaf.csv')) else '') + '- `analiz_ozeti.json`: makine okunur ana sonuçlar\n')
    rapor_metni = '\n'.join(R)
    if KOR:
        rapor_metni = kor_maskele(rapor_metni)
        uyarilar = [kor_maskele(u) for u in uyarilar]
    with open(os.path.join(args.cikti, 'rapor.md'), 'w', encoding='utf-8') as f:
        f.write(rapor_metni)
    ozet = dict(surum=SURUM, n_toplam=toplam, n_dahil=len(d), nA=nA, nB=nB, uyarilar=uyarilar,
                kodlama=(None if not uyum else dict(n=uyum['n'], uyum=uyum['po'], kappa=(None if math.isnan(uyum['kappa']) else uyum['kappa']), ci_lo=(None if math.isnan(uyum['ci_lo']) else uyum['ci_lo']), ci_hi=(None if math.isnan(uyum['ci_hi']) else uyum['ci_hi']), tablo=uyum['tablo'])),
                birincil={k: (None if (isinstance(v, float) and math.isnan(v)) else v) for k, v in bir.items() if k in ('OR', 'ci_lo', 'ci_hi', 'p', 'fark_yp', 'fark_lo', 'fark_hi', 'p_perm', 'ancova_b', 'ancova_p', 'g', 'nA', 'nB', 'G', 'yeterli', 'basarisiz')},
                kor=KOR, ikincil=[dict(ad=(kor_maskele(a) if KOR else a), sonuc=(kor_maskele(b) if KOR else b), p=c, p_holm=(None if math.isnan(duz[i]) else float(duz[i]))) for i, (a, b, c) in enumerate(ikincil)],
                esdegerlik=(None if tost is None else {k: v for k, v in tost.items()}))
    with open(os.path.join(args.cikti, 'analiz_ozeti.json'), 'w', encoding='utf-8') as f:
        json.dump(ozet, f, ensure_ascii=False, indent=1, default=float)
    print(f'Rapor yazıldı: {os.path.join(args.cikti, "rapor.md")}')
    print(kor_maskele(yon_cumlesi(bir)) if KOR else yon_cumlesi(bir))
    for u in uyarilar:
        print('UYARI:', u)
    if KOR:
        print(f'KÖR MOD: anahtar {args.kor_anahtar} dosyasına yazıldı. Dosyayı AÇMA; analiz planı donana kadar başkasında dursun. Özet (SHA-256): {kor_ozet}')


def main():
    ap = argparse.ArgumentParser(description='İlk Lot analiz betiği')
    ap.add_argument('katilimci', nargs='?', help='Uygulamadan indirilen katılımcı özeti CSV')
    ap.add_argument('--olaylar', help='Tüm olaylar CSV (isteğe bağlı; sürü etkisi ve tutarlılık denetimi için)')
    ap.add_argument('--kodlama', help='Amaç tahmini kodlama CSV (code, manuel_dogru)')
    ap.add_argument('--hedef-n', type=int, default=0, help='Güç analizinde hedeflenen grup başına tamamlayan sayısı')
    ap.add_argument('--cikti', default='analiz_ciktisi', help='Çıktı klasörü')
    ap.add_argument('--not', dest='not_metni', default='', help='Rapor başına eklenen uyarı notu (ör. "SAHTE VERİ")')
    ap.add_argument('--esdeger-or', type=float, nargs='+', metavar='SINIR', help='Eşdeğerlik (TOST) sınırı, veri görülmeden belirlenmiş olmalı. Tek değer x > 1: [1/x, x]; iki değer: alt üst (ör. 0.5 2). Verilmezse TOST çalışmaz')
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--kor', action='store_true', help='Kör analiz: grup etiketleri rastgele değiştirilir (G1/G2), grubu ele veren sütunlar atılır. --kor-anahtar gerekli')
    ap.add_argument('--kor-anahtar', metavar='DOSYA', help='Kör modda etiket eşlemesinin yazılacağı dosya (var olanın üzerine yazılmaz). Analiz planı donana kadar AÇMA')
    ap.add_argument('--kor-tohum', type=int, default=None, help='YALNIZ TEST İÇİN: etiket değişimini belirler. Gerçek analizde verme (rastgelelik kaybolur)')
    ap.add_argument('--kor-ac', metavar='ANAHTAR', help='Anahtar dosyasını okur, etiketlerin gerçek karşılığını yazar ve çıkar')
    ap.add_argument('--perm', type=int, default=10000, help='Permütasyon sayısı')
    ap.add_argument('--boot', type=int, default=5000, help='Bootstrap sayısı')
    a = ap.parse_args()
    if a.kor_ac:
        try:
            ham = open(a.kor_ac, 'rb').read()
            k = json.loads(ham.decode('utf-8'))
        except (OSError, json.JSONDecodeError) as e:
            ap.error(f'--kor-ac: anahtar okunamadı ({e})')
        print('Anahtar özeti (SHA-256):', hashlib.sha256(ham).hexdigest(), '(kör raporun başındaki özetle aynı olmalı)')
        print('Girdi:', k.get('girdi'), '· oluşturma:', k.get('olusturma'))
        print('Etiketler değişti mi:', 'evet' if k.get('etiketler_degisti') else 'hayır')
        print(k.get('anlam'))
        return
    if not a.katilimci:
        ap.error('katılımcı CSV dosyası gerekli')
    if a.kor and not a.kor_anahtar:
        ap.error('--kor ile birlikte --kor-anahtar gerekli')
    if a.esdeger_or is not None:
        v = a.esdeger_or
        if len(v) == 1 and v[0] > 1:
            a.esdeger_or = (1 / v[0], v[0])
        elif len(v) == 2 and 0 < v[0] < 1 < v[1]:
            a.esdeger_or = (v[0], v[1])
        else:
            ap.error('--esdeger-or: tek değer 1\'den büyük olmalı (ör. 2) ya da iki değer alt < 1 < üst (ör. 0.5 2)')
    ana(a)


if __name__ == '__main__':
    main()
