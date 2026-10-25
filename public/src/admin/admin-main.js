// Yönetim uygulamasının giriş noktası: Firebase'e bağlanır, oturumu denetler, tıklama ve giriş olaylarını bağlar.
// Katılımcı uygulamasından (index.html) ayrıdır; ayrı adreste (admin/index.html) açılır.

import { adminActions } from './admin-actions.js';
import { dashboardAutoRefresh } from './admin-dashboard.js';
import { applyStoredTheme, render } from './admin-shell.js';
import { adminState } from './admin-state.js';
import { connectFirebase } from '../services/firebase-service.js';
import { isEmailUser, waitForRestoredUser } from '../services/auth-service.js';
import { byId } from '../utils/dom.js';

// Tıklama: data-a="eylemAdı" olan en yakın öğenin eylemini çalıştırır
document.addEventListener('click', function (event) {
  const target = event.target.closest('[data-a]');
  if (!target) return;
  const handler = adminActions[target.dataset.a];
  if (handler) {
    event.preventDefault();
    handler(target.dataset.v, target);
  }
});

// Yazı alanları: değerleri durumda saklar (yeniden çizimde silinmesin)
document.addEventListener('input', function (event) {
  const key = event.target.dataset && event.target.dataset.in;
  if (!key) return;
  const value = event.target.value;
  if (key === 'dashAuto') adminState.dashboardAutoRefresh = event.target.checked;
  else if (key === 'participantUrl') adminState.participantUrlInput = value;
  else if (key === 'landingUrl') adminState.landingUrlInput = value;
  else if (key === 'posterEmail') adminState.posterEmail = value;
  else if (key === 'posterFooter') adminState.posterFooter = value;
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && byId('modal').classList.contains('is-open')) adminActions.cancelModal();
});

setInterval(dashboardAutoRefresh, 30000);

applyStoredTheme();
render();

// Firebase'e bağlan; kayıtlı bir araştırmacı oturumu varsa doğrudan panele geç
(async function start() {
  try {
    await connectFirebase();
    const user = await waitForRestoredUser();
    adminState.user = isEmailUser(user) ? user : null;
  } catch (error) {
    adminState.connectionError = (error && error.message) || String(error);
  }
  render();
})();
