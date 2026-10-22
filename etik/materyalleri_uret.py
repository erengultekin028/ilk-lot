"""Etik kurul başvurusu için materyalleri CANLI uygulamadan üretir: onam metni, bilgilendirme metni, katılımcı ekran görüntüleri.
Böylece başvurudaki metinler uygulamadakinden farklı olamaz. Uygulamada (ya da CFG.consentInfo alanlarında) bir şey değişirse yeniden çalıştır.

Kullanım:  python materyalleri_uret.py        (ILKLOT_HTML ve CHROMIUM ortam değişkenleri testler/ ile aynı)
Çıktı:     onam_metni_<sürüm>.txt, bilgilendirme_metni_<sürüm>.txt, ekranlar/*.png
Not: Boş [DOLDUR] alanları metinde ve ekran görüntülerinde olduğu gibi görünür; önce CFG.consentInfo'yu doldur, sonra çalıştır."""
import asyncio
import os
import sys

KLASOR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(KLASOR, '..', 'testler'))
from playwright.async_api import async_playwright  # noqa: E402
import uygulama_testleri as t  # noqa: E402

EKRAN = os.path.join(KLASOR, 'ekranlar')


async def ana():
    os.makedirs(EKRAN, exist_ok=True)
    async with async_playwright() as p:
        kw = {'executable_path': t.CHROMIUM} if t.CHROMIUM else {}
        b = await p.chromium.launch(**kw)
        pg = await t.sayfa(b)
        surum = await pg.evaluate('CONSENT_VER')
        uygulama = await pg.evaluate('APP_VERSION')
        await pg.screenshot(path=os.path.join(EKRAN, '01_onam_ust.png'))
        await pg.click('details[data-cs=kayit] summary')
        await pg.click('details[data-cs=cekil] summary')
        await pg.evaluate("document.querySelector('details[data-cs=kayit]').scrollIntoView()")
        await pg.screenshot(path=os.path.join(EKRAN, '02_onam_ayrintilar.png'))
        metin = await pg.evaluate('consentText()')
        open(os.path.join(KLASOR, f'onam_metni_{surum}.txt'), 'w', encoding='utf-8').write(metin)
        kod = await t.kod_sec(pg, 'A')
        await t.giris(pg, kod)
        await pg.screenshot(path=os.path.join(EKRAN, '03_form.png'))
        await pg.click('[data-a=dm][data-v="adult|0"]')
        await pg.click('[data-a=demoDone]')
        await pg.click('[data-a=testStart]')
        await pg.screenshot(path=os.path.join(EKRAN, '04_on_test.png'))
        for j in (0, 2, 2, 1, 0, 1, 1):
            await pg.click(f'[data-a=tans][data-v="{j}"]')
        await t.alistirma_ve_basla(pg)
        while True:
            tur = await pg.evaluate('JSON.stringify({k:BT()[S.ti].kind,p:BT()[S.ti].pos})')
            if '"kriz"' in tur:
                break
            await pg.click('[data-a=choose][data-v=tut]')
            await pg.click('[data-a=next]')
        await pg.screenshot(path=os.path.join(EKRAN, '05_karar_ani_sert_dusus.png'))
        await pg.click('[data-a=choose][data-v=tut]')
        await pg.click('[data-a=next]')
        while await pg.evaluate("S.stage==='task'"):
            await pg.click('[data-a=choose][data-v=tut]')
            await pg.click('[data-a=next]')
        await t.simulatore_gec(pg, 80)
        await pg.screenshot(path=os.path.join(EKRAN, '06_simulator_kriz.png'))
        await t.sim_sat(pg)
        await pg.screenshot(path=os.path.join(EKRAN, '07_bekleme_ekrani_A_grubu.png'))
        await pg.evaluate("S.simCd.left=0;document.getElementById('cdg').disabled=false")
        await pg.click('[data-a=simCdGo]')
        await pg.evaluate('ACT.simBack()')
        await t.simulatoru_bitir(pg)
        await t.blok(pg, lambda x: 'tut')
        await t.bitis(pg)
        bolumler = await pg.evaluate("[...document.querySelectorAll('#view .sec')].map(function(e){var h=e.querySelector('h3');return h?{t:h.innerText,b:e.querySelector('.sb').innerText}:null}).filter(Boolean)")
        istenen = ('Çalışmanın amacı', 'Bilmen gerekenler', 'Rahatsız hissettiysen', 'Verilerin')
        buyuk = lambda m: m.replace('i', 'İ').replace('ı', 'I').upper()
        parca = [f'{buyuk(x["t"])}\n{x["b"]}' for x in bolumler if x['t'] in istenen]
        gruptan = await pg.evaluate('S.grp')
        open(os.path.join(KLASOR, f'bilgilendirme_metni_{surum}.txt'), 'w', encoding='utf-8').write(
            f'İLK LOT ARAŞTIRMASI\nOturum sonu bilgilendirme metni (onam sürümü {surum}, uygulama {uygulama})\n'
            f'Bu metin A grubundaki bir katılımcının gördüğüdür; B grubunda yalnızca "Sen ... gruptaydın" cümlesi farklıdır.\n\n' + '\n\n'.join(parca) + '\n')
        await pg.evaluate("document.getElementById('toast').classList.remove('show')")
        for ad, baslik in (('08_bilgilendirme_amac.png', 'Çalışmanın amacı'), ('09_bilgilendirme_destek.png', 'Rahatsız hissettiysen')):
            await pg.evaluate("(function(b){var s=[...document.querySelectorAll('#view .sec')].filter(function(e){var h=e.querySelector('h3');return h&&h.innerText===b})[0];if(s)s.scrollIntoView()})(%r)" % baslik)
            await pg.wait_for_timeout(200)
            await pg.screenshot(path=os.path.join(EKRAN, ad))
        await b.close()
    print(f'Üretildi: onam_metni_{surum}.txt, bilgilendirme_metni_{surum}.txt, ekranlar/ ({len(os.listdir(EKRAN))} görüntü); uygulama sürümü {uygulama}, grup {gruptan}')


if __name__ == '__main__':
    asyncio.run(ana())
