import { loadSource, parse } from './analyze.mjs';
const { text, files } = loadSource();
const { ast } = parse(text);
const fileOf = (pos) => files.find((f) => pos >= f.start && pos < f.end)?.name;
let cur = '';
const out = [];
for (const n of ast.body) {
  const f = fileOf(n.start);
  if (f !== cur) { out.push(`\n## ${f}`); cur = f; }
  let nm;
  if (n.type === 'FunctionDeclaration') nm = `${n.id.name}(${n.params.map(p=>p.name??'?').join(',')})`;
  else if (n.type === 'VariableDeclaration') nm = 'var ' + n.declarations.map(d => d.id.name).join(',');
  else nm = `<${n.type}>`;
  out.push(`${nm} [${n.end-n.start}]`);
}
console.log(out.join(' | ').replace(/ \| \n/g,'\n'));
