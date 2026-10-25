// Bölümler arası bilgi ekranları.

import { CONFIG } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { formatNumber } from '../utils/format.js';
import { READING_CARDS } from '../constants/glossary.js';
import { STOCK_BASES } from '../constants/market-data.js';
import { simulationMinutesText, tickSecondsText } from '../models/market-simulation.js';
import { termButtonHtml } from './menu-view.js';
import { currentBlockTrials } from '../models/trial-generator.js';

export function renderBridge() {
  if (state.bridge === 'simready')
    return (
      '<div class="row-titlesheet-titleage"><div class="muted small-text" style="font-weight:700">2. bölüm</div><h1>Alıştırma bitti</h1><p>Şimdi gerçek simülatör başlıyor. Süre ' +
      simulationMinutesText() +
      ' dakika. Alıştırmadaki işlemler sayılmaz; buradan sonrası sayılır.</p><button class="button is-primary" data-a="startSimulation">Simülatörü başlat</button></div>'
    );
  if (state.bridge === 'sim') {
    var total = CONFIG.cash0 + STOCK_BASES.length * CONFIG.posValue;
    var facts = [
      ['₺' + formatNumber(total, 0), 'toplam paran'],
      [STOCK_BASES.length + ' hisse', 'her biri yaklaşık ₺' + formatNumber(CONFIG.posValue, 0)],
      [simulationMinutesText() + ' dk', 'her ' + tickSecondsText() + ' sn bir gün'],
    ];
    var items = [
      [
        'Fiyatlar kendiliğinden akar',
        'Sen bir şey yapmasan da zaman ilerler ve fiyatlar değişir. Sağ üstte kalan süre görünür.',
      ],
      [
        'Bir hisseye dokun',
        'Fiyat grafiğini görürsün. Oradan <b>Sat</b> ya da <b>Al</b> seçip ' +
          termButtonHtml(1, 'lot adedini') +
          ' kendin yazarsın.',
      ],
      [
        'İşlem penceresi açıkken zaman durur',
        'Acele etmene gerek yok. Pencereyi kapatınca zaman kaldığı yerden devam eder.',
      ],
      [
        'Almak için nakit gerekir, satmak için hissen',
        'Sattığın hissenin parası nakite eklenir. Elindekinden fazlasını satamaz, nakdinden fazlasını alamazsın.',
      ],
      ['İşlem yapmak zorunda değilsin', 'İstediğin kadar işlem yapabilir ya da hiç yapmayabilirsin.'],
    ];
    var tabs = [
      ['Portföy', 'hisselerin, nakdin ve işlem düğmeleri'],
      ['Piyasa', 'haberler ve fiyat grafikleri'],
      ['Analiz', 'bu bölümdeki işlemlerinin özeti'],
    ];
    return (
      '<div class="row-titlesheet-titleage"><div class="muted small-text" style="font-weight:700">2. bölüm</div><h1>Piyasa simülatörü</h1><p>Şimdi ' +
      simulationMinutesText() +
      ' dakikalık bir simülatöre geçiyoruz. Önce 30 saniyelik bir alıştırma yapacaksın, sonra gerçek simülatör başlayacak.</p>' +
      '<div class="info-facts">' +
      facts
        .map(function (item) {
          return '<div><b>' + item[0] + '</b><span>' + item[1] + '</span></div>';
        })
        .join('') +
      '</div>' +
      '<p class="muted small-text" style="margin:0 0 14px">Başlangıçta paranın bir kısmı hissede, kalanı (₺' +
      formatNumber(CONFIG.cash0, 0) +
      ') nakit olarak bekliyor.</p>' +
      '<div class="muted small-text" style="font-weight:700;margin:6px 0 8px">Nasıl çalışır</div><ol class="how-list">' +
      items
        .map(function (item) {
          return '<li><b>' + item[0] + '</b><span>' + item[1] + '</span></li>';
        })
        .join('') +
      '</ol>' +
      '<div class="muted small-text" style="font-weight:700;margin:14px 0 8px">Alt çubukta üç sekme var</div><div class="info-tabs">' +
      tabs
        .map(function (item) {
          return '<div><b>' + item[0] + '</b><span>' + item[1] + '</span></div>';
        })
        .join('') +
      '</div>' +
      '<div class="is-wrongsheet-titlee is-info" style="margin:14px 0 12px"><span><b style="color:var(--tx)">Önemli:</b> Hisse adları gerçek BIST şirketleridir, ama fiyatlar, grafikler ve haberler araştırma için kurgulanmıştır. Bu şirketlerin gerçek durumunu yansıtmaz. Hiçbir kararın doğru ya da yanlış değildir; içerik yatırım tavsiyesi değildir.</span></div>' +
      '<div class="muted small-text" style="font-weight:700;margin:6px 0 8px">Başlamadan önce kısa bir okuma</div>' +
      READING_CARDS.map(function (item) {
        return '<div class="rounded-box"><b>' + item[0] + '</b><p>' + item[1] + '</p></div>';
      }).join('') +
      '<button class="button is-primary" style="margin-top:6px" data-a="startPracticeSimulator">Okudum, 30 saniyelik alıştırmaya geç</button><p class="muted small-text" style="margin:8px 0 0">Alıştırmada ekranı ve işlem düğmelerini dener, istersen atlayabilirsin. Alıştırmadaki işlemler sayılmaz.</p></div>'
    );
  }
  return (
    '<div class="row-titlesheet-titleage"><div class="muted small-text" style="font-weight:700">3. bölüm</div><h1>Son ' +
    currentBlockTrials().length +
    ' karar</h1><p>Simülatör bitti. Şimdi ilk bölümdekine benzer, ama farklı hisselerle ' +
    currentBlockTrials().length +
    ' karar daha vereceksin.</p><button class="button is-primary" data-a="startPostBlock">Başla</button></div>'
  );
}
