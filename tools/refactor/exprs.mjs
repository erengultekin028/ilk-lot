import { loadSource, parse } from './analyze.mjs';
const { text, files } = loadSource();
const { ast } = parse(text);
const fileOf = (pos) => files.find((f) => pos >= f.start && pos < f.end)?.name;
let i = 0;
for (const n of ast.body) {
  if (n.type === 'FunctionDeclaration' || n.type === 'VariableDeclaration') continue;
  console.log(`#${++i} ${fileOf(n.start)} L${n.loc.start.line} [${n.end - n.start}] ${text.slice(n.start, n.end).replace(/\s+/g, ' ').slice(0, 170)}`);
}
