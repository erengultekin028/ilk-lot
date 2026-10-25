// Sınıf adı tutarlılığı: JS dizelerinde class="..." içinde geçen her ad CSS'te tanımlı mı?
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
const pub = path.resolve(import.meta.dirname, '..', '..', 'public');
const defined = new Set();
for (const f of fs.readdirSync(path.join(pub, 'styles'))) {
  const root = postcss.parse(fs.readFileSync(path.join(pub, 'styles', f), 'utf8'));
  root.walkRules((r) => { if (r.parent.type === 'atrule' && /keyframes/.test(r.parent.name)) return; selectorParser((s) => s.walkClasses((c) => defined.add(c.value))).processSync(r.selector); });
}
const used = new Map();
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'vendor') walk(p); } else if (/\.(js|html)$/.test(e.name)) { const t = fs.readFileSync(p, 'utf8'); for (const m of t.matchAll(/class=(?:\\)?["']([^"'<>]*)/g)) for (const c of m[1].split(/\s+/).filter((x) => /^[A-Za-z][\w-]*$/.test(x))) { if (!used.has(c)) used.set(c, new Set()); used.get(c).add(path.relative(pub, p)); } } } })(pub);
const missing = [...used].filter(([c]) => !defined.has(c));
console.log('CSS sınıfı:', defined.size, '| kullanılan sınıf:', used.size, '| CSS\'te tanımsız:', missing.length);
for (const [c, files] of missing) console.log('  ', c, '←', [...files].slice(0, 2).join(', '));
