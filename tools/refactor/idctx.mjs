import fs from 'node:fs';
const inv = JSON.parse(fs.readFileSync('./inventory.json', 'utf8'));
const src = ['02_core.js','04_study.js','05_entry.js','06_task.js','07_app.js'].map(f => fs.readFileSync('../../kaynak/' + f, 'utf8')).join('\n');
for (const id of inv.ids) {
  let i = -1;
  for (const pat of [`id="${id}"`, `id=\\"${id}\\"`, `id='${id}'`, `id=\'${id}\'`]) { i = src.indexOf(pat); if (i >= 0) break; }
  const ctx = i >= 0 ? src.slice(Math.max(0, i - 30), i + 70).replace(/\s+/g, ' ') : '(yalnız $() / koddan)';
  console.log(id.padEnd(8), ctx);
}
