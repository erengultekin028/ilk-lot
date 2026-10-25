import fs from 'node:fs';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
const html = fs.readFileSync('../../kaynak/01_head.html', 'utf8');
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\{\{[^}]*\}\}/g, 'X');
const root = postcss.parse(css);
const classes = new Map(), ids = new Set();
root.walkRules((rule) => {
  selectorParser((sel) => sel.walkClasses((c) => classes.set(c.value, (classes.get(c.value) || 0) + 1)) && sel.walkIds((i) => ids.add(i.value))).processSync(rule.selector);
});
console.log([...classes.keys()].length, [...classes.keys()].join(' '));
console.log('ids:', [...ids].join(' '));
