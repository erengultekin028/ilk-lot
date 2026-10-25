// Pencere (modal) açma/kapama ve onay penceresi.

import { state } from '../viewmodels/app-state.js';
import { byId } from '../utils/dom.js';
import { escapeHtml } from '../utils/format.js';

// ═════════════════ SİMÜLATÖR AKIŞI ═════════════════
export function isModalOpen() {
  return byId('modal').classList.contains('is-open');
}

// ═════════════════ MODAL ═════════════════
// Odak yönetimi: pencere açılınca odak pencerenin kutusuna (klavye ve ekran okuyucu için), kapanınca eski yerine döner.
// Kutuya odaklanılır, ilk düğmeye değil: alan içeren pencerelerde mobil klavye kendiliğinden açılmasın.
export function openModal(html) {
  var modalElement = byId('modal'),
    modalBoxElement = byId('modal-box');
  if (!modalElement.classList.contains('is-open')) {
    var activeElement = document.activeElement;
    state.focusReturnElement = activeElement && activeElement !== document.body ? activeElement : null;
  }
  modalBoxElement.innerHTML = html;
  modalElement.classList.add('is-open');
  var element = modalBoxElement.querySelector('h2');
  if (element) {
    element.id = 'modal-title';
    modalElement.setAttribute('aria-labelledby', 'modal-title');
  }
  modalBoxElement.setAttribute('tabindex', '-1');
  try {
    modalBoxElement.focus({ preventScroll: true });
  } catch (error) {}
}

export function closeModal() {
  byId('modal').classList.remove('is-open');
  byId('modal-box').innerHTML = '';
  var focusReturnElement = state.focusReturnElement;
  state.focusReturnElement = null;
  if (focusReturnElement && document.contains(focusReturnElement) && focusReturnElement.focus) {
    try {
      focusReturnElement.focus({ preventScroll: true });
    } catch (error) {}
  }
}

// Tarayıcının confirm() kutusu çerçeve içinde engellenebildiği için kendi onay penceremiz
export function askConfirm(title, text, okLabel, danger, onConfirm) {
  state.confirmCallback = onConfirm;
  openModal(
    '<h2>' +
      escapeHtml(title) +
      '</h2><p>' +
      escapeHtml(text) +
      '</p><button class="button ' +
      (danger ? 'is-danger' : 'is-primary') +
      '" data-a="confirmModal">' +
      escapeHtml(okLabel) +
      '</button><button class="button" data-a="cancelModal">Vazgeç</button>'
  );
}
