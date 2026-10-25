// Form (demografi) ekranı.

import { state } from '../viewmodels/app-state.js';
import { DEMOGRAPHIC_OPTIONS } from '../constants/ui-constants.js';

export function renderDemographics() {
  var demographics = state.demographics,
    question = function (key, value, note) {
      return (
        '<div class="question-spaced">' +
        value +
        (note ? ' <span class="muted small-text" style="font-weight:400">' + note + '</span>' : '') +
        '</div><div class="chip-list">' +
        DEMOGRAPHIC_OPTIONS[key]
          .map(function (item, index) {
            var isOn = key === 'inv' ? demographics.inv.indexOf(item) >= 0 : demographics[key] === item;
            return (
              '<button class="chip' +
              (isOn ? ' is-active' : '') +
              '" data-a="setDemographic" data-v="' +
              key +
              '|' +
              index +
              '"' +
              (isOn ? ' aria-pressed="true"' : '') +
              '>' +
              item +
              '</button>'
            );
          })
          .join('') +
        '</div>'
      );
    };
  return (
    '<div style="padding:8px 2px 20px"><h1 style="font:750 28px/1.1 var(--fd);letter-spacing:-.7px;margin:4px 0 8px">Seni biraz tanıyalım</h1><p class="muted" style="margin:0">Adını ya da kimliğini belirleyecek bir şey sormuyoruz. İlk soru dışındakiler isteğe bağlı.</p>' +
    question('adult', '18 yaşını doldurdun mu?') +
    (demographics.adult === 'Hayır'
      ? '<div class="is-wrongsheet-titlee" style="margin:12px 0 0"><span>Bu çalışma 18 yaş ve üzeri katılımcılarla yürütülüyor.</span></div>'
      : '') +
    (demographics.adult === 'Hayır'
      ? ''
      : question('age', 'Yaş aralığın') +
        question('gender', 'Cinsiyetin') +
        question('field', 'Bölümünün alanı') +
        question('year', 'Sınıfın') +
        question('inv', 'Daha önce gerçek parayla yatırım yaptın mı?', '(birden fazla seçebilirsin)') +
        question('sim', 'Daha önce borsa simülasyonu ya da oyunu kullandın mı?')) +
    '<button class="button is-primary" style="margin-top:22px" data-a="finishDemographics"' +
    (demographics.adult ? '' : ' disabled') +
    '>' +
    (demographics.adult === 'Hayır' ? 'Çık' : 'Devam') +
    '</button></div>'
  );
}
