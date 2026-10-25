// Yeniden yapılandırmanın uyaranları ve fiyat yollarını değiştirmediğini doğrular (eski tek dosya ile yeni modüller karşılaştırılır).
// Kullanım: node tools/check-equivalence.mjs <eski ilk-lot.html>   (eski dosya git geçmişinden alınabilir)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const handler = { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : stub()), apply: () => stub(), construct: () => stub(), set: () => true, has: () => true };
function stub() { return new Proxy(function () {}, handler); }
const store = new Map();
const env = {
  document: new Proxy({ getElementById: () => stub(), addEventListener() {}, documentElement: stub(), querySelector: () => null, querySelectorAll: () => [], createElement: () => stub(), head: stub(), body: stub() }, { get: (t, k) => (k in t ? t[k] : stub()) }),
  localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {}, removeEventListener() {}, requestAnimationFrame() {}, cancelAnimationFrame() {},
  setInterval() { return 0; }, setTimeout() { return 0; }, clearTimeout() {}, clearInterval() {},
  innerWidth: 390, innerHeight: 844, devicePixelRatio: 2, navigator: { onLine: true, userAgent: 'node' },
  location: { search: '', hash: '', origin: 'http://localhost', pathname: '/', href: 'http://localhost/' }, console, Math, Date, JSON, URLSearchParams, Promise, Uint32Array, Object, Array, String, Number, parseInt, parseFloat, isNaN,
};
env.window = env;

// ── Eski kod ──
const oldHtml = fs.readFileSync(path.resolve(process.argv[2]), 'utf8');
const script = oldHtml.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\nvar storeReady=Store\.init\(\);\nrender\(\);boot\(\);\s*$/, '\n');
const ctx = vm.createContext({ ...env });
vm.runInContext(script + `
;globalThis.__old = (function(){ var out = {}; out.fp = fingerprint();
  simInit(); var h=0,s=''; while(S.sim.tick<CFG.simTicks){simStep();SIMBASE.forEach(function(b){s+=S.sim.p[b[0]].toFixed(6)+','})}
  for(var i=0;i<s.length;i++){h=(Math.imul(h,31)+s.charCodeAt(i))>>>0} out.hash = h+' '+s.length;
  out.sets = JSON.stringify([TRS.X.map(function(t){return [t.kind,t.pos,t.crowd,t.out,t.pl,t.path[t.path.length-1]]}), TRS.Y.map(function(t){return [t.kind,t.pos,t.crowd,t.out,t.pl,t.path[t.path.length-1]]})]);
  S.sim=null; out.practice = JSON.stringify(PR.map(function(t){return t.path[t.path.length-1]})); return out; })();
`, ctx);
const oldR = ctx.__old;

// ── Yeni modüller ──
const { navigator: fakeNavigator, ...rest } = env;
Object.assign(globalThis, rest);
Object.defineProperty(globalThis, 'navigator', { value: fakeNavigator, configurable: true });
const src = path.resolve(import.meta.dirname, '..', 'public', 'src');
const load = (p) => import(pathToFileURL(path.join(src, p)).href);
const sim = await load('models/market-simulation.js');
const gen = await load('models/trial-generator.js');
const data = await load('constants/market-data.js');
const cfg = await load('constants/app-config.js');
const { state } = await load('viewmodels/app-state.js');
sim.initSimulation();
let h = 0, s = '';
while (state.simulation.tick < cfg.CONFIG.simTicks) { sim.stepSimulation(); data.STOCK_BASES.forEach((b) => { s += state.simulation.p[b[0]].toFixed(6) + ','; }); }
for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
const newHash = h + ' ' + s.length;
const sets = JSON.stringify([gen.TRIAL_SETS.X, gen.TRIAL_SETS.Y].map((set) => set.map((t) => [t.kind, t.pos, t.crowd, t.out, t.pl, t.path[t.path.length - 1]])));
const practice = JSON.stringify(gen.PRACTICE_TRIALS.map((t) => t.path[t.path.length - 1]));
const checks = [
  ['uyaran parmak izi', oldR.fp, gen.stimulusFingerprint()],
  ['simülatör fiyat yolu özeti', oldR.hash, newHash],
  ['X ve Y karar setleri', oldR.sets, sets],
  ['alıştırma uyaranları', oldR.practice, practice],
];
let bad = 0;
for (const [name, a, b] of checks) { const ok = a === b; if (!ok) bad++; console.log(ok ? 'AYNI  ' : 'FARKLI', name, ok ? '' : `\n   eski: ${String(a).slice(0, 120)}\n   yeni: ${String(b).slice(0, 120)}`); }
console.log('Beklenen çalışma fiyat yolu özeti:', '3171573551 18600', '| yeni:', newHash);
process.exit(bad ? 1 : 0);
