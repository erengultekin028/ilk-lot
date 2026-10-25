// Kaynak betiğin yapısını çıkarır: üst düzey bildirimler, boyutlar, kapsam başına tanımlayıcı sayıları.
// Kullanım: node analyze.mjs   (kaynak/ parçalarını derle.py ile aynı sırada birleştirir)
import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const SRC = path.resolve(import.meta.dirname, '..', '..', 'kaynak');
const ORDER = ['02_core.js', '03_qr.js', '04_study.js', '05_entry.js', '06_task.js', '07_app.js'];

export function loadSource() {
  // Dosya sınırlarını izlemek için her parçanın başlangıç/bitiş konumunu da döndürür
  let text = '';
  const files = [];
  for (const f of ORDER) {
    const t = fs.readFileSync(path.join(SRC, f), 'utf8');
    files.push({ name: f, start: text.length, end: text.length + t.length });
    text += t;
  }
  // 07_app.js sonundaki </script> vb. HTML parçası yok; 01_head.html betik dışı
  text = text.replace(/\n<\/script>[\s\S]*$/, '\n');
  return { text, files };
}

export function parse(text) {
  const comments = [];
  const ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'script', locations: true, onComment: comments });
  return { ast, comments };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('analyze.mjs')) {
  const { text, files } = loadSource();
  const { ast } = parse(text);
  const fileOf = (pos) => files.find((f) => pos >= f.start && pos < f.end)?.name ?? '?';
  const top = [];
  for (const n of ast.body) {
    let names = [];
    if (n.type === 'FunctionDeclaration') names = [n.id.name];
    else if (n.type === 'VariableDeclaration') names = n.declarations.map((d) => d.id.name ?? '(pattern)');
    else names = [`<${n.type}>`];
    top.push({ type: n.type, names, size: n.end - n.start, file: fileOf(n.start), start: n.start, end: n.end });
  }
  console.log('Üst düzey ifade sayısı:', top.length);
  const byFile = {};
  for (const t of top) byFile[t.file] = (byFile[t.file] || 0) + 1;
  console.log('Dosya başına:', byFile);
  const byType = {};
  for (const t of top) byType[t.type] = (byType[t.type] || 0) + 1;
  console.log('Tür başına:', byType);
  // Tanımlayıcı istatistikleri
  const decl = new Map();
  const add = (name, kind) => { decl.set(name, (decl.get(name) || 0) + 1); };
  walk.full(ast, (n) => {
    if (n.type === 'FunctionDeclaration' && n.id) add(n.id.name);
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') add(n.id.name);
    if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') for (const p of n.params) if (p.type === 'Identifier') add(p.name);
    if (n.type === 'CatchClause' && n.param?.type === 'Identifier') add(n.param.name);
  });
  const lens = { 1: 0, 2: 0, 3: 0, '4+': 0 };
  for (const [k] of decl) lens[k.length >= 4 ? '4+' : k.length]++;
  console.log('Farklı bildirilen ad sayısı:', decl.size, 'uzunluk dağılımı:', lens);
  console.log('Büyük 25 üst düzey ifade:');
  top.sort((a, b) => b.size - a.size).slice(0, 25).forEach((t) => console.log(String(t.size).padStart(7), t.file, t.type, t.names.join(',').slice(0, 60)));
}
