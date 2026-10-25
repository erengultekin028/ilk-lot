// Kısa süreli bildirim kutusu.

import { byId } from '../utils/dom.js';

// ═════════════════ BİLDİRİM ═════════════════
let toastTimer;

export function showToast(message) {
  const toastElement = byId('toast');
  toastElement.textContent = message;
  toastElement.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastElement.classList.remove('is-visible');
  }, 3200);
}
