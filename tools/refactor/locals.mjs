import * as walk from 'acorn-walk';
import { loadSource, parse } from './analyze.mjs';
const { text } = loadSource();
const { ast } = parse(text);
const counts = new Map();
const inc = (k) => counts.set(k, (counts.get(k) || 0) + 1);
// yalnızca iç kapsamlardaki (üst düzey olmayan) bildirimler
const topSet = new Set(ast.body.flatMap((n) => n.type === 'FunctionDeclaration' ? [n.id.name] : n.type === 'VariableDeclaration' ? n.declarations.map((d) => d.id.name) : []));
walk.ancestor(ast, {
  VariableDeclarator(n, _s, anc) { if (n.id.type === 'Identifier' && anc.length > 3 && !(anc.length===3)) inc(n.id.name); },
  FunctionDeclaration(n, _s, anc) { if (anc.length > 2 && n.id) inc(n.id.name); },
  Function(n) { for (const p of n.params) if (p.type === 'Identifier') inc('param:' + p.name); },
  CatchClause(n) { if (n.param) inc('catch:' + n.param.name); },
});
const arr = [...counts].sort((a, b) => b[1] - a[1]);
console.log(arr.filter(([k]) => k.replace(/^(param|catch):/, '').length <= 3).map(([k, v]) => `${k}×${v}`).join(' '));
console.log('\n--- 4+ karakterli iç adlar:', arr.filter(([k]) => k.replace(/^(param|catch):/, '').length > 3).length);
