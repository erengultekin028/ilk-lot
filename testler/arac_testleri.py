"""Yayın aracı (firebase/dagit.py), saklama takvimi (etik/saklama_takvimi.py) ve CI tanımının testleri. Tarayıcı gerekmez.
  python testler/arac_testleri.py
Gerçek Firebase'e DOKUNMAZ: `firebase` komutu, geçici bir sahte betikle değiştirilir (çağrı biçimini sınar, sunucuyu sınamaz)."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time
from datetime import date, datetime, timezone

KLASOR = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(KLASOR, '..'))


def yukle(ad, yol):
    spec = importlib.util.spec_from_file_location(ad, yol)
    m = importlib.util.module_from_spec(spec)
    sys.modules[ad] = m
    spec.loader.exec_module(m)
    return m


dagit = yukle('dagit', os.path.join(KOK, 'firebase', 'dagit.py'))
takvim = yukle('saklama_takvimi', os.path.join(KOK, 'etik', 'saklama_takvimi.py'))
# Gerçek dosyada CFG.firebase doluysa testler için "henüz doldurulmamış" haline çevrilir (testler dolu/boş durumları kendileri kurar)
GERCEK_HTML = re.sub(r'(\n\s*)firebase:\{[^}]*\}', r'\1firebase:null', open(os.path.join(KOK, 'ilk-lot.html'), encoding='utf-8').read(), count=1)
GERCEK_KURAL = open(os.path.join(KOK, 'firebase', 'firestore.rules'), encoding='utf-8').read()
FB = 'firebase:{apiKey:"AIzaX",authDomain:"x.firebaseapp.com",projectId:"x",appId:"1:2:web:3"}'
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


def hazir_html():
    """Gerçek dosyadan, tüm yayın ön koşulları sağlanmış bir kopya."""
    h = GERCEK_HTML.replace('firebase:null', FB, 1)
    h = re.sub(r"'\[DOLDUR[^']*'", "'dolu'", h)
    h = h.replace("contact:'arastirmaci@ornek.edu.tr'", "contact:'a@uni.edu.tr'", 1)
    return h


ORNEK_EPOSTA = 'arastirmaci@ornek.edu.tr'
EPOSTA_LISTESI = re.compile(r"in \['[^']*'\]")


def kural_eposta(eposta):
    """Gerçek kural dosyasındaki araştırmacı e-postasını verilen adresle değiştirir (gerçek adres ne olursa olsun testler aynı kalsın)."""
    return EPOSTA_LISTESI.sub(f"in ['{eposta}']", GERCEK_KURAL, count=1)


def hazir_kural():
    return kural_eposta('ben@uni.edu.tr')


def seviye(s, ad):
    return [d for d, a, _ in s if a == ad]


def hatalar(s):
    return sorted(a for d, a, _ in s if d == 'HATA')


@test('Ön kontrol: gerçek proje, doldurulmamış ayarlarda HATA verir (Firebase, onam, iletişim; kurallardaki e-posta hâlâ örnekse o da); hazır kopya hiç HATA vermez')
def _():
    s, durum = dagit.kontrol(derleme_denetle=False, kayitlar=[])
    beklenen = ['Firebase ayarı', 'Onam alanları', 'İletişim adresi'] + (['Güvenlik kuralları'] if ORNEK_EPOSTA in GERCEK_KURAL else [])
    # CFG.firebase doldurulunca "Firebase ayarı" da kalkar; bu test yalnızca hâlâ boş olanların HATA verdiğini ve başka hata çıkmadığını doğrular
    assert durum == 1 and set(hatalar(s)) <= set(beklenen) and 'Onam alanları' in hatalar(s), hatalar(s)
    s, durum = dagit.kontrol(html=hazir_html(), kurallar=hazir_kural(), kayitlar=[], derleme_denetle=False)
    assert durum == 0 and not hatalar(s), s
    assert seviye(s, 'Ölçüt kilidi') == ['UYARI']


@test('Ön kontrol: her eksik tek başına yakalanır (5 ayrı bozma)')
def _():
    h, k = hazir_html(), hazir_kural()
    bozuk = {
        'Firebase ayarı': (h.replace(FB, 'firebase:null'), k),
        'Firebase ayarı ': (h.replace('appId:"1:2:web:3"', 'appId:""'), k),
        'Onam alanları': (h.replace("controller:'dolu'", "controller:'[DOLDUR: x]'"), k),
        'İletişim adresi': (h.replace("contact:'a@uni.edu.tr'", "contact:'arastirmaci@ornek.edu.tr'"), k),
        'Güvenlik kuralları': (h, kural_eposta(ORNEK_EPOSTA)),
    }
    for ad, (hh, kk) in bozuk.items():
        s, durum = dagit.kontrol(html=hh, kurallar=kk, kayitlar=[], derleme_denetle=False)
        assert durum == 1 and hatalar(s) == [ad.strip()], (ad, hatalar(s))
    # hızlı test kilidi satırı kaybolursa
    s, durum = dagit.kontrol(html=h.replace('if(CFG.firebase)return false', 'if(0)return false'), kurallar=k, kayitlar=[], derleme_denetle=False)
    assert hatalar(s) == ['Hızlı test kilidi']


def kayit_yap(html):
    return dict(zaman='2026-11-02T10:00:00+03:00', surum=re.search(r"var APP_VERSION='([^']+)'", html).group(1), onam='v1',
                html_sha256=hashlib.sha256(html.encode('utf-8')).hexdigest(), olcut=dagit.olcut_ayarlari(html))


@test('Dış yazı tipi sunucusu yok: uygulama ve tanıtım sayfası Google Fonts\'a bağlanmaz; derleyici yazı tipi dosyası eksikse durur')
def _():
    for ad in ('ilk-lot.html', 'tanitim.html'):
        h = open(os.path.join(KOK, ad), encoding='utf-8').read()
        assert not re.search(r'fonts\.(googleapis|gstatic)\.com', h), f'{ad} dış yazı tipi sunucusuna bağlanıyor'
        assert h.count('@font-face') == 2 and 'data:font/woff;base64,' in h, ad
    assert '{{YAZI:' not in GERCEK_HTML, 'derlemede yer tutucu kalmamalı'
    gecici = tempfile.mkdtemp()
    kopya = os.path.join(gecici, 'kaynak')
    shutil.copytree(os.path.join(KOK, 'kaynak'), kopya)
    os.remove(os.path.join(kopya, 'yazi', 'BricolageGrotesque-Bold.woff'))
    r = subprocess.run([sys.executable, os.path.join(kopya, 'derle.py'), '--cikti', os.path.join(gecici, 'x.html')], capture_output=True, text=True)
    assert r.returncode != 0 and 'yazı tipi dosyası yok' in (r.stdout + r.stderr), (r.stdout, r.stderr)


@test('Ön kontrol: pilot formu açık kalırsa ana veri toplamada HATA; --pilot ile TAMAM; kapalıyken --pilot UYARI; alan silinirse HATA')
def _():
    h, k = hazir_html(), hazir_kural()
    assert 'pilot:false' in h
    ac = h.replace('pilot:false', 'pilot:true', 1)
    s, durum = dagit.kontrol(html=ac, kurallar=k, kayitlar=[], derleme_denetle=False)
    assert durum == 1 and hatalar(s) == ['Pilot form açık'], hatalar(s)
    s, durum = dagit.kontrol(html=ac, kurallar=k, kayitlar=[], derleme_denetle=False, pilot=True)
    assert durum == 0 and seviye(s, 'Pilot yayını') == ['TAMAM'], s
    s, durum = dagit.kontrol(html=h, kurallar=k, kayitlar=[], derleme_denetle=False, pilot=True)
    assert durum == 0 and seviye(s, 'Pilot form ayarı') == ['UYARI'], s
    s, durum = dagit.kontrol(html=h.replace('pilot:false,', '', 1), kurallar=k, kayitlar=[], derleme_denetle=False)
    assert hatalar(s) == ['Pilot form ayarı'], hatalar(s)
    # Pilot ile ana yayın aynı sürüm numarasını taşırsa kilit kaydı farkı yakalar (ana veri tek sürümden gelmeli)
    kayit = kayit_yap(ac)
    s, durum = dagit.kontrol(html=h, kurallar=k, kayitlar=[kayit], derleme_denetle=False)
    assert 'Kod değişmiş, sürüm aynı' in hatalar(s), hatalar(s)



@test('Ölçüt kilidi: aynıysa TAMAM; her ölçüt değişikliği HATA; sürümsüz kod değişikliği HATA; yeni sürüm UYARI')
def _():
    h, k = hazir_html(), hazir_kural()
    kayit = kayit_yap(h)
    s, durum = dagit.kontrol(html=h, kurallar=k, kayitlar=[kayit], derleme_denetle=False)
    assert durum == 0 and 'Ölçüt ayarları' in [a for d, a, _ in s if d == 'TAMAM']
    degisiklikler = {
        "CFG.seed='ilklot-gorev-v1'": "CFG.seed='baska'",
        "simSeed:'ilklot-sim4-v2669'": "simSeed:'baska'",
        'cooldownSec:10': 'cooldownSec:5',
        'lossThreshold:-0.02': 'lossThreshold:-0.05',
        'drop:0.20': 'drop:0.25',
        'simTicks:300': 'simTicks:150',
        'stake:10000': 'stake:20000',
    }
    for eski, yeni in degisiklikler.items():
        assert eski in h, eski
        hh = h.replace(eski, yeni, 1)
        s, durum = dagit.kontrol(html=hh, kurallar=k, kayitlar=[kayit], derleme_denetle=False)
        assert 'Ölçüt ayarları değişmiş' in hatalar(s) and durum == 1, (eski, hatalar(s))
    # ölçüt dışı davranış değişikliği, sürüm aynı
    hh = h + '\n<!-- degisti -->'
    s, durum = dagit.kontrol(html=hh, kurallar=k, kayitlar=[kayit], derleme_denetle=False)
    assert hatalar(s) == ['Kod değişmiş, sürüm aynı'] and durum == 1
    # sürüm artınca yalnızca uyarı
    hh = re.sub(r"APP_VERSION='[^']+'", "APP_VERSION='2099.01.01-x'", h)
    assert hh != h
    s, durum = dagit.kontrol(html=hh, kurallar=k, kayitlar=[kayit], derleme_denetle=False)
    assert durum == 0 and seviye(s, 'Yeni sürüm') == ['UYARI']
    # boşluk ve satır biçimi farkı ölçüt değişikliği sayılmaz
    hh = h.replace('cooldownSec:10,', 'cooldownSec: 10 ,', 1)
    s, _ = dagit.kontrol(html=hh, kurallar=k, kayitlar=[kayit], derleme_denetle=False)
    assert 'Ölçüt ayarları değişmiş' not in hatalar(s)


@test('Derleme denetimi: gerçek dosya güncel; elle değiştirilmiş dosya HATA')
def _():
    ok, hata = dagit.derleme_guncel_mi()
    assert ok and hata is None
    with tempfile.TemporaryDirectory() as d:
        yol = os.path.join(d, 'x.html')
        with open(yol, 'w', encoding='utf-8', newline='') as f:
            f.write(GERCEK_HTML + ' ')
        eski = dagit.HTML
        dagit.HTML = yol
        try:
            ok, _ = dagit.derleme_guncel_mi()
            s, durum = dagit.kontrol(kayitlar=[])
        finally:
            dagit.HTML = eski
        assert not ok and 'Derleme eski' in hatalar(s)


def bayraklar():
    """dagit'in dosya yollarını geçici klasöre yönlendirir."""
    d = tempfile.mkdtemp()
    kopya = {}
    for ad in ('HTML', 'KURALLAR', 'KAYIT', 'YAYIN', 'derleme_guncel_mi'):
        kopya[ad] = getattr(dagit, ad)
    with open(os.path.join(d, 'ilk-lot.html'), 'w', encoding='utf-8', newline='') as f:
        f.write(hazir_html())
    with open(os.path.join(d, 'firestore.rules'), 'w', encoding='utf-8') as f:
        f.write(hazir_kural())
    dagit.HTML, dagit.KURALLAR = os.path.join(d, 'ilk-lot.html'), os.path.join(d, 'firestore.rules')
    dagit.KAYIT, dagit.YAYIN = os.path.join(d, 'yayin_kaydi.json'), os.path.join(d, 'yayin')
    dagit.derleme_guncel_mi = lambda: (True, None)
    return d, kopya


def geri(kopya):
    for ad, v in kopya.items():
        setattr(dagit, ad, v)


def sus(f, *a):
    g = io.StringIO()
    with contextlib.redirect_stdout(g), contextlib.redirect_stderr(g):
        try:
            r = f(*a)
        except SystemExit as e:
            r = e.code
    return r, g.getvalue()


@test('Betik: --hazirla yayın klasörünü üretir (önbellek kapalı); --kilitle kayıt yazar ve sonraki kontrol onu kullanır')
def _():
    d, kopya = bayraklar()
    try:
        r, cikti = sus(dagit.main, [])
        assert r == 0 and 'GEÇTİ' in cikti and not os.path.exists(dagit.YAYIN), 'varsayılan çalışma hiçbir şey yazmamalı'
        r, cikti = sus(dagit.main, ['--hazirla'])
        assert r == 0
        cfg = json.load(open(os.path.join(dagit.YAYIN, 'firebase.json'), encoding='utf-8'))
        basliklar = {h['key']: h['value'] for h in cfg['hosting']['headers'][0]['headers']}
        assert basliklar['Cache-Control'] == 'no-cache' and cfg['firestore']['rules'] == 'firestore.rules'
        assert open(os.path.join(dagit.YAYIN, 'public', 'index.html'), encoding='utf-8').read() == hazir_html()
        assert open(os.path.join(dagit.YAYIN, 'firestore.rules'), encoding='utf-8').read() == hazir_kural()
        r, cikti = sus(dagit.main, ['--kilitle'])
        kayitlar = json.load(open(dagit.KAYIT, encoding='utf-8'))['kayitlar']
        assert r == 0 and len(kayitlar) == 1 and kayitlar[0]['olcut']['simSeed'] == "'ilklot-sim4-v2669'" and kayitlar[0]['onam'] == 'v1'
        r, cikti = sus(dagit.main, [])
        assert r == 0 and 'Ölçüt ayarları' in cikti and 'UYARI Ölçüt kilidi' not in cikti
        # kilitten sonra ölçüt değişirse hiçbir komut çalışmaz
        with open(dagit.HTML, 'w', encoding='utf-8', newline='') as f:
            f.write(hazir_html().replace('cooldownSec:10', 'cooldownSec:3'))
        shutil.rmtree(dagit.YAYIN)
        r, cikti = sus(dagit.main, ['--hazirla'])
        assert r == 1 and 'Ölçüt ayarları değişmiş' in cikti and not os.path.exists(dagit.YAYIN)
    finally:
        geri(kopya)


@test('Betik: kontrol geçmezse --hazirla, --kilitle ve --yayinla hiçbir şey yapmaz')
def _():
    d, kopya = bayraklar()
    try:
        with open(dagit.KURALLAR, 'w', encoding='utf-8') as f:
            f.write(kural_eposta(ORNEK_EPOSTA))  # kural dosyasında örnek e-posta kalırsa ön kontrol geçmemeli
        for arg in (['--hazirla'], ['--kilitle'], ['--yayinla', '--proje', 'x']):
            r, cikti = sus(dagit.main, arg)
            assert r == 1 and 'hiçbir şey yapılmadı' in cikti, (arg, cikti)
        assert not os.path.exists(dagit.YAYIN) and not os.path.exists(dagit.KAYIT)
        r, cikti = sus(dagit.main, ['--yayinla'])
        assert r == 2, '--proje olmadan yayınlanamaz'
    finally:
        geri(kopya)


@test('Betik: --yayinla sahte firebase komutunu doğru bağımsız değişken ve klasörle çağırır; komut yoksa HATA; --kuru çalıştırmaz')
def _():
    d, kopya = bayraklar()
    eski_yol = os.environ['PATH']
    try:
        bin_ = os.path.join(d, 'bin')
        os.makedirs(bin_)
        iz = os.path.join(d, 'cagri.txt')
        # Windows'ta sahte komut firebase.cmd (gerçek firebase-tools de böyle kurulur), diğerlerinde sh betiği
        win = os.name == 'nt'
        sahte = os.path.join(bin_, 'firebase.cmd' if win else 'firebase')

        def sahte_yaz(govde_sh, govde_cmd):
            with open(sahte, 'w', newline='') as f:
                f.write(govde_cmd if win else govde_sh)
            if not win:
                os.chmod(sahte, os.stat(sahte).st_mode | stat.S_IEXEC)
        sahte_yaz(f'#!/bin/sh\necho "$PWD|$@" > "{iz}"\nexit 0\n', f'@echo off\r\n>"{iz}" echo %CD%^|%*\r\nexit /b 0\r\n')
        os.environ['PATH'] = bin_ + os.pathsep + eski_yol
        r, cikti = sus(dagit.main, ['--yayinla', '--proje', 'ilklot-demo', '--kuru'])
        assert r == 0 and not os.path.exists(iz) and 'firebase deploy --only hosting,firestore:rules --project ilklot-demo' in cikti
        r, cikti = sus(dagit.main, ['--yayinla', '--proje', 'ilklot-demo'])
        assert r == 0
        cwd, args = open(iz, encoding='utf-8').read().strip().split('|', 1)
        assert os.path.realpath(cwd) == os.path.realpath(dagit.YAYIN) and args == 'deploy --only hosting,firestore:rules --project ilklot-demo', (cwd, args)
        sahte_yaz('#!/bin/sh\nexit 7\n', '@echo off\r\nexit /b 7\r\n')
        r, _ = sus(dagit.main, ['--yayinla', '--proje', 'x'])
        assert r == 7, 'firebase hata kodu yukarı aktarılmalı'
        os.environ['PATH'] = os.path.join(d, 'yok')
        r, cikti = sus(dagit.main, ['--yayinla', '--proje', 'x'])
        assert r == 1 and 'firebase komutu bulunamadı' in cikti
    finally:
        os.environ['PATH'] = eski_yol
        geri(kopya)


def ayristir(govde):
    """Bağımsız ICS ayrıştırıcı: satır katlamayı açar, olayları sözlüğe çevirir."""
    assert govde.endswith('\r\n') and '\n' not in govde.replace('\r\n', ''), 'CRLF zorunlu'
    satirlar = []
    for s in govde.split('\r\n')[:-1]:
        if s.startswith(' '):
            satirlar[-1] += s[1:]
        else:
            satirlar.append(s)
    assert satirlar[0] == 'BEGIN:VCALENDAR' and satirlar[-1] == 'END:VCALENDAR'
    olaylar, mevcut, alarm = [], None, False
    for s in satirlar[1:-1]:
        if s == 'BEGIN:VEVENT':
            mevcut = {}
        elif s == 'END:VEVENT':
            olaylar.append(mevcut)
            mevcut = None
        elif s == 'BEGIN:VALARM':
            alarm = True
        elif s == 'END:VALARM':
            alarm = False
        elif mevcut is not None and not alarm:
            ad, _, deger = s.partition(':')
            mevcut[ad.split(';')[0]] = deger
    assert mevcut is None
    return olaylar


@test('Takvim: ay toplama (ay sonu kenar durumları, yıl geçişi)')
def _():
    assert takvim.ay_ekle(date(2027, 1, 31), 1) == date(2027, 2, 28)
    assert takvim.ay_ekle(date(2028, 1, 31), 1) == date(2028, 2, 29)
    assert takvim.ay_ekle(date(2028, 2, 29), 12) == date(2029, 2, 28)
    assert takvim.ay_ekle(date(2026, 12, 18), 2) == date(2027, 2, 18)
    assert takvim.ay_ekle(date(2026, 12, 18), 24) == date(2028, 12, 18)
    assert takvim.ay_ekle(date(2026, 8, 31), 6) == date(2027, 2, 28)


@test('Takvim: geçerli .ics (CRLF, 75 bayt katlama, benzersiz UID, doğru tarihler, kaçışlar)')
def _():
    bas, bit = date(2026, 11, 2), date(2026, 12, 18)
    govde, liste, son = takvim.uret(bas, bit, bit, 24, simdi=datetime(2026, 10, 9, tzinfo=timezone.utc))
    assert son == date(2028, 12, 18)
    assert max(len(s.encode('utf-8')) for s in govde.split('\r\n')) <= 75, 'satır 75 bayttan uzun'
    ol = ayristir(govde)
    assert len(ol) == len(liste) == 6
    assert len({o['UID'] for o in ol}) == len(ol)
    tarih = {o['SUMMARY']: o['DTSTART'] for o in ol}
    assert tarih['İlk Lot: veri toplama bitti\\, kapat ve yedekle'] == '20261218'
    assert tarih['İlk Lot: SAKLAMA SÜRESİ BİTTİ\\, ham veriyi sil'] == '20281218'
    assert tarih['İlk Lot: saklama süresi 90 gün sonra bitiyor'] == '20280919'
    assert tarih['İlk Lot: saklama süresi 30 gün sonra bitiyor'] == '20281118'
    assert tarih['İlk Lot: saklama süresi 7 gün sonra bitiyor'] == '20281211'
    haftalik = [o for o in ol if 'RRULE' in o]
    assert len(haftalik) == 1 and haftalik[0]['DTSTART'] == '20261109' and haftalik[0]['RRULE'] == 'FREQ=WEEKLY;UNTIL=20261218'
    for o in ol:
        assert o['DTEND'] > o['DTSTART'] and o['DTSTAMP'] == '20261009T000000Z'
    assert any('\\,' in o['SUMMARY'] for o in ol), 'virgül kaçışlanmalı'
    assert all(o['DESCRIPTION'].count('\\n') >= 0 and '\n' not in o['DESCRIPTION'] for o in ol)
    assert ';' not in re.sub(r'\;', '', ''.join(o['SUMMARY'] for o in ol)), 'noktalı virgül kaçışsız'
    # aynı girdiyle aynı UID'ler (takvime tekrar aktarınca çoğalmaz)
    govde2, _, _ = takvim.uret(bas, bit, bit, 24, simdi=datetime(2027, 1, 1, tzinfo=timezone.utc))
    assert [o['UID'] for o in ayristir(govde2)] == [o['UID'] for o in ol]


@test('Takvim: kısa süreler (hazırlık günleri toplama bitmeden önceye düşmez; <7 gün toplamada haftalık yok)')
def _():
    bas, bit = date(2026, 11, 2), date(2026, 11, 5)
    govde, liste, son = takvim.uret(bas, bit, bit, 1)
    ol = ayristir(govde)
    assert not any('RRULE' in o for o in ol)
    assert son == date(2026, 12, 5)
    tum = sorted(o['DTSTART'] for o in ol)
    assert tum == ['20261105', '20261128', '20261205'], tum
    assert '20260905' not in tum and not any('90 gün' in o['SUMMARY'] for o in ol), '90 gün öncesi toplama bitmeden önceye düşüyor, atlanmalı'


@test('Takvim: komut satırı eksik ya da çelişkili girdiyi reddeder; saklama süresi için varsayılan yoktur')
def _():
    d = tempfile.mkdtemp()
    yol = os.path.join(d, 'x.ics')

    def argv(**kw):
        v = {'toplama-baslangic': '2026-11-02', 'toplama-bitis': '2026-12-18', 'saklama-ay': '24', 'cikti': yol}
        v.update(kw)
        return [x for k, val in v.items() if val is not None for x in (f'--{k}', val)]

    r, cikti = sus(takvim.main, argv())
    assert r == 0 and os.path.exists(yol) and 'onam metnindeki' in cikti
    os.remove(yol)
    kotu = {
        'saklama-ay yok': argv(**{'saklama-ay': None}),
        'toplama-baslangic yok': argv(**{'toplama-baslangic': None}),
        'bitiş başlangıçtan önce': argv(**{'toplama-bitis': '2026-10-01'}),
        '0 ay': argv(**{'saklama-ay': '0'}),
        '500 ay': argv(**{'saklama-ay': '500'}),
        'saklama toplama bitmeden başlıyor': argv(**{'saklama-baslangic': '2026-12-01'}),
        'geçersiz tarih': argv(**{'toplama-baslangic': '2026-13-40'}),
    }
    for ad, kv in kotu.items():
        r, _ = sus(takvim.main, kv)
        assert r == 2, (ad, r)
        assert not os.path.exists(yol), f'{ad}: hatalı girdide dosya yazılmamalı'
    r, _ = sus(takvim.main, argv(**{'saklama-baslangic': '2027-03-01'}))
    assert r == 0
    ol = ayristir(open(yol, encoding='utf-8', newline='').read())
    assert max(o['DTSTART'] for o in ol) == '20290301'


@test('CI tanımı: geçerli YAML; çağırdığı betikler ve klasörler gerçekten var; Python sürümü ve eylemler sabit')
def _():
    try:
        import yaml
    except ImportError:
        raise AssertionError('pyyaml yok (pip install pyyaml)')
    yol = os.path.join(KOK, '.github', 'workflows', 'test.yml')
    y = yaml.safe_load(open(yol, encoding='utf-8'))
    adimlar = y['jobs']['test']['steps']
    komutlar = [a['run'] for a in adimlar if 'run' in a]
    betikler = re.findall(r'python\s+(?!-)(\S+\.py)', '\n'.join(komutlar))
    assert len(betikler) >= 4, betikler
    for b in betikler:
        assert os.path.exists(os.path.join(KOK, b)), f'CI olmayan betiği çağırıyor: {b}'
    kullan = [a['uses'] for a in adimlar if 'uses' in a]
    assert all('@v' in u for u in kullan), kullan
    assert any(a.get('with', {}).get('python-version') == '3.12' for a in adimlar)
    assert True in y or 'on' in y, 'tetikleyici (on) tanımlı olmalı'


if __name__ == '__main__':
    gecen = sum(1 for _, ok, _, _ in sonuclar if ok)
    for ad, ok, hata, sure in sonuclar:
        print(('GEÇTİ ' if ok else 'KALDI ') + f'({sure:4.1f} sn)  {ad}' + ('' if ok else f'\n         -> {hata}'))
    print(f'\n{gecen}/{len(sonuclar)} test geçti.')
    sys.exit(0 if gecen == len(sonuclar) else 1)
