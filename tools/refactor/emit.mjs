// migrate.mjs analizinden modül dosyaları üretir (public/src/**).
import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import * as eslintScope from 'eslint-scope';
import { items, subItems, topMap, imports, exportsOf, applyEdits, text, MODULES, OUT, problems, comments, itemByOld, BOX_HOME } from './migrate.mjs';
import { BOX_GROUPS, BOXES, SETTERS } from './map-extra.mjs';

let MAIN_IMPORTS = '';
const GROUP_CONST = { 'actions-flow': 'flowActions', 'actions-market': 'marketActions', 'actions-free-play': 'freePlayActions', 'actions-ui': 'uiActions', 'admin-actions': 'adminSelfTestActions' };
const modFile = (m) => MODULES[m][0];
const rel = (fromMod, toMod) => {
  let r = path.posix.relative(path.posix.dirname(modFile(fromMod)), modFile(toMod));
  return r.startsWith('.') ? r : './' + r;
};
const itemsByStart = [...items].sort((a, b) => a.start - b.start);

// Yorumları öğelere dağıt: önceki öğenin satırında biten yorum ona (sondaki), diğerleri sonraki öğeye (önde) ait
const leading = new Map(), trailing = new Map();
{
  let prevEnd = 0, prev = null;
  for (const it of itemsByStart) {
    const between = comments.filter((c) => c.start >= prevEnd && c.end <= it.start);
    for (const c of between) {
      if (prev && c.loc.start.line === prev.node.loc.end.line) { (trailing.get(prev) ?? trailing.set(prev, []).get(prev)).push(c); }
      else (leading.get(it) ?? leading.set(it, []).get(it)).push(c);
    }
    prevEnd = it.end; prev = it;
  }
}
const commentText = (c) => (c.type === 'Line' ? '//' + c.value : '/*' + c.value + '*/');
const lead = (it) => (leading.get(it) ?? []).map(commentText).join('\n');
const trail = (it) => (trailing.get(it) ?? []).map(commentText).join(' ');

const modules = new Map(); // mod -> [{pos, code}]
const push = (mod, pos, code) => { if (!modules.has(mod)) modules.set(mod, []); modules.get(mod).push({ pos, code }); };
const exported = (mod, name) => exportsOf.get(mod)?.has(name);

// Öğeleri üret
const boxEmitted = new Set();
for (const it of items) {
  if (it.drop || !it.mod) continue;
  const head = lead(it) ? lead(it) + '\n' : '';
  const tail = trail(it) ? ' ' + trail(it) : '';
  if (it.kind === 'fn') {
    const code = applyEdits(it.start, it.end);
    push(it.mod, it.start, head + (exported(it.mod, it.name) ? 'export ' : '') + code + tail);
  } else if (it.kind === 'var') {
    if (BOXES[it.old]) {
      const obj = BOXES[it.old].split('.')[0];
      if (!boxEmitted.has(obj)) {
        boxEmitted.add(obj);
        const fields = Object.entries(BOX_GROUPS[obj]).map(([f, old]) => {
          const m = itemByOld.get(old);
          if (m.mod !== it.mod) problems.push(`Kutu üyeleri farklı modüllerde: ${obj}`);
          return `${f}: ${m.node.init ? applyEdits(m.node.init.start, m.node.init.end) : 'undefined'}`;
        });
        push(it.mod, it.start, head + (exported(it.mod, obj) ? 'export ' : '') + `const ${obj} = { ${fields.join(', ')} };` + tail);
      } else if (head) push(it.mod, it.start, head.trimEnd());
      continue;
    }
    if (it.old === 'ACT') {
      // Eylemleri gruplara böl
      const byMod = new Map();
      for (const s of subItems.filter((x) => x.parent === it)) { if (!byMod.has(s.mod)) byMod.set(s.mod, []); byMod.get(s.mod).push(s); }
      for (const [m, subs] of byMod) {
        const body = subs.map((s) => { const c = comments.filter((c2) => c2.start >= s.start - 0 && c2.end <= s.end); return applyEdits(s.start, s.end); }).join(',\n');
        const gname = GROUP_CONST[m] ?? m;
        push(m, it.start, `export const ${gname} = {\n${body}\n};`);
      }
      continue;
    }
    const v = (function find() { for (const sc of []) return null; return null; })();
    const init = it.node.init ? applyEdits(it.node.init.start, it.node.init.end) : null;
    const writes = it.hasWrites;
    const kw = writes ? 'let' : 'const';
    const exp = exported(it.mod, it.name) ? 'export ' : '';
    let code = init === null ? `${exp}let ${it.name};` : `${exp}${kw} ${it.name} = ${init};`;
    if (SETTERS[it.old]) code += `\nexport function ${SETTERS[it.old]}(value) {\n  ${it.name} = value;\n}`;
    push(it.mod, it.start, head + code + tail);
  } else if (it.kind === 'stmt') {
    push(it.mod, it.start, head + applyEdits(it.start, it.end) + tail);
  }
}

// actions/index.js için birleştirme
{
  const groups = Object.keys(GROUP_CONST);
  const pos = itemByOld.get('ACT').start;
  push('actions-index', pos, `export const actions = Object.assign({}, ${groups.map((g) => GROUP_CONST[g]).join(', ')});`);
  for (const g of groups) { if (!imports.has('actions-index')) imports.set('actions-index', new Map()); const m = imports.get('actions-index'); if (!m.has(g)) m.set(g, new Set()); m.get(g).add(GROUP_CONST[g]); }
  // gruplar 'actions' dizinini içe aktarır (ACT.x başvuruları): imports zaten hesaplandı
}
// Dizin modülü export gerektirir
if (!exportsOf.has('actions-index')) exportsOf.set('actions-index', new Set());
exportsOf.get('actions-index').add('actions');


// Giriş noktası: yan etkili modüller ve test/hata ayıklama kancası
{
  const mainParts = modules.get('main') ?? [];
  const extraImports = `import './viewmodels/event-bindings.js';\nimport { state } from './viewmodels/app-state.js';\nimport { actions } from './viewmodels/actions/index.js';\nimport { participantRepository } from './repositories/participant-repository.js';\nimport { CONFIG } from './constants/app-config.js';\nimport { initSimulation, stepSimulation } from './models/market-simulation.js';\nimport { updateSimulatorLive } from './views/simulator-view.js';\nimport { flushEvents } from './services/event-log.js';\nimport { stimulusFingerprint, TRIAL_SETS } from './models/trial-generator.js';`;
  const handle = `\n// Otomatik testler ve tarayıcı konsolu için erişim noktası (üretim davranışını değiştirmez)\nwindow.ilkLot = { state, actions, participantRepository, config: CONFIG, render, initSimulation, stepSimulation, updateSimulatorLive, flushEvents, stimulusFingerprint, trialSets: TRIAL_SETS };`;
  modules.set('main', [{ pos: -1, code: '__MAIN_IMPORTS__' }, ...mainParts, { pos: 1e12, code: handle }]);
  MAIN_IMPORTS = extraImports;
}
const prettierOpts = { parser: 'babel', singleQuote: true, printWidth: 110, trailingComma: 'es5', semi: true, tabWidth: 2 };
fs.rmSync(OUT, { recursive: true, force: true });
const written = [];
for (const [mod, parts] of modules) {
  parts.sort((a, b) => a.pos - b.pos);
  const [file, desc] = MODULES[mod];
  const imp = imports.get(mod);
  const importLines = [];
  if (imp) for (const [from, names] of [...imp.entries()].sort()) importLines.push(`import { ${[...names].sort().join(', ')} } from '${rel(mod, from)}';`);
  const vendor = mod === 'qr-lib';
  let body = parts.map((p) => p.code).join('\n\n').replace('__MAIN_IMPORTS__;', MAIN_IMPORTS).replace('__MAIN_IMPORTS__', MAIN_IMPORTS);
  let code = `// ${desc}\n\n${importLines.join('\n')}${importLines.length ? '\n\n' : ''}${body}\n`;
  if (!vendor) {
    try { code = await prettier.format(code, prettierOpts); } catch (e) { problems.push(`Prettier hatası ${file}: ${e.message.split('\n')[0]}`); }
  }
  const full = path.join(OUT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, code, 'utf8');
  written.push([file, code.length]);
}

// Üretimden sonra uygulanan, anlam gerektiren düzeltmeler (her biri bulunmak zorundadır)
const POST_REPLACE = [
  ['widgets/sync-indicator.js', "' ' + status", "' ' + (status === 'pend' ? 'is-pending' : 'is-error')"],
  ['views/trial-view.js', "' ok' : ' no'", "' is-correct' : ' is-wrong'"],
];
for (const [file, from, to] of POST_REPLACE) {
  const full = path.join(OUT, file);
  const t = fs.readFileSync(full, 'utf8');
  if (!t.includes(from)) { problems.push(`POST_REPLACE bulunamadı: ${file}: ${from}`); continue; }
  fs.writeFileSync(full, t.replace(from, to), 'utf8');
}
// Kayıtlı anlık görüntü anahtarları (veri sözleşmesi) -> durum alanı adları
{
  const full = path.join(OUT, 'services/session-persistence.js');
  let t = fs.readFileSync(full, 'utf8');
  const re = /export function restoreSnapshot\(snapshot\) \{\s*\[[\s\S]*?\]\.forEach\(function \(item\) \{\s*if \(snapshot\[item\] !== undefined\) state\[item\] = snapshot\[item\];\s*\}\);/;
  if (!re.test(t)) problems.push('restoreSnapshot kalıbı bulunamadı');
  else {
    t = t.replace(re, `// Kayıtlı anlık görüntüdeki anahtar (veri sözleşmesi, değişmez) -> durum nesnesindeki alan adı\nconst PERSISTED_STATE_KEYS = {\n  phase: 'phase', block: 'block', ti: 'trialIndex', dec: 'decisions', total: 'totalDecisions', pulses: 'pulses',\n  practiced: 'practiceDone', cd: 'cooldownStats', ended: 'ended', endedAt: 'endedAt', guess: 'purposeGuess',\n  tourSeen: 'seenTourSteps', comp: 'comprehension', helpN: 'helpOpenCount', tabT: 'tabTimes', readMs: 'readingMs',\n};\n\nexport function restoreSnapshot(snapshot) {\n  Object.keys(PERSISTED_STATE_KEYS).forEach(function (key) {\n    if (snapshot[key] !== undefined) state[PERSISTED_STATE_KEYS[key]] = snapshot[key];\n  });`);
    fs.writeFileSync(full, t, 'utf8');
  }
}
console.log('Yazılan modül:', written.length);
written.sort().forEach(([f, n]) => console.log(String(n).padStart(7), f));
console.log('Sorunlar:', problems.length); problems.slice(0, 30).forEach((p) => console.log(' -', p));
