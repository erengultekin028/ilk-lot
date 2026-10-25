// Modül bağlantı denetimi: her modülü Node'da (sahte tarayıcı ortamıyla) içe aktarır.
// "does not provide an export named" gibi bağlama hatalarını ve değerlendirme sırasındaki ReferenceError'ları yakalar.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const handler = { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : stub()), apply: () => stub(), construct: () => stub(), set: () => true, has: () => true };
function stub() { return new Proxy(function () {}, handler); }
const store = new Map();
Object.assign(globalThis, {
  document: new Proxy({ getElementById: () => stub(), addEventListener() {}, documentElement: stub(), querySelector: () => null, querySelectorAll: () => [], createElement: () => stub(), head: stub(), body: stub() }, { get: (t, k) => (k in t ? t[k] : stub()) }),
  localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  addEventListener() {}, removeEventListener() {}, requestAnimationFrame() {}, cancelAnimationFrame() {},
  innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
});
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true, userAgent: 'node', vibrate: undefined }, configurable: true });
globalThis.location = { search: '', hash: '', origin: 'http://localhost', pathname: '/', href: 'http://localhost/' };
globalThis.window = globalThis;

const root = path.resolve(import.meta.dirname, '..', 'public', 'src');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } })(root);
let bad = 0;
const entry = process.argv[2];
for (const f of (entry ? [path.resolve(entry)] : files)) {
  try { await import(pathToFileURL(f).href); }
  catch (e) { bad++; console.log('✗', path.relative(root, f), '->', String(e.message).split('\n')[0]); }
}
console.log(bad ? `${bad} dosyada bağlantı/değerlendirme hatası` : 'Tüm modüller bağlandı ve değerlendirildi.');
setTimeout(() => process.exit(bad ? 1 : 0), 100);
