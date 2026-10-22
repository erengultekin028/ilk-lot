
// ═════════════════ GÖREV EKRANLARI ═════════════════
function curTrial(){return S.tr.mode==='practice'?PR[S.tr.i]:BT()[S.ti]}
var CH={sat:['Sat','Hissenin tamamını sat, parayı al'],tut:['Tut','Bir şey yapma, hisse sende kalsın'],al:['Daha al','₺'+fmt(CFG.addAmount,0)+'\'lik daha al']};

function progressHtml(){var tr=S.tr;
if(tr.mode==='practice')return '<div class="mu sm" style="margin:2px 0 8px;font-weight:600">Alıştırma '+(tr.i+1)+' / '+PR.length+'</div>';
return '<div class="steps" aria-label="Karar '+(S.ti+1)+' / '+BT().length+'" style="gap:3px">'+BT().map(function(_,k){return '<i class="'+(k<=S.ti?'on':'')+'"></i>'}).join('')+'</div>'}

// Son 30 işlem günü: alan grafiği. Renk son haftanın yönüne göre
function trialChart(t){var a=t.path,mn=Math.min.apply(0,a),mx=Math.max.apply(0,a),rg=(mx-mn)||1,W=320,H=96,pd=8,
pt=a.map(function(v,i){return [i/(a.length-1)*W,pd+(H-2*pd)*(1-(v-mn)/rg)]}),up=weekCh(t)>=0,col=up?'var(--up)':'var(--dn)',
ln=pt.map(function(q){return q[0].toFixed(1)+','+q[1].toFixed(1)}).join(' ');
return '<svg viewBox="0 0 '+W+' '+(H+12)+'" width="100%" role="img" aria-label="'+esc(t.sym)+' son 30 işlem günü fiyat grafiği"><rect x="'+(W*25/29-4).toFixed(1)+'" y="0" width="'+(W*4/29+8).toFixed(1)+'" height="'+H+'" fill="var(--sf2)" rx="4"/><polygon points="0,'+H+' '+ln+' '+W+','+H+'" fill="'+col+'" opacity=".12"/><polyline points="'+ln+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><text x="2" y="'+(H+11)+'" font-size="9" fill="var(--mu)">30 gün önce</text><text x="'+W+'" y="'+(H+11)+'" font-size="9" text-anchor="end" fill="var(--mu)">bugün · gri alan: son hafta</text></svg>'}

function chooseHtml(t){var price=t.path[t.path.length-1],wk=weekCh(t),cost=CFG.stake/(1+t.pl),diff=CFG.stake-cost;
var h='<div style="padding-top:4px">'+progressHtml();
h+='<div class="sec" id="tc"><div class="sb" style="padding-top:14px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><div style="font:700 21px var(--fd)">'+esc(t.sym)+'</div><div class="mu sm">'+esc(t.sector)+'</div></div><div style="text-align:right"><div class="num" style="font:700 21px var(--fd)">₺'+fmt(price)+'</div><span class="dir '+cls(wk)+'">'+chg(wk)+' bu hafta</span></div></div><div style="margin-top:10px">'+trialChart(t)+'</div></div></div>';
h+='<div id="tpos">'+sec('Elindeki hisse','<div class="kv"><span>Şu anki değeri</span><b>₺'+fmt(CFG.stake,0)+'</b></div><div class="kv"><span>'+trm(4,'Bu hisse için ödediğin')+'</span><b>₺'+fmt(cost,0)+'</b></div><div class="kv" style="align-items:center"><span>'+trm(5,'Kârın / zararın')+'</span><span class="dir '+cls(t.pl)+'" style="margin:0">'+chg(t.pl*100)+' ('+(diff>=0?'+':'')+tl(diff)+')</span></div>')+'</div>';
if(t.news)h+='<div class="note info" id="tnews" style="color:var(--tx)"><span><b>Haber:</b> '+esc(t.news)+'</span></div>';
if(t.crowd!=null)h+='<div class="sec" id="tcrowd"><div class="sb" style="padding-top:12px"><div class="kv" style="padding-top:0"><span>Bugün bu hisseyle işlem yapanların</span><b>%'+t.crowd+'\'i satıyor</b></div><div class="stack" style="height:8px;margin:4px 0 0"><i style="width:'+t.crowd+'%;background:var(--dn)"></i><i style="width:'+(100-t.crowd)+'%;background:var(--up)"></i></div></div></div>';
// Üç seçenek aynı görünümde: hiçbiri "doğru" ya da "tehlikeli" gibi kodlanmaz
h+='<div class="q" style="margin-top:4px">Ne yapacaksın?</div><div class="choices" id="tch">'+['sat','tut','al'].map(function(c){return '<button class="choice" data-a="choose" data-v="'+c+'"><b>'+CH[c][0]+'</b><span>'+CH[c][1]+'</span></button>'}).join('')+'</div>';
return h+'<p class="foot" style="margin-top:14px">Sonuç bir hafta sonrası olarak hemen gösterilecek. Şirket adı gerçek; grafik, haber ve sonuç kurgusaldır.</p></div>'}

function coolHtml(t){return '<div class="stage" style="justify-content:flex-start;padding-top:28px;text-align:center"><h1 style="font-size:28px;margin-top:0">Bir dakika dur</h1><p>Zararına satmak üzeresin ('+chg(t.pl*100)+'). Satış nedenin plan mı, haber mi, yoksa korku mu?</p><div class="count" id="cdn">'+Math.max(0,S.tr.cdLeft)+'</div><button class="btn pri" data-a="cdBack">Vazgeç, yeniden düşün</button><button class="btn" id="cdg" data-a="cdGo"'+(S.tr.cdLeft>0?' disabled':'')+'>Satışı onayla</button></div>'}

function outcomeHtml(t,d){var up=t.out>=0,lbl={sat:'Sattın',tut:'Tuttun',al:'Daha aldın'}[d.final],
oc='<b class="'+cls(t.out)+'">'+chg(t.out*100)+'</b>',why=d.final==='sat'?'Sattığın için fiyat değişimi seni etkilemedi.':d.final==='tut'?'₺'+fmt(CFG.stake,0)+' × '+oc:'₺'+fmt(CFG.stake+CFG.addAmount,0)+' × '+oc;
return '<div class="stage" style="justify-content:flex-start;padding-top:22px">'+progressHtml()+'<p class="mu" style="margin:10px 0 0">Bir hafta sonra</p><div class="giant" style="color:var(--'+(up?'up':'dn')+')"><span class="ar" aria-hidden="true">'+(up?'▲':'▼')+'</span> '+fmt(Math.abs(t.out*100))+'%<span class="sr-only">'+(up?' yükseliş':' düşüş')+'</span></div><p style="margin-top:8px">'+esc(t.sym)+' bir haftada %'+fmt(Math.abs(t.out*100))+' '+(up?'yükseldi':'düştü')+'.</p>'+
sec(lbl,'<div class="kv"><span>Bu karardan sonucun</span><b class="'+cls(d.res)+'">'+(d.res>=0?'+':'')+tl(d.res)+'</b></div><p class="mu sm" style="margin:2px 0 0">'+why+'</p>'+'')+
'<button class="btn pri" data-a="next">'+(S.tr.mode==='practice'?'Devam':S.ti>=BT().length?'Bölümü bitir':'Sonraki karar')+'</button></div>'}

function stressHtml(){return '<div class="stage"><h1 style="font-size:26px">Kısa bir soru</h1><p>Şu an ne kadar gergin hissediyorsun?</p><div class="scale">'+[1,2,3,4,5].map(function(n){return '<button data-a="stress" data-v="'+n+'">'+n+'</button>'}).join('')+'</div><div class="scale-l"><span>Hiç gergin değilim</span><span>Çok gerginim</span></div><button class="link" style="width:100%;margin-top:12px" data-a="stress" data-v="0">Cevaplamak istemiyorum</button></div>'}

// Anlama kontrolü: yanlışta açıklama gösterilir ve aynı soru tekrar sorulur
function quizHtml(){var c=S.comp,q=compQ(c.i),h='<div class="stage" style="justify-content:flex-start;padding-top:24px"><div class="mu sm" style="font-weight:700">Kısa kontrol · '+(c.i+1)+' / '+COMP.length+'</div><h1 style="font-size:24px;margin:10px 0 14px">'+esc(q.q)+'</h1>';
h+=q.o.map(function(o,j){var st=c.sel===j?(j===q.a?' ok':' no'):'';return '<button class="opt'+st+'" data-a="quiz" data-v="'+j+'"'+(c.sel===q.a?' disabled':'')+'>'+esc(o)+'</button>'}).join('');
if(c.sel!=null&&c.sel!==q.a)h+='<div class="err" role="alert">'+esc(q.e)+' Tekrar dene.</div>';
if(c.sel===q.a)h+='<div class="okmsg" role="status">Doğru. '+esc(q.e)+'</div><button class="btn pri" style="margin-top:14px" data-a="quizNext">'+(c.i+1<COMP.length?'Sonraki soru':'Devam')+'</button>';
return h+'</div>'}
function vTask(){var tr=S.tr,t=curTrial();
if(tr.phase==='ready')return '<div class="stage"><div class="mu sm" style="font-weight:700">1. bölüm</div><h1>Hazırsın</h1><p>Şimdi '+BT().length+' karar başlıyor. Bundan sonraki kararların kaydedilir.</p><div class="note info"><span>Her karar ayrı bir hisseyle ilgilidir; bir öncekinin sonucu sonrakini etkilemez. Kendi bildiğin gibi karar ver.</span></div><button class="btn pri" data-a="startMain">Başla</button></div>';
if(tr.phase==='quiz')return quizHtml();
if(tr.phase==='outcome')return outcomeHtml((tr.mode==='practice'?PR:BT()).filter(function(x){return x.id===tr.last.id})[0],tr.last);
if(tr.phase==='cool')return coolHtml(t);
return chooseHtml(t)}

// ───────────────── Kararlarının filmi ─────────────────
// Sonda: ön ve son görevdeki kararlar yan yana. Ortada simülatör ayracı; sert düşüş anları gölgeli
var FW=340,FH=170,FP={l:10,r:10,t:22,b:20},filmRAF=null,filmD=null,FCOL={sat:'#C2412D',tut:'#8C93A3',al:'#1E8A5E'};
function filmData(){var D=S.dec,n=D.length,gap=1.2,B=TRS.X.length,X=function(i){var u=i+(i>=B?gap:0),tot=n+(n>B?gap:0);return FP.l+(FW-FP.l-FP.r)*(u+0.5)/Math.max(1,tot)};
return {n:n,X:X,y:function(d){return d.final==='sat'?FP.t+18:d.final==='tut'?FP.t+62:FP.t+106}}}
function filmHtml(){if(!S.dec.length)return '';var d=filmData(),bw=(FW-FP.l-FP.r)/(d.n+1.2);
var h='<div class="film"><div class="ft"><b>Kararlarının filmi</b><button class="link" style="padding:0;color:var(--act)" data-a="film">Tekrar oynat</button></div><svg viewBox="0 0 '+FW+' '+FH+'" width="100%" role="img" aria-label="Ön ve son görevdeki kararların"><defs><clipPath id="fclip"><rect id="fcr" x="0" y="0" width="0" height="'+FH+'"/></clipPath></defs>';
['Sat','Tut','Daha al'].forEach(function(l,i){var y=FP.t+18+i*44;h+='<line x1="'+FP.l+'" x2="'+(FW-FP.r)+'" y1="'+y+'" y2="'+y+'" stroke="currentColor" stroke-opacity=".08"/>'});
S.dec.forEach(function(x,i){if(x.kind==='kriz'&&x.pos==='zarar')h+='<rect x="'+(d.X(i)-bw/2+1).toFixed(1)+'" y="'+(FP.t-4)+'" width="'+(bw-2).toFixed(1)+'" height="'+(FH-FP.t-FP.b+8)+'" fill="#C2412D" opacity=".09" rx="3"/>'});
var B=TRS.X.length;if(d.n>B){var gx=(d.X(B-1)+d.X(B))/2;h+='<line x1="'+gx+'" x2="'+gx+'" y1="'+(FP.t-6)+'" y2="'+(FH-FP.b+4)+'" stroke="var(--ac)" stroke-dasharray="3 3" stroke-opacity=".6"/><text x="'+gx+'" y="12" font-size="9" text-anchor="middle" fill="var(--act)" font-weight="700">simülatör</text>'}
h+='<text x="'+FP.l+'" y="12" font-size="9" fill="currentColor" fill-opacity=".55">1. bölüm</text><text x="'+(FW-FP.r)+'" y="12" font-size="9" text-anchor="end" fill="currentColor" fill-opacity=".55">3. bölüm</text>';
S.dec.forEach(function(x,i){var cx=d.X(i),cy=d.y(x);h+='<g class="mk off" data-t="'+(i+1)+'"><circle cx="'+cx.toFixed(1)+'" cy="'+cy+'" r="8" fill="'+FCOL[x.final]+'" opacity=".18"/><circle cx="'+cx.toFixed(1)+'" cy="'+cy+'" r="4.6" fill="'+FCOL[x.final]+'" stroke="var(--sf)" stroke-width="1.5"/></g>'});
h+='<line id="fph" x1="0" x2="0" y1="'+(FP.t-6)+'" y2="'+(FH-FP.b+4)+'" stroke="var(--fl)" stroke-opacity=".5"/>';
['Sat','Tut','Daha al'].forEach(function(l,i){h+='<text x="'+(FW-FP.r)+'" y="'+(FP.t+14+i*44)+'" font-size="8.5" text-anchor="end" fill="currentColor" fill-opacity=".45">'+l+'</text>'});
return h+'</svg><div class="cap" id="fcap" aria-live="polite"></div><div class="lg"><span><i style="width:10px;height:8px;background:rgba(194,65,45,.25);display:inline-block;border-radius:2px"></i>Sert düşüş ve zarar anı</span></div></div>'}
function filmFrame(p){var r=$('fcr');if(!r)return false;p=Math.max(0,Math.min(1,p));var d=filmD,k=Math.max(0,Math.min(d.n,Math.floor(p*d.n+1e-9))),x=k>=d.n?FW:d.X(Math.max(0,k-1))+6;
var ph=$('fph');ph.setAttribute('x1',x);ph.setAttribute('x2',x);
document.querySelectorAll('.film .mk').forEach(function(m){m.classList.toggle('off',+m.dataset.t>k)});
var txt,col;if(k>=d.n){var cl=function(b){var a=S.dec.filter(function(x){return x.block===b&&x.kind==='kriz'&&x.pos==='zarar'});return a.filter(function(x){return x.final==='sat'}).length+'/'+a.length};txt='Sert düşüş + zararda satış: 1. bölüm '+cl('pre')+', 3. bölüm '+cl('post');col='var(--fl)'}
else if(k===0){txt='1. bölüm başlıyor';col='var(--mu)'}
else{var x2=S.dec[k-1];txt=(x2.block==='pre'?'1. bölüm':'3. bölüm')+' · '+x2.sym+': '+{sat:'sattın',tut:'tuttun',al:'daha aldın'}[x2.final]+(x2.kind==='kriz'?' (sert düşüş, ':' (')+(x2.pos==='kar'?'kârdaydın)':'zarardaydın)');col=FCOL[x2.final]}
var el=$('fcap'),html='<i style="background:'+col+'"></i><span>'+esc(txt)+'</span>';if(el._h!==html){el.innerHTML=html;el._h=html}return true}
function startFilm(){if(!$('fcr'))return;filmD=filmData();cancelAnimationFrame(filmRAF);
if(matchMedia('(prefers-reduced-motion: reduce)').matches){S.filmP=1;filmFrame(1);return}
if(S.filmP==null)S.filmP=0;var dur=7000,t0=performance.now()-S.filmP*dur;
(function loop(now){var p=Math.max(0,Math.min(1,(now-t0)/dur));S.filmP=p;if(!filmFrame(p))return;if(p<1)filmRAF=requestAnimationFrame(loop)})(performance.now())}

// ───────────────── Bölüm geçişleri ve gerginlik sorusu ─────────────────
function vStress(){return '<div class="stage"><h1 style="font-size:26px">Kısa bir soru</h1><p>Şu an ne kadar gergin hissediyorsun?</p><div class="scale">'+[1,2,3,4,5].map(function(n){return '<button data-a="stress" data-v="'+n+'">'+n+'</button>'}).join('')+'</div><div class="scale-l"><span>Hiç gergin değilim</span><span>Çok gerginim</span></div><button class="link" style="width:100%;margin-top:12px" data-a="stress" data-v="0">Cevaplamak istemiyorum</button></div>'}
function vBridge(){if(S.bridge==='simready')return '<div class="stage"><div class="mu sm" style="font-weight:700">2. bölüm</div><h1>Alıştırma bitti</h1><p>Şimdi gerçek simülatör başlıyor. Süre '+simMin()+' dakika. Alıştırmadaki işlemler sayılmaz; buradan sonrası sayılır.</p><button class="btn pri" data-a="simStart">Simülatörü başlat</button></div>';
if(S.bridge==='sim'){var tot=CFG.cash0+SIMBASE.length*CFG.posValue;
var facts=[['₺'+fmt(tot,0),'toplam paran'],[SIMBASE.length+' hisse','her biri yaklaşık ₺'+fmt(CFG.posValue,0)],[simMin()+' dk','her '+tickSecText()+' sn bir gün']];
var how=[['Fiyatlar kendiliğinden akar','Sen bir şey yapmasan da zaman ilerler ve fiyatlar değişir. Sağ üstte kalan süre görünür.'],
['Bir hisseye dokun','Fiyat grafiğini görürsün. Oradan <b>Sat</b> ya da <b>Al</b> seçip '+trm(1,'lot adedini')+' kendin yazarsın.'],
['İşlem penceresi açıkken zaman durur','Acele etmene gerek yok. Pencereyi kapatınca zaman kaldığı yerden devam eder.'],
['Almak için nakit gerekir, satmak için hissen','Sattığın hissenin parası nakite eklenir. Elindekinden fazlasını satamaz, nakdinden fazlasını alamazsın.'],
['İşlem yapmak zorunda değilsin','İstediğin kadar işlem yapabilir ya da hiç yapmayabilirsin.']];
var tabs=[['Portföy','hisselerin, nakdin ve işlem düğmeleri'],['Piyasa','haberler ve fiyat grafikleri'],['Analiz','bu bölümdeki işlemlerinin özeti']];
return '<div class="stage"><div class="mu sm" style="font-weight:700">2. bölüm</div><h1>Piyasa simülatörü</h1><p>Şimdi '+simMin()+' dakikalık bir simülatöre geçiyoruz. Önce 30 saniyelik bir alıştırma yapacaksın, sonra gerçek simülatör başlayacak.</p>'+
'<div class="ifacts">'+facts.map(function(f){return '<div><b>'+f[0]+'</b><span>'+f[1]+'</span></div>'}).join('')+'</div>'+
'<p class="mu sm" style="margin:0 0 14px">Başlangıçta paranın bir kısmı hissede, kalanı (₺'+fmt(CFG.cash0,0)+') nakit olarak bekliyor.</p>'+
'<div class="mu sm" style="font-weight:700;margin:6px 0 8px">Nasıl çalışır</div><ol class="how">'+how.map(function(h2){return '<li><b>'+h2[0]+'</b><span>'+h2[1]+'</span></li>'}).join('')+'</ol>'+
'<div class="mu sm" style="font-weight:700;margin:14px 0 8px">Alt çubukta üç sekme var</div><div class="itabs">'+tabs.map(function(t){return '<div><b>'+t[0]+'</b><span>'+t[1]+'</span></div>'}).join('')+'</div>'+
'<div class="note info" style="margin:14px 0 12px"><span><b style="color:var(--tx)">Önemli:</b> Hisse adları gerçek BIST şirketleridir, ama fiyatlar, grafikler ve haberler araştırma için kurgulanmıştır. Bu şirketlerin gerçek durumunu yansıtmaz. Hiçbir kararın doğru ya da yanlış değildir; içerik yatırım tavsiyesi değildir.</span></div>'+
'<div class="mu sm" style="font-weight:700;margin:6px 0 8px">Başlamadan önce kısa bir okuma</div>'+READING.map(function(r){return '<div class="rd"><b>'+r[0]+'</b><p>'+r[1]+'</p></div>'}).join('')+'<button class="btn pri" style="margin-top:6px" data-a="pracStart">Okudum, 30 saniyelik alıştırmaya geç</button><p class="mu sm" style="margin:8px 0 0">Alıştırmada ekranı ve işlem düğmelerini dener, istersen atlayabilirsin. Alıştırmadaki işlemler sayılmaz.</p></div>'}
return '<div class="stage"><div class="mu sm" style="font-weight:700">3. bölüm</div><h1>Son '+BT().length+' karar</h1><p>Simülatör bitti. Şimdi ilk bölümdekine benzer, ama farklı hisselerle '+BT().length+' karar daha vereceksin.</p><button class="btn pri" data-a="postStart">Başla</button></div>'}

// ───────────────── Simülatör ekranı ─────────────────
function simSpark(a,up){var w=64,hh=24,mn=Math.min.apply(0,a),mx=Math.max.apply(0,a),r=(mx-mn)||1;
return '<svg width="'+w+'" height="'+hh+'" aria-hidden="true"><polyline points="'+a.map(function(v,i){return (i/Math.max(1,a.length-1)*w).toFixed(1)+','+(hh-2-(v-mn)/r*(hh-4)).toFixed(1)}).join(' ')+'" fill="none" stroke="'+(up?'var(--up)':'var(--dn)')+'" stroke-width="1.8" stroke-linejoin="round"/></svg>'}
// Sekmeler: Portföy (işlem), Piyasa (haberler + grafikler), Analiz (bu bölümdeki işlemlerin, yargısız)
function simNavHtml(){var ic={p:'<path d="M4 19V9m6 10V5m6 14v-7m4 7H2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',m:'<path d="M3 17l5-6 4 4 7-9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',a:'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 12 18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'};
return [['p','Portföy'],['m','Piyasa'],['a','Analiz']].map(function(t){var on=S.simTab===t[0];var nw=(t[0]==='m'&&newsUnread());return '<button class="'+(on?'on':'')+(nw?' nw':'')+'" data-a="simTab" data-v="'+t[0]+'"'+(on?' aria-current="page"':'')+(nw?' aria-label="Piyasa, yeni haber"':'')+'><svg viewBox="0 0 24 24" aria-hidden="true">'+ic[t[0]]+'</svg>'+t[1]+'</button>'}).join('')}
function vSim(){var m=S.sim,h='<div id="salert"></div>'+(S.free?'<div id="sbanner"></div>':'');
if(S.simDetail)return h+simDetailHtml(S.simDetail);
if(S.simTab==='m')return h+simMarketHtml();
if(S.simTab==='a')return h+'<div id="sana">'+simAnalysisHtml()+'</div>';
var v=simValue(),ch=(v/m.v0-1)*100;
h+='<div class="hero" id="shero" style="padding-bottom:12px"><div class="lbl">'+(S.free?'Serbest mod · '+FREE_LV[S.free.lvl].ad:S.prac?'Alıştırma':'2. bölüm')+' · '+trm(10,'Toplam paran')+' (hisseler + nakit)</div><div class="val" id="sv">₺'+fmt(v,0)+'</div><span class="dir '+cls(ch)+'" id="sch">'+chg(ch)+' başlangıca göre</span><div class="hsub"><span>Hisselerin<b id="sinv">₺'+fmt(v-m.cash,0)+'</b></span><span>'+trm(9,'Nakit')+'<b id="scash">₺'+fmt(m.cash,0)+'</b></span><span>Gün<b id="sday">'+simDayTxt(m)+'</b></span></div></div>';
if(S.free)h+='<div id="sfree">'+freeHtml()+'</div>'+freeSpeedHtml();
h+='<div class="sec" id="salloc"><div class="sb" style="padding-top:12px"><div class="kv" style="padding-top:0"><span style="color:var(--tx);font-weight:700">Dağılım</span><span class="mu sm">toplam paranın yüzdesi</span></div><div id="sallocb">'+allocHtml()+'</div></div></div>';
h+='<div id="snews">'+newsHtml(m.tick)+'</div>';
h+='<div class="sec" id="slist"><div class="sh"><h3>Hisselerin</h3><span class="mu sm">dokunarak işlem yap</span></div><p class="shint">Her hissede: <b>adet × 1 lotun fiyatı = hissenin değeri</b>. '+trm(1,'Lot')+', hisse adedidir.</p>'+SIMBASE.map(function(b2){var k=b2[0];return '<button class="srow" data-a="simDetail" data-v="'+k+'" data-sim="'+k+'"><span class="r1"><span class="t1">'+k+(S.free?'<span class="rnw" hidden>Haber</span>':'')+'<small>'+b2[1]+'</small></span><span class="plb"><b class="rc"></b><span class="pc"></span><small>kâr / zarar</small></span></span><span class="eq"><span class="eqc"><i>Adet</i><b class="sl"></b></span><span class="op" aria-hidden="true">×</span><span class="eqc"><i>1 lot fiyatı</i><b class="sp"></b></span><span class="op" aria-hidden="true">=</span><span class="eqc tot"><i>Değer</i><b class="rp"></b></span></span><span class="avgl">Ortalama alış fiyatın: <b class="sa"></b></span>'+(S.free?'<span class="avgl ordl" hidden></span>':'')+'</button>'}).join('')+'</div>';
return h+(S.prac?'<button class="btn" style="margin:4px 0 10px" data-a="pracSkip">Alıştırmayı bitir, gerçek simülatöre geç</button>':S.free?'<button class="btn" style="margin:4px 0 10px" data-a="freeQuit">Oyunu bitir</button>':'')+'<p class="foot">Şirket adları gerçek; fiyatlar, grafikler ve haberler kurgusaldır ve bu şirketlerin gerçek durumunu yansıtmaz. Yatırım tavsiyesi değildir.</p>'}
// ── Dağılım: her hissenin ve nakdin toplam paraya oranı ──
function allocHtml(){var m=S.sim,v=simValue(),parts=SIMBASE.map(function(b2){var o=m.pos[b2[0]];return [b2[0],o.q*m.p[b2[0]]]}).concat([['Nakit',m.cash]]);
var raw=parts.map(function(x){return x[1]/v*100}),pc=raw.map(Math.floor),rest=100-pc.reduce(function(a,c){return a+c},0);
raw.map(function(r,i){return [r-Math.floor(r),i]}).sort(function(a,c){return c[0]-a[0]}).slice(0,rest).forEach(function(e){pc[e[1]]++});
return '<div class="alloc">'+parts.map(function(x){return x[1]>0?'<i style="width:'+(x[1]/v*100).toFixed(2)+'%;background:'+(x[0]==='Nakit'?SIMCOL.cash:SIMCOL[x[0]])+'" title="'+x[0]+'"></i>':''}).join('')+'</div><div class="alegend">'+parts.map(function(x){return '<span><i style="background:'+(x[0]==='Nakit'?SIMCOL.cash:SIMCOL[x[0]])+'"></i>'+x[0]+' %'+pc[parts.indexOf(x)]+'</span>'}).join('')+'</div>'}
// ── Hisse detay sayfası: büyük grafik (10/30/60 gün), ortalama alış çizgisi, pozisyon, ilgili haberler ──
function detailChart(k){var m=S.sim,a=m.h[k].slice(-S.simRange),o=m.pos[k],avg=o&&o.q>0?o.avg:null,vals=avg?a.concat([avg]):a,
mn=Math.min.apply(0,vals),mx=Math.max.apply(0,vals),rg=(mx-mn)||1,W=320,H=150,pd=10,n=a.length,up=a[a.length-1]>=a[0],col=up?'var(--up)':'var(--dn)',
Y=function(v){return pd+(H-2*pd)*(1-(v-mn)/rg)},pt=a.map(function(v,i){return (n>1?i/(n-1)*W:0).toFixed(1)+','+Y(v).toFixed(1)}).join(' ');
var h='<svg viewBox="0 0 '+W+' '+(H+14)+'" width="100%" role="img" aria-label="'+k+' son '+n+' günlük fiyat grafiği"><polygon points="0,'+H+' '+pt+' '+W+','+H+'" fill="'+col+'" opacity=".1"/><polyline points="'+pt+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linejoin="round"/>';
if(avg)h+='<line x1="0" x2="'+W+'" y1="'+Y(avg).toFixed(1)+'" y2="'+Y(avg).toFixed(1)+'" stroke="var(--ac)" stroke-dasharray="4 4" stroke-width="1.4"/><text x="4" y="'+(Y(avg)-5).toFixed(1)+'" font-size="10" font-weight="700" fill="var(--act)" stroke="var(--sf)" stroke-width="3" paint-order="stroke">ortalama alışın ₺'+fmt(avg)+'</text>';
// Parmakla gezme: S.scrubDay mutlak gün numarasıdır (piyasa akarken işaret aynı güne sabit kalır; pencerenin dışına çıkarsa kaybolur)
var si=S.scrubDay!=null?n-1-(m.tick-S.scrubDay):-1;
if(si>=0&&si<n){var sx=n>1?si/(n-1)*W:0,sy=Y(a[si]),lb='Gün '+S.scrubDay+' · ₺'+fmt(a[si]),an=sx<W*0.28?'start':sx>W*0.72?'end':'middle';
h+='<line x1="'+sx.toFixed(1)+'" x2="'+sx.toFixed(1)+'" y1="'+pd+'" y2="'+H+'" stroke="var(--mu)" stroke-width="1" stroke-dasharray="3 3"/><circle cx="'+sx.toFixed(1)+'" cy="'+sy.toFixed(1)+'" r="4.5" fill="'+col+'" stroke="var(--sf)" stroke-width="2"/><text id="scrublb" x="'+Math.min(W-2,Math.max(2,sx)).toFixed(1)+'" y="11" font-size="11" font-weight="700" text-anchor="'+an+'" fill="var(--tx)" stroke="var(--sf)" stroke-width="3" paint-order="stroke">'+lb+'</text>'}
return h+'<text x="2" y="'+(H+12)+'" font-size="9.5" fill="var(--mu)">'+n+' gün önce</text><text x="'+W+'" y="'+(H+12)+'" font-size="9.5" text-anchor="end" fill="var(--mu)">bugün · en düşük ₺'+fmt(Math.min.apply(0,a))+', en yüksek ₺'+fmt(Math.max.apply(0,a))+'</text></svg>'}
function detailInfo(k){var m=S.sim,o=m.pos[k],p=m.p[k],has=o&&o.q>0,pl=has?(p/o.avg-1)*100:0,d=has?o.q*(p-o.avg):0,ch=(p/m.p0[k]-1)*100;
return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span><b style="font:750 30px var(--fd);letter-spacing:-.6px" class="num">₺'+fmt(p)+'</b><span class="unit">1 lot fiyatı</span></span><span style="text-align:right"><span class="dir '+cls(ch)+'" style="margin:0">'+chg(ch)+'</span><span class="mu" style="display:block;font-size:11px;margin-top:3px">ilk günden beri</span></span></div>'+
'<div class="pos"><div class="ph">Senin pozisyonun</div>'+(has?'<div class="cells c3"><span class="cell"><i>'+trm(1,'Elindeki adet')+'</i><b>'+o.q+' lot</b></span><span class="cell"><i>'+trm(2,'Ort. alış fiyatın')+'</i><b>₺'+fmt(o.avg)+'</b></span><span class="cell"><i>Toplam değeri</i><b>₺'+fmt(o.q*p,0)+'</b></span></div><p class="mu sm" style="margin:8px 0 0">'+o.q+' lot × ₺'+fmt(p)+' (güncel fiyat) = ₺'+fmt(o.q*p,0)+'</p><div class="kv" style="margin-top:6px"><span>'+trm(5,'Kârın / zararın')+'</span><b class="'+cls(pl)+'">'+chg(pl)+' ('+(d>=0?'+':'−')+'₺'+fmt(Math.abs(d),0)+')</b></div>':'<div class="kv"><span>Elindeki adet</span><b>Elinde yok</b></div>')+'</div>'}
function stockNews(k,t){var a=simNewsList().filter(function(x){return x[0]<=t&&x[3].indexOf(k)>=0}).reverse();
return a.length?a.map(function(n){return '<div class="kv" style="align-items:flex-start;gap:10px"><span style="flex:none;font-size:11px;font-weight:700;background:var(--sf2);border-radius:8px;padding:3px 7px">Gün '+n[0]+'</span><span style="flex:1;color:'+(n[2]<0?'var(--dn)':'var(--tx)')+'">'+esc(n[1])+'</span></div>'}).join(''):'<p class="mu sm" style="margin:0">Bu hisseyle ilgili henüz haber yok.</p>'}
function simDetailHtml(k){var m=S.sim,o=m.pos[k],has=o&&o.q>0,bq=Math.floor(CFG.addAmount/m.p[k]);
return '<div class="dhead"><button class="icon" data-a="simBack" aria-label="Geri">‹</button><div><div style="font:700 22px/1.1 var(--fd)">'+k+'</div><div class="mu sm">'+simName(k)+'</div></div></div>'+
'<div class="sec"><div class="sb" style="padding-top:14px"><div id="dinfo">'+detailInfo(k)+'</div><div class="rng">'+[10,30,60].map(function(r){return '<button class="'+(S.simRange===r?'on':'')+'" data-a="simRange" data-v="'+r+'">'+r+' gün</button>'}).join('')+'</div><div id="dchart">'+detailChart(k)+'</div></div></div>'+
'<div class="dact"><button class="btn pri" style="margin:0" data-a="simOpen" data-v="'+k+'|S"'+(has?'':' disabled')+'>Sat</button><button class="btn pri" style="margin:0" data-a="simOpen" data-v="'+k+'|B"'+(m.cash<m.p[k]?' disabled':'')+'>Al</button></div>'+
(S.free?sec('Otomatik sat emri','<div id="dord">'+freeOrderHtml(k)+'</div>'):'')+sec('Bu hisseyle ilgili haberler','<div id="dnews">'+stockNews(k,m.tick)+'</div>')}
function simMarketHtml(){var m=S.sim,h='<div class="sec"><div class="sh"><h3>Haberler</h3><span class="mu sm">en yeni üstte</span></div><div class="sb" id="mnews">'+newsList(m.tick)+'</div></div>';
h+='<div class="mgrid" id="mgrid">'+SIMBASE.map(function(b2){return '<button class="mcard" data-a="simDetail" data-v="'+b2[0]+'" id="mc-'+b2[0]+'"></button>'}).join('')+'</div>';
return h+'<p class="foot">Bir grafiğe dokunarak hissenin ayrıntısını açabilirsin.</p>'}
function newsList(t){var a=simNewsList().filter(function(x){return x[0]<=t}).reverse();return a.map(function(n){return '<div class="kv" style="align-items:flex-start;gap:10px"><span class="nd" style="flex:none;font-size:11px;font-weight:700;background:var(--sf2);border-radius:8px;padding:3px 7px">Gün '+n[0]+'</span><span style="flex:1;color:'+(n[2]<0?'var(--dn)':'var(--tx)')+'">'+esc(n[1])+'</span></div>'}).join('')}
function mcardHtml(k){var m=S.sim,hs=m.h[k],ch=(m.p[k]/m.p0[k]-1)*100,o=m.pos[k],has=o&&o.q>0;
return '<div style="display:flex;justify-content:space-between;align-items:baseline"><b>'+k+'</b><span class="'+cls(ch)+'" style="font-size:12px;font-weight:700">'+chg(ch)+'</span></div><div class="mu">'+simCo(k)+' · ₺'+fmt(m.p[k])+'</div><div style="margin-top:6px">'+simSpark(hs.slice(-40),ch>=0).replace('width="64" height="24"','width="100%" height="40" viewBox="0 0 64 24" preserveAspectRatio="none"')+'</div><div class="mu" style="margin-top:2px">'+(has?'Elinde '+o.q+' lot · ₺'+fmt(o.q*m.p[k],0):'Elinde yok')+'</div>'}
function simAnalysisHtml(){var m=S.sim,T=m.trades,sells=T.filter(function(t){return t.side==='S'}),buys=T.filter(function(t){return t.side==='B'}),v=simValue(),
ls=sells.filter(function(t){return t.pl!=null&&t.pl<=CFG.lossThreshold}).length,row=function(k,val,d){return '<div style="padding:11px 0;border-top:1px solid var(--ln)"><div class="kv" style="padding:0"><span style="color:var(--tx);font-weight:600">'+k+'</span><b>'+val+'</b></div>'+(d?'<div class="mu sm" style="margin-top:2px">'+d+'</div>':'')+'</div>'},
why={};sells.forEach(function(t){if(t.why)why[t.why]=(why[t.why]||0)+1});
return sec('Bu bölümdeki işlemlerin','<p class="mu" style="margin:0 0 6px">Doğru ya da yanlış yok; sadece ne yaptığının özeti.</p>'+
row('Toplam paran','₺'+fmt(v,0),'Başlangıç: ₺'+fmt(m.v0,0))+row('Satış',sells.length+' işlem',ls?ls+' tanesi zarardayken':'')+row('Alım',buys.length+' işlem','')+
(S.free?'':row('Satış gerekçelerin',Object.keys(why).length?Object.keys(why).map(function(w){return w+' ('+why[w]+')'}).join(', '):'-','')))+
sec('İşlem geçmişi','<div class="hist">'+(T.length?T.slice().reverse().map(function(t){var S2=t.side==='S';return '<div class="kv"><span style="flex:none;font-size:11px;font-weight:700;background:var(--sf2);border-radius:8px;padding:3px 7px;color:var(--mu)">Gün '+t.t+'</span><span style="flex:1;color:var(--tx)"><b style="font-weight:700">'+t.sym+'</b> · '+(S2?'Sattın':'Aldın')+' '+t.q+' lot × ₺'+fmt(t.p)+(t.why?'<br><span class="mu sm">'+esc(t.why)+'</span>':'')+'</span><b class="'+(S2?'':'')+'">₺'+fmt(t.q*t.p,0)+'</b></div>'}).join(''):'<p class="mu sm" style="margin:0">Henüz işlem yapmadın.</p>')+'</div>')}

// Canlı güncelleme: sadece değişen metinler (liste zıplamaz)
function newsIsNew(t,n){return !!n&&n[0]>0&&t-n[0]<10}   // "Yeni" rozeti ~15 sn (10 gün) görünür
function newsHtml(t){var n=simNewsAt(t);if(!n)return '';return '<div class="news'+(n[2]<0?' neg':'')+(t-n[0]<3&&n[0]>0?' fresh':'')+'"><div class="nm"><span class="nl">Son haber</span>'+(newsIsNew(t,n)?'<span class="nb">Yeni</span>':'')+'<span class="nd">Gün '+n[0]+'</span></div><p class="nt">'+esc(n[1])+'</p><button class="link nall" data-a="simTab" data-v="m">Tüm haberler</button></div>'}
// Piyasa sekmesinde okunmamış haber noktası: son haberin günü, Piyasa sekmesinde en son görülen günden büyükse
function newsUnread(){var m=S.sim;if(!m||S.simTab==='m')return false;var n=simNewsAt(m.tick);return !!n&&n[0]>(S.newsSeen==null?0:S.newsSeen)}
function newsDot(){var b=document.querySelector('nav [data-a=simTab][data-v=m]');if(!b)return;var u=newsUnread();b.classList.toggle('nw',u);if(u)b.setAttribute('aria-label','Piyasa, yeni haber');else b.removeAttribute('aria-label')}
// Kriz anında Portföy dışındaysa çağrı: kimse krizi kaçırmasın
function simAlert(){var m=S.sim,el=$('salert');if(!el)return;var c=simCrisis(m.tick),h='';
if(c&&S.simTab!=='p'){var n=simNewsAt(m.tick);h='<div class="salert" role="alert"><span>'+esc(n?n[1]:'Sert düşüş')+'</span><button data-a="simTab" data-v="p">Portföye git</button></div>'}
if(el._h!==h){el.innerHTML=h;el._h=h}}
// b25 (yalnızca serbest mod): yeni haber gelince üstte geçici şerit; haberden etkilenen hisse satırında "Haber" işareti.
// Çalışma simülatöründe ve alıştırmada hiç çizilmez (#sbanner yok, S.free yok).
function bnNews(){var m=S.sim;if(!S.free||!m)return null;var n=simNewsAt(m.tick);return n&&newsIsNew(m.tick,n)?n:null}
function simBanner(){var el=$('sbanner');if(!el)return;var m=S.sim,n=bnNews(),h='';
if(n&&S.simTab!=='m'&&n[0]>Math.max(S.free.bn||0,S.newsSeen||0)&&!(simCrisis(m.tick)&&S.simTab!=='p'))h='<div class="sbn'+(n[2]<0?' neg':'')+'" role="status"><button class="sbt" data-a="simTab" data-v="m"><span class="sbl">Yeni haber · Gün '+n[0]+'</span><span class="sbx">'+esc(n[1])+'</span></button><button class="sbc" data-a="bnClose" aria-label="Haberi kapat">×</button></div>';
if(el._h!==h){el.innerHTML=h;el._h=h}}
function simLive(){var m=S.sim;if(!m)return;simAlert();simBanner();newsDot();
if(S.simDetail){var k=S.simDetail,di=$('dinfo'),dc=$('dchart'),dn=$('dnews');if(di)di.innerHTML=detailInfo(k);if(dc)dc.innerHTML=detailChart(k);if(dn){var nh=stockNews(k,m.tick);if(dn._h!==nh){dn.innerHTML=nh;dn._h=nh}}return}
var al=$('sallocb');if(al){var ah=allocHtml();if(al._h!==ah){al.innerHTML=ah;al._h=ah}}
if(S.simTab==='m'){var n0=simNewsAt(m.tick);S.newsSeen=n0?n0[0]:0;var nn=$('mnews');if(nn&&nn._t!==simNewsAt(m.tick)[0]){nn.innerHTML=newsList(m.tick);nn._t=simNewsAt(m.tick)[0]}SIMBASE.forEach(function(b2){var e=$('mc-'+b2[0]);if(e)e.innerHTML=mcardHtml(b2[0])});return}
if(S.simTab==='a'){var a=$('sana');if(a){var hh=simAnalysisHtml();if(a._h!==hh){a.innerHTML=hh;a._h=hh}}return}
if(!$('sv'))return;var v=simValue(),ch=(v/m.v0-1)*100;
setTxt('sv','₺'+fmt(v,0));setTxt('sinv','₺'+fmt(v-m.cash,0));var e=$('sch');e.textContent=chg(ch)+' başlangıca göre';e.className='dir '+cls(ch);setTxt('scash','₺'+fmt(m.cash,0));setTxt('sday',simDayTxt(m));var fl=$('sfree');if(fl){var fh=freeHtml();if(fl._h!==fh){fl.innerHTML=fh;fl._h=fh}}
var n=simNewsAt(m.tick),nk=n?n[0]+':'+(newsIsNew(m.tick,n)?1:0):-1,sb=$('snews');if(sb&&sb._k!==nk){sb.innerHTML=newsHtml(m.tick);sb._k=nk}
document.querySelectorAll('[data-sim]').forEach(function(r){var k=r.dataset.sim,o=m.pos[k],p=m.p[k],hs=m.h[k],up=hs[hs.length-1]>=hs[Math.max(0,hs.length-8)];
var nw=r.querySelector('.rnw');if(nw){var bn=bnNews(),on=!!bn&&(bn[3]||[]).indexOf(k)>=0;if(nw.hidden===on)nw.hidden=!on}
var sa=r.querySelector('.sa'),sl=r.querySelector('.sl'),sp=r.querySelector('.sp'),pc=r.querySelector('.pc'),rp=r.querySelector('.rp'),rc=r.querySelector('.rc'),ol=r.querySelector('.ordl');
if(ol){var od=m.orders&&m.orders[k],ot=od?'Otomatik emir: '+(od.stop!=null?'zarar −%'+Math.round(od.stop*100):'')+(od.stop!=null&&od.take!=null?' · ':'')+(od.take!=null?'kâr +%'+Math.round(od.take*100):''):'';ol.hidden=!ot;if(ol._t!==ot){ol.textContent=ot;ol._t=ot}}
sp.textContent='₺'+fmt(p);
// Fiyat sütununun altında: alış ortalamasına göre % ; değer sütununun altında: ₺ kâr/zarar
if(o&&o.q>0){sl.textContent=o.q+' lot';sa.textContent='₺'+fmt(o.avg);rp.textContent='₺'+fmt(o.q*p,0);var pl=(p/o.avg-1)*100,d=o.q*(p-o.avg);
 pc.textContent=chg(pl);pc.className='pc '+cls(pl);rc.textContent=(d>=0?'+':'−')+'₺'+fmt(Math.abs(d),0);rc.className='rc '+cls(pl)}
else{sl.textContent='Yok';sa.textContent='-';rp.textContent='₺0';pc.textContent='';rc.textContent='satıldı';rc.className='rc mu'}})}
// İşlem penceresi (modal). A grubunda zararına satış önce bekleme ekranına gider
// ── İşlem penceresi: yön (Sat/Al), lot kutusu (elle yazılır), hızlı oranlar, anlık özet ──
// Kutu BOŞ başlar: hazır bir miktar önermek kararı yönlendirirdi (çıpalama). İki yön aynı görünümde.
function tradeCalc(){var t=S.simTrade,m=S.sim,k=t.k,p=m.p[k],o=m.pos[k],held=o?o.q:0,maxB=Math.floor(m.cash/p),sell=t.side==='S',lim=sell?held:maxB,q=t.q||0;
return {k:k,p:p,held:held,maxB:maxB,sell:sell,lim:lim,q:q,over:q>lim,cost:q*p}}
function tradeSummaryHtml(c){
if(c.q>=1&&!c.over)return c.sell?'<div class="kv"><span>Satış tutarı<small class="fx">'+c.q+' lot × ₺'+fmt(c.p)+'</small></span><b>₺'+fmt(c.cost)+'</b></div><div class="kv"><span>Kalan lot</span><b>'+(c.held-c.q)+' lot</b></div>':'<div class="kv"><span>Alış tutarı<small class="fx">'+c.q+' lot × ₺'+fmt(c.p)+'</small></span><b>₺'+fmt(c.cost)+'</b></div><div class="kv"><span>Kalan nakit</span><b>₺'+fmt(S.sim.cash-c.cost,0)+'</b></div>';
if(c.lim<1)return '<p class="mu sm" style="margin:2px 0">'+(c.sell?'Bu hissede lotun yok.':'Nakdin 1 lota bile yetmiyor.')+'</p>';
if(c.over)return '<p class="dn sm" style="margin:2px 0;font-weight:600">'+(c.sell?'Elinde en fazla '+c.held+' lot var.':'Nakdin en fazla '+c.maxB+' lota yetiyor.')+'</p>';
return '<p class="mu sm" style="margin:2px 0">Kaç lot '+(c.sell?'satacağını':'alacağını')+' yaz ya da aşağıdan seç. En fazla '+c.lim+' lot.</p>'}
function simTradeHtml(k){var t=S.simTrade,m=S.sim,o=m.pos[k],p=m.p[k],has=o&&o.q>0,pl=has?(p/o.avg-1)*100:0,d=has?o.q*(p-o.avg):0,
up=m.h[k][m.h[k].length-1]>=m.h[k][Math.max(0,m.h[k].length-8)],c=tradeCalc(),ok=c.q>=1&&!c.over;
return '<h2>'+k+' <span class="mu" style="font:600 14px var(--fb)">'+simName(k)+'</span></h2><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font:700 24px var(--fd)">₺'+fmt(p)+'</b><span class="mu sm">güncel fiyat (1 lot)</span></div><div style="margin:6px 0 2px">'+simSpark(m.h[k].slice(-40),up).replace('width="64" height="24"','width="100%" height="44" viewBox="0 0 64 24" preserveAspectRatio="none"')+'</div>'+
'<div class="kv"><span>Elindeki adet</span><b>'+(has?o.q+' lot':'Elinde yok')+'</b></div>'+(has?'<div class="kv"><span>Toplam değeri<small class="fx">'+o.q+' lot × ₺'+fmt(p)+'</small></span><b>₺'+fmt(o.q*p,0)+'</b></div><div class="kv"><span>Ortalama alış fiyatın<small class="fx">1 lot için</small></span><b>₺'+fmt(o.avg)+'</b></div><div class="kv"><span>Kârın / zararın</span><b class="'+cls(pl)+'">'+chg(pl)+' ('+(d>=0?'+':'−')+'₺'+fmt(Math.abs(d),0)+')</b></div>':'')+'<div class="kv"><span>Nakit</span><b>₺'+fmt(m.cash,0)+'</b></div>'+
'<div class="tside" role="group" aria-label="İşlem yönü"><button data-a="simSide" data-v="S" class="'+(c.sell?'on':'')+'"'+(c.sell?' aria-pressed="true"':'')+'>Sat</button><button data-a="simSide" data-v="B" class="'+(c.sell?'':'on')+'"'+(c.sell?'':' aria-pressed="true"')+'>Al</button></div>'+
'<label class="qlab" for="simq">Kaç lot '+(c.sell?'satacaksın':'alacaksın')+'?</label><div class="qrow"><button class="qb" data-a="simQty" data-v="-1" aria-label="Bir lot azalt">−</button><input id="simq" data-in="simq" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Lot" value="'+(c.q||'')+'" aria-label="Lot sayısı"><button class="qb" data-a="simQty" data-v="+1" aria-label="Bir lot artır">+</button></div>'+
'<div class="qchips"><button data-a="simQty" data-v="p25"'+(c.lim<1?' disabled':'')+'>%25</button><button data-a="simQty" data-v="p50"'+(c.lim<1?' disabled':'')+'>%50</button><button data-a="simQty" data-v="p75"'+(c.lim<1?' disabled':'')+'>%75</button><button data-a="simQty" data-v="max"'+(c.lim<1?' disabled':'')+'>'+(c.sell?'Tümü':'Maks')+'</button></div>'+
'<div class="tsum" id="tsum">'+tradeSummaryHtml(c)+'</div><button class="btn pri" id="tgo" data-a="simGo"'+(ok?'':' disabled')+'>'+(c.q<1?'Lot sayısı gir':c.over?'Lot sayısı çok fazla':c.q+' lot '+(c.sell?'sat':'al'))+'</button><button class="btn" style="margin-top:10px" data-a="simClose">Kapat</button>'}
// Yazarken pencere baştan çizilmez (odak ve klavye kaybolmasın): sadece özet, düğme ve yön güncellenir
function updTrade(){var t=S.simTrade;if(!t||!$('tsum'))return;var c=tradeCalc(),ok=c.q>=1&&!c.over;$('tsum').innerHTML=tradeSummaryHtml(c);
var g=$('tgo');g.disabled=!ok;g.textContent=c.q<1?'Lot sayısı gir':c.over?'Lot sayısı çok fazla':c.q+' lot '+(c.sell?'sat':'al');
document.querySelectorAll('#mbox .tside button').forEach(function(x){var on=x.dataset.v===t.side;x.classList.toggle('on',on);if(on)x.setAttribute('aria-pressed','true');else x.removeAttribute('aria-pressed')});
document.querySelectorAll('#mbox .qchips button').forEach(function(x){x.disabled=c.lim<1});
var lb=document.querySelector('#mbox .qlab');if(lb)lb.textContent='Kaç lot '+(c.sell?'satacaksın':'alacaksın')+'?';var mx=document.querySelector('#mbox .qchips button[data-v=max]');if(mx)mx.textContent=c.sell?'Tümü':'Maks'}
function simWhyHtml(k,q){return '<h2>Neden satıyorsun?</h2><p>'+k+': '+q+' lot satılacak. Tek dokunuşla seç.</p><div class="choices">'+SELL_WHY.map(function(w,i){return '<button class="choice" data-a="simWhy" data-v="'+i+'"><b style="font-size:16px">'+w+'</b></button>'}).join('')+'</div><button class="btn" style="margin-top:10px" data-a="simWhyBack">Vazgeç</button>'}
function simCoolHtml(k,pl){return '<h2 style="text-align:center">Bir dakika dur</h2><p style="text-align:center">Zararına satmak üzeresin ('+chg(pl)+'). Kararını kesinleştirmeden önce '+CFG.cooldownSec+' saniye dur ve planını düşün.</p><div class="count" id="cdn">'+Math.max(0,S.simCd.left)+'</div><button class="btn pri" data-a="simCdBack">Vazgeç, yeniden düşün</button><button class="btn" id="cdg" data-a="simCdGo"'+(S.simCd.left>0?' disabled':'')+'>Satışı onayla</button>'}

// ───────────────── Bitiş, son test, manipülasyon kontrolü, bilgilendirme ─────────────────
function vEnd(){var cnt=function(bl){var a=S.dec.filter(function(d){return d.block===bl&&d.kind==='kriz'&&d.pos==='zarar'});return a.filter(function(d){return d.final==='sat'}).length+' / '+a.length};
var h='<div class="stage" style="justify-content:flex-start;padding-top:18px"><h1 style="margin-top:4px">Üç bölüm tamamlandı</h1><p>Teşekkürler. Verilerin kaydedildi.</p>',
summary=filmHtml()+'<div class="stats" style="margin:4px 0 14px"><div class="stat"><span>1. bölüm, düşüşte satış</span><b>'+cnt('pre')+'</b></div><div class="stat"><span>3. bölüm, düşüşte satış</span><b>'+cnt('post')+'</b></div></div>';
if(S.post==null)return h+'<div class="note info"><span>Son adımlar: 2 soruluk test ve iki kısa soru. Sonra çalışmanın amacını anlatacağız.</span></div><button class="btn pri" data-a="testStart" data-v="post">Devam</button></div>';
// Manipülasyon kontrolü ve amaç tahmini, amaç açıklanmadan ÖNCE sorulur
if(!S.manip)return h+sec('Kısa bir soru','<p style="margin:0 0 14px">Simülatörde, zararına satmak istediğinde ekrana bir <b>bekleme süresi</b> geldi mi?</p><div class="chips">'+['Evet','Hayır','Hatırlamıyorum','Hiç satış yapmadım'].map(function(o){return '<button class="chip" data-a="manip" data-v="'+o+'">'+o+'</button>'}).join('')+'</div>')+'</div>';
if(S.guess==null)return h+sec('Son soru','<p style="margin:0 0 10px">Sence bu araştırma neyi ölçmeye çalışıyordu? <span class="mu">(isteğe bağlı)</span></p><textarea id="gq" class="field" rows="3" style="height:auto;padding:10px 12px;resize:vertical" maxlength="400" aria-label="Araştırmanın amacı hakkındaki tahminin" placeholder="Kısaca yazabilirsin"></textarea><button class="btn pri" style="margin-top:10px" data-a="guess">Gönder</button><button class="link" style="width:100%" data-a="guessSkip">Atla</button>')+'</div>';
if(!S.debriefLogged){S.debriefLogged=1;log('debrief_view',{});flush()}
return h+summary+sec('Çalışmanın amacı','<p style="margin:0 0 10px">Bu çalışmada, simülatörde zararına satış yapmadan önce verilen <b>'+CFG.cooldownSec+' saniyelik bekleme süresinin</b>, sonrasındaki kararlara da yansıyıp yansımadığını inceledik.</p><p class="mu">Katılımcılar rastgele iki gruba ayrıldı. Bir grupta simülatörde bekleme ekranı çıktı, diğerinde çıkmadı. 1. ve 3. bölümde iki grup için de bekleme yoktu; bu iki bölümü karşılaştırarak bir değişim olup olmadığına bakıyoruz. Bunu baştan söylemedik, çünkü bilmek kararlarını etkileyebilirdi.</p><div class="note" style="margin:14px 0 0"><span><b>Sen '+(S.grp==='A'?'bekleme süresi olan':'bekleme süresi olmayan (kontrol)')+' gruptaydın.</b></span></div>')+
sec('Bilmen gerekenler','<p class="mu" style="margin:0 0 8px">Hisse adları gerçek şirketlere ait olsa da fiyatlar, grafikler ve haberler tamamen kurgusaldı; bu şirketlerin gerçek performansını ya da gerçek haberlerini yansıtmaz. Karar anlarının sonuçları, satmanın ya da tutmanın ortalamada avantaj sağlamayacağı şekilde dengelenmişti; simülatördeki piyasa da krizden sonra ortalamada yatay seyredecek şekilde seçilmişti. Yani hiçbir kararın "doğru" ya da "yanlış" değildi.</p><p class="mu" style="margin:0 0 8px">Hiçbir içerik yatırım tavsiyesi değildir.</p><p class="mu" style="margin:0">Soruların için: <b style="color:var(--tx)">'+cfld('contact')+'</b></p>')+
sec('Rahatsız hissettiysen','<p class="mu" style="margin:0 0 8px">Piyasa düşüşleri ve zarar anları sırasında gergin ya da rahatsız hissetmiş olabilirsin. Bu his sürüyorsa konuşabileceğin yer: <b style="color:var(--tx)">'+cfld('support')+'</b></p><p class="mu" style="margin:0">Araştırmayla ilgili sorular için: <b style="color:var(--tx)">'+cfld('contact')+'</b></p>')+
cardHtml()+freeEntryHtml()+sec('Verilerin','<p class="mu" style="margin:0 0 12px">Amacı öğrendikten sonra verilerinin kullanılmasını istemiyorsan şimdi çekilebilirsin.</p><button class="btn ghost-dn" data-a="withdraw">Çalışmadan çekil, verilerimi sil</button>')+pilotFbHtml()+'</div>'}


// Karar kartı: yalnızca katılımcının kendi karar sayıları. Grup ve çalışmanın amacı resimde YOK (paylaşılırsa diğer katılımcıları etkiler).
function decCounts(bl){var c={sat:0,tut:0,al:0};S.dec.forEach(function(d){if(d.block===bl&&c[d.final]!=null)c[d.final]++});return c}
function cardHtml(){var ch=simChartSvg(),b=(ch?'<p class="mu" style="margin:0 0 8px">Simülatörde toplam paranın seyri</p>'+ch+'<p class="mu sm" style="margin:6px 0 14px">● sattığın an · ○ aldığın an · gri bant: haberlerdeki sert düşüş dönemleri</p>':'')+'<p class="mu" style="margin:0 0 10px">Kararlarının kısa bir özetini resim olarak kaydedebilirsin. Resimde grubun ya da çalışmanın amacı yazmaz.</p>';
if(!S.cardUrl)b+='<button class="btn" data-a="cardMake">Karar kartımı oluştur</button>';
else b+='<img src="'+S.cardUrl+'" alt="Karar özeti kartı: 1. ve 3. bölümde kaç kez sat, tut, al dediğin ve simülatördeki işlem sayın" style="display:block;width:100%;border-radius:14px;border:1px solid var(--ln);margin:0 0 10px"><a class="btn pri" download="ilk-lot-karar-ozeti.png" href="'+S.cardUrl+'">Resmi kaydet</a><p class="mu sm" style="margin:8px 0 0">Kaydetme düğmesi çalışmazsa resme basılı tutup kaydedebilirsin.</p>';
b+='<p class="mu sm" style="margin:10px 0 0">Çalışma henüz sürüyor: amacını ve ayrıntıları başkalarıyla şimdilik paylaşma, yoksa onların kararlarını etkileyebilirsin.</p>';
return sec('Karar özetin',b)}

// Portföy değerinin gün gün seyri: fiyatlar tohumdan, portföy işlemlerden yeniden kurulur (devam edilen oturumda S.sim.vh güvenilir değil).
// Yalnızca simülatör bitmişken çağrılır (simInit sayacı sıfırlar). Sonuç S.simSer içinde saklanır.
function simSeries(){if(S.simSer)return S.simSer;var keep=S.sim;if(DEMO||!keep||keep.tick<CFG.simTicks)return null;
var N=CFG.simTicks,tr=keep.trades.map(function(r,i){return [r,i]}).sort(function(a,b){return a[0].t-b[0].t||a[1]-b[1]}).map(function(x){return x[0]});
simInit();var m=S.sim,pos={},v=[],ti=0,cash=m.cash;SIMBASE.forEach(function(b){pos[b[0]]=m.pos[b[0]].q});
function ap(t){while(ti<tr.length&&tr[ti].t<=t){var r=tr[ti++],p=m.p[r.sym];if(r.side==='S'){cash+=r.q*p;pos[r.sym]-=r.q}else{cash=Math.max(0,cash-r.q*p);pos[r.sym]+=r.q}}}
function val(){var x=cash;for(var k in pos)x+=pos[k]*m.p[k];return x}
ap(0);v.push(val());for(var t=1;t<=N;t++){simStep();ap(t);v.push(val())}
S.sim=keep;return S.simSer={v:v,v0:keep.v0,tr:tr.map(function(r){return {t:r.t,side:r.side}})}}
function simChartGeo(w,h,l,r,t0,b){var d=simSeries(),N=CFG.simTicks,mn=Math.min.apply(0,d.v.concat([d.v0])),mx=Math.max.apply(0,d.v.concat([d.v0])),pd=(mx-mn)*0.08||1;mn-=pd;mx+=pd;
return {d:d,X:function(t){return l+(w-l-r)*t/N},Y:function(x){return t0+(h-t0-b)*(1-(x-mn)/(mx-mn))}}}
function simChartSvg(){if(!simSeries())return '';var W=340,H=150,g=simChartGeo(W,H,8,8,10,22),d=g.d,N=CFG.simTicks,nS=d.tr.filter(function(x){return x.side==='S'}).length,nB=d.tr.length-nS;
var s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Simülatörde toplam paranın gün gün seyri. '+nS+' satış ve '+nB+' alış noktası işaretli." style="display:block">';
CFG.simCrises.forEach(function(c){s+='<rect x="'+g.X(c.at).toFixed(1)+'" y="10" width="'+(g.X(c.at+c.len)-g.X(c.at)).toFixed(1)+'" height="'+(H-32)+'" fill="var(--sf2)"/>'});
s+='<line x1="8" x2="'+(W-8)+'" y1="'+g.Y(d.v0).toFixed(1)+'" y2="'+g.Y(d.v0).toFixed(1)+'" stroke="var(--mu)" stroke-width="1" stroke-dasharray="4 4"/>';
s+='<polyline fill="none" stroke="var(--tx)" stroke-width="2" stroke-linejoin="round" points="'+d.v.map(function(x,t){return g.X(t).toFixed(1)+','+g.Y(x).toFixed(1)}).join(' ')+'"/>';
d.tr.forEach(function(x){var cx=g.X(x.t).toFixed(1),cy=g.Y(d.v[x.t]).toFixed(1);s+=x.side==='S'?'<circle cx="'+cx+'" cy="'+cy+'" r="4.5" fill="var(--tx)" stroke="var(--sf)" stroke-width="1.5"/>':'<circle cx="'+cx+'" cy="'+cy+'" r="4.5" fill="var(--sf)" stroke="var(--tx)" stroke-width="2"/>'});
s+='<text x="8" y="'+(H-6)+'" font-size="11" fill="var(--mu)">Gün 0</text><text x="'+(W-8)+'" y="'+(H-6)+'" font-size="11" text-anchor="end" fill="var(--mu)">Gün '+N+'</text><text x="'+(W-8)+'" y="'+(g.Y(d.v0)-4).toFixed(1)+'" font-size="11" text-anchor="end" fill="var(--mu)">başlangıç</text></svg>';
return s}
async function cardMake(){var W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d'),cs=getComputedStyle(document.documentElement),v=function(n){return cs.getPropertyValue(n).trim()||'#000'};
try{await document.fonts.load('700 40px "Bricolage Grotesque"');await document.fonts.load('400 40px "Bricolage Grotesque"')}catch(e){}
var F='"Bricolage Grotesque",system-ui,sans-serif';
x.fillStyle=v('--bg');x.fillRect(0,0,W,H);
x.fillStyle=v('--tx');x.font='700 84px '+F;x.fillText('Karar özetim',72,150);
x.fillStyle=v('--mu');x.font='400 38px '+F;x.fillText('İlk Lot · kurgusal piyasa araştırması',72,210);
var rows=[['1. bölüm',decCounts('pre')],['3. bölüm',decCounts('post')]],y=260;
rows.forEach(function(r){x.fillStyle=v('--sf');x.strokeStyle=v('--ln');x.lineWidth=2;cardRR(x,72,y,W-144,230,28);x.fill();x.stroke();
x.fillStyle=v('--tx');x.font='700 44px '+F;x.fillText(r[0],112,y+66);
[['Sat',r[1].sat],['Tut',r[1].tut],['Al',r[1].al]].forEach(function(c,i){var cx=112+i*290;x.fillStyle=v('--tx');x.font='700 84px '+F;x.fillText(String(c[1]),cx,y+170);var w=x.measureText(String(c[1])).width;x.fillStyle=v('--mu');x.font='400 38px '+F;x.fillText(c[0],cx+w+16,y+170)});y+=260});
var n=0;try{n=S.sim&&S.sim.trades?S.sim.trades.length:0}catch(e){}
var sh=380;x.fillStyle=v('--sf');x.strokeStyle=v('--ln');cardRR(x,72,y,W-144,sh,28);x.fill();x.stroke();
x.fillStyle=v('--tx');x.font='700 44px '+F;x.fillText('Simülatör',112,y+66);
x.textAlign='right';x.fillStyle=v('--mu');x.font='400 38px '+F;x.fillText(n+' işlem yaptın',W-112,y+66);x.textAlign='left';
if(simSeries()){var cx0=112,cw=W-224,cy0=y+96,ch=sh-96-70,g=simChartGeo(cw,ch,0,0,6,6),X=function(t){return cx0+g.X(t)},Y=function(q){return cy0+g.Y(q)},d=g.d;
 x.fillStyle=v('--sf2');CFG.simCrises.forEach(function(c){x.fillRect(X(c.at),cy0,X(c.at+c.len)-X(c.at),ch)});
 x.strokeStyle=v('--mu');x.lineWidth=2;x.setLineDash([10,10]);x.beginPath();x.moveTo(cx0,Y(d.v0));x.lineTo(cx0+cw,Y(d.v0));x.stroke();x.setLineDash([]);
 x.strokeStyle=v('--tx');x.lineWidth=4;x.lineJoin='round';x.beginPath();d.v.forEach(function(q,t){t?x.lineTo(X(t),Y(q)):x.moveTo(X(t),Y(q))});x.stroke();
 d.tr.forEach(function(k){var px=X(k.t),py=Y(d.v[k.t]);x.beginPath();x.arc(px,py,10,0,6.2832);if(k.side==='S'){x.fillStyle=v('--tx');x.fill();x.strokeStyle=v('--sf');x.lineWidth=3;x.stroke()}else{x.fillStyle=v('--sf');x.fill();x.strokeStyle=v('--tx');x.lineWidth=4;x.stroke()}});
 x.fillStyle=v('--mu');x.font='400 28px '+F;x.fillText('Gün 0',cx0,y+sh-34);x.textAlign='right';x.fillText('Gün '+CFG.simTicks,cx0+cw,y+sh-34);x.textAlign='left';x.fillText('● sattığın an   ○ aldığın an',cx0+190,y+sh-34)}
x.fillStyle=v('--mu');x.font='400 32px '+F;x.fillText('Fiyatlar, haberler ve hisse hareketleri kurgusaldı.',72,H-84);x.fillText('Hiçbir içerik yatırım tavsiyesi değildir.',72,H-40);
S.cardUrl=cv.toDataURL('image/png');log('summary_card',{n:n});flush();render()}
function cardRR(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

// Pilot geri bildirimi (yalnızca PILOT açıkken, bilgilendirmeden SONRA): 3 isteğe bağlı soru. Gerçek veri toplamada hiç çıkmaz.
var FB_Q=[['clear','Ne yapman gerektiğini ilk dakikada anladın mı?',['1','2','3','4','5'],'1 = hiç anlamadım, 5 = tamamen anladım'],
['dur','Toplam süre sana nasıl geldi?',['Çok kısa','Uygun','Uzun','Çok uzun']],
['unease','Çalışma sırasında rahatsız ya da çok gergin hissettin mi?',['Hayır','Biraz','Evet']]];
function pilotFbHtml(){if(!PILOT)return '';
if(S.fb)return sec('Pilot geri bildirimi','<p class="mu" style="margin:0">Teşekkürler, geri bildirimin kaydedildi.</p>');
var d=S.fbD||{};
return sec('Pilot geri bildirimi','<p class="mu" style="margin:0 0 4px">Bu 3 soru yalnızca pilot katılımcılarına soruluyor. İsteğe bağlı; atlayabilirsin.</p>'+FB_Q.map(function(q){return '<p style="margin:14px 0 8px;font-weight:700;color:var(--tx)">'+q[1]+'</p>'+(q[3]?'<p class="mu sm" style="margin:-4px 0 8px">'+q[3]+'</p>':'')+'<div class="chips" role="group" aria-label="'+esc(q[1])+'">'+q[2].map(function(o){return '<button class="chip'+(d[q[0]]===o?' on':'')+'" aria-pressed="'+(d[q[0]]===o)+'" data-a="fbPick" data-v="'+q[0]+'|'+o+'">'+o+'</button>'}).join('')+'</div>'}).join('')+'<button class="btn pri" style="margin-top:16px" data-a="fbSend">Gönder</button><button class="link" style="width:100%" data-a="fbSkip">Atla</button>')}

// ───────────────── Araştırmacı paneli ve menü ─────────────────
function vAdmin(){return '<div style="display:flex;align-items:center;gap:10px;margin:4px 0 14px"><button class="icon" data-a="adminClose" aria-label="Paneli kapat">‹</button><span style="font:700 22px var(--fd)">Araştırmacı paneli</span></div>'+adminHtml()}
// Terim düğmesi: dokununca GLOSSARY[i] tek maddelik pencerede açılır. Başka bir düğmenin (ör. .srow) içine konmaz: iç içe düğme geçersiz.
function trm(i,label){return '<button class="term" data-a="term" data-v="'+i+'" aria-haspopup="dialog">'+label+'</button>'}
function termHtml(i){var g=GLOSSARY[i];return '<h2>'+g[0]+'</h2><p>'+g[1]+'</p><button class="btn pri" data-a="mCancel">Anladım</button><button class="btn" data-a="help">Tüm sözlük</button>'}
function helpHtml(){return '<h2>Sözlük</h2><dl class="gl" style="margin:0 0 14px;max-height:55vh;overflow:auto">'+GLOSSARY.map(function(g){return '<dt>'+g[0]+'</dt><dd>'+g[1]+'</dd>'}).join('')+'</dl><button class="btn pri" data-a="mCancel">Anladım</button>'}
// Yazı boyutu seçici (b22): Normal / Büyük / Çok büyük; tercih cihazda tutulur, seçim katılımcı koduyla fs_set olayı olarak kaydedilir
var FS_LV=[['Normal','Normal yazı boyutu'],['Büyük','Büyük yazı boyutu'],['Çok büyük','Çok büyük yazı boyutu']];
function fsLevel(){var v=document.documentElement.getAttribute('data-fs');return v==='1'||v==='2'?+v:0}
function fsHtml(){var c=fsLevel();return '<div class="fsel" role="group" aria-labelledby="fsl"><span class="fsl" id="fsl">Yazı boyutu</span>'+FS_LV.map(function(l,i){return '<button class="chip'+(i===c?' on':'')+'" aria-pressed="'+(i===c)+'" aria-label="'+l[1]+'" data-a="fs" data-v="'+i+'">'+l[0]+'</button>'}).join('')+'</div>'}
function menuHtml(){if(DEMO)return '<h2>Menü</h2><p>Tanıtım modu: hiçbir veri kaydedilmez.</p>'+fsHtml()+(S.stage==='sim'?(S.free?'':'<div class="fsel"><span class="fsl">Tanıtım hızı</span>'+[1,2,4].map(function(n){var on=(S.demoSpeed||1)===n;return '<button class="chip'+(on?' on':'')+'" aria-pressed="'+on+'" data-a="demoSpeed" data-v="'+n+'">'+n+'×</button>'}).join('')+'</div>')+(S.free?'<button class="btn" data-a="freeQuit">Serbest oyunu bitir</button>':'<button class="btn" data-a="demoCrisis">Sonraki krize atla</button>'):'')+(S.free?'':'<button class="btn" data-a="freeOpen">Serbest mod</button><button class="btn" data-a="demoStart">Baştan başla</button>')+'<button class="btn" data-a="demoExit">Tanıtımdan çık</button><button class="btn" data-a="mCancel">Kapat</button>';
return '<h2>Menü</h2><p>Katılımcı kodun: '+(S.code?maskCode(S.code):'-')+'</p><p class="mu sm" style="margin:0 0 10px">Sorular ve destek: '+cfld('contact')+'</p>'+fsHtml()+'<p class="mu sm" style="margin:0 0 10px">Ana ekrana eklemek için tarayıcının paylaş ya da menü düğmesinden "Ana ekrana ekle"yi seç. Eklenen kısayol açılınca katılımcı kodunu yeniden girmen gerekebilir; oturum kaldığın yerden devam eder.</p>'+(S.code&&!S.ended?'<button class="btn" data-a="moveDev">Başka cihazda devam et</button>':'')+(S.code?'<button class="btn ghost-dn" data-a="withdraw">Çalışmadan çekil, verilerimi sil</button>':'')+'<button class="btn" data-a="mCancel">Kapat</button>'}


// ═════════════════ SERBEST MOD EKRANLARI (b19) ═════════════════
function simDayTxt(m){return S.free?String(m.tick):m.tick+' / '+simLim()}
// Portföy ekranında: kayıp sınırı ve sınıra kalan pay
function freeHtml(){var f=S.free,m=S.sim,v=simValue(),lim=freeLimitF(f,m.v0),room=m.v0-lim,loss=Math.max(0,m.v0-v),pc=Math.min(100,loss/room*100);
return '<div class="flim"><div class="kv" style="padding:0"><span style="color:var(--tx);font-weight:700">Kayıp sınırı · %'+Math.round(freeLim(f)*100)+'</span><span>₺'+fmt(lim,0)+' altına inersen oyun biter</span></div><div class="fbar"><i class="'+(pc>=75?'hot':'')+'" style="width:'+pc.toFixed(1)+'%"></i></div><div class="mu sm">Sınıra kalan: ₺'+fmt(Math.max(0,v-lim),0)+'</div></div>'}
// Çalışma bitiş ekranından serbest moda giriş (yalnızca bilgilendirme gösterildikten sonra)
function freeEntryHtml(){return sec('Serbest mod','<p class="mu" style="margin:0 0 10px">İstersen simülatörü oyun gibi, kendi kurallarınla oynayabilirsin: zorluğu, kayıp sınırını, senaryoyu ve başlangıç portföyünü sen seçersin; oyun sırasında piyasayı durdurabilir ya da hızlandırabilir, hisselere otomatik sat emri koyabilirsin. Bu bölüm çalışmanın parçası değil: <b>hiçbir şey kaydedilmez</b>, bekleme ekranı yoktur, süre sınırı yoktur. Oyun, kaybın seçtiğin sınırı aşınca biter.</p><button class="btn" data-a="freeOpen">Serbest moda geç</button>')}
// Seçenek düğmeleri (radyo grubu): items = [[değer, etiket], ...]
function freeRadio(act,lab,items,cur){return '<div class="fsel wrap" role="radiogroup" aria-label="'+lab+'"><span class="fsl">'+lab+'</span>'+items.map(function(it){var on=String(it[0])===String(cur);return '<button class="chip'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" data-a="'+act+'" data-v="'+it[0]+'">'+it[1]+'</button>'}).join('')+'</div>'}
// Oyun sırasında piyasa hızı: durdurma, 1×, 2×, 4× (yerinde güncellenir, her gün yeniden çizilmez)
function freeSpeedHtml(){var c=S.free.speed==null?1:S.free.speed;return '<div class="fsel" role="group" aria-labelledby="fspl" style="margin:0 0 12px"><span class="fsl" id="fspl">Piyasa hızı</span>'+[[0,'Duraklat'],[1,'1×'],[2,'2×'],[4,'4×']].map(function(it){var on=it[0]===c;return '<button class="chip'+(on?' on':'')+'" aria-pressed="'+on+'" data-a="freeSpeed" data-v="'+it[0]+'">'+it[1]+'</button>'}).join('')+'</div>'}
// Hisse detayında otomatik sat emri kartı (yalnızca serbest mod)
function freeOrderHtml(k){var m=S.sim,o=m.pos[k],has=o&&o.q>0,od=(m.orders&&m.orders[k])||{stop:null,take:null};
function row(t,lab,vals,ff){return '<div class="fsel" role="radiogroup" aria-label="'+lab+'"><span class="fsl">'+lab+'</span>'+['x'].concat(vals).map(function(v){var on=v==='x'?od[t]==null:od[t]===v;return '<button class="chip'+(on?' on':'')+'" role="radio" aria-checked="'+on+'"'+(has?'':' disabled')+' data-a="freeOrder" data-v="'+k+'|'+t+'|'+v+'">'+(v==='x'?'Yok':ff(v))+'</button>'}).join('')+'</div>'}
return '<p class="mu sm" style="margin:0 0 10px">Eşikler ortalama alış fiyatına göredir. Eşik aşılınca hissenin tamamı o anki fiyattan satılır; sert düşüşte satış eşiğin altında gerçekleşebilir. Emir bir kez çalışır.</p>'+
 row('stop','Zarar olursa sat',[0.05,0.10,0.15,0.20],function(v){return '−%'+Math.round(v*100)})+row('take','Kâr olursa sat',[0.10,0.20,0.30],function(v){return '+%'+Math.round(v*100)})+(has?'':'<p class="mu sm" style="margin:0">Emir koymak için önce bu hisseden almalısın.</p>')}
function freeSetText(f){return FREE_LV[f.lvl].ad+' · kayıp sınırı %'+Math.round(freeLim(f)*100)+' · '+FREE_SC[f.sc||'r'].ad+' · '+FREE_PF[f.pf||'d'].ad}
function vFreeMenu(){var f=S.free,desc={k:['Daha seyrek ve küçük düşüşler ile yükselişler; uyarı erken gelir','Haberler kısa ve net'],o:['Daha sık ve büyük olaylar; bazen tüm piyasa birlikte hareket eder','Haberler nedenleriyle birlikte gelir'],z:['Sık ve sert olaylar; uyarı geç gelir','Haberler çok katmanlı ve belirsizdir, yön her zaman açık değildir']};
return '<div class="stage" style="justify-content:flex-start;padding-top:18px"><div class="mu sm" style="font-weight:700">Serbest mod</div><h1 style="margin-top:4px">Oyunu kendin kur</h1><p>Aynı simülatör, kurgusal fiyatlar ve haberler. Hiçbir şey kaydedilmez ve çalışmanın parçası değildir. Süre sınırı yok; toplam paran kayıp sınırının altına inince oyun biter, istersen kendin de bitirebilirsin. Oyun sırasında piyasayı durdurabilir ya da hızlandırabilir, her hisseye otomatik sat emri koyabilirsin.</p>'+
'<div class="flvs" role="radiogroup" aria-label="Zorluk">'+['k','o','z'].map(function(k){var L=FREE_LV[k],d=desc[k],on=f.lvl===k;return '<button class="flv'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" data-a="freeLvl" data-v="'+k+'"><b>'+L.ad+'</b><span>Kayıp sınırı %'+Math.round(L.lim*100)+'</span><small>'+d[0]+'.</small><small>'+d[1]+'.</small></button>'}).join('')+'</div>'+
freeRadio('freeLim','Kayıp sınırı',[['d','Zorluğa göre (%'+Math.round(FREE_LV[f.lvl].lim*100)+')']].concat(FREE_LIMS.map(function(x){return [x,'%'+Math.round(x*100)]})),f.lim==null?'d':f.lim)+
freeRadio('freeSc','Senaryo',Object.keys(FREE_SC).map(function(k){return [k,FREE_SC[k].ad]}),f.sc||'r')+'<p class="mu sm" style="margin:-6px 0 14px">'+FREE_SC[f.sc||'r'].tx+'</p>'+
freeRadio('freePf','Başlangıç portföyü',Object.keys(FREE_PF).map(function(k){return [k,FREE_PF[k].ad]}),f.pf||'d')+'<p class="mu sm" style="margin:-6px 0 14px">'+FREE_PF[f.pf||'d'].tx+'</p>'+
'<button class="btn pri" data-a="freeStart">Oyunu başlat</button><button class="link" style="width:100%" data-a="freeBack">Geri dön</button><p class="foot">Şirket adları gerçek; fiyatlar, grafikler ve haberler kurgusaldır ve bu şirketlerin gerçek durumunu yansıtmaz. Yatırım tavsiyesi değildir.</p></div>'}
function vFreeEnd(){var f=S.free,r=f.res,L=FREE_LV[f.lvl],ch=(r.value/r.v0-1)*100,na=S.sim?S.sim.trades.filter(function(t){return t.auto}).length:0;
return '<div class="stage" style="justify-content:flex-start;padding-top:18px"><div class="mu sm" style="font-weight:700">Serbest mod · '+L.ad+'</div><h1 style="margin-top:4px">'+(r.kind==='limit'?'Kayıp sınırına ulaştın':'Oyunu bitirdin')+'</h1><p>'+(r.kind==='limit'?'Toplam paran ₺'+fmt(freeLimitF(f,r.v0),0)+' sınırının altına indi, oyun bitti.':'İstediğin zaman yeniden başlayabilirsin.')+'</p>'+
'<div class="stats" style="margin:4px 0 14px"><div class="stat"><span>Dayandığın gün</span><b>'+r.tick+'</b></div><div class="stat"><span>Son para</span><b>₺'+fmt(r.value,0)+'</b></div></div><div class="stats" style="margin:0 0 14px"><div class="stat"><span>Başlangıca göre</span><b class="'+cls(ch)+'">'+chg(ch)+'</b></div><div class="stat"><span>İşlem sayısı</span><b>'+r.trades+'</b></div></div>'+
(na?'<p class="mu sm" style="margin:-4px 0 12px">Bu işlemlerin '+na+' tanesi otomatik emirle yapıldı.</p>':'')+'<p class="mu sm" style="margin:0 0 14px">Ayarların: '+freeSetText(f)+'.</p>'+
'<button class="btn pri" data-a="freeStart">Aynı ayarlarla yeniden oyna</button><button class="btn" data-a="freeMenu">Ayarları değiştir</button><button class="link" style="width:100%" data-a="freeBack">Çalışmanın bitiş ekranına dön</button><p class="mu sm" style="margin:12px 0 0">Bu oyunda hiçbir şey kaydedilmedi. Kurgusal bir simülasyondur, yatırım tavsiyesi değildir.</p></div>'}
