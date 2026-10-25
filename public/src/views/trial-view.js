// Karar anı ekranları: seçim, bekleme, sonuç, gerginlik, anlama kontrolü.

import { CONFIG } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { comprehensionQuestionAt } from '../models/comprehension.js';
import { COMPREHENSION_POOLS } from '../constants/comprehension-questions.js';
import {
  directionClass,
  escapeHtml,
  formatLira,
  formatNumber,
  formatPercentChange,
} from '../utils/format.js';
import { termButtonHtml } from './menu-view.js';
import { section } from '../widgets/section.js';
import { currentTrial } from '../viewmodels/study-flow.js';
import { renderTrialChart } from '../widgets/trial-chart.js';
import { PRACTICE_TRIALS, currentBlockTrials, lastWeekChangePercent } from '../models/trial-generator.js';
import { CHOICE_LABELS } from '../constants/ui-constants.js';

function trialProgressHtml() {
  var trialState = state.trial;
  if (trialState.mode === 'practice')
    return (
      '<div class="muted small-text" style="margin:2px 0 8px;font-weight:600">Alıştırma ' +
      (trialState.i + 1) +
      ' / ' +
      PRACTICE_TRIALS.length +
      '</div>'
    );
  return (
    '<div class="steps" aria-label="Karar ' +
    (state.trialIndex + 1) +
    ' / ' +
    currentBlockTrials().length +
    '" style="gap:3px">' +
    currentBlockTrials()
      .map(function (_, index) {
        return '<i class="' + (index <= state.trialIndex ? 'is-active' : '') + '"></i>';
      })
      .join('') +
    '</div>'
  );
}

function chooseHtml(trial) {
  var price = trial.path[trial.path.length - 1],
    innerLastWeekChangePercent = lastWeekChangePercent(trial),
    cost = CONFIG.stake / (1 + trial.pl),
    diff = CONFIG.stake - cost;
  var html = '<div style="padding-top:4px">' + trialProgressHtml();
  html +=
    '<div class="card-section" id="tour-chart"><div class="card-body" style="padding-top:14px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><div style="font:700 21px var(--fd)">' +
    escapeHtml(trial.sym) +
    '</div><div class="muted small-text">' +
    escapeHtml(trial.sector) +
    '</div></div><div style="text-align:right"><div class="tabular-number" style="font:700 21px var(--fd)">₺' +
    formatNumber(price) +
    '</div><span class="direction-badge ' +
    directionClass(innerLastWeekChangePercent) +
    '">' +
    formatPercentChange(innerLastWeekChangePercent) +
    ' bu hafta</span></div></div><div style="margin-top:10px">' +
    renderTrialChart(trial) +
    '</div></div></div>';
  html +=
    '<div id="tour-position">' +
    section(
      'Elindeki hisse',
      '<div class="key-value"><span>Şu anki değeri</span><b>₺' +
        formatNumber(CONFIG.stake, 0) +
        '</b></div><div class="key-value"><span>' +
        termButtonHtml(4, 'Bu hisse için ödediğin') +
        '</span><b>₺' +
        formatNumber(cost, 0) +
        '</b></div><div class="key-value" style="align-items:center"><span>' +
        termButtonHtml(5, 'Kârın / zararın') +
        '</span><span class="direction-badge ' +
        directionClass(trial.pl) +
        '" style="margin:0">' +
        formatPercentChange(trial.pl * 100) +
        ' (' +
        (diff >= 0 ? '+' : '') +
        formatLira(diff) +
        ')</span></div>'
    ) +
    '</div>';
  if (trial.news)
    html +=
      '<div class="is-wrongsheet-titlee is-info" id="tour-news" style="color:var(--tx)"><span><b>Haber:</b> ' +
      escapeHtml(trial.news) +
      '</span></div>';
  if (trial.crowd != null)
    html +=
      '<div class="card-section" id="tour-crowd"><div class="card-body" style="padding-top:12px"><div class="key-value" style="padding-top:0"><span>Bugün bu hisseyle işlem yapanların</span><b>%' +
      trial.crowd +
      '\'i satıyor</b></div><div class="stack-bar" style="height:8px;margin:4px 0 0"><i style="width:' +
      trial.crowd +
      '%;background:var(--dn)"></i><i style="width:' +
      (100 - trial.crowd) +
      '%;background:var(--up)"></i></div></div></div>';
  // Üç seçenek aynı görünümde: hiçbiri "doğru" ya da "tehlikeli" gibi kodlanmaz
  html +=
    '<div class="question" style="margin-top:4px">Ne yapacaksın?</div><div class="choice-list" id="tour-choices">' +
    ['sat', 'tut', 'al']
      .map(function (item) {
        return (
          '<button class="choice" data-a="chooseDecision" data-v="' +
          item +
          '"><b>' +
          CHOICE_LABELS[item][0] +
          '</b><span>' +
          CHOICE_LABELS[item][1] +
          '</span></button>'
        );
      })
      .join('') +
    '</div>';
  return (
    html +
    '<p class="footnote" style="margin-top:14px">Sonuç bir hafta sonrası olarak hemen gösterilecek. Şirket adı gerçek; grafik, haber ve sonuç kurgusaldır.</p></div>'
  );
}

function cooldownHtml(trial) {
  return (
    '<div class="row-titlesheet-titleage" style="justify-content:flex-start;padding-top:28px;text-align:center"><h1 style="font-size:28px;margin-top:0">Bir dakika dur</h1><p>Zararına satmak üzeresin (' +
    formatPercentChange(trial.pl * 100) +
    '). Satış nedenin plan mı, haber mi, yoksa korku mu?</p><div class="countdown" id="cooldown-number">' +
    Math.max(0, state.trial.cdLeft) +
    '</div><button class="button is-primary" data-a="cdBack">Vazgeç, yeniden düşün</button><button class="button" id="cooldown-confirm" data-a="cdGo"' +
    (state.trial.cdLeft > 0 ? ' disabled' : '') +
    '>Satışı onayla</button></div>'
  );
}

function outcomeHtml(trial, decision) {
  var isUp = trial.out >= 0,
    lbl = { sat: 'Sattın', tut: 'Tuttun', al: 'Daha aldın' }[decision.final],
    html = '<b class="' + directionClass(trial.out) + '">' + formatPercentChange(trial.out * 100) + '</b>',
    reason =
      decision.final === 'sat'
        ? 'Sattığın için fiyat değişimi seni etkilemedi.'
        : decision.final === 'tut'
          ? '₺' + formatNumber(CONFIG.stake, 0) + ' × ' + html
          : '₺' + formatNumber(CONFIG.stake + CONFIG.addAmount, 0) + ' × ' + html;
  return (
    '<div class="row-titlesheet-titleage" style="justify-content:flex-start;padding-top:22px">' +
    trialProgressHtml() +
    '<p class="muted" style="margin:10px 0 0">Bir hafta sonra</p><div class="giant-number" style="color:var(--' +
    (isUp ? 'up' : 'dn') +
    ')"><span class="arrow" aria-hidden="true">' +
    (isUp ? '▲' : '▼') +
    '</span> ' +
    formatNumber(Math.abs(trial.out * 100)) +
    '%<span class="row-titler-onews-labely">' +
    (isUp ? ' yükseliş' : ' düşüş') +
    '</span></div><p style="margin-top:8px">' +
    escapeHtml(trial.sym) +
    ' bir haftada %' +
    formatNumber(Math.abs(trial.out * 100)) +
    ' ' +
    (isUp ? 'yükseldi' : 'düştü') +
    '.</p>' +
    section(
      lbl,
      '<div class="key-value"><span>Bu karardan sonucun</span><b class="' +
        directionClass(decision.res) +
        '">' +
        (decision.res >= 0 ? '+' : '') +
        formatLira(decision.res) +
        '</b></div><p class="muted small-text" style="margin:2px 0 0">' +
        reason +
        '</p>' +
        ''
    ) +
    '<button class="button is-primary" data-a="nextTrial">' +
    (state.trial.mode === 'practice'
      ? 'Devam'
      : state.trialIndex >= currentBlockTrials().length
        ? 'Bölümü bitir'
        : 'Sonraki karar') +
    '</button></div>'
  );
}

function stressHtml() {
  return (
    '<div class="row-titlesheet-titleage"><h1 style="font-size:26px">Kısa bir soru</h1><p>Şu an ne kadar gergin hissediyorsun?</p><div class="scale">' +
    [1, 2, 3, 4, 5]
      .map(function (item) {
        return '<button data-a="answerStress" data-v="' + item + '">' + item + '</button>';
      })
      .join('') +
    '</div><div class="scale-labels"><span>Hiç gergin değilim</span><span>Çok gerginim</span></div><button class="card-labelirow-subtitlecard-value" style="width:100%;margin-top:12px" data-a="answerStress" data-v="0">Cevaplamak istemiyorum</button></div>'
  );
}

// Anlama kontrolü: yanlışta açıklama gösterilir ve aynı soru tekrar sorulur
function quizHtml() {
  var comprehension = state.comprehension,
    question = comprehensionQuestionAt(comprehension.i),
    html =
      '<div class="row-titlesheet-titleage" style="justify-content:flex-start;padding-top:24px"><div class="muted small-text" style="font-weight:700">Kısa kontrol · ' +
      (comprehension.i + 1) +
      ' / ' +
      COMPREHENSION_POOLS.length +
      '</div><h1 style="font-size:24px;margin:10px 0 14px">' +
      escapeHtml(question.q) +
      '</h1>';
  html += question.o
    .map(function (item, index) {
      var scrollTop = comprehension.sel === index ? (index === question.a ? ' is-correct' : ' is-wrong') : '';
      return (
        '<button class="option' +
        scrollTop +
        '" data-a="answerQuiz" data-v="' +
        index +
        '"' +
        (comprehension.sel === question.a ? ' disabled' : '') +
        '>' +
        escapeHtml(item) +
        '</button>'
      );
    })
    .join('');
  if (comprehension.sel != null && comprehension.sel !== question.a)
    html += '<div class="is-error" role="alert">' + escapeHtml(question.e) + ' Tekrar dene.</div>';
  if (comprehension.sel === question.a)
    html +=
      '<div class="success-message" role="status">Doğru. ' +
      escapeHtml(question.e) +
      '</div><button class="button is-primary" style="margin-top:14px" data-a="nextQuiz">' +
      (comprehension.i + 1 < COMPREHENSION_POOLS.length ? 'Sonraki soru' : 'Devam') +
      '</button>';
  return html + '</div>';
}

export function renderTrial() {
  var trialState = state.trial,
    trial = currentTrial();
  if (trialState.phase === 'ready')
    return (
      '<div class="row-titlesheet-titleage"><div class="muted small-text" style="font-weight:700">1. bölüm</div><h1>Hazırsın</h1><p>Şimdi ' +
      currentBlockTrials().length +
      ' karar başlıyor. Bundan sonraki kararların kaydedilir.</p><div class="is-wrongsheet-titlee is-info"><span>Her karar ayrı bir hisseyle ilgilidir; bir öncekinin sonucu sonrakini etkilemez. Kendi bildiğin gibi karar ver.</span></div><button class="button is-primary" data-a="startMainStudy">Başla</button></div>'
    );
  if (trialState.phase === 'quiz') return quizHtml();
  if (trialState.phase === 'outcome')
    return outcomeHtml(
      (trialState.mode === 'practice' ? PRACTICE_TRIALS : currentBlockTrials()).filter(function (item) {
        return item.id === trialState.last.id;
      })[0],
      trialState.last
    );
  if (trialState.phase === 'cool') return cooldownHtml(trial);
  return chooseHtml(trial);
}

// ───────────────── Bölüm geçişleri ve gerginlik sorusu ─────────────────
export function renderStress() {
  return (
    '<div class="row-titlesheet-titleage"><h1 style="font-size:26px">Kısa bir soru</h1><p>Şu an ne kadar gergin hissediyorsun?</p><div class="scale">' +
    [1, 2, 3, 4, 5]
      .map(function (item) {
        return '<button data-a="answerStress" data-v="' + item + '">' + item + '</button>';
      })
      .join('') +
    '</div><div class="scale-labels"><span>Hiç gergin değilim</span><span>Çok gerginim</span></div><button class="card-labelirow-subtitlecard-value" style="width:100%;margin-top:12px" data-a="answerStress" data-v="0">Cevaplamak istemiyorum</button></div>'
  );
}
