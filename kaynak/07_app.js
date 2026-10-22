
// ═════════════════ ÇİZİM ═════════════════
function render(){
// Kaldığı yerden devam: "app" aşaması akıştaki doğru ekrana çevrilir
if(S.stage==='app')resumeFlow();
var el=$('view'),key=[S.stage,S.simTab,S.simDetail,S.tq?S.tq.kind+S.tq.i:'',S.intro,S.bridge,S.stressKey,S.tr?S.tr.mode+S.tr.i+S.tr.phase+S.ti+S.block:''].join('|'),st=el.scrollTop;
el.innerHTML=vStage();el.scrollTop=key===S._k?st:0;if(key!==S._k){el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter')}S._k=key;
$('disc').hidden=!(S.stage==='task'||S.stage==='sim');
var nv=$('nav');if(S.stage==='sim'){nv.innerHTML=simNavHtml();nv.hidden=false}else{nv.hidden=true;nv.innerHTML=''}
header();if(S.stage==='sim')simLive();if($('fcr'))startFilm();maybeTour();applyTour()}
function setTxt(id,t){var e=$(id);if(e&&e.textContent!==t)e.textContent=t}
function header(){$('qb').hidden=!QUICK;$('db').hidden=!(DEMO||S.prac||S.free);if(S.free)$('db').textContent='SERBEST MOD · araştırmaya dahil değil, kaydedilmez';else if(S.prac)$('db').textContent='ALIŞTIRMA · işlemlerin sayılmaz';else if(DEMO)$('db').textContent='TANITIM MODU · hiçbir veri kaydedilmez';$('sdot').hidden=DEMO||!!S.free;var inTask=S.stage==='task'&&S.tr&&S.tr.mode==='main',inSim=S.stage==='sim'&&S.sim;
$('tm').hidden=!(inTask||inSim);
if(inTask){var shown=S.tr.phase==='outcome'?S.ti:S.ti+1;$('tmt').textContent='Karar '+Math.min(Math.max(shown,1),BT().length)+'/'+BT().length}
if(inSim)$('tmt').textContent=S.free?'Gün '+S.sim.tick:'⏱ '+mmss((simLim()-S.sim.tick)*CFG.simTickMs/1000);
$('mn').hidden=!((S.code||DEMO)&&['task','intro','pre','demo','end','sim','bridge','stress'].indexOf(S.stage)>=0);
$('hp').hidden=!((S.code||DEMO)&&['task','intro','sim','bridge'].indexOf(S.stage)>=0);
// Yön ışığı (iki gruba da aynı): kararda son haftanın yönü, sonuçta sonucun yönü, simülatörde kriz anı
var dir=0,strong=false;
if(CFG.crisisFx&&S.stage==='task'&&S.tr){var ph=S.tr.phase;
 if(ph==='choose'||ph==='cool'){var wk=weekCh(curTrial());dir=wk>=0?1:-1;strong=wk<=-8}
 else if(ph==='outcome'&&S.tr.last){dir=S.tr.last.out>=0?1:-1}}
if(CFG.crisisFx&&inSim&&simCrisis(S.sim.tick)){dir=-1;strong=true}
var app=$('app');app.classList.toggle('gl-up',dir>0);app.classList.toggle('gl-dn',dir<0);app.classList.toggle('gl-strong',strong);
updDot();progress()}

// ═════════════════ GENEL İLERLEME ═════════════════
// 5 adım: Hazırlık → 1. bölüm → 2. bölüm (simülatör) → 3. bölüm → Bitiş. Geçerli adım, kendi içindeki ilerlemeyle kısmen dolar
var GP_LABELS=['Hazırlık','1. bölüm','2. bölüm','3. bölüm','Bitiş'],GP_W=[0.18,0.19,0.28,0.19,0.16];
function gpState(){if(DEMO||S.free)return null;var st=S.stage,N=TRS.X.length;
if(S.tq&&S.tq.kind==='post')return [4,0.1];
if(st==='demo')return [0,0.12];if(st==='pre')return [0,0.3];if(st==='intro')return [0,0.45+0.1*S.intro];
if(st==='task'&&S.tr){if(S.tr.mode==='practice')return S.tr.phase==='quiz'?[0,0.88]:S.tr.phase==='ready'?[0,0.97]:[0,0.65+0.1*S.tr.i];
 return [S.block==='post'?3:1,Math.min(1,S.ti/N)]}
if(st==='stress')return S.stressKey==='b_post'?[3,1]:S.stressKey==='b_sim'?[2,1]:[1,1];
if(st==='bridge')return S.bridge==='post'?[3,0]:[2,0];
if(st==='sim'&&S.sim)return S.prac?[2,0]:[2,Math.min(1,S.sim.tick/CFG.simTicks)];
if(st==='end')return [4,S.post==null?0.15:!S.manip?0.45:S.guess==null?0.7:0.9];
return null}
function progress(){var el=$('gp'),g=gpState();if(!g){el.hidden=true;return}
var pct=0,i;for(i=0;i<g[0];i++)pct+=GP_W[i];pct=Math.round((pct+GP_W[g[0]]*g[1])*100);
var h=GP_LABELS.map(function(l,k){var fill=k<g[0]?100:k===g[0]?Math.round(g[1]*100):0;return '<div><div class="gb"><i style="width:'+fill+'%"></i></div><div class="gl'+(k===g[0]?' cur':k<g[0]?' done':'')+'">'+l+'</div></div>'}).join('');
if(el._h!==h){el.innerHTML='<div class="gs">'+h+'</div>';el._h=h}
el.setAttribute('aria-valuenow',pct);el.setAttribute('aria-valuetext',GP_LABELS[g[0]]+', toplam %'+pct);el.hidden=false}

// ═════════════════ AKIŞ ═════════════════
// pre: 1. bölüm (6 karar) → sim: 2. bölüm (simülatör) → post: 3. bölüm (6 karar) → done
function taskAt(){S.stage='task';S.tr={mode:'main',i:S.ti,phase:'choose',t0:Date.now(),first:null}}
function resumeFlow(){
if(S.ended||S.phase==='done'){S.stage='end';return}
if(S.phase==='pre'){S.block='pre';if(S.ti<BT().length)return taskAt();if(!S.pulses.b_pre){S.stage='stress';S.stressKey='b_pre';return}S.stage='bridge';S.bridge='sim';return}
if(S.phase==='sim'){if(!S.sim)simInit();if(S.sim.tick>=CFG.simTicks){S.stage='stress';S.stressKey='b_sim';return}S.stage='sim';return}
if(S.phase==='post'){S.block='post';if(S.ti<BT().length)return taskAt();if(!S.pulses.b_post){S.stage='stress';S.stressKey='b_post';return}S.stage='end';setTimeout(endSession,0)}}
function startTrial(){S.tr.phase='choose';S.tr.t0=Date.now();S.tr.first=null;S.tr.firstMs=null;S.tr.cdShown=false;S.tr.cdWait=null;
if(S.tr.mode==='main')log('trial_show',{id:BT()[S.ti].id,block:S.block,n:S.ti+1});render()}

// Görevlerde bekleme süresi YOK (iki grupta da): 1. ve 3. bölüm aktarımı ölçer
function choose(c){var tr=S.tr,now=Date.now();if(tr.first==null){tr.first=c;tr.firstMs=now-tr.t0}finalize(c)}
function finalize(c){var tr=S.tr,t=curTrial(),now=Date.now(),
// Sonuç: sat = fiyat değişiminden etkilenmez; tut = pozisyon × değişim; daha al = (pozisyon + ek) × değişim
res=c==='sat'?0:c==='tut'?CFG.stake*t.out:(CFG.stake+CFG.addAmount)*t.out;
var d={id:t.id,block:S.block,set:t.set,n:t.n,sym:t.sym,kind:t.kind,pos:t.pos,pl:t.pl,crowd:t.crowd,news:!!t.news,out:t.out,first:tr.first,final:c,
rtFirst:tr.firstMs,rtFinal:now-tr.t0,hid:(S.lastHiddenAt||0)>tr.t0,res:Math.round(res)};
tr.last=d;tr.phase='outcome';
if(tr.mode==='main'){S.dec.push(d);S.total+=d.res;S.ti++;log('decision',d);saveSnap();flush()}
else log('practice_trial',{id:t.id,final:c,rtFirst:tr.firstMs});
render()}
function nextAfterOutcome(){var tr=S.tr;
if(tr.mode==='practice'){if(tr.i+1<PR.length){tr.i++;startTrial()}else{S.comp=S.comp||{i:0,sel:null,first:[],att:[],f:compNew()};tr.phase='quiz';log('practice_done',{});saveSnap();render()}return}
if(S.ti>=BT().length){S.stage='stress';S.stressKey=S.block==='pre'?'b_pre':'b_post';S.stressT0=Date.now();render();return}
tr.i=S.ti;startTrial()}

// ═════════════════ REHBERLİ TUR ═════════════════
// İlk alıştırmada ve simülatörün başında ekranın parçalarını sırayla vurgular.
// Görev turunda her adım bir kez gösterilir: 2. alıştırmada sadece ilkinde olmayan öğe (ör. satanların oranı) anlatılır.
function maybeTour(){if(S.tour)return;var st;
if(S.stage==='task'&&S.tr&&S.tr.mode==='practice'&&S.tr.phase==='choose'){st=TOUR_TASK.filter(function(x){return $(x[0])&&!S.tourSeen[x[0]]});if(st.length)startTour(st,'task')}
else if(S.stage==='sim'&&!S.free&&!S.tourSeen.sim){st=TOUR_SIM.filter(function(x){return $(x[0])});if(st.length)startTour(st,'sim')}}
function startTour(steps,key){S.tour={steps:steps,i:0,key:key,t0:Date.now()};log('tour_start',{key:key,n:steps.length})}
function applyTour(){var el=$('tour'),app=$('app');document.querySelectorAll('.hl').forEach(function(x){x.classList.remove('hl')});
if(!S.tour){el.hidden=true;el.innerHTML='';app.classList.remove('touring');return}
var t=S.tour,s=t.steps[t.i],tg=$(s[0]),last=t.i+1>=t.steps.length;app.classList.add('touring');el.classList.toggle('top',s[0]==='nav');
el.innerHTML='<div class="tt">'+(t.i+1)+' / '+t.steps.length+'</div><p>'+s[1]+'</p><div class="tb"><button class="ts" data-a="tourSkip">'+(last?'':'Turu geç')+'</button><button class="tn" data-a="tourNext">'+(last?'Anladım':'İleri')+'</button></div>';el.hidden=false;
if(tg){tg.classList.add('hl');var vw=$('view').getBoundingClientRect(),r=tg.getBoundingClientRect(),cardTop=el.getBoundingClientRect().top;
if(s[0]!=='nav'&&(r.top<vw.top||r.bottom>cardTop-12)){try{tg.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch(e){}}}}
function endTour(skipped){var t=S.tour;if(!t)return;t.steps.forEach(function(x){S.tourSeen[x[0]]=1});if(t.key==='sim')S.tourSeen.sim=1;
log('tour_done',{key:t.key,skipped:!!skipped,atStep:t.i+1,ms:Date.now()-t.t0});S.tour=null;applyTour();saveSnap()}

// ═════════════════ SİMÜLATÖR AKIŞI ═════════════════
function modalOpen(){return $('modal').classList.contains('open')}
// Piyasa döngüsü: sadece simülatör ekranında, sekme görünürken ve işlem penceresi kapalıyken ilerler
function marketTick(){if(S.stage!=='sim'||!S.sim||document.hidden||modalOpen()||S.tour||S.sim.tick>=simLim())return;
simStep();simLive();header();var m=S.sim,c=simCrisis(m.tick);
if(c&&m.tick===c.at){log('sim_crisis_start',{stocks:c.stocks,tab:S.simTab});if(S.simTab!=='p')note('Sert düşüş: '+c.stocks.join(', ')+'. Portföyüne bak.');if(navigator.vibrate)try{navigator.vibrate([80,60,80])}catch(e){}}
if(S.free){freeOrders();var fv=simValue();if(fv>S.free.peak)S.free.peak=fv;if(fv<=freeLimitF(S.free,m.v0)){freeFinish('limit');return}}
if(m.tick%10===0){saveSnap();flush()}
if(m.tick>=simLim()){if(S.prac)pracEnd(false);else simEnd()}}
// Tanıtım modunda hız çarpanı (1, 2, 4): aynı turu art arda çalıştırır; gerçek akışta çarpan hep 1
// b23: serbest modda hız (0 duraklat, 1, 2, 4) oyuncunun kendi seçimidir; tanıtım hızı yalnızca serbest dışında geçerli
setInterval(function(){var n=S.free?(S.free.speed==null?1:S.free.speed):DEMO?(S.demoSpeed||1):1;for(var i=0;i<n;i++)marketTick()},CFG.simTickMs);
// b23: serbest mod otomatik sat emirleri. Eşik, hissenin ORTALAMA ALIŞ fiyatına göre kâr/zarardır; tetiklenince hissenin tamamı O ANKİ fiyattan satılır
// (sert düşüşte eşiğin altından satış olabilir). Hissenin tamamı satıldığı için doSimSell emri siler: emir bir kez çalışır.
function freeOrders(){var m=S.sim;if(!S.free||!m||!m.orders)return;
 SIMBASE.forEach(function(b){var k=b[0],od=m.orders[k],o=m.pos[k];if(!od||!o||o.q<1)return;var pl=m.p[k]/o.avg-1,t=null;
  if(od.stop!=null&&pl<=-od.stop)t='stop';else if(od.take!=null&&pl>=od.take)t='take';
  if(!t)return;var q=o.q,p=m.p[k];doSimSell(k,q,false);var tr=m.trades[m.trades.length-1];if(tr)tr.auto=t;
  note('Otomatik emir: '+k+(t==='stop'?' zarar eşiği (−%'+Math.round(od.stop*100)+')':' kâr eşiği (+%'+Math.round(od.take*100)+')')+' aşıldı, '+q+' lot ₺'+fmt(p)+' fiyattan satıldı.')})}
function tabTick(){if(S.stage!=='sim'||!S.tabSince)return;var now=Date.now();S.tabT[S.simTab]=(S.tabT[S.simTab]||0)+(now-S.tabSince);S.tabSince=now}
function pracEnd(skipped){var p=S.prac;if(!p)return;tabTick();S.tabSince=null;closeModal();clearInterval(S.cdt);var n=S.sim?S.sim.trades.length:0,tk=S.sim?S.sim.tick:0;
S.prac=null;S.sim=null;S.simDetail=null;S.simTrade=null;S.simWhy=null;S.simCd=null;S.tour=null;applyTour();
log('practice_sim',{trades:n,tick:tk,skipped:!!skipped,ms:Date.now()-p.t0});flush();S.stage='bridge';S.bridge='simready';render()}
function freeFinish(kind){var f=S.free,m=S.sim;if(!f||!m||f.res)return;closeModal();clearInterval(S.cdt);S.simTrade=null;S.simWhy=null;S.simCd=null;
 f.res={kind:kind,tick:m.tick,value:simValue(),v0:m.v0,peak:f.peak,trades:m.trades.length};S.stage='freeend';render();window.scrollTo(0,0)}
function simEnd(){tabTick();S.tabSince=null;closeModal();clearInterval(S.cdt);var m=S.sim;if(DEMO){S.stage='demoend';render();return}log('sim_end',{value:Math.round(simValue()),trades:m.trades.length});S.stage='stress';S.stressKey='b_sim';S.stressT0=Date.now();saveSnap();flush();render()}
function simRec(k,side,q,p,extra){var m=S.sim,o=m.pos[k],r={t:m.tick,sym:k,side:side,q:q,p:r2(p),pl:o?Math.round((p/o.avg-1)*10000)/10000:null,
// Bu hisse şu an krizde mi; ya da krizinden sonraki 20 gün içinde mi (dipteki satışlar buraya düşer)
crisis:!!simStockCrisis(k,m.tick,0),postCrisis:!!simStockCrisis(k,m.tick,20),decMs:S.simTrade?Date.now()-S.simTrade.t0:null};for(var x in extra)r[x]=extra[x];return r}
function doSimSell(k,q,afterCd){var m=S.sim,o=m.pos[k],p=m.p[k];if(!o||q<1||q>o.q)return;var t=S.simTrade||{},
r=simRec(k,'S',q,p,{frac:Math.round(q/o.q*1000)/1000,afterCooldown:!!afterCd,value:Math.round(q*p),why:S.simWhy?S.simWhy.why:null,qMode:t.mode||null,qEdits:t.edits||0});S.simWhy=null;
m.cash+=q*p;o.q-=q;if(S.free&&o.q<1&&m.orders)delete m.orders[k];m.trades.push(r);log('sim_trade',r);S.simTrade=null;closeModal();saveSnap();if(S.simDetail)render();else simLive();note(k+': '+q+' lot satıldı (₺'+fmt(q*p,0)+').')}
function doSimBuy(k,q){var m=S.sim,p=m.p[k],o=m.pos[k],c=q*p;if(!(q>=1)||c>m.cash+1e-9)return;var t=S.simTrade||{},r=simRec(k,'B',q,p,{value:Math.round(c),qMode:t.mode||null,qEdits:t.edits||0});
o.avg=o.q>0?(o.avg*o.q+p*q)/(o.q+q):p;o.q+=q;m.cash=Math.max(0,m.cash-c);m.trades.push(r);log('sim_trade',r);S.simTrade=null;closeModal();saveSnap();if(S.simDetail)render();else simLive();note(k+': '+q+' lot alındı (₺'+fmt(c,0)+').')}

// ═════════════════ EYLEMLER ═════════════════// ═════════════════ EYLEMLER ═════════════════
var taps=[];
var ACT={
consent:function(){if(!S.consentChk){note('Devam etmek için onay kutusunu işaretle.');return}S.consentAt=new Date().toISOString();S.consentMs=Date.now()-(S.consentT0||Date.now());
// Linkten ya da hatırlanan koddan geldiyse kod ekranı atlanır
if(S.pendingCode){S.busy=true;render();enterCode(S.pendingCode);return}
S.stage='code';render();setTimeout(function(){var c=$('ci');if(c)c.focus()},50)},
adSelf:async function(){openModal('<h2>Sistem testi</h2><p>Çalışıyor…</p>');var r=[];try{r=await Store.selfTest()}catch(e){r=[{ad:'Sistem testi',ok:false,d:String(e&&e.message||e)}]}
var tz=-new Date().getTimezoneOffset()/60,ek=[{ad:'Uyaran parmak izi',ok:null,d:fingerprint()+' (tüm cihazlarda aynı olmalı)'},{ad:'Uygulama sürümü',ok:null,d:APP_VERSION+(QUICK?' · HIZLI TEST MODU AÇIK':'')},
{ad:'Cihaz saati',ok:null,d:new Date().toLocaleString('tr-TR')+' · UTC'+(tz>=0?'+':'')+tz},{ad:'Ekran ve ağ',ok:navigator.onLine,d:innerWidth+'×'+innerHeight+' · yoğunluk '+devicePixelRatio+' · '+(navigator.onLine?'çevrimiçi':'ÇEVRİMDIŞI')},
{ad:'Tarayıcı',ok:null,d:(navigator.userAgent||'').slice(0,110)},{ad:'Titreşim ve hareket azaltma',ok:null,d:(navigator.vibrate?'titreşim var':'titreşim yok')+' · '+(matchMedia('(prefers-reduced-motion: reduce)').matches?'hareket azaltma AÇIK':'hareket azaltma kapalı')}];
var all=r.concat(ek);S.selfRes=all;var sim=function(x){return x.ok===true?'✓':x.ok===false?'✗':'ⓘ'},ren=function(x){return x.ok===true?'up':x.ok===false?'dn':'mu'};
$('mbox').innerHTML='<h2>Sistem testi</h2><div style="max-height:52vh;overflow:auto;text-align:left">'+all.map(function(x){return '<div class="kv" style="align-items:flex-start;gap:10px"><span style="flex:none;font-weight:800;color:var(--'+ren(x)+')">'+sim(x)+'</span><span style="flex:1"><b style="color:var(--tx)">'+esc(x.ad)+'</b><br><span class="mu sm">'+esc(x.d)+'</span></span></div>'}).join('')+'</div>'+(all.some(function(x){return x.ok===false})?'<div class="note" style="margin:10px 0"><span><b>Başarısız kontrol var.</b> Pilota başlamadan önce düzelt.</span></div>':'')+'<button class="btn" data-a="adSelfCopy">Sonucu kopyala</button><button class="btn pri" data-a="mCancel">Kapat</button>'},
adSelfCopy:function(){var t=(S.selfRes||[]).map(function(x){return (x.ok===true?'[OK] ':x.ok===false?'[HATA] ':'[BİLGİ] ')+x.ad+': '+x.d}).join('\n');try{navigator.clipboard.writeText(t).then(function(){note('Kopyalandı.')},function(){note('Kopyalanamadı; ekran görüntüsü al.')})}catch(e){note('Kopyalanamadı; ekran görüntüsü al.')}},
adQuick:function(){if(CFG.firebase)return;try{if(QUICK&&!QS.get('hizli'))localStorage.removeItem('ilklot:quick');else localStorage.setItem('ilklot:quick',String(Date.now()))}catch(e){note('Bu görünümde kalıcı kayıt yok; adresin sonuna ?hizli=1 ekle.');return}
if(QS.get('hizli')==='1'){note('Adreste ?hizli=1 var; kapatmak için o parametreyi kaldır.');return}
location.reload()},
consentDl:function(){S.consentDl=1;saveFile('ilklot_onam_metni.txt',consentText()).catch(function(){note('Metin indirilemedi.')})},
welcomeGo:function(){S.busy=true;render();enterCode(S.welcome.code)},
notMe:function(){remember(null);S.pendingCode=null;S.welcome=null;S.codeErr='';S.stage='consent';render()},
code:function(){var c=$('ci');S.codeIn=c?c.value:S.codeIn;S.busy=true;render();enterCode(S.codeIn)},
demoCode:function(v){S.codeIn=v;enterCode(v)},
demoReset:function(){askConfirm('Demo verisini sıfırla','Bu cihazdaki tüm demo kayıtları silinir ve yeni demo kodları oluşturulur.','Sıfırla',true,function(){Store.resetLocal();remember(null);S.allocCache=null;S.demoUsed=null;S.codeIn='';S.codeErr='';S.stage='code';render()})},
// ── Demografik form ──
dm:function(v){var p=v.split('|'),k=p[0],o=DM[k][+p[1]],d=S.dm;
if(k==='inv'){if(o==='Hiç yapmadım')d.inv=d.inv[0]==='Hiç yapmadım'?[]:['Hiç yapmadım'];else{d.inv=d.inv.filter(function(x){return x!=='Hiç yapmadım'});var j=d.inv.indexOf(o);j<0?d.inv.push(o):d.inv.splice(j,1)}}
else d[k]=d[k]===o?null:o;render()},
demoDone:async function(){var d=S.dm;if(!d.adult)return;
if(d.adult==='Hayır'){var c=S.code,g=S.grp;
// 18 yaş altı: hiçbir demografik veri saklanmaz, kayıt kapatılır
remember(null);S.allocCache=null;try{await Store.withdraw(c,g,{ineligible:true})}catch(e){}try{localStorage.removeItem('ilklot:q:'+c)}catch(e){}EVQ=[];S.code=null;S.stage='inelig';render();return}
var demo={age:d.age||null,gender:d.gender||null,field:d.field||null,year:d.year||null,inv:d.inv,sim:d.sim||null};
Store.saveP(S.code,{demo:demo,demoAt:new Date().toISOString()}).catch(function(){});log('demographics_done',{});S.hasDemo=true;S.stage='pre';render()},
// ── Testler ──
testStart:function(v){S.tq={kind:v,i:0,sc:0};render()},
tans:function(v){var t=S.tq,sq=tqSeq(t.kind),it=sq[t.i];
if(it==='att'){S.attPass=+v===ATT[2];log('attention_check',{pass:S.attPass,choice:+v});Store.saveP(S.code,{attPass:S.attPass}).catch(function(){})}
else{log('test_answer',{kind:t.kind,q:it,choice:+v,correct:+v===TQ[it][2],dk:TQ[it][1][+v]==='Bilmiyorum'});if(+v===TQ[it][2]){t.sc++;if(it<3)t.sc3=(t.sc3||0)+1}}
t.i++;
if(t.i>=sq.length){var nq=sq.filter(function(x){return x!=='att'}).length,sc=Math.round(t.sc/nq*100),p={};if(t.kind==='pre'){S.pre=sc;S.preB3=Math.round((t.sc3||0)/3*100);S.stage='intro';S.intro=0;p.pre=sc;p.preB3=S.preB3}else{S.post=sc;p.post=sc}p[t.kind+'At']=new Date().toISOString();log('test_done',{kind:t.kind,score:sc,b3:t.kind==='pre'?S.preB3:undefined});Store.saveP(S.code,p).catch(function(){});flush();S.tq=null}render()},
// ── Tanıtım ve alıştırma ──
introNext:function(){if(S.intro<2){S.intro++;render()}else ACT.introDone()},
introDone:function(){log('intro_done',{});S.stage='task';S.tr={mode:'practice',i:0};startTrial()},
startMain:function(){log('task_start',{block:'pre'});S.phase='pre';S.block='pre';S.ti=0;S.tr={mode:'main',i:0};startTrial()},
adDemo:function(){if(S.code){note('Açık bir katılımcı oturumu var; önce sayfayı yenile.');return}DEMO=true;PILOT=false;clearInterval(S.cdt);EVQ=[];S.tr=null;S.fb=null;S.grp='B';S.stage='demoland';S.adminPrev=null;render()},
demoExit:function(){var u=new URL(location.href);u.searchParams.delete('demo');location.replace(u.toString())},
demoSpeed:function(v){var n=+v;if(!DEMO||[1,2,4].indexOf(n)<0)return;S.demoSpeed=n;document.querySelectorAll('[data-a=demoSpeed]').forEach(function(b){var on=+b.dataset.v===n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})},
// Bir sonraki krizin 2 gün öncesine ilerler (piyasa ve haberler tohumdaki gibi akar; yalnızca tanıtımda)
demoCrisis:function(){if(!DEMO||!S.sim||S.free)return;var m=S.sim,c=CFG.simCrises.filter(function(x){return x.at-2>m.tick})[0];if(!c){note('Başka kriz kalmadı.');return}
while(m.tick<c.at-2&&m.tick<CFG.simTicks)simStep();closeModal();render();note('Gün '+m.tick+': krizden hemen önce.')},
demoStart:function(){closeModal();S.grp='B';S.phase='sim';S.simDetail=null;S.simTrade=null;S.simWhy=null;S.simCd=null;simInit();S.simTab='p';S.tabT={p:0,m:0,a:0};S.tabSince=Date.now();S.stage='sim';render()},
// Alıştırma simülatörü: kısa, kriz yok, bekleme ekranı yok, işlemler kaydedilmez; yalnızca sonunda tek 'practice_sim' olayı yazılır
pracStart:function(){S.readMs=S.readT0?Date.now()-S.readT0:null;S.prac={t0:Date.now()};simInit(CFG.pracSeed);S.simTab='p';S.simDetail=null;S.simTrade=null;S.simWhy=null;S.simCd=null;S.tabT={p:0,m:0,a:0};S.tabSince=Date.now();S.stage='sim';render()},
pracSkip:function(){pracEnd(true)},
// ── Serbest mod (b19): çalışma bittikten sonra; hiçbir şey kaydedilmez (log ve saveSnap S.free'de çıkar) ──
freeOpen:function(){if(S.free||!(S.stage==='end'||(DEMO&&['demoland','demoend','sim'].indexOf(S.stage)>=0)))return;closeModal();S.free={lvl:'o',peak:0,keep:{stage:S.stage,sim:S.sim,simSer:S.simSer,simTab:S.simTab,tabT:S.tabT,tabSince:S.tabSince,newsSeen:S.newsSeen,simRange:S.simRange,simDetail:S.simDetail,scrubDay:S.scrubDay}};S.stage='freemenu';render();window.scrollTo(0,0)},
freeLvl:function(v){if(!S.free||!FREE_LV[v])return;S.free.lvl=v;render()},
freeLim:function(v){if(!S.free)return;var n=v==='d'?null:+v;if(n!==null&&FREE_LIMS.indexOf(n)<0)return;S.free.lim=n;render()},
freeSc:function(v){if(!S.free||!FREE_SC[v])return;S.free.sc=v;render()},
freePf:function(v){if(!S.free||!FREE_PF[v])return;S.free.pf=v;render()},
bnClose:function(){var n=bnNews();if(S.free&&n){S.free.bn=n[0];simBanner()}},
freeSpeed:function(v){var n=+v;if(!S.free||[0,1,2,4].indexOf(n)<0)return;S.free.speed=n;document.querySelectorAll('[data-a=freeSpeed]').forEach(function(b){var on=+b.dataset.v===n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})},
// v = 'HİSSE|stop|0.1' ya da 'HİSSE|take|x' (x = emri kaldır)
freeOrder:function(v){var a=String(v).split('|'),k=a[0],t=a[1],m=S.sim;if(!S.free||!m||!m.pos[k]||(t!=='stop'&&t!=='take'))return;var n=a[2]==='x'?null:+a[2];
 if(n!==null&&(t==='stop'?[0.05,0.10,0.15,0.20]:[0.10,0.20,0.30]).indexOf(n)<0)return;if(!m.pos[k].q)return;
 var od=m.orders[k]=m.orders[k]||{stop:null,take:null};od[t]=n;if(od.stop==null&&od.take==null)delete m.orders[k];var e=$('dord');if(e)e.innerHTML=freeOrderHtml(k)},
freeMenu:function(){if(!S.free)return;S.sim=null;S.stage='freemenu';render()},
freeStart:function(){var f=S.free;if(!f||!FREE_LV[f.lvl])return;closeModal();clearInterval(S.cdt);simInit('serbest-'+Date.now()+'-'+Math.floor(Math.random()*1e9));freePortfolio(S.sim,f.pf||'d');freeInit(f.lvl,f.sc||'r');f.peak=S.sim.v0;f.res=null;
 S.simTab='p';S.simDetail=null;S.simTrade=null;S.simWhy=null;S.simCd=null;S.tour=null;S.scrubDay=null;S.simRange=S.simRange||30;S.tabT={p:0,m:0,a:0};S.tabSince=Date.now();S.stage='sim';render()},
freeQuit:function(){if(!S.free||S.stage!=='sim')return;openModal('<h2>Oyunu bitirelim mi?</h2><p>Oyun burada sona erer. İstersen sonra yeniden başlayabilirsin.</p><button class="btn pri" data-a="freeEnd">Oyunu bitir</button><button class="btn" data-a="mCancel">Devam et</button>')},
freeEnd:function(){freeFinish('quit')},
freeBack:function(){var f=S.free;if(!f)return;var k=f.keep;closeModal();clearInterval(S.cdt);S.sim=k.sim;S.simSer=k.simSer;S.simTab=k.simTab;S.tabT=k.tabT;S.tabSince=k.tabSince;S.newsSeen=k.newsSeen;S.simRange=k.simRange;S.simDetail=k.simDetail;S.scrubDay=k.scrubDay;
 S.simTrade=null;S.simWhy=null;S.simCd=null;S.free=null;S.stage=k.stage||'end';render();window.scrollTo(0,0)},
simStart:function(){if(S.readMs==null)S.readMs=S.readT0?Date.now()-S.readT0:null;S.phase='sim';simInit();S.simTab='p';S.tabT={p:0,m:0,a:0};S.tabSince=Date.now();log('sim_start',{readMs:S.readMs});S.stage='sim';saveSnap();flush();render()},
simTab:function(v){if(v===S.simTab&&!S.simDetail)return;tabTick();log('sim_tab',{from:S.simTab,to:v,tick:S.sim.tick});S.simTab=v;S.simDetail=null;if(v==='m'){var nn=simNewsAt(S.sim.tick);S.newsSeen=nn?nn[0]:0}render()},
// Hisse detay sayfası: piyasa akmaya devam eder; işlem penceresi açılınca durur
simDetail:function(k){S.simDetail=k;S.scrubDay=null;log('sim_detail',{k:k,tick:S.sim.tick});document.getElementById('view').scrollTop=0;render()},
simBack:function(){S.simDetail=null;S.scrubDay=null;render()},
simRange:function(v){S.simRange=+v;render()},
postStart:function(){log('task_start',{block:'post'});S.phase='post';S.block='post';S.ti=0;S.tr={mode:'main',i:0};S.stage='task';startTrial()},
// ── Simülatör işlemleri ──
// ── Simülatör işlem penceresi: yön + elle lot ──
simOpen:function(v){if(S.sim.tick>=simLim())return;var p=String(v).split('|'),k=p[0],o=S.sim.pos[k],side=p[1]||(o&&o.q>0?'S':'B');
S.simTrade={k:k,t0:Date.now(),side:side,q:0,mode:null,edits:0};log('sim_open',{k:k,side:side});openModal(simTradeHtml(k))},
simClose:function(){S.simTrade=null;S.simWhy=null;closeModal()},
simSide:function(v){var t=S.simTrade;if(!t||t.side===v)return;t.side=v;t.q=0;t.mode=null;t.edits++;var i=$('simq');if(i)i.value='';updTrade()},
// Miktar düğmeleri: −/+ bir lot; %25/%50/%75/Tümü = alınabilecek ya da satılabilecek en fazla lotun oranı
simQty:function(v){var t=S.simTrade;if(!t)return;var c=tradeCalc(),q=t.q||0;
if(v==='+1')q=Math.min(c.lim,q+1);else if(v==='-1')q=Math.max(0,q-1);else{var f={p25:0.25,p50:0.5,p75:0.75}[v];q=c.lim<1?0:(v==='max'?c.lim:Math.max(1,Math.floor(c.lim*f)))}
t.q=q;t.mode=(v==='+1'||v==='-1')?'step':'chip';t.edits++;var i=$('simq');if(i)i.value=q||'';updTrade()},
// Onay: alışta doğrudan işlem; satışta önce gerekçe (iki gruba da), sonra A grubunda zarardaysa bekleme
simGo:function(){var t=S.simTrade;if(!t)return;var c=tradeCalc();if(c.q<1||c.over)return;
if(c.sell&&S.free)doSimSell(t.k,c.q,false);else if(c.sell){S.simWhy={k:t.k,q:c.q};$('mbox').innerHTML=simWhyHtml(t.k,c.q)}else doSimBuy(t.k,c.q)},
simWhyBack:function(){var k=S.simWhy.k;S.simWhy=null;$('mbox').innerHTML=simTradeHtml(k)},
simWhy:function(i){var w=S.simWhy;w.why=SELL_WHY[+i];ACT.simSellGo()},
// A grubu: zararına satış önce bekleme ekranına gider (müdahale SADECE burada)
simSellGo:function(){var w=S.simWhy,k=w.k,q=w.q,m=S.sim,o=m.pos[k],pl=o?m.p[k]/o.avg-1:0;
if(!DEMO&&!S.prac&&!S.free&&S.grp==='A'&&pl<=CFG.lossThreshold){var c=S.cd=S.cd||{n:0,v:0,g:0};c.n++;S.simCd={k:k,q:q,left:CFG.cooldownSec,t0:Date.now()};log('cooldown_shown',{k:k,pl:Math.round(pl*10000)/10000,tick:m.tick,why:w.why,q:q});
 $('mbox').innerHTML=simCoolHtml(k,pl*100);clearInterval(S.cdt);
 S.cdt=setInterval(function(){if(!S.simCd){clearInterval(S.cdt);return}S.simCd.left--;setTxt('cdn',String(Math.max(0,S.simCd.left)));if(S.simCd.left<=0){clearInterval(S.cdt);var g=$('cdg');if(g)g.disabled=false}},1000);return}
doSimSell(k,q,false)},
// Vazgeçince aynı miktar ve yönle işlem penceresine dönülür (istersen miktarı değiştirirsin)
simCdBack:function(){var c=S.simCd;S.cd.v++;clearInterval(S.cdt);log('cooldown_cancel',{k:c.k,waitedMs:Date.now()-c.t0});S.simCd=null;S.simWhy=null;$('mbox').innerHTML=simTradeHtml(c.k)},
simCdGo:function(){var c=S.simCd;if(!c||c.left>0)return;S.cd.g++;clearInterval(S.cdt);log('cooldown_proceed',{k:c.k,waitedMs:Date.now()-c.t0});S.simCd=null;doSimSell(c.k,c.q,true)},
// ── Rehberli tur ──
tourNext:function(){var t=S.tour;if(!t)return;S.tourSeen[t.steps[t.i][0]]=1;if(t.i+1>=t.steps.length)return endTour(false);t.i++;applyTour()},
tourSkip:function(){endTour(true)},
// ── Anlama kontrolü: ilk denemedeki doğruluk kaydedilir ──
quiz:function(v){var c=S.comp,q=compQ(c.i);if(c.sel===q.a)return;v=+v;if(c.first[c.i]==null)c.first[c.i]=v===q.a;c.att[c.i]=(c.att[c.i]||0)+1;c.sel=v;
log('comprehension_answer',{q:c.i,choice:v,correct:v===q.a});render()},
quizNext:function(){var c=S.comp;log('comprehension',{q:c.i,form:(c.f||[])[c.i]||0,firstCorrect:c.first[c.i],attempts:c.att[c.i]});c.i++;c.sel=null;
if(c.i>=COMP.length){c.score=c.first.filter(Boolean).length;Store.saveP(S.code,{comp:c.score}).catch(function(){});S.practiced=true;S.tr.phase='ready';saveSnap();flush()}render()},
// ── Sözlük ──
term:function(v){var i=+v;if(!(i>=0&&i<GLOSSARY.length))return;log('term_open',{k:GLOSSARY[i][0],stage:S.stage});openModal(termHtml(i))},
help:function(){S.helpN=(S.helpN||0)+1;log('help_open',{stage:S.stage});openModal(helpHtml())},
cardMake:function(){cardMake()},
guess:function(){var g=($('gq')||{}).value||'';S.guess=g.trim().slice(0,400);log('purpose_guess',{len:S.guess.length});Store.saveP(S.code,{guess:S.guess}).catch(function(){});flush();render()},
guessSkip:function(){S.guess='';Store.saveP(S.code,{guess:''}).catch(function(){});render()},
// ── Karar ──
choose:function(v){if(S.tr&&S.tr.phase==='choose')choose(v)},
next:nextAfterOutcome,
// Gerginlik: her bölümün sonunda. Sonra bir sonraki bölüme geçilir
stress:function(v){var k=S.stressKey,val=+v||null;S.pulses[k]={v:val,ms:Date.now()-(S.stressT0||Date.now())};log('stress_rating',{block:k,value:val,skipped:!val});
if(k==='b_pre'){S.stage='bridge';S.bridge='sim';S.readT0=Date.now();saveSnap();render();return}
if(k==='b_sim'){S.phase='post';S.block='post';S.ti=0;S.stage='bridge';S.bridge='post';saveSnap();render();return}
saveSnap();endSession()},
// ── Bitiş ──
fbPick:function(v){var p=String(v).split('|');if(!FB_Q.some(function(q){return q[0]===p[0]&&q[2].indexOf(p[1])>=0}))return;S.fbD=S.fbD||{};S.fbD[p[0]]=S.fbD[p[0]]===p[1]?null:p[1];render()},
fbSend:function(){saveFb(false)},
fbSkip:function(){saveFb(true)},
manip:function(v){S.manip=v;log('manipulation_check',{answer:v});Store.saveP(S.code,{manip:v}).catch(function(){});flush();render()},
film:function(){S.filmP=0;startFilm()},
// ── Menü, çekilme, cihaz değiştirme ──
menu:function(){openModal(menuHtml())},
withdraw:function(){askConfirm('Çalışmadan çekil','Bu koda ait tüm verilerin analizden çıkarılacak ve silinecek. Bu kodla tekrar giriş yapamayacaksın.','Çekil ve sil',true,doWithdraw)},
// Önce kayıt gönderilir; sonra bu cihaz kodu unutur ve yazmayı bırakır (iki cihaz aynı kayda yazmasın)
moveDev:function(){askConfirm('Başka cihazda devam et','Kararların kaydedilip bu cihazda kapatılacak. Ardından yeni cihazınla okutacağın bir QR göreceksin.','Devam',false,async function(){
log('device_transfer',{ti:S.ti,phase:S.phase});clearInterval(S.cdt);await saveSnap();await flush();S.movedCode=S.code;remember(null);S.code=null;S.tr=null;S.stage='moved';render()})},
moveBack:function(){enterCode(S.movedCode)},
mOk:function(){var f=S._ok;S._ok=null;closeModal();if(f)f()},
mCancel:function(){if(S.simCd){ACT.simCdBack();return}S.simTrade=null;S.simWhy=null;S._ok=null;closeModal()},
// ── Görünüm ──
fs:function(v){var n=+v;if([0,1,2].indexOf(n)<0)return;var d=document.documentElement;if(n)d.setAttribute('data-fs',String(n));else d.removeAttribute('data-fs');try{localStorage.setItem('ilklot:fs',String(n))}catch(e){}
 document.querySelectorAll('[data-a=fs]').forEach(function(b){var on=+b.dataset.v===n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});log('fs_set',{level:n})},
theme:function(){var d=document.documentElement,n=d.getAttribute('data-theme')==='dark'?'light':'dark';d.setAttribute('data-theme',n);try{localStorage.setItem('ilklot:theme',n)}catch(e){}log('theme_set',{theme:n})},
// Logoya 5 kez dokununca araştırmacı paneli ayrı bir ekranda açılır; kapatınca kalınan yere dönülür
logo:function(){if(DEMO)return;var now=Date.now();taps=taps.filter(function(t){return now-t<2500});taps.push(now);if(taps.length>=5){taps=[];if(S.stage!=='admin'){S.adminPrev=S.stage;S.stage='admin'}render()}},
adminClose:function(){S.stage=S.adminPrev||'consent';render()}};
for(var _k in ADMIN_ACT)ACT[_k]=ADMIN_ACT[_k];

// Pilot geri bildirimi: hiçbiri seçilmeden gönderilirse atlama sayılır. Atlayan da bir daha sorulmaz.
function saveFb(skip){if(!PILOT||!S.code||S.fb)return;var d=S.fbD||{};if(!skip&&!d.clear&&!d.dur&&!d.unease)skip=true;
var o=skip?{skip:1}:{clear:d.clear?+d.clear:null,dur:d.dur||null,unease:d.unease||null};o.at=new Date().toISOString();S.fb=o;
log('pilot_feedback',o);Store.saveP(S.code,{fb:o}).catch(function(){});flush();render()}

// Hisse grafiğinde parmakla (ya da fareyle) gezme: o günün fiyatı gösterilir. Bırakılınca 1,5 sn sonra kaybolur.
// Hareketler tek tek kaydedilmez; jest bitince tek olay (sim_chart_scrub: k, moves, ms, tick)
var scrubT=null,scrubG=null;
function scrubAt(e){var sv=document.querySelector('#dchart svg');if(!sv||!S.sim||!S.simDetail)return;var r=sv.getBoundingClientRect();if(!r.width)return;
var m=S.sim,k=S.simDetail,n=Math.min(S.simRange,m.h[k].length),i=Math.round(Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))*(n-1));
S.scrubDay=m.tick-(n-1-i);if(scrubG)scrubG.moves++;var dc=$('dchart');if(dc)dc.innerHTML=detailChart(k)}
function scrubEnd(){clearTimeout(scrubT);scrubT=null;if(scrubG&&scrubG.moves>2)log('sim_chart_scrub',{k:S.simDetail,moves:scrubG.moves,ms:Date.now()-scrubG.t0,tick:S.sim?S.sim.tick:null});scrubG=null;
scrubT=setTimeout(function(){scrubT=null;S.scrubDay=null;var dc=$('dchart');if(dc&&S.simDetail&&S.sim)dc.innerHTML=detailChart(S.simDetail)},1500)}
document.addEventListener('pointerdown',function(e){if(!e.target.closest||!e.target.closest('#dchart'))return;clearTimeout(scrubT);scrubG={moves:0,t0:Date.now()};scrubAt(e)});
document.addEventListener('pointermove',function(e){var inC=e.target.closest&&e.target.closest('#dchart');
if(!inC){if(e.pointerType==='mouse'&&!scrubG&&S.scrubDay!=null&&!scrubT)scrubEnd();return}
if(e.pointerType==='mouse'&&!scrubG&&e.buttons===0){clearTimeout(scrubT);scrubT=null;scrubAt(e);return}if(scrubG)scrubAt(e)});
document.addEventListener('pointerup',function(){if(scrubG||S.scrubDay!=null)scrubEnd()});
document.addEventListener('pointercancel',function(){if(scrubG||S.scrubDay!=null)scrubEnd()});

// ═════════════════ OLAYLAR ═════════════════
document.addEventListener('click',function(e){var t=e.target.closest('[data-a]');if(!t)return;var f=ACT[t.dataset.a];if(f){e.preventDefault();f(t.dataset.v,t)}});
document.addEventListener('input',function(e){var k=e.target.dataset&&e.target.dataset.in;if(!k)return;var v=e.target.value;
if(k==='code'){S.codeErr='';if(e.isComposing){S.codeIn=v;return}var f=fmtCodeInput(v);if(f!==v)e.target.value=f;S.codeIn=f}
else if(k==='simq'){var dg=v.replace(/\D/g,'').slice(0,6);if(dg!==v)e.target.value=dg;if(S.simTrade){S.simTrade.q=dg===''?0:parseInt(dg,10);S.simTrade.mode='typed';S.simTrade.edits++;updTrade()}}
else if(k==='consentOk'){S.consentChk=e.target.checked;var cb=$('cbtn');if(cb)cb.disabled=!S.consentChk||!!S.busy}
else if(k==='dashAuto'){S.dashAuto=e.target.checked}else if(k==='baseIn'){S.baseIn=v}else if(k==='landIn'){S.landIn=v}else if(k==='posterMail'){S.posterMail=v}else if(k==='posterFoot'){S.posterFoot=v}});
// Onam ayrıntılarından hangileri açıldı (okuma göstergesi). 'toggle' kabarcıklanmaz: yakalama aşamasında dinlenir
document.addEventListener('toggle',function(e){var d=e.target;if(d&&d.dataset&&d.dataset.cs){S.consentOpen=S.consentOpen||{};S.consentOpen[d.dataset.cs]=1}},true);
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&e.target.id==='ci')enterCode(e.target.value)});
document.addEventListener('compositionend',function(e){if(e.target&&e.target.id==='ci'){var f=fmtCodeInput(e.target.value);e.target.value=f;S.codeIn=f}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('modal').classList.contains('open'))ACT.mCancel()});
// Sekme gizlenince: karar süresi ölçümü için işaretlenir, durum kaydedilir
document.addEventListener('visibilitychange',function(){if(document.hidden)S.lastHiddenAt=Date.now();if(!S.code)return;log(document.hidden?'hidden':'visible',{});if(document.hidden){saveSnap();flush()}});
addEventListener('pagehide',function(){if(S.code){saveSnap();flush()}});
setInterval(function(){if(S.code&&EVQ.length)flush()},15000);
// Pano otomatik yenileme: yalnızca panel açıkken ve bir kutuya yazılmıyorsa (yazılan alanlar silinmesin)
function dashAutoTick(){if(!S.dashAuto||S.stage!=='admin'||S.dashBusy||!S.dash)return false;var a=document.activeElement;if(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&a.type!=='checkbox')return false;loadDash();return true}
setInterval(dashAutoTick,30000);  // Bağlantı kopmuşsa kuyruğu düzenli dene

// ═════════════════ MODAL ═════════════════
// Odak yönetimi: pencere açılınca odak pencerenin kutusuna (klavye ve ekran okuyucu için), kapanınca eski yerine döner.
// Kutuya odaklanılır, ilk düğmeye değil: alan içeren pencerelerde mobil klavye kendiliğinden açılmasın.
function openModal(h){var m=$('modal'),bx=$('mbox');if(!m.classList.contains('open')){var a=document.activeElement;S._focusBack=a&&a!==document.body?a:null}
bx.innerHTML=h;m.classList.add('open');var t=bx.querySelector('h2');if(t){t.id='mtitle';m.setAttribute('aria-labelledby','mtitle')}
bx.setAttribute('tabindex','-1');try{bx.focus({preventScroll:true})}catch(e){}}
function closeModal(){$('modal').classList.remove('open');$('mbox').innerHTML='';var f=S._focusBack;S._focusBack=null;
if(f&&document.contains(f)&&f.focus){try{f.focus({preventScroll:true})}catch(e){}}}
// Tarayıcının confirm() kutusu çerçeve içinde engellenebildiği için kendi onay penceremiz
function askConfirm(title,text,okLabel,danger,fn){S._ok=fn;openModal('<h2>'+esc(title)+'</h2><p>'+esc(text)+'</p><button class="btn '+(danger?'danger':'pri')+'" data-a="mOk">'+esc(okLabel)+'</button><button class="btn" data-a="mCancel">Vazgeç</button>')}
async function doWithdraw(){var c=S.code,g=S.grp;remember(null);S.allocCache=null;try{await Store.withdraw(c,g)}catch(e){note('Çekilme kaydedilemedi, bağlantını kontrol edip tekrar dene.');return}
try{localStorage.removeItem('ilklot:q:'+c);localStorage.removeItem('ilklot:evn:'+c)}catch(e){}clearInterval(S.cdt);EVQ=[];S.code=null;S.ended=true;S.tr=null;S.stage='withdrawn';render()}

// Yazı boyutu (b22 geri geldi): kayıtlı tercih 'ilklot:fs' (0/1/2); geçersiz değer yok sayılır. Bir arayüz ayarıdır, katılımcı verisi değil.
(function(){var f=null;try{f=localStorage.getItem('ilklot:fs')}catch(e){}
if(f==='1'||f==='2')document.documentElement.setAttribute('data-fs',f)})();
// Tema: kayıtlı tercih > görüntüleyicinin verdiği data-theme > cihazın teması. Tercih bir arayüz ayarıdır (katılımcı verisi değil).
(function(){var t=null;try{t=localStorage.getItem('ilklot:theme')}catch(e){}
if(t!=='light'&&t!=='dark'){t=null;if(!document.documentElement.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches)t='dark'}
if(t)document.documentElement.setAttribute('data-theme',t)})();
var storeReady=Store.init();
render();boot();
</script>
</body>
</html>
