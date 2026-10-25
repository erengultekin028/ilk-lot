"""Yayın aracı (firebase/dagit.py), saklama takvimi (etik/saklama_takvimi.py), klasör yapısı ve CI tanımının testleri. Tarayıcı gerekmez.
  python testler/arac_testleri.py
Gerçek Firebase'e DOKUNMAZ: `firebase` komutu, geçici bir sahte betikle değiştirilir (çağrı biçimini sınar, sunucuyu sınamaz)."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
import re
import stat
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
# Gerçek ayar dosyası (sürüm, CONFIG, onam sürümü): testler "doldurulmuş" ve "boş" durumları bu metinden kendileri kurar
GERCEK_HTML = open(os.path.join(KOK, 'public', 'src', 'constants', 'app-config.js'), encoding='utf-8').read()
GERCEK_KURAL = open(os.path.join(KOK, 'firebase', 'firestore.rules'), encoding='utf-8').read()
FB = re.search(r'firebase:\s*\{[^}]*\}', GERCEK_HTML).group(0)
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
    """Gerçek ayar dosyasından, tüm yayın ön koşulları sağlanmış bir kopya."""
    h = re.sub(r"'\[DOLDUR[^']*'", "'dolu'", GERCEK_HTML)
    return h.replace("contact: 'arastirmaci@ornek.edu.tr'", "contact: 'a@uni.edu.tr'", 1)


ORNEK_EPOSTA = 'arastirmaci@ornek.edu.tr'
EPOSTA_LISTESI = re.compile(r"in \['[^']*'\]")


def kural_eposta(eposta):
    """Gerçek kural dosyasındaki araştırmacı e-postasını verilen adresle değiştirir (gerçek adres ne olursa olsun testler aynı kalsın)."""
    return EPOSTA_LISTESI.sub(f"in ['{eposta}']", GERCEK_KURAL, count=1)


def hazir_kural():
    return kural_eposta('ben@uni.edu.tr')


def ozet(metin):
    return hashlib.sha256(metin.encode('utf-8')).hexdigest()


def kontrol(h, k, **kw):
    """Ayar metni ve kural metniyle ön kontrol (dosya ağacı özeti ayrıca verilir: kod değişikliği ayar metninden bağımsız denenir)."""
    return dagit.kontrol(html=h, kurallar=k, kayitlar=kw.pop('kayitlar', []), ozet=kw.pop('ozet', ozet(h)), **kw)


def seviye(s, ad):
    return [d for d, a, _ in s if a == ad]


def hatalar(s):
    return sorted(a for d, a, _ in s if d == 'HATA')


@test('Ön kontrol: gerçek proje doldurulmamış ayarlarda HATA verir (onam, iletişim; kurallardaki e-posta hâlâ örnekse o da); hazır kopya hiç HATA vermez')
def _():
    s, durum = dagit.kontrol(kayitlar=[])
    izinli = {'Firebase ayarı', 'Onam alanları', 'İletişim adresi'} | ({'Güvenlik kuralları'} if ORNEK_EPOSTA in GERCEK_KURAL else set())
    assert durum == 1 and set(hatalar(s)) <= izinli and 'Onam alanları' in hatalar(s), hatalar(s)
    s, durum = kontrol(hazir_html(), hazir_kural())
    assert durum == 0 and not hatalar(s), s
    assert seviye(s, 'Ölçüt kilidi') == ['UYARI']


@test('Ön kontrol: her eksik tek başına yakalanır (5 ayrı bozma)')
def _():
    h, k = hazir_html(), hazir_kural()
    bozuk = {
        'Firebase ayarı': (h.replace(FB, 'firebase: null'), k),
        'Firebase ayarı ': (re.sub(r"appId:\s*'[^']*'", "appId: ''", h), k),
        'Onam alanları': (h.replace("controller: 'dolu'", "controller: '[DOLDUR: x]'"), k),
        'İletişim adresi': (h.replace("contact: 'a@uni.edu.tr'", "contact: 'arastirmaci@ornek.edu.tr'"), k),
        'Güvenlik kuralları': (h, kural_eposta(ORNEK_EPOSTA)),
    }
    for ad, (hh, kk) in bozuk.items():
        s, durum = kontrol(hh, kk)
        assert durum == 1 and hatalar(s) == [ad.strip()], (ad, hatalar(s))


def kayit_yap(html):
    return dict(zaman='2026-11-02T10:00:00+03:00', surum=re.search(r"APP_VERSION = '([^']+)'", html).group(1), onam='v1',
                html_sha256=ozet(html), olcut=dagit.olcut_ayarlari(html))


@test("Dış sunucu yok: uygulama kabuğu ve stiller Google Fonts'a bağlanmaz; yazı tipi ve simge dosyaları yerelde var; tanıtım sayfası yazıyı gömülü taşır")
def _():
    pub = os.path.join(KOK, 'public')
    for ad in ('index.html', 'admin/index.html'):
        h = open(os.path.join(pub, ad), encoding='utf-8').read()
        assert not re.search(r'fonts\.(googleapis|gstatic)\.com', h), f'{ad} dış yazı tipi sunucusuna bağlanıyor'
    stiller = ''.join(open(os.path.join(pub, 'styles', f), encoding='utf-8').read() for f in os.listdir(os.path.join(pub, 'styles')))
    assert not re.search(r'fonts\.(googleapis|gstatic)\.com', stiller)
    yazilar = re.findall(r'url\(\.\./assets/fonts/([^)]+)\)', stiller)
    assert len(yazilar) == 2, yazilar
    for y in yazilar:
        assert os.path.exists(os.path.join(pub, 'assets', 'fonts', y)), y
    assert os.path.exists(os.path.join(pub, 'assets', 'icon-180.png'))
    t = open(os.path.join(KOK, 'tanitim.html'), encoding='utf-8').read()
    assert not re.search(r'fonts\.(googleapis|gstatic)\.com', t) and t.count('@font-face') == 2 and 'data:font/woff;base64,' in t


@test('Yapı: katılımcı uygulaması yönetim kodunu (admin/) içe aktarmaz; yönetim uygulaması ayrı giriş noktasına sahip')
def _():
    kaynak = os.path.join(KOK, 'public', 'src')
    for kok, _dizinler, dosyalar in os.walk(kaynak):
        if os.path.relpath(kok, kaynak).split(os.sep)[0] == 'admin':
            continue
        for d in dosyalar:
            if d.endswith('.js'):
                t = open(os.path.join(kok, d), encoding='utf-8').read()
                assert not re.search(r"from\s+'[^']*/admin/", t), f'{os.path.join(kok, d)} yönetim kodunu içe aktarıyor'
    assert os.path.exists(os.path.join(KOK, 'public', 'admin', 'index.html')) and os.path.exists(os.path.join(kaynak, 'admin', 'admin-main.js'))
    assert 'admin' not in open(os.path.join(KOK, 'public', 'index.html'), encoding='utf-8').read().lower()


@test('Ön kontrol: pilot formu açık kalırsa ana veri toplamada HATA; --pilot ile TAMAM; kapalıyken --pilot UYARI; alan silinirse HATA')
def _():
    h, k = hazir_html(), hazir_kural()
    assert 'pilot: false' in h
    ac = h.replace('pilot: false', 'pilot: true', 1)
    s, durum = kontrol(ac, k)
    assert durum == 1 and hatalar(s) == ['Pilot form açık'], hatalar(s)
    s, durum = kontrol(ac, k, pilot=True)
    assert durum == 0 and seviye(s, 'Pilot yayını') == ['TAMAM'], s
    s, durum = kontrol(h, k, pilot=True)
    assert durum == 0 and seviye(s, 'Pilot form ayarı') == ['UYARI'], s
    s, durum = kontrol(h.replace('pilot: false,', '', 1), k)
    assert hatalar(s) == ['Pilot form ayarı'], hatalar(s)
    # Pilot ile ana yayın aynı sürüm numarasını taşırsa kilit kaydı farkı yakalar (ana veri tek sürümden gelmeli)
    s, durum = kontrol(h, k, kayitlar=[kayit_yap(ac)])
    assert 'Kod değişmiş, sürüm aynı' in hatalar(s), hatalar(s)


@test('Ölçüt kilidi: aynıysa TAMAM; her ölçüt değişikliği HATA; sürümsüz kod değişikliği HATA; yeni sürüm UYARI')
def _():
    h, k = hazir_html(), hazir_kural()
    kayit = kayit_yap(h)
    s, durum = kontrol(h, k, kayitlar=[kayit])
    assert durum == 0 and 'Ölçüt ayarları' in [a for d, a, _ in s if d == 'TAMAM'], s
    degisiklikler = {
        "seed: 'ilklot-gorev-v1'": "seed: 'baska'",
        "simSeed: 'ilklot-sim4-v2669'": "simSeed: 'baska'",
        'cooldownSec: 10': 'cooldownSec: 5',
        'lossThreshold: -0.02': 'lossThreshold: -0.05',
        'drop: 0.2,': 'drop: 0.25,',
        'simTicks: 300': 'simTicks: 150',
        'stake: 10000': 'stake: 20000',
    }
    for eski, yeni in degisiklikler.items():
        assert eski in h, eski
        hh = h.replace(eski, yeni, 1)
        s, durum = kontrol(hh, k, kayitlar=[kayit])
        assert 'Ölçüt ayarları değişmiş' in hatalar(s) and durum == 1, (eski, hatalar(s))
    # ölçüt dışı davranış değişikliği, sürüm aynı
    hh = h + '\n// degisti'
    s, durum = kontrol(hh, k, kayitlar=[kayit])
    assert hatalar(s) == ['Kod değişmiş, sürüm aynı'] and durum == 1, hatalar(s)
    # sürüm artınca yalnızca uyarı
    hh = re.sub(r"APP_VERSION = '[^']+'", "APP_VERSION = '2099.01.01-x'", h)
    assert hh != h
    s, durum = kontrol(hh, k, kayitlar=[kayit])
    assert durum == 0 and seviye(s, 'Yeni sürüm') == ['UYARI'], s
    # boşluk farkı ölçüt değişikliği sayılmaz
    hh = h.replace('cooldownSec: 10,', 'cooldownSec:   10 ,', 1)
    s, _ = kontrol(hh, k, kayitlar=[kayit], ozet=kayit['html_sha256'])
    assert 'Ölçüt ayarları değişmiş' not in hatalar(s)


def bayraklar():
    """dagit'in dosya yollarını geçici klasöre yönlendirir (ayar dosyası ve kural dosyası geçici kopyalardır)."""
    d = tempfile.mkdtemp()
    kopya = {}
    for ad in ('HTML', 'KURALLAR', 'KAYIT'):
        kopya[ad] = getattr(dagit, ad)
    with open(os.path.join(d, 'app-config.js'), 'w', encoding='utf-8', newline='') as f:
        f.write(hazir_html())
    with open(os.path.join(d, 'firestore.rules'), 'w', encoding='utf-8') as f:
        f.write(hazir_kural())
    dagit.HTML, dagit.KURALLAR = os.path.join(d, 'app-config.js'), os.path.join(d, 'firestore.rules')
    dagit.KAYIT = os.path.join(d, 'yayin_kaydi.json')
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


@test('Betik: --kilitle kayıt yazar ve sonraki kontrol onu kullanır; varsayılan çalışma hiçbir şey yazmaz')
def _():
    d, kopya = bayraklar()
    try:
        r, cikti = sus(dagit.main, [])
        assert r == 0 and 'GEÇTİ' in cikti and not os.path.exists(dagit.KAYIT), 'varsayılan çalışma hiçbir şey yazmamalı'
        r, cikti = sus(dagit.main, ['--kilitle'])
        assert r == 0 and os.path.exists(dagit.KAYIT), cikti
        kayitlar = json.load(open(dagit.KAYIT, encoding='utf-8'))['kayitlar']
        assert len(kayitlar) == 1 and kayitlar[0]['surum'] and set(kayitlar[0]['olcut']) == set(dagit.OLCUT_ANAHTARLARI)
        r, cikti = sus(dagit.main, [])
        assert r == 0 and 'Dosya kayıtlı sürümle aynı' in cikti, cikti
    finally:
        geri(kopya)


@test('Betik: kontrol geçmezse --kilitle ve --yayinla hiçbir şey yapmaz')
def _():
    d, kopya = bayraklar()
    try:
        with open(dagit.KURALLAR, 'w', encoding='utf-8') as f:
            f.write(kural_eposta(ORNEK_EPOSTA))  # kural dosyasında örnek e-posta kalırsa ön kontrol geçmemeli
        for arg in (['--kilitle'], ['--yayinla', '--proje', 'x']):
            r, cikti = sus(dagit.main, arg)
            assert r == 1 and 'hiçbir şey yapılmadı' in cikti, (arg, cikti)
        assert not os.path.exists(dagit.KAYIT)
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
        assert os.path.realpath(cwd) == os.path.realpath(dagit.KOK) and args == 'deploy --only hosting,firestore:rules --project ilklot-demo', (cwd, args)
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


@test('CI tanımı: geçerli YAML; çağırdığı betikler ve npm komutları gerçekten var; Python sürümü ve eylemler sabit')
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
    assert len(betikler) >= 3, betikler
    for b in betikler:
        assert os.path.exists(os.path.join(KOK, b)), f'CI olmayan betiği çağırıyor: {b}'
    npm = set(re.findall(r'npm run ([\w:]+)', '\n'.join(komutlar)))
    scripts = json.load(open(os.path.join(KOK, 'package.json'), encoding='utf-8'))['scripts']
    assert npm and npm <= set(scripts), (npm, set(scripts))
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
