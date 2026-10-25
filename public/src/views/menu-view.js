// Menü, sözlük, yardım ve yazı boyutu görünümleri.

import { state } from '../viewmodels/app-state.js';
import { consentField } from './consent-view.js';
import { GLOSSARY } from '../constants/glossary.js';
import { maskCode } from '../utils/participant-code.js';
import { FONT_SIZE_LEVELS } from '../constants/ui-constants.js';

// Terim düğmesi: dokununca GLOSSARY[i] tek maddelik pencerede açılır. Başka bir düğmenin (ör. .srow) içine konmaz: iç içe düğme geçersiz.
export function termButtonHtml(termIndex, label) {
  return (
    '<button class="term-button" data-a="openTerm" data-v="' +
    termIndex +
    '" aria-haspopup="dialog">' +
    label +
    '</button>'
  );
}
export function termHtml(index) {
  const group = GLOSSARY[index];
  return (
    '<h2>' +
    group[0] +
    '</h2><p>' +
    group[1] +
    '</p><button class="button is-primary" data-a="cancelModal">Anladım</button><button class="button" data-a="openHelp">Tüm sözlük</button>'
  );
}
export function helpHtml() {
  return (
    '<h2>Sözlük</h2><dl class="glossary-list" style="margin:0 0 14px;max-height:55vh;overflow:auto">' +
    GLOSSARY.map(function (item) {
      return '<dt>' + item[0] + '</dt><dd>' + item[1] + '</dd>';
    }).join('') +
    '</dl><button class="button is-primary" data-a="cancelModal">Anladım</button>'
  );
}
function fontSizeLevel() {
  const value = document.documentElement.getAttribute('data-fs');
  return value === '1' || value === '2' ? +value : 0;
}
export function fontSizeHtml() {
  const level = fontSizeLevel();
  return (
    '<div class="font-size-selector" role="group" aria-labelledby="font-size-label"><span class="selector-label" id="font-size-label">Yazı boyutu</span>' +
    FONT_SIZE_LEVELS.map(function (item, index) {
      return (
        '<button class="chip' +
        (index === level ? ' is-active' : '') +
        '" aria-pressed="' +
        (index === level) +
        '" aria-label="' +
        item[1] +
        '" data-a="setFontSize" data-v="' +
        index +
        '">' +
        item[0] +
        '</button>'
      );
    }).join('') +
    '</div>'
  );
}
export function menuHtml() {
  return (
    '<h2>Menü</h2><p>Katılımcı kodun: ' +
    (state.participantCode ? maskCode(state.participantCode) : '-') +
    '</p><p class="muted small-text" style="margin:0 0 10px">Sorular ve destek: ' +
    consentField('contact') +
    '</p>' +
    fontSizeHtml() +
    '<p class="muted small-text" style="margin:0 0 10px">Ana ekrana eklemek için tarayıcının paylaş ya da menü düğmesinden "Ana ekrana ekle"yi seç. Eklenen kısayol açılınca katılımcı kodunu yeniden girmen gerekebilir; oturum kaldığın yerden devam eder.</p>' +
    (state.participantCode && !state.ended
      ? '<button class="button" data-a="moveDevice">Başka cihazda devam et</button>'
      : '') +
    (state.participantCode
      ? '<button class="button ghost-danger" data-a="requestWithdraw">Çalışmadan çekil, verilerimi sil</button>'
      : '') +
    '<button class="button" data-a="cancelModal">Kapat</button>'
  );
}
