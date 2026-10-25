// Bitiş ve bilgilendirme ekranı, karar kartı.

import { CONFIG, PILOT_MODE } from '../constants/app-config.js';
import { render } from './app-shell.js';
import { state } from '../viewmodels/app-state.js';
import { consentField } from './consent-view.js';
import { flushEvents, logEvent } from '../services/event-log.js';
import { filmHtml } from '../widgets/film-widget.js';
import { escapeHtml } from '../utils/format.js';
import { freePlayEntryHtml } from './free-play-view.js';
import { simulationChartGeometry, simulationChartSvg, simulationSeries } from '../widgets/price-chart.js';
import { section } from '../widgets/section.js';
import { PILOT_FEEDBACK_QUESTIONS } from '../constants/ui-constants.js';

// ───────────────── Bitiş, son test, manipülasyon kontrolü, bilgilendirme ─────────────────
export function renderEnd() {
  var count = function (block) {
    var decisions = state.decisions.filter(function (item) {
      return item.block === block && item.kind === 'kriz' && item.pos === 'zarar';
    });
    return (
      decisions.filter(function (item) {
        return item.final === 'sat';
      }).length +
      ' / ' +
      decisions.length
    );
  };
  var html =
      '<div class="row-titlesheet-titleage" style="justify-content:flex-start;padding-top:18px"><h1 style="margin-top:4px">Üç bölüm tamamlandı</h1><p>Teşekkürler. Verilerin kaydedildi.</p>',
    summary =
      filmHtml() +
      '<div class="stat-row" style="margin:4px 0 14px"><div class="stat"><span>1. bölüm, düşüşte satış</span><b>' +
      count('pre') +
      '</b></div><div class="stat"><span>3. bölüm, düşüşte satış</span><b>' +
      count('post') +
      '</b></div></div>';
  if (state.postTest == null)
    return (
      html +
      '<div class="is-wrongsheet-titlee is-info"><span>Son adımlar: 2 soruluk test ve iki kısa soru. Sonra çalışmanın amacını anlatacağız.</span></div><button class="button is-primary" data-a="startTest" data-v="post">Devam</button></div>'
    );
  // Manipülasyon kontrolü ve amaç tahmini, amaç açıklanmadan ÖNCE sorulur
  if (!state.manipulationCheck)
    return (
      html +
      section(
        'Kısa bir soru',
        '<p style="margin:0 0 14px">Simülatörde, zararına satmak istediğinde ekrana bir <b>bekleme süresi</b> geldi mi?</p><div class="chip-list">' +
          ['Evet', 'Hayır', 'Hatırlamıyorum', 'Hiç satış yapmadım']
            .map(function (item) {
              return (
                '<button class="chip" data-a="answerManipulationCheck" data-v="' +
                item +
                '">' +
                item +
                '</button>'
              );
            })
            .join('') +
          '</div>'
      ) +
      '</div>'
    );
  if (state.purposeGuess == null)
    return (
      html +
      section(
        'Son soru',
        '<p style="margin:0 0 10px">Sence bu araştırma neyi ölçmeye çalışıyordu? <span class="muted">(isteğe bağlı)</span></p><textarea id="purpose-guess" class="fiecard-labeld" rows="3" style="height:auto;padding:10px 12px;resize:vertical" maxlength="400" aria-label="Araştırmanın amacı hakkındaki tahminin" placeholder="Kısaca yazabilirsin"></textarea><button class="button is-primary" style="margin-top:10px" data-a="submitPurposeGuess">Gönder</button><button class="card-labelirow-subtitlecard-value" style="width:100%" data-a="skipPurposeGuess">Atla</button>'
      ) +
      '</div>'
    );
  if (!state.debriefLogged) {
    state.debriefLogged = 1;
    logEvent('debrief_view', {});
    flushEvents();
  }
  return (
    html +
    summary +
    section(
      'Çalışmanın amacı',
      '<p style="margin:0 0 10px">Bu çalışmada, simülatörde zararına satış yapmadan önce verilen <b>' +
        CONFIG.cooldownSec +
        ' saniyelik bekleme süresinin</b>, sonrasındaki kararlara da yansıyıp yansımadığını inceledik.</p><p class="muted">Katılımcılar rastgele iki gruba ayrıldı. Bir grupta simülatörde bekleme ekranı çıktı, diğerinde çıkmadı. 1. ve 3. bölümde iki grup için de bekleme yoktu; bu iki bölümü karşılaştırarak bir değişim olup olmadığına bakıyoruz. Bunu baştan söylemedik, çünkü bilmek kararlarını etkileyebilirdi.</p><div class="is-wrongsheet-titlee" style="margin:14px 0 0"><span><b>Sen ' +
        (state.group === 'A' ? 'bekleme süresi olan' : 'bekleme süresi olmayan (kontrol)') +
        ' gruptaydın.</b></span></div>'
    ) +
    section(
      'Bilmen gerekenler',
      '<p class="muted" style="margin:0 0 8px">Hisse adları gerçek şirketlere ait olsa da fiyatlar, grafikler ve haberler tamamen kurgusaldı; bu şirketlerin gerçek performansını ya da gerçek haberlerini yansıtmaz. Karar anlarının sonuçları, satmanın ya da tutmanın ortalamada avantaj sağlamayacağı şekilde dengelenmişti; simülatördeki piyasa da krizden sonra ortalamada yatay seyredecek şekilde seçilmişti. Yani hiçbir kararın "doğru" ya da "yanlış" değildi.</p><p class="muted" style="margin:0 0 8px">Hiçbir içerik yatırım tavsiyesi değildir.</p><p class="muted" style="margin:0">Soruların için: <b style="color:var(--tx)">' +
        consentField('contact') +
        '</b></p>'
    ) +
    section(
      'Rahatsız hissettiysen',
      '<p class="muted" style="margin:0 0 8px">Piyasa düşüşleri ve zarar anları sırasında gergin ya da rahatsız hissetmiş olabilirsin. Bu his sürüyorsa konuşabileceğin yer: <b style="color:var(--tx)">' +
        consentField('support') +
        '</b></p><p class="muted" style="margin:0">Araştırmayla ilgili sorular için: <b style="color:var(--tx)">' +
        consentField('contact') +
        '</b></p>'
    ) +
    summaryCardHtml() +
    freePlayEntryHtml() +
    section(
      'Verilerin',
      '<p class="muted" style="margin:0 0 12px">Amacı öğrendikten sonra verilerinin kullanılmasını istemiyorsan şimdi çekilebilirsin.</p><button class="button ghost-danger" data-a="requestWithdraw">Çalışmadan çekil, verilerimi sil</button>'
    ) +
    pilotFeedbackHtml() +
    '</div>'
  );
}

// Karar kartı: yalnızca katılımcının kendi karar sayıları. Grup ve çalışmanın amacı resimde YOK (paylaşılırsa diğer katılımcıları etkiler).
function decisionCounts(block) {
  var map = { sat: 0, tut: 0, al: 0 };
  state.decisions.forEach(function (item) {
    if (item.block === block && map[item.final] != null) map[item.final]++;
  });
  return map;
}

function summaryCardHtml() {
  var innerSimulationChartSvg = simulationChartSvg(),
    other =
      (innerSimulationChartSvg
        ? '<p class="muted" style="margin:0 0 8px">Simülatörde toplam paranın seyri</p>' +
          innerSimulationChartSvg +
          '<p class="muted small-text" style="margin:6px 0 14px">● sattığın an · ○ aldığın an · gri bant: haberlerdeki sert düşüş dönemleri</p>'
        : '') +
      '<p class="muted" style="margin:0 0 10px">Kararlarının kısa bir özetini resim olarak kaydedebilirsin. Resimde grubun ya da çalışmanın amacı yazmaz.</p>';
  if (!state.summaryCardUrl)
    other += '<button class="button" data-a="downloadSummaryCard">Karar kartımı oluştur</button>';
  else
    other +=
      '<img src="' +
      state.summaryCardUrl +
      '" alt="Karar özeti kartı: 1. ve 3. bölümde kaç kez sat, tut, al dediğin ve simülatördeki işlem sayın" style="display:block;width:100%;border-radius:14px;border:1px solid var(--ln);margin:0 0 10px"><a class="button is-primary" download="ilk-lot-karar-ozeti.png" href="' +
      state.summaryCardUrl +
      '">Resmi kaydet</a><p class="muted small-text" style="margin:8px 0 0">Kaydetme düğmesi çalışmazsa resme basılı tutup kaydedebilirsin.</p>';
  other +=
    '<p class="muted small-text" style="margin:10px 0 0">Çalışma henüz sürüyor: amacını ve ayrıntıları başkalarıyla şimdilik paylaşma, yoksa onların kararlarını etkileyebilirsin.</p>';
  return section('Karar özetin', other);
}

export async function createSummaryCard() {
  var innerWidth = 1080,
    height = 1350,
    element = document.createElement('canvas');
  element.width = innerWidth;
  element.height = height;
  var context = element.getContext('2d'),
    cells = getComputedStyle(document.documentElement),
    innerValue = function (count) {
      return cells.getPropertyValue(count).trim() || '#000';
    };
  try {
    await document.fonts.load('700 40px "Bricolage Grotesque"');
    await document.fonts.load('400 40px "Bricolage Grotesque"');
  } catch (error) {}
  var text = '"Bricolage Grotesque",system-ui,sans-serif';
  context.fillStyle = innerValue('--bg');
  context.fillRect(0, 0, innerWidth, height);
  context.fillStyle = innerValue('--tx');
  context.font = '700 84px ' + text;
  context.fillText('Karar özetim', 72, 150);
  context.fillStyle = innerValue('--mu');
  context.font = '400 38px ' + text;
  context.fillText('İlk Lot · kurgusal piyasa araştırması', 72, 210);
  var rows = [
      ['1. bölüm', decisionCounts('pre')],
      ['3. bölüm', decisionCounts('post')],
    ],
    y = 260;
  rows.forEach(function (innerItem) {
    context.fillStyle = innerValue('--sf');
    context.strokeStyle = innerValue('--ln');
    context.lineWidth = 2;
    roundedRectPath(context, 72, y, innerWidth - 144, 230, 28);
    context.fill();
    context.stroke();
    context.fillStyle = innerValue('--tx');
    context.font = '700 44px ' + text;
    context.fillText(innerItem[0], 112, y + 66);
    [
      ['Sat', innerItem[1].sat],
      ['Tut', innerItem[1].tut],
      ['Al', innerItem[1].al],
    ].forEach(function (item, index) {
      var centerX = 112 + index * 290;
      context.fillStyle = innerValue('--tx');
      context.font = '700 84px ' + text;
      context.fillText(String(item[1]), centerX, y + 170);
      var width = context.measureText(String(item[1])).width;
      context.fillStyle = innerValue('--mu');
      context.font = '400 38px ' + text;
      context.fillText(item[0], centerX + width + 16, y + 170);
    });
    y += 260;
  });
  var innerCount = 0;
  try {
    innerCount = state.simulation && state.simulation.trades ? state.simulation.trades.length : 0;
  } catch (error) {}
  var sharesHeld = 380;
  context.fillStyle = innerValue('--sf');
  context.strokeStyle = innerValue('--ln');
  roundedRectPath(context, 72, y, innerWidth - 144, sharesHeld, 28);
  context.fill();
  context.stroke();
  context.fillStyle = innerValue('--tx');
  context.font = '700 44px ' + text;
  context.fillText('Simülatör', 112, y + 66);
  context.textAlign = 'right';
  context.fillStyle = innerValue('--mu');
  context.font = '400 38px ' + text;
  context.fillText(innerCount + ' işlem yaptın', innerWidth - 112, y + 66);
  context.textAlign = 'left';
  if (simulationSeries()) {
    var startX = 112,
      canvasWidth = innerWidth - 224,
      startY = y + 96,
      change = sharesHeld - 96 - 70,
      innerSimulationChartGeometry = simulationChartGeometry(canvasWidth, change, 0, 0, 6, 6),
      xValue = function (value) {
        return startX + innerSimulationChartGeometry.X(value);
      },
      yValue = function (quantity) {
        return startY + innerSimulationChartGeometry.Y(quantity);
      },
      data = innerSimulationChartGeometry.d;
    context.fillStyle = innerValue('--sf2');
    CONFIG.simCrises.forEach(function (item) {
      context.fillRect(xValue(item.at), startY, xValue(item.at + item.len) - xValue(item.at), change);
    });
    context.strokeStyle = innerValue('--mu');
    context.lineWidth = 2;
    context.setLineDash([10, 10]);
    context.beginPath();
    context.moveTo(startX, yValue(data.v0));
    context.lineTo(startX + canvasWidth, yValue(data.v0));
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = innerValue('--tx');
    context.lineWidth = 4;
    context.lineJoin = 'round';
    context.beginPath();
    data.v.forEach(function (item, index) {
      index ? context.lineTo(xValue(index), yValue(item)) : context.moveTo(xValue(index), yValue(item));
    });
    context.stroke();
    data.tr.forEach(function (item) {
      var pixels = xValue(item.t),
        py = yValue(data.v[item.t]);
      context.beginPath();
      context.arc(pixels, py, 10, 0, 6.2832);
      if (item.side === 'S') {
        context.fillStyle = innerValue('--tx');
        context.fill();
        context.strokeStyle = innerValue('--sf');
        context.lineWidth = 3;
        context.stroke();
      } else {
        context.fillStyle = innerValue('--sf');
        context.fill();
        context.strokeStyle = innerValue('--tx');
        context.lineWidth = 4;
        context.stroke();
      }
    });
    context.fillStyle = innerValue('--mu');
    context.font = '400 28px ' + text;
    context.fillText('Gün 0', startX, y + sharesHeld - 34);
    context.textAlign = 'right';
    context.fillText('Gün ' + CONFIG.simTicks, startX + canvasWidth, y + sharesHeld - 34);
    context.textAlign = 'left';
    context.fillText('● sattığın an   ○ aldığın an', startX + 190, y + sharesHeld - 34);
  }
  context.fillStyle = innerValue('--mu');
  context.font = '400 32px ' + text;
  context.fillText('Fiyatlar, haberler ve hisse hareketleri kurgusaldı.', 72, height - 84);
  context.fillText('Hiçbir içerik yatırım tavsiyesi değildir.', 72, height - 40);
  state.summaryCardUrl = element.toDataURL('image/png');
  logEvent('summary_card', { n: innerCount });
  flushEvents();
  render();
}

function roundedRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function pilotFeedbackHtml() {
  if (!PILOT_MODE) return '';
  if (state.pilotFeedback)
    return section(
      'Pilot geri bildirimi',
      '<p class="muted" style="margin:0">Teşekkürler, geri bildirimin kaydedildi.</p>'
    );
  var data = state.feedbackDraft || {};
  return section(
    'Pilot geri bildirimi',
    '<p class="muted" style="margin:0 0 4px">Bu 3 soru yalnızca pilot katılımcılarına soruluyor. İsteğe bağlı; atlayabilirsin.</p>' +
      PILOT_FEEDBACK_QUESTIONS.map(function (innerItem) {
        return (
          '<p style="margin:14px 0 8px;font-weight:700;color:var(--tx)">' +
          innerItem[1] +
          '</p>' +
          (innerItem[3]
            ? '<p class="muted small-text" style="margin:-4px 0 8px">' + innerItem[3] + '</p>'
            : '') +
          '<div class="chip-list" role="group" aria-label="' +
          escapeHtml(innerItem[1]) +
          '">' +
          innerItem[2]
            .map(function (item) {
              return (
                '<button class="chip' +
                (data[innerItem[0]] === item ? ' is-active' : '') +
                '" aria-pressed="' +
                (data[innerItem[0]] === item) +
                '" data-a="pickFeedbackAnswer" data-v="' +
                innerItem[0] +
                '|' +
                item +
                '">' +
                item +
                '</button>'
              );
            })
            .join('') +
          '</div>'
        );
      }).join('') +
      '<button class="button is-primary" style="margin-top:16px" data-a="sendFeedback">Gönder</button><button class="card-labelirow-subtitlecard-value" style="width:100%" data-a="skipFeedback">Atla</button>'
  );
}
