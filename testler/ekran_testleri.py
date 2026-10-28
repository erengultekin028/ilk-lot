"""İlk Lot tarayıcı uçtan uca testleri (yeni yapı: public/ + ES modülleri).

Çalıştırma:  python testler/ekran_testleri.py     (Playwright + Chromium gerekir: pip install playwright; python -m playwright install chromium)
  CHROMIUM=<yol>  isteğe bağlı: sistemdeki bir Chromium'u kullanır.

Güvenlik: Firebase SDK isteklerini keser; GERÇEK VERİTABANINA HİÇBİR ŞEY YAZILMAZ ve okunmaz. Katılım akışı (yuva alma) bu testlerin
kapsamı DIŞINDADIR; o akış kurallar emulator testleri (firebase/kural_testleri) ve gerçek cihaz testi (docs/GERCEK_CIHAZ_TESTI.md) ile denenir.
Ekranlar uygulamanın kendi durum nesnesiyle (window.ilkLot) kurulur; yazma çağrıları gerektiğinde sahtesiyle değiştirilir.
Bu testler, b27 yeniden adlandırmasından kalan hataları (bekleme geri sayımı, tur, canlı toplam) yakalamak için yazıldı.
"""
import json
import os
import socket
import subprocess
import sys
import time

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sonuclar = []


def test(ad):
    def sarmal(f):
        sonuclar.append((ad, f))
        return f
    return sarmal


# ───────── ortak yardımcılar ─────────
def bos_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port


def sunucu_baslat():
    port = bos_port()
    surec = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--directory', os.path.join(KOK, 'public'), '--bind', '127.0.0.1'],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try:
            socket.create_connection(('127.0.0.1', port), timeout=0.2).close()
            return surec, f'http://127.0.0.1:{port}'
        except OSError:
            time.sleep(0.1)
    surec.kill()
    raise RuntimeError('yerel sunucu başlamadı')


class Ortam:
    def __init__(self, p, taban):
        self.p = p
        self.taban = taban
        yol = os.environ.get('CHROMIUM')
        self.tarayici = p.chromium.launch(executable_path=yol) if yol else p.chromium.launch()
        self.baglamlar = []

    def temizle(self):
        """Açık tarayıcı bağlamlarını kapatır (uzun testlerde kaynak tükenmesin)."""
        for baglam in self.baglamlar:
            try:
                baglam.close()
            except Exception:  # noqa: BLE001 (zaten kapanmış olabilir)
                pass
        self.baglamlar = []

    def sayfa(self, genislik=1280, yukseklik=800, yol='/', mobil=False):
        """Yeni, temiz bir sayfa açar; Firebase SDK'sı kesilir; sayfa hataları toplanır (sayfa.hatalar)."""
        ctx = self.tarayici.new_context(viewport={'width': genislik, 'height': yukseklik}, color_scheme='dark', locale='tr-TR',
                                        is_mobile=mobil, has_touch=mobil, accept_downloads=True)
        self.baglamlar.append(ctx)
        ctx.route('**/gstatic.com/**', lambda r: r.abort())
        ctx.route('**/googleapis.com/**', lambda r: r.abort())
        sayfa = ctx.new_page()
        sayfa.hatalar = []
        sayfa.on('pageerror', lambda e: sayfa.hatalar.append(str(e)))
        for deneme in (1, 2):  # makine yüklüyken sayfa yüklemesi ara sıra zaman aşımına uğrar: bir kez yeniden dene
            try:
                sayfa.goto(self.taban + yol)
                if yol == '/':
                    sayfa.wait_for_function('window.ilkLot && ["connection-error","consent","welcome"].includes(window.ilkLot.state.stage)', timeout=30000)
                    time.sleep(1.5)  # bağlantı akışı oturmadan durumu zorlamak sonradan ezilir
                else:
                    sayfa.wait_for_selector('.admin-title', timeout=30000)
                break
            except PlaywrightTimeoutError:
                if deneme == 2:
                    raise
        return sayfa

    def kapat(self):
        self.tarayici.close()


def simulator_kur(sayfa, grup='A', gun=80, sekme='p'):
    sayfa.evaluate("""([grup, gun, sekme]) => {
      const k = window.ilkLot, st = k.state;
      st.group = grup; st.setOrder = 0; st.phase = 'sim'; st.block = 'sim'; st.practice = null; st.freePlay = null; st.seenTourSteps = {};
      st.tour = null; st.detailSymbol = null;
      k.initSimulation(); for (let i = 0; i < gun; i++) k.stepSimulation();
      st.stage = 'sim'; st.marketTab = sekme; k.render(); k.updateSimulatorLive();
    }""", [grup, gun, sekme])
    time.sleep(0.4)


def hata_yok(sayfa):
    assert not sayfa.hatalar, f'sayfa hataları: {sayfa.hatalar}'


# ───────── katılımcı uygulaması ─────────
@test('Açılış: sayfa hatasız yüklenir, onam ya da bağlantı ekranı gelir, Firebase kesikken uygulama çökmez')
def _(o):
    s = o.sayfa()
    assert s.evaluate('window.ilkLot.state.stage') in ('connection-error', 'consent', 'welcome')
    assert 'İlk Lot' in s.inner_text('header')
    hata_yok(s)


@test('Onam ekranı: başlık, üç özet kutusu ve açılır ayrıntılar görünür')
def _(o):
    s = o.sayfa()
    s.evaluate("() => { const k = window.ilkLot; k.state.stage = 'consent'; k.render(); }")
    metin = s.inner_text('#main-view')
    for parca in ('Katılmadan önce', 'Yaklaşık 30 dakika', 'Kimliksiz', 'Gönüllüsün', 'Araştırmanın amacı'):
        assert parca in metin, parca
    hata_yok(s)


@test('Bekleme ekranı (A grubu): zararına satışta 10 sn geri sayım ilerler, bitince onay düğmesi açılır; vazgeçilebilir')
def _(o):
    s = o.sayfa()
    simulator_kur(s, 'A')
    s.evaluate("""() => { const a = window.ilkLot.actions; a.openTradeWindow('KOZAL|S'); a.setTradeQuantity('max'); a.submitTrade(); a.chooseSellReason('0'); }""")
    time.sleep(0.4)
    ilk = int(s.inner_text('#cooldown-number'))
    assert ilk >= 9, ilk
    assert s.evaluate("document.getElementById('cooldown-confirm').disabled") is True
    time.sleep(2.3)
    sonra = int(s.inner_text('#cooldown-number'))
    assert sonra < ilk, f'geri sayım ilerlemedi: {ilk} -> {sonra}'
    s.wait_for_function("document.getElementById('cooldown-number').textContent === '0'", timeout=15000)
    assert s.evaluate("document.getElementById('cooldown-confirm').disabled") is False
    hata_yok(s)


@test('Bekleme ekranı: vazgeç düğmesi pencereyi işlem penceresine döndürür ve satış yapılmaz')
def _(o):
    s = o.sayfa()
    simulator_kur(s, 'A')
    kalan = s.evaluate("""() => { const k = window.ilkLot, a = k.actions; const onceki = k.state.simulation.pos.KOZAL.q;
      a.openTradeWindow('KOZAL|S'); a.setTradeQuantity('max'); a.submitTrade(); a.chooseSellReason('0'); a.cancelCooldown();
      return [onceki, k.state.simulation.pos.KOZAL.q, !!document.getElementById('cooldown-number')]; }""")
    assert kalan[0] == kalan[1] and kalan[2] is False, kalan


@test('B grubu: zararına satışta bekleme ekranı çıkmaz, satış yapılır')
def _(o):
    s = o.sayfa()
    simulator_kur(s, 'B')
    r = s.evaluate("""() => { const k = window.ilkLot, a = k.actions; const onceki = k.state.simulation.pos.KOZAL.q;
      a.openTradeWindow('KOZAL|S'); a.setTradeQuantity('max'); a.submitTrade(); a.chooseSellReason('0');
      return [onceki, k.state.simulation.pos.KOZAL.q, !!document.getElementById('cooldown-number')]; }""")
    assert r[2] is False and r[1] < r[0], r
    hata_yok(s)


@test('Simülatör: portföy toplamı, hisseler, nakit ve gün sayacı canlı güncellenir')
def _(o):
    s = o.sayfa()
    simulator_kur(s, 'B')
    kimlikler = ('portfolio-value', 'invested-value', 'day-counter')
    once = {k: s.inner_text('#' + k) for k in kimlikler}
    s.evaluate("() => { const k = window.ilkLot; for (let i = 0; i < 6; i++) k.stepSimulation(); k.updateSimulatorLive(); }")
    sonra = {k: s.inner_text('#' + k) for k in kimlikler}
    # Her gösterge TEK TEK değişmeli (biri eski kimlikle aranırsa yalnızca o durur)
    for k in kimlikler:
        assert once[k] != sonra[k], f'{k} güncellenmedi: {once[k]} -> {sonra[k]}'
    assert sonra['day-counter'] == '86 / 300' and s.inner_text('#cash-value').startswith('₺')


@test('Simülatör: Piyasa sekmesinde altı hisse kartı dolu; Analiz sekmesi çizilir; hisse ayrıntısı grafik ve işlem düğmeleri taşır')
def _(o):
    s = o.sayfa()
    simulator_kur(s, 'B', sekme='m')
    kartlar = s.evaluate("[...document.querySelectorAll('.market-card')].map(e => e.textContent.trim().length)")
    assert len(kartlar) == 6 and all(n > 20 for n in kartlar), kartlar
    simulator_kur(s, 'B', sekme='a')
    assert 'İşlem geçmişi' in s.inner_text('#main-view')
    s.evaluate("() => { const k = window.ilkLot; k.state.marketTab = 'p'; k.state.detailSymbol = 'PGSUS'; k.render(); k.updateSimulatorLive(); }")
    assert s.evaluate("!!document.querySelector('#detail-chart svg')")
    assert s.evaluate("[...document.querySelectorAll('.detail-actions button')].length") == 2
    hata_yok(s)


@test('Hisse grafiği: fareyle gezme doğru günü gösterir (fiyat ekseni payı hesaba katılır)')
def _(o):
    s = o.sayfa(1440, 900)
    simulator_kur(s, 'B')
    s.evaluate("() => { const k = window.ilkLot; k.state.detailSymbol = 'PGSUS'; k.render(); k.updateSimulatorLive(); }")
    kutu = s.evaluate("(() => { const e = document.querySelector('#detail-chart svg').getBoundingClientRect(); return [e.left, e.top, e.width, e.height]; })()")
    x = kutu[0] + kutu[2] * 0.855 * 0.5
    y = kutu[1] + kutu[3] / 2
    s.mouse.move(x - 30, y)
    s.mouse.move(x, y, steps=4)
    time.sleep(0.4)
    etiket = s.evaluate("(document.getElementById('scrub-label') || {}).textContent")
    gun = s.evaluate('window.ilkLot.state.scrubDay')
    # Çizim alanı grafiğin %85,5'idir; imleç alanın tam ortasında (30 günün 15. noktası) olduğundan gün 66 beklenir (eksen payı hesaba katılmazsa 63 çıkar)
    assert etiket and etiket.startswith('Gün ') and gun is not None and 65 <= gun <= 67, (etiket, gun)


@test('Rehberli tur: simülatörde 6, alıştırma karar ekranında en az 3 adım başlar ve öğeleri vurgular')
def _(o):
    s = o.sayfa()
    simulator_kur(s, 'B', gun=10)
    assert s.evaluate('window.ilkLot.state.tour && window.ilkLot.state.tour.steps.length') == 6
    assert s.evaluate("document.querySelectorAll('.highlight').length") >= 1
    s.evaluate("""() => { const st = window.ilkLot.state; st.tour = null; st.seenTourSteps = {}; st.group = 'A'; st.stage = 'task'; st.practice = null; st.freePlay = null;
      st.trial = { mode: 'practice', i: 0, phase: 'choose', t0: Date.now(), first: null }; window.ilkLot.render(); }""")
    assert s.evaluate('window.ilkLot.state.tour && window.ilkLot.state.tour.steps.length') >= 3
    assert s.evaluate("document.querySelectorAll('.highlight').length") >= 1
    hata_yok(s)


@test('Karar anı ekranı: grafik, pozisyon ve üç seçenek (Sat, Tut, Daha al) görünür')
def _(o):
    s = o.sayfa()
    s.evaluate("""() => { const k = window.ilkLot, st = k.state; st.group = 'A'; st.setOrder = 0; st.phase = 'pre'; st.block = 'pre'; st.trialIndex = 0; st.decisions = [];
      st.stage = 'task'; st.trial = { mode: 'main', i: 0, phase: 'choose', t0: Date.now(), first: null }; k.render(); }""")
    metin = s.inner_text('#main-view')
    for parca in ('Sat', 'Tut', 'Daha al', 'Elindeki hisse'):
        assert parca in metin, parca
    assert s.evaluate("!!document.querySelector('#tour-chart svg')")


@test('Çekilme: ilk onaydan sonra çekilme yazılmaz, ikinci pencerede "Emin misin?" çıkar; vazgeçilirse kayıt değişmez')
def _(o):
    s = o.sayfa()
    r = s.evaluate("""async () => {
      const k = window.ilkLot, st = k.state, cagri = [];
      k.participantRepository.withdraw = async (kod) => { cagri.push(kod); };   // gerçek yazma yok
      st.participantCode = 'TEST-0000'; st.group = 'A'; st.stage = 'sim'; st.phase = 'sim'; k.initSimulation(); k.render();
      const baslik = () => (document.querySelector('#modal-box h2') || {}).textContent;
      const bekle = () => new Promise(x => setTimeout(x, 60));
      const out = {};
      k.actions.requestWithdraw(); out.b1 = baslik();
      k.actions.confirmModal(); await bekle(); out.b2 = baslik(); out.cagri1 = cagri.length;
      k.actions.cancelModal(); await bekle(); out.cagri2 = cagri.length; out.stage2 = st.stage;
      k.actions.requestWithdraw(); k.actions.confirmModal(); await bekle(); k.actions.confirmModal(); await bekle();
      out.cagri3 = cagri.length; out.stage3 = st.stage;
      return out; }""")
    assert r['b1'] == 'Çalışmadan çekil' and r['b2'] == 'Emin misin?', r
    assert r['cagri1'] == 0 and r['cagri2'] == 0 and r['stage2'] == 'sim', r
    assert r['cagri3'] == 1 and r['stage3'] == 'withdrawn', r


@test('Çekildin ekranı: gönüllü çekilmede "Yeni katılım başlat" görünür; 18 yaş altı kayıtta görünmez ve eylem çalışmaz; onaylanınca sayfa yenilenir, eski kuyruk anahtarları silinir, tema kalır')
def _(o):
    s = o.sayfa()
    metin = "document.getElementById('main-view').innerText"

    def goster(ineligible):
        s.evaluate("(i) => { const k = window.ilkLot; k.state.withdrawnIneligible = i; k.state.stage = 'withdrawn'; k.render(); }", ineligible)

    goster(False)
    assert 'Yeni katılım başlat' in s.evaluate(metin) and 'Çalışmadan çekildin' in s.evaluate(metin)
    goster(True)
    assert 'Yeni katılım başlat' not in s.evaluate(metin) and 'Çalışmadan çekildin' in s.evaluate(metin)
    s.evaluate("() => window.ilkLot.actions.requestFreshStart()")
    assert s.evaluate("document.getElementById('modal').classList.contains('is-open')") is False, '18 yaş altı kayıtta yeni katılım penceresi açılmamalı'
    goster(False)
    s.evaluate("() => { localStorage.setItem('ilklot:q:ESKI', '[1]'); localStorage.setItem('ilklot:evn:ESKI', '5'); localStorage.setItem('ilklot:theme', 'dark'); }")
    s.evaluate("() => window.ilkLot.actions.requestFreshStart()")
    assert s.evaluate("document.querySelector('#modal-box h2').textContent") == 'Yeni katılım başlat'
    with s.expect_navigation(timeout=30000):
        s.evaluate("() => window.ilkLot.actions.confirmModal()")
    s.wait_for_function('window.ilkLot && ["connection-error","consent","welcome"].includes(window.ilkLot.state.stage)', timeout=30000)
    anahtarlar = s.evaluate('Object.keys(localStorage)')
    assert not [k for k in anahtarlar if k.startswith('ilklot:q:') or k.startswith('ilklot:evn:')], anahtarlar
    assert 'ilklot:theme' in anahtarlar, 'tema tercihi korunmalı'


@test('Eşzamanlama göstergesi: kuyruk boşken yeşil nokta (hata sınıfı yok)')
def _(o):
    s = o.sayfa()
    simulator_kur(s, 'B')
    sinif = s.evaluate("document.getElementById('sync-dot').className")
    assert 'is-offline' not in sinif and 'is-error' not in sinif and 'is-pending' not in sinif, sinif


@test('Geniş ekran (1440): uygulama pencereyi kaplar; iki sütun düzeni kurulur; hiçbir sekmede (portföy, piyasa, analiz, hisse) kart kesilmez')
def _(o):
    s = o.sayfa(1440, 800)
    simulator_kur(s, 'B')
    r = s.evaluate("""() => { const a = document.getElementById('app').getBoundingClientRect(); const mv = document.getElementById('main-view');
      return { genislik: a.width, yukseklik: a.height, sutun: getComputedStyle(mv).gridTemplateColumns.split(' ').length,
      tasma: document.documentElement.scrollWidth - innerWidth }; }""")
    assert r['genislik'] == 1440 and r['yukseklik'] == 800, r
    assert r['sutun'] == 2 and r['tasma'] <= 0, r
    kesik_olcum = """() => [...document.querySelectorAll('#main-view .card-section')]
      .filter(e => e.getBoundingClientRect().height < e.scrollHeight - 2)
      .map(e => (e.id || (e.querySelector('h3') || {}).textContent || 'kart') + ':' + Math.round(e.getBoundingClientRect().height) + '<' + e.scrollHeight)"""
    for sekme, detay in (('p', None), ('m', None), ('a', None), ('p', 'PGSUS')):
        s.evaluate("""([sekme, detay]) => { const k = window.ilkLot; k.state.marketTab = sekme; k.state.detailSymbol = detay; k.render(); k.updateSimulatorLive(); }""", [sekme, detay])
        time.sleep(0.3)
        kesik = s.evaluate(kesik_olcum)
        assert not kesik, f'{sekme}/{detay}: kesilen kartlar {kesik}'


@test('Telefon (390): yatay taşma yok, uygulama 460 px sınırında kalır')
def _(o):
    s = o.sayfa(390, 844, mobil=True)
    simulator_kur(s, 'B')
    assert s.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0
    assert s.evaluate("document.getElementById('app').getBoundingClientRect().width") <= 390


@test('Portföy paneli (1440, b39): solda özet ve halka grafik, sağda hisse tablosu; hisse kutusu ve pay çubuğu dolu; telefonda bu öğeler gizli')
def _(o):
    s = o.sayfa(1440, 900)
    simulator_kur(s, 'B')
    r = s.evaluate("""() => {
      const q = (x) => document.querySelector(x), kutu = (x) => q(x).getBoundingClientRect();
      const hero = kutu('#main-view > .hero'), dag = kutu('#allocation-section'), liste = kutu('#stock-list');
      const dilim = document.querySelectorAll('.allocation-donut circle').length;
      const yasenda = [...document.querySelectorAll('.allocation-legend span')].length;
      const nakit = parseInt(document.querySelector('.allocation-legend span:last-child').textContent.replace(/\\D/g, ''), 10);
      const satirlar = [...document.querySelectorAll('.stock-row')].map(x => ({
        harf: x.querySelector('.stock-avatar').textContent, gorunur: getComputedStyle(x.querySelector('.stock-avatar')).display !== 'none',
        pay: parseFloat(x.querySelector('.weight-bar i').style.width) }));
      return { solSag: hero.right <= liste.left && dag.right <= liste.left, ayniSutun: Math.abs(hero.left - dag.left) < 1,
               bitisik: dag.top - hero.bottom, dilim, yasenda, merkez: document.querySelector('.donut-center b').textContent, nakit,
               gunCubugu: document.getElementById('day-bar-fill').style.width, satirlar };
    }""")
    assert r['solSag'] and r['ayniSutun'], r
    assert 0 <= r['bitisik'] <= 30, f"özet ve dağılım kartı arası açılmış (kart gerilmiş): {r['bitisik']}"
    assert r['dilim'] == r['yasenda'], r
    assert r['merkez'] == f"%{100 - r['nakit']}", r
    assert r['gunCubugu'] == '27%', r['gunCubugu']
    assert len(r['satirlar']) == 6 and all(x['gorunur'] and len(x['harf']) == 2 and x['pay'] > 0 for x in r['satirlar']), r['satirlar']
    hata_yok(s)
    t = o.sayfa(390, 844, mobil=True)
    simulator_kur(t, 'B')
    gizli = t.evaluate("""() => ['.allocation-donut', '.stock-avatar', '.weight-bar', '.day-bar']
      .map(x => [x, getComputedStyle(document.querySelector(x)).display])""")
    assert all(d == 'none' for _, d in gizli), gizli


UST_USTE_OLCUM = """() => {
  const mv = document.getElementById('main-view'), kutular = [];
  for (const c of mv.children) { if (getComputedStyle(c).display === 'contents') kutular.push(...c.children); else kutular.push(c); }
  const gorunur = kutular.filter(c => { const b = c.getBoundingClientRect(); return b.height > 1 && b.width > 1 && getComputedStyle(c).visibility !== 'hidden'; });
  const ad = c => c.id || c.className || c.tagName, bin = [];
  gorunur.forEach((a, i) => gorunur.slice(i + 1).forEach(b => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect();
    if (p.bottom > q.top + 1 && q.bottom > p.top + 1 && p.right > q.left + 1 && q.right > p.left + 1) bin.push(ad(a) + ' x ' + ad(b)); }));
  return { bin, sol: gorunur.filter(c => c.classList.contains('side-summary')).map(c => Math.round(c.getBoundingClientRect().left) + ':' + Math.round(c.getBoundingClientRect().width)) };
}"""


@test('Geniş ekran panelleri (b40): Portföy, Piyasa, Analiz ve hisse ayrıntısı (normal ve serbest mod) aynı iskelette; kartlar üst üste binmez; sol özet toplam parayla uyuşur; telefonda gizli')
def _(o):
    s = o.sayfa(1440, 900)
    simulator_kur(s, 'B')
    genislikler = set()
    for sekme, detay in (('p', None), ('m', None), ('a', None), ('p', 'PGSUS')):
        s.evaluate("""([sekme, detay]) => { const k = window.ilkLot; k.state.marketTab = sekme; k.state.detailSymbol = detay; k.render(); k.updateSimulatorLive(); }""", [sekme, detay])
        time.sleep(0.3)
        r = s.evaluate(UST_USTE_OLCUM)
        assert not r['bin'], f'{sekme}/{detay}: üst üste binen kartlar {r["bin"]}'
        if sekme != 'p' or detay:
            assert len(r['sol']) == 1, f'{sekme}/{detay}: sol özet kartı yok ya da birden fazla: {r["sol"]}'
            genislikler.add(r['sol'][0])
            # Sol özet, Portföy'deki büyük toplam para ile aynı sayıyı göstermeli
            yan = s.evaluate("() => document.getElementById('side-total').textContent")
            s.evaluate("() => { const k = window.ilkLot; k.state.marketTab = 'p'; k.state.detailSymbol = null; k.render(); k.updateSimulatorLive(); }")
            ana = s.evaluate("() => document.getElementById('portfolio-value').textContent")
            assert yan == ana, f'{sekme}/{detay}: sol özet {yan} ≠ portföy {ana}'
            s.evaluate("""([sekme, detay]) => { const k = window.ilkLot; k.state.marketTab = sekme; k.state.detailSymbol = detay; k.render(); k.updateSimulatorLive(); }""", [sekme, detay])
    assert len(genislikler) == 1, f'sol sütun sekmeler arasında kayıyor: {genislikler}'
    # Serbest mod: ek paneller (kayıp sınırı, hız, otomatik sat emri) kartları bozmasın
    s.evaluate("() => { const k = window.ilkLot; k.state.stage = 'end'; k.state.freePlay = null; k.actions.openFreePlay(); k.actions.startFreePlay(); k.state.seenTourSteps = { sim: 1 }; k.state.tour = null; for (let i = 0; i < 40; i++) k.stepSimulation(); }")
    for sekme, detay in (('p', None), ('m', None), ('a', None), ('p', 'KOZAL')):
        s.evaluate("""([sekme, detay]) => { const k = window.ilkLot; k.state.marketTab = sekme; k.state.detailSymbol = detay; k.render(); k.updateSimulatorLive(); }""", [sekme, detay])
        time.sleep(0.3)
        r = s.evaluate(UST_USTE_OLCUM)
        assert not r['bin'], f'serbest mod {sekme}/{detay}: üst üste binen kartlar {r["bin"]}'
    hata_yok(s)
    t = o.sayfa(390, 844, mobil=True)
    simulator_kur(t, 'B')
    t.evaluate("() => { const k = window.ilkLot; k.state.marketTab = 'm'; k.render(); k.updateSimulatorLive(); }")
    assert t.evaluate("getComputedStyle(document.querySelector('.side-summary')).display") == 'none'


@test('Yazı tipleri (b39): Manrope ve sayılar için Inter dosyadan yüklenir (dış sunucu yok); ₺ ve Türkçe harfler var; rakamlar sabit genişlikli')
def _(o):
    s = o.sayfa(1440, 900)
    simulator_kur(s, 'B')
    r = s.evaluate("""async () => {
      const css = await Promise.all([...document.styleSheets].filter(x => x.href).map(x => fetch(x.href).then(y => y.text())));
      const disStil = css.join('\\n').match(/@import|googleapis|gstatic|url\\(\\s*['"]?https?:/gi) || [];
      const disIstek = performance.getEntriesByType('resource').map(e => e.name).filter(n => /fonts\\.g(oogleapis|static)/.test(n));
      await document.fonts.load('700 20px "Manrope"', 'ğüşıİç'); await document.fonts.load('700 20px "Ilk Lot Sayi"', '₺0123456789%');
      const olc = (m) => { const e = document.createElement('span'); e.style.cssText = 'position:absolute;visibility:hidden;font:700 20px var(--fb);font-variant-numeric:tabular-nums';
        e.textContent = m; document.body.appendChild(e); const w = e.getBoundingClientRect().width; e.remove(); return w; };
      return { manrope: document.fonts.check('700 20px "Manrope"', 'ğüşıİç'), sayi: document.fonts.check('700 20px "Ilk Lot Sayi"', '₺0123456789%'),
               aile: getComputedStyle(document.querySelector('.hero-value')).fontFamily, bir: olc('1111'), sekiz: olc('8888'),
               kayitli: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')), disStil, disIstek };
    }""")
    assert r['manrope'] and r['sayi'], r
    assert 'Ilk Lot Sayi' in r['aile'] and 'Manrope' in r['aile'] and 'Bricolage' not in r['aile'], r['aile']
    assert abs(r['bir'] - r['sekiz']) < 0.5, f"rakamlar sabit genişlikli değil: {r['bir']} / {r['sekiz']}"
    assert {'Manrope', 'Ilk Lot Sayi'} <= set(r['kayitli']), r['kayitli']
    assert not r['disStil'] and not r['disIstek'], f"dış yazı tipi sunucusu: {r['disStil']} {r['disIstek']}"


# ───────── yönetim paneli ─────────
def yonetim_kur(sayfa):
    """Sahte araştırmacı oturumu ve sahte veri: gerçek Firebase'e dokunulmaz."""
    sayfa.evaluate("""async () => {
      const st = await import('/src/admin/admin-state.js');
      const repo = await import('/src/admin/admin-repository.js');
      const sh = await import('/src/admin/admin-shell.js');
      st.adminState.user = { email: 'arastirmaci@ornek.edu' };
      const { APP_VERSION } = await import('/src/constants/app-config.js');   // "eski sürüm" hesabı sürüm artınca bozulmasın
      const mk = (code, grp, ver, ended, cd, ek) => Object.assign({ code, grp, lastVersion: ver, updatedAt: '2026-10-25T14:10:00Z', sess_1: { ended, cd: cd ? { n: cd } : undefined } }, ek || {});
      const belgeler = [ mk('AAAA-1111', 'A', '2026.10.25-b27', false, 3), mk('BBBB-2222', 'B', '2026.10.25-b28', true, 0, { withdrawn: true }), mk('CCCC-3333', 'A', APP_VERSION, true, 1), mk('DDDD-4444', 'B', APP_VERSION, false) ];
      window.__yazilan = [];
      repo.adminRepository.listParticipants = async () => JSON.parse(JSON.stringify(belgeler));
      repo.adminRepository.listAllocations = async () => Object.fromEntries(belgeler.map((d, i) => [d.code, { no: i + 1, grp: d.grp }]));
      repo.adminRepository.listEvents = async (kod) => [{ type: 'session_start', n: 1, code: kod }];
      repo.adminRepository.updateParticipants = async (plan) => { window.__yazilan.push(plan); plan.forEach(i => Object.assign(belgeler.find(d => d.code === i.code), i.fields)); };
      try { localStorage.removeItem('ilklot:whatsNewSeen'); } catch (e) {}
      sh.render();
    }""")
    time.sleep(0.4)


@test('Yönetim girişi: giriş formu çizilir ve katılımcı kodu yönetim koduna bağlanmaz')
def _(o):
    s = o.sayfa(yol='/admin/')
    assert s.evaluate("!!document.querySelector('#admin-email, .note, input')") is True
    hata_yok(s)
    uygulama = o.sayfa()
    assert uygulama.evaluate("document.documentElement.outerHTML.includes('admin-main')") is False


@test('Yönetim paneli: tüm bölümler (Yeni eklenenler, Test kayıtları, Tam yedek) görünür ve "Yeni" rozeti taşır; kart kapatılınca kalkar')
def _(o):
    s = o.sayfa(1440, 900, yol='/admin/')
    yonetim_kur(s)
    metin = s.inner_text('#main-view')
    for parca in ('Yeni eklenenler', 'Test kayıtları', 'Tam yedek (JSON)', 'Canlı pano', 'Randomizasyon listesi'):
        assert parca in metin, parca
    assert s.evaluate("document.querySelectorAll('.new-badge').length") >= 3
    s.evaluate("() => import('/src/admin/admin-actions.js').then(m => m.adminActions.dismissWhatsNew())")
    assert 'Yeni eklenenler' not in s.inner_text('#main-view')
    hata_yok(s)


@test('Test kayıtları: yükle, süz, seç, işaretle (onay penceresiyle) ve geri al; çekilmiş kayıt geri alınca çekilmiş kalır')
def _(o):
    s = o.sayfa(1440, 900, yol='/admin/')
    yonetim_kur(s)
    r = s.evaluate("""async () => {
      const a = (await import('/src/admin/admin-actions.js')).adminActions;
      const out = {};
      await a.loadTestRecords();
      out.eski = (a.setRecordFilter('old'), [...document.querySelectorAll('.record-code')].map(e => e.textContent));
      a.selectFilteredRecords(); a.markSelectedRecords(); out.pencere = document.querySelector('#modal-box h2').textContent;
      out.onceCagri = window.__yazilan.length;
      a.confirmModal(); await new Promise(x => setTimeout(x, 400));
      out.sonraCagri = window.__yazilan.length; out.alan = window.__yazilan[0].map(i => i.code + ':' + i.fields.withdrawn + '/' + i.fields.testRecord);
      a.setRecordFilter('marked'); out.isaretli = [...document.querySelectorAll('.record-code')].map(e => e.textContent);
      a.selectFilteredRecords(); a.unmarkSelectedRecords(); a.confirmModal(); await new Promise(x => setTimeout(x, 400));
      out.geri = window.__yazilan[1].map(i => i.code + ':' + i.fields.withdrawn + '/' + i.fields.testRecord);
      return out; }""")
    assert r['eski'] == ['AAAA-1111', 'BBBB-2222'], r
    assert r['pencere'] == 'Test kaydı olarak işaretle' and r['onceCagri'] == 0 and r['sonraCagri'] == 1, r
    assert r['alan'] == ['AAAA-1111:true/true', 'BBBB-2222:true/true'], r
    # Geri alma: AAAA yalnızca test için kapatılmıştı (yeniden açılır); BBBB gerçekten çekilmişti (çekilmiş kalır)
    assert r['isaretli'] == ['AAAA-1111', 'BBBB-2222'] and r['geri'] == ['AAAA-1111:false/false', 'BBBB-2222:true/false'], r
    hata_yok(s)


@test('Tam yedek: dosya iner, geçerli JSON, sayımlar içerikle uyuşur ve olaylar katılımcılara bağlıdır')
def _(o):
    s = o.sayfa(1440, 900, yol='/admin/')
    yonetim_kur(s)
    with s.expect_download(timeout=15000) as indirme:
        s.evaluate("() => import('/src/admin/admin-actions.js').then(m => m.adminActions.downloadBackup())")
    d = indirme.value
    assert d.suggested_filename.startswith('ilklot_tam_yedek_GIZLI_') and d.suggested_filename.endswith('.json'), d.suggested_filename
    veri = json.loads(open(d.path(), encoding='utf-8').read())
    assert veri['format'] == 'ilklot-tam-yedek' and veri['counts']['participants'] == 4 and veri['counts']['events'] == 4, veri['counts']
    assert all(len(p['events']) == 1 and p['events'][0]['code'] == p['code'] for p in veri['participants'])
    assert len(veri['allocations']) == 4
    hata_yok(s)


# ───────── erişilebilirlik (axe-core, WCAG 2.1 A/AA) ─────────
AXE_YOLU = os.path.join(KOK, 'node_modules', 'axe-core', 'axe.min.js')
# Bilinen ve KABUL EDİLMİŞ istisnalar: (kural, öğe, tema). Şu an yok: açık temadaki kırmızı rozet kontrastı b38'de düzeltildi
# (--dn #c2412d → #b53a27, 4,13:1 → 4,70:1; docs/ERISILEBILIRLIK.md). Yeni bir istisna eklenecekse nedeni ve onayı belgeye yazılır.
BILINEN_ISTISNALAR = set()


def axe_tara(sayfa):
    sayfa.evaluate(open(AXE_YOLU, encoding='utf-8').read())
    return sayfa.evaluate("""async () => {
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
      return r.violations.flatMap(v => v.nodes.map(n => ({ kural: v.id, hedef: n.target.join(' '), etki: v.impact })));
    }""")


def ekranlari_tara(o, tema, fs=''):
    """Katılımcı ekranlarını iki boyutta ve yönetim panelini tarar; [(ekran, ihlal)] döndürür."""
    bulunan = []

    def sayfa(w, h, mobil=False, yol='/'):
        s = o.sayfa(w, h, mobil=mobil, yol=yol)
        s.evaluate("([t, f]) => { document.documentElement.setAttribute('data-theme', t); if (f) document.documentElement.setAttribute('data-fs', f); }", [tema, fs])
        return s

    def kaydet(ekran, s):
        time.sleep(0.7)  # ekran giriş animasyonu bitmeden taranırsa yarı saydam öğeler için kontrast yanlış ölçülür
        for ihlal in axe_tara(s):
            bulunan.append((ekran, ihlal))

    for etiket, w, h, mobil in (('telefon', 390, 844, True), ('masaüstü', 1440, 900, False)):
        s = sayfa(w, h, mobil)
        s.evaluate("() => { const k = window.ilkLot; k.state.stage = 'consent'; k.render(); }")
        kaydet(etiket + ' onam', s)
        s.evaluate("""() => { const k = window.ilkLot, st = k.state; st.group = 'A'; st.setOrder = 0; st.phase = 'pre'; st.block = 'pre'; st.trialIndex = 0; st.decisions = [];
          st.stage = 'task'; st.trial = { mode: 'main', i: 0, phase: 'choose', t0: Date.now(), first: null }; st.seenTourSteps = { tc: 1, tpos: 1, tnews: 1, tcrowd: 1, tch: 1 }; k.render(); }""")
        kaydet(etiket + ' karar anı', s)
        simulator_kur(s, 'A', sekme='p')
        s.evaluate("() => { const st = window.ilkLot.state; st.seenTourSteps = { sim: 1 }; st.tour = null; window.ilkLot.render(); }")
        kaydet(etiket + ' simülatör portföy', s)
        for sekme in ('m', 'a'):
            s.evaluate("(t) => { const k = window.ilkLot; k.state.marketTab = t; k.render(); k.updateSimulatorLive(); }", sekme)
            kaydet(etiket + ' simülatör ' + sekme, s)
        s.evaluate("() => { const k = window.ilkLot; k.state.marketTab = 'p'; k.state.detailSymbol = 'PGSUS'; k.render(); k.updateSimulatorLive(); }")
        kaydet(etiket + ' hisse ayrıntısı', s)
        s.evaluate("() => { const k = window.ilkLot; k.state.detailSymbol = null; k.render(); k.actions.openTradeWindow('KOZAL|S'); k.actions.setTradeQuantity('max'); k.actions.submitTrade(); k.actions.chooseSellReason('0'); }")
        time.sleep(0.4)
        kaydet(etiket + ' bekleme penceresi', s)
        s.evaluate("() => { const k = window.ilkLot; k.actions.cancelCooldown(); k.actions.cancelModal(); k.actions.openMenu(); }")
        kaydet(etiket + ' menü penceresi', s)
        o.temizle()
    a = sayfa(1440, 900, yol='/admin/')
    yonetim_kur(a)
    a.evaluate("() => import('/src/admin/admin-actions.js').then(m => m.adminActions.loadTestRecords())")
    time.sleep(0.3)
    kaydet('yönetim paneli', a)
    return bulunan


@test('Erişilebilirlik (axe-core, WCAG 2.1 A/AA): karanlık tema, açık tema ve büyük yazıda tüm ekranlar ihlalsiz')
def _(o):
    if not os.path.exists(AXE_YOLU):
        raise AssertionError('axe-core yok: npm install')
    sorunlar = []
    for tema, fs in (('dark', ''), ('light', ''), ('light', '2')):
        for ekran, ihlal in ekranlari_tara(o, tema, fs):
            if (ihlal['kural'], ihlal['hedef'], tema) in BILINEN_ISTISNALAR:
                continue
            sorunlar.append(f"[{tema}{'/yazı ' + fs if fs else ''}] {ekran}: {ihlal['kural']} ({ihlal['etki']}) {ihlal['hedef']}")
    assert not sorunlar, '\n         '.join(sorunlar)


# ───────── çalıştırıcı ─────────
def main():
    surec, taban = sunucu_baslat()
    gecen = 0
    basarisiz = []
    # İsteğe bağlı süzgeç: python testler/ekran_testleri.py "Bekleme"  (adında bu metin geçen testler)
    suzgec = sys.argv[1].lower() if len(sys.argv) > 1 else ''
    secili = [(ad, f) for ad, f in sonuclar if suzgec in ad.lower()]
    try:
        with sync_playwright() as p:
            ortam = Ortam(p, taban)
            try:
                for ad, f in secili:
                    t0 = time.time()
                    try:
                        f(ortam)
                        gecen += 1
                        print(f'GEÇTİ ({time.time() - t0:4.1f} sn)  {ad}')
                    except Exception as hata:  # noqa: BLE001 (her hata testi kırmızı yapar)
                        basarisiz.append(ad)
                        print(f'KALDI ({time.time() - t0:4.1f} sn)  {ad}\n         -> {type(hata).__name__}: {str(hata)[:400]}')
                    finally:
                        ortam.temizle()
            finally:
                ortam.kapat()
    finally:
        surec.kill()
    print(f'\n{gecen}/{len(secili)} test geçti.')
    return 0 if not basarisiz else 1


if __name__ == '__main__':
    sys.exit(main())
