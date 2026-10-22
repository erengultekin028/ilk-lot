"""Kuru çalıştırma: veri hattının (CSV → pilot özeti → analiz raporu) uçtan uca çalıştığını doğrular.
ETKİYE BAKMAZ; yalnızca "hat çalışıyor mu, veri beklenen biçimde mi" sorusunu cevaplar.

İki kullanım:
  python kuru_calistirma.py                      # SAHTE veriyle tüm hattı dener (pilottan önce, 1 dakika)
  python kuru_calistirma.py --pilot KATILIMCI.csv [--olaylar OLAYLAR.csv]
                                                  # GERÇEK pilot verisinin biçimini denetler; sonucu (OR, p, grup farkı) yazmaz

Gerçek veri modunda analiz betiği KÖR modda çalıştırılır ve çıktı geçici klasöre yazılıp silinir;
ekrana yalnızca çıkış kodu ve etkiyi ele vermeyen denetim satırları basılır."""
import argparse
import json
import math
import os
import re
import subprocess
import sys
import tempfile

import pandas as pd

KLASOR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, KLASOR)
from ilklot_ornek_veri import KATILIMCI_KOLONLARI, OLAY_KOLONLARI, uret, yaz  # noqa: E402

SONUCLAR = []


def kaydet(ad, ok, ayrinti=''):
    SONUCLAR.append((ad, ok, ayrinti))


def calistir(betik, *arg):
    r = subprocess.run([sys.executable, os.path.join(KLASOR, betik), *arg], capture_output=True, text=True, cwd=KLASOR)
    return r


def oku(yol):
    return pd.read_csv(yol, encoding='utf-8-sig', dtype=str, keep_default_na=False)


def yapi_denetimi(k, o=None, gercek_veri=True):
    """Veri biçimi ve bütünlük denetimleri. Hiçbirinde sonuç değişkeninin grup karşılaştırması yoktur."""
    kol = set(k.columns)
    eksik = [c for c in KATILIMCI_KOLONLARI if c not in kol]
    fazla = [c for c in k.columns if c not in KATILIMCI_KOLONLARI]
    kaydet('Katılımcı CSV: beklenen tüm sütunlar var', not eksik, ('eksik: ' + ', '.join(eksik)) if eksik else f'{len(k.columns)} sütun')
    if fazla:
        kaydet('Katılımcı CSV: beklenmeyen sütun yok', False, 'fazla: ' + ', '.join(fazla) + ' (CSV sütunları 3 yerde senkron olmalı)')
    gercek = k[k.get('test_mode', pd.Series('', index=k.index)) != '1'] if 'test_mode' in kol else k
    if gercek_veri:
        kaydet('Hızlı test modu satırı yok (gerçek pilotta olmamalı)', len(gercek) == len(k), f'{len(k) - len(gercek)} test modu satırı')
    else:
        kaydet('Sahte veride test modu satırları var (analizin onları dışladığı sınanır)', len(gercek) < len(k), f'{len(k) - len(gercek)} satır')
    kaydet('Her katılımcı kodu bir kez geçiyor', not k.duplicated('code').any() if 'code' in kol else False,
           f'{int(k.duplicated("code").sum())} yinelenen kod' if 'code' in kol and k.duplicated('code').any() else '')
    if 'grp' in kol:
        gec = ~gercek.grp.str.strip().str.upper().isin(['A', 'B'])
        kaydet('Grup etiketleri yalnız A/B', not gec.any(), f'{int(gec.sum())} geçersiz etiket' if gec.any() else
               f'A = {int((gercek.grp.str.upper() == "A").sum())}, B = {int((gercek.grp.str.upper() == "B").sum())} (dağılım, sonuç değil)')
    if 'set_order' in kol:
        gec = ~gercek.set_order.isin(['X→Y', 'Y→X'])
        kaydet('set_order yalnız "X→Y" / "Y→X"', not gec.any(), f'{int(gec.sum())} tanınmayan değer' if gec.any() else '')
    if 'completed' in kol:
        tam = gercek[gercek.completed == '1']
        kaydet('Tamamlayan var', len(tam) > 0, f'{len(tam)}/{len(gercek)} tamamladı')
        if len(tam) and {'panic_rate_pre', 'panic_rate_post'}.issubset(kol):
            kotu = 0
            for c in ('panic_rate_pre', 'panic_rate_post'):
                v = pd.to_numeric(tam[c], errors='coerce')
                kotu += int((v.isna() | (v < 0) | (v > 1) | ((v * 4 - (v * 4).round()).abs() > 1e-6)).sum())
            kaydet('Panik satış oranları 0-1 aralığında ve 0,25 katı', kotu == 0, f'{kotu} geçersiz değer' if kotu else '')
        if len(tam) and 'decisions' in kol:
            kaydet('Tamamlayanlarda 12 karar var', bool((tam.decisions == '12').all()), '' if (tam.decisions == '12').all() else f'{int((tam.decisions != "12").sum())} katılımcıda ≠ 12')
    if 'app_version' in kol:
        s = sorted(set(k.app_version))
        kaydet('Tek uygulama sürümü', len(s) == 1, ', '.join(s))
    if 'consent_version' in kol:
        s = sorted(set(k.consent_version))
        kaydet('Tek onam sürümü', len(s) == 1, ', '.join(s))
    if o is not None:
        eksik_o = [c for c in OLAY_KOLONLARI if c not in o.columns]
        kaydet('Olay CSV: beklenen sütunlar var', not eksik_o, ('eksik: ' + ', '.join(eksik_o)) if eksik_o else f'{len(o)} olay')
        if not eksik_o and 'code' in kol:
            yabanci = set(o.code) - set(k.code)
            kaydet('Olay dosyasındaki kodların hepsi katılımcı dosyasında', not yabanci, f'{len(yabanci)} yabancı kod' if yabanci else '')


def sahte_mod():
    d = tempfile.mkdtemp()
    df, ol = uret(n_grup=15, or_etki=0.5, seed=5)
    k, o = os.path.join(d, 'k.csv'), os.path.join(d, 'o.csv')
    yaz(df, k)
    yaz(ol, o)
    kaydet('Sahte veri üretildi', True, f'{len(df)} katılımcı satırı, {len(ol)} olay')
    yapi_denetimi(oku(k), oku(o), gercek_veri=False)
    r = calistir('ilklot_pilot.py', k, '--olaylar', o, '--cikti', os.path.join(d, 'pilot.md'))
    kaydet('Pilot özeti çalışıyor', r.returncode == 0 and os.path.exists(os.path.join(d, 'pilot.md')), r.stderr.strip().splitlines()[-1] if r.returncode else '')
    r = calistir('ilklot_analiz.py', k, '--olaylar', o, '--cikti', os.path.join(d, 'rapor'), '--perm', '500', '--boot', '300')
    kaydet('Analiz (normal) çalışıyor', r.returncode == 0 and os.path.exists(os.path.join(d, 'rapor', 'rapor.md')), r.stderr.strip().splitlines()[-1] if r.returncode else '')
    r = calistir('ilklot_analiz.py', k, '--kor', '--kor-anahtar', os.path.join(d, 'anahtar.json'), '--cikti', os.path.join(d, 'kor'), '--perm', '500', '--boot', '300')
    kaydet('Analiz (kör) çalışıyor', r.returncode == 0 and os.path.exists(os.path.join(d, 'anahtar.json')), r.stderr.strip().splitlines()[-1] if r.returncode else '')
    if os.path.exists(os.path.join(d, 'rapor', 'analiz_ozeti.json')):
        j = json.load(open(os.path.join(d, 'rapor', 'analiz_ozeti.json'), encoding='utf-8'))
        kaydet('Analiz özeti JSON okunabilir ve birincil sonuç içeriyor', 'OR' in j.get('birincil', {}), '')
    if os.path.exists(os.path.join(d, 'rapor', 'rapor.md')):
        t = open(os.path.join(d, 'rapor', 'rapor.md'), encoding='utf-8').read()
        kaydet('Rapor bölümleri ve grafikleri var', all(x in t for x in ('## 3. Birincil analiz', '## 4. Duyarlılık', '## 5. İkincil')) and
               os.path.exists(os.path.join(d, 'rapor', 'fig1_panik_oranlari.png')), '')
    return d


def gercek_mod(yol, olay_yol):
    k = oku(yol)
    o = oku(olay_yol) if olay_yol else None
    print('GERÇEK PİLOT VERİSİ: yalnız biçim denetlenir; etki, OR ve grup farkı yazılmaz ve bakılmamalıdır.\n')
    yapi_denetimi(k, o)
    d = tempfile.mkdtemp()
    arg = [yol, '--cikti', os.path.join(d, 'p.md')]
    if olay_yol:
        arg += ['--olaylar', olay_yol]
    r = calistir('ilklot_pilot.py', *arg)
    kaydet('Pilot özeti çalışıyor (ayrıntı için normal komutu çalıştır)', r.returncode == 0, r.stderr.strip().splitlines()[-1] if r.returncode else '')
    r = calistir('ilklot_analiz.py', yol, '--kor', '--kor-anahtar', os.path.join(d, 'a.json'), '--cikti', os.path.join(d, 'kor'), '--perm', '200', '--boot', '100')
    kaydet('Analiz hattı hatasız çalışıyor (kör mod, çıktı atıldı)', r.returncode == 0, r.stderr.strip().splitlines()[-1] if r.returncode else '')
    if r.returncode == 0:
        # etkiyi ele vermeyen uyarılar
        uy = [u[7:] for u in r.stdout.splitlines() if u.startswith('UYARI:') and not re.search(r'Duyarlılık|Birincil test|^ ?Kör mod', u[7:])]
        for u in uy:
            kaydet('Analiz uyarısı (bilgi; pilotta küçük n nedeniyle beklenir)', True, u)


def yaz_sonuc():
    gecen = sum(1 for _, ok, _ in SONUCLAR if ok)
    for ad, ok, ay in SONUCLAR:
        print(('✓ ' if ok else '✗ ') + ad + (f'  [{ay}]' if ay else ''))
    print(f'\n{gecen}/{len(SONUCLAR)} denetim tamam.')
    return gecen == len(SONUCLAR)


def main():
    ap = argparse.ArgumentParser(description='İlk Lot kuru çalıştırma')
    ap.add_argument('--pilot', metavar='KATILIMCI.csv', help='Gerçek pilot verisinin biçimini denetle (etkiye bakmaz)')
    ap.add_argument('--olaylar', metavar='OLAYLAR.csv')
    a = ap.parse_args()
    if a.pilot:
        gercek_mod(a.pilot, a.olaylar)
    else:
        print('SAHTE veriyle uçtan uca kuru çalıştırma (gerçek veri değildir)\n')
        sahte_mod()
    sys.exit(0 if yaz_sonuc() else 1)


if __name__ == '__main__':
    main()
