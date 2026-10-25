// Yeniden adlandırılacak ad envanterini çıkarır: durum alanları (S.x), eylem adları (ACT/ADMIN_ACT), DOM id, data-a, CSS sınıfları.
import fs from 'node:fs';
import path from 'node:path';
import * as walk from 'acorn-walk';
import { loadSource, parse } from './analyze.mjs';

const { text } = loadSource();
const { ast } = parse(text);
const stateProps = new Map();
const actKeys = [];
walk.full(ast, (n) => {
  if (n.type === 'MemberExpression' && n.object.type === 'Identifier' && n.object.name === 'S' && !n.computed && n.property.type === 'Identifier') {
    stateProps.set(n.property.name, (stateProps.get(n.property.name) || 0) + 1);
  }
  if (n.type === 'VariableDeclarator' && ['ACT', 'ADMIN_ACT'].includes(n.id.name) && n.init?.type === 'ObjectExpression') {
    for (const p of n.init.properties) actKeys.push(p.key?.name ?? p.key?.value);
  }
});
console.log('S.* alanları:', stateProps.size);
console.log([...stateProps.keys()].join(' '));
console.log('\nACT/ADMIN_ACT anahtarları:', actKeys.length);
console.log(actKeys.join(' '));
// DOM id'leri ve data-a değerleri (HTML dizeleri içinde)
const ids = new Set(), dataA = new Set(), classes = new Set(), dataOther = new Set();
const html = fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', 'kaynak', '01_head.html'), 'utf8');
for (const src of [text, html]) {
  for (const m of src.matchAll(/\bid=\\?["']([A-Za-z0-9_\-]+)/g)) ids.add(m[1]);
  for (const m of src.matchAll(/\$\('([A-Za-z0-9_\-]+)'\)/g)) ids.add(m[1]);
  for (const m of src.matchAll(/getElementById\('([A-Za-z0-9_\-]+)'\)/g)) ids.add(m[1]);
  for (const m of src.matchAll(/data-a=\\?["']([A-Za-z0-9_\-]+)/g)) dataA.add(m[1]);
  for (const m of src.matchAll(/data-(?!a=)([a-z\-]+)=/g)) dataOther.add(m[1]);
  for (const m of src.matchAll(/class=\\?["']([^"'\\]+)/g)) m[1].split(/\s+/).forEach((c) => c && !c.includes("'+") && classes.add(c));
}
console.log('\nDOM id:', ids.size, [...ids].join(' '));
console.log('\ndata-a:', dataA.size);
console.log('\ndiğer data-*:', [...dataOther].join(' '));
const cssClasses = new Set();
const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
for (const m of style.matchAll(/\.([A-Za-z][A-Za-z0-9_\-]*)/g)) cssClasses.add(m[1]);
console.log('\nCSS sınıfı (stilde):', cssClasses.size);
console.log('\nHTML dizelerindeki sınıf:', classes.size);
fs.writeFileSync(path.resolve(import.meta.dirname, 'inventory.json'), JSON.stringify({ stateProps: [...stateProps.keys()], actKeys, ids: [...ids], dataA: [...dataA], dataOther: [...dataOther], cssClasses: [...cssClasses], classes: [...classes] }, null, 1));
