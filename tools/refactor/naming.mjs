// İç kapsamdaki (üst düzey olmayan) değişken, parametre ve işlev adları için İngilizce, anlaşılır ad önerileri.
// Kural tabanlıdır; sonucu `overrides` (map-locals.mjs) ile işlev bazında düzeltebilirsin.
import { STATE_PROPS } from './map-names.mjs';

const callbackParams = {
  forEach: ['item', 'index'], map: ['item', 'index'], filter: ['item', 'index'], some: ['item', 'index'], every: ['item', 'index'],
  find: ['item', 'index'], findIndex: ['item', 'index'], reduce: ['accumulator', 'item'], sort: ['left', 'right'],
};

// Ad önerisi sözlüğü: eski kısa ad -> varsayılan yeni ad (bağlam kuralları uygulanamadığında).
const DEFAULTS = {
  a: 'items', b: 'other', c: 'value', d: 'data', e: 'element', f: 'handler', g: 'group', h: 'html', i: 'i', j: 'j', k: 'key',
  l: 'level', m: 'simulation', n: 'count', o: 'position', p: 'price', q: 'quantity', r: 'result', s: 'text', t: 'value', u: 'unit',
  v: 'value', w: 'width', x: 'x', y: 'y', z: 'z', A: 'allocations', B: 'bounds', D: 'data', F: 'frame', H: 'height', I: 'index',
  L: 'list', M: 'month', N: 'count', Q: 'question', S: 'sides', T: 'trials', W: 'width', X: 'xValue', Y: 'yValue',
  ch: 'change', el: 'element', col: 'color', cx: 'centerX', cy: 'centerY', dc: 'decimals', hh: 'height', ks: 'keys', mx: 'max',
  mn: 'min', nn: 'next', od: 'order', ok: 'isValid', pc: 'percent', pd: 'padding', pl: 'profitLossPercent', ps: 'participants',
  pt: 'point', st: 'scrollTop', sn: 'snapshot', tr: 'trialState', up: 'isUp', w2: 'width', has: 'hasPosition', on: 'isOn', now: 'now',
  row: 'row', rg: 'range', sq: 'sequence', ph: 'phase', pos: 'position', num: 'number', cur: 'current',
  gap: 'gap', lim: 'limit', val: 'value', why: 'reason', tot: 'total', wk: 'weekChange', raw: 'rawValue', key: 'key',
  mod: 'modifier', fb: 'feedback', ls: 'list', t0: 'startTime', cl: 'classNames', cs: 'cells', all: 'all', unf: 'unfilled',
  inv: 'invested', mk: 'marketChange', vw: 'viewWidth', tz: 'timezoneOffset', txt: 'text', tb: 'tabBar', sb: 'sideBar', s0: 'startValue', ref: 'reference', rd: 'reader', qk: 'quickMode', px: 'pixels', pct: 'percent', nx: 'nextX', nw: 'now', ne: 'newsEvent', mA: 'marketA', mB: 'marketB', isQ: 'isQuick', inC: 'insideChart', gx: 'gridX', dur: 'duration', dir: 'direction', dg: 'degrees', cx0: 'startX', cy0: 'startY', cnt: 'count', bl: 'block', al: 'alert', ev: 'entry', sx: 'startX', sy: 'startY', si: 'stockIndex', sh: 'sharesHeld', pu: 'pulses', dk: 'dark', ln: 'line', lb: 'label', sa: 'sellAmount', sl: 'sellLots', sp: 'spread', rp: 'report', rc: 'record', hs: 'history', ks: 'keys', ap: 'applied', an: 'analysis', bq: 'buyQuantity', bn: 'bannerNews', cb: 'callback', bx: 'box', ah: 'ahead', fh: 'filmHeight', fl: 'floor', cw: 'canvasWidth', cv: 'canvas', dc: 'decimals', tk: 'tick', tg: 'target', fv: 'finalValue', ek: 'eventKey', ren: 'renderClass', sv: 'svg', nS: 'sellCount', nB: 'buyCount', res: 'resolve', dn: 'isDown', di: 'directionIndex', n0: 'startCount', ot: 'overTime',
  ic: 'icon', it: 'item', nd: 'nextDay', nh: 'newHigh', nk: 'nextKey', ol: 'overLimit', ot: 'overTime',
};

const kebab = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Başlatıcıdan ad türet: S.sim -> simulation, $('x') -> xElement, çağrı -> çağrılan işlev adı, üye -> son özellik
function fromInit(init, nameOfTop, idNameOf) {
  if (!init) return null;
  let n = init;
  while (n.type === 'AwaitExpression' || n.type === 'UnaryExpression' && n.operator === '!') n = n.argument;
  if (n.type === 'CallExpression') {
    const c = n.callee;
    if (c.type === 'Identifier') {
      if (c.name === '$' && n.arguments[0]?.type === 'Literal' && typeof n.arguments[0].value === 'string') return kebab(idNameOf(n.arguments[0].value)) + 'Element';
      const t = nameOfTop(c.name);
      const CALL_RESULT = { currentTrial: 'trial', portfolioValue: 'portfolioTotal', stockCompanyName: 'company', crisisAt: 'crisis', stockCrisisAt: 'crisis', calculateTrade: 'trade', latestNewsAt: 'news', newsItems: 'news', comprehensionQuestionAt: 'question', fontSizeLevel: 'level', formatCodeInput: 'formatted', activeCrises: 'crises', findStockBase: 'stockBase', simulationSeries: 'series', buildFilmData: 'film', freePlayBannerNews: 'news', byId: 'element', syncStatus: 'status', formatNumber: 'formatted', normalizeCode: 'code', rememberedCode: 'code', simulationTickLimit: 'limit', round2: 'rounded', findNextSession: 'next', freePlayLossLimit: 'lossLimit', freePlayLossFloorFor: 'lossFloor', stockFullName: 'name' };
      if (t && CALL_RESULT[t]) return CALL_RESULT[t];
      if (t) return t.replace(/^(get|make|build|create|find)([A-Z])/, (_, __, ch) => ch.toLowerCase()).replace(/^[A-Z]/, (ch) => ch.toLowerCase());
      return null;
    }
    if (c.type === 'MemberExpression' && !c.computed) {
      const p = c.property.name;
      if (['getElementById', 'querySelector'].includes(p)) return 'element';
      if (p === 'closest') return 'target';
      if (['slice', 'concat', 'filter', 'map', 'sort', 'reverse'].includes(p)) return fromInit(c.object, nameOfTop, idNameOf) ?? null;
      if (p === 'getContext') return 'context';
      if (p === 'createElement') return 'element';
      return null;
    }
  }
  if (n.type === 'MemberExpression') {
    if (!n.computed && n.object.type === 'Identifier' && n.object.name === 'S') { const pn = STATE_PROPS[n.property.name] ?? n.property.name; return pn === 'trial' ? 'trialState' : pn; }
    if (n.computed && n.object.type === 'MemberExpression' && !n.object.computed) { const SING = { pos: 'position', p: 'price', h: 'history', p0: 'startPrice', orders: 'order' }; return SING[n.object.property.name] ?? null; }
    return n.computed ? null : n.property.name;
  }
  if (n.type === 'NewExpression' && n.callee.type === 'Identifier') return n.callee.name === 'Date' ? 'date' : null;
  if (n.type === 'ArrayExpression') return 'items';
  if (n.type === 'ObjectExpression') return 'map';
  if (n.type === 'BinaryExpression' && n.operator === '+') { let l = n; while (l.type === 'BinaryExpression') l = l.left; if (l.type === 'Literal' && typeof l.value === 'string' && l.value.trim().startsWith('<')) return 'html'; }
  if (n.type === 'Literal') return typeof n.value === 'string' ? (n.value.trim().startsWith('<') ? 'html' : 'text') : null;
  return null;
}

export function suggestName(variable, info) {
  const old = variable.name;
  const def = variable.defs[0];
  if (!def) return old;
  if (def.type === 'CatchClause') return 'error';
  if (old === '_' || /^_/.test(old)) return old;
  if (def.type === 'Parameter') {
    const fn = def.node;
    const parent = info.parentOf(fn);
    const idx = fn.params.findIndex((p) => p === def.name);
    if (parent?.type === 'CallExpression' && parent.callee.type === 'MemberExpression' && fn === parent.arguments[0]) {
      const cb = callbackParams[parent.callee.property.name];
      if (cb && cb[idx]) return cb[idx];
      if (parent.callee.property.name === 'addEventListener' && idx === 0) return 'event';
      if (['then', 'catch'].includes(parent.callee.property.name) && idx === 0) return parent.callee.property.name === 'catch' ? 'error' : 'result';
    }
    if (parent?.type === 'CallExpression' && parent.callee.type === 'Identifier' && ['addEventListener'].includes(parent.callee.name) && idx === 0) return 'event';
    if (parent?.type === 'CallExpression' && parent.callee.type === 'MemberExpression' && parent.callee.property.name === 'addEventListener' && idx === 1 && old === 'e') return 'event';
    if (parent?.type === 'CallExpression' && parent.callee.type === 'MemberExpression' && parent.callee.property.name === 'addEventListener' && idx === 0) return 'event';
    if (parent?.type === 'NewExpression' && parent.callee.name === 'Promise') return idx === 0 ? 'resolve' : 'reject';
    if (old === 'e' && fn.type !== 'FunctionDeclaration') return 'event';
    return DEFAULTS[old] ?? old;
  }
  if (def.type === 'FunctionName') return DEFAULTS[old] ?? old;
  if (def.type === 'Variable') {
    const init = def.node.init;
    if (old === 'i' || old === 'j') return old;
    if (old.length > 3) return old; // zaten anlaşılır
    const derived = fromInit(init, info.nameOfTop, info.idNameOf);
    if (derived && /^[a-z][A-Za-z0-9]{2,}$/.test(derived) && derived !== old) return derived;
    return DEFAULTS[old] ?? old;
  }
  return DEFAULTS[old] ?? old;
}
