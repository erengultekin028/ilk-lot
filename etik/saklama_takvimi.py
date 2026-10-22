"""Veri saklama ve silme hatırlatmaları için takvim dosyası (.ics) üretir. Telefon ya da bilgisayar takvimine aktarılır.

  python etik/saklama_takvimi.py --toplama-baslangic 2026-11-02 --toplama-bitis 2026-12-18 --saklama-ay 24

Saklama süresini bu araç SEÇMEZ ve varsayılanı yoktur: süre; etik kurul, kurumun KVKK birimi ve onam metnindeki
`CFG.consentInfo.retention` ile aynı olmalıdır. Süre, varsayılan olarak veri toplamanın bittiği günden başlar; kurumun tanımı
farklıysa (ör. "araştırma raporunun teslimi") --saklama-baslangic ile o tarihi ver.

Üretilen hatırlatmalar:
  1. Veri toplama süresince her hafta: çekilen katılımcıları kalıcı sil (Firebase'te katılımcı kendi verisini silemez; araştırmacı siler).
  2. Veri toplamanın bittiği gün: kapat, CSV'leri indir ve yedekle.
  3. Saklama süresi bitmeden 90, 30 ve 7 gün önce: hazırlık.
  4. Saklama süresinin bittiği gün: ham veriyi sil.

Bu araç hukuki bir süre hesabı yapmaz; yalnızca verdiğin tarihlerden takvim üretir."""
import argparse
import calendar
import hashlib
import sys
from datetime import date, datetime, timedelta, timezone

URUN = '-//Ilk Lot//Saklama takvimi//TR'


def ay_ekle(d, n):
    """Tarihe n ay ekler; ayın günü hedef ayda yoksa ayın son gününe çeker (31 Ocak + 1 ay = 28/29 Şubat)."""
    ay = d.month - 1 + n
    yil = d.year + ay // 12
    ay = ay % 12 + 1
    return date(yil, ay, min(d.day, calendar.monthrange(yil, ay)[1]))


def kac(metin):
    return metin.replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\r\n', '\\n').replace('\n', '\\n')


def katla(satir):
    """RFC 5545: satırlar 75 sekizliyi geçmez; devam satırı bir boşlukla başlar. UTF-8 karakterleri bölünmez."""
    b = satir.encode('utf-8')
    if len(b) <= 75:
        return [satir]
    cikti, mevcut, sinir = [], b'', 75
    for ch in satir:
        c = ch.encode('utf-8')
        if len(mevcut) + len(c) > sinir:
            cikti.append(mevcut.decode('utf-8'))
            mevcut, sinir = b'', 74
        mevcut += c
    cikti.append(mevcut.decode('utf-8'))
    return [cikti[0]] + [' ' + x for x in cikti[1:]]


def olay(ozet, ayrinti, gun, damga, tekrar_bitis=None):
    uid = hashlib.sha1(f'{ozet}|{gun.isoformat()}|{tekrar_bitis}'.encode('utf-8')).hexdigest()[:24] + '@ilklot'
    s = ['BEGIN:VEVENT', f'UID:{uid}', f'DTSTAMP:{damga}', f'DTSTART;VALUE=DATE:{gun:%Y%m%d}', f'DTEND;VALUE=DATE:{gun + timedelta(days=1):%Y%m%d}']
    if tekrar_bitis:
        s.append(f'RRULE:FREQ=WEEKLY;UNTIL={tekrar_bitis:%Y%m%d}')
    s += [f'SUMMARY:{kac(ozet)}', f'DESCRIPTION:{kac(ayrinti)}', 'BEGIN:VALARM', 'ACTION:DISPLAY', f'DESCRIPTION:{kac(ozet)}', 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT']
    return s


def olaylar(bas, bit, saklama_bas, ay):
    son = ay_ekle(saklama_bas, ay)
    liste = []
    ilk_hafta = bas + timedelta(days=7)
    if ilk_hafta <= bit:
        liste.append(('İlk Lot: çekilen katılımcıları kalıcı sil',
                      'Araştırmacı paneli: Çekilenler kısmından "Kalıcı sil". Firebase\'te katılımcı kendi verisini silemez; çekilme isteği geldiyse gecikmeden sil. '
                      'Silinen kayıtların olay kayıtları da gider; kayıt "çekildi" olarak kalır.', ilk_hafta, bit))
    liste.append(('İlk Lot: veri toplama bitti, kapat ve yedekle',
                  'Panelden "Katılımcı özeti" ve "Tüm olaylar" CSV\'lerini indir, güvenli yere yedekle. Kod-grup gizli listesini (varsa) güvene al. '
                  'Firebase\'te yeni yazmayı kapat (kuralları kısıtla ya da barındırmayı kaldır). Çekilenleri kalıcı sil.', bit, None))
    for gun in (90, 30, 7):
        t = son - timedelta(days=gun)
        if t > bit:
            liste.append((f'İlk Lot: saklama süresi {gun} gün sonra bitiyor',
                          f'Saklama süresi {son.strftime("%d.%m.%Y")} tarihinde bitiyor ({ay} ay). Silinecekleri listele: Firebase projesi/veritabanı, indirilen CSV\'ler, gizli kod-grup listesi, yedekler. '
                          'Süre uzatılacaksa etik kurul ve katılımcılara verilen bilgi (onam metni) ile uyumunu kontrol et.', t, None))
    liste.append(('İlk Lot: SAKLAMA SÜRESİ BİTTİ, ham veriyi sil',
                  'Ham veri (Firebase, CSV\'ler, gizli kod-grup listesi, yedekler, cihazlardaki kopyalar) silinir; yalnızca kimliksiz toplu sonuçlar kalır. '
                  'Silmeyi tarih ve kim yaptığıyla not et.', son, None))
    return liste, son


def uret(bas, bit, saklama_bas, ay, simdi=None):
    damga = (simdi or datetime.now(timezone.utc)).strftime('%Y%m%dT%H%M%SZ')
    liste, son = olaylar(bas, bit, saklama_bas, ay)
    satirlar = ['BEGIN:VCALENDAR', 'VERSION:2.0', f'PRODID:{URUN}', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:İlk Lot veri saklama']
    for ozet, ayr, gun, tb in liste:
        satirlar += olay(ozet, ayr, gun, damga, tb)
    satirlar.append('END:VCALENDAR')
    govde = ''.join(x + '\r\n' for s in satirlar for x in katla(s))
    return govde, liste, son


def tarih(metin):
    try:
        return date.fromisoformat(metin)
    except ValueError:
        raise argparse.ArgumentTypeError(f'tarih YYYY-AA-GG biçiminde olmalı: {metin!r}')


def main(argv=None):
    ap = argparse.ArgumentParser(description='İlk Lot saklama ve silme hatırlatma takvimi')
    ap.add_argument('--toplama-baslangic', type=tarih, required=True)
    ap.add_argument('--toplama-bitis', type=tarih, required=True)
    ap.add_argument('--saklama-ay', type=int, required=True, help='Saklama süresi (ay). Varsayılan YOK: etik kurul ve KVKK birimiyle belirle; onam metnindeki süreyle aynı olmalı')
    ap.add_argument('--saklama-baslangic', type=tarih, help='Saklama süresinin başladığı gün (varsayılan: veri toplamanın bittiği gün)')
    ap.add_argument('--cikti', default='ilklot_saklama_takvimi.ics')
    a = ap.parse_args(argv)
    if a.toplama_bitis < a.toplama_baslangic:
        ap.error('--toplama-bitis, --toplama-baslangic\'tan önce olamaz')
    if not 1 <= a.saklama_ay <= 240:
        ap.error('--saklama-ay 1 ile 240 arasında olmalı')
    sb = a.saklama_baslangic or a.toplama_bitis
    if sb < a.toplama_bitis:
        ap.error('saklama süresi veri toplama bitmeden başlayamaz (--saklama-baslangic >= --toplama-bitis)')
    govde, liste, son = uret(a.toplama_baslangic, a.toplama_bitis, sb, a.saklama_ay)
    with open(a.cikti, 'w', encoding='utf-8', newline='') as f:
        f.write(govde)
    print(f'{len(liste)} hatırlatma yazıldı: {a.cikti}')
    for ozet, _, gun, tb in liste:
        print(f'  {gun.strftime("%d.%m.%Y")}  {ozet}' + (f'  (her hafta, {tb.strftime("%d.%m.%Y")} tarihine kadar)' if tb else ''))
    print(f'Saklama süresi bitişi: {son.strftime("%d.%m.%Y")} ({a.saklama_ay} ay, {sb.strftime("%d.%m.%Y")} tarihinden). '
          'Bu süre onam metnindeki `CFG.consentInfo.retention` ve etik kurul onayıyla AYNI olmalı.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
