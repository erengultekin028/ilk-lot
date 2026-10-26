// Ekran yönlendirici (aşamaya göre doğru görünümü seçer).

import { CONFIG } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { renderBridge } from './bridge-view.js';
import { renderConsent } from './consent-view.js';

import { renderDemographics } from './demographics-view.js';
import { renderEnd } from './end-view.js';
import { escapeHtml, formatNumber } from '../utils/format.js';
import { renderFreePlayEnd, renderFreePlayMenu } from './free-play-view.js';
import { simulationMinutesText } from '../models/market-simulation.js';

import { renderSimulator } from './simulator-view.js';
import { ATTENTION_QUESTION, TEST_QUESTIONS, testQuestionSequence } from '../constants/test-questions.js';
import { TRIAL_SETS } from '../models/trial-generator.js';
import { ALLOW_FRESH_START_AFTER_WITHDRAWAL } from '../constants/ui-constants.js';
import { renderStress, renderTrial } from './trial-view.js';

// ───────────────── Giriş, test, tanıtım ekranları ─────────────────
export function renderStage() {
  if (state.testQuestion) {
    const innerTestQuestionSequence = testQuestionSequence(state.testQuestion.kind);
    const innerItem = innerTestQuestionSequence[state.testQuestion.i];
    const quantity = innerItem === 'att' ? ATTENTION_QUESTION : TEST_QUESTIONS[innerItem];
    return (
      '<div class="stage"><div class="dots">' +
      innerTestQuestionSequence
        .map(function (_, index) {
          return '<i class="' + (index <= state.testQuestion.i ? 'is-active' : '') + '"></i>';
        })
        .join('') +
      '</div><p class="small-text" style="margin:16px 0 0">' +
      (state.testQuestion.kind === 'pre' ? 'Ön test' : 'Son test') +
      ', soru ' +
      (state.testQuestion.i + 1) +
      '/' +
      innerTestQuestionSequence.length +
      '</p><h1 style="font-size:26px">' +
      quantity[0] +
      '</h1>' +
      quantity[1]
        .map(function (item, index) {
          return '<button class="option" data-a="answerTest" data-v="' + index + '">' + item + '</button>';
        })
        .join('') +
      '</div>'
    );
  }
  if (state.stage === 'boot')
    return '<div class="stage"><p class="muted" style="text-align:center">Yükleniyor…</p></div>';
  if (state.stage === 'welcome') {
    const welcomeBack = state.welcomeBack;
    const next = welcomeBack.next;
    return (
      '<div class="stage"><h1>Tekrar hoş geldin</h1><p>' +
      (next ? 'Kaldığın yerden devam edebilirsin.' : 'Çalışmayı tamamladın.') +
      '</p><div class="stage-actions"><button class="button is-primary" data-a="continueFromWelcome"' +
      (state.busy ? ' disabled' : '') +
      '>' +
      (state.busy ? 'Açılıyor…' : next ? 'Devam et' : 'Sonuçlarıma git') +
      '</button></div></div>'
    );
  }
  if (state.stage === 'wait')
    return (
      '<div class="stage"><h1>Biraz erken geldin</h1><p>Oturum ' +
      escapeHtml(state.waitSession) +
      ', <b style="color:var(--tx)">' +
      new Date(state.waitUntil).toLocaleString('tr-TR', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }) +
      '</b> itibarıyla açılacak.</p><p class="muted small-text">Oturumlar arasında en az ' +
      CONFIG.minGapHours +
      ' saat olmalı. Bu pencereyi kapatabilirsin; aynı linkle tekrar gel.</p></div>'
    );
  if (state.stage === 'consent') return renderConsent();
  if (state.stage === 'connection-error')
    return (
      '<div class="stage"><h1>Bağlantı kurulamadı</h1><p>İnternet bağlantını kontrol edip tekrar dene. Sorun sürerse: ' +
      escapeHtml(CONFIG.contact) +
      '</p><p class="muted small-text">' +
      escapeHtml(state.connectionError || '') +
      '</p><div class="stage-actions"><button class="button is-primary" data-a="retryConnection">Tekrar dene</button></div></div>'
    );
  if (state.stage === 'withdrawn')
    return (
      '<div class="stage"><h1>Çalışmadan çekildin</h1><p>' +
      'Verilerin analize dahil edilmeyecek ve araştırmacı tarafından kalıcı olarak silinecek.' +
      '</p><p>Katıldığın için teşekkürler. Sorun olursa: ' +
      escapeHtml(CONFIG.contact) +
      '</p><p class="muted small-text">Bu pencereyi kapatabilirsin.</p>' +
      (ALLOW_FRESH_START_AFTER_WITHDRAWAL && !state.withdrawnIneligible
        ? '<p style="margin-top:18px"><b>Baştan başlamak ister misin?</b></p><p class="muted small-text">Yeni bir katılım başlatırsan onam adımından itibaren baştan geçersin. Önceki katılımın çekilmiş kalır ve analize girmez; yeni katılım ayrı bir kayıttır.</p><div class="stage-actions"><button class="button" data-a="requestFreshStart">Yeni katılım başlat</button></div>'
        : '') +
      '</div>'
    );
  if (state.stage === 'demo') return renderDemographics();
  if (state.stage === 'inelig')
    return '<div class="stage"><h1>Katılım koşulu</h1><p>Bu çalışma 18 yaş ve üzeri katılımcılarla yürütülüyor. İlgin için teşekkürler.</p><p class="muted small-text">Bu koda ait bir veri saklanmadı. Bu pencereyi kapatabilirsin.</p></div>';
  if (state.stage === 'pre')
    return (
      '<div class="stage"><h1>Önce birkaç finans sorusu</h1><p>' +
      testQuestionSequence('pre').length +
      ' kısa soru, yaklaşık 2 dakika. Bu bir sınav değil; bilmiyorsan "Bilmiyorum"u seçebilirsin.</p><div class="stage-actions"><button class="button is-primary" data-a="startTest" data-v="pre">Teste başla</button></div></div>'
    );
  if (state.stage === 'end') return renderEnd();
  if (state.stage === 'freemenu') return renderFreePlayMenu();
  if (state.stage === 'freeend') return renderFreePlayEnd();
  if (state.stage === 'task') return renderTrial();
  if (state.stage === 'sim') return renderSimulator();
  if (state.stage === 'bridge') return renderBridge();
  if (state.stage === 'stress') return renderStress();
  // Tanıtım: görevin ne olduğunu üç adımda anlatır. Hipotez ve bekleme süresi burada AÇIKLANMAZ
  const innerIndex = [
    [
      '<div class="giant-number">3</div>',
      'Üç bölüm, yaklaşık 30 dakika',
      '1. bölümde ' +
        TRIAL_SETS.X.length +
        ' kısa karar, 2. bölümde ' +
        simulationMinutesText() +
        ' dakikalık bir piyasa simülatörü, 3. bölümde ' +
        TRIAL_SETS.Y.length +
        ' kısa karar daha.',
    ],
    [
      '<div class="chip-list"><span class="chip is-active">Sat</span><span class="chip">Tut</span><span class="chip">Daha al</span></div>',
      'Sat, tut ya da daha al',
      'Her kararda elinde ₺' +
        formatNumber(CONFIG.stake, 0) +
        ' değerinde bir hisse var. Kararının sonucu bir hafta sonrası olarak hemen gösterilir. Doğru ya da yanlış cevap yok.',
    ],
    [
      '<svg width="120" height="64" viewBox="0 0 120 64" aria-hidden="true"><rect x="4" y="34" width="22" height="26" rx="5" fill="var(--sf2)"/><rect x="36" y="18" width="22" height="42" rx="5" fill="var(--ac)"/><rect x="68" y="8" width="22" height="52" rx="5" fill="var(--up)"/><rect x="100" y="28" width="16" height="32" rx="5" fill="var(--sf2)"/></svg>',
      'Önce iki deneme',
      'Gerçek kararlardan önce iki alıştırma yapacağız.',
    ],
  ][state.introStep];
  return (
    '<div class="stage">' +
    innerIndex[0] +
    '<h1>' +
    innerIndex[1] +
    '</h1><p>' +
    innerIndex[2] +
    '</p><div class="dots" style="margin:8px 0 6px">' +
    [0, 1, 2]
      .map(function (item) {
        return '<i class="' + (item === state.introStep ? 'is-active' : '') + '"></i>';
      })
      .join('') +
    '</div><div class="stage-actions"><button class="button is-primary" data-a="nextIntroStep">' +
    (state.introStep < 2 ? 'Devam' : 'Alıştırmaya geç') +
    '</button>' +
    (state.introStep < 2
      ? '<button class="link" style="width:100%" data-a="finishIntro">Tanıtımı geç</button>'
      : '') +
    '</div></div>'
  );
}
