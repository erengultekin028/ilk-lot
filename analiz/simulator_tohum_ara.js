// Simülatör için tarafsız piyasa tohumu arar. Üretim uygulamadaki simInit/simStep ile aynıdır (kaynak/02_core.js).
// Kullanım:  node analiz/simulator_tohum_ara.js GÜN 'KRİZLER_JSON' ÖNEK ADAY_SAYISI
//   örn.     node analiz/simulator_tohum_ara.js 300 '[{"at":52,"len":7,"drop":0.18,"stocks":["TUPRS","KOZAL"]},...]' ilklot-sim4-v 3000
// Ölçütler (hepsi birden): her kriz-hisse olayında kriz dibinden sona ve dipten 20 gün sonraya değişimin ORTALAMASI |%0,5| içinde;
// olayların 2-3'ü yükselen (hem sona hem +20 gün); tek bir olayın değişimi |%6| içinde; ilk krizden önce hiçbir hisse başlangıçtan %4,5'ten fazla sapmaz;
// BIMAS (krizsiz hisse) toplam |%3,5| içinde; fiyat hiç 1'in altına düşmez. Bu ölçütler benim seçimimdir, bilimsel bir standart değil.
// Takvim (gün sayısı ya da kriz günleri) değişirse tohum yeniden aranmalı; eski tohum yeni takvimde tarafsız olmayabilir.
function seedOf(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return h>>>0}
var BASE=[['KOZAL',84.2],['TUPRS',42.6],['PGSUS',27.9],['THYAO',156.4],['ASELS',63.1],['BIMAS',118.5]];
var N=+process.argv[2]||300, CR=JSON.parse(process.argv[3]), PREF=process.argv[4]||'ilklot-sim4-v', K=+process.argv[5]||3000;
function run(seed){var s=seedOf(seed);function r(){s=(s+0x6D2B79F5)>>>0;var t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
 var P={},H={};BASE.forEach(function(b){P[b[0]]=b[1];H[b[0]]=[b[1]]});
 for(var t=1;t<=N;t++){var mk=(r()-0.5)*0.005;BASE.forEach(function(b){var k=b[0],sh=0;CR.forEach(function(c){if(c.stocks.indexOf(k)>=0&&t>=c.at&&t<c.at+c.len)sh=Math.pow(1-c.drop,1/c.len)-1});P[k]=Math.max(1,P[k]*(1+mk+sh+(r()-0.5)*0.008));H[k].push(P[k])})}
 return H}
function metrik(H){var ev=[];CR.forEach(function(c){c.stocks.forEach(function(k){var b=c.at+c.len-1,h=H[k];ev.push({k:k,end:h[N]/h[b]-1,p20:h[Math.min(N,b+20)]/h[b]-1})})});
 var m=function(a){return a.reduce(function(x,y){return x+y},0)/a.length};
 var pre=0;BASE.forEach(function(b){for(var t=0;t<CR[0].at;t++)pre=Math.max(pre,Math.abs(H[b[0]][t]/b[1]-1))});
 var bim=H.BIMAS[N]/H.BIMAS[0]-1;
 return {mEnd:m(ev.map(function(e){return e.end})),mP20:m(ev.map(function(e){return e.p20})),upEnd:ev.filter(function(e){return e.end>0}).length,upP20:ev.filter(function(e){return e.p20>0}).length,n:ev.length,
  maxAbsEnd:Math.max.apply(0,ev.map(function(e){return Math.abs(e.end)})),pre:pre,bim:bim,ev:ev,minP:Math.min.apply(0,BASE.map(function(b){return Math.min.apply(0,H[b[0]])}))}}
function gecer(x){return Math.abs(x.mEnd)<=0.005&&Math.abs(x.mP20)<=0.005&&x.upEnd>=2&&x.upEnd<=3&&x.upP20>=2&&x.upP20<=3&&x.maxAbsEnd<=0.06&&x.pre<=0.045&&Math.abs(x.bim)<=0.035&&x.minP>=1}
var gec=[];for(var i=1;i<=K;i++){var sd=PREF+i,x=metrik(run(sd));if(gecer(x))gec.push([sd,x])}
gec.sort(function(a,b){return (Math.abs(a[1].mEnd)+Math.abs(a[1].mP20)+Math.abs(a[1].bim)/3+a[1].pre/3)-(Math.abs(b[1].mEnd)+Math.abs(b[1].mP20)+Math.abs(b[1].bim)/3+b[1].pre/3)});
console.log('aday',K,'geçen',gec.length);
gec.slice(0,5).forEach(function(g){var x=g[1];console.log(g[0],'ortSon',(x.mEnd*100).toFixed(2)+'%','ort+20',(x.mP20*100).toFixed(2)+'%','yükselen son/+20',x.upEnd+'/'+x.upP20,'enBüyükSon',(x.maxAbsEnd*100).toFixed(1)+'%','önceSapma',(x.pre*100).toFixed(1)+'%','BIMAS',(x.bim*100).toFixed(1)+'%')});
// Doğrulama: eski takvim + eski tohum bu ölçütlere göre nasıl?
