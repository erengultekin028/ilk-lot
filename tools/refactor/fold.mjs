// Sabit bayrakları (DEMO_MODE, QUICK_TEST_MODE, FORCED_SESSION) değerleriyle değiştirip ölü dalları kaldırır.
// Kullanım: node fold.mjs <dosya...>   (dosyayı yerinde yeniden yazar; sonra prettier çalıştırılır)
import fs from 'node:fs';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';
const traverse = _traverse.default ?? _traverse;
const generate = _generate.default ?? _generate;
const CONSTS = { DEMO_MODE: () => t.booleanLiteral(false), QUICK_TEST_MODE: () => t.booleanLiteral(false), FORCED_SESSION: () => t.nullLiteral(), QUERY_PARAMS: null, HASH_PARAMS: null };
const REMOVE_IMPORTS = new Set(['DEMO_MODE', 'QUICK_TEST_MODE', 'FORCED_SESSION', 'QUERY_PARAMS', 'HASH_PARAMS', 'setDemoMode', 'setPilotMode']);

const known = (n) => (t.isBooleanLiteral(n) ? { v: n.value } : t.isNullLiteral(n) ? { v: null } : null);
function foldOnce(path) {
  const n = path.node;
  if (t.isUnaryExpression(n, { operator: '!' })) { const k = known(n.argument); if (k) path.replaceWith(t.booleanLiteral(!k.v)); return; }
  if (t.isLogicalExpression(n)) {
    const l = known(n.left), r = known(n.right);
    if (n.operator === '&&') { if (l) return void path.replaceWith(l.v ? n.right : n.left); if (r && r.v) return void path.replaceWith(n.left); }
    if (n.operator === '||') { if (l) return void path.replaceWith(l.v ? n.left : n.right); if (r && !r.v) return void path.replaceWith(n.left); }
    return;
  }
  if (t.isConditionalExpression(n)) { const k = known(n.test); if (k) path.replaceWith(k.v ? n.consequent : n.alternate); return; }
  if (t.isBinaryExpression(n) && ['===', '!=='].includes(n.operator)) { /* karşılaştırmalar elle */ }
  if (t.isIfStatement(n)) {
    const k = known(n.test); if (!k) return;
    const branch = k.v ? n.consequent : n.alternate;
    if (!branch) return void path.remove();
    path.replaceWithMultiple(t.isBlockStatement(branch) ? branch.body : [branch]);
  }
}
for (const file of process.argv.slice(2)) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = parse(code, { sourceType: 'module', attachComment: true });
  let changed = false;
  traverse(ast, {
    ImportSpecifier(p) { const n = p.node.imported.name; if (REMOVE_IMPORTS.has(n)) { p.remove(); changed = true; } },
    ImportDeclaration: { exit(p) { if (p.node.specifiers.length === 0 && !/\.css$/.test(p.node.source.value) && p.node.specifiers.length === 0 && p.node._removedAll !== false) { /* yan etkili içe aktarmalar korunur */ } } },
  });
  traverse(ast, {
    Identifier(p) {
      const name = p.node.name;
      if (!CONSTS[name] || !p.isReferencedIdentifier()) return;
      p.replaceWith(CONSTS[name]()); changed = true;
    },
  });
  for (let pass = 0; pass < 6; pass++) traverse(ast, { 'UnaryExpression|LogicalExpression|ConditionalExpression|IfStatement': { exit: foldOnce } });
  // İçe aktarma kalmayan bildirimleri kaldır
  traverse(ast, { ImportDeclaration(p) { if (p.node.specifiers.length === 0 && !p.node._keep && !/^\.\/.*event-bindings/.test(p.node.source.value) && changed && !p.node.source.value.endsWith('event-bindings.js')) p.remove(); } });
  const out = generate(ast, { retainLines: false, comments: true }, code).code;
  if (out !== code) fs.writeFileSync(file, out, 'utf8');
}
