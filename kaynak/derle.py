"""Kaynak parçalarını tek dosyaya (ilk-lot.html) birleştirir.

Kullanım:  python derle.py            -> ../ilk-lot.html
           python derle.py --cikti x.html
Parçalar sırayla birleştirilir; sıra önemlidir (ör. 04_study.js içindeki Store, 07_app.js'ten önce tanımlı olmalı).
Node.js kuruluysa birleşik betiğin sözdizimi de kontrol edilir."""
import argparse
import base64
import os
import re
import shutil
import subprocess
import sys
import tempfile

KLASOR = os.path.dirname(os.path.abspath(__file__))
SIRA = ['01_head.html', '02_core.js', '03_qr.js', '04_study.js', '05_entry.js', '06_task.js', '07_app.js']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cikti', default=os.path.join(KLASOR, '..', 'ilk-lot.html'))
    a = ap.parse_args()
    parcalar = []
    for ad in SIRA:
        yol = os.path.join(KLASOR, ad)
        if not os.path.exists(yol):
            sys.exit(f'HATA: {ad} bulunamadı')
        with open(yol, encoding='utf-8') as f:
            parcalar.append(f.read())
    html = ''.join(parcalar)
    # Yazı tipi dosyaya gömülür ({{YAZI:Ad}} -> kaynak/yazi/BricolageGrotesque-Ad.woff, base64): dış sunucuya (Google Fonts) bağlanılmaz
    def yazi(m):
        yol = os.path.join(KLASOR, 'yazi', f'BricolageGrotesque-{m.group(1)}.woff')
        if not os.path.exists(yol):
            sys.exit(f'HATA: yazı tipi dosyası yok: {yol}')
        with open(yol, 'rb') as f:
            return base64.b64encode(f.read()).decode('ascii')
    html = re.sub(r'\{\{YAZI:(\w+)\}\}', yazi, html)
    # Ana ekran simgesi (apple-touch-icon / favicon): kaynak/yazi/ikon180.png, base64
    if '{{IKON}}' in html:
        yol = os.path.join(KLASOR, 'yazi', 'ikon180.png')
        if not os.path.exists(yol):
            sys.exit(f'HATA: simge dosyası yok: {yol}')
        with open(yol, 'rb') as f:
            html = html.replace('{{IKON}}', base64.b64encode(f.read()).decode('ascii'))
    betikler = re.findall(r'<script>(.*?)</script>', html, flags=re.S)
    if len(betikler) != 1:
        sys.exit(f'HATA: tam olarak 1 <script> bloğu bekleniyordu, {len(betikler)} bulundu (parça sırası ya da kapanış etiketi bozuk olabilir)')
    if shutil.which('node'):
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
            t.write(betikler[0])
        r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True)
        os.unlink(t.name)
        if r.returncode != 0:
            sys.exit('HATA: sözdizimi hatası\n' + r.stderr)
        print('Sözdizimi: tamam (node --check)')
    else:
        print('Uyarı: node bulunamadı, sözdizimi kontrolü atlandı.')
    with open(a.cikti, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    surum = re.search(r"var APP_VERSION='([^']+)'", html)
    print(f'Yazıldı: {os.path.abspath(a.cikti)} ({len(html) / 1024:.0f} KB), sürüm {surum.group(1) if surum else "?"}')


if __name__ == '__main__':
    main()
