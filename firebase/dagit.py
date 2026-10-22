"""İlk Lot yayın aracı: ön kontrol, yayın klasörü hazırlama, ölçüt kilidi ve (isteğe bağlı) Firebase'e yayınlama.

Varsayılan çalışma yalnızca KONTROL eder, hiçbir şeyi değiştirmez ve dışarı bağlanmaz.

  python firebase/dagit.py                          # ön kontrol (geçmezse çıkış kodu 1)
  python firebase/dagit.py --hazirla                # firebase/yayin/ klasörünü üretir (kontrol geçmeli)
  python firebase/dagit.py --pilot                  # pilot yayını ön kontrolü (CFG.pilot true olabilir); --hazirla/--yayinla ile de kullanılır
  python firebase/dagit.py --kilitle                # pilot ya da veri toplama BAŞLARKEN: sürüm ve ölçüt ayarlarını kaydeder
  python firebase/dagit.py --yayinla --proje PROJE  # firebase CLI ile Hosting + güvenlik kuralları (firebase-tools kurulu ve giriş yapılmış olmalı)
  python firebase/dagit.py --yayinla --proje PROJE --kuru   # çalıştıracağı komutu yazar, çalıştırmaz

Ön kontrol şunları arar: derlenmiş ilk-lot.html kaynaktan güncel mi; CFG.firebase dolu mu; onam alanlarında [DOLDUR] ya da örnek
adres kalmış mı; güvenlik kurallarında örnek araştırmacı e-postası kalmış mı. Kilit kaydı (yayin_kaydi.json) varsa ayrıca:
ölçüt ayarları (tohumlar, krizler, bekleme süresi, eşik) kayıttakinden farklı mı; kod değişmiş ama APP_VERSION aynı mı.

SINIR: Firebase'e gerçekten yayınlama bu araçla hiç denenmedi (testler sahte bir `firebase` komutu kullanır). İlk yayında çıktıyı izle."""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime

KLASOR = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(KLASOR, '..'))
HTML = os.path.join(KOK, 'ilk-lot.html')
KURALLAR = os.path.join(KLASOR, 'firestore.rules')
KAYIT = os.path.join(KLASOR, 'yayin_kaydi.json')
YAYIN = os.path.join(KLASOR, 'yayin')
DERLE = os.path.join(KOK, 'kaynak', 'derle.py')

# Pilot ya da veri toplama başladıktan sonra DEĞİŞMEMESİ gereken ayarlar (devir notu, "Değiştirme kuralları" 2)
OLCUT_ANAHTARLARI = ['seed', 'simSeed', 'simCrises', 'cooldownSec', 'lossThreshold', 'stake', 'addAmount', 'cash0', 'posValue',
                     'simTicks', 'simTickMs', 'totalSessions']


def oku(yol):
    with open(yol, encoding='utf-8') as f:
        return f.read()


def cfg_blogu(html):
    i = html.find('var CFG={')
    j = html.find('\n};', i)
    return html[i:j + 3] if i >= 0 and j > i else ''


def olcut_ayarlari(html):
    """CFG'den ölçüt ayarlarını metin olarak çıkarır (JS ifadesi olduğu gibi; boşluk farkları yok sayılır)."""
    blok = cfg_blogu(html)
    sonuc = {}
    for k in OLCUT_ANAHTARLARI:
        if k == 'seed':
            m = re.search(r"CFG\.seed='([^']*)'", html)
        elif k == 'simCrises':
            m = re.search(r'simCrises:(\[.*?\]),\s*\n', blok, re.S)
        else:
            m = re.search(r'\b' + k + r":\s*('[^']*'|[^,\s/]+)", blok)
        sonuc[k] = re.sub(r'\s+', '', m.group(1)) if m else None
    return sonuc


def firebase_ayari(blok):
    m = re.search(r'firebase:\s*(null|\{[^}]*\})', blok)
    if not m:
        return None, 'CFG içinde firebase alanı bulunamadı'
    if m.group(1) == 'null':
        return None, 'CFG.firebase hâlâ null (gerçek veri toplama için KURULUM.md adım 3)'
    eksik = [k for k in ('apiKey', 'authDomain', 'projectId', 'appId') if not re.search(k + r'\s*:\s*["\'][^"\']+["\']', m.group(1))]
    return (m.group(1), None) if not eksik else (None, 'CFG.firebase içinde eksik alan: ' + ', '.join(eksik))


def kurallar_yoneticileri(metin):
    m = re.search(r"request\.auth\.token\.email in \[(.*?)\]", metin, re.S)
    return re.findall(r"['\"]([^'\"]+)['\"]", m.group(1)) if m else []


def derleme_guncel_mi():
    with tempfile.TemporaryDirectory() as d:
        cikti = os.path.join(d, 'x.html')
        r = subprocess.run([sys.executable, DERLE, '--cikti', cikti], capture_output=True, text=True)
        if r.returncode != 0:
            return False, 'derle.py çalışmadı: ' + (r.stdout + r.stderr).strip()[-200:]
        with open(cikti, 'rb') as a, open(HTML, 'rb') as b:
            return a.read() == b.read(), None


def kayit_oku():
    if not os.path.exists(KAYIT):
        return []
    with open(KAYIT, encoding='utf-8') as f:
        return json.load(f).get('kayitlar', [])


def kontrol(html=None, kurallar=None, kayitlar=None, derleme_denetle=True, pilot=False):
    """(sonuçlar, durum) döner. sonuçlar: [(düzey, ad, ayrıntı)]; düzey 'TAMAM' | 'UYARI' | 'HATA'."""
    html = oku(HTML) if html is None else html
    kurallar = oku(KURALLAR) if kurallar is None else kurallar
    kayitlar = kayit_oku() if kayitlar is None else kayitlar
    s = []
    ekle = lambda d, a, b='': s.append((d, a, b))
    blok = cfg_blogu(html)
    surum = (re.search(r"var APP_VERSION='([^']+)'", html) or [None, None])[1]
    onam = (re.search(r"CONSENT_VER='([^']+)'", html) or [None, None])[1]
    ekle('TAMAM', 'Sürüm', f'uygulama {surum}, onam {onam}')

    if derleme_denetle:
        ok, hata = derleme_guncel_mi()
        if hata:
            ekle('HATA', 'Derleme', hata)
        elif ok:
            ekle('TAMAM', 'Derleme güncel', 'ilk-lot.html, kaynak/ parçalarından üretilenle birebir aynı')
        else:
            ekle('HATA', 'Derleme eski', 'ilk-lot.html kaynak/ ile uyuşmuyor: python kaynak/derle.py çalıştır (dosyayı elle düzenlemiş olabilirsin)')

    _, fb_hata = firebase_ayari(blok)
    ekle('HATA' if fb_hata else 'TAMAM', 'Firebase ayarı', fb_hata or 'CFG.firebase dolu')

    mc = re.search(r'consentInfo:\s*\{(.*?)\}', blok, re.S)
    bos = re.findall(r"'(\[DOLDUR[^']*)'", mc.group(1)) if mc else ['consentInfo bulunamadı']
    ekle('HATA' if bos else 'TAMAM', 'Onam alanları', (f'{len(bos)} alan boş: ' + '; '.join(b[:45] for b in bos)) if bos else 'kurum, etik onay, saklama, barındırma, destek dolu')
    m = re.search(r"\bcontact:\s*'([^']*)'", blok)
    kotu_iletisim = (not m) or (not m.group(1)) or 'ornek.edu.tr' in m.group(1)
    ekle('HATA' if kotu_iletisim else 'TAMAM', 'İletişim adresi', 'CFG.contact örnek ya da boş' if kotu_iletisim else m.group(1))

    yon = kurallar_yoneticileri(kurallar)
    if not yon:
        ekle('HATA', 'Güvenlik kuralları', 'isAdmin() içinde e-posta listesi bulunamadı (kural dosyası değişmiş olabilir)')
    elif any('ornek.edu.tr' in y or '@' not in y for y in yon):
        ekle('HATA', 'Güvenlik kuralları', 'araştırmacı e-postası hâlâ örnek: ' + ', '.join(yon) + ' (yayınlarsan panele kimse giremez)')
    else:
        ekle('TAMAM', 'Güvenlik kuralları', 'araştırmacı: ' + ', '.join(yon))

    m = re.search(r'\bpilot:\s*(true|false)', blok)
    pilot_acik = bool(m and m.group(1) == 'true')
    if not m:
        ekle('HATA', 'Pilot form ayarı', 'CFG içinde pilot alanı bulunamadı (CFG biçimi değişmiş; bu aracı güncelle)')
    elif pilot and not pilot_acik:
        ekle('UYARI', 'Pilot form ayarı', '--pilot verildi ama CFG.pilot false: geri bildirim formu çıkmaz')
    elif pilot:
        ekle('TAMAM', 'Pilot yayını', 'CFG.pilot true: bilgilendirme ekranının sonunda 3 soruluk geri bildirim formu çıkar. Bu dosya ANA VERİ TOPLAMADA kullanılmaz')
    elif pilot_acik:
        ekle('HATA', 'Pilot form açık', 'CFG.pilot true: ana veri toplamada geri bildirim formu olmamalı (kaynak/02_core.js içinde pilot:false yap, derle). Pilot yayını yapıyorsan --pilot ile çalıştır')
    else:
        ekle('TAMAM', 'Pilot form kapalı', 'CFG.pilot false')

    if 'if(CFG.firebase)return false' not in html:
        ekle('HATA', 'Hızlı test kilidi', 'CFG.firebase doluyken hızlı test modunu kapatan satır bulunamadı')
    else:
        ekle('TAMAM', 'Hızlı test kilidi', 'CFG.firebase doluyken kapalı')

    olcut = olcut_ayarlari(html)
    bos_olcut = [k for k, v in olcut.items() if v is None]
    if bos_olcut:
        ekle('HATA', 'Ölçüt ayarları', 'okunamadı: ' + ', '.join(bos_olcut) + ' (CFG biçimi değişmiş; bu aracı güncelle)')
    sha = hashlib.sha256(html.encode('utf-8')).hexdigest()
    if not kayitlar:
        ekle('UYARI', 'Ölçüt kilidi', 'henüz kilitlenmedi: pilot ya da veri toplama BAŞLARKEN `--kilitle` çalıştır; sonra ayar değişirse bu araç yakalar')
    else:
        son = kayitlar[-1]
        fark = [f'{k}: kayıtta {son["olcut"].get(k)!r}, şimdi {olcut.get(k)!r}' for k in OLCUT_ANAHTARLARI if son['olcut'].get(k) != olcut.get(k)]
        if fark:
            ekle('HATA', 'Ölçüt ayarları değişmiş', f'{son["zaman"][:10]} kaydından beri: ' + '; '.join(fark) + '. Pilot/veri toplama başladıktan sonra değiştirilmez; yeni çalışma olarak ele al')
        else:
            ekle('TAMAM', 'Ölçüt ayarları', f'{son["zaman"][:10]} kaydıyla aynı')
        if son['html_sha256'] != sha:
            if son['surum'] == surum:
                ekle('HATA', 'Kod değişmiş, sürüm aynı', f'APP_VERSION {surum} kayıtlı sürümle aynı ama dosya farklı: kaynak/02_core.js içinde sürümü artır')
            else:
                ekle('UYARI', 'Yeni sürüm', f'kayıtlı sürüm {son["surum"]}, şimdi {surum}. Ana veri tek sürümden gelmeli (docs/MIMARI.md); yayınlayıp `--kilitle` ile yeni kayıt ekle')
        else:
            ekle('TAMAM', 'Dosya kayıtlı sürümle aynı', surum)
    if surum and onam and kayitlar and kayitlar[-1].get('onam') and kayitlar[-1]['onam'] != onam:
        ekle('UYARI', 'Onam sürümü değişmiş', f'kayıtlı {kayitlar[-1]["onam"]}, şimdi {onam}: kimin hangi sürümü kabul ettiği kaydedilir; analizde ayır')
    durum = 1 if any(d == 'HATA' for d, _, _ in s) else 0
    return s, durum


def yazdir(sonuclar):
    simge = {'TAMAM': 'TAMAM ', 'UYARI': 'UYARI ', 'HATA': 'HATA  '}
    for d, a, b in sonuclar:
        print(f'{simge[d]} {a}' + (f': {b}' if b else ''))


def hazirla():
    os.makedirs(os.path.join(YAYIN, 'public'), exist_ok=True)
    shutil.copyfile(HTML, os.path.join(YAYIN, 'public', 'index.html'))
    shutil.copyfile(KURALLAR, os.path.join(YAYIN, 'firestore.rules'))
    cfg = {
        'hosting': {'public': 'public', 'ignore': ['firebase.json', '**/.*'],
                    # no-cache: pilot ortasında eski sürüm önbellekten gelmesin (ana veri tek sürümden gelmeli)
                    'headers': [{'source': '**', 'headers': [{'key': 'Cache-Control', 'value': 'no-cache'},
                                                             {'key': 'X-Content-Type-Options', 'value': 'nosniff'},
                                                             {'key': 'Referrer-Policy', 'value': 'no-referrer'}]}]},
        'firestore': {'rules': 'firestore.rules'},
    }
    with open(os.path.join(YAYIN, 'firebase.json'), 'w', encoding='utf-8') as f:
        json.dump(cfg, f, indent=2)
        f.write('\n')
    return YAYIN


def kilitle(html):
    kayitlar = kayit_oku()
    kayit = dict(zaman=datetime.now().astimezone().isoformat(timespec='seconds'),
                 surum=re.search(r"var APP_VERSION='([^']+)'", html).group(1),
                 onam=(re.search(r"CONSENT_VER='([^']+)'", html) or [None, None])[1],
                 html_sha256=hashlib.sha256(html.encode('utf-8')).hexdigest(), olcut=olcut_ayarlari(html))
    kayitlar.append(kayit)
    with open(KAYIT, 'w', encoding='utf-8') as f:
        json.dump({'aciklama': 'Pilot/veri toplama başlarken kaydedilen sürüm ve ölçüt ayarları. Elle düzenleme; dagit.py bunlara bakarak değişiklik yakalar.',
                   'kayitlar': kayitlar}, f, ensure_ascii=False, indent=2)
        f.write('\n')
    return kayit


def main(argv=None):
    ap = argparse.ArgumentParser(description='İlk Lot yayın aracı')
    ap.add_argument('--hazirla', action='store_true', help='firebase/yayin/ klasörünü üret (kontrol geçmeli)')
    ap.add_argument('--kilitle', action='store_true', help='sürüm ve ölçüt ayarlarını yayin_kaydi.json\'a ekle (kontrol geçmeli)')
    ap.add_argument('--yayinla', action='store_true', help='firebase deploy çalıştır (kontrol geçmeli; --proje gerekli)')
    ap.add_argument('--proje', help='Firebase proje kimliği')
    ap.add_argument('--pilot', action='store_true', help='PİLOT yayını: CFG.pilot true olmasına izin verir (ana veri toplamada kullanma)')
    ap.add_argument('--kuru', action='store_true', help='--yayinla ile: komutu yaz, çalıştırma')
    a = ap.parse_args(argv)
    if a.yayinla and not a.proje:
        ap.error('--yayinla için --proje gerekli')
    sonuclar, durum = kontrol(pilot=a.pilot)
    yazdir(sonuclar)
    if not (a.hazirla or a.kilitle or a.yayinla):
        print('\nÖn kontrol ' + ('GEÇTİ.' if durum == 0 else 'GEÇMEDİ: HATA satırlarını düzelt.'))
        return durum
    if durum:
        print('\nÖn kontrol geçmedi; hiçbir şey yapılmadı.')
        return 1
    if a.hazirla or a.yayinla:
        print(f'\nHazırlandı: {hazirla()}')
    if a.kilitle:
        k = kilitle(oku(HTML))
        print(f'Kilit kaydı eklendi: sürüm {k["surum"]} ({KAYIT})')
    if a.yayinla:
        komut = ['firebase', 'deploy', '--only', 'hosting,firestore:rules', '--project', a.proje]
        print('Komut (firebase/yayin içinde): ' + ' '.join(komut))
        if a.kuru:
            return 0
        yol = shutil.which('firebase')
        if not yol:
            print('HATA: firebase komutu bulunamadı (npm i -g firebase-tools; firebase login).')
            return 1
        # Windows'ta firebase-tools "firebase.cmd" olarak kurulur; bare ad subprocess ile bulunamaz, bu yüzden tam yol verilir
        return subprocess.run([yol] + komut[1:], cwd=YAYIN).returncode
    return 0


if __name__ == '__main__':
    sys.exit(main())
