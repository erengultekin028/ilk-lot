// Piyasa simülatörü ekranları: portföy, piyasa, analiz, hisse detayı, işlem penceresi.

import { CONFIG } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { byId, setText } from '../utils/dom.js';
import { directionClass, escapeHtml, formatNumber, formatPercentChange } from '../utils/format.js';
import { FREE_PLAY_LEVELS } from '../constants/free-play-data.js';
import { freePlayHeaderHtml, freePlayOrderHtml, freePlaySpeedHtml } from './free-play-view.js';
import { SELL_REASONS } from '../constants/glossary.js';
import { STOCK_BASES, STOCK_COLORS } from '../constants/market-data.js';
import {
  crisisAt,
  latestNewsAt,
  newsItems,
  portfolioValue,
  simulationTickLimit,
  stockCompanyName,
  stockFullName,
} from '../models/market-simulation.js';
import { termButtonHtml } from './menu-view.js';
import { renderDetailChart, renderSparkline } from '../widgets/price-chart.js';
import { section } from '../widgets/section.js';

// Sekmeler: Portföy (işlem), Piyasa (haberler + grafikler), Analiz (bu bölümdeki işlemlerin, yargısız)
export function simulatorNavHtml() {
  var map = {
    p: '<path d="M4 19V9m6 10V5m6 14v-7m4 7H2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    m: '<path d="M3 17l5-6 4 4 7-9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    a: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 12 18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  return [
    ['p', 'Portföy'],
    ['m', 'Piyasa'],
    ['a', 'Analiz'],
  ]
    .map(function (item) {
      var isOn = state.marketTab === item[0];
      var now = item[0] === 'm' && hasUnreadNews();
      return (
        '<button class="' +
        (isOn ? 'is-active' : '') +
        (now ? ' has-news' : '') +
        '" data-a="switchMarketTab" data-v="' +
        item[0] +
        '"' +
        (isOn ? ' aria-current="page"' : '') +
        (now ? ' aria-label="Piyasa, yeni haber"' : '') +
        '><svg viewBox="0 0 24 24" aria-hidden="true">' +
        map[item[0]] +
        '</svg>' +
        item[1] +
        '</button>'
      );
    })
    .join('');
}

export function renderSimulator() {
  var simulation = state.simulation,
    html = '<div id="crisis-alert"></div>' + (state.freePlay ? '<div id="news-banner"></div>' : '');
  if (state.detailSymbol) return html + stockDetailHtml(state.detailSymbol);
  if (state.marketTab === 'm') return html + marketTabHtml();
  if (state.marketTab === 'a') return html + '<div id="analysis-panel">' + analysisTabHtml() + '</div>';
  var portfolioTotal = portfolioValue(),
    change = (portfolioTotal / simulation.v0 - 1) * 100;
  html +=
    '<div class="hero" id="portfolio-hero" style="padding-bottom:12px"><div class="hero-label">' +
    (state.freePlay
      ? 'Serbest mod · ' + FREE_PLAY_LEVELS[state.freePlay.lvl].ad
      : state.practice
        ? 'Alıştırma'
        : '2. bölüm') +
    ' · ' +
    termButtonHtml(10, 'Toplam paran') +
    ' (hisseler + nakit)</div><div class="hero-value" id="portfolio-value">₺' +
    formatNumber(portfolioTotal, 0) +
    '</div><span class="direction-badge ' +
    directionClass(change) +
    '" id="portfolio-change">' +
    formatPercentChange(change) +
    ' başlangıca göre</span><div class="hero-sub"><span>Hisselerin<b id="invested-value">₺' +
    formatNumber(portfolioTotal - simulation.cash, 0) +
    '</b></span><span>' +
    termButtonHtml(9, 'Nakit') +
    '<b id="cash-value">₺' +
    formatNumber(simulation.cash, 0) +
    '</b></span><span>Gün<b id="day-counter">' +
    dayText(simulation) +
    '</b></span></div></div>';
  if (state.freePlay)
    html += '<div id="free-play-panel">' + freePlayHeaderHtml() + '</div>' + freePlaySpeedHtml();
  html +=
    '<div class="card-section" id="allocation-section"><div class="card-body" style="padding-top:12px"><div class="key-value" style="padding-top:0"><span style="color:var(--tx);font-weight:700">Dağılım</span><span class="muted small-text">toplam paranın yüzdesi</span></div><div id="allocation-bars">' +
    allocationHtml() +
    '</div></div></div>';
  html += '<div id="news-section">' + newsHtml(simulation.tick) + '</div>';
  html +=
    '<div class="card-section" id="stock-list"><div class="card-header"><h3>Hisselerin</h3><span class="muted small-text">dokunarak işlem yap</span></div><p class="sheet-hint">Her hissede: <b>adet × 1 lotun fiyatı = hissenin değeri</b>. ' +
    termButtonHtml(1, 'Lot') +
    ', hisse adedidir.</p>' +
    STOCK_BASES.map(function (item) {
      var key = item[0];
      return (
        '<button class="stock-row" data-a="openStockDetail" data-v="' +
        key +
        '" data-sim="' +
        key +
        '"><span class="stock-row-top"><span class="stock-symbol">' +
        key +
        (state.freePlay ? '<span class="news-flag" hidden>Haber</span>' : '') +
        '<small>' +
        item[1] +
        '</small></span><span class="profit-loss-block"><b class="row-secondary"></b><span class="percent-chip"></span><small>kâr / zarar</small></span></span><span class="equation"><span class="equation-cell"><i>Adet</i><b class="row-titlecard-label"></b></span><span class="operator" aria-hidden="true">×</span><span class="equation-cell"><i>1 lot fiyatı</i><b class="span-item"></b></span><span class="operator" aria-hidden="true">=</span><span class="equation-cell is-total"><i>Değer</i><b class="row-primary"></b></span></span><span class="average-line">Ortalama alış fiyatın: <b class="row-titlea"></b></span>' +
        (state.freePlay ? '<span class="average-line orounded-boxcard-label" hidden></span>' : '') +
        '</button>'
      );
    }).join('') +
    '</div>';
  return (
    html +
    (state.practice
      ? '<button class="button" style="margin:4px 0 10px" data-a="skipPracticeSimulator">Alıştırmayı bitir, gerçek simülatöre geç</button>'
      : state.freePlay
        ? '<button class="button" style="margin:4px 0 10px" data-a="quitFreePlay">Oyunu bitir</button>'
        : '') +
    '<p class="footnote">Şirket adları gerçek; fiyatlar, grafikler ve haberler kurgusaldır ve bu şirketlerin gerçek durumunu yansıtmaz. Yatırım tavsiyesi değildir.</p>'
  );
}

// ── Dağılım: her hissenin ve nakdin toplam paraya oranı ──
function allocationHtml() {
  var simulation = state.simulation,
    portfolioTotal = portfolioValue(),
    parts = STOCK_BASES.map(function (item) {
      var position = simulation.pos[item[0]];
      return [item[0], position.q * simulation.p[item[0]]];
    }).concat([['Nakit', simulation.cash]]);
  var rawValue = parts.map(function (item) {
      return (item[1] / portfolioTotal) * 100;
    }),
    percent = rawValue.map(Math.floor),
    rest =
      100 -
      percent.reduce(function (accumulator, item) {
        return accumulator + item;
      }, 0);
  rawValue
    .map(function (item, index) {
      return [item - Math.floor(item), index];
    })
    .sort(function (left, right) {
      return right[0] - left[0];
    })
    .slice(0, rest)
    .forEach(function (item) {
      percent[item[1]]++;
    });
  return (
    '<div class="allocation-bar">' +
    parts
      .map(function (item) {
        return item[1] > 0
          ? '<i style="width:' +
              ((item[1] / portfolioTotal) * 100).toFixed(2) +
              '%;background:' +
              (item[0] === 'Nakit' ? STOCK_COLORS.cash : STOCK_COLORS[item[0]]) +
              '" title="' +
              item[0] +
              '"></i>'
          : '';
      })
      .join('') +
    '</div><div class="allocation-legend">' +
    parts
      .map(function (item) {
        return (
          '<span><i style="background:' +
          (item[0] === 'Nakit' ? STOCK_COLORS.cash : STOCK_COLORS[item[0]]) +
          '"></i>' +
          item[0] +
          ' %' +
          percent[parts.indexOf(item)] +
          '</span>'
        );
      })
      .join('') +
    '</div>'
  );
}

function stockDetailInfoHtml(symbol) {
  var simulation = state.simulation,
    position = simulation.pos[symbol],
    price = simulation.p[symbol],
    hasPosition = position && position.q > 0,
    profitLossPercent = hasPosition ? (price / position.avg - 1) * 100 : 0,
    data = hasPosition ? position.q * (price - position.avg) : 0,
    change = (price / simulation.p0[symbol] - 1) * 100;
  return (
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span><b style="font:750 30px var(--fd);letter-spacing:-.6px" class="tabular-number">₺' +
    formatNumber(price) +
    '</b><span class="unit-text">1 lot fiyatı</span></span><span style="text-align:right"><span class="direction-badge ' +
    directionClass(change) +
    '" style="margin:0">' +
    formatPercentChange(change) +
    '</span><span class="muted" style="display:block;font-size:11px;margin-top:3px">ilk günden beri</span></span></div>' +
    '<div class="position-box"><div class="position-title">Senin pozisyonun</div>' +
    (hasPosition
      ? '<div class="cell-grid three-columns"><span class="cell"><i>' +
        termButtonHtml(1, 'Elindeki adet') +
        '</i><b>' +
        position.q +
        ' lot</b></span><span class="cell"><i>' +
        termButtonHtml(2, 'Ort. alış fiyatın') +
        '</i><b>₺' +
        formatNumber(position.avg) +
        '</b></span><span class="cell"><i>Toplam değeri</i><b>₺' +
        formatNumber(position.q * price, 0) +
        '</b></span></div><p class="muted small-text" style="margin:8px 0 0">' +
        position.q +
        ' lot × ₺' +
        formatNumber(price) +
        ' (güncel fiyat) = ₺' +
        formatNumber(position.q * price, 0) +
        '</p><div class="key-value" style="margin-top:6px"><span>' +
        termButtonHtml(5, 'Kârın / zararın') +
        '</span><b class="' +
        directionClass(profitLossPercent) +
        '">' +
        formatPercentChange(profitLossPercent) +
        ' (' +
        (data >= 0 ? '+' : '−') +
        '₺' +
        formatNumber(Math.abs(data), 0) +
        ')</b></div>'
      : '<div class="key-value"><span>Elindeki adet</span><b>Elinde yok</b></div>') +
    '</div>'
  );
}

function stockNewsHtml(symbol, tick) {
  var news = newsItems()
    .filter(function (item) {
      return item[0] <= tick && item[3].indexOf(symbol) >= 0;
    })
    .reverse();
  return news.length
    ? news
        .map(function (item) {
          return (
            '<div class="key-value" style="align-items:flex-start;gap:10px"><span style="flex:none;font-size:11px;font-weight:700;background:var(--sf2);border-radius:8px;padding:3px 7px">Gün ' +
            item[0] +
            '</span><span style="flex:1;color:' +
            (item[2] < 0 ? 'var(--dn)' : 'var(--tx)') +
            '">' +
            escapeHtml(item[1]) +
            '</span></div>'
          );
        })
        .join('')
    : '<p class="muted small-text" style="margin:0">Bu hisseyle ilgili henüz haber yok.</p>';
}

function stockDetailHtml(symbol) {
  var simulation = state.simulation,
    position = simulation.pos[symbol],
    hasPosition = position && position.q > 0,
    buyQuantity = Math.floor(CONFIG.addAmount / simulation.p[symbol]);
  return (
    '<div class="detail-header"><button class="icon-button" data-a="closeStockDetail" aria-label="Geri">‹</button><div><div style="font:700 22px/1.1 var(--fd)">' +
    symbol +
    '</div><div class="muted small-text">' +
    stockFullName(symbol) +
    '</div></div></div>' +
    '<div class="card-section"><div class="card-body" style="padding-top:14px"><div id="detail-info">' +
    stockDetailInfoHtml(symbol) +
    '</div><div class="range-selector">' +
    [10, 30, 60]
      .map(function (item) {
        return (
          '<button class="' +
          (state.detailRangeDays === item ? 'is-active' : '') +
          '" data-a="setChartRange" data-v="' +
          item +
          '">' +
          item +
          ' gün</button>'
        );
      })
      .join('') +
    '</div><div id="detail-chart">' +
    renderDetailChart(symbol) +
    '</div></div></div>' +
    '<div class="detail-actions"><button class="button is-primary" style="margin:0" data-a="openTradeWindow" data-v="' +
    symbol +
    '|S"' +
    (hasPosition ? '' : ' disabled') +
    '>Sat</button><button class="button is-primary" style="margin:0" data-a="openTradeWindow" data-v="' +
    symbol +
    '|B"' +
    (simulation.cash < simulation.p[symbol] ? ' disabled' : '') +
    '>Al</button></div>' +
    (state.freePlay
      ? section('Otomatik sat emri', '<div id="order-section">' + freePlayOrderHtml(symbol) + '</div>')
      : '') +
    section(
      'Bu hisseyle ilgili haberler',
      '<div id="detail-news">' + stockNewsHtml(symbol, simulation.tick) + '</div>'
    )
  );
}

function marketTabHtml() {
  var simulation = state.simulation,
    html =
      '<div class="card-section"><div class="card-header"><h3>Haberler</h3><span class="muted small-text">en yeni üstte</span></div><div class="card-body" id="market-news">' +
      newsListHtml(simulation.tick) +
      '</div></div>';
  html +=
    '<div class="market-grid" id="market-grid">' +
    STOCK_BASES.map(function (item) {
      return (
        '<button class="market-card" data-a="openStockDetail" data-v="' +
        item[0] +
        '" id="market-card-' +
        item[0] +
        '"></button>'
      );
    }).join('') +
    '</div>';
  return html + '<p class="footnote">Bir grafiğe dokunarak hissenin ayrıntısını açabilirsin.</p>';
}

function newsListHtml(tick) {
  var news = newsItems()
    .filter(function (item) {
      return item[0] <= tick;
    })
    .reverse();
  return news
    .map(function (item) {
      return (
        '<div class="key-value" style="align-items:flex-start;gap:10px"><span class="news-day" style="flex:none;font-size:11px;font-weight:700;background:var(--sf2);border-radius:8px;padding:3px 7px">Gün ' +
        item[0] +
        '</span><span style="flex:1;color:' +
        (item[2] < 0 ? 'var(--dn)' : 'var(--tx)') +
        '">' +
        escapeHtml(item[1]) +
        '</span></div>'
      );
    })
    .join('');
}

function stockCardHtml(symbol) {
  var simulation = state.simulation,
    history = simulation.h[symbol],
    change = (simulation.p[symbol] / simulation.p0[symbol] - 1) * 100,
    position = simulation.pos[symbol],
    hasPosition = position && position.q > 0;
  return (
    '<div style="display:flex;justify-content:space-between;align-items:baseline"><b>' +
    symbol +
    '</b><span class="' +
    directionClass(change) +
    '" style="font-size:12px;font-weight:700">' +
    formatPercentChange(change) +
    '</span></div><div class="muted">' +
    stockCompanyName(symbol) +
    ' · ₺' +
    formatNumber(simulation.p[symbol]) +
    '</div><div style="margin-top:6px">' +
    renderSparkline(history.slice(-40), change >= 0).replace(
      'width="64" height="24"',
      'width="100%" height="40" viewBox="0 0 64 24" preserveAspectRatio="none"'
    ) +
    '</div><div class="muted" style="margin-top:2px">' +
    (hasPosition
      ? 'Elinde ' + position.q + ' lot · ₺' + formatNumber(position.q * simulation.p[symbol], 0)
      : 'Elinde yok') +
    '</div>'
  );
}

function analysisTabHtml() {
  var simulation = state.simulation,
    trades = simulation.trades,
    sells = trades.filter(function (item) {
      return item.side === 'S';
    }),
    buys = trades.filter(function (item) {
      return item.side === 'B';
    }),
    portfolioTotal = portfolioValue(),
    length = sells.filter(function (item) {
      return item.pl != null && item.pl <= CONFIG.lossThreshold;
    }).length,
    row = function (key, value, data) {
      return (
        '<div style="padding:11px 0;border-top:1px solid var(--ln)"><div class="key-value" style="padding:0"><span style="color:var(--tx);font-weight:600">' +
        key +
        '</span><b>' +
        value +
        '</b></div>' +
        (data ? '<div class="muted small-text" style="margin-top:2px">' + data + '</div>' : '') +
        '</div>'
      );
    },
    map = {};
  sells.forEach(function (item) {
    if (item.why) map[item.why] = (map[item.why] || 0) + 1;
  });
  return (
    section(
      'Bu bölümdeki işlemlerin',
      '<p class="muted" style="margin:0 0 6px">Doğru ya da yanlış yok; sadece ne yaptığının özeti.</p>' +
        row(
          'Toplam paran',
          '₺' + formatNumber(portfolioTotal, 0),
          'Başlangıç: ₺' + formatNumber(simulation.v0, 0)
        ) +
        row('Satış', sells.length + ' işlem', length ? length + ' tanesi zarardayken' : '') +
        row('Alım', buys.length + ' işlem', '') +
        (state.freePlay
          ? ''
          : row(
              'Satış gerekçelerin',
              Object.keys(map).length
                ? Object.keys(map)
                    .map(function (item) {
                      return item + ' (' + map[item] + ')';
                    })
                    .join(', ')
                : '-',
              ''
            ))
    ) +
    section(
      'İşlem geçmişi',
      '<div class="history-list">' +
        (trades.length
          ? trades
              .slice()
              .reverse()
              .map(function (item) {
                var stateCopy = item.side === 'S';
                return (
                  '<div class="key-value"><span style="flex:none;font-size:11px;font-weight:700;background:var(--sf2);border-radius:8px;padding:3px 7px;color:var(--mu)">Gün ' +
                  item.t +
                  '</span><span style="flex:1;color:var(--tx)"><b style="font-weight:700">' +
                  item.sym +
                  '</b> · ' +
                  (stateCopy ? 'Sattın' : 'Aldın') +
                  ' ' +
                  item.q +
                  ' lot × ₺' +
                  formatNumber(item.p) +
                  (item.why ? '<br><span class="muted small-text">' + escapeHtml(item.why) + '</span>' : '') +
                  '</span><b class="' +
                  (stateCopy ? '' : '') +
                  '">₺' +
                  formatNumber(item.q * item.p, 0) +
                  '</b></div>'
                );
              })
              .join('')
          : '<p class="muted small-text" style="margin:0">Henüz işlem yapmadın.</p>') +
        '</div>'
    )
  );
}

// Canlı güncelleme: sadece değişen metinler (liste zıplamaz)
function isNewsFresh(tick, news) {
  return !!news && news[0] > 0 && tick - news[0] < 10;
} // "Yeni" rozeti ~15 sn (10 gün) görünür

function newsHtml(tick) {
  var news = latestNewsAt(tick);
  if (!news) return '';
  return (
    '<div class="row-subtitleews' +
    (news[2] < 0 ? ' is-negative' : '') +
    (tick - news[0] < 3 && news[0] > 0 ? ' is-fresh' : '') +
    '"><div class="news-meta"><span class="news-label">Son haber</span>' +
    (isNewsFresh(tick, news) ? '<span class="news-badge">Yeni</span>' : '') +
    '<span class="news-day">Gün ' +
    news[0] +
    '</span></div><p class="news-title">' +
    escapeHtml(news[1]) +
    '</p><button class="card-labelirow-subtitlecard-value news-all" data-a="switchMarketTab" data-v="m">Tüm haberler</button></div>'
  );
}

// Piyasa sekmesinde okunmamış haber noktası: son haberin günü, Piyasa sekmesinde en son görülen günden büyükse
function hasUnreadNews() {
  var simulation = state.simulation;
  if (!simulation || state.marketTab === 'm') return false;
  var news = latestNewsAt(simulation.tick);
  return !!news && news[0] > (state.newsSeenDay == null ? 0 : state.newsSeenDay);
}

function updateNewsDot() {
  var element = document.querySelector('nav [data-a=switchMarketTab][data-v=m]');
  if (!element) return;
  var innerHasUnreadNews = hasUnreadNews();
  element.classList.toggle('has-news', innerHasUnreadNews);
  if (innerHasUnreadNews) element.setAttribute('aria-label', 'Piyasa, yeni haber');
  else element.removeAttribute('aria-label');
}

// Kriz anında Portföy dışındaysa çağrı: kimse krizi kaçırmasın
function updateCrisisAlert() {
  var simulation = state.simulation,
    crisisAlertElement = byId('crisis-alert');
  if (!crisisAlertElement) return;
  var crisis = crisisAt(simulation.tick),
    text = '';
  if (crisis && state.marketTab !== 'p') {
    var news = latestNewsAt(simulation.tick);
    text =
      '<div class="crisis-alert-box" role="alert"><span>' +
      escapeHtml(news ? news[1] : 'Sert düşüş') +
      '</span><button data-a="switchMarketTab" data-v="p">Portföye git</button></div>';
  }
  if (crisisAlertElement._h !== text) {
    crisisAlertElement.innerHTML = text;
    crisisAlertElement._h = text;
  }
}

// b25 (yalnızca serbest mod): yeni haber gelince üstte geçici şerit; haberden etkilenen hisse satırında "Haber" işareti.
// Çalışma simülatöründe ve alıştırmada hiç çizilmez (#sbanner yok, S.free yok).
export function freePlayBannerNews() {
  var simulation = state.simulation;
  if (!state.freePlay || !simulation) return null;
  var news = latestNewsAt(simulation.tick);
  return news && isNewsFresh(simulation.tick, news) ? news : null;
}

export function updateNewsBanner() {
  var newsBannerElement = byId('news-banner');
  if (!newsBannerElement) return;
  var simulation = state.simulation,
    news = freePlayBannerNews(),
    text = '';
  if (
    news &&
    state.marketTab !== 'm' &&
    news[0] > Math.max(state.freePlay.bn || 0, state.newsSeenDay || 0) &&
    !(crisisAt(simulation.tick) && state.marketTab !== 'p')
  )
    text =
      '<div class="news-banner-box' +
      (news[2] < 0 ? ' is-negative' : '') +
      '" role="status"><button class="news-banner-button" data-a="switchMarketTab" data-v="m"><span class="news-banner-label">Yeni haber · Gün ' +
      news[0] +
      '</span><span class="news-banner-text">' +
      escapeHtml(news[1]) +
      '</span></button><button class="news-banner-close" data-a="closeNewsBanner" aria-label="Haberi kapat">×</button></div>';
  if (newsBannerElement._h !== text) {
    newsBannerElement.innerHTML = text;
    newsBannerElement._h = text;
  }
}

export function updateSimulatorLive() {
  var simulation = state.simulation;
  if (!simulation) return;
  updateCrisisAlert();
  updateNewsBanner();
  updateNewsDot();
  if (state.detailSymbol) {
    var detailSymbol = state.detailSymbol,
      detailInfoElement = byId('detail-info'),
      detailChartElement = byId('detail-chart'),
      detailNewsElement = byId('detail-news');
    if (detailInfoElement) detailInfoElement.innerHTML = stockDetailInfoHtml(detailSymbol);
    if (detailChartElement) detailChartElement.innerHTML = renderDetailChart(detailSymbol);
    if (detailNewsElement) {
      var innerStockNewsHtml = stockNewsHtml(detailSymbol, simulation.tick);
      if (detailNewsElement._h !== innerStockNewsHtml) {
        detailNewsElement.innerHTML = innerStockNewsHtml;
        detailNewsElement._h = innerStockNewsHtml;
      }
    }
    return;
  }
  var allocationBarsElement = byId('allocation-bars');
  if (allocationBarsElement) {
    var innerAllocationHtml = allocationHtml();
    if (allocationBarsElement._h !== innerAllocationHtml) {
      allocationBarsElement.innerHTML = innerAllocationHtml;
      allocationBarsElement._h = innerAllocationHtml;
    }
  }
  if (state.marketTab === 'm') {
    var innerNews = latestNewsAt(simulation.tick);
    state.newsSeenDay = innerNews ? innerNews[0] : 0;
    var marketNewsElement = byId('market-news');
    if (marketNewsElement && marketNewsElement._t !== latestNewsAt(simulation.tick)[0]) {
      marketNewsElement.innerHTML = newsListHtml(simulation.tick);
      marketNewsElement._t = latestNewsAt(simulation.tick)[0];
    }
    STOCK_BASES.forEach(function (item) {
      var element = byId('mc-' + item[0]);
      if (element) element.innerHTML = stockCardHtml(item[0]);
    });
    return;
  }
  if (state.marketTab === 'a') {
    var analysisPanelElement = byId('analysis-panel');
    if (analysisPanelElement) {
      var innerAnalysisTabHtml = analysisTabHtml();
      if (analysisPanelElement._h !== innerAnalysisTabHtml) {
        analysisPanelElement.innerHTML = innerAnalysisTabHtml;
        analysisPanelElement._h = innerAnalysisTabHtml;
      }
    }
    return;
  }
  if (!byId('portfolio-value')) return;
  var portfolioTotal = portfolioValue(),
    change = (portfolioTotal / simulation.v0 - 1) * 100;
  setText('sv', '₺' + formatNumber(portfolioTotal, 0));
  setText('sinv', '₺' + formatNumber(portfolioTotal - simulation.cash, 0));
  var portfolioChangeElement = byId('portfolio-change');
  portfolioChangeElement.textContent = formatPercentChange(change) + ' başlangıca göre';
  portfolioChangeElement.className = 'direction-badge ' + directionClass(change);
  setText('scash', '₺' + formatNumber(simulation.cash, 0));
  setText('sday', dayText(simulation));
  var freePlayPanelElement = byId('free-play-panel');
  if (freePlayPanelElement) {
    var innerFreePlayHeaderHtml = freePlayHeaderHtml();
    if (freePlayPanelElement._h !== innerFreePlayHeaderHtml) {
      freePlayPanelElement.innerHTML = innerFreePlayHeaderHtml;
      freePlayPanelElement._h = innerFreePlayHeaderHtml;
    }
  }
  var news2 = latestNewsAt(simulation.tick),
    nextKey = news2 ? news2[0] + ':' + (isNewsFresh(simulation.tick, news2) ? 1 : 0) : -1,
    newsSectionElement = byId('news-section');
  if (newsSectionElement && newsSectionElement._k !== nextKey) {
    newsSectionElement.innerHTML = newsHtml(simulation.tick);
    newsSectionElement._k = nextKey;
  }
  document.querySelectorAll('[data-sim]').forEach(function (item) {
    var sim = item.dataset.sim,
      position = simulation.pos[sim],
      price = simulation.p[sim],
      history = simulation.h[sim],
      isUp = history[history.length - 1] >= history[Math.max(0, history.length - 8)];
    var innerElement = item.querySelector('.news-flag');
    if (innerElement) {
      var news = freePlayBannerNews(),
        isOn = !!news && (news[3] || []).indexOf(sim) >= 0;
      if (innerElement.hidden === isOn) innerElement.hidden = !isOn;
    }
    var element2 = item.querySelector('.sa'),
      element3 = item.querySelector('.sl'),
      element4 = item.querySelector('.span-item'),
      element5 = item.querySelector('.percent-chip'),
      element6 = item.querySelector('.row-primary'),
      element7 = item.querySelector('.row-secondary'),
      element = item.querySelector('.ordl');
    if (element) {
      var order = simulation.orders && simulation.orders[sim],
        overTime = order
          ? 'Otomatik emir: ' +
            (order.stop != null ? 'zarar −%' + Math.round(order.stop * 100) : '') +
            (order.stop != null && order.take != null ? ' · ' : '') +
            (order.take != null ? 'kâr +%' + Math.round(order.take * 100) : '')
          : '';
      element.hidden = !overTime;
      if (element._t !== overTime) {
        element.textContent = overTime;
        element._t = overTime;
      }
    }
    element4.textContent = '₺' + formatNumber(price);
    // Fiyat sütununun altında: alış ortalamasına göre % ; değer sütununun altında: ₺ kâr/zarar
    if (position && position.q > 0) {
      element3.textContent = position.q + ' lot';
      element2.textContent = '₺' + formatNumber(position.avg);
      element6.textContent = '₺' + formatNumber(position.q * price, 0);
      var profitLossPercent = (price / position.avg - 1) * 100,
        data = position.q * (price - position.avg);
      element5.textContent = formatPercentChange(profitLossPercent);
      element5.className = 'percent-chip ' + directionClass(profitLossPercent);
      element7.textContent = (data >= 0 ? '+' : '−') + '₺' + formatNumber(Math.abs(data), 0);
      element7.className = 'row-secondary ' + directionClass(profitLossPercent);
    } else {
      element3.textContent = 'Yok';
      element2.textContent = '-';
      element6.textContent = '₺0';
      element5.textContent = '';
      element7.textContent = 'satıldı';
      element7.className = 'row-secondary muted';
    }
  });
}

// İşlem penceresi (modal). A grubunda zararına satış önce bekleme ekranına gider
// ── İşlem penceresi: yön (Sat/Al), lot kutusu (elle yazılır), hızlı oranlar, anlık özet ──
// Kutu BOŞ başlar: hazır bir miktar önermek kararı yönlendirirdi (çıpalama). İki yön aynı görünümde.
export function calculateTrade() {
  var tradeDraft = state.tradeDraft,
    simulation = state.simulation,
    key = tradeDraft.k,
    price = simulation.p[key],
    position = simulation.pos[key],
    held = position ? position.q : 0,
    maxB = Math.floor(simulation.cash / price),
    sell = tradeDraft.side === 'S',
    limit = sell ? held : maxB,
    quantity = tradeDraft.q || 0;
  return {
    k: key,
    p: price,
    held: held,
    maxB: maxB,
    sell: sell,
    lim: limit,
    q: quantity,
    over: quantity > limit,
    cost: quantity * price,
  };
}

function tradeSummaryHtml(calc) {
  if (calc.q >= 1 && !calc.over)
    return calc.sell
      ? '<div class="key-value"><span>Satış tutarı<small class="fx-note">' +
          calc.q +
          ' lot × ₺' +
          formatNumber(calc.p) +
          '</small></span><b>₺' +
          formatNumber(calc.cost) +
          '</b></div><div class="key-value"><span>Kalan lot</span><b>' +
          (calc.held - calc.q) +
          ' lot</b></div>'
      : '<div class="key-value"><span>Alış tutarı<small class="fx-note">' +
          calc.q +
          ' lot × ₺' +
          formatNumber(calc.p) +
          '</small></span><b>₺' +
          formatNumber(calc.cost) +
          '</b></div><div class="key-value"><span>Kalan nakit</span><b>₺' +
          formatNumber(state.simulation.cash - calc.cost, 0) +
          '</b></div>';
  if (calc.lim < 1)
    return (
      '<p class="muted small-text" style="margin:2px 0">' +
      (calc.sell ? 'Bu hissede lotun yok.' : 'Nakdin 1 lota bile yetmiyor.') +
      '</p>'
    );
  if (calc.over)
    return (
      '<p class="price-down small-text" style="margin:2px 0;font-weight:600">' +
      (calc.sell
        ? 'Elinde en fazla ' + calc.held + ' lot var.'
        : 'Nakdin en fazla ' + calc.maxB + ' lota yetiyor.') +
      '</p>'
    );
  return (
    '<p class="muted small-text" style="margin:2px 0">Kaç lot ' +
    (calc.sell ? 'satacağını' : 'alacağını') +
    ' yaz ya da aşağıdan seç. En fazla ' +
    calc.lim +
    ' lot.</p>'
  );
}

export function tradeWindowHtml(symbol) {
  var tradeDraft = state.tradeDraft,
    simulation = state.simulation,
    position = simulation.pos[symbol],
    price = simulation.p[symbol],
    hasPosition = position && position.q > 0,
    profitLossPercent = hasPosition ? (price / position.avg - 1) * 100 : 0,
    data = hasPosition ? position.q * (price - position.avg) : 0,
    isUp =
      simulation.h[symbol][simulation.h[symbol].length - 1] >=
      simulation.h[symbol][Math.max(0, simulation.h[symbol].length - 8)],
    trade = calculateTrade(),
    isValid = trade.q >= 1 && !trade.over;
  return (
    '<h2>' +
    symbol +
    ' <span class="muted" style="font:600 14px var(--fb)">' +
    stockFullName(symbol) +
    '</span></h2><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font:700 24px var(--fd)">₺' +
    formatNumber(price) +
    '</b><span class="muted small-text">güncel fiyat (1 lot)</span></div><div style="margin:6px 0 2px">' +
    renderSparkline(simulation.h[symbol].slice(-40), isUp).replace(
      'width="64" height="24"',
      'width="100%" height="44" viewBox="0 0 64 24" preserveAspectRatio="none"'
    ) +
    '</div>' +
    '<div class="key-value"><span>Elindeki adet</span><b>' +
    (hasPosition ? position.q + ' lot' : 'Elinde yok') +
    '</b></div>' +
    (hasPosition
      ? '<div class="key-value"><span>Toplam değeri<small class="fx-note">' +
        position.q +
        ' lot × ₺' +
        formatNumber(price) +
        '</small></span><b>₺' +
        formatNumber(position.q * price, 0) +
        '</b></div><div class="key-value"><span>Ortalama alış fiyatın<small class="fx-note">1 lot için</small></span><b>₺' +
        formatNumber(position.avg) +
        '</b></div><div class="key-value"><span>Kârın / zararın</span><b class="' +
        directionClass(profitLossPercent) +
        '">' +
        formatPercentChange(profitLossPercent) +
        ' (' +
        (data >= 0 ? '+' : '−') +
        '₺' +
        formatNumber(Math.abs(data), 0) +
        ')</b></div>'
      : '') +
    '<div class="key-value"><span>Nakit</span><b>₺' +
    formatNumber(simulation.cash, 0) +
    '</b></div>' +
    '<div class="trade-side" role="group" aria-label="İşlem yönü"><button data-a="setTradeSide" data-v="S" class="' +
    (trade.sell ? 'is-active' : '') +
    '"' +
    (trade.sell ? ' aria-pressed="true"' : '') +
    '>Sat</button><button data-a="setTradeSide" data-v="B" class="' +
    (trade.sell ? '' : 'is-active') +
    '"' +
    (trade.sell ? '' : ' aria-pressed="true"') +
    '>Al</button></div>' +
    '<label class="quantity-label" for="trade-quantity">Kaç lot ' +
    (trade.sell ? 'satacaksın' : 'alacaksın') +
    '?</label><div class="quantity-row"><button class="quantity-button" data-a="setTradeQuantity" data-v="-1" aria-label="Bir lot azalt">−</button><input id="trade-quantity" data-in="simq" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Lot" value="' +
    (trade.q || '') +
    '" aria-label="Lot sayısı"><button class="quantity-button" data-a="setTradeQuantity" data-v="+1" aria-label="Bir lot artır">+</button></div>' +
    '<div class="quantity-chips"><button data-a="setTradeQuantity" data-v="p25"' +
    (trade.lim < 1 ? ' disabled' : '') +
    '>%25</button><button data-a="setTradeQuantity" data-v="p50"' +
    (trade.lim < 1 ? ' disabled' : '') +
    '>%50</button><button data-a="setTradeQuantity" data-v="p75"' +
    (trade.lim < 1 ? ' disabled' : '') +
    '>%75</button><button data-a="setTradeQuantity" data-v="max"' +
    (trade.lim < 1 ? ' disabled' : '') +
    '>' +
    (trade.sell ? 'Tümü' : 'Maks') +
    '</button></div>' +
    '<div class="trade-summary-box" id="trade-summary">' +
    tradeSummaryHtml(trade) +
    '</div><button class="button is-primary" id="trade-submit" data-a="submitTrade"' +
    (isValid ? '' : ' disabled') +
    '>' +
    (trade.q < 1
      ? 'Lot sayısı gir'
      : trade.over
        ? 'Lot sayısı çok fazla'
        : trade.q + ' lot ' + (trade.sell ? 'sat' : 'al')) +
    '</button><button class="button" style="margin-top:10px" data-a="closeTradeWindow">Kapat</button>'
  );
}

// Yazarken pencere baştan çizilmez (odak ve klavye kaybolmasın): sadece özet, düğme ve yön güncellenir
export function updateTradePreview() {
  var tradeDraft = state.tradeDraft;
  if (!tradeDraft || !byId('trade-summary')) return;
  var trade = calculateTrade(),
    isValid = trade.q >= 1 && !trade.over;
  byId('trade-summary').innerHTML = tradeSummaryHtml(trade);
  var tradeSubmitElement = byId('trade-submit');
  tradeSubmitElement.disabled = !isValid;
  tradeSubmitElement.textContent =
    trade.q < 1
      ? 'Lot sayısı gir'
      : trade.over
        ? 'Lot sayısı çok fazla'
        : trade.q + ' lot ' + (trade.sell ? 'sat' : 'al');
  document.querySelectorAll('#modal-box .trade-side button').forEach(function (item) {
    var isOn = item.dataset.v === tradeDraft.side;
    item.classList.toggle('is-active', isOn);
    if (isOn) item.setAttribute('aria-pressed', 'true');
    else item.removeAttribute('aria-pressed');
  });
  document.querySelectorAll('#modal-box .quantity-chips button').forEach(function (item) {
    item.disabled = trade.lim < 1;
  });
  var innerElement = document.querySelector('#modal-box .quantity-label');
  if (innerElement) innerElement.textContent = 'Kaç lot ' + (trade.sell ? 'satacaksın' : 'alacaksın') + '?';
  var element = document.querySelector('#modal-box .quantity-chips button[data-v=max]');
  if (element) element.textContent = trade.sell ? 'Tümü' : 'Maks';
}

export function sellReasonHtml(symbol, quantity) {
  return (
    '<h2>Neden satıyorsun?</h2><p>' +
    symbol +
    ': ' +
    quantity +
    ' lot satılacak. Tek dokunuşla seç.</p><div class="choice-list">' +
    SELL_REASONS.map(function (item, index) {
      return (
        '<button class="choice" data-a="chooseSellReason" data-v="' +
        index +
        '"><b style="font-size:16px">' +
        item +
        '</b></button>'
      );
    }).join('') +
    '</div><button class="button" style="margin-top:10px" data-a="cancelSellReason">Vazgeç</button>'
  );
}

export function simulatorCooldownHtml(symbol, profitLossPercent) {
  return (
    '<h2 style="text-align:center">Bir dakika dur</h2><p style="text-align:center">Zararına satmak üzeresin (' +
    formatPercentChange(profitLossPercent) +
    '). Kararını kesinleştirmeden önce ' +
    CONFIG.cooldownSec +
    ' saniye dur ve planını düşün.</p><div class="countdown" id="cooldown-number">' +
    Math.max(0, state.simulatorCooldown.left) +
    '</div><button class="button is-primary" data-a="cancelCooldown">Vazgeç, yeniden düşün</button><button class="button" id="cooldown-confirm" data-a="confirmAfterCooldown"' +
    (state.simulatorCooldown.left > 0 ? ' disabled' : '') +
    '>Satışı onayla</button>'
  );
}

// ═════════════════ SERBEST MOD EKRANLARI (b19) ═════════════════
function dayText(simulation) {
  return state.freePlay ? String(simulation.tick) : simulation.tick + ' / ' + simulationTickLimit();
}
