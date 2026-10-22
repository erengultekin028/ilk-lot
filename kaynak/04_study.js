// ═════════════════ VERİ KATMANI ═════════════════
// İki mod:
//  - local: kayıt bu tarayıcının localStorage'ında. claude.ai önizlemesi ve demo için.
//  - firebase: CFG.firebase doluysa ve sayfa kendi sunucunda yayındaysa. Gerçek pilot için.
// Uygulamanın geri kalanı hangi modda olduğunu bilmez; sadece Store'u çağırır.
var Store=(function(){
var mode='local',fb=null,ready=false,adminUser=null;
// Bazı mobil görünümler tarayıcı deposunu tamamen engelliyor. O durumda demo, bellekte çalışır
// (sayfa kapanınca silinir). Eskiden bu durumda kod listesi hiç oluşmuyor ve hiçbir kod kabul edilmiyordu.
var MEM={},memMode=false;try{localStorage.setItem('ilklot:_t','1');localStorage.removeItem('ilklot:_t')}catch(e){memMode=true}
function ls(k,v){if(memMode){if(v===undefined)return MEM[k]!==undefined?JSON.parse(MEM[k]):null;MEM[k]=JSON.stringify(v);return true}
try{if(v===undefined){var r=localStorage.getItem('ilklot:'+k);return r?JSON.parse(r):null}localStorage.setItem('ilklot:'+k,JSON.stringify(v));return true}catch(e){return null}}
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function initFb(){var b='https://www.gstatic.com/firebasejs/10.12.2/';
await loadScript(b+'firebase-app-compat.js');await loadScript(b+'firebase-auth-compat.js');await loadScript(b+'firebase-firestore-compat.js');
firebase.initializeApp(CFG.firebase);
// Katılımcılar anonim oturum açar: kimlik bilgisi toplanmaz ama güvenlik kuralları çalışır
if(!firebase.auth().currentUser)await firebase.auth().signInAnonymously();
fb={db:firebase.firestore(),auth:firebase.auth()};
var u=fb.auth.currentUser;adminUser=u&&!u.isAnonymous?u.email:null}
return{
mode:function(){return mode},
memMode:function(){return memMode},
isAdminAuthed:function(){return mode==='local'||!!adminUser},
adminEmail:function(){return adminUser},
init:async function(){
if(DEMO){ready=true;return}  // Tanıtım: sunucuya bağlanma, yerel liste oluşturma
if(CFG.firebase){try{await initFb();mode='firebase'}catch(e){console.warn('Firebase başlatılamadı, yerel kayda geçildi',e);mode='local'}}
// Demo kolaylığı: yerel modda liste yoksa 40 kişilik örnek liste oluştur
// Eski biçimdeki (P001-ABC) demo listesi varsa yenisiyle değiştir
var al=mode==='local'?ls('alloc'):null;if(mode==='local'&&(!al||Object.keys(al).some(function(k){return !CODE_RE.test(k)}))){ls('alloc',makeAlloc(40,4,0));remember(null)}
ready=true},
getAlloc:async function(code){if(mode==='firebase'){var d=await fb.db.collection('allocations').doc(code).get();return d.exists?d.data():null}return (ls('alloc')||{})[code]||null},
getP:async function(code){if(mode==='firebase'){var d=await fb.db.collection('participants').doc(code).get();return d.exists?d.data():null}return ls('p:'+code)},
saveP:async function(code,data){if(DEMO)return;if(mode==='firebase')return fb.db.collection('participants').doc(code).set(data,{merge:true});
var cur=ls('p:'+code)||{};for(var k in data)cur[k]=data[k];ls('p:'+code,cur);var l=ls('plist')||[];if(l.indexOf(code)<0){l.push(code);ls('plist',l)}},
addEvents:async function(code,evs){if(DEMO||!evs.length)return;
if(mode==='firebase'){var b=fb.db.batch(),col=fb.db.collection('participants').doc(code).collection('events');evs.forEach(function(e){b.set(col.doc(e.session+'-'+String(e.n).padStart(6,'0')),e)});return b.commit()}
var cur=ls('ev:'+code)||[];if(ls('ev:'+code,cur.concat(evs))===null)throw new Error('Yerel depolama dolu')},
// ── Araştırmacı işlemleri ──
adminLogin:async function(email,pw){if(mode!=='firebase')return;var c=await fb.auth.signInWithEmailAndPassword(email,pw);adminUser=c.user.email},
adminLogout:async function(){if(mode!=='firebase')return;await fb.auth.signOut();await fb.auth.signInAnonymously();adminUser=null},
listAlloc:async function(){if(mode==='firebase'){var q=await fb.db.collection('allocations').get(),o={};q.forEach(function(d){o[d.id]=d.data()});return o}return ls('alloc')||{}},
saveAlloc:async function(map){if(mode==='firebase'){var ks=Object.keys(map);for(var i=0;i<ks.length;i+=400){var b=fb.db.batch();ks.slice(i,i+400).forEach(function(k){b.set(fb.db.collection('allocations').doc(k),map[k])});await b.commit()}return}
ls('alloc',map)},
listP:async function(){if(mode==='firebase'){var q=await fb.db.collection('participants').get(),a=[];q.forEach(function(d){a.push(d.data())});return a}
return (ls('plist')||[]).map(function(c){return ls('p:'+c)}).filter(Boolean)},
listEvents:async function(code){if(mode==='firebase'){var q=await fb.db.collection('participants').doc(code).collection('events').get(),a=[];q.forEach(function(d){a.push(d.data())});return a}return ls('ev:'+code)||[]},
// Çekilme: yerelde veri hemen silinir. Firebase'de katılımcı silemez (kurallar izin vermez);
// kaydı "çekildi" olarak işaretlenir, analizden çıkarılır ve araştırmacı kalıcı olarak siler.
withdraw:async function(code,grp,extra){if(DEMO)return;var tomb={code:code,grp:grp,withdrawn:true,withdrawnAt:new Date().toISOString()};for(var k in extra||{})tomb[k]=extra[k];
if(mode==='firebase')return fb.db.collection('participants').doc(code).set(tomb,{merge:true});
try{['ev:','q:','evn:'].forEach(function(p){localStorage.removeItem('ilklot:'+p+code)})}catch(e){}ls('p:'+code,tomb)},
purgeWithdrawn:async function(){if(mode!=='firebase')return 0;var q=await fb.db.collection('participants').where('withdrawn','==',true).get(),n=0;
for(var i=0;i<q.docs.length;i++){var d=q.docs[i],x=d.data();if(x.purgedAt)continue;var ev=await d.ref.collection('events').get();
for(var j=0;j<ev.docs.length;j+=400){var b=fb.db.batch();ev.docs.slice(j,j+400).forEach(function(e){b.delete(e.ref)});await b.commit()}
// Sadece "bu kod çekildi" kaydı kalır; kod tekrar kullanılamaz, başka veri tutulmaz
await d.ref.set({code:d.id,grp:x.grp,withdrawn:true,withdrawnAt:x.withdrawnAt||null,purgedAt:new Date().toISOString()});n++}return n},
// Sistem testi: depolama, bağlantı, yetki, olay kuyruğu. Katılımcı yazma yetkisi gerçek bir kod gerektirdiği için
// Firebase'de yazma testi sadece araştırmacı girişliyken yapılır (allocations/__selftest__ yazılır, okunur, silinir).
selfTest:async function(){var out=[],ok=function(a,d){out.push({ad:a,ok:true,d:d||''})},no=function(a,d){out.push({ad:a,ok:false,d:d||''})},bil=function(a,d){out.push({ad:a,ok:null,d:d||''})};
if(memMode)no('Tarayıcı deposu','Engelli: kayıtlar bellekte tutulur ve sayfa kapanınca silinir. Bu görünümde (ör. bazı uygulama içi tarayıcılar) gerçek veri toplama yapılmamalı.');
else{try{localStorage.setItem('ilklot:_st','1');var v=localStorage.getItem('ilklot:_st');localStorage.removeItem('ilklot:_st');v==='1'?ok('Tarayıcı deposu','yazma ve okuma çalışıyor'):no('Tarayıcı deposu','yazılan değer okunamadı')}catch(e){no('Tarayıcı deposu','erişim hatası')}}
ok('Kayıt modu',mode==='firebase'?'Firebase (bulut)':'Yerel (demo): veri yalnızca bu cihazda');
if(CFG.firebase&&mode!=='firebase')no('Firebase bağlantısı','CFG.firebase dolu ama bağlanılamadı; yerel kayda düşüldü. Ağı, apiKey/projectId değerlerini ve Authentication > Authorized domains listesini kontrol et.');
if(mode==='firebase'){
var t0=Date.now();
try{await fb.db.collection('allocations').doc('__selftest__').get();ok('Firestore okuma ve anonim giriş','erişildi ('+(Date.now()-t0)+' ms)')}catch(e){no('Firestore okuma',(e&&e.code)||String(e))}
if(adminUser){try{var ref=fb.db.collection('allocations').doc('__selftest__');await ref.set({t:Date.now()});var rd=await ref.get();await ref.delete();rd.exists?ok('Firestore yazma (araştırmacı)','yazma, okuma ve silme başarılı'):no('Firestore yazma','yazılan kayıt okunamadı')}catch(e){no('Firestore yazma (araştırmacı)',(e&&e.code)||String(e))}}
else bil('Firestore yazma','Katılımcı yazması gerçek bir kod gerektirir. Araştırmacı girişi yap ya da kullanılmamış bir kartla akışı bitirip kaydın panelde göründüğünü doğrula.')}
else{try{ls('p:__selftest__',{t:Date.now()});var q=ls('p:__selftest__');if(memMode)delete MEM['p:__selftest__'];else localStorage.removeItem('ilklot:p:__selftest__');q&&q.t?ok('Yerel kayıt turu','yaz, oku, sil başarılı'):no('Yerel kayıt turu','okunamadı')}catch(e){no('Yerel kayıt turu',String(e))}}
bil('Olay kuyruğu',(typeof EVQ!=='undefined'?EVQ.length:0)+' gönderilmemiş olay'+(typeof S!=='undefined'&&S.syncErr?' · son senkron hatası: '+S.syncErr:''));
return out},
resetLocal:function(){for(var mk in MEM)delete MEM[mk];try{Object.keys(localStorage).filter(function(k){return k.indexOf('ilklot:')===0}).forEach(function(k){localStorage.removeItem(k)})}catch(e){}ls('alloc',makeAlloc(40,4,0))}
}})();

// ═════════════════ KOD VE RANDOMİZASYON ═════════════════
// Kod: 12 karakter, KM7D-P2XR-9TQA biçiminde. Karıştırılan karakterler (0/O, 1/I) alfabede yok.
// 32^12 ≈ 10^18 olasılık: tahmin etmek pratikte imkânsız. Sıra numarası koda gömülü değil, sadece araştırmacıda.
var ALPHA='23456789ABCDEFGHJKLMNPQRSTUVWXYZ',CODE_RE=/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
function cryptoInt(n){var a=new Uint32Array(1);(window.crypto||window.msCrypto).getRandomValues(a);return a[0]%n}
function newCode(){var c='';for(var i=0;i<12;i++){c+=ALPHA[cryptoInt(32)];if(i===3||i===7)c+='-'}return c}
// Boşluk, tire, küçük harf fark etmez; 12 karakter değilse geçersiz
function normCode(raw){var s=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');return s.length===12?s.slice(0,4)+'-'+s.slice(4,8)+'-'+s.slice(8):null}
// Yazarken 4'erli gruplara ayırır: "km7dp2" → "KM7D-P2"
function fmtCodeInput(raw){return String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12).replace(/(.{4})(?=.)/g,'$1-')}
// Blok randomizasyon: her 4 kişilik blokta 2 A + 2 B, sırası gizli rastgele. Grup sayıları hiçbir zaman 2'den fazla açılmaz
function makeAlloc(n,block,start){var map={},i=0;start=start||0;
while(i<n){var b=[];for(var k=0;k<block;k++)b.push([k<block/2?'A':'B',k%2]);
for(k=b.length-1;k>0;k--){var j=cryptoInt(k+1),t=b[k];b[k]=b[j];b[j]=t}
for(k=0;k<b.length&&i<n;k++,i++){var c;do{c=newCode()}while(map[c]);map[c]={grp:b[k][0],order:b[k][1],no:start+i+1,block:Math.floor((start+i)/block)+1}}}
return map}
function linkFor(code){var base=(S.baseIn||CFG.baseUrl||(location.origin+location.pathname)).split('#')[0];return base+'#k='+code}
function remember(code){if(DEMO)return;try{code?localStorage.setItem('ilklot:me',code):localStorage.removeItem('ilklot:me')}catch(e){}}
function remembered(){if(DEMO)return null;try{return localStorage.getItem('ilklot:me')}catch(e){return null}}
function maskCode(c){return '••••-••••-'+String(c).slice(-4)}

// ═════════════════ OLAY KAYDI ═════════════════
// Her anlamlı eylem zaman damgası + deneme numarasıyla kaydedilir. Analiz bu ham veriden yapılır.
var EVQ=[],evN=0,flushing=false;
// Alıştırma simülatöründe (S.prac) yalnızca tur olayları kaydedilir
function log(type,data){if(DEMO||!S.code||S.replay||S.free)return;if(S.prac&&type.indexOf('tour_')!==0)return;evN++;
// Sayaç anlık görüntüden bağımsız saklanır: uygulama sert kapanırsa (ör. işletim sistemi sekmeyi öldürürse) yeniden açılışta aynı olay numaraları kullanılmasın
try{localStorage.setItem('ilklot:evn:'+S.code,String(evN))}catch(e){}
EVQ.push({v:APP_VERSION,code:S.code,grp:S.grp,session:CFG.session,n:evN,ts:new Date().toISOString(),ti:S.ti,type:type,data:data||{}});
saveQueue()}
// ── Tarayıcı hataları ──
// Sahada katılımcının cihazında çıkan hatayı görmenin tek yolu bu. Aynı hata tekrar tekrar yazılmaz, oturum başına en fazla 20
var ERRS_SEEN={},errCount=0,preErr=[];
function captureErr(kind,msg,extra){var key=kind+msg;if(ERRS_SEEN[key]||errCount>=20)return;ERRS_SEEN[key]=1;errCount++;
var d={kind:kind,msg:String(msg).slice(0,300),stage:S.stage,tab:S.tab};for(var k in extra||{})d[k]=extra[k];
if(S.code)log('client_error',d);else preErr.push(d)}
addEventListener('error',function(e){captureErr('error',e.message,{src:(e.filename||'').slice(-60),line:e.lineno,col:e.colno,stack:e.error&&e.error.stack?String(e.error.stack).slice(0,500):null})});
addEventListener('unhandledrejection',function(e){var r=e.reason;captureErr('promise',r&&r.message||r,{stack:r&&r.stack?String(r.stack).slice(0,500):null})});

// ── Kayıt durumu ──
// Yerel modda kayıt cihazda yapıldığı için internet durumu önemsiz; sadece Firebase'de anlamlı
function syncState(){if(S.syncErr||(Store.mode()==='firebase'&&!navigator.onLine))return 'err';return EVQ.length?'pend':'ok'}
function updDot(){var d=$('sdot');if(!d)return;var s=syncState();d.className='dot'+(s==='ok'?'':' '+s);
d.setAttribute('aria-label',s==='ok'?'Veriler kaydedildi':s==='pend'?'Veriler gönderiliyor':'Bağlantı yok, veriler cihazda bekliyor');d.title=d.getAttribute('aria-label')}
addEventListener('online',function(){S.syncErr=null;note('Bağlantı geri geldi, veriler gönderiliyor.');flush()});
addEventListener('offline',function(){note('Bağlantı koptu. İşlemlerin cihazda bekliyor, bağlantı gelince gönderilecek.');updDot()});

function saveQueue(){if(DEMO)return;try{localStorage.setItem('ilklot:q:'+S.code,JSON.stringify(EVQ))}catch(e){}}
async function flush(){if(DEMO||flushing||!EVQ.length||!S.code)return;flushing=true;var batch=EVQ.slice(0,400);
try{await Store.addEvents(S.code,batch);EVQ=EVQ.slice(batch.length);saveQueue();S.syncErr=null}
catch(e){S.syncErr=String(e&&e.message||e)}  // Gönderilemeyen olaylar kuyrukta kalır, sonra tekrar denenir
flushing=false;updDot()}

// ═════════════════ ANLIK GÖRÜNTÜ VE DEVAM ═════════════════
function snapshot(){var m=S.sim;var qk=QUICK?1:0;if(typeof tabTick==='function')tabTick();return{quick:qk,tabT:S.tabT,readMs:S.readMs,tourSeen:S.tourSeen,comp:S.comp,helpN:S.helpN||0,v:APP_VERSION,seed:CFG.seed,phase:S.phase,block:S.block,order:S.order,guess:S.guess,sim:m?{tick:m.tick,cash:m.cash,pos:m.pos,trades:m.trades,v0:m.v0}:null,ti:S.ti,dec:S.dec,total:S.total,pulses:S.pulses,practiced:!!S.practiced,cd:S.cd,ended:S.ended,endedAt:S.endedAt||null,evN:evN,updatedAt:new Date().toISOString()}}
async function saveSnap(){if(DEMO||S.prac||S.free||!S.code)return;var p={};p['sess_'+CFG.session]=snapshot();p.updatedAt=new Date().toISOString();p.lastVersion=APP_VERSION;try{await Store.saveP(S.code,p)}catch(e){S.syncErr=String(e&&e.message||e)}}
// Uyaranlar tohumdan sabit olduğu için sadece kararlar ve sıradaki deneme numarası geri yüklenir
function restore(sn){['phase','block','ti','dec','total','pulses','practiced','cd','ended','endedAt','guess','tourSeen','comp','helpN','tabT','readMs'].forEach(function(k){if(sn[k]!==undefined)S[k]=sn[k]});evN=Math.max(evN,sn.evN||0);
// Simülatör: fiyatlar tohumdan kaydedilen güne kadar yeniden üretilir, portföy anlık görüntüden gelir
if(sn.sim){simInit();while(S.sim.tick<sn.sim.tick)simStep();S.sim.cash=sn.sim.cash;S.sim.pos=sn.sim.pos;S.sim.trades=sn.sim.trades||[];S.simTab='p';S.tabSince=Date.now()}
if(!S.tabT)S.tabT={p:0,m:0,a:0}}

// ═════════════════ GİRİŞ AKIŞI ═════════════════
// Sıradaki oturum: bitmemiş ilk oturum. Böylece tek link bütün oturumlar için yeterli
function nextSession(p){for(var i=1;i<=CFG.totalSessions;i++){var sn=p['sess_'+i];if(!sn||!sn.ended)return {n:String(i),prev:p['sess_'+(i-1)]}}return null}
function gapLeftMs(prev){if(!prev||!prev.endedAt||!CFG.minGapHours)return 0;return Math.max(0,new Date(prev.endedAt).getTime()+CFG.minGapHours*3600000-Date.now())}
function codeFail(msg){S.busy=false;S.codeErr=msg;S.stage='code';render();var e=$('cerr');if(e){e.classList.remove('shake');void e.offsetWidth;e.classList.add('shake')}}

// Açılış: linkte kod varsa ya da bu cihaz bir katılımcıyı hatırlıyorsa onu karşıla
async function boot(){await storeReady;if(DEMO){S.grp='B';S.stage='demoland';return render()}var fromLink=normCode(HASH.get('k')),code=fromLink||remembered();
// Kodu adres çubuğundan ve geçmişten kaldır (ekran görüntüsünde ya da yan bakışta görünmesin)
if(fromLink)try{history.replaceState(null,'',location.pathname+location.search+(S.admin?'#admin':''))}catch(e){}
if(!code){S.stage='consent';return render()}
try{var a=await Store.getAlloc(code);
if(!a){remember(null);S.codeIn=code;S.codeErr=fromLink?'Bu link geçersiz. Kartındaki kodu kontrol et ya da araştırmacıya sor.':'';S.stage='consent';S.pendingCode=null;return render()}
var p=await Store.getP(code)||{};
if(p.withdrawn){remember(null);S.stage='withdrawn';return render()}
S.pendingCode=code;S.welcome={code:code,next:nextSession(p)};S.stage=p.consentAt?'welcome':'consent';render()}
catch(e){S.stage='consent';render()}}

async function enterCode(raw){await storeReady;var code=normCode(raw);S.codeErr='';
if(!code)return codeFail('Kod 12 karakter olmalı, örneğin KM7D-P2XR-9TQA.');
S.busy=true;render();
try{var a=await Store.getAlloc(code);
// Demo modunda kod listesi her cihazda ayrı üretilir: başka cihazda indirilen kart kodu burada geçersizdir
if(!a){remember(null);return codeFail(Store.mode()==='local'?'Bu kod bu cihazın demo listesinde yok. Demo modunda her cihazın kodları farklıdır; aşağıdaki demo kodlarından birine dokun.':'Bu kod listede yok. Kartındaki kodu kontrol et.')}
var p=await Store.getP(code)||{};
if(p.withdrawn){remember(null);return codeFail(Store.mode()==='local'?'Bu demo kodla daha önce çalışmadan çekilmişsin. Aşağıdaki diğer demo kodlarından birine dokun ya da demo verisini sıfırla.':'Bu kodla çalışmadan çekilmişsin. Tekrar katılmak istersen araştırmacıyla konuş.')}
var nx=FORCED_SESSION?{n:FORCED_SESSION,prev:null}:nextSession(p);
// Tüm oturumlar bitti: son oturumun sonuna götür (son test / bilgilendirme eksikse orada tamamlanır)
if(!nx){var L=String(CFG.totalSessions);CFG.session=L;S.code=code;S.grp=a.grp;S.order=a.order!=null?a.order:seedOf(code)%2;S.pre=p.pre!=null?p.pre:null;S.preB3=p.preB3!=null?p.preB3:null;S.post=p.post!=null?p.post:null;S.manip=p.manip||null;S.fb=p.fb||null;remember(code);if(p['sess_'+L])restore(p['sess_'+L]);S.ended=true;S.busy=false;S.stage='end';return render()}
var wait=gapLeftMs(nx.prev);if(wait>0){S.busy=false;S.waitUntil=Date.now()+wait;S.waitSess=nx.n;S.stage='wait';remember(code);return render()}
CFG.session=nx.n;
remember(code);
// İlk onam zamanı katılımcı kaydına yazılır; sonraki oturumlarda onam tekrar sorulmaz
if(S.consentAt&&!p.consentAt)await Store.saveP(code,{code:code,grp:a.grp,consentAt:S.consentAt,quick:QUICK||undefined,consentVer:CONSENT_VER,consentOpened:Object.keys(S.consentOpen||{}),consentDl:!!S.consentDl,consentMs:S.consentMs});
S.code=code;S.grp=a.grp;S.order=a.order!=null?a.order:seedOf(code)%2;S.pre=p.pre!=null?p.pre:null;S.preB3=p.preB3!=null?p.preB3:null;S.post=p.post!=null?p.post:null;S.manip=p.manip||null;S.hasDemo=!!p.demo;
// Önceki oturumdan gönderilemeyen olaylar varsa kuyruğa geri al
try{var q=JSON.parse(localStorage.getItem('ilklot:q:'+code)||'[]');if(q.length)EVQ=q}catch(e){}
// Olay numarası sürekliliği: anlık görüntü eski kalmış olabilir; saklı sayaç ve kuyruktaki en büyük numaradan devam edilir
evN=0;try{evN=Math.max(0,parseInt(localStorage.getItem('ilklot:evn:'+code)||'0',10)||0)}catch(e){}EVQ.forEach(function(e){if(e.n>evN)evN=e.n});
var sn=p['sess_'+CFG.session];
if(sn&&sn.seed===CFG.seed){restore(sn);S.busy=false;
if(S.ended){S.stage='end';render();return}
S.stage=S.practiced?'app':(S.pre==null?'pre':'intro');log('session_resume',{ti:S.ti});render();note('Kaldığın yerden devam ediyorsun.');return}
await Store.saveP(code,{code:code,grp:a.grp,firstSeen:p.firstSeen||new Date().toISOString()});
preErr.forEach(function(d){log('client_error',d)});preErr=[];
if(S.consentAt)log('consent_given',{ver:CONSENT_VER,opened:Object.keys(S.consentOpen||{}),dl:!!S.consentDl,ms:S.consentMs});
log('session_start',{theme:document.documentElement.getAttribute('data-theme')||'light',quick:QUICK,v:APP_VERSION,seed:CFG.seed,order:S.order,fp:fingerprint(),ua:navigator.userAgent.slice(0,120),screen:innerWidth+'x'+innerHeight,consentAt:S.consentAt});
// İlk kez gelen: ön test → tanıtım → alıştırma. Sonraki oturumlar doğrudan piyasaya
S.busy=false;if(S.pre==null){S.stage=S.hasDemo?'pre':'demo';S.dm={inv:[]};S.intro=0}else{S.stage='app';saveSnap()}render();flush()}
catch(e){S.busy=false;S.codeErr='Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.';render()}}

function endSession(){if(S.ended)return;S.ended=true;S.phase='done';S.endedAt=new Date().toISOString();S.filmP=null;
log('session_end',{total:Math.round(S.total),decisions:S.dec.length,fp:fingerprint()});
S.stage='end';render();saveSnap();flush()}

// ═════════════════ DIŞA AKTARMA ═════════════════
function csvCell(v){if(v==null)return '';v=typeof v==='object'?JSON.stringify(v):String(v);return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function toCsv(rows){return rows.map(function(r){return r.map(csvCell).join(',')}).join('\n')}
async function saveFile(name,text){var data=/\.svg$/.test(name)?text:'\ufeff'+text;  // BOM: Excel'de Türkçe karakterler bozulmasın
var d=typeof claude!=='undefined'&&claude.use?await claude.use('downloads'):null,mime=/\.html$/.test(name)?'text/html':/\.svg$/.test(name)?'image/svg+xml':/\.txt$/.test(name)?'text/plain':'text/csv';
if(d){try{await d.save({filename:name,data:data});note('Dosya kaydedildi.')}catch(e){note(e&&e.code==='declined'?'İndirme iptal edildi.':'İndirme bu görünümde yapılamadı.')}return}
var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:mime+';charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}

// Katılımcı özeti: her satır bir katılımcı. pre = 1. bölüm, post = 3. bölüm (VERI_SOZLUGU.md)
function summarizeSnap(code,grp,sess,sn){var D=sn.dec||[],cd=sn.cd||{n:0,v:0,g:0},pu=sn.pulses||{},sim=sn.sim||{trades:[]},T=sim.trades||[],
B=function(b){return D.filter(function(d){return d.block===b})},
rate=function(a,f,g){a=a.filter(f);return a.length?r2(a.filter(g).length/a.length):''},
isSell=function(d){return d.final==='sat'},cl=function(d){return d.kind==='kriz'&&d.pos==='zarar'},
med=function(a){a=a.filter(function(v){return v!=null}).sort(function(x,y){return x-y});return a.length?(a.length%2?a[(a.length-1)/2]:Math.round((a[a.length/2-1]+a[a.length/2])/2)):''},
blk=function(b){var a=B(b),g=rate(a,function(d){return d.kind==='normal'&&d.pos==='kar'},isSell),l=rate(a,function(d){return d.kind==='normal'&&d.pos==='zarar'},isSell);
 return [rate(a,cl,isSell),rate(a,function(d){return d.kind==='kriz'},isSell),g,l,(g!==''&&l!=='')?r2(g-l):'',rate(a,function(d){return d.kind==='kriz'},function(d){return d.final==='al'}),med(a.filter(function(d){return !d.hid}).map(function(d){return d.rtFirst}))]},
pre=blk('pre'),post=blk('post'),sells=T.filter(function(t){return t.side==='S'});
return [sn.v||'',code,grp,sn.order===1?'Y→X':'X→Y',sn.ended?1:0,D.length,
pre[0],post[0],(pre[0]!==''&&post[0]!=='')?r2(post[0]-pre[0]):'',   // ana ölçüt: panik satış oranı ve değişimi
pre[1],post[1],pre[2],pre[3],post[2],post[3],pre[4],post[4],pre[5],post[5],pre[6],post[6],
T.length,sells.length,sells.filter(function(t){return t.pl!=null&&t.pl<=CFG.lossThreshold}).length,sells.filter(function(t){return t.pl!=null&&t.pl<=CFG.lossThreshold&&t.postCrisis}).length,
T.filter(function(t){return t.side==='B'}).length,
// Satış gerekçeleri: "Korktum:2|Haber yüzünden:1" biçiminde
SELL_WHY.map(function(w){var n=sells.filter(function(t){return t.why===w}).length;return n?w+':'+n:''}).filter(Boolean).join('|'),
cd.n,cd.v,cd.g,
Math.round(((sn.tabT||{}).p||0)/1000),Math.round(((sn.tabT||{}).m||0)/1000),Math.round(((sn.tabT||{}).a||0)/1000),sn.readMs!=null?Math.round(sn.readMs/1000):'',
pu.b_pre&&pu.b_pre.v||'',pu.b_sim&&pu.b_sim.v||'',pu.b_post&&pu.b_post.v||'',sn.updatedAt,sn.quick?1:'']}
async function exportParticipants(){var ps=await Store.listP(),rows=[['app_version','code','grp','set_order','completed','decisions',
'panic_rate_pre','panic_rate_post','panic_rate_change','sell_rate_crisis_pre','sell_rate_crisis_post','sell_rate_gain_pre','sell_rate_loss_pre','sell_rate_gain_post','sell_rate_loss_post','disposition_pre','disposition_post','buy_more_crisis_pre','buy_more_crisis_post','rt_median_pre_ms','rt_median_post_ms',
'sim_trades','sim_sells','sim_loss_sells','sim_loss_sells_crisis','sim_buys','sim_sell_reasons','cooldown_shown','cooldown_cancel','cooldown_proceed','sim_time_portfolio_s','sim_time_market_s','sim_time_analysis_s','reading_s',
'stress_pre','stress_sim','stress_post','updated_at','test_mode','pre_test','pre_test_b3','post_test','attention_pass','comprehension_first_try','help_opens','manip_saw_wait','purpose_guess','age','gender','field','year','invest_exp','sim_exp','consent_version','consent_sections_opened','consent_downloaded','consent_read_s','pilot_clear','pilot_duration','pilot_unease']];
ps=ps.filter(function(p){return !p.withdrawn});
ps.forEach(function(p){var sn=p['sess_1'];if(!sn)return;var d=p.demo||{},fb=p.fb||{};rows.push(summarizeSnap(p.code,p.grp,'1',sn).concat([p.pre,p.preB3!=null?p.preB3:'',p.post,p.attPass==null?'':(p.attPass?1:0),p.comp!=null?p.comp:(sn.comp&&sn.comp.score!=null?sn.comp.score:''),sn.helpN||0,p.manip||'',p.guess||'',d.age||'',d.gender||'',d.field||'',d.year||'',(d.inv||[]).join('|'),d.sim||'',p.consentVer||'',(p.consentOpened||[]).length,p.consentDl?1:0,p.consentMs!=null?Math.round(p.consentMs/1000):'',fb.clear!=null?fb.clear:'',fb.dur||'',fb.unease||'']))});
await saveFile('ilklot_katilimcilar_'+new Date().toISOString().slice(0,10)+'.csv',toCsv(rows))}
async function exportEvents(){var ps=(await Store.listP()).filter(function(p){return !p.withdrawn}),rows=[['app_version','code','grp','session','n','ts','trial_index','type','data']];
for(var i=0;i<ps.length;i++){var ev=await Store.listEvents(ps[i].code);ev.sort(function(a,b){return a.session===b.session?a.n-b.n:String(a.session).localeCompare(String(b.session))});ev.forEach(function(e){rows.push([e.v||'',e.code,e.grp,e.session,e.n,e.ts,e.ti,e.type,e.data])})}
await saveFile('ilklot_olaylar_'+new Date().toISOString().slice(0,10)+'.csv',toCsv(rows))}
function byNo(m){return Object.keys(m).sort(function(a,b){return (m[a].no||0)-(m[b].no||0)})}
// Araştırmacı listesi: grup SADECE burada var, kartlarda yok
async function exportAlloc(){var m=await Store.listAlloc(),rows=[['no','code','grp','set_order','block','link']];byNo(m).forEach(function(k){rows.push([m[k].no,k,m[k].grp,m[k].order===1?'Y→X':'X→Y',m[k].block,linkFor(k)])});await saveFile('ilklot_liste_GIZLI.csv',toCsv(rows))}
// Yazdırılabilir katılım kartları (A4, sayfada 6-8 kart): QR + kod. Grup bilgisi YOK
async function exportCards(){var m=await Store.listAlloc(),ks=byNo(m);
var cards=ks.map(function(k){return '<div class="c"><div class="n">No '+m[k].no+'</div><div class="h">İlk Lot · Katılım kartın</div>'+qrSvg(linkFor(k),150)+'<div class="k">'+k+'</div><p>Telefonunun kamerasıyla QR kodu okut.<br>Okutamazsan uygulamada bu kodu yaz.</p><p class="w">Bu kart sana özel. Kimseyle paylaşma.</p></div>'}).join('');
var html='<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>İlk Lot katılım kartları</title><style>@page{size:A4;margin:10mm}body{font-family:system-ui,-apple-system,sans-serif;margin:10px;color:#111}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(85mm,1fr));gap:6mm}.c{border:1px dashed #999;border-radius:4mm;padding:5mm;text-align:center;break-inside:avoid;position:relative}.h{font-weight:700;font-size:13px;margin-bottom:2mm}.k{font:700 18px ui-monospace,Menlo,Consolas,monospace;letter-spacing:1px;margin:2mm 0}p{font-size:11px;margin:1mm 0}.w{font-weight:600}.n{position:absolute;top:3mm;right:4mm;font-size:9px;color:#888}</style></head><body><div class="g">'+cards+'</div></body></html>';
await saveFile('ilklot_katilim_kartlari.html',html)}

// ═════════════════ CANLI PANO ═════════════════
// Sadece SÜREÇ gösterilir: katılım, ilerleme, veri kalitesi. Sonuç değişkenleri (panik satış vb.)
// veri toplama bitene kadar bilerek gösterilmez; ara sonuçlara bakmak analiz yanlılığı yaratır.
// Anlık görüntüden "şu an nerede" metni
function stageText(sn){var T=TRS.X.length;if(sn.phase==='sim')return sn.sim?'simülatör, gün '+sn.sim.tick+'/'+CFG.simTicks:'simülatör başlıyor';
if(sn.phase==='post')return '3. bölüm, '+Math.min(sn.ti||0,T)+'/'+T+' karar';if(sn.phase==='done'||sn.ended)return 'bitti';
return (sn.practiced?'1. bölüm, '+(sn.ti||0)+'/'+T+' karar':'hazırlık (form, test, alıştırma)')}
async function loadDash(){S.dashBusy=true;render();try{var ps=await Store.listP(),al=await Store.listAlloc(),now=Date.now(),N=CFG.totalSessions;
var isQ=function(p){for(var j=1;j<=N;j++){var s0=p['sess_'+j];if(s0&&s0.quick)return true}return false};
var tmode=ps.filter(function(p){return p.consentAt&&!p.withdrawn&&isQ(p)}).length;  // hızlı test modu oturumları sayılmaz (analizden de çıkarılır)
var real=ps.filter(function(p){return p.consentAt&&!p.withdrawn&&!isQ(p)}),sess=[],flags=[],days={},act=0,done=0,bal={A:0,B:0},live=[];
for(var i=1;i<=N;i++)sess.push({c:0,r:0});
real.forEach(function(p){bal[p.grp]=(bal[p.grp]||0)+1;var all=true;
for(var i=1;i<=N;i++){var sn=p['sess_'+i];if(sn&&sn.ended)sess[i-1].c++;else{all=false;if(sn){sess[i-1].r++;
var age=now-new Date(sn.updatedAt||p.updatedAt||0).getTime();if(age<180000)act++;else if(age>86400000)flags.push([p.code,'Oturum '+i+' yarıda kaldı (24 saatten fazla)']);
// Ekranda ya da yeni durmuş (1 saat içinde): gözlemcinin yanına gidebileceği kişiler
if(age<=3600000)live.push({code:p.code,min:Math.floor(age/60000),at:stageText(sn)})}}
if(sn&&sn.ended&&(sn.dec||[]).length&&(sn.dec||[]).every(function(d){return d.final===sn.dec[0].final}))flags.push([p.code,'Bütün kararlar aynı seçenek (dikkatsiz olabilir)'])}
if(all)done++;if(p.attPass===false)flags.push([p.code,'Dikkat kontrolünü geçemedi']);if(all&&p.post==null)flags.push([p.code,'Son test eksik']);
var d=String(p.consentAt).slice(0,10);days[d]=(days[d]||0)+1});
S.dash={at:now,codes:Object.keys(al).length,cons:real.length,act:act,done:done,sess:sess,flags:flags,days:days,bal:bal,
live:live.sort(function(a,b){return a.min-b.min}),tmode:tmode,wd:ps.filter(function(p){return p.withdrawn&&!p.ineligible}).length,inel:ps.filter(function(p){return p.ineligible}).length}}
catch(e){note('Pano yüklenemedi: '+(e&&e.code||e))}S.dashBusy=false;render()}

function ringSvg(p){var r=34,c=2*Math.PI*r,o=c*(1-p);return '<svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true"><circle cx="44" cy="44" r="'+r+'" fill="none" stroke="var(--sf2)" stroke-width="10"/><circle cx="44" cy="44" r="'+r+'" fill="none" stroke="var(--up)" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+o.toFixed(1)+'" transform="rotate(-90 44 44)"/><text x="44" y="50" text-anchor="middle" font-family="Bricolage Grotesque,system-ui" font-weight="800" font-size="19" fill="var(--tx)">%'+Math.round(p*100)+'</text></svg>'}
function dashHtml(){var D=S.dash;
if(!D)return sec('Canlı pano','<p class="mu" style="margin:0 0 12px">Katılım ve veri kalitesini tek ekranda gör.</p><button class="btn pri" data-a="adDash"'+(S.dashBusy?' disabled':'')+'>'+(S.dashBusy?'Yükleniyor…':'Panoyu yükle')+'</button>');
var N=CFG.totalSessions,cons=Math.max(1,D.cons);
// Günlük katılım: son 14 gün
var dk=[],today=new Date();for(var i=13;i>=0;i--){var t=new Date(today.getTime()-i*86400000).toISOString().slice(0,10);dk.push([t,D.days[t]||0])}
var mx=Math.max.apply(0,dk.map(function(x){return x[1]}).concat([1])),bw=300/14;
var bars='<svg viewBox="0 0 300 100" width="100%" role="img" aria-label="Son 14 günde onam veren katılımcı sayısı">'+dk.map(function(x,i){var hh=x[1]/mx*58;return '<rect x="'+(i*bw+3).toFixed(1)+'" y="'+(78-hh).toFixed(1)+'" width="'+(bw-6).toFixed(1)+'" height="'+Math.max(hh,1.5).toFixed(1)+'" rx="3" fill="'+(x[1]?'var(--ac)':'var(--sf2)')+'"/>'+(x[1]?'<text x="'+(i*bw+bw/2).toFixed(1)+'" y="'+(74-hh).toFixed(1)+'" font-size="9" font-weight="700" text-anchor="middle" fill="var(--tx)">'+x[1]+'</text>':'')+(i%3===1||i===13?'<text x="'+(i*bw+bw/2).toFixed(1)+'" y="94" font-size="8.5" text-anchor="middle" fill="var(--mu)">'+x[0].slice(8,10)+'.'+x[0].slice(5,7)+'</text>':'')}).join('')+'</svg>';
var sb=D.sess.map(function(s,i){var c=s.c/cons*100,r=s.r/cons*100;return '<div class="met"><div class="mh"><span>Oturum '+(i+1)+'</span><b class="num">'+s.c+' bitti · '+s.r+' sürüyor</b></div><div class="stack" style="height:10px;margin:0;background:var(--sf2);border-radius:5px"><i style="width:'+c+'%;background:var(--up)"></i><i style="width:'+r+'%;background:var(--ac)"></i></div></div>'}).join('');
var tb=D.bal.A+D.bal.B||1;
return sec('Canlı pano','<div style="display:flex;align-items:center;gap:14px;margin:2px 0 14px">'+ringSvg(D.done/cons)+'<div><div style="font:700 15px var(--fd)">Tüm oturumları bitiren</div><div class="mu sm">'+D.done+' / '+D.cons+' katılımcı</div><div class="mu" style="font-size:11px;margin-top:4px">Son güncelleme '+new Date(D.at).toLocaleTimeString('tr-TR').slice(0,5)+'</div></div></div>'+
'<div class="kpis"><div class="kpi"><span>Dağıtılan kod</span><b>'+D.codes+'</b></div><div class="kpi"><span>Onam veren</span><b>'+D.cons+'</b></div><div class="kpi"><span>Şu an aktif</span><b style="color:var(--up)">'+D.act+'</b></div><div class="kpi"><span>Çekilen / 18 altı</span><b>'+D.wd+' <i>/ '+D.inel+'</i></b></div></div>'+
'<div style="font-weight:700;margin:6px 0 4px">Şu an ekranda ya da yeni durmuş</div>'+(D.live.length?'<div>'+D.live.slice(0,12).map(function(x){return '<div class="flag"><code>'+esc(x.code)+'</code><span class="mu" style="text-align:right">'+esc(x.at)+' · '+(x.min<3?'<b style="color:var(--up)">aktif</b>':'<b style="color:var(--wt)">'+x.min+' dk önce durdu</b>')+'</span></div>'}).join('')+(D.live.length>12?'<p class="mu sm">+'+(D.live.length-12)+' kişi daha</p>':'')+'</div>':'<p class="mu sm" style="margin:0 0 8px">Şu an ekranda kimse yok.</p>')+
'<label class="cchk" style="margin:10px 0 4px"><input type="checkbox" data-in="dashAuto"'+(S.dashAuto?' checked':'')+'><span>Her 30 saniyede yenile (bu ekran açıkken)</span></label>'+(D.tmode?'<p class="mu sm" style="margin:4px 0 0">Hızlı test modunda '+D.tmode+' oturum var; sayılmadı.</p>':'')+
'<div style="font-weight:700;margin:14px 0 2px">Oturum ilerlemesi</div>'+sb+
'<div style="font-weight:700;margin:18px 0 6px">Günlük katılım (son 14 gün)</div>'+bars+
'<div style="font-weight:700;margin:14px 0 6px">Grup dengesi (sadece sayı)</div><div class="stack" style="height:10px;margin:0"><i style="width:'+(D.bal.A/tb*100)+'%;background:var(--mu2)"></i><i style="width:'+(D.bal.B/tb*100)+'%;background:var(--ln)"></i></div><div class="legend" style="margin-top:6px"><span>A: '+D.bal.A+'</span><span>B: '+D.bal.B+'</span></div>'+
'<div style="font-weight:700;margin:18px 0 4px">Veri kalitesi uyarıları ('+D.flags.length+')</div>'+(D.flags.length?'<div>'+D.flags.slice(0,12).map(function(f){return '<div class="flag"><code>'+esc(f[0])+'</code><span class="mu" style="text-align:right">'+esc(f[1])+'</span></div>'}).join('')+(D.flags.length>12?'<p class="mu sm">+'+(D.flags.length-12)+' uyarı daha</p>':'')+'</div>':'<p class="mu sm" style="margin:0">Uyarı yok.</p>')+
'<div class="note info" style="margin:16px 0 10px"><span>Sonuç değişkenleri (panik satış, elden çıkarma etkisi vb.) veri toplama bitene kadar bilerek gösterilmez. Ara sonuçlara bakmak analiz yanlılığı yaratır.</span></div><button class="btn" data-a="adDash"'+(S.dashBusy?' disabled':'')+'>'+(S.dashBusy?'Yükleniyor…':'Yenile')+'</button>')}

// ═════════════════ POSTER ═════════════════
// Yazdırılabilir A4/A3 poster. Tüm ölçüler mm × k ile verilir; A3'te k = √2 ve her şey orantılı büyür.
// Metin tanıtım sayfasıyla aynı: araştırmanın amacı genel, hipotez yok.
async function exportPoster(size){var u=(S.landIn||'').trim();if(!/^https?:\/\//.test(u)){note('Önce tanıtım sayfasının adresini yaz (https:// ile).');return}
var k=size==='A3'?1.4142:1,m=function(v){return (v*k).toFixed(2)+'mm'},mail=esc((S.posterMail||'').trim()),foot=esc((S.posterFoot||'').trim());
var fact=function(b,t){return '<div class="f"><b>'+b+'</b><span>'+t+'</span></div>'};
var html='<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>İlk Lot poster '+size+'</title><style>'+
'@page{size:'+size+';margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
'html,body{margin:0;background:#F4F4F4}body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111111}'+
'.p{width:'+m(210)+';height:'+m(297)+';margin:0 auto;display:flex;flex-direction:column;overflow:hidden;background:#F4F4F4}'+
'.top{background:#111111;color:#F0F0F2;padding:'+m(18)+' '+m(16)+' '+m(26)+';position:relative}'+
'.brand{display:flex;align-items:center;gap:'+m(3)+';font-weight:800;font-size:'+m(6)+'}'+
'.tag{display:inline-block;margin-top:'+m(10)+';font-size:'+m(3.4)+';font-weight:700;letter-spacing:.04em;padding:'+m(1.4)+' '+m(3.2)+';border-radius:99px;background:rgba(242,169,59,.18);color:#F6BE63}'+
'h1{font-size:'+m(19)+';line-height:.98;letter-spacing:-.035em;margin:'+m(5)+' 0 0;font-weight:850}h1 em{font-style:normal;color:#F2A93B}'+
'.lead{font-size:'+m(5)+';line-height:1.4;color:#C7CEDD;margin:'+m(6)+' 0 0;max-width:'+m(150)+'}'+
'.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:'+m(3)+';margin:-'+m(12)+' '+m(12)+' 0;position:relative}'+
'.f{background:#fff;border:1px solid #D8D8D8;border-radius:'+m(4)+';padding:'+m(3.6)+' '+m(3.2)+'}.f b{display:block;font-size:'+m(6.4)+';letter-spacing:-.02em}.f span{display:block;font-size:'+m(3)+';color:#595959;margin-top:'+m(.8)+';line-height:1.3}'+
'.mid{flex:1;display:grid;grid-template-columns:'+m(84)+' 1fr;gap:'+m(9)+';align-items:center;padding:'+m(12)+' '+m(14)+'}'+
'.qr{background:#fff;border-radius:'+m(6)+';padding:'+m(4)+';border:'+m(1.2)+' solid #F2A93B}.qr svg{display:block;width:100%;height:auto}'+
'.cta b{display:block;font-size:'+m(9)+';line-height:1.05;letter-spacing:-.02em}.cta p{font-size:'+m(4.2)+';color:#595959;margin:'+m(4)+' 0 0;line-height:1.45}.cta .u{font-size:'+m(3.2)+';font-weight:700;color:#000000;word-break:break-all;margin-top:'+m(4)+'}'+
'.ft{display:flex;justify-content:space-between;gap:'+m(6)+';padding:'+m(6)+' '+m(14)+';border-top:1px solid #D8D8D8;font-size:'+m(3.2)+';color:#595959}'+
'@media screen{body{padding:20px 0}.p{box-shadow:0 10px 40px rgba(0,0,0,.15)}}'+
'</style></head><body><div class="p">'+
'<div class="top"><div class="brand"><svg width="'+m(9)+'" height="'+m(9)+'" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#111111"/><rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#3A3A40" stroke-width="2"/><circle cx="32" cy="42" r="14" fill="#F2A93B"/><text x="32" y="48" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="700" fill="#111111">₺</text><line x1="32" y1="28" x2="32" y2="19" stroke="#4FC795" stroke-width="3" stroke-linecap="round"/><path d="M32 22 C24 22 21 16 21 13 C28 13 32 17 32 22Z" fill="#4FC795"/><path d="M32 22 C40 22 43 16 43 13 C36 13 32 17 32 22Z" fill="#4FC795"/></svg>İlk Lot</div>'+
'<span class="tag">Katılımcı aranıyor · Üniversite araştırması</span><h1>Piyasa düşerken<br><em>ne yaparsın?</em></h1>'+
'<p class="lead">Üniversite öğrencilerinin yatırım kararlarını inceleyen bir araştırma. Gerçek para yok; telefonundan, sanal bir piyasada.</p></div>'+
'<div class="facts">'+fact('~30 dk','tek oturum, telefondan')+fact('₺0','gerçek para yok')+fact('Anonim','ad, e-posta istenmez')+fact('18+','üniversite öğrencileri')+'</div>'+
'<div class="mid"><div class="qr">'+qrSvg(u,400)+'</div><div class="cta"><b>Okut,<br>bilgi al,<br>katıl.</b><p>Telefonunun kamerasını QR koda tut. Araştırmanın ayrıntıları, gizlilik ve katılım adımları açılır.</p><div class="u">'+esc(u.replace(/^https?:\/\//,''))+'</div>'+(mail?'<p style="margin-top:'+m(3)+'">İletişim: <b style="display:inline;font-size:inherit">'+mail+'</b></p>':'')+'</div></div>'+
'<div class="ft"><span>'+(foot||'İlk Lot araştırması')+'</span><span>Yatırım tavsiyesi değildir.</span></div>'+
'</div></body></html>';
await saveFile('ilklot_poster_'+size+'.html',html)}

// ═════════════════ ARAŞTIRMACI PANELİ ═════════════════
function adminHtml(){var A=S.allocCache,cnt=A?Object.keys(A).reduce(function(o,k){o[A[k].grp]++;return o},{A:0,B:0}):null;
var h='<div class="note"><span><b>Araştırmacı modu.</b> Bu bölüm katılımcıya görünmez. Kapatmak için logoya 5 kez dokun.</span></div>';
if(Store.mode()==='firebase'&&!Store.isAdminAuthed())return h+sec('Araştırmacı girişi','<input id="ae" class="field" type="email" placeholder="E-posta" aria-label="E-posta" autocomplete="username"><input id="ap" class="field" type="password" placeholder="Şifre" aria-label="Şifre" autocomplete="current-password" style="margin-top:8px"><button class="btn pri" style="margin-top:10px" data-a="adLogin">Giriş yap</button>'+(S.adErr?'<p class="dn sm">'+esc(S.adErr)+'</p>':''));
var unf=['controller','ethics','retention','hosting','support','contact'].filter(function(k){return /^\[DOLDUR|ornek\.edu\.tr/.test(k==='contact'?CFG.contact:CFG.consentInfo[k])});
h+=sec('Onam metni','<div class="kv"><span>Sürüm</span><b>'+CONSENT_VER+'</b></div>'+(unf.length?'<div class="note" style="margin:10px 0"><span><b>Doldurulmamış alan var:</b> '+unf.join(', ')+'. Pilottan önce <code>CFG.consentInfo</code> ve <code>CFG.contact</code> alanlarını doldur; aksi halde katılımcıya sarı işaretli yer tutucular görünür.</span></div>':'<p class="up sm" style="margin:8px 0">Tüm onam alanları dolu.</p>')+'<button class="btn" data-a="consentDl">Onam metnini indir (.txt)</button>');
h+=sec('Sistem testi','<p class="mu sm" style="margin:0 0 10px">Depolama, Firebase bağlantısı ve yetki, olay kuyruğu, cihaz ve ekran bilgisini kontrol eder. <b>Pilottan önce her test cihazında çalıştır</b> ve sonucu kopyalayıp sakla.</p><button class="btn pri" data-a="adSelf">Sistem testini çalıştır</button>');
h+=sec('Hızlı test modu',CFG.firebase?'<p class="mu sm" style="margin:0">Gerçek pilot modunda (Firebase ayarlı) kullanılamaz; bu bilerek böyle.</p>':'<div class="kv"><span>Durum</span><b>'+(QUICK?'AÇIK':'kapalı')+'</b></div><p class="mu sm" style="margin:6px 0 10px">Piyasa 10 kat hızlı akar (7,5 dk yerine yaklaşık 45 sn), bekleme 3 sn olur; fiyatlar, krizler ve haberler aynı günlerde gelir. Açıkken ekranda uyarı şeridi görünür ve 30 dk sonra kendiliğinden kapanır. Bu modda üretilen veri analizde kullanılmamalı (CSV\'de <code>test_mode</code> = 1). Adresin sonuna <code>?hizli=1</code> ekleyerek de açabilirsin.</p><button class="btn'+(QUICK?'':' pri')+'" data-a="adQuick">'+(QUICK?'Hızlı test modunu kapat':'Hızlı test modunu aç')+'</button>');
h+=sec('Tanıtım modu','<p class="mu sm" style="margin:0 0 10px">Simülatörü serbestçe gösterir; hiçbir veri kaydedilmez, bekleme ekranı çıkmaz. Adrese <code>?demo=1</code> eklemek de aynı işi yapar (bazı görünümlerde adres değiştirilemez, o zaman bu düğme). Çıkmak için ⋯ menüsünden "Tanıtımdan çık".</p><button class="btn" data-a="adDemo">Tanıtım modunu aç</button>');
h+=dashHtml();
h+=sec('Çalışma ayarları','<div class="kv"><span>Uygulama sürümü</span><b>'+APP_VERSION+'</b></div><div class="kv"><span>Kayıt yeri</span><b>'+(Store.mode()==='firebase'?'Firebase':'Bu tarayıcı (demo)')+'</b></div><div class="kv"><span>Oturum</span><b>'+esc(CFG.session)+'</b></div><div class="kv"><span>Akış</span><b>'+TRS.X.length+' karar → '+simMin()+' dk simülatör → '+TRS.Y.length+' karar</b></div><div class="kv"><span>Set sırası</span><b>X→Y / Y→X, gruplar içinde dengeli</b></div><div class="kv"><span>Bekleme (A grubu)</span><b>Sadece simülatörde, '+CFG.cooldownSec+' sn, zarar ≤ %'+Math.abs(CFG.lossThreshold*100)+'</b></div><div class="kv"><span>Simülatör krizleri</span><b>'+CFG.simCrises.map(function(c){return c.stocks.join('+')+' @'+c.at}).join(', ')+'</b></div><div class="kv"><span>Gruplar arası fark</span><b>Sadece simülatördeki bekleme</b></div><div class="kv"><span>Uyaran parmak izi</span><b class="num">'+fingerprint()+'</b></div>'+(S.code?'<div class="kv"><span>Bu cihazdaki katılımcı</span><b>'+esc(S.code)+' / '+S.grp+'</b></div><div class="kv"><span>Gönderilmeyi bekleyen olay</span><b>'+EVQ.length+'</b></div>':'')+(S.syncErr?'<p class="dn sm">Senkron hatası: '+esc(S.syncErr)+'</p>':'')+'<p class="mu sm" style="margin-top:10px">Parmak izi her cihazda aynı çıkmalı. Farklıysa katılımcılar farklı uyaranlar görüyor demektir.</p>');
h+=sec('Randomizasyon listesi',(cnt?'<div class="stats" style="margin:4px 0 12px"><div class="stat"><span>Toplam kod</span><b>'+(cnt.A+cnt.B)+'</b></div><div class="stat"><span>A (soğuma)</span><b>'+cnt.A+'</b></div><div class="stat"><span>B (kontrol)</span><b>'+cnt.B+'</b></div></div>':'<button class="btn" data-a="adLoadAlloc">Listeyi yükle</button>')+
'<p class="mu sm">Kodları katılımcılara tek tek dağıt. Hangi kodun hangi grupta olduğunu katılımcıyla paylaşma.</p><div style="display:flex;gap:8px;margin-top:10px"><input id="an" class="field" type="number" inputmode="numeric" value="80" min="4" step="4" aria-label="Kişi sayısı"><button class="btn sm" style="white-space:nowrap" data-a="adGen">Yeni liste</button></div><label class="lab" for="abu">Kartlardaki link adresi</label><input id="abu" class="field" data-in="baseIn" placeholder="https://…/ilk-lot.html" value="'+esc(S.baseIn||CFG.baseUrl||(location.origin+location.pathname))+'"><p class="mu sm">Kendi yayın adresini yaz. claude.ai önizlemesinin adresi katılımcılar için çalışmaz.</p><button class="btn pri" style="margin-top:10px" data-a="adCards">QR kartlarını indir (yazdırılabilir)</button><button class="btn" data-a="adExpAlloc">Gizli liste: no, kod, grup, link (CSV)</button>'+(Store.mode()==='local'&&cnt?'<p class="mu sm" style="margin-top:10px">Demo kodu: <b style="color:var(--tx)">'+Object.keys(A).sort()[0]+'</b></p>':''));
h+=sec('Çekilen katılımcılar',S.wdCount==null?'<button class="btn" data-a="adWd">Say</button>':'<div class="kv"><span>Çekilen</span><b>'+S.wdCount+'</b></div><p class="mu sm">Çekilenlerin verisi dışa aktarmaya girmez.'+(Store.mode()==='firebase'?' Kalıcı silmek için aşağıdaki düğmeyi kullan; etik kurula verdiğin süre içinde yap.':' Yerel modda veri çekilme anında silinir.')+'</p>'+(Store.mode()==='firebase'?'<button class="btn ghost-dn" data-a="adPurge">Çekilenlerin verisini kalıcı sil</button>':''));
h+=sec('Poster','<p class="mu sm" style="margin:0 0 8px">Tanıtım sayfasının yayın adresini yaz. Posterdeki QR oraya gider.</p><input class="field" data-in="landIn" placeholder="https://…/tanitim.html" value="'+esc(S.landIn||'')+'" aria-label="Tanıtım sayfası adresi"><input class="field" style="margin-top:8px" data-in="posterMail" placeholder="İletişim e-postası (isteğe bağlı)" value="'+esc(S.posterMail||'')+'" aria-label="İletişim e-postası"><input class="field" style="margin-top:8px" data-in="posterFoot" placeholder="Alt bilgi, örn. Üniversite adı (isteğe bağlı)" value="'+esc(S.posterFoot||'')+'" aria-label="Alt bilgi"><div style="display:flex;gap:8px;margin-top:10px"><button class="btn pri" style="flex:1" data-a="adPoster" data-v="A4">Poster A4</button><button class="btn pri" style="flex:1;margin:0" data-a="adPoster" data-v="A3">Poster A3</button></div><button class="btn" data-a="adPosterQR">Sadece QR (SVG)</button><p class="mu sm" style="margin-top:10px">Posterde hipotez ve müdahale geçmez; katılımcıyı etkilememek için bilinçli olarak genel tutuldu.</p>');
h+=sec('Veri dışa aktarma','<button class="btn pri" data-a="adExpP">Katılımcı özeti (CSV)</button><button class="btn" data-a="adExpE">Tüm olaylar (CSV)</button><p class="mu sm" style="margin-top:10px">Özet dosyada panic_rate = zararına yapılan elle satışlar / tüm elle satışlar. Analizi olay dosyasından da yeniden hesaplayabilirsin.</p>'+(Store.mode()==='local'?'<button class="btn" style="margin-top:6px" data-a="adReset">Yerel demo verisini sıfırla</button>':'<button class="btn" style="margin-top:6px" data-a="adLogout">Araştırmacı çıkışı ('+esc(Store.adminEmail())+')</button>'));
return h}

var ADMIN_ACT={
adDash:function(){loadDash()},
adPoster:function(v){exportPoster(v).catch(function(e){note('Poster oluşturulamadı: '+(e&&e.code||e))})},
adPosterQR:function(){var u=(S.landIn||'').trim();if(!/^https?:\/\//.test(u)){note('Önce tanıtım sayfasının adresini yaz (https:// ile).');return}saveFile('ilklot_poster_qr.svg',qrSvg(u,600))},
adLogin:async function(){S.adErr='';try{await Store.adminLogin($('ae').value,$('ap').value)}catch(e){S.adErr='Giriş başarısız: '+(e&&e.code||e)}render()},
adLogout:async function(){await Store.adminLogout();S.allocCache=null;render()},
adLoadAlloc:async function(){try{S.allocCache=await Store.listAlloc()}catch(e){note('Liste okunamadı: '+(e&&e.code||e))}render()},
adGen:function(){var n=Math.max(4,Math.round((parseInt($('an').value,10)||0)/4)*4);
askConfirm('Yeni liste',n+' kişilik yeni liste oluşturulacak.'+(Store.mode()==='local'?' Yerel listedeki eski kodlar silinir.':' Firebase\'deki mevcut kodlar korunur, yenileri eklenir.'),'Oluştur',false,function(){ADMIN_ACT._gen(n)})},
_gen:async function(n){
try{var cur=Store.mode()==='firebase'?await Store.listAlloc():{},m=makeAlloc(n,4,Object.keys(cur).length);
// Firebase'de sadece yeni kodlar yazılır; mevcut kodlar ve grupları değişmez
await Store.saveAlloc(m);S.allocCache=await Store.listAlloc();note(n+' kod oluşturuldu.')}catch(e){note('Kaydedilemedi: '+(e&&e.code||e))}render()},
adCards:function(){exportCards().catch(function(e){note('Kartlar oluşturulamadı: '+(e&&e.code||e))})},
adExpAlloc:function(){exportAlloc().catch(function(e){note('Dışa aktarılamadı: '+(e&&e.code||e))})},
adExpP:function(){exportParticipants().catch(function(e){note('Dışa aktarılamadı: '+(e&&e.code||e))})},
adExpE:function(){exportEvents().catch(function(e){note('Dışa aktarılamadı: '+(e&&e.code||e))})},
adReset:function(){askConfirm('Demo verisini sıfırla','Bu tarayıcıdaki tüm demo kayıtları ve kod listesi silinecek.','Sıfırla',true,function(){Store.resetLocal();location.reload()})},
adWd:async function(){var ps=await Store.listP();S.wdCount=ps.filter(function(p){return p.withdrawn}).length;render()},
adPurge:function(){askConfirm('Kalıcı silme','Çekilen katılımcıların tüm olay kayıtları ve oturum verileri silinecek. Geri alınamaz.','Kalıcı sil',true,async function(){try{var n=await Store.purgeWithdrawn();note(n+' katılımcının verisi silindi.')}catch(e){note('Silinemedi: '+(e&&e.code||e))}S.wdCount=null;render()})}};
