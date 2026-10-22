"""İlk Lot uygulamasının uçtan uca testleri (Playwright + Chromium).

Kurulum:   pip install playwright && playwright install chromium
Çalıştır:  python uygulama_testleri.py            (hepsi)
           python uygulama_testleri.py lot onam   (adında geçen testler)
Ortam değişkenleri: ILKLOT_HTML (varsayılan ../ilk-lot.html), CHROMIUM (tarayıcı yolu; boşsa Playwright'ınki)

Uygulamayı değiştirdikten sonra çalıştır. Yaklaşık 2-3 dakika sürer. Gerçek Firebase'e DOKUNMAZ: Firebase yolu,
bu dosyadaki sahte bir SDK ile denenir (entegrasyon kodunu sınar; gerçek sunucuyu ve güvenlik kurallarını SINAMAZ)."""
import asyncio
import csv
import io
import json
import os
import re
import sys
import tempfile
import time

from playwright.async_api import async_playwright

KLASOR = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.abspath(os.environ.get('ILKLOT_HTML', os.path.join(KLASOR, '..', 'ilk-lot.html')))
URL = 'file://' + HTML
CHROMIUM = os.environ.get('CHROMIUM')
sys.path.insert(0, os.path.join(KLASOR, '..', 'analiz'))
try:
    from ilklot_ornek_veri import KATILIMCI_KOLONLARI
except Exception:  # noqa: BLE001
    KATILIMCI_KOLONLARI = None

TURU_ATLA = "S.tourSeen={tc:1,tpos:1,tnews:1,tcrowd:1,tch:1,sim:1};S.tour=null;applyTour()"
DEPO_ENGELLE = "Object.defineProperty(window,'localStorage',{get:function(){throw new DOMException('x','SecurityError')},configurable:true})"
SONUC = []


def test(f):
    f.ad = f.__name__
    SONUC.append(f)
    return f


# ───────────────────────── yardımcılar ─────────────────────────
async def sayfa(b, genislik=390, url=URL, depo_engelli=False, yonlendir=None):
    ctx = await b.new_context(viewport={'width': genislik, 'height': 844}, device_scale_factor=2, accept_downloads=True)
    if depo_engelli:
        await ctx.add_init_script(DEPO_ENGELLE)
    pg = await ctx.new_page()
    pg.hatalar = []
    pg.on('pageerror', lambda e: pg.hatalar.append(str(e)))
    if yonlendir:
        await pg.route('**/*firebase*', yonlendir)
    await pg.goto(url)
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    return pg


def temiz(*sayfalar):
    for p in sayfalar:
        assert not p.hatalar, f'sayfa hatası: {p.hatalar[:2]}'


async def kod_sec(pg, grp, sira=0):
    liste = await pg.evaluate("Store.listAlloc().then(function(a){return Object.keys(a).sort(function(x,y){return a[x].no-a[y].no}).map(function(k){return [k,a[k].grp]})})")
    return [k for k, g in liste if g == grp][sira]


async def giris(pg, kod):
    await pg.check('[data-in=consentOk]')
    await pg.click('[data-a=consent]')
    await pg.fill('#ci', kod)
    await pg.click('[data-a=code]')
    await pg.wait_for_function('S.stage==="demo"', timeout=8000)


async def forma_ve_on_test(pg, cevaplar=(0, 2, 2, 1, 0, 1, 1)):  # Big Three, dikkat, ek maddeler (hepsi doğru)
    await pg.click('[data-a=dm][data-v="adult|0"]')
    await pg.click('[data-a=demoDone]')
    await pg.click('[data-a=testStart]')
    for j in cevaplar:
        await pg.click(f'[data-a=tans][data-v="{j}"]')


async def alistirma_ve_basla(pg):
    await pg.click('[data-a=introDone]')
    await pg.evaluate(TURU_ATLA)
    for _ in range(2):
        await pg.click('[data-a=choose][data-v=tut]')
        await pg.click('[data-a=next]')
    for _ in range(3):
        await pg.click(f'[data-a=quiz][data-v="{await pg.evaluate("compQ(S.comp.i).a")}"]')
        await pg.click('[data-a=quizNext]')
    await pg.click('[data-a=startMain]')


async def blok(pg, plan):
    for _ in range(6):
        t = json.loads(await pg.evaluate('JSON.stringify({kind:BT()[S.ti].kind,pos:BT()[S.ti].pos})'))
        await pg.click(f'[data-a=choose][data-v={plan(t)}]')
        assert await pg.evaluate('S.tr.phase') == 'outcome', 'görev bölümünde bekleme ekranı çıkmamalı'
        await pg.click('[data-a=next]')


async def sim_baslat(pg):
    """Okuma ekranından gerçek simülatöre: alıştırma ekranı atlanır (alıştırmanın kendisi `alistirma_simulatoru` testinde)."""
    await pg.click('[data-a=pracStart]')
    await pg.evaluate(TURU_ATLA)
    await pg.click('[data-a=pracSkip]')
    await pg.click('[data-a=simStart]')


async def simulatore_gec(pg, gun=80):
    await pg.click('[data-a=stress][data-v="2"]')
    await sim_baslat(pg)
    await pg.evaluate(TURU_ATLA)
    await pg.evaluate(f'while(S.sim.tick<{gun}){{simStep()}}simLive()')


async def sim_sat(pg, hisse='TUPRS', cevap=2):
    await pg.evaluate(f"ACT.simDetail('{hisse}')")
    await pg.click(f'[data-a=simOpen][data-v="{hisse}|S"]')
    await pg.click('[data-a=simQty][data-v=max]')
    await pg.click('[data-a=simGo]')
    await pg.click(f'[data-a=simWhy][data-v="{cevap}"]')
    await pg.wait_for_timeout(120)
    return await pg.query_selector('#cdn') is not None


async def simulatoru_bitir(pg):
    await pg.evaluate('while(S.sim.tick<CFG.simTicks){simStep()}simEnd()')
    await pg.click('[data-a=stress][data-v="3"]')
    await pg.click('[data-a=postStart]')


async def bitis(pg, son_test=(0, 1)):
    await pg.click('[data-a=stress][data-v="2"]')
    await pg.click('[data-a=testStart]')
    for j in son_test:
        await pg.click(f'[data-a=tans][data-v="{j}"]')
    await pg.click('[data-a=manip][data-v=Evet]')
    await pg.click('[data-a=guessSkip]')


async def panel_ac(pg):
    for _ in range(5):
        await pg.click('[data-a=logo]')
    await pg.wait_for_function('S.stage==="admin"')


async def katilimci_csv(pg):
    await panel_ac(pg)
    async with pg.expect_download() as d:
        await pg.click('[data-a=adExpP]')
    yol = await (await d.value).path()
    return list(csv.DictReader(io.StringIO(open(yol, encoding='utf-8-sig').read())))


async def yuzde_ilerleme(pg):
    return await pg.evaluate("(function(){var e=document.getElementById('gp');return e.hidden?null:+e.getAttribute('aria-valuenow')})()")


async def tam_oturum(b, grp, kriz_sat=True, sim_sat_dene=True):
    pg = await sayfa(b)
    kod = await kod_sec(pg, grp)
    ilerleme = []
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    ilerleme.append(await yuzde_ilerleme(pg))
    await alistirma_ve_basla(pg)
    plan_pre = (lambda t: 'sat' if kriz_sat and t['kind'] == 'kriz' and t['pos'] == 'zarar' else 'tut')
    await blok(pg, plan_pre)
    ilerleme.append(await yuzde_ilerleme(pg))
    await simulatore_gec(pg)
    ilerleme.append(await yuzde_ilerleme(pg))
    cd = await sim_sat(pg) if sim_sat_dene else False
    if cd:
        await pg.evaluate("S.simCd.left=0;document.getElementById('cdg').disabled=false")
        await pg.click('[data-a=simCdGo]')
    await pg.evaluate('ACT.simBack()')
    await simulatoru_bitir(pg)
    ilerleme.append(await yuzde_ilerleme(pg))
    await blok(pg, lambda t: 'tut')
    await bitis(pg)
    ilerleme.append(await yuzde_ilerleme(pg))
    satirlar = await katilimci_csv(pg)
    return pg, kod, cd, satirlar[0], ilerleme


# ───────────────────────── testler ─────────────────────────
@test
async def akis_A_ve_B(b):
    sonuc = {}
    for grp in ('A', 'B'):
        pg, kod, cd, satir, ilerleme = await tam_oturum(b, grp)
        sonuc[grp] = (cd, satir)
        assert satir['grp'] == grp and satir['decisions'] == '12' and satir['completed'] == '1'
        assert satir['pre_test'] == '100' and satir['post_test'] == '100' and satir['attention_pass'] == '1', (satir['pre_test'], satir['post_test'])
        assert satir['panic_rate_pre'] == '1' and satir['panic_rate_post'] == '0'
        v = [x for x in ilerleme if x is not None]
        assert v == sorted(v) and v[-1] <= 100 and v[0] >= 0, f'ilerleme çubuğu geri gidiyor: {ilerleme}'
        if KATILIMCI_KOLONLARI:
            assert list(satir.keys()) == KATILIMCI_KOLONLARI, 'uygulamanın CSV başlığı analiz betiğinin beklediğiyle aynı olmalı'
        temiz(pg)
    assert sonuc['A'][0] is True and int(sonuc['A'][1]['cooldown_shown']) >= 1, 'A grubunda simülatörde bekleme ekranı çıkmalı'
    assert sonuc['B'][0] is False and sonuc['B'][1]['cooldown_shown'] == '0', 'B grubunda bekleme ekranı çıkmamalı'


@test
async def bekleme_suresi_kaydi(b):
    """b21: bekleme ekranından geçen süre hem vazgeçmede hem onaylamada kaydedilir (cooldown_cancel/proceed → waitedMs)."""
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    await blok(pg, lambda t: 'tut')
    await simulatore_gec(pg)
    assert await sim_sat(pg) is True, 'A grubunda bekleme ekranı çıkmalı'
    await pg.wait_for_timeout(1300)
    await pg.click('[data-a=simCdBack]')
    await pg.click('[data-a=simGo]')
    await pg.click('[data-a=simWhy][data-v="2"]')
    await pg.wait_for_timeout(1600)
    await pg.evaluate("S.simCd.left=0;document.getElementById('cdg').disabled=false")
    await pg.click('[data-a=simCdGo]')
    await pg.evaluate('flush()')
    await pg.wait_for_timeout(300)
    ev = await pg.evaluate(f"Store.listEvents('{kod}')")
    iptal = [o for o in ev if o['type'] == 'cooldown_cancel']
    onay = [o for o in ev if o['type'] == 'cooldown_proceed']
    assert len(iptal) == 1 and len(onay) == 1, (iptal, onay)
    assert 1300 <= iptal[0]['data']['waitedMs'] < 6000, iptal
    assert 1600 <= onay[0]['data']['waitedMs'] < 6000, onay  # düğme elle açıldığı için 10 sn dolmadı; süre gerçek geçen zamandır
    assert isinstance(onay[0]['data']['waitedMs'], int) and onay[0]['data']['k'] == iptal[0]['data']['k']
    temiz(pg)


@test
async def devam_etme(b):
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    for _ in range(3):
        await pg.click('[data-a=choose][data-v=tut]')
        await pg.click('[data-a=next]')
    await pg.evaluate('saveSnap()')
    await pg.reload()
    await pg.wait_for_function('S.stage==="welcome"')
    await pg.click('[data-a=welcomeGo]')
    await pg.wait_for_function('S.stage==="task"')
    assert await pg.evaluate('S.ti') == 3 and await pg.evaluate('S.block') == 'pre' and len(await pg.evaluate('S.dec')) == 3
    for _ in range(3):
        await pg.click('[data-a=choose][data-v=tut]')
        await pg.click('[data-a=next]')
    await simulatore_gec(pg, 90)
    await pg.evaluate("ACT.simDetail('TUPRS')")
    await pg.click('[data-a=simOpen][data-v="TUPRS|B"]')
    await pg.fill('#simq', '10')
    await pg.click('[data-a=simGo]')
    await pg.wait_for_timeout(150)
    once = await pg.evaluate("JSON.stringify({t:S.sim.tick,c:Math.round(S.sim.cash),v:Math.round(simValue()),n:S.sim.trades.length})")
    await pg.evaluate('saveSnap()')
    await pg.reload()
    await pg.wait_for_function('S.stage==="welcome"')
    await pg.click('[data-a=welcomeGo]')
    await pg.wait_for_function('S.stage==="sim"')
    sonra = await pg.evaluate("JSON.stringify({t:S.sim.tick,c:Math.round(S.sim.cash),v:Math.round(simValue()),n:S.sim.trades.length})")
    o, s = json.loads(once), json.loads(sonra)
    assert o['n'] == s['n'] == 1 and o['t'] <= s['t'] <= o['t'] + 2, (o, s)
    assert abs(o['c'] - s['c']) <= 1, 'nakit devam sonrası değişmemeli'
    temiz(pg)


@test
async def olay_numarasi_surekliligi(b):
    """Sert kapanma (işletim sistemi sekmeyi öldürür): son anlık görüntüden sonra yazılan olayların numaraları yeniden kullanılmamalı."""
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    for _ in range(2):
        await pg.click('[data-a=choose][data-v=tut]')
        await pg.click('[data-a=next]')
    await pg.evaluate('saveSnap()')
    await pg.evaluate("for(var i=0;i<5;i++)log('kapanma_testi',{i:i});flush()")
    await pg.wait_for_timeout(400)
    onceki = await pg.evaluate(f"Store.listEvents('{kod}')")
    n_son = max(o['n'] for o in onceki)
    await pg.evaluate("window.saveSnap=function(){return Promise.resolve()}")
    await pg.reload()
    await pg.wait_for_function('S.stage==="welcome"')
    await pg.click('[data-a=welcomeGo]')
    await pg.wait_for_function('S.stage==="task"')
    await pg.evaluate("log('yeniden_acilis',{});flush()")
    await pg.wait_for_timeout(400)
    olaylar = await pg.evaluate(f"Store.listEvents('{kod}')")
    anahtar = [(o['session'], o['n']) for o in olaylar]
    assert len(anahtar) == len(set(anahtar)), f'aynı olay numarası iki kez kullanılmış: {sorted(set(a for a in anahtar if anahtar.count(a) > 1))}'
    yeni = [o for o in olaylar if o['type'] == 'yeniden_acilis'][0]
    assert yeni['n'] > n_son, f'yeni olay numarası ({yeni["n"]}) önceki en büyükten ({n_son}) büyük olmalı'
    temiz(pg)


@test
async def cekilme_ve_18_alti(b):
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'B')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await pg.click('[data-a=menu]')
    await pg.click('[data-a=withdraw]')
    await pg.click('[data-a=mOk]')
    await pg.wait_for_function('S.stage==="withdrawn"')
    p = await pg.evaluate(f"Store.getP('{kod}')")
    assert p['withdrawn'] is True and 'demo' not in p and 'pre' not in p, 'çekilen katılımcının verisi silinmeli'
    assert await pg.evaluate(f"localStorage.getItem('ilklot:evn:{kod}')") is None, 'çekilen katılımcının olay sayacı da silinmeli'
    await pg.reload()
    await pg.wait_for_function('S.stage==="consent"')
    await pg.check('[data-in=consentOk]')
    await pg.click('[data-a=consent]')
    await pg.fill('#ci', kod)
    await pg.click('[data-a=code]')
    await pg.wait_for_function('!!document.querySelector(".err")')
    assert 'çekil' in await pg.inner_text('.err')
    pg2 = await sayfa(b)
    k2 = await kod_sec(pg2, 'A')
    await giris(pg2, k2)
    await pg2.click('[data-a=dm][data-v="adult|1"]')
    await pg2.click('[data-a=demoDone]')
    await pg2.wait_for_function('S.stage==="inelig"')
    p2 = await pg2.evaluate(f"Store.getP('{k2}')")
    assert p2['withdrawn'] is True and p2.get('ineligible') is True and 'demo' not in p2
    temiz(pg, pg2)


@test
async def depo_engelli(b):
    pg = await sayfa(b, depo_engelli=True)
    assert await pg.evaluate('Store.memMode()') is True
    await pg.check('[data-in=consentOk]')
    await pg.click('[data-a=consent]')
    await pg.click('[data-a=demoCode] >> nth=0')
    await pg.wait_for_function('S.stage==="demo"')
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    await blok(pg, lambda t: 'tut')
    assert await pg.evaluate('S.stage') == 'stress'
    temiz(pg)


@test
async def lot_girisi(b):
    async def hazirla(grp):
        pg = await sayfa(b)
        await pg.evaluate(f"S.code='X';S.grp='{grp}';S.stage='sim';S.phase='sim';simInit();S.simTab='p';S.tourSeen={{sim:1}};S.tour=null;while(S.sim.tick<78){{simStep()}};render()")
        return pg
    pg = await hazirla('A')
    await pg.evaluate("ACT.simDetail('KOZAL')")
    await pg.click('[data-a=simOpen][data-v="KOZAL|S"]')
    assert await pg.input_value('#simq') == '' and await pg.evaluate("document.getElementById('tgo').disabled"), 'kutu boş ve onay pasif başlamalı (hazır miktar çıpa olur)'
    elde = await pg.evaluate('S.sim.pos.KOZAL.q')
    await pg.fill('#simq', '37')
    assert '37 lot sat' in await pg.inner_text('#tgo')
    await pg.fill('#simq', str(elde + 5))
    assert await pg.evaluate("document.getElementById('tgo').disabled") and 'en fazla' in await pg.inner_text('#tsum')
    await pg.fill('#simq', '')
    await pg.type('#simq', 'a1b2c')
    assert await pg.input_value('#simq') == '12'
    for v, beklenen in (('p25', elde // 4), ('p50', elde // 2), ('p75', int(elde * 0.75)), ('max', elde)):
        await pg.click(f'[data-a=simQty][data-v={v}]')
        assert int(await pg.input_value('#simq')) == beklenen, (v, await pg.input_value('#simq'), beklenen)
    await pg.fill('#simq', '0')
    await pg.click('[data-a=simQty][data-v="-1"]')
    assert await pg.input_value('#simq') in ('', '0')
    await pg.click('[data-a=simSide][data-v=B]')
    assert await pg.input_value('#simq') == '' and 'alacaksın' in await pg.inner_text('.qlab')
    nakit, fiyat = await pg.evaluate('S.sim.cash'), await pg.evaluate('S.sim.p.KOZAL')
    await pg.fill('#simq', str(int(nakit // fiyat) + 3))
    assert await pg.evaluate("document.getElementById('tgo').disabled")
    await pg.click('[data-a=simSide][data-v=S]')
    await pg.fill('#simq', '37')
    await pg.click('[data-a=simGo]')
    await pg.click('[data-a=simWhy][data-v="2"]')
    assert await pg.query_selector('#cdn'), 'A grubunda zarardaki satışta bekleme ekranı çıkmalı'
    await pg.click('[data-a=simCdBack]')
    assert await pg.input_value('#simq') == '37', 'bekleme ekranından vazgeçince miktar korunmalı'
    await pg.click('[data-a=simGo]')
    await pg.click('[data-a=simWhy][data-v="2"]')
    await pg.evaluate("S.simCd.left=0;document.getElementById('cdg').disabled=false")
    await pg.click('[data-a=simCdGo]')
    await pg.wait_for_timeout(150)
    assert await pg.evaluate('S.sim.pos.KOZAL.q') == elde - 37
    t = await pg.evaluate('S.sim.trades[S.sim.trades.length-1]')
    assert t['q'] == 37 and t['qMode'] == 'typed' and t['afterCooldown'] is True and t['why'] == 'Korktum'
    c0, q0, p0 = await pg.evaluate('S.sim.cash'), await pg.evaluate('S.sim.pos.KOZAL.q'), await pg.evaluate('S.sim.p.KOZAL')
    await pg.click('[data-a=simOpen][data-v="KOZAL|B"]')
    await pg.fill('#simq', '12')
    await pg.click('[data-a=simGo]')
    await pg.wait_for_timeout(120)
    assert await pg.evaluate('S.sim.pos.KOZAL.q') == q0 + 12 and abs((c0 - await pg.evaluate('S.sim.cash')) - 12 * p0) < 0.01
    pb = await hazirla('B')
    await pb.evaluate("ACT.simDetail('TUPRS')")
    await pb.click('[data-a=simOpen][data-v="TUPRS|S"]')
    await pb.fill('#simq', '100')
    await pb.click('[data-a=simGo]')
    await pb.click('[data-a=simWhy][data-v="1"]')
    await pb.wait_for_timeout(120)
    assert await pb.query_selector('#cdn') is None and await pb.evaluate('S.sim.pos.TUPRS.q') == 135, 'B grubunda bekleme çıkmamalı'
    temiz(pg, pb)


@test
async def onam_ve_metin(b):
    pg = await sayfa(b)
    assert await pg.evaluate("document.getElementById('cbtn').disabled"), 'onay kutusu işaretlenmeden düğme pasif olmalı'
    await pg.click('details[data-cs=gizlilik] summary')
    await pg.check('[data-in=consentOk]')
    assert not await pg.evaluate("document.getElementById('cbtn').disabled")
    assert await pg.evaluate("document.querySelectorAll('details[open]').length") == 1, 'onay kutusu açılan ayrıntıları kapatmamalı'
    async with pg.expect_download() as d:
        await pg.click('[data-a=consentDl]')
    metin = open(await (await d.value).path(), encoding='utf-8-sig').read()
    kucuk = metin.lower()
    for yasak in ('bekleme', 'hipotez', '10 saniye', 'panik satış'):
        assert yasak not in kucuk, f'onam metni müdahaleyi/hipotezi ele vermemeli: "{yasak}"'
    for baslik in ('ARAŞTIRMANIN AMACI', 'NE YAPACAKSIN?', 'NELER KAYDEDİLİR?', 'GİZLİLİK VE KVKK', 'ÇEKİLME HAKKIN', 'İLETİŞİM VE ETİK ONAY'):
        assert baslik in metin, f'başlık yok: {baslik}'
    await panel_ac(pg)
    panel = await pg.inner_text('#view')
    assert 'Doldurulmamış alan var' in panel and 'support' in panel, 'panel destek alanının boş olduğunu da bildirmeli'
    temiz(pg)


@test
async def hizli_mod_kilidi(b):
    pn = await sayfa(b)
    assert await pn.evaluate('QUICK') is False
    ph = await sayfa(b, url=URL + '?hizli=1')
    assert await ph.evaluate('QUICK') is True and await ph.evaluate('CFG.simTickMs') == 150 and await ph.evaluate('CFG.cooldownSec') == 3
    assert not await ph.evaluate("document.getElementById('qb').hidden"), 'hızlı modda uyarı şeridi görünmeli'
    html = open(HTML, encoding='utf-8').read()
    assert html.count('firebase:null') == 1
    gecici = os.path.join(tempfile.mkdtemp(), 'fb.html')
    open(gecici, 'w', encoding='utf-8').write(html.replace('firebase:null', "firebase:{apiKey:'x',projectId:'x'}"))

    async def reddet(route):
        await route.abort()
    pf = await sayfa(b, url='file://' + gecici + '?hizli=1', yonlendir=reddet)
    assert await pf.evaluate('QUICK') is False, 'Firebase ayarlıyken hızlı mod AÇILMAMALI'
    po = await sayfa(b)
    await po.evaluate("localStorage.setItem('ilklot:quick',String(Date.now()-2*3600*1000))")
    await po.reload()
    await po.wait_for_function('S.stage!=="boot"')
    assert await po.evaluate('QUICK') is False, '2 saatlik bayrak geçersiz olmalı'
    await po.evaluate("localStorage.setItem('ilklot:quick',String(Date.now()-5*60*1000))")
    await po.reload()
    await po.wait_for_function('S.stage!=="boot"')
    assert await po.evaluate('QUICK') is True
    temiz(pn, ph, po)


@test
async def uyaran_determinizmi(b):
    p1, p2 = await sayfa(b), await sayfa(b)
    assert await p1.evaluate('fingerprint()') == await p2.evaluate('fingerprint()'), 'iki cihazda uyaranlar aynı olmalı'
    d = json.loads(await p1.evaluate("JSON.stringify({X:TRS.X,Y:TRS.Y})"))
    toplam = {}
    for ad in ('X', 'Y'):
        t = d[ad]
        assert len(t) == 6 and sum(1 for x in t if x['kind'] == 'kriz' and x['pos'] == 'zarar') == 4, ad
        kz = [x for x in t if x['kind'] == 'kriz' and x['pos'] == 'zarar']
        assert sum(1 for x in kz if x['crowd'] is not None) == 2 and sum(1 for x in kz if x['out'] > 0) == 2
        assert t[0]['kind'] == 'normal', 'ilk deneme sert düşüş olmamalı (alışma)'
        for x in t:
            toplam[(x['kind'], x['pos'])] = toplam.get((x['kind'], x['pos']), 0) + x['out']
    assert all(abs(v) < 1e-9 for v in toplam.values()), f'her hücrede beklenen sonuç sıfır olmalı: {toplam}'
    temiz(p1, p2)


@test
async def on_test_puani(b):
    """Ön test 6 madde (Big Three + 3 ek) üzerinden; pre_test_b3 yalnızca ilk üçten; yeniden açılışta korunur; CSV'de iki sütun."""
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await pg.click('[data-a=dm][data-v="adult|0"]')
    await pg.click('[data-a=demoDone]')
    assert '7 kısa soru' in await pg.inner_text('#view'), 'ön test girişi soru sayısını (dikkat sorusu dahil 7) göstermeli'
    await pg.click('[data-a=testStart]')
    # Big Three doğru, dikkat doğru, ek 3 maddeden yalnızca biri doğru
    for j in (0, 2, 2, 1, 0, 0, 0):
        await pg.click(f'[data-a=tans][data-v="{j}"]')
    assert await pg.evaluate('S.pre') == round(4 / 6 * 100) and await pg.evaluate('S.preB3') == 100, (await pg.evaluate('[S.pre,S.preB3]'))
    await pg.reload()
    await pg.wait_for_function('S.stage!=="boot"')
    await pg.click('[data-a=welcomeGo]')
    assert await pg.evaluate('S.preB3') == 100 and await pg.evaluate('S.pre') == 67, 'yeniden açılışta iki puan da korunmalı'
    await pg.evaluate("S.stage='end';S.post=0;render()")
    sat = (await katilimci_csv(pg))[0]
    assert sat['pre_test'] == '67' and sat['pre_test_b3'] == '100', (sat['pre_test'], sat['pre_test_b3'])
    # Big Three'den biri yanlış, ekler doğru: b3 = 67, genel = 83
    temiz(pg)
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'B')
    await giris(pg, kod)
    await pg.click('[data-a=dm][data-v="adult|0"]')
    await pg.click('[data-a=demoDone]')
    await pg.click('[data-a=testStart]')
    for j in (1, 2, 2, 1, 0, 1, 1):
        await pg.click(f'[data-a=tans][data-v="{j}"]')
    assert await pg.evaluate('[S.pre,S.preB3]') == [83, 67], await pg.evaluate('[S.pre,S.preB3]')
    temiz(pg)


@test
async def olcek_ve_dk(b):
    tq = await (await sayfa(b)).evaluate('JSON.stringify(TQ)')
    tq = json.loads(tq)
    assert len(tq) == 8 and all(q[1][-1] == 'Bilmiyorum' for q in tq)
    assert [q[1][q[2]] for q in tq] == ["102 ₺'den fazla", 'Bugünkünden daha azını', 'Yanlış', 'Doğru', 'Düşer', 'Daha yüksek', 'Şirketin küçük bir ortağı olmak', '121 ₺']
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await pg.click('[data-a=dm][data-v="adult|0"]')
    await pg.click('[data-a=demoDone]')
    await pg.click('[data-a=testStart]')
    for j in (3, 3, 0, 2, 3, 3, 3):
        await pg.click(f'[data-a=tans][data-v="{j}"]')
    assert await pg.evaluate('S.pre') == 0 and await pg.evaluate('S.attPass') is False, 'hepsi "Bilmiyorum" ve dikkat testi yanlış: ön test 0, dikkat başarısız'
    await pg.wait_for_timeout(400)
    olaylar = await pg.evaluate(f"Store.listEvents('{kod}')")
    dk = [o for o in olaylar if o['type'] == 'test_answer']
    assert len(dk) == 6 and all(o['data']['dk'] is True and o['data']['correct'] is False for o in dk)
    await pg.evaluate("S.tq={kind:'post',i:0,sc:0};S.stage='end';render()")
    await pg.click('[data-a=tans][data-v="0"]')
    await pg.click('[data-a=tans][data-v="4"]')
    assert await pg.evaluate('S.post') == 50, 'son test 2 soru: biri doğru, biri "Bilmiyorum" → 50'
    temiz(pg)


@test
async def serbest_mod_menu_ve_baslangic(b):
    """b23: serbest mod menüsü: kayıp sınırı, senaryo ve başlangıç portföyü seçenekleri; geçersiz değerler yok sayılır;
    seçimler oyuna yansır (sınır, portföy); varsayılan senaryo b22 ile aynı olay takvimini üretir; 320 px'te taşma yok."""
    ctx = await b.new_context(viewport={'width': 320, 'height': 640})
    pg = await ctx.new_page()
    pg.hatalar = []
    pg.on('pageerror', lambda e: pg.hatalar.append(str(e)))
    await pg.goto(URL)
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    await pg.evaluate("S.stage='end';S.code=S.code||'TEST';ACT.freeOpen()")
    n = lambda a: pg.evaluate(f"document.querySelectorAll('[data-a={a}]').length")  # noqa: E731
    assert [await n('freeLim'), await n('freeSc'), await n('freePf')] == [5, 4, 3]
    assert await pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), 'menü 320 px taşıyor'
    # geçersiz değerler yok sayılır
    await pg.evaluate("ACT.freeLim('0.77');ACT.freeSc('x');ACT.freePf('x');ACT.freeLim('abc')")
    assert await pg.evaluate("[S.free.lim==null,S.free.sc==null,S.free.pf==null]") == [True, True, True]
    # tıklayınca seçilir ve işaretlenir
    await pg.click('[data-a=freeLim][data-v="0.5"]')
    await pg.click('[data-a=freeSc][data-v=y]')
    await pg.click('[data-a=freePf][data-v=h]')
    assert await pg.evaluate("[S.free.lim,S.free.sc,S.free.pf]") == [0.5, 'y', 'h']
    on = await pg.evaluate("[].map.call(document.querySelectorAll('[role=radio][aria-checked=true]'),function(e){return e.dataset.v})")
    assert sorted(on) == sorted(['o', '0.5', 'y', 'h']), on
    assert await pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), 'menü 320 px taşıyor (seçimlerle)'
    # 'Zorluğa göre' sınırı: kayıt yok ya da d
    await pg.click('[data-a=freeLim][data-v=d]')
    assert await pg.evaluate("S.free.lim") is None and await pg.evaluate("freeLim(S.free)") == 0.2
    # özel kayıp sınırı oyuna yansır: %50 → ₺50.000
    await pg.click('[data-a=freeLim][data-v="0.5"]')
    await pg.click('[data-a=freeStart]')
    await pg.wait_for_timeout(200)
    assert await pg.evaluate("freeLimitF(S.free,S.sim.v0)") == 50000
    assert 'Kayıp sınırı · %50' in await pg.inner_text('#sfree')
    # 'hisse ağırlıklı' portföy: toplam değişmez, nakit ≈ %10
    pf = await pg.evaluate("[simValue(),S.sim.v0,S.sim.cash,SIMBASE.every(function(b){return S.sim.pos[b[0]].q>0})]")
    assert abs(pf[0] - pf[1]) < 1 and 9000 < pf[2] < 11000 and pf[3] is True, pf
    # sınırın hemen üstü / altı
    await pg.evaluate("var f=(52000-S.sim.cash)/(simValue()-S.sim.cash);SIMBASE.forEach(function(b){S.sim.p[b[0]]*=f})")
    await pg.wait_for_timeout(1800)
    assert await pg.evaluate('S.stage') == 'sim', 'özel sınırın (%50) üstünde oyun bitmemeli'
    await pg.evaluate("var f=(48000-S.sim.cash)/(simValue()-S.sim.cash);SIMBASE.forEach(function(b){S.sim.p[b[0]]*=f})")
    await pg.wait_for_function("S.stage==='freeend'", timeout=6000)
    assert 'kayıp sınırı %50' in await pg.inner_text('#view') and 'Yükseliş dönemi' in await pg.inner_text('#view')
    assert await pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), 'sonuç ekranı 320 px taşıyor'
    # tamamen nakit portföy
    await pg.click('[data-a=freeMenu]')
    await pg.click('[data-a=freePf][data-v=n]')
    await pg.click('[data-a=freeStart]')
    await pg.wait_for_timeout(200)
    assert await pg.evaluate("[S.sim.cash,SIMBASE.every(function(b){return S.sim.pos[b[0]].q===0}),simValue()]") == [100000, True, 100000]
    assert await pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), 'portföy 320 px taşıyor'
    # varsayılan portföy çalışma portföyüyle aynı
    d = await pg.evaluate("(function(){simInit('x1');var a=JSON.stringify([S.sim.pos,S.sim.cash]);simInit('x1');freePortfolio(S.sim,'d');return a===JSON.stringify([S.sim.pos,S.sim.cash])})()")
    assert d is True
    # senaryolar: 'r' (varsayılan) b22 takvimiyle aynı; diğerleri beklenen yönde
    R = await pg.evaluate("""(function(){var o={};function gen(lvl,sc,seed){simInit(seed);if(sc===undefined)freeInit(lvl);else freeInit(lvl,sc);for(var i=0;i<3000;i++)simStep();return S.sim.crises}
      var a=JSON.stringify(gen('o',undefined,'sc-1')),b=JSON.stringify(gen('o','r','sc-1'));o.ayni=a===b;
      ['r','s','k','y'].forEach(function(sc){var up=0,n=0,gap=0,g=0,mg=0;for(var s=0;s<30;s++){var c=gen('o',sc,'sc-'+s);c.forEach(function(e,i){n++;if(e.drop<0)up++;mg+=Math.abs(e.drop);if(i){gap+=e.at-c[i-1].at;g++}})}
        o[sc]={up:up/n,gap:gap/g,mg:mg/n}});return o})()""")
    assert R['ayni'] is True, 'varsayılan senaryo b22 ile aynı olay takvimini üretmeli'
    # b22 (öncesi) serbest mod olay/haber takvimi sabit: senaryo çarpanları varsayılanı değiştirmemeli (b22 derlemesiyle ölçülen özet)
    ozet = await pg.evaluate("""(function(){var h=5381,t='';['k','o','z'].forEach(function(l){simInit('altin-'+l);freeInit(l);for(var i=0;i<1500;i++)simStep();t+=JSON.stringify([S.sim.crises,S.sim.news])});for(var i=0;i<t.length;i++)h=((h*33)^t.charCodeAt(i))>>>0;return h+' '+t.length})()""")
    assert ozet == '31038065 52291', f'varsayılan serbest mod takvimi değişti: {ozet}'
    assert 0.40 < R['r']['up'] < 0.60 and R['k']['up'] < 0.35 and R['y']['up'] > 0.65, R
    assert R['s']['gap'] > R['r']['gap'] * 1.3 and R['k']['gap'] < R['r']['gap'] * 0.85 and R['s']['mg'] < R['r']['mg'] * 0.85 and R['k']['mg'] > R['r']['mg'], R
    assert pg.hatalar == [], pg.hatalar
    await ctx.close()


@test
async def serbest_mod_hiz_ve_otomatik_emir(b):
    """b23: piyasa hızı (duraklat/1/2/4); otomatik sat emri: zarar/kâr eşiği ortalama alışa göre, tetiklenince tamamı satılır ve emir silinir,
    manuel tam satışta emir silinir, geçersiz değerler yok sayılır; çalışma simülatöründe emir yoktur; hiçbir şey kaydedilmez."""
    pg, kod, cd, satir, il = await tam_oturum(b, 'A')
    await pg.set_viewport_size({'width': 360, 'height': 760})
    ev0 = len(await pg.evaluate(f"Store.listEvents('{kod}')"))
    ls0 = await pg.evaluate("JSON.stringify(Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)]}))")
    await pg.evaluate("S.stage='end';render()")
    await pg.evaluate("ACT.freeOpen();ACT.freeLvl('k');ACT.freeStart()")
    await pg.wait_for_timeout(300)
    # ── hız ──
    assert await pg.evaluate("S.free.speed==null") and await pg.query_selector('[data-a=freeSpeed][data-v="4"]')
    await pg.click('[data-a=freeSpeed][data-v="0"]')
    assert await pg.evaluate("document.querySelector('[data-a=freeSpeed][data-v=\"0\"]').getAttribute('aria-pressed')") == 'true'
    t0 = await pg.evaluate('S.sim.tick')
    await pg.wait_for_timeout(1800)
    assert await pg.evaluate('S.sim.tick') == t0, 'duraklatılınca piyasa ilerlememeli'
    await pg.evaluate("ACT.freeSpeed(3);ACT.freeSpeed('x')")
    assert await pg.evaluate('S.free.speed') == 0, 'geçersiz hız yok sayılmalı'
    await pg.click('[data-a=freeSpeed][data-v="4"]')
    t0 = await pg.evaluate('S.sim.tick')
    await pg.wait_for_timeout(1800)
    assert await pg.evaluate('S.sim.tick') - t0 >= 4, '4× hızda bir turda dört gün ilerlemeli'
    await pg.click('[data-a=freeSpeed][data-v="0"]')
    # ── emirler: kartı aç ──
    await pg.evaluate("ACT.simDetail('TUPRS')")
    assert await pg.query_selector('#dord [data-a=freeOrder]'), 'detayda emir kartı olmalı'
    await pg.click('[data-a=freeOrder][data-v="TUPRS|stop|0.1"]')
    await pg.click('[data-a=freeOrder][data-v="TUPRS|take|0.2"]')
    assert await pg.evaluate("JSON.stringify(S.sim.orders.TUPRS)") == '{"stop":0.1,"take":0.2}'
    assert await pg.evaluate("[].map.call(document.querySelectorAll('#dord [role=radio][aria-checked=true]'),function(e){return e.dataset.v}).join()") == 'TUPRS|stop|0.1,TUPRS|take|0.2'
    await pg.evaluate("ACT.freeOrder('TUPRS|stop|0.07');ACT.freeOrder('TUPRS|zzz|0.1');ACT.freeOrder('YOKHISSE|stop|0.1')")
    assert await pg.evaluate("JSON.stringify(S.sim.orders)") == '{"TUPRS":{"stop":0.1,"take":0.2}}', 'geçersiz emirler yok sayılmalı'
    await pg.evaluate("ACT.simBack()")
    assert await pg.evaluate("document.querySelector('[data-sim=TUPRS] .ordl').textContent") == 'Otomatik emir: zarar −%10 · kâr +%20'
    assert await pg.evaluate("document.querySelector('[data-sim=BIMAS] .ordl').hidden")
    # ── eşik: -%9 tetiklemez, -%11 tetikler ──
    R = await pg.evaluate("""(function(){var m=S.sim,o=m.pos.TUPRS,q=o.q,avg=o.avg,c0=m.cash,r={};
      m.p.TUPRS=avg*0.91;freeOrders();r.a=[m.pos.TUPRS.q===q,!!m.orders.TUPRS];
      m.p.TUPRS=avg*0.89;var p=m.p.TUPRS;freeOrders();r.b=[m.pos.TUPRS.q,!!m.orders.TUPRS,m.trades[m.trades.length-1].auto,m.trades[m.trades.length-1].q===q,Math.abs(m.cash-(c0+q*p))<1e-6];return r})()""")
    assert R['a'] == [True, True] and R['b'] == [0, False, 'stop', True, True], R
    assert 'Otomatik emir' in await pg.evaluate("document.getElementById('toast').textContent")
    # kâr emri
    R = await pg.evaluate("""(function(){var m=S.sim,o=m.pos.KOZAL,q=o.q,avg=o.avg;m.orders.KOZAL={stop:0.2,take:0.15};m.p.KOZAL=avg*1.14;freeOrders();var a=m.pos.KOZAL.q===q;m.p.KOZAL=avg*1.16;freeOrders();
      return [a,m.pos.KOZAL.q,m.orders.KOZAL===undefined,m.trades[m.trades.length-1].auto]})()""")
    assert R == [True, 0, True, 'take'], R
    # manuel tam satışta emir silinir; pozisyonsuz hisseye emir konmaz
    await pg.evaluate("S.sim.orders.THYAO={stop:0.1,take:null};ACT.simDetail('THYAO')")
    await pg.click('[data-a=simOpen][data-v="THYAO|S"]')
    await pg.click('[data-a=simQty][data-v=max]')
    await pg.click('[data-a=simGo]')
    await pg.wait_for_timeout(150)
    assert await pg.evaluate("[S.sim.pos.THYAO.q,S.sim.orders.THYAO===undefined]") == [0, True], 'tam satışta emir silinmeli'
    assert await pg.evaluate("document.querySelectorAll('#dord [data-a=freeOrder][disabled]').length") == 9, 'pozisyon yokken emir düğmeleri pasif olmalı'
    await pg.evaluate("ACT.freeOrder('THYAO|stop|0.1')")
    assert await pg.evaluate("S.sim.orders.THYAO===undefined"), 'pozisyonsuz hisseye emir konmamalı'
    # marketTick üzerinden: emir günü ilerleyen piyasada da çalışır
    await pg.evaluate("ACT.simBack();S.sim.orders.ASELS={stop:0.05,take:null};S.sim.p.ASELS=S.sim.pos.ASELS.avg*0.5;S.free.speed=1;marketTick()")
    assert await pg.evaluate("[S.sim.pos.ASELS.q,S.sim.orders.ASELS===undefined]") == [0, True]
    # sonuç ekranı otomatik emir sayısını söyler
    await pg.evaluate("ACT.freeQuit();ACT.freeEnd()")
    txt = await pg.inner_text('#view')
    assert 'otomatik emirle yapıldı' in txt and 'Ayarları değiştir' in txt and 'Aynı ayarlarla yeniden oyna' in txt, txt[:300]
    assert await pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1")
    # ── hiçbir şey kaydedilmedi ──
    await pg.evaluate("flush()")
    await pg.wait_for_timeout(300)
    assert len(await pg.evaluate(f"Store.listEvents('{kod}')")) == ev0, 'serbest modda olay kaydedilmemeli'
    assert await pg.evaluate("JSON.stringify(Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)]}))") == ls0, 'serbest mod depolamayı değiştirmemeli'
    # çalışma simülatöründe emir yok
    await pg.evaluate("ACT.freeBack();simInit();S.free=null")
    assert await pg.evaluate("S.sim.orders===undefined&&typeof freeOrders==='function'")
    await pg.evaluate("S.sim.p.TUPRS=S.sim.pos.TUPRS.avg*0.5;var q=S.sim.pos.TUPRS.q;freeOrders();window.__q=[q,S.sim.pos.TUPRS.q]")
    assert await pg.evaluate("window.__q[0]===window.__q[1]"), 'çalışma simülatöründe otomatik emir çalışmamalı'
    temiz(pg)


@test
async def sistem_testi(b):
    pg = await sayfa(b)
    await panel_ac(pg)
    await pg.click('[data-a=adSelf]')
    await pg.wait_for_function('document.querySelector("#mbox").innerText.indexOf("Yerel kayıt turu")>=0')
    metin = await pg.inner_text('#mbox')
    assert 'Tarayıcı deposu' in metin and 'Yerel kayıt turu' in metin
    assert 'Uyaran parmak izi' in metin and 'Uygulama sürümü' in metin and 'Olay kuyruğu' in metin
    sonuc = await pg.evaluate('S.selfRes')
    assert all(x['ok'] is not False for x in sonuc), [x for x in sonuc if x['ok'] is False]
    pe = await sayfa(b, depo_engelli=True)
    await panel_ac(pe)
    await pe.click('[data-a=adSelf]')
    await pe.wait_for_function('!!S.selfRes')
    sonuc_e = await pe.evaluate('S.selfRes')
    assert any(x['ok'] is False and x['ad'] == 'Tarayıcı deposu' for x in sonuc_e), 'depo engelliyse sistem testi bunu hata olarak bildirmeli'
    temiz(pg, pe)


@test
async def fiyat_gosterimi(b):
    pg = await sayfa(b)
    await pg.evaluate("S.code='X';S.grp='B';S.stage='sim';S.phase='sim';simInit();S.simTab='p';S.tourSeen={sim:1};S.tour=null;render()")
    sayi = lambda s: float(s.replace('₺', '').replace('.', '').replace(',', '.').replace('−', '-').strip())
    for gun in (1, 56, 140, 222, 299):   # krizlerin içinde (52-58, 135-141, 218-224) ve sonunda
        await pg.evaluate(f'while(S.sim.tick<{gun}){{simStep()}}simLive()')
        satirlar = await pg.evaluate("SIMBASE.map(function(b){var k=b[0],r=document.querySelector('[data-sim='+k+']'),o=S.sim.pos[k];return {k:k,p:S.sim.p[k],q:o.q,sp:r.querySelector('.sp').textContent,rp:r.querySelector('.rp').textContent}})")
        for r in satirlar:
            assert abs(sayi(r['sp']) - round(r['p'], 2)) < 0.006, (gun, r)
            if r['q'] > 0:
                assert abs(sayi(r['rp']) - round(r['q'] * r['p'])) <= 1, (gun, r)
        ust = await pg.evaluate("({sv:document.getElementById('sv').textContent,i:document.getElementById('sinv').textContent,c:document.getElementById('scash').textContent})")
        assert abs(sayi(ust['sv']) - round(await pg.evaluate('simValue()'))) <= 1 and abs(sayi(ust['i']) + sayi(ust['c']) - sayi(ust['sv'])) <= 2, (gun, ust)
    temiz(pg)


@test
async def adet_fiyat_gosterimi(b):
    """Portföy satırı 'adet × 1 lot fiyatı = değer' olarak okunur ve her gün modelle birebir tutarlıdır; kâr/zarar ve ortalama alış ayrı gösterilir;
    detay sayfası ve işlem penceresi aynı rakamları aynı adlarla verir."""
    pg = await sayfa(b)
    await pg.evaluate("S.code='X';S.grp='B';S.stage='sim';S.phase='sim';simInit();S.simTab='p';S.tourSeen={sim:1};S.tour=null;render()")
    tl = lambda s: float(s.replace('₺', '').replace('.', '').replace(',', '.').replace('−', '-').replace('+', '').strip())
    for gun in (1, 56, 140, 222, 299):   # krizlerin içinde (52-58, 135-141, 218-224) ve sonunda
        await pg.evaluate(f'while(S.sim.tick<{gun}){{simStep()}}simLive()')
        satirlar = await pg.evaluate("""SIMBASE.map(function(b){var k=b[0],r=document.querySelector('[data-sim='+k+']'),o=S.sim.pos[k],t=function(c){return r.querySelector(c).textContent};
          return {k:k,p:S.sim.p[k],q:o.q,avg:o.avg,sl:t('.sl'),sp:t('.sp'),rp:t('.rp'),sa:t('.sa'),rc:t('.rc'),pc:t('.pc'),rccls:r.querySelector('.rc').className,
                  etiket:Array.prototype.map.call(r.querySelectorAll('.eqc i'),function(e){return e.textContent}),ops:Array.prototype.map.call(r.querySelectorAll('.op'),function(e){return e.textContent})}})""")
        for r in satirlar:
            assert r['etiket'] == ['Adet', '1 lot fiyatı', 'Değer'] and r['ops'] == ['×', '='], r
            if r['q'] > 0:
                assert r['sl'] == f"{r['q']} lot", r
                assert abs(tl(r['sl'].replace(' lot', '')) * tl(r['sp']) - tl(r['rp'])) <= tl(r['sl'].replace(' lot', '')) * 0.005 + 1, ('adet × fiyat ≠ değer', gun, r)
                assert abs(tl(r['sa']) - round(r['avg'], 2)) < 0.006, r
                d = r['q'] * (r['p'] - r['avg'])
                pl = round((r['p'] / r['avg'] - 1) * 100, 2)
                assert abs(tl(r['rc']) - d) <= 1 and r['rc'][0] == ('+' if pl >= 0 else '−'), (gun, r)
                assert ('up' if pl >= 0 else 'dn') in r['rccls'].split(), (gun, r)
                assert r['pc'][0] == ('▲' if pl > 0 else '▼') if pl != 0 else r['pc'][0] not in '▲▼', (gun, r)
    # detay ve işlem penceresi: aynı rakamlar, aynı adlandırma
    await pg.evaluate("while(S.sim.tick<80){simStep()}simLive()")
    await pg.evaluate("ACT.simDetail('TUPRS')")
    d = await pg.evaluate("({q:S.sim.pos.TUPRS.q,p:S.sim.p.TUPRS,avg:S.sim.pos.TUPRS.avg,t:document.getElementById('dinfo').innerText})")
    assert 'Elindeki adet' in d['t'] and 'Toplam değeri' in d['t'] and 'Ort. alış fiyatın' in d['t'], d['t']
    assert f"{d['q']} lot × ₺{str(round(d['p'], 2)).replace('.', ',')}" in d['t'].replace('\n', ' ') or f"{d['q']} lot ×" in d['t'], d['t']
    await pg.click('[data-a=simOpen][data-v="TUPRS|S"]')
    m = await pg.inner_text('#mbox')
    assert 'Elindeki adet' in m and 'Toplam değeri' in m and 'Ortalama alış fiyatın' in m and 'güncel fiyat (1 lot)' in m, m
    await pg.click('[data-a=simQty][data-v=p50]')
    q = await pg.evaluate('S.simTrade.q')
    p = await pg.evaluate('S.sim.p.TUPRS')
    ozet = (await pg.inner_text('#tsum')).replace('\n', ' ')
    tutar = f"₺{q * p:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    assert f'{q} lot ×' in ozet and tutar in ozet, (ozet, tutar)
    temiz(pg)


SAHTE_FIREBASE = r"""(function(){
var KEY='__fakedb',DB={docs:JSON.parse(localStorage.getItem(KEY)||'{}')};function kaydet(){localStorage.setItem(KEY,JSON.stringify(DB.docs))}
var kop=function(x){return JSON.parse(JSON.stringify(x))};
function D(path){this.path=path;this.id=path.split('/').pop()}
D.prototype.get=async function(){var d=DB.docs[this.path];return {exists:d!==undefined,id:this.id,ref:this,data:function(){return kop(d)}}};
D.prototype.set=async function(data,o){var cur=DB.docs[this.path];if(o&&o.merge&&cur)data=Object.assign({},cur,data);DB.docs[this.path]=kop(data);kaydet()};
D.prototype.delete=async function(){delete DB.docs[this.path];kaydet()};
D.prototype.collection=function(n){return new C(this.path+'/'+n)};
function C(path){this.path=path}
C.prototype.doc=function(id){return new D(this.path+'/'+id)};
C.prototype.get=async function(){var pre=this.path+'/',self=this;var docs=Object.keys(DB.docs).filter(function(k){return k.indexOf(pre)===0&&k.slice(pre.length).indexOf('/')<0}).map(function(k){return {id:k.slice(pre.length),ref:new D(k),data:function(){return kop(DB.docs[k])}}});return {docs:docs,forEach:function(f){docs.forEach(f)}}};
C.prototype.where=function(f,op,v){var self=this;return {get:async function(){var r=await self.get();var docs=r.docs.filter(function(d){return d.data()[f]===v});return {docs:docs,forEach:function(fn){docs.forEach(fn)}}}}};
var db={collection:function(n){return new C(n)},batch:function(){var ops=[];return {set:function(r,d){ops.push([1,r,d])},delete:function(r){ops.push([0,r])},commit:async function(){ops.forEach(function(o){if(o[0])DB.docs[o[1].path]=kop(o[2]);else delete DB.docs[o[1].path]});kaydet()}}}};
var user=null;
var auth={get currentUser(){return user},signInAnonymously:async function(){user={isAnonymous:true,email:null};return {user:user}},signOut:async function(){user=null},signInWithEmailAndPassword:async function(e){user={isAnonymous:false,email:e};return {user:user}}};
window.firebase={initializeApp:function(){},auth:function(){return auth},firestore:function(){return db}};
})();"""


@test
async def sahte_firebase_entegrasyonu(b):
    html = open(HTML, encoding='utf-8').read()
    gecici = os.path.join(tempfile.mkdtemp(), 'fb.html')
    open(gecici, 'w', encoding='utf-8').write(html.replace('firebase:null', "firebase:{apiKey:'x',projectId:'x'}"))

    async def sdk(route):
        govde = SAHTE_FIREBASE if route.request.url.endswith('firebase-app-compat.js') else '//'
        await route.fulfill(status=200, content_type='application/javascript', body=govde)
    pg = await sayfa(b, url='file://' + gecici, yonlendir=sdk)
    assert await pg.evaluate('Store.mode()') == 'firebase', 'sahte SDK ile Firebase kipine geçmeli'
    await pg.evaluate("Store.adminLogin('a@b.c','x')")
    await pg.evaluate('Store.saveAlloc(makeAlloc(8,4,0))')
    assert len(await pg.evaluate('Store.listAlloc()')) == 8
    st = await pg.evaluate('Store.selfTest()')
    assert any(x['ad'].startswith('Firestore yazma') and x['ok'] is True for x in st), st
    assert not any(x['ok'] is False for x in st), [x for x in st if x['ok'] is False]
    await pg.reload()
    await pg.wait_for_function('S.stage!=="boot"')
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    await blok(pg, lambda t: 'tut')
    await pg.wait_for_timeout(500)
    db = json.loads(await pg.evaluate("localStorage.getItem('__fakedb')"))
    d = db['participants/' + kod]
    assert d['grp'] == 'A' and d.get('consentVer') == 'v1' and d.get('consentAt') and d['pre'] == 100 and d['demo'], d
    olaylar = [k for k in db if k.startswith(f'participants/{kod}/events/')]
    assert len(olaylar) >= 10, f'olay kayıtları bulutta olmalı ({len(olaylar)})'
    await pg.click('[data-a=menu]')
    await pg.click('[data-a=withdraw]')
    await pg.click('[data-a=mOk]')
    await pg.wait_for_function('S.stage==="withdrawn"')
    db = json.loads(await pg.evaluate("localStorage.getItem('__fakedb')"))
    assert db['participants/' + kod]['withdrawn'] is True
    assert any(k.startswith(f'participants/{kod}/events/') for k in db), 'katılımcı olay kayıtlarını silemez (kurallar); araştırmacı siler'
    await pg.evaluate("Store.adminLogin('a@b.c','x')")
    n = await pg.evaluate('Store.purgeWithdrawn()')
    db = json.loads(await pg.evaluate("localStorage.getItem('__fakedb')"))
    assert n == 1 and not any(k.startswith(f'participants/{kod}/events/') for k in db), 'silme işlemi olayları kaldırmalı'
    kalan = db['participants/' + kod]
    assert kalan['withdrawn'] is True and kalan.get('purgedAt') and 'demo' not in kalan and 'pre' not in kalan, kalan
    temiz(pg)


@test
async def tanitim_modu(b):
    """?demo=1: hiçbir şey kaydedilmez, bekleme ekranı çıkmaz, araştırmacı paneli açılmaz, gerçek katılımcıya dokunmaz."""
    kayit = ("window.__yaz=[];(function(){var s=Storage.prototype.setItem,r=Storage.prototype.removeItem;"
             "Storage.prototype.setItem=function(k,v){window.__yaz.push(['set',k]);return s.call(this,k,v)};"
             "Storage.prototype.removeItem=function(k){window.__yaz.push(['rm',k]);return r.call(this,k)}})()")
    # 1) Gerçek bir katılımcı kaydı oluştur, sonra aynı tarayıcıda tanıtımı aç
    pg = await sayfa(b)
    assert await pg.evaluate("document.getElementById('db').hidden") is True, 'normal açılışta tanıtım şeridi görünmemeli'
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    oncesi = await pg.evaluate("(function(){var o={};Object.keys(localStorage).filter(function(k){return k.indexOf('ilklot:')===0}).forEach(function(k){o[k]=localStorage.getItem(k)});return o})()")
    assert f'ilklot:p:{kod}' in oncesi and oncesi.get('ilklot:me') == kod
    await pg.context.add_init_script(kayit)
    d = await pg.context.new_page()
    d.hatalar = []
    d.on('pageerror', lambda e: d.hatalar.append(str(e)))
    await d.goto(URL + '?demo=1')
    await d.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    assert await d.evaluate('S.stage') == 'demoland' and await d.evaluate('S.grp') == 'B' and await d.evaluate('S.code') is None
    assert await d.evaluate("document.getElementById('db').hidden") is False, 'tanıtım şeridi görünmeli'
    govde = await d.inner_text('#view')
    assert 'kaydedilmez' in govde and 'bekleme' not in govde.lower(), govde
    await d.click('[data-a=demoStart]')
    await d.evaluate(TURU_ATLA)
    assert await d.evaluate('S.stage') == 'sim'
    assert await d.evaluate("document.getElementById('gp').hidden") is True, 'tanıtımda ilerleme çubuğu yok'
    await d.evaluate('while(S.sim.tick<80){simStep()}simLive()')
    assert await sim_sat(d) is False, 'tanıtımda bekleme ekranı çıkmamalı'
    # Savunma: grup A olsa bile (elle zorlandı) bekleme çıkmaz
    await d.evaluate("S.grp='A'")
    assert await sim_sat(d, 'KOZAL') is False, 'tanıtımda A grubu olsa da bekleme çıkmamalı'
    assert await d.evaluate('S.sim.trades.length') >= 2, 'işlemler çalışmalı (sadece kaydedilmemeli)'
    # Araştırmacı paneli: logoya 5 dokunuş açmamalı; #admin da işlemez
    for _ in range(5):
        await d.evaluate("ACT.logo()")
    assert await d.evaluate('S.stage') == 'sim'
    await d.click('[data-a=menu]')
    await d.click('[data-a=mCancel]')
    await d.evaluate('while(S.sim.tick<CFG.simTicks){simStep()}simEnd()')
    assert await d.evaluate('S.stage') == 'demoend', 'tanıtım bitince gerginlik sorusu değil tanıtım sonu ekranı'
    assert 'Hiçbir veri kaydedilmedi' in await d.inner_text('#view')
    await d.click('[data-a=demoStart]')
    assert await d.evaluate('S.stage') == 'sim' and await d.evaluate('S.sim.tick') == 0 and await d.evaluate('S.sim.trades.length') == 0
    yazilan = await d.evaluate('window.__yaz')
    izinli = {'ilklot:_t', 'ilklot:theme'}
    kotu = [y for y in yazilan if y[1] not in izinli]
    assert not kotu, f'tanıtımda yazılmaması gereken anahtarlar: {kotu}'
    assert await d.evaluate('EVQ.length') == 0
    sonrasi = await d.evaluate("(function(){var o={};Object.keys(localStorage).filter(function(k){return k.indexOf('ilklot:')===0}).forEach(function(k){o[k]=localStorage.getItem(k)});return o})()")
    assert sonrasi == oncesi, 'gerçek katılımcının kayıtları tanıtımdan etkilenmemeli'
    # Savunma katmanı: kod yanlışlıkla dolsa bile kayıt yolları yazmaz
    await d.evaluate("window.__yaz.length=0;S.code='ZZZZ-ZZZZ-ZZZZ';log('x',{});saveSnap();Store.saveP(S.code,{a:1});Store.addEvents(S.code,[{n:1,session:'1'}]);Store.withdraw(S.code,'A');remember(S.code);EVQ.push({n:1});saveQueue();flush();S.code=null;EVQ=[]")
    await d.wait_for_timeout(200)
    assert not await d.evaluate('window.__yaz'), f'DEMO korumaları yazmayı engellemeli: {await d.evaluate("window.__yaz")}'
    temiz(pg, d)
    # 2) Firebase tanımlı bir kurulumda bile sunucuya hiç bağlanılmaz
    html = open(HTML, encoding='utf-8').read()
    gecici = os.path.join(tempfile.mkdtemp(), 'fb.html')
    open(gecici, 'w', encoding='utf-8').write(html.replace('firebase:null', "firebase:{apiKey:'x',projectId:'x'}"))
    istek = []

    async def sdk(route):
        istek.append(route.request.url)
        await route.fulfill(status=200, content_type='application/javascript', body=SAHTE_FIREBASE if route.request.url.endswith('firebase-app-compat.js') else '//')
    f = await sayfa(b, url='file://' + gecici + '?demo=1', yonlendir=sdk)
    await f.click('[data-a=demoStart]')
    await f.evaluate('while(S.sim.tick<40){simStep()}')
    await f.wait_for_timeout(300)
    assert not istek, f'tanıtım Firebase SDK yüklememeli: {istek}'
    assert await f.evaluate("localStorage.getItem('__fakedb')") is None
    assert await f.evaluate('Store.mode()') == 'local'
    anahtarlar = await f.evaluate("Object.keys(localStorage).filter(function(k){return k.indexOf('ilklot:')===0})")
    assert not set(anahtarlar), f'temiz tarayıcıda tanıtım hiçbir kayıt oluşturmamalı (kod listesi dahil): {anahtarlar}'
    temiz(f)
    # 3) Adres değiştirilemeyen görünümlerde (ör. claude.ai önizlemesi): panelden aç, menüden çık
    g = await sayfa(b)
    oncesi = await g.evaluate("localStorage.getItem('ilklot:alloc')")
    await g.evaluate(kayit)
    await panel_ac(g)
    await g.click('[data-a=adDemo]')
    assert await g.evaluate('DEMO') is True and await g.evaluate('S.stage') == 'demoland' and await g.evaluate('S.grp') == 'B'
    await g.click('[data-a=demoStart]')
    await g.evaluate(TURU_ATLA)
    await g.evaluate('while(S.sim.tick<80){simStep()}simLive()')
    assert await sim_sat(g) is False
    assert not [y for y in await g.evaluate('window.__yaz') if y[1] not in izinli], await g.evaluate('window.__yaz')
    assert await g.evaluate("localStorage.getItem('ilklot:alloc')") == oncesi
    await g.click('[data-a=menu]')
    await g.click('[data-a=demoExit]')
    await g.wait_for_function('typeof S!=="undefined"&&S.stage==="consent"', timeout=15000)
    assert await g.evaluate('DEMO') is False
    temiz(g)


async def _debrife_kadar(pg, kod, kontrol_manip=False):
    """Kod girişinden bilgilendirme ekranına kadar en kısa yol (kararlar 'tut', simülatörde işlem yok)."""
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    await blok(pg, lambda t: 'tut')
    await simulatore_gec(pg)
    await simulatoru_bitir(pg)
    await blok(pg, lambda t: 'tut')
    await pg.click('[data-a=stress][data-v="2"]')
    await pg.click('[data-a=testStart]')
    for j in (0, 1):
        await pg.click(f'[data-a=tans][data-v="{j}"]')
    if kontrol_manip:
        assert 'Pilot geri bildirimi' not in await pg.inner_text('#view'), 'form amaç açıklanmadan önce (manipülasyon sorusunda) çıkmamalı'
    await pg.click('[data-a=manip][data-v=Evet]')
    if kontrol_manip:
        assert 'Pilot geri bildirimi' not in await pg.inner_text('#view'), 'form amaç tahmininden önce çıkmamalı'
    await pg.click('[data-a=guessSkip]')


@test
async def pilot_geri_bildirim(b):
    """Pilot formu: yalnızca pilot kipinde ve bilgilendirmeden sonra; CSV'ye, olay kaydına yazılır; devam edince tekrar sorulmaz; Firebase'de adresten açılamaz."""
    # 1) Normal kurulum: form yok, CSV'de pilot sütunları boş
    pg = await sayfa(b)
    assert await pg.evaluate('PILOT') is False
    await _debrife_kadar(pg, await kod_sec(pg, 'A'))
    assert 'Pilot geri bildirimi' not in await pg.inner_text('#view')
    assert await pg.query_selector('[data-a=fbSend]') is None
    # Elle çağrılsa da yazılmaz
    await pg.evaluate("ACT.fbPick('clear|5');ACT.fbSend()")
    assert await pg.evaluate('S.fb') is None
    sat = (await katilimci_csv(pg))[0]
    assert (sat['pilot_clear'], sat['pilot_duration'], sat['pilot_unease']) == ('', '', ''), sat
    temiz(pg)
    # 2) ?pilot=1: form çıkar, yanıt kaydedilir
    pg = await sayfa(b, url=URL + '?pilot=1')
    assert await pg.evaluate('PILOT') is True
    k1 = await kod_sec(pg, 'A')
    await _debrife_kadar(pg, k1, kontrol_manip=True)
    govde = await pg.inner_text('#view')
    assert 'Pilot geri bildirimi' in govde and 'Çalışmanın amacı' in govde, 'form bilgilendirmeden sonra gelmeli'
    assert govde.index('Çalışmanın amacı') < govde.index('Pilot geri bildirimi')
    await pg.click('[data-a=fbPick][data-v="clear|4"]')
    await pg.click('[data-a=fbPick][data-v="dur|Uygun"]')
    await pg.click('[data-a=fbPick][data-v="unease|Biraz"]')
    await pg.click('[data-a=fbPick][data-v="unease|Evet"]')   # seçimi değiştirir
    assert await pg.get_attribute('[data-v="unease|Evet"]', 'aria-pressed') == 'true' and await pg.get_attribute('[data-v="unease|Biraz"]', 'aria-pressed') == 'false'
    await pg.evaluate("ACT.fbPick('clear|9');ACT.fbPick('xx|Evet')")   # listede olmayan değer yok sayılır
    assert await pg.evaluate('S.fbD.clear') == '4' and await pg.evaluate('S.fbD.xx') is None
    await pg.click('[data-a=fbSend]')
    assert 'kaydedildi' in await pg.inner_text('#view') and await pg.query_selector('[data-a=fbSend]') is None
    ev = await pg.evaluate(f"Store.listEvents('{k1}')")
    fb = [e for e in ev if e['type'] == 'pilot_feedback']
    assert len(fb) == 1 and fb[0]['data']['clear'] == 4 and fb[0]['data']['dur'] == 'Uygun' and fb[0]['data']['unease'] == 'Evet', fb
    # Yeniden açılışta tekrar sorulmaz
    await pg.reload()
    await pg.wait_for_function('S.stage!=="boot"')
    await pg.click('[data-a=welcomeGo]')
    await pg.wait_for_function('S.stage==="end"')
    g2 = await pg.inner_text('#view')
    assert 'kaydedildi' in g2 and await pg.query_selector('[data-a=fbSend]') is None, 'yanıt verilmişse form yeniden çıkmamalı'
    # İkinci katılımcı: hiçbir şey seçmeden gönderir = atlama
    await pg.reload()
    await pg.wait_for_function('S.stage==="welcome"')
    await pg.click('[data-a=notMe]')
    k2 = await kod_sec(pg, 'B')
    await _debrife_kadar(pg, k2)
    await pg.click('[data-a=fbSend]')
    assert await pg.evaluate('S.fb.skip') == 1
    sat = {r['code']: r for r in await katilimci_csv(pg)}
    assert (sat[k1]['pilot_clear'], sat[k1]['pilot_duration'], sat[k1]['pilot_unease']) == ('4', 'Uygun', 'Evet'), sat[k1]
    assert (sat[k2]['pilot_clear'], sat[k2]['pilot_duration'], sat[k2]['pilot_unease']) == ('', '', ''), sat[k2]
    if KATILIMCI_KOLONLARI:
        assert list(sat[k1].keys()) == KATILIMCI_KOLONLARI
    temiz(pg)
    # 3) Firebase tanımlıyken adres parametresi formu AÇMAZ; yalnızca dosyadaki CFG.pilot açar. Tanıtım modunda da kapalı.
    html = open(HTML, encoding='utf-8').read()
    d = tempfile.mkdtemp()
    fb_kapali = os.path.join(d, 'a.html')
    fb_acik = os.path.join(d, 'b.html')
    tohum = html.replace('firebase:null', "firebase:{apiKey:'x',projectId:'x'}")
    open(fb_kapali, 'w', encoding='utf-8').write(tohum)
    open(fb_acik, 'w', encoding='utf-8').write(tohum.replace('pilot:false', 'pilot:true', 1))

    async def sdk(route):
        await route.fulfill(status=200, content_type='application/javascript', body=SAHTE_FIREBASE if route.request.url.endswith('firebase-app-compat.js') else '//')
    f1 = await sayfa(b, url='file://' + fb_kapali + '?pilot=1', yonlendir=sdk)
    assert await f1.evaluate('PILOT') is False, 'Firebase kurulumunda ?pilot=1 formu açmamalı'
    f2 = await sayfa(b, url='file://' + fb_acik, yonlendir=sdk)
    assert await f2.evaluate('PILOT') is True, 'CFG.pilot:true Firebase kurulumunda formu açmalı'
    f3 = await sayfa(b, url=URL + '?pilot=1&demo=1')
    assert await f3.evaluate('PILOT') is False
    temiz(f1, f2, f3)


async def _ozel_sayfa(b, url=URL, **ctx_kw):
    """Tarayıcı ayarları (renk şeması, hareket azaltma) verilebilen sayfa; dış istekleri toplar."""
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True, **ctx_kw)
    pg = await ctx.new_page()
    pg.hatalar, pg.istekler = [], []
    pg.on('pageerror', lambda e: pg.hatalar.append(str(e)))
    pg.on('request', lambda r: pg.istekler.append(r.url) if r.url.startswith('http') else None)
    await pg.goto(url)
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    return pg


@test
async def tema_yazi_ve_hareket(b):
    """Tema cihazdan gelir ve saklanır; yazı tipi dosyanın içinde (dış istek yok); hareket azaltma kapatır."""
    k = await _ozel_sayfa(b, color_scheme='light')
    assert await k.evaluate("document.documentElement.getAttribute('data-theme')") is None, 'açık cihazda tema özniteliği olmamalı'
    kod = await kod_sec(k, 'A')
    assert not [i for i in k.istekler if 'google' in i or 'gstatic' in i], f'yazı tipi dış sunucudan gelmemeli: {k.istekler}'
    assert await k.evaluate("document.fonts.check('700 20px \"Bricolage Grotesque\"')") is True
    assert 'Bricolage' in await k.evaluate("getComputedStyle(document.querySelector('.stage h1')).fontFamily")
    # Giriş yap, temayı değiştir: olay kaydı ve tercih
    await giris(k, kod)
    await k.click('[data-a=theme]')
    assert await k.evaluate("document.documentElement.getAttribute('data-theme')") == 'dark'
    assert await k.evaluate("localStorage.getItem('ilklot:theme')") == 'dark'
    await k.evaluate('flush()')
    ev = await k.evaluate(f"Store.listEvents('{kod}')")
    assert [e['data']['theme'] for e in ev if e['type'] == 'theme_set'] == ['dark']
    st = [e for e in ev if e['type'] == 'session_start'][0]['data']
    assert st['theme'] == 'light', 'session_start açılıştaki temayı yazar'
    # Yeniden açılış: kayıtlı tercih cihaz temasının önüne geçer (cihaz açık, tercih koyu)
    await k.reload()
    await k.wait_for_function('S.stage!=="boot"')
    assert await k.evaluate("document.documentElement.getAttribute('data-theme')") == 'dark'
    temiz(k)
    # Koyu cihaz, kayıt yok: koyu başlar; kullanıcı açığa alırsa kalıcı
    d = await _ozel_sayfa(b, color_scheme='dark')
    assert await d.evaluate("document.documentElement.getAttribute('data-theme')") == 'dark'
    await d.click('[data-a=theme]')
    await d.reload()
    await d.wait_for_function('S.stage!=="boot"')
    assert await d.evaluate("document.documentElement.getAttribute('data-theme')") == 'light', 'kullanıcı seçimi cihaz temasından önce gelir'
    # Hareket: ekran geçişinde belirme animasyonu var; hareket azaltmada yok
    await d.check('[data-in=consentOk]')
    await d.click('[data-a=consent]')
    assert await d.evaluate("getComputedStyle(document.getElementById('view')).animationName") == 'vIn'
    r = await _ozel_sayfa(b, reduced_motion='reduce')
    await r.check('[data-in=consentOk]')
    await r.click('[data-a=consent]')
    assert await r.evaluate("getComputedStyle(document.getElementById('view')).animationName") == 'none', 'hareket azaltma açıkken animasyon olmamalı'
    temiz(d, r)


async def _detaya_git(pg, hisse='TUPRS', gun=80):
    await pg.evaluate(f'while(S.sim.tick<{gun}){{simStep()}}')
    await pg.evaluate(f"ACT.simDetail('{hisse}')")
    await pg.wait_for_selector('#dchart svg')
    return await pg.evaluate('(function(){var r=document.querySelector("#dchart svg").getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()')


@test
async def grafik_gezme(b):
    """Grafikte gezinince o günün gerçek fiyatı gösterilir; uçlar sınırlanır; bırakınca kaybolur; jest tek olay olarak kaydedilir."""
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    await blok(pg, lambda t: 'tut')
    await pg.click('[data-a=stress][data-v="2"]')
    await sim_baslat(pg)
    await pg.evaluate(TURU_ATLA)
    await pg.evaluate('marketTick=function(){}')   # piyasa kendiliğinden akmasın: gün numaraları deterministik olsun (akış aşağıda elle sürülür)
    x, y, w, h = await _detaya_git(pg)
    n = await pg.evaluate('Math.min(S.simRange,S.sim.h.TUPRS.length)')
    for oran in (0.0, 0.5, 1.0):
        await pg.mouse.move(x + min(oran * w, w - 0.5), y + h / 2)   # tam sağ kenar grafiğin dışında sayılır
        dolu = await pg.evaluate('S.scrubDay')
        i = int(oran * (n - 1) + 0.5)
        gun = await pg.evaluate(f'S.sim.tick-({n}-1-{i})')
        assert dolu == gun, (oran, dolu, gun)
        fiyat = await pg.evaluate(f'fmt(S.sim.h.TUPRS[S.sim.h.TUPRS.length-1-(S.sim.tick-{gun})])')
        assert (await pg.text_content('#scrublb')) == f'Gün {gun} · ₺{fiyat}', await pg.text_content('#scrublb')
    # Uçların dışı: son güne sınırlanır
    await pg.mouse.move(x + w + 60, y + h / 2)
    assert await pg.evaluate('S.scrubDay') in (None, await pg.evaluate('S.sim.tick')), 'sağ uç bugünü göstermeli'
    # Piyasa akarken işaret aynı güne sabit kalır
    await pg.mouse.move(x + 0.5 * w, y + h / 2)
    gun0 = await pg.evaluate('S.scrubDay')
    await pg.evaluate('simStep();simStep();simLive()')
    assert await pg.evaluate('S.scrubDay') == gun0 and 'Gün %d ·' % gun0 in await pg.text_content('#scrublb')
    # Fare grafikten çıkınca 1,5 sn sonra kaybolur
    await pg.mouse.move(x + 0.5 * w, y - 120)
    await pg.wait_for_timeout(1800)
    assert await pg.evaluate('S.scrubDay') is None and await pg.query_selector('#scrublb') is None
    # Basılı sürükleme tek olay yazar (hareket sayısıyla)
    await pg.mouse.move(x + 0.2 * w, y + h / 2)
    await pg.mouse.down()
    for k in range(1, 8):
        await pg.mouse.move(x + (0.2 + 0.08 * k) * w, y + h / 2)
    await pg.mouse.up()
    await pg.wait_for_timeout(1800)
    await pg.evaluate('flush()')
    ev = await pg.evaluate(f"Store.listEvents('{kod}')")
    ges = [e for e in ev if e['type'] == 'sim_chart_scrub']
    assert len(ges) == 1 and ges[0]['data']['k'] == 'TUPRS' and ges[0]['data']['moves'] >= 6, ges
    # Aralık değişince ve detaydan çıkınca işaret temizlenir
    await pg.mouse.move(x + 0.5 * w, y + h / 2)
    await pg.evaluate('ACT.simBack()')
    assert await pg.evaluate('S.scrubDay') is None
    temiz(pg)


@test
async def tanitim_hiz_ve_kriz(b):
    """Tanıtım hızı ve krize atlama yalnızca tanıtımda çalışır."""
    d = await sayfa(b, url=URL + '?demo=1&hizli=1')
    await d.click('[data-a=demoStart]')
    await d.evaluate(TURU_ATLA)
    await d.wait_for_timeout(1000)
    t1 = await d.evaluate('S.sim.tick')
    await d.evaluate("ACT.demoSpeed('4')")
    s0 = await d.evaluate('S.sim.tick')
    await d.wait_for_timeout(1000)
    t4 = await d.evaluate('S.sim.tick') - s0
    assert t1 >= 3 and t4 >= 2.5 * t1, f'4× hız ~4 kat ilerlemeli: 1×={t1}, 4×={t4}'
    await d.evaluate("ACT.demoSpeed('3')")
    assert await d.evaluate('S.demoSpeed') == 4, 'geçersiz hız yok sayılır'
    # Menüde kontroller görünür
    await d.click('[data-a=menu]')
    assert await d.query_selector('[data-a=demoCrisis]') is not None and await d.get_attribute('[data-a=demoSpeed][data-v="4"]', 'aria-pressed') == 'true'
    await d.click('[data-a=demoCrisis]')
    kriz = await d.evaluate('CFG.simCrises.map(function(c){return c.at})')
    tk = await d.evaluate('S.sim.tick')
    assert tk >= kriz[0] - 2 and tk < kriz[0] + 40, (tk, kriz)
    await d.evaluate("while(S.sim.tick<CFG.simCrises[0].at+10)simStep()")
    await d.evaluate('ACT.demoCrisis()')
    assert await d.evaluate('S.sim.tick') >= kriz[1] - 2
    temiz(d)
    # Gerçek akışta çarpan ve atlama etkisiz
    g = await sayfa(b, url=URL + '?hizli=1')
    kod = await kod_sec(g, 'B')
    await giris(g, kod)
    await forma_ve_on_test(g)
    await alistirma_ve_basla(g)
    await blok(g, lambda t: 'tut')
    await g.click('[data-a=stress][data-v="2"]')
    await sim_baslat(g)
    await g.evaluate(TURU_ATLA)
    await g.evaluate("S.demoSpeed=4;ACT.demoSpeed('4')")
    s0 = await g.evaluate('S.sim.tick')
    await g.wait_for_timeout(1000)
    ilerleme = await g.evaluate('S.sim.tick') - s0
    assert ilerleme <= 8, f'tanıtım dışında hız çarpanı işlemez ({ilerleme} tur / sn)'
    t = await g.evaluate('S.sim.tick')
    await g.evaluate('ACT.demoCrisis()')
    assert await g.evaluate('S.sim.tick') - t <= 8, 'tanıtım dışında krize atlama işlemez'
    temiz(g)


@test
async def piyasa_tarafsizligi(b):
    """Simülatör takvimi: kriz sonrası tarafsız piyasa (ölçütler analiz/simulator_tohum_ara.js ile aynı), haber günleri kriz günleriyle uyumlu, krizler sondan yeterince önce biter."""
    pg = await sayfa(b)
    R = await pg.evaluate("""(function(){simInit();var H={};SIMBASE.forEach(function(b){H[b[0]]=[b[2]]});
    while(S.sim.tick<CFG.simTicks){simStep();SIMBASE.forEach(function(b){H[b[0]].push(S.sim.p[b[0]])})}
    var ev=[],pre=0,minP=1e9,N=CFG.simTicks;
    CFG.simCrises.forEach(function(c){c.stocks.forEach(function(k){var e=c.at+c.len-1,h=H[k];ev.push({k:k,end:h[N]/h[e]-1,p20:h[Math.min(N,e+20)]/h[e]-1})})});
    SIMBASE.forEach(function(b){for(var t=0;t<CFG.simCrises[0].at;t++)pre=Math.max(pre,Math.abs(H[b[0]][t]/b[2]-1));H[b[0]].forEach(function(x){minP=Math.min(minP,x)})});
    return {ev:ev,pre:pre,minP:minP,bim:H.BIMAS[N]/H.BIMAS[0]-1,N:N,
      neg:SIMNEWS.filter(function(x){return x[2]<0}).map(function(x){return x[0]}),
      crs:CFG.simCrises.map(function(c){return [c.at,c.len]})}})()""")
    ev = R['ev']
    ort = lambda a: sum(a) / len(a)
    son, p20 = [e['end'] for e in ev], [e['p20'] for e in ev]
    assert abs(ort(son)) <= 0.005 and abs(ort(p20)) <= 0.005, f'kriz sonrası ortalama değişim tarafsız değil: {ort(son):.4f} / {ort(p20):.4f}'
    assert 2 <= sum(x > 0 for x in son) <= 3 and 2 <= sum(x > 0 for x in p20) <= 3, 'olayların 2-3\'ü yükselmeli'
    assert max(abs(x) for x in son) <= 0.06, 'tek bir olay çok büyük toparlandı/düştü'
    assert R['pre'] <= 0.045, f'ilk krizden önce hisseler çok saptı: {R["pre"]:.3f}'
    assert abs(R['bim']) <= 0.035 and R['minP'] >= 1, 'krizsiz hisse oynadı ya da fiyat 1\'in altına indi'
    bekle = {a for at, ln in R['crs'] for a in (at, at - 6)}
    assert set(R['neg']) == bekle, f'olumsuz haber günleri kriz günleriyle uyuşmuyor: {R["neg"]} / {sorted(bekle)}'
    assert all(at + ln + 50 <= R['N'] for at, ln in R['crs']), 'son kriz bitişi ile oturum sonu arası çok kısa'
    temiz(pg)


@test
async def karar_karti_ve_uyari(b):
    """Karar kartı: yalnızca bilgilendirmeden sonra; sayılar kararlarla uyuşur; resimde grup/amaç yok; olay kaydı. Sabit uyarı satırı yalnızca görev ve simülatörde görünür. Ana ekran simgesi gömülü."""
    pg = await sayfa(b)
    ham = await pg.evaluate("[document.querySelector('link[rel=apple-touch-icon]').href.slice(0,22),document.querySelector('meta[name=apple-mobile-web-app-capable]').content]")
    assert ham == ['data:image/png;base64,', 'yes'], ham
    assert not await pg.is_visible('#disc'), 'uyarı satırı onam ekranında görünmemeli'
    kod = await kod_sec(pg, 'B')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    assert await pg.is_visible('#disc') and 'yatırım tavsiyesi değildir' in await pg.inner_text('#disc'), 'karar ekranında uyarı satırı olmalı'
    n = [0]

    def plan(t):
        n[0] += 1
        return ('sat', 'tut', 'al')[n[0] % 3]
    await blok(pg, plan)
    await simulatore_gec(pg)
    assert await pg.is_visible('#disc'), 'simülatörde uyarı satırı olmalı'
    assert await sim_sat(pg) is False
    await pg.evaluate("ACT.simBack();doSimBuy('BIMAS',3)")
    assert await pg.evaluate('S.sim.trades.length') == 2
    await simulatoru_bitir(pg)
    await blok(pg, plan)
    await pg.click('[data-a=stress][data-v="2"]')
    await pg.click('[data-a=testStart]')
    for j in (0, 1):
        await pg.click(f'[data-a=tans][data-v="{j}"]')
    assert 'Karar özetin' not in await pg.inner_text('#view'), 'kart amaç açıklanmadan önce çıkmamalı'
    await pg.click('[data-a=manip][data-v=Evet]')
    await pg.click('[data-a=guessSkip]')
    assert await pg.query_selector('#view img') is None
    assert not await pg.is_visible('#disc'), 'bilgilendirme ekranında uyarı satırı görünmemeli'
    await pg.evaluate("window._ft=[];var o=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t){window._ft.push(String(t));return o.apply(this,arguments)};0")
    await pg.click('[data-a=cardMake]')
    await pg.wait_for_selector('#view img[src^="data:image/png"]')
    metin = await pg.evaluate('window._ft')
    islem = [int(x.split()[0]) for x in metin if x.endswith('işlem yaptın')]
    sayilar = [int(x) for x in metin if x.isdigit()] + islem
    d = await pg.evaluate("(function(){var f=function(bl){var c=decCounts(bl);return [c.sat,c.tut,c.al]};return f('pre').concat(f('post'),[S.sim.trades.length])})()")
    assert sayilar == d, f'kart sayıları kararlarla uyuşmuyor: {sayilar} / {d}'
    assert sum(d[:3]) == 6 and sum(d[3:6]) == 6 and d[0] >= 1 and d[2] >= 1, d
    birlesik = ' '.join(metin).lower()
    for yasak in ('bekleme', 'grup', 'amaç', 'saniye', 'kontrol', 'müdahale'):
        assert yasak not in birlesik, f'kartta grup/amaç ipucu: {yasak}'
    assert 'yatırım tavsiyesi değildir' in birlesik
    # Portföy grafiği: işlemlerden yeniden kurulan seri, gerçek son değerle ve işlem sayısıyla uyuşur
    sr = await pg.evaluate("(function(){var d=simSeries();return {n:d.v.length,last:d.v[d.v.length-1],real:simValue(),v0:d.v[0],v00:d.v0,sides:d.tr.map(function(x){return x.side}).join('')}})()")
    assert sr['n'] == 301 and abs(sr['last'] - sr['real']) < 1, sr
    assert abs(sr['v0'] - sr['v00']) < 1 and sr['sides'] == 'SB', sr
    svg = await pg.inner_html('#view svg[aria-label^="Simülatörde toplam"]')
    assert svg.count('<circle') == 2 and 'Gün 300' in svg
    assert 'Simülatörde toplam paranın seyri' in await pg.inner_text('#view')
    import base64
    import struct
    src = await pg.evaluate("document.querySelector('#view img').src")
    png = base64.b64decode(src.split(',')[1])
    assert png[:8] == b'\x89PNG\r\n\x1a\n' and struct.unpack('>II', png[16:24]) == (1080, 1350)
    assert await pg.get_attribute('#view a[download]', 'download') == 'ilk-lot-karar-ozeti.png'
    ev = await pg.evaluate(f"Store.listEvents('{kod}')")
    assert [o for o in ev if o['type'] == 'summary_card'], 'summary_card olayı yazılmalı'
    assert 'başkalarıyla şimdilik paylaşma' in await pg.inner_text('#view')
    temiz(pg)


async def _koprude(pg, grp):
    kod = await kod_sec(pg, grp)
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    await blok(pg, lambda t: 'tut')
    await pg.click('[data-a=stress][data-v="2"]')
    return kod


async def _koprude_alistirma_sonu(pg, grp):
    """Alıştırma bitti, anlama kontrolü ilk soruda."""
    kod = await kod_sec(pg, grp)
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await pg.click('[data-a=introDone]')
    await pg.evaluate(TURU_ATLA)
    for _ in range(2):
        await pg.click('[data-a=choose][data-v=tut]')
        await pg.click('[data-a=next]')
    assert await pg.evaluate('S.tr.phase') == 'quiz'
    return kod


@test
async def anlama_kontrolu_degisken(b):
    """Anlama kontrolü: 3 havuz × 6 soru; her sorunun tam bir doğru şıkkı var; seçim oturum başına rastgele, bir önceki oturumdakini art arda tekrarlamaz, yeniden yüklemede değişmez; `comprehension` olayında `form` kayıtlı; puan 0-3 ve ilk denemeye göre."""
    pg = await sayfa(b)
    # Havuz yapısı: her kavramda 3 biçim, her biçimde 2-3 şık, doğru indeks aralıkta, açıklama dolu, kavram içi biçimler birbirinden farklı
    h = await pg.evaluate('COMP.map(function(v){return v.map(function(q){return [q.o.length,q.a,q.e.length>10,q.q]})})')
    assert len(h) == 3 and all(len(v) == 6 for v in h), h
    for v in h:
        assert len({q[3] for q in v}) == 6, 'havuzdaki sorular birbirinden farklı olmalı'
        for n, a, e, _ in v:
            assert n in (2, 3) and 0 <= a < n and e
    # Her biçim ekranda gösterilebilir; yanlış şık hata verir, doğru şık kabul edilir
    gor = set()
    for f in [(k, k, k) for k in range(6)]:
        pg = await sayfa(b)
        kod = await _koprude_alistirma_sonu(pg, 'A')
        await pg.evaluate(f'S.comp.f={list(f)};render()')
        for i in range(3):
            q = await pg.evaluate('compQ(S.comp.i)')
            assert q['q'] in await pg.inner_text('#view')
            gor.add(q['q'])
            yanlis = [j for j in range(len(q['o'])) if j != q['a']][0]
            await pg.click(f'[data-a=quiz][data-v="{yanlis}"]')
            assert await pg.is_visible('.err'), 'yanlış şıkta uyarı çıkmalı'
            await pg.click(f'[data-a=quiz][data-v="{q["a"]}"]')
            await pg.click('[data-a=quizNext]')
        assert await pg.evaluate('S.comp.score') == 0, 'ilk deneme yanlışsa puan 0 olmalı'
        await pg.evaluate('flush()')
        await pg.wait_for_timeout(300)
        ev = [o for o in await pg.evaluate(f"Store.listEvents('{kod}')") if o['type'] == 'comprehension']
        assert [(o['data']['q'], o['data']['form']) for o in ev] == list(enumerate(f)), ev
        temiz(pg)
    assert len(gor) == 18, 'on sekiz sorunun hepsi gösterilebilmeli'
    # Rastgele seçim gerçekten çeşitli ve yeniden yüklemede sabit
    pg = await sayfa(b)
    set_ = await pg.evaluate('(function(){var s={};for(var i=0;i<300;i++)s[compNew().join()]=1;return Object.keys(s).length})()')
    assert set_ >= 100, f'300 çekilişte yalnız {set_} farklı kombinasyon (216 olası)'
    tekrar = await pg.evaluate('(function(){var p=compNew(),n=0;for(var i=0;i<200;i++){var q=compNew();if(q.some(function(x,j){return x===p[j]}))n++;p=q}return n})()')
    assert tekrar == 0, f'art arda oturumlarda aynı soru {tekrar} kez geldi'
    kod = await _koprude_alistirma_sonu(pg, 'B')
    f0 = await pg.evaluate('S.comp.f')
    await pg.evaluate('ACT.quiz(compQ(S.comp.i).a);ACT.quizNext()')
    await pg.reload()
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    await pg.wait_for_timeout(500)
    if await pg.evaluate('S.comp&&S.stage==="task"'):
        assert await pg.evaluate('S.comp.f') == f0, 'yeniden yüklemede biçim değişmemeli'
    # Tam doğru: puan 3
    pg = await sayfa(b)
    await _koprude_alistirma_sonu(pg, 'A')
    for _ in range(3):
        await pg.click(f'[data-a=quiz][data-v="{await pg.evaluate("compQ(S.comp.i).a")}"]')
        await pg.click('[data-a=quizNext]')
    assert await pg.evaluate('S.comp.score') == 3
    temiz(pg)


@test
async def afis_suresi_onamla_tutarli(b):
    """Katılımcı arama afişindeki süre, onam ekranındaki süreyle aynı (b16'da afişte 40 dk, onamda 30 dk yazıyordu)."""
    ctx = await b.new_context(viewport={'width': 900, 'height': 900}, accept_downloads=True)
    pg = await ctx.new_page()
    await pg.goto(URL)
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    onam = await pg.evaluate('consentSections(true).map(function(s){return JSON.stringify(s)}).join(" ")')
    import re
    onam_dk = set(re.findall(r'yaklaşık (\d+) dakika', onam))
    assert onam_dk == {'30'}, f'onamda süre bulunamadı ya da tutarsız: {onam_dk}'
    await pg.evaluate("S.landIn='https://ornek.web.app/'")
    async with pg.expect_download() as d:
        await pg.evaluate("exportPoster('A4')")
    yol = await (await d.value).path()
    afis = open(yol, encoding='utf-8').read()
    afis_dk = set(re.findall(r'~(\d+) dk', afis))
    assert afis_dk == onam_dk, f'afiş {afis_dk} dk, onam {onam_dk} dk'
    assert '40 dk' not in afis
    await ctx.close()


@test
async def terim_aciklama(b):
    """Terimler dokununca açıklanır: sözlükteki metinle aynı, piyasa durur, kapanınca odak döner, olay kaydı var; iç içe düğme yok; geçersiz indeks yok sayılır."""
    pg = await sayfa(b)
    kod = await _koprude(pg, 'A')
    await sim_baslat(pg)
    await pg.evaluate(TURU_ATLA)
    gl = json.loads(await pg.evaluate('JSON.stringify(GLOSSARY)'))
    # Liste ekranı: Toplam paran, Nakit, Lot
    assert await pg.locator('.hero .term').count() == 2 and await pg.locator('.shint .term').count() == 1
    assert await pg.evaluate("document.querySelectorAll('button button').length") == 0, 'iç içe düğme olmamalı'
    t0 = await pg.evaluate('S.sim.tick')
    await pg.focus('.shint .term')
    await pg.click('.shint .term')
    assert await pg.evaluate("$('modal').classList.contains('open')")
    kutu = await pg.inner_text('#mbox')
    assert gl[1][0] in kutu and gl[1][1] in kutu, kutu
    await pg.wait_for_timeout(1900)
    assert await pg.evaluate('S.sim.tick') == t0, 'terim penceresi açıkken piyasa ilerlememeli'
    await pg.click('#mbox [data-a=mCancel]')
    assert not await pg.evaluate("$('modal').classList.contains('open')")
    assert await pg.evaluate("document.activeElement.classList.contains('term')"), 'kapanınca odak terime dönmeli'
    # Toplam paran + "Tüm sözlük"
    await pg.click('.hero .term >> nth=0')
    assert gl[10][1] in await pg.inner_text('#mbox')
    await pg.click('#mbox [data-a=help]')
    assert 'Sözlük' in await pg.inner_text('#mbox') and gl[7][0] in await pg.inner_text('#mbox')
    await pg.click('#mbox [data-a=mCancel]')
    # Ayrıntı ekranı: elindeki adet, ort. alış, kâr/zarar, nakit
    await pg.evaluate("ACT.simDetail('TUPRS')")
    n = await pg.locator('#view .term').count()
    assert n == 3, n
    assert await pg.evaluate("document.querySelectorAll('button button').length") == 0
    await pg.click('#view .term >> nth=0')
    assert await pg.evaluate("$('modal').classList.contains('open')")
    await pg.click('#mbox [data-a=mCancel]')
    # İşlem penceresi modal: içinde terim düğmesi olmamalı (açılırsa yarım kalan işlemi ezerdi)
    await pg.evaluate("ACT.simOpen('TUPRS|S')")
    assert await pg.locator('#mbox .term').count() == 0
    await pg.evaluate('ACT.mCancel()')
    # Geçersiz indeks
    await pg.evaluate("ACT.term('99');ACT.term('-1');ACT.term('x')")
    assert not await pg.evaluate("$('modal').classList.contains('open')")
    await pg.evaluate('flush()')
    await pg.wait_for_timeout(500)
    await pg.evaluate('flush()')
    await pg.wait_for_timeout(500)
    ev = [o for o in await pg.evaluate(f"Store.listEvents('{kod}')") if o['type'] == 'term_open']
    assert [o['data']['k'] for o in ev][:3] == [gl[1][0], gl[10][0], gl[1][0]] and all(o['data']['stage'] == 'sim' for o in ev), ev
    temiz(pg)


@test
async def simulator_oncesi_bilgi_paneli(b):
    """Simülatör öncesi panel: iki gruba birebir aynı metin; bekleme ekranını ele vermez; rakamlar ayarlardan gelir; satış sonrası "neden" sorusunu önceden söylemez; alıştırmaya geçiş çalışır."""
    metin = {}
    for g in ('A', 'B'):
        pg = await sayfa(b)
        await _koprude(pg, g)
        assert await pg.evaluate('[S.stage,S.bridge]') == ['bridge', 'sim']
        metin[g] = await pg.inner_text('#view')
        if g == 'A':
            fac = await pg.evaluate("[...document.querySelectorAll('.ifacts b')].map(function(e){return e.textContent})")
            assert fac[0].replace('\xa0', ' ') == '₺100.000' and fac[1] == '6 hisse' and fac[2] == '7,5 dk', fac
            assert len(await pg.query_selector_all('.how li')) == 5 and len(await pg.query_selector_all('.itabs div')) == 3
            await pg.click('[data-a=pracStart]')
            assert await pg.evaluate('!!S.prac&&S.stage') == 'sim'
        temiz(pg)
    assert metin['A'] == metin['B'], 'panel iki grupta aynı olmalı'
    kucuk = metin['A'].lower()
    for yasak in ('bekleme', 'bekle ', 'saniye dur', 'bir dakika dur', 'neden sat', 'korktum', 'panik', 'sert düşüş yaşa', 'kriz gelecek'):
        assert yasak not in kucuk, f'panelde olmaması gereken ifade: {yasak}'


@test
async def alistirma_simulatoru(b):
    """Alıştırma simülatörü: gerçek simülatörden önce; işlem, bekleme ekranı ve anlık görüntü kaydı yok; yalnızca tek `practice_sim` olayı (+tur olayları); gerçek simülatör sıfırdan başlar ve bekleme ekranı çalışır."""
    pg = await sayfa(b)
    kod = await _koprude(pg, 'A')
    assert await pg.query_selector('[data-a=simStart]') is None, 'alıştırmadan önce gerçek simülatör başlatılamamalı'
    sn0 = json.dumps((await pg.evaluate(f"Store.getP('{kod}')")).get('sess_1', {}), sort_keys=True)
    await pg.click('[data-a=pracStart]')
    await pg.evaluate(TURU_ATLA)
    assert await pg.evaluate('!!S.prac&&S.sim.tick') in (0, 1)
    assert 'ALIŞTIRMA' in await pg.inner_text('#db') and await pg.is_visible('#db')
    assert await pg.inner_text('#tmt') in ('⏱ 0:30', '⏱ 0:29'), await pg.inner_text('#tmt')
    # A grubunda bile zararına satışta bekleme ekranı çıkmaz; işlem yapılır
    await pg.evaluate("while(S.sim.tick<5){simStep()}S.sim.p.TUPRS=S.sim.pos.TUPRS.avg*0.9;simLive()")
    assert await sim_sat(pg) is False, 'alıştırmada bekleme ekranı çıkmamalı'
    assert await pg.evaluate('S.sim.trades.length') == 1
    await pg.evaluate("ACT.simTab('m');ACT.simTab('p');ACT.simDetail('THYAO');ACT.simBack()")
    await pg.evaluate("flush()")
    await pg.wait_for_timeout(300)
    ev = await pg.evaluate(f"Store.listEvents('{kod}')")
    kotu = [o['type'] for o in ev if o['type'] in ('sim_trade', 'cooldown_shown', 'sim_tab', 'sim_detail', 'sim_open', 'sim_start', 'practice_sim')]
    assert not kotu, f'alıştırma sırasında kaydedilmemesi gereken olaylar: {kotu}'
    sn1 = json.dumps((await pg.evaluate(f"Store.getP('{kod}')")).get('sess_1', {}), sort_keys=True)
    assert sn1 == sn0, 'alıştırma anlık görüntüyü değiştirmemeli'
    # Atla: tek olay, sayım doğru, gerçek simülatöre geçiş
    await pg.click('[data-a=pracSkip]')
    assert await pg.evaluate('[S.stage,S.bridge,!!S.prac,S.sim]') == ['bridge', 'simready', False, None]
    assert 'Alıştırma bitti' in await pg.inner_text('#view')
    await pg.wait_for_timeout(300)
    ev = await pg.evaluate(f"Store.listEvents('{kod}')")
    pr = [o for o in ev if o['type'] == 'practice_sim']
    assert len(pr) == 1 and pr[0]['data']['trades'] == 1 and pr[0]['data']['skipped'] is True and 5 <= pr[0]['data']['tick'] <= 8, pr  # piyasa arka planda akar: tam gün sayısı değişebilir
    assert not [o for o in ev if o['type'] in ('sim_trade', 'cooldown_shown')]
    await pg.click('[data-a=simStart]')
    assert await pg.evaluate('[!!S.prac,S.sim.tick,S.sim.trades.length,S.stage]') == [False, 0, 0, 'sim']
    assert await pg.evaluate('S.readMs') is not None
    assert await pg.inner_text('#tmt') in ('⏱ 7:30', '⏱ 7:29'), 'gerçek simülatör süresi'
    await pg.evaluate(TURU_ATLA)
    await pg.evaluate("while(S.sim.tick<60){simStep()}S.sim.p.TUPRS=S.sim.pos.TUPRS.avg*0.9;simLive()")
    assert await sim_sat(pg) is True, 'gerçek simülatörde A grubuna bekleme ekranı çıkmalı'
    await pg.evaluate('flush()')
    await pg.wait_for_timeout(300)
    ev = await pg.evaluate(f"Store.listEvents('{kod}')")
    assert len([o for o in ev if o['type'] == 'sim_start']) == 1 and len([o for o in ev if o['type'] == 'cooldown_shown']) == 1
    temiz(pg)
    # Kendiliğinden bitiş (20. gün)
    pg2 = await sayfa(b)
    k2 = await _koprude(pg2, 'B')
    await pg2.click('[data-a=pracStart]')
    await pg2.evaluate(TURU_ATLA)
    await pg2.evaluate("S.sim.tick=CFG.pracTicks-1;marketTick()")
    assert await pg2.evaluate('[S.stage,S.bridge,!!S.prac]') == ['bridge', 'simready', False]
    await pg2.wait_for_timeout(300)
    await pg2.evaluate('flush()')   # önceki gönderim sürüyorsa flush() döner; olay sıradaki gönderimle gider
    await pg2.wait_for_timeout(300)
    ev = await pg2.evaluate(f"Store.listEvents('{k2}')")
    pr = [o for o in ev if o['type'] == 'practice_sim']
    assert len(pr) == 1 and pr[0]['data']['skipped'] is False and pr[0]['data']['tick'] == 20, pr
    # Yeniden yükleme alıştırmada ilerlemeyi bozmaz: okuma ekranına döner
    await pg2.click('[data-a=simStart]')
    temiz(pg2)


@test
async def canli_pano(b):
    """Pano: şu an ekranda olanlar, durmuş olanlar, test modu dışarıda, 24 saat uyarısı; otomatik yenileme koşulları."""
    pg = await sayfa(b)
    kayit = """(async function(){var now=Date.now(),iso=function(ms){return new Date(now-ms).toISOString()};
    var snap=function(o,ms){o.updatedAt=iso(ms);return o};
    var P={'AAAA-AAAA-AAA1':{grp:'A',sn:snap({phase:'sim',practiced:true,sim:{tick:120,pos:{},trades:[],cash:0},ti:6},60000)},
           'AAAA-AAAA-AAA2':{grp:'B',sn:snap({phase:'pre',practiced:true,ti:3},20*60000)},
           'AAAA-AAAA-AAA3':{grp:'A',sn:snap({phase:'done',ended:true,dec:[{final:'tut'},{final:'sat'}]},2*3600000)},
           'AAAA-AAAA-AAA4':{grp:'B',sn:snap({phase:'sim',practiced:true,quick:1,sim:{tick:50}},30000)},
           'AAAA-AAAA-AAA5':{grp:'A',sn:snap({phase:'pre',practiced:true,ti:2},30*3600000)}};
    for(var k in P){await Store.saveP(k,{code:k,grp:P[k].grp,consentAt:iso(5000000),sess_1:P[k].sn})}})()"""
    await pg.evaluate(kayit)
    await panel_ac(pg)
    await pg.click('[data-a=adDash]')
    await pg.wait_for_function('S.dash')
    D = await pg.evaluate('S.dash')
    assert [x['code'] for x in D['live']] == ['AAAA-AAAA-AAA1', 'AAAA-AAAA-AAA2'], D['live']
    assert D['tmode'] == 1 and D['cons'] == 4 and D['act'] == 1, (D['tmode'], D['cons'], D['act'])
    assert D['live'][0]['at'] == 'simülatör, gün 120/300' and D['live'][1]['at'] == '1. bölüm, 3/6 karar', D['live']
    govde = await pg.inner_text('#view')
    assert 'simülatör, gün 120/300' in govde and '20 dk önce durdu' in govde and 'aktif' in govde
    assert 'AAAA-AAAA-AAA3' not in govde.split('Oturum ilerlemesi')[0].split('Şu an ekranda')[1], 'biten oturum listede olmamalı'
    assert any(f[0] == 'AAAA-AAAA-AAA5' and 'yarıda' in f[1] for f in D['flags']), 'bir günden eski yarım oturum uyarılmalı'
    assert 'Hızlı test modunda 1 oturum' in govde
    # Otomatik yenileme: kapalıyken çalışmaz, açıkken çalışır, kutuya yazılırken çalışmaz
    assert await pg.evaluate('dashAutoTick()') is False
    await pg.check('[data-in=dashAuto]')
    assert await pg.evaluate('S.dashAuto') is True
    assert await pg.evaluate('dashAutoTick()') is True
    await pg.wait_for_function('!S.dashBusy')
    await pg.focus('#an')
    assert await pg.evaluate('dashAutoTick()') is False, 'yazılan kutu varken yenilenmemeli'
    await pg.evaluate("document.activeElement.blur();S.stage='consent'")
    assert await pg.evaluate('dashAutoTick()') is False, 'panel kapalıyken yenilenmemeli'
    temiz(pg)


@test
async def haber_gorunurlugu_ve_cesitlilik(b):
    """Haberler: uyarı/kriz haberlerinin gün ve metni değişmez; yeni haberler tarafsız ve korunan pencerelerin (uyarıdan kriz sonuna) dışında; son haber kartı 'Yeni' ve Piyasa sekmesinde nokta gösterir, 'Tüm haberler' Piyasa'yı açıp noktayı siler; A ve B aynı."""
    pg = await sayfa(b)
    R = await pg.evaluate("""(function(){return {n:SIMNEWS,crs:CFG.simCrises.map(function(c){return [c.at,c.len]}),
      ticks:CFG.simTicks,kodlar:SIMBASE.map(function(x){return x[0]})}})()""")
    haber = R['n']
    gunler = [h[0] for h in haber]
    assert gunler == sorted(set(gunler)), 'haber günleri sıralı ve tekil olmalı'
    assert len(haber) >= 20 and max(gunler) < R['ticks'], f'haber sayısı/aralığı beklenenden farklı: {len(haber)}'
    onceki = {46: 'Enerji sektöründe arz sorunu konuşuluyor.', 52: 'Enerji ve madencilik hisselerinde sert satış.',
              129: 'Savunma ihracatına yönelik kısıtlama sinyali.', 135: 'Savunma hisselerinde satış dalgası.',
              212: 'Jet yakıtı fiyatlarında ani artış haberi.', 218: 'Havacılık hisselerinde sert düşüş.'}
    olumsuz = {h[0]: h[1] for h in haber if h[2] < 0}
    assert olumsuz == onceki, f'uyarı/kriz haberleri değişmiş: {olumsuz}'
    pencere = [(at - 6, at + ln + 20) for at, ln in R['crs']]
    for h in haber:
        if h[2] == 0:
            assert not any(a <= h[0] <= z for a, z in pencere), f'tarafsız haber korunan pencerede: gün {h[0]}'
            assert all(k in R['kodlar'] for k in h[3]), f'bilinmeyen hisse kodu: {h}'
        assert h[1].strip().endswith(('.', '?')) and 10 <= len(h[1]) <= 70, f'haber metni uygun değil: {h[1]!r}'
    assert sum(h[2] == 0 for h in haber) >= 14, 'tarafsız haber çeşitliliği az'
    for g in ('A', 'B'):
        pg2 = await sayfa(b)
        await _koprude(pg2, g)
        await sim_baslat(pg2)
        await pg2.evaluate(TURU_ATLA)
        await pg2.evaluate('while(S.sim.tick<12){simStep()}simLive()')
        await pg2.wait_for_timeout(300)
        assert await pg2.evaluate("/\\bnw\\b/.test(document.querySelector('nav [data-v=m]').className)"), f'{g}: yeni haberde Piyasa sekmesinde nokta olmalı'
        assert 'Piyasa, yeni haber' in await pg2.evaluate("document.querySelector('nav [data-v=m]').getAttribute('aria-label')")
        kart = await pg2.inner_text('.news')
        assert 'Yeni' in kart and 'Gün 10' in kart and 'Tüm haberler' in kart, f'{g}: son haber kartı eksik: {kart!r}'
        await pg2.click('.news .nall')
        await pg2.wait_for_timeout(300)
        assert await pg2.evaluate('S.simTab') == 'm', f'{g}: Tüm haberler Piyasa sekmesini açmalı'
        await pg2.evaluate("ACT.simTab('p')")
        assert not await pg2.evaluate("/\\bnw\\b/.test(document.querySelector('nav [data-v=m]').className)"), f'{g}: Piyasa görülünce nokta silinmeli'
        # tek değerlendirmede (gerçek zaman geçmeden): 10 günden sonra, sonraki haberden önce
        son = await pg2.evaluate("""(function(){var n=simNewsAt(S.sim.tick);var hedef=n[0]+10;var sonraki=SIMNEWS.filter(function(x){return x[0]>n[0]})[0][0];
          while(S.sim.tick<hedef){simStep()}simLive();return {n0:n[0],tick:S.sim.tick,sonraki:sonraki,txt:document.querySelector('.news').innerText}})()""")
        assert son['tick'] < son['sonraki'], f'{g}: sınama kurulumu bozuk {son}'
        assert 'Yeni' not in son['txt'] and f"Gün {son['n0']}" in son['txt'], f'{g}: 10 gün sonra "Yeni" rozeti kalkmalı, haber kartta kalmalı: {son["txt"]!r}'
        temiz(pg2)
        await pg2.context.close()
    temiz(pg)


_SIM_HASH = """(function(){simInit();var h=0,s='';while(S.sim.tick<CFG.simTicks){simStep();SIMBASE.forEach(function(b){s+=S.sim.p[b[0]].toFixed(6)+','})}
  for(var i=0;i<s.length;i++){h=(Math.imul(h,31)+s.charCodeAt(i))>>>0}return h+' '+s.length})()"""
# b18 sürümünde (serbest moddan önce) ölçülen çalışma simülatörü fiyat yolu özeti: 300 gün × 6 hisse
SIM_HASH_B18 = '3171573551 18600'


@test
async def serbest_mod_calisma_simulatorunu_degistirmez(b):
    """Serbest mod eklemesi çalışma simülatörünü değiştirmez: fiyat yolu b18 ile birebir aynı; olay ve haber listeleri çalışmadakilerdir; serbest mod oynandıktan sonra da aynı."""
    pg = await sayfa(b)
    assert await pg.evaluate(_SIM_HASH) == SIM_HASH_B18, 'çalışma simülatörünün fiyat yolu değişti'
    assert await pg.evaluate("S.sim.crises===undefined&&S.sim.news===undefined&&S.sim.free===undefined&&simCrises()===CFG.simCrises&&simNewsList()===SIMNEWS&&simLim()===CFG.simTicks")
    # serbest oyun kur, ilerlet, sonra çalışma simülatörünü yeniden kur: aynı yol
    await pg.evaluate("S.free={lvl:'z',peak:0,keep:{}};simInit('x-1');freeInit('z');for(var i=0;i<400;i++)simStep();S.free=null;S.sim=null")
    assert await pg.evaluate(_SIM_HASH) == SIM_HASH_B18, 'serbest oyundan sonra çalışma simülatörü etkilendi'
    temiz(pg)


@test
async def serbest_mod_kayit_yok_ve_kosullar(b):
    """Serbest mod: yalnızca çalışma bitiş ekranından açılır; oynarken olay, katılımcı kaydı ve tarayıcı depolaması değişmez; A grubunda zararına satışta bekleme ekranı ve gerekçe sorusu çıkmaz; geri dönünce çalışma simülatörü olduğu gibi geri gelir."""
    pg, kod, cd, satir, il = await tam_oturum(b, 'A')
    # çalışma sürerken (köprü ekranı) düğme yok ve eylem işlemez
    pg2 = await sayfa(b)
    await _koprude(pg2, 'A')
    assert await pg2.query_selector('[data-a=freeOpen]') is None
    sa = await pg2.evaluate('S.stage')
    await pg2.evaluate('ACT.freeOpen()')
    assert await pg2.evaluate('[!!S.free,S.stage]') == [False, sa], 'bitiş ekranı dışında serbest mod açılmamalı'
    temiz(pg2)
    await pg.evaluate("S.stage='end';render()")
    assert await pg.query_selector('[data-a=freeOpen]') is not None, 'bitiş ekranında serbest mod düğmesi olmalı'
    once = json.dumps([await pg.evaluate(f"Store.listEvents('{kod}')"), await pg.evaluate(f"Store.getP('{kod}')"),
                       await pg.evaluate("JSON.stringify(Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)]}))")], sort_keys=True)
    sim0 = await pg.evaluate('S.sim.tick+":"+S.sim.trades.length')
    await pg.click('[data-a=freeOpen]')
    assert await pg.evaluate('S.stage') == 'freemenu' and await pg.query_selector('[data-a=freeLvl][data-v=k]') is not None
    await pg.click('[data-a=freeLvl][data-v=z]')
    await pg.click('[data-a=freeStart]')
    assert await pg.evaluate("S.stage==='sim'&&!!S.free&&S.sim.free==='z'")
    await pg.evaluate("while(S.sim.tick<20){simStep()}simLive()")
    # A grubu, zararda satış: bekleme ve gerekçe yok, işlem doğrudan yapılır
    await pg.evaluate("S.sim.p.TUPRS=S.sim.pos.TUPRS.avg*0.9;simLive()")
    await pg.evaluate("ACT.simDetail('TUPRS')")
    await pg.click('[data-a=simOpen][data-v="TUPRS|S"]')
    await pg.click('[data-a=simQty][data-v=max]')
    await pg.click('[data-a=simGo]')
    await pg.wait_for_timeout(200)
    assert await pg.query_selector('#cdn') is None and await pg.query_selector('[data-a=simWhy]') is None, 'serbest modda bekleme/gerekçe çıkmamalı'
    assert await pg.evaluate("S.sim.trades.length")==1 and not await pg.evaluate("modalOpen()")
    await pg.evaluate("ACT.simBack();ACT.simTab('m');ACT.simTab('a');ACT.simTab('p')")
    assert 'Satış gerekçelerin' not in await pg.evaluate("simAnalysisHtml()")
    await pg.evaluate("flush();saveSnap()")
    await pg.wait_for_timeout(300)
    # oyunu bitir (onayla), yeniden oyna, zorluğu değiştir, geri dön
    await pg.click('[data-a=freeQuit]')
    await pg.click('[data-a=freeEnd]')
    assert await pg.evaluate('S.stage')=='freeend' and await pg.evaluate("S.free.res.kind")=='quit'
    await pg.click('[data-a=freeStart]')
    assert await pg.evaluate("S.stage==='sim'&&S.sim.tick<=1&&S.sim.trades.length===0&&S.sim.free==='z'"), 'yeniden oyna sıfırdan başlamalı, aynı zorlukta'
    await pg.evaluate("ACT.freeEnd()")
    await pg.click('[data-a=freeMenu]')
    await pg.click('[data-a=freeLvl][data-v=k]')
    await pg.click('[data-a=freeStart]')
    assert await pg.evaluate("S.sim.free")=='k'
    await pg.evaluate("ACT.freeEnd()")
    await pg.click('[data-a=freeBack]')
    assert await pg.evaluate("S.stage==='end'&&!S.free&&S.sim.free===undefined&&(S.sim.tick+':'+S.sim.trades.length)")==sim0, 'çalışma simülatörü olduğu gibi geri gelmeli'
    sonra = json.dumps([await pg.evaluate(f"Store.listEvents('{kod}')"), await pg.evaluate(f"Store.getP('{kod}')"),
                        await pg.evaluate("JSON.stringify(Object.keys(localStorage).sort().map(function(k){return [k,localStorage.getItem(k)]}))")], sort_keys=True)
    assert once == sonra, 'serbest mod olay, katılımcı kaydı ya da tarayıcı depolamasını değiştirdi'
    temiz(pg)


@test
async def serbest_mod_zorluk_ve_kayip_siniri(b):
    """Zorluk: kayıp sınırı Kolay %30 > Orta %20 > Zor %10; toplam para sınırın üstündeyken oyun sürer, sınıra inince biter; süre sınırı yok; ekranlar 320 px'te taşmaz."""
    ctx = await b.new_context(viewport={'width': 320, 'height': 640})
    pg = await ctx.new_page()
    pg.hatalar = []
    pg.on('pageerror', lambda e: pg.hatalar.append(str(e)))
    await pg.goto(URL)
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    lim = await pg.evaluate("['k','o','z'].map(function(k){return FREE_LV[k].lim})")
    assert lim == [0.3, 0.2, 0.1], lim
    for k, ust in (('k', 70000), ('o', 80000), ('z', 90000)):
        await pg.evaluate(f"S.stage='end';S.free=null;S.code=S.code||'TEST';ACT.freeOpen();ACT.freeLvl('{k}');ACT.freeStart()")
        await pg.wait_for_timeout(150)
        assert await pg.evaluate('freeLimit(S.free.lvl,S.sim.v0)') == ust, f'{k}: sınır tutarı'
        assert await pg.evaluate("simLim()===Infinity"), 'serbest modda süre sınırı olmamalı'
        # sınırın biraz üstünde: oyun sürer (hisse fiyatlarını kademeli düşür)
        await pg.evaluate(f"var f=(({ust}+1500)-S.sim.cash)/(simValue()-S.sim.cash);SIMBASE.forEach(function(b){{S.sim.p[b[0]]*=f}})")
        await pg.wait_for_timeout(1800)
        assert await pg.evaluate("S.stage")=='sim', f'{k}: sınırın üstünde oyun bitmemeli ({await pg.evaluate("simValue()")})'
        assert await pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), f'{k}: sim ekranı 320 px taşıyor'
        # sınırın altına in
        await pg.evaluate(f"var f=(({ust}-1500)-S.sim.cash)/(simValue()-S.sim.cash);SIMBASE.forEach(function(b){{S.sim.p[b[0]]*=f}})")
        await pg.wait_for_function("S.stage==='freeend'", timeout=6000)
        assert await pg.evaluate("S.free.res.kind")=='limit' and await pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1")
        await pg.evaluate("ACT.freeBack()")
        await pg.evaluate("S.stage='end'")
    # menü ekranı 320 px
    await pg.evaluate("S.stage='end';ACT.freeOpen()")
    assert await pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), 'menü 320 px taşıyor'
    assert await pg.evaluate("document.querySelectorAll('.flv').length")==3 and await pg.evaluate("document.querySelector('.flv.on').dataset.v")=='o'
    assert pg.hatalar == [], pg.hatalar
    await ctx.close()


@test
async def serbest_mod_haber_seridi_ve_hisse_isareti(b):
    """b25: yalnızca serbest modda yeni haber gelince üstte şerit (role=status, Piyasa'ya götürür, × ile kapanır, ~10 gün sonra kendiliğinden kalkar,
    Piyasa sekmesinde ve krizde Portföy dışındayken görünmez) ve haberden etkilenen hisse satırında "Haber" işareti. Çalışma simülatöründe ve
    alıştırmada hiçbiri çizilmez; çalışma fiyat yolu aynı kalır."""
    pg = await sayfa(b, 360)
    await pg.set_viewport_size({'width': 360, 'height': 760})
    await pg.evaluate("S.code='TEST';S.stage='end';render();ACT.freeOpen();ACT.freeLvl('o');ACT.freeStart();ACT.freeSpeed(0)")
    await pg.wait_for_timeout(300)
    assert await pg.query_selector('#sbanner') is not None, 'serbest modda #sbanner olmalı'
    assert len(await pg.query_selector_all('.srow .rnw')) == 6
    # tarafsız olmayan, bir kısım hisseyi ilgilendiren haber gününe ilerle (sektör haberi)
    r = await pg.evaluate("""(function(){var m=S.sim;for(var i=0;i<900;i++){simStep();var c=simNewsAt(m.tick);
      if(c&&c[0]===m.tick&&c[3]&&c[3].length&&c[3].length<6&&c[2]<=0&&!simCrisis(m.tick))break}
      simLive();var c=simNewsAt(m.tick);return {tick:m.tick,n:c}})()""")
    n = r['n']
    assert n[0] == r['tick'] and 0 < len(n[3]) < 6, f'sektör haberi bulunamadı: {r}'
    bn = await pg.query_selector('#sbanner .sbn')
    assert bn is not None, 'yeni haberde şerit görünmeli'
    assert await bn.get_attribute('role') == 'status'
    tx = await bn.text_content()
    assert n[1] in tx and f'Gün {n[0]}' in tx
    ack = await pg.evaluate("[].map.call(document.querySelectorAll('.srow'),function(r){return [r.dataset.sim,!r.querySelector('.rnw').hidden]})")
    assert sorted(k for k, v in ack if v) == sorted(n[3]), f'işaret yalnızca etkilenen hissede olmalı: {ack} / {n[3]}'
    kutu = await pg.evaluate("[].map.call(document.querySelectorAll('#sbanner button'),function(e){var b=e.getBoundingClientRect();return [Math.round(b.width),Math.round(b.height)]})")
    assert all(w >= 44 and h >= 44 for w, h in kutu), f'dokunma hedefi ≥44 px olmalı: {kutu}'
    # sekme geçişi: Analiz'de şerit görünür; Piyasa'da görünmez ve geri dönünce o haber için tekrar çıkmaz
    await pg.evaluate("ACT.simTab('a')")
    assert await pg.query_selector('#sbanner .sbn') is not None, 'Analiz sekmesinde de görünmeli'
    await pg.evaluate("ACT.simTab('m');simLive()")
    assert await pg.query_selector('#sbanner .sbn') is None, 'Piyasa sekmesinde görünmemeli'
    await pg.evaluate("ACT.simTab('p');simLive()")
    assert await pg.query_selector('#sbanner .sbn') is None, 'haber Piyasa sekmesinde görüldüyse şerit geri gelmemeli'
    # × ile kapatma
    r2 = await pg.evaluate("""(function(){var m=S.sim;S.newsSeen=0;S.free.bn=0;simLive();return !!document.querySelector('#sbanner .sbn')})()""")
    assert r2, 'sıfırlayınca şerit yeniden görünmeli'
    await pg.click('#sbanner [data-a=bnClose]')
    assert await pg.query_selector('#sbanner .sbn') is None and await pg.evaluate('S.free.bn') == n[0]
    await pg.evaluate("simLive()")
    assert await pg.query_selector('#sbanner .sbn') is None, 'kapatılan haber için şerit geri gelmemeli'
    assert await pg.evaluate("[].every.call(document.querySelectorAll('.srow .rnw'),function(e){return !e.hidden===(simNewsAt(S.sim.tick)[3].indexOf(e.closest('.srow').dataset.sim)>=0)})"), 'işaret şeritten bağımsız, haber tazeyken kalmalı'
    # süre: 10 gün sonra işaret de kalkar
    await pg.evaluate("S.free.bn=0;S.newsSeen=0;simLive()")
    assert await pg.query_selector('#sbanner .sbn') is not None
    # 10 gün sonra o haber için şerit ve işaret kalkar (arada yeni haber gelirse şerit yeni habere aittir)
    for _ in range(10):
        await pg.evaluate("simStep()")
    cur = await pg.evaluate("simNewsAt(S.sim.tick)")
    await pg.evaluate("simLive()")
    sb = await pg.query_selector('#sbanner .sbn')
    if cur[0] == n[0]:
        assert sb is None, 'şerit 10 gün sonra kalkmalı'
        assert await pg.evaluate("[].every.call(document.querySelectorAll('.srow .rnw'),function(e){return e.hidden})"), '10 gün sonra işaret de kalkmalı'
    else:
        assert sb is None or cur[1] in await sb.text_content(), 'şerit yalnızca en son habere ait olmalı'
    # kriz sürerken Portföy dışındaysa kriz uyarısı çıkar, şerit çıkmaz
    await pg.evaluate("""(function(){var m=S.sim;S.free.bn=0;S.newsSeen=0;S.simTab='a';var g=0;while(g++<1500){simStep();var c=simCrisis(m.tick),n=simNewsAt(m.tick);if(c&&n&&n[0]===m.tick)break}render();simLive()})()""")
    assert await pg.query_selector('#salert .salert') is not None and await pg.query_selector('#sbanner .sbn') is None, 'kriz uyarısı varken şerit çıkmamalı'
    # serbest mod bitince (S.free yok) şerit de işaret de çizilmez
    h = await pg.evaluate("(function(){var f=S.free;S.free=null;S.simTab='p';S.simDetail=null;var o=vSim(),z=typeof bnNews==='function'&&bnNews()===null;S.free=f;return [o.indexOf('sbanner')>=0,o.indexOf('rnw')>=0,z]})()")
    assert h == [False, False, True], f'çalışma/alıştırma görünümünde şerit/işaret olmamalı: {h}'
    temiz(pg)
    # ── gerçek çalışma simülatörü ──
    pg2 = await sayfa(b)
    kod = await kod_sec(pg2, 'A')
    await giris(pg2, kod)
    await forma_ve_on_test(pg2)
    await alistirma_ve_basla(pg2)
    await blok(pg2, lambda t: 'tut')
    await simulatore_gec(pg2, 5)
    assert await pg2.evaluate("S.free==null&&!S.prac"), 'çalışma simülatöründe olmalı'
    g = await pg2.evaluate("""(function(){var m=S.sim,seen=0;for(var i=0;i<250;i++){simStep();var n=simNewsAt(m.tick);if(n&&newsIsNew(m.tick,n)){seen++;simLive();
      if(document.getElementById('sbanner')||document.querySelector('.sbn,.rnw'))return 'var:'+m.tick}}return 'ok:'+seen})()""")
    assert g.startswith('ok:') and int(g[3:]) > 0, f'çalışma simülatöründe şerit/işaret çizilmemeli (ve haber gelmiş olmalı): {g}'
    temiz(pg2)
    pg3 = await sayfa(b)
    assert await pg3.evaluate(_SIM_HASH) == SIM_HASH_B18, 'çalışma simülatörünün fiyat yolu değişmemeli'


@test
async def serbest_mod_haber_derinligi_ve_olaylar(b):
    """Serbest mod haberleri: her olaydan önce uyarı, olay gününde haber; tarafsız haber uyarı-bitiş pencerelerinin dışında; haber derinliği zorlukla artar (kısa → nedenli → belirsiz); zor uyarılar yön vermez; düşüş/yükseliş log-simetrik; aynı tohum aynı takvim."""
    pg = await sayfa(b)
    R = await pg.evaluate("""(function(){var o={};['k','o','z'].forEach(function(k){var L=FREE_LV[k];simInit('t-'+k);freeInit(k);for(var i=0;i<2500;i++)simStep();var m=S.sim;
      o[k]={n:m.news,c:m.crises,warn:L.warn,d:L.d,lim:L.lim,drop:L.drop,tick:m.tick};
      simInit('t-'+k);freeInit(k);for(var i=0;i<2500;i++)simStep();o[k].tekrar=JSON.stringify(S.sim.news)===JSON.stringify(m.news)&&JSON.stringify(S.sim.crises)===JSON.stringify(m.crises)});
      o.neu=FREE_NEU;o.N=FREE_N;return o})()""")
    ort = {}
    for k in ('k', 'o', 'z'):
        r = R[k]
        gun = [h[0] for h in r['n']]
        assert gun == sorted(set(gun)), f'{k}: haber günleri sıralı ve tekil olmalı'
        assert r['tekrar'], f'{k}: aynı tohum aynı takvimi üretmeli'
        cs = r['c']
        assert len(cs) >= 20, f'{k}: 2500 günde yeterli olay yok ({len(cs)})'
        for i, c in enumerate(cs):
            assert any(h[0] == c['at'] - r['warn'] for h in r['n']), f'{k}: olaydan {r["warn"]} gün önce uyarı yok (gün {c["at"]})'
            assert any(h[0] == c['at'] and h[3] == c['stocks'] for h in r['n']), f'{k}: olay günü haberi yok'
            if i:
                assert c['at'] - cs[i - 1]['at'] - cs[i - 1]['len'] >= r['warn'] + 8, f'{k}: olaylar iç içe'
            mg = abs(c['drop'])
            if c['drop'] > 0:
                assert r['drop'][0] * 0.6 - 0.002 <= mg <= r['drop'][1] + 0.002, f'{k}: düşüş büyüklüğü aralık dışı {mg}'
            else:
                d = mg / (1 + mg)
                assert r['drop'][0] * 0.6 - 0.003 <= d <= r['drop'][1] + 0.003, f'{k}: yükseliş düşüşün log-simetriği değil {mg}'
        koru = [(c['at'] - r['warn'] - 3, c['at'] + c['len'] + 8) for c in cs]
        olay_gunleri = {c['at'] for c in cs} | {c['at'] - r['warn'] for c in cs}
        for h in r['n'][1:]:
            if h[0] not in olay_gunleri:
                assert h[2] == 0 and not any(a < h[0] < z for a, z in koru), f'{k}: tarafsız haber korunan pencerede (gün {h[0]})'
        up = sum(c['drop'] < 0 for c in cs) / len(cs)
        assert 0.3 <= up <= 0.7, f'{k}: yükseliş oranı dengesiz {up:.2f}'
        ev = [h[1] for h in r['n'] if h[0] in {c['at'] for c in cs}]
        ort[k] = sum(map(len, ev)) / len(ev)
        sek = {c['at'] for c in cs}
        ek = [h for h in r['n'] if h[0] in sek]
        assert len({h[1] for h in ek}) >= 10, f'{k}: olay haberi çeşitliliği az'
    assert ort['k'] < ort['o'] < ort['z'], f'haber derinliği zorlukla artmıyor: {ort}'
    assert ort['k'] <= 45 and ort['z'] >= 100, ort
    for si, sek in enumerate(R['N']):
        for x in (0, 1, 2, 3):
            e = x in (1, 3)
            assert len(sek[x][0]) <= 50, f'sektör {si}: kolay haber çok uzun: {sek[x][0]}'
            assert 55 <= len(sek[x][1]) <= 100, f'sektör {si}: orta haber uzunluğu: {sek[x][1]}'
            assert len(sek[x][2]) >= (100 if e else 85), f'sektör {si}: zor haber yeterince ayrıntılı değil: {sek[x][2]}'
        assert sek[0][2] == sek[2][2], f'sektör {si}: zor uyarı iki yönde aynı olmalı (yön vermemeli)'
        assert sek[0][0] != sek[2][0] and sek[0][1] != sek[2][1], f'sektör {si}: kolay/orta uyarılar yön vermeli'
    assert [len(x) for x in R['neu']] == [5, 5, 5]
    # düşüş olaylarında kriz uyarısı ekranı çalışır, yükselişte çalışmaz
    d = await pg.evaluate("""(function(){simInit('t-o');freeInit('o');S.sim.crises=[{at:5,len:6,drop:0.2,stocks:['TUPRS']},{at:30,len:6,drop:-0.2,stocks:['TUPRS']}];return [!!(simCrisis(6)&&simCrisis(6).drop>0),simCrisis(32)===null]})()""")
    assert d == [True, True]
    temiz(pg)


@test
async def serbest_mod_tanitimda(b):
    """Serbest mod tanıtım modundan da açılır (karşılama, menü ve bitiş ekranı): hiçbir depolama yazılmaz; oyun bitince tanıtım ekranına dönülür; tanıtımdaki 'krize atla' serbest oyunda çalışmaz."""
    d = await sayfa(b, url=URL + '?demo=1')
    await d.evaluate("window.__yaz=[];(function(){var s=Storage.prototype.setItem,r=Storage.prototype.removeItem;Storage.prototype.setItem=function(k,v){window.__yaz.push(['set',k]);return s.call(this,k,v)};Storage.prototype.removeItem=function(k){window.__yaz.push(['rm',k]);return r.call(this,k)}})()")
    assert await d.query_selector('[data-a=freeOpen]') is not None, 'tanıtım karşılamasında serbest mod düğmesi olmalı'
    await d.click('[data-a=freeOpen]')
    assert await d.evaluate('S.stage') == 'freemenu'
    await d.click('[data-a=freeLvl][data-v=k]')
    await d.click('[data-a=freeStart]')
    assert await d.evaluate("S.stage==='sim'&&S.sim.free==='k'&&DEMO")
    t = await d.evaluate('S.sim.tick')
    await d.evaluate('ACT.demoCrisis()')
    assert await d.evaluate('S.sim.tick') - t <= 3, 'serbest oyunda krize atlama çalışmamalı'
    await d.evaluate('ACT.menu()')
    html = await d.inner_text('#mbox')
    assert 'Serbest oyunu bitir' in html and 'Sonraki krize atla' not in html and 'Baştan başla' not in html
    await d.evaluate('ACT.mCancel()')
    await d.evaluate('ACT.freeEnd()')
    await d.click('[data-a=freeBack]')
    assert await d.evaluate('S.stage') == 'demoland' and await d.evaluate('!S.free')
    # tanıtım simülatörü sürerken menüden serbest moda geçilir ve geri dönülür
    await d.click('[data-a=demoStart]')
    await d.evaluate(TURU_ATLA)
    await d.evaluate('ACT.menu()')
    await d.click('[data-a=freeOpen]')
    assert await d.evaluate('S.stage') == 'freemenu' and not await d.evaluate('modalOpen()')
    await d.evaluate('ACT.freeBack()')
    assert await d.evaluate("S.stage==='sim'&&S.sim.free===undefined")
    yazilan = await d.evaluate('window.__yaz')
    assert yazilan == [], f'tanıtımda serbest mod depolamaya yazdı: {yazilan}'
    temiz(d)


@test
async def yazi_boyutu_secici(b):
    """b22: yazı boyutu seçici (Normal/Büyük/Çok büyük) onam ekranında ve menüde; tercih cihazda kalır, geçersiz değer yok sayılır;
    seçim yalnızca katılımcı kodu varken fs_set olayı olur; seçici basılı durumunu doğru bildirir."""
    ctx = await b.new_context(viewport={'width': 360, 'height': 700})
    pg = await ctx.new_page()
    pg.hatalar = []
    pg.on('pageerror', lambda e: pg.hatalar.append(str(e)))
    await pg.goto(URL)
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    fs = lambda: pg.evaluate("document.documentElement.getAttribute('data-fs')")  # noqa: E731
    bas = lambda: pg.evaluate("[].map.call(document.querySelectorAll('#view [data-a=fs],#mbox [data-a=fs]'),function(e){return e.getAttribute('aria-pressed')}).join()")  # noqa: E731
    assert len(await pg.query_selector_all('#view [data-a=fs]')) == 3, 'onam ekranında üç seçenek olmalı'
    assert await fs() is None and await bas() == 'true,false,false', 'varsayılan Normal'
    await pg.click('[data-a=fs][data-v="1"]')
    assert await fs() == '1' and await bas() == 'false,true,false' and await pg.evaluate("localStorage.getItem('ilklot:fs')") == '1'
    assert await pg.evaluate("getComputedStyle(document.documentElement).zoom") == '1.15', 'Büyük = %115'
    await pg.click('[data-a=fs][data-v="2"]')
    assert await fs() == '2' and await pg.evaluate("getComputedStyle(document.documentElement).zoom") == '1.3'
    assert await pg.evaluate('S.stage') == 'consent', 'seçim ekranı değiştirmemeli (onam kutusu vb. korunur)'
    await pg.reload()
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    assert await fs() == '2' and await bas() == 'false,false,true', 'tercih yenilemeden sonra da kalmalı'
    await pg.click('[data-a=fs][data-v="0"]')
    assert await fs() is None, 'Normal seçilince öznitelik kalkmalı'
    # kod yokken olay yazılmaz; kodla seçilince fs_set yazılır
    kod = await kod_sec(pg, 'A')
    assert await pg.evaluate("EVQ.length") == 0 or not [o for o in await pg.evaluate("EVQ") if o['type'] == 'fs_set'], 'kod yokken fs_set yazılmamalı'
    await giris(pg, kod)
    await pg.evaluate('ACT.menu()')
    assert len(await pg.query_selector_all('#mbox [data-a=fs]')) == 3, 'menüde de seçici olmalı'
    await pg.click('#mbox [data-a=fs][data-v="1"]')
    await pg.click('[data-a=mCancel]')
    await pg.evaluate('flush()')
    await pg.wait_for_timeout(300)
    ev = [o for o in await pg.evaluate(f"Store.listEvents('{kod}')") if o['type'] == 'fs_set']
    assert [o['data']['level'] for o in ev] == [1], ev
    # geçersiz kayıtlı değer yok sayılır, ekranı büyütmez
    for kotu in ('7', 'abc', '-1', ''):
        c2 = await b.new_context(viewport={'width': 360, 'height': 700})
        await c2.add_init_script(f"try{{localStorage.setItem('ilklot:fs',{json.dumps(kotu)})}}catch(e){{}}")
        p2 = await c2.new_page()
        await p2.goto(URL)
        await p2.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
        assert await p2.evaluate("document.documentElement.getAttribute('data-fs')") is None, f'geçersiz değer {kotu!r} yok sayılmalı'
        await c2.close()
    # depolama engelliyken seçici çalışır (yalnızca kalıcılık gider)
    pg3 = await sayfa(b, depo_engelli=True)
    await pg3.click('[data-a=fs][data-v="2"]')
    assert await pg3.evaluate("document.documentElement.getAttribute('data-fs')") == '2'
    temiz(pg, pg3)
    await ctx.close()


@test
async def yazi_boyutu_tasma_yok(b):
    """b22: Büyük/Çok büyük yazıda 320 ve 360 px'te tüm ekranlarda yatay taşma, adsız öğe, küçük hedef yok (tarama betiği);
    üst çubuk sağ kenar boşluğunu yemez (zoom etkin genişliği daraltır ama medya sorgusu gerçek genişliğe bakar)."""
    import subprocess
    betik = os.path.join(KLASOR, 'erisilebilirlik_taramasi.py')
    ortam = dict(os.environ)  # ILKLOT_HTML korunur: bozulmuş derlemeler de taranır
    r = subprocess.run([sys.executable, betik, '--genislik', '320', '360', '--yazi', '1', '2'], capture_output=True, text=True, env=ortam)
    assert r.returncode == 0, r.stdout[-700:] + r.stderr[-300:]
    assert '4 ayar' in r.stdout, r.stdout[-200:]
    for w, lv in ((320, 1), (320, 2), (360, 1), (360, 2)):
        ctx = await b.new_context(viewport={'width': w, 'height': 700})
        await ctx.add_init_script(f"try{{localStorage.setItem('ilklot:fs','{lv}')}}catch(e){{}}")
        pg = await ctx.new_page()
        await pg.goto(URL)
        await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
        kod = await kod_sec(pg, 'A')
        await giris(pg, kod)
        await forma_ve_on_test(pg)
        await alistirma_ve_basla(pg)
        sag = await pg.evaluate("Math.max.apply(null,[].map.call(document.querySelectorAll('header .icon,header .score'),function(e){var r=e.getBoundingClientRect();return r.width?r.right:0}))")
        assert 0 < sag <= w - 14, f'üst çubuk sağ kenar boşluğunu yiyor ({w}px, seviye {lv}): sağ uç {sag}'
        await ctx.close()


@test
async def pencere_odagi(b):
    """Pencere (menü) açılınca odak pencerede, kapanınca eski düğmede; başlığa bağlı; Esc kapatır."""
    pg = await sayfa(b)
    kod = await kod_sec(pg, 'A')
    await giris(pg, kod)
    await forma_ve_on_test(pg)
    await alistirma_ve_basla(pg)
    await pg.click('[data-a=menu]')
    assert await pg.evaluate('document.activeElement.id') == 'mbox'
    assert await pg.evaluate("document.getElementById('modal').getAttribute('aria-labelledby')") == 'mtitle'
    assert await pg.evaluate("document.getElementById('mtitle').textContent") == 'Menü'
    await pg.keyboard.press('Escape')
    assert not await pg.evaluate("document.getElementById('modal').classList.contains('open')")
    assert await pg.evaluate('document.activeElement.getAttribute("data-a")') == 'menu', 'odak eski düğmeye dönmeli'
    # iç içe pencere (menü → çekilme onayı → vazgeç): odak ilk düğmeye dönmeli, iç pencerenin düğmesine değil
    await pg.click('[data-a=menu]')
    await pg.click('[data-a=withdraw]')
    await pg.click('[data-a=mCancel]')
    assert await pg.evaluate('document.activeElement.getAttribute("data-a")') == 'menu', await pg.evaluate('document.activeElement.outerHTML.slice(0,80)')
    temiz(pg)


def _kontrast_hesabi():
    """Çıkış CSS'indeki renk belirteçlerinden WCAG kontrast oranları (tarayıcısız)."""
    css = open(HTML, encoding='utf-8').read().split('<style>')[1].split('</style>')[0]
    kok = re.search(r':root\{(.*?)\n\}', css, re.S).group(1)
    koyu = re.search(r':root\[data-theme="dark"\]\{(.*?)\n\}', css, re.S).group(1)
    ayr = lambda blok: dict(re.findall(r'--([a-z0-9]+):\s*([^;]+);', blok))
    acik = ayr(kok)
    tema = {'açık': acik, 'koyu': {**acik, **ayr(koyu)}}

    def renk(x):
        x = x.strip()
        m = re.match(r'#([0-9A-Fa-f]{6})$', x)
        if m:
            return [int(m.group(1)[i:i + 2], 16) for i in (0, 2, 4)] + [1.0]
        p = [float(v) for v in re.match(r'rgba?\(([^)]*)\)', x).group(1).split(',')]
        return p[:3] + [p[3] if len(p) > 3 else 1.0]

    def ustune(on, arka):
        a = on[3]
        return [on[i] * a + arka[i] * (1 - a) for i in range(3)] + [1.0]

    def lum(c):
        f = lambda v: v / 255 / 12.92 if v / 255 <= 0.03928 else ((v / 255 + 0.055) / 1.055) ** 2.4
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])

    def oran(a, b):
        hi, lo = max(lum(a), lum(b)), min(lum(a), lum(b))
        return (hi + 0.05) / (lo + 0.05)

    sonuc = {}
    # (yazı, zemin; "x@y" = x zemini y zemininin üstünde yarı saydam). Metin için eşik 4,5
    cift = [('tx', 'bg'), ('tx', 'sf'), ('mu', 'bg'), ('mu', 'sf'), ('mu', 'sf2'), ('mu2', 'bg'), ('mu2', 'sf'), ('mu2', 'sf2'),
            ('ac', 'bg'), ('ac', 'sf'), ('act', 'acs@sf'), ('up', 'bg'), ('up', 'sf'), ('up', 'ups@sf'), ('dn', 'bg'), ('dn', 'sf'), ('dn', 'dns@sf'),
            ('wt', 'wr@bg'), ('onpr', 'pr'), ('ink', 'dn')]
    for ad, T in tema.items():
        for yazi, zemin in cift:
            zn, _, ust = zemin.partition('@')
            z = renk(T[zn])
            if ust:
                z = ustune(z, renk(T[ust]))
            y = renk(T[yazi])
            if y[3] < 1:
                y = ustune(y, z)
            sonuc[(ad, yazi, zemin)] = oran(y, z)
    return sonuc


@test
async def kontrast_ve_kaynak_denetimi(b):
    """Metin renkleri iki temada da WCAG AA (4,5:1); kırmızı zeminde sabit beyaz yazı yok."""
    k = _kontrast_hesabi()
    kotu = {f'{a} {y} / {z}': round(v, 2) for (a, y, z), v in k.items() if v < 4.5}
    assert not kotu, f'AA altında kontrast: {kotu}'
    css = open(HTML, encoding='utf-8').read().split('<style>')[1].split('</style>')[0]
    sabit_beyaz = [m for m in re.findall(r'[^{}]+\{[^{}]*\}', css) if 'background:var(--dn)' in m and re.search(r'color:#fff', m, re.I)]
    assert not sabit_beyaz, f'koyu temada kırmızı zeminde beyaz yazı okunmaz; var(--ink) kullan: {sabit_beyaz}'


# ───────────────────────── çalıştırıcı ─────────────────────────
@test
async def erisilebilirlik_taramasi_calisiyor(b):
    """Keşif taraması (erisilebilirlik_taramasi.py) gerçek uygulamada temiz biter; bilerek bozulmuş kopyada
    adsız düğmeyi, düğme olmayan tıklanır öğeyi ve yatay taşmayı yakalar; axe-core betiği verilirse çalıştırır."""
    import subprocess
    import tempfile
    betik = os.path.join(KLASOR, 'erisilebilirlik_taramasi.py')
    ortam = dict(os.environ)
    ortam.pop('ILKLOT_HTML', None)
    calistir = lambda *arg, **env: subprocess.run([sys.executable, betik, '--kisa', *arg], capture_output=True, text=True, env={**ortam, **env})  # noqa: E731
    r = calistir()
    assert r.returncode == 0, r.stdout[-600:] + r.stderr[-300:]
    assert 'axe-core çalışmadı' in r.stdout
    d = tempfile.mkdtemp()
    html = open(HTML, encoding='utf-8').read()
    bozuk = os.path.join(d, 'bozuk.html')
    open(bozuk, 'w', encoding='utf-8').write(html.replace('<div id="app"', '<button class="x" style="width:10px;height:10px"></button><div id="app"', 1)
                                             .replace('</style>', '#app *{min-width:700px}</style>', 1))
    rb = calistir(ILKLOT_HTML=bozuk)
    assert rb.returncode == 1 and 'ADSIZ ÖĞE' in rb.stdout and 'YATAY TAŞMA' in rb.stdout, rb.stdout[-400:]
    # axe-core betiği verilince çalışır ve kural ihlallerini raporlar (burada sahte axe; gerçek axe ağ gerektirir)
    axe = os.path.join(d, 'axe.js')
    open(axe, 'w').write("window.axe={run:function(){return Promise.resolve({violations:[{id:'sahte-kural',impact:'serious',nodes:[{target:['#app']}]}]})}};")
    ra = calistir('--axe', axe)
    assert ra.returncode == 1 and 'sahte-kural' in ra.stdout and 'axe-core ÇALIŞTI' in ra.stdout, ra.stdout[-300:]


@test
async def logo_ve_simge(b):
    """b24: başlık logosu yeni tasarım (lacivert kare, altın para, yuvarlak çubuk); eski logonun renkleri/₺ yok;
    ana ekran simgesi ve favicon geçerli 180×180 PNG, ikisi de aynı dosya."""
    pg = await sayfa(b, 360)
    ozet = await pg.evaluate("""(function(){var s=document.querySelector('header .brand svg');
      var l=[].map.call(document.querySelectorAll('link[rel~=icon],link[rel=apple-touch-icon]'),function(e){return e.href});
      return {vb:s.getAttribute('viewBox'),h:s.outerHTML,w:s.getAttribute('width'),l:l}})()""")
    assert ozet['vb'] == '0 0 120 120' and ozet['w'] == '30', 'başlık logosu 30 px, yeni görünüm kutusu'
    for renk in ('#10263F', '#F4F1EA', '#E8A92B'):
        assert renk in ozet['h'], f'logoda {renk} yok'
    assert '#4FC795' not in ozet['h'] and '₺' not in ozet['h'], 'eski logonun öğeleri kalmış'
    assert len(ozet['l']) == 2 and ozet['l'][0] == ozet['l'][1] and ozet['l'][0].startswith('data:image/png;base64,')
    boyut = await pg.evaluate("""new Promise(function(r){var i=new Image();i.onload=function(){r([i.naturalWidth,i.naturalHeight])};
      i.onerror=function(){r(null)};i.src=document.querySelector('link[rel=icon]').href})""")
    assert boyut == [180, 180], f'simge 180×180 PNG olmalı: {boyut}'
    temiz(pg)


async def ana(filtre):
    sonuclar = []
    async with async_playwright() as p:
        kw = {'executable_path': CHROMIUM} if CHROMIUM else {}
        b = await p.chromium.launch(**kw)
        for f in SONUC:
            if filtre and not any(s in f.ad for s in filtre):
                continue
            t0 = time.time()
            try:
                await f(b)
                sonuclar.append((f.ad, True, '', time.time() - t0))
            except Exception as e:  # noqa: BLE001
                sonuclar.append((f.ad, False, f'{type(e).__name__}: {str(e)[:400]}', time.time() - t0))
        await b.close()
    for ad, ok, hata, sure in sonuclar:
        print(('GEÇTİ ' if ok else 'KALDI ') + f'({sure:5.1f} sn)  {ad}' + ('' if ok else f'\n         -> {hata}'))
    gecen = sum(1 for _, ok, _, _ in sonuclar if ok)
    print(f'\n{gecen}/{len(sonuclar)} test geçti.')
    return 0 if gecen == len(sonuclar) else 1


if __name__ == '__main__':
    sys.exit(asyncio.run(ana(sys.argv[1:])))
