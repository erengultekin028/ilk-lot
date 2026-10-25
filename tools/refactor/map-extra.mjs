// Göç aracı için ek tablolar: iç değişken adı düzeltmeleri, çapraz modül yazılan üst düzey değişkenlerin "kutu"ları, ayarlayıcılar.

// 'işlevAdı:eskiAd' -> yeniAd  ya da  '*:eskiAd' -> yeniAd (her işlevde)
export const LOCAL_OVERRIDES = {
  '*:S2': 'stateCopy',
  // Parametreler (işlevAdı:eskiAd -> yeniAd). Eski işlev adları kullanılır.
  'seedOf:str': 'text', 'rr:a': 'min', 'rr:b': 'max', 'shuffle:a': 'array', 'fmt:n': 'value', 'fmt:d': 'decimals', 'r2:v': 'value',
  'sgn:v': 'value', 'cls:v': 'value', 'chg:v': 'value', 'tl:v': 'value', 'esc:t': 'text', 'mmss:sec': 'seconds',
  'makePath:p0': 'startPrice', 'weekCh:t': 'trial', 'compQ:i': 'index', 'simStockCrisis:k': 'symbol', 'simStockCrisis:t': 'tick',
  'simCrisis:t': 'tick', 'simNewsAt:t': 'tick', 'freePick:a': 'items', 'freePortfolio:m': 'simulation', 'freeInit:lvl': 'level',
  'freeInit:sc': 'scenario', 'freePlan:m': 'simulation', 'freeLimit:lvl': 'level', 'freeLimit:v0': 'startValue',
  'freeLim:f': 'freePlay', 'freeLimitF:f': 'freePlay', 'freeLimitF:v0': 'startValue', 'simBase:k': 'symbol', 'simCo:k': 'symbol',
  'simName:k': 'symbol', 'note:t': 'message', 'cryptoInt:n': 'max', 'normCode:raw': 'input', 'fmtCodeInput:raw': 'input',
  'makeAlloc:n': 'count', 'makeAlloc:block': 'blockSize', 'makeAlloc:start': 'startIndex', 'maskCode:c': 'code',
  'restore:sn': 'snapshot', 'nextSession:p': 'participant', 'gapLeftMs:prev': 'previousSession', 'codeFail:msg': 'message',
  'enterCode:raw': 'rawCode', 'csvCell:v': 'value', 'summarizeSnap:sn': 'snapshot', 'summarizeSnap:sess': 'session',
  'summarizeSnap:grp': 'group', 'byNo:m': 'map', 'stageText:sn': 'snapshot', 'ringSvg:p': 'fraction', 'bar:p': 'percent', 'bar:col': 'color',
  'cfld:k': 'key', 'trialChart:t': 'trial', 'chooseHtml:t': 'trial', 'coolHtml:t': 'trial', 'outcomeHtml:t': 'trial', 'outcomeHtml:d': 'decision',
  'filmFrame:p': 'progress', 'simSpark:a': 'values', 'simSpark:up': 'isUp', 'detailChart:k': 'symbol', 'detailInfo:k': 'symbol',
  'stockNews:k': 'symbol', 'stockNews:t': 'tick', 'simDetailHtml:k': 'symbol', 'newsList:t': 'tick', 'mcardHtml:k': 'symbol',
  'newsIsNew:t': 'tick', 'newsIsNew:n': 'news', 'newsHtml:t': 'tick', 'tradeSummaryHtml:c': 'calc', 'simTradeHtml:k': 'symbol',
  'simWhyHtml:k': 'symbol', 'simWhyHtml:q': 'quantity', 'simCoolHtml:k': 'symbol', 'simCoolHtml:pl': 'profitLossPercent',
  'decCounts:bl': 'block', 'simChartGeo:w': 'width', 'simChartGeo:h': 'height', 'simChartGeo:l': 'left', 'simChartGeo:r': 'right',
  'simChartGeo:t0': 'top', 'simChartGeo:b': 'bottom', 'cardRR:c': 'context', 'cardRR:w': 'width', 'cardRR:h': 'height', 'cardRR:r': 'radius',
  'trm:i': 'termIndex', 'termHtml:i': 'index', 'simDayTxt:m': 'simulation', 'freeRadio:act': 'action', 'freeRadio:lab': 'label',
  'freeRadio:cur': 'current', 'freeOrderHtml:k': 'symbol', 'freeSetText:f': 'freePlay', 'setTxt:id': 'id', 'setTxt:t': 'text',
  'simRec:k': 'symbol', 'simRec:q': 'quantity', 'simRec:p': 'price', 'doSimSell:k': 'symbol', 'doSimSell:q': 'quantity',
  'doSimSell:afterCd': 'afterCooldown', 'doSimBuy:k': 'symbol', 'doSimBuy:q': 'quantity', 'choose:c': 'choice', 'finalize:c': 'choice',
  'scrubAt:e': 'event', 'openModal:h': 'html', 'askConfirm:fn': 'onConfirm', 'quizHtml:st': 'stateClass',
};

// Birden fazla modülden YAZILAN üst düzey değişkenler tek nesnenin alanı olur (ES modül içe aktarmaları salt okunurdur).
// nesneAdı -> { alan: 'eskiDeğişkenAdı' }; aynı grubun üyeleri aynı modülde olmalıdır.
export const BOX_GROUPS = {
  rngState: { main: '_rs', market: '_r2' },
  eventLog: { queue: 'EVQ', counter: 'evN', flushing: 'flushing' },
  errorState: { seen: 'ERRS_SEEN', count: 'errCount', pending: 'preErr' },
  scrubState: { timer: 'scrubT', gesture: 'scrubG' },
};
export const BOXES = {};
for (const [obj, fields] of Object.entries(BOX_GROUPS)) for (const [field, old] of Object.entries(fields)) BOXES[old] = `${obj}.${field}`;

// Dışarıdan atanan değişkenler için ayarlayıcı işlev adları (app-config modülünde üretilir)
export const SETTERS = { DEMO: 'setDemoMode', PILOT: 'setPilotMode' };

export const DROP_ITEMS = new Set([]);
