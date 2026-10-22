"""Erişilebilirlik keşif taraması: uygulamanın tüm ekranlarını gezer, her ekranda ölçer.
Bu bir TEST DEĞİL, keşif aracıdır: bulguları sen yorumlarsın. Gerçek telefon ve ekran okuyucu testinin yerini TUTMAZ.

Her ekranda:
  - yatay taşma (görünür öğe ekran genişliğinin dışına çıkıyor mu)
  - adsız düğme/bağlantı/alan
  - küçük dokunma hedefi (< 24 px)
  - tıklanır ama düğme/bağlantı olmayan öğe (role ya da tabindex yok: klavye ve ekran okuyucu erişemez)
  - axe-core kuralları (yalnız --axe verilirse; ağ erişimin olan bir bilgisayarda: npm install axe-core)

Kullanım:
  python erisilebilirlik_taramasi.py                       # 320/360/412 px, açık tema
  python erisilebilirlik_taramasi.py --kisa                # yalnız 360 px (hızlı)
  python erisilebilirlik_taramasi.py --koyu --hareket-azalt --yatay
  python erisilebilirlik_taramasi.py --yazi 0 1 2           # üç yazı boyutunda da tara (b22)
  python erisilebilirlik_taramasi.py --axe node_modules/axe-core/axe.min.js
Çıkış kodu: bulgu yoksa 0, varsa 1 (CI'da kullanılabilir)."""
import argparse
import asyncio
import importlib.util
import os
import sys

KLASOR = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ut', os.path.join(KLASOR, 'uygulama_testleri.py'))
ut = importlib.util.module_from_spec(spec)
sys.modules['ut'] = ut
spec.loader.exec_module(ut)
from playwright.async_api import async_playwright  # noqa: E402

OLCUM = """(function(){
 var out={ov:[],noname:[],small:[],tikla:[]};
 var de=document.documentElement;
 var vw=de.clientWidth;
 function vis(e){var r=e.getBoundingClientRect();var cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&!e.closest('[hidden]')}
 document.querySelectorAll('#app *,#modal *').forEach(function(e){
   if(!vis(e))return;var r=e.getBoundingClientRect();
   if(r.right>vw+1.5&&!e.closest('svg')&&!e.closest('[style*="overflow"]')&&getComputedStyle(e).position!=='fixed'){out.ov.push((e.id||e.className||e.tagName)+':'+Math.round(r.right)+'>'+vw)}
 });
 document.querySelectorAll('button,[role=button],a[href],input,select,textarea,summary').forEach(function(e){
   if(!vis(e))return;
   var name=(e.getAttribute('aria-label')||e.textContent||e.getAttribute('placeholder')||e.getAttribute('title')||'').trim();
   if(e.labels&&e.labels.length)name=name||e.labels[0].textContent.trim();
   if(e.closest('label'))name=name||e.closest('label').textContent.trim();
   if(!name)out.noname.push(e.outerHTML.slice(0,90));
   var r=e.getBoundingClientRect();
   if(e.tagName!=='INPUT'&&(r.width<24||r.height<24)&&getComputedStyle(e).display!=='inline')out.small.push((e.textContent||e.className).trim().slice(0,20)+' '+Math.round(r.width)+'x'+Math.round(r.height));
   if((e.type==='checkbox'||e.type==='radio')&&(r.width<24||r.height<24))out.small.push('checkbox '+Math.round(r.width)+'x'+Math.round(r.height));
 });
 document.querySelectorAll('[data-a],[onclick]').forEach(function(e){
   if(!vis(e))return;
   var t=e.tagName;
   if(/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL|OPTION)$/.test(t))return;
   if(e.getAttribute('role')||e.hasAttribute('tabindex'))return;
   if(e.closest('button,a[href],label'))return;
   out.tikla.push(t.toLowerCase()+'['+(e.getAttribute('data-a')||'onclick')+'] '+(e.textContent||'').trim().slice(0,20));
 });
 return out})()"""

AXE_ETIKETLER = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']


async def olc(pg, ad, sonuc, ayar, axe_js):
    await pg.wait_for_timeout(150)
    r = await pg.evaluate(OLCUM)
    r['axe'] = []
    if axe_js:
        await pg.add_script_tag(content=axe_js)
        ax = await pg.evaluate("axe.run(document,{runOnly:{type:'tag',values:%s}}).then(function(r){return r.violations.map(function(v){return {id:v.id,impact:v.impact,n:v.nodes.length,hedef:(v.nodes[0]&&v.nodes[0].target||[]).join(' ').slice(0,80)}})})" % str(AXE_ETIKETLER))
        r['axe'] = [f"{v['id']} ({v['impact']}, {v['n']} öğe) {v['hedef']}" for v in ax]
    sonuc.append((ayar, ad, r))


async def akis(b, ayar, axe_js):
    w, lv, koyu, hareket, yatay = ayar
    sonuc = []
    ctx = await b.new_context(viewport={'width': (740 if yatay else w), 'height': (360 if yatay else 700)}, device_scale_factor=2,
                              color_scheme='dark' if koyu else 'light', reduced_motion='reduce' if hareket else 'no-preference', accept_downloads=True)
    if lv:
        await ctx.add_init_script(f"try{{localStorage.setItem('ilklot:fs','{lv}')}}catch(e){{}}")
    pg = await ctx.new_page()
    pg.hatalar = []
    pg.on('pageerror', lambda e: pg.hatalar.append(str(e)))
    await pg.goto(ut.URL)
    await pg.wait_for_function('typeof S!=="undefined"&&S.stage!=="boot"', timeout=15000)
    O = lambda ad: olc(pg, ad, sonuc, ayar, axe_js)  # noqa: E731
    await O('onam')
    kod = await ut.kod_sec(pg, 'A')
    await pg.check('[data-in=consentOk]')
    await pg.click('[data-a=consent]')
    await O('kod')
    await pg.fill('#ci', kod)
    await pg.click('[data-a=code]')
    await pg.wait_for_function('S.stage==="demo"', timeout=8000)
    await O('form')
    await pg.click('[data-a=dm][data-v="adult|0"]')
    await pg.click('[data-a=demoDone]')
    await O('ön test girişi')
    await pg.click('[data-a=testStart]')
    await O('ön test sorusu')
    for j in (0, 2, 2, 1, 0, 1, 1):
        await pg.click(f'[data-a=tans][data-v="{j}"]')
    await O('tanıtım')
    await pg.click('[data-a=introDone]')
    await pg.evaluate(ut.TURU_ATLA)
    await O('alıştırma')
    for _ in range(2):
        await pg.click('[data-a=choose][data-v=tut]')
        await O('alıştırma sonucu')
        await pg.click('[data-a=next]')
    await O('anlama kontrolü')
    for _ in range(3):
        await pg.click(f'[data-a=quiz][data-v="{await pg.evaluate("compQ(S.comp.i).a")}"]')
        await pg.click('[data-a=quizNext]')
    await pg.click('[data-a=startMain]')
    await O('karar')
    await pg.click('[data-a=choose][data-v=tut]')
    await O('karar sonucu')
    await pg.click('[data-a=next]')
    await pg.evaluate('ACT.menu()')
    await O('menü penceresi')
    await pg.evaluate('ACT.mCancel()')
    await pg.evaluate('ACT.help()')
    await O('sözlük penceresi')
    await pg.evaluate('ACT.mCancel()')
    for _ in range(5):
        await pg.click('[data-a=choose][data-v=tut]')
        await pg.click('[data-a=next]')
    await O('köprü / gerginlik')
    for _ in range(3):
        if await pg.evaluate('S.stage') == 'stress':
            await pg.click('[data-a=stress][data-v="2"]')
            await O('gerginlik sonrası')
    await O('simülatör öncesi')
    await ut.sim_baslat(pg)
    await pg.evaluate(ut.TURU_ATLA)
    await pg.evaluate('while(S.sim.tick<80){simStep()}simLive()')
    await O('simülatör portföy')
    await pg.evaluate("ACT.simDetail('TUPRS')")
    await O('simülatör hisse detayı')
    await pg.evaluate("ACT.term&&ACT.term('lot')")
    await O('terim açıklaması')
    await pg.evaluate('ACT.mCancel()')
    await pg.click('[data-a=simOpen][data-v="TUPRS|S"]')
    await O('simülatör işlem penceresi')
    await pg.click('[data-a=simQty][data-v=max]')
    await pg.click('[data-a=simGo]')
    await O('satış gerekçesi')
    await pg.evaluate('ACT.mCancel()')
    # Serbest mod (b19): çalışma bitiş ekranından açılır; burada doğrudan açılır
    await pg.evaluate("S.stage='end';ACT.freeOpen()")
    await O('serbest mod: zorluk seçimi')
    await pg.click('[data-a=freeLvl][data-v=z]')
    await pg.click('[data-a=freeSc][data-v=y]')
    await pg.click('[data-a=freePf][data-v=h]')
    await pg.click('[data-a=freeLim][data-v="0.5"]')
    await O('serbest mod: seçimler')
    await pg.click('[data-a=freeStart]')
    await pg.evaluate('while(S.sim.tick<60){simStep()}simLive()')
    await O('serbest mod: portföy')
    await pg.evaluate("ACT.simDetail('TUPRS')")
    await pg.click('[data-a=freeOrder][data-v="TUPRS|stop|0.1"]')
    await O('serbest mod: hisse detayı ve otomatik emir')
    await pg.evaluate('ACT.simBack()')
    await O('serbest mod: portföy (emir etiketi)')
    await pg.evaluate("ACT.simTab('m')")
    await O('serbest mod: piyasa')
    await pg.evaluate("ACT.simTab('p');ACT.freeQuit()")
    await O('serbest mod: bitirme onayı')
    await pg.evaluate('ACT.mCancel();ACT.freeEnd()')
    await O('serbest mod: sonuç')
    hatalar = pg.hatalar
    await ctx.close()
    return sonuc, hatalar


async def ana(a):
    axe_js = open(a.axe, encoding='utf-8').read() if a.axe else None
    genislikler = [360] if a.kisa else a.genislik
    seviyeler = a.yazi  # yazı boyutu seviyeleri: 0 normal, 1 büyük, 2 çok büyük (b22)
    ayarlar = [(w, lv, a.koyu, a.hareket_azalt, a.yatay) for w in ([740] if a.yatay else genislikler) for lv in seviyeler]
    hepsi, js_hatalari = [], []
    async with async_playwright() as p:
        kw = {'executable_path': ut.CHROMIUM} if ut.CHROMIUM else {}
        b = await p.chromium.launch(**kw)
        for ay in ayarlar:
            try:
                s, h = await akis(b, ay, axe_js)
                hepsi += s
                js_hatalari += [(ay, x) for x in h]
            except Exception as e:  # noqa: BLE001
                print('TARAMA HATASI', ay, type(e).__name__, str(e)[:200])
                js_hatalari.append((ay, 'tarama yarıda kaldı: ' + str(e)[:100]))
        await b.close()
    ozet = {}
    for ay, ad, r in hepsi:
        for k in ('ov', 'noname', 'small', 'tikla', 'axe'):
            for x in r[k]:
                ozet.setdefault((k, ad, x), set()).add(ay[:2])
    etiket = dict(ov='YATAY TAŞMA', noname='ADSIZ ÖĞE', small='KÜÇÜK HEDEF', tikla='TIKLANIR AMA DÜĞME DEĞİL', axe='AXE')
    for (k, ad, x), v in sorted(ozet.items()):
        print(f'{etiket[k]:26s} | {ad} | {x} | {sorted(v)[:4]}{"…" if len(v) > 4 else ""}')
    for ay, h in js_hatalari:
        print('SAYFA HATASI', ay, h)
    print(f"\n{len(hepsi)} ekran ölçüldü ({len(ayarlar)} ayar){'; axe-core ÇALIŞTI' if axe_js else '; axe-core çalışmadı (--axe verilmedi)'}. "
          f"{len(ozet)} farklı bulgu, {len(js_hatalari)} sayfa hatası.")
    return 0 if not ozet and not js_hatalari else 1


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='İlk Lot erişilebilirlik keşif taraması')
    ap.add_argument('--genislik', type=int, nargs='+', default=[320, 360, 412])
    ap.add_argument('--kisa', action='store_true', help='yalnız 360 px')
    ap.add_argument('--yazi', type=int, nargs='+', default=[0], choices=[0, 1, 2], help='yazı boyutu: 0 normal, 1 büyük, 2 çok büyük (birden fazla verilebilir)')
    ap.add_argument('--koyu', action='store_true')
    ap.add_argument('--hareket-azalt', action='store_true')
    ap.add_argument('--yatay', action='store_true', help='yatay telefon (740×360)')
    ap.add_argument('--axe', metavar='AXE.MIN.JS', help='axe-core betiğinin yolu (npm install axe-core)')
    sys.exit(asyncio.run(ana(ap.parse_args())))
