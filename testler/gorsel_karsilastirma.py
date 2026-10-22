"""Görsel karşılaştırma: ekran görüntülerini referansla piksel piksel karşılaştırır.

Ne işe yarar: Kod temizliği (refaktör) sırasında tasarımın bozulmadığını göstermek için. Aynı ekranların görüntüsü
önce "referans" olarak alınır; her değişiklikten sonra yeniden alınıp referansla karşılaştırılır. Tek piksellik fark bile bulunur.

Kullanım:
  python testler/gorsel_karsilastirma.py --referans        # referansı (yeniden) üretir -> testler/gorsel_referans/
  python testler/gorsel_karsilastirma.py                   # şimdiki görünümü referansla karşılaştırır (fark varsa çıkış kodu 1)
  python testler/gorsel_karsilastirma.py --kararlilik      # aynı kodla iki kez alıp birbiriyle karşılaştırır (ölçümün kararlı olduğunu kanıtlar)
  Seçenekler: --genislik 360 412   --tema acik koyu   --filtre sim_   (ad içinde geçen ekranlar)
Fark görüntüleri testler/gorsel_fark/ klasörüne yazılır (git'e girmez).

Değişken öğeler sabitlenir: saat (Date), zamanlayıcılar (setInterval hiç tetiklenmez: piyasa kendiliğinden akmaz, bekleme
sayacı 10'da durur), Math.random (tohumlu), animasyonlar kapalı. Piyasa yalnızca elle (simStep) ilerletilir.
Ekranlara ulaşma yardımcıları testler/uygulama_testleri.py'den alınır (sayfa, kod_sec, giris, ...)."""
import argparse
import asyncio
import importlib.util
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ESIK = 3            # bu kanal farkına (0-255) kadar olan pikseller gürültü sayılır
GURULTU_PIKSEL = 8  # eşiği aşan en çok bu kadar piksel gürültü sayılır (yuvarlak kenar oynaması)
KLASOR = os.path.dirname(os.path.abspath(__file__))
REFERANS = os.path.join(KLASOR, 'gorsel_referans')
FARK = os.path.join(KLASOR, 'gorsel_fark')
ANLIK = os.path.join(KLASOR, 'gorsel_anlik')

spec = importlib.util.spec_from_file_location('ut', os.path.join(KLASOR, 'uygulama_testleri.py'))
ut = importlib.util.module_from_spec(spec)
sys.modules['ut'] = ut
spec.loader.exec_module(ut)

# Sayfa yüklenmeden önce çalışır: değişen şeyleri sabitler.
SABITLE = """
(function(){
  var SABIT = 1790000000000;                      // 2026-09-21 civarı, sabit bir an
  var RealDate = Date;
  function FakeDate(a,b,c,d,e,f,g){
    if (!(this instanceof FakeDate)) return new RealDate(SABIT).toString();
    if (arguments.length === 0) return new RealDate(SABIT);
    return new RealDate(a,b,c,d,e,f,g);
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = function(){ return SABIT; };
  FakeDate.UTC = RealDate.UTC; FakeDate.parse = RealDate.parse;
  window.Date = FakeDate;
  var s = 123456789;                              // tohumlu Math.random (mulberry32)
  Math.random = function(){ s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  try {                                           // kod listesi crypto ile üretiliyorsa o da tohumlu olsun
    crypto.getRandomValues = function(arr){ for (var i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 4294967296); return arr; };
    if (crypto.randomUUID) crypto.randomUUID = function(){ return 'aaaaaaaa-0000-4000-8000-' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0'); };
  } catch (e) {}
  window.setInterval = function(){ return 0; };   // piyasa, sayaç ve pano yenilemesi kendiliğinden işlemez
})();
"""
# Geçici bildirim (#toast) birkaç sn sonra kendiliğinden kaybolur: görüntüde bazen var bazen yok olmasın diye gizlenir
SABIT_CSS = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}#toast{display:none!important}'


class Cekim:
    """Bir (genişlik, tema) ayarındaki oturumun ekran görüntülerini toplar."""

    def __init__(self, pg, klasor, onek, filtre):
        self.pg, self.klasor, self.onek, self.filtre = pg, klasor, onek, filtre
        self.adlar = []

    async def al(self, ad):
        if self.filtre and not any(f in ad for f in self.filtre):
            return
        await self.pg.evaluate(f"(function(){{var st=document.getElementById('fx')||document.head.appendChild(Object.assign(document.createElement('style'),{{id:'fx'}}));st.textContent={SABIT_CSS!r}}})()")
        await self.pg.mouse.move(0, 0)  # fare son tıklanan düğmenin üstünde kalıp üzerine gelme (hover) biçimi vermesin
        await self.pg.wait_for_timeout(120)
        yol = os.path.join(self.klasor, f'{self.onek}_{ad}.png')
        # Sayfa geç oturabilir (yazı tipi, düzen): iki ardışık çekim aynı olana kadar (en çok 6 deneme) bekle
        onceki = None
        for _ in range(6):
            png = await self.pg.screenshot(full_page=True, animations='disabled')
            if png == onceki:
                break
            onceki = png
            await self.pg.wait_for_timeout(150)
        with open(yol, 'wb') as f:
            f.write(png)
        self.adlar.append(os.path.basename(yol))


async def oturum(b, genislik, koyu, klasor, filtre):
    """Katılımcı akışını (A grubu) baştan sona gezer ve her ekranın görüntüsünü alır."""
    ctx = await b.new_context(viewport={'width': genislik, 'height': 844}, device_scale_factor=1,
                              color_scheme='dark' if koyu else 'light', reduced_motion='reduce', accept_downloads=True)
    await ctx.add_init_script(SABITLE)
    pg = await ctx.new_page()
    pg.hatalar = []
    pg.on('pageerror', lambda e: pg.hatalar.append(str(e)))
    await pg.goto(ut.URL)
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    c = Cekim(pg, klasor, f'{genislik}_{"koyu" if koyu else "acik"}', filtre)
    A = c.al

    await A('01_karsilama_onam')
    kod = await ut.kod_sec(pg, 'A')
    await pg.check('[data-in=consentOk]')
    await A('02_onam_onayli')
    await pg.click('[data-a=consent]')
    await A('03_kod')
    await pg.fill('#ci', kod)
    await pg.click('[data-a=code]')
    await pg.wait_for_function('S.stage==="demo"', timeout=8000)
    await A('04_form')
    await pg.click('[data-a=dm][data-v="adult|0"]')
    await pg.click('[data-a=demoDone]')
    await A('05_on_test_girisi')
    await pg.click('[data-a=testStart]')
    await A('06_on_test_sorusu')
    for j in (0, 2, 2, 1, 0, 1, 1):
        await pg.click(f'[data-a=tans][data-v="{j}"]')
    await A('07_tanitim')
    await pg.click('[data-a=introDone]')
    await pg.evaluate(ut.TURU_ATLA)
    await A('08_alistirma')
    for _ in range(2):
        await pg.click('[data-a=choose][data-v=tut]')
        await A('09_alistirma_sonucu')
        await pg.click('[data-a=next]')
    await A('10_anlama_kontrolu')
    for _ in range(3):
        await pg.click(f'[data-a=quiz][data-v="{await pg.evaluate("compQ(S.comp.i).a")}"]')
        await pg.click('[data-a=quizNext]')
    await pg.click('[data-a=startMain]')
    await A('11_karar_ani')
    await pg.click('[data-a=choose][data-v=tut]')
    await A('12_karar_sonucu')
    await pg.click('[data-a=next]')
    for _ in range(5):
        await pg.click('[data-a=choose][data-v=tut]')
        await pg.click('[data-a=next]')
    await A('13_gerginlik_koprusu')
    await pg.click('[data-a=stress][data-v="2"]')
    await A('14_simulator_oncesi')

    # Simülatör: piyasa kendiliğinden akmaz; belirli bir güne elle ilerletilir (aynı fiyatlar her seferinde)
    await ut.sim_baslat(pg)
    await pg.evaluate(ut.TURU_ATLA)
    await pg.evaluate('while(S.sim.tick<80){simStep()}simLive()')
    sekmeler = await pg.evaluate("Array.from(document.querySelectorAll('[data-a=simTab]')).map(function(e){return e.getAttribute('data-v')})")
    adlar = {0: '15_sim_portfoy', 1: '16_sim_piyasa', 2: '17_sim_analiz'}
    for i, v in enumerate(sekmeler[:3]):
        await pg.evaluate(f"ACT.simTab('{v}')")
        await A(adlar[i])
    await pg.evaluate(f"ACT.simTab('{sekmeler[0]}')")
    await pg.evaluate("ACT.simDetail('TUPRS')")
    await A('18_sim_hisse_detayi')
    await pg.click('[data-a=simOpen][data-v="TUPRS|S"]')
    await pg.click('[data-a=simQty][data-v=max]')
    await A('19_sim_islem_penceresi')
    await pg.click('[data-a=simGo]')
    await pg.click('[data-a=simWhy][data-v="2"]')
    await pg.wait_for_timeout(150)
    await A('20_sim_bekleme_ekrani_A')
    await pg.evaluate("S.simCd.left=0;document.getElementById('cdg').disabled=false")
    await pg.click('[data-a=simCdGo]')
    await pg.evaluate('ACT.simBack()')
    await ut.simulatoru_bitir(pg)
    await ut.blok(pg, lambda t: 'tut')
    await ut.bitis(pg)
    await A('21_bitis')

    # Serbest mod: bitiş ekranından açılır; sabit seçimlerle oynanır
    await pg.evaluate('ACT.freeOpen()')
    await A('22_serbest_menu')
    await pg.click('[data-a=freeStart]')
    await pg.evaluate('while(S.sim.tick<40){simStep()}simLive()')
    await A('23_serbest_oyun')
    await pg.evaluate("ACT.freeQuit()")
    await pg.evaluate('ACT.mCancel();ACT.freeEnd()')
    await A('24_serbest_sonuc')
    await pg.evaluate('ACT.freeBack()')

    await ut.panel_ac(pg)
    await A('25_arastirmaci_paneli')
    hatalar = pg.hatalar
    await ctx.close()
    return c.adlar, hatalar


def karsilastir(yol_a, yol_b, ad):
    """İki PNG'yi karşılaştırır. Döner: (farklı piksel sayısı, boyut farkı mı)."""
    a, b = Image.open(yol_a).convert('RGB'), Image.open(yol_b).convert('RGB')
    if a.size != b.size:
        return None, f'boyut {a.size} ≠ {b.size}'
    fark = ImageChops.difference(a, b)
    kutu = fark.getbbox()
    if kutu is None:
        return 0, ''
    # Chromium aynı sayfayı iki kez çizerken yuvarlak kenarlarda 1-2 düzeylik (0-255) ve birkaç piksellik oynama yapabiliyor
    # (aynı kodla iki çekimde ölçüldü). Gerçek bir tasarım değişikliği (renk, kayma, boyut) yüzlerce pikseli etkiler.
    # Bu yüzden: kanal farkı ≤ ESIK olan pikseller yok sayılır ve en çok GURULTU_PIKSEL pikselin bunu aşmasına izin verilir.
    en_buyuk = np.asarray(fark).max(axis=2)
    n = int((en_buyuk > ESIK).sum())
    toplam = int((en_buyuk > 0).sum())
    if n <= GURULTU_PIKSEL:
        return 0, ''
    os.makedirs(FARK, exist_ok=True)
    fark.point(lambda v: 255 if v > ESIK else 0).save(os.path.join(FARK, ad))
    return n, f'fark alanı {kutu}, en büyük kanal farkı {int(en_buyuk.max())}/255, sıfırdan farklı {toplam} piksel'


async def ana(a):
    genislikler = a.genislik
    temalar = [t == 'koyu' for t in a.tema]
    if a.referans:
        hedef = REFERANS
    elif a.kararlilik:
        hedef = ANLIK + '_1'
    else:
        hedef = ANLIK
    for k in {hedef, FARK}:
        shutil.rmtree(k, ignore_errors=True)
    os.makedirs(hedef, exist_ok=True)

    async def calistir(klasor):
        hepsi, hatalar = [], []
        async with async_playwright() as p:
            kw = {'executable_path': ut.CHROMIUM} if ut.CHROMIUM else {}
            b = await p.chromium.launch(**kw)
            for w in genislikler:
                for koyu in temalar:
                    adlar, h = await oturum(b, w, koyu, klasor, a.filtre)
                    hepsi += adlar
                    hatalar += h
            await b.close()
        return hepsi, hatalar

    adlar, hatalar = await calistir(hedef)
    for h in hatalar:
        print('SAYFA HATASI', h)
    print(f'{len(adlar)} görüntü alındı -> {hedef}')
    if a.referans:
        return 1 if hatalar else 0

    if a.kararlilik:
        ikinci = ANLIK + '_2'
        shutil.rmtree(ikinci, ignore_errors=True)
        os.makedirs(ikinci)
        adlar2, hatalar2 = await calistir(ikinci)
        sol, sag = hedef, ikinci
        baslik = 'KARARLILIK (aynı kod, iki çekim)'
    else:
        sol, sag = REFERANS, hedef
        baslik = 'REFERANS ile karşılaştırma'
    if not os.path.isdir(sol) or not os.listdir(sol):
        print('Referans yok: önce --referans ile üret.')
        return 1
    farkli, eksik = 0, 0
    for ad in sorted(set(os.listdir(sol)) | set(os.listdir(sag))):
        ys, yg = os.path.join(sol, ad), os.path.join(sag, ad)
        if not os.path.exists(ys) or not os.path.exists(yg):
            if a.filtre and not any(f in ad for f in a.filtre):
                continue
            print(f'EKSİK  {ad} ({"referansta yok" if not os.path.exists(ys) else "yeni çekimde yok"})')
            eksik += 1
            continue
        n, not_ = karsilastir(ys, yg, ad)
        if n != 0:
            print(f'FARK   {ad}: {n if n is not None else "?"} piksel; {not_}')
            farkli += 1
    toplam = len(set(os.listdir(sol)) & set(os.listdir(sag)))
    print(f'\n{baslik}: {toplam} görüntü karşılaştırıldı, {farkli} farklı, {eksik} eksik, {len(hatalar)} sayfa hatası.')
    return 0 if (farkli == 0 and eksik == 0 and not hatalar) else 1


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--referans', action='store_true', help='referans görüntüleri üret')
    ap.add_argument('--kararlilik', action='store_true', help='aynı kodla iki kez çek, birbiriyle karşılaştır')
    ap.add_argument('--genislik', type=int, nargs='+', default=[360, 412])
    ap.add_argument('--tema', nargs='+', choices=['acik', 'koyu'], default=['acik', 'koyu'])
    ap.add_argument('--filtre', nargs='+', default=None, help='yalnızca adında bu metinlerden biri geçen ekranlar')
    ap.add_argument('--siki', action='store_true', help='gürültü payını kapat: tek bir piksel farkı bile FARK sayılır')
    arg = ap.parse_args()
    if arg.siki:
        ESIK, GURULTU_PIKSEL = 0, 0
    sys.exit(asyncio.run(ana(arg)))
