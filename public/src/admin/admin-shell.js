// Yönetim uygulamasının kabuğu: ekranı çizer ve tema tercihini uygular.

import { adminState } from './admin-state.js';
import { renderAdminPage } from './admin-view.js';
import { byId } from '../utils/dom.js';

// Oturum durumuna göre giriş formunu ya da paneli çizer. Yazılan alanlar silinmesin diye kaydırma konumu korunur.
export function render() {
  const view = byId('main-view');
  const scrollTop = view.scrollTop;
  view.innerHTML = renderAdminPage();
  view.scrollTop = scrollTop;
}

// Tema: kayıtlı tercih > cihazın teması (katılımcı uygulamasıyla aynı anahtar)
export function applyStoredTheme() {
  let theme = null;
  try {
    theme = localStorage.getItem('ilklot:theme');
  } catch (error) {}
  if (theme !== 'light' && theme !== 'dark')
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : null;
  if (theme) document.documentElement.setAttribute('data-theme', theme);
}

export function isSignedIn() {
  return !!adminState.user;
}
