// Tek parça betiği (kaynak/) modüllere bölen, adları İngilizceleştiren ve import/export üreten göç aracı.
// Kullanım: node migrate.mjs --report     (yalnızca tanı çıktısı)
//           node migrate.mjs --write      (public/src/ altına yaz)
import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import * as eslintScope from 'eslint-scope';
import prettier from 'prettier';
import { loadSource } from './analyze.mjs';
import { TOP, MODULES } from './map-toplevel.mjs';
import { STATE_PROPS, ACTIONS, IDS } from './map-names.mjs';
import { CLASSES } from './map-classes.mjs';
import { LOCAL_OVERRIDES, BOXES, SETTERS, DROP_ITEMS } from './map-extra.mjs';
import { suggestName } from './naming.mjs';

const OUT = path.resolve(import.meta.dirname, '..', '..', 'public', 'src');
const args = new Set(process.argv.slice(2));

// ───────────── 1. Kaynağı çözümle ─────────────
const { text } = loadSource();
const comments = [];
const ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module', ranges: true, locations: true, onComment: comments });
const manager = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module', ignoreEval: true });
const moduleScope = manager.globalScope.childScopes[0];
const parents = new Map();
walk.fullAncestor(ast, (node, _s, anc) => { if (anc.length > 1) parents.set(node, anc[anc.length - 2]); });
const problems = [];
const warn = (m) => problems.push(m);

// ───────────── 2. Üst düzey tablo ─────────────
const topMap = new Map(); // eskiAd -> {name, mod}
const exprMods = new Map(); // '#N' -> mod
for (const raw of TOP.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('# ')) continue;
  const [o, n, m] = line.split('|').map((s) => s.trim());
  if (!MODULES[m]) warn(`Bilinmeyen modül: ${m} (${o})`);
  if (o.startsWith('#')) exprMods.set(o, m); else topMap.set(o, { name: n, mod: m });
}

// ───────────── 3. Öğeler (üst düzey bildirimler) ─────────────
const items = [];
let exprNo = 0;
for (const node of ast.body) {
  if (node.type === 'FunctionDeclaration') {
    items.push({ kind: 'fn', old: node.id.name, node, start: node.start, end: node.end });
  } else if (node.type === 'VariableDeclaration') {
    node.declarations.forEach((d, i) => {
      if (d.id.type !== 'Identifier') { warn('Kalıp bildirimi: ' + text.slice(d.start, d.start + 40)); return; }
      items.push({ kind: 'var', old: d.id.name, node: d, decl: node, first: i === 0, start: i === 0 ? node.start : d.start, end: d.end, last: i === node.declarations.length - 1 });
    });
  } else {
    exprNo++;
    items.push({ kind: 'stmt', old: '#' + exprNo, node, start: node.start, end: node.end });
  }
}
for (const it of items) {
  if (it.kind === 'stmt') { it.mod = exprMods.get(it.old); it.name = null; if (it.old === '#1') it.drop = true; else if (!it.mod) warn('Modülsüz ifade: ' + it.old + ' ' + text.slice(it.start, it.start + 60)); }
  else { const t = topMap.get(it.old); if (!t) warn('Tabloda yok: ' + it.old); else { it.mod = t.mod; it.name = t.name; } }
}
const itemByOld = new Map(items.map((i) => [i.old, i]));
const vendorItem = itemByOld.get('QRLib');
const inVendor = (pos) => pos >= vendorItem.start && pos < vendorItem.end;
for (const it of items) if (it.kind === 'var') { const v = moduleScope.set.get(it.old); it.hasWrites = !!v && v.references.some((r) => r.isWrite() && !r.init); }

// ───────────── 4. Yeni adlar (tüm kapsamlar) ─────────────
const allVars = [];
for (const sc of manager.scopes) for (const v of sc.variables) if (v.defs.length) allVars.push({ v, scope: sc });
const topNames = new Set([...topMap.values()].map((t) => t.name));
const nameOfTop = (old) => topMap.get(old)?.name ?? null;
const idNameOf = (id) => IDS[id] ?? id;
const info = { parentOf: (n) => parents.get(n), nameOfTop, idNameOf };
const scopeFn = (sc) => { let s = sc; while (s && s.type !== 'function') s = s.upper; return s ? (s.block.id?.name ?? '(anon@' + s.block.start + ')') : '(module)'; };
const newNameOf = new Map(); // Variable -> yeni ad
const finalNameCache = new Map();
for (const { v, scope } of allVars) {
  if (scope === moduleScope) { const t = topMap.get(v.name); newNameOf.set(v, t ? t.name : v.name); continue; }
  const ov = LOCAL_OVERRIDES[scopeFn(scope) + ':' + v.name] ?? LOCAL_OVERRIDES['*:' + v.name];
  if (v.name === 'arguments' || inVendor(v.defs[0].name.start)) { newNameOf.set(v, v.name); continue; }
  newNameOf.set(v, ov ?? suggestName(v, info));
}
// Çakışma çözümü: aynı kapsamda ve görünürlükte aynı yeni ad olmasın
const scopeVars = new Map();
for (const { v, scope } of allVars) { if (!scopeVars.has(scope)) scopeVars.set(scope, []); scopeVars.get(scope).push(v); }
function visibleNames(scope, excluding) {
  const names = new Set(topNames);
  for (let s = scope; s; s = s.upper) for (const v of s.variables) if (v !== excluding && newNameOf.has(v)) names.add(newNameOf.get(v));
  return names;
}
function usedBelow(scope, set, self) {
  // Bu kapsamın içinde (alt kapsamlar dahil) çözülen ya da dışarı geçen başvuruların YENİ adları
  const stack = [scope];
  while (stack.length) {
    const s = stack.pop();
    for (const r of s.references) { const rv = r.resolved; if (rv === self) continue; set.add(rv && newNameOf.has(rv) ? newNameOf.get(rv) : r.identifier.name); }
    stack.push(...s.childScopes);
  }
}
for (const { v, scope } of allVars) {
  if (scope === moduleScope) continue;
  let nn = newNameOf.get(v);
  const conflicts = (name) => {
    if (topNames.has(name) && name !== v.name) return true;
    for (let s = scope.upper; s; s = s.upper) for (const o of s.variables) if (newNameOf.get(o) === name) return true;
    for (const o of scope.variables) if (o !== v && newNameOf.get(o) === name) return true;
    const used = new Set(); usedBelow(scope, used, v);
    if (used.has(name)) return true;
    return false;
  };
  let base = nn, k = 2;
  while (conflicts(nn)) { if (k === 2 && base.length > 1 && !/^inner/.test(base)) { const alt = 'inner' + base[0].toUpperCase() + base.slice(1); if (!conflicts(alt)) { nn = alt; break } } nn = base + k++ }
  newNameOf.set(v, nn);
}

// ───────────── 5. Düzenlemeler ─────────────
const edits = [];
const edit = (start, end, textNew) => edits.push({ start, end, text: textNew });
const isTop = (v) => v.scope === moduleScope;
const stateVar = moduleScope.set.get('S'), actVar = moduleScope.set.get('ACT'), adminActVar = moduleScope.set.get('ADMIN_ACT');
const resolvedTo = (id) => { for (const sc of manager.scopes) for (const r of sc.references) if (r.identifier === id) return r.resolved; return null; };
const refResolved = new Map();
for (const sc of manager.scopes) for (const r of sc.references) refResolved.set(r.identifier, r.resolved);

const box = (v) => BOXES[v.name]; // üst düzey değişkenler için kutu ifadesi
const setterOf = (v) => SETTERS[v.name];
const handled = new Set();
function renameId(idNode, v, isDecl) {
  if (handled.has(idNode)) return; handled.add(idNode);
  const nn = newNameOf.get(v); if (nn === undefined) return;
  const par = parents.get(idNode);
  let repl = nn;
  const b = isTop(v) ? box(v) : null;
  if (b && !isDecl) repl = b;
  if (par?.type === 'Property' && par.shorthand && (par.value === idNode || par.key === idNode)) repl = `${idNode.name}: ${repl}`;
  if (repl !== idNode.name) edit(idNode.start, idNode.end, repl);
}
for (const { v } of allVars) {
  for (const d of v.defs) if (d.name && !(isTop(v) && d.type === 'Variable' && box(v))) renameId(d.name, v, true);
  for (const r of v.references) {
    // Üst düzey değişken ayarlayıcısı: DEMO = x  ->  setDemoMode(x)
    if (isTop(v) && setterOf(v) && r.isWrite() && !r.init) {
      const par = parents.get(r.identifier);
      if (par?.type === 'AssignmentExpression' && par.left === r.identifier && par.operator === '=') { edit(par.start, par.end, `${setterOf(v)}(${text.slice(par.right.start, par.right.end)})`); handled.add(r.identifier); handled.add(par.right); continue; }
      warn('Ayarlayıcı: desteklenmeyen yazma biçimi ' + v.name + ' @' + r.identifier.start);
    }
    renameId(r.identifier, v, false);
  }
}
// Çözülemeyen (genel) başvurular: yalnızca bilgi
// Üye ve anahtar adları
const actKeyNew = (k) => ACTIONS[k]?.[0] ?? k;
walk.fullAncestor(ast, (n) => {
  if (n.type === 'MemberExpression' && !n.computed && n.object.type === 'Identifier') {
    const rv = refResolved.get(n.object);
    if (rv === stateVar && STATE_PROPS[n.property.name]) edit(n.property.start, n.property.end, STATE_PROPS[n.property.name]);
    if ((rv === actVar || rv === adminActVar) && ACTIONS[n.property.name]) edit(n.property.start, n.property.end, actKeyNew(n.property.name));
  }
  if (n.type === 'MemberExpression' && n.computed && n.object.type === 'Identifier' && refResolved.get(n.object) === stateVar) {
    if (!(n.property.type === 'Identifier' && (n.property.name === 'k'))) warn('Dinamik S[...] erişimi: ' + text.slice(n.start, n.end + 20) + ' @' + n.start);
  }
  if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init?.type === 'ObjectExpression') {
    const nm = n.id.name;
    if (nm === 'S') for (const p of n.init.properties) if (p.key.type === 'Identifier' && STATE_PROPS[p.key.name]) edit(p.key.start, p.key.end, STATE_PROPS[p.key.name]);
    if (nm === 'ACT' || nm === 'ADMIN_ACT') for (const p of n.init.properties) { const k = p.key.name ?? p.key.value; if (ACTIONS[k]) edit(p.key.start, p.key.end, ACTIONS[k][0]); else warn('Eylem tabloda yok: ' + k); }
  }
});

// Dizeler: id, eylem adı (data-a) ve sınıf adları
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const idKeys = Object.keys(IDS).sort((a, b) => b.length - a.length);
const actKeys = Object.keys(ACTIONS).sort((a, b) => b.length - a.length);
const classKeys = Object.keys(CLASSES).sort((a, b) => b.length - a.length);
const q = '\\\\?["\']'; // " ' \" \'
const reId = new RegExp(`(\\b(?:id|for|aria-labelledby|aria-controls|aria-describedby)=${q})(${idKeys.map(reEsc).join('|')})(?![\\w-])`, 'g');
const reUrl = new RegExp(`(url\\(#|href=${q}#)(${idKeys.map(reEsc).join('|')})(?![\\w-])`, 'g');
const reSel = new RegExp(`(#)(${idKeys.map(reEsc).join('|')})(?![\\w-])`, 'g');
const reAct = new RegExp(`(data-a=${q}?)(${actKeys.map(reEsc).join('|')})(?![\\w-])`, 'g');
const reActSel = new RegExp(`(\\[data-a=)(${actKeys.map(reEsc).join('|')})(?![\\w-])`, 'g');
export function mapStringContent(s, ctx = {}) {
  let out = s;
  out = out.replace(reId, (_, a, b) => a + IDS[b]);
  out = out.replace(reUrl, (_, a, b) => a + IDS[b]);
  if (ctx.selector) out = out.replace(reSel, (_, a, b) => a + IDS[b]);
  out = out.replace(reAct, (_, a, b) => a + actKeyNew(b));
  out = out.replace(reActSel, (_, a, b) => a + actKeyNew(b));
  return out;
}
const stringEdits = [];
const litText = new Map();
walk.fullAncestor(ast, (n, _s, anc) => {
  if (n.type !== 'Literal' || typeof n.value !== 'string') return;
  const par = anc[anc.length - 2];
  const raw = text.slice(n.start, n.end);
  const inner = raw.slice(1, -1);
  let mapped = mapStringContent(inner, { selector: /querySelector|closest|matches/.test(par?.callee?.property?.name ?? '') });
  // Bağlam kuralları (AST): $('id'), getElementById('id'), .id === 'x', x.id = 'y', setAttribute('aria-labelledby','y'), freeRadio('act',...)
  const calleeName = par?.type === 'CallExpression' ? (par.callee.type === 'Identifier' ? par.callee.name : par.callee.property?.name) : null;
  if (par?.type === 'CallExpression' && par.arguments[0] === n) {
    if (calleeName === '$' || calleeName === 'getElementById') { const hit = idKeys.find((k) => inner === k || (k.endsWith('-') && inner === k)); if (hit) mapped = IDS[hit]; }
    if (calleeName === 'freeRadio' && ACTIONS[inner]) mapped = actKeyNew(inner);
    if (calleeName === 'setAttribute' && ['aria-labelledby', 'aria-controls', 'aria-describedby'].includes(inner)) { /* değer sonraki argümanda */ }
  }
  if (par?.type === 'CallExpression' && par.arguments[1] === n && par.callee.property?.name === 'setAttribute' && par.arguments[0].value && ['aria-labelledby', 'aria-controls', 'aria-describedby', 'id'].includes(par.arguments[0].value) && IDS[inner]) mapped = IDS[inner];
  if (par?.type === 'BinaryExpression' && ['===', '==', '!==', '!='].includes(par.operator) && par.left.type === 'MemberExpression' && par.left.property.name === 'id' && IDS[inner]) mapped = IDS[inner];
  if (par?.type === 'AssignmentExpression' && par.right === n && par.left.type === 'MemberExpression' && par.left.property.name === 'id' && IDS[inner]) mapped = IDS[inner];
  litText.set(n, { inner, mapped, parent: par });
});
// ── Sınıf adları (CSS class): HTML dizesindeki class="..." değerleri, koşullu parçalar, classList.* ve seçiciler ──
const classRe = new RegExp(`(?<![\\w-])(${classKeys.map(reEsc).join('|')})(?![\\w-])`, 'g');
const renameTokens = (str) => str.replace(classRe, (m) => CLASSES[m]);
const skipClassRanges = ['exportCards', 'exportPoster'].map((n) => itemByOld.get(n)).filter(Boolean).map((i) => [i.start, i.end]);
const inSkip = (pos) => skipClassRanges.some(([a, b]) => pos >= a && pos < b);
const setLit = (node, fn) => { const e = litText.get(node); if (e) e.mapped = fn(e.mapped); };
// class="…" içindeki değerler (dize sonuna kadar açık kalabilir)
const attrRe = /(class=\\?["'])([^"'\\]*)/g;
function classAttrPass(str, open) {
  // open: önceki parçadan gelen açık class değeri varsa, dizenin başından ilk tırnağa kadar değerdir
  let out = str, nowOpen = open;
  if (open) {
    const q = out.search(/["'\\]/);
    const end = q < 0 ? out.length : q;
    out = renameTokens(out.slice(0, end)) + out.slice(end);
    if (q >= 0) nowOpen = false;
  }
  out = out.replace(attrRe, (m, a, v) => a + renameTokens(v));
  const last = [...str.matchAll(/class=\\?["']/g)].pop();
  if (last) { const rest = str.slice(last.index + last[0].length); nowOpen = !/["'\\]/.test(rest); }
  return [out, nowOpen];
}
function renameAllLiterals(node) {
  walk.simple(node, { Literal(l) { if (typeof l.value === 'string') setLit(l, renameTokens); } });
}
const chainRoots = [];
walk.fullAncestor(ast, (n, _s, anc) => {
  if (n.type === 'BinaryExpression' && n.operator === '+' && !(anc[anc.length - 2]?.type === 'BinaryExpression' && anc[anc.length - 2].operator === '+')) chainRoots.push(n);
});
function flatten(n, out) { if (n.type === 'BinaryExpression' && n.operator === '+') { flatten(n.left, out); flatten(n.right, out); } else out.push(n); return out; }
for (const root of chainRoots) {
  if (inSkip(root.start)) continue;
  let open = false;
  for (const part of flatten(root, [])) {
    if (part.type === 'Literal' && typeof part.value === 'string') {
      const e = litText.get(part); const [out, o2] = classAttrPass(e.mapped, open); e.mapped = out; open = o2;
    } else if (open && (part.type === 'ConditionalExpression' || part.type === 'LogicalExpression')) {
      renameAllLiterals(part.type === 'ConditionalExpression' ? { type: 'Program', body: [], ...{ } } : part); // yer tutucu
      if (part.type === 'ConditionalExpression') { renameAllLiterals(part.consequent); renameAllLiterals(part.alternate); } else renameAllLiterals(part.right);
    } else if (part.type === 'ParenthesizedExpression') { /* acorn parantezleri düğüm yapmaz */ }
  }
}
// Parçasız (tek) dizeler: class="..." içeren
walk.fullAncestor(ast, (n, _s, anc) => {
  if (n.type !== 'Literal' || typeof n.value !== 'string' || inSkip(n.start)) return;
  const par = anc[anc.length - 2];
  if (par?.type === 'BinaryExpression' && par.operator === '+') return; // zincirde işlendi
  const e = litText.get(n);
  e.mapped = classAttrPass(e.mapped, false)[0];
});
// classList.add/remove/toggle/contains/replace, className, setAttribute('class'), seçiciler
walk.fullAncestor(ast, (n) => {
  if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && !n.callee.computed && !inSkip(n.start)) {
    const nm = n.callee.property.name;
    const objIsClassList = n.callee.object.type === 'MemberExpression' && n.callee.object.property.name === 'classList';
    if (objIsClassList) for (const a of n.arguments) if (a.type === 'Literal' && typeof a.value === 'string') setLit(a, renameTokens);
    if (['querySelector', 'querySelectorAll', 'closest', 'matches'].includes(nm)) for (const a of n.arguments) if (a.type === 'Literal' && typeof a.value === 'string') setLit(a, (t) => t.replace(/\.([A-Za-z][\w-]*)/g, (m, c) => (CLASSES[c] ? '.' + CLASSES[c] : m)));
    if (nm === 'setAttribute' && n.arguments[0]?.value === 'class' && n.arguments[1]) renameAllLiterals(n.arguments[1]);
  }
  if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && n.left.property.name === 'className') renameAllLiterals(n.right);
  if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && n.left.property.name === 'className' && n.operator === '+=') renameAllLiterals(n.right);
});
// directionClass (eski cls): 'up' / 'dn' dönüşü doğrudan sınıftır
{ const it = itemByOld.get('cls'); walk.simple(it.node, { Literal(l) { if (typeof l.value === 'string') setLit(l, renameTokens); } }); }
for (const [n, e] of litText) if (e.mapped !== e.inner) { edit(n.start + 1, n.end - 1, e.mapped); stringEdits.push([e.inner.slice(0, 50), e.mapped.slice(0, 50)]); }

// ───────────── 6. Düzenlemeleri uygula ─────────────
edits.sort((a, b) => a.start - b.start || b.end - a.end);
for (let i = 1; i < edits.length; i++) if (edits[i].start < edits[i - 1].end) { warn(`Üst üste düzenleme @${edits[i].start}: ${JSON.stringify(text.slice(edits[i - 1].start, edits[i - 1].end))} / ${JSON.stringify(text.slice(edits[i].start, edits[i].end))}`); }
function applyEdits(start, end) {
  let out = '', pos = start;
  for (const e of edits) {
    if (e.end <= start || e.start >= end) continue;
    if (e.start < pos) continue;
    out += text.slice(pos, e.start) + e.text; pos = e.end;
  }
  return out + text.slice(pos, end);
}

// ───────────── 7. Modül kuralları: hangi öğe hangi modülde, bağımlılıklar ─────────────
// ACT/ADMIN_ACT özelliklerini alt öğe say
const subItems = []; // {mod, name, start, end, parentItem}
for (const it of items) {
  if (it.kind === 'var' && (it.old === 'ACT' || it.old === 'ADMIN_ACT')) {
    for (const p of it.node.init.properties) {
      const k = p.key.name ?? p.key.value; const a = ACTIONS[k];
      subItems.push({ mod: a ? a[1] : 'actions-ui', name: a ? a[0] : k, start: p.start, end: p.end, parent: it, key: k });
    }
  }
}
const modOfPos = (pos) => {
  const si = subItems.find((s) => pos >= s.start && pos < s.end); if (si) return si.mod;
  const it = items.find((i) => pos >= i.start && pos < i.end); return it ? it.mod : null;
};
// Kutu sağlayıcıları (nesne adı -> modül)
export const BOX_HOME = {};
for (const [old, expr] of Object.entries(BOXES)) { const it = itemByOld.get(old); const obj = expr.split('.')[0]; if (it && !BOX_HOME[obj]) BOX_HOME[obj] = it.mod; }
// Çapraz modül başvuruları -> içe aktarmalar
const imports = new Map(); // mod -> Map(fromMod -> Set(names))
const exportsOf = new Map(); // mod -> Set(names)
const addImport = (mod, from, name) => {
  if (!mod || !from || mod === from) return;
  if (!imports.has(mod)) imports.set(mod, new Map());
  const m = imports.get(mod); if (!m.has(from)) m.set(from, new Set()); m.get(from).add(name);
  if (!exportsOf.has(from)) exportsOf.set(from, new Set()); exportsOf.get(from).add(name);
};
for (const { v } of allVars) {
  if (!isTop(v)) continue;
  const t = topMap.get(v.name); if (!t) continue;
  const b = BOXES[v.name];
  const exportName = b ? b.split('.')[0] : t.name;
  for (const r of v.references) {
    if (r.init) continue;
    const where = modOfPos(r.identifier.start);
    const home = b ? BOX_HOME[b.split('.')[0]] : t.mod;
    if (SETTERS[v.name] && r.isWrite()) { addImport(where, t.mod, SETTERS[v.name]); continue; }
    addImport(where, home, exportName);
  }
}
// Ek bağımlılıklar: eylem alt öğeleri 'actions' (ACT) başvuruları zaten yukarıda; ACT'nin kendisi 'actions-index'te

if (args.has('--leftovers')) {
  // Sınıf adı gibi görünen kısa dizeler (eski sınıf adı içeren) - elle gözden geçir
  const out = [];
  for (const [n, e] of litText) {
    const t = e.mapped;
    if (t.length > 26 || !/^[ \w-]+$/.test(t) || inSkip(n.start)) continue;
    const toks = t.split(/\s+/).filter(Boolean);
    if (toks.some((x) => CLASSES[x])) {
      let fnName = '(module)'; let a = items.find((i) => n.start >= i.start && n.start < i.end); if (a) fnName = a.old;
      out.push(`${fnName}: ${JSON.stringify(t)}  [parent: ${e.parent?.type}${e.parent?.callee?.property?.name ? '.' + e.parent.callee.property.name : ''}]`);
    }
  }
  console.log(out.join('\n')); process.exit(0);
}
if (args.has('--report')) {
  console.log('SORUNLAR:', problems.length); problems.slice(0, 40).forEach((p) => console.log(' -', p));
  console.log('Düzenleme sayısı:', edits.length, 'Dize düzenlemesi:', stringEdits.length);
  const samples = [];
  for (const { v, scope } of allVars) if (scope !== moduleScope && newNameOf.get(v) !== v.name) samples.push(`${scopeFn(scope)}:${v.name}->${newNameOf.get(v)}`);
  console.log('İç ad değişimi:', samples.length);
  const byOld = {}; for (const s of samples) { const [k, n] = s.split(':')[1].split('->'); (byOld[k] ??= {})[n] = (byOld[k][n] || 0) + 1; }
  console.log(JSON.stringify(byOld).slice(0, 3500));
  console.log('\nÇapraz modül içe aktarma sayısı:', [...imports.values()].reduce((a, m) => a + [...m.values()].reduce((x, s) => x + s.size, 0), 0));
  console.log('Dize düzenleme örnekleri:', stringEdits.slice(0, 12));
  process.exit(0);
}
export { items, subItems, topMap, imports, exportsOf, applyEdits, newNameOf, text, MODULES, OUT, problems, comments, itemByOld };
