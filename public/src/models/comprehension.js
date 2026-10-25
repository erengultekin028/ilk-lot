// Anlama kontrolü soru seçimi.

import { state } from '../viewmodels/app-state.js';
import { COMPREHENSION_POOLS } from '../constants/comprehension-questions.js';

// Her havuzdan bir soru; aynı tarayıcıda bir önceki oturumda gösterilen soru art arda gelmez (depolama kapalıysa saf rastgele)
export function newComprehensionSelection() {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem('ilklot_comp_son') || '[]');
  } catch (error) {}
  const handler = COMPREHENSION_POOLS.map(function (item, index) {
    let key;
    do {
      key = Math.floor(Math.random() * item.length);
    } while (item.length > 1 && key === items[index]);
    return key;
  });
  try {
    localStorage.setItem('ilklot_comp_son', JSON.stringify(handler));
  } catch (error) {}
  return handler;
}

export function comprehensionQuestionAt(index) {
  const handler = (state.comprehension && state.comprehension.f) || [];
  return COMPREHENSION_POOLS[index][handler[index] || 0];
}
