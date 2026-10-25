import { loadSource, parse } from './analyze.mjs';
const { text, files } = loadSource();
const { ast } = parse(text);
const fileOf = (pos) => files.find((f) => pos >= f.start && pos < f.end)?.name.slice(0,2);
let idx = 0;
for (const n of ast.body) {
  idx++;
  if (n.type !== 'FunctionDeclaration' && n.type !== 'VariableDeclaration') continue;
  const nm = n.type === 'FunctionDeclaration' ? n.id.name : n.declarations.map(d => d.id.name).join(',');
  const body = text.slice(n.type === 'FunctionDeclaration' ? n.body.start : n.start, n.end).replace(/\s+/g, ' ').replace(/^\{/, '').slice(0, 95);
  console.log(`${idx} ${fileOf(n.start)} ${nm}: ${body}`);
}
