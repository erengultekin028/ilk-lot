'use strict';
// Her olay ve anlık görüntü bu sürümle etiketlenir. Pilot ortasında kodu değiştirirsen MUTLAKA artır.
var APP_VERSION='2026.10.20-b25';

// ═════════════════ ÇALIŞMA AYARLARI ═════════════════
var QS=new URLSearchParams(location.search);
// Kişiye özel link: ...ilk-lot.html#k=KM7D-P2XR-9TQA  (# sonrası sunucuya gönderilmez)
var HASH=new URLSearchParams(location.hash.slice(1));
var CFG={
  session:'1',
  totalSessions:1,                    // Tek oturum, ~30 dk: 1. bölüm (6 karar) → simülatör (7,5 dk) → 3. bölüm (6 karar)
  minGapHours:0,
  baseUrl:'',                         // Kartlardaki link adresi. Boşsa sayfanın kendi adresi
  contact:'arastirmaci@ornek.edu.tr', // DEĞİŞTİR: bilgilendirme ve onam ekranındaki iletişim adresi
  // Onam metnindeki doldurulacak alanlar. "[DOLDUR…" ile başlayanlar ekranda sarı işaretli görünür ve
  // araştırmacı panelinde "doldurulmamış" olarak listelenir. Pilottan ÖNCE hepsini doldur.
  consentInfo:{controller:'[DOLDUR: üniversite ve araştırmacı adı]',ethics:'[DOLDUR: etik kurul adı, tarih ve sayı]',retention:'[DOLDUR: örn. araştırma bittikten sonra 2 yıl]',hosting:'[DOLDUR: örn. Google Firebase, Avrupa bölgesi]',support:'[DOLDUR: üniversite psikolojik danışma ve rehberlik birimi, iletişim bilgisi]',funding:''},
  stake:10000,                        // Her karar anında elde tutulan pozisyonun değeri (₺)
  addAmount:5000,                     // "Daha al" seçilince eklenen tutar (₺)
  cooldownSec:10,                     // A grubu: zararına satışta bekleme süresi
  lossThreshold:-0.02,                // Bekleme, pozisyon bu orandan fazla zarardayken tetiklenir
  // Simülatör: 6 hisselik hazır portföy + nakit. Üç planlı kriz; krizde pozisyonlar zarara girer
  cash0:40000,posValue:10000,
  pracTicks:20,pracSeed:'ilklot-prac-v1',  // alıştırma simülatörü: 20 gün (30 sn), kriz yok, kayıt yok, bekleme ekranı yok
  simTicks:300,simTickMs:1500,        // 300 gün × 1,5 sn = 7,5 dk
  // Sektörel krizler: her biri farklı hisseleri vurur. Bir hisseyi satmak diğer krizlerden kaçırmaz,
  // böylece piyasa nötr kalır ama katılımcı her krizde yeniden karar verir (bekleme dozu dağılır).
  // BIMAS hiçbir krizden etkilenmez (karşılaştırma hissesi). Kriz dışında sürüklenme yok.
  // Hisse adları gerçek BIST şirketleri; fiyatlar, haberler ve krizler KURGUSAL (ekranda ve bilgilendirmede belirtilir).
  simCrises:[{at:52,len:7,drop:0.18,stocks:['TUPRS','KOZAL']},{at:135,len:7,drop:0.20,stocks:['ASELS']},{at:218,len:7,drop:0.16,stocks:['THYAO','PGSUS']}],
  simSeed:'ilklot-sim4-v2669',         // 300 günlük takvim için seçildi: kriz dibinden sona ve +20 güne ortalama değişim ~0 (nötr piyasa); docs/SIMULATOR_TOHUMU.md
  crisisFx:true,                      // Yön ışığı: yükselişte yeşil, düşüşte kırmızı kenar ışığı (iki gruba da aynı)
  // Pilot yayını için true: bilgilendirme ekranının sonunda 3 soruluk geri bildirim formu çıkar (CSV: pilot_clear, pilot_duration, pilot_unease).
  // Gerçek veri toplamada MUTLAKA false: ana veride bu sorular olmamalı. firebase/dagit.py true bırakılmışsa yayını durdurur.
  pilot:false,
  firebase:null                       // Gerçek pilot için doldur (KURULUM.md)
};
// ── Hızlı test modu ──
// Sadece geliştirme/demo içindir: piyasa 10 kat hızlı akar (7,5 dk yerine ~45 sn), bekleme 3 sn olur.
// Fiyatlar, krizler ve haberler AYNI günlerde olur (sadece gerçek zaman kısalır). Açma yolları: adrese ?hizli=1 ya da
// araştırmacı panelindeki düğme (30 dk sonra kendiliğinden kapanır). CFG.firebase doluysa (gerçek pilot) HİÇBİR ZAMAN açılmaz.
var QUICK=(function(){if(CFG.firebase)return false;if(QS.get('hizli')==='1')return true;try{var t=+localStorage.getItem('ilklot:quick');return !!t&&Date.now()-t<1800000}catch(e){return false}})();
if(QUICK){CFG.simTickMs=150;CFG.cooldownSec=3}
// ── Tanıtım modu (?demo=1) ──
// Okulda, sunumda ya da arkadaşa gösterirken kullanılır: simülatör serbestçe oynanır, HİÇBİR şey kaydedilmez (ne yerel ne Firebase),
// bekleme ekranı çıkmaz (müdahale gösterilmez, böylece tanıtımı gören biri sonradan gerçek katılımcı olursa ön bilgi edinmez).
// CFG.firebase dolu olsa da Firebase'e hiç bağlanılmaz. Gerçek veri toplamada bu adres kartlara/linklere KONMAZ.
var DEMO=QS.get('demo')==='1';
// Pilot geri bildirim formu: CFG.pilot ya da (Firebase yokken) adrese ?pilot=1. CFG.firebase doluyken adres parametresi çalışmaz;
// gerçek kurulumda formu yalnızca yayındaki dosyanın kendisi açar, katılımcı linkine parametre eklenerek açılamaz.
var PILOT=!DEMO&&(CFG.pilot===true||(!CFG.firebase&&QS.get('pilot')==='1'));
function simLim(){return S.free?Infinity:S.prac?CFG.pracTicks:CFG.simTicks}
function simMin(){var x=Math.round(CFG.simTicks*CFG.simTickMs/60000*2)/2;return String(x).replace('.',',')}
function tickSecText(){return String(CFG.simTickMs/1000).replace('.',',')}
CFG.seed='ilklot-gorev-v1';
var FORCED_SESSION=QS.get('oturum');

// ═════════════════ TOHUMLU RASTGELELİK ═════════════════
// Uyaranlar (grafikler, haberler, sonuçlar) bu tohumdan üretilir: herkes aynı 16 anı aynı sırayla görür.
function seedOf(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return h>>>0}
var _rs=seedOf(CFG.seed);
function rnd(){_rs=(_rs+0x6D2B79F5)>>>0;var t=_rs;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
function rr(a,b){return a+rnd()*(b-a)}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}

// ═════════════════ YARDIMCILAR ═════════════════
function $(id){return document.getElementById(id)}
function fmt(n,d){d=d==null?2:d;n=Number(n);if(Math.abs(n)<0.5*Math.pow(10,-d))n=0;return n.toLocaleString('tr-TR',{minimumFractionDigits:d,maximumFractionDigits:d})}
function r2(v){return Math.round(v*100)/100}
function sgn(v){return r2(v)>=0?'+':''}
function cls(v){return r2(v)>=0?'up':'dn'}
// Yön sadece renkle değil işaretle de gösterilir (renk körü katılımcılar için)
function chg(v){var r=r2(v);return (r>0?'▲ ':r<0?'▼ ':'')+fmt(Math.abs(v))+'%'}
function tl(v){return (v<0?'−':'')+'₺'+fmt(Math.abs(v),0)}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function mmss(sec){sec=Math.max(0,Math.round(sec));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}

// ═════════════════ TEST SORULARI ═════════════════
// Finansal bilgi testi: Lusardi ve Mitchell'in "Big Three" soruları (1-3, ön test) ve "Big Five" uzantısının 4-5. soruları (son test).
// ÇEVİRİ araştırmacı tarafından doğrulanmalıdır (geri çeviri ya da yayımlanmış Türkçe uyarlama). İki testte FARKLI sorular vardır:
// ön-son değişim puanı hesaplanmaz. Eski sorular ("piyasa düşerken ilk adım: planına bak") ölçülen davranışı önceden hazırlıyordu.
// Her sorunun son seçeneği "Bilmiyorum": bu, yanlış cevaptan ayrı kaydedilir (olay kaydında dk).
var TQ=[
['Tasarruf hesabında 100 ₺\'n olduğunu ve faiz oranının yılda %2 olduğunu düşün. Parayı hesapta bırakırsan 5 yıl sonra hesapta ne kadar olur?',['102 ₺\'den fazla','Tam olarak 102 ₺','102 ₺\'den az','Bilmiyorum'],0],
['Tasarruf hesabındaki faiz oranının yılda %1, enflasyonun yılda %2 olduğunu düşün. 1 yıl sonra bu hesaptaki parayla, bugün alabildiğinden daha fazlasını mı, aynısını mı, daha azını mı alabilirsin?',['Bugünkünden daha fazlasını','Aynısını','Bugünkünden daha azını','Bilmiyorum'],2],
['"Tek bir şirketin hissesini almak, genellikle bir hisse senedi yatırım fonuna göre daha güvenli bir getiri sağlar." Bu ifade doğru mu yanlış mı?',['Doğru','Yanlış','Bilmiyorum'],1],
['"15 yıl vadeli bir konut kredisinin aylık taksitleri genellikle 30 yıl vadeliye göre daha yüksektir, ama kredi boyunca ödenen toplam faiz daha azdır." Bu ifade doğru mu yanlış mı?',['Doğru','Yanlış','Bilmiyorum'],0],
['Faiz oranları yükselirse tahvil fiyatlarına genellikle ne olur?',['Yükselir','Düşer','Aynı kalır','Faiz oranları ile tahvil fiyatları arasında ilişki yoktur','Bilmiyorum'],1],
// 5-7: araştırmacının yazdığı, doğrulanmamış ön test maddeleri (Big Three ile birlikte puanı inceltmek için; yalnızca Big Three puanı ayrıca saklanır: pre_test_b3)
['Genel olarak, daha yüksek getiri vaat eden yatırımların riski de nasıl olur?',['Daha yüksek','Daha düşük','Değişmez','Bilmiyorum'],0],
['Bir şirketin hissesine sahip olmak ne anlama gelir?',['Şirkete borç vermiş olmak','Şirketin küçük bir ortağı olmak','Şirketin ürünlerinde kalıcı indirim hakkı kazanmak','Bilmiyorum'],1],
['Yıllık %10 getiri sağlayan bir yatırımda kazancı çekmeden bırakırsan, 100 ₺\'n 2 yıl sonra kaç ₺ olur?',['120 ₺','121 ₺','110 ₺','Bilmiyorum'],1]];
var ATT=['Dikkat kontrolü: Bu soruda lütfen "Mevduat" seçeneğini işaretle.',['Hisse senedi','Altın','Mevduat','Döviz'],2];

// ═════════════════ UYARANLAR: 16 KARAR ANI ═════════════════
// Tasarım 2 × 2 × 4: piyasa (sert düşüş / normal) × pozisyon (kârda / zararda) × 4 tekrar.
// Her hücrede: 2 denemede sürü bilgisi var, 2'sinde yok; 2 sonuç yükseliş, 2 düşüş (çapraz dengeli).
// Yükseliş ve düşüşler aynı büyüklükte eşleştirilir: her hücrede beklenen sonuç tam olarak sıfırdır.
// Yani "tutmak kazandırır" ya da "satmak kazandırır" diye bir ders verilmez.
var SECTORS=['Havacılık','Bankacılık','Perakende','Enerji','Otomotiv','Telekom','Gıda','Savunma','Demir çelik','İnşaat','Kimya','Holding','Cam','Teknoloji','Sağlık','Tekstil'];
var NEWS_CRISIS=['Kurda sert yükseliş, piyasalarda satış baskısı','Küresel piyasalarda satış dalgası','Faiz kararı beklentilerin üzerinde açıklandı','Sektörde talep daralması uyarısı','Yabancı yatırımcı çıkışı hızlandı','Enflasyon verisi beklentileri aştı','Kredi notu görünümü negatife çevrildi','Bölgesel gerilim piyasaları tedirgin etti'];
var NEWS_NORMAL=['Şirket yeni yatırım planını açıkladı','Sektör satışlarında hafif artış','Yönetim kurulu toplantısı tamamlandı','Çeyreklik sonuçlar beklentilere yakın geldi'];

function makePath(kind,last5,p0){var p=[p0],i,base=p0;
// İlk 25 gün: sakin dalgalanma
for(i=1;i<25;i++){base*=1+(rnd()-0.5)*0.022;p.push(base)}
// Son 5 gün: istenen toplam değişim; sert düşüşte bir gün daha büyük pay alır
var w=kind==='kriz'?[0.12,0.18,0.38,0.2,0.12]:[0.2,0.2,0.2,0.2,0.2];
for(i=0;i<5;i++){base*=Math.pow(1+last5,w[i])*(1+(rnd()-0.5)*(kind==='kriz'?0.004:0.008));p.push(base)}
return p}

// Her set 6 karar: 4 × (sert düşüş + zarar) [ana ölçüt, sürü × sonuç tam çapraz] + 1 × (normal + kâr) + 1 × (normal + zarar).
// Tekli hücreler iki set arasında dengelenir: X'te normal-kâr yükselir, Y'de aynı büyüklükte düşer (normal-zarar tersi).
// Her katılımcı iki seti de gördüğü için kişi içinde beklenen sonuç sıfırdır.
var PAIR=(function(){_rs=seedOf('ilklot-pair');return {nk:r2(rr(2.5,7.5))/100,nz:r2(rr(2.5,7.5))/100}})();
var TASKNAMES={X:[['GARAN','Bankacılık'],['FROTO','Otomotiv'],['TCELL','Telekom'],['EREGL','Demir çelik'],['SISE','Cam'],['ULKER','Gıda']],Y:[['AKBNK','Bankacılık'],['TOASO','Otomotiv'],['TTKOM','Telekom'],['KCHOL','Holding'],['ARCLK','Beyaz eşya'],['MGROS','Perakende']]};
function buildSet(name){_rs=seedOf('ilklot-set6-'+name);var T=[],letters=(name==='X'?'ABCDEF':'GHJKLM').split(''),sec=shuffle(SECTORS.slice()),nc=shuffle(NEWS_CRISIS.slice()),nn=shuffle(NEWS_NORMAL.slice()),k=0,X=name==='X';
function add(kind,pos,crowd,sign,mag,news){var last5=kind==='kriz'?-rr(0.10,0.16):rr(-0.03,0.03),
 pl=kind==='kriz'?-rr(0.12,0.22):(pos==='kar'?rr(0.06,0.14):-rr(0.06,0.14)),p0=Math.round(rr(20,300)*100)/100;
 T.push({id:name+(T.length+1),set:name,kind:kind,pos:pos,crowd:crowd?Math.round(kind==='kriz'?rr(62,85):rr(35,58)):null,out:sign*mag,news:news,pl:r2(pl*100)/100,
  path:makePath(kind,last5,p0).map(function(v){return Math.round(v*100)/100}),sector:sec[k++]})}
var mA=r2(rr(2.5,7.5))/100,mB=r2(rr(2.5,7.5))/100;
[[true,1,mA],[true,-1,mA],[false,1,mB],[false,-1,mB]].forEach(function(c){add('kriz','zarar',c[0],c[1],c[2],nc[k%nc.length])});
add('normal','kar',X,X?1:-1,PAIR.nk,X?nn[0]:null);
add('normal','zarar',!X,X?-1:1,PAIR.nz,X?null:nn[1]);
shuffle(T);if(T[0].kind==='kriz'){var j=T.findIndex(function(t){return t.kind==='normal'});var x=T[0];T[0]=T[j];T[j]=x}
T.forEach(function(t,i){t.n=i+1;t.sym=TASKNAMES[name][i][0];t.sector=TASKNAMES[name][i][1]});return T}
var TRS={X:buildSet('X'),Y:buildSet('Y')};
// Hangi set önce: randomizasyon listesindeki "order" alanı (0: X→Y, 1: Y→X), gruplar içinde dengeli
function BT(){var first=S.order===1?'Y':'X';return S.block==='post'?TRS[first==='X'?'Y':'X']:TRS[first]}


// Alıştırma: kayda girmez, bekleme ekranı göstermez (B grubuna müdahaleyi ele vermemek için)
function buildPractice(){_rs=seedOf('ilklot-alistirma');return [
 {id:'p1',kind:'normal',pos:'kar',crowd:null,out:0.03,news:'Şirket yeni ürününü tanıttı',pl:0.08,path:makePath('normal',0.01,100),sector:'Örnek sektör',sym:'Örnek hisse 1',n:1,practice:true},
 {id:'p2',kind:'kriz',pos:'zarar',crowd:70,out:-0.03,news:'Piyasalarda satış baskısı',pl:-0.12,path:makePath('kriz',-0.12,80),sector:'Örnek sektör',sym:'Örnek hisse 2',n:2,practice:true}]}
var PR=buildPractice();

// Uyaran parmak izi: iki cihazda aynı çıkmalı (herkes aynı 16 anı görüyor mu?)
function fingerprint(){var f=function(T){return T.map(function(t){return [t.kind,t.pos,t.crowd,t.out,t.pl,t.path[29]]})};return 'k-'+seedOf(JSON.stringify([f(TRS.X),f(TRS.Y),SIMBASE])).toString(36)}
function weekCh(t){var p=t.path;return (p[p.length-1]/p[p.length-6]-1)*100}

// ═════════════════ DURUM ═════════════════
var CONSENT_VER='v1';
var S={stage:'boot',intro:0,grp:null,code:null,pre:null,post:null,tq:null,ended:false,admin:HASH.has('admin')&&!DEMO,
order:0,phase:'pre',block:'pre',ti:0,dec:[],total:0,pulses:{},tr:null,cd:null,practiced:false,sim:null,guess:null,
tourSeen:{},tour:null,comp:null,helpN:0,simTab:'p',tabT:{p:0,m:0,a:0},readMs:null,simDetail:null,simRange:30};

// ═════════════════ YENİ BAŞLAYANLAR İÇİN ═════════════════
// Rehberli tur adımları: sadece ekranda olan öğeler gösterilir. İki gruba da aynıdır.
var TOUR_TASK=[
 ['tc','Bu, hissenin son 30 günlük fiyat grafiği. Sağdaki gri alan son haftayı gösterir. Üstteki rozet son haftadaki değişim: <b>▲ yeşil</b> yükseliş, <b>▼ kırmızı</b> düşüş.'],
 ['tpos','Bu hisse için ne ödediğini ve şu an ne ettiğini gösterir. Şu anki değer ödediğinden fazlaysa <b>kârdasın ▲</b>, azsa <b>zarardasın ▼</b>.'],
 ['tnews','Bazı anlarda o güne ait bir haber görürsün.'],
 ['tcrowd','Diğer yatırımcıların bugün ne yaptığını gösterir: kırmızı kısım satanlar, yeşil kısım alanlar.'],
 ['tch','Üç seçeneğin var. <b>Sat:</b> hisseyi satıp parayı alırsın, sonraki fiyat değişimi seni etkilemez. <b>Tut:</b> hisse sende kalır, değeri değişir. <b>Daha al:</b> ₺5.000\'lik daha alırsın, değişimden daha çok etkilenirsin. Hazırsan birini seç; doğru ya da yanlış cevap yok.']];
var TOUR_SIM=[
 ['snews','Burada piyasa haberleri çıkar. Haberler herkese aynı anda gelir; bazıları belirli sektörleri etkiler.'],
 ['shero','Bu senin toplam paran: elindeki hisselerin değeri ve boştaki nakit. Başlangıçta ₺100.000.'],
 ['salloc','Paranın hisseler ve nakit arasında nasıl dağıldığını gösterir.'],
 ['slist','Bunlar elindeki 6 hisse. Her biri yaklaşık ₺10.000 ile başlıyor. Bir hisseye dokunarak ayrıntısını görebilir, satabilir ya da daha alabilirsin.'],
 ['nav','Alttan <b>Piyasa</b> sekmesinde tüm haberleri ve grafikleri, <b>Analiz</b> sekmesinde bu bölümdeki işlemlerinin özetini görebilirsin.'],
 ['tm','Sağ üstte kalan süre görünür. İşlem penceresi açıkken zaman durur, acele etmene gerek yok.']];
// Anlama kontrolü: alıştırmadan sonra, 1. bölümün kararlarından önce. İlk denemedeki doğru sayısı kaydedilir (görevi anladı mı?)
// 3 soru sorulur; her sıranın havuzunda 6 soru var, oturum başına her havuzdan biri rastgele seçilir (18 soru, 216 kombinasyon).
// Sıra 1: ekrandaki sayıları okumak (kâr/zarar, ödediğin). Sıra 2: "Tut" ve "Daha al". Sıra 3: "Sat" ve görevin işleyişi.
// KURAL: sorular yalnızca görevin mekaniğini sorar; hiçbiri sat/tut'tan birini önermez ya da bir sonucu "iyi/kötü" diye çerçevelemez
// (READING ile aynı ilke). Seçim grupla ilgisizdir (Math.random; kod tohumundan bağımsız), anlık görüntüde saklanır, yeniden
// yüklemede değişmez, aynı tarayıcıda bir önceki oturumdakiyle aynı soru art arda gelmez. Seçilen soru `comprehension` olayında `form`.
var COMP=[
 [{q:'Bu hisse için ₺12.000 ödedin, şu anki değeri ₺10.000. Hissen ne durumda?',o:['Kârda','Zararda','Bilmiyorum'],a:1,e:'Şu anki değer (₺10.000) ödediğinden (₺12.000) az, yani ₺2.000 zarardasın.'},
  {q:'Bu hisse için ₺8.000 ödedin, şu anki değeri ₺9.500. Hissen ne durumda?',o:['Kârda','Zararda','Bilmiyorum'],a:0,e:'Şu anki değer (₺9.500) ödediğinden (₺8.000) fazla, yani ₺1.500 kârdasın.'},
  {q:'Bu hisse için ₺15.000 ödedin, şu anki değeri ₺13.500. Hissen ne durumda?',o:['Zararda','Kârda','Bilmiyorum'],a:0,e:'Şu anki değer (₺13.500) ödediğinden (₺15.000) az, yani ₺1.500 zarardasın.'},
  {q:'Bir hisse için ₺10.000 ödedin, şu anki değeri de ₺10.000. Durumun ne?',o:['Kârdayım','Zarardayım','Ne kâr ne zarar'],a:2,e:'Ödediğin tutar ile şu anki değer eşit; ne kâr var ne zarar.'},
  {q:'"Bu hisse için ödediğin" satırı neyi gösterir?',o:['Hisseyi alırken verdiğin parayı','Bir hafta sonraki fiyatı','Hissenin şu anki değerini'],a:0,e:'Bu satır, hisseyi alırken verdiğin parayı gösterir. Şu anki değeri ise "Şu anki değeri" satırında görürsün.'},
  {q:'"Kârın / zararın" satırında kırmızı ▼ görürsen bu ne demektir?',o:['Hisse ödediğinden daha değerli','Hissenin şu anki değeri ödediğinden az','Hisse satıldı'],a:1,e:'Kırmızı ▼ zarar demektir: şu anki değer, hisse için ödediğinden az.'}],
 [{q:'"Tut" seçersen ne olur?',o:['Hisseyi satarım','Hisse bende kalır, değeri artabilir ya da azalabilir','₺5.000 daha alırım'],a:1,e:'"Tut" hiçbir şey yapmamak demek: hisse sende kalır ve bir hafta sonraki fiyat değişimi değerini etkiler.'},
  {q:'Bir hissede "Tut" seçtin. Hisseye ne olur?',o:['Hisse hemen satılır','₺5.000 daha hisse alınır','Hisse bende kalır'],a:2,e:'"Tut" hiçbir şey yapmamak demek: hisse sende kalır ve bir hafta sonraki fiyat değişimi değerini etkiler.'},
  {q:'Bir hissede "Tut" seçtin. Bir hafta sonra fiyat yükselirse ne olur?',o:['Hissenin değeri artar','Bir şey olmaz, hisse artık bende değil','Hisse otomatik satılır'],a:0,e:'"Tut" dediğinde hisse sende kalır; fiyat yükselirse değeri de artar.'},
  {q:'"Daha al" seçersen ne olur?',o:['Elimdeki hisse satılır','Aynı hisseden ₺5.000 değerinde daha alırım','Hiçbir şey olmaz'],a:1,e:'"Daha al" seçince aynı hisseden ₺5.000 değerinde ek alım yapılır.'},
  {q:'Hangi seçenek elindeki hisse miktarını artırır?',o:['Tut','Sat','Daha al'],a:2,e:'Yalnızca "Daha al" aynı hisseden ek alım yapar. "Tut" hiçbir şeyi değiştirmez, "Sat" hisseyi elinden çıkarır.'},
  {q:'Hangi seçenek "hiçbir şey yapmamak" demektir?',o:['Sat','Tut','Daha al'],a:1,e:'"Tut" hiçbir şey yapmamak demektir: hisse sende kalır.'}],
 [{q:'"Sat" seçersen, bir hafta sonra fiyat değişince bu seni etkiler mi?',o:['Evet, etkiler','Hayır, etkilemez'],a:1,e:'Sattığında hisse artık sende değildir; sonraki fiyat değişimi seni etkilemez.'},
  {q:'Bir hissede "Sat" seçtin. Hisseye ne olur?',o:['Hisse satılır, artık bende olmaz','Hisse bende kalır','₺5.000 daha hisse alınır'],a:0,e:'Sattığında hisse artık sende değildir; sonraki fiyat değişimi seni etkilemez.'},
  {q:'Bir hisseyi sattın. Bir hafta sonra fiyat yükselirse bu senin paranı değiştirir mi?',o:['Evet, paran artar','Hayır, hisse artık sende değil'],a:1,e:'Sattığında hisse artık sende değildir; sonraki fiyat değişimi seni etkilemez.'},
  {q:'Kararının sonucu ne zaman gösterilir?',o:['Bütün kararlar bittikten sonra','Hiç gösterilmez','Kararından hemen sonra, bir hafta sonrası olarak'],a:2,e:'Her kararın sonucu, bir hafta sonrası olarak hemen gösterilir.'},
  {q:'Kararlarında doğru ya da yanlış bir cevap var mı?',o:['Evet, tek bir doğru cevap var','Hayır, doğru ya da yanlış cevap yok'],a:1,e:'Doğru ya da yanlış cevap yok; kararını kendin verirsin.'},
  {q:'Her kararda elindeki hissenin değeri yaklaşık ne kadardır?',o:['₺1.000','₺10.000','₺100.000'],a:1,e:'Her kararda elinde yaklaşık ₺10.000 değerinde bir hisse var.'}]];
// Her havuzdan bir soru; aynı tarayıcıda bir önceki oturumda gösterilen soru art arda gelmez (depolama kapalıysa saf rastgele)
function compNew(){var son=[];try{son=JSON.parse(localStorage.getItem('ilklot_comp_son')||'[]')}catch(e){}
var f=COMP.map(function(v,i){var k;do{k=Math.floor(Math.random()*v.length)}while(v.length>1&&k===son[i]);return k});
try{localStorage.setItem('ilklot_comp_son',JSON.stringify(f))}catch(e){}return f}
function compQ(i){var f=(S.comp&&S.comp.f)||[];return COMP[i][f[i]||0]}
// Simülatörden önce herkese aynı okuma. Bilinçli olarak nötr: "satma" ya da "tut" demez
var READING=[['Çeşitlendirme','Paranı farklı sektörlerdeki hisselere bölmek, tek bir şirketteki sert düşüşün toplam parana etkisini azaltır.'],
['Fiyatlar dalgalanır','Hisse fiyatları her gün yükselip düşer. Geçmişteki bir düşüş ya da yükseliş, sonrasında ne olacağını tek başına göstermez.'],
['Haberler ve sektörler','Bir haber çoğu zaman tüm piyasayı değil, ilgili sektördeki şirketleri etkiler.']];
// Simülatörde her satışta sorulur (iki gruba da). Panik satışın nedenine dair veri
var SELL_WHY=['Planım buydu','Haber yüzünden','Korktum','Diğerleri satıyor','Söylemek istemiyorum'];
var GLOSSARY=[['Hisse','Bir şirketin küçük bir parçası. Fiyatı her gün değişir.'],['Lot','Hisse adedi. 1 lot = 1 adet hisse. 100 lot × ₺84 = ₺8.400. Al ya da sat penceresinde kaç lot istediğini kendin yazabilirsin.'],['Ortalama alış (ort.)','Elindeki lotlar için ödediğin ortalama fiyat. Şu anki fiyat bunun üstündeyse kârdasın.'],['Elindeki hissenin değeri','Hisseni şu an satsan alacağın para.'],['Bu hisse için ödediğin','Hisseyi alırken verdiğin para.'],['Kâr / zarar','Şu anki değer ile ödediğin arasındaki fark. ▲ yeşil kâr, ▼ kırmızı zarar.'],['Sert düşüş','Fiyatın kısa sürede, örneğin bir haftada, çok düşmesi.'],['Satanların oranı','Diğer yatırımcıların ne kadarının o gün sattığı.'],['Sat / Tut / Daha al','Sat: parayı al, çık. Tut: bekle. Daha al: aynı hisseden ekle.'],['Nakit','Hisseye yatırılmamış, boşta duran paran.'],['Toplam paran','Hisselerinin değeri + nakit.']];

// ═════════════════ SİMÜLATÖR ═════════════════
// Uyaranlardan ayrı bir tohum akışı: simülatör, görev setlerini etkilemez.
// Fiyat = ortak piyasa hareketi + hisseye özgü gürültü. Kriz dışında sürüklenme yok (ortalamaya dönüş yok):
// düşüşten sonra kendiliğinden toparlanma beklenmez, "tutmak kazandırır" dersi verilmez.
var SIMBASE=[['KOZAL','Koza Altın',84.2,'Madencilik'],['TUPRS','Tüpraş',42.6,'Enerji'],['PGSUS','Pegasus',27.9,'Havacılık'],['THYAO','Türk Hava Yolları',156.4,'Havacılık'],['ASELS','Aselsan',63.1,'Savunma'],['BIMAS','BİM',118.5,'Perakende']];
var _r2=1;function rnd2(){_r2=(_r2+0x6D2B79F5)>>>0;var t=_r2;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
function simInit(seed){_r2=seedOf(seed||CFG.simSeed);var m={tick:0,cash:CFG.cash0,pos:{},p:{},h:{},p0:{},trades:[],v0:CFG.cash0+SIMBASE.length*CFG.posValue,vh:[]};
var inv=0;SIMBASE.forEach(function(b){var q=Math.round(CFG.posValue/b[2]);m.p[b[0]]=b[2];m.p0[b[0]]=b[2];m.h[b[0]]=[b[2]];m.pos[b[0]]={q:q,avg:b[2]};inv+=q*b[2]});
m.cash=Math.round((m.v0-inv)*100)/100;m.vh.push(m.v0);S.newsSeen=0;S.sim=m}
// b19: serbest modda olaylar S.sim.crises'ta tutulur (çalışma simülatöründe tanımsız: her zaman CFG.simCrises). simCrisis yalnız DÜŞÜŞ olaylarını döndürür (uyarı/kırmızı vurgu)
function simCrises(){return (S.sim&&S.sim.crises)||CFG.simCrises}
function simCrisis(t){var L=simCrises();for(var i=0;i<L.length;i++){var c=L[i];if(c.drop>0&&t>=c.at&&t<c.at+c.len)return c}return null}
// Hissenin şu an krizde (ya da krizden sonraki 20 günde) olup olmadığı
function simStockCrisis(k,t,after){var L=simCrises();for(var i=0;i<L.length;i++){var c=L[i];if(c.stocks.indexOf(k)>=0&&t>=c.at&&t<c.at+c.len+(after||0))return c}return null}
// Haberler sabit takvimle gelir: her krizden birkaç gün önce bir uyarı, kriz başında bir haber, aralarda nötr haberler
// [gün, metin, yön, ilgili hisseler] — ilgili hisseler, hisse detay sayfasındaki haber listesi için
// b18: 12 tarafsız haber eklendi (yön 0). KURAL: uyarı/kriz haberlerinin günleri ve metinleri DEĞİŞMEZ; her kriz için "uyarıdan krizin bitişi + 20 gün"
// penceresine (46-79, 129-162, 212-245) yeni haber konmaz, çünkü Portföy'de son haber gösterilir ve olumsuz haber o pencerede görünür kalmalı.
// Yeni haberler yön ipucu vermez (karışık/yatay/takvim içerikli) ve her hisseye dengeli dağıtıldı.
var SIMNEWS=[[0,'Piyasa güne sakin başladı.',0,[]],[10,'Borsa İstanbul işlem hacmi geçen haftaya yakın seyretti.',0,[]],[22,'Perakende sektöründe talep istikrarlı seyrediyor.',0,['BIMAS']],
[34,'Madencilik şirketleri yeni üretim verilerini paylaştı.',0,['KOZAL']],[40,'Şirketlerin bilanço takvimi açıklandı.',0,[]],
[46,'Enerji sektöründe arz sorunu konuşuluyor.',-1,['TUPRS']],[52,'Enerji ve madencilik hisselerinde sert satış.',-1,['TUPRS','KOZAL']],[82,'Perakende zincirleri mağaza açılışlarını sürdürüyor.',0,['BIMAS']],[90,'Piyasa günü yatay tamamladı.',0,[]],
[100,'Savunma sanayii fuarı bu hafta düzenleniyor.',0,['ASELS']],[112,'Döviz kurları dar bir bantta hareket etti.',0,[]],[122,'Analistlerin piyasa beklentileri karışık.',0,[]],
[129,'Savunma ihracatına yönelik kısıtlama sinyali.',-1,['ASELS']],[135,'Savunma hisselerinde satış dalgası.',-1,['ASELS']],[172,'Havayolları yeni rotalar duyurdu.',0,['THYAO','PGSUS']],
[195,'Havalimanlarında yolcu sayısı geçen aya yakın.',0,['THYAO','PGSUS']],[204,'Enerji şirketleri bilanço tarihlerini duyurdu.',0,['TUPRS']],
[212,'Jet yakıtı fiyatlarında ani artış haberi.',-1,['THYAO','PGSUS']],[218,'Havacılık hisselerinde sert düşüş.',-1,['THYAO','PGSUS']],
[250,'Madencilik şirketlerinden yeni sondaj çalışması duyurusu.',0,['KOZAL']],[262,'Piyasa sakin bir gün geçirdi.',0,[]],[276,'Perakende endeksi haftayı yatay kapattı.',0,['BIMAS']],[288,'İşlem hacmi sakin; yatırımcılar yeni haberleri bekliyor.',0,[]]];
// Dağılım renkleri: yeşil ve kırmızı bilerek yok (uygulamada fiyat yönü anlamı taşıyorlar)
var SIMCOL={KOZAL:'#1F4E8C',TUPRS:'#C98A1B',PGSUS:'#2B9DA3',THYAO:'#7B5FC4',ASELS:'#D9468F',BIMAS:'#5B6B8C',cash:'#C9D0DC'};
function simNewsList(){return (S.sim&&S.sim.news)||SIMNEWS}
function simNewsAt(t){var n=null;simNewsList().forEach(function(x){if(x[0]<=t)n=x});return n}
function simStep(){var m=S.sim;m.tick++;if(m.free)freePlan(m);var mk=(rnd2()-0.5)*0.005;
// Krizdeki hisse: sektöre özgü sert düşüş; diğerleri sadece ortak piyasa gürültüsü + kendi gürültüsü
SIMBASE.forEach(function(b){var k=b[0],c=simStockCrisis(k,m.tick,0),sh=c?Math.pow(1-c.drop,1/c.len)-1:0;m.p[k]=Math.max(1,m.p[k]*(1+mk+sh+(rnd2()-0.5)*0.008));m.h[k].push(m.p[k]);if(m.h[k].length>60)m.h[k].shift()});
m.vh.push(Math.round(simValue()))}
// ═════════════════ SERBEST MOD (b19) ═════════════════
// Çalışmanın parçası DEĞİL: çalışma bittikten sonra bilgilendirme ekranından açılır; hiçbir şey kaydedilmez, bekleme ekranı ve satış gerekçesi sorusu yoktur.
// Süre sınırı yok. Toplam para, başlangıcın (1 − lim) katının altına inince oyun biter. Zorluk: kayıp sınırı, olayların büyüklüğü ve sıklığı, uyarı süresi, haber derinliği (d: 0 kısa/net, 1 nedenli, 2 çok katmanlı/belirsiz).
// Olaylar (düşüş ya da yükseliş) S.sim.crises'ta, haberler S.sim.news'te tutulur; ikisi de tohumdan ileriye doğru üretilir. Çalışma simülatörü bunlara dokunmaz (m.free tanımsız).
// up: yükseliş olasılığı (hepsinde 0,5: yükseliş düşüşün log-simetriği, beklenen sürüklenme yok). mkt: olayın tüm piyasayı kapsama olasılığı. warn: uyarının olaydan kaç gün önce geldiği.
// Değerler, pasif ve tam yatırımlı iki basit stratejiyle simülasyonda ayarlandı (insan oyunuyla denenmedi).
var FREE_LV={k:{ad:'Kolay',lim:0.30,drop:[0.12,0.18],gap:[55,90],up:0.5,mkt:0,warn:8,d:0},
o:{ad:'Orta',lim:0.20,drop:[0.18,0.28],gap:[30,55],up:0.5,mkt:0.20,warn:6,d:1},
z:{ad:'Zor',lim:0.10,drop:[0.20,0.32],gap:[25,45],up:0.5,mkt:0.30,warn:4,d:2}};
var FREE_SEC=[['Madencilik',['KOZAL']],['Enerji',['TUPRS']],['Havacılık',['THYAO','PGSUS']],['Savunma',['ASELS']],['Perakende',['BIMAS']],['Genel piyasa',['KOZAL','TUPRS','PGSUS','THYAO','ASELS','BIMAS']]];
// Her sektör: [düşüş uyarısı, düşüş haberi, yükseliş uyarısı, yükseliş haberi]; her biri [kolay, orta, zor]. Zor uyarılar yön vermez (iki yönde aynı metin).
var FREE_N=[
[['Madencilik sektöründe satış baskısı bekleniyor.','Maliyet artışı sürerken madencilik sektöründe satış baskısı bekleniyor.','Madencilik sektöründe hareketli bir gün bekleniyor: üretim maliyetleri ve talep verisi karşıt sinyal veriyor.'],
 ['Madencilik hisselerinde sert düşüş.','Üretim maliyetlerinin beklentinin üzerinde gelmesiyle madencilik hisselerinde sert düşüş.','Madencilik hisselerinde sert düşüş: maliyet verisi beklentinin üzerinde geldi; bazı analistler düşüşü aşırı buluyor, işlem hacmi normalin iki katına çıktı.'],
 ['Madencilik sektöründe alım ilgisi bekleniyor.','Talepteki toparlanma sürerken madencilik sektöründe alım ilgisi bekleniyor.','Madencilik sektöründe hareketli bir gün bekleniyor: üretim maliyetleri ve talep verisi karşıt sinyal veriyor.'],
 ['Madencilik hisselerinde sert yükseliş.','Talep verisinin güçlü gelmesiyle madencilik hisselerinde sert yükseliş.','Madencilik hisselerinde sert yükseliş: talep verisi beklentiyi aştı, ancak şirketlerin bir kısmı kâr satışı uyarısı yaptı ve yükselişin sürüp sürmeyeceği tartışılıyor.']],
[['Enerji sektöründe satış baskısı bekleniyor.','Rafineri bakım takviminin uzamasıyla enerji sektöründe satış baskısı bekleniyor.','Enerji sektöründe hareketli bir gün bekleniyor: arz verisi ve talep tahminleri karşıt sinyal veriyor.'],
 ['Enerji hisselerinde sert düşüş.','Rafineri duruşlarının uzamasıyla enerji hisselerinde sert düşüş.','Enerji hisselerinde sert düşüş: duruşun süresi belirsiz; bazı analistler geçici, bazıları kalıcı kapasite kaybı olduğunu söylüyor.'],
 ['Enerji sektöründe alım ilgisi bekleniyor.','Rafineri marjlarındaki iyileşmeyle enerji sektöründe alım ilgisi bekleniyor.','Enerji sektöründe hareketli bir gün bekleniyor: arz verisi ve talep tahminleri karşıt sinyal veriyor.'],
 ['Enerji hisselerinde sert yükseliş.','Rafineri marjlarının beklentiyi aşmasıyla enerji hisselerinde sert yükseliş.','Enerji hisselerinde sert yükseliş: marjlar beklentiyi aştı, ancak bunun mevsimsel mi kalıcı mı olduğu belirsiz.']],
[['Havacılık sektöründe satış baskısı bekleniyor.','Yakıt maliyetlerinin artmasıyla havacılık sektöründe satış baskısı bekleniyor.','Havacılık sektöründe hareketli bir gün bekleniyor: yolcu verisi ve yakıt maliyeti karşıt sinyal veriyor.'],
 ['Havacılık hisselerinde sert düşüş.','Yakıt maliyetlerindeki ani artışla havacılık hisselerinde sert düşüş.','Havacılık hisselerinde sert düşüş: yakıt maliyeti sıçradı, yolcu doluluğu ise yüksek; piyasa hangisine ağırlık vereceğini tartışıyor.'],
 ['Havacılık sektöründe alım ilgisi bekleniyor.','Yakıt fiyatlarının gerilemesiyle havacılık sektöründe alım ilgisi bekleniyor.','Havacılık sektöründe hareketli bir gün bekleniyor: yolcu verisi ve yakıt maliyeti karşıt sinyal veriyor.'],
 ['Havacılık hisselerinde sert yükseliş.','Yakıt fiyatlarındaki gerilemeyle havacılık hisselerinde sert yükseliş.','Havacılık hisselerinde sert yükseliş: yakıt fiyatları geriledi, ancak sezon sonrası talebin azalması bekleniyor.']],
[['Savunma sektöründe satış baskısı bekleniyor.','İhracat izinlerindeki gecikmeyle savunma sektöründe satış baskısı bekleniyor.','Savunma sektöründe hareketli bir gün bekleniyor: sipariş haberleri ve ihracat izinleri karşıt sinyal veriyor.'],
 ['Savunma hisselerinde sert düşüş.','İhracat izinlerinin gecikmesiyle savunma hisselerinde sert düşüş.','Savunma hisselerinde sert düşüş: ihracat izinleri gecikti, sipariş defteri ise dolu; gecikmenin kalıcı olup olmayacağı belirsiz.'],
 ['Savunma sektöründe alım ilgisi bekleniyor.','Yeni sipariş görüşmeleriyle savunma sektöründe alım ilgisi bekleniyor.','Savunma sektöründe hareketli bir gün bekleniyor: sipariş haberleri ve ihracat izinleri karşıt sinyal veriyor.'],
 ['Savunma hisselerinde sert yükseliş.','Yeni sipariş haberleriyle savunma hisselerinde sert yükseliş.','Savunma hisselerinde sert yükseliş: sipariş haberi geldi, ancak sözleşme ayrıntıları açıklanmadı ve teslimat takvimi belirsiz.']],
[['Perakende sektöründe satış baskısı bekleniyor.','Tüketici harcamalarındaki yavaşlamayla perakende sektöründe satış baskısı bekleniyor.','Perakende sektöründe hareketli bir gün bekleniyor: satış hacmi ve kâr marjı karşıt sinyal veriyor.'],
 ['Perakende hisselerinde sert düşüş.','Tüketici harcamalarının beklentinin altında kalmasıyla perakende hisselerinde sert düşüş.','Perakende hisselerinde sert düşüş: harcamalar beklentinin altında kaldı, ancak mağaza sayısındaki artış marjı destekleyebilir.'],
 ['Perakende sektöründe alım ilgisi bekleniyor.','Tüketici harcamalarındaki toparlanmayla perakende sektöründe alım ilgisi bekleniyor.','Perakende sektöründe hareketli bir gün bekleniyor: satış hacmi ve kâr marjı karşıt sinyal veriyor.'],
 ['Perakende hisselerinde sert yükseliş.','Tüketici harcamalarının beklentiyi aşmasıyla perakende hisselerinde sert yükseliş.','Perakende hisselerinde sert yükseliş: harcamalar beklentiyi aştı, ancak gelir artışının ne kadarının fiyat artışından geldiği tartışılıyor.']],
[['Genel piyasada satış baskısı bekleniyor.','Küresel risk iştahının zayıflamasıyla genel piyasada satış baskısı bekleniyor.','Genel piyasada hareketli bir gün bekleniyor: yurt dışı sinyalleri ve yerel veri karışık.'],
 ['Piyasada genel sert düşüş.','Küresel risk iştahının zayıflamasıyla piyasada genel sert düşüş.','Piyasada genel sert düşüş: yurt dışı kaynaklı satış dalgası tüm sektörlere yayıldı, ancak yerel verilerde bozulma görülmüyor.'],
 ['Genel piyasada alım ilgisi bekleniyor.','Küresel risk iştahının artmasıyla genel piyasada alım ilgisi bekleniyor.','Genel piyasada hareketli bir gün bekleniyor: yurt dışı sinyalleri ve yerel veri karışık.'],
 ['Piyasada genel sert yükseliş.','Küresel risk iştahının artmasıyla piyasada genel sert yükseliş.','Piyasada genel sert yükseliş: yurt dışı kaynaklı alım tüm sektörlere yayıldı, ancak işlem hacmi düşük olduğundan hareketin kalıcılığı belirsiz.']]];
var FREE_NEU=[['Piyasa güne sakin başladı.','Piyasa günü yatay tamamladı.','İşlem hacmi geçen haftaya yakın seyretti.','Döviz kurları dar bir bantta hareket etti.','Şirketlerin bilanço takvimi açıklandı.'],
['Piyasa yatay seyrediyor; yatırımcılar yeni bilanço verilerini bekliyor.','Döviz kurları dar bantta; ihracatçı şirketlerde belirgin bir hareket yok.','İşlem hacmi geçen haftaya yakın; sektörler arasında belirgin bir ayrışma görülmüyor.','Faiz kararı beklentisi nedeniyle piyasada temkinli bir gün yaşanıyor.','Bilanço takvimi açıklandı; ilk sonuçların önümüzdeki hafta gelmesi bekleniyor.'],
['Piyasa yatay seyrediyor: bazı analistler kısa vadeli düşüş, bazıları toparlanma bekliyor.','Yabancı yatırımcı payı ile yerel işlem hacmi zıt yönde hareket etti; günün toplam etkisi nötr.','Faiz beklentileri ve enflasyon verisi bir arada gündemde; piyasa yönsüz kaldı.','Bilanço takvimi açıklandı; beklentiler sektörlere göre farklı yönlerde, genel görünüm net değil.','Döviz kuru dar bantta ama vadeli işlemlerde hareketlilik arttı; yön konusunda net bir ipucu yok.']];
// b23: senaryo (olay sıklığı, büyüklüğü ve yönü) ve başlangıç portföyü seçenekleri. 'r' (rastgele) çarpanları 1 ve up=null: b19-b22 ile birebir aynı olay takvimi (rnd2 çağrı sırası değişmez).
var FREE_SC={r:{ad:'Rastgele',gap:1,drop:1,up:null,tx:'Olaylar zorluk seviyene göre gelir; düşüş ve yükseliş eşit olasılıkta.'},
s:{ad:'Sakin dönem',gap:1.6,drop:0.7,up:null,tx:'Olaylar daha seyrek ve daha küçük; piyasa çoğu zaman sakin.'},
k:{ad:'Kriz dönemi',gap:0.7,drop:1.1,up:0.25,tx:'Olaylar daha sık ve çoğu düşüş; oyun daha çabuk bitebilir.'},
y:{ad:'Yükseliş dönemi',gap:1,drop:1,up:0.75,tx:'Olayların çoğu yükseliş, ama düşüşler de gelir.'}};
var FREE_PF={d:{ad:'Dengeli',tx:'Altı hissede ₺10.000\'er lot ve ₺40.000 nakit (çalışmadaki gibi).'},n:{ad:'Tamamen nakit',tx:'₺100.000 nakitle başlarsın; hisseleri kendin seçip alırsın.'},h:{ad:'Hisse ağırlıklı',tx:'Altı hissede eşit paylarla ₺90.000, ₺10.000 nakit.'}};
var FREE_LIMS=[0.10,0.20,0.30,0.50];
function freePick(a){return a[Math.floor(rnd2()*a.length)]}
// Başlangıç portföyünü ayarlar (olay üretimini etkilemez: rnd2 kullanmaz)
function freePortfolio(m,key){if(key!=='n'&&key!=='h')return;var inv=0,per=key==='h'?0.9*m.v0/SIMBASE.length:0;
SIMBASE.forEach(function(b){var k=b[0],p=m.p0[k],q=per?Math.round(per/p):0;m.pos[k]={q:q,avg:p};inv+=q*p});m.cash=Math.round((m.v0-inv)*100)/100}
function freeInit(lvl,sc){var m=S.sim;m.free=lvl;m.fsc=FREE_SC[sc]?sc:'r';m.orders={};m.crises=[];m.news=[[0,FREE_NEU[FREE_LV[lvl].d][0],0,[]]];m.fr={at:0,end:0,first:1,lastSec:-1,lastSec2:-1,lastNeu:''};freePlan(m)}
// Tohumdan ileriye (150 gün) olay ve haber planlar. Haberler gün sırasıyla eklenir; tarafsız haberler olayın uyarısından 3 gün önce ve bitişinden 8 gün sonra arasına konur.
function freePlan(m){var L=FREE_LV[m.free],f=m.fr,SC=FREE_SC[m.fsc||'r'];
while(f.at<m.tick+150){var gap=Math.round((L.gap[0]+rnd2()*(L.gap[1]-L.gap[0]))*SC.gap);if(f.first){gap=Math.round(gap*0.5);f.first=0}
var at=f.at+gap,wd=at-L.warn,lo=f.end+8,hi=wd-3,n=2+(rnd2()<0.5?1:0),days=[],i;
for(i=0;i<n;i++){var d=Math.round(lo+(i+0.5)*(hi-lo)/n+(rnd2()-0.5)*4);if(d>=lo&&d<=hi&&(!days.length||d-days[days.length-1]>=6))days.push(d)}
days.forEach(function(d){var t,a=FREE_NEU[L.d],g=0;do{t=freePick(a);g++}while(t===f.lastNeu&&g<9);f.lastNeu=t;m.news.push([d,t,0,[]])});
var all=rnd2()<L.mkt,si=5;if(!all){do{si=Math.floor(rnd2()*5)}while(si===f.lastSec||si===f.lastSec2);f.lastSec2=f.lastSec;f.lastSec=si}
var up=rnd2()<(SC.up==null?L.up:SC.up),mg=(L.drop[0]+rnd2()*(L.drop[1]-L.drop[0]))*SC.drop,len=5+Math.floor(rnd2()*5),st=FREE_SEC[si][1];if(all)mg*=0.6;if(up)mg=mg/(1-mg);mg=Math.round(mg*1000)/1000;
m.crises.push({at:at,len:len,drop:up?-mg:mg,stocks:st});
m.news.push([wd,FREE_N[si][up?2:0][L.d],(!up&&L.d<2)?-1:0,st]);m.news.push([at,FREE_N[si][up?3:1][L.d],up?1:-1,st]);
f.at=at;f.end=at+len}}
function freeLimit(lvl,v0){return Math.round(v0*(1-FREE_LV[lvl].lim))}
// b23: kayıp sınırı kullanıcı seçimi (f.lim) ya da zorluğun varsayılanı
function freeLim(f){return f.lim!=null?f.lim:FREE_LV[f.lvl].lim}
function freeLimitF(f,v0){return Math.round(v0*(1-freeLim(f)))}
function simValue(){var m=S.sim,v=m.cash;for(var k in m.pos)v+=m.pos[k].q*m.p[k];return v}
function simBase(k){for(var i=0;i<SIMBASE.length;i++)if(SIMBASE[i][0]===k)return SIMBASE[i];return null}
function simCo(k){var b=simBase(k);return b?b[1]:''}
function simName(k){var b=simBase(k);return b?b[1]+' · '+b[3]:''}

// ═════════════════ BİLDİRİM ═════════════════
var toastT;
function note(t){var el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('show')},3200)}
