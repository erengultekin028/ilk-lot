// Serbest mod ekranları.

import { state } from '../viewmodels/app-state.js';
import { directionClass, formatNumber, formatPercentChange } from '../utils/format.js';
import {
  FREE_PLAY_LEVELS,
  FREE_PLAY_LOSS_LIMITS,
  FREE_PLAY_PORTFOLIOS,
  FREE_PLAY_SCENARIOS,
} from '../constants/free-play-data.js';
import { freePlayLossFloorFor, freePlayLossLimit } from '../models/free-play-model.js';
import { portfolioValue } from '../models/market-simulation.js';
import { section } from '../widgets/section.js';

// Portföy ekranında: kayıp sınırı ve sınıra kalan pay
export function freePlayHeaderHtml() {
  var freePlay = state.freePlay,
    simulation = state.simulation,
    portfolioTotal = portfolioValue(),
    lossFloor = freePlayLossFloorFor(freePlay, simulation.v0),
    room = simulation.v0 - lossFloor,
    loss = Math.max(0, simulation.v0 - portfolioTotal),
    percent = Math.min(100, (loss / room) * 100);
  return (
    '<div class="free-play-limit"><div class="key-value" style="padding:0"><span style="color:var(--tx);font-weight:700">Kayıp sınırı · %' +
    Math.round(freePlayLossLimit(freePlay) * 100) +
    '</span><span>₺' +
    formatNumber(lossFloor, 0) +
    ' altına inersen oyun biter</span></div><div class="loss-bar"><i class="' +
    (percent >= 75 ? 'is-hot' : '') +
    '" style="width:' +
    percent.toFixed(1) +
    '%"></i></div><div class="muted small-text">Sınıra kalan: ₺' +
    formatNumber(Math.max(0, portfolioTotal - lossFloor), 0) +
    '</div></div>'
  );
}

// Çalışma bitiş ekranından serbest moda giriş (yalnızca bilgilendirme gösterildikten sonra)
export function freePlayEntryHtml() {
  return section(
    'Serbest mod',
    '<p class="muted" style="margin:0 0 10px">İstersen simülatörü oyun gibi, kendi kurallarınla oynayabilirsin: zorluğu, kayıp sınırını, senaryoyu ve başlangıç portföyünü sen seçersin; oyun sırasında piyasayı durdurabilir ya da hızlandırabilir, hisselere otomatik sat emri koyabilirsin. Bu bölüm çalışmanın parçası değil: <b>hiçbir şey kaydedilmez</b>, bekleme ekranı yoktur, süre sınırı yoktur. Oyun, kaybın seçtiğin sınırı aşınca biter.</p><button class="button" data-a="openFreePlay">Serbest moda geç</button>'
  );
}

// Seçenek düğmeleri (radyo grubu): items = [[değer, etiket], ...]
function radioGroupHtml(action, label, items, current) {
  return (
    '<div class="font-size-selector is-wrapped" role="radiogroup" aria-label="' +
    label +
    '"><span class="selector-label">' +
    label +
    '</span>' +
    items
      .map(function (item) {
        var isOn = String(item[0]) === String(current);
        return (
          '<button class="chip' +
          (isOn ? ' is-active' : '') +
          '" role="radio" aria-checked="' +
          isOn +
          '" data-a="' +
          action +
          '" data-v="' +
          item[0] +
          '">' +
          item[1] +
          '</button>'
        );
      })
      .join('') +
    '</div>'
  );
}

// Oyun sırasında piyasa hızı: durdurma, 1×, 2×, 4× (yerinde güncellenir, her gün yeniden çizilmez)
export function freePlaySpeedHtml() {
  var value = state.freePlay.speed == null ? 1 : state.freePlay.speed;
  return (
    '<div class="font-size-selector" role="group" aria-labelledby="speed-label" style="margin:0 0 12px"><span class="selector-label" id="speed-label">Piyasa hızı</span>' +
    [
      [0, 'Duraklat'],
      [1, '1×'],
      [2, '2×'],
      [4, '4×'],
    ]
      .map(function (item) {
        var isOn = item[0] === value;
        return (
          '<button class="chip' +
          (isOn ? ' is-active' : '') +
          '" aria-pressed="' +
          isOn +
          '" data-a="setFreePlaySpeed" data-v="' +
          item[0] +
          '">' +
          item[1] +
          '</button>'
        );
      })
      .join('') +
    '</div>'
  );
}

// Hisse detayında otomatik sat emri kartı (yalnızca serbest mod)
export function freePlayOrderHtml(symbol) {
  var simulation = state.simulation,
    position = simulation.pos[symbol],
    hasPosition = position && position.q > 0,
    order = (simulation.orders && simulation.orders[symbol]) || { stop: null, take: null };
  function row(value, lab, vals, ff) {
    return (
      '<div class="font-size-selector" role="radiogroup" aria-label="' +
      lab +
      '"><span class="selector-label">' +
      lab +
      '</span>' +
      ['x']
        .concat(vals)
        .map(function (item) {
          var isOn = item === 'x' ? order[value] == null : order[value] === item;
          return (
            '<button class="chip' +
            (isOn ? ' is-active' : '') +
            '" role="radio" aria-checked="' +
            isOn +
            '"' +
            (hasPosition ? '' : ' disabled') +
            ' data-a="setFreePlayOrder" data-v="' +
            symbol +
            '|' +
            value +
            '|' +
            item +
            '">' +
            (item === 'x' ? 'Yok' : ff(item)) +
            '</button>'
          );
        })
        .join('') +
      '</div>'
    );
  }
  return (
    '<p class="muted small-text" style="margin:0 0 10px">Eşikler ortalama alış fiyatına göredir. Eşik aşılınca hissenin tamamı o anki fiyattan satılır; sert düşüşte satış eşiğin altında gerçekleşebilir. Emir bir kez çalışır.</p>' +
    row('stop', 'Zarar olursa sat', [0.05, 0.1, 0.15, 0.2], function (value) {
      return '−%' + Math.round(value * 100);
    }) +
    row('take', 'Kâr olursa sat', [0.1, 0.2, 0.3], function (value) {
      return '+%' + Math.round(value * 100);
    }) +
    (hasPosition
      ? ''
      : '<p class="muted small-text" style="margin:0">Emir koymak için önce bu hisseden almalısın.</p>')
  );
}

function freePlaySettingsText(freePlay) {
  return (
    FREE_PLAY_LEVELS[freePlay.lvl].ad +
    ' · kayıp sınırı %' +
    Math.round(freePlayLossLimit(freePlay) * 100) +
    ' · ' +
    FREE_PLAY_SCENARIOS[freePlay.sc || 'r'].ad +
    ' · ' +
    FREE_PLAY_PORTFOLIOS[freePlay.pf || 'd'].ad
  );
}

export function renderFreePlayMenu() {
  var freePlay = state.freePlay,
    desc = {
      k: ['Daha seyrek ve küçük düşüşler ile yükselişler; uyarı erken gelir', 'Haberler kısa ve net'],
      o: [
        'Daha sık ve büyük olaylar; bazen tüm piyasa birlikte hareket eder',
        'Haberler nedenleriyle birlikte gelir',
      ],
      z: [
        'Sık ve sert olaylar; uyarı geç gelir',
        'Haberler çok katmanlı ve belirsizdir, yön her zaman açık değildir',
      ],
    };
  return (
    '<div class="row-titlesheet-titleage" style="justify-content:flex-start;padding-top:18px"><div class="muted small-text" style="font-weight:700">Serbest mod</div><h1 style="margin-top:4px">Oyunu kendin kur</h1><p>Aynı simülatör, kurgusal fiyatlar ve haberler. Hiçbir şey kaydedilmez ve çalışmanın parçası değildir. Süre sınırı yok; toplam paran kayıp sınırının altına inince oyun biter, istersen kendin de bitirebilirsin. Oyun sırasında piyasayı durdurabilir ya da hızlandırabilir, her hisseye otomatik sat emri koyabilirsin.</p>' +
    '<div class="level-list" role="radiogroup" aria-label="Zorluk">' +
    ['k', 'o', 'z']
      .map(function (item) {
        var list = FREE_PLAY_LEVELS[item],
          data = desc[item],
          isOn = freePlay.lvl === item;
        return (
          '<button class="level-option' +
          (isOn ? ' is-active' : '') +
          '" role="radio" aria-checked="' +
          isOn +
          '" data-a="selectFreePlayLevel" data-v="' +
          item +
          '"><b>' +
          list.ad +
          '</b><span>Kayıp sınırı %' +
          Math.round(list.lim * 100) +
          '</span><small>' +
          data[0] +
          '.</small><small>' +
          data[1] +
          '.</small></button>'
        );
      })
      .join('') +
    '</div>' +
    radioGroupHtml(
      'selectFreePlayLimit',
      'Kayıp sınırı',
      [['d', 'Zorluğa göre (%' + Math.round(FREE_PLAY_LEVELS[freePlay.lvl].lim * 100) + ')']].concat(
        FREE_PLAY_LOSS_LIMITS.map(function (item) {
          return [item, '%' + Math.round(item * 100)];
        })
      ),
      freePlay.lim == null ? 'd' : freePlay.lim
    ) +
    radioGroupHtml(
      'selectFreePlayScenario',
      'Senaryo',
      Object.keys(FREE_PLAY_SCENARIOS).map(function (item) {
        return [item, FREE_PLAY_SCENARIOS[item].ad];
      }),
      freePlay.sc || 'r'
    ) +
    '<p class="muted small-text" style="margin:-6px 0 14px">' +
    FREE_PLAY_SCENARIOS[freePlay.sc || 'r'].tx +
    '</p>' +
    radioGroupHtml(
      'selectFreePlayPortfolio',
      'Başlangıç portföyü',
      Object.keys(FREE_PLAY_PORTFOLIOS).map(function (item) {
        return [item, FREE_PLAY_PORTFOLIOS[item].ad];
      }),
      freePlay.pf || 'd'
    ) +
    '<p class="muted small-text" style="margin:-6px 0 14px">' +
    FREE_PLAY_PORTFOLIOS[freePlay.pf || 'd'].tx +
    '</p>' +
    '<button class="button is-primary" data-a="startFreePlay">Oyunu başlat</button><button class="card-labelirow-subtitlecard-value" style="width:100%" data-a="leaveFreePlay">Geri dön</button><p class="footnote">Şirket adları gerçek; fiyatlar, grafikler ve haberler kurgusaldır ve bu şirketlerin gerçek durumunu yansıtmaz. Yatırım tavsiyesi değildir.</p></div>'
  );
}

export function renderFreePlayEnd() {
  var freePlay = state.freePlay,
    res = freePlay.res,
    list = FREE_PLAY_LEVELS[freePlay.lvl],
    change = (res.value / res.v0 - 1) * 100,
    na = state.simulation
      ? state.simulation.trades.filter(function (item) {
          return item.auto;
        }).length
      : 0;
  return (
    '<div class="row-titlesheet-titleage" style="justify-content:flex-start;padding-top:18px"><div class="muted small-text" style="font-weight:700">Serbest mod · ' +
    list.ad +
    '</div><h1 style="margin-top:4px">' +
    (res.kind === 'limit' ? 'Kayıp sınırına ulaştın' : 'Oyunu bitirdin') +
    '</h1><p>' +
    (res.kind === 'limit'
      ? 'Toplam paran ₺' +
        formatNumber(freePlayLossFloorFor(freePlay, res.v0), 0) +
        ' sınırının altına indi, oyun bitti.'
      : 'İstediğin zaman yeniden başlayabilirsin.') +
    '</p>' +
    '<div class="stat-row" style="margin:4px 0 14px"><div class="stat"><span>Dayandığın gün</span><b>' +
    res.tick +
    '</b></div><div class="stat"><span>Son para</span><b>₺' +
    formatNumber(res.value, 0) +
    '</b></div></div><div class="stat-row" style="margin:0 0 14px"><div class="stat"><span>Başlangıca göre</span><b class="' +
    directionClass(change) +
    '">' +
    formatPercentChange(change) +
    '</b></div><div class="stat"><span>İşlem sayısı</span><b>' +
    res.trades +
    '</b></div></div>' +
    (na
      ? '<p class="muted small-text" style="margin:-4px 0 12px">Bu işlemlerin ' +
        na +
        ' tanesi otomatik emirle yapıldı.</p>'
      : '') +
    '<p class="muted small-text" style="margin:0 0 14px">Ayarların: ' +
    freePlaySettingsText(freePlay) +
    '.</p>' +
    '<button class="button is-primary" data-a="startFreePlay">Aynı ayarlarla yeniden oyna</button><button class="button" data-a="showFreePlayMenu">Ayarları değiştir</button><button class="card-labelirow-subtitlecard-value" style="width:100%" data-a="leaveFreePlay">Çalışmanın bitiş ekranına dön</button><p class="muted small-text" style="margin:12px 0 0">Bu oyunda hiçbir şey kaydedilmedi. Kurgusal bir simülasyondur, yatırım tavsiyesi değildir.</p></div>'
  );
}
