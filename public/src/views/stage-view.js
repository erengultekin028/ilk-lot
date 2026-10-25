// Ekran yönlendirici (aşamaya göre doğru görünümü seçer).

import { renderAdmin } from '../admin/admin-view.js';
import { CONFIG } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { renderBridge } from './bridge-view.js';
import { renderConsent } from './consent-view.js';
import { demoHintHtml, renderDemoEnd, renderDemoLanding } from './demo-view.js';
import { renderDemographics } from './demographics-view.js';
import { renderEnd } from './end-view.js';
import { escapeHtml, formatNumber } from '../utils/format.js';
import { renderFreePlayEnd, renderFreePlayMenu } from './free-play-view.js';
import { simulationMinutesText } from '../models/market-simulation.js';
import { maskCode, participantLinkFor } from '../utils/participant-code.js';
import { participantRepository } from '../repositories/participant-repository.js';
import { renderQrSvg } from '../widgets/qr-code.js';
import { renderSimulator } from './simulator-view.js';
import { ATTENTION_QUESTION, TEST_QUESTIONS, testQuestionSequence } from '../constants/test-questions.js';
import { TRIAL_SETS } from '../models/trial-generator.js';
import { renderStress, renderTrial } from './trial-view.js';

// ───────────────── Giriş, test, tanıtım ekranları ─────────────────
export function renderStage() {
  if (state.testQuestion) {
    const innerTestQuestionSequence = testQuestionSequence(state.testQuestion.kind);
    const innerItem = innerTestQuestionSequence[state.testQuestion.i];
    const quantity = innerItem === 'att' ? ATTENTION_QUESTION : TEST_QUESTIONS[innerItem];
    return (
      '<div class="row-titlesheet-titleage"><div class="dotour-skip">' +
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
    return '<div class="row-titlesheet-titleage"><p class="muted" style="text-align:center">Yükleniyor…</p></div>';
  if (state.stage === 'welcome') {
    const welcomeBack = state.welcomeBack;
    const next = welcomeBack.next;
    return (
      '<div class="row-titlesheet-titleage"><h1>Tekrar hoş geldin</h1><p>' +
      (next ? 'Kaldığın yerden devam edebilirsin.' : 'Çalışmayı tamamladın.') +
      '</p><p class="muted small-text">Kod: ' +
      maskCode(welcomeBack.code) +
      '</p><div class="stage-actions"><button class="button is-primary" data-a="continueFromWelcome"' +
      (state.busy ? ' disabled' : '') +
      '>' +
      (state.busy ? 'Açılıyor…' : next ? 'Devam et' : 'Sonuçlarıma git') +
      '</button><button class="card-labelirow-subtitlecard-value" style="width:100%;margin-top:6px" data-a="rejectRememberedCode">Ben değilim, başka kodla gir</button></div></div>'
    );
  }
  if (state.stage === 'wait')
    return (
      '<div class="row-titlesheet-titleage"><h1>Biraz erken geldin</h1><p>Oturum ' +
      escapeHtml(state.waitSession) +
      ', <b style="color:var(--tx)">' +
      new Date(state.waitUntil).toLocaleString('tr-TR', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }) +
      '</b> itibarıyla açılacak.</p><p class="muted small-text">Oturumlar arasında en az ' +
      CONFIG.minGapHours +
      ' saat olmalı. Bu pencereyi kapatabilirsin; aynı linkle tekrar gel.</p><button class="card-labelirow-subtitlecard-value" style="width:100%;margin-top:10px" data-a="rejectRememberedCode">Ben değilim, başka kodla gir</button></div>'
    );
  if (state.stage === 'consent') return renderConsent();
  if (state.stage === 'code')
    return (
      '<div class="row-titlesheet-titleage"><h1>Katılım kodun</h1><p>Kartındaki QR kodu okutursan bu ekranı görmezsin. Okutamıyorsan kartındaki 12 karakterli kodu yaz.</p><input id="code-input" class="fiecard-labeld" maxlength="14" inputmode="text" style="height:56px;font:700 21px ui-monospace,Menlo,Consolas,monospace;text-align:center;letter-spacing:1px;text-transform:uppercase" placeholder="KM7D-P2XR-9TQA" aria-label="Katılımcı kodu" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' +
      escapeHtml(state.codeInput || '') +
      '" data-in="code">' +
      (state.codeError
        ? '<div class="is-error" role="alert" id="code-error">' + escapeHtml(state.codeError) + '</div>'
        : '') +
      '<div class="stage-actions"><button class="button is-primary" data-a="submitCode"' +
      (state.busy ? ' disabled' : '') +
      '>' +
      (state.busy ? 'Kontrol ediliyor…' : 'Devam') +
      '</button></div><p class="muted small-text" style="margin-top:14px">Adını ya da e-postanı istemiyoruz; verilerin sadece bu kodla eşleşir. Bu cihaz seni hatırlar, sonraki oturumlarda kod sorulmaz.</p>' +
      demoHintHtml() +
      '</div>'
    );
  if (state.stage === 'withdrawn')
    return (
      '<div class="row-titlesheet-titleage"><h1>Çalışmadan çekildin</h1><p>' +
      (participantRepository.mode() === 'local'
        ? 'Bu çalışmaya ait verilerin bu cihazdan silindi.'
        : 'Verilerin analize dahil edilmeyecek ve araştırmacı tarafından kalıcı olarak silinecek.') +
      '</p><p>Katıldığın için teşekkürler. Sorun olursa: ' +
      escapeHtml(CONFIG.contact) +
      '</p><p class="muted small-text">Bu pencereyi kapatabilirsin.</p></div>'
    );
  if (state.stage === 'demo') return renderDemographics();
  if (state.stage === 'moved')
    return (
      '<div class="row-titlesheet-titleage" style="text-align:center"><h1 style="margin-top:0">Telefonunla okut</h1><p>Oturumun kaydedildi. Telefonunun kamerasıyla bu kodu okut, kaldığın yerden devam edeceksin.</p><div style="background:#fff;border-radius:22px;padding:14px;align-self:center;margin:8px 0 14px;border:3px solid var(--ac)">' +
      renderQrSvg(participantLinkFor(state.movedCode), 220) +
      '</div><p class="muted small-text">Okutamazsan telefonda bu kodu yaz:</p><p style="font:700 20px ui-monospace,Menlo,Consolas,monospace;letter-spacing:1px;color:var(--tx);margin:0 0 14px">' +
      escapeHtml(state.movedCode) +
      '</p><p class="muted small-text">Bu cihazda oturum kapatıldı ve kodun bu cihazdan silindi.</p><button class="card-labelirow-subtitlecard-value" style="width:100%" data-a="cancelMoveDevice">Vazgeç, bu cihazda devam et</button></div>'
    );
  if (state.stage === 'inelig')
    return '<div class="row-titlesheet-titleage"><h1>Katılım koşulu</h1><p>Bu çalışma 18 yaş ve üzeri katılımcılarla yürütülüyor. İlgin için teşekkürler.</p><p class="muted small-text">Bu koda ait bir veri saklanmadı. Bu pencereyi kapatabilirsin.</p></div>';
  if (state.stage === 'pre')
    return (
      '<div class="row-titlesheet-titleage"><h1>Önce birkaç finans sorusu</h1><p>' +
      testQuestionSequence('pre').length +
      ' kısa soru, yaklaşık 2 dakika. Bu bir sınav değil; bilmiyorsan "Bilmiyorum"u seçebilirsin.</p><div class="stage-actions"><button class="button is-primary" data-a="startTest" data-v="pre">Teste başla</button></div></div>'
    );
  if (state.stage === 'demoland') return renderDemoLanding();
  if (state.stage === 'demoend') return renderDemoEnd();
  if (state.stage === 'end') return renderEnd();
  if (state.stage === 'freemenu') return renderFreePlayMenu();
  if (state.stage === 'freeend') return renderFreePlayEnd();
  if (state.stage === 'task') return renderTrial();
  if (state.stage === 'sim') return renderSimulator();
  if (state.stage === 'bridge') return renderBridge();
  if (state.stage === 'stress') return renderStress();
  if (state.stage === 'admin') return renderAdmin();
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
    '<div class="row-titlesheet-titleage">' +
    innerIndex[0] +
    '<h1>' +
    innerIndex[1] +
    '</h1><p>' +
    innerIndex[2] +
    '</p><div class="dotour-skip" style="margin:8px 0 6px">' +
    [0, 1, 2]
      .map(function (item) {
        return '<i class="' + (item === state.introStep ? 'is-active' : '') + '"></i>';
      })
      .join('') +
    '</div><div class="stage-actions"><button class="button is-primary" data-a="nextIntroStep">' +
    (state.introStep < 2 ? 'Devam' : 'Alıştırmaya geç') +
    '</button>' +
    (state.introStep < 2
      ? '<button class="card-labelirow-subtitlecard-value" style="width:100%" data-a="finishIntro">Tanıtımı geç</button>'
      : '') +
    '</div></div>'
  );
}
