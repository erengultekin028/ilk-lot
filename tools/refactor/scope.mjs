// Kapsam analizi yardımcıları: eslint-scope ile tüm bildirim ve başvuruları çıkarır.
import * as eslintScope from 'eslint-scope';
import * as acorn from 'acorn';
import { loadSource } from './analyze.mjs';

export function analyzeAll() {
  const { text, files } = loadSource();
  const comments = [];
  const ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module', locations: true, ranges: true, onComment: comments });
  const manager = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module', ignoreEval: true });
  return { text, files, ast, comments, manager };
}

if (process.argv[1]?.endsWith('scope.mjs')) {
  const { ast, manager } = analyzeAll();
  const mod = manager.globalScope.childScopes[0]; // module scope
  const out = [];
  for (const v of mod.variables) {
    const writes = v.references.filter((r) => r.isWrite() && !r.init);
    const def = v.defs[0];
    if (!writes.length) continue;
    // yazılan yeri bul: başvurunun bulunduğu en yakın üst işlev adı
    const where = writes.map((r) => {
      let s = r.from; while (s && s.type !== 'function') s = s.upper;
      return s ? (s.block.id?.name ?? '(anon)') : '(üst düzey)';
    });
    out.push(`${v.name}: ${writes.length} yazma [${[...new Set(where)].join(',')}] okuma:${v.references.filter(r=>r.isRead()).length}`);
  }
  console.log(out.join('\n'));
}
