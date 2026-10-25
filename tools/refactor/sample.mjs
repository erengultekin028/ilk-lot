import * as eslintScope from 'eslint-scope';
import * as acorn from 'acorn';
import { loadSource } from './analyze.mjs';
const { text } = loadSource();
const ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module', ranges: true });
const mgr = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' });
const want = new Set(process.argv.slice(2));
const seen = {};
for (const sc of mgr.scopes) {
  if (sc.type === 'module' || sc.type === 'global') continue;
  for (const v of sc.variables) {
    if (!want.has(v.name) || !v.defs[0]) continue;
    const d = v.defs[0];
    const fn = (() => { let s = sc; while (s && s.type !== 'function') s = s.upper; return s?.block.id?.name ?? '(cb)'; })();
    let ctx = '';
    if (d.type === 'Variable') ctx = 'init: ' + (d.node.init ? text.slice(d.node.init.start, Math.min(d.node.init.end, d.node.init.start + 45)).replace(/\s+/g, ' ') : '-');
    else if (d.type === 'Parameter') ctx = 'param#' + d.node.params.indexOf(d.name) + ' of ' + fn;
    else ctx = d.type;
    (seen[v.name] ??= []).push(`${fn} | ${ctx}`);
  }
}
for (const k of want) { const a = seen[k] || []; const pick = a.filter((_, i) => i % Math.max(1, Math.floor(a.length / 7)) === 0).slice(0, 7); console.log(`\n== ${k} (${a.length})\n  ` + pick.join('\n  ')); }
