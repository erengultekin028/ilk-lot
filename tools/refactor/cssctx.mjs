import fs from 'node:fs';
import postcss from 'postcss';
const html = fs.readFileSync('../../kaynak/01_head.html', 'utf8');
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\{\{[^}]*\}\}/g, 'X');
const root = postcss.parse(css);
const want = process.argv.slice(2);
const out = {};
root.walkRules((r) => {
  for (const w of want) {
    const re = new RegExp('\.' + w.replace(/-/g, '\-') + '(?![\w-])');
    if (re.test(r.selector)) (out[w] ??= []).push(r.selector.replace(/\s+/g, ' ').slice(0, 70) + ' {' + r.nodes.slice(0, 2).map((d) => d.toString()).join(';').slice(0, 50) + '}');
  }
});
for (const w of want) console.log(`.${w}: ` + (out[w] || ['(?)']).slice(0, 2).join('  ||  '));
