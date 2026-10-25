// Kullanılmayan import adlarını temizler. Kullanım: node unused-imports.mjs <dosya veya klasör...>
import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';
import * as eslintScope from 'eslint-scope';

function listFiles(p, out = []) {
  const st = fs.statSync(p);
  if (st.isDirectory()) { if (path.basename(p) === 'vendor') return out; for (const f of fs.readdirSync(p)) listFiles(path.join(p, f), out); }
  else if (p.endsWith('.js')) out.push(p);
  return out;
}
let total = 0;
for (const arg of process.argv.slice(2)) for (const file of listFiles(arg)) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', ranges: true });
  const scope = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' }).scopes[1];
  const unused = new Set(scope.variables.filter((v) => v.defs[0]?.type === 'ImportBinding' && v.references.length === 0).map((v) => v.name));
  if (!unused.size) continue;
  const edits = [];
  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration' || !node.specifiers.length) continue;
    const keep = node.specifiers.filter((s) => !unused.has(s.local.name));
    if (keep.length === node.specifiers.length) continue;
    total += node.specifiers.length - keep.length;
    if (!keep.length) edits.push([node.start, node.end + (code[node.end] === '\n' ? 1 : 0), '']);
    else edits.push([node.start, node.end, `import { ${keep.map((s) => (s.imported.name === s.local.name ? s.local.name : `${s.imported.name} as ${s.local.name}`)).join(', ')} } from '${node.source.value}';`]);
  }
  let out = code;
  for (const [a, b, t] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + t + out.slice(b);
  fs.writeFileSync(file, out, 'utf8');
}
console.log('Kaldırılan kullanılmayan import:', total);
